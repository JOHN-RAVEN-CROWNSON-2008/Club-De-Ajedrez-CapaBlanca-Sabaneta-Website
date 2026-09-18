import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { FileUploadField } from '../../components/common/FileUploadField';
import { INITIAL_DOCUMENTS, INITIAL_EVENTS, INITIAL_PAYMENTS, INITIAL_SCHEDULES, INITIAL_MATCHES, INITIAL_ATTENDANCE, INITIAL_REGISTRATIONS, INITIAL_ANNOUNCEMENTS } from '../../lib/initialData';
import { ClubDocument, ClubEvent, MembershipPayment, ClassSchedule, TournamentMatch, ClassAttendance, TournamentRegistration, ClubAnnouncement } from '../../types/database';
import { resendService } from '../../services/resendService';
import {
  User, FileText, Trophy, Download, LogOut, CheckCircle2,
  Calendar, MapPin, Edit2, Save, CreditCard, Clock, Search, Plus,
  Swords, Eye, ChevronDown, ChevronUp, Award, ClipboardCheck, Users,
  Megaphone, X, Globe, ExternalLink, MessageCircle
} from 'lucide-react';
import { PgnViewerModal } from '../../components/common/PgnViewerModal';
import { AffiliationCertificateModal } from '../../components/common/AffiliationCertificateModal';
import { DigitalAthleteIdCardModal } from '../../components/common/DigitalAthleteIdCardModal';
import { TournamentCertificateModal, TournamentCertificateData } from '../../components/common/TournamentCertificateModal';
import { DailyTacticalPuzzle } from '../../components/common/DailyTacticalPuzzle';
import { MemberLoginView } from '../auth/MemberLoginView';
import { calculateTournamentStandings, exportStandingsToCsv } from '../../lib/tournamentStandings';

export const MembersDashboardView: React.FC = () => {
  const { user, loading, logout, updateProfile, isConfigured } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'documentos' | 'torneos' | 'pagos' | 'horarios' | 'lichess' | 'perfil'>('documentos');
  const [lichessViewMode, setLichessViewMode] = useState<'tv' | 'analysis' | 'puzzles'>('tv');
  const [quickLichessInput, setQuickLichessInput] = useState<string>('');
  const [documents, setDocuments] = useState<ClubDocument[]>(INITIAL_DOCUMENTS);
  const [events, setEvents] = useState<ClubEvent[]>(INITIAL_EVENTS);
  const [matches, setMatches] = useState<TournamentMatch[]>(INITIAL_MATCHES);
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>(INITIAL_REGISTRATIONS);
  const [payments, setPayments] = useState<MembershipPayment[]>(INITIAL_PAYMENTS);
  const [schedules, setSchedules] = useState<ClassSchedule[]>(INITIAL_SCHEDULES);
  const [attendance, setAttendance] = useState<ClassAttendance[]>(INITIAL_ATTENDANCE);
  const [myRegistrations, setMyRegistrations] = useState<string[]>([]);
  const [selectedDocCategory, setSelectedDocCategory] = useState<string>('all');
  const [docSearch, setDocSearch] = useState<string>('');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [tournamentSubTabs, setTournamentSubTabs] = useState<Record<string, 'matches' | 'standings' | 'roster'>>({});
  const [tournamentCertModalData, setTournamentCertModalData] = useState<TournamentCertificateData | null>(null);
  const [pgnModalData, setPgnModalData] = useState<{
    isOpen: boolean;
    title: string;
    whitePlayer: string;
    blackPlayer: string;
    result: string;
    pgn: string;
  } | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    ciudad: '',
    categoria_ajedrez: '',
    elo_rating: 0,
    fide_id: '',
    lichess_username: '',
  });

  // Reportar pago
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [activeBanner, setActiveBanner] = useState<ClubAnnouncement | null>(
    INITIAL_ANNOUNCEMENTS.find((a) => a.active && (a.target === 'all' || a.target === 'members')) || null
  );
  const [paymentForm, setPaymentForm] = useState({
    amount: 120000,
    payment_method: 'Bancolombia' as const,
    reference_number: '',
    period: 'Octubre 2026',
    notes: '',
    receipt_url: '',
  });

  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login-afiliado');
    } else {
      setProfileForm({
        nombre: user.nombre || '',
        apellido: user.apellido || '',
        telefono: user.telefono || '',
        ciudad: user.ciudad || 'Sabaneta',
        categoria_ajedrez: user.categoria_ajedrez || 'Iniciación',
        elo_rating: user.elo_rating || 0,
        fide_id: user.fide_id || '',
        lichess_username: user.lichess_username || '',
      });
      if (user.lichess_username) {
        setQuickLichessInput(user.lichess_username);
      }
    }
  }, [user, navigate]);

  const handleQuickLinkLichess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickLichessInput.trim()) return;
    const res = await updateProfile({ lichess_username: quickLichessInput.trim() });
    if (res.success) {
      setNotice(`Usuario de Lichess "${quickLichessInput.trim()}" vinculado con éxito`);
      setTimeout(() => setNotice(''), 3500);
    }
  };

  const handleDownloadDocument = async (doc: ClubDocument) => {
    if (!doc.file_url || doc.file_url === '#') {
      setNotice(`El recurso "${doc.title}" estará próximamente disponible.`);
      setTimeout(() => setNotice(''), 3500);
      return;
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('documents')
          .update({ downloads_count: (doc.downloads_count || 0) + 1 })
          .eq('id', doc.id);
      } catch (err) {
        console.error('Error al actualizar contador de descargas:', err);
      }
    }

    setDocuments((prev) =>
      prev.map((d) => (d.id === doc.id ? { ...d, downloads_count: (d.downloads_count || 0) + 1 } : d))
    );

    window.open(doc.file_url, '_blank', 'noopener,noreferrer');
  };


  useEffect(() => {
    async function loadMemberData() {
      if (!isSupabaseConfigured()) {
        setDocuments(INITIAL_DOCUMENTS);
        setEvents(INITIAL_EVENTS);
        setPayments(INITIAL_PAYMENTS);
        setSchedules(INITIAL_SCHEDULES);
        return;
      }

      try {
        const { data: annData } = await supabase
          .from('club_announcements')
          .select('*')
          .eq('active', true)
          .in('target', ['all', 'members'])
          .order('created_at', { ascending: false })
          .limit(1);
        if (annData && annData.length > 0) setActiveBanner(annData[0] as ClubAnnouncement);

        const { data: docData } = await supabase.from('documents').select('*');
        if (docData && docData.length > 0) setDocuments(docData as ClubDocument[]);

        const { data: evData } = await supabase.from('events').select('*');
        if (evData && evData.length > 0) setEvents(evData as ClubEvent[]);

        const { data: schData } = await supabase.from('class_schedules').select('*');
        if (schData && schData.length > 0) setSchedules(schData as ClassSchedule[]);

        const { data: attData } = await supabase.from('class_attendance').select('*').order('session_date', { ascending: false });
        if (attData && attData.length > 0) setAttendance(attData as ClassAttendance[]);

        const { data: matchData } = await supabase.from('tournament_matches').select('*').order('round', { ascending: true }).order('board_number', { ascending: true });
        if (matchData && matchData.length > 0) setMatches(matchData as TournamentMatch[]);

        if (user) {
          const { data: payData } = await supabase
            .from('membership_payments')
            .select('*')
            .eq('user_id', user.id);
          if (payData && payData.length > 0) setPayments(payData as MembershipPayment[]);

          const { data: regData } = await supabase
            .from('tournament_registrations')
            .select('*')
            .order('created_at', { ascending: false });
          if (regData && regData.length > 0) {
            setRegistrations(regData as TournamentRegistration[]);
            setMyRegistrations(
              regData.filter((r) => r.user_id === user.id).map((r) => r.event_id)
            );
          }
        }
      } catch (err) {
        console.error('Error al cargar datos de afiliados:', err);
      }
    }

    loadMemberData();
  }, [user, isConfigured]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await updateProfile(profileForm);
    if (res.success) {
      setEditingProfile(false);
      setNotice('Perfil deportivo actualizado exitosamente');
      setTimeout(() => setNotice(''), 3000);
    }
  };

  const handleRegisterTournament = async (event: ClubEvent) => {
    if (!user) return;

    if (myRegistrations.includes(event.id)) {
      setNotice('Ya te encuentras inscrito en este torneo');
      setTimeout(() => setNotice(''), 3000);
      return;
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('tournament_registrations').insert({
          event_id: event.id,
          user_id: user.id,
          status: 'confirmed',
        });
      } catch (err) {
        console.error('Error al registrar inscripción:', err);
      }
    }

    const newReg: TournamentRegistration = {
      id: crypto.randomUUID(),
      event_id: event.id,
      user_id: user.id,
      status: 'confirmed',
      created_at: new Date().toISOString(),
      profile: user,
    };
    setRegistrations((prev) => [newReg, ...prev]);
    setMyRegistrations((prev) => [...prev, event.id]);
    setTournamentSubTabs((prev) => ({ ...prev, [event.id]: 'roster' }));
    setExpandedEventId(event.id);

    await resendService.sendTournamentConfirmation(
      user.correo,
      `${user.nombre} ${user.apellido}`,
      event.title,
      event.event_date
    );

    setNotice(`¡Inscripción confirmada para "${event.title}"! Se envió comprobante a tu correo.`);
    setTimeout(() => setNotice(''), 4000);
  };

  const handleReportPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const newPay: MembershipPayment = {
      id: crypto.randomUUID(),
      user_id: user.id,
      user_name: `${user.nombre} ${user.apellido}`,
      user_email: user.correo,
      amount: paymentForm.amount,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: paymentForm.payment_method,
      reference_number: paymentForm.reference_number,
      period: paymentForm.period,
      status: 'pending',
      notes: paymentForm.notes,
      receipt_url: paymentForm.receipt_url || undefined,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('membership_payments').insert(newPay);
      } catch (err) {
        console.error('Error al reportar pago en Supabase:', err);
      }
    }

    setPayments([newPay, ...payments]);
    setShowPaymentModal(false);
    setPaymentForm({ amount: 120000, payment_method: 'Bancolombia', reference_number: '', period: 'Octubre 2026', notes: '', receipt_url: '' });
    setNotice('Comprobante de pago reportado. La administración validará tu cuota en breve.');
    setTimeout(() => setNotice(''), 4000);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #222', borderTopColor: 'var(--gold)', borderRadius: '50%', margin: '0 auto 1rem' }} />
          <p style={{ fontSize: '0.9rem', color: '#888' }}>Cargando Portal de Afiliados...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <MemberLoginView />;
  }

  if (user.estado === 'pending') {
    return (
      <div style={{ paddingTop: 'calc(var(--content-offset) + 2rem)', background: '#0a0a0a', color: '#fff', minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingInline: '1rem', paddingBottom: '4rem' }}>
        <div style={{ maxWidth: '580px', width: '100%', background: '#141414', border: '1px solid #333', borderRadius: '16px', padding: '2.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.6)', textAlign: 'center' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(245, 197, 24, 0.12)', border: '2px solid var(--gold)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Clock size={36} />
          </div>
          <span style={{ background: 'rgba(245, 197, 24, 0.15)', color: 'var(--gold)', padding: '0.3rem 0.8rem', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Solicitud en Revisión
          </span>
          <h2 style={{ fontSize: '1.6rem', color: '#fff', fontWeight: 800, margin: '1rem 0 0.6rem' }}>
            Hola, {user.nombre} {user.apellido}
          </h2>
          <p style={{ color: '#ccc', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            Tu solicitud de afiliación al <strong>Club Deportivo de Ajedrez Capablanca Sabaneta</strong> ha sido radicada exitosamente y se encuentra en proceso de revisión por parte de la Comisión Técnica y de Admisiones.
          </p>

          <div style={{ background: '#181818', border: '1px solid #282828', borderRadius: '12px', padding: '1.2rem', textAlign: 'left', marginBottom: '2rem', fontSize: '0.88rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', borderBottom: '1px solid #252525', paddingBottom: '0.5rem' }}>
              <span style={{ color: '#888' }}>Usuario:</span>
              <strong style={{ color: '#fff' }}>@{user.usuario}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', borderBottom: '1px solid #252525', paddingBottom: '0.5rem' }}>
              <span style={{ color: '#888' }}>Correo registrado:</span>
              <strong style={{ color: '#fff' }}>{user.correo}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', borderBottom: '1px solid #252525', paddingBottom: '0.5rem' }}>
              <span style={{ color: '#888' }}>Categoría solicitada:</span>
              <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{user.categoria_ajedrez || 'Iniciación'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#888' }}>Estado actual:</span>
              <span style={{ color: '#f59e0b', fontWeight: 700 }}>Pendiente de Aprobación</span>
            </div>
          </div>

          <p style={{ fontSize: '0.85rem', color: '#888', lineHeight: 1.5, marginBottom: '2rem' }}>
            Una vez validada tu solicitud por la coordinación, recibirás la confirmación y tendrás acceso inmediato al repositorio exclusivo de documentos, análisis en Lichess y carnet digital oficial.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="https://wa.me/573002545835?text=Hola,%20acabo%20de%20registrarme%20en%20el%20portal%20y%20quisiera%20consultar%20el%20estado%20de%20mi%20afiliación."
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--primary btn--sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <MessageCircle size={15} /> Consultar por WhatsApp
            </a>
            <button
              onClick={() => logout().then(() => navigate('/'))}
              className="btn btn--ghost btn--sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderColor: '#444' }}
            >
              <LogOut size={15} /> Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredDocs = documents.filter((doc) => {
    const matchesCategory = selectedDocCategory === 'all' || doc.category === selectedDocCategory;
    const matchesSearch = doc.title.toLowerCase().includes(docSearch.toLowerCase()) ||
                          doc.description.toLowerCase().includes(docSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ paddingTop: 'var(--content-offset)', background: '#0a0a0a', color: '#fff', minHeight: '100vh' }}>
      
      {/* Barra superior de Afiliado */}
      <div style={{ background: '#141414', borderBottom: '1px solid #252525', padding: '1.2rem 0' }}>
        <div className="wrap" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--gold)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem' }}>
              {user.nombre.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                  {user.nombre} {user.apellido}
                </h1>
                <span style={{ background: '#252525', border: '1px solid var(--gold)', color: 'var(--gold)', fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase' }}>
                  Afiliado Activo
                </span>
              </div>
              <p style={{ color: '#888', fontSize: '0.85rem', margin: 0 }}>
                @{user.usuario || 'afiliado'} · {user.correo}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
            <Link
              to="/reloj"
              className="btn btn--ghost btn--sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', border: '1px solid #333' }}
              title="Abrir Reloj Oficial de Ajedrez con ritmos FIDE y atajos"
            >
              <Clock size={15} color="var(--gold)" />
              <span>Reloj Digital</span>
            </Link>
            <a
              href={window.location.port === '5182' ? 'http://localhost:5180' : '/'}
              className="btn btn--ghost btn--sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', border: '1px solid #333' }}
              title="Volver al portal público del club"
            >
              <Globe size={14} color="var(--gold)" />
              <span>Ver Web Principal</span>
            </a>
            <button
              onClick={() => logout().then(() => navigate('/'))}
              className="btn btn--sm"
              style={{ background: '#2e1212', color: '#ff8a80', border: '1px solid #b71c1c', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <LogOut size={14} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notificación temporal */}
      {notice && (
        <div className="wrap" style={{ marginTop: '1rem' }}>
          <div style={{ background: '#1b3a24', border: '1px solid #4caf50', color: '#a5d6a7', padding: '0.8rem 1.2rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <CheckCircle2 size={18} />
            <span>{notice}</span>
          </div>
        </div>
      )}

      {/* Banner de Anuncio Prioritario para Afiliados */}
      {activeBanner && activeBanner.active && (
        <div className="wrap" style={{ marginTop: '1rem' }}>
          <div
            style={{
              background: activeBanner.level === 'urgent' ? '#450a0a' : activeBanner.level === 'warning' ? '#451a03' : '#141414',
              border: `1px solid ${activeBanner.level === 'urgent' ? '#dc2626' : activeBanner.level === 'warning' ? '#d97706' : 'var(--gold)'}`,
              borderRadius: '8px',
              padding: '0.85rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              color: '#fff',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flex: 1 }}>
              <Megaphone size={20} color={activeBanner.level === 'urgent' ? '#f87171' : activeBanner.level === 'warning' ? '#fbbf24' : 'var(--gold)'} />
              <div>
                <strong style={{ color: activeBanner.level === 'urgent' ? '#fca5a5' : activeBanner.level === 'warning' ? '#fde68a' : 'var(--gold)' }}>
                  {activeBanner.title}:
                </strong>{' '}
                <span style={{ fontSize: '0.9rem', color: '#e5e5e5' }}>{activeBanner.message}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveBanner(null)}
              style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', padding: '0.25rem', display: 'inline-flex', alignItems: 'center' }}
              aria-label="Cerrar aviso"
              title="Descartar aviso"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Contenedor Principal */}
      <div className="wrap" style={{ paddingBlock: '2.5rem' }}>
        
        {/* Pestañas de navegación */}
        <div style={{ display: 'flex', gap: '0.8rem', borderBottom: '1px solid #222', paddingBottom: '0.5rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setActiveTab('documentos')}
            className={`btn btn--sm ${activeTab === 'documentos' ? 'btn--primary' : 'btn--ghost'}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <FileText size={16} />
            <span>Documentos & PGN ({documents.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('torneos')}
            className={`btn btn--sm ${activeTab === 'torneos' ? 'btn--primary' : 'btn--ghost'}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Trophy size={16} />
            <span>Inscripción a Torneos ({events.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pagos')}
            className={`btn btn--sm ${activeTab === 'pagos' ? 'btn--primary' : 'btn--ghost'}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <CreditCard size={16} />
            <span>Mis Cuotas & Pagos ({payments.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('horarios')}
            className={`btn btn--sm ${activeTab === 'horarios' ? 'btn--primary' : 'btn--ghost'}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Clock size={16} />
            <span>Horarios de Clase ({schedules.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('lichess')}
            className={`btn btn--sm ${activeTab === 'lichess' ? 'btn--primary' : 'btn--ghost'}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Swords size={16} />
            <span>Tablero Lichess & Estudio</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('perfil')}
            className={`btn btn--sm ${activeTab === 'perfil' ? 'btn--primary' : 'btn--ghost'}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <User size={16} />
            <span>Ficha Deportiva</span>
          </button>
        </div>

        {/* PESTAÑA 1: DOCUMENTOS Y ARCHIVOS PGN */}
        {activeTab === 'documentos' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: 'var(--gold)' }}>
                  Repositorio de Documentos, Partidas PGN y Material
                </h2>
                <p style={{ color: '#888', fontSize: '0.9rem', marginTop: '0.2rem' }}>
                  Recursos pedagógicos y bases de datos exclusivos para socios
                </p>
              </div>

              {/* Categorías */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {['all', 'Material de Estudio', 'Reglamento', 'Partidas PGN', 'Circulares', 'Guía', 'Formulario de inscripción', 'Resolución', 'Acta'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedDocCategory(cat)}
                    style={{
                      padding: '0.4rem 0.8rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      background: selectedDocCategory === cat ? 'var(--gold)' : '#1c1c1c',
                      color: selectedDocCategory === cat ? '#000' : '#ccc',
                      border: '1px solid #333',
                      cursor: 'pointer',
                    }}
                  >
                    {cat === 'all' ? 'Todos' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Buscador de documentos */}
            <div style={{ position: 'relative', marginBottom: '2rem' }}>
              <Search size={18} color="#666" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="text"
                placeholder="Buscar por título, tema o autor (ej. Capablanca, táctica, aperturas)..."
                value={docSearch}
                onChange={(e) => setDocSearch(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.6rem', borderRadius: '8px', background: '#141414', border: '1px solid #333', color: '#fff' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    background: '#151515',
                    border: '1px solid #282828',
                    borderRadius: '14px',
                    padding: '1.8rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase' }}>
                        {doc.category}
                      </span>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        {(!doc.file_url || doc.file_url === '#') && (
                          <span style={{ fontSize: '0.68rem', background: '#2c1e08', color: '#fbbf24', border: '1px solid #785215', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 700 }}>
                            Próximamente
                          </span>
                        )}
                        <span style={{ fontSize: '0.75rem', background: '#222', padding: '0.2rem 0.5rem', borderRadius: '4px', color: '#aaa', textTransform: 'uppercase' }}>
                          {doc.file_type} · {doc.file_size}
                        </span>
                      </div>
                    </div>

                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.6rem', color: '#fff' }}>
                      {doc.title}
                    </h3>
                    <p style={{ color: '#aaa', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                      {doc.description}
                    </p>
                  </div>

                  <div style={{ borderTop: '1px solid #252525', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#666' }}>
                      Descargas: {doc.downloads_count}
                    </span>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      {doc.file_type === 'pgn' && (
                        <button
                          type="button"
                          onClick={() => setPgnModalData({
                            isOpen: true,
                            title: doc.title,
                            whitePlayer: 'José Raúl Capablanca',
                            blackPlayer: 'Frank Marshall',
                            result: '1-0',
                            pgn: '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 O-O 8. c3 d5 9. exd5 Nxd5 10. Nxe5 Nxe5 11. Rxe5 c6 12. d4 Bd6 13. Re1 Qh4 14. g3 Qh3 15. Be3 Bg4 16. Qd3 Rae8 17. Nd2 Re6 18. a4 bxa4 19. Rxa4 f5 20. Qf1 Qh5 21. f4 Rfe8 22. Bxd5 cxd5 23. Qf2 g5 24. fxg5 f4 25. gxf4 Bxf4 26. Qxf4 Bh3 27. Nf1 Re4 28. Qf2 Rf8 29. Qg3 Rg4 30. Rxa6 Rxg3+ 31. Nxg3 Qf3 32. Re2 Qf1+ 33. Nxf1 Rxf1# 0-1',
                          })}
                          className="btn btn--sm"
                          style={{
                            background: '#1f1a10',
                            color: 'var(--gold)',
                            border: '1px solid var(--gold)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontSize: '0.8rem'
                          }}
                        >
                          <Swords size={13} />
                          <span>Ver Partida</span>
                        </button>
                      )}
                      {!doc.file_url || doc.file_url === '#' ? (
                        <button
                          type="button"
                          disabled
                          className="btn btn--sm"
                          style={{
                            background: '#181818',
                            color: '#777',
                            border: '1px solid #2e2e2e',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            cursor: 'not-allowed',
                            fontSize: '0.78rem',
                          }}
                          title="Este recurso estará disponible para descarga en breve"
                        >
                          <Clock size={13} />
                          <span>Próximamente</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDownloadDocument(doc)}
                          className="btn btn--primary btn--sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                        >
                          <Download size={14} />
                          <span>Descargar</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Reto Táctico Diario para Afiliados */}
            <div style={{ marginTop: '3rem' }}>
              <DailyTacticalPuzzle />
            </div>
          </div>
        )}

        {/* PESTAÑA 2: TORNEOS */}
        {activeTab === 'torneos' && (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--gold)' }}>
                Inscripción Directa a Torneos
              </h2>
              <p style={{ color: '#888', fontSize: '0.9rem' }}>
                Preinscríbete a los torneos del club con un solo clic. Recibirás tu confirmación vía correo electrónico.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem' }}>
              {events.map((evt) => {
                const isInscribed = myRegistrations.includes(evt.id);
                return (
                  <div
                    key={evt.id}
                    style={{
                      background: '#151515',
                      border: isInscribed ? '1px solid #4caf50' : '1px solid #282828',
                      borderRadius: '16px',
                      padding: '2rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <span style={{ background: 'var(--gold)', color: '#000', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800 }}>
                          {evt.rhythm}
                        </span>
                        {isInscribed && (
                          <span style={{ color: '#81c784', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                            <CheckCircle2 size={16} /> Preinscrito
                          </span>
                        )}
                      </div>

                      <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff', marginBottom: '0.6rem' }}>
                        {evt.title}
                      </h3>
                      <p style={{ color: '#aaa', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.2rem' }}>
                        {evt.description}
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: '#ccc', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Calendar size={15} color="var(--gold)" />
                          <span>{evt.event_date} · {evt.event_time}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <MapPin size={15} color="var(--gold)" />
                          <span>{evt.location}</span>
                        </div>
                      </div>
                      {/* Emparejamientos & Clasificación */}
                      {(() => {
                        const eventMatches = matches
                          .filter((m) => m.event_id === evt.id)
                          .sort((a, b) => a.round - b.round || a.board_number - b.board_number);
                        const eventRegs = registrations.filter((r) => r.event_id === evt.id && r.status !== 'cancelled');
                        const isExpanded = expandedEventId === evt.id;
                        const subTab = tournamentSubTabs[evt.id] || (eventMatches.length > 0 ? 'matches' : 'roster');
                        const eventStandings = calculateTournamentStandings(eventMatches);
                        const athleteName = `${user?.nombre || ''} ${user?.apellido || ''}`.trim().toLowerCase();
                        const athleteLastName = (user?.apellido || '').trim().toLowerCase();

                        const parsedAthletes = eventRegs.map((r) => {
                          let ext: any = null;
                          try {
                            if (r.notes && r.notes.startsWith('{')) ext = JSON.parse(r.notes);
                          } catch {}
                          const isMe = r.user_id === user?.id;
                          const name = ext?.fullName || (r.profile ? `${r.profile.nombre} ${r.profile.apellido}` : (isMe ? `${user?.nombre} ${user?.apellido}` : 'Deportista Capablanca'));
                          const elo = Number(ext?.eloRating) || r.profile?.elo_rating || (isMe ? user?.elo_rating : 0) || 0;
                          const fide = ext?.fideId || r.profile?.fide_id || (isMe ? user?.fide_id : '') || '';
                          const category = ext?.category || r.profile?.categoria_ajedrez || (isMe ? user?.categoria_ajedrez : 'Categoría Abierta');
                          const club = ext?.clubOrCity || 'Capablanca Sabaneta';
                          const radicado = ext?.regCode || `REG-CAPA-${r.id.slice(0, 6).toUpperCase()}-2026`;
                          const isConfirmed = r.status === 'confirmed' || r.status === 'attended';
                          return {
                            id: r.id,
                            name,
                            elo,
                            fide,
                            category,
                            club,
                            radicado,
                            isConfirmed,
                            isMe,
                            status: r.status,
                          };
                        }).sort((a, b) => (b.elo || 0) - (a.elo || 0));

                        return (
                          <div style={{ marginTop: '1rem', borderTop: '1px solid #252525', paddingTop: '0.8rem' }}>
                            <button
                              type="button"
                              onClick={() => setExpandedEventId(isExpanded ? null : evt.id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--gold)',
                                fontSize: '0.82rem',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                width: '100%',
                                cursor: 'pointer',
                                padding: '0.2rem 0',
                              }}
                            >
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Swords size={15} />
                                Nómina ({eventRegs.length}), Partidas ({eventMatches.length}) & Posiciones ({eventStandings.length})
                              </span>
                              {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                            </button>

                            {isExpanded && (
                              <div style={{ marginTop: '0.8rem' }}>
                                {/* Pestañas internas: Nómina vs Partidas vs Tabla de Posiciones */}
                                <div style={{ display: 'flex', gap: '0.4rem', borderBottom: '1px solid #252525', marginBottom: '0.8rem', flexWrap: 'wrap' }}>
                                  <button
                                    type="button"
                                    onClick={() => setTournamentSubTabs((prev) => ({ ...prev, [evt.id]: 'roster' }))}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      borderBottom: subTab === 'roster' ? '2px solid var(--gold)' : '2px solid transparent',
                                      color: subTab === 'roster' ? 'var(--gold)' : '#777',
                                      fontWeight: subTab === 'roster' ? 700 : 500,
                                      fontSize: '0.78rem',
                                      padding: '0.35rem 0.7rem',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.3rem',
                                    }}
                                  >
                                    <Users size={13} />
                                    <span>Nómina ({eventRegs.length})</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setTournamentSubTabs((prev) => ({ ...prev, [evt.id]: 'matches' }))}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      borderBottom: subTab === 'matches' ? '2px solid var(--gold)' : '2px solid transparent',
                                      color: subTab === 'matches' ? 'var(--gold)' : '#777',
                                      fontWeight: subTab === 'matches' ? 700 : 500,
                                      fontSize: '0.78rem',
                                      padding: '0.35rem 0.7rem',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.3rem',
                                    }}
                                  >
                                    <Swords size={13} />
                                    <span>Partidas ({eventMatches.length})</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setTournamentSubTabs((prev) => ({ ...prev, [evt.id]: 'standings' }))}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      borderBottom: subTab === 'standings' ? '2px solid var(--gold)' : '2px solid transparent',
                                      color: subTab === 'standings' ? 'var(--gold)' : '#777',
                                      fontWeight: subTab === 'standings' ? 700 : 500,
                                      fontSize: '0.78rem',
                                      padding: '0.35rem 0.7rem',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.3rem',
                                    }}
                                  >
                                    <Trophy size={13} />
                                    <span>Tabla de Posiciones ({eventStandings.length})</span>
                                  </button>
                                </div>

                                {/* Contenido 0: Nómina de Deportistas */}
                                {subTab === 'roster' && (
                                  <div style={{ background: '#111', border: '1px solid #222', borderRadius: '8px', overflowX: 'auto' }}>
                                    {parsedAthletes.length === 0 ? (
                                      <p style={{ fontSize: '0.78rem', color: '#777', fontStyle: 'italic', margin: 0, padding: '1rem', textAlign: 'center' }}>
                                        No hay participantes inscritos aún para este torneo.
                                      </p>
                                    ) : (
                                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.76rem' }}>
                                        <thead>
                                          <tr style={{ background: '#181818', borderBottom: '1px solid #282828', color: '#888', textTransform: 'uppercase', fontSize: '0.66rem' }}>
                                            <th style={{ padding: '0.45rem 0.7rem', width: '32px' }}>#</th>
                                            <th style={{ padding: '0.45rem 0.7rem' }}>Deportista</th>
                                            <th style={{ padding: '0.45rem 0.7rem' }}>Elo / FIDE</th>
                                            <th style={{ padding: '0.45rem 0.7rem' }}>Procedencia</th>
                                            <th style={{ padding: '0.45rem 0.7rem', textAlign: 'right' }}>Estado</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {parsedAthletes.map((ath, idx) => (
                                            <tr
                                              key={ath.id}
                                              style={{
                                                borderBottom: '1px solid #1c1c1c',
                                                background: ath.isMe ? 'rgba(212, 175, 55, 0.08)' : 'transparent',
                                              }}
                                            >
                                              <td style={{ padding: '0.45rem 0.7rem', color: '#777', fontWeight: 700 }}>
                                                {idx + 1}
                                              </td>
                                              <td style={{ padding: '0.45rem 0.7rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                  <span style={{ fontWeight: 600, color: ath.isMe ? 'var(--gold)' : '#fff' }}>
                                                    {ath.name}
                                                  </span>
                                                  {ath.isMe && (
                                                    <span style={{ fontSize: '0.62rem', background: 'var(--gold)', color: '#000', padding: '0.05rem 0.35rem', borderRadius: '3px', fontWeight: 800 }}>
                                                      Tú
                                                    </span>
                                                  )}
                                                </div>
                                                <div style={{ fontSize: '0.66rem', color: '#777' }}>{ath.radicado}</div>
                                              </td>
                                              <td style={{ padding: '0.45rem 0.7rem' }}>
                                                <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{ath.elo > 0 ? ath.elo : 'S/E'}</span>
                                                {ath.fide && <span style={{ color: '#888', marginLeft: '0.25rem' }}>· {ath.fide}</span>}
                                              </td>
                                              <td style={{ padding: '0.45rem 0.7rem', color: '#aaa' }}>
                                                {ath.club}
                                              </td>
                                              <td style={{ padding: '0.45rem 0.7rem', textAlign: 'right' }}>
                                                <span style={{
                                                  padding: '0.1rem 0.4rem',
                                                  borderRadius: '4px',
                                                  fontSize: '0.64rem',
                                                  fontWeight: 700,
                                                  textTransform: 'uppercase',
                                                  background: ath.isConfirmed ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                                                  color: ath.isConfirmed ? '#4ade80' : '#fbbf24',
                                                  border: `1px solid ${ath.isConfirmed ? '#15803d' : '#b45309'}`,
                                                }}>
                                                  {ath.status === 'attended' ? 'En Sala' : ath.status === 'confirmed' ? 'Confirmado' : 'Preinscrito'}
                                                </span>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    )}
                                  </div>
                                )}

                                {/* Contenido 1: Partidas */}
                                {subTab === 'matches' && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {eventMatches.length === 0 ? (
                                      <p style={{ fontSize: '0.78rem', color: '#777', fontStyle: 'italic', margin: 0 }}>
                                        Emparejamientos pendientes de publicación para este torneo.
                                      </p>
                                    ) : (
                                      eventMatches.map((m) => (
                                        <div
                                          key={m.id}
                                          style={{
                                            background: '#111',
                                            border: '1px solid #292929',
                                            borderRadius: '6px',
                                            padding: '0.5rem 0.7rem',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                          }}
                                        >
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', flex: 1 }}>
                                            <div style={{ fontSize: '0.7rem', color: '#888' }}>
                                              Mesa {m.board_number} · Ronda {m.round}
                                            </div>
                                            <div style={{ fontSize: '0.78rem', color: '#eee' }}>
                                              {m.white_player} <span style={{ color: 'var(--gold)', fontWeight: 700 }}>vs</span> {m.black_player}
                                            </div>
                                          </div>

                                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <span style={{ background: '#222', color: 'var(--gold)', fontWeight: 800, fontSize: '0.75rem', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                                              {m.result}
                                            </span>
                                            {m.pgn && (
                                              <button
                                                type="button"
                                                onClick={() => setPgnModalData({
                                                  isOpen: true,
                                                  title: `Partida Mesa ${m.board_number} (Ronda ${m.round})`,
                                                  whitePlayer: m.white_player,
                                                  blackPlayer: m.black_player,
                                                  result: m.result,
                                                  pgn: m.pgn || '',
                                                })}
                                                className="btn btn--sm"
                                                style={{
                                                  background: '#1e1e1e',
                                                  color: 'var(--gold)',
                                                  border: '1px solid var(--gold)',
                                                  padding: '0.15rem 0.4rem',
                                                  fontSize: '0.7rem',
                                                  display: 'inline-flex',
                                                  alignItems: 'center',
                                                  gap: '0.25rem',
                                                }}
                                                title="Ver visor PGN"
                                              >
                                                <Eye size={12} />
                                                <span>PGN</span>
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                )}

                                {/* Contenido 2: Tabla de Posiciones */}
                                {subTab === 'standings' && (
                                  <div>
                                    {eventStandings.length === 0 ? (
                                      <p style={{ fontSize: '0.78rem', color: '#777', fontStyle: 'italic', margin: 0, padding: '0.5rem 0' }}>
                                        Aún no hay partidas computadas para generar la tabla de posiciones de este torneo.
                                      </p>
                                    ) : (
                                      <div>
                                        <div style={{ overflowX: 'auto' }}>
                                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'left' }}>
                                            <thead>
                                              <tr style={{ background: '#161616', color: '#888', borderBottom: '1px solid #2a2a2a', textTransform: 'uppercase' }}>
                                                <th style={{ padding: '0.4rem 0.5rem' }}>#</th>
                                                <th style={{ padding: '0.4rem 0.5rem' }}>Deportista</th>
                                                <th style={{ padding: '0.4rem 0.3rem', textAlign: 'center' }}>PJ</th>
                                                <th style={{ padding: '0.4rem 0.3rem', textAlign: 'center' }}>PG</th>
                                                <th style={{ padding: '0.4rem 0.3rem', textAlign: 'center' }}>PE</th>
                                                <th style={{ padding: '0.4rem 0.3rem', textAlign: 'center' }}>PP</th>
                                                <th style={{ padding: '0.4rem 0.3rem', textAlign: 'center' }}>SB</th>
                                                <th style={{ padding: '0.4rem 0.5rem', textAlign: 'right', color: 'var(--gold)' }}>PTS</th>
                                                <th style={{ padding: '0.4rem 0.5rem', textAlign: 'right' }}>Diploma</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {eventStandings.map((st) => {
                                                const isCurrentAthlete =
                                                  (athleteName && st.name.toLowerCase().includes(athleteName)) ||
                                                  (athleteLastName && athleteLastName.length >= 3 && st.name.toLowerCase().includes(athleteLastName));

                                                return (
                                                  <tr
                                                    key={st.name}
                                                    style={{
                                                      borderBottom: '1px solid #202020',
                                                      background: isCurrentAthlete
                                                        ? 'rgba(212,175,55,0.12)'
                                                        : st.rank === 1
                                                        ? 'rgba(212,175,55,0.05)'
                                                        : 'transparent',
                                                      borderLeft: isCurrentAthlete ? '3px solid var(--gold)' : 'none',
                                                    }}
                                                  >
                                                    <td style={{ padding: '0.4rem 0.5rem', fontWeight: 800 }}>
                                                      <span
                                                        style={{
                                                          display: 'inline-flex',
                                                          alignItems: 'center',
                                                          justifyContent: 'center',
                                                          width: '18px',
                                                          height: '18px',
                                                          borderRadius: '50%',
                                                          fontSize: '0.68rem',
                                                          background: st.rank === 1 ? '#ffd700' : st.rank === 2 ? '#c0c0c0' : st.rank === 3 ? '#cd7f32' : '#222',
                                                          color: st.rank <= 3 ? '#000' : '#888',
                                                        }}
                                                      >
                                                        {st.rank}
                                                      </span>
                                                    </td>
                                                    <td style={{ padding: '0.4rem 0.5rem', fontWeight: isCurrentAthlete ? 700 : 500, color: isCurrentAthlete ? 'var(--gold)' : '#fff' }}>
                                                      <span>{st.name}</span>
                                                      {isCurrentAthlete && (
                                                        <span style={{ marginLeft: '0.4rem', fontSize: '0.65rem', background: 'var(--gold)', color: '#000', padding: '0.05rem 0.35rem', borderRadius: '4px', fontWeight: 800 }}>
                                                          TÚ
                                                        </span>
                                                      )}
                                                    </td>
                                                    <td style={{ padding: '0.4rem 0.3rem', textAlign: 'center', color: '#aaa' }}>{st.played}</td>
                                                    <td style={{ padding: '0.4rem 0.3rem', textAlign: 'center', color: '#4ade80' }}>{st.won}</td>
                                                    <td style={{ padding: '0.4rem 0.3rem', textAlign: 'center', color: '#facc15' }}>{st.drawn}</td>
                                                    <td style={{ padding: '0.4rem 0.3rem', textAlign: 'center', color: '#f87171' }}>{st.lost}</td>
                                                    <td style={{ padding: '0.4rem 0.3rem', textAlign: 'center', color: '#888' }}>{st.sonnebornBerger}</td>
                                                    <td style={{ padding: '0.4rem 0.5rem', textAlign: 'right', fontWeight: 800, color: 'var(--gold)' }}>
                                                      {st.points}
                                                    </td>
                                                    <td style={{ padding: '0.4rem 0.5rem', textAlign: 'right' }}>
                                                      <button
                                                        type="button"
                                                        onClick={() => setTournamentCertModalData({
                                                          athleteName: st.name,
                                                          tournamentTitle: evt.title,
                                                          eventDate: evt.event_date,
                                                          location: evt.location,
                                                          rhythm: evt.rhythm,
                                                          rank: st.rank,
                                                          points: st.points,
                                                          sonnebornBerger: st.sonnebornBerger,
                                                          played: st.played,
                                                          won: st.won,
                                                          isChampion: st.rank === 1,
                                                        })}
                                                        style={{
                                                          background: isCurrentAthlete ? 'var(--gold)' : '#222',
                                                          color: isCurrentAthlete ? '#000' : 'var(--gold)',
                                                          border: isCurrentAthlete ? 'none' : '1px solid #444',
                                                          borderRadius: '4px',
                                                          padding: '0.15rem 0.4rem',
                                                          fontSize: '0.68rem',
                                                          fontWeight: 700,
                                                          cursor: 'pointer',
                                                          display: 'inline-flex',
                                                          alignItems: 'center',
                                                          gap: '0.2rem',
                                                        }}
                                                        title="Ver e Imprimir Diploma Oficial"
                                                      >
                                                        <Award size={11} />
                                                        <span>{isCurrentAthlete ? 'Mi Diploma' : 'Diploma'}</span>
                                                      </button>
                                                    </td>
                                                  </tr>
                                                );
                                              })}
                                            </tbody>
                                          </table>
                                        </div>

                                        <div style={{ marginTop: '0.6rem', textAlign: 'right' }}>
                                          <button
                                            type="button"
                                            onClick={() => exportStandingsToCsv(evt.title, eventStandings)}
                                            className="btn btn--ghost btn--sm"
                                            style={{ fontSize: '0.7rem', padding: '0.2rem 0.45rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--gold)', borderColor: 'var(--gold)' }}
                                          >
                                            <Download size={11} />
                                            <span>Descargar Tabla Oficial (CSV)</span>
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    <div style={{ borderTop: '1px solid #252525', paddingTop: '1.2rem', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--gold)' }}>{evt.entry_fee}</span>
                      <button
                        onClick={() => handleRegisterTournament(evt)}
                        disabled={isInscribed}
                        className={`btn btn--sm ${isInscribed ? 'btn--ghost' : 'btn--primary'}`}
                      >
                        {isInscribed ? 'Inscrito ✓' : 'Confirmar Preinscripción'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PESTAÑA 3: MIS CUOTAS & PAGOS */}
        {activeTab === 'pagos' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--gold)', margin: 0 }}>
                  Estado de Afiliación & Mensualidades
                </h2>
                <p style={{ color: '#888', fontSize: '0.9rem', margin: 0 }}>
                  Consulta tu estado de pago y reporta transferencias de mensualidad
                </p>
              </div>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="btn btn--primary btn--sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Plus size={16} /> Reportar Pago
              </button>
            </div>

            {/* Modal de reporte de pago */}
            {showPaymentModal && (
              <div style={{ background: '#141414', border: '1px solid #333', borderRadius: '12px', padding: '2rem', marginBottom: '2rem', maxWidth: '600px' }}>
                <h3 style={{ color: 'var(--gold)', marginBottom: '1.2rem' }}>Reportar Comprobante de Pago</h3>
                <form onSubmit={handleReportPayment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#aaa', marginBottom: '0.3rem' }}>
                      Foto o PDF del comprobante (Nequi, Daviplata, Bancolombia...)
                    </label>
                    <FileUploadField
                      bucket="payment-receipts"
                      mode="private"
                      ownerId={user?.id || 'anon'}
                      accept="image/*,.pdf"
                      label="Adjuntar comprobante"
                      onUploaded={(path) => setPaymentForm({ ...paymentForm, receipt_url: path })}
                    />
                    {paymentForm.receipt_url && (
                      <span style={{ display: 'block', marginTop: '0.4rem', fontSize: '0.8rem', color: '#81c784' }}>
                        ✓ Comprobante adjuntado, se enviará junto con el reporte
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#aaa', marginBottom: '0.3rem' }}>Periodo (Mes/Año)</label>
                      <input
                        type="text"
                        required
                        value={paymentForm.period}
                        onChange={(e) => setPaymentForm({ ...paymentForm, period: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#1c1c1c', border: '1px solid #333', color: '#fff' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#aaa', marginBottom: '0.3rem' }}>Valor Pagado ($ COP)</label>
                      <input
                        type="number"
                        required
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#1c1c1c', border: '1px solid #333', color: '#fff' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#aaa', marginBottom: '0.3rem' }}>Método de Pago</label>
                      <select
                        value={paymentForm.payment_method}
                        onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value as any })}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#1c1c1c', border: '1px solid #333', color: '#fff' }}
                      >
                        <option value="Bancolombia">Bancolombia</option>
                        <option value="Nequi">Nequi</option>
                        <option value="Daviplata">Daviplata</option>
                        <option value="Efectivo">Efectivo en Sede</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#aaa', marginBottom: '0.3rem' }}>Nro. Comprobante / Referencia</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. BC-881923"
                        value={paymentForm.reference_number}
                        onChange={(e) => setPaymentForm({ ...paymentForm, reference_number: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#1c1c1c', border: '1px solid #333', color: '#fff' }}
                      />
                    </div>
                  </div>

                  <textarea
                    placeholder="Notas adicionales (ej. Pago dos meses adelantados, clase particular...)"
                    rows={2}
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#1c1c1c', border: '1px solid #333', color: '#fff' }}
                  />

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button type="submit" className="btn btn--primary btn--sm">Enviar Reporte</button>
                    <button type="button" onClick={() => setShowPaymentModal(false)} className="btn btn--ghost btn--sm">Cancelar</button>
                  </div>
                </form>
              </div>
            )}

            <div style={{ background: '#141414', border: '1px solid #222', borderRadius: '12px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#1e1e1e', borderBottom: '1px solid #333', color: '#aaa', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                    <th style={{ padding: '1rem' }}>Periodo</th>
                    <th style={{ padding: '1rem' }}>Valor</th>
                    <th style={{ padding: '1rem' }}>Método</th>
                    <th style={{ padding: '1rem' }}>Referencia</th>
                    <th style={{ padding: '1rem' }}>Fecha</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #222' }}>
                      <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--gold)' }}>{p.period}</td>
                      <td style={{ padding: '1rem', fontWeight: 700 }}>${p.amount.toLocaleString('es-CO')}</td>
                      <td style={{ padding: '1rem' }}>{p.payment_method}</td>
                      <td style={{ padding: '1rem', color: '#bbb' }}>{p.reference_number}</td>
                      <td style={{ padding: '1rem', color: '#888' }}>{p.payment_date}</td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <span style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: p.status === 'approved' ? '#1b5e20' : p.status === 'rejected' ? '#b71c1c' : '#f57f17',
                          color: '#fff',
                        }}>
                          {p.status === 'approved' ? 'Al Día ✓' : p.status === 'rejected' ? 'Rechazado' : 'En Verificación'}
                        </span>
                        {p.status === 'approved' && p.reviewed_at && (
                          <div style={{ fontSize: '0.68rem', color: '#81c784', marginTop: '0.25rem' }}>
                            Validado: {new Date(p.reviewed_at).toLocaleDateString('es-CO')}
                          </div>
                        )}
                        {p.status === 'rejected' && p.rejection_reason && (
                          <div style={{ fontSize: '0.72rem', color: '#fca5a5', marginTop: '0.35rem', maxWidth: '220px', marginLeft: 'auto', lineHeight: 1.3, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', padding: '0.3rem 0.5rem', borderRadius: '4px', textAlign: 'left' }}>
                            <strong>Motivo:</strong> {p.rejection_reason}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PESTAÑA 4: HORARIOS DE CLASE & ASISTENCIAS */}
        {activeTab === 'horarios' && (
          <div>
            {/* Widget Personal de Asistencia del Afiliado */}
            {(() => {
              const myAttendance = attendance.filter(
                (a) =>
                  (user?.id && a.user_id === user.id) ||
                  (user?.nombre && a.student_name.toLowerCase().includes(user.nombre.toLowerCase()))
              );
              const presCount = myAttendance.filter((a) => a.status === 'present').length;
              const excCount = myAttendance.filter((a) => a.status === 'excused').length;
              const absCount = myAttendance.filter((a) => a.status === 'absent').length;
              const myRate = myAttendance.length > 0 ? Math.round((presCount / myAttendance.length) * 100) : 100;

              return (
                <div style={{ background: '#161616', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '1.8rem', marginBottom: '2.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.2rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <ClipboardCheck size={20} style={{ color: 'var(--gold)' }} />
                        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                          Mi Registro de Asistencia a Entrenamientos
                        </h2>
                      </div>
                      <p style={{ color: '#888', fontSize: '0.85rem', margin: '0.3rem 0 0 0' }}>
                        Control oficial validado por la comisión técnica del Club y reportado a Inder Sabaneta
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                      <span style={{ background: '#1c281e', border: '1px solid #2e7d32', color: '#81c784', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700 }}>
                        {presCount} Asistencias
                      </span>
                      {excCount > 0 && (
                        <span style={{ background: '#12263a', border: '1px solid #1976d2', color: '#90caf9', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.82rem' }}>
                          {excCount} Excusas
                        </span>
                      )}
                      {absCount > 0 && (
                        <span style={{ background: '#2d1515', border: '1px solid #c62828', color: '#ef9a9a', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.82rem' }}>
                          {absCount} Inasistencias
                        </span>
                      )}
                      <span style={{ background: 'linear-gradient(135deg, var(--gold), #e0a820)', color: '#000', padding: '0.4rem 0.9rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 800 }}>
                        {myRate}% Cumplimiento
                      </span>
                    </div>
                  </div>

                  {myAttendance.length > 0 ? (
                    <div style={{ background: '#101010', borderRadius: '10px', border: '1px solid #222', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ background: '#181818', color: '#888', borderBottom: '1px solid #2a2a2a' }}>
                            <th style={{ padding: '0.7rem 1rem' }}>Fecha</th>
                            <th style={{ padding: '0.7rem 1rem' }}>Estado</th>
                            <th style={{ padding: '0.7rem 1rem' }}>Observación del Entrenador</th>
                          </tr>
                        </thead>
                        <tbody>
                          {myAttendance.slice(0, 5).map((att) => (
                            <tr key={att.id} style={{ borderBottom: '1px solid #1c1c1c' }}>
                              <td style={{ padding: '0.7rem 1rem', color: '#ccc' }}>{att.session_date}</td>
                              <td style={{ padding: '0.7rem 1rem' }}>
                                <span
                                  style={{
                                    display: 'inline-block',
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    background:
                                      att.status === 'present'
                                        ? '#1b3b22'
                                        : att.status === 'excused'
                                        ? '#12263a'
                                        : '#381313',
                                    color:
                                      att.status === 'present'
                                        ? '#81c784'
                                        : att.status === 'excused'
                                        ? '#90caf9'
                                        : '#ef9a9a',
                                  }}
                                >
                                  {att.status === 'present' ? 'Presente' : att.status === 'excused' ? 'Excusa Aprobada' : 'Inasistencia'}
                                </span>
                              </td>
                              <td style={{ padding: '0.7rem 1rem', color: '#aaa', fontStyle: att.notes ? 'normal' : 'italic' }}>
                                {att.notes || 'Sin observaciones particulares'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ padding: '1rem', background: '#101010', borderRadius: '8px', color: '#888', fontSize: '0.85rem', textAlign: 'center' }}>
                      Aún no tienes asistencias registradas en la plataforma este ciclo.
                    </div>
                  )}
                </div>
              );
            })()}

            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--gold)' }}>
                Cronograma Semanal de Entrenamientos
              </h2>
              <p style={{ color: '#888', fontSize: '0.9rem' }}>
                Consulta los días y horas de las clases según tu categoría asignada
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {schedules.map((sch) => (
                <div key={sch.id} style={{ background: '#141414', border: '1px solid #282828', borderRadius: '14px', padding: '1.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                    <span style={{ fontSize: '0.75rem', background: 'var(--gold)', color: '#000', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 800 }}>
                      {sch.modality}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#aaa' }}>{sch.trainer}</span>
                  </div>
                  <h3 style={{ fontSize: '1.2rem', color: '#fff', margin: '0.4rem 0' }}>{sch.category}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--gold)', fontWeight: 600, fontSize: '0.95rem', margin: '0.4rem 0' }}>
                    <Clock size={16} />
                    <span>{sch.day_of_week} · {sch.time_range}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#777', fontSize: '0.85rem', marginTop: '0.6rem' }}>
                    <MapPin size={14} />
                    <span>{sch.location}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PESTAÑA: TABLERO LICHESS & ESTUDIO */}
        {activeTab === 'lichess' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.8rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Swords size={22} color="var(--gold)" />
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: 'var(--gold)' }}>
                    Tablero de Ajedrez & Estudio Lichess.org
                  </h2>
                </div>
                <p style={{ color: '#888', fontSize: '0.9rem', marginTop: '0.3rem' }}>
                  Entrena táctica diaria, analiza variantes de tus partidas y conéctate a la comunidad oficial de Lichess
                </p>
              </div>

              {user?.lichess_username && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <a
                    href={`https://lichess.org/@/${encodeURIComponent(user.lichess_username)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn--ghost btn--sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--gold)', borderColor: 'var(--gold)' }}
                  >
                    <span>Lichess: @{user.lichess_username}</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              )}
            </div>

            {/* Aviso para vincular usuario de Lichess si aún no lo tiene */}
            {!user?.lichess_username && (
              <div
                style={{
                  background: 'linear-gradient(135deg, #1b160c 0%, #121212 100%)',
                  border: '1px solid #785215',
                  borderRadius: '12px',
                  padding: '1.25rem 1.6rem',
                  marginBottom: '1.8rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div>
                  <h4 style={{ margin: '0 0 0.3rem 0', color: 'var(--gold)', fontSize: '1rem' }}>
                    Vincula tu usuario de Lichess.org
                  </h4>
                  <p style={{ margin: 0, color: '#aaa', fontSize: '0.86rem' }}>
                    Al asociar tu usuario podrás ver tu partida en directo (Lichess TV) y tus partidas recientes aquí mismo.
                  </p>
                </div>

                <form onSubmit={handleQuickLinkLichess} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    required
                    placeholder="Usuario en Lichess..."
                    value={quickLichessInput}
                    onChange={(e) => setQuickLichessInput(e.target.value)}
                    style={{
                      padding: '0.5rem 0.8rem',
                      borderRadius: '6px',
                      background: '#1c1c1c',
                      border: '1px solid #444',
                      color: '#fff',
                      fontSize: '0.85rem',
                      minWidth: '180px',
                    }}
                  />
                  <button type="submit" className="btn btn--primary btn--sm" style={{ whiteSpace: 'nowrap' }}>
                    Vincular Cuenta
                  </button>
                </form>
              </div>
            )}

            {/* Selector de Modos Lichess */}
            <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setLichessViewMode('tv')}
                className={`btn btn--sm ${lichessViewMode === 'tv' ? 'btn--primary' : 'btn--ghost'}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Eye size={15} />
                <span>{user?.lichess_username ? `Mi Partida / TV (${user.lichess_username})` : 'Lichess TV Oficial'}</span>
              </button>

              <button
                type="button"
                onClick={() => setLichessViewMode('analysis')}
                className={`btn btn--sm ${lichessViewMode === 'analysis' ? 'btn--primary' : 'btn--ghost'}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Swords size={15} />
                <span>Tablero de Análisis Libre</span>
              </button>

              <button
                type="button"
                onClick={() => setLichessViewMode('puzzles')}
                className={`btn btn--sm ${lichessViewMode === 'puzzles' ? 'btn--primary' : 'btn--ghost'}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Award size={15} />
                <span>Entrenamiento Táctico del Día</span>
              </button>
            </div>

            {/* Contenedor Iframe Responsivo */}
            <div
              style={{
                width: '100%',
                maxWidth: '920px',
                background: '#121212',
                border: '1px solid #2e2e2e',
                borderRadius: '14px',
                overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              }}
            >
              <div
                style={{
                  background: '#1a1a1a',
                  borderBottom: '1px solid #2a2a2a',
                  padding: '0.75rem 1.2rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.82rem',
                  color: '#aaa',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
                  <span>
                    {lichessViewMode === 'tv'
                      ? (user?.lichess_username ? `Lichess TV: Partida de @${user.lichess_username}` : 'Lichess TV: Partida Magistral en Vivo')
                      : lichessViewMode === 'analysis'
                      ? 'Lichess Embed: Análisis Libre de Posición & Motor Stockfish'
                      : 'Lichess Embed: Problema de Táctica'}
                  </span>
                </div>
                <a
                  href="https://lichess.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--gold)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <span>lichess.org</span>
                  <ExternalLink size={12} />
                </a>
              </div>

              <div style={{ position: 'relative', width: '100%', height: '560px' }}>
                <iframe
                  src={
                    lichessViewMode === 'tv'
                      ? user?.lichess_username
                        ? `https://lichess.org/tv/frame?username=${encodeURIComponent(user.lichess_username)}&theme=brown&bg=dark`
                        : `https://lichess.org/tv/frame?theme=brown&bg=dark`
                      : lichessViewMode === 'analysis'
                      ? `https://lichess.org/analysis/embed?theme=brown&bg=dark`
                      : `https://lichess.org/training/frame?theme=brown&bg=dark`
                  }
                  title="Tablero Lichess Capablanca"
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  sandbox="allow-scripts allow-same-origin allow-popups"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
            </div>

            {/* Pauta Pedagógica Capablanca */}
            <div style={{ marginTop: '1.5rem', padding: '1rem 1.4rem', background: '#141414', border: '1px solid #262626', borderRadius: '10px', maxWidth: '920px' }}>
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#999', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--gold)' }}>Consejo del Club:</strong> Usa el tablero de análisis para reproducir y estudiar tus partidas de torneo antes de tu próxima clase con los profesores del Club en el CC Aves María.
              </p>
            </div>
          </div>
        )}

        {/* PESTAÑA 5: PERFIL Y FICHA */}
        {activeTab === 'perfil' && (
          <div style={{ maxWidth: '700px' }}>
            <div style={{ background: '#151515', border: '1px solid #282828', borderRadius: '16px', padding: '2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '0.8rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--gold)', margin: 0 }}>
                  Ficha Deportiva del Afiliado
                </h2>
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setShowCertificateModal(true)}
                    className="btn btn--primary btn--sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
                  >
                    <Award size={15} />
                    <span>Certificado</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCardModal(true)}
                    className="btn btn--ghost btn--sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, color: 'var(--gold)', borderColor: 'var(--gold)' }}
                  >
                    <CreditCard size={15} />
                    <span>Carnet Digital</span>
                  </button>
                  {!editingProfile && (
                    <button
                      onClick={() => setEditingProfile(true)}
                      className="btn btn--ghost btn--sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <Edit2 size={14} />
                      <span>Editar mis datos</span>
                    </button>
                  )}
                </div>
              </div>

              {editingProfile ? (
                <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#bbb', marginBottom: '0.4rem' }}>Nombre</label>
                      <input
                        type="text"
                        value={profileForm.nombre}
                        onChange={(e) => setProfileForm({ ...profileForm, nombre: e.target.value })}
                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: '#1c1c1c', border: '1px solid #333', color: '#fff' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#bbb', marginBottom: '0.4rem' }}>Apellido</label>
                      <input
                        type="text"
                        value={profileForm.apellido}
                        onChange={(e) => setProfileForm({ ...profileForm, apellido: e.target.value })}
                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: '#1c1c1c', border: '1px solid #333', color: '#fff' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#bbb', marginBottom: '0.4rem' }}>Teléfono / WhatsApp</label>
                      <input
                        type="tel"
                        value={profileForm.telefono}
                        onChange={(e) => setProfileForm({ ...profileForm, telefono: e.target.value })}
                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: '#1c1c1c', border: '1px solid #333', color: '#fff' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#bbb', marginBottom: '0.4rem' }}>Ciudad</label>
                      <input
                        type="text"
                        value={profileForm.ciudad}
                        onChange={(e) => setProfileForm({ ...profileForm, ciudad: e.target.value })}
                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: '#1c1c1c', border: '1px solid #333', color: '#fff' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#bbb', marginBottom: '0.4rem' }}>Categoría Ajedrez</label>
                      <input
                        type="text"
                        value={profileForm.categoria_ajedrez}
                        onChange={(e) => setProfileForm({ ...profileForm, categoria_ajedrez: e.target.value })}
                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: '#1c1c1c', border: '1px solid #333', color: '#fff' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#bbb', marginBottom: '0.4rem' }}>Elo Rating (Estimado / FIDE)</label>
                      <input
                        type="number"
                        value={profileForm.elo_rating}
                        onChange={(e) => setProfileForm({ ...profileForm, elo_rating: Number(e.target.value) })}
                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: '#1c1c1c', border: '1px solid #333', color: '#fff' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#bbb', marginBottom: '0.4rem' }}>FIDE ID (Opcional)</label>
                      <input
                        type="text"
                        placeholder="ej. 392014"
                        value={profileForm.fide_id}
                        onChange={(e) => setProfileForm({ ...profileForm, fide_id: e.target.value })}
                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: '#1c1c1c', border: '1px solid #333', color: '#fff' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#bbb', marginBottom: '0.4rem' }}>
                        Usuario Lichess.org (Opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="ej. capablanca_sabaneta"
                        value={profileForm.lichess_username}
                        onChange={(e) => setProfileForm({ ...profileForm, lichess_username: e.target.value })}
                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: '#1c1c1c', border: '1px solid #333', color: '#fff' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button type="submit" className="btn btn--primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Save size={16} />
                      <span>Guardar Cambios</span>
                    </button>
                    <button type="button" onClick={() => setEditingProfile(false)} className="btn btn--ghost">
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase' }}>Nombre Completo</span>
                    <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', margin: '0.2rem 0 1rem' }}>
                      {user.nombre} {user.apellido}
                    </p>

                    <span style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase' }}>Correo Electrónico</span>
                    <p style={{ fontSize: '1rem', color: '#ccc', margin: '0.2rem 0 1rem' }}>
                      {user.correo}
                    </p>

                    <span style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase' }}>Teléfono</span>
                    <p style={{ fontSize: '1rem', color: '#ccc', margin: '0.2rem 0 1rem' }}>
                      {user.telefono || 'Sin registrar'}
                    </p>

                    <span style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase' }}>Perfil Lichess.org</span>
                    {user.lichess_username ? (
                      <p style={{ margin: '0.2rem 0 1rem' }}>
                        <a
                          href={`https://lichess.org/@/${encodeURIComponent(user.lichess_username)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--gold)', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '1rem', fontWeight: 600 }}
                        >
                          <span>@{user.lichess_username}</span>
                          <ExternalLink size={13} />
                        </a>
                      </p>
                    ) : (
                      <p style={{ fontSize: '0.9rem', color: '#777', margin: '0.2rem 0 1rem', fontStyle: 'italic' }}>
                        Sin vincular
                      </p>
                    )}
                  </div>

                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase' }}>Categoría en el Club</span>
                    <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--gold)', margin: '0.2rem 0 1rem' }}>
                      {user.categoria_ajedrez || 'Iniciación'}
                    </p>

                    <span style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase' }}>Elo Rating</span>
                    <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: '0.2rem 0 1rem' }}>
                      {user.elo_rating || 'En proceso de evaluación'}
                    </p>

                    <span style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase' }}>Ciudad de Residencia</span>
                    <p style={{ fontSize: '1rem', color: '#ccc', margin: '0.2rem 0' }}>
                      {user.ciudad || 'Sabaneta'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Modal Visor de Partidas PGN */}
      {pgnModalData && (
        <PgnViewerModal
          isOpen={pgnModalData.isOpen}
          onClose={() => setPgnModalData(null)}
          title={pgnModalData.title}
          whitePlayer={pgnModalData.whitePlayer}
          blackPlayer={pgnModalData.blackPlayer}
          result={pgnModalData.result}
          pgn={pgnModalData.pgn}
        />
      )}

      {/* Modal Certificado Oficial de Afiliación */}
      {showCertificateModal && user && (
        <AffiliationCertificateModal
          isOpen={showCertificateModal}
          onClose={() => setShowCertificateModal(false)}
          member={user}
        />
      )}

      {/* Modal Carnet Digital de Afiliado */}
      {showCardModal && user && (
        <DigitalAthleteIdCardModal
          isOpen={showCardModal}
          onClose={() => setShowCardModal(false)}
          member={user}
        />
      )}

      {/* Modal Diploma Oficial de Torneo */}
      {tournamentCertModalData && (
        <TournamentCertificateModal
          isOpen={true}
          onClose={() => setTournamentCertModalData(null)}
          data={tournamentCertModalData}
        />
      )}
    </div>
  );
};
