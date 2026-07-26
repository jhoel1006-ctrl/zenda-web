// netlify/functions/carwash-meta.js
// Sirve /carwash/:slug. Lee el carwash.html real (sin tocarlo), le inyecta
// meta tags Open Graph/Twitter con nombre y logo del proveedor de carwash,
// y devuelve el HTML completo.

const SUPABASE_URL = 'https://bwbytdevgxywwzglyiri.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ePnGY7Nr8fXx02Zmhy-nuw_rMfJN1GO';
const SITE_URL = 'https://zendaapp.app';
const FALLBACK_IMAGE = `${SITE_URL}/og-default.jpg`;

exports.handler = async (event) => {
  const slug = event.queryStringParameters && event.queryStringParameters.slug;

  const templateRes = await fetch(`${SITE_URL}/carwash.html`);
  let html = await templateRes.text();

  if (!slug) {
    return respond(html);
  }

  try {
    const url =
      `${SUPABASE_URL}/rest/v1/services?companies.carwash_slug=eq.${encodeURIComponent(slug)}` +
      `&type=eq.carwash&activo=eq.true` +
      `&select=*,companies!inner(id,carwash_business_name,carwash_logo_url)`;

    const res = await fetch(url, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    const services = await res.json();

    if (!services || !services.length) {
      return respond(html); // proveedor no existe: HTML genérico, la página mostrará "No se encontró"
    }

    const company = services[0].companies;
    const empresa = company.carwash_business_name || 'Carwash';
    const image = company.carwash_logo_url || FALLBACK_IMAGE;

    const title = `${empresa} — Carwash Móvil | Zenda`;
    const description = `${empresa} · Lavado y detailing móvil a domicilio. Standard, Advanced y Full Detailing — reserva en línea en Zenda.`;
    const pageUrl = `${SITE_URL}/carwash/${encodeURIComponent(slug)}`;

    html = injectMeta(html, { title, description, image, url: pageUrl });

    html = html.replace(
      '<h1 id="company-name">Carwash</h1>',
      `<h1 id="company-name">${escapeHtml(empresa)}</h1>`
    );

    return respond(html);
  } catch (e) {
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
