"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/shared/store/useAppStore";
import { AnimatedButton } from "@/shared/components/AnimatedButton";
import { fadeInUp, staggerContainer, staggerItem, scaleIn } from "@/shared/styles/animations";
import { colors, spacing, fonts, fontSizes, radii, shadows, timing } from "@/shared/styles/design-tokens";

// ─── Store items ──────────────────────────────────────────────

interface StoreItem {
  id: string;
  name: string;
  emoji: string;
  price: number;
  category: "fondos" | "marcos" | "avatares";
}

const STORE_ITEMS: StoreItem[] = [
  // Fondos
  { id: "bg-espacio", name: "Espacio", emoji: "🌌", price: 50, category: "fondos" },
  { id: "bg-selva", name: "Selva", emoji: "🌴", price: 50, category: "fondos" },
  { id: "bg-oceano", name: "Oceano", emoji: "🌊", price: 50, category: "fondos" },
  // Marcos
  { id: "frame-dorado", name: "Dorado", emoji: "✨", price: 100, category: "marcos" },
  { id: "frame-arcoiris", name: "Arcoiris", emoji: "🌈", price: 100, category: "marcos" },
  { id: "frame-estrellas", name: "Estrellas", emoji: "🌟", price: 100, category: "marcos" },
  // Avatares
  { id: "avatar-leon", name: "Leon / Leona", emoji: "🦁", price: 200, category: "avatares" },
  { id: "avatar-pirata", name: "Pirata", emoji: "🏴‍☠️", price: 200, category: "avatares" },
  { id: "avatar-superheroe", name: "Superheroe", emoji: "🦸", price: 200, category: "avatares" },
];

const CATEGORY_META: Record<string, { label: string; icon: string; color: string }> = {
  fondos: { label: "Fondos", icon: "🎨", color: "#667eea" },
  marcos: { label: "Marcos", icon: "🏷️", color: "#f6ad55" },
  avatares: { label: "Avatares", icon: "🎭", color: "#9f7aea" },
};

const PURCHASES_KEY = "doman-store-purchases";

function loadPurchases(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PURCHASES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePurchases(ids: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PURCHASES_KEY, JSON.stringify(ids));
}

// ─── Page ─────────────────────────────────────────────────────

export default function StorePage() {
  const coins = useAppStore((s) => s.coins);
  const addCoins = useAppStore((s) => s.addCoins);
  const [purchases, setPurchases] = useState<string[]>([]);
  const [justBought, setJustBought] = useState<string | null>(null);
  const [showInsufficient, setShowInsufficient] = useState(false);

  useEffect(() => {
    setPurchases(loadPurchases());
  }, []);

  const handleBuy = useCallback((item: StoreItem) => {
    if (purchases.includes(item.id)) return;

    if (coins < item.price) {
      setShowInsufficient(true);
      setTimeout(() => setShowInsufficient(false), 2000);
      return;
    }

    // Deduct coins
    addCoins(-item.price);

    // Save purchase
    const updated = [...purchases, item.id];
    setPurchases(updated);
    savePurchases(updated);

    // Show celebration
    setJustBought(item.id);
    setTimeout(() => setJustBought(null), 1500);
  }, [coins, purchases, addCoins]);

  const categories = ["fondos", "marcos", "avatares"] as const;

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: colors.bg.primary,
      fontFamily: fonts.body,
      padding: spacing.lg,
    }}>
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        style={{ maxWidth: 500, margin: "0 auto", display: "flex", flexDirection: "column", gap: spacing.lg }}
      >
        {/* Header: coins balance */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            textAlign: "center",
            backgroundColor: colors.bg.card,
            borderRadius: radii.xl,
            padding: spacing.xl,
            boxShadow: shadows.md,
            background: "linear-gradient(135deg, #FFF8E1, #FFFDE7)",
            border: "2px solid #FFD54F",
          }}
        >
          <motion.div
            animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
            transition={{ duration: 0.6, delay: 0.3 }}
            style={{ fontSize: 56, marginBottom: spacing.xs }}
          >
            🪙
          </motion.div>
          <div style={{
            fontSize: fontSizes["2xl"],
            fontFamily: fonts.display,
            fontWeight: "bold",
            color: "#F59E0B",
          }}>
            {coins}
          </div>
          <div style={{ fontSize: fontSizes.sm, color: colors.text.muted, marginTop: 2 }}>
            monedas disponibles
          </div>
        </motion.div>

        {/* Insufficient coins toast */}
        <AnimatePresence>
          {showInsufficient && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              style={{
                backgroundColor: "#FEE2E2",
                border: "1px solid #FCA5A5",
                borderRadius: radii.lg,
                padding: `${spacing.sm}px ${spacing.md}px`,
                textAlign: "center",
                fontSize: fontSizes.sm,
                color: "#DC2626",
                fontWeight: "bold",
              }}
            >
              No tienes suficientes monedas
            </motion.div>
          )}
        </AnimatePresence>

        {/* Store categories */}
        {categories.map((cat) => {
          const meta = CATEGORY_META[cat];
          const items = STORE_ITEMS.filter((i) => i.category === cat);

          return (
            <motion.div
              key={cat}
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              style={{
                backgroundColor: colors.bg.card,
                borderRadius: radii.xl,
                padding: spacing.md,
                boxShadow: shadows.sm,
              }}
            >
              <h3 style={{
                fontSize: fontSizes.md,
                fontFamily: fonts.display,
                color: meta.color,
                margin: `0 0 ${spacing.sm}px`,
                display: "flex",
                alignItems: "center",
                gap: spacing.sm,
              }}>
                <span>{meta.icon}</span>
                {meta.label}
              </h3>

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: spacing.sm,
              }}>
                {items.map((item) => {
                  const owned = purchases.includes(item.id);
                  const wasBought = justBought === item.id;

                  return (
                    <motion.div
                      key={item.id}
                      variants={staggerItem}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: spacing.xs,
                        padding: spacing.md,
                        borderRadius: radii.lg,
                        backgroundColor: owned ? `${meta.color}12` : colors.bg.secondary,
                        border: owned ? `2px solid ${meta.color}40` : "2px solid transparent",
                        cursor: owned ? "default" : "pointer",
                        position: "relative",
                        overflow: "hidden",
                        transition: `border-color ${timing.normal}s`,
                      }}
                      onClick={() => !owned && handleBuy(item)}
                    >
                      {/* Purchase celebration overlay */}
                      <AnimatePresence>
                        {wasBought && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0 }}
                            style={{
                              position: "absolute",
                              inset: 0,
                              backgroundColor: `${meta.color}20`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: radii.lg,
                              zIndex: 2,
                            }}
                          >
                            <motion.span
                              variants={scaleIn}
                              initial="initial"
                              animate="animate"
                              style={{ fontSize: 40 }}
                            >
                              🎉
                            </motion.span>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Emoji */}
                      <span style={{ fontSize: 36 }}>{item.emoji}</span>

                      {/* Name */}
                      <span style={{
                        fontSize: fontSizes.xs,
                        fontWeight: "bold",
                        color: colors.text.primary,
                        textAlign: "center",
                      }}>
                        {item.name}
                      </span>

                      {/* Price / Owned */}
                      {owned ? (
                        <span style={{
                          fontSize: fontSizes.xs,
                          color: meta.color,
                          fontWeight: "bold",
                        }}>
                          Adquirido
                        </span>
                      ) : (
                        <span style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 3,
                          fontSize: fontSizes.xs,
                          color: coins >= item.price ? "#F59E0B" : colors.text.placeholder,
                          fontWeight: "bold",
                        }}>
                          <span style={{ fontSize: 14 }}>🪙</span>
                          {item.price}
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}

        {/* Hint */}
        <div style={{
          textAlign: "center",
          fontSize: fontSizes.xs,
          color: colors.text.placeholder,
          padding: `0 ${spacing.md}px`,
          lineHeight: 1.5,
        }}>
          Gana monedas jugando: 1 moneda por respuesta correcta + 5 monedas al completar un juego
        </div>
      </motion.div>
    </div>
  );
}
