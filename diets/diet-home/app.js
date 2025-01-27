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