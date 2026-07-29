// netlify/functions/create-verification-session.js
// Recibe { conductor_id } desde la app. Crea una sesión de verificación de
// identidad en Stripe (Stripe Identity) y devuelve la URL donde el proveedor
// sube su ID y se toma una selfie. La clave secreta de Stripe vive solo aquí,
// nunca en el navegador ni en la app.

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const SUPABASE_URL = 'https://bwbytdevgxywwzglyiri.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }
  if (!STRIPE_SECRET_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'STRIPE_SECRET_KEY no configurada' }) };
  }

  try {
    const { conductor_id } = JSON.parse(event.body);
    if (!conductor_id) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Falta conductor_id' }) };
    }

    const params = new URLSearchParams();
    params.append('type', 'document');
    params.append('metadata[conductor_id]', conductor_id);
    // Cuando el proveedor termine (o cierre la ventana), Stripe lo puede
    // regresar a esta pantalla de tu app vía deep link.
    params.append('return_url', 'https://zendaapp.app/');

    const res = await fetch('https://api.stripe.com/v1/identity/verification_sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });
    const session = await res.json();

    if (!res.ok) {
      return { statusCode: 500, body: JSON.stringify({ error: session.error?.message || 'Error de Stripe' }) };
    }

    // Guarda el id de la sesión en el proveedor, para poder relacionarlo
    // cuando llegue la confirmación por webhook más adelante.
    if (SERVICE_KEY) {
      await fetch(`${SUPABASE_URL}/rest/v1/conductors?id=eq.${encodeURIComponent(conductor_id)}`, {
        method: 'PATCH',
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ stripe_verification_session_id: session.id, verification_status: 'pendiente' })
      });
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: session.url })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'No se pudo crear la verificación' }) };
  }
};
