import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Stack, Card, CardMedia, CardContent,
    Grid, Button, TextField, InputAdornment, Avatar,
    CircularProgress, Alert, Chip,
    Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Tooltip
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
import DeleteIcon        from '@mui/icons-material/Delete';
import ShareIcon         from '@mui/icons-material/Share';
import SendIcon          from '@mui/icons-material/Send';
import GroupIcon         from '@mui/icons-material/Group';
import HandshakeIcon     from '@mui/icons-material/Handshake';
import CheckCircleIcon   from '@mui/icons-material/CheckCircle';
import CloseIcon         from '@mui/icons-material/Close';
import WbSunnyIcon       from '@mui/icons-material/WbSunny';
import CloudIcon         from '@mui/icons-material/Cloud';
import UmbrellaIcon      from '@mui/icons-material/Umbrella';
import AcUnitIcon        from '@mui/icons-material/AcUnit';
import ThunderstormIcon  from '@mui/icons-material/Thunderstorm';
import WaterDropIcon     from '@mui/icons-material/WaterDrop';
import AirIcon           from '@mui/icons-material/Air';
import HelpOutlineIcon   from '@mui/icons-material/HelpOutline';
import EventBusyIcon     from '@mui/icons-material/EventBusy';

// ── constants ──────────────────────────────────────────────────────────────
const FORECAST_DAYS_LIMIT = 5;

const STATUS_COLORS = {
    planning: '#33CCCC', confirmed: '#66d9a0',
    ongoing: '#ffb74d', completed: '#7B809A', cancelled: '#ff6b6b',
};

const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const weatherIconMap = (condition) => {
    const c = (condition || '').toLowerCase();
    if (c.includes('thunder') || c.includes('storm'))                              return { icon: <ThunderstormIcon sx={{ fontSize: 16 }} />, color: '#FFB74D' };
    if (c.includes('snow') || c.includes('sleet') || c.includes('ice'))           return { icon: <AcUnitIcon sx={{ fontSize: 16 }} />,       color: '#90CAF9' };
    if (c.includes('rain') || c.includes('drizzle') || c.includes('shower'))      return { icon: <UmbrellaIcon sx={{ fontSize: 16 }} />,      color: '#64B5F6' };
    if (c.includes('cloud') || c.includes('overcast') || c.includes('mist') || c.includes('fog') || c.includes('haze'))
                                                                                   return { icon: <CloudIcon sx={{ fontSize: 16 }} />,         color: '#90A4AE' };
    return { icon: <WbSunnyIcon sx={{ fontSize: 16 }} />, color: '#FFD54F' };
};

const getTripWeatherState = (startDate, endDate) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const start = new Date(startDate); start.setHours(0, 0, 0, 0);
    const end   = new Date(endDate);   end.setHours(0, 0, 0, 0);
    const daysUntilStart = Math.ceil((start - today) / 86400000);
    if (end < today)                          return 'past';
    if (daysUntilStart > FORECAST_DAYS_LIMIT) return 'far';
    if (daysUntilStart < -FORECAST_DAYS_LIMIT) return 'past';
    return 'fetchable';
};

// ── WeatherStrip ────────────────────────────────────────────────────────────
// COLORS passed as prop since this is defined outside the main component
const WeatherStrip = ({ trip, userId, COLORS }) => {
    const state = getTripWeatherState(trip.start_date, trip.end_date);
    const [status, setStatus] = useState('idle');
    const [days, setDays]     = useState([]);
    const [errMsg, setErrMsg] = useState('');

    const fetchWeather = useCallback(async (force = false) => {
        if (state !== 'fetchable' || !userId) return;
        if (!force && trip.weather_fetched_at) {
            const age = Date.now() - new Date(trip.weather_fetched_at).getTime();
            if (age < 60 * 60 * 1000) {
                try {
                    setStatus('loading');
                    const detail = await axios.get(`http://127.0.0.1:8000/itineraries/${trip.id}`);
                    setDays((detail.data?.days || []).slice(0, 3));
                    setStatus('done');
                } catch { setStatus('idle'); }
                return;
            }
        }
        setStatus('loading');
        setErrMsg('');
        try {
            await axios.post(`http://127.0.0.1:8000/itineraries/${trip.id}/fetch-weather?user_id=${userId}`);
            const detail = await axios.get(`http://127.0.0.1:8000/itineraries/${trip.id}`);
            setDays((detail.data?.days || []).slice(0, 3));
            setStatus('done');
        } catch (err) {
            const msg = (err?.response?.data?.detail || '').toLowerCase();
            if (msg.includes('key') || msg.includes('configured')) {
                setErrMsg('Weather API key not configured');
            } else if (err?.response?.status === 403) {
                setStatus('idle'); return;
            } else if (err?.response?.status === 404) {
                setErrMsg('Itinerary not found');
            } else if (!navigator.onLine) {
                setErrMsg('No internet connection');
            } else {
                setErrMsg('Weather unavailable');
            }
            setStatus('error');
        }
    }, [trip.id, state, userId, trip.weather_fetched_at]);

    useEffect(() => {
        if (state === 'fetchable' && userId) fetchWeather();
    }, [fetchWeather, state, userId]);

    if (state === 'past') return (
        <Box sx={{ px: 2, pb: 1.5, pt: 0.5 }}>
            <Stack direction="row" alignItems="center" spacing={0.6}>
                <EventBusyIcon sx={{ fontSize: 13, color: COLORS.fadedText }} />
                <Typography sx={{ fontSize: '0.68rem', color: COLORS.fadedText }}>Weather data not available for past trips</Typography>
            </Stack>
        </Box>
    );

    if (state === 'far') {
        const daysAway = Math.ceil((new Date(trip.start_date) - new Date()) / 86400000);
        return (
            <Box sx={{ px: 2, pb: 1.5, pt: 0.5 }}>
                <Stack direction="row" alignItems="center" spacing={0.6}>
                    <HelpOutlineIcon sx={{ fontSize: 13, color: COLORS.fadedText }} />
                    <Typography sx={{ fontSize: '0.68rem', color: COLORS.fadedText }}>
                        Forecast available {daysAway <= FORECAST_DAYS_LIMIT + 30 ? `in ~${daysAway - FORECAST_DAYS_LIMIT} days` : 'closer to your trip'}
                    </Typography>
                </Stack>
            </Box>
        );
    }

    if (status === 'loading') return (
        <Box sx={{ px: 2, pb: 1.5, pt: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={11} sx={{ color: COLORS.brand }} />
            <Typography sx={{ fontSize: '0.68rem', color: COLORS.fadedText }}>Fetching weather...</Typography>
        </Box>
    );

    if (status === 'error') return (
        <Box sx={{ px: 2, pb: 1.5, pt: 0.5 }}>
            <Stack direction="row" alignItems="center" spacing={0.6}>
                <Typography sx={{ fontSize: '0.68rem', color: '#ff6b6b' }}>{errMsg || 'Weather unavailable'}</Typography>
                <Button size="small" onClick={(e) => { e.stopPropagation(); fetchWeather(true); }}
                    sx={{ fontSize: '0.62rem', color: COLORS.brand, p: 0, minWidth: 0, textTransform: 'none', lineHeight: 1.2 }}>
                    Retry
                </Button>
            </Stack>
        </Box>
    );

    if (status === 'done' && days.length > 0) {
        const withWeather = days.filter(d => d.weather_condition);
        if (withWeather.length === 0) return (
            <Box sx={{ px: 2, pb: 1.5, pt: 0.5 }}>
                <Typography sx={{ fontSize: '0.68rem', color: COLORS.fadedText }}>No weather data returned for this trip</Typography>
            </Box>
        );
        return (
            <Box sx={{ px: 2, pb: 1.5, pt: 0 }}>
                <Box sx={{ height: 1, bgcolor: 'rgba(255,255,255,0.05)', mb: 1 }} />
                <Stack direction="row" spacing={1.5} flexWrap="wrap">
                    {withWeather.map((d) => {
                        const { icon, color } = weatherIconMap(d.weather_condition);
                        return (
                            <Tooltip key={d.day_number} title={
                                <Box sx={{ fontSize: '0.72rem', lineHeight: 1.6 }}>
                                    <b>Day {d.day_number}</b><br />
                                    {d.weather_description ? d.weather_description.charAt(0).toUpperCase() + d.weather_description.slice(1) : d.weather_condition}
                                    {d.weather_temp_min != null && d.weather_temp_max != null && <><br />{Math.round(d.weather_temp_min)}°–{Math.round(d.weather_temp_max)}°C</>}
                                    {d.weather_humidity   != null && <><br />Humidity: {d.weather_humidity}%</>}
                                    {d.weather_wind_speed != null && <><br />Wind: {d.weather_wind_speed} m/s</>}
                                </Box>
                            } arrow placement="top">
                                <Stack alignItems="center" spacing={0.2} sx={{ cursor: 'default', userSelect: 'none' }} onClick={e => e.stopPropagation()}>
                                    <Box sx={{ color }}>{icon}</Box>
                                    <Typography sx={{ fontSize: '0.6rem', color: COLORS.fadedText, lineHeight: 1 }}>D{d.day_number}</Typography>
                                    {d.weather_temp_max != null && (
                                        <Typography sx={{ fontSize: '0.62rem', color: COLORS.text, fontWeight: 600, lineHeight: 1 }}>
                                            {Math.round(d.weather_temp_max)}°
                                        </Typography>
                                    )}
                                </Stack>
                            </Tooltip>
                        );
                    })}
                    {withWeather[0]?.weather_humidity != null && (
                        <Stack alignItems="center" spacing={0.2} sx={{ ml: 'auto !important' }} onClick={e => e.stopPropagation()}>
                            <WaterDropIcon sx={{ fontSize: 13, color: '#64B5F6' }} />
                            <Typography sx={{ fontSize: '0.6rem', color: COLORS.fadedText, lineHeight: 1 }}>{withWeather[0].weather_humidity}%</Typography>
                        </Stack>
                    )}
                    {withWeather[0]?.weather_wind_speed != null && (
                        <Stack alignItems="center" spacing={0.2} onClick={e => e.stopPropagation()}>
                            <AirIcon sx={{ fontSize: 13, color: '#90A4AE' }} />
                            <Typography sx={{ fontSize: '0.6rem', color: COLORS.fadedText, lineHeight: 1 }}>{withWeather[0].weather_wind_speed}m/s</Typography>
                        </Stack>
                    )}
                </Stack>
            </Box>
        );
    }

    return null;
};

// ── Main component ──────────────────────────────────────────────────────────
const MyItineraries = () => {
    const navigate = useNavigate();
    const { COLORS } = useTheme();

    const [user, setUser]               = useState({ id: null, name: 'User', avatarId: 1 });
    const [itineraries, setItineraries] = useState([]);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState('');
    const [search, setSearch]           = useState('');
    const [deleteId, setDeleteId]       = useState(null);
    const [deleting, setDeleting]       = useState(false);
    const [createOpen, setCreateOpen]   = useState(false);

    // collaborations
    const [collaborations, setCollaborations] = useState([]);
    const [pendingCollabs, setPendingCollabs] = useState([]);
    const [collabsLoading, setCollabsLoading] = useState(false);

    // share state
    const [shareOpen, setShareOpen]           = useState(false);
    const [shareTab, setShareTab]             = useState('chat');
    const [shareItinId, setShareItinId]       = useState(null);
    const [shareItinTitle, setShareItinTitle] = useState('');
    const [shareItinDestination, setShareItinDestination] = useState('');
    const [friends, setFriends]               = useState([]);
    const [friendsLoading, setFriendsLoading] = useState(false);
    const [sharing, setSharing]               = useState(null);
    const [feedSharing, setFeedSharing]       = useState(false);
    const [feedTitle, setFeedTitle]           = useState('');
    const [feedBody, setFeedBody]             = useState('');
    const [shareItinPlaces, setShareItinPlaces] = useState([]);

    useEffect(() => {
        const userId   = localStorage.getItem('userId');
        const userName = localStorage.getItem('userName');
        if (!userId) { navigate('/login'); return; }
        const uid = parseInt(userId);
        setUser({
            id: uid,
            name: userName || 'User',
            avatarId: parseInt(localStorage.getItem('avatarId')) || 1,
        });
        axios.get(`http://127.0.0.1:8000/itineraries/user/${userId}`)
            .then(r => setItineraries(r.data))
            .catch(() => setError('Could not load itineraries. Is the backend running?'))
            .finally(() => setLoading(false));

        // fetch collaborations
        setCollabsLoading(true);
        Promise.all([
            axios.get(`http://127.0.0.1:8000/itineraries/user/${userId}/collaborations`).then(r => r.data).catch(() => []),
            axios.get(`http://127.0.0.1:8000/itineraries/user/${userId}/pending-collabs`).then(r => r.data).catch(() => []),
        ]).then(([collabs, pending]) => {
            setCollaborations(collabs);
            setPendingCollabs(pending);
        }).finally(() => setCollabsLoading(false));
    }, [navigate]);

    const acceptCollab = async (itineraryId) => {
        try {
            await axios.patch(`http://127.0.0.1:8000/itineraries/${itineraryId}/collaborators/accept?user_id=${user.id}`);
            const [collabs, pending] = await Promise.all([
                axios.get(`http://127.0.0.1:8000/itineraries/user/${user.id}/collaborations`).then(r => r.data).catch(() => []),
                axios.get(`http://127.0.0.1:8000/itineraries/user/${user.id}/pending-collabs`).then(r => r.data).catch(() => []),
            ]);
            setCollaborations(collabs);
            setPendingCollabs(pending);
        } catch { setError('Failed to accept collaboration.'); }
    };

    const rejectCollab = async (itineraryId) => {
        try {
            await axios.patch(`http://127.0.0.1:8000/itineraries/${itineraryId}/collaborators/reject?user_id=${user.id}`);
            setPendingCollabs(prev => prev.filter(p => p.id !== itineraryId));
        } catch { setError('Failed to decline collaboration.'); }
    };

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const filtered = itineraries.filter(t =>
        !search ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.destination.toLowerCase().includes(search.toLowerCase())
    );
    const current = filtered.filter(t => new Date(t.end_date) >= today);
    const past    = filtered.filter(t => new Date(t.end_date) < today);

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await axios.delete(`http://127.0.0.1:8000/itineraries/${deleteId}`);
            setItineraries(prev => prev.filter(t => t.id !== deleteId));
            setDeleteId(null);
        } catch { setError('Delete failed.'); }
        finally { setDeleting(false); }
    };

    const openShare = async (trip, e) => {
        e.stopPropagation();
        setShareItinId(trip.id);
        setShareItinTitle(trip.title);
        setShareItinDestination(trip.destination || '');
        setFeedTitle(`Check out my itinerary: ${trip.title}`);
        setFeedBody(`A trip to ${trip.destination || ''}`);
        setShareTab('chat');
        setShareOpen(true);
        setFriendsLoading(true);
        try {
            const userId = localStorage.getItem('userId');
            const [friendsRes, itinRes] = await Promise.all([
                axios.get(`http://127.0.0.1:8000/friends/${userId}`),
                axios.get(`http://127.0.0.1:8000/itineraries/${trip.id}`),
            ]);
            setFriends(friendsRes.data?.friends || []);
            const ps = new Set();
            if (trip.destination) ps.add(trip.destination);
            (itinRes.data?.days || []).forEach(day =>
                (day.activities || []).forEach(act => { if (act.location) ps.add(act.location); })
            );
            setShareItinPlaces([...ps]);
        } catch { setFriends([]); setShareItinPlaces(trip.destination ? [trip.destination] : []); }
        finally { setFriendsLoading(false); }
    };

    const shareToFeed = async () => {
        if (!feedTitle.trim()) return;
        setFeedSharing(true);
        try {
            const userId = localStorage.getItem('userId');
            await axios.post(`http://127.0.0.1:8000/community/posts?user_id=${userId}`, {
                title: feedTitle.trim(),
                body: feedBody.trim() || null,
                tag: 'Experience',
                place: shareItinPlaces.join(', ') || shareItinDestination || 'Nepal',
                shared_itinerary_id: shareItinId,
            });
            setShareOpen(false);
        } catch { /* silent */ }
        finally { setFeedSharing(false); }
    };

    const shareToFriend = async (friendId) => {
        setSharing(friendId);
        try {
            const userId = localStorage.getItem('userId');
            await axios.post(`http://127.0.0.1:8000/messages?user_id=${userId}`, {
                receiver_id: friendId,
                content: `Check out my itinerary: "${shareItinTitle}"`,
                shared_itinerary_id: shareItinId,
            });
            setShareOpen(false);
        } catch { /* silent */ }
        finally { setSharing(null); }
    };

    // TripCard defined inside so it closes over COLORS naturally
    const TripCard = ({ trip, faded }) => (
        <Card onClick={() => navigate(`/itinerary/${trip.id}`)} sx={{
            bgcolor: COLORS.cardPrimary, borderRadius: 5, overflow: 'hidden',
            cursor: 'pointer', opacity: faded ? 0.7 : 1,
            transition: 'all 0.3s',
            '&:hover': { transform: 'translateY(-6px)', opacity: 1, boxShadow: `0 12px 32px rgba(51,204,204,0.15)` },
        }}>
            <Box sx={{ position: 'relative' }}>
                <CardMedia
                    component="img" height="160"
                    image={trip.cover_photo
                        ? `http://127.0.0.1:8000/places/photo?photo_reference=${trip.cover_photo}&max_width=600`
                        : 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=600&auto=format&fit=crop'}
                    alt={trip.title}
                />
                <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
                    <Stack direction="row" spacing={0.5}>
                        <IconButton size="small" onClick={(e) => openShare(trip, e)}
                            sx={{ bgcolor: 'rgba(20,22,39,0.7)', color: COLORS.brand, backdropFilter: 'blur(4px)', '&:hover': { bgcolor: 'rgba(51,204,204,0.2)' } }}>
                            <ShareIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={e => { e.stopPropagation(); setDeleteId(trip.id); }}
                            sx={{ bgcolor: 'rgba(20,22,39,0.7)', color: '#ff6b6b', backdropFilter: 'blur(4px)', '&:hover': { bgcolor: 'rgba(255,107,107,0.2)' } }}>
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Stack>
                </Box>
            </Box>

            <CardContent sx={{ p: 2.5, pb: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold" noWrap sx={{ color: COLORS.headings, mb: 0.5 }}>
                    {trip.title}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1.5 }}>
                    <LocationOnIcon sx={{ fontSize: 13, color: '#ff6b6b' }} />
                    <Typography variant="caption" sx={{ color: COLORS.fadedText }}>{trip.destination}</Typography>
                    <Box sx={{ ml: 'auto !important' }}>
                        <Chip label={trip.status} size="small" sx={{
                            height: 20, fontSize: '0.65rem', fontWeight: 700,
                            bgcolor: `${STATUS_COLORS[trip.status] || COLORS.brand}20`,
                            color: STATUS_COLORS[trip.status] || COLORS.brand,
                        }} />
                    </Box>
                </Stack>
                <Typography variant="body2" fontWeight="bold" sx={{ color: COLORS.brand, mb: 0.5 }}>
                    {trip.currency} {trip.estimated_budget?.toLocaleString()}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1 }}>
                    <CalendarTodayIcon sx={{ fontSize: 12, color: COLORS.fadedText }} />
                    <Typography variant="caption" sx={{ color: COLORS.fadedText, fontSize: '0.7rem' }}>
                        {formatDate(trip.start_date)} – {formatDate(trip.end_date)}
                    </Typography>
                </Stack>
            </CardContent>

            {/* pass COLORS down since WeatherStrip is outside the component tree */}
            <WeatherStrip trip={trip} userId={user.id} COLORS={COLORS} />
        </Card>
    );

    return (
        <Box sx={{ display: 'flex', bgcolor: COLORS.background, minHeight: '100vh', width: '100vw', position: 'fixed', top: 0, left: 0, overflow: 'hidden' }}>

            <Navbar />

            <Box component="main" sx={{ flexGrow: 1, p: 3, height: '100vh', overflow: 'auto', bgcolor: COLORS.background }}>
                {/* Topbar */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                    <Box sx={{ width: 200 }} />
                    <TextField
                        placeholder="Search trips..."
                        variant="outlined"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        sx={{
                            maxWidth: 500, flex: 1,
                            '& .MuiOutlinedInput-root': {
                                bgcolor: COLORS.cardPrimary, borderRadius: 5, color: COLORS.text,
                                '& fieldset': { borderColor: 'transparent' },
                                '&:hover fieldset': { borderColor: COLORS.brand },
                                '&.Mui-focused fieldset': { borderColor: COLORS.brand },
                            },
                            '& .MuiInputBase-input': { padding: '14px 16px' },
                            '& .MuiInputBase-input::placeholder': { color: COLORS.fadedText, opacity: 1 },
                        }}
                        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: COLORS.fadedText }} /></InputAdornment> }}
                    />
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)} sx={{
                            bgcolor: COLORS.brand, color: COLORS.background, fontWeight: 'bold',
                            borderRadius: 5, px: 3, py: 1.25, textTransform: 'uppercase',
                            '&:hover': { bgcolor: '#2db8b8' },
                        }}>
                            New Trip
                        </Button>
                    </Stack>
                </Stack>

                {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', pt: 10 }}>
                        <CircularProgress sx={{ color: COLORS.brand }} />
                    </Box>
                ) : (
                    <Box>
                        {/* Current & Upcoming */}
                        <Typography variant="h5" fontWeight="bold" sx={{ color: COLORS.headings, mb: 3 }}>
                            Current & Upcoming Trips
                            <Typography component="span" sx={{ ml: 1.5, color: COLORS.brand, fontSize: '0.85rem', fontWeight: 700 }}>
                                ({current.length})
                            </Typography>
                        </Typography>

                        {current.length === 0 ? (
                            <Box sx={{ bgcolor: COLORS.cardPrimary, borderRadius: 5, p: 5, textAlign: 'center', mb: 5 }}>
                                <Typography variant="body1" sx={{ color: COLORS.fadedText }}>
                                    No upcoming trips.{' '}
                                    <Button onClick={() => setCreateOpen(true)} sx={{ color: COLORS.brand, p: 0, minWidth: 0, textTransform: 'none', fontWeight: 'bold' }}>
                                        Create one →
                                    </Button>
                                </Typography>
                            </Box>
                        ) : (
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3, mb: 5 }}>
                                {current.map(trip => (
                                    <TripCard key={trip.id} trip={trip} />
                                ))}
                            </Box>
                        )}

                        {/* Past trips */}
                        {past.length > 0 && (
                            <>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                                    <Box sx={{ height: 1, flex: 1, bgcolor: COLORS.cardBorder }} />
                                    <Typography variant="caption" sx={{ color: COLORS.fadedText, fontWeight: 600 }}>PAST TRIPS</Typography>
                                    <Box sx={{ height: 1, flex: 1, bgcolor: COLORS.cardBorder }} />
                                </Box>
                                <Typography variant="h5" fontWeight="bold" sx={{ color: COLORS.headings, mb: 3 }}>
                                    Past Trips
                                    <Typography component="span" sx={{ ml: 1.5, color: COLORS.fadedText, fontSize: '0.85rem', fontWeight: 700 }}>
                                        ({past.length})
                                    </Typography>
                                </Typography>
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3 }}>
                                    {past.map(trip => (
                                        <TripCard key={trip.id} trip={trip} faded />
                                    ))}
                                </Box>
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

                        {/* Pending Collaboration Invites */}
                        {pendingCollabs.length > 0 && (
                            <Box sx={{ mt: 4 }}>
                                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                                    <HandshakeIcon sx={{ color: '#FFB74D', fontSize: 22 }} />
                                    <Typography variant="h5" fontWeight="bold" sx={{ color: COLORS.headings }}>
                                        Collaboration Invites
                                        <Typography component="span" sx={{ ml: 1.5, color: '#FFB74D', fontSize: '0.85rem', fontWeight: 700 }}>
                                            ({pendingCollabs.length})
                                        </Typography>
                                    </Typography>
                                </Stack>
                                <Stack spacing={1.5}>
                                    {pendingCollabs.map(itin => (
                                        <Box key={itin.id} sx={{ bgcolor: COLORS.cardPrimary, borderRadius: 3, px: 3, py: 2, border: `1px solid rgba(255,183,77,0.25)`, borderLeft: '3px solid #FFB74D' }}>
                                            <Stack direction="row" alignItems="center">
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography sx={{ color: COLORS.headings, fontWeight: 700, fontSize: '0.95rem' }}>{itin.title}</Typography>
                                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                                                        <LocationOnIcon sx={{ fontSize: 12, color: '#ff6b6b' }} />
                                                        <Typography variant="caption" sx={{ color: COLORS.fadedText }}>{itin.destination}</Typography>
                                                        <Typography variant="caption" sx={{ color: COLORS.fadedText }}>·</Typography>
                                                        <CalendarTodayIcon sx={{ fontSize: 11, color: COLORS.fadedText }} />
                                                        <Typography variant="caption" sx={{ color: COLORS.fadedText }}>{formatDate(itin.start_date)} – {formatDate(itin.end_date)}</Typography>
                                                    </Stack>
                                                </Box>
                                                <Stack direction="row" spacing={1}>
                                                    <Button size="small" variant="contained"
                                                        startIcon={<CheckCircleIcon sx={{ fontSize: 15 }} />}
                                                        onClick={() => acceptCollab(itin.id)}
                                                        sx={{ bgcolor: COLORS.brand, color: COLORS.background, fontWeight: 700, borderRadius: 2, textTransform: 'none', fontSize: '0.78rem', px: 2, '&:hover': { bgcolor: '#2db8b8' } }}>
                                                        Accept
                                                    </Button>
                                                    <Button size="small"
                                                        startIcon={<CloseIcon sx={{ fontSize: 15 }} />}
                                                        onClick={() => rejectCollab(itin.id)}
                                                        sx={{ color: COLORS.fadedText, borderRadius: 2, textTransform: 'none', fontSize: '0.78rem', px: 2, '&:hover': { color: '#ff6b6b', bgcolor: 'rgba(255,107,107,0.08)' } }}>
                                                        Decline
                                                    </Button>
                                                </Stack>
                                            </Stack>
                                        </Box>
                                    ))}
                                </Stack>
                            </Box>
                        )}

                        {/* Collaborations */}
                        {(collabsLoading || collaborations.length > 0) && (
                            <Box sx={{ mt: 4 }}>
                                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                                    <GroupIcon sx={{ color: COLORS.brand, fontSize: 22 }} />
                                    <Typography variant="h5" fontWeight="bold" sx={{ color: COLORS.headings }}>
                                        Collaborations
                                        <Typography component="span" sx={{ ml: 1.5, color: COLORS.brand, fontSize: '0.85rem', fontWeight: 700 }}>
                                            ({collaborations.length})
                                        </Typography>
                                    </Typography>
                                </Stack>
                                {collabsLoading ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress sx={{ color: COLORS.brand }} /></Box>
                                ) : (
                                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3 }}>
                                        {collaborations.map(trip => (
                                            <TripCard key={`collab-${trip.id}`} trip={trip} />
                                        ))}
                                    </Box>
                                )}
                            </Box>
                        )}
                    </Box>
                )}
            </Box>

            {/* Delete confirm */}
            <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}
                PaperProps={{ sx: { bgcolor: COLORS.cardPrimary, borderRadius: 4, border: `1px solid ${COLORS.cardBorder}`, minWidth: 340 } }}>
                <DialogTitle sx={{ color: COLORS.headings, fontWeight: 'bold' }}>Delete Trip?</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ color: COLORS.text }}>This will permanently delete the trip and all its data.</Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={() => setDeleteId(null)} sx={{ color: COLORS.fadedText, borderRadius: 3 }}>Cancel</Button>
                    <Button onClick={handleDelete} disabled={deleting} variant="contained"
                        sx={{ bgcolor: '#ff6b6b', color: 'white', fontWeight: 'bold', borderRadius: 3, '&:hover': { bgcolor: '#e05555' } }}>
                        {deleting ? <CircularProgress size={18} color="inherit" /> : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Create trip */}
            <CreateItineraryDialog
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                userId={user.id}
                onSuccess={() => {
                    setCreateOpen(false);
                    axios.get(`http://127.0.0.1:8000/itineraries/user/${user.id}`)
                        .then(r => setItineraries(r.data))
                        .catch(() => {});
                }}
            />

            {/* Share dialog */}
            <Dialog open={shareOpen} onClose={() => setShareOpen(false)} maxWidth="xs" fullWidth
                PaperProps={{ sx: { bgcolor: COLORS.background, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 4 } }}>
                <DialogTitle sx={{ color: COLORS.headings, fontWeight: 'bold', borderBottom: `1px solid ${COLORS.cardBorder}`, pb: 1.5 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <ShareIcon sx={{ color: COLORS.brand, fontSize: 20 }} />
                        <Typography fontWeight="bold" sx={{ color: COLORS.headings }}>Share "{shareItinTitle}"</Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                        {[{ key: 'chat', label: 'Send to Friend' }, { key: 'feed', label: 'Post to Feed' }].map(t => (
                            <Button key={t.key} size="small" onClick={() => setShareTab(t.key)}
                                sx={{ flex: 1, borderRadius: 2, textTransform: 'none', fontSize: '0.78rem', fontWeight: shareTab === t.key ? 700 : 400,
                                    color: shareTab === t.key ? COLORS.brand : COLORS.fadedText,
                                    bgcolor: shareTab === t.key ? `${COLORS.brand}18` : 'transparent',
                                    border: `1px solid ${shareTab === t.key ? COLORS.brand + '40' : 'transparent'}` }}>
                                {t.label}
                            </Button>
                        ))}
                    </Stack>
                </DialogTitle>
                <DialogContent sx={{ pt: 2, px: 2 }}>
                    {shareTab === 'chat' ? (
                        friendsLoading ? (
                            <Box sx={{ py: 4, textAlign: 'center' }}><CircularProgress size={22} sx={{ color: COLORS.brand }} /></Box>
                        ) : friends.length === 0 ? (
                            <Box sx={{ py: 4, textAlign: 'center' }}>
                                <Typography sx={{ color: COLORS.fadedText, fontSize: '0.85rem', mb: 0.5 }}>No friends yet</Typography>
                                <Typography sx={{ color: COLORS.fadedText, fontSize: '0.72rem' }}>Add friends to share via chat.</Typography>
                            </Box>
                        ) : (
                            <Stack spacing={0.5}>
                                {friends.map(f => (
                                    <Stack key={f.user_id} direction="row" alignItems="center"
                                        sx={{ px: 1.5, py: 1, borderRadius: 2, '&:hover': { bgcolor: `${COLORS.brand}10` } }}>
                                        <Typography sx={{ fontSize: '1rem', mr: 1.2 }}>
                                            {['🏔️','🌄','🏕️','🧗','🚶','🌿','🦅','🌺','🏯','🛶','🌙','☀️','🦋','🐾','🎒','🗻','🌊','🔥','❄️','🌈'][(f.avatar_id || 1) - 1] || '🏔️'}
                                        </Typography>
                                        <Typography sx={{ color: COLORS.headings, fontSize: '0.85rem', fontWeight: 600, flex: 1 }}>{f.username}</Typography>
                                        <IconButton size="small" onClick={() => shareToFriend(f.user_id)} disabled={sharing === f.user_id}
                                            sx={{ color: COLORS.brand, '&:hover': { bgcolor: `${COLORS.brand}20` }, '&:disabled': { color: COLORS.fadedText } }}>
                                            {sharing === f.user_id ? <CircularProgress size={16} sx={{ color: COLORS.brand }} /> : <SendIcon sx={{ fontSize: 18 }} />}
                                        </IconButton>
                                    </Stack>
                                ))}
                            </Stack>
                        )
                    ) : (
                        <Box sx={{ py: 1 }}>
                            <Stack spacing={1.5}>
                                <TextField fullWidth size="small" label="Post Title"
                                    value={feedTitle} onChange={e => setFeedTitle(e.target.value)}
                                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: COLORS.cardSecondary, borderRadius: 2, color: COLORS.text, '& fieldset': { borderColor: 'transparent' }, '&:hover fieldset': { borderColor: COLORS.brand }, '&.Mui-focused fieldset': { borderColor: COLORS.brand } }, '& .MuiInputLabel-root': { color: COLORS.fadedText }, '& .MuiInputLabel-root.Mui-focused': { color: COLORS.brand }, '& .MuiInputBase-input': { color: COLORS.text }, '& .MuiInputBase-input::placeholder': { color: COLORS.fadedText, opacity: 1 } }} />
                                <TextField fullWidth size="small" label="Add context (optional)" multiline rows={2}
                                    value={feedBody} onChange={e => setFeedBody(e.target.value)} placeholder="Share what makes this trip special..."
                                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: COLORS.cardSecondary, borderRadius: 2, color: COLORS.text, '& fieldset': { borderColor: 'transparent' }, '&:hover fieldset': { borderColor: COLORS.brand }, '&.Mui-focused fieldset': { borderColor: COLORS.brand } }, '& .MuiInputLabel-root': { color: COLORS.fadedText }, '& .MuiInputLabel-root.Mui-focused': { color: COLORS.brand }, '& .MuiInputBase-input': { color: COLORS.text }, '& .MuiInputBase-input::placeholder': { color: COLORS.fadedText, opacity: 1 } }} />
                                {shareItinPlaces.length > 0 && (
                                    <Box>
                                        <Typography sx={{ color: COLORS.fadedText, fontSize: '0.7rem', mb: 0.75, fontWeight: 600 }}>Place tags (auto-generated):</Typography>
                                        <Stack direction="row" flexWrap="wrap" gap={0.5}>
                                            {shareItinPlaces.map(p => (
                                                <Chip key={p} label={p} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: `${COLORS.brand}15`, color: COLORS.brand, border: `1px solid ${COLORS.brand}35`, '& .MuiChip-label': { px: 0.8 } }} />
                                            ))}
                                        </Stack>
                                    </Box>
                                )}
                                <Button fullWidth variant="contained" onClick={shareToFeed}
                                    disabled={feedSharing || !feedTitle.trim()}
                                    startIcon={feedSharing ? <CircularProgress size={16} sx={{ color: COLORS.background }} /> : <ShareIcon sx={{ fontSize: 18 }} />}
                                    sx={{ bgcolor: COLORS.brand, color: COLORS.background, fontWeight: 'bold', borderRadius: 3, py: 1.2, textTransform: 'none', '&:hover': { bgcolor: '#2db8b8' }, '&:disabled': { opacity: 0.5 } }}>
                                    {feedSharing ? 'Posting...' : 'Share to Community Feed'}
                                </Button>
                            </Stack>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 2, py: 1.5, borderTop: `1px solid ${COLORS.cardBorder}` }}>
                    <Button onClick={() => setShareOpen(false)} sx={{ color: COLORS.fadedText, borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default MyItineraries;