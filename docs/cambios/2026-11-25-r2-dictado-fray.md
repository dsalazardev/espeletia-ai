---
fecha: 2026-11-25
rol: R2
tipo: agregado
pr: "#000"
---
Hablarle a Fray sin botón aparte: tocar «Enviar» envía, y mantenerlo presionado (más de 350 ms) escucha. Mientras escucha, el botón se pone rojo y dice «Escucho…». Al soltarlo, la transcripción queda en la casilla, resaltada, editable y sin enviarse; si ya había texto, se agrega al final. Con teclado, Enter sobre «Enviar» con la casilla vacía empieza y termina. Al enviarla pasa por la misma búsqueda y el mismo carril crítico que lo escrito.

El navegador debe confirmar que el idioma está disponible en el dispositivo y el reconocimiento exige modo local. Si falta el idioma, el navegador no lo admite o se deniega el micrófono, queda el teclado. La app no descarga modelos ni usa reconocimiento remoto. La prueba simula la API del navegador. Issue #38.
