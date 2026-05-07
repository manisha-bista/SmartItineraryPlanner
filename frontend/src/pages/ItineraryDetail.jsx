import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Stack, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, CircularProgress, Alert, Snackbar,
    Collapse, Chip, Select, MenuItem,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import Navbar, { DRAWER_WIDTH } from '../components/Navbar';
import PlaceSearchAutocomplete from '../components/PlaceSearchAutocomplete';

import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import DragIndicatorIcon      from '@mui/icons-material/DragIndicator';
import ArrowBackIcon          from '@mui/icons-material/ArrowBack';
import EditIcon               from '@mui/icons-material/Edit';
import DeleteIcon             from '@mui/icons-material/Delete';
import AddIcon                from '@mui/icons-material/Add';
import LocationOnIcon         from '@mui/icons-material/LocationOn';
import CalendarTodayIcon      from '@mui/icons-material/CalendarToday';
import RestaurantIcon         from '@mui/icons-material/Restaurant';
import HikingIcon             from '@mui/icons-material/Hiking';
import MuseumIcon             from '@mui/icons-material/Museum';
import LocalActivityIcon      from '@mui/icons-material/LocalActivity';
import ShoppingBagIcon        from '@mui/icons-material/ShoppingBag';
import DirectionsBusIcon      from '@mui/icons-material/DirectionsBus';
import SpaIcon                from '@mui/icons-material/Spa';
import KeyboardArrowDownIcon  from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import WbSunnyIcon            from '@mui/icons-material/WbSunny';
import CloudIcon              from '@mui/icons-material/Cloud';
import WaterDropIcon          from '@mui/icons-material/WaterDrop';
import AirIcon                from '@mui/icons-material/Air';
import UmbrellaIcon           from '@mui/icons-material/Umbrella';
import AcUnitIcon             from '@mui/icons-material/AcUnit';
import ThunderstormIcon       from '@mui/icons-material/Thunderstorm';
import DeviceThermostatIcon   from '@mui/icons-material/DeviceThermostat';
import ShareIcon              from '@mui/icons-material/Share';
import SendIcon               from '@mui/icons-material/Send';
import GroupIcon              from '@mui/icons-material/Group';
import PersonAddIcon          from '@mui/icons-material/PersonAdd';
import ContentCopyIcon        from '@mui/icons-material/ContentCopy';
import ForumIcon              from '@mui/icons-material/Forum';
import CheckCircleIcon        from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon     from '@mui/icons-material/HourglassEmpty';

// ── Activity type meta ────────────────────────────────────────────────────────
const ACT_META = {
    sightseeing: { icon: <MuseumIcon       sx={{ fontSize: 22 }} />, bg: 'rgba(51,204,204,0.2)',  color: '#33CCCC' },
    dining:      { icon: <RestaurantIcon   sx={{ fontSize: 22 }} />, bg: 'rgba(255,183,77,0.2)', color: '#ffb74d' },
    adventure:   { icon: <HikingIcon       sx={{ fontSize: 22 }} />, bg: 'rgba(102,187,106,0.2)',color: '#66bb6a' },
    relaxation:  { icon: <SpaIcon          sx={{ fontSize: 22 }} />, bg: 'rgba(38,166,154,0.2)', color: '#26a69a' },
    shopping:    { icon: <ShoppingBagIcon  sx={{ fontSize: 22 }} />, bg: 'rgba(255,112,67,0.2)', color: '#ff7043' },
    transport:   { icon: <DirectionsBusIcon sx={{ fontSize: 22 }} />, bg: 'rgba(66,165,245,0.2)',color: '#42a5f5' },
    activity:    { icon: <LocalActivityIcon sx={{ fontSize: 22 }} />, bg: 'rgba(171,71,188,0.2)',color: '#ab47bc' },
};
const actMeta = (type) => ACT_META[type] || ACT_META.activity;

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate     = (s) => { if (!s) return ''; return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); };
const fmtDateFull = (s) => { if (!s) return ''; return new Date(s).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }); };
const fmtTime = (t) => {
    if (!t) return '';
    const [h, m] = t.slice(0, 5).split(':').map(Number);
    return `${String(h % 12 || 12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};
const fmtNum = (n) => Number(n || 0).toLocaleString('en-IN');

const actWeatherIcon = (condition) => {
    const c = (condition || '').toLowerCase();
    if (c.includes('thunder') || c.includes('storm'))                         return { icon: <ThunderstormIcon sx={{ fontSize: 13 }} />, color: '#FFB74D' };
    if (c.includes('snow') || c.includes('sleet') || c.includes('ice'))      return { icon: <AcUnitIcon        sx={{ fontSize: 13 }} />, color: '#90CAF9' };
    if (c.includes('rain') || c.includes('drizzle') || c.includes('shower')) return { icon: <UmbrellaIcon      sx={{ fontSize: 13 }} />, color: '#64B5F6' };
    if (c.includes('cloud') || c.includes('overcast') || c.includes('mist') || c.includes('fog') || c.includes('haze'))
                                                                               return { icon: <CloudIcon         sx={{ fontSize: 13 }} />, color: '#90A4AE' };
    return { icon: <WbSunnyIcon sx={{ fontSize: 13 }} />, color: '#FFD54F' };
};

// ═════════════════════════════════════════════════════════════════════════════
export default function ItineraryDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { COLORS } = useTheme();

    // alias to C so the rest of the JSX stays compact
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
        icons:   COLORS.icons,
        red:     '#ff6b6b',
        yellow:  '#ffb74d',
    };

    const [itinerary, setItinerary] = useState(null);
    const [loading, setLoading]     = useState(true);
    const [snack, setSnack]         = useState({ open: false, msg: '', sev: 'success' });
    const [collapsed, setCollapsed] = useState({});

    const [dayOpen, setDayOpen] = useState(false);
    const [editDay, setEditDay] = useState(null);
    const [dayForm, setDayForm] = useState({ day_number: 1, date: '', title: '', description: '', estimated_cost: 0 });
    const [dayErr,  setDayErr]  = useState({});
    const [dayBusy, setDayBusy] = useState(false);

    const [actOpen,  setActOpen]  = useState(false);
    const [actDayId, setActDayId] = useState(null);
    const [editAct,  setEditAct]  = useState(null);
    const [actForm,  setActForm]  = useState({ title: '', description: '', location: '', start_time: '', end_time: '', activity_type: 'sightseeing', cost: 0, actual_cost: 0 });
    const [actErr,  setActErr]    = useState({});
    const [actBusy, setActBusy]   = useState(false);

    const [delOpen,   setDelOpen]   = useState(false);
    const [delTarget, setDelTarget] = useState(null);
    const [inlineActual, setInlineActual] = useState({});
    const [alerts, setAlerts]       = useState([]);
    const [weatherLoading, setWeatherLoading] = useState(false);

    const [shareOpen, setShareOpen]       = useState(false);
    const [shareTab, setShareTab]         = useState('chat'); // 'chat' | 'community'
    const [friends, setFriends]           = useState([]);
    const [friendsLoading, setFriendsLoading] = useState(false);
    const [sharing, setSharing]           = useState(null);
    const [communitySharing, setCommunitySharing] = useState(false);
    const [feedTitle, setFeedTitle]       = useState('');
    const [feedBody, setFeedBody]         = useState('');
    const [feedPlaces, setFeedPlaces]     = useState([]);

    const [collabOpen, setCollabOpen]     = useState(false);
    const [collaborators, setCollaborators] = useState([]);
    const [collabsLoading, setCollabsLoading] = useState(false);
    const [inviteUsername, setInviteUsername] = useState('');
    const [inviting, setInviting]         = useState(false);
    const [inviteErr, setInviteErr]       = useState('');
    const [collabFriends, setCollabFriends]   = useState([]);
    const [collabFriendsLoading, setCollabFriendsLoading] = useState(false);
    const [collabSearch, setCollabSearch]     = useState('');
    const [inviteSuccess, setInviteSuccess]   = useState('');
    const [forking, setForking]           = useState(false);
    const [titleEditing, setTitleEditing] = useState(false);
    const [titleDraft,   setTitleDraft]   = useState('');
    const [dateEditing, setDateEditing] = useState(false);
    const [dateDraft,   setDateDraft]   = useState('');
    const [isAcceptedCollaborator, setIsAcceptedCollaborator] = useState(false);

    const [timePromptOpen, setTimePromptOpen] = useState(false);
    const [pendingDrop, setPendingDrop]       = useState(null);
    const [dropTime, setDropTime]             = useState('');

    const currentUserId = parseInt(localStorage.getItem('userId'));
    const isOwner       = itinerary?.user_id === currentUserId;
    const canEdit       = isOwner || isAcceptedCollaborator;

    // ── Fetch ─────────────────────────────────────────────────────────────────
    const load = async () => {
        try {
            setLoading(true);
            const uid = parseInt(localStorage.getItem('userId'));
            const r = await axios.get(`http://127.0.0.1:8000/itineraries/${id}`);
            setItinerary(r.data);
            checkAndUpdateStatus(r.data);
            if (r.data.user_id !== uid) {
                try {
                    const collabs = await axios.get(`http://127.0.0.1:8000/itineraries/${id}/collaborators`);
                    const me = (collabs.data || []).find(c => c.user_id === uid && c.status === 'accepted');
                    setIsAcceptedCollaborator(!!me);
                } catch { /* silent */ }
            }
        } catch { toast('Failed to load itinerary.', 'error'); }
        finally { setLoading(false); }
    };
    // Silent refresh used after mutations — no full-page spinner
    const reload = async () => {
        try {
            const r = await axios.get(`http://127.0.0.1:8000/itineraries/${id}`);
            setItinerary(r.data);
            checkAndUpdateStatus(r.data);
        } catch { /* non-critical */ }
    };
    useEffect(() => { load(); }, [id]);

    const checkAndUpdateStatus = async (itin) => {
        if (!itin?.days?.length) return;
        if (['ongoing', 'completed', 'cancelled'].includes(itin.status)) return;
        const allDaysFilled = itin.days.every(day => day.activities?.length > 0 && day.activities.every(act => act.location?.trim()));
        const newStatus = allDaysFilled ? 'confirmed' : 'planning';
        if (itin.status !== newStatus) {
            try {
                await axios.put(`http://127.0.0.1:8000/itineraries/${itin.id}`, { status: newStatus });
                setItinerary(prev => prev ? { ...prev, status: newStatus } : prev);
            } catch { /* non-critical */ }
        }
    };

    const fetchWeather = async () => {
        if (!itinerary) return;
        setWeatherLoading(true);
        try {
            const userId = localStorage.getItem('userId');
            await axios.post(`http://127.0.0.1:8000/itineraries/${itinerary.id}/fetch-weather?user_id=${userId}`);
            await reload(); toast('Weather updated!');
        } catch (e) { toast(e.response?.data?.detail || 'Failed to fetch weather.', 'error'); }
        finally { setWeatherLoading(false); }
    };

    const openShare = async () => {
        if (itinerary) {
            // Pre-populate feed form
            const ps = new Set();
            if (itinerary.destination) ps.add(itinerary.destination);
            (itinerary.days || []).forEach(day =>
                (day.activities || []).forEach(act => { if (act.location) ps.add(act.location); })
            );
            setFeedPlaces([...ps]);
            setFeedTitle(`Check out my itinerary: ${itinerary.title}`);
            setFeedBody(`A ${itinerary.days?.length || 0}-day trip to ${itinerary.destination}`);
        }
        setShareOpen(true); setShareTab('chat'); setFriendsLoading(true);
        try {
            const userId = localStorage.getItem('userId');
            const res = await axios.get(`http://127.0.0.1:8000/friends/${userId}`);
            setFriends(res.data?.friends || []);
        } catch { setFriends([]); }
        finally { setFriendsLoading(false); }
    };

    const shareToCommunity = async () => {
        if (!itinerary || !feedTitle.trim()) return;
        setCommunitySharing(true);
        try {
            const userId = localStorage.getItem('userId');
            const payload = {
                title: feedTitle.trim(),
                body: feedBody.trim() || null,
                image_url: null,
                tag: 'Experience',
                place: (feedPlaces.join(', ') || itinerary.destination || 'Nepal').substring(0, 200),
                shared_itinerary_id: itinerary.id,
            };
            await axios.post(`http://127.0.0.1:8000/community/posts?user_id=${userId}`, payload);
            setShareOpen(false); toast('Shared to community feed!');
        } catch (err) { 
            const errorMsg = err.response?.data?.detail || err.message || 'Unknown error';
            toast(`Failed to share: ${errorMsg}`, 'error'); 
        }
        finally { setCommunitySharing(false); }
    };

    const openCollaborators = async () => {
        setCollabOpen(true); setCollabsLoading(true); setInviteErr(''); setCollabSearch('');
        const userId = localStorage.getItem('userId');
        try {
            const [collabRes, friendsRes] = await Promise.allSettled([
                axios.get(`http://127.0.0.1:8000/itineraries/${id}/collaborators`),
                axios.get(`http://127.0.0.1:8000/friends/${userId}`),
            ]);
            setCollaborators(collabRes.status === 'fulfilled' ? collabRes.value.data || [] : []);
            setCollabFriends(friendsRes.status === 'fulfilled' ? friendsRes.value.data?.friends || [] : []);
        } catch { setCollaborators([]); }
        finally { setCollabsLoading(false); }
    };

    const inviteCollaborator = async (usernameOverride) => {
        const raw = (usernameOverride || inviteUsername).trim().replace(/^@/, '');
        if (!raw) return;
        setInviting(true); setInviteErr(''); setInviteSuccess('');
        try {
            const userId = localStorage.getItem('userId');
            await axios.post(`http://127.0.0.1:8000/itineraries/${id}/collaborators?user_id=${userId}`, { username: raw });
            if (!usernameOverride) setInviteUsername('');
            setCollabSearch('');
            setInviteSuccess(`Invite sent to @${raw}!`);
            setTimeout(() => setInviteSuccess(''), 3000);
            const res = await axios.get(`http://127.0.0.1:8000/itineraries/${id}/collaborators`);
            setCollaborators(res.data || []);
        } catch (e) {
            const detail = e.response?.data?.detail;
            const msg = Array.isArray(detail)
                ? detail.map(d => d.msg || d.message || JSON.stringify(d)).join(', ')
                : (typeof detail === 'string' ? detail : 'Failed to invite.');
            setInviteErr(msg);
        }
        finally { setInviting(false); }
    };

    const removeCollaborator = async (collabUserId) => {
        try {
            const uid = localStorage.getItem('userId');
            await axios.delete(`http://127.0.0.1:8000/itineraries/${id}/collaborators/${collabUserId}?user_id=${uid}`);
            setCollaborators(prev => prev.filter(c => c.user_id !== collabUserId));
            toast('Collaborator removed.');
        } catch { toast('Failed to remove.', 'error'); }
    };

    const forkItinerary = async () => {
        setForking(true);
        try {
            const userId = localStorage.getItem('userId');
            const res = await axios.post(`http://127.0.0.1:8000/itineraries/${id}/fork?user_id=${userId}`);
            toast('Itinerary forked! Opening your copy...');
            setTimeout(() => { window.location.href = `/itinerary/${res.data.id}`; }, 1200);
        } catch (e) { toast(e.response?.data?.detail || 'Failed to fork.', 'error'); setForking(false); }
    };

    const shareToFriend = async (friendId) => {
        if (!itinerary) return;
        setSharing(friendId);
        try {
            const userId = localStorage.getItem('userId');
            await axios.post(`http://127.0.0.1:8000/messages?user_id=${userId}`, {
                receiver_id: friendId,
                content: `Check out my itinerary: "${itinerary.title}"`,
                shared_itinerary_id: itinerary.id,
            });
            setShareOpen(false); toast('Itinerary shared!');
        } catch { toast('Failed to share.', 'error'); }
        finally { setSharing(null); }
    };

    useEffect(() => {
        if (!itinerary) return;
        const fetchAlerts = async () => {
            try {
                const locations = new Set();
                (itinerary.days || []).forEach(day => (day.activities || []).forEach(act => {
                    if (act.location) locations.add(act.location);
                    if (act.formatted_address) { const parts = act.formatted_address.split(','); if (parts.length >= 2) locations.add(parts[parts.length - 2].trim()); }
                }));
                if (itinerary.destination) locations.add(itinerary.destination);
                const allAlerts = []; const seen = new Set();
                for (const loc of locations) {
                    try {
                        const res = await axios.get('http://127.0.0.1:8000/community-updates', { params: { location: loc, active_only: true } });
                        (res.data || []).forEach(a => { if (!seen.has(a.id)) { seen.add(a.id); allAlerts.push(a); } });
                    } catch { /* skip */ }
                }
                setAlerts(allAlerts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
            } catch { /* ignore */ }
        };
        fetchAlerts();
    }, [itinerary]);

    const toast = (msg, sev = 'success') => setSnack({ open: true, msg, sev });

    // ── Day CRUD ──────────────────────────────────────────────────────────────
    const openAddDay = () => {
        const n = (itinerary?.days?.length || 0) + 1;
        const d = new Date(itinerary?.start_date || new Date());
        d.setDate(d.getDate() + n - 1);
        setEditDay(null);
        setDayForm({ day_number: n, date: d.toISOString().split('T')[0], title: '', description: '', estimated_cost: 0 });
        setDayErr({}); setDayOpen(true);
    };

    const openEditDay = (day) => {
        setEditDay(day);
        setDayForm({ day_number: day.day_number, date: day.date, title: day.title || '', description: day.description || '', estimated_cost: day.estimated_cost || 0 });
        setDayErr({}); setDayOpen(true);
    };

    const saveDay = async () => {
        const errs = {};
        if (!dayForm.date) errs.date = 'Required';
        if (!dayForm.title?.trim()) errs.title = 'Required';
        setDayErr(errs);
        if (Object.keys(errs).length) return;
        setDayBusy(true);
        try {
            const payload = { day_number: dayForm.day_number, date: dayForm.date, title: dayForm.title.trim(), description: dayForm.description.trim(), estimated_cost: parseFloat(dayForm.estimated_cost) || 0, actual_cost: editDay?.actual_cost || 0, itinerary_id: parseInt(id), activities: [] };
            if (editDay) { await axios.put(`http://127.0.0.1:8000/itinerary-days/${editDay.id}`, payload); toast('Day updated!'); }
            else         { await axios.post('http://127.0.0.1:8000/itinerary-days', payload); toast('Day added!'); }
            await reload(); setDayOpen(false);
        } catch (e) { toast(e.response?.data?.detail || 'Failed.', 'error'); }
        finally { setDayBusy(false); }
    };

    const deleteDay = async (day) => {
        try { await axios.delete(`http://127.0.0.1:8000/itinerary-days/${day.id}`); toast('Day deleted.'); await reload(); }
        catch { toast('Failed to delete day.', 'error'); }
        setDelOpen(false); setDelTarget(null);
    };

    // ── Activity CRUD ─────────────────────────────────────────────────────────
    const openAddAct = (dayId) => {
        setActDayId(dayId); setEditAct(null);
        setActForm({ title: '', description: '', location: '', start_time: '', end_time: '', activity_type: 'sightseeing', cost: 0, actual_cost: 0, place_id: null, latitude: null, longitude: null, formatted_address: null, place_types: null, rating: null });
        setActErr({}); setActOpen(true);
    };

    const openEditAct = (act, dayId) => {
        setActDayId(dayId); setEditAct(act);
        setActForm({ title: act.title || '', description: act.description || '', location: act.location || '', start_time: act.start_time || '', end_time: act.end_time || '', activity_type: act.activity_type || 'sightseeing', cost: act.cost || 0, actual_cost: act.actual_cost || 0, place_id: act.place_id || null, latitude: act.latitude || null, longitude: act.longitude || null, formatted_address: act.formatted_address || null, place_types: act.place_types || null, rating: act.rating || null });
        setActErr({}); setActOpen(true);
    };

    const saveAct = async () => {
        const errs = {};
        if (!actForm.location?.trim()) errs.location = 'Required';
        setActErr(errs);
        if (Object.keys(errs).length) return;
        setActBusy(true);
        try {
            const payload = { title: actForm.title?.trim() || actForm.location.trim(), description: actForm.description.trim(), location: actForm.location.trim(), formatted_address: actForm.formatted_address || null, latitude: actForm.latitude || null, longitude: actForm.longitude || null, place_id: actForm.place_id || null, place_types: actForm.place_types || null, rating: actForm.rating || null, start_time: actForm.start_time || null, end_time: actForm.end_time || null, activity_type: actForm.activity_type || 'sightseeing', cost: parseFloat(actForm.cost) || 0, actual_cost: parseFloat(actForm.actual_cost) || 0, is_completed: editAct?.is_completed || false, day_id: actDayId };
            if (editAct) { await axios.put(`http://127.0.0.1:8000/activities/${editAct.id}`, payload); toast('Activity updated!'); }
            else         { await axios.post('http://127.0.0.1:8000/activities', payload); toast('Activity added!'); }
            await reload(); setActOpen(false);
        } catch (e) { toast(e.response?.data?.detail || 'Failed.', 'error'); }
        finally { setActBusy(false); }
    };

    const deleteAct = async (act) => {
        try { await axios.delete(`http://127.0.0.1:8000/activities/${act.id}`); toast('Activity deleted.'); await reload(); }
        catch { toast('Failed to delete.', 'error'); }
        setDelOpen(false); setDelTarget(null);
    };

    const onDragEnd = (result) => {
        if (!canEdit) return;
        const { source, destination, draggableId } = result;
        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;
        const srcDayId = parseInt(source.droppableId.replace('day-', ''));
        const dstDayId = parseInt(destination.droppableId.replace('day-', ''));
        const actId    = parseInt(draggableId.replace('act-', ''));
        const srcDay   = itinerary.days.find(d => d.id === srcDayId);
        const act      = srcDay?.activities?.find(a => a.id === actId);
        if (!act) return;
        const oldItinerary = JSON.parse(JSON.stringify(itinerary));
        const newDays = itinerary.days.map(day => {
            if (day.id === srcDayId && day.id === dstDayId) {
                const acts = [...day.activities];
                acts.splice(source.index, 1);
                acts.splice(destination.index, 0, act);
                return { ...day, activities: acts.map((a, i) => ({ ...a, display_order: i })) };
            } else if (day.id === srcDayId) {
                return { ...day, activities: day.activities.filter(a => a.id !== actId).map((a, i) => ({ ...a, display_order: i })) };
            } else if (day.id === dstDayId) {
                const acts = [...day.activities];
                acts.splice(destination.index, 0, { ...act, day_id: dstDayId });
                return { ...day, activities: acts.map((a, i) => ({ ...a, display_order: i })) };
            }
            return day;
        });
        setItinerary({ ...itinerary, days: newDays });
        setPendingDrop({ actId, srcDayId, dstDayId, oldItinerary });
        setDropTime(act.start_time?.slice(0, 5) || '');
        setTimePromptOpen(true);
    };

    const confirmDrop = async () => {
        if (!pendingDrop) return;
        const { actId, srcDayId, dstDayId } = pendingDrop;
        const dstDay   = itinerary.days.find(d => d.id === dstDayId);
        const newOrder = dstDay?.activities?.findIndex(a => a.id === actId) ?? 0;
        try {
            const payload = { start_time: dropTime || null, display_order: newOrder };
            if (srcDayId !== dstDayId) payload.day_id = dstDayId;
            await axios.put(`http://127.0.0.1:8000/activities/${actId}`, payload);
            toast('Activity moved!');
            await reload();
        } catch {
            setItinerary(pendingDrop.oldItinerary);
            toast('Failed to move activity.', 'error');
        }
        setTimePromptOpen(false); setPendingDrop(null); setDropTime('');
    };

    const cancelDrop = () => {
        if (pendingDrop?.oldItinerary) setItinerary(pendingDrop.oldItinerary);
        setTimePromptOpen(false); setPendingDrop(null); setDropTime('');
    };

    const saveInlineActual = async (act) => {
        const raw = inlineActual[act.id];
        if (raw === undefined) return;
        const value = parseFloat(raw) || 0;
        if (value === (act.actual_cost || 0)) return;
        try { await axios.put(`http://127.0.0.1:8000/activities/${act.id}`, { actual_cost: value }); await reload(); }
        catch { toast('Failed to save actual cost.', 'error'); }
    };

    // input style — built dynamically so it uses live C values
    const inputSx = {
        '& .MuiOutlinedInput-root': { bgcolor: C.bg, borderRadius: 3, color: C.text, '& fieldset': { borderColor: 'transparent' }, '&:hover fieldset': { borderColor: C.brand }, '&.Mui-focused fieldset': { borderColor: C.brand } },
        '& .MuiInputLabel-root': { color: C.faded },
        '& .MuiInputLabel-root.Mui-focused': { color: C.brand },
        '& .MuiFormHelperText-root': { color: C.faded },
        '& .MuiSelect-icon': { color: C.faded },
    };

    const selectMenuSx = { PaperProps: { sx: { bgcolor: C.card, color: C.text, maxHeight: 260, '& .MuiMenuItem-root': { fontSize: '0.9rem', py: 0.75 }, '& .MuiMenuItem-root:hover': { bgcolor: `${C.brand}1A` }, '& .MuiMenuItem-root.Mui-selected': { bgcolor: `${C.brand}2E`, color: C.brand } } } };

    // ── Loading / Error ───────────────────────────────────────────────────────
    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', width: '100vw', bgcolor: C.bg, position: 'fixed', top: 0, left: 0 }}>
            <CircularProgress sx={{ color: C.brand }} />
        </Box>
    );
    if (!itinerary) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', width: '100vw', bgcolor: C.bg, position: 'fixed', top: 0, left: 0 }}>
            <Alert severity="error" sx={{ bgcolor: C.card, color: C.text }}>Itinerary not found.</Alert>
        </Box>
    );

    // ── Derived totals ────────────────────────────────────────────────────────
    const totalDest   = itinerary.days?.reduce((s, d) => s + (d.activities?.length || 0), 0) || 0;
    const totalEst    = itinerary.days?.reduce((s, d) => s + (d.activities?.reduce((a, ac) => a + (ac.cost || 0), 0) || 0), 0) || 0;
    const totalActual = itinerary.days?.reduce((s, d) => s + (d.activities?.reduce((a, ac) => a + (ac.actual_cost || 0), 0) || 0), 0) || 0;

    return (
        <Box sx={{ display: 'flex', bgcolor: C.bg, minHeight: '100vh', width: '100vw', position: 'fixed', top: 0, left: 0, overflow: 'hidden' }}>

            <Navbar />

            {/* ── Main Content ──────────────────────────────────────────────── */}
            <Box component="main" sx={{ flexGrow: 1, height: '100vh', overflow: 'auto', p: 3 }}>

                {/* Back */}
                <Box sx={{ mb: 2.5 }}>
                    <IconButton onClick={() => navigate(-1)}
                        sx={{ bgcolor: C.card, color: C.icons, borderRadius: 2, '&:hover': { bgcolor: C.surface, color: C.brand } }}>
                        <ArrowBackIcon />
                    </IconButton>
                </Box>

                {/* ── Header Strip ─────────────────────────────────────────── */}
                <Box sx={{ bgcolor: C.card, borderRadius: 4, px: 3, py: 2, mb: 3, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 3 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <KeyboardArrowDownIcon sx={{ color: C.brand }} />
                        {titleEditing ? (
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <TextField
                                    size="small"
                                    value={titleDraft}
                                    onChange={e => setTitleDraft(e.target.value)}
                                    onKeyDown={async (e) => {
                                        if (e.key === 'Enter') {
                                            const t = titleDraft.trim();
                                            if (t && t !== itinerary.title) {
                                                await axios.put(`http://127.0.0.1:8000/itineraries/${id}`, { title: t });
                                                await reload();
                                                toast('Title updated!');
                                            }
                                            setTitleEditing(false);
                                        }
                                        if (e.key === 'Escape') setTitleEditing(false);
                                    }}
                                    autoFocus
                                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: C.surface, borderRadius: 2, color: C.heading, fontWeight: 'bold', fontSize: '1.1rem', '& fieldset': { borderColor: C.brand }, '&:hover fieldset': { borderColor: C.brand } }, '& .MuiInputBase-input': { color: C.heading, fontWeight: 'bold', py: 0.75, px: 1.5 } }}
                                />
                                <Button size="small" onClick={async () => {
                                    const t = titleDraft.trim();
                                    if (t && t !== itinerary.title) {
                                        await axios.put(`http://127.0.0.1:8000/itineraries/${id}`, { title: t });
                                        await reload();
                                        toast('Title updated!');
                                    }
                                    setTitleEditing(false);
                                }} sx={{ bgcolor: C.brand, color: C.bg, borderRadius: 2, fontWeight: 'bold', px: 2, textTransform: 'none', fontSize: '0.78rem', '&:hover': { bgcolor: '#2db8b8' } }}>Save</Button>
                                <Button size="small" onClick={() => setTitleEditing(false)} sx={{ color: C.faded, borderRadius: 2, textTransform: 'none', fontSize: '0.78rem' }}>Cancel</Button>
                            </Stack>
                        ) : (
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                                <Typography variant="h6" fontWeight="bold" sx={{ color: C.heading }}>{itinerary.title}</Typography>
                                {(isOwner || isAcceptedCollaborator) && (
                                    <IconButton size="small" onClick={() => { setTitleDraft(itinerary.title); setTitleEditing(true); }}
                                        sx={{ color: C.faded, p: 0.4, '&:hover': { color: C.brand, bgcolor: `${C.brand}14` } }}>
                                        <EditIcon sx={{ fontSize: 15 }} />
                                    </IconButton>
                                )}
                            </Stack>
                        )}
                    </Stack>

                    <Stack direction="row" alignItems="center" spacing={0.75}>
                        <CalendarTodayIcon sx={{ fontSize: '0.95rem', color: C.faded }} />
                        {dateEditing ? (
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <TextField
                                    size="small"
                                    type="date"
                                    value={dateDraft}
                                    onChange={e => setDateDraft(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: C.surface, borderRadius: 2, color: C.text, fontSize: '0.82rem', '& fieldset': { borderColor: C.brand }, '&:hover fieldset': { borderColor: C.brand } }, '& .MuiInputBase-input': { color: C.text, py: 0.5, px: 1 } }}
                                />
                                <Button size="small" onClick={async () => {
                                    if (!dateDraft) { setDateEditing(false); return; }
                                    try {
                                        // Remap all day dates based on new start date
                                        const newStart = new Date(dateDraft);
                                        const days = itinerary.days || [];
                                        // Update start_date (and end_date derived from days count)
                                        const newEnd = new Date(newStart);
                                        newEnd.setDate(newEnd.getDate() + days.length - 1);
                                        await axios.put(`http://127.0.0.1:8000/itineraries/${id}`, {
                                            start_date: dateDraft,
                                            end_date: newEnd.toISOString().split('T')[0],
                                        });
                                        // Update each day's date offset
                                        await Promise.all(days.map((day, i) => {
                                            const d = new Date(newStart);
                                            d.setDate(d.getDate() + i);
                                            return axios.put(`http://127.0.0.1:8000/itinerary-days/${day.id}`, {
                                                date: d.toISOString().split('T')[0],
                                            });
                                        }));
                                        await reload();
                                        toast('Start date updated — all days remapped!');
                                    } catch (e) { toast(e.response?.data?.detail || 'Failed to update date.', 'error'); }
                                    setDateEditing(false);
                                }} sx={{ bgcolor: C.brand, color: C.bg, borderRadius: 2, fontWeight: 'bold', px: 2, textTransform: 'none', fontSize: '0.78rem', '&:hover': { bgcolor: '#2db8b8' } }}>Save</Button>
                                <Button size="small" onClick={() => setDateEditing(false)} sx={{ color: C.faded, borderRadius: 2, textTransform: 'none', fontSize: '0.78rem' }}>Cancel</Button>
                            </Stack>
                        ) : (
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                                <Typography variant="body2" sx={{ color: C.sub, fontWeight: 500 }}>
                                    {fmtDate(itinerary.start_date)} – {fmtDate(itinerary.end_date)}
                                </Typography>
                                {(isOwner || isAcceptedCollaborator) && (
                                    <IconButton size="small" onClick={() => { setDateDraft(itinerary.start_date?.split('T')[0] || ''); setDateEditing(true); }}
                                        sx={{ color: C.faded, p: 0.4, '&:hover': { color: C.brand, bgcolor: `${C.brand}14` } }}>
                                        <EditIcon sx={{ fontSize: 14 }} />
                                    </IconButton>
                                )}
                            </Stack>
                        )}
                    </Stack>

                    <Stack direction="row" alignItems="center" spacing={0.75}>
                        <LocationOnIcon sx={{ fontSize: '0.95rem', color: C.faded }} />
                        <Typography variant="body2" sx={{ color: C.sub, fontWeight: 500 }}>
                            {totalDest} Destination{totalDest !== 1 ? 's' : ''}
                        </Typography>
                    </Stack>

                    <Box sx={{ flexGrow: 1 }} />

                    <Stack direction="row" alignItems="center" spacing={0.75}>
                        <Typography variant="body2" sx={{ color: C.sub }}>Estimated :</Typography>
                        <Typography variant="body2" sx={{ color: C.faded }}>₹</Typography>
                        <Typography variant="body1" fontWeight="bold" sx={{ color: C.yellow }}>{fmtNum(totalEst)}</Typography>
                    </Stack>

                    <Stack direction="row" alignItems="center" spacing={0.75}>
                        <Typography variant="body2" sx={{ color: C.sub }}>Actual</Typography>
                        <Typography variant="body2" sx={{ color: C.faded }}>₹</Typography>
                        <Typography variant="body1" fontWeight="bold" sx={{ color: C.brand }}>{fmtNum(totalActual)}</Typography>
                    </Stack>

                    <Button size="small"
                        startIcon={weatherLoading ? <CircularProgress size={14} sx={{ color: C.brand }} /> : <WbSunnyIcon sx={{ fontSize: 16 }} />}
                        onClick={fetchWeather} disabled={weatherLoading}
                        sx={{ color: C.brand, bgcolor: `${C.brand}14`, borderRadius: 2, textTransform: 'none', fontSize: '0.78rem', px: 1.5, '&:hover': { bgcolor: `${C.brand}26` } }}>
                        {weatherLoading ? 'Fetching...' : 'Weather'}
                    </Button>
                    <Button size="small" startIcon={<ShareIcon sx={{ fontSize: 16 }} />} onClick={openShare}
                        sx={{ color: C.sub, bgcolor: C.surface, borderRadius: 2, textTransform: 'none', fontSize: '0.78rem', px: 1.5, '&:hover': { bgcolor: `${C.brand}14`, color: C.brand } }}>
                        Share
                    </Button>
                    {(isOwner || isAcceptedCollaborator) && (() => {
                        const accepted = collaborators.filter(c => c.status === 'accepted');
                        const EMOJIS = ['🏔️','🌄','🏕️','🧗','🚶','🌿','🦅','🌺','🏯','🛶','🌙','☀️','🦋','🐾','🎒','🗻','🌊','🔥','❄️','🌈'];
                        return (
                            <Button size="small" onClick={openCollaborators}
                                sx={{ color: C.sub, bgcolor: C.surface, borderRadius: 2, textTransform: 'none', fontSize: '0.78rem', px: 1.5, gap: 0.75, '&:hover': { bgcolor: `${C.brand}14`, color: C.brand } }}>
                                {/* Avatar stack of accepted collaborators */}
                                {accepted.length > 0 ? (
                                    <Stack direction="row" spacing={-0.5} alignItems="center" sx={{ mr: 0.25 }}>
                                        {accepted.slice(0, 3).map((c, i) => (
                                            <Box key={c.user_id} sx={{
                                                width: 20, height: 20, borderRadius: '50%',
                                                bgcolor: `${C.brand}20`, border: `2px solid ${C.surface}`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '0.6rem', zIndex: 3 - i,
                                            }}>
                                                {EMOJIS[(c.avatar_id || 1) - 1] || '🏔️'}
                                            </Box>
                                        ))}
                                        {accepted.length > 3 && (
                                            <Box sx={{
                                                width: 20, height: 20, borderRadius: '50%',
                                                bgcolor: C.brand, border: `2px solid ${C.surface}`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '0.5rem', fontWeight: 800, color: C.bg, zIndex: 0,
                                            }}>+{accepted.length - 3}</Box>
                                        )}
                                    </Stack>
                                ) : (
                                    <GroupIcon sx={{ fontSize: 16 }} />
                                )}
                                {accepted.length > 0 ? `${accepted.length} Collaborating` : 'Collaborate'}
                            </Button>
                        );
                    })()}
                    {!isOwner && itinerary && itinerary.is_public && (
                        <Button size="small" startIcon={forking ? <CircularProgress size={14} sx={{ color: C.brand }} /> : <ContentCopyIcon sx={{ fontSize: 16 }} />}
                            onClick={forkItinerary} disabled={forking}
                            sx={{ color: C.brand, bgcolor: `${C.brand}14`, borderRadius: 2, textTransform: 'none', fontSize: '0.78rem', px: 1.5, '&:hover': { bgcolor: `${C.brand}26` } }}>
                            {forking ? 'Forking...' : 'Fork & Edit'}
                        </Button>
                    )}
                </Box>

                {/* ── Days ─────────────────────────────────────────────────── */}
                {!itinerary.days?.length ? (
                    <Box sx={{ textAlign: 'center', py: 12 }}>
                        <Typography variant="h6" sx={{ color: C.sub, mb: 1 }}>No days planned yet</Typography>
                        {canEdit ? (
                            <>
                                <Typography variant="body2" sx={{ color: C.faded, mb: 3 }}>Start by adding your first day.</Typography>
                                <Button startIcon={<AddIcon />} onClick={openAddDay}
                                    sx={{ bgcolor: C.brand, color: C.bg, fontWeight: 'bold', borderRadius: 3, px: 3, textTransform: 'none', '&:hover': { bgcolor: '#2db8b8' } }}>
                                    Add First Day
                                </Button>
                            </>
                        ) : (
                            <Typography variant="body2" sx={{ color: C.faded }}>Fork this itinerary to start planning your own version.</Typography>
                        )}
                    </Box>
                ) : (
                    <DragDropContext onDragEnd={onDragEnd}>
                    <Stack spacing={2.5}>
                        {itinerary.days.map((day) => {
                            const isOpen    = !collapsed[day.id];
                            const dayEst    = day.estimated_cost || 0;
                            const dayActual = day.activities?.reduce((s, a) => s + (a.actual_cost || 0), 0) || 0;

                            return (
                                <Box key={day.id} sx={{ bgcolor: C.card, borderRadius: 4, overflow: 'hidden' }}>
                                    {/* Day Header */}
                                    <Stack direction="row" alignItems="center" sx={{ px: 3, py: 2.25 }}>
                                        <IconButton size="small"
                                            onClick={() => setCollapsed(p => ({ ...p, [day.id]: !p[day.id] }))}
                                            sx={{ color: C.faded, mr: 0.5, '&:hover': { color: C.brand } }}>
                                            {isOpen ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
                                        </IconButton>

                                        <Typography variant="h6" fontWeight="bold" sx={{ color: C.heading }}>
                                            Day {day.day_number}: {fmtDateFull(day.date)}
                                        </Typography>

                                        {/* Weather chip */}
                                        {(() => {
                                            const actsWithWeather = (day.activities || []).filter(a => a.weather_temp != null);
                                            if (!actsWithWeather.length) return null;
                                            const temps = actsWithWeather.map(a => a.weather_temp);
                                            const lo = Math.round(Math.min(...temps));
                                            const hi = Math.round(Math.max(...temps));
                                            const midday = actsWithWeather.reduce((best, a) => {
                                                const h = a.start_time ? parseInt(a.start_time.split(':')[0]) : 12;
                                                const bestH = best.start_time ? parseInt(best.start_time.split(':')[0]) : 12;
                                                return Math.abs(h - 12) < Math.abs(bestH - 12) ? a : best;
                                            }, actsWithWeather[0]);
                                            return (
                                                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ bgcolor: `${C.brand}0F`, borderRadius: 2, px: 1.2, py: 0.3, ml: 1.5, border: `1px solid ${C.brand}20` }}>
                                                    {midday.weather_icon && <Box component="img" src={`https://openweathermap.org/img/wn/${midday.weather_icon}.png`} sx={{ width: 24, height: 24 }} />}
                                                    <Typography sx={{ color: C.heading, fontSize: '0.72rem', fontWeight: 600 }}>{lo}°–{hi}°</Typography>
                                                    <Typography sx={{ color: C.faded, fontSize: '0.65rem' }}>{midday.weather_description || midday.weather_condition}</Typography>
                                                </Stack>
                                            );
                                        })()}

                                        <Box sx={{ flexGrow: 1 }} />

                                        <Stack direction="row" alignItems="center" spacing={2} sx={{ mr: 1.5 }}>
                                            <Stack direction="row" alignItems="center" spacing={0.5}>
                                                <Typography variant="caption" sx={{ color: C.faded }}>Est.</Typography>
                                                <Typography variant="body2" fontWeight="bold" sx={{ color: C.yellow }}>₹ {fmtNum(dayEst)}</Typography>
                                            </Stack>
                                            <Stack direction="row" alignItems="center" spacing={0.5}>
                                                <Typography variant="caption" sx={{ color: C.faded }}>Actual</Typography>
                                                <Typography variant="body2" fontWeight="bold" sx={{ color: C.brand }}>₹ {fmtNum(dayActual)}</Typography>
                                            </Stack>
                                        </Stack>

                                        {canEdit && (
                                            <IconButton size="small" onClick={() => { setDelTarget({ type: 'day', item: day }); setDelOpen(true); }}
                                                sx={{ color: C.faded, '&:hover': { color: C.red } }}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        )}

                                        {canEdit && (
                                            <Button size="small" startIcon={<AddIcon />} onClick={() => openAddAct(day.id)} sx={{
                                                ml: 1.5, bgcolor: C.brand, color: C.bg, fontWeight: 'bold', borderRadius: 3,
                                                textTransform: 'none', px: 2, py: 0.75, fontSize: '0.82rem',
                                                '&:hover': { bgcolor: '#2db8b8', transform: 'translateY(-1px)', boxShadow: `0 4px 12px ${C.brand}40` },
                                                transition: 'all 0.25s',
                                            }}>Add Destination</Button>
                                        )}
                                    </Stack>

                                    {day.description && isOpen && (
                                        <Typography variant="body2" sx={{ color: C.faded, px: 4, pb: 1.5 }}>{day.description}</Typography>
                                    )}

                                    {/* Activities */}
                                    <Collapse in={isOpen}>
                                        <Box sx={{ px: 2, pb: 2 }}>
                                            <Droppable droppableId={`day-${day.id}`}>
                                            {(dropProvided, dropSnapshot) => (
                                            <Box ref={dropProvided.innerRef} {...dropProvided.droppableProps}
                                                sx={{ minHeight: 50, borderRadius: 2, transition: 'background 0.2s',
                                                      bgcolor: dropSnapshot.isDraggingOver ? `${C.brand}0A` : 'transparent' }}>
                                            {!day.activities?.length ? (
                                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                                    <Typography variant="body2" sx={{ color: C.faded }}>
                                                        No destinations yet — click "+ Add Destination" above to begin.
                                                    </Typography>
                                                </Box>
                                            ) : (
                                                day.activities.map((act, actIdx) => {
                                                    const meta = actMeta(act.activity_type);
                                                    return (
                                                        <Draggable key={act.id} draggableId={`act-${act.id}`} index={actIdx}>
                                                        {(dragProvided, dragSnapshot) => (
                                                        <Box ref={dragProvided.innerRef} {...dragProvided.draggableProps}
                                                            sx={{
                                                                display: 'flex', alignItems: 'center', gap: 2,
                                                                bgcolor: dragSnapshot.isDragging ? C.card : C.surface,
                                                                borderRadius: 3, px: 2.5, py: 1.75, mb: 1.5,
                                                                boxShadow: dragSnapshot.isDragging ? `0 8px 24px ${C.brand}30` : 'none',
                                                                border: `1px solid ${dragSnapshot.isDragging ? C.brand + '40' : 'transparent'}`,
                                                                opacity: act.is_completed ? 0.55 : 1,
                                                                transition: 'box-shadow 0.2s, border 0.2s',
                                                            }}>
                                                            {canEdit ? (
                                                                <Box {...dragProvided.dragHandleProps} sx={{ color: C.faded, display: 'flex', cursor: 'grab', flexShrink: 0, '&:hover': { color: C.brand } }}>
                                                                    <DragIndicatorIcon sx={{ fontSize: 18 }} />
                                                                </Box>
                                                            ) : (
                                                                <Box sx={{ width: 18, flexShrink: 0 }} />
                                                            )}
                                                                {/* Time badge */}
                                                                <Box sx={{ bgcolor: C.brand, color: C.bg, fontWeight: 'bold', fontSize: '0.72rem', px: 1.5, py: 0.5, borderRadius: 2, whiteSpace: 'nowrap', flexShrink: 0, minWidth: 68, textAlign: 'center', visibility: act.start_time ? 'visible' : 'hidden' }}>
                                                                    {fmtTime(act.start_time)}
                                                                </Box>

                                                                {/* Activity icon */}
                                                                <Box sx={{ bgcolor: meta.bg, color: meta.color, borderRadius: 2, p: 0.875, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                                    {meta.icon}
                                                                </Box>

                                                                {/* Info */}
                                                                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                                                    <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
                                                                        <Typography variant="body1" fontWeight="600" sx={{ color: C.sub, textDecoration: act.is_completed ? 'line-through' : 'none' }}>
                                                                            {act.title}
                                                                        </Typography>
                                                                        {act.location && (
                                                                            <Stack direction="row" alignItems="center" spacing={0.4}>
                                                                                <LocationOnIcon sx={{ fontSize: '0.8rem', color: C.red }} />
                                                                                <Typography variant="caption" sx={{ color: C.faded }}>{act.location}</Typography>
                                                                            </Stack>
                                                                        )}
                                                                    </Stack>

                                                                    {/* Per-activity weather */}
                                                                    {act.weather_condition && (
                                                                        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mt: 0.4, flexWrap: 'wrap' }}>
                                                                            {(() => {
                                                                                const { icon, color } = actWeatherIcon(act.weather_condition);
                                                                                return (
                                                                                    <Stack direction="row" alignItems="center" spacing={0.4}>
                                                                                        <Box sx={{ color, display: 'flex', alignItems: 'center' }}>{icon}</Box>
                                                                                        <Typography sx={{ color, fontSize: '0.72rem', fontWeight: 600, textTransform: 'capitalize' }}>
                                                                                            {act.weather_description || act.weather_condition}
                                                                                        </Typography>
                                                                                    </Stack>
                                                                                );
                                                                            })()}
                                                                            {act.weather_temp != null && (
                                                                                <Stack direction="row" alignItems="center" spacing={0.3}>
                                                                                    <DeviceThermostatIcon sx={{ fontSize: 13, color: C.faded }} />
                                                                                    <Typography sx={{ color: C.sub, fontSize: '0.72rem' }}>{Math.round(act.weather_temp)}°C</Typography>
                                                                                </Stack>
                                                                            )}
                                                                            {act.weather_wind_speed != null && (
                                                                                <Stack direction="row" alignItems="center" spacing={0.3}>
                                                                                    <AirIcon sx={{ fontSize: 13, color: C.faded }} />
                                                                                    <Typography sx={{ color: C.faded, fontSize: '0.72rem' }}>{act.weather_wind_speed} km/h</Typography>
                                                                                </Stack>
                                                                            )}
                                                                            {act.weather_humidity != null && (
                                                                                <Stack direction="row" alignItems="center" spacing={0.3}>
                                                                                    <WaterDropIcon sx={{ fontSize: 13, color: '#64B5F6' }} />
                                                                                    <Typography sx={{ color: C.faded, fontSize: '0.72rem' }}>{act.weather_humidity}%</Typography>
                                                                                </Stack>
                                                                            )}
                                                                        </Stack>
                                                                    )}

                                                                    {act.description && (
                                                                        <Typography variant="caption" sx={{ color: C.faded, display: 'block', mt: 0.35 }}>{act.description}</Typography>
                                                                    )}
                                                                </Box>

                                                                {/* Estimated cost pill */}
                                                                <Box sx={{ bgcolor: 'rgba(255,183,77,0.12)', color: C.yellow, fontWeight: 'bold', fontSize: '1.05rem', borderRadius: 2.5, flexShrink: 0, width: 114, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                    {fmtNum(act.cost)}
                                                                </Box>

                                                                {/* Actual cost — inline editable for editors, read-only for viewers */}
                                                                {canEdit ? (
                                                                    <Box onClick={e => e.stopPropagation()} sx={{ bgcolor: `${C.brand}1A`, borderRadius: 2.5, flexShrink: 0, width: 114, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', '&:hover': { bgcolor: `${C.brand}30` }, '&:focus-within': { bgcolor: `${C.brand}38`, outline: `1.5px solid ${C.brand}` } }}>
                                                                        <input
                                                                            type="text" inputMode="numeric"
                                                                            value={inlineActual[act.id] !== undefined ? inlineActual[act.id] : (act.actual_cost || 0)}
                                                                            onChange={e => { const val = e.target.value.replace(/[^0-9.]/g, ''); setInlineActual(p => ({ ...p, [act.id]: val })); }}
                                                                            onFocus={e => { setInlineActual(p => ({ ...p, [act.id]: act.actual_cost || 0 })); e.target.select(); }}
                                                                            onBlur={() => saveInlineActual(act)}
                                                                            onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') { setInlineActual(p => { const n = { ...p }; delete n[act.id]; return n; }); e.target.blur(); } }}
                                                                            style={{ width: '100%', background: 'transparent', border: 'none', color: C.brand, fontWeight: 700, fontSize: '1.05rem', textAlign: 'center', padding: '0 8px', outline: 'none', cursor: 'text' }}
                                                                        />
                                                                    </Box>
                                                                ) : (
                                                                    <Box sx={{ bgcolor: `${C.brand}1A`, borderRadius: 2.5, flexShrink: 0, width: 114, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                        <Typography sx={{ color: C.brand, fontWeight: 700, fontSize: '1.05rem' }}>{fmtNum(act.actual_cost || 0)}</Typography>
                                                                    </Box>
                                                                )}

                                                                {canEdit && (
                                                                    <IconButton size="small" onClick={() => openEditAct(act, day.id)} sx={{ color: C.faded, '&:hover': { color: C.brand } }}>
                                                                        <EditIcon sx={{ fontSize: '1.1rem' }} />
                                                                    </IconButton>
                                                                )}
                                                                {canEdit && (
                                                                    <IconButton size="small" onClick={() => { setDelTarget({ type: 'activity', item: act }); setDelOpen(true); }} sx={{ color: C.faded, '&:hover': { color: C.red } }}>
                                                                        <DeleteIcon sx={{ fontSize: '1.1rem' }} />
                                                                    </IconButton>
                                                                )}
                                                        </Box>
                                                        )}
                                                        </Draggable>
                                                    );
                                                })
                                            )}
                                            {dropProvided.placeholder}
                                            </Box>
                                            )}
                                            </Droppable>
                                        </Box>
                                    </Collapse>
                                </Box>
                            );
                        })}

                        {canEdit && (
                            <Box>
                                <Button startIcon={<AddIcon />} onClick={openAddDay} sx={{ color: C.brand, bgcolor: `${C.brand}14`, fontWeight: 'bold', borderRadius: 3, px: 3, textTransform: 'none', '&:hover': { bgcolor: `${C.brand}26` } }}>
                                    Add Another Day
                                </Button>
                            </Box>
                        )}
                    </Stack>
                    </DragDropContext>
                )}

                {/* Community Alerts */}
                {alerts.length > 0 && (
                    <Box sx={{ mt: 4, mb: 2 }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ color: C.yellow, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box component="span" sx={{ fontSize: '1.1rem' }}>⚠</Box>
                            Community Alerts ({alerts.length})
                        </Typography>
                        <Stack spacing={1.5}>
                            {alerts.map((alert) => {
                                const sevColor = { info: C.brand, warning: C.yellow, urgent: C.red }[alert.severity] || C.yellow;
                                return (
                                    <Box key={alert.id} sx={{ bgcolor: C.card, borderRadius: 3, border: `1px solid ${sevColor}30`, borderLeft: `3px solid ${sevColor}`, px: 2.5, py: 1.5 }}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                                                    <Typography sx={{ color: sevColor, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>{alert.update_type}</Typography>
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
                                            <Typography sx={{ color: C.faded, fontSize: '0.65rem', flexShrink: 0, ml: 2 }}>{fmtDate(alert.created_at)}</Typography>
                                        </Stack>
                                    </Box>
                                );
                            })}
                        </Stack>
                    </Box>
                )}
            </Box>

            {/* ── Activity Dialog ───────────────────────────────────────────── */}
            <Dialog open={actOpen} onClose={() => setActOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: C.card, borderRadius: 4 } }}>
                <DialogTitle sx={{ color: C.heading, fontWeight: 'bold' }}>{editAct ? 'Edit Activity' : 'Add Activity'}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2.5} sx={{ mt: 1 }}>

                        {/* Title */}
                        <TextField fullWidth label="Title *"
                            value={actForm.title}
                            onChange={e => setActForm(f => ({ ...f, title: e.target.value }))}
                            placeholder="e.g., Sunrise at Sarangkot"
                            sx={inputSx} />

                        {/* Location / Place */}
                        <Box>
                            <PlaceSearchAutocomplete
                                label="Location / Place *"
                                destinationContext={itinerary?.destination}
                                value={actForm.location}
                                onChange={(text) => setActForm(f => ({ ...f, location: text, place_id: null, latitude: null, longitude: null, formatted_address: null, place_types: null, rating: null }))}
                                onSelect={(place) => setActForm(f => ({ ...f, location: place.name, title: f.title || place.name, place_id: place.google_place_id, latitude: place.latitude, longitude: place.longitude, formatted_address: place.address, place_types: Array.isArray(place.place_types) ? place.place_types.join(',') : place.place_types || null, rating: place.rating || null }))}
                            />
                            {actErr.location && <Typography variant="caption" sx={{ color: C.red, ml: 1.5, mt: 0.5, display: 'block' }}>{actErr.location}</Typography>}
                            {actForm.place_id ? (
                                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5, ml: 0.5 }}>
                                    <Chip label="Mapped" size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: `${C.brand}20`, color: C.brand, border: `1px solid ${C.brand}4D` }} />
                                    {actForm.formatted_address && <Typography variant="caption" sx={{ color: C.faded, fontSize: '0.7rem' }}>{actForm.formatted_address}</Typography>}
                                </Stack>
                            ) : actForm.location?.trim() && (
                                <Typography variant="caption" sx={{ color: C.faded, fontSize: '0.68rem', ml: 0.5, mt: 0.3, display: 'block' }}>Select from dropdown to map this place</Typography>
                            )}
                        </Box>

                        {/* Row 1: Activity Type + Start Time */}
                        <Stack direction="row" spacing={2} alignItems="flex-start">
                            {/* Activity Type */}
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="caption" sx={{ color: C.faded, mb: 0.75, display: 'block', fontWeight: 600, letterSpacing: 0.4 }}>Activity Type *</Typography>
                                <Select fullWidth size="small"
                                    value={actForm.activity_type || 'destination'}
                                    onChange={e => setActForm(f => ({ ...f, activity_type: e.target.value }))}
                                    sx={{ bgcolor: C.bg, color: C.text, borderRadius: 2, '& .MuiOutlinedInput-notchedOutline': { borderColor: C.border }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: C.brand }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: C.brand }, '& .MuiSelect-icon': { color: C.faded } }}
                                    MenuProps={selectMenuSx}>
                                    {[
                                        { value: 'destination', label: 'General' },
                                        { value: 'sightseeing', label: 'Sightseeing' },
                                        { value: 'dining',      label: 'Dining' },
                                        { value: 'adventure',   label: 'Adventure' },
                                        { value: 'leisure',     label: 'Leisure' },
                                        { value: 'shopping',    label: 'Shopping' },
                                        { value: 'transport',   label: 'Transport' },
                                        { value: 'cultural',    label: 'Cultural' },
                                    ].map(t => (
                                        <MenuItem key={t.value} value={t.value} sx={{ '&:hover': { bgcolor: `${C.brand}20` } }}>{t.label}</MenuItem>
                                    ))}
                                </Select>
                            </Box>

                            {/* Start Time */}
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="caption" sx={{ color: C.faded, mb: 0.75, display: 'block', fontWeight: 600, letterSpacing: 0.4 }}>Start Time</Typography>
                                <Stack direction="row" spacing={0.75} alignItems="center">
                                    <Select size="small" displayEmpty
                                        value={(() => { if (!actForm.start_time) return ''; const h = parseInt(actForm.start_time.split(':')[0]); return String(h % 12 || 12).padStart(2, '0'); })()}
                                        onChange={(e) => {
                                            const hr = parseInt(e.target.value) || 12;
                                            const m = (actForm.start_time || '00:00').split(':')[1] || '00';
                                            const isPM = actForm.start_time ? parseInt(actForm.start_time.split(':')[0]) >= 12 : false;
                                            const h24 = isPM ? (hr === 12 ? 12 : hr + 12) : (hr === 12 ? 0 : hr);
                                            setActForm(f => ({ ...f, start_time: `${String(h24).padStart(2, '0')}:${m}` }));
                                        }}
                                        sx={{ flex: 1, bgcolor: C.bg, color: C.text, borderRadius: 2, '& .MuiOutlinedInput-notchedOutline': { borderColor: C.border }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: C.brand }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: C.brand }, '& .MuiSelect-icon': { color: C.faded }, '& .MuiSelect-select': { py: 1.1, fontSize: '0.9rem', fontWeight: 600 } }}
                                        MenuProps={selectMenuSx}>
                                        <MenuItem value="" sx={{ color: C.faded }}>HH</MenuItem>
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map(h => <MenuItem key={h} value={String(h).padStart(2, '0')}>{String(h).padStart(2, '0')}</MenuItem>)}
                                    </Select>
                                    <Typography sx={{ color: C.faded, fontWeight: 700, fontSize: '1rem' }}>:</Typography>
                                    <Select size="small" displayEmpty
                                        value={actForm.start_time ? actForm.start_time.split(':')[1] || '00' : ''}
                                        onChange={(e) => { const h = (actForm.start_time || '00:00').split(':')[0]; setActForm(f => ({ ...f, start_time: `${h}:${e.target.value}` })); }}
                                        sx={{ flex: 1, bgcolor: C.bg, color: C.text, borderRadius: 2, '& .MuiOutlinedInput-notchedOutline': { borderColor: C.border }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: C.brand }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: C.brand }, '& .MuiSelect-icon': { color: C.faded }, '& .MuiSelect-select': { py: 1.1, fontSize: '0.9rem', fontWeight: 600 } }}
                                        MenuProps={selectMenuSx}>
                                        <MenuItem value="" sx={{ color: C.faded }}>MM</MenuItem>
                                        {['00', '15', '30', '45'].map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                                    </Select>
                                    <Select size="small"
                                        value={actForm.start_time ? (parseInt(actForm.start_time.split(':')[0]) >= 12 ? 'PM' : 'AM') : 'AM'}
                                        onChange={(e) => {
                                            const [hStr, m] = (actForm.start_time || '00:00').split(':');
                                            let h = parseInt(hStr) || 0;
                                            if (e.target.value === 'PM' && h < 12) h += 12;
                                            if (e.target.value === 'AM' && h >= 12) h -= 12;
                                            setActForm(f => ({ ...f, start_time: `${String(h).padStart(2, '0')}:${m}` }));
                                        }}
                                        sx={{ flex: 1, bgcolor: C.bg, color: C.brand, borderRadius: 2, fontWeight: 700, '& .MuiOutlinedInput-notchedOutline': { borderColor: C.border }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: C.brand }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: C.brand }, '& .MuiSelect-icon': { color: C.brand }, '& .MuiSelect-select': { py: 1.1, fontSize: '0.9rem', fontWeight: 700 } }}
                                        MenuProps={selectMenuSx}>
                                        <MenuItem value="AM">AM</MenuItem>
                                        <MenuItem value="PM">PM</MenuItem>
                                    </Select>
                                </Stack>
                            </Box>
                        </Stack>

                        {/* Row 2: Estimated cost + Actual cost */}
                        <Stack direction="row" spacing={2}>
                            <TextField fullWidth label={`Estimated Cost (${itinerary?.currency || 'NPR'})`} type="number"
                                value={actForm.cost} onChange={e => setActForm({ ...actForm, cost: e.target.value })} placeholder="0"
                                sx={{ ...inputSx, '& .MuiInputLabel-root': { color: '#ffb74d99' }, '& .MuiInputLabel-root.Mui-focused': { color: '#ffb74d' }, '& .MuiOutlinedInput-root': { ...inputSx['& .MuiOutlinedInput-root'], '&.Mui-focused fieldset': { borderColor: '#ffb74d' }, '& input': { color: '#ffb74d', fontWeight: 700 } } }} />
                            <TextField fullWidth label={`Actual Cost (${itinerary?.currency || 'NPR'})`} type="number"
                                value={actForm.actual_cost} onChange={e => setActForm({ ...actForm, actual_cost: e.target.value })} placeholder="0"
                                sx={{ ...inputSx, '& .MuiInputLabel-root': { color: `${C.brand}99` }, '& .MuiInputLabel-root.Mui-focused': { color: C.brand }, '& .MuiOutlinedInput-root': { ...inputSx['& .MuiOutlinedInput-root'], '&.Mui-focused fieldset': { borderColor: C.brand }, '& input': { color: C.brand, fontWeight: 700 } } }} />
                        </Stack>

                        <TextField fullWidth label="Description" multiline rows={2} value={actForm.description}
                            onChange={e => setActForm({ ...actForm, description: e.target.value })} placeholder="e.g., Scenic views, local food stop" sx={inputSx} />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setActOpen(false)} disabled={actBusy} sx={{ color: C.faded }}>Cancel</Button>
                    <Button onClick={saveAct} disabled={actBusy} sx={{ bgcolor: C.brand, color: C.bg, fontWeight: 'bold', borderRadius: 3, px: 3, '&:hover': { bgcolor: '#2db8b8' } }}>
                        {actBusy ? <CircularProgress size={20} /> : (editAct ? 'Update' : 'Add Activity')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Delete Confirm ────────────────────────────────────────────── */}
            <Dialog open={delOpen} onClose={() => { setDelOpen(false); setDelTarget(null); }} PaperProps={{ sx: { bgcolor: C.card, borderRadius: 4 } }}>
                <DialogTitle sx={{ color: C.heading, fontWeight: 'bold' }}>Confirm Delete</DialogTitle>
                <DialogContent>
                    <Typography sx={{ color: C.text }}>Delete this {delTarget?.type}? This action cannot be undone.</Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => { setDelOpen(false); setDelTarget(null); }} sx={{ color: C.faded }}>Cancel</Button>
                    <Button onClick={() => { if (delTarget?.type === 'day') deleteDay(delTarget.item); else deleteAct(delTarget.item); }}
                        sx={{ bgcolor: C.red, color: 'white', fontWeight: 'bold', borderRadius: 3, px: 3, '&:hover': { bgcolor: '#e55959' } }}>Delete</Button>
                </DialogActions>
            </Dialog>

            {/* ── Share Dialog ─────────────────────────────────────────────── */}
            <Dialog open={shareOpen} onClose={() => setShareOpen(false)} maxWidth="xs" fullWidth
                PaperProps={{ sx: { bgcolor: C.bg, border: `1px solid ${C.border}`, borderRadius: 4 } }}>
                <DialogTitle sx={{ color: C.heading, fontWeight: 'bold', borderBottom: `1px solid ${C.border}`, pb: 1.5 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <ShareIcon sx={{ color: C.brand, fontSize: 20 }} />
                        <Typography fontWeight="bold" sx={{ color: C.heading }}>Share Itinerary</Typography>
                    </Stack>
                    <Typography variant="caption" sx={{ color: C.faded, display: 'block', mt: 0.5 }}>"{itinerary?.title}"</Typography>
                    {/* Tab row */}
                    <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                        {[{ key: 'chat', label: 'Send to Friend', icon: <ForumIcon sx={{ fontSize: 14 }} /> },
                          { key: 'community', label: 'Post to Feed', icon: <GroupIcon sx={{ fontSize: 14 }} /> }].map(t => (
                            <Button key={t.key} size="small" startIcon={t.icon} onClick={() => setShareTab(t.key)}
                                sx={{ flex: 1, borderRadius: 2, textTransform: 'none', fontSize: '0.78rem', fontWeight: shareTab === t.key ? 700 : 400,
                                    color: shareTab === t.key ? C.brand : C.faded,
                                    bgcolor: shareTab === t.key ? `${C.brand}18` : 'transparent',
                                    border: `1px solid ${shareTab === t.key ? C.brand + '40' : 'transparent'}` }}>
                                {t.label}
                            </Button>
                        ))}
                    </Stack>
                </DialogTitle>
                <DialogContent sx={{ pt: 2, px: 2 }}>
                    {shareTab === 'chat' ? (
                        friendsLoading ? (
                            <Box sx={{ py: 4, textAlign: 'center' }}><CircularProgress size={22} sx={{ color: C.brand }} /></Box>
                        ) : friends.length === 0 ? (
                            <Box sx={{ py: 4, textAlign: 'center' }}>
                                <Typography sx={{ color: C.faded, fontSize: '0.85rem', mb: 0.5 }}>No friends yet</Typography>
                                <Typography sx={{ color: C.faded, fontSize: '0.72rem' }}>Add friends to share itineraries via chat.</Typography>
                            </Box>
                        ) : (
                            <Stack spacing={0.5}>
                                {friends.map(f => (
                                    <Stack key={f.user_id} direction="row" alignItems="center" sx={{ px: 1.5, py: 1, borderRadius: 2, cursor: 'pointer', '&:hover': { bgcolor: `${C.brand}0F` } }}>
                                        <Typography sx={{ fontSize: '1rem', mr: 1.2 }}>
                                            {['🏔️','🌄','🏕️','🧗','🚶','🌿','🦅','🌺','🏯','🛶','🌙','☀️','🦋','🐾','🎒','🗻','🌊','🔥','❄️','🌈'][(f.avatar_id || 1) - 1] || '🏔️'}
                                        </Typography>
                                        <Typography sx={{ color: C.heading, fontSize: '0.85rem', fontWeight: 600, flex: 1 }}>{f.username}</Typography>
                                        <IconButton size="small" onClick={() => shareToFriend(f.user_id)} disabled={sharing === f.user_id}
                                            sx={{ color: C.brand, '&:hover': { bgcolor: `${C.brand}20` }, '&:disabled': { color: C.faded } }}>
                                            {sharing === f.user_id ? <CircularProgress size={16} sx={{ color: C.brand }} /> : <SendIcon sx={{ fontSize: 18 }} />}
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
                                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: C.surface, borderRadius: 2, color: C.text, '& fieldset': { borderColor: 'transparent' }, '&:hover fieldset': { borderColor: C.brand }, '&.Mui-focused fieldset': { borderColor: C.brand } }, '& .MuiInputLabel-root': { color: C.faded }, '& .MuiInputLabel-root.Mui-focused': { color: C.brand }, '& .MuiInputBase-input': { color: C.text }, '& .MuiInputBase-input::placeholder': { color: C.faded, opacity: 1 } }} />
                                <TextField fullWidth size="small" label="Add context (optional)" multiline rows={2}
                                    value={feedBody} onChange={e => setFeedBody(e.target.value)} placeholder="Share what makes this trip special..."
                                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: C.surface, borderRadius: 2, color: C.text, '& fieldset': { borderColor: 'transparent' }, '&:hover fieldset': { borderColor: C.brand }, '&.Mui-focused fieldset': { borderColor: C.brand } }, '& .MuiInputLabel-root': { color: C.faded }, '& .MuiInputLabel-root.Mui-focused': { color: C.brand }, '& .MuiInputBase-input': { color: C.text }, '& .MuiInputBase-input::placeholder': { color: C.faded, opacity: 1 } }} />
                                {feedPlaces.length > 0 && (
                                    <Box>
                                        <Typography sx={{ color: C.faded, fontSize: '0.7rem', mb: 0.75, fontWeight: 600 }}>Place tags (auto-generated):</Typography>
                                        <Stack direction="row" flexWrap="wrap" gap={0.5}>
                                            {feedPlaces.map(p => (
                                                <Chip key={p} label={p} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: `${C.brand}15`, color: C.brand, border: `1px solid ${C.brand}35`, '& .MuiChip-label': { px: 0.8 } }} />
                                            ))}
                                        </Stack>
                                    </Box>
                                )}
                                <Button fullWidth variant="contained" onClick={shareToCommunity}
                                    disabled={communitySharing || !feedTitle.trim()}
                                    startIcon={communitySharing ? <CircularProgress size={16} sx={{ color: C.bg }} /> : <GroupIcon sx={{ fontSize: 18 }} />}
                                    sx={{ bgcolor: C.brand, color: C.bg, fontWeight: 'bold', borderRadius: 3, py: 1.2, textTransform: 'none', '&:hover': { bgcolor: '#2db8b8' }, '&:disabled': { opacity: 0.5 } }}>
                                    {communitySharing ? 'Posting...' : 'Share to Community Feed'}
                                </Button>
                            </Stack>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 2, py: 1.5, borderTop: `1px solid ${C.border}` }}>
                    <Button onClick={() => setShareOpen(false)} sx={{ color: C.faded, borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
                </DialogActions>
            </Dialog>

            {/* ── Collaborators Dialog ─────────────────────────────────────── */}
            <Dialog open={collabOpen} onClose={() => { setCollabOpen(false); setInviteErr(''); setInviteSuccess(''); }} maxWidth="sm" fullWidth
                PaperProps={{ sx: { bgcolor: C.bg, border: `1px solid ${C.border}`, borderRadius: 4 } }}>
                <DialogTitle sx={{ color: C.heading, fontWeight: 'bold', borderBottom: `1px solid ${C.border}`, pb: 1.5 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <GroupIcon sx={{ color: C.brand, fontSize: 20 }} />
                        <Typography fontWeight="bold" sx={{ color: C.heading }}>Collaborators</Typography>
                    </Stack>
                    <Typography variant="caption" sx={{ color: C.faded, display: 'block', mt: 0.5 }}>
                        Collaborators can edit this itinerary and see it in their account.
                    </Typography>
                </DialogTitle>
                <DialogContent sx={{ pt: 2 }}>

                    {/* ── Invite section — owners only ─────────────────── */}
                    {isOwner && <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                        <TextField fullWidth size="small"
                            placeholder="Search by @username…"
                            value={inviteUsername}
                            onChange={e => { setInviteUsername(e.target.value); setInviteErr(''); setCollabSearch(e.target.value.trim().replace(/^@/, '')); }}
                            onKeyDown={e => { if (e.key === 'Enter') inviteCollaborator(); }}
                            error={!!inviteErr && !!inviteUsername.trim()}
                            helperText={inviteUsername.trim() ? inviteErr : ''}
                            sx={{
                                '& .MuiOutlinedInput-root': { bgcolor: C.surface, borderRadius: 2, color: C.text, '& fieldset': { borderColor: 'transparent' }, '&:hover fieldset': { borderColor: C.brand }, '&.Mui-focused fieldset': { borderColor: C.brand } },
                                '& .MuiInputBase-input::placeholder': { color: C.faded, opacity: 1 },
                                '& .MuiFormHelperText-root': { color: C.red },
                            }} />
                        <Button variant="contained" onClick={() => inviteCollaborator()} disabled={inviting || !inviteUsername.trim()}
                            startIcon={inviting ? <CircularProgress size={14} sx={{ color: C.bg }} /> : <PersonAddIcon sx={{ fontSize: 16 }} />}
                            sx={{ bgcolor: C.brand, color: C.bg, fontWeight: 'bold', borderRadius: 2, px: 2, textTransform: 'none', whiteSpace: 'nowrap', '&:hover': { bgcolor: '#2db8b8' }, '&:disabled': { bgcolor: C.surface, color: C.faded } }}>
                            Invite
                        </Button>
                    </Stack>}

                    {/* ── Inline success / error feedback (owner only) ──────── */}
                    {isOwner && inviteSuccess && (
                        <Box sx={{ px: 1.5, py: 1, mb: 1.5, borderRadius: 2, bgcolor: 'rgba(76,175,80,0.12)', border: '1px solid rgba(76,175,80,0.3)', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CheckCircleIcon sx={{ fontSize: 15, color: '#4CAF50' }} />
                            <Typography sx={{ fontSize: '0.8rem', color: '#4CAF50', fontWeight: 600 }}>{inviteSuccess}</Typography>
                        </Box>
                    )}

                    {/* ── Friends quick-invite list (owner only) ─────────────── */}
                    {isOwner && collabFriends.length > 0 && (() => {
                        const collabUserIds = new Set(collaborators.map(c => c.user_id));
                        const filtered = collabFriends.filter(f =>
                            !collabUserIds.has(f.user_id) &&
                            (!collabSearch || f.username.toLowerCase().includes(collabSearch.toLowerCase()))
                        );
                        if (filtered.length === 0 && !collabSearch) return null;
                        return (
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="caption" sx={{ color: C.faded, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', fontSize: '0.68rem', mb: 1, display: 'block' }}>
                                    {collabSearch ? 'Matching Friends' : 'Friends'}
                                </Typography>
                                {collabFriendsLoading ? (
                                    <Box sx={{ py: 1, textAlign: 'center' }}><CircularProgress size={16} sx={{ color: C.brand }} /></Box>
                                ) : filtered.length === 0 ? (
                                    <Typography sx={{ color: C.faded, fontSize: '0.78rem', py: 0.5 }}>No matching friends</Typography>
                                ) : (
                                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.75 }}>
                                        {filtered.map(f => (
                                            <Stack key={f.user_id} direction="row" alignItems="center" spacing={1}
                                                sx={{ px: 1.25, py: 0.75, borderRadius: 2, bgcolor: C.surface, '&:hover': { bgcolor: `${C.brand}10` } }}>
                                                <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: `${C.brand}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', flexShrink: 0 }}>
                                                    {['🏔️','🌄','🏕️','🧗','🚶','🌿','🦅','🌺','🏯','🛶','🌙','☀️','🦋','🐾','🎒','🗻','🌊','🔥','❄️','🌈'][(f.avatar_id || 1) - 1] || '🏔️'}
                                                </Box>
                                                <Typography sx={{ color: C.heading, fontSize: '0.78rem', fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{f.username}</Typography>
                                                <Button size="small" onClick={() => { setInviteErr(''); inviteCollaborator(f.username); }}
                                                    disabled={inviting}
                                                    sx={{ bgcolor: `${C.brand}18`, color: C.brand, borderRadius: 2, px: 1, py: 0.2, fontSize: '0.68rem', fontWeight: 700, textTransform: 'none', minWidth: 0, flexShrink: 0, '&:hover': { bgcolor: `${C.brand}30` } }}>
                                                    +
                                                </Button>
                                            </Stack>
                                        ))}
                                    </Box>
                                )}
                            </Box>
                        );
                    })()}

                    {/* ── Current collaborators ─────────────────────────────── */}
                    {collabsLoading ? (
                        <Box sx={{ py: 3, textAlign: 'center' }}><CircularProgress size={20} sx={{ color: C.brand }} /></Box>
                    ) : collaborators.length === 0 ? (
                        <Typography sx={{ color: C.faded, fontSize: '0.82rem', textAlign: 'center', py: 2 }}>
                            No collaborators yet. Invite someone above.
                        </Typography>
                    ) : (
                        <Box>
                            {/* Accepted collaborators */}
                            {collaborators.filter(c => c.status === 'accepted').length > 0 && (
                                <Box sx={{ mb: 1.5 }}>
                                    <Typography variant="caption" sx={{ color: C.faded, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', fontSize: '0.68rem', mb: 1, display: 'block' }}>
                                        Active Collaborators
                                    </Typography>
                                    <Stack spacing={0.5}>
                                        {collaborators.filter(c => c.status === 'accepted').map(c => (
                                            <Stack key={c.user_id} direction="row" alignItems="center"
                                                sx={{ px: 1.5, py: 1, borderRadius: 2, bgcolor: 'rgba(76,175,80,0.06)', border: '1px solid rgba(76,175,80,0.15)' }}>
                                                <Typography sx={{ fontSize: '0.9rem', mr: 1.2 }}>
                                                    {['🏔️','🌄','🏕️','🧗','🚶','🌿','🦅','🌺','🏯','🛶','🌙','☀️','🦋','🐾','🎒','🗻','🌊','🔥','❄️','🌈'][(c.avatar_id || 1) - 1] || '🏔️'}
                                                </Typography>
                                                <Box sx={{ flex: 1 }}>
                                                    <Stack direction="row" alignItems="center" spacing={0.75}>
                                                        <Typography sx={{ color: C.heading, fontSize: '0.85rem', fontWeight: 600 }}>@{c.username}</Typography>
                                                        <CheckCircleIcon sx={{ fontSize: 13, color: '#4CAF50' }} />
                                                    </Stack>
                                                    <Typography sx={{ color: C.faded, fontSize: '0.7rem' }}>
                                                        {c.role} · since {c.accepted_at ? new Date(c.accepted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'recently'}
                                                    </Typography>
                                                </Box>
                                                {isOwner && (
                                                    <IconButton size="small" onClick={() => removeCollaborator(c.user_id)}
                                                        sx={{ color: C.faded, p: 0.4, '&:hover': { color: C.red, bgcolor: 'rgba(255,107,107,0.1)' } }}>
                                                        <DeleteIcon sx={{ fontSize: 15 }} />
                                                    </IconButton>
                                                )}
                                            </Stack>
                                        ))}
                                    </Stack>
                                </Box>
                            )}

                            {/* Pending invites */}
                            {collaborators.filter(c => c.status === 'pending').length > 0 && (
                                <Box>
                                    <Typography variant="caption" sx={{ color: C.faded, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', fontSize: '0.68rem', mb: 1, display: 'block' }}>
                                        Pending Invites
                                    </Typography>
                                    <Stack spacing={0.5}>
                                        {collaborators.filter(c => c.status === 'pending').map(c => (
                                            <Stack key={c.user_id} direction="row" alignItems="center"
                                                sx={{ px: 1.5, py: 1, borderRadius: 2, bgcolor: 'rgba(255,183,77,0.06)', border: '1px solid rgba(255,183,77,0.15)' }}>
                                                <Typography sx={{ fontSize: '0.9rem', mr: 1.2 }}>
                                                    {['🏔️','🌄','🏕️','🧗','🚶','🌿','🦅','🌺','🏯','🛶','🌙','☀️','🦋','🐾','🎒','🗻','🌊','🔥','❄️','🌈'][(c.avatar_id || 1) - 1] || '🏔️'}
                                                </Typography>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography sx={{ color: C.heading, fontSize: '0.85rem', fontWeight: 600 }}>@{c.username}</Typography>
                                                    <Typography sx={{ color: '#FFB74D', fontSize: '0.7rem' }}>Invite pending</Typography>
                                                </Box>
                                                <HourglassEmptyIcon sx={{ fontSize: 15, color: '#FFB74D', mr: 1 }} />
                                                {isOwner && (
                                                    <IconButton size="small" onClick={() => removeCollaborator(c.user_id)}
                                                        sx={{ color: C.faded, p: 0.4, '&:hover': { color: C.red, bgcolor: 'rgba(255,107,107,0.1)' } }}>
                                                        <DeleteIcon sx={{ fontSize: 15 }} />
                                                    </IconButton>
                                                )}
                                            </Stack>
                                        ))}
                                    </Stack>
                                </Box>
                            )}

                            {collaborators.length === 0 && (
                                <Typography sx={{ color: C.faded, fontSize: '0.82rem', textAlign: 'center', py: 2 }}>
                                    No collaborators yet. Invite someone above.
                                </Typography>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 2, py: 1.5, borderTop: `1px solid ${C.border}` }}>
                    <Button onClick={() => { setCollabOpen(false); setInviteErr(''); }} sx={{ color: C.faded, borderRadius: 2, textTransform: 'none' }}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* ── Time Prompt (after drag) ─────────────────────────────────── */}
            <Dialog open={timePromptOpen} onClose={cancelDrop} maxWidth="xs" fullWidth
                PaperProps={{ sx: { bgcolor: C.card, borderRadius: 4 } }}>
                <DialogTitle sx={{ color: C.heading, fontWeight: 'bold', pb: 0.5 }}>
                    {pendingDrop?.srcDayId === pendingDrop?.dstDayId ? 'Update Time' : 'Move to Another Day'}
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ color: C.faded, fontSize: '0.85rem', mb: 2 }}>
                        {pendingDrop?.srcDayId === pendingDrop?.dstDayId
                            ? 'Activity reordered. Set a new start time (optional):'
                            : `Moving to ${(() => { const d = itinerary.days?.find(d => d.id === pendingDrop?.dstDayId); return d ? `Day ${d.day_number}` : 'new day'; })()}. Set a start time (optional):`}
                    </Typography>
                    <Box>
                        <Typography variant="caption" sx={{ color: C.faded, mb: 0.75, display: 'block', fontWeight: 600, letterSpacing: 0.4 }}>Start Time (optional)</Typography>
                        <Stack direction="row" spacing={0.75} alignItems="center">
                            {/* Hour */}
                            <Select size="small" displayEmpty
                                value={(() => { if (!dropTime) return ''; const h = parseInt(dropTime.split(':')[0]); return String(h % 12 || 12).padStart(2, '0'); })()}
                                onChange={(e) => {
                                    const hr = parseInt(e.target.value) || 12;
                                    const m = (dropTime || '00:00').split(':')[1] || '00';
                                    const isPM = dropTime ? parseInt(dropTime.split(':')[0]) >= 12 : false;
                                    const h24 = isPM ? (hr === 12 ? 12 : hr + 12) : (hr === 12 ? 0 : hr);
                                    setDropTime(`${String(h24).padStart(2, '0')}:${m}`);
                                }}
                                sx={{ flex: 1, bgcolor: C.bg, color: C.text, borderRadius: 2, '& .MuiOutlinedInput-notchedOutline': { borderColor: C.border }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: C.brand }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: C.brand }, '& .MuiSelect-icon': { color: C.faded }, '& .MuiSelect-select': { py: 1.1, fontSize: '0.9rem', fontWeight: 600 } }}
                                MenuProps={{ PaperProps: { sx: { bgcolor: C.card, color: C.text, maxHeight: 260, '& .MuiMenuItem-root:hover': { bgcolor: `${C.brand}1A` } } } }}>
                                <MenuItem value="" sx={{ color: C.faded }}>HH</MenuItem>
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                                    <MenuItem key={h} value={String(h).padStart(2, '0')}>{String(h).padStart(2, '0')}</MenuItem>
                                ))}
                            </Select>
                            <Typography sx={{ color: C.faded, fontWeight: 700, fontSize: '1rem' }}>:</Typography>
                            {/* Minute */}
                            <Select size="small" displayEmpty
                                value={dropTime ? dropTime.split(':')[1] || '00' : ''}
                                onChange={(e) => { const h = (dropTime || '00:00').split(':')[0]; setDropTime(`${h}:${e.target.value}`); }}
                                sx={{ flex: 1, bgcolor: C.bg, color: C.text, borderRadius: 2, '& .MuiOutlinedInput-notchedOutline': { borderColor: C.border }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: C.brand }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: C.brand }, '& .MuiSelect-icon': { color: C.faded }, '& .MuiSelect-select': { py: 1.1, fontSize: '0.9rem', fontWeight: 600 } }}
                                MenuProps={{ PaperProps: { sx: { bgcolor: C.card, color: C.text, '& .MuiMenuItem-root:hover': { bgcolor: `${C.brand}1A` } } } }}>
                                <MenuItem value="" sx={{ color: C.faded }}>MM</MenuItem>
                                {['00', '15', '30', '45'].map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                            </Select>
                            {/* AM/PM */}
                            <Select size="small"
                                value={dropTime ? (parseInt(dropTime.split(':')[0]) >= 12 ? 'PM' : 'AM') : 'AM'}
                                onChange={(e) => {
                                    const [hStr, m] = (dropTime || '00:00').split(':');
                                    let h = parseInt(hStr) || 0;
                                    if (e.target.value === 'PM' && h < 12) h += 12;
                                    if (e.target.value === 'AM' && h >= 12) h -= 12;
                                    setDropTime(`${String(h).padStart(2, '0')}:${m || '00'}`);
                                }}
                                sx={{ flex: 1, bgcolor: C.bg, color: C.brand, borderRadius: 2, fontWeight: 700, '& .MuiOutlinedInput-notchedOutline': { borderColor: C.border }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: C.brand }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: C.brand }, '& .MuiSelect-icon': { color: C.brand }, '& .MuiSelect-select': { py: 1.1, fontSize: '0.9rem', fontWeight: 700 } }}
                                MenuProps={{ PaperProps: { sx: { bgcolor: C.card, color: C.text, '& .MuiMenuItem-root:hover': { bgcolor: `${C.brand}1A` } } } }}>
                                <MenuItem value="AM">AM</MenuItem>
                                <MenuItem value="PM">PM</MenuItem>
                            </Select>
                        </Stack>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={cancelDrop} sx={{ color: C.faded }}>Cancel</Button>
                    <Button onClick={confirmDrop} variant="contained"
                        sx={{ bgcolor: C.brand, color: C.bg, fontWeight: 'bold', borderRadius: 3, px: 3, '&:hover': { bgcolor: '#2db8b8' } }}>
                        Confirm Move
                    </Button>
                </DialogActions>
            </Dialog>
            {/* ── Snackbar ─────────────────────────────────────────────────── */}
            <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(p => ({ ...p, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert severity={snack.sev} onClose={() => setSnack(p => ({ ...p, open: false }))} sx={{ bgcolor: C.card, color: C.text, borderRadius: 3 }}>
                    {snack.msg}
                </Alert>
            </Snackbar>
        </Box>
    );
}