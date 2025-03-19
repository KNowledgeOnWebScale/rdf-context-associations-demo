import * as React from 'react';
import { JSX } from 'react'
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import MenuIcon from '@mui/icons-material/Menu';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

import Home from './Home';
import ContextInterface from './ContextInterface';
import ProcessingInterface from './ProcessingInterface';
// import Links from './Links';
// import VisualizationInterface from './VisuallizationInterface';

interface Props {
  /**
   * Injected by the documentation to work in an iframe.
   * You won't need it on your project.
   */
  window?: () => Window;
  children?: string | JSX.Element | JSX.Element[] | React.ReactNode
}

const title = "RDF Context Associations Demonstrator"

const drawerWidth = 240;
const navItems = new Map<string, { text: string, page: React.FC }>([
    ['home', { text: 'Home', page: Home}],
    ['context', { text: 'Contextualization Interface', page: ContextInterface }],
    ['processing', { text: 'Processing Interface', page: ProcessingInterface}],
    // ['visualization', { text: 'Visualization Interface', page: VisualizationInterface}],
    // ['links', { text: 'Links', page: Links}]  
]);

export default function DrawerAppBar(props: Props) {
    const { window } = props;
    const [mobileOpen, setMobileOpen] = React.useState(false);

    const handleDrawerToggle = () => {
        setMobileOpen((prevState) => !prevState);
    };

    const [currentPage, setCurrentPage] = React.useState('home');
    
    const PageComponent = navItems.get(currentPage)?.page; // Get the component reference


    const drawer = (
        <Box onClick={handleDrawerToggle}>
        <Typography display='block' variant="h6" sx={{ my: 2, pl: 2 }}>
                {title}
        </Typography>
        <Divider />
        <List>
            {Array.from(navItems.entries()).map(([id, pageObj]) => (
            <ListItem key={id} disablePadding>
                <ListItemButton sx={{ textAlign: 'left' }} onClick={(_ignored) => setCurrentPage(id)}>
                <ListItemText primary={pageObj.text} />
                </ListItemButton>
            </ListItem>
            ))}
        </List>
        </Box>
    );

    const container = window !== undefined ? () => window().document.body : undefined;

    return (
        <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar component="nav">
            <Toolbar>
            <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2, display: { sm: 'none' } }}
            >
                <MenuIcon />
            </IconButton>
            <Typography
                variant="h6"
                component="div"
                textAlign='left' 
                sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' }, textAlign: 'left' }}
            >
                {title}
            </Typography>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                {Array.from(navItems.entries()).map(([id, pageObj]) => (
                <Button key={id} sx={{ color: '#fff' }} onClick={(_ignored) => setCurrentPage(id)}>
                    {pageObj.text}
                </Button>
                ))}
            </Box>
            </Toolbar>
        </AppBar>
            <Drawer
            container={container}
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
                keepMounted: true, // Better open performance on mobile.
            }}
            sx={{
                display: { xs: 'block', sm: 'none' },
                '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
            >
            {drawer}
            </Drawer>
        <Box component="main" sx={{ p: 3 }}>
            <Toolbar />
            {PageComponent && <PageComponent />} {/* Render the component properly */}
        </Box>
        </Box>
    );
}