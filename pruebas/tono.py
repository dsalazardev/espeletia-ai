# Capa de tono determinista (spec docs/specs/2026-11-24-capa-tono.md, issue #21).
# chat.json todavía no trae variantes (las escribe R1): la prueba inyecta unas de ejemplo y revisa las reglas.
# Uso: servidor en :8765 desde la carpeta principal;  python3 pruebas/tono.py
from playwright.sync_api import sync_playwright
import json, os, sys
URL = os.environ.get('URL', 'http://localhost:8765/')
APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
fallas, errores = [], []

def ok(c, m):
    print('OK   ' if c else 'FALLA', m)
    if not c: fallas.append(m)

chat = json.load(open(os.path.join(APP, 'chat.json'), encoding='utf-8'))
F = {f['id']: f for f in chat['fichas']}
F['que_llevar']['variantes'] = {'corta': {'es': 'CORTA: ropa abrigadora e impermeable.', 'en': 'SHORT: warm, waterproof clothes.'},
                                'ninos': {'es': 'NIÑOS: abrígate como para la nevera.', 'en': 'KIDS: dress warm.'}}
F['emergencia']['variantes'] = {'corta': {'es': 'CORTA: quédate quieto y avisa al guía.', 'en': 'SHORT: stay still and tell your guide.'}}
chat['empatia'] = {'es': ['Tranquilo, te ayudo.'], 'en': ['Stay calm, I will help.']}
CUERPO = json.dumps(chat, ensure_ascii=False)

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', headless=True)
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='es-CO', service_workers='block')
    ctx.route('**/chat.json', lambda r: r.fulfill(status=200, content_type='application/json', body=CUERPO))
    pg = ctx.new_page(); pg.on('pageerror', lambda e: errores.append(str(e)))
    pg.goto(URL); pg.wait_for_selector('#tapa-nombre'); pg.fill('#tapa-nombre', 'Ana')
    pg.click('.tapa-dueno button'); pg.click('#instalar-saltar', timeout=8000); pg.wait_for_selector('#capa-portada', state='hidden')
    pg.click('.muelle [data-vista="chat"]'); pg.wait_for_selector('#chat-sug .chip', timeout=40000)

    def preguntar(q):
        pg.fill('#chat-in', q); pg.press('#chat-in', 'Enter')
        pg.wait_for_function('window.__ultimoChat && window.__ultimoChat.texto === %r' % q, timeout=20000); pg.wait_for_timeout(300)
        card = pg.locator('#chat-log .ficha').last
        return pg.evaluate('window.__ultimoChat.id'), card
    def tono(k):
        pg.evaluate(f"(async () => {{ window.__paramo.E.ajustes.tono = '{k}'; await window.__paramo.est.guardar(); }})()")

    id_, c = preguntar('qué ropa debo llevar')
    ok(id_ == 'que_llevar' and 'CORTA' not in c.inner_text() and c.locator('[data-completa]').count() == 0, 'normal: la ficha original, sin botón')
    tono('corta')
    id_, c = preguntar('qué debo llevar puesto')
    ok('CORTA: ropa abrigadora' in c.locator('.ficha-txt').inner_text(), 'corto: la variante corta escrita por R1')
    ok(c.locator('.ficha-fuente').count() == 1, '…con la misma fuente')
    c.locator('[data-completa]').click()
    ok(c.locator('.ficha-txt').inner_text() == F['que_llevar']['es'], '«Ver la respuesta completa» muestra la original')
    tono('larga')
    id_, c = preguntar('qué ropa debo llevar')
    ok(c.locator('.ficha-txt').inner_text() == F['que_llevar']['es'] and c.locator('[data-completa]').count() == 0, 'con detalle, sin esa variante: la original')
    tono('ninos')
    id_, c = preguntar('qué ropa debo llevar')
    ok('NIÑOS' in c.locator('.ficha-txt').inner_text(), 'para niños: la variante de niños')
    id_, c = preguntar('hay osos')
    ok(c.locator('[data-completa]').count() == 0, f'para niños, ficha sin variantes ({id_}): la original')
    tono('normal')
    id_, c = preguntar('me perdí')
    ok(id_ == 'emergencia' and 'CORTA: quédate quieto' in c.locator('.ficha-txt').inner_text(), 'urgente: siempre la variante corta')
    ok(c.locator('.ficha-empatia').inner_text() == 'Tranquilo, te ayudo.', '…con la frase de empatía aprobada')
    pg.evaluate("window.__paramo.E.lang = 'en'")
    id_, c = preguntar('what clothes should I bring')
    tono('corta'); id_, c = preguntar('what should I wear')
    ok('SHORT: warm' in c.locator('.ficha-txt').inner_text(), 'en inglés: la variante en inglés')
    ctx.close(); b.close()
print('errores de página:', errores or 'ninguno')
print('RESULTADO:', 'TODO BIEN' if not fallas and not errores else f'{len(fallas)} fallas, {len(errores)} errores')
sys.exit(1 if fallas or errores else 0)
