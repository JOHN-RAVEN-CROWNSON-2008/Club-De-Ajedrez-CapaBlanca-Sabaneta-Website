import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { resendService } from '../../services/resendService';
import { whatsappService } from '../../services/whatsappService';
import { MapPin, Phone, MessageCircle, Send, CheckCircle2, Clock } from 'lucide-react';

export const ContactView: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'Inscripción a Clases',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSupabaseConfigured()) {
        await supabase.from('contact_messages').insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          subject: formData.subject,
          message: formData.message,
          status: 'unread',
        });
      }

      // Enviar correo de notificación a directivas vía Resend
      await resendService.sendEmail({
        to: 'notificaciones@ajedrezcapablanca.com',
        subject: `Nuevo mensaje de contacto: ${formData.name} - ${formData.subject}`,
        html: `
          <h3>Nuevo contacto desde el sitio web</h3>
          <p><strong>Nombre:</strong> ${formData.name}</p>
          <p><strong>Correo:</strong> ${formData.email}</p>
          <p><strong>Teléfono:</strong> ${formData.phone}</p>
          <p><strong>Asunto:</strong> ${formData.subject}</p>
          <p><strong>Mensaje:</strong></p>
          <p>${formData.message}</p>
        `,
      });

      setSubmitted(true);
    } catch (err) {
      console.error('Error al enviar formulario:', err);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ paddingTop: 'calc(var(--header-h) + 2rem)' }}>
      {/* Cabecera */}
      <section className="section section--dark" style={{ textAlign: 'center', paddingBlock: '3rem' }}>
        <div className="wrap-narrow">
          <span className="pill pill--gold">Atención & Matrículas</span>
          <h1 className="display display--gold" style={{ fontSize: 'var(--step-4)', marginTop: '1rem' }}>
            Contacto & Inscripciones
          </h1>
          <p style={{ color: '#ccc', fontSize: '1.2rem', marginTop: '1rem', lineHeight: 1.6 }}>
            Estamos listos para orientarte y resolver cualquier duda sobre nuestras clases y torneos.
          </p>
        </div>
      </section>

      <section className="section" style={{ background: '#fff', color: '#111' }}>
        <div className="wrap" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3.5rem' }}>
          
          {/* Formulario */}
          <div>
            <span className="kicker" style={{ color: 'var(--gold-deep)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.85rem' }}>
              Escríbenos directamente
            </span>
            <h2 className="display display--ink" style={{ fontSize: 'var(--step-3)', margin: '0.5rem 0 1.5rem' }}>
              Envíanos un mensaje
            </h2>

            {submitted ? (
              <div style={{ background: '#e8f5e9', border: '1px solid #c8e6c9', borderRadius: '12px', padding: '2rem', textAlign: 'center' }}>
                <CheckCircle2 size={48} color="#2e7d32" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ color: '#2e7d32', marginBottom: '0.5rem' }}>¡Mensaje enviado con éxito!</h3>
                <p style={{ color: '#444' }}>
                  Nos pondremos en contacto contigo a la brevedad a través de correo o WhatsApp.
                </p>
                <button
                  type="button"
                  className="btn btn--primary btn--sm"
                  style={{ marginTop: '1.5rem' }}
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ name: '', email: '', phone: '', subject: 'Inscripción a Clases', message: '' });
                  }}
                >
                  Enviar otro mensaje
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid #ccc' }}
                    placeholder="Ej. Juan Pérez"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                      Correo electrónico *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid #ccc' }}
                      placeholder="tu@correo.com"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                      Teléfono / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid #ccc' }}
                      placeholder="300 123 4567"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                    Motivo de consulta
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid #ccc', background: '#fff' }}
                  >
                    <option value="Inscripción a Clases">Inscripción a Clases de Ajedrez</option>
                    <option value="Clase de Prueba">Agendar Clase Diagnóstica / Prueba</option>
                    <option value="Información de Torneos">Información de Próximos Torneos</option>
                    <option value="Afiliación Oficial">Afiliación al Club Deportivo</option>
                    <option value="Otro">Otro asunto</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                    Mensaje o detalles *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid #ccc' }}
                    placeholder="Cuéntanos la edad del alumno, si tiene conocimientos previos o la duda que desees resolver..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn--primary"
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}
                >
                  <Send size={18} />
                  <span>{loading ? 'Enviando...' : 'Enviar mensaje'}</span>
                </button>
              </form>
            )}
          </div>

          {/* Información y WhatsApp */}
          <div style={{ background: '#fafafa', padding: '2.5rem', borderRadius: '16px', border: '1px solid #e5e5e5', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem', color: '#111' }}>
                Canales de Atención Directa
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <MapPin size={24} color="#D32F2F" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <h4 style={{ fontWeight: 700, color: '#111', marginBottom: '0.2rem' }}>Sede Oficial</h4>
                    <p style={{ color: '#555', fontSize: '0.95rem' }}>
                      CC Aves María, tercer piso<br />Sabaneta, Antioquia, Colombia
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <Clock size={24} color="var(--gold-deep)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <h4 style={{ fontWeight: 700, color: '#111', marginBottom: '0.2rem' }}>Horario de Atención</h4>
                    <p style={{ color: '#555', fontSize: '0.95rem' }}>
                      Lunes a Viernes: 2:00 PM - 8:00 PM<br />Sábados: 9:00 AM - 6:00 PM
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <Phone size={24} color="#000" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <h4 style={{ fontWeight: 700, color: '#111', marginBottom: '0.2rem' }}>Línea Telefónica</h4>
                    <p style={{ color: '#555', fontSize: '0.95rem' }}>
                      <a href="tel:+573002545835" style={{ color: '#000', fontWeight: 600 }}>+57 300 254 5835</a>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid #e0e0e0' }}>
              <p style={{ fontSize: '0.95rem', color: '#444', marginBottom: '1rem' }}>
                ¿Prefieres respuesta inmediata por WhatsApp? Haz clic a continuación:
              </p>
              <button
                type="button"
                onClick={() => whatsappService.openChat('Hola, quiero inscribirme en el Club de Ajedrez Capablanca Sabaneta.')}
                className="btn"
                style={{
                  width: '100%',
                  background: '#25D366',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.6rem',
                  fontWeight: 700,
                }}
              >
                <MessageCircle size={20} />
                <span>Conversar por WhatsApp</span>
              </button>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
};
