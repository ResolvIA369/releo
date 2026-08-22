"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Reveal } from "./components/Reveal";

/* ─────────────────────────────────────────────────────────────────────────
 * REleo · Landing
 * Lectura temprana basada en el método de Glenn Doman.
 * Personajes: Leo el león 🦁 + la Seño Sofía 👩‍🏫
 * ──────────────────────────────────────────────────────────────────────── */

const PURPLE = "#667eea";
const PURPLE_DARK = "#764ba2";
const PINK = "#f093fb";
const YELLOW = "#fbbf24";
const GREEN = "#48bb78";
const INK = "#2d3748";
const MUTED = "#6b7280";

const brandGradient = `linear-gradient(135deg, ${PURPLE}, ${PURPLE_DARK})`;
const joyGradient = `linear-gradient(135deg, ${PINK}, ${PURPLE})`;

const CTA_HREF = "/dashboard";

/* ── Datos ──────────────────────────────────────────────────────────────── */

const FASES = [
  { n: 1, emoji: "🔴", titulo: "Palabras", desc: "Tarjetas con palabras grandes en rojo. El cerebro las reconoce enteras, como una imagen." },
  { n: 2, emoji: "🍎", titulo: "Parejas", desc: "Dos palabras juntas: «manzana roja». El niño descubre que las palabras se combinan." },
  { n: 3, emoji: "✏️", titulo: "Frases", desc: "Frases cortas y divertidas que cuentan algo. Aparece el sentido completo." },
  { n: 4, emoji: "📖", titulo: "Oraciones", desc: "Oraciones reales con sujeto y acción. La lectura empieza a fluir sola." },
  { n: 5, emoji: "🏆", titulo: "Cuentos", desc: "Su primer libro leído de principio a fin. El gran logro del método." },
];

const FEATURES = [
  { icon: "🃏", titulo: "Sesiones de lectura", desc: "Bits de palabras:  pocos segundos, varias veces al día, siempre alegres y sin presión." },
  { icon: "🎮", titulo: "Juegos y arcade", desc: "Mini-juegos donde leer es jugar. Refuerzan cada palabra aprendida con movimiento y diversión." },
  { icon: "🗣️", titulo: "Dictado y voz", desc: "Leo y la Seño Sofía pronuncian cada palabra con voz clara. El niño escucha, repite y reconoce." },
  { icon: "👫", titulo: "Multijugador", desc: "Jugar a leer en familia o con amigos. Aprender juntos motiva mucho más que aprender solo." },
  { icon: "🎁", titulo: "Tienda de premios", desc: "Cada logro da monedas para canjear por accesorios y sorpresas. Recompensa positiva, nunca castigo." },
  { icon: "📅", titulo: "Rachas y progreso", desc: "Un calendario simple muestra el avance día a día. Constancia de pocos minutos, grandes resultados." },
];

const PASOS = [
  { n: "1", titulo: "Creás el perfil", desc: "Edad y nombre del peque. REleo arma su camino de lectura desde la fase 1." },
  { n: "2", titulo: "Sesión de 3 minutos", desc: "Cada día, una sesión cortita y feliz con Leo y la Seño Sofía. Se termina antes de aburrirse." },
  { n: "3", titulo: "Avanza solo", desc: "El método progresa de palabras a cuentos a su ritmo. Vos seguís todo desde el panel de padres." },
];

const PADRES = [
  { icon: "🔒", t: "Seguro para chicos", d: "Sin chats abiertos, sin links externos, sin sorpresas." },
  { icon: "🚫", t: "Sin publicidad", d: "Cero anuncios. Nada compite por la atención del niño." },
  { icon: "📶", t: "Funciona sin internet", d: "Instalable como app (PWA). La sesión sigue aunque no haya señal." },
  { icon: "📊", t: "Panel de padres", d: "Mirás qué palabras domina y cuánto practica, sin interrumpirlo." },
];

const MUNDOS = [
  { img: "/images/worlds/valle.png", nombre: "El Valle de las Palabras" },
  { img: "/images/worlds/isla.png", nombre: "La Isla de las Frases" },
  { img: "/images/worlds/montana.png", nombre: "La Montaña de los Cuentos" },
  { img: "/images/worlds/bahia.png", nombre: "La Bahía del Saber" },
];

/* ── Sub-componentes ────────────────────────────────────────────────────── */

function PrimaryButton({ children, href }: { children: React.ReactNode; href: string }) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "16px 32px",
        borderRadius: 9999,
        background: joyGradient,
        color: "#fff",
        fontWeight: 800,
        fontSize: 18,
        textDecoration: "none",
        boxShadow: "0 12px 28px rgba(118,75,162,0.35)",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </Link>
  );
}

function SectionTitle({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <Reveal style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 48px" }}>
      <div style={{ color: PURPLE, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", fontSize: 14, marginBottom: 12 }}>
        {eyebrow}
      </div>
      <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: INK, lineHeight: 1.15, margin: 0 }}>{title}</h2>
      {sub && <p style={{ color: MUTED, fontSize: 18, marginTop: 16, lineHeight: 1.6 }}>{sub}</p>}
    </Reveal>
  );
}

/* ── Landing ────────────────────────────────────────────────────────────── */

export function Landing() {
  return (
    <main style={{ fontFamily: '"Fredoka", "Inter", system-ui, sans-serif', color: INK, overflowX: "hidden", background: "#fff" }}>
      {/* NAV */}
      <nav
        style={{
          position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px clamp(16px, 5vw, 64px)", background: "rgba(255,255,255,0.82)", backdropFilter: "blur(12px)",
          borderBottom: "1px solid #eef0f7",
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo/releo.png" alt="REleo" style={{ height: 38, width: "auto" }} />
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <a href="#metodo" style={{ color: INK, textDecoration: "none", fontWeight: 600, fontSize: 15 }} className="releo-navlink">El método</a>
          <a href="#features" style={{ color: INK, textDecoration: "none", fontWeight: 600, fontSize: 15 }} className="releo-navlink">Qué incluye</a>
          <Link
            href={CTA_HREF}
            style={{ padding: "10px 22px", borderRadius: 9999, background: brandGradient, color: "#fff", fontWeight: 700, textDecoration: "none", fontSize: 15 }}
          >
            Entrar a jugar
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <header
        style={{
          position: "relative", padding: "clamp(48px, 8vw, 96px) clamp(16px, 5vw, 64px) clamp(64px, 9vw, 120px)",
          background: `radial-gradient(1200px 600px at 85% -10%, ${PINK}22, transparent), radial-gradient(900px 500px at 0% 110%, ${PURPLE}22, transparent), #fbfaff`,
        }}
      >
        {/* letras flotantes de fondo */}
        {["a", "o", "e", "i", "u"].map((l, i) => (
          <motion.span
            key={l}
            aria-hidden
            initial={{ y: 0 }}
            animate={{ y: [0, -16, 0] }}
            transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
            style={{
              position: "absolute", fontSize: 80 + i * 14, fontWeight: 800, color: i % 2 ? PINK : PURPLE, opacity: 0.08,
              top: `${10 + i * 16}%`, left: `${[6, 80, 30, 90, 55][i]}%`, userSelect: "none", pointerEvents: "none",
            }}
          >
            {l}
          </motion.span>
        ))}

        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 48, alignItems: "center", maxWidth: 1180, margin: "0 auto", position: "relative" }} className="releo-hero-grid">
          <Reveal>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #ececff", borderRadius: 9999, padding: "8px 16px", boxShadow: "0 4px 16px rgba(102,126,234,0.10)", fontWeight: 700, fontSize: 14, color: PURPLE_DARK, marginBottom: 22 }}>
              ✨ Basado en el método de <span style={{ color: PURPLE }}>Glenn Doman</span>
            </div>
            <h1 style={{ fontSize: "clamp(36px, 6vw, 64px)", lineHeight: 1.05, fontWeight: 800, margin: 0, letterSpacing: -1 }}>
              Tu peque puede{" "}
              <span style={{ background: joyGradient, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
                aprender a leer
              </span>{" "}
              jugando 🦁
            </h1>
            <p style={{ fontSize: 20, color: MUTED, lineHeight: 1.6, marginTop: 20, maxWidth: 520 }}>
              REleo enseña a leer a los más chicos (0 a 6 años) con sesiones de pocos minutos,
              alegres y sin presión. Con <strong style={{ color: INK }}>Leo el león</strong> y la{" "}
              <strong style={{ color: INK }}>Seño Sofía</strong> de la mano en cada paso.
            </p>
            <div style={{ display: "flex", gap: 16, marginTop: 32, flexWrap: "wrap", alignItems: "center" }}>
              <PrimaryButton href={CTA_HREF}>Empezar gratis →</PrimaryButton>
              <a href="#metodo" style={{ color: PURPLE_DARK, fontWeight: 700, textDecoration: "none", fontSize: 16 }}>
                Ver cómo funciona
              </a>
            </div>
            <div style={{ display: "flex", gap: 24, marginTop: 36, flexWrap: "wrap" }}>
              {[["0–6", "años, la mejor edad"], ["3 min", "por sesión"], ["5", "fases hasta su 1er cuento"]].map(([big, small]) => (
                <div key={big}>
                  <div style={{ fontSize: 26, fontWeight: 800, color: PURPLE_DARK }}>{big}</div>
                  <div style={{ fontSize: 13, color: MUTED }}>{small}</div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.15} style={{ position: "relative", display: "flex", justifyContent: "center" }}>
            <motion.div
              animate={{ y: [0, -18, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              style={{ position: "relative", width: "100%", maxWidth: 420 }}
            >
              <div style={{ position: "absolute", inset: "8% 6%", background: joyGradient, filter: "blur(40px)", opacity: 0.35, borderRadius: "50%" }} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/Leo/Leo_vuela-removebg-preview.png" alt="Leo el león volando con un libro" style={{ position: "relative", width: "100%", height: "auto", filter: "drop-shadow(0 24px 40px rgba(118,75,162,0.30))" }} />
            </motion.div>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={{ position: "absolute", top: "6%", left: "-2%", background: "#fff", borderRadius: 18, padding: "10px 16px", boxShadow: "0 12px 28px rgba(0,0,0,0.10)", fontWeight: 800, color: GREEN, fontSize: 15 }}
            >
              ¡Leíste «mamá»! 🎉
            </motion.div>
          </Reveal>
        </div>
      </header>

      {/* ¿QUÉ ES? — franja */}
      <section style={{ padding: "clamp(56px, 8vw, 88px) clamp(16px, 5vw, 64px)", background: "#fff" }}>
        <Reveal style={{ maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: "clamp(22px, 3.2vw, 32px)", lineHeight: 1.45, fontWeight: 700, color: INK, margin: 0 }}>
            Leer no se enseña con planas ni con presión. Se enseña{" "}
            <span style={{ color: PURPLE }}>como se aprende a hablar</span>: con cariño, repetición alegre
            y momentos cortitos. Eso es <strong>REleo</strong>.
          </p>
        </Reveal>
      </section>

      {/* MÉTODO DOMAN */}
      <section id="metodo" style={{ padding: "clamp(56px, 8vw, 96px) clamp(16px, 5vw, 64px)", background: "#faf9ff" }}>
        <SectionTitle
          eyebrow="El método"
          title="Nos basamos en el método de Glenn Doman"
          sub="Glenn Doman, fundador de los Institutos para el Logro del Potencial Humano (Filadelfia) y autor de «Cómo enseñar a leer a su bebé», descubrió que el cerebro aprende más rápido que nunca entre los 0 y los 6 años. REleo lleva su método al celular o la tablet, paso a paso."
        />

        {/* principios */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, maxWidth: 980, margin: "0 auto 64px" }}>
          {[
            ["⏱️", "Sesiones cortas", "Pocos segundos, varias veces al día. Se termina siempre antes de que el niño quiera parar."],
            ["😄", "Sin exámenes", "Nunca se evalúa ni se corrige. Leer es un juego, no una prueba."],
            ["❤️", "Puro refuerzo positivo", "Cada acierto se celebra. El cariño es el motor del aprendizaje."],
            ["🔁", "Repetición alegre", "Las palabras vuelven con frecuencia hasta que el cerebro las reconoce de un vistazo."],
          ].map(([icon, t, d], i) => (
            <Reveal key={t as string} delay={i * 0.08}>
              <div style={{ background: "#fff", borderRadius: 20, padding: 24, height: "100%", boxShadow: "0 8px 24px rgba(102,126,234,0.08)", border: "1px solid #f0f0fb" }}>
                <div style={{ fontSize: 32 }}>{icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: "12px 0 6px" }}>{t}</h3>
                <p style={{ color: MUTED, fontSize: 15, lineHeight: 1.5, margin: 0 }}>{d}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* las 5 fases */}
        <Reveal style={{ textAlign: "center", marginBottom: 32 }}>
          <h3 style={{ fontSize: 24, fontWeight: 800, color: INK }}>El camino, en 5 fases</h3>
          <p style={{ color: MUTED }}>De la primera palabra a su primer cuento leído solito.</p>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, maxWidth: 1100, margin: "0 auto" }}>
          {FASES.map((f, i) => (
            <Reveal key={f.n} delay={i * 0.08}>
              <div style={{ background: "#fff", borderRadius: 20, padding: 22, height: "100%", border: "1px solid #f0f0fb", boxShadow: "0 8px 24px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span style={{ width: 34, height: 34, borderRadius: "50%", background: brandGradient, color: "#fff", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 15 }}>{f.n}</span>
                  <span style={{ fontSize: 24 }}>{f.emoji}</span>
                </div>
                <h4 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 6px" }}>{f.titulo}</h4>
                <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.5, margin: 0 }}>{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding: "clamp(56px, 8vw, 96px) clamp(16px, 5vw, 64px)", background: "#fff" }}>
        <SectionTitle eyebrow="Qué incluye REleo" title="Una app entera para enamorar a tu peque de las letras" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 22, maxWidth: 1100, margin: "0 auto" }}>
          {FEATURES.map((f, i) => (
            <Reveal key={f.titulo} delay={i * 0.06}>
              <div style={{ background: "#fbfaff", borderRadius: 22, padding: 28, height: "100%", border: "1px solid #f0f0fb", transition: "transform .2s" }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: joyGradient, display: "grid", placeItems: "center", fontSize: 28, marginBottom: 16 }}>{f.icon}</div>
                <h3 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 8px" }}>{f.titulo}</h3>
                <p style={{ color: MUTED, fontSize: 15.5, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section style={{ padding: "clamp(56px, 8vw, 96px) clamp(16px, 5vw, 64px)", background: brandGradient, color: "#fff" }}>
        <Reveal style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 56px" }}>
          <div style={{ fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", fontSize: 14, opacity: 0.85, marginBottom: 12 }}>Cómo funciona</div>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, margin: 0, lineHeight: 1.15 }}>Empezar lleva un minuto</h2>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24, maxWidth: 1000, margin: "0 auto" }}>
          {PASOS.map((p, i) => (
            <Reveal key={p.n} delay={i * 0.1}>
              <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 22, padding: 30, height: "100%", border: "1px solid rgba(255,255,255,0.18)" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#fff", color: PURPLE_DARK, display: "grid", placeItems: "center", fontWeight: 800, fontSize: 22, marginBottom: 18 }}>{p.n}</div>
                <h3 style={{ fontSize: 21, fontWeight: 800, margin: "0 0 8px" }}>{p.titulo}</h3>
                <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.92, margin: 0 }}>{p.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* PERSONAJES */}
      <section style={{ padding: "clamp(56px, 8vw, 96px) clamp(16px, 5vw, 64px)", background: "#fff" }}>
        <SectionTitle eyebrow="Sus compañeros de aventura" title="Nunca aprende solo" sub="Dos amigos lo acompañan en cada sesión, lo motivan cuando cuesta y lo festejan cuando lo logra." />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, maxWidth: 920, margin: "0 auto" }} className="releo-chars-grid">
          {[
            { img: "/images/Leo/felicitando.png", color: YELLOW, nombre: "Leo el león", rol: "El amigo valiente", desc: "Acompaña, anima y celebra cada palabra leída. Convierte el esfuerzo en una aventura." },
            { img: "/images/sofia/sofia-default.png", color: PINK, nombre: "La Seño Sofía", rol: "La maestra", desc: "Presenta cada palabra con voz clara y mucha paciencia. Guía el método paso a paso." },
          ].map((c, i) => (
            <Reveal key={c.nombre} delay={i * 0.12}>
              <div style={{ background: "#fbfaff", borderRadius: 26, padding: 28, height: "100%", border: "1px solid #f0f0fb", textAlign: "center" }}>
                <div style={{ position: "relative", width: 180, height: 180, margin: "0 auto 16px" }}>
                  <div style={{ position: "absolute", inset: 0, background: `${c.color}33`, borderRadius: "50%", filter: "blur(8px)" }} />
                  <Image src={c.img} alt={c.nombre} width={180} height={180} sizes="180px" style={{ position: "relative", width: "100%", height: "100%", objectFit: "contain" }} />
                </div>
                <div style={{ display: "inline-block", background: `${c.color}22`, color: INK, fontWeight: 700, fontSize: 13, padding: "4px 12px", borderRadius: 9999, marginBottom: 8 }}>{c.rol}</div>
                <h3 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 8px" }}>{c.nombre}</h3>
                <p style={{ color: MUTED, fontSize: 15.5, lineHeight: 1.6, margin: 0 }}>{c.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* MUNDOS */}
      <section style={{ padding: "clamp(40px, 6vw, 72px) clamp(16px, 5vw, 64px)", background: "#faf9ff" }}>
        <SectionTitle eyebrow="Un mapa para explorar" title="Cada fase es un mundo nuevo" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 18, maxWidth: 1000, margin: "0 auto" }}>
          {MUNDOS.map((m, i) => (
            <Reveal key={m.nombre} delay={i * 0.08}>
              <div style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 10px 28px rgba(0,0,0,0.10)", position: "relative", aspectRatio: "1 / 1", background: "#fff" }}>
                <Image src={m.img} alt={m.nombre} fill sizes="(max-width: 768px) 90vw, 360px" style={{ objectFit: "cover" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent 55%)" }} />
                <div style={{ position: "absolute", bottom: 14, left: 14, right: 14, color: "#fff", fontWeight: 800, fontSize: 16, textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>{m.nombre}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* PARA PADRES */}
      <section style={{ padding: "clamp(56px, 8vw, 96px) clamp(16px, 5vw, 64px)", background: "#fff" }}>
        <SectionTitle eyebrow="Para mamá y papá" title="Tranquilidad mientras tu peque aprende" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, maxWidth: 1000, margin: "0 auto" }}>
          {PADRES.map((p, i) => (
            <Reveal key={p.t} delay={i * 0.08}>
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start", background: "#fbfaff", borderRadius: 18, padding: 22, height: "100%", border: "1px solid #f0f0fb" }}>
                <div style={{ fontSize: 28, lineHeight: 1 }}>{p.icon}</div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 4px" }}>{p.t}</h3>
                  <p style={{ color: MUTED, fontSize: 14.5, lineHeight: 1.5, margin: 0 }}>{p.d}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ padding: "clamp(16px, 5vw, 48px) clamp(16px, 5vw, 64px) clamp(64px, 9vw, 110px)" }}>
        <Reveal style={{ maxWidth: 980, margin: "0 auto" }}>
          <div style={{ position: "relative", overflow: "hidden", borderRadius: 32, padding: "clamp(40px, 6vw, 72px)", background: joyGradient, color: "#fff", textAlign: "center", boxShadow: "0 24px 60px rgba(118,75,162,0.35)" }}>
            <motion.img
              src="/images/Leo/Leo_Salta-removebg-preview.png"
              alt=""
              aria-hidden
              animate={{ y: [0, -14, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              style={{ position: "absolute", right: -10, bottom: -10, width: 180, opacity: 0.9, pointerEvents: "none" }}
            />
            <h2 style={{ fontSize: "clamp(28px, 4.5vw, 48px)", fontWeight: 800, margin: 0, lineHeight: 1.1, position: "relative" }}>
              Que su primera palabra leída<br />sea hoy
            </h2>
            <p style={{ fontSize: 18, opacity: 0.95, margin: "18px auto 32px", maxWidth: 520, position: "relative" }}>
              Empezá gratis. Tres minutos al día, el método de Glenn Doman y dos amigos que lo acompañan.
            </p>
            <div style={{ position: "relative", display: "inline-block" }}>
              <Link
                href={CTA_HREF}
                style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "16px 36px", borderRadius: 9999, background: "#fff", color: PURPLE_DARK, fontWeight: 800, fontSize: 18, textDecoration: "none", boxShadow: "0 12px 28px rgba(0,0,0,0.18)" }}
              >
                Empezar a leer con REleo →
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: "40px clamp(16px, 5vw, 64px)", borderTop: "1px solid #eef0f7", background: "#fbfaff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "space-between" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo/releo.png" alt="REleo" style={{ height: 32, width: "auto" }} />
          <p style={{ color: MUTED, fontSize: 13, margin: 0, textAlign: "center" }}>
            Inspirado en el método de Glenn Doman. REleo no está afiliado a los Institutos para el Logro del Potencial Humano.
          </p>
          <span style={{ color: MUTED, fontSize: 13 }}>© {2026} REleo · de Resolvia</span>
        </div>
      </footer>

      {/* estilos responsive (mismo file, sin dependencias) */}
      <style>{`
        .releo-navlink:hover { color: ${PURPLE}; }
        @media (max-width: 860px) {
          .releo-hero-grid { grid-template-columns: 1fr !important; text-align: center; }
          .releo-hero-grid p { margin-left: auto; margin-right: auto; }
          .releo-chars-grid { grid-template-columns: 1fr !important; }
          nav .releo-navlink { display: none; }
        }
      `}</style>
    </main>
  );
}
