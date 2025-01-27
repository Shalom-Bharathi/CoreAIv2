class DietDashboard {
  constructor() {
      this.db = firebase.firestore();
      this.auth = firebase.auth();
  }

  async loadDietPlan() {
      try {
          const user = this.auth.currentUser;
          if (!user) {
              window.location.href = '../../index.html';
              return;
          }

          // First try to get from 'dietPlans' collection
          let snapshot = await this.db.collection('dietPlans')
              .where('userId', '==', user.uid)
              .orderBy('timestamp', 'desc')
              .limit(1)
              .get();

          // If no data in 'dietPlans', try 'users' collection
          if (snapshot.empty) {
              const userDoc = await this.db.collection('users')
                  .doc(user.uid)
                  .get();
              
              if (userDoc.exists && userDoc.data().dietPlan) {
                  const rawData = userDoc.data().dietPlan;
                  console.log('Diet plan found in users collection:', rawData);
                  const dietPlan = rawData.diet_details || rawData;
                  this.renderDietPlan(dietPlan);
                  return;
              }
              
              this.showError('No diet plan found. Please generate a diet plan first.');
              setTimeout(() => {
                  window.location.href = '../generate-diets/index.html';
              }, 3000);
              return;
          }

          const rawData = snapshot.docs[0].data();
          console.log('Raw diet plan data:', rawData);
          
          const dietPlan = rawData.diet_details || rawData;
          console.log('Processed diet plan:', dietPlan);
          
          if (dietPlan) {
              this.renderDietPlan(dietPlan);
          } else {
              this.showError('Invalid diet plan format.');
          }
      } catch (error) {
          console.error('Error getting diet plan:', error);
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
          console.log('Rendering diet plan:', dietPlan); // Debug log

          // Update diet type and goal
          const dietTypeElement = document.querySelector('.diet-type');
          if (dietTypeElement) {
              dietTypeElement.textContent = `${dietPlan.diet_type || 'Custom Diet'} - ${dietPlan.diet_goal || 'Balanced Nutrition'}`;
          }

          // Update overview cards
          const caloriesElement = document.querySelector('.calories-value');
          if (caloriesElement) {
              caloriesElement.textContent = `${dietPlan.calories_per_day || 2000} kcal`;
          }
          
          // Update hydration with safe access
          const hydrationElement = document.querySelector('.hydration-value');
          if (hydrationElement) {
              // Check the hydration data structure
              console.log('Hydration data:', dietPlan.hydration_recommendation); // Debug log
              const hydrationValue = dietPlan.hydration_recommendation?.daily_water || 
                                   dietPlan.hydration_recommendation?.daily_intake || 
                                   '2-3 liters';
              hydrationElement.textContent = hydrationValue;
          }

          // Update macro rings with safe access
          const macroRings = document.querySelectorAll('.macro-ring');
          macroRings.forEach(ring => {
              const macroType = ring.getAttribute('data-macro');
              const macroData = dietPlan.macronutrient_split?.[macroType];
              console.log(`Macro data for ${macroType}:`, macroData); // Debug log
              const percentage = macroData?.percentage || 0;
              ring.style.setProperty('--percentage', `${percentage}%`);
              const percentageElement = ring.querySelector('.percentage');
              if (percentageElement) {
                  percentageElement.textContent = `${percentage}%`;
              }
          });

          // Update meal timeline
          const timelineContainer = document.querySelector('.meal-timeline');
          if (timelineContainer && dietPlan.meal_timing) {
              const mealTimings = Object.entries(dietPlan.meal_timing)
                  .filter(([key]) => !['snack_windows', 'fasting_window'].includes(key))
                  .map(([meal, time]) => ({
                      meal: meal.charAt(0).toUpperCase() + meal.slice(1),
                      time: time
                  }));

              timelineContainer.innerHTML = mealTimings.map(meal => `
                  <div class="meal-time">
                      <div class="meal-time-content">
                          <strong>${meal.time}</strong>
                          <span>${meal.meal}</span>
                      </div>
                  </div>
              `).join('');
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
                  .map(([outcome, value]) => {
                      if (value === true) {
                          return `
                              <div class="outcome-item">
                                  <svg xmlns="http://www.w3.org/2000/svg" class="outcome-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>
                                  <span>${outcome.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                              </div>
                          `;
                      }
                      return '';
                  }).join('');
          }

          // Update micronutrients
          const vitaminsContainer = document.querySelector('.vitamins-list');
          const mineralsContainer = document.querySelector('.minerals-list');

          if (vitaminsContainer && dietPlan.micronutrients?.vitamins) {
              const vitamins = Object.entries(dietPlan.micronutrients.vitamins).map(([name, sources]) => ({
                  name: `Vitamin ${name}`,
                  value: sources
              }));

              vitaminsContainer.innerHTML = vitamins.map(vitamin => `
                  <div class="nutrient-item">
                      <span class="nutrient-name">${vitamin.name}</span>
                      <span class="nutrient-value">${vitamin.value}</span>
                  </div>
              `).join('');
          }

          if (mineralsContainer && dietPlan.micronutrients?.minerals) {
              const minerals = Object.entries(dietPlan.micronutrients.minerals).map(([name, sources]) => ({
                  name: name.charAt(0).toUpperCase() + name.slice(1),
                  value: sources
              }));

              mineralsContainer.innerHTML = minerals.map(mineral => `
                  <div class="nutrient-item">
                      <span class="nutrient-name">${mineral.name}</span>
                      <span class="nutrient-value">${mineral.value}</span>
                  </div>
              `).join('');
          }

          // Update physical activity
          const activityRecommendation = document.querySelector('.activity-recommendation');
          if (activityRecommendation && dietPlan.physical_activity?.recommendation) {
              activityRecommendation.textContent = dietPlan.physical_activity.recommendation;
          }

          const suggestedActivities = document.querySelector('.suggested-activities');
          if (suggestedActivities && dietPlan.physical_activity?.suggested_activities) {
              suggestedActivities.innerHTML = dietPlan.physical_activity.suggested_activities
                  .map(activity => `<span class="activity-tag">${activity}</span>`).join('');
          }

      } catch (error) {
          console.error('Error rendering diet plan:', error);
          console.log('Problematic diet plan data:', JSON.stringify(dietPlan, null, 2));
          this.showError('Error displaying diet plan information.');
      }
  }
}

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new DietDashboard();
    dashboard.loadDietPlan();
});

// Initialize Firebase Auth
const auth = firebase.auth();

// Handle logout
document.getElementById('logoutButton').addEventListener('click', () => {
  auth.signOut().then(() => {
    window.location.href = '../../index.html';
  });
});

// Get latest diet plan for current user
async function getLatestDietPlan() {
  const user = auth.currentUser;
  if (!user) return null;

  try {
    const snapshot = await db.collection('dietPlans')
      .where('userId', '==', user.uid)
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    return snapshot.docs[0].data();
  } catch (error) {
    console.error('Error fetching diet plan:', error);
    return null;
  }
}

// Update UI with diet plan data
async function updateUI() {
  const dietPlan = await getLatestDietPlan();
  if (!dietPlan) {
    window.location.href = '../generate-diets/index.html';
    return;
  }

  // Update diet type
  document.querySelector('.diet-type').textContent = dietPlan.diet_type;
  
  // Update calories
  document.querySelector('.calories-value').textContent = `${dietPlan.calories_per_day} kcal`;
  
  // Update hydration
  document.querySelector('.hydration-value').textContent = dietPlan.hydration_recommendation.daily_intake;

  // Update macronutrient rings
  const macros = dietPlan.macronutrient_split;
  updateMacroRing('carbohydrates', macros.carbohydrates.percentage);
  updateMacroRing('proteins', macros.proteins.percentage);
  updateMacroRing('fats', macros.fats.percentage);

  // Update macro sources
  const macroSources = document.querySelector('.macro-sources');
  macroSources.innerHTML = `
    <div class="macro-source">
      <h4>Carbs</h4>
      <ul>${macros.carbohydrates.source_examples.map(source => `<li>${source}</li>`).join('')}</ul>
    </div>
    <div class="macro-source">
      <h4>Proteins</h4>
      <ul>${macros.proteins.source_examples.map(source => `<li>${source}</li>`).join('')}</ul>
    </div>
    <div class="macro-source">
      <h4>Fats</h4>
      <ul>${macros.fats.source_examples.map(source => `<li>${source}</li>`).join('')}</ul>
    </div>
  `;

  // Update guidelines
  const dosList = document.querySelector('.dos-list');
  const dontsList = document.querySelector('.donts-list');
  const specialTipsList = document.querySelector('.special-tips-list');

  dosList.innerHTML = dietPlan.additional_guidelines.dos.map(item => `<li>${item}</li>`).join('');
  dontsList.innerHTML = dietPlan.additional_guidelines.donts.map(item => `<li>${item}</li>`).join('');
  specialTipsList.innerHTML = dietPlan.additional_guidelines.special_tips.map(tip => `<li class="special-tip">${tip}</li>`).join('');

  // Update vitamins and minerals
  const vitaminsList = document.querySelector('.vitamins-list');
  const mineralsList = document.querySelector('.minerals-list');

  vitaminsList.innerHTML = Object.entries(dietPlan.micronutrients.vitamins)
    .map(([vitamin, source]) => `
      <div class="nutrient-item">
        <span class="nutrient-name">Vitamin ${vitamin}</span>
        <span class="nutrient-value">${source}</span>
      </div>
    `).join('');

  mineralsList.innerHTML = Object.entries(dietPlan.micronutrients.minerals)
    .map(([mineral, source]) => `
      <div class="nutrient-item">
        <span class="nutrient-name">${mineral}</span>
        <span class="nutrient-value">${source}</span>
      </div>
    `).join('');

  // Update outcomes
  const outcomesGrid = document.querySelector('.outcomes-grid');
  outcomesGrid.innerHTML = Object.entries(dietPlan.expected_outcomes)
    .map(([outcome, isExpected]) => `
      <div class="outcome-item ${isExpected ? 'active' : ''}">
        <svg class="outcome-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          ${isExpected ? '<path d="M20 6L9 17l-5-5"/>' : '<path d="M18 6L6 18M6 6l12 12"/>'}
        </svg>
        <span>${outcome.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
      </div>
    `).join('');

  // Update physical activity
  const activityRecommendation = document.querySelector('.activity-recommendation');
  const suggestedActivities = document.querySelector('.suggested-activities');

  activityRecommendation.innerHTML = `<p>${dietPlan.physical_activity.recommendation}</p>`;
  suggestedActivities.innerHTML = dietPlan.physical_activity.suggested_activities
    .map(activity => `<div class="activity-tag">${activity}</div>`).join('');
}

// Helper function to update macro rings
function updateMacroRing(macro, percentage) {
  const ring = document.querySelector(`[data-macro="${macro}"]`);
  if (ring) {
    ring.style.setProperty('--percentage', `${percentage}%`);
    ring.querySelector('.percentage').textContent = `${percentage}%`;
  }
}

// Initialize the page
auth.onAuthStateChanged(user => {
  if (user) {
    updateUI();
  } else {
    window.location.href = '../../index.html';
  }
});