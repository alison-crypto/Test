// hyrox-options.js — researched replacement cards for every HYROX station
// (Sep 2026). Three full alternatives per station — each with its own
// distance/reps or load dial, race-equivalent target and six-tier time table —
// for when the real equipment (sled, wall, erg, lane) isn't available.
// Sources: HYROX rulebook + station-split analyses (HyroxDataLab, HyroxInsider),
// Repz, Hello Hyrox, Roxfit, RoxLyfe, TrainRox, simongPT, Concept2, CrossFit /
// Invictus / Mayhem machine-conversion charts. Substitute loads and times are
// calibrated so a race-pace effort lasts about as long as the real station at
// that tier (estimates, ±10–15%). Times in ms.
const HX_OPTIONS = {
 "push": {
  "officialTimes": {
   "beginner": 300000,
   "amateur": 225000,
   "intermediate": 180000,
   "competition": 135000,
   "elite": 100000,
   "wr": 75000
  },
  "officialNote": "4 x 12.5 m = 50 m, Men's Open 152 kg incl. sled (Men's Pro 202 kg). Push from behind, hands on the vertical poles, turn at each 12.5 m lane end.",
  "alts": [
   {
    "name": "Dead-mill push",
    "why": "Same horizontal drive pattern (forward lean, arms locked, short piston steps, no eccentric) against belt friction for the same 2-4 min effort.",
    "equip": "Treadmill (motor OFF, belt-driven; or curved manual treadmill), incline 0-3%",
    "scale": "amount",
    "compNote": "100 m of belt at hard effort ≈ 50 m race sled at 152 kg (split 4 x 25 m to mirror lanes)",
    "times": {
     "beginner": 270000,
     "amateur": 210000,
     "intermediate": 165000,
     "competition": 125000,
     "elite": 95000,
     "wr": 70000
    },
    "cues": [
     "Hands on the rails/console at hip-chest height, body at ~45°, arms locked",
     "Short, fast, flat-foot steps driving the belt back"
    ],
    "mistake": "Standing too upright and running on the belt instead of driving it; also check your gym allows motor-off pushing (it can strain some motors).",
    "video": "deadmill treadmill sled push hyrox technique",
    "img": "Sled_Push",
    "unit": "m",
    "start": 40,
    "race": 100,
    "step": 10
   },
   {
    "name": "Leg-press burnout",
    "why": "Loads the same quads/glutes that limit the sled push, with continuous reps that reproduce the leg burn and heart rate of a 2-4 min push.",
    "equip": "45° leg press (hack squat works too)",
    "scale": "weight",
    "compNote": "4 x 15 reps, 10 s rack between sets to mirror lane turns; ~140 kg added ≈ race sled 152 kg effort for a 94 kg athlete",
    "times": {
     "beginner": 240000,
     "amateur": 195000,
     "intermediate": 160000,
     "competition": 125000,
     "elite": 100000,
     "wr": 80000
    },
    "cues": [
     "Feet mid-platform, hip-width; press through the whole foot",
     "Stop just short of lockout to keep tension, steady tempo"
    ],
    "mistake": "Cutting depth to half reps or slamming lockout to rest between reps.",
    "video": "high rep leg press hyrox sled push alternative",
    "img": "Leg_Press",
    "wUnit": "kg plates added",
    "startW": 60,
    "raceW": 140,
    "stepW": 10,
    "dist": 60,
    "unit": "reps"
   },
   {
    "name": "DB walking lunge",
    "why": "Sled push is a series of single-leg drives; heavy walking lunges train that unilateral quad drive while moving over ground for 2-4 min.",
    "equip": "2 dumbbells (or kettlebells), ~20 m floor",
    "scale": "weight",
    "compNote": "50 m (turn every 12.5 m like the race lanes) with 2 x 30 kg ≈ race sled 152 kg effort",
    "times": {
     "beginner": 255000,
     "amateur": 200000,
     "intermediate": 160000,
     "competition": 125000,
     "elite": 100000,
     "wr": 80000
    },
    "cues": [
     "Short-to-medium stride, drive off the front heel",
     "Torso slightly forward, back knee kisses the floor"
    ],
    "mistake": "Overstriding and letting the torso fold, which moves the work off the quads.",
    "video": "dumbbell walking lunge technique",
    "img": "Dumbbell_Lunges",
    "wUnit": "kg/hand",
    "startW": 12,
    "raceW": 30,
    "stepW": 2,
    "dist": 50,
    "unit": "m"
   }
  ]
 },
 "pull": {
  "officialTimes": {
   "beginner": 390000,
   "amateur": 300000,
   "intermediate": 240000,
   "competition": 165000,
   "elite": 120000,
   "wr": 85000
  },
  "officialNote": "4 x 12.5 m = 50 m, Men's Open 103 kg incl. sled (Men's Pro 153 kg). Hand-over-hand rope pull while standing in a 1.8 m box behind the line; walk back to reset at each lane end.",
  "alts": [
   {
    "name": "Seated cable row, high-rep",
    "why": "Heavy, high-rep seated row is the closest gym match to hand-over-hand mechanics: lats, mid-back, biceps and grip under continuous tension for 2-5 min.",
    "equip": "Seated cable row (use a rope or thick-grip attachment to add grip demand)",
    "scale": "weight",
    "compNote": "4 x 15 reps (10 s break = walk-back) at ~50 kg stack ≈ the ~45-50 kg of rope force needed to keep a 103 kg sled moving on carpet",
    "times": {
     "beginner": 300000,
     "amateur": 240000,
     "intermediate": 190000,
     "competition": 140000,
     "elite": 105000,
     "wr": 80000
    },
    "cues": [
     "Sit tall, lean back ~10° and drive with legs slightly (like the anchored race stance)",
     "Pull elbows past the ribs, then reach long"
    ],
    "mistake": "Arms-only yanking with a rounded back when fatigue hits.",
    "video": "seated cable row high reps hyrox sled pull alternative",
    "img": "Seated_Cable_Rows",
    "wUnit": "kg stack",
    "startW": 30,
    "raceW": 50,
    "stepW": 5,
    "dist": 60,
    "unit": "reps"
   },
   {
    "name": "TRX / ring row",
    "why": "A horizontal pull with a leaned-back body angle and a heavy grip load, done as a continuous high-rep set, gives the same back, biceps and grip fatigue as the pull.",
    "equip": "TRX straps or rings",
    "scale": "amount",
    "compNote": "60 reps at ~45° body angle (feet walked forward), in 4 blocks, ≈ 50 m race pull at 103 kg",
    "times": {
     "beginner": 270000,
     "amateur": 210000,
     "intermediate": 165000,
     "competition": 120000,
     "elite": 90000,
     "wr": 70000
    },
    "cues": [
     "Body rigid like a plank, heels planted",
     "Squeeze shoulder blades, pull handles to the ribs"
    ],
    "mistake": "Standing too upright to make it easy; the angle is the load.",
    "video": "TRX row technique",
    "img": "Inverted_Row_with_Straps",
    "unit": "reps",
    "start": 20,
    "race": 60,
    "step": 5
   },
   {
    "name": "DB bent-over row",
    "why": "A hinged bent-over row loads the lats, rear delts, grip and the posterior chain holding the hinge, which is what fails in a long sled pull.",
    "equip": "2 dumbbells",
    "scale": "weight",
    "compNote": "4 x 10 reps, bells never set down (hold in the hinge = walk-back), 2 x 26 kg ≈ race sled 103 kg",
    "times": {
     "beginner": 240000,
     "amateur": 190000,
     "intermediate": 150000,
     "competition": 110000,
     "elite": 85000,
     "wr": 65000
    },
    "cues": [
     "Hinge to ~45°, flat back, knees soft",
     "Row to the hip pockets, control the lowering"
    ],
    "mistake": "Standing up more and more each rep so it turns into a shrug.",
    "video": "dumbbell bent over row technique",
    "img": "Bent_Over_Two-Dumbbell_Row",
    "wUnit": "kg/hand",
    "startW": 14,
    "raceW": 26,
    "stepW": 2,
    "dist": 40,
    "unit": "reps"
   }
  ]
 },
 "ski": {
  "officialTimes": {
   "beginner": 300000,
   "amateur": 265000,
   "intermediate": 250000,
   "competition": 235000,
   "elite": 220000,
   "wr": 208000
  },
  "officialNote": "1000 m on a Concept2 SkiErg, station 1 (after run 1). Damper preset to 6 for all divisions, and athletes may adjust it. The same distance applies to Open and Pro.",
  "alts": [
   {
    "name": "RowErg at SkiErg effort",
    "why": "It has the same Concept2 flywheel and monitor, the same 3.5-5 min aerobic-power effort and the same hinge-and-lat-pull. It is the best energy-system and duration match, and at a busy Y it is usually free.",
    "equip": "Concept2 RowErg (damper 5-6)",
    "scale": "amount",
    "compNote": "1000 m row held at your SkiErg race RPE ≈ SkiErg 1000 m. Expect the row to be ~10-15 s/500 m faster at the same effort (Concept2 forum consensus), so target your ski time minus ~20-25 s rather than chasing a row PB.",
    "times": {
     "beginner": 280000,
     "amateur": 245000,
     "intermediate": 230000,
     "competition": 215000,
     "elite": 202000,
     "wr": 190000
    },
    "cues": [
     "Legs-hips-arms: push, swing, then finish the pull at the lower ribs",
     "Hold a flat split; no sprint start (same pacing rule as the ski)"
    ],
    "mistake": "Rowing it as a max test, which trains a leg-dominant effort and leaves the lats and triceps (the real SkiErg limiters) under-worked. Pair it with the ski-pull card below in the same week.",
    "video": "concept2 rowing technique drive sequence legs body arms",
    "img": "Rowing_Stationary",
    "kind": "bike",
    "unit": "m",
    "start": 500,
    "race": 1000,
    "step": 100
   },
   {
    "name": "Cable / band ski-pulls (standing straight-arm pulldown with hip hinge)",
    "why": "This is the closest muscle and pattern match: a double-arm pull from overhead to the hips with a hinge and crunch, loading the lats, triceps and abs as the SkiErg stroke does. Done continuously for time, it also trains the local muscular endurance.",
    "equip": "High cable stack with a rope or two D-handles (or a long band anchored high on a rack/pull-up bar)",
    "scale": "amount",
    "compNote": "200 fast reps ≈ the ~180-220 strokes of a 1000 m SkiErg (≈45-55 spm over 3:40-4:25). Use a light-moderate load (≈15-25 kg on the stack) that lets you keep 40-50 reps/min.",
    "times": {
     "beginner": 360000,
     "amateur": 300000,
     "intermediate": 270000,
     "competition": 240000,
     "elite": 215000,
     "wr": 195000
    },
    "cues": [
     "Arms long, drive the handles down and back past the hips while hinging, just like a ski stroke",
     "Snap the hips and let the arms ride back up fast; exhale on every pull"
    ],
    "mistake": "Standing tall and turning it into a triceps pushdown. The hinge and ab crunch are what make it transfer.",
    "video": "cable ski erg pull straight arm pulldown hinge hyrox",
    "img": "Rope_Straight-Arm_Pulldown",
    "unit": "reps",
    "start": 80,
    "race": 200,
    "step": 20
   },
   {
    "name": "Medicine-ball slams",
    "why": "Coaching sources (Repz, Hello Hyrox) name slams as the nearest free-weight SkiErg analogue: overhead-to-floor lat, triceps and ab flexion with a hip hinge, and a continuous 3-4 min set drives heart rate as the station does.",
    "equip": "Non-bounce slam ball / medicine ball, 9 kg (20 lb)",
    "scale": "amount",
    "compNote": "80 slams @ 9 kg in ~3.5-4.5 min ≈ SkiErg 1000 m effort. Break into sets of 20 early on, working toward 2 × 40.",
    "times": {
     "beginner": 300000,
     "amateur": 255000,
     "intermediate": 225000,
     "competition": 200000,
     "elite": 180000,
     "wr": 160000
    },
    "cues": [
     "Reach tall onto the toes, then slam with the lats and abs while hinging, as on a ski stroke",
     "Squat-hinge to pick up with a flat back and go straight into the next rep"
    ],
    "mistake": "Rounding the lower back on the pick-up once fatigued. At 94 kg and 188 cm, bend the knees to meet the ball and don't bend over it.",
    "video": "medicine ball slam technique hyrox skierg alternative",
    "img": "Overhead_Slam",
    "unit": "reps",
    "start": 40,
    "race": 80,
    "step": 10
   }
  ]
 },
 "row": {
  "officialTimes": {
   "beginner": 315000,
   "amateur": 285000,
   "intermediate": 265000,
   "competition": 245000,
   "elite": 230000,
   "wr": 215000
  },
  "officialNote": "1000 m on a Concept2 RowErg, station 5 (after run 5, following sled push, sled pull and burpee broad jumps). Damper preset to 6 and athletes may adjust it. The same distance applies to Open and Pro.",
  "alts": [
   {
    "name": "SkiErg 1000 m at row-station effort",
    "why": "It is on the same Concept2 monitor and has the same distance, the same 4-5 min duration and the same aerobic-power demand, with a hinge and lat pull. It is the best transfer whenever the SkiErg is free.",
    "equip": "Concept2 SkiErg (damper 5-6)",
    "scale": "amount",
    "compNote": "1000 m ski ≈ 1000 m row at equal RPE. Expect the ski to be ~20-30 s slower. Some coaches suggest skiing ~1200 m to match total work, but match time/RPE first.",
    "times": {
     "beginner": 305000,
     "amateur": 270000,
     "intermediate": 255000,
     "competition": 240000,
     "elite": 225000,
     "wr": 213000
    },
    "cues": [
     "Hinge and drive the handles past the hips; the legs soften, as the drive does on the row",
     "Steady split from stroke 1; build only over the last 200 m"
    ],
    "mistake": "Arms-only skiing. You lose the hip and leg contribution that makes it resemble the row.",
    "video": "concept2 skierg technique double pole hinge",
    "img": "Straight-Arm_Pulldown",
    "unit": "m",
    "start": 500,
    "race": 1000,
    "step": 100
   },
   {
    "name": "Air / assault bike calories",
    "why": "Simultaneous leg drive and arm push-pull on a fan-resistance machine reproduce the row's whole-body, lactate-heavy 3-5 min effort. It is almost always available at a Y.",
    "equip": "Assault / Echo / air bike",
    "scale": "amount",
    "compNote": "A race 1000 m row is ≈55-75 Concept2 calories (C2 PM formula). The standard conversion is bike cal ≈ 0.7 × row cal, so 50 bike cal ≈ a race-pace 1000 m row. If you finish well under your row time, add 10 cal.",
    "times": {
     "beginner": 255000,
     "amateur": 210000,
     "intermediate": 180000,
     "competition": 155000,
     "elite": 130000,
     "wr": 110000
    },
    "cues": [
     "Push-pull the arms hard while the legs drive; don't sit and spin",
     "Settle into a steady RPM from 10 s in; sprint the last 5 cal only"
    ],
    "mistake": "An all-out first 20 s. The air bike punishes a sprint start even harder than the rower.",
    "video": "assault bike technique arms legs pacing calories",
    "img": "Air_Bike",
    "kind": "bike",
    "unit": "cal",
    "start": 25,
    "race": 50,
    "step": 5
   },
   {
    "name": "KB swing + seated cable row couplet",
    "why": "It splits the row stroke into its parts. The swing covers the explosive hip/leg drive and posterior chain, and the cable row covers the horizontal pull and grip, done continuously for ~4-5 min.",
    "equip": "Kettlebell + seated cable row station (adjacent, or do bent-over DB rows if the machine is taken)",
    "scale": "weight",
    "compNote": "5 rounds × (15 Russian KB swings + 15 seated cable rows at ~40–50 kg), unbroken where possible ≈ race row effort.",
    "times": {
     "beginner": 390000,
     "amateur": 330000,
     "intermediate": 290000,
     "competition": 260000,
     "elite": 235000,
     "wr": 215000
    },
    "cues": [
     "Swing: snap the hips, bell floats to chest height, arms are ropes",
     "Row: legs set, chest tall, pull the handle to the lower ribs, 1-2 tempo"
    ],
    "mistake": "Squatting the swing and curling the row. Both should be hip-driven with long arms until the finish.",
    "video": "russian kettlebell swing technique hip hinge",
    "img": "One-Arm_Kettlebell_Swings",
    "wUnit": "kg (KB)",
    "startW": 16,
    "raceW": 24,
    "stepW": 4,
    "dist": 150,
    "unit": "reps"
   }
  ]
 },
 "bbj": {
  "officialTimes": {
   "beginner": 435000,
   "amateur": 340000,
   "intermediate": 290000,
   "competition": 235000,
   "elite": 185000,
   "wr": 145000
  },
  "officialNote": "80 m of burpee broad jumps at bodyweight, identical for all divisions (station 4). Chest and thighs to the floor, then a two-foot take-off and two-foot landing. Hands land no further than the feet, and stepping in is allowed.",
  "alts": [
   {
    "name": "BBJ shuttle (short lane)",
    "why": "It is the exact race movement and distance, just with turns, so it is the highest transfer when you only have 10-20 m of floor.",
    "equip": "10-20 m of open floor or turf (the Y's ~20 m strip), cones",
    "scale": "amount",
    "compNote": "80 m = 4 × 20 m or 8 × 10 m lengths. Turn with a pivot step (no penalty in training). Count reps to track metres per jump.",
    "times": {
     "beginner": 445000,
     "amateur": 350000,
     "intermediate": 300000,
     "competition": 245000,
     "elite": 195000,
     "wr": 155000
    },
    "cues": [
     "Step or jump the feet in, then jump straight out of the bottom with an arm swing",
     "Land soft, fall forward onto the hands in one motion"
    ],
    "mistake": "Chasing max distance on the early reps. A repeatable 1.8-2.0 m at a steady cadence beats 2.4 m for 10 reps then blowing up.",
    "video": "hyrox burpee broad jump technique step in",
    "img": "Standing_Long_Jump",
    "unit": "m",
    "start": 40,
    "race": 80,
    "step": 10
   },
   {
    "name": "Burpee broad jump + walk-back (3 m footprint)",
    "why": "It keeps the full burpee-into-horizontal-jump pattern, including the landing, in a ~3 × 2 m spot. The walk back is the only change, and it adds a short recovery.",
    "equip": "~3 m × 2 m of floor, a mark/tape at the start",
    "scale": "amount",
    "compNote": "45 reps ≈ 80 m at ~1.8 m/jump (the typical Open-male jump). Walk back to the mark after each landing. Mark your landing each set to track jump length.",
    "times": {
     "beginner": 475000,
     "amateur": 430000,
     "intermediate": 400000,
     "competition": 360000,
     "elite": 315000,
     "wr": 275000
    },
    "cues": [
     "Identical burpee: chest down, step or jump in, explode forward",
     "Turn and walk back briskly, nasal breathing. The walk is your only rest"
    ],
    "mistake": "Jogging back and rushing into a sloppy burpee, or shortening the jump because the space feels tight. Pick a spot where 2.2 m of landing is clear.",
    "video": "burpee broad jump in place walk back hyrox small space",
    "img": "Standing_Long_Jump",
    "unit": "reps",
    "start": 20,
    "race": 45,
    "step": 5
   },
   {
    "name": "Burpee box jump (step down)",
    "why": "It uses the same burpee plus a two-foot jump from a deep squat, trains lower-body power (Jade Skillen / Bulldog BBJ 'hack'), fits beside a plyo box, and cuts landing impact by stepping down.",
    "equip": "Plyo box 50-60 cm (20-24 in)",
    "scale": "amount",
    "compNote": "45 reps ≈ the race rep count. The vertical jump replaces the horizontal one, so pair it with 1-2 sets of 5 standing broad jumps afterwards to keep the horizontal pattern.",
    "times": {
     "beginner": 430000,
     "amateur": 375000,
     "intermediate": 335000,
     "competition": 295000,
     "elite": 255000,
     "wr": 225000
    },
    "cues": [
     "Burpee facing the box, jump from a squat with a big arm swing",
     "Stand tall on top, step down (don't jump down) and drop straight into the next rep"
    ],
    "mistake": "Jumping down off the box for speed. That adds needless Achilles and knee load, and the race has no drop landing.",
    "video": "burpee box jump step down technique",
    "img": "Front_Box_Jump",
    "unit": "reps",
    "start": 20,
    "race": 45,
    "step": 5
   }
  ]
 },
 "carry": {
  "officialTimes": {
   "beginner": 165000,
   "amateur": 125000,
   "intermediate": 110000,
   "competition": 95000,
   "elite": 80000,
   "wr": 65000
  },
  "officialNote": "200 m with 2 × 24 kg kettlebells (Men's Open; Men's Pro 2 × 32 kg), station 6, usually on 2-4 laps of the lane. Setting the bells down is allowed, and you restart from where they were put down.",
  "alts": [
   {
    "name": "DB / KB farmers shuttle (20 m lane)",
    "why": "It is the same load, grip, posture and fast walk as the race, just with more turns. Dumbbells' straight handles are actually closer to the race implement than kettlebells (Repz).",
    "equip": "Pair of 24 kg dumbbells or kettlebells, ~20 m of floor",
    "scale": "weight",
    "compNote": "Fixed 200 m = 10 × 20 m lengths at race weight. Go past race weight (28-32 kg) in short 40-60 m intervals for grip overload.",
    "times": {
     "beginner": 180000,
     "amateur": 140000,
     "intermediate": 125000,
     "competition": 110000,
     "elite": 95000,
     "wr": 80000
    },
    "cues": [
     "Tall chest, shoulders packed, fast short steps (walk quickly, don't run)",
     "Turn in a tight arc without stopping; crush the handles"
    ],
    "mistake": "Putting the weights down at every turn. Practise the continuous turn, because every set-down costs 10-15 s in the race.",
    "video": "hyrox farmers carry technique dumbbell",
    "img": "Farmers_Walk",
    "wUnit": "kg per hand",
    "startW": 16,
    "raceW": 24,
    "stepW": 4,
    "dist": 200,
    "unit": "m"
   },
   {
    "name": "Treadmill farmers walk",
    "why": "It needs no floor space and is the only substitute that covers the full 200 m at a fixed race pace with race load, so grip time under tension matches exactly.",
    "equip": "Treadmill (0-1% incline) + 2 × 24 kg dumbbells or kettlebells. Check that the Y allows it, and use a treadmill with the safety key clipped",
    "scale": "amount",
    "compNote": "200 m at 2 × 24 kg. Set the belt speed to your target race split (5.0 km/h ≈ 2:24; 6.0 km/h = 2:00). Repz suggests starting at 3.8-4.2 km/h and only speeding up once 200 m is clean.",
    "times": {
     "beginner": 180000,
     "amateur": 145000,
     "intermediate": 130000,
     "competition": 120000,
     "elite": 110000,
     "wr": 103000
    },
    "cues": [
     "Stand in the middle of the belt, eyes forward, bells clear of the rails",
     "If grip goes, press stop first, then set the bells on the side decks, never on the belt"
    ],
    "mistake": "Dropping a bell onto a moving belt, which is the main hazard. Floor carries are the safer default when grip is near failure.",
    "video": "farmers carry treadmill hyrox",
    "img": "Walking_Treadmill",
    "unit": "m",
    "start": 100,
    "race": 200,
    "step": 25
   },
   {
    "name": "Farmers march in place (loaded hold + high-knee march)",
    "why": "It needs a 1 m² footprint and keeps the race grip, trap and trunk load for race duration with a gait-like alternating step, so it works when the floor and treadmills are all taken.",
    "equip": "2 × 24 kg dumbbells, kettlebells or a trap bar (neutral handles)",
    "scale": "amount",
    "compNote": "260 total steps ≈ 200 m at ~0.77 m per stride, at 2 × 24 kg. Match race cadence (~120-150 steps/min) to match time under load.",
    "times": {
     "beginner": 170000,
     "amateur": 135000,
     "intermediate": 120000,
     "competition": 110000,
     "elite": 100000,
     "wr": 90000
    },
    "cues": [
     "Knees to hip height is not needed; quick, quiet steps as when walking",
     "Keep the bells still at your sides and ribs down"
    ],
    "mistake": "Swaying side to side. Keep the hips level as if walking a line, or it becomes a shrug instead of a carry.",
    "video": "farmers march in place kettlebell grip endurance",
    "img": "Farmers_Walk",
    "unit": "steps",
    "start": 130,
    "race": 260,
    "step": 20
   }
  ]
 },
 "lunge": {
  "officialTimes": {
   "beginner": 450000,
   "amateur": 330000,
   "intermediate": 270000,
   "competition": 225000,
   "elite": 185000,
   "wr": 160000
  },
  "officialNote": "100 m walking lunges, 20 kg sandbag carried on the shoulders/upper back (Men's Open); rear knee must touch the floor every rep, stand fully between steps. Typically ~55-65 reps (step pairs) for a 188 cm athlete toward the low end.",
  "alts": [
   {
    "name": "Barbell back-rack walking lunge",
    "why": "An empty 20 kg Olympic bar on the upper back reproduces the exact race load and load position (sandbag on shoulders) over the same 100 m.",
    "equip": "Olympic barbell (20 kg), ~20 m open floor lane, knee pad/folded mat optional",
    "scale": "weight",
    "compNote": "20 kg bar x 100 m = race spec (5 x 20 m lengths; add ~2 s per turnaround). Progress to 25-30 kg for overload blocks, then return to 20 kg in race-sim weeks right after a 1 km run to mimic Station 7 fatigue.",
    "times": {
     "beginner": 465000,
     "amateur": 345000,
     "intermediate": 280000,
     "competition": 235000,
     "elite": 195000,
     "wr": 170000
    },
    "cues": [
     "Long, even steps - rear knee kisses the floor, front shin near vertical",
     "Drive through the whole front foot (heel-midfoot), torso tall under the bar"
    ],
    "mistake": "Short choppy steps and pushing off the front toes - adds reps and loads the weak ankle; keep a full-foot plant.",
    "video": "barbell back rack walking lunge HYROX technique",
    "img": "Barbell_Walking_Lunge",
    "wUnit": "kg",
    "startW": 15,
    "raceW": 20,
    "stepW": 5,
    "dist": 100,
    "unit": "m"
   },
   {
    "name": "DB/KB front-rack walking lunge",
    "why": "Same walking-lunge pattern and 20 kg total load; the front-rack hold adds core/upper-back demand that over-prepares you for the sandbag and avoids carrying a 2.2 m bar through a busy gym.",
    "equip": "2 dumbbells or kettlebells (2 x 10 kg = race), ~20 m lane",
    "scale": "weight",
    "compNote": "2 x 10 kg (20 kg total) x 100 m = race-equivalent. Goblet (single 20 kg DB/KB) is an acceptable variant when only one bell is free. Front rack is slightly harder to hold than a shoulder sandbag, so expect ~5-10% slower than your race split.",
    "times": {
     "beginner": 495000,
     "amateur": 365000,
     "intermediate": 295000,
     "competition": 245000,
     "elite": 205000,
     "wr": 180000
    },
    "cues": [
     "Elbows high, bells tight to shoulders, ribs down",
     "Step long and land softly; stand all the way up before the next step"
    ],
    "mistake": "Letting elbows drop and torso fold forward - the bells pull you onto the toes and the ankle rolls.",
    "video": "dumbbell front rack walking lunge form",
    "img": "Dumbbell_Lunges",
    "wUnit": "kg per hand",
    "startW": 6,
    "raceW": 10,
    "stepW": 2,
    "dist": 100,
    "unit": "m"
   },
   {
    "name": "DB reverse lunge in place (alternating)",
    "why": "Keeps the same muscles, rep count and duration with zero floor space, and the backward step is the most ankle-friendly lunge (front foot stays planted and stable).",
    "equip": "2 dumbbells (10 kg each, suitcase hold), 2 x 1 m of floor",
    "scale": "amount",
    "compNote": "60 alternating reps with 2 x 10 kg approximates 100 m (race is ~55-65 steps). Use when the floor lane is busy; add front-rack or overhead holds later for position specificity.",
    "times": {
     "beginner": 405000,
     "amateur": 300000,
     "intermediate": 245000,
     "competition": 205000,
     "elite": 170000,
     "wr": 145000
    },
    "cues": [
     "Big step back, rear knee to the floor, front heel stays down",
     "Push through the front heel to return; alternate legs every rep"
    ],
    "mistake": "Rushing to shallow half-reps - in the race every rep without knee touch is a no-rep.",
    "video": "dumbbell alternating reverse lunge form",
    "img": "Dumbbell_Rear_Lunge",
    "unit": "reps",
    "start": 30,
    "race": 60,
    "step": 10
   }
  ]
 },
 "wb": {
  "officialTimes": {
   "beginner": 540000,
   "amateur": 390000,
   "intermediate": 300000,
   "competition": 240000,
   "elite": 195000,
   "wr": 160000
  },
  "officialNote": "100 reps, 6 kg ball (Men's Open), 3.00 m target; hip crease below knee each squat, ball must hit the target zone, catch and continue.",
  "alts": [
   {
    "name": "Med-ball wall ball on any free wall (6 kg, taped 3 m target)",
    "why": "It is the race movement itself - same ball, squat depth, throw and catch rhythm - just moved to any clear wall, pillar or court wall instead of the busy wall-ball station.",
    "equip": "6 kg medicine ball (soft/slam-style that tolerates walls), any solid wall with ~3 m clearance, painter's tape mark",
    "scale": "amount",
    "compNote": "100 reps at 6 kg to a 3 m mark = exact race spec. Rehearse race sets (e.g., 25/20/20/15/10/10 or 10s EMOM-style) immediately after lunges or a 1 km run. If no 3 m wall exists, use the highest mark you can and add 10-20 reps.",
    "times": {
     "beginner": 540000,
     "amateur": 390000,
     "intermediate": 300000,
     "competition": 240000,
     "elite": 195000,
     "wr": 160000
    },
    "cues": [
     "Hips below knees, heels down, then drive and release as the arms extend",
     "Catch high and ride the ball straight into the next squat"
    ],
    "mistake": "Short-repping the squat or low throws - both earn no-reps; tape the exact 3 m line.",
    "video": "HYROX wall ball technique 6kg break up 100 reps",
    "img": "Catch_and_Overhead_Throw",
    "unit": "reps",
    "start": 50,
    "race": 100,
    "step": 10
   },
   {
    "name": "DB/KB thruster",
    "why": "Coaches rate thrusters the closest no-wall substitute: identical squat-to-overhead pattern, same quad/glute/shoulder fatigue and heart-rate profile.",
    "equip": "2 dumbbells or kettlebells, 2 x 2 m floor",
    "scale": "weight",
    "compNote": "100 reps with 2 x 7.5 kg is roughly the mechanical work of launching a 6 kg ball to 3 m, with no ball-flight rest. Break it into the same sets you plan to race.",
    "times": {
     "beginner": 570000,
     "amateur": 420000,
     "intermediate": 330000,
     "competition": 260000,
     "elite": 210000,
     "wr": 175000
    },
    "cues": [
     "Full-depth squat, bells on shoulders, elbows up",
     "Use leg drive to float the bells overhead - one fluid motion"
    ],
    "mistake": "Pressing with the arms instead of driving with the legs - shoulders fail long before the legs do.",
    "video": "dumbbell thruster form",
    "img": "Kettlebell_Thruster",
    "wUnit": "kg per hand",
    "startW": 5,
    "raceW": 7.5,
    "stepW": 2.5,
    "dist": 100,
    "unit": "reps"
   },
   {
    "name": "Goblet squat + push press (single DB/KB)",
    "why": "Splits the wall ball into its two halves with one implement, keeping the same squat depth and overhead drive when only one bell and a small floor spot are free.",
    "equip": "1 dumbbell or kettlebell",
    "scale": "weight",
    "compNote": "100 squat+press pairs with a 10 kg bell approximates the wall-ball volume; slower than the race because the two phases are not linked. Transition to thrusters/wall balls in the final 4-6 weeks.",
    "times": {
     "beginner": 630000,
     "amateur": 465000,
     "intermediate": 360000,
     "competition": 285000,
     "elite": 230000,
     "wr": 195000
    },
    "cues": [
     "Bell tight to the sternum, sit between the heels",
     "Stand, re-rack to shoulder, dip-and-drive the press"
    ],
    "mistake": "Lifting heels in the goblet squat - keep weight mid-foot to protect the ankle; a small heel wedge is fine in training.",
    "video": "goblet squat to push press HYROX wall ball alternative",
    "img": "Goblet_Squat",
    "wUnit": "kg",
    "startW": 7.5,
    "raceW": 10,
    "stepW": 2.5,
    "dist": 100,
    "unit": "reps"
   }
  ]
 },
 "run": {
  "officialTimes": {
   "beginner": 390000,
   "amateur": 340000,
   "intermediate": 300000,
   "competition": 260000,
   "elite": 215000,
   "wr": 185000
  },
  "officialNote": "1,000 m run between stations (plus Roxzone transitions not included here). Men's Open.",
  "alts": [
   {
    "name": "Outdoor run (flat path or track)",
    "why": "Same movement, impact and energy system as the race run - the only true 1:1 substitute when the treadmill is taken.",
    "equip": "Shoes, a measured 1 km loop or GPS watch",
    "scale": "amount",
    "compNote": "1,000 m at race pace = race-equivalent. Choose a flat, even surface (track or paved path) to protect the weak ankle; avoid trails and curbs. Add a station (e.g., wall balls) straight after for compromised-running practice.",
    "times": {
     "beginner": 390000,
     "amateur": 340000,
     "intermediate": 300000,
     "competition": 260000,
     "elite": 215000,
     "wr": 185000
    },
    "cues": [
     "Quick, light steps (~170-180 spm), land under the hips",
     "Relax shoulders and hold race pace, not 5K pace"
    ],
    "mistake": "Running uneven terrain or cambered roads with a weak ankle - pick a track or flat path.",
    "video": "HYROX running pace compromised running tips",
    "img": "Trail_Running_Walking",
    "unit": "m",
    "start": 600,
    "race": 1000,
    "step": 200
   },
   {
    "name": "Air / Assault bike",
    "why": "Zero impact (ankle-safe) leg-dominant effort that hits the same heart-rate zone and ~3-6 min duration as a HYROX kilometre.",
    "equip": "Assault/Echo/air bike",
    "scale": "amount",
    "compNote": "60 cal ~= one 1 km run at HYROX effort (time-matched); CrossFit/Invictus/Mayhem charts give 75 cal (30 cal per 400 m) for a fresh max run, Echo bike ~20% fewer (~48-60). Use 75 cal for hard interval days.",
    "times": {
     "beginner": 390000,
     "amateur": 330000,
     "intermediate": 290000,
     "competition": 250000,
     "elite": 215000,
     "wr": 185000
    },
    "cues": [
     "Push AND pull - arms carry ~30% of the work",
     "Hold a steady RPM/cal-per-min readout; don't sprint the first 20 s"
    ],
    "mistake": "Going out too hot - the fan's resistance rises steeply and you die after 90 s.",
    "video": "assault bike technique pacing",
    "img": "Air_Bike",
    "kind": "bike",
    "unit": "cal",
    "start": 40,
    "race": 60,
    "step": 5
   },
   {
    "name": "Rower (Concept2)",
    "why": "Low-impact whole-body aerobic effort with strong posterior-chain/leg drive; matches run duration and HR, plus it's a race station anyway.",
    "equip": "Concept2 RowErg",
    "scale": "amount",
    "compNote": "1,200 m ~= 1 km run (RMR 1.2-1.5x; CrossFit/Invictus 1,250 m). Row at steady 'race run' RPE (~7/10), damper 5-6. For shorter sessions 1,000 m still works at the elite end.",
    "times": {
     "beginner": 350000,
     "amateur": 315000,
     "intermediate": 290000,
     "competition": 265000,
     "elite": 245000,
     "wr": 230000
    },
    "cues": [
     "Legs-body-arms on the drive, arms-body-legs on the recovery",
     "Long strokes at 26-30 spm; feet strapped with ankle neutral"
    ],
    "mistake": "High stroke rate with arm-pulling - wastes energy and doesn't train the legs you need for running.",
    "video": "Concept2 rowing technique stroke sequence",
    "img": "Rowing_Stationary",
    "kind": "bike",
    "unit": "m",
    "start": 800,
    "race": 1200,
    "step": 100
   }
  ]
 }
};
