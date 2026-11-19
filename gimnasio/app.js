// Gym Fuerza · socios y membresías (ejemplo funcional). Herramientas comunes en ../comun.js.
const CLAVE = 'demo-gimnasio-v1';
const NEGOCIO = 'Gym Fuerza';
const AVISO_DIAS = 5; // «por vencer» cuando faltan estos días o menos
const PLANES = {
  visita: { nombre: 'Visita', precio: 60, dias: 1 },
  mensual: { nombre: 'Mensual', precio: 450, dias: 30 },
  trimestral: { nombre: 'Trimestral', precio: 1200, dias: 90 },
  anual: { nombre: 'Anual', precio: 4200, dias: 365 },
};

// ---------- Datos de ejemplo (fechas relativas a hoy) ----------
const semilla = () => {
  const ahora = Date.now();
  const s = (num, nombre, tel, plan, vence, asist) => ({ id: 's' + num, num, nombre, tel, plan, vence: sumarDias(vence), asistencias: asist.map(d => sumarDias(d)) });
  const p = (num, plan, dias, horas = 3) => ({ id: uid() + num, socio: 's' + num, plan, monto: PLANES[plan].precio, fecha: sumarDias(dias), t: ahora - horas * 36e5 });
  return {
    siguiente: 1031,
    socios: [
      s(1018, 'Sofía Ramírez', '5500000301', 'mensual', 21, [0, -1, -3, -5]),
      s(1019, 'Diego Herrera', '5500000302', 'trimestral', 64, [-1, -2, -4]),
      s(1020, 'Valeria Núñez', '5500000303', 'mensual', 3, [0, -2, -6]),
      s(1021, 'Emilio Cárdenas', '5500000304', 'mensual', -4, [-6, -9]),
      s(1022, 'Andrea Fuentes', '5500000305', 'anual', 240, [0, -1, -2, -3]),
      s(1023, 'Raúl Medina', '5500000306', 'mensual', 1, [-1, -3]),
      s(1024, 'Karla Ibarra', '5500000307', 'mensual', 12, [-2]),
      s(1025, 'Héctor Salinas', '5500000308', 'trimestral', -15, [-20]),
      s(1026, 'Mónica Treviño', '5500000309', 'mensual', 28, [0]),
      s(1027, 'Luis Alberto Paz', '5500000310', 'mensual', 5, [-1, -4]),
      s(1028, 'Fernanda Gil', '5500000311', 'anual', 180, [-3, -5]),
      s(1029, 'Óscar Villa', '5500000312', 'mensual', 0, [-2, -7]),
      s(1030, 'Paola Reyes', '5500000313', 'mensual', 17, [0, -1]),
    ],
    pagos: [
      p(1026, 'mensual', 0, 2), p(1018, 'mensual', -9), p(1030, 'mensual', -13), p(1022, 'anual', -125), p(1024, 'mensual', -18),
      p(1019, 'trimestral', -26), p(1028, 'anual', -185), p(1020, 'mensual', -27), p(1027, 'mensual', -25),
    ],
    visitas: [{ monto: 60, fecha: sumarDias(0), t: ahora - 1.5 * 36e5 }],
  };
};
const limpiar = d => {
  if (!d || !Array.isArray(d.socios)) return null;
  const socios = d.socios.filter(s => s && typeof s.id === 'string').slice(0, 5000).map(s => ({
    id: texto(s.id, 30), num: Math.floor(num(s.num, 1, 1e7)), nombre: texto(s.nombre, 50) || 'Socio', tel: tel10(s.tel),
    plan: PLANES[s.plan] ? s.plan : 'mensual', vence: esFecha(s.vence) ? s.vence : isoDia(),
    asistencias: Array.isArray(s.asistencias) ? s.asistencias.filter(esFecha).slice(-400) : [],
  }));
  const pagos = (Array.isArray(d.pagos) ? d.pagos : []).filter(p => p && typeof p.socio === 'string').slice(-5000).map(p => ({
    id: texto(p.id, 40), socio: texto(p.socio, 30), plan: PLANES[p.plan] ? p.plan : 'mensual', monto: num(p.monto, 0, 1e6), fecha: esFecha(p.fecha) ? p.fecha : isoDia(), t: num(p.t, 0, 9e15),
  }));
  const visitas = (Array.isArray(d.visitas) ? d.visitas : []).slice(-5000).map(v => ({ monto: num(v?.monto, 0, 1e5), fecha: esFecha(v?.fecha) ? v.fecha : isoDia(), t: num(v?.t, 0, 9e15) }));
  return { siguiente: Math.floor(num(d.siguiente, 1, 1e7)), socios, pagos, visitas };
};

let db = cargar(CLAVE, semilla, limpiar);
const guardar = () => guardarEn(CLAVE, db);
const porId = id => db.socios.find(s => s.id === id);

// ---------- Estado de cada socio ----------
const diasPara = iso => Math.round((new Date(iso + 'T12:00') - new Date(isoDia() + 'T12:00')) / 864e5);
const estado = s => {
  const d = diasPara(s.vence);
  if (d < 0) return { clave: 'vencido', badge: 'badge--bad', texto: `Venció hace ${-d} ${-d === 1 ? 'día' : 'días'}` };
  if (d === 0) return { clave: 'porvencer', badge: 'badge--warn', texto: 'Vence hoy' };
  if (d <= AVISO_DIAS) return { clave: 'porvencer', badge: 'badge--warn', texto: `Vence en ${d} ${d === 1 ? 'día' : 'días'}` };
  return { clave: 'activo', badge: 'badge--ok', texto: `Vence ${fechaBonita(s.vence).toLowerCase()} · ${d} días` };
};
const vinoHoy = s => s.asistencias.includes(isoDia());
const nombre1 = s => s.nombre.split(' ')[0];
const iniciales = s => s.nombre.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
const msgVence = s => {
  const d = diasPara(s.vence);
  return d < 0
    ? `Hola ${nombre1(s)} 💪 Te extrañamos en ${NEGOCIO}. Tu membresía venció el ${fechaBonita(s.vence).toLowerCase()}. Renuévala y sigue entrenando: mensual ${pesos(PLANES.mensual.precio)}, trimestral ${pesos(PLANES.trimestral.precio)}.`
    : `Hola ${nombre1(s)} 💪 Tu membresía de ${NEGOCIO} vence ${d === 0 ? 'hoy' : d === 1 ? 'mañana' : `en ${d} días`}. Renueva en recepción y no pierdas tu racha. ¡Te esperamos!`;
};

// ---------- Entrada ----------
const fe = $('[data-form-entrada]');
const buscar = q => {
  q = texto(q, 40).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (!q) return [];
  if (/^\d+$/.test(q)) return db.socios.filter(s => String(s.num) === q);
  return db.socios.filter(s => s.nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(q)).slice(0, 6);
};
const fichaSocio = s => {
  const e = estado(s);
  const puede = e.clave !== 'vencido';
  return `<article class="member card member--${e.clave}">
    <span class="avatar">${esc(iniciales(s))}</span>
    <div class="member-main"><strong>${esc(s.nombre)}</strong><span class="muted small">Socio #${s.num} · ${PLANES[s.plan].nombre}</span><span class="badge ${e.badge}">${e.texto}</span></div>
    <div class="member-actions">
      ${vinoHoy(s) ? '<span class="badge badge--brand"><i class="fa-solid fa-check"></i> Ya entró hoy</span>'
        : puede ? `<button type="button" class="btn btn--brand" data-entrar="${esc(s.id)}"><i class="fa-solid fa-door-open"></i> Registrar entrada</button>` : ''}
      ${e.clave !== 'activo' ? `<button type="button" class="btn${puede ? '' : ' btn--brand'}" data-renovar="${esc(s.id)}"><i class="fa-solid fa-rotate"></i> Renovar</button>` : ''}
    </div>
  </article>`;
};
fe.addEventListener('submit', e => {
  e.preventDefault();
  const r = buscar(fe.q.value);
  const caja = $('[data-resultado]');
  if (!texto(fe.q.value)) { caja.innerHTML = ''; return; }
  caja.innerHTML = r.length ? r.map(fichaSocio).join('')
    : `<div class="card empty"><i class="fa-solid fa-user-slash"></i>No encontré a «${esc(fe.q.value.trim())}».<br /><button type="button" class="btn btn--sm" data-visita>Cobrar visita de ${pesos(PLANES.visita.precio)}</button> <button type="button" class="btn btn--sm btn--brand" data-nuevo-aqui>Inscribirlo</button></div>`;
});
const registrarEntrada = s => {
  if (estado(s).clave === 'vencido' || vinoHoy(s)) return;
  s.asistencias.push(isoDia());
  guardar();
  todo();
  fe.requestSubmit();
  toast(`Bienvenido, ${nombre1(s)} 💪`);
};

// ---------- Socios ----------
const FILTROS = [['todos', 'Todos'], ['activo', 'Al corriente'], ['porvencer', 'Por vencer'], ['vencido', 'Vencidos']];
let filtro = 'todos';
$('[data-filtros]').addEventListener('click', e => { const b = e.target.closest('[data-f]'); if (b) { filtro = b.dataset.f; pintarSocios(); } });
$('[data-buscar]').addEventListener('input', () => pintarSocios());
const pintarSocios = () => {
  const est = db.socios.map(s => estado(s).clave);
  const semana = sumarDias(-6);
  $('[data-st="activos"]').textContent = est.filter(e => e !== 'vencido').length;
  $('[data-st="porvencer"]').textContent = est.filter(e => e === 'porvencer').length;
  $('[data-st="vencidos"]').textContent = est.filter(e => e === 'vencido').length;
  $('[data-st="semana"]').textContent = db.socios.filter(s => s.asistencias.some(a => a >= semana)).length;
  $('[data-filtros]').innerHTML = FILTROS.map(([f, n]) => `<button type="button" class="chip${f === filtro ? ' is-on' : ''}" data-f="${f}">${n}<span class="count">${f === 'todos' ? est.length : est.filter(e => e === f).length}</span></button>`).join('');
  const q = $('[data-buscar]').value.trim().toLowerCase();
  const lista = db.socios
    .filter(s => (filtro === 'todos' || estado(s).clave === filtro) && (!q || `${s.nombre} ${s.num}`.toLowerCase().includes(q)))
    .sort((a, b) => a.vence.localeCompare(b.vence));
  $('[data-socios]').innerHTML = lista.length ? lista.map(s => {
    const e = estado(s);
    return `<li class="card row-socio">
      <span class="avatar avatar--sm">${esc(iniciales(s))}</span>
      <div class="rs-main"><strong>${esc(s.nombre)}</strong><small class="muted">#${s.num} · ${PLANES[s.plan].nombre} · ${s.asistencias.length} ${s.asistencias.length === 1 ? 'visita' : 'visitas'}</small></div>
      <span class="badge ${e.badge}">${e.texto}</span>
      <div class="rs-actions">
        ${e.clave !== 'activo' && s.tel ? `<a class="btn btn--sm btn--wa" data-wa-socio="${esc(s.id)}" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp"></i> Avisar</a>` : ''}
        <button type="button" class="btn btn--sm" data-renovar="${esc(s.id)}">Renovar</button>
      </div>
    </li>`;
  }).join('') : '<li class="empty"><i class="fa-regular fa-face-smile"></i>No hay socios aquí.</li>';
  $$('[data-wa-socio]').forEach(a => { const s = porId(a.dataset.waSocio); a.href = wa(s.tel, msgVence(s)); });
};

// ---------- Planes (en inscribir y renovar) ----------
const pintarPlanes = (cont, elegido) => {
  cont.innerHTML = Object.entries(PLANES).filter(([k]) => k !== 'visita').map(([k, p]) => `
    <label><input type="radio" name="plan" value="${k}" ${k === elegido ? 'checked' : ''} /><span><b>${p.nombre}</b><small>${p.dias} días</small><em class="num">${pesos(p.precio)}</em></span></label>`).join('');
};
// La renovación empieza cuando vence (si sigue vigente) o hoy (si ya venció)
const nuevaFecha = (s, plan) => sumarDias(PLANES[plan].dias, new Date(Math.max(diasPara(s.vence), 0) * 864e5 + new Date(isoDia() + 'T12:00').getTime()));
const cobrar = (s, plan) => {
  db.pagos.push({ id: uid(), socio: s.id, plan, monto: PLANES[plan].precio, fecha: isoDia(), t: Date.now() });
};

// ---------- Renovar ----------
const fr = $('[data-form-renovar]');
let renovando = null;
const abrirRenovar = s => {
  renovando = s;
  $('[data-r-info]').textContent = `${s.nombre} · #${s.num} · ${estado(s).texto.toLowerCase()}`;
  pintarPlanes($('[data-planes="renovar"]'), s.plan);
  pintarNueva();
  abrir('renovar');
};
const pintarNueva = () => { $('[data-r-vence]').innerHTML = `Nuevo vencimiento: <strong>${fechaBonita(nuevaFecha(renovando, fr.plan.value))}</strong>`; };
fr.addEventListener('change', pintarNueva);
fr.addEventListener('submit', e => {
  e.preventDefault();
  const plan = PLANES[fr.plan.value] ? fr.plan.value : 'mensual';
  renovando.vence = nuevaFecha(renovando, plan);
  renovando.plan = plan;
  cobrar(renovando, plan);
  guardar();
  $('#renovar').close();
  todo();
  if (texto(fe.q.value)) fe.requestSubmit();
  toast(`${nombre1(renovando)} renovó · ${pesos(PLANES[plan].precio)}`);
});

// ---------- Inscribir ----------
const fn = $('[data-form-nuevo]');
const abrirNuevo = (nombre = '') => {
  fn.reset();
  fn.nombre.value = nombre;
  pintarPlanes($('[data-planes="nuevo"]'), 'mensual');
  $('.form-error', fn).hidden = true;
  abrir('nuevo');
};
$$('[data-nuevo]').forEach(b => b.addEventListener('click', () => abrirNuevo()));
fn.addEventListener('submit', e => {
  e.preventDefault();
  const err = $('.form-error', fn);
  const nombre = texto(fn.nombre.value, 50), tel = tel10(fn.tel.value);
  const problema = !nombre ? 'Escribe el nombre del socio.' : fn.tel.value.trim() && tel.length !== 10 ? 'El WhatsApp debe tener 10 dígitos.' : '';
  if (problema) { err.textContent = problema; err.hidden = false; return; }
  const plan = PLANES[fn.plan.value] ? fn.plan.value : 'mensual';
  const s = { id: uid(), num: db.siguiente++, nombre, tel, plan, vence: sumarDias(PLANES[plan].dias), asistencias: [isoDia()] };
  db.socios.push(s);
  cobrar(s, plan);
  guardar();
  $('#nuevo').close();
  todo();
  fe.q.value = String(s.num);
  fe.requestSubmit();
  toast(`${nombre1(s)} es el socio #${s.num}`);
});

// ---------- Clics en botones de socios ----------
document.addEventListener('click', e => {
  const en = e.target.closest('[data-entrar]');
  if (en) registrarEntrada(porId(en.dataset.entrar));
  const re = e.target.closest('[data-renovar]');
  if (re) abrirRenovar(porId(re.dataset.renovar));
  if (e.target.closest('[data-nuevo-aqui]')) abrirNuevo(/^\d+$/.test(fe.q.value.trim()) ? '' : texto(fe.q.value, 50));
  if (e.target.closest('[data-visita]')) {
    db.visitas.push({ monto: PLANES.visita.precio, fecha: isoDia(), t: Date.now() });
    guardar();
    todo();
    $('[data-resultado]').innerHTML = '';
    fe.reset();
    toast(`Visita cobrada · ${pesos(PLANES.visita.precio)}`);
  }
});

// ---------- Hoy y caja ----------
const pintarHoy = () => {
  const hoy = db.socios.filter(vinoHoy);
  $('[data-st="hoy"]').textContent = hoy.length;
  $('[data-hoy-lista]').innerHTML = hoy.length ? hoy.map(s => `<li class="card hoy-row"><span class="avatar avatar--sm">${esc(iniciales(s))}</span><span><strong>${esc(s.nombre)}</strong><small class="muted"> · #${s.num}</small></span><span class="badge ${estado(s).badge}">${estado(s).texto}</span></li>`).join('')
    : '<li class="empty">Nadie ha entrado todavía.</li>';
};
const pintarCaja = () => {
  const hoy = isoDia(), mes = hoy.slice(0, 7);
  const pagosHoy = db.pagos.filter(p => p.fecha === hoy), visitasHoy = db.visitas.filter(v => v.fecha === hoy);
  const sum = l => l.reduce((t, x) => t + x.monto, 0);
  $('[data-st="cajahoy"]').textContent = pesos(sum(pagosHoy) + sum(visitasHoy));
  $('[data-st="cajames"]').textContent = pesos(sum(db.pagos.filter(p => p.fecha.startsWith(mes))) + sum(db.visitas.filter(v => v.fecha.startsWith(mes))));
  $('[data-st="pagoshoy"]').textContent = pagosHoy.length;
  $('[data-st="visitas"]').textContent = visitasHoy.length;
  const filas = [
    ...db.pagos.map(p => ({ t: p.t, fecha: p.fecha, quien: porId(p.socio)?.nombre || 'Socio', que: `${PLANES[p.plan].nombre}`, monto: p.monto })),
    ...db.visitas.map(v => ({ t: v.t, fecha: v.fecha, quien: 'Visitante', que: 'Visita', monto: v.monto })),
  ].sort((a, b) => b.t - a.t).slice(0, 30);
  $('[data-pagos]').innerHTML = filas.map(f => `<li class="card pay-row"><span class="pay-date muted small">${fechaBonita(f.fecha)}</span><span><strong>${esc(f.quien)}</strong><small class="muted"> · ${f.que}</small></span><b class="num">${pesos(f.monto)}</b></li>`).join('');
};

// ---------- Todo junto ----------
function todo() { pintarHoy(); pintarSocios(); pintarCaja(); }
$('[data-hoy]').textContent = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
iniciarReinicio(CLAVE);
iniciarVistas();
todo();
