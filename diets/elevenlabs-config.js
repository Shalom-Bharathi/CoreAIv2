import { db } from '../firebase-config.js';

let ELEVENLABS_API_KEY;
let thingsRefx;
let unsubscribex;

thingsRefx = db.collection('11LabsAPI');

unsubscribex = thingsRefx.onSnapshot(querySnapshot => {
  querySnapshot.docs.forEach(doc => {
    ELEVENLABS_API_KEY = doc.data().API;
  });
});

// ElevenLabs API configuration
export const ELEVENLABS_CONFIG = {
    get apiKey() { return ELEVENLABS_API_KEY; }, // Dynamic getter for the API key
    voiceId: 'EXAVITQu4vr4xnSDxMaL', // Rachel voice ID
    modelId: 'eleven_monolingual_v1',
    baseUrl: 'https://api.elevenlabs.io/v1'
};

// Function to convert text to speech using ElevenLabs API
export async function textToSpeech(text) {
    if (!ELEVENLABS_CONFIG.apiKey) {
        throw new Error('ElevenLabs API key is not configured or still loading');
    }

    try {
        const response = await fetch(`${ELEVENLABS_CONFIG.baseUrl}/text-to-speech/${ELEVENLABS_CONFIG.voiceId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': ELEVENLABS_CONFIG.apiKey
            },
            body: JSON.stringify({
                text,
                model_id: ELEVENLABS_CONFIG.modelId,
                voice_settings: {
                    stability: 0.75,
                    similarity_boost: 0.75
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Failed to convert text to speech: ${response.status}`);
        }

        const audioBlob = await response.blob();
        const audio = new Audio(URL.createObjectURL(audioBlob));
        
        // Add error handling for audio playback
        audio.onerror = (error) => {
            console.error('Error playing audio:', error);
            throw new Error('Failed to play audio');
        };

        return audio;
    } catch (error) {
        console.error('Error converting text to speech:', error);
        throw error;
    }
}

// Cleanup function to unsubscribe from Firebase listener
export function cleanup() {
    if (unsubscribex) {
        unsubscribex();
    }
} 