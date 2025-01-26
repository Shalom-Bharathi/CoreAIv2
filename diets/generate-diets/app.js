// Initialize Firebase if not already initialized

const firebaseConfig = {
  apiKey: "AIzaSyAtBxeZrh4cej7ZzsKZ5uN-BqC_wxoTmdE",
  authDomain: "coreai-82c79.firebaseapp.com",
  databaseURL: "https://coreai-82c79-default-rtdb.firebaseio.com",
  projectId: "coreai-82c79",
  storageBucket: "coreai-82c79.firebasestorage.app",
  messagingSenderId: "97395011364",
  appId: "1:97395011364:web:1e8f6a06fce409bfd80db1",
  measurementId: "G-0J1RLMVEGC"
};
firebase.initializeApp(firebaseConfig);
console.log("Firebase initialized");

// Initialize Firebase services
const db = firebase.firestore();
const auth = firebase.auth();

// Global variables for diet generation
let currentUser = null;
let API_KEY = null;
let userResponses = [];
let isListening = false;
let conversationComplete = false;
let requiredInfo = {
  goals: false,
  dietary: false,
  lifestyle: false
};
let hasUserInteracted = false;

// Questions for diet generation
const questions = [
  "Tell me about your fitness journey and what motivates you to make a change in your diet?",
  "Paint me a picture of your typical day - from morning to night. What does your eating schedule look like?",
  "What's your relationship with food? Any comfort foods or dishes that bring back memories?",
  "If you could wave a magic wand and achieve your ideal health, what would that look like?"
];

let currentQuestionIndex = 0;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  // Check authentication and redirect if needed
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      currentUser = user;
      await checkExistingDiet();
      initializeDietGeneration();
    } else {
      window.location.href = '../auth/login.html';
    }
  });

  // Get API Key from Firebase
  const apiSnapshot = await db.collection('API').get();
  apiSnapshot.forEach(doc => {
    API_KEY = doc.data().API;
  });
});

// Check if user already has a diet plan
async function checkExistingDiet() {
  try {
    const dietSnapshot = await db.collection('diets')
      .where('userId', '==', currentUser.uid)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (!dietSnapshot.empty) {
      window.location.href = '../diet-home/index.html';
    }
  } catch (error) {
    console.error('Error checking existing diet:', error);
  }
}

// Add these helper functions at the top after Firebase initialization
async function playAnimation(type) {
  const avatarContainer = document.querySelector('.ai-avatar-container');
  
  switch(type) {
    case 'greeting':
      avatarContainer.classList.add('greeting');
      gsap.to(avatarContainer, {
        scale: 1.1,
        duration: 0.5,
        yoyo: true,
        repeat: 1,
        ease: "elastic.out(1, 0.3)"
      });
      
      const statusText = document.getElementById('statusText');
      gsap.from(statusText, {
        y: 20,
        opacity: 0,
        duration: 0.5,
        ease: "back.out(1.7)"
      });
      break;
      
    case 'listening':
      gsap.to(avatarContainer, {
        scale: 1.05,
        duration: 0.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
      break;
      
    case 'thinking':
      gsap.to(avatarContainer, {
        rotation: 3,
        duration: 1,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
      break;
  }
  
  return new Promise(resolve => setTimeout(resolve, 1000));
}

// Add the speak function
async function speak(text) {
  return new Promise((resolve, reject) => {
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.2;
      utterance.pitch = 1.2;
      utterance.volume = 1;
      
      const voices = speechSynthesis.getVoices();
      const femaleVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('female') || 
        voice.name.includes('Samantha')
      );
      if (femaleVoice) utterance.voice = femaleVoice;
      
      utterance.onend = resolve;
      utterance.onerror = reject;
      speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Browser speech synthesis failed:', error);
      resolve(); // Resolve anyway to continue the flow
    }
  });
}

// Update addMessageToConversation to only show user messages
function addMessageToConversation(type, content) {
  const conversationHistory = document.getElementById('conversationHistory');
  if (!conversationHistory) return;
  
  // Only add user messages to the conversation history
  if (type === 'user') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = content;
    
    messageDiv.appendChild(contentDiv);
    conversationHistory.appendChild(messageDiv);
    conversationHistory.scrollTop = conversationHistory.scrollHeight;
  }
  
  // If it's an AI message, just update the status text
  if (type === 'ai') {
    const statusText = document.getElementById('statusText');
    const aiStatus = document.querySelector('.ai-status');
    if (statusText && aiStatus) {
      statusText.textContent = content;
      // Add glow animation to the AI avatar
      const avatarContainer = document.querySelector('.ai-avatar-container');
      if (avatarContainer) {
        avatarContainer.classList.add('speaking');
        aiStatus.classList.add('speaking');
        setTimeout(() => {
          avatarContainer.classList.remove('speaking');
          aiStatus.classList.remove('speaking');
        }, 3000);
      }
    }
  }
}

// Add startConversation function
async function startConversation() {
  await playAnimation('greeting');
  
  if (hasUserInteracted) {
    const welcomeMessage = "Hi! I'm Core AI. Let's have a chat about your diet goals. Feel free to tell me about what brings you here today.";
    await speak(welcomeMessage);
    addMessageToConversation('ai', welcomeMessage);
  }
}

// Update handleTextSubmit function
async function handleTextSubmit() {
  const textInput = document.getElementById('textInput');
  const text = textInput.value.trim();
  
  if (text) {
    addMessageToConversation('user', text);
    textInput.value = '';
    await handleUserInput(text);
  }
}

// Add these functions before initializeDietGeneration
function updateUIForListening(listening) {
  const statusIndicator = document.querySelector('.status-indicator');
  const statusText = document.getElementById('statusText');
  
  if (listening) {
    statusIndicator.classList.add('listening');
    statusText.textContent = "I'm listening...";
  } else {
    statusIndicator.classList.remove('listening');
    statusText.textContent = "Ready to continue";
  }
}

function updateStatus(text) {
  const statusText = document.getElementById('statusText');
  if (statusText) {
    statusText.textContent = text;
  }
}

// Modify initializeDietGeneration to not call startConversation immediately
function initializeDietGeneration() {
  const mainContent = document.querySelector('.main-content');
  if (!mainContent) return;

  mainContent.innerHTML = `
    <div class="diet-experience-container">
      <div class="experience-stage">
        <div class="ai-assistant">
          <div class="ai-avatar-container">
            <lottie-player
              src="https://assets8.lottiefiles.com/packages/lf20_m9zragkd.json"
              background="transparent"
              speed="1"
              style="width: 300px; height: 300px;"
              loop
              autoplay
            ></lottie-player>
          </div>
          <div class="ai-status">
            <div class="status-indicator"></div>
            <span id="statusText">Ready to start your diet journey</span>
          </div>
        </div>
        
        <button id="startButton" class="start-button">
          <span>Start Your Diet Journey</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14"></path>
            <path d="m12 5 7 7-7 7"></path>
          </svg>
        </button>

        <div class="interaction-area" style="display: none;">
          <div class="input-methods">
            <button id="micButton" class="mic-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </button>
            
            <div class="text-input-container">
              <input type="text" id="textInput" placeholder="Type your message here...">
              <button id="sendButton">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
          </div>

          <div id="conversationHistory" class="conversation-history"></div>
        </div>
      </div>
      
      <div class="progress-tracker">
        ${questions.map((_, i) => `
          <div class="progress-step ${i === 0 ? 'current' : ''}" data-step="${i + 1}">
            <div class="step-indicator"></div>
            <div class="step-line"></div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // Initialize event listeners
  const startButton = document.getElementById('startButton');
  const interactionArea = document.querySelector('.interaction-area');
  const micButton = document.getElementById('micButton');
  const textInput = document.getElementById('textInput');
  const sendButton = document.getElementById('sendButton');

  startButton.addEventListener('click', async () => {
    hasUserInteracted = true;
    startButton.style.display = 'none';
    interactionArea.style.display = 'flex';
    await startConversation(); // Only start conversation when button is clicked
  });

  micButton.addEventListener('mousedown', startListening);
  micButton.addEventListener('mouseup', stopListening);
  micButton.addEventListener('mouseleave', stopListening);

  textInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit();
    }
  });

  sendButton.addEventListener('click', handleTextSubmit);

  // Add initial AI message
  addMessageToConversation('ai', "Hi! I'm your AI nutritionist. Click 'Start Your Diet Journey' when you're ready to begin.");
}

// Voice configuration
const USE_ELEVEN_LABS = false; // Set to true to use ElevenLabs, false for browser speech
let ELEVEN_LABS_KEY;

// Get ElevenLabs API Key if needed
if (USE_ELEVEN_LABS) {
  db.collection('11LabsAPI').onSnapshot(querySnapshot => {
    querySnapshot.docs.forEach(doc => {
      ELEVEN_LABS_KEY = doc.data().API;
      console.log("ElevenLabs credentials loaded");
    });
  });
}

let mediaRecorder = null;
let audioChunks = [];

async function startListening() {
  if (isListening) return;
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    isListening = true;
    updateUIForListening(true);
    await playAnimation('listening');
    
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    
    mediaRecorder.addEventListener('dataavailable', event => {
      audioChunks.push(event.data);
    });
    
    mediaRecorder.addEventListener('stop', async () => {
      const audioBlob = new Blob(audioChunks);
      const response = await processAudioResponse(audioBlob);
      stream.getTracks().forEach(track => track.stop());
      
      if (response) {
        handleUserInput(response);
      }
    });
    
    mediaRecorder.start();
  } catch (error) {
    console.error('Error accessing microphone:', error);
    updateStatus('Error accessing microphone. Please ensure microphone permissions are granted.');
  }
}

async function stopListening() {
  if (!isListening || !mediaRecorder) return;
  
  mediaRecorder.stop();
  isListening = false;
  updateUIForListening(false);
}

// Update handleUserInput to properly handle responses
async function handleUserInput(input) {
  if (!input) return;

  // Add the input to userResponses array
  userResponses.push(input);

  // Analyze input for required info
  if (input.toLowerCase().includes('goal') || input.toLowerCase().includes('want') || 
      input.toLowerCase().includes('need') || input.toLowerCase().includes('like')) {
    requiredInfo.goals = true;
  }
  if (input.toLowerCase().includes('eat') || input.toLowerCase().includes('food') || 
      input.toLowerCase().includes('diet') || input.toLowerCase().includes('allerg')) {
    requiredInfo.dietary = true;
  }
  if (input.toLowerCase().includes('day') || input.toLowerCase().includes('work') || 
      input.toLowerCase().includes('life') || input.toLowerCase().includes('active')) {
    requiredInfo.lifestyle = true;
  }

  // Check if we have enough information
  if (userResponses.length >= 3 && Object.values(requiredInfo).filter(v => v).length >= 2) {
    conversationComplete = true;
    await speak("Perfect! I have enough information now. Let me create your personalized diet plan.");
    await generateDietPlan();
  } else {
    await generateResponse(input);
  }
}

async function generateResponse(userInput) {
  await playAnimation('thinking');
  
  if (!API_KEY) {
    console.error('API key not loaded');
    updateStatus('Service not ready. Please try again in a moment.');
    return;
  }

  const prompt = `
    Based on the user's input: "${userInput}"
    Previous responses: ${JSON.stringify(userResponses.slice(0, -1))}
    Questions asked so far: ${userResponses.length}
    Required information still needed: ${JSON.stringify(Object.keys(requiredInfo).filter(key => !requiredInfo[key]))}
    
    Generate a concise follow-up question to gather more information about their diet goals, restrictions, or lifestyle.
    We need at least 3 responses before generating a plan.
    Focus on gathering missing information: ${Object.keys(requiredInfo).filter(key => !requiredInfo[key]).join(', ')}
    Keep the response under 20 words.
  `;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: 0.7,
        max_tokens: 50
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    if (!data?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from API');
    }

    const aiResponse = data.choices[0].message.content;
    await speak(aiResponse);
  } catch (error) {
    console.error('Error generating response:', error);
    updateStatus('Sorry, I had trouble processing that. Please try again.');
    await playAnimation('greeting');
  }
}

function checkRequiredInfo() {
  return Object.values(requiredInfo).every(value => value);
}

// Function to show loading popup
function showLoadingPopup(message) {
  const popup = document.createElement('div');
  popup.className = 'loading-popup';
  popup.innerHTML = `
    <div class="loading-content">
      <lottie-player
        src="https://assets3.lottiefiles.com/packages/lf20_szviypry.json"
        background="transparent"
        speed="1"
        style="width: 200px; height: 200px;"
        loop
        autoplay
      ></lottie-player>
      <p class="loading-message">${message}</p>
      <div class="loading-progress">
        <div class="progress-bar"></div>
      </div>
    </div>
  `;
  document.body.appendChild(popup);
  return popup;
}

// Add generateDietPlan function definition before handleUserInput
async function generateDietPlan() {
  const userResponseData = {
    goals: userResponses[0] || '',
    dietary: userResponses[1] || '',
    lifestyle: userResponses[2] || ''
  };

  const prompt = `As an AI nutritionist specializing in South Indian cuisine, create a structured diet plan based on:

Goals: ${userResponseData.goals}
Dietary Preferences: ${userResponseData.dietary}
Lifestyle: ${userResponseData.lifestyle}

Create a diet plan focusing exclusively on South Indian meals and ingredients. Provide a structured response in this exact format:

{
  "dailyNutrition": {
    "calories": "number (e.g., 2000)",
    "macros": {
      "protein": "percentage",
      "carbs": "percentage",
      "fats": "percentage"
    }
  },
  "mealSchedule": [
    {
      "name": "Breakfast",
      "time": "7:00 AM",
      "calories": "number",
      "options": [
        "South Indian breakfast option 1 (e.g., Idli with sambar)",
        "South Indian breakfast option 2 (e.g., Dosa with chutney)",
        "South Indian breakfast option 3 (e.g., Upma)"
      ]
    },
    {
      "name": "Lunch",
      "time": "12:00 PM",
      "calories": "number",
      "options": [
        "South Indian lunch option 1 (e.g., Rice with sambar and vegetables)",
        "South Indian lunch option 2 (e.g., Bisibelebath)",
        "South Indian lunch option 3 (e.g., Curd rice with pickle)"
      ]
    },
    {
      "name": "Dinner",
      "time": "7:00 PM",
      "calories": "number",
      "options": [
        "South Indian dinner option 1 (e.g., Ragi dosa)",
        "South Indian dinner option 2 (e.g., Millet based dishes)",
        "South Indian dinner option 3 (e.g., Light rice preparations)"
      ]
    }
  ],
  "approvedFoods": {
    "proteins": ["Traditional South Indian protein sources like lentils, legumes, etc."],
    "carbs": ["South Indian grains and carb sources"],
    "fats": ["Traditional South Indian cooking oils and fat sources"],
    "vegetables": ["Common South Indian vegetables"],
    "fruits": ["Locally available South Indian fruits"]
  },
  "avoidFoods": ["List of foods to avoid"],
  "weeklyPlan": {
    "monday": {
      "breakfast": "South Indian breakfast item",
      "lunch": "South Indian lunch combination",
      "dinner": "South Indian dinner item"
    },
    "tuesday": {
      "breakfast": "South Indian breakfast item",
      "lunch": "South Indian lunch combination",
      "dinner": "South Indian dinner item"
    },
    "wednesday": {
      "breakfast": "South Indian breakfast item",
      "lunch": "South Indian lunch combination",
      "dinner": "South Indian dinner item"
    },
    "thursday": {
      "breakfast": "South Indian breakfast item",
      "lunch": "South Indian lunch combination",
      "dinner": "South Indian dinner item"
    },
    "friday": {
      "breakfast": "South Indian breakfast item",
      "lunch": "South Indian lunch combination",
      "dinner": "South Indian dinner item"
    },
    "saturday": {
      "breakfast": "South Indian breakfast item",
      "lunch": "South Indian lunch combination",
      "dinner": "South Indian dinner item"
    },
    "sunday": {
      "breakfast": "South Indian breakfast item",
      "lunch": "South Indian lunch combination",
      "dinner": "South Indian dinner item"
    }
  },
  "progressTracking": {
    "weeklyGoals": ["goal1", "goal2"],
    "monthlyGoals": ["goal1", "goal2"],
    "metrics": ["weight", "measurements", "progress_photos"]
  },
  "supplements": [
    {
      "name": "supplement",
      "dosage": "amount",
      "timing": "when to take"
    }
  ]
}

Ensure all meals are authentic South Indian dishes with proper regional names. Include traditional and healthy South Indian ingredients and cooking methods. All responses should be concise and structured exactly as shown above.`;

  try {
    const loadingPopup = showLoadingPopup('Generating your personalized diet plan...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" }  // Force JSON response
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const dietPlan = JSON.parse(data.choices[0].message.content);
    
    // Save structured data to Firestore
    await db.collection('diets').add({
      userId: currentUser.uid,
      plan: dietPlan, // Now storing structured JSON instead of markdown text
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
      mealsLogged: 0,
      responses: userResponseData,
      dailyCalories: dietPlan.dailyNutrition.calories,
      macros: dietPlan.dailyNutrition.macros
    });

    if (loadingPopup) {
      loadingPopup.remove();
    }

    window.location.href = '../diet-home/index.html';
  } catch (error) {
    console.error('Error generating diet plan:', error);
    showError('Failed to generate diet plan. Please try again.');
  }
}

// Helper function to extract daily calories from diet plan
function extractDailyCalories(dietPlan) {
  const calorieMatch = dietPlan.match(/(\d{1,4})\s*(?:to\s*\d{1,4}\s*)?calories/i);
  return calorieMatch ? parseInt(calorieMatch[1]) : 2000;
}

// Helper function to extract macros from diet plan
function extractMacros(dietPlan) {
  const defaultMacros = { protein: 30, carbs: 40, fat: 30 };
  
  const macroMatches = {
    protein: dietPlan.match(/protein:\s*(\d{1,3})%/i),
    carbs: dietPlan.match(/carb(?:ohydrate)?s:\s*(\d{1,3})%/i),
    fat: dietPlan.match(/fat:\s*(\d{1,3})%/i)
  };

  return {
    protein: macroMatches.protein ? parseInt(macroMatches.protein[1]) : defaultMacros.protein,
    carbs: macroMatches.carbs ? parseInt(macroMatches.carbs[1]) : defaultMacros.carbs,
    fat: macroMatches.fat ? parseInt(macroMatches.fat[1]) : defaultMacros.fat
  };
}

// Function to process audio response using Whisper API
async function processAudioResponse(audioBlob) {
  // Convert audio blob to base64
  const base64Audio = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(audioBlob);
  });

  try {
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        file: base64Audio,
        model: 'whisper-1'
      })
    });

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error('Error processing audio:', error);
    return '';
  }
}

// Function to display the generated diet plan
function displayDietPlan(dietPlan) {
  const mainContent = document.querySelector('.diet-experience-container');
  if (!mainContent) {
    console.error('Could not find main content container');
    return;
  }

  mainContent.innerHTML = `
    <div class="diet-plan-card">
      <div class="diet-plan-content">
        ${marked.parse(dietPlan)}
      </div>
      <div class="diet-plan-actions">
        <button class="button-primary" onclick="saveDietPlan()">
          Save Diet Plan
        </button>
        <button class="button-secondary" onclick="downloadDietPlan()">
          Download PDF
        </button>
      </div>
    </div>
  `;

  // Scroll to top to show the diet plan
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Add animation to the diet plan card
  const dietPlanCard = mainContent.querySelector('.diet-plan-card');
  gsap.from(dietPlanCard, {
    opacity: 0,
    y: 20,
    duration: 0.5,
    ease: "back.out(1.7)"
  });
}

// Add these functions to handle save and download
function saveDietPlan() {
  // Implement save functionality
  alert('Diet plan saved successfully!');
}

function downloadDietPlan() {
  const dietPlanContent = document.querySelector('.diet-plan-content').innerText;
  const blob = new Blob([dietPlanContent], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'diet-plan.txt';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

// Add favicon link to prevent 404
const link = document.createElement('link');
link.rel = 'icon';
link.href = 'data:;base64,iVBORw0KGgo='; // Empty favicon
document.head.appendChild(link);

// Update the CSS animation for the AI talking effect
const style = document.createElement('style');
style.textContent = `
  .ai-avatar-container.speaking {
    animation: glow 2s ease-in-out infinite, pulse 1s ease-in-out infinite;
  }

  @keyframes glow {
    0%, 100% { box-shadow: 0 0 5px rgba(0, 123, 255, 0.2); }
    50% { box-shadow: 0 0 20px rgba(0, 123, 255, 0.6); }
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }

  .ai-status.speaking {
    animation: statusPulse 1s ease-in-out infinite;
  }

  @keyframes statusPulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.02); }
  }

  .text-input-container input {
    flex: 1;
    padding: 12px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 16px;
    transition: border-color 0.3s ease;
  }

  .text-input-container input:focus {
    border-color: #007bff;
    outline: none;
  }

  .text-input-container button {
    background: #007bff;
    border: none;
    border-radius: 8px;
    padding: 12px;
    margin-left: 8px;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }

  .text-input-container button:hover {
    background: #0056b3;
  }

  .text-input-container button svg {
    width: 20px;
    height: 20px;
    stroke: white;
  }
`;
document.head.appendChild(style); 