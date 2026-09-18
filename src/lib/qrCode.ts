// Generador de Códigos QR ultraliviano y autónomo (Zero-dependency)
// Implementa codificación en Modo Byte con corrección de errores Reed-Solomon
// Genera matrices booleanas y paths SVG de alta fidelidad 100% offline.

const GF256_EXP = new Uint8Array(512);
const GF256_LOG = new Uint8Array(256);

// Inicialización de tablas Galois Field GF(2^8) con polinomio irreducible 0x11D
(function initGaloisField() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF256_EXP[i] = x;
    GF256_EXP[i + 255] = x;
    GF256_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
})();

function gfMul(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return GF256_EXP[GF256_LOG[x] + GF256_LOG[y]];
}

// Generación de polinomios generadores de Reed-Solomon
function rsGenPoly(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1);
    const root = GF256_EXP[i];
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gfMul(poly[j], root);
      next[j + 1] ^= poly[j];
    }
    poly = next;
  }
  return poly;
}

// Cálculo de palabras clave de corrección de error
function rsCalculateEcc(data: Uint8Array, eccCount: number): Uint8Array {
  const genPoly = rsGenPoly(eccCount);
  const remainder = new Uint8Array(eccCount);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ remainder[0];
    remainder.copyWithin(0, 1);
    remainder[eccCount - 1] = 0;
    for (let j = 0; j < eccCount; j++) {
      remainder[j] ^= gfMul(genPoly[j], factor);
    }
  }
  return remainder;
}

// Parámetros de versión QR (Version 3 = 29x29, soporta hasta 77 bytes en Nivel L; Version 4 = 33x33)
interface QrVersionInfo {
  version: number;
  size: number;
  dataCapacity: number;
  eccCount: number;
  alignPos: number[];
}

const QR_VERSIONS: QrVersionInfo[] = [
  { version: 2, size: 25, dataCapacity: 34, eccCount: 10, alignPos: [6, 18] },
  { version: 3, size: 29, dataCapacity: 55, eccCount: 15, alignPos: [6, 22] },
  { version: 4, size: 33, dataCapacity: 80, eccCount: 20, alignPos: [6, 26] },
  { version: 5, size: 37, dataCapacity: 108, eccCount: 26, alignPos: [6, 30] },
];

export function generateQrMatrix(text: string): boolean[][] {
  const utf8Encoder = new TextEncoder();
  const textBytes = utf8Encoder.encode(text);

  // Seleccionar versión mínima necesaria
  let vInfo = QR_VERSIONS.find((v) => textBytes.length + 3 <= v.dataCapacity);
  if (!vInfo) vInfo = QR_VERSIONS[QR_VERSIONS.length - 1];

  const { size, dataCapacity, eccCount, alignPos } = vInfo;

  // Empaquetado en Modo Byte (0100) + Conteo de caracteres + Datos + Padding
  const bitBuffer: number[] = [];
  function pushBits(val: number, len: number) {
    for (let i = len - 1; i >= 0; i--) {
      bitBuffer.push((val >> i) & 1);
    }
  }

  pushBits(0b0100, 4); // Indicador modo byte
  pushBits(textBytes.length, 8); // Conteo de bytes
  for (const b of textBytes) pushBits(b, 8);

  // Terminador
  const maxDataBits = (dataCapacity - eccCount) * 8;
  const terminatorLen = Math.min(4, maxDataBits - bitBuffer.length);
  pushBits(0, terminatorLen);

  // Padding a múltiplo de 8
  while (bitBuffer.length % 8 !== 0) bitBuffer.push(0);

  // Bytes de relleno (0xEC, 0x11)
  const dataBytes = new Uint8Array(dataCapacity - eccCount);
  for (let i = 0; i < bitBuffer.length / 8; i++) {
    let byteVal = 0;
    for (let b = 0; b < 8; b++) {
      byteVal = (byteVal << 1) | bitBuffer[i * 8 + b];
    }
    dataBytes[i] = byteVal;
  }

  let padByte = 0xec;
  for (let i = bitBuffer.length / 8; i < dataBytes.length; i++) {
    dataBytes[i] = padByte;
    padByte = padByte === 0xec ? 0x11 : 0xec;
  }

  // Cálculo de ECC
  const eccBytes = rsCalculateEcc(dataBytes, eccCount);
  const totalCodewords = new Uint8Array(dataCapacity);
  totalCodewords.set(dataBytes, 0);
  totalCodewords.set(eccBytes, dataBytes.length);

  // Creación de la matriz
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const isFunction: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  // 1. Patrones de Posición (Finders 7x7) en (0,0), (0, size-7), (size-7, 0)
  function drawFinder(row: number, col: number) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const tr = row + r;
        const tc = col + c;
        if (tr < 0 || tr >= size || tc < 0 || tc >= size) continue;
        isFunction[tr][tc] = true;
        const inOuter = r >= 0 && r <= 6 && c >= 0 && c <= 6;
        const inInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        const inBorder = r === 0 || r === 6 || c === 0 || c === 6;
        matrix[tr][tc] = (inOuter && inBorder) || inInner;
      }
    }
  }
  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // 2. Patrones de Alineación
  for (const r of alignPos) {
    for (const c of alignPos) {
      if (isFunction[r][c]) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const tr = r + dr;
          const tc = c + dc;
          isFunction[tr][tc] = true;
          matrix[tr][tc] = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
        }
      }
    }
  }

  // 3. Patrones de Sincronización (Timing) en fila 6 y columna 6
  for (let i = 0; i < size; i++) {
    if (!isFunction[6][i]) {
      isFunction[6][i] = true;
      matrix[6][i] = i % 2 === 0;
    }
    if (!isFunction[i][6]) {
      isFunction[i][6] = true;
      matrix[i][6] = i % 2 === 0;
    }
  }

  // Punto oscuro fijo (Dark module)
  matrix[size - 8][8] = true;
  isFunction[size - 8][8] = true;

  // Reservar bits de formato
  for (let i = 0; i < 9; i++) {
    if (i < size) {
      isFunction[8][i] = true;
      isFunction[i][8] = true;
    }
    if (size - 1 - i >= 0) {
      isFunction[8][size - 1 - i] = true;
      isFunction[size - 1 - i][8] = true;
    }
  }

  // 4. Ubicación de datos con máscara (Mask 0: (row + col) % 2 === 0)
  let byteIdx = 0;
  let bitIdx = 7;
  let upwards = true;

  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right--; // Saltar columna de timing
    for (let vert = 0; vert < size; vert++) {
      const r = upwards ? size - 1 - vert : vert;
      for (let c = right; c >= right - 1; c--) {
        if (isFunction[r][c]) continue;
        let bit = false;
        if (byteIdx < totalCodewords.length) {
          bit = ((totalCodewords[byteIdx] >> bitIdx) & 1) === 1;
          bitIdx--;
          if (bitIdx < 0) {
            bitIdx = 7;
            byteIdx++;
          }
        }
        // Aplicar máscara 0
        const mask = (r + c) % 2 === 0;
        matrix[r][c] = mask ? !bit : bit;
      }
    }
    upwards = !upwards;
  }

  // 5. Bits de formato fijos para Nivel L y Máscara 0 (BCH 15 bits: 0x77C4)
  const FORMAT_BITS = 0x77c4;
  for (let i = 0; i < 15; i++) {
    const bit = ((FORMAT_BITS >> i) & 1) === 1;
    // Alrededor de esquina superior izquierda
    if (i <= 5) matrix[8][i] = bit;
    else if (i === 6) matrix[8][7] = bit;
    else if (i === 7) matrix[8][8] = bit;
    else if (i === 8) matrix[7][8] = bit;
    else matrix[14 - i][8] = bit;

    // Repartición en esquinas opuestas
    if (i < 8) matrix[size - 1 - i][8] = bit;
    else matrix[8][size - 15 + i] = bit;
  }

  return matrix;
}

/**
 * Renderiza el QR en formato SVG limpio
 */
export function generateQrSvg(text: string, size = 120, fgColor = '#d4af37', bgColor = 'transparent'): string {
  const matrix = generateQrMatrix(text);
  const n = matrix.length;
  const cellSize = (size / n).toFixed(2);

  let paths = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (matrix[r][c]) {
        paths += `M${(c * Number(cellSize)).toFixed(2)},${(r * Number(cellSize)).toFixed(2)}h${cellSize}v${cellSize}h-${cellSize}z `;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="background-color: ${bgColor};">
    <path d="${paths.trim()}" fill="${fgColor}" />
  </svg>`;
}
