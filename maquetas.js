// Las maquetas de producto, en movimiento: la conversación se escribe sola, la
// web recibe un clic y cambia de diseño, la auditoría puntúa y la señal se
// cobra. Cada una corre en bucle solo mientras se ve. Sin JavaScript o con
// «reducir movimiento» se queda la imagen fija del HTML, que es el final.
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const $ = (r, s) => r.querySelector(s);
  const $$ = (r, s) => [...r.querySelectorAll(s)];

  class Parada extends Error {}
  function bucle(maqueta, guion, reposo) {
    let turno = 0;
    const correr = async () => {
      const mio = ++turno;
      const espera = (ms) => new Promise((ok, no) => setTimeout(() => (mio === turno ? ok() : no(new Parada())), ms));
      try { for (;;) await guion(espera); } catch (e) { if (!(e instanceof Parada)) throw e; }
    };
    maqueta.classList.add('anim');
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) correr();
      else { turno++; reposo(); }
    }, { threshold: 0.35 }).observe(maqueta);
    document.addEventListener('visibilitychange', () => { if (document.hidden) { turno++; reposo(); } });
  }
  const sinTransicion = (el, fn) => { el.classList.add('sin-trans'); fn(); void el.offsetWidth; el.classList.remove('sin-trans'); };

  // ─────────────────────────────── 01 · la conversación de madrugada
  const chat = document.querySelector('.maqueta--chat');
  if (chat) {
    const burbujas = $$(chat, '.burbuja');
    const aviso = $(chat, '.chatm__aviso');
    const hora = $(chat, '.chatm__hora');
    const todo = [...burbujas, aviso];
    const fin = () => { todo.forEach((b) => { b.classList.remove('teclea'); b.classList.add('ver'); }); hora.textContent = '03:14'; };
    fin();
    bucle(chat, async (espera) => {
      todo.forEach((b) => b.classList.remove('ver', 'teclea', 'llega'));
      hora.textContent = '03:14';
      await espera(700);
      for (const b of burbujas) {
        if (b.classList.contains('burbuja--bot')) {
          b.classList.add('teclea');
          await espera(1150);
          b.classList.remove('teclea');
          b.classList.add('ver');
          await espera(1500);
        } else {
          b.classList.add('ver');
          await espera(950);
        }
      }
      hora.textContent = '03:15';
      aviso.classList.add('ver', 'llega');
      await espera(4600);
    }, fin);
  }

  // ───────────────────────── 02 · la web: un clic y tres diseños
  const web = document.querySelector('.maqueta--web');
  if (web) {
    const TEMAS = [['Cristal', ''], ['Nítida', 'nitida'], ['Escaparate', 'escaparate']];
    const cuerpo = $(web, '.webm');
    const boton = $(web, '.webm__boton');
    const fab = $(web, '.webm__chat');
    const [visitas, clics] = $$(web, '.webm__datos b');
    const cursor = document.createElement('span');
    cursor.className = 'webm__cursor';
    cursor.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M5 3l14 8-6.2 1.6L10 19z" fill="#fff" stroke="#05061a" stroke-width="1.4" stroke-linejoin="round"/></svg>';
    const chip = document.createElement('span');
    chip.className = 'webm__tema';
    web.append(cursor, chip);
    let n = 0, v = 1284, c = 96;
    const ir = (el, dx = 0, dy = 0) => {
      const m = web.getBoundingClientRect(), r = el.getBoundingClientRect();
      const k = m.width / web.offsetWidth || 1;
      cursor.style.transform = `translate(${((r.left + r.width / 2 - m.left) / k + dx).toFixed(1)}px, ${((r.top + r.height / 2 - m.top) / k + dy).toFixed(1)}px)`;
    };
    const pulso = (el) => { el.classList.remove('pulsa'); void el.offsetWidth; el.classList.add('pulsa'); };
    const fmt = (x) => String(x).replace(/\B(?=(\d{3})+$)/g, '.');
    const tema = (i) => { cuerpo.dataset.tema = TEMAS[i][1]; chip.textContent = `Diseño · ${TEMAS[i][0]}`; };
    const fin = () => { tema(0); cursor.classList.remove('ver'); };
    tema(0);
    bucle(web, async (espera) => {
      tema(n % TEMAS.length);
      pulso(chip);
      cursor.classList.add('ver');
      ir(fab, -90, -70);
      await espera(1100);
      ir(boton, 8, 10);
      await espera(1050);
      pulso(boton);
      c += 1; v += 2 + (n % 3);
      clics.textContent = fmt(c); visitas.textContent = fmt(v);
      pulso(clics); pulso(visitas);
      await espera(1200);
      ir(fab, 4, 6);
      await espera(1000);
      pulso(fab);
      await espera(1700);
      n += 1;
    }, fin);
  }

  // ─────────────────────────────── 03 · la auditoría puntúa la web
  const seo = document.querySelector('.maqueta--seo');
  if (seo) {
    const nota = $(seo, '.seom__nota b');
    const estado = $(seo, '.seom__pdf span');
    const barrido = document.createElement('span');
    barrido.className = 'seom__barrido';
    seo.append(barrido);
    const fin = () => { seo.classList.add('corre'); seo.classList.remove('escanea'); nota.textContent = '82'; estado.textContent = 'listo'; estado.classList.remove('espera'); };
    bucle(seo, async (espera) => {
      sinTransicion(seo, () => seo.classList.remove('corre', 'escanea'));
      nota.textContent = '0';
      estado.textContent = 'analizando…';
      estado.classList.add('espera');
      await espera(500);
      seo.classList.add('corre', 'escanea');
      window.Efectos?.contar(nota, 82, 1700);
      await espera(2300);
      estado.textContent = 'listo';
      estado.classList.remove('espera');
      estado.classList.remove('pulsa'); void estado.offsetWidth; estado.classList.add('pulsa');
      seo.classList.remove('escanea');
      await espera(5600);
    }, fin);
  }

  // ─────────────────────────────── 04 · la señal se cobra sola
  const cobro = document.querySelector('.maqueta--cobro');
  if (cobro) {
    const eti = $(cobro, '.cobrom__eti');
    const lineas = $$(cobro, '.cobrom__linea');
    const senal = $(cobro, '.cobrom__linea b.ok');
    const factura = $(cobro, '.cobrom__fact');
    const fin = () => {
      [...lineas, factura].forEach((l) => l.classList.add('ver'));
      eti.textContent = 'Cita confirmada'; eti.classList.remove('pend');
      senal.textContent = '13,50 € pagado'; senal.classList.remove('cobrando');
    };
    fin();
    bucle(cobro, async (espera) => {
      [lineas[1], lineas[2], factura].forEach((l) => l.classList.remove('ver'));
      factura.classList.remove('llega');
      eti.textContent = 'Esperando la señal'; eti.classList.add('pend');
      senal.textContent = 'cobrando…'; senal.classList.add('cobrando'); senal.classList.remove('pulsa');
      await espera(900);
      lineas[1].classList.add('ver');
      await espera(1700);
      senal.textContent = '13,50 € pagado'; senal.classList.remove('cobrando'); senal.classList.add('pulsa');
      eti.textContent = 'Cita confirmada'; eti.classList.remove('pend');
      await espera(650);
      lineas[2].classList.add('ver');
      await espera(700);
      factura.classList.add('ver', 'llega');
      await espera(4800);
    }, fin);
  }
})();
