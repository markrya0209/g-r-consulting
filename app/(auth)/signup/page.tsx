'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

export default function SignupPage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [gdprConsent, setGdprConsent] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!ageConfirmed || !gdprConsent || !termsAccepted) {
      setError('Por favor, confirme todas as caixas de consentimento.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    setLoading(true);

    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            age_confirmed: ageConfirmed,
            gdpr_consent_at: new Date().toISOString(),
            terms_accepted_at: new Date().toISOString(),
          },
        },
      });

      if (signupError) {
        setError(signupError.message);
        return;
      }

      router.push('/role-selection');
    } catch (err) {
      setError('Erro ao criar conta. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
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
          <p className="text-[--grc-ink]/70">Cria a tua conta</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[--grc-ink] mb-1">
              Nome completo
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-[--grc-border] rounded-lg bg-white text-[--grc-ink] placeholder-[--grc-ink]/40"
              placeholder="João Silva"
            />
          </div>

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

          <div>
            <label className="block text-sm font-medium text-[--grc-ink] mb-1">
              Confirmar senha
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-[--grc-border] rounded-lg bg-white text-[--grc-ink] placeholder-[--grc-ink]/40"
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
                className="mt-1"
              />
              <span className="text-sm text-[--grc-ink]">
                Tenho pelo menos 16 anos
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={gdprConsent}
                onChange={(e) => setGdprConsent(e.target.checked)}
                className="mt-1"
              />
              <span className="text-sm text-[--grc-ink]">
                Aceito a{' '}
                <Link href="/privacidade" className="text-[--grc-accent] hover:underline">
                  Política de Privacidade
                </Link>
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1"
              />
              <span className="text-sm text-[--grc-ink]">
                Aceito os{' '}
                <Link href="/terms" className="text-[--grc-accent] hover:underline">
                  Termos de Serviço
                </Link>
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[--grc-accent] text-white font-medium py-2 rounded-lg hover:bg-opacity-90 disabled:opacity-50"
          >
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <div className="mt-4">
          <button
            onClick={handleGoogleSignup}
            className="w-full border border-[--grc-border] text-[--grc-ink] font-medium py-2 rounded-lg hover:bg-[--grc-surface]"
          >
            Continuar com Google
          </button>
        </div>

        <p className="text-center mt-4 text-sm text-[--grc-ink]/70">
          Já tem conta?{' '}
          <Link href="/login" className="text-[--grc-accent] hover:underline">
            Faça login
          </Link>
        </p>
      </div>
    </div>
  );
}
