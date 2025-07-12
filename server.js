// --- CodeWeaver AI Server for a Two-Service Deployment ---

require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- 1. INITIALIZE APP ---
const app = express();
const PORT = process.env.PORT || 3000; 

// --- 2. CONFIGURE CORS (CRITICAL FOR TWO SERVICES) ---
// This whitelist MUST include your front-end's live URL.
const allowedOrigins = [
  'https://codeweaver-ai-app-12.onrender.com', // Your live front-end on Render
  'http://localhost:5500',                    // For local testing
  'http://127.0.0.1:5500'
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} is not allowed by CORS.`));
    }
  }
};
app.use(cors(corsOptions));
app.use(express.json());


// --- 3. INITIALIZE GOOGLE AI CLIENT ---
const GOOGLE_API_KEY = "AIzaSyDEkUGfR1Vl6CDemeMMfcjKcZnt870JyWE"
if (!GOOGLE_API_KEY) {
  console.error("FATAL ERROR: GOOGLE_API_KEY is not set!");
  process.exit(1);
}
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);


// --- 4. DEFINE ROUTES ---

// Health Check Route for Render
app.get('/healthcheck', (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Main API Route for Generating Code
app.post('/api/generate-code', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    // Use the stable and universally available model name.
    const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
    
    const fullPrompt = `
      You are CodeWeaver AI, an expert web developer specializing in self-contained HTML and CSS components.
      Your task is to take a user's description and generate the corresponding HTML and CSS code.
      Instructions:
      1. You MUST respond with a valid JSON object, and nothing else.
      2. The JSON object must have exactly two keys: "message" and "code".
      3. The "message" key should contain a friendly, conversational text response.
      4. The "code" key must be a single string containing the HTML and a <style> tag.
      5. Do NOT include <html> or <body> tags.
      User Request: "${prompt}"
    `;
    
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    let aiResponseText = response.text();

    // Clean the AI response to remove markdown fences if they exist.
    if (aiResponseText.startsWith("```json")) {
      aiResponseText = aiResponseText.substring(7, aiResponseText.length - 3).trim();
    }
    
    const parsedResponse = JSON.parse(aiResponseText);
    res.json(parsedResponse);

  } catch (error) {
    console.error("ERROR inside /api/generate-code:", error.message);
    res.status(500).json({ 
        message: 'An internal server error occurred.',
        code: `<!-- Server Error: ${error.message} -->` 
    });
  }
});


// --- 5. START THE SERVER ---
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server startup complete. Listening on port ${PORT}`);
});