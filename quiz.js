import { initGame, updateParams } from './app.js';

// General Knowledge Questions (Japanese)
const questions = [
  {
    category: "地理",
    question: "日本で一番高い山はどれ？",
    options: ["北岳", "富士山", "奥穂高岳", "間ノ岳"],
    answer: 1
  },
  {
    category: "科学",
    question: "元素記号「O」が表すものは？",
    options: ["金", "銀", "酸素", "鉄"],
    answer: 2
  },
  {
    category: "歴史",
    question: "1603年に徳川家康が開いた幕府は？",
    options: ["鎌倉幕府", "室町幕府", "江戸幕府", "明治政府"],
    answer: 2
  },
  {
    category: "音楽",
    question: "一般的なピアノの鍵盤の数はいくつ？",
    options: ["66鍵", "76鍵", "88鍵", "96鍵"],
    answer: 2
  },
  {
    category: "宇宙",
    question: "太陽系の中で最も大きな惑星は？",
    options: ["地球", "土星", "火星", "木星"],
    answer: 3
  },
  {
    category: "文学",
    question: "『吾輩は猫である』の著者は？",
    options: ["夏目漱石", "太宰治", "芥川龍之介", "三島由紀夫"],
    answer: 0
  }
];

let currentQuestionIndex = 0;
let score = 0;
let bonuses = {
  power: 10,  // Base values
  loft: 20,   // Replaced run/bounce. This maps to approx 27 degrees initial angle.
  wind: 0
};

// DOM Elements Container
let els = {};

function init() {
  els = {
    quizContainer: document.getElementById('quiz-container'),
    gameContainer: document.getElementById('game-container'),
    questionText: document.getElementById('question-text'),
    optionsGrid: document.getElementById('options-grid'),
    feedbackArea: document.getElementById('feedback-area'),
    feedbackText: document.getElementById('feedback-text'),
    btnNext: document.getElementById('btn-next-question'),
    progress: document.getElementById('quiz-progress'),
    resultArea: document.getElementById('result-area'),
    questionArea: document.getElementById('question-area'),
    scoreDisplay: document.getElementById('score-display'),
    btnStartGame: document.getElementById('btn-start-game'),
    bonusPower: document.getElementById('bonus-power'),
    bonusLoft: document.getElementById('bonus-loft'),
    bonusWind: document.getElementById('bonus-wind'),
  };

  if (!els.questionText) {
    console.error("Quiz elements not found. Retrying...");
    return;
  }

  if (els.btnNext) els.btnNext.addEventListener('click', nextQuestion);
  if (els.btnStartGame) els.btnStartGame.addEventListener('click', transitionToGame);

  // Initialize background game scene
  initGame();
  
  renderQuestion();
}

function renderQuestion() {
  const q = questions[currentQuestionIndex];
  
  els.questionText.innerHTML = `<span class="block text-sm text-emerald-500 font-bold mb-2 uppercase tracking-wide">${q.category}</span>${q.question}`;
  els.optionsGrid.innerHTML = '';
  
  const pct = (currentQuestionIndex / questions.length) * 100;
  els.progress.style.width = `${pct}%`;

  q.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = `quiz-option w-full p-4 text-left border-2 border-slate-200 rounded-xl font-medium text-slate-700 hover:border-emerald-400 bg-white transition-all`;
    btn.textContent = opt;
    btn.onclick = () => handleAnswer(idx);
    els.optionsGrid.appendChild(btn);
  });
}

function handleAnswer(selectedIndex) {
  const q = questions[currentQuestionIndex];
  const isCorrect = selectedIndex === q.answer;
  const options = els.optionsGrid.children;

  for (let btn of options) {
    btn.disabled = true;
    btn.classList.add('cursor-not-allowed', 'opacity-60');
  }

  if (isCorrect) {
    options[selectedIndex].classList.add('correct');
    options[selectedIndex].classList.remove('opacity-60');
    score++;
    
    // Calculate Random Bonus Distribution
    // Random total points between 4 and 8
    const totalPoints = Math.floor(Math.random() * 5) + 4; 
    const distribution = distributePoints(totalPoints);
    
    // Apply bonuses
    bonuses.power += distribution.power;
    bonuses.loft += distribution.loft;
    bonuses.wind += distribution.wind;
    
    // Build feedback string
    let bonusStr = [];
    if (distribution.power > 0) bonusStr.push(`Power +${distribution.power}`);
    if (distribution.loft > 0) bonusStr.push(`Loft +${distribution.loft}`);
    if (distribution.wind > 0) bonusStr.push(`Wind +${distribution.wind}`);
    
    els.feedbackText.innerHTML = `
      <span class="text-emerald-600 block text-xl mb-1">正解！ナイスアプローチ！</span>
      <span class="text-amber-500 text-base font-bold">✨ Lv.UP! (${bonusStr.join(', ')})</span>
    `;
    els.feedbackText.className = "mb-4";
  } else {
    options[selectedIndex].classList.add('wrong');
    options[q.answer].classList.add('correct');
    options[q.answer].classList.remove('opacity-60');
    els.feedbackText.textContent = "残念...OBです。";
    els.feedbackText.className = "text-lg font-bold mb-4 text-rose-500";
  }

  els.feedbackArea.classList.remove('hidden');
  els.feedbackArea.classList.add('fade-in');
}

function distributePoints(points) {
  const stats = ['power', 'loft', 'wind'];
  let dist = { power: 0, loft: 0, wind: 0 };
  
  for (let i = 0; i < points; i++) {
    const r = stats[Math.floor(Math.random() * stats.length)];
    dist[r]++;
  }
  return dist;
}

function nextQuestion() {
  currentQuestionIndex++;
  els.feedbackArea.classList.add('hidden');
  
  if (currentQuestionIndex < questions.length) {
    renderQuestion();
  } else {
    showResults();
  }
}

function showResults() {
  els.questionArea.classList.add('hidden');
  els.resultArea.classList.remove('hidden');
  els.resultArea.classList.add('fade-in');
  
  els.progress.style.width = '100%';

  els.scoreDisplay.textContent = `${score} / ${questions.length}`;
  
  els.bonusPower.textContent = `Lv. ${bonuses.power}`;
  els.bonusLoft.textContent = `Lv. ${bonuses.loft}`;
  els.bonusWind.textContent = `Lv. ${bonuses.wind}`;
}

function transitionToGame() {
  // Update Game Params with Quiz Results
  updateParams({
    power: bonuses.power,
    loft: bonuses.loft,
    wind: bonuses.wind
  });

  // Seamless Transition UI
  els.quizContainer.classList.add('opacity-0', 'pointer-events-none');
  els.gameContainer.classList.remove('blur-md');
  
  // Optional: Remove quiz container from DOM after transition
  setTimeout(() => {
    els.quizContainer.style.display = 'none';
  }, 500);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}