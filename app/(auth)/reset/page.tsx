'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';

export default function ResetPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erro ao enviar email de recuperação.');
        return;
      }

      setSuccess(true);
      setEmail('');
    } catch (err) {
      setError('Erro ao enviar email. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[--grc-bg] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[--grc-ink] mb-2">Recuperar Senha</h1>
          <p className="text-[--grc-ink]/70">Introduz o teu email para receber um link de recuperação</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded text-green-600 text-sm">
              Email enviado com sucesso! Verifica a tua caixa de entrada.
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[--grc-accent] text-white font-medium py-2 rounded-lg hover:bg-opacity-90 disabled:opacity-50"
          >
            {loading ? 'Enviando...' : 'Enviar link de recuperação'}
          </button>
        </form>

        <p className="text-center mt-4 text-sm text-[--grc-ink]/70">
          Lembras-te da tua senha?{' '}
          <Link href="/login" className="text-[--grc-accent] hover:underline">
            Faça login
          </Link>
        </p>
      </div>
    </div>
  );
}
