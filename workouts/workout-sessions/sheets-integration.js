import { google } from 'googleapis';

export class SheetsIntegration {
  constructor(credentialsPath) {
    this.credentialsPath = credentialsPath;
    this.auth = null;
    this.sheets = null;
  }

  async initialize() {
    try {
      const credentials = require(this.credentialsPath);
      this.auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      const client = await this.auth.getClient();
      this.sheets = google.sheets({ version: 'v4', auth: client });
    } catch (error) {
      console.error('Error initializing Google Sheets:', error);
      throw error;
    }
  }

  async saveWorkoutCompletion(workoutData) {
    if (!this.sheets) {
      throw new Error('Google Sheets not initialized');
    }

    try {
      const spreadsheetId = '1YOUR_SPREADSHEET_ID'; // Replace with your spreadsheet ID
      const range = 'Workouts!A:J'; // Adjust range based on your needs

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
        resource: {
          values
        }
      };

      await this.sheets.spreadsheets.values.append(request);
      console.log('Workout completion saved to Google Sheets');
    } catch (error) {
      console.error('Error saving to Google Sheets:', error);
      throw error;
    }
  }
} 