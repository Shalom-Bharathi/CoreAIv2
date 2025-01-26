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
                console.log('Raw diet plan data:', dietPlan); // Debug log
                this.renderDietPlan(dietPlan);
            }
        } catch (error) {
            console.error('Error getting diet plan:', error);
        }
    }

    renderDietPlan(dietPlan) {
        // Get the main container
        const mainContainer = document.querySelector('.diet-container');
        mainContainer.innerHTML = ''; // Clear existing content

        // First, let's log the exact structure we're working with
        console.log('Diet plan structure:', JSON.stringify(dietPlan, null, 2));

        // Create sections only if data exists
        if (dietPlan.diet_details) {
            // Diet Goal
            if (dietPlan.diet_details.diet_goal) {
                this.createSection('Diet Goal', dietPlan.diet_details.diet_goal);
            }

            // Expected Outcomes
            if (dietPlan.diet_details.expected_outcomes) {
                this.createListSection('Expected Outcomes', dietPlan.diet_details.expected_outcomes);
            }

            // Meal Timing
            if (dietPlan.diet_details.meal_timing) {
                this.createListSection('Meal Timing', dietPlan.diet_details.meal_timing);
            }

            // Hydration
            if (dietPlan.diet_details.hydration_recommendation) {
                this.createListSection('Hydration Recommendation', dietPlan.diet_details.hydration_recommendation);
            }

            // Micronutrients
            if (dietPlan.diet_details.micronutrients) {
                this.createListSection('Micronutrients Focus', dietPlan.diet_details.micronutrients);
            }
        }

        // User Responses
        if (dietPlan.user_responses && dietPlan.user_responses.length > 0) {
            this.createArraySection('Your Responses', dietPlan.user_responses);
        }
    }

    createSection(title, content) {
        const container = document.querySelector('.diet-container');
        const section = document.createElement('div');
        section.classList.add('diet-section');
        section.innerHTML = `
            <h2>${title}</h2>
            <p>${content}</p>
        `;
        container.appendChild(section);
    }

    createListSection(title, data) {
        const container = document.querySelector('.diet-container');
        const section = document.createElement('div');
        section.classList.add('diet-section');
        section.innerHTML = `
            <h2>${title}</h2>
            <ul>
                ${Object.entries(data || {}).map(([key, value]) => 
                    `<li><strong>${key}:</strong> ${value}</li>`
                ).join('')}
            </ul>
        `;
        container.appendChild(section);
    }

    createArraySection(title, items) {
        const container = document.querySelector('.diet-container');
        const section = document.createElement('div');
        section.classList.add('diet-section');
        section.innerHTML = `
            <h2>${title}</h2>
            <ul>
                ${items.map(item => `<li>${item}</li>`).join('')}
            </ul>
        `;
        container.appendChild(section);
    }
}

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new DietDashboard();
    dashboard.loadDietPlan();
});
