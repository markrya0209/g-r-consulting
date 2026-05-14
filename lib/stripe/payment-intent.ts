import { stripe, computeFees } from "./connect";

interface CreatePaymentIntentParams {
  priceCents: number;
  mentorStripeAccountId: string;
  bookingId: string;
  menteeEmail: string;
}

export async function createPaymentIntent({
  priceCents,
  mentorStripeAccountId,
  bookingId,
  menteeEmail,
}: CreatePaymentIntentParams) {
  const { feeCents, totalCents } = computeFees(priceCents);

  return stripe.paymentIntents.create({
    amount: totalCents,
    currency: "eur",
    application_fee_amount: feeCents,
    transfer_data: { destination: mentorStripeAccountId },
    metadata: { bookingId },
    receipt_email: menteeEmail,
  });
}
