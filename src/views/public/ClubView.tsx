import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Target, Award, Heart, CheckCircle2, Trophy, ExternalLink, Medal, Star } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { INITIAL_MEMBERS } from '../../lib/initialData';
import { UserProfile } from '../../types/database';

export const ClubView: React.FC = () => {
  const [members, setMembers] = useState<UserProfile[]>(INITIAL_MEMBERS);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    async function loadMembers() {
      if (!isSupabaseConfigured()) {
        setMembers(INITIAL_MEMBERS);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('elo_rating', { ascending: false });

        if (data && data.length > 0) {
          setMembers(data as UserProfile[]);
        } else {
          setMembers(INITIAL_MEMBERS);
        }
      } catch (err) {
        console.error('Error al cargar escalafón de Supabase:', err);
        setMembers(INITIAL_MEMBERS);
      }
    }

    loadMembers();
  }, []);
  return (
    <div style={{ paddingTop: 'calc(var(--header-h) + 2rem)' }}>
      {/* Cabecera de Sección */}
      <section className="section section--dark" style={{ textAlign: 'center', paddingBlock: '3rem' }}>
        <div className="wrap-narrow">
          <span className="pill pill--gold">Historia e Identidad</span>
          <h1 className="display display--gold" style={{ fontSize: 'var(--step-4)', marginTop: '1rem' }}>
            Club Deportivo de Ajedrez Capablanca Sabaneta
          </h1>
          <p style={{ color: '#ccc', fontSize: '1.2rem', marginTop: '1rem', lineHeight: 1.6 }}>
            Más de 12 años formando deportistas y seres humanos íntegros en el sur del Valle de Aburrá.
          </p>
        </div>
      </section>

      {/* Misión y Visión */}
      <section className="section" style={{ background: '#fff', color: '#111' }}>
        <div className="wrap" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', alignItems: 'center' }}>
          <div>
            <span className="kicker" style={{ color: 'var(--gold-deep)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.85rem' }}>
              Nuestra Misión
            </span>
            <h2 className="display display--ink" style={{ fontSize: 'var(--step-3)', margin: '0.5rem 0 1.2rem' }}>
              Enseñar a pensar antes de mover
            </h2>
            <p style={{ fontSize: '1.05rem', color: '#444', lineHeight: 1.7, marginBottom: '1rem' }}>
              El Club Deportivo de Ajedrez Capablanca Sabaneta es una entidad dedicada a la enseñanza, fomento y práctica del ajedrez en todos los niveles. Desde niños de 4 años hasta adultos mayores, consideramos el ajedrez como un puente hacia la concentración, el cálculo metódico y la resiliencia emocional.
            </p>
            <p style={{ fontSize: '1.05rem', color: '#444', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              Nuestra sede en el CC Aves María en Sabaneta, Antioquia, es un punto de encuentro cálido donde convergen la camaradería de barrio y el rigor competitivo de los torneos federados.
            </p>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {[
                'Afiliación formal a la Liga de Ajedrez de Antioquia',
                'Entrenadores titulados y con trayectoria pedagógica',
                'Participación regular en campeonatos departamentales y nacionales',
                'Metodología adaptada a cada etapa evolutiva del deportista',
              ].map((item, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#222' }}>
                  <CheckCircle2 size={18} color="#D32F2F" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
            <img
              src="/assets/img/delegacion-escalinatas.webp"
              alt="Delegación completa del club con familias y entrenadores"
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>
        </div>
      </section>

      {/* Valores del Club */}
      <section className="section section--soft" style={{ background: '#f5f5f5', color: '#111' }}>
        <div className="wrap">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span className="pill" style={{ background: '#000', color: 'var(--gold)' }}>Pilares Fundamentales</span>
            <h2 className="display display--ink" style={{ marginTop: '0.8rem' }}>Nuestros Valores</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2rem' }}>
            {[
              { icon: <Shield size={32} color="#F5C518" />, title: 'Caballerosidad & Respeto', desc: 'Aceptamos la victoria con humildad y la derrota como una oportunidad invaluable de aprendizaje.' },
              { icon: <Target size={32} color="#F5C518" />, title: 'Disciplina & Rigor', desc: 'El talento sin constancia no basta. Fomentamos el estudio diario y la paciencia en el cálculo.' },
              { icon: <Heart size={32} color="#D32F2F" />, title: 'Espíritu de Familia', desc: 'El acompañamiento familiar es la pieza clave para que los niños amen y disfruten del deporte.' },
              { icon: <Award size={32} color="#F5C518" />, title: 'Excelencia Integral', desc: 'Buscamos formar tanto a deportistas de alto nivel como a ciudadanos éticos y reflexivos.' },
            ].map((val, idx) => (
              <div key={idx} style={{ background: '#fff', padding: '2rem', borderRadius: '14px', border: '1px solid #e2e2e2' }}>
                <div style={{ marginBottom: '1rem' }}>{val.icon}</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.6rem' }}>{val.title}</h3>
                <p style={{ color: '#666', fontSize: '0.95rem', lineHeight: 1.6 }}>{val.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Escalafón Oficial y Ranking Interno */}
      <section className="section" style={{ background: '#0e0e0e', color: '#fff', paddingBlock: '4rem' }}>
        <div className="wrap">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span className="pill pill--gold">Cuadro de Honor</span>
            <h2 className="display display--gold" style={{ fontSize: 'var(--step-3)', marginTop: '0.8rem' }}>
              Escalafón Deportivo Oficial
            </h2>
            <p style={{ color: '#aaa', fontSize: '1.05rem', marginTop: '0.5rem' }}>
              Ranking interno del Club de Ajedrez Capablanca Sabaneta ordenado por Elo oficial y rendimiento competitivo
            </p>

            {/* Filtros de Categoría */}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1.5rem' }}>
              {['all', 'Infantil', 'Juvenil', 'Adultos', 'Maestros'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  style={{
                    padding: '0.4rem 0.9rem',
                    borderRadius: '20px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    background: categoryFilter === cat ? 'var(--gold)' : '#1a1a1a',
                    color: categoryFilter === cat ? '#000' : '#bbb',
                    border: '1px solid #333',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {cat === 'all' ? 'Todo el Escalafón' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Tabla de Clasificación */}
          <div style={{ background: '#141414', border: '1px solid #282828', borderRadius: '14px', overflowX: 'auto', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#1c1c1c', borderBottom: '1px solid #333', color: '#888', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '1rem', width: '60px', textAlign: 'center' }}>Pos.</th>
                  <th style={{ padding: '1rem' }}>Deportista</th>
                  <th style={{ padding: '1rem' }}>Categoría</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Rating Elo</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Perfil FIDE</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Membresía</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const sorted = [...members]
                    .filter((m) => m.role !== 'admin' || m.elo_rating)
                    .filter((m) => {
                      if (categoryFilter === 'all') return true;
                      if (categoryFilter === 'Infantil') return (m.categoria_ajedrez || '').toLowerCase().includes('infantil') || (m.categoria_ajedrez || '').toLowerCase().includes('sub-12');
                      if (categoryFilter === 'Juvenil') return (m.categoria_ajedrez || '').toLowerCase().includes('juvenil') || (m.categoria_ajedrez || '').toLowerCase().includes('sub-16') || (m.categoria_ajedrez || '').toLowerCase().includes('sub-18');
                      if (categoryFilter === 'Adultos') return (m.categoria_ajedrez || '').toLowerCase().includes('adulto');
                      if (categoryFilter === 'Maestros') return (m.categoria_ajedrez || '').toLowerCase().includes('maestro') || (m.elo_rating || 0) >= 2000;
                      return true;
                    })
                    .sort((a, b) => (b.elo_rating || 0) - (a.elo_rating || 0));

                  if (sorted.length === 0) {
                    return (
                      <tr>
                        <td colSpan={6} style={{ padding: '2.5rem', textAlign: 'center', color: '#777' }}>
                          No hay deportistas listados en esta categoría actualmente.
                        </td>
                      </tr>
                    );
                  }

                  return sorted.map((player, index) => {
                    const pos = index + 1;
                    const medalColor = pos === 1 ? '#ffd700' : pos === 2 ? '#c0c0c0' : pos === 3 ? '#cd7f32' : null;

                    return (
                      <tr key={player.id} style={{ borderBottom: '1px solid #222', background: pos <= 3 ? 'rgba(212, 175, 55, 0.03)' : 'transparent' }}>
                        <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 800 }}>
                          {medalColor ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: medalColor, color: '#000', fontSize: '0.85rem' }}>
                              {pos}
                            </span>
                          ) : (
                            <span style={{ color: '#666' }}>{pos}º</span>
                          )}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>
                            {player.nombre} {player.apellido}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#888' }}>
                            @{player.usuario || 'afiliado'} · {player.ciudad || 'Sabaneta'}
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ background: '#222', color: 'var(--gold)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 600 }}>
                            {player.categoria_ajedrez || 'Iniciación'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <span style={{ fontSize: '1.15rem', fontWeight: 800, color: pos <= 3 ? 'var(--gold)' : '#fff' }}>
                            {player.elo_rating || 1200}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          {player.fide_id ? (
                            <a
                              href={`https://ratings.fide.com/profile/${player.fide_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#90caf9', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', textDecoration: 'none' }}
                              title="Ver ficha oficial en fide.com"
                            >
                              <span>{player.fide_id}</span>
                              <ExternalLink size={12} />
                            </a>
                          ) : (
                            <span style={{ color: '#555', fontSize: '0.8rem' }}>En trámite</span>
                          )}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <span style={{ color: '#81c784', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                            Activo ✓
                          </span>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section section--dark" style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
        <div className="wrap-narrow">
          <h2 className="display display--gold" style={{ marginBottom: '1rem' }}>
            Únete a la Familia Capablanca
          </h2>
          <p style={{ color: '#ccc', marginBottom: '2rem', fontSize: '1.1rem' }}>
            Visítanos en nuestra sede en el tercer piso del CC Aves María en Sabaneta o comunícate directamente con nuestro equipo directivo.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/contacto" className="btn btn--primary">
              Contactar al Club
            </Link>
            <Link to="/afiliados" className="btn btn--ghost">
              Portal de Afiliados
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
