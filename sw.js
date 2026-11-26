// Service worker: guarda toda la app para usarla en modo avión y avisa el progreso a la portada.
//
// Cómo se guardan los archivos grandes (motor WASM y los dos modelos, ~90 MB):
// - En el servidor están partidos en trozos de 8 MB (models/partes/, ver models/partes.json), para que
//   cualquier hosting los acepte.
// - Aquí se guardan UNIDOS bajo su nombre normal (p. ej. models/e5_small_latino.onnx), ya verificados con
//   su huella SHA-256. Así el motor de IA los lee de una vez, sin unir ni verificar en cada carga, y el
//   motor WASM se compila en streaming (Chrome puede guardar el código compilado).
// - Al publicar una versión nueva NO se vuelven a descargar: si un archivo grande tiene la misma huella
//   que en la versión anterior, se copia de la caché vieja. Los archivos pequeños se revalidan
//   (si no cambiaron, el servidor responde 304 y no se descargan de nuevo).
const VERSION = 'v29-2026-11-26';
const CACHE = `album-paramo-${VERSION}`;
const APP = [
  './', 'index.html', 'styles.css', 'manifest.json', 'paquete.json',
  'js/app.js', 'js/db.js', 'js/ml.js', 'js/util.js', 'js/estado.js', 'js/i18n.js', 'js/art.js', 'js/cromo.js',
  'js/album.js', 'js/sobre.js', 'js/chat.js', 'js/chatui.js', 'chat.json', 'js/celebrar.js', 'js/lente.js', 'js/mapa.js', 'js/portada.js', 'js/ajustes.js', 'js/exportar.js',
  'js/motor.js', 'js/motor-worker.js', 'js/guia.js', 'js/bitacora.js', 'js/sendero.js', 'js/recorrido.js', 'js/relieve.js', 'js/mapa3d.js', 'lib/ort.wasm.min.js', 'lib/ort-wasm-simd-threaded.js', 'lib/jsQR.js', 'lib/qrcode.js', 'lib/tokenizers.min.js',
  'fonts/bricolage-grotesque-latin-wdth-normal.woff2', 'fonts/atkinson-hyperlegible-latin-400-normal.woff2', 'fonts/atkinson-hyperlegible-latin-700-normal.woff2',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png',
  'models/chat_indice.json', 'models/e5_tokenizer.json', 'models/e5_tokenizer_config.json', 'models/partes.json', 'models/parque.json', 'models/relieve.json', 'models/relieve.bin', 'models/relieve.webp',
];

async function avisar(msg) {
  for (const c of await self.clients.matchAll({ includeUncontrolled: true })) c.postMessage(msg);
}

const tipoDe = (ruta) => (ruta.endsWith('.wasm') ? 'application/wasm' : 'application/octet-stream');
const sha256 = async (buf) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', buf))].map((x) => x.toString(16).padStart(2, '0')).join('');

// Une las partes de un archivo grande, lo verifica y lo devuelve como Response lista para guardar.
async function armar(ruta, m) {
  const blobs = [];
  for (const p of m.partes) {
    // Una parte idéntica puede estar en una caché anterior (las partes llevan la huella en el nombre)
    const r = (await caches.match(p)) || (await fetch(p));
    if (!r.ok) throw new Error(`No se pudo descargar ${p} (${r.status})`);
    blobs.push(await r.blob());
  }
  const blob = new Blob(blobs, { type: tipoDe(ruta) });
  if (blob.size !== m.bytes) throw new Error(`${ruta} quedó incompleto (${blob.size} de ${m.bytes} bytes)`);
  if ((await sha256(await blob.arrayBuffer())) !== m.sha256) throw new Error(`${ruta} llegó dañado (la huella SHA-256 no coincide)`);
  return new Response(blob, { headers: { 'Content-Type': tipoDe(ruta), 'Content-Length': String(m.bytes), 'X-Huella': m.sha256 } });
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => { try {
    const cache = await caches.open(CACHE);
    const man = await (await fetch('models/partes.json', { cache: 'no-cache' })).json();
    const grandes = Object.entries(man);
    // Progreso por peso: los grandes cuentan según su tamaño en MB, los pequeños como 0,1 cada uno
    const pesoTotal = APP.length * 0.1 + grandes.reduce((a, [, m]) => a + m.bytes / 1e6, 0);
    let hecho = 0;
    const avanzar = (x) => { hecho += x; avisar({ tipo: 'progreso', p: Math.min(1, hecho / pesoTotal) }); };
    for (const url of APP) {
      if (!(await cache.match(url))) {
        const res = await fetch(url, { cache: 'no-cache' }); // revalida: si no cambió, 304 sin descargar
        if (!res.ok) throw new Error(`No se pudo guardar ${url} (${res.status})`);
        await cache.put(url, res);
      }
      avanzar(0.1);
    }
    for (const [ruta, m] of grandes) {
      const previo = await caches.match(ruta);
      if (previo && previo.headers.get('X-Huella') === m.sha256) await cache.put(ruta, previo); // misma huella: sin descargar
      else if (!(await cache.match(ruta))) await cache.put(ruta, await armar(ruta, m));
      avanzar(m.bytes / 1e6);
    }
    await self.skipWaiting();
  } catch (e) {
    // Se avisa a la página para que Ajustes muestre la causa (si no, el fallo es invisible)
    avisar({ tipo: 'error', detalle: `${e.name}: ${e.message}` });
    throw e;
  } })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('album-paramo-') && k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
    avisar({ tipo: 'listo' });
  })());
});

// ---------- Al recuperar señal (spec al-recuperar-senal; mensajes en docs/contratos/sw-mensajes.md) ----------
// «verificar» (sin red): recalcula la huella de los archivos grandes guardados y dice cuáles faltan o están dañados.
async function verificar() {
  const cache = await caches.open(CACHE);
  const manRes = await cache.match('models/partes.json');
  if (!manRes) return avisar({ tipo: 'verificado', malos: ['models/partes.json'] });
  const malos = [];
  for (const [ruta, m] of Object.entries(await manRes.json())) {
    const r = await cache.match(ruta);
    if (!r || (await sha256(await r.arrayBuffer())) !== m.sha256) malos.push(ruta);
  }
  await avisar({ tipo: 'verificado', malos });
}

// «reparar» (con señal): vuelve a descargar y verificar solo los archivos pedidos que sean de la app.
async function reparar(rutas = []) {
  const cache = await caches.open(CACHE);
  let man;
  try { man = await (await fetch('models/partes.json', { cache: 'no-cache' })).json(); } catch (e) {
    // Sin señal: no se toca nada de lo guardado y se responde para que la página no se quede esperando
    return avisar({ tipo: 'reparado', ok: [], fallidos: rutas.map((ruta) => ({ ruta, detalle: 'sin señal' })) });
  }
  const ok = [], fallidos = [];
  for (const ruta of rutas) {
    try {
      if (man[ruta]) await cache.put(ruta, await armar(ruta, man[ruta]));
      else if (APP.includes(ruta)) {
        const res = await fetch(ruta, { cache: 'no-cache' });
        if (!res.ok) throw new Error(String(res.status));
        await cache.put(ruta, res);
      } else throw new Error('no es un archivo de la app');
      ok.push(ruta);
    } catch (e) { fallidos.push({ ruta, detalle: e.message }); }
  }
  await avisar({ tipo: 'reparado', ok, fallidos });
}

self.addEventListener('message', (event) => {
  // Solo se atienden mensajes de páginas de esta misma app
  if (event.origin && event.origin !== location.origin) return;
  const d = event.data || {};
  if (d.tipo === 'verificar') event.waitUntil(verificar());
  if (d.tipo === 'reparar' && Array.isArray(d.rutas)) event.waitUntil(reparar(d.rutas.filter((r) => typeof r === 'string')));
});

// ¿La URL es exactamente un archivo de la lista APP? (antes se comparaba con endsWith y './' coincidía con todo,
// así que se guardaba cualquier archivo pedido)
function esDeLaApp(url) {
  const ruta = new URL(url).pathname.slice(new URL(self.registration.scope).pathname.length);
  return ruta === '' ? APP.includes('./') : APP.includes(ruta);
}

// Primero la caché (funciona sin señal). El paquete de contenido y el del parque se intentan actualizar con red;
// si llegan distintos a lo guardado, se avisa a la página («contenido»). Nada se sube: solo se descarga.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const esPaquete = req.url.includes('paquete.json') || req.url.includes('parque.json'); // contenido: se refresca con señal
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit && !esPaquete) return hit;
    try {
      // El contenido se revalida siempre con el servidor (si no cambió, 304 sin descargar): sin esto, la caché HTTP del
      // navegador puede devolver un paquete viejo durante minutos (p. ej. GitHub Pages manda max-age=600).
      const res = await fetch(req, esPaquete ? { cache: 'no-cache' } : undefined);
      if (res.ok && esPaquete && hit) {
        const [antes, ahora] = await Promise.all([hit.clone().text(), res.clone().text()]);
        if (antes !== ahora) event.waitUntil(avisar({ tipo: 'contenido', archivo: new URL(req.url).pathname.split('/').pop() }));
      }
      // waitUntil: que el navegador no corte el guardado a medias si la página se cierra
      if (res.ok && (esPaquete || esDeLaApp(req.url))) event.waitUntil(cache.put(req, res.clone()));
      return res;
    } catch (e) {
      if (hit) return hit;
      if (req.mode === 'navigate') return cache.match('index.html');
      throw e;
    }
  })());
});
