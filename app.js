// ===== Desmos Init =====
const elt = document.getElementById('calculator');
const calculator = Desmos.GraphingCalculator(elt, { keypad: true, expressions: true });

// ===== Cheat Sheet Data =====
const CHEAT_SHEET = [
    { title: 'Circle (Standard)', latex: '(x-h)^{2}+(y-k)^{2}=r^{2}' },
    { title: 'Circle (Expanded)', latex: 'x^{2}+y^{2}+ax+by+c=0' },
    { title: 'Vertex Form (Parabola)', latex: 'y=a(x-h)^{2}+k' },
    { title: 'Quadratic Standard', latex: 'y=ax^{2}+bx+c' },
    { title: 'Linear Regression', latex: 'y_{1}\\sim mx_{1}+b' },
    { title: 'Quadratic Regression', latex: 'y_{1}\\sim ax_{1}^{2}+bx_{1}+c' },
    { title: 'Exponential Regression', latex: 'y_{1}\\sim ab^{x_{1}}' },
    { title: 'Exponential Growth/Decay', latex: 'y=a\\cdot b^{x}' },
    { title: 'System of Equations', latex: 'y=mx+b' },
    { title: 'Power Regression', latex: 'y_{1}\\sim ax_{1}^{b}' },
];

// ===== State =====
const state = {
    currentQuestion: { id: null, startTime: null, tries: 0, perfectTime: 60, answer: null, category: null, flagged: false, rawText: '' },
    sessionStats: { totalCorrect: 0, history: [] },
    stopwatch: { interval: null, elapsed: 0 },
    pacing: { interval: null, questionStart: null },
    testMode: false, testCount: 0, currentQuestionNum: 0,
    testSessionHistory: [], giveUpCount: 0,
    darkMode: true, muted: false, crossOutMode: false,
    resizerPct: 48, flaggedQuestions: [], reviewingFlagged: false,
    hardMode: false, focusMode: false,
    streak: 0, mcMode: true, mcChoices: [],
};

// ===== Web Audio =====
function playSound(type) {
    if (state.muted) return;
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator(), gain = ctx.createGain();
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
        if (typeof data.hardMode === 'boolean') state.hardMode = data.hardMode;
        if (typeof data.focusMode === 'boolean') state.focusMode = data.focusMode;
        if (typeof data.mcMode === 'boolean') state.mcMode = data.mcMode;
        return Object.keys(data).length > 0;
    } catch(e) { return false; }
}
function saveStorage() {
    const checked = [...document.querySelectorAll('#category-selection input:checked')].map(cb => cb.value);
    localStorage.setItem('desmosTrainer', JSON.stringify({
        selectedCategories: checked, history: state.sessionStats.history.slice(-50),
        darkMode: state.darkMode, muted: state.muted, resizerPct: state.resizerPct,
        flaggedQuestions: state.flaggedQuestions.slice(-50),
        hardMode: state.hardMode, focusMode: state.focusMode, mcMode: state.mcMode,
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

// ===== Focus Mode =====
function applyFocusMode() {
    document.body.classList.toggle('focus-mode', state.focusMode);
    const btn = document.getElementById('focus-exit');
    if (btn) btn.style.display = state.focusMode ? 'flex' : 'none';
}
function toggleFocusMode() { state.focusMode = !state.focusMode; applyFocusMode(); saveStorage(); }

// ===== Hard Mode =====
function applyHardMode() {
    const btn = document.getElementById('hard-mode-toggle');
    if (btn) { btn.classList.toggle('active', state.hardMode); btn.textContent = state.hardMode ? '🔥 Hard ON' : '🔥 Hard Mode'; }
    const cheatBtn = document.getElementById('cheat-btn');
    if (cheatBtn) cheatBtn.disabled = state.hardMode;
    if (state.hardMode && document.getElementById('cheat-drawer').classList.contains('open')) showCheatSheet(false);
}
function toggleHardMode() { state.hardMode = !state.hardMode; applyHardMode(); saveStorage(); }

// ===== Streak =====
function updateStreak(increment) {
    if (increment) { state.streak++; } else { state.streak = 0; }
    const el = document.getElementById('streak-counter');
    if (!el) return;
    el.textContent = `🔥 ${state.streak}`;
    el.style.opacity = state.streak > 0 ? '1' : '0.4';
    el.style.textShadow = state.streak >= 5 ? '0 0 10px var(--accent-cyan)' : state.streak >= 3 ? '0 0 6px var(--accent-cyan)' : 'none';
    el.classList.toggle('streak-hot', state.streak >= 3);
}

// ===== Stopwatch =====
function startStopwatch() {
    state.stopwatch.elapsed = 0; updateStopwatchDisplay();
    if (state.stopwatch.interval) clearInterval(state.stopwatch.interval);
    state.stopwatch.interval = setInterval(() => { state.stopwatch.elapsed++; updateStopwatchDisplay(); }, 1000);
}
function stopStopwatch() { if (state.stopwatch.interval) { clearInterval(state.stopwatch.interval); state.stopwatch.interval = null; } }
function updateStopwatchDisplay() {
    const s = state.stopwatch.elapsed;
    document.getElementById('stopwatch').textContent = `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
}

// ===== Pacing Bar =====
function startPacingBar() {
    state.pacing.questionStart = Date.now();
    if (state.pacing.interval) clearInterval(state.pacing.interval);
    state.pacing.interval = setInterval(updatePacingBar, 500);
    updatePacingBar();
}
function stopPacingBar() { if (state.pacing.interval) { clearInterval(state.pacing.interval); state.pacing.interval = null; } }
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
    el.style.display = 'block'; el.className = diff >= 0 ? 'fast' : 'slow';
    el.textContent = diff >= 0 ? `⏱ ${t}s (Perfect: ${state.currentQuestion.perfectTime}s) — Saved ${diff}s!` : `⏱ ${t}s (Perfect: ${state.currentQuestion.perfectTime}s) — ${Math.abs(diff)}s over.`;
}

// ===== Smart Distractors =====
function generateDistractors(answer) {
    const val = parseValue(answer);
    const str = String(answer).trim();
    const isFrac = str.includes('/');
    const isInt = !isFrac && Number.isInteger(val);
    const decPlaces = (!isFrac && !isInt) ? Math.max(1, (str.split('.')[1] || '').length) : 0;

    const fmt = (n) => {
        if (isFrac) {
            const denom = parseInt(str.split('/')[1]) || 1;
            return `${Math.round(n * denom)}/${denom}`;
        }
        if (isInt) return String(Math.round(n));
        return n.toFixed(decPlaces);
    };

    const step = isInt ? 1 : Math.pow(10, -decPlaces);
    const deltas = [1, -1, 2, -2, 3, -3, 4, -4, 5, -5];
    const seen = new Set([fmt(val)]);
    const distractors = [];
    for (const d of deltas) {
        if (distractors.length >= 3) break;
        const cand = fmt(val + d * step);
        if (!seen.has(cand)) { seen.add(cand); distractors.push(cand); }
    }

    const choices = [str, ...distractors];
    for (let i = choices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [choices[i], choices[j]] = [choices[j], choices[i]];
    }
    return choices;
}

// ===== Multiple Choice UI =====
const MC_LABELS = ['A', 'B', 'C', 'D'];
function renderMCChoices(choices) {
    state.mcChoices = choices;
    const grid = document.getElementById('mc-grid');
    const answerRow = document.getElementById('answer-row');
    const preview = document.getElementById('answer-preview');
    grid.innerHTML = '';
    if (state.mcMode) {
        answerRow.style.display = 'none';
        preview.style.display = 'none';
        grid.style.display = 'grid';
        choices.forEach((choice, i) => {
            const btn = document.createElement('button');
            btn.className = 'mc-btn';
            btn.dataset.value = choice;
            btn.dataset.index = i;
            btn.innerHTML = `<span class="mc-label">${MC_LABELS[i]}</span><span class="mc-val">\\(${choice}\\)</span>`;
            btn.addEventListener('click', () => handleMCAnswer(choice, btn));
            grid.appendChild(btn);
        });
        MathJax.typeset([grid]);
    } else {
        answerRow.style.display = 'flex';
        preview.style.display = '';
        grid.style.display = 'none';
        document.getElementById('answer-box').focus();
    }
}

function handleMCAnswer(choice, btnEl) {
    if (state.currentQuestion.answer === null) return;
    const cv = parseValue(state.currentQuestion.answer);
    const uv = parseValue(choice);
    const isCorrect = Math.abs(uv - cv) < 1e-9;

    if (isCorrect) {
        btnEl.classList.add('mc-correct');
        document.querySelectorAll('.mc-btn').forEach(b => {
            b.disabled = true;
            if (b !== btnEl) {
                b.classList.add('mc-incorrect');
            }
        });
        const t = Math.round((Date.now() - state.currentQuestion.startTime) / 1000);
        stopPacingBar(); document.getElementById('pacing-bar').style.width = '100%';
        setResult('✅ Correct!', true); playSound('correct');
        updateStreak(true);
        state.sessionStats.totalCorrect++;
        document.getElementById('correct-counter').textContent = `✅ ${state.sessionStats.totalCorrect} correct`;
        addToHistory(state.currentQuestion.id, state.currentQuestion.category.title, t, state.currentQuestion.tries + 1, state.currentQuestion.perfectTime);
        showPacingSummary(t); state.currentQuestion.answer = null;
        // trigger next if test mode
        if (state.testMode) {
            state.currentQuestionNum++;
            setTimeout(() => { state.currentQuestionNum >= state.testCount ? endTest(true) : newQuestion(); }, 800);
        }
    } else {
        btnEl.classList.add('mc-wrong');
        btnEl.disabled = true;
        state.currentQuestion.tries++;
        renderAttemptDots();
        updateStreak(false);
        if (state.currentQuestion.tries === 1) { setResult('❌ Incorrect. Try again!', false); document.getElementById('give-up-btn').style.display = 'inline-block'; }
        else if (state.currentQuestion.tries === 2) { setResult('❌ Still incorrect. One more try.', false); const ht2 = document.getElementById('hint-text'); ht2.textContent = 'Check the sidebar tips for a hint.'; ht2.style.display = 'block'; }
        else {
            playSound('wrong');
            // reveal correct
            document.querySelectorAll('.mc-btn').forEach(b => {
                b.disabled = true;
                if (Math.abs(parseValue(b.dataset.value) - cv) < 1e-9) b.classList.add('mc-correct');
            });
            if (!state.hardMode) document.getElementById('show-desmos-btn').style.display = 'inline-block';
            document.getElementById('give-up-btn').style.display = 'none';
            setResult(`❌ Answer: ${state.currentQuestion.answer}`, false);
            state.currentQuestion.answer = null;
        }
    }
}

// ===== MC Mode Toggle =====
function applyMCMode() {
    const toggle = document.getElementById('mc-mode-toggle');
    if (toggle) { toggle.classList.toggle('active', state.mcMode); toggle.textContent = state.mcMode ? '🔢 MC: ON' : '🔢 MC: OFF'; }
}
function toggleMCMode() { state.mcMode = !state.mcMode; applyMCMode(); saveStorage(); newQuestion(); }

// ===== Click-to-Copy =====
function wrapCopyableNumbers(html) {
    const parts = html.split(/(\$\$[\s\S]*?\$\$|\\\([\s\S]*?\\\))/g);
    return parts.map((part, i) => {
        if (i % 2 === 1) return part;
        return part.replace(/(?<![a-zA-Z#\-])(-?\b\d+(?:\.\d+)?\b)(?![a-zA-Z%])/g, m =>
            `<span class="copyable-num" title="Click to copy">${m}</span>`);
    }).join('');
}

// ===== History =====
function addToHistory(catId, catTitle, timeTaken, tries, perfectTime) {
    const trophy = state.hardMode ? ' 🏆' : '';
    const entry = { catId, categoryTitle: catTitle + trophy, timeTaken, tries, perfectTime, fast: timeTaken <= perfectTime };
    state.sessionStats.history.unshift(entry);
    if (state.sessionStats.history.length > 50) state.sessionStats.history.pop();
    if (state.testMode) state.testSessionHistory.push({ catId, categoryTitle: catTitle, timeTaken, tries, perfectTime, fast: timeTaken <= perfectTime });
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
        `<div class="attempt-dot${i < state.currentQuestion.tries ? ' used' : ''}"></div>`).join('');
}

// ===== Cross-out =====
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
        const entry = { id: state.currentQuestion.id, title: state.currentQuestion.category?.title, rawText: state.currentQuestion.rawText, tips: state.currentQuestion.category?.tips || [] };
        if (!state.flaggedQuestions.find(f => f.rawText === entry.rawText)) state.flaggedQuestions.push(entry);
    } else {
        state.flaggedQuestions = state.flaggedQuestions.filter(f => f.rawText !== state.currentQuestion.rawText);
    }
    updateReviewBtn(); saveStorage();
}

// ===== Export Study Pack =====
function exportStudyPack() {
    if (!state.flaggedQuestions.length) { alert('No flagged questions to export!'); return; }
    const rows = state.flaggedQuestions.map((q, i) => `
        <div class="q-block">
            <div class="q-num">Question ${i+1} — ${q.title || 'Unknown Category'}</div>
            <div class="q-text">${q.rawText}</div>
            ${q.tips?.length ? `<div class="q-tips"><strong>Tips:</strong><ul>${q.tips.map(t => `<li>${t}</li>`).join('')}</ul></div>` : ''}
        </div>`).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>SAT Study Pack</title>
    <script type="text/javascript" id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"><\/script>
    <style>body{font-family:system-ui,sans-serif;max-width:800px;margin:40px auto;padding:0 20px;color:#222}
    h1{color:#7c4dff;margin-bottom:4px}p.sub{color:#666;font-size:0.85rem;margin-bottom:32px}
    .q-block{border:1px solid #ddd;border-radius:8px;padding:16px 20px;margin-bottom:20px;page-break-inside:avoid}
    .q-num{font-size:0.75rem;text-transform:uppercase;letter-spacing:0.06em;color:#7c4dff;font-weight:700;margin-bottom:8px}
    .q-text{font-size:1.05rem;line-height:1.6;white-space:pre-wrap;margin-bottom:10px}
    .q-tips{font-size:0.85rem;color:#555}ul{margin:4px 0 0 16px}li{margin-bottom:3px}
    @media print{body{margin:20px}}</style></head><body>
    <h1>SAT Desmos Study Pack</h1><p class="sub">Exported ${new Date().toLocaleDateString()} • ${state.flaggedQuestions.length} flagged question(s)</p>
    ${rows}</body></html>`;
    const win = window.open('', '_blank');
    win.document.write(html); win.document.close();
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

    // Hard mode: reduce perfect time by 20%
    const effectivePerfectTime = state.hardMode ? Math.round((category.perfectTime || 90) * 0.8) : (category.perfectTime || 90);

    calculator.setBlank();
    state.crossOutMode = false;
    document.getElementById('crossout-btn').classList.remove('active');
    document.getElementById('question-box').classList.remove('crossout-mode');

    state.currentQuestion = { id: category.id, startTime: Date.now(), tries: 0, perfectTime: effectivePerfectTime, answer, category, flagged: false, rawText: questionText };

    document.getElementById('current-category-title').textContent = category.title + (state.hardMode ? ' 🔥' : '');
    document.getElementById('flag-btn').textContent = '⚑';
    document.getElementById('flag-btn').classList.remove('flagged');

    const qBox = document.getElementById('question-box');
    qBox.style.whiteSpace = category.id === 'Two points Non-linear' ? 'normal' : 'pre-wrap';
    qBox.innerHTML = wrapCopyableNumbers(wrapWordsForCrossOut(questionText));
    MathJax.typeset([qBox]);
    qBox.querySelectorAll('.copyable-num').forEach(span => {
        span.addEventListener('click', e => { e.stopPropagation(); navigator.clipboard.writeText(span.textContent).catch(() => {}); showCopyTooltip(span); });
    });

    // Full state reset
    const answerBox = document.getElementById('answer-box');
    answerBox.value = ''; answerBox.className = '';
    const result = document.getElementById('result'); result.textContent = ''; result.className = '';
    const hint = document.getElementById('hint-text'); hint.style.display = 'none'; hint.textContent = '';
    document.getElementById('pacing-summary').style.display = 'none';
    document.getElementById('give-up-btn').style.display = 'none';
    document.getElementById('show-desmos-btn').style.display = 'none';
    const prev = document.getElementById('answer-preview'); prev.innerHTML = ''; prev.className = 'answer-preview';
    document.getElementById('attempt-dots').innerHTML = '';

    document.getElementById('tips-list').innerHTML = category.tips.map(t => `<li>${t}</li>`).join('');
    document.getElementById('show-explanation').dataset.imageSrc = category.explanationImage || '';
    // Hard mode: hide solution button
    document.getElementById('show-explanation').style.display = state.hardMode ? 'none' : '';

    renderAttemptDots();
    renderMCChoices(generateDistractors(answer));
    startPacingBar();
    if (!state.mcMode) answerBox.focus();
    saveStorage();
}

function showCopyTooltip(el) {
    const tip = document.createElement('div');
    tip.className = 'copy-tooltip'; tip.textContent = 'Copied!';
    el.appendChild(tip); setTimeout(() => tip.remove(), 1200);
}

// ===== Answer Checking (text mode) =====
function parseValue(str) {
    if (typeof str === 'number') return str;
    const s = String(str).trim();
    if (s.includes('/')) { const [n,d] = s.split('/'); const nv=parseFloat(n),dv=parseFloat(d); if (!isNaN(nv)&&!isNaN(dv)&&dv!==0) return nv/dv; }
    const n = parseFloat(s); return isNaN(n) ? NaN : n;
}

function handleCheckAnswer() {
    if (state.currentQuestion.answer === null) return false;
    const box = document.getElementById('answer-box');
    const input = box.value.trim();
    if (!input) { setResult('❌ Please enter an answer.', false); return false; }
    const uv = parseValue(input), cv = parseValue(state.currentQuestion.answer);
    if (isNaN(uv) || isNaN(cv)) { setResult('❌ Invalid format. Enter a number or fraction.', false); return false; }
    if (Math.abs(uv - cv) < 1e-9) {
        const t = Math.round((Date.now() - state.currentQuestion.startTime) / 1000);
        stopPacingBar(); document.getElementById('pacing-bar').style.width = '100%';
        box.classList.add('correct'); setResult('✅ Correct!', true); playSound('correct');
        updateStreak(true);
        state.sessionStats.totalCorrect++;
        document.getElementById('correct-counter').textContent = `✅ ${state.sessionStats.totalCorrect} correct`;
        addToHistory(state.currentQuestion.id, state.currentQuestion.category.title, t, state.currentQuestion.tries + 1, state.currentQuestion.perfectTime);
        showPacingSummary(t); state.currentQuestion.answer = null;
        return true;
    } else {
        state.currentQuestion.tries++;
        box.classList.remove('correct'); box.classList.add('incorrect');
        renderAttemptDots(); updateStreak(false);
        if (state.currentQuestion.tries === 1) { setResult('❌ Incorrect. Try again!', false); document.getElementById('give-up-btn').style.display = 'inline-block'; }
        else if (state.currentQuestion.tries === 2) { setResult('❌ Still incorrect.', false); document.getElementById('hint-text').style.display = 'block'; }
        else {
            playSound('wrong');
            setResult(`❌ Answer: ${state.currentQuestion.answer}`, false);
            if (!state.hardMode) document.getElementById('show-desmos-btn').style.display = 'inline-block';
            document.getElementById('give-up-btn').style.display = 'none';
            state.currentQuestion.answer = null;
        }
        box.focus(); return false;
    }
}
function setResult(msg, ok) { const el = document.getElementById('result'); el.textContent = msg; el.className = ok ? 'correct' : 'incorrect'; }

function giveUp() {
    stopPacingBar(); state.giveUpCount++; updateStreak(false);
    setResult(`Answer: ${state.currentQuestion.answer}`, false);
    if (!state.hardMode) document.getElementById('show-desmos-btn').style.display = 'inline-block';
    document.getElementById('give-up-btn').style.display = 'none';
    const ht = document.getElementById('hint-text'); ht.style.display = 'block'; ht.textContent = 'Check "Show Solved Example" for the method.';
    state.currentQuestion.answer = null;
}

// ===== Live Answer Preview =====
let previewTimer = null;
function updateAnswerPreview(val) {
    clearTimeout(previewTimer);
    const prev = document.getElementById('answer-preview');
    if (!val.trim()) { prev.innerHTML = ''; return; }
    previewTimer = setTimeout(() => {
        try { prev.innerHTML = `\\(${val}\\)`; prev.className = 'answer-preview'; MathJax.typeset([prev]); }
        catch(e) { prev.innerHTML = '<span style="color:var(--neon-red);font-size:0.78rem">Invalid syntax</span>'; prev.className = 'answer-preview invalid'; }
    }, 250);
}

// ===== Analytics =====
function getMasteryLabel(acc, ratio) {
    if (acc >= 0.85 && ratio <= 1.1) return { label: 'Master', color: 'var(--accent-cyan)' };
    if (acc >= 0.7 && ratio <= 1.3) return { label: 'Pro', color: 'var(--accent-violet)' };
    if (acc >= 0.5) return { label: 'Intermediate', color: 'var(--orange)' };
    return { label: 'Beginner', color: 'var(--neon-red)' };
}
function heatColor(acc, ratio) {
    if (acc === undefined) return 'var(--surface2)';
    if (acc >= 0.8 && ratio <= 1.1) return 'rgba(0,229,255,0.15)';
    if (acc >= 0.6 && ratio <= 1.4) return 'rgba(124,77,255,0.15)';
    if (acc >= 0.4) return 'rgba(255,109,0,0.15)';
    return 'rgba(255,23,68,0.15)';
}
function openAnalytics() {
    const grid = document.getElementById('analytics-grid');
    const h = state.sessionStats.history;
    const stats = {};
    h.forEach(item => {
        const id = item.catId || item.categoryTitle;
        if (!stats[id]) stats[id] = { title: item.categoryTitle.replace(' 🏆',''), correct: 0, total: 0, timeSum: 0, perfSum: 0 };
        const s = stats[id]; s.total++; s.timeSum += item.timeTaken; s.perfSum += item.perfectTime;
        if (item.tries === 1 || item.timeTaken <= item.perfectTime) s.correct++;
    });
    if (!Object.keys(stats).length) { grid.innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1">Solve some questions first!</p>'; }
    else {
        grid.innerHTML = Object.values(stats).map(s => {
            const acc = s.correct / s.total, ratio = s.timeSum / s.perfSum;
            const { label, color } = getMasteryLabel(acc, ratio);
            return `<div class="analytics-cell" style="background:${heatColor(acc,ratio)}">
                <div class="ac-title">${s.title}</div>
                <div class="ac-mastery" style="color:${color}">${label}</div>
                <div class="ac-stats">${Math.round(acc*100)}% acc • avg ${(s.timeSum/s.total).toFixed(0)}s / ${(s.perfSum/s.total).toFixed(0)}s</div>
                <div class="ac-count">${s.total} solved</div></div>`;
        }).join('');
    }
    document.getElementById('analytics-modal').classList.add('open');
}
function closeAnalytics() { document.getElementById('analytics-modal').classList.remove('open'); }

// ===== Cheat Sheet =====
function renderCheatSheet(filter = '') {
    const q = filter.toLowerCase();
    const list = CHEAT_SHEET.filter(f => !q || f.title.toLowerCase().includes(q));
    const container = document.getElementById('cheat-list');
    if (!list.length) { container.innerHTML = '<div style="color:var(--text-muted);font-size:0.8rem">No matches.</div>'; return; }
    container.innerHTML = list.map(f => `
        <div class="cheat-item">
            <div class="cheat-title">${f.title}</div>
            <div class="cheat-latex">\\(${f.latex}\\)</div>
            <button class="btn" style="font-size:0.72rem;padding:3px 10px;margin-top:6px" onclick="injectFormula('${f.latex.replace(/'/g,"\\'")}')">→ Desmos</button>
        </div>`).join('');
    MathJax.typeset([container]);
}
function injectFormula(latex) { calculator.setExpression({ id: String(Date.now()), latex }); showCheatSheet(false); }
function showCheatSheet(open = true) {
    if (open && state.hardMode) return;
    const drawer = document.getElementById('cheat-drawer');
    drawer.classList.toggle('open', open);
    if (open) { document.getElementById('cheat-search').value = ''; renderCheatSheet(); document.getElementById('cheat-search').focus(); }
}

// ===== Test Report Card =====
function calcTestGrade(answered, correct, totalTime, totalPerfect, giveUps) {
    const acc = answered ? correct / answered : 0;
    if (acc === 1 && totalTime < totalPerfect) return { grade: 'A', color: 'var(--accent-cyan)', label: 'Perfect — Fast & Accurate!' };
    if (acc === 1) return { grade: 'B', color: 'var(--accent-violet)', label: 'All correct, but a bit slow.' };
    if (acc >= 0.8) return { grade: 'C', color: 'var(--orange)', label: 'Good — review your mistakes.' };
    if (acc >= 0.7 && giveUps < 2) return { grade: 'D', color: 'var(--neon-red)', label: 'Needs improvement.' };
    return { grade: 'F', color: 'var(--neon-red)', label: "Keep practicing — you'll get there!" };
}
function showReportCard(answered, correct, totalTime, totalPerfect) {
    const giveUps = state.giveUpCount;
    const { grade, color, label } = calcTestGrade(answered, correct, totalTime, totalPerfect, giveUps);
    const catStats = {};
    state.testSessionHistory.forEach(item => {
        if (!catStats[item.catId]) catStats[item.catId] = { title: item.categoryTitle, timeSum: 0, total: 0, correct: 0, perfSum: 0 };
        const s = catStats[item.catId]; s.total++; s.timeSum += item.timeTaken; s.perfSum += item.perfectTime;
        if (item.tries === 1 || item.timeTaken <= item.perfectTime) s.correct++;
    });
    const catArr = Object.values(catStats);
    let weakest = null, strongest = null;
    catArr.forEach(s => {
        const ratio = s.timeSum / (s.perfSum || 1);
        if (!weakest || ratio > weakest.ratio) weakest = { ...s, ratio };
        if (!strongest || ratio < strongest.ratio) strongest = { ...s, ratio };
    });
    const actionPlan = weakest && weakest.ratio > 1.05 ? `Focus on <strong>${weakest.title}</strong> — you're ${Math.round((weakest.ratio - 1) * (weakest.perfSum / weakest.total))}s slower than target pace.` : answered ? 'Great pacing overall! Keep it up.' : '';
    document.getElementById('rc-grade').textContent = grade;
    document.getElementById('rc-grade').style.color = color;
    document.getElementById('rc-label').textContent = label;
    document.getElementById('rc-stats').innerHTML = `
        <div class="rc-row"><span>Questions</span><strong>${answered}</strong></div>
        <div class="rc-row"><span>Correct</span><strong>${correct} / ${answered}</strong></div>
        <div class="rc-row"><span>Accuracy</span><strong>${answered ? Math.round((correct/answered)*100) : 0}%</strong></div>
        <div class="rc-row"><span>Total Time</span><strong>${totalTime}s</strong></div>
        <div class="rc-row"><span>Perfect Time</span><strong>${totalPerfect}s</strong></div>
        <div class="rc-row"><span>Give Ups</span><strong>${giveUps}</strong></div>
        ${strongest && strongest !== weakest ? `<div class="rc-row"><span>Strongest</span><strong style="color:var(--accent-cyan)">${strongest.title}</strong></div>` : ''}
        ${weakest ? `<div class="rc-row"><span>Weakest</span><strong style="color:var(--neon-red)">${weakest.title}</strong></div>` : ''}`;
    document.getElementById('rc-action').innerHTML = actionPlan;
    document.getElementById('report-modal').classList.add('open');
}

// ===== Flagged Review =====
function updateReviewBtn() {
    const btn = document.getElementById('review-flagged-btn');
    if (state.reviewingFlagged) { btn.textContent = '✖ Exit Review'; btn.classList.add('active'); }
    else { btn.textContent = `🚩 Review Flagged (${state.flaggedQuestions.length})`; btn.classList.remove('active'); }
}
function toggleReviewFlagged() { state.reviewingFlagged = !state.reviewingFlagged; updateReviewBtn(); if (state.reviewingFlagged) newQuestion(true); }

// ===== Test Mode =====
function startTest() {
    const n = parseInt(prompt('How many questions for the test?'));
    if (!n || n <= 0) return;
    const checked = document.querySelectorAll('#category-selection input:checked');
    if (!checked.length) { alert('Please select at least one category!'); return; }
    state.testMode = true; state.testCount = n; state.currentQuestionNum = 0;
    state.testSessionHistory = []; state.giveUpCount = 0;
    startStopwatch(); newQuestion();
}
function endTest(finished = false) {
    if (!state.testMode) return;
    stopStopwatch();
    const answered = finished ? state.testCount : state.currentQuestionNum;
    const correct = state.testSessionHistory.filter(h => h.tries === 1 || h.timeTaken <= h.perfectTime).length;
    const totalTime = state.stopwatch.elapsed;
    const totalPerfect = state.testSessionHistory.reduce((sum, h) => sum + h.perfectTime, 0);
    state.testMode = false; state.testCount = 0; state.currentQuestionNum = 0;
    if (answered > 0) { showReportCard(answered, correct, totalTime, totalPerfect); return; }
    newQuestion();
}

// ===== Sidebar =====
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('collapsed'); }

// ===== Explanation Modal =====
function showExampleSolution() {
    if (state.hardMode) return;
    const src = document.getElementById('show-explanation').dataset.imageSrc;
    if (!src) { alert('Load a question first.'); return; }
    document.getElementById('explanation-modal-content').src = src;
    document.getElementById('explanation-modal').classList.add('open');
}

function handleShowDesmosSolution() {
    if (state.hardMode) return;
    if (!state.currentQuestion.category || !state.currentQuestion.category.desmosSolution) {
        alert('No Desmos solution available for this question.');
        return;
    }
    
    // Clear existing expressions first
    calculator.setBlank();
    
    // Inject the solution expressions
    state.currentQuestion.category.desmosSolution.forEach((latex, index) => {
        calculator.setExpression({ 
            id: 'sol-' + index, 
            latex: latex, 
            color: '#7c4dff' 
        });
    });
}
function closeExplanation() { document.getElementById('explanation-modal').classList.remove('open'); }

// ===== Help Modal =====
function openHelp() { document.getElementById('help-modal').classList.add('open'); }
function closeHelp() { document.getElementById('help-modal').classList.remove('open'); }

// ===== Resizer (with Desmos sync) =====
function setupResizer() {
    const resizer = document.getElementById('resizer'), left = document.getElementById('left-panel');
    let dragging = false;
    left.style.width = state.resizerPct + '%';
    resizer.addEventListener('mousedown', () => { dragging = true; document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'; });
    document.addEventListener('mousemove', e => {
        if (!dragging) return;
        const rect = document.getElementById('split-pane').getBoundingClientRect();
        const pct = Math.max(25, Math.min(70, ((e.clientX - rect.left) / (rect.width - 5)) * 100));
        left.style.width = pct + '%'; state.resizerPct = pct;
        calculator.resize(); // prevent Desmos viewport glitch
    });
    document.addEventListener('mouseup', () => { if (dragging) { dragging = false; document.body.style.cursor = ''; document.body.style.userSelect = ''; saveStorage(); } });
}

// ===== Tutorial =====
function showTutorial() { document.getElementById('tutorial-overlay').classList.add('open'); }
function closeTutorial() { document.getElementById('tutorial-overlay').classList.remove('open'); }

// ===== Keyboard Shortcuts =====
document.addEventListener('keydown', e => {
    const inInput = ['answer-box','cheat-search'].includes(e.target.id);
    if (e.target.id === 'answer-box') {
        if (e.key === 'Enter') { e.preventDefault(); const ok = handleCheckAnswer(); if (ok) { if (state.testMode) { state.currentQuestionNum++; state.currentQuestionNum >= state.testCount ? endTest(true) : newQuestion(); } else if (e.shiftKey) newQuestion(); } }
        return;
    }
    if (inInput) return;
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') { e.preventDefault(); toggleDarkMode(); }
    if (e.key === 'Enter' && e.altKey) { e.preventDefault(); startTest(); }
    if (e.key === 'f' || e.key === 'F') toggleFlag();
    if (e.key === 'c' || e.key === 'C') toggleCrossOut();
    if (e.key === 'h' || e.key === 'H') showCheatSheet(!document.getElementById('cheat-drawer').classList.contains('open'));
    if (e.key === 'z' || e.key === 'Z') toggleFocusMode();
    if (state.mcMode && ['1','2','3','4'].includes(e.key)) {
        const idx = parseInt(e.key) - 1;
        const btns = document.querySelectorAll('.mc-btn:not(:disabled)');
        if (btns[idx]) btns[idx].click();
    }
    if (e.key === 'Escape') {
        showCheatSheet(false);
        ['analytics-modal','report-modal','explanation-modal','help-modal','tutorial-overlay'].forEach(id => document.getElementById(id)?.classList.remove('open'));
        if (state.focusMode) toggleFocusMode();
    }
});

// ===== Init =====
function initEventListeners() {
    document.getElementById('check-answer').addEventListener('click', handleCheckAnswer);
    document.getElementById('new-question').addEventListener('click', () => newQuestion());
    document.getElementById('start-test').addEventListener('click', startTest);
    document.getElementById('end-test').addEventListener('click', () => { if (confirm('End test?')) endTest(false); });
    document.getElementById('show-explanation').addEventListener('click', showExampleSolution);
    document.getElementById('close-modal').addEventListener('click', closeExplanation);
    document.getElementById('explanation-modal').addEventListener('click', e => { if (e.target.id === 'explanation-modal') closeExplanation(); });
    document.getElementById('close-analytics').addEventListener('click', closeAnalytics);
    document.getElementById('analytics-modal').addEventListener('click', e => { if (e.target.id === 'analytics-modal') closeAnalytics(); });
    document.getElementById('close-report').addEventListener('click', () => { document.getElementById('report-modal').classList.remove('open'); newQuestion(); });
    document.getElementById('report-modal').addEventListener('click', e => { if (e.target.id === 'report-modal') { document.getElementById('report-modal').classList.remove('open'); newQuestion(); } });
    document.getElementById('help-btn').addEventListener('click', openHelp);
    document.getElementById('close-help').addEventListener('click', closeHelp);
    document.getElementById('help-modal').addEventListener('click', e => { if (e.target.id === 'help-modal') closeHelp(); });
    document.getElementById('select-all').addEventListener('click', () => { document.querySelectorAll('#category-selection input').forEach(cb => cb.checked = true); saveStorage(); });
    document.getElementById('deselect-all').addEventListener('click', () => { document.querySelectorAll('#category-selection input').forEach(cb => cb.checked = false); saveStorage(); });
    document.getElementById('category-selection').addEventListener('change', saveStorage);
    document.getElementById('theme-toggle').addEventListener('click', toggleDarkMode);
    document.getElementById('mute-btn').addEventListener('click', toggleMute);
    document.getElementById('sidebar-toggle').addEventListener('click', toggleSidebar);
    document.getElementById('give-up-btn').addEventListener('click', giveUp);
    document.getElementById('show-desmos-btn').addEventListener('click', handleShowDesmosSolution);
    document.getElementById('clear-history').addEventListener('click', () => { state.sessionStats.history = []; renderHistory(); saveStorage(); });
    document.getElementById('stats-btn').addEventListener('click', openAnalytics);
    document.getElementById('flag-btn').addEventListener('click', toggleFlag);
    document.getElementById('crossout-btn').addEventListener('click', toggleCrossOut);
    document.getElementById('review-flagged-btn').addEventListener('click', toggleReviewFlagged);
    document.getElementById('clear-flagged').addEventListener('click', () => { state.flaggedQuestions = []; saveStorage(); updateReviewBtn(); });
    document.getElementById('export-study-pack').addEventListener('click', exportStudyPack);
    document.getElementById('answer-box').addEventListener('input', e => updateAnswerPreview(e.target.value));
    document.getElementById('cheat-btn').addEventListener('click', () => showCheatSheet(!document.getElementById('cheat-drawer').classList.contains('open')));
    document.getElementById('close-cheat').addEventListener('click', () => showCheatSheet(false));
    document.getElementById('cheat-search').addEventListener('input', e => renderCheatSheet(e.target.value));
    document.getElementById('tutorial-close').addEventListener('click', closeTutorial);
    document.getElementById('tutorial-overlay').addEventListener('click', e => { if (e.target.id === 'tutorial-overlay') closeTutorial(); });
    document.getElementById('hard-mode-toggle').addEventListener('click', toggleHardMode);
    document.getElementById('mc-mode-toggle').addEventListener('click', toggleMCMode);
    document.getElementById('focus-exit').addEventListener('click', toggleFocusMode);
}

document.addEventListener('DOMContentLoaded', () => {
    const returning = loadStorage();
    applyTheme(); applyMute(); applyFocusMode(); applyHardMode(); applyMCMode();
    populateCategoryCheckboxes(); renderHistory();
    initEventListeners(); setupResizer(); initCrossOut();
    updateReviewBtn(); updateStreak(false); newQuestion();
    if (!returning) showTutorial();
});
