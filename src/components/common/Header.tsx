// REGLA CRÍTICA DE ARQUITECTURA DOM / CSS (Bloque 0):
// Prohibido aplicar transform, filter, perspective o will-change: transform
// en #root, body o cualquier componente contenedor que envuelva a <Header />.
// Un transform en cualquier ancestro crea un nuevo containing block y desacopla
// position: fixed del viewport, causando saltos y huecos en la barra de navegación.

import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { INITIAL_ANNOUNCEMENTS } from '../../lib/initialData';
import { ClubAnnouncement } from '../../types/database';
import { handleImageError } from '../../lib/imageUtils';
import { User, X, ArrowRight, Megaphone } from 'lucide-react';

export const Header: React.FC = () => {
  const [isStuck, setIsStuck] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeBanner, setActiveBanner] = useState<ClubAnnouncement | null>(null);
  const bannerRef = useRef<HTMLDivElement | null>(null);
  const { user } = useAuth();
  const location = useLocation();

  // Detección de scroll para estado compacto/adherido
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

  // Carga de avisos prioritarios dinámicos
  useEffect(() => {
    let isMounted = true;
    async function loadAnnouncement() {
      if (!isSupabaseConfigured()) {
        const fallback = INITIAL_ANNOUNCEMENTS.find((a) => a.active && (a.target === 'all' || a.target === 'public'));
        if (isMounted && fallback) setActiveBanner(fallback);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('club_announcements')
          .select('*')
          .eq('active', true)
          .in('target', ['all', 'public'])
          .order('created_at', { ascending: false })
          .limit(1);

        if (!error && data && data.length > 0 && isMounted) {
          setActiveBanner(data[0] as ClubAnnouncement);
        }
      } catch (err) {
        console.warn('Carga de avisos en Header:', err);
      }
    }

    loadAnnouncement();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sincronización dinámica de la altura del anuncio con las variables CSS globales
  useEffect(() => {
    if (bannerRef.current && activeBanner) {
      const height = bannerRef.current.offsetHeight;
      document.documentElement.style.setProperty('--announcement-h', `${height}px`);
    } else {
      document.documentElement.style.setProperty('--announcement-h', '0px');
    }

    return () => {
      document.documentElement.style.setProperty('--announcement-h', '0px');
    };
  }, [activeBanner]);

  const handleDismissBanner = () => {
    setActiveBanner(null);
    document.documentElement.style.setProperty('--announcement-h', '0px');
  };

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
        {/* Aviso prioritario superior dinámico */}
        {activeBanner && activeBanner.active && (
          <div
            ref={bannerRef}
            className={`announcement-bar announcement-bar--${activeBanner.level || 'info'}`}
            role="alert"
            aria-live="polite"
          >
            <div className="wrap announcement-bar__inner">
              <div className="announcement-bar__content">
                <Megaphone size={16} color="var(--gold)" style={{ flexShrink: 0 }} />
                <span className="announcement-bar__text">
                  <strong>{activeBanner.title}:</strong> {activeBanner.message}
                </span>
              </div>
              <button
                type="button"
                className="announcement-bar__close"
                onClick={handleDismissBanner}
                aria-label="Cerrar aviso prioritario"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        <div className="wrap header__inner">
          <Link to="/" className="brand" aria-label="Club de Ajedrez Capablanca Sabaneta, ir al inicio">
            <img
              className="brand__logo"
              src="/assets/img/logo-capablanca.png"
              alt="Club Capablanca Sabaneta"
              onError={handleImageError}
              width="50"
              height="50"
            />
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

        <Link
          to="/reloj"
          className="btn btn--ghost"
          style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', borderColor: '#333' }}
          onClick={() => setDrawerOpen(false)}
        >
          <span>⏱️ Reloj de Ajedrez Oficial</span>
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
