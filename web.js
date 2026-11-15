// Movimiento de la página: la esfera de luz del héroe, entradas, tarjetas que
// se apilan y el manifiesto que se lee al ritmo del scroll. Todo respeta
// «reducir movimiento» y, si algo falla, el contenido queda visible igualmente.
(() => {
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── La esfera de luz del héroe, dibujada aquí mismo (sin vídeos ni imágenes)
  function esferaDeLuz(lienzo) {
    const ctx = lienzo.getContext('2d');
    if (!ctx) return;
    let w = 0, h = 0, dpr = 1, enPantalla = true, ultimo = 0;
    const motas = Array.from({ length: 70 }, () => ({
      x: Math.random(), y: Math.random(), r: Math.random() * 1.3 + 0.3,
      v: Math.random() * 0.012 + 0.004, a: Math.random() * 0.35 + 0.08, f: Math.random() * 6.28,
    }));
    function medir() {
      dpr = Math.min(devicePixelRatio || 1, 1.5);
      w = lienzo.clientWidth; h = lienzo.clientHeight;
      lienzo.width = Math.round(w * dpr); lienzo.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    // Un haz de luz: una elipse muy alargada con degradado radial
    function haz(cx, cy, ang, largo, grosor, color, alfa) {
      ctx.save();
      ctx.translate(cx, cy); ctx.rotate(ang); ctx.scale(1, grosor / largo);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, largo / 2);
      g.addColorStop(0, `rgba(${color},${alfa})`);
      g.addColorStop(0.35, `rgba(${color},${alfa * 0.45})`);
      g.addColorStop(1, `rgba(${color},0)`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, largo / 2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    function pintar(ms) {
      const t = ms / 1000;
      const movil = w < 760;
      const cx = w * (movil ? 0.76 : 0.74), cy = h * (movil ? 0.28 : 0.4);
      const R = movil ? Math.min(w * 0.3, 130) : Math.min(h * 0.19, w * 0.125);
      const deriva = Math.sin(t * 0.25) * 0.035;
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#05090a'; ctx.fillRect(0, 0, w, h);

      // Halo de fondo y haces que atraviesan la esfera
      ctx.globalCompositeOperation = 'lighter';
      haz(cx, cy, 0, R * 7, R * 7, '20,60,90', 0.22);
      const L = Math.max(w, h) * 1.25;
      haz(cx, cy, -0.5 + deriva, L, R * 0.9, '255,140,40', 0.38);
      haz(cx, cy, -0.5 + deriva, L * 0.8, R * 0.22, '255,200,120', 0.55);
      haz(cx, cy, -0.3 - deriva, L * 0.9, R * 1.1, '40,110,200', 0.3);
      haz(cx, cy, -0.3 - deriva, L * 0.6, R * 0.25, '120,190,255', 0.4);
      haz(cx, cy, 0, R * 3.2, R * 3.2, '255,170,70', 0.12);

      // La esfera: cuerpo de cristal, remolino interior, borde y brillo
      ctx.globalCompositeOperation = 'source-over';
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
      const cuerpo = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R);
      cuerpo.addColorStop(0, 'rgba(225,238,255,0.55)');
      cuerpo.addColorStop(0.45, 'rgba(70,120,190,0.5)');
      cuerpo.addColorStop(0.85, 'rgba(20,40,70,0.7)');
      cuerpo.addColorStop(1, 'rgba(120,160,210,0.55)');
      ctx.fillStyle = cuerpo; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 3; i++) {
        const a = t * (0.22 + i * 0.07) + i * 2.1;
        haz(cx + Math.cos(a) * R * 0.25, cy + Math.sin(a * 1.3) * R * 0.2, a * 0.6 - 0.4, R * 2.2, R * 0.5,
          i === 1 ? '90,160,255' : '255,150,50', i === 1 ? 0.85 : 0.9);
      }
      haz(cx + R * 0.15, cy + R * 0.3, -0.5 + deriva, R * 2, R * 0.35, '255,220,160', 0.6);
      haz(cx, cy + R * 0.55, 0, R * 1.6, R * 0.7, '255,190,110', 0.45);
      ctx.restore();

      ctx.globalCompositeOperation = 'source-over';
      const borde = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
      borde.addColorStop(0, 'rgba(255,255,255,0.75)');
      borde.addColorStop(0.45, 'rgba(255,255,255,0.08)');
      borde.addColorStop(0.8, 'rgba(255,190,110,0.35)');
      borde.addColorStop(1, 'rgba(255,220,170,0.6)');
      ctx.strokeStyle = borde; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(cx, cy, R - 0.8, 0, Math.PI * 2); ctx.stroke();
      ctx.save();
      ctx.translate(cx - R * 0.42, cy - R * 0.48); ctx.rotate(-0.7); ctx.scale(1, 0.45);
      const brillo = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.32);
      brillo.addColorStop(0, 'rgba(255,255,255,0.55)'); brillo.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = brillo; ctx.beginPath(); ctx.arc(0, 0, R * 0.32, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      // Motas de polvo en suspensión
      ctx.globalCompositeOperation = 'lighter';
      for (const m of motas) {
        const y = ((m.y - t * m.v) % 1 + 1) % 1;
        const x = m.x + Math.sin(t * 0.3 + m.f) * 0.01;
        ctx.fillStyle = `rgba(255,214,160,${m.a * (0.6 + 0.4 * Math.sin(t + m.f))})`;
        ctx.beginPath(); ctx.arc(x * w, y * h, m.r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    function bucle(ms) {
      if (enPantalla && ms - ultimo > 32) { ultimo = ms; pintar(ms); }
      requestAnimationFrame(bucle);
    }
    medir();
    addEventListener('resize', () => { medir(); pintar(performance.now()); });
    pintar(quieto ? 4000 : performance.now());
    requestAnimationFrame(() => requestAnimationFrame(() => lienzo.classList.add('is-ready')));
    if (quieto) return;
    new IntersectionObserver(([e]) => { enPantalla = e.isIntersecting; }).observe(lienzo);
    requestAnimationFrame(bucle);
  }
  const lienzo = document.querySelector('.heroe__lienzo');
  if (lienzo) esferaDeLuz(lienzo);

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
    'Pregúntale a Bix: ¿cuánto cuesta?',
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

  // ── El botón flotante de Bix sobra mientras se ve el héroe, que ya tiene su campo
  const lanzador = document.getElementById('bix-lanzador');
  const heroe = document.querySelector('.heroe');
  if (lanzador && heroe) {
    lanzador.classList.add('oculto');
    new IntersectionObserver(([e]) => lanzador.classList.toggle('oculto', e.isIntersecting), { threshold: 0.35 }).observe(heroe);
  }

  // ── Todo lo que abre a Bix
  const conBix = (fn) => { if (window.Bix) fn(window.Bix); };
  document.getElementById('pregunta-heroe')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const t = campo.value.trim();
    campo.value = '';
    conBix((b) => (t ? b.preguntar(t) : b.abrir()));
  });
  document.addEventListener('click', (e) => {
    const p = e.target.closest('[data-preguntar]');
    if (p) { conBix((b) => b.preguntar(p.dataset.preguntar)); return; }
    if (e.target.closest('[data-abrir-bix]')) conBix((b) => b.abrir());
  });
})();
