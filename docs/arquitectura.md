# Arquitectura

PWA estática (sin build, módulos ES) que, después de abrirse una vez con señal, funciona entera en modo avión. Las decisiones
que la sostienen están en [decisiones/](decisiones/README.md).

## Vista general
```
                   ┌───────────────────────── teléfono del visitante (modo avión) ─────────────────────────┐
                   │                                                                                       │
  Netlify (main)   │  sw.js  ── precachea APP + une y verifica SHA-256 los modelos ──►  Cache Storage       │
  ───────────────► │   │       (paquete.json y parque.json se refrescan si hay señal)        │              │
  1ª visita con    │   ▼                                                                      ▼              │
  señal (~95 MB)   │  index.html + js/app.js ──────────────────────────────────────────────────────────┐    │
                   │   │                                                                            │    │
                   │   ├─ Experiencia: álbum · sobres · cromos · mapa 2D/3D · bitácora · Modo guía     │    │
                   │   │              compañeros 2D en cámara · paradas narradas · PDF · avisos sin red  │    │
                   │   │                                                                            │    │
                   │   ├─ Fray (js/chat.js) ──► carril crítico determinista ◄── resultado de búsqueda   │    │
                   │   │        │                 (emergencia · comer · volcán: siempre prevalece)      │    │
                   │   │        ▼                                                                    │    │
                   │   ├─ js/motor.js ──postMessage──► js/motor-worker.js (Web Worker)                 │    │
                   │   │                                 ONNX Runtime WASM                             │    │
                   │   │                                 ├─ e5-small (texto, 66 MB)  → vector pregunta │    │
                   │   │                                 └─ MobileNetV2 (visión, 9 MB) → vector foto   │    │
                   │   │                                                                            │    │
                   │   └─ Paquete Páramo: chat.json · paquete.json · models/parque.json · chat_indice   │    │
                   │                     (fichas con fuente · cromos · estaciones · Lente del equipo)  │    │
                   └───────────────────────────────────────────────────────────────────────────────────────┘
       Teléfono del guía ──QR / código HMAC por franja de 5 min (sin red)──► teléfono del visitante
```

## Capas
| Capa | Qué contiene | Dónde | Dueño |
|---|---|---|---|
| Paquete Páramo | Fichas oficiales con fuente (es/en), cromos, estaciones, **sendero real** (OpenStreetMap), paradas, horario, clases de la Lente y calibración; el modelo base de la Lente (provisional, Commons); a futuro frases del guía y audios | `chat.json`, `paquete.json`, `models/parque.json` | R1 (contenido), R3 (contratos) |
| Plataforma offline | Precarga, verificación SHA-256, actualización por versión | `sw.js`, `models/partes.json`, `_headers`, `netlify.toml` | R3 |
| Motor | ONNX Runtime en un worker; e5-small (recuperación) y MobileNetV2 + k-NN (Lente) | `js/motor*.js`, `js/ml.js`, `models/partes/` | R2 (código), R3 (modelos congelados) |
| Carril crítico | Reglas deterministas de emergencia, comer y volcán | `js/chat.js` + copia en `herramientas/tema_chat.py` | R1 (bancos), R2 (código) |
| Experiencia | Álbum, sobres, Lente, mapa (plano, 3D y distancias por el sendero), Modo guía, chat, compañeros 2D, paradas narradas, PDF y collage, avisos sin red, botón «atrás» | `js/*`, `index.html`, `styles.css` | R2 |
| Presentación | Textos de interfaz es/en, capa de tono, voz (local o grabación revisada), escalera de degradación y accesibilidad (texto, contraste, ahorro) | `js/i18n.js` | R2 (+R1 traducciones) |
| Pro (opcional) | LLM nativo que reformula y verifica contra la ficha | spike P2, fuera de la PWA | R2/R3 |

## Flujo de una pregunta a Fray
1. `chat.js` calcula el vector de la pregunta en el worker (`query: …`) y lo compara con los vectores precalculados de
   `models/chat_indice.json` (formas de preguntar, textos de las fichas y ejemplos «fuera de tema»).
2. Combina significado + palabras (léxico con idf) y aplica umbrales calibrados (`params` del índice).
3. Con tema activo (Lente o cromo), prueba «pregunta (tema)» con la estrategia medida en `herramientas/tema_chat.py`.
4. **Carril crítico:** si hay palabras de urgencia, sale `emergencia`; si se habla de comer o tóxico, `comer_plantas`.
   Prevalece sobre lo que haya dicho la búsqueda.
5. Responde con la ficha y su fuente, «¿te refieres a…?» o «no tengo esa información oficial». Nunca genera texto.
- Si el modelo no carga (RAM), sigue en **solo léxico** con las mismas reglas.

## Flujo de un cromo
GPS (geocerca de estación sobre el sendero real) · pausa de contemplación o de aclimatación · foto de grupo · Lente (k-NN
sobre `parque.json`, promedio de 3 cuadros) · QR de fauna · código o QR del guía (historias, paradas narradas) →
`estado.js` guarda en IndexedDB → sobre → álbum → PDF del álbum + collage (`js/exportar.js`).

## El mapa
- **Relieve:** `models/relieve.*` (Copernicus DEM GLO-30, celdas de ~60 m) en `js/relieve.js`. Lo usan el pliego, el 3D
  (`js/mapa3d.js`) y la altura estimada sin GPS.
- **Sendero:** `paquete.json → sendero`, de OpenStreetMap. `js/sendero.js` proyecta una posición sobre el camino y mide
  distancias por él. Si el paquete no trae sendero, todo vuelve a la línea recta entre estaciones.
- **Geocercas:** `js/mapa.js` entrega el cromo de una estación al entrar en su radio (80–100 m más el margen del GPS, hasta
  30 m) con precisión de 120 m o mejor. `validar_contratos.py` exige que cada estación quede dentro de su radio respecto al
  sendero.
- **Bitácora:** `js/bitacora.js` registra solo dentro del parque (a menos de 3 km de una estación). Resumen, perfil y rastro
  usan la jornada actual (desde la última pausa de más de 3 horas).

## Archivos generados (no editar a mano)
| Archivo | Se genera con |
|---|---|
| `models/chat_indice.json` | `python -X utf8 herramientas/indice_chat.py --fijos` (o sin `--fijos` para recalibrar) |
| `models/partes/*`, `models/partes.json` | `python herramientas/partir.py …` |
| `models/relieve.*` | `python herramientas/relieve.py …` |
| `models/parque.json` (Lente) | Modo equipo → «Descargar parque.json», o `python3 herramientas/lente_base.py fotos/` |
| `docs/decisiones/README.md`, `CHANGELOG.md` | `python herramientas/generar_indices.py` |

## Modelos y licencias (detalle y fuentes en [licencias.md](licencias.md))
| Modelo | Uso | Tamaño | Licencia | Verificado 24-nov |
|---|---|---|---|---|
| multilingual-e5-small (podado a vocabulario latino, int8) | Fray | 66 MB | MIT | sí |
| Lente base provisional (`models/parque.json`) | 120 huellas de fotos de Wikimedia Commons (CC BY, CC BY-SA, CC0, dominio público) | 207 KB | ver [licencias/lente-provisional-commons.md](../licencias/lente-provisional-commons.md) | sí (25-nov) |
| MobileNetV2 (embeddings) | Lente | 8,8 MB | Apache-2.0 (ONNX Model Zoo `mobilenetv2-12`, sin clasificador; pesos idénticos) | sí |
| ONNX Runtime Web 1.31 | motor | 14,8 MB (WASM) | MIT | sí |
| Qwen2.5-0.5B-Instruct (propuesto, opcional) | reformular la ficha recuperada | ~480-510 MB | Apache-2.0 | sí (licencia); velocidad en teléfono sin medir |
| Piper (voces davefx, joe/mike, siwis, cadu/jeff) | síntesis offline de audios en el computador, no en el teléfono | — | motor GPL-3.0; voces CC0 / CC BY | sí |

## Puntos de choque entre roles
`sw.js` (VERSION y lista APP), `js/i18n.js`, `styles.css`, `index.html`, `chat.json` y `models/chat_indice.json`.
Ver [flujo-de-trabajo.md](flujo-de-trabajo.md#puntos-de-choque).
