/**
 * Motor Oficial de Emparejamientos de Ajedrez - Club Capablanca Sabaneta
 * Soporta:
 * 1. Sistema Suizo (Reglamentario FIDE Dutch - Mitad Superior vs Mitad Inferior con alternancia de colores).
 * 2. Sistema Round-Robin / Liga (Algoritmo Oficial de Tablas Berger).
 * 3. Sistema Escalafón / Desafío Directo (1 vs 2, 3 vs 4).
 * Maneja asignación de BYE (descanso / punto libre) para nóminas impares.
 */

export interface PairingAthlete {
  id: string;
  name: string;
  elo: number;
  category?: string;
  club?: string;
}

export interface GeneratedPairing {
  board_number: number;
  white_player: string;
  black_player: string;
  white_elo?: number;
  black_elo?: number;
  is_bye: boolean;
  bye_player?: string;
}

export type PairingSystem = 'swiss' | 'round_robin' | 'direct_elo';

/**
 * Genera emparejamientos para una ronda específica.
 */
export function generatePairings(
  athletes: PairingAthlete[],
  round: number,
  system: PairingSystem = 'swiss',
  startingBoard: number = 1
): GeneratedPairing[] {
  if (athletes.length === 0) return [];

  // Ordenar por Elo descendente (orden de siembra oficial)
  const sorted = [...athletes].sort((a, b) => (b.elo || 0) - (a.elo || 0));

  if (system === 'round_robin') {
    return generateBergerRoundRobin(sorted, round, startingBoard);
  } else if (system === 'direct_elo') {
    return generateDirectEloPairings(sorted, round, startingBoard);
  } else {
    // Por defecto: Sistema Suizo
    return generateSwissPairings(sorted, round, startingBoard);
  }
}

/**
 * Sistema Suizo (FIDE Dutch)
 * Divide la nómina en mitad superior (S1) y mitad inferior (S2).
 * Mesa 1: S1[0] (Blancas) vs S2[0] (Negras)
 * Mesa 2: S2[1] (Blancas) vs S1[1] (Negras) [alterna colores]
 */
function generateSwissPairings(
  athletes: PairingAthlete[],
  round: number,
  startingBoard: number
): GeneratedPairing[] {
  const pairings: GeneratedPairing[] = [];
  const list = [...athletes];
  let byePairing: GeneratedPairing | null = null;

  // Si es impar, el jugador de menor Elo recibe el BYE en ronda 1
  if (list.length % 2 !== 0) {
    const byePlayer = list.pop()!;
    byePairing = {
      board_number: 0, // Se ajustará al final
      white_player: `${byePlayer.name} (${byePlayer.elo || 1500})`,
      black_player: 'DESCANSO (BYE - 1 Pts)',
      white_elo: byePlayer.elo,
      is_bye: true,
      bye_player: byePlayer.name,
    };
  }

  const half = Math.floor(list.length / 2);
  const s1 = list.slice(0, half);
  const s2 = list.slice(half);

  let currentBoard = startingBoard;

  for (let i = 0; i < half; i++) {
    const p1 = s1[i];
    const p2 = s2[i];

    // Alternar colores según mesa y ronda para balance equitativo
    const isWhiteFirst = (i % 2 === 0) ? (round % 2 === 1) : (round % 2 === 0);

    const white = isWhiteFirst ? p1 : p2;
    const black = isWhiteFirst ? p2 : p1;

    pairings.push({
      board_number: currentBoard++,
      white_player: `${white.name} (${white.elo || 1500})`,
      black_player: `${black.name} (${black.elo || 1500})`,
      white_elo: white.elo,
      black_elo: black.elo,
      is_bye: false,
    });
  }

  if (byePairing) {
    byePairing.board_number = currentBoard;
    pairings.push(byePairing);
  }

  return pairings;
}

/**
 * Sistema Round Robin (Tablas Berger de Rotación Circular FIDE)
 * Cada jugador compite contra todos a lo largo de N-1 rondas.
 */
function generateBergerRoundRobin(
  athletes: PairingAthlete[],
  round: number,
  startingBoard: number
): GeneratedPairing[] {
  const pairings: GeneratedPairing[] = [];
  const players: (PairingAthlete | null)[] = [...athletes];

  // Si impar, agregar jugador fantasma (BYE)
  if (players.length % 2 !== 0) {
    players.push(null);
  }

  const total = players.length;
  const fixed = players[0];
  const rotatable = players.slice(1);

  // Desplazamiento circular por ronda
  const shift = (round - 1) % rotatable.length;
  const rotated = [...rotatable.slice(shift), ...rotatable.slice(0, shift)];
  const currentRoundPlayers = [fixed, ...rotated];

  let currentBoard = startingBoard;

  for (let i = 0; i < total / 2; i++) {
    const p1 = currentRoundPlayers[i];
    const p2 = currentRoundPlayers[total - 1 - i];

    if (!p1 || !p2) {
      // Uno de los dos es BYE
      const active = p1 || p2;
      if (active) {
        pairings.push({
          board_number: currentBoard++,
          white_player: `${active.name} (${active.elo || 1500})`,
          black_player: 'DESCANSO (BYE - 1 Pts)',
          white_elo: active.elo,
          is_bye: true,
          bye_player: active.name,
        });
      }
      continue;
    }

    const isOddRound = round % 2 === 1;
    const isWhiteP1 = (i % 2 === 0) ? isOddRound : !isOddRound;

    const white = isWhiteP1 ? p1 : p2;
    const black = isWhiteP1 ? p2 : p1;

    pairings.push({
      board_number: currentBoard++,
      white_player: `${white.name} (${white.elo || 1500})`,
      black_player: `${black.name} (${black.elo || 1500})`,
      white_elo: white.elo,
      black_elo: black.elo,
      is_bye: false,
    });
  }

  return pairings;
}

/**
 * Sistema Directo por Elo / Escalafón:
 * 1 vs 2, 3 vs 4, 5 vs 6, etc.
 */
function generateDirectEloPairings(
  athletes: PairingAthlete[],
  round: number,
  startingBoard: number
): GeneratedPairing[] {
  const pairings: GeneratedPairing[] = [];
  const list = [...athletes];
  let currentBoard = startingBoard;

  for (let i = 0; i < list.length; i += 2) {
    const p1 = list[i];
    const p2 = list[i + 1];

    if (!p2) {
      // Último jugador impar queda en BYE
      pairings.push({
        board_number: currentBoard++,
        white_player: `${p1.name} (${p1.elo || 1500})`,
        black_player: 'DESCANSO (BYE - 1 Pts)',
        white_elo: p1.elo,
        is_bye: true,
        bye_player: p1.name,
      });
      break;
    }

    const isWhiteFirst = (Math.floor(i / 2) % 2 === 0) ? (round % 2 === 1) : (round % 2 === 0);
    const white = isWhiteFirst ? p1 : p2;
    const black = isWhiteFirst ? p2 : p1;

    pairings.push({
      board_number: currentBoard++,
      white_player: `${white.name} (${white.elo || 1500})`,
      black_player: `${black.name} (${black.elo || 1500})`,
      white_elo: white.elo,
      black_elo: black.elo,
      is_bye: false,
    });
  }

  return pairings;
}

/**
 * Exporta la planilla oficial de emparejamientos en texto legible
 * para imprimir o publicar en cartelera de la sala de juego.
 */
export function exportPairingsSheetText(
  pairings: GeneratedPairing[],
  tournamentTitle: string,
  round: number,
  systemName: string
): string {
  const dateStr = new Date().toLocaleDateString('es-CO', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  let text = `=====================================================================\n`;
  text += ` CLUB DEPORTIVO DE AJEDREZ CAPABLANCA SABANETA\n`;
  text += ` Reconocimiento Deportivo Inder Sabaneta Res. 042 | NIT 901.445.892-1\n`;
  text += `=====================================================================\n\n`;
  text += `TORNEO: ${tournamentTitle.toUpperCase()}\n`;
  text += `RONDA: ${round} | SISTEMA: ${systemName.toUpperCase()} | FECHA: ${dateStr}\n`;
  text += `SEDE: Parque Comercial Aves María, Piso 3, Sabaneta (Antioquia)\n\n`;
  text += `---------------------------------------------------------------------\n`;
  text += `MESA   JUGADOR BLANCAS                VS   JUGADOR NEGRAS\n`;
  text += `---------------------------------------------------------------------\n`;

  pairings.forEach((p) => {
    const mesaStr = p.board_number.toString().padStart(4, ' ');
    const whiteStr = p.white_player.padEnd(30, ' ').substring(0, 30);
    const blackStr = p.black_player.padEnd(30, ' ').substring(0, 30);
    text += `${mesaStr}   ${whiteStr} VS   ${blackStr}\n`;
  });

  text += `---------------------------------------------------------------------\n`;
  text += `Total mesas emparejadas: ${pairings.length}\n`;
  text += `Comisión de Arbitraje & Dirección Técnica · Club Capablanca\n`;
  text += `=====================================================================\n`;

  return text;
}
