import { Quad } from "rdf-js";
import { QueryEngine } from '@comunica/query-sparql'
import { Store } from "n3";

// export async function* evaluateQuery(targets: string[], query: string): AsyncGenerator<Quad, undefined, void> {
//     const myEngine = new QueryEngine();

//     const quadStream = await myEngine.queryQuads(query, {
//         sources: targets,
//     });

//     quadStream.on('data', (q: Quad) => yield(q) )
//     quadStream.on('error', (e: Error) => { throw(e) } )
//     quadStream.on('end', (q: Quad) => { return } )
// }


export async function evaluateQuerySync(targets: Store[], query: string): Promise<Quad[]> {
    const myEngine = new QueryEngine();

    return new Promise(async (resolve, reject) => {
        if (!targets.length) return;
        if (!query) return;

        const quads: Quad[] = []

        myEngine.queryQuads(query, {
            sources: (targets as [Store, ...Store[]]),
        }).then(stream => {
            stream 
                .on('data', (q: Quad) => quads.push(q) )
                .on('error', (e: Error) => { reject(e) } )
                .on('end', (_q: Quad) => { resolve(quads) } )
        })    
    })
}