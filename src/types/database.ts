// Tipos de la Base de Datos en Supabase y de la Aplicación

export type UserRole = 'admin' | 'member' | 'student';
export type UserStatus = 'active' | 'inactive' | 'pending';
export type EventStatus = 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
export type DocumentCategory = 'General' | 'Reglamento' | 'Material de Estudio' | 'Partidas PGN' | 'Circulares';
export type RegistrationStatus = 'confirmed' | 'waitlist' | 'cancelled';

export interface UserProfile {
  id: string;
  nombre: string;
  apellido: string;
  usuario: string;
  correo: string;
  edad?: number;
  fecha_nacimiento?: string;
  ciudad?: string;
  telefono?: string;
  role: UserRole;
  categoria_ajedrez?: string;
  fide_id?: string;
  elo_rating?: number;
  avatar_url?: string;
  estado: UserStatus;
  created_at: string;
  updated_at?: string;
}

export interface SiteSettings {
  id: string;
  telefono: string;
  whatsapp: string;
  sede: string;
  ciudad: string;
  instagram: string;
  mapa_url: string;
  horarios: string;
  mensaje_general: string;
  mensaje_inscripcion: string;
  mensaje_clase_prueba: string;
  mensaje_torneos: string;
  anuncio_activo: boolean;
  anuncio_texto: string;
  updated_at?: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  category: string;
  author_id?: string;
  published: boolean;
  published_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface ClubEvent {
  id: string;
  title: string;
  slug?: string;
  description: string;
  event_date: string;
  event_time: string;
  location: string;
  rhythm: string;
  category: string;
  entry_fee: string;
  capacity: number;
  is_open: boolean;
  status: EventStatus;
  created_at: string;
  registrations_count?: number;
}

export interface ClubDocument {
  id: string;
  title: string;
  description: string;
  file_url: string;
  file_type: string;
  file_size: string;
  category: DocumentCategory;
  min_role: UserRole;
  downloads_count: number;
  created_at: string;
}

export interface TournamentRegistration {
  id: string;
  event_id: string;
  user_id: string;
  notes?: string;
  status: RegistrationStatus;
  created_at: string;
  event?: ClubEvent;
  profile?: UserProfile;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  status: 'unread' | 'read' | 'archived' | 'replied';
  created_at: string;
}

export interface GalleryItem {
  id: string;
  src: string;
  alt: string;
  caption: string;
  category?: string;
  order_index?: number;
  created_at?: string;
}
