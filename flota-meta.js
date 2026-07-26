// netlify/functions/flota-meta.js
// Sirve /flota/:slug. Lee el flota.html real (sin tocarlo), le inyecta
// meta tags Open Graph/Twitter con nombre de la empresa, logo y cantidad
// de yates disponibles, y devuelve el HTML completo.

const SUPABASE_URL = 'https://bwbytdevgxywwzglyiri.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ePnGY7Nr8fXx02Zmhy-nuw_rMfJN1GO';
const SITE_URL = 'https://zendaapp.app';
// Misma imagen genérica que en bote-meta.js — súbela una sola vez a la raíz del sitio.
const FALLBACK_IMAGE = `${SITE_URL}/og-default.jpg`;

exports.handler = async (event) => {
  const slug = event.queryStringParameters && event.queryStringParameters.slug;

  const templateRes = await fetch(`${SITE_URL}/flota.html`);
  let html = await templateRes.text();

  if (!slug) {
    return respond(html);
  }

  try {
    const url =
      `${SUPABASE_URL}/rest/v1/services?companies.company_slug=eq.${encodeURIComponent(slug)}` +
      `&type=eq.yacht&activo=eq.true` +
      `&select=*,companies!inner(id,yacht_business_name,yacht_logo_url)`;

    const res = await fetch(url, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    const boats = await res.json();

    let empresa = null;
    let logo = null;
    let cantidad = 0;

    if (boats && boats.length) {
      empresa = boats[0].companies.yacht_business_name;
      logo = boats[0].companies.yacht_logo_url;
      cantidad = boats.length;
    } else {
      // Puede que la flota exista pero no tenga yates activos todavía — revisamos companies directo
      const companyRes = await fetch(
        `${SUPABASE_URL}/rest/v1/companies?company_slug=eq.${encodeURIComponent(slug)}&select=yacht_business_name,yacht_logo_url`,
        { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
      );
      const companies = await companyRes.json();
      if (!companies || !companies.length) {
        return respond(html); // flota no existe: HTML genérico, la página mostrará "No se encontró"
      }
      empresa = companies[0].yacht_business_name;
      logo = companies[0].yacht_logo_url;
    }

    empresa = empresa || 'Flota';
    const image = logo || FALLBACK_IMAGE;
    const title = `${empresa} — Flota de Yates | Zenda`;
    const description =
      cantidad > 0
        ? `${empresa} · ${cantidad} ${cantidad === 1 ? 'yate disponible' : 'yates disponibles'} en Zenda.`
        : `Reserva yates con ${empresa} en Zenda.`;
    const pageUrl = `${SITE_URL}/flota/${encodeURIComponent(slug)}`;

    html = injectMeta(html, { title, description, image, url: pageUrl });

    html = html.replace(
      '<h1 id="company-name">Flota</h1>',
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
