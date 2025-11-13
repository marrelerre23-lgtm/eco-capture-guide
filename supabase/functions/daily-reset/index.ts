import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Security check: Verify cron secret
    const cronSecret = req.headers.get("x-cron-secret");
    const expectedSecret = Deno.env.get("CRON_SECRET");
    
    if (!cronSecret || !expectedSecret || cronSecret !== expectedSecret) {
      console.error("[DAILY-RESET] Unauthorized access attempt");
      return new Response(JSON.stringify({ 
        success: false,
        error: "Unauthorized" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    console.log("[DAILY-RESET] Function started at", new Date().toISOString());

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Reset analyses_today AND rewarded_analyses_today to 0 for all users
    const { data, error } = await supabaseClient
      .from('profiles')
      .update({ 
        analyses_today: 0,
        rewarded_analyses_today: 0,
        last_analysis_date: new Date().toISOString().split('T')[0] // Today's date
      })
      .or('analyses_today.neq.0,rewarded_analyses_today.neq.0'); // Only update users who have used analyses or have rewards

    if (error) {
      console.error("[DAILY-RESET] Error resetting analyses:", error);
      throw error;
    }

    console.log("[DAILY-RESET] Successfully reset analyses_today for users");

    return new Response(JSON.stringify({ 
      success: true,
      message: "Daily analysis counters reset successfully",
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[DAILY-RESET] ERROR:", error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
