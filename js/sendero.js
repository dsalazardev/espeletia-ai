// El sendero real (paquete.json → sendero): el carreteable Brisas – Valle de las Tumbas, para dibujar el mapa y
// medir «cuánto falta» por el camino y no en línea recta. Sin sendero en el paquete, todo vuelve a la línea recta.
import { E } from './estado.js';
import { distancia } from './util.js';

// Más lejos que esto del camino, «por el sendero» deja de tener sentido (estás fuera del recorrido): línea recta
const CERCA_M = 150;

let cache = null;
function datos() {
  const s = E.paquete?.sendero;
  if (!s?.puntos?.length) return null;
  if (cache?.ref === s) return cache;
  const pts = s.puntos.map(([lat, lon]) => ({ lat, lon }));
  const acum = [0];
  for (let i = 1; i < pts.length; i++) acum.push(acum[i - 1] + distancia(pts[i - 1], pts[i]));
  cache = { ref: s, pts, acum, largo: acum[acum.length - 1] };
  return cache;
}

export const hay = () => !!datos();
export const puntos = () => datos()?.pts || [];
export const largo = () => datos()?.largo || 0;

// Proyecta una posición sobre el sendero: { m: metros desde el inicio, d: metros al camino } o null sin sendero.
// Plano local (equirectangular): de sobra para segmentos de decenas de metros.
export function proyectar(p) {
  const s = datos();
  if (!s || !p) return null;
  const kx = Math.cos((p.lat * Math.PI) / 180) * 111320, ky = 110540;
  let mejor = { m: 0, d: Infinity };
  for (let i = 1; i < s.pts.length; i++) {
    const a = s.pts[i - 1], b = s.pts[i];
    const bx = (b.lon - a.lon) * kx, by = (b.lat - a.lat) * ky, px = (p.lon - a.lon) * kx, py = (p.lat - a.lat) * ky;
    const L2 = bx * bx + by * by || 1;
    const u = Math.max(0, Math.min(1, (px * bx + py * by) / L2));
    const d = Math.hypot(px - u * bx, py - u * by);
    if (d < mejor.d) mejor = { m: s.acum[i - 1] + u * Math.sqrt(L2), d };
  }
  return mejor;
}

// Distancia de una posición a un punto del recorrido (una estación):
// { m, porSendero } — por el camino si los dos están sobre él; si no, en línea recta.
export function distanciaA(pos, punto) {
  const a = proyectar(pos), b = proyectar(punto);
  if (a && b && a.d <= CERCA_M && b.d <= CERCA_M) return { m: Math.abs(b.m - a.m) + a.d, porSendero: true };
  return { m: distancia(pos, punto), porSendero: false };
}
