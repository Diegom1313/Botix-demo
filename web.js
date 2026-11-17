// Movimiento de la página: el menú que va y viene, entradas, tarjetas que
// se apilan y el manifiesto que se lee al ritmo del scroll. Todo respeta
// «reducir movimiento» y, si algo falla, el contenido queda visible igualmente.
(() => {
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Menú fijo: se esconde al bajar, vuelve al subir y marca la sección
  const barra = document.getElementById('barra');
  const enlaces = [...document.querySelectorAll('.nav__enlaces a')];
  const pastilla = document.querySelector('.nav__pastilla');
  const botonMenu = document.getElementById('nav-menu');
  const secciones = enlaces.map((a) => document.querySelector(a.getAttribute('href')));
  let yAntes = Math.max(0, scrollY), bajado = 0, activo = null, encima = null;
  const colocar = () => {
    const a = encima || activo;
    pastilla.classList.toggle('ver', !!a);
    if (!a) return;
    pastilla.style.setProperty('--x', `${a.offsetLeft}px`);
    pastilla.style.setProperty('--w', `${a.offsetWidth}px`);
  };
  const abrirMenu = (si) => {
    barra.classList.toggle('abierta', si);
    botonMenu.setAttribute('aria-expanded', String(si));
    botonMenu.setAttribute('aria-label', si ? 'Cerrar el menú' : 'Abrir el menú');
  };
  function menu() {
    const y = Math.max(0, scrollY);
    const dy = y - yAntes; yAntes = y;
    barra.classList.toggle('compacta', y > 40);
    barra.style.setProperty('--p', Math.min(1, y / Math.max(1, document.documentElement.scrollHeight - innerHeight)).toFixed(4));
    // Al bajar se esconde; al subir, aunque sea un poco y estés donde estés, vuelve.
    if (y < 120 || barra.classList.contains('abierta') || barra.contains(document.activeElement)) { barra.classList.remove('oculta'); bajado = 0; }
    else if (dy > 0) { bajado += dy; if (bajado > 48) barra.classList.add('oculta'); }
    else if (dy < -2) { bajado = 0; barra.classList.remove('oculta'); }
    let nuevo = null;
    secciones.forEach((s, i) => { if (s && s.getBoundingClientRect().top < innerHeight * 0.45) nuevo = enlaces[i]; });
    const ultima = secciones[secciones.length - 1];
    if (ultima && ultima.getBoundingClientRect().bottom < innerHeight * 0.3) nuevo = null;
    if (nuevo !== activo) {
      activo?.classList.remove('activo'); activo?.removeAttribute('aria-current');
      activo = nuevo;
      activo?.classList.add('activo'); activo?.setAttribute('aria-current', 'true');
      colocar();
    }
  }
  if (barra) {
    enlaces.forEach((a) => {
      a.addEventListener('pointerenter', () => { encima = a; colocar(); });
      a.addEventListener('click', () => abrirMenu(false));
    });
    document.querySelector('.nav__enlaces').addEventListener('pointerleave', () => { encima = null; colocar(); });
    barra.addEventListener('focusin', () => barra.classList.remove('oculta'));
    botonMenu.addEventListener('click', () => abrirMenu(!barra.classList.contains('abierta')));
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && barra.classList.contains('abierta')) { abrirMenu(false); botonMenu.focus(); } });
    document.addEventListener('click', (e) => { if (!barra.contains(e.target)) abrirMenu(false); });
    addEventListener('scroll', menu, { passive: true });
    addEventListener('resize', () => { menu(); colocar(); });
    document.fonts?.ready.then(colocar);
    menu();
    vidrioLiquido(document.querySelector('.nav'));
  }

  // ── Cristal líquido (GlassSurface de React Bits): el mapa de desplazamiento
  // se dibuja a la medida del menú y el filtro SVG refracta lo que hay detrás.
  // Solo Chromium lo aplica a backdrop-filter; los demás se quedan con el esmerilado.
  function vidrioLiquido(nav) {
    const mapa = document.getElementById('vidrio-mapa');
    const ua = navigator.userAgent;
    const chromium = /Chrome\//.test(ua) && !/Firefox|FxiOS|EdgiOS|CriOS/.test(ua) && !(/Safari/.test(ua) && !/Chrome/.test(ua));
    const prueba = document.createElement('div');
    prueba.style.backdropFilter = 'url(#vidrio)';
    if (!nav || !mapa || !chromium || !prueba.style.backdropFilter) return;
    const dibujar = () => {
      const r = nav.getBoundingClientRect();
      const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
      const radio = h / 2, borde = Math.min(w, h) * 0.06;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`
        + '<defs><linearGradient id="r" x1="100%" y1="0%" x2="0%" y2="0%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="red"/></linearGradient>'
        + '<linearGradient id="b" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="blue"/></linearGradient>'
        + `<filter id="s" filterUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}"><feGaussianBlur stdDeviation="9"/></filter></defs>`
        + `<rect width="${w}" height="${h}" fill="black"/>`
        + `<rect width="${w}" height="${h}" rx="${radio}" fill="url(#r)"/>`
        + `<rect width="${w}" height="${h}" rx="${radio}" fill="url(#b)" style="mix-blend-mode:difference"/>`
        + `<rect x="${borde}" y="${borde}" width="${w - borde * 2}" height="${h - borde * 2}" rx="${radio - borde}" fill="hsl(0 0% 50% / .93)" filter="url(#s)"/></svg>`;
      mapa.setAttribute('href', `data:image/svg+xml,${encodeURIComponent(svg)}`);
    };
    let pendiente = 0;
    new ResizeObserver(() => { cancelAnimationFrame(pendiente); pendiente = requestAnimationFrame(dibujar); }).observe(nav);
    dibujar();
    nav.classList.add('liquido');
  }

  // ── Entradas del héroe a prueba de fallos
  const entradas = document.querySelectorAll('.appear');
  entradas.forEach((el) => el.addEventListener('animationend', (e) => { if (e.target === el) el.classList.add('is-in'); }));
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const anima = [...entradas].some((el) => (el.getAnimations ? el.getAnimations() : [])
      .some((a) => a.playState === 'running' || a.playState === 'finished'));
    if (!anima) entradas.forEach((el) => el.classList.add('is-in'));
  }));

  // ── Aparición de secciones al entrar en pantalla
  document.querySelectorAll('[data-stagger]').forEach((g) => {
    const paso = +g.dataset.stagger;
    g.querySelectorAll('[data-reveal]').forEach((el, i) => el.style.setProperty('--d', `${i * paso}ms`));
  });
  const verIO = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); verIO.unobserve(e.target); }
  }), { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('[data-reveal]').forEach((el) => verIO.observe(el));

  // Las maquetas (nota SEO, barras) se animan cuando su tarjeta se ve
  const tarjetaIO = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('is-visible'); tarjetaIO.unobserve(e.target); }
  }), { threshold: 0.3 });
  document.querySelectorAll('.tarjeta').forEach((t) => tarjetaIO.observe(t));

  // ── Tarjetas de servicios: se apilan y las de debajo encogen un poco
  const pila = document.querySelector('.pila');
  const tarjetas = [...document.querySelectorAll('.tarjeta')];
  const ancho = matchMedia('(min-width: 1081px)');
  let pendiente = false;
  function apilar() {
    pendiente = false;
    if (!ancho.matches || quieto) { tarjetas.forEach((t) => { t.style.transform = ''; }); return; }
    const r = pila.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight)));
    const n = tarjetas.length;
    tarjetas.forEach((t, i) => {
      const meta = 1 - (n - 1 - i) * 0.035;
      const k = Math.min(1, Math.max(0, (p - i / n) / (1 - i / n)));
      t.style.transform = `scale(${1 + (meta - 1) * k})`;
    });
  }

  // ── Manifiesto: se enciende palabra a palabra con el scroll
  const manifiesto = document.querySelector('[data-manifiesto]');
  let palabras = [];
  if (manifiesto && !quieto) {
    const texto = manifiesto.textContent.trim().split(/\s+/);
    manifiesto.textContent = '';
    texto.forEach((w, i) => {
      const s = document.createElement('span');
      s.className = 'pal';
      s.textContent = w;
      manifiesto.append(s);
      if (i < texto.length - 1) manifiesto.append(' ');
    });
    palabras = [...manifiesto.querySelectorAll('.pal')];
  }
  function leer() {
    if (!palabras.length) return;
    const r = manifiesto.getBoundingClientRect();
    const inicio = innerHeight * 0.85, fin = innerHeight * 0.35;
    const p = Math.min(1, Math.max(0, (inicio - r.top) / (inicio - fin + r.height * 0.6)));
    const hasta = Math.round(p * palabras.length);
    palabras.forEach((w, i) => w.classList.toggle('on', i < hasta));
  }

  const alMover = () => { if (!pendiente) { pendiente = true; requestAnimationFrame(() => { apilar(); leer(); }); } };
  addEventListener('scroll', alMover, { passive: true });
  addEventListener('resize', alMover);
  apilar(); leer();

  // ── La firma: el campo del héroe cambia de pregunta de ejemplo
  const campo = document.getElementById('pregunta-texto');
  const ejemplos = [
    'Pregúntale a Botix: ¿cuánto cuesta?',
    '¿Funciona con WhatsApp?',
    '¿Me hacéis la web?',
    '¿Hay permanencia?',
    '¿Se inventa cosas?',
  ];
  if (campo && !quieto) {
    let i = 0;
    setInterval(() => {
      if (document.activeElement === campo || campo.value) return;
      i = (i + 1) % ejemplos.length;
      campo.placeholder = ejemplos[i];
    }, 3200);
  }

  // ── El botón flotante de Botix sobra mientras se ve el héroe, que ya tiene su campo
  const lanzador = document.getElementById('bix-lanzador');
  const heroe = document.querySelector('.heroe');
  if (lanzador && heroe) {
    lanzador.classList.add('oculto');
    const visibles = new Set();
    const observador = new IntersectionObserver((entradas) => {
      for (const e of entradas) {
        const visible = e.target === heroe ? e.intersectionRatio >= 0.35 : e.isIntersecting;
        if (visible) visibles.add(e.target); else visibles.delete(e.target);
      }
      lanzador.classList.toggle('oculto', visibles.size > 0);
    }, { threshold: [0, 0.01, 0.35] });
    observador.observe(heroe);
    const compra = document.getElementById('comprar');
    if (compra) observador.observe(compra);
  }

  // ── Todo lo que abre a Botix
  const conBotix = (fn) => { if (window.Botix) fn(window.Botix); };
  document.getElementById('pregunta-heroe')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const t = campo.value.trim();
    campo.value = '';
    conBotix((b) => (t ? b.preguntar(t) : b.abrir()));
  });
  document.addEventListener('click', (e) => {
    const p = e.target.closest('[data-preguntar]');
    if (p) { conBotix((b) => b.preguntar(p.dataset.preguntar)); return; }
    if (e.target.closest('[data-abrir-bix]')) conBotix((b) => b.abrir());
  });
})();

