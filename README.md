# Botix: demostración

Web pública de [Botix](https://diegom1313.github.io/botix-demo/), con todo lo que vende Botix y **Botix**, un asistente que lo explica a fondo.

## Qué hay

- `index.html`, `estilos.css`, `web.js`: la web (servicios, sectores, precios, preguntas).
- `efectos.js`: los efectos de la página (orbe de luz del héroe, titulares, focos, chispas), adaptados de [React Bits](https://reactbits.dev) a JavaScript sin dependencias.
- `maquetas.js`: las maquetas de producto en movimiento (la conversación, la web, la auditoría y el cobro).
- `canales.js`: los cuatro canales en directo: los mensajes viajan hasta Botix y caen contestados en la bandeja.

Al cambiar CSS o JS, sube el número `?v=` de sus enlaces en `index.html` para que nadie vea la versión guardada en caché.
- `bix.js`: Botix, el asistente. Responde sobre el asistente de citas, los canales, las webs, la auditoría SEO, los cobros, los precios, la privacidad y la baja, y puede simular cómo reserva una cita el asistente de una barbería ficticia.
- `og.png`: la imagen que sale al compartir el enlace.

Botix funciona solo en el navegador: no guarda ni envía lo que se escribe. Para que enlace al alta o dé un contacto real, rellena `CONFIG` al principio de `bix.js`.

No usa vídeos ni imágenes de terceros: el orbe de luz del héroe se dibuja en el navegador con WebGL y la puerta de luz del final es CSS. Con «reducir movimiento» activado, todo se queda quieto.

El código del producto no está aquí: es privado.

Copyright (c) 2026 Diegom1313. Todos los derechos reservados.

