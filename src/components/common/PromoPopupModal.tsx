import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { PromoPopup } from '../../types/database';
import { INITIAL_PROMO_POPUPS } from '../../lib/initialData';
import { X, ExternalLink, ArrowRight, Megaphone } from 'lucide-react';

export const PromoPopupModal: React.FC = () => {
  const [activePopup, setActivePopup] = useState<PromoPopup | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    async function evaluatePopups() {
      // No mostrar pop-ups en paneles administrativos ni portal de afiliados
      if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/afiliados')) {
        setIsOpen(false);
        return;
      }

      let popups: PromoPopup[] = [];
      if (isSupabaseConfigured()) {
        try {
          const now = new Date().toISOString();
          const { data, error } = await supabase
            .from('promo_popups')
            .select('*')
            .eq('active', true);

          if (!error && data && data.length > 0) {
            popups = data as PromoPopup[];
          } else {
            popups = INITIAL_PROMO_POPUPS;
          }
        } catch {
          popups = INITIAL_PROMO_POPUPS;
        }
      } else {
        popups = INITIAL_PROMO_POPUPS;
      }

      if (!isMounted) return;

      const nowTime = new Date().getTime();
      const currentPath = location.pathname;

      // Buscar el primer pop-up que cumpla las condiciones de vigencia, página y frecuencia
      const candidate = popups.find((p) => {
        if (!p.active) return false;

        // Validar vigencia de fechas
        if (p.starts_at && new Date(p.starts_at).getTime() > nowTime) return false;
        if (p.ends_at && new Date(p.ends_at).getTime() < nowTime) return false;

        // Validar segmentación de páginas
        const matchesPage =
          p.pages.includes('*') ||
          p.pages.includes(currentPath) ||
          (p.pages.includes('home') && (currentPath === '/' || currentPath === ''));
        if (!matchesPage) return false;

        // Validar frecuencia
        if (p.frequency === 'once_per_session') {
          const sessionSeen = sessionStorage.getItem(`capablanca_popup_seen_${p.id}`);
          if (sessionSeen) return false;
        } else if (p.frequency === 'once_per_day') {
          const today = new Date().toISOString().split('T')[0];
          const lastSeenDay = localStorage.getItem(`capablanca_popup_day_${p.id}`);
          if (lastSeenDay === today) return false;
        }

        return true;
      });

      if (candidate) {
        // Pequeño retardo de cortesía para no bloquear la carga inicial
        const timer = setTimeout(() => {
          if (!isMounted) return;
          setActivePopup(candidate);
          setIsOpen(true);

          // Incrementar impresiones en background
          if (isSupabaseConfigured()) {
            supabase
              .from('promo_popups')
              .update({ impressions_count: (candidate.impressions_count || 0) + 1 })
              .eq('id', candidate.id)
              .then(() => {}, () => {});
          }
        }, 1200);

        return () => clearTimeout(timer);
      }
    }

    evaluatePopups();

    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  const handleDismiss = () => {
    if (!activePopup) return;

    if (activePopup.frequency === 'once_per_session') {
      sessionStorage.setItem(`capablanca_popup_seen_${activePopup.id}`, 'true');
    } else if (activePopup.frequency === 'once_per_day') {
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem(`capablanca_popup_day_${activePopup.id}`, today);
    }

    setIsOpen(false);
  };

  const handleActionClick = () => {
    if (!activePopup) return;

    // Incrementar clics en background
    if (isSupabaseConfigured()) {
      supabase
        .from('promo_popups')
        .update({ clicks_count: (activePopup.clicks_count || 0) + 1 })
        .eq('id', activePopup.id)
        .then(() => {}, () => {});
    }

    handleDismiss();

    // Redirección inteligente según el link_type
    const target = activePopup.link_value;
    if (activePopup.link_type === 'external_url' || target.startsWith('http://') || target.startsWith('https://')) {
      window.open(target, '_blank', 'noopener,noreferrer');
    } else {
      navigate(target);
    }
  };

  if (!isOpen || !activePopup) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.2rem',
        animation: 'fadeIn 0.3s ease-out',
      }}
      onClick={handleDismiss}
    >
      <div
        style={{
          background: '#161616',
          border: '2px solid var(--gold)',
          borderRadius: '16px',
          maxWidth: '520px',
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(245, 197, 24, 0.2)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón de cierre */}
        <button
          type="button"
          onClick={handleDismiss}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'rgba(0, 0, 0, 0.75)',
            border: '1px solid #444',
            color: '#fff',
            borderRadius: '50%',
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            transition: 'all 0.2s',
          }}
          title="Cerrar aviso"
        >
          <X size={18} />
        </button>

        {/* Imagen del Banner */}
        <div
          onClick={handleActionClick}
          style={{
            cursor: 'pointer',
            position: 'relative',
            maxHeight: '380px',
            overflow: 'hidden',
            background: '#0a0a0a',
          }}
        >
          <img
            src={activePopup.image_url}
            alt={activePopup.title}
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              objectFit: 'cover',
            }}
          />
        </div>

        {/* Barra de pie con título y acción */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            background: '#121212',
            borderTop: '1px solid #282828',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: '1 1 200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--gold)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.2rem' }}>
              <Megaphone size={13} />
              <span>Aviso Oficial Capablanca</span>
            </div>
            <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#fff', fontWeight: 700, lineHeight: 1.3 }}>
              {activePopup.title}
            </h4>
          </div>

          <button
            type="button"
            onClick={handleActionClick}
            className="btn btn--primary btn--sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 700,
              padding: '0.65rem 1.2rem',
              borderRadius: '8px',
            }}
          >
            <span>Ver Más</span>
            {activePopup.link_type === 'external_url' ? <ExternalLink size={15} /> : <ArrowRight size={15} />}
          </button>
        </div>
      </div>
    </div>
  );
};
