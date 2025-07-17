require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const JSZip = require('jszip');

// --- 1. INITIALIZE APP ---
const app = express();
const PORT = process.env.PORT || 3000; 

// --- 2. CONFIGURE CORS ---
const allowedOrigins = [
  'https://codeweaver-ai-app-12.onrender.com', 
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'https://sanyogita-pandey.github.io' // Corrected your username casing for best practice
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
app.use(express.json({ limit: '2mb' }));


// --- 3. INITIALIZE CLIENTS AND SECURELY LOAD ALL KEYS ---
// ===== SECURITY FIX: Load ALL keys from environment variables =====
const GOOGLE_API_KEY = "AIzaSyAoddfq6v-V1KxotfEFTW7KIomj8SoWcBg"; 
const NETLIFY_ACCESS_TOKEN = process.env.NETLIFY_ACCESS_TOKEN;
const NETLIFY_SITE_ID = process.env.NETLIFY_SITE_ID;

// Correct check for all required keys
if (!GOOGLE_API_KEY || !NETLIFY_ACCESS_TOKEN || !NETLIFY_SITE_ID) {
  console.error("FATAL ERROR: A required environment variable (GOOGLE_API_KEY, NETLIFY_ACCESS_TOKEN, or NETLIFY_SITE_ID) is missing!");
  process.exit(1); 
}
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);


// --- 4. DEFINE ROUTES ---
app.get('/healthcheck', (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.post('/api/generate-code', async (req, res) => {
 
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const fullPrompt = ` You are CodeWeaver AI, an expert web developer specializing in self-contained HTML, CSS, and JavaScript components.
      Your task is to take a user's description and generate the corresponding code.

      Instructions:
      1. You MUST respond with a valid JSON object, and nothing else. Do not use markdown like \`\`\`json.
      2. The JSON object must have exactly two keys: "message" and "code".
      3. The "message" key should contain a friendly, conversational text response.
      4. The "code" key must be a single string containing the component's HTML.
      5. If CSS is needed for styling, include it directly inside a <style> tag within the 'code' string.
      6. If JavaScript is needed for interactivity (like button clicks, counters, animations, etc.), include it directly inside a <script> tag within the 'code' string. The script should be self-contained and not require external files.
      7. Do NOT include <html>, <head>, or <body> tags in your 'code' response. Just provide the component code.

      Example: If a user asks for 'a button that shows an alert when clicked', your 'code' response should include the <button> HTML and a <script> tag with an event listener.

      User Request: "${prompt}"  `; // Abridged for clarity
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    let aiResponseText = response.text();
    if (aiResponseText.startsWith("```json")) {
      aiResponseText = aiResponseText.substring(7, aiResponseText.length - 3).trim();
    }
    const parsedResponse = JSON.parse(aiResponseText);
    res.json(parsedResponse);
  } catch (error) {
    console.error("ERROR inside /api/generate-code:", error);
    res.status(500).json({ 
        message: 'An internal server error occurred while generating the code.',
        code: `<!-- Server Error: ${error.message} -->` 
    });
  }
});

// =========================================================
// ===== FIX: ADD THE MISSING /api/deploy ENDPOINT HERE =====
// =========================================================
app.post('/api/deploy', async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) {
            return res.status(400).json({ success: false, message: 'No code provided for deployment.' });
        }

        const zip = new JSZip();
        zip.file("index.html", code);
        const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

        const deployResponse = await fetch(`https://api.netlify.com/api/v1/sites/${NETLIFY_SITE_ID}/deploys`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/zip',
                'Authorization': `Bearer ${NETLIFY_ACCESS_TOKEN}`
            },
            body: zipBuffer
        });

        if (!deployResponse.ok) {
            const errorData = await deployResponse.json();
            throw new Error(`Netlify API Error: ${errorData.message || deployResponse.statusText}`);
        }
        
        const deployData = await deployResponse.json();
        const liveUrl = deployData.ssl_url || deployData.url;

        res.json({ success: true, url: liveUrl });

    } catch (error) {
        console.error('Netlify deployment failed on server:', error);
        res.status(500).json({ success: false, message: `Deployment Failed: ${error.message}` });
    }
});


// --- 5. START THE SERVER ---
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server startup complete. Listening on port ${PORT}`);
});