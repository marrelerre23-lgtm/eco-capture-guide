import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

console.log("[STRIPE-WEBHOOK] Function loaded");

serve(async (req) => {
  const signature = req.headers.get("Stripe-Signature");

  if (!signature) {
    console.error("[STRIPE-WEBHOOK] No signature header");
    return new Response(JSON.stringify({ error: "No signature" }), { status: 400 });
  }

  const body = await req.text();
  
  try {
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      console.error("[STRIPE-WEBHOOK] STRIPE_WEBHOOK_SECRET not configured");
      return new Response(JSON.stringify({ error: "Webhook secret not configured" }), { status: 500 });
    }

    const receivedEvent = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    );

    console.log(`[STRIPE-WEBHOOK] Event received: ${receivedEvent.type}`);

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    switch (receivedEvent.type) {
      case "checkout.session.completed": {
        const session = receivedEvent.data.object as Stripe.Checkout.Session;
        console.log("[STRIPE-WEBHOOK] Checkout completed:", session.id);

        if (session.mode === "subscription" && session.customer) {
          const customerId = typeof session.customer === 'string' 
            ? session.customer 
            : session.customer.id;

          // Get customer email
          const customer = await stripe.customers.retrieve(customerId);
          const customerEmail = 'email' in customer ? customer.email : null;

          if (!customerEmail) {
            console.error("[STRIPE-WEBHOOK] No email for customer:", customerId);
            break;
          }

          // Get subscription details
          const subscriptionId = typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id;

          if (subscriptionId) {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();

            // Update user profile
            const { error } = await supabaseClient
              .from('profiles')
              .update({
                subscription_tier: 'premium',
                max_analyses_per_day: null, // unlimited
                max_captures: null, // unlimited
                subscription_expires_at: subscriptionEnd,
              })
              .eq('user_id', session.metadata?.user_id);

            if (error) {
              console.error("[STRIPE-WEBHOOK] Error updating profile:", error);
            } else {
              console.log("[STRIPE-WEBHOOK] Profile updated to premium");
            }
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = receivedEvent.data.object as Stripe.Subscription;
        console.log("[STRIPE-WEBHOOK] Subscription updated:", subscription.id);

        const customerId = typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer.id;

        const customer = await stripe.customers.retrieve(customerId);
        const customerEmail = 'email' in customer ? customer.email : null;

        if (!customerEmail) {
          console.error("[STRIPE-WEBHOOK] No email for customer:", customerId);
          break;
        }

        const isActive = subscription.status === "active";
        const subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();

        // Find user by email and update
        const { data: profiles } = await supabaseClient
          .from('profiles')
          .select('user_id')
          .eq('user_id', subscription.metadata?.user_id)
          .limit(1);

        if (profiles && profiles.length > 0) {
          const { error } = await supabaseClient
            .from('profiles')
            .update({
              subscription_tier: isActive ? 'premium' : 'free',
              max_analyses_per_day: isActive ? null : 15,
              max_captures: isActive ? null : 100,
              subscription_expires_at: isActive ? subscriptionEnd : null,
            })
            .eq('user_id', profiles[0].user_id);

          if (error) {
            console.error("[STRIPE-WEBHOOK] Error updating profile:", error);
          } else {
            console.log("[STRIPE-WEBHOOK] Profile updated");
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = receivedEvent.data.object as Stripe.Subscription;
        console.log("[STRIPE-WEBHOOK] Subscription deleted:", subscription.id);

        const customerId = typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer.id;

        const customer = await stripe.customers.retrieve(customerId);
        const customerEmail = 'email' in customer ? customer.email : null;

        if (!customerEmail) {
          console.error("[STRIPE-WEBHOOK] No email for customer:", customerId);
          break;
        }

        // Find user by email and downgrade to free
        const { data: profiles } = await supabaseClient
          .from('profiles')
          .select('user_id')
          .eq('user_id', subscription.metadata?.user_id)
          .limit(1);

        if (profiles && profiles.length > 0) {
          const { error } = await supabaseClient
            .from('profiles')
            .update({
              subscription_tier: 'free',
              max_analyses_per_day: 15,
              max_captures: 100,
              subscription_expires_at: null,
            })
            .eq('user_id', profiles[0].user_id);

          if (error) {
            console.error("[STRIPE-WEBHOOK] Error updating profile:", error);
          } else {
            console.log("[STRIPE-WEBHOOK] Profile downgraded to free");
          }
        }
        break;
      }

      default:
        console.log(`[STRIPE-WEBHOOK] Unhandled event type: ${receivedEvent.type}`);
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err) {
    console.error("[STRIPE-WEBHOOK] Error:", err);
    return new Response(
      JSON.stringify({ error: "Webhook handler failed" }),
      { status: 400 }
    );
  }
});
