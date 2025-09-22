import { Requests } from './helpers/Requests.mjs'
import { ConfigExamples } from './helpers/ConfigExamples.mjs'


const config = {
    'envPath': '../../../../.auth.env',
    'mcpRoutePath': '/',
    'apiRoutePath': '/api/tools/manage'
}

const { envPath, mcpRoutePath, apiRoutePath } = config
const configExamples = new ConfigExamples( { envPath, mcpRoutePath } )
const { baseUrl, apiBearerToken } = configExamples
    .getState()
const testResult = await Requests
    .runTest( { apiBearerToken, baseUrl, apiRoutePath } )