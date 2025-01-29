import { auth, firestore, storage } from './firebase-config.js';
import { analyzeBody } from './body-analysis.js';

// Data
const data = {
  weekly: [
    { name: 'Mon', value: 65, calories: 2100, steps: 8000 },
    { name: 'Tue', value: 75, calories: 2300, steps: 10000 },
    { name: 'Wed', value: 85, calories: 2500, steps: 12000 },
    { name: 'Thu', value: 70, calories: 2200, steps: 9000 },
    { name: 'Fri', value: 90, calories: 2600, steps: 11000 },
    { name: 'Sat', value: 80, calories: 2400, steps: 9500 },
    { name: 'Sun', value: 95, calories: 2700, steps: 13000 }
  ]
};

const recommendations = [
  { icon: 'trending-up', text: 'Increase cardio intensity by 10%' },
  { icon: 'dumbbell', text: 'Focus on upper body strength today' },
  { icon: 'heart', text: 'Take a recovery day tomorrow' },
  { icon: 'user', text: 'Update your fitness goals' }
];

// Chart Configuration
const chartConfig = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      }
    },
    y: {
      grid: {
        color: 'rgba(0, 0, 0, 0.1)'
      }
    }
  }
};

// Initialize Charts
function initializeCharts() {
  // Fitness Progress Chart
  const fitnessCtx = document.getElementById('fitnessChart').getContext('2d');
  new Chart(fitnessCtx, {
    type: 'line',
    data: {
      labels: data.weekly.map(d => d.name),
      datasets: [{
        data: data.weekly.map(d => d.value),
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      ...chartConfig,
      plugins: {
        ...chartConfig.plugins,
        tooltip: {
          callbacks: {
            label: (context) => `Progress: ${context.raw}%`
          }
        }
      }
    }
  });

  // Calories Chart
  const caloriesCtx = document.getElementById('caloriesChart').getContext('2d');
  new Chart(caloriesCtx, {
    type: 'bar',
    data: {
      labels: data.weekly.map(d => d.name),
      datasets: [{
        data: data.weekly.map(d => d.calories),
        backgroundColor: '#4f46e5'
      }]
    },
    options: chartConfig
  });

  // Steps Chart
  const stepsCtx = document.getElementById('stepsChart').getContext('2d');
  new Chart(stepsCtx, {
    type: 'line',
    data: {
      labels: data.weekly.map(d => d.name),
      datasets: [{
        data: data.weekly.map(d => d.steps),
        borderColor: '#22c55e',
        tension: 0.4
      }]
    },
    options: chartConfig
  });
}

// Populate Recommendations
function populateRecommendations() {
  const recommendationsList = document.querySelector('.recommendations-list');
  recommendations.forEach((rec, index) => {
    const item = document.createElement('div');
    item.className = 'recommendation-item fade-in';
    item.style.animationDelay = `${index * 100}ms`;
    
    item.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="recommendation-icon">
        ${getIconPath(rec.icon)}
      </svg>
      <span class="recommendation-text">${rec.text}</span>
    `;
    
    recommendationsList.appendChild(item);
  });
}

// Helper function to get icon paths
function getIconPath(icon) {
  const icons = {
    'trending-up': '<line x1="23" y1="6" x2="17" y2="12"></line><line x1="17" y1="12" x2="11" y2="6"></line><line x1="11" y1="6" x2="1" y2="16"></line>',
    'dumbbell': '<path d="m6.5 6.5 17.5 17.5"/><path d="m6.5 17.5 17.5-17.5"/><path d="m2 21 3-3"/><path d="m19 4 3-3"/><path d="m2 3 3 3"/><path d="m19 20 3 3"/>',
    'heart': '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    'user': '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>'
  };
  return icons[icon] || '';
}

// Animations
function initializeAnimations() {
  // Add fade-in animation to stat cards
  const statCards = document.querySelectorAll('.stat-card');
  statCards.forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
      card.style.transition = 'all 0.5s ease';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, index * 100);
  });

  // Add hover animations
  const buttons = document.querySelectorAll('button');
  buttons.forEach(button => {
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-2px)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
    });
  });

  // Sidebar link hover effects
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('mouseenter', () => {
      gsap.to(link, {
        x: 4,
        duration: 0.2,
        ease: 'power2.out'
      });
    });
    
    link.addEventListener('mouseleave', () => {
      gsap.to(link, {
        x: 0,
        duration: 0.2,
        ease: 'power2.out'
      });
    });
  });

  // Chart animations
  const chartCards = document.querySelectorAll('.chart-card');
  chartCards.forEach((card, index) => {
    gsap.from(card, {
      opacity: 0,
      y: 20,
      duration: 0.5,
      delay: 0.2 + (index * 0.1),
      ease: 'power2.out'
    });
  });
}

// Event Listeners
function initializeEventListeners() {
  // Chart period buttons
  const chartButtons = document.querySelectorAll('.chart-button');
  chartButtons.forEach(button => {
    button.addEventListener('click', () => {
      chartButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
    });
  });

  // Start Workout button
  const startWorkoutBtn = document.querySelector('.button-primary');
  startWorkoutBtn.addEventListener('click', () => {
    gsap.to(startWorkoutBtn, {
      scale: 0.95,
      duration: 0.1,
      yoyo: true,
      repeat: 1
    });
  });

  // Notification button
  const notificationBtn = document.querySelector('.notification-button');
  notificationBtn.addEventListener('click', () => {
    gsap.to(notificationBtn, {
      scale: 0.9,
      duration: 0.1,
      yoyo: true,
      repeat: 1
    });
  });
}

// Initialize everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeCharts();
  populateRecommendations();
  initializeAnimations();
  initializeEventListeners();
  
  // Check for body details when user is authenticated
  auth.onAuthStateChanged(user => {
    if (user) {
      checkBodyDetails();
    }
  });
});


let stream = null;
let selectedImage = null;

let API_KEY;
const thingsRef = firestore.collection('API');

const unsubscribe = thingsRef.onSnapshot(querySnapshot => {
  querySnapshot.docs.forEach(doc => {
    API_KEY = doc.data().API;
    console.log('API Key loaded:', API_KEY ? 'Key present' : 'Key missing');
  });
});

// Camera handling
window.toggleCamera = async () => {
  if (stream) {
    stopCamera();
    return;
  }

  try {
    stream = await navigator.mediaDevices.getUserMedia({ 
      video: { 
        facingMode: 'environment'
      } 
    });
    const cameraPreview = document.getElementById('camera-preview');
    cameraPreview.srcObject = stream;
    cameraPreview.play();
    cameraPreview.classList.remove('hidden');
    document.getElementById('camera-placeholder').classList.add('hidden');
    document.getElementById('image-preview-container').classList.add('hidden');
    document.getElementById('capture-button').classList.remove('hidden');
    document.getElementById('camera-toggle').innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
      </svg>
      Close Camera
    `;
    selectedImage = null;
    updateAnalyzeButton();
  } catch (err) {
    console.error('Error accessing camera:', err);
    alert('Unable to access camera. Please ensure you have granted camera permissions.');
  }
};

const stopCamera = () => {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
  document.getElementById('camera-preview').classList.add('hidden');
  document.getElementById('capture-button').classList.add('hidden');
  document.getElementById('camera-placeholder').classList.remove('hidden');
  document.getElementById('camera-toggle').innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
      <circle cx="12" cy="13" r="3"/>
    </svg>
    Open Camera
  `;
};

window.captureImage = () => {
  const cameraPreview = document.getElementById('camera-preview');
  const canvas = document.createElement('canvas');
  canvas.width = cameraPreview.videoWidth;
  canvas.height = cameraPreview.videoHeight;
  canvas.getContext('2d').drawImage(cameraPreview, 0, 0);
  selectedImage = canvas.toDataURL('image/jpeg');
  
  document.getElementById('image-preview').src = selectedImage;
  document.getElementById('image-preview-container').classList.remove('hidden');
  document.getElementById('camera-placeholder').classList.add('hidden');
  stopCamera();
  updateAnalyzeButton();
};

window.handleImageUpload = (event) => {
  const file = event.target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onloadend = () => {
      selectedImage = reader.result;
      document.getElementById('image-preview').src = selectedImage;
      document.getElementById('image-preview-container').classList.remove('hidden');
      document.getElementById('camera-placeholder').classList.add('hidden');
      stopCamera();
      updateAnalyzeButton();
    };
    reader.readAsDataURL(file);
  }
};

window.clearImage = () => {
  selectedImage = null;
  document.getElementById('image-preview-container').classList.add('hidden');
  document.getElementById('camera-placeholder').classList.remove('hidden');
  updateAnalyzeButton();
};

const updateAnalyzeButton = () => {
  const analyzeButton = document.getElementById('analyze-button');
  analyzeButton.disabled = !selectedImage;
  analyzeButton.className = `analyze-button ${!selectedImage ? 'disabled' : ''}`;
};

window.analyzeImage = async () => {
  if (!selectedImage) {
    alert('Please select or capture an image first.');
    return;
  }
  
  if (!API_KEY) {
    console.error('API key not found or invalid');
    alert('Unable to analyze image. API key not configured properly. Please check the console for more details.');
    return;
  }

  // Log API key format (safely)
  console.log('API Key format check:', {
    length: API_KEY?.length,
    prefix: API_KEY?.substring(0, 3),
    isString: typeof API_KEY === 'string'
  });

  const analyzeButton = document.getElementById('analyze-button');
  const loadingSpinner = document.getElementById('loading-spinner');
  const analyzeText = document.getElementById('analyze-text');
  const resultsSection = document.getElementById('results-section');

  // Show loading state
  analyzeButton.disabled = true;
  loadingSpinner.classList.remove('hidden');
  loadingSpinner.classList.add('flex');
  analyzeText.classList.add('hidden');
  resultsSection.classList.add('hidden');

  try {
    // Get the user's diet type from the diet plan
    const user = firebase.auth().currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    let dietType = 'balanced';
    try {
      const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
      const userData = userDoc.data();
      if (userData?.dietPlan?.diet_type) {
        dietType = userData.dietPlan.diet_type;
      }
    } catch (error) {
      console.warn('Error fetching diet type:', error);
      // Continue with default diet type
    }

    console.log('Making API request...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY.trim()}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this food image and provide a JSON response with the following information:
                {
                  "foodName": "name of the dish",
                  "ingredients": "list of main ingredients",
                  "calories": "estimated calories here",
                  "macronutrients": {
                    "protein": "protein amount",
                    "carbs": "carbs amount",
                    "fat": "fat amount"
                  },
                  "dietCompatibility": "compatibility with ${dietType} diet and explanation"
                }`
              },
              {
                type: "image_url",
                image_url: {
                  url: selectedImage
                }
              }
            ]
          }
        ],
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Response:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in response');
    }

    // Try to extract JSON from the response
    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      analysis = JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error parsing response:', error);
      throw new Error('Invalid response format');
    }
    
    // Update results with fade-in animation
    resultsSection.style.opacity = '0';
    resultsSection.classList.remove('hidden');
    
    // Update all result fields
    const updateField = (id, value, defaultValue = 'Unable to determine') => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = value || defaultValue;
      }
    };

    updateField('food-name-result', analysis.foodName);
    updateField('ingredients-result', analysis.ingredients);
    updateField('calories-result', analysis.calories);
    updateField('protein-result', analysis.macronutrients?.protein, 'N/A');
    updateField('carbs-result', analysis.macronutrients?.carbs, 'N/A');
    updateField('fat-result', analysis.macronutrients?.fat, 'N/A');
    updateField('diet-result', analysis.dietCompatibility);
    
    // Trigger reflow for animation
    resultsSection.offsetHeight;
    resultsSection.style.transition = 'opacity 0.3s ease-in-out';
    resultsSection.style.opacity = '1';
  } catch (error) {
    console.error('Error analyzing image:', error);
    
    // Show error message to user
    alert(`Error analyzing image: ${error.message}`);
    
    // Show fallback results
    resultsSection.style.opacity = '0';
    resultsSection.classList.remove('hidden');
    
    const fields = ['food-name-result', 'ingredients-result', 'calories-result', 
                   'protein-result', 'carbs-result', 'fat-result', 'diet-result'];
    fields.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = id.includes('result') ? 'N/A' : 'Unable to determine';
      }
    });
    
    // Trigger reflow for animation
    resultsSection.offsetHeight;
    resultsSection.style.transition = 'opacity 0.3s ease-in-out';
    resultsSection.style.opacity = '1';
  } finally {
    // Reset loading state
    analyzeButton.disabled = false;
    loadingSpinner.classList.add('hidden');
    loadingSpinner.classList.remove('flex');
    analyzeText.classList.remove('hidden');
    updateAnalyzeButton();
  }
};

let bodyStream = null;
let selectedBodyImage = null;

// Body Camera handling
window.toggleBodyCamera = async () => {
  if (bodyStream) {
    stopBodyCamera();
    return;
  }

  try {
    bodyStream = await navigator.mediaDevices.getUserMedia({ 
      video: { 
        facingMode: 'environment'
      } 
    });
    const cameraPreview = document.getElementById('body-camera-preview');
    cameraPreview.srcObject = bodyStream;
    cameraPreview.play();
    cameraPreview.classList.remove('hidden');
    document.getElementById('body-camera-placeholder').classList.add('hidden');
    document.getElementById('body-image-preview-container').classList.add('hidden');
    document.getElementById('body-capture-button').classList.remove('hidden');
    document.getElementById('body-camera-toggle').innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
      </svg>
      Close Camera
    `;
    selectedBodyImage = null;
    updateAnalyzeBodyButton();
  } catch (err) {
    console.error('Error accessing camera:', err);
    alert('Unable to access camera. Please ensure you have granted camera permissions.');
  }
};

const stopBodyCamera = () => {
  if (bodyStream) {
    bodyStream.getTracks().forEach(track => track.stop());
    bodyStream = null;
  }
  document.getElementById('body-camera-preview').classList.add('hidden');
  document.getElementById('body-capture-button').classList.add('hidden');
  document.getElementById('body-camera-placeholder').classList.remove('hidden');
  document.getElementById('body-camera-toggle').innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
      <circle cx="12" cy="13" r="3"/>
    </svg>
    Open Camera
  `;
};

window.captureBodyImage = () => {
  const cameraPreview = document.getElementById('body-camera-preview');
  const canvas = document.createElement('canvas');
  canvas.width = cameraPreview.videoWidth;
  canvas.height = cameraPreview.videoHeight;
  canvas.getContext('2d').drawImage(cameraPreview, 0, 0);
  selectedBodyImage = canvas.toDataURL('image/jpeg');
  
  document.getElementById('body-image-preview').src = selectedBodyImage;
  document.getElementById('body-image-preview-container').classList.remove('hidden');
  document.getElementById('body-camera-placeholder').classList.add('hidden');
  stopBodyCamera();
  updateAnalyzeBodyButton();
};

window.handleBodyImageUpload = (event) => {
  const file = event.target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onloadend = () => {
      selectedBodyImage = reader.result;
      document.getElementById('body-image-preview').src = selectedBodyImage;
      document.getElementById('body-image-preview-container').classList.remove('hidden');
      document.getElementById('body-camera-placeholder').classList.add('hidden');
      stopBodyCamera();
      updateAnalyzeBodyButton();
    };
    reader.readAsDataURL(file);
  }
};

window.clearBodyImage = () => {
  selectedBodyImage = null;
  document.getElementById('body-image-preview-container').classList.add('hidden');
  document.getElementById('body-camera-placeholder').classList.remove('hidden');
  updateAnalyzeBodyButton();
};

const updateAnalyzeBodyButton = () => {
  const analyzeButton = document.getElementById('analyze-body-button');
  analyzeButton.disabled = !selectedBodyImage;
  analyzeButton.className = `analyze-button ${!selectedBodyImage ? 'disabled' : ''}`;
};

window.analyzeBodyImage = async () => {
  if (!selectedBodyImage) {
    alert('Please select or capture an image first.');
    return;
  }

  const analyzeButton = document.getElementById('analyze-body-button');
  const loadingSpinner = document.getElementById('body-loading-spinner');
  const analyzeText = document.getElementById('analyze-body-text');

  // Show loading state
  analyzeButton.disabled = true;
  loadingSpinner.classList.remove('hidden');
  loadingSpinner.classList.add('flex');
  analyzeText.classList.add('hidden');

  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Upload image to Firebase Storage
    const storageRef = storage.ref();
    const imageRef = storageRef.child(`body-analysis/${user.uid}/${Date.now()}.jpg`);
    
    // Convert base64 to blob
    const response = await fetch(selectedBodyImage);
    const blob = await response.blob();
    
    // Upload image
    const snapshot = await imageRef.put(blob);
    const imageUrl = await snapshot.ref.getDownloadURL();

    // Analyze the image
    const analysis = await analyzeBody(imageUrl);
    
    // Store analysis in Firestore
    await firestore.collection('users').doc(user.uid).collection('bodyAnalysis').add({
      analysis,
      imageUrl,
      timestamp: new Date()
    });

    // Close the modal
    const modal = document.getElementById('bodyAnalysisModal');
    if (modal) {
      modal.remove();
    }

    // Refresh the dashboard or show success message
    alert('Body analysis completed successfully!');
    location.reload(); // Refresh to update dashboard with new data
  } catch (error) {
    console.error('Error analyzing body:', error);
    alert('Error analyzing body image. Please try again.');
  } finally {
    // Reset loading state
    analyzeButton.disabled = false;
    loadingSpinner.classList.add('hidden');
    loadingSpinner.classList.remove('flex');
    analyzeText.classList.remove('hidden');
  }
};

function displayBodyAnalysis(analysis) {
  const resultsSection = document.getElementById('body-analysis-results');
  
  // Update basic fields
  document.getElementById('body-type-result').textContent = analysis.bodyType || '-';
  document.getElementById('muscle-definition-result').textContent = analysis.muscleDefinition || '-';
  
  // Update muscle distribution
  document.getElementById('upper-body-muscle-result').textContent = analysis.muscleDistribution?.upperBody || '-';
  document.getElementById('core-muscle-result').textContent = analysis.muscleDistribution?.core || '-';
  document.getElementById('lower-body-muscle-result').textContent = analysis.muscleDistribution?.lowerBody || '-';
  
  // Update fat distribution
  document.getElementById('upper-body-fat-result').textContent = analysis.fatDistribution?.upperBody || '-';
  document.getElementById('core-fat-result').textContent = analysis.fatDistribution?.core || '-';
  document.getElementById('lower-body-fat-result').textContent = analysis.fatDistribution?.lowerBody || '-';
  
  // Update metrics
  document.getElementById('body-fat-result').textContent = analysis.estimatedBodyFatPercentage || '-';
  document.getElementById('biological-age-result').textContent = analysis.estimatedBiologicalAge || '-';
  document.getElementById('height-result').textContent = analysis.estimatedMeasurements?.height || '-';
  document.getElementById('weight-result').textContent = analysis.estimatedMeasurements?.weight || '-';
  
  // Update recommendations
  const updateRecommendations = (elementId, recommendations) => {
    const element = document.getElementById(elementId);
    if (element && Array.isArray(recommendations)) {
      element.innerHTML = recommendations
        .map(rec => `<li class="recommendation-item">${rec}</li>`)
        .join('');
    }
  };
  
  updateRecommendations('training-recommendations', analysis.recommendations?.training);
  updateRecommendations('nutrition-recommendations', analysis.recommendations?.nutrition);
  updateRecommendations('posture-recommendations', analysis.recommendations?.posture);
  
  // Show results with animation
  resultsSection.style.opacity = '0';
  resultsSection.classList.remove('hidden');
  requestAnimationFrame(() => {
    resultsSection.style.transition = 'opacity 0.5s ease-in-out';
    resultsSection.style.opacity = '1';
  });
}

// Check if user has body details and show analysis form if needed
async function checkBodyDetails() {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const bodyAnalysisRef = firestore.collection('users').doc(user.uid).collection('bodyAnalysis');
    const latestAnalysis = await bodyAnalysisRef.orderBy('timestamp', 'desc').limit(1).get();

    if (latestAnalysis.empty) {
      showBodyAnalysisForm();
    }
  } catch (error) {
    console.error('Error checking body details:', error);
  }
}

function showBodyAnalysisForm() {
  const modalHtml = `
    <div class="modal" id="bodyAnalysisModal">
      <div class="modal-content">
        <h2>Complete Your Profile</h2>
        <p>Please take or upload a photo for body analysis to get personalized recommendations</p>
        
        <div class="analysis-container">
          <!-- Camera/Image Preview Area -->
          <div class="preview-area">
            <video id="body-camera-preview" class="hidden" autoplay playsinline></video>
            
            <div id="body-image-preview-container" class="hidden">
              <img id="body-image-preview" alt="Body preview">
              <button onclick="clearBodyImage()" class="clear-button" aria-label="Clear image">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                </svg>
              </button>
            </div>

            <div id="body-camera-placeholder" class="camera-placeholder">
              <div class="placeholder-content">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                  <circle cx="12" cy="13" r="3"/>
                </svg>
                <p>Take a photo or upload an image for body analysis</p>
              </div>
            </div>
          </div>

          <!-- Controls -->
          <div class="controls-section">
            <div class="button-group">
              <button onclick="toggleBodyCamera()" id="body-camera-toggle" class="control-button" aria-label="Toggle camera">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                  <circle cx="12" cy="13" r="3"/>
                </svg>
                <span>Open Camera</span>
              </button>
              
              <button id="body-capture-button" onclick="captureBodyImage()" class="control-button hidden" aria-label="Capture photo">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <span>Capture</span>
              </button>

              <label class="upload-button">
                <input type="file" accept="image/*" onchange="handleBodyImageUpload(event)" class="hidden">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <span>Upload Image</span>
              </label>
            </div>

            <button onclick="analyzeBodyImage()" id="analyze-body-button" disabled class="analyze-button">
              <div id="body-loading-spinner" class="hidden">
                <svg class="animate-spin" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
              </div>
              <span id="analyze-body-text">Analyze Body</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Add modal to the page
  document.body.insertAdjacentHTML('beforeend', modalHtml);
} 