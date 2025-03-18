import { Box, Button, FormControl, TextareaAutosize, Typography } from "@mui/material"
import { useState } from "react"
import { evaluateQuerySync } from "./util/query";
// import { Quad } from "rdf-js";
import { serializeTrigFromStore } from "./util/trigUtils";
import { Store } from "n3";
import { SignatureParams } from "./ProcessingInterface";


export type FitlerInput = {
    sources: string[],
    signingAuthor?: SignatureParams,
    origin?: string,
    purpose?: string,
}

const SPARQLFilterBox = (props: { input: FitlerInput }) =>  {
    const { sources, signingAuthor, purpose: inputPurpose } = props.input

    const [query, setQuery] = useState<string>('')
    // const [triples, setTriples] = useState<Quad[]>([])
    const [serialized, setSerialized] = useState<string>("")
        
    const executeQuery = async(query: string, sources: string[]) => {
        // for await (const triple of evaluateQuery(sources, query)) {
        //     // const newTriples = triples.concat( { triple: triple, metadata: undefined })
        //     // setTriples(newTriples)
        //     console.log(triple)
        // }
        
        const usedSources = sources.filter(s => !!s)
        const quads = await evaluateQuerySync(usedSources, query)
        console.log('quads', usedSources, quads)
        if (!quads || !quads.length) return "";
        const store = new Store()
        store.addQuads(quads)
        const outputTrig = await serializeTrigFromStore(store)
        console.log("output", outputTrig, quads)
        // setTriples(quads)
        setSerialized(outputTrig)
    }

    const filterSources = () => {
        const purpose: string | undefined = inputPurpose || undefined
        const author: string | undefined = (signingAuthor && signingAuthor.webId) || undefined
        const signature: boolean = !!signingAuthor;

//         let query = 
// `PREFIX ca: <https://w3id.org/context-associations#>
// PREFIX pol: <https://example.org/policy#>
// PREFIX sign: <https://example.org/signature#>
// PREFIX foaf: <http://xmlns.com/foaf/0.1/>
// PREFIX odrl: <http://www.w3.org/ns/odrl/2/>
// PREFIX oac: <https://w3id.org/oac#>
// PREFIX dpv: <http://www.w3i3.org/dpv#>

// CONSTRUCT { 
//   ?s ?p ?o . 
// } WHERE {
//   	GRAPH ?metadata {`;
// if(purpose) query +=
// `  		?policy a oWrl:Agreement;
//     		odrl:permission ?perm.
//     	?perm odrl:target ?dataGraph;
//     		odrl:action odrl:use;`;
// if(purpose && author) query +=
// `      		odrl:assigner <${author}>;`;
// if(purpose) query +=
// `          	odrl:constraint ?constraint.
//     	?constraint a odrl:Constraint;
//             odrl:leftOperand oac:Purpose;
//             odrl:operator odrl:eq;
//             odrl:rightOperand <${purpose}>.`;
// if(signature) query +=    
// `    	?signature a sign:DataIntegrityProof;`
// if(signature && author) query +=
// `			sign:issuer  <${author}>;`;
// if(signature) query +=    
// `  			sign:target ?dataGraph.`;
// query +=             
// `  	}
//     GRAPH ?dataGraph { ?s ?p ?o . }
// }`

let query = 
`PREFIX ca: <https://w3id.org/context-associations#>
PREFIX pol: <https://example.org/policy#>
PREFIX sign: <https://example.org/signature#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX odrl: <http://www.w3.org/ns/odrl/2/>
PREFIX oac: <https://w3id.org/oac#>
PREFIX dpv: <http://www.w3i3.org/dpv#>

CONSTRUCT { 
  ?s ?p ?o . 
} WHERE {
  	GRAPH ?metadata {
        ${(purpose && `?policy a odrl:Agreement;
    		odrl:permission ?perm.
    	?perm odrl:target ?dataGraph;
    		odrl:action odrl:use;
            ${(author && `odrl:assigner  <${author}>;`)||""}
          	odrl:constraint ?constraint.
    	?constraint a odrl:Constraint;
            odrl:leftOperand oac:Purpose;
            odrl:operator odrl:eq;
            odrl:rightOperand <${purpose}>.`
        )||""}
        ${(signature && `?signature a sign:DataIntegrityProof;
            ${(author && `sign:issuer  <${author}>;`)||""}
            sign:target ?dataGraph.`            
        )||""}
    }
    GRAPH ?dataGraph { ?s ?p ?o . }
}`

        executeQuery(query, sources)
        setQuery(query)
    }

    return (
        <Box>
            <br />
            <br />
            <FormControl fullWidth>
                <Box display="flex" gap={2}>
                    <Button fullWidth variant="contained" onClick={() => filterSources()}>Evaluate using SPARQL</Button>
                </Box>
                <br />
            </FormControl>

            {/* TODO Show SPARQL query used to filter sources */}

            <br />
            <Typography variant="h5">Filter Query</Typography>
            <br />
            
            <FormControl fullWidth>
                <TextareaAutosize minRows={8} maxRows={20} value={query} />
            </FormControl>
            
            <br />
            <Typography variant="h5">Contextualized output</Typography>
            <br />

            <FormControl fullWidth>
                <TextareaAutosize minRows={8} maxRows={20} value={serialized}/>
            </FormControl>
        </Box>
    )

}

export default SPARQLFilterBox





// Example SPARQL Query
/**
PREFIX po: <http://purl.org/ontology/po/>
PREFIX ca: <https://w3id.org/context-associations#>
PREFIX prov: <https://example.org/provenance#>
PREFIX pol: <https://example.org/policy#>
PREFIX sign: <https://example.org/signature#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX odrl: <http://www.w3.org/ns/odrl/2/>
PREFIX oac: <https://w3id.org/oac#>
PREFIX dpv: <http://www.w3i3.org/dpv#>

CONSTRUCT { 
  ?s ?p ?o . 
} WHERE {
  
  	GRAPH ?metadata {
  		?policy a odrl:Agreement;
    		odrl:permission ?perm.
    	?perm odrl:target ?dataGraph;
    		odrl:action odrl:use;
      		odrl:assigner <https://publicpod.rubendedecker.be/josd/profile/card#me>;
          	odrl:constraint ?constraint.
    	?constraint a odrl:Constraint;
                 odrl:leftOperand oac:Purpose;
                 odrl:operator odrl:eq;
                 odrl:rightOperand <https://w3id.org/dpv#ServiceProvision>.
    
    
    	?signature a sign:DataIntegrityProof;
			sign:issuer  <https://publicpod.rubendedecker.be/josd/profile/card#me>;
   			sign:target ?dataGraph.
  	}
    GRAPH ?dataGraph { ?s ?p ?o . }
}

 */