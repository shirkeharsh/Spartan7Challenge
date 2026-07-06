import type { Exercise } from "../types";

export const EXERCISES: Exercise[] = [
  // --- CHEST ---
  {
    id: "floor_press",
    name: "Dumbbell Floor Press",
    category: "Chest",
    description: "An excellent chest-builder that is shoulder-friendly and targets the chest and triceps without needing a bench.",
    defaultSets: 4,
    defaultReps: 12,
    restTimer: 90,
    instructions: [
      "Lie flat on your back on the floor with your knees bent and feet flat.",
      "Hold a dumbbell in each hand, resting your upper arms on the floor at a 45-degree angle from your torso.",
      "Exhale and press the weights straight up over your chest, extending your elbows but not locking them out.",
      "Slowly lower the dumbbells back down until your elbows gently touch the floor.",
      "Pause for a fraction of a second, then press back up."
    ]
  },
  {
    id: "dumbbell_fly",
    name: "Dumbbell Floor Fly",
    category: "Chest",
    description: "Isolates the chest muscles, focusing on horizontal adduction. Performing it on the floor prevents over-extension and protects the shoulders.",
    defaultSets: 3,
    defaultReps: 12,
    restTimer: 75,
    instructions: [
      "Lie flat on the floor with your knees bent. Hold dumbbells directly above your chest with palms facing each other.",
      "Keep a slight bend in your elbows throughout the movement.",
      "Slowly lower your arms out in a wide arc to your sides until your triceps/elbows touch the floor.",
      "Squeeze your chest muscles to bring the dumbbells back to the starting position along the same arc.",
      "Focus on squeezing the inner chest at the top of the movement."
    ]
  },
  {
    id: "push_ups",
    name: "Push-ups (Bodyweight)",
    category: "Chest",
    description: "The ultimate bodyweight compound movement targeting the chest, shoulders, triceps, and core stability.",
    defaultSets: 4,
    defaultReps: 15,
    restTimer: 60,
    instructions: [
      "Get into a high plank position with hands slightly wider than shoulder-width.",
      "Keep your head, neck, spine, and hips in a straight line. Engage your core and squeeze your glutes.",
      "Lower your body by bending your elbows at a 45-degree angle until your chest is just above the floor.",
      "Push through your palms to return to the starting position, extending your arms fully.",
      "Do not allow your lower back to sag; maintain a rigid torso."
    ]
  },

  // --- BACK ---
  {
    id: "one_arm_row",
    name: "One-arm Dumbbell Row",
    category: "Back",
    description: "Unilateral movement that isolates the lats, rhomboids, and traps while building core stability.",
    defaultSets: 4,
    defaultReps: 12,
    restTimer: 60,
    instructions: [
      "Place your left knee and left hand on a sturdy flat surface (or hinge forward with one leg back for support).",
      "Hold a dumbbell in your right hand, letting it hang straight down with your palm facing in.",
      "Keep your back flat and parallel to the floor.",
      "Pull the dumbbell up towards your hip, keeping your elbow close to your side and squeezing your shoulder blade.",
      "Slowly lower the dumbbell back to the starting position with full extension.",
      "Complete the set, then switch sides."
    ]
  },
  {
    id: "bent_over_row",
    name: "Bent-over Dumbbell Row",
    category: "Back",
    description: "Compound back builder that strengthens the entire posterior chain, including the lower back, lats, and upper back.",
    defaultSets: 4,
    defaultReps: 10,
    restTimer: 90,
    instructions: [
      "Stand with feet shoulder-width apart, holding a dumbbell in each hand.",
      "Hinge at your hips and bend your knees slightly, lowering your torso until it is almost parallel to the floor.",
      "Keep your back straight and head neutral.",
      "Exhale and pull both dumbbells to your waist, driving your elbows back and squeezing your shoulder blades together.",
      "Inhale and slowly lower the weights back to full arm extension."
    ]
  },
  {
    id: "reverse_fly",
    name: "Dumbbell Reverse Fly",
    category: "Back",
    description: "Isolates the posterior deltoids and middle back muscles, helping to correct posture and build upper back thickness.",
    defaultSets: 3,
    defaultReps: 15,
    restTimer: 75,
    instructions: [
      "Stand with feet hip-width apart and hinge forward at the hips, keeping a flat back.",
      "Hold dumbbells hanging straight down, palms facing each other, with a slight bend in your elbows.",
      "Raise your arms out to the sides in a flying motion, squeezing your shoulder blades at the top.",
      "Ensure your torso remains stationary; do not swing the weights.",
      "Slowly lower the dumbbells back down under control."
    ]
  },

  // --- BICEPS ---
  {
    id: "alternate_curl",
    name: "Alternate Dumbbell Curl",
    category: "Biceps",
    description: "Classic bicep builder. Alternating arms allows for maximum load and focus on the supination of the wrist.",
    defaultSets: 4,
    defaultReps: 12,
    restTimer: 60,
    instructions: [
      "Stand tall with a dumbbell in each hand, arms at your sides, and palms facing forward.",
      "Keep your elbows locked close to your torso.",
      "Curl the dumbbell in your right hand toward your shoulder, rotating your palm upward (supinating) as you lift.",
      "Squeeze your bicep at the top, then slowly lower the dumbbell back down.",
      "Repeat the movement with your left hand, alternating arms for the duration of the set."
    ]
  },
  {
    id: "hammer_curl",
    name: "Dumbbell Hammer Curl",
    category: "Biceps",
    description: "Targets the brachialis and brachioradialis (forearm), adding thickness to the arms and improving grip strength.",
    defaultSets: 3,
    defaultReps: 12,
    restTimer: 60,
    instructions: [
      "Stand tall with dumbbells in each hand, arms hanging down, and palms facing each other (neutral grip).",
      "Keep your elbows pinned close to your body.",
      "Curl the weights up while keeping your palms facing each other throughout the lift.",
      "Raise the weights until the dumbbells are near shoulder level, squeeze your biceps, and slowly lower back down."
    ]
  },
  {
    id: "concentration_curl",
    name: "Concentration Curl",
    category: "Biceps",
    description: "Isolates the biceps by preventing momentum and upper body movement, helping build the bicep 'peak'.",
    defaultSets: 3,
    defaultReps: 12,
    restTimer: 60,
    instructions: [
      "Sit on the edge of a chair or bench, feet wide, holding a dumbbell in one hand.",
      "Hinge forward and rest the back of your active upper arm against the inside of your corresponding thigh.",
      "Let the weight hang down, palm facing forward.",
      "Curl the weight up toward your face, focusing entirely on bicep contraction. Keep your torso completely still.",
      "Squeeze at the top, then slowly lower to full extension. Switch sides after completing reps."
    ]
  },
  {
    id: "biceps_21s",
    name: "Dumbbell 21s",
    category: "Biceps",
    description: "An intense bicep burnout technique consisting of 3 partial-range sets of 7 reps performed back-to-back without rest.",
    defaultSets: 3,
    defaultReps: 21,
    restTimer: 90,
    instructions: [
      "Perform 7 partial reps from the bottom position (fully extended) up to the halfway mark (elbows bent at 90 degrees).",
      "Immediately perform 7 partial reps from the halfway mark (90 degrees) up to the top (near your shoulders).",
      "Immediately perform 7 full range-of-motion reps from the bottom all the way to the top.",
      "Keep your posture upright and avoid swinging your torso."
    ]
  },

  // --- SHOULDERS ---
  {
    id: "shoulder_press",
    name: "Seated Dumbbell Shoulder Press",
    category: "Shoulders",
    description: "Compound movement targeting the anterior and lateral deltoids as well as the triceps.",
    defaultSets: 4,
    defaultReps: 10,
    restTimer: 90,
    instructions: [
      "Sit upright on a sturdy chair, holding dumbbells at shoulder level with an overhand grip (palms facing forward).",
      "Engage your core and keep your back straight.",
      "Press the weights straight up overhead, extending your arms fully without locking out your elbows.",
      "Slowly lower the dumbbells back down to shoulder level, controlling the weight on the descent."
    ]
  },
  {
    id: "lateral_raise",
    name: "Dumbbell Lateral Raise",
    category: "Shoulders",
    description: "The primary exercise to build lateral deltoids, giving the shoulders a wider, capped look.",
    defaultSets: 4,
    defaultReps: 15,
    restTimer: 60,
    instructions: [
      "Stand with feet shoulder-width apart, holding dumbbells at your sides with palms facing each other.",
      "Maintain a very slight bend in your elbows and lean slightly forward from the waist.",
      "Raise your arms out to the sides in a wide arc until they are parallel to the floor.",
      "Lead the movement with your elbows and dump your wrists slightly at the top (like pouring water).",
      "Slowly lower the dumbbells back to the starting position."
    ]
  },
  {
    id: "front_raise",
    name: "Dumbbell Front Raise",
    category: "Shoulders",
    description: "Isolates the anterior (front) deltoids, helping build front shoulder definition.",
    defaultSets: 3,
    defaultReps: 12,
    restTimer: 60,
    instructions: [
      "Stand tall, holding dumbbells in front of your thighs with palms facing your body.",
      "Keeping your arms straight (with a micro-bend in elbows), lift the dumbbells straight out in front of you.",
      "Raise the weights until your arms are slightly above parallel to the floor.",
      "Pause for a moment, then slowly lower the weights back down under control.",
      "Avoid rocking or using momentum to lift the dumbbells."
    ]
  },
  {
    id: "rear_delt_fly",
    name: "Rear Delt Fly (Seated/Bent)",
    category: "Shoulders",
    description: "Isolates the posterior deltoid, crucial for shoulder health, balance, and rounded shoulder aesthetics.",
    defaultSets: 3,
    defaultReps: 15,
    restTimer: 60,
    instructions: [
      "Sit on the edge of a chair and lean forward so your chest is close to your thighs.",
      "Hold dumbbells beneath your legs with palms facing each other and elbows slightly bent.",
      "Raise your arms out to the sides, lifting through your elbows, squeezing the back of your shoulders.",
      "Ensure you are not shrugging; keep your neck relaxed.",
      "Slowly lower the weights back to the starting position."
    ]
  },

  // --- LEGS ---
  {
    id: "goblet_squats",
    name: "Dumbbell Goblet Squat",
    category: "Legs",
    description: "An exceptional squat variation that loads the quadriceps, glutes, and core while encouraging deep, upright squatting form.",
    defaultSets: 4,
    defaultReps: 12,
    restTimer: 90,
    instructions: [
      "Stand with feet slightly wider than shoulder-width apart, toes pointed slightly out.",
      "Hold a dumbbell vertically by one end, cupping it close to your chest with both hands.",
      "Hinge at your hips and bend your knees to lower your body, keeping your chest up and back flat.",
      "Squat down until your thighs are at least parallel to the floor (or deeper if comfortable).",
      "Push through your heels to return to the starting position, squeezing your glutes at the top."
    ]
  },
  {
    id: "lunges",
    name: "Dumbbell Walking Lunges",
    category: "Legs",
    description: "Builds unilateral lower-body strength, balance, and stability in the quadriceps, hamstrings, and glutes.",
    defaultSets: 3,
    defaultReps: 12, // per leg
    restTimer: 75,
    instructions: [
      "Stand tall holding dumbbells at your sides, palms facing each other.",
      "Step forward with your right foot, lowering your hips until your right thigh is parallel to the floor and left knee hover just above the ground.",
      "Keep your front knee aligned directly over your ankle (don't let it overshoot your toes).",
      "Push off your left foot to step forward into the next lunge with your left leg leading.",
      "Maintain an upright posture throughout the movement."
    ]
  },
  {
    id: "romanian_deadlift",
    name: "Dumbbell Romanian Deadlift",
    category: "Legs",
    description: "Excellent hamstring and glute isolation movement that also strengthens the lower back and core.",
    defaultSets: 4,
    defaultReps: 10,
    restTimer: 90,
    instructions: [
      "Stand with feet hip-width apart, holding dumbbells in front of your thighs, palms facing back.",
      "Keep your back flat, chest up, and shoulder blades slightly retracted.",
      "Hinge at your hips, pushing them backwards, and slowly lower the weights down the front of your legs.",
      "Maintain a very slight, static bend in your knees (do not squat). Lower until you feel a deep stretch in your hamstrings.",
      "Squeeze your hamstrings and glutes to drive your hips forward and return to standing."
    ]
  },
  {
    id: "calf_raises",
    name: "Dumbbell Calf Raise",
    category: "Legs",
    description: "Isolates the calf muscles (gastrocnemius and soleus) to build lower leg strength and ankle stability.",
    defaultSets: 4,
    defaultReps: 20,
    restTimer: 45,
    instructions: [
      "Stand on a flat surface (or on the edge of a step for increased range of motion) holding dumbbells in each hand.",
      "Keep your feet hip-width apart and knees straight but not locked.",
      "Press through the balls of your feet to raise your heels as high as possible.",
      "Hold the contraction at the top for one second.",
      "Slowly lower your heels back down until you feel a stretch in your calves."
    ]
  },

  // --- CORE ---
  {
    id: "planks",
    name: "Forearm Plank (Bodyweight)",
    category: "Core",
    description: "Isometric core builder that strengthens the transverse abdominis, rectus abdominis, glutes, and shoulders.",
    defaultSets: 3,
    defaultReps: 60, // 60 seconds
    restTimer: 45,
    instructions: [
      "Place your forearms on the floor, elbows directly under your shoulders, and extend your legs behind you.",
      "Engage your core, squeeze your glutes, and tuck your pelvis to maintain a flat back.",
      "Your body should form a straight line from your head to your heels.",
      "Hold this position, breathing steadily. Do not let your hips sag or rise up."
    ]
  },
  {
    id: "leg_raises",
    name: "Lying Leg Raises (Bodyweight)",
    category: "Core",
    description: "Targets the lower abdominal muscles and hip flexors.",
    defaultSets: 3,
    defaultReps: 15,
    restTimer: 45,
    instructions: [
      "Lie flat on your back on a mat, arms at your sides with palms facing down (or place hands under glutes for support).",
      "Keep your legs straight and squeeze them together.",
      "Slowly raise your legs toward the ceiling until they form a 90-degree angle with your torso.",
      "Under control, slowly lower your legs back down until they are hovering just an inch off the floor.",
      "Ensure your lower back stays pressed flat against the floor throughout the entire movement."
    ]
  },
  {
    id: "russian_twists",
    name: "Dumbbell Russian Twist",
    category: "Core",
    description: "Engages the obliques and transverse abdominis through rotational core control.",
    defaultSets: 3,
    defaultReps: 20, // 10 per side
    restTimer: 45,
    instructions: [
      "Sit on the floor with knees bent and feet flat. Hold a light dumbbell with both hands near your chest.",
      "Lean your torso back at a 45-degree angle, keeping your spine straight and core engaged.",
      "Optionally lift your feet off the floor a few inches and balance on your sit bones.",
      "Rotate your torso to the right, tapping the dumbbell on the floor beside your hip.",
      "Rotate back through the center and tap the dumbbell on the left side, keeping the movement controlled."
    ]
  }
];
