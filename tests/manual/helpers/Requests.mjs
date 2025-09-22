class Requests {
    static async runTest( { apiBearerToken, baseUrl, apiRoutePath } ) {
        const url = `${baseUrl}${apiRoutePath}`

        console.log( '\n' + '='.repeat( 80 ) )
        console.log( ' DYNAMIC TOOL MANAGEMENT TEST' )
        console.log( '='.repeat( 80 ) )
        console.log( ` Target URL:           ${url}` )
        console.log( ` Bearer Token:         ${apiBearerToken.substring( 0, 4 )}****` )
        console.log( '='.repeat( 80 ) + '\n' )

        try {
            // Step 1: List all tools
            console.log( '1. Listing all tools...' )
            const { requestPayload: listPayload } = Requests.getListToolsPayload( { url, bearerToken: apiBearerToken } )
            const listResponse = await Requests.makeRequest( listPayload )
            console.log( '>>>', listResponse)

            if( !listResponse.success || !listResponse.tools || listResponse.tools.length === 0 ) {
                throw new Error( 'No tools available for testing' )
            }

            const toolId = listResponse.tools[ 0 ].routeId
            console.log( `   Found ${listResponse.totalTools} tools. Testing with: ${toolId}` )

            // Step 2: Disable the tool
            console.log( '\n2. Disabling tool...' )
            const { requestPayload: disablePayload } = Requests.getDisableToolPayload( { url, bearerToken: apiBearerToken, toolId } )
            const disableResponse = await Requests.makeRequest( disablePayload )
            console.log( `   Tool disabled: ${disableResponse.success}` )

            await Requests.#waitSeconds( { seconds: 5 } )
            await Requests.#waitSeconds( { seconds: 5 } )

            // Step 3: Enable the tool again
            console.log( '\n3. Enabling tool...' )
            const { requestPayload: enablePayload } = Requests.getEnableToolPayload( { url, bearerToken: apiBearerToken, toolId } )
            const enableResponse = await Requests.makeRequest( enablePayload )
            console.log( `   Tool enabled: ${enableResponse.success}` )

            await Requests.#waitSeconds( { seconds: 5 } )

            // Step 4: Update the tool (title change)
            console.log( '\n4. Updating tool title...' )
            const { requestPayload: updatePayload } = Requests.getUpdateToolPayload( { url, bearerToken: apiBearerToken, toolId, title: 'Updated Tool Title' } )
            const updateResponse = await Requests.makeRequest( updatePayload )
            console.log( `   Tool updated: ${updateResponse.success}` )


            // Step 5: Remove the tool
            console.log( '\n5. Removing tool...' )
            const { requestPayload: removePayload } = Requests.getRemoveToolPayload( { url, bearerToken: apiBearerToken, toolId } )
            const removeResponse = await Requests.makeRequest( removePayload )
            console.log( `   Tool removed: ${removeResponse.success}` )

            await Requests.#waitSeconds( { seconds: 5 } )

            console.log( '\n' + '='.repeat( 80 ) )
            console.log( ' TEST COMPLETED SUCCESSFULLY' )
            console.log( '='.repeat( 80 ) + '\n' )

            return { success: true }

        } catch( error ) {
            console.error( '\n' + '='.repeat( 80 ) )
            console.error( ' TEST FAILED' )
            console.error( '='.repeat( 80 ) )
            console.error( ` Error: ${error.message}` )
            console.error( '='.repeat( 80 ) + '\n' )

            return { success: false, error: error.message }
        }
    }


    static async makeRequest( { method = 'GET', url, bearerToken, body = null } ) {
        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${bearerToken}`,
                'Content-Type': 'application/json'
            }
        }

        if( body !== null && method !== 'GET' ) {
            options.body = JSON.stringify( body )
        }

        try {
            const response = await fetch( url, options )

            if( !response.ok ) {
                const errorText = await response.text()
                throw new Error( `HTTP ${response.status}: ${errorText}` )
            }

            const data = await response.json()

            return data

        } catch( error ) {
            if( error.message.includes( 'fetch' ) ) {
                throw new Error( `Network error: ${error.message}` )
            }
            throw error
        }
    }


    static async #waitSeconds( { seconds } ) {
        console.log( `   Waiting ${seconds} seconds...` )
        await new Promise( ( resolve ) => setTimeout( resolve, seconds * 1000 ) )
    }


    static getListToolsPayload( { url, bearerToken } ) {
        const requestPayload = {
            method: 'GET',
            url,
            bearerToken
        }

        return { requestPayload }
    }


    static getDisableToolPayload( { url, bearerToken, toolId } ) {
        const requestPayload = {
            method: 'POST',
            url,
            bearerToken,
            body: {
                routeId: toolId,
                toolCommand: 'disable',
                options: {}
            }
        }

        return { requestPayload }
    }


    static getEnableToolPayload( { url, bearerToken, toolId } ) {
        const requestPayload = {
            method: 'POST',
            url,
            bearerToken,
            body: {
                routeId: toolId,
                toolCommand: 'enable',
                options: {}
            }
        }

        return { requestPayload }
    }


    static getUpdateToolPayload( { url, bearerToken, toolId, title } ) {
        const requestPayload = {
            method: 'POST',
            url,
            bearerToken,
            body: {
                routeId: toolId,
                toolCommand: 'update',
                options: {
                    title
                }
            }
        }

        return { requestPayload }
    }


    static getRemoveToolPayload( { url, bearerToken, toolId } ) {
        const requestPayload = {
            method: 'POST',
            url,
            bearerToken,
            body: {
                routeId: toolId,
                toolCommand: 'remove',
                options: {}
            }
        }

        return { requestPayload }
    }
}


export { Requests }