

## Plan: Pixar-Style Logo Animation + Eye Fix

### 1. Fix: Reduce white eye cover radius
In `AnimatedEyes.tsx`, reduce the white cover multiplier from `radius * 3` to `radius * 2.2` so it no longer clips the top outline of the logo shape.

### 2. Redesign the animation sequence (Pixar-style)
Completely rework `Index.tsx` to use a continuous, physical animation instead of swapping between separate components. The new phases:

**Phase 1 - "lockup" (0-2s):**  
The full Primary lockup image fades in (same as now).

**Phase 2 - "text-fade" (2s-3s):**  
Instead of swapping to a new component, keep the lockup visible but fade out the text portion. We'll accomplish this by overlaying the lockup with two elements side by side: the logomark (always visible) and the text (which fades out). Alternatively, since we have both assets, show the lockup, then crossfade to just the logomark standing upright in the same position.

**Phase 3 - "fall" (3s-4.5s):**  
The upright logomark physically tips over - rotates 90 degrees with a slight bounce at the end (like it's falling onto its side). Use a spring/bounce easing to sell the weight. It should feel like the Pixar lamp hopping.

**Phase 4 - "eyes-drop" (4.5s-5.5s):**  
The logomark is now on its side (which is the Lovelace orientation). The eyes drop in from above - two black circles fall from off-screen into the eye socket positions with a slight bounce. Once they land, they blink once to "wake up."

**Phase 5 - "intro" (5.5s+):**  
Eyes start tracking the mouse. Text fades in below: "Introducing the first PrimaryOS product" then "Lovelace" then "Sourcing at scale."

### Technical approach

**`Index.tsx` changes:**
- New phase type: `"lockup" | "text-fade" | "fall" | "eyes-drop" | "intro"`
- Use a single continuous animation container (no `AnimatePresence mode="wait"` swapping for the logo portion) so the logomark persists across phases
- The lockup shows first, then we transition to showing just the logomark upright
- The logomark rotates 90deg with `transition: { type: "spring", damping: 12, stiffness: 100 }` for a bouncy fall
- After falling, render AnimatedEyes but with eyes initially hidden

**`AnimatedEyes.tsx` changes:**
- Reduce white cover radius multiplier from `3` to `2.2`
- Add a new prop `showEyes` (default `true`) — when false, the animated eye pupils are hidden (opacity 0, positioned above)
- Add a `dropIn` prop — when true, the eyes animate from `y: -50px, opacity: 0` to `y: 0, opacity: 1` with a spring bounce, then trigger a single blink
- After the drop-in completes, normal mouse tracking and random blinking begins

### File changes summary
- **`src/components/AnimatedEyes.tsx`**: Reduce cover radius, add `showEyes`/`dropIn` props for the eye-drop animation
- **`src/pages/Index.tsx`**: Rewrite animation sequence with 5 phases, continuous logomark presence, physical tipping animation, and staggered text reveal

