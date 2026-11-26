// Abrir sobres: el sobre se rasga, el cromo sale, se voltea y vuela a su espacio en el álbum.
import { E, cromo as getCromo, texto, pendientes, abrir } from './estado.js';
import { t } from './i18n.js';
import { $, h, esc, animar, esperar, vibrar, hablar, reducido, atraparFoco, escuchar, quitarAviso } from './util.js';
import { cromoEl, activarBrillo } from './cromo.js';
import { irPagina, paginaDe, ranuraDe, esperarPintado } from './album.js';
import { chispas } from './celebrar.js';

let abriendo = false;
let nav = () => {};
let preguntar = () => {};
export function iniciarSobres({ irA, preguntar: pr }) { nav = irA; if (pr) preguntar = pr; }

export async function abrirSobres() {
  if (abriendo) return;
  abriendo = true;
  quitarAviso();
  try {
    while (pendientes().length) {
      const id = pendientes()[0];
      const seguir = await revelar(id, pendientes().length - 1);
      // «Pregúntale a Fray»: el cromo ya quedó pegado; los demás sobres esperan en el álbum
      if (seguir === 'preguntar') { abriendo = false; await preguntar(id); break; }
      if (!seguir) break;
    }
  } finally { abriendo = false; }
}

function sobreHTML(c) {
  return h(`<div class="sobre cap-${c.capitulo}${c.brillante ? ' sobre-brillante' : ''}">
      <div class="sobre-cuerpo">
        <div class="sobre-arte" aria-hidden="true"></div>
        <p class="sobre-marca">${esc(t('titulo'))}</p>
        <p class="sobre-nombre">${esc(t('sobre.titulo'))}</p>
        <p class="sobre-parque">${esc(t('parque'))}</p>
      </div>
      <div class="sobre-tira" aria-hidden="true"><span></span></div>
    </div>`);
}

// Devuelve true si el visitante quiere seguir abriendo, false si cerró.
async function revelar(id, quedan) {
  const c = getCromo(id), tx = texto(c);
  const capa = $('#capa-sobre');
  capa.innerHTML = '';
  capa.hidden = false;
  const escena = h(`<div class="sobre-escena">
      <p class="sobre-titulo" aria-live="polite">${esc(t('sobre.rasgar'))}</p>
      <div class="sobre-mesa"></div>
      <div class="sobre-acciones" hidden>
        <button class="btn btn-flor" data-a="pegar">${esc(t('sobre.pegar'))}</button>
        <button class="btn btn-claro" data-a="escuchar">${esc(t('det.escuchar'))}</button>
        ${c.ficha ? `<button class="btn btn-claro" data-a="preguntar">${esc(t('sobre.preguntar'))}</button>` : ''}
      </div>
      <p class="sobre-quedan">${quedan > 0 ? esc(t('sobre.quedan', { n: quedan })) : ''}</p>
    </div>`);
  capa.appendChild(escena);
  const soltar = atraparFoco(capa);
  const mesa = $('.sobre-mesa', escena);
  const sobre = sobreHTML(c);
  const card = await cromoEl(id, { tapado: true });
  card.classList.add('grande', 'volteado', 'saliendo');
  mesa.append(card, sobre);

  await animar(sobre, [{ transform: 'translateY(60vh) rotate(-8deg)', opacity: 0 }, { transform: 'translateY(0) rotate(-2deg)', opacity: 1 }], { duration: 520, easing: 'cubic-bezier(.2,.9,.25,1.1)', fill: 'forwards' });
  if (!reducido()) animar(sobre, [{ transform: 'rotate(-2deg)' }, { transform: 'rotate(1.5deg)' }, { transform: 'rotate(-2deg)' }], { duration: 1600, iterations: Infinity, easing: 'ease-in-out' });

  // Esperar el gesto: deslizar sobre la tira o tocar el sobre (o Enter)
  sobre.tabIndex = 0; sobre.setAttribute('role', 'button'); sobre.setAttribute('aria-label', t('sobre.rasgar'));
  sobre.focus({ preventScroll: true });
  await new Promise((ok) => {
    // Tocar o deslizar: ambos abren (deslizar se siente como rasgar).
    const listo = () => { sobre.onpointerup = sobre.onkeydown = null; ok(); };
    sobre.onpointerup = listo;
    sobre.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); listo(); } };
  });
  sobre.getAnimations().forEach((a) => a.cancel());
  vibrar([30, 30, 60]);

  // Rasgar: la tira sale volando, el sobre baja y el cromo sube.
  const tira = $('.sobre-tira', sobre);
  animar(tira, [{ transform: 'translate(0,0) rotate(0)', opacity: 1 }, { transform: 'translate(120px,-140px) rotate(28deg)', opacity: 0 }], { duration: 520, easing: 'cubic-bezier(.3,.6,.4,1)', fill: 'forwards' });
  await esperar(120);
  card.classList.add('fuera');
  await Promise.all([
    animar(card, [{ transform: 'translateY(26%)' }, { transform: 'translateY(-34%)' }], { duration: 540, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' }),
    animar(sobre, [{ transform: 'translateY(0) rotate(-2deg)' }, { transform: 'translateY(8%) rotate(-2deg)' }], { duration: 540, fill: 'forwards' }),
  ]);
  await Promise.all([
    animar(sobre, [{ transform: 'translateY(8%) rotate(-2deg)', opacity: 1 }, { transform: 'translateY(90vh) rotate(10deg)', opacity: 0 }], { duration: 480, easing: 'cubic-bezier(.6,0,.8,.4)', fill: 'forwards' }),
    animar(card, [{ transform: 'translateY(-34%)' }, { transform: 'translateY(0)' }], { duration: 480, easing: 'cubic-bezier(.3,1.3,.5,1)', fill: 'forwards' }),
  ]);
  sobre.remove();

  // Voltear para ver el frente
  card.classList.remove('tapado');
  await esperar(40);
  card.classList.remove('volteado');
  await esperar(reducido() ? 0 : 620);
  vibrar(c.brillante ? [40, 50, 40, 50, 90] : 50);
  const quitarBrillo = activarBrillo(card);
  const titulo = $('.sobre-titulo', escena);
  titulo.textContent = c.brillante ? t('sobre.brillante') : t('sobre.nuevo');
  titulo.classList.add('grande');
  if (c.brillante) chispas(card);
  escuchar({ texto: `${tx.nombre}. ${tx.dato}`, textoAudio: tx.dato, lang: E.lang, tipo: 'cromo', id: c.id, silencioso: true });
  const acc = $('.sobre-acciones', escena);
  acc.hidden = false;
  animar(acc, [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 260 });
  card.onclick = () => card.classList.toggle('volteado');
  acc.querySelector('[data-a="escuchar"]').onclick = () => escuchar({ texto: `${tx.nombre}. ${tx.dato}`, textoAudio: tx.dato, lang: E.lang, tipo: 'cromo', id: c.id });
  acc.querySelector('[data-a="pegar"]').focus({ preventScroll: true });

  const eleccion = await new Promise((ok) => {
    acc.querySelector('[data-a="pegar"]').onclick = () => ok('pegar');
    const pr = acc.querySelector('[data-a="preguntar"]');
    if (pr) pr.onclick = () => ok('preguntar');
  });
  quitarBrillo();
  card.classList.remove('volteado');
  acc.hidden = true; titulo.textContent = '';

  // Volar al espacio del álbum
  await pegarEnAlbum(id, card, capa);
  soltar();
  capa.hidden = true;
  capa.innerHTML = '';
  return eleccion === 'preguntar' ? 'preguntar' : true;
}

async function pegarEnAlbum(id, card, capa) {
  const desde = card.getBoundingClientRect();
  nav('album');
  await irPagina(paginaDe(id), { sinAnimar: true });
  await esperarPintado();
  const ranura = ranuraDe(id);
  if (!ranura || reducido()) { await abrir(id); return; }
  ranura.scrollIntoView({ block: 'center', behavior: 'instant' });
  const hasta = ranura.getBoundingClientRect();
  // El cromo queda en la capa (que ya es transparente) y vuela sobre el álbum.
  capa.classList.add('volando');
  card.style.position = 'fixed';
  card.style.left = `${desde.left}px`; card.style.top = `${desde.top}px`;
  card.style.width = `${desde.width}px`; card.style.margin = '0';
  card.style.transformOrigin = '0 0';
  const s = hasta.width / desde.width;
  await animar(card, [
    { transform: 'translate(0,0) scale(1) rotate(0deg)' },
    { transform: `translate(${(hasta.left - desde.left) * 0.5}px, ${(hasta.top - desde.top) * 0.5 - 60}px) scale(${(1 + s) / 2}) rotate(-6deg)`, offset: 0.55 },
    { transform: `translate(${hasta.left - desde.left}px, ${hasta.top - desde.top}px) scale(${s}) rotate(0deg)` },
  ], { duration: 720, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'forwards' });
  await abrir(id); // re-pinta la página con el cromo pegado
  await esperarPintado();
  capa.classList.remove('volando');
  const nueva = ranuraDe(id);
  if (nueva) {
    nueva.classList.add('recien');
    vibrar(35);
    await animar(nueva, [{ transform: 'scale(1.08)' }, { transform: 'scale(.97)' }, { transform: 'scale(1)' }], { duration: 360, easing: 'ease-out' });
    setTimeout(() => nueva.classList.remove('recien'), 1400);
  }
}
