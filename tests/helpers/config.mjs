import { jest } from '@jest/globals'


export const testConfig = {
    validMcpServer: {
        registerTool: jest.fn()
    },
    validMcpTools: {},
    validApiBearerToken: 'test-bearer-token-12345',
    validApiRoutePath: '/api/tools',
    validBaseUrl: 'http://localhost:3000',
    mockExpress: {
        Router: jest.fn( () => ( {
            post: jest.fn(),
            get: jest.fn()
        } ) )
    }
}