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
  12: "El negro, rosa, naranja, morado y café también son lindos.",
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
  23: "La camisa y el pantalón. El zapato, el vestido y la falda.",
  24: "El sombrero y la chaqueta combinan con el calcetín, el cinturón y el pijama.",
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
    story5: "Hoy Mamá y Papá preparan una torta deliciosa. El Bebé juega con sus juguetes en el suelo, mientras la Abuela y el Abuelo nos cuentan historias muy divertidas. ¡Qué feliz es la familia!",
  },
  2: {
    story5: "Mi Hermano y mi Hermana juegan en el parque con mi Primo. De repente, llegan mi Tío y mi Tía con globos de colores. ¡Qué divertido es jugar todos juntos en familia!",
    previousStory: "Hoy Mamá y Papá preparan una torta deliciosa. El Bebé juega con sus juguetes en el suelo, mientras la Abuela y el Abuelo nos cuentan historias divertidas.",
  },
  3: {
    story5: "En el jardín hay una flor de color Rojo y un cielo muy Azul. El pasto es Verde y el sol Amarillo brilla sobre una nube de color Blanco. ¡Qué lindo es ver colores!",
    previousStory: "Mi Hermano y mi Hermana juegan en el parque con mi Primo. De repente, llegan mi Tío y mi Tía con globos de colores. ¡Qué divertido es jugar todos juntos!",
  },
  4: {
    story5: "En el campo, un Perro corre tras un Gato. El Caballo salta la cerca mientras la Vaca come pasto y un Pájaro canta desde lo alto de un árbol. ¡Qué lindos son los animales!",
    previousStory: "En el jardín hay una flor de color Rojo y un cielo muy Azul. El pasto es Verde y el sol Amarillo brilla sobre una nube de color Blanco.",
  },
  5: {
    story5: "En la cocina hay una Manzana roja y una Banana dulce. Preparamos un jugo de Uva y cortamos una Pera jugosa junto a una Naranja llena de sol. ¡Qué rico es comer frutas!",
    previousStory: "En el campo, un Perro corre tras un Gato. El Caballo salta la cerca mientras la Vaca come pasto y un Pájaro canta desde lo alto.",
  },
  6: {
    story5: "La casa tiene una Ventana grande por donde entra el sol. En la Cocina mamá prepara comida rica. El Baño tiene un espejo divertido. El Piso es perfecto para jugar y el Techo nos protege de la lluvia. ¡Qué linda es la casa!",
    previousStory: "En la cocina hay una Manzana roja y una Banana dulce. Preparamos un jugo de Uva y cortamos una Pera jugosa junto a una Naranja llena de sol.",
  },
  7: {
    story5: "Con el Ojo se puede ver todo el mundo. Con la Nariz se huelen las flores del jardín. Con la Boca se pueden cantar canciones bonitas. Con la Mano se puede dibujar y con el Pie se puede correr muy rápido. ¡El cuerpo es increíble!",
    previousStory: "La casa tiene una Ventana grande. En la Cocina mamá prepara comida. El Baño tiene un espejo. El Piso es para jugar y el Techo nos protege.",
  },
  8: {
    story5: "Con la Oreja se escucha la música y los cuentos de la abuela. El Pelo brilla como el sol cuando mamá lo peina. Con cada Dedo se puede contar hasta diez. Los Brazos son perfectos para abrazar y las Piernas para saltar muy alto. ¡Somos fuertes y especiales!",
    previousStory: "Con el Ojo se puede ver. Con la Nariz se huelen flores. Con la Boca se canta. Con la Mano se dibuja y con el Pie se corre rápido.",
  },
  9: {
    story5: "Hay mucha hambre. Mamá sirve un vaso de Agua fresca y un vaso de Leche tibia. En la mesa hay Pan calentito, Arroz con pollo y un Huevo revuelto. ¡Qué rica es la comida que prepara la familia!",
    previousStory: "Con la Oreja se escucha música. El Pelo brilla. Con el Dedo se cuenta. Los Brazos abrazan y las Piernas saltan.",
  },
  10: {
    story5: "La Casa es el lugar más lindo del mundo. Hay una Mesa grande donde come toda la familia. Cada uno tiene su Silla favorita. La Cama es súper cómoda y antes de dormir mamá cierra la Puerta y da un beso de buenas noches. ¡Todos aman su casa!",
    previousStory: "Hay hambre. Mamá sirve Agua y Leche. En la mesa hay Pan, Arroz y Huevo. ¡Qué rica comida!",
  },

  // ─── World 2 — Bahía de los Pares (Phase 2) ─────────────────────────

  11: {
    story5: "En la caja de crayones hay uno Rojo como una manzana, uno Azul como el cielo, uno Verde como el pasto, uno Amarillo como el sol y uno Blanco como las nubes. ¡Con todos los colores se puede pintar el mundo entero!",
    previousStory: "La Casa es el lugar más lindo. Hay una Mesa grande, una Silla, una Cama cómoda y una Puerta que mamá cierra antes de dormir.",
  },
  12: {
    story5: "La mariposa tiene alas de color Negro y Rosa. La flor es color Naranja como el atardecer. El caracol es Morado y camina sobre la tierra Café del jardín. ¡La naturaleza tiene colores hermosos!",
    previousStory: "En la caja de crayones hay uno Rojo, uno Azul, uno Verde, uno Amarillo y uno Blanco. ¡Con todos se pinta el mundo!",
  },
  13: {
    story5: "En el zoológico hay un elefante muy Grande y un ratón muy Pequeño. La jirafa tiene un cuello Largo y el pingüino tiene patas Cortas. Hasta hay un Alto sombrero de copa en la tienda de regalos. ¡Qué divertido es comparar!",
    previousStory: "La mariposa tiene alas Negro y Rosa. La flor es Naranja. El caracol es Morado y camina sobre tierra Café.",
  },
  14: {
    story5: "El payaso es Bajo y usa zapatos muy grandes. El bailarín es Gordo y baila con mucha gracia. La gimnasta es Flaca y muy ágil. La pelota es Redonda y la caja es Cuadrada. ¡Cada forma es especial!",
    previousStory: "En el zoológico hay un elefante Grande y un ratón Pequeño. La jirafa tiene cuello Largo y el pingüino patas Cortas.",
  },
  15: {
    story5: "El gatito sube Arriba del árbol y luego baja Abajo con cuidado. Se mete Dentro de una caja y después sale Fuera a explorar. Siempre se queda Cerca de mamá gata. ¡Qué aventurero es el gatito!",
    previousStory: "El payaso es Bajo y usa zapatos grandes. El bailarín es Gordo. La gimnasta es Flaca. La pelota es Redonda y la caja Cuadrada.",
  },
  16: {
    story5: "El conejo corre muy Rápido por el campo. La tortuga camina Lento pero nunca se detiene. La sopa está Caliente y el helado está Frío. A veces Cerca y a veces Lejos, pero siempre llegan a donde quieren. ¡Lo importante es seguir adelante!",
    previousStory: "El gatito sube Arriba y baja Abajo. Se mete Dentro de una caja y sale Fuera. Siempre se queda Cerca de mamá gata.",
  },
  17: {
    story5: "Hoy el sol brilla y me siento muy Feliz. Ayer estuve un poco Triste porque perdí mi juguete. A veces me pongo Enojado, y otras veces Asustado cuando hay truenos. Pero ahora estoy Cansado de tanto jugar. ¡Mañana será otro gran día!",
    previousStory: "El conejo corre Rápido. La tortuga camina Lento. La sopa está Caliente y el helado Frío.",
  },
  18: {
    story5: "Mi amigo siempre está Contento y es muy Tranquilo. A veces nos quedamos Sorprendidos cuando vemos un arcoíris. Él es Valiente cuando hay que cruzar el puente alto y siempre es Amable con todos. ¡Tener un buen amigo es lo mejor!",
    previousStory: "Hoy me siento Feliz. Ayer estuve Triste. A veces me pongo Enojado o Asustado. Ahora estoy Cansado de jugar.",
  },
  19: {
    story5: "El Sol sale por la mañana y calienta todo. La Luna aparece de noche con su luz plateada. Una Estrella brilla en el cielo junto a una Nube blanca. Cuando la Lluvia cae, salen charcos para saltar. ¡El cielo siempre tiene algo lindo!",
    previousStory: "Mi amigo está Contento y es Tranquilo. Nos quedamos Sorprendidos con el arcoíris. Él es Valiente y Amable.",
  },
  20: {
    story5: "En el bosque hay un Árbol enorme con hojas verdes. A su lado crece una Flor de muchos colores. Un Río corre entre las piedras hasta llegar al Mar azul. A lo lejos se ve una Montaña con nieve en la punta. ¡La naturaleza es mágica!",
    previousStory: "El Sol calienta. La Luna brilla de noche. Una Estrella y una Nube están en el cielo. La Lluvia hace charcos para saltar.",
  },

  // ─── World 3 — Valle de las Frases (Phase 3) ────────────────────────

  21: {
    story5: "El niño Come su desayuno con mucha alegría. Luego Bebe un vaso de jugo fresco. Después de almorzar, Duerme una siesta corta. Al despertar, Juega con sus amigos en el patio y Corre por todo el jardín. ¡Qué día tan divertido!",
    previousStory: "En el bosque hay un Árbol enorme. Una Flor crece a su lado. Un Río corre hasta el Mar. A lo lejos una Montaña con nieve.",
  },
  22: {
    story5: "La niña Salta la cuerda en el recreo. Luego Lee un cuento muy bonito. Después Escribe su nombre con letras grandes. Cuando termina, Canta su canción favorita y Baila con mucha gracia. ¡Le encanta la escuela!",
    previousStory: "El niño Come, Bebe jugo, Duerme la siesta, Juega con amigos y Corre por el jardín.",
  },
  23: {
    story5: "La mamá Abre la puerta del armario. Luego Cierra la ventana porque hace frío. El gato Sube a la mesa de un salto. Papá Baja las escaleras con cuidado. La hermana Toca el piano con alegría. ¡Cada uno hace algo diferente!",
    previousStory: "La niña Salta la cuerda. Lee un cuento. Escribe su nombre. Canta y Baila con gracia.",
  },
  24: {
    story5: "Mamá Lava los platos después de comer. Abuela Cocina una sopa deliciosa. Hermana Limpia su cuarto con mucho orden. El niño Pinta un cuadro con muchos colores y luego Dibuja a toda la familia. ¡Todos ayudan en casa!",
    previousStory: "Mamá Abre la puerta. Cierra la ventana. El gato Sube a la mesa. Papá Baja las escaleras. Hermana Toca el piano.",
  },
  25: {
    story5: "La Camisa azul y el Pantalón gris están listos para la escuela. Los Zapatos brillan porque papá los limpió. La Gorra roja protege del sol. Hermana se pone su Falda verde favorita. ¡Todos se ven muy lindos!",
    previousStory: "Mamá Lava los platos. Abuela Cocina sopa. Hermana Limpia su cuarto. El niño Pinta y Dibuja.",
  },
  26: {
    story5: "El Calcetín tiene rayas de colores. El Vestido de mamá es muy elegante. La Chaqueta de papá es grande y calientita. La Bufanda de la abuela huele a flores. El Pijama del bebé tiene estrellas. ¡Cada prenda es especial!",
    previousStory: "La Camisa azul y el Pantalón están listos. Los Zapatos brillan. La Gorra protege del sol. Hermana usa su Falda verde.",
  },
  27: {
    story5: "En la mochila hay un Libro de cuentos y un Lápiz afilado. También hay Papel para dibujar, unas Tijeras con punta redonda y Pegamento para manualidades. ¡Todo listo para un día genial en la escuela!",
    previousStory: "El Calcetín tiene rayas. El Vestido es elegante. La Chaqueta es grande. La Bufanda huele a flores. El Pijama tiene estrellas.",
  },
  28: {
    story5: "La Mochila está llena de sorpresas. La Maestra saluda con una sonrisa grande. Mi mejor Amigo me espera en la entrada. En la Clase aprendemos cosas nuevas cada día. Y en el Recreo jugamos todos juntos. ¡La escuela es genial!",
    previousStory: "En la mochila hay un Libro, un Lápiz, Papel, Tijeras y Pegamento. ¡Todo listo para la escuela!",
  },
  29: {
    story5: "El domingo vamos al Parque a jugar. Después pasamos por la Tienda a comprar helado. Cerca está la Escuela donde estudia mi hermano. Al lado hay un Hospital donde trabaja mi tía. Y la Iglesia donde se casan los novios. ¡El barrio tiene de todo!",
    previousStory: "La Mochila está llena. La Maestra saluda. Mi Amigo me espera. En la Clase aprendemos. En el Recreo jugamos.",
  },
  30: {
    story5: "En vacaciones vamos a la Playa a nadar y hacer castillos. El Campo tiene vacas y caballos. La Ciudad tiene edificios altos. En la Calle hay carros y bicicletas. Y en el Jardín de la abuela hay flores de todos los colores. ¡Cada lugar es una aventura!",
    previousStory: "Vamos al Parque. Pasamos por la Tienda. Cerca está la Escuela, el Hospital y la Iglesia.",
  },

  // ─── World 4 — Montaña de la Lectura (Phase 4) ──────────────────────

  31: {
    story5: "El perro corre por el parque. La gata duerme en la silla. Los pájaros cantan en el árbol. Las flores son de muchos colores. Un niño juega feliz. ¡El, La, Los, Las y Un hacen que todo suene bonito!",
    previousStory: "Vamos a la Playa. El Campo tiene vacas. La Ciudad tiene edificios. En la Calle hay carros. En el Jardín hay flores.",
  },
  32: {
    story5: "Una estrella brilla en el cielo. Unos gatitos juegan juntos. Unas mariposas vuelan alto. El sol Y la luna se turnan para brillar. Mamá prepara la cena Con mucho amor. ¡Las palabras conectan ideas!",
    previousStory: "El perro corre. La gata duerme. Los pájaros cantan. Las flores son lindas. Un niño juega feliz.",
  },
  33: {
    story5: "El gato duerme En la cama. El regalo es De mamá. Caminamos Por el parque. Las flores son Para la abuela. Jugamos Con los amigos. ¡Las preposiciones nos dicen dónde y cómo!",
    previousStory: "Una estrella brilla. Unos gatitos juegan. Unas mariposas vuelan. El sol Y la luna brillan. Mamá cocina Con amor.",
  },
  34: {
    story5: "Sin zapatos corremos por el pasto. Entre los árboles jugamos a las escondidas. El gato está Sobre la mesa mirando todo. El perro está bajo la silla descansando. Caminamos Hacia el parque todos juntos. ¡Cada palabra nos guía!",
    previousStory: "El gato duerme En la cama. El regalo es De mamá. Caminamos Por el parque. Las flores son Para abuela. Jugamos Con amigos.",
  },
  35: {
    story5: "Yo tengo un perro que se llama Luna. Tú tienes un gato muy juguetón. Él dibuja muy bonito en la escuela. Ella canta canciones con su mamá. Nosotros jugamos juntos en el recreo. ¡Todos somos amigos!",
    previousStory: "Sin zapatos corremos. Entre árboles jugamos. El gato Sobre la mesa. El perro bajo la silla. Caminamos Hacia el parque.",
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
    story5: "Siempre le doy un abrazo a mamá antes de dormir. Nunca olvido decir gracias cuando me ayudan. Pronto llegará el día de mi cumpleaños. Antes de ir a la escuela desayuno bien. Llego Tarde a veces pero siempre con una sonrisa. ¡El tiempo pasa volando!",
    previousStory: "Hoy es bonito. Mañana vamos al parque. Ayer llovió. Ahora jugamos. Después comemos helado.",
  },
  39: {
    story5: "Tengo Un dedo pulgar que saluda. Mis Dos ojos ven el mundo entero. Con Tres saltos llego a la puerta. Cuatro gatitos duermen en la cesta. Y con Cinco dedos puedo contar una mano. ¡Los números están en todas partes!",
    previousStory: "Siempre abrazo a mamá. Nunca olvido dar gracias. Pronto es mi cumpleaños. Antes desayuno. A veces llego Tarde.",
  },
  40: {
    story5: "Seis pájaros cantan en la ventana. Siete estrellas brillan de noche. Ocho crayones pintan un arcoíris. Nueve hormiguitas marchan en fila. Y Diez globos vuelan por el cielo. ¡Ya sé contar hasta diez!",
    previousStory: "Tengo Un dedo. Mis Dos ojos ven. Con Tres saltos llego. Cuatro gatitos duermen. Cinco dedos en la mano.",
  },

  // ─── World 5 — El Libro Mágico (Phase 5) ───────────────────────────

  41: {
    story5: "El niño Quiere aprender a leer y sabe que Puede lograrlo. Él Sabe que es inteligente porque Tiene muchos libros en su cuarto. Todos los días Hace algo nuevo y divertido. ¡Aprender es su superpoder!",
    previousStory: "Seis pájaros cantan. Siete estrellas brillan. Ocho crayones pintan. Nueve hormiguitas marchan. Diez globos vuelan.",
  },
  42: {
    story5: "Sofía Dice que hoy será un gran día. Ella Viene a la escuela con una sonrisa enorme. Cuando Sale al recreo juega con todos. Después Llega a casa y abraza a mamá. Siempre Busca nuevas aventuras. ¡Sofía es muy especial!",
    previousStory: "El niño Quiere aprender. Puede lograrlo. Sabe que es inteligente. Tiene libros. Hace cosas nuevas.",
  },
  43: {
    story5: "El perro es Muy juguetón y corre Más rápido que el gato. El gato come Menos que el perro pero se porta Bien todo el día. Nunca se porta Mal porque es un gatito bueno. ¡Los dos son los mejores amigos!",
    previousStory: "Sofía Dice que será un gran día. Viene a la escuela. Sale al recreo. Llega a casa. Busca aventuras.",
  },
  44: {
    story5: "Aquí en mi casa estoy seguro. Allí en el parque juego con mis amigos. También me gusta ir a la escuela porque nunca estoy Solo. Siempre estamos Junto a las personas que nos quieren. ¡La vida es una aventura hermosa!",
    previousStory: "El perro es Muy juguetón. Corre Más rápido. El gato come Menos. Se porta Bien. Nunca se porta Mal.",
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
