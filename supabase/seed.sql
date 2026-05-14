-- Dev seed data — realistic Portuguese university data
-- Run after migrations: psql $DATABASE_URL < supabase/seed.sql

-- ─── Universities ─────────────────────────────────────────────────────────────
-- Used as allowed values for mentor_profiles.university
-- IST, FCUL, Nova FCM, UC Coimbra, UMinho, UP

-- ─── Seed mentors (dev only — requires auth.users rows created via Supabase dashboard or sign-up) ──────
-- Replace UUIDs below with real auth.users IDs from your dev Supabase project.

-- Ana Silva — IST, Engenharia Informática, 3rd year
INSERT INTO users (id, email, display_name, role, email_verified)
VALUES ('00000000-0000-0000-0000-000000000001', 'ana.silva@dev.test', 'Ana Silva', 'mentor', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO mentor_profiles (
  id, user_id, slug, bio, university, faculty, course, year,
  languages, is_active, stripe_payouts_enabled,
  avg_rating, session_count, bayesian_score, onboarding_step
) VALUES (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'ana-silva',
  'Estudante de 3º ano de EI no IST. Passei pelo CNA em 2022 com nota 18,8. Especializo-me em estratégia de candidatura e cálculo de nota.',
  'IST', 'DEI', 'Engenharia Informática', 3,
  ARRAY['pt','en'], true, true,
  4.9, 23, 4.822, 4
) ON CONFLICT (id) DO NOTHING;

-- Pedro Santos — Nova FCM, Medicina, 2nd year
INSERT INTO users (id, email, display_name, role, email_verified)
VALUES ('00000000-0000-0000-0000-000000000002', 'pedro.santos@dev.test', 'Pedro Santos', 'mentor', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO mentor_profiles (
  id, user_id, slug, bio, university, faculty, course, year,
  languages, is_active, stripe_payouts_enabled,
  avg_rating, session_count, bayesian_score, onboarding_step
) VALUES (
  '10000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000002',
  'pedro-santos',
  'Estudante de Medicina na Nova FCM. Entrei com 19,4. Ajudo candidatos ao concurso médico e com seleção de provas para ciências da saúde.',
  'Nova FCM', 'Medicina', 'Medicina', 2,
  ARRAY['pt'], true, true,
  4.8, 15, 4.770, 4
) ON CONFLICT (id) DO NOTHING;

-- Maria Costa — UC Coimbra, Direito, 4th year
INSERT INTO users (id, email, display_name, role, email_verified)
VALUES ('00000000-0000-0000-0000-000000000003', 'maria.costa@dev.test', 'Maria Costa', 'mentor', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO mentor_profiles (
  id, user_id, slug, bio, university, faculty, course, year,
  languages, is_active, stripe_payouts_enabled,
  avg_rating, session_count, bayesian_score, onboarding_step
) VALUES (
  '10000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000003',
  'maria-costa',
  'Quarto ano de Direito em Coimbra. Entrei pelo contingente geral com 17,2. Ajudo a ordenar candidaturas e entender a realidade do curso.',
  'UC Coimbra', 'FDUC', 'Direito', 4,
  ARRAY['pt','fr'], true, true,
  4.7, 8, 4.695, 4
) ON CONFLICT (id) DO NOTHING;

-- João Ferreira — UP, Economia, 2nd year
INSERT INTO users (id, email, display_name, role, email_verified)
VALUES ('00000000-0000-0000-0000-000000000004', 'joao.ferreira@dev.test', 'João Ferreira', 'mentor', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO mentor_profiles (
  id, user_id, slug, bio, university, faculty, course, year,
  languages, is_active, stripe_payouts_enabled,
  avg_rating, session_count, bayesian_score, onboarding_step
) VALUES (
  '10000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000004',
  'joao-ferreira',
  'Estudante de Economia na FEP. Fui aluno internacional e naveguei as equivalências de exames. Fluente em inglês e espanhol.',
  'UP', 'FEP', 'Economia', 2,
  ARRAY['pt','en','es'], true, true,
  4.6, 5, 4.627, 4
) ON CONFLICT (id) DO NOTHING;

-- Inês Rodrigues — UMinho, Biologia, 3rd year
INSERT INTO users (id, email, display_name, role, email_verified)
VALUES ('00000000-0000-0000-0000-000000000005', 'ines.rodrigues@dev.test', 'Inês Rodrigues', 'mentor', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO mentor_profiles (
  id, user_id, slug, bio, university, faculty, course, year,
  languages, is_active, stripe_payouts_enabled,
  avg_rating, session_count, bayesian_score, onboarding_step
) VALUES (
  '10000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000005',
  'ines-rodrigues',
  'Terceiro ano de Biologia na UMinho. Passei pelo CNA em 2022. Especializo-me em tutoria de Biologia e Química para exames nacionais.',
  'UMinho', 'Biologia', 'Biologia', 3,
  ARRAY['pt'], true, true,
  5.0, 3, 4.697, 4
) ON CONFLICT (id) DO NOTHING;

-- Tomás Oliveira — FCUL, Arquitetura (IST), 1st year
INSERT INTO users (id, email, display_name, role, email_verified)
VALUES ('00000000-0000-0000-0000-000000000006', 'tomas.oliveira@dev.test', 'Tomás Oliveira', 'mentor', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO mentor_profiles (
  id, user_id, slug, bio, university, faculty, course, year,
  languages, is_active, stripe_payouts_enabled,
  avg_rating, session_count, bayesian_score, onboarding_step
) VALUES (
  '10000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000006',
  'tomas-oliveira',
  'Primeiro ano de Arquitetura no IST. Passei pelo CNA via candidatura internacional vindo do Brasil. Ajudo estudantes da diáspora com as equivalências.',
  'IST', 'Arquitetura', 'Arquitetura', 1,
  ARRAY['pt','en'], true, true,
  4.9, 2, 4.618, 4
) ON CONFLICT (id) DO NOTHING;

-- ─── Session types for Ana Silva ──────────────────────────────────────────────
INSERT INTO session_types (mentor_profile_id, type_key, is_enabled, description, price_cents)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'cna',    true, 'Calculamos juntos a tua nota de candidatura e optimizamos a estratégia.', 3000),
  ('10000000-0000-0000-0000-000000000001', 'provas', true, 'Escolha das provas certas para maximizar a tua nota final.', 2500),
  ('10000000-0000-0000-0000-000000000001', 'ordem',  true, 'Ordenação das 6 opções CNA com base nas médias dos últimos 3 anos.', 2000),
  ('10000000-0000-0000-0000-000000000001', 'curso',  true, 'Sessão sobre o dia-a-dia no IST e o que esperar do curso.', 2000)
ON CONFLICT (mentor_profile_id, type_key) DO NOTHING;

-- Session types for Pedro Santos
INSERT INTO session_types (mentor_profile_id, type_key, is_enabled, description, price_cents)
VALUES
  ('10000000-0000-0000-0000-000000000002', 'cna',    true, 'Estratégia de nota para candidatos à área da saúde.', 3500),
  ('10000000-0000-0000-0000-000000000002', 'provas', true, 'Provas específicas para Medicina e Ciências Farmacêuticas.', 3000),
  ('10000000-0000-0000-0000-000000000002', 'curso',  true, 'Como é realmente a vida em Medicina na Nova FCM.', 2000),
  ('10000000-0000-0000-0000-000000000002', 'tutor',  true, 'Tutoria intensiva em Biologia e Química para exames nacionais.', 4000)
ON CONFLICT (mentor_profile_id, type_key) DO NOTHING;

-- Session types for Maria Costa
INSERT INTO session_types (mentor_profile_id, type_key, is_enabled, description, price_cents)
VALUES
  ('10000000-0000-0000-0000-000000000003', 'ordem',  true, 'Ordenação de candidatura para cursos de Direito e Ciências Sociais.', 2000),
  ('10000000-0000-0000-0000-000000000003', 'curso',  true, 'Tudo sobre o dia-a-dia em Direito em Coimbra.', 2500)
ON CONFLICT (mentor_profile_id, type_key) DO NOTHING;

-- Session types for João Ferreira (international focus)
INSERT INTO session_types (mentor_profile_id, type_key, is_enabled, description, price_cents)
VALUES
  ('10000000-0000-0000-0000-000000000004', 'equiv',  true, 'Conversão de sistemas escolares estrangeiros para o sistema português.', 3500),
  ('10000000-0000-0000-0000-000000000004', 'intl',   true, 'Candidatura internacional, Erasmus e dupla licenciatura.', 3000),
  ('10000000-0000-0000-0000-000000000004', 'curso',  true, 'Economia na FEP — ambiente, empregabilidade, estágios.', 2000)
ON CONFLICT (mentor_profile_id, type_key) DO NOTHING;

-- Session types for Inês Rodrigues
INSERT INTO session_types (mentor_profile_id, type_key, is_enabled, description, price_cents)
VALUES
  ('10000000-0000-0000-0000-000000000005', 'tutor',  true, 'Tutoria de Biologia e Química para exames nacionais — enfoque em erros comuns.', 3000),
  ('10000000-0000-0000-0000-000000000005', 'cna',    true, 'Estratégia CNA para candidatos à área das ciências.', 2500)
ON CONFLICT (mentor_profile_id, type_key) DO NOTHING;

-- Session types for Tomás Oliveira
INSERT INTO session_types (mentor_profile_id, type_key, is_enabled, description, price_cents)
VALUES
  ('10000000-0000-0000-0000-000000000006', 'equiv',  true, 'Equivalências para estudantes brasileiros e da CPLP.', 3500),
  ('10000000-0000-0000-0000-000000000006', 'intl',   true, 'Guia completo para candidatos internacionais ao ensino superior português.', 3000),
  ('10000000-0000-0000-0000-000000000006', 'curso',  true, 'Arquitetura no IST — portfólio, provas específicas, dia-a-dia.', 2000)
ON CONFLICT (mentor_profile_id, type_key) DO NOTHING;
