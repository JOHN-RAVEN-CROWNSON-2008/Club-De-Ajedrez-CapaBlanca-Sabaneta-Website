-- ==============================================================================
-- CLUB DEPORTIVO DE AJEDREZ CAPABLANCA SABANETA
-- MIGRACIÓN 01: FASE DE CIMIENTOS Y SEGURIDAD (HOJA DE RUTA PARTE II)
-- ==============================================================================
-- 1. Vista pública segura 'member_public_directory' (Bloque 6 & Bloque 15)
--    Expone únicamente datos no sensibles requeridos para validación de
--    certificados y escalafón oficial, protegiendo correos, teléfonos y documentos.
-- ==============================================================================

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

-- Permisos explícitos de lectura para usuarios anónimos y autenticados
GRANT SELECT ON public.member_public_directory TO anon, authenticated;


-- ==============================================================================
-- 2. Actualización de Trigger 'handle_new_user' (Bloque 7)
--    Garantiza almacenamiento íntegro de metadatos (teléfono, categoría, estado)
--    y resolución determinista de colisiones de nombre de usuario con search_path seguro.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_nombre TEXT;
    user_apellido TEXT;
    user_role TEXT;
    user_username TEXT;
    user_telefono TEXT;
    user_categoria TEXT;
BEGIN
    user_nombre := COALESCE(new.raw_user_meta_data->>'nombre', new.raw_user_meta_data->>'full_name', '');
    user_apellido := COALESCE(new.raw_user_meta_data->>'apellido', '');
    user_role := COALESCE(new.raw_user_meta_data->>'role', 'student');
    user_telefono := COALESCE(new.raw_user_meta_data->>'telefono', '');
    user_categoria := COALESCE(new.raw_user_meta_data->>'categoria', 'Iniciación');
    user_username := COALESCE(new.raw_user_meta_data->>'usuario', split_part(new.email, '@', 1));

    -- Si el nombre de usuario ya existe en profiles, añadir sufijo derivado del id único
    IF EXISTS (SELECT 1 FROM public.profiles WHERE usuario = user_username) THEN
        user_username := user_username || '_' || substr(replace(new.id::text, '-', ''), 1, 6);
    END IF;

    INSERT INTO public.profiles (
        id,
        nombre,
        apellido,
        usuario,
        correo,
        telefono,
        categoria_ajedrez,
        role,
        estado,
        avatar_url,
        created_at,
        updated_at
    ) VALUES (
        new.id,
        user_nombre,
        user_apellido,
        user_username,
        new.email,
        user_telefono,
        user_categoria,
        user_role,
        'active',
        COALESCE(new.raw_user_meta_data->>'avatar_url', ''),
        timezone('utc'::text, now()),
        timezone('utc'::text, now())
    );

    RETURN new;
EXCEPTION
    WHEN OTHERS THEN
        -- Registro preventivo para que un fallo en trigger no bloquee el registro de auth.users
        RAISE WARNING 'handle_new_user error para usuario %: %', new.id, SQLERRM;
        RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- Reasignar trigger para garantizar idempotencia
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
