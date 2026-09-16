import React, { useState, useMemo } from 'react';
import {
  X, Swords, Wand2, ArrowLeftRight, Printer, Check, Copy, AlertCircle, ShieldCheck, Users
} from 'lucide-react';
import {
  generatePairings, exportPairingsSheetText,
  PairingAthlete, GeneratedPairing, PairingSystem
} from '../../lib/tournamentPairings';
import { ClubEvent, TournamentMatch } from '../../types/database';

interface TournamentPairingModalProps {
  event: ClubEvent;
  athletes: PairingAthlete[];
  onClose: () => void;
  onSaveMatches: (matches: Omit<TournamentMatch, 'id'>[]) => Promise<void> | void;
}

export const TournamentPairingModal: React.FC<TournamentPairingModalProps> = ({
  event,
  athletes,
  onClose,
  onSaveMatches,
}) => {
  const [round, setRound] = useState<number>(1);
  const [system, setSystem] = useState<PairingSystem>('swiss');
  const [startingBoard, setStartingBoard] = useState<number>(1);
  const [selectedAthleteIds, setSelectedAthleteIds] = useState<string[]>(
    athletes.map((a) => a.id)
  );
  const [pairings, setPairings] = useState<GeneratedPairing[]>([]);
  const [copiedText, setCopiedText] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Filtrar atletas activos para emparejar
  const activeAthletes = useMemo(() => {
    return athletes.filter((a) => selectedAthleteIds.includes(a.id));
  }, [athletes, selectedAthleteIds]);

  const toggleAthlete = (id: string) => {
    setSelectedAthleteIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedAthleteIds(athletes.map((a) => a.id));
  const deselectAll = () => setSelectedAthleteIds([]);

  const handleGenerate = () => {
    const generated = generatePairings(activeAthletes, round, system, startingBoard);
    setPairings(generated);
  };

  const handleSwapColors = (index: number) => {
    setPairings((prev) => {
      const next = [...prev];
      const item = next[index];
      if (item && !item.is_bye) {
        next[index] = {
          ...item,
          white_player: item.black_player,
          black_player: item.white_player,
          white_elo: item.black_elo,
          black_elo: item.white_elo,
        };
      }
      return next;
    });
  };

  const handleCopySheet = () => {
    if (pairings.length === 0) return;
    const sysName = system === 'swiss' ? 'Sistema Suizo' : system === 'round_robin' ? 'Round Robin (Berger)' : 'Escalafón Directo';
    const text = exportPairingsSheetText(pairings, event.title, round, sysName);
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 3000);
  };

  const handlePrintSheet = () => {
    if (pairings.length === 0) return;
    const sysName = system === 'swiss' ? 'Sistema Suizo' : system === 'round_robin' ? 'Round Robin (Berger)' : 'Escalafón Directo';
    const text = exportPairingsSheetText(pairings, event.title, round, sysName);

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Emparejamientos Ronda ${round} - ${event.title}</title>
            <style>
              body { font-family: monospace; padding: 2rem; background: #fff; color: #000; white-space: pre-wrap; font-size: 13px; line-height: 1.4; }
              @media print { body { padding: 0.5cm; } }
            </style>
          </head>
          <body>${text}</body>
        </html>
      `);
      win.document.close();
      win.focus();
      win.print();
    }
  };

  const handleSaveToMatches = async () => {
    if (pairings.length === 0) return;
    setIsSaving(true);

    const newMatches: Omit<TournamentMatch, 'id'>[] = pairings.map((p) => ({
      event_id: event.id,
      round: round,
      board_number: p.board_number,
      white_player: p.white_player,
      black_player: p.black_player,
      result: p.is_bye ? '1-0' : '*', // Si es descanso, se adjudica el punto por bye
      pgn: p.is_bye ? '[Event "Descanso Reglamentario (BYE)"]\n1. Bye 1-0' : '',
    }));

    try {
      await onSaveMatches(newMatches);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          backgroundColor: '#121212',
          border: '1px solid #2a2a2a',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '900px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          color: '#fff',
          overflow: 'hidden',
        }}
      >
        {/* Cabecera */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #222',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#161616',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(212, 160, 23, 0.12)',
                border: '1px solid var(--gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Wand2 size={20} color="var(--gold)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--gold)' }}>
                Asistente de Emparejamientos de Ronda
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#888', margin: '0.2rem 0 0' }}>
                {event.title} · Sede Aves María Sabaneta
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#888',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Cuerpo con Scroll */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Parámetros de Generación */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              background: '#181818',
              padding: '1.2rem',
              borderRadius: '10px',
              border: '1px solid #262626',
            }}
          >
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', marginBottom: '0.35rem' }}>
                Ronda a Generar
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={round}
                onChange={(e) => setRound(Math.max(1, parseInt(e.target.value) || 1))}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  borderRadius: '6px',
                  background: '#222',
                  border: '1px solid #333',
                  color: '#fff',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', marginBottom: '0.35rem' }}>
                Sistema de Emparejamiento
              </label>
              <select
                value={system}
                onChange={(e) => setSystem(e.target.value as PairingSystem)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  borderRadius: '6px',
                  background: '#222',
                  border: '1px solid #333',
                  color: '#fff',
                  fontSize: '0.9rem',
                }}
              >
                <option value="swiss">Sistema Suizo (FIDE Dutch)</option>
                <option value="round_robin">Round Robin / Liga (Tablas Berger)</option>
                <option value="direct_elo">Escalafón Directo (1 vs 2, 3 vs 4)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', marginBottom: '0.35rem' }}>
                Mesa Inicial
              </label>
              <input
                type="number"
                min={1}
                value={startingBoard}
                onChange={(e) => setStartingBoard(Math.max(1, parseInt(e.target.value) || 1))}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  borderRadius: '6px',
                  background: '#222',
                  border: '1px solid #333',
                  color: '#fff',
                  fontSize: '0.9rem',
                }}
              />
            </div>
          </div>

          {/* Selector de Deportistas Presentes */}
          <div style={{ background: '#181818', padding: '1.2rem', borderRadius: '10px', border: '1px solid #262626' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={18} color="var(--gold)" />
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                  Deportistas Disponibles para la Ronda ({activeAthletes.length} de {athletes.length})
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={selectAll}
                  style={{ background: '#252525', border: '1px solid #333', color: '#aaa', padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
                >
                  Seleccionar Todos
                </button>
                <button
                  type="button"
                  onClick={deselectAll}
                  style={{ background: '#252525', border: '1px solid #333', color: '#aaa', padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
                >
                  Deseleccionar
                </button>
              </div>
            </div>

            {athletes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: '#777', fontSize: '0.85rem' }}>
                No hay deportistas preinscritos confirmados para este torneo.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.5rem', maxHeight: '160px', overflowY: 'auto' }}>
                {athletes.map((ath) => {
                  const isChecked = selectedAthleteIds.includes(ath.id);
                  return (
                    <label
                      key={ath.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.45rem 0.7rem',
                        borderRadius: '6px',
                        background: isChecked ? 'rgba(212, 160, 23, 0.08)' : '#202020',
                        border: isChecked ? '1px solid rgba(212, 160, 23, 0.3)' : '1px solid #282828',
                        cursor: 'pointer',
                        fontSize: '0.82rem',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleAthlete(ath.id)}
                        style={{ accentColor: 'var(--gold)' }}
                      />
                      <span style={{ fontWeight: isChecked ? 600 : 400, color: isChecked ? '#fff' : '#888' }}>
                        {ath.name}
                      </span>
                      <span style={{ color: 'var(--gold)', marginLeft: 'auto', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                        {ath.elo || 1500}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={activeAthletes.length < 2}
                className="btn btn--primary btn--sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Wand2 size={16} /> Generar Emparejamientos de Ronda {round}
              </button>
            </div>
          </div>

          {/* Previsualización de Mesas Emparejadas */}
          {pairings.length > 0 && (
            <div style={{ background: '#161616', border: '1px solid #282828', borderRadius: '10px', padding: '1.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.8rem' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', margin: 0, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Swords size={18} />
                    Planilla de Mesas Generada · Ronda {round} ({pairings.length} mesas)
                  </h3>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#888' }}>
                    Revisa las mesas y usa el botón ⇄ si deseas alternar los colores de juego.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={handleCopySheet}
                    style={{
                      background: '#222',
                      border: '1px solid #333',
                      color: copiedText ? '#4caf50' : '#ddd',
                      padding: '0.4rem 0.8rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      cursor: 'pointer',
                    }}
                  >
                    {copiedText ? <Check size={14} /> : <Copy size={14} />}
                    {copiedText ? '¡Copiado!' : 'Copiar Planilla'}
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintSheet}
                    style={{
                      background: '#222',
                      border: '1px solid #333',
                      color: '#ddd',
                      padding: '0.4rem 0.8rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      cursor: 'pointer',
                    }}
                  >
                    <Printer size={14} /> Imprimir
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {pairings.map((p, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#1f1f1f',
                      border: p.is_bye ? '1px dashed #555' : '1px solid #2d2d2d',
                      borderRadius: '8px',
                      padding: '0.75rem 1rem',
                      gap: '1rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: '90px' }}>
                      <span
                        style={{
                          background: '#121212',
                          color: 'var(--gold)',
                          fontWeight: 800,
                          fontSize: '0.8rem',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          border: '1px solid #333',
                        }}
                      >
                        Mesa {p.board_number}
                      </span>
                    </div>

                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', minWidth: '300px' }}>
                      {/* Blancas */}
                      <div style={{ flex: 1, textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#fff' }}>
                          {p.white_player}
                        </span>
                        <span
                          title="Piezas Blancas"
                          style={{
                            display: 'inline-block',
                            width: '18px',
                            height: '18px',
                            borderRadius: '3px',
                            background: '#f0f0f0',
                            border: '1px solid #bbb',
                            textAlign: 'center',
                            lineHeight: '16px',
                            color: '#111',
                            fontSize: '12px',
                            fontWeight: 800,
                          }}
                        >
                          B
                        </span>
                      </div>

                      {/* Separador VS */}
                      <span style={{ color: 'var(--gold)', fontWeight: 800, fontSize: '0.8rem' }}>
                        VS
                      </span>

                      {/* Negras */}
                      <div style={{ flex: 1, textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          title="Piezas Negras"
                          style={{
                            display: 'inline-block',
                            width: '18px',
                            height: '18px',
                            borderRadius: '3px',
                            background: '#111',
                            border: '1px solid #444',
                            textAlign: 'center',
                            lineHeight: '16px',
                            color: '#fff',
                            fontSize: '12px',
                            fontWeight: 800,
                          }}
                        >
                          N
                        </span>
                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: '0.88rem',
                            color: p.is_bye ? '#ffaa00' : '#fff',
                          }}
                        >
                          {p.black_player}
                        </span>
                      </div>
                    </div>

                    {!p.is_bye && (
                      <button
                        type="button"
                        onClick={() => handleSwapColors(idx)}
                        title="Intercambiar Blancas / Negras"
                        style={{
                          background: '#2a2a2a',
                          border: '1px solid #444',
                          color: '#bbb',
                          borderRadius: '4px',
                          padding: '0.35rem 0.5rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          fontSize: '0.75rem',
                        }}
                      >
                        <ArrowLeftRight size={13} /> Invertir
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Pie de Acciones */}
        <div
          style={{
            padding: '1.2rem 1.5rem',
            borderTop: '1px solid #222',
            background: '#161616',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#888', fontSize: '0.8rem' }}>
            <ShieldCheck size={16} color="var(--gold)" />
            <span>Resolución Inder Sabaneta 042 · Dirección Técnica</span>
          </div>

          <div style={{ display: 'flex', gap: '0.8rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn--ghost btn--sm"
            >
              Cerrar
            </button>
            <button
              type="button"
              disabled={pairings.length === 0 || isSaving}
              onClick={handleSaveToMatches}
              className="btn btn--primary btn--sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Check size={16} />
              {isSaving ? 'Guardando en Torneo...' : `Confirmar e Insertar ${pairings.length} Partidas en Torneo`}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
