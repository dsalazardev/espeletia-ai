// Componente de cromo: frente (foto o ilustración, número, nombre, sello) y dorso (dato oficial).
// Se dibuja con HTML/CSS y escala con container queries: el mismo cromo sirve en el álbum y en grande.
import { E, texto, cromo as getCromo, fotoURL, estacion, capitulos } from './estado.js';
import { ilustracion } from './art.js';
import { t } from './i18n.js';
import { esc, h } from './util.js';

const MESES = { es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'], en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] };
export function fecha(ms) {
  const d = new Date(ms);
  return `${d.getDate()} ${MESES[E.lang][d.getMonth()]} ${d.getFullYear()}`;
}
export function alturaTxt(r) {
  if (!r?.altura) return t('sello.paramo');
  return `${Math.round(r.altura).toLocaleString(E.lang === 'es' ? 'es-CO' : 'en-US')} m`;
}
export const num = (n) => String(n).padStart(2, '0');

export async function cromoEl(id, { tapado = false, mini = false } = {}) {
  const c = getCromo(id);
  const r = E.album[id];
  const tx = texto(c);
  const foto = r?.foto ? await fotoURL(id, { mini }) : null;
  const est = r?.estacion ? estacion(r.estacion) : null;
  const cap = capitulos().find((k) => k.id === c.capitulo);
  const fuente = c.fuente ? E.paquete.fuentes[c.fuente] : null;
  const el = h(`
    <article class="cromo cap-${c.capitulo}${c.brillante ? ' brillante' : ''}${tapado ? ' tapado' : ''}" data-id="${c.id}">
      <div class="cromo-giro">
        <div class="cara frente">
          <div class="cromo-imagen">${foto ? `<img src="${foto}" alt="" decoding="async">` : ilustracion(c.id)}</div>
          <span class="cromo-num">${num(c.n)}</span>
          <span class="cromo-nombre">${esc(tx.nombre)}</span>
          ${r ? `<span class="cromo-sello"><b>${esc(alturaTxt(r))}</b><i>${esc(fecha(r.fecha))}</i></span>` : ''}
          ${c.brillante ? '<span class="holo" aria-hidden="true"></span>' : ''}
        </div>
        <div class="cara dorso">
          <div class="dorso-patron" aria-hidden="true"></div>
          <div class="dorso-texto">
            <p class="dorso-cab"><b>${num(c.n)}</b> ${esc(cap ? cap[E.lang] : '')}</p>
            <h3>${esc(tx.nombre)}</h3>
            <p class="dorso-et">${t('det.datoOficial')}</p>
            <p class="dorso-dato">${esc(tx.dato)}</p>
            ${fuente ? `<p class="dorso-fuente">${esc(t('det.fuente', { f: fuente.titulo }))}${insigniaPaquete()}</p>` : ''}
            <p class="dorso-meta">${esc([est?.nombre, r ? fecha(r.fecha) : null, E.nombre ? t('de', { nombre: E.nombre }) : null].filter(Boolean).join(' — '))}</p>
          </div>
        </div>
      </div>
    </article>`);
  el.setAttribute('aria-label', `${num(c.n)}. ${tx.nombre}. ${tx.dato}`);
  return el;
}

// Brillo holográfico que sigue el dedo o la inclinación del celular.
export function activarBrillo(el) {
  if (!el.classList.contains('brillante')) return () => {};
  const mover = (x, y) => { el.style.setProperty('--hx', `${x * 100}%`); el.style.setProperty('--hy', `${y * 100}%`); el.style.setProperty('--rx', `${(y - 0.5) * -10}deg`); el.style.setProperty('--ry', `${(x - 0.5) * 12}deg`); };
  const onPtr = (e) => { const b = el.getBoundingClientRect(); mover((e.clientX - b.left) / b.width, (e.clientY - b.top) / b.height); };
  const onOri = (e) => { if (e.gamma == null) return; mover(Math.min(1, Math.max(0, 0.5 + e.gamma / 60)), Math.min(1, Math.max(0, 0.5 + (e.beta - 45) / 60))); };
  el.addEventListener('pointermove', onPtr);
  addEventListener('deviceorientation', onOri);
  return () => { el.removeEventListener('pointermove', onPtr); removeEventListener('deviceorientation', onOri); };
}

// Insignia de estado del dato del cromo: por cromo si R1 lo marca; si no, el del paquete (hoy, borrador)
function insigniaPaquete() {
  const nota = E.paquete?.estado?.[E.lang] || E.paquete?.estado?.es || '';
  const estado = /^(Borrador|Draft)/i.test(nota) ? 'borrador' : nota ? 'validado' : null;
  if (!estado) return '';
  return ` <span class="insignia insignia-${estado}" title="${esc(nota)}"><span aria-hidden="true">${esc(t(`estado.${estado}`))}</span><span class="sr-only">${esc(t(`estado.${estado}Largo`))}</span></span>`;
}

