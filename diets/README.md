# AI Diet Plan Generator

This feature allows users to generate personalized diet plans through voice or text interaction with an AI assistant. The system uses ChatGPT for diet plan generation and ElevenLabs for natural voice synthesis.

## Features

- Interactive AI assistant with voice and text input
- Voice synthesis using ElevenLabs for natural-sounding responses
- Progress tracking through a step-by-step interface
- Comprehensive diet plan generation based on user preferences
- Visual dashboard displaying diet plan details
- Integration with Firebase for data persistence

## Setup

1. Copy the `.env.example` file to `.env` and fill in your API keys:
   ```bash
   cp .env.example .env
   ```

2. Add your API keys to the `.env` file:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
   ```

3. Make sure you have the required dependencies installed:
   - Chart.js for data visualization
   - Firebase for data storage
   - Web Speech API for voice recognition (built into modern browsers)

## File Structure

```
diets/
├── diet-generator.html    # Diet plan generation page
├── diet-generator.js      # Voice interaction and AI logic
├── diet-dashboard.html    # Diet plan visualization page
├── diet-dashboard.js      # Dashboard display logic
├── diet-styles.css        # Diet feature-specific styles
├── elevenlabs-config.js   # ElevenLabs API configuration
└── README.md             # This file
```

## Usage

1. Navigate to the diet generator page
2. Answer the AI's questions using voice or text input
3. Wait for the diet plan generation
4. View your personalized diet plan in the dashboard
5. Track your progress and regenerate the plan as needed

## Diet Plan Structure

The generated diet plan follows this JSON structure:

```json
{
  "user_id": "unique_user_id",
  "diet_details": {
    "diet_type": "string",
    "calories_per_day": "number",
    "macronutrient_split": {
      "carbohydrates": { "percentage": "number" },
      "proteins": { "percentage": "number" },
      "fats": { "percentage": "number" }
    },
    "micronutrients": {
      "vitamins": {},
      "minerals": {}
    },
    "hydration_recommendation": {
      "daily_intake": "string",
      "reminders": "boolean"
    },
    "meal_timing": {
      "breakfast": "string",
      "lunch": "string",
      "dinner": "string"
    },
    "additional_guidelines": {
      "dos": ["string"],
      "donts": ["string"]
    }
  }
}
```

## API Integration

### OpenAI (ChatGPT)
- Used for generating personalized diet plans
- Requires API key in `.env` file
- Uses GPT-4 model for accurate nutrition advice

### ElevenLabs
- Used for natural voice synthesis
- Requires API key in `.env` file
- Uses the "Rachel" voice model for clear communication

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Partial support (some Web Speech API features may be limited)

## Security Notes

- API keys are stored in `.env` file and should never be committed to version control
- User data is stored securely in Firebase
- Authentication is required to access diet plans 