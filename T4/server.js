const express = require('express');  
const dotenv = require('dotenv');  
const { GoogleGenerativeAI } = require('@google/generative-ai');  
const path = require('path'); // Core Node.js module for path handling  
dotenv.config(); // Load environment variables from .env

const app = express();
const port = 3000; // Or any port you prefer

// Middleware to parse JSON requests
app.use(express.json());

// Serve static files (your frontend)
app.use(express.static(path.join(__dirname, '.'))); // Serves files from the current directory

// Initialize the Gemini API
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
console.error("GEMINI_API_KEY not found in .env file!");
process.exit(1); // Exit if API key is missing
}
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });  

// --- Game State and Logic will go here ---
let gameState = {
player: {
location: 'start_room', // e.g., 'dungeon_level_1_room_A'
health: 100,
inventory: [],
// Add more stats as needed
},
currentRoomId: 'start_room',
// This is a simple placeholder map structure
dungeonMap: {
'start_room': {
description: "A damp, stone chamber. A narrow passage leads north.",
exits: { 'north': 'goblin_room' },
enemies: [], // e.g., [{ id: 'goblin1', type: 'goblin', health: 20 }]
items: [], // e.g., [{ id: 'potion1', type: 'health_potion' }]
},
'goblin_room': {
description: "A small cave echoes with growls. A single goblin stands guard. Passages lead south and east.",
exits: { 'south': 'start_room', 'east': 'treasure_room' },
enemies: [{ id: 'goblin1', type: 'goblin', health: 20 }],
items: [],
},
'treasure_room': {
description: "A glimmering chamber filled with discarded adventurer gear. A single exit leads west.",
exits: { 'west': 'goblin_room' },
enemies: [],
items: [{ id: 'sword1', type: 'sword', description: 'A rusty but functional sword.' }],
}
// Add more rooms...
},
// Keep track of defeated enemies or picked up items globally if needed
globalGameFlags: {}
};

// --- API Endpoint for Chat/Game Interaction ---
app.post('/chat', async (req, res) => {
const userMessage = req.body.message; // This is the player's command


if (!userMessage) {  
    return res.status(400).json({ error: 'Message is required' });  
}  

let botReply = ''; // The text response to send back  

try {  
    // --- Game Logic: Parse Command, Update State, Generate Description ---  

    // 1. Parse User Input (Simple Command Matching for prototype)  
    const command = userMessage.trim().toLowerCase();  
    let outcomeText = ''; // Text describing the result of the player's action  
    let stateChangeDescription = ''; // Text describing resulting game state changes  

    const currentRoom = gameState.dungeonMap[gameState.currentRoomId];  

    if (command.startsWith('move ')) {  
        const direction = command.substring(5).trim();  
        if (currentRoom.exits[direction]) {  
            const newRoomId = currentRoom.exits[direction];  
             if (gameState.dungeonMap[newRoomId]) {  
                 gameState.currentRoomId = newRoomId;  
                 const newRoom = gameState.dungeonMap[newRoomId];  
                 outcomeText = `You move ${direction}.`;  
                 // Trigger Gemini to describe the new room  
                 const prompt = `Describe this dungeon room vividly, focusing on atmosphere and key features: "${newRoom.description}". Make it feel like a text RPG.`;  
                 const result = await model.generateContent(prompt);  
                 const descriptionResponse = result.response.text();  
                 stateChangeDescription = descriptionResponse;  

                 // Also describe enemies/items if any  
                 if (newRoom.enemies.length > 0) {  
                     stateChangeDescription += `\nYou see ${newRoom.enemies.map(e => e.type).join(', ')}.`; // Simple list  
                     // Could use Gemini to describe enemies: `Describe the ${newRoom.enemies[0].type}.`  
                 }  
                  if (newRoom.items.length > 0) {  
                     stateChangeDescription += `\nThere is ${newRoom.items.map(item => item.type).join(', ')} here.`; // Simple list  
                     // Could use Gemini to describe items: `Describe the ${newRoom.items[0].type}.`  
                 }  


             } else {  
                  outcomeText = `You can't go that way. The passage ${direction} seems unstable or leads nowhere.`;  
             }  
        } else {  
            outcomeText = `There is no exit in that direction (${direction}) from here. Available exits: ${Object.keys(currentRoom.exits).join(', ')}`;  
        }  
     } else if (command === 'look' || command === 'examine room') {  
         // Use Gemini to describe the current room  
         const prompt = `Describe the current room based on its key features: "${currentRoom.description}". Focus on atmosphere, exits, enemies, and items. Make it feel like a text RPG. Current exits: ${Object.keys(currentRoom.exits).join(', ')}. Enemies present: ${currentRoom.enemies.map(e => e.type).join(', ') || 'none'}. Items present: ${currentRoom.items.map(item => item.type).join(', ') || 'none'}.`;  
         const result = await model.generateContent(prompt);  
         stateChangeDescription = result.response.text();  

     }  
     // Add more commands: attack, take, use, inventory, stats etc.  
     // Attack command example (very basic):  
     else if (command.startsWith('attack ')) {  
          const targetType = command.substring(7).trim();  
          const targetEnemyIndex = currentRoom.enemies.findIndex(e => e.type === targetType);  

          if (targetEnemyIndex !== -1) {  
              const targetEnemy = currentRoom.enemies[targetEnemyIndex];  
              // Simple combat: player deals damage  
              const playerDamage = Math.floor(Math.random() * 10) + 5; // Player deals 5-14 damage  
              targetEnemy.health -= playerDamage;  

              outcomeText = `You attack the ${targetEnemy.type}, dealing ${playerDamage} damage!`;  

              if (targetEnemy.health <= 0) {  
                   outcomeText += ` The ${targetEnemy.type} collapses, defeated!`;  
                   // Remove enemy from room  
                   currentRoom.enemies.splice(targetEnemyIndex, 1);  
                   // Could use Gemini to describe the enemy's death  
              } else {  
                   outcomeText += ` The ${targetEnemy.type} has ${targetEnemy.health} health remaining.`;  
                   // Enemy counter-attack (simple)  
                   const enemyDamage = Math.floor(Math.random() * 5) + 2; // Enemy deals 2-6 damage  
                   gameState.player.health -= enemyDamage;  
                   stateChangeDescription = `The ${targetEnemy.type} counter-attacks, hitting you for ${enemyDamage} damage.`;  

                   if (gameState.player.health <= 0) {  
                        // Player died! Handle game over.  
                        outcomeText += "\nYou have been defeated...";  
                        stateChangeDescription += " Your adventure ends here.";  
                        // Reset game state or redirect to game over screen  
                        // For now, just stop interaction or give a restart option  
                        // You might want a dedicated game over endpoint or state  
                   } else {  
                        stateChangeDescription += ` You have ${gameState.player.health} health remaining.`;  
                   }  
                    // Could use Gemini to describe the exchange  
                     const combatPrompt = `Describe a brief combat exchange: The player attacked a ${targetEnemy.type} dealing ${playerDamage} damage (it has ${targetEnemy.health > 0 ? targetEnemy.health : 'no'} health left). The ${targetEnemy.type} counter-attacked dealing ${enemyDamage} damage (player has ${gameState.player.health > 0 ? gameState.player.health : 'no'} health left). Focus on vivid action and consequences.`;  
                     const combatResult = await model.generateContent(combatPrompt);  
                     outcomeText = combatResult.response.text(); // Replace simple text with Gemini description  

              }  
           } else {  
               outcomeText = `There is no ${targetType} here to attack.`;  
           }  

     }  
     // ... add commands for 'take item', 'use item', 'inventory', 'stats' etc.  
     // For 'take item', update inventory and remove from room.  
     // For 'use item', check inventory, apply effect (e.g., heal), remove from inventory.  
     // For 'inventory'/'stats', describe player state (can use Gemini to make it flow nicely).  
     else {  
         // Unrecognized command - use Gemini to respond creatively?  
         const unrecognizedPrompt = `The player typed "${userMessage}" in a text RPG dungeon exploration. Given the current room description "${currentRoom.description}", how would a narrator respond that the command is not understood or relevant? Be slightly mysterious or sarcastic.`;  
         const unrecognizedResult = await model.generateContent(unrecognizedPrompt);  
         outcomeText = unrecognizedResult.response.text();  
     }  


    // 2. Combine generated text and state changes  
    // Send back a combined message. You could also send structured data if needed.  
    botReply = outcomeText + (stateChangeDescription ? '\n\n' + stateChangeDescription : '');  


    // --- End Game Logic ---  

    res.json({ reply: botReply });  

} catch (error) {  
    console.error('Error interacting with Gemini or processing game logic:', error);  
    // Send a user-friendly error message back to the frontend  
    res.status(500).json({ error: 'An error occurred in the game engine.' });  
}  
});

// Start the server
app.listen(port, () => {
console.log(`RPG server listening at http://localhost:${port}`);  
console.log(`Frontend available at http://localhost:${port}/index.html`);  
});