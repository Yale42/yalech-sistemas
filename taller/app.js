// Taller Hermanos Ruiz · órdenes de servicio (ejemplo funcional). Herramientas comunes en ../comun.js.
const CLAVE = 'demo-taller-v1';
const NEGOCIO = 'Taller Hermanos Ruiz';
const IVA = 0.16;
const ESTADOS = {
  recibido: { nombre: 'Recibido', badge: '', icono: 'fa-key' },
  diagnostico: { nombre: 'Diagnóstico', badge: 'badge--brand', icono: 'fa-magnifying-glass' },
  autorizar: { nombre: 'Espera autorización', badge: 'badge--warn', icono: 'fa-hourglass-half' },
  reparando: { nombre: 'Reparando', badge: 'badge--brand', icono: 'fa-screwdriver-wrench' },
  listo: { nombre: 'Listo', badge: 'badge--ok', icono: 'fa-circle-check' },
  entregado: { nombre: 'Entregado', badge: '', icono: 'fa-flag-checkered' },
};
const ORDEN = Object.keys(ESTADOS);

// ---------- Datos de ejemplo (fechas relativas a hoy) ----------
const semilla = () => {
  const c = (tipo, desc, cant, precio) => ({ tipo, desc, cant, precio });
  const o = (folio, cliente, tel, auto, placas, km, falla, dias, entrega, estado, conceptos, iva = false, pagado = 0) => ({
    id: 'o' + folio, folio, cliente, tel, auto, placas, km, falla, recibido: sumarDias(dias), entrega: sumarDias(entrega), estado, conceptos, iva,
    pagos: pagado ? [{ monto: pagado, t: Date.now() }] : [],
  });
  return {
    siguiente: 2309,
    ordenes: [
      o(2301, 'Laura Méndez', '5500000201', 'Nissan Versa 2018', 'NLM-482-A', 98000, 'Rechina al frenar y jala a la derecha', -1, 0, 'listo',
        [c('ref', 'Balatas delanteras', 1, 780), c('ref', 'Rectificado de discos', 2, 250), c('mo', 'Cambio de balatas', 1, 450)]),
      o(2302, 'Jorge Castillo', '5500000202', 'Chevrolet Aveo 2016', 'PRK-119-C', 142000, 'Servicio mayor', 0, 1, 'reparando',
        [c('ref', 'Aceite sintético 5W-30', 4, 210), c('ref', 'Filtro de aceite', 1, 160), c('ref', 'Bujías', 4, 120), c('mo', 'Servicio mayor', 1, 900)], true),
      o(2303, 'Patricia Luna', '5500000203', 'Honda CR-V 2015', 'TXA-905-B', 165000, 'Se calienta en el tráfico', 0, 2, 'autorizar',
        [c('ref', 'Termostato', 1, 650), c('ref', 'Anticongelante', 2, 220), c('mo', 'Cambio de termostato y purga', 1, 700)]),
      o(2304, 'Miguel Ángel Soto', '5500000204', 'VW Jetta 2014', 'GHT-332-E', 187000, 'Ruido en la suspensión delantera', 0, 3, 'diagnostico', []),
      o(2305, 'Rosa Elena Díaz', '5500000205', 'Toyota Yaris 2020', 'MZD-771-F', 45000, 'Revisión antes de carretera', 0, 1, 'recibido', []),
      o(2306, 'Fernando Ortiz', '5500000206', 'Ford Ranger 2017', 'URB-640-K', 210000, 'No arranca en frío', -2, -1, 'reparando',
        [c('ref', 'Marcha reconstruida', 1, 1900), c('mo', 'Cambio de marcha', 1, 600)]),
      o(2307, 'Laura Méndez', '5500000201', 'Nissan Versa 2018', 'NLM-482-A', 91000, 'Afinación', -60, -59, 'entregado',
        [c('ref', 'Bujías', 4, 110), c('ref', 'Filtro de aire', 1, 180), c('mo', 'Afinación', 1, 650)], false, 1270),
      o(2308, 'Jorge Castillo', '5500000202', 'Chevrolet Aveo 2016', 'PRK-119-C', 131000, 'Cambio de clutch', -120, -118, 'entregado',
        [c('ref', 'Kit de clutch', 1, 2800), c('mo', 'Cambio de clutch', 1, 1500)], false, 4300),
    ],
  };
};
const limpiar = d => {
  if (!d || !Array.isArray(d.ordenes)) return null;
  const ordenes = d.ordenes.filter(o => o && typeof o.id === 'string').slice(0, 2000).map(o => ({
    id: texto(o.id, 30), folio: Math.floor(num(o.folio, 1, 1e7)), cliente: texto(o.cliente, 50) || 'Cliente', tel: tel10(o.tel),
    auto: texto(o.auto, 40) || 'Auto', placas: texto(o.placas, 10).toUpperCase(), km: Math.floor(num(o.km, 0, 2e6)), falla: texto(o.falla, 200),
    recibido: esFecha(o.recibido) ? o.recibido : isoDia(), entrega: esFecha(o.entrega) ? o.entrega : isoDia(),
    estado: ESTADOS[o.estado] ? o.estado : 'recibido', iva: !!o.iva,
    conceptos: Array.isArray(o.conceptos) ? o.conceptos.slice(0, 60).map(c => ({ tipo: c?.tipo === 'mo' ? 'mo' : 'ref', desc: texto(c?.desc, 60) || 'Concepto', cant: Math.floor(num(c?.cant, 1, 99)), precio: num(c?.precio, 0, 1e6) })) : [],
    pagos: Array.isArray(o.pagos) ? o.pagos.slice(0, 50).map(x => ({ monto: num(x?.monto, 0, 1e7), t: num(x?.t, 0, 9e15) })) : [],
  }));
  return { siguiente: Math.floor(num(d.siguiente, 1, 1e7)), ordenes };
};

let db = cargar(CLAVE, semilla, limpiar);
const guardar = () => guardarEn(CLAVE, db);
const porId = id => db.ordenes.find(o => o.id === id);

// ---------- Cuentas ----------
const suma = (o, tipo) => o.conceptos.filter(c => !tipo || c.tipo === tipo).reduce((s, c) => s + c.cant * c.precio, 0);
const total = o => Math.round(suma(o) * (o.iva ? 1 + IVA : 1) * 100) / 100;
const pagado = o => o.pagos.reduce((s, x) => s + x.monto, 0);
const saldo = o => Math.max(total(o) - pagado(o), 0);
const diasEnTaller = o => Math.max(Math.round((new Date(isoDia() + 'T12:00') - new Date(o.recibido + 'T12:00')) / 864e5), 0);
const tarde = o => !['listo', 'entregado'].includes(o.estado) && o.entrega < isoDia();
const nombre1 = o => o.cliente.split(' ')[0];

// ---------- Mensajes al cliente ----------
const msgCotizacion = o => [
  `Hola ${nombre1(o)} 👋 Le escribimos de ${NEGOCIO} sobre su ${o.auto} (${o.placas}).`,
  `Revisamos: ${o.falla || 'el auto'}. Esto es lo que necesita:`,
  ...o.conceptos.map(c => `• ${c.cant > 1 ? c.cant + ' × ' : ''}${c.desc} — ${pesos(c.cant * c.precio)}`),
  o.iva ? `IVA: ${pesos(total(o) - suma(o))}` : '',
  `Total: ${pesos(total(o))}`,
  `¿Nos autoriza la reparación? Respóndanos «Sí» y empezamos. Orden #${o.folio}.`,
].filter(Boolean).join('\n');
const msgListo = o => `Hola ${nombre1(o)} 👋 Su ${o.auto} (${o.placas}) ya está listo en ${NEGOCIO} 🔧. Total: ${pesos(total(o))}${pagado(o) ? `, pagado ${pesos(pagado(o))}, resta ${pesos(saldo(o))}` : ''}. Lo esperamos de 9 a 7. Orden #${o.folio}.`;
const abrirWA = (o, msg) => window.open(wa(o.tel, msg), '_blank', 'noopener');

// ---------- Tablero ----------
const COLUMNAS = ['recibido', 'diagnostico', 'autorizar', 'reparando', 'listo'];
const tarjetaAuto = o => `
  <li><button type="button" class="car${tarde(o) ? ' is-late' : ''}" data-abrir="${esc(o.id)}">
    <span class="car-top"><span class="plate">${esc(o.placas || 'SIN PLACAS')}</span><span class="muted small num">#${o.folio}</span></span>
    <strong>${esc(o.auto)}</strong>
    <span class="small muted">${esc(o.cliente)}</span>
    <span class="car-foot">
      <span class="small ${tarde(o) ? 'late' : 'muted'}"><i class="fa-regular fa-clock"></i> ${tarde(o) ? 'Atrasado · ' : ''}${diasEnTaller(o) ? diasEnTaller(o) + (diasEnTaller(o) === 1 ? ' día' : ' días') : 'Hoy'}</span>
      ${o.conceptos.length ? `<b class="num">${pesos(total(o))}</b>` : '<span class="small muted">Sin cotizar</span>'}
    </span>
  </button></li>`;
const pintarTablero = () => {
  const activas = db.ordenes.filter(o => o.estado !== 'entregado');
  $('[data-st="taller"]').textContent = activas.length;
  $('[data-st="autorizar"]').textContent = activas.filter(o => o.estado === 'autorizar').length;
  $('[data-st="listos"]').textContent = activas.filter(o => o.estado === 'listo').length;
  $('[data-st="cobrar"]').textContent = pesos(activas.filter(o => o.estado === 'listo').reduce((s, o) => s + saldo(o), 0));
  $('[data-tablero]').innerHTML = COLUMNAS.map(e => {
    const lista = activas.filter(o => o.estado === e).sort((a, b) => a.entrega.localeCompare(b.entrega));
    return `<section class="col col--${e}"><header><i class="fa-solid ${ESTADOS[e].icono}"></i> ${ESTADOS[e].nombre}<span class="count">${lista.length}</span></header>
      <ul>${lista.length ? lista.map(tarjetaAuto).join('') : '<li class="col-empty">Nada aquí</li>'}</ul></section>`;
  }).join('');
};
document.addEventListener('click', e => {
  const b = e.target.closest('[data-abrir]');
  if (b) abrirOrden(porId(b.dataset.abrir));
});

// ---------- Historial ----------
$('[data-buscar]').addEventListener('input', () => pintarHistorial());
const pintarHistorial = () => {
  const q = $('[data-buscar]').value.trim().toLowerCase().replace(/[\s-]/g, '');
  const lista = db.ordenes
    .filter(o => !q || `${o.placas}${o.cliente}${o.auto}${o.folio}`.toLowerCase().replace(/[\s-]/g, '').includes(q))
    .sort((a, b) => b.recibido.localeCompare(a.recibido));
  $('[data-historial]').innerHTML = lista.length ? lista.map(o => `
    <li class="card hist"><button type="button" data-abrir="${esc(o.id)}">
      <span class="plate">${esc(o.placas || 'SIN PLACAS')}</span>
      <span class="hist-main"><strong>${esc(o.falla || 'Servicio')}</strong><small>${esc(o.auto)} · ${esc(o.cliente)} · ${o.km ? o.km.toLocaleString('es-MX') + ' km' : 'sin km'}</small></span>
      <span class="hist-side"><span class="badge ${ESTADOS[o.estado].badge}">${ESTADOS[o.estado].nombre}</span><small class="muted">${fechaBonita(o.recibido)} · <b class="num">${pesos(total(o))}</b></small></span>
    </button></li>`).join('') : '<li class="empty"><i class="fa-solid fa-car-side"></i>No hay órdenes con esa búsqueda.</li>';
};

// ---------- Detalle de una orden ----------
const dlg = $('#orden');
let abierta = null;
const abrirOrden = o => { abierta = o; $('[data-concepto-error]').hidden = true; pintarOrden(); if (!dlg.open) abrir('orden'); };
const editable = o => ['recibido', 'diagnostico', 'autorizar'].includes(o.estado);
const pintarOrden = () => {
  const o = abierta;
  $('[data-o-folio]').textContent = `Orden #${o.folio} · recibido ${fechaBonita(o.recibido).toLowerCase()} · entrega ${fechaBonita(o.entrega).toLowerCase()}`;
  $('[data-o-auto]').textContent = `${o.auto} · ${o.placas || 'sin placas'}`;
  $('[data-o-cliente]').textContent = `${o.cliente}${o.km ? ' · ' + o.km.toLocaleString('es-MX') + ' km' : ''}`;
  $('[data-o-falla]').textContent = o.falla || 'Sin descripción de la falla.';
  const i = ORDEN.indexOf(o.estado);
  $('[data-o-pasos]').innerHTML = ORDEN.map((e, n) => `<li class="${n < i ? 'is-done' : n === i ? 'is-now' : ''}" title="${ESTADOS[e].nombre}"><i class="fa-solid ${ESTADOS[e].icono}"></i><span>${ESTADOS[e].nombre}</span></li>`).join('');
  $('[data-o-conceptos]').innerHTML = o.conceptos.length ? o.conceptos.map((c, n) => `
    <li><span class="tag tag--${c.tipo}">${c.tipo === 'mo' ? 'Mano de obra' : 'Refacción'}</span><span class="c-desc">${c.cant > 1 ? `<b>${c.cant} ×</b> ` : ''}${esc(c.desc)}</span><b class="num">${pesos(c.cant * c.precio)}</b>
    ${editable(o) ? `<button type="button" class="icon-btn" data-quitar="${n}" aria-label="Quitar ${esc(c.desc)}"><i class="fa-solid fa-trash-can"></i></button>` : ''}</li>`).join('')
    : '<li class="empty small">Agrega refacciones y mano de obra para mandar la cotización.</li>';
  $('[data-form-concepto]').hidden = !editable(o);
  $('[data-o-iva]').checked = o.iva;
  $('[data-o-iva]').disabled = !editable(o);
  $('[data-o-suma]').innerHTML = `
    <div><dt>Refacciones</dt><dd class="num">${pesos(suma(o, 'ref'))}</dd></div>
    <div><dt>Mano de obra</dt><dd class="num">${pesos(suma(o, 'mo'))}</dd></div>
    ${o.iva ? `<div><dt>IVA 16%</dt><dd class="num">${pesos(total(o) - suma(o))}</dd></div>` : ''}
    <div class="sum-total"><dt>Total</dt><dd class="num" data-o-total>${pesos(total(o))}</dd></div>
    ${pagado(o) ? `<div><dt>Pagado</dt><dd class="num">${pesos(pagado(o))}</dd></div>` : ''}`;
  const A = {
    recibido: `<button type="button" class="btn btn--brand" data-paso="diagnostico"><i class="fa-solid fa-magnifying-glass"></i> Empezar diagnóstico</button>`,
    diagnostico: `<button type="button" class="btn btn--wa" data-cotizar><i class="fa-brands fa-whatsapp"></i> Mandar cotización</button>`,
    autorizar: `<button type="button" class="btn btn--brand" data-paso="reparando"><i class="fa-solid fa-thumbs-up"></i> El cliente autorizó</button>
                <button type="button" class="btn" data-cotizar><i class="fa-brands fa-whatsapp"></i> Reenviar cotización</button>`,
    reparando: `<button type="button" class="btn btn--brand" data-paso="listo"><i class="fa-solid fa-circle-check"></i> Marcar listo</button>`,
    listo: `<button type="button" class="btn btn--wa" data-avisar><i class="fa-brands fa-whatsapp"></i> Avisar que está listo</button>
            <button type="button" class="btn btn--brand" data-entregar><i class="fa-solid fa-cash-register"></i> Cobrar ${pesos(saldo(o))} y entregar</button>`,
    entregado: `<p class="muted small"><i class="fa-solid fa-flag-checkered"></i> Entregado y pagado: ${pesos(pagado(o))}.</p>`,
  };
  $('[data-o-acciones]').innerHTML = A[o.estado];
};
const cambio = (msg) => { guardar(); pintarOrden(); todo(); if (msg) toast(msg); };

$('[data-form-concepto]').addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target, err = $('[data-concepto-error]');
  const desc = texto(f.desc.value, 60), precio = Number(f.precio.value), cant = Number(f.cant.value || 1);
  const problema = !desc ? 'Escribe el concepto.' : !(precio >= 0) || f.precio.value === '' ? 'Escribe el precio.' : !(cant >= 1 && cant <= 99) ? 'La cantidad va de 1 a 99.' : '';
  err.textContent = problema;
  err.hidden = !problema;
  if (problema) return f.querySelector(`[name="${problema.includes('concepto') ? 'desc' : problema.includes('precio') ? 'precio' : 'cant'}"]`)?.focus();
  abierta.conceptos.push({ tipo: f.tipo.value === 'mo' ? 'mo' : 'ref', desc, cant: Math.floor(cant), precio: num(precio, 0, 1e6) });
  f.desc.value = ''; f.precio.value = ''; f.cant.value = 1;
  cambio();
  f.desc.focus();
});
$('[data-o-iva]').addEventListener('change', e => { abierta.iva = e.target.checked; cambio(); });
dlg.addEventListener('click', e => {
  const o = abierta;
  const q = e.target.closest('[data-quitar]');
  if (q) { o.conceptos.splice(+q.dataset.quitar, 1); cambio(); return; }
  const p = e.target.closest('[data-paso]');
  if (p) {
    o.estado = p.dataset.paso;
    cambio(`#${o.folio} · ${ESTADOS[o.estado].nombre}${o.estado === 'listo' ? ' · avísale al cliente' : ''}`);
    return;
  }
  if (e.target.closest('[data-cotizar]')) {
    const err = $('[data-concepto-error]');
    if (!o.conceptos.length) { err.textContent = 'Agrega al menos un concepto antes de mandar la cotización.'; err.hidden = false; return; }
    if (!o.tel) { err.textContent = 'Esta orden no tiene WhatsApp del cliente.'; err.hidden = false; return; }
    abrirWA(o, msgCotizacion(o));
    if (o.estado === 'diagnostico') { o.estado = 'autorizar'; cambio(`Cotización enviada · #${o.folio} espera autorización`); }
    return;
  }
  if (e.target.closest('[data-avisar]')) { if (o.tel) abrirWA(o, msgListo(o)); return; }
  if (e.target.closest('[data-entregar]')) {
    const s = saldo(o);
    if (s > 0) o.pagos.push({ monto: s, t: Date.now() });
    o.estado = 'entregado';
    cambio(`#${o.folio} entregado · cobrado ${pesos(s)}`);
  }
});

// ---------- Recibir auto ----------
const fn = $('[data-form-nueva]');
$$('[data-nueva]').forEach(b => b.addEventListener('click', () => {
  fn.reset();
  fn.entrega.value = sumarDias(1);
  fn.entrega.min = isoDia();
  $('[data-placas-previo]').hidden = true;
  $('.form-error', fn).hidden = true;
  abrir('nueva');
}));
// Si las placas ya vinieron antes, se llenan los datos del cliente
fn.placas.addEventListener('input', () => {
  const p = texto(fn.placas.value, 10).toUpperCase().replace(/[\s-]/g, '');
  const previo = p.length >= 5 && [...db.ordenes].sort((a, b) => b.recibido.localeCompare(a.recibido)).find(o => o.placas.replace(/[\s-]/g, '') === p);
  const aviso = $('[data-placas-previo]');
  aviso.hidden = !previo;
  if (!previo) return;
  aviso.textContent = `Ya vino ${db.ordenes.filter(o => o.placas === previo.placas).length} ${db.ordenes.filter(o => o.placas === previo.placas).length === 1 ? 'vez' : 'veces'}: llené sus datos. Último: ${previo.falla || 'servicio'} (${fechaBonita(previo.recibido).toLowerCase()}).`;
  if (!fn.cliente.value) fn.cliente.value = previo.cliente;
  if (!fn.tel.value) fn.tel.value = previo.tel;
  if (!fn.auto.value) fn.auto.value = previo.auto;
});
fn.addEventListener('submit', e => {
  e.preventDefault();
  const err = $('.form-error', fn);
  const cliente = texto(fn.cliente.value, 50), auto = texto(fn.auto.value, 40), tel = tel10(fn.tel.value);
  const problema = !cliente ? 'Escribe el nombre del cliente.'
    : fn.tel.value.trim() && tel.length !== 10 ? 'El WhatsApp debe tener 10 dígitos.'
    : !auto ? 'Escribe qué auto es.'
    : !esFecha(fn.entrega.value) ? 'Elige el día de entrega.' : '';
  if (problema) { err.textContent = problema; err.hidden = false; return fn.querySelector(`[name="${([['nombre', 'cliente'], ['WhatsApp', 'tel'], ['auto', 'auto']].find(([t]) => problema.includes(t)) || [, 'entrega'])[1]}"]`)?.focus(); }
  const o = {
    id: uid(), folio: db.siguiente++, cliente, tel, auto, placas: texto(fn.placas.value, 10).toUpperCase(), km: Math.floor(num(fn.km.value, 0, 2e6)),
    falla: texto(fn.falla.value, 200), recibido: isoDia(), entrega: fn.entrega.value, estado: 'recibido', iva: false, conceptos: [], pagos: [],
  };
  db.ordenes.push(o);
  guardar();
  $('#nueva').close();
  todo();
  toast(`Orden #${o.folio} abierta`);
});

// ---------- Todo junto ----------
function todo() { pintarTablero(); pintarHistorial(); }
$('[data-hoy]').textContent = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
iniciarReinicio(CLAVE);
iniciarVistas();
todo();
