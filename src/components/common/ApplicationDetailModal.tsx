import React, { useState } from 'react';
import {
  X, Printer, MessageCircle, UserX, UserCheck, ShieldCheck,
  Calendar, User
} from 'lucide-react';
import { MembershipApplication, ApplicationStatus } from '../../types/database';
import { whatsappService } from '../../services/whatsappService';

interface ApplicationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: MembershipApplication;
  onApprove: (app: MembershipApplication) => void;
  onUpdateStatus: (appId: string, newStatus: ApplicationStatus) => void;
}

export const ApplicationDetailModal: React.FC<ApplicationDetailModalProps> = ({
  isOpen,
  onClose,
  application,
  onApprove,
  onUpdateStatus,
}) => {
  const [sessionDate, setSessionDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7)); // Próximo sábado
    return d.toISOString().split('T')[0];
  });
  const [sessionTime, setSessionTime] = useState<string>('10:00 AM');
  const [instructor, setInstructor] = useState<string>('Prof. Andrés Montoya');
  const [activeTab, setActiveTab] = useState<'dossier' | 'schedule'>('dossier');

  if (!isOpen) return null;

  const fullName = `${application.applicant_name} ${application.applicant_lastname}`.trim();
  const radicadoMatch = (application.notes || '').match(/SOL-CAPA-\d+-2026/);
  const radicadoCode = radicadoMatch ? radicadoMatch[0] : `SOL-CAPA-${application.id.slice(0, 6).toUpperCase()}-2026`;

  const handlePrint = () => {
    window.print();
  };

  const handleSendDiagnosticInvite = () => {
    const phone = application.guardian_phone || application.phone;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const fullPhone = cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone}`;

    const dateFormatted = new Date(`${sessionDate}T12:00:00`).toLocaleDateString('es-CO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

    const msg =
      `¡Hola ${fullName}! ♟️\n\n` +
      `Te saludamos cordialmente desde la Comisión Técnica del Club Deportivo de Ajedrez Capablanca Sabaneta.\n\n` +
      `Hemos revisado tu solicitud de afiliación (${radicadoCode}) para la categoría "${application.desired_category}". Nos alegra mucho tu interés en formar parte de nuestro club.\n\n` +
      `Te hemos agendado para tu CLASE DIAGNÓSTICA Y EVALUACIÓN DE NIVEL:\n` +
      `📅 Fecha: ${dateFormatted}\n` +
      `⏰ Hora: ${sessionTime}\n` +
      `📍 Sede: Centro Comercial Aves María, Sabaneta (Piso 3, salón de ajedrez)\n` +
      `👨‍🏫 Entrenador: ${instructor}\n\n` +
      `La sesión es sin costo. No requieres traer tablero ni piezas, nosotros te suministramos todo el material de competencia. Por favor confírmanos tu asistencia respondiendo a este mensaje.\n\n` +
      `¡Te esperamos para compartir una excelente jornada de ajedrez!`;

    whatsappService.openChat(msg, fullPhone);

    if (application.status === 'pending') {
      onUpdateStatus(application.id, 'contacted');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #application-print-dossier, #application-print-dossier * {
            visibility: visible !important;
          }
          #application-print-dossier {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            color: black !important;
            padding: 20mm !important;
            box-shadow: none !important;
            font-family: Arial, sans-serif !important;
          }
        }
      `}</style>

      <div
        style={{
          backgroundColor: '#131313',
          border: '1px solid #282828',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '750px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.7)',
        }}
      >
        {/* Cabecera del Modal */}
        <div
          style={{
            padding: '1.2rem 1.5rem',
            borderBottom: '1px solid #222',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#181818',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: 'rgba(212, 175, 55, 0.15)',
                border: '1px solid var(--gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--gold)',
              }}
            >
              <ShieldCheck size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff', fontWeight: 700 }}>
                  Expediente de Solicitud de Admisión
                </h3>
                <span
                  style={{
                    padding: '0.15rem 0.5rem',
                    borderRadius: '50px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    background:
                      application.status === 'approved' ? 'rgba(34,197,94,0.15)' :
                      application.status === 'contacted' ? 'rgba(59,130,246,0.15)' :
                      application.status === 'rejected' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                    color:
                      application.status === 'approved' ? '#4ade80' :
                      application.status === 'contacted' ? '#60a5fa' :
                      application.status === 'rejected' ? '#f87171' : '#fbbf24',
                    border: `1px solid ${
                      application.status === 'approved' ? '#15803d' :
                      application.status === 'contacted' ? '#1d4ed8' :
                      application.status === 'rejected' ? '#b91c1c' : '#b45309'
                    }`,
                  }}
                >
                  {application.status === 'approved' ? 'Aprobada' :
                   application.status === 'contacted' ? 'Contactada' :
                   application.status === 'rejected' ? 'Rechazada' : 'Pendiente'}
                </span>
              </div>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--gold)' }}>
                {radicadoCode} · Registrada el {new Date(application.created_at).toLocaleDateString('es-CO')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#888',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Pestañas de Navegación del Modal */}
        <div
          style={{
            display: 'flex',
            background: '#161616',
            borderBottom: '1px solid #222',
            padding: '0 1.5rem',
            gap: '1.5rem',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('dossier')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'dossier' ? '2px solid var(--gold)' : '2px solid transparent',
              color: activeTab === 'dossier' ? 'var(--gold)' : '#888',
              padding: '0.75rem 0',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <User size={15} />
            <span>Ficha del Aspirante</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'schedule' ? '2px solid var(--gold)' : '2px solid transparent',
              color: activeTab === 'schedule' ? 'var(--gold)' : '#888',
              padding: '0.75rem 0',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <Calendar size={15} />
            <span>Agendar Clase Diagnóstica</span>
          </button>
        </div>

        {/* Cuerpo del Modal con scroll */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {activeTab === 'dossier' && (
            <div>
              {/* Resumen del Atleta */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1.5rem',
                }}
              >
                <div style={{ background: '#181818', border: '1px solid #282828', borderRadius: '10px', padding: '1rem' }}>
                  <div style={{ color: '#888', fontSize: '0.75rem', textTransform: 'uppercase' }}>Nombre Completo</div>
                  <div style={{ color: '#fff', fontSize: '1rem', fontWeight: 700, marginTop: '0.2rem' }}>{fullName}</div>
                  <div style={{ color: 'var(--gold)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                    {application.doc_type} {application.doc_number}
                  </div>
                </div>

                <div style={{ background: '#181818', border: '1px solid #282828', borderRadius: '10px', padding: '1rem' }}>
                  <div style={{ color: '#888', fontSize: '0.75rem', textTransform: 'uppercase' }}>Programa & Nivel</div>
                  <div style={{ color: 'var(--gold)', fontSize: '1rem', fontWeight: 700, marginTop: '0.2rem' }}>
                    {application.desired_category}
                  </div>
                  <div style={{ color: '#ccc', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                    Elo Estimado: <strong style={{ color: '#fff' }}>{application.approximate_elo || 'Iniciación'}</strong>
                  </div>
                </div>

                <div style={{ background: '#181818', border: '1px solid #282828', borderRadius: '10px', padding: '1rem' }}>
                  <div style={{ color: '#888', fontSize: '0.75rem', textTransform: 'uppercase' }}>Ubicación & Salud</div>
                  <div style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 600, marginTop: '0.2rem' }}>
                    {application.municipality}
                  </div>
                  <div style={{ color: '#aaa', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                    EPS: {application.health_provider || 'Particular'} · Edad: {application.age ? `${application.age} años` : 'N/D'}
                  </div>
                </div>
              </div>

              {/* Datos de Contacto */}
              <div style={{ background: '#181818', border: '1px solid #282828', borderRadius: '10px', padding: '1.2rem', marginBottom: '1.5rem' }}>
                <h4 style={{ color: 'var(--gold)', margin: '0 0 0.8rem', fontSize: '0.88rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Canales de Contacto Directo
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: '#888' }}>Teléfono / Móvil: </span>
                    <strong style={{ color: '#fff' }}>{application.phone}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#888' }}>Correo Electrónico: </span>
                    <strong style={{ color: '#fff' }}>{application.email}</strong>
                  </div>
                  {application.guardian_name && (
                    <>
                      <div>
                        <span style={{ color: '#888' }}>Acudiente: </span>
                        <strong style={{ color: '#93c5fd' }}>{application.guardian_name}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#888' }}>Teléfono Acudiente: </span>
                        <strong style={{ color: '#93c5fd' }}>{application.guardian_phone || 'N/A'}</strong>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Observaciones o Motivación */}
              {application.notes && (
                <div style={{ background: '#181818', border: '1px solid #282828', borderRadius: '10px', padding: '1.2rem', marginBottom: '1.5rem' }}>
                  <h4 style={{ color: '#aaa', margin: '0 0 0.5rem', fontSize: '0.82rem', textTransform: 'uppercase' }}>
                    Motivación & Observaciones del Aspirante
                  </h4>
                  <p style={{ margin: 0, color: '#ddd', fontSize: '0.88rem', fontStyle: 'italic', lineHeight: 1.5 }}>
                    "{application.notes}"
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'schedule' && (
            <div>
              <div style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                <Calendar size={24} color="var(--gold)" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '0.85rem', color: '#ccc' }}>
                  Configura los detalles de la clase diagnóstica de ajedrez. Al hacer clic en enviar, se abrirá WhatsApp con una invitación formal estructurada y la solicitud pasará a estado <strong>Contactada</strong>.
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', color: '#aaa', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                    Fecha de la Clase Diagnóstica
                  </label>
                  <input
                    type="date"
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: '#1a1a1a', border: '1px solid #333', color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: '#aaa', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                    Horario de Atención
                  </label>
                  <select
                    value={sessionTime}
                    onChange={(e) => setSessionTime(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: '#1a1a1a', border: '1px solid #333', color: '#fff', fontSize: '0.85rem' }}
                  >
                    <option value="09:00 AM">Sábado 09:00 AM - 10:30 AM (Iniciación)</option>
                    <option value="10:00 AM">Sábado 10:00 AM - 11:30 AM (Infantil)</option>
                    <option value="02:00 PM">Sábado 02:00 PM - 03:30 PM (Juvenil)</option>
                    <option value="04:00 PM">Martes / Jueves 04:00 PM - 05:30 PM (Semillero)</option>
                    <option value="06:00 PM">Miércoles / Viernes 06:00 PM - 07:30 PM (Avanzado)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', color: '#aaa', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                    Entrenador / Evaluador Asignado
                  </label>
                  <input
                    type="text"
                    value={instructor}
                    onChange={(e) => setInstructor(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: '#1a1a1a', border: '1px solid #333', color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: '#aaa', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                    Lugar de Evaluación
                  </label>
                  <input
                    type="text"
                    disabled
                    value="Sede CC Aves María, Sabaneta (Piso 3)"
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: '#111', border: '1px solid #252525', color: '#888', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <button
                  type="button"
                  onClick={handleSendDiagnosticInvite}
                  className="btn btn--primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.4rem' }}
                >
                  <MessageCircle size={16} />
                  <span>Enviar Convocatoria Oficial por WhatsApp</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Barra de Acciones Inferior */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #222',
            background: '#161616',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.8rem',
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={handlePrint}
              className="btn btn--sm"
              style={{ background: '#222', color: '#fff', border: '1px solid #333', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              title="Imprimir expediente y ficha de evaluación para el archivo físico"
            >
              <Printer size={14} />
              <span>Imprimir Ficha</span>
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem' }}>
            {application.status !== 'approved' && (
              <button
                type="button"
                onClick={() => {
                  onApprove(application);
                  onClose();
                }}
                className="btn btn--sm btn--primary"
                style={{ background: '#16a34a', borderColor: '#15803d', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <UserCheck size={14} />
                <span>Aprobar e Incorporar al Club</span>
              </button>
            )}

            {application.status !== 'rejected' && (
              <button
                type="button"
                onClick={() => {
                  onUpdateStatus(application.id, 'rejected');
                  onClose();
                }}
                className="btn btn--sm"
                style={{ background: '#281515', color: '#ef5350', border: '1px solid #c62828', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <UserX size={14} />
                <span>Rechazar / Archivar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Formato Oculto para Impresión Físico-Arbitral Oficial */}
      <div id="application-print-dossier" style={{ display: 'none' }}>
        <div style={{ borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '20px', textAlign: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '18pt' }}>CLUB DEPORTIVO DE AJEDREZ CAPABLANCA SABANETA</h2>
          <p style={{ margin: '4px 0', fontSize: '10pt', color: '#555' }}>
            NIT 901.445.892-1 · Reconocimiento Deportivo Resolución 042 Inder Sabaneta
          </p>
          <h3 style={{ margin: '8px 0 0', fontSize: '14pt', textDecoration: 'underline' }}>
            FICHA OFICIAL DE ADMISIÓN Y EVALUACIÓN DIAGNÓSTICA
          </h3>
          <p style={{ margin: '4px 0', fontSize: '10pt', fontWeight: 'bold' }}>Radicado: {radicadoCode}</p>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '10pt' }}>
          <tbody>
            <tr>
              <td style={{ padding: '6px', border: '1px solid #999', width: '30%', fontWeight: 'bold' }}>Nombre Completo:</td>
              <td style={{ padding: '6px', border: '1px solid #999' }}>{fullName}</td>
            </tr>
            <tr>
              <td style={{ padding: '6px', border: '1px solid #999', fontWeight: 'bold' }}>Documento:</td>
              <td style={{ padding: '6px', border: '1px solid #999' }}>{application.doc_type} {application.doc_number}</td>
            </tr>
            <tr>
              <td style={{ padding: '6px', border: '1px solid #999', fontWeight: 'bold' }}>Edad / EPS:</td>
              <td style={{ padding: '6px', border: '1px solid #999' }}>{application.age ? `${application.age} años` : 'N/D'} · {application.health_provider || 'Particular'}</td>
            </tr>
            <tr>
              <td style={{ padding: '6px', border: '1px solid #999', fontWeight: 'bold' }}>Municipio de Residencia:</td>
              <td style={{ padding: '6px', border: '1px solid #999' }}>{application.municipality}</td>
            </tr>
            <tr>
              <td style={{ padding: '6px', border: '1px solid #999', fontWeight: 'bold' }}>Teléfono / Correo:</td>
              <td style={{ padding: '6px', border: '1px solid #999' }}>{application.phone} · {application.email}</td>
            </tr>
            {application.guardian_name && (
              <tr>
                <td style={{ padding: '6px', border: '1px solid #999', fontWeight: 'bold' }}>Acudiente Responsable:</td>
                <td style={{ padding: '6px', border: '1px solid #999' }}>{application.guardian_name} ({application.guardian_phone || 'Sin tel.'})</td>
              </tr>
            )}
            <tr>
              <td style={{ padding: '6px', border: '1px solid #999', fontWeight: 'bold' }}>Categoría Solicitada:</td>
              <td style={{ padding: '6px', border: '1px solid #999' }}>{application.desired_category} (Elo estimado: {application.approximate_elo || 0})</td>
            </tr>
          </tbody>
        </table>

        <div style={{ border: '1px solid #000', padding: '15px', marginBottom: '25px' }}>
          <h4 style={{ margin: '0 0 10px', fontSize: '11pt', textTransform: 'uppercase' }}>
            CRITERIOS DE EVALUACIÓN TÉCNICA (Uso exclusivo de la Comisión Técnica)
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '9pt' }}>
            <div>[ ] Manejo de aperturas y desarrollo de piezas</div>
            <div>[ ] Cálculo táctico básico y combinaciones</div>
            <div>[ ] Comprensión de finales elementales</div>
            <div>[ ] Uso del reloj y anotación en planilla FIDE</div>
            <div>[ ] Espíritu deportivo y disciplina de sala</div>
            <div>[ ] Compromiso con la delegación deportiva</div>
          </div>
          <div style={{ marginTop: '15px', height: '60px', borderBottom: '1px dashed #999' }}>
            <strong>Observaciones del Entrenador:</strong>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '40px', textAlign: 'center' }}>
          <div style={{ borderTop: '1px solid #000', width: '220px', paddingTop: '5px', fontSize: '9pt' }}>
            Firma del Aspirante / Acudiente
          </div>
          <div style={{ borderTop: '1px solid #000', width: '220px', paddingTop: '5px', fontSize: '9pt' }}>
            Firma Entrenador Evaluador
          </div>
        </div>
      </div>
    </div>
  );
};
