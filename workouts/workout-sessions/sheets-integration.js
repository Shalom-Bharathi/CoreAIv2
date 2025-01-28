export class SheetsIntegration {
  constructor(credentials) {
    this.credentials = credentials;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Load the Google API client
      await new Promise((resolve, reject) => {
        gapi.load('client', { callback: resolve, onerror: reject });
      });

      // Initialize the client with your credentials
      await gapi.client.init({
        apiKey: this.credentials.api_key,
        discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
      });

      // Load the sheets API
      await gapi.client.load('sheets', 'v4');
      
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing Google Sheets:', error);
      throw error;
    }
  }

  async saveWorkoutCompletion(workoutData) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const spreadsheetId = '1YOUR_SPREADSHEET_ID'; // Replace with your spreadsheet ID
      const range = 'Workouts!A:J';

      const values = [
        [
          new Date().toISOString(), // Timestamp
          workoutData.userId,
          workoutData.workoutName,
          workoutData.workoutId,
          workoutData.type,
          workoutData.difficulty,
          workoutData.duration,
          workoutData.exercisesCompleted,
          workoutData.caloriesBurned,
          'Completed'
        ]
      ];

      const request = {
        spreadsheetId,
        range,
        valueInputOption: 'RAW',
        resource: { values }
      };

      await gapi.client.sheets.spreadsheets.values.append(request);
      console.log('Workout completion saved to Google Sheets');
    } catch (error) {
      console.error('Error saving to Google Sheets:', error);
      throw error;
    }
  }
} 