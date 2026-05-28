# Alison's Assistant

A personal Progressive Web App (PWA) for Alison and Darlene — workouts, meals,
budget, and more, with per-person separation where it matters.

Current modules:
- **Alison's Gym** — 4-day Upper/Lower split (Upper A / Lower A / Upper B / Lower B)
- **Darlene's Gym** — T3 pregnancy-modified plan with safety banner, RPE 6-7 cap, 45° incline only
- **Groceries** — 4-week rotation (Original / Mediterranean / Moroccan-Indian / Latin-Cajun), each with Meals + Fixed Weekly + Pantry sections, tap-to-check, separate state per week
- **Schedule** — daily timeline with day picker, defaults to today; Alison/Darlene/Together info cards
- **Chores & SOPs** — daily / weekly / monthly / as-needed chore master list with who-chips, plus SOPs (Sunday setup, gym morning, meal prep, cat care), pregnancy ramp, and time accounting
- **Recipes** — 21 recipes with search + cuisine/type filter pills, expandable cards showing ingredients/method/macros (him + her), per-person 5-star ratings, and a "just cooked this" log
- **Fridge Cards** — 4-week menu rotation card view (A → B → C → D → A) with daily fixed bar (breakfast/snacks/pre-post), Mon–Sun lunch+dinner grid, and Sunday-prep + don't-forget reminders per week
- **Tracker** — Body Log (weekly weight/measurements), Meal Log (today's macros auto-totalled), Training history, Weekly Summary roll-up, and auto-computed PRs

**Cross-module integration**: Gym pages have a "Save to Tracker" button that writes the day's logged sets into the Tracker's training history (which then drives PRs and Weekly Summary). Recipe cards have a "Log to Tracker" button that pushes a meal entry with the recipe's macros.

All source files imported. Next phase: Supabase cross-device sync so Alison + Darlene share Tracker data.

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
