---
fecha: 2026-11-25
rol: R2
tipo: arreglado
pr: "#000"
---
Arreglos en la dinámica entre guía y visitante cuando se escanea el QR con la cámara del teléfono:

- En un iPhone que eligió «Abrir sin instalar», el QR del guía ahora se aplica en su álbum. Antes le mostraba un código
  para escribirlo en un álbum instalado que no existía.
- Los QR de hora de regreso y de paradas ya no dan un código de 4 dígitos que no tiene dónde escribirse. Ahora piden
  escanearlos con la Lente.
- El Modo guía empieza mostrando «Estamos en el parque», que no entrega cromos. Antes empezaba con la primera historia y
  cualquiera que escaneara se la ganaba antes de oírla.
- El aviso de «QR vencido» sugiere revisar la hora del teléfono, porque un reloj desfasado da el mismo error.

Prueba nueva: `pruebas/guia_visitante.py`. `pruebas/guia_parque.py` se ajustó al modelo base: lo publicado suma lo que ya traía el paquete.
