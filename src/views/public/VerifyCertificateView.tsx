import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ShieldCheck, Search, Award, CheckCircle2, AlertCircle, Printer, ArrowLeft, ExternalLink } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { INITIAL_MEMBERS } from '../../lib/initialData';
import { UserProfile } from '../../types/database';
import { AffiliationCertificateModal } from '../../components/common/AffiliationCertificateModal';

export const VerifyCertificateView: React.FC = () => {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [members, setMembers] = useState<UserProfile[]>(INITIAL_MEMBERS);
  const [matchedMember, setMatchedMember] = useState<UserProfile | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Cargar miembros desde Supabase
  useEffect(() => {
    const fetchMembers = async () => {
      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*');
          if (!error && data && data.length > 0) {
            setMembers(data as UserProfile[]);
          }
        } catch (err) {
          console.warn('Usando miembros locales para verificación:', err);
        }
      }
    };
    fetchMembers();
  }, []);

  // Verificar código de URL automático si existe
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const codeParam = params.get('codigo') || params.get('code') || params.get('id');
    if (codeParam) {
      setSearchQuery(codeParam);
      verifyMember(codeParam, members);
    }
  }, [location.search, members]);

  const verifyMember = (query: string, currentMembers: UserProfile[]) => {
    setIsSearching(true);
    setHasSearched(true);

    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) {
      setMatchedMember(null);
      setIsSearching(false);
      return;
    }

    // Buscar por código CAPA-XXXXXX-2026, ID de usuario, FIDE ID, o Nombre
    const found = currentMembers.find((m) => {
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

    setMatchedMember(found || null);
    setIsSearching(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyMember(searchQuery, members);
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
            Verificación de Afiliación
          </h1>
          <p style={{ color: '#aaa', fontSize: '1.05rem', maxWidth: '620px', margin: '0 auto', lineHeight: 1.6 }}>
            Validador institucional para jueces, árbitros FIDE, Inder Sabaneta y organizadores de torneos. Compruebe la vigencia y estatus oficial de los deportistas del Club Capablanca.
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
                placeholder="Código del certificado (ej. CAPA-MEM001-2026), ID FIDE o nombre..."
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
            {['CAPA-MEM001-2026', 'CAPA-MEM002-2026', 'CAPA-MEM003-2026'].map((demoCode) => (
              <button
                key={demoCode}
                type="button"
                onClick={() => {
                  setSearchQuery(demoCode);
                  verifyMember(demoCode, members);
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
                {demoCode}
              </button>
            ))}
          </div>
        </div>

        {/* Resultados de la Búsqueda */}
        {hasSearched && (
          <div>
            {matchedMember ? (
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
                        Certificado Auténtico & Afiliación Vigente
                      </div>
                      <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', margin: '0.2rem 0 0' }}>
                        {matchedMember.nombre} {matchedMember.apellido}
                      </h2>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowModal(true)}
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
                  <span>Club Deportivo de Ajedrez Capablanca Sabaneta · NIT 901.458.789-2</span>
                </div>
              </div>
            ) : (
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
                  El código o documento ingresado (<strong>{searchQuery}</strong>) no corresponde a ningún certificado activo emitido por el Club Capablanca Sabaneta. Verifique que esté digitado correctamente.
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

        {/* Modal de Certificado Completo */}
        {matchedMember && showModal && (
          <AffiliationCertificateModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            member={matchedMember}
          />
        )}

      </div>
    </div>
  );
};
