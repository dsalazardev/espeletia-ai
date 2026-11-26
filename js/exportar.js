// Exporta un cromo (frente + dato oficial) o el álbum completo como imagen PNG.
import { E, cromo as getCromo, texto, fotoBlob, estacion, capitulos, cromosDe, abierto, total, pegados } from './estado.js';
import { ilustracion, personajes } from './art.js';
import { t } from './i18n.js';
import { fecha, alturaTxt, num } from './cromo.js';

const C = { papel: '#e6ece8', papel2: '#f1f4f1', verde: '#2f6b4f', amarillo: '#f4c431', noche: '#1d2b38', sello: '#d8492b', gris: '#5d6f68' };
const ESTILO = `<style>.ink-y{fill:${C.amarillo}}.ink-g{fill:${C.verde};mix-blend-mode:multiply}.ink-p{fill:${C.papel2}}.l{fill:none!important;stroke-width:3;stroke-linecap:round}.ink-y .l{stroke:${C.amarillo}}.ink-g .l{stroke:${C.verde}}.ink-p .l{stroke:${C.papel2};stroke-width:2.2}</style>`;

export function svgImg(svg) {
  return new Promise((ok, mal) => {
    const limpio = svg.replace(/^(<svg[^>]*?) width="[^"]*"/, '$1').replace(/^(<svg[^>]*?) height="[^"]*"/, '$1');
    const s = limpio.replace('<svg ', `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" `).replace('>', `>${ESTILO}`);
    const img = new Image(); img.onload = () => ok(img); img.onerror = mal;
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
  });
}
function blobImg(b) {
  return new Promise((ok, mal) => { const u = URL.createObjectURL(b); const i = new Image(); i.onload = () => { ok(i); URL.revokeObjectURL(u); }; i.onerror = mal; i.src = u; });
}
async function fuentes() {
  await Promise.all(['800 90px Bricolage', '700 40px Bricolage', '400 30px Atkinson', '700 30px Atkinson'].map((f) => document.fonts.load(f.replace('Bricolage', '"Bricolage Grotesque"').replace('Atkinson', '"Atkinson Hyperlegible"')))).catch(() => {});
}
function lineas(ctx, txt, x, y, ancho, alto, max = 5) {
  const pal = txt.split(' '); let l = '', n = 0;
  for (const p of pal) {
    const prueba = l ? `${l} ${p}` : p;
    if (ctx.measureText(prueba).width > ancho && l) { ctx.fillText(l, x, y + n * alto); n++; l = p; if (n >= max) return y + n * alto; }
    else l = prueba;
  }
  if (l) { ctx.fillText(l, x, y + n * alto); n++; }
  return y + n * alto;
}
function cubrir(ctx, img, x, y, w, h) {
  const s = Math.max(w / img.width, h / img.height);
  ctx.drawImage(img, x + (w - img.width * s) / 2, y + (h - img.height * s) / 2, img.width * s, img.height * s);
}
function troquel(ctx, x, y, w, h, r, color) {
  ctx.fillStyle = color;
  for (let i = x + r * 2; i < x + w - r; i += r * 4.4) { ctx.beginPath(); ctx.arc(i, y, r, 0, 7); ctx.arc(i, y + h, r, 0, 7); ctx.fill(); }
  for (let j = y + r * 2; j < y + h - r; j += r * 4.4) { ctx.beginPath(); ctx.arc(x, j, r, 0, 7); ctx.arc(x + w, j, r, 0, 7); ctx.fill(); }
}

// Dibuja el frente de un cromo en (x, y) con ancho w (alto = w * 4/3).
async function frente(ctx, id, x, y, w) {
  const c = getCromo(id), r = E.album[id], tx = texto(c), hgt = w * 4 / 3, u = w / 100;
  ctx.save();
  ctx.fillStyle = C.papel2; ctx.beginPath(); ctx.roundRect(x, y, w, hgt, 3 * u); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.roundRect(x + 4 * u, y + 4 * u, w - 8 * u, hgt - 30 * u, 2 * u); ctx.clip();
  const foto = r?.foto ? await fotoBlob(id) : null;
  if (foto) cubrir(ctx, await blobImg(foto), x + 4 * u, y + 4 * u, w - 8 * u, hgt - 30 * u);
  else { ctx.fillStyle = '#dfe7e2'; ctx.fillRect(x, y, w, hgt); ctx.drawImage(await svgImg(ilustracion(id)), x + 10 * u, y + 10 * u, w - 20 * u, w - 20 * u); }
  ctx.restore();
  if (c.brillante) {
    const g = ctx.createLinearGradient(x, y, x + w, y + hgt);
    ['rgba(255,120,200,.0)', 'rgba(120,220,255,.28)', 'rgba(255,240,120,.30)', 'rgba(160,255,190,.26)', 'rgba(255,120,200,.0)'].forEach((s, i) => g.addColorStop(i / 4, s));
    ctx.fillStyle = g; ctx.fillRect(x + 4 * u, y + 4 * u, w - 8 * u, hgt - 30 * u);
  }
  ctx.fillStyle = C.amarillo; ctx.fillRect(x, y + hgt - 26 * u, w, 26 * u);
  ctx.fillStyle = C.verde; ctx.font = `800 ${17 * u}px "Bricolage Grotesque"`; ctx.fillText(num(c.n), x + 5 * u, y + hgt - 8 * u);
  ctx.fillStyle = C.noche; ctx.font = `700 ${8.4 * u}px "Bricolage Grotesque"`;
  lineas(ctx, tx.nombre, x + 27 * u, y + hgt - 15 * u, w - 32 * u, 8.6 * u, 2);
  if (r) {
    ctx.save(); ctx.translate(x + w - 19 * u, y + 19 * u); ctx.rotate(-0.2); ctx.globalAlpha = 0.9;
    ctx.strokeStyle = C.sello; ctx.fillStyle = C.sello; ctx.lineWidth = 1.6 * u;
    ctx.beginPath(); ctx.arc(0, 0, 13 * u, 0, 7); ctx.stroke(); ctx.lineWidth = 0.7 * u; ctx.beginPath(); ctx.arc(0, 0, 10.5 * u, 0, 7); ctx.stroke();
    ctx.textAlign = 'center'; ctx.font = `700 ${4.6 * u}px "Atkinson Hyperlegible"`; ctx.fillText(alturaTxt(r), 0, -0.5 * u);
    ctx.font = `700 ${3.4 * u}px "Atkinson Hyperlegible"`; ctx.fillText(fecha(r.fecha), 0, 4.6 * u); ctx.restore();
  }
  ctx.restore();
}

export async function cromoPNG(id) {
  await fuentes();
  const c = getCromo(id), r = E.album[id], tx = texto(c);
  const W = 1080, H = 1620, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  ctx.fontStretch = 'condensed';
  ctx.fillStyle = C.papel; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.verde; ctx.font = '800 54px "Bricolage Grotesque"'; ctx.fillText(t('titulo'), 80, 100);
  ctx.fillStyle = C.gris; ctx.font = '400 28px "Atkinson Hyperlegible"'; ctx.fillText(`${t('parque')}${E.nombre ? ' — ' + t('de', { nombre: E.nombre }) : ''}`, 80, 142);
  ctx.save(); ctx.shadowColor = 'rgba(29,43,56,.25)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
  await frente(ctx, id, 190, 190, 700); ctx.restore();
  troquel(ctx, 190, 190, 700, 933, 6, C.papel);
  let y = 1210;
  ctx.fillStyle = C.gris; ctx.font = '700 26px "Atkinson Hyperlegible"'; ctx.fillText(t('det.datoOficial'), 100, y);
  ctx.fillStyle = C.noche; ctx.font = '400 38px "Atkinson Hyperlegible"'; y = lineas(ctx, tx.dato, 100, y + 52, 880, 50, 4);
  const f = c.fuente ? E.paquete.fuentes[c.fuente] : null;
  ctx.fillStyle = C.gris; ctx.font = '400 24px "Atkinson Hyperlegible"';
  const est = r?.estacion ? estacion(r.estacion) : null;
  lineas(ctx, [f ? t('det.fuente', { f: f.titulo }) : null, est ? est.nombre : null].filter(Boolean).join(' — '), 100, Math.min(y + 24, H - 70), 880, 30, 2);
  return new Promise((ok) => cv.toBlob(ok, 'image/png'));
}

export async function albumPNG() {
  await fuentes();
  const cols = 6, cw = 220, gap = 24, W = 80 * 2 + cols * cw + (cols - 1) * gap;
  const caps = capitulos();
  let filas = 0; for (const k of caps) filas += Math.ceil(cromosDe(k.id).length / cols);
  const ch = cw * 4 / 3, H = 260 + filas * (ch + gap) + caps.length * 80 + 80;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const ctx = cv.getContext('2d');
  ctx.fontStretch = 'condensed';
  ctx.fillStyle = C.papel; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.verde; ctx.font = '800 84px "Bricolage Grotesque"'; ctx.fillText(t('titulo'), 80, 120);
  ctx.fillStyle = C.noche; ctx.font = '400 32px "Atkinson Hyperlegible"';
  ctx.fillText(`${t('parque')}${E.nombre ? ' — ' + t('de', { nombre: E.nombre }) : ''} — ${t('album.pegados', { n: pegados(), t: total() })}`, 80, 172);
  // La bitácora del recorrido, si hay: altura máxima, distancia y tiempo
  const { resumen } = await import('./bitacora.js');
  const r = resumen();
  if (r && r.altMax != null) {
    const min = Math.round(r.duracion / 60000), tiempo = min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')} min`;
    const loc = E.lang === 'es' ? 'es-CO' : 'en-US';
    ctx.fillStyle = C.verde; ctx.font = '700 26px "Atkinson Hyperlegible"';
    ctx.fillText(t('poster.recorrido', { alt: `${r.alturaGps ? '' : '≈ '}${r.altMax.toLocaleString(loc)} m`, dist: r.distancia >= 1000 ? `${(r.distancia / 1000).toLocaleString(loc, { maximumFractionDigits: 1 })} km` : `${r.distancia} m`, tiempo }), 80, 212);
  }
  let y = 236;
  for (const k of caps) {
    ctx.fillStyle = C.verde; ctx.font = '800 34px "Bricolage Grotesque"'; ctx.fillText(`${k.num}  ${k[E.lang]}`, 80, y + 34); y += 60;
    const lista = cromosDe(k.id);
    for (let i = 0; i < lista.length; i++) {
      const x = 80 + (i % cols) * (cw + gap), yy = y + Math.floor(i / cols) * (ch + gap);
      if (abierto(lista[i].id)) await frente(ctx, lista[i].id, x, yy, cw);
      else {
        ctx.strokeStyle = 'rgba(47,107,79,.35)'; ctx.setLineDash([8, 8]); ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(x, yy, cw, ch, 10); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(47,107,79,.35)'; ctx.font = '800 48px "Bricolage Grotesque"'; ctx.fillText(num(lista[i].n), x + 18, yy + 60);
      }
    }
    y += Math.ceil(lista.length / cols) * (ch + gap) + 20;
  }
  ctx.drawImage(await svgImg(personajes.fray(100)), W - 230, 30, 150, 165);
  return new Promise((ok) => cv.toBlob(ok, 'image/png'));
}

export function descargar(blob, nombre) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = nombre;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

// ======================================================================================================
// Álbum final en PDF + collage (spec docs/specs/2026-11-24-album-pdf-collage.md, issue #15)
// Todo se arma en el teléfono, sin red. Cada página se dibuja en un lienzo y va al PDF como JPEG, con una
// capa de texto invisible (para buscar, copiar y validar). Sin librerías: el PDF se escribe a mano (abajo).
// ======================================================================================================
const PW = 1240, PH = 1754; // A4 a 150 ppp
const MARGEN = 90;

// Pone la fuente más grande (hasta «max») con la que el texto cabe en «ancho»
function ajustar(ctx, txt, ancho, max, plantilla) {
  let px = max;
  do { ctx.font = plantilla.replace('{px}', px); px -= 2; } while (ctx.measureText(txt).width > ancho && px > 12);
}
// Corta por caracteres un texto sin espacios (una dirección web) para que no se salga
function cortar(ctx, txt, x, y, ancho, alto, max = 2) {
  let l = '', n = 0;
  for (const ch of txt) { if (ctx.measureText(l + ch).width > ancho) { ctx.fillText(l, x, y + n * alto); n++; l = ch; if (n >= max) return y + n * alto; } else l += ch; }
  if (l) { ctx.fillText(l, x, y + n * alto); n++; }
  return y + n * alto;
}

function pagina() {
  const cv = document.createElement('canvas'); cv.width = PW; cv.height = PH;
  const ctx = cv.getContext('2d');
  ctx.fontStretch = 'condensed';
  ctx.fillStyle = C.papel; ctx.fillRect(0, 0, PW, PH);
  return { cv, ctx, textos: [] };
}
const loc = () => (E.lang === 'en' ? 'en-US' : 'es-CO');
const fechaLarga = (ms = Date.now()) => new Date(ms).toLocaleDateString(loc(), { day: 'numeric', month: 'long', year: 'numeric' });
const metros = (m) => `${Math.round(m).toLocaleString(loc())} m`;
const distTxt = (m) => (m >= 1000 ? `${(m / 1000).toLocaleString(loc(), { maximumFractionDigits: 1 })} km` : `${Math.round(m)} m`);
const durTxt = (ms) => { const min = Math.round(ms / 60000); return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')} min`; };

function encabezado(p, titulo, sub) {
  const { ctx } = p;
  ctx.fillStyle = C.verde; ctx.font = '800 64px "Bricolage Grotesque"'; ctx.fillText(titulo, MARGEN, 150);
  if (sub) { ctx.fillStyle = C.gris; ctx.font = '400 30px "Atkinson Hyperlegible"'; lineas(ctx, sub, MARGEN, 200, PW - 2 * MARGEN, 38, 3); }
  p.textos.push(titulo); if (sub) p.textos.push(sub);
}
function pie(p, n) {
  const { ctx } = p;
  ctx.fillStyle = C.gris; ctx.font = '400 22px "Atkinson Hyperlegible"';
  ctx.fillText(`${t('titulo')} · ${t('parque')}`, MARGEN, PH - 50);
  ctx.textAlign = 'right'; ctx.fillText(String(n), PW - MARGEN, PH - 50); ctx.textAlign = 'left';
}

// ---------- Portada: ilustración original de Manizales y del Nevado del Ruiz ----------
async function portada() {
  const p = pagina(), { ctx } = p, W = PW, Hs = 1060;
  // Cielo y sol
  ctx.fillStyle = C.papel2; ctx.fillRect(0, 0, W, Hs);
  ctx.fillStyle = C.amarillo; ctx.beginPath(); ctx.arc(W * 0.79, 230, 110, 0, 7); ctx.fill();
  // Cordillera de fondo y el Nevado del Ruiz (volcán ancho con su casquete de nieve)
  ctx.globalAlpha = 0.45; ctx.fillStyle = C.verde;
  ctx.beginPath(); ctx.moveTo(0, 700); ctx.lineTo(180, 560); ctx.lineTo(330, 640); ctx.lineTo(470, 520); ctx.lineTo(640, 650); ctx.lineTo(W, 600); ctx.lineTo(W, Hs); ctx.lineTo(0, Hs); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = C.verde; ctx.beginPath(); ctx.moveTo(330, 760); ctx.lineTo(610, 380); ctx.lineTo(760, 372); ctx.lineTo(1060, 760); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(560, 448); ctx.lineTo(610, 380); ctx.lineTo(760, 372); ctx.lineTo(812, 440);
  for (let x = 812, k = 0; x > 560; x -= 28, k++) ctx.lineTo(x - 14, 440 + (k % 2 ? 26 : 6));
  ctx.closePath(); ctx.fill();
  // Manizales sobre su filo de montaña: casas, edificios y la torre de la catedral
  ctx.fillStyle = C.noche;
  ctx.beginPath(); ctx.moveTo(0, 860); ctx.quadraticCurveTo(260, 760, 560, 850); ctx.quadraticCurveTo(760, 900, W, 880); ctx.lineTo(W, Hs); ctx.lineTo(0, Hs); ctx.fill();
  const casas = [[40, 40, 46], [92, 30, 64], [130, 52, 38], [190, 36, 90], [232, 44, 56], [290, 28, 72], [372, 40, 50], [420, 34, 66], [470, 46, 44]];
  for (const [x, w, h] of casas) { const base = 838 - Math.sin(x / 180) * 30; ctx.fillRect(x, base - h, w, h + 40); }
  // Catedral: cuerpo, torre central y aguja
  ctx.fillRect(318, 700, 58, 140); ctx.beginPath(); ctx.moveTo(318, 700); ctx.lineTo(347, 610); ctx.lineTo(376, 700); ctx.fill();
  ctx.fillRect(342, 560, 10, 60);
  ctx.fillStyle = C.amarillo; // ventanas encendidas
  for (const [x, w, h] of casas) { const base = 838 - Math.sin(x / 180) * 30; for (let k = 10; k < h - 8; k += 22) ctx.fillRect(x + 8, base - h + k, 8, 9); }
  ctx.fillRect(342, 735, 10, 22);
  // Páramo en primer plano, con frailejones
  ctx.fillStyle = '#285c44'; ctx.beginPath(); ctx.moveTo(0, 990); ctx.quadraticCurveTo(W / 2, 900, W, 980); ctx.lineTo(W, Hs); ctx.lineTo(0, Hs); ctx.fill();
  const fr = await svgImg(ilustracion('frailejon'));
  ctx.drawImage(fr, 840, 820, 240, 240); ctx.drawImage(fr, 1010, 880, 170, 170); ctx.drawImage(fr, 690, 900, 150, 150);
  ctx.fillStyle = C.papel; ctx.font = '700 24px "Atkinson Hyperlegible"';
  ctx.fillText('Manizales', 60, 920); ctx.fillStyle = C.noche; ctx.fillText('Nevado del Ruiz', 610, 350);
  ctx.drawImage(await svgImg(personajes.fray(100)), 70, 960, 210, 230);
  // Título y dueño
  ctx.fillStyle = C.verde; ajustar(ctx, t('titulo'), PW - 2 * MARGEN, 150, '800 {px}px "Bricolage Grotesque"'); ctx.fillText(t('titulo'), MARGEN, 1290);
  ctx.fillStyle = C.noche; ctx.font = '700 40px "Atkinson Hyperlegible"'; ctx.fillText(t('parque'), MARGEN, 1360);
  ctx.fillStyle = C.verde; ctx.fillRect(MARGEN, 1420, PW - 2 * MARGEN, 6);
  ctx.fillStyle = C.gris; ctx.font = '400 34px "Atkinson Hyperlegible"'; ctx.fillText(t('portada.es'), MARGEN, 1490);
  ctx.fillStyle = C.noche; ajustar(ctx, E.nombre || '—', PW - 2 * MARGEN, 76, '800 {px}px "Bricolage Grotesque"'); ctx.fillText(E.nombre || '—', MARGEN, 1575);
  ctx.fillStyle = C.gris; ctx.font = '400 32px "Atkinson Hyperlegible"';
  ctx.fillText(`${fechaLarga()} · ${t('album.pegados', { n: pegados(), t: total() })}`, MARGEN, 1640);
  p.textos.push(t('titulo'), t('parque'), `${t('portada.es')} ${E.nombre || ''}`, fechaLarga(), t('album.pegados', { n: pegados(), t: total() }), 'Manizales', 'Nevado del Ruiz');
  return p;
}

// ---------- Una página por capítulo: cromos ganados y faltantes en silueta ----------
async function paginaCapitulo(k, n) {
  const p = pagina(), { ctx } = p, lista = cromosDe(k.id);
  const hechos = lista.filter((c) => abierto(c.id)).length;
  encabezado(p, `${k.num} · ${k[E.lang] || k.es}`, t('pdf.capituloSub', { n: hechos, t: lista.length }));
  const cols = 3, gap = 40, cw = (PW - 2 * MARGEN - (cols - 1) * gap) / cols, ch = cw * 4 / 3;
  const filas = Math.ceil(lista.length / cols);
  const escala = Math.min(1, (PH - 330 - 120) / (filas * (ch + gap)));
  const w = cw * escala, hh = ch * escala, x0 = (PW - (cols * w + (cols - 1) * gap)) / 2;
  for (let i = 0; i < lista.length; i++) {
    const c = lista[i], x = x0 + (i % cols) * (w + gap), y = 300 + Math.floor(i / cols) * (hh + gap);
    if (abierto(c.id)) { await frente(ctx, c.id, x, y, w); p.textos.push(`${num(c.n)} ${texto(c).nombre}`); }
    else {
      ctx.strokeStyle = 'rgba(47,107,79,.4)'; ctx.setLineDash([12, 10]); ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(x, y, w, hh, 14); ctx.stroke(); ctx.setLineDash([]);
      ctx.save(); ctx.globalAlpha = 0.22; ctx.drawImage(await svgImg(ilustracion(c.id, { silueta: true })), x + w * 0.12, y + hh * 0.14, w * 0.76, w * 0.76); ctx.restore();
      ctx.fillStyle = 'rgba(47,107,79,.55)'; ctx.font = `800 ${Math.round(w * 0.2)}px "Bricolage Grotesque"`; ctx.fillText(num(c.n), x + 22, y + hh - 28);
    }
  }
  pie(p, n);
  return p;
}

// ---------- Collage con las fotos del visitante ----------
// Fotos: las de los cromos (foto de grupo, «ponerle mi foto») y, cuando existan, las fotos con personajes (#16)
async function fotosDelVisitante() {
  const out = [];
  for (const c of E.paquete.cromos) {
    if (!E.album[c.id]?.foto) continue;
    const b = await fotoBlob(c.id).catch(() => null);
    if (b) out.push({ id: c.id, blob: b, pie: texto(c).nombre });
  }
  const { fotosPersonaje } = await import('./estado.js');
  for (const f of await fotosPersonaje()) {
    const b = await fotoBlob(f.id).catch(() => null);
    if (b) out.push({ id: f.id, blob: b, pie: t('compa.pie', { nombre: t(`pj.${f.personaje}`) }) });
  }
  return out;
}
// Dibuja las fotos como polaroids levemente giradas dentro de (x, y, w, h)
async function dibujarCollage(ctx, fotos, x, y, w, h) {
  const n = Math.min(fotos.length, 9);
  const cols = n <= 1 ? 1 : n <= 4 ? 2 : 3, filas = Math.ceil(n / cols);
  const celW = w / cols, celH = h / filas;
  for (let i = 0; i < n; i++) {
    const f = fotos[i], img = await blobImg(f.blob);
    const lado = Math.min(celW, celH) * 0.86, marco = lado * 0.05, pieH = lado * 0.14;
    const cx = x + (i % cols) * celW + celW / 2, cy = y + Math.floor(i / cols) * celH + celH / 2;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate((((i * 37) % 7) - 3) * 0.012);
    ctx.shadowColor = 'rgba(29,43,56,.28)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10;
    ctx.fillStyle = '#fff'; ctx.fillRect(-lado / 2, -lado / 2, lado, lado + pieH); ctx.shadowColor = 'transparent';
    ctx.save(); ctx.beginPath(); ctx.rect(-lado / 2 + marco, -lado / 2 + marco, lado - 2 * marco, lado - 2 * marco); ctx.clip();
    cubrir(ctx, img, -lado / 2 + marco, -lado / 2 + marco, lado - 2 * marco, lado - 2 * marco); ctx.restore();
    ctx.fillStyle = C.noche; ctx.font = `700 ${Math.round(pieH * 0.42)}px "Bricolage Grotesque"`; ctx.textAlign = 'center';
    ctx.fillText(f.pie, 0, lado / 2 + pieH * 0.62, lado - 2 * marco); ctx.textAlign = 'left';
    ctx.restore();
  }
}
async function paginaCollage(fotos, n) {
  const p = pagina();
  encabezado(p, t('pdf.collage'), t('pdf.collageSub', { n: fotos.length }));
  await dibujarCollage(p.ctx, fotos, MARGEN - 20, 290, PW - 2 * MARGEN + 40, PH - 290 - 140);
  fotos.forEach((f) => p.textos.push(f.pie));
  pie(p, n);
  return p;
}
// El collage solo, como imagen para compartir (4:5, como una publicación)
export async function collageImagen() {
  await fuentes();
  const fotos = await fotosDelVisitante();
  if (!fotos.length) return null;
  const W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d'); ctx.fontStretch = 'condensed';
  ctx.fillStyle = C.papel; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.verde; ctx.font = '800 64px "Bricolage Grotesque"'; ctx.fillText(t('titulo'), 60, 100);
  ctx.fillStyle = C.gris; ctx.font = '400 28px "Atkinson Hyperlegible"';
  ctx.fillText(`${E.nombre ? t('de', { nombre: E.nombre }) + ' · ' : ''}${t('parque')}`, 60, 145);
  await dibujarCollage(ctx, fotos, 30, 180, W - 60, H - 230);
  return new Promise((ok) => cv.toBlob(ok, 'image/jpeg', 0.88));
}

// ---------- Tu recorrido: relieve real, rastro, datos y perfil ----------
async function paginaRecorrido(n) {
  const p = pagina(), { ctx } = p;
  const bit = await import('./bitacora.js'), rel = await import('./relieve.js'), { estaciones } = await import('./estado.js');
  await bit.cargar();
  const r = bit.resumen(), pts = bit.lista(), ests = estaciones(), d = await rel.cargar();
  encabezado(p, t('pdf.recorrido'), r ? null : t('pdf.sinRecorrido'));
  const caja = { x: MARGEN, y: 250, w: PW - 2 * MARGEN, h: 860 };
  if (d) {
    const { lon0, lat1, paso, w, h } = d.meta;
    // Recorte: estaciones y rastro con margen, dentro del relieve
    const lats = [...ests.map((e) => e.lat), ...pts.map((q) => q.lat)], lons = [...ests.map((e) => e.lon), ...pts.map((q) => q.lon)];
    let [la0, la1, lo0, lo1] = [Math.min(...lats), Math.max(...lats), Math.min(...lons), Math.max(...lons)];
    const m = 0.012; la0 -= m; la1 += m; lo0 -= m; lo1 += m;
    // Igualar la proporción de la caja (en metros: 1° de longitud mide cos(lat) de uno de latitud)
    const kx = Math.cos(((la0 + la1) / 2) * Math.PI / 180), asp = caja.w / caja.h;
    const anchoM = (lo1 - lo0) * kx, altoM = la1 - la0;
    if (anchoM / altoM < asp) { const extra = (altoM * asp / kx - (lo1 - lo0)) / 2; lo0 -= extra; lo1 += extra; }
    else { const extra = ((lo1 - lo0) * kx / asp - altoM) / 2; la0 -= extra; la1 += extra; }
    const img = await new Promise((ok, mal) => { const i = new Image(); i.onload = () => ok(i); i.onerror = mal; i.src = d.imagen; });
    const sx = (lo0 - lon0) / (w * paso) * img.width, sy = (lat1 - la1) / (h * paso) * img.height;
    const sw = (lo1 - lo0) / (w * paso) * img.width, sh = (la1 - la0) / (h * paso) * img.height;
    ctx.save(); ctx.beginPath(); ctx.roundRect(caja.x, caja.y, caja.w, caja.h, 18); ctx.clip();
    ctx.fillStyle = C.papel2; ctx.fillRect(caja.x, caja.y, caja.w, caja.h);
    ctx.drawImage(img, sx, sy, sw, sh, caja.x, caja.y, caja.w, caja.h);
    const X = (lon) => caja.x + (lon - lo0) / (lo1 - lo0) * caja.w, Y = (lat) => caja.y + (la1 - lat) / (la1 - la0) * caja.h;
    if (pts.length > 1) {
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      for (const [col, ancho] of [[C.noche, 14], [C.amarillo, 8]]) {
        ctx.strokeStyle = col; ctx.lineWidth = ancho; ctx.beginPath();
        pts.forEach((q, i) => (i ? ctx.lineTo(X(q.lon), Y(q.lat)) : ctx.moveTo(X(q.lon), Y(q.lat)))); ctx.stroke();
      }
    }
    ests.forEach((e, i) => {
      const x = X(e.lon), y = Y(e.lat);
      ctx.fillStyle = C.verde; ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x, y, 24, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = '800 28px "Bricolage Grotesque"'; ctx.textAlign = 'center'; ctx.fillText(String(i + 1), x, y + 10); ctx.textAlign = 'left';
      ctx.fillStyle = C.noche; ctx.font = '700 24px "Atkinson Hyperlegible"'; ctx.fillText(e.nombre, x + 32, y + 8);
      p.textos.push(`${i + 1}. ${e.nombre}`);
    });
    ctx.restore();
    ctx.fillStyle = C.gris; ctx.font = '400 17px "Atkinson Hyperlegible"';
    lineas(ctx, `${t('pdf.relieve')} ${d.meta.atribucion}`, caja.x, caja.y + caja.h + 28, caja.w, 22, 3);
  }
  let y = caja.y + caja.h + 110;
  if (r) {
    const datos = [
      [t('bit.altMax'), r.altMax != null ? `${r.alturaGps ? '' : '≈ '}${metros(r.altMax)}` : '—'],
      [t('bit.distancia'), distTxt(r.distancia)],
      [t('bit.tiempo'), durTxt(r.duracion)],
      [t('bit.subida'), r.subida ? `+${metros(r.subida)}` : '—'],
    ];
    const cw = (PW - 2 * MARGEN) / 4;
    datos.forEach(([k, v], i) => {
      ctx.fillStyle = C.gris; ctx.font = '700 24px "Atkinson Hyperlegible"'; ctx.fillText(k, MARGEN + i * cw, y);
      ctx.fillStyle = C.verde; ajustar(ctx, v, cw - 24, 50, '800 {px}px "Bricolage Grotesque"'); ctx.fillText(v, MARGEN + i * cw, y + 58);
      p.textos.push(`${k}: ${v}`);
    });
    y += 110;
    const perf = bit.perfil();
    if (perf.length > 1) {
      const gw = PW - 2 * MARGEN, gh = PH - y - 150, xs = perf.map((q) => q.x), ys = perf.map((q) => q.y);
      const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs) || 1, Math.min(...ys), Math.max(...ys)];
      const GX = (v) => MARGEN + (v - x0) / ((x1 - x0) || 1) * gw, GY = (v) => y + gh - (v - y0) / ((y1 - y0) || 1) * (gh - 30);
      ctx.fillStyle = 'rgba(47,107,79,.18)'; ctx.beginPath(); ctx.moveTo(GX(x0), y + gh);
      perf.forEach((q) => ctx.lineTo(GX(q.x), GY(q.y))); ctx.lineTo(GX(perf[perf.length - 1].x), y + gh); ctx.fill();
      ctx.strokeStyle = C.verde; ctx.lineWidth = 5; ctx.beginPath(); perf.forEach((q, i) => (i ? ctx.lineTo(GX(q.x), GY(q.y)) : ctx.moveTo(GX(q.x), GY(q.y)))); ctx.stroke();
      ctx.fillStyle = C.gris; ctx.font = '400 22px "Atkinson Hyperlegible"';
      ctx.fillText(metros(y1), MARGEN + 8, y + 22); ctx.fillText(metros(y0), MARGEN + 8, y + gh - 8);
      p.textos.push(t('pdf.perfil', { min: metros(y0), max: metros(y1) }));
    }
  }
  pie(p, n);
  return p;
}

// ---------- Certificado ----------
async function certificado(n) {
  const p = pagina(), { ctx } = p, completo = pegados() >= total();
  ctx.strokeStyle = C.verde; ctx.lineWidth = 10; ctx.strokeRect(60, 60, PW - 120, PH - 120);
  ctx.strokeStyle = C.amarillo; ctx.lineWidth = 4; ctx.strokeRect(84, 84, PW - 168, PH - 168);
  ctx.drawImage(await svgImg(personajes.fray(100)), PW / 2 - 150, 170, 300, 330);
  ctx.textAlign = 'center';
  ctx.fillStyle = C.gris; ctx.font = '700 34px "Atkinson Hyperlegible"'; ctx.fillText(t('pdf.certificado'), PW / 2, 580);
  ctx.fillStyle = C.verde; ajustar(ctx, t('pdf.guardian'), PW - 300, 112, '800 {px}px "Bricolage Grotesque"'); ctx.fillText(t('pdf.guardian'), PW / 2, 700);
  ctx.fillStyle = C.gris; ctx.font = '400 34px "Atkinson Hyperlegible"'; ctx.fillText(t('pdf.otorga'), PW / 2, 800);
  ctx.fillStyle = C.noche; ajustar(ctx, E.nombre || '—', PW - 300, 90, '800 {px}px "Bricolage Grotesque"'); ctx.fillText(E.nombre || '—', PW / 2, 910);
  ctx.fillStyle = C.noche; ctx.font = '400 36px "Atkinson Hyperlegible"';
  const motivo = t(completo ? 'pdf.motivoCompleto' : 'pdf.motivo', { n: pegados(), t: total() });
  const lineasTxt = (s, y) => { const pal = s.split(' '); let l = ''; for (const w of pal) { const pr = l ? `${l} ${w}` : w; if (ctx.measureText(pr).width > PW - 300 && l) { ctx.fillText(l, PW / 2, y); y += 50; l = w; } else l = pr; } if (l) ctx.fillText(l, PW / 2, y); return y + 50; };
  let y = lineasTxt(motivo, 1010);
  ctx.fillStyle = C.gris; ctx.font = '400 30px "Atkinson Hyperlegible"'; ctx.fillText(fechaLarga(), PW / 2, y + 30);
  // Firma del guía (a mano, sobre el papel impreso)
  ctx.strokeStyle = C.noche; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(PW / 2 - 260, 1420); ctx.lineTo(PW / 2 + 260, 1420); ctx.stroke();
  ctx.fillStyle = C.gris; ctx.font = '400 26px "Atkinson Hyperlegible"'; ctx.fillText(t('pdf.firmaGuia'), PW / 2, 1460);
  ctx.font = '400 20px "Atkinson Hyperlegible"'; ctx.fillText(t('pdf.noOficial'), PW / 2, PH - 120);
  ctx.textAlign = 'left';
  p.textos.push(t('pdf.certificado'), t('pdf.guardian'), t('pdf.otorga'), E.nombre || '', motivo, fechaLarga(), t('pdf.firmaGuia'), t('pdf.noOficial'));
  pie(p, n);
  return p;
}

// ---------- Fuentes y créditos ----------
async function creditos(n) {
  const p = pagina(), { ctx } = p;
  encabezado(p, t('pdf.fuentes'), t('pdf.fuentesSub'));
  let y = 330;
  const bloque = (titulo, items) => {
    ctx.fillStyle = C.verde; ctx.font = '800 38px "Bricolage Grotesque"'; ctx.fillText(titulo, MARGEN, y); y += 50; p.textos.push(titulo);
    for (const [a, b] of items) {
      ctx.fillStyle = C.noche; ctx.font = '700 26px "Atkinson Hyperlegible"'; y = lineas(ctx, a, MARGEN, y, PW - 2 * MARGEN, 34, 3);
      if (b) { ctx.fillStyle = C.gris; ctx.font = '400 20px "Atkinson Hyperlegible"'; y = (/\s/.test(b) ? lineas : cortar)(ctx, b, MARGEN, y, PW - 2 * MARGEN, 26, 3); }
      p.textos.push(a); if (b) p.textos.push(b);
      y += 16;
    }
    y += 24;
  };
  bloque(t('pdf.datos'), Object.values(E.paquete.fuentes || {}).map((f) => [f.titulo, f.url || '']));
  const rel = await (await import('./relieve.js')).cargar();
  if (rel) bloque(t('pdf.relieveTit'), [[rel.meta.atribucion, rel.meta.descargo || '']]);
  bloque(t('pdf.hecho'), [[t('pdf.ilustraciones'), ''], [t('pdf.privado'), '']]);
  pie(p, n);
  return p;
}

// ---------- Escritor de PDF mínimo: páginas A4 con una imagen JPEG y texto invisible ----------
const WIN = { '€': 0x80, '‚': 0x82, '„': 0x84, '…': 0x85, '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97, '™': 0x99 };
function cadenaPDF(s) {
  let o = '';
  for (const ch of String(s).normalize('NFC')) {
    let c = WIN[ch] ?? ch.codePointAt(0);
    if (c > 255) c = ch === '≈' ? 0x7e : 0x3f; // fuera de WinAnsi: ≈ → ~, el resto → ?
    const b = String.fromCharCode(c);
    o += b === '(' || b === ')' || b === '\\' ? `\\${b}` : b;
  }
  return `(${o})`;
}
export function armarPDF(paginas, { titulo = '' } = {}) {
  const A4W = 595.28, A4H = 841.89;
  const bytes = (s) => { const a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i) & 255; return a; };
  const partes = [], ofs = []; let pos = 0;
  const put = (x) => { const b = typeof x === 'string' ? bytes(x) : x; partes.push(b); pos += b.length; };
  const obj = (id, dict, stream) => {
    ofs[id] = pos;
    put(`${id} 0 obj\n${dict}\n`);
    if (stream) { put('stream\n'); put(stream); put('\nendstream\n'); }
    put('endobj\n');
  };
  put('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
  const n = paginas.length, kids = paginas.map((_, i) => `${5 + i * 3} 0 R`).join(' ');
  obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
  obj(2, `<< /Type /Pages /Count ${n} /Kids [${kids}] >>`);
  obj(3, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  obj(4, `<< /Title ${cadenaPDF(titulo)} /Producer ${cadenaPDF('Album del Paramo')} /CreationDate (D:${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}Z) >>`);
  paginas.forEach((pg, i) => {
    const id = 5 + i * 3;
    let txt = 'BT 3 Tr /F1 9 Tf 11 TL 36 805 Td\n';
    for (const s of pg.textos) txt += `${cadenaPDF(s)} Tj T*\n`;
    txt += 'ET\n';
    const contenido = bytes(`q ${A4W} 0 0 ${A4H} 0 0 cm /Im0 Do Q\n${txt}`);
    obj(id, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4W} ${A4H}] /Resources << /XObject << /Im0 ${id + 2} 0 R >> /Font << /F1 3 0 R >> >> /Contents ${id + 1} 0 R >>`);
    obj(id + 1, `<< /Length ${contenido.length} >>`, contenido);
    obj(id + 2, `<< /Type /XObject /Subtype /Image /Width ${pg.w} /Height ${pg.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${pg.jpeg.length} >>`, pg.jpeg);
  });
  const total = 5 + n * 3, xref = pos;
  let tabla = `xref\n0 ${total}\n0000000000 65535 f \n`;
  for (let i = 1; i < total; i++) tabla += `${String(ofs[i]).padStart(10, '0')} 00000 n \n`;
  put(tabla);
  put(`trailer\n<< /Size ${total} /Root 1 0 R /Info 4 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  return new Blob(partes, { type: 'application/pdf' });
}

// Genera el PDF completo. alAvanzar(f) recibe el avance (0–1) para mostrarlo.
export async function albumPDF({ alAvanzar = () => {} } = {}) {
  await fuentes();
  const fotos = await fotosDelVisitante();
  const caps = capitulos();
  const pasos = [
    () => portada(),
    ...caps.map((k, i) => () => paginaCapitulo(k, i + 2)),
    ...(fotos.length ? [() => paginaCollage(fotos, caps.length + 2)] : []),
  ];
  pasos.push(() => paginaRecorrido(pasos.length + 1));
  pasos.push(() => certificado(pasos.length + 1));
  pasos.push(() => creditos(pasos.length + 1));
  const listas = [];
  for (let i = 0; i < pasos.length; i++) {
    const p = await pasos[i]();
    const blob = await new Promise((ok) => p.cv.toBlob(ok, 'image/jpeg', 0.84));
    listas.push({ jpeg: new Uint8Array(await blob.arrayBuffer()), w: PW, h: PH, textos: p.textos.filter(Boolean) });
    p.cv.width = p.cv.height = 0; // libera memoria del lienzo (importante en iPhone)
    alAvanzar((i + 1) / pasos.length);
    await new Promise((ok) => setTimeout(ok, 0)); // deja respirar la pantalla
  }
  return armarPDF(listas, { titulo: `${t('titulo')}${E.nombre ? ` · ${E.nombre}` : ''}` });
}

// Entrega un archivo: en iPhone con la hoja de compartir (Safari no guarda descargas de forma confiable);
// si no se puede, como descarga.
export async function entregar(blob, nombre) {
  const iOS = /iPhone|iPad|iPod/i.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
  if (iOS && navigator.canShare) {
    const f = new File([blob], nombre, { type: blob.type });
    if (navigator.canShare({ files: [f] })) {
      try { await navigator.share({ files: [f], title: t('titulo') }); return 'compartido'; }
      catch (e) { if (e.name === 'AbortError') return 'cancelado'; }
    }
  }
  descargar(blob, nombre);
  return 'descargado';
}

// Botones «Descargar mi álbum (PDF)» y «Collage»: muestran el avance en el mismo botón y no se pueden tocar dos veces
const nombreArchivo = (ext) => `album-del-paramo${E.nombre ? `-${E.nombre.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}` : ''}.${ext}`;
export async function botonPDF(btn) {
  if (btn.disabled) return;
  const antes = btn.textContent; btn.disabled = true; btn.setAttribute('aria-busy', 'true');
  try {
    const pdf = await albumPDF({ alAvanzar: (f) => { btn.textContent = t('pdf.armando', { p: Math.round(f * 100) }); } });
    await entregar(pdf, nombreArchivo('pdf'));
  } catch (e) { console.error(e); btn.textContent = t('pdf.error'); setTimeout(() => (btn.textContent = antes), 3000); return; }
  finally { btn.disabled = false; btn.removeAttribute('aria-busy'); }
  btn.textContent = antes;
}
export async function botonCollage(btn) {
  if (btn.disabled) return;
  btn.disabled = true;
  try {
    const img = await collageImagen();
    if (img) await entregar(img, nombreArchivo('jpg').replace('album-del-paramo', 'collage-del-paramo'));
  } catch (e) { console.error(e); } finally { btn.disabled = false; }
}
export const hayFotos = async () => (await fotosDelVisitante()).length > 0;
