# Pruebas de punta a punta

Cada prueba maneja la app por la interfaz, como un visitante, con Chrome (Playwright) y cámara, GPS, reloj o batería simulados.
Todas escriben `OK` o `FALLA` por paso y terminan con código 0 si todo pasa.

## Preparar
1. `pip install playwright pillow pypdf` y Google Chrome instalado. Si el Chromium de Playwright se cae («Target crashed»), usa
   el Chrome del sistema: la mayoría de las pruebas ya lo hacen con `executable_path='/usr/bin/google-chrome'`.
2. Sirve la app desde la carpeta principal: `python3 -m http.server 8765`.
3. Algunas pruebas necesitan ffmpeg (cámara simulada en `.y4m`) y axe-core (`npm i axe-core` o `AXE=/ruta/axe.min.js`).

## Cuáles hay
| Prueba | Qué revisa | Necesita | Tiempo |
|---|---|---|---|
| `coleccion.py` | Los 24 cromos por la interfaz, PDF del álbum, persistencia y modo avión | videos en `/tmp/vid/` (abajo) | ~8 min (pausa real de 2 min) |
| `mapa_album.py` | Reglas de cromos, sobres, capítulo completo, 24/24, geocercas, bitácora por jornada, sendero real (caminar por el carreteable gana las 4 estaciones) y «cuánto falta» por el camino | — | ~30 s |
| `mapa.py` | Mapa plano y 3D con relieve, bitácora, hoja de estación, aviso de altura, permiso negado | WebGL por software | ~30 s |
| `gps_reintento.py` | Reintento del GPS tras un error | — | ~5 s |
| `chat_ui.py` · `chat_mapa.py` | Chat (respuestas, tema, idioma) y chat unido al mapa | — | ~20 s c/u |
| `union.py` | Lente → chat: tema, seguimiento, foto desde el chat, sobres y detalle | `/tmp/parque_ui.json` (lo deja `guia_parque.py`) | ~20 s |
| `guia_parque.py` | Modo guía (QR y códigos firmados) y Paquete del parque desde la galería | `/tmp/vid/`, `/tmp/galeria/fotos/<clase>/*.jpg` | ~80 s |
| `guia_visitante.py` | QR del guía abierto por la dirección (iPhone con y sin instalar), selección inicial del guía | — | ~10 s |
| `lente.py` | El modelo base de la Lente carga y responde; promedio de cuadros | ffmpeg | ~10 s |
| `lente_duda.py` | Si la Lente duda, «Que lo confirme mi guía» + código del guía entrega el cromo (`FOTO=` para usar una foto real) | ffmpeg | ~15 s |
| `instalar.py` | Paso de instalación, iPhone, navegadores internos, «Abrir sin instalar» | — | ~25 s |
| `album_pdf.py` | PDF del álbum (completo e incompleto) y collage | pypdf | ~15 s |
| `degradacion.py` | Qué hace la app cuando falla la IA, la cámara o el GPS | — | ~20 s |
| `accesibilidad.py` | axe (WCAG 2 A/AA) en todas las pantallas, rol visible, ahorro de energía | axe-core | ~30 s |
| `paradas.py` · `audio.py` · `tono.py` · `aclimatacion.py` · `avisos.py` · `companeros.py` · `dictado.py` | Paradas narradas, voz, capa de tono, pausa de aclimatación, avisos sin red, compañeros 2D, dictado | — | ~10–25 s c/u |
| `atras.py` | Botón «atrás»: cierra, vuelve al álbum, pregunta antes de salir | — | ~10 s |
| `velocidad.py` | Mide la carga de la Lente y el chat (no es de pasa/falla) | `python3 pruebas/velocidad.py <puerto> [freno_cpu]` | — |

## Archivos de cámara simulada
- `/tmp/vid/*.y4m`: uno por clase (`otro`, `frailejon`, `pajonal`, `sietecueros`, `musgo`, `laguna`, `roca`, `nevado`,
  `desconocido`) y `qr.y4m`, que muestra los QR PARAMO-QR-15 a 20, uno tras otro. Ejemplo:
  `ffmpeg -loop 1 -i foto.jpg -vf "zoompan=z='1.15+0.1*sin(on/18)':d=1:s=640x480:fps=10" -t 6 -pix_fmt yuv420p /tmp/vid/frailejon.y4m`
- Usa fotos reales del páramo (por ejemplo, de Wikimedia Commons con licencia libre), distintas de las del modelo base: las del
  modelo están en `licencias/lente-provisional-commons.md`.
- Orden: `guia_parque.py` antes de `union.py`.

## Bancos del chat
`preguntas_eval.json`, `preguntas_eval2.json` (ciego), `preguntas_mapa.json` y `preguntas_tema*.json` (`tema3` ciego). Se miden
con `python3 herramientas/evaluar.py`. Para comprobar que el navegador da lo mismo que Python, usa `python3 herramientas/paridad_chat.py`
con el servidor en :8765. Resultados en [docs/evals.md](../docs/evals.md).

## Pendiente
Estas pruebas aún no corren en CI: hoy solo corren ahí los contratos, los modelos, la versión del SW y los bancos del chat
(ver `docs/contexto/R2.md`).
