import React from 'react';
import {
    Box, Typography, AppBar, Toolbar, IconButton, 
    CssBaseline, Container, Button, Stack, useTheme, useMediaQuery
} from '@mui/material';


import TerrainIcon from '@mui/icons-material/Terrain';
import AccountCircle from '@mui/icons-material/AccountCircle';
import LuggageIcon from '@mui/icons-material/Luggage';
import MapIcon from '@mui/icons-material/Map';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import PeopleIcon from '@mui/icons-material/People';


const menuItems = [
    { text: 'Itineraries', icon: <LuggageIcon /> },
    { text: 'Maps', icon: <MapIcon /> },
    { text: 'Weather', icon: <WbSunnyIcon /> },
    { text: 'Community', icon: <PeopleIcon /> },
];

const Dashboard = () => {
    const theme = useTheme();


    const [selectedItem, setSelectedItem] = React.useState('Itineraries');

    // Only changes state for visual effect;
    const handleItemClick = (text) => {
        setSelectedItem(text);
    };
    
    // Generateing the content title based on the active menu item
    const getContentTitle = (item) => {
        return `Manisha's ${item} Page`;
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <CssBaseline />

            <AppBar
                position="fixed"
                sx={{
                    backgroundColor: 'primary.main',
                    boxShadow: 3
                }}
            >
        
                <Toolbar sx={{ justifyContent: 'space-between' }}>
                    
                    <Stack 
                        direction="row" 
                        alignItems="center" 
                        spacing={1}
                    >
                        <TerrainIcon sx={{ fontSize: 32 }} />
                        <Typography 
                            variant="h6" 
                            noWrap 
                            component="div" 
                            sx={{ fontWeight: 700 }}
                        >
                            Smart Itinerary App
                        </Typography>
                    </Stack>

                    <IconButton color="inherit" size="large">
                        <AccountCircle />
                    </IconButton>
                </Toolbar>

                <Toolbar 
                    component={Box}
                    sx={{ 
                        minHeight: 48,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        justifyContent: 'flex-start',
                        py: 0,
                        overflowX: 'auto',
                        width: '100%',
                    }}
                >
                    <Stack direction="row" spacing={{ xs: 1, md: 4 }}>
                        {menuItems.map((item) => (
                            <Button
                                key={item.text}
                                color="inherit"
                                onClick={() => handleItemClick(item.text)}
                                startIcon={item.icon}
                                sx={{ 
                                    fontWeight: selectedItem === item.text ? 700 : 500,
                                    // Highlight active item
                                    borderBottom: selectedItem === item.text ? '3px solid white' : 'none',
                                    borderRadius: 0,
                                    py: 1,
                                    px: { xs: 1, sm: 2 },
                                    minWidth: 'auto',
                                    textTransform: 'none',
                                }}
                            >
                                {item.text}
                            </Button>
                        ))}
                    </Stack>
                </Toolbar>
            </AppBar>

        
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 2,
                    mt: { xs: '120px', md: '120px' }, 
                    backgroundColor: '#f4f6f8',
                    minHeight: 'calc(100vh - 186px)',
                    width: 'calc(100vw - 96px)',
                }}
            >
                <Container>
                    {/* Welcome Message */}
                    <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
                        Welcome Back, Manisha!
                    </Typography>

                    {/* Placeholder Content Area */}
                    <Box 
                        sx={{ 
                            p: 4, 
                            textAlign: 'center', 
                            backgroundColor: 'white', 
                            borderRadius: 2, 
                            boxShadow: 1,
                            minHeight: '50vh',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}
                    >
                        {/* Dynamic Content Title */}
                        <Typography variant="h5" color="text.primary" sx={{ fontWeight: 600 }}>
                            {getContentTitle(selectedItem)}
                        </Typography>
                    </Box>
                    
                    {/* Footer */}
                    <Box sx={{ textAlign: 'center', py: 4, mt: 4, borderTop: '1px solid #ccc' }}>
                        <Typography variant="caption" color="text.secondary">
                            Smart Itinerary App v1.0
                        </Typography>
                    </Box>

                </Container>
            </Box>
        </Box>
    );
};

export default Dashboard;