import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowRight, UserCheck, Sparkles, Monitor, Users, GraduationCap, Clock, MapPin, Calendar } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { INITIAL_SCHEDULES } from '../../lib/initialData';
import { ClassSchedule } from '../../types/database';

export const ProgramsView: React.FC = () => {
  const [schedules, setSchedules] = useState<ClassSchedule[]>(INITIAL_SCHEDULES);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [modalityFilter, setModalityFilter] = useState<'all' | 'Presencial' | 'Online' | 'Híbrida'>('all');

  useEffect(() => {
    async function loadSchedules() {
      if (!isSupabaseConfigured()) {
        setSchedules(INITIAL_SCHEDULES);
        return;
      }

      try {
        setLoadingSchedules(true);
        const { data, error } = await supabase
          .from('class_schedules')
          .select('*')
          .eq('active', true)
          .order('category', { ascending: true });

        if (data && data.length > 0) {
          setSchedules(data as ClassSchedule[]);
        } else {
          setSchedules(INITIAL_SCHEDULES);
        }
      } catch (err) {
        console.warn('Usando cronograma inicial por fallback:', err);
        setSchedules(INITIAL_SCHEDULES);
      } finally {
        setLoadingSchedules(false);
      }
    }

    loadSchedules();
  }, []);

  const programs = [
    {
      id: 'infantil',
      icon: <Sparkles size={28} color="#F5C518" />,
      title: 'Semillero Infantil (4 a 8 años)',
      subtitle: 'Iniciación divertida y estimulación cognitiva',
      desc: 'Diseñado especialmente para los más pequeños. A través de cuentos, personajes, piezas gigantes y juegos didácticos, los niños descubren el movimiento de las piezas y conceptos elementales de geometría y orientación espacial.',
      features: [
        'Desarrollo de la motricidad fina y atención sostenida',
        'Metodología basada en juego (sin presión competitiva)',
        'Grupos reducidos de máximo 8 niños por entrenador',
        'Material lúdico adaptado y tableros temáticos',
      ],
      modalidad: 'Presencial en CC Aves María',
    },
    {
      id: 'juvenil',
      icon: <Users size={28} color="#F5C518" />,
      title: 'Desarrollo Juvenil (9 a 16 años)',
      subtitle: 'Táctica, cálculo y pensamiento estratégico',
      desc: 'El programa idóneo para escolares y jóvenes que desean dominar las celadas tácticas, los mates típicos, los planes de medio juego y la técnica elemental de finales.',
      features: [
        'Resolución guiada de ejercicios de táctica por temas',
        'Manejo del reloj de ajedrez y planilla oficial de anotación',
        'Torneos internos mensuales para poner en práctica lo aprendido',
        'Acompañamiento en festivales intercolegiados',
      ],
      modalidad: 'Presencial y Virtual',
    },
    {
      id: 'adultos',
      icon: <UserCheck size={28} color="#F5C518" />,
      title: 'Club de Adultos & Aficionados',
      subtitle: 'Aprende, retoma y disfruta del juego a tu ritmo',
      desc: 'Para quienes nunca tuvieron la oportunidad de aprender o aquellos que jugaron en su juventud y quieren volver al tablero en un ambiente distendido y de sana camaradería.',
      features: [
        'Horarios vespertinos y fines de semana adaptados a jornadas laborales',
        'Análisis de partidas clásicas de grandes maestros',
        'Partidas libres comentadas y asesoría personalizada',
        'Comunidad activa y torneos sociales',
      ],
      modalidad: 'Presencial en Sabaneta',
    },
    {
      id: 'competencia',
      icon: <Monitor size={28} color="#F5C518" />,
      title: 'Alta Competencia & Escuela Virtual',
      subtitle: 'Ruta federada y asesoría para torneos oficiales',
      desc: 'Entrenamiento de alto rendimiento para deportistas clasificados o en ruta de selección departamental y nacional. Preparación de repertorio de aperturas con bases de datos y software especializado.',
      features: [
        'Construcción de repertorio personalizado con blancas y negras',
        'Uso de motores de análisis y bases de datos modernas (ChessBase / Lichess)',
        'Simulacros con ritmo de torneo oficial (clásico, rápido y blitz)',
        'Acompañamiento técnico en torneos nacionales e internacionales',
      ],
      modalidad: 'Presencial y Online (Zoom / Lichess)',
    },
  ];

  return (
    <div style={{ paddingTop: 'var(--content-offset)' }}>
      {/* Cabecera */}
      <section className="section section--dark" style={{ textAlign: 'center', paddingBlock: '3rem' }}>
        <div className="wrap-narrow">
          <span className="pill pill--gold">Formación Continua</span>
          <h1 className="display display--gold" style={{ fontSize: 'var(--step-4)', marginTop: '1rem' }}>
            Nuestros Programas de Formación
          </h1>
          <p style={{ color: '#ccc', fontSize: '1.2rem', marginTop: '1rem', lineHeight: 1.6 }}>
            Estructuras pedagógicas probadas para acompañarte desde tu primera jugada hasta el podio.
          </p>
        </div>
      </section>

      {/* Listado de programas */}
      <section className="section" style={{ background: '#fff', color: '#111' }}>
        <div className="wrap">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            {programs.map((prog) => (
              <div
                key={prog.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: '2.5rem',
                  padding: '2.5rem',
                  borderRadius: '16px',
                  background: '#fafafa',
                  border: '1px solid #e2e2e2',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.8rem' }}>
                    {prog.icon}
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gold-deep)' }}>
                      {prog.modalidad}
                    </span>
                  </div>
                  <h2 style={{ fontSize: '1.7rem', fontWeight: 800, color: '#111', marginBottom: '0.4rem' }}>
                    {prog.title}
                  </h2>
                  <p style={{ color: '#666', fontWeight: 600, fontSize: '1.05rem', marginBottom: '1rem' }}>
                    {prog.subtitle}
                  </p>
                  <p style={{ color: '#444', lineHeight: 1.7, marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                    {prog.desc}
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <a
                      href={`https://wa.me/573002545835?text=${encodeURIComponent(`Hola, me interesa el programa ${prog.title} en el Club Capablanca.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn--primary btn--sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <span>Inscribirme en este programa</span>
                      <ArrowRight size={16} />
                    </a>
                  </div>
                </div>

                <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', border: '1px solid #eaeaea' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#222' }}>
                    ¿Qué incluye este programa?
                  </h3>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {prog.features.map((feat, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.95rem', color: '#444' }}>
                        <Check size={18} color="#25D366" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cronograma Semanal de Clases Dinámico */}
      <section className="section section--dark" style={{ paddingBlock: '4rem' }}>
        <div className="wrap">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span className="pill pill--gold">Horarios Oficiales</span>
            <h2 className="display display--gold" style={{ marginTop: '0.8rem' }}>
              Cronograma Semanal de Entrenamientos
            </h2>
            <p style={{ color: '#aaa', marginTop: '0.5rem' }}>
              Clases regulares en nuestra sede del CC Aves María y sesiones virtuales de acompañamiento
            </p>
          </div>

          {/* Filtros por Modalidad */}
          <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
            {[
              { id: 'all', label: 'Todas las Sesiones', count: schedules.length },
              { id: 'Presencial', label: 'Presenciales (Sabaneta)', count: schedules.filter(s => s.modality === 'Presencial').length },
              { id: 'Online', label: 'Virtuales (Zoom / Lichess)', count: schedules.filter(s => s.modality === 'Online').length },
              { id: 'Híbrida', label: 'Híbridas', count: schedules.filter(s => s.modality === 'Híbrida').length },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setModalityFilter(f.id as any)}
                style={{
                  background: modalityFilter === f.id ? 'var(--gold)' : '#181818',
                  color: modalityFilter === f.id ? '#000' : '#ccc',
                  border: `1px solid ${modalityFilter === f.id ? 'var(--gold)' : '#333'}`,
                  padding: '0.45rem 1rem',
                  borderRadius: '50px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  transition: 'all 0.2s',
                }}
              >
                <span>{f.label}</span>
                <span
                  style={{
                    background: modalityFilter === f.id ? '#000' : '#282828',
                    color: modalityFilter === f.id ? 'var(--gold)' : '#aaa',
                    padding: '0.1rem 0.45rem',
                    borderRadius: '50px',
                    fontSize: '0.72rem',
                  }}
                >
                  {f.count}
                </span>
              </button>
            ))}
          </div>

          {loadingSchedules ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
              Cargando cronograma oficial de clases...
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {schedules
                .filter(item => modalityFilter === 'all' || item.modality === modalityFilter)
                .map((item) => {
                  const isOnline = item.modality === 'Online';
                  const isHibrida = item.modality === 'Híbrida';
                  const badgeBg = isOnline ? 'rgba(59, 130, 246, 0.15)' : isHibrida ? 'rgba(168, 85, 247, 0.15)' : 'rgba(245, 197, 24, 0.15)';
                  const badgeColor = isOnline ? '#60a5fa' : isHibrida ? '#c084fc' : 'var(--gold)';
                  const badgeBorder = isOnline ? '#2563eb' : isHibrida ? '#9333ea' : 'var(--gold)';

                  return (
                    <div
                      key={item.id}
                      style={{
                        background: '#141414',
                        border: '1px solid #282828',
                        borderRadius: '14px',
                        padding: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        transition: 'border-color 0.2s, transform 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.borderColor = 'rgba(245, 197, 24, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.borderColor = '#282828';
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                          <span style={{ fontSize: '0.75rem', background: badgeBg, color: badgeColor, border: `1px solid ${badgeBorder}`, padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 800, textTransform: 'uppercase' }}>
                            {item.modality}
                          </span>
                        </div>
                        <h3 style={{ fontSize: '1.18rem', color: '#fff', margin: '0.4rem 0 0.5rem', fontWeight: 700 }}>
                          {item.category}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--gold)', fontWeight: 600, fontSize: '0.92rem', marginBottom: '0.4rem' }}>
                          <Clock size={15} style={{ flexShrink: 0 }} />
                          <span>{item.day_of_week} · {item.time_range}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#bbb', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                          <GraduationCap size={15} style={{ flexShrink: 0, color: 'var(--gold)' }} />
                          <span>{item.trainer || 'Entrenador Titulado'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#777', fontSize: '0.82rem' }}>
                          <MapPin size={15} style={{ flexShrink: 0 }} />
                          <span>{item.location}</span>
                        </div>
                      </div>

                      <div style={{ marginTop: '1.2rem', paddingTop: '1rem', borderTop: '1px solid #222' }}>
                        <Link
                          to={`/afiliarse?categoria=${encodeURIComponent(item.category)}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            color: 'var(--gold)',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            textDecoration: 'none',
                          }}
                        >
                          <span>Postularse a este horario</span>
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </section>

      {/* Banner de asesoría */}
      <section className="section section--gold" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
        <div className="wrap-narrow">
          <h2 className="display display--ink" style={{ fontSize: 'var(--step-3)', marginBottom: '1rem' }}>
            ¿No estás seguro de cuál es tu nivel?
          </h2>
          <p style={{ fontSize: '1.1rem', color: '#222', marginBottom: '1.8rem', lineHeight: 1.6 }}>
            Agenda una clase de diagnóstico sin compromiso con uno de nuestros maestros para evaluar tu nivel y orientarte hacia el grupo adecuado.
          </p>
          <a
            href="https://wa.me/573002545835?text=Hola%2C%20me%20gustar%C3%ADa%20agendar%20una%20clase%20de%20diagn%C3%B3stico%20gratuita."
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
            style={{ background: '#000', color: '#fff' }}
          >
            Agendar clase diagnóstica
          </a>
        </div>
      </section>
    </div>
  );
};

