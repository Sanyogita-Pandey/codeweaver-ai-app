// Load environment variables from .env file

const express = require('express');
const cors = require('cors');
// Import the Google Generative AI package
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Google AI Client Initialization ---
// Check if the API key is available
const GOOGLE_API_KEY = "AIzaSyB5D-OeNpFJQo7orqHlD620nZBG7SAoGBY";

// ✅ Optional: check the hardcoded value instead of process.env
if (!GOOGLE_API_KEY) {
  console.error("FATAL ERROR: GOOGLE_API_KEY is not set.");
  process.exit(1);
}

// ✅ Now use it
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

// --- API Endpoint ---
app.post('/api/generate-code', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    // This is the "Prompt Engineering" for Gemini.
    // It's a set of instructions telling the AI how to behave and what format to use.
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

    // Choose the model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Generate content
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const aiResponseText = response.text();

    // The AI's response is a string, which should be in our specified JSON format.
    // We parse it to turn it into a real JavaScript object.
    let parsedResponse;
    try {
        parsedResponse = JSON.parse(aiResponseText);
    } catch (e) {
        console.error("AI did not return valid JSON. Raw response:", aiResponseText);
        throw new Error("The AI response was not in the expected format.");
    }

    // Send the structured response back to the front-end
    res.json(parsedResponse);

  } catch (error) {
    console.error('Error calling Google AI API:', error);
    res.status(500).json({ 
        message: 'An error occurred while generating the code. Please check the server logs.',
        code: `<!-- Error: ${error.message} -->` 
    });
  }
});


// --- Start the server ---
app.listen(PORT, () => {
  console.log(`CodeWeaver AI server (using Google Gemini) is running on http://localhost:${PORT}`);
});