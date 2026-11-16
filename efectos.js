// Efectos de la página, adaptados de React Bits (reactbits.dev) a JavaScript
// sin dependencias: Orb, SplitText/BlurText, DecryptedText, CountUp,
// SpotlightCard, TiltedCard, Magnet, ClickSpark y ScrollVelocity.
// Todo respeta «reducir movimiento» y, si algo falla, el contenido se ve igual.
(() => {
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fino = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const lim = (v, a, b) => Math.min(b, Math.max(a, v));
  const alVer = (els, fn, opciones = { threshold: 0.3 }) => {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { io.unobserve(e.target); fn(e.target); }
    }), opciones);
    els.forEach((el) => io.observe(el));
  };

  // ───────────────────────────────────────────── Orb: el anillo de luz
  const VERTICES = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

  const FRAGMENTOS = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uTiempo;
uniform float uGiro;
uniform float uOrbita;
uniform vec2 uAlcance;
uniform float uCerca;
uniform float uEscala;
uniform float uEco;
uniform float uEcoFuerza;
uniform float uRevela;
uniform vec3 uC1;
uniform vec3 uC2;
uniform vec3 uC3;
out vec4 color;

vec3 hash33(vec3 p) {
  p = fract(p * vec3(0.1031, 0.11369, 0.13787));
  p += dot(p, p.yxz + 19.19);
  return -1.0 + 2.0 * fract(vec3(p.x + p.y, p.x + p.z, p.y + p.z) * p.zyx);
}
float ruido(vec3 p) {
  const float K1 = 0.333333333;
  const float K2 = 0.166666667;
  vec3 i = floor(p + (p.x + p.y + p.z) * K1);
  vec3 d0 = p - (i - (i.x + i.y + i.z) * K2);
  vec3 e = step(vec3(0.0), d0 - d0.yzx);
  vec3 i1 = e * (1.0 - e.zxy);
  vec3 i2 = 1.0 - e.zxy * (1.0 - e);
  vec3 d1 = d0 - (i1 - K2);
  vec3 d2 = d0 - (i2 - K1);
  vec3 d3 = d0 - 0.5;
  vec4 h = max(0.6 - vec4(dot(d0, d0), dot(d1, d1), dot(d2, d2), dot(d3, d3)), 0.0);
  vec4 n = h * h * h * h * vec4(dot(d0, hash33(i)), dot(d1, hash33(i + i1)), dot(d2, hash33(i + i2)), dot(d3, hash33(i + 1.0)));
  return dot(vec4(31.316), n);
}
float luz1(float k, float a, float d) { return k / (1.0 + d * a); }
float luz2(float k, float a, float d) { return k / (1.0 + d * d * a); }

void main() {
  vec2 uv = (gl_FragCoord.xy - uRes * 0.5) / min(uRes.x, uRes.y) * 2.0 * uEscala;
  float rl = length(uv);
  vec2 dir = rl > 0.0001 ? uv / rl : vec2(1.0, 0.0);
  float ra = length(uAlcance);
  vec2 rd = ra > 0.00001 ? uAlcance / ra : vec2(1.0, 0.0);
  float cara = exp((dot(dir, rd) - 1.0) * 3.2);
  float len = max(rl - ra * cara * smoothstep(0.25, 0.65, rl), 0.0);
  uv = dir * len;
  float ang = atan(dir.y, dir.x);
  float inv = len > 0.0 ? 1.0 / len : 0.0;
  float cerca = cara * uCerca;

  float n0 = ruido(vec3(uv * 0.65, uTiempo * 0.5)) * 0.5 + 0.5;
  float r0 = mix(0.76, 0.84, n0);
  float d0 = distance(uv, (r0 * inv) * uv);
  float v0 = luz1(1.0, 10.0, d0) * smoothstep(r0 * 1.05, r0, len);
  v0 *= smoothstep(r0 * 0.8, r0 * 0.95, len);
  float cuerpo = smoothstep(0.6, 0.8, len);
  float cl = cos(ang + uGiro) * 0.5 + 0.5;

  vec2 cabeza = vec2(cos(uOrbita), sin(uOrbita));
  float d = distance(uv, cabeza * r0);
  float atras = atan(cabeza.x * dir.y - cabeza.y * dir.x, dot(dir, cabeza));
  float estela = smoothstep(0.0, 0.35, atras) * exp(-max(atras, 0.0) * 2.6);
  float v1 = (luz2(1.5, 5.0, d) + estela * 0.6) * luz1(1.0, 50.0, d0);
  float banda = v0 * smoothstep(1.0, mix(0.6, 1.0, n0 * 0.5), len) * cuerpo;
  float calor = pow(clamp(banda / 0.82, 0.0, 1.0), 3.0);
  float brillo = luz2(1.0, 160.0, max(len - r0, 0.0)) * smoothstep(0.4, 0.0, len - r0) * step(r0, len);
  float v2 = smoothstep(1.0, mix(0.6, 1.0, n0 * 0.5), len);

  vec3 base = mix(uC1, uC2, cl);
  float ed = abs(len - r0 - uEco);
  float eco = luz1(1.0, 60.0, ed) * smoothstep(0.12, 0.0, ed) * uEcoFuerza;

  vec3 c = mix(uC3, base, v0);
  c = (c + v1) * v2 * cuerpo * (1.0 + cerca * 0.35) + mix(base, vec3(1.0), 0.25) * calor * (0.28 + cerca * 0.3);
  c = clamp(c + base * (brillo * 0.1 + eco), 0.0, 1.0);

  float a = max(max(c.r, c.g), c.b);
  c /= a + 1e-5;
  float tramado = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0;
  a = clamp(a * uRevela + tramado, 0.0, 1.0);
  color = vec4(c * a * a, a);
}`;

  function orbe(lienzo) {
    const gl = lienzo.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false });
    if (!gl) return false;
    const compila = (tipo, fuente) => {
      const s = gl.createShader(tipo);
      gl.shaderSource(s, fuente);
      gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    };
    const vs = compila(gl.VERTEX_SHADER, VERTICES);
    const fs = compila(gl.FRAGMENT_SHADER, FRAGMENTOS);
    if (!vs || !fs) return false;
    const prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs);
    gl.bindAttribLocation(prog, 0, 'aPos');
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
    const u = {};
    for (let i = 0; i < gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS); i++) {
      const info = gl.getActiveUniform(prog, i);
      u[info.name] = gl.getUniformLocation(prog, info.name);
    }
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
    const C1 = rgb('#7c6cff'), C2 = rgb('#2fd0ff'), C3 = rgb('#14127a');
    const e = { t: 0, giro: 0, orbita: -1.2, eco: 1, revela: quieto ? 1 : 0, empuje: quieto ? 0 : 2.5, ax: 0, ay: 0, vx: 0, vy: 0, cerca: 0, pulso: 0, vp: 0 };
    const puntero = { x: 0, y: 0, dentro: false };
    let ancho = 1, alto = 1, visible = true, antes = 0, raf = 0;

    const medir = () => {
      const dpr = Math.min(devicePixelRatio || 1, 1.75);
      ancho = Math.max(1, lienzo.clientWidth); alto = Math.max(1, lienzo.clientHeight);
      lienzo.width = Math.round(ancho * dpr); lienzo.height = Math.round(alto * dpr);
    };
    const aOrbe = () => {
      const lado = Math.min(ancho, alto);
      return [((puntero.x - ancho / 2) / lado) * 2 / 0.82, ((alto / 2 - puntero.y) / lado) * 2 / 0.82];
    };
    const pintar = () => {
      const s = e.revela - 1;
      const crece = 1 + 2.2 * s * s * s + 1.2 * s * s;
      const r = lim(e.revela / 0.55, 0, 1);
      gl.viewport(0, 0, lienzo.width, lienzo.height);
      gl.useProgram(prog);
      gl.bindVertexArray(vao);
      gl.uniform2f(u.uRes, lienzo.width, lienzo.height);
      gl.uniform1f(u.uTiempo, e.t);
      gl.uniform1f(u.uGiro, e.giro);
      gl.uniform1f(u.uOrbita, e.orbita);
      gl.uniform2f(u.uAlcance, e.ax, e.ay);
      gl.uniform1f(u.uCerca, e.cerca);
      gl.uniform1f(u.uEscala, 1 / (0.82 * (1 + e.pulso) * (0.62 + 0.38 * crece)));
      gl.uniform1f(u.uEco, e.eco * 0.55);
      gl.uniform1f(u.uEcoFuerza, e.eco < 1 ? (1 - e.eco) * (1 - e.eco) : 0);
      gl.uniform1f(u.uRevela, r * r * (3 - 2 * r));
      gl.uniform3fv(u.uC1, C1); gl.uniform3fv(u.uC2, C2); gl.uniform3fv(u.uC3, C3);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const cuadro = (ahora) => {
      raf = 0;
      if (!visible || document.hidden) return;
      const dt = antes ? lim((ahora - antes) / 1000, 0.0005, 0.05) : 1 / 60;
      antes = ahora;
      const [px, py] = aOrbe();
      const dist = Math.hypot(px, py);
      const zona = puntero.dentro ? lim((1.7 - dist) / 0.5, 0, 1) : 0;
      const apunta = zona * lim((dist - 0.15) / 0.45, 0, 1);
      const gx = dist > 0.0001 ? (px / dist) * 0.075 * apunta : 0;
      const gy = dist > 0.0001 ? (py / dist) * 0.075 * apunta : 0;
      e.vx += (70 * (gx - e.ax) - 7 * e.vx) * dt; e.vy += (70 * (gy - e.ay) - 7 * e.vy) * dt;
      e.ax += e.vx * dt; e.ay += e.vy * dt;
      e.cerca += (apunta - e.cerca) * (1 - Math.exp(-dt / 0.12));
      e.t += dt;
      e.giro += dt * 2 * (1 + e.empuje);
      if (zona > 0.5) {
        const mira = Math.atan2(py, px);
        e.orbita += Math.atan2(Math.sin(mira - e.orbita), Math.cos(mira - e.orbita)) * (1 - Math.exp(-dt * 6));
      } else e.orbita -= dt;
      e.vp += (-170 * e.pulso - 11 * e.vp) * dt; e.pulso += e.vp * dt;
      e.empuje *= Math.exp(-dt * 2.5);
      e.revela = Math.min(1, e.revela + dt / 1.3);
      e.eco = Math.min(1, e.eco + dt / 1.2);
      pintar();
      raf = requestAnimationFrame(cuadro);
    };
    const despierta = () => { if (!raf && visible && !document.hidden && !quieto) { antes = 0; raf = requestAnimationFrame(cuadro); } };

    medir();
    addEventListener('resize', () => { medir(); pintar(); });
    if (quieto) { pintar(); return true; }
    addEventListener('pointermove', (ev) => {
      const r = lienzo.getBoundingClientRect();
      puntero.x = ev.clientX - r.left; puntero.y = ev.clientY - r.top;
      puntero.dentro = ev.pointerType === 'mouse';
    }, { passive: true });
    addEventListener('pointerdown', (ev) => {
      const r = lienzo.getBoundingClientRect();
      puntero.x = ev.clientX - r.left; puntero.y = ev.clientY - r.top;
      const [px, py] = aOrbe();
      if (Math.hypot(px, py) > 1.05) return;
      e.vp += 0.9; e.empuje = 2.2; e.eco = 0;
    }, { passive: true });
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; despierta(); }).observe(lienzo);
    document.addEventListener('visibilitychange', despierta);
    despierta();
    return true;
  }
  const lienzo = document.querySelector('.heroe__orbe');
  if (lienzo) {
    let ok = false;
    try { ok = orbe(lienzo); } catch { ok = false; }
    lienzo.classList.add(ok ? 'is-ready' : 'sin-webgl');
  }

  // ─────────────────── SplitText / BlurText: titulares palabra a palabra
  function dividir(el) {
    let n = 0;
    const envolver = (nodo) => {
      [...nodo.childNodes].forEach((h) => {
        if (h.nodeType === 3) {
          const trozos = h.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          trozos.forEach((t) => {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.append(' '); return; }
            const s = document.createElement('span');
            s.className = 'pb'; s.style.setProperty('--n', n++); s.textContent = t;
            frag.append(s);
          });
          h.replaceWith(frag);
        } else if (h.nodeType === 1 && h.tagName !== 'BR') {
          if (h.tagName === 'EM') { h.classList.add('pb'); h.style.setProperty('--n', n++); } else envolver(h);
        }
      });
    };
    envolver(el);
    el.classList.add('dividido');
  }
  if (!quieto) document.querySelectorAll('[data-dividir], .cabecera h2, .final h2').forEach(dividir);

  // ───────────────────────── DecryptedText: los rótulos se descifran
  const SIGNOS = 'ABCDEFGHIKLMNOPRSTUVXZ0123456789/#<>*+';
  function descifrar(el) {
    const real = el.textContent;
    const inicio = performance.now();
    const tic = () => {
      const fijas = Math.floor((performance.now() - inicio) / 26);
      if (fijas >= real.length) { el.textContent = real; return; }
      el.textContent = real.slice(0, fijas) + [...real.slice(fijas)].map((c) => (c === ' ' || c === '/' ? c : SIGNOS[(Math.random() * SIGNOS.length) | 0])).join('');
      setTimeout(tic, 38);
    };
    tic();
  }
  if (!quieto) alVer([...document.querySelectorAll('.rotulo, .tarjeta__num, .plan__eti')], (el) => {
    const hoja = [...el.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
    if (!hoja) return;
    const s = document.createElement('bdi');
    s.textContent = hoja.textContent;
    hoja.replaceWith(s);
    descifrar(s);
  }, { threshold: 0.6 });

  // ───────────────────────────────────── CountUp: cifras que suben
  function contar(el, hasta, ms = 1400, desde = 0) {
    const fmt = (v) => Math.round(v).toLocaleString('es-ES');
    if (quieto) { el.textContent = fmt(hasta); return; }
    const t0 = performance.now();
    const paso = (t) => {
      const p = lim((t - t0) / ms, 0, 1);
      el.textContent = fmt(desde + (hasta - desde) * (1 - Math.pow(1 - p, 4)));
      if (p < 1) requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  }
  if (!quieto) {
    const cifras = [...document.querySelectorAll('[data-contar]')];
    cifras.forEach((el) => { el.textContent = '0'; });
    alVer(cifras, (el) => setTimeout(() => contar(el, +el.dataset.contar, 1600), 900), { threshold: 0.2 });
  }

  // ───────────── SpotlightCard: un foco que sigue al puntero en las tarjetas
  // ───────────── TiltedCard: las maquetas se inclinan hacia el puntero
  if (fino && !quieto) {
    const FOCO = '.tarjeta, .plan, .pasos li, .sectores__lista li, .acordeon details';
    let ultima = null;
    document.addEventListener('pointermove', (ev) => {
      const c = ev.target.closest?.(FOCO);
      if (c) {
        const r = c.getBoundingClientRect();
        c.style.setProperty('--mx', `${ev.clientX - r.left}px`);
        c.style.setProperty('--my', `${ev.clientY - r.top}px`);
      }
      const m = ev.target.closest?.('.maqueta');
      if (ultima && ultima !== m) { ultima.style.setProperty('--rx', '0deg'); ultima.style.setProperty('--ry', '0deg'); }
      if (m) {
        const r = m.getBoundingClientRect();
        const x = (ev.clientX - r.left) / r.width - 0.5, y = (ev.clientY - r.top) / r.height - 0.5;
        m.style.setProperty('--ry', `${(x * 7).toFixed(2)}deg`);
        m.style.setProperty('--rx', `${(-y * 6).toFixed(2)}deg`);
        m.style.setProperty('--bx', `${((x + 0.5) * 100).toFixed(1)}%`);
        m.style.setProperty('--by', `${((y + 0.5) * 100).toFixed(1)}%`);
      }
      ultima = m;
    }, { passive: true });

    // ───────────────────── Magnet: los botones principales tiran del puntero
    document.querySelectorAll('[data-iman]').forEach((b) => {
      const mover = (ev) => {
        const r = b.getBoundingClientRect();
        const x = ev.clientX - (r.left + r.width / 2), y = ev.clientY - (r.top + r.height / 2);
        const cerca = Math.abs(x) < r.width / 2 + 60 && Math.abs(y) < r.height / 2 + 60;
        b.style.translate = cerca ? `${(x * 0.22).toFixed(1)}px ${(y * 0.3).toFixed(1)}px` : '';
      };
      addEventListener('pointermove', mover, { passive: true });
    });
  }

  // ─────────────────────────────── ClickSpark: chispas en cada clic
  if (!quieto) {
    const cv = document.createElement('canvas');
    cv.className = 'chispas'; cv.setAttribute('aria-hidden', 'true');
    document.body.append(cv);
    const ctx = cv.getContext('2d');
    let chispas = [], raf = 0;
    const medir = () => { const d = Math.min(devicePixelRatio || 1, 2); cv.width = innerWidth * d; cv.height = innerHeight * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    medir(); addEventListener('resize', medir);
    const pinta = (t) => {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      chispas = chispas.filter((c) => t - c.t0 < 460);
      for (const c of chispas) {
        const p = (t - c.t0) / 460, f = 1 - Math.pow(1 - p, 3);
        const d = 10 + f * 26, l = 9 * (1 - f);
        ctx.strokeStyle = `rgba(${c.cian ? '95,208,255' : '170,160,255'},${1 - p})`;
        ctx.lineWidth = 2; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(c.x + Math.cos(c.a) * d, c.y + Math.sin(c.a) * d);
        ctx.lineTo(c.x + Math.cos(c.a) * (d + l), c.y + Math.sin(c.a) * (d + l));
        ctx.stroke();
      }
      raf = chispas.length ? requestAnimationFrame(pinta) : 0;
    };
    addEventListener('pointerdown', (ev) => {
      if (!ev.target.closest?.('button, a, summary')) return;
      const t0 = performance.now();
      for (let i = 0; i < 8; i++) chispas.push({ x: ev.clientX, y: ev.clientY, a: (i / 8) * Math.PI * 2, t0, cian: i % 2 });
      if (!raf) raf = requestAnimationFrame(pinta);
    }, { passive: true });
  }

  // ───────────── ScrollVelocity: la cinta corre más cuanto más rápido bajas
  const pista = document.querySelector('.cinta__pista');
  if (pista && !quieto) {
    pista.style.animation = 'none';
    let x = 0, v = 0, yAntes = scrollY, antes = 0, visible = true, sentido = 1;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(pista.parentElement);
    const paso = (t) => {
      const dt = antes ? Math.min(0.05, (t - antes) / 1000) : 0; antes = t;
      const dy = scrollY - yAntes; yAntes = scrollY;
      if (visible && dt) {
        if (Math.abs(dy) > 1) sentido = dy > 0 ? 1 : -1;
        v += ((dy / dt) * 0.45 - v) * Math.min(1, dt * 8);
        const mitad = pista.scrollWidth / 2;
        x = (((x - (46 * sentido + v) * dt) % mitad) - mitad) % mitad;
        pista.style.transform = `translate3d(${x.toFixed(1)}px,0,0) skewX(${lim(-v / 90, -9, 9).toFixed(2)}deg)`;
      }
      requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  }

  window.Efectos = { contar, alVer, quieto };
})();
