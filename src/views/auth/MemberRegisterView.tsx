import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, Lock, Mail, Phone, ArrowRight, Shield, CheckCircle2, ShieldCheck } from 'lucide-react';

export const MemberRegisterView: React.FC = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    usuario: '',
    email: '',
    password: '',
    telefono: '',
    categoria: 'Iniciación Infantil',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const { register, resendConfirmationEmail } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await register({
      email: formData.email,
      password: formData.password,
      nombre: formData.nombre,
      apellido: formData.apellido,
      usuario: formData.usuario,
      telefono: formData.telefono,
      categoria: formData.categoria,
    });
    setLoading(false);

    if (res.success) {
      if (res.emailConfirmationRequired) {
        setIsRegistered(true);
      } else {
        navigate('/afiliados');
      }
    } else {
      setError(res.error || 'Error al registrarte');
    }
  };

  const handleResend = async () => {
    setResendingEmail(true);
    setResendStatus(null);
    const res = await resendConfirmationEmail(formData.email);
    setResendingEmail(false);
    if (res.success) {
      setResendStatus('¡Correo de confirmación reenviado exitosamente! Revisa tu bandeja de entrada o spam.');
    } else {
      setError(res.error || 'Error al reenviar correo');
    }
  };

  return (
    <div style={{ paddingTop: 'calc(var(--content-offset) + 1.5rem)', minHeight: '95vh', background: '#0a0a0a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingInline: '1rem', paddingBottom: '3rem' }}>
      <div style={{ maxWidth: '520px', width: '100%', background: '#141414', border: '1px solid #282828', borderRadius: '16px', padding: '2.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src="/assets/img/logo-capablanca.png" alt="Logo Capablanca" width="64" height="64" style={{ margin: '0 auto 1rem' }} />
          <h1 className="display display--gold" style={{ fontSize: '1.8rem' }}>Registro de Afiliado</h1>
          <p style={{ color: '#aaa', fontSize: '0.9rem', marginTop: '0.4rem' }}>
            Únete a la plataforma oficial del Club Deportivo de Ajedrez Capablanca Sabaneta
          </p>
        </div>

        {error && (
          <div style={{ background: '#3e1b1b', border: '1px solid #b71c1c', color: '#ff8a80', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            {error}
          </div>
        )}

        {isRegistered ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(76, 175, 80, 0.15)',
                border: '2px solid #4caf50',
                color: '#81c784',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <h2 style={{ fontSize: '1.4rem', color: '#fff', fontWeight: 800, marginBottom: '0.8rem' }}>
              ¡Solicitud de Registro Recibida!
            </h2>

            <div
              style={{
                background: '#111913',
                border: '1px solid #2e7d32',
                borderRadius: '12px',
                padding: '1.4rem',
                marginBottom: '1.5rem',
                textAlign: 'left',
              }}
            >
              <p style={{ color: '#c8e6c9', fontSize: '0.95rem', lineHeight: 1.6, margin: 0, fontWeight: 600 }}>
                "Su solicitud de registro de afiliación al Club De Ajedrez Capablanca en Sabaneta ha sido recibida exitosamente."
              </p>
              <hr style={{ borderColor: 'rgba(46, 125, 50, 0.3)', margin: '1rem 0' }} />
              <p style={{ color: '#aaa', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>
                Hemos enviado un enlace de confirmación a tu correo: <strong style={{ color: '#fff' }}>{formData.email}</strong>. Por favor abre tu bandeja de entrada o carpeta de spam y haz clic en el enlace para validar tu cuenta.
              </p>
            </div>

            {resendStatus ? (
              <div
                style={{
                  background: '#112211',
                  border: '1px solid #2e7d32',
                  color: '#a5d6a7',
                  padding: '0.85rem',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  marginBottom: '1.5rem',
                }}
              >
                {resendStatus}
              </div>
            ) : (
              <div style={{ marginBottom: '1.5rem' }}>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendingEmail}
                  className="btn btn--ghost btn--sm"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    borderColor: '#444',
                    fontSize: '0.82rem',
                  }}
                >
                  <Mail size={14} />
                  <span>{resendingEmail ? 'Reenviando...' : '¿No recibiste el correo? Reenviar'}</span>
                </button>
              </div>
            )}

            {/* Aviso de Privacidad y Tratamiento de Datos (Ley 1581 de 2012) */}
            <div
              style={{
                background: '#181818',
                border: '1px solid #282828',
                borderRadius: '10px',
                padding: '1rem',
                textAlign: 'left',
                fontSize: '0.75rem',
                color: '#777',
                lineHeight: 1.5,
                marginBottom: '1.8rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  color: 'var(--gold)',
                  fontWeight: 700,
                  marginBottom: '0.3rem',
                }}
              >
                <ShieldCheck size={14} />
                <span>Tratamiento de Datos Personales (Habeas Data)</span>
              </div>
              Los datos suministrados serán tratados exclusivamente con fines de registro deportivo, carnetización, control pedagógico y comunicaciones institucionales por el <strong>Club Deportivo de Ajedrez Capablanca Sabaneta</strong> (Personería Jurídica Inder Sabaneta Res. 042). Puedes solicitar su actualización o rectificación en cualquier momento.
            </div>

            <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/login-afiliado" className="btn btn--primary" style={{ padding: '0.75rem 1.4rem' }}>
                Ir al Inicio de Sesión
              </Link>
              <Link to="/" className="btn btn--secondary" style={{ padding: '0.75rem 1.4rem' }}>
                Volver al Sitio Principal
              </Link>
            </div>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#bbb', marginBottom: '0.4rem' }}>
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                    placeholder="Santiago"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#bbb', marginBottom: '0.4rem' }}>
                    Apellido *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.apellido}
                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                    style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                    placeholder="Gómez"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#bbb', marginBottom: '0.4rem' }}>
                    Nombre de usuario
                  </label>
                  <input
                    type="text"
                    value={formData.usuario}
                    onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                    style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                    placeholder="santiago_chess"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#bbb', marginBottom: '0.4rem' }}>
                    Teléfono / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                    placeholder="300 123 4567"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#bbb', marginBottom: '0.4rem' }}>
                  Correo electrónico *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                  placeholder="tu@correo.com"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#bbb', marginBottom: '0.4rem' }}>
                  Contraseña segura *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#bbb', marginBottom: '0.4rem' }}>
                  Nivel o Categoría de Ajedrez
                </label>
                <select
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                >
                  <option value="Iniciación Infantil">Iniciación Infantil (4-8 años)</option>
                  <option value="Semillero Sub-12">Semillero Sub-12</option>
                  <option value="Juvenil Sub-16">Juvenil Sub-16</option>
                  <option value="Adultos & Aficionados">Adultos & Aficionados</option>
                  <option value="Alta Competencia / Elo FIDE">Alta Competencia / Elo FIDE</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn--primary"
                style={{ width: '100%', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <span>{loading ? 'Creando cuenta...' : 'Registrarme como Afiliado'}</span>
                <ArrowRight size={18} />
              </button>
            </form>

            <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: '#888' }}>
              ¿Ya tienes cuenta?{' '}
              <Link to="/login-afiliado" style={{ color: 'var(--gold)', fontWeight: 600 }}>
                Inicia sesión aquí
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
