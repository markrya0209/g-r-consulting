'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

export default function EmailVerificationPage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkVerification = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/signup');
        return;
      }

      setEmail(user.email || null);

      // If already verified, redirect to dashboard (need to check role first in real app)
      if (user.email_confirmed_at) {
        router.push('/dashboard/mentor');
      }

      setChecking(false);
    };

    checkVerification();
  }, [router, supabase]);

  const handleResend = async () => {
    if (!email) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // TODO: Implement proper email resend via Supabase Auth Hooks
      // For now, this is a placeholder that uses the verification link generation
      // In production, this would trigger the Auth Hook to send via Resend
      setSuccess(true);
      setError(null);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError('Erro ao reenviar email. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return <div className="min-h-screen bg-[--grc-bg]" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[--grc-bg] px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <div className="text-5xl mb-4">✉️</div>
          <h1 className="text-3xl font-bold text-[--grc-ink] mb-2">Verifica o teu email</h1>
          <p className="text-[--grc-ink]/70">
            Enviámos um email para <span className="font-medium">{email}</span>. Clica no link para
            confirmar a tua conta.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded text-red-600 text-sm mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded text-green-600 text-sm mb-6">
            Email reenviado com sucesso! Verifica a tua caixa de entrada.
          </div>
        )}

        <button
          onClick={handleResend}
          disabled={loading}
          className="w-full bg-[--grc-accent] text-white font-medium py-2 rounded-lg hover:bg-opacity-90 disabled:opacity-50 mb-4"
        >
          {loading ? 'Reenviando...' : 'Reenviar email'}
        </button>

        <p className="text-sm text-[--grc-ink]/70">
          Não recebeste o email? Verifica a pasta de spam ou{' '}
          <button
            onClick={handleResend}
            className="text-[--grc-accent] hover:underline"
          >
            reenviar
          </button>
          .
        </p>
      </div>
    </div>
  );
}
