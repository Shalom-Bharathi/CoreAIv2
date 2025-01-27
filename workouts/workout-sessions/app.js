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
    this.music = null;
    this.isMusicPlaying = false;
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
      
      this.updateUpcomingExercises();
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
    const totalTime = this.isResting ? exercise.rest : exercise.duration;
    const progress = (this.timeRemaining / totalTime) * 100;
    const circumference = 2 * Math.PI * 90;
    const offset = circumference - (progress / 100) * circumference;
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

  updateUpcomingExercises() {
    const container = document.getElementById('upcomingExercises');
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

  togglePause() {
    this.isPaused = !this.isPaused;
    document.getElementById('pauseButton').innerHTML = this.isPaused ? 
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>' :
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
  }

  skipExercise() {
    if (this.currentExerciseIndex < this.workout.exercises.length - 1) {
      this.startExercise(this.currentExerciseIndex + 1);
    } else {
      this.completeWorkout();
    }
  }

  previousExercise() {
    if (this.currentExerciseIndex > 0) {
      this.startExercise(this.currentExerciseIndex - 1);
    }
  }

  startWorkout() {
    this.startTime = Date.now();
    this.calorieInterval = setInterval(() => this.updateCalories(), 60000);
    this.startExercise(0);
    document.getElementById('startWorkoutBtn').style.display = 'none';
    
    // Start the music when workout begins
    if (this.music && !this.isMusicPlaying) {
      this.toggleMusic();
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
        audio.play();
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
        audio.play();
      } catch (error) {
        console.error('Error playing break start sound:', error);
      }
    }
  }

  initializeMusic() {
    this.music = document.getElementById('workoutMusic');
    const volumeSlider = document.getElementById('volumeSlider');
    const toggleMusicBtn = document.getElementById('toggleMusicBtn');

    if (this.music && volumeSlider) {
      this.music.volume = volumeSlider.value / 100;
    }

    volumeSlider?.addEventListener('input', (e) => {
      if (this.music) {
        this.music.volume = e.target.value / 100;
      }
    });

    toggleMusicBtn?.addEventListener('click', () => this.toggleMusic());

    volumeSlider?.addEventListener('change', () => {
      localStorage.setItem('workoutMusicVolume', volumeSlider.value);
    });

    const savedVolume = localStorage.getItem('workoutMusicVolume');
    if (savedVolume && volumeSlider) {
      volumeSlider.value = savedVolume;
      if (this.music) {
        this.music.volume = savedVolume / 100;
      }
    }
  }

  toggleMusic() {
    const toggleBtn = document.getElementById('toggleMusicBtn');
    if (!this.music) return;

    if (this.isMusicPlaying) {
      this.music.pause();
      toggleBtn?.classList.remove('playing');
    } else {
      this.music.play();
      toggleBtn?.classList.add('playing');
    }
    this.isMusicPlaying = !this.isMusicPlaying;
  }
}

// Initialize workout session
const workoutSession = new WorkoutSession();

// Add event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('logoutButton')?.addEventListener('click', handleSignOut);
  document.getElementById('pauseButton').addEventListener('click', () => workoutSession.togglePause());
  document.getElementById('skipButton').addEventListener('click', () => workoutSession.skipExercise());
  document.getElementById('previousButton').addEventListener('click', () => workoutSession.previousExercise());
  document.getElementById('startWorkoutBtn').addEventListener('click', () => workoutSession.startWorkout());
  
  // Initialize music player
  workoutSession.initializeMusic();
  
  workoutSession.loadWorkout();
});

// Add these functions to handle workout completion

async function completeWorkout(workoutData) {
    try {
        const user = firebase.auth().currentUser;
        if (!user) {
            console.error('No user logged in');
            return;
        }

        // Calculate workout duration
        const duration = calculateWorkoutDuration();
        
        // Prepare workout session data
        const sessionData = {
            userId: user.uid,
            userEmail: user.email,
            workoutId: workoutData.id,
            workoutName: workoutData.name,
            completedAt: firebase.firestore.FieldValue.serverTimestamp(),
            duration: duration,
            exercisesCompleted: workoutData.exercises.length,
            exercises: workoutData.exercises.map(exercise => ({
                name: exercise.name,
                sets: exercise.sets,
                reps: exercise.reps,
                completed: true
            }))
        };

        // Save to workoutSessions collection
        await firebase.firestore().collection('workoutSessions').add(sessionData);
        
        // Update UI with completion stats
        document.getElementById('workoutDuration').textContent = formatDuration(duration);
        document.getElementById('exercisesCompleted').textContent = workoutData.exercises.length;

        // Play random completion sound
        const audioNumber = Math.floor(Math.random() * 3) + 1;
        const audio = document.getElementById(`completionAudio${audioNumber}`);
        if (audio) {
            try {
                console.log(`Playing completion sound ${audioNumber}`);
                await audio.play();
            } catch (error) {
                console.error('Error playing audio:', error);
            }
        }

        // Show completion popup with animation
        showCompletionPopup();

    } catch (error) {
        console.error('Error saving workout session:', error);
        alert('Error saving your workout progress. Please try again.');
    }
}

function calculateWorkoutDuration() {
    // Get workout start time from localStorage or use a default duration
    const startTime = localStorage.getItem('workoutStartTime');
    if (startTime) {
        const duration = Date.now() - parseInt(startTime);
        return Math.floor(duration / 1000); // Convert to seconds
    }
    return 0;
}

function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function showCompletionPopup() {
    const popup = document.getElementById('completionPopup');
    if (popup) {
        popup.style.display = 'flex';
        setTimeout(() => {
            popup.classList.add('show');
            createConfetti();
        }, 100);
    }
}

function closeCompletionPopup() {
    const popup = document.getElementById('completionPopup');
    if (popup) {
        popup.classList.remove('show');
        setTimeout(() => {
            popup.style.display = 'none';
            // Redirect to workout summary or home page
            window.location.href = '../index.html';
        }, 300);
    }
}

function createConfetti() {
    const container = document.querySelector('.confetti-container');
    if (!container) return;

    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.animationDelay = Math.random() * 3 + 's';
        confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
        container.appendChild(confetti);
    }
}

// Add this CSS for confetti animation
const style = document.createElement('style');
style.textContent = `
    .confetti {
        position: absolute;
        width: 10px;
        height: 10px;
        animation: confetti-fall 3s linear infinite;
    }

    @keyframes confetti-fall {
        0% {
            transform: translateY(-100%) rotate(0deg);
            opacity: 1;
        }
        100% {
            transform: translateY(1000%) rotate(720deg);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Call completeWorkout when the workout is finished
// Add this to your existing workout completion logic
function finishWorkout() {
    const workoutData = JSON.parse(localStorage.getItem('currentWorkout'));
    if (workoutData) {
        completeWorkout(workoutData);
    }
}

// Initialize workout start time when the workout begins
document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('workoutStartTime')) {
        localStorage.setItem('workoutStartTime', Date.now().toString());
    }
});
