// This file runs on your server, NOT in the browser
require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // For development, to allow frontend to access backend
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 3000; // Use port 3000 or whatever is available

// Initialize Google Generative AI
// Ensure your API key is in a .env file (e.g., GEMINI_API_KEY=YOUR_API_KEY)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY not found in .env file!');
    process.exit(1); // Exit if API key is not set
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Middleware
app.use(bodyParser.json()); // To parse JSON bodies from frontend requests
app.use(cors()); // Enable CORS for all origins (for development only; restrict in production)

// Your API endpoint for MCP tasks
app.post('/api/mcp-request', async (req, res) => {
    const { task, purpose } = req.body;

    if (!task) {
        return res.status(400).json({ error: 'Task description is required.' });
    }

    try {
        // Construct the prompt for Gemini
        const prompt = `You are an Multi-Capability Processing (MCP) system.
        The user has requested a task with the following description: "${task}".
        The specified purpose for this task is: "${purpose}".

        Based on the task and purpose, simulate the outcome of processing this task.
        Provide a concise result or a summary of what would happen.
        If the task implies an action, describe the action and its direct consequence.
        Keep the response brief and direct, as if it's the result of an automated process.`;

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-05-20" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Send Gemini's generated text back to the frontend
        res.json({ result: text });

    } catch (error) {
        console.error('Error calling Gemini API:', error);
        res.status(500).json({ error: 'Failed to process task via Gemini API. Please try again later.' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
    console.log(`Please ensure your frontend is served on a different port (e.g., 8080)`);
});