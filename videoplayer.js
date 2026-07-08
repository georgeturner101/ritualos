// =========================================================
// VIDEO PLAYER — rebuilt as a video sibling of the Jukebox (Aero Phase 2
// device 2). Native <video>, built-in video list (videos/index.json),
// fixed transport lobes (left: skip-back/play/rewind, right: fast-
// forward/pause/skip-forward), vertical volume fader, timecode seek bar,
// full screen toggle. Loaded from index.html after script.js; openWindow()
// calls initVideoPlayer() the first time the window opens, closeWindow()
// calls pauseVideoPlayer().
// =========================================================

let videoPlayerInitialized = false;
let videoPlayerFiles = [];
let videoPlayerCurrentIndex = 0;
let videoPlayerHasLoaded = false;

function initVideoPlayer() {
  if (videoPlayerInitialized) return;
  videoPlayerInitialized = true;

  wireVideoPlayerControls();
  setVideoPlayerVolume(1);

  fetch('videos/index.json')
    .then((res) => res.json())
    .then((files) => {
      videoPlayerFiles = files || [];
      renderVideoPlayerList();
    })
    .catch((err) => {
      console.error('Video Player: failed to load videos/index.json', err);
      videoPlayerFiles = [];
    });
}

function pauseVideoPlayer() {
  const video = document.getElementById('videoplayer-frame');
  if (video && !video.paused) video.pause();
}

// =========================================================
// List
// =========================================================

function videoPlayerTitleFromFilename(filename) {
  return filename.replace(/\.[^./]+$/, '');
}

function renderVideoPlayerList() {
  const list = document.getElementById('videoplayer-list');
  if (!list) return;
  list.innerHTML = '';

  videoPlayerFiles.forEach((filename, i) => {
    const row = document.createElement('div');
    row.className = 'videoplayer-list-row';
    row.dataset.index = String(i);

    const num = document.createElement('span');
    num.className = 'videoplayer-list-num';
    num.textContent = String(i + 1);

    const name = document.createElement('span');
    name.className = 'videoplayer-list-name';
    name.textContent = videoPlayerTitleFromFilename(filename);

    const eq = document.createElement('span');
    eq.className = 'videoplayer-list-eq';
    eq.innerHTML = '<span></span><span></span><span></span>';

    row.append(num, name, eq);
    list.appendChild(row);
  });

  updateVideoPlayerListHighlight();
}

function updateVideoPlayerListHighlight() {
  const video = document.getElementById('videoplayer-frame');
  const isPlaying = video && !video.paused;
  document.querySelectorAll('.videoplayer-list-row').forEach((row) => {
    const idx = Number(row.dataset.index);
    row.classList.toggle('playing', idx === videoPlayerCurrentIndex && isPlaying);
  });
}

function setVideoPlayerTitle(filename) {
  const el = document.getElementById('videoplayer-title-text');
  if (!el) return;
  const wrap = el.closest('.videoplayer-title-readout');
  const label = videoPlayerTitleFromFilename(filename);
  el.textContent = label;
  if (wrap && el.scrollWidth > wrap.clientWidth) {
    el.textContent = `${label}     •     ${label}`;
  }
}

function formatVideoPlayerTime(seconds) {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// =========================================================
// Playback control
// =========================================================

function loadVideoPlayerVideo(index, autoplay) {
  const filename = videoPlayerFiles[index];
  if (!filename) return;
  videoPlayerCurrentIndex = index;
  videoPlayerHasLoaded = true;

  const video = document.getElementById('videoplayer-frame');
  video.src = `videos/${encodeURIComponent(filename)}`;
  video.load();

  setVideoPlayerTitle(filename);
  updateVideoPlayerListHighlight();

  document.getElementById('videoplayer-time-current').textContent = '0:00';
  document.getElementById('videoplayer-time-duration').textContent = '0:00';
  const seek = document.getElementById('videoplayer-seek');
  seek.value = 0;
  seek.style.setProperty('--videoplayer-seek-pct', '0%');

  if (autoplay) video.play().catch((err) => console.error('Video Player: play failed', err));
}

function videoPlayerSkipBack() {
  if (!videoPlayerFiles.length) return;
  const idx = Math.max(0, videoPlayerCurrentIndex - 1);
  loadVideoPlayerVideo(idx, true);
}

function videoPlayerSkipForward() {
  if (!videoPlayerFiles.length) return;
  const idx = Math.min(videoPlayerFiles.length - 1, videoPlayerCurrentIndex + 1);
  if (idx === videoPlayerCurrentIndex) return;
  loadVideoPlayerVideo(idx, true);
}

function videoPlayerPlay() {
  const video = document.getElementById('videoplayer-frame');
  if (!videoPlayerHasLoaded) {
    loadVideoPlayerVideo(videoPlayerCurrentIndex, true);
    return;
  }
  video.play().catch((err) => console.error('Video Player: play failed', err));
}

function videoPlayerPause() {
  document.getElementById('videoplayer-frame').pause();
}

function videoPlayerSeekBy(deltaSeconds) {
  const video = document.getElementById('videoplayer-frame');
  if (!isFinite(video.duration)) return;
  video.currentTime = Math.min(video.duration, Math.max(0, video.currentTime + deltaSeconds));
}

function setVideoPlayerVolume(v) {
  const video = document.getElementById('videoplayer-frame');
  const clamped = Math.min(1, Math.max(0, v));
  video.volume = clamped;
  const volSlider = document.getElementById('videoplayer-volume');
  volSlider.value = Math.round(clamped * 100);
  volSlider.style.setProperty('--videoplayer-vol-pct', `${clamped * 100}%`);
}

function isVideoPlayerFocused() {
  const win = document.getElementById('window-video-viewer');
  if (!win || win.style.display === 'none') return false;
  return typeof topZ !== 'undefined' && String(win.style.zIndex) === String(topZ);
}

// =========================================================
// Wiring
// =========================================================

function wireVideoPlayerControls() {
  const video = document.getElementById('videoplayer-frame');

  video.addEventListener('play', () => {
    updateVideoPlayerListHighlight();
    document.getElementById('videoplayer-play').classList.add('videoplayer-active');
    document.getElementById('videoplayer-pause').classList.remove('videoplayer-active');
  });
  video.addEventListener('pause', () => {
    updateVideoPlayerListHighlight();
    document.getElementById('videoplayer-play').classList.remove('videoplayer-active');
    document.getElementById('videoplayer-pause').classList.add('videoplayer-active');
  });
  video.addEventListener('ended', () => videoPlayerSkipForward());

  let isScrubbing = false;
  const seek = document.getElementById('videoplayer-seek');
  seek.addEventListener('input', () => {
    isScrubbing = true;
    seek.style.setProperty('--videoplayer-seek-pct', seek.value + '%');
    document.getElementById('videoplayer-time-current').textContent =
      formatVideoPlayerTime((seek.value / 100) * (video.duration || 0));
  });
  seek.addEventListener('change', () => {
    if (video.duration) video.currentTime = (seek.value / 100) * video.duration;
    isScrubbing = false;
  });

  video.addEventListener('timeupdate', () => {
    if (isScrubbing) return;
    const pct = video.duration ? (video.currentTime / video.duration) * 100 : 0;
    seek.value = pct;
    seek.style.setProperty('--videoplayer-seek-pct', pct + '%');
    document.getElementById('videoplayer-time-current').textContent = formatVideoPlayerTime(video.currentTime);
  });
  video.addEventListener('loadedmetadata', () => {
    document.getElementById('videoplayer-time-duration').textContent = formatVideoPlayerTime(video.duration);
  });

  document.getElementById('videoplayer-list').addEventListener('click', (e) => {
    const row = e.target.closest('.videoplayer-list-row');
    if (!row) return;
    loadVideoPlayerVideo(Number(row.dataset.index), true);
  });

  document.getElementById('videoplayer-play').addEventListener('click', videoPlayerPlay);
  document.getElementById('videoplayer-pause').addEventListener('click', videoPlayerPause);
  document.getElementById('videoplayer-rewind').addEventListener('click', () => videoPlayerSeekBy(-10));
  document.getElementById('videoplayer-fast-forward').addEventListener('click', () => videoPlayerSeekBy(10));
  document.getElementById('videoplayer-skip-back').addEventListener('click', videoPlayerSkipBack);
  document.getElementById('videoplayer-skip-forward').addEventListener('click', videoPlayerSkipForward);

  const volSlider = document.getElementById('videoplayer-volume');
  volSlider.addEventListener('input', () => setVideoPlayerVolume(volSlider.value / 100));

  document.getElementById('videoplayer-fullscreen-btn').addEventListener('click', () => {
    if (video.requestFullscreen) {
      // requestFullscreen() returns a promise that can reject (e.g. denied
      // by a Permissions-Policy, or called outside the transient-activation
      // window) — left uncaught, that's an unhandled rejection.
      video.requestFullscreen().catch((err) => console.error('Video Player: fullscreen failed', err));
    } else if (typeof video.webkitEnterFullscreen === 'function') {
      // iOS Safari doesn't support Fullscreen API on <video>, only this
      video.webkitEnterFullscreen();
    }
  });

  video.addEventListener('click', () => {
    if (video.paused) videoPlayerPlay(); else videoPlayerPause();
  });

  document.addEventListener('keydown', (e) => {
    if (!isVideoPlayerFocused()) return;
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    if (e.code === 'Space') {
      e.preventDefault();
      if (video.paused) videoPlayerPlay(); else videoPlayerPause();
    } else if (e.code === 'ArrowRight') {
      e.preventDefault();
      videoPlayerSeekBy(10);
    } else if (e.code === 'ArrowLeft') {
      e.preventDefault();
      videoPlayerSeekBy(-10);
    }
  });
}
