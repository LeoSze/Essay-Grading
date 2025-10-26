const { callGemini, callDeepSeek, callGPT, getGeminiClient } = require('./aiClients');
const logger = require('../utils/logger');

/**
 * Build evaluation prompt
 */
function buildEvaluationPrompt(text, customCommand = null) {
  const defaultPrompt = `你是資深中文老師，要按香港中學文憑試嘅評分標準，評鑑呢篇以「（題目）」為題嘅文章，並提出改善建議

文章內容：
${text}`;

  if (customCommand && customCommand.trim()) {
    return `${customCommand}

文章內容：
${text}`;
  }

  return defaultPrompt;
}

/**
 * Evaluate text using Gemini
 * @param {string} text - Text to evaluate
 * @param {string} command - Custom evaluation command
 * @param {number} keyNumber - Which Google API key to use (0, 1, 2, 3, or 4)
 * @param {string} modelName - Which Gemini model to use (default: gemini-2.5-flash)
 */
async function evaluateWithGemini(text, command, keyNumber = 0, modelName = 'gemini-2.5-flash') {
  logger.apiLog('Gemini', `開始評分請求 (使用 ${modelName}, API Key ${keyNumber})`);
  const prompt = buildEvaluationPrompt(text, command);

  logger.apiLog('Gemini', '發送到AI的提示詞:', prompt.substring(0, 200) + '...');

  try {
    const genAI = getGeminiClient(keyNumber);
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        maxOutputTokens: 8192,
      }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const evaluation = response.text();

    logger.apiLog('Gemini', '評分成功，結果長度:', evaluation.length);
    return {
      success: true,
      evaluation: evaluation
    };
  } catch (error) {
    logger.error('Gemini 評分失敗:', error.message);
    return {
      success: false,
      error: 'Gemini 評分失敗，請稍後重試'
    };
  }
}

/**
 * Evaluate text using DeepSeek
 */
async function evaluateWithDeepSeek(text, command) {
  logger.apiLog('DeepSeek', '收到評分請求，text 長度:', text.length);
  const prompt = buildEvaluationPrompt(text, command);

  logger.apiLog('DeepSeek', '組裝 prompt 完成，長度:', prompt.length);
  logger.apiLog('DeepSeek', 'prompt 頭100字:', prompt.substring(0, 100));

  logger.apiLog('DeepSeek', '開始呼叫 DeepSeek API...');
  const result = await callDeepSeek(prompt);

  if (result.success) {
    logger.apiLog('DeepSeek', '成功取得回應，長度:', result.text.length);
    return {
      success: true,
      evaluation: result.text
    };
  } else {
    logger.error('DeepSeek 評分失敗:', result.error);
    return {
      success: false,
      error: 'DeepSeek 評分失敗，請稍後重試',
      detail: result.detail
    };
  }
}

/**
 * Evaluate text using GPT-4
 */
async function evaluateWithGPT(text, command) {
  logger.apiLog('GPT-4', '收到評分請求，text 長度:', text.length);
  const prompt = buildEvaluationPrompt(text, command);

  logger.apiLog('GPT-4', '組裝 prompt 完成，長度:', prompt.length);
  logger.apiLog('GPT-4', 'prompt 頭100字:', prompt.substring(0, 100));

  logger.apiLog('GPT-4', '開始呼叫 GPT-4 API...');
  const result = await callGPT(prompt);

  if (result.success) {
    logger.apiLog('GPT-4', '成功取得回應，長度:', result.text.length);
    logger.apiLog('GPT-4', '評論內容:', result.text);
    return {
      success: true,
      evaluation: result.text
    };
  } else {
    logger.error('GPT-4 評分失敗:', result.error);
    return {
      success: false,
      error: 'GPT-4 評分失敗，請稍後重試',
      detail: result.detail
    };
  }
}

module.exports = {
  evaluateWithGemini,
  evaluateWithDeepSeek,
  evaluateWithGPT,
  buildEvaluationPrompt
};
