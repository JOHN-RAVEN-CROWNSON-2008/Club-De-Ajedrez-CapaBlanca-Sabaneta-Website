import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  INITIAL_SETTINGS, INITIAL_EVENTS, INITIAL_POSTS, INITIAL_DOCUMENTS,
  MOCK_MEMBER_PROFILE, MOCK_ADMIN_PROFILE, INITIAL_PAYMENTS, INITIAL_SCHEDULES,
  INITIAL_ANNOUNCEMENTS, INITIAL_MATCHES, INITIAL_GALLERY, INITIAL_REGISTRATIONS, INITIAL_MEMBERS
} from '../../lib/initialData';
import {
  SiteSettings, ClubEvent, Post, ClubDocument, UserProfile, ContactMessage,
  MembershipPayment, ClassSchedule, ClubAnnouncement, TournamentMatch,
  GalleryItem, TournamentRegistration
} from '../../types/database';
import {
  ShieldCheck, LayoutDashboard, Globe, Trophy, BookOpen, FileText,
  Users, Mail, LogOut, Plus, Trash2, Save, CheckCircle2, AlertCircle,
  CreditCard, Calendar, Megaphone, Download, Search, Check, X,
  Swords, Eye, Camera, Award, Edit, CheckSquare
} from 'lucide-react';
import { PgnViewerModal } from '../../components/common/PgnViewerModal';
import { AffiliationCertificateModal } from '../../components/common/AffiliationCertificateModal';

export const AdminDashboardView: React.FC = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState<
    'overview' | 'content' | 'events' | 'blog' | 'documents' | 'gallery' | 'members' | 'payments' | 'schedules' | 'announcements' | 'messages'
  >('overview');

  const [settings, setSettings] = useState<SiteSettings>(INITIAL_SETTINGS);
  const [events, setEvents] = useState<ClubEvent[]>(INITIAL_EVENTS);
  const [matches, setMatches] = useState<TournamentMatch[]>(INITIAL_MATCHES);
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>(INITIAL_REGISTRATIONS);
  const [gallery, setGallery] = useState<GalleryItem[]>(INITIAL_GALLERY);
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [documents, setDocuments] = useState<ClubDocument[]>(INITIAL_DOCUMENTS);
  const [members, setMembers] = useState<UserProfile[]>(INITIAL_MEMBERS);
  const [payments, setPayments] = useState<MembershipPayment[]>(INITIAL_PAYMENTS);
  const [schedules, setSchedules] = useState<ClassSchedule[]>(INITIAL_SCHEDULES);
  const [announcements, setAnnouncements] = useState<ClubAnnouncement[]>(INITIAL_ANNOUNCEMENTS);
  const [messages, setMessages] = useState<ContactMessage[]>([
    {
      id: 'msg-1',
      name: 'Carlos Montoya',
      email: 'carlos.montoya@gmail.com',
      phone: '315 889 0012',
      subject: 'Inscripción a Clases',
      message: 'Buenas tardes, quisiera información para matricular a mi hijo de 7 años en las clases de los sábados.',
      status: 'unread',
      created_at: new Date().toISOString(),
    }
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [notice, setNotice] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Modales
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '', description: '', event_date: '', event_time: '03:00 PM',
    location: 'Sede CC Aves María, Sabaneta', rhythm: 'Blitz 3+2', category: 'Abierto',
    entry_fee: 'Gratis afiliados / $20.000 externos',
  });

  const [showPostModal, setShowPostModal] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '', excerpt: '', content: '', category: 'Formativo',
    cover_image: 'assets/img/club-galeria-04.webp',
  });

  const [showDocModal, setShowDocModal] = useState(false);
  const [newDoc, setNewDoc] = useState({
    title: '', description: '', category: 'Material de Estudio' as const,
    file_type: 'pdf', file_size: '2.1 MB', file_url: '#',
  });

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    category: '', trainer: 'Prof. Andrés Montoya', day_of_week: '', time_range: '',
    modality: 'Presencial' as const, location: 'Sede CC Aves María, piso 3',
  });

  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '', message: '', level: 'info' as const, target: 'all' as const,
  });

  const [showMatchModal, setShowMatchModal] = useState(false);
  const [selectedTournamentFilter, setSelectedTournamentFilter] = useState<string>('all');
  const [newMatch, setNewMatch] = useState<{
    event_id: string;
    round: number;
    board_number: number;
    white_player: string;
    black_player: string;
    result: '1-0' | '0-1' | '1/2-1/2' | '*';
    pgn: string;
  }>({
    event_id: '',
    round: 1,
    board_number: 1,
    white_player: '',
    black_player: '',
    result: '*',
    pgn: '',
  });
  const [activePgnMatch, setActivePgnMatch] = useState<TournamentMatch | null>(null);

  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [newGalleryItem, setNewGalleryItem] = useState({
    src: '', alt: '', caption: '', category: 'torneos', order_index: 1,
  });

  const [editingMember, setEditingMember] = useState<UserProfile | null>(null);
  const [certificateMember, setCertificateMember] = useState<UserProfile | null>(null);

  // Validar permisos
  useEffect(() => {
    if (!user) {
      navigate('/admin/login');
    } else if (role !== 'admin' && user.role !== 'admin') {
      navigate('/afiliados');
    }
  }, [user, role, navigate]);

  // Cargar datos de Supabase si está disponible
  useEffect(() => {
    async function fetchAdminData() {
      if (!isSupabaseConfigured()) return;

      try {
        const { data: setts } = await supabase.from('site_settings').select('*').single();
        if (setts) setSettings(setts as SiteSettings);

        const { data: evts } = await supabase.from('events').select('*').order('created_at', { ascending: false });
        if (evts) setEvents(evts as ClubEvent[]);

        const { data: mtchs } = await supabase.from('tournament_matches').select('*').order('board_number', { ascending: true });
        if (mtchs && mtchs.length > 0) setMatches(mtchs as TournamentMatch[]);

        const { data: gal } = await supabase.from('gallery').select('*').order('order_index', { ascending: true });
        if (gal && gal.length > 0) setGallery(gal as GalleryItem[]);

        const { data: regs } = await supabase.from('tournament_registrations').select('*').order('created_at', { ascending: false });
        if (regs && regs.length > 0) setRegistrations(regs as TournamentRegistration[]);

        const { data: pst } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
        if (pst) setPosts(pst as Post[]);

        const { data: docs } = await supabase.from('documents').select('*');
        if (docs) setDocuments(docs as ClubDocument[]);

        const { data: profs } = await supabase.from('profiles').select('*');
        if (profs && profs.length > 0) setMembers(profs as UserProfile[]);

        const { data: pays } = await supabase.from('membership_payments').select('*').order('created_at', { ascending: false });
        if (pays && pays.length > 0) setPayments(pays as MembershipPayment[]);

        const { data: schs } = await supabase.from('class_schedules').select('*');
        if (schs && schs.length > 0) setSchedules(schs as ClassSchedule[]);

        const { data: anns } = await supabase.from('club_announcements').select('*');
        if (anns && anns.length > 0) setAnnouncements(anns as ClubAnnouncement[]);

        const { data: msgs } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
        if (msgs && msgs.length > 0) setMessages(msgs as ContactMessage[]);
      } catch (err) {
        console.error('Error al sincronizar datos de Supabase en Admin:', err);
      }
    }

    fetchAdminData();
  }, []);

  const triggerNotice = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotice({ msg, type });
    setTimeout(() => setNotice(null), 3500);
  };

  // Guardar configuración
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSupabaseConfigured()) {
      await supabase.from('site_settings').upsert({ ...settings, id: 'general' });
    }
    triggerNotice('Configuración del sitio web actualizada con éxito');
  };

  // Torneo
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const eventItem: ClubEvent = {
      id: 'ev-' + Date.now(),
      title: newEvent.title,
      slug: newEvent.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: newEvent.description,
      event_date: newEvent.event_date,
      event_time: newEvent.event_time,
      location: newEvent.location,
      rhythm: newEvent.rhythm,
      category: newEvent.category,
      entry_fee: newEvent.entry_fee,
      capacity: 32,
      is_open: true,
      status: 'upcoming',
      created_at: new Date().toISOString(),
    };
    if (isSupabaseConfigured()) {
      await supabase.from('events').insert(eventItem);
    }
    setEvents([eventItem, ...events]);
    setShowEventModal(false);
    triggerNotice('Torneo creado exitosamente');
  };

  const handleDeleteEvent = async (id: string) => {
    if (isSupabaseConfigured()) {
      await supabase.from('events').delete().eq('id', id);
    }
    setEvents(events.filter((e) => e.id !== id));
    triggerNotice('Torneo eliminado');
  };

  // Emparejamientos & Partidas de Torneo
  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const eventId = newMatch.event_id || (events[0]?.id ?? 'ev-1');
    const matchItem: TournamentMatch = {
      id: 'mat-' + Date.now(),
      event_id: eventId,
      round: Number(newMatch.round) || 1,
      board_number: Number(newMatch.board_number) || 1,
      white_player: newMatch.white_player,
      black_player: newMatch.black_player,
      result: newMatch.result,
      pgn: newMatch.pgn ? newMatch.pgn.trim() : undefined,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('tournament_matches').insert(matchItem);
      } catch (err) {
        console.error('Error guardando partida en Supabase:', err);
      }
    }

    setMatches([matchItem, ...matches]);
    setShowMatchModal(false);
    setNewMatch({ event_id: '', round: 1, board_number: 1, white_player: '', black_player: '', result: '*', pgn: '' });
    triggerNotice('Partida registrada en el sistema');
  };

  const handleUpdateMatchResult = async (id: string, result: '1-0' | '0-1' | '1/2-1/2' | '*') => {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('tournament_matches').update({ result }).eq('id', id);
      } catch (err) {
        console.error('Error actualizando resultado en Supabase:', err);
      }
    }
    setMatches(matches.map((m) => (m.id === id ? { ...m, result } : m)));
    triggerNotice(`Resultado actualizado a ${result}`);
  };

  const handleDeleteMatch = async (id: string) => {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('tournament_matches').delete().eq('id', id);
      } catch (err) {
        console.error('Error eliminando partida en Supabase:', err);
      }
    }
    setMatches(matches.filter((m) => m.id !== id));
    triggerNotice('Partida eliminada');
  };

  // Post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    const postItem: Post = {
      id: 'post-' + Date.now(),
      title: newPost.title,
      slug: newPost.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      excerpt: newPost.excerpt,
      content: newPost.content,
      cover_image: newPost.cover_image,
      category: newPost.category,
      published: true,
      created_at: new Date().toISOString(),
    };
    if (isSupabaseConfigured()) {
      await supabase.from('posts').insert(postItem);
    }
    setPosts([postItem, ...posts]);
    setShowPostModal(false);
    triggerNotice('Artículo publicado');
  };

  const handleDeletePost = async (id: string) => {
    if (isSupabaseConfigured()) {
      await supabase.from('posts').delete().eq('id', id);
    }
    setPosts(posts.filter((p) => p.id !== id));
    triggerNotice('Artículo eliminado');
  };

  // Documento
  const handleCreateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    const docItem: ClubDocument = {
      id: 'doc-' + Date.now(),
      title: newDoc.title,
      description: newDoc.description,
      category: newDoc.category,
      file_type: newDoc.file_type,
      file_size: newDoc.file_size,
      file_url: newDoc.file_url,
      min_role: 'student',
      downloads_count: 0,
      created_at: new Date().toISOString(),
    };
    if (isSupabaseConfigured()) {
      await supabase.from('documents').insert(docItem);
    }
    setDocuments([docItem, ...documents]);
    setShowDocModal(false);
    triggerNotice('Documento añadido');
  };

  const handleDeleteDoc = async (id: string) => {
    if (isSupabaseConfigured()) {
      await supabase.from('documents').delete().eq('id', id);
    }
    setDocuments(documents.filter((d) => d.id !== id));
    triggerNotice('Documento eliminado');
  };

  // Galería Multimedia
  const handleCreateGalleryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const item: GalleryItem = {
      id: 'g-' + Date.now(),
      src: newGalleryItem.src,
      alt: newGalleryItem.alt || newGalleryItem.caption,
      caption: newGalleryItem.caption,
      category: newGalleryItem.category,
      order_index: Number(newGalleryItem.order_index) || 1,
      created_at: new Date().toISOString(),
    };
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('gallery').insert(item);
      } catch (err) {
        console.error('Error insertando foto en Supabase:', err);
      }
    }
    setGallery([item, ...gallery]);
    setShowGalleryModal(false);
    setNewGalleryItem({ src: '', alt: '', caption: '', category: 'torneos', order_index: 1 });
    triggerNotice('Fotografía añadida a la galería');
  };

  const handleDeleteGalleryItem = async (id: string) => {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('gallery').delete().eq('id', id);
      } catch (err) {
        console.error('Error eliminando foto en Supabase:', err);
      }
    }
    setGallery(gallery.filter((g) => g.id !== id));
    triggerNotice('Fotografía eliminada de la galería');
  };

  // Inscripciones a Torneo
  const handleUpdateRegistrationStatus = async (id: string, status: 'confirmed' | 'pending' | 'attended' | 'cancelled') => {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('tournament_registrations').update({ status }).eq('id', id);
      } catch (err) {
        console.error('Error actualizando inscripción:', err);
      }
    }
    setRegistrations(registrations.map((r) => (r.id === id ? { ...r, status: status as any } : r)));
    triggerNotice(`Inscripción marcada como ${status}`);
  };

  const handleExportRosterCSV = (eventId: string) => {
    const ev = events.find((e) => e.id === eventId);
    const eventRegs = registrations.filter((r) => r.event_id === eventId);
    const headers = ['ID Registro', 'Torneo', 'Nombre Jugador', 'Correo', 'Teléfono', 'Categoría', 'Elo', 'Estado'];
    const rows = eventRegs.map((r) => {
      const p = r.profile || members.find((m) => m.id === r.user_id);
      return [
        r.id,
        ev?.title || 'Torneo',
        p ? `${p.nombre} ${p.apellido}` : 'Afiliado',
        p?.correo || '',
        p?.telefono || '',
        p?.categoria_ajedrez || '',
        p?.elo_rating || 0,
        r.status,
      ];
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((row) => row.map((f) => `"${f}"`).join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `Nomina_${(ev?.title || 'Torneo').replace(/[^a-z0-9]/gi, '_')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerNotice('Nómina oficial de jugadores descargada en CSV');
  };

  // Guardar Edición de Miembro / Deportista
  const handleSaveMemberProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('profiles').update({
          categoria_ajedrez: editingMember.categoria_ajedrez,
          elo_rating: Number(editingMember.elo_rating),
          fide_id: editingMember.fide_id,
          role: editingMember.role,
          estado: editingMember.estado,
        }).eq('id', editingMember.id);
      } catch (err) {
        console.error('Error actualizando perfil en Supabase:', err);
      }
    }
    setMembers(members.map((m) => (m.id === editingMember.id ? editingMember : m)));
    setEditingMember(null);
    triggerNotice('Ficha deportiva de afiliado actualizada');
  };

  // Horario de clase
  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    const schItem: ClassSchedule = {
      id: 'sch-' + Date.now(),
      category: newSchedule.category,
      trainer: newSchedule.trainer,
      day_of_week: newSchedule.day_of_week,
      time_range: newSchedule.time_range,
      modality: newSchedule.modality,
      location: newSchedule.location,
      active: true,
    };
    if (isSupabaseConfigured()) {
      await supabase.from('class_schedules').insert(schItem);
    }
    setSchedules([...schedules, schItem]);
    setShowScheduleModal(false);
    triggerNotice('Horario de entrenamiento añadido');
  };

  // Anuncio Prioritario
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    const annItem: ClubAnnouncement = {
      id: 'ann-' + Date.now(),
      title: newAnnouncement.title,
      message: newAnnouncement.message,
      level: newAnnouncement.level,
      target: newAnnouncement.target,
      active: true,
      created_at: new Date().toISOString(),
    };
    if (isSupabaseConfigured()) {
      await supabase.from('club_announcements').insert(annItem);
    }
    setAnnouncements([annItem, ...announcements]);
    setShowAnnouncementModal(false);
    triggerNotice('Anuncio de alerta activado');
  };

  // Aprobar / Rechazar Pago
  const handleUpdatePaymentStatus = async (paymentId: string, newStatus: 'approved' | 'rejected') => {
    if (isSupabaseConfigured()) {
      await supabase.from('membership_payments').update({ status: newStatus }).eq('id', paymentId);
    }
    setPayments(payments.map((p) => (p.id === paymentId ? { ...p, status: newStatus } : p)));
    triggerNotice(`Pago ${newStatus === 'approved' ? 'Aprobado ✓' : 'Rechazado'}`);
  };

  // Cambiar rol de afiliado
  const handleToggleMemberRole = async (memberId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'student' : 'admin';
    if (isSupabaseConfigured()) {
      await supabase.from('profiles').update({ role: newRole }).eq('id', memberId);
    }
    setMembers(members.map((m) => (m.id === memberId ? { ...m, role: newRole as any } : m)));
    triggerNotice(`Rol actualizado a: ${newRole}`);
  };

  // Exportar Afiliados a CSV
  const handleExportMembersCSV = () => {
    const headers = ['ID', 'Nombre', 'Apellido', 'Usuario', 'Correo', 'Teléfono', 'Ciudad', 'Categoría', 'Elo', 'Rol', 'Estado'];
    const rows = members.map((m) => [
      m.id,
      m.nombre,
      m.apellido,
      m.usuario,
      m.correo,
      m.telefono || '',
      m.ciudad || '',
      m.categoria_ajedrez || '',
      m.elo_rating || 0,
      m.role,
      m.estado,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.map((f) => `"${f}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Afiliados_Capablanca_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerNotice('Archivo CSV de afiliados descargado exitosamente');
  };

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      
      {/* Barra superior de Admin */}
      <header style={{ background: '#111', borderBottom: '1px solid #222', padding: '0.8rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '40px', height: '40px', background: 'var(--gold)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={24} color="#000" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: '#fff' }}>
              Capablanca CMS
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--gold)' }}>
              Panel de Control Administrativo Avanzado
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/" target="_blank" className="btn btn--ghost btn--sm">
            Ver Web en vivo
          </Link>
          <button
            onClick={() => logout().then(() => navigate('/admin/login'))}
            className="btn btn--sm"
            style={{ background: '#2e1212', color: '#ff8a80', border: '1px solid #b71c1c', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <LogOut size={14} />
            <span>Salir</span>
          </button>
        </div>
      </header>

      {/* Contenedor principal con Sidebar y Contenido */}
      <div style={{ display: 'flex', flex: 1 }}>
        
        {/* Sidebar */}
        <aside style={{ width: '270px', background: '#0e0e0e', borderRight: '1px solid #222', padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {[
            { id: 'overview', label: 'Resumen & Métricas', icon: <LayoutDashboard size={18} /> },
            { id: 'content', label: 'Editor del Sitio Web', icon: <Globe size={18} /> },
            { id: 'events', label: 'Torneos & Eventos', icon: <Trophy size={18} /> },
            { id: 'blog', label: 'Blog & Noticias', icon: <BookOpen size={18} /> },
            { id: 'documents', label: 'Documentos Afiliados', icon: <FileText size={18} /> },
            { id: 'gallery', label: 'Galería Multimedia', icon: <Camera size={18} /> },
            { id: 'members', label: 'Afiliados & Roles', icon: <Users size={18} /> },
            { id: 'payments', label: 'Cuotas & Pagos', icon: <CreditCard size={18} /> },
            { id: 'schedules', label: 'Horarios de Clase', icon: <Calendar size={18} /> },
            { id: 'announcements', label: 'Avisos & Alertas', icon: <Megaphone size={18} /> },
            { id: 'messages', label: 'Bandeja de Contacto', icon: <Mail size={18} /> },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveSection(item.id as any); setSearchTerm(''); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                background: activeSection === item.id ? 'var(--gold)' : 'transparent',
                color: activeSection === item.id ? '#000' : '#aaa',
                fontWeight: activeSection === item.id ? 700 : 500,
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
            >
              {item.icon}
              <span style={{ fontSize: '0.88rem' }}>{item.label}</span>
            </button>
          ))}
        </aside>

        {/* Panel Central */}
        <main style={{ flex: 1, padding: '2.5rem 3rem', background: '#070707', overflowY: 'auto' }}>
          
          {notice && (
            <div
              style={{
                background: notice.type === 'success' ? '#14381e' : '#3a1616',
                border: `1px solid ${notice.type === 'success' ? '#4caf50' : '#b71c1c'}`,
                color: notice.type === 'success' ? '#a5d6a7' : '#ff8a80',
                padding: '0.8rem 1.2rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                marginBottom: '1.5rem',
              }}
            >
              {notice.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{notice.msg}</span>
            </div>
          )}

          {/* 1. SECCIÓN: OVERVIEW */}
          {activeSection === 'overview' && (
            <div>
              <h1 className="display display--gold" style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>
                Panel de Control General
              </h1>
              <p style={{ color: '#888', marginBottom: '2rem' }}>
                Resumen operativo y métricas en tiempo real del Club Deportivo de Ajedrez Capablanca Sabaneta
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div style={{ background: '#141414', border: '1px solid #222', borderRadius: '12px', padding: '1.5rem' }}>
                  <div style={{ color: '#888', fontSize: '0.8rem', textTransform: 'uppercase' }}>Afiliados Totales</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--gold)', marginTop: '0.3rem' }}>{members.length}</div>
                </div>
                <div style={{ background: '#141414', border: '1px solid #222', borderRadius: '12px', padding: '1.5rem' }}>
                  <div style={{ color: '#888', fontSize: '0.8rem', textTransform: 'uppercase' }}>Torneos en Calendario</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', marginTop: '0.3rem' }}>{events.length}</div>
                </div>
                <div style={{ background: '#141414', border: '1px solid #222', borderRadius: '12px', padding: '1.5rem' }}>
                  <div style={{ color: '#888', fontSize: '0.8rem', textTransform: 'uppercase' }}>Artículos de Blog</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', marginTop: '0.3rem' }}>{posts.length}</div>
                </div>
                <div style={{ background: '#141414', border: '1px solid #222', borderRadius: '12px', padding: '1.5rem' }}>
                  <div style={{ color: '#888', fontSize: '0.8rem', textTransform: 'uppercase' }}>Pagos Reportados</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#81c784', marginTop: '0.3rem' }}>{payments.length}</div>
                </div>
              </div>

              <div style={{ background: '#121212', border: '1px solid #222', borderRadius: '14px', padding: '2rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', color: '#fff' }}>
                  Accesos Rápidos de Gestión
                </h3>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <button onClick={() => { setActiveSection('events'); setShowEventModal(true); }} className="btn btn--primary btn--sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Plus size={16} /> Crear Torneo
                  </button>
                  <button onClick={() => { setActiveSection('blog'); setShowPostModal(true); }} className="btn btn--primary btn--sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Plus size={16} /> Redactar Noticia
                  </button>
                  <button onClick={() => { setActiveSection('documents'); setShowDocModal(true); }} className="btn btn--primary btn--sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Plus size={16} /> Añadir Documento
                  </button>
                  <button onClick={() => { setActiveSection('schedules'); setShowScheduleModal(true); }} className="btn btn--primary btn--sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Plus size={16} /> Añadir Horario
                  </button>
                  <button onClick={handleExportMembersCSV} className="btn btn--ghost btn--sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Download size={16} /> Exportar Afiliados (CSV)
                  </button>
                </div>
              </div>

              {/* Top 5 del Escalafón Deportivo del Club */}
              <div style={{ marginTop: '2rem', background: '#121212', border: '1px solid #222', borderRadius: '14px', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.8rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Award size={20} /> Top 5 del Escalafón Deportivo
                    </h3>
                    <p style={{ color: '#888', fontSize: '0.85rem', margin: '0.2rem 0 0' }}>
                      Líderes de ranking Elo del Club Capablanca Sabaneta
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveSection('members')}
                    className="btn btn--ghost btn--sm"
                    style={{ fontSize: '0.8rem' }}
                  >
                    Ver Todos los Afiliados →
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  {[...members]
                    .sort((a, b) => (b.elo_rating || 0) - (a.elo_rating || 0))
                    .slice(0, 5)
                    .map((m, idx) => (
                      <div
                        key={m.id}
                        style={{
                          background: '#181818',
                          border: `1px solid ${idx === 0 ? 'var(--gold)' : '#282828'}`,
                          borderRadius: '10px',
                          padding: '1.2rem',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '0.8rem',
                          position: 'relative',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: idx === 0 ? '#ffd700' : idx === 1 ? '#c0c0c0' : idx === 2 ? '#cd7f32' : '#2a2a2a',
                            color: idx < 3 ? '#000' : '#aaa',
                            fontWeight: 800,
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            #{idx + 1}
                          </span>
                          <span style={{ fontSize: '0.7rem', background: '#252525', color: 'var(--gold)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                            {m.categoria_ajedrez || 'General'}
                          </span>
                        </div>

                        <div>
                          <strong style={{ fontSize: '0.98rem', color: '#fff', display: 'block' }}>
                            {m.nombre} {m.apellido}
                          </strong>
                          <span style={{ fontSize: '0.78rem', color: '#888' }}>
                            @{m.usuario || 'afiliado'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #252525', paddingTop: '0.6rem' }}>
                          <div style={{ fontSize: '0.85rem' }}>
                            <span style={{ color: '#888', fontSize: '0.72rem', display: 'block' }}>Elo Club</span>
                            <strong style={{ color: 'var(--gold)', fontSize: '1.1rem' }}>{m.elo_rating || '—'}</strong>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCertificateMember(m)}
                            className="btn btn--ghost btn--sm"
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem', color: 'var(--gold)', borderColor: 'var(--gold)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                            title="Emitir certificado oficial"
                          >
                            <Award size={12} />
                            <span>Certificado</span>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. SECCIÓN: CONFIGURACIÓN WEB */}
          {activeSection === 'content' && (
            <div style={{ maxWidth: '800px' }}>
              <h1 className="display display--gold" style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>
                Configuración del Sitio Web
              </h1>
              <p style={{ color: '#888', marginBottom: '2rem' }}>
                Edita los datos de contacto, teléfonos, WhatsApp y textos generales de la landing pública
              </p>

              <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ background: '#121212', border: '1px solid #222', borderRadius: '12px', padding: '1.8rem' }}>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--gold)', marginBottom: '1rem' }}>Datos de Contacto y Sede</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#aaa', marginBottom: '0.3rem' }}>Teléfono visible</label>
                      <input
                        type="text"
                        value={settings.telefono}
                        onChange={(e) => setSettings({ ...settings, telefono: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#1c1c1c', border: '1px solid #333', color: '#fff' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#aaa', marginBottom: '0.3rem' }}>WhatsApp Oficial</label>
                      <input
                        type="text"
                        value={settings.whatsapp}
                        onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#1c1c1c', border: '1px solid #333', color: '#fff' }}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#aaa', marginBottom: '0.3rem' }}>Dirección de la Sede</label>
                    <input
                      type="text"
                      value={settings.sede}
                      onChange={(e) => setSettings({ ...settings, sede: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#1c1c1c', border: '1px solid #333', color: '#fff' }}
                    />
                  </div>
                </div>

                <div style={{ background: '#121212', border: '1px solid #222', borderRadius: '12px', padding: '1.8rem' }}>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--gold)', marginBottom: '1rem' }}>Mensajes Preconfigurados de WhatsApp</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#aaa', marginBottom: '0.3rem' }}>Mensaje para Inscripciones</label>
                      <input
                        type="text"
                        value={settings.mensaje_inscripcion}
                        onChange={(e) => setSettings({ ...settings, mensaje_inscripcion: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#1c1c1c', border: '1px solid #333', color: '#fff' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#aaa', marginBottom: '0.3rem' }}>Mensaje para Clase de Prueba</label>
                      <input
                        type="text"
                        value={settings.mensaje_clase_prueba}
                        onChange={(e) => setSettings({ ...settings, mensaje_clase_prueba: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#1c1c1c', border: '1px solid #333', color: '#fff' }}
                      />
                    </div>
                  </div>
                </div>

                <button type="submit" className="btn btn--primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }}>
                  <Save size={18} />
                  <span>Guardar Cambios</span>
                </button>
              </form>
            </div>
          )}

          {/* 3. SECCIÓN: TORNEOS & EVENTOS */}
          {activeSection === 'events' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                  <h1 className="display display--gold" style={{ fontSize: '1.8rem' }}>Gestión de Torneos</h1>
                  <p style={{ color: '#888' }}>Crea, edita o retira torneos del calendario público</p>
                </div>
                <button onClick={() => setShowEventModal(true)} className="btn btn--primary btn--sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Plus size={16} /> Nuevo Torneo
                </button>
              </div>

              {showEventModal && (
                <div style={{ background: '#141414', border: '1px solid #333', borderRadius: '12px', padding: '2rem', marginBottom: '2rem' }}>
                  <h3 style={{ color: 'var(--gold)', marginBottom: '1.2rem' }}>Publicar Nuevo Torneo</h3>
                  <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <input
                        type="text"
                        required
                        placeholder="Título del torneo"
                        value={newEvent.title}
                        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                        style={{ padding: '0.75rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                      />
                      <input
                        type="date"
                        required
                        value={newEvent.event_date}
                        onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
                        style={{ padding: '0.75rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                      <input
                        type="text"
                        placeholder="Ritmo (ej. Blitz 3+2)"
                        value={newEvent.rhythm}
                        onChange={(e) => setNewEvent({ ...newEvent, rhythm: e.target.value })}
                        style={{ padding: '0.75rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                      />
                      <input
                        type="text"
                        placeholder="Categoría (ej. Abierto)"
                        value={newEvent.category}
                        onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                        style={{ padding: '0.75rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                      />
                      <input
                        type="text"
                        placeholder="Valor inscripción"
                        value={newEvent.entry_fee}
                        onChange={(e) => setNewEvent({ ...newEvent, entry_fee: e.target.value })}
                        style={{ padding: '0.75rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                      />
                    </div>
                    <textarea
                      placeholder="Descripción y bases del torneo..."
                      rows={3}
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                      style={{ padding: '0.75rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                    />
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button type="submit" className="btn btn--primary btn--sm">Guardar y Publicar</button>
                      <button type="button" onClick={() => setShowEventModal(false)} className="btn btn--ghost btn--sm">Cancelar</button>
                    </div>
                  </form>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {events.map((evt) => (
                  <div key={evt.id} style={{ background: '#141414', border: '1px solid #222', borderRadius: '12px', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.4rem' }}>
                        <span style={{ background: 'var(--gold)', color: '#000', fontSize: '0.75rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                          {evt.rhythm}
                        </span>
                        <h3 style={{ fontSize: '1.15rem', margin: 0 }}>{evt.title}</h3>
                      </div>
                      <p style={{ color: '#888', fontSize: '0.85rem', margin: 0 }}>
                        Fecha: {evt.event_date} · {evt.location} · {evt.entry_fee}
                      </p>
                    </div>
                    <button onClick={() => handleDeleteEvent(evt.id)} className="btn btn--sm" style={{ background: '#2b1212', color: '#ff8a80', border: '1px solid #b71c1c' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Sub-sección: Emparejamientos & Resultados de Partidas */}
              <div style={{ marginTop: '3rem', borderTop: '1px solid #222', paddingTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Swords size={20} />
                      Emparejamientos & Resultados de Partidas
                    </h2>
                    <p style={{ color: '#888', fontSize: '0.85rem', margin: '0.2rem 0 0' }}>
                      Asigna tableros, anota resultados oficiales en vivo y carga archivos PGN
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Selector de torneo */}
                    <select
                      value={selectedTournamentFilter}
                      onChange={(e) => setSelectedTournamentFilter(e.target.value)}
                      style={{ padding: '0.45rem 0.8rem', borderRadius: '6px', background: '#181818', border: '1px solid #333', color: '#fff', fontSize: '0.82rem' }}
                    >
                      <option value="all">Todos los Torneos</option>
                      {events.map((ev) => (
                        <option key={ev.id} value={ev.id}>{ev.title}</option>
                      ))}
                    </select>

                    <button
                      onClick={() => setShowMatchModal(true)}
                      className="btn btn--primary btn--sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <Plus size={16} /> Registrar Partida / Mesa
                    </button>
                  </div>
                </div>

                {/* Modal de Registro de Partida */}
                {showMatchModal && (
                  <div style={{ background: '#141414', border: '1px solid #333', borderRadius: '12px', padding: '1.8rem', marginBottom: '1.8rem' }}>
                    <h3 style={{ color: 'var(--gold)', marginBottom: '1rem', fontSize: '1.1rem' }}>Registrar Emparejamiento / Partida</h3>
                    <form onSubmit={handleCreateMatch} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.8rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', marginBottom: '0.2rem' }}>Torneo</label>
                          <select
                            value={newMatch.event_id || (events[0]?.id ?? '')}
                            onChange={(e) => setNewMatch({ ...newMatch, event_id: e.target.value })}
                            style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', background: '#1e1e1e', border: '1px solid #333', color: '#fff', fontSize: '0.85rem' }}
                          >
                            {events.map((ev) => (
                              <option key={ev.id} value={ev.id}>{ev.title}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', marginBottom: '0.2rem' }}>Ronda</label>
                          <input
                            type="number"
                            min={1}
                            required
                            value={newMatch.round}
                            onChange={(e) => setNewMatch({ ...newMatch, round: Number(e.target.value) })}
                            style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', background: '#1e1e1e', border: '1px solid #333', color: '#fff', fontSize: '0.85rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', marginBottom: '0.2rem' }}>Mesa / Tablero</label>
                          <input
                            type="number"
                            min={1}
                            required
                            value={newMatch.board_number}
                            onChange={(e) => setNewMatch({ ...newMatch, board_number: Number(e.target.value) })}
                            style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', background: '#1e1e1e', border: '1px solid #333', color: '#fff', fontSize: '0.85rem' }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: '0.8rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', marginBottom: '0.2rem' }}>Jugador Blancas</label>
                          <input
                            type="text"
                            required
                            placeholder="Ej. Santiago Gómez (1580)"
                            value={newMatch.white_player}
                            onChange={(e) => setNewMatch({ ...newMatch, white_player: e.target.value })}
                            style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', background: '#1e1e1e', border: '1px solid #333', color: '#fff', fontSize: '0.85rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', marginBottom: '0.2rem' }}>Jugador Negras</label>
                          <input
                            type="text"
                            required
                            placeholder="Ej. Andrés Arboleda (1520)"
                            value={newMatch.black_player}
                            onChange={(e) => setNewMatch({ ...newMatch, black_player: e.target.value })}
                            style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', background: '#1e1e1e', border: '1px solid #333', color: '#fff', fontSize: '0.85rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', marginBottom: '0.2rem' }}>Resultado</label>
                          <select
                            value={newMatch.result}
                            onChange={(e) => setNewMatch({ ...newMatch, result: e.target.value as any })}
                            style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', background: '#1e1e1e', border: '1px solid #333', color: '#fff', fontSize: '0.85rem' }}
                          >
                            <option value="*">* (En juego)</option>
                            <option value="1-0">1 - 0 (Blancas)</option>
                            <option value="0-1">0 - 1 (Negras)</option>
                            <option value="1/2-1/2">½ - ½ (Tablas)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', marginBottom: '0.2rem' }}>Partida PGN (Opcional)</label>
                        <textarea
                          placeholder="Pega la notación PGN oficial de la partida (ej. 1. e4 e5 2. Nf3 Nc6...)"
                          rows={3}
                          value={newMatch.pgn}
                          onChange={(e) => setNewMatch({ ...newMatch, pgn: e.target.value })}
                          style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', background: '#1e1e1e', border: '1px solid #333', color: '#fff', fontSize: '0.82rem', fontFamily: 'monospace' }}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '0.8rem' }}>
                        <button type="submit" className="btn btn--primary btn--sm">Guardar Partida</button>
                        <button type="button" onClick={() => setShowMatchModal(false)} className="btn btn--ghost btn--sm">Cancelar</button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Lista de Partidas Registradas */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {(() => {
                    const filteredMatches = matches.filter((m) =>
                      selectedTournamentFilter === 'all' || m.event_id === selectedTournamentFilter
                    );

                    if (filteredMatches.length === 0) {
                      return (
                        <div style={{ textAlign: 'center', padding: '2rem', background: '#141414', borderRadius: '8px', border: '1px solid #222', color: '#777', fontSize: '0.9rem' }}>
                          No hay partidas registradas para este torneo aún.
                        </div>
                      );
                    }

                    return filteredMatches.map((m) => {
                      const parentEvent = events.find((e) => e.id === m.event_id);

                      return (
                        <div
                          key={m.id}
                          style={{
                            background: '#131313',
                            border: '1px solid #252525',
                            borderRadius: '10px',
                            padding: '1rem 1.25rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '1rem',
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <span style={{ background: '#222', color: 'var(--gold)', fontSize: '0.72rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                                Mesa {m.board_number} · Ronda {m.round}
                              </span>
                              <span style={{ color: '#777', fontSize: '0.78rem' }}>
                                {parentEvent?.title || 'Torneo'}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#eee', marginTop: '0.2rem' }}>
                              <span>♔ {m.white_player}</span>
                              <span style={{ color: 'var(--gold)', margin: '0 0.5rem', fontWeight: 800 }}>vs</span>
                              <span>♚ {m.black_player}</span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            {/* Botones rápidos de actualización de resultado */}
                            <div style={{ display: 'flex', background: '#1a1a1a', borderRadius: '6px', border: '1px solid #333', overflow: 'hidden' }}>
                              {(['1-0', '1/2-1/2', '0-1', '*'] as const).map((res) => (
                                <button
                                  key={res}
                                  type="button"
                                  onClick={() => handleUpdateMatchResult(m.id, res)}
                                  style={{
                                    background: m.result === res ? 'var(--gold)' : 'transparent',
                                    color: m.result === res ? '#000' : '#888',
                                    fontWeight: m.result === res ? 800 : 500,
                                    border: 'none',
                                    padding: '0.3rem 0.6rem',
                                    fontSize: '0.75rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s',
                                  }}
                                  title={`Marcar ${res}`}
                                >
                                  {res === '1/2-1/2' ? '½-½' : res}
                                </button>
                              ))}
                            </div>

                            {m.pgn && (
                              <button
                                type="button"
                                onClick={() => setActivePgnMatch(m)}
                                className="btn btn--sm btn--ghost"
                                style={{
                                  border: '1px solid var(--gold)',
                                  color: 'var(--gold)',
                                  padding: '0.3rem 0.6rem',
                                  fontSize: '0.75rem',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                }}
                                title="Ver visor interactivo PGN"
                              >
                                <Eye size={13} />
                                <span>Ver PGN</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteMatch(m.id)}
                              className="btn btn--sm"
                              style={{ background: '#291212', color: '#ff8a80', border: '1px solid #b71c1c', padding: '0.35rem 0.6rem' }}
                              title="Eliminar partida"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Sub-sección: Nómina de Preinscritos a Torneos */}
              <div style={{ marginTop: '3rem', borderTop: '1px solid #222', paddingTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Award size={20} />
                      Nómina de Preinscritos a Torneos ({registrations.length})
                    </h2>
                    <p style={{ color: '#888', fontSize: '0.85rem', margin: '0.2rem 0 0' }}>
                      Gestiona la asistencia, confirma pagos y exporta el listado para el software de emparejamiento (Swiss-Manager / Sevilla)
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <button
                      type="button"
                      onClick={() => handleExportRosterCSV(selectedTournamentFilter === 'all' ? (events[0]?.id ?? '') : selectedTournamentFilter)}
                      className="btn btn--sm btn--primary"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <Download size={14} />
                      <span>Exportar Nómina (.csv)</span>
                    </button>
                  </div>
                </div>

                {/* Tabla de Preinscritos */}
                <div style={{ background: '#121212', border: '1px solid #252525', borderRadius: '12px', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: '#181818', borderBottom: '1px solid #2a2a2a', color: '#888', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.05em' }}>
                        <th style={{ padding: '0.8rem 1rem' }}>Deportista</th>
                        <th style={{ padding: '0.8rem 1rem' }}>Categoría & Elo</th>
                        <th style={{ padding: '0.8rem 1rem' }}>Torneo</th>
                        <th style={{ padding: '0.8rem 1rem' }}>Contacto</th>
                        <th style={{ padding: '0.8rem 1rem' }}>Estado</th>
                        <th style={{ padding: '0.8rem 1rem', textAlign: 'right' }}>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const filteredRegs = registrations.filter((r) =>
                          selectedTournamentFilter === 'all' || r.event_id === selectedTournamentFilter
                        );

                        if (filteredRegs.length === 0) {
                          return (
                            <tr>
                              <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                                No hay deportistas inscritos en este torneo aún.
                              </td>
                            </tr>
                          );
                        }

                        return filteredRegs.map((reg) => {
                          const ev = events.find((e) => e.id === reg.event_id);
                          const prof = reg.profile || members.find((m) => m.id === reg.user_id);

                          return (
                            <tr key={reg.id} style={{ borderBottom: '1px solid #1f1f1f' }}>
                              <td style={{ padding: '0.8rem 1rem' }}>
                                <div style={{ fontWeight: 600, color: '#fff' }}>
                                  {prof ? `${prof.nombre} ${prof.apellido}` : 'Deportista Afiliado'}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#777' }}>
                                  @{prof?.usuario || 'afiliado'}
                                </div>
                              </td>
                              <td style={{ padding: '0.8rem 1rem' }}>
                                <div style={{ color: 'var(--gold)', fontWeight: 600 }}>
                                  {prof?.categoria_ajedrez || 'Iniciación'}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#aaa' }}>
                                  Elo: {prof?.elo_rating || 'S/E'} {prof?.fide_id ? `· FIDE: ${prof.fide_id}` : ''}
                                </div>
                              </td>
                              <td style={{ padding: '0.8rem 1rem', color: '#ccc' }}>
                                {ev?.title || 'Torneo General'}
                              </td>
                              <td style={{ padding: '0.8rem 1rem' }}>
                                <div style={{ color: '#aaa' }}>{prof?.correo || 'N/A'}</div>
                                <div style={{ fontSize: '0.75rem', color: '#666' }}>{prof?.telefono || 'Sin tel'}</div>
                              </td>
                              <td style={{ padding: '0.8rem 1rem' }}>
                                <span
                                  style={{
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '4px',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    background: reg.status === 'confirmed' ? '#14381e' : reg.status === 'attended' ? '#1b2f4a' : '#333',
                                    color: reg.status === 'confirmed' ? '#81c784' : reg.status === 'attended' ? '#90caf9' : '#ccc',
                                    border: `1px solid ${reg.status === 'confirmed' ? '#2e7d32' : reg.status === 'attended' ? '#1565c0' : '#444'}`,
                                  }}
                                >
                                  {reg.status === 'confirmed' ? 'Confirmado' : reg.status === 'attended' ? 'En Sala / Asistió' : reg.status}
                                </span>
                              </td>
                              <td style={{ padding: '0.8rem 1rem', textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', gap: '0.3rem' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateRegistrationStatus(reg.id, 'confirmed')}
                                    className="btn btn--sm"
                                    style={{ background: '#1c2e1c', color: '#a5d6a7', border: '1px solid #2e7d32', padding: '0.2rem 0.45rem', fontSize: '0.7rem' }}
                                    title="Confirmar inscripción"
                                  >
                                    Confirmar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateRegistrationStatus(reg.id, 'attended')}
                                    className="btn btn--sm"
                                    style={{ background: '#182538', color: '#90caf9', border: '1px solid #1976d2', padding: '0.2rem 0.45rem', fontSize: '0.7rem' }}
                                    title="Marcar presencia en sala de juego"
                                  >
                                    Presente
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 4. SECCIÓN: BLOG & NOTICIAS */}
          {activeSection === 'blog' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                  <h1 className="display display--gold" style={{ fontSize: '1.8rem' }}>Gestión del Blog</h1>
                  <p style={{ color: '#888' }}>Redacta crónicas y artículos formativos</p>
                </div>
                <button onClick={() => setShowPostModal(true)} className="btn btn--primary btn--sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Plus size={16} /> Redactar Noticia
                </button>
              </div>

              {showPostModal && (
                <div style={{ background: '#141414', border: '1px solid #333', borderRadius: '12px', padding: '2rem', marginBottom: '2rem' }}>
                  <h3 style={{ color: 'var(--gold)', marginBottom: '1.2rem' }}>Nueva Publicación</h3>
                  <form onSubmit={handleCreatePost} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input
                      type="text"
                      required
                      placeholder="Título de la publicación"
                      value={newPost.title}
                      onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                      style={{ padding: '0.75rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <input
                        type="text"
                        placeholder="Categoría (ej. Formativo, Torneos)"
                        value={newPost.category}
                        onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                        style={{ padding: '0.75rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                      />
                      <input
                        type="text"
                        placeholder="Ruta de imagen de portada"
                        value={newPost.cover_image}
                        onChange={(e) => setNewPost({ ...newPost, cover_image: e.target.value })}
                        style={{ padding: '0.75rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                      />
                    </div>
                    <textarea
                      placeholder="Resumen o extracto breve..."
                      rows={2}
                      value={newPost.excerpt}
                      onChange={(e) => setNewPost({ ...newPost, excerpt: e.target.value })}
                      style={{ padding: '0.75rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                    />
                    <textarea
                      placeholder="Contenido completo del artículo..."
                      rows={6}
                      required
                      value={newPost.content}
                      onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                      style={{ padding: '0.75rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                    />
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button type="submit" className="btn btn--primary btn--sm">Publicar Artículo</button>
                      <button type="button" onClick={() => setShowPostModal(false)} className="btn btn--ghost btn--sm">Cancelar</button>
                    </div>
                  </form>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {posts.map((post) => (
                  <div key={post.id} style={{ background: '#141414', border: '1px solid #222', borderRadius: '12px', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 700, textTransform: 'uppercase' }}>
                        {post.category}
                      </span>
                      <h3 style={{ fontSize: '1.15rem', margin: '0.2rem 0' }}>{post.title}</h3>
                      <p style={{ color: '#888', fontSize: '0.85rem', margin: 0 }}>
                        {post.excerpt}
                      </p>
                    </div>
                    <button onClick={() => handleDeletePost(post.id)} className="btn btn--sm" style={{ background: '#2b1212', color: '#ff8a80', border: '1px solid #b71c1c' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. SECCIÓN: DOCUMENTOS */}
          {activeSection === 'documents' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                  <h1 className="display display--gold" style={{ fontSize: '1.8rem' }}>Repositorio de Afiliados</h1>
                  <p style={{ color: '#888' }}>Comparte archivos, PGNs y material didáctico para los socios</p>
                </div>
                <button onClick={() => setShowDocModal(true)} className="btn btn--primary btn--sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Plus size={16} /> Añadir Documento
                </button>
              </div>

              {showDocModal && (
                <div style={{ background: '#141414', border: '1px solid #333', borderRadius: '12px', padding: '2rem', marginBottom: '2rem' }}>
                  <h3 style={{ color: 'var(--gold)', marginBottom: '1.2rem' }}>Añadir Nuevo Recurso</h3>
                  <form onSubmit={handleCreateDoc} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input
                      type="text"
                      required
                      placeholder="Título del documento o material"
                      value={newDoc.title}
                      onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                      style={{ padding: '0.75rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                      <select
                        value={newDoc.category}
                        onChange={(e) => setNewDoc({ ...newDoc, category: e.target.value as any })}
                        style={{ padding: '0.75rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                      >
                        <option value="Material de Estudio">Material de Estudio</option>
                        <option value="Reglamento">Reglamento</option>
                        <option value="Partidas PGN">Partidas PGN</option>
                        <option value="Circulares">Circulares</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Tipo de archivo (pdf, pgn)"
                        value={newDoc.file_type}
                        onChange={(e) => setNewDoc({ ...newDoc, file_type: e.target.value })}
                        style={{ padding: '0.75rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                      />
                      <input
                        type="text"
                        placeholder="Peso aproximado (ej. 2.1 MB)"
                        value={newDoc.file_size}
                        onChange={(e) => setNewDoc({ ...newDoc, file_size: e.target.value })}
                        style={{ padding: '0.75rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                      />
                    </div>
                    <textarea
                      placeholder="Descripción del material..."
                      rows={2}
                      value={newDoc.description}
                      onChange={(e) => setNewDoc({ ...newDoc, description: e.target.value })}
                      style={{ padding: '0.75rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                    />
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button type="submit" className="btn btn--primary btn--sm">Publicar Recurso</button>
                      <button type="button" onClick={() => setShowDocModal(false)} className="btn btn--ghost btn--sm">Cancelar</button>
                    </div>
                  </form>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {documents.map((doc) => (
                  <div key={doc.id} style={{ background: '#141414', border: '1px solid #222', borderRadius: '12px', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 700, textTransform: 'uppercase' }}>
                          {doc.category}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#777' }}>
                          {doc.file_type.toUpperCase()} · {doc.file_size}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.15rem', margin: '0.2rem 0' }}>{doc.title}</h3>
                      <p style={{ color: '#888', fontSize: '0.85rem', margin: 0 }}>{doc.description}</p>
                    </div>
                    <button onClick={() => handleDeleteDoc(doc.id)} className="btn btn--sm" style={{ background: '#2b1212', color: '#ff8a80', border: '1px solid #b71c1c' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECCIÓN: GALERÍA MULTIMEDIA */}
          {activeSection === 'gallery' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
                <div>
                  <h1 className="display display--gold" style={{ fontSize: '1.8rem', margin: 0 }}>
                    Galería Multimedia del Club
                  </h1>
                  <p style={{ color: '#888', margin: 0 }}>
                    Sube fotografías, asigna categorías de visualización y administra la memoria histórica del club
                  </p>
                </div>
                <button onClick={() => setShowGalleryModal(true)} className="btn btn--primary btn--sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Plus size={16} /> Añadir Fotografía
                </button>
              </div>

              {showGalleryModal && (
                <div style={{ background: '#141414', border: '1px solid #333', borderRadius: '12px', padding: '2rem', marginBottom: '2rem' }}>
                  <h3 style={{ color: 'var(--gold)', marginBottom: '1.2rem' }}>Nueva Fotografía para la Galería</h3>
                  <form onSubmit={handleCreateGalleryItem} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                      <input
                        type="text"
                        required
                        placeholder="Ruta o URL de la imagen (ej. assets/img/campeon-sub8.webp)"
                        value={newGalleryItem.src}
                        onChange={(e) => setNewGalleryItem({ ...newGalleryItem, src: e.target.value })}
                        style={{ padding: '0.75rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                      />
                      <select
                        value={newGalleryItem.category}
                        onChange={(e) => setNewGalleryItem({ ...newGalleryItem, category: e.target.value })}
                        style={{ padding: '0.75rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                      >
                        <option value="torneos">Torneos y Competencias</option>
                        <option value="infantil">Categorías Infantiles</option>
                        <option value="adultos">Equipo de Adultos</option>
                        <option value="delegacion">Delegaciones y Viajes</option>
                        <option value="sede">Sede e Instalaciones</option>
                        <option value="comunidad">Comunidad y Familias</option>
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                      <input
                        type="text"
                        required
                        placeholder="Pie de foto / Leyenda descriptiva"
                        value={newGalleryItem.caption}
                        onChange={(e) => setNewGalleryItem({ ...newGalleryItem, caption: e.target.value })}
                        style={{ padding: '0.75rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                      />
                      <input
                        type="number"
                        min={1}
                        placeholder="Orden de visualización (ej. 1)"
                        value={newGalleryItem.order_index}
                        onChange={(e) => setNewGalleryItem({ ...newGalleryItem, order_index: Number(e.target.value) })}
                        style={{ padding: '0.75rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button type="submit" className="btn btn--primary btn--sm">Guardar en Galería</button>
                      <button type="button" onClick={() => setShowGalleryModal(false)} className="btn btn--ghost btn--sm">Cancelar</button>
                    </div>
                  </form>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
                {gallery.map((item) => (
                  <div key={item.id} style={{ background: '#131313', border: '1px solid #222', borderRadius: '10px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ aspectRatio: '16/10', overflow: 'hidden', background: '#0a0a0a' }}>
                      <img src={item.src} alt={item.alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1 }}>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--gold)', textTransform: 'uppercase', fontWeight: 700 }}>
                          {item.category || 'General'}
                        </span>
                        <p style={{ margin: '0.3rem 0 0.8rem', fontSize: '0.85rem', color: '#ddd', fontWeight: 500 }}>
                          {item.caption}
                        </p>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #222', paddingTop: '0.6rem' }}>
                        <span style={{ fontSize: '0.7rem', color: '#666' }}>Orden: #{item.order_index || 1}</span>
                        <button
                          onClick={() => handleDeleteGalleryItem(item.id)}
                          className="btn btn--sm"
                          style={{ background: '#2e1212', color: '#ff8a80', border: '1px solid #b71c1c', padding: '0.25rem 0.5rem' }}
                          title="Eliminar foto"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. SECCIÓN: AFILIADOS & ROLES */}
          {activeSection === 'members' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
                <div>
                  <h1 className="display display--gold" style={{ fontSize: '1.8rem', margin: 0 }}>
                    Control de Afiliados y Roles
                  </h1>
                  <p style={{ color: '#888', margin: 0 }}>
                    Administra los permisos, categorías deportivas y Elo de los miembros
                  </p>
                </div>
                <button onClick={handleExportMembersCSV} className="btn btn--primary btn--sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Download size={16} />
                  <span>Exportar Lista a CSV</span>
                </button>
              </div>

              {/* Modal de Edición de Deportista */}
              {editingMember && (
                <div style={{ background: '#141414', border: '1px solid #333', borderRadius: '12px', padding: '2rem', marginBottom: '2rem' }}>
                  <h3 style={{ color: 'var(--gold)', marginBottom: '1.2rem' }}>
                    Editar Ficha Deportiva: {editingMember.nombre} {editingMember.apellido}
                  </h3>
                  <form onSubmit={handleSaveMemberProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '0.25rem' }}>Categoría de Ajedrez</label>
                        <input
                          type="text"
                          value={editingMember.categoria_ajedrez || ''}
                          onChange={(e) => setEditingMember({ ...editingMember, categoria_ajedrez: e.target.value })}
                          style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '0.25rem' }}>Rating Elo</label>
                        <input
                          type="number"
                          value={editingMember.elo_rating || 0}
                          onChange={(e) => setEditingMember({ ...editingMember, elo_rating: Number(e.target.value) })}
                          style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '0.25rem' }}>ID FIDE Oficial</label>
                        <input
                          type="text"
                          value={editingMember.fide_id || ''}
                          onChange={(e) => setEditingMember({ ...editingMember, fide_id: e.target.value })}
                          style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '0.25rem' }}>Rol en Plataforma</label>
                        <select
                          value={editingMember.role}
                          onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value as any })}
                          style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                        >
                          <option value="student">Afiliado / Alumno</option>
                          <option value="admin">Administrador Directivo</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '0.25rem' }}>Estado de Membresía</label>
                        <select
                          value={editingMember.estado}
                          onChange={(e) => setEditingMember({ ...editingMember, estado: e.target.value as any })}
                          style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                        >
                          <option value="active">Activo</option>
                          <option value="inactive">Inactivo</option>
                          <option value="pending">Pendiente</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
                      <button type="submit" className="btn btn--primary btn--sm">Guardar Ficha</button>
                      <button type="button" onClick={() => setEditingMember(null)} className="btn btn--ghost btn--sm">Cancelar</button>
                    </div>
                  </form>
                </div>
              )}

              {/* Buscador */}
              <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                <Search size={18} color="#666" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="text"
                  placeholder="Buscar por nombre, correo, usuario o categoría..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.6rem', borderRadius: '8px', background: '#141414', border: '1px solid #333', color: '#fff' }}
                />
              </div>

              <div style={{ background: '#141414', border: '1px solid #222', borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: '#1e1e1e', borderBottom: '1px solid #333', color: '#aaa', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                      <th style={{ padding: '1rem' }}>Afiliado</th>
                      <th style={{ padding: '1rem' }}>Correo</th>
                      <th style={{ padding: '1rem' }}>Categoría</th>
                      <th style={{ padding: '1rem' }}>Elo</th>
                      <th style={{ padding: '1rem' }}>Rol</th>
                      <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members
                      .filter((m) =>
                        m.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        m.correo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (m.categoria_ajedrez || '').toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((m) => (
                        <tr key={m.id} style={{ borderBottom: '1px solid #222' }}>
                          <td style={{ padding: '1rem', fontWeight: 600 }}>
                            {m.nombre} {m.apellido}
                            <div style={{ fontSize: '0.75rem', color: '#888' }}>@{m.usuario}</div>
                          </td>
                          <td style={{ padding: '1rem', color: '#ccc' }}>{m.correo}</td>
                          <td style={{ padding: '1rem', color: 'var(--gold)' }}>{m.categoria_ajedrez || 'Iniciación'}</td>
                          <td style={{ padding: '1rem' }}>{m.elo_rating || '—'}</td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: m.role === 'admin' ? '#ffd54f' : '#2e2e2e',
                              color: m.role === 'admin' ? '#000' : '#ccc',
                            }}>
                              {m.role}
                            </span>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                              <button
                                onClick={() => setCertificateMember(m)}
                                className="btn btn--ghost btn--sm"
                                style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--gold)', borderColor: 'var(--gold)' }}
                                title="Generar Certificado Oficial de Afiliación"
                              >
                                <Award size={12} />
                                <span>Certificado</span>
                              </button>
                              <button
                                onClick={() => setEditingMember(m)}
                                className="btn btn--ghost btn--sm"
                                style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                                title="Editar ficha deportiva"
                              >
                                <Edit size={12} />
                                <span>Editar</span>
                              </button>
                              <button
                                onClick={() => handleToggleMemberRole(m.id, m.role)}
                                className="btn btn--ghost btn--sm"
                                style={{ fontSize: '0.75rem' }}
                              >
                                Hacer {m.role === 'admin' ? 'Afiliado' : 'Admin'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 7. SECCIÓN: CUOTAS & PAGOS DE AFILIADOS */}
          {activeSection === 'payments' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                  <h1 className="display display--gold" style={{ fontSize: '1.8rem' }}>Gestor de Cuotas y Pagos</h1>
                  <p style={{ color: '#888' }}>Control de mensualidades y comprobantes reportados por afiliados</p>
                </div>
              </div>

              <div style={{ background: '#141414', border: '1px solid #222', borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: '#1e1e1e', borderBottom: '1px solid #333', color: '#aaa', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                      <th style={{ padding: '1rem' }}>Afiliado</th>
                      <th style={{ padding: '1rem' }}>Periodo</th>
                      <th style={{ padding: '1rem' }}>Monto</th>
                      <th style={{ padding: '1rem' }}>Método & Ref</th>
                      <th style={{ padding: '1rem' }}>Fecha</th>
                      <th style={{ padding: '1rem' }}>Estado</th>
                      <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #222' }}>
                        <td style={{ padding: '1rem', fontWeight: 600 }}>{p.user_name || p.user_id}</td>
                        <td style={{ padding: '1rem', color: 'var(--gold)' }}>{p.period}</td>
                        <td style={{ padding: '1rem', fontWeight: 700 }}>${p.amount.toLocaleString('es-CO')}</td>
                        <td style={{ padding: '1rem', color: '#bbb' }}>{p.payment_method} · {p.reference_number}</td>
                        <td style={{ padding: '1rem', color: '#888' }}>{p.payment_date}</td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{
                            padding: '0.2rem 0.6rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: p.status === 'approved' ? '#1b5e20' : p.status === 'rejected' ? '#b71c1c' : '#f57f17',
                            color: '#fff',
                          }}>
                            {p.status === 'approved' ? 'Aprobado' : p.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          {p.status === 'pending' && (
                            <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                              <button onClick={() => handleUpdatePaymentStatus(p.id, 'approved')} className="btn btn--primary btn--sm" style={{ padding: '0.3rem 0.6rem' }}>
                                <Check size={14} />
                              </button>
                              <button onClick={() => handleUpdatePaymentStatus(p.id, 'rejected')} className="btn btn--ghost btn--sm" style={{ padding: '0.3rem 0.6rem', borderColor: '#b71c1c', color: '#ff8a80' }}>
                                <X size={14} />
                              </button>
                            </div>
                          )}
                          {p.status !== 'pending' && (
                            <span style={{ fontSize: '0.8rem', color: '#666' }}>Procesado</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 8. SECCIÓN: HORARIOS DE CLASE */}
          {activeSection === 'schedules' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                  <h1 className="display display--gold" style={{ fontSize: '1.8rem' }}>Horarios Semanales de Clase</h1>
                  <p style={{ color: '#888' }}>Configura el cronograma de entrenamientos por categoría</p>
                </div>
                <button onClick={() => setShowScheduleModal(true)} className="btn btn--primary btn--sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Plus size={16} /> Añadir Horario
                </button>
              </div>

              {showScheduleModal && (
                <div style={{ background: '#141414', border: '1px solid #333', borderRadius: '12px', padding: '2rem', marginBottom: '2rem' }}>
                  <h3 style={{ color: 'var(--gold)', marginBottom: '1rem' }}>Nuevo Horario de Entrenamiento</h3>
                  <form onSubmit={handleCreateSchedule} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <input
                        type="text"
                        required
                        placeholder="Categoría / Grupo (ej. Semillero Sub-12)"
                        value={newSchedule.category}
                        onChange={(e) => setNewSchedule({ ...newSchedule, category: e.target.value })}
                        style={{ padding: '0.75rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                      />
                      <input
                        type="text"
                        required
                        placeholder="Entrenador a cargo"
                        value={newSchedule.trainer}
                        onChange={(e) => setNewSchedule({ ...newSchedule, trainer: e.target.value })}
                        style={{ padding: '0.75rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                      <input
                        type="text"
                        required
                        placeholder="Días (ej. Martes y Jueves)"
                        value={newSchedule.day_of_week}
                        onChange={(e) => setNewSchedule({ ...newSchedule, day_of_week: e.target.value })}
                        style={{ padding: '0.75rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                      />
                      <input
                        type="text"
                        required
                        placeholder="Horario (ej. 4:00 PM - 5:30 PM)"
                        value={newSchedule.time_range}
                        onChange={(e) => setNewSchedule({ ...newSchedule, time_range: e.target.value })}
                        style={{ padding: '0.75rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                      />
                      <select
                        value={newSchedule.modality}
                        onChange={(e) => setNewSchedule({ ...newSchedule, modality: e.target.value as any })}
                        style={{ padding: '0.75rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                      >
                        <option value="Presencial">Presencial</option>
                        <option value="Online">Online</option>
                        <option value="Híbrida">Híbrida</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button type="submit" className="btn btn--primary btn--sm">Guardar Horario</button>
                      <button type="button" onClick={() => setShowScheduleModal(false)} className="btn btn--ghost btn--sm">Cancelar</button>
                    </div>
                  </form>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {schedules.map((sch) => (
                  <div key={sch.id} style={{ background: '#141414', border: '1px solid #222', borderRadius: '12px', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', background: 'var(--gold)', color: '#000', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 800 }}>
                        {sch.modality}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#888' }}>{sch.trainer}</span>
                    </div>
                    <h3 style={{ fontSize: '1.15rem', color: '#fff', margin: '0.4rem 0' }}>{sch.category}</h3>
                    <p style={{ color: 'var(--gold)', fontSize: '0.95rem', fontWeight: 600, margin: '0.2rem 0' }}>{sch.day_of_week} · {sch.time_range}</p>
                    <p style={{ color: '#777', fontSize: '0.85rem', margin: 0 }}>{sch.location}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 9. SECCIÓN: AVISOS & ALERTAS */}
          {activeSection === 'announcements' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                  <h1 className="display display--gold" style={{ fontSize: '1.8rem' }}>Avisos & Alertas Prioritarias</h1>
                  <p style={{ color: '#888' }}>Comunica alertas en vivo para la landing y el portal de afiliados</p>
                </div>
                <button onClick={() => setShowAnnouncementModal(true)} className="btn btn--primary btn--sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Plus size={16} /> Nuevo Aviso
                </button>
              </div>

              {showAnnouncementModal && (
                <div style={{ background: '#141414', border: '1px solid #333', borderRadius: '12px', padding: '2rem', marginBottom: '2rem' }}>
                  <h3 style={{ color: 'var(--gold)', marginBottom: '1rem' }}>Nuevo Aviso Prioritario</h3>
                  <form onSubmit={handleCreateAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input
                      type="text"
                      required
                      placeholder="Título del aviso"
                      value={newAnnouncement.title}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                      style={{ padding: '0.75rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <select
                        value={newAnnouncement.level}
                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, level: e.target.value as any })}
                        style={{ padding: '0.75rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                      >
                        <option value="info">Informativo (Azul/Oro)</option>
                        <option value="warning">Advertencia (Naranja)</option>
                        <option value="urgent">Urgente (Rojo)</option>
                      </select>
                      <select
                        value={newAnnouncement.target}
                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, target: e.target.value as any })}
                        style={{ padding: '0.75rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                      >
                        <option value="all">Todo público y afiliados</option>
                        <option value="members">Solo afiliados</option>
                        <option value="public">Solo visitantes públicos</option>
                      </select>
                    </div>
                    <textarea
                      required
                      placeholder="Mensaje detallado..."
                      rows={3}
                      value={newAnnouncement.message}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                      style={{ padding: '0.75rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                    />
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button type="submit" className="btn btn--primary btn--sm">Publicar Alerta</button>
                      <button type="button" onClick={() => setShowAnnouncementModal(false)} className="btn btn--ghost btn--sm">Cancelar</button>
                    </div>
                  </form>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {announcements.map((ann) => (
                  <div
                    key={ann.id}
                    style={{
                      background: '#141414',
                      borderLeft: `4px solid ${ann.level === 'urgent' ? '#d32f2f' : ann.level === 'warning' ? '#f57c00' : 'var(--gold)'}`,
                      borderTop: '1px solid #222',
                      borderRight: '1px solid #222',
                      borderBottom: '1px solid #222',
                      borderRadius: '8px',
                      padding: '1.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ fontSize: '1.15rem', color: '#fff', margin: 0 }}>{ann.title}</h3>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#888' }}>
                        Destino: {ann.target}
                      </span>
                    </div>
                    <p style={{ color: '#ccc', fontSize: '0.95rem', margin: '0.5rem 0 0', lineHeight: 1.5 }}>
                      {ann.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 10. SECCIÓN: BANDEJA DE MENSAJES */}
          {activeSection === 'messages' && (
            <div>
              <h1 className="display display--gold" style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>
                Mensajes de Contacto
              </h1>
              <p style={{ color: '#888', marginBottom: '2rem' }}>
                Consultas recibidas desde el formulario web
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {messages.map((msg) => (
                  <div key={msg.id} style={{ background: '#141414', border: '1px solid #222', borderRadius: '12px', padding: '1.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--gold)' }}>{msg.subject || 'Sin asunto'}</h3>
                        <p style={{ color: '#aaa', fontSize: '0.85rem', margin: '0.2rem 0' }}>
                          De: <strong>{msg.name}</strong> ({msg.email}) · Tel: {msg.phone || 'N/A'}
                        </p>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#666' }}>
                        {new Date(msg.created_at).toLocaleDateString('es-CO')}
                      </span>
                    </div>
                    <p style={{ color: '#ddd', fontSize: '0.95rem', lineHeight: 1.6, background: '#1c1c1c', padding: '1rem', borderRadius: '8px' }}>
                      {msg.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Modal Visor de Partida PGN para Admin */}
      {activePgnMatch && (
        <PgnViewerModal
          isOpen={true}
          onClose={() => setActivePgnMatch(null)}
          title={`Partida Mesa ${activePgnMatch.board_number} (Ronda ${activePgnMatch.round})`}
          whitePlayer={activePgnMatch.white_player}
          blackPlayer={activePgnMatch.black_player}
          result={activePgnMatch.result}
          pgn={activePgnMatch.pgn || ''}
        />
      )}

      {/* Modal Certificado Oficial de Afiliación emitido por Admin */}
      {certificateMember && (
        <AffiliationCertificateModal
          isOpen={true}
          onClose={() => setCertificateMember(null)}
          member={certificateMember}
        />
      )}
    </div>
  );
};
