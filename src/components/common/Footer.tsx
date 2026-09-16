import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, MessageCircle, Instagram, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="footer" style={{ background: '#0a0a0a', color: '#fff', borderTop: '2px solid #222', padding: '4rem 0 2rem' }}>
      <div className="wrap" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '3rem', marginBottom: '3rem' }}>
        
        {/* Columna 1: Marca y descripción */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.2rem' }}>
            <img src="/assets/img/logo-capablanca.png" alt="Escudo Capablanca" width="48" height="48" />
            <div>
              <div style={{ fontFamily: 'var(--ff-display)', fontSize: '1.3rem', textTransform: 'uppercase', color: 'var(--gold)' }}>
                Capablanca
              </div>
              <div style={{ fontSize: '0.85rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Sabaneta · Antioquia
              </div>
            </div>
          </div>
          <p style={{ color: '#aaa', fontSize: '0.95rem', lineHeight: '1.6' }}>
            Club Deportivo de Ajedrez con más de 12 años formando deportistas y seres humanos íntegros.
            Clases para todas las edades, torneos y asesorías en modalidad presencial y online.
          </p>
        </div>

        {/* Columna 2: Enlaces rápidos */}
        <div>
          <h4 style={{ color: 'var(--gold)', textTransform: 'uppercase', fontFamily: 'var(--ff-banner)', fontSize: '1.2rem', marginBottom: '1rem' }}>
            Explorar
          </h4>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.95rem', color: '#ccc' }}>
            <li><Link to="/club" style={{ transition: 'color 0.2s' }}>Historia y Filosofía</Link></li>
            <li><Link to="/programas">Programas de Formación</Link></li>
            <li><Link to="/torneos">Calendario de Torneos</Link></li>
            <li><Link to="/blog">Noticias y Blog</Link></li>
            <li><Link to="/galeria">Galería Fotográfica</Link></li>
            <li><Link to="/afiliados">Zona de Afiliados</Link></li>
            <li><Link to="/reloj">Reloj de Ajedrez Oficial</Link></li>
            <li><Link to="/verificar" style={{ color: 'var(--gold)', fontWeight: 600 }}>Validar Certificado</Link></li>
          </ul>
        </div>

        {/* Columna 3: Ubicación y contacto */}
        <div>
          <h4 style={{ color: 'var(--gold)', textTransform: 'uppercase', fontFamily: 'var(--ff-banner)', fontSize: '1.2rem', marginBottom: '1rem' }}>
            Contacto & Sede
          </h4>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.95rem', color: '#ccc' }}>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <MapPin size={18} color="#F5C518" style={{ flexShrink: 0, marginTop: '3px' }} />
              <span>CC Aves María, tercer piso · Sabaneta, Antioquia</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Phone size={18} color="#F5C518" style={{ flexShrink: 0 }} />
              <a href="tel:+573002545835">+57 300 254 5835</a>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageCircle size={18} color="#25D366" style={{ flexShrink: 0 }} />
              <a href="https://wa.me/573002545835" target="_blank" rel="noopener noreferrer">
                WhatsApp Oficial
              </a>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Instagram size={18} color="#E1306C" style={{ flexShrink: 0 }} />
              <a href="https://www.instagram.com/capablanca_sabaneta/" target="_blank" rel="noopener noreferrer">
                @capablanca_sabaneta
              </a>
            </li>
          </ul>
        </div>

      </div>

      {/* Barra inferior */}
      <div className="wrap" style={{ borderTop: '1px solid #222', paddingTop: '1.5rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', fontSize: '0.85rem', color: '#777' }}>
        <p>© {new Date().getFullYear()} Club Deportivo de Ajedrez Capablanca Sabaneta. Todos los derechos reservados.</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ShieldCheck size={16} color="var(--gold)" />
            <span>Afiliación Deportiva Oficial</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            Hecho con <Heart size={14} color="#D32F2F" fill="#D32F2F" /> para el ajedrez
          </span>
        </div>
      </div>
    </footer>
  );
};
