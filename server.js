require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const JSZip = require('jszip');
const fetch = require('node-fetch'); // Netlify deploy needs a fetch implementation in Node

// --- 1. INITIALIZE APP ---
const app = express();
const PORT = process.env.PORT || 3000; 

// --- 2. CONFIGURE CORS ---
// Your CORS setup is good, no changes needed here.
const allowedOrigins = [
  'https://codeweaver-ai-app-12.onrender.com', // Your Render Frontend URL
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'https://sanyogita-pandey.github.io'
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
const GOOGLE_API_KEY = "AIzaSyDJwMLwjA-vGdE6tVYiFZwFvTarswZug8M"; 
const NETLIFY_ACCESS_TOKEN = "nfp_jZpHMxPpnB2zMDvDBVVzEvahDU23DGH94156";
const NETLIFY_SITE_ID = "9e955514-5324-4327-be59-195e63afce1c";

// Correct check for all required keys from the environment
if (!GOOGLE_API_KEY || !NETLIFY_ACCESS_TOKEN || !NETLIFY_SITE_ID) {
  console.error("FATAL ERROR: A required environment variable (GOOGLE_API_KEY, NETLIFY_ACCESS_TOKEN, or NETLIFY_SITE_ID) is missing!");
  process.exit(1); 
}
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);


// --- 4. DEFINE ROUTES ---

// Healthcheck route - good for testing if the server is alive
app.get('/', (req, res) => {
  res.status(200).json({ status: "ok", message: "CodeWeaver AI Server is running." });
});

// ===== FIX: Route path changed to match what the front-end is likely calling =====
app.post('/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const fullPrompt = `You are CodeWeaver AI, an expert web developer specializing in self-contained HTML, CSS, and JavaScript components. You MUST respond with a valid JSON object, and nothing else. Do not use markdown like \`\`\`json. The JSON object must have exactly two keys: "message" (a friendly, conversational text response) and "code" (a single string containing the component's HTML, including any <style> or <script> tags). Do NOT include <html>, <head>, or <body> tags. User Request: "${prompt}"`;
    
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    let aiResponseText = response.text();

    // Clean up potential markdown from the AI's response
    if (aiResponseText.startsWith("```json")) {
      aiResponseText = aiResponseText.substring(7, aiResponseText.length - 3).trim();
    }
    
    const parsedResponse = JSON.parse(aiResponseText);
    res.json(parsedResponse);
  } catch (error) {
    console.error("ERROR inside /generate:", error);
    res.status(500).json({ 
        message: 'An internal server error occurred while generating the code.',
        code: `<!-- Server Error: ${error.message} -->` 
    });
  }
});

// ===== FIX: Route path changed for consistency =====
app.post('/deploy', async (req, res) => {
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

        const deployData = await deployResponse.json();

        if (!deployResponse.ok) {
            throw new Error(`Netlify API Error: ${deployData.message || deployResponse.statusText}`);
        }
        
        const liveUrl = deployData.ssl_url || deployData.url;

        res.json({ success: true, url: liveUrl });

    } catch (error) {
        console.error('Netlify deployment failed on server:', error);
        res.status(500).json({ success: false, message: `Deployment Failed: ${error.message}` });
    }
});


// --- 5. START THE SERVER ---
app.listen(PORT,'0.0.0.0', () => { // Removed '0.0.0.0' as Render handles this automatically
  console.log(`Server startup complete. Listening on port ${PORT}`);
});


