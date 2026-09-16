import React from 'react';
import { X, Printer, Award, ShieldCheck } from 'lucide-react';
import { UserProfile } from '../../types/database';

interface AffiliationCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: UserProfile | {
    id: string;
    nombre: string;
    apellido: string;
    correo: string;
    categoria_ajedrez?: string;
    elo_rating?: number;
    fide_id?: string;
    ciudad?: string;
    rol?: string;
    created_at?: string;
  };
}

export const AffiliationCertificateModal: React.FC<AffiliationCertificateModalProps> = ({
  isOpen,
  onClose,
  member,
}) => {
  if (!isOpen) return null;

  const issueDate = new Date().toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const certCode = `CAPA-${(member.id || 'MEM').slice(-6).toUpperCase()}-2026`;

  const handlePrint = () => {
    window.print();
  };

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
          body * {
            visibility: hidden;
          }
          #print-certificate-area, #print-certificate-area * {
            visibility: visible;
          }
          #print-certificate-area {
            position: fixed;
            left: 0;
            top: 0;
            width: 100vw;
            height: 100vh;
            margin: 0;
            padding: 2.5cm 2cm;
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
          maxWidth: '850px',
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
            background: '#141414',
            borderBottom: '1px solid #282828',
            padding: '1rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Award size={22} color="var(--gold)" />
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff', fontWeight: 700 }}>
              Certificado Oficial de Afiliación Deportiva
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <button
              type="button"
              onClick={handlePrint}
              className="btn btn--primary btn--sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
            >
              <Printer size={16} />
              <span>Imprimir / Guardar PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#aaa',
                cursor: 'pointer',
                padding: '0.3rem',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Cuerpo del Certificado (Imprimible) */}
        <div
          id="print-certificate-area"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '3rem',
            background: '#faf8f2',
            color: '#1a1a1a',
            position: 'relative',
            border: '6px double #c5a059',
            margin: '1.2rem',
            borderRadius: '8px',
          }}
        >
          {/* Marca de agua decorativa de fondo */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              opacity: 0.04,
              fontSize: '24rem',
              fontWeight: 900,
              userSelect: 'none',
              color: '#000',
            }}
          >
            ♞
          </div>

          {/* Encabezado Institucional */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #c5a059', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '2rem' }}>♟</span>
              <div>
                <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 900, letterSpacing: '1px', color: '#111', textTransform: 'uppercase' }}>
                  Club Deportivo de Ajedrez Capablanca Sabaneta
                </h1>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#555', letterSpacing: '0.5px' }}>
                  PERSONERÍA JURÍDICA & RECONOCIMIENTO DEPORTIVO VIGENTE · INDER SABANETA / LIGA DE ANTIOQUIA
                </p>
              </div>
              <span style={{ fontSize: '2rem' }}>♞</span>
            </div>
            <p style={{ margin: '0.3rem 0 0', fontSize: '0.75rem', color: '#777' }}>
              NIT: 901.458.789-2 · Sabaneta, Antioquia, Colombia · clubcapablanca.org
            </p>
          </div>

          {/* Título Central */}
          <div style={{ textAlign: 'center', margin: '2rem 0' }}>
            <p style={{ textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.85rem', color: '#8c7038', fontWeight: 800, margin: 0 }}>
              La Junta Directiva del Club Hace Constar Que:
            </p>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0f172a', margin: '0.8rem 0', fontFamily: 'serif' }}>
              {member.nombre} {member.apellido}
            </h2>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#eef4ed', color: '#1b5e20', border: '1px solid #c8e6c9', padding: '0.3rem 0.9rem', borderRadius: '50px', fontSize: '0.82rem', fontWeight: 700 }}>
              <ShieldCheck size={16} />
              <span>AFILIADO ACTIVO Y EN REGLA DEPORTIVA</span>
            </div>
          </div>

          {/* Declaración Oficial */}
          <div style={{ fontSize: '0.95rem', lineHeight: 1.8, textAlign: 'justify', color: '#333', margin: '1.8rem 0' }}>
            <p>
              Se encuentra debidamente inscrito(a) en el libro oficial de afiliados y deportistas del <strong>Club Deportivo de Ajedrez Capablanca Sabaneta</strong>. Goza de todos los derechos y prerrogativas estatutarias para representar al Club en torneos oficiales, válidas departamentales, campeonatos nacionales federados y eventos avalados por la <strong>Federación Colombiana de Ajedrez (FECOLDAZ)</strong> y la <strong>FIDE</strong> durante la vigencia actual.
            </p>
          </div>

          {/* Ficha Resumen */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem',
              background: '#f4efe4',
              border: '1px solid #dfd6c3',
              borderRadius: '8px',
              padding: '1.2rem',
              margin: '2rem 0',
              textAlign: 'center',
            }}
          >
            <div>
              <span style={{ display: 'block', fontSize: '0.72rem', color: '#777', textTransform: 'uppercase', fontWeight: 600 }}>Categoría Deportiva</span>
              <strong style={{ fontSize: '1.05rem', color: '#111' }}>{member.categoria_ajedrez || 'Aficionado / Abierta'}</strong>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '0.72rem', color: '#777', textTransform: 'uppercase', fontWeight: 600 }}>Rating Elo</span>
              <strong style={{ fontSize: '1.05rem', color: '#111' }}>{member.elo_rating ? `${member.elo_rating} Pts` : 'En Evaluación'}</strong>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '0.72rem', color: '#777', textTransform: 'uppercase', fontWeight: 600 }}>FIDE ID</span>
              <strong style={{ fontSize: '1.05rem', color: '#111' }}>{member.fide_id || 'En Trámite'}</strong>
            </div>
          </div>

          {/* Fecha de Expedición y Código */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#666', borderBottom: '1px solid #e0d8c7', paddingBottom: '0.8rem', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <span>Expedido en Sabaneta, Antioquia a los <strong>{issueDate}</strong></span>
              <div style={{ fontSize: '0.72rem', color: '#777', marginTop: '0.2rem' }}>
                Validar autenticidad en: <a href={`/verificar?codigo=${certCode}`} target="_blank" rel="noopener noreferrer" style={{ color: '#8c7038', textDecoration: 'underline', fontWeight: 600 }}>clubcapablanca.org/verificar?codigo={certCode}</a>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#777' }}>Código de Verificación:</span>
              <strong style={{ color: '#111', fontFamily: 'monospace', fontSize: '0.95rem' }}>{certCode}</strong>
            </div>
          </div>

          {/* Firmas y Sellos */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginTop: '2rem', textAlign: 'center' }}>
            <div>
              <div style={{ borderTop: '1px solid #333', width: '80%', margin: '0 auto 0.4rem', paddingTop: '0.4rem' }}>
                <strong style={{ display: 'block', fontSize: '0.9rem', color: '#111' }}>Lic. Juan Manuel Gómez</strong>
                <span style={{ fontSize: '0.75rem', color: '#666' }}>Presidente & Representante Legal</span>
              </div>
            </div>
            <div>
              <div style={{ borderTop: '1px solid #333', width: '80%', margin: '0 auto 0.4rem', paddingTop: '0.4rem' }}>
                <strong style={{ display: 'block', fontSize: '0.9rem', color: '#111' }}>Comisión Técnica & Arbitral</strong>
                <span style={{ fontSize: '0.75rem', color: '#666' }}>Club de Ajedrez Capablanca Sabaneta</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Modal con Nota */}
        <div
          className="no-print"
          style={{
            background: '#141414',
            borderTop: '1px solid #282828',
            padding: '0.9rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.8rem',
            color: '#888',
          }}
        >
          <span>Certificado emitido con validez para convocatorias de Inder Sabaneta y Liga de Ajedrez de Antioquia.</span>
          <button type="button" onClick={onClose} className="btn btn--ghost btn--sm">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
