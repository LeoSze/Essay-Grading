// 添加必要的 polyfill
global.Headers = require('node-fetch').Headers;
global.fetch = require('node-fetch');

const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const pdfParse = require('pdf-parse');

// 使用您的 API 金鑰初始化
// 重要：請勿將您的 API 金鑰直接寫在程式碼中並提交到版本控制系統。
// 建議使用環境變數或密鑰管理服務。
//const genAI = new GoogleGenerativeAI("AIzaSyAgIRnMClrXR6GvtQlt2U9DlmYvALuHPFU");
const genAI = new GoogleGenerativeAI("AIzaSyAZNIL5acmwuE-ezobiAG3UEG-vJhAl11I");

// 將圖片檔案轉換為 Base64 編碼的字串
function fileToGenerativePart(path, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(path)).toString("base64"),
      mimeType
    },
  };
}

// 從PDF檔案中提取文字
async function extractTextFromPDF(pdfPath) {
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    console.error("PDF處理錯誤：", error);
    throw error;
  }
}

// 處理圖片檔案
async function processImage(imagePath, imageMimeType) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    const prompt = "請直接輸出圖片中的所有文字，不要有任何其他的描述或說明。";
    const imagePart = fileToGenerativePart(imagePath, imageMimeType);

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("圖片處理錯誤：", error);
    throw error;
  }
}

async function run() {
  try {
    const filePath = process.argv[2]; // 從命令列參數獲取檔案路徑
    
    if (!filePath) {
      console.log("使用方法：node index.js <檔案路徑>");
      console.log("支援的檔案格式：");
      console.log("- 圖片檔案：.jpg, .jpeg, .png, .gif, .bmp");
      console.log("- PDF檔案：.pdf");
      return;
    }

    const fileExtension = filePath.toLowerCase().split('.').pop();
    
    if (fileExtension === 'pdf') {
      console.log("正在處理PDF檔案...");
      const text = await extractTextFromPDF(filePath);
      console.log("提取出的文字：");
      console.log(text);
    } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(fileExtension)) {
      console.log("正在處理圖片檔案...");
      const mimeType = `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;
      const text = await processImage(filePath, mimeType);
      console.log("提取出的文字：");
      console.log(text);
    } else {
      console.log("不支援的檔案格式。請使用圖片檔案(.jpg, .jpeg, .png, .gif, .bmp)或PDF檔案(.pdf)");
    }

  } catch (error) {
    console.error("發生錯誤：", error);
  }
}

run();