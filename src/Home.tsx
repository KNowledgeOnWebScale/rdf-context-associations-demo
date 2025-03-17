import { Box, Typography } from "@mui/material"
const Home = () => {

    return ( 
        <Box>
            <Typography variant="h3">RDF Contextualization Demonstrator</Typography>
            
            <Typography>
                <b><p>Welcome to the RDF Context Associations Demo.</p></b>
                <p>
                    This demo provides an interface both for contextualizing existing data,
                    and an interface for processing contextualized data. Both can be found in the menu above!
                </p>
                <p>
                    I am currently in the process of web-izing my CLI toolchain for this, 
                    leaving the website semi in-progress. 
                    A full tutorial will be available here by 20.03.2025
                </p>
                <p>github link: <a href="https://github.com:Dexagod/RDF-containment">https://github.com:Dexagod/RDF-containment</a></p>

            </Typography>        
        </Box>
    )
}

export default Home