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
let els = {}; 

// --- Logic ---

function setStatus(newStatus) {
  state.status = newStatus;
  
  const isFlying = newStatus === 'FLYING';
  
  if (!els.btnLaunch) return; 

  // Update controls state
  els.inpPower.disabled = isFlying;
  els.inpBounce.disabled = isFlying;
  els.inpWind.disabled = isFlying;
  els.btnLaunch.disabled = isFlying;
  
  if (isFlying) {
    els.btnLaunch.textContent = 'Flying...';
    els.btnLaunch.classList.add('bg-gray-400');
    els.btnLaunch.classList.remove('bg-gradient-to-r', 'from-blue-500', 'to-indigo-600', 'hover:from-blue-600', 'hover:to-indigo-700', 'shadow-blue-500/30');
    
    els.msgFinished.classList.add('hidden');
  } else {
    els.btnLaunch.textContent = 'LAUNCH! 🚀';
    els.btnLaunch.classList.remove('bg-gray-400');
    els.btnLaunch.classList.add('bg-gradient-to-r', 'from-blue-500', 'to-indigo-600', 'hover:from-blue-600', 'hover:to-indigo-700', 'shadow-blue-500/30');
    
    if (newStatus === 'FINISHED') {
      els.msgFinished.classList.remove('hidden');
      els.valFinalScore.textContent = state.score.toFixed(2);
    }
  }
}

function handleLaunch() {
  const vTotal = state.params.power * 1.5;
  const vx = vTotal * Math.cos(LAUNCH_ANGLE);
  const vy = vTotal * Math.sin(LAUNCH_ANGLE);

  state.physics = {
    position: { x: 0, y: 0.5 },
    velocity: { x: vx, y: vy },
    bounces: 0,
    isStopped: false,
    history: [{ x: 0, y: 0.5 }],
  };
  
  setStatus('FLYING');
  state.score = 0;
  
  loop();
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
  els.lblPower.textContent = state.params.power;
  els.lblBounce.textContent = state.params.bounceLimit;
  els.lblWind.textContent = state.params.wind;
  
  els.valHighScore.textContent = state.highScore.toFixed(1);

  // Sync sliders if they exist (in case params changed programmatically)
  els.inpPower.value = state.params.power;
  els.inpBounce.value = state.params.bounceLimit;
  els.inpWind.value = state.params.wind;
}

function renderGame() {
  const { position, history } = state.physics;
  
  // HUD and Stats
  const distStr = position.x.toFixed(1);
  if (els.valDistance) els.valDistance.textContent = distStr;
  if (els.valDistanceBig) els.valDistanceBig.textContent = distStr;
  
  if (els.valHeight) els.valHeight.textContent = position.y.toFixed(1);

  // Camera Logic
  const viewWidth = 80;
  const viewHeight = 40;
  const cameraX = Math.max(0, position.x - viewWidth * 0.2);
  
  // Update SVG ViewBox to simulate camera movement
  if (els.svg) {
    els.svg.setAttribute('viewBox', `${cameraX} ${-viewHeight + 5} ${viewWidth} ${viewHeight}`);
  }

  // Update Ball
  if (els.ball) {
    els.ball.setAttribute('cx', position.x);
    els.ball.setAttribute('cy', -position.y);
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
  // Ground Line
  markersHtml += `<line x1="${cameraX - 10}" y1="0" x2="${cameraX + viewWidth + 10}" y2="0" stroke="#22c55e" stroke-width="0.5" />`;
  markersHtml += `<rect x="${cameraX - 10}" y="0" width="${viewWidth + 20}" height="10" fill="#4ade80" />`;

  // Ticks and Text
  for (let i = start; i <= end; i += 10) {
    markersHtml += `
      <g>
        <line x1="${i}" y1="0" x2="${i}" y2="0.5" stroke="white" stroke-width="0.1" />
        <text x="${i}" y="2" font-size="1.5" fill="white" text-anchor="middle" style="opacity: 0.8">${i}m</text>
      </g>
    `;
  }
  
  els.groundMarkers.innerHTML = markersHtml;
}

// --- Initialization ---

// Exported function to be called by quiz.js
export function startGame(initialParams) {
  // Apply initial parameters if provided
  if (initialParams) {
    state.params = { ...state.params, ...initialParams };
  }

  // Select DOM elements
  els = {
    svg: document.getElementById('game-svg'),
    ball: document.getElementById('elm-ball'),
    trail: document.getElementById('elm-trail'),
    groundMarkers: document.getElementById('grp-markers'),
    
    lblPower: document.getElementById('lbl-power'),
    inpPower: document.getElementById('inp-power'),
    
    lblBounce: document.getElementById('lbl-bounce'),
    inpBounce: document.getElementById('inp-bounce'),
    
    lblWind: document.getElementById('lbl-wind'),
    inpWind: document.getElementById('inp-wind'),
    
    btnLaunch: document.getElementById('btn-launch'),
    
    valDistance: document.getElementById('val-distance'),     
    valDistanceBig: document.getElementById('val-distance-big'), 
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
  els.inpPower.addEventListener('input', (e) => {
    state.params.power = Number(e.target.value);
    updateUI();
  });

  els.inpBounce.addEventListener('input', (e) => {
    state.params.bounceLimit = Number(e.target.value);
    updateUI();
  });

  els.inpWind.addEventListener('input', (e) => {
    state.params.wind = Number(e.target.value);
    updateUI();
  });

  els.btnLaunch.addEventListener('click', handleLaunch);

  const saved = localStorage.getItem('throwingGameHighScore');
  if (saved) {
    state.highScore = parseFloat(saved);
  }

  updateUI();
  renderGame();
  console.log("Game Started with params:", state.params);
}