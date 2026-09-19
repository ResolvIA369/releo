"use client";

import React from "react";
import { motion } from "framer-motion";
import type { GameProps } from "../../types";
import { FlipCard } from "@/shared/components/FlipCard";
import { QuickCelebration } from "@/shared/components/QuickCelebration";
import { AudioWaves, ProgressLine } from "@/shared/components/doman-visuals";
import { TimeBar } from "@/shared/components/TimeBar";
import { SofiaAvatar } from "@/shared/components/SofiaAvatar";
import { CelebrationGif } from "@/shared/components/CelebrationGif";
import { EMOJI_MAP } from "@/shared/constants/emoji-map";
import { WORD_IMAGE_MAP } from "@/shared/constants/word-images";
import { fitWordFontSize } from "@/shared/utils/fitText";
import { fonts, fontSizes, radii, shadows, spacing } from "@/shared/styles/design-tokens";
import { useWordFlashSession } from "./useWordFlashSession";
import { ReadyScreen, PausedScreen, CompleteScreen } from "./screens";
import { getCurrentStep, REPEAT_TIMER_SECONDS, TOTAL_STEPS } from "./types";

const closeBtn: React.CSSProperties = {
  width: 56, height: 56, borderRadius: "50%",
  backgroundColor: "rgba(255,255,255,0.85)",
  backdropFilter: "blur(8px)",
  border: "1px solid rgba(0,0,0,0.1)",
  display: "flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer", fontSize: 20, color: "#666",
  touchAction: "manipulation",
};

export function WordFlash({ words, phase, onComplete, onBack, isDemo = false }: GameProps) {
  const s = useWordFlashSession({ words, phase, isDemo });
  const {
    sessionWords, session, mic, worldColor, ph, pass, wordIdx,
    isFlipped, showRepeatWord, isSpeaking, showCelebration, dotsCompleted,
    score, totalAttempts, repeatTimerKey, showRepeatTimer,
    videoUrl, currentSentence, highlightedWord, displayWord, affirmationText,
    currentWord, setPh, handlePause, handleResume, handleStart, handleCardTap,
  } = s;

  const baseFontSize = phase === 1 ? 96 : phase === 2 ? 80 : phase === 3 ? 64 : 48;
  const fontColor = sessionWords[wordIdx]?.fontColor === "red" ? "#e53e3e" : "#2d3748";
  const cardWord = displayWord || currentWord?.text || "";
  const isStory = ph === "story";
  const progress = getCurrentStep(ph, pass) / TOTAL_STEPS;

  if (ph === "ready") {
    return <ReadyScreen wordsCount={sessionWords.length} onStart={handleStart} onBack={onBack} />;
  }
  if (ph === "paused") {
    return <PausedScreen onResume={handleResume} onBack={onBack} />;
  }
  if (ph === "complete") {
    return (
      <CompleteScreen
        score={score}
        totalAttempts={totalAttempts}
        sessionWords={sessionWords}
        onReplay={handleStart}
        onBack={onBack}
      />
    );
  }

  const finishSession = async () => {
    await session.endSession();
    onComplete?.({
      gameId: "word-flash", score, totalAttempts, correctAttempts: score,
      startedAt: Date.now(),
      wordsAttempted: words.map((w) => w.id),
      wordsRecognized: session.recognized,
    });
    setPh("complete");
  };

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "#FFFFFF", overflow: "hidden" }}>
      {/* Top bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: `${spacing.sm}px ${spacing.md}px`, zIndex: 20,
      }}>
        <div style={{ display: "flex", gap: spacing.sm }}>
          {onBack && <button onClick={onBack} style={closeBtn} aria-label="Salir">✕</button>}
          <button onClick={handlePause} style={closeBtn} aria-label="Pausar">⏸</button>
        </div>
        <div style={{
          fontSize: fontSizes.sm,
          color: "#2d3748",
          fontFamily: fonts.display,
          fontWeight: "bold",
          padding: "4px 12px",
          borderRadius: 9999,
          backgroundColor: "#EDF2F7",
          border: "1px solid #CBD5E0",
        }}>
          {ph.startsWith("pres") ? `Ronda 1 · Pasada ${pass + 1}/3`
            : ph.startsWith("repeat") ? `Ronda 2 · Pasada ${pass + 1}/3`
            : ph === "story" ? "Ronda 3 · Historia"
            : ph === "review" ? "Repaso"
            : ""}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 50 }}>
          {(ph === "repeat" || ph === "repeat_video" || ph === "repeat_sofia" || ph === "repeat_intro") && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "4px 10px", borderRadius: radii.lg,
                backgroundColor: "#FFF8E1",
                border: "2px solid #FFD54F",
                boxShadow: "0 2px 8px rgba(218,165,32,0.3)",
              }}
            >
              <img src="/images/cofre.png" alt="cofre" style={{ height: 32, width: "auto", objectFit: "contain" }} />
              <motion.span
                key={score}
                initial={{ scale: 1.4 }}
                animate={{ scale: 1 }}
                style={{ fontSize: fontSizes.md, fontWeight: "bold", fontFamily: fonts.display, color: "#F59E0B" }}
              >
                {score}
              </motion.span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Round 1 & Review: FlipCard */}
      {(ph === "presentation" || ph === "review") && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" }}>
          <div style={{ width: "min(85vw, 70vh, 720px)", maxWidth: 720, aspectRatio: "4/3", position: "relative" }}>
            <FlipCard
              isFlipped={isFlipped}
              front={
                <div style={{ width: "100%", height: "100%", borderRadius: 20, background: `linear-gradient(135deg, ${worldColor}ee, ${worldColor}88)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, overflow: "hidden" }}>
                  <img src="/images/logo/releo.png" alt="REleo" style={{ height: 120, width: "auto", objectFit: "contain" }} />
                  <div style={{ display: "flex", gap: 8 }}>
                    {sessionWords.map((_, i) => (
                      <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: i < dotsCompleted ? "#fff" : "rgba(255,255,255,0.3)", transition: "background-color 0.3s" }} />
                    ))}
                  </div>
                </div>
              }
              back={
                <div style={{ width: "100%", height: "100%", borderRadius: 20, backgroundColor: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: shadows.lg, position: "relative", padding: "16px 32px" }}>
                  <span style={{ fontSize: fitWordFontSize(cardWord, baseFontSize), fontWeight: "bold", color: fontColor, fontFamily: "Arial Rounded MT Bold, Arial, sans-serif", textAlign: "center", lineHeight: 1.1, wordBreak: "keep-all", whiteSpace: "nowrap", maxWidth: "100%" }}>
                    {cardWord}
                  </span>
                  <QuickCelebration active={showCelebration} />
                </div>
              }
            />
          </div>
        </div>
      )}

      {/* Round 2: tap-to-confirm card with countdown */}
      {ph === "repeat" && showRepeatWord && (
        <div
          style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF", cursor: "pointer", touchAction: "manipulation" }}
          onClick={handleCardTap}
        >
          {showRepeatTimer && (
            <div style={{ position: "absolute", right: 24, top: 60, bottom: 20, display: "flex", alignItems: "stretch", zIndex: 5 }}
              onClick={(e) => e.stopPropagation()}>
              <TimeBar
                seconds={REPEAT_TIMER_SECONDS}
                resetKey={repeatTimerKey}
                onTimeUp={() => { /* timer fires from session hook */ }}
                color={worldColor}
              />
            </div>
          )}
          <div style={{ width: "min(85vw, 70vh, 720px)", maxWidth: 720, aspectRatio: "4/3", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 20, backgroundColor: "#fff", boxShadow: shadows.lg, padding: "16px 32px", position: "relative" }}>
            <span style={{ fontSize: fitWordFontSize(cardWord, baseFontSize), fontWeight: "bold", color: fontColor, fontFamily: "Arial Rounded MT Bold, Arial, sans-serif", textAlign: "center", lineHeight: 1.1, wordBreak: "keep-all", whiteSpace: "nowrap", maxWidth: "100%" }}>
              {cardWord}
            </span>
            <QuickCelebration active={showCelebration} />
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
          >
            <motion.div
              animate={{ y: [0, -20, 0], scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5, repeatDelay: 1.5 }}
              style={{ fontSize: 48 }}
            >
              👆
            </motion.div>
            <span style={{ fontSize: fontSizes.md, color: worldColor, fontFamily: fonts.display, fontWeight: "bold" }}>
              {mic.available ? "¡Toca la tarjeta!" : "Tap para confirmar"}
            </span>
          </motion.div>
        </div>
      )}

      {/* "¡Qué linda historia!" — Sofia + the 5 learned words after the story */}
      {isStory && !currentSentence && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: spacing.lg, padding: spacing.lg }}>
          <SofiaAvatar size={220} speaking={isSpeaking} />
          <AudioWaves active={isSpeaking} color={worldColor} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: spacing.sm, justifyContent: "center", maxWidth: 620 }}>
            {sessionWords.map((w, i) => (
              <motion.div
                key={w.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.12, type: "spring", damping: 12 }}
                style={{
                  padding: `${spacing.sm}px ${spacing.md}px`,
                  backgroundColor: "#fff",
                  border: `2px solid ${worldColor}`,
                  borderRadius: radii.lg,
                  fontSize: fontSizes.lg,
                  fontFamily: fonts.display,
                  fontWeight: "bold",
                  color: "#2d3748",
                  boxShadow: shadows.sm,
                }}
              >
                {w.text} {EMOJI_MAP[w.text] ?? ""}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Story text with highlights */}
      {isStory && currentSentence && (
        <div style={{ position: "absolute", inset: 0, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
          <div style={{ minHeight: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: "70px 24px 48px", boxSizing: "border-box" }}>
            <p style={{ fontSize: 26, fontFamily: fonts.display, lineHeight: 1.7, textAlign: "center", margin: 0, maxWidth: 560, width: "100%" }}>
              {currentSentence.split(/\s+/).map((token, i) => {
                const clean = token.replace(/[.,!?;:¡¿]/g, "").toLowerCase();
                const isLearned = sessionWords.some((w) => w.text.toLowerCase() === clean);
                const isHighlighted = highlightedWord === clean;
                return (
                  <motion.span
                    key={i}
                    animate={isHighlighted ? { scale: 1.4 } : { scale: 1 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      color: isLearned ? worldColor : "#888",
                      fontWeight: isLearned ? 700 : 400,
                      display: "inline-block",
                      marginRight: 8,
                    }}
                  >
                    {token}
                  </motion.span>
                );
              })}
            </p>
          </div>
        </div>
      )}

      {/* Greeting video */}
      {ph === "greeting_video" && (
        <VideoOverlay
          src="/videos/Hola soy la seño sofia.mp4"
          color={worldColor}
          onAdvance={() => setPh("greeting")}
        />
      )}

      {/* End-of-pass video */}
      {ph === "repeat_video" && videoUrl && (
        <VideoOverlay
          key={videoUrl}
          src={videoUrl}
          color={worldColor}
          onAdvance={() => setPh("repeat_sofia")}
        />
      )}

      {/* Farewell video */}
      {ph === "farewell_video" && (
        <VideoOverlay
          src="/videos/Leo_y_Sofia_en_Proxima_Clase.mp4"
          color={worldColor}
          onAdvance={finishSession}
        />
      )}

      {/* Sofia speaking overlay */}
      {(ph === "greeting" || ph === "story_intro" || ph === "review_intro" || ph === "repeat_intro" || ph === "farewell" || ph === "affirmation") && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, backgroundColor: "#FFFFFF" }}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "24px 32px", borderRadius: 24, backgroundColor: `${worldColor}08`, maxWidth: 420 }}
          >
            <SofiaAvatar size={280} speaking={isSpeaking} />
            <AudioWaves active={isSpeaking} color={worldColor} />
          </motion.div>
          {ph === "affirmation" && affirmationText && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ fontSize: fontSizes.xl, fontFamily: fonts.display, color: worldColor, textAlign: "center", fontStyle: "italic", margin: 0, padding: "0 24px", maxWidth: 400 }}
            >
              &ldquo;{affirmationText}&rdquo;
            </motion.p>
          )}
        </div>
      )}

      {/* GIF celebration between rounds */}
      {(ph === "pres_sofia" || ph === "repeat_sofia") && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" }}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}
          >
            <CelebrationGif size={200} />
            <AudioWaves active={isSpeaking} color={worldColor} />
          </motion.div>
        </div>
      )}

      {/* Final celebration before story */}
      {ph === "celebration" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: spacing.lg, backgroundColor: "#FFFFFF" }}>
          <CelebrationGif size={160} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: spacing.sm, justifyContent: "center" }}>
            {sessionWords.map((w, i) => (
              <motion.div
                key={w.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.2, type: "spring", damping: 10 }}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: `${spacing.sm}px ${spacing.md}px`, backgroundColor: "#fff", border: `2px solid ${worldColor}`, borderRadius: radii.lg, fontSize: fontSizes.lg, fontFamily: fonts.display, fontWeight: "bold", color: "#2d3748" }}
              >
                {w.text}
                {WORD_IMAGE_MAP[w.text] ? (
                  <img src={WORD_IMAGE_MAP[w.text]} alt={w.text} style={{ height: 28, width: 28, objectFit: "cover", borderRadius: 6 }} />
                ) : (
                  <span>{EMOJI_MAP[w.text] ?? ""}</span>
                )}
              </motion.div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, fontSize: 40 }}>
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.5 + i * 0.2, type: "spring", damping: 8 }}
              >
                ⭐
              </motion.span>
            ))}
          </div>
        </div>
      )}

      <ProgressLine progress={progress} color={worldColor} />
    </div>
  );
}

interface VideoOverlayProps {
  src: string;
  color: string;
  onAdvance: () => void;
}

function VideoOverlay({ src, color, onAdvance }: VideoOverlayProps) {
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: spacing.lg, gap: spacing.md, backgroundColor: "#FFFFFF" }}>
      <video
        src={src}
        autoPlay
        playsInline
        onCanPlay={(e) => { (e.target as HTMLVideoElement).style.opacity = "1"; }}
        onEnded={onAdvance}
        onError={onAdvance}
        style={{
          maxWidth: "min(85vw, 720px)",
          maxHeight: "min(70vh, 540px)",
          borderRadius: 24,
          boxShadow: shadows.lg,
          opacity: 0,
          transition: "opacity 0.15s",
        }}
      />
      <button
        type="button"
        onClick={onAdvance}
        style={{
          padding: `${spacing.sm}px ${spacing.lg}px`,
          minHeight: 56,
          borderRadius: radii.pill,
          backgroundColor: color,
          color: "#fff",
          border: "none",
          fontSize: fontSizes.md,
          fontWeight: "bold",
          fontFamily: fonts.display,
          cursor: "pointer",
          touchAction: "manipulation",
        }}
      >
        Continuar →
      </button>
    </div>
  );
}
