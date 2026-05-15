'use client';

export const dynamic = 'force-dynamic';

import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { useEffect, useState } from 'react';

export default function MentorDashboard() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setUser(user);
    };

    getUser();
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (!user) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-[--grc-bg] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-[--grc-ink]">Painel do Mentor</h1>
          <button
            onClick={handleLogout}
            className="bg-[--grc-accent] text-white px-4 py-2 rounded-lg hover:bg-opacity-90"
          >
            Sair
          </button>
        </div>

        <div className="bg-white rounded-lg p-6 mb-6">
          <p className="text-[--grc-ink]">Email: {user.email}</p>
          <p className="text-[--grc-ink]/70 mt-2">
            Bem-vindo ao painel do mentor! Aqui poderás gerir as tuas sessões, disponibilidade e ganhos.
          </p>
        </div>

        {/* Placeholder sections for future implementation */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-bold text-[--grc-ink] mb-4">Próxima Sessão</h2>
            <p className="text-[--grc-ink]/70">Nenhuma sessão agendada</p>
          </div>

          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-bold text-[--grc-ink] mb-4">Ganhos</h2>
            <p className="text-[--grc-ink]/70">€0,00 este mês</p>
          </div>
        </div>
      </div>
    </div>
  );
}
