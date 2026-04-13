"use client";

import React from "react";
import { colors, fonts, fontSizes, spacing, radii } from "@/shared/styles/design-tokens";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error.message, info.componentStack);
  }

  handleRetry = () => {
    this.setState((s) => ({
      hasError: false,
      error: null,
      retryCount: s.retryCount + 1,
    }));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div style={{
          minHeight: "100vh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: spacing.xl, textAlign: "center",
          fontFamily: fonts.body,
        }}>
          <span style={{ fontSize: 64, marginBottom: spacing.md }}>😕</span>
          <h2 style={{ fontSize: fontSizes["2xl"], fontFamily: fonts.display, color: colors.text.primary, margin: 0 }}>
            Algo salió mal
          </h2>
          <p style={{ fontSize: fontSizes.md, color: colors.text.muted, marginTop: spacing.sm, maxWidth: 400 }}>
            Hubo un problema. Tocá el botón para reintentar.
          </p>
          <div style={{ display: "flex", gap: spacing.md, marginTop: spacing.lg }}>
            <button
              onClick={this.handleRetry}
              style={{
                padding: `${spacing.sm}px ${spacing.lg}px`,
                borderRadius: radii.lg, border: "none",
                backgroundColor: colors.brand.primary, color: "#fff",
                fontSize: fontSizes.md, fontFamily: fonts.display,
                cursor: "pointer",
              }}
            >
              🔄 Reintentar
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: `${spacing.sm}px ${spacing.lg}px`,
                borderRadius: radii.lg,
                backgroundColor: "#FFF8E1", color: "#92400E",
                border: "2px solid #FFD54F",
                fontSize: fontSizes.md, fontFamily: fonts.display,
                cursor: "pointer",
              }}
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
