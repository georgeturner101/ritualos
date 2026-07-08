// =========================================================
// CURSOR FX — canvas-based particle trail + click shockwave
// =========================================================
// Single full-screen canvas + one requestAnimationFrame loop, instead
// of a DOM <div> per particle (the old approach — see CHANGES.md).
//
// Two distinct behaviours, per explicit feedback:
//  - TRAIL: a moving glitter wand. Stars pop outward from the cursor
//    tip, then gravity takes over and they drift down like falling
//    snow/confetti — not a faint velocity-inherited "exhaust".
//  - CLICK: a real physics burst (kept as-is — this was already right).
//
// Palette is deliberately narrow — baby pink + pale blue, matching the
// original star.png art and the site's ghost-glow tokens. A wider
// rainbow palette was tried and rejected as "clown-like"; stay within
// this family for any future tuning.
// =========================================================

(function () {
  const prefersReducedMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function cssVar(name, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  window.addEventListener('load', init);

  function init() {
    const canvas = document.createElement('canvas');
    canvas.id = 'cursor-fx-canvas';
    Object.assign(canvas.style, {
      position: 'fixed',
      inset: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: '9999'
    });
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let dpr = 1;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    // the actual star sprite used everywhere else on the site (baby
    // pink edge, pale blue centre) — drawn via drawImage, not a
    // procedural shape, so trail/burst stars look exactly like "the
    // stars we had before"
    const starImg = new Image();
    starImg.src = 'icons/star.png';
    let starReady = false;
    starImg.onload = () => { starReady = true; };

    // narrow baby-pink/pale-blue family only
    const DOT_COLOR_A = cssVar('--ghost-glow-pink-dark', '#ffccff');
    const DOT_COLOR_B = cssVar('--ghost-glow-blue', '#c0eaff');
    const PINK_TINTS = [
      cssVar('--ghost-glow-pink-light', '#ffe6ff'),
      cssVar('--ghost-glow-pink-dark', '#ffccff'),
      cssVar('--candy-pink-light', '#ffe9f7')
    ];
    function pickTint() {
      return PINK_TINTS[(Math.random() * PINK_TINTS.length) | 0];
    }

    const MAX_PARTICLES = prefersReducedMotion ? 90 : 480;
    let particles = [];
    let rings = [];

    // ---- TRAIL: glitter-wand pop + snowfall drift ----
    function spawnTrailParticle(x, y) {
      if (particles.length >= MAX_PARTICLES) return;

      // pop outward from the cursor tip in a random direction, like
      // glitter flicked off a wand — not inherited from cursor velocity
      const angle = Math.random() * Math.PI * 2;
      const popSpeed = 0.5 + Math.random() * 2.0;

      particles.push({
        x,
        y,
        vx: Math.cos(angle) * popSpeed,
        vy: Math.sin(angle) * popSpeed - 0.6, // slight initial upward pop before gravity wins
        life: 1,
        decay: 0.0055 + Math.random() * 0.006, // lives long enough to visibly fall
        size: 5 + Math.random() * 7,
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.05,
        swayPhase: Math.random() * Math.PI * 2,
        swayAmount: 0.015 + Math.random() * 0.02,
        tint: pickTint(),
        kind: Math.random() < 0.78 ? 'star' : 'glow',
        drag: 0.985,
        gravity: 0.018 + Math.random() * 0.012 // steady snow-like fall
      });
    }

    // ---- CLICK: physics burst — unchanged mechanics, restyled colour ----
    function spawnBurst(x, y) {
      const count = prefersReducedMotion ? 16 : 44;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.35;
        const speed = 2.6 + Math.random() * 4.6;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          decay: 0.011 + Math.random() * 0.009,
          size: 5 + Math.random() * 7,
          rotation: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 0.3,
          swayPhase: 0,
          swayAmount: 0,
          tint: pickTint(),
          kind: Math.random() < 0.55 ? 'star' : 'glow',
          drag: 0.94,
          gravity: 0.045
        });
      }
      rings.push({ x, y, radius: 4, life: 1, color: DOT_COLOR_A, delay: 0 });
      rings.push({ x, y, radius: 4, life: 1, color: DOT_COLOR_B, delay: 6 });
    }

    let cursorX = window.innerWidth / 2;
    let cursorY = window.innerHeight / 2;

    // GT Paint and Birdsweeper need a clean, undistracted cursor (fine
    // drawing precision / a busy grid to read) — no trail, no click
    // burst, while the pointer is over either window.
    function isCursorFxSuppressed(target) {
      return !!(target && target.closest && target.closest('#window-gtpaint, #window-game'));
    }

    // much denser than before — this is meant to read as a glitter wand,
    // not a faint sparkle exhaust
    let lastSpawnTime = 0;
    const SPAWN_INTERVAL_MS = 12;
    let lastMoveX = cursorX;
    let lastMoveY = cursorY;
    let lastMoveTime = performance.now();

    // emission scales with how fast the cursor is actually moving — a
    // slow drag emits next to nothing, a fast flick emits a proper
    // glitter burst. Speed is in px/ms; ~2 px/ms is already a brisk
    // flick, so that's where the curve tops out.
    const SPEED_FOR_MAX_EMISSION = 2.0;
    const MAX_TRAIL_PER_SPAWN = 18; // tripled — fast flicks now emit 3x as many particles

    document.addEventListener('mousemove', (e) => {
      cursorX = e.clientX;
      cursorY = e.clientY;

      const now = performance.now();
      const dt = Math.max(1, now - lastMoveTime);
      const dx = e.clientX - lastMoveX;
      const dy = e.clientY - lastMoveY;
      const speed = Math.sqrt(dx * dx + dy * dy) / dt;
      lastMoveX = e.clientX;
      lastMoveY = e.clientY;
      lastMoveTime = now;

      if (now - lastSpawnTime < SPAWN_INTERVAL_MS) return;
      lastSpawnTime = now;

      if (isCursorFxSuppressed(e.target)) return;

      if (prefersReducedMotion) {
        if (speed > 0.25) spawnTrailParticle(e.clientX, e.clientY);
        return;
      }

      // squared falloff — reads as "way less" at slow speeds and ramps
      // up quickly once the cursor is actually flicking around, rather
      // than a flat linear response
      const speedNorm = Math.min(1, speed / SPEED_FOR_MAX_EMISSION);
      const burstCount = Math.round(speedNorm * speedNorm * MAX_TRAIL_PER_SPAWN);
      for (let i = 0; i < burstCount; i++) {
        spawnTrailParticle(e.clientX, e.clientY);
      }
    });

    document.addEventListener('click', (e) => {
      if (isCursorFxSuppressed(e.target)) return;
      spawnBurst(e.clientX, e.clientY);
    });

    function drawStarShape(size, color, alpha) {
      // fallback procedural star, only used if the sprite hasn't
      // finished loading yet
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const outerAngle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
        const innerAngle = outerAngle + Math.PI / 5;
        const ox = Math.cos(outerAngle) * size;
        const oy = Math.sin(outerAngle) * size;
        const ix = Math.cos(innerAngle) * size * 0.45;
        const iy = Math.sin(innerAngle) * size * 0.45;
        if (i === 0) ctx.moveTo(ox, oy);
        else ctx.lineTo(ox, oy);
        ctx.lineTo(ix, iy);
      }
      ctx.closePath();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.fill();
    }

    function frame() {
      requestAnimationFrame(frame);
      if (document.hidden) return;

      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

      // soft baby-pink glow directly under the cursor
      if (!prefersReducedMotion) {
        const glow = ctx.createRadialGradient(cursorX, cursorY, 0, cursorX, cursorY, 22);
        glow.addColorStop(0, 'rgba(255, 214, 245, 0.14)');
        glow.addColorStop(1, 'rgba(255, 214, 245, 0)');
        ctx.globalAlpha = 1;
        ctx.fillStyle = glow;
        ctx.fillRect(cursorX - 22, cursorY - 22, 44, 44);
      }

      // shockwave rings from clicks
      for (let i = rings.length - 1; i >= 0; i--) {
        const r = rings[i];
        if (r.delay > 0) {
          r.delay--;
          continue;
        }
        r.radius += 3.4;
        r.life -= 0.028;
        if (r.life <= 0) {
          rings.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = r.color;
        ctx.globalAlpha = r.life * 0.5;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // trail + burst particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        p.vx *= p.drag;
        p.vy *= p.drag;
        p.vy += p.gravity;

        // gentle side-to-side flutter for the falling-snowflake feel
        // (burst particles have swayAmount 0, so this is a no-op there)
        p.x += p.vx + Math.sin(p.life * 6 + p.swayPhase) * p.swayAmount;
        p.y += p.vy;

        p.rotation += p.spin;
        p.life -= p.decay;

        if (p.life <= 0 || p.y > (canvas.height / dpr) + 40) {
          particles.splice(i, 1);
          continue;
        }

        // fade in for the first sliver of life, hold, then fade out —
        // reads less like "instantly there" and more like it drifted
        // into view
        const alpha = p.life > 0.85 ? (1 - p.life) / 0.15 : Math.min(1, p.life / 0.4);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        if (p.kind === 'star') {
          // ¾ the size of the original trail stars
          if (starReady) {
            const s = p.size * 2.1 * 0.75;
            ctx.globalAlpha = alpha;
            ctx.drawImage(starImg, -s / 2, -s / 2, s, s);
          } else {
            drawStarShape(p.size * 0.75, p.tint, alpha);
          }
        } else {
          // ¼ the size of the original trail circles — scale both the
          // gradient's own radius and the visible arc by the same
          // factor so the fade still looks like the same gradient, just
          // smaller, instead of sampling only its innermost sliver
          const CIRCLE_SCALE = 0.25;
          const g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 1.3 * CIRCLE_SCALE);
          g.addColorStop(0, DOT_COLOR_A);
          g.addColorStop(1, DOT_COLOR_B);
          ctx.globalAlpha = alpha * 0.85;
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.7 * CIRCLE_SCALE, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }

    requestAnimationFrame(frame);
  }
})();
