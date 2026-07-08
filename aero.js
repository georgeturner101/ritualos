// =========================
// AERO ENVIRONMENT — Phase 1
// =========================
// Sky time-of-day system. Plain global scope, same pattern as script.js /
// gtpaint.js. Everything here is additive/decorative — it never touches
// window logic, games, or content.

const AERO_REDUCED_MOTION =
  window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function getAeroTimeOfDay(date) {
  const h = date.getHours() + date.getMinutes() / 60;
  if (h >= 5 && h < 7.5) return 'dawn';
  if (h >= 7.5 && h < 17) return 'day';
  if (h >= 17 && h < 19.5) return 'golden';
  return 'night';
}

function applyAeroTimeOfDay() {
  const tod = getAeroTimeOfDay(new Date());
  document.body.classList.remove('aero-time-dawn', 'aero-time-day', 'aero-time-golden', 'aero-time-night');
  document.body.classList.add(`aero-time-${tod}`);
}

// Smooth 0..1 darkness curve over the 24h clock — 0 at noon (brightest),
// 1 at midnight (darkest) — used to grade the video background continuously
// rather than jumping between the four dawn/day/golden/night buckets above.
function getAeroDarkness(date) {
  const h = date.getHours() + date.getMinutes() / 60;
  const radians = (h / 24) * Math.PI * 2;
  return (Math.cos(radians) + 1) / 2;
}

function applyAeroDarkness() {
  const darkness = getAeroDarkness(new Date());
  document.documentElement.style.setProperty('--aero-darkness', darkness.toFixed(3));
}

function initAeroSky() {
  applyAeroTimeOfDay();
  applyAeroDarkness();
  // Re-check occasionally so a long-open tab crosses dawn/day/golden/night
  // boundaries live — this is the "reason to come back" mechanic.
  setInterval(() => {
    applyAeroTimeOfDay();
    applyAeroDarkness();
  }, 60 * 1000);
}

window.addEventListener('load', initAeroSky);
