import type { Standings, Team, PlayerRow } from "./sleeper";
import { TOP_N } from "./config";

// Sample data for previewing the design locally (run with MOCK_DATA=1).
// Never used on the live site.
const ROSTERS: [string, string, string][][] = [
  [
    ["Nikola Jokic", "C", "DEN"], ["Luka Doncic", "PG", "LAL"], ["Anthony Edwards", "SG", "MIN"],
    ["Jalen Brunson", "PG", "NYK"], ["Paolo Banchero", "PF", "ORL"], ["Alperen Sengun", "C", "HOU"],
    ["Derrick White", "SG", "BOS"], ["Jalen Williams", "SF", "OKC"], ["Franz Wagner", "SF", "ORL"],
    ["Jarrett Allen", "C", "CLE"], ["Mikal Bridges", "SF", "NYK"], ["Coby White", "PG", "CHI"],
    ["Jalen Duren", "C", "DET"], ["Keegan Murray", "PF", "SAC"], ["Norman Powell", "SG", "MIA"],
    ["Naz Reid", "C", "MIN"], ["Herbert Jones", "SF", "NOP"], ["Payton Pritchard", "PG", "BOS"],
    ["Ausar Thompson", "SF", "DET"], ["Andrew Nembhard", "PG", "IND"],
  ],
  [
    ["Shai Gilgeous-Alexander", "PG", "OKC"], ["Giannis Antetokounmpo", "PF", "MIL"], ["Cade Cunningham", "PG", "DET"],
    ["Tyrese Maxey", "PG", "PHI"], ["Karl-Anthony Towns", "C", "NYK"], ["Scottie Barnes", "SF", "TOR"],
    ["Evan Mobley", "PF", "CLE"], ["Desmond Bane", "SG", "ORL"], ["Josh Giddey", "PG", "CHI"],
    ["Ivica Zubac", "C", "LAC"], ["Austin Reaves", "SG", "LAL"], ["Deni Avdija", "SF", "POR"],
    ["Brandon Miller", "SF", "CHA"], ["Walker Kessler", "C", "UTA"], ["Amen Thompson", "SG", "HOU"],
    ["Dyson Daniels", "SG", "ATL"], ["Jaden McDaniels", "PF", "MIN"], ["Christian Braun", "SG", "DEN"],
    ["Toumani Camara", "PF", "POR"], ["Isaiah Hartenstein", "C", "OKC"],
  ],
  [
    ["Victor Wembanyama", "C", "SAS"], ["Tyrese Haliburton", "PG", "IND"], ["Donovan Mitchell", "SG", "CLE"],
    ["Devin Booker", "SG", "PHX"], ["LaMelo Ball", "PG", "CHA"], ["Trae Young", "PG", "ATL"],
    ["Domantas Sabonis", "C", "SAC"], ["Jaren Jackson Jr.", "PF", "MEM"], ["De'Aaron Fox", "PG", "SAS"],
    ["Pascal Siakam", "PF", "IND"], ["Lauri Markkanen", "PF", "UTA"], ["Bam Adebayo", "C", "MIA"],
    ["Jamal Murray", "PG", "DEN"], ["Zion Williamson", "PF", "NOP"], ["Myles Turner", "C", "MIL"],
    ["OG Anunoby", "SF", "NYK"], ["Josh Hart", "SG", "NYK"], ["Kristaps Porzingis", "C", "ATL"],
    ["Tobias Harris", "PF", "DET"], ["Rudy Gobert", "C", "MIN"],
  ],
];

function points(team: number, slot: number) {
  // Plausible early-season totals: stars first, deep bench near zero.
  const base = 290 - slot * 13.5 + ((team * 37 + slot * 53) % 41) - 20;
  const form = [1.05, 0.97, 1.0][team];
  return Math.max(0, Math.round(base * form * 10) / 10);
}

export function mockStandings(): Standings {
  const names = ["Sample team one", "Sample team two", "Sample team three"];
  const teams: Team[] = ROSTERS.map((roster, t) => {
    const players: PlayerRow[] = roster
      .map(([name, position, nbaTeam], i) => ({
        id: `${t}-${i}`,
        name,
        position,
        nbaTeam,
        gamesPlayed: i === 13 && t === 2 ? 2 : 6,
        points: points(t, i),
        counts: false,
      }))
      .sort((a, b) => b.points - a.points);
    players.forEach((p, i) => (p.counts = i < TOP_N));
    const total = Math.round(players.filter((p) => p.counts).reduce((s, p) => s + p.points, 0) * 10) / 10;
    return { rosterId: t + 1, name: names[t], owner: `owner${t + 1}`, total, players };
  }).sort((a, b) => b.total - a.total);

  return {
    leagueName: "Sample league",
    season: "2026",
    teams,
    scoring: [
      { key: "pts", label: "Points", value: 1 },
      { key: "tpm", label: "3-pointers made", value: 1 },
      { key: "fga", label: "Field goals attempted", value: -1 },
      { key: "fgm", label: "Field goals made", value: 2 },
      { key: "fta", label: "Free throws attempted", value: -1 },
      { key: "ftm", label: "Free throws made", value: 1 },
      { key: "reb", label: "Rebounds", value: 1 },
      { key: "ast", label: "Assists", value: 2 },
      { key: "stl", label: "Steals", value: 4 },
      { key: "blk", label: "Blocks", value: 4 },
      { key: "to", label: "Turnovers", value: -2 },
    ],
    statsSource: "sample data",
    fetchedAt: new Date().toISOString(),
    warning: null,
  };
}
