const schema = {
    namespace: "dynamic",
    name: "Ping Test API",
    description: "A simple schema that responds with pong",
    docs: [],
    tags: [],
    flowMCP: "1.2.0",
    root: "http://localhost",
    requiredServerParams: [ 'DYNAMIC_BEARER_TOKEN', 'SERVER_PORT' ],
    headers: { 
        Authorization: "Bearer {{DYNAMIC_BEARER_TOKEN}}",
        'Content-Type': "application/json" 
    },
    routes: {
        listAvailableTools: {
            requestMethod: "GET",
            description: "Fetch all tools from the MCP server",
            route: ":{{SERVER_PORT}}/api/tools/manage",
            parameters: [
                { position: { key: "serverPort", value: "{{SERVER_PORT}}", location: "insert" } },
            ],
            tests: [],
            modifiers: []
        },
        modifiyMcpServer: {
            requestMethod: "POST",
            description: "Change tool state on the MCP server",
            route: ":{{SERVER_PORT}}/api/tools/manage",
            parameters: [
                { position: { key: "routeId", value: "{{USER_PARAM}}", location: "body" }, z: { primitive: "string()", options: [] } },
                { position: { key: "toolCommand", value: "{{USER_PARAM}}", location: "body" }, z: { primitive: "enum(enable, disable)", options: [] } },
              //  { position: { key: "options", value: {}, location: "body" } }
            ],
            tests: [],
            modifiers: []
        }
    },
    handlers: {}
}


export { schema }