import { auth, db, firestore } from '../firebase-config.js';
import { textToSpeech, cleanup as cleanupElevenLabs } from './elevenlabs-config.js';

let OPENAI_API_KEY;
let thingsRefx;
let unsubscribex;

thingsRefx = db.collection('API');

unsubscribex = thingsRefx.onSnapshot(querySnapshot => {
  querySnapshot.docs.forEach(doc => {
    OPENAI_API_KEY = doc.data().API;
  });
});

const questions = [
    "What are your fitness goals?",
    "Do you have any dietary preferences (e.g., vegetarian, vegan, keto)?",
    "Do you have any food allergies or restrictions?",
    "Great! I'll generate your personalized diet plan now."
];

let currentQuestionIndex = 0;
let userResponses = [];
let recognition = null;
let currentAudio = null;

// Initialize Web Speech API for recognition
if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
} else {
    // Fallback for browsers that don't support Web Speech API
    alert('Voice recognition is not supported in your browser. Please use text input instead.');
}

// DOM Elements
const startVoiceButton = document.getElementById('startVoice');
const stopVoiceButton = document.getElementById('stopVoice');
const textInput = document.getElementById('textInput');
const aiQuestion = document.getElementById('ai-question');
const steps = document.querySelectorAll('.step');
const speechWaves = document.getElementById('speech-waves');

if (!startVoiceButton || !stopVoiceButton || !textInput || !aiQuestion || !speechWaves) {
    console.error('Required DOM elements not found');
    alert('There was an error loading the page. Please try refreshing.');
}

// Event Listeners
startVoiceButton?.addEventListener('click', startVoiceRecognition);
stopVoiceButton?.addEventListener('click', stopVoiceRecognition);
textInput?.addEventListener('keypress', handleTextInput);

// Cleanup function for page unload
window.addEventListener('beforeunload', () => {
    if (unsubscribex) {
        unsubscribex();
    }
    cleanupElevenLabs();
});

// Voice Recognition Functions
function startVoiceRecognition() {
    if (recognition) {
        try {
            recognition.start();
            startVoiceButton.disabled = true;
            stopVoiceButton.disabled = false;
            textInput.disabled = true;
            speechWaves.classList.remove('inactive');
        } catch (error) {
            console.error('Error starting voice recognition:', error);
            alert('Error starting voice recognition. Please use text input instead.');
            startVoiceButton.disabled = true;
        }
    }
}

function stopVoiceRecognition() {
    if (recognition) {
        try {
            recognition.stop();
        } catch (error) {
            console.error('Error stopping voice recognition:', error);
        } finally {
            startVoiceButton.disabled = false;
            stopVoiceButton.disabled = true;
            textInput.disabled = false;
            speechWaves.classList.add('inactive');
        }
    }
}

// Handle voice recognition results
if (recognition) {
    recognition.onresult = (event) => {
        try {
            const response = event.results[0][0].transcript;
            handleResponse(response);
        } catch (error) {
            console.error('Error processing voice recognition result:', error);
            alert('Error processing voice input. Please try again or use text input.');
        }
    };

    recognition.onend = () => {
        stopVoiceRecognition();
    };

    recognition.onerror = (event) => {
        console.error('Voice recognition error:', event.error);
        alert('Voice recognition error. Please use text input instead.');
        stopVoiceRecognition();
    };
}

// Handle text input
function handleTextInput(event) {
    if (event.key === 'Enter') {
        const response = event.target.value.trim();
        if (response) {
            handleResponse(response);
            event.target.value = '';
        }
    }
}

// Process user response and move to next question
async function handleResponse(response) {
    try {
        userResponses.push(response);
        updateProgress();

        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            await askQuestion(questions[currentQuestionIndex]);
        } else {
            await generateDietPlan();
        }
    } catch (error) {
        console.error('Error handling response:', error);
        alert('Error processing your response. Please try again.');
    }
}

// Update progress indicator
function updateProgress() {
    steps.forEach((step, index) => {
        if (index < currentQuestionIndex) {
            step.classList.remove('active');
            step.classList.add('completed');
        } else if (index === currentQuestionIndex) {
            step.classList.add('active');
        } else {
            step.classList.remove('active', 'completed');
        }
    });
}

// Ask question using ElevenLabs text-to-speech
async function askQuestion(question) {
    aiQuestion.textContent = question;
    speechWaves.classList.remove('inactive');
    
    try {
        // Stop any currently playing audio
        if (currentAudio) {
            currentAudio.pause();
            currentAudio = null;
        }

        // Convert question to speech using ElevenLabs
        currentAudio = await textToSpeech(question);
        
        // Handle audio events
        currentAudio.onended = () => {
            speechWaves.classList.add('inactive');
        };

        currentAudio.onplay = () => {
            speechWaves.classList.remove('inactive');
        };

        currentAudio.onerror = () => {
            speechWaves.classList.add('inactive');
        };

        await currentAudio.play();
    } catch (error) {
        console.error('Error playing audio:', error);
        speechWaves.classList.add('inactive');
        // Fallback to browser's speech synthesis if ElevenLabs fails
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(question);
            utterance.onstart = () => {
                speechWaves.classList.remove('inactive');
            };
            utterance.onend = () => {
                speechWaves.classList.add('inactive');
            };
            window.speechSynthesis.speak(utterance);
        }
    }
}

// Generate diet plan using ChatGPT API
async function generateDietPlan() {
    try {
        // Check if user is authenticated
        const user = auth.currentUser;
        if (!user) {
            alert('Please sign in to generate a diet plan.');
            window.location.href = '../login.html';
            return;
        }

        // Show loading state
        aiQuestion.textContent = 'Generating your personalized diet plan...';
        document.querySelector('.voice-controls').style.display = 'none';
        textInput.disabled = true;
        speechWaves.classList.add('inactive');

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: "You are a professional nutritionist AI. Generate a detailed diet plan based on the user's responses. The output should be in JSON format following this structure: { user_id, diet_details: { diet_type, calories_per_day, macronutrient_split, micronutrients, hydration_recommendation, meal_timing, additional_guidelines, diet_goal, expected_outcomes, physical_activity } }"
                    },
                    {
                        role: "user",
                        content: `Generate a diet plan based on these responses:
                            1. Fitness goals: ${userResponses[0]}
                            2. Dietary preferences: ${userResponses[1]}
                            3. Restrictions: ${userResponses[2]}`
                    }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (!data.choices?.[0]?.message?.content) {
            throw new Error('Invalid response from OpenAI API');
        }

        const dietPlan = JSON.parse(data.choices[0].message.content);
        
        // Save to Firebase
        await saveDietPlan(dietPlan);
        
        // Redirect to dashboard
        window.location.href = 'diet-dashboard.html';
    } catch (error) {
        console.error('Error generating diet plan:', error);
        alert('Error generating diet plan. Please try again.');
        // Reset UI
        textInput.disabled = false;
        document.querySelector('.voice-controls').style.display = 'flex';
    }
}

// Save diet plan to Firebase
async function saveDietPlan(dietPlan) {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('User not authenticated');

        dietPlan.user_id = user.uid;
        dietPlan.created_at = firestore.serverTimestamp();

        const docRef = await firestore.addDoc(firestore.collection(db, 'diet_plans'), dietPlan);
        return docRef;
    } catch (error) {
        console.error('Error saving diet plan:', error);
        throw new Error('Failed to save diet plan. Please try again.');
    }
}

// Check authentication status before initializing
auth.onAuthStateChanged((user) => {
    if (user) {
        // Initialize first question
        askQuestion(questions[0]);
    } else {
        // Redirect to login
        window.location.href = '../login.html';
    }
}); 