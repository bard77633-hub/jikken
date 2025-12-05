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
    els.btnLaunch.innerHTML = 'Flying... 🏌️‍♂️';
    els.btnLaunch.classList.add('bg-slate-400', 'cursor-not-allowed');
    els.btnLaunch.classList.remove('bg-gradient-to-r', 'from-emerald-500', 'to-teal-600', 'hover:from-emerald-600', 'hover:to-teal-700', 'shadow-emerald-500/30');
    
    els.msgFinished.classList.add('hidden');
  } else {
    els.btnLaunch.innerHTML = 'SHOT! 🏌️‍♂️';
    els.btnLaunch.classList.remove('bg-slate-400', 'cursor-not-allowed');
    els.btnLaunch.classList.add('bg-gradient-to-r', 'from-emerald-500', 'to-teal-600', 'hover:from-emerald-600', 'hover:to-teal-700', 'shadow-emerald-500/30');
    
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

  // Sync sliders
  els.inpPower.value = state.params.power;
  els.inpBounce.value = state.params.bounceLimit;
  els.inpWind.value = state.params.wind;
}

function renderGame() {
  const { position, history } = state.physics;
  
  // HUD and Stats
  const distStr = position.x.toFixed(1);
  if (els.valDistance) els.valDistance.textContent = distStr;
  
  // Big Distance Display removed in index.html, using HUD only or update if exists
  // if (els.valDistanceBig) els.valDistanceBig.textContent = distStr;
  
  if (els.valHeight) els.valHeight.textContent = position.y.toFixed(1);

  // Camera Logic
  const viewWidth = 80;
  const viewHeight = 40;
  // Camera follows ball but keeps golfer in view initially
  const cameraX = Math.max(0, position.x - viewWidth * 0.3);
  
  // Update SVG ViewBox (Y is flipped in SVG logic within code? No, we transform points manually usually)
  // But here we rely on the group transform or coordinate mapping.
  // The SVG viewBox is set to `0 -35 80 40`. 
  // Let's slide the x viewbox.
  if (els.svg) {
    // y is usually negative for "up" in SVG from 0.
    // Fixed height view: from -35 to +5 (ground at 0).
    els.svg.setAttribute('viewBox', `${cameraX} -35 ${viewWidth} ${viewHeight}`);
  }

  // Update Ball
  // Note: physics y is positive up. SVG y is positive down.
  // So we negate y.
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
  markersHtml += `<rect x="${cameraX - 10}" y="0" width="${viewWidth + 20}" height="10" fill="#4ade80" />`;
  markersHtml += `<line x1="${cameraX - 10}" y1="0" x2="${cameraX + viewWidth + 10}" y2="0" stroke="#22c55e" stroke-width="0.2" />`;

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
    inpPower: document.getElementById('inp-power'),
    
    lblBounce: document.getElementById('lbl-bounce'),
    inpBounce: document.getElementById('inp-bounce'),
    
    lblWind: document.getElementById('lbl-wind'),
    inpWind: document.getElementById('inp-wind'),
    
    btnLaunch: document.getElementById('btn-launch'),
    
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
  console.log("Golf Game Started with params:", state.params);
}