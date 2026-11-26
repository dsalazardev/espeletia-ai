# Uso: python3 pruebas/velocidad.py <puerto> [freno_cpu]  (sirve la app con un parque.json entrenado para medir la Lente)
"""Carga real de la app con la CPU frenada (como un celular), con el service worker ya instalado.
Mide: cuándo queda lista la Lente, cuánto tarda el chat al entrar, y cuánto se congela la pantalla
(tareas largas del hilo principal, que es lo que el visitante siente como «se pegó»)."""
import sys, json
from playwright.sync_api import sync_playwright
PUERTO = sys.argv[1]; FRENO = float(sys.argv[2]) if len(sys.argv) > 2 else 4
URL = f'http://localhost:{PUERTO}/'
OBS = """() => { window.__largas = []; new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__largas.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({ type: 'longtask', buffered: true }); }"""
with sync_playwright() as p:
    b = p.chromium.launch(headless=True, args=['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--use-file-for-fake-video-capture=/tmp/vid/frailejon.y4m'])
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='es-CO', permissions=['camera'])
    pg = ctx.new_page()
    pg.goto(URL)
    pg.wait_for_selector('#capa-portada:not([hidden]) .tapa', timeout=20000)
    pg.fill('#tapa-nombre', 'X'); pg.click('.tapa-dueno button'); pg.click('#instalar-saltar', timeout=8000)
    # instalar el service worker (primera visita, sin freno)
    pg.wait_for_function("navigator.serviceWorker.controller !== null", timeout=180000)
    pg.wait_for_function("caches.keys().then(async (k) => { for (const n of k) { const c = await caches.open(n); if ((await c.keys()).length > 20) return true; } return false; })", timeout=180000)
    pg.wait_for_timeout(8000)
    for vuelta in range(2):
        pg2 = ctx.new_page()
        cdp = ctx.new_cdp_session(pg2)
        cdp.send('Emulation.setCPUThrottlingRate', {'rate': FRENO})
        pg2.add_init_script(OBS.replace('() => {', '', 1)[:-1])
        t0 = pg2.evaluate('Date.now()') if False else None
        pg2.goto(URL)
        pg2.wait_for_function('window.__paramo && window.__paramo.E.paquete', timeout=60000)
        pg2.wait_for_function('window.__paramo.ml.ready()', timeout=120000, polling=100)
        lente = pg2.evaluate('performance.now()')
        largas_inicio = pg2.evaluate('window.__largas.slice()')
        # entrar al chat y esperar el modelo
        t = pg2.evaluate('performance.now()')
        pg2.click('.muelle [data-vista="chat"]')
        pg2.wait_for_function("(async () => { const c = await import('/js/chat.js'); return c.listo(); })()", timeout=120000, polling=100)
        pg2.wait_for_function("document.querySelector('#chat-estado').hidden", timeout=120000, polling=100)
        chat = pg2.evaluate('performance.now()') - t
        largas_chat = [x for x in pg2.evaluate('window.__largas') if x[0] >= t]
        # una pregunta
        t = pg2.evaluate('performance.now()')
        pg2.fill('#chat-in', '¿qué debo llevar?'); pg2.click('#chat-form button.btn-flor')
        pg2.wait_for_function("window.__ultimoChat && window.__ultimoChat.texto", timeout=60000, polling=50)
        resp = pg2.evaluate('performance.now()') - t
        # Lente abierta 6 s: cuánto del hilo principal se va en reconocer
        pg2.click('.muelle [data-vista="lente"]'); pg2.wait_for_timeout(1500)
        t = pg2.evaluate('performance.now()'); pg2.wait_for_timeout(6000); t2 = pg2.evaluate('performance.now()')
        ocupado = sum(d for s, d in pg2.evaluate('window.__largas') if s >= t)
        if vuelta:
            mx = lambda L: max([d for _, d in L] or [0])
            print(json.dumps({
                'lente_lista_desde_que_abre_s': round(lente / 1000, 1),
                'congelamiento_mas_largo_al_abrir_ms': mx(largas_inicio),
                'chat_listo_al_entrar_s': round(chat / 1000, 1),
                'congelamiento_mas_largo_al_entrar_al_chat_ms': mx(largas_chat),
                'primera_respuesta_ms': round(resp),
                'lente_abierta_hilo_principal_ocupado_pct': round(100 * ocupado / (t2 - t)),
            }, ensure_ascii=False))
        pg2.close()
    b.close()
