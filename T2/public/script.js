const chatBox = document.getElementById('chat-box');  
const userInput = document.getElementById('user-input');  
const sendButton = document.getElementById('send-button');  

// Function to add a message to the chat box  
function appendMessage(sender, text) {  
    const messageElement = document.createElement('div');  
    messageElement.classList.add('message');  
    messageElement.classList.add(sender + '-message'); // 'user-message' or 'bot-message'  
    messageElement.innerHTML = `<p>${text}</p>`; // Using innerHTML might be risky if text contains HTML, but okay for simple chat  

    chatBox.appendChild(messageElement);  
    // Scroll to the bottom  
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

    // Add a temporary loading indicator (optional)  
    appendMessage('bot', '...'); // Simple placeholder  

    try {  
        // Send message to the backend API  
        const response = await fetch('/chat', {  
            method: 'POST',  
            headers: {  
                'Content-Type': 'application/json'  
            },  
            body: JSON.stringify({ message: message })  
        });  

        // Remove loading indicator  
        chatBox.lastChild.remove();  

        if (!response.ok) {  
            const errorData = await response.json();  
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);  
        }  

        const data = await response.json();  
        const botReply = data.reply;  

        // Display bot's reply  
        appendMessage('bot', botReply);  

    } catch (error) {  
        console.error('Error sending message:', error);  
        // Display error message in chat box  
        appendMessage('bot', 'Error: Could not get response from AI.');  
    }  
}  

// Event listeners  
sendButton.addEventListener('click', sendMessage);  

userInput.addEventListener('keypress', function(event) {  
    // Check if the pressed key was Enter (key code 13)  
    if (event.key === 'Enter') {  
        event.preventDefault(); // Prevent default form submission/newline  
        sendMessage();  
    }  
});  