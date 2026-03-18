import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Typography, Stack, Button, CircularProgress, Chip, Collapse,
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Select, MenuItem, InputAdornment, IconButton, Snackbar, Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import Navbar, { DRAWER_WIDTH } from '../components/Navbar';
import PlaceSearchAutocomplete from '../components/PlaceSearchAutocomplete';

import LocationOnIcon         from '@mui/icons-material/LocationOn';
import CalendarTodayIcon      from '@mui/icons-material/CalendarToday';
import KeyboardArrowDownIcon  from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import RouteIcon              from '@mui/icons-material/Route';
import PlaceIcon              from '@mui/icons-material/Place';
import MapIcon                from '@mui/icons-material/Map';
import WbSunnyIcon            from '@mui/icons-material/WbSunny';
import CloudIcon              from '@mui/icons-material/Cloud';
import UmbrellaIcon           from '@mui/icons-material/Umbrella';
import AcUnitIcon             from '@mui/icons-material/AcUnit';
import StraightenIcon         from '@mui/icons-material/Straighten';
import EditIcon               from '@mui/icons-material/Edit';

// ── Constants ─────────────────────────────────────────────────────────────────
const DAY_COLORS = [
    '#33CCCC', '#FF7043', '#66BB6A', '#AB47BC',
    '#FFB74D', '#42A5F5', '#EC407A', '#26A69A',
];

const STATUS_COLORS = {
    planning: '#33CCCC', confirmed: '#66d9a0',
    ongoing: '#ffb74d', completed: '#7B809A', cancelled: '#ff6b6b',
};

const fmtDate = (s) => {
    if (!s) return '';
    return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const haversine = ([lat1, lon1], [lat2, lon2]) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2
        + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
        * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const totalHaversine = (pts) => {
    let d = 0;
    for (let i = 1; i < pts.length; i++) d += haversine(pts[i - 1], pts[i]);
    return d;
};

const fmtKm = (km) => km < 1 ? (km * 1000).toFixed(0) + ' m' : km.toFixed(1) + ' km';

const weatherIcon = (condition) => {
    const c = (condition || '').toLowerCase();
    if (c.includes('thunder'))                              return <WbSunnyIcon  sx={{ fontSize: 12, color: '#FFB74D' }} />;
    if (c.includes('snow') || c.includes('ice'))           return <AcUnitIcon   sx={{ fontSize: 12, color: '#90CAF9' }} />;
    if (c.includes('rain') || c.includes('drizzle'))       return <UmbrellaIcon sx={{ fontSize: 12, color: '#64B5F6' }} />;
    if (c.includes('cloud') || c.includes('mist') || c.includes('fog')) return <CloudIcon sx={{ fontSize: 12, color: '#90A4AE' }} />;
    return <WbSunnyIcon sx={{ fontSize: 12, color: '#FFD54F' }} />;
};

// Leaflet + LRM CDN loader
let leafletReady = null;
const loadLeaflet = () => {
    if (leafletReady) return leafletReady;
    leafletReady = new Promise((resolve) => {
        if (window.L && window.L.Routing) { resolve(window.L); return; }
        const addLink = (href) => { const el = document.createElement('link'); el.rel = 'stylesheet'; el.href = href; document.head.appendChild(el); };
        const addScript = (src) => new Promise((res) => { const el = document.createElement('script'); el.src = src; el.onload = res; document.head.appendChild(el); });
        addLink('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
        addLink('https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css');
        addScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js')
            .then(() => addScript('https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js'))
            .then(() => resolve(window.L));
    });
    return leafletReady;
};

const makeIcon = (L, color, number) => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">'
        + '<path d="M16 0C7.163 0 0 7.163 0 16c0 11 16 24 16 24S32 27 32 16C32 7.163 24.837 0 16 0z"'
        + ' fill="' + color + '" stroke="rgba(0,0,0,0.3)" stroke-width="1"/>'
        + '<circle cx="16" cy="16" r="9" fill="rgba(0,0,0,0.25)"/>'
        + '<text x="16" y="20.5" text-anchor="middle" font-size="11"'
        + ' font-family="sans-serif" font-weight="700" fill="white">' + number + '</text></svg>';
    return L.divIcon({ html: svg, className: '', iconSize: [32, 40], iconAnchor: [16, 40], popupAnchor: [0, -42] });
};

// ═════════════════════════════════════════════════════════════════════════════
export default function InteractiveMap() {
    const navigate   = useNavigate();
    const { COLORS, isDark } = useTheme();

    // compact alias
    const C = {
        brand:   COLORS.brand,
        bg:      COLORS.background,
        card:    COLORS.cardPrimary,
        surface: COLORS.cardSecondary,
        border:  COLORS.cardBorder,
        heading: COLORS.headings,
        sub:     COLORS.subheadings,
        text:    COLORS.text,
        faded:   COLORS.fadedText,
        red:     '#ff6b6b',
        yellow:  '#ffb74d',
    };

    const mapRef      = useRef(null);
    const leafletMap  = useRef(null);
    const layersRef   = useRef([]);
    const tileLayerRef = useRef(null);

    const [itineraries, setItineraries]     = useState([]);
    const [selected, setSelected]           = useState(null);
    const [detail, setDetail]               = useState(null);
    const [loadingList, setLoadingList]     = useState(true);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [expanded, setExpanded]           = useState({});
    const [selectedDay, setSelectedDay]     = useState(null);
    const [leaflet, setLeaflet]             = useState(null);
    const [routingStatus, setRoutingStatus] = useState({});
    const [dayDistances, setDayDistances]   = useState({});

    // edit activity dialog
    const [editOpen, setEditOpen]   = useState(false);
    const [editMode, setEditMode]   = useState(false);  // false = info view, true = edit form
    const [editAct, setEditAct]     = useState(null);   // full activity object
    const [editForm, setEditForm]   = useState({});
    const [editBusy, setEditBusy]   = useState(false);
    const [snack, setSnack]         = useState({ open: false, msg: '', sev: 'success' });

    const toast = (msg, sev = 'success') => setSnack({ open: true, msg, sev });

    const openEditDialog = (act) => {
        setEditAct(act);
        setEditMode(false);  // always start on info view
        setEditForm({
            location:      act.location || '',
            title:         act.title || '',
            activity_type: act.activity_type || 'sightseeing',
            start_time:    act.start_time || '',
            cost:          act.cost ?? 0,
            actual_cost:   act.actual_cost ?? 0,
            description:   act.description || '',
            place_id:      act.place_id || null,
            latitude:      act.latitude || null,
            longitude:     act.longitude || null,
            formatted_address: act.formatted_address || null,
            place_types:   act.place_types || null,
            rating:        act.rating || null,
        });
        setEditOpen(true);
    };

    const saveEdit = async () => {
        if (!editAct) return;
        setEditBusy(true);
        try {
            await axios.put(`http://127.0.0.1:8000/activities/${editAct.id}`, {
                title:         editForm.title?.trim() || editForm.location.trim(),
                location:      editForm.location.trim(),
                activity_type: editForm.activity_type,
                start_time:    editForm.start_time || null,
                cost:          parseFloat(editForm.cost) || 0,
                actual_cost:   parseFloat(editForm.actual_cost) || 0,
                description:   editForm.description?.trim() || '',
                place_id:      editForm.place_id || null,
                latitude:      editForm.latitude || null,
                longitude:     editForm.longitude || null,
                formatted_address: editForm.formatted_address || null,
                place_types:   editForm.place_types || null,
                rating:        editForm.rating || null,
                is_completed:  editAct.is_completed || false,
                day_id:        editAct.day_id,
            });
            toast('Activity updated!');
            setEditOpen(false);
            setEditMode(false);
            // reload detail to redraw map
            if (selected) {
                const r = await axios.get(`http://127.0.0.1:8000/itineraries/${selected.id}`);
                setDetail(r.data);
            }
        } catch (e) {
            toast(e.response?.data?.detail || 'Failed to save.', 'error');
        } finally { setEditBusy(false); }
    };

    useEffect(() => {
        const userId = localStorage.getItem('userId');
        if (!userId) { navigate('/login'); return; }
        axios.get('http://127.0.0.1:8000/itineraries/user/' + userId)
            .then(r => {
                const list = r.data || [];
                setItineraries(list);
                if (list.length > 0) setSelected(list[0]); // auto-select most recent
            })
            .catch(() => {})
            .finally(() => setLoadingList(false));
        loadLeaflet().then(L => setLeaflet(L));
    }, [navigate]);

    useEffect(() => {
        if (!leaflet || !mapRef.current || leafletMap.current) return;
        const map = leaflet.map(mapRef.current, { center: [28.3949, 84.1240], zoom: 7, zoomControl: false });
        leaflet.control.zoom({ position: 'bottomleft' }).addTo(map);
        const tileUrl = isDark
            ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
            : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
        tileLayerRef.current = leaflet.tileLayer(tileUrl,
            { attribution: '&copy; OpenStreetMap &copy; CARTO', maxZoom: 19 });
        tileLayerRef.current.addTo(map);
        leafletMap.current = map;
    }, [leaflet]);

    // swap tile layer when theme changes
    useEffect(() => {
        const map = leafletMap.current;
        const L   = leaflet;
        if (!map || !L) return;
        if (tileLayerRef.current) map.removeLayer(tileLayerRef.current);
        const tileUrl = isDark
            ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
            : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
        tileLayerRef.current = L.tileLayer(tileUrl,
            { attribution: '&copy; OpenStreetMap &copy; CARTO', maxZoom: 19 });
        tileLayerRef.current.addTo(map);
    }, [isDark, leaflet]);

    useEffect(() => {
        if (!selected) { setDetail(null); return; }
        setLoadingDetail(true); setSelectedDay(null); setRoutingStatus({}); setDayDistances({});
        axios.get('http://127.0.0.1:8000/itineraries/' + selected.id)
            .then(r => setDetail(r.data))
            .catch(() => setDetail(null))
            .finally(() => setLoadingDetail(false));
    }, [selected]);

    // Draw markers + OSRM routes
    useEffect(() => {
        const map = leafletMap.current;
        const L   = leaflet;
        if (!map || !L) return;

        layersRef.current.forEach(l => {
            try { if (l._router) map.removeControl(l); else map.removeLayer(l); } catch (_) {}
        });
        layersRef.current = [];
        if (!detail?.days?.length) return;

        const newStatus = {};
        const newDist   = {};
        const allPoints = [];
        const daysToDraw = selectedDay != null ? detail.days.filter(d => d.id === selectedDay) : detail.days;

        daysToDraw.forEach((day) => {
            const dayIdx    = detail.days.findIndex(d => d.id === day.id);
            const color     = DAY_COLORS[dayIdx % DAY_COLORS.length];
            const mappedActs = (day.activities || []).filter(a => a.latitude && a.longitude);
            if (!mappedActs.length) return;

            mappedActs.forEach((act, i) => {
                const latlng = [act.latitude, act.longitude];
                allPoints.push(latlng);
                const marker = L.marker(latlng, { icon: makeIcon(L, color, i + 1) });

                // click opens the edit dialog — use a custom event so React state is accessible
                marker.on('click', () => {
                    const event = new CustomEvent('map-edit-activity', { detail: act });
                    window.dispatchEvent(event);
                });

                marker.addTo(map);
                layersRef.current.push(marker);
            });

            if (mappedActs.length < 2) { newStatus[day.id] = 'done'; newDist[day.id] = 0; return; }

            const hPoints = mappedActs.map(a => [a.latitude, a.longitude]);
            newDist[day.id]   = totalHaversine(hPoints);
            newStatus[day.id] = 'loading';

            if (L.Routing) {
                const waypoints = mappedActs.map(a => L.latLng(a.latitude, a.longitude));
                const control = L.Routing.control({
                    waypoints,
                    router: L.Routing.osrmv1({ serviceUrl: 'https://router.project-osrm.org/route/v1', profile: 'driving' }),
                    lineOptions: { styles: [{ color, weight: 4, opacity: 0.9 }, { color: 'white', weight: 1.5, opacity: 0.2 }], extendToWaypoints: false, missingRouteTolerance: 0 },
                    show: false, addWaypoints: false, routeWhileDragging: false, fitSelectedRoutes: false, showAlternatives: false, createMarker: () => null,
                });
                control.on('routesfound', (e) => {
                    const distKm = e.routes[0].summary.totalDistance / 1000;
                    setDayDistances(prev => ({ ...prev, [day.id]: distKm }));
                    setRoutingStatus(prev => ({ ...prev, [day.id]: 'done' }));
                });
                control.on('routingerror', () => {
                    setRoutingStatus(prev => ({ ...prev, [day.id]: 'fallback' }));
                    const line = L.polyline(hPoints, { color, weight: 3, opacity: 0.6, dashArray: '8 6' });
                    line.addTo(map); layersRef.current.push(line);
                });
                control.addTo(map); layersRef.current.push(control);
            } else {
                const line = L.polyline(hPoints, { color, weight: 3, opacity: 0.6, dashArray: '8 6' });
                line.addTo(map); layersRef.current.push(line);
                newStatus[day.id] = 'fallback';
            }
        });

        setRoutingStatus(prev => ({ ...prev, ...newStatus }));
        setDayDistances(prev => ({ ...prev, ...newDist }));
        if (allPoints.length > 0) map.fitBounds(L.latLngBounds(allPoints), { padding: [60, 60], maxZoom: 14 });
    }, [detail, leaflet, selectedDay]);

    const flyTo = (lat, lng) => {
        if (!leafletMap.current || !lat || !lng) return;
        leafletMap.current.flyTo([lat, lng], 15, { animate: true, duration: 1 });
    };

    // listen for marker clicks dispatched from Leaflet handlers
    useEffect(() => {
        const handler = (e) => openEditDialog(e.detail);
        window.addEventListener('map-edit-activity', handler);
        return () => window.removeEventListener('map-edit-activity', handler);
    }, []);

    const totalDistKm = detail?.days
        ? detail.days.reduce((s, d) => s + (dayDistances[d.id] || 0), 0)
        : 0;

    return (
    <>
        <Box sx={{ display: 'flex', bgcolor: C.bg, minHeight: '100vh', width: '100vw', position: 'fixed', top: 0, left: 0, overflow: 'hidden' }}>

            <Navbar />

            {/* Left panel — itinerary list + day details */}
            <Box sx={{
                width: 300, flexShrink: 0, height: '100vh', overflow: 'auto',
                borderRight: `1px solid ${C.border}`, bgcolor: C.bg,
                '&::-webkit-scrollbar': { width: 4 },
                '&::-webkit-scrollbar-thumb': { bgcolor: C.border, borderRadius: 4 },
            }}>
                <Box sx={{ px: 2.5, py: 2.5, borderBottom: `1px solid ${C.border}` }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                        <RouteIcon sx={{ color: C.brand, fontSize: 20 }} />
                        <Typography variant="h6" fontWeight="bold" sx={{ color: C.heading }}>Trip Routes</Typography>
                    </Stack>
                    <Typography variant="caption" sx={{ color: C.faded }}>Select an itinerary to visualise on map</Typography>
                </Box>

                {loadingList ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}>
                        <CircularProgress size={28} sx={{ color: C.brand }} />
                    </Box>
                ) : itineraries.length === 0 ? (
                    <Box sx={{ px: 2.5, pt: 5, textAlign: 'center' }}>
                        <PlaceIcon sx={{ fontSize: 40, color: C.faded, mb: 1 }} />
                        <Typography variant="body2" sx={{ color: C.faded }}>No itineraries yet</Typography>
                        <Button size="small" onClick={() => navigate('/itineraries')} sx={{ color: C.brand, mt: 1, textTransform: 'none', fontSize: '0.8rem' }}>
                            Create one →
                        </Button>
                    </Box>
                ) : (
                    <Stack>
                        {itineraries.map(itin => {
                            const isSelected = selected?.id === itin.id;
                            return (
                                <Box key={itin.id}>
                                    <Box onClick={() => setSelected(isSelected ? null : itin)} sx={{
                                        px: 2.5, py: 1.75, cursor: 'pointer',
                                        borderBottom: `1px solid ${C.border}`,
                                        bgcolor: isSelected ? `${C.brand}12` : 'transparent',
                                        borderLeft: isSelected ? `3px solid ${C.brand}` : '3px solid transparent',
                                        transition: 'all 0.18s',
                                        '&:hover': { bgcolor: `${C.brand}0A` },
                                    }}>
                                        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography variant="body2" fontWeight="700" noWrap
                                                    sx={{ color: isSelected ? C.brand : C.heading, mb: 0.3 }}>
                                                    {itin.title}
                                                </Typography>
                                                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.4 }}>
                                                    <LocationOnIcon sx={{ fontSize: 11, color: C.red }} />
                                                    <Typography variant="caption" sx={{ color: C.faded, fontSize: '0.7rem' }}>{itin.destination}</Typography>
                                                </Stack>
                                                <Stack direction="row" alignItems="center" spacing={0.5}>
                                                    <CalendarTodayIcon sx={{ fontSize: 10, color: C.faded }} />
                                                    <Typography variant="caption" sx={{ color: C.faded, fontSize: '0.68rem' }}>
                                                        {fmtDate(itin.start_date)} – {fmtDate(itin.end_date)}
                                                    </Typography>
                                                </Stack>
                                            </Box>
                                            <Stack alignItems="flex-end" spacing={0.5} sx={{ ml: 1, flexShrink: 0 }}>
                                                <Chip label={itin.status} size="small" sx={{
                                                    height: 18, fontSize: '0.6rem', fontWeight: 700,
                                                    bgcolor: (STATUS_COLORS[itin.status] || C.brand) + '20',
                                                    color: STATUS_COLORS[itin.status] || C.brand,
                                                }} />
                                                {isSelected
                                                    ? <KeyboardArrowDownIcon  sx={{ fontSize: 16, color: C.brand }} />
                                                    : <KeyboardArrowRightIcon sx={{ fontSize: 16, color: C.faded }} />}
                                            </Stack>
                                        </Stack>
                                    </Box>

                                    <Collapse in={isSelected}>
                                        {loadingDetail ? (
                                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                                                <CircularProgress size={20} sx={{ color: C.brand }} />
                                            </Box>
                                        ) : !detail ? null : <>

                                            {/* Day filter chips */}
                                            <Stack direction="row" sx={{ px: 2, py: 1.25, flexWrap: 'wrap', gap: 0.75, borderBottom: `1px solid ${C.border}`, bgcolor: 'rgba(0,0,0,0.2)' }}>
                                                <Chip label="All Days" size="small" onClick={() => setSelectedDay(null)} sx={{
                                                    height: 22, fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer',
                                                    bgcolor: selectedDay === null ? C.brand : 'rgba(255,255,255,0.07)',
                                                    color:   selectedDay === null ? C.bg    : C.faded,
                                                    '&:hover': { bgcolor: selectedDay === null ? '#2db8b8' : 'rgba(255,255,255,0.12)' },
                                                }} />
                                                {(detail?.days || []).map((d, idx) => (
                                                    <Chip key={d.id} label={'Day ' + d.day_number} size="small"
                                                        onClick={() => setSelectedDay(selectedDay === d.id ? null : d.id)} sx={{
                                                            height: 22, fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer',
                                                            bgcolor: selectedDay === d.id ? DAY_COLORS[idx % DAY_COLORS.length] : 'rgba(255,255,255,0.07)',
                                                            color:   selectedDay === d.id ? '#fff' : C.faded,
                                                            '&:hover': { opacity: 0.85 },
                                                        }} />
                                                ))}
                                            </Stack>

                                            {/* Day rows */}
                                            {(detail?.days || []).map((day, dayIdx) => {
                                                const color      = DAY_COLORS[dayIdx % DAY_COLORS.length];
                                                const isOpen     = expanded[day.id] !== false;
                                                const isDimmed   = selectedDay !== null && selectedDay !== day.id;
                                                const mappedActs = (day.activities || []).filter(a => a.latitude && a.longitude);
                                                const distKm     = dayDistances[day.id];
                                                const rStatus    = routingStatus[day.id];

                                                return (
                                                    <Box key={day.id} sx={{
                                                        borderBottom: `1px solid ${C.border}`,
                                                        opacity: isDimmed ? 0.35 : 1,
                                                        transition: 'opacity 0.2s',
                                                    }}>
                                                        <Stack direction="row" alignItems="center" sx={{ px: 2, py: 1, bgcolor: 'rgba(0,0,0,0.15)' }}>
                                                            <Box onClick={() => setSelectedDay(selectedDay === day.id ? null : day.id)} sx={{
                                                                width: 10, height: 10, borderRadius: '50%', bgcolor: color, mr: 1.2, flexShrink: 0, cursor: 'pointer',
                                                                outline: selectedDay === day.id ? '2px solid white' : 'none', outlineOffset: 2, transition: 'transform 0.15s',
                                                                '&:hover': { transform: 'scale(1.5)' },
                                                            }} />

                                                            <Box onClick={() => setSelectedDay(selectedDay === day.id ? null : day.id)} sx={{ flex: 1, cursor: 'pointer' }}>
                                                                <Typography sx={{ color: selectedDay === day.id ? color : C.sub, fontSize: '0.78rem', fontWeight: 700, '&:hover': { color } }}>
                                                                    Day {day.day_number}
                                                                    <Box component="span" sx={{ color: C.faded, fontWeight: 400, ml: 0.8 }}>{fmtDate(day.date)}</Box>
                                                                </Typography>
                                                                <Stack direction="row" alignItems="center" spacing={0.6} sx={{ mt: 0.2 }}>
                                                                    {rStatus === 'loading' ? (
                                                                        <><CircularProgress size={9} sx={{ color }} /><Typography sx={{ color: C.faded, fontSize: '0.62rem' }}>routing…</Typography></>
                                                                    ) : distKm != null && distKm > 0 ? (
                                                                        <>
                                                                            <StraightenIcon sx={{ fontSize: 11, color }} />
                                                                            <Typography sx={{ color, fontSize: '0.65rem', fontWeight: 600 }}>{fmtKm(distKm)}</Typography>
                                                                            {rStatus === 'fallback' && <Typography sx={{ color: C.faded, fontSize: '0.58rem' }}>(est.)</Typography>}
                                                                        </>
                                                                    ) : null}
                                                                    <Typography sx={{ color: C.faded, fontSize: '0.62rem', ml: 'auto !important' }}>{mappedActs.length} stops</Typography>
                                                                </Stack>
                                                            </Box>

                                                            <Box onClick={() => setExpanded(p => ({ ...p, [day.id]: !isOpen }))} sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', ml: 0.5 }}>
                                                                {isOpen
                                                                    ? <KeyboardArrowDownIcon  sx={{ fontSize: 14, color: C.faded }} />
                                                                    : <KeyboardArrowRightIcon sx={{ fontSize: 14, color: C.faded }} />}
                                                            </Box>
                                                        </Stack>

                                                        <Collapse in={isOpen}>
                                                            <Stack>
                                                                {(day.activities || []).map((act, actIdx) => {
                                                                    const hasCoords = !!(act.latitude && act.longitude);
                                                                    const prev = day.activities[actIdx - 1];
                                                                    const segDist = hasCoords && actIdx > 0 && prev?.latitude
                                                                        ? haversine([prev.latitude, prev.longitude], [act.latitude, act.longitude])
                                                                        : null;
                                                                    return (
                                                                        <Stack key={act.id} direction="row" alignItems="flex-start"
                                                                            onClick={() => hasCoords && flyTo(act.latitude, act.longitude)}
                                                                            sx={{
                                                                                px: 2.5, py: 0.9,
                                                                                cursor: hasCoords ? 'pointer' : 'default',
                                                                                opacity: hasCoords ? 1 : 0.45,
                                                                                '&:hover': hasCoords ? { bgcolor: `${C.brand}0A` } : {},
                                                                            }}>
                                                                            {hasCoords ? (
                                                                                <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: color, color: 'white', fontSize: '0.62rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.2, mr: 1.2 }}>
                                                                                    {actIdx + 1}
                                                                                </Box>
                                                                            ) : (
                                                                                <Box sx={{ width: 20, height: 20, borderRadius: '50%', border: `1px dashed ${C.faded}`, flexShrink: 0, mt: 0.2, mr: 1.2 }} />
                                                                            )}
                                                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                                <Typography noWrap sx={{ color: hasCoords ? C.text : C.faded, fontSize: '0.78rem', fontWeight: 600 }}>
                                                                                    {act.title || act.location}
                                                                                </Typography>
                                                                                <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mt: 0.15, flexWrap: 'wrap' }}>
                                                                                    {act.start_time && (
                                                                                        <Typography sx={{ color: C.faded, fontSize: '0.63rem' }}>{act.start_time.slice(0, 5)}</Typography>
                                                                                    )}
                                                                                    {act.cost > 0 && (
                                                                                        <Typography sx={{ color: C.yellow, fontSize: '0.63rem', fontWeight: 600 }}>
                                                                                            ₹{act.cost.toLocaleString()}
                                                                                        </Typography>
                                                                                    )}
                                                                                    {act.weather_condition && (
                                                                                        <Stack direction="row" alignItems="center" spacing={0.3}>
                                                                                            {weatherIcon(act.weather_condition)}
                                                                                            <Typography sx={{ color: C.faded, fontSize: '0.62rem' }}>
                                                                                                {act.weather_temp != null ? Math.round(act.weather_temp) + '°C' : act.weather_condition}
                                                                                            </Typography>
                                                                                        </Stack>
                                                                                    )}
                                                                                    {segDist != null && (
                                                                                        <Stack direction="row" alignItems="center" spacing={0.2}>
                                                                                            <StraightenIcon sx={{ fontSize: 10, color: C.faded }} />
                                                                                            <Typography sx={{ color: C.faded, fontSize: '0.6rem' }}>~{fmtKm(segDist)}</Typography>
                                                                                        </Stack>
                                                                                    )}
                                                                                    {!hasCoords && (
                                                                                        <Typography sx={{ color: C.faded, fontSize: '0.6rem', fontStyle: 'italic' }}>no coords</Typography>
                                                                                    )}
                                                                                </Stack>
                                                                            </Box>
                                                                        </Stack>
                                                                    );
                                                                })}
                                                            </Stack>
                                                        </Collapse>
                                                    </Box>
                                                );
                                            })}
                                        </>}
                                    </Collapse>
                                </Box>
                            );
                        })}
                    </Stack>
                )}
            </Box>

            {/* Map */}
            <Box sx={{ flex: 1, position: 'relative', height: '100vh' }}>
                <Box ref={mapRef} sx={{ width: '100%', height: '100%' }} />

                {!selected && !loadingList && (
                    <Box sx={{
                        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                        bgcolor: 'rgba(20,22,39,0.88)', borderRadius: 4, px: 5, py: 4, textAlign: 'center',
                        border: `1px solid ${C.border}`, backdropFilter: 'blur(8px)', pointerEvents: 'none',
                    }}>
                        <MapIcon sx={{ fontSize: 48, color: C.brand, mb: 1.5, opacity: 0.7 }} />
                        <Typography variant="h6" fontWeight="bold" sx={{ color: C.heading, mb: 0.5 }}>Select an itinerary</Typography>
                        <Typography variant="body2" sx={{ color: C.faded }}>Pick one from the panel to see<br />your route and destinations on the map</Typography>
                    </Box>
                )}

                {/* Day legend + distances */}
                {detail?.days?.length > 0 && (
                    <Box sx={{ position: 'absolute', top: 16, right: 16, bgcolor: 'rgba(20,22,39,0.88)', borderRadius: 3, px: 2, py: 1.5, border: `1px solid ${C.border}`, backdropFilter: 'blur(6px)', zIndex: 1000, minWidth: 140 }}>
                        <Typography sx={{ color: C.faded, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, mb: 1 }}>Days</Typography>
                        <Stack spacing={0.6}>
                            {detail.days.map((day, idx) => {
                                const color  = DAY_COLORS[idx % DAY_COLORS.length];
                                const distKm = dayDistances[day.id];
                                const rStatus = routingStatus[day.id];
                                return (
                                    <Stack key={day.id} direction="row" alignItems="center" spacing={1}>
                                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
                                        <Typography sx={{ color: C.sub, fontSize: '0.72rem', flex: 1 }}>Day {day.day_number}</Typography>
                                        {rStatus === 'loading'
                                            ? <CircularProgress size={9} sx={{ color }} />
                                            : distKm != null && distKm > 0
                                                ? <Typography sx={{ color, fontSize: '0.65rem', fontWeight: 600 }}>{fmtKm(distKm)}</Typography>
                                                : null}
                                    </Stack>
                                );
                            })}
                            {totalDistKm > 0 && <>
                                <Box sx={{ height: 1, bgcolor: C.border, my: 0.5 }} />
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <StraightenIcon sx={{ fontSize: 11, color: C.brand }} />
                                    <Typography sx={{ color: C.brand, fontSize: '0.72rem', fontWeight: 700, flex: 1 }}>Total</Typography>
                                    <Typography sx={{ color: C.brand, fontSize: '0.7rem', fontWeight: 700 }}>{fmtKm(totalDistKm)}</Typography>
                                </Stack>
                            </>}
                        </Stack>
                    </Box>
                )}

                {/* Itinerary badge */}
                {detail && (
                    <Box sx={{ position: 'absolute', top: 16, left: 16, bgcolor: 'rgba(20,22,39,0.88)', borderRadius: 3, px: 2, py: 1.2, border: `1px solid ${C.border}`, backdropFilter: 'blur(6px)', zIndex: 1000 }}>
                        <Typography sx={{ color: C.brand, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>{detail.destination}</Typography>
                        <Typography sx={{ color: C.heading, fontSize: '0.85rem', fontWeight: 700 }}>{detail.title}</Typography>
                        <Typography sx={{ color: C.faded, fontSize: '0.68rem' }}>{fmtDate(detail.start_date)} – {fmtDate(detail.end_date)}</Typography>
                    </Box>
                )}
            </Box>

            <style>{`
                .leaflet-routing-container { display: none !important; }
                .leaflet-routing-alt { display: none !important; }
            `}</style>
        </Box>

        {/* ── Activity Info / Edit Dialog ──────────────────────────────────── */}
        <Dialog open={editOpen} onClose={() => { setEditOpen(false); setEditMode(false); }} maxWidth="sm" fullWidth
            PaperProps={{ sx: { bgcolor: C.card, borderRadius: 4, overflow: 'hidden' } }}>

            {!editMode ? (
                /* ── INFO VIEW ── */
                <>
                    {/* Photo header */}
                    {editAct?.photo_reference ? (
                        <Box sx={{ width: '100%', height: 200, overflow: 'hidden', position: 'relative' }}>
                            <Box component="img"
                                src={`http://127.0.0.1:8000/places/photo?photo_reference=${editAct.photo_reference}&max_width=600`}
                                alt={editAct.title || editAct.location}
                                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={e => { e.target.style.display = 'none'; }}
                            />
                            <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.7))' }} />
                            <Box sx={{ position: 'absolute', bottom: 12, left: 16, right: 16 }}>
                                <Typography fontWeight={800} sx={{ color: 'white', fontSize: '1.1rem', lineHeight: 1.2 }}>
                                    {editAct?.title || editAct?.location}
                                </Typography>
                                {editAct?.formatted_address && (
                                    <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.72rem', mt: 0.3 }}>
                                        {editAct.formatted_address}
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    ) : (
                        <DialogTitle sx={{ pb: 0.5 }}>
                            <Typography fontWeight={800} sx={{ color: C.heading, fontSize: '1.05rem' }}>
                                {editAct?.title || editAct?.location}
                            </Typography>
                            {editAct?.formatted_address && (
                                <Typography sx={{ color: C.faded, fontSize: '0.75rem', mt: 0.3 }}>
                                    {editAct.formatted_address}
                                </Typography>
                            )}
                        </DialogTitle>
                    )}

                    <DialogContent sx={{ pt: editAct?.photo_reference ? 2 : 1 }}>
                        <Stack spacing={2}>
                            {/* Chips row */}
                            <Stack direction="row" flexWrap="wrap" gap={1}>
                                {editAct?.activity_type && (
                                    <Chip label={editAct.activity_type} size="small" sx={{ bgcolor: `${C.brand}20`, color: C.brand, fontWeight: 600, fontSize: '0.7rem', textTransform: 'capitalize' }} />
                                )}
                                {editAct?.rating && (
                                    <Chip label={`★ ${editAct.rating}`} size="small" sx={{ bgcolor: 'rgba(255,215,0,0.15)', color: '#FFD700', fontWeight: 700, fontSize: '0.7rem' }} />
                                )}
                                {editAct?.place_types && (
                                    <Chip label={editAct.place_types.split(',')[0].replace(/_/g, ' ')} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.06)', color: C.faded, fontSize: '0.68rem', textTransform: 'capitalize' }} />
                                )}
                                {editAct?.start_time && (
                                    <Chip label={editAct.start_time.slice(0, 5)} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.06)', color: C.sub, fontSize: '0.7rem' }} />
                                )}
                            </Stack>

                            {/* Weather */}
                            {editAct?.weather_condition && (
                                <Stack direction="row" alignItems="center" spacing={1} sx={{ bgcolor: `${C.brand}10`, borderRadius: 2, px: 1.5, py: 1 }}>
                                    {editAct.weather_condition.includes('rain') ? <UmbrellaIcon sx={{ fontSize: 18, color: C.brand }} />
                                        : editAct.weather_condition.includes('cloud') ? <CloudIcon sx={{ fontSize: 18, color: C.brand }} />
                                        : editAct.weather_condition.includes('snow') ? <AcUnitIcon sx={{ fontSize: 18, color: C.brand }} />
                                        : <WbSunnyIcon sx={{ fontSize: 18, color: '#FFD700' }} />}
                                    <Typography sx={{ color: C.text, fontSize: '0.82rem', textTransform: 'capitalize' }}>
                                        {editAct.weather_condition}
                                        {editAct.weather_temp != null && ` · ${Math.round(editAct.weather_temp)}°C`}
                                    </Typography>
                                </Stack>
                            )}

                            {/* Cost summary */}
                            {(editAct?.cost > 0 || editAct?.actual_cost > 0) && (
                                <Stack direction="row" spacing={2}>
                                    {editAct.cost > 0 && (
                                        <Box sx={{ flex: 1, bgcolor: 'rgba(255,183,77,0.1)', borderRadius: 2, px: 2, py: 1.2, textAlign: 'center' }}>
                                            <Typography sx={{ color: C.faded, fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: 0.8 }}>Estimated</Typography>
                                            <Typography fontWeight={700} sx={{ color: '#ffb74d', fontSize: '0.95rem' }}>NPR {editAct.cost.toLocaleString()}</Typography>
                                        </Box>
                                    )}
                                    {editAct.actual_cost > 0 && (
                                        <Box sx={{ flex: 1, bgcolor: `${C.brand}10`, borderRadius: 2, px: 2, py: 1.2, textAlign: 'center' }}>
                                            <Typography sx={{ color: C.faded, fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: 0.8 }}>Actual</Typography>
                                            <Typography fontWeight={700} sx={{ color: C.brand, fontSize: '0.95rem' }}>NPR {editAct.actual_cost.toLocaleString()}</Typography>
                                        </Box>
                                    )}
                                </Stack>
                            )}

                            {/* Description */}
                            {editAct?.description && (
                                <Typography sx={{ color: C.faded, fontSize: '0.82rem', lineHeight: 1.7 }}>
                                    {editAct.description}
                                </Typography>
                            )}
                        </Stack>
                    </DialogContent>

                    <DialogActions sx={{ px: 3, pb: 2.5 }}>
                        <Button onClick={() => { setEditOpen(false); setEditMode(false); }} sx={{ color: C.faded }}>Close</Button>
                        <Button onClick={() => setEditMode(true)} variant="contained" startIcon={<EditIcon sx={{ fontSize: 16 }} />}
                            sx={{ bgcolor: C.brand, color: C.bg, fontWeight: 'bold', borderRadius: 3, px: 3, '&:hover': { bgcolor: '#2db8b8' } }}>
                            Edit
                        </Button>
                    </DialogActions>
                </>
            ) : (
                /* ── EDIT VIEW ── */
                <>
                    <DialogTitle sx={{ pb: 1 }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <EditIcon sx={{ color: C.brand, fontSize: 18 }} />
                            <Typography fontWeight={800} sx={{ color: C.heading }}>Edit Activity</Typography>
                        </Stack>
                        <Typography variant="caption" sx={{ color: C.faded, display: 'block', mt: 0.3 }}>
                            {editAct?.title || editAct?.location}
                        </Typography>
                    </DialogTitle>

                    <DialogContent>
                        <Stack spacing={2.5} sx={{ mt: 1 }}>
                            <Box>
                                <PlaceSearchAutocomplete
                                    label="Location / Place"
                                    value={editForm.location || ''}
                                    onChange={(text) => setEditForm(f => ({ ...f, location: text, title: text, place_id: null, latitude: null, longitude: null, formatted_address: null, place_types: null, rating: null }))}
                                    onSelect={(place) => setEditForm(f => ({
                                        ...f,
                                        location: place.name, title: place.name,
                                        place_id: place.google_place_id,
                                        latitude: place.latitude, longitude: place.longitude,
                                        formatted_address: place.address,
                                        place_types: Array.isArray(place.place_types) ? place.place_types.join(',') : place.place_types || null,
                                        rating: place.rating || null,
                                        photo_reference: place.photo_reference || null,
                                    }))}
                                />
                                {editForm.place_id && (
                                    <Typography variant="caption" sx={{ color: C.faded, fontSize: '0.7rem', mt: 0.5, display: 'block', ml: 0.5 }}>
                                        {editForm.formatted_address}
                                    </Typography>
                                )}
                            </Box>

                            <Stack direction="row" spacing={2}>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="caption" sx={{ color: C.faded, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.75 }}>Type</Typography>
                                    <Select fullWidth size="small" value={editForm.activity_type || 'sightseeing'}
                                        onChange={e => setEditForm(f => ({ ...f, activity_type: e.target.value }))}
                                        sx={{ bgcolor: C.bg, color: C.text, borderRadius: 2, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: C.brand }, '& .MuiSelect-icon': { color: C.faded } }}
                                        MenuProps={{ PaperProps: { sx: { bgcolor: C.card, color: C.text } } }}>
                                        {['sightseeing','dining','adventure','relaxation','shopping','transport','activity'].map(t => (
                                            <MenuItem key={t} value={t} sx={{ textTransform: 'capitalize', '&:hover': { bgcolor: `${C.brand}20` } }}>{t}</MenuItem>
                                        ))}
                                    </Select>
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="caption" sx={{ color: C.faded, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.75 }}>Start Time</Typography>
                                    <TextField size="small" fullWidth type="time" value={editForm.start_time || ''}
                                        onChange={e => setEditForm(f => ({ ...f, start_time: e.target.value }))}
                                        sx={{ '& .MuiOutlinedInput-root': { bgcolor: C.bg, borderRadius: 2, color: C.text, '& fieldset': { borderColor: 'transparent' }, '&:hover fieldset': { borderColor: C.brand }, '&.Mui-focused fieldset': { borderColor: C.brand } } }} />
                                </Box>
                            </Stack>

                            <Stack direction="row" spacing={2}>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="caption" sx={{ color: C.faded, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.75 }}>Estimated Cost</Typography>
                                    <TextField size="small" fullWidth type="number" placeholder="0"
                                        value={editForm.cost ?? 0}
                                        onChange={e => setEditForm(f => ({ ...f, cost: e.target.value }))}
                                        sx={{ '& .MuiOutlinedInput-root': { bgcolor: C.bg, borderRadius: 2, color: '#ffb74d', fontWeight: 700, '& fieldset': { borderColor: 'transparent' }, '&:hover fieldset': { borderColor: '#ffb74d' }, '&.Mui-focused fieldset': { borderColor: '#ffb74d' } } }} />
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="caption" sx={{ color: C.faded, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.75 }}>Actual Cost</Typography>
                                    <TextField size="small" fullWidth type="number" placeholder="0"
                                        value={editForm.actual_cost ?? 0}
                                        onChange={e => setEditForm(f => ({ ...f, actual_cost: e.target.value }))}
                                        sx={{ '& .MuiOutlinedInput-root': { bgcolor: C.bg, borderRadius: 2, color: C.brand, fontWeight: 700, '& fieldset': { borderColor: 'transparent' }, '&:hover fieldset': { borderColor: C.brand }, '&.Mui-focused fieldset': { borderColor: C.brand } } }} />
                                </Box>
                            </Stack>

                            <Box>
                                <Typography variant="caption" sx={{ color: C.faded, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.75 }}>Description</Typography>
                                <TextField fullWidth multiline rows={2} placeholder="Notes about this stop..."
                                    value={editForm.description || ''}
                                    onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: C.bg, borderRadius: 2, color: C.text, '& fieldset': { borderColor: 'transparent' }, '&:hover fieldset': { borderColor: C.brand }, '&.Mui-focused fieldset': { borderColor: C.brand } }, '& .MuiInputBase-input::placeholder': { color: C.faded, opacity: 1 } }} />
                            </Box>
                        </Stack>
                    </DialogContent>

                    <DialogActions sx={{ px: 3, pb: 2.5 }}>
                        <Button onClick={() => setEditMode(false)} sx={{ color: C.faded }}>Back</Button>
                        <Button onClick={saveEdit} disabled={editBusy} variant="contained"
                            sx={{ bgcolor: C.brand, color: C.bg, fontWeight: 'bold', borderRadius: 3, px: 3, '&:hover': { bgcolor: '#2db8b8' } }}>
                            {editBusy ? <CircularProgress size={18} sx={{ color: C.bg }} /> : 'Save & Redraw'}
                        </Button>
                    </DialogActions>
                </>
            )}
        </Dialog>

        {/* Snackbar */}
        <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(p => ({ ...p, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
            <Alert severity={snack.sev} onClose={() => setSnack(p => ({ ...p, open: false }))} sx={{ bgcolor: C.card, color: C.text, borderRadius: 3 }}>
                {snack.msg}
            </Alert>
        </Snackbar>
    </>
    );
}