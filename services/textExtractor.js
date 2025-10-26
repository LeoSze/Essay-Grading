const { callGemini } = require('./aiClients');
const { fileToGenerativePart, deleteFile } = require('../utils/fileUtils');
const logger = require('../utils/logger');

/**
 * Extract text from a single file
 * @param {object} file - The uploaded file
 * @param {number} keyNumber - Which Google API key to use
 * @param {string} modelName - Which Gemini model to use
 */
async function extractTextFromFile(file, keyNumber = 0, modelName = 'gemini-2.5-flash') {
  const filePath = file.path;
  const fileMimeType = file.mimetype;
  let extractedText = '';

  logger.info(`處理文件: ${file.originalname} (${file.size} bytes)`);

  try {
    if (fileMimeType.startsWith('image/') || fileMimeType === 'application/pdf') {
      const prompt = "請直接輸出文件中的所有文字，不要有任何其他的描述或說明。";
      const filePart = fileToGenerativePart(filePath, fileMimeType);

      const result = await callGemini(prompt, filePart, keyNumber, modelName);

      if (result.success) {
        extractedText = result.text;
        logger.info(`成功提取 '${file.originalname}' 的文字，長度: ${extractedText.length}`);
        logger.info(`--- ${file.originalname} 提取內容 ---`);
        logger.info(extractedText);
        logger.info(`--- 內容結束 ---`);
      } else {
        logger.error(`處理文件 '${file.originalname}' 時發生錯誤:`, result.error);
        extractedText = `[處理 '${file.originalname}' 時發生錯誤: ${result.error}]`;
      }
    } else {
      logger.warn(`跳過不支援的文件類型: ${file.originalname}`);
      extractedText = `[不支援的文件類型: ${file.originalname}]`;
    }
  } catch (error) {
    logger.error(`處理文件 '${file.originalname}' 時發生異常:`, error);
    extractedText = `[處理 '${file.originalname}' 時發生錯誤]`;
  } finally {
    // 確保處理後刪除文件
    deleteFile(filePath);
  }

  return {
    filename: file.originalname,
    text: extractedText
  };
}

/**
 * Extract text from multiple files
 * @param {Array} files - Array of uploaded files
 * @param {number} keyNumber - Which Google API key to use
 * @param {string} modelName - Which Gemini model to use
 */
async function extractTextFromFiles(files, keyNumber = 0, modelName = 'gemini-2.5-flash') {
  logger.info(`=== 開始處理 ${files.length} 個文件的文字提取 (使用 API Key ${keyNumber}) ===`);

  const processingPromises = files.map(file => extractTextFromFile(file, keyNumber, modelName));
  const results = await Promise.all(processingPromises);

  // Combine all extracted text
  const allExtractedText = results.map(result => result.text);
  const processedFiles = results.map(result => result.filename);
  const combinedText = allExtractedText.join('\n\n<hr>\n\n');

  return {
    text: combinedText,
    filenames: processedFiles
  };
}

module.exports = {
  extractTextFromFile,
  extractTextFromFiles
};
