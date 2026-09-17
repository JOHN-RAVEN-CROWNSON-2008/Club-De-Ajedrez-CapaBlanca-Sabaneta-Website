import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Settings, Volume2, VolumeX, Maximize2, Minimize2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PresetTimeControl {
  label: string;
  minutes: number;
  increment: number;
  category: 'Bullet' | 'Blitz' | 'Rápido' | 'Clásico';
}

const PRESET_CONTROLS: PresetTimeControl[] = [
  { label: '3 min + 2 s', minutes: 3, increment: 2, category: 'Blitz' },
  { label: '5 min + 0 s', minutes: 5, increment: 0, category: 'Blitz' },
  { label: '5 min + 3 s', minutes: 5, increment: 3, category: 'Blitz' },
  { label: '10 min + 0 s', minutes: 10, increment: 0, category: 'Rápido' },
  { label: '15 min + 10 s', minutes: 15, increment: 10, category: 'Rápido' },
  { label: '1 min + 0 s', minutes: 1, increment: 0, category: 'Bullet' },
  { label: '30 min + 0 s', minutes: 30, increment: 0, category: 'Clásico' },
];

export const ChessClockView: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<PresetTimeControl>(PRESET_CONTROLS[0]);
  const [whiteTime, setWhiteTime] = useState(selectedPreset.minutes * 60 * 1000);
  const [blackTime, setBlackTime] = useState(selectedPreset.minutes * 60 * 1000);
  const [activePlayer, setActivePlayer] = useState<'white' | 'black' | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [moveCountWhite, setMoveCountWhite] = useState(0);
  const [moveCountBlack, setMoveCountBlack] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Reproducir clic mecánico con sintetizador Web Audio API
  const playClickSound = useCallback((frequency = 800, duration = 0.04) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }

      const osc = audioCtxRef.current.createOscillator();
      const gain = audioCtxRef.current.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, audioCtxRef.current.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtxRef.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtxRef.current.destination);
      osc.start();
      osc.stop(audioCtxRef.current.currentTime + duration);
    } catch {
      // Ignorar si audio está restringido por el navegador
    }
  }, [soundEnabled]);

  // Manejo del temporizador
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && activePlayer) {
      const startTimestamp = Date.now();

      interval = setInterval(() => {
        const now = Date.now();
        const delta = now - startTimestamp;

        if (activePlayer === 'white') {
          setWhiteTime((prev) => {
            const next = Math.max(0, prev - 100);
            if (next === 0) {
              setIsRunning(false);
              playClickSound(300, 0.5);
            }
            return next;
          });
        } else {
          setBlackTime((prev) => {
            const next = Math.max(0, prev - 100);
            if (next === 0) {
              setIsRunning(false);
              playClickSound(300, 0.5);
            }
            return next;
          });
        }
      }, 100);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, activePlayer, playClickSound]);

  const handleApplyPreset = (preset: PresetTimeControl) => {
    setSelectedPreset(preset);
    setWhiteTime(preset.minutes * 60 * 1000);
    setBlackTime(preset.minutes * 60 * 1000);
    setActivePlayer(null);
    setIsRunning(false);
    setMoveCountWhite(0);
    setMoveCountBlack(0);
    setShowConfig(false);
  };

  const handleReset = useCallback(() => {
    setWhiteTime(selectedPreset.minutes * 60 * 1000);
    setBlackTime(selectedPreset.minutes * 60 * 1000);
    setActivePlayer(null);
    setIsRunning(false);
    setMoveCountWhite(0);
    setMoveCountBlack(0);
    playClickSound(500, 0.08);
  }, [selectedPreset, playClickSound]);

  const handleTogglePlay = useCallback(() => {
    if (!activePlayer) {
      setActivePlayer('white');
      setIsRunning(true);
    } else {
      setIsRunning((prev) => !prev);
    }
    playClickSound(600, 0.05);
  }, [activePlayer, playClickSound]);

  const handleSwitchToBlack = useCallback(() => {
    if (!isRunning && activePlayer === null) {
      setActivePlayer('black');
      setIsRunning(true);
      playClickSound(900, 0.04);
      return;
    }

    if (isRunning && activePlayer === 'white') {
      setWhiteTime((prev) => prev + selectedPreset.increment * 1000);
      setMoveCountWhite((c) => c + 1);
      setActivePlayer('black');
      playClickSound(850, 0.04);
    }
  }, [isRunning, activePlayer, selectedPreset.increment, playClickSound]);

  const handleSwitchToWhite = useCallback(() => {
    if (!isRunning && activePlayer === null) {
      setActivePlayer('white');
      setIsRunning(true);
      playClickSound(800, 0.04);
      return;
    }

    if (isRunning && activePlayer === 'black') {
      setBlackTime((prev) => prev + selectedPreset.increment * 1000);
      setMoveCountBlack((c) => c + 1);
      setActivePlayer('white');
      playClickSound(750, 0.04);
    }
  }, [isRunning, activePlayer, selectedPreset.increment, playClickSound]);

  // Atajos de teclado para juego fluido (Espacio, P, R)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (!isRunning && activePlayer === null) {
          setActivePlayer('white');
          setIsRunning(true);
          playClickSound(800, 0.04);
        } else if (isRunning) {
          if (activePlayer === 'white') {
            handleSwitchToBlack();
          } else if (activePlayer === 'black') {
            handleSwitchToWhite();
          }
        } else {
          setIsRunning(true);
          playClickSound(600, 0.05);
        }
      } else if (e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        handleReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, activePlayer, handleSwitchToBlack, handleSwitchToWhite, handleTogglePlay, handleReset, playClickSound]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const tenths = Math.floor((ms % 1000) / 100);

    if (minutes < 1) {
      // Mostrar décimas si queda menos de un minuto
      return `${seconds}.${tenths}`;
    }

    const secStr = seconds < 10 ? `0${seconds}` : `${seconds}`;
    const minStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
    return `${minStr}:${secStr}`;
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullScreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullScreen(false)).catch(() => {});
    }
  };

  const isWhiteLowTime = whiteTime < 15000 && whiteTime > 0;
  const isBlackLowTime = blackTime < 15000 && blackTime > 0;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#050505',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        paddingTop: isFullScreen ? '0' : 'calc(var(--header-h) + 1rem)',
        userSelect: 'none',
      }}
    >
      {/* Barra de Control Superior */}
      <div
        style={{
          background: '#0d0d0d',
          borderBottom: '1px solid #222',
          padding: '0.8rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.8rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {!isFullScreen && (
            <Link to="/torneos" className="btn btn--ghost btn--sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <ArrowLeft size={14} />
              <span>Torneos</span>
            </Link>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.2rem' }}>⏱️</span>
            <div>
              <strong style={{ fontSize: '0.95rem', color: 'var(--gold)' }}>Reloj Oficial Capablanca</strong>
              <div style={{ fontSize: '0.72rem', color: '#888' }}>
                Ritmo: <strong>{selectedPreset.label}</strong> ({selectedPreset.category})
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className="btn btn--ghost btn--sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Settings size={14} />
            <span>Ritmos</span>
          </button>

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="btn btn--ghost btn--sm"
            style={{ padding: '0.45rem' }}
            title={soundEnabled ? 'Silenciar sonido' : 'Activar sonido de clic'}
          >
            {soundEnabled ? <Volume2 size={15} color="var(--gold)" /> : <VolumeX size={15} color="#666" />}
          </button>

          <button
            type="button"
            onClick={toggleFullScreen}
            className="btn btn--ghost btn--sm"
            style={{ padding: '0.45rem' }}
            title="Pantalla completa"
          >
            {isFullScreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </div>

      {/* Selector de Ritmos Desplegable */}
      {showConfig && (
        <div style={{ background: '#121212', borderBottom: '1px solid #333', padding: '1.2rem 1.5rem' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <span style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '0.8rem' }}>
              Seleccionar Control de Tiempo Oficial:
            </span>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              {PRESET_CONTROLS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  style={{
                    background: selectedPreset.label === preset.label ? 'var(--gold)' : '#1c1c1c',
                    color: selectedPreset.label === preset.label ? '#000' : '#ddd',
                    fontWeight: 700,
                    border: '1px solid #333',
                    borderRadius: '8px',
                    padding: '0.5rem 1rem',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Esferas del Reloj: Jugador Blancas y Jugador Negras */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem',
          padding: '1rem 1.5rem',
          minHeight: '60vh',
        }}
      >
        {/* LADO BLANCAS */}
        <button
          type="button"
          onClick={handleSwitchToBlack}
          disabled={whiteTime === 0 || (isRunning && activePlayer === 'black')}
          style={{
            background: activePlayer === 'white' ? '#201d14' : '#141414',
            border: `3px solid ${activePlayer === 'white' ? (isWhiteLowTime ? '#f44336' : 'var(--gold)') : '#282828'}`,
            borderRadius: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '2.5rem 1.5rem',
            cursor: activePlayer === 'black' ? 'default' : 'pointer',
            transition: 'all 0.15s',
            boxShadow: activePlayer === 'white' ? '0 0 30px rgba(245, 197, 24, 0.15)' : 'none',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: '#aaa', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '1px' }}>
              ♔ Blancas
            </span>
            <span style={{ fontSize: '0.8rem', background: '#252525', color: 'var(--gold)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 700 }}>
              Jugadas: {moveCountWhite}
            </span>
          </div>

          <div
            style={{
              fontSize: 'clamp(3.5rem, 10vw, 7rem)',
              fontWeight: 900,
              fontFamily: 'monospace',
              letterSpacing: '2px',
              color: whiteTime === 0 ? '#f44336' : (isWhiteLowTime ? '#ff5252' : (activePlayer === 'white' ? '#fff' : '#888')),
            }}
          >
            {whiteTime === 0 ? '00:00' : formatTime(whiteTime)}
          </div>

          <div style={{ fontSize: '0.85rem', color: activePlayer === 'white' ? 'var(--gold)' : '#555', fontWeight: 700 }}>
            {whiteTime === 0 ? '¡TIEMPO AGOTADO!' : (activePlayer === 'white' ? (isRunning ? '▶ Tu turno (Toca al mover)' : '⏸ En Pausa') : 'Esperando turno...')}
          </div>
        </button>

        {/* LADO NEGRAS */}
        <button
          type="button"
          onClick={handleSwitchToWhite}
          disabled={blackTime === 0 || (isRunning && activePlayer === 'white')}
          style={{
            background: activePlayer === 'black' ? '#201d14' : '#141414',
            border: `3px solid ${activePlayer === 'black' ? (isBlackLowTime ? '#f44336' : 'var(--gold)') : '#282828'}`,
            borderRadius: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '2.5rem 1.5rem',
            cursor: activePlayer === 'white' ? 'default' : 'pointer',
            transition: 'all 0.15s',
            boxShadow: activePlayer === 'black' ? '0 0 30px rgba(245, 197, 24, 0.15)' : 'none',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: '#aaa', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '1px' }}>
              ♚ Negras
            </span>
            <span style={{ fontSize: '0.8rem', background: '#252525', color: 'var(--gold)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 700 }}>
              Jugadas: {moveCountBlack}
            </span>
          </div>

          <div
            style={{
              fontSize: 'clamp(3.5rem, 10vw, 7rem)',
              fontWeight: 900,
              fontFamily: 'monospace',
              letterSpacing: '2px',
              color: blackTime === 0 ? '#f44336' : (isBlackLowTime ? '#ff5252' : (activePlayer === 'black' ? '#fff' : '#888')),
            }}
          >
            {blackTime === 0 ? '00:00' : formatTime(blackTime)}
          </div>

          <div style={{ fontSize: '0.85rem', color: activePlayer === 'black' ? 'var(--gold)' : '#555', fontWeight: 700 }}>
            {blackTime === 0 ? '¡TIEMPO AGOTADO!' : (activePlayer === 'black' ? (isRunning ? '▶ Tu turno (Toca al mover)' : '⏸ En Pausa') : 'Esperando turno...')}
          </div>
        </button>
      </div>

      {/* Barra de Controles Inferiores (Pausa, Reiniciar, Instrucciones) */}
      <div
        style={{
          background: '#0d0d0d',
          borderTop: '1px solid #222',
          padding: '1.2rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.8rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem' }}>
          <button
            type="button"
            onClick={handleTogglePlay}
            className="btn btn--primary"
            style={{ padding: '0.8rem 2.2rem', fontSize: '1.05rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {isRunning ? <Pause size={18} /> : <Play size={18} />}
            <span>{isRunning ? 'Pausar Reloj' : (activePlayer ? 'Reanudar' : 'Iniciar Reloj')}</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="btn btn--ghost"
            style={{ padding: '0.8rem 1.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
            title="Reiniciar a tiempo inicial"
          >
            <RotateCcw size={16} />
            <span>Reiniciar</span>
          </button>
        </div>

        {/* Guía de Atajos de Teclado */}
        <div style={{ fontSize: '0.75rem', color: '#666', textAlign: 'center' }}>
          Atajos de teclado: <kbd style={{ background: '#1c1c1c', border: '1px solid #333', padding: '0.15rem 0.4rem', borderRadius: '4px', color: '#ccc' }}>Espacio</kbd> Alternar turno / Reanudar · <kbd style={{ background: '#1c1c1c', border: '1px solid #333', padding: '0.15rem 0.4rem', borderRadius: '4px', color: '#ccc' }}>P</kbd> Pausar · <kbd style={{ background: '#1c1c1c', border: '1px solid #333', padding: '0.15rem 0.4rem', borderRadius: '4px', color: '#ccc' }}>R</kbd> Reiniciar
        </div>
      </div>
    </div>
  );
};
