import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, Lock, ArrowRight, ShieldCheck, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';

export const MemberLoginView: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isEmailUnconfirmed, setIsEmailUnconfirmed] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login, loginAsDemo, isConfigured, resendConfirmationEmail } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsEmailUnconfirmed(false);
    setResendStatus(null);
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      navigate('/afiliados');
    } else {
      setError(res.error || 'Error al iniciar sesión');
      setIsEmailUnconfirmed(Boolean(res.isEmailNotConfirmed));
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      setError('Por favor ingresa tu correo electrónico para reenviarte la confirmación.');
      return;
    }
    setResendingEmail(true);
    setResendStatus(null);
    const res = await resendConfirmationEmail(email);
    setResendingEmail(false);
    if (res.success) {
      setResendStatus('¡Enlace de confirmación enviado! Revisa tu bandeja de entrada y la carpeta de spam.');
    } else {
      setError(res.error || 'No se pudo reenviar el correo de confirmación.');
    }
  };

  const handleDemoLogin = () => {
    loginAsDemo('member');
    navigate('/afiliados');
  };

  return (
    <div style={{ paddingTop: 'calc(var(--header-h) + 3rem)', minHeight: '90vh', background: '#0a0a0a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingInline: '1rem' }}>
      <div style={{ maxWidth: '440px', width: '100%', background: '#141414', border: '1px solid #282828', borderRadius: '16px', padding: '2.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src="/assets/img/logo-capablanca.png" alt="Logo Capablanca" width="64" height="64" style={{ margin: '0 auto 1rem' }} />
          <h1 className="display display--gold" style={{ fontSize: '1.8rem' }}>Portal de Afiliados</h1>
          <p style={{ color: '#aaa', fontSize: '0.9rem', marginTop: '0.4rem' }}>
            Acceso exclusivo para alumnos y miembros del club
          </p>
        </div>

        {error && (
          <div
            style={{
              background: isEmailUnconfirmed ? '#2a220e' : '#3e1b1b',
              border: isEmailUnconfirmed ? '1px solid #b78103' : '1px solid #b71c1c',
              color: isEmailUnconfirmed ? '#ffe082' : '#ff8a80',
              padding: '1rem',
              borderRadius: '10px',
              fontSize: '0.88rem',
              marginBottom: '1.5rem',
              lineHeight: 1.5,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px', color: isEmailUnconfirmed ? 'var(--gold)' : '#ff5252' }} />
              <div style={{ width: '100%' }}>
                <strong>{isEmailUnconfirmed ? 'Correo pendiente de confirmación' : 'Error de acceso'}</strong>
                <p style={{ margin: '0.3rem 0 0', fontSize: '0.83rem' }}>{error}</p>
                {isEmailUnconfirmed && (
                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    disabled={resendingEmail}
                    style={{
                      marginTop: '0.8rem',
                      background: 'var(--gold)',
                      color: '#000',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      padding: '0.4rem 0.8rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    <Mail size={14} />
                    <span>{resendingEmail ? 'Reenviando...' : 'Reenviar enlace de confirmación'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {resendStatus && (
          <div
            style={{
              background: '#112211',
              border: '1px solid #2e7d32',
              color: '#a5d6a7',
              padding: '0.85rem 1rem',
              borderRadius: '10px',
              fontSize: '0.85rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <CheckCircle2 size={18} color="#81c784" />
            <span>{resendStatus}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#bbb', marginBottom: '0.4rem' }}>
              Correo electrónico
            </label>
            <div style={{ position: 'relative' }}>
              <User size={18} color="#666" style={{ position: 'absolute', left: '12px', top: '14px' }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.6rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                placeholder="afiliado@ejemplo.com"
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', color: '#bbb' }}>Contraseña</label>
              <Link to="/recuperar-clave" style={{ fontSize: '0.8rem', color: 'var(--gold)' }}>
                ¿Olvidaste tu clave?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="#666" style={{ position: 'absolute', left: '12px', top: '14px' }} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.6rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn--primary"
            style={{ width: '100%', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <span>{loading ? 'Entrando...' : 'Iniciar Sesión'}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Acceso demo: solo disponible mientras Supabase no está configurado (.env con placeholders).
            Con credenciales reales, este botón se oculta para no simular sesiones falsas. */}
        {!isConfigured && (
          <div style={{ marginTop: '1.5rem', paddingTop: '1.2rem', borderTop: '1px solid #222', textAlign: 'center' }}>
            <button
              type="button"
              onClick={handleDemoLogin}
              className="btn btn--ghost btn--sm"
              style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', borderColor: '#444' }}
            >
              <ShieldCheck size={16} color="var(--gold)" />
              <span>Entrar como Afiliado Demo (Prueba Rápida)</span>
            </button>
          </div>
        )}

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: '#888' }}>
          ¿Aún no tienes cuenta de afiliado?{' '}
          <Link to="/registro-afiliado" style={{ color: 'var(--gold)', fontWeight: 600 }}>
            Regístrate aquí
          </Link>
        </div>

        <div style={{ marginTop: '0.8rem', textAlign: 'center', fontSize: '0.8rem', color: '#666' }}>
          ¿Aún no eres socio del club?{' '}
          <Link to="/afiliarse" style={{ color: '#aaa', textDecoration: 'underline' }}>
            Radica tu solicitud de admisión
          </Link>
        </div>
      </div>
    </div>
  );
};
