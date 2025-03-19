import { Box, Button, FormControl, TextareaAutosize, Typography } from "@mui/material"
import { useState } from "react"
import { evaluateQuerySync } from "./util/query";
// import { Quad } from "rdf-js";
import { parseRDFToStore, serializeTrigFromStore } from "./util/trigUtils";
import { Store } from "n3";
import { pkeyMapping, SignatureParams } from "./ProcessingInterface";
import { MARGIN, SMALLMARGIN } from "./ContextInterface";
import { isRDFResource, SIGNATURE } from "./util/util";
import { RDF } from "@inrupt/vocab-common-rdf";
import { verifySignature } from "./util/signature/verify";


export type FitlerInput = {
    sources: string[],
    author?: string,
    keyInfo?: SignatureParams,
    origin?: string,
    purpose?: string,
    verifySignature: boolean,
}

type VerificationStatus = {issuer: string, target: string, publicKey: string, status: boolean}

const SPARQLFilterBox = (props: { input: FitlerInput }) =>  {
    
    const { sources, author, keyInfo, origin, purpose: inputPurpose, verifySignature: requireSignature } = props.input

    const [query, setQuery] = useState<string>('')
    const [serialized, setSerialized] = useState<string>("")

    const [verifiedSignatures, setVerifiedSignatures] = useState<VerificationStatus[]>([])
    
    //always validate signatures
    const validateSignatures = true
    //do we filter on signature
    const requireAuthorSignature = author && requireSignature
        
    const executeQuery = async(query: string, sources: string[]) => {
        let newVerificationStatusList: VerificationStatus[] = [];
        // Load sources to stores
        let sourceStores: Store[] = []
        for (let source of sources.filter(s => !!s)) {
            try {
                if (!await isRDFResource(source)) throw new Error(`Source ${source} is not a valid RDF resource`)
                const res = await fetch(source)
                const text = await res.text()
                const contentType = await res.headers.get('Content-Type')
                if (!contentType) throw new Error(`Could not discover content type of ${source}`)
                sourceStores.push(parseRDFToStore(text, contentType))
            } catch (e) {
                alert(`Could not process source ${source}`)
                return
            }
        }

        // evaluate signatures if asked
        let verifiedStores: Store[] = []
        if (validateSignatures) {
            for (let sourceStore of sourceStores) {
                let newStore = new Store()
                const signatureQuads = sourceStore.getQuads(null, RDF.type, SIGNATURE.DataIntegrityProof, null)
                for (let signatureQuad of signatureQuads) {
                    const signatureSubject = signatureQuad.subject;
                    const signatureGraph = signatureQuad.graph;
                    const issuer = sourceStore.getObjects(signatureSubject, SIGNATURE.issuer, signatureGraph)[0]
                    const target = sourceStore.getObjects(signatureSubject, SIGNATURE.target, signatureGraph)[0]
                    const proofValue = sourceStore.getObjects(signatureSubject, SIGNATURE.proofValue, signatureGraph)[0]
                    if (!issuer || !target || !proofValue) { console.error('could not process discovered signature , skipping entry'); continue;}
                    let publicKey = pkeyMapping.get(issuer.value)
                    // todo: dynamic key retrieval?
                    if (!publicKey) { console.error('could not verify public key for discovered signature (these are statically fed to prevent extra requests), skipping entry'); continue;}

                    const verificationResult = await verifySignature(sourceStore, {target, proofValue: proofValue.value, publicKey})

                    newVerificationStatusList.push({issuer: issuer.value, target: target.value, publicKey, status: verificationResult})

                    console.log(`Verification for signature of ${target.value} by ${issuer.value} - status: ${verificationResult}`)
                    // only include verified signatures by author
                    if (verificationResult && requireAuthorSignature && issuer.value === keyInfo?.webId) {
                        newStore.addQuads(sourceStore.getQuads(null, null, null, target))
                        // todo: also add signature graph to make SPARQL querying work if there are problems?
                        newStore.addQuads(sourceStore.getQuads(null, null, null, signatureGraph))
                        console.log(`Adding ${target.value} and signature graph ${signatureGraph} to the query source.`)
                    }
                }
                verifiedStores.push(newStore)
            }
        }

        let quads;
        if (requireSignature) {
            quads = await evaluateQuerySync(verifiedStores, query)
        } else {
            quads = await evaluateQuerySync(sourceStores, query)
        }

        // evaluate query
        const store = new Store()
        store.addQuads(quads)
        const outputTrig = await serializeTrigFromStore(store)
        console.log("output", outputTrig, quads)
        // setTriples(quads)
        setSerialized(outputTrig || "No output for provided filter options!")
        setVerifiedSignatures(newVerificationStatusList)
    }

    const filterSources = () => {
        const purpose: string | undefined = inputPurpose || undefined
        const author: string | undefined = (keyInfo?.webId) 

let query = 
`PREFIX ca: <https://w3id.org/context-associations#>
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
        ${(origin && `?dataGraph prov:origin <${origin}>.`)||""}
        ${(author && `?dataGraph prov:author <${author}>.`)||""}
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
        ${(requireAuthorSignature && `?signature a sign:DataIntegrityProof;
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
                    <Button variant="contained" onClick={() => filterSources()}>Evaluate using SPARQL</Button>
                </Box>
                <br />
            </FormControl>

            {/* TODO Show SPARQL query used to filter sources */}

            <Typography  sx={{marginBottom: SMALLMARGIN, marginTop: MARGIN}} variant="h5" textAlign={"left"}>
                Used SPARQL query
            </Typography>

            <Typography textAlign={"left"} sx={{marginBottom: MARGIN}} color="darkblue">
                This is the SPARQL query created from the filter requirements above.<br />
            </Typography>

            <FormControl fullWidth>
                <TextareaAutosize minRows={8} maxRows={20} value={query} />
            </FormControl>

            <Typography textAlign={"left"} sx={{marginTop: MARGIN, marginBottom: SMALLMARGIN}} color="darkblue">
                <b>Verified signatures:</b><br />
            </Typography>
            
            {
                verifiedSignatures.map(v => {
                    if (v.status) return (
                        <Typography textAlign={"left"} color={"green"} sx={{marginBottom: SMALLMARGIN}}>
                            { `Successfully validated signature by ${v.issuer} on target graph ${v.target} using key at ${v.publicKey}`}
                        </Typography>
                    ) 
                    else return (
                        <Typography textAlign={"left"} color={"red"} sx={{marginBottom: SMALLMARGIN}}>
                            { `Failed to validated signature by ${v.issuer} on target graph ${v.target} using key at ${v.publicKey}`}
                        </Typography>
                    )
                })
            }

            <Typography  sx={{marginBottom: SMALLMARGIN, marginTop: MARGIN}} variant="h5" textAlign={"left"}>
                Filtered input data
            </Typography>
            
            <Typography textAlign={"left"} sx={{marginTop: MARGIN, marginBottom: MARGIN}} color="darkblue">
                This is filtered data based on the above query.<br />
            </Typography>

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