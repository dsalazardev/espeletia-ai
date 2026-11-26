# Hablarle a Fray: dictado sin red (spec docs/specs/2026-11-24-hablarle-a-fray.md, issue #38).
# Simula SpeechRecognition y comprueba que solo arranque en modo local.
# Uso: servidor en :8765 desde la carpeta principal;  python3 pruebas/dictado.py
from playwright.sync_api import sync_playwright
import os, sys
URL = os.environ.get('URL', 'http://localhost:8765/')
fallas, errores = [], []

def ok(c, m):
    print('OK   ' if c else 'FALLA', m)
    if not c: fallas.append(m)

MOTOR = """window.__dictar = ''; window.__disponibilidadVoz = 'available';
window.SpeechRecognition = class {
  static async available({ processLocally }) {
    if (!processLocally) throw new Error('Consulta remota');
    return window.__disponibilidadVoz;
  }
  get processLocally() { return this.local; }
  set processLocally(valor) { this.local = valor; }
  start() {
    if (!this.processLocally) throw new Error('Dictado remoto');
    window.__dictadoLocal = true;
    queueMicrotask(() => {
      if (window.__microfonoNegado) {
        this.onerror({ error: 'not-allowed' }); this.onend();
      } else this.onstart();
    });
  }
  stop() {
    queueMicrotask(() => {
      this.onresult({ results: [{ isFinal: true, 0: { transcript: window.__dictar } }] });
      this.onend();
    });
  }
};"""
NEGADO = "window.__microfonoNegado = true;"

def telefono(b, init=None):
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='es-CO', service_workers='block', permissions=['microphone'])
    if init: ctx.add_init_script(init)
    pg = ctx.new_page(); pg.on('pageerror', lambda e: errores.append(str(e)))
    pg.goto(URL); pg.wait_for_selector('#tapa-nombre'); pg.fill('#tapa-nombre', 'Ana')
    pg.click('.tapa-dueno button'); pg.click('#instalar-saltar', timeout=8000); pg.wait_for_selector('#capa-portada', state='hidden')
    pg.click('.muelle [data-vista="chat"]'); pg.wait_for_selector('#chat-sug .chip', timeout=40000)
    return ctx, pg

def dictar(pg, texto):
    # Mantener presionado «Enviar» (más de 350 ms) y soltar
    pg.evaluate(f"window.__dictar = {texto!r}")
    box = pg.locator('#chat-enviar').bounding_box()
    pg.mouse.move(box['x'] + 10, box['y'] + 10); pg.mouse.down(); pg.wait_for_timeout(700); pg.mouse.up(); pg.wait_for_timeout(500)

def enviar(pg):
    q = pg.input_value('#chat-in'); pg.press('#chat-in', 'Enter')
    pg.wait_for_function('window.__ultimoChat && window.__ultimoChat.texto === %r' % q, timeout=20000); pg.wait_for_timeout(300)
    return pg.evaluate('window.__ultimoChat.id')

with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome', headless=True, args=['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'])

    ctx, pg = telefono(b, MOTOR + "window.__disponibilidadVoz = 'downloadable';")
    dictar(pg, 'x')
    ok('no est' in pg.locator('.aviso').inner_text(), 'sin paquete local: aviso y queda el teclado')
    ok(pg.evaluate('window.__dictadoLocal') is None, 'sin paquete local: no se abre el microfono')
    ctx.close()

    # Con el motor de prueba, en modo avión
    ctx, pg = telefono(b, MOTOR)
    ctx.set_offline(True)
    pedidos = []; pg.on('request', lambda r: pedidos.append(r.url))
    pg.evaluate("window.__dictar = 'me perdí'")
    box = pg.locator('#chat-enviar').bounding_box()
    pg.mouse.move(box['x'] + 10, box['y'] + 10); pg.mouse.down(); pg.wait_for_timeout(700)
    ok(pg.locator('#chat-enviar.grabando').count() == 1 and 'Escucho' in pg.locator('#chat-enviar').inner_text(), 'mantener presionado Enviar: se pone rojo y dice «Escucho…»')
    pg.mouse.up(); pg.wait_for_timeout(500)
    ok(pg.input_value('#chat-in') == 'me perdí' and pg.locator('#chat-enviar').inner_text() == 'Enviar', 'al soltar: la transcripción queda en la casilla y el botón vuelve a «Enviar»')
    ok(pg.evaluate('window.__dictadoLocal') is True, '…con el micrófono abierto mientras se presiona')
    ok(pg.evaluate('window.__ultimoChat') is None, '…y no se envía sola (editable)')
    ok(not [u for u in pedidos if not u.startswith('data:') and not u.startswith('blob:')], f'al dictar no sale nada por la red ({len(pedidos)} pedidos)')
    ok(enviar(pg) == 'emergencia', 'modo avión: «me perdí» dicho en voz alta → carril crítico (emergencia)')
    dictar(pg, 'que ropa llebo pal frio')
    pg.fill('#chat-in', 'qué ropa llevo para el frío')
    pg.click('#chat-enviar')  # toque corto con texto: envía
    pg.wait_for_function("window.__ultimoChat && window.__ultimoChat.texto === 'qué ropa llevo para el frío'", timeout=20000)
    ok(pg.evaluate('window.__ultimoChat.id') == 'que_llevar', 'la transcripción se corrige y un toque corto en Enviar la envía')
    pg.fill('#chat-in', 'hay osos')
    dictar(pg, 'en el parque')
    ok(pg.input_value('#chat-in') == 'hay osos en el parque', 'si ya había texto escrito, lo dictado se agrega al final')
    pg.fill('#chat-in', '')
    dictar(pg, 'se puede comer el frailejón')
    ok(enviar(pg) == 'comer_plantas', 'dictado: comer → comer_plantas (misma regla de seguridad)')
    dictar(pg, '')
    ok('No te entendí' in pg.locator('.aviso').inner_text() and pg.input_value('#chat-in') == '', 'si no reconoce nada: lo dice y no borra nada')
    # Con teclado: Enter empieza y vuelve a Enter termina
    pg.evaluate("window.__dictar = 'cuánto cuesta la entrada'")
    pg.focus('#chat-enviar'); pg.keyboard.press('Enter'); pg.wait_for_timeout(500); pg.keyboard.press('Enter'); pg.wait_for_timeout(500)
    ok(pg.input_value('#chat-in') == 'cuánto cuesta la entrada', 'con teclado: Enter sobre Enviar (casilla vacía) empieza y termina')
    ctx.close()

    # Permiso del micrófono negado
    ctx, pg = telefono(b, MOTOR + NEGADO)
    dictar(pg, 'hola')
    ok('micrófono' in pg.locator('.aviso').inner_text() and pg.input_value('#chat-in') == '', 'permiso negado: aviso corto y queda el teclado')
    ctx.close(); b.close()
print('errores de página:', errores or 'ninguno')
print('RESULTADO:', 'TODO BIEN' if not fallas and not errores else f'{len(fallas)} fallas, {len(errores)} errores')
sys.exit(1 if fallas or errores else 0)
