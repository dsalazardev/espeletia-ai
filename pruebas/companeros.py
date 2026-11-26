# Compañeros 2D en la cámara (spec docs/specs/2026-11-24-companeros-2d-camara.md, issue #16), con cámara simulada.
# Aparece en una estación (quieto), no aparece caminando, aparece con el QR del guía, cuenta el dato con fuente,
# se mueve un poco al inclinar el teléfono y la «foto con…» queda guardada para el collage.
# Uso: servidor en :8765; necesita ffmpeg y  pip install qrcode pillow;  python3 pruebas/companeros.py
from playwright.sync_api import sync_playwright
import os, subprocess, sys, tempfile
import qrcode
from PIL import Image
URL = os.environ.get('URL', 'http://localhost:8765/')
fallas, errores = [], []

def ok(c, m):
    print('OK   ' if c else 'FALLA', m)
    if not c: fallas.append(m)

def video(img):
    d = tempfile.mkdtemp(); png, y4m = f'{d}/x.png', f'{d}/x.y4m'
    img.save(png)
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-loop', '1', '-i', png, '-t', '4', '-r', '10', '-pix_fmt', 'yuv420p', y4m], check=True)
    return y4m

def navegador(p, vid):
    return p.chromium.launch(executable_path='/usr/bin/google-chrome', headless=True,
                             args=['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', f'--use-file-for-fake-video-capture={vid}'])

def telefono(b):
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='es-CO', service_workers='block', permissions=['camera'])
    pg = ctx.new_page(); pg.on('pageerror', lambda e: errores.append(str(e)))
    pg.goto(URL); pg.wait_for_selector('#tapa-nombre'); pg.fill('#tapa-nombre', 'Ana')
    pg.click('.tapa-dueno button'); pg.click('#instalar-saltar', timeout=8000); pg.wait_for_selector('#capa-portada', state='hidden')
    return ctx, pg

def puntos(pg, lista):
    pg.evaluate("""async (l) => { for (const [dlat, s] of l) { const e = window.__paramo.est.estaciones()[0];
        window.__paramo.est.ponerPosicion({ lat: e.lat + dlat, lon: e.lon, precision: 8, t: Date.now() }); await new Promise((r) => setTimeout(r, s)); } }""", lista)

paisaje = Image.new('RGB', (640, 480), (120, 150, 110))
with sync_playwright() as p:
    b = navegador(p, video(paisaje))
    # 1. Quieto en Brisas: al abrir la Lente aparece el personaje del cromo de la estación
    ctx, pg = telefono(b)
    puntos(pg, [(0, 300), (0.00001, 300), (0, 0)])
    pg.click('.muelle [data-vista="lente"]'); pg.wait_for_timeout(2500)
    pj = pg.evaluate("window.__paramo.E.paquete.cromos.find((c) => c.tipo === 'gps' && c.estacion === 'e1').personaje")
    ok(pg.locator('#companero:not([hidden])').count() == 1 and pg.get_attribute('#companero', 'data-pj') == pj, f'quieto en la estación: aparece {pj} sobre la cámara')
    # Inclinar el teléfono: paralaje leve
    pg.evaluate("dispatchEvent(Object.assign(new Event('deviceorientation'), { gamma: 30, beta: 80 }))"); pg.wait_for_timeout(200)
    ok('10px' in (pg.get_attribute('#companero', 'style') or ''), f"al inclinar se desplaza un poco ({pg.get_attribute('#companero', 'style')})")
    # Tocarlo: cuenta el dato con fuente y ofrece la foto
    pg.click('#companero'); pg.wait_for_timeout(400)
    msg = pg.locator('#lente-msg').inner_text()
    ok('Fuente' in msg and pg.locator('#lente-foto-pj').count() == 1, f'al tocarlo cuenta el dato con fuente ({msg[:60]}…) y ofrece «{pg.locator("#lente-foto-pj").inner_text()}»')
    pg.click('#lente-foto-pj'); pg.wait_for_function('window.__ultimaFotoPj', timeout=8000)
    n = pg.evaluate("import('./js/estado.js').then(async (e) => (await e.fotosPersonaje()).length)")
    b64 = pg.evaluate("import('./js/estado.js').then(async (e) => { const l = await e.fotosPersonaje(); const b = await e.fotoBlob(l[0].id); return await new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(r.result.split(',')[1]); r.readAsDataURL(b); }); })")
    import base64; open('/tmp/foto_pj.jpg', 'wb').write(base64.b64decode(b64))
    ok(n == 1 and pg.evaluate('window.__ultimaFotoPj.bytes') > 1000, f'la foto con el personaje queda guardada ({n})')
    ok(pg.evaluate("import('./js/exportar.js').then((x) => x.hayFotos())"), '…y entra al collage del álbum')
    ctx.close()

    # 2. Caminando (más de 12 m en pocos segundos): no aparece
    ctx, pg = telefono(b)
    puntos(pg, [(0, 400), (0.0002, 400), (0.0004, 0)])
    pg.click('.muelle [data-vista="lente"]'); pg.wait_for_timeout(2500)
    ok(pg.locator('#companero:not([hidden])').count() == 0, 'caminando: no aparece ningún personaje')
    ctx.close(); b.close()

    # 3. QR del guía (historia «agua») leído con la Lente: aparece el personaje de ese cromo
    ctx0 = None
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', headless=True)
    ctx0 = b.new_context(service_workers='block'); g = ctx0.new_page(); g.goto(URL); g.wait_for_selector('#tapa-nombre')
    q = g.evaluate("import('./js/guia.js').then((m) => m.contenidoQR('h:agua'))"); ctx0.close(); b.close()
    img = qrcode.make(q, box_size=8, border=4).convert('RGB').resize((480, 480)); f = Image.new('RGB', (640, 480), 'white'); f.paste(img, (80, 0))
    b = navegador(p, video(f))
    ctx, pg = telefono(b)
    pg.click('.muelle [data-vista="lente"]'); pg.click('.lente-modo [data-modo="qr"]')
    pg.wait_for_function("!!window.__paramo.E.album.agua", timeout=20000); pg.wait_for_timeout(500)
    pj = pg.evaluate("window.__paramo.E.paquete.cromos.find((c) => c.id === 'agua').personaje")
    ok(pg.locator('#companero').count() == 1 and pg.get_attribute('#companero', 'data-pj') == pj, f'QR del guía: aparece {pj}')
    ctx.close(); b.close()
print('errores de página:', errores or 'ninguno')
print('RESULTADO:', 'TODO BIEN' if not fallas and not errores else f'{len(fallas)} fallas, {len(errores)} errores')
sys.exit(1 if fallas or errores else 0)
