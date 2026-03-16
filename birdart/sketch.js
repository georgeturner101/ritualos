// bird-soul-orb.js
// p5.js + p5.sound particle orb (2D render of a thick 3D sphere)
// Organic “vein/river” geometry, strong audio focus per bird, and living motion fields.
// Drop this into your existing p5 site (global mode). Assumes #birdSelect exists and p5.sound is loaded.

/* =================== Globals / Architecture =================== */
let N = 6000;                      // raise to 8000–12000 if smooth
let centerX, centerY, D;           // canvas center + min dimension

// typed arrays (struct-of-arrays)
let posX, posY, velX, velY, accX, accY, sizeA, nOX, nOY, flicker, rBias;

// lightweight depth & volumetric distribution channels
let zPos, zVel, zAcc, zHome, zSeed;
let rFrac; // 0..1 per-particle radial fraction into the shell (0=surface, 1=deep inside)

// audio / pipeline
let fft, birdSound, started = false, currentBird = "tui";
let soulSettings = {}, colorSettings = {};
let globalEnergy = 0, t = 0;

// smoothed bands (EMA)
let sBass = 0, sMid = 0, sTreble = 0;
const ATTACK = 0.35, DECAY = 0.08;

// spectral flux onset
let prevSpec = null;        // Uint8Array clone of fft.analyze()
let onset = 0;

// auto-gain (keeps soft birds lively and loud birds tamed)
let loudnessEMA = 60;       // starting point
const LOUD_EMA_ALPHA = 0.05;

// focused energy (per-bird EQ mask) for noise-gated reactivity
let sFocus = 0;             // smoothed focused energy (0..255)

// slow global spin to avoid fixed angular attractors
let thetaSpin = 0;

/* =================== p5 Lifecycle =================== */
function preload() {
  soundFormats('mp3', 'wav', 'ogg');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  D = Math.min(width, height);
  centerX = width * 0.5;
  centerY = height * 0.5;

  fft = new p5.FFT(0.8, 1024); // smoothing, bins
  setupSoulSettings();
  setupColorSettings();
  initParticles();

  const selectMenu = document.getElementById('birdSelect');
  if (selectMenu) {
    currentBird = selectMenu.value || "tui";
    selectMenu.addEventListener('change', function () {
      currentBird = this.value;
      if (started) playBirdSound(currentBird);
    });
  }

  background(0);
}

function initParticles() {
  posX   = new Float32Array(N);
  posY   = new Float32Array(N);
  velX   = new Float32Array(N);
  velY   = new Float32Array(N);
  accX   = new Float32Array(N);
  accY   = new Float32Array(N);
  sizeA  = new Float32Array(N);
  nOX    = new Float32Array(N);
  nOY    = new Float32Array(N);
  flicker= new Float32Array(N);
  rBias  = new Float32Array(N);

  zPos   = new Float32Array(N);
  zVel   = new Float32Array(N);
  zAcc   = new Float32Array(N);
  zHome  = new Float32Array(N);
  zSeed  = new Float32Array(N);

  rFrac  = new Float32Array(N);

  const Rseed = D * 0.34;
  for (let i = 0; i < N; i++) {
    const ang = Math.random() * TWO_PI;
    const jitter = (Math.random() * 2 - 1) * (D * 0.03);
    const r   = Rseed + jitter;
    posX[i] = centerX + Math.cos(ang) * r;
    posY[i] = centerY + Math.sin(ang) * r;

    velX[i] = velY[i] = accX[i] = accY[i] = 0;
    sizeA[i] = 0.85 + Math.random() * 0.8;
    nOX[i] = Math.random() * 1000;
    nOY[i] = Math.random() * 1000;
    flicker[i] = 0.5;

    // distribute across shell thickness (slightly biased interior)
    rFrac[i] = Math.pow(Math.random(), 0.6); // 0..1, more mass inside
    rBias[i] = (Math.random() * 2 - 1) * (D * 0.02); // ±2% of D

    // depth seeds
    zHome[i] = (Math.random() * 2 - 1);        // [-1, 1]
    zPos[i]  = zHome[i] * (D * 0.08);          // start with some depth
    zVel[i] = zAcc[i] = 0;
    zSeed[i]= Math.random() * 1000;
  }
  prevSpec = new Uint8Array(fft.analyze().length);
}

function draw() {
  background(0);

  if (!started) {
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(28);
    textFont('Inter');
    textStyle(BOLD);
    text('CLICK TO START', width / 2, height / 2);
    return;
  }

  // ---- audio ----
  const spec = fft.analyze(); // Uint8Array length=1024
  const bass   = clamp(fft.getEnergy(20, 160), 0, 255);
  const mid    = clamp(fft.getEnergy(160, 2000), 0, 255);
  const treble = clamp(fft.getEnergy(2000, 8000), 0, 255);

  // per-bird focused energy (EQ)
  const eq = (soulSettings[currentBird] || soulSettings.tui).focus;
  const f1 = clamp(fft.getEnergy(eq[0].lo, eq[0].hi), 0, 255) * eq[0].w;
  const f2 = clamp(fft.getEnergy(eq[1].lo, eq[1].hi), 0, 255) * eq[1].w;
  const fDen = Math.max(eq[0].w + eq[1].w, 1e-6);
  const focusRaw = (f1 + f2) / fDen;
  sFocus = smoothBand(sFocus, focusRaw);

  // smooth bands (attack/decay)
  sBass   = smoothBand(sBass, bass);
  sMid    = smoothBand(sMid, mid);
  sTreble = smoothBand(sTreble, treble);

  // spectral flux onset (positive changes only)
  let flux = 0;
  for (let i = 0; i < spec.length; i++) {
    const d = spec[i] - prevSpec[i];
    if (d > 0) flux += d;
    prevSpec[i] = spec[i];
  }

  // EMA overall loudness for auto-gain
  const total = (bass + mid + treble) / 3;
  loudnessEMA = lerp(loudnessEMA, total, LOUD_EMA_ALPHA);
  const globalBefore = globalEnergy;
  globalEnergy = lerp(globalEnergy, total, 0.25);

  // onset from flux or strong jump (focus-aware)
  const fluxNorm = flux / 800.0;
  const focusJump = Math.max(0, focusRaw - sFocus) * 0.8;
  if (fluxNorm > 0.9 || (total - globalBefore) > 18 || focusJump > 12) onset = 1.0;
  onset *= 0.90;

  // auto-gain normalize
  const reactGain = clamp(160 / (loudnessEMA + 10), 0.7, 2.2);

  // focus gate (suppress background noise)
  const focusGate = smoothstep(0.18, 0.45, sFocus / 255);

  t += 0.0048;
  thetaSpin += 0.0013 * (0.55 + 0.30 * map01(sMid) + 0.25 * map01(sTreble)); // slow evolving spin

  // ---- visuals mapping ----
  blendMode(ADD);
  noStroke();

  const set = soulSettings[currentBird] || soulSettings.tui;
  const col = colorSettings[currentBird] || colorSettings.tui;

  // normalized bands with gate
  const B = pow2(map01(sBass)   * reactGain) * clamp(0.65 + 0.7 * focusGate, 0.65, 1.35) * clamp(1.0 + onset * 0.15, 1.0, 1.3);
  const M = pow2(map01(sMid)    * reactGain) * clamp(0.65 + 0.7 * focusGate, 0.65, 1.35);
  const T = pow2(map01(sTreble) * reactGain) * clamp(0.65 + 0.7 * focusGate, 0.65, 1.35);

  // advance per-bird phases (rotating petals)
  set.phiB += set.rotSpeed * 0.36;
  set.phiM += set.rotSpeed * 0.62;
  set.phiT += set.rotSpeed * 0.96;
  set.phiV += set.rotSpeed * set.veinPhase; // veins phase

  // base radius (screen scaled) + bass breathing + onset superbloom (gated by focus)
  const R0 = D * (0.34 + 0.14 * B * set.bassInflate) * (1.0 + onset * 0.10 * focusGate);

  // shell thickness (bigger to keep interior full)
  const band = Math.max(D * 0.22, (D * 0.12) + M * (D * 0.20));

  // force scalars
  const kSpring = set.spring * 1.00;
  const twirlK  = set.twirl * (0.10 + 1.0 * M);
  const waveK   = set.wave  * (0.08 + 0.9 * B);
  const swirlK  = 0.40 + set.swirl * 0.7;
  const flareK  = (sTreble > 70 ? (T * set.trebleFlare * 0.55 * focusGate) : 0);
  const chaosK  = ((globalEnergy > 210 ? set.chaos : 0) + onset * set.chaos * 0.55) * 0.75 * focusGate;
  const stretchK= set.stretchGain * (0.22 + 0.9 * T);

  // bounds to keep orb fully on-screen
  const RMIN = D * 0.18;
  const RMAX = D * 0.46;

  // visuals scale
  const brightnessBase = 155 + map01(globalEnergy) * 120;
  const sizeBase       = 1.0 + map01(globalEnergy) * 1.15;

  // keep COM centered without shrinking
  softRecenter(0.010);

  // precompute depth scale for shading
  const maxDepth = band * 0.75 + R0 * 0.40;

  for (let i = 0; i < N; i++) {
    accX[i] = 0; accY[i] = 0; zAcc[i] = 0;

    let dx = posX[i] - centerX;
    let dy = posY[i] - centerY;
    let r  = Math.hypot(dx, dy) + 1e-6;
    let ux = dx / r, uy = dy / r;

    let theta = Math.atan2(dy, dx);
    const phiOff = (nOX[i] * 0.1234567) % 1 * TWO_PI;
    const th = theta + thetaSpin + 0.35 * phiOff;

    // ---- Surface field (Rsurf) with petals, fold, and mild harmonics ----
    const bloom   = set.ampB * 0.8 * B * Math.cos(set.petB * th + set.phiB);
    const ripple  = set.ampM * 0.8 * M * Math.cos(set.petM * th + set.phiM);
    const spike   = set.ampT * 0.7 * T * Math.cos(set.petT * th + set.phiT);
    const fold    = set.foldAmt * 0.8 * Math.cos(2 * th + set.phiM * 0.5) * (0.3 + 0.7 * M);
    const harm2   = set.geomH2 * 0.6 * M * Math.cos((set.petM * 2) * th + set.phiM * 0.7);
    const harm4   = set.geomH4 * 0.5 * T * Math.cos(4.0 * th + set.phiT * 0.9);
    const Rsurf   = R0 + bloom + ripple + spike + fold + harm2 + harm4;

    // ---- Organic “vein” field (river-like channels) ----
    // Multiple axial ridges that guide flow and form natural struts.
    // We aggregate K vein lobes using a soft ridge: ridge = ((cos(delta)*0.5+0.5)^sharp).
    // Tangential sign via sin(delta) pulls along veins; radial term deepens channels.
    let veinRad = 0, veinTan = 0;
    const K = set.veins | 0; // small integer 3..8
    const sharp = set.veinSharp; // 1.5..3.5
    const phase = set.phiV;
    const baseK = TWO_PI / K;
    for (let k = 0; k < K; k++) {
      const thetaK = k * baseK + phase;
      const delta = wrapPI(th - thetaK);
      const c = Math.cos(delta);
      const s = Math.sin(delta);
      const ridge = Math.pow((c * 0.5 + 0.5), sharp); // 0..1 peak at center
      veinRad += ridge;
      veinTan += s * ridge;
    }
    // normalize by K to keep amplitudes consistent
    veinRad /= K; veinTan /= K;

    // ---- Volumetric target: move inside the shell by per-particle fraction ----
    let R3 = Rsurf - (band * 0.62 * rFrac[i]) + rBias[i] * 0.5;
    R3 = clamp(R3, RMIN * 0.92, RMAX);

    // ---- Depth (z) dynamics ----
    const zAmp = (band * 0.60) * (0.6 + 0.6 * M + 0.3 * B);
    // let depth preference also align with veins a bit (feels like “roots”)
    const zVeinBias = (veinRad - 0.5) * band * 0.10;
    const zPref = zHome[i] * zAmp + zVeinBias;
    zAcc[i] += (zPref - zPos[i]) * 0.020;
    const zN = (noise(zSeed[i] + t * 0.6, nOY[i] * 0.17 - t * 0.4) - 0.5);
    zAcc[i] += zN * swirlK * 0.45;
    if (flareK > 0 && (i & 63) === 0) zAcc[i] += (Math.random() - 0.5) * flareK * 0.6;

    zVel[i] = clampMag(zVel[i] + zAcc[i], 5.0);
    zVel[i] *= set.drag;
    zPos[i] += zVel[i];
    const zLimit = RMAX * 0.95;
    if (zPos[i] > zLimit) { zPos[i] = zLimit; zVel[i] *= 0.9; }
    if (zPos[i] < -zLimit){ zPos[i] = -zLimit; zVel[i] *= 0.9; }

    // ---- Project 3D radius to planar target ----
    const rTarget = Math.sqrt(Math.max(R3 * R3 - zPos[i] * zPos[i], 1.0));

    // ---- Band spring toward planar target (thick body, not rim) ----
    const delta = (rTarget - r) / (band * 0.5);
    const soft  = Math.tanh(delta);
    const dynK  = kSpring * (0.95 + 0.55 * Math.min(1, Math.abs(delta)));
    accX[i] += ux * (soft * dynK * band);
    accY[i] += uy * (soft * dynK * band);

    // ---- Motion fields to enhance geometry & flow ----
    const tx = -uy, ty = ux; // tangent unit

    // traveling wave + angular diffusion
    const wave = waveK * Math.sin(set.petM * th + t * 2.0 + nOX[i] * 0.01);
    const angDiff = (noise(nOX[i] * 0.9 + t * 0.7, nOY[i] * 0.8 - t * 0.5) - 0.5) * (0.35 + 0.65 * M);

    // vein-driven tangential & radial guidance (natural “river” flow)
    const veinTanK = (0.6 + 1.2 * M) * set.veinTanGain;
    const veinRadK = (0.3 + 0.9 * B) * set.veinRadGain;

    accX[i] += tx * (twirlK + wave + angDiff * 0.45 + veinTan * veinTanK);
    accY[i] += ty * (twirlK + wave + angDiff * 0.45 + veinTan * veinTanK);

    accX[i] += ux * (veinRad * veinRadK);
    accY[i] += uy * (veinRad * veinRadK);

    // gradient circulation around petals (rivers) — mild to avoid pinning
    const dR_dTheta =
      -set.ampB * 0.8 * B * set.petB * Math.sin(set.petB * th + set.phiB) +
      -set.ampM * 0.8 * M * set.petM * Math.sin(set.petM * th + set.phiM) +
      -set.ampT * 0.7 * T * set.petT * Math.sin(set.petT * th + set.phiT) +
      -2.0 * set.foldAmt * 0.8 * Math.sin(2 * th + set.phiM * 0.5) * (0.3 + 0.7 * M);
    accX[i] += tx * dR_dTheta * (set.tangentGain * 0.014);
    accY[i] += ty * dR_dTheta * (set.tangentGain * 0.014);

    // curl-noise advection for living motion
    const c = curlNoise(nOX[i] * 0.015 + t * 0.3, nOY[i] * 0.015 - t * 0.25);
    accX[i] += c.x * (0.4 + 0.9 * (0.6 * M + 0.4 * T));
    accY[i] += c.y * (0.4 + 0.9 * (0.6 * M + 0.4 * T));

    // treble stretch (gentle) + bass breath
    accX[i] += ux * stretchK * 0.45 * Math.cos(set.petT * th + set.phiT);
    accY[i] += uy * stretchK * 0.45 * Math.cos(set.petT * th + set.phiT);
    accX[i] += ux * (B * set.bassBreath * 0.5);
    accY[i] += uy * (B * set.bassBreath * 0.5);

    // sparse flares & chaos
    if (flareK > 0 && (i & 31) === 0) {
      const ra = (phiOff + t * 7.0) % TWO_PI;
      accX[i] += Math.cos(ra) * flareK * 0.85;
      accY[i] += Math.sin(ra) * flareK * 0.85;
    }
    if (chaosK > 0 && (i & 63) === 0) {
      const ra = (phiOff * 1.7 + t * 5.0) % TWO_PI;
      accX[i] += Math.cos(ra) * chaosK * 0.7;
      accY[i] += Math.sin(ra) * chaosK * 0.7;
    }

    // containment
    if (r > RMAX) {
      const over = r - RMAX;
      const pullBack = 0.07 * over;
      accX[i] -= ux * pullBack;
      accY[i] -= uy * pullBack;
      velX[i] *= 0.93; velY[i] *= 0.93;
      // nudge that particle toward interior over time to avoid rim crowding
      rFrac[i] = Math.min(1, rFrac[i] + 0.0006);
    } else if (r < RMIN * 0.85) {
      const inward = (RMIN * 0.85 - r);
      const pushOut = 0.06 * inward;
      accX[i] += ux * pushOut;
      accY[i] += uy * pushOut;
      // allow it to live nearer surface
      rFrac[i] = Math.max(0, rFrac[i] - 0.0003);
    } else {
      // gentle breathing bias adjustments keep mass spread through shell
      rFrac[i] = clamp(rFrac[i] + (Math.random() - 0.5) * 0.0002, 0, 1);
    }

    // integrate with damping + velocity clamp
    velX[i] = clampMag(velX[i] + accX[i], 6.0);
    velY[i] = clampMag(velY[i] + accY[i], 6.0);
    velX[i] *= set.drag; velY[i] *= set.drag;
    posX[i] += velX[i];
    posY[i] += velY[i];

    // ---- Draw (depth shading + interior brightness) ----
    const dPlanar = Math.min(Math.hypot(posX[i] - centerX, posY[i] - centerY), D * 0.5);
    const lerpAmt = 1.0 - (dPlanar / (D * 0.5));
    let rCol = lerp(red(col.start),   red(col.end),   lerpAmt);
    let gCol = lerp(green(col.start), green(col.end), lerpAmt);
    let bCol = lerp(blue(col.start),  blue(col.end),  lerpAmt);

    if (set.colorFlicker && sMid > 160 && (i & 31) === 0) {
      flicker[i] = 0.4 + Math.random() * 0.6;
    }
    flicker[i] *= 0.95; if (flicker[i] < 0.5) flicker[i] = 0.5;

    // depth-driven brightness/size: front = brighter/larger
    const zNorm = clamp(zPos[i] / (maxDepth + 1e-3), -1, 1);
    const frontBoost = 0.80 + 0.40 * (zNorm * 0.5 + 0.5); // 0.8..1.2
    // interior boost: particles deeper in shell get slight dim so rim isn't the only bright area
    const interiorBoost = 0.9 + 0.2 * (1.0 - rFrac[i]);

    const rr = lerp(rCol, 255, (flicker[i] - 0.5) * 0.6) * frontBoost * interiorBoost;
    const gg = lerp(gCol, 255, (flicker[i] - 0.5) * 0.6) * frontBoost * interiorBoost;
    const bb = lerp(bCol, 255, (flicker[i] - 0.5) * 0.6) * frontBoost * interiorBoost;

    const brightness = brightnessBase * (0.86 + 0.28 * (zNorm * 0.5 + 0.5)) * interiorBoost;
    fill(clamp(rr,0,255), clamp(gg,0,255), clamp(bb,0,255), brightness);

    const sz = sizeA[i] * sizeBase * (0.86 + 0.32 * (zNorm * 0.5 + 0.5)) * (0.95 + 0.1 * (1.0 - rFrac[i]));
    ellipse(posX[i], posY[i], sz, sz);
  }

  blendMode(BLEND);
}

function mousePressed() {
  if (!started) {
    playBirdSound(currentBird);
    started = true;
  }
}

function playBirdSound(name) {
  try {
    if (birdSound && birdSound.isPlaying()) birdSound.stop();
  } catch (e) {}
  try {
    birdSound = loadSound(`audio/${name}.mp3`,
      () => {
        try { birdSound.loop(); fft.setInput(birdSound); } catch (e) { console.error(e); }
      },
      (e) => {
        console.error(`Failed to load audio/${name}.mp3`, e);
      }
    );
  } catch (e) {
    console.error('Audio load exception:', e);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  D = Math.min(width, height);
  centerX = width * 0.5;
  centerY = height * 0.5;
}

/* =================== Settings =================== */
function setupSoulSettings() {
  // phases: phiB/M/T for bands, phiV for veins
  const prof = (o) => Object.assign({ phiB: 0, phiM: 0, phiT: 0, phiV: 0 }, o);
  // focus: [{lo,hi,w}, {lo,hi,w}] — rough EQ windows to highlight each bird’s voice
  soulSettings = {
    tui:      prof({ focus:[{lo:1000,hi:3500,w:1.0},{lo:3500,hi:8000,w:0.8}],
                     bassBreath:2.0, trebleFlare:2.6, swirl:0.18, chaos:0.9,  drag:0.93, colorFlicker:true,
                     petB:6, petM:12, petT:24, ampB:90,  ampM:52, ampT:34, rotSpeed:0.004,
                     spring:0.13, tangentGain:1.0, bassInflate:0.80, foldAmt:16, twirl:0.90, wave:1.00, stretchGain:0.8,
                     geomH2:14, geomH4:8, veins:6, veinSharp:2.6, veinTanGain:0.9, veinRadGain:0.6, veinPhase:0.8 }),
    kaka:     prof({ focus:[{lo:300,hi:2500,w:1.0},{lo:2500,hi:6000,w:0.7}],
                     bassBreath:2.5, trebleFlare:4.2, swirl:0.12, chaos:2.6,  drag:0.92, colorFlicker:false,
                     petB:4, petM:9,  petT:20, ampB:110, ampM:44, ampT:60, rotSpeed:0.006,
                     spring:0.14, tangentGain:1.2, bassInflate:0.95, foldAmt:14, twirl:1.10, wave:0.85, stretchGain:1.0,
                     geomH2:10, geomH4:12, veins:5, veinSharp:3.2, veinTanGain:1.1, veinRadGain:0.9, veinPhase:1.2 }),
    kokako:   prof({ focus:[{lo:300,hi:1500,w:1.2},{lo:1500,hi:3000,w:0.6}],
                     bassBreath:2.8, trebleFlare:1.0, swirl:0.45, chaos:0.6,  drag:0.945,colorFlicker:false,
                     petB:8, petM:14, petT:20, ampB:78,  ampM:38, ampT:22, rotSpeed:0.0025,
                     spring:0.12, tangentGain:0.85,bassInflate:0.60, foldAmt:20, twirl:0.55, wave:0.75, stretchGain:0.6,
                     geomH2:18, geomH4:6, veins:7, veinSharp:2.2, veinTanGain:0.75, veinRadGain:0.5, veinPhase:0.4 }),
    riroriro: prof({ focus:[{lo:3000,hi:8000,w:1.2},{lo:1500,hi:3000,w:0.6}],
                     bassBreath:1.6, trebleFlare:2.0, swirl:0.14, chaos:1.8,  drag:0.93, colorFlicker:false,
                     petB:6, petM:16, petT:26, ampB:70,  ampM:58, ampT:34, rotSpeed:0.005,
                     spring:0.135,tangentGain:1.0, bassInflate:0.58, foldAmt:16, twirl:1.05, wave:1.15, stretchGain:0.8,
                     geomH2:12, geomH4:14, veins:8, veinSharp:2.8, veinTanGain:1.0, veinRadGain:0.55, veinPhase:0.9 }),
    teike:    prof({ focus:[{lo:700,hi:2800,w:1.0},{lo:2800,hi:6000,w:0.7}],
                     bassBreath:2.0, trebleFlare:1.8, swirl:0.18, chaos:1.0,  drag:0.93, colorFlicker:false,
                     petB:5, petM:12, petT:22, ampB:82,  ampM:50, ampT:28, rotSpeed:0.004,
                     spring:0.13, tangentGain:0.95,bassInflate:0.68, foldAmt:18, twirl:0.90, wave:0.95, stretchGain:0.7,
                     geomH2:12, geomH4:10, veins:6, veinSharp:2.4, veinTanGain:0.85, veinRadGain:0.55, veinPhase:0.7 }),
    ruru:     prof({ focus:[{lo:200,hi:900,w:1.2},{lo:900,hi:1800,w:0.6}],
                     bassBreath:2.4, trebleFlare:1.4, swirl:0.10, chaos:1.0,  drag:0.94, colorFlicker:false,
                     petB:4, petM:10, petT:18, ampB:90,  ampM:34, ampT:24, rotSpeed:0.002,
                     spring:0.12, tangentGain:0.8, bassInflate:0.82, foldAmt:12, twirl:0.60, wave:0.70, stretchGain:0.5,
                     geomH2:10, geomH4:6, veins:5, veinSharp:2.0, veinTanGain:0.7, veinRadGain:0.45, veinPhase:0.3 }),
    korimako: prof({ focus:[{lo:1500,hi:6000,w:1.1},{lo:600,hi:1500,w:0.7}],
                     bassBreath:2.0, trebleFlare:2.2, swirl:0.18, chaos:1.4,  drag:0.93, colorFlicker:true,
                     petB:6, petM:15, petT:24, ampB:82,  ampM:56, ampT:32, rotSpeed:0.0045,
                     spring:0.13, tangentGain:1.1, bassInflate:0.66, foldAmt:16, twirl:1.00, wave:1.05, stretchGain:0.9,
                     geomH2:14, geomH4:12, veins:7, veinSharp:3.0, veinTanGain:1.05, veinRadGain:0.65, veinPhase:1.0 }),
  };
}

function setupColorSettings() {
  colorSettings = {
    tui:      { start: color("#40E0D0"), end: color("#00008B") },
    kaka:     { start: color("#FF4500"), end: color("#556B2F") },
    kokako:   { start: color("#5179f2"), end: color("#8199b3") },
    riroriro: { start: color("#DCDCDC"), end: color("#8B7355") },
    teike:    { start: color("#FFA500"), end: color("#654321") },
    ruru:     { start: color("#8B4000"), end: color("#4B2E2B") },
    korimako: { start: color("#ADFF2F"), end: color("#556B2F") },
  };
}

/* =================== Helpers =================== */
function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }
function map01(v) { return clamp((v - 0) / 255, 0, 1); }
function pow2(x) { return Math.pow(clamp(x, 0, 1), 1.2); } // slight emphasis
function clampMag(v, max) { const m = Math.abs(v); return m > max ? (v / m) * max : v; }
function smoothBand(s, r) { return r > s ? s + (r - s) * ATTACK : s + (r - s) * DECAY; }
function smoothstep(a, b, x) { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
function wrapPI(a){ while(a>Math.PI)a-=TWO_PI; while(a<-Math.PI)a+=TWO_PI; return a; }

// Soft recenter by subtracting a tiny fraction of COM (prevents drift without shrinking)
function softRecenter(alpha) {
  let cx = 0, cy = 0;
  for (let i = 0; i < N; i++) { cx += posX[i]; cy += posY[i]; }
  cx /= N; cy /= N;
  const offX = (cx - centerX) * alpha;
  const offY = (cy - centerY) * alpha;
  if (offX !== 0 || offY !== 0) {
    for (let i = 0; i < N; i++) { posX[i] -= offX; posY[i] -= offY; }
  }
}

// Approximate 2D curl noise from Perlin noise with finite differences
function curlNoise(x, y) {
  const e = 0.01;
  const n1 = noise(x, y + e);
  const n2 = noise(x, y - e);
  const n3 = noise(x + e, y);
  const n4 = noise(x - e, y);
  const dx = (n1 - n2) / (2 * e);
  const dy = (n3 - n4) / (2 * e);
  return { x: dy * 2.0, y: -dx * 2.0 };
}
