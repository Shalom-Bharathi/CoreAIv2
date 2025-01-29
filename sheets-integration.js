// Google Sheets API configuration
const SPREADSHEET_ID = '1-your-spreadsheet-id'; // Replace with your actual spreadsheet ID
const API_KEY = 'your-api-key'; // Replace with your actual API key
const SERVICE_ACCOUNT = {
  "type": "service_account",
  "project_id": "total-treat-423211-a1",
  "private_key_id": "56cb259efd8550a38d3e071716c3f002d0a3ae6b",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC1li6WnG7u023p\nOYAUoPiS7fO9ilpsEBkv10RoS6Imp+np0RxIwyTgEsuNh1c9vdfBSGdelANofaiX\nol45hUGJARU1WegNWgSkVOZauRt8dehE895UELD/6zF4r1Xd8OQGo18h0GYH2FTn\nmeMTnailNLgt9Ep2IkNK5LNWh57YO9tEplbmujTr/b6LJziDn559pHhc803v1K5H\nUbemnQ2E55w6e3aeLMP0uvHqQEnwxE+bdie39Tf/25/4qjJI/Z32k05awSKFsNj9\nQ1x8JSK61PU+aLsveDnTBGNp98Run7pYP7lAxF3nNKQY7WHHRQazz6iukbvxNng5\nNzzJU6J5AgMBAAECggEADCHLKqYSLB17wJ/mQWD6QQIDs+X6rpedjZQc7oVT5+NC\n5JIWoq6vCwcWcULZy4OgigbAj6tLiWXddFJ7zlOeq+M8bukUpB4fvniRpcp4qwyx\noDgiFYz1iaB45Xt8o1+emVCKLZcso4xXkXW3NZTl/8uq6bivNOW+VNJwDPFYsoRu\n2iIBsHiIE+OKNbPrQj5xZmLN3xopLH83nZ5PwMP4KhyPgZ3zjNW72LLMxq+mVwj/\n6sRLeQL8RT0irhEbczAtH1AHvws5MT7kzVb8icMRNnjW2QXiKNKkxplYO2J6Ywad\nvcNS4VMTBM+MpRODuyQKhwAKzifaKu/qX6ei3GPp9QKBgQDY+g9aXmJOC+bhAQSu\nG5C4CvTehRv2Z8B4t0kwt6ApDUoGC6nFQXv4jBrGDMdQn1hiIQlwKCj3Q7uYULLo\n0lREnJdxk4nlAWEJ6Qn6Sl/ZYufrJhVHWtJuQhUM2dEUavGVwLPI25xY4O4uBSIO\nkhC4KgZviMwjXvPoXxIHba8ynwKBgQDWPrS+k8oxze2/B4mPb84MBEQ39ut/IhdQ\nI6cowHEOoNmtWTclLzLyfFB6Q2On1an2it1bDOCDL6Rp7QnlUSvlxTatCsT1z1Sc\nrd+6G2+uik8dg4uXu/+EeAJ0a4h9zypuqHyAXwIjCTxI7aFAmcSM8U7aa7epgPX5\n+FA1mhvr5wKBgCK7rNd/gmcR+qyMGC6y1PDROC+iyT4hj6sDVCELVAUeTno3Rb8A\n45J/Aw4vH3zldSWIOlWM6DnkytPwHyOr/7dYBdo1jv5swRbwChvZ6gwHjC6VUxSw\nEj16MJp1B8Yn9HJPfbgqh5WmtBoD0lbYxPpmJ8+U63DCE3NgPKeZxFDrAoGAT9f+\ntCeP6w+70r2UXohkWcYdRl4XVcH2vj8LRPyzJah8d0YQbyMv8X6y313N/fZ66Q7H\nf+9EnJ9cvr1AOt4NZgwhXEvvK0yhU+LYxhsDfCC/a1hi5aGCkHPJNmn87CYQwjy4\naX7+5N/EP8mPluu3fG9R28TZJaqSAR6xhchxL3ECgYEA2O0UuII3GtNB942B65Di\nBvKl81UrlUlyoxBqDJCraNdfMFzMNF3sWDFsCb5cuKeDZT0vZSaXA5asEa9NBX5N\nfgyn4f1lxZhb6GRNeS5LyW9OGLv6IfZjmwZ2KPXgqlWQvfw362nUMx4JFPiIJs/w\nBFhOx1g1Q1OFmdBRBHE+jOI=\n-----END PRIVATE KEY-----\n",
  "client_email": "shalom@total-treat-423211-a1.iam.gserviceaccount.com",
  "client_id": "107157169325542091386",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/shalom%40total-treat-423211-a1.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
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