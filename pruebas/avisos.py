# Avisos sin red (spec docs/specs/2026-11-24-avisos-sin-red.md, issue #34), con reloj, GPS y batería simulados.
# Uso: servidor en :8765 desde la carpeta principal;  python3 pruebas/avisos.py
from playwright.sync_api import sync_playwright
import datetime, os, sys
URL = os.environ.get('URL', 'http://localhost:8765/')
fallas, errores = [], []

def ok(c, m):
    print('OK   ' if c else 'FALLA', m)
    if not c: fallas.append(m)

HOY = datetime.datetime.now().replace(hour=12, minute=20, second=0, microsecond=0)
a_las = lambda h, m: HOY.replace(hour=h, minute=m)
BATERIA = "navigator.getBattery = () => Promise.resolve({ level: 0.15, charging: false, addEventListener() {} });"

def telefono(b, init=None):
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='es-CO', service_workers='block')
    if init: ctx.add_init_script(init)
    pg = ctx.new_page(); pg.on('pageerror', lambda e: errores.append(str(e)))
    pg.clock.install(time=HOY); pg.clock.resume()  # el reloj corre normal desde las 12:20 de hoy
    return ctx, pg

def entrar(pg, url=URL):
    pg.goto('about:blank'); pg.goto(url); pg.wait_for_selector('#tapa-nombre'); pg.fill('#tapa-nombre', 'Ana')
    pg.click('.tapa-dueno button'); pg.click('#instalar-saltar', timeout=8000); pg.wait_for_selector('#capa-portada', state='hidden')

def aviso_a(pg, cuando):
    pg.clock.set_system_time(cuando); pg.evaluate("document.querySelector('.aviso')?.classList.remove('ver')")
    pg.evaluate('window.__revisarAvisos()'); pg.wait_for_timeout(200)
    return pg.locator('.aviso.ver').inner_text() if pg.locator('.aviso.ver').count() else ''

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', headless=True)

    # El guía fija «volvemos a las 13:00» y el visitante escanea el QR
    ctx, guia = telefono(b); entrar(guia)
    guia.evaluate("window.__paramo.irA('guia')"); guia.wait_for_selector('#guia-regreso-h')
    guia.fill('#guia-regreso-h', '13:00'); guia.dispatch_event('#guia-regreso-h', 'change'); guia.wait_for_timeout(500)
    ok('13:00' in guia.locator('.guia-que').inner_text(), f"guía: QR «Volvemos a las 13:00» ({guia.locator('.guia-que').inner_text()})")
    qr = guia.evaluate("import('./js/guia.js').then((g) => g.contenidoQR('r:1300'))")
    ctx.close()

    ctx, pg = telefono(b); entrar(pg, qr); pg.wait_for_timeout(1500)
    ok('13:00' in pg.locator('.aviso').inner_text(), 'visitante: «te aviso cuando sea hora de volver (13:00)»')
    ok(aviso_a(pg, a_las(12, 20)) == '', '12:20: nada todavía')
    t1 = aviso_a(pg, a_las(12, 35))
    ok('30 minutos' in t1 and '13:00' in t1, f'12:35: «en 30 minutos es hora de volver» ({t1})')
    ok(aviso_a(pg, a_las(12, 40)) == '', '…una sola vez')
    t2 = aviso_a(pg, a_las(13, 1))
    ok('hora de volver con tu guía' in t2, f'13:01: «es hora de volver con tu guía» ({t2})')

    # Sobres esperando: no mientras camina; sí cuando lleva un minuto quieto, una vez
    pg.evaluate("(async () => { await window.__paramo.est.ganar('agua'); })()")
    e = pg.evaluate("window.__paramo.est.estaciones()[0]")
    pg.evaluate(f"window.__paramo.mapa.procesar({{ lat: {e['lat']} + 0.003, lon: {e['lon']}, precision: 8, t: Date.now() }})")
    ok('sobres' not in aviso_a(pg, a_las(13, 1)), 'sobres esperando pero caminando: no avisa')
    t3 = aviso_a(pg, a_las(13, 3))
    ok('un sobre esperando' in t3, f'quieto 2 minutos con 1 sobre: lo recuerda ({t3})')
    ok('sobre' not in aviso_a(pg, a_las(13, 5)), '…una sola vez')
    ctx.close()

    # Sin hora del guía: el cierre oficial del sector (14:00), solo si hoy está en el parque
    ctx, pg = telefono(b); entrar(pg)
    ok(aviso_a(pg, a_las(13, 40)) == '', 'fuera del parque: no avisa la hora de regreso')
    pg.evaluate("window.__paramo.E.aqui = Date.now()")
    t4 = aviso_a(pg, a_las(13, 41))
    ok('14:00' in t4 and 'cierra' in t4, f'en el parque, sin hora del guía: cierre oficial 14:00 ({t4})')
    ctx.close()

    # Batería baja (Chrome en Android la informa)
    ctx, pg = telefono(b, BATERIA); entrar(pg); pg.wait_for_timeout(1200)
    tb = pg.locator('.aviso').inner_text()
    ok('Batería baja' in tb and 'Noche' in tb and 'cámara' in tb, f'batería 15 %: sugiere Noche y cerrar la cámara ({tb[:70]})')
    ok(pg.evaluate("document.documentElement.classList.contains('ahorro')"), '…y con «automático» activa el ahorro de energía')
    ctx.close(); b.close()
print('errores de página:', errores or 'ninguno')
print('RESULTADO:', 'TODO BIEN' if not fallas and not errores else f'{len(fallas)} fallas, {len(errores)} errores')
sys.exit(1 if fallas or errores else 0)
