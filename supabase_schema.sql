-- ==============================================================================
-- CLUB DEPORTIVO DE AJEDREZ CAPABLANCA SABANETA
-- ESQUEMA COMPLETO DE BASE DE DATOS PARA SUPABASE (ENTERPRISE V2)
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
    user_nombre := COALESCE(new.raw_user_meta_data->>'nombre', new.raw_user_meta_data->>'full_name', '');
    user_apellido := COALESCE(new.raw_user_meta_data->>'apellido', '');
    user_role := COALESCE(new.raw_user_meta_data->>'role', 'student');
    user_username := COALESCE(new.raw_user_meta_data->>'usuario', split_part(new.email, '@', 1));

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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 3. FUNCIÓN DE SEGURIDAD: is_admin()
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
-- 9. TABLA: contact_messages (Mensajes del formulario de contacto)
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
-- 11. TABLA: membership_payments (Gestión de Cuotas y Pagos de Afiliados)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.membership_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT NOT NULL DEFAULT 'Nequi' CHECK (payment_method IN ('Nequi', 'Daviplata', 'Bancolombia', 'Efectivo', 'Otro')),
    reference_number TEXT NOT NULL DEFAULT '',
    period TEXT NOT NULL, -- ej. 'Octubre 2026'
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    receipt_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 12. TABLA: class_schedules (Horarios Semanales de Clases de Ajedrez)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.class_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL,
    trainer TEXT NOT NULL DEFAULT 'Maestro Capablanca',
    day_of_week TEXT NOT NULL,
    time_range TEXT NOT NULL,
    modality TEXT NOT NULL DEFAULT 'Presencial' CHECK (modality IN ('Presencial', 'Online', 'Híbrida')),
    location TEXT NOT NULL DEFAULT 'Sede CC Aves María',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 13. TABLA: club_announcements (Avisos de Alerta Prioritaria)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.club_announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    level TEXT NOT NULL DEFAULT 'info' CHECK (level IN ('info', 'warning', 'urgent')),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    target TEXT NOT NULL DEFAULT 'all' CHECK (target IN ('all', 'public', 'members')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 14. TABLA: tournament_matches (Emparejamientos y Resultados de Torneos)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.tournament_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    round INTEGER NOT NULL DEFAULT 1,
    board_number INTEGER NOT NULL DEFAULT 1,
    white_player TEXT NOT NULL,
    black_player TEXT NOT NULL,
    result TEXT NOT NULL DEFAULT '*' CHECK (result IN ('1-0', '0-1', '1/2-1/2', '*')),
    pgn TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 15. HABILITACIÓN DE ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;


-- ==============================================================================
-- 15. POLÍTICAS RLS
-- ==============================================================================
-- Profiles
DROP POLICY IF EXISTS "Perfiles lectura autenticados" ON public.profiles;
CREATE POLICY "Perfiles lectura autenticados" ON public.profiles FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Usuarios editan propio perfil" ON public.profiles;
CREATE POLICY "Usuarios editan propio perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins gestionan perfiles" ON public.profiles;
CREATE POLICY "Admins gestionan perfiles" ON public.profiles FOR ALL USING (public.is_admin());

-- Site Settings
DROP POLICY IF EXISTS "Settings lectura publica" ON public.site_settings;
CREATE POLICY "Settings lectura publica" ON public.site_settings FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admins gestionan settings" ON public.site_settings;
CREATE POLICY "Admins gestionan settings" ON public.site_settings FOR ALL USING (public.is_admin());

-- Posts
DROP POLICY IF EXISTS "Posts lectura publica" ON public.posts;
CREATE POLICY "Posts lectura publica" ON public.posts FOR SELECT USING (published = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "Admins gestionan posts" ON public.posts;
CREATE POLICY "Admins gestionan posts" ON public.posts FOR ALL USING (public.is_admin());

-- Events
DROP POLICY IF EXISTS "Eventos lectura publica" ON public.events;
CREATE POLICY "Eventos lectura publica" ON public.events FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admins gestionan eventos" ON public.events;
CREATE POLICY "Admins gestionan eventos" ON public.events FOR ALL USING (public.is_admin());

-- Documents
DROP POLICY IF EXISTS "Afiliados leen documentos" ON public.documents;
CREATE POLICY "Afiliados leen documentos" ON public.documents FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins gestionan documentos" ON public.documents;
CREATE POLICY "Admins gestionan documentos" ON public.documents FOR ALL USING (public.is_admin());

-- Registrations
DROP POLICY IF EXISTS "Inscripciones lectura" ON public.tournament_registrations;
CREATE POLICY "Inscripciones lectura" ON public.tournament_registrations FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Usuarios se inscriben" ON public.tournament_registrations;
CREATE POLICY "Usuarios se inscriben" ON public.tournament_registrations FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins gestionan inscripciones" ON public.tournament_registrations;
CREATE POLICY "Admins gestionan inscripciones" ON public.tournament_registrations FOR ALL USING (public.is_admin());

-- Contact Messages
DROP POLICY IF EXISTS "Cualquiera envia mensaje" ON public.contact_messages;
CREATE POLICY "Cualquiera envia mensaje" ON public.contact_messages FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Admins ven mensajes" ON public.contact_messages;
CREATE POLICY "Admins ven mensajes" ON public.contact_messages FOR ALL USING (public.is_admin());

-- Gallery
DROP POLICY IF EXISTS "Galeria lectura publica" ON public.gallery;
CREATE POLICY "Galeria lectura publica" ON public.gallery FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admins gestionan galeria" ON public.gallery;
CREATE POLICY "Admins gestionan galeria" ON public.gallery FOR ALL USING (public.is_admin());

-- Membership Payments
DROP POLICY IF EXISTS "Usuarios ven sus propios pagos" ON public.membership_payments;
CREATE POLICY "Usuarios ven sus propios pagos" ON public.membership_payments FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Usuarios reportan su propio pago" ON public.membership_payments;
CREATE POLICY "Usuarios reportan su propio pago" ON public.membership_payments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins gestionan todos los pagos" ON public.membership_payments;
CREATE POLICY "Admins gestionan todos los pagos" ON public.membership_payments FOR ALL USING (public.is_admin());

-- Class Schedules
DROP POLICY IF EXISTS "Horarios lectura publica" ON public.class_schedules;
CREATE POLICY "Horarios lectura publica" ON public.class_schedules FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admins gestionan horarios" ON public.class_schedules;
CREATE POLICY "Admins gestionan horarios" ON public.class_schedules FOR ALL USING (public.is_admin());

-- Announcements
DROP POLICY IF EXISTS "Anuncios lectura publica" ON public.club_announcements;
CREATE POLICY "Anuncios lectura publica" ON public.club_announcements FOR SELECT USING (active = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "Admins gestionan anuncios" ON public.club_announcements;
CREATE POLICY "Admins gestionan anuncios" ON public.club_announcements FOR ALL USING (public.is_admin());

-- Tournament Matches
DROP POLICY IF EXISTS "Emparejamientos lectura publica" ON public.tournament_matches;
CREATE POLICY "Emparejamientos lectura publica" ON public.tournament_matches FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admins gestionan emparejamientos" ON public.tournament_matches;
CREATE POLICY "Admins gestionan emparejamientos" ON public.tournament_matches FOR ALL USING (public.is_admin());

-- ==============================================================================
-- 16. SEED DATA (DATOS INICIALES COMPLETOS)
-- ==============================================================================


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

-- Horarios Semanales de Clases
INSERT INTO public.class_schedules (category, trainer, day_of_week, time_range, modality, location)
VALUES
('Iniciación Infantil (4 a 8 años)', 'Prof. Andrés Montoya', 'Martes y Jueves', '4:00 PM - 5:30 PM', 'Presencial', 'Sede CC Aves María, piso 3'),
('Semillero Sub-12', 'Prof. Andrés Montoya', 'Miércoles y Viernes', '4:00 PM - 6:00 PM', 'Presencial', 'Sede CC Aves María, piso 3'),
('Desarrollo Juvenil Sub-16', 'Maestro Carlos Rúa', 'Lunes y Miércoles', '6:00 PM - 8:00 PM', 'Híbrida', 'Sede CC Aves María / Zoom'),
('Adultos & Aficionados', 'Maestro Carlos Rúa', 'Sábados', '10:00 AM - 1:00 PM', 'Presencial', 'Sede CC Aves María, piso 3'),
('Alta Competencia Departamental', 'Maestro Internacional Invitado', 'Sábados', '2:00 PM - 6:00 PM', 'Presencial', 'Sede CC Aves María, piso 3')
ON CONFLICT DO NOTHING;

-- Anuncio Prioritario Inicial
INSERT INTO public.club_announcements (title, message, level, active, target)
VALUES
('¡Inscripciones Abiertas Segundo Semestre 2026!', 'Cupos limitados para iniciación infantil y semilleros competitivos. Reserva tu clase diagnóstica sin costo.', 'info', TRUE, 'all')
ON CONFLICT DO NOTHING;

-- Torneos Iniciales y Emparejamientos
INSERT INTO public.events (id, title, slug, description, event_date, event_time, location, rhythm, category, entry_fee, capacity, is_open, status)
VALUES
('a1000000-0000-0000-0000-000000000001', 'I Abierto Relámpago Capablanca 2026', 'i-abierto-relampago-capablanca-2026', 'Torneo suizo a 7 rondas con reloj digital. Válido para ranking interno del club.', CURRENT_DATE + INTERVAL '5 days', '03:00 PM', 'Sede CC Aves María, Sabaneta', 'Blitz 3+2', 'Abierto', 'Gratis afiliados / $20.000 externos', 32, TRUE, 'upcoming'),
('a1000000-0000-0000-0000-000000000002', 'Festival Infantil de Talentos Sub-12', 'festival-infantil-talentos-sub12', 'Competencia formativa para alumnos de iniciación y nivel intermedio con medallas para todos los participantes.', CURRENT_DATE + INTERVAL '12 days', '09:00 AM', 'Sede CC Aves María, Sabaneta', 'Rápido 10+5', 'Infantil Sub-12', 'Gratis afiliados / $15.000 externos', 24, TRUE, 'upcoming')
ON CONFLICT DO NOTHING;

-- Emparejamientos / Partidas de Torneo
INSERT INTO public.tournament_matches (event_id, round, board_number, white_player, black_player, result, pgn)
VALUES
('a1000000-0000-0000-0000-000000000001', 1, 1, 'Santiago Gómez (1580)', 'Andrés Arboleda (1520)', '1-0', '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7 11. c4 c6 12. cxb5 axb5 13. Nc3 Bb7 14. Bg5 b4 15. Nb1 h6 16. Bh4 c5 17. dxe5 Nxe4 18. Bxe7 Qxe7 19. exd6 Qf6 20. Nbd2 Nxd6 21. Nc4 Nxc4 22. Bxc4 Nb6 23. Ne5 Rae8 24. Bxf7+ Rxf7 25. Nxf7 Rxe1+ 26. Qxe1 Kxf7 27. Qe3 Qg5 28. Qxg5 hxg5 29. b3 Ke6 30. a3 Kd6 31. axb4 cxb4 32. Ra5 Nd5 33. f3 Bc8 34. Kf2 Bf5 35. Ra7 g6 36. Ra6+ Kc5 37. Ke1 Bc2 38. Kd2 Bxb3 39. Rxg6 Bc4 40. Rxg5 b3 41. h4 Kb4 42. Rg8 Nb6 43. Rb8 Ka5 44. h5 Bf7 45. h6 Bg6 46. Kc3 1-0'),
('a1000000-0000-0000-0000-000000000001', 1, 2, 'Mateo Valencia (1640)', 'David Rendón (1490)', '1/2-1/2', '1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Nf3 Be7 5. Bg5 O-O 6. e3 h6 7. Bh4 b6 8. cxd5 Nxd5 9. Bxe7 Qxe7 10. Nxd5 exd5 11. Rc1 Be6 12. Qa4 c5 13. Qa3 Rc8 14. Be2 Nd7 15. O-O Kf8 16. Ba6 Rc7 17. Rc3 c4 18. Qxe7+ Kxe7 19. b3 Nb8 20. Bb5 a6 21. Ba4 b5 22. bxc4 bxa4 23. c5 Nc6 24. Ra3 Rb8 25. Rxa4 a5 26. Ra3 Rb2 27. h3 Rcb7 28. Rc1 Rb1 29. Rxb1 Rxb1+ 30. Kh2 Rb2 31. Kg3 f6 32. Ne1 Bf5 33. Nd3 Bxd3 34. Rxd3 Rxa2 35. Rb3 Nb4 36. f3 Kd7 37. e4 Kc6 38. exd5+ Kxd5 39. Re3 Kxd4 40. Re7 g5 41. Re6 Kxc5 42. Rxf6 a4 43. Rxh6 a3 44. Rg6 Kb5 45. Rxg5+ Ka4 46. Rg8 Rd2 47. Ra8+ Kb3 48. h4 a2 49. h5 Rd4 50. Rxa2 Kxa2 51. f4 Kb3 52. h6 Rd6 53. Kg4 Rxh6 54. Kg5 Rh8 55. g4 Kc4 56. f5 Kd5 57. Kf6 Kd6 58. g5 Nd5+ 59. Kg7 Rh1 60. f6 Rg1 61. g6 Nf4 62. f7 Rxg6+ 63. Kh7 Rf6 64. Kg7 Ke7 65. f8=Q+ Rxf8 1/2-1/2')
ON CONFLICT DO NOTHING;
