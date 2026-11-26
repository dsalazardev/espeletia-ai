# Dinámica guía ↔ visitante cuando el QR se escanea con la cámara del teléfono (abre la app por la dirección).
# 1. iPhone que eligió «Abrir sin instalar»: su álbum es Safari, así que el QR se aplica ahí mismo.
# 2. iPhone nuevo (sin álbum en Safari): no se aplica; se muestra el código de 4 dígitos para escribirlo en el álbum.
# 3. QR de hora de regreso o de parada en ese iPhone nuevo: no hay casilla para escribir el código, así que pide la Lente.
# 4. Al entrar al Modo guía, el QR inicial es «Estamos en el parque» (no regala una historia antes de contarla).
# Uso: servidor en :8765;  python3 pruebas/guia_visitante.py
from playwright.sync_api import sync_playwright
import os, sys
URL = os.environ.get('URL', 'http://localhost:8765/')
IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
fallas, errores = [], []

def ok(c, m):
    print('OK   ' if c else 'FALLA', m)
    if not c: fallas.append(m)

def telefono(b, ua=None):
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='es-CO', service_workers='block', user_agent=ua)
    pg = ctx.new_page(); pg.on('pageerror', lambda e: errores.append(str(e)))
    return ctx, pg

def portada(pg, saltar=True):
    pg.goto(URL); pg.wait_for_selector('#tapa-nombre'); pg.fill('#tapa-nombre', 'Ana'); pg.click('.tapa-dueno button')
    if saltar: pg.click('#instalar-saltar', timeout=8000); pg.wait_for_selector('#capa-portada', state='hidden')

def qr(pg, accion):
    return pg.evaluate("(a) => import('./js/guia.js').then((g) => g.contenidoQR(a))", accion)

def avisos(pg):
    return ' '.join(pg.locator('#avisos, .aviso, [role=status]').all_inner_texts())

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', headless=True)
    hist = 'agua'
    # Un teléfono cualquiera genera los QR (la clave es la misma en todos)
    c0, g0 = telefono(b); portada(g0)
    url_h, url_r = qr(g0, f'h:{hist}'), qr(g0, 'r:1330')
    # 4. Modo guía: selección inicial
    g0.click('.muelle [data-accion="ajustes"]'); g0.click('#aj-guia'); g0.wait_for_timeout(400)
    for d in g0.evaluate('window.__paramo.E.paquete.guia.pin'): g0.click(f'.teclado [data-k="{d}"]')
    g0.wait_for_selector('#v-guia:not([hidden]) .guia-qr svg', timeout=10000)
    ini = g0.inner_text('.guia-que')
    ok(g0.get_attribute('.guia-ops [data-a="aqui"]', 'aria-pressed') == 'true', f'el Modo guía empieza en «{ini}», que no entrega cromos')
    c0.close()

    # 1. iPhone que abrió sin instalar: escanea con la cámara → abre Safari con el QR → se aplica
    c1, g1 = telefono(b, IPHONE); portada(g1)
    g1.goto(url_h); g1.wait_for_timeout(2500)
    tiene = g1.evaluate(f"window.__paramo.est.tiene('{hist}')")
    sobre = g1.locator('#capa-sobre:not([hidden])').count()
    ok(tiene and sobre == 1, f'iPhone sin instalar: el QR de la historia se aplica en su álbum y abre el sobre ({tiene}, sobre {sobre})')
    c1.close()

    # 2. iPhone nuevo, sin álbum en este Safari: muestra el código para escribirlo en el álbum instalado
    c2, g2 = telefono(b, IPHONE)
    g2.goto(url_h); g2.wait_for_selector('#tapa-nombre'); g2.fill('#tapa-nombre', 'Ana'); g2.click('.tapa-dueno button'); g2.wait_for_timeout(1200)
    txt = g2.inner_text('body')
    ok('Código del guía' in txt and not g2.evaluate(f"window.__paramo.est.tiene('{hist}')"), 'iPhone nuevo: no lo aplica en Safari y muestra el código de 4 dígitos')
    c2.close()

    # 3. QR de hora de regreso en ese iPhone nuevo: no hay dónde escribir el código → pide la Lente
    c3, g3 = telefono(b, IPHONE)
    g3.goto(url_r); g3.wait_for_selector('#tapa-nombre'); g3.fill('#tapa-nombre', 'Ana'); g3.click('.tapa-dueno button'); g3.wait_for_timeout(1200)
    txt = g3.inner_text('body')
    ok('Leer QR' in txt and 'Código del guía' not in txt, 'QR de hora de regreso en iPhone nuevo: pide escanearlo con la Lente (no da un código sin casilla)')
    c3.close()
    b.close()

ok(not errores, f'sin errores de página {errores[:2]}')
print(f'\n{len(fallas)} falla(s)')
sys.exit(1 if fallas else 0)
