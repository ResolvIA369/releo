#!/usr/bin/env python3
"""Arma qa/escucha.html: muestra de escucha de la biblioteca (semilla fija, reproducible).

Toma: todas las palabras con respelling, 3 palabras por tema (sin repetir esas),
10 sílabas, 10 intervenciones de Sofía de categorías distintas y 2 cuentos completos.
La página no tiene dependencias externas; los audios se cargan por ruta relativa
(../sofia/...), así que se abre directo desde el disco.
"""
import glob
import html
import json
import os
import random

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
random.seed(20261003)

items = {}
for cola in sorted(glob.glob(os.path.join(RAIZ, "cola", "*.jsonl"))):
    for linea in open(cola, encoding="utf-8"):
        d = json.loads(linea)
        items[d["id"]] = d

VOZ = {"jessica": "Jessica (Sofía)", "candb": "candB (palabra suelta)"}
SOFIA = {"saludos", "inicio", "consignas", "refuerzo", "errores", "pistas", "transiciones",
         "finalizacion", "preguntas_generales", "emociones_sofia", "leo", "autonomia",
         "cuento_formulas", "guia_lectura", "rutina", "afecto", "tecnico"}

muestra = []


def agregar(d, grupo):
    muestra.append({"id": d["id"], "grupo": grupo, "texto": d["texto"],
                    "respelling": d.get("texto_tts"), "voz": VOZ[d.get("voz", "jessica")],
                    "categoria": d["categoria"] + (f" / {d['extra']['dominio']}" if d.get("extra", {}).get("dominio") else ""),
                    "archivo": "../" + d["archivo"]})


palabras = [d for d in items.values() if d["categoria"] == "palabras"]
for d in sorted((p for p in palabras if p.get("texto_tts")), key=lambda x: x["texto"]):
    agregar(d, "Palabras con grafía alterada")
por_tema = {}
for d in palabras:
    if not d.get("texto_tts"):
        por_tema.setdefault(d["extra"]["dominio"], []).append(d)
for tema in sorted(por_tema):
    for d in random.sample(sorted(por_tema[tema], key=lambda x: x["id"]), 3):
        agregar(d, "Palabras: 3 por tema")
silabas = sorted((d for d in items.values() if d["categoria"] == "silabas-directas"), key=lambda x: x["id"])
for d in random.sample(silabas, 10):
    agregar(d, "Sílabas (experimentales)")
cats = sorted(SOFIA)
for cat in random.sample(cats, 10):
    pool = sorted((d for d in items.values() if d["categoria"] == cat), key=lambda x: x["id"])
    agregar(random.choice(pool), "Intervenciones de Sofía")
cuentos = sorted({os.path.dirname(d["archivo"]): d for d in items.values() if d["categoria"] == "cuentos"}.items())
for carpeta, d in random.sample(cuentos, 2):
    muestra.append({"id": d["extra"]["cuento"] + "-completo", "grupo": "Narraciones completas de cuento",
                    "texto": d["extra"]["titulo"], "respelling": None, "voz": VOZ["jessica"],
                    "categoria": "cuentos / completo", "archivo": f"../{carpeta}/completo.mp3"})

for m in muestra:
    if not os.path.exists(os.path.join(AQUI, m["archivo"])):
        raise SystemExit(f"falta el audio {m['archivo']}")

filas = []
grupo_actual = None
for i, m in enumerate(muestra):
    if m["grupo"] != grupo_actual:
        grupo_actual = m["grupo"]
        n = sum(1 for x in muestra if x["grupo"] == grupo_actual)
        filas.append(f'<tr class="grupo"><th colspan="3">{html.escape(grupo_actual)} <span>({n})</span></th></tr>')
    resp = f'<div class="resp">al TTS se le mandó «{html.escape(m["respelling"])}»</div>' if m["respelling"] else ""
    meta = f'{html.escape(m["voz"])} · {html.escape(m["categoria"])} · {html.escape(m["id"])}' 
    filas.append(f'''<tr data-i="{i}">
  <td class="reproductor"><audio controls preload="none" src="{html.escape(m["archivo"])}"></audio></td>
  <td><div class="texto">{html.escape(m["texto"])}</div>{resp}<div class="meta">{meta}</div></td>
  <td class="eval"><button type="button" class="ok">OK</button><button type="button" class="mal">MAL</button>
      <input type="text" class="nota" placeholder="nota" aria-label="nota"></td>
</tr>''')

datos = json.dumps(muestra, ensure_ascii=False)
pagina = f'''<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Escucha QA Sofía</title>
<style>
:root {{ --bg:#fbfaf7; --fg:#1d1d1b; --mut:#6b6a66; --line:#e3e0d8; --ok:#1f7a3d; --mal:#b3261e; --hd:#f0ede5; --acc:#8a4b00; --okbg:#e7f3ea; --malbg:#fbe9e7; }}
@media (prefers-color-scheme: dark) {{ :root {{ --bg:#161614; --fg:#ecebe6; --mut:#a3a19a; --line:#34332f; --ok:#5fc27e; --mal:#f2867c; --hd:#22211e; --acc:#f0b464; --okbg:#1c2b20; --malbg:#33201e; }} }}
body {{ margin:0; padding:16px; background:var(--bg); color:var(--fg); font:15px/1.4 system-ui, sans-serif; }}
header {{ position:sticky; top:0; background:var(--bg); padding:8px 0 12px; border-bottom:1px solid var(--line); display:flex; gap:16px; align-items:center; flex-wrap:wrap; z-index:2; }}
h1 {{ font-size:18px; margin:0; }}
#cuenta {{ color:var(--mut); }}
#siguiente {{ margin-left:auto; padding:8px 14px; }} #exportar {{ padding:8px 14px; font-weight:700; }}
table {{ border-collapse:collapse; width:100%; }}
td, th {{ border-bottom:1px solid var(--line); padding:8px 6px; text-align:left; vertical-align:middle; }}
tr.grupo th {{ background:var(--hd); font-size:14px; }} tr.grupo span {{ color:var(--mut); font-weight:400; }}
.texto {{ font-size:18px; font-weight:650; }} .resp {{ font-size:14px; color:var(--acc); font-weight:600; margin-top:2px; }} .meta {{ color:var(--mut); font-size:12px; margin-top:4px; }}
td.reproductor {{ width:260px; }} audio {{ width:250px; min-width:250px; }}
button {{ font:inherit; border:1px solid var(--line); background:transparent; color:var(--fg); border-radius:6px; padding:4px 10px; cursor:pointer; }}
.eval {{ white-space:nowrap; width:1%; }} .eval button {{ min-width:72px; min-height:44px; font-weight:700; }} .eval .ok {{ color:var(--ok); border-color:var(--ok); margin-right:12px; }} .eval .mal {{ color:var(--mal); border-color:var(--mal); margin-right:12px; }} .nota {{ font:inherit; width:220px; min-height:40px; padding:4px; background:transparent; color:var(--fg); border:1px solid var(--line); border-radius:6px; }}
tr.v-ok {{ background:var(--okbg); }} tr.v-mal {{ background:var(--malbg); }}
tr.v-ok .ok {{ background:var(--ok); color:var(--bg); }}
tr.v-mal .mal {{ background:var(--mal); color:var(--bg); }}
tr.actual {{ outline:3px solid var(--acc); outline-offset:-3px; }}
@media (max-width:700px) {{ table, tbody, tr, td {{ display:block; }} tr.grupo th {{ display:block; }} td {{ border:0; padding:4px 8px; }} tr {{ border-bottom:1px solid var(--line); padding:8px 0; }} audio {{ width:100%; }} .eval {{ width:auto; display:flex; flex-wrap:wrap; gap:8px; }} .eval button {{ flex:1; margin:0 !important; min-height:52px; }} .nota {{ width:100%; }} td.reproductor {{ width:auto; }} audio {{ min-width:0; }} header {{ gap:6px 10px; }} #siguiente {{ margin-left:0; }} #siguiente, #exportar {{ padding:6px 10px; font-size:14px; }} h1 {{ font-size:15px; width:100%; }} #cuenta {{ width:100%; font-size:13px; }} }}
</style></head>
<body>
<header><h1>Escucha QA: biblioteca de voz de Sofía</h1><span id="cuenta"></span><button type="button" id="siguiente">Próximo pendiente ↓</button><button type="button" id="exportar">Exportar resultados</button></header>
<p style="color:var(--mut);margin:10px 0">Escuchá y marcá OK o MAL. En grande, lo que ve el chico; en naranja, lo que se le mandó al TTS si era distinto.</p>
<table><tbody>
{chr(10).join(filas)}
</tbody></table>
<script>
const MUESTRA = {datos};
const CLAVE = "qa-escucha-sofia-v1";
const estado = {{}};
function guardar() {{ try {{ localStorage.setItem(CLAVE, JSON.stringify(estado)); }} catch (e) {{}} }}
function cargar() {{ try {{ return JSON.parse(localStorage.getItem(CLAVE) || "{{}}") || {{}}; }} catch (e) {{ return {{}}; }} }}
function pintar(tr, i) {{
  const v = (estado[i] || {{}}).veredicto;
  tr.classList.toggle("v-ok", v === "OK"); tr.classList.toggle("v-mal", v === "MAL");
}}
function irAPendiente() {{
  const filas = [...document.querySelectorAll("tr[data-i]")];
  const tr = filas.find(f => !(estado[f.dataset.i] || {{}}).veredicto);
  filas.forEach(f => f.classList.remove("actual"));
  if (!tr) {{ document.getElementById("cuenta").textContent += " · ¡no quedan pendientes!"; return; }}
  tr.classList.add("actual");
  tr.scrollIntoView({{ block: "center" }});
}}
document.getElementById("siguiente").addEventListener("click", irAPendiente);
function contar() {{
  const vals = Object.values(estado).map(x => x.veredicto).filter(Boolean);
  document.getElementById("cuenta").textContent =
    vals.length + " de " + MUESTRA.length + " evaluados · " + vals.filter(v => v === "MAL").length + " MAL";
}}
Object.assign(estado, cargar());
document.querySelectorAll("tr[data-i]").forEach(tr => {{
  const i = tr.dataset.i;
  const nota = tr.querySelector(".nota");
  if (estado[i] && estado[i].nota) nota.value = estado[i].nota;
  pintar(tr, i);
  tr.querySelector(".ok").addEventListener("click", () => {{ estado[i] = {{...estado[i], veredicto: "OK"}}; pintar(tr, i); contar(); guardar(); }});
  tr.querySelector(".mal").addEventListener("click", () => {{ estado[i] = {{...estado[i], veredicto: "MAL"}}; pintar(tr, i); contar(); guardar(); }});
  nota.addEventListener("input", () => {{ estado[i] = {{...estado[i], nota: nota.value}}; guardar(); }});
}});
contar();
document.getElementById("exportar").addEventListener("click", () => {{
  const resultados = MUESTRA.map((m, i) => ({{ id: m.id, grupo: m.grupo, texto: m.texto, respelling: m.respelling,
    voz: m.voz, categoria: m.categoria, archivo: m.archivo,
    veredicto: (estado[i] || {{}}).veredicto || null, nota: (estado[i] || {{}}).nota || "" }}));
  const blob = new Blob([JSON.stringify({{ exportado: new Date().toISOString(), total: MUESTRA.length, resultados }}, null, 2)],
    {{ type: "application/json" }});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = "qa-resultados.json";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}});
</script>
</body></html>
'''
open(os.path.join(AQUI, "escucha.html"), "w", encoding="utf-8").write(pagina)
grupos = {}
for m in muestra:
    grupos[m["grupo"]] = grupos.get(m["grupo"], 0) + 1
print(len(muestra), "audios:", grupos)
