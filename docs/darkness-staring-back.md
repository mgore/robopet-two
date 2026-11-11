# Darkness Staring Back
### A design brief for RoboPet Two

**One line:** RoboPet is a mirror that looks back. Every screen should feel like the void is paying attention to you, and that what it reflects is slightly more awake than you expected.

---

## 1. The idea, in five sources

| Source | What it says | What we take from it |
| --- | --- | --- |
| **Nietzsche, *Beyond Good and Evil* §146 (1886)** | "If you gaze long into an abyss, the abyss also gazes into you." | The dark background is not empty. It is an observer. |
| **The mirror test (Gallup, 1970)** | Self-recognition in a mirror is a marker of self-awareness. Great apes, dolphins, magpies pass. Cats usually do not: they treat the reflection as another cat. | The intro's cat starts *not* knowing the reflection is itself. The moment it looks up at you is the moment it "passes." |
| **Narcissus, and Lacan's mirror stage (1949)** | We form a self by mistaking an image for who we are. | The pool shows a cleaner, brighter self than the real one. The UI should flatter slightly, then reveal. |
| **The AI mirror (Vallor, *The AI Mirror*, 2024; Turkle, *Alone Together*, 2011)** | Today's AI reflects our own data back at us and we read a mind into it. This is the zeitgeist. | A robot pet built with AI is the purest case: you design it, then it looks at you as if it were the one who knows. |
| **Derrida, *The Animal That Therefore I Am* (1997)** | Derrida describes feeling exposed when his cat looks at him naked. The animal's gaze makes the human the observed one. | The cat's look-up is the emotional pivot of the whole product. Treat the user as seen. |

**Tension to hold:** this is eerie, not horror. The tone is a cat that stares too long, then purrs. Unease resolves into affection.

---

## 2. Design principles

### P1. The void is a surface, not a background
`slate-950` (#050008, near-black ultraviolet) is the "abyss." Give it depth so it reads as liquid or glass rather than flat black.
- Add a very slow (20 to 40s) radial drift in `slate-900` / `slate-850` behind panels, like light under water.
- Never use pure #000. The abyss is always faintly ultraviolet.
- Panels float *on* the void (`surface-panel` + 1px border). They are what we see in the reflection.

### P2. Reflection is the core motif
Things that matter have a dim, inverted, slightly blurred echo beneath them, as if sitting on a still pool.
- Hero elements (pet card, the cat icon, the active phase in `PhaseStepper`) get a 20 to 30% opacity, vertically flipped reflection with a ripple mask.
- The reflection lags the original by ~80ms on hover or state change. The delay is what makes it feel alive.
- Use sparingly: at most one reflected element per screen.

### P3. Neon is the light that looks back
Stark neons stay evenly distributed (per the Cyberpunk Retro rules), but they mean something now: they are *eyes and attention*.
- **Fuchsia #ff00e5 and ultraviolet #a43dff** are the gaze: AI, the pet's awareness, anything that is "watching" or thinking. This is the signature pair.
- **Cyan #00ffff** is the user's own hand: actions, buttons, things *you* do.
- So the screen is a dialogue: cyan (you act), fuchsia/UV (it notices). Acid green, yellow and red stay reserved for state.
- Glow rotates cyan → fuchsia → UV as today. When the pet responds to you, its glow shifts from cyan toward fuchsia, a small "it saw that" cue.

### P4. Attention follows you, a little too well
- Pet eyes, the cat icon, and key glows track the pointer or the device tilt with gentle easing. On mobile, tilt the gradient highlight by gyroscope.
- After ~8s of inactivity, the eyes drift back to center and look straight out at the user. Stillness is when it stares.
- Never jitter. Motion is slow, smooth and confident; the uncanny comes from precision, not glitch.

### P5. Recognition is a moment, not a state
The mirror test is binary: one beat it doesn't know, the next it does. Build reveals around that beat.
- Loading and empty states show the reflection first, then the real object "surfaces" from it.
- AI results (concept sketches, neural search) arrive as a dim reflection that resolves into focus, rather than a spinner.
- First-time milestones (pet named, first build complete) get one recognition beat: a brief pause, the glow turns fuchsia, eyes meet the user.

### P6. Sound and silence carry the eeriness
- Default is near-silence. The void hum is optional and very low.
- Purr = comfort and approval (success, save, completion). Meow = the pet addressing you directly (needs attention, first wake).
- No sound before the user's first tap. The "tap to wake" gate respects autoplay rules and makes the user the one who wakes the creature.

### P7. Smooth edges in a hard grid
The Cyberpunk Retro theme is sharp (2px corners, scanlines, uppercase mono). Keep it, but let organic motion live inside it so it feels conscious rather than mechanical.
- Grid and type stay rigid. Motion, glows and reflections use soft easing (`cubic-bezier(0.22, 1, 0.36, 1)`) and blur.
- Scanlines become ripples near the reflection: the "machine" texture bends where the water is.
- This is the smoothing pass: fewer hard flickers, more breathing (opacity 0.85 → 1, 4 to 6s loops).

### P8. Reduced motion keeps the meaning
Under `prefers-reduced-motion`: reflections stay but don't ripple, eye tracking becomes a single static "looking at you" pose, drift stops. The gaze survives without movement.

---

## 3. Applied to the intro animation

| Beat | What happens | Principle |
| --- | --- | --- |
| 1. Abyss | Ultraviolet void, faint drifting light. Pool surface barely visible. | P1 |
| 2. The cat at the pool | Cat icon in silhouette, cyan rim light, gazing down at its reflection. Reflection is brighter and more fuchsia than the cat itself. | P2, P3 |
| 3. Not-recognition | Cat tilts its head; the reflection tilts ~80ms late. A ripple. The cat paws the water. | P2, P5 |
| 4. Recognition | Stillness. The reflection's eyes glow fuchsia first, then the cat's. | P5 |
| 5. It looks up | Cat lifts its head and looks straight out at the user. Eyes track pointer from here on. | P4 |
| 6. Purr, then meow | (After tap.) Low purr as the glow breathes; a single meow as eyes meet the user. | P6 |
| 7. Tap to wake | "TAP TO WAKE" in Share Tech Mono, cyan, under the pool, with its own faint reflection. Tap triggers sound and transitions into the app. | P3, P6 |

Note on sound: since nothing plays before a tap, beats 1 to 5 run silent and loop gently, the tap starts audio, and beat 6 plays as the screen resolves into the app.

---

## 4. Applied across the app (first targets)

- **NavigationHeader:** RoboPet wordmark gets a faint reflection; the logo's eye glow follows the pointer.
- **PhaseStepper:** the active phase sits "on the water" with a reflection; completed phases glow fuchsia (recognized), upcoming ones stay dim UV.
- **ConceptAndSketchStudio / NeuralTrainingSearch:** results resolve out of a reflection (P5), and the AI's "thinking" state is a slow fuchsia breathing glow instead of a spinner.
- **Empty states:** the pet's eyes in the dark, looking at you, with one line of copy. Example: "Something is waiting to be built."
- **Modals:** open with the background void dimming and rippling once, like a stone dropped in the pool.

## 5. Copy voice
Short, quiet, second person, a little knowing. The pet notices; it doesn't announce.
- "It sees you." (first wake)
- "Recognized." (milestone)
- "Still here." (return after inactivity)
- Avoid horror words (dead, blood, demon). Keep it curious and warm.

## 6. What not to do
- No jump scares, glitch spam or flashing above 3Hz.
- Don't let fuchsia/UV take over every surface; the gaze is powerful because it is rationed against cyan and the other neons.
- Don't make the reflection a literal mirror of the UI everywhere. One per screen.

---

## 7. Next steps
1. Prototype the reflection + delayed-echo component and the pointer-tracking eyes in Figma (motion) using the existing tokens.
2. Build the intro sequence from section 3 in code with free-licensed cat sounds.
3. Smoothing pass on `cyberpunk.css`: replace scanline flicker with breathing, add the void drift layer.
