# Where body check-in data lives

Everything personal is in Supabase (project id is in `supabase-config.js`). Every table has owner-only RLS. Write with the Supabase MCP `execute_sql`. The owner's `user_id` is the `user_id` on the existing rows. Read it from the table; don't hard-code it in code.

## Tables
| Table | Key | What |
|---|---|---|
| `body_scans` | (user_id, measured) | Smart-scale reading: `weight_lb, bmi, body_fat_pct, skeletal_muscle_pct, fat_free_lb, subq_fat_pct, visceral, water_pct, muscle_lb, bone_lb, protein_pct, bmr_kcal, metabolic_age, waist_cm, source, note`. The scale app's "compared with <date>" screen gives the previous reading's values as (value − change). Add that row too if it's missing, with a note saying it was worked back. |
| `body_measures` | (user_id, measured) | Tape in **inches**: `calf_r, calf_l, thigh_r, thigh_l, hips, waist, chest, bicep_l, bicep_r, forearm_l, forearm_r, shoulders, neck, note`. The app also lets the user log these. |
| `progress_photos` | (user_id, taken, pose) | `pose` ∈ `front, side_r, back, side_l, front_flex, side_r_flex, back_flex, side_l_flex`. `path` = `<user_id>/<YYYY-MM-DD>/<pose>.jpg` in the private `body-photos` bucket (owner-folder policies). |
| `progress_notes` | (user_id, kind, noted) | `kind` ∈ `body` (Body tab read), `workouts` (Workouts tab), `checkin` (Weekly tab read), `photos` (review shown under the photos). Fields: `title`, `summary` (plain text, `\n` for lines, `•` bullets). One per kind per day; a newer date becomes the one shown. |
| `health_workouts` | — | Watch/Fitness sessions: `name, start_ts, duration_s, distance_km, avg_hr, max_hr, active_kcal, effort, cadence_spm, elev_m, place, note`. |
| `lab_results`, `lab_notes` | — | Blood work (Labs tab). |

## Writing tips
- Long `progress_notes` inserts can time out when several statements go in one call. Send one insert per call. After a timeout, check what landed before retrying; a timed-out call usually rolled back.
- Use `E'...'` strings with `\n`. Escape single quotes by doubling them.
- Schema changes go through `apply_migration` *and* get appended (schema only) to the newest file in `supabase/migrations/`.

## Photos
- **The user uploads in the app:** Health → 📏 Weekly → ＋ Add this week's photos (compressed on the phone, then saved privately).
- **Photos sent in chat:**
  - Review them from the chat images.
  - Store them only if this environment can reach `<project>.supabase.co`. Check with `curl -s -o /dev/null -w "%{http_code}" https://<project>.supabase.co/rest/v1/`; `000` means it's blocked by the network policy.
  - **If reachable:** deploy a short-lived edge function guarded by a random token (fixed owner folder and date, JPEG only, size-capped). Upload with curl, insert the `progress_photos` rows, then redeploy the function as a disabled stub (there's no delete tool).
  - **If blocked:** tell the user to add the host under the environment's Network access (Custom → Allowed domains), or to upload in the app.
- Never commit photos, never put them in an artifact, and never log their contents.

## Code touch points (generic wording only — repo is public)
- **Diet calories/macros:** `diet-alison.js` → `MACROS` (EASY/MOD/HIGH/PEAK) plus smoothie items. Also update the summary text in `diet-alison.html` and the rules in `race-plan.js`.
- **Exercises:** `gym-alison.html` (day pages `strB`, `upper`, `strA`, `strC`). New exercise ids also go in `gym-load.js` if they use load.
- **Weekly tab UI:** `checkin.js`. Body/Workouts tabs: `progress.js`. Units: `units.js` (auto lb↔kg, km↔mi, m↔ft/yd, cm↔in, pace).
- **After any code change:**
  1. Bump `CACHE` in `service-worker.js`.
  2. Test with Playwright (Chromium at `/opt/pw-browsers/chromium`; stub `auth-gate.js` and `supabase-client.js`).
  3. Commit and push the branch, fast-forward `main`.
  4. Verify the Vercel deploy.
