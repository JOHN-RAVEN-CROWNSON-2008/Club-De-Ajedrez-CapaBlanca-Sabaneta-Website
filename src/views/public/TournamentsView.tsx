import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { INITIAL_EVENTS, INITIAL_MATCHES } from '../../lib/initialData';
import { ClubEvent, TournamentMatch } from '../../types/database';
import { Calendar, Clock, MapPin, Trophy, ArrowRight, ShieldCheck, Swords, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { PgnViewerModal } from '../../components/common/PgnViewerModal';

export const TournamentsView: React.FC = () => {
  const [events, setEvents] = useState<ClubEvent[]>(INITIAL_EVENTS);
  const [matches, setMatches] = useState<TournamentMatch[]>(INITIAL_MATCHES);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [activePgnMatch, setActivePgnMatch] = useState<TournamentMatch | null>(null);

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
          .order('board_number', { ascending: true });

        if (mtchs && mtchs.length > 0) {
          setMatches(mtchs as TournamentMatch[]);
        } else {
          setMatches(INITIAL_MATCHES);
        }
      } catch (err) {
        console.error('Error al cargar datos de torneos de Supabase:', err);
        setEvents(INITIAL_EVENTS);
        setMatches(INITIAL_MATCHES);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const filteredEvents = events.filter((ev) => {
    if (filter === 'all') return true;
    if (filter === 'infantil') return ev.category.toLowerCase().includes('infantil');
    if (filter === 'abierto') return ev.category.toLowerCase().includes('abierto');
    return true;
  });

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
          
          {/* Botones de filtro y Acceso a Reloj Digital */}
          <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginBottom: '2.5rem', alignItems: 'center' }}>
            <button
              type="button"
              className={`btn btn--sm ${filter === 'all' ? 'btn--primary' : 'btn--ghost'}`}
              onClick={() => setFilter('all')}
            >
              Todos los torneos
            </button>
            <button
              type="button"
              className={`btn btn--sm ${filter === 'abierto' ? 'btn--primary' : 'btn--ghost'}`}
              onClick={() => setFilter('abierto')}
            >
              Categoría Abierta
            </button>
            <button
              type="button"
              className={`btn btn--sm ${filter === 'infantil' ? 'btn--primary' : 'btn--ghost'}`}
              onClick={() => setFilter('infantil')}
            >
              Semilleros Infantiles
            </button>

            <Link
              to="/reloj"
              className="btn btn--sm"
              style={{
                marginLeft: 'auto',
                background: 'linear-gradient(135deg, var(--gold), #e0a820)',
                color: '#0a0a0a',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                textDecoration: 'none',
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                boxShadow: '0 4px 12px rgba(212,175,55,0.25)'
              }}
            >
              <Clock size={16} />
              <span>Abrir Reloj Oficial</span>
            </Link>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: '#888' }}>
              Cargando calendario oficial...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', background: '#161616', borderRadius: '12px', border: '1px solid #222' }}>
              <p style={{ color: '#aaa', fontSize: '1.1rem' }}>No hay torneos programados en esta categoría actualmente.</p>
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

                  {/* Sección Desplegable de Emparejamientos & Resultados */}
                  {(() => {
                    const eventMatches = matches.filter((m) => m.event_id === evt.id);
                    const isExpanded = expandedEventId === evt.id;

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
                            Emparejamientos & Resultados ({eventMatches.length})
                          </span>
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>

                        {isExpanded && (
                          <div style={{ marginTop: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
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
                      </div>
                    );
                  })()}

                  <div style={{ borderTop: '1px solid #292929', paddingTop: '1.2rem', marginTop: '1rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>Inscripción</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--gold)' }}>{evt.entry_fee}</div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Link to="/afiliados" className="btn btn--primary btn--sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <ShieldCheck size={16} />
                        <span>Inscribirme (Afiliado)</span>
                      </Link>
                      <a
                        href={`https://wa.me/573002545835?text=${encodeURIComponent(`Hola, quiero inscribirme como externo al torneo: ${evt.title}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn--ghost btn--sm"
                      >
                        Inscripción Externa
                      </a>
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
    </div>
  );
};
