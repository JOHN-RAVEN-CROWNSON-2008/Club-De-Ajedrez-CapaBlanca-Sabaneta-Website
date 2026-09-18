-- ==============================================================================
-- CLUB DEPORTIVO DE AJEDREZ CAPABLANCA SABANETA
-- MIGRACIÓN MAESTRA CONSOLIDADA — PARTE II (BLOQUE 14)
-- Archivo: 00_master_consolidation_parte_2.sql
-- Fecha: 2026-09-17
-- ==============================================================================
-- Este script unifica y consolida en una sola unidad transaccional e idempotente
-- todas las modificaciones de esquema, vistas de seguridad, tablas nuevas,
-- políticas RLS y buckets de Storage introducidas a lo largo de la Parte II.
--
-- CONTENIDO (10 PUNTOS DE AUDITORÍA Y CONTROL):
-- 1. Columna profiles.lichess_username TEXT (Bloque 3)
-- 2. Columnas membership_payments.reviewed_by, reviewed_at, rejection_reason (Bloque 5)
-- 3. Vista pública segura public.member_public_directory (Bloque 6 & 15)
-- 4. Columna membership_applications.linked_profile_id UUID (Bloque 8)
-- 5. Tabla public.ai_provider_settings, RLS y semillas (Bloque 1)
-- 6. Tabla public.content_blocks, RLS y semillas iniciales (Bloque 1)
-- 7. Tabla public.promo_popups, RLS e índices (Bloque 9)
-- 8. Restricción ampliada documents_category_check (Bloque 4)
-- 9. Política RLS estricta en profiles: "Perfiles lectura propio o admin" (Bloques 14 & 15)
-- 10. Configuración de Storage Buckets y políticas RLS para storage.objects (Bloques 9 & 15)
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. PERFILES: INTEGRACIÓN LICHESS (Bloque 3)
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS lichess_username TEXT;

COMMENT ON COLUMN public.profiles.lichess_username IS
'Nombre de usuario de Lichess.org vinculado por el deportista para embeds y seguimiento de partidas.';


-- ------------------------------------------------------------------------------
-- 2. GESTIÓN DE PAGOS: TRAZABILIDAD Y AUDITORÍA DE TESORERÍA (Bloque 5)
-- ------------------------------------------------------------------------------
ALTER TABLE public.membership_payments
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.membership_payments
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

ALTER TABLE public.membership_payments
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

COMMENT ON COLUMN public.membership_payments.reviewed_by IS
'Administrador que aprobó o rechazó el comprobante de pago.';

COMMENT ON COLUMN public.membership_payments.rejection_reason IS
'Motivo especificado por la administración si la mensualidad o comprobante es rechazado.';


-- ------------------------------------------------------------------------------
-- 3. VISTA PÚBLICA SEGURA: member_public_directory (Bloque 6 & 15)
--    Protege datos personales sensibles (correos, teléfonos, documentos)
--    en las consultas públicas de verificación de credenciales y escalafón.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.member_public_directory AS
SELECT
    p.id,
    p.nombre,
    p.apellido,
    p.usuario,
    p.ciudad,
    p.categoria_ajedrez,
    p.fide_id,
    p.elo_rating,
    p.estado
FROM public.profiles p
WHERE p.estado = 'active';

COMMENT ON VIEW public.member_public_directory IS 
'Directorio público seguro de afiliados activos para validación de certificados y escalafón sin exponer datos personales.';

GRANT SELECT ON public.member_public_directory TO anon, authenticated;


-- ------------------------------------------------------------------------------
-- 4. SOLICITUDES DE ADMISIÓN: VINCULACIÓN CON PERFILES (Bloque 8)
-- ------------------------------------------------------------------------------
ALTER TABLE public.membership_applications 
ADD COLUMN IF NOT EXISTS linked_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_membership_applications_linked_profile 
ON public.membership_applications(linked_profile_id);


-- ------------------------------------------------------------------------------
-- 5. TABLA: ai_provider_settings (Configuración MODO AI multi-proveedor - Bloque 1)
-- ------------------------------------------------------------------------------
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

DROP POLICY IF EXISTS "Admin gestiona ai_provider_settings" ON public.ai_provider_settings;
CREATE POLICY "Admin gestiona ai_provider_settings"
    ON public.ai_provider_settings
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

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


-- ------------------------------------------------------------------------------
-- 6. TABLA: content_blocks (Editor Dinámico de Contenido por Página - Bloque 1)
-- ------------------------------------------------------------------------------
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

DROP POLICY IF EXISTS "Lectura publica de content_blocks" ON public.content_blocks;
CREATE POLICY "Lectura publica de content_blocks"
    ON public.content_blocks
    FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Admin gestiona content_blocks" ON public.content_blocks;
CREATE POLICY "Admin gestiona content_blocks"
    ON public.content_blocks
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Semillas de Bloques de Contenido
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


-- ------------------------------------------------------------------------------
-- 7. TABLA: promo_popups (Banners y Pop-ups Promocionales Administrables - Bloque 9)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.promo_popups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    image_url TEXT NOT NULL,
    link_type TEXT NOT NULL CHECK (link_type IN ('internal_page', 'external_url', 'document', 'form')),
    link_value TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    pages TEXT[] NOT NULL DEFAULT ARRAY['*'],
    frequency TEXT NOT NULL DEFAULT 'once_per_session' CHECK (frequency IN ('once_per_session', 'once_per_day', 'always')),
    impressions_count INTEGER NOT NULL DEFAULT 0,
    clicks_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_promo_popups_active_dates 
ON public.promo_popups(active, starts_at, ends_at);

ALTER TABLE public.promo_popups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Popups lectura publica vigentes" ON public.promo_popups;
CREATE POLICY "Popups lectura publica vigentes" ON public.promo_popups
    FOR SELECT USING (
        active = true 
        AND (starts_at IS NULL OR starts_at <= timezone('utc'::text, now())) 
        AND (ends_at IS NULL OR ends_at >= timezone('utc'::text, now()))
    );

DROP POLICY IF EXISTS "Admins gestionan popups" ON public.promo_popups;
CREATE POLICY "Admins gestionan popups" ON public.promo_popups
    FOR ALL USING (public.is_admin());

GRANT SELECT ON public.promo_popups TO anon, authenticated;
GRANT ALL ON public.promo_popups TO authenticated;


-- ------------------------------------------------------------------------------
-- 8. REPOSITORIO DE DOCUMENTOS: RESTRICCIÓN DE CATEGORÍAS (Bloque 4)
-- ------------------------------------------------------------------------------
ALTER TABLE public.documents
ALTER COLUMN file_url DROP NOT NULL;

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT con.conname
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        WHERE nsp.nspname = 'public'
          AND rel.relname = 'documents'
          AND con.contype = 'c'
          AND pg_get_constraintdef(con.oid) ILIKE '%category%'
    LOOP
        EXECUTE format('ALTER TABLE public.documents DROP CONSTRAINT %I', r.conname);
    END LOOP;
END $$;

ALTER TABLE public.documents
ADD CONSTRAINT documents_category_check
CHECK (category IN (
    'General',
    'Reglamento',
    'Material de Estudio',
    'Partidas PGN',
    'Circulares',
    'Guía',
    'Formulario de inscripción',
    'Resolución',
    'Acta'
));


-- ------------------------------------------------------------------------------
-- 9. REVISIÓN DE POLÍTICA RLS EN PROFILES: SEGURIDAD DE DATOS PERSONALES (Bloque 15)
--    Reemplaza la lectura indiscriminada entre autenticados por acceso exclusivo
--    al propio perfil o al administrador. La vista pública 'member_public_directory'
--    suministra los datos públicos seguros para el escalafón y verificación.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Perfiles lectura autenticados" ON public.profiles;
DROP POLICY IF EXISTS "Perfiles lectura propio o admin" ON public.profiles;

CREATE POLICY "Perfiles lectura propio o admin" ON public.profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id OR public.is_admin());


-- ------------------------------------------------------------------------------
-- 10. CONFIGURACIÓN DE STORAGE BUCKETS Y POLÍTICAS RLS (Bloques 9 & 15)
--     Buckets:
--       - gallery: público (fotos del club)
--       - documents: público (reglamentos, guías, resoluciones)
--       - popups: público (imágenes de banners y ventanas emergentes)
--       - payment-receipts: PRIVADO (comprobantes de pago accesibles solo con signed URLs)
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    ('gallery', 'gallery', TRUE, 15728640, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']),
    ('documents', 'documents', TRUE, 15728640, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/png', 'image/jpeg', 'text/plain']),
    ('payment-receipts', 'payment-receipts', FALSE, 15728640, ARRAY['image/png', 'image/jpeg', 'image/webp', 'application/pdf']),
    ('popups', 'popups', TRUE, 15728640, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Políticas de Storage para el bucket 'popups'
DROP POLICY IF EXISTS "popups_public_read" ON storage.objects;
CREATE POLICY "popups_public_read" ON storage.objects FOR SELECT
    USING (bucket_id = 'popups');

DROP POLICY IF EXISTS "popups_admin_insert" ON storage.objects;
CREATE POLICY "popups_admin_insert" ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'popups' AND public.is_admin());

DROP POLICY IF EXISTS "popups_admin_update" ON storage.objects;
CREATE POLICY "popups_admin_update" ON storage.objects FOR UPDATE
    USING (bucket_id = 'popups' AND public.is_admin());

DROP POLICY IF EXISTS "popups_admin_delete" ON storage.objects;
CREATE POLICY "popups_admin_delete" ON storage.objects FOR DELETE
    USING (bucket_id = 'popups' AND public.is_admin());

COMMIT;
