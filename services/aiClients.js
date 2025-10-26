const { GoogleGenerativeAI } = require("@google/generative-ai");
const ModelClient = require("@azure-rest/ai-inference").default;
const { isUnexpected } = require("@azure-rest/ai-inference");
const { AzureKeyCredential } = require("@azure/core-auth");
const config = require('../config');

/**
 * Initialize Google Gemini AI client
 * @param {number} keyNumber - Which API key to use (0, 1, 2, 3, or 4)
 */
function getGeminiClient(keyNumber = 0) {
  const apiKey = config.getGoogleApiKey(keyNumber);
  if (!apiKey) {
    throw new Error(`Google API key ${keyNumber} is not configured`);
  }
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Initialize GitHub Models client (for DeepSeek and GPT)
 */
function getGithubModelsClient() {
  if (!config.api.githubApiToken) {
    throw new Error('GitHub API token is not configured');
  }

  return ModelClient(
    config.api.githubEndpoint,
    new AzureKeyCredential(config.api.githubApiToken)
  );
}


/**
 * Get detailed error information
 */
function getErrorDetails(error) {
  const details = {
    message: error.message,
    name: error.name,
    stack: error.stack
  };

  // Check for network-related errors
  if (error.cause) {
    details.cause = {
      message: error.cause.message,
      code: error.cause.code,
      errno: error.cause.errno,
      syscall: error.cause.syscall
    };
  }

  return details;
}

/**
 * Call Gemini API for text extraction or evaluation
 * @param {string} prompt - The prompt text
 * @param {object} filePart - Optional file part for multimodal requests
 * @param {number} keyNumber - Which API key to use (0, 1, 2, 3, or 4)
 * @param {string} modelName - Which Gemini model to use (default: gemini-2.5-flash)
 */
async function callGemini(prompt, filePart = null, keyNumber = 0, modelName = 'gemini-2.5-flash') {
  const genAI = getGeminiClient(keyNumber);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      maxOutputTokens: 8192,
    }
  });

  try {
    const content = filePart ? [prompt, filePart] : prompt;
    const result = await model.generateContent(content);
    const response = await result.response;

    return {
      success: true,
      text: response.text()
    };
  } catch (error) {
    const errorDetails = getErrorDetails(error);
    console.error(`[Gemini] API call failed:`, errorDetails);

    return {
      success: false,
      error: error.message,
      errorDetails: errorDetails
    };
  }
}

/**
 * Call GitHub Models API (DeepSeek or GPT)
 */
async function callGithubModel(modelName, prompt, options = {}) {
  try {
    const client = getGithubModelsClient();

    const messages = [
      ...(options.systemMessage ? [{ role: "system", content: options.systemMessage }] : []),
      { role: "user", content: prompt }
    ];

    const response = await client.path("/chat/completions").post({
      body: {
        messages,
        max_tokens: options.maxTokens || 2048,
        temperature: options.temperature || 1.0,
        top_p: options.topP || 1.0,
        model: modelName
      }
    });

    if (isUnexpected(response)) {
      console.error(`${modelName} API returned unexpected response:`, response.body);
      return {
        success: false,
        error: 'API returned unexpected response',
        detail: response.body
      };
    }

    if (response.body.choices && response.body.choices[0] && response.body.choices[0].message) {
      return {
        success: true,
        text: response.body.choices[0].message.content
      };
    }

    return {
      success: false,
      error: 'Invalid response format',
      detail: response.body
    };
  } catch (error) {
    console.error(`${modelName} API error:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Call DeepSeek API
 */
async function callDeepSeek(prompt) {
  return callGithubModel(config.models.deepseek, prompt);
}

/**
 * Call GPT-4 API
 */
async function callGPT(prompt) {
  return callGithubModel(config.models.gpt, prompt, {
    systemMessage: "You are a helpful assistant."
  });
}

module.exports = {
  getGeminiClient,
  getGithubModelsClient,
  callGemini,
  callDeepSeek,
  callGPT,
  isUnexpected
};
