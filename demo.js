const SERVICIOS = [
  { nombre: 'Corte de pelo', claves: ['corte', 'pelo', 'cortar', 'cabello'], precio: 15, min: 30 },
  { nombre: 'Arreglo de barba', claves: ['barba', 'afeitar', 'afeitado'], precio: 10, min: 20 },
  { nombre: 'Corte y barba', claves: ['completo', 'ambos'], precio: 22, min: 45 },
];
const FAQS = [
  { claves: ['horario', 'hora', 'abris', 'abierto', 'cerrais', 'abre', 'sabado', 'domingo'], texto: 'Abrimos de lunes a viernes de 10:00 a 20:00 y los sábados de 10:00 a 14:00. Los domingos cerramos.' },
  { claves: ['donde', 'direccion', 'ubicacion', 'calle', 'llegar'], texto: 'Estamos en la calle Ejemplo, 12. Es una dirección ficticia, como todo en esta demostración.' },
  { claves: ['pago', 'tarjeta', 'bizum', 'efectivo'], texto: 'Puedes pagar con tarjeta, Bizum o efectivo.' },
  { claves: ['aparcar', 'aparcamiento', 'parking', 'coche'], texto: 'Hay un aparcamiento público a dos minutos andando.' },
];
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const HORAS = ['10:00', '11:30', '16:00', '18:30'];
const lista = document.getElementById('mensajes');
const opciones = document.getElementById('opciones');
const entrada = document.getElementById('entrada');
let reserva = null;

const limpiar = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[¿?¡!.,;:]/g, ' ');
const palabras = (t) => limpiar(t).split(/\s+/).filter(Boolean);

function distancia(a, b) {
  const f = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) f[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    f[i][j] = Math.min(f[i - 1][j] + 1, f[i][j - 1] + 1, f[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  }
  return f[a.length][b.length];
}

const parece = (p, clave) => p === clave || (p.length > 3 && clave.length > 3 && distancia(p, clave) <= (clave.length > 6 ? 2 : 1));
const contiene = (ps, claves) => ps.some((p) => claves.some((c) => parece(p, c)));
const buscarServicio = (ps) => {
  if (ps.some((p) => parece(p, 'barba')) && contiene(ps, ['corte', 'pelo'])) return SERVICIOS[2];
  return SERVICIOS.find((s) => contiene(ps, s.claves));
};

function pintar(texto, clase) {
  const m = document.createElement('div');
  m.className = `m ${clase}`;
  m.textContent = texto;
  lista.append(m);
  lista.scrollTop = lista.scrollHeight;
}

function ponerOpciones(items) {
  opciones.replaceChildren(...items.map((t) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = t;
    b.addEventListener('click', () => enviar(t));
    return b;
  }));
}

function proximosDias() {
  const salida = [];
  const d = new Date();
  while (salida.length < 3) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0) salida.push(`${DIAS[d.getDay()]} ${d.getDate()}`);
  }
  return salida;
}

function responder(texto, items = []) {
  setTimeout(() => {
    pintar(texto, 'bot');
    ponerOpciones(items);
  }, 300);
}

function pasoReserva(texto, ps) {
  if (contiene(ps, ['cancelar', 'anular', 'dejalo'])) {
    reserva = null;
    return responder('De acuerdo, lo dejamos aquí. ¿Te ayudo con otra cosa?', ['Precios', 'Horario']);
  }
  if (reserva.paso === 'servicio') {
    const s = buscarServicio(ps);
    if (!s) return responder('Tenemos corte, barba o los dos juntos. ¿Cuál prefieres?', SERVICIOS.map((x) => x.nombre));
    reserva = { paso: 'dia', servicio: s };
    return responder(`${s.nombre}, ${s.precio} €. ¿Qué día te viene bien?`, proximosDias());
  }
  if (reserva.paso === 'dia') {
    const dia = proximosDias().find((d) => limpiar(d) === limpiar(texto).trim() || ps.some((p) => parece(p, limpiar(d).split(' ')[0])));
    if (!dia) return responder('Puedo ofrecerte alguno de estos días:', proximosDias());
    reserva = { ...reserva, paso: 'hora', dia };
    return responder(`El ${dia} tengo estos huecos:`, HORAS);
  }
  if (reserva.paso === 'hora') {
    const hora = HORAS.find((h) => texto.includes(h) || texto.includes(h.split(':')[0]));
    if (!hora) return responder('Elige una de estas horas:', HORAS);
    reserva = { ...reserva, paso: 'nombre', hora };
    return responder('¿A nombre de quién la pongo?');
  }
  if (reserva.paso === 'nombre') {
    const nombre = texto.trim().slice(0, 40);
    const { servicio, dia, hora } = reserva;
    reserva = null;
    return responder(`Hecho, ${nombre}. ${servicio.nombre} el ${dia} a las ${hora}.\n\nEn el producto real se guardaría la cita y recibirías un enlace para cambiarla. Aquí no se ha reservado nada.`, ['Precios', 'Horario']);
  }
}

function enviar(texto) {
  const limpio = texto.trim();
  if (!limpio) return;
  pintar(limpio, 'cliente');
  opciones.replaceChildren();
  entrada.value = '';
  const ps = palabras(limpio);
  if (reserva) return pasoReserva(limpio, ps);
  if (contiene(ps, ['cita', 'reservar', 'reserva', 'hueco'])) {
    const servicio = buscarServicio(ps);
    if (servicio) {
      reserva = { paso: 'dia', servicio };
      return responder(`${servicio.nombre}, ${servicio.precio} €. ¿Qué día te viene bien?`, proximosDias());
    }
    reserva = { paso: 'servicio' };
    return responder('Claro. ¿Qué servicio quieres?', SERVICIOS.map((x) => x.nombre));
  }
  const faq = FAQS.find((f) => contiene(ps, f.claves));
  if (faq) return responder(faq.texto, ['Pedir cita', 'Precios']);
  if (contiene(ps, ['precio', 'cuesta', 'cuanto', 'vale', 'tarifa'])) {
    const s = buscarServicio(ps);
    if (s) return responder(`${s.nombre} cuesta ${s.precio} € y dura unos ${s.min} minutos. ¿Te reservo cita?`, ['Pedir cita', 'Horario']);
    return responder(SERVICIOS.map((x) => `${x.nombre}: ${x.precio} €`).join('\n'), ['Pedir cita', 'Horario']);
  }
  const s = buscarServicio(ps);
  if (s) return responder(`${s.nombre} cuesta ${s.precio} €. ¿Te reservo cita?`, ['Pedir cita', 'Precios']);
  if (contiene(ps, ['hola', 'buenas', 'buenos'])) return responder('¡Hola! ¿En qué puedo ayudarte?', ['Pedir cita', 'Precios', 'Horario']);
  if (contiene(ps, ['gracias', 'adios'])) return responder('Gracias a ti. ¡Hasta pronto!');
  return responder('No estoy seguro de haberte entendido. Puedo darte precios y horario, o reservarte una cita.', ['Pedir cita', 'Precios', 'Horario']);
}

function iniciar() {
  reserva = null;
  lista.replaceChildren();
  pintar('¡Hola! Soy el asistente de Barbería La Navaja. ¿En qué puedo ayudarte?', 'bot');
  ponerOpciones(['Pedir cita', 'Precios', 'Horario']);
}

document.getElementById('formulario').addEventListener('submit', (e) => {
  e.preventDefault();
  enviar(entrada.value);
});
document.getElementById('reiniciar').addEventListener('click', iniciar);
iniciar();
