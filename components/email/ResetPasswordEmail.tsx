import { Button, Link } from '@react-email/components';
import BaseLayout from './BaseLayout';

interface Props {
  email: string;
  resetLink: string;
}

export default function ResetPasswordEmail({ email, resetLink }: Props) {
  return (
    <BaseLayout
      subject="Recupera a tua senha — G&R Consulting"
      preheader="Clica aqui para definir uma nova senha"
    >
      <div>
        <p style={{ color: '#1a1a1a', fontSize: '16px', lineHeight: '1.5', marginTop: 0 }}>
          Olá,
        </p>

        <p style={{ color: '#1a1a1a', fontSize: '16px', lineHeight: '1.5' }}>
          Recebemos um pedido para recuperar a senha da tua conta. Clica no botão abaixo para
          definir uma nova senha.
        </p>

        <div style={{ textAlign: 'center', margin: '32px 0' }}>
          <Button
            href={resetLink}
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
            Recuperar Senha
          </Button>
        </div>

        <p style={{ color: '#666', fontSize: '14px', lineHeight: '1.5' }}>
          Se o botão acima não funcionar, copia e cola este link no teu navegador:
        </p>

        <p style={{ backgroundColor: '#f5f5f5', padding: '12px', borderRadius: '4px', wordBreak: 'break-all' }}>
          <Link href={resetLink} style={{ color: '#F2511B', textDecoration: 'none' }}>
            {resetLink}
          </Link>
        </p>

        <p style={{ color: '#999', fontSize: '12px', lineHeight: '1.5' }}>
          Este link expira em 1 hora. Se não pediste a recuperação de senha, ignora este email.
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
