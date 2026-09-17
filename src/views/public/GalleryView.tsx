import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { INITIAL_GALLERY } from '../../lib/initialData';
import { GalleryItem } from '../../types/database';
import { Image as ImageIcon, ZoomIn, X, ChevronLeft, ChevronRight, Search, MessageCircle, ExternalLink } from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  all: 'Todas las Fotos',
  torneos: 'Torneos & Competencias',
  infantil: 'Semillero Infantil',
  adultos: 'Club de Adultos',
  delegacion: 'Delegación Departamental',
  sede: 'Sede CC Aves María',
  comunidad: 'Comunidad & Familia',
};

export const GalleryView: React.FC = () => {
  const [gallery, setGallery] = useState<GalleryItem[]>(INITIAL_GALLERY);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
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

  const categories = useMemo(() => {
    const cats = new Set<string>();
    gallery.forEach((item) => {
      if (item.category) cats.add(item.category.toLowerCase());
    });
    return ['all', ...Array.from(cats)];
  }, [gallery]);

  const filteredGallery = useMemo(() => {
    return gallery.filter((item) => {
      const matchesCategory =
        selectedCategory === 'all' ||
        item.category?.toLowerCase() === selectedCategory.toLowerCase();

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (item.caption && item.caption.toLowerCase().includes(q)) ||
        (item.alt && item.alt.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [gallery, selectedCategory, searchQuery]);

  const currentIndex = useMemo(() => {
    if (!selectedImage) return -1;
    return filteredGallery.findIndex((img) => img.id === selectedImage.id);
  }, [selectedImage, filteredGallery]);

  const handlePrev = useCallback(() => {
    if (filteredGallery.length === 0) return;
    if (currentIndex <= 0) {
      setSelectedImage(filteredGallery[filteredGallery.length - 1]);
    } else {
      setSelectedImage(filteredGallery[currentIndex - 1]);
    }
  }, [filteredGallery, currentIndex]);

  const handleNext = useCallback(() => {
    if (filteredGallery.length === 0) return;
    if (currentIndex >= filteredGallery.length - 1) {
      setSelectedImage(filteredGallery[0]);
    } else {
      setSelectedImage(filteredGallery[currentIndex + 1]);
    }
  }, [filteredGallery, currentIndex]);

  // Soporte de navegación por teclado en el modal ampliado
  useEffect(() => {
    if (!selectedImage) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedImage(null);
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, handlePrev, handleNext]);

  const resolveImageSrc = (src: string) => {
    if (!src) return '/assets/img/logo-capablanca.png';
    return src.startsWith('/') || src.startsWith('http') ? src : `/${src}`;
  };

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
      <section className="section" style={{ background: '#0a0a0a', color: '#fff', minHeight: '60vh', paddingBottom: '4rem' }}>
        <div className="wrap">
          {/* Barra de Filtros por Categoría con conteo */}
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.5rem', justifyContent: 'center' }}>
            {categories.map((cat) => {
              const count = cat === 'all' 
                ? gallery.length 
                : gallery.filter((item) => item.category?.toLowerCase() === cat).length;

              const label = cat === 'all' ? 'Todas las Fotos' : (CATEGORY_LABELS[cat] || cat);

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '0.45rem 1.1rem',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    border: selectedCategory === cat ? '1px solid var(--gold)' : '1px solid #333',
                    background: selectedCategory === cat ? 'var(--gold)' : '#141414',
                    color: selectedCategory === cat ? '#000' : '#bbb',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {label} ({count})
                </button>
              );
            })}
          </div>

          {/* Buscador reactivo dentro de la galería */}
          <div style={{ maxWidth: '480px', margin: '0 auto 2.5rem', position: 'relative' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '1.1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--gold)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por momento, torneo, jugador o pie de foto..."
              style={{
                width: '100%',
                padding: '0.75rem 2.8rem 0.75rem 2.8rem',
                borderRadius: '30px',
                background: '#141414',
                border: '1px solid #333',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--gold)';
                e.currentTarget.style.boxShadow = '0 0 12px rgba(245, 197, 24, 0.2)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#333';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#888',
                  cursor: 'pointer',
                  padding: '0.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Limpiar búsqueda"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: '#888' }}>
              Cargando galería fotográfica...
            </div>
          ) : filteredGallery.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', background: '#141414', borderRadius: '16px', border: '1px solid #282828', maxWidth: '520px', margin: '0 auto' }}>
              <ImageIcon size={44} style={{ color: 'var(--gold)', margin: '0 auto 1rem', opacity: 0.7 }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                {searchQuery ? 'No se encontraron fotografías' : 'No hay fotografías en esta categoría'}
              </h3>
              <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                {searchQuery
                  ? `No se hallaron coincidencias para "${searchQuery}". Intenta con otros términos.`
                  : 'Prueba seleccionando otra categoría o restablece el filtro.'}
              </p>
              <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="btn btn--secondary"
                    style={{ fontSize: '0.85rem' }}
                  >
                    Limpiar búsqueda
                  </button>
                )}
                {selectedCategory !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className="btn btn--secondary"
                    style={{ fontSize: '0.85rem' }}
                  >
                    Ver todas las fotos
                  </button>
                )}
              </div>
            </div>
          ) : (
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
                    transition: 'transform 0.3s ease, border-color 0.3s ease',
                  }}
                  className="gallery-card"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.borderColor = 'rgba(245, 197, 24, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.borderColor = '#222';
                  }}
                >
                  <img
                    src={resolveImageSrc(item.src)}
                    alt={item.alt}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)',
                      opacity: 0,
                      transition: 'opacity 0.3s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      padding: '1.2rem',
                    }}
                    className="gallery-overlay"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '0';
                    }}
                  >
                    <p style={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem', margin: 0 }}>{item.caption}</p>
                    <span style={{ color: 'var(--gold)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.4rem' }}>
                      <ZoomIn size={14} /> Ampliar fotografía
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Modal de visualización ampliada (Lightbox interactivo) */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.94)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          {/* Botón Anterior */}
          {filteredGallery.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              style={{
                position: 'absolute',
                left: '1.5rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(20, 20, 20, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                zIndex: 10001,
              }}
              title="Foto anterior (Flecha izquierda)"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--gold)';
                e.currentTarget.style.color = '#000';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(20, 20, 20, 0.75)';
                e.currentTarget.style.color = '#fff';
              }}
            >
              <ChevronLeft size={28} />
            </button>
          )}

          {/* Botón Siguiente */}
          {filteredGallery.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              style={{
                position: 'absolute',
                right: '1.5rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(20, 20, 20, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                zIndex: 10001,
              }}
              title="Foto siguiente (Flecha derecha)"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--gold)';
                e.currentTarget.style.color = '#000';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(20, 20, 20, 0.75)';
                e.currentTarget.style.color = '#fff';
              }}
            >
              <ChevronRight size={28} />
            </button>
          )}

          {/* Contenedor central de la foto */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'relative', maxWidth: '960px', width: '100%', textAlign: 'center' }}
          >
            {/* Botón Cerrar */}
            <button
              onClick={() => setSelectedImage(null)}
              style={{
                position: 'absolute',
                top: '-46px',
                right: '0',
                background: 'none',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.9rem',
                opacity: 0.85,
              }}
              title="Cerrar visor (Esc)"
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.85')}
            >
              <span>Cerrar</span>
              <X size={26} />
            </button>

            {/* Imagen activa */}
            <img
              src={resolveImageSrc(selectedImage.src)}
              alt={selectedImage.alt}
              style={{
                maxWidth: '100%',
                maxHeight: '76vh',
                borderRadius: '12px',
                boxShadow: '0 25px 50px rgba(0,0,0,0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                objectFit: 'contain',
              }}
            />

            {/* Pie informativo de la foto */}
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.8rem', paddingInline: '0.5rem' }}>
              <div style={{ textAlign: 'left' }}>
                <p style={{ color: 'var(--gold)', margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
                  {selectedImage.caption}
                </p>
                <p style={{ color: '#aaa', margin: '0.2rem 0 0', fontSize: '0.85rem' }}>
                  {selectedImage.alt}
                </p>
              </div>

              {/* Botones de acción, categoría y posición */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <span style={{ background: '#1c1c1c', border: '1px solid #333', color: '#ccc', padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.78rem' }}>
                  {selectedImage.category ? (CATEGORY_LABELS[selectedImage.category.toLowerCase()] || selectedImage.category) : 'General'}
                </span>
                {filteredGallery.length > 1 && (
                  <span style={{ color: 'var(--gold)', fontSize: '0.85rem', fontWeight: 700, padding: '0 0.3rem' }}>
                    {currentIndex + 1} / {filteredGallery.length}
                  </span>
                )}
                <a
                  href={resolveImageSrc(selectedImage.src)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #444',
                    background: '#1a1a1a',
                    color: '#eee',
                    fontSize: '0.8rem',
                    textDecoration: 'none',
                    fontWeight: 500,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--gold)';
                    e.currentTarget.style.color = 'var(--gold)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#444';
                    e.currentTarget.style.color = '#eee';
                  }}
                  title="Abrir imagen original en pestaña nueva"
                >
                  <ExternalLink size={13} />
                  <span>Original</span>
                </a>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`📸 ¡Fotografía del Club de Ajedrez Capablanca Sabaneta!\n"${selectedImage.caption}"\nMírala en: ${window.location.origin}/galeria`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.35rem 0.8rem',
                    borderRadius: '8px',
                    border: '1px solid #25D366',
                    background: '#25D366',
                    color: '#000',
                    fontSize: '0.8rem',
                    textDecoration: 'none',
                    fontWeight: 700,
                    transition: 'opacity 0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                  title="Compartir por WhatsApp"
                >
                  <MessageCircle size={13} />
                  <span>Compartir</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
