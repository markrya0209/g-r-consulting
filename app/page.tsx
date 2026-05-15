'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-[--grc-bg] flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold text-[--grc-ink] mb-4">G&R Consulting</h1>
        <p className="text-xl text-[--grc-ink]/70 mb-2">
          Mentoria Especializada para o Concurso Nacional de Acesso
        </p>
        <p className="text-[--grc-ink]/60 mb-8">
          Conecta-te com mentores universitários para preparar a tua candidatura
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link
            href="/signup"
            className="bg-[--grc-accent] text-white font-medium py-3 px-8 rounded-lg hover:bg-opacity-90"
          >
            Começar Agora
          </Link>
          <Link
            href="/login"
            className="border-2 border-[--grc-accent] text-[--grc-accent] font-medium py-3 px-8 rounded-lg hover:bg-[--grc-accent-soft]"
          >
            Fazer Login
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white rounded-lg p-6">
            <div className="text-3xl mb-3">👨‍🏫</div>
            <h3 className="font-bold text-[--grc-ink] mb-2">Para Mentores</h3>
            <p className="text-[--grc-ink]/70">Partilha a tua experiência e ganha</p>
          </div>
          <div className="bg-white rounded-lg p-6">
            <div className="text-3xl mb-3">🎓</div>
            <h3 className="font-bold text-[--grc-ink] mb-2">Para Candidatos</h3>
            <p className="text-[--grc-ink]/70">Preparação personalizada com especialistas</p>
          </div>
          <div className="bg-white rounded-lg p-6">
            <div className="text-3xl mb-3">💬</div>
            <h3 className="font-bold text-[--grc-ink] mb-2">Sessões Online</h3>
            <p className="text-[--grc-ink]/70">Agendar e conhecer mentores em 2 cliques</p>
          </div>
        </div>
      </div>
    </div>
  );
}
