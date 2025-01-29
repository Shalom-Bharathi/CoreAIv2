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

    // Update AI Insights count
    const insightsCard = document.querySelector('.stat-card:nth-child(4)');
    if (insightsCard) {
      const statValue = insightsCard.querySelector('.stat-value');
      if (statValue) {
        const analysisData = await getLatestAnalysis();
        if (analysisData && analysisData.analysis && analysisData.analysis.recommendations) {
          const totalRecommendations = 
            analysisData.analysis.recommendations.training.length +
            analysisData.analysis.recommendations.nutrition.length +
            analysisData.analysis.recommendations.posture.length;
          statValue.textContent = totalRecommendations;
        }
      }
    }
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
  const loadingIndicator = document.querySelector('.loading-indicator');
  const resultsContent = document.querySelector('.results-content');

  if (!updateButton || !analysisForm || !loadingIndicator || !resultsContent) {
    console.error('Required elements for body analysis not found');
    return;
  }

  // Load latest analysis if available
  const latestAnalysis = await getLatestAnalysis();
  if (latestAnalysis) {
    displayAnalysisResults(latestAnalysis.analysis);
  }

  // Create the image capture UI
  analysisForm.innerHTML = `
    <div class="capture-container">
      <div class="capture-options">
        <button id="takePhoto" class="capture-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          Take Photo
        </button>
        <div class="or-divider">or</div>
        <label for="uploadPhoto" class="upload-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          Upload Photo
          <input type="file" id="uploadPhoto" accept="image/*" style="display: none;">
        </label>
      </div>
      <div class="camera-container" style="display: none;">
        <video id="camera" autoplay playsinline></video>
        <canvas id="photoCanvas" style="display: none;"></canvas>
        <div class="camera-controls">
          <button id="capturePhoto" class="capture-btn">Capture</button>
          <button id="retakePhoto" class="capture-btn" style="display: none;">Retake</button>
        </div>
      </div>
      <div id="imagePreview" class="image-preview"></div>
      <button id="analyzePhoto" class="analyze-btn" style="display: none;">Analyze Photo</button>
    </div>
  `;

  const takePhotoBtn = document.getElementById('takePhoto');
  const uploadPhotoInput = document.getElementById('uploadPhoto');
  const cameraContainer = document.querySelector('.camera-container');
  const video = document.getElementById('camera');
  const canvas = document.getElementById('photoCanvas');
  const captureBtn = document.getElementById('capturePhoto');
  const retakeBtn = document.getElementById('retakePhoto');
  const imagePreview = document.getElementById('imagePreview');
  const analyzeBtn = document.getElementById('analyzePhoto');
  let stream = null;
  let capturedImage = null;

  updateButton.addEventListener('click', () => {
    analysisForm.style.display = analysisForm.style.display === 'none' ? 'block' : 'none';
    if (analysisForm.style.display === 'none' && stream) {
      stopCamera();
    }
  });

  takePhotoBtn.addEventListener('click', async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
      cameraContainer.style.display = 'block';
      takePhotoBtn.style.display = 'none';
      document.querySelector('.capture-options').style.display = 'none';
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please try uploading a photo instead.');
    }
  });

  captureBtn.addEventListener('click', () => {
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    capturedImage = canvas.toDataURL('image/jpeg');
    imagePreview.innerHTML = `<img src="${capturedImage}" alt="Captured photo">`;
    imagePreview.style.display = 'block';
    captureBtn.style.display = 'none';
    retakeBtn.style.display = 'block';
    analyzeBtn.style.display = 'block';
    stopCamera();
  });

  retakeBtn.addEventListener('click', async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
      cameraContainer.style.display = 'block';
      imagePreview.style.display = 'none';
      captureBtn.style.display = 'block';
      retakeBtn.style.display = 'none';
      analyzeBtn.style.display = 'none';
      capturedImage = null;
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please try uploading a photo instead.');
    }
  });

  uploadPhotoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        capturedImage = e.target.result;
        imagePreview.innerHTML = `<img src="${capturedImage}" alt="Uploaded photo">`;
        imagePreview.style.display = 'block';
        analyzeBtn.style.display = 'block';
        document.querySelector('.capture-options').style.display = 'none';
      };
      reader.readAsDataURL(file);
    }
  });

  analyzeBtn.addEventListener('click', async () => {
    if (!capturedImage) {
      alert('Please capture or upload a photo first');
      return;
    }

    try {
      loadingIndicator.style.display = 'flex';
      resultsContent.style.display = 'none';
      analysisForm.style.display = 'none';

      // Upload image to Firebase Storage
      const user = firebase.auth().currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Convert base64 to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();

      const storageRef = firebase.storage().ref();
      const imageRef = storageRef.child(`body-images/${user.uid}/${Date.now()}.jpg`);
      await imageRef.put(blob);
      const imageUrl = await imageRef.getDownloadURL();

      // Analyze body
      const analysis = await analyzeBody(imageUrl);
      displayAnalysisResults(analysis);
    } catch (error) {
      console.error('Error during body analysis:', error);
      alert('An error occurred during analysis. Please try again.');
    } finally {
      loadingIndicator.style.display = 'none';
      resultsContent.style.display = 'grid';
    }
  });

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
      video.srcObject = null;
      cameraContainer.style.display = 'none';
    }
  }
}

function displayAnalysisResults(analysis) {
  const resultsContent = document.querySelector('.results-content');
  if (!resultsContent || !analysis) return;
  
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
        ${analysis.recommendations ? `
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
        ` : ''}
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

