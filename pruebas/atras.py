# Botón «atrás» del teléfono: no saca de la app de una.
# Cierra lo de encima → vuelve al Álbum → pregunta «¿Salir del álbum?» (Quedarme / Salir). Un segundo «atrás» sale.
# Uso: servidor en :8765;  python3 pruebas/atras.py
from playwright.sync_api import sync_playwright
import os, sys
URL = os.environ.get('URL', 'http://localhost:8765/')
fallas, errores = [], []

def ok(c, m):
    print('OK   ' if c else 'FALLA', m)
    if not c: fallas.append(m)

def abrir(b):
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='es-CO', service_workers='block')
    pg = ctx.new_page(); pg.on('pageerror', lambda e: errores.append(str(e)))
    pg.goto('data:text/html,<p>antes</p>')  # una página anterior, como el lanzador o el navegador
    pg.goto(URL); pg.wait_for_selector('#tapa-nombre'); pg.fill('#tapa-nombre', 'Ana'); pg.click('.tapa-dueno button')
    pg.click('#instalar-saltar', timeout=8000); pg.wait_for_selector('#capa-portada', state='hidden'); pg.wait_for_timeout(500)
    return ctx, pg

def atras(pg):
    pg.evaluate('history.back()'); pg.wait_for_timeout(700)

def en_app(pg): return pg.url.startswith(URL)

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', headless=True)
    ctx, pg = abrir(b)
    # 1. Detalle de un cromo abierto → «atrás» lo cierra
    pg.click('.ranura >> nth=0'); pg.wait_for_selector('#capa-detalle:not([hidden])')
    atras(pg)
    ok(en_app(pg) and pg.locator('#capa-detalle').is_hidden(), '«atrás» con un cromo abierto lo cierra y sigue en la app')
    # 2. Desde el Mapa → vuelve al Álbum
    pg.click('.muelle [data-vista="mapa"]'); pg.wait_for_timeout(600)
    atras(pg)
    ok(en_app(pg) and pg.locator('#v-album').is_visible(), '«atrás» desde el Mapa vuelve al Álbum')
    # 3. Hoja de Ajustes → la cierra
    pg.click('.muelle [data-accion="ajustes"]'); pg.wait_for_selector('#capa-ajustes:not([hidden])')
    atras(pg)
    ok(en_app(pg) and pg.locator('#capa-ajustes').is_hidden(), '«atrás» cierra Ajustes')
    # 4. En el Álbum → pregunta
    atras(pg)
    ok(en_app(pg) and pg.locator('#capa-detalle:not([hidden]) .salir').count() == 1, f"en el Álbum pregunta: «{pg.inner_text('#salir-titulo') if pg.locator('#salir-titulo').count() else ''}»")
    pg.click('[data-quedarme]'); pg.wait_for_timeout(300)
    ok(en_app(pg) and pg.locator('#capa-detalle').is_hidden(), '«Quedarme» cierra la pregunta y sigue en la app')
    # 5. Otra vez «atrás» pregunta de nuevo; un segundo «atrás» sale
    atras(pg)
    ok(pg.locator('.salir').count() == 1, 'después de «Quedarme», «atrás» vuelve a preguntar')
    atras(pg)
    ok(not en_app(pg), f'un segundo «atrás» con la pregunta abierta sale ({pg.url[:30]})')
    ctx.close()
    # 6. «Salir» sale
    ctx, pg = abrir(b)
    atras(pg); pg.click('[data-salir]'); pg.wait_for_timeout(900)
    ok(not en_app(pg), '«Salir» sale de la app')
    ctx.close()
    # 7. Con QR del guía en la dirección, «atrás» no se confunde
    ctx, pg = abrir(b)
    url = pg.evaluate("import('./js/guia.js').then((g) => g.contenidoQR('aqui'))")
    pg.evaluate(f"location.hash = {url.split('#',1)[1]!r}"); pg.wait_for_timeout(1500)
    atras(pg); atras(pg)
    ok(en_app(pg) and pg.locator('.salir').count() == 1, 'después de un QR por la dirección, «atrás» sigue preguntando antes de salir')
    ctx.close(); b.close()

ok(not errores, f'sin errores de página {errores[:2]}')
print(f'\n{len(fallas)} falla(s)')
sys.exit(1 if fallas else 0)
