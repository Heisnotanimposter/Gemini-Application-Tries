document.addEventListener('DOMContentLoaded', () => {
    const taskDescriptionInput = document.getElementById('taskDescription') as HTMLTextAreaElement;
    const purposeButtons = document.querySelectorAll('.purpose-button') as NodeListOf<HTMLButtonElement>;
    const submitTaskButton = document.getElementById('submitTask') as HTMLButtonElement;
    const resultDisplay = document.getElementById('resultDisplay') as HTMLPreElement;
    const downloadResultBtn = document.getElementById('downloadResultBtn') as HTMLButtonElement; // Get reference to the new button

    let selectedPurpose: string | null = null;

    // Function to set download button state
    const setDownloadButtonState = (visible: boolean, enabled: boolean = true) => {
        downloadResultBtn.style.display = visible ? 'block' : 'none';
        downloadResultBtn.disabled = !enabled;
    };

    // Initially hide the download button
    setDownloadButtonState(false);

    // Event listener for purpose buttons
    purposeButtons.forEach(button => {
        button.addEventListener('click', () => {
            purposeButtons.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
            selectedPurpose = button.dataset.purpose || null;

            if (selectedPurpose === 'Other') {
                taskDescriptionInput.focus();
                taskDescriptionInput.placeholder = "Specify your custom task here...";
            } else {
                taskDescriptionInput.placeholder = "Enter a detailed description of your MCP task here...";
            }
        });
    });

    // Event listener for submit button
    submitTaskButton.addEventListener('click', async () => {
        const task = taskDescriptionInput.value.trim();

        if (!task) {
            resultDisplay.textContent = 'Please enter a task description.';
            resultDisplay.style.color = 'red';
            setDownloadButtonState(false); // Hide download button on validation error
            return;
        }

        const finalPurpose = selectedPurpose || 'Custom Task';

        const payload = {
            task: task,
            purpose: finalPurpose,
        };

        resultDisplay.textContent = 'Processing...';
        resultDisplay.style.color = '#555';
        resultDisplay.style.backgroundColor = '#e0f7fa';
        setDownloadButtonState(false); // Hide download button while processing

        try {
            const backendUrl = 'http://localhost:3000'; // Ensure this matches your backend's port
            const response = await fetch(`${backendUrl}/api/mcp-request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Server error: Invalid JSON response' }));
                throw new Error(`HTTP error! Status: ${response.status}, Details: ${errorData.message || JSON.stringify(errorData)}`);
            }

            const data = await response.json();

            if (data.result) {
                resultDisplay.textContent = data.result;
                resultDisplay.style.color = '#28a745';
                resultDisplay.style.backgroundColor = '#e6ffed';
                setDownloadButtonState(true); // Show and enable download button on success
            } else if (data.error) {
                resultDisplay.textContent = `Error from backend: ${data.error}`;
                resultDisplay.style.color = 'red';
                resultDisplay.style.backgroundColor = '#ffe6e6';
                setDownloadButtonState(false); // Hide download button on backend error
            } else {
                resultDisplay.textContent = 'Received an unexpected response format from the backend.';
                resultDisplay.style.color = 'orange';
                resultDisplay.style.backgroundColor = '#fff0e6';
                setDownloadButtonState(false); // Hide download button on unexpected format
            }

        } catch (error: any) {
            resultDisplay.textContent = `Failed to send request or receive valid response: ${error.message || 'Unknown network error'}`;
            resultDisplay.style.color = 'red';
            resultDisplay.style.backgroundColor = '#ffe6e6';
            setDownloadButtonState(false); // Hide download button on fetch error
            console.error('Fetch error:', error);
        } finally {
            setTimeout(() => {
                resultDisplay.style.backgroundColor = '#e9ecef';
            }, 500);
        }
    });

    // Event listener for the download button
    downloadResultBtn.addEventListener('click', () => {
        const resultText = resultDisplay.textContent;
        if (!resultText || resultText.trim() === '' || resultText.trim() === 'Results will appear here...') {
            // Optionally, show a temporary message if there's nothing to download
            console.warn('No result to download.');
            return;
        }

        // Create a Blob from the text content
        const blob = new Blob([resultText], { type: 'text/plain;charset=utf-8' });

        // Create a temporary URL for the blob
        const url = URL.createObjectURL(blob);

        // Create a temporary <a> element
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mcp_result.txt'; // Desired filename

        // Append to body and programmatically click it
        document.body.appendChild(a);
        a.click();

        // Clean up: remove the temporary <a> element and revoke the URL
        document.body.removeChild(a);
        URL.revokeObjectURL(url); // Release the object URL
    });
});