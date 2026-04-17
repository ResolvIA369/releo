"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useCallback, Suspense } from "react";
import { motion } from "framer-motion";
import type { DomanWord, PhaseNumber } from "@/shared/types/doman";
import { GAME_REGISTRY } from "@/features/games/config/game-registry";
import { getSession, CURRICULUM } from "@/features/session/config/curriculum";
import { useAppStore } from "@/shared/store/useAppStore";
import { PHASE1_WORDS, PHASE2_WORDS, PHASE3_WORDS, PHASE4_WORDS, PHASE5_WORDS } from "@/shared/constants";
import type { DomanWord as DomanWordType } from "@/shared/types/doman";
import { GameSetup } from "@/features/games/components/GameSetup";
import { WordFlash } from "@/features/games/components/WordFlash";
import { WordImageMatch } from "@/features/games/components/WordImageMatch";
import { MemoryCards } from "@/features/games/components/MemoryCards";
import { WordRain } from "@/features/games/components/WordRain";
import { WordTrain } from "@/features/games/components/WordTrain";
import { BuildSentence } from "@/features/games/components/BuildSentence";
import { StoryReader } from "@/features/games/components/StoryReader";
import { CategoryGame } from "@/features/games/components/CategoryGame";
import { WordFishing } from "@/features/games/components/WordFishing";
import { BitsReading } from "@/features/games/components/BitsReading";
import { SofiaAvatar } from "@/shared/components/SofiaAvatar";
import { CelebrationGif } from "@/shared/components/CelebrationGif";
import { AnimatedButton } from "@/shared/components/AnimatedButton";
import { RewardsProvider } from "@/shared/components/RewardsLayer";
import { ErrorBoundary } from "@/shared/components/ErrorBoundary";
import type { GameId, GameProps, GameSessionState } from "@/features/games/types";
import type { FC } from "react";
import { colors, fonts, fontSizes, spacing, radii } from "@/shared/styles/design-tokens";

const GAME_COMPONENTS: Partial<Record<GameId, FC<GameProps>>> = {
  "word-flash": WordFlash,
  "word-image-match": WordImageMatch,
  "memory-cards": MemoryCards,
  "word-rain": WordRain,
  "word-train": WordTrain,
  "phrase-builder": BuildSentence,
  "story-reader": StoryReader,
  "category-sort": CategoryGame,
  "word-fishing": WordFishing,
  "daily-bits": BitsReading,
};

// Games that need more words for variety (categories, fishing, rain)
const GAMES_WITH_10_WORDS: GameId[] = ["word-train", "category-sort", "word-rain", "word-fishing"];

function GamePageInner() {
  const params = useParams<{ gameId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const completeSession = useAppStore((s) => s.completeSession);

  const gameId = params.gameId as GameId;
  const meta = GAME_REGISTRY.find((g) => g.id === gameId);
  const GameComponent = GAME_COMPONENTS[gameId];

  const sessionParam = searchParams.get("session");

  // State
  const [selectedWords, setSelectedWords] = useState<DomanWord[] | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<PhaseNumber>(1);
  const [selectedWorldId, setSelectedWorldId] = useState<string | undefined>(undefined);
  const [selectedWorldIdx, setSelectedWorldIdx] = useState<number | null>(null);
  const [selectedBlockIdx, setSelectedBlockIdx] = useState<number>(0);
  const [postGame, setPostGame] = useState<GameSessionState | null>(null);
  const [gameKey, setGameKey] = useState(0);
  const [forceBlockSelection, setForceBlockSelection] = useState(false);

  // If word-flash comes with ?session=, load those words directly
  const preloadedSession = useMemo(() => {
    if (gameId === "word-flash" && sessionParam) {
      return getSession(parseInt(sessionParam, 10)) ?? null;
    }
    return null;
  }, [gameId, sessionParam]);

  const activeWords = selectedWords ?? preloadedSession?.words ?? null;
  const activePhase = selectedWords ? selectedPhase : (preloadedSession?.phase ?? 1);
  const sessionId = preloadedSession?.id ?? 0;

  const wordsPerBlock = GAMES_WITH_10_WORDS.includes(gameId) ? 10 : 5;

  // Compute the list of N-word blocks for the current world. IMPORTANT:
  // useMemo must be called unconditionally before any early return, or
  // we break React's rule of hooks between renders.
  const PHASE_WORD_LISTS: DomanWordType[][] = useMemo(
    () => [PHASE1_WORDS, PHASE2_WORDS, PHASE3_WORDS, PHASE4_WORDS, PHASE5_WORDS],
    [],
  );
  const blocksForCurrentWorld: DomanWordType[][] = useMemo(() => {
    if (selectedWorldIdx === null) return [];
    const phaseWords = PHASE_WORD_LISTS[selectedWorldIdx] ?? [];
    const chunks: DomanWordType[][] = [];
    for (let i = 0; i < phaseWords.length; i += wordsPerBlock) {
      const c = phaseWords.slice(i, i + wordsPerBlock);
      if (c.length < 3) break;
      chunks.push(c);
    }
    return chunks;
  }, [selectedWorldIdx, wordsPerBlock, PHASE_WORD_LISTS]);

  const hasNextBlock = selectedWorldIdx !== null && selectedBlockIdx + 1 < blocksForCurrentWorld.length;

  // ─── Not found ──────────────────────────────────────────────

  if (!meta || !GameComponent) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: spacing.lg,
        fontFamily: fonts.body, backgroundColor: colors.bg.primary,
      }}>
        <SofiaAvatar size={48} speaking={false} />
        <h1 style={{ fontSize: fontSizes["2xl"], fontFamily: fonts.display, color: colors.text.primary, margin: 0 }}>
          Juego no encontrado
        </h1>
        <AnimatedButton onClick={() => router.push("/dashboard")}>Volver</AnimatedButton>
      </div>
    );
  }

  // ─── Step 1: GameSetup (world → block selection) ────────────

  if (!activeWords) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: colors.bg.primary, fontFamily: fonts.body, padding: spacing.lg }}>
        <button
          onClick={() => router.push("/dashboard")}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: fontSizes.sm, color: colors.text.muted, marginBottom: spacing.md }}
        >
          ← Volver al menu
        </button>
        <GameSetup
          gameIcon={meta.icon}
          gameName={meta.name}
          gameColor={meta.color}
          wordsPerBlock={wordsPerBlock as 5 | 10}
          initialWorldIdx={forceBlockSelection ? selectedWorldIdx : null}
          onSelect={(words, phase, worldId, worldIdx, blockIdx) => {
            setSelectedWords(words);
            setSelectedPhase(phase);
            setSelectedWorldId(worldId);
            setSelectedWorldIdx(worldIdx);
            setSelectedBlockIdx(blockIdx);
            setForceBlockSelection(false);
          }}
        />
      </div>
    );
  }

  // ─── Handlers ───────────────────────────────────────────────

  const handleComplete = async (result?: GameSessionState) => {
    if (sessionId > 0) {
      await completeSession(sessionId);
    }
    // Coins are now awarded by GameCompleteScreen as part of the
    // chest animation (1 per correct + 5 bonus).
    setPostGame(result ?? {
      gameId, score: 0, totalAttempts: 0, correctAttempts: 0,
      startedAt: Date.now(), wordsCompleted: [],
    });
  };

  const handlePlayAgain = () => {
    setPostGame(null);
    setGameKey((k) => k + 1);
  };

  // Go all the way back to world selection
  const handleChangeWorld = () => {
    setPostGame(null);
    setSelectedWords(null);
    setSelectedWorldIdx(null);
    setForceBlockSelection(false);
  };

  // Go back to the block grid of the current world (keeps world picked)
  const handleChangeBlock = () => {
    setPostGame(null);
    setSelectedWords(null);
    setForceBlockSelection(true);
  };

  const handleNextBlock = () => {
    if (!hasNextBlock) return;
    const nextIdx = selectedBlockIdx + 1;
    const nextWords = blocksForCurrentWorld[nextIdx];
    if (!nextWords) return;
    setSelectedWords(nextWords);
    setSelectedBlockIdx(nextIdx);
    setPostGame(null);
    setGameKey((k) => k + 1);
  };

  // ─── Post-game results ──────────────────────────────────────

  if (postGame) {
    const pct = postGame.totalAttempts > 0
      ? Math.round((postGame.correctAttempts / postGame.totalAttempts) * 100)
      : 0;
    const stars = pct >= 90 ? 3 : pct >= 60 ? 2 : 1;

    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        backgroundColor: "#FFFFFF", fontFamily: fonts.body, padding: spacing.xl,
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: spacing.lg, maxWidth: 400, width: "100%",
          }}
        >
          {/* Celebration / motivation video */}
          <div style={{ borderRadius: 16, overflow: "hidden", maxWidth: "min(320px, 85vw)" }}>
            <video
              src={stars >= 2
                ? `/videos/leo-celebration-${((postGame.correctAttempts ?? 0) % 3) + 1}.mp4`
                : "/videos/sofia-esfuerzo.mp4"}
              autoPlay playsInline controls={false}
              onError={(e) => { (e.target as HTMLVideoElement).style.display = "none"; }}
              style={{ width: "100%", borderRadius: 16, display: "block", backgroundColor: "transparent" }}
            />
          </div>

          <div style={{ display: "flex", gap: spacing.sm, fontSize: 48 }}>
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 + i * 0.2, type: "spring", damping: 8 }}
                style={{ filter: i < stars ? "none" : "grayscale(1) opacity(0.25)" }}
              >
                ⭐
              </motion.span>
            ))}
          </div>

          <h2 style={{ fontSize: fontSizes["2xl"], fontFamily: fonts.display, color: colors.text.primary, margin: 0 }}>
            ¡Sesion completa!
          </h2>

          {postGame.totalAttempts > 0 && (
            <p style={{ fontSize: fontSizes.md, color: colors.text.muted, margin: 0 }}>
              {postGame.correctAttempts}/{postGame.totalAttempts} correctas ({pct}%)
            </p>
          )}

          {/* Coins earned */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, type: "spring", damping: 8 }}
            style={{
              display: "flex", alignItems: "center", gap: spacing.sm,
              backgroundColor: "#FFF8E1", borderRadius: radii.pill,
              padding: `${spacing.xs}px ${spacing.md}px`,
              border: "2px solid #FFD54F",
            }}
          >
            <span style={{ fontSize: 24 }}>🪙</span>
            <span style={{ fontSize: fontSizes.lg, fontWeight: "bold", color: "#F59E0B", fontFamily: fonts.display }}>
              +{(postGame.correctAttempts ?? 0) + 5}
            </span>
          </motion.div>

          <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm, width: "100%", marginTop: spacing.md }}>
            {hasNextBlock && (
              <AnimatedButton onClick={handleNextBlock} color={meta.color}>
                Siguiente grupo →
              </AnimatedButton>
            )}
            <AnimatedButton onClick={handlePlayAgain} color={meta.color}>
              Jugar de nuevo
            </AnimatedButton>
            <AnimatedButton variant="secondary" onClick={handleChangeBlock}>
              Cambiar palabras
            </AnimatedButton>
            <AnimatedButton variant="secondary" onClick={handleChangeWorld}>
              Cambiar de mundo
            </AnimatedButton>
            <AnimatedButton variant="secondary" onClick={() => router.push("/dashboard")}>
              Volver al menu
            </AnimatedButton>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Playing ────────────────────────────────────────────────

  return (
    <ErrorBoundary key={`eb-${gameKey}`}>
      <RewardsProvider>
        <GameComponent
          key={gameKey}
          words={activeWords}
          phase={activePhase}
          worldId={selectedWorldId}
          onComplete={handleComplete}
          onBack={() => router.push("/dashboard")}
        />
      </RewardsProvider>
    </ErrorBoundary>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#fff" }}>
        Cargando...
      </div>
    }>
      <GamePageInner />
    </Suspense>
  );
}
