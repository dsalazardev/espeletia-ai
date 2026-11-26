# La Lente reconoce desde el primer uso: carga el modelo base de models/parque.json, deja de decir
# «todavía no conoce las cosas del páramo» y responde (o duda) con la cámara en vivo, con cámara simulada.
# También revisa que el modelo base cumpla lo mínimo para servir (≥ 2 clases con ≥ minPorClase ejemplos).
# Uso: servidor en :8765; necesita ffmpeg y  pip install pillow;  python3 pruebas/lente.py
from playwright.sync_api import sync_playwright
import json, os, subprocess, sys, tempfile
from PIL import Image
URL = os.environ.get('URL', 'http://localhost:8765/')
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
fallas, errores = [], []

def ok(c, m):
    print('OK   ' if c else 'FALLA', m)
    if not c: fallas.append(m)

def video(img):
    d = tempfile.mkdtemp(); png, y4m = f'{d}/x.png', f'{d}/x.y4m'
    img.save(png)
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-loop', '1', '-i', png, '-t', '4', '-r', '10', '-pix_fmt', 'yuv420p', y4m], check=True)
    return y4m

paquete = json.load(open(os.path.join(RAIZ, 'paquete.json')))
cfg = paquete['camara']
paisaje = Image.open(os.path.join(RAIZ, 'models', 'relieve.webp')).convert('RGB').resize((640, 480))
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', headless=True,
                          args=['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', f'--use-file-for-fake-video-capture={video(paisaje)}'])
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='es-CO', service_workers='block', permissions=['camera'])
    pg = ctx.new_page(); pg.on('pageerror', lambda e: errores.append(str(e)))
    pg.goto(URL); pg.wait_for_selector('#tapa-nombre'); pg.fill('#tapa-nombre', 'Ana')
    pg.click('.tapa-dueno button'); pg.click('#instalar-saltar', timeout=8000); pg.wait_for_selector('#capa-portada', state='hidden')

    pg.click('.muelle [data-vista="lente"]')
    pg.evaluate("async () => { const m = await import('./js/ml.js'); for (let i = 0; i < 600 && !m.ready(); i++) await new Promise((r) => setTimeout(r, 100)); }")
    base = pg.evaluate("import('./js/ml.js').then((m) => m.counts({ soloBase: true }))")
    listas = [k for k, n in base.items() if n >= cfg['minPorClase']]
    clases = [k['id'] for k in paquete['clases']]
    ok(len(listas) >= 2, f'el modelo base trae clases listas desde el primer uso: {base}')
    ok(set(base) <= set(clases), 'todas las clases del modelo base existen en paquete.json')
    ok('otro' in listas, 'el modelo base incluye «otro» (lo que no es ninguna clase)')

    pg.wait_for_timeout(4000)  # varios cuadros de la cámara
    msg = pg.locator('#lente-msg').inner_text()
    sin = 'todavía no conoce' in msg
    ok(not sin, f'con la cámara en vivo ya no dice que no conoce el páramo («{msg[:70]}»)')

    # Promedio de cuadros: misma imagen → misma clase y confianza estable; al cambiar de escena se reinicia
    r = pg.evaluate("""async () => { const ml = await import('./js/ml.js'); const v = document.querySelector('#video');
        ml.olvidarCuadros(); const a = await ml.classify(v, { seguido: true }); const b = await ml.classify(v, { seguido: true });
        const c = await ml.classify(v, { seguido: true }); const solo = await ml.classify(v); return { a, b, c, solo }; }""")
    ok(r['a']['clase'] == r['b']['clase'] == r['c']['clase'] == r['solo']['clase'], f"con el promedio de cuadros la respuesta no salta ({r['c']['clase']}, {r['c']['confianza']:.2f})")
    ok(abs(r['c']['confianza'] - r['solo']['confianza']) < 0.05, 'con la misma imagen el promedio da lo mismo que un cuadro solo')
    ctx.close(); b.close()

ok(not errores, f'sin errores de página {errores[:2]}')
print(f'\n{len(fallas)} falla(s)')
sys.exit(1 if fallas else 0)
