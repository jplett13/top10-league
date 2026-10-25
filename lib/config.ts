// The one setting you need to change: your Sleeper league ID.
// It's the long number at the end of your league's web address, e.g.
// https://sleeper.com/leagues/1234567890123456789/team  ->  "1234567890123456789"
// (You can also set SLEEPER_LEAGUE_ID in Vercel instead of editing this file.)
export const LEAGUE_ID = process.env.SLEEPER_LEAGUE_ID || "PASTE_LEAGUE_ID_HERE";

// How many players per team count toward the team total.
export const TOP_N = 10;

// How often fresh stats are pulled from Sleeper, in seconds (6 hours).
export const REFRESH_SECONDS = 6 * 60 * 60;

// Team colors, matched to each owner's Sleeper name (not case-sensitive).
export const TEAM_COLORS: Record<string, string> = {
  dmills15000: "#C8102E", // red
  jdplet: "#E8650C", // orange
  mrduch23: "#141414", // black
};
