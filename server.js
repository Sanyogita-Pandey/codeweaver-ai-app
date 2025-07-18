
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const JSZip = require('jszip');
const fetch = require('node-fetch');

// ... (All the code at the top is the same) ...
const app = express();
const PORT = process.env.PORT || 10000;

const allowedOrigins = [
  'https://codeweaver-ai-app-12.onrender.com', 
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


app.use(cors(cors(corsOptions)));
app.use(express.json({ limit: '2mb' }));
const GOOGLE_API_KEY = "AIzaSyDJwMLwjA-vGdE6tVYiFZwFvTarswZug8M"; 
const NETLIFY_ACCESS_TOKEN = "nfp_jZpHMxPpnB2zMDvDBVVzEvahDU23DGH94156";
const NETLIFY_SITE_ID = "9e955514-5324-4327-be59-195e63afce1c";

//... etc.

// --- 4. DEFINE ROUTES ---
app.get('/', (req, res) => {
  res.status(200).json({ status: "ok", message: "CodeWeaver AI Server is running." });
});

app.post('/generate', async (req, res) => {
    // This route is working, no changes needed here.
    try {
        const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const { prompt } = req.body;
        const fullPrompt = `You are an expert web developer AI. Your task is to generate a JSON object based on a user's request.
      
      RULES:
      1.  You MUST respond with a single, valid JSON object and nothing else. Do not wrap it in markdown like \`\`\`json.
      2.  The JSON object MUST have exactly two keys: "message" (a friendly, conversational string) and "code" (a string containing HTML, CSS, and JS).
      3.  The 'code' string must NOT contain <html>, <head>, or <body> tags.
      4.  **CRITICAL FOR VALID JSON:** If any string value (in 'message' or 'code') needs to contain a double-quote character ("), you MUST escape it with a backslash (e.g., \\"). If any string value needs a backslash (\\), you MUST escape it with another backslash (e.g., \\\\). This is non-negotiable.

      User Request: "${prompt}"
      `; // Your prompt logic
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        let aiResponseText = response.text();
        const startIndex = aiResponseText.indexOf('{');
        const endIndex = aiResponseText.lastIndexOf('}');
        if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
            throw new Error("AI response did not contain a valid JSON object.");
        }
        const jsonString = aiResponseText.substring(startIndex, endIndex + 1);
        const parsedResponse = JSON.parse(jsonString);
        res.json(parsedResponse);
    } catch (error) {
        // ... error handling
        console.error("Error in /generate:", error.message);
        res.status(500).json({ message: `Server failed: ${error.message}` });
    }
});

// ===== THE FIX IS IN THIS ROUTE =====
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

        // ** STEP 1: ADD CRITICAL LOGGING **
        // This will print the exact response from Netlify to your Render logs.
        console.log("NETLIFY DEPLOY RESPONSE:", JSON.stringify(deployData, null, 2));

        if (!deployResponse.ok) {
            throw new Error(`Netlify API Error: ${deployData.message || deployResponse.statusText}`);
        }
        
        // ** STEP 2: MAKE THE URL FINDER MORE ROBUST **
        // We will check for multiple possible properties where the URL might be.
        const liveUrl = deployData.ssl_url || deployData.deploy_ssl_url || deployData.url || (deployData.links && deployData.links.permalink);

        if (!liveUrl) {
            // If we still can't find a URL, we know the structure is different.
            throw new Error("Could not find a live URL in the Netlify API response.");
        }

        res.json({ success: true, url: liveUrl });

    } catch (error) {
        console.error('Netlify deployment failed on server:', error);
        res.status(500).json({ success: false, message: `Deployment Failed: ${error.message}` });
    }
});


// --- 5. START THE SERVER ---
app.listen(PORT, () => {
  console.log(`Server startup complete. Listening on port ${PORT}`);
});