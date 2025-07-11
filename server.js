// --- IMPORTANT SECURITY NOTICE ---
// Ensure your API key is stored securely as an Environment Variable
// on Render and NOT hardcoded in your code.

require('dotenv').config(); // For local .env file
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- 1. INITIALIZE APP ---
const app = express();
const PORT = process.env.PORT || 5500;
console.log("App initialized.");

// --- 2. SETUP MIDDLEWARE ---
// A robust CORS setup is crucial for production.
const allowedOrigins = [
 ' https://codeweaver-ai-app-12.onrender.com', // Your live front-end
  'http://localhost:5500',                    // For local testing
  'http://127.0.0.1:5500'                     // For local testing
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like Postman, mobile apps) or from the whitelist
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  }
};
app.use(cors(corsOptions));
console.log("CORS middleware configured.");

// JSON body parser
app.use(express.json());
console.log("JSON parser middleware configured.");


// --- 3. GOOGLE AI CLIENT SETUP ---

const GOOGLE_API_KEY = "AIzaSyCfTF_hDuz8TDVjDIcY0xRW8RKoCYgHwjU" ;

if (!GOOGLE_API_KEY) {
  console.error("FATAL ERROR: GOOGLE_API_KEY environment variable is not set.");
  process.exit(1); // Stop the server if the key is missing
}

const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
console.log("Google AI client initialized.");


// --- 4. DEFINE ALL ROUTES ---

// Health Check Endpoint
app.get('/healthcheck', (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /healthcheck endpoint hit.`);
  res.status(200).json({
    status: "ok",
    message: "Server is alive and the healthcheck route is registered.",
  });
});
console.log("GET /healthcheck route defined.");

// Main API Endpoint
app.post('/api/generate-code', async (req, res) => {
  console.log(`[${new Date().toISOString()}] POST /api/generate-code endpoint hit.`);
  try {
    const { prompt } = req.body;
    if (!prompt) {
      console.log("Request failed: Prompt was empty.");
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
    console.error('Error in /api/generate-code endpoint:', error.message);
    res.status(500).json({ 
        message: 'An error occurred on the server while processing the request.',
        code: `<!-- Server Error: ${error.message} -->` 
    });
  }
});
console.log("POST /api/generate-code route defined.");

// A catch-all route for 404s (optional but good for debugging)
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] 404 Not Found for ${req.method} ${req.originalUrl}`);
    res.status(404).send("Sorry, that route does not exist.");
});
console.log("404 catch-all route defined.");


// --- 5. START THE SERVER ---
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server startup complete. Listening on port ${PORT}`);
});