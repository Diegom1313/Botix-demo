// Los cuatro canales en directo: un mensaje entra por su canal, viaja por su haz
// hasta Botix, Botix lo contesta y cae en la bandeja (AnimatedList de React Bits,
// en JavaScript sin dependencias). Sin movimiento, la bandeja queda como en el HTML.
(() => {
  const hub = document.querySelector('[data-hub]');
  if (!hub || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const COLOR = { whatsapp: '#3ddc84', instagram: '#ff5fa2', telegram: '#4cb8ff', web: '#9a8dff' };
  const NOMBRE = { whatsapp: 'WhatsApp', instagram: 'Instagram', telegram: 'Telegram', web: 'Tu web' };
  const MENSAJES = [
    ['web', 'Visitante', 'Quiero una limpieza dental', 'Cita: jueves a las 12:30', 'cita'],
    ['whatsapp', 'Pablo', 'Tengo que cambiar la cita del viernes', 'Cita movida al lunes a las 9:30', 'cita'],
    ['instagram', '@laura.m', '¿Tenéis menú sin gluten?', 'Te lo pasa a ti: no está en sus datos', 'humano'],
    ['telegram', 'Javi', 'Mesa para cuatro esta noche', 'Reserva: hoy a las 21:30', 'cita'],
    ['web', 'Visitante', '¿Aceptáis pago con tarjeta?', 'Contestado · sí, y por Bizum', 'ok'],
    ['whatsapp', 'Lucía', '¿Tenéis hueco mañana para mechas?', 'Cita: mañana a las 11:00', 'cita'],
    ['instagram', '@marcos.fit', '¿Cuánto cuesta la cuota?', 'Contestado · 39 €/mes', 'ok'],
    ['telegram', 'Ana', '¿Abrís el sábado?', 'Contestado · de 10:00 a 14:00', 'ok'],
  ];

  const svg = hub.querySelector('.hub__haces');
  const nucleo = hub.querySelector('.hub__nucleo');
  const placa = hub.querySelector('.hub__placa');
  const lista = hub.querySelector('.hub__lista');
  const citas = hub.querySelector('[data-citas]');
  const tarjetas = Object.fromEntries([...hub.querySelectorAll('.hub__canales li')].map((li) => [li.dataset.canal, li]));
  const NS = 'http://www.w3.org/2000/svg';
  let haces = {}, salida = null;

  const centro = (el, lado) => {
    const h = hub.getBoundingClientRect(), r = el.getBoundingClientRect();
    const x = lado === 'der' ? r.right : lado === 'izq' ? r.left : r.left + r.width / 2;
    return [x - h.left, r.top + r.height / 2 - h.top];
  };
  const camino = (de, a, vertical) => {
    const [x1, y1] = de, [x2, y2] = a;
    if (vertical) { const m = (y1 + y2) / 2; return `M${x1},${y1} C${x1},${m} ${x2},${m} ${x2},${y2}`; }
    const m = (x1 + x2) / 2;
    return `M${x1},${y1} C${m},${y1} ${m},${y2} ${x2},${y2}`;
  };
  const linea = (d, clase, color) => {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', d);
    p.setAttribute('class', clase);
    if (color) p.style.setProperty('--c', color);
    svg.append(p);
    return p;
  };

  function trazar() {
    const h = hub.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${h.width} ${h.height}`);
    svg.replaceChildren();
    haces = {};
    const vertical = getComputedStyle(hub).getPropertyValue('--vertical').trim() === '1';
    const p = placa.getBoundingClientRect();
    const radio = p.width / 2 + 6;
    const [cx, cy] = centro(placa);
    for (const [canal, li] of Object.entries(tarjetas)) {
      const de = vertical ? [centro(li)[0], li.getBoundingClientRect().bottom - h.top] : centro(li, 'der');
      const ang = Math.atan2(de[1] - cy, de[0] - cx);
      const a = vertical ? [cx, cy - radio] : [cx + Math.cos(ang) * radio, cy + Math.sin(ang) * radio];
      const d = camino(de, a, vertical);
      linea(d, 'haz');
      haces[canal] = linea(d, 'haz__luz', COLOR[canal]);
    }
    const bandeja = hub.querySelector('.hub__bandeja');
    const b = bandeja.getBoundingClientRect();
    const fin = vertical ? [cx, b.top - h.top] : [b.left - h.left, cy];
    const ini = vertical ? [cx, cy + radio] : [cx + radio, cy];
    const d = camino(ini, fin, vertical);
    linea(d, 'haz');
    salida = linea(d, 'haz__luz', '#2fd0ff');
    [...Object.values(haces), salida].forEach((l) => {
      const largo = l.getTotalLength();
      l.style.strokeDasharray = `${Math.min(110, largo * 0.45)} ${largo + 80}`;
      l.style.strokeDashoffset = `${Math.min(110, largo * 0.45)}`;
      l.dataset.largo = largo;
    });
  }

  const viajar = (l, ms) => {
    if (!l) return Promise.resolve();
    const largo = +l.dataset.largo, tramo = Math.min(110, largo * 0.45);
    return l.animate([
      { strokeDashoffset: tramo, opacity: 1 },
      { strokeDashoffset: -largo, opacity: 1 },
    ], { duration: ms, easing: 'cubic-bezier(.5,0,.2,1)' }).finished.catch(() => {});
  };

  function fila([canal, quien, texto, respuesta, tipo]) {
    const li = document.createElement('li');
    li.className = 'msg entra';
    li.dataset.canal = canal;
    li.innerHTML = '<span class="msg__av"></span><div><p class="msg__de"><b></b><span class="msg__tag"></span></p><p class="msg__txt"></p><p class="msg__ok escribe"><i></i><i></i><i></i></p></div>';
    li.querySelector('.msg__av').textContent = quien.replace('@', '')[0].toUpperCase();
    li.querySelector('b').textContent = quien;
    li.querySelector('.msg__tag').textContent = NOMBRE[canal];
    li.querySelector('.msg__txt').textContent = texto;
    li.contestar = () => {
      const ok = li.querySelector('.msg__ok');
      ok.className = `msg__ok${tipo === 'cita' ? ' msg__ok--cita' : tipo === 'humano' ? ' msg__ok--humano' : ''}`;
      ok.textContent = respuesta;
    };
    return li;
  }

  // Las filas se recolocan con FLIP para que bajen suaves al entrar una nueva
  function insertar(li) {
    const antes = new Map([...lista.children].map((el) => [el, el.getBoundingClientRect().top]));
    lista.prepend(li);
    [...lista.children].forEach((el, i) => {
      if (i >= (innerWidth < 761 ? 3 : 4)) { el.classList.add('sale'); el.addEventListener('animationend', () => el.remove(), { once: true }); setTimeout(() => el.remove(), 600); }
      const t = antes.get(el);
      if (t === undefined) return;
      const dy = t - el.getBoundingClientRect().top;
      if (dy) el.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 520, easing: 'cubic-bezier(.16,1,.3,1)' });
    });
  }

  let n = 0, turno = 0, dentro = false;
  const espera = (ms, mio) => new Promise((ok, no) => setTimeout(() => (mio === turno ? ok() : no(0)), ms));
  async function correr() {
    const mio = ++turno;
    try {
      await espera(500, mio);
      for (;;) {
        const m = MENSAJES[n++ % MENSAJES.length];
        const li = tarjetas[m[0]];
        li.classList.remove('llega'); void li.offsetWidth; li.classList.add('llega');
        const c = li.querySelector('[data-cuenta]'); c.textContent = +c.textContent + 1;
        await viajar(haces[m[0]], 750);
        if (mio !== turno) return;
        nucleo.classList.remove('late'); void nucleo.offsetWidth; nucleo.classList.add('late');
        await espera(260, mio);
        await viajar(salida, 520);
        if (mio !== turno) return;
        const f = fila(m);
        insertar(f);
        await espera(950, mio);
        f.contestar();
        if (m[4] === 'cita') citas.textContent = +citas.textContent + 1;
        await espera(1300, mio);
      }
    } catch { /* se paró: ya no se ve */ }
  }

  hub.classList.add('vivo');
  trazar();
  let pendiente = 0;
  new ResizeObserver(() => { cancelAnimationFrame(pendiente); pendiente = requestAnimationFrame(trazar); }).observe(hub);
  document.fonts?.ready.then(trazar);
  new IntersectionObserver(([e]) => {
    dentro = e.isIntersecting;
    if (dentro && !document.hidden) correr(); else turno++;
  }, { threshold: 0.25 }).observe(hub);
  document.addEventListener('visibilitychange', () => { if (document.hidden) turno++; else if (dentro) correr(); });
})();
