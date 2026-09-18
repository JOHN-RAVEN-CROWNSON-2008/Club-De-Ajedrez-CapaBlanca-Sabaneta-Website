// Exportador del Carnet Digital de Afiliado a Imagen PNG de Alta Definición (300 DPI ID-1)
// Dibuja la credencial en HTML5 Canvas con diseño institucional y código QR dinámico integrado.

import { generateQrMatrix } from './qrCode';

export interface AthleteCardExportData {
  id?: string;
  nombre: string;
  apellido: string;
  correo?: string;
  categoria_ajedrez?: string;
  elo_rating?: number;
  fide_id?: string;
  ciudad?: string;
}

export async function exportAthleteCardAsPng(
  member: AthleteCardExportData,
  certCode: string,
  verificationUrl: string
): Promise<boolean> {
  try {
    const canvas = document.createElement('canvas');
    const W = 1050;
    const H = 660;
    canvas.width = W;
    canvas.height = H;

    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    // 1. Trazado de Esquinas Redondeadas (Radio 36px)
    const R = 36;
    ctx.beginPath();
    ctx.moveTo(R, 0);
    ctx.lineTo(W - R, 0);
    ctx.quadraticCurveTo(W, 0, W, R);
    ctx.lineTo(W, H - R);
    ctx.quadraticCurveTo(W, H, W - R, H);
    ctx.lineTo(R, H);
    ctx.quadraticCurveTo(0, H, 0, H - R);
    ctx.lineTo(0, R);
    ctx.quadraticCurveTo(0, 0, R, 0);
    ctx.closePath();
    ctx.clip();

    // 2. Fondo Degradado de Lujo (Oro Profundo / Carbón)
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, '#1f1a10');
    bgGrad.addColorStop(0.45, '#0b0b0b');
    bgGrad.addColorStop(1, '#18150d');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // 3. Marca de Agua Decorativa (Caballo de Ajedrez Institucional)
    ctx.save();
    ctx.font = '900 380px sans-serif';
    ctx.fillStyle = 'rgba(212, 175, 55, 0.05)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('♞', W + 30, H + 60);
    ctx.restore();

    // 4. Borde Dorado Perimetral
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 6;
    ctx.stroke();

    // 5. Encabezado del Carnet
    // Intentar cargar logo oficial si está disponible en el DOM o memoria
    let logoDrawn = false;
    const existingLogoImg = document.querySelector('img[src*="logo-capablanca"]') as HTMLImageElement | null;
    if (existingLogoImg && existingLogoImg.complete && existingLogoImg.naturalWidth > 0) {
      try {
        ctx.drawImage(existingLogoImg, 50, 45, 60, 60);
        logoDrawn = true;
      } catch {}
    }

    if (!logoDrawn) {
      // Escudo con caballo estilizado
      ctx.fillStyle = '#d4af37';
      ctx.beginPath();
      ctx.arc(80, 75, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '900 32px sans-serif';
      ctx.fillStyle = '#000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('♞', 80, 75);
    }

    // Texto de Cabecera
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = '900 24px sans-serif';
    ctx.fillStyle = '#d4af37';
    ctx.fillText('CLUB DEPORTIVO DE AJEDREZ CAPABLANCA', 125, 48);

    ctx.font = '700 15px sans-serif';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText('SABANETA · ANTIOQUIA · PERSONERÍA DEPORTIVA RES. 042', 125, 80);

    // Píldora de Vigencia
    ctx.save();
    ctx.fillStyle = '#d4af37';
    const pillW = 150;
    const pillH = 34;
    const pillX = W - 50 - pillW;
    const pillY = 58;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(pillX, pillY, pillW, pillH, 8) : ctx.rect(pillX, pillY, pillW, pillH);
    ctx.fill();

    ctx.font = '900 14px sans-serif';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('VIGENCIA 2026', pillX + pillW / 2, pillY + pillH / 2);
    ctx.restore();

    // Línea Divisoria Superior
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(50, 130);
    ctx.lineTo(W - 50, 130);
    ctx.stroke();

    // 6. Avatar del Deportista (Círculo con relieve dorado)
    const avatarX = 125;
    const avatarY = 270;
    const avatarR = 68;

    // Resplandor dorado
    const glow = ctx.createRadialGradient(avatarX, avatarY, avatarR - 10, avatarX, avatarY, avatarR + 20);
    glow.addColorStop(0, 'rgba(212, 175, 55, 0.4)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarR + 15, 0, Math.PI * 2);
    ctx.fill();

    // Fondo del Avatar
    const avGrad = ctx.createLinearGradient(avatarX - avatarR, avatarY - avatarR, avatarX + avatarR, avatarY + avatarR);
    avGrad.addColorStop(0, '#f5c518');
    avGrad.addColorStop(1, '#9a7008');
    ctx.fillStyle = avGrad;
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI * 2);
    ctx.fill();

    // Borde blanco interior
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Letra inicial
    const initial = (member.nombre || 'C').charAt(0).toUpperCase();
    ctx.font = '900 66px sans-serif';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initial, avatarX, avatarY + 3);

    // 7. Datos Centrales del Deportista
    const textStartX = 230;

    // Nombre Completo
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = '900 38px sans-serif';
    ctx.fillStyle = '#ffffff';
    const fullName = `${member.nombre} ${member.apellido}`.trim() || 'Afiliado Oficial';
    ctx.fillText(fullName, textStartX, 195);

    // Categoría Ajedrecística
    ctx.font = '800 20px sans-serif';
    ctx.fillStyle = '#d4af37';
    ctx.fillText((member.categoria_ajedrez || 'INICIACIÓN / ABIERTA').toUpperCase(), textStartX, 250);

    // Tarjetas Métricas (Elo Club, FIDE ID, Estado)
    const statsY = 295;
    const statBoxWidth = 140;

    // Caja 1: ELO CLUB
    ctx.fillStyle = '#888888';
    ctx.font = '700 13px sans-serif';
    ctx.fillText('ELO CLUB', textStartX, statsY);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 26px sans-serif';
    ctx.fillText(String(member.elo_rating || '—'), textStartX, statsY + 20);

    // Caja 2: FIDE ID
    ctx.fillStyle = '#888888';
    ctx.font = '700 13px sans-serif';
    ctx.fillText('FIDE ID', textStartX + statBoxWidth, statsY);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 22px sans-serif';
    ctx.fillText(member.fide_id || 'En trámite', textStartX + statBoxWidth, statsY + 22);

    // Caja 3: ESTADO
    ctx.fillStyle = '#888888';
    ctx.font = '700 13px sans-serif';
    ctx.fillText('ESTADO', textStartX + statBoxWidth * 2, statsY);
    ctx.fillStyle = '#4ade80';
    ctx.font = '900 24px sans-serif';
    ctx.fillText('Activo ✓', textStartX + statBoxWidth * 2, statsY + 20);

    // 8. Código QR Dinámico Integrado en el Cuadrante Derecho
    const qrMatrix = generateQrMatrix(verificationUrl);
    const qrN = qrMatrix.length;
    const qrSize = 140;
    const qrX = W - 50 - qrSize;
    const qrY = 220;
    const cell = qrSize / qrN;

    // Fondo protector para el QR
    ctx.fillStyle = 'rgba(15, 15, 15, 0.85)';
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect
      ? ctx.roundRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 10)
      : ctx.rect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);
    ctx.fill();
    ctx.stroke();

    // Dibujar módulos del QR en dorado contrastado
    ctx.fillStyle = '#f5c518';
    for (let r = 0; r < qrN; r++) {
      for (let c = 0; c < qrN; c++) {
        if (qrMatrix[r][c]) {
          ctx.fillRect(qrX + c * cell, qrY + r * cell, cell + 0.3, cell + 0.3);
        }
      }
    }

    // Etiqueta debajo del QR
    ctx.font = '700 11px sans-serif';
    ctx.fillStyle = '#bbbbbb';
    ctx.textAlign = 'center';
    ctx.fillText('ESCANEAR PARA VALIDAR', qrX + qrSize / 2, qrY + qrSize + 18);

    // 9. Pie del Carnet
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, H - 110);
    ctx.lineTo(W - 50, H - 110);
    ctx.stroke();

    // Código Oficial y Ciudad
    ctx.textAlign = 'left';
    ctx.font = '700 13px sans-serif';
    ctx.fillStyle = '#888888';
    ctx.fillText('CÓDIGO OFICIAL DE AFILIACIÓN', 50, H - 90);

    ctx.font = '900 24px monospace';
    ctx.fillStyle = '#d4af37';
    ctx.fillText(certCode, 50, H - 65);

    // Sello Legal Inder Sabaneta
    ctx.textAlign = 'right';
    ctx.font = '700 14px sans-serif';
    ctx.fillStyle = '#cccccc';
    ctx.fillText('Club Deportivo Afiliado a la Liga de Ajedrez de Antioquia', W - 50, H - 85);
    ctx.font = '600 13px sans-serif';
    ctx.fillStyle = '#d4af37';
    ctx.fillText('Reconocimiento Deportivo Inder Sabaneta · NIT 901.445.892-1', W - 50, H - 60);

    // 10. Disparar Descarga Automática del PNG
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(false);
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const cleanName = fullName.toLowerCase().replace(/[^a-z0-9]/g, '_');
        a.download = `Carnet_Capablanca_${cleanName}_${certCode}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        resolve(true);
      }, 'image/png');
    });
  } catch (err) {
    console.error('Error al exportar carnet en canvas:', err);
    return false;
  }
}
