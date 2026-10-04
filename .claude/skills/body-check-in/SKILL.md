---
name: body-check-in
description: Weekly body check-in for the Health page of this app — review progress photos (front/side/back, relaxed and flexed), smart-scale (BIA) screenshots and tape measurements, compare them with earlier weeks, write the reviews into the app, and decide whether the diet or training plan should change. Use this whenever the user sends body or progress photos, a scale or body-composition screenshot, tape/girth measurements, asks "how do I look / am I losing fat / compare my pictures", or wants the plan adjusted from body data — even if they don't say "check-in".
---

# Body check-in

The user is training for a HYROX race and tracks body composition weekly in the app (Health → 📏 Weekly, ⚖️ Body). Your job each week: turn photos + scale + tape into an honest, evidence-based read, store it in the app, and change the plan only when the data really supports it.

Read `references/evidence.md` when you need numbers (error ranges, rates, thresholds, citations). Read `references/app-data.md` for where everything is stored and how to write it.

## Hard rules (why they exist)

- **No personal data in code or in this repo.** The repo and the deployed app files are public. Numbers, photos and notes go only into the owner-only Supabase tables. Code and this skill stay generic.
- **Photos are sensitive health data.** Store them only in the private `body-photos` bucket under the owner's folder. Never commit them, never put them in an artifact or a public page, and don't describe them beyond what the review needs.
- **One week is noise.** Scale weight swings 1–2 kg a day, BIA body fat ±2–3 points, and the tape ±1–1.5 cm. Change the plan only when at least 2 of 3 signals agree (7-day weight trend, waist trend, photos) over ≥ 2 weeks.

## Workflow

### 1. Gather
- Pull history first: `body_scans`, `body_measures`, `progress_photos`, and `progress_notes` (kinds `checkin`, `photos`, `body`), all ordered by date. Also look at the race plan week (`race-plan-data.js`, `RACE_PLAN.weekFor`) and the current macros (`diet-alison.js` → `MACROS`).
- Read the new inputs from the message: scale screenshot (write down every number and the comparison date the scale app shows), tape (13 sites, inches; convert if cm), photos (label each pose).
- Note the conditions: time of day, fasted or not, training the day before, sleep, alcohol, salty meals, creatine changes. Ask only if it changes the read. A late wake-up while still fasted counts as a morning weigh-in.

### 2. Check the photos are comparable
Use this checklist against the last set: camera height (should be belly-button height), distance (~2.5–3 m / 8–10 ft), lens/zoom, lighting, time of day, pose and stance, breathing (normal exhale), shorts and waistband height, pump (no training before).
- If 2 or more items differ, say the comparison is **not reliable** and describe what to fix. Don't call the difference progress.
- Compare relaxed shots for change. Use flexed shots only for muscle-shape notes.
- Compare against 3–4 weeks earlier, not just last week. Photos usually need ~2–4 kg of fat loss or ~3–5 cm off the waist before change is clearly visible.

### 3. Analyse (with ranges, not single numbers)
- **Scale:** report weight and the change against the last check-in and the start, in lb and kg. Treat BIA body fat, muscle and visceral fat as trend indicators only. If BIA moves against the tape and photos, trust the tape and photos and say why (water, glycogen, food).
- **Tape:** waist is the key number. Report waist ÷ height (goal < 0.50) and waist ÷ hips (men: flag ≥ 0.90). Shoulders ÷ waist and chest ÷ waist track shape. Left/right differences up to ~2% (≈ 0.5–1 cm) are normal. Flag only if > 3% or > 1.5 cm across 3+ check-ins. A smaller arm or thigh while lifts hold usually means fat loss, not muscle loss.
- **Photos:** give a body-fat *range* (e.g. "~19–23%") and a direction of change. Use the visual cue table in the evidence file. Note fat distribution, muscle-group development (delts, upper chest, lats/mid-back, quads, hamstrings/glutes, calves) and what lags.
- **Posture:** only what is visible in true side or back views and repeated across weeks. Forward head, rounded shoulders and anterior pelvic tilt are common and often normal. Present fixes as optional strength and appearance work, never as injury warnings. Marked one-sided scapular winging, pain, numbness or new asymmetry with weakness → suggest a physio.

### 4. Decide (decision rules)
Apply the rules in `references/evidence.md` §8. In short:
1. Waist down, weight stable, lifts and run paces fine → recomposition working, no change.
2. Weight down 0.5–1%/wk, waist down, performance fine → on track, no change.
3. Weight down > 1%/wk for 2+ weeks, OR key lifts down > 5%, OR easy-run HR rising at the same pace, OR poor sleep, mood or libido → add 150–250 kcal/day, mostly carbs around key sessions.
4. Weight and waist flat for 2–3 weeks → cut 150–250 kcal/day from rest and moderate days (fat or low-intensity carbs), or add 1,500–2,000 steps/day. Not more hard sessions.
5. Weight and waist both up → check logging, alcohol and weekends. Rule out water (creatine, sodium, a hard session the day before).
6. BIA fat up but tape and photos better → water artifact, ignore it.

Guardrails for this athlete:
- **Protein:** 1.6–2.2 g/kg every day.
- **Fat:** ≥ 25% of calories (testosterone, HDL).
- **Hard days stay fully fuelled.** Keep fuel high on Tue, Thu and Sat, and protect carbs around key sessions.
- **Short sleep:** under ~6 h → eat more that day.
- **Race taper:** no deficit in the last 2 weeks. Carb-load ~6–8 g/kg in the last 24–36 h.
- **Rate:** target 0.5–0.75% body weight per week at most.

### 5. Write it into the app
- Scale → upsert `body_scans`. Tape → upsert `body_measures`. Photos → see `references/app-data.md` (upload needs network access to the Supabase host; if blocked, ask the user to upload in the app under Weekly → ＋ Add this week's photos).
- Reviews → insert `progress_notes` rows:
  - `checkin`: the weekly read.
  - `photos`: the photo review, shown under the photos.
  - `body`: only when the long-term picture changes.
  - Long text times out in one big SQL call. Insert notes one per call.
- If the plan changes, edit the code (macros in `diet-alison.js`, exercises in `gym-alison.html`, rules in `race-plan.js`) with generic wording only. Bump `CACHE` in `service-worker.js`, test, commit, push, fast-forward main, and verify the deploy.

### 6. Reply to the user
Keep it short and in plain words, with lb + kg and in + cm. Use this order:
1. What changed (numbers).
2. What it means (with the error range when it matters).
3. What changes in the plan, or "no change, and why".
4. One thing to do differently next check-in.

## Photo review format (progress_notes kind `photos`)

```
Title: <Week N photos — one-line verdict>
SETUP — comparable? yes/no + what to fix
WHAT I SEE — front / back / sides / arms & legs: neutral, specific, functional
VS <date 3–4 weeks ago> — what changed, what didn't (or "too soon to see")
NEXT — 1–3 concrete actions (training, posture work, photo setup)
```

## Tone and safety
- **Neutral, specific, functional language.** For example: "waist −2.1 cm", "upper chest lags the delts", "helps the sled and the runs". Avoid "bad", "flaw", "problem area", "gross" and similar words. Credit the process: sleep, protein, consistency.
- **Watch for red flags and change course.** Distress or guilt over food or a missed session, checking photos or the tape more than weekly, wanting faster loss than 1%/wk, skipping meals, very low intake, mentions of steroids or other PEDs, diuretics or water cutting, or "I look small / disgusting". If you see these, stop the appearance coaching, say what you noticed kindly, and suggest a doctor or psychologist. Never help with PEDs, diuretics or extreme cuts.
