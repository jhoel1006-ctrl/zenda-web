// netlify/functions/get-provider-contact.js
// Recibe ?provider_id=... y devuelve SOLO { phone, full_name } de ESE proveedor,
// usando la clave secreta del servidor. El navegador ya no puede usar la clave
// pública para consultar la tabla conductors directamente (donde también viven
// email, government_id, push_token, etc. de TODOS los proveedores).

const SUPABASE_URL = 'https://bwbytdevgxywwzglyiri.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  if (!SERVICE_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'SUPABASE_SERVICE_KEY no configurada' }) };
  }

  const providerId = event.queryStringParameters && event.queryStringParameters.provider_id;
  if (!providerId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Falta provider_id' }) };
  }

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/conductors?id=eq.${encodeURIComponent(providerId)}&select=phone,full_name`,
      { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
    );
    const data = await res.json();
    const conductor = data && data[0];

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: (conductor && conductor.phone) || null,
        full_name: (conductor && conductor.full_name) || null
      })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'No se pudo consultar' }) };
  }
};
