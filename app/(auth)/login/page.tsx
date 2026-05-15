'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        setError(loginError.message);
        return;
      }

      // Check user role and redirect accordingly
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user?.id)
        .single();

      if (!userData?.role) {
        router.push('/role-selection');
      } else if (userData.role === 'mentor') {
        router.push('/dashboard/mentor');
      } else {
        router.push('/dashboard/mentee');
      }
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError('Erro ao fazer login com Google.');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[--grc-bg] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[--grc-ink] mb-2">G&R Consulting</h1>
          <p className="text-[--grc-ink]/70">Faz login na tua conta</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[--grc-ink] mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-[--grc-border] rounded-lg bg-white text-[--grc-ink] placeholder-[--grc-ink]/40"
              placeholder="joao@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[--grc-ink] mb-1">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-[--grc-border] rounded-lg bg-white text-[--grc-ink] placeholder-[--grc-ink]/40"
              placeholder="••••••••"
            />
          </div>

          <div className="text-right">
            <Link href="/reset" className="text-sm text-[--grc-accent] hover:underline">
              Esqueceste a senha?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[--grc-accent] text-white font-medium py-2 rounded-lg hover:bg-opacity-90 disabled:opacity-50"
          >
            {loading ? 'A fazer login...' : 'Fazer login'}
          </button>
        </form>

        <div className="mt-4">
          <button
            onClick={handleGoogleLogin}
            className="w-full border border-[--grc-border] text-[--grc-ink] font-medium py-2 rounded-lg hover:bg-[--grc-surface]"
          >
            Continuar com Google
          </button>
        </div>

        <p className="text-center mt-4 text-sm text-[--grc-ink]/70">
          Não tens conta?{' '}
          <Link href="/signup" className="text-[--grc-accent] hover:underline">
            Cria uma conta
          </Link>
        </p>
      </div>
    </div>
  );
}
