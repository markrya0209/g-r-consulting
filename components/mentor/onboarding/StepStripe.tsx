'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { MentorProfileRow } from '@/lib/supabase/database.types';

interface Props {
  profile: MentorProfileRow;
  stripeParam: string | null;
  onNext: (updated: MentorProfileRow) => void;
  onBack: () => void;
}

export default function StepStripe({ profile, stripeParam, onNext, onBack }: Props) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<{
    charges_enabled: boolean;
    payouts_enabled: boolean;
  } | null>(null);

  const pollCount = useRef(0);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkStatus = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch('/api/stripe/connect-onboarding');
      const data = await res.json();
      setStatus(data);
      return data;
    } finally {
      setChecking(false);
    }
  }, []);

  // On return from Stripe, poll until enabled or max attempts
  useEffect(() => {
    if (stripeParam !== 'return') return;
    if (profile.stripe_payouts_enabled) return;

    const poll = async () => {
      const data = await checkStatus();
      if (data?.payouts_enabled) return;
      pollCount.current++;
      if (pollCount.current < 6) {
        pollTimer.current = setTimeout(poll, 10_000);
      }
    };
    poll();

    return () => { if (pollTimer.current) clearTimeout(pollTimer.current); };
  }, [stripeParam, checkStatus, profile.stripe_payouts_enabled]);

  // Also check once on mount if already has account
  useEffect(() => {
    if (profile.stripe_account_id && !profile.stripe_payouts_enabled) {
      checkStatus();
    } else if (profile.stripe_payouts_enabled) {
      setStatus({ charges_enabled: true, payouts_enabled: true });
    }
  }, [profile.stripe_account_id, profile.stripe_payouts_enabled, checkStatus]);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stripe/connect-onboarding', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erro ao criar ligação Stripe.');
      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    const { data: updated } = await supabase
      .from('mentor_profiles')
      .update({
        stripe_payouts_enabled: true,
        onboarding_step: Math.max(profile.onboarding_step, 5),
      })
      .eq('id', profile.id)
      .select()
      .single();
    setLoading(false);
    onNext(updated!);
  };

  const payoutsEnabled = status?.payouts_enabled || profile.stripe_payouts_enabled;

  return (
    <div className="space-y-6 max-w-xl">
      <h2 className="text-2xl font-bold text-[--grc-ink]">Pagamentos — Stripe Connect</h2>
      <p className="text-[--grc-ink-muted]">
        Para receber pagamentos, precisas de configurar a tua conta Stripe Express.
        A Stripe trata de toda a verificação de identidade e dados bancários.
      </p>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {payoutsEnabled ? (
        <div className="border-2 border-green-200 bg-green-50 rounded-lg p-6 text-center">
          <div className="text-3xl mb-2">✅</div>
          <h3 className="font-semibold text-green-800 text-lg">Stripe verificado</h3>
          <p className="text-green-700 text-sm mt-1">
            A tua conta está ativa e pronta a receber pagamentos.
          </p>
        </div>
      ) : profile.stripe_account_id ? (
        <div className="border-2 border-amber-200 bg-amber-50 rounded-lg p-6 text-center">
          <div className="text-3xl mb-2">⏳</div>
          <h3 className="font-semibold text-amber-800 text-lg">Verificação pendente</h3>
          <p className="text-amber-700 text-sm mt-1 mb-4">
            A Stripe está a verificar os teus dados. Isto pode demorar alguns minutos.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={checkStatus}
              disabled={checking}
              className="px-4 py-2 border border-amber-300 rounded-lg text-amber-800 text-sm hover:bg-amber-100 disabled:opacity-50"
            >
              {checking ? 'A verificar...' : 'Verificar estado'}
            </button>
            <button
              onClick={handleConnect}
              disabled={loading}
              className="px-4 py-2 bg-[--grc-accent] text-white text-sm rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              Completar onboarding
            </button>
          </div>
        </div>
      ) : (
        <div className="border-2 border-[--grc-border] rounded-lg p-8 text-center">
          <div className="text-4xl mb-4">💳</div>
          <h3 className="font-semibold text-[--grc-ink] text-lg mb-2">Configurar Stripe</h3>
          <p className="text-[--grc-ink-muted] text-sm mb-6 max-w-sm mx-auto">
            Serás redirecionado para a Stripe para configurar a tua conta.
            A Stripe pedirá os teus dados bancários e de identidade.
          </p>
          <button
            onClick={handleConnect}
            disabled={loading}
            className="px-6 py-3 bg-[--grc-accent] text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'A redirecionar...' : 'Conectar Stripe →'}
          </button>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 border border-[--grc-border] rounded-lg text-[--grc-ink] hover:bg-[--grc-bg-muted]"
        >
          ← Voltar
        </button>
        {payoutsEnabled && (
          <button
            onClick={handleComplete}
            disabled={loading}
            className="flex-1 bg-[--grc-accent] text-white font-medium py-3 rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'A guardar...' : 'Concluir →'}
          </button>
        )}
      </div>
    </div>
  );
}
