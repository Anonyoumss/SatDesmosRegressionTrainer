// ===== Desmos Init =====
const elt = document.getElementById('calculator');
const calculator = Desmos.GraphingCalculator(elt, { keypad: true, expressions: true });

// ===== State =====
const state = {
    currentQuestion: {
        id: null,
        startTime: null,
        tries: 0,
        perfectTime: 60,
        answer: null,
        category: null,
    },
    sessionStats: {
        totalCorrect: 0,
        timeSaved: 0,
        history: []
    },
    stopwatch: { interval: null, elapsed: 0 },
    pacing: { interval: null, questionStart: null },
    testMode: false,
    testCount: 0,
    currentQuestionNum: 0,
    darkMode: true,
};

// ===== localStorage helpers =====
function loadStorage() {
    try {
        const saved = localStorage.getItem('desmosTrainer');
        if (saved) {
            const data = JSON.parse(saved);
            if (data.selectedCategories) state.selectedCategories = data.selectedCategories;
            if (data.history) state.sessionStats.history = data.history;
            if (typeof data.darkMode === 'boolean') state.darkMode = data.darkMode;
        }
    } catch(e) {}
}

function saveStorage() {
    const checked = [...document.querySelectorAll('#category-selection input:checked')].map(cb => cb.value);
    localStorage.setItem('desmosTrainer', JSON.stringify({
        selectedCategories: checked,
        history: state.sessionStats.history.slice(-30),
        darkMode: state.darkMode,
    }));
}

// ===== Dark Mode =====
function applyTheme() {
    document.body.classList.toggle('light-mode', !state.darkMode);
    document.getElementById('theme-toggle').textContent = state.darkMode ? '☀️' : '🌙';
}

function toggleDarkMode() {
    state.darkMode = !state.darkMode;
    applyTheme();
    saveStorage();
}

// ===== Stopwatch =====
function startStopwatch() {
    state.stopwatch.elapsed = 0;
    updateStopwatchDisplay();
    if (state.stopwatch.interval) clearInterval(state.stopwatch.interval);
    state.stopwatch.interval = setInterval(() => {
        state.stopwatch.elapsed++;
        updateStopwatchDisplay();
    }, 1000);
}
function stopStopwatch() {
    if (state.stopwatch.interval) clearInterval(state.stopwatch.interval);
    state.stopwatch.interval = null;
}
function updateStopwatchDisplay() {
    const s = state.stopwatch.elapsed;
    const m = String(Math.floor(s / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    document.getElementById('stopwatch').textContent = `${m}:${sec}`;
}

// ===== Pacing Bar =====
function startPacingBar(perfectTime) {
    state.pacing.questionStart = Date.now();
    state.currentQuestion.perfectTime = perfectTime;
    updatePacingBar();
    if (state.pacing.interval) clearInterval(state.pacing.interval);
    state.pacing.interval = setInterval(updatePacingBar, 500);
}
function stopPacingBar() {
    if (state.pacing.interval) clearInterval(state.pacing.interval);
    state.pacing.interval = null;
}
function updatePacingBar() {
    if (!state.pacing.questionStart) return;
    const elapsed = (Date.now() - state.pacing.questionStart) / 1000;
    const pct = Math.min((elapsed / state.currentQuestion.perfectTime) * 100, 100);
    const bar = document.getElementById('pacing-bar');
    bar.style.width = pct + '%';
    if (elapsed > state.currentQuestion.perfectTime) {
        bar.classList.add('over-time');
    } else {
        bar.classList.remove('over-time');
    }
}

// ===== Pacing Summary =====
function showPacingSummary(timeTaken) {
    const pt = state.currentQuestion.perfectTime;
    const diff = pt - timeTaken;
    const el = document.getElementById('pacing-summary');
    el.style.display = 'block';
    if (diff >= 0) {
        el.className = 'fast';
        el.textContent = `⏱ Solved in ${timeTaken}s (Perfect: ${pt}s) — You saved ${diff}s!`;
    } else {
        el.className = 'slow';
        el.textContent = `⏱ Solved in ${timeTaken}s (Perfect: ${pt}s) — ${Math.abs(diff)}s over perfect time.`;
    }
}

// ===== History =====
function addToHistory(categoryTitle, timeTaken, tries, perfectTime) {
    const fast = timeTaken <= perfectTime;
    state.sessionStats.history.unshift({ categoryTitle, timeTaken, tries, perfectTime, fast });
    if (state.sessionStats.history.length > 30) state.sessionStats.history.pop();
    renderHistory();
    saveStorage();
}

function renderHistory() {
    const list = document.getElementById('history-list');
    const items = state.sessionStats.history.slice(0, 10);
    list.innerHTML = '';
    if (items.length === 0) {
        list.innerHTML = '<div style="font-size:0.75rem;color:var(--text-muted)">No questions solved yet.</div>';
        return;
    }
    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item ' + (item.fast ? 'h-fast' : 'h-slow');
        const tryLabel = item.tries === 1 ? '1st try' : item.tries === 2 ? '2nd try' : `${item.tries} tries`;
        div.innerHTML = `<div class="h-cat">${item.categoryTitle}</div><div class="h-meta">${item.timeTaken}s / ${item.perfectTime}s perfect • ${tryLabel}</div>`;
        list.appendChild(div);
    });
}

// ===== Attempt Dots =====
function renderAttemptDots() {
    const container = document.getElementById('attempt-dots');
    container.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.className = 'attempt-dot' + (i < state.currentQuestion.tries ? ' used' : '');
        container.appendChild(dot);
    }
}

// ===== Category Checkboxes =====
function populateCategoryCheckboxes() {
    const container = document.getElementById('category-selection');
    const savedCats = state.selectedCategories;
    container.innerHTML = '';
    categories.forEach(cat => {
        const div = document.createElement('div');
        div.className = 'cat-item';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.id = `cat-${cat.id}`;
        cb.value = cat.id;
        cb.checked = savedCats ? savedCats.includes(cat.id) : true;
        const label = document.createElement('label');
        label.htmlFor = `cat-${cat.id}`;
        label.textContent = cat.title;
        div.appendChild(cb);
        div.appendChild(label);
        container.appendChild(div);
    });
}

// ===== New Question =====
function newQuestion() {
    const checkedBoxes = document.querySelectorAll('#category-selection input[type="checkbox"]:checked');
    if (checkedBoxes.length === 0) {
        alert('Please select at least one category to practice!');
        return;
    }

    // Reset Desmos completely
    calculator.setBlank();

    const idx = Math.floor(Math.random() * checkedBoxes.length);
    const categoryId = checkedBoxes[idx].value;
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    const { questionText, answer } = category.questionGenerator();

    state.currentQuestion = {
        id: category.id,
        startTime: Date.now(),
        tries: 0,
        perfectTime: category.perfectTime || 90,
        answer,
        category,
    };

    // UI Reset
    document.getElementById('current-category-title').textContent = category.title;
    const qBox = document.getElementById('question-box');
    // Use normal whitespace for table-based questions
    if (category.id === 'Two points Non-linear') {
        qBox.style.whiteSpace = 'normal';
    } else {
        qBox.style.whiteSpace = 'pre-wrap';
    }
    qBox.innerHTML = questionText;
    MathJax.typeset([qBox]);

    document.getElementById('answer-box').value = '';
    document.getElementById('answer-box').className = '';
    document.getElementById('result').textContent = '';
    document.getElementById('result').className = '';
    document.getElementById('hint-text').style.display = 'none';
    document.getElementById('pacing-summary').style.display = 'none';
    document.getElementById('give-up-btn').style.display = 'none';
    document.getElementById('show-desmos-btn').style.display = 'none';

    // Tips
    const tipsList = document.getElementById('tips-list');
    tipsList.innerHTML = '';
    category.tips.forEach(tip => {
        const li = document.createElement('li');
        li.textContent = tip;
        tipsList.appendChild(li);
    });

    document.getElementById('show-explanation').dataset.imageSrc = category.explanationImage || '';
    renderAttemptDots();
    startPacingBar(state.currentQuestion.perfectTime);
    document.getElementById('answer-box').focus();
    saveStorage();
}

// ===== Answer Checking =====
function parseValue(str) {
    if (typeof str === 'number') return str;
    const s = String(str).trim();
    if (s.includes('/')) {
        const [n, d] = s.split('/');
        const num = parseFloat(n), den = parseFloat(d);
        if (!isNaN(num) && !isNaN(den) && den !== 0) return num / den;
    }
    const n = parseFloat(s);
    return isNaN(n) ? NaN : n;
}

function handleCheckAnswer() {
    if (state.currentQuestion.answer === null) return false;

    const answerBox = document.getElementById('answer-box');
    const userInput = answerBox.value.trim();
    if (!userInput) {
        setResult('❌ Please enter an answer.', false);
        return false;
    }

    const epsilon = 1e-9;
    const userVal = parseValue(userInput);
    const correctVal = parseValue(state.currentQuestion.answer);

    if (isNaN(userVal) || isNaN(correctVal)) {
        setResult('❌ Invalid format. Enter a number or fraction (e.g. 3/4).', false);
        return false;
    }

    const isCorrect = Math.abs(userVal - correctVal) < epsilon;

    if (isCorrect) {
        const timeTaken = Math.round((Date.now() - state.currentQuestion.startTime) / 1000);
        stopPacingBar();
        document.getElementById('pacing-bar').style.width = '100%';

        answerBox.classList.add('correct');
        setResult('✅ Correct!', true);

        state.sessionStats.totalCorrect++;
        document.getElementById('correct-counter').textContent = `✅ ${state.sessionStats.totalCorrect} correct`;

        addToHistory(state.currentQuestion.category.title, timeTaken, state.currentQuestion.tries + 1, state.currentQuestion.perfectTime);
        showPacingSummary(timeTaken);

        state.currentQuestion.answer = null; // prevent re-scoring
        return true;
    } else {
        state.currentQuestion.tries++;
        answerBox.classList.remove('correct');
        answerBox.classList.add('incorrect');
        renderAttemptDots();

        if (state.currentQuestion.tries === 1) {
            setResult('❌ Incorrect. Try again!', false);
            document.getElementById('give-up-btn').style.display = 'inline-block';
        } else if (state.currentQuestion.tries === 2) {
            setResult('❌ Still incorrect.', false);
            document.getElementById('hint-text').style.display = 'block';
        } else if (state.currentQuestion.tries >= 3) {
            setResult(`❌ The answer is ${state.currentQuestion.answer}.`, false);
            document.getElementById('show-desmos-btn').style.display = 'inline-block';
            document.getElementById('give-up-btn').style.display = 'none';
        }
        answerBox.focus();
        return false;
    }
}

function setResult(msg, correct) {
    const el = document.getElementById('result');
    el.textContent = msg;
    el.className = correct ? 'correct' : 'incorrect';
}

function giveUp() {
    stopPacingBar();
    setResult(`Answer: ${state.currentQuestion.answer}`, false);
    document.getElementById('show-desmos-btn').style.display = 'inline-block';
    document.getElementById('give-up-btn').style.display = 'none';
    document.getElementById('hint-text').style.display = 'block';
    document.getElementById('hint-text').textContent = 'Check the "Show Solved Example" for the method.';
    state.currentQuestion.answer = null;
}

// ===== Stopwatch (test timer) =====
function startStopwatchTest() { startStopwatch(); }

// ===== Test Mode =====
function startTest() {
    const n = parseInt(prompt('How many questions for the test?'));
    if (!n || n <= 0) return;
    const checkedBoxes = document.querySelectorAll('#category-selection input[type="checkbox"]:checked');
    if (checkedBoxes.length === 0) { alert('Please select at least one category!'); return; }
    state.testMode = true;
    state.testCount = n;
    state.currentQuestionNum = 0;
    startStopwatch();
    newQuestion();
}

function endTest(finished = false) {
    if (!state.testMode) return;
    stopStopwatch();
    const answered = finished ? state.testCount : state.currentQuestionNum;
    if (answered > 0) {
        const total = state.stopwatch.elapsed;
        alert(`Test ended! ${answered} questions in ${total}s — avg ${(total / answered).toFixed(1)}s/q`);
    }
    state.testMode = false;
    state.testCount = 0;
    state.currentQuestionNum = 0;
    newQuestion();
}

// ===== Sidebar Toggle =====
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
}

// ===== Explanation Modal =====
function showExplanation() {
    const src = document.getElementById('show-explanation').dataset.imageSrc;
    if (!src) { alert('Select a category and load a question first.'); return; }
    document.getElementById('explanation-modal-content').src = src;
    document.getElementById('explanation-modal').classList.add('open');
}
function closeExplanation() {
    document.getElementById('explanation-modal').classList.remove('open');
}

// ===== Resizer =====
function setupResizer() {
    const resizer = document.getElementById('resizer');
    const leftPanel = document.getElementById('left-panel');
    const rightPanel = document.getElementById('right-panel');
    let isResizing = false;

    resizer.addEventListener('mousedown', () => {
        isResizing = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    });
    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        const splitPane = document.getElementById('split-pane');
        const paneRect = splitPane.getBoundingClientRect();
        const leftW = e.clientX - paneRect.left;
        const totalW = paneRect.width - 5;
        const leftPct = Math.max(25, Math.min(70, (leftW / totalW) * 100));
        leftPanel.style.width = leftPct + '%';
    });
    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
    });
}

// ===== Keyboard Shortcuts =====
document.addEventListener('keydown', (e) => {
    if (e.target === document.getElementById('answer-box')) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const correct = handleCheckAnswer();
            if (correct) {
                if (state.testMode) {
                    state.currentQuestionNum++;
                    if (state.currentQuestionNum >= state.testCount) endTest(true);
                    else newQuestion();
                } else if (e.shiftKey) {
                    newQuestion();
                }
            }
        }
        return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        toggleDarkMode();
    }
    if (e.key === 'Enter' && e.altKey) {
        e.preventDefault();
        startTest();
    }
});

// ===== Wire up event listeners =====
function initEventListeners() {
    document.getElementById('check-answer').addEventListener('click', handleCheckAnswer);
    document.getElementById('new-question').addEventListener('click', newQuestion);
    document.getElementById('start-test').addEventListener('click', startTest);
    document.getElementById('end-test').addEventListener('click', () => {
        if (confirm('End test and save results?')) endTest(false);
    });
    document.getElementById('show-explanation').addEventListener('click', showExplanation);
    document.getElementById('close-modal').addEventListener('click', closeExplanation);
    document.getElementById('explanation-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('explanation-modal')) closeExplanation();
    });
    document.getElementById('select-all').addEventListener('click', () => {
        document.querySelectorAll('#category-selection input').forEach(cb => { cb.checked = true; });
        saveStorage();
    });
    document.getElementById('deselect-all').addEventListener('click', () => {
        document.querySelectorAll('#category-selection input').forEach(cb => { cb.checked = false; });
        saveStorage();
    });
    document.getElementById('category-selection').addEventListener('change', saveStorage);
    document.getElementById('theme-toggle').addEventListener('click', toggleDarkMode);
    document.getElementById('sidebar-toggle').addEventListener('click', toggleSidebar);
    document.getElementById('help-btn').addEventListener('click', () => {
        const p = document.getElementById('help-popup');
        p.style.display = p.style.display === 'block' ? 'none' : 'block';
    });
    document.getElementById('give-up-btn').addEventListener('click', giveUp);
    document.getElementById('show-desmos-btn').addEventListener('click', showExplanation);
    document.getElementById('clear-history').addEventListener('click', () => {
        state.sessionStats.history = [];
        renderHistory();
        saveStorage();
    });
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
    loadStorage();
    applyTheme();
    populateCategoryCheckboxes();
    renderHistory();
    initEventListeners();
    setupResizer();
    newQuestion();
});
