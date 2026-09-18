-- ==============================================================================
-- MIGRACIÓN FASE 4: FASE DE AFILIADOS (BLOQUES 3, 4, 5 Y 6)
-- Fecha: 2026-09-17
-- ==============================================================================

-- 1. BLOQUE 3: LICHESS EN PERFILES
-- Añadir columna lichess_username a la tabla de perfiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS lichess_username TEXT;

COMMENT ON COLUMN public.profiles.lichess_username IS
'Nombre de usuario de Lichess.org vinculado por el deportista para embeds y seguimiento de partidas.';

-- 2. BLOQUE 4: REPOSITORIO DE DOCUMENTOS Y CATEGORÍAS AMPLIADAS
-- Permitir que file_url sea nullable (para documentos en proceso de publicación)
ALTER TABLE public.documents
ALTER COLUMN file_url DROP NOT NULL;

-- Actualizar restricción de categorías permitidas
ALTER TABLE public.documents
DROP CONSTRAINT IF EXISTS documents_category_check;

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

-- 3. BLOQUE 5: COMPROBANTES DE PAGO Y TRAZABILIDAD
-- Añadir columnas de auditoría y motivo de rechazo
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
