// Initialize state variables
const state = {
  currentQuestionIndex: 0,
  userResponses: [],
  isListening: false,
  conversationComplete: false,
  hasUserInteracted: false,
  requiredInfo: {
    goals: false,
    dietary: false,
    lifestyle: false
  }
};

const db = firebase.firestore();

// API Keys and configuration
let API_KEY;
let thingsRefx;
let unsubscribex;

thingsRefx = db.collection('API');

// Wait for API key to be loaded before allowing interactions
unsubscribex = thingsRefx.onSnapshot(querySnapshot => {
  querySnapshot.docs.forEach(doc => {
    API_KEY = doc.data().API;
    console.log("OpenAI API Key loaded");
    // Initialize after API key is loaded
    if (!document.querySelector('.diet-experience-container')) {
      initializeDietGeneration();
    }
  });
});

const OPENAI_API_KEY = API_KEY;

// Questions array
const questions = [
  "Tell me about your fitness journey and what motivates you to make a change in your diet?",
  "Paint me a picture of your typical day - from morning to night. What does your eating schedule look like?",
  "What's your relationship with food? Any comfort foods or dishes that bring back memories?",
  "If you could wave a magic wand and achieve your ideal health, what would that look like?"
];

// Voice configuration
const USE_ELEVEN_LABS = true; // Set to true to use ElevenLabs, false for browser speech
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

// Initialize the application
async function initializeApp() {
  initializeDietGeneration();
}

// Start the application when the document is ready
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();

  // Update navigation links
  const dashboardLink = document.querySelector('a[href="#"].nav-link:not(.active)');
  if (dashboardLink) {
    dashboardLink.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = '../diet-home/index.html';
    });
  }
});

function initializeDietGeneration() {
  const mainContent = document.querySelector('.main-content');
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
            <div class="status-indicator" style="background-color: #007bff;"></div>
            <span id="statusText" class="status-text">Ready to start your diet journey</span>
          </div>
        </div>
        
        <!-- Add start button -->
        <button id="startButton" class="start-button">
          <span>Start Your Diet Journey</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14"></path>
            <path d="m12 5 7 7-7 7"></path>
          </svg>
        </button>

        <!-- Hide interaction area initially -->
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
              <input type="text" class="text-input" placeholder="Type your message here..." id="textInput">
              <button class="send-button" id="sendButton">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
          </div>

          <div class="conversation-history" id="conversationHistory">
            <!-- Only user messages will appear here -->
          </div>
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

  const startButton = document.getElementById('startButton');
  const interactionArea = document.querySelector('.interaction-area');
  const micButton = document.getElementById('micButton');
  const textInput = document.getElementById('textInput');
  const sendButton = document.getElementById('sendButton');
  
  // Start button click handler
  startButton.addEventListener('click', async () => {
    hasUserInteracted = true;
    startButton.style.display = 'none';
    interactionArea.style.display = 'flex';
    await startConversation();
  });

  // Setup mic button for press-and-hold
  micButton.addEventListener('mousedown', () => {
    hasUserInteracted = true;
    startListening();
  });
  micButton.addEventListener('mouseup', stopListening);
  micButton.addEventListener('mouseleave', stopListening);

  // Setup text input handling
  textInput.addEventListener('keypress', (e) => {
    hasUserInteracted = true;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit();
    }
  });

  sendButton.addEventListener('click', () => {
    hasUserInteracted = true;
    handleTextSubmit();
  });

  // Don't automatically start conversation, wait for user interaction
  addMessageToConversation('ai', "Hi! I'm your AI nutritionist. Let's create a personalized diet plan together. You can either speak by holding the microphone button or type your messages below.");
}

async function startConversation() {
  await playAnimation('greeting');
  
  if (hasUserInteracted) {
    const welcomeMessage = "Hi! I'm Core AI. Let's have a chat about your diet goals. Feel free to tell me about what brings you here today.";
    await speak(welcomeMessage);
  }
}

let mediaRecorder = null;
let audioChunks = [];

async function startListening() {
  if (state.isListening) return;
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    state.isListening = true;
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
  if (!state.isListening || !mediaRecorder) return;
  
  mediaRecorder.stop();
  state.isListening = false;
  updateUIForListening(false);
}

async function handleUserInput(input) {
  // Analyze input for required info
  if (input.toLowerCase().includes('goal') || input.toLowerCase().includes('want') || 
      input.toLowerCase().includes('need') || input.toLowerCase().includes('like')) {
    state.requiredInfo.goals = true;
  }
  if (input.toLowerCase().includes('eat') || input.toLowerCase().includes('food') || 
      input.toLowerCase().includes('diet') || input.toLowerCase().includes('allerg')) {
    state.requiredInfo.dietary = true;
  }
  if (input.toLowerCase().includes('day') || input.toLowerCase().includes('work') || 
      input.toLowerCase().includes('life') || input.toLowerCase().includes('active')) {
    state.requiredInfo.lifestyle = true;
  }

  state.userResponses.push(input);
  
  // Ensure minimum 3 questions before generating plan
  if (state.userResponses.length >= 3 && Object.values(state.requiredInfo).filter(v => v).length >= 2) {
    state.conversationComplete = true;
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
    Previous responses: ${JSON.stringify(state.userResponses.slice(0, -1))}
    Questions asked so far: ${state.userResponses.length}
    Required information still needed: ${JSON.stringify(Object.keys(state.requiredInfo).filter(key => !state.requiredInfo[key]))}
    
    Generate a concise follow-up question to gather more information about their diet goals, restrictions, or lifestyle.
    We need at least 3 responses before generating a plan.
    Focus on gathering missing information: ${Object.keys(state.requiredInfo).filter(key => !state.requiredInfo[key]).join(', ')}
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
        model: 'gpt-4o',
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
  return Object.values(state.requiredInfo).every(value => value);
}

// Speech synthesis function
async function speak(text) {
  if (USE_ELEVEN_LABS && ELEVEN_LABS_KEY) {
    try {
      // Using Rachel voice - energetic and friendly female voice
      const VOICE_ID = "21m00Tcm4TlvDq8ikWAM";
      
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVEN_LABS_KEY
        },
        body: JSON.stringify({
          text: text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 1.0,
            use_speaker_boost: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API request failed with status ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audio = new Audio(URL.createObjectURL(audioBlob));
      
      return new Promise((resolve, reject) => {
        audio.onended = () => {
          URL.revokeObjectURL(audio.src); // Clean up
          resolve();
        };
        
        audio.onerror = (error) => {
          URL.revokeObjectURL(audio.src); // Clean up
          reject(error);
        };

        audio.play();
      });

    } catch (error) {
      console.error('ElevenLabs error, falling back to browser speech:', error);
      return useBrowserSpeech(text);
    }
  } else {
    return useBrowserSpeech(text);
  }
}

// Helper function for browser speech
async function useBrowserSpeech(text) {
  return new Promise((resolve, reject) => {
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.2;
      utterance.pitch = 1.2;
      utterance.volume = 1;
      
      // Try to use a female voice
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
      reject(error);
    }
  });
}

function updateUIForListening(listening) {
  const statusIndicator = document.querySelector('.status-indicator');
  
  if (listening) {
    statusIndicator.classList.add('listening');
    updateStatus("I'm listening...");
  } else {
    statusIndicator.classList.remove('listening');
  }
}

// Update the status indicator animation for speech
function updateStatus(text, isSpeaking = false) {
  const statusText = document.getElementById('statusText');
  const statusIndicator = document.querySelector('.status-indicator');
  
  statusText.textContent = text;
  
  if (isSpeaking) {
    // Add speaking animation to the status indicator with rotation
    gsap.to(statusIndicator, {
      scale: 1.2,
      rotation: 360,
      duration: 2,
      repeat: -1,
      ease: "none"  // Use "none" for constant rotation speed
    });
  } else {
    // Reset animation
    gsap.to(statusIndicator, {
      scale: 1,
      rotation: 0,
      duration: 0.3
    });
  }
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

// Function to generate diet plan
async function generateDietPlan() {
  // Show loading state
  const loadingPopup = showLoadingPopup('Generating your personalized diet plan...');
  
  if (!state.userResponses || state.userResponses.length === 0) {
    loadingPopup.remove();
    showError('No user responses found. Please try again.');
    return;
  }

  try {
    // Generate diet plan using OpenAI
    const prompt = `
      Based on the following user responses about their diet and lifestyle:
      ${state.userResponses.map((response, i) => `Response ${i + 1}: ${response}`).join('\n')}
      
      Generate a comprehensive diet plan following this exact JSON structure:
      {
        "diet_details": {
          "diet_type": "string",
          "calories_per_day": number,
          "macronutrient_split": {
            "carbohydrates": {
              "percentage": number,
              "source_examples": ["string"]
            },
            "proteins": {
              "percentage": number,
              "source_examples": ["string"]
            },
            "fats": {
              "percentage": number,
              "source_examples": ["string"]
            }
          },
          "micronutrients": {
            "vitamins": {
              "A": "string",
              "C": "string",
              "D": "string"
            },
            "minerals": {
              "calcium": "string",
              "iron": "string",
              "potassium": "string"
            }
          },
          "hydration_recommendation": {
            "daily_intake": "string",
            "reminders": boolean,
            "tips": ["string"]
          },
          "meal_timing": {
            "breakfast": "string",
            "lunch": "string",
            "dinner": "string",
            "snack_windows": ["string"],
            "fasting_window": "string"
          },
          "additional_guidelines": {
            "dos": ["string"],
            "donts": ["string"],
            "special_tips": ["string"]
          },
          "diet_goal": "string",
          "expected_outcomes": {
            "energy_boost": boolean,
            "improved_digestion": boolean,
            "stable_blood_sugar": boolean,
            "healthy weight management": boolean
          },
          "physical_activity": {
            "recommendation": "string",
            "suggested_activities": ["string"]
          }
        }
      }

      Make sure the diet plan is personalized based on their responses and follows best nutritional practices.
      Return ONLY the JSON object, no additional text.
    `;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API request failed with status ${response.status}`);
    }

    const data = await response.json();
    if (!data?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI API');
    }

    // Parse the generated diet plan
    const generatedDietPlan = JSON.parse(data.choices[0].message.content);
    
    // Save to Firebase
    await saveDietPlan(generatedDietPlan);

    // Remove loading popup
    loadingPopup.remove();
    
    // Redirect to diet home
    window.location.href = '../diet-home/index.html';
  } catch (error) {
    console.error('Error generating diet plan:', error);
    loadingPopup.remove();
    showError('Failed to generate diet plan. Please try again.');
  }
}

// Function to show error message
function showError(message) {
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

// Function to process audio response using Whisper API
async function processAudioResponse(audioBlob) {
  if (!API_KEY) {
    console.error('API key not found');
    updateStatus('Service not ready. Please try again in a moment.');
    return '';
  }

  try {
    // Create form data for the file upload
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY.trim()}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Audio transcription error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`Transcription failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.text || '';
  } catch (error) {
    console.error('Error processing audio:', error);
    updateStatus('Sorry, I had trouble understanding that. Please try again.');
    return '';
  }
}

// Add this function after initializeDietGeneration
async function playAnimation(type) {
  const avatarContainer = document.querySelector('.ai-avatar-container');
  
  switch(type) {
    case 'greeting':
      // Add greeting animation class
      avatarContainer.classList.add('greeting');
      // Play greeting animation
      gsap.to(avatarContainer, {
        scale: 1.1,
        duration: 0.5,
        yoyo: true,
        repeat: 1,
        ease: "elastic.out(1, 0.3)"
      });
      
      // Add welcome text animation
      const statusText = document.getElementById('statusText');
      gsap.from(statusText, {
        y: 20,
        opacity: 0,
        duration: 0.5,
        ease: "back.out(1.7)"
      });
      
      break;
      
    case 'listening':
      // Add pulse animation
      gsap.to(avatarContainer, {
        scale: 1.05,
        duration: 0.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
      break;
      
    case 'thinking':
      // Add thinking animation
      gsap.to(avatarContainer, {
        rotation: 3,
        duration: 1,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
      break;
      
    case 'speaking':
      // Add speaking animation
      gsap.to(avatarContainer, {
        y: -5,
        duration: 0.3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
      break;
  }
  
  // Return a promise that resolves after animation
  return new Promise(resolve => setTimeout(resolve, 1000));
}

// Function to handle text input
async function handleTextSubmit() {
  const textInput = document.getElementById('textInput');
  const text = textInput.value.trim();
  
  if (text) {
    addMessageToConversation('user', text);
    textInput.value = '';
    await handleUserInput(text);
  }
}

// Update addMessageToConversation to only show user messages
function addMessageToConversation(type, content) {
  if (type === 'user') {
    const conversationHistory = document.getElementById('conversationHistory');
    if (!conversationHistory) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    
    avatarDiv.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = content;
    
    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);
    
    conversationHistory.appendChild(messageDiv);
    conversationHistory.scrollTop = conversationHistory.scrollHeight;
  }
}

// Add favicon link to prevent 404
const link = document.createElement('link');
link.rel = 'icon';
link.href = 'data:;base64,iVBORw0KGgo='; // Empty favicon
document.head.appendChild(link);

async function saveDietPlan(dietPlan) {
    try {
        const user = firebase.auth().currentUser;
        if (!user) {
            console.error('No user logged in');
            alert('Please log in to save your diet plan');
            window.location.href = '../../index.html';
            return;
        }

        console.log('Current user:', user.email, 'UID:', user.uid);
        console.log('Original diet plan:', dietPlan);

        // Add user ID and timestamp to diet plan
        const dietPlanWithUser = {
            ...dietPlan,
            userId: user.uid,
            userEmail: user.email,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            createdAt: new Date().toISOString()
        };

        console.log('Saving diet plan with user data:', dietPlanWithUser);

        // Save to dietPlan collection
        const docRef = await firebase.firestore().collection('dietPlan')
            .add(dietPlanWithUser);
        
        console.log('Diet plan saved to dietPlan collection with ID:', docRef.id);
        
        // Also update the user's document with the latest diet plan and the document ID
        const userDietPlan = {
            ...dietPlanWithUser,
            planId: docRef.id  // Include the document ID for reference
        };

        await firebase.firestore().collection('users')
            .doc(user.uid)
            .set({
                dietPlan: userDietPlan,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        
        console.log('Diet plan saved to user document with reference ID');
        
        // Verify the save was successful
        const savedPlan = await docRef.get();
        if (savedPlan.exists) {
            alert('Verified diet plan was saved:', savedPlan.data());
            // Wait a moment to ensure Firestore updates are complete
            setTimeout(() => {
                console.log('Redirecting to diet home page...');
        window.location.href = '../diet-home/index.html';
            }, 1000);
        } else {
            throw new Error('Diet plan was not saved properly');
        }
    } catch (error) {
        console.error('Error saving diet plan:', error);
        alert('Failed to save diet plan. Please try again.');
    }
} 