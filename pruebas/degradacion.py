# Escalera de degradación (spec docs/specs/2026-11-24-escalera-degradacion-ui.md, issue #20).
# Simula cada fallo: worker que no responde, índice del chat que falta, archivo de la caché dañado,
# cámara negada y GPS negado. En ningún caso la app debe quedar muda.
# Uso: servidor en :8765 desde la carpeta principal y luego  python3 pruebas/degradacion.py
from playwright.sync_api import sync_playwright
import os, sys
URL = os.environ.get('URL', 'http://localhost:8765/')
fallas, errores = [], []

def ok(c, m):
    print('OK   ' if c else 'FALLA', m)
    if not c: fallas.append(m)

def abrir(b, init=None, sw='block', **kw):
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='es-CO', service_workers=sw, **kw)
    if init: ctx.add_init_script(init)
    pg = ctx.new_page(); pg.on('pageerror', lambda e: errores.append(str(e)))
    return ctx, pg

def entrar(pg):
    pg.goto(URL); pg.wait_for_selector('#tapa-nombre'); pg.fill('#tapa-nombre', 'Prueba')
    pg.click('.tapa-dueno button'); pg.click('#instalar-saltar', timeout=8000); pg.wait_for_selector('#capa-portada', state='hidden')

def preguntar(pg, q):
    pg.fill('#chat-in', q); pg.press('#chat-in', 'Enter')
    pg.wait_for_function('window.__ultimoChat && window.__ultimoChat.texto === %r' % q, timeout=30000); pg.wait_for_timeout(300)
    return pg.evaluate('window.__ultimoChat')

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', headless=True)

    # 1. Worker que nunca responde: se reinicia una vez y el chat pasa a palabras clave, y lo dice
    ctx, pg = abrir(b)
    ctx.route('**/js/motor-worker.js', lambda r: r.fulfill(status=200, content_type='text/javascript', body='self.onmessage = () => {};'))
    entrar(pg)
    pg.evaluate("import('./js/motor.js').then((m) => { m.limites.cargar = 1500; m.limites.texto = 800; })")
    pg.click('.muelle [data-vista="chat"]'); pg.wait_for_selector('#chat-sug .chip, #chat-log .aviso-modo', timeout=30000)
    r = preguntar(pg, 'qué ropa debo llevar')
    est = pg.evaluate("Promise.all([import('./js/motor.js'), import('./js/chat.js')]).then(([m, c]) => ({ reinicios: m.reinicios, lexico: c.modoLexico() }))")
    ok(est['reinicios'] >= 1, f"worker colgado: se reinició ({est['reinicios']} reinicios)")
    ok(est['lexico'] and r['tipo'] == 'respuesta' and r['id'] == 'que_llevar', f"…y el chat responde con palabras clave: {r['tipo']} {r['id']}")
    ok(pg.locator('#chat-log .aviso-modo').count() == 1, '…y le dice al visitante que pasó a modo sencillo (una vez)')
    r = preguntar(pg, 'me perdí')
    ok(r['id'] == 'emergencia', f'modo sencillo: la regla de emergencia sigue mandando ({r["id"]})')
    ctx.close()

    # 2. Sin índice del chat: menú de temas, «no tengo esa información» y contacto del operador; reglas de seguridad intactas
    ctx, pg = abrir(b)
    ctx.route('**/models/chat_indice.json', lambda r: r.fulfill(status=404, body='no'))
    entrar(pg)
    pg.click('.muelle [data-vista="chat"]'); pg.wait_for_selector('#chat-log .menu-temas', timeout=20000)
    txt = pg.locator('#chat-log .menu-temas').inner_text()
    ok('no tengo esa información' in txt and 'UTON' in txt, 'sin índice: menú de temas con «no tengo esa información» y el contacto de la UTON')
    pg.locator('#chat-log .menu-temas .chip', has_text='Seguridad').click(); pg.wait_for_timeout(300)
    pg.locator('#chat-log .msg').last.locator('.chip').first.click(); pg.wait_for_timeout(300)
    ok(pg.locator('#chat-log .ficha').count() >= 1, 'el menú lleva a una ficha oficial')
    r = preguntar(pg, 'me perdí')
    ok(r['tipo'] == 'respuesta' and r['id'] == 'emergencia', f'sin índice: «me perdí» → emergencia ({r["id"]})')
    r = preguntar(pg, 'se puede comer el frailejón')
    ok(r['id'] == 'comer_plantas', f'sin índice: comer → comer_plantas ({r["id"]})')
    r = preguntar(pg, 'qué hora es')
    ok(r['tipo'] == 'menu', 'sin índice: otra pregunta → menú de temas')
    ctx.close()

    # 3. Archivo de la caché dañado: se detecta con SHA-256, se marca, Ajustes lo muestra y con señal se repara
    ctx, pg = abrir(b, sw='allow')
    entrar(pg)
    pg.wait_for_function("import('./js/portada.js').then((m) => m.listoOffline())", timeout=180000, polling=2000)
    pg.evaluate("""async () => { const ks = (await caches.keys()).filter((k) => k.startsWith('album-paramo-'));
        const c = await caches.open(ks[0]); await c.put('models/mnv2_embed.onnx', new Response(new Uint8Array(1000), { headers: { 'X-Huella': 'x' } })); }""")
    res = pg.evaluate("import('./js/portada.js').then((m) => m.revisarArchivos({ reparar: false }))")
    est = {x['ruta']: x['estado'] for x in res}
    ok(est.get('models/mnv2_embed.onnx') == 'danado' and est.get('models/e5_small_latino.onnx') == 'ok', f'caché alterada: detectada ({est})')
    ok(pg.evaluate("JSON.parse(localStorage.getItem('paramo-danados'))") == ['models/mnv2_embed.onnx'], '…y marcada para volver a descargar')
    pg.click('.muelle [data-accion="ajustes"]'); pg.wait_for_selector('#aj-ia')
    ok('se volverá a descargar' in pg.locator('#aj-ia').inner_text(), 'Ajustes muestra el archivo dañado')
    pg.click('#aj-revisar'); pg.wait_for_function("document.querySelector('#aj-ia').innerText.includes('se reparó')", timeout=60000)
    sano = pg.evaluate("""async () => { const r = await caches.match('models/mnv2_embed.onnx'); const b = await r.arrayBuffer();
        const h = [...new Uint8Array(await crypto.subtle.digest('SHA-256', b))].map((x) => x.toString(16).padStart(2, '0')).join('');
        const m = await (await fetch('models/partes.json')).json(); return h === m['models/mnv2_embed.onnx'].sha256; }""")
    ok(sano and pg.evaluate("JSON.parse(localStorage.getItem('paramo-danados'))") == [], 'con señal: el service worker lo reparó y su huella coincide')
    # «contenido» del service worker: se avisa una vez y espera a que termine un sobre abierto
    pg.click('#aj-cerrar') if pg.locator('#aj-cerrar').count() else None
    pg.evaluate("document.querySelector('#capa-sobre').hidden = false")
    pg.evaluate("navigator.serviceWorker.dispatchEvent(new MessageEvent('message', { data: { tipo: 'contenido', archivo: 'paquete.json' } }))")
    pg.wait_for_timeout(800)
    ok('actualizada' not in (pg.locator('.aviso').inner_text() if pg.locator('.aviso.ver').count() else ''), 'contenido nuevo: no interrumpe un sobre abierto')
    pg.evaluate("document.querySelector('#capa-sobre').hidden = true")
    pg.wait_for_function("document.querySelector('.aviso.ver')?.innerText.includes('actualizada')", timeout=6000)
    ok(True, '…y avisa «información actualizada» al cerrarlo')
    ctx.close()

    # 4. Cámara negada: el guía confirma lo que se ve con su código
    ctx, pg = abrir(b, "navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException('negado', 'NotAllowedError'));")
    entrar(pg)
    pg.click('.muelle [data-vista="lente"]'); pg.wait_for_selector('#lente-planb', timeout=10000)
    ok('permiso' in pg.locator('#lente-msg').inner_text(), 'cámara negada: lo explica')
    pg.select_option('#planb-clase', 'frailejon')
    cod = pg.evaluate("import('./js/guia.js').then((g) => g.codigo('c:frailejon'))")
    pg.evaluate("window.__paramo.E.aqui = Date.now()")
    pg.fill('#lente-planb input', cod); pg.click('#lente-planb .codigo button'); pg.wait_for_timeout(800)
    ok(pg.evaluate("!!window.__paramo.E.album.frailejon"),
       'cámara negada: con el código del guía se gana el cromo del frailejón')
    ctx.close()

    # 5. GPS negado: elegir la estación a mano, con el código del guía
    ctx, pg = abrir(b, "navigator.geolocation.watchPosition = (ok, mal) => { setTimeout(() => mal({ code: 1, message: 'negado' }), 50); return 1; }; navigator.geolocation.getCurrentPosition = (ok, mal) => setTimeout(() => mal({ code: 1, message: 'negado' }), 50);")
    entrar(pg)
    pg.click('.muelle [data-vista="mapa"]'); pg.wait_for_selector('#gps-ayuda:not([hidden])', timeout=10000)
    ok('elige tu estación' in pg.locator('#gps-ayuda').inner_text(), 'GPS negado: ofrece elegir la estación a mano')
    pg.click('#gps-ayuda [data-m]'); pg.wait_for_selector('#capa-estacion .hoja-estacion', timeout=5000)
    ok(pg.locator('#capa-estacion .plan-b').count() == 1, '…y la hoja de la estación pide el código del guía')
    ctx.close()
    b.close()

print('errores de página:', errores or 'ninguno')
print('RESULTADO:', 'TODO BIEN' if not fallas and not errores else f'{len(fallas)} fallas, {len(errores)} errores')
sys.exit(1 if fallas or errores else 0)
