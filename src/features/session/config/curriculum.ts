// ═══════════════════════════════════════════════════════════════════════
// Doman Curriculum — 44 Sessions mapped to words and context sentences
//
// Each session = 5 words from the same category or mixed within a phase.
// Words are pulled in order from the phase arrays (PHASE1_WORDS, etc.)
// so session 1 = words 0-4, session 2 = words 5-9, etc.
//
// Context sentences use the 5 words of each session in a natural phrase.
// ═══════════════════════════════════════════════════════════════════════

import type { DomanWord, PhaseNumber } from "@/shared/types/doman";
import { PHASE1_WORDS, PHASE2_WORDS, PHASE3_WORDS, PHASE4_WORDS, PHASE5_WORDS } from "@/shared/constants";

export interface DomanSession {
  id: number;                 // 1-44
  worldId: string;            // world_1 ... world_5
  phase: PhaseNumber;
  worldColor: string;
  words: DomanWord[];         // Always 5
  previousWords: string[];    // Words from the previous session (for review)
  contextSentence: string;    // Uses the 5 words in a phrase
  story5: string;             // Story using the 5 session words
  previousStory?: string;     // Story of previous session (for review)
  sofiaGreeting: string;
  sofiaMiddle: string;
  sofiaFarewell: string;
  affirmation: string;
}

// ─── Sofia's phrase pools ────────────────────────────────────────────

const GREETINGS = [
  "¡Hola! Hoy vamos a aprender palabras nuevas",
  "¡Qué bueno verte! ¿Listos para aprender?",
  "¡Llegaste! Tengo palabras divertidas para ti",
  "¡Hola, amiguito! Vamos a leer juntos",
  "¡Bienvenido! Hoy descubriremos palabras nuevas",
  "¡Hola! La Seño Sofía tiene una clase especial",
  "¡Qué alegría! Empecemos nuestra clase",
  "¡Hola, estrellita! ¿Listos para leer?",
  "¡Me da gusto verte! Vamos a aprender",
  "¡Aquí estamos! Hoy será un gran día",
];

const MIDDLES = [
  "¡Muy bien! Vamos a verlas otra vez",
  "¡Excelente! Ahora las repasamos",
  "¡Lo hiciste genial! Una vez más",
  "¡Bravo! Vamos a repasarlas",
  "¡Fantástico! Ahora con más atención",
  "¡Así se hace! Repasemos juntos",
  "¡Increíble! Ahora tú las dices",
  "¡Perfecto! Vamos de nuevo",
  "¡Súper! Ahora tú solito",
  "¡Genial! Una ronda más",
];

const FAREWELLS = [
  "¡Excelente clase!",
  "¡Fue una gran sesión!",
  "¡Aprendiste mucho hoy!",
  "¡Qué bien lo hiciste!",
  "¡La Seño Sofía está orgullosa!",
  "¡Increíble trabajo!",
  "¡Eres un campeón de la lectura!",
  "¡Maravilloso! Nos vemos pronto",
  "¡Genial! Cada día lees mejor",
  "¡Fantástico! Sigue así",
];

const AFFIRMATIONS = [
  "¡Eres un gran lector!",
  "¡Cada día aprendes más!",
  "¡Puedes lograr lo que te propongas!",
  "¡Eres muy inteligente!",
  "¡Aprender es tu superpoder!",
  "¡Brillas como una estrella!",
  "¡Tu esfuerzo vale mucho!",
  "¡Eres increíble!",
  "¡Sigue así, campeón!",
  "¡Me encanta cómo aprendes!",
];

function pick(pool: string[], index: number): string {
  return pool[index % pool.length];
}

// ─── Context sentences for each session ──────────────────────────────
// Each sentence naturally incorporates the 5 words of the session.

const CONTEXT_SENTENCES: Record<number, string> = {
  // World 1 — Isla de las Palabras (Phase 1, red) — Nuevo curriculum
  1:  "Mamá y papá quieren al bebé. Abuela y abuelo también.",
  2:  "Hermano y hermana juegan. Tío, tía y primo los miran.",
  3:  "Rojo, azul, verde, amarillo y blanco son colores bonitos.",
  4:  "El perro y el gato corren. El caballo, la vaca y el pájaro los miran.",
  5:  "Manzana, banana, uva, pera y naranja son frutas ricas.",
  6:  "La ventana, la cocina y el baño. El piso y el techo de la casa.",
  7:  "Con la mano toco mi pie. Con el ojo veo mi nariz y mi boca.",
  8:  "Mi oreja escucha, mi pelo brilla. Mi dedo, brazo y pierna se mueven.",
  9:  "Tomo agua y leche. Como pan, arroz y huevo.",
  10: "En mi casa hay una mesa, una silla, una cama y una puerta.",
  // World 2 — Bahía de los Pares (Phase 2, black)
  11: "El rojo, azul, verde, amarillo y blanco son colores bonitos.",
  12: "El negro, rosa, naranja, violeta y marrón también son lindos.",
  13: "Algo grande y algo pequeño. Algo largo, algo corto y algo redondo.",
  14: "El cuadrado y el triángulo son delgados. El grueso y el mediano también.",
  15: "Arriba y abajo. Dentro y fuera. Todo es un opuesto.",
  16: "Rápido o lento. Abierto o cerrado. Nuevo o viejo.",
  17: "Estoy feliz y no triste. No enojado ni asustado. Estoy cansado.",
  18: "Estoy contento y soy valiente. Soy amable, cariñoso y tranquilo.",
  19: "El sol y la luna. La estrella, la nube y la lluvia.",
  20: "El árbol y la flor. El río, el mar y la montaña.",
  // World 3 — Valle de las Frases (Phase 3, black)
  21: "El niño come y bebe. Luego duerme, juega y camina.",
  22: "Ella corre, salta y baila. Después canta y dibuja.",
  23: "La camisa y el pantalón. El zapato, el vestido y la pollera.",
  24: "El sombrero y el abrigo combinan con la media, el cinturón y el piyama.",
  25: "Tomo el libro y el lápiz. El papel, la mochila y la maestra esperan.",
  26: "Mi amigo va a la escuela. El parque, la tienda y la playa están cerca.",
  27: "Voy al jardín del campo. La ciudad, el hospital y la iglesia quedan lejos.",
  28: "La biblioteca y el museo son grandes. El restaurante y el mercado también.",
  29: "El carro y el autobús pasan. La bicicleta, el avión y el barco viajan.",
  30: "El tren y la moto son rápidos. La ambulancia, el helicóptero y el cohete también.",
  // World 4 — Montaña de la Lectura (Phase 4, black)
  31: "El, la, los, las y un son artículos.",
  32: "Una, y, o, pero y que conectan palabras.",
  33: "En, de, por, para y con son preposiciones.",
  34: "Sin, entre, sobre, bajo y hacia indican dirección.",
  35: "Yo, tú, él, ella y nosotros somos pronombres.",
  36: "Ustedes, ellos, me, te y nos también lo son.",
  37: "Hoy, mañana, ayer, ahora y después indican tiempo.",
  38: "Siempre, nunca, temprano, tarde y pronto también.",
  39: "Uno, dos, tres, cuatro y cinco son los primeros números.",
  40: "Seis, siete, ocho, nueve y diez completan la cuenta.",
  // World 5 — El Libro Mágico (Phase 5, black)
  41: "Él quiere y puede. Él sabe, tiene y hace muchas cosas.",
  42: "Ella dice y viene. Ella sale, pone y va con alegría.",
  43: "Es muy bueno y más grande. Es menos difícil y está bien.",
  44: "Está mal aquí pero allí está cerca. Lejos, despacio y rápido.",
};

// ─── Stories for World 1 (6-8+ sentences each) ──────────────────────

const STORIES: Record<number, { story5: string; previousStory?: string }> = {
  1: {
    story5: "Hoy mamá y papá preparan una torta deliciosa. El bebé juega con sus juguetes en el suelo, mientras la abuela y el abuelo nos cuentan historias muy divertidas. ¡Qué feliz es la familia!",
  },
  2: {
    story5: "Mi hermano y mi hermana juegan en el parque con mi primo. De repente, llegan mi tío y mi tía con globos de colores. ¡Qué divertido es jugar todos juntos en familia!",
    previousStory: "Hoy mamá y papá preparan una torta deliciosa. El bebé juega con sus juguetes en el suelo, mientras la abuela y el abuelo nos cuentan historias divertidas.",
  },
  3: {
    story5: "En el jardín hay una flor de color rojo y un cielo muy azul. El pasto es verde y el sol amarillo brilla sobre una nube de color blanco. ¡Qué lindo es ver colores!",
    previousStory: "Mi hermano y mi hermana juegan en el parque con mi primo. De repente, llegan mi tío y mi tía con globos de colores. ¡Qué divertido es jugar todos juntos!",
  },
  4: {
    story5: "En el campo, un perro corre tras un gato. El caballo salta la cerca mientras la vaca come pasto y un pájaro canta desde lo alto de un árbol. ¡Qué lindos son los animales!",
    previousStory: "En el jardín hay una flor de color rojo y un cielo muy azul. El pasto es verde y el sol amarillo brilla sobre una nube de color blanco.",
  },
  5: {
    story5: "En la cocina hay una manzana roja y una banana dulce. Preparamos un jugo de uva y cortamos una pera jugosa junto a una naranja llena de sol. ¡Qué rico es comer frutas!",
    previousStory: "En el campo, un perro corre tras un gato. El caballo salta la cerca mientras la vaca come pasto y un pájaro canta desde lo alto.",
  },
  6: {
    story5: "La casa tiene una ventana grande por donde entra el sol. En la cocina mamá prepara comida rica. El baño tiene un espejo divertido. El piso es perfecto para jugar y el techo nos protege de la lluvia. ¡Qué linda es la casa!",
    previousStory: "En la cocina hay una manzana roja y una banana dulce. Preparamos un jugo de uva y cortamos una pera jugosa junto a una naranja llena de sol.",
  },
  7: {
    story5: "Con el ojo se puede ver todo el mundo. Con la nariz se huelen las flores del jardín. Con la boca se pueden cantar canciones bonitas. Con la mano se puede dibujar y con el pie se puede correr muy rápido. ¡El cuerpo es increíble!",
    previousStory: "La casa tiene una ventana grande. En la cocina mamá prepara comida. El baño tiene un espejo. El piso es para jugar y el techo nos protege.",
  },
  8: {
    story5: "Con la oreja se escucha la música y los cuentos de la abuela. El pelo brilla como el sol cuando mamá lo peina. Con cada dedo se puede contar hasta diez. Los brazos son perfectos para abrazar y las piernas para saltar muy alto. ¡Somos fuertes y especiales!",
    previousStory: "Con el ojo se puede ver. Con la nariz se huelen flores. Con la boca se canta. Con la mano se dibuja y con el pie se corre rápido.",
  },
  9: {
    story5: "Hay mucha hambre. Mamá sirve un vaso de agua fresca y un vaso de leche tibia. En la mesa hay pan calentito, arroz con pollo y un huevo revuelto. ¡Qué rica es la comida que prepara la familia!",
    previousStory: "Con la oreja se escucha música. El pelo brilla. Con el dedo se cuenta. Los brazos abrazan y las piernas saltan.",
  },
  10: {
    story5: "La casa es el lugar más lindo del mundo. Hay una mesa grande donde come toda la familia. Cada uno tiene su silla favorita. La cama es súper cómoda y antes de dormir mamá cierra la puerta y da un beso de buenas noches. ¡Todos aman su casa!",
    previousStory: "Hay hambre. Mamá sirve agua y leche. En la mesa hay pan, arroz y huevo. ¡Qué rica comida!",
  },

  // ─── World 2 — Bahía de los Pares (Phase 2) ─────────────────────────

  11: {
    story5: "En la caja de crayones hay uno rojo como una manzana, uno azul como el cielo, uno verde como el pasto, uno amarillo como el sol y uno blanco como las nubes. ¡Con todos los colores se puede pintar el mundo entero!",
    previousStory: "La casa es el lugar más lindo. Hay una mesa grande, una silla, una cama cómoda y una puerta que mamá cierra antes de dormir.",
  },
  12: {
    story5: "La mariposa tiene alas de color negro y rosa. La flor es color naranja como el atardecer. El caracol es violeta y camina sobre la tierra marrón del jardín. ¡La naturaleza tiene colores hermosos!",
    previousStory: "En la caja de crayones hay uno rojo, uno azul, uno verde, uno amarillo y uno blanco. ¡Con todos se pinta el mundo!",
  },
  13: {
    story5: "En el zoológico hay un elefante muy grande y un ratón muy pequeño. La jirafa tiene un cuello largo y el pingüino tiene patas cortas. Hasta hay un alto sombrero de copa en la tienda de regalos. ¡Qué divertido es comparar!",
    previousStory: "La mariposa tiene alas negro y rosa. La flor es naranja. El caracol es violeta y camina sobre tierra marrón.",
  },
  14: {
    story5: "El payaso es bajo y usa zapatos muy grandes. El bailarín es gordo y baila con mucha gracia. La gimnasta es flaca y muy ágil. La pelota es redonda y la caja es cuadrada. ¡Cada forma es especial!",
    previousStory: "En el zoológico hay un elefante grande y un ratón pequeño. La jirafa tiene cuello largo y el pingüino patas cortas.",
  },
  15: {
    story5: "El gatito sube arriba del árbol y luego baja abajo con cuidado. Se mete dentro de una caja y después sale fuera a explorar. Siempre se queda cerca de mamá gata. ¡Qué aventurero es el gatito!",
    previousStory: "El payaso es bajo y usa zapatos grandes. El bailarín es gordo. La gimnasta es flaca. La pelota es redonda y la caja cuadrada.",
  },
  16: {
    story5: "El conejo corre muy rápido por el campo. La tortuga camina lento pero nunca se detiene. La sopa está caliente y el helado está frío. A veces cerca y a veces lejos, pero siempre llegan a donde quieren. ¡Lo importante es seguir adelante!",
    previousStory: "El gatito sube arriba y baja abajo. Se mete dentro de una caja y sale fuera. Siempre se queda cerca de mamá gata.",
  },
  17: {
    story5: "Hoy el sol brilla y me siento muy feliz. Ayer estuve un poco triste porque perdí mi juguete. A veces me pongo enojado, y otras veces asustado cuando hay truenos. Pero ahora estoy cansado de tanto jugar. ¡Mañana será otro gran día!",
    previousStory: "El conejo corre rápido. La tortuga camina lento. La sopa está caliente y el helado frío.",
  },
  18: {
    story5: "Mi amigo siempre está contento y es muy tranquilo. A veces nos quedamos sorprendidos cuando vemos un arcoíris. Él es valiente cuando hay que cruzar el puente alto y siempre es amable con todos. ¡Tener un buen amigo es lo mejor!",
    previousStory: "Hoy me siento feliz. Ayer estuve triste. A veces me pongo enojado o asustado. Ahora estoy cansado de jugar.",
  },
  19: {
    story5: "El sol sale por la mañana y calienta todo. La luna aparece de noche con su luz plateada. Una estrella brilla en el cielo junto a una nube blanca. Cuando la lluvia cae, salen charcos para saltar. ¡El cielo siempre tiene algo lindo!",
    previousStory: "Mi amigo está contento y es tranquilo. Nos quedamos sorprendidos con el arcoíris. Él es valiente y amable.",
  },
  20: {
    story5: "En el bosque hay un árbol enorme con hojas verdes. A su lado crece una flor de muchos colores. Un río corre entre las piedras hasta llegar al mar azul. A lo lejos se ve una montaña con nieve en la punta. ¡La naturaleza es mágica!",
    previousStory: "El sol calienta. La luna brilla de noche. Una estrella y una nube están en el cielo. La lluvia hace charcos para saltar.",
  },

  // ─── World 3 — Valle de las Frases (Phase 3) ────────────────────────

  21: {
    story5: "El niño come su desayuno con mucha alegría. Luego bebe un vaso de jugo fresco. Después de almorzar, duerme una siesta corta. Al despertar, juega con sus amigos en el patio y corre por todo el jardín. ¡Qué día tan divertido!",
    previousStory: "En el bosque hay un árbol enorme. Una flor crece a su lado. Un río corre hasta el mar. A lo lejos una montaña con nieve.",
  },
  22: {
    story5: "La niña salta la cuerda en el recreo. Luego lee un cuento muy bonito. Después escribe su nombre con letras grandes. Cuando termina, canta su canción favorita y baila con mucha gracia. ¡Le encanta la escuela!",
    previousStory: "El niño come, bebe jugo, duerme la siesta, juega con amigos y corre por el jardín.",
  },
  23: {
    story5: "La mamá abre la puerta del armario. Luego cierra la ventana porque hace frío. El gato sube a la mesa de un salto. Papá baja las escaleras con cuidado. La hermana toca el piano con alegría. ¡Cada uno hace algo diferente!",
    previousStory: "La niña salta la cuerda. Lee un cuento. Escribe su nombre. Canta y baila con gracia.",
  },
  24: {
    story5: "Mamá lava los platos después de comer. Abuela cocina una sopa deliciosa. Hermana limpia su cuarto con mucho orden. El niño pinta un cuadro con muchos colores y luego dibuja a toda la familia. ¡Todos ayudan en casa!",
    previousStory: "Mamá abre la puerta. Cierra la ventana. El gato sube a la mesa. Papá baja las escaleras. Hermana toca el piano.",
  },
  25: {
    story5: "La camisa azul y el pantalón gris están listos para la escuela. Los zapatos brillan porque papá los limpió. La gorra roja protege del sol. Hermana se pone su pollera verde favorita. ¡Todos se ven muy lindos!",
    previousStory: "Mamá lava los platos. Abuela cocina sopa. Hermana limpia su cuarto. El niño pinta y dibuja.",
  },
  26: {
    story5: "La media tiene rayas de colores. El vestido de mamá es muy elegante. El abrigo de papá es grande y calientito. La bufanda de la abuela huele a flores. El piyama del bebé tiene estrellas. ¡Cada prenda es especial!",
    previousStory: "La camisa azul y el pantalón están listos. Los zapatos brillan. La gorra protege del sol. Hermana usa su pollera verde.",
  },
  27: {
    story5: "En la mochila hay un libro de cuentos y un lápiz afilado. También hay papel para dibujar, unas tijeras con punta redonda y pegamento para manualidades. ¡Todo listo para un día genial en la escuela!",
    previousStory: "La media tiene rayas. El vestido es elegante. El abrigo es grande. La bufanda huele a flores. El piyama tiene estrellas.",
  },
  28: {
    story5: "La mochila está llena de sorpresas. La maestra saluda con una sonrisa grande. Mi mejor amigo me espera en la entrada. En la clase aprendemos cosas nuevas cada día. Y en el recreo jugamos todos juntos. ¡La escuela es genial!",
    previousStory: "En la mochila hay un libro, un lápiz, papel, tijeras y pegamento. ¡Todo listo para la escuela!",
  },
  29: {
    story5: "El domingo vamos al parque a jugar. Después pasamos por la tienda a comprar ropa. Cerca está la escuela donde estudia mi hermano. Al lado hay un hospital donde trabaja mi tía. Y la iglesia donde se casan los novios. ¡El barrio tiene de todo!",
    previousStory: "La mochila está llena. La maestra saluda. Mi amigo me espera. En la clase aprendemos. En el recreo jugamos.",
  },
  30: {
    story5: "En vacaciones vamos a la playa a nadar y hacer castillos. El campo tiene vacas y caballos. La ciudad tiene edificios altos. En la calle hay autos y bicicletas. Y en el jardín de la abuela hay flores de todos los colores. ¡Cada lugar es una aventura!",
    previousStory: "Vamos al parque. Pasamos por la tienda. Cerca está la escuela, el hospital y la iglesia.",
  },

  // ─── World 4 — Montaña de la Lectura (Phase 4) ──────────────────────

  31: {
    story5: "El perro corre por el parque. La gata duerme en la silla. Los pájaros cantan en el árbol. Las flores son de muchos colores. Un niño juega feliz. ¡el, la, los, las y un hacen que todo suene bonito!",
    previousStory: "Vamos a la playa. El campo tiene vacas. La ciudad tiene edificios. En la calle hay autos. En el jardín hay flores.",
  },
  32: {
    story5: "Una estrella brilla en el cielo. Unos gatitos juegan juntos. Unas mariposas vuelan alto. El sol y la luna se turnan para brillar. Mamá prepara la cena con mucho amor. ¡Las palabras conectan ideas!",
    previousStory: "El perro corre. La gata duerme. Los pájaros cantan. Las flores son lindas. Un niño juega feliz.",
  },
  33: {
    story5: "El gato duerme en la cama. El regalo es de mamá. Caminamos por el parque. Las flores son para la abuela. Jugamos con los amigos. ¡Las preposiciones nos dicen dónde y cómo!",
    previousStory: "Una estrella brilla. Unos gatitos juegan. Unas mariposas vuelan. El sol y la luna brillan. Mamá cocina con amor.",
  },
  34: {
    story5: "Sin zapatos corremos por el pasto. Entre los árboles jugamos a las escondidas. El gato está sobre la mesa mirando todo. El perro está bajo la silla descansando. Caminamos hacia el parque todos juntos. ¡Cada palabra nos guía!",
    previousStory: "El gato duerme en la cama. El regalo es de mamá. Caminamos por el parque. Las flores son para abuela. Jugamos con amigos.",
  },
  35: {
    story5: "Yo tengo un perro que se llama Luna. Tú tienes un gato muy juguetón. Él dibuja muy bonito en la escuela. Ella canta canciones con su mamá. Nosotros jugamos juntos en el recreo. ¡Todos somos amigos!",
    previousStory: "Sin zapatos corremos. Entre árboles jugamos. El gato sobre la mesa. El perro bajo la silla. Caminamos hacia el parque.",
  },
  36: {
    story5: "Mi mochila es azul con estrellas. Tu casa tiene un jardín muy lindo. Su perro es grande y muy cariñoso. Este libro tiene muchos dibujos. Ese árbol es el más alto del parque. ¡Cada cosa tiene su dueño!",
    previousStory: "Yo tengo un perro. Tú tienes un gato. Él dibuja. Ella canta. Nosotros jugamos juntos.",
  },
  37: {
    story5: "Hoy es un día muy bonito y soleado. Mañana vamos a ir al parque con los abuelos. Ayer llovió mucho y saltamos en los charcos. Ahora estamos jugando con los primos. Después vamos a comer helado de fresa. ¡Cada momento es especial!",
    previousStory: "Mi mochila es azul. Tu casa tiene jardín. Su perro es grande. Este libro tiene dibujos. Ese árbol es alto.",
  },
  38: {
    story5: "Siempre le doy un abrazo a mamá antes de dormir. Nunca olvido decir gracias cuando me ayudan. Pronto llegará el día de mi cumpleaños. Antes de ir a la escuela desayuno bien. Llego tarde a veces pero siempre con una sonrisa. ¡El tiempo pasa volando!",
    previousStory: "Hoy es bonito. Mañana vamos al parque. Ayer llovió. Ahora jugamos. Después comemos helado.",
  },
  39: {
    story5: "Tengo un dedo pulgar que saluda. Mis dos ojos ven el mundo entero. Con tres saltos llego a la puerta. Cuatro gatitos duermen en la cesta. Y con cinco dedos puedo contar una mano. ¡Los números están en todas partes!",
    previousStory: "Siempre abrazo a mamá. Nunca olvido dar gracias. Pronto es mi cumpleaños. Antes desayuno. A veces llego tarde.",
  },
  40: {
    story5: "Seis pájaros cantan en la ventana. Siete estrellas brillan de noche. Ocho crayones pintan un arcoíris. Nueve hormiguitas marchan en fila. Y diez globos vuelan por el cielo. ¡Ya sé contar hasta diez!",
    previousStory: "Tengo un dedo. Mis dos ojos ven. Con tres saltos llego. Cuatro gatitos duermen. Cinco dedos en la mano.",
  },

  // ─── World 5 — El Libro Mágico (Phase 5) ───────────────────────────

  41: {
    story5: "El niño quiere aprender a leer y sabe que puede lograrlo. Él sabe que es inteligente porque tiene muchos libros en su cuarto. Todos los días hace algo nuevo y divertido. ¡Aprender es su superpoder!",
    previousStory: "Seis pájaros cantan. Siete estrellas brillan. Ocho crayones pintan. Nueve hormiguitas marchan. Diez globos vuelan.",
  },
  42: {
    story5: "Sofía dice que hoy será un gran día. Ella viene a la escuela con una sonrisa enorme. Cuando sale al recreo juega con todos. Después llega a casa y abraza a mamá. Siempre busca nuevas aventuras. ¡Sofía es muy especial!",
    previousStory: "El niño quiere aprender. Puede lograrlo. Sabe que es inteligente. Tiene libros. Hace cosas nuevas.",
  },
  43: {
    story5: "El perro es muy juguetón y corre más rápido que el gato. El gato come menos que el perro pero se porta bien todo el día. Nunca se porta mal porque es un gatito bueno. ¡Los dos son los mejores amigos!",
    previousStory: "Sofía dice que será un gran día. Viene a la escuela. Sale al recreo. Llega a casa. Busca aventuras.",
  },
  44: {
    story5: "Aquí en mi casa estoy seguro. Allí en el parque juego con mis amigos. También me gusta ir a la escuela porque nunca estoy solo. Siempre estamos junto a las personas que nos quieren. ¡La vida es una aventura hermosa!",
    previousStory: "El perro es muy juguetón. Corre más rápido. El gato come menos. Se porta bien. Nunca se porta mal.",
  },
};

// ─── Build the 44 sessions ──────────────────────────────────────────

interface PhaseSpec {
  words: DomanWord[];
  phase: PhaseNumber;
  worldId: string;
  worldColor: string;
  sessionsCount: number;
}

const PHASE_SPECS: PhaseSpec[] = [
  { words: PHASE1_WORDS, phase: 1, worldId: "world_1", worldColor: "#48bb78", sessionsCount: 10 },
  { words: PHASE2_WORDS, phase: 2, worldId: "world_2", worldColor: "#667eea", sessionsCount: 10 },
  { words: PHASE3_WORDS, phase: 3, worldId: "world_3", worldColor: "#fbbf24", sessionsCount: 10 },
  { words: PHASE4_WORDS, phase: 4, worldId: "world_4", worldColor: "#f56565", sessionsCount: 10 },
  { words: PHASE5_WORDS, phase: 5, worldId: "world_5", worldColor: "#f093fb", sessionsCount: 4 },
];

function buildSessions(): DomanSession[] {
  const sessions: DomanSession[] = [];
  let sessionId = 1;

  for (const spec of PHASE_SPECS) {
    for (let i = 0; i < spec.sessionsCount; i++) {
      const start = i * 5;
      const words = spec.words.slice(start, start + 5);

      // Previous session's words (for review in session 2+)
      const previousWords: string[] = i > 0
        ? spec.words.slice((i - 1) * 5, i * 5).map((w) => w.text)
        : [];

      const storyData = STORIES[sessionId];

      sessions.push({
        id: sessionId,
        worldId: spec.worldId,
        phase: spec.phase,
        worldColor: spec.worldColor,
        words,
        previousWords,
        contextSentence: CONTEXT_SENTENCES[sessionId] ?? "",
        story5: storyData?.story5 ?? CONTEXT_SENTENCES[sessionId] ?? "",
        previousStory: storyData?.previousStory,
        sofiaGreeting: pick(GREETINGS, sessionId - 1),
        sofiaMiddle: pick(MIDDLES, sessionId - 1),
        sofiaFarewell: pick(FAREWELLS, sessionId - 1),
        affirmation: pick(AFFIRMATIONS, sessionId - 1),
      });

      sessionId++;
    }
  }

  return sessions;
}

export const CURRICULUM: DomanSession[] = buildSessions();

export function getSession(id: number): DomanSession | undefined {
  return CURRICULUM.find((s) => s.id === id);
}

export function getWorldSessions(worldId: string): DomanSession[] {
  return CURRICULUM.filter((s) => s.worldId === worldId);
}

export const TOTAL_SESSIONS = CURRICULUM.length; // 44
