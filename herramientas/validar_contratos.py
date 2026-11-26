"""Valida el Paquete Páramo contra sus contratos (docs/contratos/) y las referencias entre archivos.

Uso:  python herramientas/validar_contratos.py

Comprueba:
- paquete.json, cada ficha de chat.json, models/parque.json y audios/manifiesto.json (si existe) contra su JSON Schema;
- referencias: fuentes, fichas, estaciones, clases y capítulos que existan; ids únicos; cromos numerados 1..N;
- invariantes de seguridad: fichas del carril crítico presentes y ninguna ficha que afirme un nivel de alerta del volcán;
- que cada archivo de la lista APP de sw.js exista;
- (aviso) que js/i18n.js tenga las mismas claves en es y en.
Sale con código 1 si hay errores. Los avisos no hacen fallar.
"""
import argparse, json, os, re, sys

try:
    from jsonschema import Draft202012Validator
except ImportError:
    sys.exit('Falta jsonschema: pip install -r herramientas/requirements.txt')

AQUI = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CRITICAS = {'emergencia': 'urgente', 'mal_altura': 'urgente', 'comer_plantas': None, 'volcan_estado': None, 'servicios': 'abstencion'}
ALERTA = re.compile(r'alerta\s+(amarilla|naranja|roja|verde)|nivel\s+(amarillo|naranja|rojo|verde)|(yellow|orange|red|green)\s+(alert|level)', re.I)


class Informe:
    def __init__(self):
        self.errores, self.avisos = [], []

    def error(self, donde, msg):
        self.errores.append(f'{donde}: {msg}')

    def aviso(self, donde, msg):
        self.avisos.append(f'{donde}: {msg}')


def leer_json(ruta, inf):
    try:
        with open(ruta, encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        inf.error(os.path.basename(ruta), 'no existe')
    except json.JSONDecodeError as e:
        inf.error(os.path.basename(ruta), f'JSON inválido: {e}')
    return None


def esquema(nombre):
    with open(os.path.join(AQUI, 'docs', 'contratos', nombre), encoding='utf-8') as f:
        s = json.load(f)
    Draft202012Validator.check_schema(s)
    return Draft202012Validator(s)


def validar_esquema(val, datos, donde, inf):
    for e in sorted(val.iter_errors(datos), key=lambda e: list(e.absolute_path)):
        ruta = '/'.join(str(p) for p in e.absolute_path) or '(raíz)'
        inf.error(donde, f'{ruta}: {e.message}')


def unicos(lista, clave, donde, inf):
    vistos = set()
    for x in lista:
        v = x.get(clave)
        if v in vistos:
            inf.error(donde, f'{clave} repetido: {v!r}')
        vistos.add(v)
    return vistos


def revisar_chat(raiz, inf):
    chat = leer_json(os.path.join(raiz, 'chat.json'), inf)
    if chat is None:
        return None
    for k in ('version', 'actualizado', 'estado', 'fuentes', 'fichas', 'fuera'):
        if k not in chat:
            inf.error('chat.json', f'falta la clave {k!r}')
    if not isinstance(chat.get('fichas'), list):
        return None
    val = esquema('chat-ficha.schema.json')
    fuentes = chat.get('fuentes', {})
    for f in chat['fichas']:
        donde = f"chat.json ficha {f.get('id', '?')}"
        validar_esquema(val, f, donde, inf)
        if f.get('fuente') not in fuentes:
            inf.error(donde, f"fuente {f.get('fuente')!r} no está en chat.json -> fuentes")
        if f.get('fuente') == 'app' and f.get('tema') not in ('app', 'recorrido'):
            inf.error(donde, "fuente 'app' solo se permite en fichas de uso de la app o del recorrido, nunca en datos del parque")
        texto = ' '.join(str(f.get(k, '')) for k in ('es', 'en', 'fr', 'de', 'pt-BR', 'es-ES'))
        if ALERTA.search(texto):
            inf.error(donde, 'afirma un nivel de alerta del volcán; el estado del volcán nunca se da (ver volcan_estado)')
    ids = unicos(chat['fichas'], 'id', 'chat.json fichas', inf)
    for fid, bandera in CRITICAS.items():
        f = next((x for x in chat['fichas'] if x.get('id') == fid), None)
        if f is None:
            inf.error('chat.json', f'falta la ficha crítica {fid!r}')
        elif bandera and not f.get(bandera):
            inf.error('chat.json', f'la ficha crítica {fid!r} debe tener {bandera}: true')
    if not chat.get('fuera'):
        inf.aviso('chat.json', 'no hay ejemplos «fuera» de tema')
    usadas = {f.get('fuente') for f in chat['fichas']}
    for k in sorted(set(fuentes) - usadas):
        inf.aviso('chat.json', f'fuente {k!r} declarada pero no usada')
    return ids


def distancia_m(a, b):
    import math
    (la1, lo1), (la2, lo2) = a, b
    x = math.radians(lo2 - lo1) * math.cos(math.radians((la1 + la2) / 2)); y = math.radians(la2 - la1)
    return 6371000 * math.hypot(x, y)


def revisar_paquete(raiz, ids_fichas, inf):
    p = leer_json(os.path.join(raiz, 'paquete.json'), inf)
    if p is None:
        return None
    validar_esquema(esquema('paquete.schema.json'), p, 'paquete.json', inf)
    est = unicos(p.get('estaciones', []), 'id', 'paquete.json estaciones', inf)
    cla = unicos(p.get('clases', []), 'id', 'paquete.json clases', inf)
    cap = unicos(p.get('capitulos', []), 'id', 'paquete.json capitulos', inf)
    cromos = p.get('cromos', [])
    ids_cromos = unicos(cromos, 'id', 'paquete.json cromos', inf)
    ns = sorted(c.get('n') for c in cromos if isinstance(c.get('n'), int))
    if ns != list(range(1, len(cromos) + 1)):
        inf.error('paquete.json cromos', f'los números n deben ser 1..{len(cromos)} sin huecos ni repetidos')
    fuentes = p.get('fuentes', {})
    for c in cromos:
        donde = f"paquete.json cromo {c.get('id', '?')}"
        if ids_fichas is not None and c.get('ficha') not in ids_fichas:
            inf.error(donde, f"ficha {c.get('ficha')!r} no existe en chat.json")
        if c.get('fuente') is not None and c.get('fuente') not in fuentes:
            inf.error(donde, f"fuente {c.get('fuente')!r} no está en paquete.json -> fuentes")
        if c.get('capitulo') not in cap:
            inf.error(donde, f"capítulo {c.get('capitulo')!r} no existe")
        if 'estacion' in c and c['estacion'] not in est:
            inf.error(donde, f"estación {c['estacion']!r} no existe")
        if 'clase' in c and c['clase'] not in cla:
            inf.error(donde, f"clase {c['clase']!r} no existe")
        for k in ('despuesDe', 'otraPlanta'):
            if k in c and c[k] not in ids_cromos:
                inf.error(donde, f'{k} {c[k]!r} no es un cromo')
        if c.get('tipo') == 'gps' and 'estacion' not in c:
            inf.error(donde, 'un cromo gps necesita estacion')
        if c.get('tipo') == 'camara' and 'clase' not in c:
            inf.error(donde, 'un cromo de cámara necesita clase')
        if c.get('tipo') == 'qr' and 'codigo' not in c:
            inf.error(donde, 'un cromo qr necesita codigo')
    unicos([c for c in cromos if 'codigo' in c], 'codigo', 'paquete.json cromos', inf)
    for pa in p.get('paradas', []):
        donde = f"paquete.json parada {pa.get('id', '?')}"
        if pa.get('estacion') not in est:
            inf.error(donde, f"estación {pa.get('estacion')!r} no existe")
        if pa.get('fuente') not in fuentes:
            inf.error(donde, f"fuente {pa.get('fuente')!r} no está en paquete.json -> fuentes")
        if 'cromo' in pa and pa['cromo'] not in ids_cromos:
            inf.error(donde, f"cromo {pa['cromo']!r} no existe")
    # Sendero real (opcional): con fuente y pasando cerca de cada estación (si no, la geocerca nunca se activaría caminando)
    sen = p.get('sendero')
    if sen:
        if sen.get('fuente') not in fuentes:
            inf.error('paquete.json sendero', f"fuente {sen.get('fuente')!r} no está en paquete.json -> fuentes")
        pts = sen.get('puntos') or []
        for e in p.get('estaciones', []):
            if pts and 'lat' in e and 'lon' in e:
                d = min(distancia_m((e['lat'], e['lon']), tuple(q)) for q in pts)
                if d > e.get('radio', 80):
                    inf.error('paquete.json sendero', f"la estación {e.get('id')} queda a {d:.0f} m del sendero (más que su radio de {e.get('radio')} m)")
    for e in p.get('estaciones', []):
        if e.get('porConfirmar'):
            inf.aviso('paquete.json', f"estación {e.get('id')} ({e.get('nombre')}) sigue por confirmar")
    return est


def revisar_parque(raiz, est, inf):
    q = leer_json(os.path.join(raiz, 'models', 'parque.json'), inf)
    if q is None:
        return
    validar_esquema(esquema('parque.schema.json'), q, 'models/parque.json', inf)
    if est is not None:
        for k in (q.get('estaciones') or {}):
            if k not in est:
                inf.error('models/parque.json', f'estación fijada {k!r} no existe en paquete.json')
    L = q.get('lente')
    if isinstance(L, dict) and isinstance(L.get('clases'), list):
        import base64
        try:
            n = len(L['clases'])
            if len(base64.b64decode(L['vectores'])) != n * L['dim'] or len(base64.b64decode(L['escalas'])) != 4 * n:
                inf.error('models/parque.json', 'lente: el tamaño de vectores/escalas no cuadra con dim × clases')
            cab = L.get('cabeza')
            if isinstance(cab, dict) and len(base64.b64decode(cab.get('centro', ''))) != 4 * L['dim']:
                inf.error('models/parque.json', 'lente.cabeza: el centro no tiene dim números')
        except Exception as e:  # base64 inválido
            inf.error('models/parque.json', f'lente: base64 inválido ({e})')


def revisar_audios(raiz, inf):
    ruta = os.path.join(raiz, 'audios', 'manifiesto.json')
    if not os.path.exists(ruta):
        return
    m = leer_json(ruta, inf)
    if m is None:
        return
    validar_esquema(esquema('audios.schema.json'), m, 'audios/manifiesto.json', inf)
    for a in m.get('audios', []):
        if isinstance(a, dict) and a.get('archivo') and not os.path.exists(os.path.join(raiz, a['archivo'])):
            inf.error('audios/manifiesto.json', f"no existe {a['archivo']}")


def revisar_sw(raiz, inf):
    try:
        with open(os.path.join(raiz, 'sw.js'), encoding='utf-8') as f:
            sw = f.read()
    except FileNotFoundError:
        inf.error('sw.js', 'no existe')
        return
    m = re.search(r'const APP = \[(.*?)\];', sw, re.S)
    if not m:
        inf.error('sw.js', 'no encuentro la lista APP')
        return
    for u in re.findall(r"'([^']+)'", m.group(1)):
        if u == './':
            continue
        if not os.path.exists(os.path.join(raiz, u)):
            inf.error('sw.js', f'la lista APP nombra {u!r}, que no existe')


TOKEN = re.compile(r"""'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`|//[^\n]*|[A-Za-z_]\w*|\S""")


def claves_js(bloque):
    """Claves de primer nivel de un objeto literal JS: lo que va justo después de '{' o ',' y antes de ':'.
    Salta el contenido de las cadenas, así una frase con «:» no cuenta como clave."""
    toks = [t for t in TOKEN.findall(bloque) if not t.startswith('//')]
    out, prof = set(), 0
    for i, t in enumerate(toks):
        if t in '{([':
            prof += 1
        elif t in '})]':
            prof -= 1
        elif prof == 1 and i + 1 < len(toks) and toks[i + 1] == ':' and i > 0 and toks[i - 1] in ('{', ','):
            out.add(t.strip('\'"`'))
    return out


def revisar_i18n(raiz, inf):
    ruta = os.path.join(raiz, 'js', 'i18n.js')
    if not os.path.exists(ruta):
        return
    with open(ruta, encoding='utf-8') as f:
        src = f.read()
    i_es, i_en = src.find('\n  es: {'), src.find('\n  en: {')
    if i_es < 0 or i_en < 0:
        inf.aviso('js/i18n.js', 'no encuentro los bloques es/en; no reviso claves')
        return
    fin = src.find('\n};', i_en)
    es, en = claves_js(src[i_es:i_en]), claves_js(src[i_en:fin if fin > 0 else len(src)])
    for k in sorted(es - en):
        inf.aviso('js/i18n.js', f'clave {k!r} está en es y no en en')
    for k in sorted(en - es):
        inf.aviso('js/i18n.js', f'clave {k!r} está en en y no en es')


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.parse_args()
    inf = Informe()
    ids = revisar_chat(AQUI, inf)
    est = revisar_paquete(AQUI, ids, inf)
    revisar_parque(AQUI, est, inf)
    revisar_audios(AQUI, inf)
    revisar_sw(AQUI, inf)
    revisar_i18n(AQUI, inf)
    for x in inf.avisos:
        print(f'  aviso  {x}')
    for x in inf.errores:
        print(f'  ERROR  {x}')
    if inf.errores:
        print(f'\nContratos: {len(inf.errores)} error(es), {len(inf.avisos)} aviso(s).')
        sys.exit(1)
    print(f'\nContratos: OK ({len(inf.avisos)} aviso(s)).')


if __name__ == '__main__':
    main()
