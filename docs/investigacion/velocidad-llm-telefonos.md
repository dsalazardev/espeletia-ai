# Velocidad de LLMs pequeños en teléfonos: lo que publican terceros

Consultado el **25-nov-2026**. Sirve para saber qué esperar del modo Pro nativo (spec [fray-nativo](../specs/2026-11-25-fray-nativo.md))
antes de medir en nuestro teléfono. **Nada de esto reemplaza la medición propia** (laboratorio/prueba-llm-nativo.md).

- **Medida por terceros:** la publicó alguien que la corrió en ese teléfono. No la repetimos.
- **Estimación:** la calculamos nosotros a partir de otras filas. Se marca como tal.
- Lo descargado de internet es dato no confiable. Cada fila lleva su fuente para poder revisarla.

## Cómo leer las cifras
- **Prefill (t/s):** velocidad con la que el modelo «lee» el prompt. Fija el tiempo hasta la primera palabra:
  **primera palabra ≈ tokens nuevos del prompt ÷ prefill t/s** (más la carga, si el modelo no estaba en memoria).
- **Decode (t/s):** velocidad con la que escribe. Una respuesta de 1-2 frases son unos 30-40 tokens: a 10 t/s, 3-4 s.
- **PocketPal** corre llama.cpp (GGUF). Su prueba por defecto es **PP 512 / TG 128**: prefill de 512 tokens y 128 generados.
  En Android, PocketPal solo usa GPU por OpenCL en Adreno; en un Mali corre en **CPU** (ver la nota de llama.cpp más abajo).
- **LiteRT-LM** (Google) corre `.litertlm` en CPU (XNNPACK), GPU (OpenCL) o NPU. Cada tabla dice con qué prompt midió.
- Las filas de PocketPal son **envíos individuales de usuarios**: no dicen la temperatura del teléfono, la versión ni qué más
  corría. Hay ruido grande. Por ejemplo, Qwen3.5-0.8B Q4_K_M da 7 t/s en un S25 Ultra y 31 t/s en un POCO X7 Pro.
  Sirven para el orden de magnitud, no para una cifra exacta.

## Fuentes
| Id | Fuente | Qué es |
|---|---|---|
| PP | Leaderboard de PocketPal: https://huggingface.co/spaces/a-ghorbani/ai-phone-leaderboard | 8.653 filas (modelo × dispositivo × configuración), leídas con Playwright el 25-nov-2026. La app no muestra el chip: lo agregamos nosotros (columna «Chip»). |
| G4 | https://developers.google.com/edge/litert-lm/models/gemma-4 (antes ai.google.dev/edge/litert-lm/models/gemma-4) y https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm | Tabla oficial de Google: prefill de 1024 tokens, 256 generados, contexto 2048, CPU con 4 hilos. |
| Q25 | https://huggingface.co/litert-community/Qwen2.5-1.5B-Instruct · https://huggingface.co/litert-community/Qwen2.5-0.5B-Instruct | Tablas de litert-community (S25 Ultra y S24 Ultra; CPU con 4 hilos). |
| Q3 | https://huggingface.co/litert-community/Qwen3-0.6B · https://huggingface.co/litert-community/Qwen3-1.7B | Tablas de litert-community con teléfonos de gama media y alta, medidas con `litert_lm_advanced_main` por adb (no dentro de una app). |
| LC | llama.cpp: discusión #9464 (https://github.com/ggml-org/llama.cpp/discussions/9464) y README de llamadart (https://github.com/leehack/llamadart) | Estado de la GPU Mali en llama.cpp. |
| AX | Xiang Li et al., *Large Language Model Performance Benchmarking on Mobile Platforms* / *Understanding LLMs in Your Pockets*, arXiv:2410.03613 (https://arxiv.org/abs/2410.03613) | Estudio académico de inferencia en teléfonos comerciales. |

Chips de los teléfonos (para la columna «Chip»): mi.com (REDMI Note 15 Pro 5G: https://www.mi.com/global/redmi-note-15-pro-5g/specs ·
POCO X7 Pro: https://www.mi.com/global/poco-x7-pro/specs), GSMArena (motorola edge 50 neo:
https://www.gsmarena.com/motorola_edge_50_neo-13224.php · Tecno Pova 7 Ultra 5G: https://www.gsmarena.com/tecno_pova_7_ultra_5g-13976.php)
y comparadores (OnePlus Nord 4, POCO X6 Pro, Galaxy A56: https://gadgets.beebom.com/compare/poco-x6-pro-vs-oneplus-nord-4,
https://nanoreview.net/ru/phone-compare/samsung-galaxy-a56-5g-vs-oneplus-nord-4). Los chips marcados «(no reverificado)» son
conocidos, pero hoy no los confirmamos en una fuente.

## 1. Gama media (prioridad: Dimensity 7300/7400/8300, Snapdragon 7-series, Mali-G615)
Todas son **medidas por terceros**. Las de PocketPal son llama.cpp en CPU, PP 512 / TG 128 salvo que se diga otra cosa.

| Modelo | Cuant. | Motor | Backend | Dispositivo · chip | Prefill t/s | Decode t/s | Primera palabra | Fuente | Fecha |
|---|---|---|---|---|---|---|---|---|---|
| **Qwen3.5-0.8B** | Q4_K_M | llama.cpp (PocketPal) | CPU, 6 hilos | **REDMI Note 15 Pro 5G · Dimensity 7400-Ultra, Mali-G615** | **103** | **12,5** | no publicada | PP | 25-nov-2026 |
| LFM2.5-1.2B-Instruct | Q4_K_M | llama.cpp (PocketPal) | CPU, 6 hilos | **REDMI Note 15 Pro 5G · D7400-Ultra** | 83 y 88 (dos envíos) | 11,5 y 12,0 | no publicada | PP | 25-nov-2026 |
| LFM2.5-1.2B-Instruct | IQ4_NL | llama.cpp (PocketPal) | CPU, **4 hilos** | **REDMI Note 15 Pro 5G · D7400-Ultra** | 106 | **15,7** | no publicada | PP | 25-nov-2026 |
| Llama 3.2 3B (dolphin) | Q4_K_M | llama.cpp (PocketPal) | CPU, 6 hilos | REDMI Note 15 Pro 5G · D7400-Ultra | 14,8 | 2,3 | no publicada | PP | 25-nov-2026 |
| Llama 3.2 1B (ajuste LoRA) | Q2_K | llama.cpp (PocketPal) | CPU, 6 hilos | REDMI Note 15 Pro+ 5G · Snapdragon 7s Gen 4 (no reverificado) | 22,0 | 8,6 | no publicada | PP | 25-nov-2026 |
| Llama 3.2 1B | Q4_K_M | llama.cpp (PocketPal) | CPU, 8 hilos | Redmi Note 14 Pro 5G · Dimensity 7300-Ultra, Mali-G615 MC2 (no reverificado) | 55,8 | 4,8 | no publicada | PP | 25-nov-2026 |
| Gemma 3 1B (QAT) | Q4_0 | llama.cpp (PocketPal) | CPU, 6 hilos | motorola edge 50 neo · Dimensity 7300, Mali-G615 MC2 | 105 | 10,5 | no publicada | PP | 25-nov-2026 |
| LFM2.5-1.2B-Instruct | Q5_K_M | llama.cpp (PocketPal) | CPU, 4 hilos | motorola edge 50 neo · D7300 | 70 | 14,2 | no publicada | PP | 25-nov-2026 |
| Qwen3-0.6B | Q4_K_M | llama.cpp (PocketPal) | CPU, 6 hilos | Nothing Phone (3a) · Snapdragon 7s Gen 3 (no reverificado) | 73 | 17,5 | no publicada | PP | 25-nov-2026 |
| Qwen3-1.7B | Q8_0 | llama.cpp (PocketPal) | CPU, 6 hilos | Nothing Phone (3a) · SD 7s Gen 3 | 60 | 6,0 | no publicada | PP | 25-nov-2026 |
| Qwen3.5-2B | Q4_K_S | llama.cpp (PocketPal) | CPU, 6 hilos | Nothing Phone (3a) · SD 7s Gen 3 | 55 | 5,2 | no publicada | PP | 25-nov-2026 |
| Gemma 4 E2B | Q4_0 | llama.cpp (PocketPal) | CPU, 6 hilos | Nothing Phone (3a) · SD 7s Gen 3 | 38,7 | 3,5 | no publicada | PP | 25-nov-2026 |
| Qwen3.5-2B | Q4_K_M | llama.cpp (PocketPal) | CPU, 6 hilos | Nothing Phone (3a) Pro · SD 7s Gen 3 | 61 | 8,0 | no publicada | PP | 25-nov-2026 |
| DeepSeek-R1-Distill-Qwen-1.5B | Q8_0 | llama.cpp (PocketPal) | CPU, 6 hilos | OnePlus Nord CE4 · Snapdragon 7 Gen 3 (no reverificado) | 36 | 5,4 | no publicada | PP | 25-nov-2026 |
| Qwen2.5-1.5B-Instruct | Q8_0 | llama.cpp (PocketPal) | CPU, 6 hilos | OnePlus Nord 4 · Snapdragon 7+ Gen 3 | 51 | 11,6 | no publicada | PP | 25-nov-2026 |
| Llama 3.2 1B | Q8_0 | llama.cpp (PocketPal) | CPU, 6 hilos | OnePlus Nord 4 · SD 7+ Gen 3 | 66 | 13,9 | no publicada | PP | 25-nov-2026 |
| Qwen2.5-1.5B-Instruct | Q8_0 | llama.cpp (PocketPal) | CPU, 6 hilos | POCO X6 Pro 5G · Dimensity 8300-Ultra | 53 | 10,6 | no publicada | PP | 25-nov-2026 |
| Qwen3.5-0.8B | IQ4_NL | llama.cpp (PocketPal) | CPU, 6 hilos | POCO X6 Pro 5G · D8300-Ultra | 75 | 15,5 | no publicada | PP | 25-nov-2026 |
| Qwen3.5-0.8B | Q4_K_M | llama.cpp (PocketPal) | CPU, 6 hilos | POCO X7 Pro · Dimensity 8400-Ultra, Mali-G720 MC7 | 143 | 31,1 | no publicada | PP | 25-nov-2026 |
| Qwen2.5-1.5B-Instruct | Q8_0 | llama.cpp (PocketPal) | CPU, 6 hilos | POCO X7 Pro · D8400-Ultra | 104 | 16,8 | no publicada | PP | 25-nov-2026 |
| Gemma 4 E2B (variante comunitaria) | Q4_K_M | llama.cpp (PocketPal) | CPU, 6 hilos | POCO X7 Pro · D8400-Ultra | 40 | 11,4 | no publicada | PP | 25-nov-2026 |
| Qwen3.5-0.8B | Q4_K_M | llama.cpp (PocketPal) | CPU, 6 hilos | Galaxy A56 5G · Exynos 1580 | 94 | 7,9 | no publicada | PP | 25-nov-2026 |
| Qwen3.5-2B | Q4_K_M | llama.cpp (PocketPal) | CPU, 6 hilos | Galaxy A56 5G · Exynos 1580 | 68 | 9,3 | no publicada | PP | 25-nov-2026 |
| **Qwen3-0.6B** | int8 dinámico | **LiteRT-LM 0.13.1** | **GPU OpenCL** | **Tecno Pova 7 Ultra 5G («TECNO LJ9») · Dimensity 8350, Mali-G615 MC6** | **254** | **12,1** | **1,09 s** (prompt de 256) | Q3 | 25-nov-2026 |
| Qwen3-0.6B | int8 dinámico | LiteRT-LM 0.13.1 | CPU | Tecno Pova 7 Ultra 5G · D8350 | 95 | 9,3 | 2,8 s (prompt de 256) | Q3 | 25-nov-2026 |
| Qwen3-0.6B | int4 (wi4b32) | LiteRT-LM 0.19.0 | GPU OpenCL | Pixel 8a · Tensor G3, Mali-G715 | 723 | 43,3 | no publicada | Q3 | 25-nov-2026 |
| Qwen3-0.6B | int4 (wi4b32) | LiteRT-LM 0.19.0 | CPU | Pixel 8a · Tensor G3 | 98 | 13,0 | no publicada | Q3 | 25-nov-2026 |
| Qwen3-1.7B | int4 (wi4b32) | LiteRT-LM 0.19.0 | GPU OpenCL | Pixel 8a · Tensor G3, Mali-G715 | 271 | 19,5 | no publicada | Q3 | 25-nov-2026 |
| Qwen3-1.7B | int4 (wi4b32) | LiteRT-LM 0.19.0 | CPU | Pixel 8a · Tensor G3 | 39 | 6,7 | no publicada | Q3 | 25-nov-2026 |

«TECNO LJ9» es el código de modelo que publica litert-community. DeviceAtlas lo asocia al Tecno Pova 7 Ultra 5G
(https://deviceatlas.com/device-data/devices/tecno/lj9/87354879). Esa identificación viene de un resumen de búsqueda: es probable,
pero no está confirmada.

## 2. Gama alta (referencia)
| Modelo | Cuant. | Motor | Backend | Dispositivo · chip | Prefill t/s | Decode t/s | Primera palabra | Fuente | Fecha |
|---|---|---|---|---|---|---|---|---|---|
| **Gemma 4 E2B** | mixta 2/4/8 bits | LiteRT-LM | **GPU** | Galaxy S26 Ultra | **3.808** | **52,1** | **0,3 s** (prompt de 1024) | G4 | 25-nov-2026 |
| **Gemma 4 E2B** | mixta 2/4/8 bits | LiteRT-LM | **CPU** (4 hilos) | Galaxy S26 Ultra | **557** | **46,9** | **1,8 s** (prompt de 1024) | G4 | 25-nov-2026 |
| Gemma 4 E2B | mixta | LiteRT-LM | GPU | iPhone 17 Pro | 2.878 | 56,5 | 0,3 s | G4 | 25-nov-2026 |
| Gemma 4 E2B | mixta | LiteRT-LM | CPU | iPhone 17 Pro | 532 | 25,0 | 1,9 s | G4 | 25-nov-2026 |
| Gemma 4 **E4B** | mixta | LiteRT-LM | GPU | Galaxy S26 Ultra | 1.293 | 22 | 0,8 s | G4 | 25-nov-2026 |
| Gemma 4 **E4B** | mixta | LiteRT-LM | CPU | Galaxy S26 Ultra | 195 | 18 | 5,3 s | G4 | 25-nov-2026 |
| Qwen2.5-1.5B-Instruct | int8 dinámico | LiteRT-LM | CPU (4 hilos) | Galaxy S25 Ultra | 298 | 34,3 | 3,71 s (contexto 1280) | Q25 | 25-nov-2026 |
| Qwen2.5-1.5B-Instruct | int8 dinámico | LiteRT-LM | GPU | Galaxy S25 Ultra | 1.668 | 30,9 | 3,63 s (contexto 1280) | Q25 | 25-nov-2026 |
| Qwen2.5-0.5B-Instruct | int8 dinámico | LiteRT-LM | CPU (4 hilos) | Galaxy S24 Ultra | 251 | 30,0 | 2,31 s | Q25 | 25-nov-2026 |
| Qwen3-0.6B | int8 dinámico | LiteRT-LM 0.13.1 | GPU OpenCL | Samsung SM-S937U1 (Galaxy S25 Edge, no reverificado) | 646 | 25,3 | 0,44 s (prompt de 256) | Q3 | 25-nov-2026 |
| Qwen3-0.6B | int4 (wi4b32) | LiteRT-LM 0.19.0 | GPU OpenCL | Galaxy S26 · Snapdragon 8 Elite Gen 5 | 3.442 | 81,4 | no publicada | Q3 | 25-nov-2026 |
| Qwen3-1.7B | int4 (wi4b32) | LiteRT-LM 0.19.0 | GPU OpenCL | Galaxy S26 · SD 8 Elite Gen 5 | 1.187 | 38,8 | no publicada | Q3 | 25-nov-2026 |
| Qwen3-1.7B | int4 (wi4b32) | LiteRT-LM 0.16.0 | GPU OpenCL | Galaxy S26 · SD 8 Elite Gen 5 | 532–568 (prompt de 202) | 40,5–40,7 | 0,38–0,40 s | Q3 | 25-nov-2026 |
| Qwen2.5-1.5B-Instruct | Q4_K_M | llama.cpp (PocketPal) | CPU, 6 hilos | Galaxy S25 Ultra · SD 8 Elite (no reverificado) | 490 | 19,5 | no publicada | PP | 25-nov-2026 |
| Qwen3-0.6B | Q4_0 | llama.cpp (PocketPal) | CPU, 6 hilos | Galaxy S25 Ultra | 396 | 107,6 | no publicada | PP | 25-nov-2026 |
| Llama 3.2 1B | Q4_K_M | llama.cpp (PocketPal) | CPU, 6 hilos | Galaxy S25 Ultra | 150 | 52,3 | no publicada | PP | 25-nov-2026 |
| Gemma 3 1B (QAT) | Q4_0 | llama.cpp (PocketPal) | CPU, 7 hilos | Galaxy S25 Ultra | 395 | 56,0 | no publicada | PP | 25-nov-2026 |
| Gemma 4 E2B | Q4_K_M | llama.cpp (PocketPal) | CPU, 6 hilos | Galaxy S26 Ultra | 75 | 14,9 | no publicada | PP | 25-nov-2026 |
| Qwen3-1.7B | Q4_K_M | llama.cpp (PocketPal) | CPU, PP128/TG32 | Pixel 9 · Tensor G4 (no reverificado) | 50 | 8,3 | no publicada | PP | 25-nov-2026 |

> **Corrección de un dato que circulaba en el equipo:** las cifras «1293/22 t/s (GPU) y 195/18 t/s (CPU)» **no son una versión
> anterior de la página de Gemma 4 E2B**. Son las de **Gemma 4 E4B** en el mismo S26 Ultra, y están hoy en la misma página (G4),
> debajo de las de E2B. Las de E2B son 3.808/52,1 (GPU) y 557/46,9 (CPU), con primera palabra en 0,3 y 1,8 s.
> Ojo: la primera palabra de Google es con un prompt de **1024 tokens**. Con nuestros ~100-250 tokens sería mucho menor.

## 3. Dónde NO hay datos
- **Dimensity 7400 / Mali-G615 MC2 en GPU: ninguno.** No encontramos ninguna medición de LLM en la GPU de un Dimensity 7400 ni
  de un 7300 (Mali-G615 **MC2**), ni con LiteRT-LM ni con llama.cpp. El dato de GPU más cercano es el Tecno Pova 7 Ultra
  (Mali-G615 **MC6**, tres veces más núcleos de GPU) con Qwen3-0.6B: GPU 254/12,1 frente a CPU 95/9,3.
- **Redmi Note 15 Pro 5G con LiteRT-LM (CPU o GPU): ninguno.** Solo hay filas de PocketPal (llama.cpp en CPU).
- **Gemma 4 E2B en gama media con LiteRT-LM: ninguno.** Google solo publica S26 Ultra, iPhone 17 Pro y escritorio.
- **Qwen2.5-1.5B en Q4 en un Dimensity 7300/7400: ninguno.** Las filas de 1,5B en gama media son Q8_0 en chips más rápidos.
- **Granite-4.0-1B: sin datos útiles.** La única fila es `granite-4.0-h-1b` en BF16 en un S25 Ultra (4,6/3,2 t/s), sin cuantizar.
- **Qwen3.5-2B en un D7400: ninguno.** En chips parecidos (SD 7s Gen 3, Exynos 1580) da de 5 a 9 t/s.
- **Primera palabra en PocketPal:** el leaderboard no la publica. Se calcula con la fórmula de arriba.
- **Snapdragon 7 Gen 3:** solo una fila (Nord CE4, un 1,5B en Q8_0 a 5,4 t/s).
- **GPU Mali en llama.cpp:** el backend OpenCL de llama.cpp **solo admite Adreno** (e Intel), según el README de llamadart (LC).
  Vulkan en Android es experimental. En la discusión #9464, Vulkan en Mali cargaba el modelo pero era «muy lento»
  (discusión antigua; puede haber mejorado). El estudio AX encontró que las GPU Adreno superan de forma consistente a las Mali en
  inferencia de LLM. **En el Redmi, llama.cpp correrá en CPU.**

## 4. Qué esperar en el Redmi Note 15 Pro 5G (D7400-Ultra, 4×A78 + 4×A55, Mali-G615 MC2)
**Medido por terceros en este mismo modelo de teléfono (PocketPal, CPU):**
- Un modelo de **0,8-1,2B en Q4** da **prefill de 80-106 t/s** y **decode de 11,5-15,7 t/s**.
- **Con 4 hilos rinde igual o más que con 6.** Cinco modelos se midieron con 4 y con 6 hilos en este teléfono. En cuatro, 4 hilos
  fue más rápido en decode: SmolLM2-135M 67 frente a 36 t/s, LFM2.5-350M Q4_0 41,7 frente a 31,5 t/s, Minueza-96M 109 frente a
  78 t/s y LFM2.5-350M IQ4_NL 42,1 frente a 32,8 t/s. En el quinto (Bonsai-1.7B) quedaron iguales: 9,44 frente a 9,43 t/s.
  Tiene sentido: el chip tiene 4 núcleos grandes.
- Un **3B** da 2,3 t/s: inservible para conversar.

**Estimaciones (nuestras, sin medir):**
| Caso | Cálculo | Primera palabra | Respuesta de 40 tokens |
|---|---|---|---|
| Qwen3.5-0.8B Q4, prefijo del sistema en caché, ficha (~50-110 tokens) + pregunta (~20) | ~100 tokens ÷ ~100 t/s | **~1 s** | 1 s + 40 ÷ 12,5 ≈ **4,2 s** |
| Igual, pero sin caché del prefijo (+~150 tokens del sistema) | ~250 ÷ 100 | ~2,5 s | ~5,7 s |
| Qwen2.5-1.5B o Qwen3-1.7B en Q4 (sin dato en este chip; escalado desde los 1,2B y desde SD 7s Gen 3 / D8300) | prefill ~50-70 t/s, decode ~7-10 t/s | ~1,5-2 s | **~5,5-7,5 s** |
| Gemma 4 E2B por llama.cpp (con D8400 da 11,4 t/s y con SD 7s Gen 3, 3,5 t/s) | decode ~4-7 t/s | >2 s | **>7 s** |
| Gemma 4 E2B por LiteRT-LM en CPU | no hay dato en gama media | ? | **hay que medirlo** |
| GPU por LiteRT-LM (Mali-G615 MC2) | con MC6, Qwen3-0.6B ganó 2,7× en prefill y 1,3× en decode; con MC2, mucho menos | ? | **hay que medirlo** |

**Conclusión:** con lo publicado, solo un modelo de **~0,8-1,2B en Q4 en CPU con 4 hilos** se acerca a los criterios
(≥10 t/s y ≤2 s hasta la primera palabra). Aun así queda **justo en el límite de ≤4 s** para 1-2 frases. Para cumplirlos, la
respuesta tiene que ser **corta** (≤40 tokens, cortar en la segunda frase) y el prefijo del sistema tiene que ir **en caché**.
Un 1,5-2B probablemente se pasa de 4 s. La calidad del 0,8B en español no está probada: el 0,5B dio 0-2 de 7 útiles.

## 5. Qué debe medir una persona (en el Redmi, en modo avión, con el teléfono frío y con más de 50 % de batería)
1. **PocketPal → Benchmark** con `Qwen3.5-0.8B` Q4_K_M y `Qwen2.5-1.5B-Instruct` Q4_K_M, una vez con **4 hilos** y otra con **6**.
   Anotar PP, TG y la memoria pico, y subir el resultado al leaderboard.
2. **Google AI Edge Gallery** con Gemma 4 E2B y con el Qwen más pequeño que ofrezca, en **GPU** y en **CPU**. Anotar
   prefill, decode y primera palabra que muestra la app. Así se llena el hueco de la GPU Mali-G615 MC2.
3. Las 5 preguntas de laboratorio/prueba-llm-nativo.md: correctas de 5, tiempo hasta la primera palabra y tiempo total.
4. **Calor y estabilidad:** repetir 10 preguntas seguidas y anotar si baja la velocidad (estrangulamiento térmico), si el
   teléfono se calienta y si se traba la interfaz.
5. Si hay un segundo teléfono de gama baja (≤4 GB de RAM), la misma prueba con el 0,8B: ¿carga o se cierra?
