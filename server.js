// --- IMPORTANT SECURITY NOTICE ---
// Your API key was previously hardcoded. That key should be considered
// compromised. Please generate a new key in Google AI Studio and
// store it securely as an Environment Variable, NOT in the code.

// Load environment variables from a .env file for local development

const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---

// 1. CONFIGURED CORS
// Create a whitelist of allowed domains.
// Add the URL of your deployed front-end application here.
const allowedOrigins = [
  'https://codeweaver-ai-app-12.onrender.com', // <-- Replace with your Render Static Site URL
  'https://github.com/Sanyogita-Pandey/codeweaver-ai-app',          // <-- Or replace with your GitHub Pages URL
  // Keep these for local testing:
  'http://localhost:5500',
  'http://127.0.0.1:5500'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};

// Use the configured CORS options
app.use(cors(corsOptions));

// Use express.json() to parse JSON request bodies
app.use(express.json());


// --- Google AI Client Initialization ---

// 2. SECURE API KEY HANDLING
// The key is safely loaded from environment variables.
const GOOGLE_API_KEY = "AIzaSyB5D-OeNpFJQo7orqHlD620nZBG7SAoGBY";

if (!GOOGLE_API_KEY) {
  console.error("FATAL ERROR: GOOGLE_API_KEY is not defined in your environment variables.");
  // On Render, check your Environment settings. Locally, check your .env file.
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

// --- Health Check Endpoint (for debugging) ---
app.get('/healthcheck', (req, res) => {
  console.log("Health check endpoint was hit!");
  res.status(200).json({
    status: "ok",
    message: "Server is alive and responding.",
    timestamp: new Date().toISOString()
  });
});

// --- API Endpoint (Your original code here is good, no changes needed) ---
app.post('/api/generate-code', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    const fullPrompt = `
      You are CodeWeaver AI, an expert web developer specializing in creating self-contained HTML and CSS components.
      Your task is to take a user's description and generate the corresponding HTML and CSS code.
      **Instructions:**
      1.  You MUST respond with a valid JSON object. Do not wrap the JSON in markdown backticks or any other text.
      2.  The JSON object must have exactly two keys: "message" and "code".
      3.  The "message" key should contain a friendly, conversational text response to the user, explaining what you've created.
      4.  The "code" key must be a single string containing the HTML and an associated <style> tag for the component.
      5.  Do NOT include \`<html>\`, \`<head>\`, or \`<body>\` tags in the "code" string. Only provide the component's code.
      6.  Ensure the CSS is well-scoped to avoid conflicts, for example by using specific class names.
      7.  Use modern and clean code practices.
      **User Request:** "${prompt}"
      **Example of your required output format:**
      {
        "message": "Sure, here is a simple and elegant button for you.",
        "code": "<style> .my-button { background-color: #007bff; color: white; padding: 10px 20px; border-radius: 5px; border: none; cursor: pointer; } </style> <button class='my-button'>Click Me</button>"
      }
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const aiResponseText = response.text();
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponseText);
    } catch (e) {
      console.error("AI did not return valid JSON. Raw response:", aiResponseText);
      throw new Error("The AI response was not in the expected format.");
    }

    res.json(parsedResponse);

  } catch (error) {
    console.error('Error in /api/generate-code endpoint:', error);
    res.status(500).json({ 
        message: 'An error occurred on the server. Please check the server logs for details.',
        code: `<!-- Server Error: ${error.message} -->` 
    });
  }
});


// --- Start the server ---
app.listen(PORT, () => {
  console.log(`CodeWeaver AI server is running on port ${PORT}`);
});