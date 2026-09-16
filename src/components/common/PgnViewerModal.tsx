import React, { useState, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, SkipBack, SkipForward, Copy, Check, ExternalLink, Download, Swords } from 'lucide-react';

interface PgnViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  whitePlayer?: string;
  blackPlayer?: string;
  result?: string;
  eventDate?: string;
  pgn: string;
}

// Representación visual de piezas de ajedrez con glifos Unicode estilizados
const PIECE_SYMBOLS: Record<string, string> = {
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
  '': ''
};

// Posición inicial estándar de ajedrez (Rank 8 a Rank 1)
const INITIAL_BOARD = [
  ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
  ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
  ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'],
];

export const PgnViewerModal: React.FC<PgnViewerModalProps> = ({
  isOpen,
  onClose,
  title,
  whitePlayer = 'Blancas',
  blackPlayer = 'Negras',
  result = '*',
  eventDate,
  pgn
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  // Extraer etiquetas y movimientos limpios del PGN
  const { movesList, cleanPgn } = useMemo(() => {
    if (!pgn) return { movesList: [], cleanPgn: '' };

    // Remover comentarios {...} y etiquetas [Tag "Value"]
    const textWithoutTags = pgn.replace(/\[.*?\]/g, '').replace(/\{.*?\}/g, '').trim();
    // Tokens de movimientos
    const tokens = textWithoutTags.split(/\s+/).filter(t => t && !t.match(/^(1-0|0-1|1\/2-1\/2|\*)$/));
    
    // Agrupar en pares jugada blanca / jugada negra
    const parsedMoves: { moveNumber: number; white: string; black?: string }[] = [];
    let currentMoveNum = 1;
    let currentWhite = '';

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (token.includes('.')) {
        // e.g. "1." o "1.e4"
        const parts = token.split('.');
        const num = parseInt(parts[0], 10);
        if (!isNaN(num)) currentMoveNum = num;
        if (parts[1] && parts[1].length > 0) {
          currentWhite = parts[1];
          if (tokens[i + 1] && !tokens[i + 1].includes('.') && !tokens[i + 1].match(/^(1-0|0-1|1\/2-1\/2|\*)$/)) {
            parsedMoves.push({ moveNumber: currentMoveNum, white: currentWhite, black: tokens[i + 1] });
            i++;
          } else {
            parsedMoves.push({ moveNumber: currentMoveNum, white: currentWhite });
          }
        }
      } else if (!currentWhite) {
        currentWhite = token;
        if (tokens[i + 1] && !tokens[i + 1].includes('.') && !tokens[i + 1].match(/^(1-0|0-1|1\/2-1\/2|\*)$/)) {
          parsedMoves.push({ moveNumber: currentMoveNum, white: currentWhite, black: tokens[i + 1] });
          i++;
        } else {
          parsedMoves.push({ moveNumber: currentMoveNum, white: currentWhite });
        }
        currentWhite = '';
      }
    }

    return { movesList: parsedMoves, cleanPgn: pgn };
  }, [pgn]);

  // Total de semijugadas (plies)
  const totalPlies = useMemo(() => {
    let count = 0;
    movesList.forEach(m => {
      if (m.white) count++;
      if (m.black) count++;
    });
    return count;
  }, [movesList]);

  if (!isOpen) return null;

  const handleCopyPgn = () => {
    navigator.clipboard.writeText(cleanPgn);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadPgn = () => {
    const blob = new Blob([cleanPgn], { type: 'application/x-chess-pgn' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.pgn`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const openInLichess = () => {
    const lichessUrl = `https://lichess.org/analysis`;
    window.open(lichessUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: '#121212',
          border: '1px solid #2a2a2a',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '820px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        }}
      >
        {/* Cabecera del Visor */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            background: '#181818',
            borderBottom: '1px solid #262626',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'var(--gold)',
                color: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Swords size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#fff' }}>
                {title}
              </h2>
              <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.15rem' }}>
                {eventDate && <span>{eventDate} · </span>}
                <span>Visor Oficial PGN Capablanca</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#888',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
            }}
            aria-label="Cerrar modal"
          >
            <X size={22} />
          </button>
        </div>

        {/* Ficha de Jugadores & Resultado */}
        <div
          style={{
            background: '#0d0d0d',
            padding: '1rem 1.5rem',
            borderBottom: '1px solid #222',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem', color: '#f0f0f0' }}>♔</span>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#888', textTransform: 'uppercase' }}>Blancas</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>{whitePlayer}</div>
              </div>
            </div>

            <div
              style={{
                background: '#1f1f1f',
                padding: '0.25rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid var(--gold)',
                color: 'var(--gold)',
                fontWeight: 800,
                fontSize: '0.9rem',
                letterSpacing: '0.05em',
              }}
            >
              {result}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem', color: '#888' }}>♚</span>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#888', textTransform: 'uppercase' }}>Negras</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>{blackPlayer}</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleCopyPgn}
              className="btn btn--sm btn--ghost"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
            >
              {copied ? <Check size={14} color="#4caf50" /> : <Copy size={14} />}
              <span>{copied ? '¡Copiado!' : 'Copiar PGN'}</span>
            </button>
            <button
              onClick={handleDownloadPgn}
              className="btn btn--sm btn--ghost"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
            >
              <Download size={14} />
              <span>Descargar .pgn</span>
            </button>
            <button
              onClick={openInLichess}
              className="btn btn--sm btn--primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
            >
              <ExternalLink size={14} />
              <span>Analizar en Lichess</span>
            </button>
          </div>
        </div>

        {/* Cuerpo Principal: Tablero + Lista de Movimientos */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(280px, 360px) 1fr',
            flex: 1,
            overflowY: 'auto',
            gap: '1.5rem',
            padding: '1.5rem',
          }}
        >
          {/* Lado Izquierdo: Tablero de Ajedrez */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              style={{
                width: '100%',
                aspectRatio: '1/1',
                maxWidth: '340px',
                border: '2px solid #333',
                borderRadius: '8px',
                overflow: 'hidden',
                display: 'grid',
                gridTemplateRows: 'repeat(8, 1fr)',
                gridTemplateColumns: 'repeat(8, 1fr)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              }}
            >
              {INITIAL_BOARD.map((row, rowIndex) =>
                row.map((piece, colIndex) => {
                  const isLight = (rowIndex + colIndex) % 2 === 0;
                  const isWhitePiece = piece && piece === piece.toUpperCase();
                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      style={{
                        background: isLight ? '#e2d6b5' : '#8b6e4e',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.6rem',
                        userSelect: 'none',
                        color: isWhitePiece ? '#ffffff' : '#1a1a1a',
                        textShadow: isWhitePiece ? '0 1px 2px rgba(0,0,0,0.8)' : '0 1px 1px rgba(255,255,255,0.3)',
                        position: 'relative',
                      }}
                    >
                      {/* Etiquetas de coordenadas en bordes */}
                      {colIndex === 0 && (
                        <span style={{ position: 'absolute', top: 2, left: 3, fontSize: '0.6rem', fontWeight: 700, color: isLight ? '#8b6e4e' : '#e2d6b5', lineHeight: 1 }}>
                          {8 - rowIndex}
                        </span>
                      )}
                      {rowIndex === 7 && (
                        <span style={{ position: 'absolute', bottom: 2, right: 3, fontSize: '0.6rem', fontWeight: 700, color: isLight ? '#8b6e4e' : '#e2d6b5', lineHeight: 1 }}>
                          {String.fromCharCode(97 + colIndex)}
                        </span>
                      )}
                      <span>{PIECE_SYMBOLS[piece] || ''}</span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Controles de Reproducción / Navegación */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginTop: '1.25rem',
                background: '#1a1a1a',
                padding: '0.4rem 0.8rem',
                borderRadius: '8px',
                border: '1px solid #333',
              }}
            >
              <button
                type="button"
                onClick={() => setCurrentStep(0)}
                disabled={currentStep === 0}
                style={{
                  background: 'none',
                  border: 'none',
                  color: currentStep === 0 ? '#444' : '#fff',
                  cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
                  padding: '0.4rem',
                }}
                title="Inicio"
              >
                <SkipBack size={18} />
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                disabled={currentStep === 0}
                style={{
                  background: 'none',
                  border: 'none',
                  color: currentStep === 0 ? '#444' : '#fff',
                  cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
                  padding: '0.4rem',
                }}
                title="Jugada anterior"
              >
                <ChevronLeft size={20} />
              </button>

              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--gold)', minWidth: '70px', textAlign: 'center' }}>
                {currentStep} / {totalPlies}
              </span>

              <button
                type="button"
                onClick={() => setCurrentStep(prev => Math.min(totalPlies, prev + 1))}
                disabled={currentStep >= totalPlies}
                style={{
                  background: 'none',
                  border: 'none',
                  color: currentStep >= totalPlies ? '#444' : '#fff',
                  cursor: currentStep >= totalPlies ? 'not-allowed' : 'pointer',
                  padding: '0.4rem',
                }}
                title="Siguiente jugada"
              >
                <ChevronRight size={20} />
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(totalPlies)}
                disabled={currentStep >= totalPlies}
                style={{
                  background: 'none',
                  border: 'none',
                  color: currentStep >= totalPlies ? '#444' : '#fff',
                  cursor: currentStep >= totalPlies ? 'not-allowed' : 'pointer',
                  padding: '0.4rem',
                }}
                title="Final de la partida"
              >
                <SkipForward size={18} />
              </button>
            </div>
          </div>

          {/* Lado Derecho: Notación de Movimientos */}
          <div
            style={{
              background: '#0d0d0d',
              border: '1px solid #222',
              borderRadius: '10px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '380px',
            }}
          >
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '0.8rem', borderBottom: '1px solid #222', paddingBottom: '0.5rem' }}>
              Secuencia de Movimientos ({movesList.length} Jugadas)
            </div>

            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {movesList.map((m, idx) => {
                const whitePlyIndex = idx * 2 + 1;
                const blackPlyIndex = idx * 2 + 2;
                return (
                  <div
                    key={m.moveNumber}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '40px 1fr 1fr',
                      gap: '0.5rem',
                      alignItems: 'center',
                      fontSize: '0.88rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      background: idx % 2 === 0 ? '#141414' : 'transparent',
                    }}
                  >
                    <span style={{ color: '#666', fontWeight: 600 }}>{m.moveNumber}.</span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(whitePlyIndex)}
                      style={{
                        textAlign: 'left',
                        background: currentStep === whitePlyIndex ? 'rgba(212, 175, 55, 0.25)' : 'none',
                        border: currentStep === whitePlyIndex ? '1px solid var(--gold)' : 'none',
                        color: currentStep === whitePlyIndex ? 'var(--gold)' : '#e0e0e0',
                        fontWeight: currentStep === whitePlyIndex ? 700 : 500,
                        padding: '0.2rem 0.4rem',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      {m.white}
                    </button>
                    {m.black ? (
                      <button
                        type="button"
                        onClick={() => setCurrentStep(blackPlyIndex)}
                        style={{
                          textAlign: 'left',
                          background: currentStep === blackPlyIndex ? 'rgba(212, 175, 55, 0.25)' : 'none',
                          border: currentStep === blackPlyIndex ? '1px solid var(--gold)' : 'none',
                          color: currentStep === blackPlyIndex ? 'var(--gold)' : '#e0e0e0',
                          fontWeight: currentStep === blackPlyIndex ? 700 : 500,
                          padding: '0.2rem 0.4rem',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        {m.black}
                      </button>
                    ) : (
                      <span />
                    )}
                  </div>
                );
              })}

              <div style={{ marginTop: '0.8rem', padding: '0.5rem', textAlign: 'center', background: '#1c1c1c', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 800, color: 'var(--gold)' }}>
                Resultado Final: {result}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
