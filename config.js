require('dotenv').config();

const config = {
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
  },

  upload: {
    maxFileSize: (process.env.MAX_FILE_SIZE_MB || 10) * 1024 * 1024,
    maxFiles: parseInt(process.env.MAX_FILES) || 12,
    uploadDir: 'uploads',
  },

  api: {
    googleApiKey: process.env.GOOGLE_API_KEY,
    googleApiKey1: process.env.GOOGLE_API_KEY1,
    googleApiKey2: process.env.GOOGLE_API_KEY2,
    googleApiKey3: process.env.GOOGLE_API_KEY3,
    googleApiKey4: process.env.GOOGLE_API_KEY4,
    githubApiToken: process.env.GITHUB_API_TOKEN,
    githubEndpoint: 'https://models.github.ai/inference',
  },

  // Helper function to get Google API key by number (0, 1, 2, 3, or 4)
  getGoogleApiKey: function(keyNumber = 0) {
    const keys = [
      this.api.googleApiKey,
      this.api.googleApiKey1,
      this.api.googleApiKey2,
      this.api.googleApiKey3,
      this.api.googleApiKey4
    ];
    return keys[keyNumber] || this.api.googleApiKey;
  },

  models: {
    gemini: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    geminiFlash: 'gemini-2.5-flash',
    geminiPro: 'gemini-2.5-pro',
    deepseek: process.env.DEEPSEEK_MODEL || 'deepseek/DeepSeek-V3-0324',
    gpt: process.env.GPT_MODEL || 'openai/gpt-4o',
  },
};

// Validate required environment variables
const requiredVars = ['GOOGLE_API_KEY', 'GITHUB_API_TOKEN'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.warn(`Warning: Missing environment variables: ${missingVars.join(', ')}`);
  console.warn('Please check your .env file');
}

module.exports = config;
