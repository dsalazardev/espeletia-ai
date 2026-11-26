// Arranque: carga el estado, arma las vistas y conecta la navegación.
import * as est from './estado.js';
import { E, bus } from './estado.js';
import { t, traducir } from './i18n.js';
import { $, $$, h, esc, animar, aviso, vibrar, reducido, mantenerDespierta } from './util.js';
import { iniciarAlbum, retraducir, abrirDetalle, cerrarDetalle, pintarCabezote } from './album.js';
import { iniciarSobres, abrirSobres } from './sobre.js';
import * as lente from './lente.js';
import * as mapa from './mapa.js';
import { mostrarPortada, progresoOffline, estadoOffline, mostrarInstalar, pedirInstalacion, esperarInstalacion, instalada, esIOS, esInterno, saltoInstalar } from './portada.js';
import { iniciarAjustes, abrirAjustes, aplicarTema, entrarEquipo, salirEquipo, pintarEquipo } from './ajustes.js';
import { lluvia } from './celebrar.js';
import * as ml from './ml.js';
import { iniciarChatUI, entrarChat, retraducirChat, abrirConTema, temaDeCromo, conectarMapa, ofrecerLugar } from './chatui.js';
import { iniciarGuia, entrarGuia, salirGuia, textoGuia, leerQR, aplicar as aplicarGuia, codigoDe, mostrarParada, horaRegreso } from './guia.js';

let vista = null;

export async function irA(v, opciones = {}) {
  if (vista === v && !opciones.forzar) { if (v === 'lente' && opciones.modo) lente.ponerModo(opciones.modo); return; }
  const antes = vista;
  if (antes === 'lente') lente.salir();
  if (antes === 'equipo') salirEquipo();
  if (antes === 'guia') salirGuia();
  vista = v;
  for (const id of ['album', 'lente', 'mapa', 'chat', 'equipo', 'guia']) $(`#v-${id}`).hidden = id !== v;
  document.body.dataset.vista = v;
  $$('.muelle button').forEach((b) => (b.dataset.vista === v || (v === 'equipo' && b.dataset.vista === 'mapa') ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current')));
  const el = $(`#v-${v}`);
  if (antes && !reducido()) animar(el, [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: 'ease-out' });
  if (v === 'lente') await lente.entrar(opciones.modo);
  if (v === 'mapa') mapa.entrar();
  if (v === 'equipo') await entrarEquipo();
  if (v === 'album') pintarCabezote();
  if (v === 'chat') entrarChat({ enfocar: !opciones.tema, conTema: !!opciones.tema });
  if (v === 'guia') await entrarGuia();
}

// Al terminar la pausa de aclimatación: la ficha oficial «aclimatar» (agua, ritmo) y un atajo al mal de altura,
// para avisar al guía si hay síntomas. El texto sale de chat.json: aquí no se escriben consejos de salud.
// ---------- Avisos sin red (spec avisos-sin-red, issue #34) ----------
// Solo una línea y una vibración (o destello en iPhone): nada que obligue a mirar la pantalla mientras se camina.
// - Hora de regreso: la fijada por el guía (QR r:HHMM) o, si no, el cierre oficial del sector (paquete.json → horario).
//   Avisa 30 minutos antes y a la hora, solo si hoy se está en el parque.
// - Sobres esperando y el visitante quieto (1 minuto sin moverse más de 15 m): se recuerda una vez.
// (Llegar a una estación, la altura sobre 3.500 m y la batería baja ya avisan en mapa.js y ajustes.js.)
const avisados = new Set();
let ultimoMov = { t: Date.now(), p: null };
function iniciarAvisos() {
  bus.addEventListener('posicion', (e) => {
    const p = e.detail;
    if (!p) return;
    if (!ultimoMov.p || distanciaM(ultimoMov.p, p) > 15) ultimoMov = { t: Date.now(), p };
  });
  const hoyEnParque = () => est.enParque() || Object.values(E.visitadas).some((ms) => new Date(ms).toDateString() === new Date().toDateString());
  const revisar = () => {
    const ocupado = !$('#capa-pausa').hidden || !$('#capa-sobre').hidden;
    if (ocupado) return;
    const r = horaRegreso();
    if (r && hoyEnParque()) {
      const [hh, mm] = [Number(r.hhmm.slice(0, 2)), Number(r.hhmm.slice(2))];
      const meta = new Date(); meta.setHours(hh, mm, 0, 0);
      const falta = meta - Date.now(), hm = `${r.hhmm.slice(0, 2)}:${r.hhmm.slice(2)}`, dia = new Date().toDateString();
      if (falta <= 0 && falta > -2 * 3600e3 && !avisados.has(`ya|${dia}|${hm}`)) {
        avisados.add(`ya|${dia}|${hm}`); avisados.add(`30|${dia}|${hm}`);
        vibrar([80, 60, 80, 60, 160]); aviso(t('aviso.regresoYa'), 8000);
      } else if (falta > 0 && falta <= 30 * 60e3 && !avisados.has(`30|${dia}|${hm}`)) {
        avisados.add(`30|${dia}|${hm}`);
        vibrar([60, 60, 60]); aviso(t(r.guia ? 'aviso.regreso30' : 'aviso.regreso30Oficial', { h: hm }), 8000);
      }
    }
    const n = est.pendientes().length;
    if (n && Date.now() - ultimoMov.t > 60e3 && !avisados.has(`sobres|${n}`)) {
      avisados.add(`sobres|${n}`);
      vibrar(50); aviso(t(n === 1 ? 'aviso.sobre1' : 'aviso.sobres', { n }), 5000);
    }
  };
  setInterval(revisar, 20e3);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') revisar(); });
  window.__revisarAvisos = revisar; // para las pruebas
}
const distanciaM = (a, b) => { const R = 6371e3, r = Math.PI / 180, dLat = (b.lat - a.lat) * r, dLon = (b.lon - a.lon) * r;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLon / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); };

let abrirFichaChat = null; // lo fija iniciar(): abre el chat sobre una ficha
async function despuesDeAclimatar() {
  const chat = await import('./chat.js');
  await chat.cargar().catch(() => {});
  const f = chat.fichaPorId('aclimatar');
  if (!f) return;
  const capa = $('#capa-detalle');
  capa.innerHTML = '';
  const fuente = chat.fuentes()[f.fuente];
  const caja = h(`<div class="detalle aclim-fin">
      <h2 id="aclim-titulo">${esc(t('aclim.fin'))}</h2>
      <p class="parada-texto">${esc(E.lang === 'en' ? f.en : f.es)}</p>
      ${fuente ? `<p class="ficha-fuente">${esc(t('det.fuente', { f: fuente.titulo }))}</p>` : ''}
      <p><b>${esc(t('aclim.guia'))}</b></p>
      <div class="acciones"><button class="btn btn-linea" data-mal>${esc(t('aclim.sintomas'))}</button><button class="btn btn-flor" data-x>${esc(t('cerrar'))}</button></div>
    </div>`);
  capa.setAttribute('aria-labelledby', 'aclim-titulo');
  capa.appendChild(caja); capa.hidden = false;
  const cerrar = () => { capa.hidden = true; capa.innerHTML = ''; capa.removeAttribute('aria-labelledby'); };
  $('[data-x]', caja).onclick = cerrar;
  $('[data-mal]', caja).onclick = () => { cerrar(); abrirFichaChat?.('mal_altura'); };
  $('h2', caja).setAttribute('tabindex', '-1'); $('h2', caja).focus();
}

// Pausa sin pantalla (contemplación) o de aclimatación: el tiempo del cromo sin tocar la pantalla; si se toca, se reinicia.
function pausa(c) {
  const capa = $('#capa-pausa'), total = c.segundos * 1000;
  let inicio = Date.now(), raf = null;
  capa.hidden = false;
  lente.salir();
  $('#pausa-estado').textContent = t('pausa.regla');
  const reiniciar = (e) => {
    if (e.target.closest('#pausa-salir')) return;
    inicio = Date.now();
    $('#pausa-estado').textContent = t('pausa.reinicio');
    animar($('.anillo'), [{ transform: 'rotate(-90deg) scale(.94)' }, { transform: 'rotate(-90deg) scale(1)' }], { duration: 300 });
  };
  // Pantalla encendida durante la pausa. Plan B si no se puede: si se apaga, la pausa sigue contando
  // (no se toca la pantalla), así que basta con avisarlo.
  let despierta = null;
  mantenerDespierta().then((d) => { despierta = d; if (capa.hidden) { d.soltar(); return; } if (!d.ok && !capa.hidden) $('#pausa-estado').textContent = `${t('pausa.regla')} ${t('despierta.pausa')}`; });
  const fin = () => { cancelAnimationFrame(raf); clearInterval(tick); capa.hidden = true; capa.removeEventListener('pointerdown', reiniciar); despierta?.soltar(); };
  const ganada = async () => {
    fin(); await est.ganar(c.id); await abrirSobres();
    document.dispatchEvent(new CustomEvent('paramo-pausa-fin', { detail: { cromo: c.id, tipo: c.tipo } })); // para los avisos sin red (#34)
    if (c.tipo === 'aclimatacion') despuesDeAclimatar();
  };
  capa.addEventListener('pointerdown', reiniciar);
  $('#pausa-salir').onclick = fin;
  const anillo = $('#pausa-avance');
  const pintar = () => {
    const pasado = Date.now() - inicio;
    const f = Math.min(1, pasado / total);
    anillo.style.strokeDashoffset = String(326.7 * (1 - f));
    const resta = Math.max(0, Math.ceil((total - pasado) / 1000));
    $('#pausa-tiempo').textContent = `${Math.floor(resta / 60)}:${String(resta % 60).padStart(2, '0')}`;
    return f >= 1;
  };
  const paso = () => { if (pintar()) { ganada(); return; } raf = requestAnimationFrame(paso); };
  // Con la pantalla apagada no hay cuadros de animación: también se revisa con un reloj.
  const tick = setInterval(() => { if (pintar()) ganada(); }, 1000);
  raf = requestAnimationFrame(paso);
}

// Con señal llegó contenido nuevo del parque (sw.js → «contenido»): se avisa una vez, sin interrumpir una pausa ni un
// sobre (se espera a que terminen). Se usa la próxima vez que se abra el álbum.
let contenidoAvisado = false;
function avisarContenido() {
  if (contenidoAvisado) return;
  contenidoAvisado = true;
  const intentar = () => {
    const ocupado = !$('#capa-pausa').hidden || !$('#capa-sobre').hidden;
    if (ocupado) { setTimeout(intentar, 2000); return; }
    aviso(t('sw.contenido'), 5000);
  };
  intentar();
}
// Con los archivos reparados (escalera de degradación), se vuelve a intentar cargar la IA
document.addEventListener('paramo-archivos', (e) => {
  if (e.detail.some((x) => x.estado === 'reparado')) Promise.allSettled([ml.load(), import('./chat.js').then((c) => c.reintentar())]);
});

async function despuesDeGanar(id, { soloFoto = false } = {}) {
  if (soloFoto) { await irA('album'); abrirDetalle(id); return; }
  await abrirSobres();
}

function celebrar() {
  bus.addEventListener('capitulo', (e) => {
    const k = est.capitulos().find((c) => c.id === e.detail.cap);
    setTimeout(() => { aviso(t('cel.capitulo', { cap: k[E.lang] }), 3500); lluvia(2200); vibrar([60, 60, 60, 60, 120]); }, 400);
  });
  bus.addEventListener('completo', () => {
    setTimeout(() => { lluvia(4200); mostrarFinal(); }, 900);
  });
}

async function mostrarFinal() {
  const { botonPDF, botonCollage, hayFotos } = await import('./exportar.js');
  const capa = $('#capa-detalle');
  capa.innerHTML = `<div class="detalle final">
      <p class="final-sello">24/24</p>
      <h2>${t('cel.final')}</h2>
      <p>${t('cel.finalSub')}</p>
      <div class="acciones"><button class="btn btn-flor" id="final-desc">${t('cel.descargar')}</button>${(await hayFotos()) ? `<button class="btn btn-linea" id="final-collage">${t('pdf.collageBtn')}</button>` : ''}<button class="btn btn-linea" id="final-cerrar">${t('cerrar')}</button></div>
    </div>`;
  capa.hidden = false;
  $('#final-desc').onclick = (e) => botonPDF(e.currentTarget);
  const bc = $('#final-collage'); if (bc) bc.onclick = (e) => botonCollage(e.currentTarget);
  $('#final-cerrar').onclick = () => cerrarDetalle();
}

async function iniciar() {
  await est.cargar();
  aplicarTema();
  traducir();
  // Precarga de la IA en segundo plano (en el worker: no congela la pantalla).
  // En la primera visita se espera a que termine de guardarse para usar sin señal: si no, los modelos
  // se descargarían dos veces a la vez (una para usarlos y otra para guardarlos) y todo iría lento.
  let precargada = false;
  const precargar = () => {
    if (precargada) return;
    precargada = true;
    const idle = window.requestIdleCallback || ((f) => setTimeout(f, 1));
    setTimeout(() => idle(async () => {
      await ml.load().catch(() => {});
      // El chat también, si el teléfono tiene memoria de sobra (deviceMemory solo existe en Chrome)
      if ((navigator.deviceMemory ?? 4) >= 3) import('./chat.js').then((c) => c.cargar()).catch(() => {});
    }), 1500);
  };
  if (navigator.serviceWorker?.controller) precargar();

  // Unión Lente/álbum → chat: abre «Pregúntale a Fray» hablando de ese cromo
  async function preguntarSobre(id, opc = {}) {
    const tema = temaDeCromo(id);
    if (!tema) return;
    await irA('chat', { tema: true, forzar: vista === 'chat' });
    await abrirConTema(tema, opc);
  }
  const acciones = {
    preguntar: (id) => preguntarSobre(id),
    abrirSobres: () => abrirSobres(),
    abrirLente: (m) => irA('lente', { modo: m, forzar: vista === 'lente' }),
    pedirFoto: (id, msg) => { lente.pedirFoto(id, msg); irA('lente', { modo: 'foto', forzar: true }); },
    pausa,
    simular: (e) => mapa.simular(e),
  };
  iniciarAlbum({ irA, acciones });
  iniciarGuia({ irA });
  iniciarSobres({ irA, preguntar: (id) => preguntarSobre(id) });
  lente.iniciarLente({ onGanar: despuesDeGanar, onPreguntar: (id, { clase, confianza }) => preguntarSobre(id, { intro: t('chat.lenteVe', { cosa: est.nombreClase(clase).toLowerCase(), p: Math.round(confianza * 100) }) }) });
  mapa.iniciarMapa({
    llegada: async (id, { simulado }) => { pintarCabezote(); if (simulado && vista === 'album') abrirSobres(); },
    preguntar: (id) => preguntarSobre(id),
    // Abrir el chat sobre una ficha que no es de un cromo (p. ej. el mal de altura desde la bitácora)
    preguntarFicha: (abrirFichaChat = async (ficha) => {
      const temas = { mal_altura: { es: 'el mal de altura', en: 'altitude sickness' } };
      await irA('chat', { tema: true, forzar: vista === 'chat' });
      await abrirConTema({ id: ficha, ficha, ...(temas[ficha] || { es: ficha, en: ficha }) });
    }),
    abrirSobres: () => abrirSobres(),
    pausa: (c) => pausa(c),
    // Al llegar a una estación, la próxima vez que se abra el chat ofrece hablar de ese lugar
    alLlegar: (e, c) => { const tm = c && temaDeCromo(c.id); if (tm) ofrecerLugar(tm, t('chat.llegasteA', { est: e.nombre })); },
  });
  conectarMapa(async (lugar) => { await irA('mapa'); await mapa.mostrar(lugar); });
  iniciarAjustes({ irA, alCambiar: () => { retraducir(); retraducirChat(); if (vista === 'mapa') mapa.pintar(); if (vista === 'equipo') pintarEquipo(); if (vista === 'guia') entrarGuia(); } });
  celebrar();

  $$('.muelle button[data-vista]').forEach((b) => (b.onclick = () => irA(b.dataset.vista)));
  $('.muelle [data-accion="ajustes"]').onclick = abrirAjustes;
  iniciarChatUI();

  if (!('serviceWorker' in navigator)) precargar();
  // El service worker guarda la app y los modelos (~95 MB). En iPhone sin instalar se espera: la app instalada
  // guarda sus datos aparte de Safari y lo descargado aquí no le serviría (spec arreglos-iphone).
  const registrarSW = () => {
    if (!('serviceWorker' in navigator) || registrarSW.hecho) return;
    registrarSW.hecho = true;
    navigator.serviceWorker.addEventListener('message', (e) => {
      if (e.data?.tipo === 'progreso') progresoOffline(e.data.p);
      if (e.data?.tipo === 'listo') { progresoOffline(1); estadoOffline(); precargar(); if (instalada()) import('./db.js').then((db) => db.persist()); }
      if (e.data?.tipo === 'error') import('./motor.js').then((m) => m.anotar('Guardar para usar sin señal', e.data.detalle));
    if (e.data?.tipo === 'contenido') avisarContenido();
    });
    // Si ya había una versión guardada y llega una nueva, recargar una sola vez para mostrarla
    const habiaVersion = !!navigator.serviceWorker.controller;
    let recargado = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (habiaVersion && !recargado) { recargado = true; location.reload(); }
    });
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' })
      .then((reg) => { if (reg.active) reg.update().catch(() => {}); })
      .catch((e) => console.warn('SW', e));
  };
  if (!esperarInstalacion() || navigator.serviceWorker?.controller) registrarSW();
  // Almacenamiento persistente: se pide en la app instalada (Safari suele decir que no; la app instalada igual conserva sus datos)
  if (instalada()) import('./db.js').then((db) => db.persist());

  // ¿Se abrió desde el QR del guía escaneado con la cámara del teléfono? (la dirección trae «#PARAMO-G…»)
  // En iPhone sin la app instalada (o en un navegador interno) los datos no son los del álbum instalado:
  // no se aplica ahí; se muestra el código de 4 dígitos para escribirlo en el álbum.
  // Excepción: si el visitante eligió «Abrir sin instalar», su álbum ES este navegador y se aplica aquí.
  const qrAparte = () => !instalada() && !saltoInstalar() && (esIOS() || esInterno());
  const leerQRDireccion = async () => {
    if (location.hash.length < 2 || !textoGuia(location.href)) return null;
    const g = await leerQR(location.href).catch(() => null) || { falso: true };
    history.replaceState(null, '', location.pathname + location.search); // que recargar no lo vuelva a aplicar
    return g;
  };
  // Paradas y hora de regreso no tienen casilla para escribir el código: solo se pueden escanear con la Lente
  const sinCasilla = (a) => /^(p|pf|r):/.test(a);
  const textoQR = async (g) => (g.accion ? (sinCasilla(g.accion) ? t('ins.qrLente') : t('ins.qrCodigo', { cod: await codigoDe(g) })) : t(g.vencido ? 'guia.vencido' : 'lente.qrAjeno'));
  const aplicarQRDireccion = async (g) => {
    if (qrAparte()) { aviso(await textoQR(g), 9000); return; }
    if (!g.accion) { aviso(t(g.vencido ? 'guia.vencido' : 'lente.qrAjeno'), 4000); return; }
    const r = await aplicarGuia(g);
    if (r.parada) await mostrarParada(r.parada, { ganado: r.ganado });
    if (r.ganado) { pintarCabezote(); abrirSobres(); } else if (r.msg) aviso(t(r.msg, r.vars), 4000);
  };
  const qrGuia = await leerQRDireccion();
  const notaQR = qrGuia && qrAparte() ? await textoQR(qrGuia) : null;

  iniciarAvisos();
  await irA('album');
  if (!E.portadaVista) {
    await mostrarPortada({ alAbrir: () => pintarCabezote(), alCambiarIdioma: () => retraducir() });
  }
  // Paso obligatorio: instalar antes de usar (y antes de la descarga grande en iPhone)
  if (pedirInstalacion()) await mostrarInstalar({ alSaltar: registrarSW, nota: notaQR });
  if (qrGuia && !qrAparte()) await aplicarQRDireccion(qrGuia);
  // Si la app ya estaba abierta y se vuelve a abrir con otro QR del guía
  addEventListener('hashchange', async () => { const g = await leerQRDireccion(); if (g) aplicarQRDireccion(g); });
  // Las geocercas funcionan en cualquier pantalla, pero el permiso solo se pide al abrir el Mapa
  // (o se activa solo si el visitante ya lo había dado).
  try { const pr = await navigator.permissions?.query({ name: 'geolocation' }); if (pr?.state === 'granted') mapa.iniciarGPS(); } catch (e) { /* sin API */ }
  if (est.pendientes().length) setTimeout(() => aviso(t('album.sobres', { n: est.pendientes().length })), 600);
}

iniciar();

// Para pruebas automáticas
window.__paramo = { E, est, ml, irA, abrirSobres, mapa, chat: () => import('./chat.js') };
