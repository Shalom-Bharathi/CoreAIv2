// Workout Session Management
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
    
    // Bind methods
    this.togglePause = this.togglePause.bind(this);
    this.skipExercise = this.skipExercise.bind(this);
    this.previousExercise = this.previousExercise.bind(this);
    this.toggleMusic = this.toggleMusic.bind(this);
    this.handleVolumeChange = this.handleVolumeChange.bind(this);
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

    // Load workout data
    await this.loadWorkout();
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
    const completionAudio = document.getElementById('completionAudio');
    if (completionAudio) {
      try {
        await completionAudio.play();
      } catch (error) {
        console.error('Error playing completion sound:', error);
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
      if (this.workout.id) {
        const db = firebase.firestore();
        await db.collection('workouts').doc(this.workout.id).update({
          completed: true,
          completedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
      window.location.href = '../';
    } catch (error) {
      console.error('Error completing workout:', error);
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
    const audio = document.getElementById('exerciseStartAudio');
    if (audio) {
      try {
        audio.currentTime = 0;
        audio.play().catch(error => console.error('Error playing exercise start sound:', error));
      } catch (error) {
        console.error('Error playing exercise start sound:', error);
      }
    }
  }

  playBreakStart() {
    const audio = document.getElementById('breakStartAudio');
    if (audio) {
      try {
        audio.currentTime = 0;
        audio.play().catch(error => console.error('Error playing break start sound:', error));
      } catch (error) {
        console.error('Error playing break start sound:', error);
      }
    }
  }
}

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
