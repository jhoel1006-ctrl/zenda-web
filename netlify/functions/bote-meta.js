// netlify/functions/carwash-meta.js
export default async (request, context) => {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug") || url.pathname.split("/").pop();

  // Datos por defecto si no encuentra
  let business = {
    name: "Boat Rental",
description: "Private boat rentals in Miami. Captain included, book online.",
    image: "https://zenda-web.netlify.app/logo.png"
  };

  try {
    // Si tienes Supabase conectado, descomenta esto:
    // const res = await fetch(`https://TU_SUPABASE.supabase.co/rest/v1/businesses?slug=eq.${slug}`, {
    //   headers: { apikey: "TU_KEY", Authorization: "Bearer TU_KEY" }
    // });
    // const data = await res.json();
    // if(data[0]) business = data[0];
  } catch (e) {}

  const html = await fetch(`${url.origin}/carwash.html`).then(r => r.text());
  
  const withMeta = html
    .replace(/<title>.*<\/title>/, `<title>${business.name} | Zenda</title>`)
    .replace(/<meta property="og:title".*>/, `<meta property="og:title" content="${business.name}">`)
    .replace(/<meta name="description".*>/, `<meta name="description" content="${business.description}">`)
    .replace(/<meta property="og:description".*>/, `<meta property="og:description" content="${business.description}">`)
    .replace(/<meta property="og:image".*>/, `<meta property="og:image" content="${business.image}">`);

  return new Response(withMeta, {
    headers: { "Content-Type": "text/html" }
  });
};

export const config = {
  path: "/carwash/:slug"
};
