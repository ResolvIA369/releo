import { jsPDF } from "jspdf";
import type { PlayerProgress } from "@/features/progression/types";
import { getReaderLevel, getXPProgress } from "@/shared/config/reader-levels";
import { ALL_WORDS } from "@/shared/constants";
import type { PersistedSession } from "@/features/persistence/types";

export function generateProgressReport(
  childName: string,
  progress: PlayerProgress,
  xp: number,
  sessions: PersistedSession[]
) {
  const doc = new jsPDF();
  const level = getReaderLevel(xp);
  const xpProg = getXPProgress(xp);
  const wordsMastered = progress.wordsMastered.length;

  // Header
  doc.setFontSize(24);
  doc.setTextColor(102, 126, 234);
  doc.text("Doman App — Reporte de Progreso", 105, 20, { align: "center" });

  doc.setFontSize(14);
  doc.setTextColor(100);
  doc.text(`Alumno: ${childName}`, 20, 35);
  doc.text(`Fecha: ${new Date().toLocaleDateString("es")}`, 20, 43);
  doc.text(`Nivel: ${level.title} (${level.emoji})`, 20, 51);
  doc.text(`XP: ${xp} | Progreso: ${xpProg.percent}% al siguiente nivel`, 20, 59);

  // Stats box
  doc.setDrawColor(200);
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(15, 65, 180, 30, 3, 3, "FD");

  doc.setFontSize(11);
  doc.setTextColor(60);
  doc.text(`Palabras aprendidas: ${wordsMastered} / ${ALL_WORDS.length}`, 25, 77);
  doc.text(`Sesiones completadas: ${progress.completedSessions.length}`, 25, 85);
  doc.text(`Racha actual: ${progress.streakDays} días | Mejor: ${progress.longestStreak} días`, 110, 77);
  doc.text(`Sesiones registradas: ${sessions.length}`, 110, 85);

  // Progress bar
  doc.setFontSize(12);
  doc.setTextColor(80);
  doc.text("Progreso general:", 20, 105);
  doc.setDrawColor(200);
  doc.roundedRect(20, 108, 170, 8, 2, 2, "S");
  const pct = Math.round((wordsMastered / ALL_WORDS.length) * 100);
  doc.setFillColor(72, 187, 120);
  doc.roundedRect(20, 108, (170 * pct) / 100, 8, 2, 2, "F");
  doc.setFontSize(9);
  doc.text(`${pct}%`, 192, 114);

  // Session history
  doc.setFontSize(14);
  doc.setTextColor(60);
  doc.text("Historial de sesiones recientes:", 20, 130);

  const recent = sessions.slice(0, 15);
  let y = 138;
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text("Fecha", 20, y);
  doc.text("Fase", 70, y);
  doc.text("Palabras", 95, y);
  doc.text("Aciertos", 130, y);
  doc.text("Precisión", 160, y);
  y += 3;
  doc.setDrawColor(200);
  doc.line(20, y, 190, y);
  y += 5;

  for (const s of recent) {
    const date = new Date(s.savedAt).toLocaleDateString("es", { day: "2-digit", month: "2-digit", year: "2-digit" });
    const accuracy = s.wordsShown.length > 0
      ? Math.round((s.wordsRecognized.length / s.wordsShown.length) * 100) : 0;
    doc.text(date, 20, y);
    doc.text(`Fase ${s.phase}`, 70, y);
    doc.text(`${s.wordsShown.length}`, 95, y);
    doc.text(`${s.wordsRecognized.length}`, 130, y);
    doc.text(`${accuracy}%`, 160, y);
    y += 6;
    if (y > 275) { doc.addPage(); y = 20; }
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("Generado por Doman App — Método Doman de lectura temprana", 105, 290, { align: "center" });

  doc.save(`doman-reporte-${childName.toLowerCase().replace(/\s/g, "-")}.pdf`);
}
