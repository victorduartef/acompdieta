// ── EvoShape — Tema do Redesign (Fase 1) ──
// Tokens semânticos novos. NÃO substituem DARK/LIGHT do App.jsx (que seguem em uso).
// Usados pela nova Visão Geral, Sidebar e componentes do redesign.

export const EVOSHAPE_DARK = {
  appBackground: "#080D12",
  sidebarBackground: "#071016",
  surfacePrimary: "#10171F",
  surfaceElevated: "#151E28",
  surfaceHover: "#1A2530",
  border: "#24313D",
  borderSoft: "rgba(145, 160, 173, 0.14)",

  textPrimary: "#F3F7F9",
  textSecondary: "#91A0AD",
  textMuted: "#647481",

  accentTeal: "#63E6C8",
  accentBlue: "#69A9FF",
  accentOrange: "#F39A56",
  accentPurple: "#A487FF",
  accentRed: "#FF6F76",
  accentAmber: "#F3C15B",

  positiveBackground: "rgba(99, 230, 200, 0.10)",
  negativeBackground: "rgba(255, 111, 118, 0.10)",
  activeBackground: "rgba(99, 230, 200, 0.12)",
}

// Tema claro do redesign — mantém funcional, refinado depois.
export const EVOSHAPE_LIGHT = {
  appBackground: "#f4f6f8",
  sidebarBackground: "#ffffff",
  surfacePrimary: "#ffffff",
  surfaceElevated: "#f7f9fb",
  surfaceHover: "#eef2f5",
  border: "#e2e8ee",
  borderSoft: "rgba(100, 116, 129, 0.14)",

  textPrimary: "#0f1a24",
  textSecondary: "#5a6b78",
  textMuted: "#8b9aa6",

  accentTeal: "#0ea88c",
  accentBlue: "#2f7fe0",
  accentOrange: "#e08036",
  accentPurple: "#7c5fe0",
  accentRed: "#e0545a",
  accentAmber: "#d4a030",

  positiveBackground: "rgba(14, 168, 140, 0.10)",
  negativeBackground: "rgba(224, 84, 90, 0.10)",
  activeBackground: "rgba(14, 168, 140, 0.12)",
}

// Semântica de cores por domínio (para uso consistente no redesign).
// azul = corpo/peso · laranja = alimentação · roxo = sono · teal = progresso/meta
// vermelho = atenção · âmbar = metas/consistência
export const domainColor = (T, domain) => ({
  corpo: T.accentBlue,
  peso: T.accentBlue,
  alimentacao: T.accentOrange,
  kcal: T.accentOrange,
  sono: T.accentPurple,
  progresso: T.accentTeal,
  passos: T.accentTeal,
  atencao: T.accentRed,
  metas: T.accentAmber,
}[domain] || T.accentTeal)

export const getEvoTheme = (darkMode) => (darkMode ? EVOSHAPE_DARK : EVOSHAPE_LIGHT)
