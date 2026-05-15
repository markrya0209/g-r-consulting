import { Button, Link } from '@react-email/components';
import BaseLayout from './BaseLayout';

interface Props {
  email: string;
  verificationLink: string;
}

export default function VerificationEmail({ email, verificationLink }: Props) {
  return (
    <BaseLayout
      subject="Verifica o teu email — G&R Consulting"
      preheader="Confirma o teu email para continuar"
    >
      <div>
        <p style={{ color: '#1a1a1a', fontSize: '16px', lineHeight: '1.5', marginTop: 0 }}>
          Olá,
        </p>

        <p style={{ color: '#1a1a1a', fontSize: '16px', lineHeight: '1.5' }}>
          Obrigado por te registares na G&R Consulting! Para ativar a tua conta, confirma o teu
          email clicando no botão abaixo.
        </p>

        <div style={{ textAlign: 'center', margin: '32px 0' }}>
          <Button
            href={verificationLink}
            style={{
              backgroundColor: '#F2511B',
              color: '#FFFFFF',
              padding: '12px 32px',
              borderRadius: '6px',
              fontWeight: 'bold',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Confirmar Email
          </Button>
        </div>

        <p style={{ color: '#666', fontSize: '14px', lineHeight: '1.5' }}>
          Se o botão acima não funcionar, copia e cola este link no teu navegador:
        </p>

        <p style={{ backgroundColor: '#f5f5f5', padding: '12px', borderRadius: '4px', wordBreak: 'break-all' }}>
          <Link href={verificationLink} style={{ color: '#F2511B', textDecoration: 'none' }}>
            {verificationLink}
          </Link>
        </p>

        <p style={{ color: '#999', fontSize: '12px', lineHeight: '1.5' }}>
          Este link expira em 24 horas.
        </p>

        <p style={{ color: '#1a1a1a', fontSize: '16px', lineHeight: '1.5' }}>
          Perguntas? Entra em contacto connosco em{' '}
          <Link href="mailto:support@grmentoria.pt" style={{ color: '#F2511B' }}>
            support@grmentoria.pt
          </Link>
        </p>
      </div>
    </BaseLayout>
  );
}
