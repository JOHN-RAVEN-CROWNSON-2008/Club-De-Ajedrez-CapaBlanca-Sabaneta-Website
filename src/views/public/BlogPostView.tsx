import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { INITIAL_POSTS } from '../../lib/initialData';
import { Post } from '../../types/database';
import { normalizeImageUrl, handleImageError } from '../../lib/imageUtils';
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

  // Inyección de SEO y Marcado Estructurado schema.org/Article (GEO/AEO)
  useEffect(() => {
    if (!post) return;

    document.title = `${post.title} | Club Capablanca Sabaneta`;

    // Meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', post.excerpt || post.title);

    // Schema.org Article JSON-LD
    const scriptId = 'schema-article-jsonld';
    let scriptTag = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = scriptId;
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }

    const jsonLdData = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.excerpt,
      image: post.cover_image ? window.location.origin + post.cover_image : undefined,
      datePublished: post.published_at || post.created_at,
      dateModified: post.created_at,
      author: {
        '@type': 'Organization',
        name: 'Cuerpo Técnico - Club Deportivo de Ajedrez Capablanca Sabaneta',
        url: window.location.origin,
      },
      publisher: {
        '@type': 'Organization',
        name: 'Club Deportivo de Ajedrez Capablanca Sabaneta',
        logo: {
          '@type': 'ImageObject',
          url: `${window.location.origin}/assets/img/logo-capablanca.png`,
        },
      },
      articleSection: post.category,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': window.location.href,
      },
    };

    scriptTag.text = JSON.stringify(jsonLdData);

    return () => {
      const existingScript = document.getElementById(scriptId);
      if (existingScript) existingScript.remove();
    };
  }, [post]);

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
      <div style={{ paddingTop: 'calc(var(--content-offset) + 2rem)', textAlign: 'center', minHeight: '60vh', color: '#fff' }}>
        Cargando artículo...
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{ paddingTop: 'calc(var(--content-offset) + 2rem)', textAlign: 'center', minHeight: '60vh', color: '#fff' }}>
        <h2>Artículo no encontrado</h2>
        <p style={{ color: '#aaa', margin: '1rem 0 2rem' }}>La publicación solicitada no existe o fue retirada.</p>
        <Link to="/blog" className="btn btn--primary">
          Volver al blog
        </Link>
      </div>
    );
  }

  // Helper para procesar **negrita**
  const formatInlineText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={pIdx} style={{ color: '#fff', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  // Renderizador semántico de Markdown con soporte H2, H3, figuras con imagen, citas y listas
  const renderFormattedBlogBody = (content: string) => {
    if (!content) return null;

    const blocks = content.split(/\n\s*\n/);

    return blocks.map((block, bIdx) => {
      const trimmed = block.trim();
      if (!trimmed) return null;

      // 1. Imagen en línea: ![alt](url)
      const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (imgMatch) {
        const alt = imgMatch[1] || '';
        const rawUrl = imgMatch[2] || '';
        const url = normalizeImageUrl(rawUrl);
        return (
          <figure
            key={`img-${bIdx}`}
            style={{
              margin: '2.5rem 0',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid #282828',
              background: '#121212',
            }}
          >
            <img
              src={url}
              alt={alt || post.title}
              onError={handleImageError}
              style={{ width: '100%', maxHeight: '480px', objectFit: 'cover', display: 'block' }}
            />
            {alt && (
              <figcaption
                style={{
                  padding: '0.6rem 1rem',
                  fontSize: '0.85rem',
                  color: '#aaa',
                  textAlign: 'center',
                  background: '#181818',
                  borderTop: '1px solid #242424',
                }}
              >
                {alt}
              </figcaption>
            )}
          </figure>
        );
      }

      // 2. Encabezado H2: ## Titulo
      if (trimmed.startsWith('## ')) {
        const titleText = trimmed.replace(/^##\s+/, '');
        return (
          <h2
            key={`h2-${bIdx}`}
            style={{
              fontSize: '1.65rem',
              color: '#fff',
              marginTop: '2.8rem',
              marginBottom: '1rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              borderBottom: '1px solid #262626',
              paddingBottom: '0.5rem',
            }}
          >
            {titleText}
          </h2>
        );
      }

      // 3. Encabezado H3: ### Subtitulo
      if (trimmed.startsWith('### ')) {
        const titleText = trimmed.replace(/^###\s+/, '');
        return (
          <h3
            key={`h3-${bIdx}`}
            style={{
              fontSize: '1.3rem',
              color: 'var(--gold)',
              marginTop: '2rem',
              marginBottom: '0.75rem',
              fontWeight: 700,
            }}
          >
            {titleText}
          </h3>
        );
      }

      // 4. Bloque de Cita / Direct Answer: > Texto
      if (trimmed.startsWith('> ')) {
        const quoteText = trimmed.replace(/^>\s+/, '');
        return (
          <blockquote
            key={`quote-${bIdx}`}
            style={{
              margin: '2rem 0',
              padding: '1.2rem 1.5rem',
              background: 'linear-gradient(90deg, rgba(245,197,24,0.08) 0%, rgba(20,20,20,0.5) 100%)',
              borderLeft: '4px solid var(--gold)',
              borderRadius: '0 10px 10px 0',
              color: '#f3e8c8',
              fontStyle: 'italic',
              fontSize: '1.05rem',
              lineHeight: 1.7,
            }}
          >
            {formatInlineText(quoteText)}
          </blockquote>
        );
      }

      // 5. Lista con viñetas: líneas que inician con - o *
      const lines = trimmed.split('\n');
      const isList = lines.every((l) => l.trim().startsWith('- ') || l.trim().startsWith('* '));
      if (isList && lines.length > 0) {
        return (
          <ul key={`ul-${bIdx}`} style={{ margin: '1.5rem 0', paddingLeft: '1.5rem', listStyle: 'none' }}>
            {lines.map((line, lIdx) => {
              const itemText = line.trim().replace(/^[-*]\s+/, '');
              return (
                <li
                  key={`li-${lIdx}`}
                  style={{
                    position: 'relative',
                    marginBottom: '0.6rem',
                    lineHeight: 1.7,
                    fontSize: '1.05rem',
                    color: '#d4d4d4',
                    paddingLeft: '1.2rem',
                  }}
                >
                  <span style={{ position: 'absolute', left: 0, color: 'var(--gold)', fontWeight: 'bold' }}>•</span>
                  {formatInlineText(itemText)}
                </li>
              );
            })}
          </ul>
        );
      }

      // 6. Párrafo estándar con soporte para saltos de línea internos
      return (
        <p
          key={`p-${bIdx}`}
          style={{
            fontSize: '1.08rem',
            lineHeight: 1.85,
            color: '#d8d8d8',
            margin: '1.25rem 0',
          }}
        >
          {lines.map((line, lIdx) => (
            <React.Fragment key={`line-${lIdx}`}>
              {formatInlineText(line)}
              {lIdx < lines.length - 1 && <br />}
            </React.Fragment>
          ))}
        </p>
      );
    });
  };

  return (
    <div style={{ paddingTop: 'var(--content-offset)', background: '#0d0d0d', color: '#fff', minHeight: '100vh' }}>
      <div className="wrap-narrow" style={{ paddingBlock: '3rem' }}>
        <Link
          to="/blog"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--gold)', marginBottom: '2rem', fontWeight: 600 }}
        >
          <ArrowLeft size={18} />
          <span>Volver al blog</span>
        </Link>

        <span
          style={{
            display: 'inline-block',
            fontSize: '0.85rem',
            color: 'var(--gold)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.75rem',
          }}
        >
          {post.category}
        </span>

        <h1
          className="display display--gold"
          style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            lineHeight: 1.15,
            marginBottom: '1rem',
          }}
        >
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
            <img
              src={normalizeImageUrl(post.cover_image)}
              alt={post.title}
              onError={handleImageError}
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>
        )}

        <div style={{ fontSize: '1.1rem', lineHeight: 1.8, color: '#ddd' }}>
          {renderFormattedBlogBody(post.content)}
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
                      <img
                        src={normalizeImageUrl(rel.cover_image)}
                        alt={rel.title}
                        onError={handleImageError}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
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
