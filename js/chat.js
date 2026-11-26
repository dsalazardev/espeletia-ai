// Motor del chat "Pregúntale a Fray": búsqueda semántica sin internet sobre fichas oficiales.
// No genera texto: elige la ficha oficial más parecida a la pregunta, o dice "no lo sé".
// Modelo: multilingual-e5-small (MIT), cuantizado int8 y podado a vocabulario latino (~66 MB).
// La lógica es copia fiel de tools/indice_chat.py (donde se calibró). Si cambias una, cambia la otra.

import { cargarModelo, embedTexto, anotar } from './motor.js';

let base = null;      // chat.json
let idx = null;       // índice: items, vectores normalizados, idf, docs
let cargando = null;
let soloLexico = false;

const RAIZ = (u) => new URL(u, import.meta.url).href;

function decodificar(b64) {
  const bin = atob(b64); const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// Escalera de degradación (spec escalera-degradacion-ui): modelo → solo palabras clave → menú de temas.
// Quien quiera saber cuándo cambia el modo (para decírselo al visitante) se suscribe aquí.
const oyentes = new Set();
export const alCambiarModo = (fn) => oyentes.add(fn);
function pasarALexico(motivo) {
  if (soloLexico) return;
  soloLexico = true;
  anotar('Chat (modelo de lenguaje)', motivo);
  oyentes.forEach((fn) => fn('lexico'));
}

export function cargar(onEstado = () => {}) {
  if (cargando) return cargando;
  cargando = (async () => {
    onEstado('fichas');
    base = await fetch(RAIZ('../chat.json')).then((r) => { if (!r.ok) throw new Error(`chat.json (${r.status})`); return r.json(); });
    let i;
    try { i = await fetch(RAIZ('../models/chat_indice.json')).then((r) => { if (!r.ok) throw new Error(`índice (${r.status})`); return r.json(); }); }
    catch (e) {
      // Sin índice no hay búsqueda: queda el menú de temas con las fichas (último escalón)
      anotar('Chat (índice)', e);
      oyentes.forEach((fn) => fn('menu'));
      onEstado('listo');
      return;
    }
    const dim = i.dim, n = i.items.length;
    const q8 = new Int8Array(decodificar(i.vectores).buffer);
    const esc = new Float32Array(decodificar(i.escalas).buffer);
    const vec = new Float32Array(n * dim);
    for (let k = 0; k < n; k++) {
      let s = 0;
      for (let d = 0; d < dim; d++) { const v = q8[k * dim + d] * esc[k]; vec[k * dim + d] = v; s += v * v; }
      s = Math.sqrt(s) || 1;
      for (let d = 0; d < dim; d++) vec[k * dim + d] /= s;
    }
    idx = { dim, n, items: i.items, vec, idf: i.idf, docs: i.docs.map((d) => new Set(d)), stop: new Set(i.stop), P: i.params };
    onEstado('modelo');
    try {
      await cargarModelo('texto'); // el tokenizador y el modelo viven en el worker
    } catch (e) {
      // Sin memoria suficiente, sin WASM o worker colgado: el chat sigue funcionando solo con palabras clave.
      pasarALexico(e);
    }
    onEstado('listo');
  })();
  cargando.catch(() => { cargando = null; });
  return cargando;
}

export const listo = () => !!idx;
// Hay fichas pero no búsqueda: solo el menú de temas
export const soloMenu = () => !!base && !idx;
// Vuelve a intentar cargar el modelo de lenguaje (p. ej. desde Ajustes, si falló por red)
export async function reintentar() {
  if (cargando) await cargando.catch(() => {});
  if (idx && !soloLexico) return;
  cargando = null; soloLexico = false;
  return cargar();
}
export const modoLexico = () => soloLexico;
export const fichas = () => base?.fichas || [];
// Estado del contenido para la insignia: por ficha si R1 lo marcó (spec paquete-validado); si no, el del archivo
// (hoy todo chat.json es borrador). Las respuestas de la app (fuente «app») no llevan insignia.
export function estadoDe(f) {
  if (!f || f.fuente === 'app' || f.dinamica) return null;
  return f.estado || (base?.estado ? 'borrador' : null);
}
export const empatia = (lang) => base?.empatia?.[lang] || base?.empatia?.es || [];
export const notaEstado = (lang) => base?.estado?.[lang] || base?.estado?.es || '';
export const fuentes = () => base?.fuentes || {};

// ---------- Embedding de la pregunta ----------
export async function embed(texto) {
  return embedTexto(texto); // «query: » + tokenizar + modelo + promedio + normalizar, en el worker
}

// ---------- Léxico (igual que en Python) ----------
function normalizar(s) {
  return s.toLowerCase().normalize('NFD').replace(/\p{Mn}/gu, '').match(/[a-z0-9]+/g) || [];
}
const SUF = ['aciones', 'acion', 'mente', 'ando', 'iendo', 'es', 's'];
function raiz(w) { for (const s of SUF) if (w.length > s.length + 3 && w.endsWith(s)) return w.slice(0, -s.length); return w; }
function lexTokens(s) { return normalizar(s).filter((w) => !idx.stop.has(w) && w.length > 2).map(raiz); }

// ¿La pregunta viene en inglés? (para responder en ese idioma aunque la app esté en español)
const EN = new Set('the is are do does can what where when how which who there this that with you i my it to of in on for at'.split(' '));
const ES = new Set('el la los las es son puedo puede que donde cuando como cual quien hay esto eso con usted yo mi de en para por un una se'.split(' '));
export function idiomaDe(texto) {
  const w = texto.toLowerCase().match(/[a-záéíóúñü]+/g) || [];
  let en = 0, es = 0;
  for (const x of w) { if (EN.has(x)) en++; if (ES.has(x)) es++; }
  if (/[ñáéíóú¿¡]/i.test(texto)) es += 2;
  return en > es ? 'en' : (es > en ? 'es' : null);
}

const COMER = /\b(comestible|se come|se puede comer|comer(me|se|lo|la)?|venenos[oa]|t[oó]xic[oa]|probar|edible|poison|toxic|eat)\b/i;
const URGENTE = /\b(auxilio|socorro|emergencia|accidente|herid[oa]|desmay|me perd|perdid[oa]|no respira|ayuda urgente|help|emergency|injur|faint|unconscious|lost)\b/i;

// ---------- Búsqueda ----------
// Puntúa todas las fichas para un texto. Devuelve la mejor, si alcanza el umbral, y los vectores de puntaje.
async function puntuar(texto) {
  const F = base.fichas, P = idx.P, nF = F.length;
  const sem = new Float64Array(nF).fill(-1);
  let neg = -1;
  let q = null;
  if (!soloLexico) {
    // Si el modelo se cuelga o falla (ya se reintentó una vez en motor.js), se sigue solo con palabras clave
    try { q = await embed(texto); } catch (e) { pasarALexico(e); }
  }
  if (!soloLexico && q) {
    const { vec, dim, items } = idx;
    for (let k = 0; k < items.length; k++) {
      let s = 0; const o = k * dim;
      for (let d = 0; d < dim; d++) s += q[d] * vec[o + d];
      const [fi, t] = items[k];
      if (t === 'n') { if (s > neg) neg = s; continue; }
      const s2 = t === 'q' ? s : s - P.da;
      if (s2 > sem[fi]) sem[fi] = s2;
    }
  }
  const qt = [...new Set(lexTokens(texto))];
  const lex = new Float64Array(nF);
  if (qt.length) {
    const def = Math.log(1 + nF);
    const tot = qt.reduce((a, w) => a + (idx.idf[w] ?? def), 0);
    for (let i = 0; i < nF; i++) { let s = 0; for (const w of qt) if (idx.docs[i].has(w)) s += idx.idf[w] ?? 0; lex[i] = s / tot; }
  }
  const score = new Float64Array(nF);
  for (let i = 0; i < nF; i++) score[i] = soloLexico ? lex[i] : sem[i] + P.w * lex[i];
  const orden = [...score.keys()].sort((a, b) => score[b] - score[a]);
  const b = orden[0];
  const responde = soloLexico ? lex[b] >= 0.5 : (sem[b] >= P.T && score[b] - neg >= P.M);
  return { b, responde, abst: responde && !!F[b].abstencion, score, sem, lex, neg, orden };
}

// Tema activo: lo que la Lente reconoció o el cromo desde el que se abrió el chat.
// La estrategia se eligió midiendo (herramientas/tema_chat.py, bancos pruebas/preguntas_tema*.json):
//  - si la pregunta sola cae en «no sé» de servicios, se respeta;
//  - si todas sus palabras existen en las fichas («¿cuánto vive?», «¿lo puedo tocar?»), se busca
//    «pregunta (tema)» y se usa salvo que la pregunta sola fuera claramente mejor (DELTA);
//  - si trae palabras desconocidas («¿de qué color es?», «¿raíz cuadrada?») no se puede saber si es
//    seguimiento o algo de fuera: no se afirma; se ofrece el tema como «¿te refieres a…?» o «relacionado».
const DELTA_TEMA = -0.04;

// Devuelve { tipo: 'respuesta'|'duda'|'nose', ficha, alternativas[], urgente, puntajes, porTema, sugiereTema }
export async function preguntar(texto, { tema = null } = {}) {
  await cargar();
  if (!idx) {
    // Sin búsqueda, las reglas de seguridad siguen mandando (AGENTS.md): emergencia y comer van directo
    const porId = (id) => base.fichas.find((f) => f.id === id);
    if (URGENTE.test(texto) && porId('emergencia')) return { tipo: 'respuesta', ficha: porId('emergencia'), alternativas: [], urgente: true, puntajes: {} };
    if (COMER.test(texto) && porId('comer_plantas')) return { tipo: 'respuesta', ficha: porId('comer_plantas'), alternativas: [], urgente: false, puntajes: {} };
    return { tipo: 'menu', ficha: null, alternativas: [], urgente: false, puntajes: {} };
  }
  const F = base.fichas;
  const r0 = await puntuar(texto);
  let el = r0, porTema = false, sugiereTema = null;
  const tf = tema ? F.findIndex((f) => f.id === tema.ficha) : -1;
  if (tema && tf >= 0 && !soloLexico && !r0.abst) {
    const nombre = tema[idiomaDe(texto) || 'es'] || tema.es;
    const r1 = await puntuar(`${texto} (${nombre})`);
    const r1ok = r1.responde && !r1.abst;
    const conocidas = lexTokens(texto).every((w) => w in idx.idf);
    if (conocidas) {
      if (r1ok && (!r0.responde || r1.score[r1.b] >= r0.score[r0.b] + DELTA_TEMA)) { el = r1; porTema = r1.b !== r0.b || !r0.responde; }
    } else if (r1ok && r1.b === tf && (r0.b !== tf || !r0.responde)) {
      if (r0.responde) sugiereTema = F[tf];
      else if (!URGENTE.test(texto) && !COMER.test(texto)) return { tipo: 'duda', ficha: null, alternativas: [F[tf]], urgente: false, puntajes: {}, porTema: true };
    }
  }
  const { b, responde, score, sem, neg, lex, orden } = el;
  const b2 = orden[1];
  const urgente = URGENTE.test(texto);
  const res = { urgente, puntajes: { sem: sem[b], neg, lex: lex[b], score: score[b] }, alternativas: [], porTema };
  const fUrg = F.findIndex((f) => f.id === 'emergencia');
  if (urgente && F[b].id !== 'emergencia' && F[b].id !== 'mal_altura') {
    // Seguridad primero: ante palabras de emergencia, la ficha de emergencia siempre aparece.
    return { ...res, tipo: 'respuesta', ficha: F[fUrg], alternativas: [F[b]].filter((f) => f.id !== 'emergencia') };
  }
  if (COMER.test(texto) && F[b].id !== 'comer_plantas') {
    // Regla de la app: nunca decir si algo se come o es tóxico. Esa ficha va primero.
    const fc = F.find((f) => f.id === 'comer_plantas');
    return { ...res, tipo: 'respuesta', ficha: fc, alternativas: [F[b]] };
  }
  if (responde && F[b].abstencion) return { ...res, tipo: 'nose', ficha: F[b], alternativas: [] };
  if (responde) {
    const cerca = !soloLexico && score[b] - score[b2] < 0.012 && !F[b2].abstencion;
    const alt = cerca ? [F[b2]] : [];
    if (sugiereTema && !alt.includes(sugiereTema) && sugiereTema !== F[b]) alt.unshift(sugiereTema);
    return { ...res, tipo: 'respuesta', ficha: F[b], alternativas: alt, sugiereTema: sugiereTema && sugiereTema !== F[b] ? sugiereTema : null };
  }
  // No llega al umbral: si hay candidatas razonables, ofrecerlas como "¿Te refieres a…?"
  const candidatas = soloLexico ? orden.filter((i) => lex[i] >= 0.25).slice(0, 2) : orden.filter((i) => sem[i] >= idx.P.T - 0.03 && score[i] - neg >= -0.01 && !F[i].abstencion).slice(0, 2);
  if (candidatas.length) return { ...res, tipo: 'duda', ficha: null, alternativas: candidatas.map((i) => F[i]) };
  return { ...res, tipo: 'nose', ficha: null, alternativas: [] };
}

export function sugerencias(lang) {
  const ids = ['que_llevar', 'mal_altura', 'cima', 'frailejon', 'volcan_estado', 'mascotas'];
  return ids.map((id) => base?.fichas.find((f) => f.id === id)).filter(Boolean).map((f) => ({ id: f.id, texto: lang === 'en' ? f.qen?.[0] : f.q[0] }));
}
export const fichaPorId = (id) => base?.fichas.find((f) => f.id === id);
