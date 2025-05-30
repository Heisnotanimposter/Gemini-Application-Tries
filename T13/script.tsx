import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';

const App = () => {
    const [sequence, setSequence] = useState<string>("");
    const [geminiOutput, setGeminiOutput] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);

    const handleSequenceChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setSequence(event.target.value);
    };

    const handleSubmit = async () => {
        setLoading(true);
        setGeminiOutput("Processing...");

        try {
            const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // Access API Key

            if (!GEMINI_API_KEY) {
                throw new Error("GEMINI_API_KEY not found in .env file");
            }

            // Gemini API call for sequence validation
            const validationResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: `Is this a valid protein sequence: ${sequence}? Explain any errors concisely.` }]
                    }]
                }),
            });

            const validationData = await validationResponse.json();
            const validationText = validationData?.candidates?.[0]?.content?.parts?.[0]?.text || "Error validating sequence.";

            // Simulated AlphaFold Output
            const simulatedAlphaFoldOutput = `
                Simulated pLDDT scores: High confidence in core regions.  Low confidence in loop regions.
                Predicted secondary structure:  Alpha helices and beta sheets present.
            `;

            // Gemini API call to explain AlphaFold Output
            const explanationResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: `Explain this simulated AlphaFold output for a beginner: ${simulatedAlphaFoldOutput}` }]
                    }]
                }),
            });

            const explanationData = await explanationResponse.json();
            const explanationText = explanationData?.candidates?.[0]?.content?.parts?.[0]?.text || "Error explaining output.";

            setGeminiOutput(`Sequence Validation:\n${validationText}\n\nAlphaFold Explanation:\n${explanationText}`);

        } catch (error) {
            console.error("Error:", error);
            setGeminiOutput("An error occurred while processing your request.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <h1>Simplified AlphaFold Explorer</h1>
            <textarea value={sequence} onChange={handleSequenceChange} placeholder="Enter protein sequence"></textarea>
            <br />
            <button onClick={handleSubmit} disabled={loading}>
                {loading ? "Processing..." : "Submit"}
            </button>
            <div id="output">{geminiOutput}</div>
        </>
    );
};

const root = ReactDOM.createRoot(document.getElementById('app'));
root.render(<App />);