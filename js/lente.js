// La Lente: reconoce cosas del páramo, lee QR y toma fotos (grupo o "ponerle mi foto").
import * as ml from './ml.js';
import { E, cromo as getCromo, cromos, texto, nombreClase, tiene, ganar, pendienteDeClase, bloqueadoDeClase, ponerFoto } from './estado.js';
import * as guia from './guia.js';
import { t } from './i18n.js';
import { $, $$, h, esc, animar, vibrar, hablar, aviso, ahorro, escuchar, reducido } from './util.js';
import * as est from './estado.js';
import { personajes } from './art.js';

const MAX_MS = 3 * 60 * 1000; // la cámara se apaga sola para cuidar la batería en frío
const maxMs = () => (ahorro() ? 90 * 1000 : MAX_MS); // con ahorro de energía, antes
let stream = null, bucle = null, apagado = null, ocupado = false, frente = false;
let modo = 'reconocer', objetivo = null, ultimoId = null, qr = null, activa = false;
let alGanar = async () => {};
let alPreguntar = () => {};
let ultimoQR = null; // para no procesar dos veces el mismo QR del guía mientras sigue en el visor

export function iniciarLente({ onGanar, onPreguntar }) {
  alGanar = onGanar; alPreguntar = onPreguntar || alPreguntar;
  $$('.lente-modo button').forEach((b) => (b.onclick = () => ponerModo(b.dataset.modo)));
  $('#lente-encender').onclick = () => encender();
  $('#disparar').onclick = disparar;
  $('#foto-cancelar').onclick = () => { objetivo = null; ponerModo('reconocer'); };
  $('#foto-girar').onclick = async () => { frente = !frente; apagarStream(); await encender(); };
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) apagarStream();
    else if (activa) encender(); // al volver a la app, la Lente se reactiva sola
  });
  if ('BarcodeDetector' in window) {
    BarcodeDetector.getSupportedFormats?.().then((f) => { if (f.includes('qr_code')) qr = new BarcodeDetector({ formats: ['qr_code'] }); }).catch(() => {});
  }
  personaje('fray');
}

export async function entrar(m) {
  activa = true;
  if (m) ponerModo(m);
  else ponerModo(modo);
  const conCamara = await encender();
  // En una estación (y quieto): aparece el personaje del cromo de esa estación
  const e = est.estacionActual();
  if (conCamara && e) companero(cromos().find((k) => k.tipo === 'gps' && k.estacion === e.id));
  if (!ml.ready()) {
    // Sin cámara, el mensaje que importa es el de la cámara (y su plan B): no se tapa con el del modelo
    if (conCamara) decir(t('lente.cargando'));
    try { await ml.load(); if (conCamara && modo === 'reconocer' && !compaHablo) decir(t('lente.apunta')); }
    catch (e) { console.error(e); if (conCamara && !compaHablo) decir(t('lente.sinModelo')); }
  }
}
export function salir() { activa = false; apagarStream(); }

export function pedirFoto(id, msg) {
  objetivo = { id, msg };
  if (frente) { frente = false; apagarStream(); }
}

function personaje(n) { $('#pj').innerHTML = personajes[n](84); }

// ---------- Compañeros 2D en la cámara (spec companeros-2d-camara, issue #16) ----------
// El personaje del cromo aparece sobre la imagen en un «encuentro»: en una estación, cuando la Lente está segura o con un
// QR. Nunca si el GPS dice que el visitante camina. Al tocarlo cuenta el dato (con fuente) y ofrece la foto con él.
let compa = null, inclinar = null, compaHablo = false; // compaHablo: el visitante tocó al personaje y está leyendo su dato
function companero(c) {
  if (!c?.personaje || !personajes[c.personaje] || est.caminando() || !stream) return;
  compa = c;
  let el = $('#companero');
  if (!el) {
    el = h(`<button type="button" id="companero" class="companero"></button>`);
    $('.lente-marco').appendChild(el);
    el.onclick = tocarCompanero;
  }
  el.innerHTML = personajes[c.personaje](150);
  el.setAttribute('aria-label', t('compa.tocar', { nombre: t(`pj.${c.personaje}`) }));
  el.dataset.pj = c.personaje;
  el.hidden = false;
  animar(el, [{ opacity: 0, transform: 'translateY(30px) scale(.8)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.3,1.4,.5,1)' });
  paralaje(true);
}
function quitarCompanero() {
  const el = $('#companero');
  if (el) el.hidden = true;
  $('#lente-foto-pj')?.remove();
  compa = null; compaHablo = false; paralaje(false);
}
// Paralaje leve al inclinar el teléfono (DeviceOrientation). En iPhone pide permiso con un toque; si lo niega, queda fijo.
function paralaje(on) {
  if (inclinar) { removeEventListener('deviceorientation', inclinar); inclinar = null; }
  if (!on || reducido()) return;
  inclinar = (e) => {
    const el = $('#companero');
    if (!el || e.gamma == null) return;
    const x = Math.max(-14, Math.min(14, e.gamma / 3)), y = Math.max(-10, Math.min(10, (e.beta - 60) / 5));
    el.style.translate = `${x}px ${y}px`;
  };
  addEventListener('deviceorientation', inclinar);
}
async function tocarCompanero() {
  if (!compa) return;
  const DOE = window.DeviceOrientationEvent;
  if (DOE?.requestPermission && !reducido()) { try { if ((await DOE.requestPermission()) === 'granted') paralaje(true); } catch (e) { /* queda fijo */ } }
  const tx = texto(compa), f = E.paquete.fuentes?.[compa.fuente];
  compaHablo = true;
  decir(`${tx.dato}${f ? ` (${t('det.fuente', { f: f.titulo })})` : ''}`);
  const bEsc = $('#lente-escuchar'), c = compa;
  bEsc.hidden = false; bEsc.onclick = () => escuchar({ texto: `${tx.nombre}. ${tx.dato}`, textoAudio: tx.dato, lang: E.lang, tipo: 'cromo', id: c.id });
  if (!$('#lente-foto-pj')) {
    const b = h(`<button id="lente-foto-pj" class="btn btn-flor" type="button">${esc(t('compa.foto', { nombre: t(`pj.${compa.personaje}`) }))}</button>`);
    b.onclick = fotoConPersonaje;
    $('.globo .acciones').prepend(b);
  }
}
// Foto compuesta: el cuadro de la cámara con el personaje donde se ve en pantalla. Se guarda para el collage.
async function fotoConPersonaje() {
  const v = $('#video'), el = $('#companero');
  if (!v.videoWidth || !compa || !el) return;
  const cv = lienzo(v, 1600), ctx = cv.getContext('2d');
  // Dónde está el personaje respecto del video visible (object-fit: cover recorta la imagen)
  const marco = v.getBoundingClientRect(), r = el.getBoundingClientRect();
  const k = Math.max(marco.width / cv.width, marco.height / cv.height);
  const offX = (cv.width * k - marco.width) / 2, offY = (cv.height * k - marco.height) / 2;
  const x = (r.left - marco.left + offX) / k, y = (r.top - marco.top + offY) / k, w = r.width / k, hh = r.height / k;
  const img = await (await import('./exportar.js')).svgImg(personajes[compa.personaje](300)); // con xmlns y estilos
  ctx.drawImage(img, x, y, w, hh);
  const blob = await new Promise((ok) => cv.toBlob(ok, 'image/jpeg', 0.88));
  await est.guardarFotoPersonaje(blob, { personaje: compa.personaje, cromo: compa.id });
  vibrar(40);
  aviso(t('compa.guardada'), 3000);
  window.__ultimaFotoPj = { bytes: blob.size, personaje: compa.personaje };
}
function decir(msg) { $('#lente-msg').textContent = msg; }

export function ponerModo(m) {
  if (m !== 'foto' && objetivo && m !== modo) objetivo = null;
  modo = objetivo ? 'foto' : m;
  $$('.lente-modo button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.modo === modo)));
  const enFoto = modo === 'foto';
  $('.lente-modo').hidden = enFoto;
  $('#lente-foto-barra').hidden = !enFoto;
  $('#disparar').hidden = !enFoto;
  $('#v-lente').dataset.modo = modo;
  $('#lente-abrir').hidden = true; $('#lente-escuchar').hidden = true; $('#lente-preguntar').hidden = true;
  $('#lente-chip').hidden = true;
  fijar(false);
  ultimoId = null; ultimoQR = null;
  if (modo === 'qr') decir(t('lente.qrApunta'));
  else if (enFoto) decir(objetivo?.msg || t('lente.foto'));
  else decir(ml.ready() ? t('lente.apunta') : t('lente.cargando'));
  personaje('fray');
  if (stream) arrancar();
}

async function encender() {
  if (!navigator.mediaDevices?.getUserMedia) { decir(t('lente.https')); return false; }
  const v = $('#video');
  try {
    if (!stream) stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: frente ? 'user' : 'environment', width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false });
    v.srcObject = stream;
    v.classList.toggle('espejo', frente);
    await v.play().catch(() => {});
    $('#lente-apagada').hidden = true;
    clearTimeout(apagado);
    apagado = setTimeout(() => { apagarStream(); cartelApagada('lente.apagada', 'lente.encender'); aviso(t('lente.apagada')); }, maxMs());
    arrancar();
    return true;
  } catch (e) {
    console.warn(e);
    decir(t(e?.name === 'NotAllowedError' ? 'lente.permisoNegado' : 'lente.sinCamara'));
    // Antes decía «se apagó para ahorrar batería», que no era lo que pasaba
    cartelApagada(e?.name === 'NotAllowedError' ? 'lente.cartelSinPermiso' : 'lente.cartelSinCamara', 'lente.reintentar');
    planB();
    return false;
  }
}

// Cartel sobre el visor cuando no hay imagen: por ahorro de batería o porque la cámara no abrió
function cartelApagada(texto, boton) {
  $('#lente-apagada-txt').textContent = t(texto);
  $('#lente-encender').textContent = t(boton);
  $('#lente-apagada').hidden = false;
}

// Sin cámara (permiso negado o sin cámara): el guía confirma lo que el visitante ve, con su código de 4 dígitos.
// Las historias y las estaciones ya tienen su código en el álbum y en el mapa (spec escalera-degradacion-ui).
function planB() {
  if ($('#lente-planb')) return;
  const clases = E.paquete.clases.filter((k) => k.id !== 'otro');
  const box = h(`<details id="lente-planb" class="plan-b lente-planb" open>
      <summary>${esc(t('lente.planB'))}</summary>
      <p class="sub">${esc(t('lente.planBSub'))}</p>
      <label class="lente-planb-et" for="planb-clase">${esc(t('lente.planBQue'))}</label>
      <select id="planb-clase">${clases.map((k) => `<option value="${esc(k.id)}">${esc(k[E.lang] || k.es)}</option>`).join('')}</select>
      <div class="lente-planb-cod"></div>
      <p class="sub">${esc(t('lente.planBOtros'))}</p>
    </details>`);
  const poner = () => {
    const cont = $('.lente-planb-cod', box); cont.innerHTML = '';
    cont.appendChild(guia.formCodigo(`c:${$('#planb-clase', box).value}`, async (r) => {
      if (r.ganado) { await alGanar(r.ganado); return; }
      decir(t(r.msg, r.vars));
    }));
  };
  $('#planb-clase', box).onchange = poner;
  poner();
  $('.globo').appendChild(box);
}

function apagarStream() {
  ml.olvidarCuadros();
  clearInterval(bucle); bucle = null; clearTimeout(apagado);
  quitarCompanero();
  if (stream) { stream.getTracks().forEach((tr) => tr.stop()); stream = null; }
  $('#video').srcObject = null;
}

function arrancar() {
  clearInterval(bucle); ml.olvidarCuadros();
  if (modo === 'foto') return;
  bucle = setInterval(modo === 'qr' ? pasoQR : pasoReconocer, (modo === 'qr' ? 320 : 650) * (ahorro() ? 2 : 1)); // ahorro: la mitad de cuadros
}

function fijar(on) { $('#v-lente').classList.toggle('fijada', on); }

async function pasoReconocer() {
  const v = $('#video');
  if (ocupado || !v.videoWidth || !ml.ready()) return;
  if (compaHablo) return; // el visitante está leyendo lo que contó el personaje: no se le cambia el mensaje
  ocupado = true;
  try {
    const cfg = E.paquete.camara;
    const conteo = ml.counts();
    const clasesListas = Object.values(conteo).filter((n) => n >= cfg.minPorClase).length;
    if (clasesListas < 2) { decir(t('lente.sinEntrenar')); return; }
    const r = await ml.classify(v, { ...cfg, seguido: true });
    if (compaHablo || modo !== 'reconocer') return; // mientras se calculaba, el visitante tocó al personaje o cambió de modo
    const chip = $('#lente-chip');
    if (!r || r.clase === 'otro' || r.confianza < cfg.umbral) {
      fijar(false); personaje('fray');
      decir(t('lente.duda'));
      if (r && r.clase !== 'otro' && r.confianza > 0.3) { chip.hidden = false; chip.textContent = t('lente.quiza', { cosa: nombreClase(r.clase).toLowerCase() }); }
      else chip.hidden = true;
      $('#lente-abrir').hidden = true; $('#lente-escuchar').hidden = true; $('#lente-preguntar').hidden = true; ultimoId = null;
      return;
    }
    const pendiente = pendienteDeClase(r.clase);
    const c = pendiente || cromos().find((k) => k.tipo === 'camara' && k.clase === r.clase);
    const tx = texto(c);
    fijar(true); personaje(c.personaje);
    if (compa?.id !== c.id) companero(c); // la Lente está segura: encuentro
    chip.hidden = false;
    chip.textContent = `${nombreClase(r.clase)} — ${t('lente.seguridad', { p: Math.round(r.confianza * 100) })}`;
    decir(tx.dato);
    const esc = $('#lente-escuchar');
    esc.hidden = false; esc.onclick = () => escuchar({ texto: `${tx.nombre}. ${tx.dato}`, textoAudio: tx.dato, lang: E.lang, tipo: 'cromo', id: c.id });
    // Unión con el chat: solo cuando la Lente está segura (ya pasó el umbral de confianza)
    const pr = $('#lente-preguntar');
    pr.hidden = !c.ficha; pr.onclick = () => alPreguntar(c.id, { clase: r.clase, confianza: r.confianza });
    const ab = $('#lente-abrir');
    if (pendiente) {
      ab.hidden = false; ab.disabled = false; ab.textContent = t('lente.abrirSobre');
      if (ultimoId !== pendiente.id) { ultimoId = pendiente.id; vibrar(50); animar(ab, [{ transform: 'scale(.9)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], { duration: 300 }); }
      ab.onclick = async () => {
        ab.disabled = true;
        const foto = await capturar(v);
        await ganar(pendiente.id, { foto });
        await alGanar(pendiente.id);
      };
    } else if (bloqueadoDeClase(r.clase)?.otraPlanta) {
      ab.hidden = true;
      decir(`${tx.dato} ${t('lente.otraPlanta')}`);
    } else {
      ab.hidden = false; ab.disabled = true; ab.textContent = t('lente.yaLoTienes');
    }
  } catch (e) { console.error(e); } finally { ocupado = false; }
}

async function pasoQR() {
  const v = $('#video');
  if (ocupado || !v.videoWidth) return;
  ocupado = true;
  try {
    let valor = null;
    if (qr) { const res = await qr.detect(v); valor = res[0]?.rawValue || null; }
    else if (window.jsQR) {
      const cv = lienzo(v, 520);
      const d = cv.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, cv.width, cv.height);
      valor = window.jsQR(d.data, d.width, d.height, { inversionAttempts: 'attemptBoth' })?.data || null;
    }
    if (!valor) return;
    const chip = $('#lente-chip');
    if (guia.esDelGuia(valor)) {
      if (valor === ultimoQR) return;
      ultimoQR = valor;
      // QR del teléfono del guía: se verifica la firma con el reloj, sin internet
      const g = await guia.leerQR(valor);
      if (!g) { decir(t('lente.qrAjeno')); return; }
      if (g.vencido) { decir(t('guia.vencido')); return; }
      const r = await guia.aplicar(g);
      if (r.parada) {
        // Parada narrada: primero el texto (y el cromo si el guía ya terminó la explicación)
        clearInterval(bucle); bucle = null;
        await guia.mostrarParada(r.parada, { ganado: r.ganado });
        if (r.ganado) { await alGanar(r.ganado); return; }
        if (r.msg) decir(t(r.msg, r.vars));
        ultimoQR = null; arrancar();
        return;
      }
      if (r.ganado) {
        fijar(true); vibrar([30, 40, 30]); personaje(getCromo(r.ganado).personaje); companero(getCromo(r.ganado));
        clearInterval(bucle); bucle = null;
        await alGanar(r.ganado);
      } else { vibrar(30); decir(t(r.msg, r.vars)); }
      return;
    }
    const c = cromos().find((k) => k.tipo === 'qr' && k.codigo === valor.trim());
    if (!c) { decir(t('lente.qrAjeno')); chip.hidden = true; return; }
    personaje(c.personaje); companero(c);
    if (tiene(c.id)) { decir(t('lente.qrRepetido', { n: c.n, nombre: texto(c).nombre })); return; }
    fijar(true); vibrar([30, 40, 30]);
    clearInterval(bucle); bucle = null;
    await ganar(c.id);
    await alGanar(c.id);
  } catch (e) { console.error(e); } finally { ocupado = false; }
}

function lienzo(v, lado = 1100) {
  const w = v.videoWidth, hh = v.videoHeight, s = Math.min(1, lado / Math.max(w, hh));
  const cv = document.createElement('canvas');
  cv.width = Math.round(w * s); cv.height = Math.round(hh * s);
  const ctx = cv.getContext('2d');
  if (frente) { ctx.translate(cv.width, 0); ctx.scale(-1, 1); }
  ctx.drawImage(v, 0, 0, cv.width, cv.height);
  return cv;
}
const capturar = (v) => new Promise((ok) => lienzo(v).toBlob(ok, 'image/jpeg', 0.86));

async function disparar() {
  if (!objetivo || !stream) return;
  const v = $('#video');
  // Destello de obturador
  const fl = $('.lente-marco');
  animar(fl, [{ boxShadow: 'inset 0 0 0 999px rgba(255,255,255,.85)' }, { boxShadow: 'inset 0 0 0 999px rgba(255,255,255,0)' }], { duration: 320 });
  vibrar(40);
  const foto = await capturar(v);
  const { id } = objetivo;
  objetivo = null;
  frente = false;
  if (tiene(id)) {
    await ponerFoto(id, foto);
    aviso(t('lente.fotoPuesta'));
    await alGanar(id, { soloFoto: true });
  } else {
    await ganar(id, { foto });
    await alGanar(id);
  }
  ponerModo('reconocer');
}
