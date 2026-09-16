import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ShieldCheck, Search, Award, CheckCircle2, AlertCircle, ExternalLink, Trophy, Medal } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { INITIAL_MEMBERS, INITIAL_EVENTS, INITIAL_MATCHES } from '../../lib/initialData';
import { UserProfile, ClubEvent, TournamentMatch } from '../../types/database';
import { AffiliationCertificateModal } from '../../components/common/AffiliationCertificateModal';
import { TournamentCertificateModal, TournamentCertificateData } from '../../components/common/TournamentCertificateModal';
import { calculateTournamentStandings } from '../../lib/tournamentStandings';

interface VerifiedDiploma extends TournamentCertificateData {
  certHash: string;
}

export const VerifyCertificateView: React.FC = () => {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [members, setMembers] = useState<UserProfile[]>(INITIAL_MEMBERS);
  const [events, setEvents] = useState<ClubEvent[]>(INITIAL_EVENTS);
  const [matches, setMatches] = useState<TournamentMatch[]>(INITIAL_MATCHES);
  
  const [matchedMember, setMatchedMember] = useState<UserProfile | null>(null);
  const [matchedDiploma, setMatchedDiploma] = useState<VerifiedDiploma | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showDiplomaModal, setShowDiplomaModal] = useState(false);

  // Cargar datos desde Supabase si está disponible
  useEffect(() => {
    const fetchData = async () => {
      if (isSupabaseConfigured()) {
        try {
          const [profilesRes, eventsRes, matchesRes] = await Promise.all([
            supabase.from('profiles').select('*'),
            supabase.from('events').select('*'),
            supabase.from('tournament_matches').select('*'),
          ]);

          if (!profilesRes.error && profilesRes.data && profilesRes.data.length > 0) {
            setMembers(profilesRes.data as UserProfile[]);
          }
          if (!eventsRes.error && eventsRes.data && eventsRes.data.length > 0) {
            setEvents(eventsRes.data as ClubEvent[]);
          }
          if (!matchesRes.error && matchesRes.data && matchesRes.data.length > 0) {
            setMatches(matchesRes.data as TournamentMatch[]);
          }
        } catch (err) {
          console.warn('Usando datos locales para validación:', err);
        }
      }
    };
    fetchData();
  }, []);

  // Catálogo completo de diplomas emitibles por torneos disputados
  const diplomasCatalog: VerifiedDiploma[] = useMemo(() => {
    const list: VerifiedDiploma[] = [];

    events.forEach((ev) => {
      const evMatches = matches.filter((m) => m.event_id === ev.id);
      if (evMatches.length === 0) return;

      const standings = calculateTournamentStandings(evMatches);
      standings.forEach((st) => {
        const certHash = `DIPL-${Math.abs(
          (st.name + ev.title).split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0)
        ).toString(16).toUpperCase().padStart(6, '0')}-2026`;

        list.push({
          athleteName: st.name,
          tournamentTitle: ev.title,
          eventDate: ev.event_date || '2026-09-15',
          location: ev.location || 'Sede CC Aves María, Sabaneta',
          rhythm: ev.rhythm || 'Blitz 3+2',
          rank: st.rank,
          points: st.points,
          sonnebornBerger: st.sonnebornBerger,
          played: st.played,
          won: st.won,
          isChampion: st.rank === 1,
          certHash,
        });
      });
    });

    return list;
  }, [events, matches]);

  const verifyQuery = (query: string) => {
    setIsSearching(true);
    setHasSearched(true);

    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) {
      setMatchedMember(null);
      setMatchedDiploma(null);
      setIsSearching(false);
      return;
    }

    // 1. Buscar en Certificados de Afiliación
    const foundMember = members.find((m) => {
      const memberCode = `capa-${(m.id || '').slice(-6).toLowerCase()}-2026`;
      const directId = (m.id || '').toLowerCase();
      const fideId = (m.fide_id || '').toLowerCase();
      const fullName = `${m.nombre} ${m.apellido}`.toLowerCase();
      const email = (m.correo || '').toLowerCase();

      return (
        memberCode.includes(cleanQuery) ||
        directId === cleanQuery ||
        fideId === cleanQuery ||
        fullName.includes(cleanQuery) ||
        email === cleanQuery
      );
    });

    // 2. Buscar en Diplomas Oficiales de Torneo
    const foundDiploma = diplomasCatalog.find((d) => {
      const diplHash = d.certHash.toLowerCase();
      const athlete = d.athleteName.toLowerCase();
      const tourney = d.tournamentTitle.toLowerCase();

      return (
        diplHash.includes(cleanQuery) ||
        athlete.includes(cleanQuery) ||
        (cleanQuery.length > 5 && tourney.includes(cleanQuery))
      );
    });

    setMatchedMember(foundMember || null);
    setMatchedDiploma(foundDiploma || null);
    setIsSearching(false);
  };

  // Verificar parámetro de URL automáticamente
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const codeParam = params.get('codigo') || params.get('code') || params.get('id');
    if (codeParam) {
      setSearchQuery(codeParam);
      verifyQuery(codeParam);
    }
  }, [location.search, members, diplomasCatalog]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyQuery(searchQuery);
  };

  return (
    <div style={{ paddingTop: 'calc(var(--header-h) + 2rem)', paddingBottom: '5rem', background: '#0a0a0a', color: '#fff', minHeight: '100vh' }}>
      <div className="wrap" style={{ maxWidth: '850px', margin: '0 auto' }}>
        
        {/* Cabecera */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(245, 197, 24, 0.1)', border: '1px solid var(--gold)', padding: '0.35rem 1rem', borderRadius: '50px', color: 'var(--gold)', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem' }}>
            <ShieldCheck size={18} />
            <span>SISTEMA OFICIAL DE VALIDACIÓN DEPORTIVA</span>
          </div>
          <h1 className="display display--gold" style={{ fontSize: '2.4rem', marginBottom: '0.8rem' }}>
            Verificación de Certificados & Diplomas
          </h1>
          <p style={{ color: '#aaa', fontSize: '1.05rem', maxWidth: '620px', margin: '0 auto', lineHeight: 1.6 }}>
            Validador institucional para jueces, árbitros FIDE, Inder Sabaneta y organizadores de torneos. Compruebe la autenticidad y vigencia de certificados de afiliación y diplomas oficiales.
          </p>
        </div>

        {/* Buscador de Certificados */}
        <div style={{ background: '#141414', border: '1px solid #282828', borderRadius: '16px', padding: '2rem', marginBottom: '2.5rem', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
              <Search size={20} color="#666" style={{ position: 'absolute', left: '14px', top: '14px' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Código (CAPA-MEM001-2026 / DIPL-790AE38B-2026), ID FIDE o nombre..."
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem 0.85rem 2.8rem',
                  borderRadius: '10px',
                  background: '#1d1d1d',
                  border: '1px solid #383838',
                  color: '#fff',
                  fontSize: '0.95rem',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="btn btn--primary"
              style={{ fontWeight: 700, padding: '0.85rem 1.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <ShieldCheck size={18} />
              <span>Verificar</span>
            </button>
          </form>

          {/* Chips de prueba rápida */}
          <div style={{ marginTop: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.8rem', color: '#777' }}>
            <span>Ejemplos rápidos:</span>
            {[
              { label: 'Afiliación Santiago Gómez', code: 'CAPA-MEM001-2026' },
              { label: 'Diploma Torneo Relámpago', code: 'DIPL-790AE38B-2026' },
              { label: 'FIDE ID Andrés Arboleda', code: '4452205' },
            ].map((chip) => (
              <button
                key={chip.code}
                type="button"
                onClick={() => {
                  setSearchQuery(chip.code);
                  verifyQuery(chip.code);
                }}
                style={{
                  background: '#222',
                  border: '1px solid #333',
                  color: 'var(--gold)',
                  borderRadius: '4px',
                  padding: '0.2rem 0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                }}
              >
                {chip.label} ({chip.code})
              </button>
            ))}
          </div>
        </div>

        {/* Resultados de la Búsqueda */}
        {hasSearched && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* 1. Resultado de Certificado de Afiliación */}
            {matchedMember && (
              <div
                style={{
                  background: '#111913',
                  border: '2px solid #2e7d32',
                  borderRadius: '16px',
                  padding: '2.5rem',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#2e7d32', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircle2 size={30} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#81c784', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>
                        Certificado Auténtico & Afiliación Deportiva Vigente
                      </div>
                      <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', margin: '0.2rem 0 0' }}>
                        {matchedMember.nombre} {matchedMember.apellido}
                      </h2>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowMemberModal(true)}
                    className="btn btn--primary btn--sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
                  >
                    <Award size={16} />
                    <span>Ver Certificado Membretado</span>
                  </button>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                    gap: '1rem',
                    background: '#0d130e',
                    border: '1px solid #1b381e',
                    borderRadius: '10px',
                    padding: '1.5rem',
                    margin: '1.5rem 0',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>Categoría Club</span>
                    <strong style={{ display: 'block', fontSize: '1.05rem', color: 'var(--gold)', marginTop: '0.2rem' }}>
                      {matchedMember.categoria_ajedrez || 'Iniciación / Abierta'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>Elo Rating</span>
                    <strong style={{ display: 'block', fontSize: '1.05rem', color: '#fff', marginTop: '0.2rem' }}>
                      {matchedMember.elo_rating ? `${matchedMember.elo_rating} Pts` : 'En Evaluación'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>FIDE ID</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                      <strong style={{ fontSize: '1.05rem', color: '#fff' }}>
                        {matchedMember.fide_id || 'En Trámite'}
                      </strong>
                      {matchedMember.fide_id && (
                        <a
                          href={`https://ratings.fide.com/profile/${matchedMember.fide_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Ver en FIDE Ratings"
                          style={{ color: 'var(--gold)' }}
                        >
                          <ExternalLink size={13} />
                        </a>
                      )}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>Estado Estatutario</span>
                    <strong style={{ display: 'block', fontSize: '1.05rem', color: '#81c784', marginTop: '0.2rem' }}>
                      Afiliado Activo (2026)
                    </strong>
                  </div>
                </div>

                <div style={{ fontSize: '0.85rem', color: '#aaa', borderTop: '1px solid #1b381e', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span>Reconocimiento Deportivo: <strong>Res. 042 / Inder Sabaneta</strong></span>
                  <span>Club Deportivo de Ajedrez Capablanca Sabaneta · NIT 901.445.892-1</span>
                </div>
              </div>
            )}

            {/* 2. Resultado de Diploma Oficial de Torneo */}
            {matchedDiploma && (
              <div
                style={{
                  background: '#19170e',
                  border: '2px solid var(--gold)',
                  borderRadius: '16px',
                  padding: '2.5rem',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'var(--gold)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trophy size={30} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--gold)', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>
                        Diploma Oficial de Torneo Verificado & Registrado
                      </div>
                      <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', margin: '0.2rem 0 0' }}>
                        {matchedDiploma.athleteName}
                      </h2>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowDiplomaModal(true)}
                    className="btn btn--primary btn--sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
                  >
                    <Medal size={16} />
                    <span>Ver Diploma Oficial Horizontal</span>
                  </button>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                    gap: '1rem',
                    background: '#121008',
                    border: '1px solid #3d3416',
                    borderRadius: '10px',
                    padding: '1.5rem',
                    margin: '1.5rem 0',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>Certamen Oficial</span>
                    <strong style={{ display: 'block', fontSize: '1.05rem', color: '#fff', marginTop: '0.2rem' }}>
                      {matchedDiploma.tournamentTitle}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>Distinción / Podio</span>
                    <strong style={{ display: 'block', fontSize: '1.05rem', color: 'var(--gold)', marginTop: '0.2rem' }}>
                      {matchedDiploma.rank === 1 ? '🥇 Campeón Oficial' : matchedDiploma.rank === 2 ? '🥈 Subcampeón Oficial' : matchedDiploma.rank === 3 ? '🥉 Tercer Puesto' : `Puesto ${matchedDiploma.rank}° Oficial`}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>Puntaje / Desempate SB</span>
                    <strong style={{ display: 'block', fontSize: '1.05rem', color: '#81c784', marginTop: '0.2rem' }}>
                      {matchedDiploma.points} Pts · SB {(matchedDiploma.sonnebornBerger || 0).toFixed(2)}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>Código Hash del Diploma</span>
                    <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--gold)', fontFamily: 'monospace', marginTop: '0.2rem' }}>
                      {matchedDiploma.certHash}
                    </strong>
                  </div>
                </div>

                <div style={{ fontSize: '0.85rem', color: '#aaa', borderTop: '1px solid #3d3416', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span>Sede: <strong>{matchedDiploma.location}</strong></span>
                  <span>Avalado por Comisión Técnica & Colegio Arbitral Capablanca Sabaneta</span>
                </div>
              </div>
            )}

            {/* Alerta de No Encontrado */}
            {!matchedMember && !matchedDiploma && (
              <div
                style={{
                  background: '#231010',
                  border: '1px solid #b71c1c',
                  borderRadius: '16px',
                  padding: '2.5rem',
                  textAlign: 'center',
                }}
              >
                <AlertCircle size={44} color="#ff8a80" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.3rem', color: '#ff8a80', fontWeight: 800, marginBottom: '0.5rem' }}>
                  No se encontró ningún registro oficial
                </h3>
                <p style={{ color: '#ccc', maxWidth: '520px', margin: '0 auto 1.5rem', fontSize: '0.92rem', lineHeight: 1.6 }}>
                  El código o documento ingresado (<strong>{searchQuery}</strong>) no corresponde a ningún certificado de afiliación ni diploma de torneo emitido por el Club Capablanca Sabaneta.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                  <Link to="/contacto" className="btn btn--ghost btn--sm">
                    Contactar Secretaría del Club
                  </Link>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Modal Certificado de Afiliación */}
        {matchedMember && (
          <AffiliationCertificateModal
            isOpen={showMemberModal}
            onClose={() => setShowMemberModal(false)}
            member={matchedMember}
          />
        )}

        {/* Modal Diploma Oficial de Torneo */}
        {matchedDiploma && (
          <TournamentCertificateModal
            isOpen={showDiplomaModal}
            onClose={() => setShowDiplomaModal(false)}
            data={matchedDiploma}
          />
        )}

      </div>
    </div>
  );
};
