// Google Sheets API configuration
const SPREADSHEET_ID = '1-your-spreadsheet-id'; // Replace with your actual spreadsheet ID
const API_KEY = 'your-api-key'; // Replace with your actual API key
const SHEET_NAMES = {
  vitals: 'vitals',
  workouts: 'workouts'
};

/**
 * Fetches data from a specified sheet
 * @param {string} sheetName - Name of the sheet to fetch data from
 * @returns {Promise<Array>} Array of row data
 */
export async function fetchSheetData(sheetName) {
  try {
    const range = `${SHEET_NAMES[sheetName]}!A2:Z`; // Start from A2 to skip headers
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (sheetName === 'workouts') {
      return processWorkoutData(data.values || []);
    } else {
      return data.values || [];
    }
  } catch (error) {
    console.error(`Error fetching ${sheetName} data:`, error);
    return [];
  }
}

/**
 * Processes workout data into a structured format
 * @param {Array} rows - Raw workout data rows
 * @returns {Array} Processed workout objects
 */
function processWorkoutData(rows) {
  return rows.map(row => {
    try {
      return {
        date: row[0],
        type: row[1],
        duration: parseInt(row[2]) || 0,
        calories: parseInt(row[3]) || 0,
        intensity: row[4],
        notes: row[5] || '',
        steps: parseInt(row[6]) || 0
      };
    } catch (error) {
      console.error('Error processing workout row:', error, row);
      return null;
    }
  }).filter(workout => workout !== null);
}

/**
 * Formats a date object to YYYY-MM-DD string
 * @param {Date} date - Date object to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Gets the week number for a given date
 * @param {Date} date - Date to get week number for
 * @returns {number} Week number
 */
export function getWeekNumber(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

/**
 * Checks if two dates are the same day
 * @param {Date} date1 - First date to compare
 * @param {Date} date2 - Second date to compare
 * @returns {boolean} True if dates are the same day
 */
export function isSameDay(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

/**
 * Groups data by date
 * @param {Array} data - Array of data objects with date property
 * @returns {Object} Data grouped by date
 */
export function groupByDate(data) {
  return data.reduce((acc, item) => {
    const date = formatDate(new Date(item.date));
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(item);
    return acc;
  }, {});
}

/**
 * Calculates average for an array of numbers
 * @param {Array<number>} numbers - Array of numbers
 * @returns {number} Average value
 */
export function calculateAverage(numbers) {
  if (!numbers.length) return 0;
  return numbers.reduce((a, b) => a + b, 0) / numbers.length;
}

/**
 * Gets data for a specific date range
 * @param {Array} data - Array of data objects
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Array} Filtered data
 */
export function getDataInDateRange(data, startDate, endDate) {
  return data.filter(item => {
    const itemDate = new Date(item.date);
    return itemDate >= startDate && itemDate <= endDate;
  });
}

/**
 * Calculates total calories burned for a set of workouts
 * @param {Array} workouts - Array of workout objects
 * @returns {number} Total calories burned
 */
export function calculateTotalCalories(workouts) {
  return workouts.reduce((total, workout) => total + (workout.calories || 0), 0);
}

/**
 * Calculates total steps for a set of workouts
 * @param {Array} workouts - Array of workout objects
 * @returns {number} Total steps
 */
export function calculateTotalSteps(workouts) {
  return workouts.reduce((total, workout) => total + (workout.steps || 0), 0);
}

/**
 * Gets the most recent data point
 * @param {Array} data - Array of data objects with date property
 * @returns {Object|null} Most recent data point or null if no data
 */
export function getMostRecentData(data) {
  if (!data.length) return null;
  return data.reduce((latest, current) => {
    const currentDate = new Date(current.date);
    const latestDate = new Date(latest.date);
    return currentDate > latestDate ? current : latest;
  });
}

// Add error handling for API requests
window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled promise rejection:', event.reason);
  // You might want to show an error message to the user here
}); 