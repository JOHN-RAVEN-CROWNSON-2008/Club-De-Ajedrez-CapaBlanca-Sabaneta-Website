import React, { useState } from 'react';
import { Swords, Lightbulb, ChevronRight, ChevronLeft, RotateCcw, ExternalLink, Award, CheckCircle2 } from 'lucide-react';

interface TacticalPuzzle {
  id: string;
  title: string;
  white: string;
  black: string;
  year: string;
  toMove: 'white' | 'black';
  theme: string;
  goal: string;
  hint: string;
  fen: string;
  solutionMoves: string[];
  explanation: string;
  boardState: string[][];
  solvedBoardState: string[][];
}

export const CAPABLANCA_PUZZLES: TacticalPuzzle[] = [
  {
    id: 'puz-1',
    title: 'La Legendaria Desviación',
    white: 'Ossip Bernstein',
    black: 'José Raúl Capablanca',
    year: 'San Sebastián, 1914',
    toMove: 'black',
    theme: 'Desviación & Debilidad de Primera Fila',
    goal: 'Juegan Negras y Ganan Inmediatamente',
    hint: 'Observa la sobrecarga de la dama blanca defendiendo la torre de c1 y la primera fila.',
    fen: '2r3k1/5ppp/8/3q4/8/8/1Q3PPP/2R3K1 b - - 0 1',
    solutionMoves: ['1... Db2!!', '2. Txb2 Txc1#', '(Si 2.De1 Dxc1!)'],
    explanation: 'Con 29...Db2!! Capablanca explota magistralmente la debilidad de la primera fila. Si las blancas capturan 30.Dxb2, sigue 30...Txc1+ 31.Dxc1 Txc1# mate. Si 30.Txc8+ Dxc8 y las negras quedan con dama de ventaja.',
    boardState: [
      ['.', '.', 'r', '.', '.', '.', 'k', '.'],
      ['.', '.', '.', '.', '.', 'p', 'p', 'p'],
      ['.', '.', '.', '.', '.', '.', '.', '.'],
      ['.', '.', '.', 'q', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.', '.', '.', '.'],
      ['.', 'Q', '.', '.', '.', 'P', 'P', 'P'],
      ['.', '.', 'R', '.', '.', '.', 'K', '.'],
    ],
    solvedBoardState: [
      ['.', '.', 'r', '.', '.', '.', 'k', '.'],
      ['.', '.', '.', '.', '.', 'p', 'p', 'p'],
      ['.', '.', '.', '.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.', '.', '.', '.'],
      ['.', 'q', '.', '.', '.', 'P', 'P', 'P'],
      ['.', '.', 'R', '.', '.', '.', 'K', '.'],
    ],
  },
  {
    id: 'puz-2',
    title: 'El Sacrificio Rompedor',
    white: 'José Raúl Capablanca',
    black: 'Karel Treybal',
    year: 'Karlsbad, 1929',
    toMove: 'white',
    theme: 'Ruptura de Peones & Invasión de Torres',
    goal: 'Juegan Blancas y Deciden la Partida',
    hint: 'Busca cómo abrir la columna b para que las dos torres blancas penetren en la séptima fila.',
    fen: '1r4k1/2r2p2/4p1p1/1p1pP2p/1R1P1P1P/1R6/6PK/8 w - - 0 1',
    solutionMoves: ['1. Txb5!', '1... Txb5', '2. Txb5 Tc4', '3. Tb8+ Rg7', '4. f5!'],
    explanation: 'Capablanca liquida la estructura y activa su rey y torres con una precisión quirúrgica, demostrando su proverbial maestría en los finales.',
    boardState: [
      ['.', 'r', '.', '.', '.', '.', 'k', '.'],
      ['.', '.', 'r', '.', '.', 'p', '.', '.'],
      ['.', '.', '.', '.', 'p', '.', 'p', '.'],
      ['.', 'p', '.', 'p', 'P', '.', '.', 'p'],
      ['.', 'R', '.', 'P', '.', 'P', '.', 'P'],
      ['.', 'R', '.', '.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.', '.', 'P', 'K'],
      ['.', '.', '.', '.', '.', '.', '.', '.'],
    ],
    solvedBoardState: [
      ['.', 'R', '.', '.', '.', '.', 'k', '.'],
      ['.', '.', '.', '.', '.', 'p', '.', '.'],
      ['.', '.', '.', '.', 'p', '.', 'p', '.'],
      ['.', '.', '.', 'p', 'P', 'P', '.', 'p'],
      ['.', '.', 'r', 'P', '.', '.', '.', 'P'],
      ['.', '.', '.', '.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.', '.', 'P', 'K'],
      ['.', '.', '.', '.', '.', '.', '.', '.'],
    ],
  },
  {
    id: 'puz-3',
    title: 'Ataque Letal sobre el Enroque',
    white: 'José Raúl Capablanca',
    black: 'L. Fonaroff',
    year: 'Nueva York, 1918',
    toMove: 'white',
    theme: 'Desviación & Mate de la Coz Inminente',
    goal: 'Juegan Blancas y Dan Jaque Mate',
    hint: 'La dama negra en d8 está sobrecargada. Encuentra el golpe táctico en d7.',
    fen: '3r2k1/pb1n1ppp/1p6/2b5/8/2N2N2/PP2BPPP/3R2K1 w - - 0 1',
    solutionMoves: ['1. Rxd7!', '1... Rxd7', '2. Ne5!', '3. Bb5! ganando'],
    explanation: 'Capablanca elimina el caballo defensor y aprovecha la clavada absoluta de la torre enemiga, forzando la rendición inmediata.',
    boardState: [
      ['.', '.', '.', 'r', '.', '.', 'k', '.'],
      ['p', 'b', '.', 'n', '.', 'p', 'p', 'p'],
      ['.', 'p', '.', '.', '.', '.', '.', '.'],
      ['.', '.', 'b', '.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.', '.', '.', '.'],
      ['.', '.', 'N', '.', '.', 'N', '.', '.'],
      ['P', 'P', '.', '.', 'B', 'P', 'P', 'P'],
      ['.', '.', '.', 'R', '.', '.', 'K', '.'],
    ],
    solvedBoardState: [
      ['.', '.', '.', '.', '.', '.', 'k', '.'],
      ['p', 'b', '.', 'R', '.', 'p', 'p', 'p'],
      ['.', 'p', '.', '.', '.', '.', '.', '.'],
      ['.', '.', 'b', '.', 'N', '.', '.', '.'],
      ['.', '.', '.', '.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.', '.', '.', '.'],
      ['P', 'P', '.', '.', 'B', 'P', 'P', 'P'],
      ['.', '.', '.', '.', '.', '.', 'K', '.'],
    ],
  },
];

const PIECE_SYMBOLS: Record<string, { symbol: string; color: string }> = {
  K: { symbol: '♔', color: '#fff' },
  Q: { symbol: '♕', color: '#fff' },
  R: { symbol: '♖', color: '#fff' },
  B: { symbol: '♗', color: '#fff' },
  N: { symbol: '♘', color: '#fff' },
  P: { symbol: '♙', color: '#fff' },
  k: { symbol: '♚', color: '#d4af37' },
  q: { symbol: '♛', color: '#d4af37' },
  r: { symbol: '♜', color: '#d4af37' },
  b: { symbol: '♝', color: '#d4af37' },
  n: { symbol: '♞', color: '#d4af37' },
  p: { symbol: '♟', color: '#d4af37' },
};

export const DailyTacticalPuzzle: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [isSolved, setIsSolved] = useState(false);

  const puzzle = CAPABLANCA_PUZZLES[currentIndex];
  const board = isSolved ? puzzle.solvedBoardState : puzzle.boardState;

  const handleNextPuzzle = () => {
    setCurrentIndex((prev) => (prev + 1) % CAPABLANCA_PUZZLES.length);
    setShowHint(false);
    setIsSolved(false);
  };

  const handlePrevPuzzle = () => {
    setCurrentIndex((prev) => (prev - 1 + CAPABLANCA_PUZZLES.length) % CAPABLANCA_PUZZLES.length);
    setShowHint(false);
    setIsSolved(false);
  };

  const handleToggleSolve = () => {
    setIsSolved((prev) => !prev);
  };

  const lichessUrl = `https://lichess.org/analysis/${encodeURIComponent(puzzle.fen)}`;

  return (
    <div
      style={{
        background: '#111',
        border: '1px solid #282828',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #222', paddingBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(245,197,24,0.1)', border: '1px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Swords size={20} color="var(--gold)" />
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--gold)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '1px' }}>
              Entrenamiento Táctico · Club Capablanca
            </span>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#fff', fontWeight: 800 }}>
              {puzzle.title}
            </h3>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', background: '#222', padding: '0.25rem 0.6rem', borderRadius: '4px', color: '#aaa' }}>
            Problema {currentIndex + 1} de {CAPABLANCA_PUZZLES.length}
          </span>
          <button
            type="button"
            onClick={handlePrevPuzzle}
            className="btn btn--ghost btn--sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}
            title="Ver reto táctico anterior"
          >
            <ChevronLeft size={14} />
            <span>Anterior</span>
          </button>
          <button
            type="button"
            onClick={handleNextPuzzle}
            className="btn btn--ghost btn--sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}
            title="Ver siguiente reto táctico"
          >
            <span>Siguiente</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', alignItems: 'center' }}>
        
        {/* Tablero 8x8 Miniatura */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              width: '100%',
              maxWidth: '320px',
              aspectRatio: '1',
              border: '3px solid #333',
              borderRadius: '8px',
              overflow: 'hidden',
              display: 'grid',
              gridTemplateColumns: 'repeat(8, 1fr)',
              gridTemplateRows: 'repeat(8, 1fr)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            }}
          >
            {board.map((row, rIdx) =>
              row.map((cell, cIdx) => {
                const isLight = (rIdx + cIdx) % 2 === 0;
                const pieceData = cell !== '.' ? PIECE_SYMBOLS[cell] : null;

                return (
                  <div
                    key={`${rIdx}-${cIdx}`}
                    style={{
                      background: isLight ? '#e2d6b5' : '#8b6f47',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.8rem',
                      userSelect: 'none',
                      position: 'relative',
                    }}
                  >
                    {pieceData && (
                      <span
                        style={{
                          color: pieceData.color,
                          textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                          lineHeight: 1,
                        }}
                      >
                        {pieceData.symbol}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div style={{ marginTop: '0.8rem', fontSize: '0.8rem', color: '#888', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: puzzle.toMove === 'white' ? '#fff' : '#000', border: '1px solid #666', display: 'inline-block' }} />
            <span>Turno: <strong>{puzzle.toMove === 'white' ? 'Blancas' : 'Negras'}</strong></span>
          </div>
        </div>

        {/* Ficha Explicativa y Controles */}
        <div>
          <div style={{ marginBottom: '1.2rem' }}>
            <div style={{ fontSize: '0.8rem', color: '#888' }}>
              Partida Histórica:
            </div>
            <strong style={{ fontSize: '1.05rem', color: '#eee' }}>
              {puzzle.white} vs {puzzle.black}
            </strong>
            <div style={{ fontSize: '0.8rem', color: 'var(--gold)' }}>
              {puzzle.year} · Tema: {puzzle.theme}
            </div>
          </div>

          <div style={{ background: '#181818', border: '1px solid #2e2e2e', borderRadius: '10px', padding: '1rem', marginBottom: '1.2rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', fontWeight: 700 }}>
              Objetivo:
            </span>
            <div style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700, marginTop: '0.2rem' }}>
              {puzzle.goal}
            </div>
          </div>

          {/* Botón Pista */}
          {showHint && (
            <div style={{ background: '#1c1a10', border: '1px solid #8d6e19', borderRadius: '8px', padding: '0.9rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#ffd54f', lineHeight: 1.5 }}>
              <strong style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                <Lightbulb size={16} /> Pista del Maestro:
              </strong>
              {puzzle.hint}
            </div>
          )}

          {/* Solución Revelada */}
          {isSolved && (
            <div style={{ background: '#111d13', border: '1px solid #2e7d32', borderRadius: '8px', padding: '1rem', marginBottom: '1rem', fontSize: '0.88rem', color: '#a5d6a7', lineHeight: 1.6 }}>
              <strong style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem', color: '#81c784' }}>
                <CheckCircle2 size={16} /> ¡Solución Magistral!
              </strong>
              <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.95rem', color: '#fff', marginBottom: '0.4rem' }}>
                {puzzle.solutionMoves.join(' ')}
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#ccc' }}>
                {puzzle.explanation}
              </p>
            </div>
          )}

          {/* Botones de Interacción */}
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleToggleSolve}
              className={`btn btn--sm ${isSolved ? 'btn--ghost' : 'btn--primary'}`}
              style={{ fontWeight: 700 }}
            >
              {isSolved ? 'Ocultar Solución' : 'Ver Jugada Ganadora'}
            </button>

            {!isSolved && (
              <button
                type="button"
                onClick={() => setShowHint(!showHint)}
                className="btn btn--ghost btn--sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
              >
                <Lightbulb size={14} color="var(--gold)" />
                <span>{showHint ? 'Ocultar Pista' : 'Pedir Pista'}</span>
              </button>
            )}

            <a
              href={lichessUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--ghost btn--sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem' }}
              title="Abrir tablero de análisis en Lichess"
            >
              <ExternalLink size={13} />
              <span>Analizar en Lichess</span>
            </a>
          </div>

        </div>

      </div>
    </div>
  );
};
