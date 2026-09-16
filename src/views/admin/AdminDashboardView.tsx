import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { getSignedUrl, formatFileSize } from '../../lib/storage';
import { FileUploadField } from '../../components/common/FileUploadField';
import {
  INITIAL_SETTINGS, INITIAL_EVENTS, INITIAL_POSTS, INITIAL_DOCUMENTS,
  MOCK_MEMBER_PROFILE, MOCK_ADMIN_PROFILE, INITIAL_PAYMENTS, INITIAL_SCHEDULES,
  INITIAL_ANNOUNCEMENTS, INITIAL_MATCHES, INITIAL_GALLERY, INITIAL_REGISTRATIONS, INITIAL_MEMBERS,
  INITIAL_ATTENDANCE, INITIAL_TROPHIES, INITIAL_APPLICATIONS
} from '../../lib/initialData';
import {
  SiteSettings, ClubEvent, Post, ClubDocument, UserProfile, ContactMessage,
  MembershipPayment, ClassSchedule, ClubAnnouncement, TournamentMatch,
  GalleryItem, TournamentRegistration, ClassAttendance, AttendanceStatus,
  ClubTrophy, TrophyType, MembershipApplication, ApplicationStatus
} from '../../types/database';
import {
  ShieldCheck, LayoutDashboard, Globe, Trophy, BookOpen, FileText,
  Users, Mail, LogOut, Plus, Trash2, Save, CheckCircle2, AlertCircle,
  CreditCard, Calendar, Megaphone, Download, Search, Check, X,
  Swords, Eye, Camera, Award, Edit, CheckSquare, Database, Copy, Server, MessageCircle,
  UserCheck, UserX, ClipboardList, Crown, UserPlus, BarChart3, Medal, Wand2
} from 'lucide-react';
import { PgnViewerModal } from '../../components/common/PgnViewerModal';
import { AffiliationCertificateModal } from '../../components/common/AffiliationCertificateModal';
import { DigitalAthleteIdCardModal } from '../../components/common/DigitalAthleteIdCardModal';
import { DatabaseDiagnosticModal } from '../../components/common/DatabaseDiagnosticModal';
import { TournamentCertificateModal, TournamentCertificateData } from '../../components/common/TournamentCertificateModal';
import { TournamentPairingModal } from '../../components/common/TournamentPairingModal';
import { PairingAthlete } from '../../lib/tournamentPairings';
import { whatsappService } from '../../services/whatsappService';
import { AdminLoginView } from '../auth/AdminLoginView';
import { calculateTournamentStandings, exportStandingsToCsv } from '../../lib/tournamentStandings';

export const AdminDashboardView: React.FC = () => {
  const { user, role, loading, logout } = useAuth();
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
  const [applications, setApplications] = useState<MembershipApplication[]>(INITIAL_APPLICATIONS);
  const [membersSubTab, setMembersSubTab] = useState<'active' | 'applications'>('active');
  const [applicationFilter, setApplicationFilter] = useState<'all' | ApplicationStatus>('all');
  const [payments, setPayments] = useState<MembershipPayment[]>(INITIAL_PAYMENTS);
  const [schedules, setSchedules] = useState<ClassSchedule[]>(INITIAL_SCHEDULES);
  const [attendance, setAttendance] = useState<ClassAttendance[]>(INITIAL_ATTENDANCE);
  const [selectedAttendanceSchedule, setSelectedAttendanceSchedule] = useState<string>(INITIAL_SCHEDULES[1]?.id || 'sch-2');
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [scheduleSubTab, setScheduleSubTab] = useState<'schedules' | 'attendance'>('schedules');
  const [quickAttendeeName, setQuickAttendeeName] = useState<string>('');
  const [trophies, setTrophies] = useState<ClubTrophy[]>(INITIAL_TROPHIES);
  const [showTrophyModal, setShowTrophyModal] = useState<boolean>(false);
  const [newTrophy, setNewTrophy] = useState({
    title: '',
    year: new Date().getFullYear(),
    category: 'Categoría Abierta',
    champion_name: '',
    runner_up: '',
    trophy_type: 'champion' as TrophyType,
    edition: 'Edición Oficial',
    location: 'CC Aves María, Sabaneta',
    notes: '',
  });
  const [eventsSubTab, setEventsSubTab] = useState<'tournaments' | 'matches' | 'standings' | 'roster' | 'trophies'>('tournaments');
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
  const [cardMember, setCardMember] = useState<UserProfile | null>(null);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);
  const [showDbDiagnosticModal, setShowDbDiagnosticModal] = useState(false);
  const [tournamentCertModalData, setTournamentCertModalData] = useState<TournamentCertificateData | null>(null);
  const [showPairingModal, setShowPairingModal] = useState(false);

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

        const { data: atts } = await supabase.from('class_attendance').select('*').order('session_date', { ascending: false });
        if (atts && atts.length > 0) setAttendance(atts as ClassAttendance[]);

        const { data: trData } = await supabase.from('club_trophies').select('*').order('year', { ascending: false });
        if (trData && trData.length > 0) setTrophies(trData as ClubTrophy[]);

        const { data: anns } = await supabase.from('club_announcements').select('*');
        if (anns && anns.length > 0) setAnnouncements(anns as ClubAnnouncement[]);

        const { data: apps } = await supabase.from('membership_applications').select('*').order('created_at', { ascending: false });
        if (apps && apps.length > 0) setApplications(apps as MembershipApplication[]);

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
      id: crypto.randomUUID(),
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
      id: crypto.randomUUID(),
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

  const handleBatchSaveMatches = async (batch: Omit<TournamentMatch, 'id'>[]) => {
    const timestamp = Date.now();
    const formattedMatches: TournamentMatch[] = batch.map((item, idx) => ({
      ...item,
      id: `mat-${timestamp}-${idx}`,
      created_at: new Date().toISOString(),
    }));

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('tournament_matches').insert(formattedMatches);
      } catch (err) {
        console.error('Error guardando partidas por lote en Supabase:', err);
      }
    }

    setMatches((prev) => [...formattedMatches, ...prev]);
    triggerNotice(`¡Se han generado e insertado ${formattedMatches.length} mesas/partidas en el torneo!`);
  };

  // Evento activo seleccionado para emparejar
  const targetEventForPairing = events.find((e) => e.id === selectedTournamentFilter) || events[0];

  // Atletas disponibles para emparejamiento automático
  const athletesForPairing: PairingAthlete[] = React.useMemo(() => {
    if (!targetEventForPairing) return [];

    // 1. Inscripciones confirmadas del torneo
    const eventRegs = registrations.filter(
      (r) => r.event_id === targetEventForPairing.id && r.status !== 'cancelled'
    );
    if (eventRegs.length >= 2) {
      return eventRegs.map((r) => {
        const mem = members.find((m) => m.id === r.user_id);
        const name = r.profile
          ? `${r.profile.nombre} ${r.profile.apellido}`
          : (mem ? `${mem.nombre} ${mem.apellido}` : 'Ajedrecista');
        const elo = r.profile?.elo_rating || mem?.elo_rating || 1500;
        return {
          id: r.id,
          name,
          elo,
          category: r.profile?.categoria_ajedrez || mem?.categoria_ajedrez,
          club: 'Capablanca Sabaneta',
        };
      });
    }

    // 2. Si no hay suficientes inscritos específicos, usar los socios activos del club
    return members
      .filter((m) => m.estado === 'active' && m.role !== 'admin')
      .map((m) => ({
        id: m.id,
        name: `${m.nombre} ${m.apellido}`,
        elo: m.elo_rating || 1500,
        category: m.categoria_ajedrez,
        club: 'Capablanca Sabaneta',
      }));
  }, [targetEventForPairing, registrations, members]);

  // Palmarés y Cuadro de Honor Histórico
  const handleCreateTrophy = async (e: React.FormEvent) => {
    e.preventDefault();
    const item: ClubTrophy = {
      id: crypto.randomUUID(),
      title: newTrophy.title,
      year: Number(newTrophy.year),
      category: newTrophy.category,
      champion_name: newTrophy.champion_name,
      runner_up: newTrophy.runner_up || undefined,
      trophy_type: newTrophy.trophy_type,
      edition: newTrophy.edition || undefined,
      location: newTrophy.location || undefined,
      notes: newTrophy.notes || undefined,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('club_trophies').insert(item);
      } catch (err) {
        console.error('Error al guardar título en Supabase:', err);
      }
    }

    setTrophies([item, ...trophies]);
    setShowTrophyModal(false);
    setNewTrophy({
      title: '',
      year: new Date().getFullYear(),
      category: 'Categoría Abierta',
      champion_name: '',
      runner_up: '',
      trophy_type: 'champion',
      edition: 'Edición Oficial',
      location: 'CC Aves María, Sabaneta',
      notes: '',
    });
    triggerNotice('Título / Trofeo histórico registrado en el Palmarés');
  };

  const handleDeleteTrophy = async (id: string) => {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('club_trophies').delete().eq('id', id);
      } catch (err) {
        console.error('Error al eliminar título en Supabase:', err);
      }
    }
    setTrophies(trophies.filter((t) => t.id !== id));
    triggerNotice('Registro de palmarés eliminado');
  };

  // Post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    const postItem: Post = {
      id: crypto.randomUUID(),
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
    if (!newDoc.file_url || newDoc.file_url === '#') {
      triggerNotice('Sube un archivo o pega un enlace antes de publicar el recurso');
      return;
    }
    const docItem: ClubDocument = {
      id: crypto.randomUUID(),
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
    setNewDoc({ title: '', description: '', category: 'Material de Estudio' as const, file_type: 'pdf', file_size: '2.1 MB', file_url: '#' });
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
    if (!newGalleryItem.src) {
      triggerNotice('Sube una fotografía o pega una URL antes de guardarla');
      return;
    }
    const item: GalleryItem = {
      id: crypto.randomUUID(),
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
      id: crypto.randomUUID(),
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

  // Control de Asistencia & Reportes Inder
  const handleUpdateAttendanceStatus = async (attId: string, newStatus: AttendanceStatus) => {
    const updated = attendance.map((a) => (a.id === attId ? { ...a, status: newStatus } : a));
    setAttendance(updated);
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('class_attendance').update({ status: newStatus }).eq('id', attId);
      } catch (err) {
        console.error('Error al actualizar estado en Supabase:', err);
      }
    }
    const label = newStatus === 'present' ? 'Presente' : newStatus === 'excused' ? 'Excusa Médica/Escolar' : 'Ausente';
    triggerNotice(`Asistencia actualizada: ${label}`);
  };

  const handleUpdateAttendanceNotes = async (attId: string, notes: string) => {
    const updated = attendance.map((a) => (a.id === attId ? { ...a, notes } : a));
    setAttendance(updated);
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('class_attendance').update({ notes }).eq('id', attId);
      } catch (err) {
        console.error('Error al actualizar nota en Supabase:', err);
      }
    }
  };

  const handleAddStudentToSession = async (studentName: string) => {
    if (!studentName.trim()) return;
    const newRecord: ClassAttendance = {
      id: `att-${Date.now()}`,
      schedule_id: selectedAttendanceSchedule,
      student_name: studentName.trim(),
      session_date: attendanceDate,
      status: 'present',
      notes: 'Ingreso a la sesión de entrenamiento',
      created_at: new Date().toISOString(),
    };

    const updated = [...attendance, newRecord];
    setAttendance(updated);
    setQuickAttendeeName('');

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('class_attendance').insert({
          schedule_id: newRecord.schedule_id,
          student_name: newRecord.student_name,
          session_date: newRecord.session_date,
          status: newRecord.status,
          notes: newRecord.notes,
        });
      } catch (err) {
        console.error('Error al registrar deportista en sesión:', err);
      }
    }
    triggerNotice(`Deportista ${studentName} registrado en la sesión`);
  };

  const handleInitializeSessionRoster = async () => {
    const activeAthletes = members.filter((m) => m.role === 'student' || m.role === 'member');
    const existingNames = new Set(
      attendance
        .filter((a) => a.session_date === attendanceDate && a.schedule_id === selectedAttendanceSchedule)
        .map((a) => a.student_name.toLowerCase())
    );

    const newEntries: ClassAttendance[] = [];
    activeAthletes.forEach((athlete) => {
      const fullName = `${athlete.nombre} ${athlete.apellido}`.trim() || athlete.usuario;
      if (!existingNames.has(fullName.toLowerCase())) {
        newEntries.push({
          id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          schedule_id: selectedAttendanceSchedule,
          student_name: fullName,
          user_id: athlete.id,
          session_date: attendanceDate,
          status: 'present',
          notes: 'Nómina oficial del club',
          created_at: new Date().toISOString(),
        });
      }
    });

    if (newEntries.length === 0) {
      triggerNotice('Todos los alumnos registrados ya están en la planilla de esta fecha', 'error');
      return;
    }

    const updated = [...attendance, ...newEntries];
    setAttendance(updated);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('class_attendance').insert(
          newEntries.map((e) => ({
            schedule_id: e.schedule_id,
            student_name: e.student_name,
            user_id: e.user_id,
            session_date: e.session_date,
            status: e.status,
            notes: e.notes,
          }))
        );
      } catch (err) {
        console.error('Error al inicializar nómina en Supabase:', err);
      }
    }
    triggerNotice(`Se cargaron ${newEntries.length} deportistas en la planilla`);
  };

  const handleExportInderAttendanceCsv = (schedId: string, date: string) => {
    const currentSched = schedules.find((s) => s.id === schedId) || schedules[0];
    const sessionAtts = attendance.filter(
      (a) => a.session_date === date && (!a.schedule_id || a.schedule_id === schedId)
    );

    if (sessionAtts.length === 0) {
      triggerNotice('No hay registros de asistencia para exportar en esta fecha', 'error');
      return;
    }

    let csv = '\uFEFF';
    csv += 'CLUB DEPORTIVO DE AJEDREZ CAPABLANCA SABANETA\n';
    csv += 'Personería Deportiva Res. 042 Inder Sabaneta - NIT 901.445.892-1\n';
    csv += 'PLANILLA OFICIAL DE CONTROL DE ASISTENCIA A ENTRENAMIENTOS FORMATIVOS\n\n';
    csv += `Grupo / Categoría,"${currentSched?.category || 'General'}"\n`;
    csv += `Entrenador a Cargo,"${currentSched?.trainer || 'Maestro Capablanca'}"\n`;
    csv += `Sede de Entrenamiento,"${currentSched?.location || 'CC Aves María, piso 3'}"\n`;
    csv += `Fecha de Sesión,"${date}"\n`;
    csv += `Horario,"${currentSched?.time_range || 'Oficial'}"\n\n`;
    csv += 'N°,Deportista,Categoría,Estado de Asistencia,Observaciones Pedagógicas,Firma del Deportista / VoBo\n';

    sessionAtts.forEach((att, idx) => {
      const statusLabel =
        att.status === 'present'
          ? 'PRESENTE'
          : att.status === 'excused'
          ? 'EXCUSA MEDICA/ESCOLAR'
          : att.status === 'late'
          ? 'RETARDO'
          : 'AUSENTE';
      csv += `${idx + 1},"${att.student_name}","${currentSched?.category || 'Deportista'}","${statusLabel}","${(
        att.notes || ''
      ).replace(/"/g, '""')}","__________________________"\n`;
    });

    const totalPres = sessionAtts.filter((a) => a.status === 'present').length;
    const totalExc = sessionAtts.filter((a) => a.status === 'excused').length;
    const totalAus = sessionAtts.filter((a) => a.status === 'absent').length;

    csv += `\nResumen de Sesión: Total Registrados: ${sessionAtts.length} | Presentes: ${totalPres} | Excusados: ${totalExc} | Ausentes: ${totalAus}\n`;
    csv += `Firma Entrenador Responsable: _________________________________\n`;
    csv += `Vo.Bo. Coordinación Técnica Inder Sabaneta: _________________________________\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const categorySlug = (currentSched?.category || 'Entrenamiento').replace(/[^a-zA-Z0-9]/g, '_');
    link.setAttribute('download', `Planilla_Inder_Sabaneta_${categorySlug}_${date}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    triggerNotice('Planilla oficial Inder Sabaneta (CSV) exportada exitosamente');
  };

  // Anuncio Prioritario
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    const annItem: ClubAnnouncement = {
      id: crypto.randomUUID(),
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

  // Ver comprobante de pago (bucket privado, requiere URL firmada temporal)
  const handleViewReceipt = async (receiptPath: string) => {
    const url = await getSignedUrl('payment-receipts', receiptPath);
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      triggerNotice('No se pudo abrir el comprobante. Verifica los permisos del bucket payment-receipts.');
    }
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

  // Gestión de Solicitudes de Afiliación
  const handleUpdateApplicationStatus = async (appId: string, newStatus: ApplicationStatus) => {
    setApplications(applications.map((a) => (a.id === appId ? { ...a, status: newStatus } : a)));
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('membership_applications').update({ status: newStatus }).eq('id', appId);
      } catch (err) {
        console.error('Error al actualizar estado de solicitud:', err);
      }
    }
    const statusLabel = newStatus === 'approved' ? 'Aprobada' : newStatus === 'contacted' ? 'Marcada como Contactada' : 'Rechazada/Archivada';
    triggerNotice(`Solicitud de admisión ${statusLabel}`);
  };

  const handleApproveApplication = async (app: MembershipApplication) => {
    // Nota de arquitectura: `profiles.id` es una llave foránea hacia `auth.users(id)`,
    // así que un perfil solo puede crearse cuando existe una cuenta real de autenticación.
    // Por eso "aprobar" solo cambia el estado de la solicitud; la cuenta de acceso del
    // afiliado se crea cuando esa persona se registra en el portal de Afiliados con el
    // mismo correo (el trigger `handle_new_user` crea el perfil automáticamente).
    await handleUpdateApplicationStatus(app.id, 'approved');
    triggerNotice(
      `Solicitud de ${app.applicant_name} aprobada. Pide al afiliado registrarse en el Portal de Afiliados con el correo ${app.email} para activar su acceso.`
    );
  };

  const handleDeleteApplication = async (appId: string) => {
    if (!confirm('¿Deseas eliminar definitivamente este registro de solicitud?')) return;
    setApplications(applications.filter((a) => a.id !== appId));
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('membership_applications').delete().eq('id', appId);
      } catch (err) {
        console.error('Error al eliminar solicitud en Supabase:', err);
      }
    }
    triggerNotice('Registro de solicitud eliminado');
  };

  const handleExportApplicationsCSV = () => {
    const headers = ['ID', 'Nombres', 'Apellidos', 'Doc Tipo', 'Doc Numero', 'Fecha Nac.', 'Edad', 'Correo', 'Telefono', 'Municipio', 'Categoria Solicitada', 'Elo', 'Acudiente', 'Tel Acudiente', 'EPS', 'Estado', 'Notas / Radicado', 'Fecha Radicado'];
    const rows = applications.map((a) => [
      a.id,
      a.applicant_name,
      a.applicant_lastname,
      a.doc_type,
      a.doc_number,
      a.birth_date || '',
      a.age || '',
      a.email,
      a.phone,
      a.municipality,
      a.desired_category,
      a.approximate_elo || 0,
      a.guardian_name || '',
      a.guardian_phone || '',
      a.health_provider || '',
      a.status,
      a.notes || '',
      a.created_at || '',
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.map((f) => `"${(f + '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Solicitudes_Afiliacion_Capablanca_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerNotice('Archivo CSV de solicitudes descargado exitosamente');
  };

  // Exportar Backup Integral de la Plataforma en JSON
  const handleExportFullJsonBackup = () => {
    const backupData = {
      export_date: new Date().toISOString(),
      club: 'Club Deportivo de Ajedrez Capablanca Sabaneta',
      version: 'Enterprise 2.0',
      database_type: isSupabaseConfigured() ? 'Supabase PostgreSQL' : 'Local Mock Data',
      tables: {
        site_settings: settings,
        profiles: members,
        membership_applications: applications,
        events: events,
        tournament_matches: matches,
        tournament_registrations: registrations,
        posts: posts,
        documents: documents,
        gallery: gallery,
        membership_payments: payments,
        class_schedules: schedules,
        class_attendance: attendance,
        club_trophies: trophies,
        club_announcements: announcements,
        contact_messages: messages,
      },
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(backupData, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `Capablanca_Backup_Total_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerNotice('Copia de seguridad completa (JSON) exportada exitosamente');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #222', borderTopColor: 'var(--gold)', borderRadius: '50%', margin: '0 auto 1rem' }} />
          <p style={{ fontSize: '0.9rem', color: '#888' }}>Cargando Panel de Administración...</p>
        </div>
      </div>
    );
  }

  if (!user || (role !== 'admin' && user.role !== 'admin')) {
    return <AdminLoginView />;
  }

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

              {/* Diagnóstico de Base de Datos & Copias de Seguridad */}
              <div style={{ marginTop: '2rem', background: '#121212', border: '1px solid #222', borderRadius: '14px', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.8rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Database size={20} /> Diagnóstico de Base de Datos & Copias de Seguridad
                    </h3>
                    <p style={{ color: '#888', fontSize: '0.85rem', margin: '0.2rem 0 0' }}>
                      Auditoría de persistencia en Supabase, conteo de tablas y herramientas de exportación directa
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '50px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: isSupabaseConfigured() ? '#133519' : '#332910',
                      color: isSupabaseConfigured() ? '#81c784' : '#ffd54f',
                      border: `1px solid ${isSupabaseConfigured() ? '#2e7d32' : '#8d6e19'}`,
                    }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isSupabaseConfigured() ? '#4caf50' : '#ffb300' }} />
                      {isSupabaseConfigured() ? 'Supabase Conectado' : 'Modo Seguro Local'}
                    </span>
                  </div>
                </div>

                {/* Métricas de Tablas */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.8rem', marginBottom: '1.5rem' }}>
                  {[
                    { name: 'Afiliados', count: members.length },
                    { name: 'Solicitudes', count: applications.length },
                    { name: 'Torneos', count: events.length },
                    { name: 'Partidas PGN', count: matches.length },
                    { name: 'Inscripciones', count: registrations.length },
                    { name: 'Documentos', count: documents.length },
                    { name: 'Galería', count: gallery.length },
                    { name: 'Cuotas/Pagos', count: payments.length },
                    { name: 'Horarios', count: schedules.length },
                    { name: 'Asistencias Inder', count: attendance.length },
                    { name: 'Palmarés', count: trophies.length },
                    { name: 'Avisos', count: announcements.length },
                    { name: 'Mensajes', count: messages.length },
                  ].map((t) => (
                    <div key={t.name} style={{ background: '#181818', border: '1px solid #282828', borderRadius: '8px', padding: '0.8rem 1rem' }}>
                      <div style={{ fontSize: '0.72rem', color: '#888', textTransform: 'uppercase' }}>{t.name}</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginTop: '0.2rem' }}>{t.count}</div>
                    </div>
                  ))}
                </div>

                {/* Acciones de Respaldo */}
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', borderTop: '1px solid #222', paddingTop: '1.2rem' }}>
                  <button
                    type="button"
                    onClick={handleExportFullJsonBackup}
                    className="btn btn--primary btn--sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
                  >
                    <Download size={15} />
                    <span>Descargar Backup Integral (JSON)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDbDiagnosticModal(true)}
                    className="btn btn--ghost btn--sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderColor: 'var(--gold)', color: 'var(--gold)' }}
                  >
                    <ShieldCheck size={15} />
                    <span>Diagnóstico de Base de Datos (15 Tablas)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSqlModal(true)}
                    className="btn btn--ghost btn--sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <Database size={15} />
                    <span>Ver Esquema SQL Supabase</span>
                  </button>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h1 className="display display--gold" style={{ fontSize: '1.8rem' }}>Gestión de Torneos & Competencias</h1>
                  <p style={{ color: '#888' }}>Administración integral de eventos, emparejamientos, clasificaciones en vivo y palmarés histórico</p>
                </div>
              </div>

              {/* Pestañas de Navegación del Módulo de Torneos */}
              <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #282828', marginBottom: '1.5rem', overflowX: 'auto' }}>
                <button
                  type="button"
                  onClick={() => setEventsSubTab('tournaments')}
                  style={{
                    background: 'none',
                    border: 'none',
                    borderBottom: eventsSubTab === 'tournaments' ? '2px solid var(--gold)' : '2px solid transparent',
                    color: eventsSubTab === 'tournaments' ? 'var(--gold)' : '#888',
                    fontWeight: 700,
                    padding: '0.6rem 1.2rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.9rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Calendar size={16} />
                  <span>Torneos ({events.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEventsSubTab('matches')}
                  style={{
                    background: 'none',
                    border: 'none',
                    borderBottom: eventsSubTab === 'matches' ? '2px solid var(--gold)' : '2px solid transparent',
                    color: eventsSubTab === 'matches' ? 'var(--gold)' : '#888',
                    fontWeight: 700,
                    padding: '0.6rem 1.2rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.9rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Swords size={16} />
                  <span>Partidas & Emparejamientos ({matches.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEventsSubTab('standings')}
                  style={{
                    background: 'none',
                    border: 'none',
                    borderBottom: eventsSubTab === 'standings' ? '2px solid var(--gold)' : '2px solid transparent',
                    color: eventsSubTab === 'standings' ? 'var(--gold)' : '#888',
                    fontWeight: 700,
                    padding: '0.6rem 1.2rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.9rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Trophy size={16} />
                  <span>Posiciones en Vivo & Desempates</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEventsSubTab('roster')}
                  style={{
                    background: 'none',
                    border: 'none',
                    borderBottom: eventsSubTab === 'roster' ? '2px solid var(--gold)' : '2px solid transparent',
                    color: eventsSubTab === 'roster' ? 'var(--gold)' : '#888',
                    fontWeight: 700,
                    padding: '0.6rem 1.2rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.9rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Award size={16} />
                  <span>Nómina de Preinscritos ({registrations.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEventsSubTab('trophies')}
                  style={{
                    background: 'none',
                    border: 'none',
                    borderBottom: eventsSubTab === 'trophies' ? '2px solid var(--gold)' : '2px solid transparent',
                    color: eventsSubTab === 'trophies' ? 'var(--gold)' : '#888',
                    fontWeight: 700,
                    padding: '0.6rem 1.2rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.9rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Crown size={16} />
                  <span>Palmarés Histórico ({trophies.length})</span>
                </button>
              </div>

              {/* Sub-pestaña 1: Torneos & Eventos Convocados */}
              {eventsSubTab === 'tournaments' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                      <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={18} />
                        Torneos en Calendario Público
                      </h2>
                      <p style={{ color: '#888', fontSize: '0.85rem', margin: '0.2rem 0 0' }}>Crea, edita o retira torneos convocados por el Club Capablanca</p>
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
                </div>
              )}

              {/* Sub-pestaña 2: Emparejamientos & Resultados de Partidas */}
              {eventsSubTab === 'matches' && (
                <div>
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
                      type="button"
                      onClick={() => setShowPairingModal(true)}
                      className="btn btn--secondary btn--sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', border: '1px solid var(--gold)', color: 'var(--gold)' }}
                    >
                      <Wand2 size={16} /> Asistente de Emparejamientos
                    </button>

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
              )}

              {/* Sub-pestaña 3: Tabla de Posiciones & Desempates en Vivo */}
              {eventsSubTab === 'standings' && (
                <div>
                  {(() => {
                    const targetEventId = selectedTournamentFilter === 'all' ? (events[0]?.id || '') : selectedTournamentFilter;
                    const targetEvent = events.find((e) => e.id === targetEventId) || events[0];
                    const eventMatches = matches.filter((m) => m.event_id === (targetEvent?.id || ''));
                    const standings = calculateTournamentStandings(eventMatches);
                    const finishedMatches = eventMatches.filter((m) => m.result !== '*');

                    return (
                      <div>
                        {/* Header & Controles de Posiciones */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                          <div>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <Trophy size={20} />
                              Tabla de Posiciones Oficial & Desempates en Vivo
                            </h2>
                            <p style={{ color: '#888', fontSize: '0.85rem', margin: '0.2rem 0 0' }}>
                              Cálculo automatizado de puntuación oficial y desempate Sonneborn-Berger (SB) para torneos suizos o round-robin
                            </p>
                          </div>

                          <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <select
                              value={selectedTournamentFilter}
                              onChange={(e) => setSelectedTournamentFilter(e.target.value)}
                              style={{ padding: '0.45rem 0.8rem', borderRadius: '6px', background: '#181818', border: '1px solid #333', color: '#fff', fontSize: '0.82rem' }}
                            >
                              <option value="all">Torneo: {events[0]?.title || 'Seleccionar'}</option>
                              {events.map((ev) => (
                                <option key={ev.id} value={ev.id}>{ev.title}</option>
                              ))}
                            </select>

                            <button
                              type="button"
                              onClick={() => exportStandingsToCsv(targetEvent?.title || 'Torneo Capablanca', standings)}
                              disabled={standings.length === 0}
                              className="btn btn--primary btn--sm"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                            >
                              <Download size={14} />
                              <span>Exportar Clasificación (.csv)</span>
                            </button>
                          </div>
                        </div>

                        {/* Métricas del Torneo */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                          <div style={{ background: '#141414', border: '1px solid #282828', borderRadius: '10px', padding: '1rem' }}>
                            <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>Torneo Activo</div>
                            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginTop: '0.2rem' }}>
                              {targetEvent?.title || 'Sin torneo seleccionado'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--gold)', marginTop: '0.2rem' }}>
                              Ritmo: {targetEvent?.rhythm || 'N/A'} · {targetEvent?.category || 'General'}
                            </div>
                          </div>

                          <div style={{ background: '#141414', border: '1px solid #282828', borderRadius: '10px', padding: '1rem' }}>
                            <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>Partidas Disputadas</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--gold)', marginTop: '0.2rem' }}>
                              {finishedMatches.length} <span style={{ fontSize: '0.85rem', color: '#777', fontWeight: 400 }}>/ {eventMatches.length} pactadas</span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.2rem' }}>
                              {eventMatches.filter((m) => m.result === '*').length} en juego o pendientes
                            </div>
                          </div>

                          <div style={{ background: '#141414', border: '1px solid #282828', borderRadius: '10px', padding: '1rem' }}>
                            <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>Jugadores Clasificados</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4ade80', marginTop: '0.2rem' }}>
                              {standings.length}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.2rem' }}>
                              Con partidas computadas
                            </div>
                          </div>
                        </div>

                        {/* Tabla de Clasificación Oficial */}
                        {standings.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '3rem 2rem', background: '#131313', borderRadius: '12px', border: '1px solid #242424' }}>
                            <Trophy size={40} style={{ color: '#444', marginBottom: '1rem' }} />
                            <h3 style={{ fontSize: '1.1rem', color: '#aaa', margin: '0 0 0.5rem 0' }}>No hay partidas finalizadas aún</h3>
                            <p style={{ color: '#666', fontSize: '0.85rem', maxWidth: '500px', margin: '0 auto 1.2rem auto' }}>
                              Para generar la tabla de clasificación y calcular el desempate Sonneborn-Berger, ve a la pestaña de "Partidas & Emparejamientos" y anota los resultados de las mesas (1-0, 0-1 o ½-½).
                            </p>
                            <button
                              type="button"
                              onClick={() => setEventsSubTab('matches')}
                              className="btn btn--sm btn--primary"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                            >
                              <Swords size={14} /> Ir a Emparejamientos
                            </button>
                          </div>
                        ) : (
                          <div style={{ background: '#121212', border: '1px solid #252525', borderRadius: '12px', overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                              <thead>
                                <tr style={{ background: '#181818', borderBottom: '1px solid #2a2a2a', color: '#888', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.05em' }}>
                                  <th style={{ padding: '0.8rem 1rem', width: '60px' }}>Puesto</th>
                                  <th style={{ padding: '0.8rem 1rem' }}>Deportista</th>
                                  <th style={{ padding: '0.8rem 0.6rem', textAlign: 'center' }}>PJ</th>
                                  <th style={{ padding: '0.8rem 0.6rem', textAlign: 'center' }}>PG</th>
                                  <th style={{ padding: '0.8rem 0.6rem', textAlign: 'center' }}>PE</th>
                                  <th style={{ padding: '0.8rem 0.6rem', textAlign: 'center' }}>PP</th>
                                  <th style={{ padding: '0.8rem 0.8rem', textAlign: 'center' }}>Desempate (SB)</th>
                                  <th style={{ padding: '0.8rem 1rem', textAlign: 'right', color: 'var(--gold)' }}>Puntos Totales</th>
                                  <th style={{ padding: '0.8rem 1rem', textAlign: 'right' }}>Acción</th>
                                </tr>
                              </thead>
                              <tbody>
                                {standings.map((st) => (
                                  <tr
                                    key={st.name}
                                    style={{
                                      borderBottom: '1px solid #1f1f1f',
                                      background: st.rank === 1 ? 'rgba(212,175,55,0.08)' : st.rank <= 3 ? 'rgba(255,255,255,0.02)' : 'transparent',
                                    }}
                                  >
                                    <td style={{ padding: '0.8rem 1rem', fontWeight: 800 }}>
                                      <span
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          width: '26px',
                                          height: '26px',
                                          borderRadius: '50%',
                                          fontSize: '0.8rem',
                                          fontWeight: 900,
                                          background: st.rank === 1 ? '#ffd700' : st.rank === 2 ? '#c0c0c0' : st.rank === 3 ? '#cd7f32' : '#222',
                                          color: st.rank <= 3 ? '#000' : '#888',
                                          boxShadow: st.rank === 1 ? '0 0 10px rgba(255,215,0,0.3)' : 'none',
                                        }}
                                      >
                                        {st.rank}
                                      </span>
                                    </td>
                                    <td style={{ padding: '0.8rem 1rem' }}>
                                      <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.92rem' }}>
                                        {st.name}
                                      </div>
                                      {st.rank === 1 && (
                                        <span style={{ fontSize: '0.7rem', color: 'var(--gold)', fontWeight: 600 }}>
                                          👑 Líder del Torneo
                                        </span>
                                      )}
                                    </td>
                                    <td style={{ padding: '0.8rem 0.6rem', textAlign: 'center', color: '#aaa', fontWeight: 600 }}>{st.played}</td>
                                    <td style={{ padding: '0.8rem 0.6rem', textAlign: 'center', color: '#4ade80', fontWeight: 700 }}>{st.won}</td>
                                    <td style={{ padding: '0.8rem 0.6rem', textAlign: 'center', color: '#facc15', fontWeight: 700 }}>{st.drawn}</td>
                                    <td style={{ padding: '0.8rem 0.6rem', textAlign: 'center', color: '#f87171', fontWeight: 700 }}>{st.lost}</td>
                                    <td style={{ padding: '0.8rem 0.8rem', textAlign: 'center', color: '#bbb', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                      {st.sonnebornBerger.toFixed(2)}
                                    </td>
                                    <td style={{ padding: '0.8rem 1rem', textAlign: 'right', fontWeight: 900, color: 'var(--gold)', fontSize: '1.05rem' }}>
                                      {st.points}
                                    </td>
                                    <td style={{ padding: '0.8rem 1rem', textAlign: 'right' }}>
                                      <button
                                        type="button"
                                        onClick={() => setTournamentCertModalData({
                                          athleteName: st.name,
                                          tournamentTitle: targetEvent?.title || 'Torneo Capablanca',
                                          eventDate: targetEvent?.event_date || '2026',
                                          location: targetEvent?.location,
                                          rhythm: targetEvent?.rhythm,
                                          rank: st.rank,
                                          points: st.points,
                                          sonnebornBerger: st.sonnebornBerger,
                                          played: st.played,
                                          won: st.won,
                                          isChampion: st.rank === 1,
                                        })}
                                        className="btn btn--sm"
                                        style={{
                                          background: '#231d10',
                                          color: 'var(--gold)',
                                          border: '1px solid #7c621d',
                                          padding: '0.25rem 0.6rem',
                                          fontSize: '0.72rem',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '0.3rem',
                                          cursor: 'pointer',
                                        }}
                                        title="Emitir Diploma / Certificado de Torneo"
                                      >
                                        <Award size={13} />
                                        <span>Diploma</span>
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Sub-pestaña 4: Nómina de Preinscritos a Torneos */}
              {eventsSubTab === 'roster' && (
                <div>
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
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const phone = prof?.telefono || '3002545835';
                                      const name = prof ? `${prof.nombre} ${prof.apellido}` : 'Deportista';
                                      whatsappService.openTournamentReminder(phone, name, ev?.title || 'Torneo Capablanca', ev?.event_date || 'Próxima fecha', ev?.event_time || '09:00 AM');
                                    }}
                                    className="btn btn--sm"
                                    style={{ background: '#123018', color: '#81c784', border: '1px solid #2e7d32', padding: '0.2rem 0.45rem', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                                    title="Enviar recordatorio y bases por WhatsApp"
                                  >
                                    <MessageCircle size={11} />
                                    <span>WhatsApp</span>
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
              )}

              {/* Sub-pestaña 5: Cuadro de Honor & Palmarés Histórico */}
              {eventsSubTab === 'trophies' && (
                <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Crown size={20} />
                      Cuadro de Honor & Palmarés Histórico ({trophies.length})
                    </h2>
                    <p style={{ color: '#888', fontSize: '0.85rem', margin: '0.2rem 0 0' }}>
                      Registro oficial de campeones, subcampeones y logros deportivos del Club Capablanca
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowTrophyModal(true)}
                    className="btn btn--primary btn--sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <Plus size={15} />
                    <span>Añadir Título / Campeón</span>
                  </button>
                </div>

                {/* Modal para Registrar Título */}
                {showTrophyModal && (
                  <div style={{ background: '#141414', border: '1px solid #333', borderRadius: '12px', padding: '1.8rem', marginBottom: '1.8rem' }}>
                    <h3 style={{ color: 'var(--gold)', marginBottom: '1rem', fontSize: '1.2rem' }}>
                      Registrar Título / Campeón en el Palmarés
                    </h3>
                    <form onSubmit={handleCreateTrophy} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                        <input
                          type="text"
                          required
                          placeholder="Nombre del Torneo / Certamen (ej. Abierto Sabaneta 2026)"
                          value={newTrophy.title}
                          onChange={(e) => setNewTrophy({ ...newTrophy, title: e.target.value })}
                          style={{ padding: '0.7rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                        />
                        <input
                          type="number"
                          required
                          placeholder="Año (ej. 2026)"
                          value={newTrophy.year}
                          onChange={(e) => setNewTrophy({ ...newTrophy, year: Number(e.target.value) })}
                          style={{ padding: '0.7rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                        <input
                          type="text"
                          required
                          placeholder="Categoría (ej. Abierto, Semillero Sub-12)"
                          value={newTrophy.category}
                          onChange={(e) => setNewTrophy({ ...newTrophy, category: e.target.value })}
                          style={{ padding: '0.7rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                        />
                        <input
                          type="text"
                          required
                          placeholder="Campeón / Ganador (Nombre)"
                          value={newTrophy.champion_name}
                          onChange={(e) => setNewTrophy({ ...newTrophy, champion_name: e.target.value })}
                          style={{ padding: '0.7rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                        />
                        <input
                          type="text"
                          placeholder="Subcampeón (Opcional)"
                          value={newTrophy.runner_up}
                          onChange={(e) => setNewTrophy({ ...newTrophy, runner_up: e.target.value })}
                          style={{ padding: '0.7rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                        <select
                          value={newTrophy.trophy_type}
                          onChange={(e) => setNewTrophy({ ...newTrophy, trophy_type: e.target.value as any })}
                          style={{ padding: '0.7rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                        >
                          <option value="champion">Campeón / Oro 🥇</option>
                          <option value="runner_up">Subcampeón / Plata 🥈</option>
                          <option value="third_place">Tercer Lugar / Bronce 🥉</option>
                          <option value="team_medal">Trofeo por Equipos 🏆</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Edición (ej. XII Edición)"
                          value={newTrophy.edition}
                          onChange={(e) => setNewTrophy({ ...newTrophy, edition: e.target.value })}
                          style={{ padding: '0.7rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                        />
                        <input
                          type="text"
                          placeholder="Sede / Ciudad"
                          value={newTrophy.location}
                          onChange={(e) => setNewTrophy({ ...newTrophy, location: e.target.value })}
                          style={{ padding: '0.7rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                        />
                      </div>

                      <textarea
                        rows={2}
                        placeholder="Observaciones o hazaña deportiva destacada..."
                        value={newTrophy.notes}
                        onChange={(e) => setNewTrophy({ ...newTrophy, notes: e.target.value })}
                        style={{ padding: '0.7rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff', resize: 'vertical' }}
                      />

                      <div style={{ display: 'flex', gap: '0.8rem' }}>
                        <button type="submit" className="btn btn--primary btn--sm">Guardar en el Palmarés</button>
                        <button type="button" onClick={() => setShowTrophyModal(false)} className="btn btn--ghost btn--sm">Cancelar</button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Tabla de Trofeos Registrados */}
                <div style={{ background: '#121212', border: '1px solid #252525', borderRadius: '12px', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: '#181818', borderBottom: '1px solid #2a2a2a', color: '#888', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.05em' }}>
                        <th style={{ padding: '0.8rem 1rem' }}>Año & Edición</th>
                        <th style={{ padding: '0.8rem 1rem' }}>Torneo</th>
                        <th style={{ padding: '0.8rem 1rem' }}>Categoría</th>
                        <th style={{ padding: '0.8rem 1rem' }}>Campeón</th>
                        <th style={{ padding: '0.8rem 1rem' }}>Subcampeón</th>
                        <th style={{ padding: '0.8rem 1rem', textAlign: 'right' }}>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trophies.map((tr) => (
                        <tr key={tr.id} style={{ borderBottom: '1px solid #1f1f1f' }}>
                          <td style={{ padding: '0.8rem 1rem', whiteSpace: 'nowrap' }}>
                            <span style={{ background: '#252010', color: 'var(--gold)', border: '1px solid #554415', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 800, fontSize: '0.75rem' }}>
                              {tr.year}
                            </span>
                            <div style={{ fontSize: '0.72rem', color: '#777', marginTop: '0.2rem' }}>{tr.edition || 'Oficial'}</div>
                          </td>
                          <td style={{ padding: '0.8rem 1rem' }}>
                            <strong style={{ color: '#eee' }}>{tr.title}</strong>
                            <div style={{ fontSize: '0.75rem', color: '#777' }}>{tr.location || 'Sabaneta'}</div>
                          </td>
                          <td style={{ padding: '0.8rem 1rem' }}>
                            <span style={{ background: '#1f1f1f', color: '#bbb', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                              {tr.category}
                            </span>
                          </td>
                          <td style={{ padding: '0.8rem 1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <Crown size={14} color="var(--gold)" />
                              <strong style={{ color: 'var(--gold)' }}>{tr.champion_name}</strong>
                            </div>
                          </td>
                          <td style={{ padding: '0.8rem 1rem', color: '#aaa' }}>
                            {tr.runner_up || '—'}
                          </td>
                          <td style={{ padding: '0.8rem 1rem', textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={() => handleDeleteTrophy(tr.id)}
                              className="btn btn--sm"
                              style={{ background: '#291212', color: '#ff8a80', border: '1px solid #b71c1c', padding: '0.3rem 0.5rem' }}
                              title="Eliminar del palmarés"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              )}
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
                    <FileUploadField
                      bucket="documents"
                      mode="public"
                      folder="repositorio"
                      accept=".pdf,.pgn,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                      label="Subir archivo (PDF, PGN, Word, Excel, imagen)"
                      onUploaded={(url, file) => {
                        const ext = file.name.split('.').pop()?.toLowerCase() || newDoc.file_type;
                        setNewDoc({ ...newDoc, file_url: url, file_type: ext, file_size: formatFileSize(file.size) });
                      }}
                    />
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
                        <option value="Resolución">Resolución</option>
                        <option value="Acta">Acta (Asamblea/Junta Directiva)</option>
                        <option value="General">General</option>
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
                    <FileUploadField
                      bucket="gallery"
                      mode="public"
                      folder="club"
                      accept="image/*"
                      label="Subir fotografía desde tu equipo"
                      onUploaded={(url) => setNewGalleryItem({ ...newGalleryItem, src: url })}
                    />
                    {newGalleryItem.src && (
                      <img
                        src={newGalleryItem.src}
                        alt="Previsualización"
                        style={{ maxHeight: '160px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #333' }}
                      />
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                      <input
                        type="text"
                        required
                        placeholder="O pega la ruta/URL de la imagen (ej. assets/img/campeon-sub8.webp)"
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
              {/* Cabecera de la Sección Afiliados */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <h1 className="display display--gold" style={{ fontSize: '1.8rem', margin: 0 }}>
                    Control de Afiliados y Admisiones
                  </h1>
                  <p style={{ color: '#888', margin: 0 }}>
                    Administra el padrón de deportistas activos, categorías y solicitudes de vinculación en línea
                  </p>
                </div>
                {membersSubTab === 'active' ? (
                  <button onClick={handleExportMembersCSV} className="btn btn--primary btn--sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Download size={16} />
                    <span>Exportar Lista a CSV</span>
                  </button>
                ) : (
                  <button onClick={handleExportApplicationsCSV} className="btn btn--primary btn--sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Download size={16} />
                    <span>Exportar Solicitudes a CSV</span>
                  </button>
                )}
              </div>

              {/* Pestañas de Navegación: Activos vs Solicitudes */}
              <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #282828', marginBottom: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setMembersSubTab('active')}
                  style={{
                    background: 'none',
                    border: 'none',
                    borderBottom: membersSubTab === 'active' ? '2px solid var(--gold)' : '2px solid transparent',
                    color: membersSubTab === 'active' ? 'var(--gold)' : '#888',
                    fontWeight: 700,
                    padding: '0.6rem 1.2rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.95rem'
                  }}
                >
                  <Users size={16} />
                  <span>Afiliados Activos & Roles ({members.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMembersSubTab('applications')}
                  style={{
                    background: 'none',
                    border: 'none',
                    borderBottom: membersSubTab === 'applications' ? '2px solid var(--gold)' : '2px solid transparent',
                    color: membersSubTab === 'applications' ? 'var(--gold)' : '#888',
                    fontWeight: 700,
                    padding: '0.6rem 1.2rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.95rem'
                  }}
                >
                  <UserPlus size={16} />
                  <span>Solicitudes de Admisión & Afiliación ({applications.length})</span>
                  {applications.filter(a => a.status === 'pending').length > 0 && (
                    <span style={{ background: '#f59e0b', color: '#000', fontSize: '0.7rem', padding: '0.1rem 0.45rem', borderRadius: '50px', fontWeight: 800 }}>
                      {applications.filter(a => a.status === 'pending').length}
                    </span>
                  )}
                </button>
              </div>

              {/* Sub-Pestaña 1: Afiliados Activos */}
              {membersSubTab === 'active' && (
                <div>
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

                  {/* Buscador de Afiliados */}
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
                                    onClick={() => setCardMember(m)}
                                    className="btn btn--ghost btn--sm"
                                    style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                                    title="Generar Carnet Digital de Afiliado"
                                  >
                                    <CreditCard size={12} />
                                    <span>Carnet</span>
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

              {/* Sub-Pestaña 2: Solicitudes de Admisión & Afiliación */}
              {membersSubTab === 'applications' && (
                <div>
                  {/* Filtros de Estado */}
                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.2rem' }}>
                    {[
                      { id: 'all', label: 'Todas las Solicitudes', count: applications.length },
                      { id: 'pending', label: 'Pendientes', count: applications.filter(a => a.status === 'pending').length },
                      { id: 'contacted', label: 'Contactadas', count: applications.filter(a => a.status === 'contacted').length },
                      { id: 'approved', label: 'Aprobadas', count: applications.filter(a => a.status === 'approved').length },
                      { id: 'rejected', label: 'Rechazadas / Archivadas', count: applications.filter(a => a.status === 'rejected').length },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setApplicationFilter(f.id as any)}
                        style={{
                          background: applicationFilter === f.id ? 'var(--gold)' : '#181818',
                          color: applicationFilter === f.id ? '#000' : '#ccc',
                          border: `1px solid ${applicationFilter === f.id ? 'var(--gold)' : '#333'}`,
                          padding: '0.4rem 0.85rem',
                          borderRadius: '50px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem'
                        }}
                      >
                        <span>{f.label}</span>
                        <span style={{
                          background: applicationFilter === f.id ? '#000' : '#282828',
                          color: applicationFilter === f.id ? 'var(--gold)' : '#aaa',
                          padding: '0.1rem 0.4rem',
                          borderRadius: '50px',
                          fontSize: '0.72rem'
                        }}>
                          {f.count}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Buscador de Solicitudes */}
                  <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                    <Search size={18} color="#666" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                    <input
                      type="text"
                      placeholder="Buscar por nombre, documento, correo, municipio o categoría..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.6rem', borderRadius: '8px', background: '#141414', border: '1px solid #333', color: '#fff' }}
                    />
                  </div>

                  {/* Listado de Solicitudes */}
                  <div style={{ background: '#141414', border: '1px solid #222', borderRadius: '12px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                      <thead>
                        <tr style={{ background: '#1e1e1e', borderBottom: '1px solid #333', color: '#aaa', textTransform: 'uppercase', fontSize: '0.74rem' }}>
                          <th style={{ padding: '1rem' }}>Aspirante & Documento</th>
                          <th style={{ padding: '1rem' }}>Categoría & Nivel</th>
                          <th style={{ padding: '1rem' }}>Contacto & Acudiente</th>
                          <th style={{ padding: '1rem' }}>Estado</th>
                          <th style={{ padding: '1rem', textAlign: 'right' }}>Gestión & Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {applications
                          .filter((app) => {
                            if (applicationFilter !== 'all' && app.status !== applicationFilter) return false;
                            const search = searchTerm.toLowerCase();
                            return (
                              app.applicant_name.toLowerCase().includes(search) ||
                              app.applicant_lastname.toLowerCase().includes(search) ||
                              app.doc_number.includes(search) ||
                              app.email.toLowerCase().includes(search) ||
                              app.desired_category.toLowerCase().includes(search) ||
                              (app.municipality || '').toLowerCase().includes(search) ||
                              (app.notes || '').toLowerCase().includes(search)
                            );
                          })
                          .map((app) => {
                            const fullName = `${app.applicant_name} ${app.applicant_lastname}`.trim();
                            const radicadoMatch = (app.notes || '').match(/SOL-CAPA-\d+-2026/);
                            const radicadoCode = radicadoMatch ? radicadoMatch[0] : `SOL-CAPA-${app.id.slice(0, 6).toUpperCase()}-2026`;

                            return (
                              <tr key={app.id} style={{ borderBottom: '1px solid #222' }}>
                                <td style={{ padding: '1rem' }}>
                                  <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{fullName}</div>
                                  <div style={{ fontSize: '0.78rem', color: '#aaa', marginTop: '0.15rem' }}>
                                    {app.doc_type} {app.doc_number} · {app.age ? `${app.age} años` : 'Edad N/D'}
                                  </div>
                                  <div style={{ fontSize: '0.74rem', color: '#888', marginTop: '0.15rem' }}>
                                    {app.municipality} · EPS: {app.health_provider || 'Particular'}
                                  </div>
                                  <div style={{ fontSize: '0.7rem', color: 'var(--gold)', fontWeight: 600, marginTop: '0.25rem' }}>
                                    {radicadoCode}
                                  </div>
                                </td>

                                <td style={{ padding: '1rem' }}>
                                  <div style={{ color: 'var(--gold)', fontWeight: 600 }}>{app.desired_category}</div>
                                  <div style={{ fontSize: '0.8rem', color: '#bbb', marginTop: '0.2rem' }}>
                                    Elo Est: <strong style={{ color: '#fff' }}>{app.approximate_elo || 0}</strong>
                                  </div>
                                  {app.notes && (
                                    <div style={{ fontSize: '0.75rem', color: '#777', fontStyle: 'italic', marginTop: '0.3rem', maxWidth: '240px', lineHeight: 1.4 }}>
                                      "{app.notes}"
                                    </div>
                                  )}
                                </td>

                                <td style={{ padding: '1rem' }}>
                                  <div style={{ color: '#ccc', fontSize: '0.85rem' }}>{app.email}</div>
                                  <div style={{ color: '#888', fontSize: '0.82rem', marginTop: '0.15rem' }}>
                                    Tel: <span style={{ color: '#fff' }}>{app.phone}</span>
                                  </div>
                                  {app.guardian_name && (
                                    <div style={{ fontSize: '0.75rem', color: '#93c5fd', marginTop: '0.25rem' }}>
                                      Acudiente: {app.guardian_name} ({app.guardian_phone || 'Sin tel.'})
                                    </div>
                                  )}
                                </td>

                                <td style={{ padding: '1rem' }}>
                                  <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    padding: '0.25rem 0.65rem',
                                    borderRadius: '50px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    background:
                                      app.status === 'approved' ? 'rgba(34,197,94,0.15)' :
                                      app.status === 'contacted' ? 'rgba(59,130,246,0.15)' :
                                      app.status === 'rejected' ? 'rgba(239,68,68,0.15)' :
                                      'rgba(245,158,11,0.15)',
                                    color:
                                      app.status === 'approved' ? '#4ade80' :
                                      app.status === 'contacted' ? '#60a5fa' :
                                      app.status === 'rejected' ? '#f87171' :
                                      '#fbbf24',
                                    border: `1px solid ${
                                      app.status === 'approved' ? '#15803d' :
                                      app.status === 'contacted' ? '#1d4ed8' :
                                      app.status === 'rejected' ? '#b91c1c' :
                                      '#b45309'
                                    }`
                                  }}>
                                    {app.status === 'approved' ? 'Aprobada' :
                                     app.status === 'contacted' ? 'Contactada' :
                                     app.status === 'rejected' ? 'Rechazada' :
                                     'Pendiente'}
                                  </span>
                                </td>

                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                  <div style={{ display: 'inline-flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                    {/* Botón WhatsApp */}
                                    <button
                                      type="button"
                                      onClick={() => whatsappService.openApplicationContact(fullName, app.phone, app.desired_category, radicadoCode)}
                                      className="btn btn--sm"
                                      style={{ background: '#25D366', color: '#fff', border: 'none', padding: '0.25rem 0.6rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                                      title="Enviar mensaje de contacto y bienvenida vía WhatsApp"
                                    >
                                      <MessageCircle size={13} />
                                      <span>WhatsApp</span>
                                    </button>

                                    {/* Botón Aprobar */}
                                    {app.status !== 'approved' && (
                                      <button
                                        type="button"
                                        onClick={() => handleApproveApplication(app)}
                                        className="btn btn--primary btn--sm"
                                        style={{ background: '#16a34a', borderColor: '#15803d', padding: '0.25rem 0.6rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                                        title="Aprobar e incorporar automáticamente al padrón de deportistas activos"
                                      >
                                        <UserCheck size={13} />
                                        <span>Aprobar</span>
                                      </button>
                                    )}

                                    {/* Botón Contactar */}
                                    {app.status === 'pending' && (
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateApplicationStatus(app.id, 'contacted')}
                                        className="btn btn--ghost btn--sm"
                                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', borderColor: '#3b82f6', color: '#60a5fa' }}
                                        title="Marcar solicitud como contactada"
                                      >
                                        <span>Contactada</span>
                                      </button>
                                    )}

                                    {/* Botón Rechazar */}
                                    {app.status !== 'rejected' && (
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateApplicationStatus(app.id, 'rejected')}
                                        className="btn btn--ghost btn--sm"
                                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', borderColor: '#444', color: '#888' }}
                                        title="Archivar o rechazar solicitud"
                                      >
                                        <UserX size={13} />
                                      </button>
                                    )}

                                    {/* Botón Eliminar */}
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteApplication(app.id)}
                                      className="btn btn--ghost btn--sm"
                                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderColor: '#7f1d1d', color: '#f87171' }}
                                      title="Eliminar registro"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        {applications.length === 0 && (
                          <tr>
                            <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#777' }}>
                              No hay solicitudes de afiliación registradas hasta el momento.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
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
                          <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                            <button
                              type="button"
                              onClick={() => {
                                const mem = members.find((m) => m.id === p.user_id || m.correo === p.user_email);
                                const phone = mem?.telefono || '3002545835';
                                whatsappService.openPaymentReminder(phone, p.user_name || 'Afiliado', p.period, p.amount);
                              }}
                              className="btn btn--sm"
                              style={{ background: '#123018', color: '#81c784', border: '1px solid #2e7d32', padding: '0.3rem 0.5rem' }}
                              title="Enviar notificación o consulta por WhatsApp"
                            >
                              <MessageCircle size={14} />
                            </button>
                            {p.receipt_url && (
                              <button
                                type="button"
                                onClick={() => handleViewReceipt(p.receipt_url!)}
                                className="btn btn--sm"
                                style={{ background: '#1a1a2e', color: '#90caf9', border: '1px solid #303f9f', padding: '0.3rem 0.5rem' }}
                                title="Ver comprobante adjunto"
                              >
                                <Eye size={14} />
                              </button>
                            )}
                            {p.status === 'pending' && (
                              <>
                                <button onClick={() => handleUpdatePaymentStatus(p.id, 'approved')} className="btn btn--primary btn--sm" style={{ padding: '0.3rem 0.6rem' }} title="Aprobar cuota">
                                  <Check size={14} />
                                </button>
                                <button onClick={() => handleUpdatePaymentStatus(p.id, 'rejected')} className="btn btn--ghost btn--sm" style={{ padding: '0.3rem 0.6rem', borderColor: '#b71c1c', color: '#ff8a80' }} title="Rechazar cuota">
                                  <X size={14} />
                                </button>
                              </>
                            )}
                            {p.status !== 'pending' && (
                              <span style={{ fontSize: '0.8rem', color: '#666' }}>Procesado</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 8. SECCIÓN: HORARIOS DE CLASE & CONTROL DE ASISTENCIA INDER */}
          {activeSection === 'schedules' && (
            <div>
              {/* Encabezado y sub-pestañas */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h1 className="display display--gold" style={{ fontSize: '1.8rem' }}>Horarios & Control de Asistencia</h1>
                  <p style={{ color: '#888' }}>Supervisión técnica de entrenamientos y reporte oficial para Inder Sabaneta</p>
                </div>
                {scheduleSubTab === 'schedules' && (
                  <button onClick={() => setShowScheduleModal(true)} className="btn btn--primary btn--sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Plus size={16} /> Añadir Horario
                  </button>
                )}
              </div>

              {/* Selector de sub-sección */}
              <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '2rem', borderBottom: '1px solid #222', paddingBottom: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setScheduleSubTab('schedules')}
                  className={`btn btn--sm ${scheduleSubTab === 'schedules' ? 'btn--primary' : 'btn--ghost'}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Calendar size={16} />
                  <span>Cronograma de Clases ({schedules.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleSubTab('attendance')}
                  className={`btn btn--sm ${scheduleSubTab === 'attendance' ? 'btn--primary' : 'btn--ghost'}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <ClipboardList size={16} />
                  <span>Toma de Asistencia & Planilla Inder ({attendance.length})</span>
                </button>
              </div>

              {scheduleSubTab === 'schedules' ? (
                <>
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
                </>
              ) : (
                /* Sub-pestaña: Toma de Asistencia & Reportes Inder */
                <div>
                  {/* Barra de Filtro y Acciones de la Sesión */}
                  <div style={{ background: '#141414', border: '1px solid #282828', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.2rem', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: '#888', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                            Grupo / Entrenamiento:
                          </label>
                          <select
                            value={selectedAttendanceSchedule}
                            onChange={(e) => setSelectedAttendanceSchedule(e.target.value)}
                            style={{ padding: '0.6rem 0.9rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff', fontSize: '0.9rem' }}
                          >
                            {schedules.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.category} ({s.day_of_week})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: '#888', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                            Fecha de Sesión:
                          </label>
                          <input
                            type="date"
                            value={attendanceDate}
                            onChange={(e) => setAttendanceDate(e.target.value)}
                            style={{ padding: '0.6rem 0.9rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff', fontSize: '0.9rem' }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={handleInitializeSessionRoster}
                          className="btn btn--ghost btn--sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', border: '1px solid #444' }}
                          title="Cargar los alumnos del club en la planilla de esta fecha"
                        >
                          <Users size={15} />
                          <span>Cargar Alumnos</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleExportInderAttendanceCsv(selectedAttendanceSchedule, attendanceDate)}
                          className="btn btn--sm"
                          style={{
                            background: 'linear-gradient(135deg, var(--gold), #e0a820)',
                            color: '#000',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.6rem 1rem'
                          }}
                        >
                          <Download size={15} />
                          <span>Exportar Planilla Inder (CSV)</span>
                        </button>
                      </div>
                    </div>

                    {/* Resumen Institucional y Métricas */}
                    {(() => {
                      const curSch = schedules.find((s) => s.id === selectedAttendanceSchedule) || schedules[0];
                      const sesAtts = attendance.filter(
                        (a) => a.session_date === attendanceDate && (!a.schedule_id || a.schedule_id === selectedAttendanceSchedule)
                      );
                      const presCount = sesAtts.filter((a) => a.status === 'present').length;
                      const excCount = sesAtts.filter((a) => a.status === 'excused').length;
                      const absCount = sesAtts.filter((a) => a.status === 'absent').length;
                      const attRate = sesAtts.length > 0 ? Math.round((presCount / sesAtts.length) * 100) : 0;

                      return (
                        <div style={{ marginTop: '1.2rem', paddingTop: '1.2rem', borderTop: '1px solid #222' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                              <span style={{ fontSize: '0.75rem', background: '#1b3b22', color: '#81c784', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 700 }}>
                                Inder Sabaneta · Res. 042
                              </span>
                              <span style={{ fontSize: '0.9rem', color: '#ccc', marginLeft: '0.6rem' }}>
                                Instructor: <strong style={{ color: '#fff' }}>{curSch?.trainer}</strong> · {curSch?.location}
                              </span>
                            </div>

                            {/* Tarjetas de Estadísticas de Sesión */}
                            <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                              <span style={{ background: '#1e1e1e', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.82rem', border: '1px solid #333' }}>
                                Total: <strong>{sesAtts.length}</strong>
                              </span>
                              <span style={{ background: '#132816', color: '#4caf50', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.82rem', border: '1px solid #2e7d32', fontWeight: 700 }}>
                                Presentes: {presCount}
                              </span>
                              <span style={{ background: '#12263a', color: '#42a5f5', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.82rem', border: '1px solid #1976d2' }}>
                                Excusas: {excCount}
                              </span>
                              <span style={{ background: '#381313', color: '#ef5350', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.82rem', border: '1px solid #c62828' }}>
                                Ausentes: {absCount}
                              </span>
                              <span style={{ background: '#252010', color: 'var(--gold)', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.82rem', border: '1px solid #8d7318', fontWeight: 800 }}>
                                Asistencia: {attRate}%
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Tabla de Asistencia */}
                  {(() => {
                    const curSch = schedules.find((s) => s.id === selectedAttendanceSchedule) || schedules[0];
                    const sesAtts = attendance.filter(
                      (a) => a.session_date === attendanceDate && (!a.schedule_id || a.schedule_id === selectedAttendanceSchedule)
                    );

                    if (sesAtts.length === 0) {
                      return (
                        <div style={{ background: '#141414', border: '1px dashed #333', borderRadius: '12px', padding: '3rem', textAlign: 'center' }}>
                          <Users size={40} style={{ color: '#666', marginBottom: '1rem' }} />
                          <h3 style={{ color: '#ccc', marginBottom: '0.5rem' }}>No hay lista de asistencia iniciada para esta sesión</h3>
                          <p style={{ color: '#888', maxWidth: '460px', margin: '0 auto 1.5rem', fontSize: '0.9rem' }}>
                            Puedes cargar automáticamente los deportistas inscritos en el club o agregar asistentes de manera individual.
                          </p>
                          <button
                            type="button"
                            onClick={handleInitializeSessionRoster}
                            className="btn btn--primary btn--sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                          >
                            <Users size={16} /> Cargar Alumnos Registrados
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div style={{ background: '#141414', border: '1px solid #282828', borderRadius: '12px', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ background: '#1a1a1a', borderBottom: '1px solid #333', color: '#888', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                              <th style={{ padding: '0.9rem 1.2rem' }}>Deportista</th>
                              <th style={{ padding: '0.9rem 1.2rem' }}>Estado de Asistencia</th>
                              <th style={{ padding: '0.9rem 1.2rem' }}>Observaciones Técnicas</th>
                              <th style={{ padding: '0.9rem 1.2rem', textAlign: 'right' }}>Notificación</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sesAtts.map((att) => {
                              const athlete = members.find((m) => m.id === att.user_id || `${m.nombre} ${m.apellido}`.trim() === att.student_name);
                              const phone = athlete?.telefono || '3002545835';

                              return (
                                <tr key={att.id} style={{ borderBottom: '1px solid #202020' }}>
                                  <td style={{ padding: '1rem 1.2rem' }}>
                                    <div style={{ fontWeight: 600, color: '#fff' }}>{att.student_name}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#888' }}>
                                      {athlete?.categoria_ajedrez || curSch?.category || 'Alumno'} {athlete?.fide_id ? `· FIDE: ${athlete.fide_id}` : ''}
                                    </div>
                                  </td>

                                  <td style={{ padding: '1rem 1.2rem' }}>
                                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateAttendanceStatus(att.id, 'present')}
                                        className="btn btn--sm"
                                        style={{
                                          padding: '0.35rem 0.7rem',
                                          background: att.status === 'present' ? '#2e7d32' : '#1e1e1e',
                                          color: att.status === 'present' ? '#fff' : '#888',
                                          border: `1px solid ${att.status === 'present' ? '#4caf50' : '#333'}`,
                                          fontSize: '0.8rem',
                                          fontWeight: att.status === 'present' ? 700 : 400,
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '0.3rem'
                                        }}
                                        title="Marcar como Presente"
                                      >
                                        <Check size={13} /> Presente
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleUpdateAttendanceStatus(att.id, 'excused')}
                                        className="btn btn--sm"
                                        style={{
                                          padding: '0.35rem 0.7rem',
                                          background: att.status === 'excused' ? '#1565c0' : '#1e1e1e',
                                          color: att.status === 'excused' ? '#fff' : '#888',
                                          border: `1px solid ${att.status === 'excused' ? '#42a5f5' : '#333'}`,
                                          fontSize: '0.8rem',
                                          fontWeight: att.status === 'excused' ? 700 : 400,
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '0.3rem'
                                        }}
                                        title="Marcar con Excusa Médica o Escolar"
                                      >
                                        <AlertCircle size={13} /> Excusa
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleUpdateAttendanceStatus(att.id, 'absent')}
                                        className="btn btn--sm"
                                        style={{
                                          padding: '0.35rem 0.7rem',
                                          background: att.status === 'absent' ? '#c62828' : '#1e1e1e',
                                          color: att.status === 'absent' ? '#fff' : '#888',
                                          border: `1px solid ${att.status === 'absent' ? '#ef5350' : '#333'}`,
                                          fontSize: '0.8rem',
                                          fontWeight: att.status === 'absent' ? 700 : 400,
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '0.3rem'
                                        }}
                                        title="Marcar como Ausente"
                                      >
                                        <X size={13} /> Ausente
                                      </button>
                                    </div>
                                  </td>

                                  <td style={{ padding: '1rem 1.2rem' }}>
                                    <input
                                      type="text"
                                      defaultValue={att.notes || ''}
                                      onBlur={(e) => handleUpdateAttendanceNotes(att.id, e.target.value)}
                                      placeholder="Ej. Análisis de aperturas, puntual..."
                                      style={{
                                        width: '100%',
                                        maxWidth: '300px',
                                        padding: '0.4rem 0.6rem',
                                        borderRadius: '6px',
                                        background: '#1a1a1a',
                                        border: '1px solid #333',
                                        color: '#ddd',
                                        fontSize: '0.82rem'
                                      }}
                                    />
                                  </td>

                                  <td style={{ padding: '1rem 1.2rem', textAlign: 'right' }}>
                                    {att.status === 'absent' && (
                                      <button
                                        type="button"
                                        onClick={() => whatsappService.openAttendanceNotice(phone, att.student_name, curSch?.category || 'Clase', att.session_date)}
                                        className="btn btn--sm"
                                        style={{
                                          background: '#25D366',
                                          color: '#000',
                                          fontWeight: 700,
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '0.3rem',
                                          border: 'none',
                                          fontSize: '0.75rem',
                                          padding: '0.35rem 0.6rem'
                                        }}
                                        title="Enviar aviso por WhatsApp de inasistencia al deportista o acudiente"
                                      >
                                        <MessageCircle size={13} />
                                        <span>Avisar Falla</span>
                                      </button>
                                    )}
                                    {att.status !== 'absent' && (
                                      <span style={{ fontSize: '0.8rem', color: '#666' }}>Al día</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>

                        {/* Fila para agregar alumno rápido */}
                        <div style={{ background: '#181818', borderTop: '1px solid #282828', padding: '1rem 1.2rem', display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                          <input
                            type="text"
                            placeholder="Nombre del deportista o invitado..."
                            value={quickAttendeeName}
                            onChange={(e) => setQuickAttendeeName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddStudentToSession(quickAttendeeName); }}
                            style={{ padding: '0.5rem 0.8rem', borderRadius: '6px', background: '#121212', border: '1px solid #333', color: '#fff', fontSize: '0.85rem', flex: 1, maxWidth: '320px' }}
                          />
                          <button
                            type="button"
                            onClick={() => handleAddStudentToSession(quickAttendeeName)}
                            className="btn btn--primary btn--sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                          >
                            <Plus size={14} />
                            <span>Añadir a la Sesión</span>
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        {msg.phone && (
                          <button
                            type="button"
                            onClick={() => whatsappService.openContactReply(msg.phone || '', msg.name, msg.subject || 'Consulta')}
                            className="btn btn--sm"
                            style={{ background: '#123018', color: '#81c784', border: '1px solid #2e7d32', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}
                            title="Responder directamente por WhatsApp"
                          >
                            <MessageCircle size={13} />
                            <span>Responder WhatsApp</span>
                          </button>
                        )}
                        <span style={{ fontSize: '0.75rem', color: '#666' }}>
                          {new Date(msg.created_at).toLocaleDateString('es-CO')}
                        </span>
                      </div>
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

      {/* Modal Carnet Digital de Afiliado emitido por Admin */}
      {cardMember && (
        <DigitalAthleteIdCardModal
          isOpen={true}
          onClose={() => setCardMember(null)}
          member={cardMember}
        />
      )}

      {/* Modal Diploma / Certificado Oficial de Torneo */}
      {tournamentCertModalData && (
        <TournamentCertificateModal
          isOpen={true}
          onClose={() => setTournamentCertModalData(null)}
          data={tournamentCertModalData}
        />
      )}

      {/* Modal Asistente de Emparejamientos de Torneo */}
      {showPairingModal && targetEventForPairing && (
        <TournamentPairingModal
          event={targetEventForPairing}
          athletes={athletesForPairing}
          onClose={() => setShowPairingModal(false)}
          onSaveMatches={handleBatchSaveMatches}
        />
      )}

      {/* Modal de Auditoría & Diagnóstico de Base de Datos */}
      <DatabaseDiagnosticModal
        isOpen={showDbDiagnosticModal}
        onClose={() => setShowDbDiagnosticModal(false)}
        tableCounts={{
          profiles: members.length,
          membership_applications: applications.length,
          events: events.length,
          tournament_matches: matches.length,
          tournament_registrations: registrations.length,
          club_trophies: trophies.length,
          posts: posts.length,
          documents: documents.length,
          gallery: gallery.length,
          membership_payments: payments.length,
          class_schedules: schedules.length,
          class_attendance: attendance.length,
          club_announcements: announcements.length,
          contact_messages: messages.length,
          site_settings: 1,
        }}
        onExportBackup={handleExportFullJsonBackup}
        onNotice={triggerNotice}
      />

      {/* Modal Esquema SQL Supabase */}
      {showSqlModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '850px',
              maxHeight: '90vh',
              background: '#141414',
              borderRadius: '16px',
              border: '1px solid #333',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                background: '#101010',
                borderBottom: '1px solid #222',
                padding: '1.2rem 1.8rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Database size={22} color="var(--gold)" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', fontWeight: 700 }}>
                  Esquema SQL de Supabase (Enterprise V2)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', padding: '0.2rem' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.8rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div style={{ background: '#1c1c1c', border: '1px solid #333', borderRadius: '8px', padding: '1rem', fontSize: '0.85rem', color: '#ccc', lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--gold)', display: 'block', marginBottom: '0.3rem' }}>Guía de Configuración en Supabase:</strong>
                1. Ingresa a tu dashboard de Supabase y navega a <strong>SQL Editor</strong>.<br />
                2. Crea una nueva consulta (New Query), pega el contenido de <code>supabase_schema.sql</code> y pulsa <strong>RUN</strong>.<br />
                3. Las 11 tablas, funciones de auto-creación de perfiles y políticas RLS quedarán configuradas de forma idempotente.
              </div>

              <div style={{ position: 'relative' }}>
                <pre
                  style={{
                    margin: 0,
                    padding: '1.2rem',
                    background: '#0a0a0a',
                    border: '1px solid #282828',
                    borderRadius: '8px',
                    color: '#81c784',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    lineHeight: 1.5,
                    maxHeight: '340px',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                  }}
                >
{`-- CLUB DEPORTIVO DE AJEDREZ CAPABLANCA SABANETA
-- ESQUEMA COMPLETO DE BASE DE DATOS SUPABASE (11 TABLAS)
-- 1. profiles (auth.users sync + FIDE ID + Elo Rating)
-- 2. site_settings (configuraciones globales del club)
-- 3. posts (noticias, blog y material formativo)
-- 4. events (calendario oficial de torneos y válidas)
-- 5. tournament_registrations (nómina con estados: confirmed, pending, attended, cancelled)
-- 6. tournament_matches (emparejamientos, mesas, resultados 1-0, 0-1, 1/2-1/2 y PGN)
-- 7. documents (repositorio de partidas PGN y reglamentos)
-- 8. gallery (galería fotográfica con categorías y orden)
-- 9. membership_payments (control de cuotas y transferencias)
-- 10. class_schedules (cronograma semanal de entrenamientos)
-- 11. club_announcements (alertas prioritarias en landing)
-- 12. contact_messages (mensajes de contacto institucional)

-- Archivo de referencia: supabase_schema.sql en la raíz del proyecto.`}
                </pre>
              </div>
            </div>

            <div
              style={{
                background: '#101010',
                borderTop: '1px solid #222',
                padding: '1rem 1.8rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <span style={{ fontSize: '0.8rem', color: '#777' }}>
                Archivo: <code>supabase_schema.sql</code> (439 líneas)
              </span>
              <div style={{ display: 'flex', gap: '0.8rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText('-- Ver archivo supabase_schema.sql en la raíz del proyecto para el código completo.');
                    setSqlCopied(true);
                    setTimeout(() => setSqlCopied(false), 3000);
                  }}
                  className="btn btn--primary btn--sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
                >
                  {sqlCopied ? <Check size={15} /> : <Copy size={15} />}
                  <span>{sqlCopied ? 'Copiado al Portapapeles' : 'Copiar Referencia'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSqlModal(false)}
                  className="btn btn--ghost btn--sm"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
