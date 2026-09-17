import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { INITIAL_POSTS } from '../../lib/initialData';
import { Post } from '../../types/database';
import { ArrowLeft, Calendar, User, Share2, Copy, Check, MessageCircle, ArrowRight, GraduationCap } from 'lucide-react';

export const BlogPostView: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    async function loadPost() {
      if (!isSupabaseConfigured()) {
        const found = INITIAL_POSTS.find((p) => p.slug === slug);
        setPost(found || null);
        setRelatedPosts(INITIAL_POSTS.filter((p) => p.slug !== slug).slice(0, 2));
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

        const { data: allData } = await supabase
          .from('posts')
          .select('*')
          .eq('published', true)
          .neq('slug', slug)
          .limit(2);

        if (allData && allData.length > 0) {
          setRelatedPosts(allData as Post[]);
        } else {
          setRelatedPosts(INITIAL_POSTS.filter((p) => p.slug !== slug).slice(0, 2));
        }
      } catch {
        const found = INITIAL_POSTS.find((p) => p.slug === slug);
        setPost(found || null);
        setRelatedPosts(INITIAL_POSTS.filter((p) => p.slug !== slug).slice(0, 2));
      } finally {
        setLoading(false);
      }
    }

    loadPost();
  }, [slug]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share && post) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt || post.title,
          url: window.location.href,
        });
        return;
      } catch {
        // user cancelled
      }
    }
    handleCopyLink();
  };

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

        {/* Barra de Difusión y Compartir */}
        <div style={{ marginTop: '3.5rem', paddingTop: '1.5rem', borderTop: '1px solid #282828', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <span style={{ color: '#aaa', fontSize: '0.9rem' }}>
            ¿Te gustó este análisis? Compártelo con la comunidad ajedrecística:
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`♟️ ${post.title}\n\nLee la crónica completa del Club Capablanca Sabaneta aquí:\n${window.location.href}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--sm"
              style={{ background: '#25D366', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.8rem' }}
              title="Compartir por WhatsApp"
            >
              <MessageCircle size={15} />
              <span>WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={handleCopyLink}
              className="btn btn--ghost btn--sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
              title="Copiar enlace al portapapeles"
            >
              {copied ? <Check size={15} color="#4ade80" /> : <Copy size={15} />}
              <span>{copied ? '¡Copiado!' : 'Copiar Enlace'}</span>
            </button>

            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="btn btn--ghost btn--sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
                title="Compartir mediante el navegador"
              >
                <Share2 size={15} />
                <span>Compartir</span>
              </button>
            )}
          </div>
        </div>

        {/* Banner CTA Formativo */}
        <div
          style={{
            marginTop: '3.5rem',
            padding: '2.5rem 2rem',
            background: 'linear-gradient(135deg, #161616 0%, #1c1809 100%)',
            border: '1px solid #332a10',
            borderRadius: '16px',
            textAlign: 'center',
          }}
        >
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(245, 197, 24, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'var(--gold)' }}>
            <GraduationCap size={24} />
          </div>
          <h2 style={{ fontSize: '1.5rem', color: '#fff', margin: '0 0 0.8rem' }}>
            ¿Quieres llevar tu ajedrez al siguiente nivel?
          </h2>
          <p style={{ color: '#ccc', maxWidth: '580px', margin: '0 auto 1.8rem', lineHeight: 1.6, fontSize: '0.95rem' }}>
            Únete a nuestros entrenamientos presenciales en el <strong>CC Aves María (piso 3)</strong> y clases virtuales con maestros federados para todas las edades y niveles.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/afiliarse" className="btn btn--primary">
              Radicar Solicitud de Admisión
            </Link>
            <Link to="/programas" className="btn btn--ghost">
              Ver Horarios & Programas
            </Link>
          </div>
        </div>

        {/* Publicaciones Relacionadas */}
        {relatedPosts.length > 0 && (
          <div style={{ marginTop: '4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.3rem', color: '#fff', margin: 0 }}>Otras Lecturas Recomendadas</h3>
              <Link to="/blog" style={{ color: 'var(--gold)', fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                <span>Ver todo el blog</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {relatedPosts.map((rel) => (
                <Link
                  key={rel.id}
                  to={`/blog/${rel.slug}`}
                  style={{
                    background: '#141414',
                    border: '1px solid #222',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    textDecoration: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, border-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--gold)';
                    e.currentTarget.style.transform = 'translateY(-3px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#222';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {rel.cover_image && (
                    <div style={{ height: '140px', overflow: 'hidden' }}>
                      <img src={rel.cover_image} alt={rel.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <div style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                      {rel.category}
                    </span>
                    <h4 style={{ color: '#fff', fontSize: '1.05rem', margin: '0 0 0.6rem', lineHeight: 1.3 }}>
                      {rel.title}
                    </h4>
                    <p style={{ color: '#888', fontSize: '0.85rem', margin: 0, lineHeight: 1.5, flex: 1 }}>
                      {rel.excerpt ? (rel.excerpt.length > 90 ? `${rel.excerpt.slice(0, 90)}...` : rel.excerpt) : ''}
                    </p>
                    <span style={{ color: 'var(--gold)', fontSize: '0.82rem', fontWeight: 600, marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span>Leer artículo</span>
                      <ArrowRight size={13} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
