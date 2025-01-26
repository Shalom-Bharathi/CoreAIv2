class DietDashboard {
  constructor() {
      this.db = firebase.firestore();
  }

  async loadDietPlan() {
      try {
          const snapshot = await this.db.collection('dietPlans')
              .orderBy('timestamp', 'desc')
              .limit(1)
              .get();
          if (!snapshot.empty) {
              const dietPlan = snapshot.docs[0].data();
              console.log('Diet plan found:', dietPlan.diet_details);
              this.renderDietPlan(dietPlan);
          } else {
              this.showError('No diet plan found. Please generate a diet plan first.');
              setTimeout(() => {
                  window.location.href = '../generate-diets/index.html';
              }, 3000);
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
          // Update diet type
          const dietTypeElement = document.querySelector('.diet-type');
          if (dietTypeElement) {
              dietTypeElement.textContent = dietPlan.diet_details.diet_goal || 'Custom Diet Plan';
          }

          // Update overview cards
          const caloriesElement = document.querySelector('.calories-value');
          if (caloriesElement) {
              caloriesElement.textContent = `${dietPlan.diet_details.expected_outcomes?.daily_calories || '2000'} kcal`;
          }

          const hydrationElement = document.querySelector('.hydration-value');
          if (hydrationElement) {
              hydrationElement.textContent = dietPlan.diet_details.hydration_recommendation?.daily_water || '2L';
          }

          // Update macro rings
          const macroRings = document.querySelectorAll('.macro-ring');
          const macroSplit = {
              carbohydrates: 40,
              proteins: 30,
              fats: 30,
              ...dietPlan.diet_details.macronutrients
          };

          macroRings.forEach(ring => {
              const macroType = ring.getAttribute('data-macro');
              const percentage = macroSplit[macroType] || 0;
              ring.style.setProperty('--percentage', `${percentage}%`);
              const percentageElement = ring.querySelector('.percentage');
              if (percentageElement) {
                  percentageElement.textContent = `${percentage}%`;
              }
          });

          // Update meal timeline
          const timelineContainer = document.querySelector('.meal-timeline');
          if (timelineContainer && dietPlan.diet_details.meal_timing) {
              const mealTimings = Object.entries(dietPlan.diet_details.meal_timing).map(([time, meal]) => ({
                  time,
                  meal
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

          if (dosContainer && dietPlan.diet_details.recommendations?.dos) {
              dosContainer.innerHTML = dietPlan.diet_details.recommendations.dos.map(item => `
                  <li>${item}</li>
              `).join('');
          }

          if (dontsContainer && dietPlan.diet_details.recommendations?.donts) {
              dontsContainer.innerHTML = dietPlan.diet_details.recommendations.donts.map(item => `
                  <li>${item}</li>
              `).join('');
          }

          // Update micronutrients
          const vitaminsContainer = document.querySelector('.vitamins-list');
          const mineralsContainer = document.querySelector('.minerals-list');

          if (vitaminsContainer && dietPlan.diet_details.micronutrients?.vitamins) {
              const vitamins = Object.entries(dietPlan.diet_details.micronutrients.vitamins).map(([name, value]) => ({
                  name,
                  value
              }));

              vitaminsContainer.innerHTML = vitamins.map(vitamin => `
                  <div class="nutrient-item">
                      <span class="nutrient-name">${vitamin.name}</span>
                      <span class="nutrient-value">${vitamin.value}</span>
                  </div>
              `).join('');
          }

          if (mineralsContainer && dietPlan.diet_details.micronutrients?.minerals) {
              const minerals = Object.entries(dietPlan.diet_details.micronutrients.minerals).map(([name, value]) => ({
                  name,
                  value
              }));

              mineralsContainer.innerHTML = minerals.map(mineral => `
                  <div class="nutrient-item">
                      <span class="nutrient-name">${mineral.name}</span>
                      <span class="nutrient-value">${mineral.value}</span>
                  </div>
              `).join('');
          }

      } catch (error) {
          console.error('Error rendering diet plan:', error);
          console.log('Diet plan data:', dietPlan);
          this.showError('Error displaying diet plan information.');
      }
  }
}

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new DietDashboard();
    dashboard.loadDietPlan();
});