const timer = {
  pomodoro: 25,
  shortBreak: 5,
  longBreak: 15,
  longBreakInterval: 4,
  mode: "pomodoro",
  isRunning: false,
  timeRemaining: 25 * 60,
  timerInterval: null,
  pomodoroCount: 0,
};

// Elements
const minEl = document.getElementById("minutes");
const secEl = document.getElementById("seconds");
const modeEl = document.getElementById("mode-label");
const circle = document.getElementById("timer-circle");
const alarm = document.getElementById("alarm-sound");

const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const resetBtn = document.getElementById("reset-btn");
const skipBtn = document.getElementById("skip-btn");
const nextLabel = document.getElementById("next-label");
const nextDuration = document.getElementById("next-duration");
const nextIcon = document.getElementById("next-icon");

const settingsBtn = document.getElementById("settings-btn");
const panel = document.getElementById("settings-panel");
const themeSelect = document.getElementById("theme-select");

// Input elements
const inputs = {
  pomodoro: document.getElementById("focus-input"),
  shortBreak: document.getElementById("short-input"),
  longBreak: document.getElementById("long-input"),
  longBreakInterval: document.getElementById("round-input"),
};

// ---------- Utility ----------
function formatTime(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return { m, s };
}

function updateDisplay() {
  const { m, s } = formatTime(timer.timeRemaining);
  minEl.textContent = m;
  secEl.textContent = s;
  document.title = `${m}:${s} - ${timer.mode}`;
  updateCircle();
}

function updateCircle() {
  const total = timer[timer.mode] * 60;
  const progress = 360 * (1 - timer.timeRemaining / total);
  const color =
    timer.mode === "pomodoro"
      ? "var(--focus)"
      : timer.mode === "shortBreak"
      ? "var(--short)"
      : "var(--long)";
  
  const isLight = document.body.classList.contains("light-theme");

  // --- FIX APPLIED HERE ---
  // Ensure the central part of the gradient uses light colors in light mode.
  const innerColor = isLight ? "#ffffff" : "#1e2230"; // Center color (lighter background)
  const outerColor = isLight ? "#f0f0f0" : "#12151d"; // Outer background (matching body/card color)

  circle.style.background = `
    conic-gradient(${color} ${progress}deg, transparent ${progress}deg),
    radial-gradient(circle at 50% 50%, ${innerColor} 0%, ${outerColor} 65%)
  `;
  // --------------------------
}

function updateNextPreview() {
  const next =
    timer.mode === "pomodoro"
      ? (timer.pomodoroCount + 1) % timer.longBreakInterval === 0
        ? "longBreak"
        : "shortBreak"
      : "pomodoro";

  const icons = { pomodoro: "💼", shortBreak: "☕", longBreak: "🌙" };
  nextIcon.textContent = icons[next];
  nextLabel.textContent =
    "Next: " +
    (next === "pomodoro"
      ? "Focus Session"
      : next === "shortBreak"
      ? "Short Break"
      : "Long Break");
  nextDuration.textContent = `${timer[next]} min`;
}

// ---------- Timer Core ----------
function tick() {
  timer.timeRemaining--;
  updateDisplay();
  if (timer.timeRemaining <= 0) {
    clearInterval(timer.timerInterval);
    timer.isRunning = false;
    alarm.play();
    skipSession();
  }
}

function startTimer() {
  if (timer.isRunning) return;
  timer.isRunning = true;
  timer.timerInterval = setInterval(tick, 1000);
  startBtn.classList.add("hidden");
  pauseBtn.classList.remove("hidden");
  resetBtn.classList.remove("hidden");
}

function pauseTimer() {
  clearInterval(timer.timerInterval);
  timer.isRunning = false;
  startBtn.textContent = "Resume";
  startBtn.classList.remove("hidden");
  pauseBtn.classList.add("hidden");
}

function resetTimer() {
  clearInterval(timer.timerInterval);
  timer.isRunning = false;
  timer.timeRemaining = timer[timer.mode] * 60;
  startBtn.textContent = "Start";
  startBtn.classList.remove("hidden");
  pauseBtn.classList.add("hidden");
  resetBtn.classList.add("hidden");
  updateDisplay();
}

function skipSession() {
  let next;
  if (timer.mode === "pomodoro") {
    timer.pomodoroCount++;
    next =
      timer.pomodoroCount % timer.longBreakInterval === 0
        ? "longBreak"
        : "shortBreak";
  } else {
    next = "pomodoro";
    if (timer.mode === "longBreak") timer.pomodoroCount = 0;
  }
  switchMode(next);
}

function switchMode(newMode) {
  clearInterval(timer.timerInterval);
  timer.isRunning = false;
  timer.mode = newMode;
  timer.timeRemaining = timer[newMode] * 60;
  modeEl.textContent =
    newMode === "pomodoro"
      ? "Focus"
      : newMode === "shortBreak"
      ? "Short Break"
      : "Long Break";
  updateDisplay();
  updateNextPreview();
  startBtn.textContent = "Start";
  startBtn.classList.remove("hidden");
  pauseBtn.classList.add("hidden");
  resetBtn.classList.add("hidden");
}

// ---------- Events ----------
startBtn.onclick = startTimer;
pauseBtn.onclick = pauseTimer;
resetBtn.onclick = resetTimer;
skipBtn.onclick = skipSession;

settingsBtn.onclick = () => panel.classList.toggle("active");
themeSelect.onchange = (e) => {
  document.body.classList.toggle("light-theme", e.target.value === "light");
};

// ---------- Inputs + Buttons ----------
function updateValue(key, val) {
    // 1. Determine max based on key (assuming max 60 for time, max 10 for rounds)
    const minVal = parseInt(inputs[key].min);
    const maxVal = key === 'longBreakInterval' ? 10 : 60; 

    // 2. Clamp the value between min and max
    timer[key] = Math.max(minVal, Math.min(maxVal, val));
    
    // 3. Force the input element to show the clamped (validated) value
    inputs[key].value = timer[key];

    // 4. Update timer display if the current mode was changed
    if (!timer.isRunning && (key === timer.mode || (key === 'pomodoro' && timer.mode === 'pomodoro'))) {
        timer.timeRemaining = timer[timer.mode] * 60;
        updateDisplay();
    }
    updateNextPreview();
}

Object.entries(inputs).forEach(([key, input]) => {
  input.addEventListener("change", () => updateValue(key, +input.value));
});

const buttonConfigs = [
  ["focus-dec", "focus-inc", "pomodoro"],
  ["short-dec", "short-inc", "shortBreak"],
  ["long-dec", "long-inc", "longBreak"],
  ["round-dec", "round-inc", "longBreakInterval"],
];
buttonConfigs.forEach(([decId, incId, key]) => {
  document.getElementById(decId).onclick = () =>
    updateValue(key, timer[key] - 1);
  document.getElementById(incId).onclick = () =>
    updateValue(key, timer[key] + 1);
});

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", () => {
  updateDisplay();
  updateNextPreview();
});
