// Papelería La Pluma · inventario y ventas (ejemplo funcional). Herramientas comunes en ../comun.js.
const CLAVE = 'demo-inventario-v1';
const NEGOCIO = 'Papelería La Pluma';
const CATEGORIAS = ['Escolar', 'Oficina', 'Arte', 'Papel', 'Otros'];
const METODOS = { efectivo: 'Efectivo', tarjeta: 'Tarjeta', transferencia: 'Transferencia' };

// ---------- Datos de ejemplo ----------
const semilla = () => {
  const productos = [
    ['Cuaderno profesional raya', 'Escolar', 45, 28, 10], ['Cuaderno profesional cuadro', 'Escolar', 45, 6, 10],
    ['Lápiz del #2', 'Escolar', 8, 120, 30], ['Pluma azul', 'Escolar', 10, 85, 30], ['Borrador blanco', 'Escolar', 7, 40, 15],
    ['Sacapuntas metálico', 'Escolar', 12, 3, 10], ['Colores 12 piezas', 'Arte', 65, 14, 8], ['Plumones 10 colores', 'Arte', 85, 0, 5],
    ['Pegamento en barra', 'Escolar', 22, 30, 10], ['Tijeras escolares', 'Escolar', 35, 12, 6], ['Hojas blancas (100)', 'Papel', 60, 20, 8],
    ['Cartulina blanca', 'Papel', 9, 50, 20], ['Papel china', 'Papel', 4, 9, 25], ['Folder tamaño carta', 'Oficina', 5, 200, 50],
    ['Marcatextos amarillo', 'Oficina', 18, 25, 10], ['Calculadora básica', 'Oficina', 120, 4, 3], ['Cinta adhesiva', 'Oficina', 20, 18, 8],
    ['Regla 30 cm', 'Escolar', 15, 22, 8],
  ].map(([nombre, categoria, precio, stock, minimo], i) => ({ id: 'p' + i, nombre, categoria, precio, stock, minimo }));
  const p = i => productos[i];
  const venta = (minutos, items, metodo) => {
    const lineas = items.map(([i, qty]) => ({ id: p(i).id, nombre: p(i).nombre, precio: p(i).precio, qty }));
    const total = lineas.reduce((s, l) => s + l.precio * l.qty, 0);
    return { id: uid(), t: Date.now() - minutos * 60000, items: lineas, total, metodo, recibido: metodo === 'efectivo' ? Math.ceil(total / 50) * 50 : total };
  };
  const ventas = [
    venta(150, [[0, 2], [3, 3]], 'efectivo'), venta(118, [[6, 1], [8, 1]], 'tarjeta'), venta(95, [[13, 10], [14, 2]], 'efectivo'),
    venta(60, [[0, 1], [2, 4], [4, 2]], 'transferencia'), venta(25, [[11, 5], [12, 10]], 'efectivo'), venta(8, [[3, 2], [2, 2]], 'efectivo'),
  ].filter(v => isoDia(new Date(v.t)) === isoDia()); // si es muy temprano, solo las de hoy
  return { productos, ventas };
};

// Lo guardado puede venir alterado: se revisa campo por campo
const limpiar = d => {
  if (!d || !Array.isArray(d.productos) || !Array.isArray(d.ventas)) return null;
  const productos = d.productos.filter(p => p && typeof p.id === 'string').slice(0, 500).map(p => ({
    id: texto(p.id, 30), nombre: texto(p.nombre, 60) || 'Producto', categoria: CATEGORIAS.includes(p.categoria) ? p.categoria : 'Otros',
    precio: num(p.precio, 0, 1e6), stock: Math.floor(num(p.stock, 0, 1e6)), minimo: Math.floor(num(p.minimo, 0, 1e6)),
  }));
  const ventas = d.ventas.filter(v => v && Array.isArray(v.items)).slice(-1000).map(v => {
    const items = v.items.slice(0, 100).map(l => ({ id: texto(l.id, 30), nombre: texto(l.nombre, 60), precio: num(l.precio, 0, 1e6), qty: Math.floor(num(l.qty, 1, 1e4)) }));
    return { id: texto(v.id, 30), t: num(v.t, 0, 9e15), items, total: items.reduce((s, l) => s + l.precio * l.qty, 0), metodo: METODOS[v.metodo] ? v.metodo : 'efectivo', recibido: num(v.recibido, 0, 1e7) };
  });
  return { productos, ventas };
};

let db = cargar(CLAVE, semilla, limpiar);
const guardar = () => guardarEn(CLAVE, db);
const porId = id => db.productos.find(p => p.id === id);
const estado = p => (p.stock <= 0 ? 'agotado' : p.stock <= p.minimo ? 'pocos' : 'ok');
let ticket = []; // { id, qty }

// ---------- Vender ----------
let catVenta = 'Todas';
const pintarCats = () => {
  const usadas = ['Todas', ...CATEGORIAS.filter(c => db.productos.some(p => p.categoria === c))];
  if (!usadas.includes(catVenta)) catVenta = 'Todas';
  $('[data-cats-venta]').innerHTML = usadas.map(c => `<button type="button" class="chip${c === catVenta ? ' is-on' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');
};
$('[data-cats-venta]').addEventListener('click', e => {
  const b = e.target.closest('[data-cat]');
  if (b) { catVenta = b.dataset.cat; pintarVenta(); }
});
$('[data-buscar-venta]').addEventListener('input', () => pintarProductos());

const enTicket = id => ticket.find(l => l.id === id)?.qty || 0;
const pintarProductos = () => {
  const q = $('[data-buscar-venta]').value.trim().toLowerCase();
  const lista = db.productos.filter(p => (catVenta === 'Todas' || p.categoria === catVenta) && (!q || p.nombre.toLowerCase().includes(q)));
  $('[data-productos]').innerHTML = lista.length ? lista.map(p => {
    const st = estado(p);
    const qty = enTicket(p.id);
    return `<button type="button" class="product${st === 'agotado' ? ' is-out' : ''}" data-add="${esc(p.id)}" ${st === 'agotado' ? 'disabled' : ''}>
      ${qty ? `<span class="product-qty num">${qty}</span>` : ''}
      <strong>${esc(p.nombre)}</strong>
      <span class="product-meta"><b class="num">${pesos(p.precio)}</b><small class="${st === 'ok' ? '' : 'is-' + st}">${st === 'agotado' ? 'Agotado' : `${p.stock} en tienda`}</small></span>
    </button>`;
  }).join('') : '<p class="empty"><i class="fa-solid fa-magnifying-glass"></i>No hay productos con ese nombre.</p>';
};

const totalTicket = () => ticket.reduce((s, l) => s + porId(l.id).precio * l.qty, 0);
const pintarTicket = () => {
  ticket = ticket.filter(l => porId(l.id));
  const ul = $('[data-lineas]');
  ul.innerHTML = ticket.length ? ticket.map(l => {
    const p = porId(l.id);
    return `<li class="line">
      <div><strong>${esc(p.nombre)}</strong><small class="num">${pesos(p.precio)} c/u</small></div>
      <div class="qty"><button type="button" class="icon-btn" data-menos="${esc(p.id)}" aria-label="Uno menos"><i class="fa-solid fa-minus"></i></button><b class="num">${l.qty}</b><button type="button" class="icon-btn" data-mas="${esc(p.id)}" aria-label="Uno más"><i class="fa-solid fa-plus"></i></button></div>
      <b class="line-total num">${pesos(p.precio * l.qty)}</b>
    </li>`;
  }).join('') : '<li class="empty small"><i class="fa-solid fa-receipt"></i>Toca un producto para empezar.</li>';
  const total = totalTicket();
  const piezas = ticket.reduce((s, l) => s + l.qty, 0);
  $('[data-total]').textContent = pesos(total);
  $('[data-total-bar]').textContent = pesos(total);
  $('[data-items]').textContent = piezas;
  $('[data-cobrar]').disabled = !ticket.length;
  $('[data-abrir-ticket]').hidden = !ticket.length;
  if (!ticket.length) cerrarTicket();
};
const agregar = (id, n = 1) => {
  const p = porId(id);
  if (!p) return;
  const actual = enTicket(id);
  if (actual + n > p.stock) { toast(`Solo hay ${p.stock} de ${p.nombre}`); return; }
  const l = ticket.find(x => x.id === id);
  if (l) l.qty += n;
  else ticket.push({ id, qty: n });
  ticket = ticket.filter(x => x.qty > 0);
  pintarProductos();
  pintarTicket();
};
$('[data-productos]').addEventListener('click', e => { const b = e.target.closest('[data-add]'); if (b) agregar(b.dataset.add); });
$('[data-lineas]').addEventListener('click', e => {
  const mas = e.target.closest('[data-mas]');
  const menos = e.target.closest('[data-menos]');
  if (mas) agregar(mas.dataset.mas, 1);
  if (menos) agregar(menos.dataset.menos, -1);
});
$('[data-vaciar]').addEventListener('click', () => { ticket = []; pintarProductos(); pintarTicket(); });

// En celular el ticket sube desde abajo
const cerrarTicket = () => document.body.classList.remove('ticket-open');
$('[data-abrir-ticket]').addEventListener('click', () => document.body.classList.add('ticket-open'));
$$('[data-cerrar-ticket]').forEach(b => b.addEventListener('click', cerrarTicket));

// ---------- Cobrar ----------
const cobro = $('[data-form-cobro]');
const pintarCambio = () => {
  const total = totalTicket();
  const efectivo = cobro.metodo.value === 'efectivo';
  $('[data-efectivo]').hidden = !efectivo;
  const recibido = num(cobro.recibido.value, 0, 1e7);
  $('[data-cambio]').textContent = pesos(Math.max(recibido - total, 0));
};
$('[data-cobrar]').addEventListener('click', () => {
  const total = totalTicket();
  cobro.reset();
  $('[data-cobro-total]').textContent = pesos(total);
  cobro.recibido.value = total;
  const sug = [...new Set([total, Math.ceil(total / 50) * 50, Math.ceil(total / 100) * 100, Math.ceil(total / 500) * 500])].slice(0, 4);
  $('[data-rapidos]').innerHTML = sug.map((v, i) => `<button type="button" class="chip" data-recibe="${v}">${i ? pesos(v) : 'Exacto'}</button>`).join('');
  $('.form-error', cobro).hidden = true;
  pintarCambio();
  abrir('cobrar');
});
$('[data-rapidos]').addEventListener('click', e => { const b = e.target.closest('[data-recibe]'); if (b) { cobro.recibido.value = b.dataset.recibe; pintarCambio(); } });
cobro.addEventListener('input', pintarCambio);
cobro.addEventListener('change', pintarCambio);
cobro.addEventListener('submit', e => {
  e.preventDefault();
  const total = totalTicket();
  const metodo = METODOS[cobro.metodo.value] ? cobro.metodo.value : 'efectivo';
  const recibido = metodo === 'efectivo' ? num(cobro.recibido.value, 0, 1e7) : total;
  if (recibido < total) {
    $('.form-error', cobro).textContent = `Faltan ${pesos(total - recibido)}.`;
    $('.form-error', cobro).hidden = false;
    return;
  }
  // Revisar existencias otra vez antes de descontar
  for (const l of ticket) if (porId(l.id).stock < l.qty) { toast(`Ya no alcanza: ${porId(l.id).nombre}`); return; }
  const items = ticket.map(l => { const p = porId(l.id); p.stock -= l.qty; return { id: p.id, nombre: p.nombre, precio: p.precio, qty: l.qty }; });
  db.ventas.push({ id: uid(), t: Date.now(), items, total, metodo, recibido });
  guardar();
  ticket = [];
  $('#cobrar').close();
  todo();
  const cambio = recibido - total;
  toast(cambio > 0 ? `Venta registrada · Cambio: ${pesos(cambio)}` : 'Venta registrada');
});

// ---------- Inventario ----------
let filtroInv = 'todos';
$('[data-filtro-inv]').addEventListener('click', e => {
  const b = e.target.closest('[data-f]');
  if (!b) return;
  filtroInv = b.dataset.f;
  $$('[data-f]').forEach(x => x.classList.toggle('is-on', x === b));
  pintarInventario();
});
$('[data-buscar-inv]').addEventListener('input', () => pintarInventario());
const pintarInventario = () => {
  const ps = db.productos;
  $('[data-st="productos"]').textContent = ps.length;
  $('[data-st="piezas"]').textContent = ps.reduce((s, p) => s + p.stock, 0).toLocaleString('es-MX');
  $('[data-st="pocos"]').textContent = ps.filter(p => estado(p) !== 'ok').length;
  $('[data-st="valor"]').textContent = pesos(ps.reduce((s, p) => s + p.precio * p.stock, 0));
  const q = $('[data-buscar-inv]').value.trim().toLowerCase();
  const lista = ps.filter(p => (filtroInv === 'todos' || (filtroInv === 'pocos' ? estado(p) === 'pocos' : estado(p) === 'agotado')) && (!q || p.nombre.toLowerCase().includes(q)))
    .sort((a, b) => ({ agotado: 0, pocos: 1, ok: 2 }[estado(a)] - { agotado: 0, pocos: 1, ok: 2 }[estado(b)]) || a.nombre.localeCompare(b.nombre));
  $('[data-inventario]').innerHTML = lista.length ? lista.map(p => {
    const st = estado(p);
    const badge = st === 'agotado' ? '<span class="badge badge--bad">Agotado</span>' : st === 'pocos' ? '<span class="badge badge--warn">Quedan pocos</span>' : '<span class="badge badge--ok">Bien</span>';
    const pct = Math.min(p.stock / Math.max(p.minimo * 3, 1), 1) * 100;
    return `<li class="card inv">
      <div class="inv-name"><strong>${esc(p.nombre)}</strong><small>${esc(p.categoria)} · ${pesos(p.precio)}</small></div>
      <div class="inv-stock"><b class="num">${p.stock}</b><span class="meter ${'is-' + st}"><i style="width:${pct.toFixed(0)}%"></i></span>${badge}</div>
      <div class="inv-actions"><button type="button" class="btn btn--sm" data-entrada="${esc(p.id)}"><i class="fa-solid fa-truck-ramp-box"></i> Entrada</button><button type="button" class="icon-btn" data-editar="${esc(p.id)}" aria-label="Editar ${esc(p.nombre)}"><i class="fa-solid fa-pen"></i></button></div>
    </li>`;
  }).join('') : '<li class="empty"><i class="fa-regular fa-face-smile"></i>Nada por aquí.</li>';
  const alertas = ps.filter(p => estado(p) !== 'ok').length;
  $('[data-alertas]').hidden = !alertas;
  $('[data-alertas]').textContent = alertas;
};

// Agregar / editar producto
const fp = $('[data-form-producto]');
$('[data-cat-select]').innerHTML = CATEGORIAS.map(c => `<option>${c}</option>`).join('');
let editando = null;
const abrirProducto = id => {
  editando = id ? porId(id) : null;
  fp.reset();
  $('#prod-t').textContent = editando ? 'Editar producto' : 'Agregar producto';
  $('[data-borrar]', fp).hidden = !editando;
  $('.form-error', fp).hidden = true;
  if (editando) ['nombre', 'categoria', 'precio', 'stock', 'minimo'].forEach(k => { fp.elements[k].value = editando[k]; });
  else { fp.stock.value = 0; fp.minimo.value = 5; }
  abrir('producto');
};
$('[data-nuevo]').addEventListener('click', () => abrirProducto(null));
fp.addEventListener('submit', e => {
  e.preventDefault();
  const nombre = texto(fp.nombre.value, 60);
  const precio = Number(fp.precio.value);
  if (!nombre || !(precio > 0)) {
    $('.form-error', fp).textContent = !nombre ? 'Escribe el nombre del producto.' : 'Escribe un precio mayor a $0.';
    $('.form-error', fp).hidden = false;
    return;
  }
  const datos = { nombre, categoria: CATEGORIAS.includes(fp.categoria.value) ? fp.categoria.value : 'Otros', precio: num(precio, 0, 1e6), stock: Math.floor(num(fp.stock.value, 0, 1e6)), minimo: Math.floor(num(fp.minimo.value, 0, 1e6)) };
  if (editando) Object.assign(editando, datos);
  else db.productos.push({ id: uid(), ...datos });
  guardar();
  $('#producto').close();
  todo();
  toast(editando ? 'Producto actualizado' : 'Producto agregado');
});
$('[data-borrar]', fp).addEventListener('click', () => {
  if (!editando || !confirm(`¿Borrar «${editando.nombre}» del inventario?`)) return;
  db.productos = db.productos.filter(p => p !== editando);
  guardar();
  $('#producto').close();
  todo();
  toast('Producto borrado');
});

// Entrada de mercancía
const fe = $('[data-form-entrada]');
let entradaDe = null;
$('[data-inventario]').addEventListener('click', e => {
  const ent = e.target.closest('[data-entrada]');
  const ed = e.target.closest('[data-editar]');
  if (ed) abrirProducto(ed.dataset.editar);
  if (ent) {
    entradaDe = porId(ent.dataset.entrada);
    fe.reset();
    $('[data-entrada-nombre]').textContent = entradaDe.nombre;
    $('[data-entrada-actual]').textContent = `Hoy hay ${entradaDe.stock} en tienda.`;
    $('.form-error', fe).hidden = true;
    abrir('entrada');
  }
});
fe.addEventListener('submit', e => {
  e.preventDefault();
  const n = Math.floor(Number(fe.cantidad.value));
  if (!(n >= 1 && n <= 1e5)) {
    $('.form-error', fe).textContent = 'Escribe cuántas piezas llegaron.';
    $('.form-error', fe).hidden = false;
    return;
  }
  entradaDe.stock += n;
  guardar();
  $('#entrada').close();
  todo();
  toast(`+${n} ${entradaDe.nombre} · ahora hay ${entradaDe.stock}`);
});

// ---------- Corte del día ----------
const ventasHoy = () => db.ventas.filter(v => isoDia(new Date(v.t)) === isoDia());
const resumen = () => {
  const vs = ventasHoy();
  const suma = m => vs.filter(v => !m || v.metodo === m).reduce((s, v) => s + v.total, 0);
  const piezas = {};
  vs.forEach(v => v.items.forEach(l => { piezas[l.nombre] = (piezas[l.nombre] || 0) + l.qty; }));
  const top = Object.entries(piezas).sort((a, b) => b[1] - a[1]).slice(0, 5);
  return { vs, total: suma(), efectivo: suma('efectivo'), tarjeta: suma('tarjeta'), transferencia: suma('transferencia'), top };
};
const pintarCorte = () => {
  const r = resumen();
  $('[data-corte-fecha]').textContent = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  $('[data-c="total"]').textContent = pesos(r.total);
  $('[data-c="ventas"]').textContent = r.vs.length;
  $('[data-c="efectivo"]').textContent = pesos(r.efectivo);
  $('[data-c="otros"]').textContent = pesos(r.tarjeta + r.transferencia);
  const max = r.top[0]?.[1] || 1;
  $('[data-top]').innerHTML = r.top.length ? r.top.map(([n, q]) => `<li><span>${esc(n)}</span><b class="num">${q}</b><i style="width:${(q / max * 100).toFixed(0)}%"></i></li>`).join('') : '<li class="empty small">Aún no hay ventas hoy.</li>';
  $('[data-ventas]').innerHTML = r.vs.length ? r.vs.slice().reverse().map(v => `<li>
      <time class="num">${new Date(v.t).toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' })}</time>
      <span class="sale-items">${esc(v.items.map(l => `${l.qty} ${l.nombre}`).join(', '))}</span>
      <span class="badge">${METODOS[v.metodo]}</span>
      <b class="num">${pesos(v.total)}</b>
    </li>`).join('') : '<li class="empty small"><i class="fa-solid fa-receipt"></i>Cuando vendas algo aparecerá aquí.</li>';
  $('[data-hoy-total]').textContent = `Hoy ${pesos(r.total)}`;
};
$('[data-enviar-corte]').addEventListener('click', () => {
  const r = resumen();
  const fecha = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  const msg = [`📊 Corte de ${NEGOCIO}`, fecha, '', `Ventas: ${r.vs.length}`, `Total: ${pesos(r.total)}`, `• Efectivo: ${pesos(r.efectivo)}`, `• Tarjeta: ${pesos(r.tarjeta)}`, `• Transferencia: ${pesos(r.transferencia)}`];
  if (r.top.length) msg.push('', `Lo más vendido: ${r.top.slice(0, 3).map(([n, q]) => `${n} (${q})`).join(', ')}`);
  const pocos = db.productos.filter(p => estado(p) !== 'ok');
  if (pocos.length) msg.push('', `⚠️ Por surtir: ${pocos.map(p => `${p.nombre} (${p.stock})`).join(', ')}`);
  window.open(wa('', msg.join('\n')), '_blank', 'noopener');
});

// ---------- Todo junto ----------
const pintarVenta = () => { pintarCats(); pintarProductos(); pintarTicket(); };
function todo() { pintarVenta(); pintarInventario(); pintarCorte(); }
$('[data-hoy]').textContent = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
iniciarReinicio(CLAVE);
iniciarVistas(() => cerrarTicket());
todo();
