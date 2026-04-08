// ═══════════════════════════════════════════════════════════════════════
// Design Tokens (JS) — Used by game components with inline styles
// For Tailwind classes, use design-tokens.css instead.
// ═══════════════════════════════════════════════════════════════════════

export const colors = {
  brand: { primary: "#667eea", secondary: "#764ba2", accent: "#f093fb" },
  success: "#48bb78",
  error: "#e53e3e",
  warning: "#fbbf24",
  info: "#4299e1",
  world: { 1: "#48bb78", 2: "#667eea", 3: "#fbbf24", 4: "#f56565", 5: "#f093fb" } as Record<number, string>,
  doman: { wordRed: "#e53e3e", wordBlack: "#2d3748" },
  text: { primary: "var(--text-primary, #2d3748)", secondary: "#4a5568", muted: "var(--text-muted, #718096)", placeholder: "var(--text-placeholder, #a0aec0)", inverse: "#ffffff" },
  bg: { primary: "var(--bg-primary, #f8f9fc)", secondary: "var(--bg-secondary, #f0f4ff)", card: "var(--bg-card, #ffffff)", overlay: "rgba(0,0,0,0.4)", overlayLight: "rgba(0,0,0,0.15)" },
  border: { light: "var(--border-light, #e2e8f0)", medium: "#cbd5e0", focus: "#667eea" },
  rarity: { common: "#a0aec0", rare: "#4299e1", epic: "#9f7aea", legendary: "#f6ad55" },
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, "2xl": 48, "3xl": 64 } as const;

export const fonts = {
  display: "Arial Rounded MT Bold, Arial, sans-serif",
  body: "Arial, sans-serif",
} as const;

export const fontSizes = {
  xs: 11, sm: 13, md: 16, lg: 20, xl: 24,
  "2xl": 28, "3xl": 36, "4xl": 48, "5xl": 64, "6xl": 80, "7xl": 96,
  domanWord: 96, domanWordLarge: 120,
} as const;

export const fontWeights = { normal: "normal" as const, bold: "bold" as const };

export const radii = { sm: 8, md: 12, lg: 16, xl: 20, "2xl": 28, full: "50%", pill: 9999 } as const;

export const shadows = {
  sm: "0 2px 8px rgba(0,0,0,0.04)",
  md: "0 4px 16px rgba(0,0,0,0.08)",
  lg: "0 8px 32px rgba(0,0,0,0.12)",
  glow: (color: string) => `0 0 0 4px ${color}30, 0 4px 16px rgba(0,0,0,0.08)`,
  button: "0 4px 12px rgba(0,0,0,0.15)",
} as const;

export const gradients = {
  brand: `linear-gradient(135deg, ${colors.brand.primary}, ${colors.brand.secondary})`,
  brandAccent: `linear-gradient(135deg, ${colors.brand.primary}, ${colors.brand.accent})`,
  celebration: `linear-gradient(135deg, ${colors.warning}, ${colors.brand.accent}, ${colors.brand.primary})`,
  ocean: "linear-gradient(180deg, #e0f7fa 0%, #0277bd 70%, #01579b 100%)",
  sky: "linear-gradient(180deg, #ebf8ff 0%, #bee3f8 100%)",
  sunset: "linear-gradient(135deg, #f6ad55, #f093fb, #667eea)",
  worldBg: (color: string) => `linear-gradient(135deg, ${color}ee, ${color}cc)`,
} as const;

export const zIndex = { base: 0, header: 10, overlay: 50, modal: 100, celebration: 200, tooltip: 300, max: 500 } as const;

export const timing = {
  fast: 0.15, normal: 0.3, slow: 0.5,
  spring: { type: "spring" as const, damping: 12, mass: 0.5 },
  springBouncy: { type: "spring" as const, damping: 8, mass: 0.6 },
  springGentle: { type: "spring" as const, damping: 15, mass: 0.8 },
} as const;
