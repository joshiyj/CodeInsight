import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from './src/config/index.js';

const genAI = new GoogleGenerativeAI(config.geminiApiKey);

async function run() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent('Hello');
    console.log(result.response.text());
  } catch (error) {
    console.error('Error:', error.message);
  }
}

run();
