// Substitute exercises — 3 alternatives per exercise.
// Keep this conservative; users can adjust as they use the app.
//
// Each substitute is { name, reason } and the YouTube search URL is
// generated from the name at render time. exId keys here must match
// data-ex attributes on the exercise cards.
const SUBSTITUTES = {
  // ============================================================
  // ALISON — Upper A
  // ============================================================
  him_uA_bench: [
    { name: 'Dumbbell Bench Press',       reason: 'No bench room / easier on shoulders' },
    { name: 'Smith Machine Bench Press',  reason: 'No spotter available' },
    { name: 'Machine Chest Press',        reason: 'Form check / fatigued day' },
  ],
  him_uA_row: [
    { name: 'Seated Cable Row',           reason: 'Bench occupied' },
    { name: 'T-Bar Row',                  reason: 'Heavier loading option' },
    { name: 'Single-Arm Dumbbell Row',    reason: 'Unilateral / less equipment' },
  ],
  him_uA_incdb: [
    { name: 'Incline Barbell Press',      reason: 'Heavier loading' },
    { name: 'Incline Smith Machine Press',reason: 'Solo / safer' },
    { name: 'Machine Incline Press',      reason: 'Form check' },
  ],
  him_uA_pull: [
    { name: 'Pull-Up',                    reason: 'Bodyweight progression' },
    { name: 'Assisted Pull-Up',           reason: 'Bands or assist machine' },
    { name: 'Single-Arm Lat Pulldown',    reason: 'Unilateral focus' },
  ],
  him_uA_lat: [
    { name: 'Cable Lateral Raise',        reason: 'Constant tension' },
    { name: 'Machine Lateral Raise',      reason: 'Form-locked' },
    { name: 'Leaning Dumbbell Lateral Raise', reason: 'Strict / one arm at a time' },
  ],
  him_uA_curl: [
    { name: 'Barbell Curl',               reason: 'Straight bar / heavier' },
    { name: 'Dumbbell Curl',              reason: 'Unilateral' },
    { name: 'Preacher Curl',              reason: 'Strict form focus' },
  ],
  him_uA_tri: [
    { name: 'Rope Tricep Pushdown',       reason: 'Different angle' },
    { name: 'Overhead Tricep Extension',  reason: 'Long head focus' },
    { name: 'Close-Grip Bench Press',     reason: 'Compound option' },
  ],

  // ============================================================
  // ALISON — Lower A
  // ============================================================
  him_lA_squat: [
    { name: 'Front Squat',                reason: 'Easier on lower back' },
    { name: 'Hack Squat',                 reason: 'Machine-locked path' },
    { name: 'Goblet Squat',               reason: 'Lighter / form day' },
  ],
  him_lA_rdl: [
    { name: 'Dumbbell Romanian Deadlift', reason: 'Lighter / unilateral option' },
    { name: 'Stiff-Leg Deadlift',         reason: 'More hamstring stretch' },
    { name: 'Single-Leg RDL',             reason: 'Balance + ankle work' },
  ],
  him_lA_press: [
    { name: 'Hack Squat',                 reason: 'Leg press busy' },
    { name: 'Bulgarian Split Squat',      reason: 'Unilateral / ankle work' },
    { name: 'Walking Lunge',              reason: 'Bodyweight variant' },
  ],
  him_lA_legcurl: [
    { name: 'Lying Leg Curl',             reason: 'Different angle' },
    { name: 'Nordic Curl',                reason: 'Bodyweight progression' },
    { name: 'Stability Ball Leg Curl',    reason: 'Core + hamstring combo' },
  ],
  him_lA_calf: [
    { name: 'Seated Calf Raise',          reason: 'Soleus focus' },
    { name: 'Donkey Calf Raise',          reason: 'Different stretch' },
    { name: 'Smith Machine Calf Raise',   reason: 'Heavy loading' },
  ],
  him_lA_balance: [
    { name: 'Single-Leg RDL Hold',        reason: 'Progresses balance + strength' },
    { name: 'BOSU Single-Leg Stand',      reason: 'More unstable surface' },
    { name: 'Stork Stand (Eyes Closed)',  reason: 'Harder proprioception' },
  ],
  him_lA_dorsi: [
    { name: 'Heel Walks',                 reason: 'Active dorsiflexion drill' },
    { name: 'Toe Raises (Seated)',        reason: 'Anterior tib isolation' },
    { name: 'Band Ankle Eversion/Inversion', reason: 'Lateral stability' },
  ],
  him_lA_step: [
    { name: 'Bodyweight Calf Raise',      reason: 'No step available' },
    { name: 'Toe Walking',                reason: 'Active alternative' },
    { name: 'Foam Roller Calf Smash',     reason: 'Recovery substitute' },
  ],
  him_lA_plank: [
    { name: 'Side Plank',                 reason: 'Lateral core' },
    { name: 'Plank with Shoulder Tap',    reason: 'Anti-rotation' },
    { name: 'Dead Bug',                   reason: 'Anti-extension / floor' },
  ],

  // ============================================================
  // ALISON — Upper B
  // ============================================================
  him_uB_ohp: [
    { name: 'Seated DB Shoulder Press',   reason: 'Easier on lower back' },
    { name: 'Smith Machine Overhead Press', reason: 'Solo / safer' },
    { name: 'Machine Shoulder Press',     reason: 'Form check' },
  ],
  him_uB_pullup: [
    { name: 'Lat Pulldown',               reason: 'Bar occupied' },
    { name: 'Negative Pull-Up',           reason: 'Strength building' },
    { name: 'Inverted Row',               reason: 'Horizontal pull alternative' },
  ],
  him_uB_row: [
    { name: 'Chest-Supported Row',        reason: 'Lower-back-friendly' },
    { name: 'T-Bar Row',                  reason: 'Heavier loading' },
    { name: 'Bent-Over Barbell Row',      reason: 'More compound' },
  ],
  him_uB_dbbench: [
    { name: 'Barbell Bench Press',        reason: 'Heavier loading' },
    { name: 'Smith Machine Bench Press',  reason: 'No spotter' },
    { name: 'Machine Chest Press',        reason: 'Form check' },
  ],
  him_uB_lat: [
    { name: 'DB Lateral Raise',           reason: 'Cables busy' },
    { name: 'Machine Lateral Raise',      reason: 'Form-locked' },
    { name: 'Leaning DB Lateral Raise',   reason: 'Strict, one arm at a time' },
  ],
  him_uB_hammer: [
    { name: 'Cross-Body Hammer Curl',     reason: 'More brachialis emphasis' },
    { name: 'Rope Cable Curl',            reason: 'Constant tension' },
    { name: 'Zottman Curl',               reason: 'Forearm focus' },
  ],
  him_uB_triext: [
    { name: 'Tricep Pushdown',            reason: 'Cable variant' },
    { name: 'Skull Crusher',              reason: 'Barbell / EZ-bar version' },
    { name: 'Bench Dips',                 reason: 'Bodyweight option' },
  ],

  // ============================================================
  // ALISON — Lower B
  // ============================================================
  him_lB_tbar: [
    { name: 'Conventional Deadlift',      reason: 'Trap bar unavailable' },
    { name: 'Sumo Deadlift',              reason: 'Easier on lower back' },
    { name: 'Romanian Deadlift',          reason: 'Hamstring focus / lighter' },
  ],
  him_lB_bss: [
    { name: 'Reverse Lunge',              reason: 'Less ankle stress' },
    { name: 'Walking Lunge',              reason: 'Space available' },
    { name: 'Step-Up (Box)',              reason: 'Knee-friendly' },
  ],
  him_lB_legext: [
    { name: 'Sissy Squat',                reason: 'No machine' },
    { name: 'Step-Up',                    reason: 'Functional alternative' },
    { name: 'Wall Sit',                   reason: 'Isometric quad focus' },
  ],
  him_lB_lyingcurl: [
    { name: 'Seated Leg Curl',            reason: 'Different angle' },
    { name: 'Nordic Curl',                reason: 'Eccentric focus' },
    { name: 'Stability Ball Leg Curl',    reason: 'Bodyweight option' },
  ],
  him_lB_seatedcalf: [
    { name: 'Standing Calf Raise',        reason: 'Gastroc focus' },
    { name: 'Smith Machine Calf Raise',   reason: 'Heavier loading' },
    { name: 'Single-Leg Calf Raise',      reason: 'Unilateral / no machine' },
  ],
  him_lB_hanging: [
    { name: 'Captain\'s Chair Leg Raise', reason: 'Easier on grip' },
    { name: 'Lying Leg Raise',            reason: 'Floor-based' },
    { name: 'Knee Raise',                 reason: 'Regression' },
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
