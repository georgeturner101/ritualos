// =========================
// GLOBAL STATE
// =========================

let topZ = 10;
let tunaGameInterval = null;
let tunaKeyListener = null;

const icons = [
  { name: 'Exhibitions', icon: 'folder.png', window: 'exhibitions' },
  { name: 'Freelance', icon: 'drive.png', window: 'freelance' },
  { name: 'About Me', icon: 'book.png', window: 'about' },
  { name: 'Music', icon: 'headphones.png', window: 'music' },
  { name: 'Contact', icon: 'phone.png', window: 'contact' },
  { name: 'Birdsweeper', icon: 'game.png', window: 'game' },
  { name: 'Tuna', icon: 'tuna.png', window: 'tuna' },
  { name: 'Video', icon: 'video.png', window: 'video' },
  { name: 'Internet', icon: 'internet.png', window: 'internet' },
  { name: 'Press', icon: 'press.png', window: 'press' },
  { name: 'GT Paint', icon: 'gtpaint.png', window: 'gtpaint' },
  { name: 'Bird Art', icon: 'birdart.png', window: 'birdart' }
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

window.onload = function () {
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
    setInterval(updateClock, 1000);
  }

  const startup = document.getElementById('startup');
  const ambient = document.getElementById('ambient-sound');
  if (startup) startup.play().catch(() => {});
  if (ambient) ambient.play().catch(() => {});

  document.body.style.cursor = "url('icons/glitter-cursor.png'), auto";

  buildDesktopIcons();
  buildTaskbarApps();
  loadIconPositions();
  makeIconsDraggable();
  enableDragging();

  listPDFs('exhibitions', 'pdfs-exhibitions');
  listPDFs('freelance', 'pdfs-freelance');
  listVideos('video-list');
  loadInternetLinks();
  loadPressLinks();

  initDesktopSelection();
  initGlobalWindowFocus();
  initSparkles();
  initGhost();
};

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

function playWindowOpenAnimation(win) {
  if (!win) return;
  win.classList.remove('window-opening');
  void win.offsetWidth;
  win.classList.add('window-opening');
}

function openWindow(name, shouldInit = true) {
  if (name === 'birdart') {
    window.open('./birdart/index.html', '_blank');
    return;
  }

  const win = document.getElementById(`window-${name}`);
  if (!win) return;

  win.style.display = 'flex';
  centerWindow(win);
  playWindowOpenAnimation(win);
  bringToFront(win);
  updateAppStates();

  if (name === 'tuna' && shouldInit) {
    setTimeout(initTunaGame, 100);
  }

  if (name === 'game') {
    setTimeout(initBirdsweeper, 50);
  }

  if (name === 'gtpaint') {
    setTimeout(initGTPaint, 50);
  }
}

function closeWindow(name) {
  const win = document.getElementById(`window-${name}`);
  if (!win) return;

  win.style.display = 'none';
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
    if (getComputedStyle(win).display !== 'none' && !win.classList.contains('tuna-popup')) {
      centerWindow(win);
    }
  });
});

// =========================
// START MENU / AUDIO
// =========================

function toggleStartMenu() {
  const menu = document.getElementById('start-menu');
  if (menu) menu.classList.toggle('hidden');
}

function toggleAudio() {
  const ambient = document.getElementById('ambient-sound');
  const button = document.getElementById('audio-toggle');
  if (!ambient || !button) return;

  if (!ambient.paused) {
    ambient.pause();
    button.textContent = '🔇';
  } else {
    ambient.play().catch(() => {});
    button.textContent = '🔊';
  }
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

  const positions = JSON.parse(saved);
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

  desktop.querySelectorAll('.icon').forEach(icon => {
    icon.style.position = 'absolute';

    icon.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      if (!icon.contains(e.target)) return;

      currentIcon = icon;
      offsetX = e.clientX - icon.offsetLeft;
      offsetY = e.clientY - icon.offsetTop;
      isDragging = true;

      icon.style.zIndex = '10000';
      icon.classList.add('dragging');
      e.preventDefault();
    });
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging || !currentIcon) return;
    currentIcon.style.left = `${e.clientX - offsetX}px`;
    currentIcon.style.top = `${e.clientY - offsetY}px`;
  });

  document.addEventListener('mouseup', () => {
    if (!isDragging || !currentIcon) return;

    isDragging = false;
    currentIcon.classList.remove('dragging');
    currentIcon.style.zIndex = '';
    saveIconPositions();
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
        link.textContent = name;
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

function listVideos(containerId) {
  fetch('videos/index.json')
    .then(res => res.json())
    .then(files => {
      const container = document.getElementById(containerId);
      if (!container) return;

      container.innerHTML = '';
      files.forEach(filename => {
        const link = document.createElement('a');
        link.href = '#';
        link.textContent = filename;
        link.onclick = (e) => {
          e.preventDefault();
          openVideoPlayer(`videos/${filename}`);
        };
        container.appendChild(link);
      });
    })
    .catch(err => console.error(err));
}

function openVideoPlayer(src) {
  const videoFrame = document.getElementById('video-frame');
  const viewer = document.getElementById('window-video-viewer');
  if (!videoFrame || !viewer) return;

  videoFrame.src = src;
  viewer.style.width = '80vw';
  viewer.style.height = '70vh';
  viewer.style.display = 'flex';
  centerWindow(viewer);
  playWindowOpenAnimation(viewer);
  bringToFront(viewer);
  updateAppStates();
}

function loadInternetLinks() {
  const container = document.getElementById('internet-links');
  if (!container) return;

  container.innerHTML = '';
  internetLinks.forEach(link => {
    const a = document.createElement('a');
    a.href = link.url;
    a.textContent = link.title;
    a.target = '_blank';
    a.className = 'internet-link';
    container.appendChild(a);
  });
}

function loadPressLinks() {
  const container = document.getElementById('press-links');
  if (!container) return;

  container.innerHTML = '';
  pressLinks.forEach(link => {
    const a = document.createElement('a');
    a.href = link.url;
    a.textContent = link.title;
    a.target = '_blank';
    a.className = 'internet-link';
    container.appendChild(a);
  });
}

// =========================
// DRAGGING WINDOWS
// =========================

function enableDragging() {
  document.querySelectorAll('.window').forEach(win => {
    const titleBar = win.querySelector('.title-bar');
    if (!titleBar || titleBar.dataset.dragBound === 'true') return;

    titleBar.dataset.dragBound = 'true';

    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    titleBar.addEventListener('mousedown', e => {
      if (e.target.closest('button')) return;

      isDragging = true;
      offsetX = e.clientX - win.offsetLeft;
      offsetY = e.clientY - win.offsetTop;
      bringToFront(win);
    });

    document.addEventListener('mousemove', e => {
      if (!isDragging) return;
      win.style.left = `${e.clientX - offsetX}px`;
      win.style.top = `${e.clientY - offsetY}px`;
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
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
// SPARKLES
// =========================

function initSparkles() {
  document.addEventListener('mousemove', (e) => {
    const sparkle = document.createElement('div');
    sparkle.className = Math.random() > 0.5 ? 'sparkle star' : 'sparkle';
    sparkle.style.left = `${e.pageX}px`;
    sparkle.style.top = `${e.pageY}px`;
    document.body.appendChild(sparkle);

    setTimeout(() => sparkle.remove(), 1000);
  });

  document.addEventListener('click', (e) => {
    const particles = 25;

    for (let i = 0; i < particles; i++) {
      const sparkle = document.createElement('div');
      sparkle.className = Math.random() > 0.4 ? 'sparkle star' : 'sparkle';
      sparkle.style.left = `${e.pageX}px`;
      sparkle.style.top = `${e.pageY}px`;

      const angle = Math.random() * 2 * Math.PI;
      const radius = 30 + Math.random() * 20;
      const offsetX = Math.cos(angle) * radius;
      const offsetY = Math.sin(angle) * radius;

      sparkle.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(1)`;

      document.body.appendChild(sparkle);
      setTimeout(() => sparkle.remove(), 1500);
    }
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
    whisper.style.left = `${ghostX + 40}px`;
    whisper.style.top = `${ghostY - 20}px`;
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

function initTunaGame() {
  const container = document.getElementById('tuna-grid');
  if (!container) return;

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

  if (tunaGameInterval) clearInterval(tunaGameInterval);
  if (tunaKeyListener) document.removeEventListener('keydown', tunaKeyListener);

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

  function move() {
    const head = snake[snake.length - 1];
    const next = head + direction;

    const hitWall = (
      next < 0 ||
      next >= totalCells ||
      (direction === 1 && head % gridSize === gridSize - 1) ||
      (direction === -1 && head % gridSize === 0) ||
      snake.includes(next)
    );

    if (hitWall) {
      clearInterval(tunaGameInterval);
      showTunaGameOver(score);
      return;
    }

    snake.push(next);

    if (next === food) {
      score++;
      spawnFood();
    } else {
      snake.shift();
    }

    drawSnake();
  }

  tunaKeyListener = function (e) {
    const key = e.key;
    if (key === 'ArrowUp' && direction !== gridSize) direction = -gridSize;
    if (key === 'ArrowDown' && direction !== -gridSize) direction = gridSize;
    if (key === 'ArrowLeft' && direction !== 1) direction = -1;
    if (key === 'ArrowRight' && direction !== -1) direction = 1;
  };

  document.addEventListener('keydown', tunaKeyListener);
  spawnFood();
  drawSnake();
  tunaGameInterval = setInterval(move, 200);
}

function showTunaGameOver(score) {
  document.querySelectorAll('.tuna-popup').forEach(el => el.remove());

  const popup = document.createElement('div');
  popup.className = 'window tuna-popup';
  popup.style.display = 'flex';

  popup.innerHTML = `
    <div class="title-bar">
      <span>Oh no! 🐟</span>
      <button onclick="this.closest('.window').remove()">X</button>
    </div>
    <div class="window-content">
      <p><strong>The tuna got tangled...</strong></p>
      <p>Your score: <span style="color:#d94db0">${score}</span></p>
      <input id="tuna-name" type="text" placeholder="Your name" />
      <button id="submit-tuna-score">Submit</button>
      <div id="tuna-leaderboard" style="margin-top:20px;"></div>
      <button onclick="restartTunaGame()">Try Again</button>
    </div>
  `;

  document.body.appendChild(popup);
  centerWindow(popup);
  playWindowOpenAnimation(popup);
  bringToFront(popup);

  const submitButton = document.getElementById('submit-tuna-score');
  if (submitButton) {
    submitButton.onclick = () => {
      submitTunaScore(score);
    };
  }

  loadScoresFromFirebase();
  enableDragging();
}

function submitTunaScore(score) {
  const input = document.getElementById('tuna-name');
  const name = input?.value?.trim() || 'Anonymous';
  const numericScore = Number(score);

  saveScoreToFirebase(name, numericScore);

  if (input) input.disabled = true;
  if (input?.nextElementSibling) input.nextElementSibling.disabled = true;
}

function saveScoreToFirebase(name, score) {
  const scoresRef = database.ref('scores');

  const newScore = {
    name,
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
  const scoresRef = database.ref('scores');

  scoresRef.orderByChild('score').limitToLast(10).once('value', (snapshot) => {
    const scores = [];
    snapshot.forEach(childSnapshot => {
      scores.push(childSnapshot.val());
    });

    scores.reverse();
    renderTunaLeaderboard(scores);
  });
}

function renderTunaLeaderboard(scores = []) {
  const container = document.getElementById('tuna-leaderboard');
  if (!container) return;

  
  container.innerHTML = '';


  const title = document.createElement('h4');
  title.style.marginBottom = '10px';
  title.style.color = '#660066';
  title.textContent = 'Leaderboard';
  container.appendChild(title);


  scores.forEach((entry, i) => {
    const row = document.createElement('div');
    row.style.margin = '4px 0';
    row.style.color = '#3a003a';
    row.style.fontWeight = 'bold';
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.gap = '6px';


    if (birdIcons[i]) {
      const img = document.createElement('img');
      img.src = birdIcons[i];
      img.alt = '';
      img.style.width = '16px';
      img.style.height = '16px';
      img.style.verticalAlign = 'middle';
      row.appendChild(img);
    }

    const safeName = (typeof entry?.name === 'string' ? entry.name : 'Anonymous')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 20);

    const safeScore = Number(entry?.score);
    const scoreText = Number.isFinite(safeScore) ? safeScore : 0;

    const text = document.createElement('span');
    text.textContent = `${safeName} — ${scoreText}`;
    row.appendChild(text);

    container.appendChild(row);
  });
}

function restartTunaGame() {
  const existingPopup = document.querySelector('.tuna-popup');
  if (existingPopup) existingPopup.remove();

  const win = document.getElementById('window-tuna');
  if (win) {
    openWindow('tuna');
    setTimeout(initTunaGame, 100);
  }
}

// =========================
// GT PAINT
// =========================

let gtPaintInitialized = false;
let gtPaintIsDrawing = false;
let gtPaintTool = 'pencil';
let gtPaintColor = '#000000';
let gtPaintSize = 4;

function initGTPaint() {
  const canvas = document.getElementById('gtpaint-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const pencilBtn = document.getElementById('gtpaint-pencil');
  const eraserBtn = document.getElementById('gtpaint-eraser');
  const colorInput = document.getElementById('gtpaint-color');
  const sizeInput = document.getElementById('gtpaint-size');
  const sizeDisplay = document.getElementById('gtpaint-size-display');
  const clearBtn = document.getElementById('gtpaint-clear');
  const downloadBtn = document.getElementById('gtpaint-download');

  if (!gtPaintInitialized) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    pencilBtn.addEventListener('click', () => {
      gtPaintTool = 'pencil';
      pencilBtn.classList.add('active');
      eraserBtn.classList.remove('active');
    });

    eraserBtn.addEventListener('click', () => {
      gtPaintTool = 'eraser';
      eraserBtn.classList.add('active');
      pencilBtn.classList.remove('active');
    });

    colorInput.addEventListener('input', (e) => {
      gtPaintColor = e.target.value;
    });

    sizeInput.addEventListener('input', (e) => {
      gtPaintSize = parseInt(e.target.value, 10);
      sizeDisplay.textContent = gtPaintSize;
    });

    clearBtn.addEventListener('click', () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    });

    downloadBtn.addEventListener('click', () => {
      const link = document.createElement('a');
      link.download = 'gt-paint-artwork.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    });

    function getCanvasPos(e) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    }

    function startDrawing(e) {
      gtPaintIsDrawing = true;
      const pos = getCanvasPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }

    function draw(e) {
      if (!gtPaintIsDrawing) return;

      const pos = getCanvasPos(e);

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = gtPaintSize;
      ctx.strokeStyle = gtPaintTool === 'eraser' ? '#ffffff' : gtPaintColor;

      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }

    function stopDrawing() {
      gtPaintIsDrawing = false;
      ctx.beginPath();
    }

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

    gtPaintInitialized = true;
  }

  sizeDisplay.textContent = gtPaintSize;
}