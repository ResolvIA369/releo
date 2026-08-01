"use client";

import Link from "next/link";
import { preload } from "react-dom";
import { usePathname } from "next/navigation";
import { ProfileGuard } from "@/features/onboarding/components/ProfileGuard";
import { useAppStore } from "@/shared/store/useAppStore";
import { SofiaAvatar } from "@/shared/components/SofiaAvatar";
import { colors, spacing, fonts, fontSizes, shadows, radii } from "@/shared/styles/design-tokens";

function DarkModeToggle() {
  const darkMode = useAppStore((s) => s.darkMode);
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode);

  return (
    <button
      onClick={toggleDarkMode}
      aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        width: 36,
        height: 36,
        borderRadius: radii.full,
        backgroundColor: darkMode ? "#2d3748" : colors.bg.secondary,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 18,
        border: "none",
        cursor: "pointer",
      }}
    >
      {darkMode ? "\u2600\uFE0F" : "\uD83C\uDF19"}
    </button>
  );
}

function AppHeader() {
  const profile = useAppStore((s) => s.profile);
  const status = useAppStore((s) => s.profileStatus);
  const pathname = usePathname();

  // Don't show header on game screens (full-screen experience)
  const isGameScreen = pathname.startsWith("/play/") && pathname.split("/").length > 2;
  if (isGameScreen) return null;

  const childName = status === "ready" && profile ? profile.childName : "...";

  return (
    <header style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: `${spacing.sm}px ${spacing.lg}px`,
      backgroundColor: colors.bg.card,
      borderBottom: `1px solid ${colors.border.light}`,
      boxShadow: shadows.sm,
      position: "sticky",
      top: 0,
      zIndex: 50,
    }}>
      {/* Left: REleo logo + link to dashboard */}
      <Link href="/dashboard" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: spacing.sm }}>
        <img src="/images/logo/releo.png" alt="REleo" style={{ height: 36, width: "auto", objectFit: "contain" }} />
      </Link>

      {/* Center: Child name */}
      <span style={{
        fontSize: fontSizes.lg,
        fontFamily: fonts.display,
        fontWeight: "bold",
        color: colors.text.primary,
      }}>
        {childName}
      </span>

      {/* Right: Dark mode toggle + Store + Calendar + Profile + Parents links */}
      <div style={{ display: "flex", gap: spacing.sm, alignItems: "center" }}>
        <DarkModeToggle />
        <Link href="/store" style={{
          textDecoration: "none", width: 36, height: 36, borderRadius: radii.full,
          backgroundColor: "#FFF8E1", display: "flex",
          alignItems: "center", justifyContent: "center", fontSize: 18,
          border: "1px solid #FFD54F",
        }}>
          🏪
        </Link>
        <Link href="/calendar" style={{
          textDecoration: "none", width: 36, height: 36, borderRadius: radii.full,
          backgroundColor: colors.bg.secondary, display: "flex",
          alignItems: "center", justifyContent: "center", fontSize: 18,
        }}>
          {"\uD83D\uDCC5"}
        </Link>
        <Link href="/profile" style={{
          textDecoration: "none", width: 36, height: 36, borderRadius: radii.full,
          backgroundColor: colors.bg.secondary, display: "flex",
          alignItems: "center", justifyContent: "center", fontSize: 18,
        }}>
          🧒
        </Link>
        <Link href="/parents" style={{
          textDecoration: "none", fontSize: 11, color: colors.text.placeholder,
          padding: `2px ${spacing.xs}px`,
        }}>
          👨‍👩‍👧
        </Link>
      </div>
    </header>
  );
}

// Leo y Sofía aparecen apenas arranca un juego, así que conviene tenerlos
// bajados de antemano — pero solo dentro de la app, no en la landing pública.
const CHARACTER_IMAGES = [
  "/images/Leo/motivando.png",
  "/images/Leo/felicitando.png",
  "/images/Leo/animate.png",
  "/images/Leo/esfuerzate.png",
  "/images/sofia/sofia-default.png",
  "/images/sofia/sofia-clapping.png",
  "/images/sofia/sofia-motivating.png",
];

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  CHARACTER_IMAGES.forEach((href) => preload(href, { as: "image" }));

  return (
    <ProfileGuard>
      <div style={{ minHeight: "100vh" }}>
        <AppHeader />
        <main>{children}</main>
      </div>
    </ProfileGuard>
  );
}
