import { updatePhysics } from './physics.js';
import { LAUNCH_ANGLE } from './constants.js';

// --- State ---
const state = {
  status: 'IDLE', // IDLE, FLYING, FINISHED
  params: {
    power: 15,
    bounceLimit: 5,
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

// --- Logic ---

function setStatus(newStatus) {
  state.status = newStatus;
  
  const isFlying = newStatus === 'FLYING';
  const isFinished = newStatus === 'FINISHED';
  const isIdle = newStatus === 'IDLE';

  if (!els.btnLaunch) return; 

  // Handle SHOT Button State
  if (isFlying || isFinished) {
    // Disable and shrink button to show it's "done"
    els.btnLaunch.disabled = true;
    els.btnLaunch.classList.add('scale-90', 'opacity-50', 'grayscale', 'cursor-not-allowed');
    els.btnLaunch.classList.remove('hover:from-emerald-600', 'hover:to-teal-700', 'active:scale-95');
    
    if (isFlying) {
      els.btnLaunch.innerHTML = 'Flying... 🏌️‍♂️';
    } else {
      els.btnLaunch.innerHTML = 'Shot Complete';
    }
  } else {
    // Reset for new game (though usually we reload)
    els.btnLaunch.disabled = false;
    els.btnLaunch.classList.remove('scale-90', 'opacity-50', 'grayscale', 'cursor-not-allowed');
    els.btnLaunch.classList.add('hover:from-emerald-600', 'hover:to-teal-700', 'active:scale-95');
    els.btnLaunch.innerHTML = 'SHOT! 🏌️‍♂️';
  }

  // Handle Overlays (Result & Skip)
  if (isFlying) {
    els.msgFinished.classList.add('hidden');
    els.btnSkip.classList.add('hidden'); 
  } else if (isFinished) {
    els.msgFinished.classList.remove('hidden'); // Show centered result
    els.btnSkip.classList.add('hidden');
    els.valFinalScore.textContent = state.score.toFixed(2);
  } else {
    // IDLE
    els.msgFinished.classList.add('hidden');
    els.btnSkip.classList.add('hidden');
  }
}

function handleLaunch() {
  const vTotal = state.params.power * 1.5;
  const vx = vTotal * Math.cos(LAUNCH_ANGLE);
  const vy = vTotal * Math.sin(LAUNCH_ANGLE);

  // Ball starts slightly in front and up from 0,0 (tee position)
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
  
  // Schedule SKIP button appearance
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
  
  // Cancel animation
  cancelAnimationFrame(requestID);
  
  // Fast forward physics
  let safetyCounter = 0;
  while (!state.physics.isStopped && safetyCounter < 5000) {
    state.physics = updatePhysics(state.physics, state.params);
    safetyCounter++;
  }
  
  // Render final state
  renderGame();
  handleFinish(state.physics.position.x);
}

function handleRestart() {
  window.location.reload();
}

function loop() {
  if (state.status !== 'FLYING') return;

  state.physics = updatePhysics(state.physics, state.params);
  
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
  
  // Update Text
  els.lblPower.textContent = state.params.power;
  els.lblBounce.textContent = state.params.bounceLimit;
  els.lblWind.textContent = state.params.wind;
  
  // Update Bars (Max power approx 30-40 for visuals)
  const maxPower = 40; 
  const maxBounce = 15;
  const maxWind = 20;

  if (els.barPower) els.barPower.style.width = `${Math.min(100, (state.params.power / maxPower) * 100)}%`;
  if (els.barBounce) els.barBounce.style.width = `${Math.min(100, (state.params.bounceLimit / maxBounce) * 100)}%`;
  if (els.barWind) els.barWind.style.width = `${Math.min(100, (state.params.wind / maxWind) * 100)}%`;

  els.valHighScore.textContent = state.highScore.toFixed(1);
}

function renderGame() {
  const { position, history } = state.physics;
  
  // HUD
  const distStr = position.x.toFixed(1);
  if (els.valDistance) els.valDistance.textContent = distStr;
  if (els.valHeight) els.valHeight.textContent = position.y.toFixed(1);

  // Camera Logic
  const viewWidth = 80;
  const viewHeight = 40;
  const cameraX = Math.max(0, position.x - viewWidth * 0.3);
  
  if (els.svg) {
    els.svg.setAttribute('viewBox', `${cameraX} -35 ${viewWidth} ${viewHeight}`);
  }

  // Update Ball
  if (els.ball) {
    els.ball.setAttribute('cx', position.x);
    els.ball.setAttribute('cy', -position.y); // Flip Y
  }

  // Update Trail
  if (els.trail) {
    const points = history.map(p => `${p.x},${-p.y}`).join(' ');
    els.trail.setAttribute('points', points);
  }

  // Update Ground Markers
  renderMarkers(cameraX, viewWidth);
}

function renderMarkers(cameraX, viewWidth) {
  if (!els.groundMarkers) return;
  
  const start = Math.floor(cameraX / 10) * 10;
  const end = start + viewWidth + 10;
  
  let markersHtml = '';
  // Ground Line (Green fairway)
  markersHtml += `<rect x="${cameraX - 10}" y="0" width="${viewWidth + 20}" height="10" fill="#22c55e" />`;
  markersHtml += `<line x1="${cameraX - 10}" y1="0" x2="${cameraX + viewWidth + 10}" y2="0" stroke="#15803d" stroke-width="0.2" />`;

  // Distance Markers (Yardage signs)
  for (let i = start; i <= end; i += 10) {
    if (i === 0) continue; // Don't mark 0
    markersHtml += `
      <g transform="translate(${i}, 0)">
        <!-- Pole -->
        <line x1="0" y1="0" x2="0" y2="-2" stroke="#fff" stroke-width="0.1" />
        <!-- Board -->
        <rect x="-1" y="-3" width="2" height="1" fill="#fff" rx="0.2" />
        <text x="0" y="-2.3" font-size="0.6" fill="#15803d" text-anchor="middle" font-weight="bold">${i}m</text>
      </g>
    `;
  }
  
  els.groundMarkers.innerHTML = markersHtml;
}

// --- Initialization ---

export function startGame(initialParams) {
  if (initialParams) {
    state.params = { ...state.params, ...initialParams };
  }

  els = {
    svg: document.getElementById('game-svg'),
    ball: document.getElementById('elm-ball'),
    trail: document.getElementById('elm-trail'),
    groundMarkers: document.getElementById('grp-markers'),
    
    lblPower: document.getElementById('lbl-power'),
    barPower: document.getElementById('bar-power'),
    
    lblBounce: document.getElementById('lbl-bounce'),
    barBounce: document.getElementById('bar-bounce'),
    
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

  // Attach Listeners
  els.btnLaunch.addEventListener('click', handleLaunch);
  if (els.btnSkip) els.btnSkip.addEventListener('click', handleSkip);
  if (els.btnRestart) els.btnRestart.addEventListener('click', handleRestart);

  const saved = localStorage.getItem('throwingGameHighScore');
  if (saved) {
    state.highScore = parseFloat(saved);
  }

  updateUI();
  renderGame();
  console.log("Golf Game Started with params:", state.params);
}