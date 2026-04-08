// ═══════════════════════════════════════════════════════════════════════
// Sofia Phrases — All text Sofia speaks during a Doman session.
// {name} is replaced with the child's name at runtime.
// ~30% of phrases include {name} for natural variation.
// ═══════════════════════════════════════════════════════════════════════

export const SOFIA_SESSION_PHRASES = {
  greetings: [
    "¡Hola, {name}! ¡Qué alegría verte! Soy la Seño Sofía y hoy vamos a aprender 5 palabras nuevas. ¿Estás listo? ¡Vamos a empezar!",
    "¡{name}! ¡Llegaste! Hoy tenemos una clase muy divertida. ¡Vamos a aprender palabras nuevas juntos!",
    "¡Hola! Soy la Seño Sofía. ¡Hoy tú y yo vamos a descubrir 5 palabras increíbles, {name}!",
  ],

  presentationIntro: "Te voy a mostrar las palabras. Mira bien y escucha cómo se dicen.",

  betweenPresentation: [
    ["¡Muy bien, {name}! Esas son nuestras 5 palabras de hoy. ¡Vamos a verlas otra vez!", "¡Genial! Ahora las veremos de nuevo. ¡Presta atención!"],
    ["¡Excelente, {name}! ¡Ya casi las sabes! Una última vez.", "¡Las conoces! Una vez más para que las recuerdes siempre."],
    ["¡{name}, ya las conoces! Ahora quiero escucharte a ti. Yo te voy a mostrar cada palabra y tú me la dices en voz alta. ¿Sí? ¡Vamos!", "¡Perfecto! Ahora es tu turno, {name}. Cuando veas la palabra, dila en voz alta. ¡Tú puedes!"],
  ],

  betweenRepeat: [
    ["¡Lo estás haciendo increíble, {name}! ¡Tu voz suena muy bien! Vamos otra vez.", "¡Así se hace! Tu voz suena hermosa. ¡Sigamos!"],
    ["¡Casi terminamos, {name}! ¡La última ronda! ¡Tú puedes!", "¡Increíble! Ya casi terminamos. ¡Una más!"],
    ["¡Lo lograste, {name}! ¡Aprendiste 5 palabras nuevas! ¡Eres un campeón de la lectura!", "¡Bravo! ¡5 palabras nuevas para ti! ¡Eres increíble, {name}!"],
  ],

  storyIntro: "Ahora te voy a contar una historia con las palabras que aprendiste. ¡Escucha bien!",

  reviewIntro: [
    "¡Pero antes de irnos, {name}, vamos a recordar las palabras de la clase pasada! ¿Las recuerdas?",
    "¿Recuerdas las palabras de la clase pasada, {name}? ¡Vamos a verlas!",
  ],

  reviewMiddle: [
    "¿Te acuerdas de esta?",
    "¡Esa es!",
    "¡Mira esta!",
    "¡Y esta!",
    "¡La última!",
  ],

  reviewComplete: [
    "¡Las recuerdas todas, {name}! ¡Qué memoria tan buena tienes!",
    "¡Increíble, {name}! ¡Las recordaste todas!",
  ],

  storyReviewIntro: "Ahora escucha otra historia que tiene TODAS las palabras que sabes.",

  farewell: {
    wordRecap: "¡{name}, fue una clase maravillosa! Hoy aprendiste:",
    affirmationIntro: "Repite conmigo, {name}:",
    goodbye: [
      "¡Nos vemos en la próxima clase, {name}! ¡Chau chau!",
      "¡Hasta la próxima, {name}! ¡Eres increíble!",
      "¡Fue una gran clase! ¡Te espero pronto, {name}!",
    ],
  },

  affirmations: [
    "Yo soy inteligente y puedo aprender cualquier cosa",
    "Cada día soy más fuerte y más capaz",
    "Leer me abre puertas a mundos increíbles",
    "Yo creo en mí y en lo que puedo hacer",
    "Soy valiente porque aprendo cosas nuevas",
    "Mi familia está orgullosa de mí",
  ],

  onCorrectWord: [
    "¡Sí!", "¡Eso!", "¡Bien, {name}!", "¡Bravo!", "¡Genial!",
    "¡Perfecto!", "¡Excelente!", "¡Así es!", "¡Correcto!", "¡Esa es!",
    "¡Muy bien, {name}!", "¡Lo sabías!", "¡Increíble!", "¡Súper, {name}!", "¡Wow!",
  ],
} as const;

export function pickPhrase(pool: readonly string[]): string {
  return pool[Math.floor(Math.random() * pool.length)];
}

export function pickPhraseFromRound(
  pool: readonly (readonly string[])[],
  round: number
): string {
  const roundPhrases = pool[Math.min(round, pool.length - 1)];
  return roundPhrases[Math.floor(Math.random() * roundPhrases.length)];
}

export function personalizeName(text: string, childName?: string): string {
  if (childName) return text.replace(/\{name\}/g, childName);
  return text.replace(/,?\s*\{name\}/g, "").replace(/\{name\},?\s*/g, "");
}
