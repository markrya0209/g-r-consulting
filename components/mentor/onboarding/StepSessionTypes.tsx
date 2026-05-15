'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { MentorProfileRow, SessionTypeKey } from '@/lib/supabase/database.types';
import { SESSION_TYPE_META, ALL_SESSION_TYPE_KEYS } from '@/lib/constants';

interface SessionTypeState {
  type_key: SessionTypeKey;
  is_enabled: boolean;
  description: string;
  price_cents: number;
}

interface Props {
  profile: MentorProfileRow;
  onNext: (updated: MentorProfileRow) => void;
  onBack: () => void;
}

export default function StepSessionTypes({ profile, onNext, onBack }: Props) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const [types, setTypes] = useState<SessionTypeState[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadExisting = async () => {
      const { data } = await supabase
        .from('session_types')
        .select('type_key, is_enabled, description, price_cents')
        .eq('mentor_profile_id', profile.id);

      const existing = new Map(data?.map((r) => [r.type_key, r]) ?? []);

      setTypes(
        ALL_SESSION_TYPE_KEYS.map((key) => {
          const ex = existing.get(key);
          return {
            type_key: key,
            is_enabled: ex?.is_enabled ?? false,
            description: ex?.description ?? '',
            price_cents: ex?.price_cents ?? 3000,
          };
        }),
      );
      setInitialLoading(false);
    };
    loadExisting();
  }, [profile.id, supabase]);

  const toggle = (key: SessionTypeKey) => {
    setTypes((prev) =>
      prev.map((t) => (t.type_key === key ? { ...t, is_enabled: !t.is_enabled } : t)),
    );
  };

  const updateField = (key: SessionTypeKey, field: 'description' | 'price_cents', value: string | number) => {
    setTypes((prev) =>
      prev.map((t) => (t.type_key === key ? { ...t, [field]: value } : t)),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const enabled = types.filter((t) => t.is_enabled);
    if (enabled.length === 0) {
      setError('Seleciona pelo menos um tipo de sessão.');
      return;
    }

    for (const t of enabled) {
      if (t.price_cents < 2000 || t.price_cents > 5000) {
        setError(`O preço de "${SESSION_TYPE_META[t.type_key].label}" deve ser entre €20 e €50.`);
        return;
      }
      if (t.description.length > 150) {
        setError(`A descrição de "${SESSION_TYPE_META[t.type_key].label}" excede 150 caracteres.`);
        return;
      }
    }

    setLoading(true);

    try {
      // Upsert all types (enabled and disabled)
      for (const t of types) {
        const { error: upsertErr } = await supabase
          .from('session_types')
          .upsert(
            {
              mentor_profile_id: profile.id,
              type_key: t.type_key,
              is_enabled: t.is_enabled,
              description: t.description || null,
              price_cents: t.price_cents,
            },
            { onConflict: 'mentor_profile_id,type_key' },
          );
        if (upsertErr) throw new Error(upsertErr.message);
      }

      // Advance step
      const { data: updated, error: stepErr } = await supabase
        .from('mentor_profiles')
        .update({ onboarding_step: Math.max(profile.onboarding_step, 3) })
        .eq('id', profile.id)
        .select()
        .single();
      if (stepErr) throw new Error(stepErr.message);

      onNext(updated!);
    } catch (err: any) {
      setError(err.message ?? 'Erro ao guardar.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="text-[--grc-ink-muted]">A carregar tipos de sessão...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <h2 className="text-2xl font-bold text-[--grc-ink]">Tipos de sessão</h2>
      <p className="text-[--grc-ink-muted]">
        Seleciona os tipos de sessão que queres oferecer. Define o preço e uma breve descrição para cada um.
      </p>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {types.map((t) => {
          const meta = SESSION_TYPE_META[t.type_key];
          return (
            <div
              key={t.type_key}
              className={`border-2 rounded-lg p-4 transition ${
                t.is_enabled
                  ? 'border-[--grc-accent] bg-[--grc-accent-soft]'
                  : 'border-[--grc-border] bg-white'
              }`}
            >
              <button
                type="button"
                onClick={() => toggle(t.type_key)}
                className="w-full flex items-center justify-between text-left"
              >
                <div>
                  <h3 className="font-semibold text-[--grc-ink]">{meta.label}</h3>
                  <p className="text-sm text-[--grc-ink-muted]">{meta.hint}</p>
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    t.is_enabled
                      ? 'bg-[--grc-accent] border-[--grc-accent] text-white'
                      : 'border-[--grc-border]'
                  }`}
                >
                  {t.is_enabled && '✓'}
                </div>
              </button>

              {t.is_enabled && (
                <div className="mt-4 space-y-3 pl-1">
                  <div>
                    <label className="block text-sm font-medium text-[--grc-ink] mb-1">
                      Descrição ({t.description.length}/150)
                    </label>
                    <input
                      type="text"
                      value={t.description}
                      onChange={(e) => updateField(t.type_key, 'description', e.target.value)}
                      maxLength={150}
                      placeholder="Descreve brevemente o que ofereces..."
                      className="w-full px-3 py-2 border border-[--grc-border] rounded-lg bg-white text-[--grc-ink] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[--grc-ink] mb-1">
                      Preço por sessão (€)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={2000}
                        max={5000}
                        step={100}
                        value={t.price_cents}
                        onChange={(e) => updateField(t.type_key, 'price_cents', Number(e.target.value))}
                        className="flex-1 accent-[--grc-accent]"
                      />
                      <span className="font-bold text-[--grc-ink] w-16 text-right">
                        €{(t.price_cents / 100).toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 border border-[--grc-border] rounded-lg text-[--grc-ink] hover:bg-[--grc-bg-muted]"
        >
          ← Voltar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-[--grc-accent] text-white font-medium py-3 rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'A guardar...' : 'Seguinte →'}
        </button>
      </div>
    </form>
  );
}
