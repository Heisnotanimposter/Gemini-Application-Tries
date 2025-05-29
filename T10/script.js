document.addEventListener('DOMContentLoaded', () => {
    const palette = document.getElementById('palette');
    const canvasContainer = document.getElementById('canvas-container');
    const configPanel = document.getElementById('config-panel');

    let nodes = [];
    let edges = []; // Array to store edge data
    let selectedNode = null;
    let draggingNode = null;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    // --- Placeholder for Real-Time Data ---
    // In a real application, this data would be fetched from a backend API.
    // We'll use a simple object to store simulated data.
    let realTimeData = {
        'S&P 500': { value: 5200, timestamp: Date.now(), news: 'Market stable.' },
        'Interest Rate': { value: 5.5, timestamp: Date.now(), news: 'Fed holds rates.' },
        'Inflation Rate': { value: 3.4, timestamp: Date.now(), news: 'Inflation slightly down.' },
        // Add more simulated indicators as needed
    };

    // Function to simulate fetching real-time data (replace with actual backend call)
    async function fetchRealTimeData() {
        console.log('Fetching simulated real-time data...');
        // --- Replace this with an actual fetch call to your backend ---
        // Example:
        // try {
        //     const response = await fetch('/api/realtime-economic-data');
        //     if (!response.ok) {
        //         throw new Error(`HTTP error! status: ${response.status}`);
        //     }
        //     const data = await response.json();
        //     realTimeData = data; // Assuming backend returns data in the desired format
        //     console.log('Data fetched:', realTimeData);
        //     updateNodesWithRealTimeData(); // Update UI after fetching
        // } catch (error) {
        //     console.error('Error fetching real-time data:', error);
        // }
        // -----------------------------------------------------------

        // --- Simulation: Update dummy data periodically ---
         // In a real simulation, you'd slightly vary the values
         realTimeData['S&P 500'].value += (Math.random() - 0.5) * 10; // Small random change
         realTimeData['Interest Rate'].value += (Math.random() - 0.5) * 0.01;
         realTimeData['Inflation Rate'].value += (Math.random() - 0.5) * 0.005;
         realTimeData['S&P 500'].timestamp = Date.now();
         realTimeData['Interest Rate'].timestamp = Date.now();
         realTimeData['Inflation Rate'].timestamp = Date.now();

        console.log('Simulated data updated:', realTimeData);
        updateNodesWithRealTimeData(); // Update UI after simulating fetch
    }

    // Function to update Economic Indicator nodes with fetched data
    function updateNodesWithRealTimeData() {
        nodes.forEach(node => {
            if (node.type === 'economic_indicator' && node.config.indicatorName) {
                const indicatorName = node.config.indicatorName;
                const data = realTimeData[indicatorName];

                // Find the corresponding node element in the DOM
                const nodeElement = canvasContainer.querySelector(`.node[data-id="${node.id}"]`);

                if (nodeElement && data) {
                    // Update the node's displayed content with real-time value
                    nodeElement.innerHTML = `
                        <div>${getNodeLabel(node.type)}</div>
                        <small>${indicatorName}: ${data.value.toFixed(2)}</small>
                        <small>${new Date(data.timestamp).toLocaleTimeString()}</small>
                    `;
                     // Optional: Store the fetched value in the node's config for later use
                     node.config.currentValue = data.value;
                     node.config.lastUpdated = data.timestamp;
                } else if (nodeElement) {
                     // Handle case where data for the indicator is not found
                     nodeElement.innerHTML = `
                        <div>${getNodeLabel(node.type)}</div>
                        <small>${indicatorName}: N/A</small>
                    `;
                }
            }
        });
         // If a node is selected, re-render the config panel to show updated values
         if(selectedNode) {
             renderConfigPanel();
         }
    }


    // Helper function to generate unique IDs
    function generateId() {
        return Math.random().toString(36).substring(2, 15);
    }

    // --- Drag and Drop from Palette ---
    palette.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('palette-item')) {
            e.dataTransfer.setData('nodeType', e.target.dataset.type);
            // Optional: Set drag image
            // const img = new Image();
            // img.src = 'path/to/drag/image.png'; // Or create a dummy element
            // e.dataTransfer.setDragImage(img, 0, 0);
        }
    });

    canvasContainer.addEventListener('dragover', (e) => {
        e.preventDefault(); // Allow dropping
    });

    canvasContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        const nodeType = e.dataTransfer.getData('nodeType');
        if (!nodeType) return;

        const canvasRect = canvasContainer.getBoundingClientRect();
        const x = e.clientX - canvasRect.left;
        const y = e.clientY - canvasRect.top;

        createNode(nodeType, x, y);
    });

    // --- Node Creation and Management ---
    function createNode(type, x, y) {
        const nodeId = generateId();
        const newNode = {
            id: nodeId,
            type: type,
            x: x - 75, // Adjust position to center node on cursor (approx)
            y: y - 25, // Adjust position to center node on cursor (approx)
            config: {}, // Initialize empty config
        };
        nodes.push(newNode);
        renderCanvas(); // Re-render canvas (nodes and edges)

        // Select the newly created node
        selectNode(nodeId);

        // If the new node is an Economic Indicator, try to update its data immediately
        if (type === 'economic_indicator') {
             // Need to wait for the node to be added to the DOM before updating
             // A small timeout or checking DOM presence could work, but re-rendering canvas handles it.
             // After rendering, explicitly call update for this node type
             updateNodesWithRealTimeData();
        }
    }

     // Function to get node label based on type and config
    function getNodeContent(node) {
        let content = `<div>${getNodeLabel(node.type)}</div>`;
        let configInfo = '';

        switch (node.type) {
            case 'economic_indicator':
                // Display indicator name and potentially the last fetched value
                const indicatorName = node.config.indicatorName || 'Untitled';
                const currentValue = node.config.currentValue !== undefined ? node.config.currentValue.toFixed(2) : 'N/A';
                const lastUpdated = node.config.lastUpdated ? new Date(node.config.lastUpdated).toLocaleTimeString() : '';
                configInfo = `${indicatorName}: ${currentValue}`;
                if (lastUpdated) configInfo += `<br><small>${lastUpdated}</small>`; // Add timestamp if available
                break;
            case 'moving_average':
                configInfo = `Period: ${node.config.period || '?'}`;
                break;
            case 'conditional_logic':
                 configInfo = node.config.condition || 'If...';
                break;
            case 'arithmetic_operation':
                configInfo = node.config.operation || '+ - * /';
                break;
            case 'signal_action':
                 configInfo = node.config.actionType || 'Signal';
                break;
            case 'gemini_analysis':
                 configInfo = node.config.analysisType || 'Analyze'; // Show analysis type
                 // Could also show a snippet of the prompt or result here
                break;
            default:
                configInfo = '';
        }

        if (configInfo) {
            content += `<small>${configInfo}</small>`;
        }
        return content;
    }


    function getNodeLabel(type) {
        switch (type) {
            case 'economic_indicator': return 'Indicator';
            case 'moving_average': return 'MA';
            case 'conditional_logic': return 'If/Then';
            case 'arithmetic_operation': return 'Math';
            case 'signal_action': return 'Signal';
            case 'gemini_analysis': return 'Gemini';
            default: return 'Node';
        }
    }

    // --- Canvas Rendering (Nodes and Edges) ---
    function renderCanvas() {
        // Clear canvas before rendering
        canvasContainer.innerHTML = '';

        // Render Edges first (so nodes are on top)
        edges.forEach(edge => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);
            if (!sourceNode || !targetNode) return; // Don't render if nodes are missing

            const edgeElement = document.createElement('div');
            edgeElement.classList.add('edge');

            // Calculate center points of nodes (approximate)
            const sourceX = sourceNode.x + 75; // Assuming node width is ~150px / 2
            const sourceY = sourceNode.y + 25; // Assuming node height is ~50px / 2
            const targetX = targetNode.x + 75;
            const targetY = targetNode.y + 25;

            // Calculate distance and angle for the line
            const dx = targetX - sourceX;
            const dy = targetY - sourceY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;

            edgeElement.style.left = `${sourceX}px`;
            edgeElement.style.top = `${sourceY}px`;
            edgeElement.style.width = `${distance}px`;
            edgeElement.style.transform = `rotate(${angle}deg)`;

            canvasContainer.appendChild(edgeElement);
        });


        // Render Nodes
        nodes.forEach(node => {
            const nodeElement = document.createElement('div');
            nodeElement.classList.add('node');
            nodeElement.dataset.id = node.id;
            nodeElement.style.left = `${node.x}px`;
            nodeElement.style.top = `${node.y}px`;
            nodeElement.innerHTML = getNodeContent(node); // Set dynamic content

            // Add drag functionality to the node
            nodeElement.addEventListener('mousedown', handleNodeMouseDown);

            // Add click functionality to select the node
            nodeElement.addEventListener('click', (e) => {
                selectNode(node.id);
                e.stopPropagation(); // Prevent canvas click from deselecting
            });

            canvasContainer.appendChild(nodeElement);

            // Highlight selected node
            if (selectedNode && selectedNode.id === node.id) {
                nodeElement.classList.add('selected');
            }
        });
    }


    // --- Node Dragging on Canvas ---
    function handleNodeMouseDown(e) {
        if (!e.target.closest('.node')) return; // Ensure we click on the node or its content

        const nodeElement = e.target.closest('.node');
        draggingNode = nodes.find(node => node.id === nodeElement.dataset.id);
        if (!draggingNode) return;

        // Calculate offset from mouse pointer to node's top-left corner
        const nodeRect = nodeElement.getBoundingClientRect();
        dragOffsetX = e.clientX - nodeRect.left;
        dragOffsetY = e.clientY - nodeRect.top;

        // Add global listeners for dragging
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        // Select the node when dragging starts
        selectNode(draggingNode.id);

        e.stopPropagation(); // Prevent canvas click when dragging node
    }

    function handleMouseMove(e) {
        if (!draggingNode || !canvasContainer) return;

        const canvasRect = canvasContainer.getBoundingClientRect();

        // Calculate new position relative to the canvas container
        let newX = e.clientX - canvasRect.left - dragOffsetX;
        let newY = e.clientY - canvasRect.top - dragOffsetY;

        // Optional: Add bounds checking to prevent dragging outside canvas
        // newX = Math.max(0, newX);
        // newY = Math.max(0, newY);
        // const nodeElement = canvasContainer.querySelector(`.node[data-id="${draggingNode.id}"]`);
        // if (nodeElement) {
        //     newX = Math.min(newX, canvasRect.width - nodeElement.offsetWidth);
        //     newY = Math.min(newY, canvasRect.height - nodeElement.offsetHeight);
        // }


        // Update the node's position in the data array
        draggingNode.x = newX;
        draggingNode.y = newY;

        // Update the node's position in the DOM
        const nodeElement = canvasContainer.querySelector(`.node[data-id="${draggingNode.id}"]`);
        if (nodeElement) {
            nodeElement.style.left = `${draggingNode.x}px`;
            nodeElement.style.top = `${draggingNode.y}px`;
        }

        // Re-render edges if any exist (simple approach, could be optimized)
        if (edges.length > 0) {
             renderCanvas(); // Re-render everything to update edge positions
        }
    }

    function handleMouseUp() {
        draggingNode = null;
        // Remove global listeners
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }

    // --- Node Selection ---
    function selectNode(nodeId) {
        // Deselect previous node
        if (selectedNode) {
            const prevSelectedElement = canvasContainer.querySelector(`.node[data-id="${selectedNode.id}"]`);
            if (prevSelectedElement) {
                prevSelectedElement.classList.remove('selected');
            }
        }

        // Select new node
        selectedNode = nodes.find(node => node.id === nodeId) || null;

        // Highlight the new node
        if (selectedNode) {
            const selectedElement = canvasContainer.querySelector(`.node[data-id="${selectedNode.id}"]`);
            if (selectedElement) {
                selectedElement.classList.add('selected');
            }
        }

        // Update the configuration panel
        renderConfigPanel();
    }

    // Deselect node when clicking on the canvas background
    canvasContainer.addEventListener('click', (e) => {
        // Check if the click target is the canvas container itself, not a node
        if (e.target === canvasContainer) {
            selectNode(null);
        }
    });


    // --- Configuration Panel ---
    function renderConfigPanel() {
        configPanel.innerHTML = ''; // Clear current panel content

        const title = document.createElement('h3');
        title.textContent = 'Configuration';
        configPanel.appendChild(title);

        if (!selectedNode) {
            const message = document.createElement('p');
            message.textContent = 'Select a node to configure.';
            configPanel.appendChild(message);
            return;
        }

        const nodeTypeTitle = document.createElement('h3');
        nodeTypeTitle.textContent = `Configuration: ${getNodeLabel(selectedNode.type)}`;
        configPanel.appendChild(nodeTypeTitle);

        // Render configuration fields based on selected node type
        switch (selectedNode.type) {
            case 'economic_indicator':
                renderInputField('Indicator Name:', 'indicatorName', selectedNode.config.indicatorName || '');
                // Display current value if available
                if (selectedNode.config.currentValue !== undefined) {
                    const currentValueDiv = document.createElement('div');
                    currentValueDiv.innerHTML = `<label>Current Value:</label><p>${selectedNode.config.currentValue.toFixed(2)}</p>`;
                    configPanel.appendChild(currentValueDiv);
                }
                 if (selectedNode.config.lastUpdated) {
                    const lastUpdatedDiv = document.createElement('div');
                    lastUpdatedDiv.innerHTML = `<label>Last Updated:</label><p>${new Date(selectedNode.config.lastUpdated).toLocaleTimeString()}</p>`;
                    configPanel.appendChild(lastUpdatedDiv);
                 }
                break;
            case 'moving_average':
                renderInputField('Period:', 'period', selectedNode.config.period || 10, 'number');
                break;
            case 'conditional_logic':
                 renderInputField('Condition:', 'condition', selectedNode.config.condition || '', 'text', 'e.g., > 100');
                break;
            case 'arithmetic_operation':
                renderSelectField('Operation:', 'operation', selectedNode.config.operation || '+', ['+', '-', '*', '/']);
                break;
            case 'signal_action':
                 renderSelectField('Action Type:', 'actionType', selectedNode.config.actionType || 'Signal Buy', ['Signal Buy', 'Signal Sell', 'Alert', 'Log']);
                break;
            case 'gemini_analysis':
                 renderSelectField('Analysis Type:', 'analysisType', selectedNode.config.analysisType || 'Analyze Data', ['Analyze Data', 'Summarize News', 'Sentiment Analysis']);
                 renderTextareaField('Input/Prompt:', 'prompt', selectedNode.config.prompt || '', 'Enter data or prompt for Gemini');
                 // Could display Gemini result here if stored in config
                break;
            default:
                const noConfig = document.createElement('p');
                noConfig.textContent = 'No configuration options for this node type.';
                configPanel.appendChild(noConfig);
                break;
        }

        // Add a delete button for the selected node
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete Node';
        deleteButton.style.marginTop = '20px';
        deleteButton.addEventListener('click', handleDeleteNode);
        configPanel.appendChild(deleteButton);
    }

    // Helper function to create input fields
    function renderInputField(labelText, configKey, value, type = 'text', placeholder = '') {
        const div = document.createElement('div');
        const label = document.createElement('label');
        label.textContent = labelText;
        const input = document.createElement('input');
        input.type = type;
        input.value = value;
        input.placeholder = placeholder;

        input.addEventListener('input', (e) => {
            // Update the config in the selected node's data
            if (selectedNode) {
                 selectedNode.config[configKey] = type === 'number' ? parseFloat(e.target.value) : e.target.value; // Use parseFloat for numbers
                 // Re-render the canvas to show updated label if applicable
                 renderCanvas();
                 // Re-render config panel to show updated values immediately if needed
                 renderConfigPanel();
            }
        });

        div.appendChild(label);
        div.appendChild(input);
        configPanel.appendChild(div);
    }

     // Helper function to create select fields
    function renderSelectField(labelText, configKey, value, options) {
        const div = document.createElement('div');
        const label = document.createElement('label');
        label.textContent = labelText;
        const select = document.createElement('select');
        select.value = value;

        options.forEach(optionValue => {
            const option = document.createElement('option');
            option.value = optionValue;
            option.textContent = optionValue;
            select.appendChild(option);
        });


        select.addEventListener('change', (e) => {
            // Update the config in the selected node's data
            if (selectedNode) {
                 selectedNode.config[configKey] = e.target.value;
                 // Re-render the canvas to show updated label if applicable
                 renderCanvas();
                 // Re-render config panel to show updated values immediately if needed
                 renderConfigPanel();
            }
        });

        div.appendChild(label);
        div.appendChild(select);
        configPanel.appendChild(div);
    }

     // Helper function to create textarea fields
    function renderTextareaField(labelText, configKey, value, placeholder = '') {
        const div = document.createElement('div');
        const label = document.createElement('label');
        label.textContent = labelText;
        const textarea = document.createElement('textarea');
        textarea.value = value;
        textarea.placeholder = placeholder;
        textarea.rows = 4; // Set a default number of rows
        textarea.style.width = '100%'; // Ensure it fills the container
        textarea.style.marginTop = '5px';

        textarea.addEventListener('input', (e) => {
            // Update the config in the selected node's data
            if (selectedNode) {
                 selectedNode.config[configKey] = e.target.value;
            }
        });

        div.appendChild(label);
        div.appendChild(textarea);
        configPanel.appendChild(div);
    }

    // --- Node and Edge Deletion ---
    function handleDeleteNode() {
        if (!selectedNode) return;

        // Remove the selected node from the nodes array
        nodes = nodes.filter(node => node.id !== selectedNode.id);

        // Remove any edges connected to the deleted node
        edges = edges.filter(edge => edge.source !== selectedNode.id && edge.target !== selectedNode.id);

        // Deselect the node and re-render
        selectNode(null);
        renderCanvas();
    }


    // --- Placeholder for Edge Creation (Manual or UI based) ---
    // Implementing interactive edge drawing (click-and-drag between nodes)
    // is complex in plain JS. This is left as a future enhancement.
    // You could manually add edge data to the `edges` array for testing rendering.
    // Example: addEdge('nodeId1', 'nodeId2');
    function addEdge(sourceId, targetId) {
         // Check if nodes exist and edge doesn't already exist
         const sourceNode = nodes.find(n => n.id === sourceId);
         const targetNode = nodes.find(n => n.id === targetId);
         const edgeExists = edges.some(e => e.source === sourceId && e.target === targetId);

         if (sourceNode && targetNode && !edgeExists) {
             edges.push({ id: generateId(), source: sourceId, target: targetId });
             renderCanvas(); // Re-render to show the new edge
             console.log(`Added edge from ${sourceId} to ${targetId}`);
         } else {
             console.warn(`Could not add edge: Nodes not found or edge already exists.`);
         }
    }


    // --- Top Bar Button Placeholders ---
    document.getElementById('save-btn').addEventListener('click', () => {
        console.log('Save Strategy:', { nodes, edges });
        // Basic Save to localStorage
        try {
            localStorage.setItem('strategyNodes', JSON.stringify(nodes));
            localStorage.setItem('strategyEdges', JSON.stringify(edges));
            alert('Strategy saved to local storage!');
        } catch (e) {
            alert('Failed to save strategy.');
            console.error('Save failed:', e);
        }
    });

    document.getElementById('load-btn').addEventListener('click', () => {
        console.log('Load Strategy');
         // Basic Load from localStorage
        try {
            const savedNodes = localStorage.getItem('strategyNodes');
            const savedEdges = localStorage.getItem('strategyEdges');
            if (savedNodes && savedEdges) {
                nodes = JSON.parse(savedNodes);
                edges = JSON.parse(savedEdges);
                selectedNode = null; // Deselect any node after loading
                renderCanvas();
                renderConfigPanel(); // Update config panel after loading
                alert('Strategy loaded from local storage!');
            } else {
                 alert('No saved strategy found in local storage.');
            }
        } catch (e) {
            alert('Failed to load strategy.');
            console.error('Load failed:', e);
        }
    });

    document.getElementById('validate-btn').addEventListener('click', () => {
        console.log('Validate Strategy');
         alert('Validation functionality not implemented.');
    });

    // --- Add a button to trigger data fetch (Simulation) ---
    const fetchDataButton = document.createElement('button');
    fetchDataButton.textContent = 'Fetch Real-time Data (Sim)';
    fetchDataButton.addEventListener('click', fetchRealTimeData);
    document.querySelector('.top-bar').appendChild(fetchDataButton); // Add to top bar


    // --- Optional: Simulate periodic data updates ---
    // setInterval(fetchRealTimeData, 5000); // Fetch data every 5 seconds (for simulation)


    // Initial render of canvas and config panel
    renderCanvas();
    renderConfigPanel();

    // Optional: Load strategy on initial page load
    // document.getElementById('load-btn').click(); // Uncomment to auto-load on startup

});

