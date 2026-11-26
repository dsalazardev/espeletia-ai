---
fecha: 2026-11-25
rol: R2
tipo: agregado
pr: "#000"
---
Avisos sin red, siempre con una sola línea y una vibración (o destello en iPhone):
- **Hora de regreso:** el guía la fija en el Modo guía con un selector de hora, y el visitante escanea el QR (`r:HHMM`). Si no se fijó, se usa el cierre oficial del sector (14:00, en `paquete.json → horario`, de la ficha `horario`). Avisa 30 minutos antes y a la hora, solo si ese día el visitante está en el parque.
- **Sobres esperando:** si el visitante lleva un minuto sin moverse más de 15 m, se lo recuerda una vez.
- **Batería baja** (menos del 20 %, donde el navegador lo informa): sugiere el tema Noche y cerrar la cámara; con «automático» activa el ahorro de energía.

Lo que ya existía: llegar a una estación vibra y guarda el sobre; sobre 3.500 m aparece «camina despacio». Spec: docs/specs/2026-11-24-avisos-sin-red.md (issue #34).
