# Pausa de aclimatación como cromo (spec docs/specs/2026-11-24-pausa-aclimatacion.md, issue #18).
# paquete.json todavía no trae cromos «aclimatacion» (los define R1): la prueba inyecta uno en Brisas (10 minutos)
# y usa un reloj simulado. Uso: servidor en :8765 desde la carpeta principal;  python3 pruebas/aclimatacion.py
from playwright.sync_api import sync_playwright
import json, os, sys
URL = os.environ.get('URL', 'http://localhost:8765/')
APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
fallas, errores = [], []

def ok(c, m):
    print('OK   ' if c else 'FALLA', m)
    if not c: fallas.append(m)

paq = json.load(open(os.path.join(APP, 'paquete.json'), encoding='utf-8'))
paq['cromos'].append({'n': 25, 'id': 'descanso_e1', 'ficha': 'aclimatar', 'tema': {'es': 'aclimatarse', 'en': 'acclimatizing'}, 'capitulo': 'sendero',
                      'tipo': 'aclimatacion', 'estacion': 'e1', 'segundos': 600, 'personaje': 'condor', 'fuente': 'pnn_web',
                      'es': {'nombre': 'Descanso en Brisas', 'dato': 'Prueba: pausa de aclimatación.'}, 'en': {'nombre': 'Rest at Brisas', 'dato': 'Test: acclimatization pause.'}})
CUERPO = json.dumps(paq, ensure_ascii=False)

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', headless=True)
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='es-CO', service_workers='block')
    ctx.route('**/paquete.json', lambda r: r.fulfill(status=200, content_type='application/json', body=CUERPO))
    pg = ctx.new_page(); pg.on('pageerror', lambda e: errores.append(str(e)))
    reloj = [False]
    def esperar(sel, n=60):  # con el reloj simulado, las animaciones avanzan solo si se corre el reloj
        for _ in range(n):
            if pg.locator(sel).count() and pg.locator(sel).first.is_visible(): return True
            (pg.clock.run_for(250) if reloj[0] else None); pg.wait_for_timeout(250 if not reloj[0] else 30)
        return False
    def pegar_sobre():
        if not esperar('#capa-sobre:not([hidden]) .sobre'):
            print('   sin sobre:', pg.evaluate("({ pend: Object.entries(window.__paramo.E.album).filter(([k, v]) => !v.abierto).map(([k]) => k), vis: window.__paramo.E.visitadas, oculto: document.querySelector('#capa-sobre').hidden })")); return
        (pg.clock.run_for(700) if reloj[0] else pg.wait_for_timeout(700)); pg.wait_for_timeout(50)  # el sobre necesita entrar antes del toque
        pg.click('#capa-sobre .sobre', force=True)
        esperar('#capa-sobre [data-a="pegar"]'); pg.click('#capa-sobre [data-a="pegar"]'); (pg.clock.run_for(1000) if reloj[0] else pg.wait_for_timeout(1000))
    pg.goto(URL); pg.wait_for_selector('#tapa-nombre'); pg.fill('#tapa-nombre', 'Ana')
    pg.click('.tapa-dueno button'); pg.click('#instalar-saltar', timeout=8000); pg.wait_for_selector('#capa-portada', state='hidden')

    # Lejos de la estación y sin el código del guía: no se puede
    pg.click('.muelle [data-vista="mapa"]'); pg.wait_for_timeout(800)
    pg.evaluate("window.__paramo.mapa.abrirEstacion('e1')"); pg.wait_for_selector('#capa-estacion [data-aclim]')
    pg.click('#capa-estacion [data-aclim]'); pg.wait_for_timeout(300)
    ok(pg.locator('#capa-pausa').is_hidden() and 'Brisas' in pg.locator('.aviso').inner_text(), 'fuera de la estación: pide llegar o el código del guía')
    pg.click('#capa-estacion [data-x]')
    # En Brisas (GPS dentro del radio)
    pg.evaluate("(async () => { const e = window.__paramo.est.estaciones()[0]; await window.__paramo.mapa.procesar({ lat: e.lat, lon: e.lon, precision: 8, altitud: 4100, altPrec: 8, t: Date.now() }); })()")
    pg.wait_for_timeout(500)
    pg.evaluate("window.__paramo.irA('album')"); pg.wait_for_timeout(500)
    pg.evaluate("() => { window.__paramo.abrirSobres(); }"); pegar_sobre()  # el sobre de llegar a Brisas
    pg.evaluate("window.__paramo.irA('mapa')"); pg.wait_for_timeout(500)
    pg.evaluate("window.__paramo.mapa.abrirEstacion('e1')"); pg.wait_for_selector('#capa-estacion [data-aclim]')
    ok('10 min' in pg.locator('#capa-estacion [data-aclim]').inner_text(), 'en la estación: «Pausa de aclimatación (10 min)»')
    pg.clock.install(); reloj[0] = True  # reloj simulado desde aquí
    pg.click('#capa-estacion [data-aclim]'); pg.wait_for_selector('#capa-pausa:not([hidden])')
    # 6 minutos, toca la pantalla: se reinicia
    pg.clock.fast_forward('06:00'); pg.mouse.click(195, 400); pg.wait_for_timeout(100)
    ok('reinici' in pg.locator('#pausa-estado').inner_text().lower() or 'empez' in pg.locator('#pausa-estado').inner_text().lower(), f"tocar la pantalla reinicia el tiempo ({pg.locator('#pausa-estado').inner_text()[:50]})")
    pg.clock.fast_forward('09:00'); pg.clock.run_for(1100)
    ok(not pg.evaluate("!!window.__paramo.E.album.descanso_e1"), 'a los 9 minutos desde que tocó, todavía no')
    pg.clock.fast_forward('01:05'); pg.clock.run_for(1100); pg.wait_for_timeout(300)
    ok(pg.evaluate("!!window.__paramo.E.album.descanso_e1"), '10 minutos sin tocar: cromo de descanso de la estación')
    pg.clock.resume(); reloj[0] = False  # de aquí en adelante, el reloj corre normal (animaciones del sobre)
    # El sobre y luego la ficha oficial
    pegar_sobre()
    esperar('.aclim-fin')
    fin = pg.locator('.aclim-fin').inner_text()
    ok('Hidrátate' in fin and 'avísale a tu guía' in fin, 'al terminar: la ficha oficial «aclimatar» y avisar al guía si se siente mal')
    pg.click('.aclim-fin [data-mal]'); pg.wait_for_timeout(1500)
    ok(not pg.locator('#v-chat').is_hidden(), '«Señales del mal de altura» abre el chat en esa ficha')
    ctx.close(); b.close()
print('errores de página:', errores or 'ninguno')
print('RESULTADO:', 'TODO BIEN' if not fallas and not errores else f'{len(fallas)} fallas, {len(errores)} errores')
sys.exit(1 if fallas or errores else 0)
