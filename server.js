const express = require('express');
const app = express();
const PORT = 3000;

// CORS Middleware - Allow requests from any origin
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Middleware to parse JSON body
app.use(express.json());

/**
 * JSON-RPC 2.0 Error Codes
 * -32700: Parse error
 * -32600: Invalid Request
 * -32601: Method not found
 * -32602: Invalid params
 * -32603: Internal error
 */

/**
 * Creates a JSON-RPC 2.0 response object
 * @param {any} result - The result to return
 * @param {number|string|null} id - The request ID
 * @returns {object} Response object
 */
function createResponse(result, id = null) {
  return {
    jsonrpc: '2.0',
    result,
    id
  };
}

/**
 * Creates a JSON-RPC 2.0 error response object
 * @param {number} code - Error code
 * @param {string} message - Error message
 * @param {any} data - Additional error data
 * @param {number|string|null} id - The request ID
 * @returns {object} Error response object
 */
function createErrorResponse(code, message, data = null, id = null) {
  const errorObj = {
    jsonrpc: '2.0',
    error: {
      code,
      message
    },
    id
  };
  
  if (data !== null) {
    errorObj.error.data = data;
  }
  
  return errorObj;
}

/**
 * Method: getCurrentTime
 * Returns current server time in ISO 8601 format
 * @returns {object} { timestamp: "2026-01-11T05:30:00Z" }
 */
function getCurrentTime() {
  return {
    timestamp: new Date().toISOString()
  };
}

/**
 * Method: getTimeZone
 * Returns server timezone information
 * @returns {object} { timezone: "UTC", offset: "+00:00" }
 */
function getTimeZone() {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset();
  const offsetHours = Math.floor(Math.abs(offsetMs) / 60);
  const offsetMinutes = Math.abs(offsetMs) % 60;
  const sign = offsetMs > 0 ? '-' : '+';
  const offset = `${sign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`;
  
  // Get timezone name using Intl API (works across platforms)
  const timezoneName = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  return {
    timezone: timezoneName,
    offset: offset
  };
}

/**
 * Method: getUnixTimestamp
 * Returns current Unix timestamp in seconds
 * @returns {object} { timestamp: 1736509800 }
 */
function getUnixTimestamp() {
  return {
    timestamp: Math.floor(Date.now() / 1000)
  };
}

/**
 * Routes an RPC method call to the appropriate handler
 * @param {string} method - The method name
 * @param {object} params - Method parameters
 * @returns {object} Method result
 * @throws {object} Error object with code and message
 */
function routeMethod(method, params) {
  // Validate that method is a string
  if (typeof method !== 'string') {
    throw {
      code: -32600,
      message: 'Invalid Request',
      data: 'Method must be a string'
    };
  }

  switch (method) {
    case 'getCurrentTime':
      return getCurrentTime();
    
    case 'getTimeZone':
      return getTimeZone();
    
    case 'getUnixTimestamp':
      return getUnixTimestamp();
    
    default:
      // Method not found
      throw {
        code: -32601,
        message: 'Method not found',
        data: `Unknown method: ${method}`
      };
  }
}

/**
 * RPC endpoint info - GET shows usage instructions
 */
app.get('/rpc', (req, res) => {
  res.status(200).json({
    message: 'JSON-RPC 2.0 endpoint',
    method: 'POST',
    contentType: 'application/json',
    example: {
      jsonrpc: '2.0',
      method: 'getCurrentTime',
      params: {},
      id: 1
    },
    availableMethods: [
      {
        name: 'getCurrentTime',
        description: 'Returns current server time in ISO 8601 format',
        params: {},
        example: '{"jsonrpc": "2.0", "method": "getCurrentTime", "params": {}, "id": 1}'
      },
      {
        name: 'getTimeZone',
        description: 'Returns server timezone name and UTC offset',
        params: {},
        example: '{"jsonrpc": "2.0", "method": "getTimeZone", "params": {}, "id": 2}'
      },
      {
        name: 'getUnixTimestamp',
        description: 'Returns current Unix timestamp in seconds',
        params: {},
        example: '{"jsonrpc": "2.0", "method": "getUnixTimestamp", "params": {}, "id": 3}'
      }
    ]
  });
});

/**
 * Main JSON-RPC 2.0 request handler
 * POST /rpc
 */
app.post('/rpc', (req, res) => {
  try {
    const body = req.body;

    // Validate that request is an object
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json(
        createErrorResponse(-32600, 'Invalid Request', 'Request must be a JSON object')
      );
    }

    // Extract request components
    const { jsonrpc, method, params = {}, id } = body;

    // Validate jsonrpc version (must be "2.0")
    if (jsonrpc !== '2.0') {
      return res.status(400).json(
        createErrorResponse(-32600, 'Invalid Request', 'jsonrpc must be "2.0"', id)
      );
    }

    // Validate method exists
    if (method === undefined) {
      return res.status(400).json(
        createErrorResponse(-32600, 'Invalid Request', 'method is required', id)
      );
    }

    // If id is missing, this is a notification - no response should be sent
    const isNotification = id === undefined;

    try {
      // Route the method and get result
      const result = routeMethod(method, params);

      // Only send response if this is not a notification (id must be present)
      if (!isNotification) {
        return res.status(200).json(createResponse(result, id));
      } else {
        // Notification: no response (HTTP 204 No Content)
        return res.status(204).send();
      }
    } catch (methodError) {
      // Method execution error
      if (!isNotification) {
        return res.status(200).json(
          createErrorResponse(methodError.code, methodError.message, methodError.data, id)
        );
      } else {
        // Even on error, if it's a notification, no response
        return res.status(204).send();
      }
    }

  } catch (err) {
    // Unexpected server error
    console.error('Unexpected error:', err);
    res.status(500).json(
      createErrorResponse(-32603, 'Internal error', err.message, null)
    );
  }
});

/**
 * Root endpoint - provides server information
 */
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'JSON-RPC 2.0 Time Server',
    version: '1.0.0',
    endpoints: {
      rpc: 'POST /rpc',
      health: 'GET /health'
    },
    methods: ['getCurrentTime', 'getTimeZone', 'getUnixTimestamp'],
    spec: 'https://www.jsonrpc.org/specification'
  });
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'JSON-RPC 2.0 Time Server is running' });
});

/**
 * Start the server
 */
app.listen(PORT, () => {
  console.log(`\n✓ JSON-RPC 2.0 Time Server running on http://localhost:${PORT}`);
  console.log(`✓ RPC endpoint: http://localhost:${PORT}/rpc`);
  console.log(`✓ Health check: http://localhost:${PORT}/health`);
  console.log('\nAvailable methods:');
  console.log('  - getCurrentTime');
  console.log('  - getTimeZone');
  console.log('  - getUnixTimestamp');
  console.log('\nExample request:\n');
  console.log(JSON.stringify({
    jsonrpc: '2.0',
    method: 'getCurrentTime',
    params: {},
    id: 1
  }, null, 2));
});
