import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, Lock, Mail, Phone, ArrowRight, Shield } from 'lucide-react';

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
  const { register } = useAuth();
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
      navigate('/afiliados');
    } else {
      setError(res.error || 'Error al registrarte');
    }
  };

  return (
    <div style={{ paddingTop: 'calc(var(--header-h) + 3rem)', minHeight: '95vh', background: '#0a0a0a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingInline: '1rem', paddingBottom: '3rem' }}>
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
      </div>
    </div>
  );
};
