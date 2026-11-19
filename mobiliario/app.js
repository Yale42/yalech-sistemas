// Fiestas Lupita · renta de mobiliario (ejemplo funcional). Herramientas comunes en ../comun.js.
// Cada reserva ocupa sus artículos el día del evento; lo libre de un día = lo que tienes − lo reservado ese día.
const CLAVE = 'demo-mobiliario-v1';
const NEGOCIO = 'Fiestas Lupita';
const ARTICULOS = [
  { id: 'tiffany', nombre: 'Silla Tiffany', icono: 'fa-chair', total: 200, precio: 25 },
  { id: 'plegable', nombre: 'Silla plegable', icono: 'fa-chair', total: 300, precio: 12 },
  { id: 'redonda', nombre: 'Mesa redonda (10 pers.)', icono: 'fa-circle', total: 30, precio: 90 },
  { id: 'tablon', nombre: 'Mesa tablón', icono: 'fa-grip-lines', total: 25, precio: 70 },
  { id: 'mantel', nombre: 'Mantel', icono: 'fa-table-cells', total: 60, precio: 35 },
  { id: 'carpa', nombre: 'Carpa 6 × 12 m', icono: 'fa-tent', total: 2, precio: 1800 },
  { id: 'brinco', nombre: 'Brincolín', icono: 'fa-children', total: 3, precio: 650 },
];
const ESTADOS = {
  apartado: { nombre: 'Apartado', badge: 'badge--brand' },
  entregado: { nombre: 'En el evento', badge: 'badge--warn' },
  recogido: { nombre: 'Recogido', badge: 'badge--ok' },
};

// ---------- Datos de ejemplo (fechas relativas a hoy) ----------
const semilla = () => {
  const r = (folio, cliente, tel, dias, colonia, direccion, items, flete, anticipo, estado) => ({
    id: 'r' + folio, folio, cliente, tel, fecha: sumarDias(dias), colonia, direccion, items, flete,
    pagos: anticipo ? [{ monto: anticipo, t: Date.now() - 864e5 * 3 }] : [], estado,
  });
  return {
    siguiente: 512,
    reservas: [
      r(501, 'Gabriela Soto', '5500000401', 0, 'Las Águilas', 'Av. Central 120, casa con portón negro', { tiffany: 120, redonda: 12, mantel: 12, carpa: 1 }, 300, 2000, 'entregado'),
      r(502, 'Familia Ortega', '5500000402', 0, 'Jardines del Sur', 'Calle Rosal 45', { plegable: 80, tablon: 8, brinco: 1 }, 250, 800, 'apartado'),
      r(503, 'Iglesia San Judas', '5500000403', 1, 'Centro', 'Salón parroquial, entrada por Hidalgo', { plegable: 150, tablon: 10, mantel: 10 }, 250, 1000, 'apartado'),
      r(504, 'Carmen Ruiz', '5500000404', 3, 'Lomas Verdes', 'Privada Encino 8', { tiffany: 60, redonda: 6, mantel: 6, brinco: 2 }, 300, 1500, 'apartado'),
      r(505, 'Boda Medina–Luna', '5500000405', 3, 'Rancho El Roble', 'Km 4 carretera a San Pedro', { tiffany: 140, redonda: 14, mantel: 14, carpa: 2 }, 600, 5000, 'apartado'),
      r(506, 'Javier Torres', '5500000406', 5, 'Del Valle', 'Calle Nogal 210', { plegable: 40, tablon: 4 }, 200, 0, 'apartado'),
      r(507, 'Escuela Benito Juárez', '5500000407', -1, 'Centro', 'Patio principal', { plegable: 200, tablon: 12 }, 250, 3290, 'entregado'),
      r(508, 'Sandra Leal', '5500000408', -3, 'Las Águilas', 'Av. Central 88', { tiffany: 50, redonda: 5, mantel: 5 }, 250, 2275, 'recogido'),
    ],
  };
};
const limpiar = d => {
  if (!d || !Array.isArray(d.reservas)) return null;
  const ids = ARTICULOS.map(a => a.id);
  const reservas = d.reservas.filter(r => r && typeof r.id === 'string').slice(0, 3000).map(r => ({
    id: texto(r.id, 30), folio: Math.floor(num(r.folio, 1, 1e7)), cliente: texto(r.cliente, 50) || 'Cliente', tel: tel10(r.tel),
    fecha: esFecha(r.fecha) ? r.fecha : isoDia(), colonia: texto(r.colonia, 40), direccion: texto(r.direccion, 100),
    items: Object.fromEntries(ids.map(k => [k, Math.floor(num(r.items?.[k], 0, 10000))]).filter(([, v]) => v > 0)),
    flete: num(r.flete, 0, 1e5), estado: ESTADOS[r.estado] ? r.estado : 'apartado',
    pagos: Array.isArray(r.pagos) ? r.pagos.slice(0, 50).map(x => ({ monto: num(x?.monto, 0, 1e7), t: num(x?.t, 0, 9e15) })) : [],
  }));
  return { siguiente: Math.floor(num(d.siguiente, 1, 1e7)), reservas };
};

let db = cargar(CLAVE, semilla, limpiar);
const guardar = () => guardarEn(CLAVE, db);
const porId = id => db.reservas.find(r => r.id === id);
const art = id => ARTICULOS.find(a => a.id === id);

// ---------- Cuentas ----------
const subtotal = items => Object.entries(items).reduce((s, [k, n]) => s + (art(k)?.precio || 0) * n, 0);
const total = r => subtotal(r.items) + r.flete;
const pagado = r => r.pagos.reduce((s, x) => s + x.monto, 0);
const saldo = r => Math.max(total(r) - pagado(r), 0);
const reservado = (fecha, id, sinReserva) => db.reservas.filter(r => r.fecha === fecha && r.id !== sinReserva).reduce((s, r) => s + (r.items[id] || 0), 0);
const libre = (fecha, id, sinReserva) => Math.max(art(id).total - reservado(fecha, id, sinReserva), 0);
const listaItems = items => Object.entries(items).map(([k, n]) => `${n} ${art(k).nombre.toLowerCase()}`).join(', ');
const nombre1 = r => r.cliente.split(' ')[0];

// ---------- Disponible: tira de días + tabla ----------
let dia = isoDia();
const pintarDias = () => {
  $('[data-dias]').innerHTML = Array.from({ length: 14 }, (_, i) => {
    const f = sumarDias(i);
    const d = new Date(f + 'T12:00');
    const n = db.reservas.filter(r => r.fecha === f).length;
    return `<button type="button" class="day-btn${f === dia ? ' is-on' : ''}" data-dia="${f}">
      <small>${i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : d.toLocaleDateString('es-MX', { weekday: 'short' }).replace('.', '')}</small><b>${d.getDate()}</b>
      <span class="dots">${'<i></i>'.repeat(Math.min(n, 3))}</span></button>`;
  }).join('');
};
$('[data-dias]').addEventListener('click', e => { const b = e.target.closest('[data-dia]'); if (b) { dia = b.dataset.dia; pintarDisponible(); } });
const pintarDisponible = () => {
  pintarDias();
  const eventos = db.reservas.filter(r => r.fecha === dia);
  $('[data-disponible]').innerHTML = `
    <header class="avail-head"><h2>${fechaBonita(dia)}${dia === isoDia() ? '' : ''}</h2><span class="muted small">${eventos.length ? `${eventos.length} ${eventos.length === 1 ? 'evento' : 'eventos'}: ${eventos.map(r => esc(nombre1(r))).join(', ')}` : 'Sin eventos: todo libre'}</span></header>
    <ul class="bars">${ARTICULOS.map(a => {
      const usado = reservado(dia, a.id), queda = Math.max(a.total - usado, 0), pct = Math.min(usado / a.total, 1) * 100;
      const nivel = queda === 0 ? 'is-out' : queda / a.total < 0.2 ? 'is-low' : '';
      return `<li class="${nivel}" data-art="${a.id}"><span class="bar-name"><i class="fa-solid ${a.icono}"></i>${a.nombre}</span>
        <span class="bar"><span style="width:${pct}%"></span></span>
        <span class="bar-num"><b class="num" data-libre>${queda}</b> <small class="muted">de ${a.total} libres</small></span></li>`;
    }).join('')}</ul>
    <button type="button" class="btn btn--brand btn--block" data-nueva data-fecha="${dia}"><i class="fa-solid fa-plus"></i> Reservar para ${fechaBonita(dia).toLowerCase()}</button>`;
};

// ---------- Reservas ----------
$('[data-buscar]').addEventListener('input', () => pintarReservas());
const msgConfirma = r => [
  `Hola ${nombre1(r)} 👋 Le confirmamos su renta con ${NEGOCIO} (folio #${r.folio}):`,
  `📅 ${new Date(r.fecha + 'T12:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}`,
  `📍 ${r.direccion}${r.colonia ? ', ' + r.colonia : ''}`,
  ...Object.entries(r.items).map(([k, n]) => `• ${n} × ${art(k).nombre} — ${pesos(n * art(k).precio)}`),
  r.flete ? `• Flete — ${pesos(r.flete)}` : '',
  `Total: ${pesos(total(r))} · Anticipo: ${pesos(pagado(r))} · Resta: ${pesos(saldo(r))}`,
  'Entregamos un día antes o temprano el mismo día. ¡Gracias!',
].filter(Boolean).join('\n');
const pintarReservas = () => {
  const semana = sumarDias(6), hoy = isoDia();
  const activas = db.reservas.filter(r => r.estado !== 'recogido');
  $('[data-st="semana"]').textContent = db.reservas.filter(r => r.fecha >= hoy && r.fecha <= semana).length;
  $('[data-st="entregar"]').textContent = activas.filter(r => r.estado === 'apartado').length;
  $('[data-st="recoger"]').textContent = activas.filter(r => r.estado === 'entregado').length;
  $('[data-st="saldo"]').textContent = pesos(activas.reduce((s, r) => s + saldo(r), 0));
  const q = $('[data-buscar]').value.trim().toLowerCase().replace(/^#/, '');
  const lista = db.reservas
    .filter(r => !q || `${r.cliente} ${r.colonia} ${r.folio}`.toLowerCase().includes(q))
    .sort((a, b) => (a.estado === 'recogido') - (b.estado === 'recogido') || a.fecha.localeCompare(b.fecha));
  $('[data-reservas]').innerHTML = lista.length ? lista.map(r => {
    const s = saldo(r);
    return `<li class="card res${r.estado === 'recogido' ? ' is-done' : ''}">
      <div class="res-top"><span class="muted small num">#${r.folio}</span><span class="badge ${ESTADOS[r.estado].badge}">${ESTADOS[r.estado].nombre}</span><span class="res-when"><i class="fa-regular fa-calendar"></i> ${fechaBonita(r.fecha)}</span></div>
      <h3>${esc(r.cliente)}</h3>
      <p class="small muted"><i class="fa-solid fa-location-dot"></i> ${esc(r.direccion)}${r.colonia ? ' · ' + esc(r.colonia) : ''}</p>
      <p class="res-items">${esc(listaItems(r.items))}</p>
      <div class="res-money"><span>Total <b class="num">${pesos(total(r))}</b></span><span class="${s ? 'owes' : 'paid'}">${s ? `Resta <b class="num">${pesos(s)}</b>` : '<b><i class="fa-solid fa-check"></i> Pagado</b>'}</span></div>
      <div class="res-actions">
        ${r.estado === 'apartado' ? `<button type="button" class="btn btn--sm btn--brand" data-paso="${esc(r.id)}"><i class="fa-solid fa-truck"></i> Entregado</button>` : ''}
        ${r.estado === 'entregado' ? `<button type="button" class="btn btn--sm btn--brand" data-paso="${esc(r.id)}"><i class="fa-solid fa-box"></i> Recogido</button>` : ''}
        ${s ? `<button type="button" class="btn btn--sm" data-liquidar="${esc(r.id)}"><i class="fa-solid fa-money-bill-wave"></i> Cobrar ${pesos(s)}</button>` : ''}
        ${r.tel && r.estado === 'apartado' ? `<a class="btn btn--sm btn--wa" data-wa-r="${esc(r.id)}" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp"></i> Confirmar</a>` : ''}
      </div>
    </li>`;
  }).join('') : '<li class="empty"><i class="fa-regular fa-face-smile"></i>No hay reservas con esa búsqueda.</li>';
  $$('[data-wa-r]').forEach(a => { const r = porId(a.dataset.waR); a.href = wa(r.tel, msgConfirma(r)); });
};
$('[data-reservas]').addEventListener('click', e => {
  const p = e.target.closest('[data-paso]');
  if (p) {
    const r = porId(p.dataset.paso);
    r.estado = r.estado === 'apartado' ? 'entregado' : 'recogido';
    guardar(); todo();
    toast(`#${r.folio} · ${ESTADOS[r.estado].nombre}`);
  }
  const l = e.target.closest('[data-liquidar]');
  if (l) {
    const r = porId(l.dataset.liquidar), s = saldo(r);
    r.pagos.push({ monto: s, t: Date.now() });
    guardar(); todo();
    toast(`#${r.folio} pagado · ${pesos(s)}`);
  }
});

// ---------- Ruta: qué cargar y a dónde ----------
const pintarRuta = () => {
  const bloques = [[isoDia(), 'Hoy'], [sumarDias(1), 'Mañana']].map(([f, t]) => {
    const entregar = db.reservas.filter(r => r.fecha === f && r.estado === 'apartado');
    const recoger = t === 'Hoy' ? db.reservas.filter(r => r.estado === 'entregado' && r.fecha < f) : [];
    const carga = {};
    entregar.forEach(r => Object.entries(r.items).forEach(([k, n]) => { carga[k] = (carga[k] || 0) + n; }));
    const parada = (r, tipo) => `<li><span class="stop stop--${tipo}">${tipo === 'e' ? 'Entregar' : 'Recoger'}</span><div><strong>${esc(r.cliente)}</strong><small class="muted">${esc(r.direccion)}${r.colonia ? ' · ' + esc(r.colonia) : ''}</small>${saldo(r) ? `<small class="owes">Cobrar ${pesos(saldo(r))}</small>` : ''}</div></li>`;
    return `<section class="card route-day">
      <h2>${t} <span class="muted small">· ${new Date(f + 'T12:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric' })}</span></h2>
      ${Object.keys(carga).length ? `<p class="load-t">Cargar en la camioneta</p><ul class="load">${Object.entries(carga).map(([k, n]) => `<li><b class="num">${n}</b> ${art(k).nombre}</li>`).join('')}</ul>` : ''}
      ${entregar.length || recoger.length ? `<ol class="stops">${entregar.map(r => parada(r, 'e')).join('')}${recoger.map(r => parada(r, 'r')).join('')}</ol>` : '<p class="empty">Sin salidas.</p>'}
    </section>`;
  });
  $('[data-ruta]').innerHTML = bloques.join('');
};

// ---------- Nueva reserva ----------
const fn = $('[data-form-nueva]');
const pintarPick = () => {
  const f = esFecha(fn.fecha.value) ? fn.fecha.value : isoDia();
  $('[data-articulos]').innerHTML = ARTICULOS.map(a => `
    <li><label for="q-${a.id}"><strong>${a.nombre}</strong><small class="muted"><span data-libre-${a.id}></span> · ${pesos(a.precio)} c/u</small></label>
    <input id="q-${a.id}" name="q-${a.id}" type="number" min="0" max="${a.total}" inputmode="numeric" placeholder="0" /></li>`).join('');
};
const leerItems = () => Object.fromEntries(ARTICULOS.map(a => [a.id, Math.floor(num(fn[`q-${a.id}`].value, 0, 10000))]).filter(([, n]) => n > 0));
const pintarTotal = () => {
  const items = leerItems();
  const f = esFecha(fn.fecha.value) ? fn.fecha.value : isoDia();
  ARTICULOS.forEach(a => {
    const l = libre(f, a.id);
    $(`[data-libre-${a.id}]`).textContent = `${l} ${l === 1 ? 'libre' : 'libres'}`;
    fn[`q-${a.id}`].closest('li').classList.toggle('is-over', (items[a.id] || 0) > l);
  });
  $('[data-total]').textContent = pesos(subtotal(items) + num(fn.flete.value, 0, 1e5));
};
fn.addEventListener('input', pintarTotal);
const abrirNueva = fecha => {
  fn.reset();
  fn.fecha.min = isoDia();
  fn.fecha.value = fecha && fecha >= isoDia() ? fecha : sumarDias(1);
  pintarPick();
  pintarTotal();
  $('.form-error', fn).hidden = true;
  abrir('nueva');
};
document.addEventListener('click', e => { const b = e.target.closest('[data-nueva]'); if (b) abrirNueva(b.dataset.fecha); });
fn.addEventListener('submit', e => {
  e.preventDefault();
  const err = $('.form-error', fn);
  const cliente = texto(fn.cliente.value, 50), tel = tel10(fn.tel.value), items = leerItems(), f = fn.fecha.value;
  const sinLugar = esFecha(f) && ARTICULOS.find(a => (items[a.id] || 0) > libre(f, a.id));
  const t = subtotal(items) + num(fn.flete.value, 0, 1e5), anticipo = Number(fn.anticipo.value || 0);
  const problema = !cliente ? 'Escribe el nombre del cliente.'
    : fn.tel.value.trim() && tel.length !== 10 ? 'El WhatsApp debe tener 10 dígitos.'
    : !esFecha(f) || f < isoDia() ? 'Elige el día del evento.'
    : !texto(fn.direccion.value) ? 'Escribe la dirección de entrega.'
    : !Object.keys(items).length ? 'Pon cuántas piezas de algo se lleva.'
    : sinLugar ? `Ese día solo quedan ${libre(f, sinLugar.id)} de «${sinLugar.nombre}».`
    : anticipo < 0 || anticipo > t ? 'El anticipo no puede ser mayor al total.' : '';
  if (problema) { err.textContent = problema; err.hidden = false; return; }
  const r = {
    id: uid(), folio: db.siguiente++, cliente, tel, fecha: f, colonia: texto(fn.colonia.value, 40), direccion: texto(fn.direccion.value, 100),
    items, flete: num(fn.flete.value, 0, 1e5), pagos: anticipo > 0 ? [{ monto: num(anticipo, 0, 1e7), t: Date.now() }] : [], estado: 'apartado',
  };
  db.reservas.push(r);
  guardar();
  $('#nueva').close();
  dia = f;
  todo();
  toast(`Reserva #${r.folio} apartada · ${fechaBonita(f)}`);
});

// ---------- Todo junto ----------
function todo() { pintarDisponible(); pintarReservas(); pintarRuta(); }
$('[data-hoy]').textContent = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
iniciarReinicio(CLAVE);
iniciarVistas();
todo();
