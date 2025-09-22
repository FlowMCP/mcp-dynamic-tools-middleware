import { jest } from '@jest/globals'
import { McpDynamicToolCallingMiddleware } from '../../src/index.mjs'
import { testConfig } from '../helpers/config.mjs'


jest.mock( 'express', () => ( {
    Router: jest.fn( () => ( {
        post: jest.fn(),
        get: jest.fn()
    } ) )
} ) )


describe( 'McpDynamicToolCallingMiddleware Constructor', () => {
    let consoleLogSpy


    beforeEach( () => {
        consoleLogSpy = jest.spyOn( console, 'log' ).mockImplementation()
        jest.clearAllMocks()
    } )


    afterEach( () => {
        consoleLogSpy.mockRestore()
    } )


    test( 'creates instance with valid parameters', () => {
        const { validMcpTools, validMcpServer, validApiBearerToken, validApiRoutePath, validBaseUrl } = testConfig

        const instance = new McpDynamicToolCallingMiddleware( {
            mcpTools: validMcpTools,
            mcpServer: validMcpServer,
            apiBearerToken: validApiBearerToken,
            apiRoutePath: validApiRoutePath,
            baseUrl: validBaseUrl,
            silent: true
        } )

        expect( instance ).toBeInstanceOf( McpDynamicToolCallingMiddleware )
        expect( instance.router ).toBeDefined()
        expect( typeof instance.router ).toBe( 'function' )
    } )


    test( 'throws error when mcpTools is undefined', () => {
        const { validMcpServer, validApiBearerToken, validApiRoutePath, validBaseUrl } = testConfig

        expect( () => {
            new McpDynamicToolCallingMiddleware( {
                mcpTools: undefined,
                mcpServer: validMcpServer,
                apiBearerToken: validApiBearerToken,
                apiRoutePath: validApiRoutePath,
                baseUrl: validBaseUrl,
                silent: true
            } )
        } ).toThrow( 'McpDynamicToolCallingMiddleware validation failed: mcpTools is required' )
    } )


    test( 'throws error when mcpTools is not object', () => {
        const { validMcpServer, validApiBearerToken, validApiRoutePath, validBaseUrl } = testConfig

        expect( () => {
            new McpDynamicToolCallingMiddleware( {
                mcpTools: 'not-object',
                mcpServer: validMcpServer,
                apiBearerToken: validApiBearerToken,
                apiRoutePath: validApiRoutePath,
                baseUrl: validBaseUrl,
                silent: true
            } )
        } ).toThrow( 'McpDynamicToolCallingMiddleware validation failed: mcpTools must be an object' )
    } )


    test( 'throws error when mcpServer is undefined', () => {
        const { validMcpTools, validApiBearerToken, validApiRoutePath, validBaseUrl } = testConfig

        expect( () => {
            new McpDynamicToolCallingMiddleware( {
                mcpTools: validMcpTools,
                mcpServer: undefined,
                apiBearerToken: validApiBearerToken,
                apiRoutePath: validApiRoutePath,
                baseUrl: validBaseUrl,
                silent: true
            } )
        } ).toThrow( 'McpDynamicToolCallingMiddleware validation failed: mcpServer is required' )
    } )


    test( 'throws error when apiBearerToken is missing', () => {
        const { validMcpTools, validMcpServer, validApiRoutePath, validBaseUrl } = testConfig

        expect( () => {
            new McpDynamicToolCallingMiddleware( {
                mcpTools: validMcpTools,
                mcpServer: validMcpServer,
                apiBearerToken: '',
                apiRoutePath: validApiRoutePath,
                baseUrl: validBaseUrl,
                silent: true
            } )
        } ).toThrow( 'McpDynamicToolCallingMiddleware validation failed: apiBearerToken is required' )
    } )


    test( 'throws error when apiRoutePath does not start with /', () => {
        const { validMcpTools, validMcpServer, validApiBearerToken, validBaseUrl } = testConfig

        expect( () => {
            new McpDynamicToolCallingMiddleware( {
                mcpTools: validMcpTools,
                mcpServer: validMcpServer,
                apiBearerToken: validApiBearerToken,
                apiRoutePath: 'invalid-path',
                baseUrl: validBaseUrl,
                silent: true
            } )
        } ).toThrow( 'McpDynamicToolCallingMiddleware validation failed: apiRoutePath must start with /' )
    } )


    test( 'throws error when baseUrl is missing', () => {
        const { validMcpTools, validMcpServer, validApiBearerToken, validApiRoutePath } = testConfig

        expect( () => {
            new McpDynamicToolCallingMiddleware( {
                mcpTools: validMcpTools,
                mcpServer: validMcpServer,
                apiBearerToken: validApiBearerToken,
                apiRoutePath: validApiRoutePath,
                baseUrl: '',
                silent: true
            } )
        } ).toThrow( 'McpDynamicToolCallingMiddleware validation failed: baseUrl is required' )
    } )


    test( 'throws error when silent is not boolean', () => {
        const { validMcpTools, validMcpServer, validApiBearerToken, validApiRoutePath, validBaseUrl } = testConfig

        expect( () => {
            new McpDynamicToolCallingMiddleware( {
                mcpTools: validMcpTools,
                mcpServer: validMcpServer,
                apiBearerToken: validApiBearerToken,
                apiRoutePath: validApiRoutePath,
                baseUrl: validBaseUrl,
                silent: 'not-boolean'
            } )
        } ).toThrow( 'McpDynamicToolCallingMiddleware validation failed: silent must be a boolean' )
    } )


    test( 'handles multiple validation errors', () => {
        expect( () => {
            new McpDynamicToolCallingMiddleware( {
                mcpTools: 'invalid',
                mcpServer: null,
                apiBearerToken: 123,
                apiRoutePath: 'invalid-path',
                baseUrl: null,
                silent: 'invalid'
            } )
        } ).toThrow( /McpDynamicToolCallingMiddleware validation failed:.*mcpTools must be an object.*mcpServer is required.*apiBearerToken must be a string.*apiRoutePath must start with.*baseUrl is required.*silent must be a boolean/ )
    } )
} )