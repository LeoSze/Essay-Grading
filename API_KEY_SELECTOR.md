# API Key Selector Feature

## Overview
Added a user interface element to select which Google API key to use for Gemini AI operations, allowing users to switch between three different API keys on the fly.

## Configuration

### Environment Variables (.env)
```bash
# Google Gemini API Keys
GOOGLE_API_KEY=AIzaSyAZNIL5acmwuE-ezobiAG3UEG-vJhAl11I   # Key 1
GOOGLE_API_KEY1=AIzaSyCM-yK2ezyCFvzcKyApeKm2NRcJ2eFhYr4  # Key 2
GOOGLE_API_KEY2=AIzaSyAgIRnMClrXR6GvtQlt2U9DlmYvALuHPFU  # Key 3
```

## User Interface

### Location
The API key selector is located in the header, right below the app title and description.

### Appearance
- **Desktop**: Horizontal layout with label and dropdown
- **Mobile**: Vertical layout for better usability
- **Styling**: Glass-morphism design with semi-transparent background

### Options
- **API Key 1** (default) - Uses `GOOGLE_API_KEY`
- **API Key 2** - Uses `GOOGLE_API_KEY1`
- **API Key 3** - Uses `GOOGLE_API_KEY2`

## How It Works

### Frontend
1. User selects an API key from the dropdown (0, 1, or 2)
2. Selection is stored and used for all subsequent API calls
3. JavaScript function `getSelectedApiKey()` returns the current selection

### Backend
1. `config.js` loads all three API keys from environment variables
2. `getGoogleApiKey(keyNumber)` function returns the appropriate key
3. All Gemini AI clients accept a `keyNumber` parameter

### API Endpoints

#### Text Extraction (`/extract-text`)
```javascript
// Request (multipart/form-data)
{
  files: [file1, file2, ...],
  apiKeyNumber: 0  // 0, 1, or 2
}
```

#### Text Evaluation (`/evaluate-text`)
```javascript
// Request (JSON)
{
  text: "文章內容...",
  command: "評分命令",
  apiKeyNumber: 0  // 0, 1, or 2
}
```

## Use Cases

### Quota Management
Switch between keys when one reaches its quota limit:
- Key 1 hits rate limit → Switch to Key 2
- Key 2 hits rate limit → Switch to Key 3

### Performance Testing
Compare response times and quality across different API keys:
- Test with Key 1
- Test with Key 2
- Compare results

### Development vs Production
Separate keys for different environments:
- Key 1: Development/testing
- Key 2: Staging
- Key 3: Production

### Cost Tracking
Track usage and costs per key:
- Key 1: Project A
- Key 2: Project B
- Key 3: Personal use

## Technical Implementation

### Files Modified

#### 1. **config.js**
- Added `googleApiKey1` and `googleApiKey2` properties
- Added `getGoogleApiKey(keyNumber)` helper function

#### 2. **services/aiClients.js**
- Updated `getGeminiClient(keyNumber)` to accept key selection
- Updated `callGemini()` to pass keyNumber parameter

#### 3. **services/textExtractor.js**
- Updated `extractTextFromFile()` to accept keyNumber
- Updated `extractTextFromFiles()` to pass keyNumber

#### 4. **services/textEvaluator.js**
- Updated `evaluateWithGemini()` to accept keyNumber parameter
- Logs which API key is being used

#### 5. **server.js**
- Extract endpoint reads `apiKeyNumber` from request body
- Evaluate endpoint reads `apiKeyNumber` from request JSON

#### 6. **public/index.html**
- Added API key selector dropdown in header

#### 7. **public/style.css**
- Added `.api-key-selector` styling
- Added responsive design for mobile

#### 8. **public/script.js**
- Added `getSelectedApiKey()` helper function
- Updated `extractText()` to send selected key
- Updated `evaluateText()` to send selected key

## Default Behavior
- If no selection is made, defaults to Key 1 (`GOOGLE_API_KEY`)
- If a key is not configured, falls back to Key 1
- Console logs show which key is being used

## Console Logging

### Text Extraction
```
=== 開始處理 1 個文件的文字提取 (使用 API Key 0) ===
```

### Text Evaluation
```
[Gemini] 開始評分請求 (使用 gemini-2.5-flash, API Key 0)
```

## Error Handling
- If selected key is not configured: Error message shown
- If key is invalid: API error will be caught and displayed
- Falls back to default key (0) if selection is invalid

## Benefits

### User Experience
✅ No need to restart server to change API keys
✅ Visual feedback of which key is selected
✅ Easy switching between keys
✅ Works on both desktop and mobile

### Development
✅ Easy to test different keys
✅ Clear logging of which key is used
✅ Backwards compatible (defaults to key 0)
✅ Clean separation of concerns

### Operational
✅ Handle quota limits gracefully
✅ Separate usage tracking
✅ Cost management per key
✅ A/B testing different keys

## Limitations
- Only applies to Google Gemini API (not DeepSeek or GPT-4)
- Selection not persisted (resets on page reload)
- All three keys must be from the same Google account/project

## Future Enhancements

### Possible Improvements
- [ ] Save key selection to localStorage
- [ ] Show remaining quota for each key
- [ ] Auto-switch on quota exceeded
- [ ] Custom key labels/names
- [ ] Support for more than 3 keys
- [ ] Key rotation strategies
- [ ] Usage statistics per key
- [ ] Key health monitoring

### Advanced Features
- [ ] Multi-account support
- [ ] Key pooling and load balancing
- [ ] Fallback chain (Key1 → Key2 → Key3)
- [ ] Real-time quota monitoring
- [ ] Cost tracking dashboard
- [ ] Per-user key assignment

## Migration Guide

### For Existing Users
No action required! The system defaults to using `GOOGLE_API_KEY` (Key 1).

### To Add Additional Keys
1. Open `.env` file
2. Add `GOOGLE_API_KEY1=your_second_key`
3. Add `GOOGLE_API_KEY2=your_third_key`
4. Restart server
5. Keys will appear in dropdown

### To Use Only One Key
Leave `GOOGLE_API_KEY1` and `GOOGLE_API_KEY2` empty in `.env`. The selector will still work but will always use Key 1.

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never commit .env file** - Already in `.gitignore`
2. **Rotate keys regularly** - Google Cloud Console
3. **Use different keys per environment** - Dev/Staging/Prod
4. **Monitor usage** - Google Cloud Console
5. **Set up billing alerts** - Avoid unexpected charges
6. **Restrict API key permissions** - Limit to necessary APIs only

## Testing

### Manual Testing
1. Select Key 1, upload image, extract text → Should work
2. Select Key 2, upload image, extract text → Should work
3. Select Key 3, upload image, extract text → Should work
4. Check console logs for "使用 API Key X"

### Verify Configuration
```bash
node test-gemini.js
```

This will test if all keys are working.

## Troubleshooting

### Dropdown Not Showing
- Check `index.html` - selector should be in header
- Check browser console for JavaScript errors
- Verify `apiKeySelect` element exists

### Key Not Working
- Verify key is correctly set in `.env`
- Check console logs for error messages
- Test key directly with `test-gemini.js`
- Verify key has Gemini API enabled

### Selection Not Being Sent
- Check browser network tab → POST request body
- Verify `apiKeyNumber` is in request
- Check server logs for received keyNumber

### Always Using Key 1
- Check if `getSelectedApiKey()` returns correct value
- Verify dropdown value is changing
- Check server logs for which key is being used

## Summary

This feature provides flexible API key management through a simple UI element, allowing users to:
- Switch between 3 Google API keys instantly
- Manage quota limits effectively
- Track usage per key
- Test different keys easily

The implementation is clean, maintainable, and backwards-compatible with existing code.
