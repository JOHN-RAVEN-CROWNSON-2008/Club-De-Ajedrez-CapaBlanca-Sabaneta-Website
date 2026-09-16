import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Lock, Mail, ArrowRight } from 'lucide-react';

export const AdminLoginView: React.FC = () => {
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
      navigate('/admin');
    } else {
      setError(res.error || 'Credenciales de administrador no autorizadas');
    }
  };

  const handleDemoAdmin = () => {
    loginAsDemo('admin');
    navigate('/admin');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#070707', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ maxWidth: '440px', width: '100%', background: '#121212', border: '1px solid #242424', borderRadius: '16px', padding: '2.5rem', boxShadow: '0 24px 48px rgba(0,0,0,0.8)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: '64px', height: '64px', background: '#1a1a1a', border: '2px solid var(--gold)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.2rem' }}>
            <ShieldCheck size={32} color="var(--gold)" />
          </div>
          <h1 className="display display--gold" style={{ fontSize: '1.6rem' }}>
            Panel de Administración
          </h1>
          <p style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.4rem' }}>
            Acceso restringido · CMS Capablanca Sabaneta
          </p>
        </div>

        {error && (
          <div style={{ background: '#381616', border: '1px solid #b71c1c', color: '#ff8a80', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#bbb', marginBottom: '0.4rem' }}>
              Correo de Administrador
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="#666" style={{ position: 'absolute', left: '12px', top: '14px' }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.6rem', borderRadius: '8px', background: '#1c1c1c', border: '1px solid #333', color: '#fff' }}
                placeholder="admin@ajedrezcapablanca.com"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#bbb', marginBottom: '0.4rem' }}>
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="#666" style={{ position: 'absolute', left: '12px', top: '14px' }} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.6rem', borderRadius: '8px', background: '#1c1c1c', border: '1px solid #333', color: '#fff' }}
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
            <span>{loading ? 'Verificando privilegios...' : 'Acceder al CMS'}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Acceso demo: solo disponible mientras Supabase no está configurado (.env con placeholders).
            Con credenciales reales, este botón se oculta para no simular sesiones falsas que
            luego fallan en silencio contra las políticas RLS reales. */}
        {!isConfigured && (
          <div style={{ marginTop: '1.8rem', paddingTop: '1.4rem', borderTop: '1px solid #222', textAlign: 'center' }}>
            <button
              type="button"
              onClick={handleDemoAdmin}
              className="btn btn--ghost btn--sm"
              style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', borderColor: '#444' }}
            >
              <ShieldCheck size={16} color="var(--gold)" />
              <span>Entrar como Administrador Demo (Prueba Rápida)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
