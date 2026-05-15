import Link from 'next/link';

export const metadata = {
  title: 'Política de Privacidade — G&R Consulting',
};

export default function PrivacidadePage() {
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
          <h1 className="mt-4 text-4xl font-bold text-[--grc-ink]">Política de Privacidade</h1>
          <p className="mt-2 text-[--grc-ink-muted] text-sm">
            Versão 1.0 · Em vigor a partir de [DATA A DEFINIR]
          </p>
        </div>

        <div className="prose prose-neutral max-w-none space-y-8 text-[--grc-ink]">

          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Responsável pelo Tratamento</h2>
            <p className="leading-relaxed text-[--grc-ink-muted]">
              A G&R Consulting (&quot;Plataforma&quot;, &quot;nós&quot;) é responsável pelo tratamento dos teus
              dados pessoais. Podes contactar-nos em{' '}
              <a href="mailto:privacy@grmentoria.pt" className="text-[--grc-accent] hover:underline">
                privacy@grmentoria.pt
              </a>{' '}
              para qualquer questão relacionada com privacidade ou proteção de dados.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. Dados Recolhidos</h2>
            <div className="space-y-3 text-[--grc-ink-muted]">
              <p><strong className="text-[--grc-ink]">Dados de conta:</strong> Nome completo, endereço de email, palavra-passe (armazenada de forma cifrada), data de criação da conta.</p>
              <p><strong className="text-[--grc-ink]">Dados de perfil (Mentores):</strong> Foto de perfil, universidade, faculdade, curso, ano letivo, idiomas falados, tipos de sessão oferecidos, preços.</p>
              <p><strong className="text-[--grc-ink]">Dados de reserva:</strong> Tipo de sessão, data e hora, contexto pré-sessão fornecido pelo Candidato, estado da reserva.</p>
              <p><strong className="text-[--grc-ink]">Dados de pagamento:</strong> Processados exclusivamente pela Stripe. Não armazenamos dados de cartão. Armazenamos referências de transação (ID do PaymentIntent) e valores.</p>
              <p><strong className="text-[--grc-ink]">Dados de consentimento:</strong> Registo de aceitação dos Termos de Serviço e da Política de Privacidade com data/hora.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. Finalidades do Tratamento</h2>
            <ul className="list-disc pl-6 space-y-1 text-[--grc-ink-muted]">
              <li>Prestação do serviço de marketplace de mentoria</li>
              <li>Processamento de pagamentos e transferências</li>
              <li>Comunicações transacionais (confirmações, lembretes, relatórios de sessão)</li>
              <li>Cumprimento de obrigações legais e fiscais</li>
              <li>Melhoria da plataforma e análise de utilização (apenas com consentimento)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Subprocessadores de Dados</h2>
            <p className="leading-relaxed text-[--grc-ink-muted] mb-4">
              Os teus dados são partilhados com os seguintes prestadores de serviços, cada um com
              as respetivas garantias de proteção de dados:
            </p>
            <div className="space-y-4">
              <div className="border border-[--grc-border] rounded-lg p-4">
                <h3 className="font-semibold text-[--grc-ink] mb-1">Supabase</h3>
                <p className="text-sm text-[--grc-ink-muted]">
                  Base de dados e autenticação. Dados armazenados na União Europeia (região UE West).
                  Certificação ISO 27001. <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[--grc-accent] hover:underline">Política de Privacidade</a>
                </p>
              </div>
              <div className="border border-[--grc-border] rounded-lg p-4">
                <h3 className="font-semibold text-[--grc-ink] mb-1">Stripe</h3>
                <p className="text-sm text-[--grc-ink-muted]">
                  Processamento de pagamentos e gestão de contas de Mentor (Stripe Connect).
                  Certificação PCI DSS nível 1. Dados processados nos EUA com garantias adequadas (SCCs).
                  <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[--grc-accent] hover:underline ml-1">Política de Privacidade</a>
                </p>
              </div>
              <div className="border border-[--grc-border] rounded-lg p-4">
                <h3 className="font-semibold text-[--grc-ink] mb-1">Cal.com</h3>
                <p className="text-sm text-[--grc-ink-muted]">
                  Gestão de disponibilidade e agendamento de sessões dos Mentores.
                  <a href="https://cal.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[--grc-accent] hover:underline ml-1">Política de Privacidade</a>
                </p>
              </div>
              <div className="border border-[--grc-border] rounded-lg p-4">
                <h3 className="font-semibold text-[--grc-ink] mb-1">Daily.co</h3>
                <p className="text-sm text-[--grc-ink-muted]">
                  Infraestrutura de videochamada para as sessões de mentoria. Sem gravação.
                  <a href="https://www.daily.co/privacy" target="_blank" rel="noopener noreferrer" className="text-[--grc-accent] hover:underline ml-1">Política de Privacidade</a>
                </p>
              </div>
              <div className="border border-[--grc-border] rounded-lg p-4">
                <h3 className="font-semibold text-[--grc-ink] mb-1">Resend</h3>
                <p className="text-sm text-[--grc-ink-muted]">
                  Envio de emails transacionais (confirmações, lembretes, relatórios).
                  <a href="https://resend.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[--grc-accent] hover:underline ml-1">Política de Privacidade</a>
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Retenção de Dados</h2>
            <div className="space-y-2 text-[--grc-ink-muted]">
              <p><strong className="text-[--grc-ink]">Dados de conta ativa:</strong> Enquanto a conta estiver ativa.</p>
              <p><strong className="text-[--grc-ink]">Após eliminação da conta:</strong> Os dados de identificação (nome, email, foto) são anonimizados imediatamente. Os registos de reservas e pagamentos são mantidos por 7 anos para cumprimento de obrigações fiscais e legais (RGPD Art. 17(3)(e)).</p>
              <p><strong className="text-[--grc-ink]">Dados de consentimento:</strong> Mantidos como prova de cumprimento do RGPD.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Os Teus Direitos (RGPD)</h2>
            <p className="leading-relaxed text-[--grc-ink-muted] mb-3">
              Ao abrigo do RGPD, tens os seguintes direitos:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-[--grc-ink-muted]">
              <li><strong className="text-[--grc-ink]">Acesso:</strong> Podes solicitar uma cópia de todos os teus dados pessoais através das Definições da conta.</li>
              <li><strong className="text-[--grc-ink]">Portabilidade:</strong> Podes exportar os teus dados em formato JSON através das Definições da conta.</li>
              <li><strong className="text-[--grc-ink]">Retificação:</strong> Podes corrigir os teus dados diretamente nas Definições da conta.</li>
              <li><strong className="text-[--grc-ink]">Eliminação:</strong> Podes eliminar a tua conta nas Definições. Os dados de identificação são anonimizados imediatamente.</li>
              <li><strong className="text-[--grc-ink]">Oposição:</strong> Podes opor-te ao tratamento para fins de marketing nas Definições de email.</li>
            </ul>
            <p className="mt-3 text-[--grc-ink-muted]">
              Para exercer qualquer destes direitos, contacta-nos em{' '}
              <a href="mailto:privacy@grmentoria.pt" className="text-[--grc-accent] hover:underline">
                privacy@grmentoria.pt
              </a>
              . Responderemos no prazo de 30 dias.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Cookies</h2>
            <p className="leading-relaxed text-[--grc-ink-muted]">
              Utilizamos apenas cookies essenciais para o funcionamento da plataforma (autenticação
              e preferências de sessão). Não utilizamos cookies de terceiros para publicidade ou
              rastreamento sem o teu consentimento explícito.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Contacto e Reclamações</h2>
            <p className="leading-relaxed text-[--grc-ink-muted]">
              Para questões de privacidade: <a href="mailto:privacy@grmentoria.pt" className="text-[--grc-accent] hover:underline">privacy@grmentoria.pt</a>
              <br />
              Tens também o direito de apresentar reclamação à autoridade de controlo portuguesa:{' '}
              <a href="https://www.cnpd.pt" target="_blank" rel="noopener noreferrer" className="text-[--grc-accent] hover:underline">
                Comissão Nacional de Proteção de Dados (CNPD)
              </a>
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
