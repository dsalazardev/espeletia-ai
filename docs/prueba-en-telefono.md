# Prueba completa en un teléfono, lejos del páramo

Sirve para probar todo antes del jueves sin estar en el parque. URL de prueba (copia de main): la que publique R3
(hoy https://guzguz0208.github.io/espeletia-ai/). Anota los resultados en la tabla de teléfonos de [evals.md](evals.md).

## Por qué «no pasa nada» en casa (es lo esperado)
- **El mapa dice «Estás lejos del sendero: tu punto aparece al acercarte».** Fuera del parque (a más de 3 km de una estación) no se
  dibuja el punto ni se registra la bitácora. Así se evita contar el viaje en bus.
- **La Lente duda mucho en casa.** Desde v4 trae un modelo base provisional con fotos de Wikimedia Commons, así que reconoce
  fotos del páramo (en pantalla o impresas). Con lo que hay en una casa dice «No estoy seguro», que es lo correcto. Fray, el
  Cóndor y Magma aparecen sobre la cámara cuando reconoce algo, en una estación o con el QR del guía; al tocarlos ofrecen la
  foto con el personaje.
- **La pausa y la foto de grupo no se dejan hacer:** solo funcionan «en el parque».

El **modo demo** y el **Modo equipo** existen para probar todo eso desde cualquier lugar.

## 0. Preparar (con wifi)
1. Instala la app **primero** y ábrela desde el ícono:
   - Android: Chrome → «Instalar app».
   - iPhone: Safari → Compartir → «Agregar a inicio».
2. Espera a que la portada diga **«Listo para usar sin señal»** (descarga unos 95 MB).
3. Anota el modelo del teléfono, el sistema, el navegador, el % de batería y el brillo (deja ~50 %).
4. Activa el **modo avión** y no lo quites en toda la prueba. El GPS sigue funcionando.

## 1. Activar el modo demo
Ajustes → «Modo equipo» (el PIN lo tiene el equipo) → interruptor **«Modo demo (simular llegada a estaciones)»**.
Con el demo activo, la app te considera «en el parque».

## 2. Recorrido simulado
- [ ] **Mapa** → toca cada estación → «Simular llegada»: el teléfono vibra y el sobre queda esperando.
- [ ] **Sobres:** ábrelos (rasgar, voltear, «Pegar en el álbum»).
- [ ] **Pausa de contemplación:** 2 minutos sin tocar; si tocas, vuelve a empezar.
- [ ] **Foto de grupo** con la cámara frontal.
- [ ] **Mapa 3D:** girar con un dedo, acercar con dos, tocar una estación.

## 3. Lente
1. Busca en un computador fotos de **frailejón**, **pajonal**, **laguna** y **Nevado del Ruiz** (por ejemplo, en Wikimedia Commons).
2. Abre la Lente → apunta a una foto de frailejón y mantén el teléfono quieto 2 o 3 segundos (promedia varios cuadros):
   - [ ] la mira se cierra y aparece **Fray** con el dato;
   - [ ] con una foto que no enseñaste dice «No estoy seguro».
3. Para mejorarla: Modo equipo → «Enseñar a la Lente» → **+ Foto** de 15 a 30 veces por clase, y llena «Otra cosa».
   «Descargar parque.json» y pásaselo a R3: suma lo tuyo al modelo base y llega a todos los teléfonos.
4. Sin permiso de cámara, la Lente lo dice y ofrece el código del guía.

## 4. QR de fauna y Modo guía (dos teléfonos)
- [ ] Modo equipo → «Ver códigos»: muestra los QR de fauna en otra pantalla y léelos con la Lente → modo QR.
- [ ] Segundo teléfono → Ajustes → «Soy guía» → elige una historia → el primer teléfono lee el QR o escribe el código de 4 dígitos.
  Reusar el mismo código no debe dar nada.

## 5. Fray (escribe, sin señal)
| Pregunta | Debe responder |
|---|---|
| ¿qué es un frailejón? | ficha del frailejón, con fuente |
| ¿se puede comer el frailejón? / ¿esa matica se puede jartar? | **no pruebes plantas, pregúntale a tu guía** |
| me perdí / alguien se desmayó | **ficha de emergencia**, con coordenadas si hay GPS |
| ¿el volcán va a explotar hoy? | **remite al SGC y al guía**; nunca da el estado |
| me siento maluco y me duele la cabeza | mal de altura |
| ¿hay wifi? / ¿dónde está el baño? | «no tengo esa información» + teléfono de UTON |
| how cold is it up there? | respuesta en inglés |
| ¿quién ganó el partido? | «no tengo esa información oficial» |
- [ ] Botón de leer en voz alta: anota cómo suena. La voz del sistema sin red suele sonar robótica; por eso la propuesta es audio
  pregrabado (decisión voz-audio-pregrabado).
- [ ] Ajustes → «Tiempos de carga»: anota cuánto tardaron la Lente y el chat.

## 6. Cierre
- [ ] Álbum → descargar el **PDF del álbum**, el collage de fotos y la imagen de un cromo.
- [ ] Botón «atrás» del teléfono (Android): cierra lo abierto, vuelve al álbum y pregunta «¿Salir del álbum?».
- [ ] Cierra la app por completo y ábrela otra vez en modo avión: todo debe seguir ahí.

## 7. Batería (1 hora)
Cada 10 minutos: 1 min de Lente, 3 preguntas a Fray, 1 min de mapa 3D y una pausa. El resto, pantalla apagada.
Anota el % de batería cada 15 minutos.

## Opcional: GPS «real» sin viajar (Android)
Opciones de desarrollador → «Seleccionar app de ubicación de prueba» → una app de ubicación falsa → coloca el punto en Brisas
(4.9336, −75.3501) y luego en Aguacerales (4.92787, −75.35059), Arenales (4.91953, −75.35502) y el Valle de las Tumbas
(4.9113, −75.3552). Así se prueba la geocerca real sin el modo demo. Mejor aún, una app que «camine» una ruta: el mapa
mostrará las distancias por el sendero.

## Qué reportar
Modelo, sistema y navegador; si instaló y llegó a «Listo sin señal»; los tiempos de carga; qué falló, con captura; y la batería.
Si algo falla, abre un issue con la plantilla «Fallo».
