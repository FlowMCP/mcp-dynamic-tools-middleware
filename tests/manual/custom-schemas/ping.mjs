const schema = {
    namespace: "example",
    name: "Ping Test API",
    description: "A simple schema that responds with pong",
    docs: [],
    tags: [],
    flowMCP: "1.2.0",
    root: "http://localhost",
    requiredServerParams: [],
    headers: {},
    routes: {
        ping: {
            requestMethod: "GET",
            description: "Returns pong for ping test",
            route: "",
            parameters: [],
            tests: [],
            modifiers: [
                { phase: "execute", handlerName: "respondWithPong" }
            ]
        },
        echo: {
            requestMethod: "GET",
            description: "Returns the provided message",
            route: "",
            parameters: [
                { position: { key: "message", value: "{{USER_PARAM}}", location: "insert" }, z: { primitive: "string()", options: [] } }
            ],
            tests: [],
            modifiers: [
                { phase: "execute", handlerName: "responseWithEcho" }
            ]
        },
        add: {
            requestMethod: "GET",
            description: "Adds two numbers",
            route: "",
            parameters: [
                { position: { key: "a", value: "{{USER_PARAM}}", location: "insert" }, z: { primitive: "number()", options: [] } },
                { position: { key: "b", value: "{{USER_PARAM}}", location: "insert" }, z: { primitive: "number()", options: [] } }
            ],
            tests: [],
            modifiers: [
                { phase: "execute", handlerName: "respondAddNumbers" }
            ]
        }
    },
    handlers: {
        respondWithPong: async( { struct, payload } ) => {
            struct.data = { message: 'pong' }
            struct.status = true
            return { struct, payload }
        },
        responseWithEcho: async( { struct, payload, userParams } ) => {
            const { message } = userParams
            struct.data = { message }
            struct.status = true
            return { struct, payload }
        },
        respondAddNumbers: async( { struct, payload, userParams } ) => {
            const { a, b } = userParams
            const sum = a + b
            struct.data = { result: sum }
            struct.status = true
            return { struct, payload }
        }
    }
}


export { schema }