// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBz1LNm4t8_Mj5LcWr42xtAkj5GhyPaFrI",
    authDomain: "coreai-d4174.firebaseapp.com",
    projectId: "coreai-d4174",
    storageBucket: "coreai-d4174.appspot.com",
    messagingSenderId: "1043591730430",
    appId: "1:1043591730430:web:a1f21ebf95f44e46d2d1c5",
    measurementId: "G-QVBF344QE2"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

class DietDashboard {
    constructor() {
        this.init();
        console.log('DietDashboard initialized');
    }

    async init() {
        // Wait for auth state to be ready
        auth.onAuthStateChanged((user) => {
            if (user) {
                console.log('User authenticated:', user.uid);
                this.userId = user.uid;
                this.loadDietPlan();
            } else {
                console.log('No user authenticated, redirecting to login');
                window.location.href = '../auth/login.html';
            }
        });
    }

    async loadDietPlan() {
        try {
            console.log('Loading diet plan for user:', this.userId);
            const dietDoc = await db.collection('dietPlans').doc(this.userId).get();
            
            if (dietDoc.exists) {
                console.log('Diet plan found:', dietDoc.data());
                const dietPlan = dietDoc.data();
                this.renderDashboard(dietPlan);
            } else {
                console.log('No diet plan found, redirecting to generation page');
                window.location.href = '../generate-diets/index.html';
            }
        } catch (error) {
            console.error("Error loading diet plan:", error);
            this.showError("Failed to load diet plan. Please try again later.");
        }
    }

    renderDashboard(dietPlan) {
        console.log('Rendering dashboard with diet plan:', dietPlan);
        
        // Set diet type
        const dietTypeEl = document.querySelector('.diet-type');
        if (dietPlan.diet_details?.diet_type) {
            dietTypeEl.textContent = dietPlan.diet_details.diet_type;
        }

        // Render all sections
        this.renderOverviewCards(dietPlan);
        this.renderMacronutrients(dietPlan.diet_details?.macronutrient_split);
        this.renderMealSchedule(dietPlan.diet_details?.meal_timing);
        this.renderGuidelines(dietPlan.diet_details?.additional_guidelines);
        this.renderMicronutrients(dietPlan.diet_details);
        this.renderOutcomes(dietPlan.expected_outcomes);
        this.renderActivityPlan(dietPlan.physical_activity);

        // Add fade-in animation to all cards
        document.querySelectorAll('.card').forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
        });
    }

    renderOverviewCards(dietPlan) {
        // Update calories
        const caloriesValue = document.querySelector('.calories-value');
        if (caloriesValue) {
            caloriesValue.textContent = dietPlan.diet_details?.daily_calories ? 
                `${dietPlan.diet_details.daily_calories} kcal` : '2000 kcal';
        }

        // Update hydration
        const hydrationValue = document.querySelector('.hydration-value');
        if (hydrationValue) {
            hydrationValue.textContent = dietPlan.hydration_recommendations?.daily_intake || '2.5 L';
        }
    }

    renderMacronutrients(macros) {
        if (!macros) {
            console.log('No macronutrient data available');
            return;
        }

        console.log('Rendering macronutrients:', macros);

        const updateMacro = (type, value) => {
            const ring = document.querySelector(`.macro-ring.${type}`);
            const percentage = document.querySelector(`.macro-ring.${type} .percentage`);
            
            if (ring && percentage) {
                const macroValue = value || (type === 'carbs' ? 50 : type === 'protein' ? 30 : 20);
                ring.style.setProperty('--percentage', `${macroValue}%`);
                percentage.textContent = `${macroValue}%`;
            }
        };

        updateMacro('carbs', macros.carbohydrates);
        updateMacro('protein', macros.protein);
        updateMacro('fats', macros.fats);
    }

    renderMealSchedule(mealTiming) {
        const timeline = document.querySelector('.meal-timeline');
        if (!mealTiming || !timeline) {
            console.log('No meal timing data or timeline element');
            return;
        }

        console.log('Rendering meal schedule:', mealTiming);
        timeline.innerHTML = Object.entries(mealTiming)
            .map(([meal, time], index) => `
                <div class="meal-time" style="animation-delay: ${index * 0.1}s">
                    <strong>${this.formatMealName(meal)}:</strong> ${time}
                </div>
            `).join('');
    }

    renderGuidelines(guidelines) {
        if (!guidelines) {
            console.log('No guidelines data available');
            return;
        }

        console.log('Rendering guidelines:', guidelines);

        // Render do's
        const dosList = document.querySelector('.dos-list');
        if (dosList && guidelines.dos) {
            dosList.innerHTML = guidelines.dos
                .map(item => `<li>${item}</li>`)
                .join('');
        }

        // Render don'ts
        const dontsList = document.querySelector('.donts-list');
        if (dontsList && guidelines.donts) {
            dontsList.innerHTML = guidelines.donts
                .map(item => `<li>${item}</li>`)
                .join('');
        }

        // Render special tips
        const tipsList = document.querySelector('.tips-list');
        if (tipsList && guidelines.special_tips) {
            tipsList.innerHTML = guidelines.special_tips
                .map(tip => `<li>${tip}</li>`)
                .join('');
        }
    }

    renderMicronutrients(dietDetails) {
        if (!dietDetails) {
            console.log('No diet details available');
            return;
        }

        console.log('Rendering micronutrients:', dietDetails);

        // Render vitamins
        const vitaminsList = document.querySelector('.vitamins-list');
        if (vitaminsList && dietDetails.vitamins) {
            vitaminsList.innerHTML = Object.entries(dietDetails.vitamins)
                .map(([vitamin, value]) => `
                    <div class="nutrient-item">
                        <span class="nutrient-name">${this.formatNutrientName(vitamin)}</span>
                        <span class="nutrient-value">${value}</span>
                    </div>
                `).join('');
        }

        // Render minerals
        const mineralsList = document.querySelector('.minerals-list');
        if (mineralsList && dietDetails.minerals) {
            mineralsList.innerHTML = Object.entries(dietDetails.minerals)
                .map(([mineral, value]) => `
                    <div class="nutrient-item">
                        <span class="nutrient-name">${this.formatNutrientName(mineral)}</span>
                        <span class="nutrient-value">${value}</span>
                    </div>
                `).join('');
        }
    }

    renderOutcomes(outcomes) {
        const outcomesGrid = document.querySelector('.outcomes-grid');
        if (!outcomesGrid || !outcomes) {
            console.log('No outcomes data or grid element');
            return;
        }

        console.log('Rendering outcomes:', outcomes);
        outcomesGrid.innerHTML = outcomes
            .map(outcome => `
                <div class="outcome-item">
                    <span class="outcome-icon">✓</span>
                    <span>${outcome}</span>
                </div>
            `).join('');
    }

    renderActivityPlan(activity) {
        if (!activity) {
            console.log('No activity plan data');
            return;
        }

        console.log('Rendering activity plan:', activity);

        // Render main recommendation
        const recommendationEl = document.querySelector('.activity-recommendation');
        if (recommendationEl) {
            recommendationEl.textContent = activity.main_recommendation || '';
        }

        // Render suggested activities
        const activitiesEl = document.querySelector('.suggested-activities');
        if (activitiesEl && activity.suggested_activities) {
            activitiesEl.innerHTML = activity.suggested_activities
                .map(activity => `
                    <span class="activity-tag">${activity}</span>
                `).join('');
        }
    }

    // Utility methods
    formatMealName(name) {
        return name
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    formatNutrientName(name) {
        return name
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    showError(message) {
        console.error('Error:', message);
        // Create error toast
        const toast = document.createElement('div');
        toast.className = 'error-toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new DietDashboard();
});
