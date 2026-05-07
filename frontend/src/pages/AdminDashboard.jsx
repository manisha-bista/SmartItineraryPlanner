import React, { useState, useEffect } from 'react';
import {
    Box, Button, Typography, Stack, IconButton, Card,
    TextField, InputAdornment, Avatar, Chip,
    Divider, Alert, CircularProgress,
    Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Tabs, Tab,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Menu, MenuItem, Tooltip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import Navbar, { DRAWER_WIDTH } from '../components/Navbar';

import PeopleAltIcon              from '@mui/icons-material/PeopleAlt';
import MapOutlinedIcon            from '@mui/icons-material/MapOutlined';
import ReportProblemOutlinedIcon  from '@mui/icons-material/ReportProblemOutlined';
import TrendingUpIcon             from '@mui/icons-material/TrendingUp';
import TrendingDownIcon           from '@mui/icons-material/TrendingDown';
import SearchIcon                 from '@mui/icons-material/Search';
import RefreshIcon                from '@mui/icons-material/Refresh';
import MoreVertIcon               from '@mui/icons-material/MoreVert';
import DeleteOutlineIcon          from '@mui/icons-material/DeleteOutline';
import VisibilityOutlinedIcon     from '@mui/icons-material/VisibilityOutlined';
import CloseIcon                  from '@mui/icons-material/Close';
import CheckCircleOutlineIcon     from '@mui/icons-material/CheckCircleOutline';
import LocationOnIcon             from '@mui/icons-material/LocationOn';
import AdminPanelSettingsIcon     from '@mui/icons-material/AdminPanelSettings';
import EmailOutlinedIcon          from '@mui/icons-material/EmailOutlined';
import SettingsOutlinedIcon       from '@mui/icons-material/SettingsOutlined';
import LockOutlinedIcon           from '@mui/icons-material/LockOutlined';
import Visibility                 from '@mui/icons-material/Visibility';
import VisibilityOff              from '@mui/icons-material/VisibilityOff';

// ── Sub-components — all receive COLORS as prop ───────────────────────────────

const StatCard = ({ icon, label, value, trend, trendUp, color, loading, COLORS }) => (
    <Card sx={{
        bgcolor: COLORS.cardPrimary, borderRadius: 4, p: 3, flex: 1,
        border: `1px solid ${COLORS.cardBorder}`,
        transition: 'all 0.25s',
        '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 10px 28px ${color}25`, borderColor: `${color}40` },
    }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box>
                <Typography sx={{ color: COLORS.fadedText, fontSize: '0.72rem', letterSpacing: 1, textTransform: 'uppercase', mb: 0.5 }}>
                    {label}
                </Typography>
                {loading
                    ? <CircularProgress size={22} sx={{ color, mt: 0.5 }} />
                    : <Typography variant="h3" fontWeight={800} sx={{ color: COLORS.headings, lineHeight: 1.1, mb: 0.75 }}>{value}</Typography>}
                {trend && !loading && (
                    <Stack direction="row" alignItems="center" spacing={0.4}>
                        {trendUp
                            ? <TrendingUpIcon   sx={{ fontSize: 14, color: '#4ade80' }} />
                            : <TrendingDownIcon sx={{ fontSize: 14, color: '#ff6b6b' }} />}
                        <Typography sx={{ color: trendUp ? '#4ade80' : '#ff6b6b', fontSize: '0.72rem' }}>
                            {trend} this month
                        </Typography>
                    </Stack>
                )}
            </Box>
            <Box sx={{ width: 52, height: 52, borderRadius: 3, bgcolor: `${color}15`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {icon}
            </Box>
        </Stack>
    </Card>
);

const SectionHeader = ({ title, onRefresh, loading, COLORS }) => (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight={700} sx={{ color: COLORS.headings }}>{title}</Typography>
        <Tooltip title="Refresh">
            <IconButton size="small" onClick={onRefresh} disabled={loading}
                sx={{ color: COLORS.brand, bgcolor: `${COLORS.brand}14`, borderRadius: 2, '&:hover': { bgcolor: `${COLORS.brand}26` } }}>
                <RefreshIcon sx={{ fontSize: 16, ...(loading && { animation: 'spin 1s linear infinite' }) }} />
            </IconButton>
        </Tooltip>
    </Stack>
);

const StatusChip = ({ label, color }) => (
    <Chip label={label} size="small" sx={{ height: 20, fontSize: '0.62rem', fontWeight: 700, bgcolor: `${color}18`, color, border: `1px solid ${color}30` }} />
);

const RowMenu = ({ onView, onDelete, onResolve, onDismiss, resolveLabel, deleteLabel, COLORS }) => {
    const [anchor, setAnchor] = useState(null);
    return (
        <>
            <IconButton size="small" onClick={e => setAnchor(e.currentTarget)}
                sx={{ color: COLORS.fadedText, borderRadius: 1.5, '&:hover': { color: COLORS.brand, bgcolor: `${COLORS.brand}14` } }}>
                <MoreVertIcon sx={{ fontSize: 16 }} />
            </IconButton>
            <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}
                PaperProps={{ sx: { bgcolor: COLORS.cardPrimary, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 2, minWidth: 140 } }}>
                {onView && <MenuItem onClick={() => { onView(); setAnchor(null); }} sx={{ color: COLORS.text, fontSize: '0.82rem', gap: 1, '&:hover': { bgcolor: `${COLORS.brand}14` } }}>
                    <VisibilityOutlinedIcon sx={{ fontSize: 15, color: COLORS.brand }} /> View
                </MenuItem>}
                {onResolve && <MenuItem onClick={() => { onResolve(); setAnchor(null); }} sx={{ color: COLORS.text, fontSize: '0.82rem', gap: 1, '&:hover': { bgcolor: 'rgba(74,222,128,0.08)' } }}>
                    <CheckCircleOutlineIcon sx={{ fontSize: 15, color: '#4ade80' }} /> {resolveLabel || 'Resolve'}
                </MenuItem>}
                {onDismiss && <MenuItem onClick={() => { onDismiss(); setAnchor(null); }} sx={{ color: '#fb923c', fontSize: '0.82rem', gap: 1, '&:hover': { bgcolor: 'rgba(251,146,60,0.08)' } }}>
                    <CloseIcon sx={{ fontSize: 15, color: '#fb923c' }} /> Dismiss
                </MenuItem>}
                {onDelete && <MenuItem onClick={() => { onDelete(); setAnchor(null); }} sx={{ color: '#ff6b6b', fontSize: '0.82rem', gap: 1, '&:hover': { bgcolor: 'rgba(255,107,107,0.08)' } }}>
                    <DeleteOutlineIcon sx={{ fontSize: 15 }} /> {deleteLabel || 'Delete'}
                </MenuItem>}
            </Menu>
        </>
    );
};

const EmptyRow = ({ cols, msg, COLORS }) => (
    <TableRow>
        <TableCell colSpan={cols} sx={{ textAlign: 'center', py: 5, color: COLORS.fadedText, borderBottom: 'none', fontSize: '0.82rem' }}>
            {msg}
        </TableCell>
    </TableRow>
);

const LoadingRow = ({ cols, COLORS }) => (
    <TableRow>
        <TableCell colSpan={cols} sx={{ textAlign: 'center', py: 4, borderBottom: 'none' }}>
            <CircularProgress size={24} sx={{ color: COLORS.brand }} />
        </TableCell>
    </TableRow>
);

// ── Main Component ─────────────────────────────────────────────────────────────
const AdminDashboard = () => {
    const navigate = useNavigate();
    const { COLORS } = useTheme();

    // shared table cell styles — built from live COLORS
    const thSx = {
        color: COLORS.fadedText, fontSize: '0.68rem', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: 1,
        borderBottom: `1px solid ${COLORS.cardBorder}`,
        bgcolor: COLORS.cardSecondary, py: 1.5,
    };
    const tdSx = {
        color: COLORS.text, fontSize: '0.82rem',
        borderBottom: `1px solid ${COLORS.cardBorder}`, py: 1.2,
    };

    const inputSx = {
        '& .MuiOutlinedInput-root': {
            bgcolor: COLORS.cardSecondary, borderRadius: 2, color: COLORS.text,
            '& fieldset': { borderColor: COLORS.cardBorder },
            '&:hover fieldset': { borderColor: COLORS.brand },
            '&.Mui-focused fieldset': { borderColor: COLORS.brand },
        },
        '& .MuiInputLabel-root': { color: COLORS.fadedText },
        '& .MuiInputLabel-root.Mui-focused': { color: COLORS.brand },
        '& .MuiInputBase-input': { color: COLORS.text },
        '& .MuiFormHelperText-root': { color: COLORS.fadedText },
    };

    const [admin, setAdmin]             = useState({ id: null, name: 'Admin', initial: 'A', email: '' });
    const [activeTab, setActiveTab]     = useState(0);
    const [search, setSearch]           = useState('');
    const [stats, setStats]             = useState({ totalUsers: 0, totalItineraries: 0, totalComplaints: 0, totalPlaces: 0 });
    const [users, setUsers]             = useState([]);
    const [itineraries, setItineraries] = useState([]);
    const [complaints, setComplaints]   = useState([]);
    const [places, setPlaces]           = useState([]);
    const [communityPosts, setCommunityPosts] = useState([]);
    const [reports, setReports]           = useState([]);

    const [statsLoading, setStatsLoading] = useState(false);
    const [usersLoading, setUsersLoading] = useState(false);
    const [itinLoading, setItinLoading]   = useState(false);
    const [compLoading, setCompLoading]   = useState(false);
    const [placesLoading, setPlacesLoading] = useState(false);
    const [postsLoading, setPostsLoading]   = useState(false);
    const [reportsLoading, setReportsLoading] = useState(false);

    const [alert, setAlert]           = useState({ show: false, msg: '', type: 'success' });
    const [detailDialog, setDetailDialog] = useState({ open: false, type: '', data: null });
    const [itinDetail, setItinDetail]     = useState({ open: false, loading: false, data: null });
    const [userProfile, setUserProfile]   = useState({ open: false, loading: false, data: null });

    const [settingsOpen, setSettingsOpen]     = useState(false);
    const [settingsTab, setSettingsTab]       = useState(0);
    const [settingsSaving, setSettingsSaving] = useState(false);
    const [settingsError, setSettingsError]   = useState('');
    const [newEmail, setNewEmail]             = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword]       = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent]       = useState(false);
    const [showNew, setShowNew]               = useState(false);
    const [showConfirm, setShowConfirm]       = useState(false);

    useEffect(() => {
        const userId   = localStorage.getItem('userId');
        const userName = localStorage.getItem('userName');
        const userRole = localStorage.getItem('userRole');
        const userEmail = localStorage.getItem('userEmail') || '';
        if (!userId) { navigate('/login'); return; }
        if (userRole !== 'admin') { navigate('/dashboard'); return; }
        setAdmin({ id: parseInt(userId), name: userName || 'Admin', initial: (userName || 'A')[0].toUpperCase(), email: userEmail });
        setNewEmail(userEmail);
        loadAll();
    }, [navigate]);

    const showAlert = (msg, type = 'success') => {
        setAlert({ show: true, msg, type });
        setTimeout(() => setAlert(a => ({ ...a, show: false })), 3500);
    };

    const [pendingSubs, setPendingSubs]       = useState([]);
    const [subsLoading, setSubsLoading]       = useState(false);

    const loadAll = () => { fetchStats(); fetchUsers(); fetchItineraries(); fetchComplaints(); fetchPlaces(); fetchCommunityPosts(); fetchReports(); fetchPendingSubs(); };

    const fetchStats = async () => {
        setStatsLoading(true);
        try {
            const [uR, iR, cR, pR] = await Promise.allSettled([
                axios.get('http://127.0.0.1:8000/users/'),
                axios.get(`http://127.0.0.1:8000/admin/itineraries?admin_id=${localStorage.getItem('userId')}`),
                axios.get('http://127.0.0.1:8000/complaints/'),
                axios.get(`http://127.0.0.1:8000/admin/places?admin_id=${localStorage.getItem('userId')}`),
            ]);
            setStats({
                totalUsers:       uR.status === 'fulfilled' && Array.isArray(uR.value.data) ? uR.value.data.length : 0,
                totalItineraries: iR.status === 'fulfilled' ? (iR.value.data.count ?? 0) : 0,
                totalComplaints:  cR.status === 'fulfilled' && Array.isArray(cR.value.data) ? cR.value.data.length : 0,
                totalPlaces:      pR.status === 'fulfilled' ? (pR.value.data.count ?? 0) : 0,
            });
        } finally { setStatsLoading(false); }
    };

    const fetchUsers = async () => { setUsersLoading(true); try { const r = await axios.get('http://127.0.0.1:8000/users/'); setUsers(Array.isArray(r.data) ? r.data : []); } catch { showAlert('Failed to load users', 'error'); } finally { setUsersLoading(false); } };
    const fetchItineraries = async () => { setItinLoading(true); try { const r = await axios.get(`http://127.0.0.1:8000/admin/itineraries?admin_id=${localStorage.getItem('userId')}`); setItineraries(Array.isArray(r.data.itineraries) ? r.data.itineraries : []); } catch { showAlert('Failed to load itineraries', 'error'); } finally { setItinLoading(false); } };
    const fetchComplaints = async () => { setCompLoading(true); try { const r = await axios.get('http://127.0.0.1:8000/complaints/'); setComplaints(Array.isArray(r.data) ? r.data : []); } catch { showAlert('Failed to load complaints', 'error'); } finally { setCompLoading(false); } };
    const fetchPlaces = async () => { setPlacesLoading(true); try { const r = await axios.get(`http://127.0.0.1:8000/admin/places?admin_id=${localStorage.getItem('userId')}`); setPlaces(Array.isArray(r.data.places) ? r.data.places : []); } catch { showAlert('Failed to load places', 'error'); } finally { setPlacesLoading(false); } };
    const fetchCommunityPosts = async () => { setPostsLoading(true); try { const r = await axios.get(`http://127.0.0.1:8000/admin/posts?admin_id=${localStorage.getItem('userId')}`); setCommunityPosts(Array.isArray(r.data) ? r.data : []); } catch { showAlert('Failed to load posts', 'error'); } finally { setPostsLoading(false); } };
    const fetchReports = async () => { setReportsLoading(true); try { const r = await axios.get(`http://127.0.0.1:8000/admin/reports?admin_id=${localStorage.getItem('userId')}`); setReports(Array.isArray(r.data) ? r.data : []); } catch { showAlert('Failed to load reports', 'error'); } finally { setReportsLoading(false); } };
    const fetchPendingSubs = async () => { setSubsLoading(true); try { const r = await axios.get(`http://127.0.0.1:8000/subscriptions/admin/pending?admin_id=${localStorage.getItem('userId')}`); setPendingSubs(Array.isArray(r.data) ? r.data : []); } catch { } finally { setSubsLoading(false); } };

    const viewUserProfile = async (userId) => {
        setUserProfile({ open: true, loading: true, data: null });
        try {
            const r = await axios.get(`http://127.0.0.1:8000/admin/users/${userId}/profile?admin_id=${localStorage.getItem('userId')}`);
            setUserProfile({ open: true, loading: false, data: r.data });
        } catch { showAlert('Failed to load user profile', 'error'); setUserProfile({ open: false, loading: false, data: null }); }
    };

    const viewItinerary = async (id) => {
        setItinDetail({ open: true, loading: true, data: null });
        try {
            const r = await axios.get(`http://127.0.0.1:8000/itineraries/${id}`);
            setItinDetail({ open: true, loading: false, data: r.data });
        } catch { showAlert('Failed to load itinerary details', 'error'); setItinDetail({ open: false, loading: false, data: null }); }
    };

    const deleteUser       = async (id) => { try { await axios.delete(`http://127.0.0.1:8000/users/${id}`); setUsers(p => p.filter(u => u.id !== id)); setStats(s => ({ ...s, totalUsers: s.totalUsers - 1 })); showAlert('User deleted'); } catch { showAlert('Failed to delete user', 'error'); } };
    const deleteItinerary  = async (id) => { try { await axios.delete(`http://127.0.0.1:8000/itineraries/${id}`); setItineraries(p => p.filter(i => i.id !== id)); setStats(s => ({ ...s, totalItineraries: s.totalItineraries - 1 })); showAlert('Itinerary deleted'); } catch { showAlert('Failed to delete itinerary', 'error'); } };
    const resolveComplaint = async (id) => { try { await axios.patch(`http://127.0.0.1:8000/complaints/${id}`, { status: 'resolved' }); setComplaints(p => p.map(c => c.id === id ? { ...c, status: 'resolved' } : c)); showAlert('Complaint resolved'); } catch { showAlert('Failed to resolve', 'error'); } };
    const deleteComplaint  = async (id) => { try { await axios.delete(`http://127.0.0.1:8000/complaints/${id}`); setComplaints(p => p.filter(c => c.id !== id)); setStats(s => ({ ...s, totalComplaints: s.totalComplaints - 1 })); showAlert('Complaint deleted'); } catch { showAlert('Failed to delete', 'error'); } };
    const deletePost       = async (id) => { try { await axios.delete(`http://127.0.0.1:8000/admin/posts/${id}?admin_id=${localStorage.getItem('userId')}`); setCommunityPosts(p => p.filter(x => x.id !== id)); showAlert('Post deleted'); } catch { showAlert('Failed to delete post', 'error'); } };
    const promoteUser      = async (id) => { try { await axios.patch(`http://127.0.0.1:8000/users/${id}/role?role=admin&admin_id=${localStorage.getItem('userId')}`); setUsers(p => p.map(u => u.id === id ? { ...u, role: 'admin' } : u)); showAlert('User promoted to admin'); } catch { showAlert('Failed to promote user', 'error'); } };
    const demoteUser       = async (id) => { try { await axios.patch(`http://127.0.0.1:8000/users/${id}/role?role=user&admin_id=${localStorage.getItem('userId')}`); setUsers(p => p.map(u => u.id === id ? { ...u, role: 'user' } : u)); showAlert('User demoted to regular user'); } catch { showAlert('Failed to demote user', 'error'); } };
    const deletePlace      = async (id) => { try { await axios.delete(`http://127.0.0.1:8000/admin/places/${id}?admin_id=${localStorage.getItem('userId')}`); setPlaces(p => p.filter(x => x.id !== id)); showAlert('Place deleted'); } catch { showAlert('Failed to delete place', 'error'); } };
    const resolveReport    = async (id) => { try { await axios.patch(`http://127.0.0.1:8000/admin/reports/${id}?admin_id=${localStorage.getItem('userId')}&new_status=reviewed`); setReports(p => p.map(r => r.id === id ? { ...r, status: 'reviewed' } : r)); showAlert('Report marked as reviewed'); } catch { showAlert('Failed to update report', 'error'); } };
    const dismissReport    = async (id) => { try { await axios.patch(`http://127.0.0.1:8000/admin/reports/${id}?admin_id=${localStorage.getItem('userId')}&new_status=dismissed`); setReports(p => p.map(r => r.id === id ? { ...r, status: 'dismissed' } : r)); showAlert('Report dismissed'); } catch { showAlert('Failed to dismiss report', 'error'); } };
    const deleteReport     = async (id) => { try { await axios.delete(`http://127.0.0.1:8000/admin/reports/${id}?admin_id=${localStorage.getItem('userId')}`); setReports(p => p.filter(r => r.id !== id)); showAlert('Report deleted'); } catch { showAlert('Failed to delete report', 'error'); } };
    const deleteReportContent = async (id) => { try { await axios.delete(`http://127.0.0.1:8000/admin/reports/${id}/content?admin_id=${localStorage.getItem('userId')}`); setReports(p => p.map(r => r.id === id ? { ...r, status: 'reviewed' } : r)); showAlert('Reported content removed'); } catch { showAlert('Failed to remove content', 'error'); } };

    const activateSub = async (userId, plan) => {
        try {
            await axios.post(`http://127.0.0.1:8000/subscriptions/admin/activate/${userId}`, { admin_id: admin.id, plan });
            showAlert('Premium activated successfully');
            fetchPendingSubs();
            fetchUsers();
        } catch (e) { showAlert(e.response?.data?.detail || 'Activation failed', 'error'); }
    };
    const revokeSub = async (userId) => {
        try {
            await axios.post(`http://127.0.0.1:8000/subscriptions/admin/revoke/${userId}`, { admin_id: admin.id });
            showAlert('Subscription revoked');
            fetchPendingSubs();
            fetchUsers();
        } catch (e) { showAlert(e.response?.data?.detail || 'Revoke failed', 'error'); }
    };

    const handleSaveEmail = async () => {
        setSettingsError('');
        if (!newEmail.trim() || !newEmail.includes('@')) { setSettingsError('Enter a valid email address'); return; }
        setSettingsSaving(true);
        try {
            const r = await axios.patch(`http://127.0.0.1:8000/users/${admin.id}/credentials`, { email: newEmail.trim().toLowerCase() });
            localStorage.setItem('userEmail', r.data.email);
            setAdmin(prev => ({ ...prev, email: r.data.email }));
            showAlert('Email updated'); setSettingsOpen(false);
        } catch (err) { setSettingsError(err.response?.data?.detail || 'Failed to update email'); }
        finally { setSettingsSaving(false); }
    };

    const handleSavePassword = async () => {
        setSettingsError('');
        if (!currentPassword) { setSettingsError('Enter your current password'); return; }
        if (!newPassword) { setSettingsError('Enter a new password'); return; }
        if (newPassword.length < 6) { setSettingsError('Password must be at least 6 characters'); return; }
        if (newPassword !== confirmPassword) { setSettingsError('Passwords do not match'); return; }
        setSettingsSaving(true);
        try {
            await axios.patch(`http://127.0.0.1:8000/users/${admin.id}/credentials`, { current_password: currentPassword, new_password: newPassword });
            showAlert('Password updated'); setSettingsOpen(false);
            setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        } catch (err) { setSettingsError(err.response?.data?.detail || 'Failed to update password'); }
        finally { setSettingsSaving(false); }
    };

    const openSettings = () => { setSettingsError(''); setSettingsTab(0); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setSettingsOpen(true); };

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
    const getItinStatusColor    = (s) => ({ draft: '#a78bfa', planning: COLORS.brand, confirmed: '#4ade80', ongoing: '#fb923c', completed: COLORS.fadedText, cancelled: '#ff6b6b' }[s] || COLORS.fadedText);
    const getComplaintStatusColor = (s) => ({ open: '#ff6b6b', resolved: '#4ade80', pending: '#fb923c' }[s] || COLORS.fadedText);

    const filteredUsers       = users.filter(u => u.username?.toLowerCase().includes(search.toLowerCase()) || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));
    const filteredItineraries = itineraries.filter(i => i.title?.toLowerCase().includes(search.toLowerCase()) || i.destination?.toLowerCase().includes(search.toLowerCase()));
    const filteredComplaints  = complaints.filter(c => c.title?.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase()));
    const filteredPlaces      = places.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()) || p.address?.toLowerCase().includes(search.toLowerCase()) || (p.aliases || []).some(a => a.toLowerCase().includes(search.toLowerCase())));
    const filteredPosts       = communityPosts.filter(p => p.title?.toLowerCase().includes(search.toLowerCase()) || p.author_name?.toLowerCase().includes(search.toLowerCase()) || p.tag?.toLowerCase().includes(search.toLowerCase()));

    const tabLabels = [
        { label: 'Users',       count: stats.totalUsers,       color: COLORS.brand },
        { label: 'Itineraries', count: stats.totalItineraries, color: '#a78bfa' },
        { label: 'Posts',       count: communityPosts.length,  color: '#38bdf8' },
        { label: 'Complaints',  count: stats.totalComplaints,  color: '#fb923c' },
        { label: 'Places',      count: stats.totalPlaces,      color: '#4ade80' },
        { label: 'Reports',     count: reports.filter(r => r.status === 'pending').length, color: '#ff6b6b' },
        { label: 'Subscriptions', count: pendingSubs.length, color: '#FFC107' },
    ];
    const filteredReports = reports.filter(r => r.reason?.toLowerCase().includes(search.toLowerCase()) || r.reporter_username?.toLowerCase().includes(search.toLowerCase()) || r.post_title?.toLowerCase().includes(search.toLowerCase()));
    const filteredPendingSubs = pendingSubs.filter(s => {
        const q = search.toLowerCase();
        return !q
            || s.name?.toLowerCase().includes(q)
            || s.email?.toLowerCase().includes(q)
            || s.plan?.toLowerCase().includes(q)
            || s.payment_mobile?.toLowerCase().includes(q)
            || s.payment_transaction_id?.toLowerCase().includes(q);
    });

    // Plan presentation — shared between the Subscriptions tab chips and the
    // (later) analytics views. Keep in sync with backend PLAN_LABELS.
    const PLAN_STYLE = {
        monthly:   { label: 'Monthly',     price: 'NPR 299',   color: '#42A5F5' },
        trip_pass: { label: 'Trip Pass',   price: 'NPR 199',   color: '#66BB6A' },
        yearly:    { label: 'Annual',      price: 'NPR 1,999', color: '#AB47BC' },
    };
    const KHALTI_PURPLE_ADMIN = '#5C2D91';

    const TAG_COLORS = { Experience: '#33CCCC', Alert: '#FFB74D', Event: '#4CAF50', Tip: '#9C27B0', Question: '#42A5F5' };

    return (
        <Box sx={{ display: 'flex', bgcolor: COLORS.background, minHeight: '100vh', width: '100vw', position: 'fixed', top: 0, left: 0, overflow: 'hidden' }}>

            {/* The shared Navbar shows admin link automatically for admin role */}
            <Navbar />

            {/* ── MAIN CONTENT ───────────────────────────────────────────── */}
            <Box component="main" sx={{ flexGrow: 1, p: 3, height: '100vh', overflow: 'auto', bgcolor: COLORS.background }}>

                {/* Top Bar */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                    <Box>
                        <Typography variant="h4" fontWeight={800} sx={{ color: COLORS.headings, lineHeight: 1.1 }}>Admin Dashboard</Typography>
                        <Typography variant="body2" sx={{ color: COLORS.fadedText, mt: 0.3 }}>Manage users, itineraries and complaints</Typography>
                    </Box>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <TextField placeholder="Search across all tables…" variant="outlined" size="small"
                            value={search} onChange={e => setSearch(e.target.value)}
                            sx={{
                                width: 280,
                                '& .MuiOutlinedInput-root': { bgcolor: COLORS.cardPrimary, borderRadius: 4, color: COLORS.text, '& fieldset': { borderColor: 'transparent' }, '&:hover fieldset': { borderColor: COLORS.brand }, '&.Mui-focused fieldset': { borderColor: COLORS.brand } },
                                '& .MuiInputBase-input': { py: '10px' },
                                '& .MuiInputBase-input::placeholder': { color: COLORS.fadedText, opacity: 1 },
                            }}
                            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: COLORS.fadedText, fontSize: 18 }} /></InputAdornment> }}
                        />
                        <Tooltip title="Refresh all data">
                            <IconButton onClick={loadAll} sx={{ bgcolor: COLORS.cardPrimary, color: COLORS.brand, borderRadius: 2, '&:hover': { bgcolor: `${COLORS.brand}20` } }}>
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Account Settings">
                            <IconButton onClick={openSettings} sx={{ bgcolor: COLORS.cardPrimary, color: COLORS.icons, borderRadius: 2, '&:hover': { color: COLORS.brand, bgcolor: `${COLORS.brand}14` } }}>
                                <SettingsOutlinedIcon />
                            </IconButton>
                        </Tooltip>
                        <Avatar sx={{ bgcolor: COLORS.brand, color: COLORS.background, fontWeight: 'bold', width: 42, height: 42, cursor: 'pointer', '&:hover': { transform: 'scale(1.08)' }, transition: 'transform 0.2s' }} onClick={openSettings}>
                            {admin.initial}
                        </Avatar>
                    </Stack>
                </Stack>

                {alert.show && <Alert severity={alert.type} sx={{ mb: 3, borderRadius: 3 }} onClose={() => setAlert(a => ({ ...a, show: false }))}>{alert.msg}</Alert>}

                {/* Stat Cards */}
                <Stack direction="row" spacing={2.5} sx={{ mb: 4 }}>
                    <StatCard COLORS={COLORS} icon={<PeopleAltIcon sx={{ fontSize: 24, color: COLORS.brand }} />} label="Total Users" value={stats.totalUsers.toLocaleString()} trend="+12%" trendUp color={COLORS.brand} loading={statsLoading} />
                    <StatCard COLORS={COLORS} icon={<MapOutlinedIcon sx={{ fontSize: 24, color: '#a78bfa' }} />} label="Total Itineraries" value={stats.totalItineraries.toLocaleString()} trend="+8%" trendUp color="#a78bfa" loading={statsLoading} />
                    <StatCard COLORS={COLORS} icon={<ReportProblemOutlinedIcon sx={{ fontSize: 24, color: '#fb923c' }} />} label="Total Complaints" value={stats.totalComplaints.toLocaleString()} trend="-3%" trendUp={false} color="#fb923c" loading={statsLoading} />
                    <StatCard COLORS={COLORS} icon={<CheckCircleOutlineIcon sx={{ fontSize: 24, color: '#4ade80' }} />} label="Resolved" value={complaints.filter(c => c.status === 'resolved').length.toLocaleString()} trend="+5%" trendUp color="#4ade80" loading={statsLoading} />
                    <StatCard COLORS={COLORS} icon={<LocationOnIcon sx={{ fontSize: 24, color: '#38bdf8' }} />} label="Cached Places" value={stats.totalPlaces.toLocaleString()} color="#38bdf8" loading={statsLoading} />
                </Stack>

                {/* Tabs */}
                <Box sx={{ mb: 3 }}>
                    <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{
                        '& .MuiTab-root': { color: COLORS.fadedText, textTransform: 'none', fontWeight: 600, fontSize: '0.88rem', minHeight: 44 },
                        '& .Mui-selected': { color: COLORS.brand },
                        '& .MuiTabs-indicator': { bgcolor: COLORS.brand, height: 3, borderRadius: 2 },
                    }}>
                        {tabLabels.map((t, i) => (
                            <Tab key={i} label={
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <span>{t.label}</span>
                                    <Box sx={{ bgcolor: `${t.color}20`, color: t.color, border: `1px solid ${t.color}35`, borderRadius: 10, px: 1, py: 0.1, fontSize: '0.65rem', fontWeight: 700 }}>
                                        {statsLoading ? '—' : t.count}
                                    </Box>
                                </Stack>
                            } />
                        ))}
                    </Tabs>
                    <Divider sx={{ borderColor: COLORS.cardBorder }} />
                </Box>

                {/* Users Table */}
                {activeTab === 0 && (
                    <Box>
                        <SectionHeader COLORS={COLORS} title="All Users" onRefresh={fetchUsers} loading={usersLoading} />
                        <TableContainer component={Paper} sx={{ bgcolor: COLORS.cardPrimary, borderRadius: 4, boxShadow: 'none', border: `1px solid ${COLORS.cardBorder}` }}>
                            <Table size="small">
                                <TableHead><TableRow>{['#','Name','Email','Joined','Itineraries','Role',''].map((h, i) => <TableCell key={i} sx={{ ...thSx, textAlign: i === 6 ? 'right' : 'left' }}>{h}</TableCell>)}</TableRow></TableHead>
                                <TableBody>
                                    {usersLoading ? <LoadingRow COLORS={COLORS} cols={7} /> :
                                     filteredUsers.length === 0 ? <EmptyRow COLORS={COLORS} cols={7} msg="No users found." /> :
                                     filteredUsers.map((u, idx) => (
                                        <TableRow key={u.id} onClick={() => viewUserProfile(u.id)} sx={{ cursor: 'pointer', '&:hover': { bgcolor: `${COLORS.brand}0A` }, '&:last-child td': { borderBottom: 'none' } }}>
                                            <TableCell sx={{ ...tdSx, color: COLORS.fadedText }}>{idx + 1}</TableCell>
                                            <TableCell sx={tdSx}>
                                                <Stack direction="row" alignItems="center" spacing={1.5}>
                                                    <Avatar sx={{ width: 30, height: 30, bgcolor: COLORS.brand, color: COLORS.background, fontSize: '0.75rem', fontWeight: 700 }}>{(u.username || u.name || 'U')[0].toUpperCase()}</Avatar>
                                                    <Box>
                                                        <Typography sx={{ color: COLORS.headings, fontWeight: 600, fontSize: '0.82rem' }}>{u.username || '—'}</Typography>
                                                        {u.name && u.name !== u.username && <Typography sx={{ color: COLORS.fadedText, fontSize: '0.7rem' }}>{u.name}</Typography>}
                                                    </Box>
                                                </Stack>
                                            </TableCell>
                                            <TableCell sx={tdSx}><Stack direction="row" alignItems="center" spacing={0.5}><EmailOutlinedIcon sx={{ fontSize: 13, color: COLORS.fadedText }} /><span>{u.email || '—'}</span></Stack></TableCell>
                                            <TableCell sx={{ ...tdSx, color: COLORS.fadedText }}>{formatDate(u.created_at)}</TableCell>
                                            <TableCell sx={tdSx}><Box sx={{ bgcolor: `${COLORS.brand}1A`, color: COLORS.brand, borderRadius: 1.5, px: 1.2, py: 0.2, display: 'inline-block', fontSize: '0.75rem', fontWeight: 700 }}>{itineraries.filter(i => i.user_id === u.id).length}</Box></TableCell>
                                            <TableCell sx={tdSx}><StatusChip label={u.role?.toUpperCase() || 'USER'} color={u.role === 'admin' ? '#a78bfa' : COLORS.brand} /></TableCell>
                                            <TableCell sx={{ ...tdSx, textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                                                <RowMenu COLORS={COLORS}
                                                    onView={() => viewUserProfile(u.id)}
                                                    onResolve={u.role !== 'admin' ? () => promoteUser(u.id) : null}
                                                    resolveLabel="Promote to Admin"
                                                    onDismiss={u.role === 'admin' ? () => demoteUser(u.id) : null}
                                                    onDelete={() => deleteUser(u.id)} />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                )}

                {/* Itineraries Table */}
                {activeTab === 1 && (
                    <Box>
                        <SectionHeader COLORS={COLORS} title="All Itineraries" onRefresh={fetchItineraries} loading={itinLoading} />
                        <TableContainer component={Paper} sx={{ bgcolor: COLORS.cardPrimary, borderRadius: 4, boxShadow: 'none', border: `1px solid ${COLORS.cardBorder}` }}>
                            <Table size="small">
                                <TableHead><TableRow>{['#','Trip Name','Destination','Start','End','Budget','Activities','Status',''].map((h, i) => <TableCell key={i} sx={{ ...thSx, textAlign: i === 8 ? 'right' : 'left' }}>{h}</TableCell>)}</TableRow></TableHead>
                                <TableBody>
                                    {itinLoading ? <LoadingRow COLORS={COLORS} cols={9} /> :
                                     filteredItineraries.length === 0 ? <EmptyRow COLORS={COLORS} cols={9} msg="No itineraries found." /> :
                                     filteredItineraries.map((it, idx) => (
                                        <TableRow key={it.id} onClick={() => viewItinerary(it.id)} sx={{ cursor: 'pointer', '&:hover': { bgcolor: `${COLORS.brand}0A` }, '&:last-child td': { borderBottom: 'none' } }}>
                                            <TableCell sx={{ ...tdSx, color: COLORS.fadedText }}>{idx + 1}</TableCell>
                                            <TableCell sx={{ ...tdSx, color: COLORS.headings, fontWeight: 600 }}>{it.title}</TableCell>
                                            <TableCell sx={tdSx}><Stack direction="row" alignItems="center" spacing={0.5}><LocationOnIcon sx={{ fontSize: 12, color: '#ff6b6b' }} /><span>{it.destination}</span></Stack></TableCell>
                                            <TableCell sx={{ ...tdSx, color: COLORS.fadedText }}>{formatDate(it.start_date)}</TableCell>
                                            <TableCell sx={{ ...tdSx, color: COLORS.fadedText }}>{formatDate(it.end_date)}</TableCell>
                                            <TableCell sx={{ ...tdSx, color: COLORS.brand, fontWeight: 600 }}>{it.currency || 'NPR'} {it.estimated_budget?.toLocaleString() ?? '—'}</TableCell>
                                            <TableCell sx={tdSx}>
                                                <Stack direction="row" spacing={0.5} alignItems="center">
                                                    <Typography sx={{ color: COLORS.text, fontSize: '0.82rem' }}>{it.activities_count || 0}</Typography>
                                                    {it.mapped_count > 0 && <Chip label={`${it.mapped_count} mapped`} size="small" sx={{ height: 16, fontSize: '0.58rem', bgcolor: `${COLORS.brand}1A`, color: COLORS.brand, border: `1px solid ${COLORS.brand}40` }} />}
                                                </Stack>
                                            </TableCell>
                                            <TableCell sx={tdSx}><StatusChip label={it.status?.toUpperCase() || 'PLANNING'} color={getItinStatusColor(it.status)} /></TableCell>
                                            <TableCell sx={{ ...tdSx, textAlign: 'right' }} onClick={e => e.stopPropagation()}><RowMenu COLORS={COLORS} onView={() => viewItinerary(it.id)} onDelete={() => deleteItinerary(it.id)} /></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                )}

                {/* Posts Table */}
                {activeTab === 2 && (
                    <Box>
                        <SectionHeader COLORS={COLORS} title="All Community Posts" onRefresh={fetchCommunityPosts} loading={postsLoading} />
                        <TableContainer component={Paper} sx={{ bgcolor: COLORS.cardPrimary, borderRadius: 4, boxShadow: 'none', border: `1px solid ${COLORS.cardBorder}` }}>
                            <Table size="small">
                                <TableHead><TableRow>{['#','Title','Author','Tag','Place','Votes','Comments','Date',''].map((h, i) => <TableCell key={i} sx={{ ...thSx, textAlign: i === 8 ? 'right' : 'left' }}>{h}</TableCell>)}</TableRow></TableHead>
                                <TableBody>
                                    {postsLoading ? <LoadingRow COLORS={COLORS} cols={9} /> :
                                     filteredPosts.length === 0 ? <EmptyRow COLORS={COLORS} cols={9} msg="No posts found." /> :
                                     filteredPosts.map((p, idx) => (
                                        <TableRow key={p.id} sx={{ '&:hover': { bgcolor: 'rgba(56,189,248,0.03)' }, '&:last-child td': { borderBottom: 'none' } }}>
                                            <TableCell sx={{ ...tdSx, color: COLORS.fadedText }}>{idx + 1}</TableCell>
                                            <TableCell sx={{ ...tdSx, maxWidth: 220 }}><Typography noWrap sx={{ fontSize: '0.82rem', color: COLORS.headings, fontWeight: 600 }}>{p.title}</Typography></TableCell>
                                            <TableCell sx={tdSx}><Stack direction="row" alignItems="center" spacing={0.8}><Avatar sx={{ width: 22, height: 22, bgcolor: '#38bdf8', color: 'white', fontSize: '0.6rem', fontWeight: 700 }}>{(p.author_name || 'U')[0].toUpperCase()}</Avatar><Typography sx={{ fontSize: '0.78rem', color: COLORS.text }}>{p.author_name || `User #${p.user_id}`}</Typography></Stack></TableCell>
                                            <TableCell sx={tdSx}><Chip label={p.tag} size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 600, bgcolor: `${TAG_COLORS[p.tag] || COLORS.brand}18`, color: TAG_COLORS[p.tag] || COLORS.brand }} /></TableCell>
                                            <TableCell sx={tdSx}><Typography sx={{ fontSize: '0.78rem', color: p.place === 'All' ? COLORS.fadedText : COLORS.brand }}>{p.place}</Typography></TableCell>
                                            <TableCell sx={tdSx}><Stack direction="row" spacing={0.5} alignItems="center"><Typography sx={{ color: '#4ade80', fontSize: '0.78rem', fontWeight: 600 }}>+{p.upvotes || 0}</Typography><Typography sx={{ color: COLORS.fadedText, fontSize: '0.72rem' }}>/</Typography><Typography sx={{ color: '#ff6b6b', fontSize: '0.78rem' }}>-{p.downvotes || 0}</Typography></Stack></TableCell>
                                            <TableCell sx={tdSx}><Typography sx={{ color: COLORS.fadedText, fontSize: '0.78rem' }}>{p.comment_count ?? 0}</Typography></TableCell>
                                            <TableCell sx={{ ...tdSx, color: COLORS.fadedText }}>{formatDate(p.created_at)}</TableCell>
                                            <TableCell sx={{ ...tdSx, textAlign: 'right' }}><RowMenu COLORS={COLORS} onView={() => navigate('/community', { state: { highlightPostId: p.id } })} onDelete={() => deletePost(p.id)} /></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                )}

                {/* Complaints Table */}
                {activeTab === 3 && (
                    <Box>
                        <SectionHeader COLORS={COLORS} title="All Complaints" onRefresh={fetchComplaints} loading={compLoading} />
                        <TableContainer component={Paper} sx={{ bgcolor: COLORS.cardPrimary, borderRadius: 4, boxShadow: 'none', border: `1px solid ${COLORS.cardBorder}` }}>
                            <Table size="small">
                                <TableHead><TableRow>{['#','Title','Description','Submitted By','Date','Status',''].map((h, i) => <TableCell key={i} sx={{ ...thSx, textAlign: i === 6 ? 'right' : 'left' }}>{h}</TableCell>)}</TableRow></TableHead>
                                <TableBody>
                                    {compLoading ? <LoadingRow COLORS={COLORS} cols={7} /> :
                                     filteredComplaints.length === 0 ? <EmptyRow COLORS={COLORS} cols={7} msg="No complaints found." /> :
                                     filteredComplaints.map((c, idx) => (
                                        <TableRow key={c.id} sx={{ '&:hover': { bgcolor: 'rgba(251,146,60,0.03)' }, '&:last-child td': { borderBottom: 'none' } }}>
                                            <TableCell sx={{ ...tdSx, color: COLORS.fadedText }}>{idx + 1}</TableCell>
                                            <TableCell sx={{ ...tdSx, maxWidth: 180 }}><Typography noWrap sx={{ fontSize: '0.82rem', color: COLORS.headings, fontWeight: 600 }}>{c.title || '—'}</Typography></TableCell>
                                            <TableCell sx={{ ...tdSx, maxWidth: 220 }}><Typography noWrap sx={{ fontSize: '0.78rem', color: COLORS.fadedText }}>{c.description || '—'}</Typography></TableCell>
                                            <TableCell sx={tdSx}><Stack direction="row" alignItems="center" spacing={0.8}><Avatar sx={{ width: 22, height: 22, bgcolor: '#fb923c', color: 'white', fontSize: '0.6rem', fontWeight: 700 }}>{(c.user_name || c.user_id || 'U').toString()[0].toUpperCase()}</Avatar><Typography sx={{ fontSize: '0.78rem', color: COLORS.text }}>{c.user_name || `User #${c.user_id}` || '—'}</Typography></Stack></TableCell>
                                            <TableCell sx={{ ...tdSx, color: COLORS.fadedText }}>{formatDate(c.created_at)}</TableCell>
                                            <TableCell sx={tdSx}><StatusChip label={c.status?.toUpperCase() || 'OPEN'} color={getComplaintStatusColor(c.status || 'open')} /></TableCell>
                                            <TableCell sx={{ ...tdSx, textAlign: 'right' }}><RowMenu COLORS={COLORS} onView={() => setDetailDialog({ open: true, type: 'complaint', data: c })} onResolve={c.status !== 'resolved' ? () => resolveComplaint(c.id) : null} onDelete={() => deleteComplaint(c.id)} /></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                )}

                {/* Reports Table */}
                {activeTab === 5 && (
                    <Box>
                        <SectionHeader COLORS={COLORS} title="Reported Posts & Comments" onRefresh={fetchReports} loading={reportsLoading} />
                        <TableContainer component={Paper} sx={{ bgcolor: COLORS.cardPrimary, borderRadius: 4, boxShadow: 'none', border: `1px solid ${COLORS.cardBorder}` }}>
                            <Table size="small">
                                <TableHead><TableRow>{['#','Type','Content','Reason','Reporter','Date','Status',''].map((h, i) => <TableCell key={i} sx={{ ...thSx, textAlign: i === 7 ? 'right' : 'left' }}>{h}</TableCell>)}</TableRow></TableHead>
                                <TableBody>
                                    {reportsLoading ? <LoadingRow COLORS={COLORS} cols={8} /> :
                                     filteredReports.length === 0 ? <EmptyRow COLORS={COLORS} cols={8} msg="No reports found." /> :
                                     filteredReports.map((r, idx) => (
                                        <TableRow key={r.id} sx={{ '&:hover': { bgcolor: 'rgba(255,107,107,0.03)' }, '&:last-child td': { borderBottom: 'none' } }}>
                                            <TableCell sx={{ ...tdSx, color: COLORS.fadedText }}>{idx + 1}</TableCell>
                                            <TableCell sx={tdSx}>
                                                <Chip label={r.comment_id ? 'Comment' : 'Post'} size="small"
                                                    sx={{ height: 18, fontSize: '0.6rem', fontWeight: 600,
                                                        bgcolor: r.comment_id ? 'rgba(167,139,250,0.15)' : 'rgba(56,189,248,0.15)',
                                                        color: r.comment_id ? '#a78bfa' : '#38bdf8' }} />
                                            </TableCell>
                                            <TableCell sx={{ ...tdSx, maxWidth: 200 }}>
                                                <Typography noWrap sx={{ fontSize: '0.78rem', color: COLORS.headings, fontWeight: 600 }}>
                                                    {r.comment_id ? (r.comment_content || '—') : (r.post_title || '—')}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ ...tdSx, maxWidth: 180 }}>
                                                <Typography noWrap sx={{ fontSize: '0.78rem', color: COLORS.fadedText }}>{r.reason}</Typography>
                                            </TableCell>
                                            <TableCell sx={tdSx}>
                                                <Stack direction="row" alignItems="center" spacing={0.8}>
                                                    <Avatar sx={{ width: 22, height: 22, bgcolor: '#ff6b6b', color: 'white', fontSize: '0.6rem', fontWeight: 700 }}>{(r.reporter_username || 'U')[0].toUpperCase()}</Avatar>
                                                    <Typography sx={{ fontSize: '0.78rem', color: COLORS.text }}>{r.reporter_username || `User #${r.reporter_id}`}</Typography>
                                                </Stack>
                                            </TableCell>
                                            <TableCell sx={{ ...tdSx, color: COLORS.fadedText }}>{formatDate(r.created_at)}</TableCell>
                                            <TableCell sx={tdSx}>
                                                <StatusChip label={r.status?.toUpperCase() || 'PENDING'}
                                                    color={{ pending: '#ff6b6b', reviewed: '#4ade80', dismissed: COLORS.fadedText }[r.status] || '#ff6b6b'} />
                                            </TableCell>
                                            <TableCell sx={{ ...tdSx, textAlign: 'right' }}>
                                                <RowMenu COLORS={COLORS}
                                                    onResolve={() => deleteReportContent(r.id)}
                                                    resolveLabel="Remove Content"
                                                    onDismiss={r.status === 'pending' ? () => dismissReport(r.id) : null}
                                                    onDelete={() => deleteReport(r.id)}
                                                    deleteLabel="Delete Report" />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                )}

                {/* Places Table */}
                {activeTab === 4 && (
                    <Box>
                        <SectionHeader COLORS={COLORS} title="Cached Places & Search Aliases" onRefresh={fetchPlaces} loading={placesLoading} />
                        <TableContainer component={Paper} sx={{ bgcolor: COLORS.cardPrimary, borderRadius: 4, boxShadow: 'none', border: `1px solid ${COLORS.cardBorder}` }}>
                            <Table size="small">
                                <TableHead><TableRow>{['#','Place Name','Address','City','Rating','Search Aliases','Coords',''].map((h, i) => <TableCell key={i} sx={{ ...thSx, textAlign: i === 7 ? 'right' : 'left' }}>{h}</TableCell>)}</TableRow></TableHead>
                                <TableBody>
                                    {placesLoading ? <LoadingRow COLORS={COLORS} cols={8} /> :
                                     filteredPlaces.length === 0 ? <EmptyRow COLORS={COLORS} cols={8} msg="No cached places yet. Places are cached automatically when users search." /> :
                                     filteredPlaces.map((p, idx) => (
                                        <TableRow key={p.google_place_id || idx} sx={{ '&:hover': { bgcolor: 'rgba(56,189,248,0.03)' }, '&:last-child td': { borderBottom: 'none' } }}>
                                            <TableCell sx={{ ...tdSx, color: COLORS.fadedText }}>{idx + 1}</TableCell>
                                            <TableCell sx={tdSx}><Stack direction="row" alignItems="center" spacing={0.8}><LocationOnIcon sx={{ fontSize: 14, color: COLORS.brand, flexShrink: 0 }} /><Typography sx={{ fontSize: '0.82rem', color: COLORS.headings, fontWeight: 600 }}>{p.name}</Typography></Stack></TableCell>
                                            <TableCell sx={{ ...tdSx, maxWidth: 200 }}><Typography noWrap sx={{ fontSize: '0.78rem', color: COLORS.fadedText }}>{p.address || '—'}</Typography></TableCell>
                                            <TableCell sx={tdSx}>{p.city ? <Chip label={p.city} size="small" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 600, bgcolor: `${COLORS.brand}1A`, color: COLORS.brand, border: `1px solid ${COLORS.brand}33` }} /> : <Typography sx={{ color: COLORS.fadedText, fontSize: '0.78rem' }}>—</Typography>}</TableCell>
                                            <TableCell sx={tdSx}>{p.rating ? <Stack direction="row" alignItems="center" spacing={0.3}><Typography sx={{ color: '#FFD700', fontSize: '0.82rem', fontWeight: 600 }}>{p.rating}</Typography><Typography sx={{ color: COLORS.fadedText, fontSize: '0.7rem' }}>★</Typography></Stack> : <Typography sx={{ color: COLORS.fadedText, fontSize: '0.78rem' }}>—</Typography>}</TableCell>
                                            <TableCell sx={{ ...tdSx, maxWidth: 260 }}>{p.aliases?.length > 0 ? <Stack direction="row" flexWrap="wrap" gap={0.5}>{p.aliases.map((alias, ai) => <Chip key={ai} label={alias} size="small" sx={{ height: 20, fontSize: '0.62rem', fontWeight: 500, bgcolor: 'rgba(167,139,250,0.1)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.2)' }} />)}</Stack> : <Typography sx={{ color: COLORS.fadedText, fontSize: '0.72rem', fontStyle: 'italic' }}>no aliases yet</Typography>}</TableCell>
                                            <TableCell sx={tdSx}>{p.latitude && p.longitude ? <Typography sx={{ color: COLORS.fadedText, fontSize: '0.7rem', fontFamily: 'monospace' }}>{p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}</Typography> : <Typography sx={{ color: COLORS.fadedText, fontSize: '0.78rem' }}>—</Typography>}</TableCell>
                                            <TableCell sx={{ ...tdSx, textAlign: 'right' }} onClick={e => e.stopPropagation()}><RowMenu COLORS={COLORS} onDelete={() => deletePlace(p.id)} deleteLabel="Delete Place" /></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                )}

                {/* Subscriptions Table — activeTab === 6 */}
                {activeTab === 6 && (
                    <Box>
                        <SectionHeader COLORS={COLORS} title="Pending Upgrade Requests" onRefresh={fetchPendingSubs} loading={subsLoading} />
                        <TableContainer component={Paper} sx={{ bgcolor: COLORS.cardPrimary, borderRadius: 4, boxShadow: 'none', border: `1px solid ${COLORS.cardBorder}` }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        {['#','User','Email','Plan','Method','Khalti Mobile','Transaction ID','Amount','Requested',''].map((h, i) => (
                                            <TableCell key={i} sx={{ ...thSx, textAlign: i === 9 ? 'right' : 'left' }}>{h}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {subsLoading ? <LoadingRow COLORS={COLORS} cols={10} /> :
                                     filteredPendingSubs.length === 0 ? <EmptyRow COLORS={COLORS} cols={10} msg="No pending subscription requests." /> :
                                     filteredPendingSubs.map((req, idx) => {
                                        const planStyle = PLAN_STYLE[req.plan] || { label: req.plan || '—', price: '', color: COLORS.brand };
                                        const isKhalti  = (req.payment_method || '').toLowerCase() === 'khalti';
                                        return (
                                            <TableRow key={req.id} sx={{ '&:hover': { bgcolor: `${COLORS.brand}0A` }, '&:last-child td': { borderBottom: 'none' } }}>
                                                <TableCell sx={{ ...tdSx, color: COLORS.fadedText }}>{idx + 1}</TableCell>

                                                <TableCell sx={tdSx}>
                                                    <Stack direction="row" alignItems="center" spacing={1.5}>
                                                        <Avatar sx={{ width: 30, height: 30, bgcolor: COLORS.brand, color: COLORS.background, fontSize: '0.75rem', fontWeight: 700 }}>
                                                            {(req.name || 'U')[0].toUpperCase()}
                                                        </Avatar>
                                                        <Typography sx={{ color: COLORS.headings, fontWeight: 600, fontSize: '0.82rem' }}>{req.name || '—'}</Typography>
                                                    </Stack>
                                                </TableCell>

                                                <TableCell sx={tdSx}>
                                                    <Stack direction="row" alignItems="center" spacing={0.5}>
                                                        <EmailOutlinedIcon sx={{ fontSize: 13, color: COLORS.fadedText }} />
                                                        <span>{req.email || '—'}</span>
                                                    </Stack>
                                                </TableCell>

                                                <TableCell sx={tdSx}>
                                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                                        <Chip label={planStyle.label} size="small"
                                                            sx={{ height: 20, fontSize: '0.62rem', fontWeight: 700,
                                                                bgcolor: `${planStyle.color}18`, color: planStyle.color, border: `1px solid ${planStyle.color}44` }} />
                                                        {planStyle.price && (
                                                            <Typography sx={{ color: COLORS.fadedText, fontSize: '0.72rem' }}>· {planStyle.price}</Typography>
                                                        )}
                                                    </Stack>
                                                </TableCell>

                                                <TableCell sx={tdSx}>
                                                    {isKhalti ? (
                                                        <Chip
                                                            label={
                                                                <Stack direction="row" alignItems="center" spacing={0.5}>
                                                                    <Box sx={{ width: 13, height: 13, borderRadius: '50%', bgcolor: '#fff', color: KHALTI_PURPLE_ADMIN, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.58rem' }}>K</Box>
                                                                    <span>Khalti</span>
                                                                </Stack>
                                                            }
                                                            size="small"
                                                            sx={{ height: 20, fontSize: '0.62rem', fontWeight: 700, bgcolor: KHALTI_PURPLE_ADMIN, color: '#fff', '& .MuiChip-label': { px: 0.8 } }} />
                                                    ) : req.payment_method ? (
                                                        <Chip label={req.payment_method} size="small" sx={{ height: 20, fontSize: '0.62rem', fontWeight: 700, bgcolor: COLORS.cardSecondary, color: COLORS.text, border: `1px solid ${COLORS.cardBorder}` }} />
                                                    ) : (
                                                        <Typography sx={{ color: COLORS.fadedText, fontSize: '0.72rem', fontStyle: 'italic' }}>—</Typography>
                                                    )}
                                                </TableCell>

                                                <TableCell sx={tdSx}>
                                                    <Typography sx={{ color: req.payment_mobile ? COLORS.text : COLORS.fadedText, fontSize: '0.78rem', fontFamily: req.payment_mobile ? 'monospace' : 'inherit' }}>
                                                        {req.payment_mobile || '—'}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell sx={{ ...tdSx, maxWidth: 180 }}>
                                                    {req.payment_transaction_id ? (
                                                        <Tooltip title={req.payment_transaction_id}>
                                                            <Typography noWrap sx={{ color: COLORS.text, fontSize: '0.74rem', fontFamily: 'monospace', fontWeight: 600 }}>
                                                                {req.payment_transaction_id}
                                                            </Typography>
                                                        </Tooltip>
                                                    ) : (
                                                        <Typography sx={{ color: COLORS.fadedText, fontSize: '0.72rem', fontStyle: 'italic' }}>—</Typography>
                                                    )}
                                                </TableCell>

                                                <TableCell sx={tdSx}>
                                                    <Typography sx={{ color: req.payment_amount ? COLORS.brand : COLORS.fadedText, fontSize: '0.78rem', fontWeight: 700 }}>
                                                        {req.payment_amount ? `NPR ${Number(req.payment_amount).toLocaleString()}` : '—'}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell sx={{ ...tdSx, color: COLORS.fadedText }}>{formatDate(req.requested_at)}</TableCell>

                                                <TableCell sx={{ ...tdSx, textAlign: 'right' }}>
                                                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                                        <Tooltip title="Activate Premium">
                                                            <IconButton size="small" onClick={() => activateSub(req.id, req.plan)}
                                                                sx={{ color: '#4ade80', bgcolor: 'rgba(74,222,128,0.10)', borderRadius: 1.5, '&:hover': { bgcolor: 'rgba(74,222,128,0.20)' } }}>
                                                                <CheckCircleOutlineIcon sx={{ fontSize: 16 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Reject Request">
                                                            <IconButton size="small" onClick={() => revokeSub(req.id)}
                                                                sx={{ color: '#ff6b6b', bgcolor: 'rgba(255,107,107,0.10)', borderRadius: 1.5, '&:hover': { bgcolor: 'rgba(255,107,107,0.20)' } }}>
                                                                <CloseIcon sx={{ fontSize: 16 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        );
                                     })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                )}
            </Box>

            {/* ── Detail Dialog ─────────────────────────────────────────────── */}
            <Dialog open={detailDialog.open} onClose={() => setDetailDialog({ open: false, type: '', data: null })} maxWidth="sm" fullWidth
                PaperProps={{ sx: { bgcolor: COLORS.cardPrimary, borderRadius: 4, border: `1px solid ${COLORS.cardBorder}` } }}>
                <DialogTitle sx={{ color: COLORS.headings, fontWeight: 700, pb: 1 }}>
                    {detailDialog.type === 'user' ? 'User Details' : 'Complaint Details'}
                </DialogTitle>
                <DialogContent>
                    {detailDialog.type === 'user' && detailDialog.data && (
                        <Stack spacing={2} sx={{ pt: 1 }}>
                            <Stack direction="row" alignItems="center" spacing={2}>
                                <Avatar sx={{ width: 52, height: 52, bgcolor: COLORS.brand, color: COLORS.background, fontWeight: 800, fontSize: '1.3rem' }}>{(detailDialog.data.name || 'U')[0].toUpperCase()}</Avatar>
                                <Box><Typography fontWeight={700} sx={{ color: COLORS.headings, fontSize: '1rem' }}>{detailDialog.data.name}</Typography><Typography sx={{ color: COLORS.fadedText, fontSize: '0.82rem' }}>{detailDialog.data.email}</Typography></Box>
                            </Stack>
                            {[{ label: 'User ID', value: detailDialog.data.id }, { label: 'Role', value: detailDialog.data.role || 'user' }, { label: 'Joined', value: formatDate(detailDialog.data.created_at) }, { label: 'Itineraries', value: itineraries.filter(i => i.user_id === detailDialog.data.id).length }].map((row, i) => (
                                <Stack key={i} direction="row" justifyContent="space-between" sx={{ py: 1, borderBottom: `1px solid ${COLORS.cardBorder}` }}>
                                    <Typography sx={{ color: COLORS.fadedText, fontSize: '0.82rem' }}>{row.label}</Typography>
                                    <Typography sx={{ color: COLORS.text, fontSize: '0.82rem', fontWeight: 600 }}>{row.value}</Typography>
                                </Stack>
                            ))}
                        </Stack>
                    )}
                    {detailDialog.type === 'complaint' && detailDialog.data && (
                        <Stack spacing={1.5} sx={{ pt: 1 }}>
                            {[{ label: 'Title', value: detailDialog.data.title }, { label: 'Description', value: detailDialog.data.description }, { label: 'Submitted By', value: detailDialog.data.user_name || `User #${detailDialog.data.user_id}` }, { label: 'Date', value: formatDate(detailDialog.data.created_at) }, { label: 'Status', value: detailDialog.data.status || 'open' }].map((row, i) => (
                                <Stack key={i} direction="row" justifyContent="space-between" sx={{ py: 1, borderBottom: `1px solid ${COLORS.cardBorder}` }}>
                                    <Typography sx={{ color: COLORS.fadedText, fontSize: '0.82rem', minWidth: 100 }}>{row.label}</Typography>
                                    <Typography sx={{ color: COLORS.text, fontSize: '0.82rem', fontWeight: 600, textAlign: 'right', flex: 1 }}>{row.value}</Typography>
                                </Stack>
                            ))}
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDetailDialog({ open: false, type: '', data: null })} sx={{ color: COLORS.fadedText, textTransform: 'none' }}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* ── Itinerary Detail Dialog ────────────────────────────────────── */}
            <Dialog open={itinDetail.open} onClose={() => setItinDetail({ open: false, loading: false, data: null })} maxWidth="md" fullWidth
                PaperProps={{ sx: { bgcolor: COLORS.background, borderRadius: 4, border: `1px solid ${COLORS.cardBorder}`, height: 'calc(100vh - 48px)', maxHeight: 'calc(100vh - 48px)' } }}>
                {itinDetail.loading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 10 }}><CircularProgress sx={{ color: COLORS.brand }} /></Box>
                ) : itinDetail.data && (
                    <>
                        <DialogTitle sx={{ pb: 1, borderBottom: `1px solid ${COLORS.cardBorder}` }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography variant="h5" fontWeight={800} sx={{ color: COLORS.headings }}>{itinDetail.data.title}</Typography>
                                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 0.5 }}>
                                        <Stack direction="row" alignItems="center" spacing={0.3}><LocationOnIcon sx={{ fontSize: 13, color: '#ff6b6b' }} /><Typography sx={{ color: COLORS.fadedText, fontSize: '0.78rem' }}>{itinDetail.data.destination}</Typography></Stack>
                                        <StatusChip label={itinDetail.data.status?.toUpperCase() || 'PLANNING'} color={getItinStatusColor(itinDetail.data.status)} />
                                    </Stack>
                                </Box>
                                <IconButton onClick={() => setItinDetail({ open: false, loading: false, data: null })} sx={{ color: COLORS.fadedText, '&:hover': { color: '#ff6b6b' } }}><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
                            </Stack>
                        </DialogTitle>
                        <DialogContent sx={{ py: 2.5, '&::-webkit-scrollbar': { width: 5 }, '&::-webkit-scrollbar-thumb': { bgcolor: COLORS.cardBorder, borderRadius: 3 } }}>
                            <Stack direction="row" spacing={3} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
                                {[{ label: 'Dates', value: `${formatDate(itinDetail.data.start_date)} – ${formatDate(itinDetail.data.end_date)}` }, { label: 'Budget', value: `${itinDetail.data.currency || 'NPR'} ${itinDetail.data.estimated_budget?.toLocaleString() || '0'}` }, { label: 'Days', value: itinDetail.data.days?.length || 0 }, { label: 'Owner', value: `User #${itinDetail.data.user_id}` }].map((item, i) => (
                                    <Box key={i} sx={{ bgcolor: COLORS.cardPrimary, borderRadius: 2.5, px: 2, py: 1.2, minWidth: 110 }}>
                                        <Typography sx={{ color: COLORS.fadedText, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.2 }}>{item.label}</Typography>
                                        <Typography sx={{ color: COLORS.text, fontSize: '0.88rem', fontWeight: 600 }}>{item.value}</Typography>
                                    </Box>
                                ))}
                            </Stack>
                            {itinDetail.data.description && <Typography sx={{ color: COLORS.fadedText, fontSize: '0.85rem', mb: 2.5, lineHeight: 1.6 }}>{itinDetail.data.description}</Typography>}
                            <Typography variant="subtitle1" fontWeight={700} sx={{ color: COLORS.headings, mb: 1.5 }}>Day-by-Day Plan</Typography>
                            <Stack spacing={2}>
                                {(itinDetail.data.days || []).map((day) => (
                                    <Card key={day.id || day.day_number} sx={{ bgcolor: COLORS.cardPrimary, borderRadius: 3, border: `1px solid ${COLORS.cardBorder}`, boxShadow: 'none' }}>
                                        <Box sx={{ px: 2.5, py: 1.5, borderBottom: `1px solid ${COLORS.cardBorder}`, bgcolor: `${COLORS.brand}08` }}>
                                            <Stack direction="row" spacing={1.5} alignItems="center">
                                                <Box sx={{ width: 28, height: 28, borderRadius: 1.5, bgcolor: `${COLORS.brand}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Typography sx={{ color: COLORS.brand, fontSize: '0.72rem', fontWeight: 800 }}>{day.day_number}</Typography>
                                                </Box>
                                                <Typography sx={{ color: COLORS.subheadings, fontWeight: 600, fontSize: '0.9rem' }}>Day {day.day_number}</Typography>
                                                <Typography sx={{ color: COLORS.fadedText, fontSize: '0.78rem' }}>{formatDate(day.date)}</Typography>
                                                {day.title && day.title !== `Day ${day.day_number}` && <Typography sx={{ color: COLORS.fadedText, fontSize: '0.78rem', fontStyle: 'italic' }}>— {day.title}</Typography>}
                                            </Stack>
                                        </Box>
                                        <Box sx={{ px: 2.5, py: 1.5 }}>
                                            {(!day.activities || day.activities.length === 0) ? (
                                                <Typography sx={{ color: COLORS.fadedText, fontSize: '0.8rem', fontStyle: 'italic' }}>No activities planned</Typography>
                                            ) : (
                                                <Stack spacing={1.2}>
                                                    {day.activities.map((act, ai) => (
                                                        <Stack key={act.id || ai} direction="row" spacing={1.5} alignItems="flex-start">
                                                            <LocationOnIcon sx={{ fontSize: 14, color: COLORS.brand, mt: 0.3, flexShrink: 0 }} />
                                                            <Box sx={{ flex: 1 }}>
                                                                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                                                    <Typography sx={{ color: COLORS.text, fontSize: '0.85rem', fontWeight: 600 }}>{act.title || act.location}</Typography>
                                                                    {act.start_time && <Typography sx={{ color: COLORS.fadedText, fontSize: '0.72rem' }}>@ {act.start_time}</Typography>}
                                                                    {act.place_id && <Chip label="Mapped" size="small" sx={{ height: 16, fontSize: '0.58rem', bgcolor: `${COLORS.brand}1A`, color: COLORS.brand, border: `1px solid ${COLORS.brand}40` }} />}
                                                                    {act.activity_type && <Chip label={act.activity_type} size="small" sx={{ height: 16, fontSize: '0.58rem', bgcolor: COLORS.cardSecondary, color: COLORS.fadedText }} />}
                                                                </Stack>
                                                                {act.description && <Typography sx={{ color: COLORS.fadedText, fontSize: '0.78rem', mt: 0.2 }}>{act.description}</Typography>}
                                                                {act.formatted_address && <Typography sx={{ color: COLORS.fadedText, fontSize: '0.72rem', mt: 0.2, opacity: 0.7 }}>{act.formatted_address}</Typography>}
                                                                {act.cost > 0 && <Typography sx={{ color: COLORS.brand, fontSize: '0.72rem', mt: 0.2 }}>Budget: {itinDetail.data.currency || 'NPR'} {act.cost.toLocaleString()}</Typography>}
                                                            </Box>
                                                        </Stack>
                                                    ))}
                                                </Stack>
                                            )}
                                        </Box>
                                    </Card>
                                ))}
                            </Stack>
                        </DialogContent>
                        <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${COLORS.cardBorder}` }}>
                            <Button onClick={() => setItinDetail({ open: false, loading: false, data: null })} sx={{ color: COLORS.fadedText, textTransform: 'none', borderRadius: 2 }}>Close</Button>
                            <Button onClick={() => { deleteItinerary(itinDetail.data.id); setItinDetail({ open: false, loading: false, data: null }); }} startIcon={<DeleteOutlineIcon sx={{ fontSize: 15 }} />} sx={{ color: '#ff6b6b', textTransform: 'none', borderRadius: 2, bgcolor: 'rgba(255,107,107,0.08)', '&:hover': { bgcolor: 'rgba(255,107,107,0.15)' } }}>Delete Itinerary</Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* ── User Profile Dialog ──────────────────────────────────────── */}
            <Dialog open={userProfile.open} onClose={() => setUserProfile({ open: false, loading: false, data: null })} maxWidth="md" fullWidth
                PaperProps={{ sx: { bgcolor: COLORS.background, borderRadius: 4, border: `1px solid ${COLORS.cardBorder}`, height: 'calc(100vh - 48px)', maxHeight: 'calc(100vh - 48px)' } }}>
                {userProfile.loading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 10 }}><CircularProgress sx={{ color: COLORS.brand }} /></Box>
                ) : userProfile.data && (
                    <>
                        <DialogTitle sx={{ pb: 1, borderBottom: `1px solid ${COLORS.cardBorder}` }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Avatar sx={{ width: 48, height: 48, bgcolor: COLORS.brand, color: COLORS.background, fontWeight: 800, fontSize: '1.2rem' }}>{(userProfile.data.user.username || userProfile.data.user.name || 'U')[0].toUpperCase()}</Avatar>
                                    <Box>
                                        <Typography variant="h6" fontWeight={800} sx={{ color: COLORS.headings }}>{userProfile.data.user.username || userProfile.data.user.name}</Typography>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Typography sx={{ color: COLORS.fadedText, fontSize: '0.78rem' }}>{userProfile.data.user.email}</Typography>
                                            <StatusChip label={userProfile.data.user.role?.toUpperCase() || 'USER'} color={userProfile.data.user.role === 'admin' ? '#a78bfa' : COLORS.brand} />
                                        </Stack>
                                    </Box>
                                </Stack>
                                <IconButton onClick={() => setUserProfile({ open: false, loading: false, data: null })} sx={{ color: COLORS.fadedText, '&:hover': { color: '#ff6b6b' } }}><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
                            </Stack>
                        </DialogTitle>
                        <DialogContent sx={{ py: 2.5, '&::-webkit-scrollbar': { width: 5 }, '&::-webkit-scrollbar-thumb': { bgcolor: COLORS.cardBorder, borderRadius: 3 } }}>
                            <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                                {[{ label: 'Joined', value: formatDate(userProfile.data.user.created_at) }, { label: 'Itineraries', value: userProfile.data.stats.total_itineraries }, { label: 'Posts', value: userProfile.data.stats.total_posts }, { label: 'Total Upvotes', value: userProfile.data.stats.total_upvotes }, { label: 'Last Login', value: userProfile.data.user.last_login ? formatDate(userProfile.data.user.last_login) : 'Never' }].map((item, i) => (
                                    <Box key={i} sx={{ bgcolor: COLORS.cardPrimary, borderRadius: 2.5, px: 2, py: 1.2, flex: 1, textAlign: 'center' }}>
                                        <Typography sx={{ color: COLORS.fadedText, fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.2 }}>{item.label}</Typography>
                                        <Typography sx={{ color: COLORS.text, fontSize: '0.9rem', fontWeight: 700 }}>{item.value}</Typography>
                                    </Box>
                                ))}
                            </Stack>
                            {userProfile.data.user.bio && <Typography sx={{ color: COLORS.fadedText, fontSize: '0.82rem', mb: 2, fontStyle: 'italic' }}>{userProfile.data.user.bio}</Typography>}
                            <Typography variant="subtitle1" fontWeight={700} sx={{ color: COLORS.headings, mb: 1.5 }}>Itineraries ({userProfile.data.itineraries.length})</Typography>
                            {userProfile.data.itineraries.length === 0 ? (
                                <Typography sx={{ color: COLORS.fadedText, fontSize: '0.82rem', mb: 3, fontStyle: 'italic' }}>No itineraries yet</Typography>
                            ) : (
                                <Stack spacing={1} sx={{ mb: 3 }}>
                                    {userProfile.data.itineraries.map((itin) => (
                                        <Card key={itin.id} onClick={() => { setUserProfile({ open: false, loading: false, data: null }); viewItinerary(itin.id); }}
                                            sx={{ bgcolor: COLORS.cardPrimary, borderRadius: 2.5, border: `1px solid ${COLORS.cardBorder}`, boxShadow: 'none', cursor: 'pointer', '&:hover': { border: `1px solid ${COLORS.brand}30`, bgcolor: `${COLORS.brand}08` }, transition: 'all 0.2s' }}>
                                            <Box sx={{ px: 2, py: 1.5 }}>
                                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                    <Box>
                                                        <Typography sx={{ color: COLORS.headings, fontSize: '0.88rem', fontWeight: 600 }}>{itin.title}</Typography>
                                                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 0.3 }}>
                                                            <Stack direction="row" spacing={0.3} alignItems="center"><LocationOnIcon sx={{ fontSize: 11, color: '#ff6b6b' }} /><Typography sx={{ color: COLORS.fadedText, fontSize: '0.72rem' }}>{itin.destination}</Typography></Stack>
                                                            <Typography sx={{ color: COLORS.fadedText, fontSize: '0.72rem' }}>{formatDate(itin.start_date)} – {formatDate(itin.end_date)}</Typography>
                                                            <Typography sx={{ color: COLORS.brand, fontSize: '0.72rem', fontWeight: 600 }}>{itin.days_count} days · {itin.activities_count} activities</Typography>
                                                        </Stack>
                                                    </Box>
                                                    <StatusChip label={itin.status?.toUpperCase() || 'PLANNING'} color={getItinStatusColor(itin.status)} />
                                                </Stack>
                                            </Box>
                                        </Card>
                                    ))}
                                </Stack>
                            )}
                            <Typography variant="subtitle1" fontWeight={700} sx={{ color: COLORS.headings, mb: 1.5 }}>Community Posts ({userProfile.data.posts.length})</Typography>
                            {userProfile.data.posts.length === 0 ? (
                                <Typography sx={{ color: COLORS.fadedText, fontSize: '0.82rem', fontStyle: 'italic' }}>No posts yet</Typography>
                            ) : (
                                <Stack spacing={1}>
                                    {userProfile.data.posts.map((post) => {
                                        const tagColor = TAG_COLORS[post.tag] || COLORS.brand;
                                        return (
                                            <Card key={post.id} sx={{ bgcolor: COLORS.cardPrimary, borderRadius: 2.5, border: `1px solid ${COLORS.cardBorder}`, boxShadow: 'none' }}>
                                                <Box sx={{ px: 2, py: 1.5 }}>
                                                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                                                                <Chip label={post.tag} size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 600, bgcolor: `${tagColor}18`, color: tagColor }} />
                                                                {post.place && post.place !== 'All' && <Typography sx={{ color: COLORS.brand, fontSize: '0.68rem' }}>{post.place}</Typography>}
                                                                <Typography sx={{ color: COLORS.fadedText, fontSize: '0.68rem' }}>{formatDate(post.created_at)}</Typography>
                                                            </Stack>
                                                            <Typography sx={{ color: COLORS.headings, fontSize: '0.85rem', fontWeight: 600 }}>{post.title}</Typography>
                                                            {post.body && <Typography noWrap sx={{ color: COLORS.fadedText, fontSize: '0.75rem', mt: 0.3, maxWidth: 500 }}>{post.body}</Typography>}
                                                        </Box>
                                                        <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 2, flexShrink: 0 }}>
                                                            <Typography sx={{ color: '#4ade80', fontSize: '0.78rem', fontWeight: 600 }}>+{post.upvotes}</Typography>
                                                            <Typography sx={{ color: '#ff6b6b', fontSize: '0.78rem' }}>-{post.downvotes}</Typography>
                                                        </Stack>
                                                    </Stack>
                                                </Box>
                                            </Card>
                                        );
                                    })}
                                </Stack>
                            )}
                        </DialogContent>
                        <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${COLORS.cardBorder}` }}>
                            <Button onClick={() => setUserProfile({ open: false, loading: false, data: null })} sx={{ color: COLORS.fadedText, textTransform: 'none', borderRadius: 2 }}>Close</Button>
                            <Button onClick={() => { deleteUser(userProfile.data.user.id); setUserProfile({ open: false, loading: false, data: null }); }} startIcon={<DeleteOutlineIcon sx={{ fontSize: 15 }} />} sx={{ color: '#ff6b6b', textTransform: 'none', borderRadius: 2, bgcolor: 'rgba(255,107,107,0.08)', '&:hover': { bgcolor: 'rgba(255,107,107,0.15)' } }}>Delete User</Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* ── Settings Dialog ────────────────────────────────────────────── */}
            <Dialog open={settingsOpen} onClose={() => { setSettingsOpen(false); setSettingsError(''); }} maxWidth="xs" fullWidth
                PaperProps={{ sx: { bgcolor: COLORS.cardPrimary, borderRadius: 4, border: `1px solid ${COLORS.cardBorder}` } }}>
                <DialogTitle sx={{ pb: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: `${COLORS.brand}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <SettingsOutlinedIcon sx={{ fontSize: 18, color: COLORS.brand }} />
                        </Box>
                        <Box>
                            <Typography fontWeight={700} sx={{ color: COLORS.headings, fontSize: '1rem' }}>Account Settings</Typography>
                            <Typography sx={{ color: COLORS.fadedText, fontSize: '0.72rem' }}>Update your admin credentials</Typography>
                        </Box>
                    </Stack>
                </DialogTitle>
                <DialogContent sx={{ pb: 0 }}>
                    <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
                        {[{ label: 'Email', icon: <EmailOutlinedIcon sx={{ fontSize: 15 }} /> }, { label: 'Password', icon: <LockOutlinedIcon sx={{ fontSize: 15 }} /> }].map((t, i) => (
                            <Button key={i} onClick={() => { setSettingsTab(i); setSettingsError(''); }} startIcon={t.icon} size="small"
                                sx={{ flex: 1, borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', bgcolor: settingsTab === i ? `${COLORS.brand}20` : COLORS.cardSecondary, color: settingsTab === i ? COLORS.brand : COLORS.fadedText, border: settingsTab === i ? `1px solid ${COLORS.brand}4D` : '1px solid transparent', '&:hover': { bgcolor: `${COLORS.brand}14`, color: COLORS.brand } }}>
                                {t.label}
                            </Button>
                        ))}
                    </Stack>
                    {settingsError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2, bgcolor: 'rgba(255,107,107,0.1)', color: '#ff6b6b', border: '1px solid rgba(255,107,107,0.25)', '& .MuiAlert-icon': { color: '#ff6b6b' } }}>{settingsError}</Alert>}
                    {settingsTab === 0 && (
                        <Stack spacing={2}>
                            <Typography variant="caption" sx={{ color: COLORS.fadedText }}>Current email: <strong style={{ color: COLORS.text }}>{admin.email || '—'}</strong></Typography>
                            <TextField fullWidth label="New Email" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} sx={inputSx} />
                        </Stack>
                    )}
                    {settingsTab === 1 && (
                        <Stack spacing={2}>
                            <TextField fullWidth label="Current Password" type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} sx={inputSx} InputProps={{ endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={() => setShowCurrent(p => !p)} sx={{ color: COLORS.fadedText }}>{showCurrent ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}</IconButton></InputAdornment> }} />
                            <TextField fullWidth label="New Password" type={showNew ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} helperText="Minimum 6 characters" sx={inputSx} InputProps={{ endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={() => setShowNew(p => !p)} sx={{ color: COLORS.fadedText }}>{showNew ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}</IconButton></InputAdornment> }} />
                            <TextField fullWidth label="Confirm New Password" type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} sx={inputSx} InputProps={{ endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={() => setShowConfirm(p => !p)} sx={{ color: COLORS.fadedText }}>{showConfirm ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}</IconButton></InputAdornment> }} />
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2.5, gap: 1 }}>
                    <Button onClick={() => { setSettingsOpen(false); setSettingsError(''); }} sx={{ color: COLORS.fadedText, textTransform: 'none', borderRadius: 2 }}>Cancel</Button>
                    <Button onClick={settingsTab === 0 ? handleSaveEmail : handleSavePassword} disabled={settingsSaving} variant="contained"
                        startIcon={settingsSaving ? <CircularProgress size={14} sx={{ color: COLORS.background }} /> : null}
                        sx={{ bgcolor: COLORS.brand, color: COLORS.background, borderRadius: 2, fontWeight: 700, textTransform: 'none', '&:hover': { bgcolor: '#29b8b8' }, '&:disabled': { opacity: 0.6 } }}>
                        {settingsSaving ? 'Saving…' : `Update ${settingsTab === 0 ? 'Email' : 'Password'}`}
                    </Button>
                </DialogActions>
            </Dialog>

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </Box>
    );
};

export default AdminDashboard;