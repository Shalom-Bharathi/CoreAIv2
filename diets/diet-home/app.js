class DietDashboard {
    constructor() {
        this.initializeFirebase();
    }
    async initializeFirebase() {
        try {
            // Initialize Firebase
            const app = initializeApp(firebaseConfig);
            
            // Initialize Firestore
            this.db = getFirestore(app);
            
            // Connect to Firestore
            try {
                // Try to connect to local emulator first (for development)
                connectFirestoreEmulator(this.db, 'localhost', 8080);
                console.log('Connected to Firestore emulator');
            } catch (emulatorError) {
                console.log('Using production Firestore');
            }

            // Load diet plan after successful initialization
            await this.loadDietPlan();
            
        } catch (error) {
            console.error('Firebase initialization error:', error);
            this.renderDietPlan(this.getSampleDietPlan());
        }
    }

    async loadDietPlan() {
        try {
            const userId = 'testUser123';
            console.log('Fetching diet plan for user:', userId);
            
            const dietDocRef = doc(this.db, 'diets', userId);
            const dietDoc = await getDoc(dietDocRef);
            
            if (dietDoc.exists()) {
                const data = dietDoc.data();
                console.log('Diet plan found:', data);
                this.renderDietPlan(data);
            } else {
                console.log('No diet plan found in Firestore. Using sample data.');
                this.renderDietPlan(this.getSampleDietPlan());
            }
        } catch (error) {
            console.error('Error loading diet plan:', error);
            console.error('Error details:', {
                code: error.code,
                message: error.message,
                stack: error.stack
            });
            this.renderDietPlan(this.getSampleDietPlan());
        }
    }

    getSampleDietPlan() {
        return {
            userId: 'testUser123',
            dietType: 'Balanced Mediterranean',
            dailyCalories: 2200,
            macroSplit: {
                carbs: 45,
                protein: 30,
                fats: 25
            },
            hydration: {
                dailyWater: '3 liters',
                recommendations: ['Drink before meals', 'Start day with water']
            },
            mealTiming: [
                { time: '7:00 AM', meal: 'Breakfast' },
                { time: '10:00 AM', meal: 'Morning Snack' },
                { time: '1:00 PM', meal: 'Lunch' },
                { time: '4:00 PM', meal: 'Afternoon Snack' },
                { time: '7:00 PM', meal: 'Dinner' }
            ],
            guidelines: {
                dos: [
                    'Eat plenty of vegetables',
                    'Include lean proteins',
                    'Choose whole grains',
                    'Include healthy fats'
                ],
                donts: [
                    'Avoid processed foods',
                    'Limit added sugars',
                    'Avoid late night eating',
                    'Limit alcohol consumption'
                ]
            },
            micronutrients: {
                vitamins: [
                    { name: 'Vitamin D', value: '2000 IU' },
                    { name: 'Vitamin C', value: '500mg' },
                    { name: 'Vitamin B12', value: '2.4mcg' }
                ],
                minerals: [
                    { name: 'Iron', value: '18mg' },
                    { name: 'Calcium', value: '1000mg' },
                    { name: 'Magnesium', value: '400mg' }
                ]
            },
            expectedOutcomes: [
                'Improved energy levels',
                'Better weight management',
                'Enhanced muscle recovery',
                'Improved digestion'
            ],
            physicalActivity: {
                recommendations: [
                    '30 minutes cardio daily',
                    'Strength training 3x week',
                    'Yoga or stretching 2x week',
                    'Active recovery walks'
                ]
            }
        };
    }

    renderDietPlan(dietPlan) {
        // Update diet type
        document.querySelector('.diet-type').textContent = dietPlan.dietType;

        // Update overview cards
        document.querySelector('.calories-value').textContent = `${dietPlan.dailyCalories} kcal`;
        document.querySelector('.hydration-value').textContent = dietPlan.hydration.dailyWater;

        // Update macro rings
        const macroRings = document.querySelectorAll('.macro-ring');
        macroRings.forEach(ring => {
            const macroType = ring.getAttribute('data-macro');
            const percentage = dietPlan.macroSplit[macroType];
            ring.style.setProperty('--percentage', `${percentage}%`);
            ring.querySelector('.percentage').textContent = `${percentage}%`;
        });

        // Update meal timeline
        const timelineContainer = document.querySelector('.meal-timeline');
        timelineContainer.innerHTML = dietPlan.mealTiming.map(meal => `
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
        
        dosContainer.innerHTML = dietPlan.guidelines.dos.map(item => `
            <li>${item}</li>
        `).join('');
        
        dontsContainer.innerHTML = dietPlan.guidelines.donts.map(item => `
            <li>${item}</li>
        `).join('');

        // Update micronutrients
        const vitaminsContainer = document.querySelector('.vitamins-list');
        const mineralsContainer = document.querySelector('.minerals-list');

        vitaminsContainer.innerHTML = dietPlan.micronutrients.vitamins.map(vitamin => `
            <div class="nutrient-item">
                <span class="nutrient-name">${vitamin.name}</span>
                <span class="nutrient-value">${vitamin.value}</span>
            </div>
        `).join('');

        mineralsContainer.innerHTML = dietPlan.micronutrients.minerals.map(mineral => `
            <div class="nutrient-item">
                <span class="nutrient-name">${mineral.name}</span>
                <span class="nutrient-value">${mineral.value}</span>
            </div>
        `).join('');

        // Update outcomes
        const outcomesContainer = document.querySelector('.outcomes-grid');
        outcomesContainer.innerHTML = dietPlan.expectedOutcomes.map((outcome, index) => `
            <div class="outcome-item">
                <div class="outcome-icon">${index + 1}</div>
                <div class="outcome-text">${outcome}</div>
            </div>
        `).join('');

        // Update physical activity
        const activityContainer = document.querySelector('.activity-content');
        activityContainer.innerHTML = dietPlan.physicalActivity.recommendations.map(activity => `
            <div class="activity-recommendation">${activity}</div>
        `).join('');
    }
}

// Initialize the dashboard
new DietDashboard();
