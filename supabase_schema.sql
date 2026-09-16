-- ==============================================================================
-- CLUB DEPORTIVO DE AJEDREZ CAPABLANCA SABANETA
-- ESQUEMA COMPLETO DE BASE DE DATOS PARA SUPABASE
-- ==============================================================================
-- Este script es autocontenido e idempotente.
-- Puedes copiar y pegar todo este archivo directamente en el SQL Editor de Supabase
-- y presionar RUN para configurar tablas, triggers, RLS y datos iniciales.
-- ==============================================================================

-- 0. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. TABLA: profiles (Perfiles de usuario y roles)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre TEXT DEFAULT '',
    apellido TEXT DEFAULT '',
    usuario TEXT UNIQUE,
    correo TEXT,
    edad INTEGER,
    fecha_nacimiento DATE,
    ciudad TEXT DEFAULT 'Sabaneta',
    telefono TEXT DEFAULT '',
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'member', 'student')),
    categoria_ajedrez TEXT DEFAULT 'Iniciación',
    fide_id TEXT,
    elo_rating INTEGER DEFAULT 0,
    avatar_url TEXT,
    estado TEXT NOT NULL DEFAULT 'active' CHECK (estado IN ('active', 'inactive', 'pending')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.profiles IS 'Perfiles de usuario extendidos sincronizados con auth.users';

-- ==============================================================================
-- 2. FUNCIÓN Y TRIGGER: Creación automática de perfiles
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_nombre TEXT;
    user_apellido TEXT;
    user_role TEXT;
    user_username TEXT;
BEGIN
    -- Extraer metadatos opcionales enviados en el registro
    user_nombre := COALESCE(new.raw_user_meta_data->>'nombre', new.raw_user_meta_data->>'full_name', '');
    user_apellido := COALESCE(new.raw_user_meta_data->>'apellido', '');
    user_role := COALESCE(new.raw_user_meta_data->>'role', 'student');
    user_username := COALESCE(new.raw_user_meta_data->>'usuario', split_part(new.email, '@', 1));

    -- Asegurar unicidad simple de username si ya existe
    IF EXISTS (SELECT 1 FROM public.profiles WHERE usuario = user_username) THEN
        user_username := user_username || '_' || substr(new.id::text, 1, 4);
    END IF;

    INSERT INTO public.profiles (
        id,
        nombre,
        apellido,
        usuario,
        correo,
        role,
        avatar_url,
        created_at,
        updated_at
    ) VALUES (
        new.id,
        user_nombre,
        user_apellido,
        user_username,
        new.email,
        user_role,
        COALESCE(new.raw_user_meta_data->>'avatar_url', ''),
        timezone('utc'::text, now()),
        timezone('utc'::text, now())
    );

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear el trigger en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 3. FUNCIÓN DE UTILIDAD DE SEGURIDAD: is_admin()
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ==============================================================================
-- 4. TABLA: site_settings (Configuración general editable del CMS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.site_settings (
    id TEXT PRIMARY KEY DEFAULT 'general',
    telefono TEXT NOT NULL DEFAULT '+57 300 254 5835',
    whatsapp TEXT NOT NULL DEFAULT '573002545835',
    sede TEXT NOT NULL DEFAULT 'CC Aves María, tercer piso',
    ciudad TEXT NOT NULL DEFAULT 'Sabaneta, Antioquia, Colombia',
    instagram TEXT NOT NULL DEFAULT 'https://www.instagram.com/capablanca_sabaneta/',
    mapa_url TEXT NOT NULL DEFAULT 'https://www.google.com/maps/search/?api=1&query=Centro+Comercial+Aves+Maria+Sabaneta+Antioquia',
    horarios TEXT NOT NULL DEFAULT 'Lunes a Sábado: 9:00 AM - 7:00 PM',
    mensaje_general TEXT NOT NULL DEFAULT 'Hola, vengo de la página web del Club Capablanca Sabaneta y quiero más información.',
    mensaje_inscripcion TEXT NOT NULL DEFAULT 'Hola, quiero inscribirme en el Club de Ajedrez Capablanca Sabaneta. ¿Me comparten horarios y valor de la mensualidad?',
    mensaje_clase_prueba TEXT NOT NULL DEFAULT 'Hola, me gustaría agendar una clase de prueba en el Club Capablanca Sabaneta.',
    mensaje_torneos TEXT NOT NULL DEFAULT 'Hola, quiero información sobre los próximos torneos del Club Capablanca Sabaneta.',
    anuncio_activo BOOLEAN NOT NULL DEFAULT TRUE,
    anuncio_texto TEXT NOT NULL DEFAULT '¡Inscripciones abiertas! Clases presenciales y virtuales para todas las edades.',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 5. TABLA: posts (Noticias, Blog y Actualizaciones)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    cover_image TEXT,
    category TEXT DEFAULT 'Noticias',
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    published BOOLEAN NOT NULL DEFAULT TRUE,
    published_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 6. TABLA: events (Torneos, Clínicas y Competiciones)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE,
    description TEXT,
    event_date DATE NOT NULL,
    event_time TEXT DEFAULT '09:00 AM',
    location TEXT NOT NULL DEFAULT 'Sede CC Aves María, Sabaneta',
    rhythm TEXT NOT NULL DEFAULT 'Blitz 5+3',
    category TEXT NOT NULL DEFAULT 'Abierto',
    entry_fee TEXT DEFAULT 'Gratuito para afiliados / $25.000 externos',
    capacity INTEGER DEFAULT 40,
    is_open BOOLEAN NOT NULL DEFAULT TRUE,
    status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 7. TABLA: documents (Archivos compartidos y recursos de estudio para Afiliados)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL DEFAULT 'pdf',
    file_size TEXT DEFAULT '1.2 MB',
    category TEXT NOT NULL DEFAULT 'General' CHECK (category IN ('General', 'Reglamento', 'Material de Estudio', 'Partidas PGN', 'Circulares')),
    min_role TEXT NOT NULL DEFAULT 'student' CHECK (min_role IN ('admin', 'member', 'student')),
    downloads_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 8. TABLA: tournament_registrations (Inscripciones de afiliados a torneos)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.tournament_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'waitlist', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(event_id, user_id)
);

-- ==============================================================================
-- 9. TABLA: contact_messages (Mensajes recibidos desde el formulario de contacto)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived', 'replied')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 10. TABLA: gallery (Galería multimedia del club)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.gallery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    src TEXT NOT NULL,
    alt TEXT NOT NULL,
    caption TEXT,
    category TEXT DEFAULT 'general',
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 11. HABILITACIÓN DE ROW LEVEL SECURITY (RLS) EN TODAS LAS TABLAS
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 12. POLÍTICAS DE ACCESO (RLS POLICIES)
-- ==============================================================================

-- ---- PROFILES ----
DROP POLICY IF EXISTS "Perfiles visibles para usuarios autenticados y admin" ON public.profiles;
CREATE POLICY "Perfiles visibles para usuarios autenticados y admin"
    ON public.profiles FOR SELECT
    USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON public.profiles;
CREATE POLICY "Usuarios pueden actualizar su propio perfil"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins pueden gestionar todos los perfiles" ON public.profiles;
CREATE POLICY "Admins pueden gestionar todos los perfiles"
    ON public.profiles FOR ALL
    USING (public.is_admin());

-- ---- SITE_SETTINGS ----
DROP POLICY IF EXISTS "Configuración pública legible por cualquiera" ON public.site_settings;
CREATE POLICY "Configuración pública legible por cualquiera"
    ON public.site_settings FOR SELECT
    USING (TRUE);

DROP POLICY IF EXISTS "Solo admins pueden modificar configuración" ON public.site_settings;
CREATE POLICY "Solo admins pueden modificar configuración"
    ON public.site_settings FOR ALL
    USING (public.is_admin());

-- ---- POSTS ----
DROP POLICY IF EXISTS "Posts publicados visibles por cualquiera" ON public.posts;
CREATE POLICY "Posts publicados visibles por cualquiera"
    ON public.posts FOR SELECT
    USING (published = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "Solo admins pueden crear, editar y borrar posts" ON public.posts;
CREATE POLICY "Solo admins pueden crear, editar y borrar posts"
    ON public.posts FOR ALL
    USING (public.is_admin());

-- ---- EVENTS ----
DROP POLICY IF EXISTS "Eventos visibles por cualquiera" ON public.events;
CREATE POLICY "Eventos visibles por cualquiera"
    ON public.events FOR SELECT
    USING (TRUE);

DROP POLICY IF EXISTS "Solo admins pueden gestionar eventos" ON public.events;
CREATE POLICY "Solo admins pueden gestionar eventos"
    ON public.events FOR ALL
    USING (public.is_admin());

-- ---- DOCUMENTS ----
DROP POLICY IF EXISTS "Afiliados autenticados pueden ver documentos" ON public.documents;
CREATE POLICY "Afiliados autenticados pueden ver documentos"
    ON public.documents FOR SELECT
    USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Solo admins pueden gestionar documentos" ON public.documents;
CREATE POLICY "Solo admins pueden gestionar documentos"
    ON public.documents FOR ALL
    USING (public.is_admin());

-- ---- TOURNAMENT_REGISTRATIONS ----
DROP POLICY IF EXISTS "Usuarios pueden ver sus propias inscripciones" ON public.tournament_registrations;
CREATE POLICY "Usuarios pueden ver sus propias inscripciones"
    ON public.tournament_registrations FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Usuarios autenticados pueden inscribirse a torneos" ON public.tournament_registrations;
CREATE POLICY "Usuarios autenticados pueden inscribirse a torneos"
    ON public.tournament_registrations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden cancelar su propia inscripcion" ON public.tournament_registrations;
CREATE POLICY "Usuarios pueden cancelar su propia inscripcion"
    ON public.tournament_registrations FOR DELETE
    USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admins pueden gestionar todas las inscripciones" ON public.tournament_registrations;
CREATE POLICY "Admins pueden gestionar todas las inscripciones"
    ON public.tournament_registrations FOR ALL
    USING (public.is_admin());

-- ---- CONTACT_MESSAGES ----
DROP POLICY IF EXISTS "Cualquiera puede enviar mensajes de contacto" ON public.contact_messages;
CREATE POLICY "Cualquiera puede enviar mensajes de contacto"
    ON public.contact_messages FOR INSERT
    WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Solo admins pueden ver y gestionar mensajes" ON public.contact_messages;
CREATE POLICY "Solo admins pueden ver y gestionar mensajes"
    ON public.contact_messages FOR ALL
    USING (public.is_admin());

-- ---- GALLERY ----
DROP POLICY IF EXISTS "Galería visible públicamente" ON public.gallery;
CREATE POLICY "Galería visible públicamente"
    ON public.gallery FOR SELECT
    USING (TRUE);

DROP POLICY IF EXISTS "Solo admins pueden gestionar galería" ON public.gallery;
CREATE POLICY "Solo admins pueden gestionar galería"
    ON public.gallery FOR ALL
    USING (public.is_admin());

-- ==============================================================================
-- 13. DATOS INICIALES (SEED DATA)
-- ==============================================================================

-- Configuración general del club
INSERT INTO public.site_settings (id, telefono, whatsapp, sede, ciudad, instagram)
VALUES (
    'general',
    '+57 300 254 5835',
    '573002545835',
    'CC Aves María, tercer piso',
    'Sabaneta, Antioquia, Colombia',
    'https://www.instagram.com/capablanca_sabaneta/'
) ON CONFLICT (id) DO UPDATE SET
    telefono = EXCLUDED.telefono,
    whatsapp = EXCLUDED.whatsapp;

-- Torneos iniciales
INSERT INTO public.events (title, slug, description, event_date, event_time, location, rhythm, category, capacity, entry_fee, is_open)
VALUES 
(
    'Torneo Relámpago Apertura Sabaneta',
    'torneo-relampago-apertura-sabaneta',
    'Torneo suizo a 7 rondas válido para ranking interno del club. Premiación con trofeos y medallas para los 3 primeros lugares y mejor sub-14.',
    CURRENT_DATE + INTERVAL '12 days',
    '03:00 PM',
    'Sede CC Aves María, tercer piso',
    'Blitz 3+2',
    'Abierto',
    32,
    'Gratuito para afiliados / $20.000 externos',
    TRUE
),
(
    'Festival Infantil de Ajedrez Capablanca',
    'festival-infantil-ajedrez-capablanca',
    'Competencia diseñada para categorías Sub-8, Sub-10 y Sub-12. Acompañamiento pedagógico y análisis guiado al finalizar cada ronda.',
    CURRENT_DATE + INTERVAL '25 days',
    '09:30 AM',
    'Sede CC Aves María, tercer piso',
    'Rápido 15+5',
    'Infantil (Sub-8 a Sub-12)',
    24,
    '$15.000 (incluye certificado y refrigerio)',
    TRUE
) ON CONFLICT DO NOTHING;

-- Artículos de Blog iniciales
INSERT INTO public.posts (title, slug, excerpt, content, cover_image, category, published)
VALUES
(
    'Cómo preparar tu primer torneo de ajedrez: Guía práctica',
    'como-preparar-primer-torneo-ajedrez',
    'Consejos esenciales sobre manejo del reloj, anotación de partidas y control emocional en competencia para jugadores de todas las edades.',
    'Competir por primera vez en un torneo de ajedrez es un hito emocionante para cualquier ajedrecista. En el Club Capablanca preparamos a nuestros deportistas tanto en el dominio técnico como en la fortaleza mental y el disfrute del juego. En este artículo repasamos las reglas básicas del uso del reloj con incremento, la importancia del descanso previo y la mentalidad positiva ante la victoria y la derrota.',
    'assets/img/club-galeria-04.webp',
    'Formativo',
    TRUE
),
(
    'Capablanca Sabaneta brilla en el torneo interclubes',
    'capablanca-sabaneta-brilla-interclubes',
    'Nuestra delegación infantil y juvenil cosechó 5 podios en una jornada memorable de ajedrez federado en Antioquia.',
    'Con una destacada participación de más de 20 deportistas, el Club de Ajedrez Capablanca Sabaneta demostró el fruto del entrenamiento constante. Felicitamos a todos los alumnos, familias y entrenadores por su entrega y espíritu deportivo en cada tablero.',
    'assets/img/equipo-infantil-trofeos.webp',
    'Torneos',
    TRUE
) ON CONFLICT DO NOTHING;

-- Documentos de estudio y reglamentos para Afiliados
INSERT INTO public.documents (title, description, file_url, file_type, file_size, category, min_role)
VALUES
(
    'Reglamento Interno y Código de Ética 2026',
    'Normativa general para miembros, deberes en torneos y protocolo de convivencia del club.',
    '#docs-reglamento-interno',
    'pdf',
    '1.8 MB',
    'Reglamento',
    'student'
),
(
    'Guía de Aperturas Básicas: Principios Fundamentales',
    'Material de estudio para alumnos de iniciación y nivel intermedio sobre control de centro y desarrollo armónico.',
    '#docs-aperturas-basicas',
    'pdf',
    '3.4 MB',
    'Material de Estudio',
    'student'
),
(
    'Base de Partidas Notables de José Raúl Capablanca (PGN)',
    'Compilación de 50 partidas magistrales del tercer campeón del mundo comentadas paso a paso.',
    '#docs-capablanca-pgn',
    'pgn',
    '450 KB',
    'Partidas PGN',
    'student'
),
(
    'Circular Oficial: Convocatorias y Calendario Primer Semestre',
    'Fechas oficiales de torneos departamentales, entrenamientos especiales y simulacros.',
    '#docs-circular-calendario',
    'pdf',
    '890 KB',
    'Circulares',
    'student'
) ON CONFLICT DO NOTHING;

-- Galería inicial
INSERT INTO public.gallery (src, alt, caption, category, order_index)
VALUES
('assets/img/equipo-infantil-trofeos.webp', 'Categoría infantil del Club Capablanca con trofeos', 'Premiación categoría infantil', 'infantil', 1),
('assets/img/delegacion-escalinatas.webp', 'Delegación completa del club antes del torneo', 'Delegación completa', 'delegacion', 2),
('assets/img/campeon-sub8.webp', 'Alumnos y entrenadores con trofeo Campeón Sub-8', 'Campeón Sub-8', 'torneos', 3),
('assets/img/equipo-adultos-torneo.webp', 'Equipo de adultos del club en competencia', 'Equipo de adultos', 'adultos', 4),
('assets/img/delegacion-coliseo.webp', 'Deportistas del club en el coliseo', 'Noche de torneo', 'torneos', 5),
('assets/img/ninos-celebrando.webp', 'Niños celebrando con las manos en alto', 'La familia Capablanca', 'comunidad', 6),
('assets/img/premiacion-aves-maria.webp', 'Premiación en el Parque Comercial Aves María', 'Torneo en Aves María', 'torneos', 7),
('assets/img/club-galeria-04.webp', 'Alumnos frente al mural de ajedrez de la sede', 'En nuestra sede', 'sede', 8),
('assets/img/entrenadores-alumno.webp', 'Entrenadores acompañando al alumno premiado', 'Acompañamiento personalizado', 'entrenamiento', 9),
('assets/img/seleccion-colombia.webp', 'Selección Colombia de ajedrez', 'Ajedrez colombiano', 'competencia', 10)
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- INSTRUCCIONES PARA CREAR EL PRIMER USUARIO ADMINISTRADOR:
-- ==============================================================================
-- 1. Regístrate normalmente desde el formulario de registro de la web con tu correo.
-- 2. En el SQL Editor de Supabase ejecuta:
--    UPDATE public.profiles SET role = 'admin' WHERE correo = 'tu-correo@ejemplo.com';
-- ==============================================================================
