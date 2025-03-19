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

            <Typography variant="h5" textAlign={"left"} sx={{marginTop: "1em", marginBottom: "1em"}}>
                Why focus on context in RDF?
            </Typography>      
            <Typography textAlign={"left"}>
                RDF provides multiple approaches to defining "context" over statements.
                A triple in RDF can reference a reified triple, a named graph, a triple terms, 
                an RDF Document, and any other construct that can be referenced with a URI.<br />
                For Web ecosystems that exchange personal data, it becomes important to 
                be precise in the targeting of what exactly a policy is defined over, 
                or what quads exactly need to be hashed to verify a signature.
                This becomes especially problematic when merging data streams from different
                sources throughout such a Web ecosystem. <br />
                For this purpose, we define <a href="https://w3id.org/context-associations/specification">
                RDF Context Associations</a> as a modeling approach based on the 
                use of Blank Node Graphs (Named Graphs with a Blank Node as name identifier)
                that remain unambiguous when merged with other RDF data streams or context associations.
                This makes them ideal for storage, exchange, and integration of combined 
                context and associated data in Web ecosystems.
            </Typography>  

            {/* <Typography>
                The current demo is being upgraded for ESWC 2025, 
                with the addition of hover context when hovering output RDF statements.
            </Typography> */}
        </Box>
    )
}

export default Home