import {
  SiteSettings, Post, ClubEvent, ClubDocument, GalleryItem, UserProfile,
  MembershipPayment, ClassSchedule, ClubAnnouncement, TournamentMatch, TournamentRegistration,
  ClassAttendance, ClubTrophy
} from '../types/database';

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

export const INITIAL_SCHEDULES: ClassSchedule[] = [
  { id: 'sch-1', category: 'Iniciación Infantil (4 a 8 años)', trainer: 'Prof. Andrés Montoya', day_of_week: 'Martes y Jueves', time_range: '4:00 PM - 5:30 PM', modality: 'Presencial', location: 'Sede CC Aves María, piso 3', active: true },
  { id: 'sch-2', category: 'Semillero Sub-12', trainer: 'Prof. Andrés Montoya', day_of_week: 'Miércoles y Viernes', time_range: '4:00 PM - 6:00 PM', modality: 'Presencial', location: 'Sede CC Aves María, piso 3', active: true },
  { id: 'sch-3', category: 'Desarrollo Juvenil Sub-16', trainer: 'Maestro Carlos Rúa', day_of_week: 'Lunes y Miércoles', time_range: '6:00 PM - 8:00 PM', modality: 'Híbrida', location: 'Sede CC Aves María / Zoom', active: true },
  { id: 'sch-4', category: 'Adultos & Aficionados', trainer: 'Maestro Carlos Rúa', day_of_week: 'Sábados', time_range: '10:00 AM - 1:00 PM', modality: 'Presencial', location: 'Sede CC Aves María, piso 3', active: true },
  { id: 'sch-5', category: 'Alta Competencia Departamental', trainer: 'Maestro Invitado FIDE', day_of_week: 'Sábados', time_range: '2:00 PM - 6:00 PM', modality: 'Presencial', location: 'Sede CC Aves María, piso 3', active: true },
];

export const INITIAL_PAYMENTS: MembershipPayment[] = [
  {
    id: 'pay-1',
    user_id: 'usr-member-01',
    user_name: 'Santiago Gómez',
    user_email: 'afiliado@ajedrezcapablanca.com',
    amount: 120000,
    payment_date: '2026-09-02',
    payment_method: 'Bancolombia',
    reference_number: 'BC-992813',
    period: 'Septiembre 2026',
    status: 'approved',
    notes: 'Mensualidad grupo Juvenil Sub-16',
    created_at: '2026-09-02T10:30:00Z',
  }
];

export const INITIAL_ANNOUNCEMENTS: ClubAnnouncement[] = [
  {
    id: 'ann-1',
    title: '¡Inscripciones Abiertas Segundo Semestre 2026!',
    message: 'Cupos disponibles para iniciación infantil y grupos de adultos. Agenda tu clase diagnóstica sin costo.',
    level: 'info',
    active: true,
    target: 'all',
    created_at: '2026-09-01T00:00:00Z',
  }
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

export const INITIAL_MATCHES: TournamentMatch[] = [
  {
    id: 'mat-1',
    event_id: 'ev-1',
    round: 1,
    board_number: 1,
    white_player: 'Santiago Gómez (1580)',
    black_player: 'Andrés Arboleda (1520)',
    result: '1-0',
    pgn: '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7 11. c4 c6 12. cxb5 axb5 13. Nc3 Bb7 14. Bg5 b4 15. Nb1 h6 16. Bh4 c5 17. dxe5 Nxe4 18. Bxe7 Qxe7 19. exd6 Qf6 20. Nbd2 Nxd6 21. Nc4 Nxc4 22. Bxc4 Nb6 23. Ne5 Rae8 24. Bxf7+ Rxf7 25. Nxf7 Rxe1+ 26. Qxe1 Kxf7 27. Qe3 Qg5 28. Qxg5 hxg5 29. b3 Ke6 30. a3 Kd6 31. axb4 cxb4 32. Ra5 Nd5 33. f3 Bc8 34. Kf2 Bf5 35. Ra7 g6 36. Ra6+ Kc5 37. Ke1 Bc2 38. Kd2 Bxb3 39. Rxg6 Bc4 40. Rxg5 b3 41. h4 Kb4 42. Rg8 Nb6 43. Rb8 Ka5 44. h5 Bf7 45. h6 Bg6 46. Kc3 1-0',
  },
  {
    id: 'mat-2',
    event_id: 'ev-1',
    round: 1,
    board_number: 2,
    white_player: 'Mateo Valencia (1640)',
    black_player: 'David Rendón (1490)',
    result: '1/2-1/2',
    pgn: '1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Nf3 Be7 5. Bg5 O-O 6. e3 h6 7. Bh4 b6 8. cxd5 Nxd5 9. Bxe7 Qxe7 10. Nxd5 exd5 11. Rc1 Be6 12. Qa4 c5 13. Qa3 Rc8 14. Be2 Nd7 15. O-O Kf8 16. Ba6 Rc7 17. Rc3 c4 18. Qxe7+ Kxe7 19. b3 Nb8 20. Bb5 a6 21. Ba4 b5 22. bxc4 bxa4 23. c5 Nc6 24. Ra3 Rb8 25. Rxa4 a5 26. Ra3 Rb2 27. h3 Rcb7 28. Rc1 Rb1 29. Rxb1 Rxb1+ 30. Kh2 Rb2 31. Kg3 f6 32. Ne1 Bf5 33. Nd3 Bxd3 34. Rxd3 Rxa2 35. Rb3 Nb4 36. f3 Kd7 37. e4 Kc6 38. exd5+ Kxd5 39. Re3 Kxd4 40. Re7 g5 41. Re6 Kxc5 42. Rxf6 a4 43. Rxh6 a3 44. Rg6 Kb5 45. Rxg5+ Ka4 46. Rg8 Rd2 47. Ra8+ Kb3 48. h4 a2 49. h5 Rd4 50. Rxa2 Kxa2 51. f4 Kb3 52. h6 Rd6 53. Kg4 Rxh6 54. Kg5 Rh8 55. g4 Kc4 56. f5 Kd5 57. Kf6 Kd6 58. g5 Nd5+ 59. Kg7 Rh1 60. f6 Rg1 61. g6 Nf4 62. f7 Rxg6+ 63. Kh7 Rf6 64. Kg7 Ke7 65. f8=Q+ Rxf8 1/2-1/2',
  }
];

export const INITIAL_REGISTRATIONS: TournamentRegistration[] = [
  {
    id: 'reg-1',
    event_id: 'ev-1',
    user_id: 'usr-member-01',
    status: 'confirmed',
    notes: 'Pago mensualidad al día',
    created_at: '2026-09-10T14:20:00Z',
    profile: MOCK_MEMBER_PROFILE,
  },
  {
    id: 'reg-2',
    event_id: 'ev-1',
    user_id: 'usr-member-02',
    status: 'confirmed',
    notes: 'Confirmado por transferencia',
    created_at: '2026-09-11T11:00:00Z',
    profile: {
      id: 'usr-member-02',
      nombre: 'Andrés',
      apellido: 'Arboleda',
      usuario: 'andres_arboleda',
      correo: 'andres.arboleda@gmail.com',
      telefono: '+57 310 445 9901',
      ciudad: 'Sabaneta',
      role: 'student',
      categoria_ajedrez: 'Juvenil Sub-16',
      elo_rating: 1520,
      fide_id: '4452205',
      estado: 'active',
      created_at: '2025-03-01T00:00:00Z',
    }
  },
  {
    id: 'reg-3',
    event_id: 'ev-1',
    user_id: 'usr-member-03',
    status: 'confirmed',
    notes: 'Inscripción semillero club',
    created_at: '2026-09-12T09:30:00Z',
    profile: {
      id: 'usr-member-03',
      nombre: 'Mateo',
      apellido: 'Valencia',
      usuario: 'mateo_valencia',
      correo: 'mateo.valencia@ajedrez.com',
      telefono: '+57 301 789 1234',
      ciudad: 'Envigado',
      role: 'student',
      categoria_ajedrez: 'Sub-18',
      elo_rating: 1640,
      fide_id: '4452310',
      estado: 'active',
      created_at: '2025-01-15T00:00:00Z',
    }
  },
  {
    id: 'reg-4',
    event_id: 'ev-2',
    user_id: 'usr-member-04',
    status: 'pending',
    notes: 'Pendiente confirmación categoría',
    created_at: '2026-09-13T16:45:00Z',
    profile: {
      id: 'usr-member-04',
      nombre: 'Valentina',
      apellido: 'Restrepo',
      usuario: 'valentina_restrepo',
      correo: 'valentina.restrepo@ajedrez.com',
      telefono: '+57 311 234 5678',
      ciudad: 'Sabaneta',
      role: 'student',
      categoria_ajedrez: 'Semillero Sub-12',
      elo_rating: 1390,
      fide_id: '4452420',
      estado: 'active',
      created_at: '2025-04-10T00:00:00Z',
    }
  }
];

export const INITIAL_MEMBERS: UserProfile[] = [
  MOCK_ADMIN_PROFILE,
  MOCK_MEMBER_PROFILE,
  {
    id: 'usr-member-02',
    nombre: 'Andrés',
    apellido: 'Arboleda',
    usuario: 'andres_arboleda',
    correo: 'andres.arboleda@gmail.com',
    telefono: '+57 310 445 9901',
    ciudad: 'Sabaneta',
    role: 'student',
    categoria_ajedrez: 'Juvenil Sub-16',
    elo_rating: 1520,
    fide_id: '4452205',
    estado: 'active',
    created_at: '2025-03-01T00:00:00Z',
  },
  {
    id: 'usr-member-03',
    nombre: 'Mateo',
    apellido: 'Valencia',
    usuario: 'mateo_valencia',
    correo: 'mateo.valencia@ajedrez.com',
    telefono: '+57 301 789 1234',
    ciudad: 'Envigado',
    role: 'student',
    categoria_ajedrez: 'Sub-18',
    elo_rating: 1640,
    fide_id: '4452310',
    estado: 'active',
    created_at: '2025-01-15T00:00:00Z',
  },
  {
    id: 'usr-member-04',
    nombre: 'Valentina',
    apellido: 'Restrepo',
    usuario: 'valentina_restrepo',
    correo: 'valentina.restrepo@ajedrez.com',
    telefono: '+57 311 234 5678',
    ciudad: 'Sabaneta',
    role: 'student',
    categoria_ajedrez: 'Semillero Sub-12',
    elo_rating: 1390,
    fide_id: '4452420',
    estado: 'active',
    created_at: '2025-04-10T00:00:00Z',
  }
];

export const INITIAL_ATTENDANCE: ClassAttendance[] = [
  {
    id: 'att-1',
    schedule_id: 'sch-2',
    student_name: 'Santiago Gómez',
    user_id: 'usr-member-01',
    session_date: '2026-09-11',
    status: 'present',
    notes: 'Puntual, excelente trabajo en táctica de clavadas y finales',
    created_at: '2026-09-11T16:05:00Z',
  },
  {
    id: 'att-2',
    schedule_id: 'sch-2',
    student_name: 'Andrés Arboleda',
    user_id: 'usr-member-02',
    session_date: '2026-09-11',
    status: 'present',
    notes: 'Resolvió con éxito los 5 ejercicios de mate en 2',
    created_at: '2026-09-11T16:05:00Z',
  },
  {
    id: 'att-3',
    schedule_id: 'sch-2',
    student_name: 'Mateo Valencia',
    user_id: 'usr-member-03',
    session_date: '2026-09-11',
    status: 'excused',
    notes: 'Permiso médico presentado ante el cuerpo técnico',
    created_at: '2026-09-11T16:05:00Z',
  },
  {
    id: 'att-4',
    schedule_id: 'sch-2',
    student_name: 'Valentina Restrepo',
    user_id: 'usr-member-04',
    session_date: '2026-09-11',
    status: 'present',
    notes: 'Gran desempeño en partidas de práctica a 15 min',
    created_at: '2026-09-11T16:05:00Z',
  },
  {
    id: 'att-5',
    schedule_id: 'sch-2',
    student_name: 'Santiago Gómez',
    user_id: 'usr-member-01',
    session_date: '2026-09-09',
    status: 'present',
    notes: 'Estudio de técnica de Capablanca: finales de torres',
    created_at: '2026-09-09T16:00:00Z',
  },
  {
    id: 'att-6',
    schedule_id: 'sch-2',
    student_name: 'Valentina Restrepo',
    user_id: 'usr-member-04',
    session_date: '2026-09-09',
    status: 'present',
    notes: 'Participación destacada en tablero mural',
    created_at: '2026-09-09T16:00:00Z',
  },
  {
    id: 'att-7',
    schedule_id: 'sch-2',
    student_name: 'Andrés Arboleda',
    user_id: 'usr-member-02',
    session_date: '2026-09-09',
    status: 'present',
    notes: 'Análisis de partidas del torneo apertura',
    created_at: '2026-09-09T16:00:00Z',
  },
  {
    id: 'att-8',
    schedule_id: 'sch-2',
    student_name: 'Mateo Valencia',
    user_id: 'usr-member-03',
    session_date: '2026-09-09',
    status: 'present',
    notes: 'Puntual y concentrado',
    created_at: '2026-09-09T16:00:00Z',
  }
];

export const INITIAL_TROPHIES: ClubTrophy[] = [
  {
    id: 'tr-1',
    title: 'Torneo Abierto de Ajedrez Rápido Fiestas de Sabaneta',
    year: 2025,
    category: 'Categoría Abierta',
    champion_name: 'Santiago Gómez',
    runner_up: 'Andrés Arboleda',
    trophy_type: 'champion',
    edition: 'XII Edición Anual',
    location: 'CC Aves María, Sabaneta',
    notes: 'Gran final decidida en desempate Armagedón con invicto en 7 rondas.',
    created_at: '2025-10-12T18:00:00Z',
  },
  {
    id: 'tr-2',
    title: 'Festival Departamental de Semilleros Sub-12',
    year: 2025,
    category: 'Semillero Infantil Sub-12',
    champion_name: 'Valentina Restrepo',
    runner_up: 'David Rendón',
    trophy_type: 'champion',
    edition: 'Fase Valle de Aburrá',
    location: 'Liga de Ajedrez de Antioquia, Medellín',
    notes: 'Puntaje perfecto de 6 puntos en 6 rondas, obteniendo cupo al Nacional.',
    created_at: '2025-08-20T17:30:00Z',
  },
  {
    id: 'tr-3',
    title: 'Campeonato Departamental de Blitz Relámpago',
    year: 2024,
    category: 'Categoría Blitz 3+2',
    champion_name: 'Mateo Valencia',
    runner_up: 'Carlos Mario Peña',
    trophy_type: 'champion',
    edition: 'Edición Departamental 2024',
    location: 'Sabaneta, Antioquia',
    notes: 'Notable actuación con un performance rating superior a 2100 Elo.',
    created_at: '2024-11-15T19:00:00Z',
  },
  {
    id: 'tr-4',
    title: 'Copa Interclubes del Sur del Valle de Aburrá',
    year: 2024,
    category: 'Torneo por Equipos Mayores',
    champion_name: 'Equipo Capablanca Sabaneta Élite',
    runner_up: 'Club de Ajedrez Envigado',
    trophy_type: 'team_medal',
    edition: 'Copa Confraternidad 2024',
    location: 'Sede CC Aves María',
    notes: 'Victoria por equipos 3.5 a 0.5 en la ronda final decisiva.',
    created_at: '2024-06-30T16:00:00Z',
  },
  {
    id: 'tr-5',
    title: 'Torneo Juvenil San Juan Bautista de Sabaneta',
    year: 2023,
    category: 'Juvenil Sub-16',
    champion_name: 'Santiago Gómez',
    runner_up: 'Mateo Valencia',
    trophy_type: 'champion',
    edition: 'Edición Tradicional 2023',
    location: 'Parque Principal de Sabaneta',
    notes: 'Torneo al aire libre con más de 48 deportistas del municipio.',
    created_at: '2023-06-24T15:00:00Z',
  }
];




