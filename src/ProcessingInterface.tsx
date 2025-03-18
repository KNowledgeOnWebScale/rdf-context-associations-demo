import { Box, Button, FormControl, FormHelperText, Input, InputLabel, MenuItem, OutlinedInput, Select, SelectChangeEvent, TextField, Typography } from "@mui/material"
import { ChangeEvent, useState } from "react"
import { DPV } from "./util/util"
import SPARQLFilterBox, { FitlerInput } from "./SPARQLFilterBox"
import { MARGIN, SMALLMARGIN } from "./ContextInterface"


type FieldInput = { index: number, value: string }

export type SignatureParams = { webId: string, privateKey: string, publicKey: string }
const signatureFilters: Map<string, SignatureParams | undefined > = new Map([
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

const purposeFilters: Map<string, string | undefined> = new Map([
    ["None", undefined],
    ["ServiceProvision", DPV.ServiceProvision],
    ["Marketing", DPV.Marketing],
    ["Personalization", DPV.Personalisation],
    ["PublicBenefit", DPV.PublicBenefit],
])

const ProcessingInterface = () => {

    const [ inputs, setInputs ] = useState<FieldInput[]>( [{ index: 0, value: "" }] )
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


    const [signatureId, setSignatureId] = useState("None");
    const handleSignatureChange = (event: SelectChangeEvent) => { 
        setSignatureId(event.target.value) 
    };

    const [purposeId, setPurposeId] = useState("None");
    const handlePurposeChange = (event: SelectChangeEvent) => { setPurposeId(event.target.value) };

    
    const [origin, setOrigin] = useState("");
    const handleOriginChange = (event: ChangeEvent<HTMLInputElement>) => { setOrigin(event.target.value) };

    const filterInput: FitlerInput = { 
        sources: inputs.map(fieldInput => fieldInput.value),
        purpose: purposeFilters.get(purposeId),
        signingAuthor: signatureFilters.get(signatureId),
        origin: origin
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
                        <Button fullWidth variant="contained" onClick={addInput}>Add input source field</Button>
                    </Box>
                </FormControl>
            </Box>

            
            <Box>
                <Typography  sx={{marginBottom: SMALLMARGIN, marginTop: MARGIN}} variant="h5" textAlign={"left"}>
                    Filter context
                </Typography>

                <Typography textAlign={"left"} sx={{marginBottom: MARGIN}} color="darkblue">
                    Filter input data based on provenance author
                </Typography>

                {/* Sining identity selection */}
                <FormControl fullWidth>
                    <InputLabel id="signature-id-label">Author</InputLabel>
                    <Select
                        labelId="signature-id-label"
                        id="signature-id-select"
                        value={signatureId}
                        label="Signature"
                        onChange={ handleSignatureChange }
                        aria-describedby="select-signature-helper"
                    >
                        { Array.from(signatureFilters.entries()).map(([id, _entry]) => 
                            <MenuItem value={id}>{ id }</MenuItem>    
                        )}
                    </Select>
                    <FormHelperText id="select-signature-helper">Author signing off on the created context information</FormHelperText>
                </FormControl>

                <Typography textAlign={"left"} sx={{marginBottom: MARGIN, marginTop: MARGIN}} color="darkblue">
                    Filter input data based on the purpose for which it can be processed
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