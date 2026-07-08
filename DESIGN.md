# RitualOS Aero — Design Bible

## The vision

RitualOS stops pastiching Windows XP and becomes its own thing: the utopian
2000s future that never quite arrived. Frutiger Aero, but native — glossy
aqua glass, auroras, bubbles, dew, grass-and-sky optimism, humanist
technology. Every window is a unique *device* from an imagined
dream-hardware ecosystem, not a floating rectangle. The personality stays
soft, ecological, and a little haunted — this is not corporate slickness,
it's a ghost living in beautiful hardware.

The portfolio content (exhibitions, freelance, about, contact, press) is
the reason the site exists. No amount of glass is allowed to make it harder
to read.

## Palette bridge

Nothing here is a new hue invented from scratch. Every Aero material is
*derived* from the existing RitualOS palette (`style.css :root`) using
`color-mix()`, so the site is recognisably the same object, just rendered
in glass and light instead of flat XP gradients. See `--aero-*` tokens in
`aero.css`.

| Aero role | Derived from |
|---|---|
| **Aqua** (the primary hue — cyan/teal glass, title bars) | `--xp-blue-mid` × `--start-green-light` |
| Glass tint (blue) | `--xp-blue-light` / `--xp-blue-mid` |
| Colored shadow | `--xp-blue-dark` (shadows are never flat black — they carry the hue of the surface casting them) |
| Aurora mint | `--xp-blue-mid` × `--start-green-light` |
| Grass / ground accent | `--start-green-light` → `--start-green-dark` |
| Titanium | `--neutral-grey` × `--neutral-white` |
| Gel button hues | reuse existing semantic colors directly (green = start, red = close/danger, blue/aqua = primary) |

**Reference-matched direction (per your Frutiger Aero browser-theme
screenshot):** the language is blue/cyan/green-led, not pink-led — deep
sky-blue, glossy aqua/cyan glass, and grass-green accents, the same story
as the reference image (sky photo blending into glossy cyan browser
chrome, bright green MSN/clover accents, no pink anywhere). Pink stays in
the token system (`--aero-glow-pink`, `--tuna-pink-dark`-derived tints)
because `--aero-glow-primary`/`--aero-glow-secondary` are deliberately
swappable per-component — a future device can still reach for pink if it
earns it — but it's no longer the default RitualOS Aero hue.

## Materials library

Each material is a documented CSS recipe in `aero.css`, applied via a
reusable class. All use only palette-derived tokens.

### 1. Aqua Glass — `.aero-glass`
Translucent panel: `backdrop-filter: blur + saturate`, a soft tinted glass
background (never fully opaque), a bright specular highlight along the top
edge (the classic Aqua "light hitting curved glass" band), and an inner
glow at the border so the edge reads as *thickness*, not a flat line.

```
background: linear-gradient(180deg, var(--aero-glass-sheen) 0%, var(--aero-glass-tint) 100%);
backdrop-filter: blur(var(--aero-blur-md)) saturate(160%);
border: 1px solid var(--aero-glass-edge);
box-shadow: var(--aero-elevation-3);
```
Plus a `::before` pseudo-element for the top specular streak.

### 2. Gel Button — `.aero-gel-button`
Candy-gloss, pill-shaped, with a bright highlight ellipse near the top and
a **physical press**: `:active` doesn't just darken, it depresses —
`translateY` + shrink + shadow collapse, like pushing a real button into a
real socket.

### 3. Brushed Titanium — `.aero-titanium`
A fine repeating diagonal gradient (brushed-metal texture) for device
shells/frames — the "hardware" around the "glass".

### 4. Dew / Bubble — `.aero-dew`
A small radial highlight overlay (`::after`) that reads as a droplet of
condensation or a soap-bubble sheen. Used sparingly, on rounded surfaces —
this is the detail that makes the ghost, buttons, and device shells feel
*wet with morning light* rather than just shiny.

### 5. Sky / Aurora — `.aero-sky`, `.aero-aurora`
Large ambient background gradients for environments (desktop, device
interiors). Multi-stop blends of sky-blue, candy-pink, and the derived
aurora mint/violet.

### 6. Grass accent — `.aero-grass`
A green gradient/texture for ecological touches — ground-level surfaces,
the Birdsweeper "specimen tray" material family in Phase 2.

## Depth system

Four elevation levels, each a paired shadow + inner highlight recipe
(`--aero-elevation-1` … `-4`). Shadows use the derived colored-shadow tint,
never flat black, so depth reads as "glass floating in coloured light"
rather than "box with a drop-shadow filter applied."

- **1** — resting UI chrome (buttons, small controls)
- **2** — panels embedded in a window
- **3** — a window itself, floating on the desktop
- **4** — an actively-dragged/focused window, or a modal

## 2.5D device-shell recipe

`.aero-device-shell` gives any window a subtle dimensional tilt
(`perspective` + a few degrees of `rotateX`) plus a reflective "screen"
inset (the actual content area) with a diagonal light-sweep gradient laid
over it — the same trick real glossy hardware photography uses. This is
the base every Phase 2 device silhouette builds on.

## Motion language

Everything eases like it has water in it.

```
--aero-ease-buoyant: cubic-bezier(0.34, 1.56, 0.64, 1); /* soft overshoot */
--aero-ease-soft:    cubic-bezier(0.22, 1, 0.36, 1);    /* gentle settle */
--aero-duration-fast:   180ms;
--aero-duration-medium: 320ms;
--aero-duration-slow:   620ms;
```

- **Open**: soft overshoot scale-in (buoyant ease), replacing the old XP pop.
- **Hover**: elements float — a few px of `translateY` lift with buoyant ease.
- **Click**: a ripple expands from the click point and fades (`.aero-ripple`).
- **Reduced motion**: every one of the above collapses to instant/none
  under `prefers-reduced-motion: reduce`, same convention the site already
  uses.

## Hero demo — Contact window

Reference: an Xbox 360 Blades-style panel, not a Windows-XP-file-window —
mostly *see-through* (you can genuinely make out the desktop behind it,
diffused by a heavy backdrop-blur), with a single glowing gradient border
wrapping the whole shape rather than a solid drop shadow underneath it.

**Architecture — one continuous panel, not a title-bar-plus-body split.**
The XP convention (opaque colored title bar sitting on top of a
differently-colored opaque body) is gone here. `#window-contact.aero-demo`
itself carries the only fill (a translucent sky-blue → aqua → grass-green
wash, ~20–24% opacity) and the only border/glow; `.title-bar` and
`.window-content` are both `background: transparent` and simply sit inside
that one glass surface, so there's no seam between them — just a thin
translucent divider line under the title. Blue/aqua/green glow wraps the
whole perimeter (`box-shadow` with no offset, blurred outward in every
direction), not just a shadow pooling underneath.

**Legibility guarantee, unchanged in spirit:** the frame can be as
see-through as an Xbox blade because every line of actual content sits on
its own near-opaque frosted "reading chip" — a small glowing floating
card, not a flat pill (measured at 7.37:1+ contrast, WCAG AAA). This chip
pattern is the intended approach for every content-first window in Phase 2
(Exhibitions/Freelance/Press/About/Contact): however transparent the
surrounding glass gets, the words themselves always sit on a solid card.

**Known engine quirk, worth remembering for Phase 2:** a custom property
(`--aero-elevation-4`) that nests `var(--aero-glow-secondary)` inside it
does *not* reliably pick up a per-element override of
`--aero-glow-secondary` in this rendering engine — the nested reference
gets baked in wherever the outer property was first resolved, not
re-substituted at each element that uses it. Practical fix: don't chain
overridable tokens through an intermediate shared custom property: write
`box-shadow` (or whatever) with the specific glow tokens directly, the way
the Contact demo does now. This will matter once Phase 2 devices want
device-specific glow colors.

This is scoped *only* to `#window-contact` via `aero.css` — nothing else on
the site changes in Phase 0. Everything else stays exactly as it was until
each is approved in Phase 2.

## Phase 1 — built

The desktop is no longer wallpaper-plus-icons; it's a living environment.
Approved and shipped:

- **Sky** (`#aero-sky`, `aero.js`): a layer composited over `church.mp4`
  (video kept, not replaced) — a time-of-day tint, a blurred aurora band,
  a static star field, three drifting clouds, three slow rising bubbles,
  and a `.aero-sky-darken` colour-grade layer on top of all of it. That
  last layer is a smooth continuous curve (`getAeroDarkness()`: 0 at noon,
  1 at midnight, cosine-interpolated) — not a discrete state jump — so the
  video dims gradually through the day rather than snapping between four
  fixed looks. `aero.js` reads the visitor's real local hour and applies
  `body.aero-time-{dawn,day,golden,night}` for hue only, re-checking every
  60s so a long-open tab dims and re-hues live, not just at page load.
- **Taskbar polish**: the clock had zero gap to the audio-toggle button
  (their edges landed on the exact same pixel) — invisible on the old
  flush-edge taskbar, obvious on the floating dock. Added a 10px margin.
- **Taskbar → `.aero-dock`**: floating aqua-glass bar detached from the
  viewport edge (14px margin all round) instead of flush-mounted, glowing
  border, backdrop-blur. Same children, same functionality — just re-cased.
- **Start button → `.aero-orb`**: liquid gel pill (green, matching the
  existing start-green semantic colour) with a real press state, replacing
  the flush-left XP-shaped button.
- **Start menu**: repositioned to float above the dock (it was hardcoded
  for the old edge-to-edge taskbar and would have overlapped it — caught
  in testing, not by inspection) and lightly re-glassed to match.
- **Desktop icons**: a glass "shelf" ellipse under every icon plus a
  `-webkit-box-reflect` mirror on the artwork itself (Chromium/WebKit only;
  Firefox just shows no reflection — decorative, not functional, so this
  degrades safely).
- **Boot screen**: same DOM, same ~3s JS timing, restyled — the horizontal
  loading bar became three staggered expanding ripple rings, the logo gets
  a clip-path "rising into view" reveal plus an aqua glow, and the
  background/text tint shifted from pure monochrome toward a hint of aqua.

**Performance**: no new `backdrop-filter` surfaces beyond the dock, the
start menu, and Contact (three total, all Phase 0/1-approved) — the sky
layer, icon shelves/reflections, and boot ripples all use plain
gradients/transforms, no blur cost. Verified with 5 windows open
simultaneously (About, Birdsweeper, Press, Exhibitions, Freelance) plus
GT Paint and Tuna's game loop — no console errors, no dropped
functionality. `prefers-reduced-motion` disables clouds/bubbles/aurora
drift and the boot ripples, matching the site's existing convention.

## Phase 2, device 1 — GT Paint (built)

A re-skin, deliberately not a rebuild: same DOM, same tool IDs, same event
wiring in `gtpaint.js` — every brush, undo/redo, zoom, mirror, stamp, and
confirm guard is untouched underneath. What changed is `.aero-console` on
`#window-gtpaint` in `aero.css`:

- **Shell**: a brushed-titanium frame (`repeating-linear-gradient`) with a
  thick gel-aqua inset border, large rounded corners, and the Phase-0/1
  colourful glow extended to elevation-4.
- **Screen**: `.gtpaint-canvas-wrap` is now a recessed bezel (deep inset
  shadow) with a diagonal light-sweep gradient layered over the canvas
  itself, and the canvas border became a titanium-and-aqua bezel frame.
- **Controls**: every toolbar button, zoom/mirror/stamp/shape-texture
  button, and the rainbow toggle got a chunkier gel-button press (bigger
  hover lift, deeper active-state shadow collapse); the Brush/Text/Zoom
  sliders got custom circular dial-style thumbs instead of the OS-default
  slider handle.
- **Details**: a moulded speaker grille (dot-pattern, top-right) and a
  small engraved "GT" wordmark (bottom-right, inset text-shadow so it
  reads carved-into-plastic rather than printed) — both `pointer-events:
  none`, purely decorative.
- **Kept as intentionally out of scope**: no `rotateX`/perspective tilt on
  the shell. GT Paint is the one device where precise mouse-to-canvas
  alignment matters most; a literal 2.5D tilt risked feeling disorienting
  while drawing, so the "dimensional" feeling here comes from shadows/
  bezels/materials rather than a physical rotation. Worth reconsidering
  once Phase 2's other devices establish whether a tilt reads well.

Verified: all 7 original brushes still draw, undo/redo still correct,
stamps/mirror/kaleidoscope/zoom/shape tools still work, the Clear confirm
guard still fires — all re-checked after the re-skin, not assumed safe
from "it's just CSS."

### Revision 2 — an actual gadget silhouette, not a re-skinned rectangle

First pass above kept the standard window rectangle (full-width title bar,
toolbar rows stacked above the canvas) and only changed materials. Correct
feedback: the brief asked for "interesting shapes... tools on a wheel like
a controller," pointing at real Frutiger Aero media-player skins — those
have an asymmetric rounded body, a dominant screen, and physical control
wheels, not a rectangle with nicer paint. Rebuilt around that:

- **Shell**: `border-radius: 70px 40px 90px 50px / 45px 80px 45px 100px`
  — four different corner radii, an organic asymmetric body instead of a
  uniform rounded rectangle. Deliberately `border-radius`, not
  `clip-path`: radius only ever rounds the exterior of the box, so with
  generous padding (16px) it can't cut into a control the way an
  aggressively-cut clip-path polygon could on a window this control-dense.
- **Layout**: `.gtpaint-content` is now a CSS grid — a dark digital
  "readout" strip (colour + brush/text size, styled like an LCD info
  line) across the top, the screen and a control wheel side by side in
  the middle, and a compact scrollable "deck" for everything else along
  the bottom.
- **The wheel**: the 8 classic brushes (pencil/eraser/spray/glow/tube/
  ribbon/glitter/type) arranged radially around a glossy hub using
  `transform: rotate(var(--r)) translate(96px) rotate(calc(-1 * var(--r)))`
  — a genuine circular controller-face-button layout, not a row of
  buttons pretending. The 5 newer tools (stamp/eyedropper/line/rect/
  ellipse) moved to the deck rather than crowding a 13-button wheel,
  which would've been unreadable clutter compared to the reference images
  (which show ~5-8 wheel positions, not 13).
- **Title bar → utility strip**: the old full-width XP title bar is gone;
  now it's just the close button corner-mounted on transparent
  background, matching how the reference gadgets tuck their controls into
  corners rather than running a bar across the top.

Every element kept its original `id` and simply moved to a new parent
(readout/wheel/deck) — `gtpaint.js` wires up controls by `getElementById`
and has no idea or care where in the layout a button physically sits, so
none of it needed to change. Re-verified after the restructure specifically
because the risk profile is different from a pure re-skin: confirmed all
8 wheel buttons are positioned without overlap and are the actual topmost
element at their own center point (i.e. genuinely clickable, not visually
present but covered by something), confirmed a wheel-tool click both
switches tool and draws on canvas, confirmed every deck control (stamp
picker, mirror/kaleidoscope, undo, zoom slider, download button) still
functions and isn't clipped by the new asymmetric shell corners, and
re-confirmed the Clear/Close confirm guards still fire correctly.

**Caveat**: I could not get a visual screenshot of this revision — the
preview tooling hit a rendering timeout in this session despite the page
being fully responsive to script execution throughout (confirmed via
direct DOM/eval checks). Everything above is verified structurally
(geometry, hit-testing, actual click-and-draw simulation) but not
eyeballed by either of us yet. Worth a visual pass before calling this
final.

### Revision 3 — "the gadget": real shell geometry + a functional dial

Full rebuild against a hand-drawn sketch and Frutiger Aero media-player
skin references. The window is no longer a styled rectangle at all:

- **Shell**: a `<svg class="gt-shell">` (viewBox `0 0 1000 800`, the window
  locked to that exact aspect ratio) draws the actual hardware — a
  chrome-bezelled screen recess, a chrome-rimmed wheel dock, and an
  irregular tools-panel body (concave swoop on the left, flared bottom
  right, tucked under the wheel on the right — a cubic-bezier path, not a
  rounded rect) — all in aero-blue glass (`--aero-aqua`/`--xp-blue-*`)
  with a chrome gradient for trim. One `feDropShadow` filter on the whole
  group casts a single shadow that follows the actual silhouette, never a
  bounding-box rectangle.
- **No title bar.** `script.js`'s `initWindowDragging()` now recognises a
  second drag handle — `.aero-drag-region` — alongside `.title-bar`, so
  grabbing any non-control part of the shell moves the window. This is
  the one change to shared window logic; every other window still drags
  exactly as before.
- **Exit orb**: deliberately a real `<button>`, not part of the static
  SVG — if the gel material lived in the SVG, the hover-wobble/press
  animations would animate an invisible hit-box while the visible red
  ball stayed frozen. The button carries the gel gradient itself; the SVG
  only draws the ambient shadow beneath it.
- **The wheel is a real rotary dial**, not a static ring of icons: drag it
  or scroll over it and `.gtpaint-wheel-ring` physically rotates
  (Pointer Events, so mouse/touch/pen all work), snapping to the nearest
  of the 8 classic tools on release and calling that tool's existing
  button `.click()` — so turning the dial runs through the exact same
  `setTool()` path a direct click always has. Clicking a rim icon directly
  still works too, and also spins the ring to bring it to the 12 o'clock
  notch.
- **Tools panel**: colour/brush/text readout + the full secondary deck
  (mirror, rainbow, background, fill/undo/redo/clear/download, zoom,
  stamp/eyedropper/line/rect/ellipse) live inside the panel body's safe
  interior, gel-styled. I did *not* implement literal curve-following
  (`offset-path`) for these ~25 controls — with this many elements,
  reliably flowing every one of them along the bezier path risked
  fragility for a fairly subtle payoff; they're gel-styled and contained
  within the organic shape, just laid out in flex rows rather than
  strictly on the curve. Flagging this as a scope call, not an oversight,
  in case it matters more than I judged.

**Bugs I actually caught while building this** (not assumed away):
1. The wheel-button radial placement initially translated buttons toward
   3 o'clock (`translate(96px)`, straight horizontal) instead of 12
   o'clock — fixed to `translate(0, -96px)` and re-derived the angle
   convention so drag/scroll math, the button's own `--r`, and the fixed
   notch marker all agree on "0deg = up."
2. `.gtpaint-wheel` and `.gtpaint-panel-content` both had `z-index: 2` and
   their bounding boxes genuinely overlap (wheel's bottom-left corner
   sits inside the panel's top-right corner) — with the panel later in
   DOM order it would have won that overlap and silently swallowed clicks
   meant for the wheel. Caught by checking `elementFromPoint` at the
   overlap coordinates, not by reading the CSS. Fixed by raising the
   wheel to `z-index: 4`.
3. `style.css`'s bare `#window-gtpaint` (ID selector) would have beaten
   `.window.aero-device-gadget` (two classes) on specificity regardless
   of load order, silently reverting the window back to 980×760. Fixed by
   scoping the override to `#window-gtpaint.aero-device-gadget`.

**Verified** (geometry/hit-testing/simulated interaction, precise
before/after values, not just "it didn't crash"): the window keeps its
1000:800 aspect ratio under the viewport's responsive clamp; the exit orb
and all 8 wheel buttons are the actual topmost element at their own
center point; a direct click on a rim icon both switches the tool and
snaps the ring to the exact expected rotation; a simulated drag from 12
o'clock to 3 o'clock rotates by exactly +90° and snaps to the
mathematically-correct tool; scroll-to-rotate steps one detent per tick
including wrap-around; a clean single-step drag on the shell background
moves the window with exact 1:1 pixel tracking; pencil still draws, undo
still reverts, and the Close confirm guard still fires. About and Contact
both re-checked as unaffected.

**What I could not verify — this is the important part**: none of this has
been looked at. I have no idea if the proportions match your sketch, if
the chrome gradient reads as chrome or as a grey stripe, if the glass
looks glossy or flat, if the wheel looks like a dial or a random ring of
circles. That's exactly the risk you called out — "flat vector
illustration instead of physical hardware" — and it's a visual judgment
I'm not able to make blind. This revision is a first pass for you to
open and react to, not a claim that it's iterated and polished.

### Revision 4 — materials & physicality pass

Shape/layout/functionality untouched, per your instruction — this was
purely rebuilding what every surface is *made of* and how it's *lit*.

- **One light source, upper-left, everywhere.** Formalised as two reusable
  SVG gradients — `gtConvexLight` (bright upper-left fading to dark
  lower-right, for anything that bulges out: shell body, bezel, raised
  wheel ring, dial face) and `gtConcaveShade` (the inverse — dark
  upper-left, bright lower-right, for anything recessed: the wheel's
  groove, the screen's rubber gasket, the deck panel). Every button's
  CSS box-shadow uses the matching 4-layer recipe (inset highlight
  upper-left + inset shadow lower-right for its own convex surface, outer
  dark upper-left + outer light lower-right for the dish it sits in).
- **Three materials only**, per your list: translucent blue polycarbonate
  (`gtPlastic`/`gtPlasticDial`, single hue sampled from `--xp-blue-light`/
  `--xp-blue-dark`, no more teal-to-blue wash), banded chrome (`gtChrome`
  — hard dark/white/mid/dark stops, not a soft blend, same band sequence
  reused on every chrome part: bezel, wheel rim, slider thumbs), and the
  red gel orb (untouched, you said it already worked). Every button in
  the deck and on the wheel switched from the inherited flat pink pill to
  this same blue plastic — that pink was leftover from GT Paint's
  pre-Phase-2 rainbow styling and was never actually addressed in the
  shape pass, which is why it still looked pasted-on.
- **Active/selected state** no longer swaps to gold/red — it's the same
  blue gel with a warm colour blended in (`color-mix` toward `--gold-mid`)
  plus an outer glow, so it reads as "lit from within," not "different
  material."
- **The wheel now has a housing**, not a floating disc: raised chrome rim
  (`gtConvexLight` overlay) → recessed dark groove (`gtConcaveShade`
  overlay) → the dial face sitting further down inside, with a blurred
  contact-shadow stroke right at the boundary where dial meets well.
- **Screen**: chrome bezel (banded, with the convex sheen) → dark rubber
  gasket ring → glass, with the diagonal sweep pulled back to a single
  restrained pass instead of a broad wash.
- **Contact shadows + details**: a seam line tracing just inside the
  panel's silhouette, two moulding screws near the seam, a 3×3 dot-matrix
  speaker grille tucked in the panel's bottom-left corner (away from every
  control), and the existing orb ambient shadow kept.

**Process note, stated plainly**: your instructions called for a minimum
of 3 self-screenshot-and-compare iterations before presenting. My
screenshot tooling was still down for this pass, so this is one careful,
comprehensive implementation reasoned through from the lighting rules
directly — not 3 rounds of me looking and refining. I verified everything
I *can* verify without eyes (no console errors, every gradient/filter/
clip-path def resolved and is referenced correctly, buttons compute to
the new blue gel not the old pink, drawing/undo/wheel-rotation all still
function). I have not seen this rendered. Your screenshot is the real
first look, and I'd expect at least one correction round once you have.

### Revision 5 — one border, hologram material, and the colour wheel

Your feedback after Revision 4 was that the "chrome + realism" direction
itself was wrong, not just its execution — the device should read as a
*glowing hologram mimic* of a handheld, not a photoreal object. This pass
supersedes Revision 4's chrome/recessed-housing decisions specifically;
the reusable convex-light gradient survives, banded chrome and the
recessed wheel well do not.

- **Single continuous border.** One `gtRim` gradient (a soft aqua-to-blue
  glass edge, not hard chrome bands) is now the *only* stroke used across
  the panel body, the screen, both wheel rims, the exit orb, and a new
  connector path bridging the orb to the screen's corner — so the whole
  assembly reads as one object with one edge, not separately-outlined
  shapes glued together.
- **Screen reshaped to match the canvas.** The screen rect is now
  644×414→**676×414** proportioned so its inner recess (648×392,
  ratio 1.653) closely matches the canvas's real 860:520 (1.653) — "Fit"
  zoom now fills the screen edge to edge instead of letterboxing.
- **Wheel housing removed.** The deep raised-rim → recessed-groove →
  dial-face construction from Revision 4 is gone; the SVG shell now draws
  only a thin rim-stroke circle per wheel, and the actual glossy dial
  floats on top as a CSS element with its own `z-index` — "the wheel
  should be above everything," not sandwiched between shell layers.
- **New colour wheel.** A second rotary dial next to the tool wheel: a
  rainbow `conic-gradient` ring the user drags or scrolls (same mechanic
  as the tool wheel — see `initGTPaintColourWheel()` in gtpaint.js),
  mapping rotation to hue via the existing `gtPaintHslToHex()`. The
  centre hub always mirrors `gtPaintColor` and opens the native colour
  input on click for full saturation/lightness control. Initialising the
  wheel derives its starting rotation from the *existing* selected colour
  (via a small `hexToHue()` reverse-mapping) rather than overwriting the
  default brush colour on load — an actual bug caught and fixed during
  this pass (the wheel was stomping the default pink to red on open).
- **Buttons sit directly on the shell.** `.gtpaint-deck` and
  `.gtpaint-readout` lost their independent background/border-radius/
  box-shadow panels entirely — controls now read as moulded into the
  device surface rather than floating on rounded rectangles. The readout
  keeps only a flat rule (no rounded corners) and is capped to a fixed
  width so it ends before the tool wheel instead of running underneath it.
- **Text/Brush mutual exclusivity.** The brush-size and text-size controls
  now occupy the same readout slot, toggled by `setTool()` — text size
  shows only when the Type tool is active, brush size otherwise, instead
  of both being visible and colliding with the wheel.
- **Real aspect-ratio bug found and fixed.** The window's `width`/`height`
  were both being clamped independently by the generic `.window`
  max-width/max-height rules (viewport-width-based and viewport-height-
  based respectively), which meant on a viewport whose aspect ratio
  didn't match 1000:800, the two axes shrank by different amounts and
  skewed the whole silhouette — breaking every percentage-based overlay
  position. Fixed by setting `height: auto` (so `aspect-ratio` derives it)
  and folding the viewport-height limit into the `width` formula itself
  (`min(1000px, 96vw, (100vh - 60px) × 1000/800)`), so the ratio holds no
  matter how the window ends up clamped.
- Dead SVG defs from the old chrome/housing construction
  (`gtChrome`, `gtPlasticDial`, `gtOrbGel`, `gtConcaveShade`) removed —
  none were referenced by any shape after the rewrite.

**Verified functionally** (screenshot tooling was unreliable again this
pass, though it did eventually render a clean, non-tiled screenshot
confirming the above): window aspect ratio holds at exactly 1000/800
regardless of viewport size; colour wheel drag/scroll updates
`gtPaintColor`, the native colour input, and the hub in sync; tool wheel
drag still correctly switches tools; the two wheels' rims overlap
slightly but the tool wheel (`z-index: 5`) always wins hit-testing over
the colour wheel (`z-index: 4`) in that overlap band; Text/Brush toggle
shows exactly one control at a time; draw → undo → redo round-trips
correctly on real pointer-event sequences; no console errors.

### Revision 6 — matched to the reference image exactly

This pass had a single source of truth: `gtpaint desgin ref/ChatGPT Image
Jul 3, 2026, 08_52_49 PM.png`. Before writing code, I audited every
visible difference element-by-element, then closed each in order.

- **Two materials, not one.** The shell used to be one flat saturated-
  blue gradient everywhere. Now it's a translucent blue **glass rim**
  (`gtPlastic`, brighter/more saturated than before) and a separate
  **frosted white/ice belly** (`gtFrostBelly`) where every control lives
  — the belly is a uniformly-inset copy of the panel silhouette (scaled
  ~9% around its centroid) drawn on top of the rim, so an even blue
  border shows all the way around. A small sparkle/water detail sits in
  the rim's lower-left curve.
- **Screen**: thickened from a 5px stroke to a real glass frame (inset
  35px/24px asymmetrically to keep the 860:520 canvas ratio intact —
  606×366 ≈ 1.656 vs. the canvas's 1.654), with a diagonal specular
  streak clipped to the frame band via an evenodd donut clip-path so it
  never crosses the drawing surface.
- **Tool wheel rebuilt from scratch**: chrome ring (`gtChromeRing`) with
  a green accent arc, 8 pie-slice wedges (`clip-path: polygon(...)`,
  each ±20° of a 45° slot so gaps reveal the chrome as seam lines) each
  holding an upright white SVG icon (counter-rotated against the wedge's
  own `--r` so icons never appear rotated), and a big glossy centre
  sphere that mirrors whichever wheel tool is active — `setTool()` now
  copies the active button's icon markup into the hub. The old recessed-
  housing construction and text labels (Pen/Ers/Spr...) are gone.
- **Colour picker pivoted from a rotating dial to a static ring** — the
  previous "rotate until the notch lines up" mechanic didn't match the
  reference's "click anywhere and that hue is picked" behaviour, so the
  ring no longer rotates at all; clicking or dragging computes the hue
  directly from the pointer's angle around the wheel's centre. The
  centre orb enlarged into a real glossy pearl sphere (`--gtpaint-hub-
  color` custom property layered under a fixed specular-highlight
  gradient, so the gloss survives whatever colour is selected), gained
  its own vertical-drag-for-lightness gesture, and double-click (not
  single-click) now opens the native colour input. The flat pink swatch
  in the readout is gone — the input still exists in the DOM (hidden,
  clipped) as the value store everything else reads, but there's no
  visible flat swatch anymore.
- **A real bug caught while wiring the new colour ring**: the ring's
  `pointerdown` handler called `setPointerCapture()` *before* computing
  the hue from the click position. `setPointerCapture` can throw
  (confirmed via a synthetic-pointer test), which silently aborted the
  rest of the handler — meaning a plain click without any drag would
  never actually pick a colour. Fixed by computing and applying the hue
  first, then attempting capture in a try/catch afterward (capture is
  only needed to keep tracking a drag that leaves the element's bounds;
  losing it isn't worth aborting the primary interaction). Applied the
  same defensive ordering to the orb's drag handler and retrofitted the
  original tool wheel's handler, which already had the right order but
  no try/catch.
- **Buttons**: same frosted-white material as the belly now (not blue),
  active state switched from gold to green (the reference's accent for
  active/positive), and Stamp/Drop/Line/Rect/Ellipse/Fill/Undo/Redo/
  Clear/Download all gained small inline-SVG icons alongside their
  labels. Mirror/Kaleidoscope/Rainbow stayed text-only, matching the
  reference.
- **A real bug found and fixed in the background swatches**: all six
  presets rendered as identical pink blobs. Root cause: aero.css's
  catch-all `.gtpaint-deck button { background: ... }` (specificity
  0,1,1 — one class, one element) was beating each swatch's own
  single-class colour rule in style.css like `.gtpaint-bg-candy-sky`
  (0,1,0) regardless of load order, since higher specificity wins
  independent of source order. Fixed with `.gtpaint-deck .gtpaint-bg-
  swatch.gtpaint-bg-white` style three-class overrides (0,3,0), and
  restyled them as small round gel orbs per the brief.
- **Sliders**: rebuilt as a light grooved track with tick marks (a
  `repeating-linear-gradient` layer) and a green fill bar that tracks the
  thumb, via a `--range-percent` custom property kept in sync from JS
  (`updateGTPaintRangeFill()`) on every brush-size/font-size/zoom input
  event, instead of a flat two-tone track that never reflected the value.
- **"GT Paint" script logo** added, moulded into the shell's lower-left
  corner as SVG `<text>` in a cursive font stack, low-opacity/tinted so
  it reads as engraved rather than pasted on.
- Also cleaned up dead SVG defs left over from Revision 5's removed
  chrome/housing construction (`gtOrbGel`, `gtPlasticDial`) and two
  genuinely stale CSS rules from the old wheel that would have broken
  wedge hover/active states (`translate(0,-96px)` transforms that no
  longer match the wedge's rotate-only positioning).

**Fully regression-tested** via real `MouseEvent`/`PointerEvent`
sequences with correct devicePixelRatio-aware pixel sampling (this
environment runs at 1.25 DPR, so `canvas.width` ≠ the 860 logical width —
sampling had to account for that, not just the CSS/zoom scale factor
already handled by `getCanvasPos`): all 7 brushes + eraser, mirror,
kaleidoscope, rainbow mode (verified 19 distinct colours across one
stroke), stamps, line/rect/ellipse shapes, eyedropper, zoom (slider and
Fit), undo/redo (full round-trip back to the exact original state),
download (produces a valid PNG data URL), and the colour ring/orb's hue
and lightness gestures all confirmed working via pixel-level checks —
plus Contact/Music/About still open normally and no console errors.

### Contact hero demo — Stage 1 gel-content pass

Before rolling the Contact aesthetic out to the other content windows
(Exhibitions, Freelance, Press, About, Internet), two things needed
fixing first. First attempt at both landed wrong and was corrected on
feedback — worth recording what actually shipped:

- **Border/halo**: the first pass changed the border's own colour to a
  clearer blue. That wasn't the ask — the border colour stays exactly
  as it was (`color-mix(white 30%, aero-aqua)`); what was actually
  wanted was an *additional* glowing rectangle traced right at the
  window's silhouette, layered on top of the existing soft ambient
  glows rather than replacing any of their colours. Added as one more
  `box-shadow` entry — `0 0 10px 2px color-mix(transparent 35%,
  xp-blue-light)` — a small-blur, positive-spread halo ring that reads
  as a deliberate line, distinct from the wide diffuse blurs already
  there (confirmed via computed style: this exact `xp-blue-light` layer
  is present alongside all the original glow colours, unchanged).
- **Content bubbles**: the first pass merged the whole list into one
  big shared gel panel. Also wrong — each line needed to stay its own
  separate bubble, just built with real 3D gel dimensionality instead
  of being a flat opaque chip. Rebuilt `.aero-content-bubble` as a
  per-line pill using the *exact same material recipe* as
  `#start-button.aero-orb`: three-stop gradient for volume, bright
  inset rim along the top, darker inset shadow along the bottom, an
  outer drop shadow for lift, and the same glossy highlight-bulge
  `::before`. Kept paler than the start orb's saturated green (body
  copy needs to stay legible, a two-word button label doesn't) —
  contrast re-verified at ~4.99:1 against the gradient's darkest stop,
  still past WCAG AA.

`.aero-content-bubble` is deliberately generic — any window's list can
adopt it once this look is approved, which is the actual point of
doing this as its own stage before touching Exhibitions/Freelance/etc.

### Stage 2 — aero-demo rolled out to the content-window family

Extended the (now-corrected) Contact aesthetic to Exhibitions,
Freelance, About Me, Press, Internet, and the PDF viewer. Birdsweeper/
Tuna/Video/Music are staying on their own look for now (each gets its
own device treatment later, same path GT Paint/Bird Art/the video
player already took); those four were explicitly excluded and verified
untouched.

- All `#window-contact.aero-demo` selectors generalized to
  `.window.aero-demo` — the glass chrome, halo, dew droplet, and link
  colour rules are no longer ID-scoped, so any window can opt in by
  adding the class.
- `.pdf-list` (Exhibitions/Freelance's content container — no separate
  `.window-content` wrapper) is handled alongside `.window-content`
  everywhere so both markup patterns get the same treatment.
- **New: `.aero-content-card`.** `.aero-content-bubble`'s pill shape
  clips awkwardly around wrapped multi-line text, so About Me's four
  biography paragraphs use a block-shaped sibling with the same gel
  recipe (gradient, top highlight, bottom inset shadow) instead of a
  capsule. Contrast checked separately (~5.49:1).
- **A real specificity bug caught while wiring this up**: the legacy
  `.pdf-list a, #video-list a, .internet-link, #window-press a` rule in
  style.css would have silently overridden `.aero-content-bubble`'s own
  padding/border-radius/background on every PDF/Press/Internet link,
  because a class+type selector (or an ID selector, for `#window-press
  a`) both beat a single-class selector regardless of load order. Fixed
  by splitting `#video-list a` out into its own untouched rule (the one
  consumer still meant to keep the old flat look) and retiring
  `.internet-link` entirely now that Press/Internet links carry
  `.aero-content-bubble` directly — script.js's `loadInternetLinks()`/
  `loadPressLinks()`/`listPDFs()` all updated to emit that class.
- Also swapped the About photo's glow from a leftover pink
  (`rgba(255,180,240,...)`) to `--aero-aqua`, so it doesn't clash with
  the rest of the now-blue-glass family.

Verified: PDF list (12 Exhibitions / 6 Freelance entries), Press (9),
and Internet (13) links all render as proper gel pills with correct
computed padding/radius/gradient (not clobbered by the old rules);
About's 4 paragraphs render as cards; the PDF viewer carries the glass
chrome around its iframe; all four excluded windows confirmed to still
lack the `aero-demo` class and `#video-list` kept its original flat
style; no console errors; GT Paint/other windows unaffected.

### Real bug: aero-demo windows weren't actually positioned

Reported symptom: opening several windows in a row made each one land
further down the page than the last, nearly unreachable; the PDF
viewer opened almost entirely off-screen; dragging any of these
windows moved them completely out of sync with the cursor.

Root cause: `.window.aero-demo` set `position: relative`, left over
from the very first Contact-only hero demo (needed, at the time, only
so its own `::before`/`::after` decorations had a containing block —
`position: absolute` would have provided that identical containing
block just as well, so this was never actually necessary). Being two
classes, it beat the base `.window { position: absolute; }` rule
regardless of load order. Every window carrying `aero-demo` was
therefore laid out in normal document flow instead of floating freely:
each one occupied real space below the last (compounding the further
down the page a window opened), and both `centerWindow()`'s left/top
math and the drag handler's cursor-offset math are written assuming
absolute (viewport-relative-page-coordinate) positioning — under
relative positioning those same numbers mean "offset from flow
position" instead, which is why dragging sent windows somewhere the
cursor wasn't. This bug existed from Phase 0 onward; it only became
obvious once Stage 2 gave six more windows the same broken rule to
stack against.

Fix: dropped `position: relative` from `.window.aero-demo` entirely —
the base `.window` rule's `position: absolute` already provides a
valid containing block for the pseudo-elements. Verified by opening
five aero-demo windows in sequence (all now land at the same sane
centred position instead of cascading downward) and by simulating a
title-bar drag (mouse moves (60, 40) → window moves exactly (60, 40),
previously wildly mismatched).

While in there, also hardened `initWindowDragging()`: grabbing a window
while its `aeroBuoyantOpen` opening animation is still mid-flight used
to only clear the inline `transform`, which a still-running CSS
animation can silently re-override every frame. The mousedown handler
now also removes the `window-opening` class itself before computing
the drag offset.

## Phase 2, device 3 — "The Jukebox" (built)

Rebuilt from scratch from the user's hand-drawn sketch (`music player
design ref/design 1.png`) plus WMP/Media Center construction references.
The original v1 used a Spotify iFrame embed for the track list; that was
torn out entirely because a cross-origin Spotify embed can't be
audio-analysed, and the whole point of the rebuild was a visualizer that
reacts to the real audio. Same hologram glass language as GT Paint and
the Video Player — reuses their `gtPlastic`/`gtRim`/`gtConvexLight`/
`gtNeonGlow`/`gtScreenGlass`/`gtChromeRing`/`gtSoftBlur`/
`gtShellDropShadow` defs by id.

- **Shell**: one continuous moulded silhouette (viewBox 900×800) — a
  large-radius-top pill (the screen zone) flowing into a narrower,
  left-inset tracklist tray, matching the sketch's proportions. A red
  gel exit orb (same component as GT Paint's) sits seated on the
  top-right rim. The transport pod is a separate chrome-ring circle
  overlapping the pill/tray's bottom-right corner. First pass had the
  pod oversized (hanging well past the tray's bottom edge); caught it by
  screenshotting against the sketch and shrank/repositioned it
  (r170→150, recentered) so its bottom lands level with the tray, per
  the checkpoint process the user asked for.
- **Native `<audio>` through Web Audio**: `music/tracks.json` manifest
  (title/file/album/cover/duration/spotifyUrl/bandcampUrl) drives a
  single `<audio>` element routed `createMediaElementSource → AnalyserNode
  → destination`, so playback is audible AND analysable. Verified live
  with the user's real WAV files (10 tracks, `music/tracks/`, durations
  read exactly from each file's RIFF header via a PowerShell script since
  no ffprobe was available) — `getByteFrequencyData` returns real,
  varying, non-zero bins while playing.
- **Visualizer — feedback buffer, not bars**: two ping-pong offscreen
  canvases; each frame draws the previous frame back onto the buffer
  scaled/rotated/colour-shifted, then paints new audio-driven shapes on
  top. Bass drives the zoom pulse, mids drive rotation speed, highs
  drive sparkle/detail, onsets (spectral-flux-style bass-peak detection)
  trigger bursts. Three modes (Ambient Swirl / Tunnel / Bloom) with a
  700ms crossfade blend between them, cycled via a small screen button
  or a click anywhere on the canvas. Idle state synthesizes a slow sine-
  driven bass/mid/high so the screen breathes gently instead of ever
  going black. Palette colors are resolved from the OS's own aurora CSS
  variables at runtime (a hidden probe element + `getComputedStyle`, so
  `color-mix()` custom properties resolve to real colors canvas can
  use), not hardcoded hex.
  - **Real bug caught in testing, not just a manual-test artifact**: the
    first version used a persistent >1 per-frame scale (e.g. `1.018 +
    bass*0.045`). That compounds every single frame at 60fps — over even
    a few seconds of real playback the accumulated zoom is astronomical
    and the buffer washes out to a flat color. Confirmed by manually
    stepping the render loop thousands of times (this sandbox's preview
    tab has `document.hidden` stuck true, which suspends
    `requestAnimationFrame`, so real-time playback couldn't be watched
    live — stepping the function directly was the way to simulate
    minutes of runtime and catch this). Fixed by making zoom a
    self-correcting oscillation around 1.0 (`sin()`-driven "breathe")
    with a zero-centered bass term, so it can't run away regardless of
    session length; re-verified over a simulated 3000-frame run with
    varying, non-flat output throughout.
  - Respects `prefers-reduced-motion` (static two-color gradient, loop
    doesn't reschedule itself) and pauses/resumes via
    `visibilitychange` and window open/close.
- **Tracklist tray**: real rows built from the manifest (number/title/
  duration), click to play, now-playing row gets the green accent glow
  and an animated 3-bar EQ glyph. Small Spotify/Bandcamp gel-icon links
  in the tray header open in a new tab.
- **Transport pod — fixed, not a rotating wheel** (explicit correction
  from the user against reusing GT Paint's wheel mechanic as-is): a
  central glossy play/pause sphere, prev/next chrome buttons flanking
  it, a drag-anywhere conic-gradient volume ring around the rim (pointer
  events, so mouse and touch both work — verified a synthetic pointer
  drag to the "3 o'clock" position sets volume to exactly 0.25), and
  three small gel dots for shuffle/repeat/mute. The construction
  technique (rim → recessed well → controls) borrows from GT Paint's old
  wheel housing, rendered in the current transparent hologram material
  rather than solid chrome.
- **Seek bar**: grooved chrome channel below the screen, green fill via
  a CSS custom property driven by `timeupdate`, glossy thumb, time
  readouts both ends.
- **Full functionality checklist wired and verified**: play/pause (verified
  via keyboard Space, confirmed via the `pause`/`play` events rather than
  hand-rolled state), prev/next (verified sequential AND shuffle-random
  advance), auto-advance on `ended` respecting shuffle/repeat, a
  lightweight next-track preload (a second hidden `Audio()` warming the
  browser cache), keyboard Space/←/→ scoped to only fire when
  `window-music` is both visible and the topmost z-index window (checked
  against the shared global `topZ` from `script.js` — verified it does
  *not* fire when another window is brought to front), and Media Session
  API metadata + action handlers (verified `navigator.mediaSession.metadata`
  populates and `mediaSession` is available for OS media keys/lock
  screen).
- **Known environment-only limitation, not a code bug**: dragging the
  seek bar didn't visibly relocate playback in this local preview — a
  raw `fetch` with a `Range` header against one of the large WAV files
  hung, and `audio.seekable.end(0)` reported `0`, indicating the local
  static preview server isn't honoring HTTP Range requests for these
  (14–80MB) files. Standard static hosts (Firebase Hosting, Netlify,
  nginx, etc. — wherever this actually deploys) serve Range requests
  correctly, so real deployment should seek fine; flagging this
  honestly rather than claiming it as fully verified.

Verified live end-to-end: real WAV playback with real frequency data,
all three visualizer modes rendering distinct, non-flat, audio-reactive
output (including after the zoom-runaway fix), tracklist click-to-play,
prev/next/shuffle/repeat/mute all toggling correctly, volume-ring drag
math exact, keyboard shortcuts correctly scoped to window focus, Media
Session metadata present, and no regressions in GT Paint or the Video
Player after all of this.

### Post-launch fixes — shared defs, tracklist overlap, unifying case

Three issues reported after using the Jukebox for real:

1. **GT Paint's and the Jukebox's shells only rendered when GT Paint's own
   window was open.** Root cause: the shared material defs (`gtPlastic`,
   `gtRim`, `gtNeonGlow`, etc.) lived inside GT Paint's own `<svg>`, and a
   gradient/filter defined inside an SVG that has `display:none` stops
   working as a paint server for *any* element referencing it via
   `url(#id)`, anywhere in the document — not just within that SVG. Fixed
   by hoisting the entire `<defs>` block into a standalone, always-present
   `<svg width="0" height="0" style="position:absolute">` right after
   `<body>`, so nothing depends on which window happens to be open.
   Verified: opened Video Player and the Jukebox with GT Paint fully
   closed — both render correctly now, and GT Paint itself is unchanged.
2. **The tracklist tray sat underneath the transport pod**, hiding the
   duration column and blocking clicks on the last ~80px of each row (pod
   spans x:540–840, tray ran to x:620). Narrowed the tray (both the CSS
   overlay and the decorative SVG shape) to stop at x=520. Verified via
   `getBoundingClientRect` that the two no longer intersect.
3. **GT Paint and the Jukebox read as several floating widgets rather
   than one object** (screen, tool panel/tracklist, wheel(s) all had
   visible gaps of transparent desktop between them). Per the user's
   explicit direction — inspired by a rough ChatGPT experiment they'd
   tried, used only as a loose reference, not copied — added ONE new
   backing shape per shell (`.gt-shell-case`, a big rounded rect: GT Paint
   x:4–918/y:0–800 rx=90; Jukebox x:8–892/y:0–800 rx=90) as the first,
   bottommost element inside each shell's existing `<g>`, using the exact
   same `gtPlastic`/`gtRim`/`gtNeonGlow`/`gtConvexLight` materials.
   Nothing else in either shell was touched — the case just fills the
   gaps between the pre-existing pieces so the whole assembly reads as
   one enclosed gadget. Verified visually on both devices; Video Player
   (already a single rounded rect) intentionally left untouched.

### Round 2 — case must follow contours, wheel/pod overlaps, tray alignment

The plain rounded-rect case from round 1 was rejected: "not just a
rectangle... it follow[s] the shape of the internal windows." Four
concrete fixes:

1. **Tracklist frame misaligned with its own content.** The SVG tray
   shape's rounded corners bulged 30 units past the actual CSS content
   box on the right/bottom (hand-drawn path vs. percentage-based overlay
   never matched). Replaced the hand-drawn path with a plain `<rect>`
   using the *exact same* x/y/width/height as `.jukebox-tracklist-wrap`
   — they can't drift apart again since there's only one set of numbers
   to maintain.
2. **Transport pod overlapped the seek bar/timecode.** Pod
   (cx=690,cy=540,r=150) reached up to y=390, well above the seek row
   (y:411–443). Moved it right and down (cx=705,cy=605) — the minimum
   downward shift that actually clears the seek row, confirmed via
   `getBoundingClientRect` overlap checks (both tray/pod and seek/pod
   now `false`).
3. **GT Paint's tool wheel and colour wheel overlapped too much** (111
   units with the screen, 60 between the two wheels). The math doesn't
   allow shrinking that to "tiny" through repositioning alone — the two
   wheels at their original radii (145, 105) literally don't fit below
   the screen with small overlaps and still land inside the panel's
   height. Trimmed both radii modestly (145→125, 105→92, ~14–16%) and
   moved them down (tool wheel cy 470→526, colour wheel cy 660→703),
   landing on 35 and 40 units of overlap respectively — both roughly
   15–20% of the relevant diameter, a real reduction from 38–44%
   before. Also widened the panel body's right edge (858→875) and
   bottom-right corner (778→800) so it still properly "flows under"
   the wheels at their new position, exactly like it did at the old one
   — otherwise the colour wheel would've poked outside the panel's own
   silhouette.
4. **The case itself now genuinely follows the internal shapes**, not a
   bounding rectangle. New shared filter `gtCaseOutline` (in the global
   defs SVG): draws a hidden copy of the real silhouette shapes (screen
   rect + panel path + both wheel circles, or pill path + tray rect +
   pod circle) into a `<g>`, `feMorphology` dilates their alpha
   outward, `feFlood`+`feComposite` turns the dilated region into a
   translucent fill plus a separate thin glowing rim (outer dilate minus
   inner dilate), and `feMerge` combines them — the *source* shapes
   never appear in the final output, only the derived contour. This
   means the case automatically hugs whatever the real geometry is
   (visible as a distinct bulge around the wheels/pod rather than a
   uniform rounded-rect edge) and stays correct if that geometry ever
   moves again, without hand-tuning a separate outline path.

Verified: tray/pod and seek/pod no longer overlap (bounding-rect check),
GT Paint's full tool surface still present and working (wheel wedges,
shape buttons, mirror/background/zoom controls, colour wheel), Jukebox
playback/tracklist still work post-reposition, Video Player unaffected,
no console errors.

### Round 3 — glow clipping at the window edge, and pushing the glow

Two more fixes:

1. **Glow/case clipped at the window's edge.** Every glow filter
   (`gtNeonGlow`, `gtShellDropShadow`, `gtCaseOutline`'s rim) already
   declared enough filter-region padding to render outside the shapes'
   own bounds, but `.gt-shell` (the `<svg>` element itself) had no
   `overflow` rule — and `<svg>` elements clip their rendered content to
   their own box by default (UA stylesheet `overflow: hidden`),
   independent of whatever the parent `.window` allows. That's the
   "invisible barrier": the window container permitted overflow, the SVG
   inside it didn't. Added `overflow: visible` to `.gt-shell`. Fixes
   this for GT Paint, the Video Player, and the Jukebox at once since
   they all use the same class.
2. **Pushed the glow** for a more "heavenly app" feel without going
   unreadable: `gtNeonGlow` went from a 2-pass blur (7/16) to a 3-pass
   blur (11/26/42) for a softer, more voluminous halo, filter region
   widened to match (280% vs 240%). `gtShellDropShadow`'s blur/opacity
   bumped slightly (16→20, 0.45→0.48). `gtCaseOutline`'s rim glow blur
   went 5→11 and its dilate radii widened a touch (16→18, 22→28) so the
   rim itself is a bit thicker before the blur softens it. The exit
   orb's box-shadow glow was pushed too (18px/6px → 30px/14px) since
   it's a focal point on every device.

Verified: no clipping at any window edge on GT Paint, Video Player, or
the Jukebox; text and controls stay fully readable at the pushed glow
level; Jukebox playback and GT Paint's tool surface still work; no
console errors.

### Round 4 — glow was pushed too far, not too bright

Round 3's push was a misread: the user wanted the glow *brighter and
more ethereal right at the shell edge*, not spread further outward —
the wider reach (a 3-pass blur up to stdDeviation 42, wider dilate
radii, thicker rim blur) also produced visible banding across the whole
screen once `overflow: visible` actually let it render unclipped (large
soft gradients stepping visibly in 8-bit colour). Fixed by pulling the
*reach* back down while pushing *brightness* instead:

- `gtNeonGlow`: back to a tight 2-pass blur (8/16, close to the
  original 7/16) with the filter region back to -50%/200%. Brightness
  comes from a `feColorMatrix` alpha multiply (×1.6) on the wider blur
  pass instead of a third, much-larger blur layer — more luminous at
  the same distance, not spread further.
- `gtShellDropShadow`: reverted to its original values (16/0.45) — it's
  an ambient drop shadow, not the ethereal glow the user meant.
- `gtCaseOutline`: dilate radii pulled back near original (16/23 vs.
  16/22 originally), rim blur back down (11→6), but the rim and fill
  flood-colors pushed brighter (white 78% vs. 60% originally, aqua fill
  74% vs. 78% transparent) for more presence without more reach.
- Exit orb glow: box-shadow pulled back from 30px/14px to 20px/8px
  (between the original 18px/6px and the overshoot), opacity bumped
  slightly for brightness instead.

Verified: no banding on GT Paint, the Jukebox, or the Video Player; glow
now reads as a tight, bright halo close to the shell edge rather than a
wash across the screen; playback and tool surfaces still functional; no
console errors.

## Lens flares (built)

Ambient decoration using the user's own PNG pack (`lens flares/
CHROMEKIT_Lensflare_1.png`–`_10.png`, 844×844 each). New standalone
module `lens-flares.js`: `spawnLensFlares(win)` is called from
`openWindow()` in `script.js` every time any window opens, and:

- clears any flares left over from that window's previous open (so
  reopening doesn't accumulate — count stays capped at 1-3, verified by
  reopening a window 5 times in a row and checking the DOM count),
- picks 1-3 of the 10 PNGs at random (no duplicates within one spawn),
- scatters them around the window's perimeter, biased toward the
  corners rather than uniform along each edge (`local = local*local*2`
  / mirrored) — corners are reliably glass/chrome (exit orbs, wheel
  housings, pod rims) on every device, whereas an edge's midpoint can
  land deep inside a plain white content area (GT Paint's canvas) where
  a bright flare core is invisible against a matching white background,
  confirmed by testing the same flare at the same size/opacity over
  glass (clearly visible) vs. over the white canvas (invisible — same
  colour as the core, not a bug, just contrast),
- shrinks them down small (44-104px, from a native 844px), and fades
  each in with a slow opacity "breathing" drift afterward,
- keeps every flare `pointer-events: none` at a high z-index, so they
  can never block a click even sitting directly on a button — verified
  by clicking a tracklist row through a flare and confirming it still
  played the track.

Blend mode is `normal`, not `screen` — these PNGs are mostly-transparent
with the flare's actual colour/brightness baked into the alpha (center
pixel sampled at fully-opaque white), and `screen` blending against this
theme's light sky/glass washed them out to nearly nothing. Respects
`prefers-reduced-motion` (static class, no fade-in/drift animation).

Verified across GT Paint, the Jukebox, the Video Player, and a plain
content window (Contact) — flares render, read clearly against glass/
chrome backgrounds, don't interfere with clicks, and don't accumulate on
repeated opens. No console errors.

## Phase 2, device 2 rebuilt — Video Player (video sibling of the Jukebox)

Full overhaul from `video player design/design 1.png`: a wide screen
zone flowing into three lobes below it (left: skip-back/play/rewind,
centre: a built-in video list, right: fast-forward/pause/skip-forward),
a vertical volume fader along the screen's right edge, a timecode seek
bar underneath, and a full-screen toggle — same construction technique
as the Jukebox (continuous moulded shell + `gtCaseOutline` unifying case
+ lens flares), viewBox 1000×850.

- **The old standalone `#window-video` list-only window is gone.** The
  desktop icon and Start-menu "Video" entry now open `video-viewer`
  directly (`icons` array + the `<li>` in index.html), matching how
  Music points at the Jukebox. `listVideos()`/`openVideoPlayer()`/
  `initVideoPlayerControls()` were deleted from `script.js` entirely —
  replaced by a new standalone `videoplayer.js` (same
  `initVideoPlayer()`/`pauseVideoPlayer()` convention as
  `musicplayer.js`), plus the now-dead `#video-list a`/`#video-frame`
  rules removed from `style.css`.
- **Video list** built from the existing `videos/index.json` (6 Benee
  Coachella clips), titles derived from the filename. Click a row to
  play; the now-playing row glows green with the same animated 3-bar EQ
  glyph the Jukebox uses (works fine as a generic "now playing" glyph,
  nothing audio-specific about it).
- **Transport lobes are FIXED clusters** (same "no rotation" correction
  the user gave for the Jukebox's pod applies here too): each lobe is a
  big centre button (Play on the left, Pause on the right) with two
  smaller flanking buttons (skip-back/rewind left, fast-forward/skip-
  forward right) — literally two separate Play and Pause buttons per
  the sketch's own labelling, not one toggle button, with an
  `.videoplayer-active` glow marking whichever matches the current
  `paused` state.
- **Vertical volume fader**: `-webkit-appearance: slider-vertical` on a
  native `<input type=range>`, styled with the same green-fill-groove-
  plus-glossy-thumb recipe as every other slider in the app, seated in a
  `gtChromeRing` groove drawn in the SVG shell.
- **Known environment-only limitation, not a code bug** (same root
  cause already documented for the Jukebox's seek bar): scrubbing/
  rewind/fast-forward didn't move `currentTime` in this local preview —
  confirmed by setting `video.currentTime` directly and finding it snaps
  back to 0, with `video.seekable.end(0)` reporting `0`. The local
  static server doesn't serve HTTP Range requests for these files;
  standard hosting does. Skip-back/skip-forward (loading a whole new
  file, not seeking within one) work fine, confirmed live.

Verified live: real video frames decode and render (not just black),
skip-back/forward advance the list and highlight correctly, volume
slider updates `video.volume` and its fill precisely, Space toggles
play/pause and is correctly scoped to only fire when this window is
focused (confirmed silent when GT Paint was brought to front instead),
auto-advance on `ended` (these clips are short, ~6-10s, so this was
seen firing organically during testing), the external case + lens
flares both apply exactly like GT Paint/the Jukebox, and no regressions
in either of those two devices.

## Phase 2, device rebuilt — Tuna (snake) — handheld sibling

Full overhaul from `tuna design/core design.png`: a Game Boy-style
handheld — a screen zone (bezel + speaker grille dots + exit orb)
flowing into a control body below it (New Game gel button, Leaderboard
gel button, a 4-button D-pad), viewBox 900×850. Same construction
technique as GT Paint/the Jukebox/the Video Player: `gtPlastic`/`gtRim`/
`gtNeonGlow`/`gtScreenGlass`/`gtChromeRing` materials, the same red exit
orb, `gtCaseOutline` unifying case, lens flares (automatic via the
existing `openWindow()` hook, since Tuna already opened through that
path).

- **Controls: both arrow keys and the D-pad work**, per the user's
  explicit ask (arrow keys "the smarter play style," but click must
  work too). Refactored the direction-setting logic that used to be
  inline inside the keyboard handler into a shared `applyDirection()`
  closure function; a module-level `tunaSetDirection` reference gets
  reassigned to it every `initTunaGame()` call, and the D-pad's 4
  buttons (wired once, guarded by `tunaControlsInitialized` — they live
  outside `#tuna-grid` so they aren't recreated every game restart) just
  call through it. Keyboard input is now also scoped to window focus
  (`isTunaFocused()`, same `topZ` check as every other device) —
  previously arrow keys worked regardless of which window was focused.
- **The game grid is now responsive** (`grid-template-columns: repeat(20,
  1fr)` instead of fixed 20px cells / a fixed 420px box) so it fills the
  new screen bezel at whatever size the aspect-ratio-locked window
  scales to. Snake/food game logic (the 1D array + `gridSize=20` wall
  math) is completely unchanged.
- **Added a live score readout** on the screen (wasn't there before —
  score only ever showed up after dying).
- **New Game and Leaderboard are now real buttons on the shell**, not
  just implicit behaviors. Leaderboard specifically is a NEW standalone
  view (`showTunaLeaderboardPanel()`) — previously the only way to see
  scores was inside the post-death submission popup; now it's available
  any time via its own gel button.
- **The leaderboard/game-over popup was restyled to match the hologram
  aesthetic** (translucent aqua glass, glowing edge, gel buttons) instead
  of the old flat candy-pink box — but the actual Firebase read/write
  logic (`loadScoresFromFirebase`, `saveScoreToFirebase`,
  `submitTunaScore`) was **not touched at all**, only the
  container/row markup and CSS classes around it. `renderTunaLeaderboard`
  keeps the exact same data extraction (safe name/score sanitising, the
  same `birdIcons` rank icons) — it just builds styled `<span>`s instead
  of inline-styled `<div>`s, plus a "no scores yet" empty state that
  didn't exist before.

Verified live: real leaderboard entries loaded and rendered correctly
throughout testing (visible actual player names/scores, not placeholder
data) — nothing was cleared or reset. D-pad clicks and arrow keys both
steer the snake and were confirmed via a logged move-by-move trace
(a "crash" during one early test turned out to be correct wall-collision
behaviour from a test that gave the snake no steering input at all, not
a bug). New Game resets cleanly with no leftover interval/listener
duplication even after repeatedly closing and reopening the window.
"Try Again" clears the popup and restarts. No regressions in GT Paint,
the Jukebox, or the Video Player; no console errors. Did not exercise
the actual score-submission write path during testing to avoid writing
throwaway test data into the real leaderboard.

### Round 2 — size/off-screen, warped screen, messy popup, undraggable popup

Four concrete bugs reported after using the rebuild:

1. **Window too big, sitting off-screen in parts.** The original geometry
   (viewBox 900×950) was both larger in absolute area and proportionally
   taller than any sibling device. Rebuilt the whole shell around a
   smaller, more compact viewBox (700×900) and tightened the CSS clamp
   (`min(700px, 85vw, calc((100vh-60px)*700/900))` vs. the old
   900px/90vw).
2. **The game screen was warped.** The 20×20 snake grid was being
   stretched into a 720×390 *wide* rectangle, distorting every cell into
   a non-square shape. Per the user's explicit either/or ("redesign the
   game to fit or design the console to fit the original game shape"),
   went with reshaping the console — the screen bezel and inner canvas
   are now a true square (560×560 bezel, 520×520 canvas) so `#tuna-grid`
   renders proper square cells. This was the lower-risk option: the
   snake's movement math (`gridSize`-based wall/wrap detection) never
   needed to change, so nothing about the tested game logic was touched.
3. **The leaderboard/game-over popup looked messy.** Root cause: the
   popup's background was as translucent as the rest of the aero-glass
   system (55–84% transparent), and it sits directly over the desktop's
   ambient `#spirit-ghost` companion (z-index 9998, just one below the
   popup's 9999) — the ghost was bleeding through the glass visibly
   enough to look like an oversized bird sitting on top of the
   leaderboard rows. Made the popup meaningfully more opaque (12–30%
   transparent, was 55–84%) and increased the backdrop-blur, widened it
   360px→400px, added a bottom mask-image fade on the scrollable list so
   the 10-entries-in-a-216px-box cutoff reads as "scroll for more"
   instead of a clipping glitch, and added `user-select:none` to the
   popup's chrome text.
4. **The popup couldn't be dragged.** It never had a `.title-bar` or
   `.aero-drag-region` class, and the site's one generic drag system
   (`initWindowDragging` in script.js) only starts a drag from an
   element matching one of those two selectors — so it silently never
   engaged. Added `.aero-drag-region` to `.tuna-popup-content`; the
   existing drag code already has a dedicated branch for transform-
   centered fixed-position popups (converts to absolute pixel
   positioning on first drag), so no other change was needed. Buttons/
   input inside stay clickable as normal since the drag handler already
   excludes `button, input, canvas, ... , a` from starting a drag.

Deferred to a later pass per the user's own sequencing ("first lets sort
the faults and then look at a different aesthetic for the game itself"):
restyling the snake/food/ocean-background visuals themselves to match
the hologram aesthetic more closely — not touched in this round.

Verified: window fits comfortably and renders correctly at normal
viewport sizes; game grid cells are true squares now; D-pad steering
still works without crashing; popup background is now clearly legible
against the desktop (ghost bleed-through fixed); dragging the popup by
50,10px moved it by exactly that delta (confirmed via
`getBoundingClientRect` before/after); input/buttons inside the popup
still work normally (didn't trigger a drag); no regressions in GT Paint,
the Jukebox, or the Video Player; no console errors.

### Round 3 — popup still messy: wrong centering method, corner math, flex overflow

Two more reports after round 2 ("leaderboard list goes off the page",
"exit sign randomly placed, not top-right") traced back to one real root
cause plus one leftover math error:

1. **The actual bug: `createTunaPopupShell()` called `centerWindow(popup)`,
   but `.tuna-popup` centers itself via `position:fixed; top:50%;
   left:50%; transform:translate(-50%,-50%)` — a completely different
   mechanism.** `centerWindow()` sets inline `left`/`top` in px assuming
   normal absolute-position centering; those inline styles beat the
   CSS rule's `top/left:50%` (inline always wins), and then the
   *still-active* `transform:translate(-50%,-50%)` further shifted the
   wrongly-placed box by half its own size. Net effect: the popup could
   render mostly off-screen (confirmed via `getBoundingClientRect()`
   showing negative x/y) — that's what "goes off the page" actually
   was, not a leaderboard-specific bug. This bug likely predates this
   whole rebuild (the original code had the exact same CSS-centering-vs-
   `centerWindow()` mismatch) but stayed hidden because the old, smaller
   popup width rarely hit the edge cases that exposed it. Fix: removed
   the `centerWindow(popup)` call entirely — the CSS already centers it
   correctly on its own, confirmed by checking the popup's centre
   against the viewport's centre after the open animation settles.
2. **The exit orb math was stale.** It was hand-computed for the
   popup's *previous* 360px width (`left: 320px` = 360-40). Round 2
   widened the popup to 400px without updating this, so the orb sat
   ~40px left of the actual corner — hence "randomly placed." Replaced
   the fixed value with `left: calc(100% - 20px)`, which centres the
   40px orb exactly on the top-right corner regardless of whatever
   width `.tuna-popup` has now or in the future.
3. **Long leaderboard names could overflow the panel horizontally.**
   `.tuna-leaderboard-name` had `flex:1 1 auto` with ellipsis truncation,
   but flex items default to `min-width:auto`, which refuses to shrink
   below the text's own natural width no matter what `flex-shrink` says
   — so a long name (e.g. "2023 Denver Nuggets") could still push the
   row wider than the panel since nothing was clipping it. Added
   `min-width:0` (lets the shrink+ellipsis actually engage) and
   `overflow-x:hidden` plus `max-height:82vh; overflow-y:auto` on
   `.tuna-popup-content` as a belt-and-suspenders safety net against any
   remaining horizontal overflow and against the popup ever being taller
   than the viewport.

Verified: popup's centre matches the viewport's centre exactly once the
open animation settles (checked via `getBoundingClientRect()`, both the
game-over and standalone leaderboard variants); exit orb sits correctly
on the top-right corner; dragging still moves the popup by the exact
mouse delta from its now-correct starting position; no regressions in
GT Paint, the Jukebox, or the Video Player; no console errors.

### Round 4 — exit orb still not cornered: a real cascade bug, not just stale numbers

Round 3's `left: calc(100% - 20px)` fix for `.tuna-popup-exit-orb` was
mathematically correct but never actually applied: `.gt-exit-orb`'s own
`left: 65.4%` (defined in aero.css) has the *exact same specificity* as
a plain `.tuna-popup-exit-orb` class selector (both are single-class
rules), and aero.css is `<link>`ed **after** style.css — so with a
specificity tie, `.gt-exit-orb`'s rule always won the cascade for
`left`/`top` regardless of what my override said. Changing which
properties I set (round 1's `left`/`top` vs. `top`/`right`) never fixed
this; it was never a property-choice problem, it was a specificity
problem the whole time. Fixed by compounding the selector —
`.tuna-popup .tuna-popup-exit-orb` (specificity 0,2,0) reliably beats
`.gt-exit-orb`'s 0,1,0 regardless of stylesheet order.

Verified via `getBoundingClientRect()` on both the game-over popup and
the standalone leaderboard view: the orb's centre now lands within 2px
of the popup's actual top-right corner on both. Screenshot confirms it
visually too — distinct from the Tuna window's own exit orb sitting
behind it. No regressions in GT Paint.

## Phase 2, device rebuilt — Birdsweeper — rectangular sibling

Aesthetic overhaul only (game logic — the grid array, `revealCell`,
flood-fill via `getNeighbors`, bird placement — completely untouched).
Per the user's explicit call, this device **stays a plain rectangle**
("how the original minesweeper game would look"), not a sculpted
silhouette — same construction as the original Video Player device
before its own rebuild: one rounded-rect body, a chrome+glass screen
bezel, a red exit orb, `gtCaseOutline` unifying case, lens flares
(automatic via the existing `openWindow()` hook). ViewBox 640×760, a
square screen (8×8 grid, same "match the grid's natural shape" logic
as Tuna's square screen).

- `#birdsweeper-grid` changed from a fixed `repeat(8, 40px)` box to a
  responsive `repeat(8, 1fr)` grid filling the new bezel, same fix
  pattern as Tuna's.
- `.bird-cell`'s three states (unrevealed/revealed/bird) moved from the
  old pink/white palette to the same translucent aqua-glass material as
  everywhere else; the bird-found cell glows green (matches the
  Jukebox/Tuna "found/success" accent) instead of solid pink.
- The plain `<button onclick="resetBirdsweeper()">` became a gel pill
  button matching the other devices' controls.
- **The "You Found a Bird!" popout** (`#window-bird-found`) is a normal
  `position:absolute` `.window` (not the special fixed+transform
  pattern Tuna's dynamically-created popup uses), so none of round 3's
  centering bug applied here — it already centers/drags correctly via
  the site's regular window system. Replaced its plain title-bar with
  a translucent glass panel + red gel exit orb, reusing the exact fixes
  already learned from the Tuna popup: `.aero-bird-found-popup
  .bird-found-exit-orb` (compound selector, so it reliably beats
  `.gt-exit-orb`'s same-specificity `left`/`top` regardless of
  stylesheet load order) positioned via `calc(100% - 20px)` rather than
  a width-specific pixel value. Kept `.aero-drag-region` on the content
  div so dragging keeps working.
- **Caught one new bug of the same species before it shipped**: the
  popup's glass background wasn't showing at all — `.window-content`'s
  base rule fills every window's content area with an opaque
  candy-pink gradient, and `.bird-popup` (the content div's own class)
  never cleared it, so the pink base was painting on top of the new
  aqua glass the whole time even though the outer `.window`'s
  background was correctly set. Fixed with `background: none` on
  `.bird-popup`.

Verified live: clicking cells still reveals/flood-fills/finds birds
exactly as before (confirmed via a full-grid click sweep), Reset Game
clears the board back to 64 unrevealed cells, the bird-found popup
renders with the correct glass styling once actually checked (a
false-negative first look was mid-open-animation, not a bug — waited
for it to settle and re-verified), its exit orb sits on the corner
within 2px, dragging moves it by the exact mouse delta once settled,
and no regressions in GT Paint, the Jukebox, the Video Player, or Tuna.

## Phase 2, device rebuilt — Start Menu (icons + flyout submenus)

Reference used as a structural/interaction guide only (`start menu ref/Screenshot
(41).png`, a Windows 7/8-era Frutiger Aero Start Menu concept) — its
literal dark Windows chrome was deliberately not copied; the row layout
(icon + label, with a `▸` arrow marking items that expand a hover flyout)
and the flyout interaction pattern were the only things borrowed. Visual
material stays 100% RitualOS's own established aqua-glass gel-pill
language.

- `#start-menu`'s `<ul>` is now built entirely in script.js
  (`buildStartMenu()`), from the same `icons` array that already drives
  the desktop icons and taskbar apps, instead of a hand-written list of
  bare `<li>` text — icon and window-id now can't drift out of sync
  between the three surfaces.
- Two entries (`Exhibitions`, `Freelance`) carry a new `flyout` field on
  their `icons` array entry, naming the `pdfs/<flyout>/index.json`
  folder to source a hover submenu from. `populateStartMenuFlyout()`
  fetches that manifest once at build time (same fetch shape as the
  existing `listPDFs()`) and renders each entry as a
  `.start-menu-flyout-item` — clicking one calls `openPDF()` directly
  and closes the Start Menu, without needing to open the full
  Exhibitions/Freelance window first. The row itself keeps its original
  click behavior (opens the full collection window), so hovering for a
  quick jump and clicking for the full browsable list both still work.
- Flyout show/hide is pure CSS (`#start-menu li.has-flyout:hover
  .start-menu-flyout { display: block; }`) — no JS open/close state to
  keep in sync.
- Row styling (`#start-menu li.start-menu-item` + `:hover`/`:active`)
  and the flyout panel/items reuse the exact gel-pill recipe from
  `.aero-content-bubble` (three-stop white→blue gradient, inset rim
  highlight, outer aqua-tinted drop shadow) so the menu reads as the
  same material as every other glass surface on the site.
- **Applied the specificity lesson from earlier rounds up front this
  time**: style.css's original `#start-menu li` rule (id + type
  selector) still supplies base spacing/margin/cursor and would beat a
  bare `.start-menu-item` class outright regardless of aero.css loading
  after style.css, so every new row rule is written as the compound
  `#start-menu li.start-menu-item` (id + two classes) to reliably win.
- The flyout panel is anchored `left: 100%` (pops out to the right of
  the menu) and `bottom: 0` relative to its own row, not `top: 0` —
  since `#start-menu` itself is anchored to the bottom of the screen
  (`bottom: 40px`, sitting just above the taskbar), a top-anchored
  flyout for a 12-item list (Exhibitions) would run off the top of the
  viewport; growing upward from the hovered row's bottom edge instead
  keeps it on-screen.

Verified live: all 12 rows render with correct icons pulled from the
shared `icons` array, hovering Exhibitions/Freelance reveals a
correctly-positioned scrollable flyout of the real PDF titles (verified
via a temporary forced-`display:block` override for screenshotting,
since synthetic JS mouse events don't trigger real `:hover` matching in
the preview browser — removed after confirming), clicking a flyout item
opens the PDF viewer directly and closes the Start Menu, clicking a
plain row (About Me) still opens its window and closes the Start Menu,
and no console errors or regressions elsewhere.

## Paint — aero-glass modals replace native prompt()/confirm()

Paint (formerly "GT Paint" — see rename below) had two native browser
dialogs left over from before the aero pass: the Type tool's
`prompt('Enter your text:')`, and `confirm(...)` for "close with
unsaved work?". Both are unstyleable by CSS, so they looked like plain
OS/browser popups next to everything else's glass panels.

- Added `showGTPaintModal({ title, message, showInput, confirmLabel,
  cancelLabel, onConfirm })` in gtpaint.js — a small reusable
  fixed-position glass modal (`.gtpaint-modal` in aero.css) built from
  the same recipe as Tuna's popup shell (`.tuna-popup` in style.css):
  translucent aqua/blue gradient, backdrop-blur, gel-pill buttons.
  Given its own class rather than reusing `.tuna-popup` directly since
  it isn't a Tuna concept.
- `placeType()` and `confirmGTPaintClose()` now go through this instead
  of `prompt()`/`confirm()`. Supports Escape to cancel and Enter to
  confirm.
- **`confirmGTPaintClose()` had to change its own contract**, not just
  its visuals: a native `confirm()` blocks and returns a boolean
  synchronously, but a DOM modal can't — the user's answer only exists
  once they click a button, later. It now takes an `onProceed`
  callback instead of returning a boolean. `closeWindow()` (script.js)
  was split into `closeWindow()` (does the Paint-specific unsaved-work
  check, async) and `finishCloseWindow()` (the actual hide-and-cleanup
  logic, unchanged) so the callback has something to call once the
  user actually confirms.
- **Found a z-index race while verifying, not from any existing
  bug**: the Type tool's modal is created *during* the canvas's own
  `mousedown` handler (`startDrawing` → `placeType`). The document-level
  "click a window to focus it" listener (`initGlobalWindowFocus`,
  script.js) also listens on `mousedown` and runs during the same
  event's bubble phase — *after* the modal's target-phase handler — so
  it was re-raising the Paint window's z-index above the
  freshly-created modal a beat later, burying it under its own parent
  window. `bringToFront()`'s inline `z-index` (from the shared `topZ`
  counter) is what's racing here, so the fix was to not use it for this
  modal at all: `.gtpaint-modal` gets a fixed `z-index: 10000` in CSS
  and `showGTPaintModal()` never calls `bringToFront()` on it — a true
  modal isn't part of the normal window-stacking system anyway.

Verified live: Type tool modal opens correctly positioned above the
Paint window (confirmed the z-index race above via
`getComputedStyle().zIndex` before/after the fix, not just visually),
entering text and clicking Add stamps it onto the canvas exactly as
before, Escape cancels, the close-with-unsaved-work modal's "Keep
Editing" leaves the window open and "Close Anyway" closes it, and
closing with no unsaved work still closes instantly with no modal at
all (unchanged fast path). No console errors.

## Rename — "GT Paint" → "Paint", "Bird Art" → "Bird Call"

User-facing labels only — window ids (`gtpaint`, `birdart`), file/module
names (`gtpaint.js`, `birdart/`), and internal comments were left alone
since they're not user-visible and renaming them would have touched far
more code for no visible benefit. Updated: the `icons` array entry
names in script.js (drives the desktop icon label, taskbar tooltip, and
Start Menu row — all three read from the same array, see the Start
Menu section above), the Paint window's exit-orb `aria-label`, and the
standalone Bird Art page's `<title>`/heading text in birdart/index.html.

## Mobile site — brought back in line with desktop

`mobile.html` is a separate, self-contained page (its own inline
`<style>` + `<script>`, no dependency on script.js/gtpaint.js/etc.) that
had drifted significantly: it was missing Music, Video, Paint, and Bird
Call entirely (8 of the current 12 apps), still used the old XP-blue
title bars and candy-pink window content from before the aero pass, and
kept its own hand-copied `:root` palette that nobody had touched since.
(A Terrarium app was scoped and an icon drafted this session, then
deliberately shelved — cancelled before any vessel/plant work began —
noted here only so it isn't mistaken for missing/lost work.)

- **Stopped hand-copying the palette.** `mobile.html` now links
  `style.css` and `aero.css` directly and only keeps its own genuinely
  mobile-only tokens (the sky-gradient background, bird-cell tints) in
  a small local `:root`. This is the actual fix for why it drifted in
  the first place — a duplicated snapshot nobody updates. Most of those
  files' selectors (`.window`, `#start-menu`, `.gtpaint-*`, …) simply
  don't match anything in this page's DOM, so linking them is free
  beyond a little unused CSS.
- `.mobile-window`/`.mobile-title-bar`/`.mobile-window-content`/
  `.mobile-link-list a` were restyled from flat XP-blue/candy-pink to
  the same translucent aqua-glass gel-pill material used everywhere
  else (`--aero-aqua`/`--xp-blue-*` gradients, backdrop-blur, gel
  buttons). The title bar's close button became a round red gel orb
  instead of a square button, matching the desktop exit orbs' recipe.
- **App grid rebuilt from a shared array** (`mobileApps`, mirroring
  desktop's `icons` array in script.js) instead of 8 hardcoded
  `<div class="app-icon">` blocks — same fix pattern as the Start Menu
  rebuild earlier this session. Added the 4 missing apps (Music, Video,
  Paint, Bird Call) with the same names/icons as desktop.
- **New simplified mobile experiences** — deliberately not 1:1 clones of
  the desktop devices, since several of those are built around
  mouse-driven interactions (a rotary tool wheel, a custom seek/fader
  rig) that don't translate to a small touch screen:
  - **Music**: fetches `music/tracks.json`, renders each track as a
    gel-pill row; tapping toggles play/pause on one shared `<audio>`
    element, with a green "now playing" highlight.
  - **Video**: fetches `videos/index.json`, same pill-list pattern;
    tapping loads the file into one native `<video controls>` element
    inline (native controls are the better fit here than desktop's
    custom chrome).
  - **Paint**: a touch-drawing `<canvas>` (Pointer Events, so mouse in
    the preview browser and touch on an actual phone both work the same
    way) with a small colour-swatch row and a Clear button — pencil
    only, no wheel/shapes/symmetry.
  - **Bird Call**: opens `birdart/index.html` in a new tab, exactly like
    desktop's `openWindow('birdart')` — it's a standalone page, not
    something that belongs inside the mobile-window shell.
  - `closeAllWindows()` now also pauses music/video playback (previously
    only stopped the Tuna game loop), so audio/video can't keep playing
    after its window closes.
- **Caught one regression before it shipped**: adding 4 more apps to a
  fixed 2-column grid pushed total content height past most phone
  viewports, and `.app-grid` had no scrolling — Paint/Bird Call (the new
  last row) would have been genuinely unreachable. Fixed with
  `overflow-y: auto` on `.app-grid`.

Verified live at a 375×812 mobile viewport: all 12 apps present in the
correct order/names and reachable via scroll, Music/Video/Paint each
render and function correctly (track playback + now-playing highlight,
video playback, canvas drawing + Clear all confirmed programmatically
since synthetic pointer-event dispatch doesn't reliably hit-test canvas
elements in the preview harness — calling the handler functions directly
confirmed the same code path real touch input drives), closing a window
pauses music/stops the Tuna game loop, Birdsweeper/Tuna still initialize
correctly (no regressions), and no console errors.

### Mobile — night sky backdrop

Replaced the day-blue-to-pink `.mobile-bg` gradient with a slow-drifting
night sky, per explicit request ("a pretty night sky backdrop that
moves slowly") rather than desktop's real-time-of-day system
(`aero.js`'s dawn/day/golden/night cycle) — mobile always shows night,
it doesn't cycle.

- Deep indigo-to-violet gradient (`--night-sky-1/2/3`, `--night-horizon`)
  replaces the old `--sky-blue-*`/`--sky-pink` day tokens.
- Added three new layered elements inside `.mobile-bg`, all
  `pointer-events:none` and purely decorative:
  - `.mobile-stars` — the same dot-field recipe as desktop's
    `.aero-sky-stars` (aero.css), scaled up to ~25 dots since it's the
    permanent backdrop here rather than a subtle night-only overlay.
    Drifts almost imperceptibly over 120s and twinkles gently (6s).
  - `.mobile-aurora` — same mint/violet blurred-ribbon recipe as
    desktop's `.aero-sky-aurora`, drifting over 46s.
  - `.mobile-moon` — a soft radial-gradient disc with a two-layer glow,
    tucked into the top-right corner (nudged there after a first pass
    placed it directly behind the Freelance icon — moved to `top:3%;
    right:7%` so it reads as sky, not icon decoration), drifting over 60s.
  - The existing `.mobile-bg::before`/`::after` ambient blobs (their
    slow 22s/28s drift kept as-is) were recoloured from white/pink day
    highlights to cool aqua/mint/violet glimmers to match the night mood.
- All of the above (plus the existing blob drift) are added to the
  `prefers-reduced-motion: reduce` override — a static night sky
  instead of a moving one, consistent with how every other animated
  layer in this codebase handles reduced motion.

Verified live: stars/aurora/moon all render and animate (confirmed
computed `animationName` on each, not just visually), the moon sits
clearly in open sky after the reposition, the dark boot/enter screen is
unaffected (separate, already-dark layer), window content stays fully
legible against the darker backdrop, and no console errors.

## Final polish pass — code review + bug fixes

Ran a structured multi-angle review (correctness, removed-behavior/cross-file,
reuse/simplification/efficiency) across script.js, gtpaint.js, musicplayer.js,
videoplayer.js, mobile.html, and aero.css/style.css, then fixed every
confirmed real bug plus a few safe cleanups. Each fix below was verified
live in the browser (not just read), not just applied on the strength of
the review.

**Correctness fixes:**
- `script.js` — the window-resize handler excluded `.tuna-popup` from
  `clampWindowIntoView` (both self-center via `position:fixed` +
  `translate(-50%,-50%)`, which that function's inline left/top fights)
  but not `.gtpaint-modal`, added later this session for the same reason.
  Resizing with a Paint modal open pushed it off-screen. Fixed by adding
  the same exclusion.
- `script.js` — `showTunaLeaderboardPanel()` never stopped the game
  loop, so opening the Leaderboard mid-game let the snake keep moving
  behind the popup while `isTunaFocused()` had already stopped routing
  arrow keys to it — an unfair, unseen game over. Now calls
  `stopTunaGame()` first.
- `script.js` — Tuna's collision check (`snake.includes(next)`) ran
  before the tail's `shift()`, so moving the head into the cell the tail
  is vacating this same tick (a completely legal move) was misreported
  as a crash. Fixed by excluding the tail segment from the check unless
  the move is eating food (tail doesn't move that tick).
- `script.js` — the delegated window-drag handler's exclusion list had
  `.gtpaint-wheel` (GT Paint's rotary dial) but not
  `#jukebox-volume-ring`, which uses the identical pointerdown/
  pointermove pattern — turning the Jukebox's volume knob also dragged
  the whole Music window. Added the same exclusion.
- `gtpaint.js` — `showGTPaintModal()` deleted a still-open previous
  modal's DOM node without calling its own `close()`, leaking a
  document-level keydown listener every time this happened. Fixed by
  tracking the active modal's `close` and calling it first.
- `gtpaint.js` — the rotary tool wheel's drag angle was computed as a
  single diff from the drag's start angle; `atan2` jumps from +180° to
  -180° at screen-left ("9 o'clock" on the wheel), so dragging through
  that point spun the wheel a full 360° instantly. Fixed by accumulating
  small per-frame deltas, each unwrapped into (-180°, 180°], instead.
- `gtpaint.js` — Ctrl+Z/Y only checked whether the Paint window was
  visible, not whether a modal was open over it, so undo/redo could
  silently mutate the canvas while the Type-tool or unsaved-work modal
  was up. Added a modal-open check.
- `gtpaint.js` — bare Enter always confirmed a modal even with no input
  focused, meaning Enter defaulted to "Close Anyway" (destructive) on
  the unsaved-work warning. Enter now only auto-confirms text-entry
  modals when the input itself is focused.
- `musicplayer.js` — the mute button set `audio.volume` directly instead
  of going through `setJukeboxVolume()`, duplicating that function's
  mute logic in a second place that could drift out of sync with it.
  Routed through the shared function instead (the volume ring correctly
  keeps showing the stored level while muted, like a physical knob not
  moving).
- `musicplayer.js` — pressing Play before `music/tracks.json` resolved
  silently no-opped with no retry once the list arrived. Added a
  `jukeboxPendingAutoplay` flag consumed once the fetch resolves.
- `videoplayer.js` — the fullscreen button had no `.catch()` on
  `requestFullscreen()`'s promise (unhandled rejection if denied) and no
  fallback for iOS Safari, which only exposes `webkitEnterFullscreen()`
  on `<video>`. Added both.
- `mobile.html` — `closeAllWindows()` cleared the windows container
  *before* calling `stopMobileVideo()`, so that function's
  `getElementById('mobile-video-player')` always returned null and
  `.pause()` never ran (relying on the detached element's own GC to stop
  it instead). Reordered to stop playback first.
- `mobile.html` — `playMobileVideo()` never cleared the "now playing"
  highlight when a video ended on its own (unlike the music player,
  which does). Added an `ended` listener.
- `mobile.html` — `mobilePaintDrawing` wasn't reset when a new Paint
  session initialized and there was no `pointercancel` handler, so a
  drag interrupted by e.g. an iOS edge-swipe gesture could leave it
  stuck `true`, drawing a stray line from a stale last-position the next
  time a pointermove fired. Added a reset in `initMobilePaint()` and a
  `pointercancel` listener alongside the existing `pointerup` one.
- `mobile.html` — the ghost's whisper timer didn't check `mgSleeping`,
  so a whisper bubble could pop up next to a visibly sleeping ghost.
  Added the guard.

**Cleanup (safe, zero visual/behavioral impact — verified before and
after):**
- `script.js` — `loadInternetLinks()`/`loadPressLinks()` were
  line-for-line identical aside from the data array and container id;
  merged into one `renderLinkList(links, containerId)`.
- `musicplayer.js` — `jukeboxLoopStep()` (the visualizer's animation
  loop) called `document.getElementById()`/`canvas.getContext()` every
  frame for a static element that's never recreated. Cached both once.
- `aero.css` — removed an entire dead Phase-0 scaffold (`.aero-glass`,
  `.aero-gel-button`, `.aero-titanium`, `.aero-dew`, `.aero-sky`/
  `.aero-aurora`/`.aero-grass` utility classes, `.aero-device-shell`/
  `.aero-device-screen`, `.aero-open-buoyant`/`.aero-hover-float`/
  `.aero-ripple`, and their supporting tokens/keyframes) — confirmed zero
  matches anywhere in index.html/mobile.html/any JS file; every device
  that actually shipped got its own specific treatment instead. Kept
  `@keyframes aeroBuoyantOpen`, which `.window.aero-demo.window-opening`
  genuinely uses.
- `aero.css` — removed `.gtpaint-zoom-btn` from three combined selectors;
  it matched nothing (the real Fit button has no such class), and is
  already correctly styled via the sibling `.gtpaint-deck button`
  selector in the same rule — confirmed via computed styles before removing.

**Explicitly skipped** (flagged by the review, not applied — either
higher-risk for the benefit or genuinely low-value):
- Consolidating `.jukebox-btn`/`.videoplayer-transport-btn` and
  `.tuna-popup-btn`/`.gtpaint-modal-btn`'s duplicated gel-pill CSS recipes
  across files — real duplication, but merging live, already-shipped
  visual rules risks a regression for a purely cosmetic win.
  `AudioContext.resume()` potentially staying suspended after a
  backgrounded tab auto-suspends it (Web Audio autoplay policy edge
  case) — low reproducibility, and the Jukebox can only be opened via a
  click that already satisfies the gesture requirement in the first place.
- The marquee-overflow-detection race (`scrollWidth` read right after
  `textContent` is set, before layout) — real but low-impact and low
  frequency (only affects a title exactly at the overflow boundary while
  the window is mid-transition).

Verified live in-browser (not just read) for every fix above: resize
during an open Paint modal, the modal listener-leak (instrumented
add/removeEventListener counts, confirmed balanced), Enter no longer
force-confirming, opening the Tuna leaderboard mid-game actually stopping
the interval, the volume ring no longer dragging the Music window, mute
routing through the shared function, the play-before-loaded queue, the
visualizer canvas caching (forced a frame manually since this preview
tab's rAF is throttled by the harness's backgrounded-tab state), Paint's
pointercancel reset, and the video ended-listener/close-order fix
(instrumented to confirm the player element is found and still playing
at the moment `stopMobileVideo()` now runs). No console errors, no
visual regressions on desktop or at a 375×812 mobile viewport.

## About Me — new bio copy, bubbles removed

Replaced the bio text with George's new transdisciplinary-artist copy
(6 paragraphs) and, per explicit request, dropped the per-paragraph
`.aero-content-card` bubble treatment — long-form copy chopped into
separate rounded cards read worse the longer it got, and the ask was
specifically "no bubbles around paragraphs... clear writing... easy to
read."

- New `.about-bio` class (aero.css) wraps the whole bio in ONE
  continuous glass panel instead of one card per `<p>` — same
  gel-material recipe as `.aero-content-card` (soft three-stop gradient,
  glossy top highlight, aqua-tinted shadow, rounded corners) so it still
  reads as the same material family, just presented as a single page
  instead of fragmented bubbles.
- Paragraphs inside it are plain `<p>` tags with generous line-height
  (1.7) and spacing — no individual background/border/shadow — so nested
  `<em>` (work/exhibition/EP/album titles, matching the italics
  convention already used elsewhere in this bio) and `<strong>` read
  cleanly against one steady backdrop.
- Verified live: renders as one continuous panel (confirmed via computed
  styles — the container has the gradient/shadow, individual `<p>`s have
  `background-image: none`), text fully legible, no console errors, the
  existing 550×650 window + `.window-content`'s `overflow-y: auto`
  handle the longer copy without any layout change needed.

## SEO pass — ranking for "George Turner" / "George Turner artist" / "George Turner NZ"

The site already had a decent foundation (title/description, canonical,
OG/Twitter tags, a Person JSON-LD block, robots.txt, sitemap.xml) — this
pass filled the real gaps rather than rebuilding it.

- **og:image/twitter:image were pointing at `icons/ghost.png`** — the
  site's mascot, not the artist. Search/social previews for "George
  Turner" would have shown a cartoon ghost. Generated a proper
  1200×630 crop from `images/portrait.jpg` (the source is a 13MB
  2759×4138 photo — far too large and the wrong aspect ratio to use
  directly) via .NET's `System.Drawing`, saved as `images/og-image.jpg`
  (~109KB), and pointed both tags at it, plus added the
  `og:image:width/height/alt` companion tags platforms expect.
- **Expanded the JSON-LD** from a single `Person` block to an `@graph`
  of `Person` + `WebSite` + `ProfilePage`, cross-linked by `@id`. Added
  `alternateName: ["George Turner Artist", "George Turner NZ"]`,
  `nationality`, `homeLocation`, `knowsAbout`, `alumniOf`, and a proper
  `image`, plus a 4th `sameAs` entry (Bandcamp — found wired up in the
  Jukebox but never added to the schema). This is what actually lets
  Google connect those specific search phrases to this page rather than
  just indexing loose body text.
- **Title/description** reworded to naturally include "NZ" alongside
  "New Zealand" (search engines treat these as synonyms already, but
  having the literal string doesn't hurt) and to reflect the new About
  Me copy ("transdisciplinary" rather than the old "digital art"
  framing). Added a `keywords` meta (low SEO weight today, but
  essentially free).
- **Added semantic `<h2 class="sr-only">` headings** inside the
  Exhibitions/Freelance/About Me/Contact/Internet/Press windows —
  previously these sections had no heading structure at all below the
  single page `<h1>`, just a `.title-bar` div (not a real heading tag).
  Placed as siblings *before* the JS-populated list containers
  (`.pdf-list`, `#internet-links`, `#press-links`), never inside them —
  those get `innerHTML = ''` on every load/refresh, which would silently
  delete a heading placed inside.
- **Found and fixed a real bug while doing this**: `.sr-only` (used on
  the page's `<h1>`) had no CSS definition anywhere in the project. It
  wasn't hidden at all — `position:static`, `display:block`, a real
  192px-tall box. It only *looked* invisible in the desktop screenshot
  by coincidence: the text is white and happened to sit against bright
  white clouds in the sky background. Added the standard
  clip-to-1px visually-hidden pattern to style.css, which the new `<h2>`s
  also rely on.
- `sitemap.xml` — added `<lastmod>` dates (both URLs had none).

**What I can't do — needs the account owner (George/whoever holds the
domain):**
- **Google Search Console**: verify domain ownership at
  search.google.com/search-console, then submit `sitemap.xml` there
  directly — this is the single biggest lever for actually getting
  indexed quickly rather than waiting for Google to discover the site
  organically. Same story for Bing Webmaster Tools.
- **Backlinks**: on-page SEO (everything above) controls whether Google
  understands *what* this page is about; it does not control ranking
  *position* for a competitive query. Real profile pages (Instagram,
  Spotify, Bandcamp — already in `sameAs`, but only helps if those
  profiles' own bios/links point back to georgeturner.space) and press
  coverage that link back to the site are what actually move a name
  query into the top results over time.
- **Expect a lag**: even with everything above correct, a newly-crawled
  or newly-changed page typically takes days to a few weeks to reflect
  in search results, longer to rank well for a competitive first-name
  query. Nothing above can force Google to rank the site #1 for "George
  Turner" — there may be other people with that name with more
  established web presence — but this pass gives *this* George Turner's
  site the clearest, most accurate signal it can currently send about
  who he is and what's on the page.

## Phase roadmap (for reference — not built yet)

- **Phase 1**: living sky environment behind the desktop, aqua-glass dock
  taskbar, gel Start orb, dimensional desktop icons, upgraded boot screen.
- **Phase 2**: one device per approval — GT Paint handheld console, Music
  pocket player + dock, Tuna aquarium, Birdsweeper research pod, Video
  wall-mounted TV, and restrained frosted-glass kiosks for the
  content-first windows (Exhibitions/Freelance/Press/About/Contact).
- **Phase 3**: discovery layer — hidden micro-experiences, visit memory.
- **Phase 4**: mobile parity, accessibility + performance audit, updated
  share assets.
