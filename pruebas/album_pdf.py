# Álbum final en PDF + collage (spec docs/specs/2026-11-24-album-pdf-collage.md, issue #15).
# Arma un álbum completo con fotos y una caminata simulada, genera el PDF en el navegador y lo valida con pypdf:
# páginas, una imagen por página, textos clave, peso ≤ 15 MB y tiempo (también con la CPU 4 veces más lenta).
# Uso: servidor en :8765 desde la carpeta principal y luego  python3 pruebas/album_pdf.py   (necesita pip install pypdf)
from playwright.sync_api import sync_playwright
import base64, io, os, sys, time
from pypdf import PdfReader
URL = os.environ.get('URL', 'http://localhost:8765/')
OUT = '/tmp/pdf_prueba'; os.makedirs(OUT, exist_ok=True)
fallas, errores = [], []

def ok(c, m):
    print('OK   ' if c else 'FALLA', m)
    if not c: fallas.append(m)

LLENAR = """async (conFotos) => {
  const { E, est, mapa } = window.__paramo;
  // Fotos de prueba (lienzos de colores con una figura), para el collage
  const foto = (h) => new Promise((ok) => { const c = document.createElement('canvas'); c.width = 1600; c.height = 1200;
    const x = c.getContext('2d'); x.fillStyle = `hsl(${h} 45% 55%)`; x.fillRect(0, 0, 1600, 1200);
    x.fillStyle = '#fff'; x.beginPath(); x.arc(800, 600, 300, 0, 7); x.fill(); c.toBlob(ok, 'image/jpeg', 0.9); });
  // Caminata Brisas → Valle de las Tumbas, un punto cada 2 minutos
  const ests = est.estaciones(), t0 = Date.now() - 3 * 3600e3; let k = 0;
  for (let i = 0; i < ests.length - 1; i++) for (let s = 0; s < 8; s++, k++) {
    const a = ests[i], b = ests[i + 1], f = s / 8;
    await mapa.procesar({ lat: a.lat + (b.lat - a.lat) * f, lon: a.lon + (b.lon - a.lon) * f, precision: 8, altitud: 4050 + k * 18, altPrec: 8, t: t0 + k * 240000 });
  }
  for (const c of E.paquete.cromos) { await est.ganar(c.id); await est.abrir(c.id); }
  if (conFotos) { let h = 0; for (const id of ['grupo', 'frailejon', 'condor', 'laguna']) { if (E.album[id]) await est.ponerFoto(id, await foto(h += 70)); } }
}"""
GENERAR = """async () => {
  const x = await import('./js/exportar.js'); const t0 = performance.now();
  const pdf = await x.albumPDF(); const ms = performance.now() - t0;
  const col = await x.collageImagen();
  const b64 = (b) => new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(r.result.split(',')[1]); r.readAsDataURL(b); });
  return { ms, pdf: await b64(pdf), collage: col ? await b64(col) : null, collageTipo: col?.type };
}"""

def nuevo(b):
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, locale='es-CO', accept_downloads=True)
    pg = ctx.new_page(); pg.on('pageerror', lambda e: errores.append(str(e)))
    pg.goto(URL); pg.wait_for_selector('#tapa-nombre'); pg.fill('#tapa-nombre', 'Valentina Ríos')
    pg.click('.tapa-dueno button'); pg.click('#instalar-saltar', timeout=8000); pg.wait_for_selector('#capa-portada', state='hidden')
    return ctx, pg

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', headless=True)
    ctx, pg = nuevo(b)
    pg.evaluate(LLENAR, True)
    pg.wait_for_selector('#final-desc', timeout=15000)  # al completar sale la pantalla final
    ok(pg.locator('#final-collage').count() == 1, 'pantalla final: botones «Descargar mi álbum (PDF)» y «collage»')
    with pg.expect_download(timeout=60000) as d:
        pg.click('#final-desc')
    d.value.save_as(f'{OUT}/desde_boton.pdf')
    ok(d.value.suggested_filename == 'album-del-paramo-valentina-rios.pdf', f'el botón descarga el PDF: {d.value.suggested_filename}')
    r = pg.evaluate(GENERAR)
    pdf = base64.b64decode(r['pdf']); open(f'{OUT}/album.pdf', 'wb').write(pdf)
    ok(r['collage'] and r['collageTipo'] == 'image/jpeg', 'collage como imagen JPEG')
    if r['collage']: open(f'{OUT}/collage.jpg', 'wb').write(base64.b64decode(r['collage']))
    # Tiempo con la CPU 4 veces más lenta (aproxima un teléfono de gama media)
    cdp = ctx.new_cdp_session(pg); cdp.send('Emulation.setCPUThrottlingRate', {'rate': 4})
    lento = pg.evaluate(GENERAR)['ms']; cdp.send('Emulation.setCPUThrottlingRate', {'rate': 1})
    ctx.close()

    # Álbum sin fotos y sin recorrido: no hay página de collage ni botón
    ctx, pg = nuevo(b)
    pg.evaluate("async () => { const { E, est } = window.__paramo; for (const c of E.paquete.cromos.slice(0, 5)) { await est.ganar(c.id); await est.abrir(c.id); } }")
    r2 = pg.evaluate(GENERAR)
    pdf2 = base64.b64decode(r2['pdf']); open(f'{OUT}/incompleto.pdf', 'wb').write(pdf2)
    ok(r2['collage'] is None, 'sin fotos: no hay collage')
    ctx.close()
    b.close()

rd = PdfReader(io.BytesIO(pdf))
texto = '\n'.join(pg.extract_text() or '' for pg in rd.pages)
n = len(rd.pages)
print(f'   PDF: {n} páginas, {len(pdf) / 1e6:.2f} MB, {r["ms"] / 1000:.1f} s (CPU 4× más lenta: {lento / 1000:.1f} s)')
ok(n == 9, f'9 páginas: portada, 4 capítulos, collage, recorrido, certificado, fuentes ({n})')
ok(all(len(p.images) == 1 for p in rd.pages), 'una imagen por página')
for clave in ['Álbum del Páramo', 'Valentina Ríos', 'Nevado del Ruiz', 'El sendero', 'Flora y paisaje', 'Fauna', 'Historias del guía',
              'Tus fotos del páramo', 'Tu recorrido', 'Máxima', 'Guardián del páramo', 'Firma del guía', 'Copernicus', 'Fuentes y créditos']:
    ok(clave.lower() in texto.lower(), f'texto «{clave}»')
ok(len(pdf) <= 15e6, f'pesa ≤ 15 MB ({len(pdf) / 1e6:.2f} MB)')
ok(lento <= 10000, f'≤ 10 s con la CPU 4× más lenta ({lento / 1000:.1f} s)')
rd2 = PdfReader(io.BytesIO(pdf2)); t2 = '\n'.join(p.extract_text() or '' for p in rd2.pages)
ok(len(rd2.pages) == 8 and 'no guardó el recorrido' in t2 and '5 de 24' in t2, f'álbum incompleto: 8 páginas, sin recorrido, «5 de 24» ({len(rd2.pages)})')
print('errores de página:', errores or 'ninguno')
print('RESULTADO:', 'TODO BIEN' if not fallas and not errores else f'{len(fallas)} fallas, {len(errores)} errores')
sys.exit(1 if fallas or errores else 0)
