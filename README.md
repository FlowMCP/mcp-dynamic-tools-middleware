# MCP Dynamic Tools Middleware

An Express.js middleware for dynamic management of Model Context Protocol (MCP) tools via REST API.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
  - [Configuration](#configuration)
- [API Reference](#api-reference)
  - [Authentication](#authentication)
  - [Endpoints](#endpoints)
  - [Error Responses](#error-responses)
- [Integration Examples](#integration-examples)
  - [With Standard MCP Tools](#with-standard-mcp-tools)
  - [With FlowMCP Schemas](#with-flowmcp-schemas)
- [Security Considerations](#security-considerations)
- [License](#license)
- [Contributing](#contributing)

## Features

- **Dynamic Tool Management**: Enable, disable, update, and remove MCP tools via REST API
- **Secure Access**: Bearer token authentication with localhost-only access
- **FlowMCP Integration**: Full support for FlowMCP schemas and standard MCP tools
- **Real-time Status**: Get current status of all registered tools
- **Express.js Compatible**: Easy integration into existing Express applications

## Installation

```bash
npm install mcp-dynamic-tools-middleware
```

## Usage

```javascript
import { McpDynamicToolCallingMiddleware } from 'mcp-dynamic-tools-middleware'
import express from 'express'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

const app = express()
const mcpServer = new McpServer({ name: 'example-server', version: '1.0.0' })

// Create middleware
const { mcpTools, mcpDynamicToolCalling } = await McpDynamicToolCallingMiddleware
    .create({
        mcpServer,
        apiBearerToken: 'your-secure-token',
        apiRoutePath: '/api/tools/manage',
        baseUrl: 'http://localhost:3000',
        silent: false
    })

// Add to Express app
app.use(mcpDynamicToolCalling.router())

// Register your MCP tools
// Tools will be available in mcpTools object for dynamic management

app.listen(3000)
```

### Configuration

The middleware requires:
- `apiBearerToken`: Secure token for API authentication
- `apiRoutePath`: API endpoint path (e.g., `/api/tools/manage`)
- `baseUrl`: Server base URL for logging
- `mcpServer`: MCP server instance
- `mcpTools`: Tools object (automatically created)

## API Reference

### Authentication

All API endpoints require Bearer token authentication:

```
Authorization: Bearer your-secure-bearer-token
```

**Security Note**: API access is restricted to localhost only for security.

### Endpoints

#### GET `/api/tools/manage`

List all registered tools with their current status.

**Response:**
```json
{
  "success": true,
  "totalTools": 3,
  "tools": [
    {
      "routeId": "ping_example",
      "active": true
    },
    {
      "routeId": "echo_example",
      "active": false
    }
  ]
}
```

#### POST `/api/tools/manage`

Execute tool management commands.

**Request Body:**
```json
{
  "routeId": "ping_example",
  "toolCommand": "disable",
  "options": {}
}
```

**Available Commands:**
- `enable` - Activate a tool
- `disable` - Deactivate a tool
- `update` - Update tool configuration
- `remove` - Remove tool completely
- `registerTool` - Register a new tool

**Response:**
```json
{
  "toolsList": {
    "success": true,
    "totalTools": 3,
    "tools": [...]
  },
  "disableResult": {
    "success": true,
    "routeId": "ping_example",
    "toolCommand": "disable"
  },
  "message": "Tool ping_example disabled successfully"
}
```

### Error Responses

```json
{
  "error": "Unauthorized",
  "message": "Bearer token required"
}
```

```json
{
  "error": "Bad Request",
  "message": "routeId and toolCommand are required"
}
```

## Integration Examples

### With Standard MCP Tools

```javascript
// Register standard MCP tool
mcpServer.registerTool('ping',
  { title: 'Ping', description: 'Simple ping tool' },
  async () => ({ content: [{ type: 'text', text: 'pong' }] })
)
```

### With FlowMCP Schemas

```javascript
import { FlowMCP } from 'flowmcp'

// Collect tools from multiple schemas
let arrayOfMcpTools = []

// Activate each schema
const { mcpTools: schema1Tools } = FlowMCP.activateServerTools({
  server: mcpServer,
  schema: schema1,
  serverParams: { BEARER_TOKEN: 'token' }
})
arrayOfMcpTools.push(schema1Tools)

const { mcpTools: schema2Tools } = FlowMCP.activateServerTools({
  server: mcpServer,
  schema: schema2,
  serverParams: { BEARER_TOKEN: 'token' }
})
arrayOfMcpTools.push(schema2Tools)

// Merge all tools into middleware
Object.assign(mcpTools, ...arrayOfMcpTools)
```

## Security Considerations

- **Bearer Token Required**: All API access requires valid authentication
- **Localhost Only**: API endpoints only accept connections from localhost
- **Input Validation**: All parameters are validated before execution
- **Command Whitelist**: Only predefined tool commands are allowed

## License

MIT License - see package.json for details

## Contributing

This is a development middleware for MCP tool management. Contributions and feedback are welcome through issues and pull requests.