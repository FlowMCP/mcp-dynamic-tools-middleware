import { jest } from '@jest/globals'
import request from 'supertest'
import express from 'express'
import { McpDynamicToolCallingMiddleware } from '../../src/index.mjs'
import { testConfig } from '../helpers/config.mjs'


describe( 'McpDynamicToolCallingMiddleware Extended Coverage', () => {
    let app
    let middleware
    let consoleLogSpy


    beforeEach( () => {
        consoleLogSpy = jest.spyOn( console, 'log' ).mockImplementation()
        jest.clearAllMocks()
    } )


    afterEach( () => {
        consoleLogSpy.mockRestore()
    } )


    test( 'external IP access is blocked', async () => {
        const { validMcpTools, validMcpServer, validApiBearerToken, validApiRoutePath, validBaseUrl } = testConfig

        middleware = new McpDynamicToolCallingMiddleware( {
            mcpTools: validMcpTools,
            mcpServer: validMcpServer,
            apiBearerToken: validApiBearerToken,
            apiRoutePath: validApiRoutePath,
            baseUrl: validBaseUrl,
            silent: false
        } )

        const customApp = express()
        customApp.set( 'trust proxy', true )

        customApp.use( express.json() )
        customApp.use( middleware.router() )

        const response = await request( customApp )
            .get( '/api/tools' )
            .set( 'Authorization', `Bearer ${validApiBearerToken}` )
            .set( 'X-Forwarded-For', '192.168.1.100' )

        expect( response.status ).toBe( 403 )
        expect( response.body ).toEqual( {
            error: 'Forbidden',
            message: 'Access denied. Localhost only.'
        } )
    } )


    test( 'successful tool operation with valid tool', async () => {
        const { validMcpServer, validApiBearerToken, validApiRoutePath, validBaseUrl } = testConfig

        const mockTool = {
            enable: jest.fn().mockReturnValue( { success: true } ),
            disable: jest.fn().mockReturnValue( { success: true } ),
            update: jest.fn().mockReturnValue( { success: true } ),
            remove: jest.fn().mockReturnValue( { success: true } )
        }

        const mcpTools = { 'test-tool': mockTool }

        middleware = new McpDynamicToolCallingMiddleware( {
            mcpTools,
            mcpServer: validMcpServer,
            apiBearerToken: validApiBearerToken,
            apiRoutePath: validApiRoutePath,
            baseUrl: validBaseUrl,
            silent: false
        } )

        app = express()
        app.use( express.json() )
        app.use( middleware.router() )

        const response = await request( app )
            .post( '/api/tools' )
            .set( 'Authorization', `Bearer ${validApiBearerToken}` )
            .send( { routeId: 'test-tool', toolCommand: 'enable' } )

        expect( response.status ).toBe( 200 )
        expect( response.body ).toHaveProperty( 'toolsList' )
        expect( response.body ).toHaveProperty( 'enableResult' )
        expect( response.body.enableResult ).toEqual( {
            success: true,
            routeId: 'test-tool',
            toolCommand: 'enable'
        } )
        expect( response.body.message ).toBe( 'Tool test-tool enabled successfully' )
        expect( mockTool.enable ).toHaveBeenCalled()
        expect( consoleLogSpy ).toHaveBeenCalledWith( 'Tool operation executed: test-tool.enable()' )
    } )


    test( 'tool status detection with different status properties', async () => {
        const { validMcpServer, validApiBearerToken, validApiRoutePath, validBaseUrl } = testConfig

        const mcpTools = {
            'tool-with-status': { status: true },
            'tool-with-active': { active: false },
            'tool-with-enabled': { enabled: true },
            'tool-with-isactive-method': { isActive: () => true },
            'tool-with-getstatus-method': { getStatus: () => false },
            'tool-without-status': { someOtherProperty: 'value' }
        }

        middleware = new McpDynamicToolCallingMiddleware( {
            mcpTools,
            mcpServer: validMcpServer,
            apiBearerToken: validApiBearerToken,
            apiRoutePath: validApiRoutePath,
            baseUrl: validBaseUrl,
            silent: false
        } )

        app = express()
        app.use( express.json() )
        app.use( middleware.router() )

        const response = await request( app )
            .get( '/api/tools' )
            .set( 'Authorization', `Bearer ${validApiBearerToken}` )

        expect( response.status ).toBe( 200 )
        expect( response.body.totalTools ).toBe( 6 )

        const tools = response.body.tools
        expect( tools.find( t => t.routeId === 'tool-with-status' ).active ).toBe( true )
        expect( tools.find( t => t.routeId === 'tool-with-active' ).active ).toBe( false )
        expect( tools.find( t => t.routeId === 'tool-with-enabled' ).active ).toBe( true )
        expect( tools.find( t => t.routeId === 'tool-with-isactive-method' ).active ).toBe( true )
        expect( tools.find( t => t.routeId === 'tool-with-getstatus-method' ).active ).toBe( false )
        expect( tools.find( t => t.routeId === 'tool-without-status' ).active ).toBe( true )

        expect( consoleLogSpy ).toHaveBeenCalledWith( 'Tools list requested: 6 tools found' )
    } )


    test( 'different tool commands execute correctly', async () => {
        const { validMcpServer, validApiBearerToken, validApiRoutePath, validBaseUrl } = testConfig

        const mockTool = {
            enable: jest.fn().mockReturnValue( { success: true } ),
            disable: jest.fn().mockReturnValue( { success: true } ),
            update: jest.fn().mockReturnValue( { success: true } ),
            remove: jest.fn().mockReturnValue( { success: true } )
        }

        const mcpTools = { 'test-tool': mockTool }

        middleware = new McpDynamicToolCallingMiddleware( {
            mcpTools,
            mcpServer: validMcpServer,
            apiBearerToken: validApiBearerToken,
            apiRoutePath: validApiRoutePath,
            baseUrl: validBaseUrl,
            silent: true
        } )

        app = express()
        app.use( express.json() )
        app.use( middleware.router() )

        // Test disable command
        const disableResponse = await request( app )
            .post( '/api/tools' )
            .set( 'Authorization', `Bearer ${validApiBearerToken}` )
            .send( { routeId: 'test-tool', toolCommand: 'disable' } )

        expect( disableResponse.status ).toBe( 200 )
        expect( disableResponse.body.message ).toBe( 'Tool test-tool disabled successfully' )
        expect( mockTool.disable ).toHaveBeenCalled()

        // Test update command
        const updateResponse = await request( app )
            .post( '/api/tools' )
            .set( 'Authorization', `Bearer ${validApiBearerToken}` )
            .send( { routeId: 'test-tool', toolCommand: 'update', options: { newConfig: 'value' } } )

        expect( updateResponse.status ).toBe( 200 )
        expect( updateResponse.body.message ).toBe( 'Tool test-tool updated successfully' )
        expect( mockTool.update ).toHaveBeenCalledWith( { newConfig: 'value' } )

        // Test remove command
        const removeResponse = await request( app )
            .post( '/api/tools' )
            .set( 'Authorization', `Bearer ${validApiBearerToken}` )
            .send( { routeId: 'test-tool', toolCommand: 'remove' } )

        expect( removeResponse.status ).toBe( 200 )
        expect( removeResponse.body.message ).toBe( 'Tool test-tool removed successfully' )
        expect( mockTool.remove ).toHaveBeenCalled()
    } )


    test( 'registerTool command calls mcpServer', async () => {
        const { validApiBearerToken, validApiRoutePath, validBaseUrl } = testConfig

        const mockMcpServer = {
            registerTool: jest.fn().mockReturnValue( { success: true } )
        }

        const mcpTools = { 'test-tool': { enable: jest.fn() } }

        middleware = new McpDynamicToolCallingMiddleware( {
            mcpTools,
            mcpServer: mockMcpServer,
            apiBearerToken: validApiBearerToken,
            apiRoutePath: validApiRoutePath,
            baseUrl: validBaseUrl,
            silent: true
        } )

        app = express()
        app.use( express.json() )
        app.use( middleware.router() )

        const response = await request( app )
            .post( '/api/tools' )
            .set( 'Authorization', `Bearer ${validApiBearerToken}` )
            .send( {
                routeId: 'test-tool',
                toolCommand: 'registerTool',
                options: {
                    name: 'test-tool',
                    instruction: 'Test instruction',
                    _func: 'test-function-string'
                }
            } )

        expect( response.status ).toBe( 200 )
        expect( mockMcpServer.registerTool ).toHaveBeenCalledWith( 'test-tool', 'Test instruction', 'test-function-string' )
    } )


    test( 'constructor with silent=false logs status', () => {
        const { validMcpTools, validMcpServer, validApiBearerToken, validApiRoutePath, validBaseUrl } = testConfig

        new McpDynamicToolCallingMiddleware( {
            mcpTools: validMcpTools,
            mcpServer: validMcpServer,
            apiBearerToken: validApiBearerToken,
            apiRoutePath: validApiRoutePath,
            baseUrl: validBaseUrl,
            silent: false
        } )

        expect( consoleLogSpy ).toHaveBeenCalledWith( expect.stringContaining( 'Routes setup:' ) )
        expect( consoleLogSpy ).toHaveBeenCalledWith( expect.stringContaining( 'MCP DYNAMIC TOOL CALLING MIDDLEWARE STATUS' ) )
    } )
} )