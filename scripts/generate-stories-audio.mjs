import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { existsSync, mkdirSync, renameSync, rmSync } from "fs";
import { join } from "path";

const OUT_DIR = "public/audio/sofia";
const TMP_DIR = "public/audio/sofia/.tmp";
mkdirSync(OUT_DIR, { recursive: true });

const VOICE = "es-MX-DaliaNeural";

// ═══ Stories (44 sessions) ═══════════════════════════════════

const STORIES = {
  1: "Hoy Mamá y Papá preparan una torta deliciosa. El Bebé juega con sus juguetes en el suelo, mientras la Abuela y el Abuelo nos cuentan historias muy divertidas. ¡Qué feliz es la familia!",
  2: "Mi Hermano y mi Hermana juegan en el parque con mi Primo. De repente, llegan mi Tío y mi Tía con globos de colores. ¡Qué divertido es jugar todos juntos en familia!",
  3: "En el jardín hay una flor de color Rojo y un cielo muy Azul. El pasto es Verde y el sol Amarillo brilla sobre una nube de color Blanco. ¡Qué lindo es ver colores!",
  4: "En el campo, un Perro corre tras un Gato. El Caballo salta la cerca mientras la Vaca come pasto y un Pájaro canta desde lo alto de un árbol. ¡Qué lindos son los animales!",
  5: "En la cocina hay una Manzana roja y una Banana dulce. Preparamos un jugo de Uva y cortamos una Pera jugosa junto a una Naranja llena de sol. ¡Qué rico es comer frutas!",
  6: "La casa tiene una Ventana grande por donde entra el sol. En la Cocina mamá prepara comida rica. El Baño tiene un espejo divertido. El Piso es perfecto para jugar y el Techo nos protege de la lluvia. ¡Qué linda es la casa!",
  7: "Con el Ojo se puede ver todo el mundo. Con la Nariz se huelen las flores del jardín. Con la Boca se pueden cantar canciones bonitas. Con la Mano se puede dibujar y con el Pie se puede correr muy rápido. ¡El cuerpo es increíble!",
  8: "Con la Oreja se escucha la música y los cuentos de la abuela. El Pelo brilla como el sol cuando mamá lo peina. Con cada Dedo se puede contar hasta diez. Los Brazos son perfectos para abrazar y las Piernas para saltar muy alto. ¡Somos fuertes y especiales!",
  9: "Hay mucha hambre. Mamá sirve un vaso de Agua fresca y un vaso de Leche tibia. En la mesa hay Pan calentito, Arroz con pollo y un Huevo revuelto. ¡Qué rica es la comida que prepara la familia!",
  10: "La Casa es el lugar más lindo del mundo. Hay una Mesa grande donde come toda la familia. Cada uno tiene su Silla favorita. La Cama es súper cómoda y antes de dormir mamá cierra la Puerta y da un beso de buenas noches. ¡Todos aman su casa!",
  11: "En la caja de crayones hay uno Rojo como una manzana, uno Azul como el cielo, uno Verde como el pasto, uno Amarillo como el sol y uno Blanco como las nubes. ¡Con todos los colores se puede pintar el mundo entero!",
  12: "La mariposa tiene alas de color Negro y Rosa. La flor es color Naranja como el atardecer. El caracol es Morado y camina sobre la tierra Café del jardín. ¡La naturaleza tiene colores hermosos!",
  13: "En el zoológico hay un elefante muy Grande y un ratón muy Pequeño. La jirafa tiene un cuello Largo y el pingüino tiene patas Cortas. Hasta hay un Alto sombrero de copa en la tienda de regalos. ¡Qué divertido es comparar!",
  14: "El payaso es Bajo y usa zapatos muy grandes. El bailarín es Gordo y baila con mucha gracia. La gimnasta es Flaca y muy ágil. La pelota es Redonda y la caja es Cuadrada. ¡Cada forma es especial!",
  15: "El gatito sube Arriba del árbol y luego baja Abajo con cuidado. Se mete Dentro de una caja y después sale Fuera a explorar. Siempre se queda Cerca de mamá gata. ¡Qué aventurero es el gatito!",
  16: "El conejo corre muy Rápido por el campo. La tortuga camina Lento pero nunca se detiene. La sopa está Caliente y el helado está Frío. A veces Cerca y a veces Lejos, pero siempre llegan a donde quieren. ¡Lo importante es seguir adelante!",
  17: "Hoy el sol brilla y me siento muy Feliz. Ayer estuve un poco Triste porque perdí mi juguete. A veces me pongo Enojado, y otras veces Asustado cuando hay truenos. Pero ahora estoy Cansado de tanto jugar. ¡Mañana será otro gran día!",
  18: "Mi amigo siempre está Contento y es muy Tranquilo. A veces nos quedamos Sorprendidos cuando vemos un arcoíris. Él es Valiente cuando hay que cruzar el puente alto y siempre es Amable con todos. ¡Tener un buen amigo es lo mejor!",
  19: "El Sol sale por la mañana y calienta todo. La Luna aparece de noche con su luz plateada. Una Estrella brilla en el cielo junto a una Nube blanca. Cuando la Lluvia cae, salen charcos para saltar. ¡El cielo siempre tiene algo lindo!",
  20: "En el bosque hay un Árbol enorme con hojas verdes. A su lado crece una Flor de muchos colores. Un Río corre entre las piedras hasta llegar al Mar azul. A lo lejos se ve una Montaña con nieve en la punta. ¡La naturaleza es mágica!",
  21: "El niño Come su desayuno con mucha alegría. Luego Bebe un vaso de jugo fresco. Después de almorzar, Duerme una siesta corta. Al despertar, Juega con sus amigos en el patio y Corre por todo el jardín. ¡Qué día tan divertido!",
  22: "La niña Salta la cuerda en el recreo. Luego Lee un cuento muy bonito. Después Escribe su nombre con letras grandes. Cuando termina, Canta su canción favorita y Baila con mucha gracia. ¡Le encanta la escuela!",
  23: "La mamá Abre la puerta del armario. Luego Cierra la ventana porque hace frío. El gato Sube a la mesa de un salto. Papá Baja las escaleras con cuidado. La hermana Toca el piano con alegría. ¡Cada uno hace algo diferente!",
  24: "Mamá Lava los platos después de comer. Abuela Cocina una sopa deliciosa. Hermana Limpia su cuarto con mucho orden. El niño Pinta un cuadro con muchos colores y luego Dibuja a toda la familia. ¡Todos ayudan en casa!",
  25: "La Camisa azul y el Pantalón gris están listos para la escuela. Los Zapatos brillan porque papá los limpió. La Gorra roja protege del sol. Hermana se pone su Falda verde favorita. ¡Todos se ven muy lindos!",
  26: "El Calcetín tiene rayas de colores. El Vestido de mamá es muy elegante. La Chaqueta de papá es grande y calientita. La Bufanda de la abuela huele a flores. El Pijama del bebé tiene estrellas. ¡Cada prenda es especial!",
  27: "En la mochila hay un Libro de cuentos y un Lápiz afilado. También hay Papel para dibujar, unas Tijeras con punta redonda y Pegamento para manualidades. ¡Todo listo para un día genial en la escuela!",
  28: "La Mochila está llena de sorpresas. La Maestra saluda con una sonrisa grande. Mi mejor Amigo me espera en la entrada. En la Clase aprendemos cosas nuevas cada día. Y en el Recreo jugamos todos juntos. ¡La escuela es genial!",
  29: "El domingo vamos al Parque a jugar. Después pasamos por la Tienda a comprar helado. Cerca está la Escuela donde estudia mi hermano. Al lado hay un Hospital donde trabaja mi tía. Y la Iglesia donde se casan los novios. ¡El barrio tiene de todo!",
  30: "En vacaciones vamos a la Playa a nadar y hacer castillos. El Campo tiene vacas y caballos. La Ciudad tiene edificios altos. En la Calle hay carros y bicicletas. Y en el Jardín de la abuela hay flores de todos los colores. ¡Cada lugar es una aventura!",
  31: "El perro corre por el parque. La gata duerme en la silla. Los pájaros cantan en el árbol. Las flores son de muchos colores. Un niño juega feliz. ¡El, La, Los, Las y Un hacen que todo suene bonito!",
  32: "Una estrella brilla en el cielo. Unos gatitos juegan juntos. Unas mariposas vuelan alto. El sol Y la luna se turnan para brillar. Mamá prepara la cena Con mucho amor. ¡Las palabras conectan ideas!",
  33: "El gato duerme En la cama. El regalo es De mamá. Caminamos Por el parque. Las flores son Para la abuela. Jugamos Con los amigos. ¡Las preposiciones nos dicen dónde y cómo!",
  34: "Sin zapatos corremos por el pasto. Entre los árboles jugamos a las escondidas. El gato está Sobre la mesa mirando todo. El perro está bajo la silla descansando. Caminamos Hacia el parque todos juntos. ¡Cada palabra nos guía!",
  35: "Yo tengo un perro que se llama Luna. Tú tienes un gato muy juguetón. Él dibuja muy bonito en la escuela. Ella canta canciones con su mamá. Nosotros jugamos juntos en el recreo. ¡Todos somos amigos!",
  36: "Mi mochila es azul con estrellas. Tu casa tiene un jardín muy lindo. Su perro es grande y muy cariñoso. Este libro tiene muchos dibujos. Ese árbol es el más alto del parque. ¡Cada cosa tiene su dueño!",
  37: "Hoy es un día muy bonito y soleado. Mañana vamos a ir al parque con los abuelos. Ayer llovió mucho y saltamos en los charcos. Ahora estamos jugando con los primos. Después vamos a comer helado de fresa. ¡Cada momento es especial!",
  38: "Siempre le doy un abrazo a mamá antes de dormir. Nunca olvido decir gracias cuando me ayudan. Pronto llegará el día de mi cumpleaños. Antes de ir a la escuela desayuno bien. Llego Tarde a veces pero siempre con una sonrisa. ¡El tiempo pasa volando!",
  39: "Tengo Un dedo pulgar que saluda. Mis Dos ojos ven el mundo entero. Con Tres saltos llego a la puerta. Cuatro gatitos duermen en la cesta. Y con Cinco dedos puedo contar una mano. ¡Los números están en todas partes!",
  40: "Seis pájaros cantan en la ventana. Siete estrellas brillan de noche. Ocho crayones pintan un arcoíris. Nueve hormiguitas marchan en fila. Y Diez globos vuelan por el cielo. ¡Ya sé contar hasta diez!",
  41: "El niño Quiere aprender a leer y sabe que Puede lograrlo. Él Sabe que es inteligente porque Tiene muchos libros en su cuarto. Todos los días Hace algo nuevo y divertido. ¡Aprender es su superpoder!",
  42: "Sofía Dice que hoy será un gran día. Ella Viene a la escuela con una sonrisa enorme. Cuando Sale al recreo juega con todos. Después Llega a casa y abraza a mamá. Siempre Busca nuevas aventuras. ¡Sofía es muy especial!",
  43: "El perro es Muy juguetón y corre Más rápido que el gato. El gato come Menos que el perro pero se porta Bien todo el día. Nunca se porta Mal porque es un gatito bueno. ¡Los dos son los mejores amigos!",
  44: "Aquí en mi casa estoy seguro. Allí en el parque juego con mis amigos. También me gusta ir a la escuela porque nunca estoy Solo. Siempre estamos Junto a las personas que nos quieren. ¡La vida es una aventura hermosa!",
};

// Phrases with {name} — generate generic versions
const NAME_PHRASES = [
  { file: "frase-increible", text: "¡Lo estás haciendo increíble! ¡Tu voz suena hermosa!" },
  { file: "frase-casi", text: "¡Casi terminamos! ¡Una más y listo!" },
  { file: "frase-lograste", text: "¡Lo lograste! ¡Aprendiste 5 palabras nuevas!" },
  { file: "frase-historia-linda", text: "¡Qué linda historia! ¿Viste todas las palabras que aprendiste?" },
  { file: "frase-recordaste", text: "¡Las recordaste todas! ¡Qué memoria tan buena!" },
  { file: "frase-nos-vemos", text: "¡Nos vemos en la próxima clase! ¡Chau chau!" },
  { file: "frase-repite", text: "Repite conmigo:" },
];

// Build entries
const entries = [];

// Stories
for (const [id, text] of Object.entries(STORIES)) {
  entries.push({ file: `historia-${id}`, text, rate: "-10%", pitch: "+5%" });
}

// Name phrases
for (const p of NAME_PHRASES) {
  entries.push({ file: p.file, text: p.text, rate: "+5%", pitch: "+10%" });
}

// ═══ Generate ════════════════════════════════════════════════

async function generateOne(tts, entry, index, total) {
  const finalPath = join(OUT_DIR, `${entry.file}.mp3`);
  if (existsSync(finalPath)) {
    process.stdout.write(`[${index}/${total}] ⏭ ${entry.file}.mp3\n`);
    return "skipped";
  }
  const tmpPath = join(TMP_DIR, entry.file);
  mkdirSync(tmpPath, { recursive: true });
  try {
    await tts.toFile(tmpPath, entry.text, { rate: entry.rate, pitch: entry.pitch });
    const generated = join(tmpPath, "audio.mp3");
    if (existsSync(generated)) {
      renameSync(generated, finalPath);
      rmSync(tmpPath, { recursive: true, force: true });
      process.stdout.write(`[${index}/${total}] ✓ ${entry.file}.mp3\n`);
      return "ok";
    }
    throw new Error("not created");
  } catch (err) {
    rmSync(tmpPath, { recursive: true, force: true });
    process.stdout.write(`[${index}/${total}] ✗ ${entry.file}.mp3 — ${err.message}\n`);
    return "failed";
  }
}

async function run() {
  const total = entries.length;
  console.log(`\n🎙️  Generating ${total} story + phrase audio files\n`);
  const tts = new MsEdgeTTS();
  await tts.setMetadata(VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  let ok = 0, skipped = 0, failed = 0;
  for (let i = 0; i < total; i++) {
    const r = await generateOne(tts, entries[i], i + 1, total);
    if (r === "ok") ok++;
    else if (r === "skipped") skipped++;
    else failed++;
  }
  rmSync(TMP_DIR, { recursive: true, force: true });
  console.log(`\n═══ Done ═══`);
  console.log(`✓ Generated: ${ok}  ⏭ Skipped: ${skipped}  ✗ Failed: ${failed}\n`);
}

run().catch(console.error);
