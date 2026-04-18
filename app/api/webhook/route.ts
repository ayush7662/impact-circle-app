import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { subscriptionPeriodEndUnix } from "@/lib/stripeSubscription";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !secret) {
    return NextResponse.json(
      { error: "Missing webhook configuration" },
      { status: 500 },
    );
  }

  const admin = createSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: "Missing service role key" },
      { status: 500 },
    );
  }

  let event: Stripe.Event;
  const body = await req.text();

  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        if (!userId || typeof userId !== "string") break;

        const customerId =
          typeof session.customer === "string" ? session.customer : null;
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : null;

        let renewsAt: string | null = null;
        let plan: string | null = session.metadata?.plan || null;

        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          const periodEnd = subscriptionPeriodEndUnix(sub);
          if (periodEnd) {
            renewsAt = new Date(periodEnd * 1000).toISOString();
          }
          plan =
            sub.items.data[0]?.price?.recurring?.interval === "year"
              ? "year"
              : "month";
        }

        await admin.from("profiles").upsert(
          {
            id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_status: "active",
            subscription_plan: plan,
            subscription_renews_at: renewsAt,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" },
        );
        break;
      }
      case "customer.subscription.deleted":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id;
        if (!userId) break;

        const active = sub.status === "active" || sub.status === "trialing";
        const periodEnd = subscriptionPeriodEndUnix(sub);
        await admin
          .from("profiles")
          .update({
            subscription_status: active ? "active" : "inactive",
            stripe_subscription_id: sub.id,
            subscription_renews_at:
              active && periodEnd
                ? new Date(periodEnd * 1000).toISOString()
                : null,
            subscription_plan:
              sub.items.data[0]?.price?.recurring?.interval === "year"
                ? "year"
                : "month",
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);
        break;
      }
      default:
        break;
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Webhook handler error";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
