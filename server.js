// // --- IMPORTANT SECURITY NOTICE ---
// // Ensure your API key is stored securely as an Environment Variable
// // on Render and NOT hardcoded in your code.

// // require('dotenv').config(); // For local .env file
// // const express = require('express');
// // const cors = require('cors');
// // const { GoogleGenerativeAI } = require('@google/generative-ai');

// // // --- 1. INITIALIZE APP ---
// // const app = express();
// // const PORT = process.env.PORT || 5500;
// // console.log("App initialized.");

// // // --- 2. SETUP MIDDLEWARE ---
// // // A robust CORS setup is crucial for production.
// // const allowedOrigins = [
// //  ' https://codeweaver-ai-app-12.onrender.com', // Your live front-end
// //   'http://localhost:5500',                    // For local testing
// //   'http://127.0.0.1:5500'                     // For local testing
// // ];

// // const corsOptions = {
// //   origin: (origin, callback) => {
// //     // Allow requests with no origin (like Postman, mobile apps) or from the whitelist
// //     if (!origin || allowedOrigins.includes(origin)) {
// //       callback(null, true);
// //     } else {
// //       callback(new Error(`Origin ${origin} not allowed by CORS`));
// //     }
// //   }
// // };
// // app.use(cors(corsOptions));
// // console.log("CORS middleware configured.");

// // // JSON body parser
// // app.use(express.json());
// // console.log("JSON parser middleware configured.");


// // // --- 3. GOOGLE AI CLIENT SETUP ---

// // const GOOGLE_API_KEY = "AIzaSyDipQ437B-eyMcxEfuKmzJhvkesc-lPfhY" ;

// // if (!GOOGLE_API_KEY) {
// //   console.error("FATAL ERROR: GOOGLE_API_KEY environment variable is not set.");
// //   process.exit(1); // Stop the server if the key is missing
// // }

// // const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
// // console.log("Google AI client initialized.");


// // // --- 4. DEFINE ALL ROUTES ---

// // // Health Check Endpoint
// // app.get('/healthcheck', (req, res) => {
// //   console.log(`[${new Date().toISOString()}] GET /healthcheck endpoint hit.`);
// //   res.status(200).json({
// //     status: "ok",
// //     message: "Server is alive and the healthcheck route is registered.",
// //   });
// // });
// // console.log("GET /healthcheck route defined.");

// // // Main API Endpoint
// // app.post('/api/generate-code', async (req, res) => {
// //   console.log(`[${new Date().toISOString()}] POST /api/generate-code endpoint hit.`);
// //   try {
// //     const { prompt } = req.body;
// //     if (!prompt) {
// //       console.log("Request failed: Prompt was empty.");
// //       return res.status(400).json({ error: 'Prompt is required.' });
// //     }

// //     const fullPrompt = `
// //        You are CodeWeaver AI, an expert web developer specializing in creating self-contained HTML and CSS components.
// //       Your task is to take a user's description and generate the corresponding HTML and CSS code.
// //       **Instructions:**
// //       1.  You MUST respond with a valid JSON object. Do not wrap the JSON in markdown backticks or any other text.
// //       2.  The JSON object must have exactly two keys: "message" and "code".
// //       3.  The "message" key should contain a friendly, conversational text response to the user, explaining what you've created.
// //       4.  The "code" key must be a single string containing the HTML and an associated <style> tag for the component.
// //       5.  Do NOT include \`<html>\`, \`<head>\`, or \`<body>\` tags in the "code" string. Only provide the component's code.
// //       6.  Ensure the CSS is well-scoped to avoid conflicts, for example by using specific class names.
// //       7.  Use modern and clean code practices.
// //       **User Request:** "${prompt}"
// //       **Example of your required output format:**
// //       {
// //         "message": "Sure, here is a simple and elegant button for you.",
// //         "code": "<style> .my-button { background-color: #007bff; color: white; padding: 10px 20px; border-radius: 5px; border: none; cursor: pointer; } </style> <button class='my-button'>Click Me</button>"
// //       }
// //     `;

// //     const model = genAI.getGenerativeModel({ model: "gemini-pro" });
// //     const result = await model.generateContent(fullPrompt);
// //     const response = await result.response;
// //     const aiResponseText = response.text();
    
// //     let parsedResponse;
// //     try {
// //       parsedResponse = JSON.parse(aiResponseText);
// //     } catch (e) {
// //       console.error("AI did not return valid JSON. Raw response:", aiResponseText);
// //       throw new Error("The AI response was not in the expected format.");
// //     }
    
// //     res.json(parsedResponse);

// //   } catch (error) {
// //     console.error('Error in /api/generate-code endpoint:', error.message);
// //     res.status(500).json({ 
// //         message: 'An error occurred on the server while processing the request.',
// //         code: `<!-- Server Error: ${error.message} -->` 
// //     });
// //   }
// // });
// // console.log("POST /api/generate-code route defined.");

// // // A catch-all route for 404s (optional but good for debugging)
// // app.use((req, res, next) => {
// //     console.log(`[${new Date().toISOString()}] 404 Not Found for ${req.method} ${req.originalUrl}`);
// //     res.status(404).send("Sorry, that route does not exist.");
// // });
// // console.log("404 catch-all route defined.");


// // // --- 5. START THE SERVER ---
// // app.listen(PORT, '0.0.0.0', () => {
// //   console.log(`Server startup complete. Listening on port ${PORT}`);
// // });
// // --- CodeWeaver AI Server ---
// // This is the final, corrected version of the server code.

// // Load environment variables from a .env file for local development
// require('dotenv').config(); 

// const express = require('express');
// const cors = require('cors');
// const { GoogleGenerativeAI } = require('@google/generative-ai');

// // --- 1. INITIALIZE APP ---
// const app = express();
// // Render provides its own PORT environment variable, which we must use.
// const PORT = process.env.PORT || 3000; 
// console.log("Initializing Express application...");

// // --- 2. CONFIGURE CORS ---
// // This is the whitelist of websites allowed to make requests to this server.
// // It is CRITICAL that your front-end's URL is in this list.
// const allowedOrigins = [
//   'https://codeweaver-ai-app-12.onrender.com', // Your live front-end on Render
//   // The following are for local testing, you can keep them.
//   'http://localhost:5500',
//   'http://127.0.0.1:5500'
// ];

// const corsOptions = {
//   origin: (origin, callback) => {
//     // Check if the incoming request's origin is in our whitelist.
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true); // Allow the request
//     } else {
//       // If the origin is not in the whitelist, block the request.
//       callback(new Error(`Origin ${origin} is not allowed by CORS.`));
//     }
//   }
// };

// app.use(cors(corsOptions));
// console.log("CORS middleware configured with whitelist.");

// // --- 3. CONFIGURE MIDDLEWARE ---
// // This allows our server to understand incoming requests with a JSON body.
// app.use(express.json());
// console.log("JSON parser middleware configured.");


// // --- 4. INITIALIZE GOOGLE AI CLIENT ---
// // The API key is loaded securely from the environment variables you set on Render.
// const GOOGLE_API_KEY = "AIzaSyDipQ437B-eyMcxEfuKmzJhvkesc-lPfhY";

// if (!GOOGLE_API_KEY) {
//   console.error("FATAL ERROR: The GOOGLE_API_KEY environment variable is not set!");
//   console.error("Please set this variable in the 'Environment' tab of your Render Web Service.");
//   process.exit(1); // Stop the server if the key is missing.
// }

// const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
// console.log("Google AI client initialized successfully.");


// // --- 5. DEFINE ROUTES ---

// // Health Check Route for Render
// // This tells Render that our server is alive and ready for traffic.
// app.get('/healthcheck', (req, res) => {
//   console.log(`[${new Date().toISOString()}] Health check successful.`);
//   res.status(200).json({ status: "ok", message: "Server is healthy." });
// });
// console.log("Route defined: GET /healthcheck");

// // Main API Route for Generating Code
// app.post('/api/generate-code', async (req, res) => {
//   console.log(`[${new Date().toISOString()}] Received request for /api/generate-code.`);
//   try {
//     const { prompt } = req.body;
//     if (!prompt) {
//       console.log("Request rejected: Prompt was empty.");
//       return res.status(400).json({ error: 'Prompt is required.' });
//     }

//     console.log("Sending prompt to Google AI...");
//     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    
//     // [Your AI Prompt - this part is up to you]
//     const fullPrompt = `
//       You are CodeWeaver AI, an expert web developer specializing in self-contained HTML and CSS components.
//       Your task is to take a user's description and generate the corresponding HTML and CSS code.
//       Instructions:
//       1. You MUST respond with a valid JSON object, and nothing else.
//       2. The JSON object must have exactly two keys: "message" and "code".
//       3. The "message" key should contain a friendly, conversational text response.
//       4. The "code" key must be a single string containing the HTML and a <style> tag.
//       5. Do NOT include <html> or <body> tags.
//       User Request: "${prompt}"
//     `;
    
//     const result = await model.generateContent(fullPrompt);
//     const response = await result.response;
//     const aiResponseText = response.text();
//     console.log("Received response from Google AI.");

//     let parsedResponse;
//     try {
//       parsedResponse = JSON.parse(aiResponseText);
//     } catch (e) {
//       console.error("CRITICAL: Failed to parse JSON from AI response.");
//       console.error("Raw AI Response Text:", aiResponseText);
//       // This throws an error that will be caught by the outer catch block.
//       throw new Error("The AI response was not in the expected valid JSON format.");
//     }
    
//     console.log("Successfully parsed AI response. Sending to client.");
//     res.json(parsedResponse);

//   } catch (error) {
//     // This block catches errors from the Google AI call or JSON parsing.
//     console.error("ERROR inside /api/generate-code:", error.message);
//     res.status(500).json({ 
//         message: 'An internal server error occurred while contacting the AI.',
//         code: `<!-- Server Error: ${error.message} -->` 
//     });
//   }
// });
// console.log("Route defined: POST /api/generate-code");


// // --- 6. START THE SERVER ---
// // We bind to '0.0.0.0' to ensure it's accessible within Render's environment.
// app.listen(PORT, '0.0.0.0', () => {
//   console.log(`Server startup complete. Listening for connections on port ${PORT}`);
// });


// --- CodeWeaver AI Server ---
// This is the final, corrected version of the server code.

// Load environment variables from a .env file for local development
require('dotenv').config(); 

const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- 1. INITIALIZE APP ---
const app = express();
// Render provides its own PORT environment variable, which we must use.
const PORT = process.env.PORT || 3000; 
console.log("Initializing Express application...");

// --- 2. CONFIGURE MIDDLEWARE ---
// A robust CORS policy is less critical in a single-server setup,
// but it's good practice to have it for potential future use.
const allowedOrigins = [
  'https://codeweaver-ai-app.onrender.com', // Your primary live URL
  'http://localhost:3000',                  // For local testing
  'http://127.0.0.1:3000'
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
console.log("CORS middleware configured.");

// This allows our server to understand incoming requests with a JSON body.
app.use(express.json());
console.log("JSON parser middleware configured.");


// --- 3. INITIALIZE GOOGLE AI CLIENT ---
// The API key is loaded securely from the environment variables you set on Render.
const GOOGLE_API_KEY = "AIzaSyDipQ437B-eyMcxEfuKmzJhvkesc-lPfhY";

if (!GOOGLE_API_KEY) {
  console.error("FATAL ERROR: The GOOGLE_API_KEY environment variable is not set!");
  console.error("Please set this variable in the 'Environment' tab of your Render Web Service.");
  process.exit(1); // Stop the server if the key is missing.
}

const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
console.log("Google AI client initialized successfully.");


// --- 4. DEFINE API ROUTES FIRST ---
// API routes are defined before the static file handler.

// Health Check Route for Render
app.get('/healthcheck', (req, res) => {
  console.log(`[${new Date().toISOString()}] Health check successful.`);
  res.status(200).json({ status: "ok", message: "Server is healthy." });
});
console.log("Route defined: GET /healthcheck");

// Main API Route for Generating Code
app.post('/api/generate-code', async (req, res) => {
  console.log(`[${new Date().toISOString()}] Received request for /api/generate-code.`);
  try {
    const { prompt } = req.body;
    if (!prompt) {
      console.log("Request rejected: Prompt was empty.");
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    console.log("Sending prompt to Google AI...");
    // Use the current, correct model name.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    
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
    const aiResponseText = response.text();
    console.log("Received response from Google AI.");

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponseText);
    } catch (e) {
      console.error("CRITICAL: Failed to parse JSON from AI response.");
      console.error("Raw AI Response Text:", aiResponseText);
      throw new Error("The AI response was not in the expected valid JSON format.");
    }
    
    console.log("Successfully parsed AI response. Sending to client.");
    res.json(parsedResponse);

  } catch (error) {
    console.error("ERROR inside /api/generate-code:", error.message);
    res.status(500).json({ 
        message: 'An internal server error occurred while contacting the AI.',
        code: `<!-- Server Error: ${error.message} -->` 
    });
  }
});
console.log("Route defined: POST /api/generate-code");


// --- 5. SERVE STATIC FRONT-END FILES ---
// This middleware must be defined AFTER the API routes.
// It serves your index.html, style.css, and script.js from the 'public' folder.
app.use(express.static('public'));
console.log("Static file middleware configured to serve from 'public' folder.");

// This catch-all makes sure that if you refresh a page on a front-end route,
// it still serves the index.html file. It's crucial for Single Page Apps.
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});


// --- 6. START THE SERVER ---
// We bind to '0.0.0.0' to ensure it's accessible within Render's environment.
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server startup complete. Listening for connections on port ${PORT}`);
});