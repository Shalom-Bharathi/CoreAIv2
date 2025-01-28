// Workout Session Management
import { SheetsIntegration } from './sheets-integration.js';

// Initialize sheets integration
const sheetsIntegration = new SheetsIntegration('../../your-credentials.json');

class WorkoutSession {
  constructor() {
    this.workout = null;
    this.currentExerciseIndex = 0;
    this.timeRemaining = 0;
    this.isResting = false;
    this.isPaused = false;
    this.timer = null;
    this.currentSet = 1;
    this.totalSets = 1;
    this.startTime = null;
    this.calorieInterval = null;
    this.music = document.getElementById('workoutMusic');
    this.isMusicPlaying = false;
    
    // Add audio context and sounds state
    this.audioContext = null;
    this.soundsEnabled = false;
    
    // Bind methods
    this.togglePause = this.togglePause.bind(this);
    this.skipExercise = this.skipExercise.bind(this);
    this.previousExercise = this.previousExercise.bind(this);
    this.toggleMusic = this.toggleMusic.bind(this);
    this.handleVolumeChange = this.handleVolumeChange.bind(this);
    this.initializeAudio = this.initializeAudio.bind(this);
  }

  async initializeAudio() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.soundsEnabled = true;
      
      // Try to resume audio context
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      // Pre-load all audio elements
      const exerciseAudio = document.getElementById('exerciseStartAudio');
      const breakAudio = document.getElementById('breakStartAudio');
      const completionAudio = document.getElementById('completionAudio');
      
      if (exerciseAudio) exerciseAudio.load();
      if (breakAudio) breakAudio.load();
      if (completionAudio) completionAudio.load();
      
    } catch (error) {
      console.error('Error initializing audio:', error);
      this.soundsEnabled = false;
    }
  }

  async initialize() {
    // Initialize music controls
    const volumeSlider = document.getElementById('volumeSlider');
    const toggleMusicBtn = document.getElementById('toggleMusicBtn');
    
    if (volumeSlider) {
      volumeSlider.addEventListener('input', this.handleVolumeChange);
    }
    
    if (toggleMusicBtn) {
      toggleMusicBtn.addEventListener('click', this.toggleMusic);
    }

    // Add start button to the exercise display
    const exerciseDisplay = document.querySelector('.exercise-display');
    const startButton = document.createElement('button');
    startButton.className = 'button-circle primary start-button';
    startButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>
    `;
    startButton.addEventListener('click', async () => {
      await this.initializeAudio();
      startButton.remove();
      this.loadWorkout();
    });
    exerciseDisplay.insertBefore(startButton, exerciseDisplay.firstChild);
  }

  handleVolumeChange(event) {
    if (this.music) {
      this.music.volume = event.target.value / 100;
    }
  }

  toggleMusic() {
    if (!this.music) return;

    const toggleBtn = document.getElementById('toggleMusicBtn');
    
    if (this.isMusicPlaying) {
      this.music.pause();
      toggleBtn?.classList.remove('playing');
    } else {
      this.music.play().catch(error => console.error('Error playing music:', error));
      toggleBtn?.classList.add('playing');
    }
    
    this.isMusicPlaying = !this.isMusicPlaying;
  }

  processWorkoutData(workoutData) {
    const exercises = [];
    
    // Add warm-up exercises
    workoutData.sections.warmUp.exercises.forEach(ex => {
      exercises.push({
        ...ex,
        phase: 'Warm Up',
        sets: 1,
        rest: parseInt(ex.rest) || 15
      });
    });

    // Add main workout exercises
    workoutData.sections.mainWorkout.exercises.forEach(ex => {
      exercises.push({
        ...ex,
        phase: 'Main Workout',
        sets: parseInt(ex.sets) || 1,
        rest: parseInt(ex.rest) || 30
      });
    });

    // Add cool-down exercises
    workoutData.sections.coolDown.exercises.forEach(ex => {
      exercises.push({
        ...ex,
        phase: 'Cool Down',
        sets: 1,
        rest: parseInt(ex.rest) || 15
      });
    });

    return {
      ...workoutData,
      exercises: exercises
    };
  }

  async loadWorkout() {
    try {
      const workoutData = JSON.parse(localStorage.getItem('currentWorkout'));
      if (!workoutData) {
        window.location.href = '../';
        return;
      }

      this.workout = this.processWorkoutData(workoutData);
      
      document.getElementById('workoutName').textContent = this.workout.name;
      document.getElementById('workoutDescription').textContent = 
        `${this.workout.type} workout - ${this.workout.difficulty} level`;
      document.getElementById('exerciseCount').textContent = 
        `1/${this.workout.exercises.length}`;
      
      this.startExercise(0);
      this.updateUpcomingExercises();
      
      // Start tracking calories
      this.startTime = Date.now();
      this.calorieInterval = setInterval(() => this.updateCalories(), 60000);
    } catch (error) {
      console.error('Error loading workout:', error);
      alert('Error loading workout');
    }
  }

  startExercise(index) {
    this.currentExerciseIndex = index;
    const exercise = this.workout.exercises[index];
    this.currentSet = 1;
    this.totalSets = exercise.sets || 1;
    
    this.updateExerciseDisplay(exercise);
    this.timeRemaining = parseInt(exercise.duration) || 30;
    this.isResting = false;
    this.updateTimer();
    this.startTimer();
    this.calculateTotalTimeLeft();
    this.playExerciseStart();
  }

  updateExerciseDisplay(exercise) {
    const exerciseElement = document.getElementById('currentExercise');
    exerciseElement.innerHTML = `
      <h2 class="exercise-name">${exercise.name}</h2>
      <p class="exercise-instructions">${exercise.instructions}</p>
      ${this.totalSets > 1 ? `<p class="exercise-sets">Set ${this.currentSet}/${this.totalSets}</p>` : ''}
      ${exercise.targetMuscles ? `
        <div class="target-muscles">
          <span class="label">Target Muscles:</span>
          <span class="muscles">${exercise.targetMuscles.join(', ')}</span>
        </div>
      ` : ''}
    `;
    
    document.getElementById('currentPhase').textContent = exercise.phase;
    document.getElementById('exerciseCount').textContent = 
      `${this.currentExerciseIndex + 1}/${this.workout.exercises.length}`;
  }

  updateTimer() {
    const timerDisplay = document.getElementById('timeRemaining');
    const timerPhase = document.getElementById('timerPhase');
    const circle = document.querySelector('.progress-ring-circle');
    
    if (!timerDisplay || !timerPhase || !circle) return;

    timerDisplay.textContent = this.formatTime(this.timeRemaining);
    timerPhase.textContent = this.isResting ? 'Rest' : 'Exercise';

    const exercise = this.workout.exercises[this.currentExerciseIndex];
    const duration = this.isResting ? exercise.rest : exercise.duration;
    const progress = (duration - this.timeRemaining) / duration;
    const circumference = 2 * Math.PI * 90;
    const offset = circumference * (1 - progress);
    
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = offset;
  }

  startTimer() {
    if (this.timer) clearInterval(this.timer);
    
    this.timer = setInterval(() => {
      if (this.isPaused) return;

      if (this.timeRemaining > 0) {
        this.timeRemaining--;
        this.updateTimer();
      } else {
        const exercise = this.workout.exercises[this.currentExerciseIndex];
        
        if (this.isResting) {
          if (this.currentSet < this.totalSets) {
            this.currentSet++;
            this.isResting = false;
            this.timeRemaining = exercise.duration;
            this.updateExerciseDisplay(exercise);
            this.playExerciseStart();
          } else if (this.currentExerciseIndex < this.workout.exercises.length - 1) {
            this.startExercise(this.currentExerciseIndex + 1);
          } else {
            this.completeWorkout();
          }
        } else {
          this.isResting = true;
          this.timeRemaining = exercise.rest;
          this.updateTimer();
          this.playBreakStart();
        }
      }
    }, 1000);
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    const pauseButton = document.getElementById('pauseButton');
    
    if (pauseButton) {
      pauseButton.innerHTML = this.isPaused ? 
        `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>` :
        `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;
    }
  }

  skipExercise() {
    if (this.currentExerciseIndex < this.workout.exercises.length - 1) {
      this.startExercise(this.currentExerciseIndex + 1);
    }
  }

  previousExercise() {
    if (this.currentExerciseIndex > 0) {
      this.startExercise(this.currentExerciseIndex - 1);
    }
  }

  updateUpcomingExercises() {
    const container = document.getElementById('upcomingExercises');
    if (!container) return;
    
    container.innerHTML = '';

    for (let i = this.currentExerciseIndex + 1; i < Math.min(this.currentExerciseIndex + 4, this.workout.exercises.length); i++) {
      const exercise = this.workout.exercises[i];
      const exerciseElement = document.createElement('div');
      exerciseElement.className = `upcoming-exercise${i === this.currentExerciseIndex + 1 ? ' next' : ''}`;
      exerciseElement.innerHTML = `
        <h4>${exercise.name}</h4>
        <p>${exercise.duration}s · ${exercise.phase}</p>
      `;
      container.appendChild(exerciseElement);
    }
  }

  async completeWorkout() {
    clearInterval(this.timer);
    clearInterval(this.calorieInterval);
    
    // Play completion sound
    if (this.soundsEnabled) {
      const completionAudio = document.getElementById('completionAudio');
      if (completionAudio) {
        try {
          await completionAudio.play();
        } catch (error) {
          console.error('Error playing completion sound:', error);
        }
      }
    }
    
    // Fade out and stop the music
    if (this.music && this.isMusicPlaying) {
      const fadeOut = setInterval(() => {
        if (this.music.volume > 0.1) {
          this.music.volume -= 0.1;
        } else {
          clearInterval(fadeOut);
          this.music.pause();
          this.music.currentTime = 0;
          this.isMusicPlaying = false;
          const toggleBtn = document.getElementById('toggleMusicBtn');
          toggleBtn?.classList.remove('playing');
        }
      }, 100);
    }

    try {
      // Calculate workout duration
      const duration = Math.floor((Date.now() - this.startTime) / 1000);
      const user = firebase.auth().currentUser;
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const db = firebase.firestore();
      
      // Save workout completion to workouts collection
      if (this.workout.id) {
        await db.collection('workouts').doc(this.workout.id).update({
          completed: true,
          completedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }

      // Save workout session details to Firebase
      const workoutData = {
        userId: user.uid,
        workoutName: this.workout.name,
        workoutId: this.workout.id || null,
        completedAt: firebase.firestore.FieldValue.serverTimestamp(),
        duration: duration,
        exercisesCompleted: this.workout.exercises.length,
        type: this.workout.type || 'custom',
        difficulty: this.workout.difficulty || 'medium',
        caloriesBurned: parseInt(document.getElementById('caloriesBurned').textContent) || 0
      };

      await db.collection('workout-sessions').add(workoutData);

      // Save to Google Sheets
      try {
        await sheetsIntegration.initialize();
        await sheetsIntegration.saveWorkoutCompletion(workoutData);
      } catch (sheetsError) {
        console.error('Error saving to Google Sheets:', sheetsError);
        // Don't throw the error as we still want to show completion UI
      }

      // Update completion popup stats
      document.getElementById('workoutDuration').textContent = this.formatTime(duration);
      document.getElementById('exercisesCompleted').textContent = this.workout.exercises.length;
      
      // Show completion popup with confetti
      const popup = document.getElementById('completionPopup');
      if (popup) {
        // Create confetti
        for (let i = 0; i < 150; i++) {
          createConfetti(popup.querySelector('.confetti-container'));
        }
        
        // Show popup with animation
        popup.style.display = 'flex';
        setTimeout(() => {
          popup.classList.add('show');
        }, 100);
      }
    } catch (error) {
      console.error('Error completing workout:', error);
      alert('There was an error saving your workout progress. Your progress may not be saved.');
      window.location.href = '../';
    }
  }

  calculateTotalTimeLeft() {
    let totalTime = 0;
    for (let i = this.currentExerciseIndex; i < this.workout.exercises.length; i++) {
      const exercise = this.workout.exercises[i];
      totalTime += parseInt(exercise.duration) + parseInt(exercise.rest);
    }
    document.getElementById('totalTimeLeft').textContent = this.formatTime(totalTime);
  }

  updateCalories() {
    const caloriesPerMinute = 5; // Approximate calories burned per minute
    const totalMinutes = Math.floor((Date.now() - this.startTime) / 60000);
    const calories = totalMinutes * caloriesPerMinute;
    document.getElementById('caloriesBurned').textContent = calories.toString();
  }

  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  playExerciseStart() {
    if (!this.soundsEnabled) return;
    
    const audio = document.getElementById('exerciseStartAudio');
    if (audio) {
      try {
        audio.currentTime = 0;
        const playPromise = audio.play();
        if (playPromise) {
          playPromise.catch(error => {
            if (error.name !== 'NotAllowedError') {
              console.error('Error playing exercise start sound:', error);
            }
          });
        }
      } catch (error) {
        console.error('Error playing exercise start sound:', error);
      }
    }
  }

  playBreakStart() {
    if (!this.soundsEnabled) return;
    
    const audio = document.getElementById('breakStartAudio');
    if (audio) {
      try {
        audio.currentTime = 0;
        const playPromise = audio.play();
        if (playPromise) {
          playPromise.catch(error => {
            if (error.name !== 'NotAllowedError') {
              console.error('Error playing break start sound:', error);
            }
          });
        }
      } catch (error) {
        console.error('Error playing break start sound:', error);
      }
    }
  }
}

// Add styles for the start button
const style = document.createElement('style');
style.textContent = `
  .start-button {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 80px !important;
    height: 80px !important;
    background: var(--primary);
    color: white;
    z-index: 10;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  }
  
  .start-button:hover {
    transform: translate(-50%, -50%) scale(1.1);
    box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
  }
`;
document.head.appendChild(style);

// Initialize workout session
const workoutSession = new WorkoutSession();

// Add event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize the workout session
  workoutSession.initialize();

  // Add event listeners for control buttons
  const logoutButton = document.getElementById('logoutButton');
  const pauseButton = document.getElementById('pauseButton');
  const skipButton = document.getElementById('skipButton');
  const previousButton = document.getElementById('previousButton');

  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      firebase.auth().signOut().then(() => {
        window.location.href = '../../index.html';
      }).catch((error) => {
        console.error('Error signing out:', error);
      });
    });
  }

  if (pauseButton) {
    pauseButton.addEventListener('click', () => workoutSession.togglePause());
  }

  if (skipButton) {
    skipButton.addEventListener('click', () => workoutSession.skipExercise());
  }

  if (previousButton) {
    previousButton.addEventListener('click', () => workoutSession.previousExercise());
  }
});

// Add confetti creation function
function createConfetti(container) {
  const confetti = document.createElement('div');
  confetti.className = 'confetti';
  
  // Random confetti properties
  const colors = ['#FF477E', '#FF8C07', '#7EE787', '#A2D2FB', '#7C3AED'];
  const randomRotation = Math.random() * 360;
  const randomScale = Math.random() * 0.8 + 0.2;
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  const randomLeft = Math.random() * 100;
  const randomDelay = Math.random() * 3;
  
  confetti.style.cssText = `
    left: ${randomLeft}%;
    transform: rotate(${randomRotation}deg) scale(${randomScale});
    background-color: ${randomColor};
    animation-delay: ${randomDelay}s;
  `;
  
  container.appendChild(confetti);
  
  // Remove confetti after animation
  confetti.addEventListener('animationend', () => {
    confetti.remove();
  });
}

// Add styles for confetti and popup
const celebrationStyles = document.createElement('style');
celebrationStyles.textContent = `
  .completion-popup {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: none;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .completion-popup.show {
    opacity: 1;
  }

  .popup-content {
    background: var(--card);
    padding: 2.5rem;
    border-radius: 1.5rem;
    text-align: center;
    position: relative;
    max-width: 90%;
    width: 400px;
    transform: translateY(20px);
    transition: transform 0.3s ease;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  }

  .completion-popup.show .popup-content {
    transform: translateY(0);
  }

  .confetti-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    overflow: hidden;
  }

  .confetti {
    position: absolute;
    width: 10px;
    height: 10px;
    top: -10px;
    border-radius: 2px;
    animation: confetti-fall 4s linear forwards;
  }

  @keyframes confetti-fall {
    0% {
      transform: translateY(0) rotate(0deg);
      opacity: 1;
    }
    75% {
      opacity: 1;
    }
    100% {
      transform: translateY(100vh) rotate(720deg);
      opacity: 0;
    }
  }

  .close-button {
    background: var(--primary);
    color: white;
    border: none;
    padding: 0.75rem 2rem;
    border-radius: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-top: 1.5rem;
  }

  .close-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  }

  .workout-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin: 1.5rem 0;
  }

  .stat {
    background: var(--background);
    padding: 1rem;
    border-radius: 0.75rem;
    border: 1px solid var(--border);
  }

  .stat-label {
    font-size: 0.875rem;
    color: var(--muted);
    display: block;
    margin-bottom: 0.25rem;
  }

  .stat-value {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text);
  }
`;
document.head.appendChild(celebrationStyles);

// Add close popup function
window.closeCompletionPopup = () => {
  const popup = document.getElementById('completionPopup');
  if (popup) {
    popup.classList.remove('show');
    setTimeout(() => {
      popup.style.display = 'none';
      window.location.href = '../';
    }, 300);
  }
};
