# 🧮 SAT Desmos Pacing Engine

A free, browser-based SAT math trainer that teaches you to use **Desmos as a regression machine** — not just a graphing calculator. Solve questions faster, track your pacing, and master the techniques that save minutes on test day.

> *"I made this to help people stop losing points on questions they could've solved in 20 seconds with Desmos. Go practice. The SAT is not that deep." — the developer, probably*

**[▶ Live Site](https://your-site.replit.app)** &nbsp;|&nbsp; **[GitHub](https://github.com/Sceptrell/DesmosRegressionTrainer)**

---

## ✨ Features

### ⏱ Perfect Time Pacing
Every question has a **Perfect Time** target based on difficulty. A green bar at the top of the screen fills in real time — it turns red if you exceed the target. After solving, you see exactly how many seconds you saved (or lost). This trains the exam instinct of knowing *when to move on*.

### 📊 Analytics Heatmap
Click **📊** in the top bar to open the Performance Dashboard. A CSS grid shows every category you've practiced, color-coded:
- 🟢 **Green** — Fast & Accurate (Master)
- 🔵 **Blue** — Accurate but Slow (Pro)
- 🟡 **Yellow** — Needs Practice (Intermediate)
- 🔴 **Red** — Struggling (Beginner)

Each cell shows your accuracy %, average time vs. perfect time, and a Mastery Level label.

### 📋 Desmos Cheat Sheet
Press **H** (or click 📋) to open a searchable formula drawer. It contains the 10 most critical SAT Desmos formulas — Circle, Vertex Form, all Regression types, Exponential Growth, and more. Click **→ Desmos** on any formula to inject it directly into the calculator as a new expression (never overwrites your existing work).

### 🚩 Flag & Review System
Press **F** to flag a question mid-solve. Flagged questions are saved to `localStorage`. Use **Review Flagged** in the sidebar to drill only your weak spots. Click **⬇ Export** to generate a printable **Study Pack** (opens in a new tab) with all flagged questions, their math, and tips — fully client-side, nothing leaves your browser.

### 🎓 Test Report Card
Press **Alt+Enter** to start a timed test. When it ends, instead of a plain alert you get a full Report Card modal:
- **Letter grade** (A–F) based on accuracy and pacing
- Strongest and Weakest categories
- Action plan: *"Focus on Circle Regressions — you're 20s slower than target pace."*

### ✂ Bluebook Annotations
- **Cross-out mode** (`C`) — click words in the question to strike them through, just like the real Digital SAT
- **Click-to-copy numbers** — any standalone number in the question has a dotted underline. Click it to copy directly to clipboard (skips all LaTeX so formulas are never broken)

### 🔔 Audio Feedback
High-pitch ding on correct answers, low-pitch thud after 3 failed attempts. Toggle with the 🔔 button. Generated via Web Audio API — no external files.

### 📐 Live Answer Preview
As you type your answer, a debounced MathJax preview renders it below the input box so you can catch syntax errors before submitting.

---

## 📚 Categories (15 total)

| Difficulty | Category |
|---|---|
| Easy | Linear Properties from Two Points |
| Easy | Trigonometric Identity Evaluation |
| Easy | Simple Percentage Change |
| Medium | Two Points Non-Linear |
| Medium | Circle Regression |
| Medium | Equivalent Expression Constants |
| Medium | Exponential Coefficients |
| Medium | Complex Percentage Relationships |
| Medium | Quadratic System of Equations |
| Medium | Parabola Symmetry (Vertex & Intercepts) |
| Medium | Radius of Non-Standard Circle |
| Medium | Trinomial Factoring |
| Hard | Factoring a Quartic Function |
| Hard | Quadratic and Linear Intersection |
| Hard | Quadratic Regression Limit |

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|---|---|
| `Enter` | Check answer |
| `Shift+Enter` | Check & load next question (if correct) |
| `Alt+Enter` | Start timed test |
| `Ctrl+D` | Toggle dark/light mode |
| `F` | Flag current question |
| `C` | Toggle cross-out mode |
| `H` | Toggle Cheat Sheet drawer |
| `Esc` | Close any open panel |

---

## 🚀 How to use

1. Open the live site
2. Select the **categories** you want to practice in the sidebar
3. Use **Desmos** on the right to solve — click any number in the question to copy it instantly
4. Type your answer and try to beat the **Perfect Time** shown on the pacing bar
5. Press `Shift+Enter` to check and immediately load the next question

---

## 🛠️ Tech stack

- Vanilla JS, HTML, CSS — no build system, no npm
- [Desmos API v1.11](https://www.desmos.com/api/v1.11/docs/)
- [MathJax v3](https://www.mathjax.org/) for LaTeX rendering
- Web Audio API for sound feedback
- Python `http.server` for local dev

---

## 🙏 Credits

Original project by [Sceptrell](https://github.com/Sceptrell/DesmosRegressionTrainer). Extended with pacing engine, analytics, cheat sheet, flagging, and study export features.

Credit to AdiarMath, LearnSATMath, and everyone who provided question feedback.
