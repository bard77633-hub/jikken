import { updatePhysics } from './physics.js';

// --- State ---
const state = {
  status: 'IDLE', // IDLE, FLYING, FINISHED
  params: {
    power: 15,
    loft: 30, // Launch Angle in degrees (approx 15 to 75 range)
    wind: 5,
  },
  physics: {
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    bounces: 0,
    isStopped: true,
    history: [],
  },
  score: 0,
  highScore: 0,
};

let requestID = null;
let skipTimeoutID = null;
let els = {}; 

// Speed multiplier (steps per frame)
const STEPS_PER_FRAME = 3;

// --- Logic ---

function setStatus(newStatus) {
  state.status = newStatus;
  
  const isFlying = newStatus === 'FLYING';
  const isFinished = newStatus === 'FINISHED';
  const isIdle = newStatus === 'IDLE';

  if (!els.btnLaunch) return; 

  // Handle SHOT Button State
  if (isFlying || isFinished) {
    els.btnLaunch.disabled = true;
    els.btnLaunch.classList.add('scale-90', 'opacity-50', 'grayscale', 'cursor-not-allowed');
    els.btnLaunch.classList.remove('hover:from-emerald-600', 'hover:to-teal-700', 'active:scale-95');
    
    if (isFlying) {
      els.btnLaunch.innerHTML = 'Flying... 🏌️‍♂️';
    } else {
      els.btnLaunch.innerHTML = 'Shot Complete';
    }
  } else {
    els.btnLaunch.disabled = false;
    els.btnLaunch.classList.remove('scale-90', 'opacity-50', 'grayscale', 'cursor-not-allowed');
    els.btnLaunch.classList.add('hover:from-emerald-600', 'hover:to-teal-700', 'active:scale-95');
    els.btnLaunch.innerHTML = 'SHOT! 🏌️‍♂️';
  }

  // Handle Overlays
  if (isFlying) {
    els.msgFinished.classList.add('hidden');
    els.btnSkip.classList.add('hidden'); 
  } else if (isFinished) {
    els.msgFinished.classList.remove('hidden'); 
    els.btnSkip.classList.add('hidden');
    els.valFinalScore.textContent = state.score.toFixed(2);
  } else {
    els.msgFinished.classList.add('hidden');
    els.btnSkip.classList.add('hidden');
  }
}

function handleLaunch() {
  const vTotal = state.params.power * 1.5;
  
  // Calculate Launch Angle from Loft param
  // Loft 0 -> 15 deg, Loft 90 -> 75 deg
  const deg = 15 + (state.params.loft * 0.6); 
  const rad = deg * (Math.PI / 180);

  const vx = vTotal * Math.cos(rad);
  const vy = vTotal * Math.sin(rad);

  const startX = 0.5;
  const startY = 0.15;

  state.physics = {
    position: { x: startX, y: startY },
    velocity: { x: vx, y: vy },
    bounces: 0,
    isStopped: false,
    history: [{ x: startX, y: startY }],
  };
  
  setStatus('FLYING');
  state.score = 0;
  
  if (skipTimeoutID) clearTimeout(skipTimeoutID);
  skipTimeoutID = setTimeout(() => {
    if (state.status === 'FLYING') {
      els.btnSkip.classList.remove('hidden');
    }
  }, 1000);

  loop();
}

function handleSkip() {
  if (state.status !== 'FLYING') return;
  cancelAnimationFrame(requestID);
  let safetyCounter = 0;
  while (!state.physics.isStopped && safetyCounter < 5000) {
    state.physics = updatePhysics(state.physics, state.params);
    safetyCounter++;
  }
  renderGame();
  handleFinish(state.physics.position.x);
}

function handleRestart() {
  window.location.reload();
}

function loop() {
  if (state.status !== 'FLYING') return;
  
  // Run physics multiple times per frame for speed
  for (let i = 0; i < STEPS_PER_FRAME; i++) {
    state.physics = updatePhysics(state.physics, state.params);
    if (state.physics.isStopped) break;
  }
  
  renderGame();
  if (state.physics.isStopped) {
    handleFinish(state.physics.position.x);
  } else {
    requestID = requestAnimationFrame(loop);
  }
}

function handleFinish(distance) {
  state.score = distance;
  if (distance > state.highScore) {
    state.highScore = distance;
    localStorage.setItem('throwingGameHighScore', distance.toFixed(2));
  }
  updateUI();
  setStatus('FINISHED');
  cancelAnimationFrame(requestID);
}

// --- Rendering ---

function updateUI() {
  if (!els.lblPower) return;
  
  els.lblPower.textContent = state.params.power;
  
  // Calculate actual degree for display
  const displayDeg = Math.round(15 + (state.params.loft * 0.6));
  els.lblLoft.textContent = `${displayDeg}°`;
  
  els.lblWind.textContent = state.params.wind;
  
  const maxPower = 40; 
  const maxLoft = 100; // UI scale 0-100
  const maxWind = 20;

  if (els.barPower) els.barPower.style.width = `${Math.min(100, (state.params.power / maxPower) * 100)}%`;
  if (els.barLoft) els.barLoft.style.width = `${Math.min(100, (state.params.loft / maxLoft) * 100)}%`;
  if (els.barWind) els.barWind.style.width = `${Math.min(100, (state.params.wind / maxWind) * 100)}%`;

  els.valHighScore.textContent = state.highScore.toFixed(1);
}

function renderGame() {
  const { position, history } = state.physics;
  const distStr = position.x.toFixed(1);
  if (els.valDistance) els.valDistance.textContent = distStr;
  if (els.valHeight) els.valHeight.textContent = position.y.toFixed(1);

  const viewWidth = 80;
  const viewHeight = 40;
  const cameraX = Math.max(0, position.x - viewWidth * 0.3);
  
  if (els.svg) {
    els.svg.setAttribute('viewBox', `${cameraX} -35 ${viewWidth} ${viewHeight}`);
  }

  if (els.ball) {
    els.ball.setAttribute('cx', position.x);
    els.ball.setAttribute('cy', -position.y);
  }

  if (els.trail) {
    const points = history.map(p => `${p.x},${-p.y}`).join(' ');
    els.trail.setAttribute('points', points);
  }

  renderMarkers(cameraX, viewWidth);
}

function renderMarkers(cameraX, viewWidth) {
  if (!els.groundMarkers) return;
  const start = Math.floor(cameraX / 10) * 10;
  const end = start + viewWidth + 10;
  let markersHtml = '';
  markersHtml += `<rect x="${cameraX - 10}" y="0" width="${viewWidth + 20}" height="10" fill="#22c55e" />`;
  markersHtml += `<line x1="${cameraX - 10}" y1="0" x2="${cameraX + viewWidth + 10}" y2="0" stroke="#15803d" stroke-width="0.2" />`;

  for (let i = start; i <= end; i += 10) {
    if (i === 0) continue;
    markersHtml += `
      <g transform="translate(${i}, 0)">
        <line x1="0" y1="0" x2="0" y2="-2" stroke="#fff" stroke-width="0.1" />
        <rect x="-1" y="-3" width="2" height="1" fill="#fff" rx="0.2" />
        <text x="0" y="-2.3" font-size="0.6" fill="#15803d" text-anchor="middle" font-weight="bold">${i}m</text>
      </g>
    `;
  }
  els.groundMarkers.innerHTML = markersHtml;
}

// --- Initialization ---

export function updateParams(newParams) {
  if (newParams) {
    state.params = { ...state.params, ...newParams };
  }
  updateUI();
}

export function initGame() {
  els = {
    svg: document.getElementById('game-svg'),
    ball: document.getElementById('elm-ball'),
    trail: document.getElementById('elm-trail'),
    groundMarkers: document.getElementById('grp-markers'),
    
    lblPower: document.getElementById('lbl-power'),
    barPower: document.getElementById('bar-power'),
    
    lblLoft: document.getElementById('lbl-loft'),
    barLoft: document.getElementById('bar-loft'),
    
    lblWind: document.getElementById('lbl-wind'),
    barWind: document.getElementById('bar-wind'),
    
    btnLaunch: document.getElementById('btn-launch'),
    btnSkip: document.getElementById('btn-skip'),
    btnRestart: document.getElementById('btn-restart'),
    
    valDistance: document.getElementById('val-distance'),     
    valHeight: document.getElementById('val-height'),
    valHighScore: document.getElementById('val-highscore'),
    
    msgFinished: document.getElementById('msg-finished'),
    valFinalScore: document.getElementById('val-final-score'),
  };

  if (!els.btnLaunch || !els.svg) {
    console.error("Critical DOM elements missing");
    return;
  }

  els.btnLaunch.addEventListener('click', handleLaunch);
  if (els.btnSkip) els.btnSkip.addEventListener('click', handleSkip);
  if (els.btnRestart) els.btnRestart.addEventListener('click', handleRestart);

  const saved = localStorage.getItem('throwingGameHighScore');
  if (saved) {
    state.highScore = parseFloat(saved);
  }

  updateUI();
  renderGame(); // Initial Render
}