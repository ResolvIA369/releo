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
  introduction: "¡Hola, {name}, mi pequeño genio! Soy la Seño Sofía y hoy vamos a descubrir palabras mágicas juntos. {name}, antes de empezar quiero que sepas algo muy importante: tú eres una persona increíble, eres muy inteligente y eres capaz de aprender todo lo que te propongas. Ahora, presta mucha atención. Lo que vamos a hacer es esto: te voy a ir mostrando unas palabras muy especiales para que las vayas conociendo y aprendiendo. Solo tienes que mirarlas y escucharme. ¿Estás listo, {name}? ¡Vamos!",

  round1: {
    betweenTandas: [
      "¡Excelente esfuerzo, {name}! Tu cerebro está brillando y absorbiendo todo. Vamos a verlas una vez más, ¡concéntrate!",
      "¡Lo haces cada vez mejor, {name}! Eres un campeón. Vamos por la última tanda de esta ronda, ¡tú puedes!",
      "¡Guau, {name}! Ya casi las tienes todas grabadas en tu cabecita. Ahora prepárate, porque en la siguiente parte te toca a ti decirme qué dicen las palabras.",
    ],
  },

  round2: {
    intro: "¡Guau, {name}! Ya casi las tienes todas grabadas en tu cabecita. Ahora prepárate, porque en la siguiente parte te toca a ti decirme qué dicen las palabras.",
    askWord: "{name}, ¿qué dice aquí?",
    onCorrect: "¡Eso es, {name}! ¡Dice {word}! ¡Sigamos!",
    onFail: "¡No pasa nada, {name}! Esta palabra es {word}. ¡Sigue intentando, lo haces genial!",
  },

  round3: {
    intro: "¡Ahora escucha esta historia muy bonita con las palabras que aprendiste!",
  },

  review: {
    intro: "¡Espera, {name}! No te vayas todavía. Antes de terminar, vamos a ver si recuerdas a los amigos que conocimos ayer. ¿Te acuerdas de ellos? ¡Vamos a saludarlos muy rápido para ver cuánto has crecido!",
    askFirst: "{name}, ¿te acuerdas qué dice aquí?",
    askMiddle: "{name}, ¿y aquí qué dice?",
    askGeneric: "{name}, ¿qué dice aquí?",
    askSecondToLast: "{name}, ¿quién nos falta? ¿Qué dice aquí?",
    askLast: "{name}, ¿y el último? ¿Qué dice aquí?",
    onCorrect: [
      "¡Eso es! ¡Es {word}! ¡Qué buena memoria tienes!",
      "¡Excelente! ¡Dice {word}! ¡Vas muy bien!",
      "¡Sí! ¡Dice {word}! ¡Eres un genio!",
      "¡Exacto! ¡Dice {word}! ¡Qué alegría!",
      "¡Increíble, {name}! ¡Dice {word}! ¡Te las acuerdas todas!",
    ],
    onFail: "¡No te preocupes, {name}! Esta es {word}. ¡Sigamos!",
    reviewStoryIntro: "¡Qué bien lo hiciste, {name}! Mira cómo se veía la historia de ayer:",
    complete: "¡Te las acuerdas todas, {name}! ¡Qué memoria tan buena!",
  },

  farewell: "¡Increíble trabajo el de hoy, {name}! Has aprendido 5 palabras nuevas: {words_list}, y lo has hecho de maravilla. Recuerda siempre que eres una persona única, especial y muy valiosa. Estoy muy orgullosa de ti. ¡Te mando un gran abrazo y nos vemos en nuestra próxima aventura de aprendizaje! ¡Adiós!",
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
