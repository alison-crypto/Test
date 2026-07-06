// Substitute exercises — 3 alternatives per exercise.
// Keep this conservative; users can adjust as they use the app.
//
// Each substitute is { name, reason } and the YouTube search URL is
// generated from the name at render time. exId keys here must match
// data-ex attributes on the exercise cards.
const SUBSTITUTES = {
  // ============================================================
  // ALISON — Upper A (Wed)
  // ============================================================
  him_uA_bench: [
    { name: 'Dumbbell Bench Press',   reason: 'Bench busy / easier on shoulders' },
    { name: 'Machine Chest Press',    reason: 'No spotter / form check' },
    { name: 'Weighted Push-Up',       reason: 'No equipment / bodyweight' },
  ],
  him_uA_row: [
    { name: 'Seated Cable Row',       reason: 'Bench occupied' },
    { name: 'Single-Arm Dumbbell Row',reason: 'Unilateral / minimal kit' },
    { name: 'Machine Row',            reason: 'Form-locked / fatigued day' },
  ],
  him_uA_shoulder: [
    { name: 'Machine Shoulder Press', reason: 'Form-locked / heavy' },
    { name: 'Standing Overhead Press',reason: 'More compound' },
    { name: 'Arnold Press',           reason: 'Fuller delt range' },
  ],
  him_uA_pull: [
    { name: 'Assisted Pull-Up',       reason: 'Bands or assist machine' },
    { name: 'Neutral-Grip Pulldown',  reason: 'Elbow-friendly' },
    { name: 'Straight-Arm Pulldown',  reason: 'Lat isolation' },
  ],
  him_uA_curl: [
    { name: 'Cable Curl',             reason: 'Constant tension' },
    { name: 'EZ-Bar Curl',            reason: 'Heavier / wrist-friendly' },
    { name: 'Hammer Curl',            reason: 'Brachialis / forearm' },
  ],
  him_uA_tri: [
    { name: 'Rope Overhead Extension',reason: 'Long-head focus' },
    { name: 'Skullcrusher',           reason: 'EZ-bar loading' },
    { name: 'Dips',                   reason: 'Bodyweight compound' },
  ],

  // ============================================================
  // ALISON — Lower A (Mon)
  // ============================================================
  him_lA_squat: [
    { name: 'Hack Squat',             reason: 'Back-friendly machine path' },
    { name: 'Leg Press',              reason: 'Rack busy / minimal spine load' },
    { name: 'Goblet Squat',           reason: 'Lighter / form day' },
  ],
  him_lA_legcurl: [
    { name: 'Lying Leg Curl',         reason: 'Different angle' },
    { name: 'Romanian Deadlift',      reason: 'When back feels good — careful' },
    { name: 'Nordic Curl',            reason: 'Bodyweight eccentric' },
  ],
  him_lA_lunge: [
    { name: 'Bulgarian Split Squat',  reason: 'More stability demand' },
    { name: 'Reverse Lunge',          reason: 'Easier on the knee' },
    { name: 'Step-Up',                reason: 'Box available' },
  ],
  him_lA_calf: [
    { name: 'Seated Calf Raise',      reason: 'Soleus focus' },
    { name: 'Leg-Press Calf Raise',   reason: 'Heavy loading' },
    { name: 'Single-Leg Calf Raise',  reason: 'Unilateral / no machine' },
  ],
  him_lA_backext: [
    { name: 'Reverse Hyperextension', reason: 'Lower-back friendly' },
    { name: 'Bird-Dog',               reason: 'Floor / no equipment' },
    { name: 'Cable Pull-Through',     reason: 'Hip-hinge pattern' },
  ],
  him_lA_abs: [
    { name: 'Cable Crunch',           reason: 'Loadable / progressive' },
    { name: 'Ab Wheel Rollout',       reason: 'Anti-extension' },
    { name: "Captain's Chair Leg Raise", reason: 'Easier on grip' },
  ],

  // ============================================================
  // ALISON — Upper B (Sat)
  // ============================================================
  him_uB_incline: [
    { name: 'Incline Barbell Press',  reason: 'Heavier loading' },
    { name: 'Incline Machine Press',  reason: 'Solo / form check' },
    { name: 'Weighted Dip',           reason: 'Bodyweight compound' },
  ],
  him_uB_pullup: [
    { name: 'Lat Pulldown',           reason: 'Bar occupied' },
    { name: 'Chin-Up',                reason: 'More biceps' },
    { name: 'Neutral-Grip Pulldown',  reason: 'Elbow-friendly' },
  ],
  him_uB_row: [
    { name: 'Chest-Supported Row',    reason: 'Lower-back friendly' },
    { name: 'Machine Row',            reason: 'Form-locked' },
    { name: 'TRX Inverted Row',       reason: 'Bodyweight / no machine' },
  ],
  him_uB_lat: [
    { name: 'Cable Lateral Raise',    reason: 'Constant tension' },
    { name: 'Machine Lateral Raise',  reason: 'Form-locked' },
    { name: 'Upright Row',            reason: 'Compound delt option' },
  ],
  him_uB_curl: [
    { name: 'Barbell Curl',           reason: 'Heaviest straight-bar' },
    { name: 'Cable Curl',             reason: 'Constant tension' },
    { name: 'Preacher Curl',          reason: 'Strict / no swing' },
  ],
  him_uB_triext: [
    { name: 'Cable Triceps Pushdown', reason: 'Different angle' },
    { name: 'Skullcrusher',           reason: 'EZ-bar loading' },
    { name: 'Close-Grip Bench Press', reason: 'Compound option' },
  ],

  // ============================================================
  // ALISON — Lower B (Thu)
  // ============================================================
  him_lB_tbar: [
    { name: 'Conventional Deadlift',  reason: 'Trap bar unavailable' },
    { name: 'Romanian Deadlift',      reason: 'Hamstring focus / lighter' },
    { name: 'Rack Pull',              reason: 'Reduced range / back-friendly' },
  ],
  him_lB_hipthrust: [
    { name: 'Glute Bridge',           reason: 'No bench / floor' },
    { name: 'Cable Pull-Through',     reason: 'Hinge pattern' },
    { name: 'Back Extension',         reason: 'Glute + low-back' },
  ],
  him_lB_legext: [
    { name: 'Sissy Squat',            reason: 'No machine' },
    { name: 'Goblet Squat',           reason: 'Free-weight quad' },
    { name: 'Hack Squat',             reason: 'Heavier quad option' },
  ],
  him_lB_legcurl: [
    { name: 'Lying Leg Curl',         reason: 'Different angle' },
    { name: 'Nordic Curl',            reason: 'Eccentric focus' },
    { name: 'Glute-Ham Raise',        reason: 'Posterior chain' },
  ],
  him_lB_calf: [
    { name: 'Seated Calf Raise',      reason: 'Soleus focus' },
    { name: 'Leg-Press Calf Raise',   reason: 'Heavy loading' },
    { name: 'Single-Leg Calf Raise',  reason: 'Unilateral / no machine' },
  ],
  him_lB_crunch: [
    { name: 'Weighted Plank',         reason: 'Anti-extension isometric' },
    { name: 'Ab Wheel Rollout',       reason: 'Harder progression' },
    { name: 'Hanging Leg Raise',      reason: 'Lower-ab focus' },
  ],

  // ============================================================
  // DARLENE — Upper (Tue) — pregnancy-safe alternates only
  // ============================================================
  her_u1_shoulder: [
    { name: 'Machine Shoulder Press',     reason: 'Back-supported' },
    { name: 'Single-Arm DB Shoulder Press', reason: 'Lighter / one side at a time' },
    { name: 'Cable Front Raise',          reason: 'Light, controlled' },
  ],
  her_u1_row: [
    { name: 'Chest-Supported Row',        reason: 'Belly clear of bench' },
    { name: 'Machine Row',                reason: 'Back-supported' },
    { name: 'Resistance Band Row',        reason: 'Home / low-equipment' },
  ],
  her_u1_incdb: [
    { name: 'Machine Chest Press',        reason: 'Seated, no supine concern' },
    { name: 'Cable Chest Press (standing)', reason: 'No bench needed' },
    { name: 'Wall Push-Up',               reason: 'Light, controlled' },
  ],
  her_u1_pull: [
    { name: 'Single-Arm Lat Pulldown',    reason: 'Unilateral, controlled' },
    { name: 'Straight-Arm Pulldown',      reason: 'Less shoulder strain' },
    { name: 'Resistance Band Pulldown',   reason: 'Lighter option' },
  ],
  her_u1_curl: [
    { name: 'Hammer Curl',                reason: 'Different grip' },
    { name: 'Cable Curl',                 reason: 'Constant tension' },
    { name: 'Resistance Band Curl',       reason: 'Lighter / portable' },
  ],
  her_u1_tri: [
    { name: 'Overhead Tricep Extension (seated)', reason: 'Single arm or DB' },
    { name: 'Tricep Kickback',            reason: 'Light, controlled' },
    { name: 'Cable Rope Pressdown',       reason: 'Easier on wrists' },
  ],
  her_u1_pallof: [
    { name: 'Cable Wood Chop (anti-rotation)', reason: 'Same anti-rotation goal' },
    { name: 'Bird-Dog',                   reason: 'No equipment needed' },
    { name: 'Suitcase Carry',             reason: 'Functional core' },
  ],

  // ============================================================
  // DARLENE — Lower (Wed)
  // ============================================================
  her_l1_goblet: [
    { name: 'Box Squat (no weight)',      reason: 'Lighter day' },
    { name: 'Wall Squat',                 reason: 'Isometric, knee-friendly' },
    { name: 'Sit-to-Stand from Chair',    reason: 'Functional / very light' },
  ],
  her_l1_rdl: [
    { name: 'Cable Pull-Through',         reason: 'Hip hinge, easier on back' },
    { name: 'Hip Hinge with Dowel',       reason: 'Form practice / very light' },
    { name: 'Single-Leg RDL (supported)', reason: 'Hold rack for balance' },
  ],
  her_l1_press: [
    { name: 'Wall Squat',                 reason: 'Machine occupied' },
    { name: 'Goblet Squat to Box',        reason: 'Bodyweight + light DB' },
    { name: 'Step-Up (low box)',          reason: 'Single-leg loading' },
  ],
  her_l1_curl: [
    { name: 'Side-Lying Leg Curl',        reason: 'No supine position' },
    { name: 'Stability Ball Leg Curl',    reason: 'Bodyweight, controlled' },
    { name: 'Resistance Band Leg Curl',   reason: 'Standing or seated' },
  ],
  her_l1_calf: [
    { name: 'Seated Calf Raise',          reason: 'Belly-supported sitting' },
    { name: 'Single-Leg Calf Raise (supported)', reason: 'Hold rack for balance' },
    { name: 'Step Calf Raise',            reason: 'Bodyweight option' },
  ],
  her_l1_birddog: [
    { name: 'Modified Dead Bug',          reason: 'Side-lying variation' },
    { name: 'Cat-Cow',                    reason: 'Gentle mobility' },
    { name: 'Quadruped Hip Extension',    reason: 'Glute activation' },
  ],
  her_l1_clam: [
    { name: 'Standing Hip Abduction',     reason: 'No floor work' },
    { name: 'Banded Side Step',           reason: 'Functional glute med' },
    { name: 'Cable Hip Abduction',        reason: 'Constant resistance' },
  ],

  // ============================================================
  // DARLENE — Upper variation (Fri)
  // ============================================================
  her_u2_row: [
    { name: 'Seated Cable Row',           reason: 'Bench occupied' },
    { name: 'Single-Arm DB Row (supported)', reason: 'One arm at a time' },
    { name: 'Machine Row',                reason: 'Back-supported' },
  ],
  her_u2_chest: [
    { name: 'Incline DB Press (45°)',     reason: 'Already in plan' },
    { name: 'Cable Chest Press (standing)', reason: 'Belly clear' },
    { name: 'Resistance Band Chest Press', reason: 'Home / low equipment' },
  ],
  her_u2_lat: [
    { name: 'Single-Arm Lat Pulldown',    reason: 'Unilateral' },
    { name: 'Straight-Arm Pulldown',      reason: 'Less shoulder strain' },
    { name: 'Resistance Band Pulldown',   reason: 'Lighter option' },
  ],
  her_u2_face: [
    { name: 'Rear Delt Cable Fly',        reason: 'Same muscles, different angle' },
    { name: 'Reverse Pec Deck',           reason: 'Machine alternative' },
    { name: 'Resistance Band Pull-Apart', reason: 'Light / posture work' },
  ],
  her_u2_hammer: [
    { name: 'Dumbbell Bicep Curl',        reason: 'Supinated grip' },
    { name: 'Cable Curl',                 reason: 'Constant tension' },
    { name: 'Cross-Body Hammer Curl',     reason: 'Brachialis emphasis' },
  ],
  her_u2_tri: [
    { name: 'Overhead Tricep Extension (seated)', reason: 'Seated single arm' },
    { name: 'Tricep Kickback',            reason: 'Light, controlled' },
    { name: 'Rope Pressdown',             reason: 'Different angle' },
  ],
  her_u2_pallof: [
    { name: 'Cable Wood Chop',            reason: 'Same anti-rotation goal' },
    { name: 'Suitcase Carry',             reason: 'Loaded carry' },
    { name: 'Bird-Dog',                   reason: 'No equipment needed' },
  ],

  // ============================================================
  // DARLENE — Lower + cardio (Sat)
  // ============================================================
  her_l2_goblet: [
    { name: 'Box Squat (bodyweight)',     reason: 'Lighter / no weight' },
    { name: 'Wall Squat',                 reason: 'Isometric' },
    { name: 'Sit-to-Stand from Chair',    reason: 'Functional / very light' },
  ],
  her_l2_hip: [
    { name: 'Glute Bridge (brief holds)', reason: 'No bench needed' },
    { name: 'Single-Leg Glute Bridge',    reason: 'Unilateral' },
    { name: 'Cable Pull-Through',         reason: 'Standing hip extension' },
  ],
  her_l2_legext: [
    { name: 'Sissy Squat (modified)',     reason: 'No machine' },
    { name: 'Step-Up',                    reason: 'Functional' },
    { name: 'Wall Squat',                 reason: 'Isometric quad' },
  ],
  her_l2_bridge: [
    { name: 'Single-Leg Glute Bridge',    reason: 'Brief holds' },
    { name: 'Cable Pull-Through',         reason: 'Standing alternative' },
    { name: 'Hip Hinge with Dowel',       reason: 'Form practice' },
  ],
  her_l2_walk: [
    { name: 'Stationary Bike (recumbent)', reason: 'Knee-friendly cardio' },
    { name: 'Upright Stationary Bike',    reason: 'Equipment alternative' },
    { name: 'Stair Stepper (low pace)',   reason: 'Low-impact cardio' },
  ],
};
