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

## Al usar un ejemplo con un cliente real

1. Copia la carpeta del ejemplo a un repositorio nuevo, junto con lo que use de `assets/`.
2. Borra lo que solo sirve para mostrar el ejemplo (la barra y el script traen un comentario que lo indica):
   - el bloque `<div class="demo-bar">` del inicio del `<body>` (barra «Ejemplo funcional · Reiniciar demo»);
   - la línea `<script src="…/assets/muestra.js…">` y el `<link>` a `muestra.css` del `<head>`. Sin ellas, los botones de
     WhatsApp, llamar y correo vuelven a abrir de verdad.
3. Deja `assets/errores.js`: hace que los errores de los formularios se vean igual en todos lados (el campo se marca en
   rojo, el cursor salta a él, los lectores de pantalla anuncian el aviso y se quita en cuanto la persona lo corrige).
4. Cambia los datos del negocio: WhatsApp, teléfonos, correo, dirección y horario. Las etiquetas `og:` de la vista previa
   necesitan la dirección completa del sitio (`https://…/assets/og.jpg`).
5. Si agregas íconos o tipografías, corre los programas de `assets/iconos/` y `assets/fuentes/` (abajo).

## Archivos compartidos (iguales en los 7 repos)

- `assets/muestra.js` y `muestra.css` — modo muestra: en vez de abrir WhatsApp, llamar o mandar correo al número de prueba,
  enseña lo que pasaría de verdad y ofrece «Quiero uno así». También acomoda los encabezados fijos debajo de la barra de
  ejemplo. Se configura en la etiqueta `<script>` de cada ejemplo (`data-servicio`, `data-ejemplo`, `data-para`).
- `assets/errores.js` — mismo comportamiento de errores en todos los formularios (ver el paso 3).
- `assets/iconos/actualizar.py` — recorta Font Awesome a los íconos que usa este repo (de unos 400 KB a menos de 15 KB).
  Córrelo si agregas un ícono y sale un cuadrito vacío; las instrucciones están al inicio del archivo.
- `assets/fuentes/actualizar.py` — sirve las tipografías de Google desde este mismo sitio y precarga las del texto, para que
  la página no brinque al cambiar de letra. Córrelo si una página nueva trae un `<link>` a `fonts.googleapis.com`.

## Otros archivos

- `index.html` y `estilos.css` — portada con las demos (mismo estilo que el catálogo principal).
- `assets/cotizar.js` / `cotizar.css` — cotizador en 1 minuto. `assets/carrusel.js` / `carrusel.css` — señales del carrusel.
- `assets/plantillas/` — capturas de computadora y celular que usa la portada.
- `<carpeta>/assets/og.jpg` — imagen al compartir el enlace. Al publicar, pon su URL completa en `og:image`.
- `404.html` — página de error. `_headers` — encabezados de seguridad (Netlify o Cloudflare Pages).

El catálogo completo y el link en bio están en el repositorio `yalech-web-link-in-bio`. Los enlaces hacia allá son
relativos (`../yalech-web-link-in-bio/`): funcionan igual en tu compu y en GitHub Pages mientras todos los repos vivan bajo
la misma dirección. Solo `404.html` usa la dirección completa, porque se muestra desde cualquier ruta.

Hecho a mano: HTML, CSS y JavaScript, sin herramientas de compilación. Para verlo, sirve la carpeta con
`python3 -m http.server` y abre `http://localhost:8000`.
