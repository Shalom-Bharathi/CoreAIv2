import { DashboardSheetsIntegration } from './sheets-dashboard.js';

// Initialize sheets integration
const sheetsIntegration = new DashboardSheetsIntegration();

// Update dashboard with workout data
async function updateDashboardStats(userId) {
  try {
    const stats = await sheetsIntegration.fetchWorkoutStats(userId);
    const history = await sheetsIntegration.fetchWorkoutHistory(userId);

    // Update workout count
    const workoutCard = document.querySelector('.stat-card:nth-child(3)');
    if (workoutCard) {
      const statValue = workoutCard.querySelector('.stat-value');
      const statChange = workoutCard.querySelector('.stat-change');
      if (statValue) statValue.textContent = stats.totalWorkouts;
      if (statChange) {
        const weeklyChange = calculateWeeklyChange(history);
        statChange.textContent = `${weeklyChange >= 0 ? '+' : ''}${weeklyChange}%`;
        statChange.className = `stat-change ${weeklyChange >= 0 ? 'positive' : 'negative'}`;
      }
    }

    // Update charts
    updateFitnessChart(history);
    updateCaloriesChart(history);
  } catch (error) {
    console.error('Error updating dashboard:', error);
  }
}

// Calculate weekly change in workouts
function calculateWeeklyChange(history) {
  if (!history || history.length < 14) return 0;
  
  const thisWeek = history.slice(0, 7).length;
  const lastWeek = history.slice(7, 14).length;
  
  if (lastWeek === 0) return 100;
  return Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
}

// Update fitness progress chart
function updateFitnessChart(history) {
  const ctx = document.getElementById('fitnessChart');
  if (!ctx) return;

  const dates = history.map(workout => {
    const date = new Date(workout.date);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }).reverse();

  const durations = history.map(workout => workout.duration).reverse();

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [{
        label: 'Workout Duration (minutes)',
        data: durations,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            display: false
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    }
  });
}

// Update calories chart
function updateCaloriesChart(history) {
  const ctx = document.getElementById('caloriesChart');
  if (!ctx) return;

  const dates = history.map(workout => {
    const date = new Date(workout.date);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }).reverse();

  const calories = history.map(workout => workout.calories).reverse();

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: dates,
      datasets: [{
        label: 'Calories Burned',
        data: calories,
        backgroundColor: '#6366f1',
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            display: false
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    }
  });
}

// Initialize dashboard when user is authenticated
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    updateDashboardStats(user.uid);
  }
});

