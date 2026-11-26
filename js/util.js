import { t } from "./i18n.js";
// Utilidades compartidas: selección, avisos, vibración, voz y animación.
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// Ahorro de energía (Ajustes, o solo con la batería baja): menos animación, Lente más pausada, sin 3D
export const ahorro = () => document.documentElement.classList.contains('ahorro');
export const reducido = () => matchMedia('(prefers-reduced-motion: reduce)').matches || ahorro();

export function h(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

let toastTimer;
export function aviso(msg, ms = 3000) {
  const t = $('#aviso');
  t.textContent = msg;
  t.classList.add('ver');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('ver'), ms);
}

let puedeVibrar = false;
addEventListener('pointerdown', () => { puedeVibrar = true; }, { once: true, capture: true });
export function vibrar(p = 60) {
  if (localStorage.getItem('vibrar') === '0') return;
  // iPhone no vibra desde la web: en su lugar, un destello en el borde de la pantalla (spec arreglos-iphone)
  if (!('vibrate' in navigator)) { destello(p); return; }
  if (!puedeVibrar) return;
  try { navigator.vibrate(p); } catch (e) { destello(p); }
}

// Señal visual equivalente a vibrar: un marco que se enciende tantas veces como pulsos tenía la vibración
export function destello(p = 60) {
  const n = Array.isArray(p) ? Math.ceil(p.length / 2) : 1;
  let el = document.getElementById('destello');
  if (!el) { el = document.createElement('div'); el.id = 'destello'; el.className = 'destello'; el.setAttribute('aria-hidden', 'true'); document.body.appendChild(el); }
  el.getAnimations?.().forEach((a) => a.cancel());
  const marcos = [];
  for (let i = 0; i < n; i++) marcos.push({ opacity: 0, offset: i / n }, { opacity: 1, offset: (i + 0.4) / n });
  marcos.push({ opacity: 0 });
  el.animate?.(marcos, { duration: 260 * n, easing: 'ease-out' });
}

// Mantener la pantalla encendida (Wake Lock). Se vuelve a pedir al volver a la app, porque el sistema lo suelta.
// Devuelve { ok, soltar }: ok=false si el teléfono no lo permite (plan B: avisar al visitante).
export async function mantenerDespierta() {
  let lock = null, activo = true;
  const pedir = async () => { try { lock = await navigator.wakeLock.request('screen'); return true; } catch (e) { return false; } };
  const ok = 'wakeLock' in navigator && (await pedir());
  const alVolver = () => { if (activo && document.visibilityState === 'visible' && ok) pedir(); };
  document.addEventListener('visibilitychange', alVolver);
  return { ok, soltar: () => { activo = false; document.removeEventListener('visibilitychange', alVolver); try { lock?.release(); } catch (e) { /* */ } lock = null; } };
}

// Voz del sistema (funciona sin internet con las voces instaladas en el celular).
// ---------- Voz (spec reproductor-audio, issue #19) ----------
// Se prefiere la voz local, salvo para las paradas narradas con una grabacion vigente.
// Si no hay voz local ni grabacion vigente, queda el texto.
// Devuelve 'audio' | 'voz' | 'texto' | 'apagado'.
const IDIOMAS_AUDIO = { es: ['es-CO', 'es-ES'], en: ['en'] };
let manifiesto = null, reproductor = null;
const cargarManifiesto = () => (manifiesto ??= fetch('audios/manifiesto.json').then((r) => (r.ok ? r.json() : { audios: [] })).catch(() => ({ audios: [] })));
const huellaTexto = async (txt) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(txt).trim().normalize('NFC'))))].map((x) => x.toString(16).padStart(2, '0')).join('');

async function audioVigente(tipo, id, texto, lang) {
  if (!tipo || !id || !texto || !crypto.subtle) return null;
  const { audios = [] } = await cargarManifiesto();
  const h = await huellaTexto(texto);
  for (const idioma of IDIOMAS_AUDIO[lang] || [lang]) {
    const a = audios.find((x) => x.tipo === tipo && x.id === id && x.idioma === idioma);
    if (a && a.revisado && a.huella === h) return a;
  }
  return null;
}

function vozLocal(lang) {
  const voces = speechSynthesis.getVoices().filter((v) => v.localService === true); // sin red: solo voces del teléfono
  const pref = lang === 'en' ? [/^en(-|_)US/i, /^en/i] : [/^es(-|_)CO/i, /^es(-|_)(419|MX|US)/i, /^es/i];
  for (const r of pref) { const v = voces.find((x) => r.test(x.lang)); if (v) return v; }
  return null;
}

// La primera vez que suena algo: la norma del parque prohíbe ruidos que perturben
function avisoAudifonos() {
  try { if (localStorage.getItem('paramo-audifonos')) return; localStorage.setItem('paramo-audifonos', '1'); } catch (e) { return; }
  aviso(t('voz.audifonos'), 5000);
}

async function reproducirGrabacion(tipo, id, texto, lang) {
  const a = await audioVigente(tipo, id, texto, lang);
  if (a) {
    avisoAudifonos();
    reproductor ??= new Audio();
    reproductor.src = a.archivo;
    try { await reproductor.play(); window.__ultimaVoz = { modo: 'audio', archivo: a.archivo }; return true; }
    catch (e) { console.warn('audio', a.archivo, e); } // sin el archivo (aún no guardado): se sigue con la voz del teléfono
  }
  return false;
}

// texto: lo que se lee (si no hay audio); tipo/id: para buscar el audio ('ficha' | 'parada' | 'cromo' | 'frase')
export async function escuchar({ texto, lang = 'es', tipo = null, id = null, textoAudio = null, silencioso = false } = {}) {
  callar();
  if (localStorage.getItem('voz') === '0') return (window.__ultimaVoz = { modo: 'apagado' }).modo;
  if (tipo === 'parada' && await reproducirGrabacion(tipo, id, textoAudio ?? texto, lang)) return 'audio';
  if ('speechSynthesis' in window) {
    const voz = vozLocal(lang);
    if (voz) {
      avisoAudifonos();
      const u = new SpeechSynthesisUtterance(texto);
      u.voice = voz; u.lang = voz.lang; u.rate = 0.97;
      speechSynthesis.speak(u);
      window.__ultimaVoz = { modo: 'voz', voz: voz.name };
      return 'voz';
    }
  }
  if (tipo !== 'parada' && await reproducirGrabacion(tipo, id, textoAudio ?? texto, lang)) return 'audio';
  if (!silencioso) aviso(t('voz.sinVoz'), 4000); // lectura automática (al abrir un sobre): sin aviso
  window.__ultimaVoz = { modo: 'texto' };
  return 'texto';
}
// Compatibilidad: leer un texto sin audio asociado
export const hablar = (texto, lang = 'es') => escuchar({ texto, lang });
export const callar = () => {
  try { speechSynthesis.cancel(); } catch (e) { /* */ }
  if (reproductor) { reproductor.pause(); reproductor.currentTime = 0; }
};

// Animación con Web Animations API; respeta "reducir movimiento".
export function animar(el, frames, opts) {
  if (!el) return Promise.resolve();
  if (reducido()) {
    const ultimo = Array.isArray(frames) ? frames[frames.length - 1] : null;
    if (ultimo && opts && opts.fill && opts.fill !== 'none') Object.assign(el.style, ultimo);
    return Promise.resolve();
  }
  const a = el.animate(frames, opts);
  return a.finished.catch(() => {});
}

export const esperar = (ms) => new Promise((r) => setTimeout(r, reducido() ? Math.min(ms, 60) : ms));

export function distancia(a, b) {
  const R = 6371000, r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r, dLon = (b.lon - a.lon) * r;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export function fmtDist(m, lang = 'es') {
  if (m < 1000) return `${Math.round(m / 10) * 10} m`;
  const km = (m / 1000).toFixed(1);
  return `${lang === 'es' ? km.replace('.', ',') : km} km`;
}

// Mantiene el foco dentro de un diálogo modal construido a mano.
export function atraparFoco(cont) {
  const f = () => $$('button:not([disabled]):not([hidden]), input:not([hidden]), [tabindex="0"]', cont).filter((e) => e.offsetParent !== null);
  const onKey = (e) => {
    if (e.key !== 'Tab') return;
    const l = f(); if (!l.length) return;
    const i = l.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); l[l.length - 1].focus(); }
    else if (!e.shiftKey && i === l.length - 1) { e.preventDefault(); l[0].focus(); }
  };
  cont.addEventListener('keydown', onKey);
  return () => cont.removeEventListener('keydown', onKey);
}
