import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { resendService } from '../../services/resendService';
import { whatsappService } from '../../services/whatsappService';
import { 
  UserCheck, 
  Award, 
  CheckCircle2, 
  Send, 
  Phone, 
  ShieldCheck, 
  HeartHandshake,
  Download
} from 'lucide-react';
import { DocType, ApplicationStatus } from '../../types/database';

export const MembershipApplicationView: React.FC = () => {
  const [formData, setFormData] = useState({
    applicant_name: '',
    applicant_lastname: '',
    doc_type: 'TI' as DocType,
    doc_number: '',
    birth_date: '',
    age: '',
    email: '',
    phone: '',
    municipality: 'Sabaneta',
    desired_category: 'Iniciación Infantil (4 a 8 años)',
    approximate_elo: '0',
    guardian_name: '',
    guardian_phone: '',
    health_provider: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [applicationCode, setApplicationCode] = useState('');

  // Auto-calcular edad si se selecciona fecha de nacimiento
  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const bdate = e.target.value;
    let calculatedAge = '';
    if (bdate) {
      const birth = new Date(bdate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      calculatedAge = age >= 0 ? age.toString() : '';
    }
    setFormData(prev => ({
      ...prev,
      birth_date: bdate,
      age: calculatedAge
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const generatedCode = `SOL-CAPA-${Math.floor(100000 + Math.random() * 900000)}-2026`;

    try {
      const applicationPayload = {
        applicant_name: formData.applicant_name.trim(),
        applicant_lastname: formData.applicant_lastname.trim(),
        doc_type: formData.doc_type,
        doc_number: formData.doc_number.trim(),
        birth_date: formData.birth_date || null,
        age: formData.age ? parseInt(formData.age, 10) : null,
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        municipality: formData.municipality.trim(),
        desired_category: formData.desired_category,
        approximate_elo: formData.approximate_elo ? parseInt(formData.approximate_elo, 10) : 0,
        guardian_name: formData.guardian_name.trim() || null,
        guardian_phone: formData.guardian_phone.trim() || null,
        health_provider: formData.health_provider.trim() || null,
        status: 'pending' as ApplicationStatus,
        notes: `[Radicado: ${generatedCode}] ${formData.notes}`.trim(),
      };

      if (isSupabaseConfigured()) {
        const { error } = await supabase.from('membership_applications').insert(applicationPayload);
        if (error) {
          console.warn('Supabase insert application notice:', error.message);
        }
      }

      // Notificación por correo vía Resend
      await resendService.sendEmail({
        to: 'afiliaciones@ajedrezcapablanca.com',
        subject: `Nueva Solicitud de Afiliación: ${formData.applicant_name} ${formData.applicant_lastname} (${formData.desired_category})`,
        html: `
          <h2>Nueva Solicitud de Afiliación Deportiva</h2>
          <p><strong>Radicado:</strong> ${generatedCode}</p>
          <p><strong>Deportista:</strong> ${formData.applicant_name} ${formData.applicant_lastname}</p>
          <p><strong>Documento:</strong> ${formData.doc_type} ${formData.doc_number}</p>
          <p><strong>Edad:</strong> ${formData.age || 'No especificada'} años</p>
          <p><strong>Municipio:</strong> ${formData.municipality}</p>
          <p><strong>Teléfono:</strong> ${formData.phone}</p>
          <p><strong>Correo:</strong> ${formData.email}</p>
          <p><strong>Categoría solicitada:</strong> ${formData.desired_category}</p>
          <p><strong>Elo aproximado:</strong> ${formData.approximate_elo}</p>
          <p><strong>Acudiente:</strong> ${formData.guardian_name || 'N/A'} - ${formData.guardian_phone || 'N/A'}</p>
          <p><strong>EPS:</strong> ${formData.health_provider || 'N/A'}</p>
          <p><strong>Observaciones:</strong> ${formData.notes || 'Ninguna'}</p>
        `
      });

      setApplicationCode(generatedCode);
      setSubmitted(true);
    } catch (err: any) {
      console.error('Error enviando solicitud:', err);
      // Permitir confirmación en interfaz local
      setApplicationCode(generatedCode);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ paddingTop: 'calc(var(--header-h) + 1.5rem)', paddingBottom: '4rem', background: '#f8fafc', minHeight: '100vh' }}>
      
      {/* Cabecera Principal */}
      <section className="section section--dark" style={{ textAlign: 'center', paddingBlock: '3.5rem 2.5rem', borderBottom: '1px solid #333' }}>
        <div className="wrap-narrow">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(212,175,55,0.15)', border: '1px solid var(--gold)', padding: '0.35rem 1rem', borderRadius: '50px', color: 'var(--gold)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem' }}>
            <ShieldCheck size={16} /> Club Reconocido - Resolución Inder Sabaneta 042
          </div>
          <h1 className="display display--gold" style={{ fontSize: 'var(--step-4)', margin: '0 0 1rem' }}>
            Solicitud de Afiliación Deportiva
          </h1>
          <p style={{ color: '#d1d5db', fontSize: '1.15rem', maxWidth: '720px', margin: '0 auto', lineHeight: 1.6 }}>
            Formulario oficial de vinculación deportiva para niños, jóvenes y adultos. Únete a la familia Capablanca y disfruta de formación técnica de alto nivel, competencias oficiales y avales federados.
          </p>
        </div>
      </section>

      {/* Beneficios de Afiliación */}
      <section style={{ maxWidth: '1000px', margin: '-1.5rem auto 2.5rem', padding: '0 1rem' }}>
        <div style={{ background: '#ffffff', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.06), 0 8px 10px -6px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', padding: '1.5rem 2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div style={{ background: 'rgba(212,175,55,0.15)', color: 'var(--gold-deep)', padding: '0.5rem', borderRadius: '10px' }}>
              <UserCheck size={20} />
            </div>
            <div>
              <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>Carnet Oficial PVC</h4>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>Identificación física y digital de deportista federado.</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div style={{ background: 'rgba(59,130,246,0.15)', color: '#2563eb', padding: '0.5rem', borderRadius: '10px' }}>
              <Award size={20} />
            </div>
            <div>
              <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>Torneos Gratuitos</h4>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>Inscripción 100% gratuita a torneos internos y relámpagos.</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div style={{ background: 'rgba(16,185,129,0.15)', color: '#059669', padding: '0.5rem', borderRadius: '10px' }}>
              <HeartHandshake size={20} />
            </div>
            <div>
              <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>Aval Departamental</h4>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>Representación oficial en torneos de Antioquia y FCF.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contenedor del Formulario o Confirmación */}
      <div style={{ maxWidth: '820px', margin: '0 auto', padding: '0 1rem' }}>
        {submitted ? (
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '3rem 2rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ width: '70px', height: '70px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#16a34a' }}>
              <CheckCircle2 size={42} />
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ¡Solicitud Radicada Exitosamente!
            </span>
            <h2 style={{ fontSize: '1.8rem', color: '#0f172a', margin: '0.5rem 0 1rem', fontFamily: 'var(--font-display)' }}>
              Bienvenido(a) a la Familia Capablanca
            </h2>
            <p style={{ color: '#64748b', fontSize: '1rem', maxWidth: '580px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
              Hemos recibido los datos de <strong>{formData.applicant_name} {formData.applicant_lastname}</strong> para la categoría <strong>{formData.desired_category}</strong>. El cuerpo técnico revisará la información para la clase diagnóstica.
            </p>

            {/* Código de Radicado */}
            <div style={{ background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '1.25rem', maxWidth: '420px', margin: '0 auto 2rem' }}>
              <span style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Número Oficial de Radicado</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--gold-deep)', letterSpacing: '0.08em', marginTop: '0.25rem' }}>
                {applicationCode}
              </div>
            </div>

            {/* Resumen de datos */}
            <div style={{ background: '#f1f5f9', borderRadius: '12px', padding: '1.25rem', textAlign: 'left', marginBottom: '2rem', fontSize: '0.9rem', color: '#334155', lineHeight: 1.6 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                <div><strong>Documento:</strong> {formData.doc_type} {formData.doc_number}</div>
                <div><strong>Edad:</strong> {formData.age ? `${formData.age} años` : 'No informada'}</div>
                <div><strong>Municipio:</strong> {formData.municipality}</div>
                <div><strong>Teléfono:</strong> {formData.phone}</div>
                <div><strong>Correo:</strong> {formData.email}</div>
                <div><strong>EPS:</strong> {formData.health_provider || 'Particular'}</div>
                {formData.guardian_name && <div><strong>Acudiente:</strong> {formData.guardian_name} ({formData.guardian_phone})</div>}
              </div>
            </div>

            {/* Acciones */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem' }}>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => whatsappService.openApplicationContact(
                  `${formData.applicant_name} ${formData.applicant_lastname}`,
                  formData.phone,
                  formData.desired_category,
                  applicationCode
                )}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#25D366', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
              >
                <Phone size={18} /> Confirmar vía WhatsApp Directo
              </button>

              <button
                type="button"
                className="btn btn--secondary"
                onClick={handlePrint}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
              >
                <Download size={18} /> Imprimir Comprobante
              </button>
            </div>

            <div style={{ marginTop: '2.5rem' }}>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setFormData({
                    applicant_name: '',
                    applicant_lastname: '',
                    doc_type: 'TI',
                    doc_number: '',
                    birth_date: '',
                    age: '',
                    email: '',
                    phone: '',
                    municipality: 'Sabaneta',
                    desired_category: 'Iniciación Infantil (4 a 8 años)',
                    approximate_elo: '0',
                    guardian_name: '',
                    guardian_phone: '',
                    health_provider: '',
                    notes: '',
                  });
                }}
                style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.85rem', textDecoration: 'underline', cursor: 'pointer' }}
              >
                Radicar otra solicitud
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ background: '#ffffff', borderRadius: '20px', padding: '2.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
            
            {/* Sección 1: Datos Personales */}
            <div style={{ marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
                <span style={{ background: 'var(--gold)', color: '#000', width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>1</span>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: 700 }}>Datos Personales del Deportista</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                    Nombres *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.applicant_name}
                    onChange={e => setFormData({ ...formData, applicant_name: e.target.value })}
                    placeholder="Ej. Juan Pablo"
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.applicant_lastname}
                    onChange={e => setFormData({ ...formData, applicant_lastname: e.target.value })}
                    placeholder="Ej. Gómez Montoya"
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '0.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                      Tipo Doc. *
                    </label>
                    <select
                      value={formData.doc_type}
                      onChange={e => setFormData({ ...formData, doc_type: e.target.value as DocType })}
                      style={{ width: '100%', padding: '0.75rem 0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', background: '#fff' }}
                    >
                      <option value="TI">T.I.</option>
                      <option value="CC">C.C.</option>
                      <option value="RC">R.C.</option>
                      <option value="CE">C.E.</option>
                      <option value="Pasaporte">Pasaporte</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                      Número de Identificación *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.doc_number}
                      onChange={e => setFormData({ ...formData, doc_number: e.target.value })}
                      placeholder="Ej. 1036987452"
                      style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px', gap: '0.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                      Fecha de Nacimiento
                    </label>
                    <input
                      type="date"
                      value={formData.birth_date}
                      onChange={handleBirthDateChange}
                      style={{ width: '100%', padding: '0.75rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                      Edad
                    </label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={e => setFormData({ ...formData, age: e.target.value })}
                      placeholder="Años"
                      style={{ width: '100%', padding: '0.75rem 0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                    Municipio de Residencia *
                  </label>
                  <select
                    value={formData.municipality}
                    onChange={e => setFormData({ ...formData, municipality: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', background: '#fff' }}
                  >
                    <option value="Sabaneta">Sabaneta (Antioquia)</option>
                    <option value="Envigado">Envigado</option>
                    <option value="Itagüí">Itagüí</option>
                    <option value="Medellín">Medellín</option>
                    <option value="La Estrella">La Estrella</option>
                    <option value="Caldas">Caldas</option>
                    <option value="Bello">Bello</option>
                    <option value="Otro">Otro Municipio</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                    EPS / Afiliación a Salud
                  </label>
                  <input
                    type="text"
                    value={formData.health_provider}
                    onChange={e => setFormData({ ...formData, health_provider: e.target.value })}
                    placeholder="Ej. Sura, Sanitas, Savia Salud"
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                  />
                </div>
              </div>
            </div>

            {/* Sección 2: Contacto y Acudiente */}
            <div style={{ marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
                <span style={{ background: 'var(--gold)', color: '#000', width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>2</span>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: 700 }}>Contacto & Acudiente Responsable</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="deportista@ejemplo.com"
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                    Teléfono Celular / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Ej. 3001234567"
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                    Nombre del Acudiente / Representante (si aplica)
                  </label>
                  <input
                    type="text"
                    value={formData.guardian_name}
                    onChange={e => setFormData({ ...formData, guardian_name: e.target.value })}
                    placeholder="Obligatorio para menores de edad"
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                    Teléfono de Contacto del Acudiente
                  </label>
                  <input
                    type="tel"
                    value={formData.guardian_phone}
                    onChange={e => setFormData({ ...formData, guardian_phone: e.target.value })}
                    placeholder="Ej. 3119876543"
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                  />
                </div>
              </div>
            </div>

            {/* Sección 3: Categoría y Nivel */}
            <div style={{ marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
                <span style={{ background: 'var(--gold)', color: '#000', width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>3</span>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: 700 }}>Categoría y Experiencia Ajedrecística</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                    Categoría a la que aspira ingresar *
                  </label>
                  <select
                    value={formData.desired_category}
                    onChange={e => setFormData({ ...formData, desired_category: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', background: '#fff' }}
                  >
                    <option value="Iniciación Infantil (4 a 8 años)">Iniciación Infantil (4 a 8 años)</option>
                    <option value="Semillero Sub-12">Semillero Sub-12</option>
                    <option value="Desarrollo Juvenil Sub-16">Desarrollo Juvenil Sub-16</option>
                    <option value="Adultos & Aficionados">Adultos & Aficionados</option>
                    <option value="Alta Competencia Departamental">Alta Competencia Departamental</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                    Elo Aproximado / Nivel
                  </label>
                  <input
                    type="number"
                    value={formData.approximate_elo}
                    onChange={e => setFormData({ ...formData, approximate_elo: e.target.value })}
                    placeholder="0 si es principiante sin Elo"
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                  />
                  <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', marginTop: '0.25rem' }}>
                    Indicar 0 si nunca ha tenido ranking nacional o en Lichess/Chess.com
                  </span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Observaciones, Metas Deportivas o Disponibilidad
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Comentarios adicionales, disponibilidad horaria o torneos en los que haya participado previamente..."
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', resize: 'vertical' }}
                />
              </div>
            </div>

            {/* Aviso de Tratamiento de Datos */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', fontSize: '0.8rem', color: '#64748b', marginBottom: '2rem', lineHeight: 1.5 }}>
              Al enviar esta solicitud, autorizas al <strong>Club Deportivo de Ajedrez Capablanca Sabaneta</strong> el tratamiento de los datos personales suministrados para fines estrictamente deportivos, académicos y de vinculación ante el INDER Sabaneta y la Liga de Ajedrez de Antioquia, conforme a la Ley 1581 de 2012.
            </div>

            {/* Botón de Envío */}
            <div style={{ textAlign: 'center' }}>
              <button
                type="submit"
                disabled={loading}
                className="btn btn--primary"
                style={{ minWidth: '240px', padding: '0.9rem 2rem', fontSize: '1.05rem', fontWeight: 700, borderRadius: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading ? 'Radicando solicitud...' : (
                  <>
                    <Send size={18} /> Radicar Solicitud Oficial
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
