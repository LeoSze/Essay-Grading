# Troubleshooting Guide

## Common Issues and Solutions

### 1. "fetch failed" Error with Gemini API

**Symptoms:**
```
Gemini API error: TypeError: fetch failed
Error fetching from https://generativelanguage.googleapis.com/...
```

**Causes:**
- Temporary network connectivity issues
- Large file uploads timing out
- Firewall or proxy blocking the connection
- DNS resolution problems

**Solutions:**

#### ✅ Use Automatic Retry (Already Implemented)
The refactored code now includes automatic retry logic with exponential backoff:
- 3 retry attempts for network errors
- 2-6 second delays between retries
- Automatic detection of retryable errors

#### ✅ Use Faster Model
In `.env`, use `gemini-2.5-flash` instead of `gemini-2.5-pro`:
```bash
GEMINI_MODEL=gemini-2.5-flash
```

**Performance comparison:**
- `gemini-2.5-flash`: ~6-10 seconds per request
- `gemini-2.5-pro`: ~20-30 seconds per request

#### ✅ Check Network Connection
Run the diagnostic script:
```bash
node test-gemini.js
```

This will test all available Gemini models and show which ones work.

#### ✅ Check for Proxy Issues
If behind a corporate proxy, set environment variables:
```bash
# Windows
set HTTPS_PROXY=http://proxy.company.com:8080
set HTTP_PROXY=http://proxy.company.com:8080

# Linux/Mac
export HTTPS_PROXY=http://proxy.company.com:8080
export HTTP_PROXY=http://proxy.company.com:8080
```

#### ✅ Reduce File Size
For large PDFs:
- Compress the PDF before uploading
- Split multi-page PDFs into smaller files
- Maximum recommended size: 10MB per file

---

### 2. GitHub Models API - 401 Unauthorized

**Symptoms:**
```
[GPT-4.1] API 回傳: 401 Unauthorized
```

**Causes:**
- Invalid or expired GitHub token
- Token doesn't have correct permissions
- GitHub Models not enabled for your account

**Solutions:**

#### ✅ Generate New Token
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Give it a name: "AI Models API"
4. Select scopes: `read:org` (minimum required)
5. Copy the token and update `.env`:
```bash
GITHUB_API_TOKEN=ghp_your_new_token_here
```

#### ✅ Check Token Permissions
Verify your token has access:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://models.github.ai/models
```

#### ✅ Request Access
GitHub Models may require waitlist approval:
- Visit https://github.com/marketplace/models
- Request access if not already granted

---

### 3. Port Already in Use

**Symptoms:**
```
Error: listen EADDRINUSE: address already in use 0.0.0.0:3000
```

**Solutions:**

#### ✅ Change Port
In `.env`:
```bash
PORT=3001
```

#### ✅ Kill Existing Process
Windows:
```bash
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F
```

Linux/Mac:
```bash
lsof -ti:3000 | xargs kill -9
```

---

### 4. Model Not Found (404 Error)

**Symptoms:**
```
[404 Not Found] models/gemini-1.5-flash is not found
```

**Cause:**
Using deprecated model names.

**Solution:**
Use current model names in `.env`:
```bash
# ✓ Correct (2025)
GEMINI_MODEL=gemini-2.5-flash
GEMINI_MODEL=gemini-2.5-pro

# ✗ Wrong (deprecated)
GEMINI_MODEL=gemini-1.5-flash
GEMINI_MODEL=gemini-1.5-flash-latest
```

---

### 5. Large PDF Processing Timeout

**Symptoms:**
- PDF uploads succeed but processing times out
- "fetch failed" error after long wait
- Process hangs on large documents

**Solutions:**

#### ✅ Use Flash Model
Switch to faster model:
```bash
GEMINI_MODEL=gemini-2.5-flash
```

#### ✅ Increase Timeout
For very large files, the retry logic will handle timeouts automatically.

#### ✅ Split Large PDFs
For PDFs > 10MB or > 50 pages:
- Use a PDF splitter tool
- Upload pages in batches
- Process separately and combine results

---

### 6. Environment Variables Not Loading

**Symptoms:**
```
Warning: Missing environment variables: GOOGLE_API_KEY
```

**Solutions:**

#### ✅ Check .env File Exists
```bash
ls -la .env
```

#### ✅ Check .env Format
Must be:
```bash
KEY=value
# No spaces around =
# No quotes needed
```

#### ✅ Restart Server
After changing `.env`:
```bash
# Stop server (Ctrl+C)
# Start again
node server.js
```

---

### 7. File Upload Errors

**Symptoms:**
```
只允許上傳圖片文件或PDF文件！
文件大小不能超過 10MB
```

**Solutions:**

#### ✅ Check File Type
Supported formats:
- Images: JPG, PNG, GIF, WebP, BMP
- Documents: PDF only

#### ✅ Adjust File Size Limit
In `.env`:
```bash
MAX_FILE_SIZE_MB=20  # Increase to 20MB
```

#### ✅ Compress Files
Before uploading:
- Use online image compressors
- Reduce PDF quality
- Remove unnecessary pages

---

## Diagnostic Tools

### Test API Connection
```bash
node test-gemini.js
```

### Check Server Status
```bash
# Test if server is running
curl http://localhost:3000

# Test text extraction endpoint
curl -X POST http://localhost:3000/extract-text \
  -F "files=@test.jpg"
```

### View Logs
Server logs show detailed error information:
- Timestamps for all operations
- Retry attempts and delays
- Full error stack traces
- API request/response details

### Check Configuration
```bash
# View current settings
cat .env

# Verify dependencies
npm list
```

---

## Getting Help

1. **Check Logs**: Server console shows detailed error messages
2. **Run Diagnostics**: Use `test-gemini.js` to test API
3. **Review Documentation**: See `REFACTORING.md` for code structure
4. **Check API Status**:
   - Google Gemini: https://status.cloud.google.com/
   - GitHub: https://www.githubstatus.com/

---

## Performance Tips

### Optimize Upload Speed
- Use `gemini-2.5-flash` for faster processing
- Upload multiple small files instead of one large file
- Compress images before upload

### Optimize Evaluation Speed
- Use specific, concise prompts
- Avoid overly complex evaluation criteria
- Consider batch processing for multiple documents

### Monitor Resource Usage
- Check memory usage for large files
- Monitor network bandwidth
- Watch for rate limiting (429 errors)

---

## Quick Reference

### Working Model Names
- ✅ `gemini-2.5-flash` - Fast, recommended
- ✅ `gemini-2.5-pro` - Detailed but slower
- ✅ `deepseek/DeepSeek-V3-0324`
- ✅ `openai/gpt-4o`

### API Endpoints
- `POST /extract-text` - Extract text from files
- `POST /evaluate-text` - Evaluate with Gemini
- `POST /evaluate-text-deepseek` - Evaluate with DeepSeek
- `POST /evaluate-text-gpt` - Evaluate with GPT-4

### Configuration Files
- `.env` - Your API keys and settings
- `.env.example` - Template for configuration
- `config.js` - Configuration loader
- `package.json` - Dependencies

### Key Directories
- `services/` - AI client and business logic
- `middleware/` - Request handling
- `utils/` - Helper functions
- `public/` - Frontend files
