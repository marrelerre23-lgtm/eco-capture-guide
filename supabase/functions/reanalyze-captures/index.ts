import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('[Reanalyze] Edge function invoked');
  console.log('[Reanalyze] Request method:', req.method);

  if (req.method === 'OPTIONS') {
    console.log('[Reanalyze] Handling CORS preflight');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[Reanalyze] Creating Supabase admin client...');
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    console.log('[Reanalyze] Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.error('[Reanalyze] No authorization header');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('[Reanalyze] Validating user token...');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      console.error('[Reanalyze] Invalid token:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Reanalyze] User authenticated: ${user.id}`);
    console.log(`[Reanalyze] Starting re-analysis for user ${user.id}`);

    // Get all captures for this user that are missing age_stage
    console.log('[Reanalyze] Fetching captures with missing data...');
    const { data: captures, error: capturesError } = await supabaseAdmin
      .from('species_captures')
      .select('id, image_url, ai_analysis, age_stage')
      .eq('user_id', user.id)
      .or('age_stage.is.null,age_stage.eq.okänd');

    if (capturesError) {
      console.error('[Reanalyze] Error fetching captures:', capturesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch captures' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!captures || captures.length === 0) {
      console.log('[Reanalyze] No captures need re-analysis');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Alla fångster har redan fullständig information',
          updated: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Reanalyze] Found ${captures.length} captures to re-analyze`);

    let updated = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const capture of captures) {
      try {
        console.log(`[Reanalyze] Processing capture ${capture.id}...`);
        
        const analyzeResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/analyze-species`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ imageUrl: capture.image_url })
          }
        );

        if (!analyzeResponse.ok) {
          const errorText = await analyzeResponse.text();
          console.error(`[Reanalyze] Failed to analyze capture ${capture.id}:`, errorText);
          errors.push(`${capture.id}: ${errorText}`);
          failed++;
          continue;
        }

        const analysisData = await analyzeResponse.json();
        console.log(`[Reanalyze] Analysis result for ${capture.id}:`, JSON.stringify(analysisData, null, 2));
        
        const species = analysisData?.alternatives?.[0]?.species;
        if (!species) {
          console.error(`[Reanalyze] No species data in analysis for ${capture.id}`);
          failed++;
          continue;
        }

        const ageStage = species.ageStage || 'okänd';

        console.log(`[Reanalyze] Updating ${capture.id} with ageStage: ${ageStage}`);

        const { error: updateError } = await supabaseAdmin
          .from('species_captures')
          .update({
            ai_analysis: analysisData,
            age_stage: ageStage,
            updated_at: new Date().toISOString()
          })
          .eq('id', capture.id);

        if (updateError) {
          console.error(`[Reanalyze] Failed to update capture ${capture.id}:`, updateError);
          errors.push(`${capture.id}: ${updateError.message}`);
          failed++;
        } else {
          updated++;
          console.log(`[Reanalyze] Successfully updated capture ${capture.id}`);
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (err) {
        console.error(`[Reanalyze] Error processing capture ${capture.id}:`, err);
        errors.push(`${capture.id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        failed++;
      }
    }

    console.log(`[Reanalyze] Re-analysis complete: ${updated} updated, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: failed > 0 
          ? `${updated} fångster uppdaterade, ${failed} misslyckades`
          : `${updated} fångster uppdaterade`,
        updated,
        failed,
        total: captures.length,
        errors: errors.slice(0, 5)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Reanalyze] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
