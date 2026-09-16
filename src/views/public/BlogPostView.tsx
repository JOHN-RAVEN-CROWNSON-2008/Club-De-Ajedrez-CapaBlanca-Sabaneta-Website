import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { INITIAL_POSTS } from '../../lib/initialData';
import { Post } from '../../types/database';
import { ArrowLeft, Calendar, User, Share2 } from 'lucide-react';

export const BlogPostView: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadPost() {
      if (!isSupabaseConfigured()) {
        const found = INITIAL_POSTS.find((p) => p.slug === slug);
        setPost(found || null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('slug', slug)
          .single();

        if (error || !data) {
          const found = INITIAL_POSTS.find((p) => p.slug === slug);
          setPost(found || null);
        } else {
          setPost(data as Post);
        }
      } catch {
        const found = INITIAL_POSTS.find((p) => p.slug === slug);
        setPost(found || null);
      } finally {
        setLoading(false);
      }
    }

    loadPost();
  }, [slug]);

  if (loading) {
    return (
      <div style={{ paddingTop: 'calc(var(--header-h) + 4rem)', textAlign: 'center', minHeight: '60vh', color: '#fff' }}>
        Cargando artículo...
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{ paddingTop: 'calc(var(--header-h) + 4rem)', textAlign: 'center', minHeight: '60vh', color: '#fff' }}>
        <h2>Artículo no encontrado</h2>
        <p style={{ color: '#aaa', margin: '1rem 0 2rem' }}>La publicación solicitada no existe o fue retirada.</p>
        <Link to="/blog" className="btn btn--primary">
          Volver al blog
        </Link>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 'calc(var(--header-h) + 2rem)', background: '#0d0d0d', color: '#fff', minHeight: '100vh' }}>
      <div className="wrap-narrow" style={{ paddingBlock: '3rem' }}>
        <Link
          to="/blog"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--gold)', marginBottom: '2rem', fontWeight: 600 }}
        >
          <ArrowLeft size={18} />
          <span>Volver al blog</span>
        </Link>

        <span className="pill pill--gold" style={{ marginBottom: '1rem', display: 'inline-block' }}>
          {post.category}
        </span>

        <h1 className="display display--gold" style={{ fontSize: 'var(--step-4)', lineHeight: 1.15, marginBottom: '1.5rem' }}>
          {post.title}
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', color: '#888', fontSize: '0.9rem', marginBottom: '2rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Calendar size={16} />
            {post.created_at ? new Date(post.created_at).toLocaleDateString('es-CO') : ''}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <User size={16} />
            Cuerpo Técnico Capablanca
          </span>
        </div>

        {post.cover_image && (
          <div style={{ borderRadius: '16px', overflow: 'hidden', marginBottom: '2.5rem', border: '1px solid #222' }}>
            <img src={post.cover_image} alt={post.title} style={{ width: '100%', height: 'auto', display: 'block' }} />
          </div>
        )}

        <div
          style={{
            fontSize: '1.1rem',
            lineHeight: 1.8,
            color: '#ddd',
            whiteSpace: 'pre-line',
          }}
        >
          {post.content}
        </div>

        <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid #282828', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#888', fontSize: '0.9rem' }}>
            ¿Te gustó este artículo? Compártelo con otros ajedrecistas.
          </span>
          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${post.title} - ${window.location.href}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn--ghost btn--sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Share2 size={16} />
            <span>Compartir</span>
          </a>
        </div>
      </div>
    </div>
  );
};
