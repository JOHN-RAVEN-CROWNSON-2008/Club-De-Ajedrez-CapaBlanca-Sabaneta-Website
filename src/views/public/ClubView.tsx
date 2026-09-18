import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Target, Award, Heart, CheckCircle2, Trophy, ExternalLink, Medal, Star, Crown, Search, ShieldCheck, X } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { INITIAL_MEMBERS, INITIAL_TROPHIES } from '../../lib/initialData';
import { UserProfile, MemberPublicDirectoryItem, ClubTrophy } from '../../types/database';
import { handleImageError } from '../../lib/imageUtils';

export const ClubView: React.FC = () => {
  const [members, setMembers] = useState<(UserProfile | MemberPublicDirectoryItem)[]>(INITIAL_MEMBERS);
  const [trophies, setTrophies] = useState<ClubTrophy[]>(INITIAL_TROPHIES);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [rankingSearch, setRankingSearch] = useState<string>('');
  const [trophyYearFilter, setTrophyYearFilter] = useState<string>('all');
  const [trophySearch, setTrophySearch] = useState<string>('');

  useEffect(() => {
    async function loadClubData() {
      if (!isSupabaseConfigured()) {
        setMembers(INITIAL_MEMBERS);
        setTrophies(INITIAL_TROPHIES);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('member_public_directory')
          .select('*')
          .order('elo_rating', { ascending: false });

        if (data && data.length > 0) {
          setMembers(data as MemberPublicDirectoryItem[]);
        } else {
          setMembers(INITIAL_MEMBERS);
        }

        const { data: trData } = await supabase
          .from('club_trophies')
          .select('*')
          .order('year', { ascending: false });

        if (trData && trData.length > 0) {
          setTrophies(trData as ClubTrophy[]);
        } else {
          setTrophies(INITIAL_TROPHIES);
        }
      } catch (err) {
        console.error('Error al cargar escalafón y trofeos de Supabase:', err);
        setMembers(INITIAL_MEMBERS);
        setTrophies(INITIAL_TROPHIES);
      }
    }

    loadClubData();
  }, []);

  // Escalafón Oficial
  const activeMembers = useMemo(() => {
    return members.filter((m) => !('role' in m) || (m as any).role !== 'admin' || (m.elo_rating || 0) > 0);
  }, [members]);

  const memberCategoryCounts = useMemo(() => {
    return {
      all: activeMembers.length,
      Infantil: activeMembers.filter((m) => {
        const cat = (m.categoria_ajedrez || '').toLowerCase();
        return cat.includes('infantil') || cat.includes('sub-12');
      }).length,
      Juvenil: activeMembers.filter((m) => {
        const cat = (m.categoria_ajedrez || '').toLowerCase();
        return cat.includes('juvenil') || cat.includes('sub-16') || cat.includes('sub-18');
      }).length,
      Adultos: activeMembers.filter((m) => {
        const cat = (m.categoria_ajedrez || '').toLowerCase();
        return cat.includes('adulto');
      }).length,
      Maestros: activeMembers.filter((m) => {
        const cat = (m.categoria_ajedrez || '').toLowerCase();
        return cat.includes('maestro') || (m.elo_rating || 0) >= 2000;
      }).length,
    };
  }, [activeMembers]);

  const filteredMembers = useMemo(() => {
    return activeMembers
      .filter((m) => {
        if (categoryFilter === 'all') return true;
        const cat = (m.categoria_ajedrez || '').toLowerCase();
        if (categoryFilter === 'Infantil') return cat.includes('infantil') || cat.includes('sub-12');
        if (categoryFilter === 'Juvenil') return cat.includes('juvenil') || cat.includes('sub-16') || cat.includes('sub-18');
        if (categoryFilter === 'Adultos') return cat.includes('adulto');
        if (categoryFilter === 'Maestros') return cat.includes('maestro') || (m.elo_rating || 0) >= 2000;
        return true;
      })
      .filter((m) => {
        if (!rankingSearch.trim()) return true;
        const q = rankingSearch.toLowerCase();
        const fullName = `${m.nombre || ''} ${m.apellido || ''}`.toLowerCase();
        const username = (m.usuario || '').toLowerCase();
        const city = (m.ciudad || '').toLowerCase();
        const fide = (m.fide_id || '').toLowerCase();
        return fullName.includes(q) || username.includes(q) || city.includes(q) || fide.includes(q);
      })
      .sort((a, b) => (b.elo_rating || 0) - (a.elo_rating || 0));
  }, [activeMembers, categoryFilter, rankingSearch]);

  // Palmarés Deportivo
  const trophyYears = useMemo(() => {
    const years = Array.from(new Set(trophies.map((t) => t.year.toString()))).sort((a, b) => Number(b) - Number(a));
    return ['all', ...years];
  }, [trophies]);

  const trophyYearCounts = useMemo(() => {
    const counts: Record<string, number> = { all: trophies.length };
    trophies.forEach((t) => {
      const yr = t.year.toString();
      counts[yr] = (counts[yr] || 0) + 1;
    });
    return counts;
  }, [trophies]);

  const filteredTrophies = useMemo(() => {
    return trophies.filter((t) => {
      const matchYear = trophyYearFilter === 'all' || t.year.toString() === trophyYearFilter;
      const q = trophySearch.trim().toLowerCase();
      const matchSearch =
        !q ||
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.champion_name && t.champion_name.toLowerCase().includes(q)) ||
        (t.runner_up && t.runner_up.toLowerCase().includes(q)) ||
        (t.category && t.category.toLowerCase().includes(q)) ||
        (t.location && t.location.toLowerCase().includes(q)) ||
        (t.notes && t.notes.toLowerCase().includes(q));

      return matchYear && matchSearch;
    });
  }, [trophies, trophyYearFilter, trophySearch]);

  return (
    <div style={{ paddingTop: 'var(--content-offset)' }}>
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
              onError={handleImageError}
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

            {/* Barra de Búsqueda del Escalafón */}
            <div style={{ maxWidth: '520px', margin: '1.5rem auto 1.2rem', position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
              <input
                type="text"
                placeholder="Buscar por nombre, usuario, ciudad o FIDE ID..."
                value={rankingSearch}
                onChange={(e) => setRankingSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 2.8rem 0.75rem 2.8rem',
                  borderRadius: '30px',
                  background: '#161616',
                  border: '1px solid #333',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--gold)';
                  e.currentTarget.style.boxShadow = '0 0 12px rgba(245, 197, 24, 0.25)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#333';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              {rankingSearch && (
                <button
                  type="button"
                  onClick={() => setRankingSearch('')}
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#888',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                  }}
                  title="Limpiar búsqueda"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filtros de Categoría con conteo */}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              {(['all', 'Infantil', 'Juvenil', 'Adultos', 'Maestros'] as const).map((cat) => {
                const count = memberCategoryCounts[cat] || 0;
                const label = cat === 'all' ? 'Todo el Escalafón' : cat;
                return (
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
                      border: categoryFilter === cat ? '1px solid var(--gold)' : '1px solid #333',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {label} ({count})
                  </button>
                );
              })}
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
                  if (filteredMembers.length === 0) {
                    return (
                      <tr>
                        <td colSpan={6} style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#888' }}>
                          <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#aaa' }}>
                            {rankingSearch
                              ? `No se encontraron ajedrecistas para "${rankingSearch}".`
                              : 'No hay deportistas registrados en esta categoría.'}
                          </p>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1.2rem' }}>
                            {rankingSearch && (
                              <button
                                type="button"
                                onClick={() => setRankingSearch('')}
                                className="btn btn--sm btn--secondary"
                              >
                                Limpiar búsqueda
                              </button>
                            )}
                            {categoryFilter !== 'all' && (
                              <button
                                type="button"
                                onClick={() => setCategoryFilter('all')}
                                className="btn btn--sm btn--secondary"
                              >
                                Ver todo el escalafón
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return filteredMembers.map((player, index) => {
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
                          <Link
                            to={`/verificar?codigo=CAPA-${(player.id || 'MEM').slice(-6).toUpperCase()}-2026`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.25rem 0.65rem',
                              borderRadius: '20px',
                              background: 'rgba(76, 175, 80, 0.12)',
                              border: '1px solid rgba(76, 175, 80, 0.35)',
                              color: '#81c784',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              textDecoration: 'none',
                              transition: 'all 0.2s ease',
                            }}
                            title={`Validar certificación deportiva oficial de ${player.nombre} ${player.apellido}`}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(76, 175, 80, 0.25)';
                              e.currentTarget.style.borderColor = '#81c784';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(76, 175, 80, 0.12)';
                              e.currentTarget.style.borderColor = 'rgba(76, 175, 80, 0.35)';
                            }}
                          >
                            <ShieldCheck size={14} />
                            <span>Activo ✓</span>
                          </Link>
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

      {/* Cuadro de Honor y Palmarés Deportivo */}
      <section className="section" style={{ background: '#0a0a0a', color: '#fff', borderTop: '1px solid #1a1a1a', paddingBlock: '4rem' }}>
        <div className="wrap">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span className="pill pill--gold" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <Crown size={14} /> Campeones & Títulos
            </span>
            <h2 className="display display--gold" style={{ fontSize: 'var(--step-3)', marginTop: '0.8rem' }}>
              Cuadro de Honor y Palmarés Deportivo
            </h2>
            <p style={{ color: '#888', maxWidth: '650px', margin: '0.8rem auto 0', fontSize: '1.05rem', lineHeight: 1.6 }}>
              Reconocimiento a nuestros atletas y delegaciones que han dejado en alto los colores del Club Capablanca en torneos departamentales, metropolitanos y abiertos.
            </p>
          </div>

          {/* Barra de Búsqueda de Palmarés */}
          <div style={{ maxWidth: '480px', margin: '0 auto 1.5rem', position: 'relative' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '1.1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--gold)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Buscar campeón, subcampeón o título..."
              value={trophySearch}
              onChange={(e) => setTrophySearch(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 2.8rem 0.75rem 2.8rem',
                borderRadius: '30px',
                background: '#161616',
                border: '1px solid #333',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--gold)';
                e.currentTarget.style.boxShadow = '0 0 12px rgba(245, 197, 24, 0.25)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#333';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            {trophySearch && (
              <button
                type="button"
                onClick={() => setTrophySearch('')}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: '#888',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Limpiar búsqueda"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filtros de Palmarés por Temporada con conteo */}
          <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
            {trophyYears.map((yr) => {
              const count = trophyYearCounts[yr] || 0;
              const label = yr === 'all' ? 'Todos los Títulos' : `Temporada ${yr}`;
              return (
                <button
                  key={yr}
                  type="button"
                  className={`btn btn--sm ${trophyYearFilter === yr ? 'btn--primary' : 'btn--ghost'}`}
                  onClick={() => setTrophyYearFilter(yr)}
                >
                  {label} ({count})
                </button>
              );
            })}
          </div>

          {/* Grid de Trofeos y Campeones */}
          {(() => {
            if (filteredTrophies.length === 0) {
              return (
                <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', background: '#121212', borderRadius: '14px', border: '1px solid #222', maxWidth: '520px', margin: '0 auto' }}>
                  <Trophy size={40} style={{ color: 'var(--gold)', margin: '0 auto 1rem', opacity: 0.6 }} />
                  <h3 style={{ fontSize: '1.15rem', color: '#fff', marginBottom: '0.5rem' }}>
                    {trophySearch ? 'No se encontraron campeonatos' : 'Sin registros en este periodo'}
                  </h3>
                  <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1.2rem' }}>
                    {trophySearch
                      ? `No hay títulos o campeones que coincidan con "${trophySearch}".`
                      : 'No hay títulos registrados para la temporada seleccionada.'}
                  </p>
                  <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {trophySearch && (
                      <button
                        type="button"
                        onClick={() => setTrophySearch('')}
                        className="btn btn--sm btn--secondary"
                      >
                        Limpiar búsqueda
                      </button>
                    )}
                    {trophyYearFilter !== 'all' && (
                      <button
                        type="button"
                        onClick={() => setTrophyYearFilter('all')}
                        className="btn btn--sm btn--secondary"
                      >
                        Ver todos los títulos
                      </button>
                    )}
                  </div>
                </div>
              );
            }

            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.8rem' }}>
                {filteredTrophies.map((tr) => (
                  <div
                    key={tr.id}
                    style={{
                      background: 'linear-gradient(180deg, #161616 0%, #111111 100%)',
                      border: '1px solid #282828',
                      borderRadius: '16px',
                      padding: '1.8rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, transparent, var(--gold), transparent)' }} />

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '0.75rem', background: '#252010', color: 'var(--gold)', border: '1px solid #554415', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: 800 }}>
                          {tr.year} · {tr.edition || 'Torneo Oficial'}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#ffb300' }}>
                          <Trophy size={18} />
                        </div>
                      </div>

                      <h3 style={{ fontSize: '1.15rem', color: '#fff', margin: '0 0 0.5rem 0', lineHeight: 1.4 }}>
                        {tr.title}
                      </h3>
                      <div style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '1.2rem' }}>
                        {tr.category} · {tr.location || 'Sabaneta, Antioquia'}
                      </div>

                      <div style={{ background: '#181818', border: '1px solid #222', borderRadius: '10px', padding: '1rem', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: tr.runner_up ? '0.4rem' : 0 }}>
                          <Crown size={16} color="var(--gold)" />
                          <span style={{ fontSize: '0.9rem', color: '#ccc' }}>Campeón:</span>
                          <strong style={{ color: 'var(--gold)', fontSize: '0.95rem' }}>{tr.champion_name}</strong>
                        </div>
                        {tr.runner_up && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#888' }}>
                            <Medal size={15} color="#b0bec5" />
                            <span>Subcampeón:</span>
                            <span style={{ color: '#ccc' }}>{tr.runner_up}</span>
                          </div>
                        )}
                      </div>

                      {tr.notes && (
                        <p style={{ color: '#777', fontSize: '0.82rem', margin: 0, fontStyle: 'italic', lineHeight: 1.5 }}>
                          "{tr.notes}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
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
            <Link to="/afiliarse" className="btn btn--primary">
              Solicitar Afiliación Deportiva
            </Link>
            <Link to="/contacto" className="btn btn--secondary">
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
