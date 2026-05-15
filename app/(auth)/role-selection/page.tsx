'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function RoleSelectionPage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/signup');
        return;
      }

      // Check if user already has a role
      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (data?.role) {
        // Redirect to appropriate dashboard
        router.push(data.role === 'mentor' ? '/dashboard/mentor' : '/dashboard/mentee');
        return;
      }

      setUser(user);
    };

    getUser();
  }, [router, supabase]);

  const handleRoleSelect = async (role: 'mentor' | 'mentee') => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({ role })
        .eq('id', user.id);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      router.push('/email-verification');
    } catch (err) {
      setError('Erro ao salvar função. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="min-h-screen bg-[--grc-bg]" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[--grc-bg] px-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[--grc-ink] mb-2">G&R Consulting</h1>
          <p className="text-[--grc-ink]/70 text-lg">Como gostarias de usar a plataforma?</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded text-red-600 text-sm mb-6">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <button
            onClick={() => handleRoleSelect('mentor')}
            disabled={loading}
            className="p-8 border-2 border-[--grc-border] rounded-lg hover:border-[--grc-accent] hover:bg-[--grc-accent-soft] transition disabled:opacity-50"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">👨‍🏫</div>
              <h2 className="text-2xl font-bold text-[--grc-ink] mb-2">Sou Mentor</h2>
              <p className="text-[--grc-ink]/70">
                Ofereço sessões de mentoria a candidatos em preparação para o CNA e outras vias de acesso.
              </p>
            </div>
          </button>

          <button
            onClick={() => handleRoleSelect('mentee')}
            disabled={loading}
            className="p-8 border-2 border-[--grc-border] rounded-lg hover:border-[--grc-accent] hover:bg-[--grc-accent-soft] transition disabled:opacity-50"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">🎓</div>
              <h2 className="text-2xl font-bold text-[--grc-ink] mb-2">Sou Candidato</h2>
              <p className="text-[--grc-ink]/70">
                Procuro mentores para me ajudar na minha preparação e candidaturas.
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
