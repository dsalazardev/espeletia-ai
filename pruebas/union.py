"""Prueba de la unión Lente → chat, por la interfaz real.
Necesita: servidor en :8765, /tmp/vid/frailejon.y4m y desconocido.y4m, fotos en /tmp/galeria/fotos/<clase>/,
y un paquete del parque con la Lente enseñada en /tmp/parque_ui.json (lo genera guia_parque.py).
"""
import os, shutil, glob, json
from playwright.sync_api import sync_playwright
APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = 'http://localhost:8765/'
S = '/tmp/capturas-union'; shutil.rmtree(S, ignore_errors=True); os.makedirs(S)
logs = []
def ok(m): print('OK', m, flush=True)

def nueva(b, video):
    br = b.chromium.launch(headless=True, args=['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', f'--use-file-for-fake-video-capture={video}'])
    ctx = br.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, locale='es-CO', permissions=['camera'])
    pg = ctx.new_page()
    pg.on('console', lambda m: logs.append(f'[{m.type}] {m.text}') if m.type == 'error' else None)
    pg.on('pageerror', lambda e: logs.append(f'[pageerror] {e}'))
    pg.goto(URL); pg.wait_for_selector('#capa-portada:not([hidden]) .tapa', timeout=15000)
    pg.fill('#tapa-nombre', 'Prueba'); pg.click('.tapa-dueno button'); pg.click('#instalar-saltar', timeout=8000); pg.wait_for_selector('#capa-portada', state='hidden')
    return br, pg

def preguntar(pg, texto):
    n = pg.locator('#chat-log > *').count()
    pg.fill('#chat-in', texto); pg.click('#chat-form button.btn-flor')
    pg.wait_for_function(f"window.__ultimoChat && window.__ultimoChat.texto === {json.dumps(texto)}", timeout=20000)
    pg.wait_for_timeout(300)
    return pg.evaluate('window.__ultimoChat')

vacio = open(f'{APP}/models/parque.json').read()
shutil.copy('/tmp/parque_ui.json', f'{APP}/models/parque.json')
try:
    with sync_playwright() as b:
        br, pg = nueva(b, '/tmp/vid/frailejon.y4m')
        # 1) Lente → «Pregúntale a Fray»
        pg.click('.muelle [data-vista="lente"]')
        pg.wait_for_selector('#lente-preguntar:not([hidden])', timeout=30000)
        pg.screenshot(path=f'{S}/1_lente.png')
        pg.click('#lente-preguntar')
        pg.wait_for_selector('#v-chat:not([hidden]) #chat-tema:not([hidden])', timeout=20000)
        pg.wait_for_selector('#chat-log .ficha', timeout=20000); pg.wait_for_timeout(500)
        tema_txt = pg.inner_text('#chat-tema'); intro = pg.inner_text('.tema-intro')
        assert 'frailejón' in tema_txt and 'Lente ve' in intro, (tema_txt, intro)
        sug = pg.locator('#chat-sug .chip').all_inner_texts()
        pg.screenshot(path=f'{S}/2_chat_tema.png')
        ok(f'Lente -> chat con tema «{tema_txt.strip()}»; sugerencias: {sug}')
        # 2) Sugerencia del tema: va directo a la ficha
        pg.click('#chat-sug .chip:has-text("llevar")'); pg.wait_for_timeout(500)
        assert 'prohibido sacar' in pg.locator('#chat-log .ficha').last.inner_text()
        ok('la sugerencia «¿Me lo puedo llevar?» muestra la ficha de no sacar nada')
        # 3) Preguntas de seguimiento con el tema
        for q, esp in [('¿cuánto vive?', 'frailejon'), ('¿por qué tiene pelos?', 'frailejon_hojas'), ('¿se come?', 'comer_plantas'), ('¿hay pumas?', 'mamiferos')]:
            r = preguntar(pg, q)
            assert r['id'] == esp, (q, r)
        ok('seguimiento con tema: «¿cuánto vive?», «¿por qué tiene pelos?», «¿se come?» (regla de seguridad) y «¿hay pumas?» (ignora el tema)')
        r = preguntar(pg, '¿de qué color es?')
        ok(f'«¿de qué color es?» (palabra que no está en las fichas) -> {r["tipo"]}, sin afirmar nada inventado')
        pg.screenshot(path=f'{S}/3_seguimiento.png', full_page=True)
        # 4) Quitar el tema
        pg.click('#chat-tema-x'); assert pg.is_hidden('#chat-tema')
        r = preguntar(pg, '¿cuánto vive?')
        assert not r['porTema'] and r['tema'] is None, r
        ok(f'sin tema, «¿cuánto vive?» ya no se asume del frailejón -> {r["tipo"]} {r["id"]}')
        # 5) Foto desde el chat
        pg.set_input_files('#chat-foto-in', sorted(glob.glob('/tmp/galeria/fotos/frailejon/*.jpg'))[0])
        pg.wait_for_function("window.__ultimoChat && window.__ultimoChat.foto", timeout=30000)
        r = pg.evaluate('window.__ultimoChat'); assert r['tema'] == 'frailejon', r
        assert pg.is_visible('#chat-tema')
        pg.screenshot(path=f'{S}/4_foto.png')
        ok('foto desde el chat -> la Lente la reconoce y fija el tema «frailejón»')
        pg.evaluate('window.__ultimoChat = null')
        pg.set_input_files('#chat-foto-in', '/tmp/galeria/desconocido.jpg')  # un cuadro del video «desconocido»
        pg.wait_for_function("window.__ultimoChat && window.__ultimoChat.foto", timeout=30000)
        r = pg.evaluate('window.__ultimoChat'); assert r['tema'] is None, r
        ok(f'foto de otra cosa -> «{pg.locator("#chat-log .nose").last.inner_text()}»')
        # 6) Sobre: «Pegar y preguntar a Fray»
        pg.evaluate("() => window.__paramo.est.ganar('condor')")
        pg.click('.muelle [data-vista="album"]'); pg.evaluate("() => { window.__paramo.abrirSobres(); }")
        pg.wait_for_selector('#capa-sobre:not([hidden]) .sobre', timeout=8000); pg.wait_for_timeout(700)
        pg.click('#capa-sobre .sobre', force=True)
        pg.wait_for_selector('#capa-sobre [data-a="preguntar"]:visible', timeout=12000)
        pg.screenshot(path=f'{S}/5_sobre.png')
        pg.click('#capa-sobre [data-a="preguntar"]')
        pg.wait_for_selector('#v-chat:not([hidden])', timeout=15000); pg.wait_for_timeout(800)
        assert 'cóndor' in pg.inner_text('#chat-tema') and pg.evaluate("window.__paramo.est.abierto('condor')")
        ok('sobre: «Pegar y preguntar a Fray» pega el cromo y abre el chat con el tema «cóndor»')
        r = preguntar(pg, '¿le puedo dar comida?'); assert r['id'] == 'fauna_trato', r
        ok('…y «¿le puedo dar comida?» -> ficha de no alimentar animales')
        # 7) Detalle de un cromo pegado → Preguntar a Fray
        pg.click('.muelle [data-vista="album"]'); pg.wait_for_timeout(400)
        pg.click('.pestana:nth-child(3)'); pg.wait_for_timeout(700)
        pg.click('.ranura[data-id="condor"]'); pg.wait_for_selector('[data-a="preguntar"]', timeout=8000)
        pg.click('[data-a="preguntar"]'); pg.wait_for_selector('#v-chat:not([hidden])', timeout=10000)
        ok('detalle de un cromo -> «Preguntar a Fray»')
        br.close()
finally:
    open(f'{APP}/models/parque.json', 'w').write(vacio)
print('\nerrores:', logs or 'ninguno')
