// El álbum: páginas por capítulo, espacios para pegar, índice al borde y detalle de cada cromo.
import { E, bus, cromo as getCromo, cromosDe, capitulos, texto, abierto, tiene, pegados, total, pendientes, bloqueo, estacion, estaciones, nombreClase, capituloCompleto, ganar } from './estado.js';
import { t, traducir } from './i18n.js';
import { $, $$, h, esc, animar, reducido, aviso, hablar, distancia, fmtDist, atraparFoco, vibrar, escuchar } from './util.js';
import { ilustracion } from './art.js';
import { cromoEl, activarBrillo, num } from './cromo.js';
import { cromoPNG, descargar } from './exportar.js';
import { formCodigo } from './guia.js';

let pagina = 0;            // índice del capítulo visible
let nav = () => {};         // función para cambiar de vista (la pone app.js)
let accionesExtra = {};     // { abrirLente, pedirFoto, pausa, mapa }

export function iniciarAlbum({ irA, acciones }) {
  nav = irA; accionesExtra = acciones;
  pintarIndice();
  pintarPagina(pagina, { sinAnimar: true });
  pintarCabezote();
  bus.addEventListener('cambio', () => { pintarCabezote(); refrescarPagina(); });
  bus.addEventListener('posicion', () => pintarPista());
  // Deslizar para pasar página
  let x0 = null, y0 = null;
  const pags = $('#paginas');
  pags.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  pags.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) irPagina(pagina + (dx < 0 ? 1 : -1));
    x0 = null;
  });
  $('#btn-sobres').onclick = () => accionesExtra.abrirSobres();
}

export function pintarCabezote() {
  const n = pegados();
  $('#cuenta-n').textContent = n;
  $('#cuenta-t').textContent = total();
  $('#barra').style.width = `${(n / total()) * 100}%`;
  $('#album-dueno').textContent = E.nombre ? t('de', { nombre: E.nombre }) : t('parque');
  const p = pendientes().length;
  const b = $('#btn-sobres');
  b.hidden = p === 0;
  $('#sobres-txt').textContent = t('album.sobres', { n: p });
  const badge = $('#muelle-badge');
  badge.hidden = p === 0; badge.textContent = p;
  pintarPista();
  $$('#indice button').forEach((btn, i) => btn.classList.toggle('completo', capituloCompleto(capitulos()[i].id)));
}

function pintarPista() {
  const el = $('#pista');
  el.onclick = null; el.classList.remove('accion');
  if (pegados() === total()) { el.textContent = t('pista.fin'); return; }
  // 1) Estación más cercana sin visitar
  const libres = estaciones().filter((e) => { const c = E.paquete.cromos.find((k) => k.tipo === 'gps' && k.estacion === e.id); return c && !tiene(c.id); });
  if (libres.length) {
    if (E.posicion) {
      const cerca = libres.map((e) => ({ e, d: distancia(E.posicion, e) })).sort((a, b) => a.d - b.d)[0];
      if (cerca.d < 8000) { el.textContent = t('pista.estacion', { est: cerca.e.nombre, d: fmtDist(cerca.d, E.lang) }); irAlMapa(el); return; }
    }
  }
  // 2) Algo para la Lente
  const cam = E.paquete.cromos.find((c) => c.tipo === 'camara' && !tiene(c.id) && !bloqueo(c));
  const pag = capitulos()[pagina]?.id;
  if (pag === 'fauna' && E.paquete.cromos.some((c) => c.tipo === 'qr' && !tiene(c.id))) { el.textContent = t('pista.qr'); return; }
  if (pag === 'historias' && E.paquete.cromos.some((c) => c.tipo === 'guia' && !tiene(c.id))) { el.textContent = t('pista.guia'); return; }
  if (libres.length && !E.posicion) { el.textContent = t('pista.estacionSinGps', { est: libres[0].nombre }); irAlMapa(el); return; }
  if (cam) { el.textContent = t('pista.lente', { cosa: nombreClase(cam.clase).toLowerCase() }); return; }
  // Lo que quede: solo se sugiere lo que de verdad falta (antes decía «busca QR» aunque ya estuvieran todos)
  const falta = (tipo) => E.paquete.cromos.some((c) => c.tipo === tipo && !tiene(c.id));
  if (falta('qr')) el.textContent = t('pista.qr');
  else if (falta('guia')) el.textContent = t('pista.guia');
  else if (libres.length) { el.textContent = t('pista.estacionSinGps', { est: libres[0].nombre }); irAlMapa(el); }
  else el.textContent = t('pista.resto');
}

function irAlMapa(el) { el.classList.add('accion'); el.onclick = () => nav('mapa'); }

function pintarIndice() {
  const ind = $('#indice');
  ind.innerHTML = '';
  capitulos().forEach((k, i) => {
    const b = h(`<button class="pestana cap-${k.id}" aria-label="${esc(k.num + '. ' + k[E.lang])}"><span>${esc(k.num)}</span></button>`);
    if (i === pagina) b.setAttribute('aria-current', 'page');
    b.onclick = () => irPagina(i);
    ind.appendChild(b);
  });
}

async function construirPagina(i) {
  const k = capitulos()[i];
  const lista = cromosDe(k.id);
  const hechos = lista.filter((c) => abierto(c.id)).length;
  const pag = h(`<div class="pagina cap-${k.id}" data-cap="${k.id}">
      <header class="pagina-cab">
        <span class="pagina-num">${esc(k.num)}</span>
        <h2>${esc(k[E.lang])}</h2>
        <span class="pagina-cuenta">${hechos}/${lista.length}</span>
      </header>
      <div class="ranuras"></div>
      ${hechos === lista.length ? `<p class="pagina-completa">${esc(t('album.capCompleto'))}</p>` : ''}
      <footer class="pagina-pie"><span>${esc(t('parque'))}</span><span>${i + 1}</span></footer>
    </div>`);
  const ran = $('.ranuras', pag);
  for (const c of lista) ran.appendChild(await ranura(c));
  return pag;
}

async function ranura(c) {
  const tx = texto(c);
  const b = h(`<button class="ranura" data-id="${c.id}"></button>`);
  if (abierto(c.id)) {
    b.classList.add('llena');
    b.appendChild(await cromoEl(c.id, { mini: true }));
  } else {
    const bl = bloqueo(c);
    const enSobre = tiene(c.id);
    b.innerHTML = `${ilustracion(c.id, { silueta: true })}
      <span class="ranura-num">${num(c.n)}</span>
      <span class="ranura-como">${esc(enSobre ? t('sobre.titulo') : t(`tipo.${c.tipo}`))}</span>`;
    if (enSobre) b.classList.add('en-sobre');
    if (bl) b.classList.add('bloqueada');
  }
  b.onclick = () => (tiene(c.id) && !abierto(c.id) ? accionesExtra.abrirSobres() : abrirDetalle(c.id));
  return b;
}

let pintando = Promise.resolve();
export function pintarPagina(i, { direccion = 0, sinAnimar = false } = {}) {
  pintando = pintando.then(async () => {
    const cont = $('#paginas');
    const nueva = await construirPagina(i);
    const vieja = cont.querySelector('.pagina');
    if (!vieja || sinAnimar || reducido() || direccion === 0) {
      cont.replaceChildren(nueva);
      return;
    }
    // Pasar la hoja: la página de arriba gira sobre el lomo (izquierda).
    nueva.classList.add('debajo');
    if (direccion > 0) {
      cont.insertBefore(nueva, vieja);
      vieja.classList.add('girando');
      await animar(vieja, [
        { transform: 'perspective(1400px) rotateY(0deg)', filter: 'brightness(1)' },
        { transform: 'perspective(1400px) rotateY(-100deg)', filter: 'brightness(.78)' },
      ], { duration: 560, easing: 'cubic-bezier(.45,.05,.3,1)', fill: 'forwards' });
      vieja.remove();
    } else {
      cont.appendChild(nueva);
      nueva.classList.remove('debajo'); nueva.classList.add('girando');
      await animar(nueva, [
        { transform: 'perspective(1400px) rotateY(-100deg)', filter: 'brightness(.78)' },
        { transform: 'perspective(1400px) rotateY(0deg)', filter: 'brightness(1)' },
      ], { duration: 560, easing: 'cubic-bezier(.45,.05,.3,1)' });
      vieja.remove();
    }
    nueva.classList.remove('debajo', 'girando');
  });
  return pintando;
}

function refrescarPagina() { pintarPagina(pagina, { sinAnimar: true }); }

export async function irPagina(i, { sinAnimar = false } = {}) {
  const n = capitulos().length;
  if (i < 0 || i >= n) return;
  if (i === pagina) return pintando;
  const dir = i > pagina ? 1 : -1;
  pagina = i;
  $$('#indice button').forEach((b, j) => (j === i ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current')));
  vibrar(15);
  pintarPista();
  return pintarPagina(i, { direccion: dir, sinAnimar });
}

export function paginaDe(id) { return capitulos().findIndex((k) => k.id === getCromo(id).capitulo); }
export function ranuraDe(id) { return $(`#paginas .ranura[data-id="${id}"]`); }
export const esperarPintado = () => pintando;

// ---------- Detalle ----------
let soltarFoco = null;
export async function abrirDetalle(id) {
  const c = getCromo(id), tx = texto(c), capa = $('#capa-detalle');
  const lleno = abierto(id);
  capa.innerHTML = '';
  const caja = h(`<div class="detalle"><button class="cerrar-x" aria-label="${esc(t('det.cerrar'))}">×</button></div>`);
  capa.appendChild(caja);
  if (lleno) {
    const card = await cromoEl(id);
    card.classList.add('grande');
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    const voltear = () => { card.classList.toggle('volteado'); vibrar(10); };
    card.onclick = voltear;
    card.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); voltear(); } };
    caja.appendChild(card);
    const quitar = activarBrillo(card);
    caja.appendChild(h(`<p class="detalle-nota">${esc(t('det.tocaVoltear'))}</p>`));
    const acc = h(`<div class="acciones acciones-detalle">
      <button class="btn btn-flor" data-a="guardar">${esc(t('det.guardar'))}</button>
      <button class="btn btn-linea" data-a="compartir">${esc(t('det.compartir'))}</button>
      <button class="btn btn-linea" data-a="escuchar">${esc(t('det.escuchar'))}</button>
      ${c.ficha ? `<button class="btn btn-linea" data-a="preguntar">${esc(t('det.preguntar'))}</button>` : ''}
      ${['gps', 'qr', 'guia', 'contemplacion', 'aclimatacion', 'camara'].includes(c.tipo) ? `<button class="btn btn-linea" data-a="foto">${esc(t('det.foto'))}</button>` : ''}
    </div>`);
    caja.appendChild(acc);
    acc.querySelector('[data-a="guardar"]').onclick = async () => { descargar(await cromoPNG(id), `cromo-${num(c.n)}-${id}.png`); aviso(t('det.guardado')); };
    acc.querySelector('[data-a="compartir"]').onclick = () => compartir(id);
    acc.querySelector('[data-a="escuchar"]').onclick = () => escuchar({ texto: `${tx.nombre}. ${tx.dato}`, textoAudio: tx.dato, lang: E.lang, tipo: 'cromo', id: c.id });
    const pr = acc.querySelector('[data-a="preguntar"]');
    if (pr) pr.onclick = () => { cerrarDetalle(); accionesExtra.preguntar(id); };
    const bf = acc.querySelector('[data-a="foto"]');
    if (bf) bf.onclick = () => { cerrarDetalle(); accionesExtra.pedirFoto(id, t('lente.fotoCromo', { nombre: tx.nombre })); };
    capa._quitar = quitar;
  } else {
    caja.appendChild(await comoConseguir(c));
  }
  caja.querySelector('.cerrar-x').onclick = cerrarDetalle;
  capa.onclick = (e) => { if (e.target === capa) cerrarDetalle(); };
  capa.hidden = false;
  soltarFoco = atraparFoco(capa);
  document.addEventListener('keydown', escDetalle);
  animar(caja, [{ transform: 'translateY(30px) scale(.96)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 260, easing: 'cubic-bezier(.2,.9,.3,1.2)' });
  (caja.querySelector('.cromo') || caja.querySelector('input, .btn') || caja.querySelector('.cerrar-x')).focus({ preventScroll: true });
}
function escDetalle(e) { if (e.key === 'Escape') cerrarDetalle(); }
export function cerrarDetalle() {
  const capa = $('#capa-detalle');
  if (capa.hidden) return;
  capa._quitar && capa._quitar();
  capa.hidden = true; capa.innerHTML = '';
  soltarFoco && soltarFoco();
  document.removeEventListener('keydown', escDetalle);
}

async function comoConseguir(c) {
  const tx = texto(c);
  const bl = bloqueo(c);
  const box = h(`<div class="como">
      <div class="como-ilus">${ilustracion(c.id, { silueta: true })}<span class="ranura-num">${num(c.n)}</span></div>
      <p class="como-tipo">${esc(t(`tipo.${c.tipo}`))}</p>
      <h3>${esc(tx.nombre)}</h3>
      <p class="como-txt"></p>
      <div class="como-accion"></div>
    </div>`);
  const txt = $('.como-txt', box), acc = $('.como-accion', box);
  const boton = (clave, fn) => { const b = h(`<button class="btn btn-flor">${esc(t(clave))}</button>`); b.onclick = fn; acc.appendChild(b); };
  // Lo que entrega el guía con su código: si gana un cromo, se abre el sobre; si no, se avisa y se refresca
  const alGuia = async (r) => {
    if (r.ganado) { cerrarDetalle(); accionesExtra.abrirSobres(); return; }
    aviso(t(r.msg, r.vars), 3500);
    if (r.msg === 'guia.aqui') { cerrarDetalle(); abrirDetalle(c.id); }
  };
  // Plan B con el guía, plegado para no distraer
  const planB = (resumen, accion) => {
    const d = h(`<details class="plan-b"><summary>${esc(resumen)}</summary></details>`);
    d.appendChild(formCodigo(accion, alGuia));
    acc.appendChild(d);
  };
  switch (c.tipo) {
    case 'gps': {
      const est = estacion(c.estacion);
      txt.textContent = t('como.gps', { est: est.nombre });
      boton('accion.mapa', () => { cerrarDetalle(); nav('mapa'); });
      if (E.ajustes.demo) {
        const b = h(`<button class="btn btn-linea">${esc(t('mapa.simular'))}</button>`);
        b.onclick = () => { cerrarDetalle(); accionesExtra.simular(est); };
        acc.appendChild(b);
      }
      planB(t('planb.gps'), `e:${est.id}`);
      break;
    }
    case 'camara':
      if (bl?.tipo === 'despuesDe') txt.textContent = t('como.camaraDespues', { otro: texto(getCromo(bl.de)).nombre });
      else if (bl?.tipo === 'otraPlanta') txt.textContent = t('como.otraPlanta');
      else txt.textContent = t('como.camara', { cosa: nombreClase(c.clase).toLowerCase() });
      boton('accion.lente', () => { cerrarDetalle(); accionesExtra.abrirLente('reconocer'); });
      if (bl?.tipo !== 'despuesDe') planB(t('planb.camara'), `c:${c.clase}`);
      break;
    case 'qr':
      txt.textContent = t('como.qr');
      boton('accion.qr', () => { cerrarDetalle(); accionesExtra.abrirLente('qr'); });
      break;
    case 'guia':
      txt.textContent = t('como.guia');
      acc.appendChild(formCodigo(`h:${c.id}`, alGuia));
      boton('accion.qrGuia', () => { cerrarDetalle(); accionesExtra.abrirLente('qr'); });
      $('.como-accion > .btn', box)?.classList.replace('btn-flor', 'btn-linea');
      break;
    case 'grupo':
    case 'contemplacion':
    case 'aclimatacion':
      if (bl?.tipo === 'requiere') { txt.textContent = t('como.grupoFalta', { n: bl.faltan }); break; }
      if (bl?.tipo === 'estacion') { txt.textContent = t('como.aclimEstacion', { est: estaciones().find((e) => e.id === bl.estacion)?.nombre || '' }); acc.appendChild(formCodigo('aqui', alGuia)); break; }
      if (bl?.tipo === 'lugar') {
        txt.textContent = t('como.lugar');
        acc.appendChild(formCodigo('aqui', alGuia));
        break;
      }
      if (c.tipo === 'grupo') { txt.textContent = t('como.grupo'); boton('accion.grupo', () => { cerrarDetalle(); accionesExtra.pedirFoto(c.id, t('lente.fotoGrupo')); }); }
      else if (c.tipo === 'aclimatacion') { txt.textContent = t('como.aclimatacion', { min: Math.max(1, Math.round(c.segundos / 60)) }); boton('accion.aclimatar', () => { cerrarDetalle(); accionesExtra.pausa(c); }); }
      else { txt.textContent = t('como.contemplacion', { min: Math.round(c.segundos / 60) }); boton('accion.pausa', () => { cerrarDetalle(); accionesExtra.pausa(c); }); }
      break;
  }
  return box;
}

async function compartir(id) {
  const c = getCromo(id);
  const blob = await cromoPNG(id);
  const file = new File([blob], `cromo-${num(c.n)}-${id}.png`, { type: 'image/png' });
  const data = { files: [file], title: texto(c).nombre, text: `${t('titulo')} — ${t('parque')}` };
  if (navigator.canShare && navigator.canShare(data)) {
    try { await navigator.share(data); } catch (e) { /* cancelado */ }
  } else {
    descargar(blob, file.name);
    aviso(t('det.sinCompartir'), 4500);
  }
}

export function retraducir() { pintarIndice(); pintarCabezote(); refrescarPagina(); traducir(); }
