// script.js  

// *** MODEL (Remains the same for task logic) ***  
// This still manages the task data in the browser's memory.  
const taskModel = {  
    tasks: [],  
    idCounter: 0,  

    addTask(description) {  
        const newTask = {  
            id: this.idCounter++,  
            description: description,  
            completed: false  
        };  
        this.tasks.push(newTask);  
        console.log('Model: Added task', newTask);  
        return newTask;  
    },  

    toggleComplete(taskId) {  
        const task = this.tasks.find(t => t.id === taskId);  
        if (task) {  
            task.completed = !task.completed;  
            console.log('Model: Toggled task', task);  
            return task;  
        }  
        return null; // Task not found  
    },  

    deleteTask(taskId) {  
        const initialLength = this.tasks.length;  
        this.tasks = this.tasks.filter(t => t.id !== taskId);  
        console.log(`Model: Deleted task with ID ${taskId}. ${initialLength - this.tasks.length} tasks removed.`);  
    },  

    getTasks() {  
        // Return a copy to prevent external modification  
        return [...this.tasks];  
    }  
};  


// *** PROTOCOL (Add chat method) ***  
// This layer abstracts the data source (currently Model, will include Service).  
const taskProtocol = {  
    // --- Existing Task Methods (now calling Model) ---  
    async addTask(description) {  
        try {  
            const newTask = taskModel.addTask(description);  
            return newTask;  
        } catch (error) {  
            console.error("Protocol Error adding task:", error);  
            throw error;  
        }  
    },  

    async toggleComplete(taskId) {  
        try {  
            const task = taskModel.toggleComplete(taskId);  
            if (!task) throw new Error(`Task with ID ${taskId} not found.`);  
            return task;  
        } catch (error) {  
            console.error("Protocol Error toggling task:", error);  
            throw error;  
        }  
    },  

    async deleteTask(taskId) {  
        try {  
            taskModel.deleteTask(taskId);  
        } catch (error) {  
            console.error("Protocol Error deleting task:", error);  
            throw error;  
        }  
    },  

    async getTasks() {  
        try {  
            // For initial load, let's simulate fetching from GeminiService  
            // In a real app, you'd decide if tasks live in Model or Service.  
            // Let's keep them in Model for now but show how Service *could* be used.  
             console.warn("Protocol: getTasks is still using local Model. Integrate GeminiService here later if needed.");  
             return taskModel.getTasks();  

             // Example of using service instead (if service managed tasks):  
             /*  
             const tasksFromService = await geminiService.getTasks();  
             // Optionally update local model if needed for offline access etc.  
             // this.tasks = tasksFromService;  
             return tasksFromService;  
             */  

        } catch (error) {  
            console.error("Protocol Error getting tasks:", error);  
            throw error;  
        }  
    },  

    // --- New Chat Method ---  
    async sendChatMessage(message) {  
        try {  
            console.log("Protocol: Sending message to GeminiService...");  
            // Call the Gemini Service function to get the AI response  
            const aiResponseText = await geminiService.sendMessageToAI(message);  
            console.log("Protocol: Received response from GeminiService.");  
            return aiResponseText;  
        } catch (error) {  
            console.error("Protocol Error sending chat message:", error);  
            // Decide how to handle this - maybe return a default error message?  
            return "Sorry, I couldn't connect to the AI right now."; // Friendly error  
        }  
    }  
};  


// *** VIEW (Remains the same for task rendering) ***  
// This handles the direct DOM manipulation for the task list.  
const taskView = {  
    taskList: document.getElementById('taskList'),  
    newTaskInput: document.getElementById('newTaskInput'),  
    addTaskButton: document.getElementById('addTaskButton'),  

    // --- New Chat Elements ---  
    chatBox: document.getElementById('chatBox'),  
    chatInput: document.getElementById('chatInput'),  
    sendChatMessageButton: document.getElementById('sendChatMessageButton'),  


    renderAllTasks: function(tasks) {  
        this.taskList.innerHTML = ''; // Clear current list  
        tasks.forEach(task => {  
            const listItem = document.createElement('li');  
            listItem.dataset.taskId = task.id;  
            if (task.completed) {  
                listItem.classList.add('completed');  
            }  

            const descriptionSpan = document.createElement('span');  
            descriptionSpan.textContent = task.description;  
            listItem.appendChild(descriptionSpan);  

            const completeButton = document.createElement('button');  
            completeButton.textContent = task.completed ? 'Undo' : 'Complete';  
            listItem.appendChild(completeButton);  

            const deleteButton = document.createElement('button');  
            deleteButton.textContent = 'Delete';  
            listItem.appendChild(deleteButton);  

            this.taskList.appendChild(listItem);  
        });  
    },  

    // --- New Chat Rendering Method ---  
    displayMessage: function(message, sender) {  
        const messageElement = document.createElement('div');  
        messageElement.classList.add('message');  
        messageElement.classList.add(sender === 'user' ? 'user-message' : 'bot-message'); // Add sender class  
        messageElement.textContent = message;  

        this.chatBox.appendChild(messageElement);  

        // Auto-scroll to the latest message  
        this.chatBox.scrollTop = this.chatBox.scrollHeight;  
    }  
};  


// *** CONTEXT (Add chat handling logic) ***  
// This connects Model, Protocol, and View and handles user interactions.  
const taskContext = {  
    // Keep references, although we'll primarily use view now  
    model: taskModel,  
    protocol: taskProtocol,  
    view: taskView, // Use the combined view object  

    init: function() {  
        // Initialize the view elements  
        // (They are already referenced in taskView, but we might attach listeners here)  

        // --- Task Event Listeners ---  
        this.view.addTaskButton.addEventListener('click', () => {  
            const description = this.view.newTaskInput.value.trim();  
            if (description) {  
                this.addTask(description);  
                this.view.newTaskInput.value = ''; // Clear input after adding  
            }  
        });  

        this.view.taskList.addEventListener('click', (event) => {  
            const target = event.target;  
            // Check if the clicked element is a button AND is inside an LI with a data-task-id  
            if (target.tagName === 'BUTTON' && target.closest('li') && target.closest('li').dataset.taskId) {  
                const listItem = target.closest('li');  
                const taskId = Number(listItem.dataset.taskId);  

                if (target.textContent === 'Complete' || target.textContent === 'Undo') {  
                    this.toggleTask(taskId);  
                } else if (target.textContent === 'Delete') {  
                    this.deleteTask(taskId);  
                }  
            }  
        });  

        // --- Chat Event Listeners ---  
        this.view.sendChatMessageButton.addEventListener('click', () => {  
            this.sendChatMessage();  
        });  

        // Optional: Send message on Enter key press in the chat input  
        this.view.chatInput.addEventListener('keypress', (event) => {  
            if (event.key === 'Enter') {  
                event.preventDefault(); // Prevent default form submission behavior if applicable  
                this.sendChatMessage();  
            }  
        });  


        // --- Initial Load ---  
        this.loadTasks(); // Load initial tasks  
        // Initial welcome message is already in the HTML structure, no need to add here  
    },  

    // --- Existing Task Methods (now calling Protocol) ---  
    async loadTasks() {  
        try {  
            const tasks = await this.protocol.getTasks();  
            this.view.renderAllTasks(tasks);  
        } catch (error) {  
            console.error("Context Error loading tasks:", error);  
            this.view.displayMessage("Error loading tasks.", "bot"); // Use chat box for errors? Or a dedicated error area.  
             // alert("Failed to load tasks."); // Or use a dedicated error message area  
        }  
    },  

    async addTask(description) {  
        try {  
            // Add task via protocol (which uses Model for now)  
            await this.protocol.addTask(description);  
            // Re-render the list by getting the current state from the protocol/model  
            const currentTasks = await this.protocol.getTasks(); // Get updated list  
            this.view.renderAllTasks(currentTasks);  

             // Optional: Send a message to AI about the new task?  
             // this.protocol.sendChatMessage(`User added task: "${description}"`);  

        } catch (error) {  
            console.error("Context Error adding task:", error);  
             this.view.displayMessage("Failed to add task.", "bot");  
            // alert("Failed to add task.");  
        }  
    },  

    async toggleTask(taskId) {  
        try {  
            // Toggle task via protocol (which uses Model for now)  
            await this.protocol.toggleComplete(taskId);  
            // Re-render the list  
             const currentTasks = await this.protocol.getTasks(); // Get updated list  
            this.view.renderAllTasks(currentTasks);  
             // Optional: Send a message to AI?  
             // const task = this.model.getTasks().find(t => t.id === taskId); // Get the task to know its state  
             // this.protocol.sendChatMessage(`User toggled task "${task?.description}" to ${task?.completed ? 'completed' : 'incomplete'}.`);  

        } catch (error) {  
            console.error("Context Error toggling task:", error);  
            this.view.displayMessage("Failed to toggle task.", "bot");  
            // alert("Failed to toggle task.");  
        }  
    },  

    async deleteTask(taskId) {  
        try {  
             // Delete task via protocol (which uses Model for now)  
            await this.protocol.deleteTask(taskId);  
            // Re-render the list  
             const currentTasks = await this.protocol.getTasks(); // Get updated list  
            this.view.renderAllTasks(currentTasks);  
            // Optional: Send a message to AI?  
            // this.protocol.sendChatMessage(`User deleted task with ID ${taskId}.`);  

        } catch (error) {  
            console.error("Context Error deleting task:", error);  
            this.view.displayMessage("Failed to delete task.", "bot");  
            // alert("Failed to delete task.");  
        }  
    },  

    // --- New Chat Method ---  
    async sendChatMessage() {  
        const message = this.view.chatInput.value.trim();  
        if (message) {  
            // Display the user's message immediately  
            this.view.displayMessage(message, 'user');  
            // Clear the input field  
            this.view.chatInput.value = '';  

            try {  
                // Send the message to the AI via the protocol  
                const aiResponse = await this.protocol.sendChatMessage(message);  
                // Display the AI's response  
                this.view.displayMessage(aiResponse, 'bot');  
            } catch (error) {  
                console.error("Context Error sending chat message:", error);  
                // Display a user-friendly error message in the chat box  
                this.view.displayMessage("Sorry, I couldn't process that message right now.", "bot");  
            }  
        }  
         // If message is empty, do nothing  
    }  
};  

// *** INITIALIZATION ***  
// When the DOM is ready, initialize the context which sets up listeners etc.  
document.addEventListener('DOMContentLoaded', () => {  
    taskContext.init();  
    console.log("Application initialized.");  
});  

