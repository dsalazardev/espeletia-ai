---
fecha: 2026-11-25
rol: R2
tipo: arreglado
pr: "#000"
---
Revisión del funcionamiento del mapa, el álbum y los cromos, con la prueba nueva `pruebas/mapa_album.py`. Cubre
geocercas, bitácora, reglas de cada cromo, sobres, capítulo completo y 24/24.

- **Bitácora:** si alguien volvía otro día, el salto entre el último punto de ayer y el primero de hoy se sumaba como
  distancia caminada (en la prueba, 2,25 km que nadie caminó). El «máximo de hoy» mezclaba días y el mapa unía los dos
  recorridos con una línea. Ahora el resumen, el perfil, la línea del mapa, el 3D y la página «Tu recorrido» del PDF usan
  solo la jornada actual: los puntos desde la última pausa de más de 3 horas. El historial completo sigue guardado.
- Confirmado que funciona:
  - la posición imprecisa (±200 m) no entrega cromos;
  - el cromo de estación queda en sobre sin interrumpir la caminata;
  - la distancia caminada coincide con la real;
  - la foto de grupo pide 3 cromos y estar en el parque;
  - «Abrigo de hojas» espera al primer frailejón y pide otra planta (25 m, o 3 min sin GPS), y el guía puede confirmarla;
  - se celebran el capítulo completo y el 24/24;
  - la pista final.
