"use client";

import { useEffect, useRef, useState } from "react";
import { COLUMNS } from "@/lib/columns";

type GameRow = { date: string | null; opponent: string; fpts: number; stats: Record<string, number> };
type GameLog = { games: GameRow[]; grouped: "game" | "week"; source: string | null; error?: string };

type Selected = { id: string; name: string; meta: string; color: string };

const one = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function cell(key: string, value: number | undefined) {
  const n = value ?? 0;
  if (key === "plus_minus") return n > 0 ? `+${n}` : String(n);
  if (key === "min") return String(Math.round(n));
  return String(n);
}

function mmdd(date: string | null) {
  if (!date) return "–";
  const [, m, d] = date.split("-");
  return `${m}/${d}`;
}

// One popup for the whole page. Any element with data-player-id opens it.
export default function GameLogDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [player, setPlayer] = useState<Selected | null>(null);
  const [log, setLog] = useState<GameLog | null>(null);
  const [loading, setLoading] = useState(false);
  const cache = useRef(new Map<string, GameLog>());

  useEffect(() => {
    function onClick(ev: MouseEvent) {
      const el = (ev.target as HTMLElement).closest<HTMLElement>("[data-player-id]");
      if (!el) return;
      ev.preventDefault();
      const sel: Selected = {
        id: el.dataset.playerId!,
        name: el.dataset.playerName || "Player",
        meta: el.dataset.playerMeta || "",
        color: el.dataset.playerColor || "",
      };
      setPlayer(sel);
      dialogRef.current?.showModal();

      const hit = cache.current.get(sel.id);
      if (hit) {
        setLog(hit);
        return;
      }
      setLog(null);
      setLoading(true);
      fetch(`/api/gamelog/${encodeURIComponent(sel.id)}`)
        .then((r) => r.json())
        .then((data: GameLog) => {
          if (!data.error) cache.current.set(sel.id, data);
          setLog(data);
        })
        .catch(() => setLog({ games: [], grouped: "game", source: null, error: "Couldn't reach the site. Check your connection and try again." }))
        .finally(() => setLoading(false));
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  function close() {
    dialogRef.current?.close();
  }

  const games = log?.games ?? [];
  const totalF = games.reduce((s, g) => s + g.fpts, 0);

  return (
    <dialog
      ref={dialogRef}
      className="gamelog"
      aria-labelledby="gamelog-title"
      style={player?.color ? ({ ["--jersey" as string]: player.color } as React.CSSProperties) : undefined}
      onClick={(e) => {
        if (e.target === dialogRef.current) close(); // click on the backdrop
      }}
      onClose={() => setPlayer(null)}
    >
      <div className="gl-inner">
        <header className="gl-head">
          <div>
            <h2 id="gamelog-title" className="gl-name">{player?.name}</h2>
            {player?.meta && <p className="gl-meta">{player.meta}</p>}
          </div>
          {games.length > 0 && (
            <p className="gl-summary">
              {one(totalF)}
              <span>
                fantasy pts in {games.length} {log?.grouped === "week" ? "weeks" : games.length === 1 ? "game" : "games"}
              </span>
            </p>
          )}
          <button type="button" className="gl-close" onClick={close} aria-label="Close game log">
            ×
          </button>
        </header>

        {loading && <p className="gl-status">Loading games from Sleeper…</p>}
        {log?.error && <p className="gl-status">{log.error}</p>}
        {log && !log.error && games.length === 0 && (
          <p className="gl-status">No games played yet this season.</p>
        )}
        {log?.grouped === "week" && games.length > 0 && (
          <p className="gl-status">Sleeper only sent weekly totals for this player, so each row is a week.</p>
        )}

        {games.length > 0 && (
          <div className="gl-scroll">
            <table className="gl-table">
              <thead>
                <tr>
                  <th scope="col" className="gl-sticky">Opp</th>
                  <th scope="col">Date</th>
                  <th scope="col" className="gl-fpts">
                    <abbr title="Fantasy points">FPTS</abbr>
                  </th>
                  {COLUMNS.map((c) => (
                    <th scope="col" key={c.key}>
                      <abbr title={c.title}>{c.label}</abbr>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {games.map((g, i) => (
                  <tr key={`${g.date}-${i}`}>
                    <th scope="row" className="gl-sticky">{g.opponent || "–"}</th>
                    <td>{mmdd(g.date)}</td>
                    <td className="gl-fpts">{one(g.fpts)}</td>
                    {COLUMNS.map((c) => (
                      <td key={c.key}>{cell(c.key, g.stats[c.key])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </dialog>
  );
}
