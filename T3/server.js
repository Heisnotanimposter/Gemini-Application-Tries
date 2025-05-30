// Load environment variables from .env file  
require('dotenv').config();  

const express = require('express');  
const { GoogleGenerativeAI } = require('@google/generative-ai');  

const app = express();  
const port = process.env.PORT || 3000; // Use port 3000 by default or environment variable  

// --- Gemini API Setup ---  
const apiKey = process.env.GEMINI_API_KEY;  
if (!apiKey) {  
    console.error("GEMINI_API_KEY is not set in the .env file.");  
    process.exit(1); // Exit if the API key is not found  
}  

const genAI = new GoogleGenerativeAI(apiKey);  
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro-exp-03-25" }); // Or "gemini-1.5-pro-latest", etc.  

// --- Middleware ---  
// Serve static files from the 'public' directory  
app.use(express.static('public'));  
// Parse JSON request bodies  
app.use(express.json());  

// --- API Endpoint for Chat ---  
app.post('/chat', async (req, res) => {  
    const userMessage = req.body.message;  

    if (!userMessage) {  
        return res.status(400).json({ error: 'Message is required' });  
    }  

    console.log("Received message:", userMessage);  

    try {  
        // Call the Gemini API  
        const result = await model.generateContent(userMessage);  
        const response = result.response;  
        const text = response.text();  

        console.log("Gemini response:", text);  

        // Send the AI's response back to the frontend  
        res.json({ reply: text });  

    } catch (error) {  
        console.error('Error calling Gemini API:', error);  
        // Send an error response to the frontend  
        res.status(500).json({ error: 'Failed to get response from AI' });  
    }  
});  

// --- Start the Server ---  
app.listen(port, () => {  
    console.log(`Server running at http://localhost:${port}`);  
});  