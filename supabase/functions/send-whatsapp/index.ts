// Supabase Edge Function: send-whatsapp
// Servidor server-side para despacho de mensajes vía WhatsApp Cloud API (Graph API)
// Mantiene los tokens de acceso y phone number IDs privados como secrets de Supabase

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface WhatsAppRequest {
  recipientPhone: string;
  messageText: string;
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

    const token = Deno.env.get('WHATSAPP_API_TOKEN');
    const phoneId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

    if (!token || !phoneId) {
      console.warn('[send-whatsapp] Variables WHATSAPP_API_TOKEN o WHATSAPP_PHONE_NUMBER_ID no configuradas');
      return new Response(
        JSON.stringify({
          error: 'Servicio de WhatsApp Cloud API no configurado en el servidor.',
          simulated: true,
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: WhatsAppRequest = await req.json();
    const { recipientPhone, messageText } = body;

    if (!recipientPhone || !messageText) {
      return new Response(
        JSON.stringify({ error: 'Campos obligatorios faltantes: recipientPhone, messageText.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanPhone = recipientPhone.replace(/[^0-9]/g, '');

    // Despacho a Meta Graph API desde el servidor seguro
    const graphResponse = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: cleanPhone,
        type: 'text',
        text: { body: messageText },
      }),
    });

    const data = await graphResponse.json();

    if (!graphResponse.ok) {
      return new Response(
        JSON.stringify({ error: data.error?.message || 'Fallo en WhatsApp Cloud API', details: data }),
        { status: graphResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error interno al procesar mensaje de WhatsApp';
    console.error('[send-whatsapp error]', errorMsg);
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
