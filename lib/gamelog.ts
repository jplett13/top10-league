import { unstable_cache } from "next/cache";
import { LEAGUE_ID, REFRESH_SECONDS } from "./config";

export type GameRow = {
  date: string | null; // YYYY-MM-DD
  opponent: string; // e.g. "@MIA" or "MIA"
  fpts: number;
  stats: Record<string, number>;
};

export type GameLog = {
  games: GameRow[]; // most recent first
  grouped: "game" | "week"; // "week" only if Sleeper gave weekly totals instead of single games
  source: string | null;
};

const UA = { "User-Agent": "top10-league (friends fantasy scoreboard)" };

async function getJSON(url: string): Promise<any> {
  const res = await fetch(url, { headers: UA, cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// League scoring + season, cached so each popup doesn't re-ask Sleeper.
const getLeagueInfo = unstable_cache(
  async () => {
    const league = await getJSON(`https://api.sleeper.app/v1/league/${LEAGUE_ID}`);
    const scoring: Record<string, number> = {};
    for (const [k, v] of Object.entries(league?.scoring_settings || {})) {
      if (typeof v === "number" && v !== 0) scoring[k] = v;
    }
    return { season: String(league?.season || new Date().getFullYear()), scoring };
  },
  ["league-info-v1", LEAGUE_ID],
  { revalidate: REFRESH_SECONDS },
);

function candidates(id: string, season: string) {
  const base = `https://api.sleeper.com/stats/nba/player/${id}?season_type=regular&season=${season}`;
  return [`${base}&grouping=game`, `${base}&grouping=week`, base];
}

// Sleeper wraps each game in an object with a `stats` field; the outer shape
// (array, or object keyed by week/game) varies, so collect every such object.
function collectEntries(node: any, out: any[] = [], depth = 0): any[] {
  if (!node || typeof node !== "object" || depth > 4) return out;
  if (node.stats && typeof node.stats === "object" && !Array.isArray(node.stats)) {
    out.push(node);
    return out;
  }
  for (const v of Array.isArray(node) ? node : Object.values(node)) collectEntries(v, out, depth + 1);
  return out;
}

function toDate(e: any): string | null {
  const raw = e.date || e.game_date || e.metadata?.date || null;
  if (typeof raw === "string") return raw.slice(0, 10);
  if (typeof raw === "number") return new Date(raw).toISOString().slice(0, 10);
  return null;
}

function toOpponent(e: any): string {
  const opp = String(e.opponent || e.opp || e.metadata?.opponent || "").toUpperCase();
  if (!opp) return "";
  if (opp.startsWith("@") || opp.startsWith("VS")) return opp;
  const team = String(e.team || "").toUpperCase();
  const home = e.home_team || e.metadata?.home_team;
  const away = e.away_team || e.metadata?.away_team;
  const isHome =
    typeof e.is_home === "boolean" ? e.is_home
    : typeof e.home === "boolean" ? e.home
    : home && team ? String(home).toUpperCase() === team
    : away && team ? String(away).toUpperCase() !== team
    : typeof e.game_id === "string" && team && /_?[A-Z]{2,4}_?/.test(e.game_id)
      ? gameIdSaysHome(e.game_id, team, opp)
      : null;
  if (isHome === true) return opp;
  if (isHome === false) return `@${opp}`;
  return opp;
}

// Some feeds build game IDs as "<date>_<AWAY>_<HOME>" or "<AWAY>@<HOME>".
function gameIdSaysHome(gameId: string, team: string, opp: string): boolean | null {
  const id = gameId.toUpperCase();
  const t = id.indexOf(team);
  const o = id.indexOf(opp);
  if (t < 0 || o < 0) return null;
  return t > o; // home team is listed second
}

function score(stats: Record<string, number>, scoring: Record<string, number>) {
  let total = 0;
  for (const [k, v] of Object.entries(scoring)) {
    const n = Number(stats[k]);
    if (Number.isFinite(n)) total += n * v;
  }
  return Math.round(total * 10) / 10;
}

function normalize(data: any, scoring: Record<string, number>): { rows: GameRow[]; grouped: "game" | "week" } {
  const entries = collectEntries(data);
  const rows: GameRow[] = [];
  let multiGame = false;
  for (const e of entries) {
    const stats: Record<string, number> = {};
    for (const [k, v] of Object.entries(e.stats)) {
      const n = Number(v);
      if (Number.isFinite(n)) stats[k] = n;
    }
    // Skip games he didn't play (no minutes and nothing recorded).
    const played = (stats.gp ?? 0) > 0 || (stats.min ?? 0) > 0 || (stats.pts ?? 0) > 0;
    if (!played) continue;
    if ((stats.gp ?? 1) > 1) multiGame = true;
    if (stats.reb == null && (stats.oreb != null || stats.dreb != null)) {
      stats.reb = (stats.oreb ?? 0) + (stats.dreb ?? 0);
    }
    rows.push({ date: toDate(e), opponent: toOpponent(e), fpts: score(stats, scoring), stats });
  }
  rows.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  return { rows, grouped: multiGame ? "week" : "game" };
}

async function loadGameLog(id: string): Promise<GameLog> {
  const { season, scoring } = await getLeagueInfo();
  let weekly: GameLog | null = null;
  for (const url of candidates(id, season)) {
    try {
      const { rows, grouped } = normalize(await getJSON(url), scoring);
      if (rows.length === 0) continue;
      const log = { games: rows, grouped, source: url.replace(/^https:\/\//, "") };
      if (grouped === "game") return log;
      weekly ??= log; // keep looking for single games, but remember this
    } catch {
      // try the next shape
    }
  }
  return weekly ?? { games: [], grouped: "game", source: null };
}

export function getGameLog(id: string) {
  return unstable_cache(() => loadGameLog(id), ["gamelog-v1", LEAGUE_ID, id], {
    revalidate: REFRESH_SECONDS,
  })();
}

// What each candidate endpoint returns, for troubleshooting (?raw=1).
export async function rawGameLog(id: string) {
  const { season } = await getLeagueInfo();
  const out: Record<string, unknown> = {};
  for (const url of candidates(id, season)) {
    try {
      const data = await getJSON(url);
      const entries = collectEntries(data);
      out[url] = { entries: entries.length, first: entries[0] ?? null, topLevel: Array.isArray(data) ? "array" : typeof data };
    } catch (err) {
      out[url] = { error: err instanceof Error ? err.message : String(err) };
    }
  }
  return out;
}

// Sample games for local previews (MOCK_DATA=1).
export function mockGameLog(id: string): GameLog {
  const opps = ["@MIA", "BOS", "@NYK", "PHI", "@CHI", "TOR"];
  const seed = id.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  const games = opps.map((opponent, i) => {
    const r = (n: number) => ((seed * (i + 3) * 7 + n * 13) % n);
    const fgm = 6 + r(7), fga = fgm + 6 + r(6), tpm = r(5), tpa = tpm + r(5), ftm = r(8), fta = ftm + r(3);
    const oreb = r(4), dreb = 3 + r(7), pts = fgm * 2 + tpm + ftm;
    const stats = {
      min: 28 + r(10), pts, reb: oreb + dreb, ast: 2 + r(8), stl: r(3), blk: r(3), to: r(5), pf: r(5),
      plus_minus: r(21) - 10, fgm, fga, ftm, fta, tpm, tpa, oreb, dreb,
    };
    const scoring = { pts: 1, tpm: 1, fga: -1, fgm: 2, fta: -1, ftm: 1, reb: 1, ast: 2, stl: 4, blk: 4, to: -2 };
    const d = new Date(Date.UTC(2026, 9, 25 - i * 2)).toISOString().slice(0, 10);
    return { date: d, opponent, fpts: score(stats, scoring), stats };
  });
  return { games, grouped: "game", source: "sample data" };
}
