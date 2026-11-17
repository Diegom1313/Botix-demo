// Los importes y la disponibilidad los decide el servidor; Stripe recibe
// la sesión de pago creada allí, nunca precios elegidos por el navegador.
(() => {
  const alta = 'https://app.botix.software/crear.html';
  const botones = [...document.querySelectorAll('[data-contratar]')];
  const estado = document.getElementById('compra-estado');
  if (!estado) return;
  const texto = (selector, valor) => { const el = document.querySelector(selector); if (el) el.textContent = valor; };
  const desactivar = (mensaje) => {
    botones.forEach((b) => { b.removeAttribute('href'); b.setAttribute('aria-disabled', 'true'); b.textContent = 'Compra no disponible'; });
    estado.textContent = mensaje;
  };
  fetch('https://app.botix.software/api/alta/config', { credentials: 'omit', signal: AbortSignal.timeout(8000) })
    .then(async (res) => {
      if (!res.ok) throw new Error('configuración no disponible');
      const cfg = await res.json();
      const p = cfg.precio;
      if (!p || !Number.isFinite(p.alta) || p.alta < 0 || !Number.isFinite(p.cuota) || p.cuota < 0 || !/^[a-z]{3}$/i.test(p.moneda || '')) throw new Error('precio no válido');
      const moneda = (valor) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: p.moneda, maximumFractionDigits: 2 }).format(valor);
      const cuota = p.recurrente ? p.cuota : 0;
      texto('[data-plan-cuota]', moneda(p.recurrente ? p.cuota : p.alta));
      texto('[data-plan-periodo]', p.recurrente ? '/mes' : 'pago único');
      texto('[data-plan-alta]', p.recurrente ? `+ ${moneda(p.alta)} de alta, una sola vez` : 'Sin cuota mensual');
      texto('[data-compra-total]', moneda(p.alta + cuota));
      texto('[data-compra-desglose]', cuota ? `${moneda(p.alta)} de alta + ${moneda(cuota)} del primer mes` : `${moneda(p.alta)} de alta, en un único pago`);
      texto('[data-compra-cuota]', cuota ? `Después, ${moneda(cuota)}/mes. Sin permanencia.` : 'Sin cuota mensual.');
      if (!cfg.cobroListo || !cfg.correoListo) {
        desactivar('La contratación online no está disponible ahora mismo. Vuelve a intentarlo más tarde.');
        return;
      }
      if (cfg.pruebas) {
        desactivar('La contratación está en pruebas. Todavía no se aceptan compras reales.');
        return;
      }
      botones.forEach((b) => { b.href = alta; b.removeAttribute('aria-disabled'); b.textContent = 'Contratar con Stripe'; });
      estado.textContent = 'Revisarás el importe y las condiciones antes de acceder al pago seguro de Stripe.';
    })
    .catch(() => { estado.textContent = 'No hemos podido comprobar el precio actualizado. Podrás revisarlo en el formulario antes de pagar.'; });
})();
