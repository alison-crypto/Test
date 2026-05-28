# Alison's Assistant

A personal Progressive Web App (PWA) for Alison and Darlene — workouts, meals,
budget, and more, with per-person separation where it matters.

Current modules:
- **Alison's Gym** — 4-day Upper/Lower split (Upper A / Lower A / Upper B / Lower B)
- **Darlene's Gym** — T3 pregnancy-modified plan with safety banner, RPE 6-7 cap, 45° incline only
- **Groceries** — 4-week rotation (Original / Mediterranean / Moroccan-Indian / Latin-Cajun), each with Meals + Fixed Weekly + Pantry sections, tap-to-check, separate state per week

Other tiles are placeholders for upcoming modules (Schedule, Recipes,
Fridge Cards, Tracker).

## Run it locally

From this folder:

```
python3 -m http.server 8000
```

Open `http://localhost:8000` in any browser.

## Install on iPhone / iPad

1. Deploy the folder somewhere (see below) and open the URL in **Safari**.
2. Tap the share button → **Add to Home Screen**.
3. Open it from the home screen — it runs fullscreen like a native app.

## Free deployment (one-time setup)

The easiest path is **Vercel**:

1. Go to https://vercel.com and sign in with the GitHub account that owns this repo.
2. Click **Add New → Project** and import this repository.
3. Accept the defaults and click **Deploy**. You get a URL like
   `alison-assistant.vercel.app`. Every push updates it automatically.

Netlify and GitHub Pages also work — any static host will do.

## Data

Stage 1 stores entries in the browser's **localStorage** on each device.
This means data does **not** sync between phone and laptop yet.
Stage 2 will add a Supabase backend for cross-device sync.

Use the **Export** button on each module to back up your data as JSON.

## Project layout

```
index.html        Home screen with tiles
workouts.html     Workout module page
styles.css        Shared styles (light + dark mode)
app.js            Shared utilities (storage, dates)
workouts.js       Workout module logic
manifest.json     PWA install metadata
service-worker.js Offline cache
icons/            App icons
```
