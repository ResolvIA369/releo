import type { Metadata } from "next";
import { Landing } from "@/features/landing/Landing";

export const metadata: Metadata = {
  title: "REleo — Aprender a leer jugando | Método Glenn Doman",
  description:
    "REleo enseña a leer a los más chicos (0-6 años) con el método de Glenn Doman: sesiones cortas, alegres y sin presión. Con Leo el león y la Seño Sofía.",
  openGraph: {
    title: "REleo — Aprender a leer jugando",
    description:
      "Lectura temprana basada en el método de Glenn Doman. Sesiones de pocos minutos, juegos y mucho cariño. Con Leo el león y la Seño Sofía.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "REleo" }],
    type: "website",
  },
};

export default function Home() {
  return <Landing />;
}
