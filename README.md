# JSON-RPC 2.0 Time Server

A simple yet complete implementation of a JSON-RPC 2.0 real-time server using Node.js and Express, with a vanilla JavaScript frontend client.

## 📋 Project Overview

This project demonstrates a modern JSON-RPC 2.0 implementation with:
- **Backend**: Express.js server implementing JSON-RPC 2.0 specification
- **Frontend**: Vanilla HTML/CSS/JavaScript client (no frameworks)
- **Protocol**: JSON-RPC 2.0 (https://www.jsonrpc.org/specification)

### Available Methods

The server provides three time-related RPC methods:

1. **getCurrentTime** - Returns current server time in ISO 8601 format
2. **getTimeZone** - Returns server timezone name and UTC offset
3. **getUnixTimestamp** - Returns current Unix timestamp in seconds

## 🚀 Quick Start

### Prerequisites

- Node.js (v12 or higher)
- npm

### Installation

```bash
cd d:\PROJECTS\JSON-RPC-Protocol
npm install
```

### Running the Server

```bash
npm start
```

The server will start on `http://localhost:3000` with the following endpoints:
- **RPC Endpoint**: `POST http://localhost:3000/rpc`
- **Health Check**: `GET http://localhost:3000/health`
- **Server Info**: `GET http://localhost:3000/`

### Opening the Client

1. Open `index.html` in your web browser
2. Click any of the three buttons to send RPC requests
3. View formatted JSON responses

## 📚 API Documentation

### Base URL
```
http://localhost:3000/rpc
```

### Request Format (JSON-RPC 2.0)

```json
{
  "jsonrpc": "2.0",
  "method": "methodName",
  "params": {},
  "id": 1
}
```

**Parameters:**
- `jsonrpc` (string, required): Must be exactly "2.0"
- `method` (string, required): Name of the method to call
- `params` (object, optional): Method parameters (empty object if no params needed)
- `id` (number/string, required): Unique request identifier for matching responses

### Response Format

#### Success Response
```json
{
  "jsonrpc": "2.0",
  "result": { /* result data */ },
  "id": 1
}
```

#### Error Response
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32601,
    "message": "Method not found",
    "data": "Additional error details"
  },
  "id": 1
}
```

### Error Codes

| Code | Message | Description |
|------|---------|-------------|
| -32700 | Parse error | Invalid JSON was received |
| -32600 | Invalid Request | Request structure is invalid |
| -32601 | Method not found | Called method doesn't exist |
| -32602 | Invalid params | Method parameters are invalid |
| -32603 | Internal error | Internal server error |

## 🔧 Available Methods

### 1. getCurrentTime

Returns the current server time in ISO 8601 format.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "getCurrentTime",
  "params": {},
  "id": 1
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "timestamp": "2026-01-11T10:30:45.123Z"
  },
  "id": 1
}
```

### 2. getTimeZone

Returns the server's timezone information including name and UTC offset.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "getTimeZone",
  "params": {},
  "id": 2
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "timezone": "America/New_York",
    "offset": "-05:00"
  },
  "id": 2
}
```

### 3. getUnixTimestamp

Returns the current Unix timestamp in seconds.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "getUnixTimestamp",
  "params": {},
  "id": 3
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "timestamp": 1736509845
  },
  "id": 3
}
```

## 💻 Using the Frontend Client

The `index.html` file provides a user-friendly web interface to interact with the server.

### Features

- **Three Action Buttons**: Send requests to each of the three available methods
- **Live Response Display**: Pretty-printed JSON responses
- **Loading State**: Visual feedback while waiting for responses
- **Error Handling**: Clear error messages if requests fail
- **Clear Response**: Button to clear the response area
- **Last Request Timestamp**: Shows when the last request was made
- **Responsive Design**: Works on desktop and mobile devices

### How to Use

1. Start the server with `npm start`
2. Open `index.html` in your browser
3. Click "Get Current Time", "Get Time Zone", or "Get Unix Timestamp"
4. View the formatted JSON response
5. Use "Clear Response" to reset the display

## 🧪 Testing with cURL

### Test getCurrentTime
```bash
curl -X POST http://localhost:3000/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"getCurrentTime","params":{},"id":1}'
```

### Test getTimeZone
```bash
curl -X POST http://localhost:3000/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"getTimeZone","params":{},"id":2}'
```

### Test getUnixTimestamp
```bash
curl -X POST http://localhost:3000/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"getUnixTimestamp","params":{},"id":3}'
```

### Test Health Check
```bash
curl http://localhost:3000/health
```

### Test Server Info
```bash
curl http://localhost:3000/
```

## 📁 Project Structure

```
JSON-RPC-Protocol/
├── server.js              # Express server with JSON-RPC 2.0 implementation
├── index.html             # Frontend client (HTML + CSS + JavaScript)
├── package.json           # Project metadata and dependencies
├── package-lock.json      # Dependency lock file
├── README.md              # This file
├── .gitignore             # Git ignore rules
├── .gitattributes         # Git attributes
└── postman_collection.json # Postman API collection
```

## 🔐 CORS Support

The server includes CORS (Cross-Origin Resource Sharing) support, allowing the frontend client to communicate with the API from different origins. This is configured in `server.js` with the following headers:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type`

## 🛠️ Development

### Modifying the Server

To add new RPC methods:

1. Create a new function (e.g., `function getNewMethod() { ... }`)
2. Add a case in the `routeMethod()` function
3. Document the method with JSDoc comments

### Example: Adding a New Method

```javascript
function getNewMethod() {
  return {
    data: 'your data here'
  };
}

// In routeMethod() switch statement:
case 'getNewMethod':
  return getNewMethod();
```

## 📦 Dependencies

- **express** (^4.18.2) - Web framework for Node.js

## 📄 License

ISC

## 🤝 Contributing

Feel free to modify and extend this project for your needs. This is a great learning resource for understanding JSON-RPC 2.0 implementation.

## 📞 Support

For issues or questions:
1. Check the README.md (this file)
2. Review the code comments in server.js and index.html
3. Test using the provided cURL examples or Postman collection
4. Verify the server is running on http://localhost:3000

---

**Created**: January 11, 2026
**Version**: 1.0.0
