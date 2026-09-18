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
    <div style={{ paddingTop: 'var(--content-offset)' }}>
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
              <div style={{ background: '#e8f5e9', border: '1px solid #c8e6c9', borderRadius: '12px', padding: '2.5rem 2rem', textAlign: 'center' }}>
                <CheckCircle2 size={52} color="#2e7d32" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ color: '#2e7d32', fontSize: '1.4rem', marginBottom: '0.5rem' }}>¡Mensaje enviado con éxito!</h3>
                <p style={{ color: '#444', lineHeight: 1.6, maxWidth: '460px', margin: '0 auto' }}>
                  Hemos recibido tu solicitud sobre <strong>{formData.subject}</strong>. Nos pondremos en contacto contigo a la mayor brevedad a través de correo o WhatsApp.
                </p>
                <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1.8rem' }}>
                  <button
                    type="button"
                    onClick={() => whatsappService.openChat(`Hola Club Capablanca, acabo de enviar una consulta desde la web sobre: ${formData.subject}. Mi nombre es ${formData.name}.`)}
                    className="btn"
                    style={{
                      background: '#25D366',
                      color: '#fff',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontWeight: 600,
                      padding: '0.6rem 1.2rem',
                    }}
                  >
                    <MessageCircle size={18} />
                    <span>Confirmar por WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn--secondary btn--sm"
                    style={{ padding: '0.6rem 1.2rem' }}
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: '', email: '', phone: '', subject: 'Inscripción a Clases', message: '' });
                    }}
                  >
                    Enviar otro mensaje
                  </button>
                </div>
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

      {/* Sección Mapa Interactivo y Ubicación Oficial en Sabaneta */}
      <section className="section section--dark" style={{ borderTop: '1px solid #222', paddingBlock: '4rem' }}>
        <div className="wrap">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span className="pill pill--gold">Cómo llegar</span>
            <h2 className="display display--gold" style={{ fontSize: 'var(--step-3)', marginTop: '0.8rem' }}>
              Nuestra sede en Sabaneta
            </h2>
            <p style={{ color: '#aaa', fontSize: '1.1rem', marginTop: '0.6rem', maxWidth: '680px', marginInline: 'auto' }}>
              Centro Comercial Aves María, tercer piso. A pocos minutos del parque principal y con acceso fácil en Metro y rutas integradas.
            </p>
          </div>

          <div className="map" style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', border: '3px solid var(--gold)', background: '#111', boxShadow: 'var(--shadow-lg)' }}>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d294.8388272528983!2d-75.61803483888748!3d6.149147616430133!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e4683de5c52fae7%3A0x48c5e1c8db55276c!2sAves%20Mar%C3%ADa%20Parque%20Comercial%20P.%20H!5e0!3m2!1ses!2sco!4v1789078462103!5m2!1ses!2sco"
              title="Ubicación del Club de Ajedrez Capablanca Sabaneta en el Parque Comercial Aves María"
              style={{ display: 'block', width: '100%', height: 'clamp(320px, 45vw, 480px)', border: 0, filter: 'grayscale(0.2) contrast(1.05)' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
            <div
              className="map__pin"
              style={{
                position: 'absolute',
                zIndex: 2,
                left: '1rem',
                bottom: '1rem',
                background: 'var(--ink, #000)',
                color: '#fff',
                borderRadius: '12px',
                padding: '0.85rem 1.2rem',
                boxShadow: 'var(--shadow-md)',
                borderLeft: '5px solid var(--gold)',
                maxWidth: 'min(88%, 340px)',
              }}
            >
              <strong style={{ display: 'block', fontFamily: 'var(--ff-display)', textTransform: 'uppercase', fontSize: '0.95rem', color: 'var(--gold)' }}>
                Club Capablanca Sabaneta
              </strong>
              <span style={{ fontSize: '0.84rem', color: '#CFCFCF' }}>
                CC Aves María, tercer piso · Sabaneta, Antioquia
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: '2rem' }}>
            <a
              className="btn btn--primary"
              href="https://www.google.com/maps/search/?api=1&query=Centro+Comercial+Aves+Maria+Sabaneta+Antioquia"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <MapPin size={18} />
              <span>Abrir en Google Maps</span>
            </a>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => whatsappService.openChat('Hola, necesito indicaciones para llegar a la sede del Club Capablanca en CC Aves María.')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', borderColor: 'var(--gold)' }}
            >
              <MessageCircle size={18} />
              <span>Pedir indicaciones por WhatsApp</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
