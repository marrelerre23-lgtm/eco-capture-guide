import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PREMIUM_PRODUCT_ID = "prod_TPRgg3t0CSojiZ";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    console.log("[CHECK-SUBSCRIPTION] Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    
    console.log("[CHECK-SUBSCRIPTION] User authenticated:", user.email);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2025-08-27.basil" 
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      console.log("[CHECK-SUBSCRIPTION] No Stripe customer found");
      
      // Update user to free tier
      await supabaseClient
        .from('profiles')
        .update({ 
          subscription_tier: 'free',
          max_analyses_per_day: 15,
          max_captures: 100,
          subscription_expires_at: null
        })
        .eq('user_id', user.id);

      return new Response(JSON.stringify({ 
        subscribed: false,
        tier: 'free'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    console.log("[CHECK-SUBSCRIPTION] Stripe customer found:", customerId);

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let tier = 'free';
    let subscriptionEnd = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      const productId = subscription.items.data[0].price.product as string;
      
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      tier = productId === PREMIUM_PRODUCT_ID ? 'premium' : 'free';
      
      console.log("[CHECK-SUBSCRIPTION] Active subscription found:", {
        subscriptionId: subscription.id,
        tier,
        endDate: subscriptionEnd
      });

      // Update user to premium tier
      await supabaseClient
        .from('profiles')
        .update({ 
          subscription_tier: tier,
          max_analyses_per_day: null, // unlimited
          max_captures: null, // unlimited
          subscription_expires_at: subscriptionEnd
        })
        .eq('user_id', user.id);
    } else {
      console.log("[CHECK-SUBSCRIPTION] No active subscription");
      
      // Update user to free tier
      await supabaseClient
        .from('profiles')
        .update({ 
          subscription_tier: 'free',
          max_analyses_per_day: 15,
          max_captures: 100,
          subscription_expires_at: null
        })
        .eq('user_id', user.id);
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      tier,
      subscription_end: subscriptionEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[CHECK-SUBSCRIPTION] ERROR:", error);
    
    // Return generic error message to client, log details server-side
    return new Response(JSON.stringify({ 
      error: "Ett tekniskt fel uppstod vid kontroll av prenumeration. Försök igen senare." 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
