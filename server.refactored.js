const express = require('express');
const path = require('path');
const config = require('./config');
const logger = require('./utils/logger');
const { upload, handleUploadError } = require('./middleware/uploadMiddleware');
const { extractTextFromFiles } = require('./services/textExtractor');
const { evaluateWithGemini, evaluateWithDeepSeek, evaluateWithGPT } = require('./services/textEvaluator');
const { deleteFiles } = require('./utils/fileUtils');

const app = express();

// Middleware
app.use(express.static('public'));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Extract text from uploaded files
app.post('/extract-text', upload.array('files', config.upload.maxFiles), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: '請選擇至少一個文件' });
    }

    const result = await extractTextFromFiles(req.files);

    res.json({
      success: true,
      text: result.text,
      filenames: result.filenames
    });

  } catch (error) {
    logger.error("處理多文件時發生錯誤：", error);

    // Clean up uploaded files on error
    if (req.files) {
      const filePaths = req.files.map(file => file.path);
      deleteFiles(filePaths);
    }

    res.status(500).json({
      error: '文字提取過程中發生嚴重錯誤'
    });
  }
});

// Evaluate text with Gemini
app.post('/evaluate-text', async (req, res) => {
  try {
    const { text, command } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ error: '請提供要評分的文字內容' });
    }

    const result = await evaluateWithGemini(text, command);

    if (result.success) {
      res.json({
        success: true,
        evaluation: result.evaluation
      });
    } else {
      res.status(500).json({
        error: result.error
      });
    }

  } catch (error) {
    logger.error("Gemini 評分時發生錯誤：", error);
    res.status(500).json({
      error: 'Gemini 評分失敗，請稍後重試'
    });
  }
});

// Evaluate text with DeepSeek
app.post('/evaluate-text-deepseek', async (req, res) => {
  try {
    const { text, command } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ error: '請提供要評分的文字內容' });
    }

    const result = await evaluateWithDeepSeek(text, command);

    if (result.success) {
      res.json({
        success: true,
        evaluation: result.evaluation
      });
    } else {
      res.status(500).json({
        error: result.error,
        detail: result.detail
      });
    }

  } catch (error) {
    logger.error("DeepSeek 評分時發生錯誤：", error);
    res.status(500).json({
      error: 'DeepSeek 評分失敗，請稍後重試'
    });
  }
});

// Evaluate text with GPT-4
app.post('/evaluate-text-gpt', async (req, res) => {
  try {
    const { text, command } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ error: '請提供要評分的文字內容' });
    }

    const result = await evaluateWithGPT(text, command);

    if (result.success) {
      res.json({
        success: true,
        evaluation: result.evaluation
      });
    } else {
      res.status(500).json({
        error: result.error,
        detail: result.detail
      });
    }

  } catch (error) {
    logger.error("GPT-4 評分時發生錯誤：", error);
    res.status(500).json({
      error: 'GPT-4 評分失敗，請稍後重試'
    });
  }
});

// Error handling middleware
app.use(handleUploadError);

app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({ error: error.message || '伺服器內部錯誤' });
});

// Start server
app.listen(config.server.port, config.server.host, () => {
  logger.info(`服務器運行在 http://${config.server.host}:${config.server.port}`);
  logger.info(`本地訪問: http://localhost:${config.server.port}`);
  logger.info(`外部訪問: http://[您的IP地址]:${config.server.port}`);
  logger.info(`使用 Gemini 模型: ${config.models.gemini}`);
  logger.info(`使用 DeepSeek 模型: ${config.models.deepseek}`);
  logger.info(`使用 GPT 模型: ${config.models.gpt}`);
});
