---
rol: R3                      # R3 la app nativa y el puente; R2 el lado de la PWA (js/chat.js)
estado: borrador
prioridad: P1
decisiones: [2026-11-25-apk-android-llm-nativo, 2026-11-24-niveles-de-telefono, 2026-11-24-slm-generativo-opcional, 2026-11-24-recuperar-no-generar, 2026-11-24-carril-critico-determinista, 2026-11-24-guia-en-el-centro]
---
# Fray nativo: app Android (Flutter + llamadart) que envuelve la PWA y reescribe la respuesta oficial con un LLM local

## Problema
Fray responde con la frase oficial (recuperación + respuesta extractiva): es correcta, pero suena a ficha. Un LLM en el
navegador fue lento (7-19 s), inútil (0-2 de 7) y **congeló un Redmi Note 15 Pro 5G** (decisión slm-generativo-opcional). Queremos
que Fray suene conversacional **sin perder la frase oficial ni la seguridad**, en modo avión y en un teléfono de gama media.
Para eso, una app Android muestra la misma PWA en un WebView y le agrega un LLM **nativo** (llama.cpp o LiteRT-LM) que solo
**reescribe** la frase oficial. Un verificador determinista decide si se muestra.

Investigación de apoyo: [velocidad-llm-telefonos](../investigacion/velocidad-llm-telefonos.md) (cifras publicadas) y
[plataforma-nativa](../investigacion/plataforma-nativa.md) (por qué Flutter + llamadart).

## 1. Arquitectura
```
┌──────────────── APK Android (Flutter) ─────────────────────────────────────────────┐
│  Servidor local (Dart, shelf) en http://127.0.0.1:8787  ◄── assets/pwa/ (copia de la PWA) │
│        │ sirve index.html, js/, lib/, models/, chat.json… con el MIME correcto            │
│        ▼                                                                            │
│  WebView (webview_flutter) ── carga http://127.0.0.1:8787/ ── la PWA tal cual       │
│        │  window.FrayNativo (shim JS que inyecta el servidor)                      │
│        │  JavaScriptChannel «FrayNativoCanal» ⇄ runJavaScript (respuestas y trozos)  │
│        ▼                                                                            │
│  Puente (Dart) ─► Carril crítico (lista fija + chat.json) ─► rechaza sin modelo     │
│        │                                                                            │
│        ▼                                                                            │
│  Motor (llamadart) ─► llama.cpp (GGUF, CPU 4 hilos) │ LiteRT-LM (.litertlm, CPU/GPU) │
│        │  modelo precargado al abrir · prefijo del sistema en caché · streaming     │
│        ▼                                                                            │
│  Verificador (Dart, copia del de laboratorio/slm.html) ─► ok / fallas               │
└───────────────────────────────────────────────────────────────────────────────────┘
```

### 1.1 Flutter + llamadart (verificado el 25-nov-2026)
- **Flutter estable 3.44.7** (el instalado en el PC; Dart 3.12.2). El último estable publicado es 3.50.1 (20-nov-2026). Para el
  jueves nos quedamos con el instalado.
- **llamadart 0.21.0** (pub.dev, publicado el 25-nov-2026; https://pub.dev/packages/llamadart · https://github.com/leehack/llamadart):
  - Licencia **MIT**. 160/160 puntos en pub.dev y 82.743 descargas en 30 días. El repo tiene 92 estrellas, 104 issues abiertos y
    actividad diaria (último push el 25-nov).
  - Requisitos: Dart ≥3.10.7 y Flutter ≥3.38.6. Cumplimos.
  - **Dos motores detrás de una API:**
    - **GGUF por llama.cpp.**
    - **`.litertlm` por LiteRT-LM.** El runtime nativo es `leehack/litert-lm-native@v0.20.0`.
    - `LlamaBackend()` elige el motor según el archivo del modelo.
  - **Streaming, cancelación y salida estructurada:**
    - Streaming de texto con tareas cancelables.
    - `GenerationParams(maxTokens, stopSequences, temp, seed, grammar)`.
    - **GBNF** en llama.cpp nativo (`grammar:`).
    - **JSON Schema estricto** en LiteRT-LM, solo para Qwen3 y Gemma 4 (CPU y GPU en Android arm64). LiteRT-LM no acepta GBNF
      arbitrario.
  - **Guardar y restaurar el estado KV** (guía «API levels» de su documentación). Eso permite cachear el prefijo del sistema.
  - Hilos con `ModelParams.numberOfThreads` / `numberOfThreadsBatch`; `useMmap`; `gpuLayers`.
  - **Backends en Android:**
    - **llama.cpp en CPU:** es el camino normal.
    - **Vulkan:** «experimental y opt-in».
    - **OpenCL:** opt-in, y ggml-opencl «admite solo Adreno (e Intel)». **En el Redmi (Mali) no sirve.**
    - **LiteRT-LM:** CPU, GPU (OpenCL) y NPU. Para la GPU, el manifiesto debe pedir `libOpenCL.so` con `required="false"`.
      Su documentación advierte que tener OpenCL «no garantiza que la GPU arranque ni que la salida sea correcta». Con
      `ComputeDevice.auto`, si la GPU falla, reintenta en CPU.
  - **Build:** un *build hook* de Dart baja en el **primer `flutter build`** los binarios nativos ya compilados (de
    `leehack/llamadart-native` y `leehack/litert-lm-native`). No hace falta NDK ni toolchain de C++. **Hace falta red al compilar,
    no al usar la app.**
- **Riesgos de llamadart:**
  1. Es de **un solo mantenedor** y saca versiones casi a diario (0.20.8 el 24-nov, 0.21.0 el 25-nov). Fijamos `llamadart: 0.21.0`
     exacto en `pubspec.yaml` y `pubspec.lock` en git. No se actualiza hasta después de la demo.
  2. El *build hook* depende de GitHub Releases al compilar. Si falla, la alternativa es compilar en GitHub Actions (§10).
  3. En la GPU Mali solo sirve LiteRT-LM, y **no hay ninguna medición de LLM en una GPU Mali-G615 MC2** (investigación §3).
  4. No hay datos publicados de llamadart en Android de gama media: sus pruebas citan Pixel 9 Pro, Galaxy S24 y A53.

### 1.2 WebView: webview_flutter frente a flutter_inappwebview
| | **webview_flutter** (oficial, equipo de Flutter) | flutter_inappwebview |
|---|---|---|
| Versión | 4.14.1 (7-jul-2026); `webview_flutter_android` 4.14.1 (28-ago-2026, exige Flutter ≥3.44.0) | **6.1.5 estable del 8-oct-2024**; 6.2.0-beta.3 del 4-feb-2026; último push al repo el 10-feb-2026; 233 issues abiertos |
| Compatibilidad con Flutter 3.44 | Declarada (sdk ^3.12, Flutter ≥3.44) | El estable declara Flutter ≥3.24, pero lleva 2 años sin versión estable. Sin prueba propia con 3.44 + AGP actual: **riesgo** |
| Puente JS ⇄ Dart | `addJavaScriptChannel` (solo texto) + `runJavaScript` | `addJavaScriptHandler` con promesas, más cómodo |
| Inyectar JS al inicio del documento | **No tiene API** | `initialUserScripts` en `AT_DOCUMENT_START` |
| Cámara y micrófono | `AndroidWebViewController.setOnPlatformPermissionRequest` | `onPermissionRequest` |
| GPS | `setGeolocationPermissionsPromptCallbacks` + `setGeolocationEnabled` | `onGeolocationPermissionsShowPrompt` |
| Servidor localhost propio | No; se usa `shelf` (1.4.3) | `InAppLocalhostServer` |
| Service worker | El del sistema (Android System WebView) | Igual, más `ServiceWorkerController` |

**Elegimos webview_flutter.** Está mantenido y es compatible con nuestro Flutter. Sus dos huecos se resuelven así:
- **Inyectar el shim:** el servidor local agrega `<script src="/__nativo/fray.js"></script>` a `index.html` **al servirlo**. El
  `index.html` del repo no se toca.
- **Promesas:** el shim guarda un mapa `id → resolver` y Dart responde con `runJavaScript('window.__frayNativoResolver(…)')`.

flutter_inappwebview queda como plan B si algo de webview_flutter no funciona en el teléfono.

### 1.3 Servir la PWA sin red desde el primer arranque
| Opción | Primer arranque sin red | Origen seguro (SW, cámara, GPS) | Problemas |
|---|---|---|---|
| **A. Servidor local** `http://127.0.0.1:8787` (shelf) sirviendo los assets empaquetados | **Sí** | **Sí**: Chromium trata `localhost`/`127.0.0.1` como contexto seguro | Hay que permitir *cleartext* solo para 127.0.0.1 (`network_security_config.xml`). El **puerto es parte del origen**: si cambia, se pierden IndexedDB (álbum) y el SW. Se usa un puerto fijo; si está ocupado, se muestra error, sin saltar a otro puerto |
| B. Cargar `https://…netlify.app` y depender del service worker | **No**: la primera vez necesita señal y ~95 MB | Sí | El APK no funciona si se instala sin red. El SW del WebView puede borrarse si Android limpia la caché |
| C. `file:///android_asset/…` (`loadFlutterAsset`) | Sí | **No**: origen `null`, sin SW, sin módulos ES por CORS y sin cámara | Descartada |
| D. `WebViewAssetLoader` (`https://appassets.androidplatform.net`) | Sí | Sí | Las peticiones del SW no pasan por el interceptor sin `ServiceWorkerController`, y webview_flutter no lo expone |

**Elegimos A.**
- Detalles del servidor:
  - Lee de `rootBundle` (assets de Flutter) archivo por archivo. Las partes de los modelos pesan 8 MB, así que no se carga todo
    en memoria.
  - Pone el MIME correcto: `text/javascript` para `.js`/`.mjs` (los módulos ES lo exigen), `application/wasm`, `application/json`
    y `application/octet-stream`.
  - Envía `Cache-Control: no-cache` para `sw.js` e `index.html`, como `_headers`.
  - Escucha **solo en 127.0.0.1**, nunca en 0.0.0.0.
- Los assets se copian de la raíz del repo a `nativo/assets/pwa/` con un script (lista = `APP` de `sw.js` + `models/partes/`),
  verificando cada parte contra el SHA-256 de `models/partes.json`.
- El WebView **solo navega a `http://127.0.0.1:8787`**. Cualquier otro destino se bloquea o se abre fuera, con
  `NavigationDelegate`. Así ninguna página externa puede usar el canal del puente.

### 1.4 Riesgos de la PWA dentro del WebView
| Riesgo | Qué pasa | Mitigación |
|---|---|---|
| Service worker | Android System WebView lo soporta. En 127.0.0.1 se registra y vuelve a guardar ~95 MB en Cache Storage (doble almacenamiento) | Aceptable para el jueves. Después, R2 puede no registrar el SW cuando `window.FrayNativo` existe. `motor-worker.js` ya arma los modelos desde `models/partes/` si no están unidos en caché |
| Módulos ES y workers | Funcionan si el MIME es correcto | El servidor pone el MIME (§1.3) |
| IndexedDB (álbum) | Funciona, **atado al origen 127.0.0.1:8787** | Puerto fijo. El álbum del navegador **no** pasa al APK: son orígenes distintos. Decirlo en la demo |
| WASM de ONNX Runtime | WebView ≥91 tiene WASM SIMD. La app ya usa `numThreads = 1` sin COOP/COEP | Ninguna; verificar que Fray cargue e5 en el WebView |
| Cámara (Lente, foto de grupo) | `getUserMedia` exige permiso de Android (`CAMERA`) y conceder `onPermissionRequest` | Pedir permiso con `permission_handler` antes de concederlo al WebView, y solo para el origen 127.0.0.1 |
| GPS (geocercas) | `ACCESS_FINE_LOCATION` + callback de geolocalización del WebView | Igual |
| Micrófono | `RECORD_AUDIO` + `onPermissionRequest`. **La API de reconocimiento de voz del navegador no existe en Android WebView** | El dictado queda fuera de alcance; la PWA ya cae a escribir |
| Voz (speechSynthesis), vibración, `navigator.share` | En WebView pueden no existir o fallar en silencio (vibrar requiere el permiso `VIBRATE`) | Verificar en el teléfono; la PWA ya envuelve todo en try/catch |
| Memoria | WebView + ONNX (e5, ~66 MB) + LLM (0,5-1,5 GB) en el mismo proceso | Umbral de RAM (§6). Si Android avisa memoria baja, se descarga el LLM primero |

## 2. Contrato del puente
```js
window.FrayNativo = {
  version: 1,
  estado(): Promise<{ listo: boolean, modelo: string, motor: 'llama.cpp'|'litert-lm', backend: 'cpu'|'gpu', cargaMs?: number }>,
  generar(p: { id: string, pregunta: string, idioma: 'es'|'en', fichaId: string, contexto: string, maxTokens?: number /*60*/, timeoutMs?: number /*4000*/ }):
    Promise<{ id: string, texto: string, ok: boolean /*pasó el verificador*/, fallas: string[], primeraPalabraMs: number, totalMs: number, tokens: number, cortado: boolean /*timeout o límite*/, rechazado?: 'critica' }>,
  cancelar(id: string): void
}
// Streaming: window.dispatchEvent(new CustomEvent('fray-nativo', { detail: { id, trozo } }))
// El lado nativo rechaza (rechazado:'critica', sin llamar al modelo) si fichaId ∈ {emergencia, mal_altura, comer_plantas, volcan_estado, servicios} o la ficha es de abstención.
// Si ok=false, cortado=true o hay error, la PWA deja la frase oficial. La PWA usa el puente solo si window.FrayNativo existe.
```
Detalles de implementación que no cambian el contrato:
- **Transporte:** el shim manda `FrayNativoCanal.postMessage(JSON.stringify({ op, id, … }))` y Dart responde con
  `runJavaScript`. Una sola generación a la vez: si llega otra, la anterior se cancela.
- **Para qué sirve el streaming:** para que el verificador revise mientras el modelo escribe y para medir la primera palabra.
  Si un trozo trae una palabra prohibida o una cifra que no está en la fuente, se corta ahí. **La PWA no muestra el texto en
  streaming como respuesta**: solo muestra un indicador («Fray está redactando…»). El texto aparece cuando llega `ok: true`.
  Nunca se ve un texto sin verificar.
- `contexto` es el texto oficial que se reescribe (§4). Debe ser un texto de `chat.json`, nunca algo que escribió el usuario.

## 3. Flujo de una pregunta
1. `chat.preguntar()` elige la ficha, como hoy. El carril crítico de `js/chat.js` se aplica primero y prevalece.
2. La PWA muestra **al instante** la respuesta oficial (frase extractiva o ficha) con su fuente. Esto no cambia.
3. Solo se llama al puente si se cumple todo esto:
   - `window.FrayNativo` existe;
   - `estado().listo` es verdadero;
   - `tipo === 'respuesta'` y no `urgente`;
   - la ficha no es crítica, ni de abstención, ni dinámica (`mi_*`);
   - y la preferencia «Respuestas conversacionales» está activa.

   En ese caso llama a `generar({ contexto: frase oficial, … })`.
4. Del lado nativo, en orden:
   1. Carril crítico: si aplica, responde `rechazado: 'critica'` sin tocar el modelo.
   2. Generación en streaming, con corte en la segunda frase, en `maxTokens` o en `timeoutMs`.
   3. Verificador, que llena `ok` y `fallas`.
5. **La PWA vuelve a verificar** con su copia del verificador: defensa en dos capas.
   - Si `ok` y su verificación pasan, y no hubo `cortado`, reemplaza el texto principal por la reescritura. «Ver ficha oficial» y
     la fuente quedan siempre debajo.
   - En cualquier otro caso, queda la oficial **sin mensaje de error**: el visitante ya tenía su respuesta.

## 4. Control de latencia
| Medida | Cómo | Por qué |
|---|---|---|
| Respuesta corta | `maxTokens: 60` y **corte al cerrar la segunda frase** (Dart cuenta `.`, `!` y `?` en el streaming y cancela) | A ~12 t/s, 40 tokens ≈ 3,3 s |
| Tiempo máximo | `timeoutMs: 4000`. Al vencer: `cancelar` y `cortado: true` | Si tarda más de 4 s, la oficial ya basta |
| Modelo precargado | Se carga al abrir la app, en segundo plano, después de que la PWA esté visible. `cargaMs` se informa en `estado()` | La carga (mmap + inicialización) no cae en la primera pregunta |
| Prefijo del sistema en caché | Se procesa una vez el prompt del sistema (~120-150 tokens) y se **guarda el estado KV** (llamadart: guardar y restaurar estado). Cada pregunta parte de ese estado | Ahorra ~1,2-1,5 s de prefill por pregunta en el Redmi. Con LiteRT-LM hay que verificar si su API reutiliza el prefijo; si no, se paga entero |
| Streaming | §2 | Verificación temprana y medida de la primera palabra |
| Gramática | Con llama.cpp, una **GBNF generada por pregunta**: texto sin dígitos + solo las cifras literales de la ficha (`"8:00" \| "2:00" \| "1:30" …`) | Hace imposible inventar una cifra. Puede bajar algo el decode: **medirlo**. Con LiteRT-LM no hay GBNF libre: queda solo el verificador |
| Hilos | `numberOfThreads: 4` (4 núcleos A78 del D7400) | En el Redmi, 4 hilos rindió igual o más que 6 (investigación §4) |
| Contexto mínimo | Ver tabla siguiente | El prefill es lo que más pesa en la primera palabra |

**Costo del contexto.** Tiempo hasta la primera palabra ≈ tokens nuevos ÷ prefill t/s. En el Redmi, un modelo de 0,8-1,2B en
Q4 en CPU tiene un prefill de ~80-106 t/s (medido por terceros). Las fichas de `chat.json` tienen una mediana de 167 caracteres
(máximo 385), unos 45-110 tokens (estimado: ~3,5-4 caracteres por token en español).
| Contexto que se envía | Tokens nuevos (con el sistema en caché) | Primera palabra estimada (~100 t/s) | Riesgo |
|---|---|---|---|
| **Frase oficial** (extractiva) + pregunta | ~40-70 | **~0,4-0,7 s** | Menos material: puede repetir la frase casi igual |
| **Ficha completa** + pregunta | ~70-130 | **~0,7-1,3 s** | **Recomendado**: cabe holgado en ≤2 s |
| Top-3 fichas + pregunta | ~180-360 | ~1,8-3,6 s | Se pasa de 2 s y mezcla fichas: más riesgo de cifras mal ubicadas. **Descartado** |
| Cualquiera, sin caché del sistema | +120-150 | +1,2-1,5 s | Solo como respaldo si falla la caché KV |

## 5. Carril crítico: excluido en ambos lados
- **En la PWA (`js/chat.js`):** no llama al puente si la ficha es `emergencia`, `mal_altura`, `comer_plantas`, `volcan_estado` o
  `servicios`, si es de abstención, si es dinámica (`mi_*`) o si la pregunta es `urgente`. Hoy `servicios` es la única ficha con
  `abstencion: true`.
- **En el lado nativo:** misma lista fija, más la lectura de `abstencion` y `dinamica` desde `chat.json` (el que sirve el propio
  APK). Responde `rechazado: 'critica'` **sin llamar al modelo**.
- **El verificador** bloquea siempre: «comestible», «se puede comer», «venenoso», «tóxico», «alerta/nivel amarillo, naranja, rojo o
  verde»; responder con pregunta; «no puedo responder». Hoy esa lista solo está en español (laboratorio/slm.html): **hay que
  agregar los equivalentes en inglés** (edible, poisonous, toxic, alert level…) antes de habilitar `idioma: 'en'`.
- La lógica del verificador queda en **tres copias** (laboratorio/slm.html, js/chat.js de R2 y Dart). Propuesta: un archivo de
  casos compartido (`pruebas/verificador_casos.json`, que **no** es un banco ciego) que las tres deben pasar.
- La puerta de seguridad de `evaluar.py` no cambia, porque el carril crítico no pasa por el LLM. Debe seguir al 100 %.

## 6. Gestión del modelo
- **El modelo no va dentro del APK.** Un APK de más de 1 GB tarda en compilarse, instalarse y subirse a un Release.
- **Descarga única, con wifi y por decisión del usuario** («Respuestas conversacionales, +X MB»):
  - viene de un Release del repo o de la URL de Hugging Face del modelo;
  - lleva **SHA-256 fijo** en `nativo/modelos.json`, junto a nombre, bytes, licencia y fuente. No va en `models/`, que está
    congelado y es de la PWA;
  - se descarga en partes y se reanuda si se corta;
  - el archivo solo queda activo si el hash coincide; si no coincide, se borra.
- **Para la demo:** `adb push modelo.gguf /sdcard/Android/data/<paquete>/files/modelos/`. La app verifica el SHA-256 al arrancar.
- **Almacenamiento:** directorio privado de la app (`getApplicationSupportDirectory` o el externo propio de la app). No necesita
  permiso de almacenamiento.
- **RAM:** como regla práctica, la memoria pico es el archivo más ~30-50 % (KV, buffers). Por ejemplo, Qwen3.5-0.8B Q4_K_M
  (~0,5 GB) usaría ~0,8 GB y un 1,5B Q4_K_M (~1 GB) ~1,5 GB. **Son estimaciones: medir la memoria pico con PocketPal.**
  - **Mínimo para activar el modo:** RAM total ≥6 GB y memoria disponible ≥2× el archivo (`ActivityManager.MemoryInfo`, por un
    MethodChannel).
  - **Si no cabe:** `estado()` responde `listo: false`, la PWA sigue en modo Básico y la opción se muestra como «no disponible en
    este teléfono».
  - Si Android avisa memoria baja (`onTrimMemory`), se libera el modelo.

## 7. Energía y calor
- **Hilos:** 4, nunca todos los núcleos.
- **Solo se genera ante una pregunta del visitante.** Nada en segundo plano, ni precálculo de respuestas, ni generación en lote.
- **Nunca generar mientras se camina** (regla de AGENTS.md): el chat se usa en las paradas. Si la PWA sabe que el visitante va
  caminando (modo recorrido activo y en movimiento), no llama al puente. Al caminar, solo vibra y guarda.
- **Freno térmico:**
  - Si `PowerManager.getCurrentThermalStatus()` (API 29+) es MODERATE o más, o el ahorro de batería está activo, `estado()`
    responde `listo: false` y queda la oficial.
  - Si la batería está por debajo de 20 %, igual.
- **Liberar el modelo** si pasan 10 min sin preguntas. Precargarlo de nuevo al volver a abrir el chat.

## Criterios de aceptación
Medidos en el **Redmi Note 15 Pro 5G**, en modo avión, con el teléfono frío y más de 50 % de batería, con el modelo elegido:
- **Cuando** se pregunte cualquiera de las 5 preguntas de laboratorio/prueba-llm-nativo.md, **entonces** el decode es
  **≥10 t/s**, la primera palabra llega en **≤2 s** desde `generar` y la respuesta de 1-2 frases termina en **≤4 s**
  (`primeraPalabraMs` y `totalMs`).
- **Cuando** se juzguen esas 5 respuestas, **entonces** al menos **4 de 5** son correctas (juicio de R1), y la trampa
  («¿hay restaurante en Brisas?») responde «No tengo esa información oficial…» o queda la frase oficial.
- **Cuando** se hagan 10 preguntas seguidas, **entonces** la interfaz no se traba (la PWA sigue respondiendo a toques mientras
  genera), el decode de la última no baja más de 30 % frente a la primera y el teléfono no se siente caliente al tacto (anotar
  el estado térmico de Android si está disponible).
- **Cuando** la ficha sea `emergencia`, `mal_altura`, `comer_plantas`, `volcan_estado` o `servicios`, de abstención, dinámica o
  la pregunta sea urgente, **entonces** no se llama al modelo: la PWA no llama al puente y, si se llamara, el nativo responde
  `rechazado: 'critica'`.
- **Cuando** la reescritura tenga una cifra, cifra+unidad o nombre propio que no esté en la ficha, una palabra prohibida, una
  pregunta o una evasiva, **entonces** `ok: false` y se ve la frase oficial.
- **Cuando** pasen `timeoutMs` sin terminar, **entonces** `cortado: true` y se ve la frase oficial.
- **Cuando** se abra la app por primera vez **sin red** (instalada desde el APK), **entonces** la PWA carga, Fray responde en
  modo Básico, y la Lente y el mapa piden permiso y funcionan.
- **Cuando** se corra `python herramientas/evaluar.py`, **entonces** la puerta de seguridad da **100 %**.
- **Cuando** la PWA se abra en un navegador (sin `window.FrayNativo`), **entonces** se comporta exactamente como hoy.

## Contrato
El puente `window.FrayNativo` versión 1 (§2). No cambia ningún JSON del Paquete Páramo. Nuevo archivo `nativo/modelos.json`
(modelo, bytes, SHA-256, licencia, fuente), que es de R3.

## Verificación
- Tabla de laboratorio/prueba-llm-nativo.md llenada con la app nativa, en el issue #24.
- `python -X utf8 herramientas/validar_contratos.py`, `python -X utf8 herramientas/verificar_modelos.py`,
  `python herramientas/evaluar.py` (seguridad al 100 %) y `python -X utf8 herramientas/version_sw.py --check`, en CI.
- Casos del verificador (`pruebas/verificador_casos.json`) en Dart (`flutter test`) y en JS.
- Demo en modo avión.

## 9. Qué cambia R2 en js/chat.js (solo descrito; lo programa R2)
1. Una función `reescribirNativo(r, pregunta, idioma)` que se llama **después** de pintar la respuesta oficial, solo si se
   cumplen las condiciones de §3. Usa `crypto.randomUUID()` como `id`.
2. Un listener de `fray-nativo` que solo actualiza el indicador «Fray está redactando…». No pinta el texto.
3. Al resolver `generar`:
   - si `ok && !cortado && !rechazado` y su propio `verificar()` pasa, reemplaza el texto principal de la tarjeta y deja la
     oficial en «Ver ficha oficial»;
   - si no, quita el indicador y no hace nada más.
4. Si el visitante escribe otra pregunta o cierra el chat, llama a `cancelar(id)`.
5. La copia del verificador, con la lista de prohibidos en español e inglés, y el archivo de casos compartido.
6. Una preferencia en Ajustes: «Respuestas conversacionales (beta)». Solo aparece si `window.FrayNativo` existe. Necesita claves
   i18n en es y en.
7. `window.__ultimoChat` registra `nativo: { ok, fallas, primeraPalabraMs, totalMs, tokens, cortado }`, para medir.
8. Opcional, después del jueves: no registrar el service worker cuando `window.FrayNativo` existe.

Nada de esto toca el carril crítico ni `herramientas/tema_chat.py`, porque la búsqueda no cambia.

## 10. Compilar e instalar
```bash
# En el PC (Flutter 3.44.7, Android SDK, JDK 17). La primera compilación necesita red: baja los binarios de llamadart.
cd nativo
flutter pub get
python ../herramientas/copiar_pwa.py      # por escribir: copia la PWA a nativo/assets/pwa/ y verifica los SHA-256
flutter build apk --release --target-platform android-arm64
adb install -r build/app/outputs/flutter-apk/app-release.apk
# Modelo para la demo (sin descargarlo desde la app):
adb push Qwen3.5-0.8B-Q4_K_M.gguf /sdcard/Android/data/<paquete>/files/modelos/
```
- La plantilla de `flutter create` firma el `release` con la llave de *debug*. El APK se instala con «orígenes desconocidos», y
  basta para la demo. Para distribuirlo de verdad hay que crear un keystore propio, y **nunca subirlo al repo**: el repo es público.
- **Compilar en la nube (el repo es público):** un workflow `.github/workflows/apk.yml` con `actions/checkout`,
  `actions/setup-java` (17), `subosito/flutter-action` (canal stable, versión 3.44.7), `flutter build apk --release
  --target-platform android-arm64` y `actions/upload-artifact`. Los runners estándar de GitHub son **gratis en repos públicos**
  (https://docs.github.com/en/billing/concepts/product-billing/github-actions). El APK se baja del artefacto del run o de un
  Release. Si se agrega un keystore, va en *secrets* del repo.

## 11. iPhone: qué falta y cuánto cuesta
Para el jueves, **el iPhone usa la PWA en modo Básico**. La versión nativa de iOS exige:
| Requisito | Detalle | Costo | Fuente |
|---|---|---|---|
| Apple Developer Program | Necesario para firmar con distribución ad hoc o TestFlight, y para el App Store | **99 USD/año** | https://developer.apple.com/programs/ |
| Sin pagar: «Personal Team» | Con una cuenta Apple gratis, Xcode instala en **tus propios** dispositivos: máximo 3 dispositivos y 10 App IDs, y los perfiles **vencen a los 7 días** (hay que recompilar y reinstalar) | 0 USD, pero exige una Mac | https://developer.apple.com/support/compare-memberships/ |
| Mac con Xcode | Flutter: «Xcode is required to build and release your app. You must use a device running macOS» | Una Mac prestada o propia | https://docs.flutter.dev/deployment/ios |
| …o un runner macOS en la nube | GitHub Actions: los runners estándar, incluido macOS, son gratis en repos públicos. Codemagic: 500 min/mes gratis en Mac mini M2, y luego 0,095 USD/min. La firma sigue exigiendo la cuenta de 99 USD | 0 USD con límites | docs.github.com (arriba) · https://codemagic.io/pricing/ |
| Ad hoc (instalar sin tienda) | Registrar el dispositivo de cada teléfono de prueba: hasta **100 iPhone por año de membresía** | Incluido en los 99 USD | https://developer.apple.com/help/account/devices/devices-overview/ |
| TestFlight | Hasta 100 probadores internos (del equipo) y 10.000 externos. **Los externos exigen la revisión beta de Apple** (Beta App Review) del primer build | Incluido en los 99 USD | https://developer.apple.com/testflight/ |
| Motor en iOS | llamadart: iOS ≥16.4; LiteRT-LM en iOS solo se probó en dispositivo con iOS 18.3.2. Metal en el simulador da salida incorrecta | — | https://llamadart.leehack.com/docs/platforms/support-matrix |

**Conclusión:** el jueves el iPhone usa la PWA en modo Básico. **Se piden recursos para la versión nativa de iOS:**
- la cuenta Apple Developer (99 USD/año, a nombre del operador o de la universidad);
- acceso a una Mac, o el runner macOS de GitHub Actions, que es gratis porque el repo es público;
- una o dos semanas para firma, pruebas y revisión beta.

## Fuera de alcance
- iOS nativo.
- Dictado por voz dentro del WebView.
- Afinar (fine-tuning) el modelo.
- Publicar en Google Play.
- Generar texto para fichas críticas, dinámicas o de abstención.
- Traducir con el LLM.

## Notas
- **Riesgo principal:** la velocidad. Con lo publicado, solo un 0,8-1,2B en Q4 se acerca a ≤4 s en el Redmi, y su calidad en
  español no está probada (investigación §4). Si no cumple, el modo Pro se muestra solo en un teléfono de gama alta como
  «experimental», y la demo se apoya en la respuesta extractiva.
- **Licencias de los candidatos** (HF, 25-nov-2026):
  - Apache-2.0: Qwen2.5, Qwen3, Qwen3.5, Gemma 4 E2B y Granite-4.0-1B.
  - LFM2.5 usa la licencia propia «lfm1.0» (`license:other`): revisarla antes de usarlo, porque UTON es un operador comercial.
  - Gemma 3 usa los Gemma Terms (ver docs/licencias.md).
- Preguntas abiertas:
  1. ¿LiteRT-LM en la GPU Mali-G615 MC2 gana algo frente a la CPU? No hay datos.
  2. ¿La GBNF baja el decode lo suficiente como para no usarla?
  3. ¿Se dobla el almacenamiento con el SW en el WebView, o R2 lo desactiva en modo nativo?
