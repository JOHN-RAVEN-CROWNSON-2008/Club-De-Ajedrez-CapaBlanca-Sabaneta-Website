import React from 'react';
import { X, Printer, ShieldCheck, QrCode, ExternalLink, Award, Copy, Check } from 'lucide-react';
import { UserProfile } from '../../types/database';

interface DigitalAthleteIdCardModalProps {
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
    usuario?: string;
  };
}

export const DigitalAthleteIdCardModal: React.FC<DigitalAthleteIdCardModalProps> = ({
  isOpen,
  onClose,
  member,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const certCode = `CAPA-${(member.id || 'MEM').slice(-6).toUpperCase()}-2026`;
  const verificationUrl = `${window.location.origin}/verificar?codigo=${certCode}`;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
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
          #print-id-card-area, #print-id-card-area * {
            visibility: visible;
          }
          #print-id-card-area {
            position: fixed;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 86mm !important;
            height: 54mm !important;
            box-shadow: none !important;
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
          maxWidth: '520px',
          background: '#141414',
          borderRadius: '18px',
          border: '1px solid #333',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header Modal */}
        <div
          className="no-print"
          style={{
            background: '#0d0d0d',
            borderBottom: '1px solid #222',
            padding: '1rem 1.4rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Award size={20} color="var(--gold)" />
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', fontWeight: 700 }}>
              Carnet Digital de Afiliado
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#888',
              cursor: 'pointer',
              padding: '0.2rem',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenido Visual del Carnet */}
        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#0a0a0a' }}>
          
          {/* Tarjeta Carnet (Formato PVC Deportivo) */}
          <div
            id="print-id-card-area"
            style={{
              width: '100%',
              maxWidth: '430px',
              aspectRatio: '1.586', // Proporción ISO/IEC 7810 ID-1 (tarjeta)
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #1f1a10 0%, #0c0c0c 45%, #18150d 100%)',
              border: '2px solid #d4af37',
              boxShadow: '0 15px 35px rgba(0,0,0,0.7), inset 0 0 15px rgba(212,175,55,0.15)',
              position: 'relative',
              overflow: 'hidden',
              padding: '1.25rem 1.4rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              color: '#fff',
            }}
          >
            {/* Holograma / Decoración de fondo */}
            <div
              style={{
                position: 'absolute',
                right: '-20px',
                bottom: '-25px',
                fontSize: '11rem',
                opacity: 0.05,
                fontWeight: 900,
                pointerEvents: 'none',
                userSelect: 'none',
                color: '#d4af37',
              }}
            >
              ♞
            </div>

            {/* Encabezado del Carnet */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(212,175,55,0.3)', paddingBottom: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <img
                  src="/assets/img/logo-capablanca.png"
                  alt="Logo"
                  style={{ width: '32px', height: '32px', objectFit: 'contain' }}
                  onError={(e) => {
                    // Fallback si la imagen no carga
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 900, letterSpacing: '1px', color: '#d4af37', textTransform: 'uppercase' }}>
                    Club Capablanca
                  </div>
                  <div style={{ fontSize: '0.58rem', color: '#bbb', letterSpacing: '0.5px' }}>
                    SABANETA · ANTIOQUIA
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.55rem', background: '#d4af37', color: '#000', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '4px', textTransform: 'uppercase' }}>
                  VIGENCIA 2026
                </span>
              </div>
            </div>

            {/* Centro: Foto/Inicial + Datos del Deportista */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', margin: '0.4rem 0' }}>
              {/* Avatar circular con borde dorado */}
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #d4af37 0%, #aa8010 100%)',
                  color: '#000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '1.6rem',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                  flexShrink: 0,
                  border: '2px solid #fff',
                }}
              >
                {member.nombre.charAt(0).toUpperCase()}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {member.nombre} {member.apellido}
                </h4>
                <div style={{ fontSize: '0.7rem', color: '#d4af37', fontWeight: 700, textTransform: 'uppercase', marginTop: '0.1rem' }}>
                  {member.categoria_ajedrez || 'Iniciación / Abierta'}
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.35rem', fontSize: '0.68rem', color: '#ccc' }}>
                  <div>
                    <span style={{ color: '#888', display: 'block', fontSize: '0.55rem' }}>ELO CLUB</span>
                    <strong style={{ color: '#fff', fontSize: '0.8rem' }}>{member.elo_rating || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#888', display: 'block', fontSize: '0.55rem' }}>FIDE ID</span>
                    <strong style={{ color: '#fff', fontSize: '0.8rem' }}>{member.fide_id || 'En trámite'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#888', display: 'block', fontSize: '0.55rem' }}>ESTADO</span>
                    <strong style={{ color: '#81c784', fontSize: '0.8rem' }}>Activo</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Pie del Carnet: Código de Verificación y Micro-QR */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.45rem' }}>
              <div>
                <span style={{ fontSize: '0.55rem', color: '#777', display: 'block' }}>CÓDIGO OFICIAL</span>
                <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: '#d4af37', fontWeight: 700 }}>
                  {certCode}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.6rem', color: '#aaa' }}>
                <ShieldCheck size={14} color="#d4af37" />
                <span>Res. 042 Inder Sabaneta</span>
              </div>
            </div>
          </div>

          {/* Acciones del Modal */}
          <div className="no-print" style={{ width: '100%', maxWidth: '430px', marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <button
                type="button"
                onClick={handlePrint}
                className="btn btn--primary"
                style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 700 }}
              >
                <Printer size={16} />
                <span>Imprimir Carnet</span>
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                className="btn btn--ghost"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                title="Copiar enlace de validación pública"
              >
                {copied ? <Check size={15} color="#81c784" /> : <Copy size={15} />}
                <span>{copied ? 'Copiado' : 'Link'}</span>
              </button>
            </div>

            <a
              href={`/verificar?codigo=${certCode}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                textAlign: 'center',
                fontSize: '0.78rem',
                color: 'var(--gold)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.3rem',
                padding: '0.4rem',
              }}
            >
              <span>Verificar autenticidad de esta credencial</span>
              <ExternalLink size={12} />
            </a>
          </div>

        </div>
      </div>
    </div>
  );
};
