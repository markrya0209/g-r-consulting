import type { SessionTypeKey } from "@/lib/supabase/database.types";

export const SESSION_TYPE_META: Record<
  SessionTypeKey,
  { label: string; hint: string }
> = {
  cna: {
    label: "Estratégia de nota CNA",
    hint: "Cálculo e otimização da nota de candidatura",
  },
  provas: {
    label: "Seleção de provas de ingresso",
    hint: "Escolha estratégica das provas a realizar",
  },
  ordem: {
    label: "Ordenação de candidatura",
    hint: "Estratégia de ordenação das opções no CNA",
  },
  curso: {
    label: "Seleção de curso e instituição",
    hint: "Orientação na escolha do curso e universidade",
  },
  equiv: {
    label: "Equivalência de exames",
    hint: "Para estudantes internacionais e da diáspora",
  },
  tutor: {
    label: "Tutoria para exames nacionais",
    hint: "Preparação e apoio para os exames nacionais",
  },
  vida: {
    label: "Vida universitária",
    hint: "Como é realmente a universidade X",
  },
  intl: {
    label: "Vias de acesso internacionais",
    hint: "Processos de admissão para estudantes internacionais",
  },
};

export const ALL_SESSION_TYPE_KEYS: SessionTypeKey[] = [
  "cna",
  "provas",
  "ordem",
  "curso",
  "equiv",
  "tutor",
  "vida",
  "intl",
];

export const UNIVERSITIES = [
  "Instituto Superior Técnico (IST)",
  "Faculdade de Ciências da ULisboa (FCUL)",
  "Nova Faculdade de Ciências Médicas (Nova FCM)",
  "Universidade de Coimbra (UC)",
  "Universidade do Minho (UMinho)",
  "Universidade do Porto (UP)",
  "ISCTE — Instituto Universitário de Lisboa",
  "Universidade de Aveiro",
  "Universidade Nova de Lisboa",
  "Universidade de Évora",
  "Universidade do Algarve",
  "Universidade da Beira Interior",
  "Universidade de Trás-os-Montes e Alto Douro",
  "Universidade dos Açores",
  "Universidade da Madeira",
] as const;

export const LANGUAGES = [
  "Português",
  "Inglês",
  "Espanhol",
  "Francês",
  "Alemão",
  "Italiano",
  "Mandarim",
  "Árabe",
  "Russo",
] as const;

export const YEAR_OPTIONS = [
  { value: 1, label: "1.º ano" },
  { value: 2, label: "2.º ano" },
  { value: 3, label: "3.º ano" },
  { value: 4, label: "4.º ano" },
  { value: 5, label: "5.º ano" },
  { value: 6, label: "Mestrado / Doutoramento" },
] as const;
