// Utilidades de resolución, normalización y respaldo de imágenes para el Club Capablanca
import React from 'react';
import { supabase } from './supabase';

const FALLBACK_LOGO = '/assets/img/logo-capablanca.png';

/**
 * Normaliza cualquier ruta de imagen (local relativa, local absoluta, Supabase Storage o externa)
 * para asegurar que nunca se rompa en rutas anidadas de React Router (como /blog/:slug).
 */
export function normalizeImageUrl(src?: string | null, fallback = FALLBACK_LOGO): string {
  if (!src || typeof src !== 'string' || src.trim() === '') {
    return fallback;
  }

  const trimmed = src.trim();

  // URLs externas, data URIs o blob URIs
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  // Rutas locales que ya inician con /
  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  // Rutas relativas del tipo 'assets/img/...' -> convertir a '/assets/img/...'
  if (trimmed.startsWith('assets/')) {
    return '/' + trimmed;
  }

  // Si es solo el nombre de un archivo webp/png/jpg local (ej. 'campeon-sub8.webp')
  if (/\.(webp|png|jpe?g|svg|gif|avif)$/i.test(trimmed) && !trimmed.includes('/')) {
    return '/assets/img/' + trimmed;
  }

  // Si es una ruta interna de Supabase Storage en el bucket 'gallery'
  try {
    const { data } = supabase.storage.from('gallery').getPublicUrl(trimmed);
    if (data?.publicUrl) {
      return data.publicUrl;
    }
  } catch {
    // Si falla la resolución de Storage, usar fallback
  }

  return '/' + trimmed;
}

/**
 * Manejador onError para elementos <img>.
 * Si la imagen remota o local no se encuentra (404 / CORS), reemplaza automáticamente
 * la fuente por el logo oficial del club para evitar íconos rotos en la interfaz.
 */
export function handleImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  fallback = FALLBACK_LOGO
): void {
  const target = e.currentTarget;
  if (!target.dataset.hasFailed) {
    target.dataset.hasFailed = 'true';
    target.src = fallback;
    target.classList.add('img-fallback-applied');
  }
}
