export interface SessionScript {
  introduction: string;
  round1: {
    betweenTandas: [string, string, string];
  };
  round2: {
    intro: string;
    askWord: string;
    onCorrect: string;
    onFail: string;
  };
  round3: {
    intro: string;
  };
  review: {
    intro: string;
    askFirst: string;
    askMiddle: string;
    askGeneric: string;
    askSecondToLast: string;
    askLast: string;
    onCorrect: string[];
    onFail: string;
    reviewStoryIntro: string;
    complete: string;
  };
  farewell: string;
}

export const DEFAULT_SESSION_SCRIPT: SessionScript = {
  introduction: "¡Hola! Soy la Seño Sofía y hoy vamos a descubrir palabras mágicas juntos. Antes de empezar quiero que sepas algo muy importante: sos una persona increíble, sos muy inteligente y sos capaz de aprender todo lo que te propongas. Ahora, prestá mucha atención. Te voy a ir mostrando unas palabras muy especiales para que las vayas conociendo y aprendiendo. Solo tenés que mirarlas y escucharme. ¿Estás listo? ¡Vamos!",

  round1: {
    betweenTandas: [
      "¡Excelente esfuerzo! Tu cerebro está brillando y absorbiendo todo. Vamos a verlas una vez más, ¡concentrate!",
      "¡Lo hacés cada vez mejor! Sos un campeón. Vamos por la última tanda de esta ronda, ¡vos podés!",
      "¡Guau! Ya casi las tenés todas grabadas en tu cabecita.",
    ],
  },

  round2: {
    // NOTE: this phrase must be DIFFERENT from round1.betweenTandas[2]
    // to avoid Sofia repeating the same line back-to-back.
    intro: "¡Ahora preparate! En esta parte te toca a vos decirme qué dicen las palabras. ¡Vamos!",
    askWord: "¿Qué dice acá?",
    onCorrect: "¡Eso es! ¡Dice {word}! ¡Sigamos!",
    onFail: "¡No pasa nada! Esta palabra es {word}. ¡Seguí intentando, lo hacés genial!",
  },

  round3: {
    intro: "¡Ahora escuchá esta historia muy linda con las palabras que aprendiste!",
  },

  review: {
    intro: "¡Esperá! No te vayas todavía. Antes de terminar, vamos a ver si te acordás de las palabras que conocimos ayer. ¿Te acordás? ¡Vamos a repasarlas rápido!",
    askFirst: "¿Te acordás qué dice acá?",
    askMiddle: "¿Y acá qué dice?",
    askGeneric: "¿Qué dice acá?",
    askSecondToLast: "¿Quién nos falta? ¿Qué dice acá?",
    askLast: "¿Y el último? ¿Qué dice acá?",
    onCorrect: [
      "¡Eso es! ¡Es {word}! ¡Qué buena memoria tenés!",
      "¡Excelente! ¡Dice {word}! ¡Vas muy bien!",
      "¡Sí! ¡Dice {word}! ¡Sos un genio!",
      "¡Exacto! ¡Dice {word}! ¡Qué alegría!",
      "¡Increíble! ¡Dice {word}! ¡Te las acordás todas!",
    ],
    onFail: "¡No te preocupes! Esta es {word}. ¡Sigamos!",
    reviewStoryIntro: "¡Qué bien lo hiciste! Mirá cómo se veía la historia de ayer:",
    complete: "¡Te las acordás todas! ¡Qué memoria tan buena!",
  },

  farewell: "¡Increíble trabajo el de hoy! Aprendiste 5 palabras nuevas: {words_list}, y lo hiciste de maravilla. Recordá siempre que sos una persona única, especial y muy valiosa. Estoy muy orgullosa de vos. ¡Te mando un gran abrazo y nos vemos en nuestra próxima aventura de aprendizaje!",
};

export function fillScript(
  text: string,
  vars: { name?: string; word?: string; words_list?: string }
): string {
  let result = text;
  if (vars.name) result = result.replace(/\{name\}/g, vars.name);
  if (vars.word) result = result.replace(/\{word\}/g, vars.word);
  if (vars.words_list) result = result.replace(/\{words_list\}/g, vars.words_list);
  result = result.replace(/,?\s*\{name\}/g, "").replace(/\{name\},?\s*/g, "");
  result = result.replace(/\{word\}/g, "").replace(/\{words_list\}/g, "");
  return result;
}
