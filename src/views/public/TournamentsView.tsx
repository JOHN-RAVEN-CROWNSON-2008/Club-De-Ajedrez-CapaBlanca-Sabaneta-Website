import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { INITIAL_EVENTS } from '../../lib/initialData';
import { ClubEvent } from '../../types/database';
import { Calendar, Clock, MapPin, Trophy, ArrowRight, ShieldCheck } from 'lucide-react';

export const TournamentsView: React.FC = () => {
  const [events, setEvents] = useState<ClubEvent[]>(INITIAL_EVENTS);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadEvents() {
      if (!isSupabaseConfigured()) {
        setEvents(INITIAL_EVENTS);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('event_date', { ascending: true });

        if (error || !data || data.length === 0) {
          setEvents(INITIAL_EVENTS);
        } else {
          setEvents(data as ClubEvent[]);
        }
      } catch (err) {
        console.error('Error al cargar torneos de Supabase:', err);
        setEvents(INITIAL_EVENTS);
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
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
          
          {/* Botones de filtro */}
          <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
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

                  <div style={{ borderTop: '1px solid #292929', paddingTop: '1.2rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
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
    </div>
  );
};
