---
fecha: 2026-11-25
rol: R2
tipo: arreglado
pr: "#000"
---
Revisión de UX/UI con las skills de la prueba de concepto: `frontend-design` para jerarquía, tipografía, color, textos
y coherencia; `webapp-testing` para capturas y axe en cada estado; `pwa-offline-ml` para el uso sin señal. Se revisaron
pantallas que no se habían mirado: tema Noche, cámara sin permiso, GPS negado, sobre cerrado y emergencia en el chat.

- **Contraste en Noche:** la burbuja del visitante en el chat era blanco sobre verde claro (2,3:1). Ahora el texto es oscuro.
- **Contraste en la Lente sin cámara:** las notas del plan B eran gris claro sobre el globo claro (1,9:1). Ahora son legibles.
- **Lente sin permiso de cámara:** el visor decía «se apagó para ahorrar batería» mientras el globo decía «no tengo
  permiso». Ahora el visor dice que la cámara no tiene permiso y el botón dice «Intentar de nuevo».
- **Sobres:** el aviso «Tienes N sobres por abrir» quedaba encima de «Quedan N sobres» al abrirlos. Ahora se quita al
  empezar a abrir.
- **Ajustes:** «Noche (ahorra batería)» pasa a «Noche», porque la misma hoja ya tiene «Ahorro de energía» y eran dos
  ideas de batería distintas.

axe (WCAG 2 A/AA) en Noche, cámara negada y GPS negado: sin problemas.
