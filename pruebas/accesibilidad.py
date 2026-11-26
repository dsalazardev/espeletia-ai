# Accesibilidad, rol visible, insignia validado/borrador y ahorro de energía (issue #22).
# Corre axe-core (WCAG 2.1 A/AA + buenas prácticas) en portada, álbum, Lente, mapa, chat, Modo guía y Ajustes,
# en tema papel y noche, y revisa los ajustes nuevos.
# Uso: servidor en :8765 y axe-core en node_modules (npm i axe-core) o en AXE=/ruta/axe.min.js;  python3 pruebas/accesibilidad.py
from playwright.sync_api import sync_playwright
import os, sys
URL = os.environ.get('URL', 'http://localhost:8765/')
AXE = open(os.environ.get('AXE', 'node_modules/axe-core/axe.min.js')).read()
REGLAS = "['wcag2a','wcag2aa','wcag21a','wcag21aa','best-practice']"
fallas, errores = [], []

def ok(c, m):
    print('OK   ' if c else 'FALLA', m)
    if not c: fallas.append(m)

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', headless=True, args=['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'])
    for tema in ['papel', 'noche']:
        ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='es-CO', service_workers='block', permissions=['camera'])
        pg = ctx.new_page(); pg.on('pageerror', lambda e: errores.append(str(e)))
        pg.goto(URL); pg.wait_for_selector('#tapa-nombre')
        def axe(nombre):
            if not pg.evaluate('!!window.axe'): pg.add_script_tag(content=AXE)
            v = pg.evaluate(f"axe.run(document, {{ runOnly: {REGLAS} }}).then((r) => r.violations.map((v) => v.id + ' (' + v.nodes.length + ')'))")
            ok(not v, f'axe {tema}/{nombre}: {", ".join(v) or "sin problemas"}')
        axe('portada')
        pg.fill('#tapa-nombre', 'Ana'); pg.click('.tapa-dueno button'); pg.click('#instalar-saltar', timeout=8000); pg.wait_for_selector('#capa-portada', state='hidden')
        pg.evaluate(f"(async () => {{ const {{ E, est }} = window.__paramo; E.ajustes.tema = '{tema}'; await est.guardar(); (await import('./js/ajustes.js')).aplicarTema();"
                    " for (const c of E.paquete.cromos.slice(0, 8)) { await est.ganar(c.id); await est.abrir(c.id); } })()")
        pg.wait_for_timeout(600); pg.click('.muelle [data-vista="album"]'); pg.wait_for_timeout(400); axe('album')
        for v in ['lente', 'mapa', 'chat']:
            pg.click(f'.muelle [data-vista="{v}"]'); pg.wait_for_timeout(1500); axe(v)
        pg.evaluate("window.__paramo.irA('guia')"); pg.wait_for_timeout(800); axe('guia')
        if tema == 'papel':
            ok(pg.locator('#rol-banda').is_visible() and 'Modo guía' in pg.locator('#rol-banda').inner_text(), 'rol visible: banda «Modo guía» en el teléfono del guía')
        pg.evaluate("window.__paramo.irA('album')"); pg.wait_for_timeout(300)
        ok(not pg.locator('#rol-banda').is_visible(), f'{tema}: sin banda en el teléfono del visitante') if tema == 'papel' else None
        pg.click('.muelle [data-accion="ajustes"]'); pg.wait_for_timeout(600); axe('ajustes')
        if tema == 'papel':
            ok('Visitante' in pg.locator('.aj-rol').inner_text(), 'rol visible: «Visitante» en Ajustes')
            base = pg.evaluate("parseFloat(getComputedStyle(document.body).fontSize)")
            pg.click('[data-texto="mg"]'); pg.wait_for_timeout(200)
            grande = pg.evaluate("parseFloat(getComputedStyle(document.body).fontSize)")
            ok(grande >= base * 1.2, f'tamaño de texto: {base:.0f} px → {grande:.0f} px')
            pg.check('#aj-contraste'); pg.click('[data-ahorro="si"]'); pg.wait_for_timeout(200)
            ok(pg.evaluate("document.documentElement.classList.contains('contraste') && document.documentElement.classList.contains('ahorro')"), 'alto contraste y ahorro de energía se aplican')
            axe('ajustes con texto grande y contraste')
            ok(pg.evaluate("import('./js/util.js').then((u) => u.reducido())"), 'ahorro: las animaciones se reducen')
            pg.click('#aj-creditos'); pg.wait_for_timeout(500)
            cr = pg.locator('.hoja-creditos').inner_text()
            ok(all(k in cr for k in ['ONNX Runtime', 'MobileNetV2', 'SIL OFL 1.1', 'Copernicus WorldDEM-30', 'Atkinson']), 'Créditos y licencias: componentes, licencias y atribución de Copernicus')
            axe('créditos')
            pg.click('#aj-cerrar'); pg.wait_for_timeout(300)
            pg.click('.muelle [data-vista="mapa"]'); pg.wait_for_timeout(1500)
            ok(pg.locator('#mapa-modo').is_hidden(), 'ahorro: el mapa queda en plano (sin 3D)')
            ok('ver créditos' in pg.locator('#mapa-fuente').inner_text(), 'mapa: atribución corta que lleva a créditos')
            pg.click('#mapa-fuente button'); pg.wait_for_selector('.hoja-creditos'); pg.click('#aj-cerrar')
            pg.click('.muelle [data-vista="chat"]'); pg.wait_for_timeout(2500)
            pg.fill('#chat-in', 'qué debo llevar'); pg.press('#chat-in', 'Enter'); pg.wait_for_timeout(1500)
            ins = pg.locator('#chat-log .ficha').last.locator('.insignia')
            ok(ins.count() == 1 and 'Borrador' in ins.inner_text() and 'validado' in ins.inner_text(), 'insignia «Borrador» en la ficha, con texto para el lector de pantalla')
        ctx.close()
    b.close()
print('errores de página:', errores or 'ninguno')
print('RESULTADO:', 'TODO BIEN' if not fallas and not errores else f'{len(fallas)} fallas, {len(errores)} errores')
sys.exit(1 if fallas or errores else 0)
