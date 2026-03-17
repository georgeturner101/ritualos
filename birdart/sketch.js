/* =========================
   BIRD ART — LIVING MORPH VERSION
   ========================= */

let N = 4200;
let centerX, centerY, D;
let started = false;
let currentBird = "tui";
let targetBird = "tui";
let morphAmount = 1.0;

let fft, birdSound;
let globalEnergy = 0;
let sBass = 0, sMid = 0, sTreble = 0, sFocus = 0;
let onset = 0;
let prevSpec = null;
let loudnessEMA = 60;
let thetaSpin = 0;
let t = 0;

const ATTACK = 0.36;
const DECAY = 0.08;
const LOUD_EMA_ALPHA = 0.05;

// typed arrays
let posX, posY, velX, velY, accX, accY, sizeA, nOX, nOY, flicker, rBias;
let zPos, zVel, zAcc, zHome, zSeed, rFrac;
let orbitBias, driftSeed;

let soulSettings = {};
let colorSettings = {};
let pulseField = 0;

/* =========================
   P5 LIFECYCLE
   ========================= */

function preload() {
  soundFormats('mp3', 'wav', 'ogg');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  frameRate(60);

  D = Math.min(width, height);
  centerX = width * 0.5;
  centerY = height * 0.5;

  fft = new p5.FFT(0.8, 1024);

  setupSoulSettings();
  setupColorSettings();
  setAdaptiveParticleCount();
  initParticles();

  const selectMenu = document.getElementById('birdSelect');
  if (selectMenu) {
    currentBird = selectMenu.value || "tui";
    targetBird = currentBird;

    selectMenu.addEventListener('change', function () {
      targetBird = this.value;

      if (started) {
        playBirdSound(targetBird);
      }
    });
  }

  background(0);
}

function draw() {
  background(0);

  if (!started) {
    drawIdleGlow();
    return;
  }

  // smooth bird morph
  if (currentBird !== targetBird) {
    morphAmount = lerp(morphAmount, 1, 0.035);
    if (morphAmount > 0.995) {
      currentBird = targetBird;
      morphAmount = 1.0;
    }
  }

  const setA = soulSettings[currentBird] || soulSettings.tui;
  const setB = soulSettings[targetBird] || soulSettings.tui;
  const set = blendProfiles(setA, setB, morphAmount);

  const colA = colorSettings[currentBird] || colorSettings.tui;
  const colB = colorSettings[targetBird] || colorSettings.tui;

  const spec = fft.analyze();

  const bass = clamp(fft.getEnergy(20, 160), 0, 255);
  const mid = clamp(fft.getEnergy(160, 2000), 0, 255);
  const treble = clamp(fft.getEnergy(2000, 8000), 0, 255);

  
  const eq = set.focus;
  const f1 = clamp(fft.getEnergy(eq[0].lo, eq[0].hi), 0, 255) * eq[0].w;
  const f2 = clamp(fft.getEnergy(eq[1].lo, eq[1].hi), 0, 255) * eq[1].w;
  const fDen = Math.max(eq[0].w + eq[1].w, 1e-6);
  const focusRaw = (f1 + f2) / fDen;

  sFocus = smoothBand(sFocus, focusRaw);
  sBass = smoothBand(sBass, bass);
  sMid = smoothBand(sMid, mid);
  sTreble = smoothBand(sTreble, treble);

  let flux = 0;
  for (let i = 0; i < spec.length; i++) {
    const d = spec[i] - prevSpec[i];
    if (d > 0) flux += d;
    prevSpec[i] = spec[i];
  }

  const total = (bass + mid + treble) / 3;
  const prevGlobal = globalEnergy;
  globalEnergy = lerp(globalEnergy, total, 0.22);
  loudnessEMA = lerp(loudnessEMA, total, LOUD_EMA_ALPHA);

  const fluxNorm = flux / 800.0;
  const focusJump = Math.max(0, focusRaw - sFocus) * 0.8;

  if (fluxNorm > 0.9 || (total - prevGlobal) > 16 || focusJump > 10) {
    onset = 1.0;
    pulseField = 1.0;
  }

  onset *= 0.92;
  pulseField *= 0.95;

  const reactGain = clamp(160 / (loudnessEMA + 10), 0.7, 2.2);
  const focusGate = smoothstep(0.16, 0.45, sFocus / 255);
  const onsetBoost = 1.0 + onset * 0.65;

  const B = pow2(map01(sBass) * reactGain) * clamp(0.72 + 0.9 * focusGate, 0.72, 1.65) * onsetBoost;
  const M = pow2(map01(sMid) * reactGain) * clamp(0.72 + 0.9 * focusGate, 0.72, 1.65) * onsetBoost;
  const T = pow2(map01(sTreble) * reactGain) * clamp(0.72 + 0.9 * focusGate, 0.72, 1.75) * (1.0 + onset * 0.85);

  t += 0.0045;
  thetaSpin += 0.0012 * (0.45 + 0.38 * map01(sMid) + 0.3 * map01(sTreble));

  // phase evolution is continuous
  setA.phiB += setA.rotSpeed * 0.36;
  setA.phiM += setA.rotSpeed * 0.62;
  setA.phiT += setA.rotSpeed * 0.96;
  setA.phiV += setA.rotSpeed * setA.veinPhase;

  setB.phiB += setB.rotSpeed * 0.36;
  setB.phiM += setB.rotSpeed * 0.62;
  setB.phiT += setB.rotSpeed * 0.96;
  setB.phiV += setB.rotSpeed * setB.veinPhase;

  set.phiB = lerp(setA.phiB, setB.phiB, morphAmount);
  set.phiM = lerp(setA.phiM, setB.phiM, morphAmount);
  set.phiT = lerp(setA.phiT, setB.phiT, morphAmount);
  set.phiV = lerp(setA.phiV, setB.phiV, morphAmount);

  const R0 = D * (0.29 + 0.15 * B * set.bassInflate) * (1.0 + onset * 0.12 * focusGate);

  // thicker body, less surface sticking
  const band = Math.max(D * 0.30, (D * 0.16) + M * (D * 0.20));

  const kSpring = set.spring * 0.86;
  const twirlK = set.twirl * (0.32 + 1.2 * M);
  const waveK = set.wave * (0.16 + 1.0 * B);
  const swirlK = 0.52 + set.swirl * 0.95;
  const flareK = (sTreble > 55 ? (T * set.trebleFlare * 0.85 * focusGate) : 0);
  const chaosK = ((globalEnergy > 210 ? set.chaos : 0) + onset * set.chaos * 0.45) * 0.62 * focusGate;
  const stretchK = set.stretchGain * (0.18 + 0.85 * T);

  const RMIN = D * 0.16;
  const RMAX = D * 0.47;

  const brightnessBase = 132 + map01(globalEnergy) * 165 + onset * 70;
  const sizeBase = 1.0 + map01(globalEnergy) * 1.45 + onset * 0.45;

  const maxDepth = band * 0.85 + R0 * 0.44;

  softRecenter(0.006);

  blendMode(ADD);
  noStroke();

  for (let i = 0; i < N; i++) {
    accX[i] = 0;
    accY[i] = 0;
    zAcc[i] = 0;

    let dx = posX[i] - centerX;
    let dy = posY[i] - centerY;
    let r = Math.hypot(dx, dy) + 1e-6;
    let ux = dx / r;
    let uy = dy / r;

    let theta = Math.atan2(dy, dx);
    const phiOff = (nOX[i] * 0.1234567) % 1 * TWO_PI;
    const th = theta + thetaSpin + 0.4 * phiOff;

    // smoother geometry - less hard snapping
    const bloom = set.ampB * 0.62 * B * Math.cos(set.petB * th + set.phiB);
    const ripple = set.ampM * 0.72 * M * Math.cos(set.petM * th + set.phiM);
    const spike = set.ampT * 0.55 * T * Math.cos(set.petT * th + set.phiT);
    const fold = set.foldAmt * 0.55 * Math.cos(2 * th + set.phiM * 0.5) * (0.22 + 0.65 * M);
    const harm2 = set.geomH2 * 0.45 * M * Math.cos((set.petM * 2) * th + set.phiM * 0.7);
    const harm4 = set.geomH4 * 0.32 * T * Math.cos(4.0 * th + set.phiT * 0.9);
    const Rsurf = R0 + bloom + ripple + spike + fold + harm2 + harm4;

    let veinRad = 0;
    let veinTan = 0;
    const K = Math.max(3, set.veins | 0);
    const sharp = set.veinSharp;
    const phase = set.phiV;
    const baseK = TWO_PI / K;

    for (let k = 0; k < K; k++) {
      const thetaK = k * baseK + phase;
      const delta = wrapPI(th - thetaK);
      const c = Math.cos(delta);
      const s = Math.sin(delta);
      const ridge = Math.pow((c * 0.5 + 0.5), sharp);
      veinRad += ridge;
      veinTan += s * ridge;
    }

    veinRad /= K;
    veinTan /= K;

    // stronger interior bias; only peaks push surfaceward
    const peakSurfacePush = onset * 0.16 + T * 0.10;
    let R3 = Rsurf - (band * (0.78 - peakSurfacePush) * rFrac[i]) + rBias[i] * 0.35;
    R3 = clamp(R3, RMIN * 0.92, RMAX);

    const zAmp = (band * 0.62) * (0.65 + 0.55 * M + 0.22 * B);
    const zVeinBias = (veinRad - 0.5) * band * 0.08;
    const zPref = zHome[i] * zAmp + zVeinBias;

    zAcc[i] += (zPref - zPos[i]) * 0.016;

    const zN = (noise(zSeed[i] + t * 0.55, nOY[i] * 0.17 - t * 0.36) - 0.5);
    zAcc[i] += zN * swirlK * 0.42;

    if (flareK > 0 && (i & 63) === 0) {
      zAcc[i] += (Math.random() - 0.5) * flareK * 0.42;
    }

    zVel[i] = clampMag(zVel[i] + zAcc[i], 4.6);
    zVel[i] *= set.drag;
    zPos[i] += zVel[i];

    const zLimit = RMAX * 0.95;
    if (zPos[i] > zLimit) {
      zPos[i] = zLimit;
      zVel[i] *= 0.9;
    }
    if (zPos[i] < -zLimit) {
      zPos[i] = -zLimit;
      zVel[i] *= 0.9;
    }

    const rTarget = Math.sqrt(Math.max(R3 * R3 - zPos[i] * zPos[i], 1.0));

    const delta = (rTarget - r) / (band * 0.75);
    const soft = Math.tanh(delta);
    const dynK = kSpring * (0.85 + 0.35 * Math.min(1, Math.abs(delta)));

    accX[i] += ux * (soft * dynK * band);
    accY[i] += uy * (soft * dynK * band);

    const tx = -uy;
    const ty = ux;

    const wave = waveK * Math.sin(set.petM * th + t * 1.8 + nOX[i] * 0.01);
    const angDiff = (noise(nOX[i] * 0.82 + t * 0.55, nOY[i] * 0.76 - t * 0.42) - 0.5) * (0.28 + 0.75 * M);

    const veinTanK = (0.7 + 1.4 * M) * set.veinTanGain;
    const veinRadK = (0.22 + 0.65 * B) * set.veinRadGain;

    // stronger orbital travel around the orb
    const orbitalFlow = orbitBias[i] * (0.55 + 1.4 * M + 0.55 * T);
    const spinDrift = Math.sin(t * 0.8 + driftSeed[i]) * 0.22;

    accX[i] += tx * (twirlK + wave + angDiff * 0.35 + veinTan * veinTanK + orbitalFlow + spinDrift);
    accY[i] += ty * (twirlK + wave + angDiff * 0.35 + veinTan * veinTanK + orbitalFlow + spinDrift);

    accX[i] += ux * (veinRad * veinRadK);
    accY[i] += uy * (veinRad * veinRadK);

    const dR_dTheta =
      -set.ampB * 0.62 * B * set.petB * Math.sin(set.petB * th + set.phiB) +
      -set.ampM * 0.72 * M * set.petM * Math.sin(set.petM * th + set.phiM) +
      -set.ampT * 0.55 * T * set.petT * Math.sin(set.petT * th + set.phiT) +
      -2.0 * set.foldAmt * 0.55 * Math.sin(2 * th + set.phiM * 0.5) * (0.22 + 0.65 * M);

    accX[i] += tx * dR_dTheta * (set.tangentGain * 0.009);
    accY[i] += ty * dR_dTheta * (set.tangentGain * 0.009);

    const c = curlNoise(nOX[i] * 0.012 + t * 0.26, nOY[i] * 0.012 - t * 0.22);
    accX[i] += c.x * (0.55 + 1.2 * (0.5 * M + 0.5 * T));
    accY[i] += c.y * (0.55 + 1.2 * (0.5 * M + 0.5 * T));

    accX[i] += ux * stretchK * 0.30 * Math.cos(set.petT * th + set.phiT);
    accY[i] += uy * stretchK * 0.30 * Math.cos(set.petT * th + set.phiT);

    accX[i] += ux * (B * set.bassBreath * 0.34);
    accY[i] += uy * (B * set.bassBreath * 0.34);

    if (flareK > 0 && (i & 31) === 0) {
      const ra = (phiOff + t * 6.2) % TWO_PI;
      accX[i] += Math.cos(ra) * flareK * 0.58;
      accY[i] += Math.sin(ra) * flareK * 0.58;
    }

    if (chaosK > 0 && (i & 63) === 0) {
      const ra = (phiOff * 1.7 + t * 4.1) % TWO_PI;
      accX[i] += Math.cos(ra) * chaosK * 0.46;
      accY[i] += Math.sin(ra) * chaosK * 0.46;
    }

    const pulseWave = pulseField * 12 * Math.sin((r * 0.02) - t * 8.4 + phiOff);
    accX[i] += ux * pulseWave * 0.03;
    accY[i] += uy * pulseWave * 0.03;

    // softer containment so less shell-sticking
    if (r > RMAX) {
      const over = r - RMAX;
      const pullBack = 0.045 * over;
      accX[i] -= ux * pullBack;
      accY[i] -= uy * pullBack;
      velX[i] *= 0.95;
      velY[i] *= 0.95;
      rFrac[i] = Math.min(1, rFrac[i] + 0.00035);
    } else if (r < RMIN * 0.8) {
      const inward = (RMIN * 0.8 - r);
      const pushOut = 0.042 * inward;
      accX[i] += ux * pushOut;
      accY[i] += uy * pushOut;
      rFrac[i] = Math.max(0, rFrac[i] - 0.00015);
    } else {
      rFrac[i] = clamp(rFrac[i] + (Math.random() - 0.5) * 0.00012, 0, 1);
    }

    velX[i] = clampMag(velX[i] + accX[i], 5.7);
    velY[i] = clampMag(velY[i] + accY[i], 5.7);
    velX[i] *= set.drag;
    velY[i] *= set.drag;
    posX[i] += velX[i];
    posY[i] += velY[i];

    const dPlanar = Math.min(Math.hypot(posX[i] - centerX, posY[i] - centerY), D * 0.5);
    const lerpAmt = 1.0 - (dPlanar / (D * 0.5));

    let rColA = lerp(red(colA.start), red(colA.end), lerpAmt);
    let gColA = lerp(green(colA.start), green(colA.end), lerpAmt);
    let bColA = lerp(blue(colA.start), blue(colA.end), lerpAmt);

    let rColB = lerp(red(colB.start), red(colB.end), lerpAmt);
    let gColB = lerp(green(colB.start), green(colB.end), lerpAmt);
    let bColB = lerp(blue(colB.start), blue(colB.end), lerpAmt);

    let rCol = lerp(rColA, rColB, morphAmount);
    let gCol = lerp(gColA, gColB, morphAmount);
    let bCol = lerp(bColA, bColB, morphAmount);

    if (set.colorFlicker && sMid > 160 && (i & 31) === 0) {
      flicker[i] = 0.4 + Math.random() * 0.6;
    }

    flicker[i] *= 0.96;
    if (flicker[i] < 0.5) flicker[i] = 0.5;

    const zNorm = clamp(zPos[i] / (maxDepth + 1e-3), -1, 1);
    const frontBoost = 0.82 + 0.36 * (zNorm * 0.5 + 0.5);
    const interiorBoost = 0.96 + 0.16 * (1.0 - rFrac[i]);

    const hotBoost = onset * 0.34 + T * 0.18;
    const rr = lerp(rCol, 255, (flicker[i] - 0.5) * 0.58 + hotBoost * 0.12) * frontBoost * interiorBoost;
    const gg = lerp(gCol, 255, (flicker[i] - 0.5) * 0.58 + hotBoost * 0.10) * frontBoost * interiorBoost;
    const bb = lerp(bCol, 255, (flicker[i] - 0.5) * 0.58 + hotBoost * 0.14) * frontBoost * interiorBoost;

    const highlightBoost = 1.0 + onset * 0.42 + T * 0.22;
    const brightness = brightnessBase * (0.88 + 0.24 * (zNorm * 0.5 + 0.5)) * interiorBoost * highlightBoost;

    const sz =
      sizeA[i] *
      sizeBase *
      (0.88 + 0.26 * (zNorm * 0.5 + 0.5)) *
      (0.97 + 0.08 * (1.0 - rFrac[i])) *
      (1.0 + onset * 0.22);

    fill(clamp(rr, 0, 255), clamp(gg, 0, 255), clamp(bb, 0, 255), brightness);
    ellipse(posX[i], posY[i], sz, sz);
  }

  blendMode(BLEND);

  if (frameCount % 180 === 0) {
    autoTunePerformance();
  }
}

function mousePressed() {
  if (!started) {
    started = true;
    const panel = document.getElementById('start-panel');
    if (panel) panel.classList.add('hidden');
    playBirdSound(currentBird);
  }
}

/* =========================
   AUDIO
   ========================= */

function playBirdSound(name) {
  // start morph toward new bird immediately
  if (targetBird !== name) {
    currentBird = targetBird;
    targetBird = name;
    morphAmount = 0.0;
  } else if (currentBird !== targetBird) {
    morphAmount = 0.0;
  }

  try {
    if (birdSound && birdSound.isPlaying()) birdSound.stop();
  } catch (e) {}

  try {
    birdSound = loadSound(
      `audio/${name}.mp3`,
      () => {
        try {
          birdSound.loop();
          fft.setInput(birdSound);
        } catch (e) {
          console.error(e);
        }
      },
      (e) => {
        console.error(`Failed to load audio/${name}.mp3`, e);
      }
    );
  } catch (e) {
    console.error('Audio load exception:', e);
  }
}

/* =========================
   PARTICLES
   ========================= */

function setAdaptiveParticleCount() {
  const area = windowWidth * windowHeight;

  if (area > 1800000) {
    N = 5000;
  } else if (area > 1200000) {
    N = 4300;
  } else if (area > 800000) {
    N = 3500;
  } else {
    N = 2700;
  }
}

function initParticles() {
  posX = new Float32Array(N);
  posY = new Float32Array(N);
  velX = new Float32Array(N);
  velY = new Float32Array(N);
  accX = new Float32Array(N);
  accY = new Float32Array(N);
  sizeA = new Float32Array(N);
  nOX = new Float32Array(N);
  nOY = new Float32Array(N);
  flicker = new Float32Array(N);
  rBias = new Float32Array(N);

  zPos = new Float32Array(N);
  zVel = new Float32Array(N);
  zAcc = new Float32Array(N);
  zHome = new Float32Array(N);
  zSeed = new Float32Array(N);
  rFrac = new Float32Array(N);

  orbitBias = new Float32Array(N);
  driftSeed = new Float32Array(N);

  const Rseed = D * 0.28;

  for (let i = 0; i < N; i++) {
    const ang = Math.random() * TWO_PI;
    const jitter = (Math.random() * 2 - 1) * (D * 0.05);
    const r = Rseed + jitter;

    posX[i] = centerX + Math.cos(ang) * r;
    posY[i] = centerY + Math.sin(ang) * r;

    velX[i] = 0;
    velY[i] = 0;
    accX[i] = 0;
    accY[i] = 0;

    sizeA[i] = 0.95 + Math.random() * 1.25;
    nOX[i] = Math.random() * 1000;
    nOY[i] = Math.random() * 1000;
    flicker[i] = 0.5;

    // much stronger inner-body distribution
    rFrac[i] = Math.pow(Math.random(), 0.42);
    rBias[i] = (Math.random() * 2 - 1) * (D * 0.012);

    zHome[i] = (Math.random() * 2 - 1);
    zPos[i] = zHome[i] * (D * 0.10);
    zVel[i] = 0;
    zAcc[i] = 0;
    zSeed[i] = Math.random() * 1000;

    orbitBias[i] = (Math.random() > 0.5 ? 1 : -1) * (0.15 + Math.random() * 0.95);
    driftSeed[i] = Math.random() * TWO_PI;
  }

  prevSpec = new Uint8Array(fft.analyze().length);
}

/* =========================
   LAYOUT / RESIZE
   ========================= */

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  D = Math.min(width, height);
  centerX = width * 0.5;
  centerY = height * 0.5;
  setAdaptiveParticleCount();
  initParticles();
}

function drawIdleGlow() {
  noStroke();
  fill(255, 255, 255, 14);
  ellipse(centerX, centerY, D * 0.24, D * 0.24);

  fill(255, 255, 255, 6);
  ellipse(centerX, centerY, D * 0.38, D * 0.38);
}

function autoTunePerformance() {
  const fpsNow = frameRate();

  if (fpsNow < 42 && N > 2500) {
    N = Math.floor(N * 0.9);
    initParticles();
  }
}

/* =========================
   SETTINGS
   ========================= */

function setupSoulSettings() {
  const prof = (o) => Object.assign({ phiB: 0, phiM: 0, phiT: 0, phiV: 0 }, o);

  soulSettings = {
    tui: prof({
      focus: [{ lo: 1000, hi: 3500, w: 1.0 }, { lo: 3500, hi: 8000, w: 0.8 }],
      bassBreath: 2.0,
      trebleFlare: 2.8,
      swirl: 0.18,
      chaos: 1.0,
      drag: 0.938,
      colorFlicker: true,
      petB: 6, petM: 12, petT: 24,
      ampB: 90, ampM: 52, ampT: 36,
      rotSpeed: 0.004,
      spring: 0.128,
      tangentGain: 1.0,
      bassInflate: 0.82,
      foldAmt: 16,
      twirl: 1.15,
      wave: 1.0,
      stretchGain: 0.85,
      geomH2: 14,
      geomH4: 8,
      veins: 6,
      veinSharp: 2.6,
      veinTanGain: 0.9,
      veinRadGain: 0.55,
      veinPhase: 0.8
    }),

    kaka: prof({
      focus: [{ lo: 300, hi: 2500, w: 1.0 }, { lo: 2500, hi: 6000, w: 0.7 }],
      bassBreath: 2.5,
      trebleFlare: 4.4,
      swirl: 0.12,
      chaos: 2.7,
      drag: 0.934,
      colorFlicker: false,
      petB: 4, petM: 9, petT: 20,
      ampB: 112, ampM: 44, ampT: 62,
      rotSpeed: 0.006,
      spring: 0.135,
      tangentGain: 1.2,
      bassInflate: 0.96,
      foldAmt: 14,
      twirl: 1.28,
      wave: 0.85,
      stretchGain: 1.0,
      geomH2: 10,
      geomH4: 12,
      veins: 5,
      veinSharp: 3.2,
      veinTanGain: 1.08,
      veinRadGain: 0.82,
      veinPhase: 1.2
    }),

    kokako: prof({
      focus: [{ lo: 300, hi: 1500, w: 1.2 }, { lo: 1500, hi: 3000, w: 0.6 }],
      bassBreath: 2.8,
      trebleFlare: 1.0,
      swirl: 0.45,
      chaos: 0.6,
      drag: 0.944,
      colorFlicker: false,
      petB: 8, petM: 14, petT: 20,
      ampB: 80, ampM: 40, ampT: 22,
      rotSpeed: 0.0025,
      spring: 0.118,
      tangentGain: 0.85,
      bassInflate: 0.60,
      foldAmt: 20,
      twirl: 0.82,
      wave: 0.75,
      stretchGain: 0.6,
      geomH2: 18,
      geomH4: 6,
      veins: 7,
      veinSharp: 2.2,
      veinTanGain: 0.75,
      veinRadGain: 0.45,
      veinPhase: 0.4
    }),

    riroriro: prof({
      focus: [{ lo: 3000, hi: 8000, w: 1.2 }, { lo: 1500, hi: 3000, w: 0.6 }],
      bassBreath: 1.6,
      trebleFlare: 2.2,
      swirl: 0.14,
      chaos: 1.9,
      drag: 0.935,
      colorFlicker: false,
      petB: 6, petM: 16, petT: 26,
      ampB: 70, ampM: 60, ampT: 34,
      rotSpeed: 0.005,
      spring: 0.132,
      tangentGain: 1.0,
      bassInflate: 0.58,
      foldAmt: 16,
      twirl: 1.34,
      wave: 1.18,
      stretchGain: 0.82,
      geomH2: 12,
      geomH4: 14,
      veins: 8,
      veinSharp: 2.8,
      veinTanGain: 1.0,
      veinRadGain: 0.48,
      veinPhase: 0.9
    }),

    tieke: prof({
      focus: [{ lo: 700, hi: 2800, w: 1.0 }, { lo: 2800, hi: 6000, w: 0.7 }],
      bassBreath: 2.0,
      trebleFlare: 1.8,
      swirl: 0.18,
      chaos: 1.0,
      drag: 0.936,
      colorFlicker: false,
      petB: 5, petM: 12, petT: 22,
      ampB: 82, ampM: 50, ampT: 28,
      rotSpeed: 0.004,
      spring: 0.128,
      tangentGain: 0.95,
      bassInflate: 0.68,
      foldAmt: 18,
      twirl: 1.02,
      wave: 0.95,
      stretchGain: 0.7,
      geomH2: 12,
      geomH4: 10,
      veins: 6,
      veinSharp: 2.4,
      veinTanGain: 0.85,
      veinRadGain: 0.5,
      veinPhase: 0.7
    }),

    ruru: prof({
      focus: [{ lo: 200, hi: 900, w: 1.2 }, { lo: 900, hi: 1800, w: 0.6 }],
      bassBreath: 2.4,
      trebleFlare: 1.4,
      swirl: 0.10,
      chaos: 1.0,
      drag: 0.944,
      colorFlicker: false,
      petB: 4, petM: 10, petT: 18,
      ampB: 90, ampM: 34, ampT: 24,
      rotSpeed: 0.002,
      spring: 0.118,
      tangentGain: 0.8,
      bassInflate: 0.82,
      foldAmt: 12,
      twirl: 0.75,
      wave: 0.70,
      stretchGain: 0.5,
      geomH2: 10,
      geomH4: 6,
      veins: 5,
      veinSharp: 2.0,
      veinTanGain: 0.7,
      veinRadGain: 0.42,
      veinPhase: 0.3
    }),

    korimako: prof({
      focus: [{ lo: 1500, hi: 6000, w: 1.1 }, { lo: 600, hi: 1500, w: 0.7 }],
      bassBreath: 2.0,
      trebleFlare: 2.3,
      swirl: 0.18,
      chaos: 1.5,
      drag: 0.936,
      colorFlicker: true,
      petB: 6, petM: 15, petT: 24,
      ampB: 82, ampM: 58, ampT: 32,
      rotSpeed: 0.0045,
      spring: 0.128,
      tangentGain: 1.1,
      bassInflate: 0.66,
      foldAmt: 16,
      twirl: 1.18,
      wave: 1.06,
      stretchGain: 0.9,
      geomH2: 14,
      geomH4: 12,
      veins: 7,
      veinSharp: 3.0,
      veinTanGain: 1.05,
      veinRadGain: 0.58,
      veinPhase: 1.0
    })
  };
}

function setupColorSettings() {
  colorSettings = {
    tui: { start: color("#40E0D0"), end: color("#00008B") },
    kaka: { start: color("#FF4500"), end: color("#556B2F") },
    kokako: { start: color("#5179f2"), end: color("#8199b3") },
    riroriro: { start: color("#DCDCDC"), end: color("#8B7355") },
    tieke: { start: color("#FFA500"), end: color("#654321") },
    ruru: { start: color("#8B4000"), end: color("#4B2E2B") },
    korimako: { start: color("#ADFF2F"), end: color("#556B2F") }
  };
}

/* =========================
   HELPERS
   ========================= */

function blendProfiles(a, b, amt) {
  return {
    focus: [
      {
        lo: lerp(a.focus[0].lo, b.focus[0].lo, amt),
        hi: lerp(a.focus[0].hi, b.focus[0].hi, amt),
        w: lerp(a.focus[0].w, b.focus[0].w, amt)
      },
      {
        lo: lerp(a.focus[1].lo, b.focus[1].lo, amt),
        hi: lerp(a.focus[1].hi, b.focus[1].hi, amt),
        w: lerp(a.focus[1].w, b.focus[1].w, amt)
      }
    ],
    bassBreath: lerp(a.bassBreath, b.bassBreath, amt),
    trebleFlare: lerp(a.trebleFlare, b.trebleFlare, amt),
    swirl: lerp(a.swirl, b.swirl, amt),
    chaos: lerp(a.chaos, b.chaos, amt),
    drag: lerp(a.drag, b.drag, amt),
    colorFlicker: amt < 0.5 ? a.colorFlicker : b.colorFlicker,
    petB: lerp(a.petB, b.petB, amt),
    petM: lerp(a.petM, b.petM, amt),
    petT: lerp(a.petT, b.petT, amt),
    ampB: lerp(a.ampB, b.ampB, amt),
    ampM: lerp(a.ampM, b.ampM, amt),
    ampT: lerp(a.ampT, b.ampT, amt),
    rotSpeed: lerp(a.rotSpeed, b.rotSpeed, amt),
    spring: lerp(a.spring, b.spring, amt),
    tangentGain: lerp(a.tangentGain, b.tangentGain, amt),
    bassInflate: lerp(a.bassInflate, b.bassInflate, amt),
    foldAmt: lerp(a.foldAmt, b.foldAmt, amt),
    twirl: lerp(a.twirl, b.twirl, amt),
    wave: lerp(a.wave, b.wave, amt),
    stretchGain: lerp(a.stretchGain, b.stretchGain, amt),
    geomH2: lerp(a.geomH2, b.geomH2, amt),
    geomH4: lerp(a.geomH4, b.geomH4, amt),
    veins: lerp(a.veins, b.veins, amt),
    veinSharp: lerp(a.veinSharp, b.veinSharp, amt),
    veinTanGain: lerp(a.veinTanGain, b.veinTanGain, amt),
    veinRadGain: lerp(a.veinRadGain, b.veinRadGain, amt),
    veinPhase: lerp(a.veinPhase, b.veinPhase, amt),
    phiB: lerp(a.phiB, b.phiB, amt),
    phiM: lerp(a.phiM, b.phiM, amt),
    phiT: lerp(a.phiT, b.phiT, amt),
    phiV: lerp(a.phiV, b.phiV, amt)
  };
}

function clamp(x, a, b) {
  return x < a ? a : (x > b ? b : x);
}

function map01(v) {
  return clamp(v / 255, 0, 1);
}

function pow2(x) {
  return Math.pow(clamp(x, 0, 1), 1.2);
}

function clampMag(v, max) {
  const m = Math.abs(v);
  return m > max ? (v / m) * max : v;
}

function smoothBand(s, r) {
  return r > s ? s + (r - s) * ATTACK : s + (r - s) * DECAY;
}

function smoothstep(a, b, x) {
  const tt = clamp((x - a) / (b - a), 0, 1);
  return tt * tt * (3 - 2 * tt);
}

function wrapPI(a) {
  while (a > Math.PI) a -= TWO_PI;
  while (a < -Math.PI) a += TWO_PI;
  return a;
}


function softRecenter(alpha) {
  let cx = 0, cy = 0;
  for (let i = 0; i < N; i++) {
    cx += posX[i];
    cy += posY[i];
  }
  cx /= N;
  cy /= N;

  const offX = (cx - centerX) * alpha;
  const offY = (cy - centerY) * alpha;

  if (offX !== 0 || offY !== 0) {
    for (let i = 0; i < N; i++) {
      posX[i] -= offX;
      posY[i] -= offY;
    }
  }
}


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
