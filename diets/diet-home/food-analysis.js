let stream = null;
let selectedImage = null;

let API_KEY;
let thingsRefx;
let unsubscribex;
let db = firebase.firestore();
thingsRefx = db.collection('API');

unsubscribex = thingsRefx.onSnapshot(querySnapshot => {
  querySnapshot.docs.forEach(doc => {
    API_KEY = doc.data().API;
  });
});

// Camera handling
window.toggleCamera = async () => {
  if (stream) {
    stopCamera();
    return;
  }

  try {
    stream = await navigator.mediaDevices.getUserMedia({ 
      video: { 
        facingMode: 'environment'
      } 
    });
    const cameraPreview = document.getElementById('camera-preview');
    cameraPreview.srcObject = stream;
    cameraPreview.play();
    cameraPreview.classList.remove('hidden');
    document.getElementById('camera-placeholder').classList.add('hidden');
    document.getElementById('image-preview-container').classList.add('hidden');
    document.getElementById('capture-button').classList.remove('hidden');
    document.getElementById('camera-toggle').innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
      </svg>
      Close Camera
    `;
    selectedImage = null;
    updateAnalyzeButton();
  } catch (err) {
    console.error('Error accessing camera:', err);
    alert('Unable to access camera. Please ensure you have granted camera permissions.');
  }
};

const stopCamera = () => {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
  document.getElementById('camera-preview').classList.add('hidden');
  document.getElementById('capture-button').classList.add('hidden');
  document.getElementById('camera-placeholder').classList.remove('hidden');
  document.getElementById('camera-toggle').innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
      <circle cx="12" cy="13" r="3"/>
    </svg>
    Open Camera
  `;
};

window.captureImage = () => {
  const cameraPreview = document.getElementById('camera-preview');
  const canvas = document.createElement('canvas');
  canvas.width = cameraPreview.videoWidth;
  canvas.height = cameraPreview.videoHeight;
  canvas.getContext('2d').drawImage(cameraPreview, 0, 0);
  selectedImage = canvas.toDataURL('image/jpeg');
  
  document.getElementById('image-preview').src = selectedImage;
  document.getElementById('image-preview-container').classList.remove('hidden');
  document.getElementById('camera-placeholder').classList.add('hidden');
  stopCamera();
  updateAnalyzeButton();
};

window.handleImageUpload = (event) => {
  const file = event.target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onloadend = () => {
      selectedImage = reader.result;
      document.getElementById('image-preview').src = selectedImage;
      document.getElementById('image-preview-container').classList.remove('hidden');
      document.getElementById('camera-placeholder').classList.add('hidden');
      stopCamera();
      updateAnalyzeButton();
    };
    reader.readAsDataURL(file);
  }
};

window.clearImage = () => {
  selectedImage = null;
  document.getElementById('image-preview-container').classList.add('hidden');
  document.getElementById('camera-placeholder').classList.remove('hidden');
  updateAnalyzeButton();
};

const updateAnalyzeButton = () => {
  const analyzeButton = document.getElementById('analyze-button');
  analyzeButton.disabled = !selectedImage;
  analyzeButton.className = `analyze-button ${!selectedImage ? 'disabled' : ''}`;
};

window.analyzeImage = async () => {
  if (!selectedImage) {
    alert('Please select or capture an image first.');
    return;
  }
  
  if (!API_KEY) {
    console.error('API key not found');
    alert('Unable to analyze image. API key not configured.');
    return;
  }

  const analyzeButton = document.getElementById('analyze-button');
  const loadingSpinner = document.getElementById('loading-spinner');
  const analyzeText = document.getElementById('analyze-text');
  const resultsSection = document.getElementById('results-section');

  // Show loading state
  analyzeButton.disabled = true;
  loadingSpinner.classList.remove('hidden');
  loadingSpinner.classList.add('flex');
  analyzeText.classList.add('hidden');
  resultsSection.classList.add('hidden');

  try {
    // Get the user's diet type from the diet plan
    const user = firebase.auth().currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    let dietType = 'balanced';
    try {
      const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
      const userData = userDoc.data();
      if (userData?.dietPlan?.diet_type) {
        dietType = userData.dietPlan.diet_type;
      }
    } catch (error) {
      console.warn('Error fetching diet type:', error);
      // Continue with default diet type
    }

    // Clean up the base64 image string
    const base64Image = selectedImage.split(',')[1];
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this food image and provide a JSON response with the following information:
                {
                  "foodName": "name of the dish",
                  "ingredients": "list of main ingredients",
                  "calories": "estimated calories here",
                  "macronutrients": {
                    "protein": "protein amount",
                    "carbs": "carbs amount",
                    "fat": "fat amount"
                  },
                  "dietCompatibility": "compatibility with ${dietType} diet and explanation"
                }`
              },
              {
                type: "image_url",
                image_url: {
                  url: selectedImage
                }
              }
            ]
          }
        ],
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Response:', response.status, errorData);
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in response');
    }

    // Try to extract JSON from the response
    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      analysis = JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error parsing response:', error);
      throw new Error('Invalid response format');
    }
    
    // Update results with fade-in animation
    resultsSection.style.opacity = '0';
    resultsSection.classList.remove('hidden');
    
    // Update all result fields
    const updateField = (id, value, defaultValue = 'Unable to determine') => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = value || defaultValue;
      }
    };

    updateField('food-name-result', analysis.foodName);
    updateField('ingredients-result', analysis.ingredients);
    updateField('calories-result', analysis.calories);
    updateField('protein-result', analysis.macronutrients?.protein, 'N/A');
    updateField('carbs-result', analysis.macronutrients?.carbs, 'N/A');
    updateField('fat-result', analysis.macronutrients?.fat, 'N/A');
    updateField('diet-result', analysis.dietCompatibility);
    
    // Trigger reflow for animation
    resultsSection.offsetHeight;
    resultsSection.style.transition = 'opacity 0.3s ease-in-out';
    resultsSection.style.opacity = '1';
  } catch (error) {
    console.error('Error analyzing image:', error);
    
    // Show error message to user
    alert(`Error analyzing image: ${error.message}`);
    
    // Show fallback results
    resultsSection.style.opacity = '0';
    resultsSection.classList.remove('hidden');
    
    const fields = ['food-name-result', 'ingredients-result', 'calories-result', 
                   'protein-result', 'carbs-result', 'fat-result', 'diet-result'];
    fields.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = id.includes('result') ? 'N/A' : 'Unable to determine';
      }
    });
    
    // Trigger reflow for animation
    resultsSection.offsetHeight;
    resultsSection.style.transition = 'opacity 0.3s ease-in-out';
    resultsSection.style.opacity = '1';
  } finally {
    // Reset loading state
    analyzeButton.disabled = false;
    loadingSpinner.classList.add('hidden');
    loadingSpinner.classList.remove('flex');
    analyzeText.classList.remove('hidden');
    updateAnalyzeButton();
  }
}; 