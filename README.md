# Espeletia AI · Álbum del Páramo

Asistente sin internet para los visitantes del PNN Los Nevados (sector Brisas – Valle de las Tumbas): un álbum de 24 cromos
que se gana mirando el páramo. Es una app web instalable (PWA) en español e inglés. Funciona en modo avión después de abrirla
una vez con señal y corre en Android (Chrome) e iPhone (Safari) sin tiendas de apps. Toda la información viene de fuentes
oficiales y se muestra con su fuente.

## Qué hace
- **Álbum:** 4 capítulos y 24 cromos que llegan en sobres. Se ganan por GPS al llegar a cada estación, con la Lente, con QR, con el
  guía, con una pausa sin pantalla y con una foto de grupo. Al final se descarga un PDF con portada, capítulos, fotos, recorrido y
  certificado.
- **Lente:** reconoce el paisaje con MobileNetV2 + k-NN dentro del teléfono y lee QR. Trae un modelo base **provisional** con
  fotos de Wikimedia Commons, que se reemplaza con fotos del parque. Fray, el Cóndor y Magma aparecen sobre la cámara.
- **Mapa:** el carreteable real (OpenStreetMap) sobre el relieve Copernicus, en plano y en 3D. Muestra las 4 estaciones (Brisas,
  Aguacerales, Arenales y Valle de las Tumbas), las distancias por el sendero y la bitácora de la jornada.
- **Pregúntale a Fray:** un chat que **no genera texto**. Busca la ficha oficial más parecida con un modelo pequeño
  (multilingual-e5-small) y tiene reglas fijas para emergencias, plantas y volcán. Se puede escribir o hablarle manteniendo
  presionado «Enviar».
- **Modo guía:** QR y códigos firmados que cambian cada 5 minutos y se verifican sin red. Con ellos el guía entrega historias,
  paradas narradas, la hora de regreso y la confirmación de lo que ve la Lente.
- **Accesibilidad y campo:** tamaño de texto, alto contraste, tema Noche, ahorro de energía, avisos sin red y botón «atrás» que
  pregunta antes de salir.

## Probarla
- **En un computador:** dentro de esta carpeta corre `python3 -m http.server 8000` y abre `http://localhost:8000/?demo`.
- **En un teléfono:** sigue [docs/prueba-en-telefono.md](docs/prueba-en-telefono.md).
- **Publicarla:** cualquier hosting estático con HTTPS (Netlify conectado a `main`, GitHub Pages). No hay que compilar nada.

## Revisar que todo esté bien
```
pip install -r herramientas/requirements.txt
python3 herramientas/validar_contratos.py   # datos del paquete, del chat y del parque
python3 herramientas/verificar_modelos.py   # huellas SHA-256 de los modelos
python3 herramientas/evaluar.py             # bancos del chat y puerta de seguridad
python3 herramientas/version_sw.py --check  # versión del service worker
python3 herramientas/generar_indices.py --check   # CHANGELOG y decisiones al día
```
Las pruebas de la app de punta a punta (Playwright y Chrome) se explican en [pruebas/LEEME.md](pruebas/LEEME.md).

## Documentación
| Tema | Dónde |
|---|---|
| Guía completa: experiencia, chat, Lente, mapa, Modo guía y Modo equipo | [LEEME.md](LEEME.md) |
| Arquitectura y flujo de datos | [docs/arquitectura.md](docs/arquitectura.md) |
| Cómo se mide el chat y los resultados | [docs/evals.md](docs/evals.md) |
| Recorrido real y fuentes (PNN, OpenStreetMap) | [docs/investigacion/recorrido-pnn.md](docs/investigacion/recorrido-pnn.md) |
| Modelos, fotos, mapas y licencias | [docs/licencias.md](docs/licencias.md) · [licencias/](licencias/README.md) |
| Decisiones y especificaciones | [docs/decisiones/](docs/decisiones/README.md) · [docs/specs/](docs/specs/) |
| Contratos de datos | [docs/contratos/](docs/contratos/) |
| Roles, ramas y cómo contribuir | [docs/flujo-de-trabajo.md](docs/flujo-de-trabajo.md) · [AGENTS.md](AGENTS.md) |
| Qué cambió | [CHANGELOG.md](CHANGELOG.md) (se genera desde `docs/cambios/`) |

Es una prueba de concepto. Las fichas son borradores con fuente que el PNN debe validar, y la clave del Modo guía es pública
(decisión [secretos-poc-en-repo-publico](docs/decisiones/2026-11-24-secretos-poc-en-repo-publico.md)).
