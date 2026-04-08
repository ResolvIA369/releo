import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { existsSync, mkdirSync, renameSync, rmSync } from "fs";
import { join } from "path";

const OUT_DIR = "public/audio/sofia";
const TMP_DIR = "public/audio/sofia/.tmp";
mkdirSync(OUT_DIR, { recursive: true });

const VOICE = "es-MX-DaliaNeural";

// ═══ All entries ═════════════════════════════════════════════

const PHRASES = [
  { file: "intro", text: "¡Hola, mi pequeño genio! Soy la Seño Sofía y hoy vamos a descubrir palabras mágicas juntos. Antes de empezar quiero que sepas algo muy importante: tú eres una persona increíble, eres muy inteligente y eres capaz de aprender todo lo que te propongas. Ahora, presta mucha atención. Te voy a ir mostrando unas palabras muy especiales para que las vayas conociendo y aprendiendo. Solo tienes que mirarlas y escucharme. ¿Estás listo? ¡Vamos!", rate: "-10%", pitch: "+5%" },
  { file: "round1-between1", text: "¡Excelente esfuerzo! Tu cerebro está brillando. Vamos a verlas una vez más, ¡concéntrate!", rate: "+5%", pitch: "+10%" },
  { file: "round1-between2", text: "¡Lo haces cada vez mejor! Eres un campeón. Vamos por la última tanda, ¡tú puedes!", rate: "+5%", pitch: "+10%" },
  { file: "round1-between3", text: "¡Guau! Ya casi las tienes todas grabadas en tu cabecita. Ahora prepárate, porque te toca a ti decirme qué dicen las palabras.", rate: "-10%", pitch: "+5%" },
  { file: "round2-intro", text: "¡Ahora te toca a ti! Voy a mostrarte las palabras y tú me dices qué dicen. ¿Listo?", rate: "-10%", pitch: "+5%" },
  { file: "round3-intro", text: "¡Ahora escucha esta historia muy bonita con las palabras que aprendiste!", rate: "-10%", pitch: "+5%" },
  { file: "review-intro", text: "¡Espera! No te vayas todavía. Vamos a ver si recuerdas a los amigos que conocimos ayer. ¡Vamos a saludarlos para ver cuánto has crecido!", rate: "-10%", pitch: "+5%" },
  { file: "farewell", text: "¡Increíble trabajo! Has aprendido 5 palabras nuevas y lo has hecho de maravilla. Recuerda que eres una persona única, especial y muy valiosa. Estoy muy orgullosa de ti. ¡Te mando un gran abrazo y nos vemos pronto! ¡Adiós!", rate: "-10%", pitch: "+5%" },
  { file: "repeat-conmigo", text: "Repite conmigo:", rate: "-10%", pitch: "+5%" },
  { file: "chau-chau", text: "¡Nos vemos en la próxima clase! ¡Chau chau!", rate: "+5%", pitch: "+10%" },
  { file: "flash-increible", text: "¡Lo estás haciendo increíble! ¡Tu voz suena hermosa!", rate: "+5%", pitch: "+10%" },
  { file: "flash-casi", text: "¡Casi terminamos! ¡Una más y listo!", rate: "+5%", pitch: "+10%" },
  { file: "flash-lograste", text: "¡Lo lograste! ¡Aprendiste 5 palabras nuevas!", rate: "+5%", pitch: "+10%" },
  { file: "flash-historia", text: "¡Qué linda historia! ¿Viste todas las palabras que aprendiste?", rate: "+5%", pitch: "+10%" },
  { file: "flash-recordaste", text: "¡Las recordaste todas! ¡Qué memoria tan buena!", rate: "+5%", pitch: "+10%" },
  ...["¡Hola! Hoy vamos a aprender palabras nuevas","¡Qué bueno verte! ¿Listos para aprender?","¡Llegaste! Tengo palabras divertidas para ti","¡Hola, amiguito! Vamos a leer juntos","¡Bienvenido! Hoy descubriremos palabras nuevas","¡Hola! La Seño Sofía tiene una clase especial","¡Qué alegría! Empecemos nuestra clase","¡Hola, estrellita! ¿Listos para leer?","¡Me da gusto verte! Vamos a aprender","¡Aquí estamos! Hoy será un gran día"].map((t,i)=>({file:`saludo-${String(i+1).padStart(2,"0")}`,text:t,rate:"+5%",pitch:"+10%"})),
  ...["¡Excelente clase!","¡Fue una gran sesión!","¡Aprendiste mucho hoy!","¡Qué bien lo hiciste!","¡La Seño Sofía está orgullosa!","¡Increíble trabajo!","¡Eres un campeón de la lectura!","¡Maravilloso! Nos vemos pronto","¡Genial! Cada día lees mejor","¡Fantástico! Sigue así"].map((t,i)=>({file:`despedida-${String(i+1).padStart(2,"0")}`,text:t,rate:"+5%",pitch:"+10%"})),
  ...["¡Eres un gran lector!","¡Cada día aprendes más!","¡Puedes lograr lo que te propongas!","¡Eres muy inteligente!","¡Aprender es tu superpoder!","¡Brillas como una estrella!","¡Tu esfuerzo vale mucho!","¡Eres increíble!","¡Sigue así, campeón!","¡Me encanta cómo aprendes!"].map((t,i)=>({file:`afirmacion-${String(i+1).padStart(2,"0")}`,text:t,rate:"+0%",pitch:"+8%"})),
  { file: "reglas-empareja", text: "Voy a mostrarte una palabra. ¡Toca la imagen que le corresponde antes de que se acabe el tiempo!", rate: "-10%", pitch: "+5%" },
  { file: "reglas-memoria", text: "Las cartas están escondidas. Voltea dos cartas: si la palabra y su imagen coinciden, ¡se quedan! Si no, se vuelven a esconder. ¡Recuerda dónde están!", rate: "-10%", pitch: "+5%" },
  { file: "reglas-lluvia", text: "¡Palabras caen del cielo! Yo te digo cuál atrapar. ¡Tócala antes de que llegue al suelo!", rate: "-10%", pitch: "+5%" },
  { file: "reglas-pesca", text: "¡Los peces nadan con palabras! Yo te digo cuál pescar. ¡Toca el pez correcto!", rate: "-10%", pitch: "+5%" },
  { file: "reglas-categorias", text: "¡Pon cada palabra en su categoría! Yo te digo la palabra y tú eliges dónde va.", rate: "-10%", pitch: "+5%" },
  { file: "reglas-frase", text: "¡Ordena las palabras para formar la oración!", rate: "-10%", pitch: "+5%" },
  { file: "reglas-tren", text: "¡Dos trenes pasan por las vías! Cada vagón tiene una palabra. Yo te digo cuál tocar. ¡Encuéntrala antes de que se escape!", rate: "-10%", pitch: "+5%" },
  { file: "reglas-cuentos", text: "Toca cada palabra para escucharla. Cuando las leas todas, Sofía te lee la oración completa.", rate: "-10%", pitch: "+5%" },
  { file: "reglas-bits", text: "Sofía te mostrará palabras una por una. Mira y escucha cada palabra con atención.", rate: "-10%", pitch: "+5%" },
  ...["¡Excelente!","¡Eso es!","¡Muy bien!","¡Bravo!","¡Genial!","¡Así se hace!","¡Perfecto!","¡Pareja encontrada!","¡Excelente memoria!","¡Buena memoria!"].map((t,i)=>({file:`celebra-${String(i+1).padStart(2,"0")}`,text:t,rate:"+5%",pitch:"+10%"})),
  ...["¡Intenta otra vez!","¡Se escapó!","¡Tú puedes!","¡Busca bien!","¡Confío en ti!","¡Tú sabes cuál es!","¡Piensa bien!","¡Ya casi!","¡Concéntrate bien!","¡No pasa nada! Sigue buscando","¡Casi! Fíjate bien","¡Fíjate dónde están!","¡Muy bien, sigue así!","¡No son iguales! Recuerda dónde están","¡Intenta recordar las posiciones!","¡Se acabó el tiempo!"].map((t,i)=>({file:`animo-${String(i+1).padStart(2,"0")}`,text:t,rate:"-5%",pitch:"+0%"})),
];

const ALL_WORDS = [...new Set("mamá,papá,bebé,abuela,abuelo,hermano,hermana,tío,tía,primo,rojo,azul,verde,amarillo,blanco,perro,gato,caballo,vaca,pájaro,manzana,banana,uva,pera,naranja,ventana,cocina,baño,piso,techo,mano,pie,ojo,nariz,boca,oreja,pelo,dedo,brazo,pierna,agua,leche,pan,arroz,huevo,casa,mesa,silla,cama,puerta,negro,rosa,morado,café,grande,pequeño,largo,corto,alto,bajo,gordo,flaco,redondo,cuadrado,arriba,abajo,dentro,fuera,cerca,lejos,rápido,lento,caliente,frío,feliz,triste,enojado,asustado,cansado,contento,tranquilo,sorprendido,valiente,amable,sol,luna,estrella,nube,lluvia,árbol,flor,río,mar,montaña,come,bebe,duerme,juega,corre,salta,lee,escribe,canta,baila,abre,cierra,sube,baja,toca,lava,limpia,pinta,dibuja,camisa,pantalón,zapato,gorra,falda,calcetín,vestido,chaqueta,bufanda,pijama,libro,lápiz,papel,tijeras,pegamento,mochila,maestra,amigo,clase,recreo,parque,tienda,escuela,hospital,iglesia,playa,campo,ciudad,calle,jardín,el,la,los,las,un,una,unos,unas,y,con,en,de,por,para,sobre,entre,hasta,desde,sin,hacia,yo,tú,él,ella,nosotros,mi,tu,su,este,ese,hoy,mañana,ayer,ahora,después,antes,siempre,nunca,pronto,tarde,uno,dos,tres,cuatro,cinco,seis,siete,ocho,nueve,diez,quiere,puede,sabe,tiene,hace,dice,viene,sale,llega,busca,muy,más,menos,bien,mal,aquí,allí,también,solo,junto".split(","))];

const WORD_ENTRIES = ALL_WORDS.map((w)=>({file:`palabra-${w}`,text:w,rate:"-20%",pitch:"+0%"}));
const ALL_ENTRIES = [...PHRASES, ...WORD_ENTRIES];

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
    throw new Error("audio.mp3 not created");
  } catch (err) {
    rmSync(tmpPath, { recursive: true, force: true });
    process.stdout.write(`[${index}/${total}] ✗ ${entry.file}.mp3 — ${err.message}\n`);
    return "failed";
  }
}

async function run() {
  const total = ALL_ENTRIES.length;
  console.log(`\n🎙️  Generating ${total} audio files with Edge TTS (${VOICE})\n`);

  const tts = new MsEdgeTTS();
  await tts.setMetadata(VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  let ok = 0, skipped = 0, failed = 0;
  const failures = [];

  for (let i = 0; i < total; i++) {
    const result = await generateOne(tts, ALL_ENTRIES[i], i + 1, total);
    if (result === "ok") ok++;
    else if (result === "skipped") skipped++;
    else { failed++; failures.push(ALL_ENTRIES[i].file); }
  }

  // Cleanup tmp dir
  rmSync(TMP_DIR, { recursive: true, force: true });

  console.log(`\n═══ Done ═══`);
  console.log(`✓ Generated: ${ok}`);
  console.log(`⏭ Skipped:   ${skipped}`);
  console.log(`✗ Failed:    ${failed}`);
  if (failures.length > 0) {
    console.log(`\nFailed files:`);
    failures.forEach((f) => console.log(`  - ${f}`));
  }
  console.log();
}

run().catch(console.error);
