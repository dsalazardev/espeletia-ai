---
fecha: 2026-11-25
rol: R2
tipo: cambiado
pr: "#000"
---
El mapa usa el recorrido real. Las estaciones se llaman **Brisas, Aguacerales (por confirmar), Arenales y Valle de las
Tumbas** y quedan sobre el carreteable de OpenStreetMap, con alturas del relieve Copernicus. Antes, la estación 3 estaba a
1,3 km del camino y el Valle de las Tumbas a 2 km, así que sus geocercas nunca se habrían activado caminando.

- **`paquete.json → sendero`** (nuevo y opcional): unos 50 puntos del camino, de Brisas al fin autorizado (4,2 km). Lleva su
  fuente (`osm`) en `fuentes`.
  - El mapa plano y el 3D dibujan el camino real, no rectas entre estaciones.
  - El pliego se ajusta al camino y el volcán aparece como flecha en el borde, con su distancia.
  - La página «Tu recorrido» del PDF lo dibuja punteado debajo de lo que caminaste.
- **Distancias por el sendero** (`js/sendero.js`): en la lista del mapa, en la pista del álbum y en «¿cuánto falta?» y
  «¿dónde estoy?» del chat. Si el visitante está a más de 150 m del camino, se vuelve a la línea recta y el texto lo dice.
- **Contrato (R3):** `sendero` se agregó a `paquete.schema.json`. `validar_contratos.py` revisa que su fuente exista y que
  cada estación quede dentro de su radio respecto al camino.
- **Créditos:** «Camino: © colaboradores de OpenStreetMap» bajo el mapa, y la licencia ODbL en Ajustes → Créditos.
- **Pruebas:** `mapa_album.py` camina por el carreteable real y gana las 4 estaciones. `chat_mapa.py` ahora espera la
  distancia por el sendero.
- **Investigación:** `docs/investigacion/recorrido-pnn.md` documenta los puntos de OSM, cómo se eligieron y lo que falta confirmar.
