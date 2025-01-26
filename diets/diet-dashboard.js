import { auth, db, firestore } from '../firebase-config.js';

let macroChart = null;

// Initialize dashboard
async function initDashboard() {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('User not authenticated');

        const dietPlan = await getLatestDietPlan(user.uid);
        if (!dietPlan) {
            window.location.href = 'diet-generator.html';
            return;
        }

        displayDietPlan(dietPlan);
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        alert('Error loading diet plan. Please try again.');
    }
}

// Fetch latest diet plan from Firebase
async function getLatestDietPlan(userId) {
    try {
        const q = firestore.query(
            firestore.collection(db, 'diet_plans'),
            firestore.where('user_id', '==', userId),
            firestore.orderBy('created_at', 'desc'),
            firestore.limit(1)
        );

        const querySnapshot = await firestore.getDocs(q);
        if (querySnapshot.empty) return null;

        return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
    } catch (error) {
        console.error('Error fetching diet plan:', error);
        throw error;
    }
}

// Display diet plan in dashboard
function displayDietPlan(dietPlan) {
    const { diet_details } = dietPlan;

    // Update diet type
    document.getElementById('diet-type').textContent = diet_details.diet_type;

    // Update daily calories
    document.getElementById('daily-calories').textContent = `${diet_details.calories_per_day} kcal`;

    // Update hydration
    const hydrationRec = diet_details.hydration_recommendation;
    document.getElementById('water-intake').textContent = hydrationRec.daily_intake;
    
    // Calculate progress percentage from the format "1.5L / 2.5L"
    const [current, total] = hydrationRec.daily_intake.split('/').map(v => parseFloat(v));
    const progressPercentage = (current / total) * 100;
    document.querySelector('.water-fill').style.width = `${progressPercentage}%`;

    // Display meal schedule
    displayMealSchedule(diet_details.meal_timing);

    // Display guidelines
    displayGuidelines(diet_details.additional_guidelines);

    // Create macronutrient chart
    createMacroChart(diet_details.macronutrient_split);
}

// Display meal schedule
function displayMealSchedule(mealTiming) {
    const mealScheduleContainer = document.getElementById('meal-schedule');
    mealScheduleContainer.innerHTML = '';

    Object.entries(mealTiming).forEach(([meal, time]) => {
        if (meal !== 'fasting_window' && !Array.isArray(time)) {
            const timelineItem = document.createElement('div');
            timelineItem.className = 'timeline-item';
            timelineItem.innerHTML = `
                <div>
                    <h4>${formatMealName(meal)}</h4>
                    <p>${time}</p>
                </div>
            `;
            mealScheduleContainer.appendChild(timelineItem);
        }
    });
}

// Display guidelines
function displayGuidelines(guidelines) {
    const dosList = document.getElementById('dos-list');
    const dontsList = document.getElementById('donts-list');

    dosList.innerHTML = guidelines.dos.map(item => `<li>${item}</li>`).join('');
    dontsList.innerHTML = guidelines.donts.map(item => `<li>${item}</li>`).join('');
}

// Create macronutrient chart
function createMacroChart(macroSplit) {
    if (macroChart) {
        macroChart.destroy();
    }

    const ctx = document.getElementById('macroChart').getContext('2d');
    macroChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Carbohydrates', 'Proteins', 'Fats'],
            datasets: [{
                data: [
                    macroSplit.carbohydrates.percentage,
                    macroSplit.proteins.percentage,
                    macroSplit.fats.percentage
                ],
                backgroundColor: [
                    'rgb(79, 70, 229)',
                    'rgb(34, 197, 94)',
                    'rgb(249, 115, 22)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Helper function to format meal names
function formatMealName(meal) {
    return meal.split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Event listener for regenerate plan button
document.getElementById('regenerate-plan').addEventListener('click', () => {
    window.location.href = 'diet-generator.html';
});

// Initialize dashboard when the page loads
document.addEventListener('DOMContentLoaded', initDashboard); 