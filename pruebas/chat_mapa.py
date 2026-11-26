# Chat ↔ mapa: las fichas dinámicas responden con los datos del GPS y la bitácora, «Ver en el mapa»
# abre el lugar, la emergencia muestra la ubicación y al llegar a una estación el chat ofrece hablar de ella.
# Uso: servidor en :8765 (python3 -m http.server 8765) y luego  python3 pruebas/chat_mapa.py
from playwright.sync_api import sync_playwright
import os
S = '/tmp/shots_chatmapa'; os.makedirs(S, exist_ok=True)
errores, fallas = [], []

def ok(cond, msg):
    print(('OK   ' if cond else 'FALLA'), msg)
    if not cond: fallas.append(msg)

def preguntar(pg, q):
    pg.fill('#chat-in', q); pg.press('#chat-in', 'Enter')
    pg.wait_for_function('window.__ultimoChat && window.__ultimoChat.texto === %r' % q, timeout=20000)
    pg.wait_for_timeout(400)
    return pg.evaluate('window.__ultimoChat')

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', headless=True)
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, locale='es-CO')
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errores.append(str(e)))
    pg.on('console', lambda m: errores.append(m.text) if m.type == 'error' and 'geoloc' not in m.text.lower() else None)
    pg.goto('http://localhost:8765/'); pg.wait_for_selector('#tapa-nombre')
    pg.fill('#tapa-nombre', 'Prueba'); pg.click('.tapa-dueno button'); pg.click('#instalar-saltar', timeout=8000); pg.wait_for_timeout(1200)
    pg.click('.muelle [data-vista="chat"]'); pg.wait_for_selector('#chat-sug .chip', timeout=40000)

    # 1. Sin GPS: lo dice y ofrece el mapa
    r = preguntar(pg, 'cuánto falta')
    ok(r['id'] == 'mi_falta' and r['dinamico'].startswith('Todavía no tengo tu posición'), f"sin GPS: {r['id']} · {r['dinamico'][:60]}")

    # 2. Caminata simulada: llega a Brisas y avanza 60 % hacia la estación 2, subiendo
    pg.evaluate('''async () => {
      const { E, est, mapa } = window.__paramo;
      const [e1, e2] = est.estaciones();
      const t0 = Date.now() - 22 * 60000;
      for (let k = 0; k <= 10; k++) {
        const f = 0.06 * k;
        await mapa.procesar({ lat: e1.lat + (e2.lat - e1.lat) * f, lon: e1.lon + (e2.lon - e1.lon) * f, precision: 8,
          altitud: 4050 + 9 * k, altPrec: 8, t: t0 + k * 130000 });
      }
    }''')
    pg.wait_for_timeout(600)
    datos = pg.evaluate('''async () => {
      const bit = await import('./js/bitacora.js'); const u = await import('./js/util.js'); const sen = await import('./js/sendero.js');
      const { E, est } = window.__paramo; const e2 = est.estaciones()[1];
      return { r: bit.resumen(), a: bit.alturaActual(), d2: u.fmtDist(sen.distanciaA(E.posicion, e2).m, 'es')  /* por el sendero si estás sobre él */, dist: u.fmtDist(bit.resumen().distancia, 'es'), vis: Object.keys(E.visitadas) };
    }''')
    print('   bitácora:', datos)
    ok('e1' in datos['vis'], 'llegó a Brisas (visitada)')

    # 3. Al volver al chat, ofrece hablar de Brisas (una vez)
    pg.click('.muelle [data-vista="album"]'); pg.wait_for_timeout(400)
    pg.click('.muelle [data-vista="chat"]'); pg.wait_for_timeout(900)
    intro = pg.locator('#chat-log .tema-intro').last.text_content() or ''
    ok('Llegaste a Brisas' in intro, f'tema automático al llegar: {intro!r}')
    pg.click('.muelle [data-vista="album"]'); pg.wait_for_timeout(300)
    pg.click('.muelle [data-vista="chat"]'); pg.wait_for_timeout(700)
    ok(pg.locator('#chat-log .tema-intro').count() == 1, 'no lo repite al volver a entrar')
    pg.click('#chat-tema-x')

    # 4. Las cifras del chat son las de la bitácora
    r = preguntar(pg, 'cuánto falta')
    ok(r['id'] == 'mi_falta' and 'estación 2' in r['dinamico'] and datos['d2'] in r['dinamico'] and '1 de 4' in r['dinamico'], f"falta: {r['dinamico']}")
    r = preguntar(pg, 'a qué altura estamos')
    alt = f"{datos['a']['alt']:,}".replace(',', '.')
    ok(r['id'] == 'mi_altura' and alt in r['dinamico'] and 'GPS' in r['dinamico'], f"altura: {r['dinamico']}")
    r = preguntar(pg, 'cuánto llevo caminado')
    ok(r['id'] == 'mi_recorrido' and datos['dist'] in r['dinamico'] and f"{datos['r']['subida']} m" in r['dinamico'], f"recorrido: {r['dinamico']}")
    r = preguntar(pg, 'dónde estamos')
    ok(r['id'] == 'mi_donde' and 'más cercana' in r['dinamico'], f"dónde: {r['dinamico']}")
    pg.screenshot(path=f'{S}/1_chat.png', full_page=True)

    # 5. «Ver en el mapa» desde «dónde estamos» abre la hoja de la estación
    pg.locator('#chat-log .ficha').last.locator('.chip-mapa').click(); pg.wait_for_timeout(900)
    ok(not pg.locator('#v-mapa').is_hidden() and pg.locator('#capa-estacion .hoja-estacion').count() == 1, 'ver en el mapa → hoja de la estación')
    pg.screenshot(path=f'{S}/2_mapa.png')
    pg.click('#capa-estacion [data-x]'); pg.wait_for_timeout(300)

    # 6. Ficha de un lugar: no la roba una dinámica y lleva al mapa
    pg.click('.muelle [data-vista="chat"]'); pg.wait_for_timeout(500)
    r = preguntar(pg, 'a qué altura está Brisas')
    ok(r['id'] == 'brisas', f'pregunta sobre un lugar: {r["id"]}')
    r = preguntar(pg, 'el volcán está activo')
    ok(r['id'] == 'volcan_estado', f'volcán: {r["id"]}')
    pg.locator('#chat-log .ficha').last.locator('.chip-mapa').click(); pg.wait_for_timeout(700)
    ok(pg.locator('#mapa .volcan.resaltado').count() == 1, 'ver en el mapa → volcán resaltado')

    # 7. Emergencia: muestra la ubicación y la altura actuales
    pg.click('.muelle [data-vista="chat"]'); pg.wait_for_timeout(500)
    r = preguntar(pg, 'me perdí')
    u = pg.locator('#chat-log .ficha').last.locator('.ficha-ubic b').text_content() if pg.locator('#chat-log .ficha').last.locator('.ficha-ubic').count() else ''
    ok(r['id'] == 'emergencia' and '4.' in u and ' m' in u, f'emergencia con ubicación: {u!r}')
    pg.screenshot(path=f'{S}/3_emergencia.png', full_page=True)

    # 8. En inglés
    pg.evaluate("window.__paramo.E.lang = 'en'")
    r = preguntar(pg, 'how far is the next station')
    ok(r['id'] == 'mi_falta' and r['dinamico'].startswith('Next is station 2'), f"inglés: {r['dinamico']}")
    ctx.close(); b.close()

print('errores de página:', errores or 'ninguno')
print('RESULTADO:', 'TODO BIEN' if not fallas and not errores else f'{len(fallas)} fallas')
