import React from 'react';
import { Instagram, ExternalLink } from 'lucide-react';
import { INITIAL_GALLERY } from '../../lib/initialData';
import { normalizeImageUrl, handleImageError } from '../../lib/imageUtils';

export const InstagramWall: React.FC = () => {
  const posts = INITIAL_GALLERY.slice(0, 6);

  return (
    <section className="section" style={{ background: '#0a0a0a', color: '#fff', borderTop: '1px solid #222' }}>
      <div className="wrap">
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div>
            <span className="pill pill--gold" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <Instagram size={14} /> Muro Social
            </span>
            <h2 className="display display--gold" style={{ marginTop: '0.75rem' }}>
              La vida en el club en fotos reales
            </h2>
            <p style={{ color: '#aaa', marginTop: '0.5rem', maxWidth: '600px' }}>
              Torneos, celebraciones, entrenamientos y el día a día de nuestros deportistas en Sabaneta.
            </p>
          </div>

          <a
            href="https://www.instagram.com/capablanca_sabaneta/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn--ghost"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Instagram size={18} />
            <span>Seguir @capablanca_sabaneta</span>
            <ExternalLink size={16} />
          </a>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {posts.map((post) => (
            <a
              key={post.id}
              href="https://www.instagram.com/capablanca_sabaneta/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                borderRadius: '12px',
                overflow: 'hidden',
                background: '#161616',
                border: '1px solid #282828',
                transition: 'transform 0.3s ease, border-color 0.3s ease',
              }}
              className="social-post-card"
            >
              <div style={{ aspectRatio: '1/1', overflow: 'hidden', position: 'relative' }}>
                <img
                  src={normalizeImageUrl(post.src)}
                  alt={post.alt}
                  onError={handleImageError}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    padding: '1.2rem',
                  }}
                >
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>
                    {post.caption}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gold)', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Instagram size={12} /> Ver en Instagram
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};
