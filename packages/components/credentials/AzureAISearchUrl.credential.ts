import { INodeParams, INodeCredential } from '../src/Interface'

class AzureAISearchUrl implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'Azure AISearch'
        this.name = 'azureAISearchUrl'
        this.version = 1.0
        this.inputs = [
            {
                label: 'Azure AISearch Endpoint',
                name: 'endpoint',
                type: 'string'
            },
            {
                label: 'API Key',
                name: 'apikey',
                type: 'string',
                placeholder: '<AZUREAISEARCH_APIKEY>',
                optional: true
            }
        ]
    }
}

module.exports = { credClass: AzureAISearchUrl }
