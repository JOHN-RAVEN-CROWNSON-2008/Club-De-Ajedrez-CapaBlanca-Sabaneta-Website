import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { INITIAL_EVENTS, INITIAL_MATCHES, INITIAL_REGISTRATIONS } from '../../lib/initialData';
import { ClubEvent, TournamentMatch, TournamentRegistration } from '../../types/database';
import {
  Calendar, Clock, MapPin, Trophy, ArrowRight, ShieldCheck,
  Swords, Eye, ChevronDown, ChevronUp, Download, Award, Medal,
  UserCheck, Users, Search, X
} from 'lucide-react';
import { PgnViewerModal } from '../../components/common/PgnViewerModal';
import { TournamentCertificateModal, TournamentCertificateData } from '../../components/common/TournamentCertificateModal';
import { TournamentRegistrationModal } from '../../components/common/TournamentRegistrationModal';
import { calculateTournamentStandings, exportStandingsToCsv } from '../../lib/tournamentStandings';

export const TournamentsView: React.FC = () => {
  const [events, setEvents] = useState<ClubEvent[]>(INITIAL_EVENTS);
  const [matches, setMatches] = useState<TournamentMatch[]>(INITIAL_MATCHES);
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>(INITIAL_REGISTRATIONS);
  const [filter, setFilter] = useState<string>('all');
  const [rhythmFilter, setRhythmFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [tournamentTab, setTournamentTab] = useState<Record<string, 'matches' | 'standings' | 'roster'>>({});
  const [activePgnMatch, setActivePgnMatch] = useState<TournamentMatch | null>(null);
  const [tournamentCertModalData, setTournamentCertModalData] = useState<TournamentCertificateData | null>(null);
  const [registeringEvent, setRegisteringEvent] = useState<ClubEvent | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!isSupabaseConfigured()) {
        setEvents(INITIAL_EVENTS);
        setMatches(INITIAL_MATCHES);
        setLoading(false);
        return;
      }

      try {
        const { data: evts } = await supabase
          .from('events')
          .select('*')
          .order('event_date', { ascending: true });

        if (evts && evts.length > 0) {
          setEvents(evts as ClubEvent[]);
        } else {
          setEvents(INITIAL_EVENTS);
        }

        const { data: mtchs } = await supabase
          .from('tournament_matches')
          .select('*')
          .order('round', { ascending: true })
          .order('board_number', { ascending: true });

        if (mtchs && mtchs.length > 0) {
          setMatches(mtchs as TournamentMatch[]);
        } else {
          setMatches(INITIAL_MATCHES);
        }

        const { data: regs } = await supabase
          .from('tournament_registrations')
          .select('*')
          .order('created_at', { ascending: false });

        if (regs && regs.length > 0) {
          setRegistrations(regs as TournamentRegistration[]);
        } else {
          setRegistrations(INITIAL_REGISTRATIONS);
        }
      } catch (err) {
        console.error('Error al cargar datos de torneos de Supabase:', err);
        setEvents(INITIAL_EVENTS);
        setMatches(INITIAL_MATCHES);
        setRegistrations(INITIAL_REGISTRATIONS);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const abiertoCount = useMemo(() => events.filter((e) => e.category?.toLowerCase().includes('abierto')).length, [events]);
  const infantilCount = useMemo(() => events.filter((e) => e.category?.toLowerCase().includes('infantil')).length, [events]);

  const uniqueRhythms = useMemo(() => {
    const list: string[] = [];
    events.forEach((e) => {
      const r = (e.rhythm || '').trim();
      if (r && !list.includes(r)) list.push(r);
    });
    return list;
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (filter === 'infantil' && !ev.category?.toLowerCase().includes('infantil')) return false;
      if (filter === 'abierto' && !ev.category?.toLowerCase().includes('abierto')) return false;
      if (rhythmFilter !== 'all' && ev.rhythm !== rhythmFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = (ev.title || '').toLowerCase().includes(q);
        const matchDesc = (ev.description || '').toLowerCase().includes(q);
        const matchLoc = (ev.location || '').toLowerCase().includes(q);
        const matchRhythm = (ev.rhythm || '').toLowerCase().includes(q);
        const matchCat = (ev.category || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchLoc && !matchRhythm && !matchCat) return false;
      }
      return true;
    });
  }, [events, filter, rhythmFilter, searchQuery]);

  const handleResetFilters = () => {
    setFilter('all');
    setRhythmFilter('all');
    setSearchQuery('');
  };

  return (
    <div style={{ paddingTop: 'calc(var(--header-h) + 2rem)' }}>
      {/* Cabecera */}
      <section className="section section--dark" style={{ textAlign: 'center', paddingBlock: '3rem' }}>
        <div className="wrap-narrow">
          <span className="pill pill--gold">Calendario Competitivo</span>
          <h1 className="display display--gold" style={{ fontSize: 'var(--step-4)', marginTop: '1rem' }}>
            Torneos y Competiciones Oficiales
          </h1>
          <p style={{ color: '#ccc', fontSize: '1.2rem', marginTop: '1rem', lineHeight: 1.6 }}>
            Vive la emoción de competir con reloj, árbitros federados y el respaldo del Club Capablanca Sabaneta.
          </p>
        </div>
      </section>

      {/* Contenido y Filtros */}
      <section className="section" style={{ background: '#0e0e0e', color: '#fff', minHeight: '60vh' }}>
        <div className="wrap">
          
          {/* Barra de Búsqueda y Enlace a Reloj Oficial */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div style={{ position: 'relative', flex: '1 1 320px', maxWidth: '500px' }}>
              <Search size={17} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gold)', pointerEvents: 'none' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar torneo por nombre, ritmo, sede o categoría..."
                style={{
                  width: '100%',
                  padding: '0.65rem 2.4rem 0.65rem 2.75rem',
                  background: '#161616',
                  border: '1px solid #333',
                  borderRadius: '50px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#888',
                    cursor: 'pointer',
                    padding: '0.2rem',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="Limpiar búsqueda"
                  aria-label="Limpiar búsqueda"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <Link
              to="/reloj"
              className="btn btn--sm"
              style={{
                background: 'linear-gradient(135deg, var(--gold), #e0a820)',
                color: '#0a0a0a',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                textDecoration: 'none',
                borderRadius: '8px',
                padding: '0.55rem 1.1rem',
                boxShadow: '0 4px 12px rgba(212,175,55,0.25)',
              }}
            >
              <Clock size={16} />
              <span>Abrir Reloj Oficial</span>
            </Link>
          </div>

          {/* Botones de filtro de Categoría y Ritmo */}
          <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginBottom: '2.5rem', alignItems: 'center' }}>
            <button
              type="button"
              className={`btn btn--sm ${filter === 'all' ? 'btn--primary' : 'btn--ghost'}`}
              onClick={() => setFilter('all')}
            >
              Todos los torneos ({events.length})
            </button>
            <button
              type="button"
              className={`btn btn--sm ${filter === 'abierto' ? 'btn--primary' : 'btn--ghost'}`}
              onClick={() => setFilter('abierto')}
            >
              Categoría Abierta ({abiertoCount})
            </button>
            <button
              type="button"
              className={`btn btn--sm ${filter === 'infantil' ? 'btn--primary' : 'btn--ghost'}`}
              onClick={() => setFilter('infantil')}
            >
              Semilleros Infantiles ({infantilCount})
            </button>

            {uniqueRhythms.length > 1 && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginLeft: 'auto' }}>
                <span style={{ fontSize: '0.8rem', color: '#888' }}>Ritmo:</span>
                <select
                  value={rhythmFilter}
                  onChange={(e) => setRhythmFilter(e.target.value)}
                  style={{
                    background: '#161616',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: 'var(--gold)',
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  <option value="all">Todos los ritmos</option>
                  {uniqueRhythms.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: '#888' }}>
              Cargando calendario oficial...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#161616', borderRadius: '16px', border: '1px solid #222' }}>
              <Trophy size={40} color="var(--gold)" style={{ margin: '0 auto 1rem', opacity: 0.7 }} />
              <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '0.5rem' }}>No se encontraron torneos</h3>
              <p style={{ color: '#aaa', fontSize: '0.95rem', marginBottom: '1.5rem', maxWidth: '420px', marginInline: 'auto' }}>
                No hay torneos programados que coincidan con los filtros de búsqueda o categoría seleccionados.
              </p>
              {(searchQuery || filter !== 'all' || rhythmFilter !== 'all') && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="btn btn--primary btn--sm"
                >
                  Restablecer todos los filtros
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem' }}>
              {filteredEvents.map((evt) => (
                <div
                  key={evt.id}
                  style={{
                    background: '#181818',
                    border: '1px solid #282828',
                    borderRadius: '16px',
                    padding: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                      <span style={{ background: 'var(--gold)', color: '#000', padding: '0.3rem 0.8rem', borderRadius: '6px', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase' }}>
                        {evt.rhythm}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: '#999' }}>
                        {evt.category}
                      </span>
                    </div>

                    <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.8rem', color: '#fff', lineHeight: 1.3 }}>
                      {evt.title}
                    </h2>

                    <p style={{ color: '#bbb', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                      {evt.description}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', fontSize: '0.9rem', color: '#ddd', marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <Calendar size={18} color="var(--gold)" />
                        <span><strong>Fecha:</strong> {evt.event_date}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <Clock size={18} color="var(--gold)" />
                        <span><strong>Hora:</strong> {evt.event_time}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <MapPin size={18} color="var(--gold)" />
                        <span>{evt.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Sección Desplegable de Nómina, Emparejamientos & Clasificación */}
                  {(() => {
                    const eventMatches = matches
                      .filter((m) => m.event_id === evt.id)
                      .sort((a, b) => a.round - b.round || a.board_number - b.board_number);
                    const eventStandings = calculateTournamentStandings(eventMatches);
                    const eventRegs = registrations.filter((r) => r.event_id === evt.id && r.status !== 'cancelled');
                    const parsedAthletes = eventRegs.map((r) => {
                      let ext: any = null;
                      try {
                        if (r.notes && r.notes.startsWith('{')) ext = JSON.parse(r.notes);
                      } catch {}
                      const name = ext?.fullName || (r.profile ? `${r.profile.nombre} ${r.profile.apellido}` : 'Deportista Capablanca');
                      const elo = Number(ext?.eloRating) || r.profile?.elo_rating || 0;
                      const fide = ext?.fideId || r.profile?.fide_id || '';
                      const category = ext?.category || r.profile?.categoria_ajedrez || 'Categoría Abierta';
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
                        status: r.status,
                      };
                    }).sort((a, b) => (b.elo || 0) - (a.elo || 0));

                    const isExpanded = expandedEventId === evt.id;
                    const activeTab = tournamentTab[evt.id] || (eventMatches.length > 0 ? 'matches' : 'roster');

                    return (
                      <div style={{ marginTop: '1.2rem', borderTop: '1px solid #252525', paddingTop: '1rem' }}>
                        <button
                          type="button"
                          onClick={() => setExpandedEventId(isExpanded ? null : evt.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--gold)',
                            fontSize: '0.85rem',
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
                            <Swords size={16} />
                            Nómina ({eventRegs.length}), Partidas ({eventMatches.length}) & Posiciones ({eventStandings.length})
                          </span>
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>

                        {isExpanded && (
                          <div style={{ marginTop: '0.8rem' }}>
                            {/* Pestañas: Nómina vs Emparejamientos vs Tabla de Posiciones */}
                            <div style={{ display: 'flex', gap: '0.4rem', borderBottom: '1px solid #222', paddingBottom: '0.5rem', marginBottom: '0.8rem', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                onClick={() => setTournamentTab({ ...tournamentTab, [evt.id]: 'roster' })}
                                style={{
                                  background: activeTab === 'roster' ? '#252525' : 'transparent',
                                  color: activeTab === 'roster' ? 'var(--gold)' : '#888',
                                  border: '1px solid',
                                  borderColor: activeTab === 'roster' ? 'var(--gold)' : '#333',
                                  borderRadius: '6px',
                                  padding: '0.25rem 0.65rem',
                                  fontSize: '0.76rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem'
                                }}
                              >
                                <Users size={13} />
                                <span>Nómina ({eventRegs.length})</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setTournamentTab({ ...tournamentTab, [evt.id]: 'matches' })}
                                style={{
                                  background: activeTab === 'matches' ? '#252525' : 'transparent',
                                  color: activeTab === 'matches' ? 'var(--gold)' : '#888',
                                  border: '1px solid',
                                  borderColor: activeTab === 'matches' ? 'var(--gold)' : '#333',
                                  borderRadius: '6px',
                                  padding: '0.25rem 0.65rem',
                                  fontSize: '0.76rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem'
                                }}
                              >
                                <Swords size={13} />
                                <span>Partidas ({eventMatches.length})</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setTournamentTab({ ...tournamentTab, [evt.id]: 'standings' })}
                                style={{
                                  background: activeTab === 'standings' ? '#252525' : 'transparent',
                                  color: activeTab === 'standings' ? 'var(--gold)' : '#888',
                                  border: '1px solid',
                                  borderColor: activeTab === 'standings' ? 'var(--gold)' : '#333',
                                  borderRadius: '6px',
                                  padding: '0.25rem 0.65rem',
                                  fontSize: '0.76rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem'
                                }}
                              >
                                <Trophy size={13} />
                                <span>Tabla de Posiciones ({eventStandings.length})</span>
                              </button>
                            </div>

                            {/* Contenido: Nómina Oficial */}
                            {activeTab === 'roster' && (
                              <div style={{ background: '#181818', border: '1px solid #282828', borderRadius: '8px', overflowX: 'auto' }}>
                                {parsedAthletes.length === 0 ? (
                                  <div style={{ padding: '1.2rem', textAlign: 'center', color: '#777', fontSize: '0.82rem' }}>
                                    No hay deportistas preinscritos aún para este certamen. ¡Sé el primero en preinscribirte!
                                  </div>
                                ) : (
                                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.78rem' }}>
                                    <thead>
                                      <tr style={{ background: '#202020', borderBottom: '1px solid #333', color: '#888', textTransform: 'uppercase', fontSize: '0.68rem' }}>
                                        <th style={{ padding: '0.5rem 0.8rem', width: '35px' }}>#</th>
                                        <th style={{ padding: '0.5rem 0.8rem' }}>Deportista</th>
                                        <th style={{ padding: '0.5rem 0.8rem' }}>Elo / FIDE</th>
                                        <th style={{ padding: '0.5rem 0.8rem' }}>Procedencia</th>
                                        <th style={{ padding: '0.5rem 0.8rem', textAlign: 'right' }}>Acreditación</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {parsedAthletes.map((ath, idx) => (
                                        <tr key={ath.id} style={{ borderBottom: '1px solid #222' }}>
                                          <td style={{ padding: '0.5rem 0.8rem', color: '#666', fontWeight: 700 }}>
                                            {idx + 1}
                                          </td>
                                          <td style={{ padding: '0.5rem 0.8rem' }}>
                                            <div style={{ fontWeight: 600, color: '#fff' }}>{ath.name}</div>
                                            <div style={{ fontSize: '0.68rem', color: 'var(--gold)' }}>{ath.radicado}</div>
                                          </td>
                                          <td style={{ padding: '0.5rem 0.8rem' }}>
                                            <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{ath.elo > 0 ? ath.elo : 'S/E'}</span>
                                            {ath.fide && <span style={{ color: '#888', marginLeft: '0.3rem' }}>· FIDE: {ath.fide}</span>}
                                          </td>
                                          <td style={{ padding: '0.5rem 0.8rem', color: '#aaa' }}>
                                            {ath.club}
                                          </td>
                                          <td style={{ padding: '0.5rem 0.8rem', textAlign: 'right' }}>
                                            <span style={{
                                              padding: '0.15rem 0.45rem',
                                              borderRadius: '4px',
                                              fontSize: '0.65rem',
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

                            {/* Contenido: Emparejamientos */}
                            {activeTab === 'matches' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                {eventMatches.length === 0 ? (
                                  <p style={{ fontSize: '0.8rem', color: '#777', fontStyle: 'italic', margin: 0, padding: '0.5rem 0' }}>
                                    Los emparejamientos de la ronda se publicarán 15 minutos antes de la hora pactada.
                                  </p>
                                ) : (
                                  eventMatches.map((m) => (
                                    <div
                                      key={m.id}
                                      style={{
                                        background: '#111',
                                        border: '1px solid #292929',
                                        borderRadius: '8px',
                                        padding: '0.6rem 0.8rem',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        gap: '0.6rem',
                                      }}
                                    >
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1 }}>
                                        <div style={{ fontSize: '0.72rem', color: '#888', fontWeight: 600 }}>
                                          Mesa {m.board_number} · Ronda {m.round}
                                        </div>
                                        <div style={{ fontSize: '0.82rem', color: '#eee' }}>
                                          <span>{m.white_player}</span>
                                          <span style={{ color: 'var(--gold)', margin: '0 0.3rem', fontWeight: 700 }}>vs</span>
                                          <span>{m.black_player}</span>
                                        </div>
                                      </div>

                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span
                                          style={{
                                            background: '#222',
                                            border: '1px solid #333',
                                            color: 'var(--gold)',
                                            fontWeight: 800,
                                            fontSize: '0.78rem',
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: '4px',
                                          }}
                                        >
                                          {m.result}
                                        </span>

                                        {m.pgn && (
                                          <button
                                            type="button"
                                            onClick={() => setActivePgnMatch(m)}
                                            className="btn btn--sm"
                                            style={{
                                              background: '#1e1e1e',
                                              color: 'var(--gold)',
                                              border: '1px solid var(--gold)',
                                              padding: '0.2rem 0.5rem',
                                              fontSize: '0.72rem',
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: '0.3rem',
                                            }}
                                            title="Ver visor PGN de la partida"
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

                            {/* Contenido: Tabla de Posiciones */}
                            {activeTab === 'standings' && (
                              <div>
                                {eventStandings.length === 0 ? (
                                  <p style={{ fontSize: '0.8rem', color: '#777', fontStyle: 'italic', margin: 0, padding: '0.5rem 0' }}>
                                    Aún no hay partidas computadas para generar la tabla de posiciones de este torneo.
                                  </p>
                                ) : (
                                  <div>
                                    <div style={{ overflowX: 'auto' }}>
                                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
                                        <thead>
                                          <tr style={{ background: '#161616', color: '#888', borderBottom: '1px solid #2a2a2a', textTransform: 'uppercase' }}>
                                            <th style={{ padding: '0.45rem 0.6rem' }}>#</th>
                                            <th style={{ padding: '0.45rem 0.6rem' }}>Deportista</th>
                                            <th style={{ padding: '0.45rem 0.4rem', textAlign: 'center' }}>PJ</th>
                                            <th style={{ padding: '0.45rem 0.4rem', textAlign: 'center' }}>PG</th>
                                            <th style={{ padding: '0.45rem 0.4rem', textAlign: 'center' }}>PE</th>
                                            <th style={{ padding: '0.45rem 0.4rem', textAlign: 'center' }}>PP</th>
                                            <th style={{ padding: '0.45rem 0.4rem', textAlign: 'center' }}>SB</th>
                                            <th style={{ padding: '0.45rem 0.6rem', textAlign: 'right', color: 'var(--gold)' }}>PTS</th>
                                            <th style={{ padding: '0.45rem 0.6rem', textAlign: 'right' }}>Diploma</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {eventStandings.map((st) => (
                                            <tr key={st.name} style={{ borderBottom: '1px solid #202020', background: st.rank === 1 ? 'rgba(212,175,55,0.06)' : 'transparent' }}>
                                              <td style={{ padding: '0.45rem 0.6rem', fontWeight: 800 }}>
                                                <span style={{
                                                  display: 'inline-flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'center',
                                                  width: '20px',
                                                  height: '20px',
                                                  borderRadius: '50%',
                                                  fontSize: '0.7rem',
                                                  background: st.rank === 1 ? '#ffd700' : st.rank === 2 ? '#c0c0c0' : st.rank === 3 ? '#cd7f32' : '#222',
                                                  color: st.rank <= 3 ? '#000' : '#888'
                                                }}>
                                                  {st.rank}
                                                </span>
                                              </td>
                                              <td style={{ padding: '0.45rem 0.6rem', fontWeight: 600, color: '#fff' }}>
                                                {st.name}
                                              </td>
                                              <td style={{ padding: '0.45rem 0.4rem', textAlign: 'center', color: '#aaa' }}>{st.played}</td>
                                              <td style={{ padding: '0.45rem 0.4rem', textAlign: 'center', color: '#4ade80' }}>{st.won}</td>
                                              <td style={{ padding: '0.45rem 0.4rem', textAlign: 'center', color: '#facc15' }}>{st.drawn}</td>
                                              <td style={{ padding: '0.45rem 0.4rem', textAlign: 'center', color: '#f87171' }}>{st.lost}</td>
                                              <td style={{ padding: '0.45rem 0.4rem', textAlign: 'center', color: '#888' }}>{st.sonnebornBerger}</td>
                                              <td style={{ padding: '0.45rem 0.6rem', textAlign: 'right', fontWeight: 800, color: 'var(--gold)', fontSize: '0.85rem' }}>
                                                {st.points}
                                              </td>
                                              <td style={{ padding: '0.45rem 0.6rem', textAlign: 'right' }}>
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
                                                    background: '#222',
                                                    color: 'var(--gold)',
                                                    border: '1px solid #444',
                                                    borderRadius: '4px',
                                                    padding: '0.15rem 0.4rem',
                                                    fontSize: '0.68rem',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.2rem',
                                                  }}
                                                  title="Ver e Imprimir Diploma Oficial"
                                                >
                                                  <Award size={11} />
                                                  <span>Diploma</span>
                                                </button>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>

                                    <div style={{ marginTop: '0.75rem', textAlign: 'right' }}>
                                      <button
                                        type="button"
                                        onClick={() => exportStandingsToCsv(evt.title, eventStandings)}
                                        className="btn btn--ghost btn--sm"
                                        style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--gold)', borderColor: 'var(--gold)' }}
                                      >
                                        <Download size={12} />
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


                  <div style={{ borderTop: '1px solid #292929', paddingTop: '1.2rem', marginTop: '1rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>Inscripción</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--gold)' }}>{evt.entry_fee}</div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => setRegisteringEvent(evt)}
                        className="btn btn--primary btn--sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
                      >
                        <UserCheck size={16} />
                        <span>Preinscribirme</span>
                      </button>
                      <Link to="/afiliados" className="btn btn--ghost btn--sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <ShieldCheck size={16} />
                        <span>Soy Afiliado</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Modal Visor de Partida PGN */}
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

      {/* Modal Diploma Oficial de Torneo */}
      {tournamentCertModalData && (
        <TournamentCertificateModal
          isOpen={true}
          onClose={() => setTournamentCertModalData(null)}
          data={tournamentCertModalData}
        />
      )}

      {/* Modal Preinscripción a Torneo */}
      {registeringEvent && (
        <TournamentRegistrationModal
          isOpen={true}
          onClose={() => setRegisteringEvent(null)}
          event={registeringEvent}
          onRegisteredSuccess={(regData) => {
            const newReg: TournamentRegistration = {
              id: crypto.randomUUID(),
              event_id: registeringEvent.id,
              status: 'pending',
              notes: JSON.stringify(regData),
              created_at: new Date().toISOString(),
            };
            setRegistrations((prev) => [newReg, ...prev]);
            setTournamentTab((prev) => ({ ...prev, [registeringEvent.id]: 'roster' }));
            setExpandedEventId(registeringEvent.id);
          }}
        />
      )}
    </div>
  );
};
