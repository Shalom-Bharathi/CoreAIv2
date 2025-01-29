import { DashboardSheetsIntegration } from './sheets-dashboard.js';
import { analyzeBody, getLatestAnalysis } from './body-analysis.js';

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

// Body Analysis Functions
async function initializeBodyAnalysis() {
  const updateButton = document.getElementById('updateBodyAnalysis');
  const analysisForm = document.getElementById('bodyAnalysisForm');
  const analyzeButton = document.getElementById('analyzeBody');
  const fileInput = document.getElementById('bodyImage');
  const imagePreview = document.getElementById('imagePreview');
  const loadingIndicator = document.querySelector('.loading-indicator');
  const resultsContent = document.querySelector('.results-content');

  // Load latest analysis if available
  const latestAnalysis = await getLatestAnalysis();
  if (latestAnalysis) {
    displayAnalysisResults(latestAnalysis.analysis);
  }

  updateButton.addEventListener('click', () => {
    analysisForm.style.display = analysisForm.style.display === 'none' ? 'block' : 'none';
  });

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        imagePreview.innerHTML = `<img src="${e.target.result}" alt="Body preview">`;
      };
      reader.readAsDataURL(file);
    }
  });

  analyzeButton.addEventListener('click', async () => {
    const file = fileInput.files[0];
    const height = document.getElementById('height').value;
    const weight = document.getElementById('weight').value;

    if (!file || !height || !weight) {
      alert('Please provide an image and your measurements');
      return;
    }

    try {
      loadingIndicator.style.display = 'flex';
      resultsContent.style.display = 'none';
      analysisForm.style.display = 'none';

      // Upload image to Firebase Storage
      const user = firebase.auth().currentUser;
      const storageRef = firebase.storage().ref();
      const imageRef = storageRef.child(`body-images/${user.uid}/${Date.now()}_${file.name}`);
      await imageRef.put(file);
      const imageUrl = await imageRef.getDownloadURL();

      // Analyze body
      const analysis = await analyzeBody(imageUrl, height, weight);
      displayAnalysisResults(analysis);
    } catch (error) {
      console.error('Error during body analysis:', error);
      alert('An error occurred during analysis. Please try again.');
    } finally {
      loadingIndicator.style.display = 'none';
      resultsContent.style.display = 'grid';
    }
  });
}

function displayAnalysisResults(analysis) {
  const resultsContent = document.querySelector('.results-content');
  
  const resultsHTML = `
    <div class="result-item">
      <h4>Body Type</h4>
      <p>${analysis.bodyType}</p>
    </div>
    <div class="result-item">
      <h4>Muscle Distribution</h4>
      <p><strong>Upper Body:</strong> ${analysis.muscleDistribution.upperBody}</p>
      <p><strong>Core:</strong> ${analysis.muscleDistribution.core}</p>
      <p><strong>Lower Body:</strong> ${analysis.muscleDistribution.lowerBody}</p>
    </div>
    <div class="result-item">
      <h4>Fat Distribution</h4>
      <p><strong>Upper Body:</strong> ${analysis.fatDistribution.upperBody}</p>
      <p><strong>Core:</strong> ${analysis.fatDistribution.core}</p>
      <p><strong>Lower Body:</strong> ${analysis.fatDistribution.lowerBody}</p>
    </div>
    <div class="result-item">
      <h4>Muscle Definition</h4>
      <p>${analysis.muscleDefinition}</p>
    </div>
    <div class="result-item">
      <h4>Posture Analysis</h4>
      <p>${analysis.posture}</p>
    </div>
    <div class="result-item">
      <h4>Body Composition</h4>
      <p><strong>Estimated Body Fat:</strong> ${analysis.estimatedBodyFatPercentage}</p>
      <p><strong>Estimated Biological Age:</strong> ${analysis.estimatedBiologicalAge}</p>
    </div>
    <div class="result-item">
      <h4>Recommendations</h4>
      <div class="recommendations-list">
        <div class="recommendation-item">
          <h5>Training</h5>
          <ul>${analysis.recommendations.training.map(rec => `<li>${rec}</li>`).join('')}</ul>
        </div>
        <div class="recommendation-item">
          <h5>Nutrition</h5>
          <ul>${analysis.recommendations.nutrition.map(rec => `<li>${rec}</li>`).join('')}</ul>
        </div>
        <div class="recommendation-item">
          <h5>Posture</h5>
          <ul>${analysis.recommendations.posture.map(rec => `<li>${rec}</li>`).join('')}</ul>
        </div>
      </div>
    </div>
  `;

  resultsContent.innerHTML = resultsHTML;
  resultsContent.style.display = 'grid';
}

// Initialize dashboard when user is authenticated
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    updateDashboardStats(user.uid);
    initializeBodyAnalysis();
  }
});

