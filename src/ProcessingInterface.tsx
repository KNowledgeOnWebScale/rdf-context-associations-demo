import { Box, Button, Checkbox, FormControl, FormControlLabel, FormGroup, FormHelperText, InputLabel, MenuItem, OutlinedInput, Select, SelectChangeEvent, TextField, Typography } from "@mui/material"
import { ChangeEvent, useState } from "react"
import { DPV } from "./util/util"
import SPARQLFilterBox, { FitlerInput } from "./SPARQLFilterBox"
import { MARGIN, SMALLMARGIN } from "./ContextInterface"
import CreatedResourceStore from "./util/CreatedResources"


type FieldInput = { index: number, value: string }

export type SignatureParams = { webId: string, privateKey: string, publicKey: string }

const authorFilters: Map<string, string | undefined > = new Map([
    ["None", undefined],
    ["Ruben", "https://pod.rubendedecker.be/profile/card#me"],
    ["Jos", "https://publicpod.rubendedecker.be/josd/profile/card#me"]
])

const keyInformation: Map<string, SignatureParams | undefined > = new Map([
    [ "https://pod.rubendedecker.be/profile/card#me", { 
        webId: "https://pod.rubendedecker.be/profile/card#me",
        privateKey: "https://pod.rubendedecker.be/keys/test_private", 
        publicKey: "https://pod.rubendedecker.be/keys/test_public",
    }],
    [ "https://publicpod.rubendedecker.be/josd/profile/card#me", { 
        webId: "https://publicpod.rubendedecker.be/josd/profile/card#me",
        privateKey: "https://publicpod.rubendedecker.be/josd/public/private", 
        publicKey: "https://publicpod.rubendedecker.be/josd/public/public", 
    }]
])

export const pkeyMapping = new Map<string, string> ([
    ["https://pod.rubendedecker.be/profile/card#me", "https://pod.rubendedecker.be/keys/test_public"],
    ["https://publicpod.rubendedecker.be/josd/profile/card#me", "https://publicpod.rubendedecker.be/josd/public/public"]
])

const purposeFilters: Map<string, string | undefined> = new Map([
    ["None", undefined],
    ["ServiceProvision", DPV.ServiceProvision],
    ["Marketing", DPV.Marketing],
    ["Personalization", DPV.Personalisation],
    ["PublicBenefit", DPV.PublicBenefit],
])

const ProcessingInterface = () => {
    const defaultInputs = CreatedResourceStore.getInstance().getResources().map((source, index) => {return({ index, value: source })})
    const [ inputs, setInputs ] = useState<FieldInput[]>(
        defaultInputs.length ? defaultInputs : [{ index: 0, value: ""}]  
    )
    const handleInputUpdate = (entry: FieldInput, event: any) => {
        setInputs(inputs.map((inputEntry: FieldInput) => {
            
            if (inputEntry.index === entry.index) {
                return { index: entry.index, value: event.target.value}
            } else {
                return inputEntry
            }
        }))
    }
    const addInput = () => {
        const newInputs = inputs.concat([{ index: inputs.length, value: "" }])
        setInputs(newInputs)
    }

    const [authorId, setAuthorId] = useState("None");
    const handleAuthorChange = (event: SelectChangeEvent) => { 
        setAuthorId(event.target.value) 
    };

    const [requireSignature, setRequireSignature] = useState(false);

    // const [signatureId, setSignatureId] = useState("None");
    // const handleSignatureChange = (event: SelectChangeEvent) => { 
    //     setSignatureId(event.target.value) 
    // };

    const [purposeId, setPurposeId] = useState("None");
    const handlePurposeChange = (event: SelectChangeEvent) => { setPurposeId(event.target.value) };

    
    const [origin, setOrigin] = useState("");
    const handleOriginChange = (event: ChangeEvent<HTMLInputElement>) => { setOrigin(event.target.value) };

    const sources = inputs.map(fieldInput => fieldInput.value)
    const author = authorFilters.get(authorId)
    const purpose = purposeFilters.get(purposeId)
    const keyInfo = (author && keyInformation.get(author)) || undefined
    const filterInput: FitlerInput = { 
        sources, 
        author, 
        purpose, 
        keyInfo, 
        origin: origin, 
        verifySignature: requireSignature
    }

    return ( 
        <Box>
            <Typography variant="h2">Filtering Context Information</Typography>

            <Box>
                <Typography  sx={{marginBottom: SMALLMARGIN, marginTop: MARGIN}} variant="h5" textAlign={"left"}>
                    Set input data sources
                </Typography>

                <Typography textAlign={"left"} sx={{marginBottom: MARGIN}} color="darkblue">
                    Define the selection of input sources.
                </Typography>
                {
                    inputs.sort(x => x.index).map((entry: FieldInput) => {
                        return ( 
                            <FormControl fullWidth>
                                <TextField 
                                    id={`input${entry.index}`} 
                                    value={ entry.value } 
                                    onChange={ (event) => handleInputUpdate(entry, event) }
                                    label={"Resource URI"}
                                    helperText={`resource entry ${entry.index}`}
                                    sx={{marginBottom: MARGIN}}
                                />
                            </FormControl>
                        )
                    })
                }

                <FormControl fullWidth>
                    <Box display="flex" gap={2}>
                        <Button variant="contained" onClick={addInput}>Add input source field</Button>
                    </Box>
                </FormControl>
            </Box>

            
            <Box>
                <Typography  sx={{marginBottom: SMALLMARGIN, marginTop: MARGIN}} variant="h5" textAlign={"left"}>
                    Filter context
                </Typography>

                <Typography textAlign={"left"} sx={{marginBottom: MARGIN}} color="darkblue">
                    Filter based on author of content (and signature and policy where relevant)
                </Typography>

                {/* Sining identity selection */}
                <FormControl fullWidth>
                    <InputLabel id="author-id-label">Author</InputLabel>
                    <Select
                        labelId="author-id-label"
                        id="author-id-select"
                        value={authorId}
                        label="author"
                        onChange={ handleAuthorChange }
                        aria-describedby="select-author-helper"
                    >
                        { Array.from(authorFilters.entries()).map(([id, _entry]) => 
                            <MenuItem value={id}>{ id }</MenuItem>    
                        )}
                    </Select>
                    <FormHelperText id="select-author-helper">Filter content based on the author identity</FormHelperText>

                    <FormGroup>
                        <Typography textAlign={"left"} sx={{marginTop: MARGIN}} color="darkblue">
                            Require content to be signed by the author defined above.
                        </Typography>
                        <FormControlLabel control={
                            <Checkbox checked={ requireSignature } onChange={ () => setRequireSignature(!requireSignature) } disabled={ authorId === "None" }/>
                            } label="Verify content signatures" />
                    </FormGroup>
                </FormControl>

                <Typography textAlign={"left"} sx={{marginBottom: MARGIN, marginTop: MARGIN}} color="darkblue">
                    Filter data based on the purpose for which it can be used
                </Typography>

                {/* Sining identity selection */}
                <FormControl fullWidth>
                    <InputLabel id="purpose-id-label">Purpose</InputLabel>
                    <Select
                        labelId="purpose-id-label"
                        id="purpose-id-select"
                        value={purposeId}
                        label="Purpose"
                        onChange={ handlePurposeChange }
                        aria-describedby="select-purpose-helper"
                    >
                        { Array.from(purposeFilters.entries()).map(([id, _entry]) => 
                            <MenuItem value={id}>{ id }</MenuItem>    
                        )}
                    </Select>
                    <FormHelperText id="select-purpose-helper">Purpose for which the data is to be processed.</FormHelperText>
                </FormControl>

                <Typography textAlign={"left"} sx={{marginBottom: MARGIN, marginTop: MARGIN}} color="darkblue">
                    Filter input data based on its origin
                </Typography>

                <FormControl fullWidth>
                    <InputLabel htmlFor="origin-input" style={{"backgroundColor": "white"}}>Origin</InputLabel>
                    <OutlinedInput id="origin-input" aria-describedby="origin-input-helper" value={ origin } onChange={ handleOriginChange } />
                <FormHelperText id="origin-input-helper">Origin of resulting statements.</FormHelperText>
            </FormControl>
            </Box>


            {/* TODO Show output quads */}
            <SPARQLFilterBox input={filterInput}/>

            {/* Show HOW LONG their purpose is still valid */}

            {/* Show who has signed off on the data */}

        </Box>
    )
}

export default ProcessingInterface