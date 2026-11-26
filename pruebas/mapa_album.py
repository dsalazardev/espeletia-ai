# Funcionamiento del mapa, el álbum y los cromos (reglas, no apariencia).
# Mapa: geocercas (llegar, posición imprecisa, fuera del parque), bitácora por jornada (otro día no suma el salto).
# Cromos: «requiere», «lugar», «otra planta», «después de», sobres, estación renovada al volver otro día.
# Álbum: pista según lo que falta, capítulo completo y 24/24.
# Sendero real: estaciones con nombre, caminar por el carreteable gana las 4 estaciones, «cuánto falta» por el camino.
# Uso: servidor en :8765;  python3 pruebas/mapa_album.py
from playwright.sync_api import sync_playwright
import os, sys
URL = os.environ.get('URL', 'http://localhost:8765/')
fallas, errores = [], []

def ok(c, m):
    print('OK   ' if c else 'FALLA', m)
    if not c: fallas.append(m)

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', headless=True)
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='es-CO', service_workers='block')
    pg = ctx.new_page(); pg.on('pageerror', lambda e: errores.append(str(e)))
    pg.goto(URL); pg.wait_for_selector('#tapa-nombre'); pg.fill('#tapa-nombre', 'Ana'); pg.click('.tapa-dueno button')
    pg.click('#instalar-saltar', timeout=8000); pg.wait_for_selector('#capa-portada', state='hidden'); pg.wait_for_timeout(400)
    J = lambda js, *a: pg.evaluate(js, *a)
    ests = J("window.__paramo.est.estaciones().map(e => ({id: e.id, lat: e.lat, lon: e.lon, radio: e.radio, alt: e.altura}))")
    e1, e2 = ests[0], ests[1]
    pos = "async ([lat, lon, prec, t]) => { await window.__paramo.mapa.procesar({ lat, lon, precision: prec, altitud: null, t }); await new Promise(r => setTimeout(r, 150)); }"

    # --- Mapa: geocercas ---
    T0 = 1795600000000  # una mañana cualquiera
    J(pos, [e1['lat'] + 0.004, e1['lon'], 200, T0])  # ~450 m y muy impreciso
    ok(not J("window.__paramo.est.tiene('brisas')"), 'posición imprecisa (±200 m) no entrega el cromo de la estación')
    J(pos, [e1['lat'], e1['lon'], 8, T0 + 60000])
    ok(J("window.__paramo.est.tiene('brisas')") and J(f"!!window.__paramo.E.visitadas['{e1['id']}']"), 'al llegar a Brisas: cromo en sobre y estación visitada')
    ok(J("window.__paramo.est.pendientes().includes('brisas')"), '…queda como sobre por abrir (no interrumpe la caminata)')
    # Caminar de Brisas a la estación 2 en 20 pasos de 1 min
    for k in range(1, 21):
        f = k / 20
        J(pos, [e1['lat'] + (e2['lat'] - e1['lat']) * f, e1['lon'] + (e2['lon'] - e1['lon']) * f, 8, T0 + 60000 + k * 60000])
    r1 = J("import('./js/bitacora.js').then(b => b.resumen())")
    dreal = J("([a, b]) => { const R = 6371e3, r = x => x * Math.PI / 180; const dl = r(b.lat - a.lat), dn = r(b.lon - a.lon); const h = Math.sin(dl/2)**2 + Math.cos(r(a.lat))*Math.cos(r(b.lat))*Math.sin(dn/2)**2; return 2*R*Math.asin(Math.sqrt(h)); }", [e1, e2])
    ok(abs(r1['distancia'] - dreal) < 60, f"bitácora: {r1['distancia']} m caminados de Brisas a la estación 2 (línea recta {round(dreal)} m)")
    ok(J(f"!!window.__paramo.E.visitadas['{e2['id']}']"), 'la estación 2 queda visitada al llegar')

    # --- Otro día: volver a Brisas ---
    T1 = T0 + 24 * 3600e3
    J(pos, [e1['lat'], e1['lon'], 8, T1]); J(pos, [e1['lat'] + 0.0003, e1['lon'], 8, T1 + 60000])
    r2 = J("import('./js/bitacora.js').then(b => b.resumen())")
    ok(r2['distancia'] < 100, f"otro día la bitácora empieza de cero y no suma el salto desde ayer ({r2['distancia']} m)")
    # La fecha de visita se renueva (el reloj real de la prueba es «hoy»): estar en el parque vale por haber llegado hoy
    J("async () => { const E = window.__paramo.E; for (const k in E.visitadas) E.visitadas[k] = Date.now() - 26 * 3600e3; E.aqui = 0; E.posicion = null; }")
    ok(not J("window.__paramo.est.enParque()"), 'sin visita reciente, sin GPS y sin código del guía: no está en el parque')
    J(f"window.__paramo.mapa.llegar(window.__paramo.est.estaciones()[0])"); pg.wait_for_timeout(300)
    ok(J("window.__paramo.est.enParque()"), 'al volver a Brisas otro día, cuenta como «estar en el parque» (antes quedaba la fecha de la primera visita)')

    # --- Cromos: reglas ---
    bl = lambda cid: J(f"(() => {{ const e = window.__paramo.est; return e.bloqueo(e.cromo('{cid}')); }})()")
    J("async () => { const E = window.__paramo.E; E.aqui = 0; for (const k in E.visitadas) E.visitadas[k] = 0; E.posicion = null; }")
    n = J("Object.keys(window.__paramo.E.album).length")
    ok((bl('grupo') or {}).get('tipo') == 'requiere' if n < 3 else True, f"foto de grupo con {n} cromos: bloqueada por «requiere 3»")
    J("async () => { const e = window.__paramo.est; for (const id of ['condor','oso','danta']) await e.ganar(id); }")
    ok((bl('grupo') or {}).get('tipo') == 'lugar', 'con 3 cromos pero fuera del parque: pide estar en el parque')
    J("window.__paramo.est.marcarAqui()"); pg.wait_for_timeout(200)
    ok(bl('grupo') is None and bl('mirada') is None, 'con el código «estamos en el parque» del guía: foto de grupo y pausa disponibles')
    ok((bl('hojas') or {}).get('tipo') == 'despuesDe', '«Abrigo de hojas» espera al primer frailejón')
    J("window.__paramo.est.ganar('frailejon')"); pg.wait_for_timeout(200)
    ok((bl('hojas') or {}).get('tipo') == 'otraPlanta', 'justo después del primer frailejón pide otra planta')
    J("() => { window.__paramo.E.album.frailejon.fecha -= 4 * 60e3; }")
    ok(bl('hojas') is None, 'sin GPS, 3 minutos después ya vale como otra planta')
    ok(J("window.__paramo.est.pendienteDeClase('frailejon', { guia: true })?.id") == 'hojas', 'el guía puede confirmar la segunda planta sin esperar')

    # --- Álbum: sobres, capítulo, pista, final ---
    ok(J("window.__paramo.est.pendientes().length") >= 5, f"los cromos ganados esperan en sobres ({J('window.__paramo.est.pendientes().length')})")
    J("async () => { const e = window.__paramo.est; for (const id of e.pendientes()) await e.abrir(id); }")
    ok(J("window.__paramo.est.pendientes().length") == 0 and J("window.__paramo.est.pegados()") == J("Object.keys(window.__paramo.E.album).length"), 'al abrir los sobres quedan pegados')
    caps = []
    pg.evaluate("() => { window.__caps = []; window.__paramo.est.bus.addEventListener('capitulo', (e) => window.__caps.push(e.detail.cap)); window.__paramo.est.bus.addEventListener('completo', () => window.__caps.push('COMPLETO')); }")
    J("async () => { const e = window.__paramo.est; for (const c of e.cromos()) if (c.capitulo === 'fauna' && !e.tiene(c.id)) { await e.ganar(c.id); await e.abrir(c.id); } }")
    ok('fauna' in J("window.__caps"), 'al completar Fauna se celebra el capítulo')
    pg.click('#indice button >> nth=2'); pg.wait_for_timeout(900)
    pista = pg.inner_text('#pista')
    ok('QR' not in pista, f"con todos los QR pegados, la pista ya no pide QR («{pista}»)")
    J("async () => { const e = window.__paramo.est; for (const c of e.cromos()) if (!e.tiene(c.id)) { await e.ganar(c.id); } for (const id of e.pendientes()) await e.abrir(id); }")
    ok('COMPLETO' in J("window.__caps") and J("window.__paramo.est.pegados()") == 24, '24/24: se celebra el álbum completo')
    ok('lograste' in pg.inner_text('#pista').lower(), f"pista final: «{pg.inner_text('#pista')}»")
    ctx.close()

    # --- Sendero real (OpenStreetMap): caminar por el carreteable gana las 4 estaciones ---
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='es-CO', service_workers='block')
    pg = ctx.new_page(); pg.on('pageerror', lambda e: errores.append(str(e)))
    pg.goto(URL); pg.wait_for_selector('#tapa-nombre'); pg.fill('#tapa-nombre', 'Ana'); pg.click('.tapa-dueno button')
    pg.click('#instalar-saltar', timeout=8000); pg.wait_for_selector('#capa-portada', state='hidden'); pg.wait_for_timeout(400)
    J = lambda js, *a: pg.evaluate(js, *a)
    sen = J("window.__paramo.E.paquete.sendero.puntos")
    nombres = J("window.__paramo.est.estaciones().map(e => e.nombre)")
    ok(not any(n.startswith('Estación') for n in nombres), f'estaciones con nombre real: {", ".join(nombres)}')
    # «¿Cuánto falta?» por el camino, desde Brisas a Aguacerales
    J("async () => { const E = window.__paramo.E; const e = window.__paramo.est.estaciones()[0]; await window.__paramo.mapa.procesar({ lat: e.lat, lon: e.lon, precision: 8, altitud: null, t: Date.now() }); }")
    r = J("import('./js/recorrido.js').then(m => m.responder('falta'))")
    ok('por el sendero' in r['texto'], f"«cuánto falta» se mide por el sendero: «{r['texto']}»")
    # Caminar por el camino real cada ~30 m (interpolando entre puntos del trazado)
    camino = []
    for (a, b2) in zip(sen, sen[1:]):
        for k in range(4): camino.append([a[0] + (b2[0] - a[0]) * k / 4, a[1] + (b2[1] - a[1]) * k / 4])
    camino.append(sen[-1])
    J("async (pts) => { let t = Date.now(); for (const [lat, lon] of pts) { await window.__paramo.mapa.procesar({ lat, lon, precision: 10, altitud: null, t: t += 25000 }); } }", camino)
    pg.wait_for_timeout(500)
    gps = J("window.__paramo.est.cromos().filter(c => c.tipo === 'gps').map(c => [c.estacion, window.__paramo.est.tiene(c.id)])")
    ok(all(x[1] for x in gps), f'caminando por el carreteable real se ganan los cromos de las 4 estaciones ({gps})')
    largo = J("import('./js/sendero.js').then(s => Math.round(s.largo()))")
    ok(4000 < largo < 4600, f'el sendero mide {largo} m de Brisas al Valle de las Tumbas (las guías hablan de unos 5 km ida)')
    rec = J("(async () => { const s = await import('./js/sendero.js'); const [a, b] = window.__paramo.est.estaciones(); return [Math.round(s.distanciaA(a, b).m), Math.round(window.__paramo.mapa ? 0 : 0)]; })()")
    ok(rec[0] > 500, f'de Brisas a Aguacerales hay {rec[0]} m por el camino')
    pg.click('.muelle [data-vista="mapa"]'); pg.wait_for_timeout(1200)
    npts = J("(document.querySelector('#mapa .ruta')?.getAttribute('d') || '').split('L').length")
    ok(npts >= 40, f'el mapa dibuja el camino real ({npts} puntos), no rectas entre estaciones')
    ok('sendero' in pg.inner_text('#estaciones-nota'), f"la lista aclara cómo se miden las distancias: «{pg.inner_text('#estaciones-nota')}»")
    ok('OpenStreetMap' in pg.inner_text('#mapa-fuente'), 'el mapa da crédito a OpenStreetMap')
    b.close()

ok(not errores, f'sin errores de página {errores[:2]}')
print(f'\n{len(fallas)} falla(s)')
sys.exit(1 if fallas else 0)
