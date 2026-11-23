// Pastelería Dulce Hogar · pedidos y apartados (ejemplo funcional). Herramientas comunes en ../comun.js.
const CLAVE = 'demo-pedidos-v1';
const NEGOCIO = 'Dulce Hogar';
const ESTADOS = {
  pendiente: { nombre: 'Pendiente', badge: '', siguiente: 'preparando', accion: 'Empezar' },
  preparando: { nombre: 'En preparación', badge: 'badge--brand', siguiente: 'listo', accion: 'Marcar listo' },
  listo: { nombre: 'Listo', badge: 'badge--ok', siguiente: 'entregado', accion: 'Entregar' },
  entregado: { nombre: 'Entregado', badge: '', siguiente: null, accion: '' },
};

// ---------- Datos de ejemplo (fechas relativas a hoy) ----------
const semilla = () => {
  const p = (folio, cliente, tel, producto, detalle, dias, hora, total, pagado, estado) =>
    ({ id: 'o' + folio, folio, cliente, tel, producto, detalle, fecha: sumarDias(dias), hora, total, pagos: pagado ? [{ monto: pagado, t: Date.now() - 86400000 * 2 }] : [], estado });
  return {
    siguiente: 109,
    pedidos: [
      p(101, 'Mariana López', '5500000101', 'Pastel de chocolate, 20 personas', 'Letrero «Feliz cumple, Sofi» y velas', 0, '16:00', 850, 400, 'listo'),
      p(102, 'Carlos Ruiz', '5500000102', '3 docenas de cupcakes de vainilla', 'Betún azul cielo', 0, '18:30', 540, 540, 'preparando'),
      p(103, 'Ana Torres', '5500000103', 'Pastel de tres leches, 30 personas', '', 1, '12:00', 1200, 600, 'pendiente'),
      p(104, 'Jorge Méndez', '5500000104', 'Gelatina mosaico grande', '', 1, '17:00', 280, 100, 'pendiente'),
      p(105, 'Lucía Garza', '5500000105', 'Pastel de boda, 2 pisos', 'Flores naturales, entregar en salón', 3, '13:00', 3500, 1500, 'pendiente'),
      p(106, 'Pedro Salas', '5500000106', '50 galletas decoradas', 'Tema baby shower, niña', 2, '11:00', 950, 500, 'preparando'),
      p(107, 'Daniela Ríos', '5500000107', 'Pay de queso', '', -1, '15:00', 320, 320, 'entregado'),
      p(108, 'Roberto Vega', '5500000108', 'Pastel de zanahoria', 'Sin pasas', 5, '10:00', 650, 0, 'pendiente'),
    ],
  };
};
const limpiar = d => {
  if (!d || !Array.isArray(d.pedidos)) return null;
  const pedidos = d.pedidos.filter(o => o && typeof o.id === 'string').slice(0, 1000).map(o => ({
    id: texto(o.id, 30), folio: Math.floor(num(o.folio, 1, 1e7)), cliente: texto(o.cliente, 50) || 'Cliente', tel: tel10(o.tel),
    producto: texto(o.producto, 70) || 'Pedido', detalle: texto(o.detalle, 200), fecha: esFecha(o.fecha) ? o.fecha : isoDia(), hora: esHora(o.hora) ? o.hora : '12:00',
    total: num(o.total, 0, 1e7), pagos: Array.isArray(o.pagos) ? o.pagos.slice(0, 50).map(x => ({ monto: num(x?.monto, 0, 1e7), t: num(x?.t, 0, 9e15) })) : [],
    estado: ESTADOS[o.estado] ? o.estado : 'pendiente',
  }));
  return { siguiente: Math.floor(num(d.siguiente, 1, 1e7)), pedidos };
};

let db = cargar(CLAVE, semilla, limpiar);
const guardar = () => guardarEn(CLAVE, db);
const porId = id => db.pedidos.find(o => o.id === id);
const pagado = o => o.pagos.reduce((s, x) => s + x.monto, 0);
const saldo = o => Math.max(o.total - pagado(o), 0);
const atrasado = o => o.estado !== 'entregado' && o.fecha < isoDia();

// ---------- Lista de pedidos ----------
const FILTROS = [['activos', 'Activos'], ['pendiente', 'Pendientes'], ['preparando', 'En preparación'], ['listo', 'Listos'], ['entregado', 'Entregados'], ['todos', 'Todos']];
let filtro = 'activos';
const pasaFiltro = o => filtro === 'todos' || (filtro === 'activos' ? o.estado !== 'entregado' : o.estado === filtro);
$('[data-filtros]').addEventListener('click', e => { const b = e.target.closest('[data-f]'); if (b) { filtro = b.dataset.f; pintarPedidos(); } });
$('[data-buscar]').addEventListener('input', () => pintarPedidos());

const tarjeta = o => {
  const e = ESTADOS[o.estado];
  const s = saldo(o);
  const cuando = o.estado === 'entregado' ? `Entregado · ${fechaBonita(o.fecha)}`
    : `${fechaBonita(o.fecha)} · ${horaBonita(o.hora)}`;
  const urgente = o.estado !== 'entregado' && (o.fecha === isoDia() || atrasado(o));
  return `<li class="card order${o.estado === 'entregado' ? ' is-done' : ''}">
    <div class="order-top">
      <span class="folio num">#${o.folio}</span>
      <span class="badge ${e.badge}">${e.nombre}</span>
      ${atrasado(o) ? '<span class="badge badge--bad">Atrasado</span>' : ''}
      <span class="when${urgente ? ' is-urgent' : ''}"><i class="fa-regular fa-clock"></i> ${cuando}</span>
    </div>
    <h3>${esc(o.producto)}</h3>
    ${o.detalle ? `<p class="detail">${esc(o.detalle)}</p>` : ''}
    <p class="client"><i class="fa-regular fa-user"></i> ${esc(o.cliente)}</p>
    <div class="money">
      <span><small>Total</small><b class="num">${pesos(o.total)}</b></span>
      <span><small>Pagado</small><b class="num">${pesos(pagado(o))}</b></span>
      <span class="${s ? 'owes' : 'paid'}"><small>${s ? 'Saldo' : 'Liquidado'}</small><b class="num">${s ? pesos(s) : '<i class="fa-solid fa-check"></i>'}</b></span>
    </div>
    <div class="order-actions">
      ${e.siguiente ? `<button type="button" class="btn btn--sm btn--brand" data-avanzar="${esc(o.id)}">${e.accion}</button>` : ''}
      ${s ? `<button type="button" class="btn btn--sm" data-cobrar="${esc(o.id)}"><i class="fa-solid fa-money-bill-wave"></i> Cobrar</button>` : ''}
      ${o.tel && o.estado !== 'entregado' ? `<a class="btn btn--sm btn--wa" data-wa="${esc(o.id)}" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp"></i> Avisar</a>` : ''}
    </div>
  </li>`;
};
const mensajeCliente = o => {
  const s = saldo(o);
  const nombre = o.cliente.split(' ')[0];
  if (o.estado === 'listo') return `Hola ${nombre} 👋 Tu pedido #${o.folio} (${o.producto}) ya está listo en ${NEGOCIO} 🎂.${s ? ` Saldo pendiente: ${pesos(s)}.` : ''} ¡Te esperamos!`;
  return `Hola ${nombre} 👋 Te recordamos tu pedido #${o.folio} (${o.producto}) para ${fechaBonita(o.fecha).toLowerCase()} a las ${horaBonita(o.hora)}.${s ? ` Saldo pendiente: ${pesos(s)}.` : ''} — ${NEGOCIO}`;
};

const pintarPedidos = () => {
  const activos = db.pedidos.filter(o => o.estado !== 'entregado');
  $('[data-st="hoy"]').textContent = activos.filter(o => o.fecha === isoDia()).length;
  $('[data-st="proceso"]').textContent = activos.filter(o => o.estado !== 'listo').length;
  $('[data-st="listos"]').textContent = activos.filter(o => o.estado === 'listo').length;
  $('[data-st="saldo"]').textContent = pesos(db.pedidos.reduce((s, o) => s + saldo(o), 0));
  $('[data-filtros]').innerHTML = FILTROS.map(([f, n]) => {
    const c = db.pedidos.filter(o => f === 'todos' || (f === 'activos' ? o.estado !== 'entregado' : o.estado === f)).length;
    return `<button type="button" class="chip${f === filtro ? ' is-on' : ''}" data-f="${f}">${n}<span class="count">${c}</span></button>`;
  }).join('');
  const q = $('[data-buscar]').value.trim().toLowerCase().replace(/^#/, '');
  const lista = db.pedidos
    .filter(o => pasaFiltro(o) && (!q || `${o.cliente} ${o.producto} ${o.folio}`.toLowerCase().includes(q)))
    .sort((a, b) => (a.estado === 'entregado') - (b.estado === 'entregado') || (a.fecha + a.hora).localeCompare(b.fecha + b.hora) * (a.estado === 'entregado' ? -1 : 1));
  $('[data-pedidos]').innerHTML = lista.length ? lista.map(tarjeta).join('') : '<li class="empty"><i class="fa-regular fa-face-smile"></i>No hay pedidos aquí.</li>';
  $$('[data-wa]').forEach(a => { const o = porId(a.dataset.wa); a.href = wa(o.tel, mensajeCliente(o)); });
};

$('[data-pedidos]').addEventListener('click', e => {
  const av = e.target.closest('[data-avanzar]');
  const co = e.target.closest('[data-cobrar]');
  if (av) avanzar(porId(av.dataset.avanzar));
  if (co) abrirCobro(porId(co.dataset.cobrar));
});
const avanzar = o => {
  const sig = ESTADOS[o.estado].siguiente;
  if (!sig) return;
  if (sig === 'entregado' && saldo(o) > 0 && !confirm(`El pedido #${o.folio} tiene ${pesos(saldo(o))} de saldo. ¿Entregarlo así?`)) return;
  o.estado = sig;
  guardar();
  todo();
  toast(`#${o.folio} · ${ESTADOS[sig].nombre}${sig === 'listo' ? ' · avísale por WhatsApp' : ''}`);
};

// ---------- Cobrar ----------
const fc = $('[data-form-cobro]');
let cobrando = null;
const abrirCobro = o => {
  cobrando = o;
  fc.reset();
  $('[data-cobro-info]').textContent = `#${o.folio} · ${o.cliente}`;
  $('[data-cobro-saldo]').textContent = pesos(saldo(o));
  fc.monto.value = saldo(o);
  $('.form-error', fc).hidden = true;
  abrir('cobro');
};
$('[data-todo]').addEventListener('click', () => { fc.monto.value = saldo(cobrando); });
$('[data-mitad]').addEventListener('click', () => { fc.monto.value = Math.round(saldo(cobrando) / 2); });
fc.addEventListener('submit', e => {
  e.preventDefault();
  const m = Number(fc.monto.value);
  const s = saldo(cobrando);
  if (!(m > 0) || m > s) {
    $('.form-error', fc).textContent = m > s ? `El saldo es de ${pesos(s)}.` : 'Escribe cuánto paga.';
    $('.form-error', fc).hidden = false;
    return;
  }
  cobrando.pagos.push({ monto: num(m, 0, 1e7), t: Date.now() });
  guardar();
  $('#cobro').close();
  todo();
  toast(saldo(cobrando) ? `Pago registrado · resta ${pesos(saldo(cobrando))}` : `#${cobrando.folio} liquidado`);
});

// ---------- Nuevo pedido ----------
const fn = $('[data-form-nuevo]');
$$('[data-nuevo]').forEach(b => b.addEventListener('click', () => {
  fn.reset();
  fn.fecha.value = sumarDias(1);
  fn.fecha.min = isoDia();
  fn.hora.value = '12:00';
  $('.form-error', fn).hidden = true;
  abrir('nuevo');
}));
fn.addEventListener('submit', e => {
  e.preventDefault();
  const err = $('.form-error', fn);
  const cliente = texto(fn.cliente.value, 50);
  const producto = texto(fn.producto.value, 70);
  const total = Number(fn.total.value);
  const anticipo = Number(fn.anticipo.value || 0);
  const tel = tel10(fn.tel.value);
  const problema = !cliente ? 'Escribe el nombre del cliente.'
    : fn.tel.value.trim() && tel.length !== 10 ? 'El WhatsApp debe tener 10 dígitos.'
    : !producto ? 'Escribe qué pidió.'
    : !esFecha(fn.fecha.value) ? 'Elige el día de entrega.'
    : !(total > 0) ? 'Escribe el total del pedido.'
    : anticipo < 0 || anticipo > total ? 'El anticipo no puede ser mayor al total.' : '';
  if (problema) { err.textContent = problema; err.hidden = false; return fn.querySelector(`[name="${([['nombre', 'cliente'], ['WhatsApp', 'tel'], ['qué pidió', 'producto'], ['día', 'fecha'], ['anticipo', 'anticipo']].find(([t]) => problema.includes(t)) || [, 'total'])[1]}"]`)?.focus(); }
  const o = {
    id: uid(), folio: db.siguiente++, cliente, tel, producto, detalle: texto(fn.detalle.value, 200),
    fecha: fn.fecha.value, hora: esHora(fn.hora.value) ? fn.hora.value : '12:00', total: num(total, 0, 1e7),
    pagos: anticipo > 0 ? [{ monto: num(anticipo, 0, 1e7), t: Date.now() }] : [], estado: 'pendiente',
  };
  db.pedidos.push(o);
  guardar();
  $('#nuevo').close();
  filtro = 'activos';
  todo();
  toast(`Pedido #${o.folio} guardado`);
});

// ---------- Entregas de la semana ----------
const pintarEntregas = () => {
  const activos = db.pedidos.filter(o => o.estado !== 'entregado');
  const grupos = [];
  const tarde = activos.filter(atrasado);
  if (tarde.length) grupos.push(['Atrasados', tarde, true]);
  for (let i = 0; i < 7; i++) {
    const dia = sumarDias(i);
    grupos.push([fechaBonita(dia) + (i > 1 ? '' : ` · ${new Date(dia + 'T12:00').toLocaleDateString('es-MX', { weekday: 'long' })}`), db.pedidos.filter(o => o.fecha === dia), false]);
  }
  $('[data-dias]').innerHTML = grupos.map(([titulo, lista, malo]) => `
    <section class="day card${malo ? ' is-late' : ''}">
      <header><h2>${titulo}</h2><span class="muted small">${lista.length ? `${lista.length} ${lista.length === 1 ? 'pedido' : 'pedidos'} · ${pesos(lista.reduce((s, o) => s + o.total, 0))}` : 'Libre'}</span></header>
      ${lista.length ? `<ul>${lista.sort((a, b) => a.hora.localeCompare(b.hora)).map(o => `
        <li><time class="num">${horaBonita(o.hora)}</time><div><strong>${esc(o.producto)}</strong><small>#${o.folio} · ${esc(o.cliente)}</small></div><span class="badge ${ESTADOS[o.estado].badge}">${ESTADOS[o.estado].nombre}</span></li>`).join('')}</ul>` : ''}
    </section>`).join('');
};

// ---------- Todo junto ----------
function todo() { pintarPedidos(); pintarEntregas(); }
$('[data-hoy]').textContent = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
iniciarReinicio(CLAVE);
iniciarVistas();
todo();
