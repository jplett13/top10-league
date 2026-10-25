# Top 10 League

Season-long standings for our Sleeper NBA league. Each team's score is the fantasy
points of its top 10 players. The team with no owner is left out automatically.
Scoring comes from the league's own scoring settings in Sleeper.
Stats refresh every 6 hours (change `REFRESH_SECONDS` in `lib/config.ts`).

## Deploy it (first time)

You need: a GitHub account, a Vercel account, and your Sleeper league ID
(the long number in your league's web address on sleeper.com).

### 1. Put the code on GitHub
1. Unzip `top10-league.zip`.
2. On github.com, click **+** (top right) → **New repository**.
   Name it `top10-league`, leave everything else as is, click **Create repository**.
3. On the next page, click the link **uploading an existing file**.
4. Open the unzipped `top10-league` folder, select everything **inside** it
   (the `app` and `lib` folders and all the files), and drag it onto the page.
5. Click **Commit changes**.

### 2. Deploy on Vercel
1. On vercel.com, click **Add New…** → **Project**.
2. If asked, connect your GitHub account, then click **Import** next to `top10-league`.
3. Vercel detects Next.js on its own. Open **Environment Variables** and add:
   - Name: `SLEEPER_LEAGUE_ID`
   - Value: your league ID, e.g. `1234567890123456789`
4. Click **Deploy**. After about a minute you get a link like `top10-league.vercel.app`.

### 3. Check it
- Open the link: you should see all three teams and their rosters.
- Open `your-link.vercel.app/api/debug` to see the raw data Sleeper sends
  (handy if points look wrong or show as 0).

## Changing things later
Edit a file directly on GitHub (pencil icon) and commit. Vercel redeploys on its own
within a minute or two.

## Run it on your computer (optional)
```
npm install
MOCK_DATA=1 npm run dev     # sample data, no league needed
npm run dev                 # your real league (set SLEEPER_LEAGUE_ID first)
```
