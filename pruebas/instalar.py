# Paso obligatorio de instalación y arreglos de iPhone (spec docs/specs/2026-11-24-arreglos-iphone.md, issue #14).
# Simula iPhone (Safari y app instalada), Android (con y sin aviso de Chrome), Instagram y computador.
# Uso: servidor en :8765 desde la carpeta principal (python3 -m http.server 8765) y luego  python3 pruebas/instalar.py
from playwright.sync_api import sync_playwright
import os, sys
URL = os.environ.get('URL', 'http://localhost:8765/')
S = '/tmp/shots_instalar'; os.makedirs(S, exist_ok=True)
IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1'
ANDROID = 'Mozilla/5.0 (Linux; Android 15; Redmi Note 15) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36'
INSTA = 'Mozilla/5.0 (Linux; Android 15; Redmi Note 15) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/142.0.0.0 Mobile Safari/537.36 Instagram 350.0.0.0'
fallas, errores = [], []

def ok(c, m):
    print('OK   ' if c else 'FALLA', m)
    if not c: fallas.append(m)

def telefono(b, ua=None, init=None, mobile=True):
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=mobile, has_touch=mobile,
                        **({'user_agent': ua} if ua else {}), locale='es-CO')
    if init: ctx.add_init_script(init)
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errores.append(str(e)))
    return ctx, pg

def nombre(pg, n='Ana', url=URL):
    pg.goto(url); pg.wait_for_selector('#tapa-nombre'); pg.fill('#tapa-nombre', n); pg.click('.tapa-dueno button')
    pg.wait_for_selector('.tapa-instalar', timeout=8000)

def sw(pg):
    return pg.evaluate("navigator.serviceWorker.getRegistration().then((r) => !!r)")

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', headless=True)

    # 1. iPhone en Safari: pasos de Compartir, opción de abrir sin instalar y sin empezar la descarga
    ctx, pg = telefono(b, IPHONE, "delete Navigator.prototype.vibrate;")
    nombre(pg)
    pg.wait_for_timeout(800)
    txt = pg.locator('.tapa-instalar').inner_text()
    ok('Compartir' in txt and 'Agregar a inicio' in txt, 'iPhone: pasos Compartir → Agregar a inicio')
    ok(pg.locator('#ins-instalar').count() == 0, 'iPhone: sin botón de instalar (se hace desde Compartir)')
    ok(pg.locator('#instalar-saltar').count() == 1 and 'Safari puede borrar' in txt, 'iPhone: «Abrir sin instalar», avisando que Safari puede borrar el álbum')
    ok(not sw(pg), 'iPhone sin instalar: no registra el service worker (no baja los 95 MB en Safari)')
    pg.screenshot(path=f'{S}/1_iphone.png', full_page=True)
    # vibrar en iPhone → destello
    pg.evaluate("import('./js/util.js').then((u) => u.vibrar([40, 40, 40]))"); pg.wait_for_timeout(100)
    ok(pg.locator('#destello').count() == 1, 'iPhone: vibrar muestra un destello en vez de fallar en silencio')
    ctx.close()

    # 2. iPhone, app instalada (desde el ícono): no sale el paso y sí se registra el service worker
    ctx, pg = telefono(b, IPHONE, "Object.defineProperty(navigator, 'standalone', { get: () => true });")
    pg.goto(URL); pg.wait_for_selector('#tapa-nombre'); pg.fill('#tapa-nombre', 'Ana'); pg.click('.tapa-dueno button')
    pg.wait_for_selector('#capa-portada', state='hidden', timeout=8000); pg.wait_for_timeout(600)
    ok(pg.locator('.tapa-instalar').count() == 0, 'iPhone instalado: no vuelve a pedir instalar')
    ok(sw(pg), 'iPhone instalado: empieza a guardar para usar sin señal')
    ctx.close()

    # 3. Android sin aviso de Chrome → pasos del menú ⋮; luego llega el aviso → botón «Instalar»
    ctx, pg = telefono(b, ANDROID)
    nombre(pg)
    ok('Instalar app' in pg.locator('.tapa-instalar').inner_text(), 'Android sin aviso: pasos del menú ⋮')
    ok(pg.locator('#instalar-saltar').count() == 1, 'Android: también se puede abrir sin instalar')
    pg.screenshot(path=f'{S}/2_android_pasos.png', full_page=True)
    pg.evaluate("""() => { const e = new Event('beforeinstallprompt'); e.prompt = async () => { window.__pidio = true; };
        e.userChoice = Promise.resolve({ outcome: 'accepted' }); dispatchEvent(e); }""")
    pg.wait_for_selector('#ins-instalar', timeout=3000)
    pg.screenshot(path=f'{S}/3_android_boton.png', full_page=True)
    pg.click('#ins-instalar'); pg.wait_for_selector('.ins-hecho', timeout=3000)
    ok(pg.evaluate('window.__pidio === true'), 'Android: el botón abre el aviso de instalar de Chrome')
    ok('ícono' in pg.locator('.tapa-instalar').inner_text(), 'Android: tras instalar, pide abrir desde el ícono')
    ok(sw(pg), 'Android: registra el service worker (Chrome lo necesita y la app instalada comparte la caché)')
    ctx.close()

    # 4. Aviso capturado al cargar (antes de escribir el nombre)
    ctx, pg = telefono(b, ANDROID)
    pg.goto(URL); pg.wait_for_selector('#tapa-nombre')
    pg.evaluate("""() => { const e = new Event('beforeinstallprompt', { cancelable: true }); e.prompt = async () => {};
        e.userChoice = Promise.resolve({ outcome: 'dismissed' }); dispatchEvent(e); window.__cancelado = e.defaultPrevented; }""")
    pg.fill('#tapa-nombre', 'Ana'); pg.click('.tapa-dueno button'); pg.wait_for_selector('.tapa-instalar')
    ok(pg.evaluate('window.__cancelado') and pg.locator('#ins-instalar').count() == 1, 'Android: el aviso se guarda al cargar y el botón sale después del nombre')
    pg.click('#ins-instalar'); pg.wait_for_timeout(300)
    ok(pg.locator('.ins-pasos').count() == 1, 'Android: si lo cierra, quedan los pasos manuales')
    ctx.close()

    # 5. Dentro de Instagram (Android): abrir en Chrome y copiar el enlace
    ctx, pg = telefono(b, INSTA)
    nombre(pg)
    t5 = pg.locator('.tapa-instalar').inner_text()
    ok('Instagram' in t5 and pg.locator('#ins-chrome').count() == 1 and pg.locator('#ins-copiar').count() == 1, 'Instagram: «Abrir en Chrome» y «Copiar el enlace»')
    ok(pg.locator('#ins-chrome').get_attribute('href').startswith('intent://'), 'Instagram: el botón usa intent:// hacia Chrome')
    ok(not sw(pg), 'Instagram: no empieza la descarga')
    pg.screenshot(path=f'{S}/4_instagram.png', full_page=True)
    ctx.close()

    # 6. Computador: escape discreto, y no vuelve a salir al recargar
    ctx, pg = telefono(b, None, mobile=False)
    nombre(pg)
    ok(pg.locator('#instalar-saltar').count() == 1, 'Computador: «Abrir sin instalar»')
    pg.click('#instalar-saltar'); pg.wait_for_selector('#capa-portada', state='hidden')
    pg.reload(); pg.wait_for_timeout(1500)
    ok(pg.locator('.tapa-instalar').count() == 0, 'Computador: tras saltarlo, no vuelve a salir')
    # QR del guía abierto como dirección en el computador → se aplica
    q = pg.evaluate("import('./js/guia.js').then((g) => g.contenidoQR('aqui'))")
    ok(q.startswith(URL) and '#PARAMO-G' in q, f'el QR del guía es una dirección: {q[:60]}…')
    ok(pg.evaluate("(q) => import('./js/guia.js').then(async (g) => !!(await g.leerQR(q))?.accion && !!(await g.leerQR(decodeURIComponent(q.split('#')[1])))?.accion)", q), 'la Lente acepta el QR nuevo y el viejo')
    pg.goto('about:blank'); pg.goto(q); pg.wait_for_timeout(2500)
    ok(pg.evaluate('window.__paramo.E.aqui > 0') and '#' not in pg.url, 'QR abierto en la app: confirma «en el parque» y limpia la dirección')
    ctx.close()

    # 7. iPhone en Safari abriendo el QR del guía: muestra el código para escribirlo en el álbum
    ctx, pg = telefono(b, IPHONE)
    pg.goto(URL); pg.wait_for_selector('#tapa-nombre')
    q = pg.evaluate("import('./js/guia.js').then((g) => g.contenidoQR('aqui'))")
    cod = pg.evaluate("import('./js/guia.js').then((g) => g.codigo('aqui'))")
    pg.goto('about:blank'); nombre(pg, url=q)
    nota = pg.locator('.ins-qr').inner_text() if pg.locator('.ins-qr').count() else ''
    ok(cod in nota, f'iPhone + QR del guía: muestra el código {cod}: «{nota[:50]}…»')
    ok(pg.evaluate('window.__paramo.E.aqui') == 0, 'iPhone en Safari: no lo aplica en datos que no son los del álbum instalado')
    pg.screenshot(path=f'{S}/5_iphone_qr.png', full_page=True)
    ctx.close()

    # 8. iPhone que abre sin instalar: entra al álbum y empieza a guardar para usar sin señal
    ctx, pg = telefono(b, IPHONE)
    nombre(pg)
    pg.click('#instalar-saltar'); pg.wait_for_selector('#capa-portada', state='hidden'); pg.wait_for_timeout(800)
    ok(sw(pg), 'iPhone sin instalar: al elegir «Abrir sin instalar» sí empieza a guardar para usar sin señal')
    ctx.close()

    # 9. Sin Wake Lock: plan B
    ctx, pg = telefono(b, None, "delete Navigator.prototype.wakeLock;", mobile=False)
    pg.goto(URL); pg.wait_for_selector('#tapa-nombre')
    ok(pg.evaluate("import('./js/util.js').then(async (u) => { const d = await u.mantenerDespierta(); d.soltar(); return d.ok; })") is False, 'sin Wake Lock: mantenerDespierta avisa que no se pudo (plan B)')
    ctx.close()
    b.close()

print('errores de página:', errores or 'ninguno')
print('RESULTADO:', 'TODO BIEN' if not fallas and not errores else f'{len(fallas)} fallas, {len(errores)} errores')
sys.exit(1 if fallas or errores else 0)
