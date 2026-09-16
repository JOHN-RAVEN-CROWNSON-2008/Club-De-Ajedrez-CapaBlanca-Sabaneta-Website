import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { INITIAL_POSTS } from '../../lib/initialData';
import { Post } from '../../types/database';
import { Calendar, ArrowRight, BookOpen, Search } from 'lucide-react';

export const BlogView: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [loading, setLoading] = useState<boolean>(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    async function loadPosts() {
      if (!isSupabaseConfigured()) {
        setPosts(INITIAL_POSTS);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('published', true)
          .order('created_at', { ascending: false });

        if (error || !data || data.length === 0) {
          setPosts(INITIAL_POSTS);
        } else {
          setPosts(data as Post[]);
        }
      } catch (err) {
        console.error('Error al cargar posts de Supabase:', err);
        setPosts(INITIAL_POSTS);
      } finally {
        setLoading(false);
      }
    }

    loadPosts();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesCat = categoryFilter === 'all' || post.category?.toLowerCase() === categoryFilter.toLowerCase();
      if (!matchesCat) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const title = (post.title || '').toLowerCase();
      const excerpt = (post.excerpt || '').toLowerCase();
      const cat = (post.category || '').toLowerCase();
      return title.includes(q) || excerpt.includes(q) || cat.includes(q);
    });
  }, [posts, categoryFilter, searchQuery]);

  return (
    <div style={{ paddingTop: 'calc(var(--header-h) + 2rem)' }}>
      {/* Cabecera */}
      <section className="section section--dark" style={{ textAlign: 'center', paddingBlock: '3rem' }}>
        <div className="wrap-narrow">
          <span className="pill pill--gold">Publicaciones & Análisis</span>
          <h1 className="display display--gold" style={{ fontSize: 'var(--step-4)', marginTop: '1rem' }}>
            Blog y Noticias del Club
          </h1>
          <p style={{ color: '#ccc', fontSize: '1.2rem', marginTop: '1rem', lineHeight: 1.6 }}>
            Crónicas de torneos, consejos formativos de maestros y actualidad sobre el ajedrez antioqueño.
          </p>

          {/* Barra de Búsqueda */}
          <div style={{ maxWidth: '520px', margin: '2rem auto 1.2rem', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1.1rem', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
            <input
              type="text"
              placeholder="Buscar por título, temática o palabra clave..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 2.8rem',
                borderRadius: '30px',
                background: '#161616',
                border: '1px solid #333',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--gold)';
                e.currentTarget.style.boxShadow = '0 0 12px rgba(245, 197, 24, 0.25)';
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
                  right: '1.1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: '#888',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
                title="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filtros de Categoría */}
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              style={{
                padding: '0.4rem 0.95rem',
                borderRadius: '20px',
                fontSize: '0.82rem',
                fontWeight: 600,
                background: categoryFilter === 'all' ? 'var(--gold)' : '#1a1a1a',
                color: categoryFilter === 'all' ? '#000' : '#bbb',
                border: '1px solid #333',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Todos ({posts.length})
            </button>
            {categories.map((cat) => {
              const count = posts.filter((p) => p.category?.toLowerCase() === cat.toLowerCase()).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  style={{
                    padding: '0.4rem 0.95rem',
                    borderRadius: '20px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    background: categoryFilter === cat ? 'var(--gold)' : '#1a1a1a',
                    color: categoryFilter === cat ? '#000' : '#bbb',
                    border: '1px solid #333',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Listado de Posts */}
      <section className="section" style={{ background: '#0e0e0e', color: '#fff', minHeight: '60vh', paddingBlock: '3rem' }}>
        <div className="wrap">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: '#888' }}>
              Cargando artículos...
            </div>
          ) : filteredPosts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', background: '#141414', borderRadius: '16px', border: '1px solid #282828', maxWidth: '600px', margin: '0 auto' }}>
              <BookOpen size={48} style={{ color: 'var(--gold)', margin: '0 auto 1rem', opacity: 0.7 }} />
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>No se encontraron artículos</h3>
              <p style={{ color: '#888', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                No hay publicaciones que coincidan con los filtros o el término de búsqueda actual.
              </p>
              <button
                type="button"
                onClick={() => {
                  setCategoryFilter('all');
                  setSearchQuery('');
                }}
                className="btn btn--secondary"
                style={{ fontSize: '0.85rem' }}
              >
                Restablecer filtros
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2.5rem' }}>
              {filteredPosts.map((post) => (
                <article
                  key={post.id}
                  style={{
                    background: '#171717',
                    border: '1px solid #282828',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.3s ease, border-color 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = 'rgba(245, 197, 24, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = '#282828';
                  }}
                >
                  <div style={{ height: '220px', overflow: 'hidden' }}>
                    <img
                      src={post.cover_image}
                      alt={post.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                    />
                  </div>

                  <div style={{ padding: '1.8rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--gold)', fontWeight: 700, textTransform: 'uppercase' }}>
                          {post.category}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: '#777', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Calendar size={14} />
                          {post.created_at ? new Date(post.created_at).toLocaleDateString('es-CO') : ''}
                        </span>
                      </div>

                      <h2 style={{ fontSize: '1.3rem', fontWeight: 700, lineHeight: 1.4, marginBottom: '0.8rem' }}>
                        <Link to={`/blog/${post.slug}`} style={{ color: '#fff', textDecoration: 'none' }}>
                          {post.title}
                        </Link>
                      </h2>

                      <p style={{ color: '#aaa', fontSize: '0.95rem', lineHeight: 1.6 }}>
                        {post.excerpt}
                      </p>
                    </div>

                    <div style={{ marginTop: '1.5rem', paddingTop: '1.2rem', borderTop: '1px solid #282828' }}>
                      <Link
                        to={`/blog/${post.slug}`}
                        style={{ color: 'var(--gold)', fontWeight: 600, fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}
                      >
                        <span>Leer artículo completo</span>
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
