'use client';

import { useEffect, useState } from 'react';

const COOKIE_KEY = 'cookieConsent';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function setConsentCookie(value: 'accepted' | 'rejected') {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_KEY}=${value};path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax`;
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_KEY);
    if (!stored) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, 'accepted');
    setConsentCookie('accepted');
    setVisible(false);
  };

  const reject = () => {
    localStorage.setItem(COOKIE_KEY, 'rejected');
    setConsentCookie('rejected');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Consentimento de cookies"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[--grc-border] bg-[--grc-surface] px-4 py-4 shadow-lg"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[--grc-ink]">
          Usamos cookies essenciais para o funcionamento da plataforma.{' '}
          <a href="/privacidade" className="text-[--grc-accent] hover:underline">
            Política de Privacidade
          </a>
        </p>
        <div className="flex shrink-0 gap-3">
          <button
            onClick={reject}
            className="rounded-lg border border-[--grc-border] px-4 py-2 text-sm font-medium text-[--grc-ink] hover:bg-[--grc-bg-muted]"
          >
            Rejeitar
          </button>
          <button
            onClick={accept}
            className="rounded-lg bg-[--grc-accent] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
}
