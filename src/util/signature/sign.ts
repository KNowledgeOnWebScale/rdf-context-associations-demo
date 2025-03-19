import { Store, Quad_Graph, Quad_Object, Quad, DataFactory, Triple } from "n3"
import { RDF, XSD } from "@inrupt/vocab-common-rdf";
// import { webcrypto } from "crypto";
const { subtle } = globalThis.crypto;
import { SIGNATURE } from "../util";
import { RDFC10 } from "rdfjs-c14n";
import { Buffer } from "buffer"

const { namedNode, blankNode, literal, quad, defaultGraph } = DataFactory;

export const keyParams = {
    name: 'ECDSA',
    namedCurve: 'P-384',
};
export const signParams = {
    name: keyParams.name,
    hash: 'SHA-512',
};

export interface SignatureInfo {
    issuer: Quad_Object,
    proofValue: string,
    verificationMethod: string,
    cryptoSuite: string,
    target: Quad_Object,
    hashMethod: string,
    canonicalizationMethod?: string,
}

export interface SignatureOptions {
    privateKey: CryptoKey, 
    issuer: Quad_Object, 
    verificationMethod: string,
}


export function addSignatureGraphToStore( store: Store, signature: Triple[], graph?: Quad_Graph) {
    
    // Create graph to store signature information
    graph = graph || blankNode();
    store.addQuads(signature.map(t => quad(t.subject, t.predicate, t.object, graph)))   

    return { store, graph }
}

export function createSignatureTriples( signature: SignatureInfo ) {
    const { issuer, verificationMethod, cryptoSuite, proofValue, target, hashMethod, canonicalizationMethod } = signature;
    const signatureSubject = blankNode();
    const contentManipulationSubject = blankNode()

    const signatureTriples = [
        quad(signatureSubject, namedNode(RDF.type), namedNode(SIGNATURE.DataIntegrityProof)),
        quad(signatureSubject, namedNode(SIGNATURE.created), literal(new Date().toISOString(), namedNode(XSD.dateTime))),
        quad(signatureSubject, namedNode(SIGNATURE.issuer), issuer),
        quad(signatureSubject, namedNode(SIGNATURE.cryptosuite), literal(cryptoSuite)),
        quad(signatureSubject, namedNode(SIGNATURE.verificationMethod), namedNode(verificationMethod)),
        quad(signatureSubject, namedNode(SIGNATURE.proofPurpose), literal("assertionMethod")),
        quad(signatureSubject, namedNode(SIGNATURE.proofValue), literal(proofValue)),
        quad(signatureSubject, namedNode(SIGNATURE.target), target as Quad_Object),

        // Content manipulation
        quad(signatureSubject, namedNode(SIGNATURE.contentManipulation), contentManipulationSubject),
        quad(contentManipulationSubject, namedNode(SIGNATURE.hashMethod), literal(hashMethod) ),
    ]
    if (canonicalizationMethod) signatureTriples.push(
        quad(contentManipulationSubject, namedNode(SIGNATURE.canonicalizationMethod), literal(canonicalizationMethod) )
    )

    return { subject: signatureSubject, triples: signatureTriples }
}

/**
 * Note that signing the default graph is not possible. 
 * Fist create a new graph with the same contents to sign.
 * 
 * @param store 
 * @param target 
 * @param signatureOptions 
 * @returns 
 */
export async function createRDFGraphSignature( store: Store, target: Quad_Graph, signatureOptions: SignatureOptions) {
    // Throw error on signing the default graph
    if (target.equals(defaultGraph())) throw new Error('Invalid signature target: cannot sign the default graph.')

    // Extract graph quads
    const graphQuads = store.getQuads(null, null, null, target)
    // Create signature graph
    const signatureInfo = await createSignatureForQuadArray(graphQuads, target as Quad_Object, signatureOptions)
    
    return signatureInfo
}

async function createSignatureForQuadArray( quads: Quad[], target: Quad_Object, signatureOptions: SignatureOptions): Promise<SignatureInfo> {
    const { privateKey, issuer, verificationMethod } = signatureOptions;

    // Sign over graph quads
    const signature = await signQuads(quads, privateKey);

    return {
        issuer,
        proofValue: signature,
        verificationMethod: verificationMethod,
        cryptoSuite: keyParams.name, // todo: wtf do we do here?
        target,
        hashMethod: "SHA-512",
        canonicalizationMethod: "c14n",
    }
}

export async function createRemoteResourceSignature(url: string, signatureOptions: SignatureOptions) : Promise<SignatureInfo> {

    const {privateKey, issuer, verificationMethod} = signatureOptions;

    // create buffer from resource contents
    let content = await fetch(url)
    let contentBuffer = Buffer.from(await content.arrayBuffer())
    // hash content buffer using SHA-512
    // const hash = await webcrypto.subtle.digest(signParams.hash, contentBuffer)    
    const hash = await subtle.digest(signParams.hash, contentBuffer)    
    // const signature = (await webcrypto.subtle.sign(signParams, privateKey, hash))
    const signature = (await subtle.sign(signParams, privateKey, hash))
    const signatureString = Buffer.from(signature).toString('base64')
    
    return {
        issuer,
        proofValue: signatureString,
        verificationMethod: verificationMethod,
        cryptoSuite: keyParams.name,
        target: namedNode(url),
        hashMethod: signParams.hash,
    }
}


async function tryCreateSignature(promise: Promise<SignatureInfo>, errorMessage: string): Promise<Triple[] | undefined> {
    return new Promise<Quad[] | undefined>(async (resolve, reject) => {
        try {
            // todo:: this timeout makes it so that the whole system hangs when the signature is fulfilled
            const signatureInfo = await promiseWithTimeout(promise, 2000, new Error(errorMessage))
            const signatureTriples = createSignatureTriples(signatureInfo).triples
            // log({ level: "verbose", message: `creating signature graph with graph uri ${graph.value}`})
            resolve(signatureTriples)
        } catch (e) {
            // log({ level: "error", message: (e as Error).message })
            reject(e)
        }
    })
}


function promiseWithTimeout<T>(
    promise: Promise<T>,
    ms: number,
    timeoutError = new Error('Promise timed out')
  ): Promise<T> {
    // create a promise that rejects in milliseconds
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(timeoutError);
      }, ms);
    });
  
    // returns a race between timeout and the passed promise
    return Promise.race<T>([promise, timeout]);
}


export async function tryCreateGraphSignature(store: Store, graphId: Quad_Graph, signatureOptions: SignatureOptions): Promise<Triple[] | undefined> {
    console.log({ level: "verbose", message: `Generating signature for local graph: ${graphId.value}`})
    return await tryCreateSignature(
        createRDFGraphSignature(store, graphId, signatureOptions),
        `Signature generation for dataset ${graphId} timed out.`,
    )
}

export function importPrivateKey(key: JsonWebKey) {
    return subtle.importKey('jwk', key, keyParams, true, ['sign']);
}

async function signDataGraph(quads: Quad[], privateKey: CryptoKey) {
    const hash = await hashDataGraph(quads)
    const signature = await subtle.sign(signParams, privateKey, hash);
    return signature
}


export async function hashDataGraph(input: Quad[]) {
    const rdfc10 = new RDFC10(DataFactory);  

    // "normalized" is a dataset of quads with canonical blank node labels
    // per the specification. 
    // Alternatively, "input" could also be a string for a Turtle/TriG document
    const normalized = (await rdfc10.c14n(input)).canonicalized_dataset;
    // "hash" is the hash value of the canonical dataset, per specification
    const hash = await rdfc10.hash(normalized);

    return new TextEncoder().encode(hash); 
}

export async function signQuads(content: Quad[], privateKey: CryptoKey) {
    return Buffer.from(await signDataGraph(content, privateKey)).toString('base64');
  }