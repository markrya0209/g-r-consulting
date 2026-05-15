import { Html, Head, Body, Container, Preview } from '@react-email/components';
import React from 'react';

interface Props {
  subject: string;
  preheader?: string;
  children: React.ReactNode;
}

export default function BaseLayout({ subject, preheader, children }: Props) {
  return (
    <Html lang="pt">
      <Head>
        <title>{subject}</title>
        {preheader && <Preview>{preheader}</Preview>}
      </Head>
      <Body
        style={{
          fontFamily: '"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          backgroundColor: '#FBF9F5',
          margin: 0,
          padding: 0,
        }}
      >
        <Container
          style={{
            maxWidth: '600px',
            margin: '0 auto',
            padding: '20px',
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
          }}
        >
          <div style={{ marginBottom: '24px', textAlign: 'center' }}>
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#1a1a1a',
                margin: '0 0 8px 0',
              }}
            >
              G&R Consulting
            </h1>
            <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
              Mentoria para o CNA
            </p>
          </div>

          {children}

          <div
            style={{
              marginTop: '32px',
              paddingTop: '16px',
              borderTop: '1px solid #e5e5e5',
              fontSize: '12px',
              color: '#999',
              textAlign: 'center',
            }}
          >
            <p>© 2026 G&R Consulting. Todos os direitos reservados.</p>
            <p>
              <a href="https://grmentoria.pt" style={{ color: '#F2511B', textDecoration: 'none' }}>
                Visita o nosso site
              </a>
            </p>
          </div>
        </Container>
      </Body>
    </Html>
  );
}
