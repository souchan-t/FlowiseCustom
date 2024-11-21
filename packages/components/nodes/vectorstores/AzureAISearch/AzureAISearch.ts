import { flatten } from 'lodash'
import { Document } from '@langchain/core/documents'
import { AzureAISearchQueryType, AzureAISearchVectorStore } from '@langchain/community/vectorstores/azure_aisearch'
import { Embeddings } from '@langchain/core/embeddings'
import { ICommonObject, INode, INodeData, INodeOutputsValue, INodeParams, IndexingResult } from '../../../src/Interface'
import { getBaseClasses, getCredentialData, getCredentialParam } from '../../../src/utils'

class AzureAISearch_VectorStores implements INode {
    label: string
    name: string
    version: number
    description: string
    author: string
    type: string
    icon: string
    category: string
    badge: string
    baseClasses: string[]
    inputs: INodeParams[]
    outputs: INodeOutputsValue[]
    credential: INodeParams

    constructor() {
        this.label = 'Azure AISearch'
        this.name = 'azureAISearch'
        this.version = 1.0
        this.type = 'AzureAISearch'
        this.icon = 'Azure.svg'
        this.category = 'Vector Stores'
        this.description = `Upsert embedded data and perform similarity search upon query using Azure AISearch`
        this.author = 'souchan_t@hotmail.com'
        this.baseClasses = [this.type, 'VectorStoreRetriever', 'BaseRetriever']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['azureAISearchUrl']
        }
        this.inputs = [
            {
                label: 'Document',
                name: 'document',
                type: 'Document',
                list: true,
                optional: true
            },
            {
                label: 'Embeddings',
                name: 'embeddings',
                type: 'Embeddings'
            },
            {
                label: 'Index Name',
                name: 'indexName',
                type: 'string'
            },
            {
                label: 'Top K',
                name: 'topK',
                description: 'Number of top results to fetch. Default to 4',
                placeholder: '4',
                type: 'number',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Search Type',
                name: 'searchType',
                type: 'options',
                description: 'Search type, Default to similarity',
                options: [
                    { label: 'Similarity', name: 'similarity', description: '類似度検索' },
                    { label: 'Similarity_hybrid', name: 'similarity_hybrid', description: '類似度検索ハイブリッド' },
                    { label: 'semantic_hybrid', name: 'semantic_hybrid', description: 'セマンティック検索ハイブリッド' }
                ],
                additionalParams: true,
                optional: true
            }
        ]
        this.outputs = [
            {
                label: 'AzureAISearch Retriever',
                name: 'retriever',
                baseClasses: this.baseClasses
            },
            {
                label: 'AzureAISearch Vector Store',
                name: 'vectorStore',
                baseClasses: [this.type, ...getBaseClasses(AzureAISearchVectorStore)]
            }
        ]
    }

    //@ts-ignore
    vectorStoreMethods = {
        async upsert(nodeData: INodeData, options: ICommonObject): Promise<Partial<IndexingResult>> {
            const docs = nodeData.inputs?.document as Document[]
            const embeddings = nodeData.inputs?.embeddings as Embeddings
            const indexName = nodeData.inputs?.indexName as string

            const credentialData = await getCredentialData(nodeData.credential ?? '', options)
            const endpoint = getCredentialParam('endpoint', credentialData, nodeData)
            const key = getCredentialParam('apikey', credentialData, nodeData)

            const flattenDocs = docs && docs.length ? flatten(docs) : []
            const finalDocs = []
            for (let i = 0; i < flattenDocs.length; i += 1) {
                if (flattenDocs[i] && flattenDocs[i].pageContent) {
                    finalDocs.push(new Document(flattenDocs[i]))
                }
            }

            try {
                await AzureAISearchVectorStore.fromDocuments(finalDocs, embeddings, {
                    endpoint,
                    key,
                    indexName
                })
                return { numAdded: finalDocs.length, addedDocs: finalDocs }
            } catch (e) {
                throw new Error(e)
            }
        }
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const embeddings = nodeData.inputs?.embeddings as Embeddings
        const indexName = nodeData.inputs?.indexName as string
        const output = nodeData.outputs?.output as string
        const topK = nodeData.inputs?.topK as string
        const k = topK ? parseFloat(topK) : 4
        const searchTypeStr = nodeData.inputs?.searchType as string
        let searchType: AzureAISearchQueryType
        if (searchTypeStr == 'similarity') {
            searchType = AzureAISearchQueryType.Similarity
        } else if (searchTypeStr == 'similarity_hybrid') {
            searchType = AzureAISearchQueryType.SimilarityHybrid
        } else if (searchTypeStr == 'semantic_hybrid') {
            searchType = AzureAISearchQueryType.SemanticHybrid
        } else {
            searchType = AzureAISearchQueryType.Similarity
        }

        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const endpoint = getCredentialParam('endpoint', credentialData, nodeData)
        const key = getCredentialParam('apikey', credentialData, nodeData)

        const vectorStore = new AzureAISearchVectorStore(embeddings, {
            endpoint,
            key,
            indexName,
            search: {
                type: searchType
            }
        })

        if (output === 'retriever') {
            const retriever = vectorStore.asRetriever(k)
            return retriever
        } else if (output === 'vectorStore') {
            ;(vectorStore as any).k = k
            return vectorStore
        }
        return vectorStore
    }
}

module.exports = { nodeClass: AzureAISearch_VectorStores }
