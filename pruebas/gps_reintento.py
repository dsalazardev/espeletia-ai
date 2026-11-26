"""Si el GPS falla (tiempo agotado), la app reintenta sola y registra la llegada. Necesita el servidor en :8765."""
from playwright.sync_api import sync_playwright
FAKE = """
(() => { let n = 0; const ok = (cb) => setTimeout(() => cb({ coords: { latitude: 4.9325, longitude: -75.354, accuracy: 12, altitude: 4102, altitudeAccuracy: 12 }, timestamp: Date.now() }), 300);
  window.__llamadas = 0;
  navigator.geolocation.watchPosition = (s, e) => { window.__llamadas++; n++; if (n === 1) setTimeout(() => e({ code: 3, message: 'timeout' }), 300); else ok(s); return n; };
  navigator.geolocation.clearWatch = () => {};
  navigator.geolocation.getCurrentPosition = (s) => ok(s); })();
"""
with sync_playwright() as p:
    b=p.chromium.launch(headless=True); ctx=b.new_context(locale='es-CO', permissions=['geolocation']); pg=ctx.new_page()
    pg.add_init_script(FAKE)
    pg.goto('http://localhost:8765/'); pg.wait_for_selector('#capa-portada:not([hidden]) .tapa'); pg.fill('#tapa-nombre','A'); pg.click('.tapa-dueno button'); pg.click('#instalar-saltar', timeout=8000); pg.wait_for_timeout(800)
    pg.click('.muelle [data-vista="mapa"]'); pg.wait_for_timeout(1200)
    print('tras el error:', pg.inner_text('#gps-chip'))
    pg.wait_for_function("document.querySelector('#gps-chip').textContent.includes('±')", timeout=15000)
    print('después del reintento:', pg.inner_text('#gps-chip'), '| intentos:', pg.evaluate('window.__llamadas'), '| Brisas visitada:', pg.evaluate("!!window.__paramo.E.visitadas.e1"))
    b.close()
