// netlify/functions/flota-meta.js
export default async (request, context) => {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug") || url.pathname.split("/").pop();

  let business = {
    name: "Fleet Management",
    description: "Manage your entire fleet, maintenance and bookings in one place. Zenda app.",
    image: "https://zenda-web.netlify.app/logo.png"
  };

  const html = await fetch(`${url.origin}/flota.html`).then(r => r.text());
  
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
  path: "/flota/:slug"
};
