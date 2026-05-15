'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { MentorProfileRow } from '@/lib/supabase/database.types';

// Cal.com integration placeholder — requires OAuth credentials to be set up.
// Once CALCOM_API_KEY is configured and @calcom/atoms is installed:
// - Embed the Cal.com inline availability scheduler here
// - On success, store cal_user_id and cal_event_type_id on mentor_profiles

interface Props {
  profile: MentorProfileRow;
  onNext: (updated: MentorProfileRow) => void;
  onBack: () => void;
}

export default function StepAvailability({ profile, onNext, onBack }: Props) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const [loading, setLoading] = useState(false);

  const alreadyConnected = !!profile.cal_user_id;

  const handleSkip = async () => {
    setLoading(true);
    const { data: updated } = await supabase
      .from('mentor_profiles')
      .update({ onboarding_step: Math.max(profile.onboarding_step, 4) })
      .eq('id', profile.id)
      .select()
      .single();
    setLoading(false);
    onNext(updated!);
  };

  return (
    <div className="space-y-6 max-w-xl">
      <h2 className="text-2xl font-bold text-[--grc-ink]">Disponibilidade</h2>

      {alreadyConnected ? (
        <div className="border-2 border-green-200 bg-green-50 rounded-lg p-6 text-center">
          <div className="text-3xl mb-2">✅</div>
          <h3 className="font-semibold text-[--grc-ink] text-lg">Calendário conectado</h3>
          <p className="text-[--grc-ink-muted] text-sm mt-1">
            A tua disponibilidade está configurada via Cal.com.
          </p>
        </div>
      ) : (
        <div className="border-2 border-[--grc-border] rounded-lg p-8 text-center">
          <div className="text-4xl mb-4">📅</div>
          <h3 className="font-semibold text-[--grc-ink] text-lg mb-2">Conectar disponibilidade</h3>
          <p className="text-[--grc-ink-muted] text-sm mb-6 max-w-sm mx-auto">
            A integração com Cal.com permite que os candidatos vejam os teus horários disponíveis
            e reservem diretamente. Esta funcionalidade será ativada em breve.
          </p>
          <div className="inline-block px-4 py-2 bg-[--grc-bg-muted] rounded-lg text-sm text-[--grc-ink-muted]">
            Disponível em breve
          </div>
        </div>
      )}

      <p className="text-sm text-[--grc-ink-muted]">
        Podes configurar a tua disponibilidade mais tarde nas definições do perfil.
      </p>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 border border-[--grc-border] rounded-lg text-[--grc-ink] hover:bg-[--grc-bg-muted]"
        >
          ← Voltar
        </button>
        <button
          onClick={handleSkip}
          disabled={loading}
          className="flex-1 bg-[--grc-accent] text-white font-medium py-3 rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'A guardar...' : 'Seguinte →'}
        </button>
      </div>
    </div>
  );
}
