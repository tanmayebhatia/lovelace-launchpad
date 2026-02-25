

# Fix: Seamless Primary-to-Lovelace Transition

## The Problem

The current animation has a jarring crossfade: the entire lockup (icon + text) fades out while the logomark overlay fades in. Even with perfect alignment, this opacity crossfade creates a visible flash/swap.

## The User's Intent

1. Primary lockup is shown (icon + "Primary" text)
2. The **text fades away**, but the **icon stays perfectly still** -- no flash, no swap
3. The icon then smoothly grows bigger and rotates from -90deg to 0deg (becoming the Lovelace face)
4. Eyes drop in, text appears

## Root Cause

The logomark overlay (`AnimatedEyes`) starts at `opacity: 0` and only fades in when the lockup fades out. This simultaneous crossfade is what causes the jank -- two images swapping visibility at the same time.

## Solution

Make the logomark overlay **visible from the very start** (`opacity: 1`), positioned and rotated to perfectly match the icon inside `lockup.png`. Since it sits on top and matches exactly, it's visually invisible. When the lockup fades out, only the text disappears -- the icon appears to stay because the overlay was already there all along.

### The Eye Cover Issue

`AnimatedEyes` renders white circles over the logomark's painted eyes. If these are visible from the start (rotated -90deg over the lockup icon), they'd blank out the eyes during the lockup phase, looking wrong. We need to hide the white covers until the grow phase begins.

## Changes

### 1. `src/components/AnimatedEyes.tsx`
- Add a new prop: `showCovers?: boolean` (default `true`)
- Only render the white eye-cover divs when `showCovers` is true
- This lets us show the raw logomark (with its painted eyes) during the lockup phase

### 2. `src/pages/Index.tsx`
- Change the overlay's initial opacity from `0` to `1` -- it's always visible
- Remove the `opacity` animation entirely from the motion div (it never needs to fade)
- Pass `showCovers={isGrown}` to `AnimatedEyes` so white covers only appear when the logo starts growing/rotating
- Keep the lockup image fading out on `reveal` as before -- now only the text disappears since the icon is already covered by the overlay
- The `reveal` phase just fades the lockup; the `grow` phase handles movement, scale, and rotation as before

### Phase sequence (unchanged timing):
```text
t=0s    "lockup"    -- Full branding visible. Overlay sits on top of icon, invisible to user.
t=2s    "reveal"    -- lockup.png fades out (text disappears, icon "stays")
t=2.8s  "grow"      -- Overlay moves to center, scales up, rotates -90 -> 0. Eye covers appear.
t=4.2s  "eyes-drop" -- Pupils drop in
t=5.2s  "intro"     -- Text reveals
```

## Technical Details

### AnimatedEyes.tsx changes:
```tsx
// Add prop
showCovers?: boolean;

// In component, default to true
const AnimatedEyes = ({ ..., showCovers = true }) => {

// Wrap the white cover divs:
{eyePositions && showCovers && (
  // white covers and animated eyes...
)}
```

### Index.tsx overlay changes:
```tsx
<motion.div
  initial={{
    x: logoOffset.x,
    y: logoOffset.y,
    rotate: -90,
    scale: logoOffset.scale,
    // opacity: 1 -- visible from the start!
  }}
  animate={{
    x: isGrown ? 0 : logoOffset.x,
    y: isGrown ? 0 : logoOffset.y,
    rotate: isGrown ? 0 : -90,
    scale: isGrown ? 1 : logoOffset.scale,
    // no opacity animation needed
  }}
  // ... transitions stay the same
>
  <AnimatedEyes
    size={TARGET_SIZE}
    animate={showEyes}
    showEyes={showEyes}
    showCovers={isGrown}  // covers hidden during lockup, shown during grow
    dropIn={showEyes}
  />
</motion.div>
```

This approach ensures zero visual discontinuity: the overlay is always there, perfectly matching the lockup icon, so fading the lockup only removes the text.

