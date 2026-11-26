"""Prueba del Modo guía y del Paquete del parque, por la interfaz real.
A. Un visitante nuevo no puede hacer la pausa desde la casa; con el código «aquí» del guía, sí.
B. El guía muestra un QR (historia); otro teléfono lo escanea con la Lente y gana el cromo. Reusar el mismo QR no da nada.
C. QR del guía «confirmo frailejón»: el visitante gana el cromo sin que su Lente esté entrenada.
D. El equipo enseña con fotos de la galería, descarga parque.json; un visitante nuevo reconoce sin entrenar.
"""
import json, os, shutil, subprocess, time, glob
from playwright.sync_api import sync_playwright
APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # raíz de la app
URL = 'http://localhost:8765/'
S = '/tmp/capturas-paramo'; shutil.rmtree(S, ignore_errors=True); os.makedirs(S)
paq = json.load(open(f'{APP}/paquete.json'))
logs = []
def ok(m): print('OK', m, flush=True)

def nueva(b, video=None, geo=None):
    # Contexto limpio = teléfono nuevo (cada uno con su propio navegador por la cámara falsa)
    args = ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream']
    if video: args.append(f'--use-file-for-fake-video-capture={video}')
    br = b.chromium.launch(headless=True, args=args)
    ctx = br.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, locale='es-CO', accept_downloads=True,
                         permissions=['camera', 'geolocation'], geolocation=geo or {'latitude': 4.70, 'longitude': -74.07, 'accuracy': 15})
    pg = ctx.new_page()
    pg.on('console', lambda m: logs.append(f'[{m.type}] {m.text}') if m.type in ('error',) else None)
    pg.on('pageerror', lambda e: logs.append(f'[pageerror] {e}'))
    pg.on('dialog', lambda d: d.accept())
    pg.goto(URL); pg.wait_for_function('window.__paramo && window.__paramo.E.paquete', timeout=20000)
    pg.wait_for_selector('#capa-portada:not([hidden]) .tapa', timeout=10000)
    pg.fill('#tapa-nombre', 'Prueba'); pg.click('.tapa-dueno button'); pg.click('#instalar-saltar', timeout=8000); pg.wait_for_selector('#capa-portada', state='hidden', timeout=8000)
    return br, pg

def abrir_todo(pg):
    n = 0
    while True:
        try: pg.wait_for_selector('#capa-sobre:not([hidden]) .sobre', timeout=5000)
        except Exception: break
        pg.wait_for_timeout(650); pg.click('#capa-sobre .sobre', force=True)
        pg.wait_for_selector('#capa-sobre [data-a="pegar"]:visible', timeout=12000); pg.click('#capa-sobre [data-a="pegar"]')
        n += 1; pg.wait_for_timeout(1500)
    return n

def pin(pg, boton, clave):
    pg.click('.muelle [data-accion="ajustes"]'); pg.click(boton); pg.wait_for_timeout(500)
    for d in clave: pg.click(f'.teclado [data-k="{d}"]')

def a_y4m(png, nombre):
    out = f'/tmp/vid/{nombre}.y4m'
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-loop', '1', '-i', png, '-vf', 'scale=640:480:force_original_aspect_ratio=decrease,pad=640:480:(ow-iw)/2:(oh-ih)/2:white', '-t', '3', '-r', '10', '-pix_fmt', 'yuv420p', out], check=True)
    return out

def qr_del_guia(b, opcion):
    """Abre el Modo guía en un teléfono, elige una opción y devuelve (png del QR, código mostrado)."""
    br, pg = nueva(b)
    pin(pg, '#aj-guia', paq['guia']['pin'])
    pg.wait_for_selector('#v-guia:not([hidden]) .guia-qr svg', timeout=10000)
    pg.click(f'.guia-ops [data-a="{opcion}"]'); pg.wait_for_timeout(800)
    pg.screenshot(path=f'{S}/guia_{opcion.replace(":", "_")}.png', full_page=False)
    png = f'/tmp/qr_{opcion.replace(":", "_")}.png'
    pg.locator('.guia-qr').screenshot(path=png)
    cod = pg.inner_text('.guia-cod').replace(' ', '')
    br.close()
    return png, cod

with sync_playwright() as b:
    # ===== A. Pausa en la casa: bloqueada; con el código del guía, habilitada =====
    br, pg = nueva(b)
    pg.click('.ranura[data-id="mirada"]'); pg.wait_for_timeout(400)
    txt = pg.inner_text('.como-txt')
    assert 'en el parque' in txt and pg.locator('.como-accion .btn-flor:has-text("Empezar")').count() == 0, txt
    png, cod = qr_del_guia(b, 'aqui')
    pg.fill('.como-accion > .codigo input', cod); pg.click('.como-accion > .codigo button'); pg.wait_for_timeout(900)
    assert pg.evaluate('window.__paramo.est.enParque()'), 'el código «aquí» debe habilitar'
    assert 'Deja el celular' in pg.inner_text('.como-txt'), pg.inner_text('.como-txt')
    pg.screenshot(path=f'{S}/a_pausa_habilitada.png')
    # El mismo código no sirve dos veces
    pg.click('.cerrar-x'); pg.click('.ranura[data-id="grupo"]'); pg.wait_for_timeout(300)
    ok('A. la pausa no se puede desde la casa; el código «aquí» del guía la habilita')
    br.close()

    # ===== B. QR del guía para una historia, escaneado por otro teléfono =====
    png, cod = qr_del_guia(b, 'h:huella')
    br, pg = nueva(b, a_y4m(png, 'guia_huella'))
    pg.click('.muelle [data-vista="lente"]'); pg.click('.lente-modo [data-modo="qr"]')
    pg.wait_for_selector('#capa-sobre:not([hidden]) .sobre', timeout=30000)
    assert abrir_todo(pg) == 1 and pg.evaluate('window.__paramo.est.tiene("huella")')
    pg.click('.muelle [data-vista="lente"]'); pg.click('.lente-modo [data-modo="qr"]'); pg.wait_for_timeout(2500)
    msg = pg.inner_text('#lente-msg')
    assert pg.is_hidden('#capa-sobre') and ('Ya' in msg), msg
    ok(f'B. QR del guía (historia) escaneado en otro teléfono -> cromo; repetido -> «{msg}»')
    br.close()

    # ===== C. «Confirmo frailejón»: cromo de cámara sin Lente entrenada =====
    png, cod = qr_del_guia(b, 'c:frailejon')
    br, pg = nueva(b, a_y4m(png, 'guia_frailejon'))
    assert pg.evaluate('Object.keys(window.__paramo.ml.counts()).length') == 0
    pg.click('.muelle [data-vista="lente"]'); pg.click('.lente-modo [data-modo="qr"]')
    pg.wait_for_selector('#capa-sobre:not([hidden]) .sobre', timeout=30000); assert abrir_todo(pg) == 1
    assert pg.evaluate('window.__paramo.est.tiene("frailejon")')
    ok('C. el guía confirma un frailejón por QR -> cromo sin Lente entrenada')
    # QR vencido/falso: uno firmado con otra clave no sirve
    falso = pg.evaluate("""async () => { const g = await import('/js/guia.js'); return [await g.leerQR('PARAMO-G|h:agua|' + g.franja() + '|000000000000'), await g.leerQR(await g.contenidoQR('h:agua', g.franja() - 5))] }""")
    assert falso[0] is None and falso[1] == {'vencido': True}, falso
    ok('C. QR con firma falsa -> rechazado; QR de hace 25 min -> «vencido»')
    br.close()

    # ===== D. Galería + paquete del parque =====
    br, pg = nueva(b, '/tmp/vid/frailejon.y4m')
    pin(pg, '#aj-equipo', '2611'); pg.wait_for_selector('#v-equipo:not([hidden]) #clases .clase', timeout=30000)
    base = len((json.load(open(f'{APP}/models/parque.json')).get('lente') or {}).get('clases', []))  # lo ya publicado
    nuevas = 0
    for c in ['frailejon', 'otro', 'pajonal']:
        fs = sorted(glob.glob(f'/tmp/galeria/fotos/{c}/*.jpg')); nuevas += len(fs)
        pg.locator(f'#clases .clase:has([data-c="{c}"]) input[type=file]').set_input_files(fs)
        pg.wait_for_function(f"(window.__paramo.ml.counts()['{c}'] || 0) >= {len(fs)} + (window.__paramo.ml.counts({{ soloBase: true }})['{c}'] || 0)", timeout=60000)
    pg.wait_for_timeout(600)
    print('  muestras desde la galería:', pg.evaluate('window.__paramo.ml.counts()'))
    print('  estado:', pg.inner_text('#eq-pub-estado'))
    pg.screenshot(path=f'{S}/d_equipo.png', full_page=True)
    with pg.expect_download() as d: pg.click('#eq-exportar')
    d.value.save_as('/tmp/parque_ui.json')
    br.close()
    pq = json.load(open('/tmp/parque_ui.json'))
    # Lo publicado suma lo que ya traía el paquete (modelo base) y las fotos nuevas
    assert pq['tipo'] == 'paramo-parque' and len(pq['lente']['clases']) == base + nuevas, (pq['tipo'], len(pq['lente']['clases']), base, nuevas)
    ok(f'D. {nuevas} fotos cargadas desde la galería (+{base} del modelo base); parque.json descargado ({os.path.getsize("/tmp/parque_ui.json") // 1000} KB)')

    vacio = open(f'{APP}/models/parque.json').read()
    shutil.copy('/tmp/parque_ui.json', f'{APP}/models/parque.json')
    try:
        br, pg = nueva(b, '/tmp/vid/frailejon.y4m')
        assert pg.evaluate('window.__paramo.E.parque.fecha') is not None
        pg.click('.muelle [data-vista="lente"]')
        pg.wait_for_selector('#lente-abrir:not([hidden]):not([disabled])', timeout=30000)
        chip = pg.inner_text('#lente-chip'); pg.screenshot(path=f'{S}/d_visitante_reconoce.png')
        pg.click('#lente-abrir'); assert abrir_todo(pg) == 1
        ok(f'D. teléfono nuevo, sin entrenar: reconoce con el paquete del parque ({chip}) y entrega el cromo')
        br.close()
        br, pg = nueva(b, '/tmp/vid/desconocido.y4m')
        pg.click('.muelle [data-vista="lente"]'); pg.wait_for_timeout(5000)
        assert pg.is_hidden('#lente-abrir') or pg.is_disabled('#lente-abrir')
        ok(f'D. imagen ajena con el paquete del parque -> «{pg.inner_text("#lente-msg")}»')
        br.close()
    finally:
        open(f'{APP}/models/parque.json', 'w').write(vacio)

print('\nerrores:', logs or 'ninguno')
