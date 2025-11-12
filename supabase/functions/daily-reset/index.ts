import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[DAILY-RESET] Function started at", new Date().toISOString());

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Reset analyses_today to 0 for all users
    const { data, error } = await supabaseClient
      .from('profiles')
      .update({ 
        analyses_today: 0,
        last_analysis_date: new Date().toISOString().split('T')[0] // Today's date
      })
      .neq('analyses_today', 0); // Only update users who have used analyses

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
