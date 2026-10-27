import { unstable_cache } from "next/cache";
import { LEAGUE_ID, TOP_N, CACHE_SECONDS, refreshDay } from "./config";
import { mockStandings } from "./mock";

export type PlayerRow = {
  id: string;
  name: string;
  position: string;
  nbaTeam: string;
  gamesPlayed: number | null;
  points: number;
  counts: boolean; // true for the team's top N
};

export type Team = {
  rosterId: number;
  name: string;
  owner: string;
  total: number; // sum of top N
  players: PlayerRow[]; // sorted high to low
};

export type Standings = {
  leagueName: string;
  season: string;
  teams: Team[]; // sorted by total, high to low
  scoring: { key: string; label: string; value: number }[];
  statsSource: string | null;
  fetchedAt: string; // ISO time the data was pulled
  warning: string | null;
};

type StatLine = Record<string, number>;
type PlayerMeta = { name: string; position: string; team: string };

const UA = { "User-Agent": "top10-league (friends fantasy scoreboard)" };

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: UA, cache: "no-store" });
  if (!res.ok) throw new Error(`Sleeper returned ${res.status} for ${url}`);
  return res.json() as Promise<T>;
}

const STAT_LABELS: Record<string, string> = {
  pts: "Points",
  reb: "Rebounds",
  ast: "Assists",
  stl: "Steals",
  blk: "Blocks",
  to: "Turnovers",
  fgm: "Field goals made",
  fga: "Field goals attempted",
  ftm: "Free throws made",
  fta: "Free throws attempted",
  tpm: "3-pointers made",
  tpa: "3-pointers attempted",
  dd: "Double-double",
  td: "Triple-double",
};

function metaFromSleeperPlayer(p: any): PlayerMeta | null {
  if (!p) return null;
  const name =
    p.full_name ||
    [p.first_name, p.last_name].filter(Boolean).join(" ") ||
    null;
  if (!name) return null;
  const position =
    p.position || (Array.isArray(p.fantasy_positions) ? p.fantasy_positions.join("/") : "") || "";
  return { name, position, team: p.team || "FA" };
}

/**
 * Season stat totals for every NBA player. Sleeper doesn't officially document
 * NBA stats, so this tries the two endpoint shapes Sleeper uses and takes the
 * first that returns data.
 */
async function getSeasonStats(seasons: string[]) {
  const attempts: { label: string; url: (s: string) => string; parse: (d: any) => [string, StatLine, any][] }[] = [
    {
      label: "api.sleeper.com/stats/nba",
      url: (s) => `https://api.sleeper.com/stats/nba/${s}?season_type=regular`,
      parse: (d) =>
        Array.isArray(d)
          ? d.filter((e) => e && e.player_id && e.stats).map((e) => [String(e.player_id), e.stats, e.player])
          : [],
    },
    {
      label: "api.sleeper.app/v1/stats/nba",
      url: (s) => `https://api.sleeper.app/v1/stats/nba/regular/${s}`,
      parse: (d) =>
        d && typeof d === "object" && !Array.isArray(d)
          ? Object.entries(d).map(([id, stats]) => [id, stats as StatLine, null])
          : [],
    },
  ];

  for (const season of seasons) {
    for (const a of attempts) {
      try {
        const rows = a.parse(await getJSON<any>(a.url(season)));
        if (rows.length === 0) continue;
        const stats: Record<string, StatLine> = {};
        const meta: Record<string, PlayerMeta> = {};
        for (const [id, line, player] of rows) {
          stats[id] = line;
          const m = metaFromSleeperPlayer(player);
          if (m) meta[id] = m;
        }
        return { source: `${a.label} (${season})`, stats, meta };
      } catch {
        // try the next endpoint
      }
    }
  }
  return { source: null, stats: {} as Record<string, StatLine>, meta: {} as Record<string, PlayerMeta> };
}

function scoreLine(line: StatLine | undefined, scoring: Record<string, number>) {
  if (!line) return 0;
  let total = 0;
  for (const [key, value] of Object.entries(scoring)) {
    const n = Number(line[key]);
    if (Number.isFinite(n)) total += n * value;
  }
  return Math.round(total * 10) / 10;
}

function gamesPlayed(line: StatLine | undefined): number | null {
  if (!line) return null;
  for (const k of ["gp", "gms_active", "gs"]) {
    const n = Number(line[k]);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

async function loadStandings(): Promise<Standings> {
  if (process.env.MOCK_DATA === "1") return mockStandings();

  if (!/^\d+$/.test(LEAGUE_ID)) {
    throw new Error("No league ID yet. Add your Sleeper league ID in lib/config.ts.");
  }

  const base = `https://api.sleeper.app/v1/league/${LEAGUE_ID}`;
  const [league, rosters, users, state] = await Promise.all([
    getJSON<any>(base),
    getJSON<any[]>(`${base}/rosters`),
    getJSON<any[]>(`${base}/users`),
    getJSON<any>("https://api.sleeper.app/v1/state/nba").catch(() => null),
  ]);
  if (!league) throw new Error(`Sleeper has no league with ID ${LEAGUE_ID}.`);

  const scoring: Record<string, number> = {};
  for (const [k, v] of Object.entries(league.scoring_settings || {})) {
    if (typeof v === "number" && v !== 0) scoring[k] = v;
  }

  const seasons = [...new Set([league.season, state?.season].filter(Boolean).map(String))];
  const { source, stats, meta } = await getSeasonStats(seasons);

  // Only teams with an owner count. The filler team has no owner and is dropped.
  const owned = rosters.filter((r) => r.owner_id);
  const rosteredIds = owned.flatMap((r) => (r.players || []).map(String));

  // Fill in names the stats feed didn't include from Sleeper's player list.
  if (rosteredIds.some((id) => !meta[id])) {
    try {
      const all = await getJSON<Record<string, any>>("https://api.sleeper.app/v1/players/nba");
      for (const id of rosteredIds) {
        if (!meta[id]) {
          const m = metaFromSleeperPlayer(all[id]);
          if (m) meta[id] = m;
        }
      }
    } catch {
      // names fall back to the player ID below
    }
  }

  const userById = new Map(users.map((u) => [u.user_id, u]));

  const teams: Team[] = owned.map((r) => {
    const user = userById.get(r.owner_id);
    const owner = user?.display_name || "Unknown owner";
    const name = user?.metadata?.team_name || owner;

    const players = (r.players || [])
      .map(String)
      .map((id: string) => {
        const m = meta[id];
        return {
          id,
          name: m?.name || `Player ${id}`,
          position: m?.position || "",
          nbaTeam: m?.team || "",
          gamesPlayed: gamesPlayed(stats[id]),
          points: scoreLine(stats[id], scoring),
          counts: false,
        };
      })
      .sort((a: PlayerRow, b: PlayerRow) => b.points - a.points || a.name.localeCompare(b.name));

    players.forEach((p: PlayerRow, i: number) => (p.counts = i < TOP_N));
    const total = Math.round(players.filter((p: PlayerRow) => p.counts).reduce((s: number, p: PlayerRow) => s + p.points, 0) * 10) / 10;

    return { rosterId: r.roster_id, name, owner, total, players };
  });

  teams.sort((a, b) => b.total - a.total);

  return {
    leagueName: league.name || "Our league",
    season: String(league.season),
    teams,
    scoring: Object.entries(scoring).map(([key, value]) => ({ key, label: STAT_LABELS[key] || key, value })),
    statsSource: source,
    fetchedAt: new Date().toISOString(),
    warning: source
      ? null
      : "Sleeper isn't returning season stats yet, so every player shows 0 points. Rosters are correct; points will fill in on a later refresh.",
  };
}

// Cache the finished standings until the next 6 AM ET. Errors are never cached,
// so a hiccup on Sleeper's side fixes itself on the next visit.
export function getStandings() {
  return unstable_cache(loadStandings, ["standings-v2", LEAGUE_ID, refreshDay()], {
    revalidate: CACHE_SECONDS,
  })();
}

// Uncached raw look at what Sleeper returns, for /api/debug.
export async function debugSnapshot() {
  const base = `https://api.sleeper.app/v1/league/${LEAGUE_ID}`;
  const league = await getJSON<any>(base);
  const rosters = await getJSON<any[]>(`${base}/rosters`);
  const state = await getJSON<any>("https://api.sleeper.app/v1/state/nba").catch(() => null);
  const seasons = [...new Set([league?.season, state?.season].filter(Boolean).map(String))];
  const { source, stats } = await getSeasonStats(seasons);
  const sampleId = (rosters.find((r) => r.owner_id)?.players || []).find((id: string) => stats[id]);
  const statKeys = new Set(Object.values(stats).flatMap((l) => Object.keys(l)));
  const scoringKeys = Object.keys(league?.scoring_settings || {});
  return {
    league: { name: league?.name, season: league?.season, status: league?.status },
    rosters: rosters.map((r) => ({ roster_id: r.roster_id, owner_id: r.owner_id, players: (r.players || []).length })),
    statsSource: source,
    playersWithStats: Object.keys(stats).length,
    scoringSettings: league?.scoring_settings,
    scoringKeysMissingFromStats: scoringKeys.filter((k) => !statKeys.has(k)),
    sampleStatLine: sampleId ? { player_id: sampleId, stats: stats[sampleId] } : null,
  };
}
