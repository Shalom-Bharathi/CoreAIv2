let API_KEY;
let thingsRef;
let unsubscribe;
let db = firebase.firestore();
thingsRef = db.collection('API');

unsubscribe = thingsRef.onSnapshot(querySnapshot => {
  querySnapshot.docs.forEach(doc => {
    API_KEY = doc.data().API;
    console.log('API Key loaded:', API_KEY ? 'Key present' : 'Key missing');
  });
});

export async function analyzeBody(imageUrl, height, weight) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY.trim()}`
      },
      body: JSON.stringify({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this body image and provide a detailed JSON response with the following information for someone who is ${height}cm tall and weighs ${weight}kg:
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
                  "estimatedBodyFatPercentage": "estimated body fat percentage",
                  "estimatedBiologicalAge": "estimated biological age based on physical appearance",
                  "recommendations": {
                    "training": ["list of training recommendations"],
                    "nutrition": ["list of nutrition recommendations"],
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
    const user = firebase.auth().currentUser;
    if (user) {
      await firebase.firestore().collection('bodyAnalysis').doc(user.uid).set({
        height,
        weight,
        analysis: analysisResult,
        imageUrl,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
    }

    return analysisResult;
  } catch (error) {
    console.error('Error analyzing body:', error);
    throw error;
  }
}

export async function getLatestAnalysis() {
  const user = firebase.auth().currentUser;
  if (!user) return null;

  try {
    const doc = await firebase.firestore().collection('bodyAnalysis').doc(user.uid).get();
    return doc.exists ? doc.data() : null;
  } catch (error) {
    console.error('Error fetching analysis:', error);
    return null;
  }
} 