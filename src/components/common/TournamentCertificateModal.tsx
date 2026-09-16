import React from 'react';
import { X, Printer, Trophy, ShieldCheck } from 'lucide-react';

export interface TournamentCertificateData {
  athleteName: string;
  tournamentTitle: string;
  eventDate: string;
  location?: string;
  rhythm?: string;
  rank?: number;
  points?: number;
  sonnebornBerger?: number;
  played?: number;
  won?: number;
  isChampion?: boolean;
}

interface TournamentCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: TournamentCertificateData | null;
}

export const TournamentCertificateModal: React.FC<TournamentCertificateModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  if (!isOpen || !data) return null;

  const issueDate = new Date().toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const certHash = `DIPL-${Math.abs(
    (data.athleteName + data.tournamentTitle).split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0)
  ).toString(16).toUpperCase().padStart(6, '0')}-2026`;

  const handlePrint = () => {
    window.print();
  };

  const rankText =
    data.rank === 1
      ? 'CAMPEÓN OFICIAL (1° PUESTO - MEDALLA DE ORO)'
      : data.rank === 2
      ? 'SUBCAMPEÓN OFICIAL (2° PUESTO - MEDALLA DE PLATA)'
      : data.rank === 3
      ? 'TERCER LUGAR OFICIAL (3° PUESTO - MEDALLA DE BRONCE)'
      : data.rank && data.rank > 0
      ? `PUESTO ${data.rank}° DE LA CLASIFICACIÓN GENERAL`
      : 'PARTICIPACIÓN DESTACADA';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        overflowY: 'auto',
      }}
    >
      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 0.5cm;
          }
          body * {
            visibility: hidden;
          }
          #print-diploma-area, #print-diploma-area * {
            visibility: visible;
          }
          #print-diploma-area {
            position: fixed;
            left: 0;
            top: 0;
            width: 100vw;
            height: 100vh;
            margin: 0;
            padding: 1.5cm 2cm;
            background: #fff !important;
            color: #111 !important;
            box-shadow: none !important;
            border: 8px double #c5a059 !important;
            z-index: 99999;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div
        style={{
          width: '100%',
          maxWidth: '900px',
          background: '#1a1a1a',
          borderRadius: '16px',
          border: '1px solid #333',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '94vh',
        }}
      >
        {/* Header Modal - Solo en pantalla */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 1.5rem',
            background: '#141414',
            borderBottom: '1px solid #292929',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Trophy size={20} color="var(--gold)" />
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>
              Diploma Oficial de Torneo
            </h3>
          </div>
          <div style={{ display: 'flex', gap: '0.8rem' }}>
            <button
              onClick={handlePrint}
              className="btn btn--primary btn--sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.9rem' }}
            >
              <Printer size={16} />
              <span>Imprimir / Guardar PDF</span>
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#888',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '0.3rem',
                borderRadius: '6px',
              }}
              title="Cerrar ventana"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Contenedor del Diploma Imprimible */}
        <div style={{ overflowY: 'auto', padding: '1.5rem', background: '#0e0e0e' }}>
          <div
            id="print-diploma-area"
            style={{
              background: '#ffffff',
              color: '#1a1a1a',
              padding: '2.5rem 3rem',
              borderRadius: '8px',
              position: 'relative',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              fontFamily: '"Cinzel", "Georgia", "Times New Roman", serif',
              border: '6px double #c5a059',
              minHeight: '520px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            {/* Marca de Agua de Fondo */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.04,
                pointerEvents: 'none',
                fontSize: '260px',
                fontWeight: 900,
                color: '#000',
              }}
            >
              ♛
            </div>

            {/* Encabezado Institucional */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #c5a059', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: '#111',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#d4af37',
                      fontSize: '32px',
                      fontWeight: 'bold',
                      border: '2px solid #c5a059',
                    }}
                  >
                    ♞
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#111', fontWeight: 800, letterSpacing: '0.04em' }}>
                      CLUB DEPORTIVO DE AJEDREZ CAPABLANCA SABANETA
                    </h2>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem', color: '#555', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                      Reconocimiento Deportivo Inder Sabaneta Res. 042 · NIT 901.445.892-1 · Sabaneta, Antioquia, Colombia
                    </p>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      background: '#f8f5eb',
                      border: '1px solid #c5a059',
                      color: '#8b6914',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '0.25rem 0.6rem',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                    }}
                  >
                    {certHash}
                  </span>
                  <div style={{ fontSize: '0.7rem', color: '#777', marginTop: '0.25rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                    Emisión: {issueDate}
                  </div>
                </div>
              </div>

              {/* Título Central del Diploma */}
              <div style={{ textAlign: 'center', margin: '1.2rem 0' }}>
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: '0.85rem',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: '#8b6914',
                    fontWeight: 700,
                    marginBottom: '0.3rem',
                  }}
                >
                  OTORGA EL PRESENTE
                </span>
                <h1
                  style={{
                    fontSize: '2.4rem',
                    margin: '0.2rem 0',
                    color: '#111',
                    fontWeight: 900,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  DIPLOMA DE HONOR
                </h1>
                <p style={{ fontSize: '0.95rem', color: '#666', fontStyle: 'italic', margin: '0.3rem 0' }}>
                  Al mérito, esfuerzo y destreza deportiva en el juego ciencia
                </p>
              </div>

              {/* Cuerpo de Concesión */}
              <div style={{ textAlign: 'center', margin: '1.5rem 0' }}>
                <p style={{ fontSize: '1rem', color: '#444', margin: '0.5rem 0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                  Se hace constar con orgullo y solemnidad que el(la) ajedrecista:
                </p>

                <div
                  style={{
                    fontSize: '2rem',
                    fontWeight: 800,
                    color: '#111',
                    padding: '0.5rem 0',
                    borderBottom: '1px solid #e0d0b0',
                    display: 'inline-block',
                    minWidth: '60%',
                    letterSpacing: '0.03em',
                  }}
                >
                  {data.athleteName}
                </div>

                <p style={{ fontSize: '1rem', color: '#444', margin: '1rem 0 0.4rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                  Ha participado con distinción en el certamen oficial:
                </p>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#8b6914', textTransform: 'uppercase' }}>
                  "{data.tournamentTitle}"
                </div>

                <div
                  style={{
                    margin: '1.2rem auto',
                    display: 'inline-block',
                    background: '#faf8f2',
                    border: '2px solid #c5a059',
                    borderRadius: '8px',
                    padding: '0.6rem 1.8rem',
                  }}
                >
                  <div style={{ fontSize: '0.78rem', color: '#777', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                    Distinción Alcanzada:
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#111', marginTop: '0.2rem' }}>
                    {rankText}
                  </div>
                  {data.points !== undefined && (
                    <div style={{ fontSize: '0.85rem', color: '#555', marginTop: '0.3rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                      Puntaje Oficial: <strong>{data.points} pts</strong> {data.sonnebornBerger !== undefined ? `· Desempate Sonneborn-Berger: ${data.sonnebornBerger.toFixed(2)}` : ''}
                    </div>
                  )}
                </div>

                <p style={{ fontSize: '0.85rem', color: '#666', margin: '0.5rem 0 0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                  Celebrado en {data.location || 'Sabaneta, Antioquia'} el {data.eventDate} bajo ritmo {data.rhythm || 'Oficial FIDE'}.
                </p>
              </div>
            </div>

            {/* Firmas y Sellos */}
            <div style={{ borderTop: '1px solid #e0d0b0', paddingTop: '1.5rem', marginTop: '1.5rem', display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              <div style={{ textAlign: 'center', width: '220px' }}>
                <div style={{ borderBottom: '1px solid #333', marginBottom: '0.4rem', paddingBottom: '0.2rem', fontFamily: 'cursive', fontSize: '1.1rem', color: '#222' }}>
                  Comisión Técnica
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#111' }}>
                  DIRECTOR DEL TORNEO
                </div>
                <div style={{ fontSize: '0.68rem', color: '#777' }}>
                  Club de Ajedrez Capablanca
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '50%',
                    border: '2px dashed #c5a059',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.6rem',
                    color: '#8b6914',
                    fontWeight: 700,
                    margin: '0 auto',
                    padding: '0.2rem',
                    textTransform: 'uppercase',
                  }}
                >
                  <span>SELLO</span>
                  <ShieldCheck size={18} color="#8b6914" />
                  <span>OFICIAL</span>
                </div>
              </div>

              <div style={{ textAlign: 'center', width: '220px' }}>
                <div style={{ borderBottom: '1px solid #333', marginBottom: '0.4rem', paddingBottom: '0.2rem', fontFamily: 'cursive', fontSize: '1.1rem', color: '#222' }}>
                  Árbitro Principal
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#111' }}>
                  COLEGIO ARBITRAL
                </div>
                <div style={{ fontSize: '0.68rem', color: '#777' }}>
                  Validez Federada y Municipal
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
