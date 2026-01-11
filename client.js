/**
 * JSON-RPC 2.0 Client Library
 * 
 * A comprehensive client implementation for communicating with JSON-RPC 2.0 servers.
 * This library handles request creation, response parsing, error handling, and UI updates.
 * 
 * JSON-RPC 2.0 Specification: https://www.jsonrpc.org/specification
 * 
 * @author JSON-RPC Time Server Project
 * @version 1.0.0
 */

/*
 * JSON-RPC 2.0 Protocol Overview:
 * 
 * JSON-RPC is a stateless, lightweight remote procedure call (RPC) protocol.
 * It uses JSON over HTTP to communicate with a server.
 * 
 * Key Components:
 * - jsonrpc: Always "2.0" (protocol version identifier)
 * - method: Name of the method to call on the server
 * - params: Object or array containing method parameters
 * - id: Unique identifier for matching requests with responses
 * - result: Returned when the method executes successfully
 * - error: Returned when the method fails (includes code and message)
 */

// =============================================================================
// Configuration and State Management
// =============================================================================

const CONFIG = {
    SERVER_URL: 'http://localhost:3000/rpc',
    TIMEOUT: 10000, // 10 seconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000 // 1 second
};

const STATE = {
    isLoading: false,
    requestHistory: [],
    errorCount: 0,
    successCount: 0,
    totalRequests: 0
};

// =============================================================================
// Core JSON-RPC Client Functions
// =============================================================================

/**
 * Creates a JSON-RPC 2.0 request object
 * 
 * @param {string} method - The RPC method name to call
 * @param {object|array} params - Method parameters (defaults to empty object)
 * @param {number|string} id - Request ID (defaults to timestamp)
 * @returns {object} JSON-RPC 2.0 compliant request object
 */
function createRPCRequest(method, params = {}, id = null) {
    return {
        jsonrpc: '2.0',
        method: method,
        params: params,
        id: id || Date.now()
    };
}

/**
 * Validates a JSON-RPC 2.0 response
 * 
 * @param {object} response - The response object to validate
 * @returns {boolean} True if valid, throws error if invalid
 * @throws {Error} If response is invalid
 */
function validateRPCResponse(response) {
    if (!response || typeof response !== 'object') {
        throw new Error('Invalid response: not an object');
    }

    if (response.jsonrpc !== '2.0') {
        throw new Error('Invalid response: jsonrpc version must be "2.0"');
    }

    if (!('result' in response) && !('error' in response)) {
        throw new Error('Invalid response: must contain either result or error');
    }

    if ('error' in response) {
        if (!response.error.code || !response.error.message) {
            throw new Error('Invalid error response: must contain code and message');
        }
    }

    return true;
}

/**
 * Main RPC caller function
 * Sends a JSON-RPC 2.0 request to the server and handles the response
 * 
 * @param {string} methodName - The RPC method to call
 * @param {object} params - Method parameters (optional)
 * @returns {Promise<object>} The result from the server
 */
async function callRPC(methodName, params = {}) {
    // Prevent multiple simultaneous requests
    if (STATE.isLoading) {
        console.warn('Request already in progress, please wait...');
        return;
    }

    STATE.isLoading = true;
    STATE.totalRequests++;
    
    disableButtons(true);
    showLoading(true);

    try {
        // Create JSON-RPC 2.0 request object
        const request = createRPCRequest(methodName, params);
        
        logRequest(request);

        // Send POST request to server with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

        const response = await fetch(CONFIG.SERVER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(request),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Check if HTTP response is OK
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }

        // Parse JSON response
        const data = await response.json();
        
        logResponse(data);
        
        // Validate response format
        validateRPCResponse(data);

        // Check for RPC error
        if (data.error) {
            handleRPCError(data.error, methodName);
            STATE.errorCount++;
        } else {
            // Success
            displayResponse(data, methodName);
            updateLastRequestTime();
            showSuccessNotification(`Successfully called ${methodName}`);
            STATE.successCount++;
            
            // Add to history
            addToHistory(methodName, request, data, true);
        }

        return data;

    } catch (error) {
        console.error('Error calling RPC method:', error);
        STATE.errorCount++;
        
        if (error.name === 'AbortError') {
            displayError('Request timeout - server did not respond in time');
        } else {
            displayError(error.message);
        }
        
        addToHistory(methodName, null, { error: error.message }, false);
        
        throw error;
    } finally {
        STATE.isLoading = false;
        disableButtons(false);
        showLoading(false);
        updateStatistics();
    }
}

/**
 * Call RPC with retry logic
 * 
 * @param {string} methodName - The RPC method to call
 * @param {object} params - Method parameters
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise<object>} The result from the server
 */
async function callRPCWithRetry(methodName, params = {}, maxRetries = CONFIG.RETRY_ATTEMPTS) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Attempt ${attempt} of ${maxRetries} for ${methodName}`);
            return await callRPC(methodName, params);
        } catch (error) {
            lastError = error;
            
            if (attempt < maxRetries) {
                console.log(`Retrying in ${CONFIG.RETRY_DELAY}ms...`);
                await sleep(CONFIG.RETRY_DELAY);
            }
        }
    }
    
    throw new Error(`Failed after ${maxRetries} attempts: ${lastError.message}`);
}

// =============================================================================
// Response Handling Functions
// =============================================================================

/**
 * Display the server response in pretty-printed JSON format
 * 
 * @param {object} data - The response data
 * @param {string} methodName - The method that was called
 */
function displayResponse(data, methodName) {
    const responseContainer = document.getElementById('responseContent');

    // Pretty-print JSON with 2-space indentation
    const formattedJSON = JSON.stringify(data, null, 2);

    // Remove the 'empty' class and display the response
    responseContainer.classList.remove('empty');
    responseContainer.textContent = formattedJSON;

    // Highlight the response based on type
    if (data.error) {
        responseContainer.style.borderLeft = '4px solid #e74c3c';
    } else {
        responseContainer.style.borderLeft = '4px solid #27ae60';
    }
}

/**
 * Handle JSON-RPC error responses
 * 
 * @param {object} error - The error object from the response
 * @param {string} methodName - The method that was called
 */
function handleRPCError(error, methodName) {
    const errorMessage = `RPC Error (${error.code}): ${error.message}`;
    console.error(errorMessage, error.data);
    
    displayError(errorMessage);
    
    // Show user-friendly message based on error code
    const friendlyMessage = getErrorMessage(error.code);
    if (friendlyMessage) {
        showNotification(friendlyMessage, 'error');
    }
}

/**
 * Get user-friendly error message based on error code
 * 
 * @param {number} code - JSON-RPC error code
 * @returns {string} User-friendly error message
 */
function getErrorMessage(code) {
    const errorMessages = {
        '-32700': 'Parse Error: The server received invalid JSON',
        '-32600': 'Invalid Request: The request structure is incorrect',
        '-32601': 'Method Not Found: The requested method does not exist',
        '-32602': 'Invalid Params: The method parameters are incorrect',
        '-32603': 'Internal Error: The server encountered an error'
    };
    
    return errorMessages[String(code)] || 'Unknown error occurred';
}

/**
 * Display an error message in the UI
 * 
 * @param {string} errorMessage - The error message to display
 */
function displayError(errorMessage) {
    const responseContainer = document.getElementById('responseContent');

    responseContainer.classList.remove('empty');
    responseContainer.innerHTML = `<div class="error">❌ Error: ${errorMessage}</div>`;
    responseContainer.style.borderLeft = '4px solid #e74c3c';
}

// =============================================================================
// UI State Management
// =============================================================================

/**
 * Show/hide the loading spinner
 * 
 * @param {boolean} show - Whether to show the loading state
 */
function showLoading(show) {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        if (show) {
            loadingElement.classList.add('active');
        } else {
            loadingElement.classList.remove('active');
        }
    }
}

/**
 * Enable or disable all RPC buttons
 * 
 * @param {boolean} disabled - Whether buttons should be disabled
 */
function disableButtons(disabled) {
    const buttons = document.querySelectorAll('.buttons-group button, .clear-btn');
    buttons.forEach(button => {
        button.disabled = disabled;
    });
}

/**
 * Clear the response display
 */
function clearResponse() {
    const responseContainer = document.getElementById('responseContent');
    if (responseContainer) {
        responseContainer.classList.add('empty');
        responseContainer.textContent = 'Click a button to send a request to the server';
        responseContainer.style.borderLeft = '';
    }
}

/**
 * Update the last request timestamp display
 */
function updateLastRequestTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    const lastRequestElement = document.getElementById('lastRequest');
    if (lastRequestElement) {
        lastRequestElement.textContent = timeString;
    }
}

/**
 * Show a notification message
 * 
 * @param {string} message - The notification message
 * @param {string} type - The notification type ('success' or 'error')
 */
function showNotification(message, type = 'success') {
    const className = type === 'success' ? 'success' : 'error';
    const icon = type === 'success' ? '✓' : '❌';
    
    console.log(`${icon} ${message}`);
}

/**
 * Show success notification
 * 
 * @param {string} message - The success message
 */
function showSuccessNotification(message) {
    showNotification(message, 'success');
}

// =============================================================================
// History and Statistics
// =============================================================================

/**
 * Add request to history
 * 
 * @param {string} method - The method name
 * @param {object} request - The request object
 * @param {object} response - The response object
 * @param {boolean} success - Whether the request was successful
 */
function addToHistory(method, request, response, success) {
    const historyEntry = {
        timestamp: new Date().toISOString(),
        method: method,
        request: request,
        response: response,
        success: success
    };
    
    STATE.requestHistory.push(historyEntry);
    
    // Keep only last 50 entries
    if (STATE.requestHistory.length > 50) {
        STATE.requestHistory.shift();
    }
    
    console.log('Request history updated:', STATE.requestHistory.length, 'entries');
}

/**
 * Get request history
 * 
 * @returns {array} Array of history entries
 */
function getHistory() {
    return STATE.requestHistory;
}

/**
 * Clear request history
 */
function clearHistory() {
    STATE.requestHistory = [];
    STATE.errorCount = 0;
    STATE.successCount = 0;
    STATE.totalRequests = 0;
    console.log('History cleared');
}

/**
 * Update statistics display
 */
function updateStatistics() {
    const successRate = STATE.totalRequests > 0 
        ? ((STATE.successCount / STATE.totalRequests) * 100).toFixed(1) 
        : 0;
    
    console.log('Statistics:', {
        total: STATE.totalRequests,
        success: STATE.successCount,
        errors: STATE.errorCount,
        successRate: `${successRate}%`
    });
}

/**
 * Get current statistics
 * 
 * @returns {object} Statistics object
 */
function getStatistics() {
    const successRate = STATE.totalRequests > 0 
        ? ((STATE.successCount / STATE.totalRequests) * 100).toFixed(1) 
        : 0;
    
    return {
        totalRequests: STATE.totalRequests,
        successCount: STATE.successCount,
        errorCount: STATE.errorCount,
        successRate: successRate,
        currentlyLoading: STATE.isLoading
    };
}

// =============================================================================
// Logging Functions
// =============================================================================

/**
 * Log outgoing request
 * 
 * @param {object} request - The request object
 */
function logRequest(request) {
    console.group('📤 Outgoing JSON-RPC Request');
    console.log('Method:', request.method);
    console.log('ID:', request.id);
    console.log('Full Request:', request);
    console.groupEnd();
}

/**
 * Log incoming response
 * 
 * @param {object} response - The response object
 */
function logResponse(response) {
    const hasError = 'error' in response;
    const icon = hasError ? '❌' : '✅';
    
    console.group(`${icon} Incoming JSON-RPC Response`);
    console.log('ID:', response.id);
    
    if (hasError) {
        console.error('Error Code:', response.error.code);
        console.error('Error Message:', response.error.message);
        if (response.error.data) {
            console.error('Error Data:', response.error.data);
        }
    } else {
        console.log('Result:', response.result);
    }
    
    console.log('Full Response:', response);
    console.groupEnd();
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Sleep/delay function
 * 
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after delay
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Format timestamp for display
 * 
 * @param {string|Date} timestamp - The timestamp to format
 * @returns {string} Formatted timestamp string
 */
function formatTimestamp(timestamp) {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
}

/**
 * Copy text to clipboard
 * 
 * @param {string} text - The text to copy
 * @returns {Promise<boolean>} True if successful
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        console.log('Copied to clipboard');
        return true;
    } catch (err) {
        console.error('Failed to copy:', err);
        return false;
    }
}

/**
 * Export history to JSON file
 */
function exportHistory() {
    const dataStr = JSON.stringify(STATE.requestHistory, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `rpc-history-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    console.log('History exported');
}

// =============================================================================
// Initialization
// =============================================================================

/**
 * Initialize the JSON-RPC client
 */
function initializeClient() {
    console.log('🚀 JSON-RPC 2.0 Client initialized');
    console.log('Server URL:', CONFIG.SERVER_URL);
    console.log('Timeout:', CONFIG.TIMEOUT, 'ms');
    console.log('Protocol: JSON-RPC 2.0');
    console.log('Available Methods: getCurrentTime, getTimeZone, getUnixTimestamp');
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl+K to clear response
        if (e.ctrlKey && e.key === 'k') {
            e.preventDefault();
            clearResponse();
            console.log('Response cleared (Ctrl+K)');
        }
        
        // Ctrl+H to export history
        if (e.ctrlKey && e.key === 'h') {
            e.preventDefault();
            exportHistory();
        }
    });
    
    console.log('💡 Keyboard Shortcuts:');
    console.log('  Ctrl+K: Clear response');
    console.log('  Ctrl+H: Export history');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeClient);
} else {
    initializeClient();
}

// =============================================================================
// Public API - Expose functions globally
// =============================================================================

window.JSONRPCClient = {
    callRPC,
    callRPCWithRetry,
    createRPCRequest,
    validateRPCResponse,
    getHistory,
    clearHistory,
    getStatistics,
    exportHistory,
    clearResponse,
    CONFIG,
    STATE
};
