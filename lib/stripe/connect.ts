import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-04-22.dahlia",
    });
  }
  return _stripe;
}

export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripe() as any)[prop];
  },
});

export const PLATFORM_FEE_PERCENT = 0.11;

export function computeFees(priceCents: number) {
  const feeCents = Math.round(priceCents * PLATFORM_FEE_PERCENT);
  return {
    feeCents,
    mentorCents: priceCents - feeCents,
    totalCents: priceCents,
  };
}
