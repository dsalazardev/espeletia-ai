# Reproductor de audio por idioma (spec docs/specs/2026-11-24-reproductor-audio.md, issue #19).
# Con voz local disponible → suena el audio; con audio viejo o sin audio → voz local del teléfono;
# sin voz local → solo el texto (con aviso). La primera vez recomienda audífonos.
# Uso: servidor en :8765 desde la carpeta principal; necesita ffmpeg;  python3 pruebas/audio.py
from playwright.sync_api import sync_playwright
import hashlib, json, os, subprocess, sys, tempfile, unicodedata
URL = os.environ.get('URL', 'http://localhost:8765/')
APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
fallas, errores = [], []

def ok(c, m):
    print('OK   ' if c else 'FALLA', m)
    if not c: fallas.append(m)

def huella(txt):  # igual que herramientas/audios.py
    return hashlib.sha256(unicodedata.normalize('NFC', txt.strip()).encode('utf-8')).hexdigest()

paq = json.load(open(os.path.join(APP, 'paquete.json'), encoding='utf-8'))
cr = {c['id']: c for c in paq['cromos']}
mp3 = os.path.join(tempfile.mkdtemp(), 'x.mp3')
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=1', '-ac', '1', '-b:a', '32k', mp3], check=True)
MANIFIESTO = {'version': 1, 'audios': [
    {'idioma': 'es-CO', 'id': 'frailejon', 'tipo': 'cromo', 'archivo': 'audios/es-CO/frailejon.mp3', 'huella': huella(cr['frailejon']['es']['dato']),
     'voz': 'Prueba', 'origen': 'humano', 'licencia': 'CC-BY-4.0', 'revisado': True},
    # audio viejo: el texto cambió desde que se grabó
    {'idioma': 'es-CO', 'id': 'condor', 'tipo': 'cromo', 'archivo': 'audios/es-CO/condor.mp3', 'huella': huella('un texto que ya no existe'),
     'voz': 'Prueba', 'origen': 'humano', 'licencia': 'CC-BY-4.0', 'revisado': True},
    # sin revisar
    {'idioma': 'es-CO', 'id': 'oso', 'tipo': 'cromo', 'archivo': 'audios/es-CO/oso.mp3', 'huella': huella(cr['oso']['es']['dato']) if 'oso' in cr else '0' * 64,
     'voz': 'Prueba', 'origen': 'humano', 'licencia': 'CC-BY-4.0', 'revisado': False},
]}
VOCES = """(locales) => { window.__dicho = [];
  window.SpeechSynthesisUtterance = class { constructor(t) { this.text = t; } };
  const voces = locales ? [{ name: 'Español local', lang: 'es-CO', localService: true }, { name: 'Nube', lang: 'en-US', localService: false }]
                        : [{ name: 'Nube', lang: 'es-ES', localService: false }];
  Object.defineProperty(window, 'speechSynthesis', { value: { getVoices: () => voces, speak: (u) => window.__dicho.push(u.text), cancel: () => {} } });
}"""

def telefono(b, locales):
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='es-CO', service_workers='block')
    ctx.add_init_script(f"({VOCES})({'true' if locales else 'false'})")
    ctx.route('**/audios/manifiesto.json', lambda r: r.fulfill(status=200, content_type='application/json', body=json.dumps(MANIFIESTO)))
    ctx.route('**/audios/es-CO/*.mp3', lambda r: r.fulfill(status=200, content_type='audio/mpeg', body=open(mp3, 'rb').read()))
    pg = ctx.new_page(); pg.on('pageerror', lambda e: errores.append(str(e)))
    pg.goto(URL); pg.wait_for_selector('#tapa-nombre'); pg.fill('#tapa-nombre', 'Ana')
    pg.click('.tapa-dueno button'); pg.click('#instalar-saltar', timeout=8000); pg.wait_for_selector('#capa-portada', state='hidden')
    pg.evaluate("(async () => { const { est } = window.__paramo; for (const id of ['frailejon', 'condor', 'oso']) { await est.ganar(id); await est.abrir(id); } })()")
    pg.wait_for_timeout(800)
    return ctx, pg

def escuchar_cromo(pg, id_):
    pg.evaluate("window.__ultimaVoz = null")
    pg.evaluate(f"""(async () => {{ const {{ E }} = window.__paramo; const c = E.paquete.cromos.find((k) => k.id === '{id_}');
        try {{ await (await import('./js/util.js')).escuchar({{ texto: c.es.nombre + '. ' + c.es.dato, textoAudio: c.es.dato, lang: 'es', tipo: 'cromo', id: c.id }}); }}
        catch (e) {{ window.__ultimaVoz = {{ modo: 'error', e: String(e) }}; }} }})()""")
    pg.wait_for_function('window.__ultimaVoz', timeout=8000)
    return pg.evaluate('window.__ultimaVoz')

with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome', headless=True, args=['--autoplay-policy=no-user-gesture-required'])
    ctx, pg = telefono(b, True)
    # Desde el botón «Escuchar» del detalle del cromo
    pg.evaluate("document.querySelectorAll('#capa-sobre, .capa').forEach((c) => { if (c.id !== 'capa-detalle') c.hidden = true; })")
    pg.evaluate("window.__paramo.irA('album')"); pg.wait_for_timeout(300)
    pg.evaluate("import('./js/album.js').then((a) => a.abrirDetalle ? a.abrirDetalle('frailejon') : null)")
    pg.wait_for_timeout(500)
    if pg.locator('#capa-detalle [data-a="escuchar"]').count():
        pg.click('#capa-detalle [data-a="escuchar"]'); pg.wait_for_function('window.__ultimaVoz', timeout=8000)
        v = pg.evaluate('window.__ultimaVoz')
    else:
        v = escuchar_cromo(pg, 'frailejon')
    ok(v['modo'] == 'voz' and v['voz'] == 'Español local', f'voz local disponible → se prefiere la voz local ({v})')
    ok('audífonos' in (pg.locator('.aviso').inner_text() or ''), 'la primera vez recomienda audífonos o volumen bajo')
    v = escuchar_cromo(pg, 'condor')
    ok(v['modo'] == 'voz' and v['voz'] == 'Español local', f'audio viejo (el texto cambió) → voz local del teléfono ({v})')
    v = escuchar_cromo(pg, 'oso')
    ok(v['modo'] == 'voz', f'audio sin revisar → no se usa ({v["modo"]})')
    v = escuchar_cromo(pg, 'laguna') if 'laguna' in cr else escuchar_cromo(pg, 'paramo')
    ok(v['modo'] == 'voz', 'sin audio → voz local')
    pg.wait_for_timeout(5200)
    pg.evaluate("(async () => (await import('./js/util.js')).escuchar({ texto: 'hola', lang: 'es', tipo: 'cromo', id: 'condor' }))()")
    pg.wait_for_timeout(400)
    ok('audífonos' not in (pg.locator('.aviso.ver').inner_text() if pg.locator('.aviso.ver').count() else ''), 'la recomendación de audífonos sale una sola vez')
    ctx.close()

    ctx, pg = telefono(b, False)
    v = escuchar_cromo(pg, 'condor')
    ok(v['modo'] == 'texto' and pg.evaluate('window.__dicho.length') == 0, f'sin voz local (solo voces de nube) → solo el texto ({v})')
    ok('no tiene una voz' in pg.locator('.aviso').inner_text(), '…y lo avisa')
    v = escuchar_cromo(pg, 'frailejon')
    ok(v['modo'] == 'audio', 'sin voz local pero con audio → suena el audio')
    pg.evaluate("localStorage.setItem('voz', '0')")
    v = escuchar_cromo(pg, 'frailejon')
    ok(v['modo'] == 'apagado', 'con la voz apagada en Ajustes no suena nada')
    ctx.close()
    b.close()

print('errores de página:', errores or 'ninguno')
print('RESULTADO:', 'TODO BIEN' if not fallas and not errores else f'{len(fallas)} fallas, {len(errores)} errores')
sys.exit(1 if fallas or errores else 0)
