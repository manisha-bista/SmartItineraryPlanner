import React, { useState } from 'react';
import { 
    Box, 
    CssBaseline, 
    Drawer, 
    AppBar, 
    Toolbar, 
    List, 
    Typography, 
    Divider, 
    ListItem, 
    ListItemButton, 
    ListItemIcon, 
    ListItemText, 
    Avatar,
    Button,
    Grid,
    Card,
    CardContent,
    Stack,
    IconButton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

// Icons matching your features
import DashboardIcon from '@mui/icons-material/Dashboard';
import MapIcon from '@mui/icons-material/Map';         // "Interactive Maps"
import GroupIcon from '@mui/icons-material/Group';     // "Community Driven"
import CloudIcon from '@mui/icons-material/Cloud';     // "Weather"
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import AddIcon from '@mui/icons-material/Add';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const drawerWidth = 240;

const Dashboard = () => {
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);

    // Mock User
    const user = { name: "Traveler", initial: "T" };

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleLogout = () => {
        navigate('/');
    };

    // --- SIDEBAR MENU ITEMS (Based on your Landing Page Features) ---
    const drawerContent = (
        <div>
            <Toolbar sx={{ justifyContent: 'center', py: 2 }}>
                <Typography variant="h6" fontWeight="800" color="primary">
                    Smart Itinerary
                </Typography>
            </Toolbar>
            <Divider />
            <List sx={{ px: 2, mt: 2 }}>
                {[
                    { text: 'Dashboard', icon: <DashboardIcon /> },
                    { text: 'My Itineraries', icon: <FlightTakeoffIcon /> },
                    { text: 'Interactive Map', icon: <MapIcon /> },
                    { text: 'Community', icon: <GroupIcon /> },
                    { text: 'Weather', icon: <CloudIcon /> },
                ].map((item, index) => (
                    <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                        <ListItemButton 
                            selected={index === 0} // Highlights "Dashboard"
                            sx={{ 
                                borderRadius: 2,
                                '&.Mui-selected': { 
                                    bgcolor: '#fff3e0', /* Light Orange background */
                                    color: '#e65100',   /* Dark Orange text */
                                    '&:hover': { bgcolor: '#ffe0b2' }
                                }
                            }}
                        >
                            <ListItemIcon sx={{ color: index === 0 ? '#e65100' : 'inherit' }}>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: 'medium' }} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
            
            {/* Logout at bottom */}
            <Box sx={{ position: 'absolute', bottom: 20, width: '100%', px: 2 }}>
                 <Button 
                    fullWidth 
                    variant="outlined" 
                    startIcon={<LogoutIcon />} 
                    onClick={handleLogout}
                    color="error"
                >
                    Logout
                </Button>
            </Box>
        </div>
    );

    return (
        <Box sx={{ display: 'flex', bgcolor: '#f8f9fa', minHeight: '100vh' }}>
            <CssBaseline />
            
            {/* --- TOP APP BAR (Mobile Only mostly) --- */}
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                    bgcolor: 'white',
                    color: 'black',
                    boxShadow: 1
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                        Dashboard
                    </Typography>

                    <Stack direction="row" spacing={2} alignItems="center">
                        <Button 
                            variant="contained" 
                            startIcon={<AddIcon />}
                            sx={{ 
                                bgcolor: '#ffb74d', /* YOUR BRAND ORANGE */
                                color: 'black',
                                fontWeight: 'bold',
                                '&:hover': { bgcolor: '#ffa726' },
                                display: { xs: 'none', md: 'flex' }
                            }}
                        >
                            New Trip
                        </Button>
                        <Avatar sx={{ bgcolor: '#ffb74d', color: 'black' }}>{user.initial}</Avatar>
                    </Stack>
                </Toolbar>
            </AppBar>

            {/* --- NAVIGATION DRAWER (Sidebar) --- */}
            <Box
                component="nav"
                sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
            >
                {/* Mobile Drawer */}
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                >
                    {drawerContent}
                </Drawer>
                {/* Desktop Drawer */}
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: 'none', boxShadow: 3 },
                    }}
                    open
                >
                    {drawerContent}
                </Drawer>
            </Box>

            {/* --- MAIN CONTENT AREA --- */}
            <Box
                component="main"
                sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` }, mt: 8 }}
            >
                {/* Welcome Banner */}
                <Box 
                    sx={{ 
                        borderRadius: 4, 
                        p: 4, 
                        mb: 4,
                        color: 'white',
                        backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.7), rgba(0,0,0,0.3)), url('https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=2071&auto=format&fit=crop')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}
                >
                    <Box>
                        <Typography variant="h4" fontWeight="bold">
                            Namaste, {user.name}!
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 1, opacity: 0.9 }}>
                            Ready to plan your next adventure to the Himalayas?
                        </Typography>
                    </Box>
                </Box>

                {/* Content Grid */}
                <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
                    Your Trips
                </Typography>

                <Grid container spacing={3}>
                    {/* Card 1: Existing Trip */}
                    <Grid item xs={12} md={6} lg={4}>
                        <Card sx={{ borderRadius: 3, boxShadow: 3, transition: '0.3s', '&:hover': { transform: 'translateY(-5px)' } }}>
                            <Box sx={{ height: 160, bgcolor: 'grey.300', backgroundImage: 'url(https://images.unsplash.com/photo-1544634129-79888806509c?q=80&w=2071&auto=format&fit=crop)', backgroundSize: 'cover' }} />
                            <CardContent>
                                <Typography variant="h6" fontWeight="bold">Annapurna Circuit</Typography>
                                <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1, color: 'text.secondary' }}>
                                    <LocationOnIcon fontSize="small" />
                                    <Typography variant="body2">Nepal</Typography>
                                </Stack>
                                <Button fullWidth variant="outlined" sx={{ mt: 2, borderColor: '#ffb74d', color: 'black' }}>
                                    Open Itinerary
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Card 2: Create New (Dashed Border) */}
                    <Grid item xs={12} md={6} lg={4}>
                        <Card 
                            sx={{ 
                                height: '100%', 
                                minHeight: 280,
                                borderRadius: 3, 
                                border: '2px dashed #e0e0e0',
                                boxShadow: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                '&:hover': { bgcolor: '#fff3e0', borderColor: '#ffb74d' }
                            }}
                        >
                            <Box sx={{ textAlign: 'center' }}>
                                <AddIcon sx={{ fontSize: 50, color: '#ffb74d', mb: 1 }} />
                                <Typography variant="h6" fontWeight="bold">Create New Trip</Typography>
                            </Box>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
};

export default Dashboard;