"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { GameProps } from "../types";
import type { DomanWord } from "@/shared/types/doman";
import { useGameState } from "../hooks/useGameState";
import { GameShell, usePause } from "./GameShell";
import { useRewards } from "@/shared/components/RewardsLayer";
import { GameIntro } from "./GameIntro";
import { GameCompleteScreen } from "@/shared/components/GameCompleteScreen";
import { FeedbackFlash } from "@/shared/components/FeedbackFlash";
import { VictoryBurst } from "@/shared/components/VictoryBurst";
import { EMOJI_MAP } from "@/shared/constants/emoji-map";
import { colors, spacing, radii, shadows, fontSizes, fonts } from "@/shared/styles/design-tokens";
import { fitWordFontSize } from "@/shared/utils/fitText";
import { tapBounce } from "@/shared/styles/animations";
import { sofiaNameWord, sofiaPlayAudio } from "@/shared/services/sofiaVoice";
import { PHASE1_WORDS, PHASE2_WORDS, PHASE3_WORDS, PHASE4_WORDS, PHASE5_WORDS } from "@/shared/constants";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const GAME_COLOR = "#667eea";

type Phase = "intro" | "announcing" | "playing" | "feedback" | "finished";

const WORDS_BY_PHASE = [PHASE1_WORDS, PHASE2_WORDS, PHASE3_WORDS, PHASE4_WORDS, PHASE5_WORDS];

export const CategoryGame: React.FC<GameProps> = ({ words, phase = 1, onComplete, onBack }) => {
  const { state, recordAttempt, finish, reset } = useGameState("category-sort", { phase });
  const { rewardCorrect } = useRewards();
  const { paused } = usePause();

  const [gamePhase, setGamePhase] = useState<Phase>("intro");
  const [roundIdx, setRoundIdx] = useState(0);
  const [feedbackType, setFeedbackType] = useState<"correct" | "wrong" | null>(null);
  const [burstPos, setBurstPos] = useState<{ x: number; y: number } | null>(null);
  const [score, setScore] = useState<Record<string, number>>({});

  // Use full phase words to ensure multiple categories
  const { categories, roundWords } = useMemo(() => {
    const phaseWords = WORDS_BY_PHASE[phase - 1] ?? words;
    const allWords = phaseWords.length > 10 ? phaseWords : words;
    const catMap = new Map<string, DomanWord[]>();
    allWords.forEach((w) => {
      const list = catMap.get(w.categoryDisplay) ?? [];
      list.push(w);
      catMap.set(w.categoryDisplay, list);
    });
    const validCats = Array.from(catMap.entries())
      .filter(([, ws]) => ws.length >= 2)
      .map(([cat]) => cat);
    const cats = shuffle(validCats).slice(0, Math.min(3, Math.max(2, validCats.length)));
    const rWords = shuffle(allWords.filter((w) => cats.includes(w.categoryDisplay))).slice(0, 12);
    return { categories: cats, roundWords: rWords };
  }, [words, phase]);

  const currentWord = roundWords[roundIdx];
  const finished = roundIdx >= roundWords.length;

  // Announce word with Sofia
  useEffect(() => {
    if (gamePhase !== "announcing" || !currentWord || finished || paused) return;
    let cancelled = false;
    sofiaNameWord(currentWord.text).then(() => {
      if (!cancelled) setTimeout(() => { if (!cancelled) setGamePhase("playing"); }, 300);
    });
    return () => { cancelled = true; };
  }, [gamePhase, roundIdx, paused]); // eslint-disable-line react-hooks/exhaustive-deps

  // Game end
  useEffect(() => {
    if (!finished || gamePhase === "finished") return;
    setGamePhase("finished");
    finish().then(() => onComplete?.(state));
  }, [finished, gamePhase]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCategoryTap = useCallback(
    async (category: string, e: React.MouseEvent) => {
      if (feedbackType || !currentWord || gamePhase !== "playing") return;

      const correct = currentWord.categoryDisplay === category;
      recordAttempt(correct, correct ? currentWord.id : undefined);

      if (correct) {
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        setBurstPos({ x: cx, y: cy });
        rewardCorrect(cx, cy);
        setScore((s) => ({ ...s, [category]: (s[category] ?? 0) + 1 }));
        setFeedbackType("correct");
        await sofiaPlayAudio("celebra-01", `¡${currentWord.text}!`, "excited");
      } else {
        setFeedbackType("wrong");
        await sofiaPlayAudio("animo-04", "¡Busca bien!", "encouraging");
      }

      await new Promise((r) => setTimeout(r, 400));
      setFeedbackType(null);
      setBurstPos(null);
      setRoundIdx((i) => i + 1);
      setGamePhase("announcing");
    },
    [currentWord, feedbackType, gamePhase, recordAttempt]
  );

  const handleReplay = useCallback(() => {
    reset();
    setRoundIdx(0);
    setScore({});
    setGamePhase("intro");
  }, [reset]);

  // Not enough categories
  if (categories.length < 2) {
    return (
      <GameShell title="Categorias" icon="🗂️" color={GAME_COLOR} session={state} onBack={onBack ?? (() => {})}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 300, gap: spacing.lg, textAlign: "center" }}>
          <span style={{ fontSize: 64 }}>🗂️</span>
          <p style={{ fontSize: fontSizes.md, color: colors.text.muted, maxWidth: 300 }}>
            Necesitas palabras de al menos 2 categorias diferentes. Prueba con otro bloque.
          </p>
        </div>
      </GameShell>
    );
  }

  if (gamePhase === "intro") {
    return (
      <GameShell title="Categorias" icon="🗂️" color={GAME_COLOR} session={state} onBack={onBack ?? (() => {})}>
        <GameIntro
          gameName="Categorias"
          gameIcon="🗂️"
          rulesText="¡Pon cada palabra en su categoria! Yo te digo la palabra y tu eliges donde va."
          color={GAME_COLOR}
          onReady={() => setGamePhase("announcing")}
        />
      </GameShell>
    );
  }

  if (gamePhase === "finished" || finished) {
    return (
      <GameShell title="Categorias" icon="🗂️" color={GAME_COLOR} session={state} onBack={onBack ?? (() => {})}>
        <GameCompleteScreen title="Categorias" correct={state.correctAttempts} total={state.totalAttempts} color={GAME_COLOR} onReplay={handleReplay} onBack={onBack ?? (() => {})} />
      </GameShell>
    );
  }

  return (
    <GameShell title="Categorias" icon="🗂️" color={GAME_COLOR} session={state} onBack={onBack ?? (() => {})}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: spacing.lg, paddingTop: spacing.md }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", maxWidth: 600 }}>
          <span style={{ fontSize: fontSizes.sm, color: colors.text.placeholder }}>{roundIdx + 1} / {roundWords.length}</span>
        </div>

        {/* Current word with emoji */}
        {currentWord && (
          <motion.div
            key={currentWord.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: `${spacing.lg}px ${spacing.xl}px`,
              backgroundColor: colors.bg.card, borderRadius: radii.xl,
              boxShadow: shadows.lg, border: `3px solid ${GAME_COLOR}`,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: spacing.xs }}>{EMOJI_MAP[currentWord.text] ?? "❓"}</div>
            <span style={{ fontSize: fitWordFontSize(currentWord.text, fontSizes["3xl"]), fontWeight: "bold", fontFamily: fonts.display, color: GAME_COLOR, whiteSpace: "nowrap" }}>
              {currentWord.text}
            </span>
          </motion.div>
        )}

        {/* Where does it go? */}
        <p style={{ fontSize: fontSizes.md, color: colors.text.muted, margin: 0, fontFamily: fonts.display }}>
          ¿A que categoria pertenece?
        </p>

        {/* Category bins with scores */}
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.md, width: "100%", maxWidth: 600 }}>
          {categories.map((cat) => {
            const catScore = score[cat] ?? 0;
            const isCorrectCat = feedbackType === "correct" && currentWord?.categoryDisplay === cat;
            const isWrongChoice = feedbackType === "wrong" && currentWord?.categoryDisplay !== cat;

            return (
              <motion.button
                key={cat}
                {...(feedbackType ? {} : tapBounce)}
                onClick={(e) => handleCategoryTap(cat, e)}
                disabled={!!feedbackType || gamePhase !== "playing"}
                animate={isCorrectCat ? { scale: [1, 1.05, 1] } : {}}
                style={{
                  padding: `${spacing.md}px ${spacing.lg}px`,
                  borderRadius: radii.xl,
                  backgroundColor: isCorrectCat ? "#c6f6d5" : colors.bg.card,
                  border: `2px solid ${isCorrectCat ? colors.success : colors.border.light}`,
                  boxShadow: isCorrectCat ? shadows.glow(colors.success) : shadows.sm,
                  fontSize: fontSizes.lg,
                  fontWeight: "bold",
                  fontFamily: fonts.display,
                  color: colors.text.primary,
                  cursor: feedbackType ? "default" : "pointer",
                  minHeight: 60,
                  textAlign: "center",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span>{cat}</span>
                {catScore > 0 && (
                  <span style={{ fontSize: fontSizes.sm, color: colors.success, fontWeight: "bold" }}>
                    {catScore} ✓
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {burstPos && (
          <div style={{ position: "fixed", left: 0, top: 0, pointerEvents: "none", zIndex: 999 }}>
            <VictoryBurst active x={burstPos.x} y={burstPos.y} count={8} />
          </div>
        )}
      </div>
      <FeedbackFlash type={feedbackType} />
    </GameShell>
  );
};
