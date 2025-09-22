import express from 'express'


class McpDynamicToolCallingMiddleware {
    #mcpTools
    #mcpServer
    #apiBearerToken
    #apiRoutePath
    #baseUrl
    #silent
    #router


    constructor( { mcpTools, mcpServer, apiBearerToken, apiRoutePath, baseUrl, silent } ) {
        this.#validateParameters( { mcpTools, mcpServer, apiBearerToken, apiRoutePath, baseUrl, silent } )

        this.#mcpTools = mcpTools
        this.#mcpServer = mcpServer
        this.#apiBearerToken = apiBearerToken
        this.#apiRoutePath = apiRoutePath
        this.#baseUrl = baseUrl
        this.#silent = silent
        this.#router = express.Router()
        this.#setupRoutes()
        this.#logStatus()
    }


    static async create( { mcpServer, apiBearerToken, apiRoutePath, baseUrl, silent = false } ) {
        const mcpTools = {}
        const instance = new McpDynamicToolCallingMiddleware( { mcpTools, mcpServer, apiBearerToken, apiRoutePath, baseUrl, silent } )

        return {
            mcpTools,
            mcpDynamicToolCalling: instance
        }
    }


    router() {
        return this.#router
    }


    #setupRoutes() {
console.log( 'A >>>', this.#apiRoutePath)
        this.#router.post( this.#apiRoutePath, this.#authenticateBearer.bind( this ), this.#checkLocalhostOnly.bind( this ), this.#handleToolManagement.bind( this ) )
        this.#router.get( this.#apiRoutePath, this.#authenticateBearer.bind( this ), this.#checkLocalhostOnly.bind( this ), this.#listTools.bind( this ) )

        if( !this.#silent ) {
            const fullUrl = `${this.#baseUrl}${this.#apiRoutePath}`
            console.log( `Routes setup: POST ${fullUrl} and GET ${fullUrl}` )
        }
    }


    #authenticateBearer( req, res, next ) {
        const authHeader = req.headers.authorization

        if( !authHeader || !authHeader.startsWith( 'Bearer ' ) ) {
            return res.status( 401 ).json( {
                error: 'Unauthorized',
                message: 'Bearer token required'
            } )
        }

        const token = authHeader.substring( 7 )
        if( token !== this.#apiBearerToken ) {
            return res.status( 401 ).json( {
                error: 'Unauthorized',
                message: 'Invalid bearer token'
            } )
        }

        next()
    }


    #checkLocalhostOnly( req, res, next ) {
        const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress

        // Allow localhost, 127.0.0.1, and ::1 (IPv6 localhost)
        const allowedIPs = [ '127.0.0.1', '::1', '::ffff:127.0.0.1' ]
        const isLocalhost = allowedIPs.includes( clientIP ) || clientIP === 'localhost'

        if( !isLocalhost ) {
            if( !this.#silent ) {
                console.log( `Blocked external request from IP: ${clientIP}` )
            }
            return res.status( 403 ).json( {
                error: 'Forbidden',
                message: 'Access denied. Localhost only.'
            } )
        }

        next()
    }


    #handleToolManagement( req, res ) {
        try {
            const { routeId, toolCommand, options = {} } = req.body

            // Validate request body
            if( !routeId || !toolCommand ) {
                return res.status( 400 ).json( {
                    error: 'Bad Request',
                    message: 'routeId and toolCommand are required'
                } )
            }

            // Execute tool operation
            const operationResult = this.#executeToolOperation( { routeId, toolCommand, options } )

            // Get updated tools list
            const toolsList = this.#getToolsList()

            // Create appropriate message based on function
            let message = ''
            switch( toolCommand ) {
                case 'enable':
                    message = `Tool ${routeId} enabled successfully`
                    break
                case 'disable':
                    message = `Tool ${routeId} disabled successfully`
                    break
                case 'update':
                    message = `Tool ${routeId} updated successfully`
                    break
                case 'remove':
                    message = `Tool ${routeId} removed successfully`
                    break
                default:
                    message = `Operation ${toolCommand} completed successfully`
            }

            if( !this.#silent ) {
                console.log( `Tool operation executed: ${routeId}.${toolCommand}()` )
                console.log( `Notification sent: notifications/tools/list_changed` )
            }

            const response = {
                toolsList,
                [`${toolCommand}Result`]: {
                    success: true,
                    routeId,
                    toolCommand
                },
                message
            }

            res.status( 200 ).json( response )

        } catch( error ) {
            res.status( 500 ).json( {
                error: 'Internal Server Error',
                message: error.message
            } )
        }
    }


    #validateParameters( { mcpTools, mcpServer, apiBearerToken, apiRoutePath, baseUrl, silent } ) {
        const errors = []

        if( mcpTools === undefined || mcpTools === null ) {
            errors.push( 'mcpTools is required' )
        } else if( typeof mcpTools !== 'object' ) {
            errors.push( 'mcpTools must be an object' )
        }

        if( mcpServer === undefined || mcpServer === null ) {
            errors.push( 'mcpServer is required' )
        } else if( typeof mcpServer !== 'object' ) {
            errors.push( 'mcpServer must be an object' )
        }

        if( !apiBearerToken ) {
            errors.push( 'apiBearerToken is required' )
        } else if( typeof apiBearerToken !== 'string' ) {
            errors.push( 'apiBearerToken must be a string' )
        }

        if( !apiRoutePath ) {
            errors.push( 'apiRoutePath is required' )
        } else if( typeof apiRoutePath !== 'string' ) {
            errors.push( 'apiRoutePath must be a string' )
        } else if( !apiRoutePath.startsWith( '/' ) ) {
            errors.push( 'apiRoutePath must start with /' )
        }

        if( !baseUrl ) {
            errors.push( 'baseUrl is required' )
        } else if( typeof baseUrl !== 'string' ) {
            errors.push( 'baseUrl must be a string' )
        }

        if( silent !== undefined && typeof silent !== 'boolean' ) {
            errors.push( 'silent must be a boolean' )
        }

        if( errors.length > 0 ) {
            throw new Error( `McpDynamicToolCallingMiddleware validation failed: ${errors.join( ', ' )}` )
        }
    }


    #logStatus() {
        if( !this.#silent ) {
            const fullUrl = `${this.#baseUrl}${this.#apiRoutePath}`
            console.log( '\n' + '='.repeat( 80 ) )
            console.log( ' MCP DYNAMIC TOOL CALLING MIDDLEWARE STATUS' )
            console.log( '='.repeat( 80 ) )
            console.log( ` Full URL:             ${fullUrl}` )
            console.log( ` Bearer Token:         ${this.#apiBearerToken.substring( 0, 4 )}****` )
            console.log( ` Available Tools:      ${Object.keys( this.#mcpTools ).length}` )
            console.log( ` Tool IDs:             ${Object.keys( this.#mcpTools ).join( ', ' )}` )
            console.log( ` Localhost Only:       Yes` )
            console.log( '='.repeat( 80 ) + '\n' )
        }
    }


    #getToolsList() {
        const routeIds = Object.keys( this.#mcpTools )
        const toolsInfo = routeIds
            .map( ( routeId ) => {
                const tool = this.#mcpTools[ routeId ]
                // Try to get status from tool object - could be a property or method
                let active = false
                if( tool ) {
                    // Check for status property or isActive/getStatus method
                    if( typeof tool.status === 'boolean' ) {
                        active = tool.status
                    } else if( typeof tool.isActive === 'function' ) {
                        active = tool.isActive()
                    } else if( typeof tool.getStatus === 'function' ) {
                        active = tool.getStatus()
                    } else if( typeof tool.active === 'boolean' ) {
                        active = tool.active
                    } else if( typeof tool.enabled === 'boolean' ) {
                        active = tool.enabled
                    } else {
                        // Default to true if tool exists but no status found
                        active = true
                    }
                }
                return {
                    routeId,
                    active
                }
            } )

        return {
            success: true,
            totalTools: routeIds.length,
            tools: toolsInfo
        }
    }


    #listTools( req, res ) {
        try {
            const toolsList = this.#getToolsList()

            if( !this.#silent ) {
                console.log( `Tools list requested: ${toolsList.totalTools} tools found` )
            }

            res.status( 200 ).json( toolsList )
        } catch( error ) {
            res.status( 500 ).json( {
                error: 'Internal Server Error',
                message: error.message
            } )
        }
    }


    #executeToolOperation( { routeId, toolCommand, options } ) {
        // Validate tool exists
        if( !this.#mcpTools[ routeId ] ) {
            throw new Error( `Tool with routeId '${routeId}' not found` )
        }

        // Validate command name
        const allowedCommands = [ 'enable', 'disable', 'update', 'remove', 'registerTool' ]
        if( !allowedCommands.includes( toolCommand ) ) {
            throw new Error( `Invalid toolCommand '${toolCommand}'. Allowed: ${allowedCommands.join( ', ' )}` )
        }

        const tool = this.#mcpTools[ routeId ]

        // Execute the requested function
        switch( toolCommand ) {
            case 'enable':
                return tool.enable()
            case 'disable':
                return tool.disable()
            case 'update':
                return tool.update( options )
            case 'remove':
                return tool.remove()
            case 'registerTool':
                // registerTool is handled by mcpServer, not individual tools
                const { name, instruction, _func } = options
                return this.#mcpServer.registerTool( name, instruction, _func )
            default:
                throw new Error( `Unexpected command: ${toolCommand}` )
        }
    }
}


export { McpDynamicToolCallingMiddleware }