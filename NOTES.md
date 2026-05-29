# Session Handoff Notes

Last updated: 2026-05-28 (session 2)

## Status

| Module | State | File(s) |
|---|---|---|
| Home screen | ✅ Done | `index.html` |
| App icon (A&D split) | ✅ Done | `icons/icon-{192,512}.png` |
| Alison's Gym | ✅ Done | `gym-alison.html` + `gym.js` |
| Darlene's Gym (T3 pregnancy modified) | ✅ Done | `gym-darlene.html` + `gym.js` |
| Groceries (4-week rotation) | ✅ Done | `groceries.html` + `groceries.js` |
| Schedule (daily timeline) | ✅ Done | `schedule.html` + `schedule.js` |
| Chores & SOPs | ✅ Done | `chores.html` |
| Recipes (21 recipes, search/filter, ratings, cook log) | ✅ Done | `recipes.html` + `recipes.js` |
| Fridge Cards (4-week menu, tabbed, themed per week) | ✅ Done | `fridge.html` + `fridge.js` |
| Tracker (Body / Meals / Training / Summary / PRs) | ✅ Done | `tracker.html` + `tracker.js` |
| **Cross-module import**: Gym "Save to Tracker" + Recipes "Log to Tracker" | ✅ Done | wired in `gym.js` + `recipes.js` |
| Supabase cross-device sync (Stage 2) | ⏳ When ready | — |
| Supabase sync (Stage 2) | ⏳ After modules | — |

## Source files in Google Drive

Folder: `https://drive.google.com/drive/folders/1XKKnzSmuVSXQ6UTWwGSzmgDD3DxdSAdA`
Subfolder "Training" ID: `1UeuSAKm3_DkqqqNXs6ahMAaPJCtMYxvG` — all HTML/docx files live here.

Already imported:
- `Gym_Alison.html` — `1I__A_pQ_n8xTlomynp-13AUhnehZ6z7U`
- `Gym_Darlene.html` — `1wiLTcd69XkfCvI5v5nogn9AS1Xp9b9pg`
- `Grocery_Week_A.html` — `1euQtBOY_mf0v0dg1CVpOANmGSDbbYrxY`
- `Grocery_Week_B.html` — `1geM1SSQwZba9OJU44fflygVvAJ5pQwPv`
- `Grocery_Week_C.html` — `1iSuSpzAAQaPhcPQOSHCEs9FGkFJQ7qiS`
- `Grocery_Week_D.html` — `1UAP2ExZt7uEgKtMxv6-uk7ZpXfmPcynY`
- `Weekly_Schedule.html` — `1p7y6aDF2Q6nYIYQog2Lm1xTNsaBU6Tuc` (split into Schedule + Chores & SOPs)
- `Recipe_Book.html` — `1a2HARaLZ0kr5Mww8Hx5HLoMddouvUNt2`
- `Fridge_Cards.html` — `1M8_Q0cHrW5EfL8saxBMee_5Wk2AU9FmJ`
- `Tracker.xlsx` — `1gnYKetjpKkMsKKiiV2qg5g2oyoHJmZZY` (focused build: Body / Meals / Training history / Summary / PRs)

**All source files imported.** Remaining work is Stage 2: Supabase cross-device sync (so Darlene + Alison share Tracker data instead of each phone having its own).

## Iteration backlog (post-import improvements)

Per-tile improvements landing iteratively:

- ✅ Gym: per-exercise swap (3 alternatives + auto-updated YouTube link), per-exercise notes, PR badge auto-pulled from Tracker training history
- ✅ Chores: checkable items with auto-reset cycles (daily/weekly/monthly), per-section progress + manual reset, per-item notes
- ✅ Schedule: "Add to Calendar" .ics export per day (one-off events, next occurrence, sleep + free filtered, consecutive same-activity rows merged)
- ✅ Fridge Cards: meals checkable ("made this one") + per-cell notes, auto-reset on ISO-week change, per-week progress counter
- ✅ Recipes: user-added custom recipes (full add/edit/delete modal) + quantity prompt on Log-to-Tracker
- ⏳ Tracker: photo attachments on body-log entries (switch to IndexedDB to handle size)
- ⏳ Stage 2 backend (Supabase): cross-device sync + AI macro estimation for custom recipes
- `Test_Artifact.html` — `1BIUx778p5s5tbjCWT6HQRxo8VHJpDU0L` (skipping — looks like a test file)

To read these, use MCP tool `mcp__1e6d9f2f-647a-418f-a823-df4b3d31400f__download_file_content` with the file ID.

The `Household_Plan_v*.docx` files are source planning docs (v14 is latest) — reference only, not pages to render.

## Deployment

- Vercel project: `test` under team `alison-cryptos-projects`
- **Production URL (what's on Home Screen): `https://test-nu-green-97.vercel.app`**
- Per-deploy URLs include random hashes like `test-<hash>-alison-cryptos-projects.vercel.app` — these are frozen snapshots, do not use for the Home Screen icon.
- Auto-deploys on every push to `main`. PRs get preview deploys.

### ⚠️ Reminder for Alison

**Vercel Deployment Protection is still ON.** Darlene cannot install or open the app until this is turned off:
Vercel → project test → Settings → Deployment Protection → Vercel Authentication → Disabled (or "Only Preview Deployments" to keep PR previews protected).

## Workflow

1. Work on branch `claude/iphone-code-explanation-nJCIC`.
2. Commit with descriptive messages.
3. Push to origin.
4. Open a **draft** PR (Vercel auto-deploys a preview).
5. User reviews preview URL on iPhone, then merges to `main` themselves.
6. Production rebuilds; user closes + reopens Home Screen app twice to pick up the update via service worker.

## Conventions

### File layout

```
index.html         Home screen
gym-alison.html    Alison's gym page
gym-darlene.html   Darlene's gym page (pink theme)
groceries.html     Groceries (4-week tabbed)
styles.css         Shared styles (light + dark via prefers-color-scheme)
gym.js             Shared gym logic, reads config from body data-* attrs
groceries.js       Groceries logic, per-week storage keys
manifest.json      PWA manifest
service-worker.js  Offline cache (bump CACHE name on every release)
icons/             192 + 512 PNG icons (Alison-blue + Darlene-pink split)
```

### Storage keys (localStorage)

- Alison's gym: `rtc_gym_alison_v1` (current day's sets) + `rtc_gym_alison_prev_v1` (last week)
- Darlene's gym: `rtc_gym_darlene_v1` + `rtc_gym_darlene_prev_v1`
- Groceries: `rtc_grocery_week_{a,b,c,d}_v3` (one key per week)
- Pattern for future modules: `rtc_<module>_<scope>_v<n>`

### Theme colors

CSS custom property `--accent` (blue `#0a84ff` light / dark) is the default app accent. Per-module overrides:

- Alison's Gym — blue (default `--accent`)
- Darlene's Gym — pink: `body.theme-darlene { --gym-accent: #ec4899; }` (only overrides inside the workouts page)
- Groceries — green/pink/teal/yellow per week, driven by `--week-accent` on `body[data-active-week]`
- Home tile classes: `.tile-workouts` (blue gradient), `.tile-darlene` (pink gradient), `.tile-groceries` (rainbow gradient)

### Light/dark mode

`styles.css` defines CSS vars at `:root` and overrides under `@media (prefers-color-scheme: dark)`. All new modules must use `var(--bg)`, `var(--card)`, `var(--text)`, `var(--muted)`, `var(--border)`, `var(--accent)` — no hardcoded colors except for theme accents that look fine in both modes.

### Per-module HTML pattern

Each module page has:
- Sticky header with a back link (`‹ Home` → `index.html`), title, subtitle
- Tab/picker (day picker for gym, week picker for groceries) — same visual style
- Sticky controls (Reset / Export or Check All / Reset)
- Tap-to-toggle cards with checkboxes
- All state auto-saved to localStorage on change
- Page registers `service-worker.js` at the bottom

### Service worker

`service-worker.js` uses a cache-first strategy. **Always bump `CACHE = 'assistant-vN'`** when adding/changing/removing files, and update the `ASSETS` list to match. Otherwise installed PWAs will keep serving stale assets.

## Open architectural decisions

1. **Cross-device sync (Supabase)** — User wants gym data per-person/per-phone (don't sync), but groceries shared between Alison's and Darlene's phones (do sync). Plan to add Supabase as Stage 2 after all modules are imported. Free tier is sufficient.
2. **Sharing with Darlene** — Blocked on turning off Vercel Deployment Protection (see above). No code change needed.

## Last actions taken

- Merged PRs #1, #2, #3, #4 to main.
- Working branch is in sync with main + the merged commits.
- Branch `claude/iphone-code-explanation-nJCIC` still exists locally and on origin.

## How to pick up tomorrow

A fresh Claude session can pick up by:
1. Reading this `NOTES.md`.
2. Continuing with the next pending module (default: Weekly Schedule).
3. Following the workflow above (branch → commit → draft PR → user merges).
