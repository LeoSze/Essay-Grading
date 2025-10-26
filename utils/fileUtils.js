const fs = require('fs');

/**
 * Convert file to Base64 format for Gemini API
 */
function fileToGenerativePart(path, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(path)).toString("base64"),
      mimeType
    },
  };
}

/**
 * Safely delete a file
 */
function deleteFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error deleting file ${filePath}:`, error);
    return false;
  }
}

/**
 * Delete multiple files
 */
function deleteFiles(filePaths) {
  const results = filePaths.map(deleteFile);
  return results.every(result => result);
}

/**
 * Ensure directory exists
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

module.exports = {
  fileToGenerativePart,
  deleteFile,
  deleteFiles,
  ensureDir
};
