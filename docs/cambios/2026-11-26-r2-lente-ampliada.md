---
fecha: 2026-11-26
rol: R2
tipo: mejorado
pr: "#000"
---
La Lente reconoce mucho más: el modelo base pasa de 120 a 703 fotos y la «cabeza» (cómo decide y qué certeza muestra)
quedó calibrada con fotos apartadas. Se conserva MobileNetV2: ni el modelo ni la velocidad cambian.

- **Fotos nuevas (583):** 257 de iNaturalist (observaciones con grado de investigación: *Espeletia hartwegiana*,
  *Espeletia* en Colombia, *Polylepis sericea*, musgos y líquenes de Colombia y Ecuador, *Calamagrostis*) y 326 de
  Wikimedia Commons (lagunas, nevados, roca volcánica, pajonal y «otra cosa»). Se bajaron y procesaron en el navegador con
  el mismo modelo y el mismo recorte que el teléfono; solo viajaron las huellas. Se revisaron una por una: se sacaron
  dibujos, mapas, fotos de otra cosa y animales mal etiquetados (la búsqueda de *Polylepis* trajo peces y serpientes).
  Créditos en `licencias/lente-ampliacion-2026-11.md`. **Muchas son CC BY-NC: sirven para esta prueba, no para uso comercial.**
- **Cabeza calibrada** (`models/parque.json → lente.cabeza`, la escribe `herramientas/lente_base.py`):
  - antes de comparar se resta la huella promedio de la base (SimpleShot): sin centrar, todas las huellas se parecen
    (0,56 dentro de una clase y 0,50 entre clases);
  - la certeza es la parte de los votos de los 7 vecinos y el umbral (0,59) se calcula para acertar ≥ 90 % al responder;
  - la «Certeza N %» que se muestra es la medida con fotos apartadas (con los 7 vecinos de acuerdo, 97 %, no 100 %).
  - Sin cabeza (paquetes viejos), la app usa `paquete.json → camara` como antes.
- **Medido con 201 fotos apartadas** (por autor, para que una serie no quede a los dos lados):

  | | Responde | Acierta al responder | «Otra cosa» da cromo |
  |---|---|---|---|
  | Antes (120 fotos, fórmula de antes) | 30 % | 81 % | 10 % |
  | Ahora (703 fotos, cabeza calibrada) | 78 % | 95 % | 3 % |

  Frailejón: responde 85 % (antes 15 %), musgo 91 % (antes 32 %, y acertaba solo el 14 %). La clase más débil sigue
  siendo el pajonal (61 % de acierto dejando uno fuera) por pocas fotos buenas (54).
- Con las 7 fotos reales de la guía en PDF: la Lente queda segura en 4 (antes 1), una de ellas equivocada (una laguna con
  mucho pajonal delante); los otros 3 casos dudan y pasan a «Que lo confirme mi guía».
- `lente_base.py --sumar` conserva las huellas que ya hay y suma fotos nuevas (para cuando lleguen las de Brisas).
- `models/parque.json` pasa de 207 KB a 1,2 MB. Pruebas: `lente.py`, `lente_duda.py`, `coleccion.py`, `guia_parque.py`,
  `union.py` y `degradacion.py` pasan.
