// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
// If your Node.js version doesn't support native fetch, uncomment the line below:
// const fetch = require('node-fetch');

const app = express();
const port = 3001; // Backend will run on port 3001

// Use CORS middleware to allow requests from your frontend
app.use(cors());

// Middleware to parse JSON request bodies (if you needed to receive data from frontend)
app.use(express.json());

// --- Simulate Real-Time Economic Data Fetching ---
// In a real application, you would call external APIs here.
async function getEconomicData(indicators) {
    console.log(`Backend fetching data for indicators: ${indicators.join(', ')}`);

    // --- Placeholder/Simulation ---
    // Replace this with actual API calls to Alpha Vantage, FMP, etc.
    // Use process.env.ECONOMIC_DATA_API_KEY here.
    // Example using hypothetical fetch (replace with real API endpoint and key usage):
    /*
    const apiKey = process.env.ECONOMIC_DATA_API_KEY;
    const data = {};
    for (const indicator of indicators) {
        try {
            // Hypothetical API call
            const response = await fetch(`https://api.economicdata.com/v1/latest?symbol=${indicator}&apikey=${apiKey}`);
            if (!response.ok) {
                console.error(`API error for ${indicator}: ${response.status}`);
                data[indicator] = { value: null, timestamp: Date.now(), error: 'API error' };
                continue;
            }
            const result = await response.json();
            // Assuming the API returns { value: ..., timestamp: ... }
            data[indicator] = {
                value: result.value,
                timestamp: new Date(result.timestamp).getTime(), // Ensure timestamp is in milliseconds
                news: result.news || '' // Include news if available
            };
        } catch (error) {
            console.error(`Error fetching data for ${indicator}:`, error);
            data[indicator] = { value: null, timestamp: Date.now(), error: error.message };
        }
    }
    return data;
    */
    // --- End Placeholder/Simulation ---


    // --- SIMULATED Data (for demonstration without real APIs) ---
    // This simulates getting slightly varied data each time.
     const simulatedData = {};
     indicators.forEach(indicator => {
         let baseValue = 0;
         let news = '';
         switch(indicator) {
             case 'SP_500':
                 baseValue = 5200;
                 news = 'Simulated: S&P 500 movement.';
                 break;
             case 'INTEREST_RATE':
                 baseValue = 5.5;
                 news = 'Simulated: Interest rate update.';
                 break;
             case 'INFLATION_RATE':
                 baseValue = 3.4;
                 news = 'Simulated: Inflation data released.';
                 break;
             // Add more simulated indicators here
             default:
                 baseValue = 100; // Default value for unknown indicators
                 news = 'Simulated: Generic data.';
         }
         // Add some random variation
         const value = baseValue + (Math.random() - 0.5) * (baseValue * 0.01); // +/- 1% variation
         simulatedData[indicator] = {
             value: parseFloat(value.toFixed(2)), // Keep it tidy
             timestamp: Date.now(),
             news: news
         };
     });
     return simulatedData;
    // --- END SIMULATED Data ---
}

// --- Simulate Gemini API Call ---
// In a real application, you would call the Gemini API here.
async function analyzeWithGemini(prompt, data) {
    console.log('Backend calling Gemini API...');
    // Use process.env.GEMINI_API_KEY here.

    // --- Placeholder/Simulation ---
    // Replace this with actual Gemini API call using @google/genai library
    /*
    const { GoogleGenAI } = require('@google/genai');
    const apiKey = process.env.GEMINI_API_KEY;
    const ai = new GoogleGenAI({ apiKey });

    try {
        const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' }); // Or your preferred model

        // Construct the content for the Gemini API
        const content = [
            { text: prompt },
            // You might want to include the economic data in the prompt as well
            { text: `Economic Data: ${JSON.stringify(data)}` }
        ];

        const result = await model.generateContent(content);
        const response = await result.response;
        const text = response.text(); // Get the text response from Gemini

        console.log('Gemini Response:', text);
        return { success: true, analysis: text };

    } catch (error) {
        console.error('Error calling Gemini API:', error);
        return { success: false, error: error.message };
    }
    */
    // --- End Placeholder/Simulation ---

    // --- SIMULATED Gemini Response (for demonstration) ---
    console.log(`Simulating Gemini analysis for prompt: "${prompt}" with data: ${JSON.stringify(data)}`);
    const simulatedAnalysis = `Simulated analysis based on prompt "${prompt}" and provided data. Gemini would provide insights here.`;
    return { success: true, analysis: simulatedAnalysis };
    // --- END SIMULATED Gemini Response ---
}


// --- Backend API Endpoint ---
app.get('/api/realtime-economic-data', async (req, res) => {
    // In a real app, you might get requested indicators from query params:
    // const indicators = req.query.indicators ? req.query.indicators.split(',') : ['SP_500'];
    // For this simulation, we'll fetch all defined simulated indicators
    const indicators = ['SP_500', 'INTEREST_RATE', 'INFLATION_RATE']; // List of indicators to simulate

    const data = await getEconomicData(indicators);
    res.json(data); // Send the data back as JSON
});

// --- Backend API Endpoint for Gemini Analysis ---
// This endpoint would receive data/prompt from a Gemini Analysis node
app.post('/api/gemini-analysis', async (req, res) => {
    const { prompt, data } = req.body; // Get prompt and data from the request body

    if (!prompt) {
        return res.status(400).json({ success: false, error: 'Prompt is required' });
    }

    const analysisResult = await analyzeWithGemini(prompt, data); // Call the simulation/actual Gemini function
    res.json(analysisResult); // Send the analysis result back
});


// Start the backend server
app.listen(port, () => {
    console.log(`Backend server running at http://localhost:${port}`);
    console.log('Remember to replace simulated data fetching with actual API calls!');
});
