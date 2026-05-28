// ===== Desmos Init =====
const elt = document.getElementById('calculator');
const calculator = Desmos.GraphingCalculator(elt, { keypad: true, expressions: true });

// ===== State =====
const state = {
    currentQuestion: { id: null, startTime: null, tries: 0, perfectTime: 60, answer: null, category: null, flagged: false, rawText: '' },
    sessionStats: { totalCorrect: 0, history: [] },
    stopwatch: { interval: null, elapsed: 0 },
    pacing: { interval: null, questionStart: null },
    testMode: false, testCount: 0, currentQuestionNum: 0,
    darkMode: true, muted: false, crossOutMode: false,
    resizerPct: 48,
    flaggedQuestions: [],
    reviewingFlagged: false,
};

// ===== Web Audio =====
function playSound(type) {
    if (state.muted) return;
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        if (type === 'correct') { osc.frequency.value = 880; osc.type = 'sine'; gain.gain.setValueAtTime(0.18, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35); osc.start(); osc.stop(ctx.currentTime + 0.35); }
        else { osc.frequency.value = 160; osc.type = 'sawtooth'; gain.gain.setValueAtTime(0.12, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4); osc.start(); osc.stop(ctx.currentTime + 0.4); }
    } catch(e) {}
}

// ===== localStorage =====
function loadStorage() {
    try {
        const data = JSON.parse(localStorage.getItem('desmosTrainer') || '{}');
        if (data.selectedCategories) state.selectedCategories = data.selectedCategories;
        if (data.history) state.sessionStats.history = data.history;
        if (typeof data.darkMode === 'boolean') state.darkMode = data.darkMode;
        if (typeof data.muted === 'boolean') state.muted = data.muted;
        if (typeof data.resizerPct === 'number') state.resizerPct = data.resizerPct;
        if (Array.isArray(data.flaggedQuestions)) state.flaggedQuestions = data.flaggedQuestions;
    } catch(e) {}
}
function saveStorage() {
    const checked = [...document.querySelectorAll('#category-selection input:checked')].map(cb => cb.value);
    localStorage.setItem('desmosTrainer', JSON.stringify({
        selectedCategories: checked,
        history: state.sessionStats.history.slice(-50),
        darkMode: state.darkMode, muted: state.muted,
        resizerPct: state.resizerPct,
        flaggedQuestions: state.flaggedQuestions.slice(-50),
    }));
}

// ===== Theme =====
function applyTheme() {
    document.body.classList.toggle('light-mode', !state.darkMode);
    document.getElementById('theme-toggle').textContent = state.darkMode ? '☀️' : '🌙';
}
function toggleDarkMode() { state.darkMode = !state.darkMode; applyTheme(); saveStorage(); }

// ===== Mute =====
function applyMute() { document.getElementById('mute-btn').textContent = state.muted ? '🔇' : '🔔'; }
function toggleMute() { state.muted = !state.muted; applyMute(); saveStorage(); }

// ===== Stopwatch =====
function startStopwatch() {
    state.stopwatch.elapsed = 0; updateStopwatchDisplay();
    if (state.stopwatch.interval) clearInterval(state.stopwatch.interval);
    state.stopwatch.interval = setInterval(() => { state.stopwatch.elapsed++; updateStopwatchDisplay(); }, 1000);
}
function stopStopwatch() { clearInterval(state.stopwatch.interval); state.stopwatch.interval = null; }
function updateStopwatchDisplay() {
    const s = state.stopwatch.elapsed;
    document.getElementById('stopwatch').textContent = `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
}

// ===== Pacing Bar =====
function startPacingBar(pt) {
    state.pacing.questionStart = Date.now();
    if (state.pacing.interval) clearInterval(state.pacing.interval);
    state.pacing.interval = setInterval(updatePacingBar, 500);
    updatePacingBar();
}
function stopPacingBar() { clearInterval(state.pacing.interval); state.pacing.interval = null; }
function updatePacingBar() {
    if (!state.pacing.questionStart) return;
    const elapsed = (Date.now() - state.pacing.questionStart) / 1000;
    const pct = Math.min((elapsed / state.currentQuestion.perfectTime) * 100, 100);
    const bar = document.getElementById('pacing-bar');
    bar.style.width = pct + '%';
    bar.classList.toggle('over-time', elapsed > state.currentQuestion.perfectTime);
}
function showPacingSummary(t) {
    const diff = state.currentQuestion.perfectTime - t;
    const el = document.getElementById('pacing-summary');
    el.style.display = 'block';
    el.className = diff >= 0 ? 'fast' : 'slow';
    el.textContent = diff >= 0 ? `⏱ ${t}s (Perfect: ${state.currentQuestion.perfectTime}s) — Saved ${diff}s!` : `⏱ ${t}s (Perfect: ${state.currentQuestion.perfectTime}s) — ${Math.abs(diff)}s over.`;
}

// ===== Click-to-Copy: wrap standalone numbers outside $$ blocks =====
function wrapCopyableNumbers(html) {
    // Split on LaTeX delimiters $$ ... $$ and \( ... \), wrap numbers only in plain text segments
    const parts = html.split(/(\$\$[\s\S]*?\$\$|\\\([\s\S]*?\\\))/g);
    return parts.map((part, i) => {
        if (i % 2 === 1) return part; // inside LaTeX — leave untouched
        // Only wrap standalone numbers (integers or decimals) not already inside tags
        return part.replace(/(?<![a-zA-Z#\-])(-?\b\d+(?:\.\d+)?\b)(?![a-zA-Z%])/g, (m) =>
            `<span class="copyable-num" title="Click to copy">${m}</span>`
        );
    }).join('');
}

// ===== History =====
function addToHistory(catId, catTitle, timeTaken, tries, perfectTime) {
    state.sessionStats.history.unshift({ catId, categoryTitle: catTitle, timeTaken, tries, perfectTime, fast: timeTaken <= perfectTime });
    if (state.sessionStats.history.length > 50) state.sessionStats.history.pop();
    renderHistory(); saveStorage();
}
function renderHistory() {
    const list = document.getElementById('history-list');
    const items = state.sessionStats.history.slice(0, 10);
    if (!items.length) { list.innerHTML = '<div style="font-size:0.75rem;color:var(--text-muted)">No questions solved yet.</div>'; return; }
    list.innerHTML = items.map(item => {
        const tryLabel = item.tries === 1 ? '1st try' : item.tries === 2 ? '2nd try' : `${item.tries} tries`;
        return `<div class="history-item ${item.fast ? 'h-fast' : 'h-slow'}"><div class="h-cat">${item.categoryTitle}</div><div class="h-meta">${item.timeTaken}s / ${item.perfectTime}s • ${tryLabel}</div></div>`;
    }).join('');
}

// ===== Attempt Dots =====
function renderAttemptDots() {
    document.getElementById('attempt-dots').innerHTML = [0,1,2].map(i =>
        `<div class="attempt-dot${i < state.currentQuestion.tries ? ' used' : ''}"></div>`
    ).join('');
}

// ===== Cross-out Mode =====
function toggleCrossOut() {
    state.crossOutMode = !state.crossOutMode;
    document.getElementById('crossout-btn').classList.toggle('active', state.crossOutMode);
    document.getElementById('question-box').classList.toggle('crossout-mode', state.crossOutMode);
}
function initCrossOut() {
    document.getElementById('question-box').addEventListener('click', e => {
        if (!state.crossOutMode) return;
        const word = e.target.closest('.crossout-word');
        if (word) word.classList.toggle('crossed');
    });
}
function wrapWordsForCrossOut(html) {
    // Wrap plain-text words (outside LaTeX) so they can be crossed out
    const parts = html.split(/(\$\$[\s\S]*?\$\$|\\\([\s\S]*?\\\)|<[^>]+>)/g);
    return parts.map((part, i) => {
        if (i % 2 === 1) return part;
        return part.replace(/\b([a-zA-Z]+)\b/g, '<span class="crossout-word">$1</span>');
    }).join('');
}

// ===== Flagging =====
function toggleFlag() {
    state.currentQuestion.flagged = !state.currentQuestion.flagged;
    const btn = document.getElementById('flag-btn');
    btn.textContent = state.currentQuestion.flagged ? '🚩' : '⚑';
    btn.classList.toggle('flagged', state.currentQuestion.flagged);
    if (state.currentQuestion.flagged) {
        const entry = { id: state.currentQuestion.id, title: state.currentQuestion.category?.title, rawText: state.currentQuestion.rawText, answer: state.currentQuestion.answer };
        if (!state.flaggedQuestions.find(f => f.rawText === entry.rawText)) state.flaggedQuestions.push(entry);
    } else {
        state.flaggedQuestions = state.flaggedQuestions.filter(f => f.rawText !== state.currentQuestion.rawText);
    }
    saveStorage();
}

// ===== Category Checkboxes =====
function populateCategoryCheckboxes() {
    const container = document.getElementById('category-selection');
    const saved = state.selectedCategories;
    container.innerHTML = categories.map(cat => `
        <div class="cat-item">
            <input type="checkbox" id="cat-${cat.id}" value="${cat.id}" ${(!saved || saved.includes(cat.id)) ? 'checked' : ''}>
            <label for="cat-${cat.id}">${cat.title}</label>
        </div>`).join('');
}

// ===== New Question =====
function newQuestion(fromFlagged = false) {
    let category, questionText, answer;

    if (fromFlagged || state.reviewingFlagged) {
        if (!state.flaggedQuestions.length) { alert('No flagged questions!'); state.reviewingFlagged = false; updateReviewBtn(); return; }
        const item = state.flaggedQuestions[Math.floor(Math.random() * state.flaggedQuestions.length)];
        category = categories.find(c => c.id === item.id);
        if (!category) { newQuestion(); return; }
        const gen = category.questionGenerator();
        questionText = gen.questionText; answer = gen.answer;
    } else {
        const checked = [...document.querySelectorAll('#category-selection input:checked')];
        if (!checked.length) { alert('Please select at least one category!'); return; }
        const categoryId = checked[Math.floor(Math.random() * checked.length)].value;
        category = categories.find(c => c.id === categoryId);
        if (!category) return;
        const gen = category.questionGenerator();
        questionText = gen.questionText; answer = gen.answer;
    }

    calculator.setBlank();
    state.crossOutMode = false;
    document.getElementById('crossout-btn').classList.remove('active');
    document.getElementById('question-box').classList.remove('crossout-mode');

    state.currentQuestion = { id: category.id, startTime: Date.now(), tries: 0, perfectTime: category.perfectTime || 90, answer, category, flagged: false, rawText: questionText };

    document.getElementById('current-category-title').textContent = category.title;
    document.getElementById('flag-btn').textContent = '⚑';
    document.getElementById('flag-btn').classList.remove('flagged');

    const qBox = document.getElementById('question-box');
    qBox.style.whiteSpace = category.id === 'Two points Non-linear' ? 'normal' : 'pre-wrap';
    const processed = wrapCopyableNumbers(wrapWordsForCrossOut(questionText));
    qBox.innerHTML = processed;
    MathJax.typeset([qBox]);

    // Bind copy clicks
    qBox.querySelectorAll('.copyable-num').forEach(span => {
        span.addEventListener('click', e => {
            e.stopPropagation();
            navigator.clipboard.writeText(span.textContent).catch(() => {});
            showCopyTooltip(span);
        });
    });

    ['answer-box','result','hint-text','pacing-summary','give-up-btn','show-desmos-btn','answer-preview'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (id === 'answer-box') { el.value = ''; el.className = ''; }
        else if (id === 'result') { el.textContent = ''; el.className = ''; }
        else if (id === 'hint-text' || id === 'give-up-btn' || id === 'show-desmos-btn') el.style.display = 'none';
        else if (id === 'pacing-summary') el.style.display = 'none';
        else if (id === 'answer-preview') { el.innerHTML = ''; el.className = 'answer-preview'; }
    });

    document.getElementById('tips-list').innerHTML = category.tips.map(t => `<li>${t}</li>`).join('');
    document.getElementById('show-explanation').dataset.imageSrc = category.explanationImage || '';
    renderAttemptDots();
    startPacingBar(state.currentQuestion.perfectTime);
    document.getElementById('answer-box').focus();
    saveStorage();
}

function showCopyTooltip(el) {
    const tip = document.createElement('div');
    tip.className = 'copy-tooltip';
    tip.textContent = 'Copied!';
    el.appendChild(tip);
    setTimeout(() => tip.remove(), 1200);
}

// ===== Answer Checking =====
function parseValue(str) {
    if (typeof str === 'number') return str;
    const s = String(str).trim();
    if (s.includes('/')) { const [n, d] = s.split('/'); const nv = parseFloat(n), dv = parseFloat(d); if (!isNaN(nv) && !isNaN(dv) && dv !== 0) return nv / dv; }
    const n = parseFloat(s); return isNaN(n) ? NaN : n;
}

function handleCheckAnswer() {
    if (state.currentQuestion.answer === null) return false;
    const box = document.getElementById('answer-box');
    const input = box.value.trim();
    if (!input) { setResult('❌ Please enter an answer.', false); return false; }
    const userVal = parseValue(input), correctVal = parseValue(state.currentQuestion.answer);
    if (isNaN(userVal) || isNaN(correctVal)) { setResult('❌ Invalid format. Enter a number or fraction.', false); return false; }
    const isCorrect = Math.abs(userVal - correctVal) < 1e-9;
    if (isCorrect) {
        const t = Math.round((Date.now() - state.currentQuestion.startTime) / 1000);
        stopPacingBar();
        document.getElementById('pacing-bar').style.width = '100%';
        box.classList.add('correct');
        setResult('✅ Correct!', true);
        playSound('correct');
        state.sessionStats.totalCorrect++;
        document.getElementById('correct-counter').textContent = `✅ ${state.sessionStats.totalCorrect} correct`;
        addToHistory(state.currentQuestion.id, state.currentQuestion.category.title, t, state.currentQuestion.tries + 1, state.currentQuestion.perfectTime);
        showPacingSummary(t);
        state.currentQuestion.answer = null;
        return true;
    } else {
        state.currentQuestion.tries++;
        box.classList.remove('correct'); box.classList.add('incorrect');
        renderAttemptDots();
        if (state.currentQuestion.tries === 1) { setResult('❌ Incorrect. Try again!', false); document.getElementById('give-up-btn').style.display = 'inline-block'; }
        else if (state.currentQuestion.tries === 2) { setResult('❌ Still incorrect.', false); document.getElementById('hint-text').style.display = 'block'; }
        else { playSound('wrong'); setResult(`❌ Answer: ${state.currentQuestion.answer}`, false); document.getElementById('show-desmos-btn').style.display = 'inline-block'; document.getElementById('give-up-btn').style.display = 'none'; state.currentQuestion.answer = null; }
        box.focus();
        return false;
    }
}

function setResult(msg, ok) { const el = document.getElementById('result'); el.textContent = msg; el.className = ok ? 'correct' : 'incorrect'; }

function giveUp() {
    stopPacingBar();
    setResult(`Answer: ${state.currentQuestion.answer}`, false);
    document.getElementById('show-desmos-btn').style.display = 'inline-block';
    document.getElementById('give-up-btn').style.display = 'none';
    const ht = document.getElementById('hint-text');
    ht.style.display = 'block'; ht.textContent = 'Check "Show Solved Example" for the method.';
    state.currentQuestion.answer = null;
}

// ===== Live Answer Preview (debounced) =====
let previewTimer = null;
function updateAnswerPreview(val) {
    clearTimeout(previewTimer);
    const prev = document.getElementById('answer-preview');
    if (!val.trim()) { prev.innerHTML = ''; return; }
    previewTimer = setTimeout(() => {
        try {
            prev.innerHTML = `\\(${val}\\)`;
            prev.className = 'answer-preview';
            MathJax.typeset([prev]);
        } catch(e) { prev.innerHTML = '<span style="color:var(--orange);font-size:0.78rem">Invalid syntax</span>'; prev.className = 'answer-preview invalid'; }
    }, 200);
}

// ===== Analytics Modal =====
function getMasteryLabel(accuracy, avgRatio) {
    if (accuracy >= 0.85 && avgRatio <= 1.1) return { label: 'Master', color: '#3fb950' };
    if (accuracy >= 0.7 && avgRatio <= 1.3) return { label: 'Pro', color: '#58a6ff' };
    if (accuracy >= 0.5) return { label: 'Intermediate', color: '#d29922' };
    return { label: 'Beginner', color: '#f85149' };
}
function heatColor(accuracy, avgRatio) {
    if (accuracy === undefined) return 'var(--surface2)';
    if (accuracy >= 0.8 && avgRatio <= 1.1) return 'rgba(63,185,80,0.35)';
    if (accuracy >= 0.6 && avgRatio <= 1.4) return 'rgba(88,166,255,0.25)';
    if (accuracy >= 0.4) return 'rgba(210,153,34,0.35)';
    return 'rgba(248,81,73,0.35)';
}
function openAnalytics() {
    const modal = document.getElementById('analytics-modal');
    const grid = document.getElementById('analytics-grid');
    const h = state.sessionStats.history;
    const stats = {};
    h.forEach(item => {
        if (!stats[item.catId]) stats[item.catId] = { title: item.categoryTitle, correct: 0, total: 0, timeSum: 0, perfSum: 0 };
        const s = stats[item.catId];
        s.total++; s.timeSum += item.timeTaken; s.perfSum += item.perfectTime;
        if (item.tries === 1 || (item.timeTaken <= item.perfectTime)) s.correct++;
    });
    if (!grid) return;
    if (!Object.keys(stats).length) { grid.innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1">Solve some questions first!</p>'; }
    else {
        grid.innerHTML = Object.values(stats).map(s => {
            const acc = s.correct / s.total;
            const ratio = s.total ? s.timeSum / s.perfSum : 1;
            const { label, color } = getMasteryLabel(acc, ratio);
            const bg = heatColor(acc, ratio);
            return `<div class="analytics-cell" style="background:${bg}">
                <div class="ac-title">${s.title}</div>
                <div class="ac-mastery" style="color:${color}">${label}</div>
                <div class="ac-stats">${Math.round(acc*100)}% acc • avg ${(s.total ? s.timeSum/s.total : 0).toFixed(0)}s / ${(s.total ? s.perfSum/s.total : 0).toFixed(0)}s</div>
                <div class="ac-count">${s.total} solved</div>
            </div>`;
        }).join('');
    }
    modal.classList.add('open');
}
function closeAnalytics() { document.getElementById('analytics-modal').classList.remove('open'); }

// ===== Flagged Review =====
function updateReviewBtn() {
    const btn = document.getElementById('review-flagged-btn');
    if (state.reviewingFlagged) { btn.textContent = '✖ Exit Review'; btn.classList.add('active'); }
    else { btn.textContent = `🚩 Review Flagged (${state.flaggedQuestions.length})`; btn.classList.remove('active'); }
}
function toggleReviewFlagged() {
    state.reviewingFlagged = !state.reviewingFlagged;
    updateReviewBtn();
    if (state.reviewingFlagged) newQuestion(true);
}

// ===== Test Mode =====
function startTest() {
    const n = parseInt(prompt('How many questions for the test?'));
    if (!n || n <= 0) return;
    const checked = document.querySelectorAll('#category-selection input:checked');
    if (!checked.length) { alert('Please select at least one category!'); return; }
    state.testMode = true; state.testCount = n; state.currentQuestionNum = 0;
    startStopwatch(); newQuestion();
}
function endTest(finished = false) {
    if (!state.testMode) return;
    stopStopwatch();
    const answered = finished ? state.testCount : state.currentQuestionNum;
    if (answered > 0) alert(`Test ended! ${answered} questions in ${state.stopwatch.elapsed}s — avg ${(state.stopwatch.elapsed/answered).toFixed(1)}s/q`);
    state.testMode = false; state.testCount = 0; state.currentQuestionNum = 0;
    newQuestion();
}

// ===== Sidebar =====
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('collapsed'); }

// ===== Explanation Modal =====
function showExplanation() {
    const src = document.getElementById('show-explanation').dataset.imageSrc;
    if (!src) { alert('Load a question first.'); return; }
    document.getElementById('explanation-modal-content').src = src;
    document.getElementById('explanation-modal').classList.add('open');
}
function closeExplanation() { document.getElementById('explanation-modal').classList.remove('open'); }

// ===== Resizer =====
function setupResizer() {
    const resizer = document.getElementById('resizer');
    const left = document.getElementById('left-panel');
    let dragging = false;
    // restore saved position
    left.style.width = state.resizerPct + '%';
    resizer.addEventListener('mousedown', () => { dragging = true; document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'; });
    document.addEventListener('mousemove', e => {
        if (!dragging) return;
        const rect = document.getElementById('split-pane').getBoundingClientRect();
        const pct = Math.max(25, Math.min(70, ((e.clientX - rect.left) / (rect.width - 5)) * 100));
        left.style.width = pct + '%';
        state.resizerPct = pct;
    });
    document.addEventListener('mouseup', () => { if (dragging) { dragging = false; document.body.style.cursor = ''; document.body.style.userSelect = ''; saveStorage(); } });
}

// ===== Keyboard Shortcuts =====
document.addEventListener('keydown', e => {
    const inInput = e.target === document.getElementById('answer-box');
    if (inInput) {
        if (e.key === 'Enter') { e.preventDefault(); const ok = handleCheckAnswer(); if (ok) { if (state.testMode) { state.currentQuestionNum++; state.currentQuestionNum >= state.testCount ? endTest(true) : newQuestion(); } else if (e.shiftKey) newQuestion(); } }
        return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') { e.preventDefault(); toggleDarkMode(); }
    if (e.key === 'Enter' && e.altKey) { e.preventDefault(); startTest(); }
    if (e.key === 'f' || e.key === 'F') toggleFlag();
    if (e.key === 'c' || e.key === 'C') toggleCrossOut();
});

// ===== Init =====
function initEventListeners() {
    document.getElementById('check-answer').addEventListener('click', handleCheckAnswer);
    document.getElementById('new-question').addEventListener('click', () => newQuestion());
    document.getElementById('start-test').addEventListener('click', startTest);
    document.getElementById('end-test').addEventListener('click', () => { if (confirm('End test?')) endTest(false); });
    document.getElementById('show-explanation').addEventListener('click', showExplanation);
    document.getElementById('close-modal').addEventListener('click', closeExplanation);
    document.getElementById('explanation-modal').addEventListener('click', e => { if (e.target.id === 'explanation-modal') closeExplanation(); });
    document.getElementById('close-analytics').addEventListener('click', closeAnalytics);
    document.getElementById('analytics-modal').addEventListener('click', e => { if (e.target.id === 'analytics-modal') closeAnalytics(); });
    document.getElementById('select-all').addEventListener('click', () => { document.querySelectorAll('#category-selection input').forEach(cb => cb.checked = true); saveStorage(); });
    document.getElementById('deselect-all').addEventListener('click', () => { document.querySelectorAll('#category-selection input').forEach(cb => cb.checked = false); saveStorage(); });
    document.getElementById('category-selection').addEventListener('change', saveStorage);
    document.getElementById('theme-toggle').addEventListener('click', toggleDarkMode);
    document.getElementById('mute-btn').addEventListener('click', toggleMute);
    document.getElementById('sidebar-toggle').addEventListener('click', toggleSidebar);
    document.getElementById('help-btn').addEventListener('click', () => { const p = document.getElementById('help-popup'); p.style.display = p.style.display === 'block' ? 'none' : 'block'; });
    document.getElementById('give-up-btn').addEventListener('click', giveUp);
    document.getElementById('show-desmos-btn').addEventListener('click', showExplanation);
    document.getElementById('clear-history').addEventListener('click', () => { state.sessionStats.history = []; renderHistory(); saveStorage(); });
    document.getElementById('stats-btn').addEventListener('click', openAnalytics);
    document.getElementById('flag-btn').addEventListener('click', toggleFlag);
    document.getElementById('crossout-btn').addEventListener('click', toggleCrossOut);
    document.getElementById('review-flagged-btn').addEventListener('click', toggleReviewFlagged);
    document.getElementById('answer-box').addEventListener('input', e => updateAnswerPreview(e.target.value));
    document.getElementById('clear-flagged').addEventListener('click', () => { state.flaggedQuestions = []; saveStorage(); updateReviewBtn(); alert('Flagged questions cleared.'); });
}

document.addEventListener('DOMContentLoaded', () => {
    loadStorage();
    applyTheme();
    applyMute();
    populateCategoryCheckboxes();
    renderHistory();
    initEventListeners();
    setupResizer();
    initCrossOut();
    updateReviewBtn();
    newQuestion();
});
