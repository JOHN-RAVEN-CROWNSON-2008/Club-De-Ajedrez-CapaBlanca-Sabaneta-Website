import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { uploadPublicFile, uploadPrivateFile, UploadBucket } from '../../lib/storage';

interface FileUploadFieldProps {
  bucket: UploadBucket;
  mode: 'public' | 'private';
  folder?: string;
  ownerId?: string;
  accept?: string;
  label?: string;
  onUploaded: (result: string, file: File) => void;
  disabled?: boolean;
}

/**
 * Campo de subida reutilizable: sube el archivo a Supabase Storage al
 * seleccionarlo y entrega a onUploaded() la URL pública (modo "public")
 * o la ruta interna del bucket privado (modo "private").
 */
export const FileUploadField: React.FC<FileUploadFieldProps> = ({
  bucket,
  mode,
  folder,
  ownerId,
  accept,
  label = 'Subir archivo desde tu equipo',
  onUploaded,
  disabled,
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const result =
        mode === 'private'
          ? await uploadPrivateFile(bucket, file, ownerId || 'anon')
          : await uploadPublicFile(bucket, file, folder);
      onUploaded(result, file);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al subir el archivo');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
      <label
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.7rem 1rem',
          borderRadius: '8px',
          border: '1px dashed #444',
          background: '#1a1a1a',
          color: uploading ? '#888' : 'var(--gold)',
          cursor: disabled || uploading ? 'not-allowed' : 'pointer',
          fontSize: '0.85rem',
          fontWeight: 600,
          width: 'fit-content',
        }}
      >
        <Upload size={16} />
        {uploading ? 'Subiendo...' : label}
        <input
          type="file"
          accept={accept}
          onChange={handleChange}
          disabled={disabled || uploading}
          style={{ display: 'none' }}
        />
      </label>
      {error && <span style={{ color: '#ff8a80', fontSize: '0.78rem' }}>{error}</span>}
    </div>
  );
};
