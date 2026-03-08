import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Button, 
    Container, 
    Typography, 
    Stack,
    IconButton,
    Card,
    CardContent,
    CardMedia,
    Grid,
    TextField,
    InputAdornment,
    Avatar,
    Chip,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
    Alert,
    CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import CreateItineraryDialog from '../components/CreateItineraryDialog';

// Icons
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AddIcon from '@mui/icons-material/Add';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MapIcon from '@mui/icons-material/Map';
import GroupIcon from '@mui/icons-material/Group';
import ExploreIcon from '@mui/icons-material/Explore';
import LogoutIcon from '@mui/icons-material/Logout';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

// Brand Colors
const COLORS = {
    brand: '#33CCCC',
    background: '#141627',
    cardPrimary: '#252845',
    cardSecondary: 'rgba(255, 255, 255, 0.1)',
    headings: '#B0D2EB',
    subheadings: '#C0D2EB',
    text: '#D0D2EB',
    fadedText: '#7B809A',
    icons: '#B0D2EB'
};

const drawerWidth = 240;

const Dashboard = () => {
    const navigate = useNavigate();
    
    // User from localStorage
    const [user, setUser] = useState({
        id: null,
        name: "User",
        initial: "U"
    });

    // Itineraries state
    const [itineraries, setItineraries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Create Itinerary Dialog
    const [dialogOpen, setDialogOpen] = useState(false);

    // Calendar state
    const [currentDate, setCurrentDate] = useState(new Date());

    // Load user data from localStorage
    useEffect(() => {
        const userId = localStorage.getItem('userId');
        const userName = localStorage.getItem('userName');

        if (!userId) {
            navigate('/login');
            return;
        }

        setUser({
            id: parseInt(userId),
            name: userName || 'User',
            initial: (userName || 'U')[0].toUpperCase()
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

    // Hardcoded similar itineraries for demo
    const similarItineraries = [
        {
            id: 1,
            title: 'ACT Via Tilicho',
            destination: 'Annapurna',
            image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=400',
            estimatedBudget: 55000,
            currency: '₹',
            duration: '5 Days Long'
        },
        {
            id: 2,
            title: 'Durbar Square Trip',
            destination: 'Kathmandu',
            image: 'https://images.unsplash.com/photo-1748760036656-964ac32eefb4?q=80&w=400',
            estimatedBudget: 12000,
            currency: '₹',
            duration: '2 Days Long'
        },
        {
            id: 3,
            title: 'Everest Base Camp',
            destination: 'Solukhumbu',
            image: 'https://images.unsplash.com/photo-1673505413397-0cd0dc4f5854?q=80&w=400',
            estimatedBudget: 85000,
            currency: '₹',
            duration: '12 Days Long'
        }
    ];

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    const handleDialogOpen = () => setDialogOpen(true);
    const handleDialogClose = () => setDialogOpen(false);

    const handleItineraryCreated = () => {
        // Refresh the itineraries list
        fetchItineraries(user.id);
    };

    // Calendar functions
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        return { daysInMonth, startingDayOfWeek };
    };

    const formatMonthYear = (date) => {
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
    };

    const previousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    const isToday = (day) => {
        const today = new Date();
        return day === today.getDate() && 
               currentDate.getMonth() === today.getMonth() && 
               currentDate.getFullYear() === today.getFullYear();
    };

    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
    const calendarDays = [];
    for (let i = 0; i < startingDayOfWeek; i++) calendarDays.push(null);
    for (let day = 1; day <= daysInMonth; day++) calendarDays.push(day);

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

    // Get status chip color
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

    // --- SIDEBAR MENU (with navigation paths) ---
    const sidebarMenu = [
        { text: 'Dashboard',      icon: <DashboardIcon />, active: true,  path: '/dashboard' },
        { text: 'My Itineraries', icon: <ExploreIcon />,   active: false, path: '/itineraries' },
        { text: 'Interactive Map',icon: <MapIcon />,        active: false, path: '/dashboard' },
        { text: 'Community Feed', icon: <GroupIcon />,      active: false, path: '/community' },
    ];

    return (
        <Box sx={{ 
            display: 'flex', 
            bgcolor: COLORS.background, 
            minHeight: '100vh',
            width: '100vw',
            position: 'fixed',
            top: 0,
            left: 0,
            overflow: 'hidden'
        }}>
            {/* --- SIDEBAR --- */}
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                        bgcolor: COLORS.background,
                        borderRight: 'none',
                        backgroundImage: 'linear-gradient(to bottom, rgba(51, 204, 204, 0.05), transparent)'
                    },
                }}
            >
                {/* Logo */}
                <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Box component="span" sx={{ color: COLORS.brand, fontSize: '1.5rem' }}>✈</Box>
                        <Typography variant="h6" fontWeight="bold" sx={{ color: 'white', fontFamily: '"Exo 2", sans-serif', letterSpacing: 0.5 }}>
                            Smart <Box component="span" sx={{ color: COLORS.brand }}>Itinerary</Box>
                        </Typography>
                    </Stack>
                </Box>

                {/* Menu Items */}
                <List sx={{ px: 2, mt: 2, flexGrow: 1 }}>
                    {sidebarMenu.map((item) => (
                        <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                            <ListItemButton 
                                selected={item.active}
                                onClick={() => navigate(item.path)}  // ← navigation added
                                sx={{ 
                                    borderRadius: 2,
                                    color: item.active ? COLORS.background : COLORS.subheadings,
                                    '&.Mui-selected': { 
                                        bgcolor: COLORS.brand,
                                        color: COLORS.background,
                                        '&:hover': { bgcolor: '#2db8b8' }
                                    },
                                    '&:hover': {
                                        bgcolor: COLORS.cardSecondary
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ 
                                    color: item.active ? COLORS.background : COLORS.subheadings,
                                    minWidth: 40
                                }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText 
                                    primary={item.text} 
                                    primaryTypographyProps={{ 
                                        fontWeight: item.active ? 'bold' : 'medium',
                                        fontSize: '0.9rem'
                                    }} 
                                />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>

                {/* Logout Button */}
                <Box sx={{ p: 2 }}>
                    <Button 
                        fullWidth 
                        startIcon={<LogoutIcon />} 
                        onClick={handleLogout}
                        sx={{
                            color: COLORS.fadedText,
                            bgcolor: 'transparent',
                            '&:hover': {
                                color: '#ff6b6b',
                                bgcolor: 'rgba(255, 107, 107, 0.1)'
                            }
                        }}
                    >
                        Logout
                    </Button>
                </Box>
            </Drawer>

            {/* --- MAIN CONTENT AREA --- */}
            <Box 
                component="main" 
                sx={{ 
                    flexGrow: 1, 
                    p: 3,
                    height: '100vh',
                    overflow: 'auto',
                    bgcolor: COLORS.background
                }}
            >
                {/* Top Bar */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                    {/* Left Spacer */}
                    <Box sx={{ width: 200 }} />

                    {/* Search Bar - Centered */}
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1, maxWidth: 650 }}>
                        <TextField
                            placeholder="Search for your favourite destination"
                            variant="outlined"
                            fullWidth
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: COLORS.cardPrimary,
                                    borderRadius: 5,
                                    color: COLORS.text,
                                    '& fieldset': { borderColor: COLORS.cardSecondary },
                                    '&:hover fieldset': { borderColor: COLORS.brand },
                                    '&.Mui-focused fieldset': { borderColor: COLORS.brand }
                                },
                                '& .MuiInputBase-input': { padding: '14px 16px' },
                                '& .MuiInputBase-input::placeholder': {
                                    color: COLORS.fadedText,
                                    opacity: 1
                                }
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ color: COLORS.fadedText }} />
                                    </InputAdornment>
                                )
                            }}
                        />
                        <Button
                            variant="contained"
                            sx={{
                                bgcolor: COLORS.brand,
                                color: COLORS.background,
                                fontWeight: 'bold',
                                px: 4,
                                py: 1.75,
                                borderRadius: 5,
                                textTransform: 'uppercase',
                                fontSize: '0.875rem',
                                whiteSpace: 'nowrap',
                                '&:hover': { 
                                    bgcolor: '#2db8b8',
                                    transform: 'translateY(-2px)',
                                    boxShadow: `0 4px 12px ${COLORS.brand}40`
                                },
                                transition: 'all 0.3s'
                            }}
                        >
                            Search
                        </Button>
                    </Stack>

                    {/* Right Side Actions */}
                    <Stack direction="row" spacing={2} alignItems="center">
                        <IconButton 
                            sx={{ 
                                bgcolor: COLORS.cardPrimary,
                                color: COLORS.icons,
                                position: 'relative',
                                borderRadius: 3,
                                '&:hover': { bgcolor: COLORS.cardSecondary }
                            }}
                        >
                            <NotificationsIcon />
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: 8,
                                    right: 8,
                                    width: 8,
                                    height: 8,
                                    bgcolor: '#ff6b6b',
                                    borderRadius: '50%'
                                }}
                            />
                        </IconButton>

                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleDialogOpen}
                            sx={{
                                bgcolor: COLORS.brand,
                                color: COLORS.background,
                                fontWeight: 'bold',
                                borderRadius: 5,
                                px: 3,
                                py: 1.25,
                                textTransform: 'uppercase',
                                '&:hover': { 
                                    bgcolor: '#2db8b8',
                                    transform: 'translateY(-2px)',
                                    boxShadow: `0 4px 12px ${COLORS.brand}40`
                                },
                                transition: 'all 0.3s'
                            }}
                        >
                            New Trip
                        </Button>

                        <Avatar 
                            sx={{ 
                                bgcolor: COLORS.brand,
                                color: COLORS.background,
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                width: 44,
                                height: 44
                            }}
                        >
                            {user.initial}
                        </Avatar>
                    </Stack>
                </Stack>

                {/* 3-Column Layout: Content (left) and Sidebar (right) */}
                <Box sx={{ display: 'flex', gap: 3 }}>
                    {/* Main Content Column */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        {/* Welcome Section */}
                        <Box sx={{ mb: 4 }}>
                            <Typography variant="h4" fontWeight="bold" sx={{ color: COLORS.headings, mb: 0.5 }}>
                                Hello {user.name}!
                            </Typography>
                            <Typography variant="body1" sx={{ color: COLORS.fadedText }}>
                                Welcome back on your explorations.
                            </Typography>
                        </Box>

                        {/* Your Trips Section */}
                        <Box sx={{ mb: 4 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                                <Typography variant="h5" fontWeight="bold" sx={{ color: COLORS.headings }}>
                                    Your Trips
                                </Typography>
                                <Button
                                    sx={{
                                        color: COLORS.brand,
                                        textTransform: 'none',
                                        '&:hover': { bgcolor: 'transparent', color: '#2db8b8' }
                                    }}
                                >
                                    View All
                                </Button>
                            </Stack>

                            {/* Error Alert */}
                            {error && (
                                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                                    {error}
                                </Alert>
                            )}

                            {loading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                                    <CircularProgress sx={{ color: COLORS.brand }} />
                                </Box>
                            ) : itineraries.length === 0 ? (
                                // Empty State for New Users
                                <Card
                                    sx={{
                                        bgcolor: COLORS.cardPrimary,
                                        borderRadius: 5,
                                        p: 6,
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s',
                                        '&:hover': {
                                            bgcolor: COLORS.cardSecondary,
                                            transform: 'translateY(-4px)',
                                            boxShadow: `0 8px 24px ${COLORS.brand}20`
                                        }
                                    }}
                                    onClick={handleDialogOpen}
                                >
                                    <Box sx={{ mb: 2 }}>
                                        <AddIcon sx={{ fontSize: 60, color: COLORS.brand }} />
                                    </Box>
                                    <Typography variant="h5" fontWeight="bold" sx={{ color: COLORS.headings, mb: 1 }}>
                                        Start Your First Adventure
                                    </Typography>
                                    <Typography variant="body1" sx={{ color: COLORS.text, mb: 2 }}>
                                        Create your first itinerary and begin planning your dream trip to Nepal
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: COLORS.fadedText }}>
                                        Click anywhere to get started
                                    </Typography>
                                </Card>
                            ) : (
                                // Trips Grid (when user has trips)
                                <Grid container spacing={3}>
                                    {itineraries.map((trip) => (
                                        <Grid item xs={12} sm={6} md={4} key={trip.id}>
                                            <Card
                                                sx={{
                                                    bgcolor: COLORS.cardPrimary,
                                                    borderRadius: 5,
                                                    overflow: 'hidden',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.3s',
                                                    '&:hover': {
                                                        transform: 'translateY(-8px)',
                                                        boxShadow: `0 8px 24px ${COLORS.brand}20`
                                                    }
                                                }}
                                                onClick={() => navigate(`/itinerary/${trip.id}`)}
                                            >
                                                <CardMedia
                                                    component="img"
                                                    height="180"
                                                    image='https://images.unsplash.com/photo-1609750727688-1176db9980ae?q=80&w=2071&auto=format&fit=crop'
                                                    alt={trip.title}
                                                />
                                                <CardContent sx={{ p: 2.5 }}>
                                                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                                                        <Typography variant="h6" fontWeight="bold" sx={{ color: COLORS.headings }}>
                                                            {trip.title}
                                                        </Typography>
                                                        <Chip
                                                            label={trip.status?.toUpperCase()}
                                                            size="small"
                                                            color={getStatusColor(trip.status)}
                                                        />
                                                    </Stack>
                                                    <Stack spacing={1}>
                                                        <Stack direction="row" alignItems="center" spacing={0.5}>
                                                            <LocationOnIcon sx={{ fontSize: 14, color: COLORS.fadedText }} />
                                                            <Typography variant="body2" sx={{ color: COLORS.fadedText }}>
                                                                {trip.destination}
                                                            </Typography>
                                                        </Stack>
                                                        <Typography variant="body2" fontWeight="bold" sx={{ color: COLORS.brand }}>
                                                            Estimated Budget {trip.currency} {trip.estimated_budget?.toLocaleString()}
                                                        </Typography>
                                                        <Stack direction="row" alignItems="center" spacing={0.5}>
                                                            <CalendarTodayIcon sx={{ fontSize: 14, color: COLORS.fadedText }} />
                                                            <Typography variant="caption" sx={{ color: COLORS.fadedText }}>
                                                                {formatDate(trip.start_date)} – {formatDate(trip.end_date)} · {calculateDuration(trip.start_date, trip.end_date)} days
                                                            </Typography>
                                                        </Stack>
                                                    </Stack>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            )}
                        </Box>

                        {/* Similar Itineraries Section */}
                        <Box>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                                <Typography variant="h5" fontWeight="bold" sx={{ color: COLORS.headings }}>
                                    Similar Itineraries
                                </Typography>
                                <Button
                                    sx={{
                                        color: COLORS.brand,
                                        textTransform: 'none',
                                        '&:hover': { bgcolor: 'transparent', color: '#2db8b8' }
                                    }}
                                >
                                    View More
                                </Button>
                            </Stack>

                            {/* Flex Row Layout for Similar Itineraries */}
                            <Stack direction="row" spacing={2.5} sx={{ overflowX: 'auto', pb: 2 }}>
                                {similarItineraries.map((itinerary) => (
                                    <Card
                                        key={itinerary.id}
                                        sx={{
                                            bgcolor: COLORS.cardPrimary,
                                            borderRadius: 5,
                                            overflow: 'hidden',
                                            cursor: 'pointer',
                                            minWidth: 312,
                                            maxWidth: 312,
                                            transition: 'all 0.3s',
                                            '&:hover': {
                                                transform: 'translateY(-8px)',
                                                boxShadow: `0 8px 24px ${COLORS.brand}20`
                                            }
                                        }}
                                    >
                                        <Stack direction="row" spacing={2} sx={{ p: 2.5 }}>
                                            <Box
                                                component="img"
                                                src={itinerary.image}
                                                alt={itinerary.title}
                                                sx={{
                                                    width: 75,
                                                    height: '100%',
                                                    minHeight: 100,
                                                    borderRadius: 3.5,
                                                    objectFit: 'cover'
                                                }}
                                            />
                                            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
                                                <Box>
                                                    <Typography 
                                                        variant="subtitle1" 
                                                        fontWeight="bold" 
                                                        sx={{ 
                                                            color: COLORS.headings, 
                                                            mb: 0.5,
                                                            fontSize: '0.95rem',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap'
                                                        }}
                                                    >
                                                        {itinerary.title}
                                                    </Typography>
                                                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.8 }}>
                                                        <LocationOnIcon sx={{ fontSize: 13, color: '#ff6b6b' }} />
                                                        <Typography variant="caption" sx={{ color: COLORS.fadedText, fontSize: '0.75rem' }}>
                                                            {itinerary.destination}
                                                        </Typography>
                                                    </Stack>
                                                </Box>
                                                <Box>
                                                    <Typography variant="body2" fontWeight="bold" sx={{ color: COLORS.brand, mb: 0.4, fontSize: '0.85rem' }}>
                                                        {itinerary.currency} {itinerary.estimatedBudget.toLocaleString()}
                                                    </Typography>
                                                    <Stack direction="row" alignItems="center" spacing={0.5}>
                                                        <CalendarTodayIcon sx={{ fontSize: 13, color: COLORS.fadedText }} />
                                                        <Typography variant="caption" sx={{ color: COLORS.fadedText, fontSize: '0.75rem' }}>
                                                            {itinerary.duration}
                                                        </Typography>
                                                    </Stack>
                                                </Box>
                                            </Box>
                                        </Stack>
                                    </Card>
                                ))}
                            </Stack>
                        </Box>
                    </Box>

                    {/* Right Sidebar - Calendar & Map */}
                    <Box sx={{ width: 400, flexShrink: 0 }}>
                        {/* Calendar Widget */}
                        <Card
                            sx={{
                                bgcolor: COLORS.cardPrimary,
                                borderRadius: 5,
                                p: 3,
                                mb: 3
                            }}
                        >
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                                <Typography variant="body1" fontWeight="bold" sx={{ color: COLORS.subheadings }}>
                                    {formatMonthYear(currentDate)}
                                </Typography>
                                <Stack direction="row" spacing={1}>
                                    <IconButton 
                                        size="small" 
                                        onClick={previousMonth}
                                        sx={{ 
                                            color: COLORS.icons,
                                            borderRadius: 2,
                                            '&:hover': { 
                                                color: COLORS.brand,
                                                bgcolor: COLORS.cardSecondary
                                            } 
                                        }}
                                    >
                                        <ChevronLeftIcon />
                                    </IconButton>
                                    <IconButton 
                                        size="small" 
                                        onClick={nextMonth}
                                        sx={{ 
                                            color: COLORS.icons,
                                            borderRadius: 2,
                                            '&:hover': { 
                                                color: COLORS.brand,
                                                bgcolor: COLORS.cardSecondary
                                            } 
                                        }}
                                    >
                                        <ChevronRightIcon />
                                    </IconButton>
                                </Stack>
                            </Stack>

                            {/* Calendar Grid */}
                            <Box>
                                {/* Day Headers */}
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, mb: 1 }}>
                                    {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
                                        <Typography
                                            key={day}
                                            variant="caption"
                                            align="center"
                                            sx={{ 
                                                color: COLORS.fadedText,
                                                fontWeight: 'bold',
                                                fontSize: '0.65rem'
                                            }}
                                        >
                                            {day}
                                        </Typography>
                                    ))}
                                </Box>

                                {/* Calendar Days */}
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
                                    {calendarDays.map((day, index) => (
                                        <Box key={index}>
                                            {day ? (
                                                <Box
                                                    sx={{
                                                        aspectRatio: '1',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        borderRadius: 2,
                                                        cursor: 'pointer',
                                                        bgcolor: isToday(day) ? '#ff6b6b' : 'transparent',
                                                        color: isToday(day) ? 'white' : COLORS.text,
                                                        fontWeight: isToday(day) ? 'bold' : 'normal',
                                                        fontSize: '0.85rem',
                                                        transition: 'all 0.2s',
                                                        '&:hover': {
                                                            bgcolor: isToday(day) ? '#ff6b6b' : COLORS.cardSecondary,
                                                            transform: 'scale(1.1)'
                                                        }
                                                    }}
                                                >
                                                    {day}
                                                </Box>
                                            ) : (
                                                <Box sx={{ aspectRatio: '1' }} />
                                            )}
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        </Card>

                        {/* Map View */}
                        <Card
                            sx={{
                                bgcolor: COLORS.cardPrimary,
                                borderRadius: 5,
                                overflow: 'hidden'
                            }}
                        >
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2.5 }}>
                                <Typography variant="h6" fontWeight="bold" sx={{ color: COLORS.headings }}>
                                    MapView
                                </Typography>
                                <Button
                                    size="small"
                                    sx={{
                                        color: COLORS.brand,
                                        textTransform: 'none',
                                        borderRadius: 3,
                                        '&:hover': { bgcolor: COLORS.cardSecondary }
                                    }}
                                >
                                    Expand
                                </Button>
                            </Stack>
                            <Box
                                component="img"
                                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=600"
                                alt="Map view"
                                sx={{
                                    width: '100%',
                                    height: 280,
                                    objectFit: 'cover'
                                }}
                            />
                        </Card>
                    </Box>
                </Box>
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