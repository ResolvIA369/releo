import type { DomanWord } from "@/shared/types/doman";
import { colors } from "@/shared/styles/design-tokens";

/**
 * Map the Doman card spec of a word (fontColor + fontSizeCm) to canvas
 * text props for the PixiJS arcade games, mirroring how WordFlash and
 * DomanWordDisplay style words elsewhere in the app.
 *
 * Phase progression: 1 = red 12.5cm, 2 = black 10cm, 3 = black 7.5cm,
 * 4 = black 5cm. Sizes scale to game-canvas proportions with a floor so
 * later phases stay readable and tappable.
 */
export function domanCanvasText(word: DomanWord): { fill: string; fontSize: number } {
  return {
    fill: word.fontColor === "red" ? colors.doman.wordRed : colors.doman.wordBlack,
    fontSize: Math.round(14 + word.fontSizeCm * 1.1),
  };
}
