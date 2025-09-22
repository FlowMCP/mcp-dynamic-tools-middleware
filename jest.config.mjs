export default {
    testEnvironment: 'node',
    transform: {},
    testMatch: [
        '**/tests/**/*.test.mjs'
    ],
    collectCoverageFrom: [
        'src/**/*.mjs'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: [
        'text',
        'lcov',
        'html'
    ],
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70
        }
    }
}