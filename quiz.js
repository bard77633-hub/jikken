import { startGame } from './app.js';

const questions = [
  {
    question: "Which angle typically provides the maximum range for a projectile (ignoring air resistance)?",
    options: [
      "30 Degrees",
      "45 Degrees",
      "60 Degrees",
      "90 Degrees"
    ],
    answer: 1, // Index of correct answer
    stat: "power" // Bonus stat type
  },
  {
    question: "When a ball hits the ground, what force helps it move forward despite friction?",
    options: [
      "Gravity",
      "Restitution",
      "Inertia (Momentum)",
      "Magnetic Force"
    ],
    answer: 2,
    stat: "bounce"
  },
  {
    question: "How does a 'Tailwind' affect a flying object?",
    options: [
      "Pushes it backward",
      "Pushes it downward",
      "Pushes it forward",
      "No effect"
    ],
    answer: 2,
    stat: "wind"
  },
  {
    question: "If gravity increases, what happens to the flight distance?",
    options: [
      "It increases",
      "It decreases",
      "It stays the same",
      "It becomes zero"
    ],
    answer: 1,
    stat: "power" // Understanding gravity helps power management
  }
];

let currentQuestionIndex = 0;
let score = 0;
let bonuses = {
  power: 10,  // Base values
  bounce: 2,
  wind: 0
};

// DOM Elements
const elQuizContainer = document.getElementById('quiz-container');
const elGameContainer = document.getElementById('game-container');
const elQuestionText = document.getElementById('question-text');
const elOptionsGrid = document.getElementById('options-grid');
const elFeedbackArea = document.getElementById('feedback-area');
const elFeedbackText = document.getElementById('feedback-text');
const elBtnNext = document.getElementById('btn-next-question');
const elProgress = document.getElementById('quiz-progress');
const elResultArea = document.getElementById('result-area');
const elQuestionArea = document.getElementById('question-area');
const elScoreDisplay = document.getElementById('score-display');
const elBtnStartGame = document.getElementById('btn-start-game');

// Bonus Display Elements
const elBonusPower = document.getElementById('bonus-power');
const elBonusBounce = document.getElementById('bonus-bounce');
const elBonusWind = document.getElementById('bonus-wind');

function renderQuestion() {
  const q = questions[currentQuestionIndex];
  
  elQuestionText.textContent = q.question;
  elOptionsGrid.innerHTML = '';
  
  // Update Progress
  const pct = (currentQuestionIndex / questions.length) * 100;
  elProgress.style.width = `${pct}%`;

  q.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = `quiz-option w-full p-4 text-left border-2 border-slate-200 rounded-xl font-medium text-slate-700 hover:border-blue-400 bg-white`;
    btn.textContent = opt;
    btn.onclick = () => handleAnswer(idx);
    elOptionsGrid.appendChild(btn);
  });
}

function handleAnswer(selectedIndex) {
  const q = questions[currentQuestionIndex];
  const isCorrect = selectedIndex === q.answer;
  const options = elOptionsGrid.children;

  // Disable all buttons
  for (let btn of options) {
    btn.disabled = true;
    btn.classList.add('cursor-not-allowed', 'opacity-80');
  }

  // Highlight result
  if (isCorrect) {
    options[selectedIndex].classList.add('correct');
    elFeedbackText.textContent = "Correct! Physics knowledge increasing...";
    elFeedbackText.className = "text-lg font-bold mb-4 text-green-600";
    score++;
    applyBonus(q.stat);
  } else {
    options[selectedIndex].classList.add('wrong');
    options[q.answer].classList.add('correct'); // Show right answer
    elFeedbackText.textContent = "Incorrect. The correct answer is highlighted.";
    elFeedbackText.className = "text-lg font-bold mb-4 text-red-500";
  }

  elFeedbackArea.classList.remove('hidden');
  elFeedbackArea.classList.add('fade-in');
}

function applyBonus(statType) {
  if (statType === 'power') bonuses.power += 5;
  if (statType === 'bounce') bonuses.bounce += 2;
  if (statType === 'wind') bonuses.wind += 5;
}

function nextQuestion() {
  currentQuestionIndex++;
  elFeedbackArea.classList.add('hidden');
  
  if (currentQuestionIndex < questions.length) {
    renderQuestion();
  } else {
    showResults();
  }
}

function showResults() {
  elQuestionArea.classList.add('hidden');
  elResultArea.classList.remove('hidden');
  elResultArea.classList.add('fade-in');
  
  // Final Progress
  elProgress.style.width = '100%';

  // Text
  elScoreDisplay.textContent = `${score} / ${questions.length}`;
  
  // Show Calculated Bonuses (Base + Earned)
  // Base was Power 10, Bounce 2, Wind 0. 
  // We show the resulting start values.
  elBonusPower.textContent = `Start Level ${bonuses.power}`;
  elBonusBounce.textContent = `Start Level ${bonuses.bounce}`;
  elBonusWind.textContent = `Start Level ${bonuses.wind}`;
}

function transitionToGame() {
  // Hide Quiz
  elQuizContainer.style.display = 'none';
  
  // Show Game
  elGameContainer.classList.remove('hidden');
  elGameContainer.classList.add('fade-in');

  // Start Game Logic with calculated bonuses
  startGame({
    power: bonuses.power,
    bounceLimit: bonuses.bounce,
    wind: bonuses.wind
  });
}

// Event Listeners
elBtnNext.addEventListener('click', nextQuestion);
elBtnStartGame.addEventListener('click', transitionToGame);

// Init
renderQuestion();