# Evaluación

Todo número de aquí sale de un comando reproducible. Si cambias fichas, reglas o umbrales, vuelve a medir y actualiza esta página.

## Cómo correr
```
pip install -r herramientas/requirements.txt
python herramientas/evaluar.py              # bancos + puerta de seguridad (≈10 s)
python herramientas/validar_contratos.py    # contratos e invariantes
python herramientas/verificar_modelos.py    # SHA-256 de los modelos
```
`evaluar.py` usa `herramientas/tema_chat.py`, copia fiel de `js/chat.js` (búsqueda, tema activo y reglas de seguridad), con
el mismo modelo podado y el índice de `models/chat_indice.json`. No escribe nada en el repo. En CI corre en el job `evals`.

## Bancos (`pruebas/`)
| Banco | Qué mide | Tipo |
|---|---|---|
| `preguntas_eval.json` | 100 preguntas generales (83 con ficha, 17 «no sé») | la mitad se usó para calibrar |
| `preguntas_eval2.json` | 40 preguntas nuevas (32 + 8) | **prueba ciega** |
| `preguntas_mapa.json` | preguntas sobre el recorrido propio y parecidas sobre un lugar | escrito antes de las fichas dinámicas, usado después para agregar 3 paráfrasis |
| `preguntas_tema*.json` | seguimiento con tema activo (Lente o cromo) | tema: calibración; tema2: visto al ajustar; **tema3: ciega** |
| `preguntas_seguridad.json` | banco adversarial del carril crítico (≥40, jerga colombiana) | **por escribir (R1)**, prueba ciega |

Regla: un banco ciego no se usa para ajustar. Si hay que ajustar, se escribe un banco nuevo.

## Línea base (24-nov-2026, main 117249e, sw.js v16)
| Banco | Resultado | Además |
|---|---|---|
| banco 1 | 77/83 correctas | 14/17 «no sé» correctos |
| banco 2 (ciego) | 29/32 correctas | 6/8 «no sé» correctos |
| mapa | 17/18 sobre mi recorrido | 5/6 parecidas sobre un lugar |
| tema | 38/42 seguimiento (+4 a un toque) | 10/10 con tema propio |
| tema2 | 15/21 seguimiento (+5 a un toque) | 4/4 con tema propio |
| tema3 (ciego) | 11/17 seguimiento (+5 a un toque) | 2/3 con tema propio |

**Puerta de seguridad: 19/19** (preguntas con esperado único del carril crítico en todos los bancos).
- Aviso: «¿lo puedo tocar?» con el frailejón activo (tema3) espera `recoger` o `comer_plantas` y responde `fauna_trato`.
  No es del carril crítico estricto, pero es una respuesta equivocada sobre una planta: lo revisan R1 (formas de preguntar)
  y R2 (estrategia de tema, con su copia en Python).
- Falta el banco adversarial: hasta que exista, la puerta solo cubre 19 preguntas.

Coincide con el LEEME salvo «no sé» del banco 1: aquí 14/17 y allá 13/17. Aquí se mide con las reglas de seguridad y la
abstención de la app (`tema_chat.responder`); el LEEME usó la evaluación de calibración de `indice_chat.py`.

## Lo que no mide esta página
- **Paridad JS ↔ Python** (`herramientas/paridad_chat.py`, necesita Playwright y un servidor local). Corrida el 25-nov-2026
  (rama r2/instalar, sw v27): la diferencia máxima de embeddings es 0,002 y el navegador da lo mismo que Python en tema 52/52,
  tema2 25/25, tema3 20/20 y mapa 24/24. Los bancos 1 y 2 coinciden con la tabla. Los cambios de R2 al chat (modo menú,
  tono, empatía, sendero) no movieron ningún número.
- **Pruebas de punta a punta** (`pruebas/*.py`): necesitan Playwright, Chrome y videos de cámara simulada.
- **Teléfonos reales:** tabla pendiente (spec pruebas-en-telefonos).

## Teléfonos (por llenar)
| Teléfono | Sistema / navegador | Instala | Listo sin señal | Carga Lente / chat | Modo avión | Batería 1 h |
|---|---|---|---|---|---|---|
| Android gama baja | | | | | | |
| Android gama media | | | | | | |
| iPhone | | | | | | |
