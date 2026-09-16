import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, Menu, X, ArrowRight } from 'lucide-react';

export const Header: React.FC = () => {
  const [isStuck, setIsStuck] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsStuck(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cerrar drawer al cambiar de ruta
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { label: 'Inicio', path: '/' },
    { label: 'El Club', path: '/club' },
    { label: 'Programas', path: '/programas' },
    { label: 'Torneos', path: '/torneos' },
    { label: 'Blog', path: '/blog' },
    { label: 'Galería', path: '/galeria' },
    { label: 'Contacto', path: '/contacto' },
  ];

  return (
    <>
      <header className={`header ${isStuck ? 'is-stuck' : ''}`}>
        <div className="wrap header__inner">
          <Link to="/" className="brand" aria-label="Club de Ajedrez Capablanca Sabaneta, ir al inicio">
            <img className="brand__logo" src="/assets/img/logo-capablanca.png" alt="" width="50" height="50" />
            <span className="brand__text">
              <span className="brand__name">Capablanca</span>
              <span className="brand__sub">Sabaneta</span>
            </span>
          </Link>

          <nav className="nav" aria-label="Navegación principal">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                aria-current={location.pathname === link.path ? 'page' : undefined}
                className={location.pathname === link.path ? 'is-active' : ''}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="header__cta" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {user ? (
              <Link
                to="/afiliados"
                className="btn btn--primary btn--sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <User size={16} />
                <span>{user.nombre || 'Mi Portal'}</span>
              </Link>
            ) : (
              <Link
                to="/afiliados"
                className="btn btn--ghost btn--sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderColor: 'var(--gold)' }}
              >
                <User size={16} />
                <span>Portal Afiliados</span>
              </Link>
            )}

            <Link className="btn btn--primary btn--sm pulse" to="/contacto">
              Inscríbete
            </Link>

            <button
              className="burger"
              type="button"
              aria-expanded={drawerOpen}
              aria-label={drawerOpen ? 'Cerrar menú' : 'Abrir menú'}
              onClick={() => setDrawerOpen(!drawerOpen)}
            >
              {drawerOpen ? <X size={24} color="#F5C518" /> : (
                <>
                  <span></span><span></span><span></span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Menú móvil (Drawer) */}
      <div className={`drawer ${drawerOpen ? 'is-open' : ''}`} id="menu-movil">
        {navLinks.map((link, idx) => (
          <Link
            key={link.path}
            to={link.path}
            onClick={() => setDrawerOpen(false)}
          >
            {link.label} <span>0{idx + 1}</span>
          </Link>
        ))}

        <Link
          to="/afiliados"
          className="btn btn--ghost"
          style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          onClick={() => setDrawerOpen(false)}
        >
          <User size={18} />
          {user ? `Mi Portal (${user.nombre})` : 'Ingresar a Portal Afiliados'}
        </Link>

        <a
          className="btn btn--primary"
          style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          href="https://wa.me/573002545835?text=Hola%2C%20quiero%20inscribirme%20en%20el%20Club%20Capablanca%20Sabaneta."
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>Inscríbete por WhatsApp</span>
          <ArrowRight size={18} />
        </a>
      </div>
    </>
  );
};
