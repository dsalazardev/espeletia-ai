# Paradas narradas por QR del guía (spec docs/specs/2026-11-24-paradas-narradas.md, issue #17).
# Un «teléfono del guía» elige la parada; un «visitante» en inglés la lee: primero el texto (no gasta el código),
# y cuando el guía marca «terminé la explicación», el QR entrega el cromo una sola vez. También con la cámara (Lente → QR)
# y la nota «traducción pendiente».
# Uso: servidor en :8765 desde la carpeta principal; necesita ffmpeg y  pip install qrcode pillow;  python3 pruebas/paradas.py
from playwright.sync_api import sync_playwright
import os, subprocess, sys, tempfile
import qrcode
URL = os.environ.get('URL', 'http://localhost:8765/')
fallas, errores = [], []

def ok(c, m):
    print('OK   ' if c else 'FALLA', m)
    if not c: fallas.append(m)

def video_qr(txt):
    d = tempfile.mkdtemp(); png, y4m = f'{d}/qr.png', f'{d}/qr.y4m'
    img = qrcode.make(txt, box_size=8, border=4).convert('RGB').resize((480, 480))
    from PIL import Image
    fondo = Image.new('RGB', (640, 480), 'white'); fondo.paste(img, (80, 0)); fondo.save(png)
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-loop', '1', '-i', png, '-t', '4', '-r', '10', '-pix_fmt', 'yuv420p', y4m], check=True)
    return y4m

def visitante(b, lang='en-US', **kw):
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale=lang, service_workers='block', **kw)
    pg = ctx.new_page(); pg.on('pageerror', lambda e: errores.append(str(e)))
    return ctx, pg

def nombre(pg, url):
    pg.goto('about:blank'); pg.goto(url); pg.wait_for_selector('#tapa-nombre'); pg.fill('#tapa-nombre', 'Emma')
    pg.click('.tapa-dueno button'); pg.click('#instalar-saltar', timeout=8000)

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', headless=True)

    # Teléfono del guía: la parada aparece primero en su lista y cambia a «entrega el cromo» al terminar
    ctx, guia = visitante(b, 'es-CO')
    nombre(guia, URL); guia.wait_for_selector('#capa-portada', state='hidden')
    guia.evaluate("window.__paramo.irA('guia')"); guia.wait_for_selector('.guia-grupo')
    guia.click('.guia-ops button[data-a="p:brisas_agua"]'); guia.wait_for_timeout(600)
    ok('leer y escuchar' in guia.locator('.guia-que').inner_text(), f"guía: QR de la parada para leer ({guia.locator('.guia-que').inner_text()})")
    guia.locator('.guia-guion button').click(); guia.wait_for_timeout(600)
    ok('entrega el cromo' in guia.locator('.guia-que').inner_text(), 'guía: «Terminé la explicación» cambia al QR que entrega el cromo')
    qr_leer = guia.evaluate("import('./js/guia.js').then((g) => g.contenidoQR('p:brisas_agua'))")
    qr_fin = guia.evaluate("import('./js/guia.js').then((g) => g.contenidoQR('pf:brisas_agua'))")
    ctx.close()

    # Visitante en inglés abre el QR de lectura: texto en inglés, fuente, insignia y sin cromo; no gasta el código
    ctx, pg = visitante(b)
    nombre(pg, qr_leer); pg.wait_for_selector('.detalle.parada', timeout=8000)
    txt = pg.locator('.detalle.parada').inner_text()
    ok('water factory' in txt and 'Source:' in txt and 'Draft' in txt, 'visitante (en): la parada en su idioma, con fuente e insignia «Draft»')
    ok(not pg.evaluate("!!window.__paramo.E.album.agua") and pg.evaluate("window.__paramo.E.usados.length") == 0, 'leer la parada no entrega el cromo ni gasta el código')
    pg.click('.detalle.parada [data-x]')
    # QR de «terminé»: entrega el cromo una vez
    pg.goto(qr_fin); pg.wait_for_selector('.detalle.parada', timeout=8000)
    ok('you earned' in pg.locator('.detalle.parada').inner_text() and pg.evaluate("!!window.__paramo.E.album.agua"), 'al terminar la explicación: cromo «Water factory» ganado')
    pg.click('.detalle.parada [data-x]'); pg.wait_for_timeout(800)
    pg.goto('about:blank'); pg.goto(qr_fin); pg.wait_for_timeout(2500)
    ok(pg.evaluate("Object.keys(window.__paramo.E.album).filter((k) => k === 'agua').length") == 1 and pg.locator('.aviso.ver').count() + pg.locator('.detalle.parada').count() >= 1, 'el mismo QR otra vez no entrega nada más')
    # Sin traducción revisada en su idioma: inglés con la nota
    pg.evaluate("(async () => { const { E } = window.__paramo; E.lang = 'es'; delete E.paquete.paradas[0].texto.es; (await import('./js/guia.js')).mostrarParada('brisas_agua'); })()")
    pg.wait_for_selector('.parada-nota', timeout=4000)
    ok('Traducción pendiente' in pg.locator('.parada-nota').inner_text() and 'Ruiz massif' in pg.locator('.parada-texto').inner_text(), 'sin traducción revisada: en inglés con «traducción pendiente»')
    ctx.close()
    b.close()

    # Con la cámara: Lente → Leer QR con el QR de la parada
    vid = video_qr(qr_leer)
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', headless=True,
                          args=['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', f'--use-file-for-fake-video-capture={vid}'])
    ctx, pg = visitante(b, 'es-CO', permissions=['camera'])
    nombre(pg, URL); pg.wait_for_selector('#capa-portada', state='hidden')
    pg.click('.muelle [data-vista="lente"]'); pg.click('.lente-modo [data-modo="qr"]')
    pg.wait_for_selector('.detalle.parada', timeout=20000)
    ok('fábrica de agua' in pg.locator('.detalle.parada').inner_text(), 'Lente → Leer QR: abre la parada en español')
    ctx.close(); b.close()

print('errores de página:', errores or 'ninguno')
print('RESULTADO:', 'TODO BIEN' if not fallas and not errores else f'{len(fallas)} fallas, {len(errores)} errores')
sys.exit(1 if fallas or errores else 0)
