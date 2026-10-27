// The one setting you need to change: your Sleeper league ID.
// It's the long number at the end of your league's web address, e.g.
// https://sleeper.com/leagues/1234567890123456789/team  ->  "1234567890123456789"
// (You can also set SLEEPER_LEAGUE_ID in Vercel instead of editing this file.)
export const LEAGUE_ID = process.env.SLEEPER_LEAGUE_ID || "PASTE_LEAGUE_ID_HERE";

// How many players per team count toward the team total.
export const TOP_N = 10;

// Stats refresh once a day at this hour, Eastern time (6 = 6 AM).
export const REFRESH_HOUR_ET = 6;

// Saved data is kept at most this long; the daily key below is what forces the refresh.
export const CACHE_SECONDS = 2 * 24 * 60 * 60;

// The date of the most recent refresh time, e.g. "2026-10-27". It changes at
// 6 AM ET, so the first visit after 6 AM pulls fresh stats from Sleeper and
// everyone sees that same copy until 6 AM the next day.
export function refreshDay(now = new Date()): string {
  const shifted = new Date(now.getTime() - REFRESH_HOUR_ET * 60 * 60 * 1000);
  return shifted.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

// Team colors, matched to each owner's Sleeper name (not case-sensitive).
export const TEAM_COLORS: Record<string, string> = {
  dmills15000: "#C8102E", // red
  jdplet: "#E8650C", // orange
  mrduch23: "#141414", // black
};
