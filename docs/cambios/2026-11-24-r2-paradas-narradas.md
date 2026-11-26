---
fecha: 2026-11-24
rol: R2
tipo: agregado
pr: "#000"
---
Paradas narradas.
- **Modo guía:** hay un grupo «Paradas narradas». El guía muestra el QR para leer y escuchar la parada y, al tocar «Terminé la explicación», el QR que entrega el cromo de la parada.
- **Visitante:** ve el texto en su idioma, con fuente, insignia de estado y «Escuchar». Si no hay traducción revisada, se muestra en inglés con la nota «traducción pendiente».
- **Reglas:** leer la parada no gasta el código; el cromo se entrega una sola vez por teléfono. Funciona con la Lente (Leer QR) y con la cámara del teléfono (dirección con `#PARAMO-G…`).
- **Contenido de prueba:** una parada (`brisas_agua`, en Brisas) armada con dos datos ya publicados de `pnn2019` y marcada `borrador`; R1 la reemplaza con el guion.

Acciones nuevas del QR, propuestas para `docs/contratos/qr-guia.md` (R3): `p:<parada>` (leer) y `pf:<parada>` (terminé: entrega el cromo). Issue #17.
