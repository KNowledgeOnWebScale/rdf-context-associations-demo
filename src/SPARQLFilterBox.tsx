import { Box, Button, FormControl, TextareaAutosize, Typography } from "@mui/material"
import { useEffect, useState } from "react"
import { evaluateQuerySync } from "./util/query";
import { Quad } from "rdf-js";
import { serializeTrigFromStore } from "./util/trigUtils";
import { Store } from "n3";

const SPARQLFilterBox = (props: { sources: string[] }) =>  {
    const { sources } = props

    const [query, setQuery] = useState<string>('')
    const [triples, setTriples] = useState<Quad[]>([])
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
        setTriples(quads)
        setSerialized(outputTrig)
    }

    const filterSources = () => {
        const purpose: string | undefined = ""
        const author: string | undefined = ""

        let query = 
`PREFIX po: <http://purl.org/ontology/po/>
PREFIX ca: <https://w3id.org/context-associations#>
PREFIX prov: <https://example.org/provenance#>
PREFIX pol: <https://example.org/policy#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
CONSTRUCT { ?s ?p ?o . } WHERE {
    GRAPH ?metadataGraph { 
        ?dataGraph a ca:GraphIdentifier;
        prov:origin <http://dataspace.org/ruben/resource1>.
`;
if (purpose)
query +=`
        ?policy a pol:Policy;
            pol:target ?targetDataGraph;
`
if (purpose && author)
query +=`
            pol:issuer <${author}>;
`
if (purpose)
    query +=`
        pol:permission ?perm.
    ?perm pol:action pol:Use. 
    ?perm pol:purpose ${purpose}. 
`
query +=`
    }
    GRAPH ?dataGraph { ?s ?p ?o . }
}`

        console.log('filtering')
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