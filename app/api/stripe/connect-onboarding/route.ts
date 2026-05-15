import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/connect";
import { NextRequest, NextResponse } from "next/server";
import type { MentorProfileRow } from "@/lib/supabase/database.types";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data } = await supabase
    .from("mentor_profiles")
    .select()
    .eq("user_id", user.id)
    .single();
  const profile = data as MentorProfileRow | null;

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  let accountId = profile.stripe_account_id;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      country: "PT",
      email: user.email ?? undefined,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
    accountId = account.id;

    await (supabase.from("mentor_profiles") as any)
      .update({ stripe_account_id: accountId })
      .eq("id", profile.id);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${appUrl}/onboarding/mentor?step=4&stripe=refresh`,
    return_url: `${appUrl}/onboarding/mentor?step=4&stripe=return`,
    type: "account_onboarding",
  });

  return NextResponse.json({ url: accountLink.url });
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profileData } = await supabase
    .from("mentor_profiles")
    .select()
    .eq("user_id", user.id)
    .single();
  const getProfile = profileData as MentorProfileRow | null;

  if (!getProfile?.stripe_account_id) {
    return NextResponse.json({ charges_enabled: false, payouts_enabled: false });
  }

  const account = await stripe.accounts.retrieve(getProfile.stripe_account_id);

  const payoutsEnabled = account.payouts_enabled ?? false;
  const chargesEnabled = account.charges_enabled ?? false;

  if (payoutsEnabled) {
    await (supabase.from("mentor_profiles") as any)
      .update({ stripe_payouts_enabled: true })
      .eq("user_id", user.id);
  }

  return NextResponse.json({
    charges_enabled: chargesEnabled,
    payouts_enabled: payoutsEnabled,
  });
}
