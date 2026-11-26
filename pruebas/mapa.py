"""Prueba del mapa y la bitácora, por la interfaz real.
Simula una caminata Brisas → Valle de las Tumbas con altura del GPS, revisa la bitácora (altura, máxima,
subida, distancia, tiempo, perfil y rastro), la hoja de cada estación, el código del guía como plan B,
el permiso de GPS negado, el aviso de altura que abre el chat y un teléfono sin altura por GPS.
Necesita el servidor en :8765.
"""
import json, os, shutil, time, hmac, hashlib, math, random
from playwright.sync_api import sync_playwright
APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = 'http://localhost:8765/'
S = '/tmp/capturas-mapa'; shutil.rmtree(S, ignore_errors=True); os.makedirs(S)
paq = json.load(open(os.path.join(APP, 'paquete.json')))
EST = paq['estaciones']
logs = []
def ok(m): print('OK', m, flush=True)
def codigo_guia(accion):
    f = int(time.time() * 1000) // (paq['guia']['franjaMin'] * 60000)
    x = hmac.new(paq['guia']['clave'].encode(), f'cod|{accion}|{f}'.encode(), hashlib.sha256).hexdigest()
    return str(int(x[:8], 16) % 10000).zfill(4)

def nueva(b, permiso=True):
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, locale='es-CO',
                        permissions=['geolocation'] if permiso else [], geolocation={'latitude': 5.068, 'longitude': -75.517, 'accuracy': 20})
    pg = ctx.new_page()
    pg.on('console', lambda m: logs.append(f'[{m.type}] {m.text}') if m.type == 'error' else None)
    pg.on('pageerror', lambda e: logs.append(f'[pageerror] {e}'))
    pg.on('dialog', lambda d: d.accept())
    pg.goto(URL); pg.wait_for_selector('#capa-portada:not([hidden]) .tapa', timeout=15000)
    pg.fill('#tapa-nombre', 'Prueba'); pg.click('.tapa-dueno button'); pg.click('#instalar-saltar', timeout=8000); pg.wait_for_selector('#capa-portada', state='hidden')
    return ctx, pg

def caminata(conAltura=True):
    """Puntos cada ~25 m por la ruta, 1 cada 30 s, altura subiendo con ruido de GPS."""
    rnd = random.Random(3); pts = []; t0 = int(time.time() * 1000) - 3 * 3600 * 1000
    for a, b in zip(EST, EST[1:]):
        d = math.hypot((b['lat'] - a['lat']) * 111320, (b['lon'] - a['lon']) * 111320)
        n = max(2, int(d / 25))
        for i in range(n):
            f = i / n
            pts.append({'lat': a['lat'] + (b['lat'] - a['lat']) * f, 'lon': a['lon'] + (b['lon'] - a['lon']) * f, 'precision': 9,
                        'altitud': (a['altura'] + (b['altura'] - a['altura']) * f + rnd.uniform(-8, 8)) if conAltura else None,
                        'altPrec': 15 if conAltura else None})
    e = EST[-1]; pts.append({'lat': e['lat'], 'lon': e['lon'], 'precision': 9, 'altitud': e['altura'] + 2 if conAltura else None, 'altPrec': 15 if conAltura else None})
    for i, p in enumerate(pts): p['t'] = t0 + i * 30000
    return pts

with sync_playwright() as pw:
    # SwiftShader: WebGL por software, para poder probar el 3D sin tarjeta gráfica
    b = pw.chromium.launch(headless=True, args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    # ===== 1) Lejos del parque: volcán, fin autorizado, escala y norte; nada se registra =====
    ctx, pg = nueva(b)
    pg.click('.muelle [data-vista="mapa"]'); pg.wait_for_timeout(2500)
    assert pg.locator('#mapa .volcan').count() == 1 and pg.locator('#mapa .vedado').count() == 1
    assert pg.locator('#mapa .escala').count() == 1 and pg.locator('#mapa .norte').count() == 1
    assert 'lejos' in pg.text_content('#mapa .nota-mapa')
    n = pg.evaluate("(async () => (await import('/js/bitacora.js')).lista().length)()")
    assert n == 0, n
    pg.screenshot(path=f'{S}/1_lejos.png', full_page=True)
    ok(f'lejos del parque: volcán «{pg.text_content("#mapa .volcan").strip()}», fin del recorrido autorizado, escala «{pg.text_content("#mapa .escala").strip()}» y norte; el viaje no se registra')

    # ===== 2) Caminata simulada con altura del GPS =====
    pts = caminata()
    for p in pts: pg.evaluate("(p) => window.__paramo.mapa.procesar(p)", p)
    pg.wait_for_timeout(1500)
    r = pg.evaluate("(async () => (await import('/js/bitacora.js')).resumen())()")
    assert pg.evaluate('window.__paramo.est.pendientes().length') == 4
    assert 4420 <= r['altMax'] <= 4470 and 280 <= r['subida'] <= 520 and 2800 <= r['distancia'] <= 3800, r
    pg.click('.muelle [data-vista="album"]'); pg.wait_for_timeout(300); pg.click('.muelle [data-vista="mapa"]'); pg.wait_for_timeout(1200)
    bit_txt = pg.inner_text('#bitacora')
    assert 'Altura ahora' in bit_txt and '4.4' in bit_txt and pg.locator('#bitacora .perfil').count() == 1 and pg.locator('#mapa .rastro').count() == 1, bit_txt
    pg.screenshot(path=f'{S}/2_caminata.png', full_page=True)
    ok(f"caminata de {len(pts)} puntos: 4 estaciones -> 4 sobres; bitácora: máxima {r['altMax']} m, subida {r['subida']} m, {r['distancia']} m, {round(r['duracion']/60000)} min; perfil y rastro dibujados")

    # ===== 3) Hoja de una estación visitada → Preguntar a Fray =====
    pg.click('#estaciones [data-est="e1"]'); pg.wait_for_selector('#capa-estacion:not([hidden]) .hoja-estacion', timeout=5000)
    hoja = pg.inner_text('.hoja-estacion'); assert 'Brisas' in hoja and 'Visitada a las' in hoja, hoja
    pg.screenshot(path=f'{S}/3_hoja_estacion.png')
    pg.click('.hoja-estacion .btn-linea:has-text("Preguntar")'); pg.wait_for_selector('#v-chat:not([hidden]) #chat-tema:not([hidden])', timeout=15000)
    assert 'Brisas' in pg.inner_text('#chat-tema')
    ok('hoja de estación visitada (hora de llegada y dato) -> «Preguntar a Fray» abre el chat sobre Brisas')

    # ===== 4) Aviso de altura → chat del mal de altura =====
    pg.click('.muelle [data-vista="mapa"]'); pg.wait_for_selector('#bit-altura', timeout=5000)
    pg.click('#bit-altura'); pg.wait_for_selector('#v-chat:not([hidden]) #chat-log .ficha', timeout=20000); pg.wait_for_timeout(600)
    assert 'mal de altura' in pg.inner_text('#chat-tema') and 'altura' in pg.locator('#chat-log .ficha').last.inner_text().lower()
    ok('«Estás a 4.4xx m: camina despacio» -> abre el chat con la ficha del mal de altura')

    # ===== 5) El póster del álbum lleva el recorrido =====
    r2 = pg.evaluate("""async () => { const m = await import('/js/exportar.js'); const b = await m.albumPNG(); return b.size; }""")
    assert r2 > 100000
    ok('el póster del álbum se genera con la línea del recorrido')
    ctx.close()

    # ===== 6) Plan B: estación no visitada con el código del guía =====
    ctx, pg = nueva(b)
    pg.click('.muelle [data-vista="mapa"]'); pg.wait_for_timeout(1500)
    pg.click('#mapa .pin[data-est="e2"]'); pg.wait_for_selector('.hoja-estacion', timeout=5000)
    assert 'Al llegar ganas el cromo' in pg.inner_text('.hoja-estacion')
    pg.click('.hoja-estacion .plan-b summary')
    pg.fill('.hoja-estacion .codigo input', codigo_guia('e:e2')); pg.click('.hoja-estacion .codigo button')
    pg.wait_for_selector('#capa-sobre:not([hidden]) .sobre', timeout=10000)
    ok('estación sin GPS: tocar el pin -> código del guía -> sobre de «Frío de altura»')
    ctx.close()

    # ===== 7) Teléfono sin altura por GPS: «≈» con la altura de la estación =====
    ctx, pg = nueva(b)
    pg.click('.muelle [data-vista="mapa"]'); pg.wait_for_timeout(800)
    for p in caminata(conAltura=False)[:12]: pg.evaluate("(p) => window.__paramo.mapa.procesar(p)", p)
    pg.wait_for_timeout(800)
    t = pg.inner_text('#bitacora'); assert '≈' in t and 'no da la altura' in t, t
    ok(f'teléfono sin altura por GPS -> «≈» con la altura del terreno según el relieve, y lo explica')
    ctx.close()

    # ===== 8) Permiso de GPS negado: ayuda con botón =====
    ctx, pg = nueva(b, permiso=False)
    pg.click('.muelle [data-vista="mapa"]'); pg.wait_for_selector('#gps-ayuda:not([hidden])', timeout=8000)
    assert pg.locator('#gps-ayuda [data-r]').count() == 1 and pg.locator('#gps-ayuda [data-m]').count() == 1
    pg.screenshot(path=f'{S}/4_sin_permiso.png')
    ok(f'permiso negado -> «{pg.inner_text("#gps-ayuda p")[:60]}…» con «Intentar de nuevo»')
    ctx.close()
    # ===== 9) Relieve real y vista 3D =====
    ctx, pg = nueva(b)
    pg.click('.muelle [data-vista="mapa"]'); pg.wait_for_selector('#mapa-modo:not([hidden])', timeout=10000)
    assert pg.locator('#mapa image.relieve').count() == 1 and 'Copernicus' in pg.inner_text('#mapa-fuente')
    ok('mapa plano con relieve real (Copernicus DEM) y su atribución')
    t0 = time.time(); pg.click('#mapa-modo [data-m="3d"]')
    pg.wait_for_function("(async () => (await import('/js/mapa3d.js')).estado().estaciones === 4)()", timeout=20000)
    pg.wait_for_timeout(1800)
    pg.screenshot(path=f'{S}/5_3d.png')
    box = pg.locator('#mapa3d-capa').bounding_box(); cx, cy = box['x'] + box['width'] / 2, box['y'] + box['height'] / 2
    yaw0 = pg.evaluate("(async () => (await import('/js/mapa3d.js')).estado().cam.yaw)()")
    pg.mouse.move(cx, cy); pg.mouse.down(); pg.mouse.move(cx - 120, cy + 20, steps=8); pg.mouse.up(); pg.wait_for_timeout(300)
    yaw1 = pg.evaluate("(async () => (await import('/js/mapa3d.js')).estado().cam.yaw)()")
    assert abs(yaw1 - yaw0) > 0.5, (yaw0, yaw1)
    pg.screenshot(path=f'{S}/6_3d_girado.png')
    # tocar una estación en 3D abre su hoja
    pts = pg.evaluate("(async () => (await import('/js/mapa3d.js')).estado().pts)()")
    e1 = next(p for p in pts if p['id'] == 'e1')
    pg.mouse.click(box['x'] + e1['x'], box['y'] + e1['y']); pg.wait_for_selector('#capa-estacion:not([hidden]) .hoja-estacion', timeout=5000)
    assert 'Brisas' in pg.inner_text('.hoja-estacion'); pg.click('.hoja-estacion [data-x]')
    ok(f'3D listo en {time.time() - t0:.1f} s (con WebGL por software); un dedo lo gira ({yaw0:.2f} -> {yaw1:.2f}); tocar Brisas abre su hoja')
    pg.click('#mapa-modo [data-m="plano"]'); pg.wait_for_timeout(300)
    assert pg.is_hidden('#vista3d') and pg.locator('#mapa').is_visible()
    ok('se vuelve al plano')
    ctx.close()
    b.close()
print('\nerrores:', logs or 'ninguno')
