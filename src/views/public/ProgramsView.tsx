import React from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowRight, UserCheck, Sparkles, Monitor, Users } from 'lucide-react';

export const ProgramsView: React.FC = () => {
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
    <div style={{ paddingTop: 'calc(var(--header-h) + 2rem)' }}>
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

      {/* Cronograma Semanal de Clases */}
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {[
              { cat: 'Iniciación Infantil (4 a 8 años)', day: 'Martes y Jueves', time: '4:00 PM - 5:30 PM', mod: 'Presencial', place: 'CC Aves María, piso 3' },
              { cat: 'Semillero Sub-12', day: 'Miércoles y Viernes', time: '4:00 PM - 6:00 PM', mod: 'Presencial', place: 'CC Aves María, piso 3' },
              { cat: 'Desarrollo Juvenil Sub-16', day: 'Lunes y Miércoles', time: '6:00 PM - 8:00 PM', mod: 'Híbrida', place: 'Sede / Zoom' },
              { cat: 'Adultos & Aficionados', day: 'Sábados', time: '10:00 AM - 1:00 PM', mod: 'Presencial', place: 'CC Aves María, piso 3' },
              { cat: 'Alta Competencia', day: 'Sábados', time: '2:00 PM - 6:00 PM', mod: 'Presencial', place: 'CC Aves María, piso 3' },
            ].map((item, idx) => (
              <div key={idx} style={{ background: '#141414', border: '1px solid #282828', borderRadius: '12px', padding: '1.5rem' }}>
                <span style={{ fontSize: '0.75rem', background: 'var(--gold)', color: '#000', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 800, textTransform: 'uppercase' }}>
                  {item.mod}
                </span>
                <h3 style={{ fontSize: '1.15rem', color: '#fff', margin: '0.6rem 0 0.3rem' }}>{item.cat}</h3>
                <p style={{ color: 'var(--gold)', fontWeight: 600, fontSize: '0.95rem', margin: '0.2rem 0' }}>{item.day} · {item.time}</p>
                <p style={{ color: '#777', fontSize: '0.85rem', margin: 0 }}>{item.place}</p>
              </div>
            ))}
          </div>
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

