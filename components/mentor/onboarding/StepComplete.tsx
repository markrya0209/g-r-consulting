'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import type { MentorProfileRow } from '@/lib/supabase/database.types';

interface Props {
  profile: MentorProfileRow;
}

export default function StepComplete({ profile }: Props) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const [isActive, setIsActive] = useState(profile.is_active);
  const [toggling, setToggling] = useState(false);

  const canGoLive = profile.stripe_payouts_enabled;

  const handleToggle = async () => {
    if (!canGoLive) return;
    setToggling(true);
    const newState = !isActive;

    await supabase
      .from('mentor_profiles')
      .update({ is_active: newState })
      .eq('id', profile.id);

    setIsActive(newState);
    setToggling(false);
  };

  return (
    <div className="max-w-xl text-center space-y-8">
      <div>
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-3xl font-bold text-[--grc-ink] mb-2">Perfil criado!</h2>
        <p className="text-[--grc-ink-muted]">
          O teu perfil de mentor está completo. Ativa o teu perfil para aparecer na página de
          descoberta e começar a receber reservas.
        </p>
      </div>

      {/* Go-live toggle */}
      <div className="border-2 border-[--grc-border] rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="text-left">
            <h3 className="font-semibold text-[--grc-ink]">Perfil ativo</h3>
            <p className="text-sm text-[--grc-ink-muted]">
              {isActive
                ? 'Estás visível para candidatos na página de descoberta.'
                : 'O teu perfil não está visível. Ativa para receber reservas.'}
            </p>
          </div>
          <button
            onClick={handleToggle}
            disabled={toggling || !canGoLive}
            className={`
              relative w-14 h-7 rounded-full transition-colors
              ${isActive ? 'bg-[--grc-accent]' : 'bg-[--grc-border]'}
              ${!canGoLive ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div
              className={`
                absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform
                ${isActive ? 'translate-x-7' : 'translate-x-0.5'}
              `}
            />
          </button>
        </div>
        {!canGoLive && (
          <p className="mt-3 text-sm text-amber-600">
            Completa a verificação Stripe para ativar o teu perfil.
          </p>
        )}
      </div>

      {/* Links */}
      <div className="space-y-3">
        {profile.slug && (
          <Link
            href={`/mentors/${profile.slug}`}
            className="block w-full border border-[--grc-border] text-[--grc-ink] font-medium py-3 rounded-lg hover:bg-[--grc-bg-muted] text-center"
          >
            Ver perfil público →
          </Link>
        )}
        <Link
          href="/dashboard/mentor"
          className="block w-full bg-[--grc-accent] text-white font-medium py-3 rounded-lg hover:opacity-90 text-center"
        >
          Ir para o painel de mentor
        </Link>
      </div>
    </div>
  );
}
