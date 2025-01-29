import { firestore, auth, storage } from './firebase-config.js';

let API_KEY;
const thingsRef = firestore.collection('API');

const unsubscribe = thingsRef.onSnapshot(querySnapshot => {
  querySnapshot.docs.forEach(doc => {
    API_KEY = doc.data().API;
    console.log('API Key loaded:', API_KEY ? 'Key present' : 'Key missing');
  });
});

export async function analyzeBody(imageUrl) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY.trim()}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this body image and provide a detailed JSON response with the following information:
                {
                  "bodyType": "detailed body type classification (ectomorph, mesomorph, endomorph)",
                  "muscleDistribution": {
                    "upperBody": "analysis of upper body muscle distribution",
                    "core": "analysis of core muscle distribution",
                    "lowerBody": "analysis of lower body muscle distribution"
                  },
                  "fatDistribution": {
                    "upperBody": "analysis of upper body fat distribution",
                    "core": "analysis of core fat distribution",
                    "lowerBody": "analysis of lower body fat distribution"
                  },
                  "muscleDefinition": "detailed analysis of muscle definition and tone",
                  "posture": "analysis of posture and alignment",
                  "estimatedBodyFatPercentage": "estimated body fat percentage range",
                  "estimatedBiologicalAge": "estimated biological age range based on physical appearance",
                  "estimatedMeasurements": {
                    "height": "estimated height range in cm",
                    "weight": "estimated weight range in kg"
                  },
                  "recommendations": {
                    "training": ["list of specific training recommendations based on body analysis"],
                    "nutrition": ["list of nutrition recommendations based on body composition"],
                    "posture": ["list of posture improvement recommendations"]
                  }
                }`
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        max_tokens: 1000
      })
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }

    // Parse the JSON response from the message content
    const analysisResult = JSON.parse(data.choices[0].message.content);

    // Store the analysis in Firebase
    const user = auth.currentUser;
    if (user) {
      await firestore.setDoc(
        firestore.doc('bodyAnalysis', user.uid), 
        {
          analysis: analysisResult,
          imageUrl,
          timestamp: firestore.serverTimestamp()
        }
      );
    }

    return analysisResult;
  } catch (error) {
    console.error('Error analyzing body:', error);
    throw error;
  }
}

export async function getLatestAnalysis() {
  const user = auth.currentUser;
  if (!user) return null;

  try {
    const doc = await firestore.getDoc(firestore.doc('bodyAnalysis', user.uid));
    return doc.exists() ? doc.data() : null;
  } catch (error) {
    console.error('Error fetching analysis:', error);
    return null;
  }
} 