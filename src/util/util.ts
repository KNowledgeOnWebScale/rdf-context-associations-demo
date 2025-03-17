import { BlankNode, DataFactory, NamedNode, Quad_Graph, Quad_Object, Store, Triple } from "n3"
import { createVocabulary } from "rdf-vocabulary"

const { blankNode, namedNode, quad, defaultGraph } = DataFactory

const acceptedRDFContentTypes = [
	"application/trig",
	"application/n-quads",
	"text/turtle",
	"application/n-triples",
	"text/n3",
	"application/ld+json",
	"application/rdf+xml",
]

export async function isRDFResource(url: string) {
	const head = await fetch(url, {method: "HEAD"})
    const contentTypeHeader = head.headers.get('Content-Type') || "text/turtle"
    const breakpoint = /;\s*charset=/
    const contentType = contentTypeHeader?.split(breakpoint)[0]
    // const charset = contentTypeHeader?.split(breakpoint)[1]
	return !!contentType && acceptedRDFContentTypes.includes(contentType)
}



export const POLICY = createVocabulary(
    'https://example.org/policy#',
    'Policy',
    'permission',
    'constraint',
    'leftOperand',
    'purpose',
    'rightOperand',
    'target',
    'assigner',
    'Constraint',

);
  
export const SIGNATURE = createVocabulary(
    'https://example.org/signature#',
    "DataIntegrityProof",
    "created",
    "issuer",
    "cryptosuite",
    "verificationMethod",
    "proofPurpose",
    "proofValue",
    "contentManipulation",
    "target",
    "hashMethod",
    "canonicalizationMethod",
    );

export const PROVENANCE = createVocabulary(
    'https://example.org/provenance#',
    'author',
    'origin',
    'timestamp',
    );


export const DPV = createVocabulary(
    "https://w3id.org/dpv#",
    "Purpose",
    "Personalisation",
    "ServiceProvision",
    "Marketing"
)


export function renameAllGraphsInStore(store: Store, strategy?: (graphName: Quad_Graph) => 
    { graphName: NamedNode | BlankNode, metadata?: Triple[] }, options?: { namePredicate?: string, origin?: string }) {
        
    const storeGraphs = store.getGraphs(null, null, null)
    const graphList = [... new Set(storeGraphs)]
    const metadataGraphId = blankNode();

    const defaultStrategy = () => { 
        const bn = blankNode();
        return  { graphName: bn } 
    }
    let newDefaultGraph: undefined | NamedNode | BlankNode;
    
    if (!strategy) strategy = defaultStrategy

    for (let graphTerm of graphList) {
        if (graphTerm.equals(DataFactory.defaultGraph())) continue
        const { graphName, metadata } = strategy(graphTerm)
        const { graph } = renameGraph(store, graphTerm, graphName)
        if (metadata) store.addQuads(metadata.map(t => quad(t.subject, t.predicate, t.object, metadataGraphId)));
        if (options?.namePredicate && graphTerm.termType === "NamedNode") {
            store.addQuad(graph, namedNode(options.namePredicate), graphTerm as Quad_Object, metadataGraphId)
        }
        if (options?.origin) {
            store.addQuad(graph, namedNode(PROVENANCE.origin), namedNode(options.origin), metadataGraphId)
        }
        newDefaultGraph = graph
    }
    // convert default graph
    if (store.getQuads(null, null, null, defaultGraph())?.length) {
        const { graphName, metadata } = strategy(defaultGraph())
        const { graph } = renameGraph(store, defaultGraph(), graphName)
        if (metadata) store.addQuads(metadata.map(t => quad(t.subject, t.predicate, t.object, metadataGraphId)));
        if (options?.origin) {
            store.addQuad(graph, namedNode(PROVENANCE.origin), namedNode(options.origin), metadataGraphId)
        }
        newDefaultGraph = graph
    }

    return { store, defaultGraph: newDefaultGraph }
}


/**
 * renames graph for all quads containing the graph as the graph name, as well as all quads containing the graph as a subject or object value
 * @param store 
 * @param source 
 * @param target 
 * @param retainOriginal 
 * @returns 
 */
export function renameGraph( store: Store, source: Quad_Graph, target?: NamedNode | BlankNode, retainOriginal?: boolean  ) {
    target = target || blankNode()
    retainOriginal = !!retainOriginal

    // rename graph at graph position
    const matchingQuads = store.match(null, null, null, source)
    for (const matchedQuad of matchingQuads) {
        store.addQuad(quad(matchedQuad.subject, matchedQuad.predicate, matchedQuad.object, target))
        if (!retainOriginal) store.removeQuad(matchedQuad)
    }

    // rename graph at object position
    const matchingQuads2 = store.match(null, null, source, null)
    for (const matchedQuad of matchingQuads2) {
        store.addQuad(quad(matchedQuad.subject, matchedQuad.predicate, target, matchedQuad.graph))
        if (!retainOriginal) store.removeQuad(matchedQuad)
    }
    
    // rename graph at subject position
    const matchingQuads3 = store.match(source, null, null, null)
    for (const matchedQuad of matchingQuads3) {
        store.addQuad(quad(target, matchedQuad.predicate, matchedQuad.object, matchedQuad.graph))
        if (!retainOriginal) store.removeQuad(matchedQuad)
    }
    return { store, graph: target}   
}

