// netlify/functions/bote-meta.js
// Sirve /bote/:slug. Lee el bote.html real (sin tocarlo), le inyecta
// meta tags Open Graph/Twitter con los datos del yate desde Supabase,
// y devuelve el HTML completo. El resto de la página (calendario,
// reserva, etc.) sigue funcionando igual, con el JS del lado del cliente.

const SUPABASE_URL = 'https://bwbytdevgxywwzglyiri.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ePnGY7Nr8fXx02Zmhy-nuw_rMfJN1GO';
const SITE_URL = 'https://zendaapp.app';
// Sube una imagen genérica de Zenda (1200x630px recomendado) a la raíz del sitio
// con este nombre exacto, para cuando un bote no tenga fotos cargadas todavía.
const FALLBACK_IMAGE = `${SITE_URL}/og-default.jpg`;

exports.handler = async (event) => {
  const slug = event.queryStringParameters && event.queryStringParameters.slug;

  // El HTML base (bote.html) no se toca ni se duplica: se lee tal cual está publicado.
  const templateRes = await fetch(`${SITE_URL}/bote.html`);
  let html = await templateRes.text();

  if (!slug) {
    return respond(html);
  }

  try {
    const url =
      `${SUPABASE_URL}/rest/v1/services?slug=eq.${encodeURIComponent(slug)}` +
      `&type=eq.yacht&activo=eq.true` +
      `&select=*,companies(yacht_business_name,yacht_logo_url,company_slug)`;

    const res = await fetch(url, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    const boats = await res.json();

    if (!boats || !boats.length) {
      // No existe ese bote: se sirve el HTML genérico, la página mostrará "No se encontró"
      return respond(html);
    }

    const b = boats[0];
    const a = b.atributos_json || {};
    const nombreBote = a.nombre_bote || b.nombre;
    const empresa = (b.companies && b.companies.yacht_business_name) || 'Zenda';
    const foto = (a.fotos && a.fotos[0]) || FALLBACK_IMAGE;

    const title = `${nombreBote} — Zenda Yates`;

    const detalles = [];
    if (a.capacidad) detalles.push(`${a.capacidad} personas`);
    if (a.marina) detalles.push(a.marina);
    if (b.precio_base) detalles.push(`desde $${b.precio_base}/hora`);
    const description = detalles.length
      ? `${empresa} · ${detalles.join(' · ')}`
      : `Reserva este yate con ${empresa} en Zenda.`;

    const pageUrl = `${SITE_URL}/bote/${encodeURIComponent(slug)}`;

    html = injectMeta(html, { title, description, image: foto, url: pageUrl });

    // Bonus para SEO: el nombre del bote queda en el HTML crudo desde el servidor,
    // no solo después de que corra el JS del cliente.
    html = html.replace(
      '<h1 id="boat-name"></h1>',
      `<h1 id="boat-name">${escapeHtml(nombreBote)}</h1>`
    );

    return respond(html);
  } catch (e) {
    // Si algo falla (Supabase caído, etc.), se sirve el HTML normal sin bloquear la página.
    return respond(html);
  }
};

function injectMeta(html, { title, description, image, url }) {
  html = html.replace(/<title>.*?<\/title>/, `<title>${escapeHtml(title)}</title>`);

  const metaTags = `
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${image}">
  <meta property="og:url" content="${url}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${image}">
  <meta name="description" content="${escapeHtml(description)}">
`;

  return html.replace('</head>', `${metaTags}</head>`);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function respond(html) {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
    body: html
  };
}
