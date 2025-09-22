import { McpDynamicToolCallingMiddleware } from '../../src/index.mjs'
import { ConfigExamples } from './helpers/ConfigExamples.mjs'


const config = {
    'silent': false,
    'envPath': '../../../../.auth.env',
    'apiRoutePath': '/api/tools/manage',
    'mcpRoutePath': '/'
}

const { silent, envPath, mcpRoutePath, apiRoutePath } = config
const configExamples = new ConfigExamples( { envPath, mcpRoutePath, silent } )
const { serverPort, app, mcpServer, apiBearerToken, baseUrl } = configExamples
    .getState()
const { mcpType } = configExamples
    .parseUserInput( { argv: process.argv } )
const { tools } = await configExamples
    .getTools( { mcpType, apiBearerToken } )

// M-C-P--D-Y-N-A-M-I-C--T-O-O-L--C-A-L-L-I-N-G-------
const { mcpTools, mcpDynamicToolCalling } = await McpDynamicToolCallingMiddleware
    .create( { mcpServer, apiBearerToken, apiRoutePath, baseUrl, silent } )
app.use( mcpDynamicToolCalling.router() )
// ----------------------------------------------------

// Start the MCP server and fill mcpTools
const { arrayOfMcpTools } = await configExamples
    .runServer( { serverPort, mcpType, tools } )

// Update mcpTools reference in the middleware
Object.assign( mcpTools, ...arrayOfMcpTools )
