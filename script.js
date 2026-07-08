// =========================
// GLOBAL STATE
// =========================

// Read a RitualOS palette variable for contexts (canvas) that can't use var() directly
function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

let topZ = 10;
let tunaGameInterval = null;
let tunaKeyListener = null;

// Respect users who prefer reduced motion (skips ghost trails; the
// cursor trail in cursor-fx.js checks the same media query itself)
const prefersReducedMotion =
  window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const icons = [
  { name: 'Exhibitions', icon: 'folder.png', window: 'exhibitions', flyout: 'exhibitions' },
  { name: 'Freelance', icon: 'drive.png', window: 'freelance', flyout: 'freelance' },
  { name: 'About Me', icon: 'book.png', window: 'about' },
  { name: 'Music', icon: 'headphones.png', window: 'music' },
  { name: 'Contact', icon: 'phone.png', window: 'contact' },
  { name: 'Birdsweeper', icon: 'game.png', window: 'game' },
  { name: 'Tuna', icon: 'tuna.png', window: 'tuna' },
  { name: 'Video', icon: 'video.png', window: 'video-viewer' },
  { name: 'Internet', icon: 'internet.png', window: 'internet' },
  { name: 'Press', icon: 'press.png', window: 'press' },
  { name: 'Paint', icon: 'gtpaint.png', window: 'gtpaint' },
  { name: 'Bird Call', icon: 'birdart.png', window: 'birdart' }
];

const birdIcons = [
  'icons/kakapo.png',
  'icons/kaka.png',
  'icons/tui.png'
];

const internetLinks = [
  { title: "Heavy Chest, Benee – Sunday926", url: "https://www.youtube.com/watch?v=jxwbtwL-2JM&ab_channel=HEAVYCHEST" },
  { title: "George Turner – Lost at Home", url: "https://www.youtube.com/watch?v=r9GqI2HaAJE&ab_channel=GeorgeTurner%28GeorgeTurner%29" },
  { title: "George Turner – Love", url: "https://www.youtube.com/watch?v=EMAbum6atCM&ab_channel=GeorgeTurner%28GeorgeTurner%29" },
  { title: "George Turner – Thank You For Your Time (EP)", url: "https://www.youtube.com/watch?v=MUn0ev3RRWs&ab_channel=GeorgeTurner%28GeorgeTurner%29" },
  { title: "George Turner – Insect (LP)", url: "https://www.youtube.com/watch?v=g7BoxPGBKE0&ab_channel=GeorgeTurner-Topic" },
  { title: "Bay1 – Bae1", url: "https://www.youtube.com/watch?v=2tn9MAEhTSc&ab_channel=%E3%83%87%E3%83%BC%E3%83%A2%E3%83%B3Astari" },
  { title: "FCKCPS ft. George Turner – Block Queen", url: "https://www.youtube.com/watch?v=lLBya7p94Uo&ab_channel=GeorgeTurner%28GeorgeTurner%29" },
  { title: "Avito – Pancakes", url: "https://www.youtube.com/watch?v=C9ixKJKszq4&ab_channel=GeorgeTurner%28GeorgeTurner%29" },
  { title: "Exhibition – Free of Charge", url: "https://freeofcharge.space/" },
  { title: "Exhibition – Depot Artspace", url: "https://depot.org.nz/event/towards-equilibrium/" },
  { title: "Exhibition – Bowen Gallery", url: "https://bowengalleries.nz/george-turner-second-impressions/" },
  { title: "Exhibition – Astor Bristed", url: "https://www.astorbristed.co.nz/exhibitions/29-george-turner/" },
  { title: "Exhibition – Webb's", url: "https://auctions.webbs.co.nz/lot-details/index/catalog/718/lot/211832/GEORGE-TURNER-The-River-Bank" }
];

const pressLinks = [
  { title: "PAI_32 – Artist of the Month Interview", url: "https://pai32.com/2026/02/12/george-turner/" },
  { title: "Salive.Live – Stages of grief Review", url: "https://saliva.live/exhibitions/8a8c7707" },
  { title: "Vice – Talking Stage Presence and Art Practice with George Turner", url: "https://www.vice.com/en/article/talking-stage-presence-and-art-practice-with-george-turner/" },
  { title: "Fucking Young – George Turner is Your New Favourite Avant-Pop Artist", url: "https://fuckingyoung.es/george-turner-new-favourite-avant-pop-artist/" },
  { title: "Sniffers – George Turner fuses fine arts with synth pop on ‘Lost at Home’", url: "https://www.sniffers.co.nz/article/george-turner-fuses-fine-arts-synth-pop-lost-home" },
  { title: "Sniffers – George Turner grounds themselves with debut album, ‘Insect’", url: "https://www.sniffers.co.nz/article/george-turner-grounds-debut-album-insect" },
  { title: "Sniffers – George Turner plants their Roots", url: "https://sniffers.co.nz/article/george-turner-plants-roots-kauri" },
  { title: "Under the Radar – New Single", url: "https://www.undertheradar.co.nz/news/12211/Listen-George-Turner--Age-of-Aquarius.utr" },
  { title: "Massive Magazine – Artist Profile", url: "https://www.massivemagazine.org.nz/articles/ntqehy32wf0jufy44xsvam2bwlv49s" }
];

// =========================
// BOOT / INIT
// =========================

window.addEventListener('load', function () {
  const boot = document.getElementById('boot-screen');
  if (boot) {
    setTimeout(() => {
      boot.style.display = 'none';
    }, 3000);
  }

  const clock = document.getElementById('clock');
  if (clock) {
    const updateClock = () => {
      const now = new Date();
      clock.textContent = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    };
    updateClock();
    setInterval(updateClock, 30000); // clock shows minutes only — no need to tick every second
  }

  initAudio();

  document.body.style.cursor = "url('icons/glitter-cursor.png'), auto";

  buildDesktopIcons();
  buildTaskbarApps();
  buildStartMenu();
  loadIconPositions();
  makeIconsDraggable();
  initWindowDragging();

  listPDFs('exhibitions', 'pdfs-exhibitions');
  listPDFs('freelance', 'pdfs-freelance');
  renderLinkList(internetLinks, 'internet-links');
  renderLinkList(pressLinks, 'press-links');

  initDesktopSelection();
  initGlobalWindowFocus();
  initStartMenuDismiss();
  initGhost();
});

// =========================
// AUDIO
// =========================

function initAudio() {
  const startup = document.getElementById('startup');
  const ambient = document.getElementById('ambient-sound');

  const tryPlay = () => {
    if (startup) startup.play().catch(() => {});
    if (ambient) ambient.play().catch(() => {});
  };

  tryPlay();

  // Browsers block autoplay until the user interacts — retry once on first interaction
  const unlock = () => {
    if (ambient && ambient.paused) {
      ambient.play().catch(() => {});
    }
    document.removeEventListener('pointerdown', unlock);
  };
  document.addEventListener('pointerdown', unlock, { once: true });
}

function toggleAudio() {
  const ambient = document.getElementById('ambient-sound');
  const button = document.getElementById('audio-toggle');
  if (!ambient || !button) return;

  if (!ambient.paused) {
    ambient.pause();
    button.textContent = '🔇';
    button.setAttribute('aria-pressed', 'false');
  } else {
    ambient.play().catch(() => {});
    button.textContent = '🔊';
    button.setAttribute('aria-pressed', 'true');
  }
}

// =========================
// WINDOW HELPERS
// =========================

function bringToFront(win) {
  if (!win) return;
  topZ++;
  win.style.zIndex = topZ;
}

function centerWindow(win) {
  if (!win) return;

  const prevDisplay = win.style.display;
  const computed = getComputedStyle(win);

  if (computed.display === 'none') {
    win.style.visibility = 'hidden';
    win.style.display = 'flex';
  }

  const width = win.offsetWidth || 430;
  const height = win.offsetHeight || 320;

  const left = Math.max((window.innerWidth - width) / 2, 20);
  const top = Math.max((window.innerHeight - height) / 2 - 20, 20);

  win.style.left = `${left}px`;
  win.style.top = `${top}px`;

  if (win.style.visibility === 'hidden') {
    win.style.visibility = '';
    win.style.display = prevDisplay || 'none';
  }
}

// Keep a window at least partially on screen (used on resize)
function clampWindowIntoView(win) {
  const width = win.offsetWidth;
  const height = win.offsetHeight;
  const taskbarHeight = 40;

  let left = parseFloat(win.style.left) || 0;
  let top = parseFloat(win.style.top) || 0;

  left = Math.min(Math.max(left, 10 - width + 80), window.innerWidth - 80);
  top = Math.min(Math.max(top, 0), window.innerHeight - taskbarHeight - 40);

  win.style.left = `${left}px`;
  win.style.top = `${top}px`;
}

function playWindowOpenAnimation(win) {
  if (!win) return;
  win.classList.remove('window-opening');
  void win.offsetWidth;
  win.classList.add('window-opening');
}

function openWindow(name) {
  closeStartMenu();

  if (name === 'birdart') {
    window.open('./birdart/index.html', '_blank', 'noopener');
    return;
  }

  const win = document.getElementById(`window-${name}`);
  if (!win) return;

  win.style.display = 'flex';
  centerWindow(win);
  playWindowOpenAnimation(win);
  bringToFront(win);
  updateAppStates();

  if (typeof spawnLensFlares === 'function') {
    spawnLensFlares(win);
  }

  if (name === 'tuna') {
    setTimeout(initTunaGame, 100);
  }

  if (name === 'game') {
    setTimeout(initBirdsweeper, 50);
  }

  if (name === 'gtpaint') {
    setTimeout(initGTPaint, 50);
  }

  if (name === 'music') {
    setTimeout(initMusicPlayer, 50);
  }

  if (name === 'video-viewer') {
    setTimeout(initVideoPlayer, 50);
  }
}

function closeWindow(name) {
  const win = document.getElementById(`window-${name}`);
  if (!win) return;

  // confirmGTPaintClose() now shows an aero-styled modal instead of a
  // native confirm() dialog, so it can't return a boolean synchronously
  // — it calls this callback once the user actually confirms.
  if (name === 'gtpaint' && typeof confirmGTPaintClose === 'function') {
    confirmGTPaintClose(() => finishCloseWindow(name));
    return;
  }

  finishCloseWindow(name);
}

function finishCloseWindow(name) {
  const win = document.getElementById(`window-${name}`);
  if (!win) return;

  win.style.display = 'none';

  // Stop game loops / media when their windows close
  if (name === 'tuna') stopTunaGame();
  if (name === 'video-viewer' && typeof pauseVideoPlayer === 'function') {
    pauseVideoPlayer();
  }
  if (name === 'pdf-viewer') {
    const pdfFrame = document.getElementById('pdf-frame');
    if (pdfFrame) pdfFrame.src = '';
  }
  if (name === 'music' && typeof pauseMusicPlayer === 'function') {
    pauseMusicPlayer();
  }

  updateAppStates();
}

function updateAppStates() {
  document.querySelectorAll('.taskbar-app').forEach(app => {
    const win = document.getElementById(`window-${app.dataset.window}`);
    if (win && getComputedStyle(win).display !== 'none') {
      app.classList.add('active');
    } else {
      app.classList.remove('active');
    }
  });
}

window.addEventListener('resize', () => {
  document.querySelectorAll('.window').forEach(win => {
    // .tuna-popup and .gtpaint-modal both self-center via position:fixed +
    // translate(-50%,-50%) — clampWindowIntoView's inline left/top would
    // fight that transform and push them off-screen (same bug, same fix
    // for both: see DESIGN.md).
    if (getComputedStyle(win).display !== 'none' && !win.classList.contains('tuna-popup') && !win.classList.contains('gtpaint-modal')) {
      clampWindowIntoView(win);
    }
  });
});

// =========================
// START MENU
// =========================

function toggleStartMenu() {
  const menu = document.getElementById('start-menu');
  const startButton = document.getElementById('start-button');
  if (!menu) return;

  menu.classList.toggle('hidden');
  if (startButton) {
    startButton.setAttribute('aria-expanded', String(!menu.classList.contains('hidden')));
  }
}

function closeStartMenu() {
  const menu = document.getElementById('start-menu');
  const startButton = document.getElementById('start-button');
  if (menu && !menu.classList.contains('hidden')) {
    menu.classList.add('hidden');
    if (startButton) startButton.setAttribute('aria-expanded', 'false');
  }
}

function initStartMenuDismiss() {
  document.addEventListener('mousedown', (e) => {
    const menu = document.getElementById('start-menu');
    if (!menu || menu.classList.contains('hidden')) return;

    if (!e.target.closest('#start-menu') && !e.target.closest('#start-button')) {
      closeStartMenu();
    }
  });
}

function buildStartMenu() {
  const list = document.getElementById('start-menu-list');
  if (!list) return;

  list.innerHTML = '';

  icons.forEach(i => {
    const li = document.createElement('li');
    li.className = 'start-menu-item';
    li.innerHTML = `<img class="start-menu-icon" src="icons/${i.icon}" alt="">
      <span class="start-menu-label">${i.name}</span>`;

    li.addEventListener('click', () => openWindow(i.window));

    if (i.flyout) {
      li.classList.add('has-flyout');
      li.innerHTML += `<span class="start-menu-arrow">&#9656;</span>
        <div class="start-menu-flyout" id="flyout-${i.flyout}"></div>`;
      populateStartMenuFlyout(i.flyout);
    }

    list.appendChild(li);
  });
}

function populateStartMenuFlyout(folder) {
  fetch(`pdfs/${folder}/index.json`)
    .then(res => res.json())
    .then(files => {
      const cont = document.getElementById(`flyout-${folder}`);
      if (!cont) return;

      cont.innerHTML = '';
      files.forEach(name => {
        const item = document.createElement('a');
        item.href = '#';
        item.className = 'start-menu-flyout-item';
        item.textContent = name.replace('.pdf', '').replace(/_/g, ' ');
        item.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          closeStartMenu();
          openPDF(`pdfs/${folder}/${name}`);
        };
        cont.appendChild(item);
      });
    })
    .catch(() => {});
}

// =========================
// DESKTOP ICONS
// =========================

function buildDesktopIcons() {
  const desktop = document.getElementById('desktop');
  if (!desktop) return;

  desktop.innerHTML = '';

  const savedPositions = localStorage.getItem('iconPositions');
  const hasSaved = !!savedPositions;

  icons.forEach((i, index) => {
    const el = document.createElement('div');
    el.classList.add('icon');
    el.innerHTML = `<img src="icons/${i.icon}" alt="${i.name}"><div class="icon-title">${i.name}</div>`;

    if (!hasSaved) {
      const maxRowsPerColumn = 5;
      const spacingX = 140;
      const spacingY = 140;
      const startX = 40;
      const startY = 60;

      const col = Math.floor(index / maxRowsPerColumn);
      const row = index % maxRowsPerColumn;

      el.style.position = 'absolute';
      el.style.left = `${startX + col * spacingX}px`;
      el.style.top = `${startY + row * spacingY}px`;
    }

    const openAndHighlight = () => {
      // If the icon was just dragged, don't treat the mouseup as a click
      if (el.dataset.suppressClick === 'true') {
        el.dataset.suppressClick = 'false';
        return;
      }
      document.querySelectorAll('.icon').forEach(icon => icon.classList.remove('selected'));
      el.classList.add('selected');
      openWindow(i.window);
    };

    el.querySelector('img').addEventListener('click', openAndHighlight);
    el.querySelector('.icon-title').addEventListener('click', openAndHighlight);

    desktop.appendChild(el);
  });
}

function saveIconPositions() {
  const positions = Array.from(document.querySelectorAll('.icon')).map(icon => ({
    name: icon.querySelector('.icon-title').textContent,
    left: icon.style.left,
    top: icon.style.top
  }));
  localStorage.setItem('iconPositions', JSON.stringify(positions));
}

function loadIconPositions() {
  const saved = localStorage.getItem('iconPositions');
  if (!saved) return;

  let positions = [];
  try {
    positions = JSON.parse(saved) || [];
  } catch (err) {
    localStorage.removeItem('iconPositions');
    return;
  }

  const allIcons = document.querySelectorAll('.icon');

  allIcons.forEach((icon, index) => {
    const name = icon.querySelector('.icon-title').textContent;
    const savedPos = positions.find(p => p.name === name);

    if (savedPos) {
      icon.style.position = 'absolute';
      icon.style.left = savedPos.left;
      icon.style.top = savedPos.top;
    } else {
      const maxRowsPerColumn = 5;
      const spacingX = 140;
      const spacingY = 140;
      const startX = 40;
      const startY = 60;

      const col = Math.floor(index / maxRowsPerColumn);
      const row = index % maxRowsPerColumn;

      icon.style.position = 'absolute';
      icon.style.left = `${startX + col * spacingX}px`;
      icon.style.top = `${startY + row * spacingY}px`;
    }
  });
}

function makeIconsDraggable() {
  const desktop = document.getElementById('desktop');
  if (!desktop) return;

  let isDragging = false;
  let currentIcon = null;
  let offsetX = 0;
  let offsetY = 0;
  let startClientX = 0;
  let startClientY = 0;
  let moved = false;

  desktop.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;

    const icon = e.target.closest('.icon');
    if (!icon) return;

    currentIcon = icon;
    offsetX = e.clientX - icon.offsetLeft;
    offsetY = e.clientY - icon.offsetTop;
    startClientX = e.clientX;
    startClientY = e.clientY;
    moved = false;
    isDragging = true;

    icon.style.zIndex = '10000';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging || !currentIcon) return;

    // Only count it as a drag once the mouse has actually moved a little
    if (!moved) {
      const dx = Math.abs(e.clientX - startClientX);
      const dy = Math.abs(e.clientY - startClientY);
      if (dx > 4 || dy > 4) {
        moved = true;
        currentIcon.classList.add('dragging');
      } else {
        return;
      }
    }

    currentIcon.style.left = `${e.clientX - offsetX}px`;
    currentIcon.style.top = `${e.clientY - offsetY}px`;
  });

  document.addEventListener('mouseup', () => {
    if (!isDragging || !currentIcon) return;

    isDragging = false;
    currentIcon.classList.remove('dragging');
    currentIcon.style.zIndex = '';

    if (moved) {
      const icon = currentIcon;
      icon.dataset.suppressClick = 'true';
      // Clear the flag right after this event cycle so it can't
      // accidentally swallow a future genuine click
      setTimeout(() => { icon.dataset.suppressClick = 'false'; }, 0);
      saveIconPositions();
    }

    currentIcon = null;
  });
}

// =========================
// TASKBAR APPS
// =========================

function buildTaskbarApps() {
  const taskbarApps = document.getElementById('taskbar-apps');
  if (!taskbarApps) return;

  taskbarApps.innerHTML = '';

  icons.forEach(i => {
    const app = document.createElement('div');
    app.classList.add('taskbar-app');
    app.style.backgroundImage = `url(icons/${i.icon})`;
    app.dataset.window = i.window;
    app.setAttribute('role', 'button');
    app.setAttribute('aria-label', `Open ${i.name}`);
    app.setAttribute('title', i.name);

    app.onclick = () => {
      openWindow(i.window);
    };

    taskbarApps.appendChild(app);
  });
}

// =========================
// PDF / VIDEO / LINKS
// =========================

function listPDFs(folder, containerId) {
  fetch(`pdfs/${folder}/index.json`)
    .then(res => res.json())
    .then(files => {
      const cont = document.getElementById(containerId);
      if (!cont) return;

      cont.innerHTML = '';
      files.forEach(name => {
        const link = document.createElement('a');
        link.href = '#';
        link.className = 'aero-content-bubble';
        link.textContent = name.replace('.pdf', '').replace(/_/g, ' ');
        link.onclick = (e) => {
          e.preventDefault();
          openPDF(`pdfs/${folder}/${name}`);
        };
        cont.appendChild(link);
      });
    })
    .catch(err => console.error(err));
}

function openPDF(src) {
  const frame = document.getElementById('pdf-frame');
  const viewer = document.getElementById('window-pdf-viewer');
  if (!frame || !viewer) return;

  frame.src = `${src}#toolbar=0&navpanes=0&scrollbar=0`;
  viewer.style.width = '80vw';
  viewer.style.height = '90vh';
  viewer.style.display = 'flex';
  centerWindow(viewer);
  playWindowOpenAnimation(viewer);
  bringToFront(viewer);
  updateAppStates();
}

function renderLinkList(links, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';
  links.forEach(link => {
    const a = document.createElement('a');
    a.href = link.url;
    a.textContent = link.title;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.className = 'aero-content-bubble';
    container.appendChild(a);
  });
}

// =========================
// DRAGGING WINDOWS (single delegated handler — works for
// every window including ones created later, like the Tuna popup)
// =========================

function initWindowDragging() {
  let draggedWindow = null;
  let offsetX = 0;
  let offsetY = 0;

  document.addEventListener('mousedown', (e) => {
    // Most windows drag from their title bar. Devices with no title bar
    // (GT Paint's gadget shell) instead mark a background region as
    // draggable — grabbing any non-control part of the shell moves it.
    const dragHandle = e.target.closest('.title-bar') || e.target.closest('.aero-drag-region');
    if (!dragHandle || e.target.closest('button, input, canvas, .gtpaint-wheel, #jukebox-volume-ring, a')) return;

    const win = dragHandle.closest('.window');
    if (!win) return;

    // Fixed-position popups (Tuna game over) use transform centering —
    // convert to absolute pixel position before dragging. Also drop the
    // opening-animation class: if a window is grabbed while its
    // aeroBuoyantOpen animation is still mid-flight, the animation
    // would otherwise keep re-applying its own transform every frame
    // and fight the drag (an inline `transform: none` doesn't win
    // against a still-running CSS animation on the same property).
    win.classList.remove('window-opening');
    const rect = win.getBoundingClientRect();
    if (getComputedStyle(win).transform !== 'none') {
      win.style.transform = 'none';
      win.style.left = `${rect.left}px`;
      win.style.top = `${rect.top}px`;
    }

    draggedWindow = win;
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    bringToFront(win);
  });

  document.addEventListener('mousemove', (e) => {
    if (!draggedWindow) return;
    draggedWindow.style.left = `${e.clientX - offsetX}px`;
    draggedWindow.style.top = `${e.clientY - offsetY}px`;
  });

  document.addEventListener('mouseup', () => {
    draggedWindow = null;
  });
}

function initGlobalWindowFocus() {
  document.addEventListener('mousedown', (e) => {
    const win = e.target.closest('.window');
    if (win) {
      bringToFront(win);
    }
  });
}

// =========================
// DESKTOP DRAG SELECT
// =========================

function initDesktopSelection() {
  const desktop = document.getElementById('desktop');
  const selectionBox = document.getElementById('selection-box');
  if (!desktop || !selectionBox) return;

  let isSelecting = false;
  let startX = 0;
  let startY = 0;

  desktop.addEventListener('mousedown', (e) => {
    const isBlankSpace = e.target === desktop;
    if (!isBlankSpace) return;

    isSelecting = true;
    startX = e.pageX;
    startY = e.pageY;

    selectionBox.style.left = `${startX}px`;
    selectionBox.style.top = `${startY}px`;
    selectionBox.style.width = '0px';
    selectionBox.style.height = '0px';
    selectionBox.style.display = 'block';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isSelecting) return;

    const currentX = e.pageX;
    const currentY = e.pageY;

    const rectX = Math.min(currentX, startX);
    const rectY = Math.min(currentY, startY);
    const rectWidth = Math.abs(currentX - startX);
    const rectHeight = Math.abs(currentY - startY);

    selectionBox.style.left = `${rectX}px`;
    selectionBox.style.top = `${rectY}px`;
    selectionBox.style.width = `${rectWidth}px`;
    selectionBox.style.height = `${rectHeight}px`;
  });

  document.addEventListener('mouseup', () => {
    if (!isSelecting) return;
    isSelecting = false;
    selectionBox.style.display = 'none';
  });
}

// =========================
// GHOST
// =========================

function initGhost() {
  const ghost = document.getElementById('spirit-ghost');
  if (!ghost) return;

  let ghostX = window.innerWidth / 2;
  let ghostY = window.innerHeight / 2;
  let targetX = ghostX;
  let targetY = ghostY;
  let isIdle = false;
  let idleTimer;
  let isSleeping = false;
  let blinkTimer;

  const whispers = [
    "The forest remembers you.",
    "Press Start. Begin again.",
    "You left the gate open.",
    "There is light between the moss.",
    "Softness is resistance.",
    "Your data carries memory.",
    "Time does not pass here.",
    "The rain was listening.",
    "Stay. Drift."
  ];

  function leaveGhostTrail() {
    // Only leave a trail occasionally — the old version created
    // ~60 DOM nodes per second, one on every animation frame
    if (prefersReducedMotion || Math.random() > 0.15) return;

    const trail = document.createElement('div');
    trail.className = 'ghost-trail';
    trail.style.left = `${ghostX + 8}px`;
    trail.style.top = `${ghostY + 8}px`;
    document.body.appendChild(trail);

    setTimeout(() => trail.remove(), 1200);
  }

  function updateGhostPosition() {
    ghostX += (targetX - ghostX) * 0.05;
    ghostY += (targetY - ghostY) * 0.05;
    ghost.style.transform = `translate(${ghostX}px, ${ghostY}px)`;
    leaveGhostTrail();
    requestAnimationFrame(updateGhostPosition);
  }

  function blink() {
    if (isSleeping) return;
    ghost.src = 'icons/ghost-blink.png';
    setTimeout(() => {
      if (!isSleeping) ghost.src = 'icons/ghost.png';
    }, 200);
    blinkTimer = setTimeout(blink, 400 + Math.random() * 500);
  }

  function wander() {
    if (!isIdle || !isSleeping) return;
    targetX = Math.random() * window.innerWidth;
    targetY = Math.random() * window.innerHeight;
    setTimeout(wander, 5000);
  }

  function triggerSleep() {
    isIdle = true;
    isSleeping = true;
    ghost.src = 'icons/ghost-sleep.png';
    wander();
  }

  function resetIdleTimer() {
    isIdle = false;
    if (isSleeping) {
      ghost.src = 'icons/ghost.png';
      isSleeping = false;
      clearTimeout(blinkTimer);
      blink();
    }
    clearTimeout(idleTimer);
    idleTimer = setTimeout(triggerSleep, 40000);
  }

  function showWhisper() {
    const msg = whispers[Math.floor(Math.random() * whispers.length)];
    const whisper = document.createElement('div');
    whisper.className = 'ghost-whisper';
    whisper.textContent = msg;
    whisper.style.left = `${Math.min(ghostX + 40, window.innerWidth - 240)}px`;
    whisper.style.top = `${Math.max(ghostY - 20, 10)}px`;
    document.body.appendChild(whisper);

    setTimeout(() => {
      whisper.remove();
      scheduleNextWhisper();
    }, 6000);
  }

  function scheduleNextWhisper() {
    const delay = 30000 + Math.random() * 30000;
    setTimeout(showWhisper, delay);
  }

  document.addEventListener('mousemove', (e) => {
    targetX = e.clientX + 16;
    targetY = e.clientY + 16;
    resetIdleTimer();
  });

  updateGhostPosition();
  blink();
  resetIdleTimer();
  scheduleNextWhisper();
}

// =========================
// BIRDSWEEPER
// =========================

const rows = 8;
const cols = 8;
const birdCount = 10;
let grid = [];

const birdFacts = [
  {
    name: 'Kākā',
    img: 'icons/kaka.png',
    fact: 'Intelligent parrot with a hooked beak, often seen in native forests.'
  },
  {
    name: 'Tūī',
    img: 'icons/tui.png',
    fact: 'Known for their iridescent feathers and melodic, mimicry-rich song.'
  },
  {
    name: 'Kererū',
    img: 'icons/kereru.png',
    fact: 'Large, fruit-eating pigeon vital for forest regeneration.'
  },
  {
    name: 'Kākāpō',
    img: 'icons/kakapo.png',
    fact: 'Critically endangered flightless nocturnal parrot.'
  },
  {
    name: 'Tīeke',
    img: 'icons/tieke.png',
    fact: 'Rare songbird with a chestnut saddle and strong territorial calls.'
  }
];

function initBirdsweeper() {
  const gameBoard = document.getElementById('birdsweeper-grid');
  if (!gameBoard) return;

  gameBoard.innerHTML = '';
  grid = [];

  while (grid.length < rows * cols) {
    grid.push({
      isBird: false,
      revealed: false,
      bird: null,
      element: null
    });
  }

  let birdsPlaced = 0;
  while (birdsPlaced < birdCount) {
    const i = Math.floor(Math.random() * grid.length);
    if (!grid[i].isBird) {
      const randomBird = birdFacts[Math.floor(Math.random() * birdFacts.length)];
      grid[i].isBird = true;
      grid[i].bird = randomBird;
      birdsPlaced++;
    }
  }

  grid.forEach((cell, i) => {
    const cellDiv = document.createElement('div');
    cellDiv.className = 'bird-cell';
    cellDiv.dataset.index = i;
    gameBoard.appendChild(cellDiv);
    cell.element = cellDiv;

    cellDiv.addEventListener('click', () => revealCell(i));
  });
}

function revealCell(index) {
  const cell = grid[index];
  if (!cell || cell.revealed) return;

  cell.revealed = true;
  cell.element.classList.add('revealed');

  if (cell.isBird && cell.bird) {
    cell.element.classList.add('bird');
    cell.element.innerHTML = `<img src="${cell.bird.img}" alt="${cell.bird.name}" style="width:100%; border-radius:6px;" />`;

    document.getElementById('bird-found-img').src = cell.bird.img;
    document.getElementById('bird-found-name').textContent = `Species: ${cell.bird.name}`;
    document.getElementById('bird-found-fact').textContent = cell.bird.fact;

    openWindow('bird-found');
    return;
  }

  const count = getAdjacentBirds(index);
  if (count > 0) {
    cell.element.textContent = count;
  } else {
    getNeighbors(index).forEach(neighbor => revealCell(neighbor));
  }
}

function getAdjacentBirds(index) {
  return getNeighbors(index).filter(i => grid[i].isBird).length;
}

function getNeighbors(index) {
  const neighbors = [];
  const row = Math.floor(index / cols);
  const col = index % cols;

  for (let r = row - 1; r <= row + 1; r++) {
    for (let c = col - 1; c <= col + 1; c++) {
      if (r >= 0 && r < rows && c >= 0 && c < cols && !(r === row && c === col)) {
        neighbors.push(r * cols + c);
      }
    }
  }
  return neighbors;
}

function resetBirdsweeper() {
  initBirdsweeper();
}

// =========================
// TUNA
// =========================

let tunaSetDirection = null; // reassigned by each initTunaGame() call; the D-pad buttons call through this
let tunaControlsInitialized = false;

function stopTunaGame() {
  if (tunaGameInterval) {
    clearInterval(tunaGameInterval);
    tunaGameInterval = null;
  }
  if (tunaKeyListener) {
    document.removeEventListener('keydown', tunaKeyListener);
    tunaKeyListener = null;
  }
}

function isTunaFocused() {
  const win = document.getElementById('window-tuna');
  if (!win || win.style.display === 'none') return false;
  return String(win.style.zIndex) === String(topZ);
}

// Wires the shell's static controls (New Game / Leaderboard / D-pad)
// exactly once — these buttons live outside #tuna-grid so they aren't
// recreated every time initTunaGame() rebuilds the board.
function initTunaControls() {
  if (tunaControlsInitialized) return;
  tunaControlsInitialized = true;

  document.getElementById('tuna-new-game-btn').addEventListener('click', () => initTunaGame());
  document.getElementById('tuna-leaderboard-btn').addEventListener('click', showTunaLeaderboardPanel);

  const dpadDirections = {
    'tuna-dpad-up': 'up',
    'tuna-dpad-down': 'down',
    'tuna-dpad-left': 'left',
    'tuna-dpad-right': 'right',
  };
  Object.keys(dpadDirections).forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', () => {
        if (tunaSetDirection) tunaSetDirection(dpadDirections[id]);
      });
    }
  });
}

function initTunaGame() {
  const container = document.getElementById('tuna-grid');
  if (!container) return;

  initTunaControls();
  container.innerHTML = '';

  const gridSize = 20;
  const totalCells = gridSize * gridSize;
  const cellEls = [];

  for (let i = 0; i < totalCells; i++) {
    const cell = document.createElement('div');
    cell.className = 'tuna-cell';
    container.appendChild(cell);
    cellEls.push(cell);
  }

  let snake = [210, 211, 212];
  let direction = 1;
  let food = null;
  let score = 0;

  stopTunaGame();

  const scoreEl = document.getElementById('tuna-score-text');
  if (scoreEl) scoreEl.textContent = '0';

  function drawSnake() {
    cellEls.forEach(cell => cell.classList.remove('tuna', 'tuna-head', 'tuna-food'));
    snake.forEach((i, idx) => {
      cellEls[i].classList.add('tuna');
      if (idx === snake.length - 1) cellEls[i].classList.add('tuna-head');
    });
    if (food !== null) {
      cellEls[food].classList.add('tuna-food');
    }
  }

  function spawnFood() {
    do {
      food = Math.floor(Math.random() * totalCells);
    } while (snake.includes(food));
  }

  // Shared by the keyboard listener below AND the D-pad buttons (see
  // tunaSetDirection/initTunaControls) so both control paths are
  // guaranteed to behave identically — arrow keys remain the primary,
  // smarter way to play, the D-pad is the click-friendly alternative.
  function applyDirection(key) {
    if (key === 'up' && direction !== gridSize) direction = -gridSize;
    if (key === 'down' && direction !== -gridSize) direction = gridSize;
    if (key === 'left' && direction !== 1) direction = -1;
    if (key === 'right' && direction !== -1) direction = 1;
  }
  tunaSetDirection = applyDirection;

  function move() {
    const head = snake[snake.length - 1];
    const next = head + direction;
    const willEat = next === food;

    // snake[0] is the tail (oldest segment) — it's about to vacate its
    // cell via snake.shift() below whenever this move doesn't eat food,
    // so moving the head into it this same tick is legal, not a crash.
    // Only include it in the check when the snake is growing (tail stays put).
    const body = willEat ? snake : snake.slice(1);

    const hitWall = (
      next < 0 ||
      next >= totalCells ||
      (direction === 1 && head % gridSize === gridSize - 1) ||
      (direction === -1 && head % gridSize === 0) ||
      body.includes(next)
    );

    if (hitWall) {
      stopTunaGame();
      showTunaGameOver(score);
      return;
    }

    snake.push(next);

    if (willEat) {
      score++;
      if (scoreEl) scoreEl.textContent = String(score);
      spawnFood();
    } else {
      snake.shift();
    }

    drawSnake();
  }

  const keyToDirection = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };

  tunaKeyListener = function (e) {
    if (!isTunaFocused()) return;
    const key = keyToDirection[e.key];
    if (!key) return;

    e.preventDefault(); // stop arrow keys scrolling the page while playing
    applyDirection(key);
  };

  document.addEventListener('keydown', tunaKeyListener);
  spawnFood();
  drawSnake();
  tunaGameInterval = setInterval(move, 200);
}

// Shared glass-panel shell for both the game-over score submission and
// the standalone leaderboard view — same aero-glass language as the
// rest of the OS's popups. Only the container/rows were restyled here;
// the actual Firebase load/save logic below is untouched.
function createTunaPopupShell(title, bodyHTML) {
  document.querySelectorAll('.tuna-popup').forEach(el => el.remove());

  const popup = document.createElement('div');
  popup.className = 'window tuna-popup';
  popup.style.display = 'flex';
  popup.innerHTML = `
    <button class="gt-exit-orb tuna-popup-exit-orb" onclick="this.closest('.window').remove()" aria-label="Close">✕</button>
    <div class="tuna-popup-content aero-drag-region">
      <h3 class="tuna-popup-title">${title}</h3>
      ${bodyHTML}
    </div>
  `;

  document.body.appendChild(popup);
  // NOT centerWindow(popup): that sets inline left/top assuming normal
  // absolute-position centering, but .tuna-popup centers itself via
  // position:fixed + top/left:50% + transform:translate(-50%,-50%) —
  // combining both pushed the popup off-screen (inline left/top wins
  // over the CSS rule, then the still-active transform translates it
  // by half its own size from that wrong point). The CSS handles
  // centering on its own; nothing else to do here.
  playWindowOpenAnimation(popup);
  bringToFront(popup);
  return popup;
}

function showTunaGameOver(score) {
  createTunaPopupShell('The tuna got tangled...', `
    <p class="tuna-popup-score">Your score: <span>${Number(score)}</span></p>
    <input id="tuna-name" type="text" placeholder="Your name" maxlength="20" class="tuna-popup-input" />
    <button id="submit-tuna-score" class="tuna-popup-btn">Submit</button>
    <div class="tuna-popup-subheading">Leaderboard</div>
    <div id="tuna-leaderboard" class="tuna-popup-leaderboard"></div>
    <button onclick="restartTunaGame()" class="tuna-popup-btn tuna-popup-btn-secondary">Try Again</button>
  `);

  const submitButton = document.getElementById('submit-tuna-score');
  if (submitButton) {
    submitButton.onclick = () => {
      submitTunaScore(score);
    };
  }

  loadScoresFromFirebase();
}

// Lets the "Leaderboard" gel button on the shell show scores any time —
// not just after a game over, per the user's explicit ask for a
// standalone leaderboard view matching the sketch.
function showTunaLeaderboardPanel() {
  // Stop the game loop before showing the popup — otherwise the snake
  // keeps moving behind it while isTunaFocused() (gated on z-index) has
  // already stopped routing arrow keys to it, so it crashes unseen.
  stopTunaGame();
  createTunaPopupShell('Leaderboard', `
    <div id="tuna-leaderboard" class="tuna-popup-leaderboard"></div>
  `);
  loadScoresFromFirebase();
}

function submitTunaScore(score) {
  const input = document.getElementById('tuna-name');
  const submitButton = document.getElementById('submit-tuna-score');
  const name = input?.value?.trim() || 'Anonymous';
  const numericScore = Number(score);

  saveScoreToFirebase(name, numericScore);

  if (input) input.disabled = true;
  if (submitButton) submitButton.disabled = true;
}

function saveScoreToFirebase(name, score) {
  if (typeof database === 'undefined') return;

  const scoresRef = database.ref('scores');

  const newScore = {
    name: String(name).slice(0, 20),
    score,
    timestamp: Date.now()
  };

  scoresRef.push(newScore)
    .then(() => {
      loadScoresFromFirebase();
    })
    .catch((error) => {
      console.error("Error saving score: ", error);
    });
}

function loadScoresFromFirebase() {
  if (typeof database === 'undefined') return;

  const scoresRef = database.ref('scores');

  scoresRef.orderByChild('score').limitToLast(10).once('value', (snapshot) => {
    const scores = [];
    snapshot.forEach(childSnapshot => {
      scores.push(childSnapshot.val());
    });

    scores.sort((a, b) => Number(b?.score || 0) - Number(a?.score || 0));
    renderTunaLeaderboard(scores);
  });
}

function renderTunaLeaderboard(scores = []) {
  const container = document.getElementById('tuna-leaderboard');
  if (!container) return;

  container.innerHTML = '';

  if (!scores.length) {
    const empty = document.createElement('div');
    empty.className = 'tuna-leaderboard-empty';
    empty.textContent = 'No scores yet — be the first!';
    container.appendChild(empty);
    return;
  }

  scores.forEach((entry, i) => {
    const row = document.createElement('div');
    row.className = 'tuna-leaderboard-row';

    const rank = document.createElement('span');
    rank.className = 'tuna-leaderboard-rank';
    rank.textContent = String(i + 1);
    row.appendChild(rank);

    if (birdIcons[i]) {
      const img = document.createElement('img');
      img.src = birdIcons[i];
      img.alt = '';
      img.className = 'tuna-leaderboard-icon';
      row.appendChild(img);
    }

    const safeName = (typeof entry?.name === 'string' ? entry.name : 'Anonymous')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 20);

    const safeScore = Number(entry?.score);
    const scoreText = Number.isFinite(safeScore) ? safeScore : 0;

    const name = document.createElement('span');
    name.className = 'tuna-leaderboard-name';
    name.textContent = safeName;
    row.appendChild(name);

    const score = document.createElement('span');
    score.className = 'tuna-leaderboard-score';
    score.textContent = String(scoreText);
    row.appendChild(score);

    container.appendChild(row);
  });
}

function restartTunaGame() {
  const existingPopup = document.querySelector('.tuna-popup');
  if (existingPopup) existingPopup.remove();

  openWindow('tuna'); // openWindow already re-initialises the game
}

// GT Paint (tools, canvas, undo/redo, zoom) now lives in gtpaint.js
