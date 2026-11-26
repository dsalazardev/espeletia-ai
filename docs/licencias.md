# Licencias de modelos, voces y librerías

Verificado el 24-nov-2026 en fuentes primarias (OpenStreetMap y las fotos de Commons, el 25-nov): model cards de Hugging Face del autor, archivos LICENSE de GitHub, registro
npm, licencia oficial de Copernicus y documentación de Piper. Lo que no se pudo verificar dice «no verificado».
Contexto: si ganamos, la app la pilotearía **UTON, un operador comercial**. Por eso solo vale lo que permite uso comercial.
Decisión: [licencias-de-modelos](decisiones/2026-11-24-licencias-de-modelos.md).

## 1. Lo que ya usa la app
| Componente | Licencia | ¿Comercial? | Qué exige | Fuente |
|---|---|---|---|---|
| multilingual-e5-small (podado e int8) | MIT (model card; base Multilingual-MiniLM: MIT) | Sí | Aviso MIT; indicar que la versión está modificada | huggingface.co/intfloat/multilingual-e5-small |
| MobileNetV2 (embeddings) | **Apache-2.0: es el `mobilenetv2-12` del ONNX Model Zoo** sin el clasificador (pesos y salidas idénticos, verificado el 24-nov) | Sí | LICENSE Apache-2.0 | github.com/onnx/models/tree/main/validated/vision/classification/mobilenet |
| ONNX Runtime Web 1.31 | MIT (© Microsoft) | Sí | Aviso MIT | npmjs.com/package/onnxruntime-web |
| @huggingface/tokenizers | Apache-2.0 | Sí | LICENSE (ya en `lib/tokenizers.LICENSE`) | github.com/huggingface/tokenizers.js |
| jsQR | Apache-2.0 | Sí | LICENSE (**falta en lib/**) | github.com/cozmo/jsQR |
| qrcode-generator | MIT (© 2009 Kazuhiko Arase) | Sí | Aviso MIT; «QR Code» es marca registrada de DENSO WAVE | github.com/kazuhikoarase/qrcode-generator |
| Bricolage Grotesque / Atkinson Hyperlegible | OFL-1.1 | Sí | Aviso + OFL.txt junto a las fuentes (**falta en fonts/**) | github.com/google/fonts |
| Copernicus DEM GLO-30 | Licencia propia de Copernicus (uso comercial permitido, gratuito) | Sí | Texto de atribución exacto + frase de no responsabilidad (completo en `licencias/README.md`; corto bajo el mapa) | dataspace.copernicus.eu (PDF de licencias COP-DEM) |
| OpenStreetMap (sendero y estaciones, desde el 25-nov) | ODbL 1.0 | Sí | «© colaboradores de OpenStreetMap» visible junto al mapa y enlace a openstreetmap.org/copyright. Si se publica una base de datos derivada, va con ODbL | openstreetmap.org/copyright |
| Fotos de Wikimedia Commons (modelo base provisional de la Lente, desde el 25-nov) | CC BY 2.0–4.0, CC BY-SA 2.0–4.0, CC0, dominio público | Sí | Autor y licencia de cada foto: [licencias/lente-provisional-commons.md](../licencias/lente-provisional-commons.md). La app guarda solo la huella (1280 números), no la foto | commons.wikimedia.org |

## 2. SLM generativo (para reformular la ficha recuperada; decisión slm-generativo-opcional)
| Modelo | Licencia | ¿Comercial? | Tamaño listo para navegador | Español | Nota |
|---|---|---|---|---|---|
| **Qwen2.5-0.5B-Instruct** | **Apache-2.0** | Sí | q4f16 483 MB (WebGPU) · int8 512 MB (WASM) | Sí (declarado en el card) | **Recomendado**: transformers.js usa el mismo ONNX Runtime que la app |
| Qwen3-0.6B | Apache-2.0 | Sí | q4f16 570 MB | Sí (100+ idiomas) | Alternativa; desactivar el modo de razonamiento |
| Gemma 3 270M / 1B | Gemma Terms of Use | Sí, con condiciones | 250–760 MB | 140 idiomas (familia) | Hay que trasladar la Prohibited Use Policy y aceptar que Google puede restringir el uso |
| Gemma 4 E2B | Apache-2.0 | Sí | ≥2 GB en navegador; 0,84 GB solo texto en nativo (LiteRT) | 140+ | Solo para «Pro nativo» en Android |
| Llama 3.2 1B | Llama 3.2 Community License | Sí, con condiciones | q4f16 ~0,9–1,1 GB | Sí | Obliga a mostrar «Built with Llama» y a aceptar su política de uso |
| SmolLM2 | Apache-2.0 | Sí | 118–1109 MB | **No** (principalmente inglés) | Descartado por idioma |
| Phi-4-mini, SmolLM3, Gemma 3n | MIT / Apache / Gemma | — | ≥2 GB | — | Descartados por tamaño |

**No hay datos publicados de velocidad de estos modelos en el navegador de un teléfono de gama media.** Hay que medirlo
antes de prometer nada. iOS Safari tiene WebGPU solo desde iOS 26 (dato de fuentes secundarias). Sin WebGPU queda WASM, más lento.

## 3. Voces (síntesis en el computador, no en el teléfono)
- **Motor Piper:** el proyecto se mudó a `OHF-Voice/piper1-gpl` y pasó a **GPL-3.0-or-later** (el antiguo rhasspy/piper, MIT,
  está archivado). La GPL cubre el motor, que no se distribuye con la app. **La licencia de cada voz es la de su dataset y la de
  toda su cadena de entrenamiento**: Piper publica una lista oficial de voces aptas para uso comercial (docs/COMMERCIAL_USE.md).
- **Voces aptas para uso comercial recomendadas:**
  | Idioma | Voz | Licencia | Obligación |
  |---|---|---|---|
  | es (España) | `es_ES-davefx-medium` | CC0 (base rdh CC0) | ninguna |
  | es (alternativa) | `es_ES-sharvard-medium` | CC BY 3.0 + base Hi-Fi TTS CC BY 4.0 | doble atribución |
  | en | `en_US-joe-medium` / `en_US-mike-medium` | CC0 | ninguna |
  | fr | `fr_FR-siwis-medium` | CC BY 4.0 (+ Hi-Fi TTS) | atribución SIWIS y Hi-Fi TTS |
  | pt-BR | `pt_BR-cadu-medium` / `pt_BR-jeff-medium` | CC0 | ninguna |
- **Descartadas:** las derivadas de lessac (Blizzard 2013, no comercial) o de ryan (CC BY-NC-SA), y las de procedencia dudosa:
  es_ES-mls_*, es_AR-daniela, es_MX-ald, es_MX-claude, en_US-lessac/ryan/amy/hfc, fr_FR-upmc/gilles/tom.
- **Kokoro-82M:** Apache-2.0. Tiene voces es, fr y pt-br, pero su autor advierte que el soporte fuera del inglés «puede ser
  escaso», y parte del entrenamiento usó audio sintético de proveedores cerrados. Queda como plan B.
- **Voz colombiana:** **no hay ninguna abierta y apta para uso comercial.** Las existentes (MMS-TTS y derivadas) son CC-BY-NC.
  → **es-CO se graba con personas** (decisión voz-audio-pregrabado). Después del hackatón se podría entrenar una voz Piper
  es_CO desde rdh (CC0) con el dataset OpenSLR 72 (CC BY-SA 4.0); queda la duda de si el «compartir igual» alcanza al modelo.
- Guardar en el repo el MODEL_CARD de cada voz usada y comprobar que diga «Finetuned from the rdh/hifi_tts_92 base»
  (Piper reentrenó voces sin cambiarles el nombre).

## 4. Traducción en vivo (spike P2)
| Pieza | Opción apta | Licencia | Tamaño | Nota |
|---|---|---|---|---|
| Voz → texto (es) | Vosk small-es-0.42 | Apache-2.0 | 39 MB | Corre en el navegador (vosk-browser); WER 16 en Common Voice |
| Voz → texto (es) | Moonshine streaming tiny-es | MIT | 27 M parámetros | Ejecución en navegador no verificada |
| Voz → texto | Whisper tiny/base | MIT (GitHub) / Apache (HF) | 41 / 77 MB | Solo traduce hacia inglés |
| Texto → texto | Bergamot / Firefox Translations | MPL-2.0 | ~32 MB por par | en↔es, en↔fr, en↔pt; pivota por inglés |
| Texto → texto | Opus-MT (Helsinki-NLP) | Apache-2.0 | ~55 MB por dirección | No hay es↔pt directo |
| ~~NLLB-200~~ | — | **CC-BY-NC-4.0** | — | **Descartado** |
| ~~moonshine-es (no streaming)~~ | — | licencia con tope de ingresos | — | Evitar |

## 5. Acciones
1. **Atribución de Copernicus.**
   - Hecho: el texto exacto (art. 6 b y c) está en `herramientas/relieve.py` (constantes `ATRIBUCION` y `DESCARGO`) y en
     [licencias/README.md](../licencias/README.md).
   - Hecho (R2): bajo el mapa va la versión corta («Relieve: Copernicus WorldDEM-30 © DLR, Airbus · Camino: © colaboradores
     de OpenStreetMap — ver créditos») con enlace a Créditos.
   - Hecho: `models/relieve.json` ya trae `atribucion` y `descargo` completos, y Créditos los muestra.
2. **MobileNetV2: resuelto, no hay que cambiar nada.** El ONNX de la app es el `mobilenetv2-12` del ONNX Model Zoo
   (Apache-2.0) cortado en el tensor `472`, justo antes del clasificador, y optimizado. Comprobación del 24-nov: los 103 tensores
   de pesos grandes son idénticos uno a uno y las salidas coinciden con diferencia 0,0 sobre entradas aleatorias. Los dos dicen
   «pytorch 1.8 / torch-jit-export» porque el Zoo lo convirtió desde PyTorch. No hay que re-exportar ni recalibrar la Lente.
3. **Archivos de licencia.**
   - Hecho: carpeta [licencias/](../licencias/README.md) con los textos oficiales (Apache-2.0, MIT de ORT, e5-small y
     qrcode-generator, OFL de las dos fuentes) y el índice de componentes.
   - Hecho (R2): pantalla «Créditos y licencias» en Ajustes, con OpenStreetMap y las fotos de Commons.
4. Si se usan voces CC BY o un LLM: añadir sus créditos a esa pantalla y a `licencias/` (lista en §3 y §2).
