import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const ForgotPasswordView: React.FC = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await resetPassword(email);
    setLoading(false);

    if (res.success) {
      setSent(true);
    } else {
      setError(res.error || 'Error al enviar instrucciones de recuperación');
    }
  };

  return (
    <div style={{ paddingTop: 'calc(var(--header-h) + 3rem)', minHeight: '85vh', background: '#0a0a0a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingInline: '1rem' }}>
      <div style={{ maxWidth: '440px', width: '100%', background: '#141414', border: '1px solid #282828', borderRadius: '16px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 className="display display--gold" style={{ fontSize: '1.6rem' }}>Recuperar Contraseña</h1>
          <p style={{ color: '#aaa', fontSize: '0.85rem', marginTop: '0.4rem' }}>
            Ingresa tu correo para recibir un enlace de restablecimiento seguro
          </p>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center', background: '#122617', border: '1px solid #2e7d32', padding: '1.8rem', borderRadius: '12px' }}>
            <CheckCircle2 size={40} color="#4caf50" style={{ margin: '0 auto 0.8rem' }} />
            <h3 style={{ color: '#81c784', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Enlace enviado</h3>
            <p style={{ color: '#bbb', fontSize: '0.9rem' }}>
              Revisa tu bandeja de entrada en <strong>{email}</strong> para actualizar tu clave de acceso.
            </p>
            <Link to="/login-afiliado" className="btn btn--primary btn--sm" style={{ marginTop: '1.2rem', display: 'inline-block' }}>
              Volver al Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {error && (
              <div style={{ background: '#381616', color: '#ff8a80', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#bbb', marginBottom: '0.4rem' }}>
                Correo registrado
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} color="#666" style={{ position: 'absolute', left: '12px', top: '14px' }} />
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

            <button
              type="submit"
              disabled={loading}
              className="btn btn--primary"
              style={{ width: '100%' }}
            >
              {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <Link to="/login-afiliado" style={{ color: '#888', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <ArrowLeft size={14} /> Volver a iniciar sesión
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
