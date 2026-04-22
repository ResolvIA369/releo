# REleo — App Educativa de Lectura para Niños

App para enseñar a leer a niños en español argentino basada en el **Metodo Doman**. Tarjetas flash con palabras mostradas brevemente para que el cerebro del niño capture la palabra en fracciones de segundo, complementado con juegos interactivos que refuerzan el aprendizaje.

## Personajes

- **Seño Sofia** — Maestra virtual que guia cada sesion con voz Elena (es-AR). 4 poses: default, cards, clapping, motivating.
- **Leo** — Leon compañero que aparece en la barra de tiempo, videos de celebracion y motivacion.

## Contenido

- **220 palabras** en **5 mundos** (50 palabras por mundo, mundo 5 tiene 20)
- **44 sesiones** de Flash de Palabras (5 palabras por sesion)
- Cada mundo tiene **3 bloques** de 16+17+17 palabras para los juegos
- **5 fases** progresivas: palabras sencillas → verbos/adjetivos → frases → cuentos → conceptos abstractos

## Los 5 Mundos

| Mundo | Fase | Contenido | Palabras |
|-------|------|-----------|----------|
| 🏝️ Isla de las Palabras | 1 | Familia, colores, animales, frutas, cuerpo, casa | 50 (letra roja) |
| 🌊 Bahia del Saber | 2 | Verbos, ropa, emociones, naturaleza | 50 (letra roja chica) |
| 🏔️ Valle de las Letras | 3 | Opuestos, lugares, profesiones | 50 (letra negra) |
| 🌋 Montaña del Conocimiento | 4 | Articulos, preposiciones, pronombres, tiempo, numeros | 50 (letra negra chica) |
| 📚 Libro Magico | 5 | Lectura de frases y oraciones | 20 |

## Flash de Palabras (Sesion Doman)

Cada sesion de ~5 minutos:

1. **Video de saludo** — Seño Sofia se presenta
2. **Intro motivacional** — Sofia da un mensaje de aliento (audio MP3)
3. **Ronda 1 — Presentacion (3 pasadas)**: Las 5 palabras se muestran como flash en tarjetas. La palabra aparece brevemente mientras Sofia la nombra, luego la tarjeta vuelve al dorso (logo REleo) mas tiempo entre palabras.
4. **Ronda 2 — Repeticion (3 pasadas)**: Las palabras aparecen directamente (sin flip). El niño tiene un tiempo limitado (barra de Leo) para tocar la pantalla confirmando que la leyo. Gana monedas por cada acierto (van al cofre en la esquina superior derecha). Al final de cada pasada se reproduce un video de celebracion o motivacion.
5. **Ronda 3 — Historia**: Sofia lee una mini-historia con las 5 palabras aprendidas, resaltandolas visualmente.
6. **Repaso** — Si hay sesion anterior, se repasan esas palabras.
7. **Afirmacion** — "Yo puedo, yo creo en mi, yo soy inteligente"
8. **Video de despedida** — Leo y Sofia invitan a la proxima clase.

## 9 Juegos Interactivos

| Juego | Descripcion |
|-------|-------------|
| ⚡ Flash de Palabras | Sesion Doman completa (descrita arriba) |
| 🖼️ Empareja Palabra-Imagen | Muestra una palabra, el niño toca la imagen correcta (fotos reales cuando estan disponibles) |
| 🧩 Rompecabezas | Arma la palabra tocando las silabas en orden |
| 🚂 Tren de Palabras | Toca el vagon correcto antes de que el tren pase (3 dificultades) |
| 🧱 Construye la Frase | Arrastra palabras para formar oraciones |
| 🌧️ Lluvia de Palabras | Atrapa la palabra correcta antes de que caiga |
| 🗂️ Categorias | Clasifica palabras en su categoria correcta |
| 🎣 Pesca de Palabras | Pesca la palabra correcta del mar |
| 🫧 Burbujas Magicas | Revienta la burbuja con la palabra correcta |

## Sistema de Recompensas

- **Monedas** — 1 por respuesta correcta + 5 bonus al completar (vuelan al cofre)
- **Cofre del tesoro** — Visible en la esquina superior derecha durante los juegos
- **Estrellas** — 3 (≥90%), 2 (≥60%), 1 (menos)
- **Videos de celebracion** — 6 videos de Leo/Sofia al completar pasadas y juegos
- **Confetti** — Efectos visuales en respuestas correctas

## Imagenes de Palabras

28 palabras tienen fotos reales: mama, papa, bebe, abuela, abuelo, hermano, hermana, tio, tia, primo, alto, baja, bajo, flaco, gordo, cocina, calle, jardin, largo, lava, lejos, mesa, muy, piso, sale, solo, sube, techo. Se usan en:

- Juego Empareja Palabra-Imagen
- Lista de sesiones en el menu de mundos
- Pantallas de celebracion y sesion completa

## Audio

- **487 archivos MP3** generados con voz Elena (es-AR-ElenaNeural via edge-tts)
- 220 palabras individuales + frases de sesion + reglas de juegos + reacciones + afirmaciones
- Un solo elemento de audio compartido para evitar superposiciones
- Todo pre-generado, sin TTS en tiempo real

## Videos

| Archivo | Uso |
|---------|-----|
| `Hola soy la seño sofia.mp4` | Saludo inicial de cada sesion |
| `Leo_y_Sofia_en_Proxima_Clase.mp4` | Despedida al final |
| `leo-celebration-{1,2,3}.mp4` | Celebracion al completar pasadas |
| `sofia-celebration-{1,2}.mp4` | Celebracion al completar pasadas |
| `sofia-leo-celebration-1.mp4` | Celebracion al completar pasadas |
| `leo-motivation.mp4` | Motivacion cuando el puntaje es bajo |

## Modo Demo / Grabacion

- Reproduce sesiones completas y juegos individuales automaticamente
- Auto-play con tiempos realistas para grabar contenido promocional
- Selector de sesion individual, rango, o mundo completo
- Selector de juego por mundo y bloque

## Tech Stack

```
Next.js 16 + React 19 + TypeScript
Zustand v5 — Estado global
Framer Motion — Animaciones
edge-tts (es-AR-ElenaNeural) — Generacion de MP3s
canvas-confetti — Efectos de celebracion
PWA — Instalable, actualizacion controlada por el usuario
```

## Estructura del Proyecto

```
src/
├── app/
│   ├── (main)/
│   │   ├── dashboard/       # Pantalla principal
│   │   ├── learn/           # Mundos y sesiones
│   │   └── play/[gameId]/   # Juegos
│   └── demo/                # Modo demo/grabacion
│
├── features/
│   ├── games/
│   │   ├── components/      # 9 juegos + GameShell, GameSetup, GameIntro
│   │   ├── config/          # game-registry, audio-rules
│   │   ├── hooks/           # useGameState, useDemoAutoplay
│   │   └── types/
│   ├── session/
│   │   ├── components/      # DomanDemoPlayer
│   │   └── config/          # curriculum, session-scripts
│   └── progression/
│       └── config/          # worlds
│
├── shared/
│   ├── components/          # FlipCard, TimeBar, RewardsLayer, SofiaAvatar, etc.
│   ├── constants/           # words, emoji-map, word-images, sentences
│   ├── services/            # sofiaVoice (motor de audio)
│   ├── styles/              # design-tokens, animations
│   └── utils/               # videoPool, fitText, confetti
│
└── public/
    ├── audio/sofia/         # 487 MP3s
    ├── videos/              # 8 videos
    └── images/
        ├── palabras/        # 28 fotos de palabras
        ├── logo/            # Logo REleo
        ├── sofia/           # 4 poses de Sofia
        ├── Leo/             # Poses de Leo
        └── worlds/          # Imagenes de mundos
```

## Comandos

```bash
npm install              # Instalar dependencias
npm run dev              # Desarrollo (auto-port 3000-3006)
npm run build            # Build produccion
npx tsc --noEmit         # Verificar tipos
```
