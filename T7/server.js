//server.js

const cheerio = require('cheerio');
const axios = require('axios');
const WebSocket = require('ws');
const natural = require('natural');

const tokenizer = new natural.WordTokenizer();
const Analyzer = natural.SentimentAnalyzer;
const analyzer = new Analyzer('English', null, 'afinn');

const wss = new WebSocket.Server({ port: 8080 }); // WebSocket server on port 8080

// Function to fetch and analyze sentiment of a website
async function analyzeWebsiteSentiment(url) {
    try {
        const response = await axios.get(url, { timeout: 10000 }); // Set a timeout
        const $ = cheerio.load(response.data);
        const textContent = $('body').text().toLowerCase().replace(/[^a-z\\s]/g, ''); // Extract and clean text
        const tokens = tokenizer.tokenize(textContent);
        const sentimentScore = analyzer.analyze(tokens); // Returns a score between -1 and 1
        return sentimentScore;
    } catch (error) {
        console.error(`Error analyzing ${url}: ${error.message}`);
        return 0; // Default to neutral or handle error
    }
}

// Function to analyze links between websites
async function analyzeWebsiteLinks(url) {
    try {
        const response = await axios.get(url, { timeout: 10000 });  // Add timeout
        const $ = cheerio.load(response.data);
        const links = $('a').map((i, link) => $(link).attr('href')).get();
        // Ensure links have a protocol before using them with axios
        const absoluteLinks = links.map(link => {
            if (link && !link.startsWith('http://') && !link.startsWith('https://')) {
                //  resolveUrl will handle relative URLs and absolute URLs without protocol
                return resolveUrl(url, link);
            }
            return link; // Return original link if it has a protocol or is null/undefined
        }).filter(link => link); // Filter out null or undefined links
        return absoluteLinks;
    } catch (error) {
        console.error(`Error analyzing links at ${url}: ${error.message}`);
        return [];
    }
}

// Helper function to resolve relative URLs
function resolveUrl(base, relative) {
    try {
        return new URL(relative, base).href;
    } catch (e) {
        // Handle invalid URLs (e.g., mailto:, tel:)
        console.error(`Error resolving URL: ${relative} with base ${base} - ${e.message}`);
        return null; // Return null for invalid URLs
    }
}


// Main function to orchestrate the analysis and send data to the client
async function main(client) {
    const websites = [
        "https://www.google.com",
        "https://www.facebook.com",
        "https://www.amazon.com"
    ]; // Array of websites.
    const nodes = [];
    const edges = [];

    // Analyze each website
    for (const website of websites) {
        const sentiment = await analyzeWebsiteSentiment(website);
        const links = await analyzeWebsiteLinks(website);
        nodes.push({ id: website, sentiment: sentiment });

        // Add edges, resolving relative URLs
        for (const link of links) {
            const absoluteLink = resolveUrl(website, link);
            if (absoluteLink && websites.includes(absoluteLink)) {
                edges.push({ source: website, target: absoluteLink });
            }
        }
    }

    // Structure data for the frontend
    const graphData = { nodes, edges };
    console.log("Data sent to client:", JSON.stringify(graphData, null, 2)); // Debugging
    client.send(JSON.stringify(graphData)); // Send data to the connected client
}

// WebSocket connection handler
wss.on('connection', (ws) => {
    console.log('Client connected');

    // Send initial data on connection
    main(ws); // Pass the WebSocket connection

    // Keep sending data periodically (e.g., every 10 seconds) - for demonstration
    const intervalId = setInterval(() => {
        main(ws);
    }, 10000);

    // Handle disconnection
    ws.on('close', () => {
        console.log('Client disconnected');
        clearInterval(intervalId); // Clear the interval
    });
});

console.log('WebSocket server started on port 8080');
