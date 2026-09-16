import { TournamentMatch } from '../types/database';

export interface PlayerStanding {
  rank: number;
  name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
  sonnebornBerger: number;
}

/**
 * Calcula la tabla de posiciones oficial y sistema de desempate Sonneborn-Berger
 * a partir de las partidas disputadas en un torneo.
 */
export function calculateTournamentStandings(matches: TournamentMatch[]): PlayerStanding[] {
  const statsMap = new Map<string, {
    name: string;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    points: number;
    opponents: Array<{ name: string; resultScore: number }>;
  }>();

  function ensurePlayer(name: string) {
    const cleanName = name.trim();
    if (!cleanName) return '';
    if (!statsMap.has(cleanName)) {
      statsMap.set(cleanName, {
        name: cleanName,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        points: 0,
        opponents: [],
      });
    }
    return cleanName;
  }

  matches.forEach((m) => {
    const white = ensurePlayer(m.white_player);
    const black = ensurePlayer(m.black_player);
    if (!white || !black) return;

    const wStats = statsMap.get(white)!;
    const bStats = statsMap.get(black)!;

    if (m.result === '1-0') {
      wStats.played += 1;
      wStats.won += 1;
      wStats.points += 1;
      wStats.opponents.push({ name: black, resultScore: 1 });

      bStats.played += 1;
      bStats.lost += 1;
      bStats.opponents.push({ name: white, resultScore: 0 });
    } else if (m.result === '0-1') {
      bStats.played += 1;
      bStats.won += 1;
      bStats.points += 1;
      bStats.opponents.push({ name: white, resultScore: 1 });

      wStats.played += 1;
      wStats.lost += 1;
      wStats.opponents.push({ name: black, resultScore: 0 });
    } else if (m.result === '1/2-1/2') {
      wStats.played += 1;
      wStats.drawn += 1;
      wStats.points += 0.5;
      wStats.opponents.push({ name: black, resultScore: 0.5 });

      bStats.played += 1;
      bStats.drawn += 1;
      bStats.points += 0.5;
      bStats.opponents.push({ name: white, resultScore: 0.5 });
    }
  });

  // Calcular desempate Sonneborn-Berger
  // Suma de puntos de los oponentes derrotados + la mitad de los puntos de oponentes empatados
  const standings: PlayerStanding[] = Array.from(statsMap.values()).map((p) => {
    let sb = 0;
    p.opponents.forEach((opp) => {
      const oppTotalPoints = statsMap.get(opp.name)?.points || 0;
      if (opp.resultScore === 1) {
        sb += oppTotalPoints;
      } else if (opp.resultScore === 0.5) {
        sb += oppTotalPoints * 0.5;
      }
    });

    return {
      rank: 0,
      name: p.name,
      played: p.played,
      won: p.won,
      drawn: p.drawn,
      lost: p.lost,
      points: p.points,
      sonnebornBerger: Math.round(sb * 100) / 100,
    };
  });

  // Ordenar por: 1) Puntos, 2) Sonneborn-Berger, 3) Partidas ganadas, 4) Nombre alfabético
  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.sonnebornBerger !== a.sonnebornBerger) return b.sonnebornBerger - a.sonnebornBerger;
    if (b.won !== a.won) return b.won - a.won;
    return a.name.localeCompare(b.name);
  });

  // Asignar puestos
  standings.forEach((s, idx) => {
    s.rank = idx + 1;
  });

  return standings;
}

/**
 * Exporta la tabla de posiciones a un archivo CSV con membrete del Club Capablanca
 */
export function exportStandingsToCsv(tournamentTitle: string, standings: PlayerStanding[]): void {
  let csv = '\uFEFF';
  csv += 'CLUB DEPORTIVO DE AJEDREZ CAPABLANCA SABANETA\n';
  csv += 'Personería Deportiva Resolución Inder Sabaneta 042 - NIT 901.445.892-1\n';
  csv += `TABLA DE POSICIONES Y CLASIFICACIÓN OFICIAL: "${tournamentTitle}"\n`;
  csv += `Fecha de Emisión: ${new Date().toLocaleDateString('es-CO')}\n\n`;
  csv += 'Puesto,Deportista,Partidas Jugadas (PJ),Ganadas (PG),Empatadas (PE),Perdidas (PP),Puntos Totales (PTS),Desempate Sonneborn-Berger\n';

  standings.forEach((s) => {
    csv += `${s.rank},"${s.name}",${s.played},${s.won},${s.drawn},${s.lost},${s.points},${s.sonnebornBerger}\n`;
  });

  csv += `\nTotal Jugadores Clasificados: ${standings.length}\n`;
  csv += 'Arbitro Principal: _____________________________  Vo.Bo. Coordinación Técnica: _____________________________\n';

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const sanitized = tournamentTitle.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30);
  link.setAttribute('download', `Posiciones_${sanitized}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
