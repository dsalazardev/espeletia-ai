---
fecha: 2026-11-24
rol: R2
tipo: agregado
pr: "#000"
---
Si algo falla en el páramo, la app ya no se queda muda:
- **Motor de IA colgado:** cada pedido tiene un límite de tiempo. Si se pasa, el worker se reinicia una vez; si vuelve a fallar, el chat sigue con palabras clave y se lo dice al visitante.
- **Sin el índice del chat:** queda un menú de temas que lleva a las fichas, con «no tengo esa información» y el contacto de la UTON. Las reglas de emergencia y de comer siguen mandando.
- **Archivo grande de la caché dañado:** se pide `verificar` al service worker; lo dañado se anota, Ajustes lo muestra y con señal se pide `reparar`. Después se vuelve a cargar la IA.
- **Llegó contenido nuevo del parque:** se avisa una vez, sin interrumpir una pausa ni un sobre (mensaje `contenido`).
- **Cámara negada:** el guía confirma con su código lo que ve el visitante.
- **GPS negado:** «Elegir mi estación» abre la hoja de la estación con el código del guía.

Spec: docs/specs/2026-11-24-escalera-degradacion-ui.md (issue #20); mensajes del service worker en docs/contratos/sw-mensajes.md.
