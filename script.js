// --- 1. STATE VARIABLES & CONSTANTS ---
const timer = {
    // Standard Pomodoro timings (in minutes)
    pomodoro: 25,
    shortBreak: 5,
    longBreak: 15,
    longBreakInterval: 4, // Long break after 4 pomodoros

    // Runtime state
    mode: 'pomodoro', 
    isRunning: false,
    timerInterval: null, // Holds the ID of setInterval for countdown
    pomodoroCount: 0,
    timeRemaining: 25 * 60, // Initial time set to 25 minutes in seconds
};

// --- 2. DOM ELEMENT REFERENCES ---
const minutesDisplay = document.getElementById('js-minutes');
const secondsDisplay = document.getElementById('js-seconds');
const startButton = document.getElementById('js-start-button');
const pauseButton = document.getElementById('js-pause-button');
const resetButton = document.getElementById('js-reset-button');
const modeButtons = document.getElementById('js-mode-buttons');
const alarmSound = document.getElementById('js-alarm-sound');
const appContainer = document.querySelector('.pomodoro-app'); // For dynamic color changes
const sessionCounterElement = document.getElementById('js-session-counter');


// --- 3. UI/DISPLAY FUNCTIONS ---

// Converts total seconds into a formatted MM:SS object
function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    // Use padStart to ensure single digits are prefixed with '0'
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');

    return { formattedMinutes, formattedSeconds };
}

// Updates the time displayed on the screen and in the browser tab title (U6)
function updateDisplay() {
    const { formattedMinutes, formattedSeconds } = formatTime(timer.timeRemaining);

    minutesDisplay.textContent = formattedMinutes;
    secondsDisplay.textContent = formattedSeconds;

    // Update the browser tab title
    document.title = `(${formattedMinutes}:${formattedSeconds}) - ${timer.mode.toUpperCase()}`;
    
    updateSessionCounter();
}

// Updates the container background color and active button style (U2)
function updateModeStyles() {
    // 1. Update container background color
    appContainer.className = 'pomodoro-app';
    appContainer.classList.add(`${timer.mode}-mode`);

    // 2. Update active button highlighting
    document.querySelectorAll('.mode-selector button').forEach(button => {
        if (button.dataset.mode === timer.mode) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

// Dynamically updates the visual dots for completed Pomodoros (U5)
function updateSessionCounter() {
    sessionCounterElement.innerHTML = ''; // Clear existing dots

    // Create dots representing the Pomodoro sessions in the current cycle
    for (let i = 0; i < timer.longBreakInterval; i++) {
        const dot = document.createElement('div');
        dot.classList.add('pomodoro-dot');
        
        // Highlight dots for completed sessions (F6)
        if (i < timer.pomodoroCount) {
            dot.classList.add('completed');
        }
        sessionCounterElement.appendChild(dot);
    }
}


// --- 4. CORE TIMER LOGIC ---

// Handles the logic for switching the timer mode (F1, F3)
function switchMode(newMode) {
    // 1. Stop any running timer
    if (timer.timerInterval) {
        clearInterval(timer.timerInterval);
        timer.isRunning = false;
    }

    // 2. Update state to the new mode
    timer.mode = newMode;
    
    // Set time based on mode
    if (newMode === 'pomodoro') {
        timer.timeRemaining = timer.pomodoro * 60;
    } else if (newMode === 'shortBreak') {
        timer.timeRemaining = timer.shortBreak * 60;
    } else if (newMode === 'longBreak') {
        timer.timeRemaining = timer.longBreak * 60;
    }

    // 3. Update UI and styles
    updateDisplay();
    updateModeStyles();
    
    // 4. Reset button visibility (Show START)
    startButton.classList.remove('hidden');
    pauseButton.classList.add('hidden');
    resetButton.classList.add('hidden');
    startButton.textContent = 'START';
}

// The main countdown loop (called every second)
function tick() {
    timer.timeRemaining--;

    updateDisplay();

    // Check if time is up
    if (timer.timeRemaining <= 0) {
        clearInterval(timer.timerInterval);
        timer.isRunning = false;

        // Play alarm sound (F8)
        alarmSound.play();

        // Determine the next mode (F5)
        let nextMode = '';
        if (timer.mode === 'pomodoro') {
            timer.pomodoroCount++; // Increment counter
            
            // F4: Check for long break trigger
            if (timer.pomodoroCount % timer.longBreakInterval === 0) {
                nextMode = 'longBreak';
            } else {
                nextMode = 'shortBreak';
            }
        } else {
            // If it was a break, go back to pomodoro
            nextMode = 'pomodoro';
            
            // If it was a long break, reset the counter
            if (timer.mode === 'longBreak') {
                timer.pomodoroCount = 0;
            }
        }
        
        // Auto-start the next session (for continuous workflow)
        switchMode(nextMode);
        startTimer(); 
    }
}

// Starts the timer (F2)
function startTimer() {
    if (timer.isRunning) return; 

    timer.isRunning = true;
    // Set the interval, ensuring it calls tick() every second (N1)
    timer.timerInterval = setInterval(tick, 1000); 

    // Update button visibility (show PAUSE, hide START)
    startButton.classList.add('hidden');
    pauseButton.classList.remove('hidden');
    resetButton.classList.remove('hidden');
}

// Pauses the timer (F2)
function pauseTimer() {
    if (!timer.isRunning) return;
    
    clearInterval(timer.timerInterval);
    timer.isRunning = false;

    // Update button visibility (show START/RESUME, hide PAUSE)
    startButton.textContent = 'RESUME';
    startButton.classList.remove('hidden');
    pauseButton.classList.add('hidden');
}

// Resets the timer to the beginning of the current mode (F2)
function resetTimer() {
    // Get the duration for the currently selected mode
    const currentDuration = timer[timer.mode];
    
    // Clear any running interval
    clearInterval(timer.timerInterval);
    timer.isRunning = false;

    // Reset the time remaining
    timer.timeRemaining = currentDuration * 60;

    // Reset button visibility
    startButton.textContent = 'START';
    startButton.classList.remove('hidden');
    pauseButton.classList.add('hidden');
    resetButton.classList.add('hidden');
    
    updateDisplay();
}


// --- 5. INITIALIZATION AND EVENT LISTENERS ---

// Event listener for Start/Pause/Reset buttons
startButton.addEventListener('click', startTimer);
pauseButton.addEventListener('click', pauseTimer);
resetButton.addEventListener('click', resetTimer);

// Event Delegation for Mode buttons (switches between Focus, Short, Long)
modeButtons.addEventListener('click', (e) => {
    // e.target.dataset.mode retrieves the data-mode attribute from the clicked button
    const newMode = e.target.dataset.mode; 
    if (newMode) {
        switchMode(newMode);
    }
});

// Run this function once the entire HTML structure is loaded
document.addEventListener('DOMContentLoaded', () => {
    switchMode(timer.mode); // Initialize the state and UI to Pomodoro mode
});
