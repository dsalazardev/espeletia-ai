# Plataforma para la app nativa con LLM: comparación para nuestro caso

Consultado el **25-nov-2026** (npm, pub.dev, GitHub y documentación oficial). Acompaña a la spec
[fray-nativo](../specs/2026-11-25-fray-nativo.md) y a la decisión apk-android-llm-nativo.

## Nuestro caso
- La **PWA vanilla JS ya está hecha**, y su diseño sirve igual en Android e iPhone. No queremos reescribir la interfaz: la app
  nativa la muestra en un WebView y solo agrega el LLM por un puente (`window.FrayNativo`).
- El equipo **conoce Flutter**. Nadie ha usado Expo.
- **El código lo escribe un agente**, así que pesan más la documentación, la API estable y los errores claros que la familiaridad.
- Android ahora (Redmi Note 15 Pro 5G: Dimensity 7400, **GPU Mali**) e iOS después.

## Las cuatro opciones
| | **Flutter + llamadart** | Expo / React Native + llama.rn | Capacitor + llama-cpp-capacitor | Kotlin + LiteRT-LM |
|---|---|---|---|---|
| Versión / fecha | llamadart **0.21.0**, 25-nov-2026 | llama.rn **0.13.0-rc.12**, 17-nov-2026 (la etiqueta `latest` de npm es una *release candidate*) | llama-cpp-capacitor **0.1.5**, publicado en npm el **18-feb-2026** (el repo arusatech/llama-cpp tuvo su último push el 27-jul-2026) | LiteRT-LM **v0.20.0**, 23-nov-2026 |
| Licencia | MIT | MIT | MIT | Apache-2.0 |
| Señales de mantenimiento | 82.743 descargas en 30 días, 160/160 en pub.dev, 92 estrellas, un mantenedor con versiones casi diarias | 1.076 estrellas; activo (push el 25-nov) | **7 estrellas**; exige Capacitor ≥8 | Google; 6.936 estrellas |
| Motores | llama.cpp (GGUF) **y** LiteRT-LM (`.litertlm`) | llama.cpp (GGUF) | llama.cpp (GGUF) | LiteRT-LM (`.litertlm`) |
| GPU en nuestro Redmi (Mali) | llama.cpp: CPU (OpenCL solo Adreno; Vulkan experimental). **LiteRT-LM: GPU por OpenCL**, sin garantía | **CPU**: GPU por OpenCL «probada en Adreno 700+», NPU Hexagon en Snapdragon 8 Gen 1+ | CPU (llama.cpp, mismas limitaciones) | **GPU por OpenCL** (ML Drift), sin garantía en Mali |
| Gramáticas / salida estructurada | GBNF (llama.cpp), JSON Schema (LiteRT-LM, Qwen3 y Gemma 4) | GBNF y JSON Schema | Según el README de llama.cpp; sin verificar en el plugin | JSON Schema / *constrained decoding* (sin verificar para GBNF libre) |
| Cómo se reutiliza la PWA | WebView (`webview_flutter`) + servidor localhost + `JavaScriptChannel` | `react-native-webview` + `postMessage`; la interfaz RN no se usa | **Nativo de Capacitor**: la PWA *es* la app, y el plugin se llama desde JS sin puente propio | WebView de Android + `addJavascriptInterface` |
| iOS después | Mismo código (llamadart soporta iOS ≥16.4). Exige Mac o runner macOS + cuenta Apple | **EAS Build compila iOS en la nube de Expo, sin Mac propia** (sigue exigiendo la cuenta Apple para firmar) | Mismo código; exige Mac o runner macOS + cuenta Apple | **Kotlin no sirve en iOS.** El binding Swift de LiteRT-LM está en vista previa: sería una segunda app |
| Encaje con el equipo y el agente | El equipo conoce Flutter. Dart tipado y API documentada en llamadart.leehack.com | Nadie conoce Expo. Exige la New Architecture de RN (llama.rn ≥0.10) | Encaja muy bien con la PWA, pero el plugin es poco usado y está atrasado | Kotlin puro: lo más directo con LiteRT-LM, pero solo Android y solo `.litertlm` |

Otros hechos verificados hoy:
- **LiteRT-LM** no tiene binding oficial de React Native. Existe uno comunitario, `react-native-litert-lm` 0.8.2 (3-nov-2026,
  MIT, 65 estrellas; github.com/hung-yueh/react-native-litert-lm).
- **react-native-executorch:** 0.11.1 (19-nov-2026, MIT).
- **MLC-LLM:** el repo sigue activo (push el 21-nov-2026), pero su único *release* en GitHub es `v0.1.dev0` (2023). No hay
  paquetes versionados para móvil.
- **flutter_gemma** pasó a `flutter_edge_ai`:
  - versión 2.7.2 (24-nov-2026), MIT, 671 estrellas, en DenisovAV/flutter_edge_ai;
  - exige Flutter ≥3.44;
  - según el README de llamadart, su conector «Flutter Edge AI» fija su propia versión de llamadart.
- **flutter_inappwebview:** el último estable, 6.1.5, es del 8-oct-2024, y la 6.2.0-beta.3 del 4-feb-2026. Por eso la spec usa
  `webview_flutter` 4.14.1.

### Correcciones a lo que se sabía
- **llama-cpp-capacitor 0.1.5** se publicó en npm el **18-feb-2026**, no en julio. En julio de 2026 hubo actividad en su repo,
  pero no una versión nueva en npm.

## Fuentes (25-nov-2026)
- llamadart: https://pub.dev/packages/llamadart · https://github.com/leehack/llamadart · https://llamadart.leehack.com/docs/platforms/support-matrix
- llama.rn: https://www.npmjs.com/package/llama.rn · https://github.com/mybigday/llama.rn (README: New Architecture, OpenCL Adreno
  700+, Hexagon SM8450+)
- llama-cpp-capacitor: https://www.npmjs.com/package/llama-cpp-capacitor · https://github.com/arusatech/llama-cpp
- LiteRT-LM: https://github.com/google-ai-edge/LiteRT-LM/releases · react-native-litert-lm: https://www.npmjs.com/package/react-native-litert-lm
- react-native-executorch: https://www.npmjs.com/package/react-native-executorch · MLC-LLM: https://github.com/mlc-ai/mlc-llm/releases
- flutter_edge_ai: https://pub.dev/packages/flutter_edge_ai · https://github.com/DenisovAV/flutter_edge_ai
- Expo EAS Build («iOS builds run on macOS runners hosted in Expo's macOS cloud»): https://docs.expo.dev/build/introduction/
- Flutter iOS («Xcode is required… a device running macOS»): https://docs.flutter.dev/deployment/ios
- webview_flutter: https://pub.dev/packages/webview_flutter · flutter_inappwebview: https://pub.dev/packages/flutter_inappwebview

## Recomendación
**Flutter + llamadart, con la PWA en un WebView** (lo que se decidió hoy). Las razones, en orden:
1. **Es la única opción con los dos motores.** En el Redmi (Mali), llama.cpp corre en CPU y LiteRT-LM puede usar la GPU. Con
   llamadart se prueban los dos sin cambiar de plataforma: basta cambiar el archivo del modelo. Las otras dejan solo uno.
2. **El equipo conoce Flutter.** Si el agente se traba, una persona puede leer y arreglar el código.
3. **Paquete vivo y bien puntuado:** 0.21.0 de hoy, 82 mil descargas en 30 días y API documentada con streaming, cancelación,
   GBNF y estado KV.
4. **iOS después con el mismo código**, cuando haya cuenta Apple y una Mac o un runner macOS.

**Cuándo convendría otra:**
- **Capacitor** sería lo más natural para una PWA (no hay que escribir puente), pero su plugin de llama.cpp tiene 7 estrellas
  y una versión de febrero: demasiado riesgo para mañana.
- **Expo** gana en un punto: compila iOS sin Mac. Pero nadie lo conoce, y en el Redmi también correría en CPU.
- **Kotlin + LiteRT-LM** es el camino más corto si solo importara Android y Gemma 4 / Qwen3 en `.litertlm`, pero cierra la
  puerta a iOS y a GGUF.

**Riesgos de la recomendación:**
| Riesgo | Mitigación |
|---|---|
| llamadart depende de **un mantenedor** y cambia a diario | Fijar `0.21.0` exacto y `pubspec.lock` en git; no actualizar antes de la demo |
| El *build hook* baja binarios de GitHub al compilar | Compilar con red, o en GitHub Actions; guardar el APK en un Release |
| El WebView difiere de Chrome (SW, permisos, API de voz) | Servidor localhost (origen seguro y fijo), permisos explícitos y prueba en el teléfono (spec §1.4) |
| La GPU Mali-G615 MC2 no tiene ninguna medición publicada | Medir con AI Edge Gallery. Si no gana, CPU con 4 hilos |
| La velocidad en CPU queda justa (~12 t/s con 0,8-1,2B) | Respuestas cortas, prefijo en caché, timeout de 4 s y la oficial siempre visible primero |
| iOS exige 99 USD/año + Mac o runner macOS | Pedirlo como recurso. El jueves, iPhone con la PWA en modo Básico |
