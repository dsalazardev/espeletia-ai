# Álbum del Páramo: prueba de concepto v4

v4 suma, sobre la v3.8 (chat sin internet, Modo guía, Lente unida al chat, bitácora, relieve real y 3D, chat unido al mapa):
el recorrido real en el mapa, una Lente que reconoce desde el primer uso, el álbum final en PDF, compañeros 2D en la cámara,
paradas narradas, avisos sin red, voz, capa de tono, dictado y accesibilidad. El detalle de cada cambio está en
[CHANGELOG.md](CHANGELOG.md).

App web instalable (PWA) para visitantes del PNN Los Nevados. Funciona **en modo avión** después de abrirla una vez con internet. Corre en Android (Chrome) y en iPhone (Safari) sin pasar por tiendas de apps. Está en español e inglés.

## La experiencia

Es un álbum de cromos impreso de verdad, en risografía a dos tintas: verde frailejón y amarillo flor de frailejón.

1. **Portada e instalación.** El visitante escribe su nombre en la etiqueta («Este álbum es de…») y elige idioma. La portada indica si la app ya está lista para usarse sin señal. Al tocar «Abrir el álbum», la tapa se abre como un libro y la app explica cómo instalarla según el teléfono: iPhone, Android o navegador dentro de Instagram o WhatsApp. «Abrir sin instalar» siempre está disponible; la app igual se guarda para usar sin señal en ese navegador.
2. **Álbum.** Tiene 4 páginas, una por capítulo, con pestañas de índice al borde. Se pasan con un deslizamiento y la hoja gira sobre el lomo. Cada espacio vacío muestra la figura impresa del cromo, su número y cómo se consigue.

   | Capítulo | Cromos | Cómo se ganan |
   |---|---|---|
   | I. El sendero | 6 | GPS, pausa y foto de grupo |
   | II. Flora y paisaje | 8 | Lente (cámara) |
   | III. Fauna | 6 | QR |
   | IV. Historias del guía | 4 | QR o código del Modo guía |

3. **Sobres.** Cada cromo ganado llega en un sobre:
   - el visitante lo rasga con un toque;
   - el cromo sale y se voltea;
   - con «Pegar en el álbum», vuela a su espacio y se estampa;
   - 5 cromos son **brillantes**, con lámina holográfica que reacciona al dedo o a la inclinación del celular.
4. **Caminando no se interrumpe.** Al llegar a una estación, el celular solo vibra y guarda el sobre. Los sobres esperan en el álbum hasta que el grupo se detenga.
5. **Detalle.** Al tocar un cromo pegado se ve en grande. Al tocarlo otra vez se voltea, y el dorso trae el dato oficial con su fuente, la estación, la fecha y el dueño. Desde ahí se puede guardar la imagen, pasarla al grupo, escucharla o cambiar la ilustración por una foto propia.
6. **Lente.** La mira se cierra sobre lo que reconoce, y Fray, el Cóndor o Magma aparecen sobre la cámara y cuentan el dato. Al tocarlos ofrecen una foto con el personaje, que va al collage. Si la Lente duda, dice «No estoy seguro, pregúntale a tu guía». Tiene modo QR y foto, con cambio a cámara frontal para la selfie de grupo. Sin permiso de cámara, ofrece el código del guía como plan B.
7. **Mapa.** Un pliego con el **relieve real** del sector (tinte por altura, sombreado y curvas de nivel cada 100 m, del modelo de elevación Copernicus), el **carreteable real** Brisas – Valle de las Tumbas (de OpenStreetMap), las 4 estaciones (Brisas, Aguacerales, Arenales y Valle de las Tumbas), el punto «estás aquí» con su margen de error, tu rastro, el **fin del recorrido autorizado**, escala, norte y el volcán como flecha en el borde, con su distancia. Las distancias se miden **por el sendero**. Con el botón **3D**, el mismo terreno en relieve con la ruta, las estaciones y el volcán: se gira con un dedo, se acerca con dos y al tocar una estación se abre su hoja. Todo funciona sin internet. Cada estación se toca para ver su cromo, preguntarle a Fray o usar el código del guía. Debajo, **Tu recorrido**: altura actual, máxima, cuánto subiste, distancia, tiempo y perfil de altura de la jornada (si vuelves otro día, empieza de cero).
8. **Pausa de contemplación.** 2 minutos sin tocar la pantalla. Si alguien la toca, el tiempo vuelve a empezar. Igual que la foto de grupo, solo se puede hacer **en el parque** (ver abajo).
9. **Final.** Al completar una página caen hojas de frailejón. Al llegar a 24/24 aparece un sello, y el álbum se descarga como **PDF**: portada ilustrada, una página por capítulo, tus fotos, «Tu recorrido» sobre el relieve, certificado y fuentes. También hay un **collage** de fotos para compartir.
10. **Pregúntale a Fray (nuevo en la v3).** Es un chat que funciona sin internet y responde solo con fichas oficiales del parque, siempre con su fuente. Se ve más abajo.

11. **Más en el recorrido (v4).**
    - **Paradas narradas:** el guía muestra el QR de la parada; cada visitante la lee o la escucha en su idioma y recibe el cromo cuando el guía termina.
    - **Pausa de aclimatación:** listo para cromos de pausa por estación (falta el contenido de R1).
    - **Avisos sin red:** hora de regreso, sobres esperando y batería baja, con una línea y una vibración.
    - **Voz:** «Escuchar» usa la voz del teléfono, o una grabación revisada en las paradas.
    - **Botón «atrás»:** cierra lo de encima, vuelve al álbum y pregunta antes de salir.

**Ajustes** (botón del menú inferior):
- nombre e idioma;
- apariencia (Papel, Noche o Automática), tamaño del texto, alto contraste y ahorro de energía;
- cómo responde Fray (normal, corto, con detalle o para niños);
- lectura en voz alta y vibración;
- descargar el álbum, estado «lista para usar sin señal» y «Créditos y licencias».

## Pregúntale a Fray: chat sin internet

**Qué es.** Es un buscador semántico, no un generador de texto. Un modelo de lenguaje pequeño, que corre dentro del celular, entiende la pregunta en lenguaje natural. Con eso elige la **ficha oficial** más parecida y la muestra tal cual, con su fuente. El chat no puede inventar datos: o muestra una ficha oficial o responde «No tengo esa información oficial. Pregúntale a tu guía».

**El modelo**
- Es **multilingual-e5-small** (licencia MIT), cuantizado a int8.
- Le podé el vocabulario a escritura latina (español, inglés, francés, alemán, portugués…). Así bajó de 135 MB a **70 MB** y da resultados **idénticos** (diferencia 0; la comprobación está en `herramientas/podar.py`).
- El tokenizador es `@huggingface/tokenizers` (37 KB) y da los mismos tokens que la versión de Python.
- Responde en unos **35 ms** por pregunta en un computador. En un celular de gama media debería tardar algo más, pero falta medirlo.

**El contenido** está en `chat.json`:
- 71 fichas en español e inglés, cada una con fuente: página oficial del PNN Los Nevados, reglamentación para visitantes, descripción del PNN 2019, WCS, Cenicafé, el decreto Ramsar de la Laguna del Otún, BirdLife, eBird y estudios de la Universidad Nacional y la Universidad de Caldas. Las 5 últimas (musgos, humedales, periquito, pato andino y águila de páramo) se agregaron para que cada cromo tenga su ficha.
- Unas 900 formas de preguntar.
- 48 ejemplos de preguntas fuera de tema.

**Reglas de seguridad fijas**, que no dependen del modelo:
- Si la pregunta menciona una emergencia, primero sale la ficha de emergencia.
- Si menciona comer algo, o algo venenoso o tóxico, primero sale la ficha «no pruebes plantas, pregúntale a tu guía».
- El estado del volcán **nunca** se da: el chat remite al Servicio Geológico Colombiano y al guía.
- Para servicios sin información oficial (baños, comida, parqueadero, señal, wifi) responde que no tiene esa información y da el teléfono de la UTON.

**Si el modelo no carga** (por ejemplo, por falta de memoria), el chat sigue funcionando solo con palabras clave.

### Cuánto acierta (medido, no estimado)

| Banco de preguntas | Con respuesta oficial | Sin respuesta oficial |
|---|---|---|
| Banco 1: 100 preguntas (la mitad se usó para calibrar; reporto todas) | 77 de 83 correctas (93 %), 6 con una ficha vecina | 13 de 17 «no lo sé» |
| **Banco 2: 40 preguntas nuevas, nunca usadas para ajustar** | **29 de 32 correctas (91 %)**, 3 con una ficha vecina | 6 de 8 «no lo sé» |

- **Cuando se equivoca,** muestra una ficha oficial de un tema vecino (por ejemplo, «no recoger plantas» en vez de «sanciones»), no un dato inventado. Si dos fichas quedan muy parejas, muestra la segunda como «Relacionado».
- **Las preguntas en inglés** se responden en inglés aunque la app esté en español.
- **Cómo se evitó la trampa:** durante el trabajo detecté que algunas formas de preguntar que había escrito eran casi iguales a preguntas del banco de prueba. Las quité todas (20) antes de medir.

### Lente y chat unidos: «Pregúntale a Fray sobre esto»

Cada cromo de `paquete.json` apunta a su ficha (`ficha`) y dice cómo nombrarlo (`tema`: «el frailejón»). Se abre el chat **hablando de algo** desde:
- **la Lente,** con el botón de pregunta cuando reconoce algo con seguridad (pasó el umbral de confianza);
- **un sobre,** con «Pegar y preguntar a Fray»;
- **el detalle de un cromo,** con «Preguntar a Fray»;
- **el propio chat,** con el botón de cámara («¿Qué es esto?»): la foto pasa por la Lente y, si la reconoce, se vuelve el tema. Si no, responde «No estoy seguro de qué es».

El chat muestra «Hablando sobre el frailejón» (con × para quitarlo), la ficha y sugerencias que llevan **directo** a una ficha, sin pasar por la búsqueda: dos formas de preguntar sobre el tema y, según el tipo, «¿Me lo puedo llevar?», «¿Se puede comer?» o «¿Le puedo dar comida o acercarme?».

**Preguntas de seguimiento** («¿cuánto vive?», «¿lo puedo tocar?»). Probé varias estrategias con `herramientas/tema_chat.py` y quedó esta:
- si la pregunta sola cae en «no sé» de servicios, se respeta;
- si todas sus palabras aparecen en las fichas, se busca «pregunta (el frailejón)» y se usa, salvo que la pregunta sola fuera claramente mejor;
- si trae palabras que no están en las fichas («¿de qué color es?», pero también «¿raíz cuadrada?»), no se puede saber si sigue el tema: **no se afirma nada**. Se pregunta «¿Preguntas por el frailejón?» o, si la pregunta sola tenía respuesta, se da esa y se ofrece «¿O preguntabas por el frailejón?».
- Las reglas de seguridad van primero: «¿se come?» con el frailejón activo responde con la ficha de no probar plantas.

| Banco (preguntas cortas con tema activo) | Sin tema | Con tema | Además, a un toque |
|---|---|---|---|
| Seguimiento 1: 42 (usado para elegir la estrategia) | 27 | **38** | 3 |
| Seguimiento 2: 21 (escrito después; lo miré mientras ajustaba) | 13 | **15** | 5 |
| **Seguimiento 3: 17 (escrito al final, medido una sola vez)** | 10 | **11** | **5** |
| Preguntas con tema propio («¿hay pumas?» con el frailejón activo) | 17 de 17 | 16 de 17 | — |

- **Lo honesto:** en preguntas nuevas, el tema sube poco las respuestas directas (de 10 a 11 de 17). La mayor ganancia es que la ficha correcta queda **a un toque** (16 de 17). Con palabras raras se prefiere preguntar antes que adivinar.
- **Control de arrastre:** las 140 preguntas de los bancos 1 y 2, cada una con un tema ajeno al azar, no ganan ninguna respuesta equivocada. 6 preguntas de fuera del parque dicen «¿Preguntas por…?» en vez de «no sé», y 14 respuestas correctas llevan un botón extra con el tema.
- El navegador da lo mismo que Python en las 97 preguntas con tema (`herramientas/paridad_chat.py`).

### Chat y mapa unidos (v3.8)

Fray responde preguntas sobre **tu propio recorrido** con lo que mide este teléfono (GPS y bitácora), sin internet:

| Pregunta (ejemplos) | Responde con |
|---|---|
| «¿cuánto falta?», «¿ya casi llegamos?» | la siguiente estación sin visitar, su distancia **por el sendero** (en línea recta si estás a más de 150 m del camino) y cuántas llevas |
| «¿a qué altura estamos?» | la altura actual y de dónde sale (GPS ± m o «estimada con el relieve»), lo más alto de hoy y un botón al mal de altura |
| «¿dónde estamos?» | la estación más cercana y su distancia por el sendero, o «estás en la estación N» |
| «¿cuánto llevo caminado?» | distancia, tiempo, subida y altura máxima de la bitácora |

- Sin posición, lo dice y ofrece abrir el mapa. Lejos del parque (más de 3 km), da la distancia hasta Brisas. No da indicaciones para llegar: eso lo hace el guía.
- **«Ver en el mapa»** en las respuestas de lugares: Brisas y el Valle de las Tumbas abren su hoja; el volcán, los glaciares y la cima resaltan el volcán. La laguna del Otún queda fuera del área del mapa, así que no lleva botón.
- **Tema automático:** al llegar a una estación, la próxima vez que se abre el chat Fray dice «Llegaste a Brisas. ¿Quieres saber algo de aquí?» con su ficha. Lo ofrece una sola vez por estación.
- **Emergencia:** «me perdí» o «necesito ayuda» muestran, además de la ficha, las coordenadas, la altura y la estación más cercana, con un botón para copiarlas y dárselas a quien ayude.
- **Medido** con `pruebas/preguntas_mapa.json` y `python3 herramientas/mapa_chat.py`: 17 de 18 preguntas sobre el recorrido van a la ficha correcta y 5 de 6 preguntas parecidas pero sobre un lugar («¿a qué altura está Brisas?») no se las roban las fichas nuevas. Lo honesto: el banco lo escribí antes de las paráfrasis, pero después lo usé para agregar tres. Fallan «¿cuánto falta para el Valle de las Tumbas?» (va a temperatura) y «¿cuánto dura el recorrido?» (va a actividades). Los bancos 1 y 2 y los de tema quedan igual que antes, y el navegador da lo mismo que Python en las 24.
- `pruebas/chat_mapa.py` lo prueba en la interfaz: sin GPS, una caminata simulada, el tema al llegar (una vez), que las cifras del chat sean las de la bitácora, «Ver en el mapa», la emergencia con ubicación y una pregunta en inglés.

### Cambiar o validar fichas

1. Edita `chat.json`: el texto oficial en `es` y `en`, las formas de preguntar en `q` y `qen`, y la `fuente`.
2. Regenera el índice con `python3 herramientas/indice_chat.py`. Necesita `onnxruntime`, `tokenizers` y `numpy`; une el modelo desde sus partes por su cuenta. Recalibra los umbrales y reporta los aciertos.
3. Comprueba que el navegador dé lo mismo que Python con `herramientas/paridad_chat.py`.
4. Sube `VERSION` en `sw.js`.

**Importante:** las fichas son un **borrador** redactado a partir de fuentes oficiales. Antes de usarlas con visitantes, el PNN debe validarlas, sobre todo tarifas, horarios, teléfonos y restricciones de salud.

**Ojo con la fecha de la demo:** según la página oficial, el parque cierra al ecoturismo desde el cuarto lunes de noviembre hasta el viernes (este año, del 23 al 27). En cierres anteriores Brisas siguió abierto; confírmenlo con el parque.

## Publicarla (necesita HTTPS por la cámara y el GPS)

- **Netlify conectado al repositorio (recomendado):** Add new site → Import from GitHub → este repo. No hay que compilar nada: `netlify.toml` publica la raíz. Cada `git push` actualiza el sitio.
- **Netlify Drop:** arrastra la **carpeta** (con `index.html` en la raíz, no una carpeta dentro de otra) a https://app.netlify.com/drop.
- **GitHub Pages** o cualquier hosting estático con HTTPS también sirve. No necesita servidor.

**Archivos grandes.** El motor WASM y los dos modelos van partidos en trozos de 8 MB en `models/partes/`, con su tamaño y huella SHA-256 en `models/partes.json`. El service worker (`sw.js`) los une y verifica una sola vez, al guardar la app para usar sin señal. Así ningún archivo pasa de 8 MB y lo aceptan Netlify Drop, GitHub (que advierte desde 50 MB) y GitHub Pages. Para cambiar un modelo: `python3 herramientas/partir.py nuevo.onnx models/mnv2_embed.onnx`. Para recuperar el original: `python3 herramientas/partir.py --unir models/e5_small_latino.onnx salida.onnx`.

**Relieve real y 3D (v3.7).**
- **Datos:** Copernicus DEM GLO-30 (ESA), recortado a lon −75,42 a −75,27 y lat 4,97 a 4,85 (Brisas, el Valle de las Tumbas y el cráter Arenas) y promediado a celdas de unos 60 m. `herramientas/relieve.py` genera `models/relieve.bin` (alturas, 117 KB), `models/relieve.json` (georreferencia) y `models/relieve.webp` (el pliego dibujado, 92 KB). Atribución obligatoria, visible bajo el mapa: «Copernicus DEM GLO-30 © DLR, Airbus DS, ESA». Es un modelo de superficie con error de unos metros: sirve para ver el terreno, no para medir.
- **3D:** WebGL sin librerías, unos 58.000 vértices, exageración vertical 1,5× y bruma con la distancia. Solo dibuja al girar, acercar o recibir una posición nueva: quieto no gasta batería. La ruta, las estaciones y las etiquetas se dibujan encima, en 2D, y no se montan unas sobre otras. Si el teléfono no tiene WebGL, el botón 3D no aparece. Con la CPU frenada 4× y WebGL por software, preparar el 3D tarda 0,4 s; en un teléfono con GPU, cada cuadro debería ser mucho más rápido que en la prueba, pero falta medirlo en uno real.
- **Altura sin GPS:** si el teléfono no da altura, la bitácora usa la altura del terreno en tu posición según el relieve («≈»), que es mejor que la de la estación más cercana.
- **Lo que reveló el relieve (resuelto en v4):** las coordenadas de las estaciones 2, 3 y 4 no cuadraban con sus alturas, y dos de ellas quedaban a más de 1 km del camino. Ahora salen del carreteable de OpenStreetMap y sus alturas del relieve (ver «Recorrido real» abajo).

**Recorrido real (v4).**
- **Datos:** `paquete.json → sendero` trae unos 50 puntos del carreteable (vía 824243975 de OpenStreetMap, © colaboradores de OpenStreetMap, ODbL), de Brisas al fin autorizado: 4,2 km.
- **Estaciones sobre el camino:** Brisas (centro de inducción, 4.107 m), Aguacerales (**por confirmar**, 4.151 m), Arenales (4.263 m) y Valle de las Tumbas (4.423 m). `validar_contratos.py` falla si una estación queda fuera de su radio respecto al camino.
- **Distancias por el sendero:** `js/sendero.js` proyecta tu posición sobre el camino. Lo usan la lista del mapa, la pista del álbum y el chat. Fuera del camino (más de 150 m) vuelve a la línea recta y lo dice.
- **Cómo se eligieron los puntos y qué falta confirmar:** [docs/investigacion/recorrido-pnn.md](docs/investigacion/recorrido-pnn.md).

**Mapa y bitácora (v3.6).**
- **GPS:** solo funciona con la app abierta: con la pantalla apagada o la app en segundo plano el navegador no entrega posiciones. Por eso, al volver a la app se pide la posición de inmediato (y se revisa si llegaron a una estación), el GPS se pausa en segundo plano (ahorra batería) y, si falla por señal o tiempo, se reintenta solo cada 8 s (Chrome no lo hace por su cuenta). Si el permiso está bloqueado, el mapa explica cómo activarlo.
- **Bitácora:** guarda en el teléfono un punto cada 15 m de avance o cada 2 minutos, solo **dentro del parque** (a menos de 3 km de una estación; el viaje en bus no se registra) y con precisión de 50 m o mejor. La altura viene del GPS, suavizada con la mediana de las últimas 5 lecturas. Si el teléfono no da altura, se usa la de la estación más cercana y se marca «≈». La subida suma solo cambios de 5 m o más, para no contar el ruido, y la distancia descarta saltos imposibles caminando. Se borra desde el mapa o con «Vaciar» del Modo equipo.
- **Integración:** al pasar de 3.500 m aparece «Estás a 4.320 m: camina despacio», que abre el chat con la ficha del mal de altura. La hoja de cada estación lleva a Fray y al código del guía. El póster del álbum agrega «Recorrido: altura máxima · distancia · tiempo». La altura que queda en cada cromo es la del GPS suavizada.
- **Limitación honesta:** la altura del GPS tiene un margen de 10 a 30 m, y los navegadores no dan acceso al barómetro.

**Velocidad de carga (v3.5).** Medido en Chrome, con la app ya guardada:

| | Antes (v3.4) | Ahora |
|---|---|---|
| Pantalla congelada al cargar el chat | 0,65 s (1,8 s con la CPU frenada 4×, como un celular) | **0 s** |
| Lente con la cámara abierta: hilo principal ocupado | 31 % (con freno 4×) | **0 %** |
| Cargar la Lente / el chat | 0,58 s / 1,34 s | **0,36 s / 0,86 s** |
| Descarga al publicar una versión nueva sin cambiar los modelos | **95 MB** otra vez | **0 MB** (solo revalida) |

Qué cambió:
- **La IA corre en un worker** (`js/motor-worker.js`): ONNX Runtime, los dos modelos y el tokenizador. La pantalla ya no se congela al cargar ni mientras la Lente reconoce.
- **El service worker guarda los modelos unidos y verificados** bajo su nombre normal. Antes se unían las 8 partes y se calculaba la huella SHA-256 en cada carga (unos 2 s en un celular).
- **No se vuelve a descargar todo en cada versión:** los archivos grandes con la misma huella se copian de la caché anterior, y los pequeños se revalidan (304).
- **Modelos pre-optimizados** con `herramientas/optimizar.py` (nivel «extended» de ONNX Runtime): el teléfono no repite esa optimización. Las salidas son idénticas (diferencia 0).
- **Precarga sin competir:** en la primera visita se espera a que termine de guardarse antes de cargar los modelos, para no descargarlos dos veces a la vez. Después, la Lente y el chat se precargan en segundo plano (el chat, solo si el teléfono tiene 3 GB de memoria o más).
- **Ajustes → «Tiempos de carga»** muestra cuánto tardó cada modelo en ese teléfono y de dónde lo leyó.

**Si la IA no carga:** Ajustes muestra el estado de la Lente y del chat. Si alguno falla, «Ver la causa» dice exactamente qué archivo faltó o qué error dio, y hay un botón para reintentar.

**En cada celular**, con internet y antes de subir:
1. Abre la URL.
2. En la portada, espera a que diga **«Listo para usar sin señal»** (descarga unos 95 MB: la Lente y el chat).
3. Menú del navegador → «Instalar app» o «Agregar a la pantalla principal».
4. Prueba en modo avión.

Para probar en un computador: dentro de la carpeta, corre `python3 -m http.server 8000` y abre `http://localhost:8000/?demo`. El modo demo permite simular la llegada a cada estación.

## Modo guía: el guía como parte del juego

El guía es obligatorio en todos los sectores del parque y acompaña al grupo todo el recorrido. Se entra por Ajustes → «Soy guía», con el PIN del guía (`paquete.json → guia.pin`). Su teléfono muestra un **QR grande y un código de 4 dígitos que cambian cada 5 minutos**. El grupo escanea el QR con la Lente (Leer QR) o escribe el código. Todo funciona **sin señal**: el código es una firma HMAC-SHA256 de «qué se entrega + franja de tiempo», y el teléfono del visitante la verifica con su reloj.

| El guía elige | Lo que pasa en el teléfono del visitante |
|---|---|
| Una **historia** | Gana ese cromo del capítulo IV. Junto al QR, el guía ve el dato que debe contar. |
| **Llegamos a…** una estación | Gana el cromo de esa estación cuando el GPS no lo ubica, y queda «en el parque». |
| **Estamos en el parque** | Habilita por 2 horas la pausa y la foto de grupo. |
| **Confirmo lo que ve la Lente** | Gana el cromo de esa clase cuando la Lente duda o no está entrenada. Después puede ponerle su propia foto. |
| Una **parada** (v4) | «Leer y escuchar»: el visitante ve el texto de la parada en su idioma. Al pulsar «Terminé la explicación», el QR entrega el cromo de la parada. |
| **Hora de regreso** (v4) | Fija la hora de regreso del grupo en cada teléfono: avisa 30 minutos antes y a la hora, sin red. |

- Al entrar, el Modo guía muestra «Estamos en el parque», que no entrega cromos.
- El QR lleva la dirección de la app, así que también funciona con la cámara del teléfono. En un iPhone con la app instalada, la cámara abre Safari y no la app: entonces se muestra el código de 4 dígitos para escribirlo en el álbum, o se pide escanearlo con la Lente.

Reglas: cada código sirve **una vez por teléfono**; un QR de hace más de ~10 minutos dice «vencido»; 5 códigos equivocados seguidos bloquean 1 minuto (luego 2, 4…). En el álbum, cada cromo de GPS y de cámara tiene plegado un «plan B» para escribir el código del guía.

**Límite de la prueba de concepto:** la clave está en `paquete.json`, que es público; alguien con conocimientos podría generar códigos. En producción, cada guía recibiría su propia clave al registrarse (REPSE) y la app la verificaría con una firma de clave pública.

## Cromos que se ganan en el parque

- **Pausa y foto de grupo:** se habilitan si el visitante visitó una estación en las últimas 6 horas, si su GPS está a menos de 600 m de una estación o si el guía le dio el código «Estamos en el parque». Desde la casa no se pueden.
- **Segundo frailejón («Abrigo de hojas»):** tiene que ser otra planta. Se entrega a 25 m o más del primero (con GPS) o, sin GPS, 3 minutos después. Si el guía lo confirma, se entrega de una vez.

## Enseñarle a la Lente y publicar el Paquete del parque (Modo equipo)

Se entra por Ajustes → «Modo equipo», con el PIN del equipo.

**Modelo base provisional (v4).** `models/parque.json` trae 120 «huellas» de fotos de Wikimedia Commons con licencia libre, 15 por clase. Así la Lente reconoce desde el primer uso. Las fotos no van en la app, solo su huella; autores y licencias en [licencias/lente-provisional-commons.md](licencias/lente-provisional-commons.md). Medido con 128 fotos que no entraron al modelo: con el umbral de 0,5, la Lente responde en el 34 % de las fotos de clases reales y acierta el 74 % de esas veces. Se reemplaza con fotos del parque (issue #11) con `herramientas/lente_base.py`.

1. En «Enseñar a la Lente», toca **+ Foto** de 15 a 30 veces por clase (manteniendo presionado toma una ráfaga), o usa **Galería** para cargar muchas fotos a la vez desde el teléfono.
2. Llena siempre **«Otra cosa»** con personas, carros, cielo y el piso del sendero. Así la Lente dice «no estoy seguro» en vez de adivinar.
3. La Lente no ofrece cromos hasta tener al menos 2 clases con 5 fotos o más.
4. En **Paquete del parque**, «Descargar parque.json» guarda lo enseñado (las «huellas» de las fotos, no las fotos) y las estaciones fijadas en campo. Reemplaza `models/parque.json` en el repositorio y publica: **todos los teléfonos lo reciben** al abrir la app con señal, sin entrenar nada. Con «Importar» se carga un `parque.json` en otro teléfono del equipo.

**Desde el computador:** con las fotos en carpetas (`fotos/frailejon/`, `fotos/pajonal/`, … `fotos/otro/`), corre `python3 herramientas/lente_base.py fotos`. Escribe `models/parque.json` y mide qué tan bien distingue cada clase dejando fuera cada foto (matriz de confusión). Da los mismos vectores que el teléfono (coseno 0,994 o más).

**Calibración.** Con fotos reales, dos escenas distintas tienen una similitud de 0,34 a 0,56 y la misma escena, de 0,76 a 0,95. Por eso la confianza exige una similitud mínima de 0,50 a 0,68, además del voto de los vecinos y del umbral, que es de 50 % desde v4 (con 70 % casi nunca respondía). Con la cámara en vivo, la Lente promedia los últimos 3 cuadros. Esto corrige el error de la v1, en la que una sola clase entrenada hacía que todo pareciera esa clase. Los valores se ajustan en `paquete.json` → `camara`.

Para la demo del 26, se puede entrenar con fotos impresas o en pantalla.

## Antes de usarla con visitantes reales

- **Coordenadas:** las de `paquete.json` salen de OpenStreetMap y no son oficiales. En campo, usa «Fijar aquí» en cada estación (exige una precisión de 30 m o mejor) y luego publica el Paquete del parque para que lleguen a todos los teléfonos.
- **Aguacerales:** confirmar con PNN/UTON que es la primera parada y dónde para el grupo.
- **Lente:** reemplazar el modelo provisional de Commons por fotos tomadas en el parque.
- **Textos (es/en):** son borradores con fuente. Persona 1 debe validarlos con el PNN. La traducción al inglés también necesita revisión.
- **QR en la señalética:** requiere permiso del PNN. Los QR de fauna para imprimir están en el Modo equipo.
- **Clave del Modo guía:** cambia `guia.clave` y `guia.pin` en `paquete.json` antes de usarla con público.

## Probado de punta a punta

La prueba está en `pruebas/coleccion.py`. Usa Playwright con Chrome, perfil persistente, cámara simulada con videos de fotos reales en movimiento y GPS simulado. Cada cromo se ganó **por la interfaz**, como lo haría un visitante:

- La portada guarda el nombre.
- El Modo equipo funciona con PIN y entrenamiento.
- Con una sola clase entrenada, la Lente no inventa cromos.
- **GPS:** se caminó por las 4 estaciones (Brisas, Aguacerales, Arenales y Valle de las Tumbas). Quedaron 4 sobres esperando sin interrumpir, y se abrieron y pegaron.
- **Códigos del guía:** 4 historias con códigos que cambian cada 5 minutos; rechaza el incorrecto y el de otra historia.
- **Fotos:** funcionan la foto de grupo y «Ponerle mi foto».
- **Pausa:** 2 minutos reales; tocar la pantalla la reinicia.
- **Lente:** 7 clases reconocidas. El segundo frailejón no se entrega en el mismo sitio y sí a 45 m. Una imagen no entrenada responde «No estoy seguro».
- **QR:** los 6 de fauna, leídos con la cámara.
- **Final:** **24/24**, con celebración, descarga del álbum en PDF (9 páginas) y del cromo (1080×1620).
- **Persistencia:** al reabrir, el álbum sigue completo.
- **Modo avión:** cargan la app, el álbum y el modelo.
- **Ajustes:** funcionan el cambio a inglés y el tema noche.
- No hubo errores en la consola.

`pruebas/mapa.py` (con WebGL por software para el 3D) simula una caminata Brisas → Valle de las Tumbas con altura del GPS y revisa la bitácora (máxima, subida, distancia, tiempo, perfil y rastro), la hoja de cada estación, el código del guía como plan B, el aviso de altura que abre el chat, un teléfono sin altura por GPS y el permiso negado. También el relieve real en el plano, el 3D (girar con un dedo, tocar una estación) y volver al plano. `pruebas/gps_reintento.py` comprueba que, tras un error del GPS, se reintenta solo y registra la llegada.

`pruebas/chat_mapa.py` prueba la unión chat ↔ mapa (ver «Chat y mapa unidos»).

`pruebas/union.py` prueba la unión Lente → chat: la Lente reconoce un frailejón y abre el chat con el tema, las sugerencias, cuatro preguntas de seguimiento (incluida la regla de seguridad), quitar el tema, una foto desde el chat (reconocida y no reconocida), «Pegar y preguntar a Fray» desde un sobre y «Preguntar a Fray» desde el detalle.

`pruebas/guia_parque.py` prueba el Modo guía y el Paquete del parque con varios «teléfonos» (navegadores separados): el QR del guía escaneado por otro teléfono, el código «aquí», la confirmación de un frailejón sin Lente entrenada, QR falsos y vencidos, y un teléfono nuevo que reconoce con el `parque.json` publicado desde la galería.

**Pruebas nuevas en v4:**
- `instalar.py`: instalación, iPhone y navegadores internos.
- `album_pdf.py`: el PDF y el collage.
- `degradacion.py`: qué hace la app cuando falla la IA, la cámara o el GPS.
- `accesibilidad.py`: revisión WCAG con axe en todas las pantallas.
- `paradas.py`, `audio.py`, `tono.py`, `aclimatacion.py`, `avisos.py`, `companeros.py` y `dictado.py`.
- `lente.py`: el modelo base.
- `guia_visitante.py`: QR por la dirección.
- `atras.py`: botón «atrás».
- `mapa_album.py`: reglas de cromos, bitácora por jornada y caminar por el carreteable real gana las 4 estaciones.

Cómo correrlas: [pruebas/LEEME.md](pruebas/LEEME.md).

**Falta probar en celulares reales:** velocidad en gama baja (4 GB), la Lente con luz de páramo y la voz del sistema en cada marca.

## Estructura

```
index.html, styles.css, manifest.json, sw.js   interfaz y modo sin señal (avisa el progreso de descarga y se actualiza sola)
_headers, netlify.toml   configuración de Netlify (caché del service worker y de los modelos)
paquete.json      Paquete Páramo: estaciones, sendero, clases, capítulos, 24 cromos es/en, paradas, horario, fuentes y calibración de la Lente
js/app.js         arranque, navegación y pausa de contemplación
js/estado.js      colección, reglas, persistencia y miniaturas de fotos
js/album.js       páginas, giro de hoja, espacios, detalle y códigos
js/sobre.js       abrir sobres: rasgar, voltear, volar al espacio y estampar
js/cromo.js       componente de cromo (frente, dorso y brillo holográfico)
js/lente.js       cámara: reconocer, QR y foto
js/motor.js       puente con el motor de IA (pedidos al worker), errores y tiempos de carga
js/motor-worker.js  ONNX Runtime, modelos y tokenizador en segundo plano
js/ml.js          MobileNetV2 (ONNX) + k-NN con piso de similitud
js/sendero.js     el carreteable real: proyectar una posición y medir distancias por el camino
js/recorrido.js   respuestas del chat sobre el recorrido (falta, altura, dónde, cuánto llevas) y ubicación para emergencias
js/mapa.js        GPS (con reintento y pausa en segundo plano), geocercas, pliego, hoja de cada estación y panel «Tu recorrido»
js/relieve.js     relieve real: carga y altura del terreno en un punto
js/mapa3d.js      vista 3D (WebGL): malla, cámara con gestos, ruta, estaciones y etiquetas
js/bitacora.js    registro del recorrido: altura suavizada, distancia, subida, tiempo y perfil
js/portada.js     portada y estado sin señal
js/ajustes.js     ajustes, PIN, Modo equipo y Paquete del parque
js/guia.js        Modo guía: QR y códigos firmados que cambian cada 5 min, y su verificación sin internet
js/exportar.js    PNG de cromo, PDF del álbum completo y collage de fotos
js/chat.js        motor del chat: embedding de la pregunta, búsqueda híbrida (significado + palabras), umbrales y reglas de seguridad
js/chatui.js      pantalla «Pregúntale a Fray», tema activo, sugerencias del tema y «¿Qué es esto?» con foto
chat.json         71 fichas oficiales es/en con fuentes, formas de preguntar y ejemplos fuera de tema
js/art.js         24 ilustraciones risográficas y los 3 personajes (originales)
js/i18n.js        textos es/en
js/celebrar.js    chispas y lluvia de hojas
lib/              ONNX Runtime Web 1.31 (sus .mjs renombrados a .js), jsQR, qrcode-generator, @huggingface/tokenizers
models/           parque.json (Lente y estaciones publicadas por el equipo) · partes/ (motor WASM, modelo de la Lente y del chat, en trozos de 8 MB) · partes.json · e5_tokenizer.json · chat_indice.json
herramientas/     relieve.py (pliego y malla 3D desde Copernicus DEM), optimizar.py (pre-optimiza un modelo), tema_chat.py (mide el chat con tema), lente_base.py (Lente desde carpetas de fotos), partir/unir modelos, poda del modelo, índice y calibración del chat, comparación JS vs Python
fonts/            Bricolage Grotesque (variable) y Atkinson Hyperlegible, ambas con licencia OFL
licencias/        textos de licencias y autores de las fotos del modelo base de la Lente
docs/             arquitectura, decisiones, especificaciones, contratos, evaluación, investigación y un archivo por cambio
pruebas/          pruebas de punta a punta con Playwright (ver pruebas/LEEME.md) y bancos de preguntas del chat
```

Para cambiar textos o cromos, edita `paquete.json`. Si cambias archivos de la app, sube `VERSION` en `sw.js`.
