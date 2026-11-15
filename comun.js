// Herramientas que comparten los sistemas de ejemplo (inventario, pedidos y citas).
// Son demostraciones: los datos se guardan solo en el navegador de quien las prueba (localStorage).
// La versión real para un cliente llevaría usuarios, contraseña y una base de datos en internet.

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

// Todo lo que escribe el usuario pasa por esc() antes de mostrarse como HTML
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pesos = n => '$' + (Math.round(Number(n) * 100) / 100).toLocaleString('es-MX', { maximumFractionDigits: 2 });
const num = (v, min = 0, max = 1e7) => { const n = Number(v); return Number.isFinite(n) ? Math.min(Math.max(n, min), max) : min; };
const texto = (v, max = 80) => String(v ?? '').trim().slice(0, max);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// Fechas en hora local (no UTC)
const isoDia = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const sumarDias = (n, base = new Date()) => { const d = new Date(base); d.setDate(d.getDate() + n); return isoDia(d); };
const fechaBonita = iso => {
  if (iso === isoDia()) return 'Hoy';
  if (iso === sumarDias(1)) return 'Mañana';
  if (iso === sumarDias(-1)) return 'Ayer';
  return new Date(iso + 'T12:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' }).replace('.', '');
};
const horaBonita = hhmm => {
  const [h, m] = String(hhmm || '0:0').split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};
const esFecha = v => /^\d{4}-\d{2}-\d{2}$/.test(String(v));
const esHora = v => /^\d{1,2}:\d{2}$/.test(String(v));

// WhatsApp: tel de 10 dígitos (México)
const tel10 = t => String(t || '').replace(/\D/g, '').slice(-10);
const wa = (tel, msg) => `https://wa.me/${tel10(tel).length === 10 ? '52' + tel10(tel) : ''}?text=${encodeURIComponent(msg)}`;

// ---------- Guardado ----------
// cargar(clave, semilla, limpiar): si lo guardado falta o viene alterado, se usan los datos de ejemplo.
function cargar(clave, semilla, limpiar) {
  let datos = null;
  try { datos = limpiar(JSON.parse(localStorage.getItem(clave))); } catch { datos = null; }
  if (!datos) datos = semilla();
  guardarEn(clave, datos);
  return datos;
}
function guardarEn(clave, datos) { try { localStorage.setItem(clave, JSON.stringify(datos)); } catch {} }

// ---------- Avisos ----------
function toast(msg) {
  let t = $('.toast');
  if (!t) { t = Object.assign(document.createElement('div'), { className: 'toast' }); t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 2600);
}

// ---------- Ventanas (dialog) ----------
const abrir = id => { const d = document.getElementById(id); d.showModal(); return d; };
document.addEventListener('click', e => {
  if (e.target.matches('dialog.modal')) e.target.close(); // tocar fuera
  const c = e.target.closest('[data-cerrar]');
  if (c) c.closest('dialog').close();
});

// ---------- Secciones (menú lateral / de abajo) ----------
function iniciarVistas(alCambiar) {
  const vistas = $$('[data-vista]').map(v => v.dataset.vista);
  const ir = nombre => {
    if (!vistas.includes(nombre)) nombre = vistas[0];
    $$('[data-vista]').forEach(v => { v.hidden = v.dataset.vista !== nombre; });
    $$('[data-ir]').forEach(b => b.classList.toggle('is-on', b.dataset.ir === nombre));
    if (location.hash.slice(1) !== nombre) history.replaceState(null, '', '#' + nombre);
    scrollTo(0, 0);
    alCambiar?.(nombre);
  };
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-ir]');
    if (b) { e.preventDefault(); ir(b.dataset.ir); }
  });
  ir(location.hash.slice(1));
  return ir;
}

// ---------- Reiniciar la demostración ----------
function iniciarReinicio(clave) {
  $$('[data-reiniciar]').forEach(b => b.addEventListener('click', () => {
    if (!confirm('¿Borrar los cambios y volver a los datos de ejemplo?')) return;
    try { localStorage.removeItem(clave); } catch {}
    location.reload();
  }));
}
