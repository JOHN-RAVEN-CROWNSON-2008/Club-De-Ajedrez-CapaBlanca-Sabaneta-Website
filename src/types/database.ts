// Tipos de la Base de Datos en Supabase y de la Aplicación

export type UserRole = 'admin' | 'member' | 'student';
export type UserStatus = 'active' | 'inactive' | 'pending';
export type EventStatus = 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
export type DocumentCategory = 'General' | 'Reglamento' | 'Material de Estudio' | 'Partidas PGN' | 'Circulares' | 'Guía' | 'Formulario de inscripción' | 'Resolución' | 'Acta';
export type RegistrationStatus = 'confirmed' | 'pending' | 'waitlist' | 'attended' | 'cancelled';
export type PaymentStatus = 'pending' | 'approved' | 'rejected';
export type PaymentMethod = 'Nequi' | 'Daviplata' | 'Bancolombia' | 'Efectivo' | 'Otro';

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
  doc_type?: string;
  doc_number?: string;
  municipio?: string;
  role: UserRole;
  categoria_ajedrez?: string;
  fide_id?: string;
  elo_rating?: number;
  avatar_url?: string;
  lichess_username?: string;
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
  file_url?: string;
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
  user_id?: string;
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

export interface MembershipPayment {
  id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  reference_number: string;
  period: string; // ej. "Octubre 2026"
  status: PaymentStatus;
  receipt_url?: string;
  notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  created_at: string;
}

export interface ClassSchedule {
  id: string;
  category: string; // ej. "Iniciación Infantil"
  trainer: string; // ej. "Maestro Capablanca"
  day_of_week: string; // ej. "Miércoles y Viernes"
  time_range: string; // ej. "4:00 PM - 5:30 PM"
  modality: 'Presencial' | 'Online' | 'Híbrida';
  location: string;
  active: boolean;
}

export interface ClubAnnouncement {
  id: string;
  title: string;
  message: string;
  level: 'info' | 'warning' | 'urgent';
  active: boolean;
  target: 'all' | 'public' | 'members';
  created_at: string;
}

export interface TournamentMatch {
  id: string;
  event_id: string;
  round: number;
  board_number: number;
  white_player: string;
  black_player: string;
  result: '1-0' | '0-1' | '1/2-1/2' | '*';
  pgn?: string;
  created_at?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'excused' | 'late';

export interface ClassAttendance {
  id: string;
  schedule_id: string;
  student_name: string;
  user_id?: string;
  session_date: string;
  status: AttendanceStatus;
  notes?: string;
  created_at?: string;
}

export type TrophyType = 'champion' | 'runner_up' | 'third_place' | 'team_medal';

export interface ClubTrophy {
  id: string;
  title: string;
  year: number;
  category: string;
  champion_name: string;
  runner_up?: string;
  trophy_type: TrophyType;
  edition?: string;
  location?: string;
  notes?: string;
  created_at?: string;
}

export type ApplicationStatus = 'pending' | 'contacted' | 'approved' | 'rejected';
export type DocType = 'CC' | 'TI' | 'RC' | 'CE' | 'Pasaporte';

export interface MembershipApplication {
  id: string;
  applicant_name: string;
  applicant_lastname: string;
  doc_type: DocType;
  doc_number: string;
  birth_date?: string;
  age?: number;
  email: string;
  phone: string;
  municipality: string;
  desired_category: string;
  approximate_elo?: number;
  guardian_name?: string;
  guardian_phone?: string;
  health_provider?: string;
  status: ApplicationStatus;
  notes?: string;
  created_at: string;
}

// Vista pública segura para validación de certificados y escalafón sin exponer datos personales
export interface MemberPublicDirectoryItem {
  id: string;
  nombre: string;
  apellido: string;
  usuario?: string;
  ciudad?: string;
  categoria_ajedrez?: string;
  fide_id?: string;
  elo_rating?: number;
  estado: UserStatus;
}

// MODO AI: Proveedores y configuración
export type AIProvider = 
  | 'gemini' 
  | 'anthropic' 
  | 'openai' 
  | 'qwen' 
  | 'zai' 
  | 'deepseek' 
  | 'grok' 
  | 'xiaomi' 
  | 'kimi' 
  | 'tencent';

export interface AIProviderSetting {
  id: string;
  provider: AIProvider;
  enabled: boolean;
  default_model: string;
  secret_ref: string;
  usage_scope: string[];
  monthly_token_budget?: number;
  updated_by?: string;
  updated_at?: string;
}

// Editor de Sitio Ampliado: Bloques Dinámicos de Contenido
export type ContentBlockPage = 'home' | 'club' | 'programas' | 'torneos' | 'contacto' | 'galeria';
export type ContentBlockValueType = 'text' | 'richtext' | 'image' | 'json';

export interface ContentBlock {
  id: string;
  page: ContentBlockPage;
  section_key: string;
  value_type: ContentBlockValueType;
  value: string;
  updated_at?: string;
}

export interface AIProxyRequest {
  feature?: 'blog_writer' | 'moderation' | 'web_editor' | 'general';
  provider?: AIProvider;
  prompt: string;
  systemPrompt?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AIProxyResponse {
  success: boolean;
  text?: string;
  provider?: string;
  model?: string;
  feature?: string;
  error?: string;
  timestamp?: string;
}

