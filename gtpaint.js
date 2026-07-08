// =========================
// GT PAINT — STANDALONE MODULE
// =========================
// Loaded from index.html after script.js. Plain global scope (no modules),
// same pattern as script.js — openWindow() in script.js calls initGTPaint()
// and closeWindow() calls confirmGTPaintClose() when the gtpaint window
// is involved.

// Fixed internal drawing resolution. The canvas can be displayed at any
// CSS size (see zoom controls below) without changing how big a stroke
// looks relative to the artwork — all drawing math happens in this space.
const GTPAINT_LOGICAL_WIDTH = 860;
const GTPAINT_LOGICAL_HEIGHT = 520;

let gtPaintInitialized = false;
let gtPaintIsDrawing = false;
let gtPaintTool = 'pencil';
let gtPaintColor = '#ff4fd8';
let gtPaintSize = 14;
let gtPaintFontSize = 42;
let gtPaintZoomPercent = 100; // continuous 10–400, user-controlled via the zoom slider

let gtPaintSymmetry = 'none'; // 'none' | 'vertical' | 'kaleidoscope'
let gtPaintRainbowMode = false;
let gtPaintRainbowHue = 0;
let gtPaintCurrentStamp = 'ghost';
let gtPaintShapeTexture = 'tube'; // 'tube' | 'ribbon'
let gtPaintLastDrawingTool = 'pencil'; // remembered so eyedropper can hand control back

// colour-wheel state: hue driven by the ring (click/drag anywhere on it),
// lightness driven by vertical drag on the centre orb. Kept at module
// scope (not inside initGTPaintColourWheel's closure) so the native
// #gtpaint-color input can also update them when the user picks a colour
// there directly — see updateColourWheelVisualsFromColor() below.
let gtPaintWheelHue = 330;
let gtPaintWheelLightness = 65;

const GTPAINT_STAMP_ICONS = {
  ghost: 'icons/ghost.png',
  star: 'icons/star.png',
  kaka: 'icons/kaka.png',
  tui: 'icons/tui.png',
  kereru: 'icons/kereru.png',
  kakapo: 'icons/kakapo.png',
  tieke: 'icons/tieke.png'
};
let gtPaintStampImages = {};

// Keeps a range input's --range-percent CSS var in sync with its value,
// so the green fill bar (see aero.css) tracks the thumb instead of the
// track just being a flat two-tone gradient forever.
function updateGTPaintRangeFill(input) {
  const min = parseFloat(input.min) || 0;
  const max = parseFloat(input.max) || 100;
  const value = parseFloat(input.value);
  const percent = max > min ? ((value - min) / (max - min)) * 100 : 0;
  input.style.setProperty('--range-percent', `${percent}%`);
}

function preloadGTPaintStamps() {
  Object.entries(GTPAINT_STAMP_ICONS).forEach(([key, src]) => {
    const img = new Image();
    img.src = src;
    gtPaintStampImages[key] = img;
  });
}

function isGTPaintShapeTool(tool) {
  return tool === 'line' || tool === 'rect' || tool === 'ellipse';
}

// Stub — full "recent colours" row lands in a later stage. Kept as a no-op
// so the eyedropper (which calls this) doesn't need to know it's not built yet.
function addGTPaintRecentColor(hex) {}

// =========================
// MIRROR / SYMMETRY — works with every brush because it operates purely
// on coordinates before handing them to whichever draw* function is active.
// =========================

function gtPaintSymmetryPoints(p) {
  const W = GTPAINT_LOGICAL_WIDTH, H = GTPAINT_LOGICAL_HEIGHT;
  const pts = [p];
  if (gtPaintSymmetry === 'vertical' || gtPaintSymmetry === 'kaleidoscope') {
    pts.push({ x: W - p.x, y: p.y });
  }
  if (gtPaintSymmetry === 'kaleidoscope') {
    pts.push({ x: p.x, y: H - p.y });
    pts.push({ x: W - p.x, y: H - p.y });
  }
  return pts;
}

function gtPaintSymmetryPairs(from, to) {
  const fromPts = gtPaintSymmetryPoints(from);
  const toPts = gtPaintSymmetryPoints(to);
  return fromPts.map((f, i) => ({ from: f, to: toPts[i] }));
}

// Draws a single point (spray/glow/glitter/stamp) at every active mirror copy.
function drawWithSymmetryPoint(pos, drawFn) {
  gtPaintSymmetryPoints(pos).forEach(p => drawFn(p));
}

// Draws a from->to segment (pencil/eraser/tube/ribbon) at every mirror copy.
function drawWithSymmetryPair(from, to, drawFn) {
  gtPaintSymmetryPairs(from, to).forEach(({ from: f, to: t }) => drawFn(f, t));
}

// =========================
// RAINBOW MODE — cycles hue along the stroke for any brush. Applied once
// per stroke "tick" (not per mirror copy) so kaleidoscope copies share a
// colour instead of drifting apart.
// =========================

function gtPaintNextRainbowColor() {
  gtPaintRainbowHue = (gtPaintRainbowHue + 6) % 360;
  return gtPaintHslToHex(gtPaintRainbowHue, 85, 60);
}

function gtPaintHslToHex(h, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = x => Math.round(255 * x).toString(16).padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

// Reverse of gtPaintHslToHex — used to line the colour wheel's hue ring
// and lightness-driven orb up with whatever colour is already selected
// (native picker, defaults, saved state) instead of guessing.
function gtPaintHexToHsl(hex) {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  const r = ((bigint >> 16) & 255) / 255;
  const g = ((bigint >> 8) & 255) / 255;
  const b = (bigint & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const delta = max - min;
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: s * 100, l: l * 100 };
}

// Keeps the colour wheel's thumb rotation + orb tint in sync with
// whatever gtPaintColor currently is — called both from the wheel's own
// drag handlers and from the native #gtpaint-color input's listener, so
// picking a colour either way keeps both controls agreeing.
function updateColourWheelVisualsFromColor(hex) {
  const hsl = gtPaintHexToHsl(hex);
  gtPaintWheelHue = hsl.h;
  gtPaintWheelLightness = hsl.l;

  const thumb = document.getElementById('gtpaint-colour-wheel-thumb');
  if (thumb) thumb.style.transform = `rotate(${gtPaintWheelHue}deg)`;

  const hub = document.getElementById('gtpaint-colour-wheel-hub');
  if (hub) hub.style.setProperty('--gtpaint-hub-color', hex);
}

// Call before drawing a tick; returns the colour to restore afterwards (or
// null if rainbow mode is off, meaning nothing needs restoring).
function gtPaintBeginRainbowTick() {
  if (!gtPaintRainbowMode) return null;
  const saved = gtPaintColor;
  gtPaintColor = gtPaintNextRainbowColor();
  return saved;
}

function gtPaintEndRainbowTick(saved) {
  if (saved !== null) gtPaintColor = saved;
}

// =========================
// SHAPE TOOLS — straight line / rectangle / ellipse, outlined using the
// existing tube or ribbon texture by tracing a path of points through it.
// =========================

function gtPaintShapePoints(tool, start, end) {
  if (tool === 'rect') {
    return [
      { x: start.x, y: start.y },
      { x: end.x, y: start.y },
      { x: end.x, y: end.y },
      { x: start.x, y: end.y },
      { x: start.x, y: start.y }
    ];
  }
  if (tool === 'ellipse') {
    const cx = (start.x + end.x) / 2;
    const cy = (start.y + end.y) / 2;
    const rx = Math.abs(end.x - start.x) / 2;
    const ry = Math.abs(end.y - start.y) / 2;
    const segments = 48;
    const pts = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      pts.push({ x: cx + Math.cos(angle) * rx, y: cy + Math.sin(angle) * ry });
    }
    return pts;
  }
  return [start, end]; // 'line'
}

let gtPaintUndoStack = [];
let gtPaintRedoStack = [];
let GT_PAINT_HISTORY_LIMIT = 30;
let gtPaintBlankSnapshot = null; // pixel data of the pristine white canvas, captured once at init

// "Unsaved work" = the canvas currently looks different from blank white.
// Compares actual pixels rather than history length, so Undo/Redo/Clear
// back to blank correctly report "nothing to lose" again.
function gtPaintHasUnsavedWork() {
  const canvas = document.getElementById('gtpaint-canvas');
  if (!canvas || !gtPaintBlankSnapshot) return gtPaintUndoStack.length > 1;

  const ctx = canvas.getContext('2d');
  const current = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  if (current.length !== gtPaintBlankSnapshot.length) return true;

  for (let i = 0; i < current.length; i++) {
    if (current[i] !== gtPaintBlankSnapshot[i]) return true;
  }
  return false;
}

// Aero-glass replacement for native prompt()/confirm() — same fixed,
// self-centering popup shell as Tuna's game-over/leaderboard panel
// (.window.tuna-popup in style.css), just under Paint's own class name
// since it isn't a Tuna concept. Native dialogs can't be restyled at
// all, so both of Paint's popups (the Type tool's text entry, and the
// close-with-unsaved-work warning) go through this instead.
let gtPaintActiveModalClose = null;

function showGTPaintModal({ title, message, showInput = false, confirmLabel = 'OK', cancelLabel = 'Cancel', onConfirm }) {
  // A modal opened while another is still up (shouldn't normally happen,
  // but the Type tool can fire mid-drag) used to just delete the old
  // modal's DOM node here without running its own close() — the DOM node
  // was gone, but its document-level keydown listener lived on forever.
  if (gtPaintActiveModalClose) gtPaintActiveModalClose();
  document.querySelectorAll('.gtpaint-modal').forEach(el => el.remove());

  const modal = document.createElement('div');
  modal.className = 'window gtpaint-modal';
  modal.style.display = 'flex';
  modal.innerHTML = `
    <div class="gtpaint-modal-content aero-drag-region">
      <h3 class="gtpaint-modal-title">${title}</h3>
      <p class="gtpaint-modal-message">${message}</p>
      ${showInput ? '<input type="text" class="gtpaint-modal-input" maxlength="80">' : ''}
      <div class="gtpaint-modal-actions">
        <button type="button" class="gtpaint-modal-btn gtpaint-modal-btn-secondary" data-action="cancel">${cancelLabel}</button>
        <button type="button" class="gtpaint-modal-btn" data-action="confirm">${confirmLabel}</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  // Deliberately NOT bringToFront(modal): that stamps an inline
  // z-index from the shared topZ counter, which the document-level
  // "click a window to focus it" handler (initGlobalWindowFocus,
  // script.js) can immediately raise past again on the very mousedown
  // that opened this modal (the Type tool opens it mid-mousedown, so
  // that handler's own bringToFront(gtpaintWindow) fires right after,
  // during the same event's bubble phase, and would bury the modal
  // under the window it belongs to). A modal isn't part of that
  // window-stacking system anyway — the fixed z-index in aero.css
  // keeps it on top of everything unconditionally.
  if (typeof playWindowOpenAnimation === 'function') playWindowOpenAnimation(modal);

  const input = modal.querySelector('.gtpaint-modal-input');
  if (input) setTimeout(() => input.focus(), 0);

  function close() {
    modal.remove();
    document.removeEventListener('keydown', onKeydown);
    if (gtPaintActiveModalClose === close) gtPaintActiveModalClose = null;
  }

  function confirmAndClose() {
    const value = input ? input.value.trim() : true;
    close();
    if (value) onConfirm(value);
  }

  function onKeydown(e) {
    if (e.key === 'Escape') close();
    // Enter only auto-confirms for text-entry modals (Enter-to-submit is
    // expected there). Confirm-only modals (e.g. "Close Anyway" on unsaved
    // work) don't wire Enter to anything — that button is often the
    // destructive option, and a bare Enter shouldn't be able to trigger it.
    else if (e.key === 'Enter' && input && document.activeElement === input) confirmAndClose();
  }

  modal.querySelector('[data-action="cancel"]').addEventListener('click', close);
  modal.querySelector('[data-action="confirm"]').addEventListener('click', confirmAndClose);
  document.addEventListener('keydown', onKeydown);
  gtPaintActiveModalClose = close;
}

// Called by script.js's closeWindow('gtpaint') before hiding the window.
// Calls onProceed() once it's actually OK to close — can't return a
// boolean synchronously any more since the confirmation is now an aero
// modal instead of a blocking native confirm().
function confirmGTPaintClose(onProceed) {
  if (!gtPaintHasUnsavedWork()) {
    onProceed();
    return;
  }
  showGTPaintModal({
    title: 'Unsaved Artwork',
    message: "You haven't downloaded this artwork yet. Your drawing will still be here if you reopen Paint, but will be lost if you reload or leave the site.",
    confirmLabel: 'Close Anyway',
    cancelLabel: 'Keep Editing',
    onConfirm: onProceed
  });
}

function initGTPaint() {
  const canvas = document.getElementById('gtpaint-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const pencilBtn = document.getElementById('gtpaint-pencil');
  const eraserBtn = document.getElementById('gtpaint-eraser');
  const sprayBtn = document.getElementById('gtpaint-spray');
  const glowBtn = document.getElementById('gtpaint-glow');
  const tubeBtn = document.getElementById('gtpaint-tube');
  const ribbonBtn = document.getElementById('gtpaint-ribbon');
  const glitterBtn = document.getElementById('gtpaint-glitter');
  const typeBtn = document.getElementById('gtpaint-type');
  const stampBtn = document.getElementById('gtpaint-stamp');
  const eyedropperBtn = document.getElementById('gtpaint-eyedropper');
  const lineBtn = document.getElementById('gtpaint-line');
  const rectBtn = document.getElementById('gtpaint-rect');
  const ellipseBtn = document.getElementById('gtpaint-ellipse');

  const stampPickerRow = document.getElementById('gtpaint-stamp-picker');
  const shapeTextureRow = document.getElementById('gtpaint-shape-texture-row');

  const colorInput = document.getElementById('gtpaint-color');
  const sizeInput = document.getElementById('gtpaint-size');
  const sizeDisplay = document.getElementById('gtpaint-size-display');

  const fontSizeInput = document.getElementById('gtpaint-font-size');
  const fontSizeDisplay = document.getElementById('gtpaint-font-size-display');

  const fillBtn = document.getElementById('gtpaint-fill');
  const undoBtn = document.getElementById('gtpaint-undo');
  const redoBtn = document.getElementById('gtpaint-redo');
  const clearBtn = document.getElementById('gtpaint-clear');
  const downloadBtn = document.getElementById('gtpaint-download');

  if (!gtPaintInitialized) {
    // Render at native pixel density (capped at 2x) so strokes stay crisp
    // on retina/high-DPI screens, while all drawing math below still uses
    // the fixed logical 860x520 space via ctx.scale().
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    GT_PAINT_HISTORY_LIMIT = dpr > 1 ? 15 : 30; // higher-res snapshots cost more memory

    canvas.width = GTPAINT_LOGICAL_WIDTH * dpr;
    canvas.height = GTPAINT_LOGICAL_HEIGHT * dpr;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = cssVar('--neutral-white');
    ctx.fillRect(0, 0, GTPAINT_LOGICAL_WIDTH, GTPAINT_LOGICAL_HEIGHT);
    gtPaintBlankSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    saveGTPaintState();

    function setTool(tool) {
      gtPaintTool = tool;
      if (tool !== 'eyedropper') gtPaintLastDrawingTool = tool;

      document.querySelectorAll('#window-gtpaint .gtpaint-tool').forEach(btn => btn.classList.remove('active'));

      if (tool === 'pencil') pencilBtn.classList.add('active');
      if (tool === 'eraser') eraserBtn.classList.add('active');
      if (tool === 'spray') sprayBtn.classList.add('active');
      if (tool === 'glow') glowBtn.classList.add('active');
      if (tool === 'tube') tubeBtn.classList.add('active');
      if (tool === 'ribbon') ribbonBtn.classList.add('active');
      if (tool === 'glitter') glitterBtn.classList.add('active');
      if (tool === 'type') typeBtn.classList.add('active');
      if (tool === 'stamp') stampBtn.classList.add('active');
      if (tool === 'eyedropper') eyedropperBtn.classList.add('active');
      if (tool === 'line') lineBtn.classList.add('active');
      if (tool === 'rect') rectBtn.classList.add('active');
      if (tool === 'ellipse') ellipseBtn.classList.add('active');

      if (stampPickerRow) stampPickerRow.style.display = tool === 'stamp' ? 'flex' : 'none';
      if (shapeTextureRow) shapeTextureRow.style.display = isGTPaintShapeTool(tool) ? 'flex' : 'none';

      const brushSizeGroup = document.getElementById('gtpaint-brush-size-group');
      const fontSizeGroup = document.getElementById('gtpaint-font-size-group');
      if (brushSizeGroup) brushSizeGroup.style.display = tool === 'type' ? 'none' : 'flex';
      if (fontSizeGroup) fontSizeGroup.style.display = tool === 'type' ? 'flex' : 'none';

      canvas.style.cursor = tool === 'type' ? 'text' : tool === 'eyedropper' ? 'copy' : 'crosshair';

      // the wheel's big centre sphere always shows the active WHEEL
      // tool's icon (deck-only tools like stamp/line/rect don't live on
      // the wheel, so they leave the hub showing whatever wheel tool was
      // last active, same as the wheel's own highlight behaviour)
      const wheelToolButtons = { pencil: pencilBtn, eraser: eraserBtn, spray: sprayBtn, glow: glowBtn, tube: tubeBtn, ribbon: ribbonBtn, glitter: glitterBtn, type: typeBtn };
      const hubIcon = document.getElementById('gtpaint-wheel-hub-icon');
      const activeWheelBtn = wheelToolButtons[tool];
      if (hubIcon && activeWheelBtn) {
        const srcIcon = activeWheelBtn.querySelector('.gtpaint-tool-icon');
        if (srcIcon) hubIcon.innerHTML = srcIcon.innerHTML;
      }
    }

    function hexToRgb(hex) {
      const clean = hex.replace('#', '');
      const bigint = parseInt(clean, 16);
      return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255
      };
    }

    function lightenColor(hex, amount = 0.35) {
      const { r, g, b } = hexToRgb(hex);
      const lr = Math.round(r + (255 - r) * amount);
      const lg = Math.round(g + (255 - g) * amount);
      const lb = Math.round(b + (255 - b) * amount);
      return `rgb(${lr}, ${lg}, ${lb})`;
    }

    function darkenColor(hex, amount = 0.25) {
      const { r, g, b } = hexToRgb(hex);
      const dr = Math.round(r * (1 - amount));
      const dg = Math.round(g * (1 - amount));
      const db = Math.round(b * (1 - amount));
      return `rgb(${dr}, ${dg}, ${db})`;
    }

    // Maps pointer position to the fixed 860x520 logical drawing space,
    // regardless of the canvas's current CSS (zoom) size.
    function getCanvasPos(e) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = GTPAINT_LOGICAL_WIDTH / rect.width;
      const scaleY = GTPAINT_LOGICAL_HEIGHT / rect.height;

      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    }

    function saveGTPaintState() {
      try {
        const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
        gtPaintUndoStack.push(snapshot);

        if (gtPaintUndoStack.length > GT_PAINT_HISTORY_LIMIT) {
          gtPaintUndoStack.shift();
        }

        gtPaintRedoStack = [];
      } catch (err) {
        console.error('GT Paint history save error:', err);
      }
    }

    // undoStack[top] always holds "the canvas right before the most recent
    // action" (that's what saveGTPaintState() pushes, at the start of every
    // action). The live canvas is one action ahead of that. So: undo pops
    // that pre-action snapshot and displays it directly, while stashing the
    // live canvas (what we're leaving) onto the redo stack so redo can
    // bring it back. Redo does the mirror image.
    function restoreGTPaintState(stackFrom, stackTo) {
      if (stackFrom.length <= 1) return;

      const leaving = ctx.getImageData(0, 0, canvas.width, canvas.height);
      stackTo.push(leaving);

      const target = stackFrom.pop();
      ctx.putImageData(target, 0, 0);
    }

    function restoreRedoState() {
      if (!gtPaintRedoStack.length) return;

      const leaving = ctx.getImageData(0, 0, canvas.width, canvas.height);
      gtPaintUndoStack.push(leaving);

      const target = gtPaintRedoStack.pop();
      ctx.putImageData(target, 0, 0);
    }

    function drawPencil(from, to) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = gtPaintSize;
      ctx.strokeStyle = gtPaintColor;
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      ctx.restore();
    }

    function drawEraser(from, to) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = gtPaintSize * 1.2;
      ctx.strokeStyle = cssVar('--neutral-white');
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      ctx.restore();
    }

    function drawSpray(pos) {
      ctx.save();
      const density = Math.max(12, Math.floor(gtPaintSize * 2.6));
      const radius = gtPaintSize * 1.45;
      const { r, g, b } = hexToRgb(gtPaintColor);

      for (let i = 0; i < density; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * radius;
        const x = pos.x + Math.cos(angle) * dist;
        const y = pos.y + Math.sin(angle) * dist;
        const dot = Math.random() * (gtPaintSize * 0.18) + 0.7;

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.08 + Math.random() * 0.22})`;
        ctx.beginPath();
        ctx.arc(x, y, dot, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    function drawGlow(pos) {
      ctx.save();
      const { r, g, b } = hexToRgb(gtPaintColor);

      const grad = ctx.createRadialGradient(
        pos.x, pos.y, 0,
        pos.x, pos.y, gtPaintSize * 2.4
      );

      grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.28)`);
      grad.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, 0.16)`);
      grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, gtPaintSize * 2.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    function drawTube(from, to) {
      const angle = Math.atan2(to.y - from.y, to.x - from.x);
      const nx = Math.cos(angle + Math.PI / 2);
      const ny = Math.sin(angle + Math.PI / 2);
      const radius = gtPaintSize * 0.62;

      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.strokeStyle = darkenColor(gtPaintColor, 0.28);
      ctx.lineWidth = radius * 2.2;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();

      const grad = ctx.createLinearGradient(
        from.x - nx * radius,
        from.y - ny * radius,
        from.x + nx * radius,
        from.y + ny * radius
      );
      grad.addColorStop(0, darkenColor(gtPaintColor, 0.34));
      grad.addColorStop(0.22, gtPaintColor);
      grad.addColorStop(0.5, lightenColor(gtPaintColor, 0.55));
      grad.addColorStop(0.72, gtPaintColor);
      grad.addColorStop(1, darkenColor(gtPaintColor, 0.25));

      ctx.strokeStyle = grad;
      ctx.lineWidth = radius * 1.9;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255,255,255,0.34)';
      ctx.lineWidth = Math.max(1.5, radius * 0.42);
      ctx.beginPath();
      ctx.moveTo(from.x - nx * radius * 0.28, from.y - ny * radius * 0.28);
      ctx.lineTo(to.x - nx * radius * 0.28, to.y - ny * radius * 0.28);
      ctx.stroke();

      ctx.restore();
    }

    function drawRibbon(from, to) {
      const angle = Math.atan2(to.y - from.y, to.x - from.x);
      const nx = Math.cos(angle + Math.PI / 2);
      const ny = Math.sin(angle + Math.PI / 2);
      const width = gtPaintSize * 0.9;

      ctx.save();

      const grad = ctx.createLinearGradient(
        from.x - nx * width,
        from.y - ny * width,
        from.x + nx * width,
        from.y + ny * width
      );
      grad.addColorStop(0, lightenColor(gtPaintColor, 0.45));
      grad.addColorStop(0.35, gtPaintColor);
      grad.addColorStop(0.65, darkenColor(gtPaintColor, 0.22));
      grad.addColorStop(1, lightenColor(gtPaintColor, 0.2));

      ctx.strokeStyle = grad;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = width;
      ctx.globalAlpha = 0.82;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();

      ctx.restore();
    }

    function drawGlitter(pos) {
      ctx.save();

      for (let i = 0; i < Math.max(4, Math.floor(gtPaintSize / 3)); i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * gtPaintSize * 1.6;
        const x = pos.x + Math.cos(angle) * dist;
        const y = pos.y + Math.sin(angle) * dist;
        const size = Math.random() * 5 + 2;

        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.85)' : gtPaintColor;

        ctx.beginPath();
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size * 0.35, y - size * 0.35);
        ctx.lineTo(x + size, y);
        ctx.lineTo(x + size * 0.35, y + size * 0.35);
        ctx.lineTo(x, y + size);
        ctx.lineTo(x - size * 0.35, y + size * 0.35);
        ctx.lineTo(x - size, y);
        ctx.lineTo(x - size * 0.35, y - size * 0.35);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    }

    function drawStamp(pos) {
      const img = gtPaintStampImages[gtPaintCurrentStamp];
      if (!img || !img.complete || !img.naturalWidth) return; // not loaded yet — skip gracefully

      const w = gtPaintSize;
      const h = gtPaintSize * (img.naturalHeight / img.naturalWidth);
      ctx.save();
      ctx.drawImage(img, pos.x - w / 2, pos.y - h / 2, w, h);
      ctx.restore();
    }

    function placeStamp(pos) {
      saveGTPaintState();
      drawWithSymmetryPoint(pos, drawStamp);
    }

    function pickGTPaintColor(pos) {
      const x = Math.round(Math.min(Math.max(pos.x, 0), GTPAINT_LOGICAL_WIDTH - 1));
      const y = Math.round(Math.min(Math.max(pos.y, 0), GTPAINT_LOGICAL_HEIGHT - 1));
      const dpr = canvas.width / GTPAINT_LOGICAL_WIDTH;
      const d = ctx.getImageData(Math.round(x * dpr), Math.round(y * dpr), 1, 1).data;
      const hex = '#' + [d[0], d[1], d[2]].map(v => v.toString(16).padStart(2, '0')).join('');

      gtPaintColor = hex;
      colorInput.value = hex;
      addGTPaintRecentColor(hex);
      setTool(gtPaintLastDrawingTool);
    }

    function placeType(pos) {
      showGTPaintModal({
        title: 'Add Text',
        message: 'Enter the text to stamp onto the canvas.',
        showInput: true,
        confirmLabel: 'Add',
        onConfirm: (text) => {
          saveGTPaintState();

          ctx.save();
          ctx.fillStyle = gtPaintColor;
          ctx.font = `bold ${gtPaintFontSize}px Inter, Verdana, sans-serif`;
          ctx.textBaseline = 'top';
          ctx.shadowColor = 'rgba(255,255,255,0.25)';
          ctx.shadowBlur = 8;
          ctx.fillText(text, pos.x, pos.y);
          ctx.restore();
        }
      });
    }

    let lastPos = null;
    let shapeStartPos = null;

    function previewShape(currentPos) {
      const snapshot = gtPaintUndoStack[gtPaintUndoStack.length - 1];
      if (snapshot) ctx.putImageData(snapshot, 0, 0);

      const texFn = gtPaintShapeTexture === 'ribbon' ? drawRibbon : drawTube;
      const points = gtPaintShapePoints(gtPaintTool, shapeStartPos, currentPos);
      const savedColor = gtPaintBeginRainbowTick();
      for (let i = 0; i < points.length - 1; i++) {
        drawWithSymmetryPair(points[i], points[i + 1], texFn);
      }
      gtPaintEndRainbowTick(savedColor);
    }

    function startDrawing(e) {
      const pos = getCanvasPos(e);

      if (gtPaintTool === 'type') {
        placeType(pos);
        return;
      }

      if (gtPaintTool === 'eyedropper') {
        pickGTPaintColor(pos);
        return;
      }

      if (gtPaintTool === 'stamp') {
        placeStamp(pos);
        return;
      }

      gtPaintIsDrawing = true;
      lastPos = pos;
      saveGTPaintState();

      if (isGTPaintShapeTool(gtPaintTool)) {
        shapeStartPos = pos;
        return; // drawn on move/mouseup once there's an actual span
      }

      const savedColor = gtPaintBeginRainbowTick();
      if (gtPaintTool === 'spray') drawWithSymmetryPoint(pos, drawSpray);
      if (gtPaintTool === 'glow') drawWithSymmetryPoint(pos, drawGlow);
      if (gtPaintTool === 'glitter') drawWithSymmetryPoint(pos, drawGlitter);
      if (gtPaintTool === 'pencil') drawWithSymmetryPair(pos, pos, drawPencil);
      if (gtPaintTool === 'eraser') drawWithSymmetryPair(pos, pos, drawEraser);
      gtPaintEndRainbowTick(savedColor);
    }

    function draw(e) {
      if (!gtPaintIsDrawing) return;

      const pos = getCanvasPos(e);

      if (isGTPaintShapeTool(gtPaintTool)) {
        previewShape(pos);
        lastPos = pos;
        return;
      }

      const savedColor = gtPaintBeginRainbowTick();
      if (gtPaintTool === 'pencil') {
        drawWithSymmetryPair(lastPos, pos, drawPencil);
      } else if (gtPaintTool === 'eraser') {
        drawWithSymmetryPair(lastPos, pos, drawEraser);
      } else if (gtPaintTool === 'spray') {
        drawWithSymmetryPoint(pos, drawSpray);
      } else if (gtPaintTool === 'glow') {
        drawWithSymmetryPoint(pos, drawGlow);
      } else if (gtPaintTool === 'tube') {
        drawWithSymmetryPair(lastPos, pos, drawTube);
      } else if (gtPaintTool === 'ribbon') {
        drawWithSymmetryPair(lastPos, pos, drawRibbon);
      } else if (gtPaintTool === 'glitter') {
        drawWithSymmetryPoint(pos, drawGlitter);
      }
      gtPaintEndRainbowTick(savedColor);

      lastPos = pos;
    }

    function stopDrawing() {
      gtPaintIsDrawing = false;
      lastPos = null;
      shapeStartPos = null;
    }

    pencilBtn.addEventListener('click', () => setTool('pencil'));
    eraserBtn.addEventListener('click', () => setTool('eraser'));
    sprayBtn.addEventListener('click', () => setTool('spray'));
    glowBtn.addEventListener('click', () => setTool('glow'));
    tubeBtn.addEventListener('click', () => setTool('tube'));
    ribbonBtn.addEventListener('click', () => setTool('ribbon'));
    glitterBtn.addEventListener('click', () => setTool('glitter'));
    typeBtn.addEventListener('click', () => setTool('type'));
    stampBtn.addEventListener('click', () => setTool('stamp'));
    eyedropperBtn.addEventListener('click', () => setTool('eyedropper'));
    lineBtn.addEventListener('click', () => setTool('line'));
    rectBtn.addEventListener('click', () => setTool('rect'));
    ellipseBtn.addEventListener('click', () => setTool('ellipse'));

    if (stampPickerRow) {
      stampPickerRow.querySelectorAll('.gtpaint-stamp-swatch').forEach(btn => {
        btn.addEventListener('click', () => {
          gtPaintCurrentStamp = btn.dataset.stamp;
          stampPickerRow.querySelectorAll('.gtpaint-stamp-swatch').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        });
      });
    }

    if (shapeTextureRow) {
      shapeTextureRow.querySelectorAll('.gtpaint-shape-texture-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          gtPaintShapeTexture = btn.dataset.texture;
          shapeTextureRow.querySelectorAll('.gtpaint-shape-texture-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        });
      });
    }

    document.querySelectorAll('#window-gtpaint .gtpaint-mirror-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        gtPaintSymmetry = btn.dataset.mirror;
        document.querySelectorAll('#window-gtpaint .gtpaint-mirror-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    const rainbowBtn = document.getElementById('gtpaint-rainbow-toggle');
    if (rainbowBtn) {
      rainbowBtn.addEventListener('click', () => {
        gtPaintRainbowMode = !gtPaintRainbowMode;
        rainbowBtn.classList.toggle('active', gtPaintRainbowMode);
        rainbowBtn.textContent = gtPaintRainbowMode ? 'Rainbow: On' : 'Rainbow: Off';
      });
    }

    document.querySelectorAll('#window-gtpaint .gtpaint-bg-swatch').forEach(btn => {
      btn.addEventListener('click', () => {
        applyGTPaintBackground(btn.dataset.bg);
      });
    });

    function applyGTPaintBackground(id) {
      saveGTPaintState();
      ctx.save();
      ctx.clearRect(0, 0, GTPAINT_LOGICAL_WIDTH, GTPAINT_LOGICAL_HEIGHT);

      if (id === 'white') {
        ctx.fillStyle = cssVar('--neutral-white');
        ctx.fillRect(0, 0, GTPAINT_LOGICAL_WIDTH, GTPAINT_LOGICAL_HEIGHT);
      } else if (id !== 'transparent') {
        ctx.fillStyle = buildGTPaintBackgroundGradient(id);
        ctx.fillRect(0, 0, GTPAINT_LOGICAL_WIDTH, GTPAINT_LOGICAL_HEIGHT);
      }

      ctx.restore();
    }

    function buildGTPaintBackgroundGradient(id) {
      if (id === 'candy-sky') {
        const g = ctx.createLinearGradient(0, 0, GTPAINT_LOGICAL_WIDTH, GTPAINT_LOGICAL_HEIGHT);
        g.addColorStop(0, cssVar('--candy-pink-light'));
        g.addColorStop(1, cssVar('--xp-blue-light'));
        return g;
      }
      if (id === 'ghost-glow') {
        const g = ctx.createRadialGradient(
          GTPAINT_LOGICAL_WIDTH / 2, GTPAINT_LOGICAL_HEIGHT / 2, 0,
          GTPAINT_LOGICAL_WIDTH / 2, GTPAINT_LOGICAL_HEIGHT / 2, GTPAINT_LOGICAL_WIDTH / 1.4
        );
        g.addColorStop(0, cssVar('--ghost-glow-pink-light'));
        g.addColorStop(1, cssVar('--ghost-glow-blue'));
        return g;
      }
      if (id === 'sunset-gold') {
        const g = ctx.createLinearGradient(0, 0, 0, GTPAINT_LOGICAL_HEIGHT);
        g.addColorStop(0, cssVar('--gold-light'));
        g.addColorStop(1, cssVar('--tuna-pink-dark'));
        return g;
      }
      if (id === 'rainbow') {
        const g = ctx.createLinearGradient(0, 0, GTPAINT_LOGICAL_WIDTH, 0);
        g.addColorStop(0, cssVar('--paint-pink'));
        g.addColorStop(0.5, cssVar('--paint-cyan'));
        g.addColorStop(1, cssVar('--paint-blue'));
        return g;
      }
      return cssVar('--neutral-white');
    }

    colorInput.addEventListener('input', (e) => {
      gtPaintColor = e.target.value;
      updateColourWheelVisualsFromColor(gtPaintColor);
    });

    sizeInput.addEventListener('input', (e) => {
      gtPaintSize = parseInt(e.target.value, 10);
      sizeDisplay.textContent = gtPaintSize;
      updateGTPaintRangeFill(sizeInput);
    });
    updateGTPaintRangeFill(sizeInput);

    fontSizeInput.addEventListener('input', (e) => {
      gtPaintFontSize = parseInt(e.target.value, 10);
      fontSizeDisplay.textContent = gtPaintFontSize;
      updateGTPaintRangeFill(fontSizeInput);
    });
    updateGTPaintRangeFill(fontSizeInput);

    fillBtn.addEventListener('click', () => {
      saveGTPaintState();
      ctx.fillStyle = gtPaintColor;
      ctx.fillRect(0, 0, GTPAINT_LOGICAL_WIDTH, GTPAINT_LOGICAL_HEIGHT);
    });

    undoBtn.addEventListener('click', () => {
      restoreGTPaintState(gtPaintUndoStack, gtPaintRedoStack);
    });

    redoBtn.addEventListener('click', () => {
      restoreRedoState();
    });

    clearBtn.addEventListener('click', () => {
      if (gtPaintHasUnsavedWork() && !confirm('Clear the whole canvas? You can still Undo afterwards if you change your mind.')) {
        return;
      }
      saveGTPaintState();
      ctx.fillStyle = cssVar('--neutral-white');
      ctx.fillRect(0, 0, GTPAINT_LOGICAL_WIDTH, GTPAINT_LOGICAL_HEIGHT);
    });

    downloadBtn.addEventListener('click', () => {
      const link = document.createElement('a');
      link.download = 'gt-paint-artwork.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    });

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    window.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      startDrawing({
        clientX: touch.clientX,
        clientY: touch.clientY
      });
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      draw({
        clientX: touch.clientX,
        clientY: touch.clientY
      });
    }, { passive: false });

    window.addEventListener('touchend', stopDrawing);

    window.addEventListener('keydown', (e) => {
      // Only intercept undo/redo shortcuts while the GT Paint window is open
      const paintWindow = document.getElementById('window-gtpaint');
      if (!paintWindow || getComputedStyle(paintWindow).display === 'none') return;

      // ...and not while a modal (Type tool entry / unsaved-work warning)
      // is up over it — otherwise Ctrl+Z/Y can silently mutate the canvas
      // underneath while the user is looking at the modal instead.
      if (document.querySelector('.gtpaint-modal')) return;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const mod = isMac ? e.metaKey : e.ctrlKey;

      if (!mod) return;

      if (e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        restoreGTPaintState(gtPaintUndoStack, gtPaintRedoStack);
      }

      if ((e.key.toLowerCase() === 'y') || (e.key.toLowerCase() === 'z' && e.shiftKey)) {
        e.preventDefault();
        restoreRedoState();
      }
    });

    initGTPaintZoomControls();
    preloadGTPaintStamps();
    initGTPaintWheel();
    initGTPaintColourWheel();
    setTool('pencil');
    gtPaintInitialized = true;

    // Start at whatever "Fit" computes for the window's initial size
    setGTPaintZoom(computeGTPaintFitPercent());
  }

  document.getElementById('gtpaint-size-display').textContent = gtPaintSize;
  document.getElementById('gtpaint-font-size-display').textContent = gtPaintFontSize;
  applyGTPaintZoom();
}

// =========================
// ZOOM — continuous slider (10%–400%), plus a "Fit" shortcut.
// Zoom only ever changes the canvas's CSS display size, never the fixed
// 860x520 logical drawing resolution, so switching zoom never stretches
// or reflows anything already drawn — it's a pure, non-destructive view
// scale, same idea as zooming a photo.
// =========================

const GTPAINT_ZOOM_MIN = 10;
const GTPAINT_ZOOM_MAX = 400;

function initGTPaintZoomControls() {
  const slider = document.getElementById('gtpaint-zoom-slider');
  const fitBtn = document.getElementById('gtpaint-zoom-fit-btn');

  if (slider) {
    slider.addEventListener('input', (e) => {
      setGTPaintZoom(parseInt(e.target.value, 10));
    });
  }

  if (fitBtn) {
    fitBtn.addEventListener('click', () => {
      setGTPaintZoom(computeGTPaintFitPercent());
    });
  }
}

function computeGTPaintFitPercent() {
  const wrap = document.querySelector('#window-gtpaint .gtpaint-canvas-wrap');
  if (!wrap) return 100;

  const availW = wrap.clientWidth; // wrap has no padding — it's proportioned to the canvas's own aspect ratio
  const availH = wrap.clientHeight;
  if (availW <= 0 || availH <= 0) return gtPaintZoomPercent;

  const scale = Math.min(availW / GTPAINT_LOGICAL_WIDTH, availH / GTPAINT_LOGICAL_HEIGHT);
  return Math.max(GTPAINT_ZOOM_MIN, Math.min(GTPAINT_ZOOM_MAX, Math.round(scale * 100)));
}

function setGTPaintZoom(percent) {
  gtPaintZoomPercent = Math.max(GTPAINT_ZOOM_MIN, Math.min(GTPAINT_ZOOM_MAX, Math.round(percent)));
  applyGTPaintZoom();
}

function applyGTPaintZoom() {
  const canvas = document.getElementById('gtpaint-canvas');
  if (!canvas) return;

  const scale = gtPaintZoomPercent / 100;
  canvas.style.width = `${GTPAINT_LOGICAL_WIDTH * scale}px`;
  canvas.style.height = `${GTPAINT_LOGICAL_HEIGHT * scale}px`;

  const slider = document.getElementById('gtpaint-zoom-slider');
  if (slider) {
    slider.value = gtPaintZoomPercent;
    updateGTPaintRangeFill(slider);
  }

  const display = document.getElementById('gtpaint-zoom-display');
  if (display) display.textContent = `${gtPaintZoomPercent}%`;
}

// =========================
// THE GADGET'S CONTROL WHEEL — a real rotary dial (drag or scroll to
// turn, snaps to detents). Doesn't touch tool-switching logic above at
// all: turning the dial (or clicking a rim icon directly) just calls
// .click() on the existing #gtpaint-<tool> button, which already runs
// setTool() via the listener registered earlier in initGTPaint(). This
// function only owns the *rotation*, never tool state.
//
// Angle convention: 0deg = 12 o'clock. --r on each rim button is set in
// index.html (0, 45, 90...315) assuming the same convention, matched by
// the button's own `transform: rotate(var(--r)) translate(0, -96px)` in
// aero.css (translate on the negative Y axis = "up" before the rotate
// carries it around the rim).
// =========================

function initGTPaintWheel() {
  const wheel = document.querySelector('.gtpaint-wheel');
  const ring = document.querySelector('.gtpaint-wheel-ring');
  if (!wheel || !ring || wheel.dataset.wheelInit) return;
  wheel.dataset.wheelInit = 'true';

  const tools = Array.from(ring.querySelectorAll('.gtpaint-tool'));
  const toolNames = tools.map(t => t.id.replace('gtpaint-', ''));
  const step = 360 / toolNames.length;

  let angle = 0; // current ring rotation, degrees, 0 = initial (pencil at top)
  let dragging = false;
  let lastPointerAngle = 0;

  function pointerAngle(clientX, clientY) {
    const rect = wheel.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    // atan2 is 0=right/90=down in screen space; +90 shifts it to 0=up,
    // matching the --r convention used by the rim buttons.
    return Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI) + 90;
  }

  function setRingTransform(animated) {
    ring.style.transition = animated ? 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none';
    ring.style.transform = `rotate(${angle}deg)`;
  }

  function indexAtTop() {
    const normalized = ((-angle % 360) + 360) % 360;
    return Math.round(normalized / step) % toolNames.length;
  }

  function snapToIndex(idx, animated) {
    angle = -idx * step;
    setRingTransform(animated !== false);
  }

  function activateIndex(idx) {
    const name = toolNames[((idx % toolNames.length) + toolNames.length) % toolNames.length];
    const btn = document.getElementById('gtpaint-' + name);
    if (btn) btn.click();
  }

  wheel.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.gtpaint-tool')) return; // a direct icon click, not a drag
    dragging = true;
    wheel.classList.add('gt-wheel-dragging');
    lastPointerAngle = pointerAngle(e.clientX, e.clientY);
    ring.style.transition = 'none';
    try { wheel.setPointerCapture(e.pointerId); } catch (err) {}
  });

  wheel.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const current = pointerAngle(e.clientX, e.clientY);
    // Accumulate the per-frame delta rather than diffing against the
    // drag's start angle — pointerAngle() comes from atan2, which jumps
    // from +180 to -180 at screen-left ("9 o'clock" on the wheel), and a
    // start-relative diff would carry that ~360° jump straight into
    // `angle`. Unwrapping each small delta into (-180, 180] first avoids it.
    let delta = current - lastPointerAngle;
    delta = ((delta + 180) % 360 + 360) % 360 - 180;
    angle += delta;
    lastPointerAngle = current;
    ring.style.transform = `rotate(${angle}deg)`;
  });

  function endDrag() {
    if (!dragging) return;
    dragging = false;
    wheel.classList.remove('gt-wheel-dragging');
    const idx = indexAtTop();
    snapToIndex(idx, true);
    activateIndex(idx);
  }

  wheel.addEventListener('pointerup', endDrag);
  wheel.addEventListener('pointercancel', endDrag);

  wheel.addEventListener('wheel', (e) => {
    e.preventDefault();
    const dir = e.deltaY > 0 ? 1 : -1;
    const idx = indexAtTop() + dir;
    snapToIndex(idx, true);
    activateIndex(idx);
  }, { passive: false });

  // Clicking a rim icon directly (no drag) still spins that tool to 12
  tools.forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      if (dragging) return;
      snapToIndex(idx, true);
    });
  });
}

// =========================
// THE GADGET'S COLOUR WHEEL — a STATIC rainbow ring (no rotation): click
// or drag anywhere on it and the hue is computed directly from the
// angle between the wheel's centre and the pointer, matching whatever
// hue is actually under the pointer (0deg/12 o'clock = red, clockwise,
// same convention as the ring's conic-gradient). The centre orb is a
// separate control — dragging it vertically adjusts lightness. Double-
// clicking the orb opens the native #gtpaint-color input for full
// saturation/lightness precision.
// =========================

function initGTPaintColourWheel() {
  const wheel = document.querySelector('.gtpaint-colour-wheel');
  const ring = document.getElementById('gtpaint-colour-wheel-ring');
  const hub = document.getElementById('gtpaint-colour-wheel-hub');
  const colorInput = document.getElementById('gtpaint-color');
  if (!wheel || !ring || !hub || !colorInput || wheel.dataset.wheelInit) return;
  wheel.dataset.wheelInit = 'true';

  const SATURATION = 85;

  function applyColor() {
    const hex = gtPaintHslToHex(gtPaintWheelHue, SATURATION, gtPaintWheelLightness);
    gtPaintColor = hex;
    colorInput.value = hex;
    updateColourWheelVisualsFromColor(hex);
  }

  // ---- ring: click or drag anywhere picks that angle's hue directly ----
  let ringDragging = false;

  function hueFromPointer(clientX, clientY) {
    const rect = ring.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const deg = Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI) + 90;
    return ((deg % 360) + 360) % 360;
  }

  ring.addEventListener('pointerdown', (e) => {
    ringDragging = true;
    gtPaintWheelHue = hueFromPointer(e.clientX, e.clientY);
    applyColor();
    // best-effort: keeps the drag tracking even if the pointer leaves the
    // ring mid-gesture. Not critical to the click-picks-hue behaviour
    // above, so a failure here (e.g. no active pointer session) shouldn't
    // stop the colour from having already been picked.
    try { ring.setPointerCapture(e.pointerId); } catch (err) {}
  });

  ring.addEventListener('pointermove', (e) => {
    if (!ringDragging) return;
    gtPaintWheelHue = hueFromPointer(e.clientX, e.clientY);
    applyColor();
  });

  function endRingDrag() { ringDragging = false; }
  ring.addEventListener('pointerup', endRingDrag);
  ring.addEventListener('pointercancel', endRingDrag);

  ring.addEventListener('wheel', (e) => {
    e.preventDefault();
    gtPaintWheelHue = ((gtPaintWheelHue + (e.deltaY > 0 ? 6 : -6)) % 360 + 360) % 360;
    applyColor();
  }, { passive: false });

  // ---- orb: vertical drag adjusts lightness; double-click opens the
  // native picker for full precision. A drag never fires the dblclick
  // (movement beyond a small threshold marks the gesture as a drag). ----
  let hubDragging = false;
  let hubDragStartY = 0;
  let hubDragStartLightness = 0;
  let hubMoved = false;

  hub.addEventListener('pointerdown', (e) => {
    hubDragging = true;
    hubMoved = false;
    hubDragStartY = e.clientY;
    hubDragStartLightness = gtPaintWheelLightness;
    hub.classList.add('gt-hub-dragging');
    try { hub.setPointerCapture(e.pointerId); } catch (err) {}
  });

  hub.addEventListener('pointermove', (e) => {
    if (!hubDragging) return;
    const deltaY = e.clientY - hubDragStartY;
    if (Math.abs(deltaY) > 3) hubMoved = true;
    // dragging up = lighter, down = darker; wheel height ~ full lightness range over its own diameter
    const rect = hub.getBoundingClientRect();
    const range = Math.max(rect.height * 2.2, 80);
    const deltaLightness = -(deltaY / range) * 100;
    gtPaintWheelLightness = Math.max(4, Math.min(96, hubDragStartLightness + deltaLightness));
    applyColor();
  });

  function endHubDrag() {
    hubDragging = false;
    hub.classList.remove('gt-hub-dragging');
  }
  hub.addEventListener('pointerup', endHubDrag);
  hub.addEventListener('pointercancel', endHubDrag);

  hub.addEventListener('dblclick', () => {
    colorInput.click();
  });

  // Initialise from whatever colour is already selected (defaults or a
  // prior session) rather than resetting it on open.
  const initialHsl = gtPaintHexToHsl(gtPaintColor);
  gtPaintWheelHue = initialHsl.h;
  gtPaintWheelLightness = initialHsl.l;
  updateColourWheelVisualsFromColor(gtPaintColor);
}
