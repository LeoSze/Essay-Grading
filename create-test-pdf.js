// 創建測試 PDF 文件的腳本
const PDFDocument = require('pdfkit');
const fs = require('fs');

// 創建一個新的PDF文檔
const doc = new PDFDocument();

// 將PDF寫入檔案
doc.pipe(fs.createWriteStream('test.pdf'));

// 添加一些文字內容
doc.fontSize(16)
   .text('這是一個測試PDF檔案', 100, 100);

doc.fontSize(12)
   .text('這裡包含一些中文文字內容，用於測試PDF文字提取功能。', 100, 150)
   .text('This is some English text for testing PDF text extraction.', 100, 180)
   .text('數字測試：123456789', 100, 210)
   .text('特殊符號測試：!@#$%^&*()', 100, 240);

doc.fontSize(14)
   .text('測試完成！', 100, 280);

// 結束文檔
doc.end();

console.log('測試PDF檔案已創建：test.pdf'); 