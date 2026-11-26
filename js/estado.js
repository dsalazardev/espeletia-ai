// Estado de la colección y reglas del álbum. Todo se guarda en el celular (IndexedDB).
import * as db from './db.js';
import { distancia } from './util.js';

export const bus = new EventTarget();
const emitir = (tipo, detalle) => bus.dispatchEvent(new CustomEvent(tipo, { detail: detalle }));

export const E = {
  paquete: null,
  lang: 'es',
  nombre: '',
  album: {},      // id -> { fecha, estacion, altura, foto, abierto }
  visitadas: {},  // estacionId -> fecha
  fijadas: {},    // estacionId -> { lat, lon, altura } fijadas en campo por el equipo
  ajustes: { tema: 'auto', voz: true, vibrar: true, demo: false, texto: 'n', contraste: false, ahorro: 'auto', tono: 'normal' },
  posicion: null, // { lat, lon, precision, altitud }
  parque: {},     // models/parque.json: Lente y estaciones publicadas por el equipo para todos los teléfonos
  aqui: 0,        // última vez que el guía confirmó que el grupo está en el parque
  usados: [],     // códigos del guía ya usados en este teléfono (cada uno sirve una vez)
  portadaVista: false,
};

export async function cargar() {
  const res = await fetch('paquete.json');
  E.paquete = await res.json();
  E.parque = await fetch('models/parque.json').then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
  const [album, visitadas, fijadas, ajustes, nombre, lang, portada, aqui, usados] = await Promise.all(
    ['album', 'visitadas', 'fijadas', 'ajustes', 'nombre', 'lang', 'portada', 'aqui', 'usados'].map((k) => db.get('kv', k))
  );
  E.aqui = aqui || 0;
  E.usados = usados || [];
  E.album = album || {};
  // Limpia registros de cromos que ya no existen en el paquete
  for (const id of Object.keys(E.album)) if (!cromo(id)) delete E.album[id];
  E.visitadas = visitadas || {};
  E.fijadas = fijadas || {};
  E.ajustes = { ...E.ajustes, ...(ajustes || {}) };
  if (new URLSearchParams(location.search).has('demo')) E.ajustes.demo = true;
  E.nombre = nombre || '';
  E.lang = lang || ((navigator.language || 'es').toLowerCase().startsWith('en') ? 'en' : 'es');
  E.portadaVista = !!portada;
  localStorage.setItem('voz', E.ajustes.voz ? '1' : '0');
  localStorage.setItem('vibrar', E.ajustes.vibrar ? '1' : '0');
}

export async function guardar() {
  await Promise.all([
    db.put('kv', 'album', E.album), db.put('kv', 'visitadas', E.visitadas), db.put('kv', 'fijadas', E.fijadas),
    db.put('kv', 'ajustes', E.ajustes), db.put('kv', 'nombre', E.nombre), db.put('kv', 'lang', E.lang),
    db.put('kv', 'portada', E.portadaVista), db.put('kv', 'aqui', E.aqui), db.put('kv', 'usados', E.usados.slice(-300)),
  ]);
  localStorage.setItem('voz', E.ajustes.voz ? '1' : '0');
  localStorage.setItem('vibrar', E.ajustes.vibrar ? '1' : '0');
}

// ---------- Consultas ----------
export const cromos = () => E.paquete.cromos;
export const cromo = (id) => E.paquete.cromos.find((c) => c.id === id);
export const capitulos = () => E.paquete.capitulos;
export const cromosDe = (cap) => E.paquete.cromos.filter((c) => c.capitulo === cap);
export const texto = (c) => c[E.lang] || c.es;
export const nombreClase = (id) => { const k = E.paquete.clases.find((c) => c.id === id); return k ? (k[E.lang] || k.es) : id; };
export const tiene = (id) => !!E.album[id];
export const abierto = (id) => !!E.album[id]?.abierto;
export const total = () => E.paquete.cromos.length;
export const pegados = () => E.paquete.cromos.filter((c) => abierto(c.id)).length;
export const pendientes = () => Object.entries(E.album).filter(([, r]) => !r.abierto).sort((a, b) => a[1].fecha - b[1].fecha).map(([id]) => id);
export const capituloCompleto = (cap) => cromosDe(cap).every((c) => abierto(c.id));

// Coordenadas: las del paquete, corregidas por las que publicó el equipo (parque.json) y, en el teléfono
// del equipo, por las que fijó en campo y aún no ha publicado.
export function estaciones() {
  const pub = E.parque?.estaciones || {};
  return E.paquete.estaciones.map((e) => {
    const f = E.fijadas[e.id] || pub[e.id];
    return { ...e, ...(f || {}), fijada: !!f, porConfirmar: f ? false : e.porConfirmar };
  });
}
export const estacion = (id) => estaciones().find((e) => e.id === id);

export function estacionCercana(max = 400) {
  if (!E.posicion) return null;
  let mejor = null, dmin = Infinity;
  for (const e of estaciones()) { const d = distancia(E.posicion, e); if (d < dmin) { dmin = d; mejor = e; } }
  return dmin <= max ? mejor : null;
}

// ¿Está el visitante en el parque? Lo confirma el guía (QR o código), una estación visitada hoy
// o el GPS cerca de una estación. Sin esto, la pausa y la foto de grupo no se pueden hacer desde la casa.
export function enParque() {
  if (E.ajustes.demo) return true;
  const H = 3600e3, ahora = Date.now();
  if (E.aqui && ahora - E.aqui < 2 * H) return true;
  if (Object.values(E.visitadas).some((f) => ahora - f < 6 * H)) return true;
  return !!(E.posicion && estacionCercana(600));
}
export async function marcarAqui() { E.aqui = Date.now(); await guardar(); emitir('cambio', {}); }

// ¿Se puede conseguir ya este cromo? Devuelve null si sí, o el motivo si no.
// `guia: true` cuando lo confirma el guía: él ya verificó que es otra planta.
export function bloqueo(c, { guia = false } = {}) {
  if (c.requiere && Object.keys(E.album).length < c.requiere) return { tipo: 'requiere', faltan: c.requiere - Object.keys(E.album).length };
  if (c.despuesDe && !tiene(c.despuesDe)) return { tipo: 'despuesDe', de: c.despuesDe };
  if (c.lugar && !enParque()) return { tipo: 'lugar' };
  // Pausa de aclimatación (issue #18): en su estación (visitada o con el GPS dentro) o con el código «estamos en el parque»
  if (c.tipo === 'aclimatacion' && c.estacion && !E.visitadas[c.estacion] && !enParque()) {
    const e = estacion(c.estacion);
    const dentro = e && E.posicion && distancia(E.posicion, e) <= e.radio + Math.min(E.posicion.precision || 0, 30);
    if (!dentro) return { tipo: 'estacion', estacion: c.estacion };
  }
  if (c.otraPlanta && !guia && tiene(c.otraPlanta)) {
    // Otra planta, no la misma: a 25 m o más de la primera (con GPS) o, sin GPS, 3 minutos después
    const a = E.album[c.otraPlanta];
    const lejos = a.pos && E.posicion ? distancia(a.pos, E.posicion) >= 25 : Date.now() - a.fecha >= 3 * 60e3;
    if (!lejos) return { tipo: 'otraPlanta', de: c.otraPlanta };
  }
  return null;
}

// El siguiente cromo de cámara pendiente para una clase (respeta las condiciones de arriba).
export function pendienteDeClase(clase, opc) {
  return E.paquete.cromos.find((c) => c.tipo === 'camara' && c.clase === clase && !tiene(c.id) && !bloqueo(c, opc));
}
// Un cromo de esa clase que existe pero aún no se puede (p. ej. "busca otra planta")
export const bloqueadoDeClase = (clase) => E.paquete.cromos.find((c) => c.tipo === 'camara' && c.clase === clase && !tiene(c.id) && bloqueo(c));

// ---------- Acciones ----------
export async function ganar(id, { foto = null, estacionId = null } = {}) {
  if (tiene(id)) return false;
  const c = cromo(id);
  const est = estacionId ? estacion(estacionId) : (c.estacion ? estacion(c.estacion) : estacionCercana());
  E.album[id] = {
    fecha: Date.now(),
    estacion: est?.id || null,
    altura: E.posicion?.altitud ?? est?.altura ?? null,
    foto: !!foto,
    abierto: false,
    ...(E.posicion ? { pos: { lat: E.posicion.lat, lon: E.posicion.lon } } : {}),
  };
  if (foto) await guardarFoto(id, foto);
  await guardar();
  emitir('ganado', { id });
  emitir('cambio', { id });
  return true;
}

export async function abrir(id) {
  if (!E.album[id] || E.album[id].abierto) return;
  E.album[id].abierto = true;
  await guardar();
  emitir('cambio', { id });
  if (capituloCompleto(cromo(id).capitulo)) emitir('capitulo', { cap: cromo(id).capitulo });
  if (pegados() === total()) emitir('completo', {});
}

// Miniatura para el álbum: 24 fotos grandes decodificadas pesarían ~90 MB en memoria; las miniaturas, ~5 MB.
async function miniatura(blob, lado = 360) {
  try {
    const bmp = await createImageBitmap(blob);
    const s = Math.min(1, lado / Math.min(bmp.width, bmp.height));
    const cv = document.createElement('canvas');
    cv.width = Math.round(bmp.width * s); cv.height = Math.round(bmp.height * s);
    cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
    bmp.close?.();
    return await new Promise((ok) => cv.toBlob(ok, 'image/jpeg', 0.8));
  } catch (e) { return blob; }
}
async function guardarFoto(id, blob) {
  await db.put('fotos', id, blob);
  await db.put('fotos', `${id}:mini`, await miniatura(blob));
}

const urls = {};
export async function fotoURL(id, { mini = false } = {}) {
  if (!E.album[id]?.foto) return null;
  const k = mini ? `${id}:mini` : id;
  if (urls[k]) return urls[k];
  const b = (await db.get('fotos', k)) || (mini ? await db.get('fotos', id) : null);
  if (!b) return null;
  urls[k] = URL.createObjectURL(b);
  return urls[k];
}
export const fotoBlob = (id) => db.get('fotos', id);

export async function ponerFoto(id, blob) {
  if (!E.album[id]) return;
  await guardarFoto(id, blob);
  E.album[id].foto = true;
  for (const k of [id, `${id}:mini`]) if (urls[k]) { URL.revokeObjectURL(urls[k]); delete urls[k]; }
  await guardar();
  emitir('cambio', { id });
}

export async function visitar(estId) {
  if (E.visitadas[estId]) return false;
  E.visitadas[estId] = Date.now();
  await guardar();
  return true;
}

export async function fijarEstacion(id, pos) {
  E.fijadas[id] = { lat: pos.lat, lon: pos.lon, ...(pos.altitud ? { altura: Math.round(pos.altitud) } : {}) };
  await guardar();
}

export async function vaciar() {
  E.album = {}; E.visitadas = {}; E.aqui = 0; E.usados = [];
  for (const k of Object.keys(urls)) { URL.revokeObjectURL(urls[k]); delete urls[k]; }
  await db.clear('fotos');
  await guardar();
  emitir('cambio', {});
}

export function ponerPosicion(p) {
  E.posicion = p;
  if (p) { recorrido.push({ t: Date.now(), lat: p.lat, lon: p.lon }); while (recorrido.length && Date.now() - recorrido[0].t > 45e3) recorrido.shift(); }
  emitir('posicion', p);
}
// ¿El GPS dice que camina? Más de 12 m en los últimos 30 s (los compañeros 2D no aparecen caminando, #16)
const recorrido = [];
export function caminando() {
  const ahora = Date.now(), r = recorrido.filter((x) => ahora - x.t <= 30e3);
  if (r.length < 2) return false;
  return r.some((a) => r.some((b) => distancia(a, b) > 12));
}
// Estación en la que está ahora (dentro de su radio), o null
export function estacionActual() {
  const p = E.posicion;
  if (!p) return null;
  return estaciones().find((e) => distancia(p, e) <= e.radio + Math.min(p.precision || 0, 30)) || null;
}

// Fotos con un personaje (cámara + personaje), para el collage. Van en el mismo almacén que las fotos del álbum.
export async function guardarFotoPersonaje(blob, { personaje, cromo }) {
  const id = `pj:${Date.now()}`;
  await db.put('fotos', id, blob);
  const lista = (await db.get('kv', 'fotosPj')) || [];
  lista.push({ id, personaje, cromo, fecha: Date.now() });
  await db.put('kv', 'fotosPj', lista);
  emitir('cambio', { id });
  return id;
}
export const fotosPersonaje = async () => (await db.get('kv', 'fotosPj')) || [];
