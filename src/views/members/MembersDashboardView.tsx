import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { INITIAL_DOCUMENTS, INITIAL_EVENTS, INITIAL_PAYMENTS, INITIAL_SCHEDULES, INITIAL_MATCHES, INITIAL_ATTENDANCE } from '../../lib/initialData';
import { ClubDocument, ClubEvent, MembershipPayment, ClassSchedule, TournamentMatch, ClassAttendance } from '../../types/database';
import { resendService } from '../../services/resendService';
import {
  User, FileText, Trophy, Download, LogOut, CheckCircle2,
  Calendar, MapPin, Edit2, Save, CreditCard, Clock, Search, Plus,
  Swords, Eye, ChevronDown, ChevronUp, Award, ClipboardCheck
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

  const [activeTab, setActiveTab] = useState<'documentos' | 'torneos' | 'pagos' | 'horarios' | 'perfil'>('documentos');
  const [documents, setDocuments] = useState<ClubDocument[]>(INITIAL_DOCUMENTS);
  const [events, setEvents] = useState<ClubEvent[]>(INITIAL_EVENTS);
  const [matches, setMatches] = useState<TournamentMatch[]>(INITIAL_MATCHES);
  const [payments, setPayments] = useState<MembershipPayment[]>(INITIAL_PAYMENTS);
  const [schedules, setSchedules] = useState<ClassSchedule[]>(INITIAL_SCHEDULES);
  const [attendance, setAttendance] = useState<ClassAttendance[]>(INITIAL_ATTENDANCE);
  const [myRegistrations, setMyRegistrations] = useState<string[]>([]);
  const [selectedDocCategory, setSelectedDocCategory] = useState<string>('all');
  const [docSearch, setDocSearch] = useState<string>('');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [tournamentSubTabs, setTournamentSubTabs] = useState<Record<string, 'matches' | 'standings'>>({});
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
  });

  // Reportar pago
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: 120000,
    payment_method: 'Bancolombia' as const,
    reference_number: '',
    period: 'Octubre 2026',
    notes: '',
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
      });
    }
  }, [user, navigate]);

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
        const { data: docData } = await supabase.from('documents').select('*');
        if (docData && docData.length > 0) setDocuments(docData as ClubDocument[]);

        const { data: evData } = await supabase.from('events').select('*');
        if (evData && evData.length > 0) setEvents(evData as ClubEvent[]);

        const { data: schData } = await supabase.from('class_schedules').select('*');
        if (schData && schData.length > 0) setSchedules(schData as ClassSchedule[]);

        const { data: attData } = await supabase.from('class_attendance').select('*').order('session_date', { ascending: false });
        if (attData && attData.length > 0) setAttendance(attData as ClassAttendance[]);

        const { data: matchData } = await supabase.from('tournament_matches').select('*').order('board_number', { ascending: true });
        if (matchData && matchData.length > 0) setMatches(matchData as TournamentMatch[]);

        if (user) {
          const { data: payData } = await supabase
            .from('membership_payments')
            .select('*')
            .eq('user_id', user.id);
          if (payData && payData.length > 0) setPayments(payData as MembershipPayment[]);

          const { data: regData } = await supabase
            .from('tournament_registrations')
            .select('event_id')
            .eq('user_id', user.id);
          if (regData) {
            setMyRegistrations(regData.map((r) => r.event_id));
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

    setMyRegistrations((prev) => [...prev, event.id]);

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
      id: 'pay-' + Date.now(),
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
    setPaymentForm({ amount: 120000, payment_method: 'Bancolombia', reference_number: '', period: 'Octubre 2026', notes: '' });
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

  const filteredDocs = documents.filter((doc) => {
    const matchesCategory = selectedDocCategory === 'all' || doc.category === selectedDocCategory;
    const matchesSearch = doc.title.toLowerCase().includes(docSearch.toLowerCase()) ||
                          doc.description.toLowerCase().includes(docSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ paddingTop: 'calc(var(--header-h) + 1.5rem)', background: '#0a0a0a', color: '#fff', minHeight: '100vh' }}>
      
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <Link to="/" className="btn btn--ghost btn--sm">
              Ver Web Principal
            </Link>
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
            <span>Inscripción a Torneos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pagos')}
            className={`btn btn--sm ${activeTab === 'pagos' ? 'btn--primary' : 'btn--ghost'}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <CreditCard size={16} />
            <span>Mis Cuotas & Pagos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('horarios')}
            className={`btn btn--sm ${activeTab === 'horarios' ? 'btn--primary' : 'btn--ghost'}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Clock size={16} />
            <span>Horarios de Clase</span>
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
                {['all', 'Reglamento', 'Material de Estudio', 'Partidas PGN', 'Circulares'].map((cat) => (
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
                      <span style={{ fontSize: '0.75rem', background: '#222', padding: '0.2rem 0.5rem', borderRadius: '4px', color: '#aaa', textTransform: 'uppercase' }}>
                        {doc.file_type} · {doc.file_size}
                      </span>
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
                      <button
                        onClick={() => alert(`Iniciando descarga: ${doc.title} (${doc.file_type.toUpperCase()})`)}
                        className="btn btn--primary btn--sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        <Download size={14} />
                        <span>Descargar</span>
                      </button>
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
                        const eventMatches = matches.filter((m) => m.event_id === evt.id);
                        const isExpanded = expandedEventId === evt.id;
                        const subTab = tournamentSubTabs[evt.id] || 'matches';
                        const eventStandings = calculateTournamentStandings(eventMatches);
                        const athleteName = `${user?.nombre || ''} ${user?.apellido || ''}`.trim().toLowerCase();
                        const athleteLastName = (user?.apellido || '').trim().toLowerCase();

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
                                Partidas ({eventMatches.length}) & Clasificación
                              </span>
                              {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                            </button>

                            {isExpanded && (
                              <div style={{ marginTop: '0.8rem' }}>
                                {/* Pestañas internas: Partidas vs Tabla de Posiciones */}
                                <div style={{ display: 'flex', gap: '0.4rem', borderBottom: '1px solid #252525', marginBottom: '0.8rem' }}>
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
                    <p style={{ fontSize: '1rem', color: '#ccc', margin: '0.2rem 0' }}>
                      {user.telefono || 'Sin registrar'}
                    </p>
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
