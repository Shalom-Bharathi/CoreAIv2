// Google Sheets Integration for Dashboard
const CREDENTIALS = {
  "type": "service_account",
  "project_id": "total-treat-423211-a1",
  "private_key_id": "56cb259efd8550a38d3e071716c3f002d0a3ae6b",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDGBPXBxHxvEQKB\nXZXpxZYGxvxJxPELGBVGbKq+kGhZzKuGZr+IeHp+J6cxHvIYxkNRZzpkIQYiHQWB\nPQELZTF+BvZT+f+NGBLs7+oVYBqzKJbHoKsVHZ6R6+e4QEqX8ZQqNxNrzYkXiZwf\nPvbKVJXPVHr+ZAhQjQJQFYqQWQkDnT/oKj5YT+DTPkgvd3AC+QP+jiisSmEPaYAP\nXVxpCm+hYEyQyHrNXHYJQqPH8tqzusscjUQHwxzQHqJrOOB3EHv/+zyqzxK5Xz8O\nPGtHPh5qQqD1QJb9PCF5oj+Ce6R/ZEe5ZQ+WBvYHEJXFdgvHFTlZBGzDzlvAjxm7\nNQXXtQwfAgMBAAECggEABCHLKP/+UHOPGlTJsKIzRHZBVMtF/G+VZZVjYBEQf6Aq\nPLQf6PCkGa5JsXeEzZBVcvh+fXkZCSzHJVsNPnVpEVXFRGcGmHKfYsxHVJVYUBZt\nPMvVVJvEE1R+MmGHFE+dOB8XFXO2J+HF5zEZFYn1kS5+VmNBqxLsWvBx6VcyXVLw\nPHpBwB/GBHgV7NGyCsrWJi5RXaxLPJ+FDUHQvQWrjKBqDLyYvhNpZzHBQSe0QBQJ\nYTUhxlTRUKBj+JQOHYq7wFEWO4LxJzgHj8FHhHYbqJfE+0WxE4LFPqpB6P5UQWXS\nDxEEkQGD5glKYNj0DzBcVLrZ5QbZxEJ2YGGgxvnQAQKBgQDmZcFGxEHrUXV3iD+h\nXPQYHE0tpJJKmyj+cz7v+RjYQ9AEGLNGVo0GvRD+rQtQXLEDQTHd5WpzCVOzVJVx\nBKfO3xtDZAvgUFJAHF/oYDL1CSYEqS7YGQHjQZRQqUxzuB4VB7z4VFUmJVQNXTNY\nELPTDSHcGYRrUkYs4yQZgwKBgQDb2Ql8IXpUVFcuNs/+04fhRzCkqWr0Fc6VGVS7\nXq9RGf5QvT7zLRYxEyP5xEbyFKYH1g4WGQwx4TJmYCQQbXq+JVwOqjv8E4qQHBz5\nKJYUhGU/+gjzHXEf5jzYuOZXZqUM8rBxQXQJQHEEWjGX5i2U5hQYzN2pgXVXYYVl\nNQKBgBWOxEYgPwZNlKbq8VqRHQKBgQDmZcFGxEHrUXV3iD+hXPQYHE0tpJJKmyj+\ncz7v+RjYQ9AEGLNGVo0GvRD+rQtQXLEDQTHd5WpzCVOzVJVxBKfO3xtDZAvgUFJA\nHF/oYDL1CSYEqS7YGQHjQZRQqUxzuB4VB7z4VFUmJVQNXTNYELPTDSHcGYRrUkYs\n4yQZgwKBgQDb2Ql8IXpUVFcuNs/+04fhRzCkqWr0Fc6VGVS7Xq9RGf5QvT7zLRYx\nEyP5xEbyFKYH1g4WGQwx4TJmYCQQbXq+JVwOqjv8E4qQHBz5KJYUhGU/+gjzHXEf\n5jzYuOZXZqUM8rBxQXQJQHEEWjGX5i2U5hQYzN2pgXVXYYVlNQKBgBWOxEYgPwZN\nlKbq8VqRHQKBgQDmZcFGxEHrUXV3iD+hXPQYHE0tpJJKmyj+cz7v+RjYQ9AEGLNG\nVo0GvRD+rQtQXLEDQTHd5WpzCVOzVJVxBKfO3xtDZAvgUFJAHF/oYDL1CSYEqS7Y\nGQHjQZRQqUxzuB4VB7z4VFUmJVQNXTNYELPTDSHcGYRrUkYs4yQZgwKBgQDb2Ql8\nIXpUVFcuNs/+04fhRzCkqWr0Fc6VGVS7Xq9RGf5QvT7zLRYxEyP5xEbyFKYH1g4W\nGQwx4TJmYCQQbXq+JVwOqjv8E4qQHBz5KJYUhGU/+gjzHXEf5jzYuOZXZqUM8rBx\nQXQJQHEEWjGX5i2U5hQYzN2pgXVXYYVlNQKBgBWOxEYgPwZNlKbq8VqR\n-----END PRIVATE KEY-----\n",
  "client_email": "shalom@total-treat-423211-a1.iam.gserviceaccount.com",
  "client_id": "107157169325542091386",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/shalom%40total-treat-423211-a1.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

const SPREADSHEET_ID = '1q7JdVFir3Md9y8bFKKVmsywsMbaTXcfg7FaZDFK7epA';

export class DashboardSheetsIntegration {
  constructor() {
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  async initialize() {
    if (!this.accessToken || new Date() >= this.tokenExpiry) {
      await this.getAccessToken();
    }
  }

  async getAccessToken() {
    const header = {
      alg: 'RS256',
      typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const oneHour = 60 * 60;
    const claim = {
      iss: CREDENTIALS.client_email,
      scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
      aud: CREDENTIALS.token_uri,
      exp: now + oneHour,
      iat: now
    };

    // Create JWT
    const encodedHeader = btoa(JSON.stringify(header));
    const encodedClaim = btoa(JSON.stringify(claim));
    const signatureInput = `${encodedHeader}.${encodedClaim}`;
    
    // Sign with private key
    const key = CREDENTIALS.private_key;
    const encoder = new TextEncoder();
    const signatureBytes = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      key,
      encoder.encode(signatureInput)
    );
    const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));

    const jwt = `${encodedHeader}.${encodedClaim}.${signature}`;

    // Exchange JWT for access token
    const response = await fetch(CREDENTIALS.token_uri, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    });

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = new Date(now + data.expires_in * 1000);
  }

  async fetchWorkoutStats(userId) {
    await this.initialize();

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Workouts!A2:E`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      }
    );

    const data = await response.json();
    const workouts = data.values || [];

    // Filter workouts for the specific user
    const userWorkouts = workouts.filter(row => row[0] === userId);

    return {
      totalWorkouts: userWorkouts.length,
      averageDuration: this.calculateAverage(userWorkouts.map(row => parseFloat(row[2]))),
      totalCalories: userWorkouts.reduce((sum, row) => sum + parseFloat(row[3]), 0),
      completionRate: this.calculateCompletionRate(userWorkouts)
    };
  }

  async fetchWorkoutHistory(userId) {
    await this.initialize();

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Workouts!A2:E`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      }
    );

    const data = await response.json();
    const workouts = data.values || [];

    // Filter and format workouts for the specific user
    return workouts
      .filter(row => row[0] === userId)
      .map(row => ({
        date: row[1],
        duration: parseFloat(row[2]),
        calories: parseFloat(row[3]),
        completed: row[4] === 'true'
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 14); // Get last 14 days
  }

  calculateAverage(numbers) {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  calculateCompletionRate(workouts) {
    if (workouts.length === 0) return 0;
    const completed = workouts.filter(row => row[4] === 'true').length;
    return (completed / workouts.length) * 100;
  }
} 