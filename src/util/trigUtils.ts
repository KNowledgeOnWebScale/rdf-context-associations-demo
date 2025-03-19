import { DataFactory, Parser, Quad, Quad_Subject, Store, Writer, Quad_Object, Quad_Graph, BlankNode } from 'n3'
import type * as rdf from 'rdf-js'
import { RDF } from '@inrupt/vocab-common-rdf'
import { rdfDereferencer } from "rdf-dereference";


const { namedNode, blankNode, quad } = DataFactory

export type TrigString = string
export type TrigPackage = rdf.Quad[]
export type TrigPackageString = TrigString

export async function serializeTrigFromStore (store: Store, beautifyList?: boolean): Promise<string> {
    
    const listStore = new Store()
    const listBases: Quad_Subject[] = []

    return await new Promise((resolve, _reject) => {
        const writer = new Writer({ format: 'application/trig' })
        for (let quad of store.getQuads(null, null, null, null)) {
            if (beautifyList) {
                if(quad.predicate.equals(DataFactory.namedNode(RDF.first))) {
                    listStore.addQuad(quad)
                    listBases.push(quad.subject)
                } else if (quad.predicate.equals(DataFactory.namedNode(RDF.rest))) {
                    listStore.addQuad(quad)
                } else {
                    writer.addQuad(quad)
                }
            } else {
                writer.addQuad(quad)
            }            
        }
        writer.end((error: any, result: any) => {
            if (error) {
                throw new Error('Could not serialize package string correctly')
            } else if (!result) {
                resolve('')
            }
            let trigString = indentTrigString(result as string)
            if(beautifyList) {
                for (let base of listBases) {
                    const unpacked = unpackRDFList(listStore, base)
                    const regex = new RegExp(base.id || base.value) /*+"[^a-zA-Z0-9]") */ // why did I add this?
                    trigString = trigString.replace(regex, serializeRDFList(unpacked))
                }
            }            
            resolve(trigString)
        })
    })
}

export function parseRDFToStore (content: string, format: string): Store {
    const store = new Store();
    store.addQuads(new Parser({ format }).parse(content))
    return store 
}

export function parseTrigToStore (content: string): Store {
    const store = new Store();
    store.addQuads(new Parser({ format: 'application/trig' }).parse(content))
    return store 
}

function indentTrigString (trigString: TrigString): TrigString {
    let result = ''
    const indent = '\t'
    let indented = false
    for (let line of trigString.split('\n')) {
        line = line.replace(/\s\s+/g, '\t')
        if (line.includes('{')) {
            indented = true
            result += line + '\n'
        } else if (line.includes('}')) {
            indented = false
            result += line + '\n'
        } else {
            result += indented ? indent + line + '\n' : line + '\n'
        }
    }
    return result.trimEnd()
}

function serializeRDFList(items: Quad_Object[]) {
    let str = "("
    for (let item of items) {
        str += " "+(item.id || item.value).toString()
    }
    str += ` )`;
    return str
}



export function unpackRDFList(store: Store, base: Quad_Subject, graph?: Quad_Graph | null): Quad_Object[] {
    graph = graph || null
    const first = store.getQuads(base, RDF.first, null, graph).map((q:Quad) => q.object)
    const rest = store.getQuads(base, RDF.rest, null, graph).map((q:Quad) => q.object)
    if (first.length && first.length !== 1) { 
        throw new Error(`Malformed list at first value for base ${base.value}`) 
    }
    if (rest.length && rest.length !== 1) {
        throw new Error(`Malformed list at rest value for base ${base.value}`) 
    }
    if (rest[0].equals(namedNode(RDF.nil))) return [ first[0] ]
    else return [ first [0] ].concat(unpackRDFList(store, rest[0] as Quad_Subject, graph))
}



export function createRDFList(terms: Quad_Object[], graph?: Quad_Graph): { subject: BlankNode | undefined, quads: Quad[]} {
    const quads: Quad[] = [];

    let list;
    let first;
    let rest: Quad_Object = namedNode(RDF.nil);

    for (let i = terms.length-1; i >= 0; i--) {
        list = blankNode();
        first = terms[i]
        // push rest
        quads.push(quad(list, namedNode(RDF.rest), rest, graph))
        // push first
        quads.push(quad(list, namedNode(RDF.first), first as Quad_Object, graph))
        rest = list;
    }
        
    return { subject: list, quads: quads, };
}

export async function getResourceAsStore(url: string): Promise<Store> {
    return new Promise(async (resolve, reject) => {
        const store = new Store()
        const { data } = await rdfDereferencer.dereference(url);
        data.on('data', (quad) => store.addQuad(quad))
        .on('error', (error) => reject(error))
        .on('end', () => resolve(store));
    })
}


export async function getResourceAsQuadArray(url: string): Promise<Quad[]> {
    return new Promise(async (resolve, reject) => {
        const quads: Quad[] = []
        const { data } = await rdfDereferencer.dereference(url);
        data.on('data', (quad) => quads.push(quad))
        .on('error', (error) => reject(error))
        .on('end', () => resolve(quads));
    })
}