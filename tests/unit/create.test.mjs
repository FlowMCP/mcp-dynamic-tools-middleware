import { jest } from '@jest/globals'
import { McpDynamicToolCallingMiddleware } from '../../src/index.mjs'
import { testConfig } from '../helpers/config.mjs'


jest.mock( 'express', () => ( {
    Router: jest.fn( () => ( {
        post: jest.fn(),
        get: jest.fn()
    } ) )
} ) )


describe( 'McpDynamicToolCallingMiddleware.create', () => {
    let consoleLogSpy


    beforeEach( () => {
        consoleLogSpy = jest.spyOn( console, 'log' ).mockImplementation()
        jest.clearAllMocks()
    } )


    afterEach( () => {
        consoleLogSpy.mockRestore()
    } )


    test( 'creates instance and returns mcpTools and mcpDynamicToolCalling', async () => {
        const { validMcpServer, validApiBearerToken, validApiRoutePath, validBaseUrl } = testConfig

        const result = await McpDynamicToolCallingMiddleware.create( {
            mcpServer: validMcpServer,
            apiBearerToken: validApiBearerToken,
            apiRoutePath: validApiRoutePath,
            baseUrl: validBaseUrl,
            silent: true
        } )

        expect( result ).toHaveProperty( 'mcpTools' )
        expect( result ).toHaveProperty( 'mcpDynamicToolCalling' )
        expect( typeof result.mcpTools ).toBe( 'object' )
        expect( result.mcpDynamicToolCalling ).toBeInstanceOf( McpDynamicToolCallingMiddleware )
    } )


    test( 'creates with silent default false', async () => {
        const { validMcpServer, validApiBearerToken, validApiRoutePath, validBaseUrl } = testConfig

        const result = await McpDynamicToolCallingMiddleware.create( {
            mcpServer: validMcpServer,
            apiBearerToken: validApiBearerToken,
            apiRoutePath: validApiRoutePath,
            baseUrl: validBaseUrl
        } )

        expect( result.mcpDynamicToolCalling ).toBeInstanceOf( McpDynamicToolCallingMiddleware )
    } )


    test( 'mcpTools object is empty initially', async () => {
        const { validMcpServer, validApiBearerToken, validApiRoutePath, validBaseUrl } = testConfig

        const result = await McpDynamicToolCallingMiddleware.create( {
            mcpServer: validMcpServer,
            apiBearerToken: validApiBearerToken,
            apiRoutePath: validApiRoutePath,
            baseUrl: validBaseUrl,
            silent: true
        } )

        expect( Object.keys( result.mcpTools ) ).toHaveLength( 0 )
    } )


    test( 'returns different mcpTools objects for different calls', async () => {
        const { validMcpServer, validApiBearerToken, validApiRoutePath, validBaseUrl } = testConfig

        const result1 = await McpDynamicToolCallingMiddleware.create( {
            mcpServer: validMcpServer,
            apiBearerToken: validApiBearerToken,
            apiRoutePath: validApiRoutePath,
            baseUrl: validBaseUrl,
            silent: true
        } )

        const result2 = await McpDynamicToolCallingMiddleware.create( {
            mcpServer: validMcpServer,
            apiBearerToken: validApiBearerToken,
            apiRoutePath: validApiRoutePath,
            baseUrl: validBaseUrl,
            silent: true
        } )

        expect( result1.mcpTools ).not.toBe( result2.mcpTools )
        expect( result1.mcpDynamicToolCalling ).not.toBe( result2.mcpDynamicToolCalling )
    } )
} )