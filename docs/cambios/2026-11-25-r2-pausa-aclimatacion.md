---
fecha: 2026-11-25
rol: R2
tipo: agregado
pr: "#000"
---
Soporte para cromos `tipo: "aclimatacion"` (con `estacion` y `segundos`, los define R1).
- **Dónde se inicia:** desde la hoja de su estación en el mapa o desde el álbum.
- **Condición:** estar en la estación (ya visitada, o con el GPS dentro) o tener el código del guía «estamos en el parque».
- **Mecánica:** se reutiliza la pausa sin pantalla. Si se toca, el tiempo vuelve a empezar; al cumplirlo, entrega el cromo.
- **Al terminar:** muestra la ficha oficial `aclimatar` con su fuente, «si te sientes mal, avísale a tu guía» y un atajo a la ficha del mal de altura. No hay consejos de salud escritos en el código.
- **Para los avisos sin red (#34):** se emite `paramo-pausa-fin`.

paquete.json todavía no trae estos cromos, así que la prueba (`pruebas/aclimatacion.py`) inyecta uno y usa un reloj simulado. Spec: docs/specs/2026-11-24-pausa-aclimatacion.md (issue #18).
