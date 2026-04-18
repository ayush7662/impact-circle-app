import Stripe from "stripe";
import { NextResponse } from "next/server";
import { appUrl } from "@/lib/env";
import { getUserFromRequest } from "@/lib/supabaseFromRequest";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

type Plan = "month" | "year";

function amountForPlan(plan: Plan) {
  
  if (plan === "year") return 480_000; // ~20% vs 12× monthly
  return 50_000; // ₹500 / month
}

function intervalForPlan(plan: Plan): Stripe.PriceCreateParams.Recurring.Interval {
  return plan === "year" ? "year" : "month";
}

export async function POST(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const plan: Plan = body?.plan === "year" ? "year" : "month";
    const base = appUrl();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: user.email,
      client_reference_id: user.id,
      metadata: {
        user_id: user.id,
        plan,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan,
        },
      },
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name:
                plan === "year"
                  ? "Impact Circle — Yearly"
                  : "Impact Circle — Monthly",
              description:
                "Performance tracking, monthly draws, and charity impact.",
            },
            unit_amount: amountForPlan(plan),
            recurring: {
              interval: intervalForPlan(plan),
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${base}/dashboard?checkout=success`,
      cancel_url: `${base}/dashboard?checkout=cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
