// Global OpenAI client
let openaiClient = null;

class DietDashboard {
  constructor(user) {
    if (!user) {
      console.error('DietDashboard requires a user');
      return;
    }
    
    this.user = user;
    this.db = firebase.firestore();
    this.initialize();
  }

  async initialize() {
    try {
      console.log('Initializing dashboard...');
      await this.setupEventListeners();
      await this.loadDietPlan();
      console.log('Dashboard initialization complete');
    } catch (error) {
      console.error('Error initializing dashboard:', error);
    }
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
      const dietPlanDoc = await this.db.collection('users').doc(this.user.uid).get();
      const dietPlan = dietPlanDoc.data()?.dietPlan;
      
      if (dietPlan) {
        this.renderDietPlan(dietPlan);
      } else {
        console.log('No diet plan found for user');
      }
    } catch (error) {
      console.error('Error loading diet plan:', error);
    }
  }

  renderDietPlan(dietPlan) {
    try {
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

  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.querySelector('.diet-container').prepend(errorDiv);
  }
}

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