# PAQUETE COMPLETO PARA SUBIR A NETLIFY

## Archivos incluidos (todos van a la RAÍZ del sitio en Netlify)

- `index.html` — portada (ya tiene sus etiquetas OG escritas directo en el HTML, no necesita función)
- `flota.html` — listado de yates de una flota
- `bote.html` — página de un yate individual
- `carwash.html` — página pública de carwash
- `limpieza.html` — página pública de limpieza
- `netlify/functions/bote-meta.js`
- `netlify/functions/flota-meta.js`
- `netlify/functions/carwash-meta.js`
- `netlify/functions/limpieza-meta.js`

Sube la carpeta `netlify/functions/` completa (con los 4 archivos .js adentro) tal cual, respetando esa estructura de carpetas — no los pongas sueltos en la raíz.

## PASO 1 — Reemplaza los 5 HTML existentes
Sube estos 5 archivos, reemplazando los que ya tienes en Netlify con el mismo nombre:
`index.html`, `flota.html`, `bote.html`, `carwash.html`, `limpieza.html`

## PASO 2 — Sube la carpeta de funciones
Sube `netlify/functions/` con sus 4 archivos, junto a los HTML (mismo nivel que `index.html`).

## PASO 3 — Edita tu archivo `_redirects`
Agrega estas 4 líneas, ANTES de cualquier regla más general que ya tengas para `/flota/*`, `/bote/*`, `/carwash/*` o `/limpieza/*`:

```
/bote/:slug      /.netlify/functions/bote-meta?slug=:slug      200
/flota/:slug     /.netlify/functions/flota-meta?slug=:slug     200
/carwash/:slug   /.netlify/functions/carwash-meta?slug=:slug   200
/limpieza/:slug  /.netlify/functions/limpieza-meta?slug=:slug  200
```

## PASO 4 — Imagen de respaldo (si no la subiste ya)
Sube una imagen a la raíz del sitio con el nombre exacto `og-default.jpg` (1200x630px recomendado, el logo de Zenda sobre fondo oscuro). Se usa cuando un proveedor no tiene foto/logo cargado todavía.

## PASO 5 — Probar
- Abre cada página directo en el navegador (`/flota/jhoelz`, `/bote/...`, `/carwash/gleamup`, `/limpieza/jhoel-zapata-limpieza`) — deben verse exactamente igual que antes, con la descripción de cada negocio visible debajo del nombre.
- Prueba con el debugger de Facebook: https://developers.facebook.com/tools/debug/ — pega cada uno de los 5 links (incluyendo la portada) y confirma que aparece foto, título y descripción.
- Comparte los links por WhatsApp a ti mismo para confirmar la tarjeta visualmente.

## Qué NO cambia
- El calendario, la reserva, el botón de WhatsApp, todo el flujo interactivo sigue funcionando igual — sigue siendo JS del lado del cliente.
- No se tocó Stripe, ni la app de React Native (Snack), ni ninguna tabla de Supabase.
- La app de React Native (Dashboards de proveedor) no se sube a Netlify — vive únicamente en Expo Snack, es un proyecto aparte.
