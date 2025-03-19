
// import { getResourceAsStore } from "@dexagod/rdf-retrieval";
import { DataFactory, Store, Quad, NamedNode, Triple, BlankNode } from "n3";
import { isRDFResource, PROVENANCE } from "./util";
import { getResourceAsQuadArray } from "./trigUtils";
import { SignatureOptions, tryCreateGraphSignature } from "./signature/sign";
import { XSD } from "@inrupt/vocab-common-rdf";
import { createSimplePolicy } from "./policy";
// import { checkContainmentType, ContainmentType, createDatasetQuads, createProvenanceTriples, createSimplePolicy, log, renameAllGraphsInStore } from "../..";
// import { SignatureOptions } from "../../signature/sign";
// import { FocusRDFStore, getTargetResourceURI, PublicSignatureOptions, Session, tryCreateDatasetSignature, tryCreateGraphSignature, tryCreateRemoteRDFResourceSignature, tryCreateRemoteResourceSignature } from "./Builder";

// import { Quad_Graph, Quad_Object } from "rdf-js"
// import { DataFactory } from "../../";

const log = console.log
const { namedNode, blankNode, quad, literal, triple } = DataFactory;


export class Builder {

    private session: undefined | Session;
    private signatureOptions?: SignatureOptions;
    private cachedMappings: Map<string, BlankNode> = new Map();
    
    constructor(signatureOptions?: PublicSignatureOptions) {
        if (signatureOptions) this.signatureOptions = {
            privateKey: signatureOptions.privateKey,
            issuer: namedNode(signatureOptions.issuer),
            verificationMethod: signatureOptions.verificationMethod,
        }
        this.session = undefined;
    }

    startSession(store?: Store): Builder {
        if (this.session !== undefined) throw new Error('Commit the previous session before opening a new one.')
        this.session = new Session(store)
        return this
    }

    async commit() {
        if (this.session === undefined) throw new Error('Cannot commit empty session.')
        const committedFocusStore = await this.session.commitToStore()
        const combinedStore = committedFocusStore.getStore()
        return combinedStore
    }

    loadRDF(url: string, interpretQuadAsOrigin?: boolean): Builder {
        if (!this.session) { 
            log({ level: "info", message: 'No session found, starting new session!' })
            this.startSession()
            return this.loadRDF(url)
        }
        const loadRDFResourceTask = async (store: FocusRDFStore): Promise<FocusRDFStore> => {
            if (! await isRDFResource(url)) throw new Error('Cannot load non-rdf resources as RDf.')
            let loadedQuads = await (getResourceAsQuadArray(url)) as Quad[];
            
            let graphName: BlankNode;
            for (let loadedQuad of loadedQuads) {
                const graph = loadedQuad.graph
                const bngName = this.cachedMappings.get(graph.value)
                if (graph.termType === "NamedNode") {
                    if (!bngName) {
                        graphName = blankNode()
                        // directly add metadata to metadata graph
                        this.cachedMappings.set(graph.value, graphName)
                        if(interpretQuadAsOrigin) {
                            store.addMetadataTriples([triple(graphName, namedNode(PROVENANCE.origin), graph as NamedNode)])
                        }
                    } else { graphName = bngName; }
                } else {
                    if (!bngName) {
                        graphName = blankNode()
                        this.cachedMappings.set(graph.value, graphName)
                    } else { graphName = bngName; }
                }
                store.addQuads([quad(loadedQuad.subject, loadedQuad.predicate, loadedQuad.object, graphName)])
            }
            // let r = renameAllGraphsInStore(resStore, undefined, { namePredicate: options?.namePredicate, origin: url })
            // // r.defaultGraph = the new renamed default graph blank node identifier
            // store.addQuads( r.store.getQuads(null, null, null, null), r.defaultGraph  )
            return store;
        }
        this.session.addAsyncTask(loadRDFResourceTask)
        return this
    }

    signData(): Builder {
        if (!this.session) { log({ level: "info", message: 'no session found, nothing to sign!' }); return this; }
        if (!this.signatureOptions) { log({ level: "error", message: 'Cannot create signature, incomplete signatureOptions parameter!' }); return this; }

        const signRDFContents = async (store: FocusRDFStore): Promise<FocusRDFStore> => {
            if (!this.signatureOptions) throw new Error('Not all information provided to create valid signatures.')
            const dataGraphs = store.getDataGraphs();
            if (!dataGraphs.length) { log({ level: "warn", message: 'Cannot create signature when no data is added first!'}); return store; }
            
            for (let dataGraph of dataGraphs) {
                const signatureTriples = await tryCreateGraphSignature(store.getStore(), dataGraph, this.signatureOptions)
                if(!signatureTriples) { log({ level: "warn", message: 'Cannot create signature, data processing failed!'}); return store; }
                store.addMetadataTriples(signatureTriples)
            }
            return store
        }
        this.session.addAsyncTask(signRDFContents)
        return this
    }

    signMetaData(): Builder {
        if (!this.session) { log({ level: "info", message: 'no session found, nothing to sign!' }); return this; }
        if (!this.signatureOptions) { log({ level: "error", message: 'Cannot create metadata signature, incomplete signatureOptions parameter!' }); return this; }

        const signRDFContents = async (store: FocusRDFStore): Promise<FocusRDFStore> => {
            if (!this.signatureOptions) throw new Error('Not all information provided to create valid signatures.')
            const metadataGraph = store.getMetadataGraph();
            if (!metadataGraph) { log({ level: "warn", message: 'Cannot create signature when no data is added first!'}); return store; }
            
            // Close metadata graph we are going to sign
            store.closeMetadataGraph()
            
            // Sign metadata graph
            const signatureTriples = await tryCreateGraphSignature(store.getStore(), metadataGraph, this.signatureOptions)
            if(!signatureTriples) { log({ level: "warn", message: 'Cannot create signature, data processing failed!'}); return store; }
            store.addMetadataTriples(signatureTriples)
        
            return store
        }
        this.session.addAsyncTask(signRDFContents)
        return this
    }


    // signMetadata

    policy(options: {duration?: string, purpose?: string[], assigner?: string, assignee?: string}): Builder {
        let {duration, purpose, assigner, assignee} = options
        if (!this.session) { log({ level: "info", message: 'no session found, nothing to set policy over!'}); return this; }

        const createPolicy = async (store: FocusRDFStore): Promise<FocusRDFStore> => {
            const dataGraphs = store.getDataGraphs();
            if (!dataGraphs.length) { log({ level: "warn", message: 'Cannot create signature when no data is present!'}); return store; }
            // We merge all targets as a single policy
            const pol = createSimplePolicy({
                targets: dataGraphs, 
                duration: duration, 
                purpose: purpose || undefined,
                assigner,
                assignee
            })
            store.addMetadataTriples(pol.triples)
            return store
        }
        this.session.addAsyncTask(createPolicy)
        return this        
    }

    provenance(options?: { origin?: string, author?: string }): Builder {
        if (!this.session) { log({ level: "info", message: 'no session found, nothing to add provenance over!'}); return this; }
        
        const origin = options && options.origin && namedNode(options.origin)
        const author = options && options.author && namedNode(options.author);

        const addProvenance = async (store: FocusRDFStore): Promise<FocusRDFStore> => {
            const hasData = store.getDataGraphs().length;
            if (!hasData) { log({ level: "warn", message: 'Cannot create provenance without first adding data!'}); return store; }

            const timestamp = new Date().toISOString()

            for (let dataGraph of store.getDataGraphs()) {
                store.addMetadataTriples([ triple(dataGraph, namedNode(PROVENANCE.timestamp), literal(timestamp, namedNode(XSD.dateTime)), ) ])
                const metadataGraph = store.getMetadataGraph();
                if (origin && !store.getStore().getQuads(dataGraph, namedNode(PROVENANCE.origin), null, metadataGraph || null).length){
                    store.addMetadataTriples([ quad(dataGraph, namedNode(PROVENANCE.origin), origin) ])
                } 
                if (author) {
                    store.addMetadataTriples([ quad(dataGraph, namedNode(PROVENANCE.author), author) ])
                }
            }
            return store
        }
        this.session.addAsyncTask(addProvenance)
        return this        
    }
}



export class FocusRDFStore {

    private store: Store;
    private currentGraph: BlankNode | undefined;
    private dataGraphs: Set<BlankNode> = new Set();
    private metadataGraph: BlankNode | undefined;

    constructor(store?: Store, _untrackedStore?: Store) {
        this.store = store || new Store();
    }

    openGraph() {
        this.currentGraph = blankNode()
        this.dataGraphs.add(this.currentGraph)
    }

    closeGraph() {
        this.currentGraph = undefined
    }

    addTriples(triples: Triple[]) {
        if (!this.currentGraph) {
            this.openGraph();
            this.addTriples(triples);
        }
        this.store.addQuads(triples.map(( t: Triple ) => 
            quad(t.subject, t.predicate, t.object, this.currentGraph)))
    }

    addQuads(quads: Quad[]) {
        this.store.addQuads(quads)
        for (let q of quads) {
            this.dataGraphs.add(q.graph as BlankNode)
        }
    }

    addMetadataTriples(triples: Triple[]) {
        if (!this.metadataGraph) {
            this.metadataGraph = blankNode()
        }
        this.store.addQuads(triples.map(t => quad(t.subject, t.predicate, t.object, this.metadataGraph)))
    }

    closeMetadataGraph(){
        this.metadataGraph = undefined
    }
    
    getStore() { return this.store }
    
    getDataGraphs() { return [ ...new Set(this.dataGraphs)] }

    getMetadataGraph() { return this.metadataGraph }
    
    getCurrentGraph() { return this.currentGraph }
}

export class Session {

    // store: Store  
    private taskList: ((store: FocusRDFStore) => Promise<FocusRDFStore>)[]
    // private focusNode: Term | undefined;
    private store: Store | undefined

    constructor(store?: Store) {
        // this.store = new Store()[]
        this.taskList = []
        // this.focusNode = undefined;
        this.store = store
    }

    addAsyncTask(task: (store: FocusRDFStore) => Promise<FocusRDFStore>) {
        this.taskList.push(task)
    }

    async commitToStore() {
        let store = new FocusRDFStore(this.store);
        for (let task of this.taskList) {
            store = await task(store)
        }

        return store
    }
}

export type PublicSignatureOptions = {
    privateKey: CryptoKey, 
    issuer: string, 
    verificationMethod: string,
}


export interface ProvenanceInfo {
    origin?: NamedNode, 
    issuer?: NamedNode,
    target: NamedNode | BlankNode
}

export function createProvenanceTriples( provenanceInfo: ProvenanceInfo ){
    const { origin, issuer, target } = provenanceInfo
    if (!origin && !issuer) return { subject: target, triples: [] }

    const timestamp = new Date().toISOString()
    const provenanceGraph: Triple[] = []
    if (origin) provenanceGraph.push(quad(target, namedNode(PROVENANCE.origin), origin))
    if (issuer) provenanceGraph.push(quad(target, namedNode(PROVENANCE.author), issuer))
    provenanceGraph.push(quad(target, namedNode(PROVENANCE.timestamp), literal(timestamp, namedNode(XSD.dateTime))))

    return { subject: target, triples: provenanceGraph }
}

