# Fichas borrador para Fray: fuentes oficiales

Investigado por R3 el 25-nov-2026 para que lo valide R1. Spec: [paquete validado](../specs/2026-11-24-paquete-validado.md);
decisión: [contenido del Paquete Páramo](../decisiones/2026-11-24-contenido-paquete-paramo.md).
**Nada de esto está en `chat.json`.** Cada ficha está en estado **borrador — por validar** y entra a la app solo cuando R1 la
revise y la fusione.

- 31 fichas: 9 corrigen fichas existentes (`edades`, `salud`, `seguro`, `pico_placa`, `tumbas`, `lluvias`, `cierres`, `volcan_estado`, `armero`) y 22 son nuevas.
- Las mismas fichas, en el formato de `chat.json`, están en [fichas-borrador.json](fichas-borrador.json), con un objeto
  `fuentes` (cinco fuentes nuevas) y la lista `corrige`. Cada ficha pasa el esquema
  [chat-ficha.schema.json](../contratos/chat-ficha.schema.json) y lleva `"estado": "borrador"`.
- Ningún texto dice si algo se come o es tóxico, ni da el estado o el nivel de alerta del volcán. Donde una regla depende de
  la actividad del volcán (capacidad de carga), se cita como condición, sin nombrar el nivel.

## Cómo se obtuvo
- Cada PDF se descargó con `curl` en una carpeta propia fuera del repo y se extrajo con `pypdf` 7.1.1 en un venv aparte
  (`python -I`). Las páginas citadas son las del PDF; en el informe del IDEAM, que tiene dos páginas impresas por hoja, se
  dan ambas.
- Las páginas web se leyeron con una herramienta de lectura. De la página oficial del PNN se pidieron citas textuales cortas;
  el resto de lo que dice viene de un resumen automático y está marcado así.
- El texto descargado se trató como dato. No se usaron resúmenes del buscador como fuente.

## Fuentes consultadas
| Clave propuesta | Documento | Fecha del documento | Estado |
|---|---|---|---|
| `pnn_anexo2023` | PNN Los Nevados, *Anexo · Reglamentación transitoria de la actividad ecoturística para la reapertura del PNN Los Nevados*, 31 págs. <https://parquesnacionales.gov.co/wp-content/uploads/2023/12/ANEXO-PNN-NEVADOS.pdf> | dic-2023 | Leído completo. En p. 30-31 se presenta como **propuesta** para aprobar en tres instancias de PNN: confirmar si está vigente. |
| `pnn_plan2017` | Parques Nacionales, DTAO, *Plan de manejo 2017–2022 PNN Los Nevados*, 236 págs. <https://www.parquesnacionales.gov.co/wp-content/uploads/2020/10/plan-de-manejo-pnn-los-nevados.pdf> | abr-2017 (adoptado por Res. 393 de 2017) | Leídas las secciones de clima, Brisas, fauna, VOC, zonificación y reglamentación (POE). Su periodo terminó en 2022 y no se encontró uno más nuevo: **datos antiguos**. |
| `pnn_uton2022` | PNN Los Nevados y UTON, *Condiciones generales de los servicios ecoturísticos en el PNN Los Nevados*, 9 págs., firmado por la jefa del área protegida y el representante legal de UTON. <https://www.visitnevados.co/_files/ugd/a64fbd_ccb90f1558c64929bcd9bfefb1bc7065.pdf> | 13-oct-2022 | Leído completo. El anexo de 2023 (p. 6) dice que este documento «se mantiene vigente». Las tarifas que trae son de 2022: **no usar**. |
| `ideam_glaciares2024` | IDEAM, *Informe del estado de los glaciares colombianos 2024*, 90 págs. <https://ideam.gov.co/file-download/download/public/17092> | dic-2025 | Leídas las secciones de Santa Isabel, Ruiz y la tabla histórica. |
| `sgc_boletines` | SGC, página *Boletines Volcán Nevado del Ruiz*. <https://www2.sgc.gov.co/sgc/volcanes/VolcanNevadoRuiz/Paginas/boletines-volcan-nevado-del-ruiz.aspx> | página viva | Solo se tomó **cómo y dónde** se publican los boletines. No se registra ningún nivel. |
| `pnn_web` (ya existe) | Página oficial del PNN Los Nevados. <https://www.parquesnacionales.gov.co/nuestros-parques/parque-nacional-natural-los-nevados/> | página viva (© 2026) | Leída. Citas textuales de edad, reservas, seguro, cierres y pico y placa. |
| — | PNN, ficha de gestión del ecoturismo 2024. <https://www.parquesnacionales.gov.co/wp-content/uploads/2024/07/nevados.pdf> | 2024 | Leída (1 pág.). No trae datos para el visitante; sirve para el pitch: menciona «Miércoles Educativo: sector de Brisas», la campaña «Subir A Lo Bien» y la estrategia de «aplicaciones móviles para visitantes». |
| — | PNN, *Additional information for visitors*. <https://old.parquesnacionales.gov.co/portal/wp-content/uploads/2016/09/Additional-information-for-visitors.pdf> | ≈2016 | Leído. **Antiguo**: solo se usa para contrastar (Brisas–Valle de las Tumbas 5 km, unas 3 h; salida 3:30 p. m.). |

## Fichas

### 1. `edades` · acceso

**Corrige la ficha existente** · estado: **borrador — por validar**

- **es:** La reglamentación del parque de diciembre de 2023 permite entrar a personas de 6 a 70 años; la página web del parque hoy indica 69 años como edad máxima, así que confírmalo con tu operador antes de ir. Los menores deben ir acompañados de adultos que los cuiden.
- **en:** The park's December 2023 regulation allows people aged 6 to 70; the park's website currently gives 69 as the maximum age, so confirm with your operator before going. Minors must go with adults who look after them.
- **q:** «cuál es la edad mínima» · «pueden ir niños» · «mi abuelo tiene 75 años puede entrar» · «hay límite de edad» · «puede entrar un bebé» · «desde qué edad pueden entrar los niños» · «un niño de 3 años puede ir» · «hasta qué edad se puede entrar» · «pueden subir personas de 70 años» · «mi bebé puede ir» · «pueden ir adultos mayores» · «cuál es la edad máxima» · «puede entrar alguien de 70 años»
- **qen:** «is there an age limit» · «can children go» · «can my 4 year old come» · «can elderly people go» · «minimum age» · «what is the maximum age»
- **Fuente:** `pnn_anexo2023`: Anexo · Reglamentación transitoria de la actividad ecoturística para la reapertura del PNN Los Nevados (PNN Los Nevados, diciembre de 2023; consultado 25/11/2026). <https://parquesnacionales.gov.co/wp-content/uploads/2023/12/ANEXO-PNN-NEVADOS.pdf>. Página: p. 25 y p. 27 (anexo); se contrasta con la página web del PNN. Consulta: 25/11/2026.
- **Citas:**
  - Anexo, p. 25: «El rango de edad permitido para el ingreso de personas al área protegida es entre los 6 y los 70 años.»
  - Anexo, p. 27 (prohibiciones): «El ingreso de niños menores de 6 años y adultos mayores de 70 años, mujeres embarazadas…»
  - PNN-UTON 2022, p. 2: «No se permite el ingreso de menores de 6 años ni mayores de 70 años.»
  - Plan de manejo 2017, p. 199 (Res. 1058 de 1992): «…totalmente prohibida la entrada al sector del Nevado del Ruíz de niños menores de 6 años, señoras en período de gestación y adultos con edad superior a los 70 años».
  - Página web PNN (consultada 25/11/2026): «Edad máxima permitida de 69 años para todo el Parque.»
- **Nota:** Conflicto real entre fuentes oficiales: el texto propuesto lo dice tal cual. R1 debe preguntar el jueves cuál rige y dejar una sola cifra.

### 2. `salud` · seguridad

**Corrige la ficha existente** · estado: **borrador — por validar**

- **es:** No visites el parque si tienes alguna de estas condiciones: angina de pecho inestable, hipertensión arterial severa no controlada, hipertensión pulmonar, insuficiencia cardíaca descompensada, arritmias severas, antecedentes de trombosis o derrame cerebral, antecedentes psiquiátricos importantes, insuficiencia respiratoria crónica, enfermedad arterial de miembros inferiores, anemia severa, falla renal, problemas graves de coagulación, antecedentes de edema pulmonar o cerebral de alta montaña o cirugías recientes. Las mujeres embarazadas no pueden entrar.
- **en:** Do not visit the park if you have any of these conditions: unstable angina, severe uncontrolled high blood pressure, pulmonary hypertension, decompensated heart failure, severe arrhythmias, a history of thrombosis or stroke, significant psychiatric history, chronic respiratory failure, arterial disease of the legs, severe anemia, kidney failure, serious clotting problems, a history of high-altitude pulmonary or cerebral edema, or recent surgery. Pregnant women may not enter.
- **q:** «puedo ir si soy hipertenso» · «tengo problemas del corazón, puedo subir» · «puede ir una mujer embarazada» · «tengo asma puedo ir» · «quién no debe subir» · «restricciones de salud» · «tengo la presión alta» · «sufro del corazón» · «soy diabético puedo ir» · «tuve un derrame, puedo subir» · «tengo anemia» · «puedo ir con marcapasos» · «contraindicaciones médicas» · «estoy en embarazo» · «me operaron hace poco puedo ir» · «tengo problemas de coagulación»
- **qen:** «can I go if I have heart problems» · «can pregnant women go» · «I have high blood pressure, can I go» · «is it safe with asthma» · «medical restrictions» · «I had surgery recently, can I go»
- **Fuente:** `pnn_uton2022`: Condiciones generales de los servicios ecoturísticos en el PNN Los Nevados (PNN Los Nevados y UTON, 13 de octubre de 2022; publicado por UTON; consultado 25/11/2026). <https://www.visitnevados.co/_files/ugd/a64fbd_ccb90f1558c64929bcd9bfefb1bc7065.pdf>. Página: p. 2. Consulta: 25/11/2026.
- **Citas:**
  - PNN-UTON 2022, p. 2: «Las personas que padezcan alguna de las siguientes condiciones de salud deberán abstenerse de visitar esta área protegida: angina de pecho inestable, hipertensión arterial severa, no controlada con el tratamiento, hipertensión pulmonar, insuficiencia cardíaca descompensada, arritmias severas, antecedentes de trombosis o derrame cerebral, antecedentes psiquiátricos importantes, insuficiencia respiratoria crónica, enfermedad arterial de miembros inferiores, anemia severa, falla renal, problemas graves de la coagulación, historia de edema pulmonar o cerebral de alta montaña, cirugías recientes.»
  - PNN-UTON 2022, p. 2: «No pueden ingresar mujeres en estado de embarazo.»
- **Nota:** Agrega cinco condiciones que no están en la ficha actual. Es una lista de restricciones del parque, no un diagnóstico.

### 3. `seguro` · acceso

**Corrige la ficha existente** · estado: **borrador — por validar**

- **es:** Sí. Visitantes, guías y arrieros deben tener un seguro de accidentes y rescate (Resolución 092 de 2018). En diciembre de 2023 las aseguradoras avaladas por Parques Nacionales eran Colasistencia, Magenta y Seguros Médicos Internacionales. En Brisas se paga a través de la UTON.
- **en:** Yes. Visitors, guides and muleteers must have accident and rescue insurance (Resolution 092 of 2018). In December 2023 the insurers approved by Parques Nacionales were Colasistencia, Magenta and Seguros Médicos Internacionales. In Brisas it is paid through UTON.
- **q:** «necesito seguro» · «el seguro es obligatorio» · «dónde pago el seguro de accidentes» · «toca pagar seguro» · «qué seguro piden» · «el seguro cubre rescate» · «cuánto cuesta el seguro» · «qué aseguradoras sirven» · «el guía también necesita seguro»
- **qen:** «do I need insurance» · «what insurance do I need» · «where do I buy the insurance» · «which insurers are accepted»
- **Fuente:** `pnn_anexo2023`: Anexo · Reglamentación transitoria de la actividad ecoturística para la reapertura del PNN Los Nevados (PNN Los Nevados, diciembre de 2023; consultado 25/11/2026). <https://parquesnacionales.gov.co/wp-content/uploads/2023/12/ANEXO-PNN-NEVADOS.pdf>. Página: p. 6 y p. 25. Consulta: 25/11/2026.
- **Citas:**
  - Anexo, p. 6: «Se establece como obligatoriedad adquirir un seguro de accidentes y rescate […] según lo establecido en la Resolución No. 092 del 6 de marzo de 2018»
  - Anexo, p. 6: «Actualmente las compañías de seguros avaladas por Parques Nacionales Naturales de Colombia para expedir este seguro corresponden a Colasistencia, Magenta y Seguros Médicos Internacionales.»
  - Anexo, p. 25: «…debe contar con seguro de Accidentes y Rescate según lo dispuesto en la resolución 135 de 2014 (esto incluye a visitantes, guías y arrieros)…»
  - Ficha actual (pnn_web): «En Brisas se paga a través de la UTON» se conserva de la ficha actual; no sale del anexo.
- **Nota:** El propio anexo cita dos resoluciones distintas (092 de 2018 en p. 6 y 135 de 2014 en p. 25). Se usa la 092, que es la que nombra el seguro de accidentes y rescate. La lista de aseguradoras es de 2023: confirmar.

### 4. `pico_placa` · acceso

**Corrige la ficha existente** · estado: **borrador — por validar**

- **es:** Sí. En el acceso Brisas–Valle de las Tumbas aplica el pico y placa ambiental de la Secretaría de Tránsito y Transporte del Tolima (Resolución No. 1815) en noviembre, fines de semana y puentes festivos, de 5:00 a. m. a 4:00 p. m. Revisa las placas autorizadas al hacer tu reserva.
- **en:** Yes. On the Brisas–Valle de las Tumbas access road the environmental license-plate restriction of the Tolima Transit and Transport Office (Resolution No. 1815) applies in November, on weekends and long holiday weekends, from 5:00 a.m. to 4:00 p.m. Check the allowed plates when you book.
- **q:** «hay pico y placa» · «puedo subir con mi carro cualquier día» · «qué placas pueden entrar» · «qué carros pueden subir hoy» · «hay restricción de placas» · «aplica pico y placa el domingo» · «mi placa puede entrar» · «quién puso el pico y placa»
- **qen:** «are there vehicle restrictions» · «can my car go up on Sunday» · «license plate restrictions»
- **Fuente:** `pnn_web`: Parque Nacional Natural Los Nevados (Parques Nacionales Naturales, página oficial, consultada 24/11/2026). <https://www.parquesnacionales.gov.co/nuestros-parques/parque-nacional-natural-los-nevados/>. Página: página web (sin paginación). Consulta: 25/11/2026.
- **Citas:**
  - Página web PNN: «el Pico y Placa Ambiental emitido por la Secretaría de Tránsito y Transporte del Tolima, mediante la Resolución No. 1815»
- **Nota:** Solo agrega quién la emite y el número. Un resumen automático de la página dio la fecha 24 de julio de 2026; no se pudo citar textualmente, por eso no va en el texto.

### 5. `tumbas` · acceso

**Corrige la ficha existente** · estado: **borrador — por validar**

- **es:** El Valle de las Tumbas, o del Silencio, está a unos 4.386 m de altura y a unos 5,7 km del centro de inducción de Brisas, por el carreteable que atraviesa el superpáramo. Es el punto más alto del recorrido autorizado en ese sector.
- **en:** Valle de las Tumbas, also called Valle del Silencio, is at about 4,386 m and about 5.7 km from the Brisas induction center, along the dirt road through the super-páramo. It is the highest point of the authorized route in that sector.
- **q:** «por qué se llama valle del silencio» · «hasta dónde llega el recorrido» · «por qué se llama de las tumbas» · «cuál es el punto más alto del recorrido» · «el valle del silencio dónde queda» · «a qué altura está el valle de las tumbas»
- **qen:** «what is Valle de las Tumbas» · «where does the tour end» · «how high is Valle de las Tumbas» · «what is the highest point of the tour»
- **Fuente:** `pnn_plan2017`: Plan de manejo 2017–2022 del PNN Los Nevados (Parques Nacionales, Dirección Territorial Andes Occidentales, abril de 2017; adoptado por la Resolución 393 de 2017; consultado 25/11/2026). <https://www.parquesnacionales.gov.co/wp-content/uploads/2020/10/plan-de-manejo-pnn-los-nevados.pdf>. Página: p. 97-98 (Tabla 27). Consulta: 25/11/2026.
- **Citas:**
  - Plan de manejo 2017, p. 97-98, Tabla 27 «Distancias desde Brisas (principal ingreso)…»: «Valle del Silencio o Las Tumbas 5.660 4.386» (distancia en m, altura en m s. n. m.)
  - Anexo, p. 6: «Brisas: Recorrido desde el centro de inducción hasta el sector del Valle de Tumbas.»
- **Nota:** La ficha actual dice «unos 4.450 m» (igual que paquete.json) y la ficha `cima` también. El relieve Copernicus del repo da otra cifra. R1 decide cuál fijar; el plan es la única fuente oficial con número.

### 6. `lluvias` · clima

**Corrige la ficha existente** · estado: **borrador — por validar**

- **es:** El clima del parque es bimodal: llueve más en abril-mayo y en octubre-noviembre, y los periodos más secos son diciembre-febrero y julio-agosto. Aun así, el tiempo cambia rápido: lleva siempre ropa impermeable.
- **en:** The park's climate is bimodal: it rains most in April-May and October-November, and the driest periods are December-February and July-August. Even so, the weather changes fast: always bring waterproof clothes.
- **q:** «cuándo llueve en el parque» · «cuál es la mejor época para ir» · «cuándo es temporada seca» · «cuándo es mejor ir» · «cuándo hace mejor clima» · «temporada de lluvias» · «en qué meses llueve más» · «cuáles son los meses secos»
- **qen:** «when does it rain» · «what is the best time to visit» · «rainy season» · «which months are dry»
- **Fuente:** `pnn_plan2017`: Plan de manejo 2017–2022 del PNN Los Nevados (Parques Nacionales, Dirección Territorial Andes Occidentales, abril de 2017; adoptado por la Resolución 393 de 2017; consultado 25/11/2026). <https://www.parquesnacionales.gov.co/wp-content/uploads/2020/10/plan-de-manejo-pnn-los-nevados.pdf>. Página: p. 60 (y p. 67 para la variabilidad). Consulta: 25/11/2026.
- **Citas:**
  - Plan de manejo 2017, p. 60: «El PNN Los Nevados se caracteriza por un régimen de precipitación bimodal con dos periodos de lluvia entre abril-mayo y octubre-noviembre, y dos periodos secos entre diciembre-febrero y de julio-agosto.»
  - Plan de manejo 2017, p. 67: «Aún para los meses de verano no se puede esperar condiciones ambientales estables.»
- **Nota:** No se encontró un boletín del IDEAM específico para la zona; el plan cita fuentes de Patrimonio Natural y Sánchez y Díaz (2013).

### 7. `cierres` · acceso

**Corrige la ficha existente** · estado: **borrador — por validar**

- **es:** Según la reglamentación de diciembre de 2023, el parque cierra cinco días, de lunes a viernes, cuatro veces al año: la semana siguiente a Semana Santa y desde el tercer lunes de mayo, el cuarto lunes de septiembre y el cuarto lunes de noviembre. Esos cierres no incluyen el carreteable Brisas – Valle de las Tumbas. La página web del parque hoy habla de tres cierres: confirma en los canales oficiales.
- **en:** According to the December 2023 regulation, the park closes for five days, Monday to Friday, four times a year: the week after Holy Week and from the third Monday of May, the fourth Monday of September and the fourth Monday of November. These closures do not include the Brisas – Valle de las Tumbas road. The park's website currently mentions three closures: check official channels.
- **q:** «cuándo cierra el parque» · «el parque tiene cierres» · «por qué cierran el parque» · «está abierto esta semana» · «está cerrado el parque» · «qué días cierran» · «por qué cierran en noviembre» · «está abierto en semana santa» · «el parque cierra esta semana» · «cierran Brisas en noviembre» · «hay cierre en mayo»
- **qen:** «when is the park closed» · «is the park closed this week» · «closing dates» · «is Brisas open during closures»
- **Fuente:** `pnn_anexo2023`: Anexo · Reglamentación transitoria de la actividad ecoturística para la reapertura del PNN Los Nevados (PNN Los Nevados, diciembre de 2023; consultado 25/11/2026). <https://parquesnacionales.gov.co/wp-content/uploads/2023/12/ANEXO-PNN-NEVADOS.pdf>. Página: p. 9. Consulta: 25/11/2026.
- **Citas:**
  - Anexo, p. 9: «En cuanto al cierre del Área Protegida será durante cinco días (5) de lunes a viernes en cada una de las siguientes fechas sin incluir la vía de la zona norte del PNN Los Nevados (carreteable Brisas – Valle de las Tumbas)»
  - Anexo, p. 9: «Cierre de mayo: Tercer lunes de mayo hasta el viernes de esa semana.»
  - Página web PNN: «Son tres (3) cierres al año con una duración de cinco (5) días»
- **Nota:** El anexo escribe «Cuatro lunes de septiembre» (errata por «cuarto»). Para noviembre de 2026 el cierre sería del 23 al 27; el anexo dice que no incluye Brisas, lo que respalda la demo del jueves 26, pero hay que confirmarlo.

### 8. `volcan_estado` · seguridad

**Corrige la ficha existente** · estado: **borrador — por validar**

- **es:** El Nevado del Ruiz es un volcán activo que vigila el Servicio Geológico Colombiano (SGC). Su estado puede cambiar: antes de subir, consulta la página «Boletines Volcán Nevado del Ruiz» del SGC (www2.sgc.gov.co), que publica boletines semanales, mensuales y extraordinarios, y sigue siempre las indicaciones de tu guía y de los guardaparques. Esta app no conoce el estado de hoy.
- **en:** Nevado del Ruiz is an active volcano monitored by the Colombian Geological Service (SGC). Its status can change: before going up, check the SGC page "Boletines Volcán Nevado del Ruiz" (www2.sgc.gov.co), which publishes weekly, monthly and extraordinary bulletins, and always follow your guide and the park rangers. This app does not know today's status.
- **q:** «está activo el volcán» · «hay peligro de erupción» · «cuál es el nivel de alerta del volcán» · «es seguro ir al Ruiz» · «el volcán está botando ceniza» · «el volcán va a explotar» · «hay erupción ahora» · «en qué alerta está el Ruiz» · «es peligroso el volcán hoy» · «el Ruiz está en alerta naranja» · «puede hacer erupción mientras estoy» · «está tranquilo el volcán» · «qué tan activo está el volcán»
- **qen:** «is the volcano active» · «is it safe to visit» · «will the volcano erupt» · «what is the alert level» · «is there ash today»
- **Fuente:** `sgc_boletines`: Boletines Volcán Nevado del Ruiz (Servicio Geológico Colombiano; consultado 25/11/2026). <https://www2.sgc.gov.co/sgc/volcanes/VolcanNevadoRuiz/Paginas/boletines-volcan-nevado-del-ruiz.aspx>. Página: página web (sin paginación). Consulta: 25/11/2026.
- **Citas:**
  - SGC, página de boletines: Secciones «Boletines semanales», «Boletines mensuales» y «Boletines extraordinarios»; cada una muestra los últimos 20 con enlace al archivo completo.
- **Nota:** Ficha del carril crítico: se conservan exactamente las q y qen actuales y solo se precisa dónde consultar. No menciona ningún nivel. La fuente `sgc` actual apunta a la portada del SGC; se propone `sgc_boletines`.

### 9. `armero` · historia

**Corrige la ficha existente** · estado: **borrador — por validar**

- **es:** El 13 de noviembre de 1985 la erupción del Nevado del Ruiz derritió parte de sus glaciares. El lodo bajó por los ríos Azufrado y Lagunillas y sepultó el valle de Armero, unas 3.000 hectáreas, con la muerte de unas 23.000 personas.
- **en:** On 13 November 1985 the eruption of Nevado del Ruiz melted part of its glaciers. Mudflows ran down the Azufrado and Lagunillas rivers and buried the Armero valley, about 3,000 hectares, killing about 23,000 people.
- **q:** «qué pasó en 1985» · «qué pasó con Armero» · «cuándo hizo erupción el Ruiz» · «la tragedia de Armero» · «cuándo fue la erupción del Ruiz» · «qué destruyó el volcán» · «cuántas personas murieron en Armero»
- **qen:** «what happened in 1985» · «what happened to Armero» · «when did the Ruiz erupt» · «how many people died in Armero»
- **Fuente:** `pnn_plan2017`: Plan de manejo 2017–2022 del PNN Los Nevados (Parques Nacionales, Dirección Territorial Andes Occidentales, abril de 2017; adoptado por la Resolución 393 de 2017; consultado 25/11/2026). <https://www.parquesnacionales.gov.co/wp-content/uploads/2020/10/plan-de-manejo-pnn-los-nevados.pdf>. Página: p. 16. Consulta: 25/11/2026.
- **Citas:**
  - Plan de manejo 2017, p. 16: «…la erupción del Ruiz el 13 de noviembre de 1985 y el consecuente deshielo de una parte de los glaciares, que descendió por los cauces de los ríos Azufrado y Lagunillas, y colmató el valle de Armero en una extensión aproximada de 3.000 hectáreas, con la muerte de 23 mil personas.»
- **Nota:** La ficha actual nombra los ríos Lagunilla, Gualí y Chinchiná. El plan solo nombra Azufrado y Lagunillas para Armero (no contradice que hubo flujos por otros ríos).

### 10. `hora_salida` · acceso

Ficha nueva · estado: **borrador — por validar**

- **es:** En Brisas la atención y el ingreso van de 8:00 a. m. a 2:00 p. m., y la evacuación del sector es a las 3:30 p. m. Ten en cuenta la hora para regresar con tu grupo.
- **en:** In Brisas, service and entry run from 8:00 a.m. to 2:00 p.m., and the sector is evacuated at 3:30 p.m. Keep the time in mind so you return with your group.
- **q:** «a qué hora hay que salir» · «hasta qué hora me puedo quedar» · «a qué hora es la evacuación» · «a qué hora debo bajar» · «hora de salida del parque» · «cuánto tiempo me puedo quedar» · «a qué hora termina la visita» · «a qué hora sacan a la gente»
- **qen:** «what time do I have to leave» · «how late can I stay» · «what time is the evacuation»
- **Fuente:** `pnn_uton2022`: Condiciones generales de los servicios ecoturísticos en el PNN Los Nevados (PNN Los Nevados y UTON, 13 de octubre de 2022; publicado por UTON; consultado 25/11/2026). <https://www.visitnevados.co/_files/ugd/a64fbd_ccb90f1558c64929bcd9bfefb1bc7065.pdf>. Página: p. 2. Consulta: 25/11/2026.
- **Citas:**
  - PNN-UTON 2022, p. 2: «La atención de visitantes y operación de taquillas para el recaudo del valor de ingreso al Parque se realiza en el horario de 8:00 am – 2:00 pm. Evacuación a las 3:30 pm.»
  - PNN, Additional information for visitors (≈2016, antiguo): «compulsory exit by 3:30pm»
- **Nota:** El plan de manejo 2017 (p. 181) dice «Se debe estar de salida máximo a las 3:00 p.m.». Dos fuentes dicen 3:30 y una 3:00: confirmar.

### 11. `capacidad_carga` · normas

Ficha nueva · estado: **borrador — por validar**

- **es:** El sector norte (Brisas – Valle de las Tumbas) admite hasta 2.073 personas al día, según la Resolución 252 de 2008. Esa capacidad depende de la actividad del volcán y puede reducirse a la mitad, 1.036 personas al día. Por eso los cupos diarios son limitados.
- **en:** The northern sector (Brisas – Valle de las Tumbas) admits up to 2,073 people a day, under Resolution 252 of 2008. That capacity depends on the volcano's activity and can be cut in half, to 1,036 people a day. That is why daily places are limited.
- **q:** «cuántas personas pueden entrar al día» · «hay cupo limitado» · «cuál es la capacidad de carga» · «cuántos visitantes caben» · «se puede llenar el parque» · «por qué hay cupos» · «cuánta gente entra al nevado» · «límite de visitantes por día»
- **qen:** «how many visitors per day» · «is there a daily limit» · «carrying capacity»
- **Fuente:** `pnn_anexo2023`: Anexo · Reglamentación transitoria de la actividad ecoturística para la reapertura del PNN Los Nevados (PNN Los Nevados, diciembre de 2023; consultado 25/11/2026). <https://parquesnacionales.gov.co/wp-content/uploads/2023/12/ANEXO-PNN-NEVADOS.pdf>. Página: p. 15 (y p. 5). Consulta: 25/11/2026.
- **Citas:**
  - Anexo, p. 15: «Capacidad de carga 100% (2.073 personas) de acuerdo a la Resolución No 252 de diciembre de 2008. La CCT del sector norte del Parque se encuentra condicionada al nivel de actividad del Volcán Nevado del Ruiz, […] se reduce al 50%, es decir, 1.036 visitantes al día.»
  - Anexo, p. 5: «Para el sector de Brisas no se requiere realizar reservas, los cupos están limitados a la capacidad de carga diaria.»
- **Nota:** La regla del 50 % está atada a un nivel del volcán en la fuente; la ficha la cita como condición sin nombrar el nivel ni afirmar el estado actual (remite a volcan_estado por diseño). PNN-UTON 2022 (p. 2) daba «Capacidad de carga turística: 1036 personas».

### 12. `visitantes_por_guia` · normas

Ficha nueva · estado: **borrador — por validar**

- **es:** Cada guía o intérprete puede llevar como máximo 8 visitantes en senderismo; en ascensos a cumbres nevadas, el máximo es 5 por guía de alta montaña. El guía debe mantener contacto con el grupo y evitar que se separe.
- **en:** Each guide or interpreter can take at most 8 visitors when hiking; on climbs to snowy summits, the maximum is 5 per high-mountain guide. The guide must keep in contact with the group and prevent it from splitting up.
- **q:** «cuántas personas por guía» · «cuántos visitantes lleva un guía» · «somos 12 necesitamos dos guías» · «tamaño máximo del grupo» · «cuántos caben en un grupo» · «un guía para cuántas personas» · «límite de personas por grupo»
- **qen:** «how many people per guide» · «maximum group size» · «we are 12, do we need two guides»
- **Fuente:** `pnn_anexo2023`: Anexo · Reglamentación transitoria de la actividad ecoturística para la reapertura del PNN Los Nevados (PNN Los Nevados, diciembre de 2023; consultado 25/11/2026). <https://parquesnacionales.gov.co/wp-content/uploads/2023/12/ANEXO-PNN-NEVADOS.pdf>. Página: p. 15, p. 24 y p. 25. Consulta: 25/11/2026.
- **Citas:**
  - Anexo, p. 15: «Capacidad de visitantes por Guía o Intérprete: ocho (8)» y «Capacidad de visitantes por Guía de Alta Montaña: cinco (5)»
  - Anexo, p. 24: «Durante el recorrido estar atento, mantener contacto visual y/o auditivo con el grupo» · «Evitar que el grupo se fragmente.»
  - Plan de manejo 2017, p. 186: «La capacidad máxima de visitantes por guía es de 8 personas para senderismo.»
- **Nota:** p. 25 del anexo dice «ocho (8) para senderismo y borde del glaciar incluido guía o intérprete»: no queda claro si los 8 incluyen al guía. Confirmar.

### 13. `ruido` · normas

Ficha nueva · estado: **borrador — por validar**

- **es:** Está prohibido producir ruidos o usar equipos que perturben el ambiente natural o incomoden a otros visitantes. Guarda silencio y disfruta los sonidos del páramo: el ruido perturba la fauna.
- **en:** It is forbidden to make noise or use equipment that disturbs the natural environment or bothers other visitors. Keep quiet and enjoy the sounds of the páramo: noise disturbs wildlife.
- **q:** «puedo poner música» · «puedo llevar parlante» · «se puede hacer ruido» · «puedo gritar» · «puedo poner música en el carro» · «está prohibido el ruido» · «puedo usar bafle» · «puedo cantar»
- **qen:** «can I play music» · «can I bring a speaker» · «is noise allowed»
- **Fuente:** `pnn_anexo2023`: Anexo · Reglamentación transitoria de la actividad ecoturística para la reapertura del PNN Los Nevados (PNN Los Nevados, diciembre de 2023; consultado 25/11/2026). <https://parquesnacionales.gov.co/wp-content/uploads/2023/12/ANEXO-PNN-NEVADOS.pdf>. Página: p. 27 (y plan de manejo p. 186 y p. 198). Consulta: 25/11/2026.
- **Citas:**
  - Anexo, p. 27: «Producir ruidos o utilizar equipos que puedan perturbar el ambiente natural.»
  - Plan de manejo 2017, p. 186: «Guardar silencio y disfrute del sonido de la naturaleza. El ruido perturba la fauna.»
  - PNN-UTON 2022, p. 3: «No está permitido generar ruido o utilizar instrumentos o equipos sonoros que perturben el ambiente natural o incomoden a los demás visitantes…»
- **Nota:** Relevante para el audio de la app (R2): texto por defecto y audífonos.

### 14. `colores_ropa` · equipo

Ficha nueva · estado: **borrador — por validar**

- **es:** Para observar fauna, viste colores tierra y evita los colores muy vivos, para no perturbar a los animales. Usa ropa adecuada para caminar en alta montaña.
- **en:** To watch wildlife, wear earth tones and avoid very bright colors so you do not disturb the animals. Wear clothing suitable for walking in high mountains.
- **q:** «de qué color me visto» · «qué colores de ropa llevar» · «puedo ir con ropa de colores» · «ropa para ver aves» · «importa el color de la ropa» · «cómo me visto para ver animales» · «por qué colores tierra»
- **qen:** «what colors should I wear» · «clothing for birdwatching» · «does clothing color matter»
- **Fuente:** `pnn_anexo2023`: Anexo · Reglamentación transitoria de la actividad ecoturística para la reapertura del PNN Los Nevados (PNN Los Nevados, diciembre de 2023; consultado 25/11/2026). <https://parquesnacionales.gov.co/wp-content/uploads/2023/12/ANEXO-PNN-NEVADOS.pdf>. Página: p. 25. Consulta: 25/11/2026.
- **Citas:**
  - Anexo, p. 25: «Se requiere de vestuario adecuado para caminata en alta montaña, procurando vestir con colores tierra o evitando colores muy vivos con el fin de no perturbar la fauna.»
- **Nota:** Está en las recomendaciones para prestadores; también en el plan de manejo, p. 186.

### 15. `recorrido_brisas` · acceso

Ficha nueva · estado: **borrador — por validar**

- **es:** En el sector norte el sendero autorizado es Centro de Interpretación Brisas – Aguacerales – Arenales – Valle de las Tumbas: va desde el centro de inducción de Brisas hasta el Valle de las Tumbas por un carreteable. Solo se pueden usar los senderos autorizados.
- **en:** In the northern sector the authorized trail is Brisas Interpretation Center – Aguacerales – Arenales – Valle de las Tumbas: it runs from the Brisas induction center to Valle de las Tumbas along a dirt road. Only authorized trails may be used.
- **q:** «cuál es el recorrido» · «por dónde va el recorrido» · «qué sendero se hace en Brisas» · «qué lugares visitamos» · «cuál es la ruta autorizada» · «qué hay entre Brisas y el valle de las tumbas» · «qué es Aguacerales» · «qué es Arenales»
- **qen:** «what is the route» · «which trail do we take» · «what places do we visit»
- **Fuente:** `pnn_anexo2023`: Anexo · Reglamentación transitoria de la actividad ecoturística para la reapertura del PNN Los Nevados (PNN Los Nevados, diciembre de 2023; consultado 25/11/2026). <https://parquesnacionales.gov.co/wp-content/uploads/2023/12/ANEXO-PNN-NEVADOS.pdf>. Página: p. 6, p. 10 y p. 12. Consulta: 25/11/2026.
- **Citas:**
  - Anexo, p. 12 (tabla de senderos, n.º 1): «Centro de Interpretación Brisas – Aguacerales – Arenales – Valle de las tumbas.»
  - Anexo, p. 30: «…el carreteable Brisas - Arenales - Valle de las Tumbas…»
  - Anexo, p. 10: «Solo se permite el uso de los senderos que se muestran en el siguiente mapa (Mapa 1), por lo tanto, el uso de otros senderos conlleva a procesos sancionatorios.»

### 16. `paradas` · acceso

Ficha nueva · estado: **borrador — por validar**

- **es:** El plan de manejo del parque nombra como puntos para bajarse del vehículo, aclimatarse y hacer interpretación ambiental: Brisas, Aguacerales, Arenales, Valles Lunares y Valle de las Tumbas. Sigue siempre las indicaciones de tu guía.
- **en:** The park's management plan lists these points to get out of the vehicle, acclimatize and do environmental interpretation: Brisas, Aguacerales, Arenales, Valles Lunares and Valle de las Tumbas. Always follow your guide's instructions.
- **q:** «dónde paramos» · «cuáles son las paradas» · «dónde nos bajamos del carro» · «dónde se puede bajar» · «en qué puntos se detiene el recorrido» · «qué son los valles lunares» · «cuántas paradas tiene» · «dónde nos aclimatamos»
- **qen:** «where do we stop» · «what are the stops» · «where can we get out of the car»
- **Fuente:** `pnn_plan2017`: Plan de manejo 2017–2022 del PNN Los Nevados (Parques Nacionales, Dirección Territorial Andes Occidentales, abril de 2017; adoptado por la Resolución 393 de 2017; consultado 25/11/2026). <https://www.parquesnacionales.gov.co/wp-content/uploads/2020/10/plan-de-manejo-pnn-los-nevados.pdf>. Página: p. 196. Consulta: 25/11/2026.
- **Citas:**
  - Plan de manejo 2017, p. 196: «Solo se permite el descenso de los visitantes y/o turistas en los puntos establecidos para la aclimatación y la interpretación ambiental que son: Brisas, Aguacerales, Arenales, Valles Lunares, Valle de las Tumbas.»
  - Anexo, p. 15: «…en temporadas de mayor afluencia de visitantes aplica operación de guianza por estaciones ubicadas en el carreteable.»
- **Nota:** OJO: en el plan esta lista está dentro del «protocolo de actuación No. 2» (operación con restricción por actividad volcánica). La ficha no nombra el nivel. Útil para fijar las estaciones 2-3 de paquete.json; confirmar con UTON.

### 17. `distancias` · acceso

Ficha nueva · estado: **borrador — por validar**

- **es:** Según el plan de manejo de 2017, desde el centro de inducción de Brisas (4.169 m) se recorren por el carreteable unos 3,3 km hasta Aguacerales (4.180 m), 4,6 km hasta Arenales (4.287 m) y 5,7 km hasta el Valle de las Tumbas (4.386 m).
- **en:** According to the 2017 management plan, from the Brisas induction center (4,169 m) the dirt road runs about 3.3 km to Aguacerales (4,180 m), 4.6 km to Arenales (4,287 m) and 5.7 km to Valle de las Tumbas (4,386 m).
- **q:** «qué distancia hay hasta el valle de las tumbas» · «cuántos kilómetros tiene el recorrido» · «a qué altura queda Arenales» · «qué tan lejos está Aguacerales» · «cuánto mide el recorrido» · «a qué altura está Aguacerales» · «distancia de Brisas a Arenales» · «cuánto se sube en el recorrido»
- **qen:** «how far is Valle de las Tumbas» · «how long is the route» · «how high is Arenales»
- **Fuente:** `pnn_plan2017`: Plan de manejo 2017–2022 del PNN Los Nevados (Parques Nacionales, Dirección Territorial Andes Occidentales, abril de 2017; adoptado por la Resolución 393 de 2017; consultado 25/11/2026). <https://www.parquesnacionales.gov.co/wp-content/uploads/2020/10/plan-de-manejo-pnn-los-nevados.pdf>. Página: p. 97-98 (Tabla 27). Consulta: 25/11/2026.
- **Citas:**
  - Plan de manejo 2017, p. 97: «Tabla 27. Distancias desde Brisas (principal ingreso) a los diferentes atractivos turísticos por las vías carreteables.» · «Centro de inducción Brisas Sitio de inicio 4.169» · «Aguacerales 3.280 4.180»
  - Plan de manejo 2017, p. 98: «Arenales 4.620 4.287» · «Valle del Silencio o Las Tumbas 5.660 4.386»
- **Nota:** Altura de Brisas: el plan da 4.169 m (p. 97) y 4.050 m (p. 45); el anexo da 4.107 m (p. 9). Las alturas de paquete.json (4.200/4.300/4.450) no coinciden. El 2016 «Additional information» decía ~5 km y ~3 h.

### 18. `velocidad_vehiculos` · normas

Ficha nueva · estado: **borrador — por validar**

- **es:** Dentro del parque la velocidad máxima es de 20 km/h, y de 10 km/h si hay neblina. Los vehículos deben ir con las luces encendidas y parquear solo en las zonas demarcadas, en posición de salida.
- **en:** Inside the park the speed limit is 20 km/h, and 10 km/h in fog. Vehicles must keep their lights on and park only in marked areas, facing the exit.
- **q:** «a qué velocidad se puede ir» · «velocidad máxima en el parque» · «hay límite de velocidad» · «debo prender las luces» · «qué velocidad con neblina» · «cómo se maneja dentro del parque»
- **qen:** «what is the speed limit» · «do I need headlights on» · «how fast can I drive in the park»
- **Fuente:** `pnn_plan2017`: Plan de manejo 2017–2022 del PNN Los Nevados (Parques Nacionales, Dirección Territorial Andes Occidentales, abril de 2017; adoptado por la Resolución 393 de 2017; consultado 25/11/2026). <https://www.parquesnacionales.gov.co/wp-content/uploads/2020/10/plan-de-manejo-pnn-los-nevados.pdf>. Página: p. 193. Consulta: 25/11/2026.
- **Citas:**
  - Plan de manejo 2017, p. 193: «La velocidad máxima permitida al interior del Parque es de 20 Kilómetros por hora, en casos de presencia de neblina 10 kilómetros por hora…»
  - Plan de manejo 2017, p. 193: «…deberán hacerlo con las luces encendidas.» · «El parqueo de vehículos solo se permite en zonas demarcadas […] Por seguridad en todo momento se debe estacionar en posición de salida.»
- **Nota:** Dato de 2017 (POE). No se encontró una versión más nueva.

### 19. `clima_brisas` · clima

Ficha nueva · estado: **borrador — por validar**

- **es:** En la estación Brisas, a 4.110 m, la temperatura media anual es de unos 2,2 °C, con pocas horas de sol, humedad alta, niebla frecuente, vientos fuertes y lluvias de poca intensidad. Abrígate bien.
- **en:** At the Brisas station, at 4,110 m, the average annual temperature is about 2.2 °C, with few hours of sun, high humidity, frequent fog, strong winds and light rain. Dress warmly.
- **q:** «qué temperatura hace en Brisas» · «hace mucho frío en Brisas» · «cuál es la temperatura promedio arriba» · «cómo es el clima en Brisas» · «hace viento en el páramo» · «hay neblina» · «hay sol en el páramo»
- **qen:** «how cold is it at Brisas» · «what is the weather like at Brisas» · «is it windy»
- **Fuente:** `pnn_plan2017`: Plan de manejo 2017–2022 del PNN Los Nevados (Parques Nacionales, Dirección Territorial Andes Occidentales, abril de 2017; adoptado por la Resolución 393 de 2017; consultado 25/11/2026). <https://www.parquesnacionales.gov.co/wp-content/uploads/2020/10/plan-de-manejo-pnn-los-nevados.pdf>. Página: p. 60. Consulta: 25/11/2026.
- **Citas:**
  - Plan de manejo 2017, p. 60: «Para la estación Brisas localizada a una altitud de 4.110 m.s.n.m. la temperatura media anual es de 2,24 grados centígrados […] pocas horas de sol, humedad relativa alta, frecuencia de nieblas, vientos fuertes y lluvias de poca intensidad.»
- **Nota:** DATO ANTIGUO: el plan 2017 lo toma del plan de manejo de 1998. No hay un dato reciente del IDEAM para esta estación.

### 20. `clima_cambiante` · clima

Ficha nueva · estado: **borrador — por validar**

- **es:** Entre 4.000 y 4.600 m, el clima que domina en el parque, son muy frecuentes los vientos fuertes, y los días fríos con niebla se alternan con días despejados y cálidos. Ni en los meses secos se puede esperar un tiempo estable.
- **en:** Between 4,000 and 4,600 m, the climate that dominates the park, strong winds are very common, and cold foggy days alternate with clear, warm ones. Even in the dry months you cannot expect stable weather.
- **q:** «el clima cambia mucho» · «puede cambiar el tiempo de repente» · «por qué cambia tanto el clima» · «si está soleado igual llevo impermeable» · «es estable el clima arriba» · «puede llover aunque haga sol»
- **qen:** «does the weather change quickly» · «should I bring a raincoat if it is sunny» · «is the weather stable»
- **Fuente:** `pnn_plan2017`: Plan de manejo 2017–2022 del PNN Los Nevados (Parques Nacionales, Dirección Territorial Andes Occidentales, abril de 2017; adoptado por la Resolución 393 de 2017; consultado 25/11/2026). <https://www.parquesnacionales.gov.co/wp-content/uploads/2020/10/plan-de-manejo-pnn-los-nevados.pdf>. Página: p. 66-67. Consulta: 25/11/2026.
- **Citas:**
  - Plan de manejo 2017, p. 66: «Clima Páramo Alto Húmedo. PAH. Es el clima reinante en el Parque ya que comprende alturas entre 4000 y 4600 m.s.n.m.»
  - Plan de manejo 2017, p. 67: «En esta zona climática es muy frecuente la presencia de fuertes vientos y los días fríos y con niebla se alternan con días despejados y cálidos. Aún para los meses de verano no se puede esperar condiciones ambientales estables.»
- **Nota:** Texto retomado por el plan de los planes de 1998 y 2007.

### 21. `zonificacion` · parque

Ficha nueva · estado: **borrador — por validar**

- **es:** El parque está dividido en zonas de manejo: cerca del 55 % es zona intangible, el 33 % de recuperación natural y el 12 % primitiva. Las zonas para visitantes, de recreación general exterior y de alta densidad de uso, suman apenas cerca del 0,1 % del parque.
- **en:** The park is divided into management zones: about 55% is intangible zone, 33% natural recovery and 12% primitive. The visitor zones, general outdoor recreation and high-density use, add up to only about 0.1% of the park.
- **q:** «qué es la zonificación del parque» · «qué parte del parque se puede visitar» · «por qué no se puede ir a todas partes» · «qué es una zona intangible» · «cuánto del parque es para turistas» · «por qué hay zonas prohibidas» · «qué zonas tiene el parque»
- **qen:** «how much of the park can visitors use» · «what is an intangible zone» · «why can't I go everywhere»
- **Fuente:** `pnn_plan2017`: Plan de manejo 2017–2022 del PNN Los Nevados (Parques Nacionales, Dirección Territorial Andes Occidentales, abril de 2017; adoptado por la Resolución 393 de 2017; consultado 25/11/2026). <https://www.parquesnacionales.gov.co/wp-content/uploads/2020/10/plan-de-manejo-pnn-los-nevados.pdf>. Página: p. 170 (Figura 24). Consulta: 25/11/2026.
- **Citas:**
  - Plan de manejo 2017, p. 170: «Zona Primitiva (ZnP) 7712,5 12,39 · Zona Intangible (ZnIn) 34235,51 54,98 · Zona de Recuperación Natural (ZnRN) 20248,68 32,52 · Zona de Recreación General Exterior (ZnRGE) 23,99 0,04 · Zona de Alta Densidad de Uso (ZnADU) 50,97 0,08» (hectáreas y % del área)
- **Nota:** 0,04 % + 0,08 % = 0,12 %. El anexo (p. 10) confirma que las actividades se hacen en la zona de recreación general exterior.

### 22. `valores_conservacion` · naturaleza

Ficha nueva · estado: **borrador — por validar**

- **es:** El parque protege, como valores objeto de conservación, el páramo, los humedales altoandinos y el bosque altoandino; el siete cueros, el periquito de los nevados, el pato andino y la palma de cera; las cuencas altas de los ríos Chinchiná, Otún, Quindío y Combeima, y los volcanes nevados del Ruiz, Santa Isabel y Tolima.
- **en:** As its conservation targets, the park protects the páramo, high-Andean wetlands and high-Andean forest; the siete cueros tree, the rufous-fronted parakeet, the Andean duck and the wax palm; the upper basins of the Chinchiná, Otún, Quindío and Combeima rivers; and the Ruiz, Santa Isabel and Tolima snow volcanoes.
- **q:** «qué protege el parque» · «cuáles son los valores objeto de conservación» · «para qué existe el parque» · «qué cuida el parque» · «qué especies protege el parque» · «objetivos de conservación del parque» · «por qué es importante el parque»
- **qen:** «what does the park protect» · «conservation targets of the park» · «why is the park important»
- **Fuente:** `pnn_plan2017`: Plan de manejo 2017–2022 del PNN Los Nevados (Parques Nacionales, Dirección Territorial Andes Occidentales, abril de 2017; adoptado por la Resolución 393 de 2017; consultado 25/11/2026). <https://www.parquesnacionales.gov.co/wp-content/uploads/2020/10/plan-de-manejo-pnn-los-nevados.pdf>. Página: p. 112 (Tabla 28). Consulta: 25/11/2026.
- **Citas:**
  - Plan de manejo 2017, p. 112, Tabla 28: «1. Páramo 2. Humedales altoandinos 3. Bosque altoandino» · «1. Polylepis sericea (Siete cueros) 2. Bolborhynchus ferrugineifrons (Periquito de los Nevados) 3. Oxyura jamaicensis (Pato Andino) 4. Ceroxylon quindiuensis (Palma de cera)» · «1. Cuenca alta del río Chinchiná 2. Cuenca alta del río Otún 3. Cuenca alta del río Quindío 4. Cuenca alta del río Combeima» · «Volcán Nevado del Ruíz, Santa Isabel y Tolima»
- **Nota:** Confirma lo que recorrido-pnn.md tenía solo de resúmenes de búsqueda.

### 23. `especies_amenazadas` · naturaleza

Ficha nueva · estado: **borrador — por validar**

- **es:** Según el plan de manejo, en Colombia están en peligro el cóndor andino, la danta de páramo, el pato andino y la palma de cera, y son vulnerables el periquito de los nevados y el perico paramuno. Obsérvalos de lejos y sin perseguirlos.
- **en:** According to the management plan, in Colombia the Andean condor, the mountain tapir, the Andean duck and the wax palm are endangered, and the rufous-fronted parakeet and the golden-plumed parakeet are vulnerable. Watch them from afar and never chase them.
- **q:** «qué especies están en peligro» · «qué animales están amenazados» · «el cóndor está en peligro de extinción» · «la danta está en peligro» · «especies en vía de extinción» · «qué animales son vulnerables» · «el pato andino está amenazado» · «qué categoría de amenaza tiene el cóndor»
- **qen:** «which species are endangered» · «is the condor endangered» · «threatened animals in the park»
- **Fuente:** `pnn_plan2017`: Plan de manejo 2017–2022 del PNN Los Nevados (Parques Nacionales, Dirección Territorial Andes Occidentales, abril de 2017; adoptado por la Resolución 393 de 2017; consultado 25/11/2026). <https://www.parquesnacionales.gov.co/wp-content/uploads/2020/10/plan-de-manejo-pnn-los-nevados.pdf>. Página: p. 129 (tabla UICN). Consulta: 25/11/2026.
- **Citas:**
  - Plan de manejo 2017, p. 129 (columnas: UICN internacional · UICN Colombia): «Ceroxylon quindiuense VU Vulnerable EN En peligro» · «Bolborhynchus ferrugineifrons VU Vulnerable VU Vulnerable» · «Vultur gryphus NT Casi amenazada EN En peligro» · «Oxyura jamaicensis LC Preocupación menor EN En peligro» · «Leptosittaca branickii VU Vulnerable VU Vulnerable» · «Tapirus pinchaque EN En peligro EN En peligro»
  - Plan de manejo 2017, p. 186: «Observar la vida silvestre a distancia y nunca alimentar animales.»
- **Nota:** Categorías de 2017: pueden haber cambiado. «Perico paramuno» es el nombre que da el plan (p. 113) a Leptosittaca branickii.

### 24. `historia_parque` · historia

Ficha nueva · estado: **borrador — por validar**

- **es:** El INDERENA reservó el área del parque con el Acuerdo 15 del 28 de marzo de 1973, y la Resolución Ejecutiva 148 del 30 de abril de 1974 lo ratificó. Una revisión cartográfica de 1985 calculó su superficie en 58.300 hectáreas.
- **en:** INDERENA set aside the park area with Agreement 15 of 28 March 1973, and Executive Resolution 148 of 30 April 1974 ratified it. A 1985 map review put its area at 58,300 hectares.
- **q:** «quién creó el parque» · «qué es el INDERENA» · «con qué norma se creó el parque» · «historia del parque» · «cuántas hectáreas tenía el parque al crearse» · «qué resolución creó el parque»
- **qen:** «who created the park» · «how was the park created» · «history of the park»
- **Fuente:** `pnn_plan2017`: Plan de manejo 2017–2022 del PNN Los Nevados (Parques Nacionales, Dirección Territorial Andes Occidentales, abril de 2017; adoptado por la Resolución 393 de 2017; consultado 25/11/2026). <https://www.parquesnacionales.gov.co/wp-content/uploads/2020/10/plan-de-manejo-pnn-los-nevados.pdf>. Página: p. 40. Consulta: 25/11/2026.
- **Citas:**
  - Plan de manejo 2017, p. 40: «…la Junta Directiva del INDERENA mediante Acuerdo N° 15 del 28 de marzo de 1973, delimitó y reservó un área de 38.000 hectáreas aproximadamente […] Este acuerdo fue ratificado por Resolución Ejecutiva N° 148 de abril 30 de 1974. Una revisión cartográfica realizada en el año 1985 determinó que la superficie del Parque […] correspondía a 58.300 hectáreas.»
- **Nota:** La ficha `parque` dice «unas 61.400 hectáreas». El plan da 58.300 ha (oficial) y, en tablas SIG, 62.144 ha y 62.271 ha (p. 8 y p. 40). R1 elige una cifra con su fuente.

### 25. `altitud_parque` · parque

Ficha nueva · estado: **borrador — por validar**

- **es:** El parque va desde los 2.600 hasta los 5.321 m de altura. El punto más alto es la cumbre del volcán Nevado del Ruiz, a 5.321 m.
- **en:** The park ranges from 2,600 to 5,321 m above sea level. The highest point is the summit of Nevado del Ruiz volcano, at 5,321 m.
- **q:** «qué altura tiene el Nevado del Ruiz» · «cuánto mide el Ruiz» · «cuál es el punto más alto del parque» · «a qué altura está la cumbre del Ruiz» · «qué tan alto es el volcán» · «cuál es la altura mínima del parque» · «cuántos metros tiene el nevado»
- **qen:** «how high is Nevado del Ruiz» · «what is the highest point of the park» · «how tall is the volcano»
- **Fuente:** `pnn_plan2017`: Plan de manejo 2017–2022 del PNN Los Nevados (Parques Nacionales, Dirección Territorial Andes Occidentales, abril de 2017; adoptado por la Resolución 393 de 2017; consultado 25/11/2026). <https://www.parquesnacionales.gov.co/wp-content/uploads/2020/10/plan-de-manejo-pnn-los-nevados.pdf>. Página: p. 40 y p. 60. Consulta: 25/11/2026.
- **Citas:**
  - Plan de manejo 2017, p. 40: «…con alturas entre 2.600 y 5.321 metros (SIG Parques Nacionales, 2007)»
  - Plan de manejo 2017, p. 60: «…presenta un rango altitudinal entre los 2600 msnm a los 5321 m.s.n.m. en la cumbre del Volcán Nevado del Ruiz.»

### 26. `controles` · normas

Ficha nueva · estado: **borrador — por validar**

- **es:** Al entrar y al salir hay controles del parque. No se pueden ingresar sustancias psicoactivas, bebidas embriagantes, armas de fuego, objetos cortopunzantes ni equipos de pesca; si los encuentran, se aplican las medidas del caso.
- **en:** There are park checks on the way in and out. You may not bring psychoactive substances, alcoholic drinks, firearms, sharp objects or fishing gear; if any are found, the corresponding measures are applied.
- **q:** «revisan las maletas» · «hay requisa» · «puedo llevar navaja» · «puedo llevar cuchillo» · «puedo pescar» · «qué objetos están prohibidos» · «me van a revisar el morral» · «puedo llevar caña de pescar»
- **qen:** «do they check bags» · «can I bring a knife» · «what items are not allowed»
- **Fuente:** `pnn_anexo2023`: Anexo · Reglamentación transitoria de la actividad ecoturística para la reapertura del PNN Los Nevados (PNN Los Nevados, diciembre de 2023; consultado 25/11/2026). <https://parquesnacionales.gov.co/wp-content/uploads/2023/12/ANEXO-PNN-NEVADOS.pdf>. Página: p. 26. Consulta: 25/11/2026.
- **Citas:**
  - Anexo, p. 26: «Participar en los controles de ingreso y salida que realiza el área protegida, permitiendo la búsqueda de sustancias psicoactivas, elementos embriagantes, armas de fuego, elementos cortopunzantes, equipos de pesca, entre otros, los cuales no podrán ser ingresados al Parque»

### 27. `caballos` · normas

Ficha nueva · estado: **borrador — por validar**

- **es:** No. Están prohibidas las cabalgatas y el ingreso de caballos o mulas con fines turísticos. Solo se permiten para campesinos que viven en el parque, carga autorizada, emergencias o personas con movilidad limitada, con autorización del parque.
- **en:** No. Horseback tours and bringing horses or mules for tourism are forbidden. They are only allowed for farmers living in the park, authorized cargo, emergencies or people with limited mobility, with park authorization.
- **q:** «puedo subir a caballo» · «hay cabalgatas» · «se puede montar a caballo» · «alquilan mulas» · «puedo ir en mula» · «hay caballos para subir» · «cabalgata en el nevado»
- **qen:** «can I ride a horse» · «are there horseback tours» · «can I rent a mule»
- **Fuente:** `pnn_anexo2023`: Anexo · Reglamentación transitoria de la actividad ecoturística para la reapertura del PNN Los Nevados (PNN Los Nevados, diciembre de 2023; consultado 25/11/2026). <https://parquesnacionales.gov.co/wp-content/uploads/2023/12/ANEXO-PNN-NEVADOS.pdf>. Página: p. 22 y p. 27. Consulta: 25/11/2026.
- **Citas:**
  - Anexo, p. 22: «Se prohíbe expresamente el ingreso de equinos y mulares al Parque con fines turísticos, es decir, la actividad de cabalgatas turísticas.»
  - Anexo, p. 22: «…atención de emergencias y transporte de personas con limitaciones físicas que limiten o impidan su movilidad, previa autorización de un funcionario del Área Protegida.»
  - Anexo, p. 27: «La realización de cabalgatas (recorridos montados en los caballares o mulares).»

### 28. `oficina_parque` · acceso

Ficha nueva · estado: **borrador — por validar**

- **es:** La oficina del PNN Los Nevados en Manizales queda en la Calle 69 A No. 24-69, barrio La Camelia, sector Palermo. Teléfonos (606) 887 16 11 y 887 22 73; correo nevados@parquesnacionales.gov.co. Atiende de lunes a viernes, de 8:00 a. m. a 12:00 m. y de 2:00 p. m. a 5:00 p. m.
- **en:** The PNN Los Nevados office in Manizales is at Calle 69 A No. 24-69, La Camelia neighborhood, Palermo sector. Phones (606) 887 16 11 and 887 22 73; email nevados@parquesnacionales.gov.co. Open Monday to Friday, 8:00 a.m. to 12:00 noon and 2:00 to 5:00 p.m.
- **q:** «dónde queda la oficina del parque» · «dirección del parque en Manizales» · «teléfono fijo del parque en Manizales» · «correo del parque» · «horario de la oficina del parque» · «oficina de Parques en Manizales»
- **qen:** «where is the park office» · «park office in Manizales» · «park email address»
- **Fuente:** `pnn_anexo2023`: Anexo · Reglamentación transitoria de la actividad ecoturística para la reapertura del PNN Los Nevados (PNN Los Nevados, diciembre de 2023; consultado 25/11/2026). <https://parquesnacionales.gov.co/wp-content/uploads/2023/12/ANEXO-PNN-NEVADOS.pdf>. Página: p. 7 (y pie de página de todas las páginas). Consulta: 25/11/2026.
- **Citas:**
  - Anexo, p. 7: «Oficina en Manizales: Calle 69 A No. 24 – 69 Barrio La Camelia – sector Palermo. Tel: (606) 887 16 11 - 887 22 73 Correo electrónico: nevados@parquesnacionales.gov.co Horario: lunes a viernes de 8:00 a.m. a 12:00 m. y de 2:00 p.m. a 5:00 p.m.»
- **Nota:** Datos institucionales publicados por PNN (dic-2023). La ficha `contacto` tiene los números nacionales y de UTON.

### 29. `temporada_alta` · acceso

Ficha nueva · estado: **borrador — por validar**

- **es:** La temporada alta incluye los puentes festivos (desde el jueves anterior), del 15 de diciembre al 30 de enero, del 15 de junio al 15 de julio, Semana Santa y la semana de receso escolar de octubre. En temporadas de mucha afluencia, en Brisas la guianza puede hacerse por estaciones en el carreteable.
- **en:** High season includes long holiday weekends (from the Thursday before), 15 December to 30 January, 15 June to 15 July, Holy Week and the October school break week. When visitors are many, guiding in Brisas may be done at stations along the dirt road.
- **q:** «cuándo es temporada alta» · «cuándo hay más gente» · «cuándo hay menos gente» · «hay mucha gente en diciembre» · «es temporada alta en semana santa» · «qué es la guianza por estaciones» · «temporadas del parque»
- **qen:** «when is high season» · «when is it most crowded» · «busy season»
- **Fuente:** `pnn_anexo2023`: Anexo · Reglamentación transitoria de la actividad ecoturística para la reapertura del PNN Los Nevados (PNN Los Nevados, diciembre de 2023; consultado 25/11/2026). <https://parquesnacionales.gov.co/wp-content/uploads/2023/12/ANEXO-PNN-NEVADOS.pdf>. Página: p. 9 y p. 15. Consulta: 25/11/2026.
- **Citas:**
  - Anexo, p. 9: «Se considera temporada alta los puentes festivos (desde el día jueves que los antecede) y los periodos de vacaciones del 15 de diciembre al 30 de enero, 15 junio al 15 de julio, semana santa y la semana de receso escolar (octubre).»
  - Anexo, p. 15: «…en temporadas de mayor afluencia de visitantes aplica operación de guianza por estaciones ubicadas en el carreteable.»
- **Nota:** El plan 2017 (p. 181) daba otras fechas (15 dic – 15 ene). Prima el anexo por ser más reciente.

### 30. `glaciar_ruiz` · parque

Ficha nueva · estado: **borrador — por validar**

- **es:** Según el IDEAM, en febrero de 2024 el glaciar del Nevado del Ruiz medía unos 7,17 km², un 85 % menos que a mediados del siglo XIX. Ese año, cerca del 88 % de su superficie estaba cubierta de ceniza volcánica, que lo aísla y frena el derretimiento. La erupción de 1985 fundió cerca del 10 % del glaciar.
- **en:** According to IDEAM, in February 2024 the Nevado del Ruiz glacier covered about 7.17 km², 85% less than in the mid-19th century. That year about 88% of its surface was covered by volcanic ash, which insulates it and slows melting. The 1985 eruption melted about 10% of the glacier.
- **q:** «cuánto hielo le queda al Ruiz» · «el glaciar del Ruiz se está derritiendo» · «qué tamaño tiene el glaciar del Ruiz» · «por qué el nevado se ve gris» · «por qué el glaciar tiene ceniza» · «cuánto se ha reducido el glaciar del Ruiz» · «se va a acabar el nevado del Ruiz»
- **qen:** «how big is the Ruiz glacier» · «is the Ruiz glacier melting» · «why is the glacier grey»
- **Fuente:** `ideam_glaciares2024`: Informe del estado de los glaciares colombianos 2024 (IDEAM, diciembre de 2025; consultado 25/11/2026). <https://ideam.gov.co/file-download/download/public/17092>. Página: PDF p. 24 (impresa 46) y PDF p. 15 (impresas 28-29). Consulta: 25/11/2026.
- **Citas:**
  - IDEAM 2024, impresa p. 46: «El área glaciar del Nevado del Ruiz, estimada para el 20 de febrero de 2024, fue de 7,17 ± 0,30 km²…» · «Durante 2024, aproximadamente el 88 % de la superficie glaciar del Nevado del Ruiz estuvo cubierta por ceniza volcánica.» · «…actúa como aislante térmico…»
  - IDEAM 2024, impresas p. 28-29, Tabla 2: «Mediados siglo XIX … 47,50» (Ruiz) · «% reducción total … 85%» · «Sí, en 1985, la erupción del Nevado del Ruiz ocasionó la fusión del 10 % del glaciar…»

### 31. `glaciar_santa_isabel` · parque

Ficha nueva · estado: **borrador — por validar**

- **es:** Según el IDEAM, en febrero de 2024 el glaciar del Nevado Santa Isabel medía apenas 0,16 km², un 99 % menos que a mediados del siglo XIX. En su informe de diciembre de 2025 estimó que desaparecerá en tres a cinco años, plazo que puede cambiar con El Niño o La Niña.
- **en:** According to IDEAM, in February 2024 the Nevado Santa Isabel glacier covered only 0.16 km², 99% less than in the mid-19th century. In its December 2025 report it estimated the glacier will disappear within three to five years, a timeline that may change with El Niño or La Niña.
- **q:** «cuánto le queda al glaciar del Santa Isabel» · «va a desaparecer el Santa Isabel» · «cuándo se acaba el glaciar del Santa Isabel» · «qué glaciar está más amenazado» · «el Santa Isabel se está derritiendo» · «cuál es el glaciar más pequeño»
- **qen:** «will the Santa Isabel glacier disappear» · «how much ice is left on Santa Isabel» · «which glacier is most threatened»
- **Fuente:** `ideam_glaciares2024`: Informe del estado de los glaciares colombianos 2024 (IDEAM, diciembre de 2025; consultado 25/11/2026). <https://ideam.gov.co/file-download/download/public/17092>. Página: PDF p. 15 (impresas 28-29) y PDF p. 17 (impresa 32). Consulta: 25/11/2026.
- **Citas:**
  - IDEAM 2024, impresas p. 28-29: «El Nevado Santa Isabel ha sido el más afectado, pasando de 27,8 km² a tan solo 0,16 km², lo que representa una disminución del 99 % […] Se estima que desaparecerá por completo en los próximos tres a cinco años. Esta estimación puede variar (aumentar o disminuir) de acuerdo con fenómenos de variabilidad climática como El Niño o La Niña.»
  - IDEAM 2024, impresa p. 32: «El área glaciar del Nevado Santa Isabel para febrero de 2024 fue estimada en 0,16 ± 0,01 km²…»
- **Nota:** La ficha `glaciares` dice «podría extinguirse hacia 2028». Es compatible (2025 + 3 a 5 años), pero conviene actualizarla con esta fuente.

## Discrepancias con `chat.json`
| Tema | `chat.json` hoy | Fuente oficial | Propuesta |
|---|---|---|---|
| Edad máxima (`edades`) | «la edad máxima en todo el parque es 69 años» (pnn_web) | Anexo p. 25: «entre los 6 y los 70 años»; p. 27 prohíbe «adultos mayores de 70 años». PNN-UTON 2022 p. 2: «ni mayores de 70 años». Plan 2017 p. 199 (Res. 1058 de 1992): «adultos con edad superior a los 70 años». Página web PNN hoy: «Edad máxima permitida de 69 años para todo el Parque.» | Corregir `edades` diciendo ambas cifras y pedir a PNN cuál rige. Puede que la web aplique una norma más nueva que no encontramos. |
| Horario (`horario`) | «abre todos los días de 8:00 a. m. a 2:00 p. m. La última charla de inducción es a la 1:30 p. m.» | Anexo p. 6: «Horarios de ingreso entre las 8:00 a.m. hasta las 2:00 p.m.»; p. 9: centro de inducción «de lunes a domingo de 8:00 a.m. a 2:00 p.m.». La hora de la última charla (1:30) solo está en la web. Plan 2017 p. 181 (antiguo): «Jueves a domingo, puentes festivos y temporadas altas». | Coincide. Sin cambio. |
| Hora de salida | No hay ficha. | PNN-UTON 2022 p. 2: «Evacuación a las 3:30 pm»; 2016: «compulsory exit by 3:30pm». Plan 2017 p. 181: «salida máximo a las 3:00 p.m.» | Ficha nueva `hora_salida` con 3:30; confirmar. |
| Tarifas (`tarifas`) | 2026: menores de 25, $12.500; mayores de 25, $24.500; extranjeros no residentes, $68.000; automóvil $10.000; guianza UTON $22.000 | Web PNN 2026: mismas cifras. La web es inconsistente con la buseta ($56.000 en una tabla y $27.500 en otra). PNN-UTON 2022 p. 2 y p. 5 (antiguas): ingreso $10.500 / $19.500 / $54.000, guía $15.000, seguro $5.000, y «Entre 65 y 70 años Exento». | Sin cambio: la ficha usa la fuente más nueva. Las de 2022 y 2016 no se usan. |
| Capacidad de carga | No hay ficha. | Anexo p. 15: «2.073 personas» (Res. 252 de 2008), reducible «al 50%, es decir, 1.036 visitantes al día» según la actividad del volcán. Plan 2017 p. 185: además, 294 vehículos al día en el tramo Brisas–Refugio. PNN-UTON 2022 p. 2: «1036 personas». | Ficha nueva `capacidad_carga`, sin nombrar el nivel del volcán. |
| Visitantes por guía (`guia`) | No dice el número. | Anexo p. 15: «ocho (8)» por guía o intérprete; «cinco (5)» por guía de alta montaña. Anexo p. 25: «ocho (8) para senderismo y borde del glaciar incluido guía o intérprete». Plan 2017 p. 192: «4 visitantes para cimas». | Ficha nueva `visitantes_por_guia` (8 y 5). Confirmar si los 8 incluyen al guía. |
| Seguro (`seguro`) | «seguro obligatorio de accidentes de una aseguradora aprobada» | Anexo p. 6: «seguro de accidentes y rescate», Res. 092 de 2018, aseguradoras «Colasistencia, Magenta y Seguros Médicos Internacionales». Anexo p. 25 cita la «resolución 135 de 2014» e incluye a «visitantes, guías y arrieros». Web: «seguro obligatorio de accidentes otorgado por una compañía aseguradora avalada por Parques Nacionales». | Corregir: decir «y rescate», quién lo necesita y la norma. El propio anexo es inconsistente en el número de la resolución. |
| Inducción (`induccion`) | «obligatoria y presencial en los puntos de ingreso» | Anexo p. 6: «recibir la charla de inducción de manera presencial en los puntos de ingreso»; p. 25: «por parte del personal del PNN Los Nevados». | Coincide. Sin cambio. |
| Drones (`drones`) | «prohibidos (Resolución 0543 de 2018)» | Anexo p. 16: «No utilizar drones conforme la resolución No. 0543 del 27 de diciembre de 2018». PNN-UTON p. 2: «No se permite en ingreso y uso de Drones». | Coincide. Sin cambio. |
| Mascotas (`mascotas`) | «prohibidos en el parque» | Anexo p. 27: «Ingresar animales domésticos o mascotas y material vegetal». PNN-UTON p. 2: «No sé permite el ingreso de mascotas de ningún tipo». | Coincide. Sin cambio. |
| Reservas (`reservas`) | «no es obligatoria entre semana […] Los fines de semana y puentes festivos exigen reserva» | Anexo p. 5: «Para el sector de Brisas no se requiere realizar reservas». PNN-UTON p. 2: «No requiere reserva para el ingreso por este sector». Web: «es indispensable reservar con al menos un día de anticipación». | Sin cambio (la web es más nueva). Confirmar con UTON. |
| Cierres (`cierres`) | Tres cierres al año; «en cierres anteriores Brisas siguió abierto». | Anexo p. 9: cuatro cierres (agrega «Tercer lunes de mayo») y «sin incluir la vía de la zona norte […] (carreteable Brisas – Valle de las Tumbas)». Web: «Son tres (3) cierres al año». | Corregir `cierres` citando el anexo y la diferencia. |
| Altura del Valle de las Tumbas (`tumbas`, `cima`) | «a unos 4.450 m» | Plan 2017 p. 98: «Valle del Silencio o Las Tumbas 5.660 4.386». | Corregir `tumbas`; revisar `cima` y la altura de paquete.json. |
| Altura de Brisas (`brisas`) | «a unos 4.100 m» | Anexo p. 9: «4.107 m.s.n.m». Plan 2017: 4.050 msnm (p. 45), 4.169 (p. 97), estación a 4.110 m (p. 60). | Coherente con «unos 4.100 m». Sin cambio. |
| Servicios en Brisas (`servicios`, abstención) | «No tengo información oficial sobre servicios como baños, comida, parqueadero…» | Plan 2017 p. 45-46: en Brisas «cafetería, batería de baños», «Primeros auxilios», «Parqueadero»; p. 46-47: Arenales con cafetería y baños; p. 47-48: Valle de las Tumbas con parqueadero. 2016: «There is a cafeteria inside». | **Sin cambio**: `servicios` es ficha crítica de abstención y los datos son de 2017. R1 puede preguntarle a UTON qué opera hoy. |
| Vehículos | Las fichas dicen que a Tumbas se llega en vehículo. | Anexo p. 27 prohíbe «Ingresar con vehículos al área protegida», pero el mismo anexo (p. 15) habla de «capacidad de vehículos por guía» en Brisas, y el plan (p. 193) regula los vehículos. | Contradicción interna del anexo. Sin cambio; preguntar. |
| Superficie (`parque`) | «unas 61.400 hectáreas» | Plan 2017 p. 40: «58.300 hectáreas» (revisión de 1985) y 62.144 / 62.271 ha en tablas SIG (p. 8, p. 40). | Ficha nueva `historia_parque` con 58.300; R1 elige una cifra para `parque`. |
| Armero (`armero`) | ríos «Lagunilla, Gualí y Chinchiná» | Plan 2017 p. 16: «ríos Azufrado y Lagunillas», «3.000 hectáreas», «23 mil personas». | Corregir con fecha y cifras del plan. |
| Glaciar del Santa Isabel (`glaciares`) | «podría extinguirse hacia 2028» (con fuente pnn_web) | IDEAM 2024 (dic-2025), impresas p. 28-29: «desaparecerá por completo en los próximos tres a cinco años». | Compatible. Ficha nueva `glaciar_santa_isabel` con la fuente del IDEAM. |
| Salud (`salud`) | Lista de nueve condiciones «entre otras». | PNN-UTON 2022 p. 2 agrega antecedentes psiquiátricos importantes, insuficiencia respiratoria crónica, enfermedad arterial de miembros inferiores, problemas graves de coagulación y cirugías recientes. | Corregir con la lista completa. |
| Pico y placa (`pico_placa`) | Sin norma citada. | Web: «emitido por la Secretaría de Tránsito y Transporte del Tolima, mediante la Resolución No. 1815». | Corregir agregando la norma. |
| Volcán (`volcan_estado`) | «consúltalo en los boletines del SGC»; la fuente `sgc` apunta a la portada del SGC. | Página «Boletines Volcán Nevado del Ruiz» con boletines semanales, mensuales y extraordinarios. | Corregir solo dónde consultar, con las mismas q. Ningún nivel. |
| Motos (`motos`) | «prohibido» | Plan 2017 p. 193: «Se restringe el acceso de buses, motos, cuatrimotos o buggys». PNN-UTON p. 2: «No sé permite el ingreso de motos ni cuatrimotos». | Coincide. Sin cambio. |
| Temperatura (`temperatura`) | «de 14 °C a 4 °C y puede bajar de 0 °C» (pnn2019) | Plan 2017 p. 60: «entre 13.12 oC a los 2600 msnm y -4.1 oC»; Brisas, 2,24 °C de media anual. | Coherente. Fichas nuevas `clima_brisas` y `clima_cambiante`. |

## La Resolución 207 de 2023
- **Qué es, según la prensa:** la «Resolución 207 del 4 de agosto de 2023», que autorizó el ingreso de visitantes al PNN
  Los Nevados desde el jueves 10 de agosto de 2023, con una «fase de aprestamiento» (Semana, 9-ago-2023,
  <https://www.semana.com/nacion/manizales/articulo/lo-ultimo-autorizan-la-reapertura-del-parque-nacional-natural-los-nevados-desde-cuando-podran-llegar-propios-y-turistas/202351/>).
  Noticias Caracol (cierre de noviembre de 2025) y Pulzo la citan como base de los cierres periódicos.
- **Quién la emitió:** no se pudo verificar. La nota de Semana la asocia con Parques Nacionales, pero no nombra la dependencia
  ni quién la firma.
- **No se encontró el texto oficial** en parquesnacionales.gov.co. El anexo de diciembre de 2023 tampoco la cita.
- **Ojo con el número:** la Resolución 268 del 20-nov-2023 de PNN aclara otra «Resolución 207 del 26 de septiembre de 2023»,
  que es un permiso de grabación audiovisual. El número 207 de 2023 se repite en actos distintos (pueden ser de dependencias
  diferentes). Ninguna ficha se apoya en la Resolución 207.

## Fuentes no accesibles o dudosas
| Fuente | Motivo |
|---|---|
| *La ruta del cóndor* (U. de Caldas + U. Jorge Tadeo Lozano), <https://www.utadeo.edu.co/sites/tadeo/files/node/publication/field_attached_file/pdf-la_ruta_del_condor-pag-web-16.pdf> | **No accesible**: el sitio responde 403 con un desafío antibots (Bunny Shield), tanto con `curl` como con el lector web. No se leyó: ninguna ficha sale de ahí. Hay que bajarlo a mano desde un navegador. |
| *Publicación PNN Los Nevados 2026 V2* (parquesnacionales.gov.co/wp-content/uploads/2026/03/…) | 404. Aparece en buscadores pero el archivo no está. |
| *Respuesta Radicado Anónimo No. 20264700042282* (PNN, 2026) | 404. |
| `ecoturismonevados.com.co` (la página del PNN lo da como sitio de UTON) | **Dudoso / peligroso**: hoy redirige (301) a un dominio de apuestas que no tiene nada que ver. No se siguió. **No enlazarlo desde la app**; conviene avisar al PNN. |
| `operacionnevados.co` | Redirige a `visitnevados.co`, que se identifica como «Unión Temporal Operación Nevados». De ahí sale el PDF de 2022. Su portada no trae datos para el visitante de Brisas. |
| Página oficial del PNN | Accesible. Solo cinco frases se tomaron textualmente; el resto viene de un resumen automático. Por eso las fichas nuevas no se apoyan en `pnn_web`, salvo `pico_placa`, que usa una cita textual. |
| IDEAM: clima de páramo | No se encontró un boletín climático del IDEAM para la zona de Brisas. El informe de glaciares 2023 trae una «Estación Meteorológica Las Brisas» a 4.776 m, que no parece la de Brisas (4.110 m): no se usó. Las fichas de clima salen del plan de manejo, que a su vez cita los planes de 1998 y 2007 (**datos antiguos**). |
| Plan de manejo 2017–2022 | Oficial, pero vencido en 2022. Horarios (jueves a domingo), temporadas y alturas pueden haber cambiado. |
| Anexo dic-2023 | Se presenta como propuesta para aprobar (p. 30-31). Es la fuente más completa, pero hay que confirmar su vigencia. Tiene erratas («Cuatro lunes de septiembre») e inconsistencias (resoluciones del seguro; vehículos). |
| PNN-UTON 2022 | Oficial (firmado por PNN y UTON). Lo publica UTON, no el sitio del PNN. Tarifas y horarios de 2022. |
| *Additional information for visitors* (≈2016) y tarifas del sitio antiguo | **Antiguos**. Solo para contraste. |

## Para fusionar después de validar
1. R1 revisa cada ficha y su cita. Si la aprueba, puede cambiar `estado` a `validado` cuando lo confirme PNN o UTON.
2. Copiar `fuentes` del JSON a `chat.json → fuentes`. Para cada ficha: si su `id` está en `corrige`, reemplazar la ficha;
   si no, agregarla al final.
3. `python -X utf8 herramientas/indice_chat.py --fijos`, luego `validar_contratos.py` y `evaluar.py` (la puerta de
   seguridad debe seguir al 100 %), y `version_sw.py --subir`.

## Prueba de fusión (simulada, fuera del repo)
Se aplicó el borrador a una copia de `chat.json` (97 fichas), se regeneró el índice con `indice_chat.py --fijos` y se
corrieron `validar_contratos.py` y `evaluar.py` el 25-nov-2026:

| Banco | Hoy (`main`) | Con el borrador |
|---|---|---|
| Puerta de seguridad | 19/19 | **19/19** |
| banco 1 | 77/83 | 77/83 |
| banco 2 (ciego) | 29/32 | 26/32 |
| mapa (recorrido / parecidas) | 17/18 · 5/6 | 17/18 · 4/6 |
| tema | 38/42 | 37/42 |
| tema2 | 15/21 | 16/21 |
| tema3 (ciego) | 11/17 | 12/17 |

- `validar_contratos.py` queda en verde con el borrador fusionado.
- En los bancos no ciegos, los cambios son preguntas que ahora responde una ficha nueva más específica: «cuánto mide el
  nevado del ruiz» → `altitud_parque` (el banco espera `volcanes`, `glaciares` o `cima`) y «¿se está derritiendo?» /
  «¿cuánto hielo le queda?» con tema nevado → `glaciar_ruiz` (el banco espera `glaciares`). R1 decide si agrega esos ids a
  los esperados o si fusiona `glaciar_ruiz` dentro de `glaciares`.
- Una forma de preguntar se cambió porque le quitaba al oso una pregunta del banco 1 («por qué hay que cuidar al cóndor»
  → «qué categoría de amenaza tiene el cóndor»).
- **Los bancos ciegos no se miraron pregunta por pregunta ni se usaron para ajustar.** La baja del banco 2 (29 → 26) queda
  para que R1 la revise antes de fusionar, como pide la spec («evaluar.py no empeora»).
