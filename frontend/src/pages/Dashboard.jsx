import React, { useState, useEffect } from 'react';
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
    IconButton,
    Alert,
    CircularProgress,
    Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import CreateItineraryDialog from '../components/CreateItineraryDialog';

// Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import MapIcon from '@mui/icons-material/Map';
import GroupIcon from '@mui/icons-material/Group';
import CloudIcon from '@mui/icons-material/Cloud';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import AddIcon from '@mui/icons-material/Add';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

const drawerWidth = 240;

const Dashboard = () => {
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);
    
    // User from localStorage
    const [user, setUser] = useState({
        id: null,
        name: "Traveler",
        initial: "T"
    });

    // Itineraries state
    const [itineraries, setItineraries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Create Itinerary Dialog
    const [dialogOpen, setDialogOpen] = useState(false);

    // Load user data from localStorage
    useEffect(() => {
        const userId = localStorage.getItem('userId');
        const userName = localStorage.getItem('userName');
        const userEmail = localStorage.getItem('userEmail');

        if (!userId) {
            // Not logged in, redirect to login
            navigate('/login');
            return;
        }

        setUser({
            id: parseInt(userId),
            name: userName || 'Traveler',
            initial: (userName || 'T')[0].toUpperCase()
        });

        // Fetch user's itineraries
        fetchItineraries(parseInt(userId));
    }, [navigate]);

    // Fetch itineraries from API
    const fetchItineraries = async (userId) => {
        try {
            setLoading(true);
            const response = await axios.get(`http://127.0.0.1:8000/itineraries/user/${userId}`);
            setItineraries(response.data);
            setError('');
        } catch (err) {
            console.error('Error fetching itineraries:', err);
            if (err.code === 'ERR_NETWORK') {
                setError('Cannot connect to server. Please make sure the backend is running.');
            } else {
                setError('Failed to load your trips. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    // Handle dialog open/close
    const handleDialogOpen = () => {
        setDialogOpen(true);
    };

    const handleDialogClose = () => {
        setDialogOpen(false);
    };

    const handleItineraryCreated = () => {
        // Refresh the itineraries list
        fetchItineraries(user.id);
    };

    // Calculate trip duration in days
    const calculateDuration = (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
    };

    // Format date for display
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // Get status color
    const getStatusColor = (status) => {
        const colors = {
            planning: 'info',
            confirmed: 'success',
            ongoing: 'warning',
            completed: 'default',
            cancelled: 'error'
        };
        return colors[status] || 'default';
    };

    // --- SIDEBAR CONTENT ---
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
                            selected={index === 0}
                            sx={{ 
                                borderRadius: 2,
                                '&.Mui-selected': { 
                                    bgcolor: '#fff3e0',
                                    color: '#e65100',
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
            
            {/* --- TOP APP BAR --- */}
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
                            onClick={handleDialogOpen}
                            sx={{ 
                                bgcolor: '#ffb74d',
                                color: 'black',
                                fontWeight: 'bold',
                                '&:hover': { bgcolor: '#ffa726' },
                                display: { xs: 'none', md: 'flex' }
                            }}
                        >
                            New Trip
                        </Button>
                        <IconButton
                            sx={{ 
                                bgcolor: '#ffb74d',
                                color: 'black',
                                '&:hover': { bgcolor: '#ffa726' },
                                display: { xs: 'flex', md: 'none' }
                            }}
                            onClick={handleDialogOpen}
                        >
                            <AddIcon />
                        </IconButton>
                        <Avatar sx={{ bgcolor: '#ffb74d', color: 'black' }}>{user.initial}</Avatar>
                    </Stack>
                </Toolbar>
            </AppBar>

            {/* --- NAVIGATION DRAWER --- */}
            <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
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

                {/* Error Alert */}
                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                {/* Content Grid */}
                <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
                    Your Trips ({itineraries.length})
                </Typography>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress sx={{ color: '#ffb74d' }} />
                    </Box>
                ) : (
                    <Grid container spacing={3}>
                        {/* Existing Trips */}
                        {itineraries.map((trip) => (
                            <Grid item xs={12} md={6} lg={4} key={trip.id}>
                                <Card sx={{ 
                                    borderRadius: 3, 
                                    boxShadow: 3, 
                                    transition: '0.3s', 
                                    '&:hover': { transform: 'translateY(-5px)', boxShadow: 6 },
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}>
                                    <Box sx={{ 
                                        height: 160, 
                                        bgcolor: 'grey.300', 
                                        backgroundImage: 'url(https://images.unsplash.com/photo-1544634129-79888806509c?q=80&w=2071&auto=format&fit=crop)', 
                                        backgroundSize: 'cover',
                                        position: 'relative'
                                    }}>
                                        <Chip 
                                            label={trip.status.toUpperCase()}
                                            size="small"
                                            color={getStatusColor(trip.status)}
                                            sx={{ position: 'absolute', top: 10, right: 10 }}
                                        />
                                    </Box>
                                    <CardContent sx={{ flexGrow: 1 }}>
                                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                                            {trip.title}
                                        </Typography>
                                        
                                        <Stack spacing={1} sx={{ mt: 2 }}>
                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                <LocationOnIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    {trip.destination}
                                                </Typography>
                                            </Stack>
                                            
                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                <CalendarTodayIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                                                </Typography>
                                            </Stack>
                                            
                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                <AttachMoneyIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    {trip.currency} {trip.estimated_budget.toLocaleString()}
                                                </Typography>
                                            </Stack>
                                        </Stack>
                                        
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                                            {calculateDuration(trip.start_date, trip.end_date)} days trip
                                        </Typography>
                                        
                                        <Button 
                                            fullWidth 
                                            variant="outlined" 
                                            sx={{ 
                                                mt: 2, 
                                                borderColor: '#ffb74d', 
                                                color: 'black',
                                                '&:hover': { borderColor: '#ffa726', bgcolor: 'rgba(255, 183, 77, 0.1)' }
                                            }}
                                            onClick={() => navigate(`/itinerary/${trip.id}`)}
                                        >
                                            Open Itinerary
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}

                        {/* Create New Card */}
                        <Grid item xs={12} md={6} lg={4}>
                            <Card 
                                sx={{ 
                                    height: '100%', 
                                    minHeight: 350,
                                    borderRadius: 3, 
                                    border: '2px dashed #e0e0e0',
                                    boxShadow: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    transition: '0.3s',
                                    '&:hover': { 
                                        bgcolor: '#fff3e0', 
                                        borderColor: '#ffb74d',
                                        transform: 'translateY(-5px)'
                                    }
                                }}
                                onClick={handleDialogOpen}
                            >
                                <Box sx={{ textAlign: 'center', p: 3 }}>
                                    <AddIcon sx={{ fontSize: 60, color: '#ffb74d', mb: 2 }} />
                                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                                        Create New Trip
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Start planning your next adventure
                                    </Typography>
                                </Box>
                            </Card>
                        </Grid>
                    </Grid>
                )}
            </Box>

            {/* --- CREATE ITINERARY DIALOG --- */}
            <CreateItineraryDialog
                open={dialogOpen}
                onClose={handleDialogClose}
                userId={user.id}
                onSuccess={handleItineraryCreated}
            />
        </Box>
    );
};

export default Dashboard;