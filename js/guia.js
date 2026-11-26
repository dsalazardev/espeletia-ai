// Modo guía: el guía (obligatorio en el parque) entrega cromos y confirmaciones sin internet.
// Su teléfono muestra un QR y un código de 4 dígitos que cambian cada pocos minutos. Ambos son una
// firma HMAC-SHA256 de "qué se entrega" + "franja de tiempo", con una clave que conoce la app.
// El visitante escanea el QR (Lente → Leer QR) o escribe el código; su teléfono verifica la firma
// con el reloj local, sin conexión. Cada código sirve una sola vez por teléfono.
//
// Acciones:  h:<cromo>   historia contada por el guía
//            e:<estación> «llegamos a esta estación» (cuando el GPS falla) y «estamos en el parque»
//            aqui        «estamos en el parque»: habilita la pausa y la foto de grupo
//            c:<clase>   «confirmo lo que ve la Lente» (cuando la Lente duda o no está entrenada)
//            p:<parada>  parada narrada: el visitante lee/escucha el texto en su idioma (no se gasta)
//            pf:<parada> «terminé la explicación»: entrega el cromo de la parada, una vez por teléfono
//            r:<HHMM>    hora de regreso fijada por el guía (avisos sin red, issue #34)
import { E, cromos, cromo, texto, estaciones, nombreClase, tiene, ganar, visitar, pendienteDeClase, marcarAqui, guardar } from './estado.js';
import { t } from './i18n.js';
import { $, $$, h, esc, aviso, vibrar, animar, mantenerDespierta, hablar, callar, atraparFoco, escuchar } from './util.js';

const enc = new TextEncoder();
const VENTANA = [-2, -1, 0, 1]; // franjas aceptadas: ~10 min hacia atrás y 1 adelante (relojes desfasados)
let llave = null;

const cfg = () => E.paquete.guia;
// Hora de regreso (r:HHMM): se guarda en este teléfono y vale solo el día en que se fijó
const hoy = () => new Date().toLocaleDateString('en-CA');
export function fijarRegreso(hhmm) { try { localStorage.setItem('paramo-regreso', JSON.stringify({ hhmm, dia: hoy() })); } catch (e) { /* */ } }
export function horaRegreso() {
  try { const r = JSON.parse(localStorage.getItem('paramo-regreso')); if (r?.dia === hoy()) return { hhmm: r.hhmm, guia: true }; } catch (e) { /* */ }
  const c = E.paquete?.horario?.cierre; // si el guía no la fijó: el cierre oficial del sector
  return c ? { hhmm: c.replace(':', ''), guia: false } : null;
}
export const paradas = () => E.paquete.paradas || [];
const parada = (id) => paradas().find((p) => p.id === id);
const franjaMs = () => (cfg().franjaMin || 5) * 60000;
export const franja = (ms = Date.now()) => Math.floor(ms / franjaMs());

async function hmac(txt) {
  llave ??= await crypto.subtle.importKey('raw', enc.encode(cfg().clave), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const s = await crypto.subtle.sign('HMAC', llave, enc.encode(txt));
  return [...new Uint8Array(s)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
const firma = async (accion, f) => (await hmac(`${accion}|${f}`)).slice(0, 12);
export async function codigo(accion, f = franja()) {
  const x = await hmac(`cod|${accion}|${f}`);
  return String(parseInt(x.slice(0, 8), 16) % 10000).padStart(4, '0');
}
// El QR lleva la dirección de la app con el código después de «#»: así la cámara del iPhone (o de Android)
// abre la app en vez de mostrar un texto suelto. La Lente lee las dos formas: la dirección y el texto solo.
export async function contenidoQR(accion, f = franja()) {
  const base = `${location.origin}${location.pathname.replace(/index\.html$/, '')}`;
  return `${base}#${encodeURIComponent(`PARAMO-G|${accion}|${f}|${await firma(accion, f)}`)}`;
}
// Saca «PARAMO-G|…» de un texto o de una dirección con «#PARAMO-G…»
export function textoGuia(txt) {
  if (typeof txt !== 'string') return null;
  let x = txt.trim();
  const i = x.indexOf('#');
  if (i >= 0 && /^https?:/i.test(x)) { try { x = decodeURIComponent(x.slice(i + 1)); } catch (e) { return null; } }
  return x.startsWith('PARAMO-G|') ? x : null;
}
export const esDelGuia = (txt) => textoGuia(txt) !== null;
// Código de 4 dígitos de un QR válido, para escribirlo a mano donde no se puede aplicar (iPhone sin la app instalada)
export const codigoDe = ({ accion, f }) => codigo(accion, f);

// Devuelve { accion, f } si es válido, { vencido } si es viejo, o null si es falso
export async function leerQR(txt) {
  const tg = textoGuia(txt);
  if (!tg) return null;
  const p = tg.split('|');
  if (p.length !== 4 || p[0] !== 'PARAMO-G') return null;
  const [, accion, fs, sig] = p;
  const f = Number(fs);
  if (!Number.isInteger(f) || (await firma(accion, f)) !== sig) return null;
  if (!VENTANA.includes(f - franja())) return { vencido: true };
  return { accion, f };
}

async function leerCodigo(accion, cod) {
  const a = franja();
  for (const d of VENTANA) if ((await codigo(accion, a + d)) === cod) return { accion, f: a + d };
  return null;
}

// ---------- Intentos: 5 fallos seguidos bloquean 1 minuto (luego 2, 4…) ----------
const LS = 'paramo-intentos';
const leerInt = () => { try { return JSON.parse(localStorage.getItem(LS)) || { n: 0, hasta: 0, nivel: 0 }; } catch (e) { return { n: 0, hasta: 0, nivel: 0 }; } };
const guardarInt = (x) => { try { localStorage.setItem(LS, JSON.stringify(x)); } catch (e) { /* */ } };
export const esperaSegundos = () => Math.max(0, Math.ceil((leerInt().hasta - Date.now()) / 1000));
function fallo() {
  const x = leerInt();
  x.n++;
  if (x.n >= 5) { x.hasta = Date.now() + 60000 * 2 ** x.nivel; x.nivel = Math.min(x.nivel + 1, 4); x.n = 0; }
  guardarInt(x);
}
const acierto = () => guardarInt({ n: 0, hasta: 0, nivel: 0 });

// ---------- Aplicar lo que entrega el guía (en el teléfono del visitante) ----------
// Devuelve { ganado: id } o { msg: 'clave de i18n', vars }
export async function aplicar({ accion, f }) {
  const marca = `${accion}|${f}`;
  if (E.usados.includes(marca)) return { msg: 'guia.usado' };
  const [tipo, arg] = accion.split(':');
  let r;
  if (tipo === 'r') {
    // Hora de regreso del grupo: vale para hoy
    if (!/^([01]\d|2[0-3])[0-5]\d$/.test(arg || '')) return { msg: 'lente.qrAjeno' };
    fijarRegreso(arg);
    await marcarAqui();
    r = { msg: 'regreso.fijado', vars: { h: `${arg.slice(0, 2)}:${arg.slice(2)}` }, regreso: arg };
  } else if (tipo === 'p' || tipo === 'pf') {
    const pa = parada(arg);
    if (!pa) return { msg: 'lente.qrAjeno' };
    if (tipo === 'p') return { parada: pa.id }; // leer la parada no gasta el código
    await marcarAqui();
    const c = pa.cromo ? cromo(pa.cromo) : null;
    r = !c ? { parada: pa.id } : tiene(c.id) ? { parada: pa.id, msg: 'lente.qrRepetido', vars: { n: c.n, nombre: texto(c).nombre } } : (await ganar(c.id), { parada: pa.id, ganado: c.id });
  } else if (tipo === 'h') {
    const c = cromo(arg);
    if (!c || c.tipo !== 'guia') return { msg: 'lente.qrAjeno' };
    r = tiene(c.id) ? { msg: 'lente.qrRepetido', vars: { n: c.n, nombre: texto(c).nombre } } : (await ganar(c.id), { ganado: c.id });
  } else if (tipo === 'e') {
    const est = estaciones().find((e) => e.id === arg);
    if (!est) return { msg: 'lente.qrAjeno' };
    await visitar(est.id);
    await marcarAqui();
    const c = cromos().find((k) => k.tipo === 'gps' && k.estacion === est.id);
    r = c && !tiene(c.id) ? (await ganar(c.id, { estacionId: est.id }), { ganado: c.id }) : { msg: 'guia.aqui' };
  } else if (tipo === 'aqui') {
    await marcarAqui();
    r = { msg: 'guia.aqui' };
  } else if (tipo === 'c') {
    await marcarAqui();
    const c = pendienteDeClase(arg, { guia: true });
    r = c ? (await ganar(c.id), { ganado: c.id }) : { msg: 'guia.yaClase', vars: { cosa: nombreClase(arg).toLowerCase() } };
  } else return { msg: 'lente.qrAjeno' };
  E.usados.push(marca);
  await guardar();
  return r;
}

// ---------- Casilla para escribir el código del guía ----------
// alResultado(r) recibe lo que devolvió aplicar()
export function formCodigo(accion, alResultado, { etiqueta = t('codigo.etiqueta') } = {}) {
  const f = h(`<form class="codigo" autocomplete="off">
      <label class="codigo-et">${esc(etiqueta)}</label>
      <div class="codigo-fila">
        <input inputmode="numeric" pattern="[0-9]*" maxlength="4" placeholder="• • • •" enterkeyhint="done" aria-label="${esc(etiqueta)}">
        <button class="btn btn-flor">${esc(t('codigo.ok'))}</button>
      </div>
    </form>`);
  const inp = $('input', f);
  f.onsubmit = async (e) => {
    e.preventDefault();
    const espera = esperaSegundos();
    if (espera) { aviso(t('codigo.espera', { s: espera }), 3500); return; }
    const v = inp.value.trim();
    const ok = /^\d{4}$/.test(v) && (await leerCodigo(accion, v));
    if (ok) { acierto(); alResultado(await aplicar(ok)); return; }
    fallo();
    aviso(esperaSegundos() ? t('codigo.espera', { s: esperaSegundos() }) : t('codigo.mal'), 3500);
    vibrar([40, 40, 40]);
    animar(inp, [{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'translateX(-5px)' }, { transform: 'translateX(0)' }], { duration: 320 });
    inp.select();
  };
  return f;
}

// ---------- Pantalla del guía ----------
let reloj = null, despierto = null, sel = null, ultimaF = null, ctx = {}, finParada = false;
let regresoGuia = '1330'; // hora de regreso que el guía muestra (la cambia con el selector)
// Acción que muestra el QR: en una parada, «p:» mientras se explica y «pf:» cuando el guía marca que terminó
const accionActual = () => (sel.parada ? `${finParada ? 'pf' : 'p'}:${sel.parada}` : sel.accion);
export function iniciarGuia(c) { ctx = c; }

// Grupo «Hora de regreso»: un selector de hora y el botón que muestra su QR
function grupoRegreso(o) {
  const hm = `${regresoGuia.slice(0, 2)}:${regresoGuia.slice(2)}`;
  return `<fieldset class="guia-grupo"><legend>${esc(t('guia.g.regreso'))}</legend><div class="guia-ops guia-regreso">
    <label for="guia-regreso-h" class="sr-only">${esc(t('guia.regresoEt'))}</label><input type="time" id="guia-regreso-h" value="${hm}" step="300">
    <button type="button" id="guia-regreso-b" data-a="r:" aria-pressed="${!!sel?.regreso}">${esc(t('guia.regresoBtn'))}</button></div></fieldset>`;
}

function opciones() {
  return {
    historias: cromos().filter((c) => c.tipo === 'guia').map((c) => ({ accion: `h:${c.id}`, nombre: texto(c).nombre, guion: texto(c).dato, n: c.n })),
    estaciones: estaciones().map((e, i) => ({ accion: `e:${e.id}`, nombre: `${i + 1}. ${e.nombre}`, guion: t('guia.guionEst') })),
    aqui: [{ accion: 'aqui', nombre: t('guia.aquiNombre'), guion: t('guia.guionAqui') }],
    lente: E.paquete.clases.filter((k) => k.id !== 'otro').map((k) => ({ accion: `c:${k.id}`, nombre: k[E.lang] || k.es, guion: t('guia.guionLente') })),
    regreso: [{ accion: `r:${regresoGuia}`, regreso: true, nombre: t('guia.regresoNombre', { h: `${regresoGuia.slice(0, 2)}:${regresoGuia.slice(2)}` }), guion: t('guia.guionRegreso') }],
    paradas: paradas().map((p, i) => ({ accion: `p:${p.id}`, parada: p.id, nombre: `${i + 1}. ${p.titulo[E.lang] || p.titulo.es}`, guion: p.texto[E.lang] || p.texto.es })),
  };
}

export async function entrarGuia() {
  const v = $('#v-guia');
  const op = opciones();
  // Al entrar se muestra «Estamos en el parque» (no entrega cromos): así nadie gana una historia antes de oírla
  sel = Object.values(op).flat().find((o) => o.accion === sel?.accion) || op.aqui[0];
  finParada = false;
  v.innerHTML = '';
  const grupo = (clave, lista) => `<fieldset class="guia-grupo"><legend>${esc(t(`guia.g.${clave}`))}</legend><div class="guia-ops">${lista.map((o) => `<button type="button" data-a="${esc(o.accion)}" aria-pressed="${o.accion === sel.accion}">${esc(o.nombre)}</button>`).join('')}</div></fieldset>`;
  v.appendChild(h(`<div class="guia">
      <header class="campo-cab"><h2 id="guia-titulo">${esc(t('guia.titulo'))}</h2><button class="btn btn-linea btn-mini" id="guia-volver">${esc(t('eq.volver'))}</button></header>
      <p class="sub">${esc(t('guia.sub'))}</p>
      <figure class="guia-tarjeta" aria-live="polite">
        <figcaption class="guia-que"></figcaption>
        <div class="guia-qr"></div>
        <p class="guia-cod-et">${esc(t('guia.oCodigo'))}</p>
        <p class="guia-cod"></p>
        <p class="guia-cambia"><span class="guia-barra"><i></i></span><span class="guia-resta"></span></p>
      </figure>
      <div class="guia-guion"></div>
      ${op.paradas.length ? grupo('paradas', op.paradas) : ''}${grupo('historias', op.historias)}${grupo('estaciones', op.estaciones)}${grupo('aqui', op.aqui)}${grupoRegreso(op.regreso[0])}${grupo('lente', op.lente)}
      <p class="sub guia-nota">${esc(cfg().nota[E.lang] || cfg().nota.es)}</p>
    </div>`));
  $('#guia-volver').onclick = () => ctx.irA('album');
  const hr = $('#guia-regreso-h', v);
  hr.onchange = () => {
    if (!hr.value) return;
    regresoGuia = hr.value.replace(':', '');
    const o = opciones().regreso[0];
    sel = o; finParada = false;
    $$('.guia-ops button', v).forEach((x) => x.setAttribute('aria-pressed', 'false'));
    $('#guia-regreso-b', v).setAttribute('aria-pressed', 'true');
    ultimaF = null; pintar();
  };
  const todas = Object.values(op).flat();
  $$('.guia-ops button', v).forEach((b) => (b.onclick = () => {
    sel = b.id === 'guia-regreso-b' ? opciones().regreso[0] : todas.find((o) => o.accion === b.dataset.a); finParada = false;
    $$('.guia-ops button', v).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    ultimaF = null; pintar();
    $('.guia-tarjeta', v).scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));
  ultimaF = null;
  await pintar();
  clearInterval(reloj);
  reloj = setInterval(pintar, 1000);
  // Que la pantalla no se apague mientras el grupo escanea
  despierto = await mantenerDespierta();
  // Plan B: el guía ajusta el bloqueo automático. Va como nota fija bajo el título y no como aviso flotante,
  // porque el aviso tapaba el código de 4 dígitos justo cuando el grupo lo está leyendo.
  if (!despierto.ok && !$('.guia-despierta', v)) $('.guia > .sub', v)?.after(h(`<p class="guia-despierta" role="note">${esc(t('despierta.guia'))}</p>`));
}

export function salirGuia() { clearInterval(reloj); reloj = null; despierto?.soltar(); despierto = null; }

async function pintar() {
  const v = $('#v-guia');
  if (!v || v.hidden && reloj) return;
  const ahora = Date.now(), f = franja(ahora);
  const resta = Math.ceil(((f + 1) * franjaMs() - ahora) / 1000);
  $('.guia-resta', v).textContent = t('guia.cambia', { t: `${Math.floor(resta / 60)}:${String(resta % 60).padStart(2, '0')}` });
  $('.guia-barra i', v).style.transform = `scaleX(${resta / (franjaMs() / 1000)})`;
  if (f === ultimaF) return;
  ultimaF = f;
  const acc = accionActual();
  const qrTxt = await contenidoQR(acc, f);
  const q = window.qrcode(0, 'M'); q.addData(qrTxt); q.make();
  $('.guia-qr', v).innerHTML = q.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
  $('.guia-qr svg', v)?.setAttribute('role', 'img');
  $('.guia-qr svg', v)?.setAttribute('aria-label', t('guia.qrAlt', { que: sel.nombre }));
  $('.guia-que', v).textContent = sel.parada ? `${sel.nombre} · ${t(finParada ? 'guia.paradaFin' : 'guia.paradaLeer')}` : sel.nombre;
  $('.guia-cod', v).textContent = (await codigo(acc, f)).split('').join(' ');
  $('.guia-guion', v).innerHTML = `<p><b>${esc(t('guia.guion'))}</b> ${esc(sel.guion)}</p>`;
  if (sel.parada) {
    // Paso de la parada: primero el QR para leer/escuchar; al terminar, el que entrega el cromo
    const b = h(`<button type="button" class="btn ${finParada ? 'btn-linea' : 'btn-flor'} btn-ancho" aria-pressed="${finParada}">${esc(t(finParada ? 'guia.paradaVolver' : 'guia.paradaTermine'))}</button>`);
    b.onclick = () => { finParada = !finParada; ultimaF = null; pintar(); };
    $('.guia-guion', v).appendChild(b);
  }
  animar($('.guia-tarjeta', v), [{ opacity: 0.6 }, { opacity: 1 }], { duration: 250 });
}

// ---------- Parada narrada en el teléfono del visitante ----------
// Texto en su idioma (si no hay traducción revisada, en inglés con la nota «traducción pendiente»), fuente,
// insignia de estado y «Escuchar». Devuelve una promesa que se cumple al cerrar.
export function mostrarParada(id, { ganado = null } = {}) {
  const pa = parada(id);
  if (!pa) return Promise.resolve();
  const lang = pa.texto[E.lang] ? E.lang : 'en';
  const pendiente = lang !== E.lang;
  const est = estaciones().find((e) => e.id === pa.estacion);
  const f = E.paquete.fuentes?.[pa.fuente];
  const c = ganado ? cromo(ganado) : null;
  const estado = pa.estado || 'borrador';
  return new Promise((ok) => {
    const capa = $('#capa-detalle');
    capa.innerHTML = '';
    const caja = h(`<div class="detalle parada" lang="${lang}">
        <p class="parada-est">${esc(est ? est.nombre : '')}</p>
        <h2 id="parada-titulo">${esc(pa.titulo[lang] || pa.titulo.es)}</h2>
        ${pendiente ? `<p class="parada-nota">${esc(t('parada.pendiente'))}</p>` : ''}
        <p class="parada-texto">${esc(pa.texto[lang])}</p>
        ${f ? `<p class="ficha-fuente">${esc(t('det.fuente', { f: f.titulo }))} <span class="insignia insignia-${estado}"><span aria-hidden="true">${esc(t(`estado.${estado}`))}</span><span class="sr-only">${esc(t(`estado.${estado}Largo`))}</span></span></p>` : ''}
        ${c ? `<p class="parada-cromo" role="status">${esc(t('parada.ganaste', { nombre: texto(c).nombre }))}</p>` : `<p class="sub">${esc(t('parada.alFinal'))}</p>`}
        <div class="acciones"><button class="btn btn-linea" data-escuchar>${esc(t('det.escuchar'))}</button><button class="btn btn-flor" data-x>${esc(c ? t('parada.abrirSobre') : t('cerrar'))}</button></div>
      </div>`);
    capa.setAttribute('aria-labelledby', 'parada-titulo');
    capa.appendChild(caja);
    capa.hidden = false;
    const soltar = atraparFoco(capa);
    $('[data-escuchar]', caja).onclick = () => escuchar({ texto: pa.texto[lang], lang, tipo: 'parada', id: pa.id });
    $('[data-x]', caja).onclick = () => { callar(); capa.hidden = true; capa.innerHTML = ''; capa.removeAttribute('aria-labelledby'); soltar(); ok(); };
    $('h2', caja).setAttribute('tabindex', '-1'); $('h2', caja).focus();
  });
}

