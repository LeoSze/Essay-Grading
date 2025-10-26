// Diagnostic script to test Gemini API connection
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testGemini() {
  console.log('Testing Gemini API connection...\n');

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error('❌ GOOGLE_API_KEY not found in .env file');
    return;
  }

  console.log('✓ API key found:', apiKey.substring(0, 10) + '...');

  const genAI = new GoogleGenerativeAI(apiKey);

  // Test models
  const modelsToTest = [
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-1.5-flash',
    'gemini-1.5-pro'
  ];

  for (const modelName of modelsToTest) {
    console.log(`\nTesting model: ${modelName}`);
    console.log('─'.repeat(50));

    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const prompt = "Say 'Hello, I am working!' in Chinese (Traditional).";

      console.log('Sending test prompt...');
      const startTime = Date.now();

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const elapsed = Date.now() - startTime;

      console.log('✓ Success!');
      console.log('Response:', text);
      console.log(`Time: ${elapsed}ms`);
    } catch (error) {
      console.error('✗ Failed');
      console.error('Error:', error.message);

      if (error.cause) {
        console.error('Cause:', {
          code: error.cause.code,
          message: error.cause.message
        });
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('Test complete!');
}

testGemini().catch(console.error);
