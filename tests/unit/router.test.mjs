import { jest } from '@jest/globals'
import request from 'supertest'
import express from 'express'
import { McpDynamicToolCallingMiddleware } from '../../src/index.mjs'
import { testConfig } from '../helpers/config.mjs'


describe( 'McpDynamicToolCallingMiddleware Router', () => {
    let app
    let middleware
    let consoleLogSpy


    beforeEach( () => {
        consoleLogSpy = jest.spyOn( console, 'log' ).mockImplementation()
        jest.clearAllMocks()

        const { validMcpTools, validMcpServer, validApiBearerToken, validApiRoutePath, validBaseUrl } = testConfig

        middleware = new McpDynamicToolCallingMiddleware( {
            mcpTools: validMcpTools,
            mcpServer: validMcpServer,
            apiBearerToken: validApiBearerToken,
            apiRoutePath: validApiRoutePath,
            baseUrl: validBaseUrl,
            silent: true
        } )

        app = express()
        app.use( express.json() )
        app.use( middleware.router() )
    } )


    afterEach( () => {
        consoleLogSpy.mockRestore()
    } )


    test( 'router() returns express router', () => {
        const router = middleware.router()

        expect( router ).toBeDefined()
        expect( typeof router ).toBe( 'function' )
    } )


    test( 'GET /api/tools returns 401 without bearer token', async () => {
        const response = await request( app )
            .get( '/api/tools' )

        expect( response.status ).toBe( 401 )
        expect( response.body ).toEqual( {
            error: 'Unauthorized',
            message: 'Bearer token required'
        } )
    } )


    test( 'GET /api/tools returns 401 with invalid bearer token', async () => {
        const response = await request( app )
            .get( '/api/tools' )
            .set( 'Authorization', 'Bearer invalid-token' )

        expect( response.status ).toBe( 401 )
        expect( response.body ).toEqual( {
            error: 'Unauthorized',
            message: 'Invalid bearer token'
        } )
    } )


    test( 'GET /api/tools returns tools list with valid bearer token', async () => {
        const { validApiBearerToken } = testConfig

        const response = await request( app )
            .get( '/api/tools' )
            .set( 'Authorization', `Bearer ${validApiBearerToken}` )

        expect( response.status ).toBe( 200 )
        expect( response.body ).toHaveProperty( 'success', true )
        expect( response.body ).toHaveProperty( 'totalTools', 0 )
        expect( response.body ).toHaveProperty( 'tools', [] )
    } )


    test( 'POST /api/tools returns 401 without bearer token', async () => {
        const response = await request( app )
            .post( '/api/tools' )
            .send( { routeId: 'test', toolCommand: 'enable' } )

        expect( response.status ).toBe( 401 )
        expect( response.body ).toEqual( {
            error: 'Unauthorized',
            message: 'Bearer token required'
        } )
    } )


    test( 'POST /api/tools returns 400 with missing routeId', async () => {
        const { validApiBearerToken } = testConfig

        const response = await request( app )
            .post( '/api/tools' )
            .set( 'Authorization', `Bearer ${validApiBearerToken}` )
            .send( { toolCommand: 'enable' } )

        expect( response.status ).toBe( 400 )
        expect( response.body ).toEqual( {
            error: 'Bad Request',
            message: 'routeId and toolCommand are required'
        } )
    } )


    test( 'POST /api/tools returns 400 with missing toolCommand', async () => {
        const { validApiBearerToken } = testConfig

        const response = await request( app )
            .post( '/api/tools' )
            .set( 'Authorization', `Bearer ${validApiBearerToken}` )
            .send( { routeId: 'test' } )

        expect( response.status ).toBe( 400 )
        expect( response.body ).toEqual( {
            error: 'Bad Request',
            message: 'routeId and toolCommand are required'
        } )
    } )


    test( 'POST /api/tools returns 500 with non-existent tool', async () => {
        const { validApiBearerToken } = testConfig

        const response = await request( app )
            .post( '/api/tools' )
            .set( 'Authorization', `Bearer ${validApiBearerToken}` )
            .send( { routeId: 'non-existent', toolCommand: 'enable' } )

        expect( response.status ).toBe( 500 )
        expect( response.body ).toHaveProperty( 'error', 'Internal Server Error' )
        expect( response.body.message ).toContain( 'non-existent' )
    } )


    test( 'POST /api/tools returns 500 with invalid toolCommand when tool exists', async () => {
        const { validApiBearerToken, validMcpTools } = testConfig

        // Add a mock tool to test invalid command validation
        validMcpTools['test-tool'] = {
            enable: jest.fn(),
            disable: jest.fn()
        }

        const response = await request( app )
            .post( '/api/tools' )
            .set( 'Authorization', `Bearer ${validApiBearerToken}` )
            .send( { routeId: 'test-tool', toolCommand: 'invalid-command' } )

        expect( response.status ).toBe( 500 )
        expect( response.body ).toHaveProperty( 'error', 'Internal Server Error' )
        expect( response.body.message ).toContain( 'Invalid toolCommand' )
    } )
} )