import { Box, Button, FormControl, FormHelperText, Input, InputLabel, MenuItem, Select, SelectChangeEvent, Typography } from "@mui/material"
import { ChangeEvent, useState } from "react"
import { DPV } from "./util/util"

type FieldInput = { index: number, value: string }

type SignatureParams = { webId: string, privateKey: string, publicKey: string }
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

const purposeFilters: Map<string, string> = new Map([
    ["ServiceProvision", DPV.ServiceProvision],
    ["ServiceProvision", DPV.Marketing],
    ["ServiceProvision", DPV.Personalisation],
    ["ServiceProvision", DPV.PublicBenefit],
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

    
    const [originId, setOriginId] = useState("");
    const handleOriginChange = (event: ChangeEvent<HTMLInputElement>) => { setOriginId(event.target.value) };

    
    console.log(inputs)

    const filterSources = () => {

    }

    return ( 
        <Box>
            <Typography variant="h2">Processing Interface</Typography>

            <br />
            <Typography variant="h5">Input sources</Typography>
            <br />

            {
                inputs.sort(x => x.index).map((entry: FieldInput) => {
                    return ( 
                        <FormControl fullWidth>
                            <InputLabel htmlFor={`input${entry.index}`}>Resource Location</InputLabel>
                            <Input id={`input${entry.index}`} value={ entry.value } onChange={ (event) => handleInputUpdate(entry, event) } />
                            <br />
                        </FormControl>
                    )
                })
            }

            <FormControl fullWidth>
                <Box display="flex" gap={2}>
                    <Button fullWidth variant="contained" onClick={addInput}>Add source</Button>
                </Box>
            </FormControl>
            
            <br />
            <br />
            <br />
            <Typography variant="h5">Content Filters</Typography>
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
                    { Array.from(signatureFilters.entries()).map(([id, _entry]) => 
                        <MenuItem value={id}>{ id }</MenuItem>    
                    )}
                </Select>
                <FormHelperText id="select-signature-helper">Author signing off on the created context information</FormHelperText>
            </FormControl>

            <br />
            <br />

            {/* Sining identity selection */}
            <FormControl fullWidth>
                <InputLabel id="purpose-id-label">Usage Purpose</InputLabel>
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

            <br />
            <br />

            {/* auto-greyed-out origin provenance */}
            <FormControl fullWidth>
                <Input id="origin-input" aria-describedby="origin-input-helper" value={ originId } onChange={ handleOriginChange } />
                <FormHelperText id="origin-input-helper">Origin of resulting statements.</FormHelperText>
            </FormControl>

            <br />
            <br />

            <FormControl fullWidth>
                <Box display="flex" gap={2}>
                    <Button fullWidth variant="contained" onClick={() => filterSources()}>Filter sources</Button>
                </Box>
            </FormControl>

            {/* TODO Show SPARQL query used to filter sources */}

            {/* TODO Show output quads */}

            {/* Show HOW LONG their purpose is still valid */}

            {/* Show who has signed off on the data */}

        </Box>
    )
}

export default ProcessingInterface