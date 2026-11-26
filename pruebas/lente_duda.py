# La Lente duda con una foto real difícil («Quizá frailejón») y el visitante igual consigue su cromo:
# toca «Que lo confirme mi guía», escribe el código de 4 dígitos del guía y se abre el sobre.
# Foto: «Mas cerca al cielo.jpg» (Maribelhiguera, CC BY-SA 4.0, Wikimedia Commons), fuera del modelo base.
# Uso: servidor en :8765; FOTO=/ruta/foto.jpg python3 pruebas/lente_duda.py  (sin FOTO usa un paisaje del repo)
from playwright.sync_api import sync_playwright
import os, subprocess, sys, tempfile
URL = os.environ.get('URL', 'http://localhost:8765/')
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FOTO = os.environ.get('FOTO') or os.path.join(RAIZ, 'models', 'relieve.webp')
fallas, errores = [], []

def ok(c, m):
    print('OK   ' if c else 'FALLA', m)
    if not c: fallas.append(m)

d = tempfile.mkdtemp(); y4m = f'{d}/x.y4m'
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-loop', '1', '-i', FOTO, '-vf', 'scale=640:480:force_original_aspect_ratio=increase,crop=640:480',
                '-t', '4', '-r', '10', '-pix_fmt', 'yuv420p', y4m], check=True)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', headless=True,
                          args=['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', f'--use-file-for-fake-video-capture={y4m}'])
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='es-CO', service_workers='block', permissions=['camera'])
    pg = ctx.new_page(); pg.on('pageerror', lambda e: errores.append(str(e)))
    pg.goto(URL); pg.wait_for_selector('#tapa-nombre'); pg.fill('#tapa-nombre', 'Ana')
    pg.click('.tapa-dueno button'); pg.click('#instalar-saltar', timeout=15000); pg.wait_for_selector('#capa-portada', state='hidden')
    pg.click('.muelle [data-vista="lente"]')
    pg.evaluate("async () => { const m = await import('./js/ml.js'); for (let i = 0; i < 600 && !m.ready(); i++) await new Promise((r) => setTimeout(r, 100)); }")
    # Sin FOTO se usa el sombreado del relieve: no es nada del páramo y la Lente duda («otra cosa»)
    pg.wait_for_selector('#lente-abrir:visible', timeout=10000)
    ok('confirme' in pg.inner_text('#lente-abrir'), f"con duda ofrece «{pg.inner_text('#lente-abrir')}»")
    chip = pg.inner_text('#lente-chip') if pg.locator('#lente-chip').is_visible() else ''
    pg.click('#lente-abrir')
    pg.wait_for_selector('#lente-confirma .codigo input')
    clase = pg.eval_on_selector('#lente-confirma select', 'e => e.value')
    if chip: ok(clase in chip.lower().replace('ó', 'o') or chip.lower().startswith('quizá'), f'la caja trae elegida la cosa que la Lente sospecha ({clase}; chip «{chip}»)')
    pg.select_option('#lente-confirma select', 'frailejon')
    antes = pg.evaluate("import('./js/estado.js').then((m) => Object.keys(m.E.album).length)")
    cod = pg.evaluate("import('./js/guia.js').then((g) => g.codigo('c:frailejon'))")
    pg.fill('#lente-confirma .codigo input', cod); pg.click('#lente-confirma .codigo button')
    pg.wait_for_timeout(1500)
    tiene = pg.evaluate("import('./js/estado.js').then((m) => !!m.E.album.frailejon)")
    ok(tiene, 'con el código del guía se gana el cromo «frailejón»')
    ok(pg.locator('#lente-confirma').count() == 0, 'la caja de confirmación se cierra al ganar')
    pg.screenshot(path=os.environ.get('CAPTURA', '/tmp/lente_duda.png'))
    ctx.close(); b.close()
ok(not errores, f'sin errores de página {errores[:2]}')
print(f'\n{len(fallas)} falla(s)')
sys.exit(1 if fallas else 0)
