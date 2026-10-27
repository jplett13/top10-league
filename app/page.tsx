import { getStandings, type Team } from "@/lib/sleeper";
import { TOP_N, REFRESH_HOUR_ET, TEAM_COLORS } from "@/lib/config";
import GameLogDialog from "./GameLogDialog";

// Render on each visit from the cached standings (refreshed daily at REFRESH_HOUR_ET).
export const dynamic = "force-dynamic";

// Jersey colors, assigned by Sleeper roster slot so a team keeps its color
// even when the standings order changes.
const JERSEYS = ["#1E4FA8", "#0E6B4C", "#6A2C9E", "#A3122A"];

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function colorFor(team: Team, all: Team[]) {
  const picked = TEAM_COLORS[team.owner.toLowerCase()] || TEAM_COLORS[team.name.toLowerCase()];
  if (picked) return picked;
  const order = [...all].sort((a, b) => a.rosterId - b.rosterId);
  return JERSEYS[order.findIndex((t) => t.rosterId === team.rosterId) % JERSEYS.length];
}

function updatedLabel(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function Page() {
  let data;
  try {
    data = await getStandings();
  } catch (err) {
    return (
      <main className="wrap">
        <section className="notice notice-error">
          <h1>Standings didn't load</h1>
          <p>{err instanceof Error ? err.message : "Sleeper didn't respond."}</p>
          <p>Reload in a minute. If it keeps happening, check the league ID in lib/config.ts.</p>
        </section>
      </main>
    );
  }

  const { teams } = data;
  const leader = teams[0];
  const runnerUp = teams[1];
  const max = Math.max(leader?.total ?? 0, 1);
  const lead = leader && runnerUp ? leader.total - runnerUp.total : 0;

  return (
    <main className="wrap">
      <header className="hero">
        <p className="league">
          {data.leagueName}, {data.season}–{String(Number(data.season) + 1).slice(2)} season
        </p>
        <h1 className="headline">
          {leader
            ? lead > 0
              ? `${leader.name} leads by ${fmt(lead)}`
              : "Dead even at the top"
            : "No teams yet"}
        </h1>

        <ol className="lanes" aria-label="Standings">
          {teams.map((t, i) => (
            <li key={t.rosterId} className="lane" style={{ ["--jersey" as string]: colorFor(t, teams) }}>
              <a href={`#team-${t.rosterId}`} className="lane-link">
                <span className="lane-rank">{i + 1}</span>
                <span className="lane-name">{t.name}</span>
                <span className="lane-track">
                  <span className="lane-bar" style={{ width: `${(t.total / max) * 100}%` }} />
                </span>
                <span className="lane-total">{fmt(t.total)}</span>
                <span className="lane-gap">{i === 0 ? "Leader" : `−${fmt(leader.total - t.total)}`}</span>
              </a>
            </li>
          ))}
        </ol>
        <p className="legend">
          Each team's top {TOP_N} players by fantasy points count. Players below the white line are on the bench. Tap a player to see his game log.
        </p>
      </header>

      {data.warning && <p className="notice">{data.warning}</p>}

      <section className="teams" aria-label="Rosters">
        {teams.map((t) => {
          const tenth = t.players[TOP_N - 1];
          const eleventh = t.players[TOP_N];
          const bubble = tenth && eleventh ? tenth.points - eleventh.points : null;
          return (
            <article
              key={t.rosterId}
              id={`team-${t.rosterId}`}
              className="team"
              style={{ ["--jersey" as string]: colorFor(t, teams) }}
            >
              <header className="team-head">
                <div>
                  <h2 className="team-name">{t.name}</h2>
                  {t.owner !== t.name && <p className="team-owner">{t.owner}</p>}
                </div>
                <p className="team-total">
                  {fmt(t.total)}
                  <span>top {TOP_N}</span>
                </p>
              </header>

              <table className="roster">
                <thead>
                  <tr>
                    <th scope="col" className="c-rank">
                      <span className="sr">Rank</span>
                    </th>
                    <th scope="col">Player</th>
                    <th scope="col" className="c-num">GP</th>
                    <th scope="col" className="c-num">
                      <abbr title="Points per game">PPG</abbr>
                    </th>
                    <th scope="col" className="c-num">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {t.players.map((p, i) => (
                    <tr key={p.id} className={`${p.counts ? "in" : "out"}${i === TOP_N - 1 ? " last-in" : ""}`}>
                      <td className="c-rank">{i + 1}</td>
                      <td>
                        <button
                          type="button"
                          className="p-name"
                          data-player-id={p.id}
                          data-player-name={p.name}
                          data-player-meta={[p.position, p.nbaTeam, t.name].filter(Boolean).join(", ")}
                          data-player-color={colorFor(t, teams)}
                        >
                          {p.name}
                        </button>
                        <span className="p-meta">
                          {[p.position, p.nbaTeam].filter(Boolean).join(", ")}
                        </span>
                      </td>
                      <td className="c-num">{p.gamesPlayed ?? "–"}</td>
                      <td className="c-num">{p.gamesPlayed ? fmt(p.points / p.gamesPlayed) : "–"}</td>
                      <td className="c-num c-pts">{fmt(p.points)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {bubble !== null && (
                <p className="bubble">
                  {eleventh.name} is {fmt(bubble)} behind {tenth.name} for the last counting spot.
                </p>
              )}
            </article>
          );
        })}
      </section>

      <footer className="foot">
        <p>
          Updated {updatedLabel(data.fetchedAt)} ET. Stats come from Sleeper and refresh once a day at{" "}
          {REFRESH_HOUR_ET % 12 || 12} {REFRESH_HOUR_ET < 12 ? "AM" : "PM"} ET.
        </p>
        {data.scoring.length > 0 && (
          <details>
            <summary>Scoring</summary>
            <ul className="scoring">
              {data.scoring.map((s) => (
                <li key={s.key}>
                  <span>{s.label}</span>
                  <span>{s.value > 0 ? `+${s.value}` : s.value}</span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </footer>
      <GameLogDialog />
    </main>
  );
}
