// =========================================================
// MUSIC PLAYER — "The Jukebox" (Aero Phase 2 device 3)
// =========================================================
// Loaded from index.html after script.js, same plain-global-scope
// pattern as gtpaint.js/aero.js. openWindow() in script.js calls
// initMusicPlayer() the first time the Music window opens; closeWindow()
// calls pauseMusicPlayer().
//
// Native <audio> routed through Web Audio (MediaElementSource ->
// AnalyserNode -> destination) so the feedback-buffer visualizer reacts
// to the REAL audio — no Spotify iframe (cross-origin, can't be
// analysed).
// =========================================================

let jukeboxInitialized = false;
let jukeboxTracks = [];
let jukeboxCurrentIndex = 0;
let jukeboxHasLoadedTrack = false;
let jukeboxIsPlaying = false;
let jukeboxShuffle = false;
let jukeboxRepeat = false;
let jukeboxVolume = 0.7;
let jukeboxMuted = false;
let jukeboxPreloadAudio = null;
// Set when Play is pressed before music/tracks.json has resolved — the
// click would otherwise silently no-op (loadJukeboxTrack finds nothing at
// jukeboxTracks[0]) with no retry once the list actually arrives.
let jukeboxPendingAutoplay = false;

// ---- Web Audio graph (created lazily on first user gesture) ----
let jukeboxAudioCtx = null;
let jukeboxAnalyser = null;
let jukeboxSourceNode = null;
let jukeboxFreqData = null;

// ---- visualizer state ----
let visualizerRaf = null;
// #jukebox-visualizer is a static element (never recreated), so it's
// safe to cache the node/context once instead of re-querying every frame
let jukeboxVisualizerCanvas = null;
let jukeboxVisualizerCtx = null;
let jukeboxCurrentMode = 0; // 0 ambient swirl, 1 tunnel, 2 bloom
let jukeboxPrevMode = 0;
let jukeboxModeBlendStart = 0;
const JUKEBOX_MODE_BLEND_MS = 700;
let jukeboxDriftPhase = 0;
let jukeboxBufA = null, jukeboxBufB = null, jukeboxBufActx = null, jukeboxBufBctx = null;
let jukeboxOnsetHistory = [];
let jukeboxLastOnsetTime = 0;
let jukeboxBloomParticles = [];
let jukeboxPalette = null;
const jukeboxReducedMotionMQ = window.matchMedia('(prefers-reduced-motion: reduce)');

// =========================================================
// Lifecycle
// =========================================================

function initMusicPlayer() {
  startVisualizerLoop(); // idempotent — resumes drawing each time the window (re)opens

  if (jukeboxInitialized) return;
  jukeboxInitialized = true;

  initJukeboxPalette();
  wireJukeboxControls();
  setJukeboxVolume(jukeboxVolume);

  fetch('music/tracks.json')
    .then((res) => res.json())
    .then((tracks) => {
      jukeboxTracks = tracks || [];
      renderJukeboxTracklist();
      if (jukeboxPendingAutoplay && jukeboxTracks.length) {
        jukeboxPendingAutoplay = false;
        loadJukeboxTrack(jukeboxCurrentIndex, true);
      }
    })
    .catch((err) => {
      console.error('Jukebox: failed to load music/tracks.json', err);
      jukeboxTracks = [];
    });
}

function pauseMusicPlayer() {
  const audio = document.getElementById('jukebox-audio');
  if (audio && !audio.paused) audio.pause();
  stopVisualizerLoop();
}

// =========================================================
// Tracklist
// =========================================================

function renderJukeboxTracklist() {
  const list = document.getElementById('jukebox-tracklist');
  if (!list) return;
  list.innerHTML = '';

  jukeboxTracks.forEach((track, i) => {
    const row = document.createElement('div');
    row.className = 'jukebox-track-row';
    row.dataset.index = String(i);

    const num = document.createElement('span');
    num.className = 'jukebox-track-num';
    num.textContent = String(i + 1);

    const title = document.createElement('span');
    title.className = 'jukebox-track-title';
    title.textContent = track.title;

    const eq = document.createElement('span');
    eq.className = 'jukebox-track-eq';
    eq.innerHTML = '<span></span><span></span><span></span>';

    const duration = document.createElement('span');
    duration.className = 'jukebox-track-duration';
    duration.textContent = formatJukeboxTime(track.duration || 0);

    row.append(num, title, eq, duration);
    list.appendChild(row);
  });

  updateTracklistHighlight();

  if (jukeboxTracks.length && !jukeboxHasLoadedTrack) {
    setJukeboxTrackInfo(jukeboxTracks[0]);
    document.getElementById('jukebox-time-duration').textContent = formatJukeboxTime(jukeboxTracks[0].duration || 0);
  }
}

function updateTracklistHighlight() {
  document.querySelectorAll('.jukebox-track-row').forEach((row) => {
    const idx = Number(row.dataset.index);
    row.classList.toggle('playing', idx === jukeboxCurrentIndex && jukeboxIsPlaying);
  });
}

function setJukeboxTrackInfo(track) {
  const span = document.getElementById('jukebox-track-title');
  if (!span) return;
  const wrap = span.closest('.jukebox-track-info');
  const label = `${track.title}${track.album ? ' — ' + track.album : ''}`;
  span.textContent = label;
  span.classList.remove('jukebox-marquee');
  if (wrap && span.scrollWidth > wrap.clientWidth) {
    span.textContent = `${label}     •     ${label}`;
    span.classList.add('jukebox-marquee');
  }
}

function formatJukeboxTime(seconds) {
  seconds = Math.max(0, Math.floor(seconds || 0));
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// =========================================================
// Web Audio pipeline
// =========================================================

function ensureJukeboxAudioGraph() {
  if (jukeboxAudioCtx) return;
  jukeboxAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const audio = document.getElementById('jukebox-audio');
  jukeboxSourceNode = jukeboxAudioCtx.createMediaElementSource(audio);
  jukeboxAnalyser = jukeboxAudioCtx.createAnalyser();
  jukeboxAnalyser.fftSize = 512;
  jukeboxAnalyser.smoothingTimeConstant = 0.75;
  jukeboxFreqData = new Uint8Array(jukeboxAnalyser.frequencyBinCount);
  jukeboxSourceNode.connect(jukeboxAnalyser);
  jukeboxAnalyser.connect(jukeboxAudioCtx.destination);
}

function getJukeboxBands() {
  jukeboxAnalyser.getByteFrequencyData(jukeboxFreqData);
  const n = jukeboxFreqData.length;
  const bassEnd = Math.max(1, Math.floor(n * 0.08));
  const midEnd = Math.max(bassEnd + 1, Math.floor(n * 0.35));
  let bass = 0, mid = 0, high = 0;
  for (let i = 0; i < bassEnd; i++) bass += jukeboxFreqData[i];
  for (let i = bassEnd; i < midEnd; i++) mid += jukeboxFreqData[i];
  for (let i = midEnd; i < n; i++) high += jukeboxFreqData[i];
  bass /= bassEnd * 255;
  mid /= (midEnd - bassEnd) * 255;
  high /= (n - midEnd) * 255;
  return { bass, mid, high };
}

function detectJukeboxOnset(bass) {
  const now = performance.now();
  jukeboxOnsetHistory.push(bass);
  if (jukeboxOnsetHistory.length > 30) jukeboxOnsetHistory.shift();
  const avg = jukeboxOnsetHistory.reduce((a, b) => a + b, 0) / jukeboxOnsetHistory.length;
  const isPeak = bass > avg * 1.35 && bass > 0.35 && now - jukeboxLastOnsetTime > 180;
  if (isPeak) {
    jukeboxLastOnsetTime = now;
    return true;
  }
  return false;
}

// =========================================================
// Playback control
// =========================================================

function loadJukeboxTrack(index, autoplay) {
  const track = jukeboxTracks[index];
  if (!track) return;
  jukeboxCurrentIndex = index;
  jukeboxHasLoadedTrack = true;

  const audio = document.getElementById('jukebox-audio');
  audio.src = 'music/tracks/' + encodeURIComponent(track.file);
  audio.load();

  setJukeboxTrackInfo(track);
  updateTracklistHighlight();
  updateJukeboxMediaSessionMetadata(track);

  document.getElementById('jukebox-time-current').textContent = '0:00';
  document.getElementById('jukebox-time-duration').textContent = formatJukeboxTime(track.duration || 0);
  const seek = document.getElementById('jukebox-seek');
  seek.value = 0;
  seek.style.setProperty('--jukebox-seek-pct', '0%');

  if (autoplay) playJukeboxCurrentTrack();
  preloadJukeboxNextTrack();
}

function playJukeboxCurrentTrack() {
  ensureJukeboxAudioGraph();
  const audio = document.getElementById('jukebox-audio');
  const resumeP = jukeboxAudioCtx.state === 'suspended' ? jukeboxAudioCtx.resume() : Promise.resolve();
  resumeP.then(() => audio.play()).catch((err) => console.error('Jukebox: play failed', err));
  startVisualizerLoop();
}

function pauseJukeboxCurrentTrack() {
  document.getElementById('jukebox-audio').pause();
}

function toggleJukeboxPlayPause() {
  if (!jukeboxHasLoadedTrack) {
    if (!jukeboxTracks.length) {
      // tracks.json hasn't resolved yet — queue this instead of letting
      // loadJukeboxTrack no-op on an empty list with no way to retry it
      jukeboxPendingAutoplay = true;
      return;
    }
    loadJukeboxTrack(jukeboxCurrentIndex, true);
    return;
  }
  if (jukeboxIsPlaying) pauseJukeboxCurrentTrack();
  else playJukeboxCurrentTrack();
}

function getJukeboxNextIndexPreview() {
  if (!jukeboxTracks.length) return null;
  if (jukeboxShuffle) {
    if (jukeboxTracks.length <= 1) return jukeboxCurrentIndex;
    let idx;
    do { idx = Math.floor(Math.random() * jukeboxTracks.length); } while (idx === jukeboxCurrentIndex);
    return idx;
  }
  let idx = jukeboxCurrentIndex + 1;
  if (idx >= jukeboxTracks.length) {
    if (jukeboxRepeat) idx = 0;
    else return null;
  }
  return idx;
}

function playJukeboxNext() {
  const idx = getJukeboxNextIndexPreview();
  if (idx == null) { pauseJukeboxCurrentTrack(); return; }
  loadJukeboxTrack(idx, true);
}

function playJukeboxPrev() {
  const audio = document.getElementById('jukebox-audio');
  if (jukeboxHasLoadedTrack && audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }
  if (!jukeboxTracks.length) return;
  let idx = jukeboxCurrentIndex - 1;
  if (idx < 0) {
    idx = jukeboxShuffle
      ? Math.floor(Math.random() * jukeboxTracks.length)
      : (jukeboxRepeat ? jukeboxTracks.length - 1 : 0);
  }
  loadJukeboxTrack(idx, true);
}

function preloadJukeboxNextTrack() {
  const idx = getJukeboxNextIndexPreview();
  if (idx == null) return;
  const track = jukeboxTracks[idx];
  if (!track) return;
  if (!jukeboxPreloadAudio) jukeboxPreloadAudio = new Audio();
  jukeboxPreloadAudio.preload = 'auto';
  jukeboxPreloadAudio.src = 'music/tracks/' + encodeURIComponent(track.file);
}

function setJukeboxVolume(v) {
  jukeboxVolume = Math.min(1, Math.max(0, v));
  const audio = document.getElementById('jukebox-audio');
  audio.volume = jukeboxMuted ? 0 : jukeboxVolume;
  const pod = document.getElementById('jukebox-pod');
  if (pod) pod.style.setProperty('--jukebox-vol', jukeboxVolume);
}

// =========================================================
// Media Session API
// =========================================================

function updateJukeboxMediaSessionMetadata(track) {
  if (!('mediaSession' in navigator)) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.title,
    artist: 'George Turner',
    album: track.album || '',
    artwork: track.cover ? [{ src: 'music/covers/' + track.cover, sizes: '512x512', type: 'image/jpeg' }] : [],
  });
}

function setupJukeboxMediaSessionHandlers() {
  if (!('mediaSession' in navigator)) return;
  navigator.mediaSession.setActionHandler('play', playJukeboxCurrentTrack);
  navigator.mediaSession.setActionHandler('pause', pauseJukeboxCurrentTrack);
  navigator.mediaSession.setActionHandler('previoustrack', playJukeboxPrev);
  navigator.mediaSession.setActionHandler('nexttrack', playJukeboxNext);
  navigator.mediaSession.setActionHandler('seekto', (details) => {
    const audio = document.getElementById('jukebox-audio');
    if (details.seekTime != null && !isNaN(audio.duration)) audio.currentTime = details.seekTime;
  });
}

// =========================================================
// Wiring: pod buttons, seek bar, volume ring, tracklist, keyboard
// =========================================================

function isJukeboxFocused() {
  const win = document.getElementById('window-music');
  if (!win || win.style.display === 'none') return false;
  return typeof topZ !== 'undefined' && String(win.style.zIndex) === String(topZ);
}

function wireJukeboxControls() {
  const audio = document.getElementById('jukebox-audio');

  audio.addEventListener('play', () => {
    jukeboxIsPlaying = true;
    updateJukeboxPlayPauseIcon();
    updateTracklistHighlight();
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
  });
  audio.addEventListener('pause', () => {
    jukeboxIsPlaying = false;
    updateJukeboxPlayPauseIcon();
    updateTracklistHighlight();
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
  });
  audio.addEventListener('ended', () => playJukeboxNext());

  let isScrubbing = false;
  const seek = document.getElementById('jukebox-seek');
  seek.addEventListener('input', () => {
    isScrubbing = true;
    seek.style.setProperty('--jukebox-seek-pct', seek.value + '%');
    document.getElementById('jukebox-time-current').textContent =
      formatJukeboxTime((seek.value / 100) * (audio.duration || 0));
  });
  seek.addEventListener('change', () => {
    if (audio.duration) audio.currentTime = (seek.value / 100) * audio.duration;
    isScrubbing = false;
  });

  audio.addEventListener('timeupdate', () => {
    if (isScrubbing) return;
    const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
    seek.value = pct;
    seek.style.setProperty('--jukebox-seek-pct', pct + '%');
    document.getElementById('jukebox-time-current').textContent = formatJukeboxTime(audio.currentTime);
    if ('mediaSession' in navigator && audio.duration) {
      try {
        navigator.mediaSession.setPositionState({ duration: audio.duration, playbackRate: 1, position: audio.currentTime });
      } catch (e) { /* ignore unsupported states */ }
    }
  });
  audio.addEventListener('loadedmetadata', () => {
    document.getElementById('jukebox-time-duration').textContent = formatJukeboxTime(audio.duration);
  });

  document.getElementById('jukebox-tracklist').addEventListener('click', (e) => {
    const row = e.target.closest('.jukebox-track-row');
    if (!row) return;
    loadJukeboxTrack(Number(row.dataset.index), true);
  });

  document.getElementById('jukebox-playpause').addEventListener('click', toggleJukeboxPlayPause);
  document.getElementById('jukebox-prev').addEventListener('click', playJukeboxPrev);
  document.getElementById('jukebox-next').addEventListener('click', () => playJukeboxNext());

  const shuffleBtn = document.getElementById('jukebox-shuffle');
  shuffleBtn.addEventListener('click', () => {
    jukeboxShuffle = !jukeboxShuffle;
    shuffleBtn.setAttribute('aria-pressed', String(jukeboxShuffle));
  });
  const repeatBtn = document.getElementById('jukebox-repeat');
  repeatBtn.addEventListener('click', () => {
    jukeboxRepeat = !jukeboxRepeat;
    repeatBtn.setAttribute('aria-pressed', String(jukeboxRepeat));
  });
  const muteBtn = document.getElementById('jukebox-mute');
  muteBtn.addEventListener('click', () => {
    jukeboxMuted = !jukeboxMuted;
    muteBtn.setAttribute('aria-pressed', String(jukeboxMuted));
    // Route through setJukeboxVolume rather than duplicating its
    // `jukeboxMuted ? 0 : jukeboxVolume` logic here — the volume ring's
    // dial position (--jukebox-vol) represents the stored level, same as
    // a physical knob not moving when you hit mute, so this leaves it
    // alone (same value) while still applying the mute to audio.volume.
    setJukeboxVolume(jukeboxVolume);
  });

  // volume ring: drag anywhere on the ring to set level (pointer events —
  // works for mouse and touch alike)
  const volRing = document.getElementById('jukebox-volume-ring');
  let volDragging = false;
  function angleToVolume(clientX, clientY) {
    const rect = volRing.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let angle = Math.atan2(clientX - cx, -(clientY - cy));
    if (angle < 0) angle += Math.PI * 2;
    return angle / (Math.PI * 2);
  }
  volRing.addEventListener('pointerdown', (e) => {
    volDragging = true;
    volRing.setPointerCapture(e.pointerId);
    setJukeboxVolume(angleToVolume(e.clientX, e.clientY));
  });
  volRing.addEventListener('pointermove', (e) => {
    if (!volDragging) return;
    setJukeboxVolume(angleToVolume(e.clientX, e.clientY));
  });
  volRing.addEventListener('pointerup', () => { volDragging = false; });
  volRing.addEventListener('pointercancel', () => { volDragging = false; });

  document.getElementById('jukebox-mode-btn').addEventListener('click', cycleJukeboxVisualizerMode);
  document.getElementById('jukebox-visualizer').addEventListener('click', cycleJukeboxVisualizerMode);

  document.addEventListener('keydown', (e) => {
    if (!isJukeboxFocused()) return;
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    if (e.code === 'Space') { e.preventDefault(); toggleJukeboxPlayPause(); }
    else if (e.code === 'ArrowRight') { e.preventDefault(); playJukeboxNext(); }
    else if (e.code === 'ArrowLeft') { e.preventDefault(); playJukeboxPrev(); }
  });

  jukeboxReducedMotionMQ.addEventListener('change', () => startVisualizerLoop());

  setupJukeboxMediaSessionHandlers();
}

function updateJukeboxPlayPauseIcon() {
  const icon = document.getElementById('jukebox-playpause-icon');
  if (!icon) return;
  icon.innerHTML = jukeboxIsPlaying
    ? '<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>'
    : '<path d="M8 5v14l11-7z"/>';
}

// =========================================================
// Visualizer — feedback-buffer technique. Each frame the previous frame
// is redrawn onto a ping-pong buffer with a slight scale/rotate/colour
// shift, then new audio-reactive shapes are painted on top. Real audio
// bands (bass/mid/high) drive it while playing; a gentle synthetic
// drift drives it while idle so the screen is never a black rectangle.
// =========================================================

function initJukeboxPalette() {
  function resolve(varName) {
    const el = document.createElement('div');
    el.style.color = `var(${varName})`;
    document.body.appendChild(el);
    const resolved = getComputedStyle(el).color;
    document.body.removeChild(el);
    return resolved;
  }
  jukeboxPalette = {
    mint: resolve('--aero-aurora-mint'),
    violet: resolve('--aero-aurora-violet'),
    gold: resolve('--aero-aurora-gold'),
    aqua: resolve('--aero-aqua'),
    green: resolve('--start-green-light'),
  };
}

function cycleJukeboxVisualizerMode() {
  setJukeboxVisualizerMode((jukeboxCurrentMode + 1) % 3);
}

function setJukeboxVisualizerMode(mode) {
  if (mode === jukeboxCurrentMode) return;
  jukeboxPrevMode = jukeboxCurrentMode;
  jukeboxCurrentMode = mode;
  jukeboxModeBlendStart = performance.now();
}

function getJukeboxModeBlend() {
  return Math.min(1, (performance.now() - jukeboxModeBlendStart) / JUKEBOX_MODE_BLEND_MS);
}

function pickJukeboxPaletteColor(mode, seed) {
  const idx = Math.abs(Math.floor(seed));
  const sets = [
    [jukeboxPalette.mint, jukeboxPalette.aqua, jukeboxPalette.violet],
    [jukeboxPalette.violet, jukeboxPalette.gold, jukeboxPalette.aqua],
    [jukeboxPalette.green, jukeboxPalette.mint, jukeboxPalette.gold],
  ];
  const set = sets[mode] || sets[0];
  return set[idx % set.length] || '#7ec8ff';
}

// Scale is a self-correcting oscillation around 1.0 (a "breathe"), not a
// one-directional drift — a fixed >1 zoom compounds every single frame at
// 60fps and washes the feedback buffer out to a flat colour within a few
// seconds of real playback. bassPush is zero-centred (typical bass ~0.3
// contributes ~0) so sustained loud bass can't make it run away either.
function getJukeboxModeParams(mode, bands) {
  const breathe = Math.sin(jukeboxDriftPhase * 0.5);
  const bassPush = (bands.bass - 0.3) * 0.02;
  if (mode === 0) return { scale: 1 + breathe * 0.006 + bassPush * 0.5, rotate: 0.0015 + bands.mid * 0.01 };
  if (mode === 1) return { scale: 1 + breathe * 0.01 + bassPush * 0.9, rotate: 0.004 + bands.mid * 0.02 };
  return { scale: 1 + breathe * 0.004 + bassPush * 0.4, rotate: 0.0006 + bands.mid * 0.003 };
}

function ensureJukeboxBuffers(w, h) {
  if (jukeboxBufA && jukeboxBufA.width === w && jukeboxBufA.height === h) return;
  jukeboxBufA = document.createElement('canvas');
  jukeboxBufB = document.createElement('canvas');
  jukeboxBufA.width = jukeboxBufB.width = w;
  jukeboxBufA.height = jukeboxBufB.height = h;
  jukeboxBufActx = jukeboxBufA.getContext('2d');
  jukeboxBufBctx = jukeboxBufB.getContext('2d');
  jukeboxBufActx.fillStyle = '#050508';
  jukeboxBufActx.fillRect(0, 0, w, h);
  jukeboxBufBctx.fillStyle = '#050508';
  jukeboxBufBctx.fillRect(0, 0, w, h);
}

function drawJukeboxFeedback(ctx, prevCanvas, w, h, scale, rotate) {
  const cx = w / 2, cy = h / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotate);
  ctx.scale(scale, scale);
  ctx.translate(-cx, -cy);
  ctx.globalAlpha = 0.94;
  ctx.drawImage(prevCanvas, 0, 0, w, h);
  ctx.restore();

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = pickJukeboxPaletteColor(jukeboxCurrentMode, jukeboxDriftPhase * 2);
  ctx.globalAlpha = 0.06;
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

function drawJukeboxAmbientSwirl(ctx, w, h, bands) {
  const cx = w / 2, cy = h / 2;
  const t = jukeboxDriftPhase;
  const ribbons = 3;
  for (let i = 0; i < ribbons; i++) {
    const angle = t * 1.3 + (i * Math.PI * 2) / ribbons;
    const r = Math.min(w, h) * 0.28 * (0.6 + 0.4 * Math.sin(t * 0.7 + i));
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r * 0.8;
    const rad = 18 + bands.bass * 70 + i * 4;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, rad);
    grad.addColorStop(0, pickJukeboxPaletteColor(0, i));
    grad.addColorStop(1, 'transparent');
    ctx.globalAlpha = 0.3 + bands.high * 0.3;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawJukeboxTunnel(ctx, w, h, bands) {
  const cx = w / 2, cy = h / 2;
  const segments = 8;
  const t = jukeboxDriftPhase * 1.5;
  for (let i = 0; i < segments; i++) {
    const a = (Math.PI * 2 / segments) * i + t;
    const len = Math.min(w, h) * (0.15 + 0.35 * (0.5 + 0.5 * Math.sin(t * 2 + i)) + bands.bass * 0.25);
    ctx.strokeStyle = pickJukeboxPaletteColor(1, i);
    ctx.lineWidth = 2 + bands.high * 6;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawJukeboxBloom(ctx, w, h, bands, onset) {
  const cx = w / 2, cy = h / 2;
  if (onset) {
    const count = 10 + Math.floor(bands.bass * 20);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4 + bands.bass * 6;
      jukeboxBloomParticles.push({
        x: cx, y: cy, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
        life: 1, color: pickJukeboxPaletteColor(2, i),
      });
    }
  }
  jukeboxBloomParticles.forEach((p) => { p.x += p.vx; p.y += p.vy; p.life -= 0.02; });
  jukeboxBloomParticles = jukeboxBloomParticles.filter((p) => p.life > 0);
  jukeboxBloomParticles.forEach((p) => {
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3 + bands.high * 5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function drawJukeboxModeShapes(mode, ctx, w, h, bands, onset) {
  if (mode === 0) drawJukeboxAmbientSwirl(ctx, w, h, bands);
  else if (mode === 1) drawJukeboxTunnel(ctx, w, h, bands);
  else drawJukeboxBloom(ctx, w, h, bands, onset);
}

function drawJukeboxOnsetBurst(ctx, w, h, mode) {
  const cx = w / 2, cy = h / 2;
  const r = Math.min(w, h) * 0.5;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  grad.addColorStop(0, pickJukeboxPaletteColor(mode, Math.random() * 3));
  grad.addColorStop(1, 'transparent');
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawJukeboxReducedMotionFallback(ctx, w, h) {
  if (!jukeboxPalette) initJukeboxPalette();
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, jukeboxPalette.mint);
  grad.addColorStop(1, jukeboxPalette.violet);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function jukeboxLoopStep() {
  if (!jukeboxVisualizerCanvas) {
    jukeboxVisualizerCanvas = document.getElementById('jukebox-visualizer');
    jukeboxVisualizerCtx = jukeboxVisualizerCanvas ? jukeboxVisualizerCanvas.getContext('2d') : null;
  }
  const canvas = jukeboxVisualizerCanvas;
  if (!canvas) { visualizerRaf = null; return; }
  const ctx = jukeboxVisualizerCtx;
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.round(rect.width));
  const h = Math.max(1, Math.round(rect.height));
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }

  if (jukeboxReducedMotionMQ.matches) {
    drawJukeboxReducedMotionFallback(ctx, w, h);
    visualizerRaf = null;
    return;
  }

  if (!jukeboxPalette) initJukeboxPalette();
  ensureJukeboxBuffers(w, h);

  let bands, onset;
  if (jukeboxIsPlaying && jukeboxAnalyser) {
    bands = getJukeboxBands();
    onset = detectJukeboxOnset(bands.bass);
  } else {
    const t = jukeboxDriftPhase;
    bands = {
      bass: 0.15 + 0.1 * Math.sin(t * 0.6),
      mid: 0.2 + 0.08 * Math.sin(t * 0.9 + 1),
      high: 0.15 + 0.08 * Math.sin(t * 1.3 + 2),
    };
    onset = Math.floor(t * 10) % 130 === 0;
  }

  jukeboxDriftPhase += 0.004 + bands.mid * 0.01;

  const blend = getJukeboxModeBlend();
  const paramsA = getJukeboxModeParams(jukeboxPrevMode, bands);
  const paramsB = getJukeboxModeParams(jukeboxCurrentMode, bands);
  const scale = paramsA.scale + (paramsB.scale - paramsA.scale) * blend;
  const rotate = paramsA.rotate + (paramsB.rotate - paramsA.rotate) * blend;

  jukeboxBufBctx.clearRect(0, 0, w, h);
  drawJukeboxFeedback(jukeboxBufBctx, jukeboxBufA, w, h, scale, rotate);

  if (blend < 1) {
    jukeboxBufBctx.globalAlpha = 1 - blend;
    drawJukeboxModeShapes(jukeboxPrevMode, jukeboxBufBctx, w, h, bands, false);
    jukeboxBufBctx.globalAlpha = 1;
  }
  drawJukeboxModeShapes(jukeboxCurrentMode, jukeboxBufBctx, w, h, bands, onset);
  if (onset && jukeboxCurrentMode !== 2) drawJukeboxOnsetBurst(jukeboxBufBctx, w, h, jukeboxCurrentMode);

  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(jukeboxBufB, 0, 0);

  const swapCanvas = jukeboxBufA; jukeboxBufA = jukeboxBufB; jukeboxBufB = swapCanvas;
  const swapCtx = jukeboxBufActx; jukeboxBufActx = jukeboxBufBctx; jukeboxBufBctx = swapCtx;

  visualizerRaf = requestAnimationFrame(jukeboxLoopStep);
}

function startVisualizerLoop() {
  if (visualizerRaf) return;
  visualizerRaf = requestAnimationFrame(jukeboxLoopStep);
}

function stopVisualizerLoop() {
  if (visualizerRaf) {
    cancelAnimationFrame(visualizerRaf);
    visualizerRaf = null;
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopVisualizerLoop();
  else {
    const win = document.getElementById('window-music');
    if (win && win.style.display !== 'none') startVisualizerLoop();
  }
});
