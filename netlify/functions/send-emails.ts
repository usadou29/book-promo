// Types inline (pas besoin de @netlify/functions en dev)
type HandlerEvent = { httpMethod: string; body: string | null };
type HandlerResponse = { statusCode: number; headers: Record<string, string>; body: string };
type Handler = (event: HandlerEvent) => Promise<HandlerResponse>;

interface Recipient {
  email: string;
  contact_id: string;
}

interface RequestBody {
  campaign_id: string;
  brevo_api_key: string;
  sender_name: string;
  sender_email: string;
  subject: string;
  html_content: string;
  recipients: Recipient[];
}

interface SendResult {
  email: string;
  contact_id: string;
  status: 'sent' | 'failed';
  error?: string;
}

/**
 * Netlify Function: envoie un batch d'emails via l'API Brevo (transactional).
 * Chaque email est envoyé individuellement pour tracker le statut par contact.
 * Inclut un délai de 200ms entre chaque envoi pour respecter les rate limits.
 */
const handler: Handler = async (event: HandlerEvent) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  let body: RequestBody;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid JSON body' }),
    };
  }

  const { brevo_api_key, sender_name, sender_email, subject, html_content, recipients } = body;

  if (!brevo_api_key || !sender_email || !subject || !html_content || !recipients?.length) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing required fields' }),
    };
  }

  const results: SendResult[] = [];

  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i];

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': brevo_api_key,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: {
            name: sender_name,
            email: sender_email,
          },
          to: [{ email: recipient.email }],
          subject: subject,
          htmlContent: html_content,
        }),
      });

      if (response.ok) {
        results.push({
          email: recipient.email,
          contact_id: recipient.contact_id,
          status: 'sent',
        });
      } else {
        const errData = await response.text();
        results.push({
          email: recipient.email,
          contact_id: recipient.contact_id,
          status: 'failed',
          error: `Brevo ${response.status}: ${errData}`,
        });
      }
    } catch (err) {
      results.push({
        email: recipient.email,
        contact_id: recipient.contact_id,
        status: 'failed',
        error: err instanceof Error ? err.message : 'Unknown fetch error',
      });
    }

    // Pause 200ms entre chaque envoi (rate limiting)
    if (i < recipients.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ results }),
  };
};

export { handler };
