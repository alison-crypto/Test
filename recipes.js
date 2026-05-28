const RECIPES = [
  {
    id: 'med_pulled_chicken',
    name: 'Slow-Cooker Mediterranean Pulled Chicken &amp; Rice',
    cuisine: 'Mediterranean',
    mealType: 'Sunday Prep / Lunch',
    prepTime: 15, totalTime: 240,
    servings: '5 portions him + 5 portions her',
    macros: { him: [766,62,55,16], her: [496,34,30,12] },
    ingredients: [
      'Chicken breast, lean (raw): him 200g / her 100g per portion',
      'Jasmine rice (cooked): him 250g / her 160g',
      'Bell pepper (roasted): 100g each',
      'Broccoli (roasted): 100g each',
      'Zucchini (roasted): 80g each',
      'Olive oil: him 10g / her 8g',
      'Lemon juice: 10g each',
      'Yellow onion, garlic, smoked paprika, oregano, salt, pepper, bay leaf'
    ],
    method: [
      'Place 900g chicken breast in slow cooker with sliced onion, garlic, smoked paprika, oregano, salt, pepper, splash chicken stock, bay leaf',
      'Cook on LOW for 4 hours, shred with 2 forks',
      'Roast veg on sheet pan: 1kg peppers + 500g zucchini + 600g broccoli + olive oil + salt + oregano, 200°C for 25 min',
      'Cook jasmine rice in large batch (~600g raw makes 1.7kg cooked across week)',
      'Portion into containers: rice base + chicken + roasted veg + dressing'
    ],
    notes: 'Used as Week A Lunch 1 (Mon/Wed/Fri). Plain Greek yogurt + lemon as side dressing works well.',
    tags: ['slow-cooker','meal-prep','freezer-friendly'],
    source: 'Week A Plan Doc v14'
  },
  {
    id: 'turkey_taco_bowl',
    name: 'Grilled Turkey Patties Taco Bowl',
    cuisine: 'Mexican',
    mealType: 'Sunday Prep / Lunch',
    prepTime: 20, totalTime: 30,
    servings: '2 portions him + 2 portions her',
    macros: { him: [767,60,60,20], her: [525,36,40,16] },
    ingredients: [
      'Ground turkey lean (raw): him 200g / her 100g per portion',
      'Brown rice (cooked): him 150g / her 100g',
      'Black beans (drained, plain): 80g each',
      'Bell peppers (raw or grilled): 100g each',
      'Red onion (raw, thin sliced): 30g each',
      'Corn (fresh-cut or frozen-plain): 50g each',
      'Avocado (fresh, day-of): him 25g / her 20g',
      'Fresh lime juice: 10g each',
      'Taco seasoning: cumin + chili powder + smoked paprika + garlic powder + oregano + salt'
    ],
    method: [
      'Mix 650g ground turkey with taco seasoning, form into ~8 small patties or loose crumble',
      'Grill patties 4-5 min per side until cooked through (165°F internal)',
      'Combine rice + beans + peppers + onion + corn in bowl',
      'Top with turkey + sliced avocado day-of',
      'Squeeze lime over the top, garnish with cilantro'
    ],
    notes: 'Used as Week A Lunch 2 (Tue/Thu). Don\'t add avocado until day of eating — it browns in the fridge.',
    tags: ['grill','meal-prep','gluten-free'],
    source: 'Week A Plan Doc v14'
  },
  {
    id: 'cumin_lime_beef',
    name: 'Cumin-Lime Beef Bowl (Slow Cooker)',
    cuisine: 'Mediterranean-Mexican',
    mealType: 'Sunday Prep / Dinner',
    prepTime: 15, totalTime: 360,
    servings: '3 portions him + 3 portions her',
    macros: { him: [760,61,50,26], her: [544,37,35,20] },
    ingredients: [
      'Lean beef chuck or sirloin tip (cubed, raw): him 180g / her 90g per portion',
      'Basmati rice (cooked): him 90g / her 80g',
      'Black beans (drained): 80g each',
      'Mixed greens (fresh day-of): 70g each',
      'Cherry tomatoes (fresh day-of): 60g each',
      'Cucumber (fresh day-of): 50g each',
      'Red onion (raw): 40g each',
      'Feta cheese: him 22g / her 18g',
      'Avocado (fresh day-of): him 22g / her 18g',
      'Olive oil: him 7g / her 5g',
      'Lime juice: 5g each',
      'Yellow onion, garlic, cumin, smoked paprika, bay leaf for slow cook'
    ],
    method: [
      'Sear cubed beef in olive oil over high heat, 2 min/side for color',
      'Transfer to slow cooker with diced yellow onion, 4-5 cloves garlic, 1 tbsp cumin, 1 tsp smoked paprika, bay leaf, juice of 1 lime, splash beef stock',
      'Cook LOW 6-8 hours until shreds easily. Lean cuts may need extra 50ml liquid at 4h',
      'Shred and store with cooking liquid',
      'Assemble bowls day-of: rice + beans + beef + fresh veg + feta + avocado + dressing'
    ],
    notes: 'Used as Week A Dinner 1 (Mon/Wed/Fri). Lean beef can dry out — keep enough liquid in slow cooker. Beef chuck swap saves $7 vs sirloin tip.',
    tags: ['slow-cooker','meal-prep','fresh-assembly'],
    source: 'Week A Plan Doc v14'
  },
  {
    id: 'sheet_pan_thighs',
    name: 'Sheet-Pan Chicken Thighs &amp; Roots',
    cuisine: 'Mediterranean',
    mealType: 'Sunday Prep / Dinner',
    prepTime: 15, totalTime: 45,
    servings: '2 portions him + 2 portions her',
    macros: { him: [699,59,45,22], her: [465,33,30,18] },
    ingredients: [
      'Chicken thigh, lean boneless OR bone-in (raw): him 220g / her 110g',
      'Sweet potato (raw, cubed): him 200g / her 150g',
      'Carrots (raw, cut): 100g each',
      'Broccoli (raw, florets): 150g each',
      'Olive oil: him 10g / her 8g',
      'Fresh garlic, smoked paprika, rosemary, lemon zest, salt, pepper'
    ],
    method: [
      'Rub 700g chicken thighs with olive oil + garlic + smoked paprika + rosemary + lemon zest',
      'Spread on sheet pan with cubed sweet potato + carrots + broccoli',
      'Roast at 200°C for 30 min (lean thighs may need 25 min — check internal temp 74°C / 165°F)',
      'Portion into containers, store up to 4 days'
    ],
    notes: 'Used as Week A Dinner 2 (Tue/Thu). Bone-in saves ~$5 vs boneless and has more flavor — just adds 5min handling.',
    tags: ['sheet-pan','meal-prep','one-pan'],
    source: 'Week A Plan Doc v14'
  },
  {
    id: 'greek_lemon_chicken',
    name: 'Greek Lemon Chicken &amp; Quinoa Bowl',
    cuisine: 'Greek / Mediterranean',
    mealType: 'Sunday Prep / Lunch',
    prepTime: 20, totalTime: 45,
    servings: '3 portions him + 3 portions her',
    macros: { him: [750,55,75,22], her: [530,30,55,18] },
    ingredients: [
      'Chicken breast (raw, marinated + grilled): him 200g / her 100g',
      'Quinoa (cooked): him 230g / her 160g',
      'Cucumber (fresh): 100g each',
      'Cherry tomatoes (fresh): 100g each',
      'Red onion: 30g each',
      'Sun-dried tomatoes in oil (drained, Darlene-friendly olive swap): 20g each',
      'Olive oil: him 10g / her 8g',
      'Lemon juice: 15g each',
      'Garlic, oregano, salt, pepper'
    ],
    method: [
      'Marinate chicken breast in olive oil + lemon + garlic + oregano + salt 30 min',
      'Grill 6-7 min per side until 165°F internal',
      'Cook quinoa per package (1:2 ratio with water, simmer 15 min)',
      'Slice chicken, assemble bowls with quinoa base + chicken + fresh veg + sun-dried tomatoes',
      'Dress with extra lemon + olive oil before serving'
    ],
    notes: 'Used as Week B Lunch 1. Sun-dried tomatoes replace olives (Darlene preference). Add feta if you want — adds ~25 kcal + 1.5g P per 10g.',
    tags: ['grill','meal-prep','gluten-free','no-olives'],
    source: 'Week B Plan Doc v14'
  },
  {
    id: 'asian_beef_skewers',
    name: 'Asian Beef Skewers &amp; Rice',
    cuisine: 'Asian',
    mealType: 'Sunday Prep / Lunch',
    prepTime: 25, totalTime: 40,
    servings: '2 portions him + 2 portions her',
    macros: { him: [760,52,65,20], her: [540,28,45,15] },
    ingredients: [
      'Beef sirloin or strip loin (cubed, raw): him 180g / her 90g',
      'Jasmine rice (cooked): him 200g / her 130g',
      'Broccoli (roasted): 120g each',
      'Bell pepper (roasted): 100g each',
      'Snow peas (stir-fried): 60g each',
      'Olive oil: him 10g / her 8g',
      'Soy sauce (low sodium): him 15g / her 12g',
      'Honey: him 8g / her 6g',
      'Rice vinegar: him 5g / her 4g',
      'Garlic, ginger, sesame oil'
    ],
    method: [
      'Whisk soy + honey + rice vinegar + minced garlic + grated ginger + splash sesame oil = teriyaki',
      'Toss cubed beef in half the sauce, marinate 20 min',
      'Thread onto skewers (or pan-sear for speed), 3-4 min per side high heat',
      'Stir-fry snow peas + peppers + broccoli with remaining sauce',
      'Serve over rice'
    ],
    notes: 'Used as Week B Lunch 2. Skewers are pretty but pan-searing works too for speed. Don\'t oversauce — soy is sodium-heavy.',
    tags: ['grill','stir-fry','meal-prep'],
    source: 'Week B Plan Doc v14'
  },
  {
    id: 'italian_meatballs',
    name: 'Italian Meatballs &amp; Polenta',
    cuisine: 'Italian',
    mealType: 'Sunday Prep / Dinner',
    prepTime: 30, totalTime: 60,
    servings: '3 portions him + 3 portions her',
    macros: { him: [750,46,70,30], her: [560,27,55,22] },
    ingredients: [
      'Lean ground beef 90/10 (raw): him 180g / her 90g',
      'Polenta (cooked from cornmeal + water + salt): him 350g / her 280g',
      'Crushed tomatoes (canned, plain): him 120g / her 100g',
      'Spinach (fresh, stir-in): 100g each',
      'Olive oil: him 10g / her 8g',
      'Yellow onion, garlic, basil, oregano, parmesan for finishing'
    ],
    method: [
      'Mix ground beef with grated garlic + diced onion + salt + oregano, form into ~18 small meatballs',
      'Brown in olive oil 2 min per side',
      'Simmer in crushed tomatoes + tomato paste + basil 20 min',
      'Cook polenta: 1:4 cornmeal:water, whisk until thick, salt to taste, ~5 min',
      'Wilt fresh spinach into hot polenta or sauce day-of',
      'Top with grated parmesan when serving'
    ],
    notes: 'Used as Week B Dinner 1. Real parmesan only (no shaker stuff).',
    tags: ['stovetop','meal-prep'],
    source: 'Week B Plan Doc v14'
  },
  {
    id: 'pork_tenderloin_roots',
    name: 'Pork Tenderloin &amp; Roasted Roots',
    cuisine: 'Mediterranean',
    mealType: 'Sunday Prep / Dinner',
    prepTime: 20, totalTime: 55,
    servings: '2 portions him + 2 portions her',
    macros: { him: [760,48,55,22], her: [560,27,45,18] },
    ingredients: [
      'Pork tenderloin (raw, whole): him 200g / her 110g',
      'Yukon potatoes (raw, cubed): him 280g / her 210g',
      'Brussels sprouts (halved): 150g/120g',
      'Carrots (cut): 100g each',
      'Olive oil: him 12g / her 8g',
      'Garlic, rosemary, thyme, salt, pepper, dijon mustard'
    ],
    method: [
      'Rub pork tenderloin with olive oil + dijon + garlic + rosemary + salt + pepper',
      'Sear in pan 2 min each side for crust',
      'Transfer to oven sheet with veg, roast at 200°C for 22-25 min (internal 63°C / 145°F)',
      'Rest pork 5 min before slicing',
      'Slice and portion'
    ],
    notes: 'Used as Week B Dinner 2. Pork tenderloin is lean — don\'t overcook. Rest is critical for juiciness.',
    tags: ['oven','meal-prep','lean'],
    source: 'Week B Plan Doc v14'
  },
  {
    id: 'moroccan_chicken',
    name: 'Moroccan Chicken &amp; Couscous',
    cuisine: 'Moroccan',
    mealType: 'Sunday Prep / Lunch',
    prepTime: 20, totalTime: 45,
    servings: '3 portions him + 3 portions her',
    macros: { him: [750,55,65,22], her: [530,30,45,18] },
    ingredients: [
      'Chicken thigh, bone-in skin-on (raw): him 240g / her 120g',
      'Couscous (cooked): him 150g / her 100g',
      'Chickpeas (canned, drained): 80g each',
      'Bell pepper (roasted): 100g each',
      'Carrots (grated, tabbouleh-style): 80g each',
      'Raisins or dried apricots: 15g each',
      'Olive oil: him 10g / her 8g',
      'Lemon juice: 10g each',
      'Ras el hanout or cumin + cinnamon + paprika + ginger + coriander, fresh mint, parsley'
    ],
    method: [
      'Marinate chicken in olive oil + Moroccan spices + lemon + garlic 30 min',
      'Sear bone-in thighs skin-down 5 min, flip, transfer to oven 25 min at 200°C',
      'Cook couscous: 1:1 with boiling water, cover 5 min, fluff with fork',
      'Mix couscous with grated carrots + chickpeas + raisins + chopped mint + parsley + lemon + olive oil',
      'Serve chicken over couscous'
    ],
    notes: 'Used as Week C Lunch 1. Bone-in saves $5/wk + more flavor.',
    tags: ['oven','meal-prep','bone-in'],
    source: 'Week C Plan Doc v14'
  },
  {
    id: 'tikka_chicken',
    name: 'Tikka Chicken &amp; Basmati',
    cuisine: 'Indian',
    mealType: 'Sunday Prep / Lunch',
    prepTime: 25, totalTime: 45,
    servings: '2 portions him + 2 portions her',
    macros: { him: [750,53,70,20], her: [530,29,50,15] },
    ingredients: [
      'Chicken breast (raw, marinated + grilled): him 200g / her 100g',
      'Basmati rice (cooked): him 200g / her 130g',
      'Plain Greek yogurt (marinade): 60g each',
      'Cauliflower (roasted): 120g each',
      'Bell pepper (roasted): 80g each',
      'Red onion (raw, garnish): 30g each',
      'Olive oil: him 10g / her 8g',
      'Tikka spices: garam masala + turmeric + cumin + paprika + ginger + garlic + lemon'
    ],
    method: [
      'Marinate cubed chicken in yogurt + tikka spices + lemon 30 min (or overnight)',
      'Thread on skewers or grill in pan, 4-5 min per side high heat',
      'Roast cauliflower + peppers with turmeric + cumin + oil at 200°C for 20 min',
      'Cook basmati rice (1:1.5 rice:water, simmer covered 15 min)',
      'Serve with sliced red onion and lemon wedge'
    ],
    notes: 'Used as Week C Lunch 2. Yogurt marinade is the key — don\'t skip.',
    tags: ['grill','marinade','meal-prep'],
    source: 'Week C Plan Doc v14'
  },
  {
    id: 'beef_tagine',
    name: 'Moroccan Beef Tagine',
    cuisine: 'Moroccan',
    mealType: 'Sunday Prep / Dinner',
    prepTime: 20, totalTime: 360,
    servings: '3 portions him + 3 portions her',
    macros: { him: [760,48,60,24], her: [560,27,45,18] },
    ingredients: [
      'Beef chuck (cubed, raw): him 180g / her 90g',
      'Sweet potato (cubed, raw): him 250g / her 180g',
      'Tomato passata: him 100g / her 80g',
      'Chickpeas (canned, drained): 50g each',
      'Yellow onion (cooking base): 40g each',
      'Spinach (fresh, stir-in): 60g each',
      'Olive oil: him 10g / her 8g',
      'Moroccan spices: cumin, cinnamon, ginger, turmeric, paprika, bay leaves'
    ],
    method: [
      'Sear cubed beef chuck in olive oil for color, transfer to slow cooker',
      'Add onion + garlic + Moroccan spice blend + passata + bay leaves',
      'Slow cook LOW 6-8 hours',
      'Add cubed sweet potato at hour 4 (not earlier — turns mushy)',
      'Stir in chickpeas + fresh spinach last 15 min',
      'Serve in bowls — no rice/couscous needed, sweet potato is the carb'
    ],
    notes: 'Used as Week C Dinner 1. Beef chuck = naturally cheap.',
    tags: ['slow-cooker','meal-prep'],
    source: 'Week C Plan Doc v14'
  },
  {
    id: 'butter_chicken',
    name: 'Butter Chicken &amp; Basmati',
    cuisine: 'Indian',
    mealType: 'Sunday Prep / Dinner',
    prepTime: 25, totalTime: 50,
    servings: '2 portions him + 2 portions her',
    macros: { him: [750,46,60,30], her: [550,26,45,22] },
    ingredients: [
      'Chicken thigh, bone-in skin-on (raw): him 260g / her 130g',
      'Basmati rice (cooked): him 170g / her 130g',
      'Tomato passata: him 120g / her 90g',
      'Canned coconut milk: him 40g / her 30g',
      'Butter: him 8g / her 5g',
      'Green beans: 120g each',
      'Garam masala, turmeric, ginger, garlic, smoked paprika'
    ],
    method: [
      'Sear bone-in chicken thighs skin-down 5 min for fond',
      'Remove chicken, sauté onion + garlic + ginger + butter chicken spices in same pan',
      'Add passata + coconut milk, simmer 5 min',
      'Return chicken to pan, cover, simmer 25-30 min until cooked through (bone-in)',
      'Cook basmati rice + steam green beans separately',
      'Serve chicken over rice with sauce, green beans on side'
    ],
    notes: 'Used as Week C Dinner 2. Bone-in adds flavor to sauce. Use coconut milk sparingly — fat-heavy.',
    tags: ['stovetop','meal-prep','bone-in'],
    source: 'Week C Plan Doc v14'
  },
  {
    id: 'cuban_pork',
    name: 'Cuban Pork &amp; Rice',
    cuisine: 'Latin / Cuban',
    mealType: 'Sunday Prep / Lunch',
    prepTime: 20, totalTime: 360,
    servings: '3 portions him + 3 portions her',
    macros: { him: [760,52,65,22], her: [540,28,45,16] },
    ingredients: [
      'Pork tenderloin (raw, for slow cooker): him 180g / her 90g',
      'White or jasmine rice (cooked): him 170g / her 120g',
      'Black beans (drained, plain): 100g each',
      'Bell pepper (roasted): 80g each',
      'Red onion: 40g each',
      'Avocado (fresh day-of): him 30g / her 25g',
      'Lime juice: 10g each',
      'Olive oil: him 10g / her 8g',
      'Mojo marinade: garlic, oregano, cumin, lime, orange juice, olive oil'
    ],
    method: [
      'Rub pork with mojo marinade (garlic + oregano + cumin + lime + orange + oil), marinate 30 min+',
      'Slow cook LOW 6-8 hours until fork-tender, shred',
      'Cook rice + warm black beans separately',
      'Roast peppers + onion',
      'Assemble: rice + beans + pork + roasted veg, top with avocado + lime + cilantro day-of'
    ],
    notes: 'Used as Week D Lunch 1. Pork tenderloin is leaner + cheaper than shoulder.',
    tags: ['slow-cooker','meal-prep'],
    source: 'Week D Plan Doc v14'
  },
  {
    id: 'cajun_chicken',
    name: 'Cajun Chicken &amp; Dirty Rice',
    cuisine: 'Cajun / Southern',
    mealType: 'Sunday Prep / Lunch',
    prepTime: 25, totalTime: 45,
    servings: '2 portions him + 2 portions her',
    macros: { him: [740,52,65,20], her: [530,28,45,15] },
    ingredients: [
      'Chicken breast (raw, blackened): him 200g / her 100g',
      'Brown rice (cooked): him 180g / her 130g',
      'Kidney beans (drained, plain): 60g each',
      'Bell pepper (diced): 100g each',
      'Celery (diced, holy trinity): 60g each',
      'Yellow onion (diced): 40g each',
      'Olive oil: him 10g / her 8g',
      'Cajun seasoning: paprika, garlic, oregano, thyme, black pepper, cayenne, salt'
    ],
    method: [
      'Rub chicken breast generously with Cajun seasoning',
      'Sear in hot pan with olive oil 5-6 min each side (blackened crust)',
      'Sauté holy trinity (onion + celery + pepper) until soft, ~8 min',
      'Stir in cooked brown rice + kidney beans + Cajun spices + splash of stock for moisture',
      'Slice chicken over dirty rice, garnish with scallions if you have them'
    ],
    notes: 'Used as Week D Lunch 2. Cayenne is optional for pregnancy — adjust to taste.',
    tags: ['stovetop','meal-prep'],
    source: 'Week D Plan Doc v14'
  },
  {
    id: 'bbq_pulled_chicken',
    name: 'BBQ Pulled Chicken &amp; Wedges',
    cuisine: 'BBQ / American',
    mealType: 'Sunday Prep / Dinner',
    prepTime: 25, totalTime: 300,
    servings: '3 portions him + 3 portions her',
    macros: { him: [750,50,65,22], her: [550,28,50,18] },
    ingredients: [
      'Chicken thigh, bone-in skin-on (raw): him 240g / her 120g',
      'Russet potato (raw, wedges): him 250g / her 200g',
      'Cabbage (shredded, raw, for slaw): 100g each',
      'Carrots (grated, for slaw): part of cabbage mix',
      'Homemade BBQ sauce: 30g/25g (tomato paste + ACV + honey + smoked paprika + worcestershire)',
      'Olive oil: him 10g / her 8g',
      'Apple cider vinegar for slaw dressing'
    ],
    method: [
      'Slow-cook bone-in chicken thighs LOW 4-5 hours with splash of stock + onion',
      'Shred chicken, mix with homemade BBQ sauce',
      'Roast russet wedges: olive oil + salt + paprika + garlic powder, 220°C 35 min until crispy',
      'Make slaw: shredded cabbage + grated carrot + ACV + honey + olive oil + salt',
      'Assemble: pulled BBQ chicken + wedges + slaw'
    ],
    notes: 'Used as Week D Dinner 1. Homemade BBQ saves on jarred sauce (often loaded with corn syrup).',
    tags: ['slow-cooker','oven','meal-prep','homemade-sauce'],
    source: 'Week D Plan Doc v14'
  },
  {
    id: 'turkey_chili',
    name: 'Turkey Chili with Corn',
    cuisine: 'Tex-Mex',
    mealType: 'Sunday Prep / Dinner',
    prepTime: 20, totalTime: 60,
    servings: '2 portions him + 2 portions her',
    macros: { him: [760,50,65,22], her: [560,27,50,16] },
    ingredients: [
      'Ground turkey 93/7 (raw): him 200g / her 100g',
      'Crushed tomatoes (canned, plain): him 150g / her 120g',
      'Kidney beans (drained): 100g each',
      'Black beans (drained): 60g each',
      'Yellow onion: 60g each',
      'Bell pepper (diced): 80g each',
      'Corn on cob (roasted in husk): ½ ear each (~75g)',
      'Butter (for corn): 3g each',
      'Olive oil: him 6g / her 5g',
      'Chili spices: cumin, chili powder, smoked paprika, garlic, bay leaf, salt'
    ],
    method: [
      'Brown ground turkey in olive oil, breaking up well',
      'Add onion + pepper + garlic, sauté 5 min',
      'Add chili spices, toast 30 sec',
      'Add crushed tomatoes + both beans + bay leaf + splash water/stock',
      'Simmer covered 30 min, uncovered 15 min to thicken',
      'Roast corn in husk separately at 200°C for 25 min, butter when serving'
    ],
    notes: 'Used as Week D Dinner 2. Chili tastes better day 2.',
    tags: ['stovetop','meal-prep','freezer-friendly'],
    source: 'Week D Plan Doc v14'
  },
  {
    id: 'turkey_stir_fry',
    name: 'Turkey Stir-Fry over Eggs',
    cuisine: 'Asian / Quick',
    mealType: 'Quick Weeknight',
    prepTime: 5, totalTime: 20,
    servings: '2 dinners + 2 lunches (4 portions total)',
    macros: { him: [650,48,55,20], her: [470,32,40,15] },
    ingredients: [
      'Ground turkey (raw): him 200g / her 130g per portion',
      'Frozen stir-fry vegetable mix: 1 bag (~750g)',
      'Yellow onion (diced): 1 medium (~200g)',
      'Garlic (minced): 3-4 cloves',
      'Olive oil: 2-3 tbsp total',
      'Soy sauce, salt, pepper, paprika, cumin',
      'Potatoes (baked, side): 2 whole',
      'Fried egg on top (optional): adds ~80 kcal + 6g P'
    ],
    method: [
      'Big pan medium-high heat with olive oil, sauté onion + garlic 2 min',
      'Add ground turkey, break up, season with salt + pepper + paprika + cumin, cook 6-8 min until browned',
      'Add frozen stir-fry mix straight from bag, splash soy sauce, stir + cover 5-6 min until hot and tender',
      'Microwave 2 potatoes 6-8 min (poke holes, flip halfway) OR boil cubed potatoes 12 min in salted water',
      'Plate: turkey-veg mix + potato + optional fried egg on top',
      'Portion leftovers into 2 lunch containers immediately'
    ],
    notes: 'GREAT 20-min backup meal. Frozen stir-fry mix = zero prep, no waste. Makes dinner tonight + tomorrow\'s lunch in one pan. Sub it in when Sunday prep is too much.',
    tags: ['quick','one-pan','weeknight','batch-cook'],
    source: 'Personal — Custom Recipe'
  },
  {
    id: 'his_breakfast',
    name: 'His Breakfast — Oats &amp; Banana Stack',
    cuisine: 'Bulk Building',
    mealType: 'Breakfast',
    prepTime: 5, totalTime: 15,
    servings: '1 portion',
    macros: { him: [650,30,85,22], her: null },
    ingredients: [
      'Rolled oats: 80g',
      'Milk OR cashew milk: 200ml',
      'Banana: 1 medium',
      'Peanut butter: 20g',
      'Honey: 10g',
      'Egg whites or whole eggs alongside: 2 eggs',
      'Cinnamon'
    ],
    method: [
      'Cook oats with milk in microwave 2 min OR stovetop 5 min',
      'Stir in peanut butter + honey + cinnamon',
      'Top with sliced banana',
      'Eat 2 whole eggs (scrambled/fried) alongside for protein',
      'Coffee shake on the side: 1 scoop whey + 150ml cashew milk + actual coffee'
    ],
    notes: 'Standard pre-gym breakfast on training days. Eggs are critical for protein target.',
    tags: ['breakfast','high-carb','pre-workout'],
    source: 'Plan Doc v14'
  },
  {
    id: 'her_breakfast',
    name: 'Her Breakfast — Overnight Oats',
    cuisine: 'Pregnancy-Friendly',
    mealType: 'Breakfast',
    prepTime: 5, totalTime: 5,
    servings: '1 portion (prep night before)',
    macros: { him: null, her: [480,20,60,18] },
    ingredients: [
      'Rolled oats: 60g',
      'Greek yogurt (regular or LF): 150g',
      'Chia seeds: 15g',
      'Walnuts (chopped): 15g',
      'Frozen berries: 80g (added in morning)',
      'Cinnamon, vanilla extract'
    ],
    method: [
      'Night before: combine oats + yogurt + chia + cinnamon + vanilla in jar/container',
      'Refrigerate overnight (minimum 4 hours)',
      'Morning: stir, top with walnuts + frozen berries (will thaw as you eat)',
      'Add splash of milk if too thick'
    ],
    notes: 'Make 3-4 at a time on Sunday for easy weekday mornings. Pregnancy-friendly: fiber + protein + omega-3.',
    tags: ['breakfast','no-cook','meal-prep','pregnancy'],
    source: 'Plan Doc v14'
  },
  {
    id: 'sunday_brunch',
    name: 'Sunday Big Breakfast',
    cuisine: 'American',
    mealType: 'Sunday Brunch / Weekend',
    prepTime: 15, totalTime: 30,
    servings: '1 him + 1 her',
    macros: { him: [750,40,55,35], her: [550,28,45,25] },
    ingredients: [
      'Eggs: him 4 / her 3',
      'Bacon (real, pork + salt + smoke): him 3 strips / her 2 strips',
      'Sourdough bread (toasted): him 80g / her 60g',
      'Avocado: him 50g / her 40g',
      'Cherry tomatoes: 80g each (halved, pan-warmed)',
      'Butter for eggs: 5g each',
      'Salt, pepper, fresh herbs if available'
    ],
    method: [
      'Cook bacon in pan low-medium 8-10 min until crispy',
      'Drain on paper towel, reserve some bacon fat in pan',
      'Halve cherry tomatoes, warm in bacon fat 2-3 min',
      'Toast sourdough slices',
      'Fry or scramble eggs in same pan (or butter)',
      'Plate: eggs + bacon + tomatoes + sourdough + sliced avocado',
      'Coffee + decaf'
    ],
    notes: 'Sunday slow-start tradition. Don\'t skip the bacon-tomato move — best part.',
    tags: ['weekend','slow-morning','treat'],
    source: 'Plan Doc v14'
  },
  {
    id: 'sat_date_steak',
    name: 'Sat Date Night — Flank Steak &amp; Potatoes',
    cuisine: 'Steakhouse',
    mealType: 'Weekend / Date Night',
    prepTime: 15, totalTime: 30,
    servings: '1 him + 1 her',
    macros: { him: [780,55,55,30], her: [560,32,40,22] },
    ingredients: [
      'Flank steak (raw, marinated): him 220g / her 140g',
      'Russet potato (baked): him 300g / her 220g',
      'Asparagus: 150g each',
      'Butter: 8g each',
      'Olive oil for marinade + cooking',
      'Marinade: olive oil + soy sauce + lime + garlic + cumin + salt',
      'Garlic, fresh thyme or rosemary'
    ],
    method: [
      'Marinate flank in oil + soy + lime + garlic + cumin 1 hour minimum',
      'Bake potatoes 60 min at 200°C (start first)',
      'Grill flank hot + fast: 4-5 min per side for medium-rare',
      'REST steak 8-10 min, then slice against the grain (critical for flank)',
      'Roast or grill asparagus 5-7 min with olive oil + salt',
      'Plate with butter on potato, herbs to finish'
    ],
    notes: 'Sat date night. Flank instead of ribeye saves $25/wk (budget swap). Slicing AGAINST the grain is non-negotiable.',
    tags: ['grill','date-night','weekend'],
    source: 'Plan Doc v14 — Budget Swap'
  }
];

const STORAGE_KEY = 'rtc_recipe_book_v1';

// Load saved ratings/log from localStorage
function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch (e) { return {}; }
}
function saveSaved(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
}

let saved = loadSaved();

function renderStars(rating) {
  let s = '';
  for (let i = 1; i <= 5; i++) {
    s += i <= rating ? '★' : '<span class="empty">★</span>';
  }
  return s;
}

function avgRating(r) {
  const aRating = saved[r.id]?.alisonRating || 0;
  const dRating = saved[r.id]?.darleneRating || 0;
  const ratings = [aRating, dRating].filter(x => x > 0);
  if (ratings.length === 0) return null;
  return (ratings.reduce((a,b) => a+b, 0) / ratings.length).toFixed(1);
}

function renderRecipe(r) {
  const rd = saved[r.id] || {};
  const aRating = rd.alisonRating || 0;
  const dRating = rd.darleneRating || 0;
  const avg = avgRating(r);

  const macros = `
    <div class="macros">
      ${r.macros.him ? `
      <div class="macro-block">
        <div class="macro-block-title">Him</div>
        <div class="macro-row"><span>Cal</span><span class="macro-val">${r.macros.him[0]}</span></div>
        <div class="macro-row"><span>P</span><span class="macro-val">${r.macros.him[1]}g</span></div>
        <div class="macro-row"><span>C</span><span class="macro-val">${r.macros.him[2]}g</span></div>
        <div class="macro-row"><span>F</span><span class="macro-val">${r.macros.him[3]}g</span></div>
      </div>` : ''}
      ${r.macros.her ? `
      <div class="macro-block">
        <div class="macro-block-title">Her</div>
        <div class="macro-row"><span>Cal</span><span class="macro-val">${r.macros.her[0]}</span></div>
        <div class="macro-row"><span>P</span><span class="macro-val">${r.macros.her[1]}g</span></div>
        <div class="macro-row"><span>C</span><span class="macro-val">${r.macros.her[2]}g</span></div>
        <div class="macro-row"><span>F</span><span class="macro-val">${r.macros.her[3]}g</span></div>
      </div>` : ''}
    </div>
  `;

  return `
    <div class="recipe" data-id="${r.id}" data-cuisine="${r.cuisine}" data-type="${r.mealType}" data-tags="${r.tags.join(' ')}">
      <div class="rec-header" onclick="toggleRecipe('${r.id}')">
        <div class="rec-title-row">
          <div class="rec-name">${r.name}</div>
          <div class="rec-time">${r.totalTime}m</div>
        </div>
        <div class="rec-meta">
          <span class="rec-cuisine">${r.cuisine}</span>
          <span class="rec-type">${r.mealType}</span>
        </div>
        <div class="rec-rating-display">
          ${avg ? `${renderStars(Math.round(avg))} <span class="rec-rating-label">avg ${avg}</span>` : '<span class="rec-rating-label">not rated yet</span>'}
        </div>
      </div>
      <div class="rec-body">
        <div class="body-section">
          <h3>Servings &amp; Macros</h3>
          <p>${r.servings}</p>
          ${macros}
        </div>
        <div class="body-section">
          <h3>Ingredients</h3>
          <div class="ing-list">
            ${r.ingredients.map(i => `<div class="ing-item">${i}</div>`).join('')}
          </div>
        </div>
        <div class="body-section">
          <h3>Method</h3>
          <div class="method-list">
            ${r.method.map((s,i) => `<div class="method-step"><span class="step-num">${i+1}.</span>${s}</div>`).join('')}
          </div>
        </div>
        ${r.notes ? `<div class="body-section"><div class="notes">${r.notes}</div></div>` : ''}
        ${r.tags.length ? `<div class="tags">${r.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>` : ''}

        <div class="rating-section">
          <div class="rating-row">
            <span class="rating-label">Alison</span>
            <div class="star-input">
              ${[1,2,3,4,5].map(n => `<span class="star ${n <= aRating ? 'filled' : ''}" onclick="setRating('${r.id}','alisonRating',${n})">★</span>`).join('')}
            </div>
          </div>
          <div class="rating-row">
            <span class="rating-label">Darlene</span>
            <div class="star-input">
              ${[1,2,3,4,5].map(n => `<span class="star ${n <= dRating ? 'filled' : ''}" onclick="setRating('${r.id}','darleneRating',${n})">★</span>`).join('')}
            </div>
          </div>
          <div class="cook-log">
            <div class="cook-log-item">Last cooked:<span class="val">${rd.lastCooked || '—'}</span></div>
            <div class="cook-log-item">Times made:<span class="val">${rd.timesMade || 0}</span></div>
          </div>
          <div class="rec-btn-row">
            <button class="cook-btn" onclick="logCook('${r.id}')">📝 Just cooked this</button>
            <button class="cook-btn rec-log-tracker-btn" onclick="logRecipeToTracker('${r.id}')">📊 Log to Tracker</button>
          </div>
        </div>

        <div class="source">${r.source}</div>
      </div>
    </div>
  `;
}

function toggleRecipe(id) {
  const el = document.querySelector(`.recipe[data-id="${id}"]`);
  if (!el) return;
  el.classList.toggle('expanded');
}

function setRating(id, key, value) {
  if (!saved[id]) saved[id] = {};
  // Toggle off if clicking same star again
  if (saved[id][key] === value) {
    saved[id][key] = 0;
  } else {
    saved[id][key] = value;
  }
  saveSaved(saved);
  renderAll();
}

function logCook(id) {
  if (!saved[id]) saved[id] = {};
  saved[id].lastCooked = new Date().toLocaleDateString();
  saved[id].timesMade = (saved[id].timesMade || 0) + 1;
  saveSaved(saved);
  renderAll();
}

// Push a meal log entry to the Tracker using this recipe's own macros.
function logRecipeToTracker(id) {
  const r = RECIPES.find((x) => x.id === id);
  if (!r) return;
  const slot = prompt('Which meal slot? (Breakfast / Lunch / Dinner / Snack / Pre-workout / Pre-bed)', 'Lunch');
  if (slot === null) return;
  const slotClean = (slot || '').trim() || 'Lunch';

  const today = new Date();
  const tz = today.getTimezoneOffset() * 60000;
  const dateISO = new Date(today - tz).toISOString().slice(0, 10);

  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    date: dateISO,
    slot: slotClean,
    mealKey: 'custom:' + r.id,
    customName: r.name.replace(/&amp;/g, '&'),
    himKcal: (r.macros.him && r.macros.him[0]) || 0,
    himP:    (r.macros.him && r.macros.him[1]) || 0,
    herKcal: (r.macros.her && r.macros.her[0]) || 0,
    herP:    (r.macros.her && r.macros.her[1]) || 0,
    notes: '',
  };
  try {
    const KEY = 'rtc_tracker_meals_v1';
    const arr = JSON.parse(localStorage.getItem(KEY) || '[]');
    arr.push(entry);
    localStorage.setItem(KEY, JSON.stringify(arr));
  } catch (e) {
    alert('Could not save (storage unavailable).');
    return;
  }
  const toast = document.createElement('div');
  toast.className = 't-toast';
  toast.textContent = '✓ Logged to Tracker';
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2900);
}

let activeFilter = 'all';
let searchTerm = '';

function applyFilters() {
  let visible = 0;
  document.querySelectorAll('.recipe').forEach(el => {
    const cuisine = el.dataset.cuisine.toLowerCase();
    const type = el.dataset.type.toLowerCase();
    const tags = el.dataset.tags.toLowerCase();
    const name = el.querySelector('.rec-name').textContent.toLowerCase();
    const filter = activeFilter.toLowerCase();
    const search = searchTerm.toLowerCase();

    const matchFilter = activeFilter === 'all' ||
      cuisine.includes(filter) || type.includes(filter) || tags.includes(filter);
    const matchSearch = !search || name.includes(search) || cuisine.includes(search) || type.includes(search) || tags.includes(search);

    if (matchFilter && matchSearch) {
      el.classList.remove('hidden');
      visible++;
    } else {
      el.classList.add('hidden');
    }
  });
  document.getElementById('stats').textContent = `${visible} / ${RECIPES.length} recipes`;
}

function renderAll() {
  // Save expanded state
  const expandedIds = Array.from(document.querySelectorAll('.recipe.expanded')).map(el => el.dataset.id);
  document.getElementById('recipes').innerHTML = RECIPES.map(renderRecipe).join('');
  // Restore expanded state
  expandedIds.forEach(id => {
    const el = document.querySelector(`.recipe[data-id="${id}"]`);
    if (el) el.classList.add('expanded');
  });
  applyFilters();
}

// Filter pills
document.querySelectorAll('.rec-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.rec-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    activeFilter = pill.dataset.filter;
    applyFilters();
  });
});

// Search
document.getElementById('search').addEventListener('input', e => {
  searchTerm = e.target.value;
  applyFilters();
});

// Initial render
renderAll();
