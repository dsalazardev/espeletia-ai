# Experiencia: revisión de la gamificación y hacia dónde va

Revisión del 24-nov-2026 contra la norma del parque ([investigacion/recorrido-pnn.md](investigacion/recorrido-pnn.md)) y las
reglas del juego. Lo nuevo está en decisiones «propuesta»; se calibra con los expertos el jueves.

## Lo que hay hoy (v4, 25-nov)
| Capítulo | Cromos | Cómo se ganan |
|---|---|---|
| I. El sendero | 6 | GPS en 4 estaciones sobre el carreteable real (Brisas, Aguacerales, Arenales y Valle de las Tumbas), pausa de contemplación (2 min) y foto de grupo |
| II. Flora y paisaje | 8 | Lente (cámara) |
| III. Fauna | 6 | QR impresos |
| IV. Historias del guía | 4 | QR o código del Modo guía |

Ya construido en v4, con su prueba en `pruebas/`:
- compañeros 2D en la cámara;
- paradas narradas con el QR del guía;
- soporte para la pausa de aclimatación (faltan sus cromos, R1);
- álbum final en PDF y collage;
- avisos sin red;
- voz;
- capa de tono;
- dictado;
- accesibilidad;
- botón «atrás».

## Lo que está bien planteado
- Se gana con **atención**, no con velocidad (decisión reglas-del-juego).
- **Caminando no se interrumpe:** el teléfono vibra y guarda el sobre.
- La **pausa de contemplación** y el **cromo de grupo** premian detenerse y estar juntos.
- El **guía es parte del juego** (Modo guía) y hay plan B con su código en todo cromo de GPS y de cámara.
- La pausa y la foto de grupo solo se pueden hacer en el parque.

## Riesgos y ajustes propuestos
1. **Tres fuentes de cromos explícitas** (decisión experiencia-tres-fuentes-de-cromos):
   - **Descansos:** la pausa de contemplación y una **pausa de aclimatación** por estación. La ficha oficial `aclimatar`
     recomienda pausas de 10 minutos: el juego refuerza una conducta segura.
   - **El guía al terminar su explicación:** QR de parada que entrega el cromo de la parada y abre la parada narrada.
   - **Fotografiar** plantas, rocas y lugares con la Lente.
2. **Fauna:** el cóndor y la danta casi nunca se ven, y los QR en señalética requieren permiso del PNN. Propuesta: que el
   **guía entregue la fauna al contarla** (o que su señal la entregue, si hay permiso). Nunca exigir un avistamiento.
3. **24/24 sin riesgo:** el mensaje «no salgas del sendero» va en todo cromo de cámara o GPS. La norma prohíbe rutas alternas
   y extraer flora.
4. **Ritmo real:** unas 3 h, grupos de hasta 8 por guía, ingreso de 8:00 a 14:00. Calibrar con los expertos cuántos cromos
   caben por parada.
5. **Inclusión:** visitantes de 6 a 70 años; variante para niños en la capa de tono.
6. **Ruido:** la norma prohíbe equipos que perturben. Audio con audífonos o a volumen bajo; texto por defecto.

## Compañeros 2D en la cámara (decisión companeros-2d-en-camara)
- Fray (frailejón), el Cóndor y Magma, que ya existen en `js/art.js`, **aparecen sobre la imagen de la cámara solo en
  momentos quietos**: al llegar a una estación, cuando la Lente reconoce algo o con el QR del guía.
- Se mueven un poco con la inclinación del teléfono (DeviceOrientation) para dar sensación de estar «en» el paisaje.
- Al tocarlos cuentan la ficha y ofrecen **una foto con el personaje**, que va al collage final.
- No hay apariciones que perseguir, ni WebXR (iPhone no lo soporta).

## La app como guía interactivo (decisión guia-en-el-centro)
- **Con el guía:** el guía muestra el QR de la parada → cada visitante la lee o escucha en su idioma → recibe el cromo al
  terminar la explicación. Las historias y la fauna las entrega el guía.
- **Entre paradas:** guía de bolsillo con mapa y «cuánto falta», Fray, aviso de altura y emergencia con coordenadas.
- **Siempre:** «pregúntale a tu guía» cuando no hay información oficial.

## Cierre: álbum final (decisión album-final-pdf)
PDF generado en el teléfono, con:
- portada con ilustración original de Manizales y el Nevado del Ruiz;
- una página por capítulo;
- collage con las fotos del visitante y las fotos con los personajes;
- «Tu recorrido» sobre el relieve real;
- certificado y fuentes.

También se genera el collage como imagen para compartir.

## Voz y traducción
- Audio pregrabado por idioma (decisión voz-audio-pregrabado): es-CO, es-ES, en, fr y pt-BR.
- Paradas narradas y frases del guía pre-traducidas; la traducción en vivo es un spike P2
  ([specs/2026-11-24-traduccion-en-vivo.md](specs/2026-11-24-traduccion-en-vivo.md)).
