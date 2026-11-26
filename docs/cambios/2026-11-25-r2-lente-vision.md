---
fecha: 2026-11-25
rol: R2
tipo: arreglado
pr: "#000"
---
La Lente ya reconoce desde el primer uso. Antes no hacía nada porque `models/parque.json` venía sin modelo base. Ahora trae un
modelo **provisional** con 120 fotos de Wikimedia Commons de licencia libre, 15 por clase. Además, la Lente promedia los últimos
3 cuadros de la cámara y el umbral de la cámara baja de 0,7 a 0,5. El modelo provisional se reemplaza con las fotos del parque
(#11) usando `herramientas/lente_base.py`.

Medido con 128 fotos de Commons que no entraron al modelo base:

| Umbral | La Lente responde (fotos de clases reales) | Acierta cuando responde | «Otro» tomado por una clase |
|---|---|---|---|
| 0,4 | 66 % | 69 % | 3 |
| **0,5** | **34 %** | **74 %** | **2** |
| 0,6 | 21 % | 86 % | 1 |
| 0,7 (antes) | 7 % | 86 % | 0 |

- Primera opción correcta: 61 %. Las etiquetas de Commons tienen ruido, porque muchas fotos de «pajonal» o «frailejón» también
  muestran lagunas o nevados, así que el acierto real puede ser un poco mayor.
- Lo que más se confunde: pajonal con laguna y frailejón, y roca con musgo. Son paisajes que se mezclan.
- Huellas de Python (`lente_base.py`) y de la app (navegador) para la misma foto: coseno entre 0,987 y 0,998. Las dos herramientas
  son compatibles.
- Clasificador lineal en lugar de vecinos (k-NN): 61 % contra 64 % con todas las fotos. No mejora, así que se queda el k-NN.
- Arreglado de paso: si el visitante tocaba al personaje mientras la Lente calculaba un cuadro, el texto del personaje se borraba.
- Prueba nueva: `pruebas/lente.py`. Autores y licencias: `licencias/lente-provisional-commons.md`, también enlazado en Créditos.
