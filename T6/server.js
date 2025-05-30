const WebSocket = require('ws');
const { VertexAI } = require('@google-cloud/aiplatform');

// Replace with your project ID and location
const PROJECT_ID = 'YOUR_PROJECT_ID';
const LOCATION = 'us-central1';

// Initialize Vertex AI
const vertex_ai = new VertexAI({ project: PROJECT_ID, location: LOCATION });

// Initialize the Gemini model
const model = vertex_ai.getGenerativeModel({
  model: 'gemini-1.5-pro',  // Or another Gemini model
  generation_config: { maxOutputTokens: 200 },  // Limit the response length
});

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', ws => {
  console.log('Client connected');

  ws.on('message', async message => {
    try {
      const data = JSON.parse(message);
      console.log('Received:', data);

      if (data.type === "login") {
        console.log("Client connected with username: " + data.username);
        ws.send(JSON.stringify({ type: "message", text: "Welcome, " + data.username + "!" }));

      } else if (data.type === "playerMove") {
        console.log("Player moving " + data.direction);
        ws.send(JSON.stringify({ type: "blockUpdate", x: 1, y: 1, z: 1, blockId: 2 }));

      } else if (data.type === "chat") { // Example: Chat integration
        const chatMessage = data.text;

        // Sentiment analysis using Gemini API
        try {
          const prompt = `Analyze the sentiment of the following text: "${chatMessage}". Is it positive, negative, or neutral? Respond with only one word: positive, negative, or neutral.`;
          const streamingResp = await model.generateContentStream({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
          });

          let analysis = '';
          for await (const item of streamingResp.stream) {
             analysis += item.candidates[0].content.parts[0].text
          }
          analysis = analysis.trim().toLowerCase();

          console.log(`Sentiment analysis result: ${analysis}`);

          let responseMessage = chatMessage; // Default

          if (analysis === 'negative') {
            responseMessage = "Please be respectful in chat.";
          } else if (analysis === 'positive'){
             responseMessage = "Great message!"
          }

          // Send the potentially modified message back to the client.
          ws.send(JSON.stringify({ type: "chatResponse", text: responseMessage }));


        } catch (error) {
          console.error("Gemini API error:", error);
          ws.send(JSON.stringify({ type: "chatResponse", text: "Error processing chat message." }));
        }
      }

    } catch (error) {
      console.error("Error parsing message:", error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.on('error', error => {
    console.error('WebSocket error:', error);
  });
});