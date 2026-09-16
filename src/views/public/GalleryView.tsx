import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { INITIAL_GALLERY } from '../../lib/initialData';
import { GalleryItem } from '../../types/database';
import { Image, ZoomIn, X, Filter } from 'lucide-react';

export const GalleryView: React.FC = () => {
  const [gallery, setGallery] = useState<GalleryItem[]>(INITIAL_GALLERY);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadGallery() {
      if (!isSupabaseConfigured()) {
        setGallery(INITIAL_GALLERY);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('gallery')
          .select('*')
          .order('order_index', { ascending: true });

        if (data && data.length > 0) {
          setGallery(data as GalleryItem[]);
        } else {
          setGallery(INITIAL_GALLERY);
        }
      } catch (err) {
        console.error('Error al cargar galería de Supabase:', err);
        setGallery(INITIAL_GALLERY);
      } finally {
        setLoading(false);
      }
    }

    loadGallery();
  }, []);

  const categories = ['all', 'infantil', 'torneos', 'adultos', 'delegacion', 'sede', 'comunidad'];

  const filteredGallery = gallery.filter((item) => {
    if (selectedCategory === 'all') return true;
    return item.category?.toLowerCase() === selectedCategory.toLowerCase();
  });

  return (
    <div style={{ paddingTop: 'calc(var(--header-h) + 2rem)' }}>
      {/* Cabecera */}
      <section className="section section--dark" style={{ textAlign: 'center', paddingBlock: '3rem' }}>
        <div className="wrap-narrow">
          <span className="pill pill--gold">Memoria Fotográfica</span>
          <h1 className="display display--gold" style={{ fontSize: 'var(--step-4)', marginTop: '1rem' }}>
            Galería del Club Capablanca
          </h1>
          <p style={{ color: '#ccc', fontSize: '1.2rem', marginTop: '1rem', lineHeight: 1.6 }}>
            Momentos, sonrisas, delegaciones y trofeos que resumen nuestra trayectoria en Sabaneta.
          </p>
        </div>
      </section>

      {/* Grid fotográfico */}
      <section className="section" style={{ background: '#0a0a0a', color: '#fff', minHeight: '60vh' }}>
        <div className="wrap">
          {/* Barra de Filtros por Categoría */}
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '2.5rem', justifyContent: 'center' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  border: selectedCategory === cat ? '1px solid var(--gold)' : '1px solid #333',
                  background: selectedCategory === cat ? 'var(--gold)' : '#141414',
                  color: selectedCategory === cat ? '#000' : '#bbb',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {cat === 'all' ? 'Todas las Fotos' : cat}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {filteredGallery.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedImage(item)}
                style={{
                  borderRadius: '12px',
                  overflow: 'hidden',
                  position: 'relative',
                  aspectRatio: '4/3',
                  cursor: 'pointer',
                  border: '1px solid #222',
                  background: '#161616',
                }}
                className="gallery-card"
              >
                <img
                  src={item.src}
                  alt={item.alt}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.6)',
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    padding: '1.2rem',
                  }}
                  className="gallery-overlay"
                >
                  <p style={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem' }}>{item.caption}</p>
                  <span style={{ color: 'var(--gold)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.3rem' }}>
                    <ZoomIn size={14} /> Ampliar fotografía
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modal de visualización ampliada */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.92)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'relative', maxWidth: '900px', width: '100%', textAlign: 'center' }}
          >
            <button
              onClick={() => setSelectedImage(null)}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                background: 'none',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              <X size={32} />
            </button>
            <img
              src={selectedImage.src}
              alt={selectedImage.alt}
              style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
            />
            <p style={{ color: 'var(--gold)', marginTop: '1rem', fontSize: '1.1rem', fontWeight: 600 }}>
              {selectedImage.caption}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
