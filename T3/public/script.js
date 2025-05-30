const chatBox = document.getElementById('chat-box');  
const userInput = document.getElementById('user-input');  
const sendButton = document.getElementById('send-button');  
const typingIndicator = document.getElementById('typing-indicator'); // Get typing indicator element  

// Function to add a message to the chat box  
function appendMessage(sender, text, isError = false) {  
    const messageElement = document.createElement('div');  
    messageElement.classList.add('message');  
    messageElement.classList.add(sender + '-message'); // 'user-message' or 'bot-message'  
    if (isError) {  
        messageElement.classList.add('error'); // Add error class for styling  
    }  

    // Create avatar element  
    const avatarElement = document.createElement('div');  
    avatarElement.classList.add('avatar');  
    avatarElement.classList.add(sender + '-avatar');  
    // Optional: Add initials or simple icon based on sender  
    avatarElement.textContent = sender === 'user' ? 'U' : 'AI';  


    // Create message content element  
    const contentElement = document.createElement('div');  
    contentElement.classList.add('message-content');  

    // Basic Markdown to HTML conversion (simplified)  
    // For full markdown support, use a library like 'marked.js'  
    let processedText = text;  
    processedText = processedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); // Bold  
    processedText = processedText.replace(/\*(.*?)\*/g, '<em>$1</em>');      // Italic (simple)  
    processedText = processedText.replace(/_(.*?)_/g, '<em>$1</em>');      // Italic (simple)  
    // Add more complex markdown rules here if needed  

    // Using innerHTML is generally safe if input is controlled,  
    // but for potentially untrusted input from a backend,  
    // more robust sanitization or a dedicated Markdown parser is recommended.  
    contentElement.innerHTML = `<p>${processedText}</p>`;  

    // Create timestamp element  
    const timestampElement = document.createElement('span');  
    timestampElement.classList.add('timestamp');  
    timestampElement.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // Format time  


    // Append avatar and content based on sender  
    if (sender === 'user') {  
        contentElement.appendChild(timestampElement); // Timestamp usually inside content  
        messageElement.appendChild(contentElement);  
        messageElement.appendChild(avatarElement); // Avatar on the right for user  
    } else { // bot  
        contentElement.appendChild(timestampElement); // Timestamp usually inside content  
        messageElement.appendChild(avatarElement); // Avatar on the left for bot  
        messageElement.appendChild(contentElement);  
    }  


    // Append the message element to the chat box before the typing indicator  
    chatBox.insertBefore(messageElement, typingIndicator);  


    // Scroll to the bottom with smooth behavior (handled by CSS scroll-behavior: smooth)  
    chatBox.scrollTop = chatBox.scrollHeight;  
}  

// Function to send message to backend  
async function sendMessage() {  
    const message = userInput.value.trim();  

    if (message === '') {  
        return; // Don't send empty messages  
    }  

    // Display user message immediately  
    appendMessage('user', message);  
    userInput.value = ''; // Clear input field  
    userInput.style.height = 'auto'; // Reset textarea height  


    // Disable input and button  
    userInput.disabled = true;  
    sendButton.disabled = true;  

    // Show typing indicator  
    typingIndicator.style.display = 'flex'; // Use flex because the message uses flex  


    try {  
        // Send message to the backend API  
        const response = await fetch('/chat', {  
            method: 'POST',  
            headers: {  
                'Content-Type': 'application/json'  
            },  
            body: JSON.stringify({ message: message })  
        });  

        // Hide typing indicator *before* processing response  
        typingIndicator.style.display = 'none';  


        if (!response.ok) {  
            const errorData = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` })); // Try parsing error, fall back if fails  
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);  
        }  

        const data = await response.json();  
        const botReply = data.reply || "No reply received."; // Handle case where reply is missing  


        // Display bot's reply  
        appendMessage('bot', botReply);  

    } catch (error) {  
        console.error('Error sending message:', error);  
        // Hide typing indicator if an error occurred before hiding it  
        typingIndicator.style.display = 'none';  
        // Display error message in chat box, styled as an error  
        appendMessage('bot', 'Error: Could not get response from AI.', true); // Pass true for isError  
    } finally {  
        // Re-enable input and button regardless of success or failure  
        userInput.disabled = false;  
        sendButton.disabled = false;  
        userInput.focus(); // Put focus back on the input field  
    }  
}  

// Event listeners  

// Send button click  
sendButton.addEventListener('click', sendMessage);  

// Enter key press listener for textarea  
userInput.addEventListener('keypress', function(event) {  
    // Check if the pressed key was Enter (key code 13)  
    // AND NOT Shift + Enter (which is for a newline)  
    if (event.key === 'Enter' && !event.shiftKey) {  
        event.preventDefault(); // Prevent default form submission/newline  
        sendMessage();  
    }  
    // Shift + Enter will just add a newline character in the textarea  
});  

// Auto-resize textarea based on content  
userInput.addEventListener('input', function() {  
    this.style.height = 'auto'; // Reset height  
    this.style.height = (this.scrollHeight) + 'px'; // Set to scroll height  
});  


// Initial welcome message (already in HTML, this ensures it's visible on load if needed)  
// appendMessage('bot', 'Hello! I\'m your Gemini-powered chatbot. How can I help you today?'); // Uncomment if you want to add dynamically instead of in HTML  

// Focus input on page load  
window.onload = () => {  
    userInput.focus();  
    // Adjust initial textarea height  
    userInput.style.height = 'auto';  
    userInput.style.height = (userInput.scrollHeight) + 'px';  

    // Send a special command to the backend to get the initial game state/description  
    // You'll need to handle this '/start' command specifically in server.js  
    sendMessageCommand('/start'); // Use a helper function to avoid UI side effects  
};  

// Create a helper function to send a command without adding it to the chat history as user input  
async function sendMessageCommand(command) {  
     // Disable input and button (optional for initial command)  
     userInput.disabled = true;  
     sendButton.disabled = true;  
     typingIndicator.style.display = 'flex';  

     try {  
         const response = await fetch('/chat', { // Still use the /chat endpoint  
             method: 'POST',  
             headers: { 'Content-Type': 'application/json' },  
             body: JSON.stringify({ message: command }) // Send the special command  
         });  

         typingIndicator.style.display = 'none';  

         if (!response.ok) {  
             const errorData = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }));  
             throw new Error(errorData.error || `HTTP error! status: ${response.status}`);  
         }  

         const data = await response.json();  
         const botReply = data.reply || "No initial description received.";  

         // Display the initial description as a bot message  
         appendMessage('bot', botReply);  

     } catch (error) {  
         console.error('Error fetching initial game state:', error);  
         typingIndicator.style.display = 'none';  
         appendMessage('bot', 'Error: Could not start game.', true);  
     } finally {  
         userInput.disabled = false; // Re-enable  
         sendButton.disabled = false; // Re-enable  
         userInput.focus(); // Focus input  
     }  
}  

// Modify the main sendMessage function slightly to NOT clear input/disable  
// if it's called by sendMessageCommand (or just ensure sendMessageCommand  
// handles its own state changes like disabling/enabling)  
// A simpler approach is just to let sendMessage handle it all, and clear/disable/enable  
// even for the initial command, it just means the input briefly disables on load.  
// Let's stick to modifying sendMessageCommand specifically as shown above.  
// Then, update your main sendMessage function to call this helper if it's the start command,  
// or proceed as usual otherwise.  

// OR, better yet, just modify the backend's POST /chat to check if it's the *first* request  
// and if so, send the initial description before processing the command.  
// Let's assume the backend handles the initial description on the first /chat call containing '/start'  
// or you can just have the backend *always* describe the current room state after processing any valid command.  
// The latter is simpler: Every turn, process command -> update state -> describe resulting state -> send text.  

// Sticking to the simpler backend approach: Remove the sendMessageCommand helper  
// and revert window.onload to just focus & resize. The backend will handle  
// describing the state after every action. The initial state can be sent  
// as the response to the very first user command (even if it's just 'look').  

// Revised window.onload (back to original simplified version):  
 window.onload = () => {  
     userInput.focus();  
     // Adjust initial textarea height  
     userInput.style.height = 'auto';  
     userInput.style.height = (userInput.scrollHeight) + 'px';  
     // Initial message is already in HTML  
 };  
 // Now, in the server.js POST /chat, make sure it describes the state  
 // *after* processing any valid command or on 'look'.  
 // For the very first turn, the player might type 'look' or 'move north',  
 // and the backend will describe the starting room or the next room.  
