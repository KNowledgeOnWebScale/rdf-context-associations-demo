import { Box, Typography } from "@mui/material"
const Home = () => {

    return ( 
        <Box>
            <Typography variant="h3" textAlign={"left"} sx={{marginBottom: "1em"}}>
                RDF Contextualization Demonstrator
            </Typography>        
            <Typography textAlign={"left"}>
                This website is the demonstrator for the <a href="https://w3id.org/context-associations/specification">
                RDF Context Associations</a> submission for the ESWC2015 Demo and Posters track.<br />
                <br/>
                The goal of this demonstrator is to showcase a native RDF solution for defining 
                associations of context information to target data within the RDF Web ecosystem.
                <br/>
                A first interface, found by clicking the "Contextualization Interface"
                menu button above, leads to a page where contextual information can be
                assigned to an input RDF document.
                <br/>
                A second interface linked by the "Processing Interface" menu button
                above provides functionality for filtering input RDF documents
                based on the available context information.
            </Typography>
            {/* <Typography>
                The current demo is being upgraded for ESWC 2025, 
                with the addition of hover context when hovering output RDF statements.
            </Typography> */}
        </Box>
    )
}

export default Home