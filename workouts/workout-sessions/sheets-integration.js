// Google Sheets Integration
const CREDENTIALS = {
  type: "service_account",
  project_id: "total-treat-423211-a1",
  private_key_id: "56cb259efd8550a38d3e071716c3f002d0a3ae6b",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC1li6WnG7u023p\nOYAUoPiS7fO9ilpsEBkv10RoS6Imp+np0RxIwyTgEsuNh1c9vdfBSGdelANofaiX\nol45hUGJARU1WegNWgSkVOZauRt8dehE895UELD/6zF4r1Xd8OQGo18h0GYH2FTn\nmeMTnailNLgt9Ep2IkNK5LNWh57YO9tEplbmujTr/b6LJziDn559pHhc803v1K5H\nUbemnQ2E55w6e3aeLMP0uvHqQEnwxE+bdie39Tf/25/4qjJI/Z32k05awSKFsNj9\nQ1x8JSK61PU+aLsveDnTBGNp98Run7pYP7lAxF3nNKQY7WHHRQazz6iukbvxNng5\nNzzJU6J5AgMBAAECggEADCHLKqYSLB17wJ/mQWD6QQIDs+X6rpedjZQc7oVT5+NC\n5JIWoq6vCwcWcULZy4OgigbAj6tLiWXddFJ7zlOeq+M8bukUpB4fvniRpcp4qwyx\noDgiFYz1iaB45Xt8o1+emVCKLZcso4xXkXW3NZTl/8uq6bivNOW+VNJwDPFYsoRu\n2iIBsHiIE+OKNbPrQj5xZmLN3xopLH83nZ5PwMP4KhyPgZ3zjNW72LLMxq+mVwj/\n6sRLeQL8RT0irhEbczAtH1AHvws5MT7kzVb8icMRNnjW2QXiKNKkxplYO2J6Ywad\nvcNS4VMTBM+MpRODuyQKhwAKzifaKu/qX6ei3GPp9QKBgQDY+g9aXmJOC+bhAQSu\nG5C4CvTehRv2Z8B4t0kwt6ApDUoGC6nFQXv4jBrGDMdQn1hiIQlwKCj3Q7uYULLo\n0lREnJdxk4nlAWEJ6Qn6Sl/ZYufrJhVHWtJuQhUM2dEUavGVwLPI25xY4O4uBSIO\nkhC4KgZviMwjXvPoXxIHba8ynwKBgQDWPrS+k8oxze2/B4mPb84MBEQ39ut/IhdQ\nI6cowHEOoNmtWTclLzLyfFB6Q2On1an2it1bDOCDL6Rp7QnlUSvlxTatCsT1z1Sc\nrd+6G2+uik8dg4uXu/+EeAJ0a4h9zypuqHyAXwIjCTxI7aFAmcSM8U7aa7epgPX5\n+FA1mhvr5wKBgCK7rNd/gmcR+qyMGC6y1PDROC+iyT4hj6sDVCELVAUeTno3Rb8A\n45J/Aw4vH3zldSWIOlWM6DnkytPwHyOr/7dYBdo1jv5swRbwChvZ6gwHjC6VUxSw\nEj16MJp1B8Yn9HJPfbgqh5WmtBoD0lbYxPpmJ8+U63DCE3NgPKeZxFDrAoGAT9f+\ntCeP6w+70r2UXohkWcYdRl4XVcH2vj8LRPyzJah8d0YQbyMv8X6y313N/fZ66Q7H\nf+9EnJ9cvr1AOt4NZgwhXEvvK0yhU+LYxhsDfCC/a1hi5aGCkHPJNmn87CYQwjy4\naX7+5N/EP8mPluu3fG9R28TZJaqSAR6xhchxL3ECgYEA2O0UuII3GtNB942B65Di\nBvKl81UrlUlyoxBqDJCraNdfMFzMNF3sWDFsCb5cuKeDZT0vZSaXA5asEa9NBX5N\nfgyn4f1lxZhb6GRNeS5LyW9OGLv6IfZjmwZ2KPXgqlWQvfw362nUMx4JFPiIJs/w\nBFhOx1g1Q1OFmdBRBHE+jOI=\n-----END PRIVATE KEY-----\n",
  client_email: "shalom@total-treat-423211-a1.iam.gserviceaccount.com",
  client_id: "107157169325542091386",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/shalom%40total-treat-423211-a1.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

const SPREADSHEET_ID = '1q7JdVFir3Md9y8bFKKVmsywsMbaTXcfg7FaZDFK7epA'; // Replace with your actual spreadsheet ID

export class SheetsIntegration {
  constructor() {
    this.accessToken = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      const now = Math.floor(Date.now() / 1000);
      const claim = {
        iss: CREDENTIALS.client_email,
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now
      };

      // Create JWT
      const header = { alg: 'RS256', typ: 'JWT' };
      const headerBase64 = btoa(JSON.stringify(header));
      const claimBase64 = btoa(JSON.stringify(claim));
      const unsignedJwt = `${headerBase64}.${claimBase64}`;

      // Sign JWT using Web Crypto API
      const keyData = this._parsePrivateKey(CREDENTIALS.private_key);
      const key = await crypto.subtle.importKey(
        'pkcs8',
        keyData,
        {
          name: 'RSASSA-PKCS1-v1_5',
          hash: 'SHA-256',
        },
        false,
        ['sign']
      );

      const signature = await crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        key,
        new TextEncoder().encode(unsignedJwt)
      );

      const jwt = `${unsignedJwt}.${btoa(String.fromCharCode(...new Uint8Array(signature)))}`;

      // Exchange JWT for access token
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
      });

      const data = await response.json();
      this.accessToken = data.access_token;
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing sheets:', error);
      throw error;
    }
  }

  async saveWorkoutCompletion(workoutData) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const values = [
        [
          new Date().toISOString(),
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

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Workouts!A:J:append?valueInputOption=RAW`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to save to sheets: ${response.statusText}`);
      }

      console.log('Workout completion saved to Google Sheets');
    } catch (error) {
      console.error('Error saving to Google Sheets:', error);
      throw error;
    }
  }

  _parsePrivateKey(privateKey) {
    // Remove header, footer, and newlines
    const pemContent = privateKey
      .replace('-----BEGIN PRIVATE KEY-----', '')
      .replace('-----END PRIVATE KEY-----', '')
      .replace(/\n/g, '');
    
    // Decode base64 to array buffer
    const binaryString = atob(pemContent);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
} 