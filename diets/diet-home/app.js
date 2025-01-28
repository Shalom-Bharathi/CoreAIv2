class DietDashboard {
  constructor(user) {
    if (!user) {
      console.error('DietDashboard requires a user');
      return;
    }
    
    this.user = user;
    this.db = firebase.firestore();
    this.setupEventListeners();
    this.loadDietPlan();
  }

  setupEventListeners() {
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
      logoutButton.addEventListener('click', () => {
        firebase.auth().signOut().then(() => {
          window.location.href = '../../index.html';
        }).catch((error) => {
          console.error('Logout error:', error);
        });
      });
    }
  }

  async loadDietPlan() {
    try {
      console.log('Loading diet plan for user:', this.user.email);

      // First try to get from users collection
      const userDoc = await this.db.collection('users')
        .doc(this.user.uid)
        .get();

      let dietPlan = null;

      if (userDoc.exists) {
        const userData = userDoc.data();
        console.log('User document data:', userData);
        
        if (userData.dietPlan) {
          console.log('Diet plan found in users collection');
          dietPlan = userData.dietPlan;
          if (dietPlan.diet_details) {
            console.log('Using diet_details from plan');
            dietPlan = dietPlan.diet_details;
          }
        }
      }

      // If not found in users collection, try dietPlan collection
      if (!dietPlan) {
        console.log('Checking dietPlan collection...');
        const snapshot = await this.db.collection('dietPlan')
          .where('userId', '==', this.user.uid)
          .orderBy('timestamp', 'desc')
          .limit(1)
          .get();

        console.log('DietPlan query result:', !snapshot.empty ? 'Found' : 'Not found');

        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          console.log('Diet plan found in dietPlan collection:', data);
          dietPlan = data.diet_details || data;
        }
      }

      if (dietPlan) {
        console.log('Final diet plan to render:', dietPlan);
        this.renderDietPlan(dietPlan);
      } else {
        console.log('No diet plan found, redirecting to generate diet...');
        this.showError('No diet plan found. Please generate a diet plan first.');
        setTimeout(() => {
          window.location.href = '../generate-diets/index.html';
        }, 3000);
      }

    } catch (error) {
      console.error('Error loading diet plan:', error);
      this.showError('Failed to load diet plan. Please try again later.');
    }
  }

  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.querySelector('.diet-container').prepend(errorDiv);
  }

  renderDietPlan(dietPlan) {
    try {
      // Update diet type, name and description
      const dietTypeElement = document.querySelector('.diet-type');
      if (dietTypeElement) {
        const dietName = dietPlan.name || dietPlan.diet_type || 'Custom Diet';
        const dietGoal = dietPlan.description || dietPlan.diet_goal || 'Balanced Nutrition';
        dietTypeElement.innerHTML = `
          <h2>${dietName}</h2>
          <p>${dietGoal}</p>
        `;
      }

      // Update calories
      const caloriesElement = document.querySelector('.calories-value');
      if (caloriesElement) {
        caloriesElement.textContent = `${dietPlan.calories_per_day || 2000} kcal`;
      }

      // Update hydration
      const hydrationElement = document.querySelector('.hydration-value');
      if (hydrationElement) {
        const hydrationValue = dietPlan.hydration_recommendation?.daily_water || 
                             dietPlan.hydration_recommendation?.daily_intake || 
                             '2-3 liters';
        hydrationElement.textContent = hydrationValue;
      }

      // Update macro rings
      const macroRings = document.querySelectorAll('.macro-ring');
      macroRings.forEach(ring => {
        const macroType = ring.getAttribute('data-macro');
        const macroData = dietPlan.macronutrient_split?.[macroType];
        if (macroData) {
          const percentage = macroData.percentage || 0;
          ring.style.setProperty('--percentage', `${percentage}%`);
          const percentageElement = ring.querySelector('.percentage');
          if (percentageElement) {
            percentageElement.textContent = `${percentage}%`;
          }
        }
      });

      // Update macro sources
      const macroSources = document.querySelector('.macro-sources');
      if (macroSources && dietPlan.macronutrient_split) {
        const macros = dietPlan.macronutrient_split;
        macroSources.innerHTML = `
          <div class="macro-source">
            <h4>Carbs</h4>
            <ul>${macros.carbohydrates?.source_examples?.map(source => `<li>${source}</li>`).join('') || ''}</ul>
          </div>
          <div class="macro-source">
            <h4>Proteins</h4>
            <ul>${macros.proteins?.source_examples?.map(source => `<li>${source}</li>`).join('') || ''}</ul>
          </div>
          <div class="macro-source">
            <h4>Fats</h4>
            <ul>${macros.fats?.source_examples?.map(source => `<li>${source}</li>`).join('') || ''}</ul>
          </div>
        `;
      }

      // Update guidelines
      const dosContainer = document.querySelector('.dos-list');
      const dontsContainer = document.querySelector('.donts-list');

      if (dosContainer && dietPlan.additional_guidelines?.dos) {
        dosContainer.innerHTML = dietPlan.additional_guidelines.dos
          .map(item => `<li>${item}</li>`).join('');
      }

      if (dontsContainer && dietPlan.additional_guidelines?.donts) {
        dontsContainer.innerHTML = dietPlan.additional_guidelines.donts
          .map(item => `<li>${item}</li>`).join('');
      }

      // Update special tips
      const specialTipsList = document.querySelector('.special-tips-list');
      if (specialTipsList && dietPlan.additional_guidelines?.special_tips) {
        specialTipsList.innerHTML = dietPlan.additional_guidelines.special_tips
          .map(tip => `<li class="special-tip">${tip}</li>`).join('');
      }

      // Update expected outcomes
      const outcomesGrid = document.querySelector('.outcomes-grid');
      if (outcomesGrid && dietPlan.expected_outcomes) {
        outcomesGrid.innerHTML = Object.entries(dietPlan.expected_outcomes)
          .map(([outcome, isExpected]) => `
            <div class="outcome-item ${isExpected ? 'active' : ''}">
              <svg class="outcome-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                ${isExpected ? '<path d="M20 6L9 17l-5-5"/>' : '<path d="M18 6L6 18M6 6l12 12"/>'}
              </svg>
              <span>${outcome.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
            </div>
          `).join('');
      }

      // Update micronutrients
      const vitaminsContainer = document.querySelector('.vitamins-list');
      const mineralsContainer = document.querySelector('.minerals-list');

      if (vitaminsContainer && dietPlan.micronutrients?.vitamins) {
        vitaminsContainer.innerHTML = Object.entries(dietPlan.micronutrients.vitamins)
          .map(([vitamin, source]) => `
            <div class="nutrient-item">
              <span class="nutrient-name">Vitamin ${vitamin}</span>
              <span class="nutrient-value">${source}</span>
            </div>
          `).join('');
      }

      if (mineralsContainer && dietPlan.micronutrients?.minerals) {
        mineralsContainer.innerHTML = Object.entries(dietPlan.micronutrients.minerals)
          .map(([mineral, source]) => `
            <div class="nutrient-item">
              <span class="nutrient-name">${mineral.charAt(0).toUpperCase() + mineral.slice(1)}</span>
              <span class="nutrient-value">${source}</span>
            </div>
          `).join('');
      }

      // Update physical activity
      const activityRecommendation = document.querySelector('.activity-recommendation');
      const suggestedActivities = document.querySelector('.suggested-activities');

      if (activityRecommendation && dietPlan.physical_activity?.recommendation) {
        activityRecommendation.innerHTML = `<p>${dietPlan.physical_activity.recommendation}</p>`;
      }

      if (suggestedActivities && dietPlan.physical_activity?.suggested_activities) {
        suggestedActivities.innerHTML = dietPlan.physical_activity.suggested_activities
          .map(activity => `<div class="activity-tag">${activity}</div>`).join('');
      }

    } catch (error) {
      console.error('Error rendering diet plan:', error);
      console.log('Problematic diet plan data:', JSON.stringify(dietPlan, null, 2));
      this.showError('Error displaying diet plan information.');
    }
  }
}

// Initialize the dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM Content Loaded - Dashboard ready for initialization');
});

function renderDietaryGuidelines(guidelines) {
  const container = document.getElementById('dietaryGuidelines');
  container.innerHTML = '';
  guidelines.forEach(guideline => {
    const item = document.createElement('div');
    item.className = 'guideline-item fade-in';
    item.innerHTML = `
      <svg class="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <span>${guideline}</span>
    `;
    container.appendChild(item);
  });
}

function renderSpecialTips(tips) {
  const container = document.getElementById('specialTips');
  container.innerHTML = '';
  tips.forEach(tip => {
    const item = document.createElement('div');
    item.className = 'tip-item fade-in';
    item.innerHTML = `
      <svg class="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <span>${tip}</span>
    `;
    container.appendChild(item);
  });
}

function renderDailyVitamins(vitamins) {
  const container = document.getElementById('dailyVitamins');
  container.className = 'nutrient-grid';
  container.innerHTML = '';
  Object.entries(vitamins).forEach(([vitamin, amount]) => {
    const item = document.createElement('div');
    item.className = 'nutrient-item fade-in';
    item.innerHTML = `
      <h4>${vitamin}</h4>
      <p>${amount}</p>
    `;
    container.appendChild(item);
  });
}

function renderDailyMinerals(minerals) {
  const container = document.getElementById('dailyMinerals');
  container.className = 'nutrient-grid';
  container.innerHTML = '';
  Object.entries(minerals).forEach(([mineral, amount]) => {
    const item = document.createElement('div');
    item.className = 'nutrient-item fade-in';
    item.innerHTML = `
      <h4>${mineral}</h4>
      <p>${amount}</p>
    `;
    container.appendChild(item);
  });
}

function renderExpectedOutcomes(outcomes) {
  const container = document.getElementById('expectedOutcomes');
  container.innerHTML = '';
  outcomes.forEach(outcome => {
    const item = document.createElement('div');
    item.className = 'outcome-item fade-in';
    item.innerHTML = `
      <svg class="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <span>${outcome}</span>
    `;
    container.appendChild(item);
  });
}

function renderPhysicalActivityPlan(activities) {
  const container = document.getElementById('physicalActivityPlan');
  container.innerHTML = '';
  activities.forEach(activity => {
    const item = document.createElement('div');
    item.className = 'activity-item fade-in';
    item.innerHTML = `
      <svg class="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
      </svg>
      <span>${activity}</span>
    `;
    container.appendChild(item);
  });
}

// Initialize OpenAI with API key from Firebase
let openaiClient = null;

async function initializeOpenAI() {
  const apiSnapshot = await firebase.firestore().collection('API').get();
  let API_KEY = null;
  apiSnapshot.forEach(doc => {
    API_KEY = doc.data().API;
  });

  if (!API_KEY) {
    throw new Error('API key not found');
  }

  openaiClient = new OpenAI({
    apiKey: API_KEY,
    dangerouslyAllowBrowser: true
  });
}

// DOM Elements
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('image-preview');
const previewImg = document.getElementById('previewImg');
const analyzeButton = document.getElementById('analyze-button');
const loadingSpinner = document.getElementById('loading-spinner');
const analyzeText = document.getElementById('analyze-text');
const resultsSection = document.getElementById('results-section');

let selectedImage = null;

// Initialize OpenAI when the page loads
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await initializeOpenAI();
    console.log('OpenAI client initialized');
  } catch (error) {
    console.error('Error initializing OpenAI client:', error);
  }
});

// Handle image upload
window.handleImageUpload = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    alert('Please select an image file');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    if (!e.target?.result) return;
    
    selectedImage = e.target.result;
    if (previewImg && imagePreview) {
      previewImg.src = selectedImage;
      imagePreview.classList.remove('hidden');
      if (analyzeButton) {
        analyzeButton.disabled = false;
      }
    }
  };
  reader.onerror = () => {
    alert('Error reading file');
    console.error('FileReader error:', reader.error);
  };
  reader.readAsDataURL(file);
};

// Clear the selected image
window.clearImage = () => {
  selectedImage = null;
  if (imagePreview) {
    imagePreview.classList.add('hidden');
  }
  if (imageInput) {
    imageInput.value = '';
  }
  if (analyzeButton) {
    analyzeButton.disabled = true;
  }
  if (resultsSection) {
    resultsSection.classList.add('hidden');
  }
};

// Analyze the image
window.analyzeImage = async () => {
  if (!selectedImage) {
    alert('Please select an image first');
    return;
  }

  if (!openaiClient) {
    alert('OpenAI client not initialized. Please try again.');
    return;
  }

  try {
    // Show loading state
    if (analyzeButton) analyzeButton.disabled = true;
    if (loadingSpinner) loadingSpinner.classList.remove('hidden');
    if (analyzeText) analyzeText.classList.add('hidden');
    if (resultsSection) resultsSection.classList.add('hidden');

    // Get user's diet type from Firebase
    const user = firebase.auth().currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    let dietType = 'balanced';
    const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
    const userData = userDoc.data();
    if (userData?.dietPlan?.diet_type) {
      dietType = userData.dietPlan.diet_type;
    }

    // Make API request to OpenAI
    const response = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
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
                "calories": "estimated calories",
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
      store: true
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in response');
    }

    // Parse the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    const analysis = JSON.parse(jsonMatch[0]);

    // Create results HTML
    const resultsHTML = `
      <div class="results-content">
        <div class="result-item">
          <h3>Food Name</h3>
          <p>${analysis.foodName}</p>
        </div>
        <div class="result-item">
          <h3>Ingredients</h3>
          <p>${analysis.ingredients}</p>
        </div>
        <div class="result-item">
          <h3>Calories</h3>
          <p>${analysis.calories}</p>
        </div>
        <div class="result-item">
          <h3>Macronutrients</h3>
          <div class="macro-grid">
            <div class="macro-item">
              <span class="label">Protein</span>
              <span class="value">${analysis.macronutrients.protein}</span>
            </div>
            <div class="macro-item">
              <span class="label">Carbs</span>
              <span class="value">${analysis.macronutrients.carbs}</span>
            </div>
            <div class="macro-item">
              <span class="label">Fat</span>
              <span class="value">${analysis.macronutrients.fat}</span>
            </div>
          </div>
        </div>
        <div class="result-item">
          <h3>Diet Compatibility</h3>
          <p>${analysis.dietCompatibility}</p>
        </div>
      </div>
    `;

    // Update results
    if (resultsSection) {
      resultsSection.innerHTML = resultsHTML;
      resultsSection.classList.remove('hidden');
      resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

  } catch (error) {
    console.error('Error analyzing image:', error);
    alert('Error analyzing image. Please try again.');
  } finally {
    // Reset button state
    if (analyzeButton) analyzeButton.disabled = false;
    if (loadingSpinner) loadingSpinner.classList.add('hidden');
    if (analyzeText) analyzeText.classList.remove('hidden');
  }
};