import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HeroSlider } from '../../components/public/HeroSlider';
import { Ticker } from '../../components/public/Ticker';
import { StatsSection } from '../../components/public/StatsSection';
import { InstagramWall } from '../../components/public/InstagramWall';
import { INITIAL_EVENTS, INITIAL_POSTS, INITIAL_ANNOUNCEMENTS } from '../../lib/initialData';
import { ClubAnnouncement } from '../../types/database';
import { Calendar, Clock, MapPin, Trophy, ArrowRight, BookOpen, CheckCircle, HelpCircle, Megaphone, X } from 'lucide-react';

export const HomeView: React.FC = () => {
  const upcomingEvents = INITIAL_EVENTS.slice(0, 2);
  const latestPosts = INITIAL_POSTS.slice(0, 2);
  const [activeBanner, setActiveBanner] = useState<ClubAnnouncement | null>(INITIAL_ANNOUNCEMENTS[0] || null);


  const faqs = [
    {
      q: '¿Se necesita saber jugar para entrar al club?',
      a: 'No. Recibimos personas desde cero absoluto: enseñamos el movimiento de las piezas, las reglas y el pensamiento táctico desde la primera clase. También tenemos grupos avanzados para quienes ya compiten.',
    },
    {
      q: '¿Desde qué edad pueden empezar los niños?',
      a: 'Trabajamos con niños, jóvenes y adultos. La edad de inicio depende de la madurez de cada niño más que del número: lo evaluamos en una clase de prueba sin costo. Escríbenos por WhatsApp y te orientamos.',
    },
    {
      q: '¿Cuáles son los horarios y el valor de la mensualidad?',
      a: 'Manejamos varios grupos y horarios según la edad y el nivel, y los cupos cambian cada periodo. Confirmamos horarios disponibles y tarifas vigentes directamente por WhatsApp al +57 300 254 5835.',
    },
    {
      q: '¿Las clases son presenciales u online?',
      a: 'Ambas. La sede presencial está en el CC Aves María, tercer piso, en Sabaneta, y también dictamos clases y asesorías en modalidad online para quienes viven lejos o viajan.',
    },
  ];

  return (
    <div>
      {/* Banner de Anuncio Prioritario si está activo */}
      {activeBanner && activeBanner.active && (
        <div
          style={{
            background: activeBanner.level === 'urgent' ? '#b71c1c' : activeBanner.level === 'warning' ? '#e65100' : '#141414',
            borderBottom: '2px solid var(--gold)',
            color: '#fff',
            padding: '0.65rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.9rem',
            position: 'relative',
            zIndex: 100,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', margin: '0 auto' }}>
            <Megaphone size={18} color="var(--gold)" />
            <span>
              <strong>{activeBanner.title}:</strong> {activeBanner.message}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveBanner(null)}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '0.2rem' }}
            aria-label="Cerrar aviso"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* 1. Hero con Slider y ADN */}
      <HeroSlider />


      {/* 2. Ticker animado */}
      <Ticker />

      {/* 3. Cifras y contadores */}
      <StatsSection />

      {/* 4. El Club: Resumen e identidad */}
      <section className="section" style={{ background: '#fff', color: '#1a1a1a' }}>
        <div className="wrap split" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
            <img
              src="/assets/img/club-galeria-04.webp"
              alt="Alumnos y entrenadores del Club Capablanca Sabaneta"
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '1.5rem',
                left: '1.5rem',
                background: 'var(--gold)',
                color: '#000',
                padding: '0.8rem 1.4rem',
                borderRadius: '8px',
                fontWeight: 700,
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ fontSize: '1.4rem', lineHeight: 1 }}>+12 AÑOS</div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Formando en Sabaneta</div>
            </div>
          </div>

          <div>
            <span className="pill" style={{ background: '#000', color: 'var(--gold)', marginBottom: '1rem', display: 'inline-block' }}>
              Nuestra Casa
            </span>
            <h2 className="display display--ink" style={{ fontSize: 'var(--step-3)', marginBottom: '1.25rem' }}>
              Un club, una familia sobre 64 casillas
            </h2>
            <p style={{ fontSize: '1.1rem', color: '#333', lineHeight: 1.7, marginBottom: '1.2rem' }}>
              El Club Deportivo de Ajedrez Capablanca Sabaneta nació con una convicción clara y exigente:
              que el ajedrez sirva para mucho más que ganar partidas.
            </p>
            <p style={{ color: '#666', lineHeight: 1.6, marginBottom: '2rem' }}>
              En nuestra sede en el CC Aves María promovemos la disciplina, la capacidad reflexiva y la empatía en niños, jóvenes y adultos. Formamos tanto a campeones departamentales y nacionales como a aficionados que encuentran en el tablero un espacio sano de crecimiento.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/club" className="btn btn--primary">
                Conoce nuestra historia
              </Link>
              <Link to="/contacto" className="btn btn--ghost" style={{ borderColor: '#000', color: '#000' }}>
                Agenda clase de prueba
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Próximos Torneos (Dinámicos) */}
      <section className="section" style={{ background: '#121212', color: '#fff' }}>
        <div className="wrap">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2.5rem' }}>
            <div>
              <span className="pill pill--gold" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <Trophy size={14} /> Calendario Competitivo
              </span>
              <h2 className="display display--gold" style={{ marginTop: '0.8rem' }}>
                Próximos Torneos y Eventos
              </h2>
            </div>
            <Link to="/torneos" className="btn btn--ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Ver calendario completo</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            {upcomingEvents.map((evt) => (
              <div
                key={evt.id}
                style={{
                  background: '#1c1c1c',
                  border: '1px solid #2e2e2e',
                  borderRadius: '14px',
                  padding: '1.8rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.2s',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ background: 'var(--gold)', color: '#000', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
                      {evt.rhythm}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: '#888' }}>
                      Categoría: {evt.category}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.8rem', color: '#fff' }}>
                    {evt.title}
                  </h3>

                  <p style={{ color: '#aaa', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                    {evt.description}
                  </p>

                  <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem', color: '#ccc', marginBottom: '1.5rem' }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Calendar size={16} color="var(--gold)" />
                      <span>{evt.event_date} · {evt.event_time}</span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <MapPin size={16} color="var(--gold)" />
                      <span>{evt.location}</span>
                    </li>
                  </ul>
                </div>

                <div style={{ borderTop: '1px solid #2a2a2a', paddingTop: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--gold)' }}>{evt.entry_fee}</span>
                  <Link to="/afiliados" className="btn btn--primary btn--sm">
                    Inscribirme
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Programas de Formación */}
      <section className="section" style={{ background: '#f8f8f8', color: '#111' }}>
        <div className="wrap">
          <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 3rem' }}>
            <span className="pill" style={{ background: '#000', color: 'var(--gold)' }}>Metodología Probada</span>
            <h2 className="display display--ink" style={{ marginTop: '0.8rem' }}>
              Rutas de aprendizaje para cada meta
            </h2>
            <p style={{ color: '#555', marginTop: '0.5rem' }}>
              Desde los primeros conceptos lúdicos hasta el cálculo avanzado y la preparación de aperturas personalizadas.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
            {[
              { title: 'Iniciación Infantil', age: '4 a 8 años', desc: 'Enfoque lúdico, piezas gigantes, psicomotricidad y primeras reglas con diversión constante.' },
              { title: 'Desarrollo Juvenil', age: '9 a 16 años', desc: 'Táctica de nivel medio, estrategia en medio juego, cálculo y primeras participaciones en torneos.' },
              { title: 'Grupo Adultos & Aficionados', age: 'Todas las edades', desc: 'Aprende o retoma el ajedrez a tu ritmo, análisis de partidas y comunidad sana de juego.' },
              { title: 'Alta Competencia & Online', age: 'Ruta federada', desc: 'Entrenamiento intensivo, preparación personalizada de aperturas y asesoría nacional.' },
            ].map((prog, idx) => (
              <div key={idx} style={{ background: '#fff', padding: '2rem', borderRadius: '14px', border: '1px solid #e5e5e5', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ color: 'var(--gold-deep)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase' }}>
                    {prog.age}
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0.5rem 0 0.8rem' }}>
                    {prog.title}
                  </h3>
                  <p style={{ color: '#666', fontSize: '0.95rem', lineHeight: 1.6 }}>
                    {prog.desc}
                  </p>
                </div>
                <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
                  <Link to="/programas" style={{ fontWeight: 600, color: '#000', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
                    <span>Ver detalles</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Actualizaciones y Blog */}
      <section className="section" style={{ background: '#0d0d0d', color: '#fff' }}>
        <div className="wrap">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2.5rem' }}>
            <div>
              <span className="pill pill--gold" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <BookOpen size={14} /> Actualidad Capablanca
              </span>
              <h2 className="display display--gold" style={{ marginTop: '0.8rem' }}>
                Noticias, Artículos y Consejos
              </h2>
            </div>
            <Link to="/blog" className="btn btn--ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Ver todas las publicaciones</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            {latestPosts.map((post) => (
              <article
                key={post.id}
                style={{
                  background: '#171717',
                  border: '1px solid #282828',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ height: '200px', overflow: 'hidden' }}>
                  <img
                    src={post.cover_image}
                    alt={post.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--gold)', fontWeight: 600, textTransform: 'uppercase' }}>
                      {post.category}
                    </span>
                    <h3 style={{ fontSize: '1.2rem', margin: '0.5rem 0', lineHeight: 1.4 }}>
                      <Link to={`/blog/${post.slug}`} style={{ color: '#fff' }}>
                        {post.title}
                      </Link>
                    </h3>
                    <p style={{ color: '#aaa', fontSize: '0.9rem', lineHeight: 1.5 }}>
                      {post.excerpt}
                    </p>
                  </div>
                  <div style={{ marginTop: '1.2rem', paddingTop: '1rem', borderTop: '1px solid #262626' }}>
                    <Link to={`/blog/${post.slug}`} style={{ color: 'var(--gold)', fontWeight: 600, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span>Leer artículo</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Muro Social / Instagram */}
      <InstagramWall />

      {/* 9. Preguntas Frecuentes (FAQ) */}
      <section className="section" style={{ background: '#fff', color: '#111' }}>
        <div className="wrap-narrow">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span className="pill" style={{ background: '#000', color: 'var(--gold)' }}>
              <HelpCircle size={14} style={{ display: 'inline', marginRight: '4px' }} /> Dudas Habituales
            </span>
            <h2 className="display display--ink" style={{ marginTop: '0.8rem' }}>
              Preguntas Frecuentes
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                style={{
                  background: '#f9f9f9',
                  border: '1px solid #e8e8e8',
                  borderRadius: '12px',
                  padding: '1.5rem',
                }}
              >
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: '#111' }}>
                  {faq.q}
                </h3>
                <p style={{ color: '#555', fontSize: '0.95rem', lineHeight: 1.6 }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. CTA Final de Inscripción */}
      <section className="section section--gold" style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
        <div className="wrap-narrow">
          <h2 className="display display--ink" style={{ fontSize: 'var(--step-4)', marginBottom: '1rem' }}>
            ¿Listo para tu primera jugada?
          </h2>
          <p style={{ fontSize: '1.2rem', color: '#222', maxWidth: '650px', margin: '0 auto 2rem', lineHeight: 1.6 }}>
            Inscríbete hoy en el Club Deportivo de Ajedrez Capablanca Sabaneta o agenda una clase diagnóstica sin compromiso en CC Aves María.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <a
              href="https://wa.me/573002545835?text=Hola%2C%20quiero%20inscribirme%20en%20el%20Club%20Capablanca%20Sabaneta."
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
              style={{ background: '#000', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <span>Escríbenos a WhatsApp</span>
              <ArrowRight size={18} />
            </a>
            <Link to="/contacto" className="btn btn--ghost" style={{ borderColor: '#000', color: '#000' }}>
              Formulario de Contacto
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
