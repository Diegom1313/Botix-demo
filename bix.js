// Botix: el asistente de la web de Botix. Sabe a fondo lo que vende Botix y
// puede simular cómo atiende el asistente de un negocio. Funciona solo en el
// navegador: no guarda ni envía nada de lo que se escribe.
(() => {
  // Rellena esto si quieres que Botix enlace al alta o dé un contacto real.
  const CONFIG = {
    alta: 'https://app.botix.software/crear.html',
    contacto: '',  // p. ej. 'hola@tudominio.com'
  };

  // ─────────────────────────────── utilidades de texto
  const normal = (t) => ` ${String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()} `;
  function distancia(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 9;
    const f = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) f[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
      f[i][j] = Math.min(f[i - 1][j] + 1, f[i][j - 1] + 1, f[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    return f[a.length][b.length];
  }
  // Una clave puede ser una frase («chat en mi web»), una palabra («precio»)
  // o una raíz con asterisco («reserv*»). Las palabras admiten faltas.
  function puntos(texto, palabras, clave) {
    if (clave.includes(' ')) return texto.includes(` ${clave} `) ? 2.6 : 0;
    if (clave.endsWith('*')) {
      const raiz = clave.slice(0, -1);
      return palabras.some((p) => p.startsWith(raiz)) ? 1.5 : 0;
    }
    if (palabras.includes(clave)) return 1.5;
    if (clave.length > 4 && palabras.some((p) => p.length > 3 && distancia(p, clave) <= (clave.length > 7 ? 2 : 1))) return 1;
    return 0;
  }
  const hay = (texto, claves) => {
    const ps = texto.trim().split(' ');
    return claves.some((c) => puntos(texto, ps, c) > 0);
  };

  // ─────────────────────────────── lo que sabe Botix
  const PRECIOS = {
    asistente: 'El **asistente de citas** cuesta **299 €** de alta, una sola vez, y **29 €/mes** de mantenimiento.\n\nEl alta cubre dejarlo montado para tu negocio: tu sector, tus datos, tu panel y el chat para tu web. La cuota cubre que siga encendido día y noche, con copia diaria, actualizaciones, recordatorios y soporte de una persona.\n\nSin IVA y sin permanencia.',
    web: 'La **web profesional** cuesta **99 €** de diseño y puesta en marcha, una vez, y **15 €/mes** de alojamiento y mantenimiento.\n\nSolo pagas los extras que uses:\n• Dominio propio: **19 €** una vez\n• Traslado desde tu web anterior, sin perder lo que Google ya conoce: **29 €** una vez\n• Página propia para cada servicio: **9 €** cada una\n\nSin IVA y sin permanencia. Lo que ya has pagado no se vuelve a cobrar aunque lo quites y lo vuelvas a poner.',
    auditoria: 'La **auditoría SEO y SEM** es **gratis**. Dejas tu web y tu correo y te llega el informe en PDF en un minuto, sin compromiso.',
    cobros: 'Cobrar señales o el precio de la cita va **incluido** en el asistente. El dinero entra en **tu propia cuenta de Stripe**, y Stripe cobra su comisión por cada pago, como con cualquier tienda online.',
    todo: 'Esto es lo que vendemos, sin IVA y sin permanencia:\n\n• **Asistente de citas**: 299 € de alta + **29 €/mes**\n• **Web profesional**: 99 € + **15 €/mes** (extras: dominio 19 €, traslado 29 €, 9 € por página de servicio)\n• **Auditoría SEO y SEM**: **gratis**\n• **Cobro de citas** con tu Stripe: incluido en el asistente',
  };

  const TEMAS = {
    asistente: ['asistente', 'bot', 'chatbot', 'chat', 'whatsapp', 'cuota', 'mantenimiento', 'alta'],
    web: ['web', 'pagina', 'paginas', 'dominio', 'diseno', 'alojamiento', 'hosting'],
    auditoria: ['auditoria', 'seo', 'sem', 'informe', 'analisis', 'google'],
    cobros: ['senal', 'cobro', 'cobrar', 'stripe', 'deposito', 'fianza'],
  };

  const INTENCIONES = [
    { id: 'simular', claves: ['simula*', 'ensena*', 'ver una reserva', 'reserva en vivo', 'como reserva', 'simular una reserva', 'hacer una reserva', 'probar una reserva', 'como reservaria', 'prueba de reserva', 'ponme a prueba'] },
    { id: 'saludo', claves: ['hola', 'buenas', 'buenos dias', 'buenas tardes', 'buenas noches', 'hey', 'que tal', 'saludos'],
      r: '¡Hola! Soy **Botix**, el asistente de Botix. Pregúntame lo que quieras sobre lo que vendemos: el asistente de citas, las webs, la auditoría SEO o los cobros.',
      op: ['¿Qué es Botix?', '¿Cuánto cuesta?', 'Simular una reserva'] },
    { id: 'quien', claves: ['quien eres', 'eres un bot', 'eres un robot', 'eres una ia', 'eres una maquina', 'eres humano', 'eres una persona', 'eres real', 'como te llamas', 'botix'],
      r: 'Soy **Botix**, un asistente virtual. Me han hecho para contarte a fondo todo lo que vende Botix.\n\nFunciono solo en tu navegador: no guardo ni envío lo que escribes. El asistente que montamos para tu negocio es igual de rápido, pero conectado a tu agenda de verdad.',
      op: ['¿Qué es Botix?', 'Simular una reserva'] },
    { id: 'que_es', claves: ['que es', 'que haceis', 'que hace', 'que hacen', 'que vendeis', 'que ofreceis', 'en que consiste', 'para que sirve', 'que es botix', 'servicios', 'productos', 'exactamente'],
      r: 'Botix es un **asistente para negocios que trabajan con cita**. Atiende a tus clientes por **WhatsApp, Instagram, Telegram y tu web**, da citas de verdad en tu agenda, les recuerda la cita la tarde antes y te pasa lo que no sabe.\n\nAdemás vendemos tres cosas que se manejan desde el mismo panel:\n• **Tu web profesional**, diseñada y alojada por nosotros\n• **Auditoría SEO y SEM gratis**, con informe en PDF\n• **Cobro de señales** al reservar, con tu propia cuenta de Stripe',
      op: ['¿Cuánto cuesta?', 'Simular una reserva', '¿Para qué negocios?', '¿Me hacéis la web?'] },
    { id: 'precio', claves: ['precio*', 'cuesta', 'cuestan', 'cuanto', 'vale', 'valen', 'tarifa*', 'coste', 'costo', 'caro', 'barato', 'euros', 'presupuesto'] },
    { id: 'cuota', tema: 'asistente', claves: ['por que una cuota', 'pago unico', 'mensualidad', 'cada mes', 'por que pagar', 'por que hay cuota', 'para que la cuota', 'cuota mensual'],
      r: 'Porque tu asistente no es un programa que se instala y se olvida: tiene que estar **encendido a las tres de la mañana**, guardar copia de tus citas cada día, seguir funcionando cuando WhatsApp o Instagram cambian algo y tener a alguien detrás si un día falla.\n\nEso cuesta cada mes, y preferimos decírtelo claro que esconderlo en un precio inicial que luego no alcanza. Así la cuota puede ser baja (**29 €/mes**) y no pagas de más si un día decides dejarlo.',
      op: ['¿Qué incluye la cuota?', '¿Hay permanencia?'] },
    { id: 'incluye', tema: 'asistente', claves: ['que incluye', 'incluye la cuota', 'que entra', 'que viene', 'mantenimiento'],
      r: 'Con el **alta** (299 €, una vez):\n• Asistente configurado para tu sector, con tu nombre y tus colores\n• Servicios, horario y preguntas frecuentes ya cargados\n• Tu panel con agenda, clientes y conversaciones\n• Chat para tu web, listo para pegar\n\nCon el **mantenimiento** (29 €/mes):\n• Servidor encendido día y noche, en la Unión Europea\n• Copia de seguridad diaria de tus citas y clientes\n• Actualizaciones, mejoras y parches de seguridad\n• Recordatorios automáticos de cita\n• Soporte por correo de una persona, no de un robot',
      op: ['¿Hay permanencia?', 'Quiero el mío'] },
    { id: 'permanencia', claves: ['permanencia', 'baja', 'darme de baja', 'cancelar suscripcion', 'compromiso', 'atado', 'dejarlo', 'irme', 'contrato'],
      r: '**No hay permanencia.** Te das de baja tú mismo desde tu panel, en **Ajustes → Suscripción**, sin llamar a nadie. El asistente sigue funcionando hasta el final del mes que ya has pagado y no se te cobra nada más.\n\nSi quieres volver más adelante, tus datos siguen ahí durante un tiempo y lo dejamos como estaba.',
      op: ['¿Qué pasa con mis datos?', '¿Cuánto cuesta?'] },
    { id: 'factura', claves: ['factura*', 'iva', 'impuestos', 'gestoria'],
      r: 'Sí. Cada cobro genera su **factura con IVA**, que te llega al correo y puedes descargar cuando quieras desde tu panel.\n\nLos precios que ves en la web son **sin IVA**. Y si cobras citas a tus clientes, puedes exportar todos los movimientos para tu gestoría con un clic.',
      op: ['¿Cómo se paga?', '¿Cuánto cuesta?'] },
    { id: 'pagar', claves: ['como pago', 'como se paga', 'forma de pago', 'formas de pago', 'pagar con tarjeta', 'domiciliacion', 'transferencia'],
      r: 'El alta y la primera cuota se pagan **con tarjeta, por Stripe**. Nosotros no vemos ni guardamos los datos de tu tarjeta. Después la cuota se cobra sola cada mes, y la factura con IVA te llega al momento.',
      op: ['¿Hay permanencia?', 'Quiero el mío'] },
    { id: 'contratar', tema: 'asistente', claves: ['contratar', 'contrato ya', 'quiero el mio', 'quiero contratar', 'darme de alta', 'alta', 'empezar', 'comprar', 'como empiezo', 'apuntarme', 'cuanto tarda', 'cuanto tiempo', 'tiempo tarda', 'rapido', 'cuando estaria'],
      r: () => `Son tres pasos y **menos de diez minutos**:\n\n1. Eliges tu sector y nos das cuatro datos: cómo se llama tu negocio, dónde estás y tu correo.\n2. Pagas el alta y la primera cuota con tarjeta. Sin permanencia.\n3. Te llega tu acceso con el asistente montado y una línea de código para ponerlo en tu web.\n\n${CONFIG.alta ? `Puedes empezar aquí: ${CONFIG.alta}` : 'Esta página es una demostración, así que desde aquí no se contrata: pide el enlace de alta al equipo de Botix.'}`,
      op: ['¿Qué incluye?', '¿Funciona con WhatsApp?'] },
    { id: 'whatsapp', tema: 'asistente', claves: ['whatsapp', 'wasap', 'wasa', 'whasap', 'guasap', 'whats', 'wsp', 'business', 'meta', 'mi numero'],
      r: 'Sí, con la **API oficial de WhatsApp Business**, la que permite que un asistente conteste por ti en tu número de empresa. Los recordatorios salen por el mismo chat.\n\nPara conectarlo necesitas:\n• una cuenta de empresa en Meta\n• un número que no esté usando la aplicación normal de WhatsApp en ese momento\n\nTe guiamos paso a paso. Un detalle: Meta cobra algunas conversaciones directamente a tu cuenta (por ejemplo, los recordatorios). Para un negocio pequeño suelen ser céntimos al mes.',
      op: ['¿Y en Instagram?', '¿Y en mi web?', 'Simular una reserva'] },
    { id: 'instagram', tema: 'asistente', claves: ['instagram', 'insta', 'directos', 'dm', 'mensajes directos'],
      r: 'Responde los **mensajes directos** de tu perfil profesional de Instagram: precios, horarios y citas, sin que el cliente salga de la conversación.',
      op: ['¿Y Telegram?', '¿Y en mi web?'] },
    { id: 'telegram', tema: 'asistente', claves: ['telegram'],
      r: 'Te creamos un **bot de Telegram** con el nombre de tu negocio, para quien prefiera escribir por ahí. Contesta y da citas igual que en WhatsApp.',
      op: ['¿Y en mi web?', '¿Cuánto cuesta?'] },
    { id: 'chat_web', tema: 'asistente', claves: ['chat en mi web', 'en mi web', 'y en mi web', 'widget', 'linea de codigo', 'pegar', 'wordpress', 'incrustar', 'poner en mi web', 'chat de la web'],
      r: 'Pegas **una línea de código** en tu web y aparece el chat abajo a la derecha, con tus colores. Como yo aquí, pero conectado a tu agenda de verdad.\n\n¿No tienes web? Te damos una página propia con tu chat para poner en tu perfil o en tus tarjetas. O te hacemos una web completa.',
      op: ['¿Me hacéis la web?', '¿Cuánto cuesta?'] },
    { id: 'canales', tema: 'asistente', claves: ['canales', 'donde atiende', 'donde contesta', 'redes', 'redes sociales', 'facebook', 'messenger', 'sms', 'llamadas', 'llamadas de telefono', 'contesta llamadas', 'coge el telefono', 'atiende el telefono', 'por telefono'],
      r: 'Atiende en **cuatro canales**:\n• **WhatsApp**, con la API oficial de WhatsApp Business\n• **Instagram**, en los mensajes directos\n• **Telegram**, con un bot con el nombre de tu negocio\n• **Tu web**, con un chat que se pega con una línea de código\n\nTodas las conversaciones llegan a la misma bandeja de tu panel. No contesta llamadas de teléfono: es un asistente de mensajes.',
      op: ['¿Funciona con WhatsApp?', 'Simular una reserva'] },
    { id: 'citas', tema: 'asistente', claves: ['cita', 'citas', 'reserv*', 'agenda', 'hueco*', 'doble', 'solap*', 'quien esta libre', 'profesional', 'barbero', 'equipo', 'turno*', 'horario'],
      r: 'Da hora **de verdad**. Conoce tu horario, tus servicios, cuánto dura cada uno y quién de tu equipo está libre. No ofrece huecos que no existen ni mete a dos personas a la misma hora.\n\nEl cliente elige servicio, día y hora, deja su nombre y su teléfono, y la cita aparece sola en tu agenda. Luego puede cambiarla o anularla él mismo con su enlace.',
      op: ['Simular una reserva', '¿Manda recordatorios?', '¿Y si no sabe algo?'] },
    { id: 'recordatorios', tema: 'asistente', claves: ['recordatorio*', 'recuerda', 'recordar', 'avisa', 'aviso', 'no vienen', 'no se presentan', 'plantones', 'anular', 'cambiar la cita', 'manda recordatorios'],
      r: 'La tarde antes escribe a cada cliente para **recordarle su cita**, y le deja **cambiarla o anularla** él mismo. Así hay menos huecos vacíos y no tienes que llamar a nadie.\n\nSi además quieres asegurarte de que vienen, puedes pedir una **señal** al reservar.',
      op: ['¿Cómo se cobra la señal?', 'Simular una reserva'] },
    { id: 'humano', tema: 'asistente', claves: ['persona', 'humano', 'hablar con alguien', 'queja', 'quejas', 'urgencia', 'urgente', 'control', 'bandeja', 'intervenir', 'si no sabe', 'no sabe algo', 'y si no sabe'],
      r: 'Cuando no lo tiene claro, **te lo pasa a ti**. Una queja, una urgencia o una pregunta rara llegan a tu bandeja marcadas, y el cliente sabe que le va a contestar una persona.\n\nLees la conversación entera, contestas tú desde el panel y, cuando acabas, se la devuelves al asistente. Mientras tanto, él no se mete. Y si un cliente quiere hablar con una persona, basta con que lo pida.',
      op: ['¿Se inventa cosas?', '¿Qué hay en el panel?'] },
    { id: 'ia', tema: 'asistente', claves: ['inteligencia artificial', 'ia', 'chatgpt', 'gpt', 'inventa', 'inventar', 'se inventa', 'alucina', 'robot', 'se equivoca', 'faltas', 'ortografia', 'entiende'],
      r: 'Contesta a partir de **lo que tú le cuentas**: tus servicios, tus precios, tu horario y tus preguntas frecuentes. Si le preguntan algo que no sabe, **no se lo inventa**: dice que contestará una persona y te pasa la conversación.\n\nSiempre se presenta como asistente virtual, para que nadie crea que habla con una persona. Y entiende mensajes escritos deprisa, con faltas de ortografía.',
      op: ['¿Y si no sabe algo?', 'Simular una reserva'] },
    { id: 'sectores', tema: 'asistente', claves: ['sector', 'sectores', 'negocios', 'para que negocios', 'tipo de negocio', 'mi negocio', 'peluqueria', 'estetica', 'dental', 'dentista', 'clinica', 'taller', 'mecanico', 'restaurante', 'bar', 'gimnasio', 'inmobiliaria', 'veterinari*', 'asesoria', 'despacho', 'fisio*', 'barberia', 'tienda', 'academia', 'psicolog*', 'masaje*', 'dentista', 'gym', 'yoga', 'pilates', 'abogado*', 'mascota*', 'manicura', 'belleza', 'pisos', 'odontolog*', 'osteopat*', 'tengo un', 'tengo una'],
      r: 'Viene preparado para **11 sectores**, cada uno con sus servicios, precios orientativos, horario típico y preguntas frecuentes ya puestos:\n\n• Clínica dental (su asistente se llama Sofía)\n• Peluquería y estética (Carla)\n• Barbería (Bruno)\n• Fisioterapia y salud (Marta)\n• Taller mecánico (Dani)\n• Restaurante (Leo)\n• Gimnasio y centro deportivo (Alex)\n• Inmobiliaria (Nuria)\n• Clínica veterinaria (Lucas)\n• Asesoría y despacho (Elena)\n• Cualquier otro negocio, con una plantilla en blanco\n\nLuego lo ajustas a tu gusto en dos minutos: nombres, precios, horario y respuestas.',
      op: ['Simular una reserva', '¿Cuánto cuesta?'] },
    { id: 'datos', claves: ['datos', 'rgpd', 'lopd', 'privacidad', 'proteccion de datos', 'seguridad', 'seguro', 'servidor*', 'europa', 'copia', 'hackeo', 'cifrado', 'exportar'],
      r: 'Tus datos y los de tus clientes **son tuyos**. Se guardan en servidores de la **Unión Europea**, con copia de seguridad diaria y conexión cifrada. Firmamos contigo el contrato de encargo de tratamiento que pide el RGPD, y si te vas, te llevas tus citas y tus clientes en una hoja de cálculo.\n\nPor dentro: las claves de tus canales se guardan cifradas, el panel admite verificación en dos pasos y cada negocio solo ve lo suyo.',
      op: ['¿Hay permanencia?', '¿Qué hay en el panel?'] },
    { id: 'informatica', claves: ['informatica', 'dificil', 'complicado', 'facil', 'tecnico', 'instalar', 'programar', 'saber de', 'no se de', 'ordenador', 'movil', 'tablet'],
      r: '**No hace falta saber de informática.** Eliges tu sector, pones el nombre de tu negocio y el asistente llega montado. Cambiar un precio o un horario es como rellenar un formulario.\n\nNo se instala nada en tu ordenador: todo funciona desde el navegador, también en el móvil.',
      op: ['¿Cuánto tarda en estar listo?', '¿Qué hay en el panel?'] },
    { id: 'panel', claves: ['panel', 'aplicacion', 'app', 'gestion', 'gestionar', 'clientes', 'estadisticas', 'consumo', 'que hay en el panel', 'que veo'],
      r: 'Desde tu **panel**, en el ordenador o en el móvil, tienes:\n• La **agenda** del día y de la semana\n• Tus **clientes** y su historial\n• **Todas las conversaciones** de todos los canales, en una bandeja\n• Tu **web**, con sus visitas y quién pulsa «Pide tu cita»\n• Tus **auditorías SEO** y sus PDF\n• **Cobros y facturas**\n• El **consumo** de tu asistente: conversaciones, mensajes y citas de cada mes',
      op: ['¿Me hacéis la web?', '¿Cómo se cobra la señal?'] },
    { id: 'web_google', tema: 'web', claves: ['sale bien en google', 'web en google', 'aparecer en google', 'posicionar mi web', 'web preparada'],
      r: 'Cada web sale **preparada para Google** de serie:\n• Título y descripción pensados para buscar\n• Dirección canónica, mapa del sitio y robots.txt\n• La ficha de tu negocio para Google, con horario y servicios\n• Vista bonita al compartirla por WhatsApp o redes\n• Aviso legal, privacidad y cookies (la web no pone cookies propias)\n\nY es muy ligera: sin plantillas pesadas, así carga rápido en el móvil.',
      op: ['¿Cuánto cuesta la web?', 'Auditoría gratis'] },
    { id: 'dominio', tema: 'web', claves: ['dominio', 'mi dominio', 'www', 'punto es', 'punto com', 'url', 'direccion de la web', 'dominio propio'],
      r: 'Puedes usar **tu propio dominio** (por ejemplo, tunegocio.es) por **19 €**, una vez.\n\nSolo hay que añadir dos registros en tu proveedor de dominio: uno que demuestra que es tuyo y otro que apunta a nuestro servidor. Botix lo comprueba, saca el certificado HTTPS solo y une la versión con y sin www.\n\nSi no tienes dominio, tu web sale en una dirección nuestra con el nombre de tu negocio.',
      op: ['¿Cuánto cuesta la web?', 'Traslado de mi web'] },
    { id: 'traslado', tema: 'web', claves: ['traslado', 'migrar', 'migracion', 'web anterior', 'web antigua', 'ya tengo web', 'cambiar de web', 'redirecciones', 'traslado de mi web'],
      r: 'Si ya tienes web, la miramos con lupa antes de empezar: qué falla, qué funciona y qué hace mejor tu competencia.\n\nCon el **traslado** (**29 €**, una vez) redirigimos tus páginas antiguas a las nuevas, para no perder lo que Google ya conocía de ti ni los enlaces que la gente tenga guardados.',
      op: ['¿Cuánto cuesta la web?', 'Dominio propio'] },
    { id: 'sin_web', tema: 'web', claves: ['no tengo web', 'sin web', 'necesito web', 'necesito tener web', 'hace falta web', 'tener pagina'],
      r: '**No necesitas web** para el asistente: puede atender solo por WhatsApp, Instagram o Telegram, y te damos una página propia con tu chat para tu perfil o tus tarjetas.\n\nY si quieres una web de verdad, te la hacemos: **99 €** + **15 €/mes**.',
      op: ['¿Me hacéis la web?', '¿Funciona con WhatsApp?'] },
    { id: 'web', tema: 'web', claves: ['web', 'pagina web', 'paginas web', 'me haceis la web', 'hacer la web', 'disenar', 'diseno', 'alojamiento', 'hosting', 'fotos', 'competencia', 'plantilla', 'landing'],
      r: 'Te **diseñamos la web y te la alojamos**. Así funciona:\n\n1. **Análisis**: miramos tu web actual (si tienes) y hasta 5 de tu competencia: si enseñan precios, si dejan reservar, opiniones, velocidad en el móvil…\n2. **Textos**: los escribimos con tus servicios, precios y horario, y con lo que le falta a tu competencia. Nunca inventamos servicios ni precios.\n3. **Diseño**: tres estilos (Cristal, Nítida y Escaparate), tu color, fondo claro u oscuro y hasta 14 fotos.\n4. **Publicar**: la ves en ordenador y móvil antes, y sale con HTTPS, tu chat dentro y el botón «Pide tu cita».\n\nDespués ves las visitas, de dónde llegan y cuántos pulsan «Pide tu cita», llamar o WhatsApp. Y cada cambio se guarda como borrador hasta que lo publicas.',
      op: ['¿Cuánto cuesta la web?', '¿Sale bien en Google?', 'Dominio propio'] },
    { id: 'auditoria', tema: 'auditoria', claves: ['auditoria', 'seo', 'sem', 'posicionamiento', 'google', 'anuncios', 'informe', 'pdf', 'nota', 'analizar mi web', 'analisis', 'pagespeed', 'velocidad', 'auditoria gratis', 'que revisa'],
      r: 'Es **gratis** y tarda un minuto. Dejas tu web y tu correo, y te llega un **PDF** con tu nota de 0 a 100 y lo que conviene arreglar, empezando por lo que más clientes te cuesta.\n\nRevisa **más de 35 cosas** en 8 áreas, explicadas sin tecnicismos:\n• **Base técnica**: HTTPS, si Google puede leerla, mapa del sitio\n• **Contenido**: título, descripción, encabezados, textos de las fotos\n• **Velocidad en el móvil**, medida por Google\n• **SEO local**: teléfono pulsable, WhatsApp, mapa, dirección\n• **Datos estructurados**: la ficha de tu negocio para Google\n• **Redes**: cómo se ve al compartirla\n• **Lista para anuncios**: analítica, píxeles y banner de cookies\n• **Seguridad**\n\nTambién sirve para mirar la web de tu competencia.',
      op: ['¿Me hacéis la web?', '¿Cuánto cuesta?'] },
    { id: 'cobros', tema: 'cobros', claves: ['cobro de citas', 'cobrar', 'cobro', 'cobros', 'senal', 'pago online', 'pagar por adelantado', 'adelantado', 'deposito', 'fianza', 'stripe', 'bizum', 'efectivo', 'como se cobra'],
      r: 'Si quieres, tu asistente **cobra una señal o el precio completo** al reservar, con **tu propia cuenta de Stripe**: el dinero va directo a ti, no pasa por nosotros.\n\n• Eliges: nada (se paga en el local), una señal en porcentaje o el precio entero\n• El importe lo calcula el servidor a partir del precio del servicio: nadie lo puede trucar\n• Una cita solo cuenta como pagada si Stripe lo confirma\n• Stripe no admite cobros de menos de 0,50 €\n\nLo que cobras en el local (efectivo, tarjeta, Bizum o transferencia) lo apuntas en un toque, y lo exportas todo para tu gestoría.',
      op: ['¿Hacéis factura?', '¿Cuánto cuesta?'] },
    { id: 'demo', claves: ['demo', 'demostracion', 'verlo funcionando', 'ver funcionando', 'ejemplo', 'probarlo', 'prueba', 'probar', 'en directo', 'antes de contratar'],
      r: 'Dos formas de verlo:\n\n• **Aquí mismo**: te simulo cómo atiende el asistente de una barbería y te reserva una cita, paso a paso.\n• **En directo**: el equipo de Botix te enseña uno de tu sector funcionando, sin compromiso.',
      op: ['Simular una reserva', '¿Para qué negocios?'] },
    { id: 'soporte', claves: ['soporte', 'ayuda', 'problema', 'falla', 'se cae', 'averia', 'atencion al cliente'],
      r: 'Si algo falla, te atiende **una persona por correo**, no un robot. El mantenimiento incluye actualizaciones, mejoras y parches de seguridad, y que tu asistente siga funcionando cuando WhatsApp o Instagram cambian algo.',
      op: ['¿Qué incluye la cuota?'] },
    { id: 'merece', claves: ['merece la pena', 'vale la pena', 'compensa', 'rentable', 'mas clientes', 'por que botix', 'diferencia', 'mejor que', 'ventajas', 'beneficio*'],
      r: 'Piensa en las citas que se escapan: mensajes que contestas tarde, llamadas que no coges con las manos ocupadas, gente que escribe a las once de la noche y por la mañana ya ha reservado en otro sitio.\n\nEl asistente contesta en segundos, a cualquier hora, y deja la cita hecha y recordada. Tú solo te ocupas de lo que de verdad necesita a una persona. Y sin permanencia: si no te compensa, lo dejas.',
      op: ['Simular una reserva', '¿Cuánto cuesta?'] },
    { id: 'contacto', claves: ['contacto', 'contactar', 'correo', 'mail', 'telefono', 'llamar', 'llamaros', 'comercial', 'ventas', 'escribiros', 'hablar con vosotros'],
      r: () => CONFIG.contacto
        ? `Puedes escribir al equipo de Botix a **${CONFIG.contacto}**. Te contesta una persona.`
        : 'Desde esta demostración no puedo pasarte con nadie: no recojo datos. Escribe al equipo de Botix por su canal habitual y te contesta una persona.',
      op: ['Simular una reserva', '¿Cuánto cuesta?'] },
    { id: 'gracias', claves: ['gracias', 'genial', 'perfecto', 'vale gracias', 'muchas gracias', 'guay', 'top'],
      r: '¡A ti! Si te surge otra duda, aquí sigo.', op: ['Simular una reserva', '¿Cuánto cuesta?'] },
    { id: 'adios', claves: ['adios', 'hasta luego', 'chao', 'nos vemos', 'bye'],
      r: '¡Hasta pronto! Que tu agenda se llene sola.' },
  ];

  const SECTORES = [
    { claves: ['dental', 'dentista', 'odontolog*'], sector: 'una clínica dental', nombre: 'Sofía', hace: 'hace de recepcionista virtual: da citas, atiende urgencias y responde a quien pide presupuesto' },
    { claves: ['barberia', 'barbero'], sector: 'una barbería', nombre: 'Bruno', hace: 'reserva con elección de barbero: corte, barba y afeitado' },
    { claves: ['peluqueria', 'estetica', 'peluquero', 'unas', 'manicura', 'belleza'], sector: 'una peluquería o centro de estética', nombre: 'Carla', hace: 'reserva eligiendo servicio y profesional' },
    { claves: ['fisio*', 'osteopat*', 'rehabilitacion', 'salud'], sector: 'fisioterapia o un centro de salud', nombre: 'Marta', hace: 'gestiona sesiones, primeras valoraciones y el seguimiento de pacientes' },
    { claves: ['taller', 'mecanico', 'coche', 'coches', 'itv'], sector: 'un taller mecánico', nombre: 'Dani', hace: 'da citas de taller, recoge peticiones de presupuesto e informa del estado de las reparaciones' },
    { claves: ['restaurante', 'bar', 'cafeteria', 'mesa', 'mesas'], sector: 'un restaurante', nombre: 'Leo', hace: 'reserva mesa y responde sobre la carta, los alérgenos y los eventos' },
    { claves: ['gimnasio', 'gym', 'crossfit', 'yoga', 'pilates', 'entrenador'], sector: 'un gimnasio o centro deportivo', nombre: 'Alex', hace: 'gestiona altas, clases dirigidas y sesiones con entrenador personal' },
    { claves: ['inmobiliaria', 'pisos', 'alquiler', 'inmuebles'], sector: 'una inmobiliaria', nombre: 'Nuria', hace: 'capta interesados, organiza visitas a inmuebles y pide valoraciones' },
    { claves: ['veterinari*', 'mascota*', 'perro', 'gato'], sector: 'una clínica veterinaria', nombre: 'Lucas', hace: 'da citas para consultas y vacunas y atiende urgencias' },
    { claves: ['asesoria', 'despacho', 'gestoria', 'abogado*', 'abogados'], sector: 'una asesoría o despacho', nombre: 'Elena', hace: 'da citas con los asesores y pide la documentación para consultas fiscales o laborales' },
  ];

  // Opciones rápidas que no coinciden palabra por palabra con su intención
  const ATAJOS = {
    'cuanto cuesta': 'precio', 'cuanto cuesta la web': 'precio', 'que incluye': 'incluye', 'quiero el mio': 'contratar',
    'y en instagram': 'instagram', 'y telegram': 'telegram', 'para que negocios': 'sectores',
    'cuanto tarda en estar listo': 'contratar', 'auditoria gratis': 'auditoria', 'como se cobra la senal': 'cobros',
    'hay permanencia': 'permanencia', 'que pasa con mis datos': 'datos', 'haceis factura': 'factura',
    'que incluye la web y cuanto cuesta': 'precio', 'que revisa la auditoria seo gratis': 'auditoria',
    'como funciona el cobro de citas': 'cobros', 'ver todos los sectores': 'sectores', 'quiero contratar el asistente': 'contratar',
  };

  // ─────────────────────────────── simulación de una reserva
  const SERV = [
    { nombre: 'Corte de pelo', claves: ['corte', 'pelo', 'cortar', 'cabello'], precio: 15 },
    { nombre: 'Arreglo de barba', claves: ['barba', 'afeitar', 'afeitado', 'arreglo'], precio: 10 },
    { nombre: 'Corte + barba', claves: ['completo', 'ambos', 'los dos', 'todo'], precio: 22 },
  ];
  const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const HORAS = ['10:30', '12:00', '17:30', '19:00'];
  function proximosDias() {
    const d = new Date(), salida = [];
    while (salida.length < 3) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0) salida.push(`${DIAS[d.getDay()]} ${d.getDate()}`); }
    return salida;
  }
  const buscarServ = (t) => {
    if (hay(t, ['barba']) && hay(t, ['corte', 'pelo', 'cortar'])) return SERV[2];
    return SERV.find((s) => hay(t, s.claves)) || SERV.find((s) => t.includes(` ${normal(s.nombre).trim()} `));
  };

  // ─────────────────────────────── interfaz
  const panel = document.getElementById('botix');
  const lanzador = document.getElementById('bix-lanzador');
  const lista = document.getElementById('bix-mensajes');
  const opciones = document.getElementById('bix-opciones');
  const form = document.getElementById('bix-form');
  const entrada = document.getElementById('bix-entrada');
  if (!panel) return;
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let tema = null;
  let sim = null;
  let cola = Promise.resolve();
  let iniciado = false;

  function pintar(texto, clase) {
    const m = document.createElement('div');
    m.className = `msj ${clase}`;
    // **negrita** sin innerHTML: el texto del usuario nunca se interpreta
    String(texto).split(/(\*\*[^*]+\*\*)/g).forEach((trozo) => {
      if (/^\*\*[^*]+\*\*$/.test(trozo)) { const b = document.createElement('b'); b.textContent = trozo.slice(2, -2); m.append(b); }
      else if (trozo) m.append(document.createTextNode(trozo));
    });
    lista.append(m);
    lista.scrollTop = lista.scrollHeight;
    return m;
  }
  function ponerOpciones(items = []) {
    opciones.replaceChildren(...items.map((t) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = t;
      b.addEventListener('click', () => enviar(t));
      return b;
    }));
  }
  // Las respuestas salen en orden, con un «escribiendo…» proporcional al texto
  function decir(texto, op = [], clase = 'msj--bot') {
    cola = cola.then(() => new Promise((listo) => {
      const puntos = document.createElement('div');
      puntos.className = 'escribiendo';
      puntos.setAttribute('aria-hidden', 'true');
      puntos.append(document.createElement('i'), document.createElement('i'), document.createElement('i'));
      lista.append(puntos);
      lista.scrollTop = lista.scrollHeight;
      const espera = quieto ? 150 : Math.min(1300, 380 + String(texto).length * 3);
      setTimeout(() => { puntos.remove(); pintar(texto, clase); ponerOpciones(op); listo(); }, espera);
    }));
    return cola;
  }
  const nota = (t) => { cola = cola.then(() => { pintar(t, 'msj--nota'); }); };

  function saludar({ rapido = false } = {}) {
    lista.replaceChildren();
    tema = null; sim = null; cola = Promise.resolve();
    iniciado = true;
    if (rapido) { pintar('¡Hola! Soy **Botix**, el asistente de Botix.', 'msj--bot'); return; }
    decir('¡Hola! Soy **Botix**, el asistente de Botix. Pregúntame lo que quieras sobre lo que vendemos: el asistente de citas, las webs, la auditoría SEO o los cobros.',
      ['¿Qué es Botix?', '¿Cuánto cuesta?', 'Simular una reserva', '¿Me hacéis la web?']);
  }

  // ── el cerebro
  function temaDe(t) {
    for (const [nombre, claves] of Object.entries(TEMAS)) if (hay(t, claves)) return nombre;
    return null;
  }
  function entender(t) {
    const atajo = ATAJOS[t.trim()];
    if (atajo) return INTENCIONES.find((i) => i.id === atajo);
    const ps = t.trim().split(' ');
    let mejor = null, max = 0;
    for (const it of INTENCIONES) {
      const p = it.claves.reduce((s, c) => s + puntos(t, ps, c), 0);
      if (p > max) { max = p; mejor = it; }
    }
    return max >= 1 ? mejor : null;
  }
  function responderPrecio(t) {
    const quien = temaDe(t) || tema;
    if (quien && PRECIOS[quien]) {
      tema = quien;
      const sig = { asistente: ['¿Qué incluye la cuota?', '¿Por qué una cuota?', 'Quiero el mío'],
        web: ['¿Me hacéis la web?', 'Dominio propio', '¿Sale bien en Google?'],
        auditoria: ['¿Qué revisa?', '¿Me hacéis la web?'], cobros: ['¿Cómo se cobra la señal?', '¿Hacéis factura?'] }[quien];
      return decir(PRECIOS[quien], sig);
    }
    return decir(PRECIOS.todo, ['¿Qué incluye el asistente?', '¿Me hacéis la web?', '¿Hay permanencia?']);
  }

  function empezarSim() {
    sim = { paso: 'servicio', fallos: 0 };
    nota('Simulación · así atendería el asistente de una barbería ficticia. Escribe «salir» para volver conmigo.');
    decir('¡Hola! Soy **Bruno**, el asistente de Barbería La Navaja. ¿Qué te hacemos?\n\n• Corte de pelo · 15 €\n• Arreglo de barba · 10 €\n• Corte + barba · 22 €', SERV.map((s) => s.nombre), 'msj--bot msj--sim');
  }
  function pasoSim(original, t) {
    const simDecir = (texto, op) => decir(texto, op, 'msj--bot msj--sim');
    if (hay(t, ['salir', 'cancelar', 'dejalo', 'parar', 'terminar', 'volver'])) {
      sim = null;
      nota('Fin de la simulación.');
      return decir('He vuelto. ¿Qué más quieres saber de Botix?', ['¿Cuánto cuesta?', '¿Funciona con WhatsApp?', 'Quiero el mío']);
    }
    const fallo = (texto, op) => {
      sim.fallos += 1;
      if (sim.fallos >= 3) return simDecir(`${texto}\n\n(Si prefieres dejarlo, escribe «salir».)`, [...op, 'Salir']);
      return simDecir(texto, op);
    };
    if (sim.paso === 'servicio') {
      const s = buscarServ(t);
      if (!s) return fallo('Tenemos corte, barba o los dos juntos. ¿Cuál prefieres?', SERV.map((x) => x.nombre));
      Object.assign(sim, { paso: 'dia', servicio: s, fallos: 0 });
      return simDecir(`${s.nombre}, ${s.precio} €. ¿Qué día te viene bien?`, proximosDias());
    }
    if (sim.paso === 'dia') {
      const dias = proximosDias();
      const dia = dias.find((d) => t.includes(` ${normal(d).trim()} `) || hay(t, [normal(d).trim().split(' ')[0]]))
        || (hay(t, ['manana']) ? dias[0] : null);
      if (!dia) return fallo('Puedo ofrecerte alguno de estos días:', dias);
      Object.assign(sim, { paso: 'hora', dia, fallos: 0 });
      return simDecir(`El ${dia} tengo libre:`, HORAS);
    }
    if (sim.paso === 'hora') {
      const hora = HORAS.find((h) => original.includes(h) || t.includes(` ${h.split(':')[0]} `) || t.includes(` ${h.replace(':', ' ')} `));
      if (!hora) return fallo('Elige una de estas horas:', HORAS);
      Object.assign(sim, { paso: 'nombre', hora, fallos: 0 });
      return simDecir('¿A nombre de quién la pongo?');
    }
    if (sim.paso === 'nombre') {
      const nombre = original.trim().replace(/^(soy|me llamo|a nombre de)\s+/i, '').slice(0, 40) || 'cliente';
      const { servicio, dia, hora } = sim;
      sim = null;
      simDecir(`Hecho, ${nombre}. ${servicio.nombre} el ${dia} a las ${hora}, ${servicio.precio} €. Te escribo la tarde antes para recordártelo.`);
      nota('Fin de la simulación. No se ha reservado nada.');
      return decir('Así de fácil. En un negocio de verdad, la cita ya estaría en su agenda, el cliente tendría un enlace para cambiarla y le llegaría el recordatorio. ¿Te lo montamos para el tuyo?',
        ['¿Cuánto cuesta?', 'Quiero el mío', '¿Para qué negocios?']);
    }
  }

  function enviar(texto) {
    const original = String(texto || '').trim().slice(0, 300);
    if (!original) return;
    const t = normal(original);
    if (!iniciado) {
      if (entender(t)?.id === 'saludo') { lista.replaceChildren(); iniciado = true; }
      else saludar({ rapido: true });
    }
    pintar(original, 'msj--yo');
    ponerOpciones([]);
    entrada.value = '';

    if (sim) return pasoSim(original, t);

    const it = entender(t);
    if (!it) {
      return decir(`Esa no me la sé, y prefiero no inventármela. ${CONFIG.contacto ? `Te la confirma una persona del equipo en **${CONFIG.contacto}**.` : 'Te la confirma una persona del equipo de Botix.'}\n\nDe esto sí puedo contarte todo:`,
        ['¿Qué es Botix?', '¿Cuánto cuesta?', '¿Me hacéis la web?', 'Auditoría gratis', 'Simular una reserva']);
    }
    if (it.id === 'simular') return empezarSim();
    if (it.id === 'precio') return responderPrecio(t);
    if (it.id === 'sectores') {
      const s = SECTORES.find((x) => hay(t, x.claves));
      tema = 'asistente';
      if (s) return decir(`Para ${s.sector} viene **${s.nombre}**, que ${s.hace}.

Llega con los servicios, los precios orientativos, el horario típico y las preguntas frecuentes de tu oficio ya puestos. Tú cambias lo que quieras en dos minutos: nombres, precios, horario y respuestas.`, ['Simular una reserva', '¿Cuánto cuesta?', 'Ver todos los sectores']);
    }
    if (it.tema) tema = it.tema;
    const r = typeof it.r === 'function' ? it.r() : it.r;
    return decir(r, it.op || []);
  }

  // ── abrir y cerrar
  function abrir({ saludo = true } = {}) {
    if (panel.hidden) {
      panel.hidden = false;
      panel.classList.remove('abriendo');
      void panel.offsetWidth;
      panel.classList.add('abriendo');
      lanzador.setAttribute('aria-expanded', 'true');
    }
    if (!iniciado && saludo) saludar();
    if (matchMedia('(min-width: 761px)').matches) entrada.focus({ preventScroll: true });
  }
  function cerrar() {
    panel.hidden = true;
    lanzador.setAttribute('aria-expanded', 'false');
    lanzador.focus({ preventScroll: true });
  }
  lanzador.addEventListener('click', abrir);
  document.getElementById('bix-cerrar').addEventListener('click', cerrar);
  document.getElementById('bix-reiniciar').addEventListener('click', () => { saludar(); entrada.focus({ preventScroll: true }); });
  form.addEventListener('submit', (e) => { e.preventDefault(); enviar(entrada.value); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) cerrar(); });

  window.Botix = {
    abrir: () => abrir(),
    preguntar(texto) { abrir({ saludo: false }); enviar(texto); },
  };
})();

