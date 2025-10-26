# Gemini PDF 文字提取工具

這個工具使用 Google Gemini 1.5 Flash 模型來提取 PDF 文件中的文字內容。

## 功能特點

- 支持 PDF 文件文字提取
- 支持圖片文件 OCR 文字識別
- 使用 Gemini 1.5 Flash 模型進行智能處理
- 自動識別文件類型
- 命令行參數支持

## 安裝依賴

```bash
npm install
```

## 使用方法

### 基本用法

```bash
# 處理 PDF 文件（預設模式）
node index.js document.pdf

# 處理圖片文件
node index.js photo.jpg

# 指定模式處理文件
node index.js pdf document.pdf
node index.js image photo.jpg

# 使用數字模式
node index.js 1 photo.jpg  # 圖片模式
node index.js 2 document.pdf  # PDF 模式
```

### 參數說明

- 第一個參數：處理模式（可選）
  - `pdf` 或 `2`：PDF 文字提取模式
  - `image` 或 `1`：圖片 OCR 模式
- 第二個參數：文件路徑（必需）

### 支持的文件格式

**PDF 模式：**
- `.pdf` 文件

**圖片模式：**
- `.jpg`, `.jpeg`
- `.png`
- `.gif`
- `.bmp`

## 示例

```bash
# 提取 PDF 文字
node index.js sample.pdf

# 提取圖片文字
node index.js image test.jpg

# 自動識別文件類型
node index.js document.pdf  # 自動使用 PDF 模式
node index.js photo.png     # 自動使用圖片模式
```

## 輸出結果

程序會將提取的文字直接輸出到控制台，保持原有的格式和結構。

## 注意事項

1. 確保您的 API 金鑰已正確設置
2. PDF 文件必須存在於指定路徑
3. 對於大型 PDF 文件，處理時間可能較長
4. 建議將 API 金鑰設置為環境變數以提高安全性

## 錯誤處理

如果遇到錯誤，程序會顯示相應的錯誤信息和使用說明。

## 技術實現

- 使用 `pdf-parse` 庫解析 PDF 文件
- 使用 `@google/generative-ai` 進行 AI 處理
- 支持多種圖片格式的 OCR 處理 