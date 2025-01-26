import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { firebaseConfig } from '../firebase-config.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

class DietDashboard {
    constructor() {
        this.init();
    }

    async init() {
        // Wait for auth state to be ready
        onAuthStateChanged(auth, (user) => {
            if (user) {
                this.userId = user.uid;
                this.loadDietPlan();
            } else {
                window.location.href = '../auth/login.html';
            }
        });
    }

    async loadDietPlan() {
        try {
            const dietDoc = await getDoc(doc(db, 'dietPlans', this.userId));
            
            if (dietDoc.exists()) {
                const dietPlan = dietDoc.data();
                this.renderDashboard(dietPlan);
            } else {
                window.location.href = '../generate-diets/index.html';
            }
        } catch (error) {
            console.error("Error loading diet plan:", error);
            this.showError("Failed to load diet plan. Please try again later.");
        }
    }

    renderDashboard(dietPlan) {
        // Set diet type
        document.querySelector('.diet-type').textContent = dietPlan.diet_details.diet_type || 'Custom Diet Plan';

        // Render all sections
        this.renderOverviewCards(dietPlan);
        this.renderMacronutrients(dietPlan.diet_details.macronutrient_split);
        this.renderMealSchedule(dietPlan.diet_details.meal_timing);
        this.renderGuidelines(dietPlan.diet_details.additional_guidelines);
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
        caloriesValue.textContent = `${dietPlan.diet_details.daily_calories || '2000'} kcal`;

        // Update hydration
        const hydrationValue = document.querySelector('.hydration-value');
        hydrationValue.textContent = dietPlan.hydration_recommendations?.daily_intake || '2.5 L';
    }

    renderMacronutrients(macros) {
        // Update ring percentages
        document.querySelector('.macro-ring.carbs').style.setProperty('--percentage', `${macros?.carbohydrates || 50}%`);
        document.querySelector('.macro-ring.protein').style.setProperty('--percentage', `${macros?.protein || 30}%`);
        document.querySelector('.macro-ring.fats').style.setProperty('--percentage', `${macros?.fats || 20}%`);

        // Update percentage text
        document.querySelector('.macro-ring.carbs .percentage').textContent = `${macros?.carbohydrates || 50}%`;
        document.querySelector('.macro-ring.protein .percentage').textContent = `${macros?.protein || 30}%`;
        document.querySelector('.macro-ring.fats .percentage').textContent = `${macros?.fats || 20}%`;
    }

    renderMealSchedule(mealTiming) {
        const timeline = document.querySelector('.meal-timeline');
        if (!mealTiming || !timeline) return;

        timeline.innerHTML = Object.entries(mealTiming)
            .map(([meal, time], index) => `
                <div class="meal-time" style="animation-delay: ${index * 0.1}s">
                    <strong>${this.formatMealName(meal)}:</strong> ${time}
                </div>
            `).join('');
    }

    renderGuidelines(guidelines) {
        if (!guidelines) return;

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
        if (!outcomesGrid || !outcomes) return;

        outcomesGrid.innerHTML = outcomes
            .map(outcome => `
                <div class="outcome-item">
                    <span class="outcome-icon">✓</span>
                    <span>${outcome}</span>
                </div>
            `).join('');
    }

    renderActivityPlan(activity) {
        if (!activity) return;

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
