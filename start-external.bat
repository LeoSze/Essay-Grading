@echo off
echo ========================================
echo   小美圖片文字提取工具 - 外部訪問啟動器
echo ========================================
echo.

echo 正在啟動本地服務器...
start "服務器" cmd /k "npm start"

echo.
echo 等待服務器啟動 (約 3 秒)...
timeout /t 3 /nobreak > nul
echo.

echo 正在啟動 Serveo.net 內網穿透...
echo 您可能需要在此視窗中同意 SSH 連接 (輸入 "yes")。
start "內網穿透" cmd /k "npm run tunnel"

echo.
echo ========================================
echo 啟動完成！
echo.
echo 請查看 "內網穿透" 視窗中的地址，
echo 格式通常是：https://your-name.serveo.net
echo.
echo 將該地址分享給其他人即可訪問。
echo ========================================
echo.
pause 