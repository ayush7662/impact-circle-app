import type Stripe from "stripe";

/** Stripe API 2025+ exposes period end on subscription items, not the subscription root. */
export function subscriptionPeriodEndUnix(sub: Stripe.Subscription): number | null {
  const end = sub.items?.data?.[0]?.current_period_end;
  return typeof end === "number" ? end : null;
}
