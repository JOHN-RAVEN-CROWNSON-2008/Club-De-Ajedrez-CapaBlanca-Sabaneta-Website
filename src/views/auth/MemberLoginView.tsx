import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, Lock, ArrowRight, ShieldCheck } from 'lucide-react';

export const MemberLoginView: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginAsDemo, isConfigured } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      navigate('/afiliados');
    } else {
      setError(res.error || 'Error al iniciar sesión');
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
          <div style={{ background: '#3e1b1b', border: '1px solid #b71c1c', color: '#ff8a80', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            {error}
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

        {/* Demo Fast Access button */}
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

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: '#888' }}>
          ¿Aún no tienes cuenta de afiliado?{' '}
          <Link to="/registro-afiliado" style={{ color: 'var(--gold)', fontWeight: 600 }}>
            Regístrate aquí
          </Link>
        </div>
      </div>
    </div>
  );
};
