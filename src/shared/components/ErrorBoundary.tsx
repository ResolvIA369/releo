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
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error.message, info.componentStack);
  }

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
            Algo salio mal
          </h2>
          <p style={{ fontSize: fontSizes.md, color: colors.text.muted, marginTop: spacing.sm, maxWidth: 400 }}>
            Hubo un problema cargando esta sección. Intenta recargar la página.
          </p>
          {this.state.error && (
            <pre style={{ fontSize: fontSizes.xs, color: colors.error, marginTop: spacing.md, maxWidth: 400, overflow: "auto", textAlign: "left", padding: spacing.sm, backgroundColor: "#fff0f0", borderRadius: radii.sm }}>
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: spacing.lg, padding: `${spacing.sm}px ${spacing.lg}px`,
              borderRadius: radii.lg, border: "none",
              backgroundColor: colors.brand.primary, color: "#fff",
              fontSize: fontSizes.md, fontFamily: fonts.display,
              cursor: "pointer",
            }}
          >
            Recargar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
