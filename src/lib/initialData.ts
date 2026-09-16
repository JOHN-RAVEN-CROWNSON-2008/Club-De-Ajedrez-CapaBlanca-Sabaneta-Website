import { SiteSettings, Post, ClubEvent, ClubDocument, GalleryItem, UserProfile } from '../types/database';

export const INITIAL_SETTINGS: SiteSettings = {
  id: 'general',
  telefono: '+57 300 254 5835',
  whatsapp: '573002545835',
  sede: 'CC Aves María, tercer piso',
  ciudad: 'Sabaneta, Antioquia, Colombia',
  instagram: 'https://www.instagram.com/capablanca_sabaneta/',
  mapa_url: 'https://www.google.com/maps/search/?api=1&query=Centro+Comercial+Aves+Maria+Sabaneta+Antioquia',
  horarios: 'Lunes a Sábado: 9:00 AM - 7:00 PM',
  mensaje_general: 'Hola, vengo de la página web del Club Capablanca Sabaneta y quiero más información.',
  mensaje_inscripcion: 'Hola, quiero inscribirme en el Club de Ajedrez Capablanca Sabaneta. ¿Me comparten horarios y valor de la mensualidad?',
  mensaje_clase_prueba: 'Hola, me gustaría agendar una clase de prueba en el Club Capablanca Sabaneta.',
  mensaje_torneos: 'Hola, quiero información sobre los próximos torneos del Club Capablanca Sabaneta.',
  anuncio_activo: true,
  anuncio_texto: '¡Inscripciones abiertas! Clases presenciales en Sabaneta y online desde donde estés.',
};

export const INITIAL_EVENTS: ClubEvent[] = [
  {
    id: 'ev-1',
    title: 'Torneo Relámpago Apertura Sabaneta',
    slug: 'torneo-relampago-apertura-sabaneta',
    description: 'Torneo suizo a 7 rondas válido para ranking interno del club. Premiación con trofeos y medallas para los 3 primeros lugares y mejor sub-14.',
    event_date: '2026-10-18',
    event_time: '03:00 PM',
    location: 'Sede CC Aves María, tercer piso',
    rhythm: 'Blitz 5+3',
    category: 'Abierto',
    entry_fee: 'Gratuito para afiliados / $20.000 externos',
    capacity: 32,
    is_open: true,
    status: 'upcoming',
    created_at: '2026-09-01T10:00:00Z',
    registrations_count: 14,
  },
  {
    id: 'ev-2',
    title: 'Festival Infantil de Ajedrez Capablanca',
    slug: 'festival-infantil-ajedrez-capablanca',
    description: 'Competencia formativa para categorías Sub-8, Sub-10 y Sub-12. Acompañamiento pedagógico y análisis guiado al finalizar cada partida.',
    event_date: '2026-11-08',
    event_time: '09:30 AM',
    location: 'Sede CC Aves María, tercer piso',
    rhythm: 'Rápido 15+5',
    category: 'Infantil (Sub-8 a Sub-12)',
    entry_fee: '$15.000 (incluye certificado y refrigerio)',
    capacity: 24,
    is_open: true,
    status: 'upcoming',
    created_at: '2026-09-05T10:00:00Z',
    registrations_count: 9,
  },
  {
    id: 'ev-3',
    title: 'Clínica de Finales Prácticos de Torres',
    slug: 'clinica-finales-practicos-torres',
    description: 'Masterclass intensiva dictada por Maestros del club sobre la técnica correcta en los finales más frecuentes de la práctica competitiva.',
    event_date: '2026-11-22',
    event_time: '04:00 PM',
    location: 'Sede Presencial & Transmisión en Vivo',
    rhythm: 'Taller Teórico-Práctico',
    category: 'Intermedio y Avanzado',
    entry_fee: 'Exclusivo Afiliados Capablanca',
    capacity: 20,
    is_open: true,
    status: 'upcoming',
    created_at: '2026-09-10T10:00:00Z',
    registrations_count: 6,
  }
];

export const INITIAL_POSTS: Post[] = [
  {
    id: 'post-1',
    title: 'Cómo preparar tu primer torneo de ajedrez: Guía práctica',
    slug: 'como-preparar-primer-torneo-ajedrez',
    excerpt: 'Consejos esenciales sobre manejo del reloj, anotación de partidas y control emocional en competencia para jugadores de todas las edades.',
    content: `Competir por primera vez en un torneo de ajedrez es un hito emocionante para cualquier jugador. En el Club Deportivo de Ajedrez Capablanca Sabaneta preparamos a nuestros deportistas tanto en el rigor técnico como en la fortaleza mental.

### 1. El uso del reloj con incremento
En la mayoría de los torneos modernos se utiliza el sistema Fischer (por ejemplo, 15 minutos + 10 segundos de incremento por jugada). La clave está en no apresurarse en las primeras diez jugadas: juega con naturalidad las aperturas que has entrenado en el club.

### 2. La anotación de partidas (Planilla)
Anotar no es un trámite: es tu diario de aprendizaje. Cada partida anotada te permite sentarte luego con tu entrenador en el CC Aves María para analizar los momentos críticos y detectar oportunidades tácticas desaprovechadas.

### 3. La actitud deportiva
En el ajedrez no se pierde: se gana o se aprende. El saludo inicial con la mano y la felicitación al rival al concluir son sellos irrenunciables de los deportistas de la familia Capablanca.`,
    cover_image: 'assets/img/club-galeria-04.webp',
    category: 'Formativo',
    published: true,
    published_at: '2026-09-02T12:00:00Z',
    created_at: '2026-09-02T12:00:00Z',
  },
  {
    id: 'post-2',
    title: 'Capablanca Sabaneta brilla en el torneo interclubes',
    slug: 'capablanca-sabaneta-brilla-interclubes',
    excerpt: 'Nuestra delegación infantil y juvenil cosechó 5 podios en una jornada memorable de ajedrez en Antioquia.',
    content: `Con una destacada participación de más de 20 deportistas, el Club de Ajedrez Capablanca Sabaneta demostró el fruto del entrenamiento constante. En el marco del campeonato regional disputado este fin de semana, nuestros alumnos obtuvieron primeros puestos en categorías Sub-8 y Sub-12.

Felicitamos a todos los alumnos, familias y al cuerpo técnico del club por su acompañamiento permanente. ¡Seguimos formando campeones dentro y fuera del tablero!`,
    cover_image: 'assets/img/equipo-infantil-trofeos.webp',
    category: 'Torneos',
    published: true,
    published_at: '2026-09-08T12:00:00Z',
    created_at: '2026-09-08T12:00:00Z',
  },
  {
    id: 'post-3',
    title: 'El valor formativo del ajedrez en la infancia y juventud',
    slug: 'valor-formativo-ajedrez-infancia',
    excerpt: 'Más allá del tablero: cómo el ajedrez fortalece la toma de decisiones, la concentración y la disciplina cotidiana.',
    content: `Aprender ajedrez en edades tempranas estimula la capacidad analítica, enseña a prever consecuencias antes de actuar y forja la paciencia. En nuestro club concebimos el deporte como una herramienta de formación integral para la vida.`,
    cover_image: 'assets/img/ninos-celebrando.webp',
    category: 'Educación',
    published: true,
    published_at: '2026-09-12T12:00:00Z',
    created_at: '2026-09-12T12:00:00Z',
  }
];

export const INITIAL_DOCUMENTS: ClubDocument[] = [
  {
    id: 'doc-1',
    title: 'Reglamento Interno y Código de Convivencia 2026',
    description: 'Normativa general del club, derechos y deberes del deportista afiliado y protocolo ético en competencias.',
    file_url: '#',
    file_type: 'pdf',
    file_size: '1.8 MB',
    category: 'Reglamento',
    min_role: 'student',
    downloads_count: 42,
    created_at: '2026-08-15T00:00:00Z',
  },
  {
    id: 'doc-2',
    title: 'Manual de Fundamentos Tácticos: Clavadas y Horquillas',
    description: 'Cuaderno de 60 ejercicios prácticos para nivel iniciación e intermedio con hoja de soluciones guiadas.',
    file_url: '#',
    file_type: 'pdf',
    file_size: '3.4 MB',
    category: 'Material de Estudio',
    min_role: 'student',
    downloads_count: 78,
    created_at: '2026-08-20T00:00:00Z',
  },
  {
    id: 'doc-3',
    title: 'Antología de 50 Partidas Inmortales de José Raúl Capablanca',
    description: 'Archivo PGN completo con partidas analizadas del genio cubano, ideal para ChessBase, Lichess o Chess.com.',
    file_url: '#',
    file_type: 'pgn',
    file_size: '420 KB',
    category: 'Partidas PGN',
    min_role: 'student',
    downloads_count: 115,
    created_at: '2026-09-01T00:00:00Z',
  },
  {
    id: 'doc-4',
    title: 'Circular Informativa: Calendario de Torneos y Uniformidad',
    description: 'Horarios de clases magistrales del mes y especificaciones del uniforme oficial del club para torneos federados.',
    file_url: '#',
    file_type: 'pdf',
    file_size: '950 KB',
    category: 'Circulares',
    min_role: 'student',
    downloads_count: 36,
    created_at: '2026-09-05T00:00:00Z',
  }
];

export const INITIAL_GALLERY: GalleryItem[] = [
  { id: 'g-1', src: 'assets/img/equipo-infantil-trofeos.webp', alt: 'Categoría infantil del Club Capablanca Sabaneta posando con sus trofeos tras una premiación', caption: 'Premiación categoría infantil', category: 'infantil', order_index: 1 },
  { id: 'g-2', src: 'assets/img/delegacion-escalinatas.webp', alt: 'Delegación completa del club con familias y entrenadores en las escalinatas antes de un torneo', caption: 'Delegación completa', category: 'delegacion', order_index: 2 },
  { id: 'g-3', src: 'assets/img/campeon-sub8.webp', alt: 'Alumnos y entrenadores celebrando con el trofeo de Campeón Sub-8 y un reloj de ajedrez', caption: 'Campeón Sub-8', category: 'torneos', order_index: 3 },
  { id: 'g-4', src: 'assets/img/equipo-adultos-torneo.webp', alt: 'Equipo de adultos del club con el uniforme oficial durante un torneo abierto', caption: 'Equipo de adultos en competencia', category: 'adultos', order_index: 4 },
  { id: 'g-5', src: 'assets/img/delegacion-coliseo.webp', alt: 'Deportistas del club en el coliseo durante una jornada nocturna de torneo', caption: 'Noche de torneo', category: 'torneos', order_index: 5 },
  { id: 'g-6', src: 'assets/img/ninos-celebrando.webp', alt: 'Niños del club celebrando con las manos en alto en la calle', caption: 'La familia Capablanca', category: 'comunidad', order_index: 6 },
  { id: 'g-7', src: 'assets/img/premiacion-aves-maria.webp', alt: 'Jugadores del club en la premiación de un torneo en el Parque Comercial Aves María', caption: 'Torneo en Aves María', category: 'torneos', order_index: 7 },
  { id: 'g-8', src: 'assets/img/club-galeria-04.webp', alt: 'Delegación del club frente al mural de ajedrez de la sede', caption: 'En nuestra sede', category: 'sede', order_index: 8 },
  { id: 'g-9', src: 'assets/img/entrenadores-alumno.webp', alt: 'Dos entrenadores del club acompañando a un alumno que sostiene su trofeo', caption: 'Acompañamiento personalizado', category: 'entrenamiento', order_index: 9 },
  { id: 'g-10', src: 'assets/img/seleccion-colombia.webp', alt: 'Selección Colombia de ajedrez ante las banderas de los países participantes', caption: 'Ajedrez colombiano', category: 'competencia', order_index: 10 },
  { id: 'g-11', src: 'assets/img/flyer-inscripciones.webp', alt: 'Pieza gráfica oficial del club anunciando inscripciones abiertas', caption: 'Inscripciones abiertas', category: 'anuncios', order_index: 11 },
  { id: 'g-12', src: 'assets/img/logo-capablanca.png', alt: 'Escudo circular del Club Escuela de Ajedrez Capablanca', caption: 'Nuestro escudo oficial', category: 'identidad', order_index: 12 }
];

export const MOCK_ADMIN_PROFILE: UserProfile = {
  id: 'usr-admin-01',
  nombre: 'Director',
  apellido: 'Capablanca',
  usuario: 'admin_capablanca',
  correo: 'admin@ajedrezcapablanca.com',
  telefono: '+57 300 254 5835',
  ciudad: 'Sabaneta',
  role: 'admin',
  categoria_ajedrez: 'Maestro / Entrenador',
  elo_rating: 2150,
  estado: 'active',
  created_at: '2024-01-01T00:00:00Z',
};

export const MOCK_MEMBER_PROFILE: UserProfile = {
  id: 'usr-member-01',
  nombre: 'Santiago',
  apellido: 'Gómez',
  usuario: 'santiago_gomez',
  correo: 'afiliado@ajedrezcapablanca.com',
  telefono: '+57 312 876 5432',
  ciudad: 'Sabaneta',
  edad: 14,
  role: 'student',
  categoria_ajedrez: 'Juvenil Sub-16',
  elo_rating: 1580,
  fide_id: '4452190',
  estado: 'active',
  created_at: '2025-02-10T00:00:00Z',
};
