import React, { useState } from 'react';
import { X, Trophy, Calendar, Clock, MapPin, CheckCircle2, MessageCircle, Printer, ShieldCheck, User, Mail, Phone, Award } from 'lucide-react';
import { ClubEvent } from '../../types/database';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { FileUploadField } from './FileUploadField';

interface TournamentRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: ClubEvent;
  onRegisteredSuccess?: (registrationData: any) => void;
}

export const TournamentRegistrationModal: React.FC<TournamentRegistrationModalProps> = ({
  isOpen,
  onClose,
  event,
  onRegisteredSuccess,
}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    docType: 'CC',
    docNumber: '',
    phone: '',
    email: '',
    clubOrCity: 'Sabaneta',
    eloRating: '',
    fideId: '',
    category: event.category || 'Categoría Abierta',
    paymentReceiptUrl: '',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState<null | {
    regCode: string;
    date: string;
  }>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const hashSeed = formData.fullName + event.id + Date.now().toString();
    const hash = Math.abs(
      hashSeed.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0)
    ).toString(16).toUpperCase().padStart(6, '0');
    const regCode = `PRE-CAPA-${hash}-2026`;
    const issueDate = new Date().toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const payload = {
      event_id: event.id,
      notes: JSON.stringify({
        regCode,
        fullName: formData.fullName,
        doc: `${formData.docType} ${formData.docNumber}`,
        phone: formData.phone,
        email: formData.email,
        clubOrCity: formData.clubOrCity,
        eloRating: formData.eloRating || 1500,
        fideId: formData.fideId,
        category: formData.category,
        paymentReceiptUrl: formData.paymentReceiptUrl,
        additionalNotes: formData.notes,
      }),
      status: 'pending',
    };

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('tournament_registrations').insert({
          event_id: event.id,
          notes: payload.notes,
          status: 'pending',
        });
      } catch (err) {
        console.warn('Nota: Guardado local de preinscripción (Supabase no conectado o RLS activo):', err);
      }
    }

    setRegistrationSuccess({
      regCode,
      date: issueDate,
    });

    if (onRegisteredSuccess) {
      onRegisteredSuccess({ ...formData, regCode });
    }

    setIsSubmitting(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const getWhatsAppUrl = () => {
    if (!registrationSuccess) return '#';
    const text = encodeURIComponent(
      `¡Hola, Club Capablanca Sabaneta! Acabo de registrar mi preinscripción oficial al torneo: "${event.title}".\n\n` +
      `Código de Radicado: ${registrationSuccess.regCode}\n` +
      `Deportista: ${formData.fullName}\n` +
      `Documento: ${formData.docType} ${formData.docNumber}\n` +
      `Elo / FIDE: ${formData.eloRating || 'Aficionado'} / ${formData.fideId || 'Sin ID'}\n` +
      `Teléfono: ${formData.phone}\n\n` +
      `Agradezco confirmar mi cupo en la nómina de la sala de juego.`
    );
    return `https://wa.me/573002545835?text=${text}`;
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          backgroundColor: '#131313',
          border: '1px solid #282828',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
          color: '#fff',
          overflow: 'hidden',
        }}
      >
        {/* Cabecera */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #222',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#181818',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(212, 160, 23, 0.12)',
                border: '1px solid var(--gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Trophy size={20} color="var(--gold)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--gold)' }}>
                Preinscripción Oficial a Torneo
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#888', margin: '0.2rem 0 0' }}>
                {event.title} · {event.rhythm}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#888',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '6px',
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Contenido con Scroll */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {!registrationSuccess ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              
              {/* Tarjeta de Resumen del Torneo */}
              <div
                style={{
                  background: '#181818',
                  border: '1px solid #2a2a2a',
                  borderRadius: '10px',
                  padding: '1rem',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: '0.8rem',
                  fontSize: '0.85rem',
                  color: '#ccc',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={16} color="var(--gold)" />
                  <span><strong>Fecha:</strong> {event.event_date}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={16} color="var(--gold)" />
                  <span><strong>Hora:</strong> {event.event_time}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={16} color="var(--gold)" />
                  <span>{event.location || 'CC Aves María, Sabaneta'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={16} color="var(--gold)" />
                  <span><strong>Inscripción:</strong> {event.entry_fee}</span>
                </div>
              </div>

              {/* Datos Personales */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--gold)', margin: '0.5rem 0 0.2rem' }}>
                  1. Datos del Deportista
                </h3>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '0.3rem' }}>
                    Nombre y Apellidos Completos *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Juan Pablo Vélez Restrepo"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      background: '#1d1d1d',
                      border: '1px solid #333',
                      color: '#fff',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.8rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '0.3rem' }}>
                      Tipo Doc.
                    </label>
                    <select
                      value={formData.docType}
                      onChange={(e) => setFormData({ ...formData, docType: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        background: '#1d1d1d',
                        border: '1px solid #333',
                        color: '#fff',
                        fontSize: '0.9rem',
                      }}
                    >
                      <option value="TI">T.I.</option>
                      <option value="CC">C.C.</option>
                      <option value="RC">R.C.</option>
                      <option value="CE">C.E.</option>
                      <option value="PAS">Pasaporte</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '0.3rem' }}>
                      Número de Documento *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. 1017234567"
                      value={formData.docNumber}
                      onChange={(e) => setFormData({ ...formData, docNumber: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        background: '#1d1d1d',
                        border: '1px solid #333',
                        color: '#fff',
                        fontSize: '0.9rem',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '0.3rem' }}>
                      Teléfono / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+57 300 000 0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        background: '#1d1d1d',
                        border: '1px solid #333',
                        color: '#fff',
                        fontSize: '0.9rem',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '0.3rem' }}>
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="deportista@ejemplo.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        background: '#1d1d1d',
                        border: '1px solid #333',
                        color: '#fff',
                        fontSize: '0.9rem',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Ficha Deportiva */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--gold)', margin: '0.5rem 0 0.2rem' }}>
                  2. Ficha Deportiva & Categoría
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.8rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '0.3rem' }}>
                      Club o Municipio
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Capablanca / Sabaneta"
                      value={formData.clubOrCity}
                      onChange={(e) => setFormData({ ...formData, clubOrCity: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        background: '#1d1d1d',
                        border: '1px solid #333',
                        color: '#fff',
                        fontSize: '0.9rem',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '0.3rem' }}>
                      Elo Rating (Nacional/FIDE)
                    </label>
                    <input
                      type="number"
                      placeholder="Ej. 1540 (opcional)"
                      value={formData.eloRating}
                      onChange={(e) => setFormData({ ...formData, eloRating: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        background: '#1d1d1d',
                        border: '1px solid #333',
                        color: '#fff',
                        fontSize: '0.9rem',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '0.3rem' }}>
                      ID FIDE (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. 4452190"
                      value={formData.fideId}
                      onChange={(e) => setFormData({ ...formData, fideId: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        background: '#1d1d1d',
                        border: '1px solid #333',
                        color: '#fff',
                        fontSize: '0.9rem',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '0.3rem' }}>
                    Comprobante de Pago (Opcional - Bancolombia, Nequi, Daviplata)
                  </label>
                  <FileUploadField
                    bucket="payment-receipts"
                    mode="private"
                    ownerId="tournament-pre-regs"
                    accept="image/*,.pdf"
                    label="Adjuntar comprobante de pago"
                    onUploaded={(path) => setFormData({ ...formData, paymentReceiptUrl: path })}
                  />
                  {formData.paymentReceiptUrl && (
                    <span style={{ display: 'block', marginTop: '0.35rem', fontSize: '0.78rem', color: '#81c784' }}>
                      ✓ Comprobante adjuntado con éxito
                    </span>
                  )}
                </div>
              </div>

              {/* Botón de Envío */}
              <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.8rem' }}>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn--ghost btn--sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn--primary btn--sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
                >
                  <CheckCircle2 size={16} />
                  <span>{isSubmitting ? 'Radicando...' : 'Completar Preinscripción'}</span>
                </button>
              </div>

            </form>
          ) : (
            /* Pantalla de Confirmación de Radicado Exitoso */
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(46, 125, 50, 0.15)',
                  border: '2px solid #4caf50',
                  color: '#4caf50',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.2rem',
                }}
              >
                <CheckCircle2 size={36} />
              </div>

              <span style={{ fontSize: '0.8rem', color: '#81c784', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                ¡Preinscripción Radicada Exitosamente!
              </span>

              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: '0.4rem 0 1rem' }}>
                {formData.fullName}
              </h3>

              <div
                style={{
                  background: '#181818',
                  border: '2px dashed var(--gold)',
                  borderRadius: '12px',
                  padding: '1.2rem',
                  maxWidth: '440px',
                  margin: '0 auto 1.5rem',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>
                  Código Oficial de Radicado
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--gold)', fontFamily: 'monospace', marginTop: '0.3rem' }}>
                  {registrationSuccess.regCode}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#aaa', marginTop: '0.5rem' }}>
                  Torneo: <strong>{event.title}</strong>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#aaa', marginTop: '0.2rem' }}>
                  Fecha: {event.event_date} · Sede Aves María, Sabaneta
                </div>
              </div>

              <p style={{ color: '#bbb', fontSize: '0.9rem', maxWidth: '480px', margin: '0 auto 1.8rem', lineHeight: 1.6 }}>
                Tu solicitud ha quedado asentada en la nómina técnica del torneo. Para confirmar tu cupo prioritario, envía el comprobante directamente a la dirección del torneo por WhatsApp.
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                <a
                  href={getWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--primary btn--sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
                >
                  <MessageCircle size={16} />
                  <span>Confirmar por WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="btn btn--ghost btn--sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Printer size={16} />
                  <span>Imprimir Comprobante</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn--ghost btn--sm"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pie */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #222',
            background: '#161616',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.78rem',
            color: '#777',
          }}
        >
          <span>Reconocimiento Deportivo Inder Sabaneta Res. 042</span>
          <span>NIT 901.445.892-1</span>
        </div>

      </div>
    </div>
  );
};
