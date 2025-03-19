import { ChangeEvent, useState } from "react";
import { Box, Button, TextField, Typography } from "@mui/material"
import FormControl from '@mui/material/FormControl';
import { isRDFResource } from "./util/util";

export const MARGIN = "1.4em";
export const SMALLMARGIN = "0.7em";

const sourceHelperTextDefault = "URI of the Linked Data Document"
const sourceHelperTextError = "Source URI is not a valid RDF source!"

const VisualizationInterface = () => {
    const [sourceId, setSourceId] = useState("https://pod.rubendedecker.be/profile/card#me")
    const [sourceHelperText, setSourceHelperText] = useState<string>(sourceHelperTextDefault)
    const [sourceError, setSourceError] = useState<boolean>(false)
    const handleSourceChange = (event: ChangeEvent<HTMLInputElement>) => { 
        setSourceId(event.target.value) 
        setSourceHelperText(sourceHelperTextDefault)
        setSourceError(false)
    };


    const processDocument = async () => {
        try {
            if (! await isRDFResource(sourceId)) {
                setSourceError(true)
                setSourceHelperText(sourceHelperTextError)
                return;
            }
        } catch (e) {
            setSourceError(true)
            setSourceHelperText(sourceHelperTextError)
            return;
        }

        // FOR EACH GRAPH IN THE SOURCE: evaluate
        /**
         * 1. for each graph, find other graphs that reference the graph in their contents
         * 2. hovering over a graph, highlight the signature graph
         * 2. 
         * 
         */

    }

    return ( 
        <Box>
            <Typography variant="h2">Context Visualization</Typography>

            {/* Source URL */}

            <Box>
                <Typography  sx={{marginBottom: SMALLMARGIN, marginTop: MARGIN}} variant="h5" textAlign={"left"}>
                    Provide an input document
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
                        helperText={sourceHelperText}
                        error={!!sourceError}
                    />
                </FormControl>


                <Box>
                    <FormControl fullWidth sx={{marginTop: MARGIN}}>
                        <Box display="flex" gap={2}>
                            <Button variant="contained" sx={{height: "3rem"}} onClick={() => processDocument() }>Process input</Button>
                        </Box>
                    </FormControl>
                </Box>


                {/* EVALUATION OF THE CONTEXT INFORMATION */}
            </Box>
        </Box>
    )
}

export default VisualizationInterface