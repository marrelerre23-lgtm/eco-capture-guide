import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all captures for this user that are missing edibility data
    const { data: captures, error: capturesError } = await supabase
      .from('species_captures')
      .select('id, image_url, ai_analysis')
      .eq('user_id', user.id)
      .or('edibility.is.null,age_stage.is.null');

    if (capturesError) {
      console.error('Error fetching captures:', capturesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch captures' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!captures || captures.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Alla fångster har redan fullständig information',
          updated: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${captures.length} captures to re-analyze for user ${user.id}`);

    let updated = 0;
    let failed = 0;

    // Re-analyze each capture
    for (const capture of captures) {
      try {
        // Call the analyze-species function to get fresh AI analysis
        const analyzeResponse = await supabase.functions.invoke('analyze-species', {
          body: { imageUrl: capture.image_url }
        });

        if (analyzeResponse.error) {
          console.error(`Failed to analyze capture ${capture.id}:`, analyzeResponse.error);
          failed++;
          continue;
        }

        const analysisData = analyzeResponse.data;
        
        // Extract edibility and age_stage from the AI response
        const species = analysisData?.species;
        const edibility = species?.edibility || 'okänd';
        const ageStage = species?.ageStage || species?.age_stage || null;

        // Update the capture with new data
        const { error: updateError } = await supabase
          .from('species_captures')
          .update({
            ai_analysis: analysisData,
            edibility: edibility,
            age_stage: ageStage,
            updated_at: new Date().toISOString()
          })
          .eq('id', capture.id);

        if (updateError) {
          console.error(`Failed to update capture ${capture.id}:`, updateError);
          failed++;
        } else {
          updated++;
          console.log(`Successfully updated capture ${capture.id} with edibility: ${edibility}`);
        }

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        console.error(`Error processing capture ${capture.id}:`, err);
        failed++;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `${updated} fångster uppdaterade, ${failed} misslyckades`,
        updated,
        failed,
        total: captures.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
