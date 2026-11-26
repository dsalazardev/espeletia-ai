// Portada del álbum (primera vez): nombre del dueño, idioma y estado sin señal. Se abre como un libro.
import { E, guardar } from './estado.js';
import { t, traducir } from './i18n.js';
import { $, h, esc, animar, reducido, vibrar } from './util.js';
import { personajes } from './art.js';

// ---------- Instalación (spec arreglos-iphone, issue #14) ----------
// El aviso de instalar de Chrome (beforeinstallprompt) llega UNA vez y temprano: se guarda al cargar la página,
// no al mostrar la pantalla. Si no llega (iPhone nunca lo envía; Chrome a veces lo oculta), se muestran pasos manuales.
let avisoInstalar = null;
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); avisoInstalar = e; document.dispatchEvent(new Event('paramo-instalable')); });
addEventListener('appinstalled', () => { avisoInstalar = null; document.dispatchEvent(new Event('paramo-instalada')); });

const UA = navigator.userAgent || '';
export const esIOS = () => /iPhone|iPad|iPod/i.test(UA) || (/Macintosh/.test(UA) && navigator.maxTouchPoints > 1);
export const esAndroid = () => /Android/i.test(UA);
// Navegadores internos de redes sociales: no dejan instalar
export const esInterno = () => /Instagram|FBAN|FBAV|FB_IAB|FBIOS|WhatsApp|Messenger|Line\/|TikTok|musical_ly|Snapchat/i.test(UA);
export const esEscritorio = () => !esIOS() && !esAndroid() && !/Mobi/i.test(UA);
export const instalada = () => matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || navigator.standalone === true;
const LS_SALTAR = 'paramo-sin-instalar';
export const saltoInstalar = () => { try { return localStorage.getItem(LS_SALTAR) === '1'; } catch (e) { return false; } };
// ¿Se puede seguir sin instalar? Solo en computador o en la demo ante el jurado (Ajustes → demo, o ?demo en la dirección)
// Se puede abrir sin instalar en cualquier teléfono (pedido del equipo); se explica qué se pierde.
const puedeSaltar = () => true;
// En iPhone, la app instalada guarda sus datos aparte de Safari: lo que se descargue en Safari no le sirve.
// Por eso, sin instalar, no se empieza la descarga grande (app.js no registra el service worker).
export const esperarInstalacion = () => !instalada() && !saltoInstalar() && (esIOS() || esInterno());
export const pedirInstalacion = () => !instalada() && !saltoInstalar();

const icoCompartir = '<svg viewBox="0 0 24 24" aria-hidden="true" class="ins-ico"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/></svg>';
const icoMas = '<svg viewBox="0 0 24 24" aria-hidden="true" class="ins-ico"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8v8M8 12h8"/></svg>';
const icoMenu = '<svg viewBox="0 0 24 24" aria-hidden="true" class="ins-ico"><circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/></svg>';
const icoApp = '<img src="icons/icon-192.png" alt="" class="ins-ico ins-ico-app">';

// Pantalla «Instala tu álbum»: no se pasa al álbum desde aquí (salvo en computador o demo).
// Se resuelve cuando el visitante elige seguir sin instalar; si instala, debe abrir la app desde el ícono.
export function mostrarInstalar({ alSaltar, nota = null } = {}) {
  return new Promise((ok) => {
    const capa = $('#capa-portada');
    const pasos = (lista) => `<ol class="ins-pasos${lista.length === 1 ? ' ins-uno' : ''}">${lista.map(([ico, txt]) => `<li>${ico}<span>${txt}</span></li>`).join('')}</ol>`;
    const pintar = (estado = '') => {
      const nombre = E.nombre ? esc(E.nombre) : '';
      let cuerpo;
      if (estado === 'hecho') {
        cuerpo = `<p class="ins-hecho" role="status">${esc(t('ins.hecho'))}</p>${pasos([[icoApp, esc(t('ins.abrirIcono'))]])}`;
      } else if (esInterno()) {
        const enChrome = esAndroid() ? `<a class="btn btn-flor btn-grande" id="ins-chrome" href="intent://${location.host}${location.pathname}#Intent;scheme=https;package=com.android.chrome;end">${esc(t('ins.abrirChrome'))}</a>` : '';
        cuerpo = `<p>${esc(t(esIOS() ? 'ins.internoIOS' : 'ins.internoAndroid'))}</p>
          ${enChrome}
          <button class="btn btn-linea btn-grande ins-claro" type="button" id="ins-copiar">${esc(t('ins.copiar'))}</button>
          ${pasos([[icoMenu, esc(t('ins.internoPaso'))]])}`;
      } else if (esIOS()) {
        cuerpo = pasos([
          [icoCompartir, t('ins.ios1')],
          [icoMas, t('ins.ios2')],
          [icoApp, esc(t('ins.abrirIcono'))],
        ]) + `<p class="ins-nota">${esc(t('ins.iosNota'))}</p>`;
      } else if (avisoInstalar) {
        cuerpo = `<button class="btn btn-flor btn-grande" type="button" id="ins-instalar">${esc(t('ins.instalar'))}</button>
          <p class="ins-nota">${esc(t('ins.despues'))}</p>`;
      } else {
        cuerpo = pasos([
          [icoMenu, t('ins.and1')],
          [icoMas, t('ins.and2')],
          [icoApp, esc(t('ins.abrirIcono'))],
        ]);
      }
      capa.innerHTML = '';
      const tapa = h(`<div class="tapa tapa-instalar" role="dialog" aria-modal="true" aria-labelledby="ins-titulo">
          <div class="tapa-arte tapa-arte-chica" aria-hidden="true"><span class="tapa-pj tapa-fray">${personajes.fray(92)}</span></div>
          <h1 class="ins-titulo" id="ins-titulo" tabindex="-1">${esc(t('ins.titulo'))}</h1>
          <p class="ins-sub">${nombre ? esc(t('ins.hola', { nombre: E.nombre })) + ' ' : ''}${esc(t('ins.porque'))}</p>
          ${nota ? `<p class="ins-qr" role="status">${esc(nota)}</p>` : ''}
          <div class="ins-cuerpo">${cuerpo}</div>
          ${puedeSaltar() && estado !== 'hecho' ? `<div class="ins-sin"><button class="btn btn-linea ins-claro" type="button" id="instalar-saltar">${esc(t('ins.saltar'))}</button>
            <p class="ins-nota">${esc(t(esIOS() && !esEscritorio() ? 'ins.saltarNotaIOS' : 'ins.saltarNota'))}</p></div>` : ''}
        </div>`);
      capa.appendChild(tapa);
      const bi = $('#ins-instalar', tapa);
      if (bi) bi.onclick = async () => {
        const ev = avisoInstalar; avisoInstalar = null;
        try { await ev.prompt(); const r = await ev.userChoice; pintar(r?.outcome === 'accepted' ? 'hecho' : ''); } catch (e) { pintar(); }
      };
      const bc = $('#ins-copiar', tapa);
      if (bc) bc.onclick = async () => {
        try { await navigator.clipboard.writeText(location.origin + location.pathname); bc.textContent = t('ins.copiado'); }
        catch (e) { bc.textContent = location.origin + location.pathname; }
      };
      const bs = $('#instalar-saltar', tapa);
      if (bs) bs.onclick = () => {
        try { localStorage.setItem(LS_SALTAR, '1'); } catch (e) { /* */ }
        document.removeEventListener('paramo-instalable', alLlegar); document.removeEventListener('paramo-instalada', alInstalar);
        capa.hidden = true; capa.innerHTML = '';
        alSaltar?.(); ok();
      };
      $('h1', tapa).focus?.();
    };
    const alLlegar = () => pintar();
    const alInstalar = () => pintar('hecho');
    document.addEventListener('paramo-instalable', alLlegar);
    document.addEventListener('paramo-instalada', alInstalar);
    capa.hidden = false;
    pintar();
  });
}

// ¿Está todo guardado para usar en modo avión? (revisa que el modelo esté en la caché)
export async function listoOffline() {
  if (!('caches' in window)) return false;
  try {
    for (const k of await caches.keys()) {
      if (!k.startsWith('album-paramo-')) continue;
      const c = await caches.open(k);
      const man = await c.match('models/partes.json', { ignoreSearch: true });
      if (!man) continue;
      const partes = Object.keys(await man.json()); // los archivos grandes se guardan unidos (ver sw.js)
      let todas = partes.length > 0;
      for (const p of partes) if (!(await c.match(p, { ignoreSearch: true }))) { todas = false; break; }
      if (todas) return true;
    }
  } catch (e) { /* sin caché */ }
  return false;
}

export function mostrarPortada({ alAbrir, alCambiarIdioma }) {
  return new Promise((ok) => {
    const capa = $('#capa-portada');
    const pintar = () => {
      capa.innerHTML = '';
      const tapa = h(`<div class="tapa">
          <div class="tapa-idioma" role="group" aria-label="Idioma / Language">
            <button data-l="es" aria-pressed="${E.lang === 'es'}">Español</button>
            <button data-l="en" aria-pressed="${E.lang === 'en'}">English</button>
          </div>
          <div class="tapa-arte" aria-hidden="true">
            <span class="tapa-pj tapa-condor">${personajes.condor(70)}</span>
            <span class="tapa-pj tapa-fray">${personajes.fray(120)}</span>
            <span class="tapa-pj tapa-magma">${personajes.magma(78)}</span>
          </div>
          <h1 class="tapa-titulo">${esc(t('titulo'))}</h1>
          <p class="tapa-parque">${esc(t('parque'))}</p>
          <p class="tapa-lema">${esc(t('portada.lema'))}</p>
          <form class="tapa-dueno">
            <label for="tapa-nombre">${esc(t('portada.es'))}</label>
            <input id="tapa-nombre" maxlength="24" autocomplete="given-name" placeholder="${esc(t('portada.nombre'))}" value="${esc(E.nombre)}">
            <button class="btn btn-flor btn-grande">${esc(t('portada.abrir'))}</button>
          </form>
          <p class="tapa-offline" id="tapa-offline"><span class="punto"></span><span class="txt"></span></p>
          <p class="tapa-permisos">${esc(t('portada.permisos'))}</p>
        </div>`);
      capa.appendChild(tapa);
      tapa.querySelectorAll('[data-l]').forEach((b) => (b.onclick = async () => {
        E.nombre = $('#tapa-nombre').value.trim();
        E.lang = b.dataset.l; await guardar(); alCambiarIdioma(); pintar();
      }));
      tapa.querySelector('form').onsubmit = async (e) => {
        e.preventDefault();
        E.nombre = $('#tapa-nombre').value.trim();
        E.portadaVista = true;
        await guardar();
        vibrar(30);
        alAbrir();
        await abrirTapa(tapa);
        capa.hidden = true; capa.innerHTML = '';
        ok();
      };
      estadoOffline();
    };
    capa.hidden = false;
    pintar();
  });
}

async function abrirTapa(tapa) {
  if (reducido()) return;
  tapa.style.transformOrigin = 'left center';
  $('#capa-portada').classList.add('abriendo');
  await animar(tapa, [
    { transform: 'perspective(1600px) rotateY(0deg)', boxShadow: '0 0 0 rgba(0,0,0,0)' },
    { transform: 'perspective(1600px) rotateY(-28deg)', boxShadow: '30px 0 60px rgba(0,0,0,.35)', offset: 0.35 },
    { transform: 'perspective(1600px) rotateY(-105deg)', boxShadow: '60px 0 80px rgba(0,0,0,0)' },
  ], { duration: 900, easing: 'cubic-bezier(.55,.05,.35,1)', fill: 'forwards' });
  $('#capa-portada').classList.remove('abriendo');
}

let progreso = null;
export function progresoOffline(p) { progreso = p; estadoOffline(); }

export async function estadoOffline() {
  const el = $('#tapa-offline');
  if (!el) return;
  const txt = el.querySelector('.txt');
  if (await listoOffline()) { el.className = 'tapa-offline listo'; txt.textContent = t('portada.offline.listo'); return; }
  if (progreso !== null) { el.className = 'tapa-offline cargando'; txt.textContent = t('portada.offline.cargando', { p: Math.round(progreso * 100) }); return; }
  el.className = 'tapa-offline'; txt.textContent = t('portada.offline.no');
}

// ---------- Archivos guardados dañados (escalera de degradación #20, contrato docs/contratos/sw-mensajes.md) ----------
// La revisión y la reparación las hace el service worker (mensajes «verificar» y «reparar»): aquí solo se piden,
// se anota lo dañado para repararlo al volver la señal y se avisa a Ajustes.
const LS_DANADOS = 'paramo-danados';
export const danados = () => { try { return JSON.parse(localStorage.getItem(LS_DANADOS)) || []; } catch (e) { return []; } };
const guardarDanados = (l) => { try { localStorage.setItem(LS_DANADOS, JSON.stringify([...new Set(l)])); } catch (e) { /* */ } };
export let ultimaRevision = null; // [{ ruta, estado: 'ok' | 'danado' | 'reparado' }]
let revisando = null;

// Manda un mensaje al service worker y espera la respuesta de cierto tipo (null si no hay service worker o no contesta)
function pedirSW(msg, esperado, ms) {
  const sw = navigator.serviceWorker;
  if (!sw?.controller) return Promise.resolve(null);
  return new Promise((ok) => {
    const alLlegar = (e) => { if (e.data?.tipo === esperado) { fin(); ok(e.data); } };
    const reloj = setTimeout(() => { fin(); ok(null); }, ms);
    const fin = () => { clearTimeout(reloj); sw.removeEventListener('message', alLlegar); };
    sw.addEventListener('message', alLlegar);
    sw.controller.postMessage(msg);
  });
}

export function revisarArchivos({ reparar = true } = {}) {
  revisando ??= (async () => {
    const v = await pedirSW({ tipo: 'verificar' }, 'verificado', 60000);
    if (!v) return ultimaRevision || []; // sin service worker (todavía no se guardó nada): no hay qué revisar
    const man = await fetch('models/partes.json').then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
    const malos = [...new Set([...v.malos, ...danados()])];
    const estado = Object.fromEntries([...Object.keys(man), ...malos].map((r) => [r, malos.includes(r) ? 'danado' : 'ok']));
    let pendientes = malos;
    if (reparar && malos.length && navigator.onLine) {
      const r = await pedirSW({ tipo: 'reparar', rutas: malos }, 'reparado', 300000);
      for (const ruta of r?.ok || []) estado[ruta] = 'reparado';
      pendientes = malos.filter((ruta) => estado[ruta] !== 'reparado');
    }
    guardarDanados(pendientes);
    ultimaRevision = Object.entries(estado).map(([ruta, e]) => ({ ruta, estado: e }));
    document.dispatchEvent(new CustomEvent('paramo-archivos', { detail: ultimaRevision }));
    return ultimaRevision;
  })().finally(() => { revisando = null; });
  return revisando;
}
// Al volver la señal, reparar lo que quedó pendiente
addEventListener('online', () => { if (danados().length) revisarArchivos({ reparar: true }); });
