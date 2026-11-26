// Respuestas del chat con los datos del mapa: cuánto falta, a qué altura estás, dónde estás y cuánto
// llevas. Solo usa lo que mide este teléfono (GPS y bitácora); si no hay datos, lo dice.
// No da indicaciones de navegación: solo distancias en línea recta.
import { E, estaciones, cromos, tiene } from './estado.js';
import { t } from './i18n.js';
import { distancia, fmtDist } from './util.js';
import * as bit from './bitacora.js';
import * as sendero from './sendero.js';

const loc = (lang) => (lang === 'en' ? 'en-US' : 'es-CO');
const alt = (m, lang) => `${Math.round(m).toLocaleString(loc(lang))} m`;
const dur = (ms) => { const min = Math.round(ms / 60000); return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')} min`; };
const EN_PARQUE = 3000; // a menos de 3 km de alguna estación

function cercana(p) {
  let mejor = null, d = Infinity, i = -1;
  estaciones().forEach((e, k) => { const x = distancia(p, e); if (x < d) { d = x; mejor = e; i = k; } });
  return { e: mejor, d, i };
}
// «la estación 2, Estación 2» suena raro: si el nombre es solo el número, no se repite
const nom = (e) => (/^(Estación|Station)\s*\d+$/i.test(e.nombre) ? '' : e.nombre);
const coma = (e) => (nom(e) ? `, ${nom(e)}` : '');
const visitada = (e) => E.visitadas[e.id] || cromos().some((c) => c.tipo === 'gps' && c.estacion === e.id && tiene(c.id));

// Devuelve { texto, mapa?: id de estación o 'volcan', altura?: true }
export function responder(tipo, lang = E.lang) {
  const T = (k, v) => t(k, v, lang);
  const p = E.posicion;
  if (tipo === 'recorrido') {
    const r = bit.resumen();
    if (!r || r.puntos < 2) return { texto: T('rec.sinRecorrido'), mapa: '_' };
    return { texto: T('rec.recorrido', { dist: fmtDist(r.distancia, lang), tiempo: dur(r.duracion), subida: alt(r.subida, lang) }) + (r.altMax != null ? ` ${T('rec.maxHoy', { alt: `${r.alturaGps ? '' : '≈ '}${alt(r.altMax, lang)}` })}` : '') };
  }
  if (!p) return { texto: T('rec.sinGps'), mapa: '_' };
  const { e, d, i } = cercana(p);
  const ests = estaciones();
  if (tipo === 'altura') {
    const a = p.altura || bit.alturaActual();
    const r = bit.resumen();
    if (!a) return { texto: T('rec.sinAltura'), altura: true };
    const fuente = a.estimada ? T('rec.altEstimada') : (a.prec ? T('rec.altGps', { m: Math.round(a.prec) }) : T('rec.altGpsSin'));
    let txt = T('rec.altura', { alt: `${a.estimada ? '≈ ' : ''}${alt(a.alt, lang)}`, fuente });
    if (r?.altMax != null && r.altMax > a.alt) txt += ` ${T('rec.maxHoy', { alt: `${r.alturaGps ? '' : '≈ '}${alt(r.altMax, lang)}` })}`;
    return { texto: txt, altura: a.alt >= 3000 };
  }
  if (d > EN_PARQUE) return { texto: T('rec.fuera', { d: fmtDist(distancia(p, ests[0]), lang), est: ests[0].nombre }), mapa: ests[0].id };
  if (tipo === 'donde') {
    if (d <= e.radio + Math.min(p.precision || 0, 30)) return { texto: T('rec.enEstacion', { n: i + 1, est: coma(e) }), mapa: e.id };
    const dc = sendero.distanciaA(p, e);
    return { texto: T(dc.porSendero ? 'rec.cercaSendero' : 'rec.cerca', { n: i + 1, est: coma(e), d: fmtDist(dc.m, lang) }), mapa: e.id };
  }
  if (tipo === 'falta') {
    const v = ests.filter(visitada).length;
    const sig = ests.find((x) => !visitada(x));
    if (!sig) return { texto: T('rec.todas', { t: ests.length }), mapa: ests[ests.length - 1].id };
    const k = ests.indexOf(sig);
    const ds = sendero.distanciaA(p, sig);
    return { texto: T(ds.porSendero ? 'rec.faltaSendero' : 'rec.falta', { n: k + 1, est: coma(sig), d: fmtDist(ds.m, lang), v, t: ests.length }) + (sig.finAutorizado ? ` ${T('rec.esElFin')}` : ''), mapa: sig.id };
  }
  return { texto: T('chat.nose') };
}

// Texto con la ubicación actual, para la ficha de emergencia (para dársela a quien ayude)
export function ubicacionTexto(lang = E.lang) {
  const p = E.posicion;
  if (!p) return null;
  const a = p.altura || bit.alturaActual();
  const { e, d, i } = cercana(p);
  const partes = [`${p.lat.toFixed(5)}, ${p.lon.toFixed(5)}`];
  if (a) partes.push(`${a.estimada ? '≈ ' : ''}${alt(a.alt, lang)}`);
  if (d < EN_PARQUE) partes.push(t('rec.cercaCorto', { n: i + 1, estP: nom(e) ? ` (${nom(e)})` : '', d: fmtDist(d, lang) }, lang));
  return partes.join(' · ');
}
