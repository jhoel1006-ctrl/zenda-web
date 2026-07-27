// netlify/functions/send-push.js
// Recibe una solicitud de push desde nuestras propias páginas (mismo dominio,
// sin problema de CORS) y la reenvía al servicio de Expo desde el servidor.
// El navegador NUNCA llama a exp.host directamente — por eso fallaba antes.

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const payload = JSON.parse(event.body);

    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.text();

    return {
      statusCode: res.status,
      headers: { 'Content-Type': 'application/json' },
      body: data
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'No se pudo enviar la notificación' })
    };
  }
};
