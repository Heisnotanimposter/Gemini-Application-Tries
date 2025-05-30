// server.js
require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 8000; // Use port 8000 for consistency with frontend

// --- CORS Configuration (Applying the referenced solution securely) ---
// Define allowed origins for your frontend.
// If your frontend is served from `file://` or a different `localhost` port (e.g., VS Code Live Server on 5500),
// add those origins here.
const allowedOrigins = [
    'http://localhost:5500', // Common for VS Code Live Server
    'http://127.0.0.1:5500', // Another common Live Server address
    'http://localhost:8000', // If you serve your frontend from this same backend
    'null' // Important for requests originating from local file:// paths in some browsers
    // Add your production frontend URL here when deploying:
    // 'https://www.your-production-frontend.com'
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        // or if the origin is in our allowed list.
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allow common methods
    credentials: true, // Allow cookies and authorization headers
    optionsSuccessStatus: 204 // Set 204 for successful pre-flight requests
}));

// --- Middleware for JSON body parsing ---
app.use(express.json({ limit: '5mb' })); // Adjust limit as needed for larger payloads

// --- PDB Proxy Endpoint ---
app.get('/proxy-pdb/:pdbId.pdb', async (req, res) => {
    const pdbId = req.params.pdbId.toUpperCase();
    const pdbUrl = `https://files.rcsb.org/download/${pdbId}.pdb`;

    try {
        const response = await axios.get(pdbUrl, { responseType: 'text' });
        // Set Content-Type header to ensure browser interprets it as PDB data
        res.setHeader('Content-Type', 'text/plain'); 
        res.status(200).send(response.data);
    } catch (error) {
        console.error(`Error fetching PDB ${pdbId}:`, error.message);
        if (error.response) {
            // Forward the actual status code from RCSB if available
            res.status(error.response.status).json({
                error: `Failed to fetch PDB ${pdbId}`,
                details: error.response.statusText || 'PDB file not found or service unavailable.'
            });
        } else {
            res.status(500).json({
                error: `An unexpected error occurred while fetching PDB ${pdbId}`,
                details: error.message
            });
        }
    }
});

// --- Gemini AI Proxy Endpoint ---
app.post('/ask-gemini', async (req, res) => {
    const { question, context } = req.body;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;

    if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: 'Gemini API key not configured on server.' });
    }
    if (!question) {
        return res.status(400).json({ error: 'Question is required.' });
    }

    const fullPrompt = `You are an AI assistant specializing in protein science. Answer the following question concisely and informatively. If the question refers to a PDB ID, use it for context.

Context (if available): PDB ID: ${context || "No PDB loaded."}
Question: ${question}

Answer:`;

    const payload = {
        contents: [{ parts: [{ text: fullPrompt }] }],
        safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ]
    };

    try {
        const response = await axios.post(GEMINI_API_URL, payload, {
            headers: { 'Content-Type': 'application/json' }
        });

        const geminiResponse = response.data;
        if (geminiResponse.candidates && geminiResponse.candidates[0] && geminiResponse.candidates[0].content && geminiResponse.candidates[0].content.parts[0]) {
            res.status(200).json({ text: geminiResponse.candidates[0].content.parts[0].text });
        } else {
            console.warn("Unexpected Gemini response structure:", geminiResponse);
            res.status(500).json({ error: 'Sorry, I could not generate a coherent response from Gemini.', details: geminiResponse });
        }
    } catch (error) {
        console.error("Error communicating with Gemini API:", error.message);
        if (error.response) {
            console.error("Gemini API error response data:", error.response.data);
            res.status(error.response.status).json({
                error: 'Error from Gemini API.',
                details: error.response.data.error ? error.response.data.error.message : error.response.statusText
            });
        } else {
            res.status(500).json({ error: 'An unexpected error occurred while contacting Gemini.', details: error.message });
        }
    }
});

// --- Start the server ---
app.listen(PORT, () => {
    console.log(`Protein Explorer Backend running on http://localhost:${PORT}`);
    console.log('Ensure your frontend is configured to fetch from this address.');
});