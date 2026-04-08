"use client";

import { useMemo } from "react";
import type { PlayerProgress, WorldWithStatus, WorldStatus, ProgressionInfo } from "../types";
import { WORLDS } from "../config/worlds";
import { meetsRequirements, getNextMilestone } from "../config/unlock-requirements";
import { ALL_WORDS } from "@/shared/constants";

function getWorldStatus(worldId: string, progress: PlayerProgress): WorldStatus {
  if (progress.currentWorldId === worldId) return "current";

  const world = WORLDS.find((w) => w.id === worldId);
  if (!world) return "locked";

  if (!world.unlockRequirements.previousWorldId) {
    return progress.worldsUnlocked.includes(worldId) ? "completed" : "locked";
  }

  if (progress.worldsUnlocked.includes(worldId)) {
    return "completed";
  }

  return "locked";
}

function getWorldWordsProgress(worldId: string, progress: PlayerProgress) {
  const world = WORLDS.find((w) => w.id === worldId);
  if (!world) return { mastered: 0, total: 0 };

  const worldWords = ALL_WORDS.filter((w) => world.categories.includes(w.category));
  const mastered = worldWords.filter((w) => progress.wordsMastered.includes(w.id)).length;
  return { mastered, total: worldWords.length };
}

function getWorldGamesProgress(worldId: string, progress: PlayerProgress) {
  const world = WORLDS.find((w) => w.id === worldId);
  if (!world) return { completed: 0, total: 0 };

  const completed = world.availableGames.filter((gameId) => {
    const completion = progress.gamesCompleted[`${worldId}_${gameId}`];
    return completion && completion.stars >= 2;
  }).length;

  return { completed, total: world.availableGames.length };
}

function getWorldStars(worldId: string, progress: PlayerProgress): number {
  const world = WORLDS.find((w) => w.id === worldId);
  if (!world) return 0;

  return world.availableGames.reduce((total, gameId) => {
    const completion = progress.gamesCompleted[`${worldId}_${gameId}`];
    return total + (completion?.stars ?? 0);
  }, 0);
}

export function useProgression(progress: PlayerProgress): ProgressionInfo {
  return useMemo(() => {
    const worlds: WorldWithStatus[] = WORLDS.map((config) => {
      const status = getWorldStatus(config.id, progress);
      const wordsProgress = getWorldWordsProgress(config.id, progress);
      const gamesProgress = getWorldGamesProgress(config.id, progress);
      const starsEarned = getWorldStars(config.id, progress);
      const percentComplete =
        config.totalWords > 0
          ? Math.round((wordsProgress.mastered / config.totalWords) * 100)
          : 0;

      return { config, status, percentComplete, wordsProgress, gamesProgress, starsEarned };
    });

    const currentWorld = worlds.find((w) => w.status === "current");
    const overallProgress = Math.round((progress.wordsMastered.length / ALL_WORDS.length) * 100);

    const currentIdx = WORLDS.findIndex((w) => w.id === progress.currentWorldId);
    const nextWorld = WORLDS[currentIdx + 1];
    const canUnlockNext = nextWorld ? meetsRequirements(nextWorld.unlockRequirements, progress) : false;
    const nextMilestone = nextWorld
      ? getNextMilestone(nextWorld.unlockRequirements, progress)
      : "¡Has completado todos los mundos!";

    return { worlds, currentWorld, overallProgress, canUnlockNext, nextMilestone };
  }, [progress]);
}
