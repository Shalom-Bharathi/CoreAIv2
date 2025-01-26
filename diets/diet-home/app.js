class DietDashboard {
    constructor() {
        this.db = firebase.firestore();
        this.loadDietPlan();
    }

    async loadDietPlan() {
        try {
            // Get the diet ID from localStorage
            const dietId = localStorage.getItem('currentDietId');
            if (!dietId) {
                this.showError('No diet plan found. Please generate a diet plan first.');
                return;
            }

            console.log('Fetching diet plan with ID:', dietId);
            
            const dietDoc = await this.db.collection('diets').doc(dietId).get();
            
            if (dietDoc.exists) {
                const data = dietDoc.data();
                console.log('Diet plan found:', data);
                this.renderDietPlan(data);
            } else {
                this.showError('No diet plan found. Please generate a diet plan first.');
            }
        } catch (error) {
            console.error('Error loading diet plan:', error);
            this.showError('Failed to load diet plan. Please try again later.');
        }
    }

    showError(message) {
        const errorToast = document.createElement('div');
        errorToast.className = 'error-toast';
        errorToast.textContent = message;
        
        document.body.appendChild(errorToast);
        
        // Animate in
        gsap.from(errorToast, {
            y: 50,
            opacity: 0,
            duration: 0.3
        });
        
        // Remove after 3 seconds
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
        // Update diet type
        document.querySelector('.diet-type').textContent = dietPlan.diet_details.diet_type;

        // Update overview cards
        document.querySelector('.calories-value').textContent = `${dietPlan.diet_details.calories_per_day} kcal`;
        document.querySelector('.hydration-value').textContent = dietPlan.diet_details.hydration_recommendation.daily_intake;

        // Update macro rings
        const macroRings = document.querySelectorAll('.macro-ring');
        macroRings.forEach(ring => {
            const macroType = ring.classList.contains('carbs') ? 'carbohydrates' :
                            ring.classList.contains('protein') ? 'proteins' : 'fats';
            const percentage = dietPlan.diet_details.macronutrient_split[macroType].percentage;
            ring.style.setProperty('--percentage', `${percentage}%`);
            ring.querySelector('.percentage').textContent = `${percentage}%`;
        });

        // Update meal timeline
        const timelineContainer = document.querySelector('.meal-timeline');
        const mealTiming = dietPlan.diet_details.meal_timing;
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
        
        dosContainer.innerHTML = dietPlan.diet_details.additional_guidelines.dos.map(item => `
            <li>${item}</li>
        `).join('');
        
        dontsContainer.innerHTML = dietPlan.diet_details.additional_guidelines.donts.map(item => `
            <li>${item}</li>
        `).join('');

        // Update micronutrients
        const vitaminsContainer = document.querySelector('.vitamins-list');
        const mineralsContainer = document.querySelector('.minerals-list');

        const vitamins = Object.entries(dietPlan.diet_details.micronutrients.vitamins);
        const minerals = Object.entries(dietPlan.diet_details.micronutrients.minerals);

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
        const outcomes = Object.entries(dietPlan.diet_details.expected_outcomes);
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
        const activities = dietPlan.diet_details.physical_activity;
        activityContainer.innerHTML = `
            <div class="activity-recommendation">${activities.recommendation}</div>
            ${activities.suggested_activities.map(activity => `
                <div class="activity-recommendation">${activity}</div>
            `).join('')}
        `;
    }
}

// Initialize the dashboard
new DietDashboard();
