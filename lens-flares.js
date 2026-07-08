// =========================================================
// LENS FLARES — ambient decoration (standalone module)
// =========================================================
// Scatters 1-3 small, randomly-picked lens-flare PNGs (from "lens
// flares/") around a window's border every time it opens (see
// openWindow() in script.js, which calls spawnLensFlares(win)).
// Purely cosmetic: pointer-events:none on every flare means they can
// never block a click no matter where they land, even directly over a
// button.
// =========================================================

const LENS_FLARE_COUNT = 10;
const LENS_FLARE_DIR = 'lens flares';

function lensFlareUrl(n) {
  return `${encodeURIComponent(LENS_FLARE_DIR)}/CHROMEKIT_Lensflare_${n}.png`;
}

// Maps a 0-1 fraction to a point (in percent) around a rectangle's
// perimeter, walking top -> right -> bottom -> left. Anchored at 10%/90%
// (not right on 0%/100%) so a centred flare mostly sits ON the border
// instead of hanging half off the edge of the window. Biased toward the
// corners rather than uniform along each edge — corners are reliably
// glass/chrome (exit orbs, wheel housings, pod rims) on every device,
// where an edge's midpoint can land deep inside a plain white content
// area (e.g. GT Paint's canvas) where a bright flare core is invisible
// against a matching white background.
function pointOnRectPerimeter(t) {
  const edge = Math.floor(t * 4);
  let local = (t * 4) % 1;
  local = local < 0.5 ? local * local * 2 : 1 - (1 - local) * (1 - local) * 2;
  switch (edge) {
    case 0: return { leftPct: local * 100, topPct: 10 };
    case 1: return { leftPct: 90, topPct: local * 100 };
    case 2: return { leftPct: (1 - local) * 100, topPct: 90 };
    default: return { leftPct: 10, topPct: (1 - local) * 100 };
  }
}

function spawnLensFlares(win) {
  if (!win) return;

  // clear any flares left over from the previous time this window opened
  win.querySelectorAll('.aero-lens-flare-live, .aero-lens-flare-static').forEach((el) => el.remove());

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const count = 1 + Math.floor(Math.random() * 3); // 1-3
  const usedIndices = new Set();

  for (let i = 0; i < count; i++) {
    let idx;
    do {
      idx = 1 + Math.floor(Math.random() * LENS_FLARE_COUNT);
    } while (usedIndices.has(idx) && usedIndices.size < LENS_FLARE_COUNT);
    usedIndices.add(idx);

    const img = document.createElement('img');
    img.src = lensFlareUrl(idx);
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    img.draggable = false;
    img.className = reduceMotion ? 'aero-lens-flare-static' : 'aero-lens-flare-live';

    const t = Math.random();
    const { leftPct, topPct } = pointOnRectPerimeter(t);
    const jitterX = (Math.random() - 0.5) * 8;
    const jitterY = (Math.random() - 0.5) * 8;
    const size = 44 + Math.random() * 60; // ~44-104px, small and shrunk down from the native 844px art
    const opacity = (0.55 + Math.random() * 0.35).toFixed(2); // 0.55-0.9, bright enough to actually read
    const rotation = Math.round(Math.random() * 360);
    const delay = (Math.random() * 1.1).toFixed(2);
    const driftDuration = (7 + Math.random() * 5).toFixed(1);

    img.style.left = `calc(${leftPct}% + ${jitterX}px)`;
    img.style.top = `calc(${topPct}% + ${jitterY}px)`;
    img.style.width = `${size}px`;
    img.style.height = `${size}px`;
    img.style.setProperty('--aero-flare-rot', `${rotation}deg`);
    img.style.setProperty('--aero-flare-opacity', opacity);
    img.style.animationDelay = `${delay}s, ${delay}s`;
    img.style.animationDuration = `1.1s, ${driftDuration}s`;

    win.appendChild(img);
  }
}

// Re-picked on next window open; nothing to clean up on close — stale
// flares in a display:none window cost nothing and get cleared on reopen.
