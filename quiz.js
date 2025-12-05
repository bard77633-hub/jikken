import { initGame, updateParams, setRestartCallback } from './app.js';

// --- Quiz Data Structure by Genre ---
const genres = [
  {
    id: 'calc',
    title: '情報の表現と計算',
    icon: '🧮',
    description: '2進数、16進数、補数、文字コードなど',
    questions: [
      { q: "1バイト（8ビット）で表現できる情報の種類は全部で何通り？", options: ["128通り", "255通り", "256通り", "512通り"], a: 2 },
      { q: "2進数の「1010」を10進数で表すといくつ？", options: ["8", "10", "12", "16"], a: 1 },
      { q: "16進数の「F」を2進数で表すと？", options: ["1010", "1100", "1110", "1111"], a: 3 },
      { q: "コンピュータで負の数を表現するために使われる考え方は？", options: ["補数", "分数", "指数", "対数"], a: 0 },
      { q: "16進数で桁上がりが起こる数は？", options: ["10", "15", "16", "256"], a: 2 },
      { q: "文字コード体系のうち、英数字のみを扱う基本的なものは？", options: ["ASCII", "Shift_JIS", "Unicode", "EUC-JP"], a: 0 },
      { q: "「情報量」の最小単位は？", options: ["バイト", "ビット", "ピクセル", "ヘルツ"], a: 1 }
    ]
  },
  {
    id: 'media',
    title: 'デジタルメディア',
    icon: '🎨',
    description: '音、画像、動画のデジタル化と圧縮',
    questions: [
      { q: "光の三原色（RGB）をすべて混ぜると何色になる？", options: ["黒色", "白色", "紫色", "灰色"], a: 1 },
      { q: "音のアナログ波形をデジタル化する正しい順序は？", options: ["標本化 → 量子化 → 符号化", "量子化 → 標本化 → 符号化", "符号化 → 標本化 → 量子化", "標本化 → 符号化 → 量子化"], a: 0 },
      { q: "画像を「座標」と「計算式」で記録する形式は？", options: ["ラスタ形式", "ビットマップ", "ベクタ形式", "JPEG"], a: 2 },
      { q: "1秒間に処理する標本化（サンプリング）の回数を表す単位は？", options: ["dpi", "bps", "Hz", "fps"], a: 2 },
      { q: "元のデータに完全に復元できる圧縮方式は？", options: ["可逆圧縮", "非可逆圧縮", "不可逆圧縮", "高圧縮"], a: 0 },
      { q: "動画の滑らかさを表す「fps」は何の略？", options: ["Files Per Second", "Frames Per Second", "Feeds Per Second", "Formats Per Second"], a: 1 },
      { q: "色の三原色（CMY）をすべて混ぜると何色に近づく？", options: ["白", "黒", "赤", "透明"], a: 1 }
    ]
  },
  {
    id: 'hardware',
    title: 'PCの仕組み',
    icon: '💻',
    description: 'ハードウェア、CPU、論理回路',
    questions: [
      { q: "コンピュータの「頭脳」にあたる装置は？", options: ["HDD", "Memory", "GPU", "CPU"], a: 3 },
      { q: "CPUの日本語名称は？", options: ["中央処理装置", "主記憶装置", "補助記憶装置", "演算処理装置"], a: 0 },
      { q: "2つの入力がともに「1」のときだけ「1」を出力する回路は？", options: ["OR回路", "NOT回路", "AND回路", "NAND回路"], a: 2 },
      { q: "入力信号を「反転」させる回路は？", options: ["OR回路", "NOT回路", "AND回路", "XOR回路"], a: 1 },
      { q: "電源を切るとデータが消える「揮発性」メモリは？", options: ["SSD", "HDD", "ROM", "RAM"], a: 3 },
      { q: "入力の「どちらか一方でも1」なら1を出力する回路は？", options: ["OR回路", "NOT回路", "AND回路", "NOR回路"], a: 0 },
      { q: "2進数の1桁の足し算を行う回路は？", options: ["半加算器", "全加算器", "乗算器", "除算器"], a: 0 }
    ]
  }
];

// --- State ---
let currentGenre = null;
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let bonuses = { power: 10, loft: 20, wind: 0 };

// --- DOM Elements ---
let els = {};

function init() {
  els = {
    menuContainer: document.getElementById('menu-container'),
    quizContainer: document.getElementById('quiz-container'),
    gameContainer: document.getElementById('game-container'),
    genreGrid: document.getElementById('genre-grid'),
  };

  // Initialize game engine
  initGame();

  // Setup restart callback from app.js
  setRestartCallback(returnToMenu);

  // Load stats and render menu
  renderMenu();
}

// --- Menu Logic ---
function getStats(genreId) {
  const key = `golf_stats_${genreId}`;
  const json = localStorage.getItem(key);
  return json ? JSON.parse(json) : { maxCorrect: 0, maxDistance: 0 };
}

function renderMenu() {
  els.menuContainer.classList.remove('hidden');
  els.quizContainer.classList.add('hidden');
  els.gameContainer.classList.add('blur-md');
  
  els.genreGrid.innerHTML = '';

  genres.forEach(genre => {
    const stats = getStats(genre.id);
    const totalQ = genre.questions.length;
    
    const card = document.createElement('div');
    card.className = "bg-white/90 backdrop-blur rounded-2xl p-6 shadow-xl border-4 border-transparent hover:border-emerald-400 hover:-translate-y-1 transition-all cursor-pointer group";
    card.onclick = () => startQuiz(genre);

    card.innerHTML = `
      <div class="flex items-center justify-between mb-4">
        <span class="text-4xl group-hover:scale-110 transition-transform">${genre.icon}</span>
        <div class="text-right">
           <div class="text-xs font-bold text-slate-400 uppercase">Max Score</div>
           <div class="font-bold text-emerald-600">${stats.maxCorrect} <span class="text-slate-400 text-xs">/ ${totalQ}</span></div>
        </div>
      </div>
      <h3 class="text-xl font-black text-slate-800 mb-1">${genre.title}</h3>
      <p class="text-slate-500 text-sm mb-4 min-h-[2.5rem]">${genre.description}</p>
      
      <div class="bg-slate-100 rounded-lg p-3 flex justify-between items-center">
        <span class="text-xs font-bold text-slate-500 uppercase">Max Dist</span>
        <span class="font-mono font-bold text-amber-500 text-lg">${stats.maxDistance.toFixed(1)}m</span>
      </div>
    `;
    els.genreGrid.appendChild(card);
  });
}

function returnToMenu() {
  // Reset UI
  document.getElementById('msg-finished').classList.add('hidden');
  els.gameContainer.classList.add('blur-md');
  renderMenu();
}

// --- Quiz Logic ---

function startQuiz(genre) {
  currentGenre = genre;
  // Clone questions to avoid mutating original order if we shuffled (optional)
  currentQuestions = [...genre.questions]; 
  currentQuestionIndex = 0;
  score = 0;
  bonuses = { power: 10, loft: 20, wind: 0 }; // Reset bonuses

  els.menuContainer.classList.add('hidden');
  els.quizContainer.classList.remove('hidden');
  
  renderQuizStructure();
  renderQuestion();
}

function renderQuizStructure() {
  els.quizContainer.innerHTML = `
    <div class="max-w-2xl w-full bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/50 overflow-hidden fade-in">
      <div class="bg-gradient-to-r from-emerald-600 to-teal-500 p-6 text-white text-center shadow-md">
        <h1 class="text-2xl font-extrabold tracking-tight mb-1">${currentGenre.title}</h1>
        <p class="text-emerald-100 text-xs font-medium uppercase tracking-widest">Question <span id="q-idx">1</span> / ${currentQuestions.length}</p>
      </div>
      <div class="p-8">
        <div class="w-full bg-gray-200 rounded-full h-2.5 mb-8">
          <div id="quiz-progress" class="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" style="width: 0%"></div>
        </div>
        <div id="question-area">
          <h2 id="question-text" class="text-xl font-bold text-slate-800 mb-8 text-center min-h-[4rem] flex items-center justify-center"></h2>
          <div id="options-grid" class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"></div>
        </div>
        <div id="feedback-area" class="hidden text-center mt-6 pt-6 border-t border-slate-100">
          <p id="feedback-text" class="text-lg font-bold mb-4"></p>
          <button id="btn-next-question" class="px-8 py-3 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-700 transition-colors shadow-lg">次へ</button>
        </div>
        <div id="result-area" class="hidden text-center space-y-6">
          <div class="text-5xl mb-4 animate-bounce">⛳️</div>
          <h2 class="text-3xl font-bold text-slate-800 tracking-tight">Training Complete!</h2>
          <p class="text-slate-600">正解数: <span class="font-bold text-emerald-600 text-2xl">${score}</span> / ${currentQuestions.length}</p>
          <div class="bg-emerald-50 p-6 rounded-xl text-left text-sm text-emerald-900 space-y-3 border border-emerald-100 shadow-inner">
            <p class="font-bold text-center mb-4 text-base">獲得ステータス</p>
            <div class="flex justify-between items-center border-b border-emerald-200 pb-2">
              <span>Power</span> <span id="bonus-power" class="font-bold text-lg">+0</span>
            </div>
            <div class="flex justify-between items-center border-b border-emerald-200 pb-2">
              <span>Loft</span> <span id="bonus-loft" class="font-bold text-lg">+0°</span>
            </div>
            <div class="flex justify-between items-center">
              <span>Wind</span> <span id="bonus-wind" class="font-bold text-lg">+0</span>
            </div>
          </div>
          <button id="btn-start-game" class="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold text-lg shadow-lg hover:translate-y-[-2px] transition-all">コースへ出る (START)</button>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('btn-next-question').onclick = nextQuestion;
  document.getElementById('btn-start-game').onclick = transitionToGame;
}

function renderQuestion() {
  const q = currentQuestions[currentQuestionIndex];
  
  document.getElementById('q-idx').textContent = currentQuestionIndex + 1;
  document.getElementById('question-text').textContent = q.q;
  
  const grid = document.getElementById('options-grid');
  grid.innerHTML = '';
  
  const pct = (currentQuestionIndex / currentQuestions.length) * 100;
  document.getElementById('quiz-progress').style.width = `${pct}%`;

  q.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = `quiz-option w-full p-4 text-left border-2 border-slate-200 rounded-xl font-medium text-slate-700 hover:border-emerald-400 bg-white transition-all`;
    btn.textContent = opt;
    btn.onclick = () => handleAnswer(idx);
    grid.appendChild(btn);
  });
}

function handleAnswer(selectedIndex) {
  const q = currentQuestions[currentQuestionIndex];
  const isCorrect = selectedIndex === q.a;
  const options = document.getElementById('options-grid').children;

  for (let btn of options) {
    btn.disabled = true;
    btn.classList.add('cursor-not-allowed', 'opacity-60');
  }

  const feedbackText = document.getElementById('feedback-text');
  
  if (isCorrect) {
    options[selectedIndex].classList.add('correct');
    options[selectedIndex].classList.remove('opacity-60');
    score++;
    
    // Bonus Logic
    const totalPoints = Math.floor(Math.random() * 5) + 4; 
    const dist = distributePoints(totalPoints);
    bonuses.power += dist.power;
    bonuses.loft += dist.loft;
    bonuses.wind += dist.wind;
    
    let bStr = [];
    if (dist.power > 0) bStr.push(`P+${dist.power}`);
    if (dist.loft > 0) bStr.push(`L+${dist.loft}`);
    if (dist.wind > 0) bStr.push(`W+${dist.wind}`);

    feedbackText.innerHTML = `<span class="text-emerald-600 block text-xl mb-1">正解！</span><span class="text-amber-500 text-sm font-bold">✨ ${bStr.join(' ')}</span>`;
  } else {
    options[selectedIndex].classList.add('wrong');
    options[q.a].classList.add('correct');
    options[q.a].classList.remove('opacity-60');
    feedbackText.innerHTML = `<span class="text-rose-500 block text-xl">残念...</span>`;
  }

  const fbArea = document.getElementById('feedback-area');
  fbArea.classList.remove('hidden');
  fbArea.classList.add('fade-in');
}

function distributePoints(points) {
  const stats = ['power', 'loft', 'wind'];
  let dist = { power: 0, loft: 0, wind: 0 };
  for (let i = 0; i < points; i++) {
    dist[stats[Math.floor(Math.random() * 3)]]++;
  }
  return dist;
}

function nextQuestion() {
  currentQuestionIndex++;
  document.getElementById('feedback-area').classList.add('hidden');
  
  if (currentQuestionIndex < currentQuestions.length) {
    renderQuestion();
  } else {
    showResults();
  }
}

function showResults() {
  document.getElementById('question-area').classList.add('hidden');
  const resArea = document.getElementById('result-area');
  resArea.classList.remove('hidden');
  resArea.classList.add('fade-in');
  document.getElementById('quiz-progress').style.width = '100%';

  document.getElementById('bonus-power').textContent = `Lv. ${bonuses.power}`;
  document.getElementById('bonus-loft').textContent = `Lv. ${bonuses.loft}`;
  document.getElementById('bonus-wind').textContent = `Lv. ${bonuses.wind}`;

  // Save Quiz High Score (Correct count) immediately
  const stats = getStats(currentGenre.id);
  if (score > stats.maxCorrect) {
    stats.maxCorrect = score;
    localStorage.setItem(`golf_stats_${currentGenre.id}`, JSON.stringify(stats));
  }
}

function transitionToGame() {
  // Pass Genre ID to App for High Score saving later
  updateParams({
    power: bonuses.power,
    loft: bonuses.loft,
    wind: bonuses.wind
  }, currentGenre.id);

  els.quizContainer.classList.add('hidden');
  els.gameContainer.classList.remove('blur-md');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}