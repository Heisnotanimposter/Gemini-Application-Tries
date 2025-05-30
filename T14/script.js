var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
document.addEventListener('DOMContentLoaded', function () {
    var taskDescriptionInput = document.getElementById('taskDescription');
    var purposeButtons = document.querySelectorAll('.purpose-button');
    var submitTaskButton = document.getElementById('submitTask');
    var resultDisplay = document.getElementById('resultDisplay');
    var downloadResultBtn = document.getElementById('downloadResultBtn'); // Get reference to the new button
    var selectedPurpose = null;
    // Function to set download button state
    var setDownloadButtonState = function (visible, enabled) {
        if (enabled === void 0) { enabled = true; }
        downloadResultBtn.style.display = visible ? 'block' : 'none';
        downloadResultBtn.disabled = !enabled;
    };
    // Initially hide the download button
    setDownloadButtonState(false);
    // Event listener for purpose buttons
    purposeButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            purposeButtons.forEach(function (btn) { return btn.classList.remove('selected'); });
            button.classList.add('selected');
            selectedPurpose = button.dataset.purpose || null;
            if (selectedPurpose === 'Other') {
                taskDescriptionInput.focus();
                taskDescriptionInput.placeholder = "Specify your custom task here...";
            }
            else {
                taskDescriptionInput.placeholder = "Enter a detailed description of your MCP task here...";
            }
        });
    });
    // Event listener for submit button
    submitTaskButton.addEventListener('click', function () { return __awaiter(_this, void 0, void 0, function () {
        var task, finalPurpose, payload, backendUrl, response, errorData, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    task = taskDescriptionInput.value.trim();
                    if (!task) {
                        resultDisplay.textContent = 'Please enter a task description.';
                        resultDisplay.style.color = 'red';
                        setDownloadButtonState(false); // Hide download button on validation error
                        return [2 /*return*/];
                    }
                    finalPurpose = selectedPurpose || 'Custom Task';
                    payload = {
                        task: task,
                        purpose: finalPurpose,
                    };
                    resultDisplay.textContent = 'Processing...';
                    resultDisplay.style.color = '#555';
                    resultDisplay.style.backgroundColor = '#e0f7fa';
                    setDownloadButtonState(false); // Hide download button while processing
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, 7, 8]);
                    backendUrl = 'http://localhost:3000';
                    return [4 /*yield*/, fetch("".concat(backendUrl, "/api/mcp-request"), {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(payload),
                        })];
                case 2:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response.json().catch(function () { return ({ message: 'Server error: Invalid JSON response' }); })];
                case 3:
                    errorData = _a.sent();
                    throw new Error("HTTP error! Status: ".concat(response.status, ", Details: ").concat(errorData.message || JSON.stringify(errorData)));
                case 4: return [4 /*yield*/, response.json()];
                case 5:
                    data = _a.sent();
                    if (data.result) {
                        resultDisplay.textContent = data.result;
                        resultDisplay.style.color = '#28a745';
                        resultDisplay.style.backgroundColor = '#e6ffed';
                        setDownloadButtonState(true); // Show and enable download button on success
                    }
                    else if (data.error) {
                        resultDisplay.textContent = "Error from backend: ".concat(data.error);
                        resultDisplay.style.color = 'red';
                        resultDisplay.style.backgroundColor = '#ffe6e6';
                        setDownloadButtonState(false); // Hide download button on backend error
                    }
                    else {
                        resultDisplay.textContent = 'Received an unexpected response format from the backend.';
                        resultDisplay.style.color = 'orange';
                        resultDisplay.style.backgroundColor = '#fff0e6';
                        setDownloadButtonState(false); // Hide download button on unexpected format
                    }
                    return [3 /*break*/, 8];
                case 6:
                    error_1 = _a.sent();
                    resultDisplay.textContent = "Failed to send request or receive valid response: ".concat(error_1.message || 'Unknown network error');
                    resultDisplay.style.color = 'red';
                    resultDisplay.style.backgroundColor = '#ffe6e6';
                    setDownloadButtonState(false); // Hide download button on fetch error
                    console.error('Fetch error:', error_1);
                    return [3 /*break*/, 8];
                case 7:
                    setTimeout(function () {
                        resultDisplay.style.backgroundColor = '#e9ecef';
                    }, 500);
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    }); });
    // Event listener for the download button
    downloadResultBtn.addEventListener('click', function () {
        var resultText = resultDisplay.textContent;
        if (!resultText || resultText.trim() === '' || resultText.trim() === 'Results will appear here...') {
            // Optionally, show a temporary message if there's nothing to download
            console.warn('No result to download.');
            return;
        }
        // Create a Blob from the text content
        var blob = new Blob([resultText], { type: 'text/plain;charset=utf-8' });
        // Create a temporary URL for the blob
        var url = URL.createObjectURL(blob);
        // Create a temporary <a> element
        var a = document.createElement('a');
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
