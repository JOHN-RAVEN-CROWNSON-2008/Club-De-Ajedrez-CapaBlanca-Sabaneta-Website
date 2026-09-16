import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { INITIAL_POSTS } from '../../lib/initialData';
import { Post } from '../../types/database';
import { Calendar, ArrowRight, BookOpen } from 'lucide-react';

export const BlogView: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [loading, setLoading] = useState<boolean>(true);

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
        </div>
      </section>

      {/* Listado de Posts */}
      <section className="section" style={{ background: '#0e0e0e', color: '#fff', minHeight: '60vh' }}>
        <div className="wrap">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: '#888' }}>
              Cargando artículos...
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2.5rem' }}>
              {posts.map((post) => (
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
                        <Link to={`/blog/${post.slug}`} style={{ color: '#fff' }}>
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
                        style={{ color: 'var(--gold)', fontWeight: 600, fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
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
