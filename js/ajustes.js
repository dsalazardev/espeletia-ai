// Ajustes del visitante y Modo equipo (enseñar a la Lente, fijar estaciones, códigos, demo).
import * as ml from './ml.js';
import { E, guardar, estaciones, fijarEstacion, cromos, vaciar, texto } from './estado.js';
import { t } from './i18n.js';
import { $, $$, h, esc, aviso, vibrar, animar, atraparFoco } from './util.js';
import { listoOffline, revisarArchivos, danados, ultimaRevision } from './portada.js';
import { botonPDF, botonCollage, descargar } from './exportar.js';
import { iniciarGPS } from './mapa.js';
import * as chat from './chat.js';
import { errores, tiempos } from './motor.js';

const PIN = '2611';
let ctx = {};
export function iniciarAjustes(c) { ctx = c; }

// ---------- Hoja de ajustes ----------
export async function abrirAjustes() {
  const capa = $('#capa-ajustes');
  const listo = await listoOffline();
  capa.innerHTML = '';
  const hoja = h(`<div class="hoja">
      <div class="hoja-asa" aria-hidden="true"></div>
      <h2 id="aj-titulo">${esc(t('aj.titulo'))}</h2>
      <p class="aj-rol"><span class="insignia-rol">${esc(t('rol.visitante'))}</span> ${esc(t('rol.visitanteTxt'))}</p>
      <label class="campo"><span>${esc(t('aj.nombre'))}</span><input id="aj-nombre" maxlength="24" value="${esc(E.nombre)}" placeholder="${esc(t('portada.nombre'))}"></label>
      <div class="campo"><span>${esc(t('aj.idioma'))}</span>
        <div class="segmentos" role="group"><button data-l="es" aria-pressed="${E.lang === 'es'}">Español</button><button data-l="en" aria-pressed="${E.lang === 'en'}">English</button></div></div>
      <div class="campo"><span>${esc(t('aj.tema'))}</span>
        <div class="segmentos" role="group">${['auto', 'papel', 'noche'].map((k) => `<button data-tema="${k}" aria-pressed="${E.ajustes.tema === k}">${esc(t(`aj.tema.${k}`))}</button>`).join('')}</div></div>
      <div class="campo"><span id="aj-texto-et">${esc(t('aj.texto'))}</span>
        <div class="segmentos" role="group" aria-labelledby="aj-texto-et">${['n', 'g', 'mg'].map((k) => `<button data-texto="${k}" aria-pressed="${E.ajustes.texto === k}">${esc(t(`aj.texto.${k}`))}</button>`).join('')}</div></div>
      <div class="campo"><span id="aj-tono-et">${esc(t('aj.tono'))}</span>
        <div class="segmentos" role="group" aria-labelledby="aj-tono-et">${['normal', 'corta', 'larga', 'ninos'].map((k) => `<button data-tono="${k}" aria-pressed="${(E.ajustes.tono || 'normal') === k}">${esc(t(`aj.tono.${k}`))}</button>`).join('')}</div>
        <small class="aj-nota">${esc(t('aj.tonoNota'))}</small></div>
      <label class="interruptor"><input type="checkbox" id="aj-contraste" ${E.ajustes.contraste ? 'checked' : ''}><span>${esc(t('aj.contraste'))}</span></label>
      <div class="campo"><span id="aj-ahorro-et">${esc(t('aj.ahorro'))}</span>
        <div class="segmentos" role="group" aria-labelledby="aj-ahorro-et">${['auto', 'si', 'no'].map((k) => `<button data-ahorro="${k}" aria-pressed="${E.ajustes.ahorro === k}">${esc(t(`aj.ahorro.${k}`))}</button>`).join('')}</div>
        <small class="aj-nota">${esc(t('aj.ahorroNota'))}</small></div>
      <div class="campo aj-dictado"><span>${esc(t('aj.dictado'))}</span>
        <div class="aj-dictado-estado"></div>
        <small class="aj-nota">${esc(t('aj.dictadoNota'))}</small></div>
      <label class="interruptor"><input type="checkbox" id="aj-voz" ${E.ajustes.voz ? 'checked' : ''}><span>${esc(t('aj.voz'))}</span></label>
      <label class="interruptor"><input type="checkbox" id="aj-vibrar" ${E.ajustes.vibrar ? 'checked' : ''}><span>${esc(t('aj.vibrar'))}</span></label>
      <button class="btn btn-linea btn-ancho" id="aj-poster">${esc(t('aj.poster'))}</button>
      <button class="btn btn-linea btn-ancho" id="aj-collage">${esc(t('pdf.collageBtn'))}</button>
      <p class="estado-offline ${listo ? 'listo' : ''}"><span class="punto"></span>${esc(listo ? t('aj.listo') : t('aj.noListo'))}</p>
      <div class="estado-ia" id="aj-ia"></div>
      <div class="hoja-pie">
        <span class="hoja-links"><button class="link" id="aj-creditos">${esc(t('aj.creditos'))}</button><button class="link" id="aj-guia">${esc(t('aj.guia'))}</button><button class="link" id="aj-equipo">${esc(t('aj.equipo'))}</button></span>
        <span class="version">${esc(t('aj.version', { v: E.paquete.version }))}</span>
      </div>
      <button class="btn btn-flor btn-ancho" id="aj-cerrar">${esc(t('aj.cerrar'))}</button>
    </div>`);
  capa.appendChild(hoja);
  capa.hidden = false;
  const soltar = atraparFoco(capa);
  animar(hoja, [{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }], { duration: 320, easing: 'cubic-bezier(.2,.9,.3,1)' });
  const cerrar = async () => {
    E.nombre = $('#aj-nombre').value.trim();
    await guardar();
    await animar(hoja, [{ transform: 'translateY(0)' }, { transform: 'translateY(100%)' }], { duration: 220, easing: 'ease-in' });
    capa.hidden = true; capa.innerHTML = ''; soltar();
    ctx.alCambiar();
  };
  $$('[data-l]', hoja).forEach((b) => (b.onclick = async () => {
    E.lang = b.dataset.l; E.nombre = $('#aj-nombre').value.trim(); await guardar(); ctx.alCambiar(); abrirAjustes();
  }));
  $$('[data-tema]', hoja).forEach((b) => (b.onclick = async () => {
    E.ajustes.tema = b.dataset.tema; await guardar(); aplicarTema();
    $$('[data-tema]', hoja).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  }));
  $$('[data-texto]', hoja).forEach((b) => (b.onclick = async () => {
    E.ajustes.texto = b.dataset.texto; await guardar(); aplicarTema();
    $$('[data-texto]', hoja).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  }));
  $$('[data-tono]', hoja).forEach((b) => (b.onclick = async () => {
    E.ajustes.tono = b.dataset.tono; await guardar();
    $$('[data-tono]', hoja).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  }));
  $('#aj-contraste').onchange = async (e) => { E.ajustes.contraste = e.target.checked; await guardar(); aplicarTema(); };
  $$('[data-ahorro]', hoja).forEach((b) => (b.onclick = async () => {
    E.ajustes.ahorro = b.dataset.ahorro; await guardar(); aplicarTema();
    $$('[data-ahorro]', hoja).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  }));
  $('#aj-creditos').onclick = () => abrirCreditos();
  pintarDictado(hoja);
  $('#aj-voz').onchange = (e) => { E.ajustes.voz = e.target.checked; guardar(); };
  $('#aj-vibrar').onchange = (e) => { E.ajustes.vibrar = e.target.checked; guardar(); };
  $('#aj-poster').onclick = (e) => botonPDF(e.currentTarget);
  $('#aj-collage').onclick = (e) => botonCollage(e.currentTarget);
  $('#aj-equipo').onclick = async () => { await cerrar(); pedirPIN(PIN, 'equipo', t('eq.pin')); };
  $('#aj-guia').onclick = async () => { await cerrar(); pedirPIN(E.paquete.guia.pin, 'guia', t('guia.pin')); };
  $('#aj-cerrar').onclick = cerrar;
  pintarIA(hoja);
  capa.onclick = (e) => { if (e.target === capa) cerrar(); };
}

export function aplicarTema() {
  const tema = E.ajustes.tema === 'auto' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'noche' : 'papel') : E.ajustes.tema;
  const raiz = document.documentElement;
  raiz.dataset.tema = tema;
  // Accesibilidad y ahorro (issue #22): tamaño del texto, alto contraste y ahorro de energía
  raiz.dataset.texto = E.ajustes.texto || 'n';
  raiz.classList.toggle('contraste', !!E.ajustes.contraste);
  raiz.classList.toggle('ahorro', E.ajustes.ahorro === 'si' || (E.ajustes.ahorro === 'auto' && bateriaBaja));
  // Aviso sin red de batería baja (#34): una vez, cuando la app ya cargó su paquete
  if (bateriaBaja && !avisoBateria && E.paquete) { avisoBateria = true; aviso(t(E.ajustes.ahorro === 'auto' ? 'aviso.bateriaAuto' : 'aviso.bateria'), 7000); }
  if (!bateriaBaja) avisoBateria = false;
}
let avisoBateria = false;
// Batería baja (Chrome en Android la informa; Safari no): con «Ahorro: automático» se activa solo
let bateriaBaja = false;
navigator.getBattery?.().then((bat) => {
  const revisar = () => {
    const antes = bateriaBaja;
    bateriaBaja = bat.level <= 0.2 && !bat.charging;
    if (antes !== bateriaBaja && E.paquete) aplicarTema(); // el aviso de batería baja sale en aplicarTema (#34)
  };
  bat.addEventListener('levelchange', revisar); bat.addEventListener('chargingchange', revisar); revisar();
}).catch(() => {});

// «Hablarle a Fray»: descarga opcional del reconocimiento de voz sin red (issue #38)
async function pintarDictado(hoja) {
  const box = $('.aj-dictado-estado', hoja);
  if (!box) return;
  const { dictadoListo } = await import('./chatui.js');
  const listo = await dictadoListo();
  box.textContent = t(listo ? 'aj.dictado.listo' : 'dic.activar');
}

// ---------- Créditos y licencias (licencias/README.md) ----------
// Lo exigen las licencias MIT, Apache-2.0, SIL OFL 1.1 y la de Copernicus. Los textos completos están en licencias/.
const COMPONENTES = [
  ['multilingual-e5-small', 'MIT', 'chat'], ['MobileNetV2 (ONNX Model Zoo)', 'Apache-2.0', 'lente'],
  ['ONNX Runtime Web 1.31.1 © Microsoft Corporation', 'MIT', 'motor'], ['@huggingface/tokenizers', 'Apache-2.0', 'chat'],
  ['jsQR', 'Apache-2.0', 'qr'], ['QR Code Generator © 2009 Kazuhiko Arase', 'MIT', 'qr'],
  ['Bricolage Grotesque © 2022 The Bricolage Grotesque Project Authors', 'SIL OFL 1.1', 'letra'],
  ['Atkinson Hyperlegible © 2020 Braille Institute of America, Inc.', 'SIL OFL 1.1', 'letra'],
];
const REPO_LICENCIAS = 'https://github.com/dsalazardev/espeletia-ai/tree/main/licencias';
export async function abrirCreditos() {
  const capa = $('#capa-ajustes');
  const rel = await (await import('./relieve.js')).cargar();
  capa.innerHTML = '';
  const hoja = h(`<div class="hoja hoja-creditos">
      <div class="hoja-asa" aria-hidden="true"></div>
      <h2 id="aj-titulo">${esc(t('aj.creditos'))}</h2>
      <p class="sub">${esc(t('cred.intro'))}</p>
      <ul class="creditos">${COMPONENTES.map(([n, l, u]) => `<li><b>${esc(n)}</b><span>${esc(l)} · ${esc(t(`cred.uso.${u}`))}</span></li>`).join('')}
        ${rel ? `<li><b>Copernicus DEM GLO-30</b><span>${esc(rel.meta.atribucion)}</span><span class="sub">${esc(rel.meta.descargo || '')} ${esc(t('cred.modificado'))}</span></li>` : ''}
        ${E.paquete.sendero?.fuente === 'osm' ? `<li><b>${esc(t('cred.osm'))}</b><span>${esc(t('cred.osmTxt'))}</span></li>` : ''}
        ${/Commons/.test(E.parque?.nota || '') ? `<li><b>${esc(t('cred.lente'))}</b><span>${esc(t('cred.lenteTxt'))}</span></li>` : ''}
        <li><b>${esc(t('cred.ilustraciones'))}</b><span>${esc(t('cred.ilustracionesTxt'))}</span></li>
        <li><b>${esc(t('cred.datos'))}</b><span>${esc(Object.values(E.paquete.fuentes || {}).map((f) => f.titulo).join(' · '))}</span></li>
      </ul>
      <p><a href="${REPO_LICENCIAS}" target="_blank" rel="noopener">${esc(t('cred.textos'))}</a></p>
      <button class="btn btn-flor btn-ancho" id="aj-cerrar">${esc(t('aj.cerrar'))}</button>
    </div>`);
  capa.appendChild(hoja);
  const yaAbierta = !capa.hidden;
  capa.hidden = false;
  const soltar = yaAbierta ? () => {} : atraparFoco(capa);
  $('h2', hoja).setAttribute('tabindex', '-1'); $('h2', hoja).focus();
  const cerrar = () => { capa.hidden = true; capa.innerHTML = ''; soltar(); };
  $('#aj-cerrar', hoja).onclick = cerrar;
  capa.onclick = (e) => { if (e.target === capa) cerrar(); };
}
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => E.paquete && aplicarTema());

// ---------- PIN con teclado propio ----------
function pedirPIN(clave, destino, titulo) {
  const capa = $('#capa-ajustes');
  capa.innerHTML = '';
  let v = '';
  const hoja = h(`<div class="hoja hoja-pin">
      <h2>${esc(titulo)}</h2>
      <div class="pin-puntos" aria-live="polite"><i></i><i></i><i></i><i></i></div>
      <div class="teclado">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((k) => `<button ${k === '' ? 'disabled aria-hidden="true"' : ''} data-k="${k}" ${k === '⌫' ? 'aria-label="Borrar"' : ''}>${k}</button>`).join('')}</div>
      <button class="btn btn-linea btn-ancho" data-x>${esc(t('cerrar'))}</button>
    </div>`);
  capa.appendChild(hoja);
  capa.hidden = false;
  const soltar = atraparFoco(capa);
  const pintar = () => $$('.pin-puntos i', hoja).forEach((p, i) => p.classList.toggle('lleno', i < v.length));
  const fin = () => { capa.hidden = true; capa.innerHTML = ''; soltar(); };
  $$('[data-k]', hoja).forEach((b) => (b.onclick = async () => {
    const k = b.dataset.k;
    if (k === '⌫') v = v.slice(0, -1); else if (v.length < 4) v += k;
    pintar(); vibrar(8);
    if (v.length === 4) {
      if (v === clave) { fin(); ctx.irA(destino); }
      else { vibrar([40, 40, 40]); await animar($('.pin-puntos', hoja), [{ transform: 'translateX(-10px)' }, { transform: 'translateX(10px)' }, { transform: 'translateX(0)' }], { duration: 260 }); aviso(t('eq.pinMal')); v = ''; pintar(); }
    }
  }));
  $('[data-x]', hoja).onclick = fin;
}

// ---------- Vista de equipo ----------
export function pintarEquipo() {
  const v = $('#v-equipo');
  v.innerHTML = '';
  v.appendChild(h(`<div class="equipo">
      <header class="campo-cab"><h2 id="eq-titulo">${esc(t('eq.titulo'))}</h2><button class="btn btn-linea btn-mini" id="eq-volver">${esc(t('eq.volver'))}</button></header>
      <p class="sub">${esc(t('eq.sub'))}</p>
      <details open><summary>${esc(t('eq.ensenar'))}</summary>
        <p class="sub">${esc(t('eq.ensenarSub'))}</p>
        <div class="mini-visor"><video id="video-eq" playsinline muted></video></div>
        <div id="clases" class="clases"></div>
        <div class="fila"><button id="eq-probar" class="btn btn-linea">${esc(t('eq.probar'))}</button><span id="eq-prueba" class="sub"></span></div>
        <div class="fila">
          <label class="btn btn-linea">${esc(t('eq.importar'))}<input id="eq-importar" type="file" accept=".json,application/json" hidden></label>
          <button id="eq-borrar" class="btn btn-peligro">${esc(t('eq.borrar'))}</button>
        </div>
      </details>
      <details open><summary>${esc(t('eq.publicar'))}</summary>
        <p class="sub">${esc(t('eq.publicarSub'))}</p>
        <p class="sub" id="eq-pub-estado"></p>
        <button id="eq-exportar" class="btn btn-flor btn-ancho">${esc(t('eq.publicarBtn'))}</button>
      </details>
      <details><summary>${esc(t('eq.estaciones'))}</summary><p class="sub">${esc(t('eq.estacionesSub'))}</p><ol id="eq-est" class="estaciones"></ol></details>
      <details><summary>${esc(t('eq.codigos'))}</summary><p class="sub">${esc(t('eq.codigosSub'))}</p><button id="eq-imprimir" class="btn btn-linea">${esc(t('eq.verCodigos'))}</button></details>
      <details><summary>${esc(t('eq.datos'))}</summary>
        <label class="interruptor"><input type="checkbox" id="eq-demo" ${E.ajustes.demo ? 'checked' : ''}><span>${esc(t('eq.demo'))}</span></label>
        <button id="eq-vaciar" class="btn btn-peligro">${esc(t('eq.vaciar'))}</button>
        <p class="sub">${esc(E.paquete.estado[E.lang])}</p>
      </details>
    </div>`));
  $('#eq-volver').onclick = () => ctx.irA('mapa');
  $('#eq-probar').onclick = probar;
  $('#eq-exportar').onclick = async () => {
    await ml.load().catch(() => {});
    descargar(new Blob([JSON.stringify(paqueteParque())], { type: 'application/json' }), 'parque.json');
    aviso(t('eq.publicado'), 5000);
  };
  $('#eq-importar').onchange = async (e) => {
    try {
      await ml.load();
      const data = await ml.importModel(await e.target.files[0].text());
      if (data.estaciones) { Object.assign(E.fijadas, data.estaciones); await guardar(); pintarEstaciones(); }
      pintarClases(); aviso(t('eq.importado'));
    } catch (err) { aviso(err.message, 4000); }
  };
  $('#eq-borrar').onclick = async () => { if (confirm(t('eq.borrarSeguro'))) { await ml.clearSamples(); pintarClases(); } };
  $('#eq-demo').onchange = async (e) => { E.ajustes.demo = e.target.checked; await guardar(); };
  $('#eq-vaciar').onclick = async () => { if (confirm(t('eq.vaciarSeguro'))) { await vaciar(); (await import('./bitacora.js')).borrar(); aviso(t('eq.vaciado')); } };
  $('#eq-imprimir').onclick = hojaCodigos;
  pintarEstaciones();
}

let streamEq = null;
export async function entrarEquipo() {
  pintarEquipo();
  try {
    streamEq = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    const v = $('#video-eq'); v.srcObject = streamEq; await v.play().catch(() => {});
  } catch (e) { console.warn(e); }
  await ml.load().catch(() => {});
  pintarClases();
  iniciarGPS();
}
export function salirEquipo() { if (streamEq) { streamEq.getTracks().forEach((x) => x.stop()); streamEq = null; } }

// El paquete del parque: lo que el equipo enseñó a la Lente y las estaciones fijadas en campo.
// Se guarda como models/parque.json en el repositorio y todos los teléfonos lo reciben al abrir la app.
function paqueteParque() {
  const est = {};
  for (const e of estaciones()) if (e.fijada) est[e.id] = { lat: +e.lat.toFixed(6), lon: +e.lon.toFixed(6), ...(e.altura ? { altura: e.altura } : {}) };
  return { tipo: 'paramo-parque', version: 1, fecha: new Date().toISOString().slice(0, 10), lente: ml.codificar(), estaciones: est };
}

function pintarPublicar() {
  const el = $('#eq-pub-estado');
  if (!el) return;
  const c = ml.counts(), b = ml.counts({ soloBase: true });
  const clases = E.paquete.clases.filter((k) => (c[k.id] || 0) >= E.paquete.camara.minPorClase).length;
  const fij = estaciones().filter((e) => e.fijada).length;
  el.textContent = t('eq.pubEstado', { clases, total: E.paquete.clases.length, fotos: Object.values(c).reduce((a, x) => a + x, 0), base: Object.values(b).reduce((a, x) => a + x, 0), fij, est: estaciones().length, fecha: E.parque?.fecha || '—' });
}

function pintarClases() {
  const box = $('#clases');
  if (!box) return;
  pintarPublicar();
  const cont = ml.counts();
  box.innerHTML = '';
  for (const k of E.paquete.clases) {
    const n = cont[k.id] || 0;
    const fila = h(`<div class="clase">
        <span><b>${esc(k[E.lang])}</b>${k.ayuda ? `<small>${esc(k.ayuda[E.lang])}</small>` : ''}<small class="cuenta ${n >= 15 ? 'lista' : ''}">${esc(t('eq.fotos', { n }))}${n >= 15 ? ` — ${esc(t('eq.lista'))}` : ''}</small></span>
        <span class="clase-btns"><label class="btn btn-linea btn-mini">${esc(t('eq.galeria'))}<input type="file" accept="image/*" multiple hidden></label><button class="btn btn-flor btn-mini" data-c="${k.id}">${esc(t('eq.mas'))}</button></span>
      </div>`);
    const b = $('button', fila);
    const una = async () => {
      const v = $('#video-eq');
      if (!v?.videoWidth || !ml.ready()) return;
      await ml.addSample(k.id, v);
      vibrar(12);
      const nn = ml.counts()[k.id] || 0;
      $('.cuenta', fila).textContent = `${t('eq.fotos', { n: nn })}${nn >= 15 ? ` — ${t('eq.lista')}` : ''}`;
      $('.cuenta', fila).classList.toggle('lista', nn >= 15);
      pintarPublicar();
    };
    b.onclick = una;
    // Desde la galería: varias fotos a la vez, una por una para no llenar la memoria
    $('input[type=file]', fila).onchange = async (e) => {
      const files = [...e.target.files]; e.target.value = '';
      if (!files.length) return;
      try { await ml.load(); } catch (err) { aviso(t('lente.sinModelo')); return; }
      const cu = $('.cuenta', fila);
      let ok = 0;
      for (const [i, f] of files.entries()) {
        cu.textContent = t('eq.galeriaProg', { i: i + 1, n: files.length });
        try { await ml.addSampleImagen(k.id, f); ok++; } catch (err) { console.warn('foto no válida', f.name, err); }
      }
      aviso(t('eq.galeriaOk', { n: ok, cosa: k[E.lang] }));
      pintarClases();
    };
    let rafaga = null;
    b.onpointerdown = () => { rafaga = setTimeout(function r() { una(); rafaga = setTimeout(r, 280); }, 450); };
    b.onpointerup = b.onpointerleave = b.onpointercancel = () => clearTimeout(rafaga);
    box.appendChild(fila);
  }
}

async function probar() {
  const v = $('#video-eq');
  const r = await ml.classify(v, E.paquete.camara);
  if (!r) { $('#eq-prueba').textContent = t('eq.sinFotos'); return; }
  const k = E.paquete.clases.find((c) => c.id === r.clase);
  $('#eq-prueba').textContent = `${t('eq.prueba', { cosa: k[E.lang], p: Math.round(r.certeza * 100) })} ${r.confianza < (ml.umbral() ?? E.paquete.camara.umbral) ? t('eq.pruebaBaja') : ''}`;
}

function pintarEstaciones() {
  const ol = $('#eq-est');
  ol.innerHTML = '';
  estaciones().forEach((e, i) => {
    const li = h(`<li><span class="est-num">${i + 1}</span><span class="est-txt"><b>${esc(e.nombre)}</b><small>${e.lat.toFixed(5)}, ${e.lon.toFixed(5)} — ${e.radio} m — ${esc(e.fijada ? t('eq.fijada') : t('eq.aprox'))}</small></span></li>`);
    const b = h(`<button class="btn btn-linea btn-mini">${esc(t('eq.fijar'))}</button>`);
    b.onclick = async () => {
      const p = E.posicion;
      if (!p) { iniciarGPS(); aviso(t('eq.esperaGps')); return; }
      if (p.precision > 30) { aviso(t('eq.precision', { m: Math.round(p.precision) }), 3500); return; }
      await fijarEstacion(e.id, p);
      aviso(t('eq.fijadaOk', { est: e.nombre }));
      pintarEstaciones(); pintarPublicar();
    };
    li.appendChild(b);
    ol.appendChild(li);
  });
}

function hojaCodigos() {
  const qrs = cromos().filter((c) => c.tipo === 'qr').map((c) => {
    const q = window.qrcode(0, 'M'); q.addData(c.codigo); q.make();
    return `<figure><img src="${q.createDataURL(8, 2)}" alt="QR ${esc(c.codigo)}"><figcaption><b>${c.n}. ${esc(texto(c).nombre)}</b><br>${esc(c.codigo)}</figcaption></figure>`;
  }).join('');
  const guias = `<li>${esc(t('eq.codigosGuia', { pin: E.paquete.guia.pin }))}</li>`;
  const w = window.open('', '_blank');
  if (!w) { aviso(t('eq.ventanas')); return; }
  w.document.write(`<!DOCTYPE html><html lang="${E.lang}"><head><meta charset="utf-8"><title>${esc(t('eq.codigos'))}</title>
    <style>body{font-family:system-ui,sans-serif;color:#1d2b38;padding:24px}h1{margin:0 0 4px}.qrs{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}figure{margin:0;text-align:center;border:1px dashed #9aa;padding:10px;break-inside:avoid}img{width:100%;image-rendering:pixelated}code{font-size:1.3em}</style>
    </head><body><h1>${esc(t('titulo'))}</h1><p>${esc(t('eq.codigosSub'))}</p><div class="qrs">${qrs}</div><h2>${esc(t('tipo.guia'))}</h2><ul>${guias}</ul><p><small>${esc(E.paquete.estado[E.lang])}</small></p></body></html>`);
  w.document.close();
}

// Resultado de la revisión de archivos guardados (escalera de degradación)
function archivosTxt() {
  const r = ultimaRevision, pend = danados();
  if (!r && !pend.length) return '';
  const nombre = (ruta) => ruta.split('/').pop();
  const filas = (r || pend.map((ruta) => ({ ruta, estado: 'danado' }))).filter((x) => x.estado !== 'ok' || r);
  return `<ul>${filas.map((x) => `<li class="ia-${x.estado === 'ok' || x.estado === 'reparado' ? 'ok' : x.estado === 'falta' ? 'parcial' : 'no'}"><span class="punto"></span>${esc(nombre(x.ruta))}: ${esc(t(`aj.archivos.${x.estado}`))}</li>`).join('')}</ul>`;
}

// ---------- Estado de la IA: qué modelo cargó y, si falló, por qué ----------
function pintarIA(hoja) {
  const box = $('#aj-ia', hoja);
  const lente = ml.ready() ? 'ok' : 'no';
  const ch = !chat.listo() ? 'no' : chat.modoLexico() ? 'parcial' : 'ok';
  const fila = (nombre, st) => `<li class="ia-${st}"><span class="punto"></span>${esc(nombre)}: ${esc(t(`aj.ia.${st}`))}</li>`;
  box.innerHTML = `<p class="ia-titulo">${esc(t('aj.ia.titulo'))}</p><ul>${fila(t('nav.lente'), lente)}${fila(t('nav.chat'), ch)}</ul>
    ${Object.keys(tiempos).length ? `<details><summary>${esc(t('aj.ia.tiempos'))}</summary><pre>${esc(Object.entries(tiempos).map(([k, v]) => `${k === 'vision' ? t('nav.lente') : t('nav.chat')}: ${((v.total ?? v.espera) / 1000).toFixed(1)} s` + (v.sesion != null ? ` (${t('aj.ia.leer')} ${v.leer} ms · ${t('aj.ia.preparar')} ${v.sesion} ms${v.tokenizador ? ` · tokenizador ${v.tokenizador} ms` : ''}${v.motor ? ` · motor ${v.motor} ms` : ''} · ${v.origen})` : '')).join('\n'))}</pre></details>` : ''}
    ${errores.length ? `<details><summary>${esc(t('aj.ia.detalle'))}</summary><pre>${esc([...new Set(errores)].slice(-6).join('\n'))}</pre></details>` : ''}
    ${lente !== 'ok' || ch !== 'ok' ? `<button class="btn btn-linea btn-ancho" id="aj-ia-probar">${esc(t('aj.ia.probar'))}</button>` : ''}
    <div class="aj-archivos" aria-live="polite">${archivosTxt()}</div>
    <button class="btn btn-linea btn-ancho" id="aj-revisar">${esc(t('aj.archivos.revisar'))}</button>`;
  $('#aj-revisar', box).onclick = async (e) => {
    const bt = e.currentTarget; bt.disabled = true; bt.textContent = t('aj.archivos.revisando');
    await revisarArchivos({ reparar: true });
    pintarIA(hoja);
  };
  const b = $('#aj-ia-probar', box);
  if (b) b.onclick = async () => {
    b.disabled = true; b.textContent = t('aj.ia.cargando');
    await Promise.allSettled([ml.load(), chat.reintentar()]);
    pintarIA(hoja);
  };
}
