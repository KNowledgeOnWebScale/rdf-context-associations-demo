import { ChangeEvent, useState } from "react";
import { Box, Button, Checkbox, FormControlLabel, FormGroup, FormHelperText, Input, InputLabel, MenuItem, Select, SelectChangeEvent, TextareaAutosize, Typography } from "@mui/material"
import FormControl from '@mui/material/FormControl';
import { Builder } from "./util/caBuilder";
import { serializeTrigFromStore } from "./util/trigUtils";
import { DPV, postResource, putResource } from "./util/util";
import { importPrivateKey } from "./util/signature/sign";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

type SignatureInfo = { webId: string, privateKey: string, publicKey: string }
// type PolicyInfo = { explanation: string, purpose: {duration: string, purpose: string[]} }

const signatureOptions: Map<string, SignatureInfo | undefined > = new Map([
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
            selectedPolicy = policyOptions.get(policyId)
            if(selectedSignatureIdentity) selectedPolicy = { selectedSignatureIdentity, ...{ assigner: selectedSignatureIdentity.webId }}
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
        console.log('OUTPUT', text)

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
            <Typography variant="h2">Contextualization Interface</Typography>

            {/* Source URL */}
            <br />
            <Typography variant="h5">Input document</Typography>
            <br />

            <FormControl fullWidth>
                <InputLabel htmlFor="source-input">Source URL</InputLabel>
                <Input id="source-input" aria-describedby="source-input-helper" value={ sourceId } onChange={ handleSourceChange } />
                <FormHelperText id="source-input-helper">URI of the Linked Data Document.</FormHelperText>
                <FormGroup>
                    <FormControlLabel control={<Checkbox checked={originCheckbox} onChange={ handleGraphOriginChange }/>} label="Interpret Graph Names as Origin" />
            </FormGroup>
            </FormControl>
                
            <br />
            <Typography variant="h5">Signature context information</Typography>
            <br />

            {/* Sining identity selection */}
            <FormControl fullWidth>
                <InputLabel id="signature-id-label">Signing Author</InputLabel>
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
                <FormHelperText id="select-signature-helper">Author signing off on the created context information</FormHelperText>
            </FormControl>

            <br />
            <Typography variant="h5">Policy context information</Typography>
            <br />
            
            {/* Policy selection */}
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

            {/* Provenance provision */}
            <br />
            <Typography variant="h5">Provenance context information</Typography>
            <br />

            {/* auto-greyed-out origin provenance */}
            <FormControl fullWidth>
                <Input id="origin-input" aria-describedby="origin-input-helper" value={ sourceId } disabled />
                <FormHelperText id="origin-input-helper">Origin of resulting statements.</FormHelperText>
            </FormControl>

            {/* self-set author provenance */}
            <FormControl fullWidth>
                <Input id="origin-input" aria-describedby="author-input-helper" value={ showAuthorField() } disabled /*value={ authorId } onChange={ handleAuthorChange }*/ />
                <FormHelperText id="author-input-helper">Author of resulting statements.</FormHelperText>
            </FormControl>

            {/* COMMIT BUTTON */}

            <br />
            <br />
            <FormControl fullWidth>
                <Box display="flex" gap={2}>
                    <Button fullWidth variant="contained" onClick={() => processDocument() }>Commit</Button>
                </Box>
            </FormControl>

            {/* Text display of the resulting document */}
            <br />
            <br />
            <Typography variant="h5">Output context associations</Typography>
            <br />

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


            {/* Text input to POST/PUT the document to a URI */}

            {/* Source URL */}
            <br />
            <Typography variant="h5">Target document</Typography>
            <br />

            <FormControl fullWidth>
                <InputLabel htmlFor="target-input">Source URL</InputLabel>
                <Input id="target-input" aria-describedby="target-input-helper" value={ targetId } onChange={ handleTargetChange } />
                <FormHelperText id="target-input-helper">Target URI to POST/PUT the resulting context associations</FormHelperText>
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

            <br />
            <br />

            <FormControl fullWidth>
                <InputLabel htmlFor="resource-location">Resource Location</InputLabel>
                <Input id="resource-location" readOnly value={ resourceLocation }/>
                
            </FormControl>
                
        </Box>
    )
}

export default ContextInterface