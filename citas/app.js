// Estética Lumi · citas y clientes (ejemplo funcional). Herramientas comunes en ../comun.js.
const CLAVE = 'demo-citas-v1';
const NEGOCIO = 'Estética Lumi';
const ABRE = 9 * 60; // 9:00
const CIERRA = 20 * 60; // 20:00
const PASO = 30; // minutos
const SERVICIOS = {
  corte: { nombre: 'Corte dama', precio: 350, min: 60 },
  caballero: { nombre: 'Corte caballero', precio: 200, min: 30 },
  tinte: { nombre: 'Tinte', precio: 900, min: 120 },
  peinado: { nombre: 'Peinado', precio: 400, min: 60 },
  manicure: { nombre: 'Manicure', precio: 250, min: 60 },
  acrilicas: { nombre: 'Uñas acrílicas', precio: 550, min: 90 },
  pedicure: { nombre: 'Pedicure', precio: 300, min: 60 },
};
const ESTADOS = { agendada: ['Por confirmar', 'badge--warn'], confirmada: ['Confirmada', 'badge--brand'], atendida: ['Atendida', 'badge--ok'], cancelada: ['Cancelada', 'badge--bad'] };
const aMin = hhmm => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const aHora = min => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`;

// ---------- Datos de ejemplo (fechas relativas a hoy) ----------
const semilla = () => {
  const clientes = [
    ['Sofía Martínez', '5500000201', 'Prefiere tonos cobrizos.'], ['Valeria Gómez', '5500000202', ''], ['Fernanda Cruz', '5500000203', 'Alergia al amoniaco: usar tinte sin amoniaco.'],
    ['Andrés Flores', '5500000204', ''], ['Camila Reyes', '5500000205', 'Siempre con Karla.'], ['Paola Herrera', '5500000206', ''],
    ['Diego Navarro', '5500000207', ''], ['Regina Ortiz', '5500000208', 'Uñas cortas, colores nude.'],
  ].map(([nombre, tel, notas], i) => ({ id: 'c' + i, nombre, tel, notas }));
  const c = (i, serv, dias, hora, estado) => ({ id: uid(), clienteId: 'c' + i, servicio: serv, fecha: sumarDias(dias), hora, estado });
  return {
    clientes,
    citas: [
      c(0, 'tinte', -30, '11:00', 'atendida'), c(0, 'corte', -9, '12:00', 'atendida'), c(2, 'tinte', -20, '10:00', 'atendida'), c(4, 'acrilicas', -14, '16:00', 'atendida'),
      c(4, 'manicure', -3, '17:00', 'atendida'), c(7, 'manicure', -7, '13:00', 'atendida'), c(3, 'caballero', -12, '18:00', 'atendida'), c(1, 'peinado', -2, '10:00', 'cancelada'),
      c(1, 'corte', 0, '10:00', 'confirmada'), c(5, 'manicure', 0, '11:30', 'confirmada'), c(2, 'tinte', 0, '13:00', 'agendada'), c(6, 'caballero', 0, '17:00', 'agendada'), c(7, 'acrilicas', 0, '18:00', 'confirmada'),
      c(0, 'peinado', 1, '9:30', 'agendada'), c(4, 'pedicure', 1, '12:00', 'agendada'), c(3, 'caballero', 2, '19:00', 'agendada'), c(5, 'corte', 3, '16:00', 'agendada'),
    ],
  };
};
const limpiar = d => {
  if (!d || !Array.isArray(d.clientes) || !Array.isArray(d.citas)) return null;
  const clientes = d.clientes.filter(x => x && typeof x.id === 'string').slice(0, 2000).map(x => ({ id: texto(x.id, 30), nombre: texto(x.nombre, 50) || 'Cliente', tel: tel10(x.tel), notas: texto(x.notas, 300) }));
  const ids = new Set(clientes.map(x => x.id));
  const citas = d.citas.filter(x => x && ids.has(x.clienteId) && SERVICIOS[x.servicio] && esFecha(x.fecha) && esHora(x.hora)).slice(-5000)
    .map(x => ({ id: texto(x.id, 30), clienteId: x.clienteId, servicio: x.servicio, fecha: x.fecha, hora: x.hora, estado: ESTADOS[x.estado] ? x.estado : 'agendada' }));
  return { clientes, citas };
};

let db = cargar(CLAVE, semilla, limpiar);
const guardar = () => guardarEn(CLAVE, db);
const cliente = id => db.clientes.find(x => x.id === id);
const activas = () => db.citas.filter(x => x.estado !== 'cancelada');
const fin = ci => aMin(ci.hora) + SERVICIOS[ci.servicio].min;
// ¿Choca con otra cita de ese día? (una persona atiende a la vez en este ejemplo)
const choca = (fecha, inicio, dur, ignorar) => activas().some(x => x.id !== ignorar && x.fecha === fecha && inicio < fin(x) && aMin(x.hora) < inicio + dur);

// ---------- Agenda ----------
let dia = isoDia();
const pintarDias = () => {
  $('[data-dias]').innerHTML = Array.from({ length: 7 }, (_, i) => {
    const f = sumarDias(i);
    const n = activas().filter(x => x.fecha === f).length;
    const d = new Date(f + 'T12:00');
    return `<button type="button" class="chip day-chip${f === dia ? ' is-on' : ''}" data-dia="${f}">
      <small>${i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : d.toLocaleDateString('es-MX', { weekday: 'short' }).replace('.', '')}</small><b>${d.getDate()}</b><span>${n ? n + (n === 1 ? ' cita' : ' citas') : 'libre'}</span></button>`;
  }).join('');
};
$('[data-dias]').addEventListener('click', e => { const b = e.target.closest('[data-dia]'); if (b) { dia = b.dataset.dia; pintarAgenda(); } });

const pintarAgenda = () => {
  const hoy = isoDia();
  const deHoy = activas().filter(x => x.fecha === hoy);
  $('[data-st="hoy"]').textContent = deHoy.length;
  $('[data-st="ingreso"]').textContent = pesos(deHoy.reduce((s, x) => s + SERVICIOS[x.servicio].precio, 0));
  $('[data-st="confirmar"]').textContent = db.citas.filter(x => x.estado === 'agendada' && x.fecha >= hoy).length;
  $('[data-st="clientes"]').textContent = db.clientes.length;
  pintarDias();
  const d = new Date(dia + 'T12:00');
  $('[data-dia-titulo]').textContent = d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  const citas = activas().filter(x => x.fecha === dia).sort((a, b) => aMin(a.hora) - aMin(b.hora));
  const ahora = new Date().getHours() * 60 + new Date().getMinutes();
  let html = '';
  for (let t = ABRE; t < CIERRA;) {
    const ci = citas.find(x => aMin(x.hora) === t) || citas.find(x => aMin(x.hora) < t && fin(x) > t);
    if (ci && aMin(ci.hora) <= t) {
      const s = SERVICIOS[ci.servicio];
      const cl = cliente(ci.clienteId);
      const [nom, badge] = ESTADOS[ci.estado];
      html += `<li class="appt is-${ci.estado}" style="--rows:${Math.max(s.min / PASO, 1)}">
        <time class="num">${horaBonita(ci.hora)}<small>${horaBonita(aHora(fin(ci)))}</small></time>
        <div class="appt-body">
          <div class="appt-main"><button type="button" class="appt-name" data-ficha="${esc(cl.id)}">${esc(cl.nombre)}</button><span class="badge ${badge}">${nom}</span></div>
          <p class="muted small">${s.nombre} · ${s.min} min · ${pesos(s.precio)}</p>
          ${ci.estado === 'atendida' ? '' : `<div class="appt-actions">
            ${ci.estado === 'agendada' ? `<button type="button" class="btn btn--sm" data-confirmar="${esc(ci.id)}"><i class="fa-solid fa-check"></i> Confirmar</button>` : ''}
            <button type="button" class="btn btn--sm btn--brand" data-atendida="${esc(ci.id)}">Atendida</button>
            ${cl.tel ? `<a class="btn btn--sm btn--wa" target="_blank" rel="noopener" href="${esc(wa(cl.tel, recordatorio(ci)))}"><i class="fa-brands fa-whatsapp"></i> Recordar</a>` : ''}
            <button type="button" class="icon-btn" data-cancelar="${esc(ci.id)}" aria-label="Cancelar cita"><i class="fa-solid fa-xmark"></i></button>
          </div>`}
        </div>
      </li>`;
      t = fin(ci);
      continue;
    }
    const pasado = dia === isoDia() && t < ahora;
    html += `<li class="free${pasado ? ' is-past' : ''}"><time class="num">${horaBonita(aHora(t))}</time>${pasado ? '<span class="muted small">—</span>' : `<button type="button" class="free-btn" data-libre="${aHora(t)}"><i class="fa-solid fa-plus"></i> Libre</button>`}</li>`;
    t += PASO;
  }
  $('[data-slots]').innerHTML = html;
};
const recordatorio = ci => {
  const cl = cliente(ci.clienteId);
  return `Hola ${cl.nombre.split(' ')[0]} 👋 Te recordamos tu cita de ${SERVICIOS[ci.servicio].nombre.toLowerCase()} en ${NEGOCIO}: ${fechaBonita(ci.fecha).toLowerCase()} a las ${horaBonita(ci.hora)}. ¿Nos confirmas? 💇‍♀️`;
};
$('[data-slots]').addEventListener('click', e => {
  const libre = e.target.closest('[data-libre]');
  const conf = e.target.closest('[data-confirmar]');
  const at = e.target.closest('[data-atendida]');
  const can = e.target.closest('[data-cancelar]');
  const fi = e.target.closest('[data-ficha]');
  const ci = id => db.citas.find(x => x.id === id);
  if (libre) abrirCita({ fecha: dia, hora: libre.dataset.libre });
  if (conf) { ci(conf.dataset.confirmar).estado = 'confirmada'; guardar(); todo(); toast('Cita confirmada'); }
  if (at) { ci(at.dataset.atendida).estado = 'atendida'; guardar(); todo(); toast('Listo · quedó en su historial'); }
  if (can && confirm('¿Cancelar esta cita?')) { ci(can.dataset.cancelar).estado = 'cancelada'; guardar(); todo(); toast('Cita cancelada · el horario quedó libre'); }
  if (fi) abrirFicha(fi.dataset.ficha);
});

// ---------- Nueva cita ----------
const fcita = $('[data-form-cita]');
$('[data-sel-servicio]').innerHTML = Object.entries(SERVICIOS).map(([id, s]) => `<option value="${id}">${s.nombre} · ${s.min} min · ${pesos(s.precio)}</option>`).join('');
const pintarHoras = () => {
  const f = fcita.fecha.value;
  const dur = SERVICIOS[fcita.servicio.value]?.min || 60;
  const previa = fcita.hora.value;
  const ahora = new Date().getHours() * 60 + new Date().getMinutes();
  let opts = '';
  for (let t = ABRE; t + dur <= CIERRA; t += PASO) {
    const ocupado = choca(f, t, dur) || (f === isoDia() && t <= ahora);
    if (!ocupado) opts += `<option value="${aHora(t)}">${horaBonita(aHora(t))}</option>`;
  }
  $('[data-sel-hora]').innerHTML = opts || '<option value="">Sin horarios libres</option>';
  if (previa && [...fcita.hora.options].some(o => o.value === previa)) fcita.hora.value = previa;
  const s = SERVICIOS[fcita.servicio.value];
  $('[data-cita-resumen]').textContent = fcita.hora.value ? `${s.nombre}: de ${horaBonita(fcita.hora.value)} a ${horaBonita(aHora(aMin(fcita.hora.value) + s.min))}` : 'Ese día ya no hay espacio para este servicio.';
};
const abrirCita = ({ fecha = dia, hora = '', clienteId = '' } = {}) => {
  fcita.reset();
  $('[data-sel-cliente]').innerHTML = '<option value="">Elige un cliente…</option><option value="__nuevo">+ Cliente nuevo</option>'
    + db.clientes.slice().sort((a, b) => a.nombre.localeCompare(b.nombre)).map(x => `<option value="${esc(x.id)}">${esc(x.nombre)}</option>`).join('');
  fcita.cliente.value = clienteId;
  $('[data-cliente-nuevo]').hidden = true;
  fcita.fecha.value = fecha < isoDia() ? isoDia() : fecha;
  fcita.fecha.min = isoDia();
  fcita.hora.innerHTML = hora ? `<option value="${hora}">${horaBonita(hora)}</option>` : '';
  fcita.hora.value = hora;
  pintarHoras();
  $('.form-error', fcita).hidden = true;
  abrir('cita');
};
$$('[data-nueva-cita]').forEach(b => b.addEventListener('click', () => abrirCita()));
fcita.addEventListener('change', e => {
  if (e.target.name === 'cliente') $('[data-cliente-nuevo]').hidden = fcita.cliente.value !== '__nuevo';
  if (['fecha', 'servicio'].includes(e.target.name)) pintarHoras();
  if (e.target.name === 'hora') pintarHoras();
});
fcita.addEventListener('submit', e => {
  e.preventDefault();
  const err = $('.form-error', fcita);
  const nuevo = fcita.cliente.value === '__nuevo';
  const s = SERVICIOS[fcita.servicio.value];
  const f = fcita.fecha.value;
  const h = fcita.hora.value;
  const tel = tel10(fcita.tel.value);
  const problema = !fcita.cliente.value ? 'Elige el cliente.'
    : nuevo && !texto(fcita.nombre.value) ? 'Escribe el nombre del cliente nuevo.'
    : nuevo && fcita.tel.value.trim() && tel.length !== 10 ? 'El WhatsApp debe tener 10 dígitos.'
    : !s ? 'Elige el servicio.'
    : !esFecha(f) || f < isoDia() ? 'Elige un día de hoy en adelante.'
    : !esHora(h) ? 'Ese día ya no hay horarios libres para este servicio.'
    : choca(f, aMin(h), s.min) ? 'Ese horario se cruza con otra cita.' : '';
  if (problema) { err.textContent = problema; err.hidden = false; return fcita.querySelector(`[name="${([['Elige el cliente', 'cliente'], ['nombre del cliente nuevo', 'nombre'], ['WhatsApp', 'tel'], ['Elige el servicio', 'servicio'], ['Elige un día', 'fecha']].find(([t]) => problema.includes(t)) || [, 'hora'])[1]}"]`)?.focus(); }
  let cid = fcita.cliente.value;
  if (nuevo) {
    cid = uid();
    db.clientes.push({ id: cid, nombre: texto(fcita.nombre.value, 50), tel, notas: '' });
  }
  db.citas.push({ id: uid(), clienteId: cid, servicio: fcita.servicio.value, fecha: f, hora: h, estado: 'agendada' });
  guardar();
  $('#cita').close();
  $('#ficha').open && $('#ficha').close();
  dia = f;
  todo();
  toast(`Cita agendada · ${fechaBonita(f)} ${horaBonita(h)}`);
});

// ---------- Clientes ----------
const historial = id => db.citas.filter(x => x.clienteId === id && x.estado === 'atendida').sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora));
const gasto = id => historial(id).reduce((s, x) => s + SERVICIOS[x.servicio].precio, 0);
const iniciales = n => n.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
$('[data-buscar]').addEventListener('input', () => pintarClientes());
const pintarClientes = () => {
  const q = $('[data-buscar]').value.trim().toLowerCase();
  const lista = db.clientes.filter(x => !q || x.nombre.toLowerCase().includes(q) || x.tel.includes(q.replace(/\D/g, '') || '@'))
    .sort((a, b) => gasto(b.id) - gasto(a.id) || a.nombre.localeCompare(b.nombre));
  $('[data-clientes]').innerHTML = lista.length ? lista.map(x => {
    const h = historial(x.id);
    const prox = activas().filter(c => c.clienteId === x.id && c.fecha >= isoDia() && c.estado !== 'atendida').sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))[0];
    return `<li><button type="button" class="card client" data-ficha="${esc(x.id)}">
      <span class="avatar">${esc(iniciales(x.nombre))}</span>
      <span class="client-main"><strong>${esc(x.nombre)}</strong><small>${h.length} ${h.length === 1 ? 'visita' : 'visitas'}${h[0] ? ' · última ' + fechaBonita(h[0].fecha).toLowerCase() : ''}</small>${prox ? `<small class="next"><i class="fa-regular fa-calendar"></i> ${fechaBonita(prox.fecha)} ${horaBonita(prox.hora)}</small>` : ''}</span>
      <b class="num">${pesos(gasto(x.id))}</b>
    </button></li>`;
  }).join('') : '<li class="empty"><i class="fa-regular fa-face-smile"></i>No encontramos a nadie con ese nombre.</li>';
};
$('[data-clientes]').addEventListener('click', e => { const b = e.target.closest('[data-ficha]'); if (b) abrirFicha(b.dataset.ficha); });

let enFicha = null;
const abrirFicha = id => {
  enFicha = cliente(id);
  if (!enFicha) return;
  const h = historial(id);
  $('[data-ficha-ini]').textContent = iniciales(enFicha.nombre);
  $('[data-ficha-nombre]').textContent = enFicha.nombre;
  $('[data-ficha-tel]').textContent = enFicha.tel ? enFicha.tel.replace(/(\d{2})(\d{4})(\d{4})/, '$1 $2 $3') : 'Sin WhatsApp';
  $('[data-ficha-visitas]').textContent = h.length;
  $('[data-ficha-gasto]').textContent = pesos(gasto(id));
  $('[data-ficha-ultima]').textContent = h[0] ? fechaBonita(h[0].fecha) : '—';
  $('[data-ficha-notas]').value = enFicha.notas;
  const prox = activas().filter(c => c.clienteId === id && c.fecha >= isoDia() && c.estado !== 'atendida').sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
  $('[data-ficha-proximas]').innerHTML = prox.length ? prox.map(c => `<li><span>${fechaBonita(c.fecha)} · ${horaBonita(c.hora)}</span><span>${SERVICIOS[c.servicio].nombre}</span><span class="badge ${ESTADOS[c.estado][1]}">${ESTADOS[c.estado][0]}</span></li>`).join('') : '<li class="muted small">Sin citas próximas.</li>';
  $('[data-ficha-historial]').innerHTML = h.length ? h.map(c => `<li><span>${fechaBonita(c.fecha)}</span><span>${SERVICIOS[c.servicio].nombre}</span><b class="num">${pesos(SERVICIOS[c.servicio].precio)}</b></li>`).join('') : '<li class="muted small">Todavía no tiene visitas.</li>';
  const link = $('[data-ficha-wa]');
  link.hidden = !enFicha.tel;
  link.href = wa(enFicha.tel, `Hola ${enFicha.nombre.split(' ')[0]} 👋 Te escribimos de ${NEGOCIO}.`);
  abrir('ficha');
};
$('[data-ficha-notas]').addEventListener('change', e => {
  enFicha.notas = texto(e.target.value, 300);
  guardar();
  toast('Notas guardadas');
});
$('[data-ficha-agendar]').addEventListener('click', () => { $('#ficha').close(); abrirCita({ clienteId: enFicha.id, fecha: isoDia() }); });

const fcli = $('[data-form-cliente]');
$('[data-nuevo-cliente]').addEventListener('click', () => { fcli.reset(); $('.form-error', fcli).hidden = true; abrir('cliente'); });
fcli.addEventListener('submit', e => {
  e.preventDefault();
  const nombre = texto(fcli.nombre.value, 50);
  const tel = tel10(fcli.tel.value);
  const err = $('.form-error', fcli);
  if (!nombre) { err.textContent = 'Escribe el nombre.'; err.hidden = false; return fcli.nombre.focus(); }
  if (fcli.tel.value.trim() && tel.length !== 10) { err.textContent = 'El WhatsApp debe tener 10 dígitos.'; err.hidden = false; return fcli.tel.focus(); }
  db.clientes.push({ id: uid(), nombre, tel, notas: texto(fcli.notas.value, 300) });
  guardar();
  $('#cliente').close();
  todo();
  toast('Cliente agregado');
});

// ---------- Todo junto ----------
function todo() { pintarAgenda(); pintarClientes(); }
$('[data-hoy]').textContent = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
iniciarReinicio(CLAVE);
iniciarVistas();
todo();
