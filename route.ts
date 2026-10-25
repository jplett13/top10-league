:root {
  --maple: #e3c08c;
  --paint: rgba(255, 252, 245, 0.82);
  --line: #ffffff;
  --ink: #132238;
  --ink-soft: #4a4f57;
  --track: rgba(19, 34, 56, 0.1);
  --bench: 0.5;
  --jersey-mix: 100%;
  --display: "Big Shoulders Display", "Arial Narrow", sans-serif;
  --body: "Archivo", system-ui, sans-serif;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --maple: #3a2a1a;
    --paint: rgba(255, 244, 225, 0.07);
    --line: #e9dcc4;
    --ink: #f3e9d6;
    --ink-soft: #c2b49c;
    --track: rgba(243, 233, 214, 0.12);
    --bench: 0.45;
    --jersey-mix: 35%;
    color-scheme: dark;
  }
}

:root[data-theme="dark"] {
    --maple: #3a2a1a;
    --paint: rgba(255, 244, 225, 0.07);
    --line: #e9dcc4;
    --ink: #f3e9d6;
    --ink-soft: #c2b49c;
    --track: rgba(243, 233, 214, 0.12);
    --bench: 0.45;
    --jersey-mix: 35%;
    color-scheme: dark;
}

* { box-sizing: border-box; }

html { -webkit-text-size-adjust: 100%; }

body {
  margin: 0;
  color: var(--ink);
  font-family: var(--body);
  font-size: 16px;
  line-height: 1.45;
  background-color: var(--maple);
  /* hardwood planks */
  background-image: repeating-linear-gradient(
    90deg,
    transparent 0 71px,
    rgba(90, 55, 20, 0.12) 71px 72px,
    transparent 72px 143px,
    rgba(90, 55, 20, 0.06) 143px 144px
  );
  font-variant-numeric: tabular-nums;
}

a { color: inherit; }
a:focus-visible, summary:focus-visible {
  outline: 3px solid var(--ink);
  outline-offset: 3px;
  border-radius: 4px;
}

.sr {
  position: absolute; width: 1px; height: 1px; overflow: hidden;
  clip: rect(0 0 0 0); white-space: nowrap;
}

.wrap {
  max-width: 1240px;
  margin: 0 auto;
  padding-block: 40px 64px;
  padding-left: max(16px, env(safe-area-inset-left, 0px));
  padding-right: max(16px, env(safe-area-inset-right, 0px));
}

/* ---------- hero: the race ---------- */

.hero { margin-bottom: 40px; }

.league {
  margin: 0 0 8px;
  font-weight: 500;
  color: var(--ink-soft);
}

.headline {
  margin: 0 0 28px;
  max-width: 16ch;
  font-family: var(--display);
  font-weight: 900;
  font-size: clamp(2.75rem, 8vw, 5.5rem);
  line-height: 0.92;
  letter-spacing: -0.01em;
}

.lanes {
  list-style: none;
  margin: 0;
  padding: 0;
  max-width: 920px;
}

.lane + .lane { border-top: 2px solid var(--line); }

.lane-link {
  display: grid;
  grid-template-columns: 1.5rem minmax(8rem, 13rem) 1fr 6.5rem 5.5rem;
  align-items: center;
  gap: 14px;
  padding: 12px 0;
  text-decoration: none;
}

.lane-rank, .lane-total {
  font-family: var(--display);
  font-weight: 800;
  font-size: 1.6rem;
  line-height: 1;
}

.lane-name { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lane-link:hover .lane-name { text-decoration: underline; text-underline-offset: 3px; }

.lane-track {
  height: 16px;
  background: var(--track);
  border-radius: 2px;
  overflow: hidden;
}

.lane-bar {
  display: block;
  height: 100%;
  background: var(--jersey);
  transform-origin: left;
  animation: grow 900ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
}
.lane:nth-child(2) .lane-bar { animation-delay: 120ms; }
.lane:nth-child(3) .lane-bar { animation-delay: 240ms; }

@keyframes grow { from { transform: scaleX(0); } }

.lane-total { text-align: right; }
.lane-gap { text-align: right; color: var(--ink-soft); font-size: 0.9rem; }

@media (max-width: 640px) {
  .lane-link {
    grid-template-columns: 1.5rem 1fr auto;
    grid-template-areas:
      "rank name total"
      ".    track gap";
    row-gap: 8px;
  }
  .lane-rank { grid-area: rank; }
  .lane-name { grid-area: name; }
  .lane-track { grid-area: track; }
  .lane-total { grid-area: total; }
  .lane-gap { grid-area: gap; }
}

.legend { margin: 18px 0 0; color: var(--ink-soft); font-size: 0.95rem; }

/* ---------- notices ---------- */

.notice {
  max-width: 70ch;
  margin: 0 0 32px;
  padding: 14px 18px;
  background: var(--paint);
  border-left: 6px solid var(--ink);
}
.notice h1 { font-family: var(--display); font-size: 2rem; margin: 0 0 8px; }
.notice p { margin: 0 0 6px; }

/* ---------- team rosters ---------- */

.teams {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(330px, 100%), 1fr));
  gap: 28px;
  align-items: start;
}

[style*="--jersey"] { --jersey-text: color-mix(in srgb, var(--jersey) var(--jersey-mix), var(--ink)); }

.team {
  min-width: 0;
  border-top: 10px solid var(--jersey);
  scroll-margin-top: 16px;
}

.team-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 12px;
  padding: 14px 0 12px;
}

.team-name {
  margin: 0;
  font-family: var(--display);
  font-weight: 800;
  font-size: 1.9rem;
  line-height: 1;
}

.team-owner { margin: 4px 0 0; color: var(--ink-soft); font-size: 0.9rem; }

.team-total {
  margin: 0;
  font-family: var(--display);
  font-weight: 900;
  font-size: 2.6rem;
  line-height: 0.9;
  text-align: right;
  color: var(--jersey-text);
}

.team-total span {
  display: block;
  margin-top: 4px;
  font-family: var(--body);
  font-weight: 500;
  font-size: 0.8rem;
  color: var(--ink-soft);
}

.roster {
  width: 100%;
  border-collapse: collapse;
}

.roster th {
  padding: 6px 8px;
  text-align: left;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--ink-soft);
}

.roster td {
  padding: 7px 8px;
  vertical-align: middle;
}

.roster tr.in td { background: var(--paint); }
.roster tr.in + tr.in td { border-top: 1px solid var(--track); }

/* the cut line: painted like a court line under the 10th player */
.roster tr.last-in td { border-bottom: 5px solid var(--line); }

.roster tr.out { opacity: var(--bench); }
.roster tr.out + tr.out td { border-top: 1px solid var(--track); }

.c-rank {
  width: 2.2rem;
  font-family: var(--display);
  font-weight: 800;
  font-size: 1.15rem;
  text-align: right;
}
.roster tr.in .c-rank { color: var(--jersey-text); }

.c-num { width: 3.5rem; text-align: right; white-space: nowrap; }
.roster th.c-num { text-align: right; }
.c-pts { font-weight: 600; }

.p-name { display: block; font-weight: 600; line-height: 1.2; }
.p-meta { display: block; font-size: 0.8rem; color: var(--ink-soft); }

.bubble {
  margin: 12px 0 0;
  font-size: 0.9rem;
  color: var(--ink-soft);
  max-width: 48ch;
}

/* ---------- footer ---------- */

.foot {
  margin-top: 56px;
  padding-top: 16px;
  border-top: 2px solid var(--line);
  color: var(--ink-soft);
  font-size: 0.9rem;
}
.foot p { margin: 0 0 10px; }
.foot summary { cursor: pointer; font-weight: 600; color: var(--ink); }

.scoring {
  list-style: none;
  margin: 10px 0 0;
  padding: 0;
  max-width: 320px;
}
.scoring li { display: flex; justify-content: space-between; padding: 3px 0; }

@media (prefers-reduced-motion: reduce) {
  .lane-bar { animation: none; }
}
