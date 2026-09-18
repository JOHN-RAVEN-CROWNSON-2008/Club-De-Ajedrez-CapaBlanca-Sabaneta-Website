// Supabase Edge Function: send-email
// Servidor server-side para despacho de correos transaccionales vía Resend API
// Mantiene las credenciales de API privadas como secrets de Supabase (Deno.env)

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface EmailRequest {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

serve(async (req: Request) => {
  // Manejo de preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método no permitido. Utilice POST.' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('RESEND_API_KEY');
    if (!apiKey) {
      console.warn('[send-email] Variable RESEND_API_KEY no configurada en el servidor');
      return new Response(
        JSON.stringify({
          error: 'Servicio de correo temporalmente no configurado en el servidor.',
          simulated: true,
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: EmailRequest = await req.json();
    const { to, subject, html, text, from } = body;

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: 'Campos obligatorios faltantes: to, subject, html.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fromEmail = from || Deno.env.get('RESEND_FROM_EMAIL') || 'notificaciones@ajedrezcapablanca.com';

    // Despacho a Resend API desde el servidor seguro
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text: text || html.replace(/<[^>]*>?/gm, ''),
      }),
    });

    const data = await resendResponse.json();

    if (!resendResponse.ok) {
      return new Response(
        JSON.stringify({ error: data.message || 'Fallo en proveedor Resend', details: data }),
        { status: resendResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error interno al procesar correo';
    console.error('[send-email error]', errorMsg);
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
