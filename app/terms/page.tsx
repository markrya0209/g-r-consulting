import Link from 'next/link';

export const metadata = {
  title: 'Termos de Serviço — G&R Consulting',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[--grc-bg]">
      {/* DRAFT banner */}
      <div className="bg-amber-100 border-b border-amber-300 text-amber-900 text-sm text-center py-3 px-4 font-medium">
        RASCUNHO — PENDENTE DE REVISÃO JURÍDICA. Não constitui aconselhamento legal válido.
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <Link href="/" className="text-[--grc-accent] text-sm hover:underline">
            ← G&R Consulting
          </Link>
          <h1 className="mt-4 text-4xl font-bold text-[--grc-ink]">Termos de Serviço</h1>
          <p className="mt-2 text-[--grc-ink-muted] text-sm">
            Versão 1.0 · Em vigor a partir de [DATA A DEFINIR]
          </p>
        </div>

        <div className="prose prose-neutral max-w-none space-y-8 text-[--grc-ink]">

          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Descrição da Plataforma</h2>
            <p className="leading-relaxed text-[--grc-ink-muted]">
              A G&R Consulting (&quot;Plataforma&quot;) é um marketplace de mentoria onde estudantes
              universitários portugueses (&quot;Mentores&quot;) oferecem sessões de orientação individual
              pagas a candidatos ao ensino superior (&quot;Candidatos&quot;). A Plataforma facilita a
              ligação entre Mentores e Candidatos mas não é parte integrante das sessões prestadas.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. Tipos de Sessão</h2>
            <p className="leading-relaxed text-[--grc-ink-muted] mb-3">
              A Plataforma oferece os seguintes tipos de sessão, sujeitos à disponibilidade de cada Mentor:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-[--grc-ink-muted]">
              <li>Estratégia de nota de candidatura (CNA)</li>
              <li>Seleção de provas de ingresso</li>
              <li>Ordenação de opções de candidatura</li>
              <li>Seleção de curso e instituição</li>
              <li>Equivalências de exames (estudantes internacionais/diáspora)</li>
              <li>Tutoria para exames nacionais</li>
              <li>Orientação sobre a vida universitária</li>
              <li>Vias de acesso para estudantes internacionais</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. Condições de Pagamento</h2>
            <p className="leading-relaxed text-[--grc-ink-muted]">
              O preço de cada sessão é definido pelo Mentor e varia entre €20 e €50 por hora.
              A Plataforma cobra uma taxa de serviço de 11% sobre o valor de cada sessão, deduzida
              automaticamente no momento do pagamento. O Candidato paga o valor total indicado no
              resumo da reserva; o Mentor recebe o valor após dedução da taxa de plataforma.
              Os pagamentos são processados pela Stripe. Os fundos são transferidos para o Mentor
              24 horas após a conclusão da sessão.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Política de Cancelamento</h2>
            <div className="space-y-3 text-[--grc-ink-muted]">
              <p>
                <strong className="text-[--grc-ink]">Cancelamento pelo Mentor:</strong> Reembolso
                total ao Candidato, processado automaticamente pela Stripe (5–10 dias úteis).
              </p>
              <p>
                <strong className="text-[--grc-ink]">Cancelamento pelo Candidato (mais de 24h antes):</strong>{' '}
                Reembolso total ao Candidato.
              </p>
              <p>
                <strong className="text-[--grc-ink]">Cancelamento pelo Candidato (24h ou menos antes):</strong>{' '}
                Sem reembolso. O Mentor retém os seus ganhos pela sessão.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Responsabilidade</h2>
            <p className="leading-relaxed text-[--grc-ink-muted]">
              A G&R Consulting não garante a precisão, completude ou adequação do conteúdo das
              sessões de mentoria às circunstâncias individuais de cada Candidato. As opiniões e
              orientações partilhadas pelos Mentores são de caráter informativo e não substituem
              aconselhamento oficial das instituições de ensino ou dos serviços de candidatura.
              A responsabilidade máxima da Plataforma é limitada ao valor da sessão em questão.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Tratamento de Dados</h2>
            <p className="leading-relaxed text-[--grc-ink-muted]">
              O tratamento dos dados pessoais é realizado de acordo com a{' '}
              <Link href="/privacidade" className="text-[--grc-accent] hover:underline">
                Política de Privacidade
              </Link>
              , em conformidade com o Regulamento Geral sobre a Proteção de Dados (RGPD).
              Ao criar uma conta, aceitas o tratamento dos teus dados para os fins descritos nessa política.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Conta e Elegibilidade</h2>
            <p className="leading-relaxed text-[--grc-ink-muted]">
              Para criar uma conta na Plataforma deves ter pelo menos 16 anos de idade. Os Mentores
              devem ser estudantes universitários ativos em instituições portuguesas. A Plataforma
              reserva-se o direito de suspender ou encerrar contas que violem estes termos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Alterações aos Termos</h2>
            <p className="leading-relaxed text-[--grc-ink-muted]">
              A G&R Consulting pode atualizar estes Termos periodicamente. Notificaremos os
              utilizadores registados por email antes de quaisquer alterações materiais. A
              utilização continuada da Plataforma após as alterações constitui aceitação dos novos termos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">9. Contacto</h2>
            <p className="leading-relaxed text-[--grc-ink-muted]">
              Para questões sobre estes Termos, contacta-nos em{' '}
              <a href="mailto:support@grmentoria.pt" className="text-[--grc-accent] hover:underline">
                support@grmentoria.pt
              </a>
              .
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
