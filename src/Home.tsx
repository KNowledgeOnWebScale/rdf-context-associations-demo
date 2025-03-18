import { Box, Typography } from "@mui/material"
const Home = () => {

    return ( 
        <Box>
            <Typography variant="h3">
                RDF Contextualization Demonstrator
            </Typography>
            <Typography>
                <b>Welcome to the RDF Context Associations Demo.</b>
            </Typography>        
            <Typography>
                This demo provides an interface both for contextualizing existing data,
                and an interface for processing contextualized data. Both can be found in the menu above!
            </Typography>
            <Typography>
                The current demo is being upgraded for ESWC 2025, 
                with the addition of hover context when hovering output RDF statements.
            </Typography>
        </Box>
    )
}

export default Home