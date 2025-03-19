import { ChangeEvent, useState } from "react";
import { Box, Button, Checkbox, FormControlLabel, FormGroup, FormHelperText, InputLabel, MenuItem, Select, SelectChangeEvent, TextareaAutosize, TextField, Typography } from "@mui/material"
import FormControl from '@mui/material/FormControl';
import { Builder } from "./util/caBuilder";
import { serializeTrigFromStore } from "./util/trigUtils";
import { DPV, postResource } from "./util/util";
import { importPrivateKey } from "./util/signature/sign";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CreatedResourceStore from "./util/CreatedResources";

export const MARGIN = "1.4em";
export const SMALLMARGIN = "0.7em";

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

// const policyOptions: Map<string, any> = new Map([
//     ["None", undefined],
//     ["policy1", { 
//         explanation: "Allow use for service provision for 1 day.", 
//         policy: {duration: "P1D", purpose: [DPV.ServiceProvision] as string[]}
//     }],
//     ["policy2", { 
//         explanation: "Allow use for service provision, marketing and personalization for 1 month.", 
//         policy: {duration: "P1M", purpose: [DPV.ServiceProvision, DPV.Marketing, DPV.Personalisation] as string[]}
//     }],
// ])

const purposeOptions: Map<string, string | undefined > = new Map([
    ["None", undefined],
    ["Personalisation", DPV.Personalisation],
    ["ServiceProvision", DPV.ServiceProvision],
    ["Marketing", DPV.Marketing],
    ["PublicBenefit", DPV.PublicBenefit],
])

const durationOptions: Map<string, string | undefined> = new Map([
    ["None", undefined],
    ["1 Day", "P1D"],
    ["1 Week", "P7D"],
    ["1 Month", "P1M"]
])
 
const ContextInterface = () => {

    const [sourceId, setSourceId] = useState("https://pod.rubendedecker.be/profile/card#me")
    const handleSourceChange = (event: ChangeEvent<HTMLInputElement>) => { 
        setSourceId(event.target.value) 
    };

    const [durationId, setDurationId] = useState("None")
    const handleDurationChange = (event: SelectChangeEvent) => { 
        setDurationId(event.target.value) 
    };

    const [originCheckbox, setOriginCheckBox] = useState(true)
    const handleGraphOriginChange = (event: ChangeEvent<HTMLInputElement>) => { 
        setOriginCheckBox(event.target.checked) 
    };

    const [signatureId, setSignatureId] = useState("None");
    const handleSignatureChange = (event: SelectChangeEvent) => { 
        setSignatureId(event.target.value) 
    };
    
    const [purposeId, setPurposeId] = useState("None");
    const handlePurposeChange = (event: SelectChangeEvent) => { setPurposeId(event.target.value) };

    // const [authorId, setAuthorId] = useState("https://pod.rubendedecker.be/profile/card#me")
    // const handleAuthorChange = (event: ChangeEvent<HTMLInputElement>) => { setAuthorId(event.target.value) };

    // const [targetId, setTargetId] = useState("https://pod.rubendedecker.be/projects/ca_demo/")
    // const handleTargetChange = (event: ChangeEvent<HTMLInputElement>) => { setTargetId(event.target.value) };
    const targetId = "https://pod.rubendedecker.be/projects/ca_demo/"

    const [resourceLocation, setResourceLocation] = useState("")

    const showAuthorField = (): string => {
        if (signatureId === "None") return "Select a signature to set the author"
        else return signatureOptions.get(signatureId)?.webId || ""
    }

    const [textCopiedState, setTextCopiedState] = useState(false)
    const [linkCopiedState, setLinkCopiedState] = useState(false)

    // const contextualizedInput = `roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. 
    //                 Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, 
    //                 very popular during the Renaissance. The first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32`

    const [processedDocument, setProcessedDocument] = useState("")
    const processDocument = async function() {
        
        if(!sourceId) return;

        const durationChoice = durationOptions.get(durationId)
        const purposeChoice = purposeOptions.get(purposeId)
        const signatureChoice = signatureOptions.get(signatureId)

        let definePolicy = false;    
        let selectedPolicy: any = {};
        if (durationChoice) {
            definePolicy = true;
            selectedPolicy.duration = durationChoice
        } 
        if (purposeChoice) {
            definePolicy = true;
            selectedPolicy.purpose = [ purposeChoice ]
        } 
        if (signatureChoice) {
            selectedPolicy.assigner = signatureChoice?.webId
        }

        let author;
        let selectedSignature;
        
        console.log(durationId, purposeId, signatureId, definePolicy)

        if(signatureChoice) {
        
            const privateKeyResource = signatureChoice.privateKey
            const privateKeyJSON = await (await fetch(privateKeyResource)).json()
            const privateKey = await importPrivateKey(privateKeyJSON as JsonWebKey)
            
            selectedSignature = {
                privateKey: privateKey, 
                issuer: signatureChoice.webId, 
                verificationMethod: signatureChoice.publicKey,
            }
            author = signatureChoice.webId
        }

        let builder = signatureChoice ? new Builder(selectedSignature) : new Builder();
        builder = await builder
            .startSession()
            .loadRDF(sourceId, originCheckbox)
            .provenance({origin: sourceId, author})
        
        // Handle policy entry
        if (definePolicy) builder = await builder.policy( selectedPolicy )

        // Handle signature entry
        if (selectedSignature) {
            builder = await builder
                .signData()
                .signMetaData()
        }
        const store = await builder.commit()
        const text = await serializeTrigFromStore(store)

        setProcessedDocument(text)
        setTextCopiedState(false)
        setLinkCopiedState(false)
        
        const location = await postResource(targetId, text) || targetId
        CreatedResourceStore.getInstance().addResourceURL(location)
        if(location) setResourceLocation(location) 
    }


    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(processedDocument)
            .then(() => setTextCopiedState(true))
            .catch((err) => console.error("Failed to copy:", err));
    };

    const handleCopyLinkToClipboard = () => {
        navigator.clipboard.writeText(resourceLocation)
            .then(() => setLinkCopiedState(true))
            .catch((err) => console.error("Failed to copy:", err));
    }

    const enableContentInteractions = () => { return !processedDocument}

    // const handlePostResource = async () => {
    //     const location = await postResource(targetId, processedDocument) || targetId
    //     CreatedResourceStore.getInstance().addResourceURL(location)
    //     if(location) setResourceLocation(location) 
    //     else alert("Something went wrong uploading the resource!")
    // }

    // const handlePutResource = async () => {
    //     const location = await putResource(targetId, processedDocument) || targetId
    //     CreatedResourceStore.getInstance().addResourceURL(location)
    //     if(location) setResourceLocation(location) 
    //     else alert("Something went wrong uploading the resource!")
    // }

    return ( 
        <Box>
            <Typography variant="h2">Defining Context Information</Typography>

            {/* Source URL */}

            <Box>
                <Typography  sx={{marginBottom: SMALLMARGIN, marginTop: MARGIN}} variant="h5" textAlign={"left"}>
                    Providing an input document
                </Typography>

                <Typography textAlign={"left"} sx={{marginBottom: MARGIN}} color="darkblue">
                    First, provide an input document to add context information to. This accepts any valid RDF serialization.
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
                            If the source document contains quads, interpret the name as the origin of the graph.
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
                    Define the author defining and signing off on the context information.
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
                        Define for how long the data that we are about to exchange can be used
                </Typography>

                <FormControl fullWidth >
                    <InputLabel id="policy-duration-label" sx={{backgroundColor: "white"}}>Usage duration</InputLabel>
                    <Select
                        labelId="policy-duration-label"
                        id="policy-duration-select"
                        value={durationId}
                        label="Policy"
                        onChange={ handleDurationChange }
                        aria-describedby="duration-policy-helper"
                    >
                        { Array.from(durationOptions.entries()).map(([id, _entry]) => 
                            <MenuItem value={id}>{ id }</MenuItem>    
                        )}
                    </Select>
                    <FormHelperText id="duration-policy-helper">Duration for which content can be used</FormHelperText>
                </FormControl>

                <Typography textAlign={"left"} sx={{marginBottom: MARGIN, marginTop: MARGIN}} color="darkblue">
                    Define the purpose for which the data that we are about to exchange can be used
                </Typography>


                <FormControl fullWidth> 
                    <InputLabel id="policy-id-label" sx={{backgroundColor: "white"}}>Usage purpose</InputLabel>
                    <Select
                        fullWidth
                        labelId="policy-id-label"
                        id="policy-id-select"
                        value={purposeId}
                        label="Policy"
                        onChange={ handlePurposeChange }
                        aria-describedby="select-policy-helper"
                    >
                        { Array.from(purposeOptions.entries()).map(([id, _entry]) => 
                            <MenuItem value={id}>{ id }</MenuItem>    
                        )}
                    </Select>
                    <FormHelperText id="select-policy-helper">Usage purpose of resulting data</FormHelperText>
                </FormControl>
            </Box>

            {/* Provenance provision */}
            <Box>
                <Typography sx={{marginBottom: MARGIN, marginTop: MARGIN}} variant="h5" textAlign={"left"}>
                    Provenance information
                </Typography>

                <Typography textAlign={"left"} sx={{marginBottom: MARGIN}} color="darkblue">
                    Based on the above choices, the provenance information is auto-filled
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
                <Typography textAlign={"left"} sx={{marginBottom: MARGIN}} color="darkblue">
                    Now commit the above context information to the provided source using RDF Context Associations.
                </Typography>
                <FormControl fullWidth>
                    <Box display="flex" gap={2}>
                        <Button variant="contained" sx={{height: "3rem"}} onClick={() => processDocument() }>Commit context information on input</Button>
                    </Box>
                </FormControl>
            </Box>


            <Box>
                {/* Text display of the resulting document */}

                <Typography  sx={{marginBottom: SMALLMARGIN, marginTop: MARGIN}} variant="h5" textAlign={"left"}>
                    Output resource
                </Typography>

                <Typography textAlign={"left"} sx={{marginBottom: MARGIN}} color="darkblue">
                    This textfield contains the created context associations defined on the input source.
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
                    <FormHelperText>{textCopiedState ? "Copied text to clipboard!" : ""}</FormHelperText>
                </FormControl>
            </Box>

            <Box>
                {/* <Typography sx={{marginBottom: MARGIN, marginTop: MARGIN}} variant="h5" textAlign={"left"}>
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

                <br />
                <br />

                <FormControl fullWidth>
                    <Box display="flex" gap={2}>
                        <Button fullWidth variant="contained" onClick={handlePostResource} disabled={enableContentInteractions()}>POST</Button>
                        <Button fullWidth variant="contained" onClick={handlePutResource} disabled={enableContentInteractions()}>PUT</Button>
                    </Box>
                </FormControl> */}

                <Typography textAlign={"left"} sx={{marginTop: MARGIN, marginBottom: MARGIN}} color="darkblue">
                    The result was automatically published at location for demo purposes and will be purged regularly.<br />
                    The result was also added to the processing interface of this demonstrator.
                </Typography>


                <FormControl fullWidth>
                    <TextField 
                        id="resource-location"  
                        value={ resourceLocation }  
                        aria-readonly
                        label={"Published Resource Location"}
                    />
                </FormControl>
                <br />

                {/* Copy Button */}
                <FormControl fullWidth>
                    <Box display="flex" gap={2}>
                        <Button 
                            variant="contained" 
                            color="primary" 
                            startIcon={<ContentCopyIcon />} 
                            onClick={handleCopyLinkToClipboard}
                            disabled={enableContentInteractions()}
                        >
                            Copy Link
                        </Button>
                    </Box>
                    <FormHelperText>{linkCopiedState ? "Copied link to clipboard!" : ""}</FormHelperText>
                </FormControl>
            </Box>
                
        </Box>
    )
}

export default ContextInterface