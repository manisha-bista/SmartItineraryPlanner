import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Button,
    Typography,
    Stack,
    IconButton,
    Card,
    CardContent,
    CardMedia,
    TextField,
    InputAdornment,
    Chip,
    Alert,
    CircularProgress,
    Tooltip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import Navbar, { DRAWER_WIDTH } from '../components/Navbar';
import CreateItineraryDialog from '../components/CreateItineraryDialog';

import SearchIcon        from '@mui/icons-material/Search';
import AddIcon           from '@mui/icons-material/Add';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon    from '@mui/icons-material/LocationOn';
import AccessTimeIcon    from '@mui/icons-material/AccessTime';
import ChevronLeftIcon   from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon  from '@mui/icons-material/ChevronRight';

// ── Leaflet CDN loader ─────────────────────────────────────────────────────
let _leafletReady = null;
const loadLeafletLib = () => {
    if (_leafletReady) return _leafletReady;
    _leafletReady = new Promise((resolve) => {
        if (window.L) { resolve(window.L); return; }
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => resolve(window.L);
        document.head.appendChild(script);
    });
    return _leafletReady;
};

const DAY_COLORS_DASH = [
    '#33CCCC', '#FF7043', '#66BB6A', '#AB47BC',
    '#FFB74D', '#42A5F5', '#EC407A', '#26A69A',
];

const makeSmallIcon = (L, color, n) => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="28" viewBox="0 0 22 28">'
        + '<path d="M11 0C4.925 0 0 4.925 0 11c0 7.5 11 17 11 17S22 18.5 22 11C22 4.925 17.075 0 11 0z"'
        + ' fill="' + color + '" stroke="rgba(0,0,0,0.3)" stroke-width="1"/>'
        + '<circle cx="11" cy="11" r="6" fill="rgba(0,0,0,0.25)"/>'
        + '<text x="11" y="14.5" text-anchor="middle" font-size="8"'
        + ' font-family="sans-serif" font-weight="700" fill="white">' + n + '</text></svg>';
    return L.divIcon({ html: svg, className: '', iconSize: [22, 28], iconAnchor: [11, 28], popupAnchor: [0, -30] });
};



const Dashboard = () => {
    const navigate = useNavigate();
    const { COLORS, isDark } = useTheme();

    const [user, setUser] = useState({ id: null, name: 'User', avatarId: 1 });
    const [itineraries, setItineraries]     = useState([]);
    const [loading, setLoading]             = useState(false);
    const [error, setError]                 = useState('');
    const [dialogOpen, setDialogOpen]       = useState(false);
    const [currentDate, setCurrentDate]     = useState(new Date());
    const [latestDetail, setLatestDetail]   = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [recsLoading, setRecsLoading]         = useState(false);
    const [searchQuery, setSearchQuery]         = useState('');
    const [leafletLib, setLeafletLib]       = useState(null);
    const [calendarOpen, setCalendarOpen]    = useState(false);

    const miniMapRef     = useRef(null);
    const miniMapInst    = useRef(null);
    const miniLayersRef  = useRef([]);
    const miniTileRef    = useRef(null);

    // load user
    useEffect(() => {
        const userId   = localStorage.getItem('userId');
        const userName = localStorage.getItem('userName');
        if (!userId) { navigate('/login'); return; }
        const storedUsername = localStorage.getItem('username') || '';
        setUser({
            id: parseInt(userId),
            name: userName || 'User',
            username: storedUsername,
            avatarId: parseInt(localStorage.getItem('avatarId')) || 1,
        });
        const uid = parseInt(userId);
        fetchItineraries(uid);
        fetchRecommendations(uid);
        loadLeafletLib().then(L => setLeafletLib(L));

    }, [navigate]);

    const fetchRecommendations = async (userId) => {
        setRecsLoading(true);
        try {
            // Try personalised recommendations first
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_API_URL}recommendations/for-user/${userId}`, {
                params: { limit: 3 },
            });
            const personalised = res.data?.results || [];
            if (personalised.length > 0) {
                setRecommendations(personalised);
            } else {
                // New user — fall back to popular public itineraries
                const pop = await axios.get(`${import.meta.env.VITE_BACKEND_API_URL}recommendations/explore`, {
                    params: { limit: 3 },
                });
                setRecommendations(pop.data?.results || []);
            }
        } catch {
            // On any error, silently try explore as fallback
            try {
                const pop = await axios.get(`${import.meta.env.VITE_BACKEND_API_URL}recommendations/explore`, {
                    params: { limit: 3 },
                });
                setRecommendations(pop.data?.results || []);
            } catch { setRecommendations([]); }
        } finally {
            setRecsLoading(false);
        }
    };

    const handleSearch = () => {
        const q = searchQuery.trim();
        if (!q) return;
        navigate(`/search?q=${encodeURIComponent(q)}`);
    };

    // fetch detail for most recent itinerary
    useEffect(() => {
        if (!itineraries.length) return;
        axios.get(`${import.meta.env.VITE_BACKEND_API_URL}itineraries/` + itineraries[0].id)
            .then(r => setLatestDetail(r.data))
            .catch(() => {});
    }, [itineraries]);

    // init mini-map
    useEffect(() => {
        if (!leafletLib || !miniMapRef.current || miniMapInst.current) return;
        const map = leafletLib.map(miniMapRef.current, {
            center: [28.3949, 84.1240], zoom: 7,
            zoomControl: false, scrollWheelZoom: false,
            dragging: false, doubleClickZoom: false, attributionControl: false,
            touchZoom: false, tap: false, keyboard: false, boxZoom: false,
        });
        const tileUrl = isDark
            ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
            : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
        miniTileRef.current = leafletLib.tileLayer(tileUrl, { maxZoom: 19 });
        miniTileRef.current.addTo(map);
        miniMapInst.current = map;
        // Leaflet sets touch-action:none on the container even with dragging disabled,
        // which swallows touch-scroll events. Override it so the page can scroll freely.
        miniMapRef.current.style.touchAction = 'pan-y';
    }, [leafletLib]);

    // swap tile when theme changes
    useEffect(() => {
        const map = miniMapInst.current;
        const L   = leafletLib;
        if (!map || !L) return;
        if (miniTileRef.current) map.removeLayer(miniTileRef.current);
        const tileUrl = isDark
            ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
            : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
        miniTileRef.current = L.tileLayer(tileUrl, { maxZoom: 19 });
        miniTileRef.current.addTo(map);
    }, [isDark, leafletLib]);

    // auto-scroll calendar to trip start month
    useEffect(() => {
        if (!latestDetail?.start_date) return;
        const s = new Date(latestDetail.start_date);
        setCurrentDate(new Date(s.getFullYear(), s.getMonth(), 1));
    }, [latestDetail]);

    // plot markers
    useEffect(() => {
        const map = miniMapInst.current;
        const L   = leafletLib;
        if (!map || !L || !latestDetail?.days?.length) return;
        miniLayersRef.current.forEach(l => { try { map.removeLayer(l); } catch (_) {} });
        miniLayersRef.current = [];
        const allPoints = [];
        latestDetail.days.forEach((day, dayIdx) => {
            const color = DAY_COLORS_DASH[dayIdx % DAY_COLORS_DASH.length];
            const pts   = [];
            (day.activities || []).forEach((act, i) => {
                if (!act.latitude || !act.longitude) return;
                const ll = [act.latitude, act.longitude];
                pts.push(ll); allPoints.push(ll);
                const marker = L.marker(ll, { icon: makeSmallIcon(L, color, i + 1) });
                marker.bindPopup(
                    '<div style="font-family:sans-serif;font-size:12px;color:#B0D2EB;font-weight:700">' + (act.title || act.location) + '</div>'
                    + '<div style="font-size:10px;color:#7B809A">Day ' + day.day_number + '</div>',
                    { className: 'dash-map-popup' }
                );
                marker.addTo(map);
                miniLayersRef.current.push(marker);
            });
            if (pts.length > 1) {
                const line = L.polyline(pts, { color, weight: 2.5, opacity: 0.75, dashArray: '5 5' });
                line.addTo(map);
                miniLayersRef.current.push(line);
            }
        });
        if (allPoints.length > 0) map.fitBounds(L.latLngBounds(allPoints), { padding: [28, 28], maxZoom: 13 });
    }, [latestDetail, leafletLib]);

    const fetchItineraries = async (uid) => {
        try {
            setLoading(true);
            const r = await axios.get(`${import.meta.env.VITE_BACKEND_API_URL}itineraries/user/${uid}`);
            setItineraries(r.data);
            setError('');
        } catch (err) {
            setError(err.code === 'ERR_NETWORK'
                ? 'Cannot connect to server. Please make sure the backend is running.'
                : 'Failed to load your trips. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ── Calendar helpers ───────────────────────────────────────────────────
    const getDaysInMonth = (date) => {
        const firstDay    = new Date(date.getFullYear(), date.getMonth(), 1);
        const lastDay     = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        return { daysInMonth: lastDay.getDate(), startingDayOfWeek: firstDay.getDay() };
    };
    const formatMonthYear = (date) =>
        date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
    const previousMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    const nextMonth     = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

    const dayDate = (day) => {
        const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        d.setHours(0, 0, 0, 0);
        return d;
    };
    const isToday    = (day) => { const t = new Date(); return day === t.getDate() && currentDate.getMonth() === t.getMonth() && currentDate.getFullYear() === t.getFullYear(); };
    const isInTrip   = (day) => {
        if (!latestDetail?.start_date || !latestDetail?.end_date) return false;
        const d = dayDate(day);
        const s = new Date(latestDetail.start_date); s.setHours(0,0,0,0);
        const e = new Date(latestDetail.end_date);   e.setHours(0,0,0,0);
        return d >= s && d <= e;
    };
    const isStartDay = (day) => { if (!latestDetail?.start_date) return false; const s = new Date(latestDetail.start_date); s.setHours(0,0,0,0); return dayDate(day).getTime() === s.getTime(); };
    const isEndDay   = (day) => { if (!latestDetail?.end_date)   return false; const e = new Date(latestDetail.end_date);   e.setHours(0,0,0,0); return dayDate(day).getTime() === e.getTime(); };

    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
    const calendarDays = [];
    for (let i = 0; i < startingDayOfWeek; i++) calendarDays.push(null);
    for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

    const formatDate = (ds) => new Date(ds).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const getStatusColor = (s) => ({ planning: 'info', confirmed: 'success', ongoing: 'warning', completed: 'default', cancelled: 'error' }[s] || 'default');

    return (
        <Box sx={{
            display: 'flex',
            bgcolor: COLORS.background,
            height: { xs: 'calc(100vh - 56px)', md: '100vh' },
            width: '100vw',
            position: 'fixed',
            top: { xs: '56px', md: 0 }, left: 0,
            overflow: 'hidden',
        }}>
            {/* shared sidebar */}
            <Navbar />

            {/* main content */}
            <Box component="main" sx={{
                flexGrow: 1,
                p: { xs: 2, md: 3 },
                pb: { xs: '120px', md: 3 },
                height: { xs: 'calc(100vh - 56px)', md: '100vh' },
                overflow: 'auto',
                bgcolor: COLORS.background,
                ml: 0,
            }}>
                {/* Top Bar */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1.5} sx={{ mb: { xs: 2, md: 4 } }}>
                    <Box sx={{ width: 200, display: { xs: 'none', md: 'block' } }} />

                    {/* Search */}
                    <Box sx={{ flex: 1, maxWidth: { xs: '100%', md: 650 } }}>

                        {/* Mobile: left-rounded input + flush right-rounded button — two siblings sharing the pill */}
                        <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'stretch' }}>
                            <TextField
                                placeholder="Search destinations…"
                                variant="outlined"
                                fullWidth
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        bgcolor: COLORS.cardPrimary,
                                        borderRadius: '20px 0 0 20px',
                                        color: COLORS.text,
                                        '& fieldset': { borderColor: COLORS.cardBorder, borderRight: 'none' },
                                        '&:hover fieldset': { borderColor: COLORS.brand, borderRight: 'none' },
                                        '&.Mui-focused fieldset': { borderColor: COLORS.brand, borderRight: 'none' },
                                    },
                                    '& .MuiInputBase-input': { padding: '10px 14px' },
                                    '& .MuiInputBase-input::placeholder': { color: COLORS.fadedText, opacity: 1 },
                                }}
                            />
                            <Box
                                component="button"
                                onClick={handleSearch}
                                sx={{
                                    bgcolor: COLORS.brand, color: '#fff',
                                    border: 'none', outline: 'none', cursor: 'pointer',
                                    borderRadius: '0 20px 20px 0',
                                    px: '14px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0,
                                    '&:hover': { bgcolor: '#2db8b8' },
                                    transition: 'background-color 0.2s',
                                }}
                            >
                                <SearchIcon sx={{ fontSize: 20, color: '#fff' }} />
                            </Box>
                        </Box>

                        {/* Desktop: full pill input + external Search button */}
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ display: { xs: 'none', md: 'flex' } }}>
                            <TextField
                                placeholder="Search destinations, e.g. Pokhara"
                                variant="outlined"
                                fullWidth
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        bgcolor: COLORS.cardPrimary, borderRadius: 5, color: COLORS.text,
                                        '& fieldset': { borderColor: COLORS.cardBorder },
                                        '&:hover fieldset': { borderColor: COLORS.brand },
                                        '&.Mui-focused fieldset': { borderColor: COLORS.brand },
                                    },
                                    '& .MuiInputBase-input': { padding: '14px 16px' },
                                    '& .MuiInputBase-input::placeholder': { color: COLORS.fadedText, opacity: 1 },
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon sx={{ color: COLORS.fadedText }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <Button variant="contained" onClick={handleSearch} sx={{
                                bgcolor: COLORS.brand, color: COLORS.background, fontWeight: 'bold',
                                px: 4, py: 1.75, borderRadius: 5, textTransform: 'uppercase',
                                fontSize: '0.875rem', whiteSpace: 'nowrap',
                                '&:hover': { bgcolor: '#2db8b8', transform: 'translateY(-2px)', boxShadow: `0 4px 12px ${COLORS.brand}40` },
                                transition: 'all 0.3s',
                            }}>
                                Search
                            </Button>
                        </Stack>
                    </Box>

                    {/* New Trip button */}
                    {/* Desktop: full labelled button */}
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setDialogOpen(true)}
                        sx={{
                            display: { xs: 'none', md: 'inline-flex' },
                            bgcolor: COLORS.brand, color: COLORS.background,
                            fontWeight: 'bold', borderRadius: 5, px: 3, py: 1.25,
                            textTransform: 'uppercase',
                            '&:hover': { bgcolor: '#2db8b8', transform: 'translateY(-2px)', boxShadow: `0 4px 12px ${COLORS.brand}40` },
                            transition: 'all 0.3s',
                        }}
                    >
                        New Trip
                    </Button>
                    {/* Mobile: compact icon button */}
                    <Tooltip title="New Trip">
                        <IconButton
                            onClick={() => setDialogOpen(true)}
                            sx={{
                                display: { xs: 'flex', md: 'none' },
                                bgcolor: COLORS.brand, color: COLORS.background,
                                borderRadius: 2, flexShrink: 0,
                                '&:hover': { bgcolor: '#2db8b8' },
                                transition: 'all 0.3s',
                            }}
                        >
                            <AddIcon />
                        </IconButton>
                    </Tooltip>
                </Stack>

                {/* 2-column layout: side-by-side on desktop, stacked on mobile */}
                <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
                    {/* Left: trips + similar */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ mb: { xs: 2, md: 4 } }}>
                            <Typography variant="h4" fontWeight="bold" sx={{ color: COLORS.headings, mb: 0.5, fontSize: { xs: '1.5rem', md: undefined } }}>
                                Hello {user.username || user.name}!
                            </Typography>
                            <Typography variant="body1" sx={{ color: COLORS.fadedText }}>
                                {itineraries.length > 0 ? 'Welcome back on your explorations.' : 'Start your Nepal adventure today.'}
                            </Typography>
                        </Box>

                        {/* Your Trips */}
                        <Box sx={{ mb: { xs: 3, md: 4 } }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                                <Typography variant="h5" fontWeight="bold" sx={{ color: COLORS.headings }}>Your Trips</Typography>
                                <Button onClick={() => navigate('/itineraries')} sx={{ color: COLORS.brand, textTransform: 'none', '&:hover': { bgcolor: 'transparent', color: '#2db8b8' } }}>
                                    View All
                                </Button>
                            </Stack>

                            {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

                            {loading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                                    <CircularProgress sx={{ color: COLORS.brand }} />
                                </Box>
                            ) : itineraries.length === 0 ? (
                                <Card onClick={() => setDialogOpen(true)} sx={{
                                    bgcolor: COLORS.cardPrimary, borderRadius: 5, p: 6, textAlign: 'center', cursor: 'pointer',
                                    transition: 'all 0.3s',
                                    '&:hover': { bgcolor: COLORS.cardSecondary, transform: 'translateY(-4px)', boxShadow: `0 8px 24px ${COLORS.brand}20` },
                                }}>
                                    <AddIcon sx={{ fontSize: 60, color: COLORS.brand, mb: 2 }} />
                                    <Typography variant="h5" fontWeight="bold" sx={{ color: COLORS.headings, mb: 1 }}>Start Your First Adventure</Typography>
                                    <Typography variant="body1" sx={{ color: COLORS.text, mb: 2 }}>Create your first itinerary and begin planning your dream trip to Nepal</Typography>
                                    <Typography variant="body2" sx={{ color: COLORS.fadedText }}>Click anywhere to get started</Typography>
                                </Card>
                            ) : (
                                <Stack direction="row" spacing={2.5} sx={{ overflowX: { xs: 'auto', md: 'visible' }, pb: { xs: 1, md: 0 }, '&::-webkit-scrollbar': { height: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: COLORS.cardSecondary, borderRadius: 2 } }}>
                                    {itineraries.slice(0, 3).map((trip) => (
                                        <Card key={trip.id} onClick={() => navigate(`/itinerary/${trip.id}`)} sx={{
                                            bgcolor: COLORS.cardPrimary, borderRadius: 4, overflow: 'hidden',
                                            cursor: 'pointer',
                                            flex: { xs: '0 0 auto', md: '1 1 0' },
                                            width: { xs: 260, md: 'auto' },
                                            minWidth: { xs: 260, md: 0 },
                                            maxWidth: { xs: 260, md: '33.33%' },
                                            transition: 'all 0.3s',
                                            '&:hover': { transform: 'translateY(-6px)', boxShadow: `0 8px 24px ${COLORS.brand}20` },
                                        }}>
                                            <CardMedia
                                                component="img" height="160"
                                                image={trip.cover_photo
                                                    ? `${import.meta.env.VITE_BACKEND_API_URL}places/photo?photo_reference=${trip.cover_photo}&max_width=600`
                                                    : 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=600&auto=format&fit=crop'}
                                                alt={trip.title} sx={{ objectFit: 'cover' }}
                                            />
                                            <CardContent sx={{ p: 2 }}>
                                                <Typography variant="subtitle1" fontWeight="bold" noWrap sx={{ color: COLORS.headings, mb: 1 }}>
                                                    {trip.title}
                                                </Typography>
                                                <Stack spacing={0.75}>
                                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                        <Typography variant="caption" sx={{ color: COLORS.fadedText }}>Estimated Budget</Typography>
                                                        <Typography variant="caption" fontWeight="bold" sx={{ color: COLORS.brand }}>
                                                            {trip.currency} {trip.estimated_budget?.toLocaleString()}
                                                        </Typography>
                                                    </Stack>
                                                    <Stack direction="row" alignItems="center" spacing={0.5}>
                                                        <CalendarTodayIcon sx={{ fontSize: 12, color: COLORS.fadedText }} />
                                                        <Typography variant="caption" sx={{ color: COLORS.fadedText }} noWrap>
                                                            {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                                                        </Typography>
                                                    </Stack>
                                                </Stack>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </Stack>
                            )}
                        </Box>

                        {/* Recommendations */}
                        <Box>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                                <Box>
                                    <Typography variant="h5" fontWeight="bold" sx={{ color: COLORS.headings }}>
                                        {itineraries.length === 0 ? 'Explore Popular Trips' : 'Recommended for You'}
                                    </Typography>
                                    {itineraries.length === 0 ? (
                                        <Typography variant="caption" sx={{ color: COLORS.fadedText, fontSize: '0.7rem' }}>
                                            Trending itineraries in Nepal — get inspired
                                        </Typography>
                                    ) : recommendations.length > 0 && (
                                        <Typography variant="caption" sx={{ color: COLORS.fadedText, fontSize: '0.7rem' }}>
                                            {recommendations[0]?.recommendation_source === 'collaborative'
                                                ? 'Based on travellers like you'
                                                : recommendations[0]?.recommendation_source === 'hybrid'
                                                ? 'Personalised picks'
                                                : 'Popular itineraries you might like'}
                                        </Typography>
                                    )}
                                </Box>
                                <Button onClick={() => navigate('/community')}
                                    sx={{ color: COLORS.brand, textTransform: 'none', '&:hover': { bgcolor: 'transparent', color: '#2db8b8' } }}>
                                    View More
                                </Button>
                            </Stack>

                            {recsLoading ? (
                                <Stack direction="row" spacing={2.5}>
                                    {[1,2,3].map(i => (
                                        <Box key={i} sx={{ minWidth: 312, height: 120, borderRadius: 5, bgcolor: COLORS.cardPrimary, opacity: 0.5 }} />
                                    ))}
                                </Stack>
                            ) : recommendations.length === 0 ? (
                                <Box sx={{ py: 4, textAlign: 'center' }}>
                                    <Typography sx={{ color: COLORS.fadedText, fontSize: '0.85rem' }}>
                                        No public itineraries yet — be the first to share one!
                                    </Typography>
                                </Box>
                            ) : (
                                <Stack direction="row" spacing={2.5} sx={{ overflowX: 'auto', pb: 2 }}>
                                    {recommendations.map((rec) => (
                                        <Card key={rec.id} onClick={() => navigate(`/itinerary/${rec.id}`)} sx={{
                                            bgcolor: COLORS.cardPrimary, borderRadius: 5, overflow: 'hidden',
                                            cursor: 'pointer', minWidth: 312, maxWidth: 312,
                                            transition: 'all 0.3s',
                                            '&:hover': { transform: 'translateY(-8px)', boxShadow: `0 8px 24px ${COLORS.brand}20` },
                                        }}>
                                            <Stack direction="row" spacing={2} sx={{ p: 2.5 }}>
                                                {/* Cover photo or destination initials fallback */}
                                                {rec.cover_photo ? (
                                                    <Box component="img"
                                                        src={`${import.meta.env.VITE_BACKEND_API_URL}places/photo?photo_reference=${rec.cover_photo}&max_width=200`}
                                                        alt={rec.destination}
                                                        sx={{ width: 75, minHeight: 100, borderRadius: 3.5, flexShrink: 0, objectFit: 'cover' }}
                                                    />
                                                ) : (
                                                    <Box sx={{
                                                        width: 75, minHeight: 100, borderRadius: 3.5, flexShrink: 0,
                                                        bgcolor: `${COLORS.brand}20`,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    }}>
                                                        <Typography sx={{ fontSize: '1.6rem', fontWeight: 800, color: COLORS.brand, lineHeight: 1, textAlign: 'center' }}>
                                                            {(rec.destination || '?').split(',')[0].trim().slice(0, 2).toUpperCase()}
                                                        </Typography>
                                                    </Box>
                                                )}

                                                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
                                                    <Box>
                                                        <Typography variant="subtitle1" fontWeight="bold" noWrap sx={{ color: COLORS.headings, mb: 0.5, fontSize: '0.95rem' }}>
                                                            {rec.title}
                                                        </Typography>
                                                        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.8 }}>
                                                            <LocationOnIcon sx={{ fontSize: 13, color: '#ff6b6b' }} />
                                                            <Typography variant="caption" noWrap sx={{ color: COLORS.fadedText, fontSize: '0.75rem' }}>
                                                                {rec.destination}
                                                            </Typography>
                                                        </Stack>
                                                    </Box>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight="bold" sx={{ color: COLORS.brand, mb: 0.4, fontSize: '0.85rem' }}>
                                                            {rec.currency || 'NPR'} {(rec.estimated_budget || 0).toLocaleString()}
                                                        </Typography>
                                                        <Stack direction="row" alignItems="center" spacing={1}>
                                                            <Stack direction="row" alignItems="center" spacing={0.5}>
                                                                <CalendarTodayIcon sx={{ fontSize: 13, color: COLORS.fadedText }} />
                                                                <Typography variant="caption" sx={{ color: COLORS.fadedText, fontSize: '0.75rem' }}>
                                                                    {rec.days_count} day{rec.days_count !== 1 ? 's' : ''}
                                                                </Typography>
                                                            </Stack>
                                                            {rec.from_friend && (
                                                                <Chip label="Friend's pick" size="small" sx={{
                                                                    height: 16, fontSize: '0.6rem',
                                                                    bgcolor: `${COLORS.brand}18`, color: COLORS.brand,
                                                                    '& .MuiChip-label': { px: 0.8 },
                                                                }} />
                                                            )}
                                                            {rec.recommendation_source === 'your_trip' && (
                                                                <Chip label="Your trip" size="small" sx={{
                                                                    height: 16, fontSize: '0.6rem',
                                                                    bgcolor: 'rgba(255,183,77,0.15)', color: '#FFB74D',
                                                                    '& .MuiChip-label': { px: 0.8 },
                                                                }} />
                                                            )}
                                                        </Stack>
                                                    </Box>
                                                </Box>
                                            </Stack>
                                        </Card>
                                    ))}
                                </Stack>
                            )}
                        </Box>
                    </Box>

                    {/* Right sidebar: Calendar + Mini Map */}
                    <Box sx={{ width: { xs: '100%', md: 400 }, flexShrink: { xs: 1, md: 0 } }}>

                        {/* Mobile-only calendar toggle button */}
                        <Box sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: COLORS.headings }}>Trip Calendar</Typography>
                            <Button
                                startIcon={<CalendarTodayIcon sx={{ fontSize: 15 }} />}
                                onClick={() => setCalendarOpen(o => !o)}
                                size="small"
                                variant="outlined"
                                sx={{
                                    color: COLORS.brand, borderColor: COLORS.brand, borderRadius: 3,
                                    textTransform: 'none', fontSize: '0.78rem',
                                    '&:hover': { bgcolor: `${COLORS.brand}10`, borderColor: COLORS.brand },
                                }}
                            >
                                {calendarOpen ? 'Hide Calendar' : 'View Calendar'}
                            </Button>
                        </Box>

                        {/* Calendar */}
                        <Card sx={{ display: { xs: calendarOpen ? 'block' : 'none', md: 'block' }, bgcolor: COLORS.cardPrimary, borderRadius: 5, p: 3, mb: 3 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: latestDetail ? 1 : 3 }}>
                                <Box>
                                    <Typography variant="body1" fontWeight="bold" sx={{ color: COLORS.subheadings }}>
                                        {formatMonthYear(currentDate)}
                                    </Typography>
                                    {latestDetail && (
                                        <Typography variant="caption" sx={{ color: COLORS.brand, fontSize: '0.68rem', fontWeight: 600 }}>
                                            {latestDetail.title}
                                        </Typography>
                                    )}
                                </Box>
                                <Stack direction="row" spacing={1}>
                                    <IconButton size="small" onClick={previousMonth} sx={{ color: COLORS.icons, borderRadius: 2, '&:hover': { color: COLORS.brand, bgcolor: COLORS.cardSecondary } }}>
                                        <ChevronLeftIcon />
                                    </IconButton>
                                    <IconButton size="small" onClick={nextMonth} sx={{ color: COLORS.icons, borderRadius: 2, '&:hover': { color: COLORS.brand, bgcolor: COLORS.cardSecondary } }}>
                                        <ChevronRightIcon />
                                    </IconButton>
                                </Stack>
                            </Stack>

                            {latestDetail && (
                                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2, mt: 0.5 }}>
                                    <Stack direction="row" alignItems="center" spacing={0.6}>
                                        <Box sx={{ width: 10, height: 10, borderRadius: 1, bgcolor: 'rgba(255,107,107,0.22)', border: '1px solid rgba(255,107,107,0.5)' }} />
                                        <Typography variant="caption" sx={{ color: COLORS.fadedText, fontSize: '0.65rem' }}>Trip days</Typography>
                                    </Stack>
                                    <Stack direction="row" alignItems="center" spacing={0.6}>
                                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#ff6b6b' }} />
                                        <Typography variant="caption" sx={{ color: COLORS.fadedText, fontSize: '0.65rem' }}>Start / End</Typography>
                                    </Stack>
                                    <Stack direction="row" alignItems="center" spacing={0.6}>
                                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: COLORS.brand }} />
                                        <Typography variant="caption" sx={{ color: COLORS.fadedText, fontSize: '0.65rem' }}>Today</Typography>
                                    </Stack>
                                </Stack>
                            )}

                            {/* Calendar grid */}
                            <Box>
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, mb: 1 }}>
                                    {['SUN','MON','TUE','WED','THU','FRI','SAT'].map(d => (
                                        <Typography key={d} variant="caption" align="center" sx={{ color: COLORS.fadedText, fontWeight: 'bold', fontSize: '0.65rem' }}>
                                            {d}
                                        </Typography>
                                    ))}
                                </Box>
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
                                    {calendarDays.map((day, idx) => (
                                        <Box key={idx}>
                                            {day ? (
                                                <Box sx={{
                                                    aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    borderRadius: (isStartDay(day) || isEndDay(day)) ? '50%' : 2,
                                                    cursor: 'pointer',
                                                    bgcolor: isToday(day) ? COLORS.brand
                                                        : (isStartDay(day) || isEndDay(day)) ? '#ff6b6b'
                                                        : isInTrip(day) ? 'rgba(255,107,107,0.22)'
                                                        : 'transparent',
                                                    color: isToday(day) ? COLORS.background
                                                        : (isStartDay(day) || isEndDay(day)) ? 'white'
                                                        : isInTrip(day) ? '#ff9999'
                                                        : COLORS.text,
                                                    fontWeight: (isToday(day) || isStartDay(day) || isEndDay(day) || isInTrip(day)) ? 'bold' : 'normal',
                                                    fontSize: '0.85rem',
                                                    transition: 'all 0.2s',
                                                    '&:hover': {
                                                        bgcolor: isToday(day) ? COLORS.brand : isInTrip(day) ? 'rgba(255,107,107,0.38)' : COLORS.cardSecondary,
                                                        transform: 'scale(1.1)',
                                                    },
                                                }}>
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

                        {/* Mini Map */}
                        <Card sx={{ bgcolor: COLORS.cardPrimary, borderRadius: 5, overflow: 'hidden' }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2.5, pt: 2, pb: 1.5 }}>
                                <Box>
                                    <Typography variant="body1" fontWeight="bold" sx={{ color: COLORS.headings, lineHeight: 1.2 }}>
                                        {latestDetail ? latestDetail.title : 'Latest Trip'}
                                    </Typography>
                                    {latestDetail && (
                                        <Typography variant="caption" sx={{ color: COLORS.fadedText }}>{latestDetail.destination}</Typography>
                                    )}
                                </Box>
                                <Button size="small" onClick={() => navigate('/map')} sx={{
                                    color: COLORS.brand, textTransform: 'none', borderRadius: 3, fontSize: '0.78rem',
                                    '&:hover': { bgcolor: COLORS.cardSecondary },
                                }}>
                                    Full Map →
                                </Button>
                            </Stack>
                            <Box ref={miniMapRef} sx={{ width: '100%', height: { xs: 220, md: 330 }, cursor: 'pointer', touchAction: 'pan-y' }} onClick={() => navigate('/map')} />
                        </Card>
                    </Box>
                </Box>
            </Box>

            {/* Leaflet popup theme */}
            <style>{`
                .dash-map-popup .leaflet-popup-content-wrapper {
                    background: ${COLORS.cardPrimary}; color: ${COLORS.text};
                    border: 1px solid ${COLORS.cardBorder};
                    border-radius: 8px; box-shadow: 0 6px 20px rgba(0,0,0,0.5);
                }
                .dash-map-popup .leaflet-popup-tip { background: ${COLORS.cardPrimary}; }
                .dash-map-popup .leaflet-popup-close-button { color: ${COLORS.fadedText} !important; }
            `}</style>

            <CreateItineraryDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                userId={user.id}
                onSuccess={() => fetchItineraries(user.id)}
            />
        </Box>
    );
};

export default Dashboard;