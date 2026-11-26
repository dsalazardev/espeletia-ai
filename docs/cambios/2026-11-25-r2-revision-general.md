---
fecha: 2026-11-25
rol: R2
tipo: arreglado
pr: "#000"
---
Revisión general de la app (álbum, mapa, Lente, chat, ajustes, guía y equipo) en español e inglés, a 390 y 320 px,
con texto muy grande y con alto contraste. Arreglos:

- **PDF del álbum:** las páginas de recorrido, certificado y créditos salían todas con el número 10. Ahora llevan su número.
  El certificado va sin pie de página, porque su marco tapaba el número.
- **Modo guía:** el aviso «este teléfono no deja mantener la pantalla encendida» tapaba el código de 4 dígitos.
  Ahora es una nota fija bajo el título.
- **Muelle:** en Modo equipo se marcaba «Mapa» y en Modo guía no se marcaba nada. Ahora se marca «Ajustes», que es de
  donde se entra a los dos.
- **Mapa en inglés:** «You're far from the trail…» se salía por la izquierda del dibujo. Ahora va en dos líneas.
- **Pista del álbum:** al final decía «busca los QR» aunque ya estuvieran todos. Ahora sugiere solo lo que falta.
- **Textos:**
  - La Lente decía «Seguridad 100 %», que en una app de seguridad se puede leer mal. Ahora dice «Certeza 100 %».
  - El final («Completaron», «Descarguen») y la foto de grupo («Les faltan») ahora le hablan al visitante de tú,
    como el resto de la app.
  - La casilla del chat dice «Tu pregunta», porque a 320 px «Escribe tu pregunta» se cortaba.
- **Pruebas:** `coleccion.py` esperaba un PNG del álbum, pero desde #15 es un PDF.
