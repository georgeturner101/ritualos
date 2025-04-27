// Boot + Clock + Cursor fix
window.onload = function () {
  const boot = document.getElementById('boot-screen');
  setTimeout(() => boot.style.display = 'none', 3000);
  const clock = document.getElementById('clock');
  setInterval(() => {
    const now = new Date();
    clock.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, 1000);

  const startup = document.getElementById('startup');
  const ambient = document.getElementById('ambient-sound');
  if (startup) startup.play().catch(() => {});
  if (ambient) ambient.play().catch(() => {});

  document.body.style.cursor = "url('icons/glitter-cursor.png'), auto";

  let topZ = 10;

function bringToFront(win) {
  topZ++;
  win.style.zIndex = topZ;
}

  enableDragging();
};

let topZ = 10;

function bringToFront(win) {
  topZ++;
  win.style.zIndex = topZ;
}

function toggleStartMenu() {
  const menu = document.getElementById('start-menu');
  menu.classList.toggle('hidden');
}



function closeWindow(name) {
  const win = document.getElementById(`window-${name}`);
  if (win) win.style.display = 'none';
}

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
  { name: 'Press', icon: 'press.png', window: 'press' }
];

const savedPositions = localStorage.getItem('iconPositions');
const hasSaved = !!savedPositions;

icons.forEach((i, index) => {
  const el = document.createElement('div');
  el.classList.add('icon');
  el.innerHTML = `<img src="icons/${i.icon}"><div class="icon-title">${i.name}</div>`;

  // Assign random-ish layout only if no saved positions exist
  if (!hasSaved) {
    const cols = Math.floor(window.innerWidth / 120);
    const spacing = 100;
    const col = index % cols;
    const row = Math.floor(index / cols);
    el.style.position = 'absolute';
    el.style.left = `${Math.random() * (window.innerWidth - 120)}px`;
    el.style.top = `${Math.random() * (window.innerHeight - 140)}px`;
    
  }

  const openAndHighlight = () => {
    document.querySelectorAll('.icon').forEach(icon => icon.classList.remove('selected'));
    el.classList.add('selected');
    openWindow(i.window);
  };

  el.querySelector('img').onclick = openAndHighlight;
  el.querySelector('.icon-title').onclick = openAndHighlight;

  desktop.appendChild(el);
});

loadIconPositions();
makeIconsDraggable();


function listPDFs(folder, containerId) {
  fetch(`pdfs/${folder}/index.json`)
    .then(res => res.json())
    .then(files => {
      const cont = document.getElementById(containerId);
      cont.innerHTML = '';
      files.forEach(name => {
        const link = document.createElement('a');
        link.href = "#";
        link.textContent = name;
        link.onclick = (e) => {
          e.preventDefault();
          openPDF(`pdfs/${folder}/${name}`);
        };
        cont.appendChild(link);
      });
    });
}

function openPDF(src) {
  const frame = document.getElementById('pdf-frame');
  const viewer = document.getElementById('window-pdf-viewer');
  frame.src = `${src}#toolbar=0&navpanes=0&scrollbar=0`;
  viewer.style.display = 'flex';
  viewer.style.zIndex = Date.now();
  viewer.style.width = '80vw';
  viewer.style.height = '90vh';
  viewer.style.left = '10vw';
  viewer.style.top = '5vh';
}

function toggleAudio() {
  const ambient = document.getElementById('ambient-sound');
  const button = document.getElementById('audio-toggle');
  if (!ambient.paused) {
    ambient.pause();
    button.textContent = '🔇';
  } else {
    ambient.play().catch(() => {});
    button.textContent = '🔊';
  }
}

function enableDragging() {
  document.querySelectorAll('.window').forEach(win => {
    const titleBar = win.querySelector('.title-bar');
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    titleBar.addEventListener('mousedown', e => {
      isDragging = true;
      offsetX = e.clientX - win.offsetLeft;
      offsetY = e.clientY - win.offsetTop;
      win.style.zIndex = Date.now();
    });

    document.addEventListener('mousemove', e => {
      if (isDragging) {
        win.style.left = `${e.clientX - offsetX}px`;
        win.style.top = `${e.clientY - offsetY}px`;
      }
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
  });
}

listPDFs('exhibitions', 'pdfs-exhibitions');
listPDFs('freelance', 'pdfs-freelance');

// Pink drag-select box
let isSelecting = false;
let startX, startY;
const selectionBox = document.getElementById('selection-box');

document.getElementById('desktop').addEventListener('mousedown', (e) => {
  const isBlankSpace = e.target === document.getElementById('desktop');
  if (isBlankSpace) {
    isSelecting = true;
    startX = e.pageX;
    startY = e.pageY;

    selectionBox.style.left = `${startX}px`;
    selectionBox.style.top = `${startY}px`;
    selectionBox.style.width = '0px';
    selectionBox.style.height = '0px';
    selectionBox.style.display = 'block';
  }
});

document.addEventListener('mousemove', (e) => {
  if (isSelecting) {
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
  }
});

document.addEventListener('mouseup', () => {
  if (isSelecting) {
    isSelecting = false;
    selectionBox.style.display = 'none';
  }
});

const taskbarApps = document.getElementById('taskbar-apps');

// Add taskbar app icons
icons.forEach(i => {
  const app = document.createElement('div');
  app.classList.add('taskbar-app');
  app.style.backgroundImage = `url(icons/${i.icon})`;
  app.onclick = () => {
    const win = document.getElementById(`window-${i.window}`);
    if (win.style.display === 'none' || !win.style.display) {
      win.style.display = 'flex';
    }
    bringToFront(win); // ✅ updated line
    updateAppStates();
  };   
  app.dataset.window = i.window;
  taskbarApps.appendChild(app);
});

function updateAppStates() {
  document.querySelectorAll('.taskbar-app').forEach(app => {
    const win = document.getElementById(`window-${app.dataset.window}`);
    if (win && win.style.display !== 'none') {
      app.classList.add('active');
    } else {
      app.classList.remove('active');
    }
  });
}

// Call updateAppStates when opening or closing windows
function openWindow(name) {
  const win = document.getElementById(`window-${name}`);
  if (win) {
    win.style.display = 'flex';
    win.style.zIndex = Date.now();
    updateAppStates();
  }
}

function closeWindow(name) {
  const win = document.getElementById(`window-${name}`);
  if (win) {
    win.style.display = 'none';
    updateAppStates();
  }
}

// Bring any window to the front on click — even if created later
document.addEventListener('mousedown', (e) => {
  const win = e.target.closest('.window');
  if (win) {
    bringToFront(win);
  }
});

document.addEventListener('mousemove', (e) => {
  const sparkle = document.createElement('div');
  sparkle.className = Math.random() > 0.5 ? 'sparkle star' : 'sparkle';
  sparkle.style.left = `${e.pageX}px`;
  sparkle.style.top = `${e.pageY}px`;
  document.body.appendChild(sparkle);

  setTimeout(() => {
    sparkle.remove();
  }, 1000);
});

document.addEventListener('click', (e) => {
  const particles = 25; // Increase burst size
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
    setTimeout(() => sparkle.remove(), 1500); // longer life
  }
});

const ghost = document.getElementById('spirit-ghost');

let ghostX = window.innerWidth / 2;
let ghostY = window.innerHeight / 2;
let targetX = ghostX;
let targetY = ghostY;
let isIdle = false;
let idleTimer;
let isSleeping = false;
let blinkTimer;

// Animate ghost following or wandering
function updateGhostPosition() {
  ghostX += (targetX - ghostX) * 0.05;
  ghostY += (targetY - ghostY) * 0.05;
  ghost.style.transform = `translate(${ghostX}px, ${ghostY}px)`;
  leaveGhostTrail(); // 👈 this line
  requestAnimationFrame(updateGhostPosition);
}
updateGhostPosition();

function leaveGhostTrail() {
  const trail = document.createElement('div');
  trail.className = 'ghost-trail';
  trail.style.left = `${ghostX + 8}px`;
  trail.style.top = `${ghostY + 8}px`;
  document.body.appendChild(trail);

  setTimeout(() => {
    trail.remove();
  }, 1200);
}

// Blink animation every ~0.5s
function blink() {
  if (isSleeping) return;
  ghost.src = 'icons/ghost-blink.png';
  setTimeout(() => {
    if (!isSleeping) ghost.src = 'icons/ghost.png';
  }, 200);
  blinkTimer = setTimeout(blink, 400 + Math.random() * 500);
}
blink();

// Sleep if idle too long
function triggerSleep() {
  isIdle = true;
  isSleeping = true;
  ghost.src = 'icons/ghost-sleep.png';
  wander(); // optional: have it float around a bit while sleeping
}

// Wander movement when idle
function wander() {
  if (!isIdle || !isSleeping) return;
  targetX = Math.random() * window.innerWidth;
  targetY = Math.random() * window.innerHeight;
  setTimeout(wander, 5000);
}

// Reset everything on user activity
function resetIdleTimer() {
  isIdle = false;
  if (isSleeping) {
    ghost.src = 'icons/ghost.png';
    isSleeping = false;
    clearTimeout(blinkTimer);
    blink(); // restart blinking when waking up
  }  
  clearTimeout(idleTimer);
  idleTimer = setTimeout(triggerSleep, 40000); // 40 sec
}
document.addEventListener('mousemove', (e) => {
  targetX = e.clientX + 16;
  targetY = e.clientY + 16;
  resetIdleTimer();
});
resetIdleTimer();

const whispers = [
  "The forest remembers you.",
  "Press Start. Begin again.",
  "You left the gate open.",
  "There is light between the moss.",
  "Softness is resistance.",
  "Your data carries memory.",
  "Time does not pass here.",
  "The rain was listening.",
  "Stay. Drift.",
];

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
  const delay = 30000 + Math.random() * 30000; // 30–60 sec
  setTimeout(showWhisper, delay);
}

scheduleNextWhisper();

function saveIconPositions() {
  const positions = Array.from(document.querySelectorAll('.icon')).map(icon => {
    return {
      name: icon.querySelector('.icon-title').textContent,
      left: icon.style.left,
      top: icon.style.top
    };
  });
  localStorage.setItem('iconPositions', JSON.stringify(positions));
}

function loadIconPositions() {
  const saved = localStorage.getItem('iconPositions');
  if (!saved) return;
  const positions = JSON.parse(saved);
  positions.forEach(pos => {
    const icon = Array.from(document.querySelectorAll('.icon')).find(i => i.querySelector('.icon-title').textContent === pos.name);
    if (icon) {
      icon.style.position = 'absolute';
      icon.style.left = pos.left;
      icon.style.top = pos.top;
    }
  });
}

function makeIconsDraggable() {
  const desktop = document.getElementById('desktop');
  let isDragging = false;
  let currentIcon = null;
  let offsetX = 0;
  let offsetY = 0;

  desktop.querySelectorAll('.icon').forEach(icon => {
    icon.style.position = 'absolute';

    icon.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return; // Left-click only
      if (!icon.contains(e.target)) return;

      currentIcon = icon;
      offsetX = e.clientX - icon.offsetLeft;
      offsetY = e.clientY - icon.offsetTop;
      isDragging = true;
      icon.style.zIndex = 10000;
      icon.classList.add('dragging');

      // Prevent accidental text selection
      e.preventDefault();
    });
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging || !currentIcon) return;
    currentIcon.style.left = `${e.clientX - offsetX}px`;
    currentIcon.style.top = `${e.clientY - offsetY}px`;
  });

  document.addEventListener('mouseup', () => {
    if (isDragging && currentIcon) {
      isDragging = false;
      currentIcon.classList.remove('dragging');
      currentIcon.style.zIndex = '';
      saveIconPositions();
      currentIcon = null;
    }
  });
}
// BIRDSWEEPER FULL JS (Drop-in Replacement)

// Game settings
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
  if (cell.revealed) return;
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

  // Reveal number of nearby birds
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

let tunaGameInterval = null;
let tunaKeyListener = null;

const birdIcons = [
  'icons/kakapo.png',
  'icons/kaka.png',
  'icons/tui.png'
];

function openWindow(name) {
  const win = document.getElementById(`window-${name}`);
  if (win) {
    win.style.display = 'flex';
    win.style.zIndex = Date.now();
    updateAppStates();

    if (name === 'tuna') {
      setTimeout(initTunaGame, 100);
    }
  }
}

function initTunaGame() {
  const container = document.getElementById('tuna-grid');
  if (!container) return;

  container.innerHTML = '';

  const gridSize = 20;
  const totalCells = gridSize * gridSize;
  const grid = [];

  for (let i = 0; i < totalCells; i++) {
    const cell = document.createElement('div');
    cell.className = 'tuna-cell';
    container.appendChild(cell);
    grid.push(cell);
  }

  let snake = [210, 211, 212];
  let direction = 1;
  let food = null;
  let score = 0;

  if (tunaGameInterval) clearInterval(tunaGameInterval);
  if (tunaKeyListener) document.removeEventListener('keydown', tunaKeyListener);

  function drawSnake() {
    grid.forEach(cell => cell.classList.remove('tuna', 'tuna-head'));
    snake.forEach((i, idx) => {
      grid[i].classList.add('tuna');
      if (idx === snake.length - 1) grid[i].classList.add('tuna-head');
    });
  }

  function spawnFood() {
    do {
      food = Math.floor(Math.random() * totalCells);
    } while (snake.includes(food));
    grid[food].classList.add('tuna-food');
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
      grid[food].classList.remove('tuna-food');
      spawnFood();
    } else {
      const tail = snake.shift();
      grid[tail].classList.remove('tuna');
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
  popup.style.zIndex = 9999;
  popup.style.display = 'flex'; // force it to show

  popup.innerHTML = `
    <div class="title-bar">
      Oh no! 🐟
      <button onclick="this.closest('.window').remove()">X</button>
    </div>
    <div class="window-content">
      <p><strong>The tuna got tangled...</strong></p>
      <p>Your score: <span style="color:#ffa3e5">${score}</span></p>
      <input id="tuna-name" type="text" placeholder="Your name" />
      <button onclick="submitTunaScore(${score})">Submit</button>
      <div id="tuna-leaderboard" style="margin-top:20px;"></div>
      <button onclick="restartTunaGame()">Try Again</button>
    </div>
  `;

  document.body.appendChild(popup);
  loadScoresFromFirebase(); // 🚀 load scores right away
  enableDragging();
}

function submitTunaScore(score) {
  const input = document.getElementById('tuna-name');
  const name = input?.value?.trim() || 'Anonymous';

  saveScoreToFirebase(name, score); // <-- use (name, score)
  
  if (input) input.disabled = true;
  if (input?.nextElementSibling) input.nextElementSibling.disabled = true;
}

function saveScoreToFirebase(name, score) {
  const scoresRef = firebase.database().ref('scores');

  const newScore = {
    name: name,
    score: score,
    timestamp: Date.now()
  };

  scoresRef.push(newScore)
    .then(() => {
      console.log("Score saved successfully!");
      loadScoresFromFirebase(); // reload leaderboard
    })
    .catch((error) => {
      console.error("Error saving score: ", error);
    });
}

function loadScoresFromFirebase() {
  const scoresRef = firebase.database().ref('scores');

  scoresRef.orderByChild('score').limitToLast(10).once('value', (snapshot) => {
    const scores = [];
    snapshot.forEach(childSnapshot => {
      scores.push(childSnapshot.val());
    });

    scores.reverse(); // because Firebase returns ascending

    renderTunaLeaderboard(scores);
  });
}

function renderTunaLeaderboard(scores = []) {
  const container = document.getElementById('tuna-leaderboard');
  if (!container) return;

  container.innerHTML = '<h4 style="margin-bottom: 10px; color: #660066">Leaderboard</h4>' +
    scores.map((entry, i) => {
      const bird = birdIcons[i] ? `<img src="${birdIcons[i]}" style="width:16px; vertical-align:middle; margin-right:4px;" />` : '';
      return `<div style="margin:4px 0; color:#3a003a; font-weight:bold;">${bird}${entry.name} — ${entry.score}</div>`;
    }).join('');
}

function restartTunaGame() {
  const win = document.getElementById('window-tuna');
  if (win) win.remove();

  setTimeout(() => {
    const tunaWin = document.createElement('div');
    tunaWin.id = 'window-tuna';
    tunaWin.className = 'window';
    tunaWin.style.display = 'flex';
    tunaWin.innerHTML = `
      <div class="title-bar">Tuna 🐟 <button onclick="closeWindow('tuna')">X</button></div>
      <div class="window-content">
        <div id="tuna-grid" style="display:grid; grid-template-columns:repeat(20, 20px); gap:1px; width:420px; height:420px; margin:10px auto;"></div>
      </div>
    `;
    document.body.appendChild(tunaWin);
    openWindow('tuna');
  }, 200);
}


function listVideos(containerId) {
  fetch('videos/index.json')
    .then(res => res.json())
    .then(files => {
      const container = document.getElementById(containerId);
      container.innerHTML = '';
      files.forEach(filename => {
        const link = document.createElement('a');
        link.href = "#";
        link.textContent = filename;
        link.onclick = (e) => {
          e.preventDefault();
          openVideoPlayer(`videos/${filename}`);
        };
        container.appendChild(link);
      });
    });
}

function openVideoPlayer(src) {
  const videoFrame = document.getElementById('video-frame');
  const viewer = document.getElementById('window-video-viewer');
  videoFrame.src = src;
  viewer.style.display = 'flex';
  viewer.style.zIndex = Date.now();
  viewer.style.width = '80vw';
  viewer.style.height = '70vh';
  viewer.style.left = '10vw';
  viewer.style.top = '10vh';
}

listVideos('video-list'); // 👈 this must run after page load

function openWindow(name, shouldInit = true) {
  const win = document.getElementById(`window-${name}`);
  if (win) {
    win.style.display = 'flex';
    win.style.zIndex = Date.now();
    updateAppStates();

    if (name === 'tuna' && shouldInit) {
      setTimeout(initTunaGame, 100);
    }
  }
}

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
  { title: "Exhibition – Webb's", url: "https://auctions.webbs.co.nz/lot-details/index/catalog/718/lot/211832/GEORGE-TURNER-The-River-Bank" },  
];

function loadInternetLinks() {
  const container = document.getElementById('internet-links');
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

loadInternetLinks();

const pressLinks = [
  { title: "Vice – Talking Stage Presence and Art Practice with George Turner", url: "https://www.vice.com/en/article/talking-stage-presence-and-art-practice-with-george-turner/" },
  { title: "Fucking Young – George Turner is Your New Favourite Avant-Pop Artist", url: "https://fuckingyoung.es/george-turner-new-favourite-avant-pop-artist/" },
  { title: "Sniffers – George Turner fuses fine arts with synth pop on ‘Lost at Home’", url: "https://www.sniffers.co.nz/article/george-turner-fuses-fine-arts-synth-pop-lost-home" },
  { title: "Sniffers – George Turner grounds themselves with debut album, ‘Insect’", url: "https://www.sniffers.co.nz/article/george-turner-grounds-debut-album-insect" },
  { title: "Sniffers – George Turner plants their Roots", url: "https://sniffers.co.nz/article/george-turner-plants-roots-kauri" },
  { title: "Under the Radar – New Single", url: "https://www.undertheradar.co.nz/news/12211/Listen-George-Turner--Age-of-Aquarius.utr" },
  { title: "Massive Magazine – Artist Profile", url: "https://www.massivemagazine.org.nz/articles/ntqehy32wf0jufy44xsvam2bwlv49s" },
];

function loadPressLinks() {
  const container = document.getElementById('press-links');
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

loadPressLinks();
