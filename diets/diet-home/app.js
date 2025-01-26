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
              console.log('Diet plan found:', dietPlan);
              this.renderDietPlan(dietPlan.diet_details);
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
        console.log(dietPlan);
          // Update diet type and goal
          document.querySelector('.diet-type').textContent = `${dietPlan.diet_type} - ${dietPlan.diet_goal}`;

          // Update overview cards
          document.querySelector('.calories-value').textContent = `${dietPlan.calories_per_day} kcal`;
          
          // Update hydration (with the correct data structure)
          const hydrationValue = document.querySelector('.hydration-value');
          if (hydrationValue && dietPlan.hydration_recommendation) {
              hydrationValue.textContent = dietPlan.hydration_recommendation.daily_intake || '2-3 liters';
          }

          // Update macro rings
          const macroRings = document.querySelectorAll('.macro-ring');
          macroRings.forEach(ring => {
              const macroType = ring.getAttribute('data-macro');
              const percentage = dietPlan.macronutrient_split[macroType]?.percentage || 0;
              ring.style.setProperty('--percentage', `${percentage}%`);
              const percentageElement = ring.querySelector('.percentage');
              if (percentageElement) {
                  percentageElement.textContent = `${percentage}%`;
              }
          });

          // Update meal timeline
          const timelineContainer = document.querySelector('.meal-timeline');
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