import { ChangeEvent, useState } from "react";
import { Box, Button, Checkbox, FormControlLabel, FormGroup, FormHelperText, InputLabel, MenuItem, Select, SelectChangeEvent, TextareaAutosize, TextField, Typography } from "@mui/material"
import FormControl from '@mui/material/FormControl';
import { Builder } from "./util/caBuilder";
import { serializeTrigFromStore } from "./util/trigUtils";
import { DPV, postResource, putResource } from "./util/util";
import { importPrivateKey } from "./util/signature/sign";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const MARGIN = "1.4em";
const SMALLMARGIN = "0.7em";

type SignatureParams = { webId: string, privateKey: string, publicKey: string }
const signatureOptions: Map<string, SignatureParams | undefined > = new Map([
    ["None", undefined],
    ["Ruben", { 
        webId: "https://pod.rubendedecker.be/profile/card#me", 
        privateKey: "https://pod.rubendedecker.be/keys/test_private", 
        publicKey: "https://pod.rubendedecker.be/keys/test_public",
    }],
    ["Jos", {
        webId: "https://publicpod.rubendedecker.be/josd/profile/card#me", 
        privateKey: "https://publicpod.rubendedecker.be/josd/public/private", 
        publicKey: "https://publicpod.rubendedecker.be/josd/public/public", 
    }]
])

const policyOptions: Map<string, any> = new Map([
    ["None", undefined],
    ["policy1", { 
        explanation: "Allow use for service provision for 1 day.", 
        policy: {duration: "P1D", purpose: [DPV.ServiceProvision] as string[]}
    }],
    ["policy2", { 
        explanation: "Allow use for service provision, marketing and personalization for 1 month.", 
        policy: {duration: "P1M", purpose: [DPV.ServiceProvision, DPV.Marketing, DPV.Personalisation] as string[]}
    }],
])
 
const ContextInterface = () => {

    const [sourceId, setSourceId] = useState("https://pod.rubendedecker.be/profile/card#me")
    const handleSourceChange = (event: ChangeEvent<HTMLInputElement>) => { setSourceId(event.target.value) };

    const [originCheckbox, setOriginCheckBox] = useState(true)
    const handleGraphOriginChange = (event: ChangeEvent<HTMLInputElement>) => { setOriginCheckBox(event.target.checked) };

    const [signatureId, setSignatureId] = useState("None");
    const handleSignatureChange = (event: SelectChangeEvent) => { 
        setSignatureId(event.target.value) 
    };
    
    const [policyId, setPolicyId] = useState("None");
    const handlePolicyChange = (event: SelectChangeEvent) => { setPolicyId(event.target.value) };

    // const [authorId, setAuthorId] = useState("https://pod.rubendedecker.be/profile/card#me")
    // const handleAuthorChange = (event: ChangeEvent<HTMLInputElement>) => { setAuthorId(event.target.value) };

    const [targetId, setTargetId] = useState("https://pod.rubendedecker.be/public")
    const handleTargetChange = (event: ChangeEvent<HTMLInputElement>) => { setTargetId(event.target.value) };

    const [resourceLocation, setResourceLocation] = useState("")

    const showAuthorField = (): string => {
        if (signatureId === "None") return "Select a signature to set the author"
        else return signatureOptions.get(signatureId)?.webId || ""
    }

    // const contextualizedInput = `roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. 
    //                 Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, 
    //                 very popular during the Renaissance. The first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32`

    const [processedDocument, setProcessedDocument] = useState("")
    const processDocument = async function() {

        let selectedSignatureIdentity;
        if (signatureId !== "None") selectedSignatureIdentity = signatureOptions.get(signatureId)

        let selectedPolicy;
        if (policyId !== "None") {
            selectedPolicy = policyOptions.get(policyId).policy
            if(selectedSignatureIdentity) selectedPolicy = { ...selectedPolicy, ...{ assigner: selectedSignatureIdentity.webId }}
        }

        let author;
        let selectedSignature;
        
        if(selectedSignatureIdentity) {
        
            const privateKeyResource = selectedSignatureIdentity.privateKey
            const privateKeyJSON = await (await fetch(privateKeyResource)).json()
            const privateKey = await importPrivateKey(privateKeyJSON as JsonWebKey)
            
            selectedSignature = {
                privateKey: privateKey, 
                issuer: selectedSignatureIdentity.webId, 
                verificationMethod: selectedSignatureIdentity.publicKey,
            }
            author = selectedSignatureIdentity.webId
        }

        let builder = selectedSignatureIdentity ? new Builder(selectedSignature) : new Builder();
        builder = await builder
            .startSession()
            .loadRDF(sourceId, originCheckbox)
            .provenance({origin: sourceId, author})
        
        // Handle policy entry
        if (selectedPolicy) builder = await builder.policy( selectedPolicy )

        // Handle signature entry
        if (selectedSignature) {
            builder = await builder
                .signData()
                .signMetaData()
        }
        const store = await builder.commit()
        const text = await serializeTrigFromStore(store)

        setProcessedDocument(text)
    }


    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(processedDocument)
            .then(() => alert("Copied to clipboard!"))
            .catch((err) => console.error("Failed to copy:", err));
    };

    const enableContentInteractions = () => { return !processedDocument}

    const handlePostResource = async () => {
        const location = await postResource(targetId, processedDocument)
        if(location) setResourceLocation(location) 
        else alert("Something went wrong uploading the resource!")
    }

    const handlePutResource = async () => {
        const location = await putResource(targetId, processedDocument)
        if(location) setResourceLocation(location) 
        else alert("Something went wrong uploading the resource!")
    }

    return ( 
        <Box>
            <Typography variant="h2">Defining Context Information</Typography>

            {/* Source URL */}

            <Box>
                <Typography  sx={{marginBottom: SMALLMARGIN, marginTop: MARGIN}} variant="h5" textAlign={"left"}>
                    Providing an input document
                </Typography>

                <Typography textAlign={"left"} sx={{marginBottom: MARGIN}} color="darkblue">
                    First, an input document must be provided to contextualize.<br />
                    A placeholder document is provided with my live WebID RDF document,<br />
                    but any RDF document should do, including Trig, Turtle, JSON-LD, nquads, ntriples.
                </Typography>

                <FormControl fullWidth>
                    <TextField 
                        id="source-input" 
                        aria-describedby="source-input-helper" 
                        label={"Source URL"}
                        value={ sourceId } 
                        onChange={ handleSourceChange } 
                        helperText={"URI of the Linked Data Document"}
                    />
                    <FormGroup>
                        <Typography textAlign={"left"} sx={{marginTop: MARGIN}} color="darkblue">
                            If the source document contains quads, these must be converted to blank node graphs. <br />
                            Checking this checkbox retains the original graph name as the origin of the new graph <br />
                            in the defined provenance information.
                        </Typography>
                        <FormControlLabel control={<Checkbox checked={originCheckbox} onChange={ handleGraphOriginChange }/>} label="Interpret Graph Names as Origin" />
                    </FormGroup>
                </FormControl>
            </Box>
                
            <Box>
                <Typography  sx={{marginBottom: SMALLMARGIN, marginTop: MARGIN}} variant="h5" textAlign={"left"}>
                    Defining a signing author
                </Typography>

                <Typography textAlign={"left"} sx={{marginBottom: MARGIN}} color="darkblue">
                    Here, a selection of Web Identifiers is provided, that can be used to define <br />
                    the signing author of the resulting context information. Using their keys, <br />
                    both the input data and the context graph will be signed.
                </Typography>

                <FormControl fullWidth>
                    <InputLabel id="signature-id-label" sx={{backgroundColor: "white"}}>Signing Author</InputLabel>
                    <Select
                        labelId="signature-id-label"
                        id="signature-id-select"
                        value={signatureId}
                        label="Signature"
                        onChange={ handleSignatureChange }
                        aria-describedby="select-signature-helper"
                    >
                        { Array.from(signatureOptions.entries()).map(([id, _entry]) => 
                            <MenuItem value={id}>{ id }</MenuItem>    
                        )}
                    </Select>
                    <FormHelperText id="select-signature-helper">Author signing off on the created context associations</FormHelperText>
                </FormControl>
            </Box>

            <Box>
                <Typography  sx={{marginBottom: SMALLMARGIN, marginTop: MARGIN}} variant="h5" textAlign={"left"}>
                    Defining a usage agreement
                </Typography>
                
                <Typography textAlign={"left"} sx={{marginBottom: MARGIN}} color="darkblue">
                    Exchanging personal data, we need to define the purpose for which the data can be used.<br />
                    The below selection defines policies that impose a time constraint, a set of purposes<br />
                    for which the associated data can be used, and when chosen sets the above signing author<br />
                    as the policy issuer.
                </Typography>

                <FormControl fullWidth>
                    <InputLabel id="policy-id-label">Policy</InputLabel>
                    <Select
                        labelId="policy-id-label"
                        id="policy-id-select"
                        value={policyId}
                        label="Policy"
                        onChange={ handlePolicyChange }
                        aria-describedby="select-policy-helper"
                    >
                        { Array.from(policyOptions.entries()).map(([id, entry]) => 
                            <MenuItem value={id}>{ entry?.explanation || id }</MenuItem>    
                        )}
                    </Select>
                    <FormHelperText id="select-policy-helper">Policy to define over target content.</FormHelperText>
                </FormControl>
            </Box>

            {/* Provenance provision */}
            <Box>
                <Typography sx={{marginBottom: MARGIN, marginTop: MARGIN}} variant="h5" textAlign={"left"}>
                    Provenance context information
                </Typography>

                <Typography textAlign={"left"} sx={{marginBottom: MARGIN}} color="darkblue">
                    The provenance information defined on the data is derived from <br />
                    the datasource provided above and the chosen signing author.
                </Typography>
                
                <FormControl fullWidth sx={{marginBottom: MARGIN}}>
                    <TextField 
                        id="origin-input" 
                        label="Data origin"
                        value={ sourceId } 
                        disabled 
                        helperText={"Origin of resulting statements"}
                    />
                </FormControl>
                
                <FormControl fullWidth>
                    <TextField 
                        label="Data author"
                        id="author-input"
                        value={ showAuthorField() } 
                        disabled 
                        helperText={"Author of resulting statements"}
                    />
                </FormControl>
            </Box>

            <Box>
                <br />
                <FormControl fullWidth>
                    <Box display="flex" gap={2}>
                        <Button fullWidth variant="contained" sx={{height: "3rem"}} onClick={() => processDocument() }>Commit context information on input</Button>
                    </Box>
                </FormControl>
            </Box>


            <Box>
                {/* Text display of the resulting document */}

                <Typography  sx={{marginBottom: SMALLMARGIN, marginTop: MARGIN}} variant="h5" textAlign={"left"}>
                    Defined context associations
                </Typography>

                <Typography textAlign={"left"} sx={{marginBottom: MARGIN}} color="darkblue">
                    The Textfield contains the created context associations on the input data.<br/>
                    The input data is contained in a Blank Node Graph on which the context information<br/>
                    chosen above is defined.
                </Typography>

                <FormControl fullWidth>
                    <TextareaAutosize minRows={8} maxRows={20} readOnly value={processedDocument} />
                </FormControl>

                <br />

                {/* Copy Button */}
                <FormControl fullWidth>
                    <Box display="flex" gap={2}>
                        <Button 
                            variant="contained" 
                            color="primary" 
                            startIcon={<ContentCopyIcon />} 
                            onClick={handleCopyToClipboard}
                            disabled={enableContentInteractions()}
                        >
                            Copy to Clipboard
                        </Button>
                    </Box>
                </FormControl>
            </Box>

            <Box>
                <Typography sx={{marginBottom: MARGIN, marginTop: MARGIN}} variant="h5" textAlign={"left"}>
                    Publish output document on the Web
                </Typography>

                <Typography textAlign={"left"} sx={{marginBottom: MARGIN}} color="darkblue">
                    Publish the output document on the Web to filter it based on its context!<br />
                    The default location is a public hosting space on my Solid pod that can be used.
                </Typography>

                <FormControl fullWidth>
                    <TextField 
                        id="target-input" 
                        value={ targetId } 
                        onChange={ handleTargetChange } 
                        label={"Output URL"}
                        helperText={"Target URI to POST/PUT the resulting document"}
                    />
                </FormControl>

                {/* CONFIRM BUTTON */}
                <br />
                <br />

                <FormControl fullWidth>
                    <Box display="flex" gap={2}>
                        <Button fullWidth variant="contained" onClick={handlePostResource} disabled={enableContentInteractions()}>POST</Button>
                        <Button fullWidth variant="contained" onClick={handlePutResource} disabled={enableContentInteractions()}>PUT</Button>
                    </Box>
                </FormControl>

                <Typography textAlign={"left"} sx={{marginTop: MARGIN, marginBottom: MARGIN}} color="darkblue">
                    This shows the location to which the resource was published according to its "Location" header.
                </Typography>


                <FormControl fullWidth>
                    <TextField 
                        id="resource-location"  
                        value={ resourceLocation }  
                        aria-readonly
                        label={"Published Resource Location"}
                    />
                </FormControl>
            </Box>
                
        </Box>
    )
}

export default ContextInterface