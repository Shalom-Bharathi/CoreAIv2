class DietDashboard {
  constructor() {
      this.db = firebase.firestore();
      this.loadDietPlan();
  }

  async loadDietPlan() {
      try {
          const snapshot = await this.db.collection('dietPlans')
              .orderBy('timestamp', 'desc')
              .limit(1)
              .get();

          if (!snapshot.empty) {
              const dietPlan = snapshot.docs[0].data();
              console.log('Diet plan founde:', dietPlan.diet_details);
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
      const errorToast = document.createElement('div');
      errorToast.className = 'error-toast';
      errorToast.textContent = message;
      
      document.body.appendChild(errorToast);
      
      gsap.from(errorToast, {
          y: 50,
          opacity: 0,
          duration: 0.3
      });
      
      setTimeout(() => {
          gsap.to(errorToast, {
              y: 50,
              opacity: 0,
              duration: 0.3,
              onComplete: () => errorToast.remove()
          });
      }, 3000);
  }

  renderDietPlan(dietPlan) {
      console.log('Rendering diet planE:', dietPlan);

      // Update diet type
      document.querySelector('.diet-type').textContent = dietPlan.dietType;

      // Update overview cards
      document.querySelector('.calories-value').textContent = `${dietPlan.calories} kcal`;
      document.querySelector('.hydration-value').textContent = `${dietPlan.hydration} L`;

      // Update macro rings
      const macroRings = document.querySelectorAll('.macro-ring');
      macroRings.forEach(ring => {
          const macroType = ring.classList.contains('carbs') ? 'carbohydrates' :
                          ring.classList.contains('protein') ? 'proteins' : 'fats';
          const percentage = dietPlan.macronutrient_split[macroType].percentage;
          ring.style.setProperty('--percentage', `${percentage}%`);
          ring.querySelector('.percentage').textContent = `${percentage}%`;
      });

      // Update meal timeline
      const timelineContainer = document.querySelector('.meal-timeline');
      const mealTiming = dietPlan.meal_timing;
      timelineContainer.innerHTML = `
          <div class="meal-time">
              <div class="meal-time-content">
                  <strong>Breakfast</strong>
                  <span>${mealTiming.breakfast}</span>
              </div>
          </div>
          <div class="meal-time">
              <div class="meal-time-content">
                  <strong>Lunch</strong>
                  <span>${mealTiming.lunch}</span>
              </div>
          </div>
          <div class="meal-time">
              <div class="meal-time-content">
                  <strong>Dinner</strong>
                  <span>${mealTiming.dinner}</span>
              </div>
          </div>
      `;

      // Update guidelines
      const dosContainer = document.querySelector('.dos-list');
      const dontsContainer = document.querySelector('.donts-list');
      
      dosContainer.innerHTML = dietPlan.additional_guidelines.dos.map(item => `
          <li>${item}</li>
      `).join('');
      
      dontsContainer.innerHTML = dietPlan.additional_guidelines.donts.map(item => `
          <li>${item}</li>
      `).join('');

      // Update micronutrients
      const vitaminsContainer = document.querySelector('.vitamins-list');
      const mineralsContainer = document.querySelector('.minerals-list');

      const vitamins = Object.entries(dietPlan.micronutrients.vitamins);
      const minerals = Object.entries(dietPlan.micronutrients.minerals);

      vitaminsContainer.innerHTML = vitamins.map(([name, value]) => `
          <div class="nutrient-item">
              <span class="nutrient-name">Vitamin ${name}</span>
              <span class="nutrient-value">${value}</span>
          </div>
      `).join('');

      mineralsContainer.innerHTML = minerals.map(([name, value]) => `
          <div class="nutrient-item">
              <span class="nutrient-name">${name}</span>
              <span class="nutrient-value">${value}</span>
          </div>
      `).join('');

      // Update outcomes
      const outcomesContainer = document.querySelector('.outcomes-grid');
      const outcomes = Object.entries(dietPlan.expected_outcomes);
      outcomesContainer.innerHTML = outcomes
          .filter(([_, value]) => value) // Only show true outcomes
          .map(([outcome], index) => `
              <div class="outcome-item">
                  <div class="outcome-icon">${index + 1}</div>
                  <div class="outcome-text">${outcome.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
              </div>
          `).join('');

      // Update physical activity
      const activityContainer = document.querySelector('.activity-content');
      const activities = dietPlan.physical_activity;
      activityContainer.innerHTML = `
          <div class="activity-recommendation">${activities.recommendation}</div>
          ${activities.suggested_activities.map(activity => `
              <div class="activity-recommendation">${activity}</div>
          `).join('')}
      `;

      // Update UI
      this.updateUI(dietPlan);
  }

  updateUI(dietPlan) {
      console.log('Rendering diet plan:', dietPlan.diet_details);
      
      // Get the main container
      const mainContainer = document.querySelector('.diet-container');
      mainContainer.innerHTML = ''; // Clear existing content
      
      // Create and append diet goal section
      const goalSection = document.createElement('div');
      goalSection.classList.add('diet-section');
      goalSection.innerHTML = `
          <h2>Diet Goal</h2>
          <p>${dietPlan.diet_details.diet_goal}</p>
      `;
      mainContainer.appendChild(goalSection);
      
      // Expected Outcomes section
      const outcomesSection = document.createElement('div');
      outcomesSection.classList.add('diet-section');
      outcomesSection.innerHTML = `
          <h2>Expected Outcomes</h2>
          <ul>
              ${Object.entries(dietPlan.diet_details.expected_outcomes).map(([key, value]) => 
                  `<li><strong>${key}:</strong> ${value}</li>`
              ).join('')}
          </ul>
      `;
      mainContainer.appendChild(outcomesSection);
      
      // Meal Timing section
      const mealTimingSection = document.createElement('div');
      mealTimingSection.classList.add('diet-section');
      mealTimingSection.innerHTML = `
          <h2>Meal Timing</h2>
          <ul>
              ${Object.entries(dietPlan.diet_details.meal_timing).map(([key, value]) => 
                  `<li><strong>${key}:</strong> ${value}</li>`
              ).join('')}
          </ul>
      `;
      mainContainer.appendChild(mealTimingSection);
      
      // Hydration section
      const hydrationSection = document.createElement('div');
      hydrationSection.classList.add('diet-section');
      hydrationSection.innerHTML = `
          <h2>Hydration Recommendation</h2>
          <ul>
              ${Object.entries(dietPlan.diet_details.hydration_recommendation).map(([key, value]) => 
                  `<li><strong>${key}:</strong> ${value}</li>`
              ).join('')}
          </ul>
      `;
      mainContainer.appendChild(hydrationSection);
      
      // Micronutrients section
      const microSection = document.createElement('div');
      microSection.classList.add('diet-section');
      microSection.innerHTML = `
          <h2>Micronutrients Focus</h2>
          <ul>
              ${Object.entries(dietPlan.diet_details.micronutrients).map(([key, value]) => 
                  `<li><strong>${key}:</strong> ${value}</li>`
              ).join('')}
          </ul>
      `;
      mainContainer.appendChild(microSection);
      
      // User Responses section
      const responsesSection = document.createElement('div');
      responsesSection.classList.add('diet-section');
      responsesSection.innerHTML = `
          <h2>Your Responses</h2>
          <ul>
              ${dietPlan.user_responses.map(response => 
                  `<li>${response}</li>`
              ).join('')}
          </ul>
      `;
      mainContainer.appendChild(responsesSection);
  }
}

// Initialize the dashboard
new DietDashboard();
