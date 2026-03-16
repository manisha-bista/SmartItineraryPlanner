import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Stack, Card, CardMedia, CardContent,
    Grid, Button, TextField, InputAdornment, Avatar,
    Drawer, List, ListItem, ListItemButton, ListItemIcon,
    ListItemText, CircularProgress, Alert, Chip,
    Dialog, DialogTitle, DialogContent, DialogActions, IconButton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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
import DeleteIcon from '@mui/icons-material/Delete';
import CreateItineraryDialog from '../components/CreateItineraryDialog';

const COLORS = {
    brand: '#33CCCC',
    background: '#141627',
    cardPrimary: '#252845',
    cardSecondary: 'rgba(255, 255, 255, 0.1)',
    headings: '#B0D2EB',
    subheadings: '#C0D2EB',
    text: '#D0D2EB',
    fadedText: '#7B809A',
    icons: '#B0D2EB',
    error: '#ff6b6b',
};


const getImage = (destination = '') => {
    const lower = destination.toLowerCase();
    for (const [key, url] of Object.entries(DESTINATION_IMAGES)) {
        if (key !== 'default' && lower.includes(key)) return url;
    }
    return DESTINATION_IMAGES.default;
};

const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const STATUS_COLORS = {
    planning: '#33CCCC',
    confirmed: '#66d9a0',
    ongoing: '#ffb74d',
    completed: '#7B809A',
    cancelled: '#ff6b6b',
};

const MyItineraries = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState({ id: null, name: 'User', initial: 'U' });
    const [itineraries, setItineraries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [deleteId, setDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);

    useEffect(() => {
        const userId = localStorage.getItem('userId');
        const userName = localStorage.getItem('userName');
        if (!userId) { navigate('/login'); return; }
        setUser({ id: parseInt(userId), name: userName || 'User', initial: (userName || 'U')[0].toUpperCase() });
        axios.get(`http://127.0.0.1:8000/itineraries/user/${userId}`)
            .then(r => setItineraries(r.data))
            .catch(() => setError('Could not load itineraries. Is the backend running?'))
            .finally(() => setLoading(false));
    }, [navigate]);

    const today = new Date(); today.setHours(0, 0, 0, 0);

    const filtered = itineraries.filter(t =>
        !search || t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.destination.toLowerCase().includes(search.toLowerCase())
    );

    const current = filtered.filter(t => new Date(t.end_date) >= today);
    const past = filtered.filter(t => new Date(t.end_date) < today);

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await axios.delete(`http://127.0.0.1:8000/itineraries/${deleteId}`);
            setItineraries(prev => prev.filter(t => t.id !== deleteId));
            setDeleteId(null);
        } catch { setError('Delete failed.'); }
        finally { setDeleting(false); }
    };

    const TripCard = ({ trip, faded }) => (
        <Card
            onClick={() => navigate(`/itinerary/${trip.id}`)}
            sx={{
                bgcolor: COLORS.cardPrimary, borderRadius: 5, overflow: 'hidden',
                cursor: 'pointer', opacity: faded ? 0.7 : 1,
                transition: 'all 0.3s',
                '&:hover': { transform: 'translateY(-6px)', opacity: 1, boxShadow: `0 12px 32px rgba(51,204,204,0.15)` }
            }}
        >
            <Box sx={{ position: 'relative' }}>
                <CardMedia component="img" height="160" image={trip.cover_photo ? `http://127.0.0.1:8000/places/photo?photo_reference=${trip.cover_photo}&max_width=600` : 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=600&auto=format&fit=crop'} alt={trip.title} />
                <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
                    <IconButton
                        size="small"
                        onClick={e => { e.stopPropagation(); setDeleteId(trip.id); }}
                        sx={{ bgcolor: 'rgba(20,22,39,0.7)', color: COLORS.error, backdropFilter: 'blur(4px)', '&:hover': { bgcolor: 'rgba(255,107,107,0.2)' } }}
                    >
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Box>
            </Box>
            <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ color: COLORS.headings, mb: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {trip.title}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1.5 }}>
                    <LocationOnIcon sx={{ fontSize: 13, color: COLORS.error }} />
                    <Typography variant="caption" sx={{ color: COLORS.fadedText }}>{trip.destination}</Typography>
                    <Box sx={{ ml: 'auto !important' }}>
                        <Chip label={trip.status} size="small"
                            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: `${STATUS_COLORS[trip.status] || COLORS.brand}20`, color: STATUS_COLORS[trip.status] || COLORS.brand }} />
                    </Box>
                </Stack>
                <Typography variant="body2" fontWeight="bold" sx={{ color: COLORS.brand, mb: 0.5 }}>
                    {trip.currency} {trip.estimated_budget?.toLocaleString()}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                    <CalendarTodayIcon sx={{ fontSize: 12, color: COLORS.fadedText }} />
                    <Typography variant="caption" sx={{ color: COLORS.fadedText, fontSize: '0.7rem' }}>
                        {formatDate(trip.start_date)} – {formatDate(trip.end_date)}
                    </Typography>
                </Stack>
            </CardContent>
        </Card>
    );

    const sidebarMenu = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
        { text: 'My Itineraries', icon: <ExploreIcon />, path: '/itineraries', active: true },
        { text: 'Interactive Map', icon: <MapIcon />, path: '/map' },
        { text: 'Community Feed', icon: <GroupIcon />, path: '/community' },
    ];

    return (
        <Box sx={{ display: 'flex', bgcolor: COLORS.background, minHeight: '100vh', width: '100vw', position: 'fixed', top: 0, left: 0, overflow: 'hidden' }}>
            {/* Sidebar */}
            <Drawer variant="permanent" sx={{ width: 240, '& .MuiDrawer-paper': { width: 240, bgcolor: COLORS.background, borderRight: 'none', backgroundImage: 'linear-gradient(to bottom, rgba(51,204,204,0.05), transparent)' } }}>
                {/* Logo */}
                <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Box component="span" sx={{ color: COLORS.brand, fontSize: '1.5rem' }}>✈</Box>
                        <Typography variant="h6" fontWeight="bold" sx={{ color: 'white', fontFamily: '"Exo 2", sans-serif', letterSpacing: 0.5 }}>
                            Smart <Box component="span" sx={{ color: COLORS.brand }}>Itinerary</Box>
                        </Typography>
                    </Stack>
                </Box>
                <List sx={{ px: 2, mt: 2, flexGrow: 1 }}>
                    {sidebarMenu.map(item => (
                        <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                            <ListItemButton onClick={() => navigate(item.path)} selected={item.active}
                                sx={{ borderRadius: 2, color: item.active ? COLORS.background : COLORS.subheadings, '&.Mui-selected': { bgcolor: COLORS.brand, color: COLORS.background, '&:hover': { bgcolor: '#2db8b8' } }, '&:hover': { bgcolor: COLORS.cardSecondary } }}>
                                <ListItemIcon sx={{ color: item.active ? COLORS.background : COLORS.subheadings, minWidth: 40 }}>{item.icon}</ListItemIcon>
                                <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: item.active ? 'bold' : 'medium', fontSize: '0.9rem' }} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
                <Box sx={{ p: 2 }}>
                    <Button fullWidth startIcon={<LogoutIcon />} onClick={() => { localStorage.clear(); navigate('/'); }}
                        sx={{ color: COLORS.fadedText, '&:hover': { color: COLORS.error, bgcolor: 'rgba(255,107,107,0.1)' } }}>
                        Logout
                    </Button>
                </Box>
            </Drawer>

            {/* Main */}
            <Box component="main" sx={{ flexGrow: 1, p: 3, height: '100vh', overflow: 'auto' }}>
                {/* Topbar */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                    <Box sx={{ width: 200 }} />
                    <TextField placeholder="Search trips..." variant="outlined" value={search} onChange={e => setSearch(e.target.value)}
                        sx={{ maxWidth: 500, flex: 1, '& .MuiOutlinedInput-root': { bgcolor: COLORS.cardPrimary, borderRadius: 5, color: COLORS.text, '& fieldset': { borderColor: 'transparent' }, '&:hover fieldset': { borderColor: COLORS.brand }, '&.Mui-focused fieldset': { borderColor: COLORS.brand } }, '& .MuiInputBase-input': { padding: '14px 16px' }, '& .MuiInputBase-input::placeholder': { color: COLORS.fadedText, opacity: 1 } }}
                        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: COLORS.fadedText }} /></InputAdornment> }}
                    />
                    <Stack direction="row" spacing={2} alignItems="center">
                        <IconButton sx={{ bgcolor: COLORS.cardPrimary, color: COLORS.icons, borderRadius: 3, position: 'relative', '&:hover': { bgcolor: COLORS.cardSecondary } }}>
                            <NotificationsIcon />
                            <Box sx={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, bgcolor: COLORS.error, borderRadius: '50%' }} />
                        </IconButton>
                        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}
                            sx={{ bgcolor: COLORS.brand, color: COLORS.background, fontWeight: 'bold', borderRadius: 5, px: 3, py: 1.25, textTransform: 'uppercase', '&:hover': { bgcolor: '#2db8b8' } }}>
                            New Trip
                        </Button>
                        <Avatar 
                            onClick={() => navigate('/profile')}
                            sx={{ 
                                bgcolor: COLORS.brand,
                                color: COLORS.background,
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                width: 44,
                                height: 44,
                                transition: 'all 0.2s',
                                '&:hover': {
                                    transform: 'scale(1.08)',
                                    boxShadow: `0 0 0 3px ${COLORS.brand}40`
                                }
                            }}
                        >
                            {user.initial}
                        </Avatar>
                    </Stack>
                </Stack>

           
                {error && <Alert severity="error" sx={{ mb: 3, bgcolor: 'rgba(255,107,107,0.1)', color: COLORS.error, border: 'none' }} onClose={() => setError('')}>{error}</Alert>}

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', pt: 10 }}>
                        <CircularProgress sx={{ color: COLORS.brand }} />
                    </Box>
                ) : (
                    <Box>
                        {/* Current & Upcoming */}
                        <Typography variant="h5" fontWeight="bold" sx={{ color: COLORS.headings, mb: 3 }}>
                            Current & Upcoming Trips
                            <Typography component="span" sx={{ ml: 1.5, color: COLORS.brand, fontSize: '0.85rem', fontWeight: 700 }}>({current.length})</Typography>
                        </Typography>

                        {current.length === 0 ? (
                            <Box sx={{ bgcolor: COLORS.cardPrimary, borderRadius: 5, p: 5, textAlign: 'center', mb: 5 }}>
                                <Typography variant="body1" sx={{ color: COLORS.fadedText }}>
                                    No upcoming trips.{' '}
                                    <Button onClick={() => setCreateOpen(true)} sx={{ color: COLORS.brand, p: 0, minWidth: 0, textTransform: 'none', fontWeight: 'bold' }}>Create one →</Button>
                                </Typography>
                            </Box>
                        ) : (
                            <Grid container spacing={3} sx={{ mb: 5 }}>
                                {current.map(trip => <Grid item xs={12} sm={6} md={4} lg={3} key={trip.id}><TripCard trip={trip} /></Grid>)}
                            </Grid>
                        )}

                        {/* Past */}
                        {past.length > 0 && (
                            <>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                                    <Box sx={{ height: 1, flex: 1, bgcolor: 'rgba(255,255,255,0.06)' }} />
                                    <Typography variant="caption" sx={{ color: COLORS.fadedText, fontWeight: 600 }}>PAST TRIPS</Typography>
                                    <Box sx={{ height: 1, flex: 1, bgcolor: 'rgba(255,255,255,0.06)' }} />
                                </Box>
                                <Typography variant="h5" fontWeight="bold" sx={{ color: COLORS.headings, mb: 3 }}>
                                    Past Trips
                                    <Typography component="span" sx={{ ml: 1.5, color: COLORS.fadedText, fontSize: '0.85rem', fontWeight: 700 }}>({past.length})</Typography>
                                </Typography>
                                <Grid container spacing={3}>
                                    {past.map(trip => <Grid item xs={12} sm={6} md={4} lg={3} key={trip.id}><TripCard trip={trip} faded /></Grid>)}
                                </Grid>
                            </>
                        )}

                        {itineraries.length === 0 && (
                            <Box sx={{ bgcolor: COLORS.cardPrimary, borderRadius: 5, p: 8, textAlign: 'center' }}>
                                <Typography variant="h6" sx={{ color: COLORS.headings, mb: 1 }}>No trips yet</Typography>
                                <Typography variant="body2" sx={{ color: COLORS.fadedText, mb: 3 }}>Start planning your first adventure!</Typography>
                                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}
                                    sx={{ bgcolor: COLORS.brand, color: COLORS.background, fontWeight: 'bold', borderRadius: 5 }}>
                                    Create Trip
                                </Button>
                            </Box>
                        )}
                    </Box>
                )}
            </Box>

            {/* Delete dialog */}
            <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}
                PaperProps={{ sx: { bgcolor: COLORS.cardPrimary, borderRadius: 4, border: '1px solid rgba(255,255,255,0.08)', minWidth: 340 } }}>
                <DialogTitle sx={{ color: COLORS.headings, fontWeight: 'bold' }}>Delete Trip?</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ color: COLORS.text }}>This will permanently delete the trip and all its data.</Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={() => setDeleteId(null)} sx={{ color: COLORS.fadedText, borderRadius: 3 }}>Cancel</Button>
                    <Button onClick={handleDelete} disabled={deleting} variant="contained"
                        sx={{ bgcolor: COLORS.error, color: 'white', fontWeight: 'bold', borderRadius: 3, '&:hover': { bgcolor: '#e05555' } }}>
                        {deleting ? <CircularProgress size={18} color="inherit" /> : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Create Trip dialog — same as Dashboard */}
            <CreateItineraryDialog
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                userId={user.id}
                onSuccess={() => {
                    setCreateOpen(false);
                    // reload itineraries
                    axios.get(`http://127.0.0.1:8000/itineraries/user/${user.id}`)
                        .then(r => setItineraries(r.data))
                        .catch(() => {});
                }}
            />
        </Box>
    );
};

export default MyItineraries;