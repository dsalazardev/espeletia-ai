<!-- Generado por herramientas/generar_indices.py: no lo edites a mano. -->
# Cambios

Se genera desde `docs/cambios/` (un archivo por cambio). Para agregar uno, copia
`docs/cambios/plantilla.md`.

## 2026-11-25

- **R3** · agregado: Spec de la app Android nativa (Flutter + llamadart + la PWA en un WebView) con el puente `window.FrayNativo`, tabla de velocidades de LLMs en teléfonos publicadas por terceros y comparación de plataformas nativas.
- **R3** · agregado (r3/llm-nativo): Protocolo para medir un LLM nativo en el teléfono con apps abiertas (PocketPal, AI Edge Gallery) y decisión propuesta de APK Android que envuelve la PWA con un LLM nativo.

## 2026-11-24

- **R3** · agregado (r3/al-recuperar-senal): Service worker v18: avisa cuando llega contenido nuevo, revalida el paquete con el servidor, verifica y repara archivos dañados (responde «sin señal» si no hay red) y ya no guarda en caché archivos ajenos a la app.
- **R3** · agregado (r3/audios): herramientas/audios.py: verifica que cada audio pregrabado lea el texto vigente con una voz apta para uso comercial (en CI) y sintetiza audios offline con Piper en el PC. Probado con la voz CC0 es_ES-davefx.
- **R3** · agregado (r3/harness-base): Andamiaje del equipo: AGENTS.md, decisiones, specs por rol, investigación del recorrido, contratos JSON Schema, herramientas de verificación (contratos, modelos, evaluación con puerta de seguridad, versión del SW) y CI. No cambia nada de la app.
- **R3** · agregado (r3/laboratorio-slm): Laboratorio para medir un SLM (Qwen2.5-0.5B) en el teléfono con verificador de cifras. Primera medición: inventa datos en español (1 de 7 útiles); se recomienda la respuesta extractiva en vez de generar.
- **R3** · agregado (r3/licencias): Licencias verificadas de modelos, voces y librerías (docs/licencias.md) y propuesta de un SLM generativo opcional que reformula la ficha recuperada sin tocar el carril crítico (Qwen2.5-0.5B, Apache-2.0). Pendientes: atribución de Copernicus, origen de MobileNetV2 y archivos de licencia.
- **R3** · agregado (r3/prueba-y-dictado): Guía para probar la app completa en un teléfono lejos del páramo (modo demo, enseñar a la Lente, QR, Modo guía, Fray y batería) y spec del botón para hablarle a Fray con reconocimiento de voz sin red.
- **R3** · agregado (r3/version-sw-despliegue): Netlify sella la versión del service worker con la huella del contenido de la app al publicar (version_sw.py --sellar): los teléfonos se actualizan aunque nadie suba VERSION a mano.
- **R3** · arreglado (r3/atribucion-copernicus): El mapa muestra la atribución exacta que exige la licencia de Copernicus (y models/relieve.json trae el descargo). Las herramientas ya no fallan en la consola de Windows por caracteres como «→». Versión del SW v17.
- **R3** · cambiado (r3/atribucion-copernicus): Origen del modelo de la Lente verificado: es el MobileNetV2 del ONNX Model Zoo (Apache-2.0) sin el clasificador. No hay que cambiarlo ni recalibrar.
- **R3** · cambiado (r3/laboratorio-worker): El laboratorio de SLM corre el modelo en un worker (la pantalla ya no se congela), muestra el texto mientras sale, permite detener y comparar contexto de frase o de ficha; el verificador revisa cifra + unidad. Evidencia del Redmi Note 15 Pro registrada.
- **R3** · cambiado (r3/spec-instalar): Spec de instalación: paso obligatorio de instalar justo después de escribir el nombre, con respaldo manual (Android, iPhone y navegadores internos de Instagram/WhatsApp).
