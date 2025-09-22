import express from 'express'
import { randomUUID } from 'node:crypto'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { FlowMCP } from 'flowmcp'
// import { OAuthMiddlewareTester } from './OAuthMiddlewareTester.mjs'


import fs from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
import { parse } from 'node:path'

const __filename = fileURLToPath( import.meta.url ) 
const __dirname = path.dirname( __filename )


class ConfigExamples {
    #state = {}


    constructor( { envPath, mcpRoutePath, silent=false } ) {
        this.#state = this.#setState( { envPath, mcpRoutePath, silent } )
    }


    getState() {
        return this.#state
    }


    parseUserInput( { argv } ) {
        const args = argv.slice( 2 ) 
        const parsed =  argv
            .reduce( ( acc, arg ) => {
                if( arg.startsWith( '--' ) && arg.includes( '=' ) ) {
                    const [ key, value ] = arg.split( '=' )
                    const cleanKey = key.substring( 2 )
                    acc[ cleanKey ] = value
                }

                return acc
            }, {} )

        const { messages } = [ 
            [ 'routeType' ], 
            [ 'mcpType'   ] 
        ]
            .reduce( ( acc, [ key ] ) => {
                if( !Object.keys( parsed ).includes( key ) ) {
                    acc['messages'].push( `Missing --${key} argument.` )
                } else if( parsed[ key ] === '' ) {
                    acc['messages'].push( `Empty value for --${key} argument.` )
                } else if( /*is not lowercase*/ parsed[ key ] !== parsed[ key ].toLowerCase() ) {
                    acc['messages'].push( `Invalid value for --${key} argument. Use lowercase only.` )
                } 

                return acc
            }, { 'messages': [] } )

        if( messages.length > 0 ) {
            throw new Error( messages.join( '\n' ) )
        }

        return parsed
    }


    getMcpAuthConfig( { routeType } ) {
        const { silent } = this.#state

        let mcpAuthConfig = {
            silent,
            staticBearer: null,
            oauth: null,
        }

        switch( routeType ) {
            case 'free-route':
                mcpAuthConfig = this.getMcpAuthFreeConfig()['mcpAuthConfig']
                break
            case 'static-bearer':
                mcpAuthConfig = this.getMcpAuthBearerConfig()['mcpAuthConfig']
                break
            case 'scaleKit':
                const oauth = this.getMcpAuthScaleKitConfig()['mcpAuthConfig']
                mcpAuthConfig = { ...oauth }
                break
            default:
                throw new Error(`Invalid routeType: ${routeType}. Valid values: free-route, static-bearer, scaleKit`)
        }

        return { mcpAuthConfig }
    }


    getMcpAuthBearerConfig() {
        const { envObject, mcpRoutePath } = this.#state
        const { BEARER_TOKEN_MASTER } = envObject

        const mcpAuthConfig = {
            authType: 'static-bearer',
            options: {
                bearerToken: BEARER_TOKEN_MASTER
            },
            attachedRoutes: [ mcpRoutePath ],
            silent: false
        }

        return { mcpAuthConfig }
    }

    getMcpAuthFreeConfig() {
        // Free route - no authentication required
        const mcpAuthConfig = {
            authType: 'free-route',
            options: {},
            attachedRoutes: [],  // Empty array means no protection
            silent: false
        }

        return { mcpAuthConfig }
    }

    getMcpAuthScaleKitConfig() {
        const { envObject, mcpRoutePath } = this.#state
        const { 
            SCALEKIT_ENVIRONMENT_URL, 
            SCALEKIT_CLIENT_ID, 
            SCALEKIT_CLIENT_SECRET,
            SCALEKIT_EXPECTED_AUDIENCE,
            SCALEKIT_PROTECTED_RESOURCE_METADATA 
        } = envObject

        const mcpAuthConfig = {
            'authType': 'scalekit',
            options: {
                providerUrl: SCALEKIT_ENVIRONMENT_URL,
                clientId: SCALEKIT_CLIENT_ID,
                clientSecret: SCALEKIT_CLIENT_SECRET,
                resource: SCALEKIT_EXPECTED_AUDIENCE,
                protectedResourceMetadata: SCALEKIT_PROTECTED_RESOURCE_METADATA,
                toolScopes: {}
            },
            attachedRoutes: [ mcpRoutePath ]
        }

        return { mcpAuthConfig }
    }


    async getTools( { mcpType, apiBearerToken } ) {
        const { SERVER_PORT } = this.#state.envObject

        let tools = []
        if( mcpType === 'standard' ) {
            const tool = {
                name: 'ping',
                instruction: { 'title': 'Ping', 'description': 'Simple ping tool that responds with pong' },
                _func: async () => ( { content: [ { type: 'text', text: 'pong' } ] } )
            }
            tools.push( tool )
        } else if( mcpType === 'flowmcp' ) {
            const serverParams = {
                'DYNAMIC_BEARER_TOKEN': apiBearerToken,
                'SERVER_PORT': parseInt( SERVER_PORT, 10 )
            }
            const { schema: dynamic } = await import( '../custom-schemas/dynamic-tools.mjs' )
            tools.push( { schema: dynamic, serverParams } )

            const { schema: ping } = await import( '../custom-schemas/ping.mjs' )
            tools.push( { schema: ping, serverParams: [] } )
        } else {
            throw new Error( `Unsupported mcpType: ${mcpType}. Supported types: flowMcp, standard` )
        }

        return { tools }
    }


    async runServer( { serverPort, mcpType, tools, serverParams } ) {
        const { mcpRoutePath, fullPath, app, mcpServer } = this.#state
       
        let arrayOfMcpTools = []
        tools
            .forEach( ( tool ) => {
                if( mcpType === 'standard' ) { 
                    const { name, instruction, _func } = tool
                    mcpServer.registerTool( name, instruction, _func ) 
                }
                else if( mcpType === 'flowmcp' ) {
                    const { schema, serverParams } = tool
                    const { mcpTools } = FlowMCP
                        .activateServerTools( { server: mcpServer, schema, serverParams } )
                    // Object.assign( mcpTools, _mcpTools )
                    arrayOfMcpTools.push( mcpTools )
                }
                else { 
                    throw new Error( `Unsupported mcpType: ${mcpType}. Supported types: flowMcp, standard` ) 
                }
            } )

        const transport = new StreamableHTTPServerTransport( { sessionIdGenerator: () => randomUUID() } )
        await mcpServer.connect( transport )
        app.use( mcpRoutePath, async ( req, res, next ) => {
            // Skip non-MCP requests by checking if they start with /api/
            if( req.path.startsWith( '/api/' ) ) {
                return next()
            }

            try {
                // Check Accept header for StreamableHTTPServerTransport requirements
                const acceptHeader = req.headers.accept || ''
                const acceptsJson = acceptHeader.includes( 'application/json' ) || acceptHeader.includes( '*/*' )
                const acceptsEventStream = acceptHeader.includes( 'text/event-stream' ) || acceptHeader.includes( '*/*' )

                if( !acceptsJson || !acceptsEventStream ) {
                    if( !acceptHeader.includes( '*/*' ) ) {
                        return res.status( 406 ).json( {
                            jsonrpc: '2.0',
                            error: {
                                code: -32000,
                                message: 'Not Acceptable: Client must accept both application/json and text/event-stream'
                            },
                            id: null
                        } )
                    }
                }

                const parsedBody = req.body || {}
                await transport.handleRequest( req, res, parsedBody )
            } catch ( error ) {
                console.error( 'Transport error:', error )
                res.status( 500 ).json( { error: 'Internal server error' } )
            }
        } )

        app.listen( serverPort, () => {
            if( !this.#state.silent ) {
                console.log( '\n' + '='.repeat( 80 ) )
                console.log( ' MCP SERVER STATUS' )
                console.log( '='.repeat( 80 ) )
                console.log( ` URL:                  ${fullPath}` )
                console.log( ` Port:                 ${serverPort}` )
                console.log( ` Route Path:           ${mcpRoutePath}` )
                console.log( ` Server Name:          example-server` )
                console.log( ` Server Version:       1.0.0` )
                console.log( '='.repeat( 80 ) + '\n' )
            }
        } )

        return { arrayOfMcpTools }
    }


    #setState( { envPath, mcpRoutePath, silent } ) {
        const envObject = this.#getServerParams( { 
            path: path.resolve( __dirname, envPath ),
            requiredServerParams: [
                'SERVER_URL',
                'SERVER_PORT',
                'BEARER_TOKEN_MASTER',
                'SCALEKIT_ENVIRONMENT_URL',
                'SCALEKIT_CLIENT_ID',
                'SCALEKIT_CLIENT_SECRET',
                'SCALEKIT_MCP_ID',
                // 'SCALEKIT_ORGANIZATION_ID',
                'SCALEKIT_PROTECTED_RESOURCE_METADATA',
                'SCALEKIT_EXPECTED_AUDIENCE'
            ]
        } )
        let baseUrl = null
        const { SERVER_URL, SERVER_PORT, BEARER_TOKEN_MASTER } = envObject
        if( SERVER_PORT === '80' || SERVER_PORT === '443' ) {
            baseUrl = SERVER_URL
        } else {
            baseUrl = `${SERVER_URL}:${SERVER_PORT}`
        }

        const app = express()
        app.use( express.json() )
        const mcpServer = new McpServer( { name: 'example-server', version: '1.0.0' } )

        const state = {}
        state['mcpServer'] = mcpServer
        state['app'] = app
        state['envPath'] = envPath
        state['mcpRoutePath'] = mcpRoutePath
        state['silent'] = silent
        state['baseUrl'] = baseUrl
        state['forceHttps'] = false
        state['apiBearerToken'] = BEARER_TOKEN_MASTER
        state['fullPath'] = `${state.baseUrl}${mcpRoutePath}`
        state['serverPort'] = parseInt( SERVER_PORT, 10 )
        state['envObject'] = envObject

        return state
    }


    #getServerParams( { path, requiredServerParams } ) {
        const selection = requiredServerParams
            .map( ( serverParam ) => [ serverParam, serverParam ] )

        const result = fs
            .readFileSync( path, 'utf-8' )
            .split( "\n" )
            .map( line => line.split( '=' ) )
            .reduce( ( acc, [ k, v ] ) => {
                const find = selection.find( ( [ _, value ] ) => value === k )
                if( find ) {  acc[ find[ 0 ] ] = v  }
                return acc
            }, {} )

        const messages = []
        selection
            .forEach( ( row ) => {
                const [ key, _ ] = row
                if( !result[ key ]  ) { messages.push( `Missing ${key} in .env file` ) }
                return true
            } )
        if( messages.length > 0 ) {
            throw new Error( messages.join( "\n" ) )
        }

        return result
    }
}


export { ConfigExamples }