"""Construye el modelo base de la Lente a partir de carpetas de fotos y lo guarda en models/parque.json.

Así la Lente reconoce desde el primer uso en cualquier teléfono, sin que nadie la entrene en campo.

Estructura esperada (una carpeta por clase, nombres como en paquete.json → clases):
    fotos/frailejon/*.jpg   fotos/pajonal/*.jpg   fotos/laguna/*.jpg   fotos/roca/*.jpg
    fotos/nevado/*.jpg      fotos/musgo/*.jpg     fotos/sietecueros/*.jpg   fotos/otro/*.jpg
Recomendado: 20 a 40 fotos por clase, de días, lugares y ángulos distintos. «otro» con personas,
carros, piso, cielo, letreros: lo que NO es ninguna clase.

Uso, desde la raíz de la app:
    pip install onnxruntime pillow numpy
    python3 herramientas/lente_base.py ruta/a/fotos            # reemplaza la base
    python3 herramientas/lente_base.py ruta/a/fotos --sumar    # conserva las huellas que ya hay y suma estas

Además de escribir models/parque.json, calibra la «cabeza» de la Lente (lente.cabeza):
  - centro: la huella promedio de la base. La app se la resta a cada huella antes de comparar (SimpleShot):
    las huellas de MobileNetV2 no tienen negativos y, sin centrar, todas se parecen (0,56 contra 0,50).
  - umbral: el menor valor de certeza con el que, dejando fuera cada foto, la Lente acierta al menos el 90 %
    de las veces que responde. La app lo usa en vez de camara.umbral de paquete.json.
Imprime la matriz de confusión y cuánto responde con ese umbral. Las estaciones de models/parque.json se conservan.
"""
import base64, hashlib, json, os, sys, datetime
import numpy as np
import onnxruntime as ort
from PIL import Image, ImageOps

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)
EXT = ('.jpg', '.jpeg', '.png', '.webp', '.heic')


def modelo():
    man = json.load(open(os.path.join(RAIZ, 'models', 'partes.json')))['models/mnv2_embed.onnx']
    datos = b''.join(open(os.path.join(RAIZ, p), 'rb').read() for p in man['partes'])
    assert hashlib.sha256(datos).hexdigest() == man['sha256'], 'partes del modelo dañadas'
    return ort.InferenceSession(datos)


def tensor(ruta):
    # Igual que js/ml.js: recorte central del 80 % del lado menor → 224×224 → normalización ImageNet
    im = ImageOps.exif_transpose(Image.open(ruta)).convert('RGB')
    w, h = im.size
    lado = min(w, h) * 0.8
    x0, y0 = (w - lado) / 2, (h - lado) / 2
    im = im.resize((224, 224), Image.BILINEAR, box=(x0, y0, x0 + lado, y0 + lado))
    a = (np.asarray(im, dtype=np.float32) / 255 - MEAN) / STD
    return a.transpose(2, 0, 1)[None]


def codificar(vs, clases):
    vs = np.asarray(vs, dtype=np.float32)
    esc = np.abs(vs).max(1) / 127
    esc[esc == 0] = 1
    q = np.round(vs / esc[:, None]).astype(np.int8)
    return {'dim': int(vs.shape[1]), 'clases': clases,
            'vectores': base64.b64encode(q.tobytes()).decode(), 'escalas': base64.b64encode(esc.astype(np.float32).tobytes()).decode()}


def decodificar(L):
    q = np.frombuffer(base64.b64decode(L['vectores']), dtype=np.int8).reshape(-1, L['dim']).astype(np.float32)
    es = np.frombuffer(base64.b64decode(L['escalas']), dtype=np.float32)
    v = q * es[:, None]
    return list(v / np.linalg.norm(v, axis=1, keepdims=True)), list(L['clases'])


K, TEMP, OBJETIVO = 7, 10, 0.90


def votar(M, cl, i):
    """k-NN de la app (js/ml.js → classify) sobre huellas ya centradas: clase ganadora y parte de los votos."""
    top = np.argsort(-M[i])[:K]
    votos = {}
    for j in top:
        votos[cl[j]] = votos.get(cl[j], 0) + np.exp(TEMP * M[i, j])
    c = max(votos, key=votos.get)
    return c, votos[c] / sum(votos.values())


def calibrar(V, cl):
    """Centro y umbral de la cabeza, con validación «deja uno fuera» (lo mismo que hace la app en el teléfono)."""
    V = np.stack(V); cl = np.array(cl)
    centro = V.mean(0)
    Vc = V - centro; Vc /= np.linalg.norm(Vc, axis=1, keepdims=True)
    M = Vc @ Vc.T; np.fill_diagonal(M, -9)
    pr = [votar(M, cl, i) for i in range(len(cl))]
    p = np.array([a for a, _ in pr]); s = np.array([b for _, b in pr])
    umbral, medido = 0.99, None
    for t in np.arange(0.30, 1.0, 0.01):
        resp = (p != 'otro') & (s >= t)
        if resp.sum() >= 5 and (p[resp] == cl[resp]).mean() >= OBJETIVO:
            pos = cl != 'otro'
            umbral = round(float(t), 2)
            medido = {'acierta_al_responder': round(float((p[resp] == cl[resp]).mean()), 3),
                      'responde': round(float((resp & pos).sum() / pos.sum()), 3),
                      'otro_da_cromo': round(float((resp & (cl == 'otro')).sum() / max(1, (cl == 'otro').sum())), 3),
                      'acierto': round(float((p == cl).mean()), 3), 'fotos': int(len(cl))}
            break
    # Curva de certeza: qué tanto acierta de verdad según la parte de los votos (para mostrar «Certeza N %» honesta)
    curva = []
    for lo, hi in [(0.30, 0.45), (0.45, umbral), (umbral, 0.70), (0.70, 0.85), (0.85, 0.99), (0.99, 1.01)]:
        m = (s >= lo) & (s < hi) & (p != 'otro')
        if m.sum() >= 5:
            curva.append([round(float(s[m].mean()), 3), round(float((p[m] == cl[m]).mean()), 3)])
    for i in range(1, len(curva)):  # que nunca baje al subir los votos
        curva[i][1] = max(curva[i][1], curva[i - 1][1])
    if medido:
        medido['curva'] = curva
    return centro.astype(np.float32), umbral, medido, p, cl


def main(carpeta, sumar=False):
    paq = json.load(open(os.path.join(RAIZ, 'paquete.json')))
    validas = [k['id'] for k in paq['clases']]
    ses = modelo()
    nombre_in = ses.get_inputs()[0].name
    vs, cl = [], []
    ruta = os.path.join(RAIZ, 'models', 'parque.json')
    previo = json.load(open(ruta)) if os.path.exists(ruta) else {}
    if sumar and previo.get('lente'):
        vs, cl = decodificar(previo['lente'])
        print(f'Se conservan {len(cl)} huellas de models/parque.json')
    for c in sorted(os.listdir(carpeta)):
        d = os.path.join(carpeta, c)
        if not os.path.isdir(d):
            continue
        if c not in validas:
            print(f'  aviso: la carpeta «{c}» no es una clase de paquete.json ({", ".join(validas)}); se omite')
            continue
        fotos = [f for f in sorted(os.listdir(d)) if f.lower().endswith(EXT)]
        for f in fotos:
            try:
                v = ses.run(None, {nombre_in: tensor(os.path.join(d, f))})[0][0]
            except Exception as e:  # foto dañada o formato no soportado
                print(f'  no pude leer {c}/{f}: {e}')
                continue
            vs.append(v / (np.linalg.norm(v) or 1)); cl.append(c)
        print(f'{c:12s} {sum(1 for x in cl if x == c):3d} fotos')
    if not vs:
        sys.exit('No encontré fotos. Revisa la estructura de carpetas (ver la ayuda arriba).')

    # Validación «deja uno fuera» con la misma cabeza de la app (huellas centradas, k=7, votos exp(10·similitud))
    centro, umbral, medido, p, cla = calibrar(vs, cl)
    nombres = sorted(set(cl)); idx = {c: i for i, c in enumerate(nombres)}
    conf = np.zeros((len(nombres), len(nombres)), int)
    for real, dijo in zip(cla, p):
        conf[idx[real], idx[dijo]] += 1
    print('\nValidación deja-uno-fuera (filas: real, columnas: lo que dijo la Lente)')
    print(' ' * 12 + ''.join(f'{n[:6]:>7s}' for n in nombres))
    for n in nombres:
        print(f'{n:12s}' + ''.join(f'{x:7d}' for x in conf[idx[n]]) + f'   acierto {conf[idx[n], idx[n]] / max(1, conf[idx[n]].sum()):.0%}')
    print(f'Total: {np.trace(conf) / conf.sum():.0%}')
    if medido:
        print(f'Umbral calibrado {umbral}: responde en {medido["responde"]:.0%} de las fotos y acierta {medido["acierta_al_responder"]:.0%} '
              f'de las veces que responde; «otra cosa» da cromo en {medido["otro_da_cromo"]:.0%}.')
    else:
        print('Aviso: con estas fotos ningún umbral llega al 90 % de acierto; se deja 0,99 (casi nunca responde). Faltan fotos.')

    lente = codificar(vs, cl)
    lente['cabeza'] = {'tipo': 'knn-centrado', 'k': K, 'temperatura': TEMP, 'umbral': umbral, 'objetivo': OBJETIVO,
                       'centro': base64.b64encode(centro.tobytes()).decode(), 'curva': (medido or {}).pop('curva', []), 'medido': medido}
    salida = {'tipo': 'paramo-parque', 'version': 1, 'fecha': datetime.date.today().isoformat(),
              'lente': lente, 'estaciones': previo.get('estaciones', {})}
    if previo.get('nota') and sumar:
        salida['nota'] = previo['nota']
    json.dump(salida, open(ruta, 'w'), ensure_ascii=False)
    print(f'\nEscrito models/parque.json ({os.path.getsize(ruta) / 1e3:.0f} KB). Publica el sitio para que llegue a todos los teléfonos.')


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if not args:
        print(__doc__)
    else:
        main(args[0], sumar='--sumar' in sys.argv)
