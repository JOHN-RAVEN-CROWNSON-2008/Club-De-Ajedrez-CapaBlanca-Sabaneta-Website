-- ==============================================================================
-- MIGRACIÓN 02: FASE 2 DE PLATAFORMA
-- TABLAS ai_provider_settings Y content_blocks (MODO AI Y CMS DINÁMICO)
-- ==============================================================================

-- 1. TABLA: ai_provider_settings (Configuración de Proveedores de LLM)
CREATE TABLE IF NOT EXISTS public.ai_provider_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider TEXT NOT NULL CHECK (provider IN (
        'gemini', 'anthropic', 'openai', 'qwen', 'zai', 
        'deepseek', 'grok', 'xiaomi', 'kimi', 'tencent'
    )),
    enabled BOOLEAN NOT NULL DEFAULT false,
    default_model TEXT NOT NULL,
    secret_ref TEXT NOT NULL,
    usage_scope TEXT[] NOT NULL DEFAULT ARRAY['blog', 'moderacion', 'general'],
    monthly_token_budget INTEGER DEFAULT 100000,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_ai_provider UNIQUE (provider)
);

COMMENT ON TABLE public.ai_provider_settings IS 
'Configuración no sensible de proveedores de IA para el MODO AI del club. Las llaves API NUNCA se almacenan aquí, solo referencias a secretos de Supabase Edge Functions.';

ALTER TABLE public.ai_provider_settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para ai_provider_settings (Exclusivo Administrador)
DROP POLICY IF EXISTS "Admin gestiona ai_provider_settings" ON public.ai_provider_settings;
CREATE POLICY "Admin gestiona ai_provider_settings"
    ON public.ai_provider_settings
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 2. TABLA: content_blocks (Editor Dinámico de Contenido por Página)
CREATE TABLE IF NOT EXISTS public.content_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page TEXT NOT NULL CHECK (page IN ('home', 'club', 'programas', 'torneos', 'contacto', 'galeria')),
    section_key TEXT NOT NULL,
    value_type TEXT NOT NULL DEFAULT 'text' CHECK (value_type IN ('text', 'richtext', 'image', 'json')),
    value TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_page_section UNIQUE (page, section_key)
);

COMMENT ON TABLE public.content_blocks IS 
'Bloques de contenido editable para páginas públicas sin necesidad de migraciones de esquema continuas.';

ALTER TABLE public.content_blocks ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para content_blocks
-- Lectura pública para cualquier visitante o afiliado
DROP POLICY IF EXISTS "Lectura publica de content_blocks" ON public.content_blocks;
CREATE POLICY "Lectura publica de content_blocks"
    ON public.content_blocks
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Escritura y edición exclusiva para administradores
DROP POLICY IF EXISTS "Admin gestiona content_blocks" ON public.content_blocks;
CREATE POLICY "Admin gestiona content_blocks"
    ON public.content_blocks
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ==============================================================================
-- 3. SEMILLAS INICIALES (IDEMPOTENTES)
-- ==============================================================================

-- Semillas de Proveedores LLM
INSERT INTO public.ai_provider_settings (provider, enabled, default_model, secret_ref, usage_scope)
VALUES
    ('gemini', true, 'gemini-2.5-flash', 'AI_KEY_GEMINI', ARRAY['blog', 'moderacion', 'redaccion_web', 'general']),
    ('anthropic', false, 'claude-3-5-haiku-20241022', 'AI_KEY_ANTHROPIC', ARRAY['blog', 'redaccion_web']),
    ('openai', false, 'gpt-4o-mini', 'AI_KEY_OPENAI', ARRAY['blog', 'moderacion', 'general']),
    ('deepseek', false, 'deepseek-chat', 'AI_KEY_DEEPSEEK', ARRAY['blog', 'general']),
    ('grok', false, 'grok-beta', 'AI_KEY_GROK', ARRAY['blog', 'general']),
    ('qwen', false, 'qwen-turbo', 'AI_KEY_QWEN', ARRAY['blog']),
    ('kimi', false, 'moonshot-v1-8k', 'AI_KEY_KIMI', ARRAY['blog']),
    ('zai', false, 'glm-4-flash', 'AI_KEY_ZAI', ARRAY['blog']),
    ('tencent', false, 'hunyuan-lite', 'AI_KEY_TENCENT', ARRAY['blog']),
    ('xiaomi', false, 'miai-default', 'AI_KEY_XIAOMI', ARRAY['blog'])
ON CONFLICT (provider) DO NOTHING;

-- Semillas de Bloques de Contenido del Sitio
INSERT INTO public.content_blocks (page, section_key, value_type, value)
VALUES
    ('home', 'hero.badge', 'text', 'Club Oficial de Ajedrez Sabaneta · Aval Inder Res. 042'),
    ('home', 'hero.title', 'text', 'Pasión, Estrategia y Disciplina en Cada Movimiento'),
    ('home', 'hero.subtitle', 'text', 'Formamos campeones y fomentamos valores a través de la ciencia milenaria del ajedrez en el corazón de Sabaneta.'),
    ('home', 'callout.phrase', 'text', '"El ajedrez es algo más que un juego; es una diversión intelectual que tiene algo de arte y mucho de ciencia." — José Raúl Capablanca'),
    ('club', 'history.title', 'text', 'Más de una década cultivando el ajedrez en Sabaneta'),
    ('club', 'mision.text', 'text', 'Fomentar la práctica, formación y competencia del ajedrez en Sabaneta y Antioquia, brindando un espacio inclusivo, formativo y de alto rendimiento.'),
    ('club', 'vision.text', 'text', 'Consolidarnos como el club de ajedrez referente en el Valle de Aburrá por nuestra excelencia deportiva, pedagógica y humana.'),
    ('programas', 'hero.subtitle', 'text', 'Metodología estructurada para todas las edades: semilleros infantiles, juveniles, adultos aficionados y entrenamiento federado.'),
    ('torneos', 'hero.subtitle', 'text', 'Competencias oficiales bajo ritmos Blitz, Rápido y Clásico avaladas por la Liga de Ajedrez de Antioquia y la FIDE.'),
    ('contacto', 'faq.q1', 'text', '¿Desde qué edad pueden ingresar los niños al semillero?'),
    ('contacto', 'faq.a1', 'text', 'Recibimos niños y niñas a partir de los 5 años en nuestro programa de iniciación lúdica.'),
    ('contacto', 'faq.q2', 'text', '¿Tienen clases virtuales para estudiantes fuera de Sabaneta?'),
    ('contacto', 'faq.a2', 'text', 'Sí, contamos con módulos virtuales vía Zoom y Lichess con análisis interactivo de partidas.')
ON CONFLICT (page, section_key) DO NOTHING;
