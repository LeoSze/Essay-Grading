// 全局變量
let currentFiles = []; // <--- 改為陣列
let currentEvaluation = null;
let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
let isProcessingClick = false; // 防止重複點擊
let customCommand = ''; // 自訂命令
const DEFAULT_COMMAND = '你是資深中文老師，要按香港中學文憑試嘅評分標準，評鑑呢篇以「（題目）」為題嘅文章，並提出改善建議';

// DOM 元素
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const previewSection = document.getElementById('previewSection');
const previewGrid = document.getElementById('previewGrid'); // <--- 新增
const fileCount = document.getElementById('fileCount');   // <--- 新增
const loadingSection = document.getElementById('loadingSection');
const resultSection = document.getElementById('resultSection');
const resultText = document.getElementById('resultText');
const errorSection = document.getElementById('errorSection');
const errorMessage = document.getElementById('errorMessage');
const evaluateLoadingSection = document.getElementById('evaluateLoadingSection');
const evaluationSection = document.getElementById('evaluationSection');
const evaluationText = document.getElementById('evaluationText');
const apiKeySelect = document.getElementById('apiKeySelect'); // API Key selector
const modelSelect = document.getElementById('modelSelect'); // Model selector

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM 載入完成，開始設置事件監聽器');
    console.log('檢測到設備類型：', isMobile ? '移動設備' : '桌面設備');
    
    // 立即設置事件監聽器
    setupEventListeners();
    console.log('事件監聽器設置完成');
    
    // 初始化拖曳排序
    initSortable();
    
    // 加載保存的自訂命令
    loadCustomCommand();
});

// 初始化拖曳排序
function initSortable() {
    if (previewGrid) {
        new Sortable(previewGrid, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            onEnd: function (evt) {
                // 當拖曳結束後，更新 currentFiles 陣列的順序
                const newOrderIds = Array.from(previewGrid.children).map(item => item.id);
                currentFiles.sort((a, b) => {
                    return newOrderIds.indexOf(a.id) - newOrderIds.indexOf(b.id);
                });
                console.log('文件順序已更新:', currentFiles.map(f => f.file.name));
            }
        });
    }
}

// 設置事件監聽器
function setupEventListeners() {
    console.log('設置事件監聽器 (v2)...');
    
    // 檢查必要的 DOM 元素
    if (!fileInput || !uploadArea) {
        console.error('重要元素缺失 (fileInput or uploadArea)');
        return;
    }
    
    // 清理舊的監聽器，以防萬一
    uploadArea.removeEventListener('click', handleUploadAreaClick);
    fileInput.removeEventListener('change', handleFileSelect);
    
    // 文件輸入變化
    fileInput.addEventListener('change', handleFileSelect, false);
    
    // 拖拽事件 (桌面設備)
    if (!isMobile) {
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('dragleave', handleDragLeave);
        uploadArea.addEventListener('drop', handleDrop);
    }
    
    // 整個上傳區域的點擊事件
    uploadArea.addEventListener('click', handleUploadAreaClick);
    
    // 按鈕的點擊事件
    const uploadBtn = document.getElementById('uploadBtn');
    if (uploadBtn) {
        uploadBtn.removeEventListener('click', handleUploadClick); // 清理
        uploadBtn.addEventListener('click', handleUploadClick);
    } else {
        console.error('uploadBtn 元素不存在！');
    }
    
    // 其他按鈕的事件監聽器
    setupOtherButtons();
    console.log('所有事件監聽器設置完成');
}

function setupOtherButtons() {
    const extractBtn = document.getElementById('extractBtn');
    if (extractBtn) extractBtn.addEventListener('click', extractText);
    
    const evaluateBtn = document.getElementById('evaluateBtn');
    if (evaluateBtn) evaluateBtn.addEventListener('click', evaluateText);

    const deepseekEvaluateBtn = document.getElementById('deepseekEvaluateBtn');
    if (deepseekEvaluateBtn) deepseekEvaluateBtn.addEventListener('click', deepseekEvaluateText);

    const copyBtn = document.getElementById('copyBtn');
    if (copyBtn) copyBtn.addEventListener('click', copyText);

    const clearAllBtn = document.getElementById('clearAllBtn'); // <--- 新增
    if(clearAllBtn) clearAllBtn.addEventListener('click', resetApp); // <--- 新增

    const evaluationCloseBtn = document.querySelector('.evaluation-close-btn');
    if (evaluationCloseBtn) evaluationCloseBtn.addEventListener('click', hideEvaluation);

    const copyEvaluationBtn = document.querySelector('.copy-evaluation-btn');
    if (copyEvaluationBtn) copyEvaluationBtn.addEventListener('click', copyEvaluation);

    const downloadEvaluationBtn = document.querySelector('.download-evaluation-btn');
    if (downloadEvaluationBtn) downloadEvaluationBtn.addEventListener('click', downloadEvaluation);
    
    const errorCloseBtn = document.querySelector('.error-close-btn');
    if (errorCloseBtn) errorCloseBtn.addEventListener('click', hideError);
    
    // 自訂命令按鈕
    const saveCommandBtn = document.getElementById('saveCommandBtn');
    if (saveCommandBtn) saveCommandBtn.addEventListener('click', saveCustomCommand);
    
    const resetCommandBtn = document.getElementById('resetCommandBtn');
    if (resetCommandBtn) resetCommandBtn.addEventListener('click', resetCustomCommand);

    const gptEvaluateBtn = document.getElementById('gptEvaluateBtn');
    if (gptEvaluateBtn) gptEvaluateBtn.addEventListener('click', gptEvaluateText);
}

// 處理上傳區域點擊
function handleUploadAreaClick(event) {
    console.log('上傳區域被點擊');
    // 如果事件的直接目標是按鈕或其子元素，則忽略此事件，
    // 因為按鈕的事件會由 handleUploadClick 處理。
    if (event.target.closest('#uploadBtn')) {
        console.log('點擊目標是上傳按鈕，由按鈕處理程序接管');
        return;
    }
    triggerFileInput();
}

// 處理上傳按鈕點擊
function handleUploadClick(event) {
    console.log('上傳按鈕被點擊');
    // 阻止事件冒泡到上傳區域，避免觸發兩次
    event.stopPropagation();
    triggerFileInput();
}

// 觸發文件選擇的核心函數
function triggerFileInput() {
    // 防止因快速連點而重複觸發
    if (isProcessingClick) {
        console.log('正在處理點擊，跳過此次觸發');
        return;
    }
    isProcessingClick = true;

    if (fileInput) {
        fileInput.value = ''; // 重置以確保 change 事件總能觸發
    } else {
        console.error('fileInput 元素不存在');
        isProcessingClick = false;
        return;
    }

    console.log('準備觸發文件選擇...');
    fileInput.click();

    // 1秒後重置處理標誌
    setTimeout(() => {
        isProcessingClick = false;
        console.log('點擊處理標誌已重置');
    }, 1000);
}

// 處理文件選擇
function handleFileSelect(event) {
    const files = event.target.files;
    if (files.length > 0) {
        processFiles(files);
    }
}

// 處理拖拽懸停
function handleDragOver(event) {
    event.preventDefault();
    uploadArea.classList.add('dragover');
}

// 處理拖拽離開
function handleDragLeave(event) {
    event.preventDefault();
    uploadArea.classList.remove('dragover');
}

// 處理文件拖拽
function handleDrop(event) {
    event.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        processFiles(files);
    }
}

// 處理多個文件
function processFiles(files) {
    for (const file of files) {
        // 檢查文件大小 (10MB)
        if (file.size > 10 * 1024 * 1024) {
            showError(`文件 ${file.name} 過大，不能超過 10MB！`);
            continue; // 跳過這個文件
        }
        
        // 檢查文件類型 - 支援圖片和PDF
        if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
            showError(`文件 ${file.name} 的類型不支援！`);
            continue; // 跳過這個文件
        }

        const fileWithId = {
            id: `file-${Date.now()}-${Math.random()}`,
            file: file
        };
        currentFiles.push(fileWithId);
        createPreviewElement(fileWithId);
    }
    updatePreviewSection();
}

// 建立單個預覽元素
function createPreviewElement(fileWithId) {
    const file = fileWithId.file;
    const previewItem = document.createElement('div');
    previewItem.className = 'preview-item';
    previewItem.id = fileWithId.id;

    let previewContent = '';
    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewItem.querySelector('img').src = e.target.result;
        };
        reader.readAsDataURL(file);
        previewContent = `<img src="" alt="預覽圖片">`;
    } else { // PDF
        previewContent = `
            <div class="pdf-preview">
                <i class="fas fa-file-pdf"></i>
            </div>
        `;
    }

    previewItem.innerHTML = `
        <button class="remove-btn"><i class="fas fa-times"></i></button>
        ${previewContent}
        <div class="file-name">${file.name}</div>
    `;

    previewItem.querySelector('.remove-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        removeFile(fileWithId.id);
    });

    previewGrid.appendChild(previewItem);
}

// 移除指定的文件
function removeFile(id) {
    currentFiles = currentFiles.filter(f => f.id !== id);
    const elementToRemove = document.getElementById(id);
    if (elementToRemove) {
        elementToRemove.remove();
    }
    updatePreviewSection();
}

// 更新預覽區域的顯示狀態和文件計數
function updatePreviewSection() {
    if (currentFiles.length > 0) {
        hideAllSections(true, true); // 保留預覽區與結果區
        previewSection.style.display = 'block';
        fileCount.textContent = `已選擇 ${currentFiles.length} 個文件`;
        document.getElementById('extractBtn').disabled = false;
    } else {
        // 沒有文件時隱藏預覽，但保留結果區塊
        previewSection.style.display = 'none';
        uploadArea.parentElement.style.display = 'block';
        document.getElementById('extractBtn').disabled = true;
    }
}

// Helper function to get selected API key
function getSelectedApiKey() {
    return apiKeySelect ? parseInt(apiKeySelect.value) : 0;
}

// Helper function to get selected model
function getSelectedModel() {
    return modelSelect ? modelSelect.value : 'gemini-2.5-flash';
}

// 提取文字
async function extractText() {
    if (currentFiles.length === 0) {
        showError('請先選擇文件！');
        return;
    }

    try {
        console.log('=== 開始文字提取 ===');
        console.log('文件信息：', {
            name: currentFiles[0].file.name,
            size: currentFiles[0].file.size,
            type: currentFiles[0].file.type
        });
        console.log('使用 API Key:', getSelectedApiKey());
        console.log('使用模型:', getSelectedModel());
        // 清空之前的評分結果
        const evaluationContainer = document.getElementById('evaluationContainer');
        if (evaluationContainer) evaluationContainer.innerHTML = '';
        // 顯示載入動畫（不隱藏結果／上傳／預覽區域）
        loadingSection.style.display = 'flex';
        loadingSection.classList.add('fade-in');

        const formData = new FormData();
        for (const fileWithId of currentFiles) {
            formData.append('files', fileWithId.file); // 後端接收的欄位名為 'files'
        }
        // Add API key selection
        formData.append('apiKeyNumber', getSelectedApiKey());
        // Add model selection
        formData.append('modelName', getSelectedModel());

        const response = await fetch('/extract-text', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        
        console.log('=== 文字提取響應 ===');
        console.log('響應狀態：', response.status);
        console.log('提取結果：', data);
        console.log('=== 文字提取響應結束 ===');

        if (data.success) {
            resultText.value = data.text.replace(/<hr>/g, '\n\n----------分頁標示----------\n\n');
            showResult();
            // 提取成功後清空已選擇文件與預覽
            currentFiles = [];
            if (previewGrid) previewGrid.innerHTML = '';
            if (fileInput) fileInput.value = '';
            updatePreviewSection();
            console.log('文字提取成功，已顯示結果並清空已選擇文件和評分結果');
        } else {
            throw new Error(data.error || '文字提取失敗');
        }

    } catch (error) {
        console.error('提取文字時發生錯誤：', error);
        showError('網絡錯誤或提取失敗，請稍後重試！');
    } finally {
        // 確保載入動畫被隱藏
        loadingSection.style.display = 'none';
    }
}

// 顯示結果區域
function showResult() {
    hideAllSections(true);
    uploadArea.parentElement.style.display = 'block';
    resultSection.style.display = 'block';
}

// 新增：生成評分視窗
function createEvaluationWindow(evaluation, modelLabel) {
    const container = document.getElementById('evaluationContainer');
    if (!container) return;

    // 創建評分區域
    const section = document.createElement('div');
    section.className = 'evaluation-section fade-in';

    // Header
    const header = document.createElement('div');
    header.className = 'evaluation-header';
    const h3 = document.createElement('h3');
    h3.innerHTML = `<i class="fas fa-star"></i> ${modelLabel} 評分結果`;
    const closeBtn = document.createElement('button');
    closeBtn.className = 'evaluation-close-btn';
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
    closeBtn.onclick = () => section.remove();
    header.appendChild(h3);
    header.appendChild(closeBtn);
    section.appendChild(header);

    // Content
    const content = document.createElement('div');
    content.className = 'evaluation-content';
    const textDiv = document.createElement('div');
    textDiv.className = 'evaluation-text';
    textDiv.textContent = evaluation;
    content.appendChild(textDiv);
    section.appendChild(content);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'evaluation-actions';
    // 複製
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-evaluation-btn';
    copyBtn.innerHTML = '<i class="fas fa-copy"></i> 複製評分';
    copyBtn.onclick = async () => {
        try {
            await navigator.clipboard.writeText(evaluation);
            copyBtn.classList.add('copy-success');
            copyBtn.innerHTML = '<i class="fas fa-check"></i> 已複製';
            setTimeout(() => {
                copyBtn.classList.remove('copy-success');
                copyBtn.innerHTML = '<i class="fas fa-copy"></i> 複製評分';
            }, 2000);
        } catch (error) {
            showError('複製失敗，請手動選擇文字複製！');
        }
    };
    actions.appendChild(copyBtn);
    // 下載
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'download-evaluation-btn';
    downloadBtn.innerHTML = '<i class="fas fa-download"></i> 下載評分';
    downloadBtn.onclick = () => {
        const blob = new Blob([evaluation], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `evaluation_${modelLabel}_${new Date().getTime()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    actions.appendChild(downloadBtn);
    section.appendChild(actions);

    container.appendChild(section);
}

// 修改評分函數：呼叫 createEvaluationWindow
async function evaluateText() {
    if (!resultText.value.trim()) {
        showError('請先提取文字內容！');
        return;
    }

    try {
        previewSection.style.display = 'none';
        loadingSection.style.display = 'none';
        evaluateLoadingSection.style.display = 'flex';
        evaluateLoadingSection.classList.add('fade-in');

        const commandInput = document.getElementById('customCommand');
        const currentCommand = commandInput ? commandInput.value.trim() : customCommand;
        const finalCommand = currentCommand || customCommand;

        const response = await fetch('/evaluate-text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: resultText.value,
                command: finalCommand,
                apiKeyNumber: getSelectedApiKey(),
                modelName: getSelectedModel()
            })
        });

        const data = await response.json();
        if (data.success) {
            const modelName = getSelectedModel();
            const modelLabel = modelName === 'gemini-2.5-pro' ? 'Gemini 2.5 Pro' : 'Gemini 2.5 Flash';
            createEvaluationWindow(data.evaluation, modelLabel);
        } else {
            throw new Error(data.error || '評分失敗');
        }
    } catch (error) {
        showError('評分失敗：' + error.message);
    } finally {
        evaluateLoadingSection.style.display = 'none';
    }
}

// DeepSeek 評分文字
async function deepseekEvaluateText() {
    if (!resultText.value.trim()) {
        showError('請先提取文字內容！');
        return;
    }

    try {
        previewSection.style.display = 'none';
        loadingSection.style.display = 'none';
        evaluateLoadingSection.style.display = 'flex';
        evaluateLoadingSection.classList.add('fade-in');

        const commandInput = document.getElementById('customCommand');
        const currentCommand = commandInput ? commandInput.value.trim() : customCommand;
        const finalCommand = currentCommand || customCommand;

        const response = await fetch('/evaluate-text-deepseek', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: resultText.value,
                command: finalCommand
            })
        });

        const data = await response.json();
        if (data.success) {
            createEvaluationWindow(data.evaluation, 'DeepSeek');
        } else {
            throw new Error(data.error || 'DeepSeek 評分失敗');
        }
    } catch (error) {
        showError('DeepSeek 評分失敗：' + error.message);
    } finally {
        evaluateLoadingSection.style.display = 'none';
    }
}

// ChatGPT 4.1 評分文字
async function gptEvaluateText() {
    if (!resultText.value.trim()) {
        showError('請先提取文字內容！');
        return;
    }

    try {
        previewSection.style.display = 'none';
        loadingSection.style.display = 'none';
        evaluateLoadingSection.style.display = 'flex';
        evaluateLoadingSection.classList.add('fade-in');

        const commandInput = document.getElementById('customCommand');
        const currentCommand = commandInput ? commandInput.value.trim() : customCommand;
        const finalCommand = currentCommand || customCommand;

        const response = await fetch('/evaluate-text-gpt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: resultText.value,
                command: finalCommand
            })
        });

        const data = await response.json();
        if (data.success) {
            createEvaluationWindow(data.evaluation, 'ChatGPT 4.1');
        } else {
            throw new Error(data.error || 'ChatGPT 4.1 評分失敗');
        }
    } catch (error) {
        showError('ChatGPT 4.1 評分失敗：' + error.message);
    } finally {
        evaluateLoadingSection.style.display = 'none';
    }
}

// 隱藏評分結果
function hideEvaluation() {
    evaluationSection.style.display = 'none';
}

// 複製評分結果
async function copyEvaluation() {
    if (!currentEvaluation) {
        showError('沒有評分結果可以複製！');
        return;
    }
    
    try {
        await navigator.clipboard.writeText(currentEvaluation);
        
        // 顯示成功動畫
        const copyEvaluationBtn = document.querySelector('.copy-evaluation-btn');
        copyEvaluationBtn.classList.add('copy-success');
        copyEvaluationBtn.innerHTML = '<i class="fas fa-check"></i> 已複製';
        
        setTimeout(() => {
            copyEvaluationBtn.classList.remove('copy-success');
            copyEvaluationBtn.innerHTML = '<i class="fas fa-copy"></i> 複製評分';
        }, 2000);
        
    } catch (error) {
        console.error('複製評分失敗：', error);
        showError('複製失敗，請手動選擇文字複製！');
    }
}

// 下載評分結果
function downloadEvaluation() {
    if (!currentEvaluation) {
        showError('沒有評分結果可以下載！');
        return;
    }
    
    const blob = new Blob([currentEvaluation], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evaluation_${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// 複製文字
async function copyText() {
    const text = resultText.value;
    if (!text) {
        showError('沒有文字可以複製！');
        return;
    }
    
    try {
        await navigator.clipboard.writeText(text);
        
        // 顯示成功動畫
        const copyBtn = document.getElementById('copyBtn');
        copyBtn.classList.add('copy-success');
        copyBtn.innerHTML = '<i class="fas fa-check"></i> 已複製';
        
        setTimeout(() => {
            copyBtn.classList.remove('copy-success');
            copyBtn.innerHTML = '<i class="fas fa-copy"></i> 複製文字';
        }, 2000);
        
    } catch (error) {
        console.error('複製失敗：', error);
        showError('複製失敗，請手動選擇文字複製！');
    }
}

// 重置應用程式 (現在是全部清除)
function resetApp() {
    console.log('全部清除');
    currentFiles = [];
    previewGrid.innerHTML = '';
    // 保留提取結果，不清空，不隱藏
    uploadArea.parentElement.style.display = 'block';
    previewSection.style.display = 'none';
    document.getElementById('extractBtn').disabled = true;
}

// 顯示錯誤
function showError(message, duration = 5000) {
    console.error('顯示錯誤：', message);
    errorMessage.textContent = message;
    errorSection.style.display = 'block';
    
    // 在移動設備上顯示更長時間
    const displayDuration = isMobile ? duration * 1.5 : duration;
    
    // 自動隱藏錯誤
    setTimeout(() => {
        hideError();
    }, displayDuration);
}

// 隱藏錯誤
function hideError() {
    errorSection.style.display = 'none';
}

// 隱藏所有區域
function hideAllSections(keepPreview = false, keepResult = false) {
    if (!keepPreview) {
        previewSection.style.display = 'none';
    }
    uploadArea.parentElement.style.display = 'block';
    loadingSection.style.display = 'none';
    if (!keepResult) {
        resultSection.style.display = 'none';
    }
    errorSection.style.display = 'none';
    evaluateLoadingSection.style.display = 'none';

    if (currentFiles.length > 0) {
        uploadArea.parentElement.style.display = 'none';
    }
}

// 鍵盤快捷鍵
document.addEventListener('keydown', function(event) {
    // Ctrl/Cmd + V 粘貼圖片
    if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
        event.preventDefault();
        navigator.clipboard.read().then(data => {
            for (let item of data) {
                if (item.types.includes('image/png') || 
                    item.types.includes('image/jpeg') || 
                    item.types.includes('image/gif'))  {
                    item.getType('image/png').then(blob => {
                        const file = new File([blob], 'pasted-image.png', { type: 'image/png' });
                        processFiles([{ file: file }]);
                    });
                    break;
                }
            }
        }).catch(error => {
            console.log('粘貼圖片失敗：', error);
        });
    }
    
    // Ctrl/Cmd + C 複製文字
    if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
        if (resultSection.style.display === 'block') {
            copyText();
        } else if (evaluationSection.style.display === 'block') {
            copyEvaluation();
        }
    }
    
    // Escape 隱藏評分結果
    if (event.key === 'Escape') {
        if (evaluationSection.style.display === 'block') {
            hideEvaluation();
        }
    }
});

// 添加一些實用的工具函數
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 檢查瀏覽器支持
function checkBrowserSupport() {
    const support = {
        fileReader: !!window.FileReader,
        dragAndDrop: !!window.FileReader && !!window.FileList,
        clipboard: !!navigator.clipboard,
        fetch: !!window.fetch
    };
    
    if (!support.fileReader) {
        showError('您的瀏覽器不支持文件讀取功能，請升級瀏覽器！');
    }
    
    return support;
}

// 頁面載入時檢查瀏覽器支持
window.addEventListener('load', checkBrowserSupport);

// 移動設備特殊處理
function handleMobileFileInput() {
    if (!isMobile) return;
    
    console.log('設置移動設備文件輸入處理');
    
    // 為移動設備添加額外的文件輸入處理
    if (fileInput) {
        // 監聽文件輸入的 focus 事件
        fileInput.addEventListener('focus', function() {
            console.log('文件輸入獲得焦點');
        });
        
        // 監聽文件輸入的 blur 事件
        fileInput.addEventListener('blur', function() {
            console.log('文件輸入失去焦點');
        });
        
        // 監聽文件輸入的 input 事件
        fileInput.addEventListener('input', function(event) {
            console.log('文件輸入 input 事件觸發');
            console.log('文件列表：', event.target.files);
        });
    }
}

// 初始化移動設備特殊處理
document.addEventListener('DOMContentLoaded', function() {
    // 延遲初始化移動設備處理
    setTimeout(() => {
        handleMobileFileInput();
    }, 200);
});

// 添加頁面可見性變化監聽（處理移動設備上的應用切換）
document.addEventListener('visibilitychange', function() {
    // 僅在移動設備上，且結果區域未顯示時觸發
    if (isMobile && document.visibilityState === 'visible' && resultSection.style.display === 'none') {
        console.log('頁面重新可見');
        // 重新檢查文件輸入狀態
        if (fileInput && fileInput.files && fileInput.files.length > 0) {
            console.log('檢測到文件已選擇，重新處理');
            handleFileSelect({ target: fileInput });
        }
    }
});

// 添加移動設備的 orientationchange 事件處理
window.addEventListener('orientationchange', function() {
    console.log('設備方向改變');
    // 延遲重新設置事件監聽器
    setTimeout(() => {
        setupEventListeners();
    }, 300);
});

// Cookie 管理函數
function setCookie(name, value, days = 365) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/`;
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    return null;
}

// 自訂命令管理函數
function loadCustomCommand() {
    const savedCommand = getCookie('customCommand');
    if (savedCommand) {
        customCommand = savedCommand;
        const commandInput = document.getElementById('customCommand');
        if (commandInput) {
            commandInput.value = customCommand;
        }
        console.log('已加載保存的自訂命令');
    } else {
        // 使用預設命令
        customCommand = DEFAULT_COMMAND;
        const commandInput = document.getElementById('customCommand');
        if (commandInput) {
            commandInput.value = customCommand;
        }
        console.log('使用預設命令');
    }
}

function saveCustomCommand() {
    const commandInput = document.getElementById('customCommand');
    if (commandInput) {
        const newCommand = commandInput.value.trim();
        if (newCommand) {
            customCommand = newCommand;
            setCookie('customCommand', newCommand);
            showError('命令已保存！', 2000);
            console.log('自訂命令已保存');
        } else {
            showError('請輸入有效的命令！');
        }
    }
}

function resetCustomCommand() {
    customCommand = DEFAULT_COMMAND;
    const commandInput = document.getElementById('customCommand');
    if (commandInput) {
        commandInput.value = DEFAULT_COMMAND;
    }
    setCookie('customCommand', DEFAULT_COMMAND);
    showError('已重置為預設命令！', 2000);
    console.log('已重置為預設命令');
}
