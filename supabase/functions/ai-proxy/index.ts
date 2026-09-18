// Edge Function: ai-proxy
// Club Deportivo de Ajedrez Capablanca Sabaneta
// Proxy seguro multi-proveedor para MODO AI (Gemini, Anthropic, OpenAI, DeepSeek, Grok, Qwen, etc.)
// Las llaves API NUNCA se exponen al cliente: viven exclusivamente como secretos del servidor.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface AIProxyPayload {
  feature?: 'blog_writer' | 'moderation' | 'web_editor' | 'general';
  provider?: string;
  prompt: string;
  systemPrompt?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

Deno.serve(async (req) => {
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

    const payload: AIProxyPayload = await req.json();
    const {
      feature = 'general',
      provider = 'gemini',
      prompt,
      systemPrompt = 'Eres el asistente institucional de ajedrez del Club Deportivo de Ajedrez Capablanca Sabaneta. Responde con tono profesional, deportivo y pedagógico.',
      model,
      maxTokens = 1000,
      temperature = 0.7,
    } = payload;

    if (!prompt || typeof prompt !== 'string') {
      return new Response(
        JSON.stringify({ error: 'El campo "prompt" es obligatorio y debe ser texto.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedProvider = provider.toLowerCase();

    // Obtener la llave privada del proveedor desde las variables de entorno del servidor Deno
    const secretKeyNames = [
      `AI_KEY_${normalizedProvider.toUpperCase()}`,
      `${normalizedProvider.toUpperCase()}_API_KEY`,
    ];

    let apiKey = '';
    for (const keyName of secretKeyNames) {
      const val = Deno.env.get(keyName);
      if (val) {
        apiKey = val;
        break;
      }
    }

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: `No se ha configurado la llave secreta para el proveedor "${normalizedProvider}". Configure el secreto "AI_KEY_${normalizedProvider.toUpperCase()}" en Supabase Edge Functions.`,
          provider: normalizedProvider,
          secretRef: `AI_KEY_${normalizedProvider.toUpperCase()}`,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let generatedText = '';
    let usedModel = model || '';

    // =========================================================================
    // ADAPTADORES POR PROVEEDOR
    // =========================================================================

    if (normalizedProvider === 'gemini') {
      usedModel = model || 'gemini-2.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${usedModel}:generateContent?key=${apiKey}`;

      const geminiBody: Record<string, unknown> = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        },
      };

      if (systemPrompt) {
        geminiBody.systemInstruction = {
          parts: [{ text: systemPrompt }],
        };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiBody),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || `Error Gemini API (${response.status})`);
      }

      generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else if (normalizedProvider === 'anthropic') {
      usedModel = model || 'claude-3-5-haiku-20241022';
      const url = 'https://api.anthropic.com/v1/messages';

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: usedModel,
          system: systemPrompt,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: maxTokens,
          temperature,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || `Error Anthropic API (${response.status})`);
      }

      generatedText = data.content?.[0]?.text || '';
    } else if (
      normalizedProvider === 'openai' ||
      normalizedProvider === 'deepseek' ||
      normalizedProvider === 'grok' ||
      normalizedProvider === 'qwen' ||
      normalizedProvider === 'kimi' ||
      normalizedProvider === 'zai'
    ) {
      // Proveedores con API compatible con OpenAI Chat Completions
      let endpoint = 'https://api.openai.com/v1/chat/completions';
      if (normalizedProvider === 'deepseek') {
        endpoint = 'https://api.deepseek.com/chat/completions';
        usedModel = model || 'deepseek-chat';
      } else if (normalizedProvider === 'grok') {
        endpoint = 'https://api.x.ai/v1/chat/completions';
        usedModel = model || 'grok-beta';
      } else if (normalizedProvider === 'qwen') {
        endpoint = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
        usedModel = model || 'qwen-turbo';
      } else if (normalizedProvider === 'kimi') {
        endpoint = 'https://api.moonshot.cn/v1/chat/completions';
        usedModel = model || 'moonshot-v1-8k';
      } else if (normalizedProvider === 'zai') {
        endpoint = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
        usedModel = model || 'glm-4-flash';
      } else {
        usedModel = model || 'gpt-4o-mini';
      }

      const messages: Array<{ role: string; content: string }> = [];
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      messages.push({ role: 'user', content: prompt });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: usedModel,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || `Error ${normalizedProvider} API (${response.status})`);
      }

      generatedText = data.choices?.[0]?.message?.content || '';
    } else {
      throw new Error(`Proveedor de IA "${normalizedProvider}" no soportado actualmente.`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        text: generatedText.trim(),
        provider: normalizedProvider,
        model: usedModel,
        feature,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : 'Error desconocido al invocar proveedor de IA';
    console.error('Error en Edge Function ai-proxy:', errMessage);

    return new Response(
      JSON.stringify({ error: errMessage, success: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
