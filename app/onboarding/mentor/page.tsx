'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import type { MentorProfileRow } from '@/lib/supabase/database.types';
import ProgressBar from '@/components/mentor/onboarding/ProgressBar';
import StepIdentity from '@/components/mentor/onboarding/StepIdentity';
import StepSessionTypes from '@/components/mentor/onboarding/StepSessionTypes';
import StepAvailability from '@/components/mentor/onboarding/StepAvailability';
import StepStripe from '@/components/mentor/onboarding/StepStripe';
import StepComplete from '@/components/mentor/onboarding/StepComplete';

function WizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [profile, setProfile] = useState<MentorProfileRow | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [initializing, setInitializing] = useState(true);

  const stripeParam = searchParams.get('stripe');
  const stepParam = searchParams.get('step');

  useEffect(() => {
    const init = async () => {
      // Auth check
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Role check
      const { data: userData } = await supabase
        .from('users')
        .select('role, display_name')
        .eq('id', user.id)
        .single();

      if (userData?.role !== 'mentor') {
        router.push('/role-selection');
        return;
      }

      setUserId(user.id);
      setUserName(userData.display_name);

      // Get or create mentor_profiles row
      let { data: existingProfile } = await supabase
        .from('mentor_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!existingProfile) {
        const { data: newProfile, error: insertErr } = await supabase
          .from('mentor_profiles')
          .insert({ user_id: user.id })
          .select()
          .single();

        if (insertErr) {
          console.error('Failed to create mentor profile:', insertErr);
          return;
        }
        existingProfile = newProfile;
      }

      setProfile(existingProfile!);

      // Determine step: URL param takes priority if returning from Stripe, else use DB
      if (stepParam) {
        setCurrentStep(Number(stepParam));
      } else {
        setCurrentStep(existingProfile!.onboarding_step);
      }

      setInitializing(false);
    };

    init();
  }, [router, supabase, stepParam]);

  const handleStepComplete = (updated: MentorProfileRow) => {
    setProfile(updated);
    setCurrentStep(updated.onboarding_step);
  };

  const handleGoBack = () => {
    setCurrentStep((s) => Math.max(1, s - 1));
  };

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[--grc-bg]">
        <p className="text-[--grc-ink-muted]">A carregar...</p>
      </div>
    );
  }

  if (!profile || !userId) return null;

  const isComplete = currentStep >= 5;

  return (
    <div className="min-h-screen bg-[--grc-bg] px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-2">
          <h1 className="text-sm font-medium text-[--grc-ink-muted]">G&R Consulting</h1>
        </div>

        {!isComplete && (
          <ProgressBar
            currentStep={currentStep}
            onStepClick={(step) => setCurrentStep(step)}
          />
        )}

        {/* Step content */}
        {currentStep === 1 && (
          <StepIdentity
            userId={userId}
            profile={profile}
            userName={userName}
            onNext={handleStepComplete}
          />
        )}
        {currentStep === 2 && (
          <StepSessionTypes
            profile={profile}
            onNext={handleStepComplete}
            onBack={handleGoBack}
          />
        )}
        {currentStep === 3 && (
          <StepAvailability
            profile={profile}
            onNext={handleStepComplete}
            onBack={handleGoBack}
          />
        )}
        {currentStep === 4 && (
          <StepStripe
            profile={profile}
            stripeParam={stripeParam}
            onNext={handleStepComplete}
            onBack={handleGoBack}
          />
        )}
        {isComplete && <StepComplete profile={profile} />}
      </div>
    </div>
  );
}

export default function MentorOnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[--grc-bg]">
          <p className="text-[--grc-ink-muted]">A carregar...</p>
        </div>
      }
    >
      <WizardContent />
    </Suspense>
  );
}
