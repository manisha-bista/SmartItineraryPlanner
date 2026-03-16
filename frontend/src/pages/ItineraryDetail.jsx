import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Stack,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    CircularProgress,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Alert,
    Snackbar,
    Collapse,
    Chip,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import PlaceSearchAutocomplete from '../components/PlaceSearchAutocomplete';

// Icons
import ArrowBackIcon         from '@mui/icons-material/ArrowBack';
import EditIcon              from '@mui/icons-material/Edit';
import DeleteIcon            from '@mui/icons-material/Delete';
import AddIcon               from '@mui/icons-material/Add';
import LocationOnIcon        from '@mui/icons-material/LocationOn';
import CalendarTodayIcon     from '@mui/icons-material/CalendarToday';
import RestaurantIcon        from '@mui/icons-material/Restaurant';
import HikingIcon            from '@mui/icons-material/Hiking';
import MuseumIcon            from '@mui/icons-material/Museum';
import LocalActivityIcon     from '@mui/icons-material/LocalActivity';
import ShoppingBagIcon       from '@mui/icons-material/ShoppingBag';
import DirectionsBusIcon     from '@mui/icons-material/DirectionsBus';
import SpaIcon               from '@mui/icons-material/Spa';
import DashboardIcon         from '@mui/icons-material/Dashboard';
import ExploreIcon           from '@mui/icons-material/Explore';
import MapIcon               from '@mui/icons-material/Map';
import GroupIcon             from '@mui/icons-material/Group';
import LogoutIcon            from '@mui/icons-material/Logout';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import CloudIcon from '@mui/icons-material/Cloud';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import AirIcon from '@mui/icons-material/Air';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
    brand:   '#33CCCC',
    bg:      '#141627',
    card:    '#252845',
    surface: 'rgba(255,255,255,0.07)',
    heading: '#B0D2EB',
    sub:     '#C0D2EB',
    text:    '#D0D2EB',
    faded:   '#7B809A',
    icons:   '#B0D2EB',
    red:     '#ff6b6b',
    yellow:  '#ffb74d',
};

const DRAWER_W = 240;

// ─── Activity type meta ───────────────────────────────────────────────────────
const ACT_META = {
    sightseeing: { icon: <MuseumIcon      sx={{ fontSize:22 }} />, bg:'rgba(51,204,204,0.2)',   color: '#33CCCC' },
    dining:      { icon: <RestaurantIcon  sx={{ fontSize:22 }} />, bg:'rgba(255,183,77,0.2)',  color: '#ffb74d' },
    adventure:   { icon: <HikingIcon      sx={{ fontSize:22 }} />, bg:'rgba(102,187,106,0.2)', color: '#66bb6a' },
    relaxation:  { icon: <SpaIcon         sx={{ fontSize:22 }} />, bg:'rgba(38,166,154,0.2)',  color: '#26a69a' },
    shopping:    { icon: <ShoppingBagIcon sx={{ fontSize:22 }} />, bg:'rgba(255,112,67,0.2)',  color: '#ff7043' },
    transport:   { icon: <DirectionsBusIcon sx={{ fontSize:22 }} />, bg:'rgba(66,165,245,0.2)',color: '#42a5f5' },
    activity:    { icon: <LocalActivityIcon sx={{ fontSize:22 }} />, bg:'rgba(171,71,188,0.2)',color: '#ab47bc' },
};
const actMeta = (type) => ACT_META[type] || ACT_META.activity;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate      = (s) => { if (!s) return ''; return new Date(s).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }); };
const fmtDateFull  = (s) => { if (!s) return ''; return new Date(s).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', year:'numeric' }); };
const fmtTime = (t) => {
    if (!t) return '';
    const [h, m] = t.slice(0, 5).split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${String(hour).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
};
const fmtNum       = (n) => Number(n || 0).toLocaleString('en-IN');

// ─── Input style ──────────────────────────────────────────────────────────────
const inputSx = {
    '& .MuiOutlinedInput-root': {
        bgcolor: C.bg, borderRadius:3, color: C.text,
        '& fieldset': { borderColor:'transparent' },
        '&:hover fieldset': { borderColor: C.brand },
        '&.Mui-focused fieldset': { borderColor: C.brand },
    },
    '& .MuiInputLabel-root': { color: C.faded },
    '& .MuiInputLabel-root.Mui-focused': { color: C.brand },
    '& .MuiFormHelperText-root': { color: C.faded },
    '& .MuiSelect-icon': { color: C.faded },
};

// ═════════════════════════════════════════════════════════════════════════════
export default function ItineraryDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [itinerary, setItinerary] = useState(null);
    const [loading, setLoading]     = useState(true);
    const [snack, setSnack]         = useState({ open:false, msg:'', sev:'success' });
    const [collapsed, setCollapsed] = useState({});

    // Day dialog
    const [dayOpen, setDayOpen] = useState(false);
    const [editDay, setEditDay] = useState(null);
    const [dayForm, setDayForm] = useState({ day_number:1, date:'', title:'', description:'', estimated_cost:0 });
    const [dayErr,  setDayErr]  = useState({});
    const [dayBusy, setDayBusy] = useState(false);

    // Activity dialog
    const [actOpen,  setActOpen]  = useState(false);
    const [actDayId, setActDayId] = useState(null);
    const [editAct,  setEditAct]  = useState(null);
    const [actForm,  setActForm]  = useState({
        title:'', description:'', location:'',
        start_time:'', end_time:'', activity_type:'sightseeing',
        cost:0, actual_cost:0,
    });
    const [actErr,  setActErr]  = useState({});
    const [actBusy, setActBusy] = useState(false);

    // Delete confirm
    const [delOpen,   setDelOpen]   = useState(false);
    const [delTarget, setDelTarget] = useState(null);

    // community alerts relevant to this itinerary's places
    const [alerts, setAlerts] = useState([]);

    // weather
    const [weatherLoading, setWeatherLoading] = useState(false);

    // ── Fetch ─────────────────────────────────────────────────────────────────
    const load = async () => {
        try {
            setLoading(true);
            const r = await axios.get(`http://127.0.0.1:8000/itineraries/${id}`);
            setItinerary(r.data);
            checkAndUpdateStatus(r.data);
        } catch { toast('Failed to load itinerary.', 'error'); }
        finally { setLoading(false); }
    };
    useEffect(() => { load(); }, [id]);

    // auto-update status: "planned" if every day has at least one activity, "planning" otherwise
    const checkAndUpdateStatus = async (itin) => {
        if (!itin || !itin.days || itin.days.length === 0) return;
        // skip if status is already beyond planning/planned (ongoing, completed, cancelled)
        if (['ongoing', 'completed', 'cancelled'].includes(itin.status)) return;

        const allDaysFilled = itin.days.every(day =>
            day.activities && day.activities.length > 0 && day.activities.every(act => act.location?.trim())
        );
        const newStatus = allDaysFilled ? 'confirmed' : 'planning';

        if (itin.status !== newStatus) {
            try {
                await axios.put(`http://127.0.0.1:8000/itineraries/${itin.id}`, { status: newStatus });
                setItinerary(prev => prev ? { ...prev, status: newStatus } : prev);
            } catch { /* silent — status update is non-critical */ }
        }
    };

    const fetchWeather = async () => {
        if (!itinerary) return;
        setWeatherLoading(true);
        try {
            const userId = localStorage.getItem('userId');
            await axios.post(`http://127.0.0.1:8000/itineraries/${itinerary.id}/fetch-weather?user_id=${userId}`);
            await load();
            toast('Weather updated!');
        } catch (e) { toast(e.response?.data?.detail || 'Failed to fetch weather.', 'error'); }
        finally { setWeatherLoading(false); }
    };

    // fetch relevant alerts when itinerary loads
    useEffect(() => {
        if (!itinerary) return;
        const fetchAlerts = async () => {
            try {
                // gather all unique locations from activities
                const locations = new Set();
                (itinerary.days || []).forEach(day => {
                    (day.activities || []).forEach(act => {
                        if (act.location) locations.add(act.location);
                        // also extract city from address
                        if (act.formatted_address) {
                            const parts = act.formatted_address.split(',');
                            if (parts.length >= 2) locations.add(parts[parts.length - 2].trim());
                        }
                    });
                });
                if (itinerary.destination) locations.add(itinerary.destination);

                // fetch alerts for each location
                const allAlerts = [];
                const seen = new Set();
                for (const loc of locations) {
                    try {
                        const res = await axios.get('http://127.0.0.1:8000/community-updates', { params: { location: loc, active_only: true } });
                        (res.data || []).forEach(a => {
                            if (!seen.has(a.id)) { seen.add(a.id); allAlerts.push(a); }
                        });
                    } catch { /* skip */ }
                }
                setAlerts(allAlerts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
            } catch { /* ignore */ }
        };
        fetchAlerts();
    }, [itinerary]);

    const toast = (msg, sev = 'success') => setSnack({ open:true, msg, sev });

    // ── Day CRUD ──────────────────────────────────────────────────────────────
    const openAddDay = () => {
        const n = (itinerary?.days?.length || 0) + 1;
        const d = new Date(itinerary?.start_date || new Date());
        d.setDate(d.getDate() + n - 1);
        setEditDay(null);
        setDayForm({ day_number:n, date:d.toISOString().split('T')[0], title:'', description:'', estimated_cost:0 });
        setDayErr({});
        setDayOpen(true);
    };

    const openEditDay = (day) => {
        setEditDay(day);
        setDayForm({ day_number:day.day_number, date:day.date, title:day.title||'', description:day.description||'', estimated_cost:day.estimated_cost||0 });
        setDayErr({});
        setDayOpen(true);
    };

    const saveDay = async () => {
        const errs = {};
        if (!dayForm.date) errs.date = 'Required';
        if (!dayForm.title?.trim()) errs.title = 'Required';
        setDayErr(errs);
        if (Object.keys(errs).length) return;
        setDayBusy(true);
        try {
            const payload = {
                day_number: dayForm.day_number,
                date: dayForm.date,
                title: dayForm.title.trim(),
                description: dayForm.description.trim(),
                estimated_cost: parseFloat(dayForm.estimated_cost) || 0,
                actual_cost: editDay?.actual_cost || 0,
                itinerary_id: parseInt(id),
                activities: [],
            };
            if (editDay) {
                await axios.put(`http://127.0.0.1:8000/itinerary-days/${editDay.id}`, payload);
                toast('Day updated!');
            } else {
                await axios.post('http://127.0.0.1:8000/itinerary-days', payload);
                toast('Day added!');
            }
            await load();
            setDayOpen(false);
        } catch (e) { toast(e.response?.data?.detail || 'Failed.', 'error'); }
        finally { setDayBusy(false); }
    };

    const deleteDay = async (day) => {
        try {
            await axios.delete(`http://127.0.0.1:8000/itinerary-days/${day.id}`);
            toast('Day deleted.');
            await load();
        } catch { toast('Failed to delete day.', 'error'); }
        setDelOpen(false); setDelTarget(null);
    };

    // ── Activity CRUD ─────────────────────────────────────────────────────────
    const openAddAct = (dayId) => {
        setActDayId(dayId); setEditAct(null);
        setActForm({ title:'', description:'', location:'', start_time:'', end_time:'', activity_type:'sightseeing', cost:0, actual_cost:0, place_id:null, latitude:null, longitude:null, formatted_address:null, place_types:null, rating:null });
        setActErr({});
        setActOpen(true);
    };

    const openEditAct = (act, dayId) => {
        setActDayId(dayId); setEditAct(act);
        setActForm({
            title:         act.title || '',
            description:   act.description || '',
            location:      act.location || '',
            start_time:    act.start_time || '',
            end_time:      act.end_time || '',
            activity_type: act.activity_type || 'sightseeing',
            cost:          act.cost || 0,
            actual_cost:   act.actual_cost || 0,
            place_id:      act.place_id || null,
            latitude:      act.latitude || null,
            longitude:     act.longitude || null,
            formatted_address: act.formatted_address || null,
            place_types:   act.place_types || null,
            rating:        act.rating || null,
        });
        setActErr({});
        setActOpen(true);
    };

    const saveAct = async () => {
        const errs = {};
        if (!actForm.location?.trim()) errs.location = 'Required';
        setActErr(errs);
        if (Object.keys(errs).length) return;
        setActBusy(true);
        try {
            const payload = {
                title:         actForm.title?.trim() || actForm.location.trim(),
                description:   actForm.description.trim(),
                location:      actForm.location.trim(),
                formatted_address: actForm.formatted_address || null,
                latitude:      actForm.latitude || null,
                longitude:     actForm.longitude || null,
                place_id:      actForm.place_id || null,
                place_types:   actForm.place_types || null,
                rating:        actForm.rating || null,
                start_time:    actForm.start_time || null,
                end_time:      actForm.end_time   || null,
                activity_type: actForm.activity_type || 'sightseeing',
                cost:          parseFloat(actForm.cost)        || 0,
                actual_cost:   parseFloat(actForm.actual_cost) || 0,
                is_completed:  editAct?.is_completed || false,
                day_id:        actDayId,
            };
            if (editAct) {
                await axios.put(`http://127.0.0.1:8000/activities/${editAct.id}`, payload);
                toast('Activity updated!');
            } else {
                await axios.post('http://127.0.0.1:8000/activities', payload);
                toast('Activity added!');
            }
            await load();
            setActOpen(false);
        } catch (e) { toast(e.response?.data?.detail || 'Failed.', 'error'); }
        finally { setActBusy(false); }
    };

    const deleteAct = async (act) => {
        try {
            await axios.delete(`http://127.0.0.1:8000/activities/${act.id}`);
            toast('Activity deleted.');
            await load();
        } catch { toast('Failed to delete.', 'error'); }
        setDelOpen(false); setDelTarget(null);
    };

    // ── Sidebar nav ───────────────────────────────────────────────────────────
    const NAV = [
        { label:'Dashboard',       icon:<DashboardIcon />, path:'/dashboard' },
        { label:'My Itineraries',  icon:<ExploreIcon />,   path:'/itineraries', active:true },
        { label:'Interactive Map', icon:<MapIcon />,        path:'/dashboard' },
        { label:'Community Feed',  icon:<GroupIcon />,      path:'/community' },
    ];

    // ── Loading / Error states ────────────────────────────────────────────────
    if (loading) return (
        <Box sx={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', bgcolor:C.bg }}>
            <CircularProgress sx={{ color:C.brand }} />
        </Box>
    );
    if (!itinerary) return (
        <Box sx={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', bgcolor:C.bg }}>
            <Alert severity="error">Itinerary not found.</Alert>
        </Box>
    );

    // ── Derived totals ────────────────────────────────────────────────────────
    const totalDest   = itinerary.days?.reduce((s,d) => s + (d.activities?.length||0), 0) || 0;
    const totalEst    = itinerary.days?.reduce((s,d) => s + (d.estimated_cost||0), 0) || 0;
    const totalActual = itinerary.days?.reduce((s,d) =>
        s + (d.activities?.reduce((a,ac) => a + (ac.actual_cost||0), 0)||0), 0) || 0;

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <Box sx={{ display:'flex', bgcolor:C.bg, minHeight:'100vh', width:'100vw', position:'fixed', top:0, left:0, overflow:'hidden' }}>

            {/* ── Sidebar ───────────────────────────────────────────────────── */}
            <Drawer variant="permanent" sx={{
                width:DRAWER_W, flexShrink:0,
                '& .MuiDrawer-paper': {
                    width:DRAWER_W, boxSizing:'border-box',
                    bgcolor:C.bg, borderRight:'none',
                    backgroundImage:'linear-gradient(to bottom, rgba(51,204,204,0.05), transparent)',
                },
            }}>
                {/* Logo */}
                <Box sx={{ p:3, display:'flex', alignItems:'center', gap:1 }}>
                    <Box component="span" sx={{ color:C.red, fontSize:'1.5rem' }}>✈</Box>
                    <Typography variant="h6" fontWeight="bold" sx={{ color:'white', letterSpacing:0.5 }}>
                        Smart <Box component="span" sx={{ color:C.brand }}>Itinerary</Box>
                    </Typography>
                </Box>

                {/* Nav */}
                <List sx={{ px:2, mt:2, flexGrow:1 }}>
                    {NAV.map(item => (
                        <ListItem key={item.label} disablePadding sx={{ mb:1 }}>
                            <ListItemButton
                                selected={!!item.active}
                                onClick={() => navigate(item.path)}
                                sx={{
                                    borderRadius:2,
                                    color: item.active ? C.bg : C.sub,
                                    '&.Mui-selected': { bgcolor:C.brand, color:C.bg, '&:hover':{ bgcolor:'#2db8b8' } },
                                    '&:hover': { bgcolor:'rgba(255,255,255,0.07)' },
                                }}
                            >
                                <ListItemIcon sx={{ color: item.active ? C.bg : C.sub, minWidth:40 }}>{item.icon}</ListItemIcon>
                                <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: item.active ? 'bold' : 'medium', fontSize:'0.9rem' }} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>

                {/* Logout */}
                <Box sx={{ p:2 }}>
                    <Button fullWidth startIcon={<LogoutIcon />}
                        onClick={() => { localStorage.clear(); navigate('/login'); }}
                        sx={{ color:C.faded, bgcolor:'transparent', '&:hover':{ color:C.red, bgcolor:'rgba(255,107,107,0.1)' } }}
                    >Logout</Button>
                </Box>
            </Drawer>

            {/* ── Main Content ──────────────────────────────────────────────── */}
            <Box component="main" sx={{ flexGrow:1, height:'100vh', overflow:'auto', p:3 }}>

                {/* Back */}
                <Box sx={{ mb:2.5 }}>
                    <IconButton onClick={() => navigate(-1)}
                        sx={{ bgcolor:C.card, color:C.icons, borderRadius:2, '&:hover':{ bgcolor:'rgba(255,255,255,0.1)', color:C.brand } }}
                    >
                        <ArrowBackIcon />
                    </IconButton>
                </Box>

                {/* ── Itinerary Header Strip ─────────────────────────────────── */}
                <Box sx={{ bgcolor:C.card, borderRadius:4, px:3, py:2, mb:3, display:'flex', alignItems:'center', flexWrap:'wrap', gap:3 }}>

                    <Stack direction="row" alignItems="center" spacing={1}>
                        <KeyboardArrowDownIcon sx={{ color:C.brand }} />
                        <Typography variant="h6" fontWeight="bold" sx={{ color:C.heading }}>
                            {itinerary.title}
                        </Typography>
                    </Stack>

                    <Stack direction="row" alignItems="center" spacing={0.75}>
                        <CalendarTodayIcon sx={{ fontSize:'0.95rem', color:C.faded }} />
                        <Typography variant="body2" sx={{ color:C.sub, fontWeight:500 }}>
                            {fmtDate(itinerary.start_date)} – {fmtDate(itinerary.end_date)}
                        </Typography>
                    </Stack>

                    <Stack direction="row" alignItems="center" spacing={0.75}>
                        <LocationOnIcon sx={{ fontSize:'0.95rem', color:C.faded }} />
                        <Typography variant="body2" sx={{ color:C.sub, fontWeight:500 }}>
                            {totalDest} Destination{totalDest !== 1 ? 's' : ''}
                        </Typography>
                    </Stack>

                    <Box sx={{ flexGrow:1 }} />

                    <Stack direction="row" alignItems="center" spacing={0.75}>
                        <Typography variant="body2" sx={{ color:C.sub }}>Estimated :</Typography>
                        <Typography variant="body2" sx={{ color:C.faded }}>₹</Typography>
                        <Typography variant="body1" fontWeight="bold" sx={{ color:C.yellow }}>{fmtNum(totalEst)}</Typography>
                    </Stack>

                    <Stack direction="row" alignItems="center" spacing={0.75}>
                        <Typography variant="body2" sx={{ color:C.sub }}>Actual</Typography>
                        <Typography variant="body2" sx={{ color:C.faded }}>₹</Typography>
                        <Typography variant="body1" fontWeight="bold" sx={{ color:C.brand }}>{fmtNum(totalActual)}</Typography>
                    </Stack>

                    <Button size="small" startIcon={weatherLoading ? <CircularProgress size={14} sx={{ color: C.brand }} /> : <WbSunnyIcon sx={{ fontSize: 16 }} />}
                        onClick={fetchWeather} disabled={weatherLoading}
                        sx={{ color: C.brand, bgcolor: 'rgba(51,204,204,0.08)', borderRadius: 2, textTransform: 'none', fontSize: '0.78rem', px: 1.5, '&:hover': { bgcolor: 'rgba(51,204,204,0.15)' } }}>
                        {weatherLoading ? 'Fetching...' : 'Weather'}
                    </Button>
                </Box>

                {/* ── Days ──────────────────────────────────────────────────── */}
                {!itinerary.days?.length ? (
                    <Box sx={{ textAlign:'center', py:12 }}>
                        <Typography variant="h6" sx={{ color:C.sub, mb:1 }}>No days planned yet</Typography>
                        <Typography variant="body2" sx={{ color:C.faded, mb:3 }}>Start by adding your first day.</Typography>
                        <Button startIcon={<AddIcon />} onClick={openAddDay}
                            sx={{ bgcolor:C.brand, color:C.bg, fontWeight:'bold', borderRadius:3, px:3, textTransform:'none', '&:hover':{ bgcolor:'#2db8b8' } }}>
                            Add First Day
                        </Button>
                    </Box>
                ) : (
                    <Stack spacing={2.5}>
                        {itinerary.days.map((day) => {
                            const isOpen   = !collapsed[day.id];
                            const dayEst   = day.estimated_cost || 0;
                            const dayActual = day.activities?.reduce((s,a) => s + (a.actual_cost||0), 0) || 0;

                            return (
                                <Box key={day.id} sx={{ bgcolor:C.card, borderRadius:4, overflow:'hidden' }}>

                                    {/* ── Day Header ── */}
                                    <Stack direction="row" alignItems="center" sx={{ px:3, py:2.25 }}>

                                        {/* Collapse toggle */}
                                        <IconButton size="small"
                                            onClick={() => setCollapsed(p => ({ ...p, [day.id]: !p[day.id] }))}
                                            sx={{ color:C.faded, mr:0.5, '&:hover':{ color:C.brand } }}
                                        >
                                            {isOpen ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
                                        </IconButton>

                                        {/* Day label */}
                                        <Typography variant="h6" fontWeight="bold" sx={{ color:C.heading }}>
                                            Day {day.day_number}: {fmtDateFull(day.date)}
                                        </Typography>

                                        {/* Weather chip */}
                                        {day.weather_condition && (
                                            <Stack direction="row" alignItems="center" spacing={0.5} sx={{
                                                bgcolor: 'rgba(51,204,204,0.06)', borderRadius: 2, px: 1.2, py: 0.3, ml: 1.5,
                                                border: '1px solid rgba(51,204,204,0.12)',
                                            }}>
                                                {day.weather_icon && (
                                                    <Box component="img" src={`https://openweathermap.org/img/wn/${day.weather_icon}.png`}
                                                        sx={{ width: 24, height: 24 }} />
                                                )}
                                                <Typography sx={{ color: C.heading, fontSize: '0.72rem', fontWeight: 600 }}>
                                                    {Math.round(day.weather_temp_min || 0)}°–{Math.round(day.weather_temp_max || 0)}°
                                                </Typography>
                                                <Typography sx={{ color: C.faded, fontSize: '0.65rem' }}>
                                                    {day.weather_description || day.weather_condition}
                                                </Typography>
                                            </Stack>
                                        )}

                                        <Box sx={{ flexGrow: 1 }} />

                                        {/* Per-day budget numbers */}
                                        <Stack direction="row" alignItems="center" spacing={2} sx={{ mr:1.5 }}>
                                            <Stack direction="row" alignItems="center" spacing={0.5}>
                                                <Typography variant="caption" sx={{ color:C.faded }}>Est.</Typography>
                                                <Typography variant="body2" fontWeight="bold" sx={{ color:C.yellow }}>
                                                    ₹ {fmtNum(dayEst)}
                                                </Typography>
                                            </Stack>
                                            <Stack direction="row" alignItems="center" spacing={0.5}>
                                                <Typography variant="caption" sx={{ color:C.faded }}>Actual</Typography>
                                                <Typography variant="body2" fontWeight="bold" sx={{ color:C.brand }}>
                                                    ₹ {fmtNum(dayActual)}
                                                </Typography>
                                            </Stack>
                                        </Stack>

                                        {/* Delete day */}
                                        <IconButton size="small"
                                            onClick={() => { setDelTarget({ type:'day', item:day }); setDelOpen(true); }}
                                            sx={{ color:C.faded, '&:hover':{ color:C.red } }}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>

                                        {/* Add Destination */}
                                        <Button size="small" startIcon={<AddIcon />}
                                            onClick={() => openAddAct(day.id)}
                                            sx={{
                                                ml:1.5,
                                                bgcolor:C.brand, color:C.bg,
                                                fontWeight:'bold', borderRadius:3,
                                                textTransform:'none', px:2, py:0.75,
                                                fontSize:'0.82rem',
                                                '&:hover':{ bgcolor:'#2db8b8', transform:'translateY(-1px)', boxShadow:`0 4px 12px ${C.brand}40` },
                                                transition:'all 0.25s',
                                            }}>
                                            Add Destination
                                        </Button>
                                    </Stack>

                                    {/* Day description */}
                                    {day.description && isOpen && (
                                        <Typography variant="body2" sx={{ color:C.faded, px:4, pb:1.5 }}>
                                            {day.description}
                                        </Typography>
                                    )}

                                    {/* ── Activities ── */}
                                    <Collapse in={isOpen}>
                                        <Box sx={{ px:2, pb:2 }}>
                                            {/* Weather detail bar */}
                                            {day.weather_condition && (
                                                <Stack direction="row" spacing={2.5} alignItems="center" sx={{
                                                    bgcolor: 'rgba(51,204,204,0.04)', borderRadius: 2.5, px: 2, py: 1, mb: 1.5,
                                                    border: '1px solid rgba(51,204,204,0.08)',
                                                }}>
                                                    {day.weather_icon && (
                                                        <Box component="img" src={`https://openweathermap.org/img/wn/${day.weather_icon}@2x.png`}
                                                            sx={{ width: 40, height: 40 }} />
                                                    )}
                                                    <Box>
                                                        <Typography sx={{ color: C.heading, fontSize: '0.85rem', fontWeight: 700 }}>
                                                            {Math.round(day.weather_temp_min || 0)}° – {Math.round(day.weather_temp_max || 0)}°C
                                                        </Typography>
                                                        <Typography sx={{ color: C.faded, fontSize: '0.72rem', textTransform: 'capitalize' }}>
                                                            {day.weather_description || day.weather_condition}
                                                        </Typography>
                                                    </Box>
                                                    {day.weather_humidity != null && (
                                                        <Stack direction="row" spacing={0.4} alignItems="center">
                                                            <WaterDropIcon sx={{ fontSize: 14, color: '#42a5f5' }} />
                                                            <Typography sx={{ color: C.sub, fontSize: '0.72rem' }}>{day.weather_humidity}%</Typography>
                                                        </Stack>
                                                    )}
                                                    {day.weather_wind_speed != null && (
                                                        <Stack direction="row" spacing={0.4} alignItems="center">
                                                            <AirIcon sx={{ fontSize: 14, color: C.faded }} />
                                                            <Typography sx={{ color: C.sub, fontSize: '0.72rem' }}>{day.weather_wind_speed} m/s</Typography>
                                                        </Stack>
                                                    )}
                                                </Stack>
                                            )}
                                            {!day.activities?.length ? (
                                                <Box sx={{ textAlign:'center', py:4 }}>
                                                    <Typography variant="body2" sx={{ color:C.faded }}>
                                                        No destinations yet — click "+ Add Destination" above to begin.
                                                    </Typography>
                                                </Box>
                                            ) : (
                                                <Stack spacing={1.5}>
                                                    {day.activities.map((act) => {
                                                        const meta = actMeta(act.activity_type);
                                                        return (
                                                            <Box key={act.id} sx={{
                                                                display:'flex', alignItems:'center', gap:2,
                                                                bgcolor:C.surface, borderRadius:3, px:2.5, py:1.75,
                                                                opacity: act.is_completed ? 0.55 : 1,
                                                                transition:'all 0.2s',
                                                                '&:hover':{ bgcolor:'rgba(255,255,255,0.1)' },
                                                            }}>
                                                                {/* Time badge */}
                                                                <Box sx={{
                                                                    bgcolor:C.brand, color:C.bg,
                                                                    fontWeight:'bold', fontSize:'0.72rem',
                                                                    px:1.5, py:0.5, borderRadius:2,
                                                                    whiteSpace:'nowrap', flexShrink:0,
                                                                    minWidth:68, textAlign:'center',
                                                                    visibility: act.start_time ? 'visible' : 'hidden',
                                                                }}>
                                                                    {fmtTime(act.start_time)}
                                                                </Box>

                                                                {/* Activity icon */}
                                                                <Box sx={{
                                                                    bgcolor:meta.bg, color:meta.color,
                                                                    borderRadius:2, p:0.875,
                                                                    display:'flex', alignItems:'center', justifyContent:'center',
                                                                    flexShrink:0,
                                                                }}>
                                                                    {meta.icon}
                                                                </Box>

                                                                {/* Info */}
                                                                <Box sx={{ flexGrow:1, minWidth:0 }}>
                                                                    <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
                                                                        <Typography variant="body1" fontWeight="600"
                                                                            sx={{ color:C.sub, textDecoration: act.is_completed ? 'line-through' : 'none' }}>
                                                                            {act.title}
                                                                        </Typography>
                                                                        {act.location && (
                                                                            <Stack direction="row" alignItems="center" spacing={0.4}>
                                                                                <LocationOnIcon sx={{ fontSize:'0.8rem', color:C.red }} />
                                                                                <Typography variant="caption" sx={{ color:C.faded }}>
                                                                                    {act.location}
                                                                                </Typography>
                                                                            </Stack>
                                                                        )}
                                                                    </Stack>
                                                                    {act.description && (
                                                                        <Typography variant="caption" sx={{ color:C.faded, display:'block', mt:0.25 }}>
                                                                            {act.description}
                                                                        </Typography>
                                                                    )}
                                                                </Box>

                                                                {/* Estimated cost pill */}
                                                                <Box sx={{
                                                                    bgcolor:'rgba(255,183,77,0.12)', color:C.yellow,
                                                                    fontWeight:'bold', fontSize:'0.875rem',
                                                                    px:2, py:0.75, borderRadius:2.5,
                                                                    minWidth:76, textAlign:'center', flexShrink:0,
                                                                }}>
                                                                    {fmtNum(act.cost)}
                                                                </Box>

                                                                {/* Actual cost pill */}
                                                                <Box sx={{
                                                                    bgcolor:'rgba(51,204,204,0.1)', color:C.brand,
                                                                    fontWeight:'bold', fontSize:'0.875rem',
                                                                    px:2, py:0.75, borderRadius:2.5,
                                                                    minWidth:76, textAlign:'center', flexShrink:0,
                                                                }}>
                                                                    {fmtNum(act.actual_cost || 0)}
                                                                </Box>

                                                                {/* Edit activity */}
                                                                <IconButton size="small" onClick={() => openEditAct(act, day.id)}
                                                                    sx={{ color:C.faded, '&:hover':{ color:C.brand } }}>
                                                                    <EditIcon sx={{ fontSize:'1.1rem' }} />
                                                                </IconButton>

                                                                {/* Delete activity */}
                                                                <IconButton size="small"
                                                                    onClick={() => { setDelTarget({ type:'activity', item:act }); setDelOpen(true); }}
                                                                    sx={{ color:C.faded, '&:hover':{ color:C.red } }}>
                                                                    <DeleteIcon sx={{ fontSize:'1.1rem' }} />
                                                                </IconButton>
                                                            </Box>
                                                        );
                                                    })}
                                                </Stack>
                                            )}
                                        </Box>
                                    </Collapse>
                                </Box>
                            );
                        })}

                        {/* Add Another Day */}
                        <Box>
                            <Button startIcon={<AddIcon />} onClick={openAddDay}
                                sx={{
                                    color:C.brand, bgcolor:'rgba(51,204,204,0.08)',
                                    fontWeight:'bold', borderRadius:3, px:3, textTransform:'none',
                                    '&:hover':{ bgcolor:'rgba(51,204,204,0.15)' },
                                }}>
                                Add Another Day
                            </Button>
                        </Box>
                    </Stack>
                )}

                {/* ── Alerts & Reports for this itinerary ─────────────────── */}
                {alerts.length > 0 && (
                    <Box sx={{ mt: 4, mb: 2 }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ color: C.yellow, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box component="span" sx={{ fontSize: '1.1rem' }}>⚠</Box>
                            Community Alerts ({alerts.length})
                        </Typography>
                        <Stack spacing={1.5}>
                            {alerts.map((alert) => {
                                const sevColors = { info: C.brand, warning: C.yellow, urgent: C.red };
                                const sevColor = sevColors[alert.severity] || C.yellow;
                                return (
                                    <Box key={alert.id} sx={{
                                        bgcolor: C.card, borderRadius: 3, border: `1px solid ${sevColor}30`,
                                        borderLeft: `3px solid ${sevColor}`, px: 2.5, py: 1.5,
                                    }}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                                                    <Typography sx={{ color: sevColor, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
                                                        {alert.update_type}
                                                    </Typography>
                                                    <Typography sx={{ color: C.faded, fontSize: '0.68rem' }}>·</Typography>
                                                    <Typography sx={{ color: C.faded, fontSize: '0.68rem' }}>{alert.severity}</Typography>
                                                    <Typography sx={{ color: C.faded, fontSize: '0.68rem' }}>·</Typography>
                                                    <Stack direction="row" spacing={0.3} alignItems="center">
                                                        <LocationOnIcon sx={{ fontSize: 11, color: C.brand }} />
                                                        <Typography sx={{ color: C.brand, fontSize: '0.68rem' }}>{alert.location}</Typography>
                                                    </Stack>
                                                </Stack>
                                                <Typography sx={{ color: C.heading, fontSize: '0.88rem', fontWeight: 600 }}>{alert.title}</Typography>
                                                <Typography sx={{ color: C.faded, fontSize: '0.78rem', mt: 0.3, lineHeight: 1.5 }}>{alert.content}</Typography>
                                            </Box>
                                            <Typography sx={{ color: C.faded, fontSize: '0.65rem', flexShrink: 0, ml: 2 }}>
                                                {fmtDate(alert.created_at)}
                                            </Typography>
                                        </Stack>
                                    </Box>
                                );
                            })}
                        </Stack>
                    </Box>
                )}
            </Box>

            {/* ── Activity Dialog ───────────────────────────────────────────── */}
            <Dialog open={actOpen} onClose={() => setActOpen(false)} maxWidth="sm" fullWidth
                PaperProps={{ sx:{ bgcolor:C.card, borderRadius:4 } }}>
                <DialogTitle sx={{ color:C.heading, fontWeight:'bold' }}>
                    {editAct ? 'Edit Activity' : 'Add Activity'}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2.5} sx={{ mt:1 }}>
                        <Box>
                            <PlaceSearchAutocomplete
                                label="Location / Place *"
                                value={actForm.location}
                                onChange={(text) => setActForm(f => ({ ...f, location: text, title: text, place_id: null, latitude: null, longitude: null, formatted_address: null, place_types: null, rating: null }))}
                                onSelect={(place) => setActForm(f => ({
                                    ...f,
                                    location: place.name,
                                    title: place.name,
                                    place_id: place.google_place_id,
                                    latitude: place.latitude,
                                    longitude: place.longitude,
                                    formatted_address: place.address,
                                    place_types: Array.isArray(place.place_types) ? place.place_types.join(',') : place.place_types || null,
                                    rating: place.rating || null,
                                }))}
                            />
                            {actErr.location && (
                                <Typography variant="caption" sx={{ color: C.red, ml: 1.5, mt: 0.5, display: 'block' }}>{actErr.location}</Typography>
                            )}
                            {actForm.place_id ? (
                                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5, ml: 0.5 }}>
                                    <Chip label="Mapped" size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: 'rgba(51,204,204,0.12)', color: C.brand, border: '1px solid rgba(51,204,204,0.3)' }} />
                                    {actForm.formatted_address && (
                                        <Typography variant="caption" sx={{ color: C.faded, fontSize: '0.7rem' }}>{actForm.formatted_address}</Typography>
                                    )}
                                </Stack>
                            ) : actForm.location?.trim() && (
                                <Typography variant="caption" sx={{ color: C.faded, fontSize: '0.68rem', ml: 0.5, mt: 0.3, display: 'block' }}>
                                    Select from dropdown to map this place
                                </Typography>
                            )}
                        </Box>
                        <Stack direction="row" spacing={2}>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="caption" sx={{ color: C.faded, mb: 0.5, display: 'block', fontWeight: 600 }}>Time</Typography>
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                    <TextField
                                        select size="small"
                                        value={(() => { if (!actForm.start_time) return ''; const h = parseInt(actForm.start_time.split(':')[0]); return String(h % 12 || 12).padStart(2,'0'); })()}
                                        onChange={(e) => { const hr = parseInt(e.target.value) || 12; const m = (actForm.start_time || '00:00').split(':')[1] || '00'; const isPM = actForm.start_time ? parseInt(actForm.start_time.split(':')[0]) >= 12 : false; const h24 = isPM ? (hr === 12 ? 12 : hr + 12) : (hr === 12 ? 0 : hr); setActForm(f => ({ ...f, start_time: `${String(h24).padStart(2,'0')}:${m}` })); }}
                                        SelectProps={{ native: true, sx: { py: '6px !important', pr: '20px !important' } }}
                                        sx={{ ...inputSx, width: 58, '& .MuiSelect-icon': { right: 2, fontSize: 16, color: C.faded } }}
                                    >
                                        <option value="">-</option>
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map(h => <option key={h} value={String(h).padStart(2,'0')}>{String(h).padStart(2,'0')}</option>)}
                                    </TextField>
                                    <Typography sx={{ color: C.faded, fontWeight: 700, fontSize: '0.9rem' }}>:</Typography>
                                    <TextField
                                        select size="small"
                                        value={actForm.start_time ? actForm.start_time.split(':')[1] || '00' : ''}
                                        onChange={(e) => { const h = (actForm.start_time || '00:00').split(':')[0]; setActForm(f => ({ ...f, start_time: `${h}:${e.target.value}` })); }}
                                        SelectProps={{ native: true, sx: { py: '6px !important', pr: '20px !important' } }}
                                        sx={{ ...inputSx, width: 58, '& .MuiSelect-icon': { right: 2, fontSize: 16, color: C.faded } }}
                                    >
                                        <option value="">-</option>
                                        {['00','15','30','45'].map(m => <option key={m} value={m}>{m}</option>)}
                                    </TextField>
                                    <TextField
                                        select size="small"
                                        value={actForm.start_time ? (parseInt(actForm.start_time.split(':')[0]) >= 12 ? 'PM' : 'AM') : 'AM'}
                                        onChange={(e) => { const [hStr, m] = (actForm.start_time || '00:00').split(':'); let h = parseInt(hStr) || 0; if (e.target.value === 'PM' && h < 12) h += 12; if (e.target.value === 'AM' && h >= 12) h -= 12; setActForm(f => ({ ...f, start_time: `${String(h).padStart(2,'0')}:${m}` })); }}
                                        SelectProps={{ native: true, sx: { py: '6px !important', pr: '20px !important' } }}
                                        sx={{ ...inputSx, width: 58, '& .MuiSelect-icon': { right: 2, fontSize: 16, color: C.faded } }}
                                    >
                                        <option value="AM">AM</option>
                                        <option value="PM">PM</option>
                                    </TextField>
                                </Stack>
                            </Box>
                            <TextField fullWidth label={`Budget (${itinerary?.currency || 'NPR'})`} type="number" value={actForm.cost}
                                onChange={e => setActForm({ ...actForm, cost:e.target.value })}
                                placeholder="0" sx={inputSx} />
                        </Stack>
                        <TextField fullWidth label="Description (optional)" multiline rows={2} value={actForm.description}
                            onChange={e => setActForm({ ...actForm, description:e.target.value })}
                            placeholder="e.g., Scenic views, local food stop" sx={inputSx} />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px:3, pb:2.5 }}>
                    <Button onClick={() => setActOpen(false)} disabled={actBusy} sx={{ color:C.faded }}>Cancel</Button>
                    <Button onClick={saveAct} disabled={actBusy}
                        sx={{ bgcolor:C.brand, color:C.bg, fontWeight:'bold', borderRadius:3, px:3, '&:hover':{ bgcolor:'#2db8b8' } }}>
                        {actBusy ? <CircularProgress size={20} /> : (editAct ? 'Update' : 'Add Activity')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Delete Confirm ────────────────────────────────────────────── */}
            <Dialog open={delOpen} onClose={() => { setDelOpen(false); setDelTarget(null); }}
                PaperProps={{ sx:{ bgcolor:C.card, borderRadius:4 } }}>
                <DialogTitle sx={{ color:C.heading, fontWeight:'bold' }}>Confirm Delete</DialogTitle>
                <DialogContent>
                    <Typography sx={{ color:C.text }}>
                        Delete this {delTarget?.type}? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px:3, pb:2.5 }}>
                    <Button onClick={() => { setDelOpen(false); setDelTarget(null); }} sx={{ color:C.faded }}>Cancel</Button>
                    <Button
                        onClick={() => {
                            if (delTarget?.type === 'day') deleteDay(delTarget.item);
                            else deleteAct(delTarget.item);
                        }}
                        sx={{ bgcolor:C.red, color:'white', fontWeight:'bold', borderRadius:3, px:3, '&:hover':{ bgcolor:'#e55959' } }}>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Snackbar ──────────────────────────────────────────────────── */}
            <Snackbar open={snack.open} autoHideDuration={3000}
                onClose={() => setSnack(p => ({ ...p, open:false }))}
                anchorOrigin={{ vertical:'bottom', horizontal:'right' }}>
                <Alert severity={snack.sev} onClose={() => setSnack(p => ({ ...p, open:false }))}
                    sx={{ bgcolor:C.card, color:C.text, borderRadius:3 }}>
                    {snack.msg}
                </Alert>
            </Snackbar>
        </Box>
    );
}