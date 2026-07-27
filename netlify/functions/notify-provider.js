// netlify/functions/notify-provider.js
// Recibe { provider_id, title, body } desde el navegador.
// Busca el push_token del proveedor usando la clave SERVICE_ROLE (secreta,
// solo vive en el servidor vía variable de entorno) y le envía la notificación.
// El navegador NUNCA ve la clave secreta ni consulta la tabla conductors
// directamente — por eso esto es más seguro que como estaba antes.

const SUPABASE_URL = 'https://bwbytdevgxywwzglyiri.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  if (!SERVICE_KEY) {
    // Falta configurar la variable de entorno en Netlify — no revienta,
    // pero avisa claramente en el log para que se note rápido.
    return { statusCode: 500, body: JSON.stringify({ error: 'SUPABASE_SERVICE_KEY no configurada' }) };
  }

  try {
    const { provider_id, title, body } = JSON.parse(event.body);
    if (!provider_id || !title || !body) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Faltan datos' }) };
    }

    // Busca el push_token con la clave secreta — esto ya NO pasa por el navegador.
    const condRes = await fetch(
      `${SUPABASE_URL}/rest/v1/conductors?id=eq.${encodeURIComponent(provider_id)}&select=push_token`,
      { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
    );
    const conductores = await condRes.json();
    const pushToken = conductores && conductores[0] && conductores[0].push_token;

    if (!pushToken) {
      // No hay token guardado — no es un error, simplemente no hay a quién avisar.
      return { statusCode: 200, body: JSON.stringify({ sent: false, reason: 'sin push_token' }) };
    }

    const pushRes = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ to: pushToken, title, body, sound: 'default' })
    });
    const pushData = await pushRes.text();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sent: true, pushResponse: pushData })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'No se pudo notificar' }) };
  }
};
