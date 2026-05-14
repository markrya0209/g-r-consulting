import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
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
