-- ==============================================================================
-- MIGRACIÓN 04: FASE 5 — ADMINISTRACIÓN Y CONTENIDO
-- Club Deportivo de Ajedrez Capablanca Sabaneta
-- 1. Vinculación de solicitudes de afiliación con perfiles de usuario (Bloque 8)
-- 2. Tabla de pop-ups publicitarios y banners promocionales administrables (Bloque 9)
-- ==============================================================================

-- 1. VINCULACIÓN DE SOLICITUDES DE ADMISIÓN CON PROFILES (Bloque 8)
ALTER TABLE public.membership_applications 
ADD COLUMN IF NOT EXISTS linked_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_membership_applications_linked_profile 
ON public.membership_applications(linked_profile_id);


-- 2. TABLA: promo_popups (Ventanas emergentes y banners publicitarios administrables - Bloque 9)
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

-- Habilitar RLS en promo_popups
ALTER TABLE public.promo_popups ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para promo_popups
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

-- Otorgar permisos
GRANT SELECT ON public.promo_popups TO anon, authenticated;
GRANT ALL ON public.promo_popups TO authenticated;
