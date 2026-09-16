// Utilidades de subida de archivos a Supabase Storage
import { supabase } from './supabase';

export type UploadBucket = 'gallery' | 'documents' | 'payment-receipts' | 'avatars';

const MAX_FILE_SIZE_MB = 15;

function sanitizeFileName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .toLowerCase();
}

function assertSize(file: File) {
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    throw new Error(`El archivo supera el límite de ${MAX_FILE_SIZE_MB} MB`);
  }
}

/**
 * Sube un archivo a un bucket público (gallery, documents, avatars) y devuelve
 * la URL pública lista para guardar en la tabla correspondiente.
 */
export async function uploadPublicFile(bucket: UploadBucket, file: File, folder = ''): Promise<string> {
  assertSize(file);
  const path = `${folder ? folder.replace(/^\/|\/$/g, '') + '/' : ''}${Date.now()}-${sanitizeFileName(file.name)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Sube un archivo a un bucket privado (payment-receipts) dentro de la carpeta
 * del propietario y devuelve la RUTA interna (no la URL pública, porque el
 * bucket es privado). Esa ruta se guarda en la base de datos y se resuelve
 * a una URL firmada temporal con getSignedUrl() al momento de visualizarla.
 */
export async function uploadPrivateFile(bucket: UploadBucket, file: File, ownerId: string): Promise<string> {
  assertSize(file);
  const path = `${ownerId}/${Date.now()}-${sanitizeFileName(file.name)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;
  return path;
}

/**
 * Genera una URL firmada temporal para un archivo de un bucket privado.
 * Devuelve null si el archivo no existe o el usuario no tiene permiso (RLS).
 */
export async function getSignedUrl(bucket: UploadBucket, path: string, expiresInSeconds = 3600): Promise<string | null> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSeconds);
  if (error) {
    console.error(`Error generando enlace firmado para ${bucket}/${path}:`, error);
    return null;
  }
  return data.signedUrl;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
