# yalech · sistemas a la medida

Demos de sistemas a la medida de Yael González (@yalech). Cada uno es un negocio ficticio, vive en su carpeta y
funciona de verdad en el navegador: puedes vender, apartar, cobrar y mandar avisos por WhatsApp.

| Carpeta | Negocio | Lo que hace |
| --- | --- | --- |
| `inventario/` | Papelería | Punto de venta, existencias con aviso de agotado, corte del día |
| `pedidos/` | Pastelería | Pedidos con anticipo y saldo, entregas de la semana, aviso al cliente |
| `mobiliario/` | Renta de mobiliario | Cuánto queda libre cada día (no deja rentar de más), reservas con anticipo, ruta de entregas y recolecciones |
| `citas/` | Estética | Agenda sin choques de horario, ficha y gasto de cada cliente |
| `taller/` | Taller mecánico | Tablero de autos por etapa, cotización con IVA, autorización por WhatsApp, historial por placas |
| `gimnasio/` | Gimnasio | Entrada por número de socio, membresías por vencer, renovaciones, visitas y caja del día |

## Cómo funciona

- **Son demostraciones:** los datos se guardan solo en el navegador de quien las prueba (localStorage) y cada una
  tiene «Reiniciar demo». Las fechas de ejemplo se calculan a partir del día en que se abre la primera vez.
  La versión real para un cliente llevaría usuarios, contraseña y una base de datos en internet.
- **`comun.js`** tiene lo que comparten todos: guardar y limpiar datos (si lo guardado viene alterado, se usan los de
  ejemplo), fechas, pesos, WhatsApp, ventanas y secciones. **`base.css`** tiene la estructura; cada sistema cambia
  su color en `styles.css`.
- **`app.js`** de cada carpeta tiene los datos de ejemplo y lo propio del negocio (precios, planes, artículos…) al
  inicio del archivo.
- Todo lo que escribe el usuario pasa por `esc()` antes de mostrarse.

## Otros archivos

- `index.html` y `estilos.css` — portada con las demos (mismo estilo que el catálogo principal).
- `assets/cotizar.js` / `cotizar.css` — cotizador en 1 minuto. `assets/carrusel.js` / `carrusel.css` — señales del carrusel.
- `assets/plantillas/` — capturas de computadora y celular que usa la portada.
- `<carpeta>/assets/og.jpg` — imagen al compartir el enlace. Al publicar, pon su URL completa en `og:image`.
- `404.html` — página de error. `_headers` — encabezados de seguridad (Netlify o Cloudflare Pages).

El catálogo completo y el link en bio están en el repositorio `yalech-web-link-in-bio`. Los enlaces hacia allá usan
`https://yale42.github.io/yalech-web-link-in-bio/`: cámbialos por tu dominio cuando lo tengas.

Hecho a mano: HTML, CSS y JavaScript, sin herramientas de compilación. Para verlo, sirve la carpeta con
`python3 -m http.server` y abre `http://localhost:8000`.
