import React, { useState, useEffect } from 'react';
import {
    Box, Button, Typography, Stack, IconButton, Card,
    TextField, InputAdornment, Avatar, Chip, Drawer,
    List, ListItem, ListItemButton, ListItemIcon, ListItemText,
    Divider, Alert, CircularProgress,
    Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Tabs, Tab,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Menu, MenuItem, Tooltip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import LogoutIcon from '@mui/icons-material/Logout';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import RefreshIcon from '@mui/icons-material/Refresh';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const COLORS = {
    brand:         '#33CCCC',
    background:    '#141627',
    cardPrimary:   '#252845',
    cardSecondary: 'rgba(255,255,255,0.1)',
    headings:      '#B0D2EB',
    subheadings:   '#C0D2EB',
    text:          '#D0D2EB',
    fadedText:     '#7B809A',
    icons:         '#B0D2EB',
    error:         '#ff6b6b',
    purple:        '#a78bfa',
    orange:        '#fb923c',
    green:         '#4ade80',
};

const drawerWidth = 240;

const inputSx = {
    '& .MuiOutlinedInput-root': {
        bgcolor: 'rgba(255,255,255,0.05)',
        borderRadius: 2,
        color: COLORS.text,
        '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
        '&:hover fieldset': { borderColor: COLORS.brand },
        '&.Mui-focused fieldset': { borderColor: COLORS.brand },
    },
    '& .MuiInputLabel-root': { color: COLORS.fadedText },
    '& .MuiInputLabel-root.Mui-focused': { color: COLORS.brand },
    '& .MuiInputBase-input': { color: COLORS.text },
    '& .MuiFormHelperText-root': { color: COLORS.fadedText },
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, trend, trendUp, color, loading }) => (
    <Card sx={{
        bgcolor: COLORS.cardPrimary, borderRadius: 4, p: 3, flex: 1,
        border: '1px solid rgba(255,255,255,0.04)',
        transition: 'all 0.25s',
        '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 10px 28px ${color}25`, borderColor: `${color}40` }
    }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box>
                <Typography sx={{ color: COLORS.fadedText, fontSize: '0.72rem', letterSpacing: 1, textTransform: 'uppercase', mb: 0.5 }}>
                    {label}
                </Typography>
                {loading
                    ? <CircularProgress size={22} sx={{ color, mt: 0.5 }} />
                    : <Typography variant="h3" fontWeight={800} sx={{ color: 'white', lineHeight: 1.1, mb: 0.75 }}>{value}</Typography>
                }
                {trend && !loading && (
                    <Stack direction="row" alignItems="center" spacing={0.4}>
                        {trendUp
                            ? <TrendingUpIcon sx={{ fontSize: 14, color: COLORS.green }} />
                            : <TrendingDownIcon sx={{ fontSize: 14, color: COLORS.error }} />}
                        <Typography sx={{ color: trendUp ? COLORS.green : COLORS.error, fontSize: '0.72rem' }}>
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

const SectionHeader = ({ title, onRefresh, loading }) => (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight={700} sx={{ color: COLORS.headings }}>{title}</Typography>
        <Tooltip title="Refresh">
            <IconButton size="small" onClick={onRefresh} disabled={loading}
                sx={{ color: COLORS.brand, bgcolor: 'rgba(51,204,204,0.08)', borderRadius: 2, '&:hover': { bgcolor: 'rgba(51,204,204,0.16)' } }}>
                <RefreshIcon sx={{ fontSize: 16, ...(loading && { animation: 'spin 1s linear infinite' }) }} />
            </IconButton>
        </Tooltip>
    </Stack>
);

const thSx = {
    color: COLORS.fadedText, fontSize: '0.68rem', fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: 1,
    borderBottom: '1px solid rgba(255,255,255,0.07)',
    bgcolor: 'rgba(255,255,255,0.02)', py: 1.5,
};
const tdSx = {
    color: COLORS.text, fontSize: '0.82rem',
    borderBottom: '1px solid rgba(255,255,255,0.04)', py: 1.2,
};

const StatusChip = ({ label, color }) => (
    <Chip label={label} size="small" sx={{
        height: 20, fontSize: '0.62rem', fontWeight: 700,
        bgcolor: `${color}18`, color, border: `1px solid ${color}30`,
    }} />
);

const RowMenu = ({ onView, onDelete, onResolve }) => {
    const [anchor, setAnchor] = useState(null);
    return (
        <>
            <IconButton size="small" onClick={e => setAnchor(e.currentTarget)}
                sx={{ color: COLORS.fadedText, borderRadius: 1.5, '&:hover': { color: COLORS.brand, bgcolor: 'rgba(51,204,204,0.08)' } }}>
                <MoreVertIcon sx={{ fontSize: 16 }} />
            </IconButton>
            <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}
                PaperProps={{ sx: { bgcolor: COLORS.cardPrimary, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2, minWidth: 140 } }}>
                {onView && (
                    <MenuItem onClick={() => { onView(); setAnchor(null); }}
                        sx={{ color: COLORS.text, fontSize: '0.82rem', gap: 1, '&:hover': { bgcolor: 'rgba(51,204,204,0.08)' } }}>
                        <VisibilityOutlinedIcon sx={{ fontSize: 15, color: COLORS.brand }} /> View
                    </MenuItem>
                )}
                {onResolve && (
                    <MenuItem onClick={() => { onResolve(); setAnchor(null); }}
                        sx={{ color: COLORS.text, fontSize: '0.82rem', gap: 1, '&:hover': { bgcolor: 'rgba(51,204,204,0.08)' } }}>
                        <CheckCircleOutlineIcon sx={{ fontSize: 15, color: COLORS.green }} /> Resolve
                    </MenuItem>
                )}
                {onDelete && (
                    <MenuItem onClick={() => { onDelete(); setAnchor(null); }}
                        sx={{ color: COLORS.error, fontSize: '0.82rem', gap: 1, '&:hover': { bgcolor: 'rgba(255,107,107,0.08)' } }}>
                        <DeleteOutlineIcon sx={{ fontSize: 15 }} /> Delete
                    </MenuItem>
                )}
            </Menu>
        </>
    );
};

const EmptyRow = ({ cols, msg }) => (
    <TableRow>
        <TableCell colSpan={cols} sx={{ ...tdSx, textAlign: 'center', py: 5, color: COLORS.fadedText, borderBottom: 'none' }}>
            {msg}
        </TableCell>
    </TableRow>
);

const LoadingRow = ({ cols }) => (
    <TableRow>
        <TableCell colSpan={cols} sx={{ ...tdSx, textAlign: 'center', py: 4, borderBottom: 'none' }}>
            <CircularProgress size={24} sx={{ color: COLORS.brand }} />
        </TableCell>
    </TableRow>
);

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
const AdminDashboard = () => {
    const navigate = useNavigate();

    const [admin, setAdmin] = useState({ id: null, name: 'Admin', initial: 'A', email: '' });
    const [activeTab, setActiveTab] = useState(0);
    const [search, setSearch] = useState('');

    const [stats, setStats] = useState({ totalUsers: 0, totalItineraries: 0, totalComplaints: 0, totalPlaces: 0 });
    const [users, setUsers] = useState([]);
    const [itineraries, setItineraries] = useState([]);
    const [complaints, setComplaints] = useState([]);
    const [places, setPlaces] = useState([]);
    const [communityPosts, setCommunityPosts] = useState([]);

    const [statsLoading, setStatsLoading] = useState(false);
    const [usersLoading, setUsersLoading] = useState(false);
    const [itinLoading, setItinLoading] = useState(false);
    const [compLoading, setCompLoading] = useState(false);
    const [placesLoading, setPlacesLoading] = useState(false);
    const [postsLoading, setPostsLoading] = useState(false);

    const [alert, setAlert] = useState({ show: false, msg: '', type: 'success' });
    const [detailDialog, setDetailDialog] = useState({ open: false, type: '', data: null });

    // itinerary detail viewer
    const [itinDetail, setItinDetail] = useState({ open: false, loading: false, data: null });

    // user profile viewer — shows user's itineraries + posts
    const [userProfile, setUserProfile] = useState({ open: false, loading: false, data: null });

    // Settings dialog state
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [settingsTab, setSettingsTab] = useState(0); // 0=email, 1=password
    const [settingsSaving, setSettingsSaving] = useState(false);
    const [settingsError, setSettingsError] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        const userId = localStorage.getItem('userId');
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

    const loadAll = () => { fetchStats(); fetchUsers(); fetchItineraries(); fetchComplaints(); fetchPlaces(); fetchCommunityPosts(); };

    const fetchStats = async () => {
        setStatsLoading(true);
        try {
            const [uR, iR, cR, pR] = await Promise.allSettled([
                axios.get('http://127.0.0.1:8000/users/'),
                axios.get('http://127.0.0.1:8000/debug/itineraries'),
                axios.get('http://127.0.0.1:8000/complaints/'),
                axios.get(`http://127.0.0.1:8000/admin/places?admin_id=${admin.id || localStorage.getItem('userId')}`),
            ]);
            setStats({
                totalUsers:       uR.status === 'fulfilled' && Array.isArray(uR.value.data) ? uR.value.data.length : 0,
                totalItineraries: iR.status === 'fulfilled' ? (iR.value.data.count ?? 0) : 0,
                totalComplaints:  cR.status === 'fulfilled' && Array.isArray(cR.value.data) ? cR.value.data.length : 0,
                totalPlaces:      pR.status === 'fulfilled' ? (pR.value.data.count ?? 0) : 0,
            });
        } finally { setStatsLoading(false); }
    };

    const fetchUsers = async () => {
        setUsersLoading(true);
        try {
            const res = await axios.get('http://127.0.0.1:8000/users/');
            setUsers(Array.isArray(res.data) ? res.data : []);
        } catch { showAlert('Failed to load users', 'error'); }
        finally { setUsersLoading(false); }
    };

    const fetchItineraries = async () => {
        setItinLoading(true);
        try {
            const res = await axios.get('http://127.0.0.1:8000/debug/itineraries');
            setItineraries(Array.isArray(res.data.itineraries) ? res.data.itineraries : []);
        } catch { showAlert('Failed to load itineraries', 'error'); }
        finally { setItinLoading(false); }
    };

    const fetchComplaints = async () => {
        setCompLoading(true);
        try {
            const res = await axios.get('http://127.0.0.1:8000/complaints/');
            setComplaints(Array.isArray(res.data) ? res.data : []);
        } catch { showAlert('Failed to load complaints', 'error'); }
        finally { setCompLoading(false); }
    };

    const fetchPlaces = async () => {
        setPlacesLoading(true);
        try {
            const adminId = admin.id || localStorage.getItem('userId');
            const res = await axios.get(`http://127.0.0.1:8000/admin/places?admin_id=${adminId}`);
            setPlaces(Array.isArray(res.data.places) ? res.data.places : []);
        } catch { showAlert('Failed to load places', 'error'); }
        finally { setPlacesLoading(false); }
    };

    const fetchCommunityPosts = async () => {
        setPostsLoading(true);
        try {
            const adminId = admin.id || localStorage.getItem('userId');
            const res = await axios.get(`http://127.0.0.1:8000/admin/posts?admin_id=${adminId}`);
            setCommunityPosts(Array.isArray(res.data) ? res.data : []);
        } catch { showAlert('Failed to load posts', 'error'); }
        finally { setPostsLoading(false); }
    };

    // fetch full user profile for the admin viewer
    const viewUserProfile = async (userId) => {
        setUserProfile({ open: true, loading: true, data: null });
        try {
            const adminId = admin.id || localStorage.getItem('userId');
            const res = await axios.get(`http://127.0.0.1:8000/admin/users/${userId}/profile?admin_id=${adminId}`);
            setUserProfile({ open: true, loading: false, data: res.data });
        } catch {
            showAlert('Failed to load user profile', 'error');
            setUserProfile({ open: false, loading: false, data: null });
        }
    };

    const deleteUser = async (id) => {
        try {
            await axios.delete(`http://127.0.0.1:8000/users/${id}`);
            setUsers(prev => prev.filter(u => u.id !== id));
            setStats(s => ({ ...s, totalUsers: s.totalUsers - 1 }));
            showAlert('User deleted successfully');
        } catch { showAlert('Failed to delete user', 'error'); }
    };

    const deleteItinerary = async (id) => {
        try {
            await axios.delete(`http://127.0.0.1:8000/itineraries/${id}`);
            setItineraries(prev => prev.filter(i => i.id !== id));
            setStats(s => ({ ...s, totalItineraries: s.totalItineraries - 1 }));
            showAlert('Itinerary deleted successfully');
        } catch { showAlert('Failed to delete itinerary', 'error'); }
    };

    const resolveComplaint = async (id) => {
        try {
            await axios.patch(`http://127.0.0.1:8000/complaints/${id}`, { status: 'resolved' });
            setComplaints(prev => prev.map(c => c.id === id ? { ...c, status: 'resolved' } : c));
            showAlert('Complaint marked as resolved');
        } catch { showAlert('Failed to resolve complaint', 'error'); }
    };

    const deleteComplaint = async (id) => {
        try {
            await axios.delete(`http://127.0.0.1:8000/complaints/${id}`);
            setComplaints(prev => prev.filter(c => c.id !== id));
            setStats(s => ({ ...s, totalComplaints: s.totalComplaints - 1 }));
            showAlert('Complaint deleted successfully');
        } catch { showAlert('Failed to delete complaint', 'error'); }
    };

    const deletePost = async (id) => {
        try {
            const adminId = admin.id || localStorage.getItem('userId');
            await axios.delete(`http://127.0.0.1:8000/admin/posts/${id}?admin_id=${adminId}`);
            setCommunityPosts(prev => prev.filter(p => p.id !== id));
            showAlert('Post deleted successfully');
        } catch { showAlert('Failed to delete post', 'error'); }
    };

    const handleLogout = () => { localStorage.clear(); navigate('/'); };

    // fetch full itinerary detail for the admin viewer dialog
    const viewItinerary = async (id) => {
        setItinDetail({ open: true, loading: true, data: null });
        try {
            const res = await axios.get(`http://127.0.0.1:8000/itineraries/${id}`);
            setItinDetail({ open: true, loading: false, data: res.data });
        } catch {
            showAlert('Failed to load itinerary details', 'error');
            setItinDetail({ open: false, loading: false, data: null });
        }
    };

    // ── Settings save ──────────────────────────────────────────────────────────
    const handleSaveEmail = async () => {
        setSettingsError('');
        if (!newEmail.trim() || !newEmail.includes('@')) {
            setSettingsError('Enter a valid email address');
            return;
        }
        setSettingsSaving(true);
        try {
            const res = await axios.patch(`http://127.0.0.1:8000/users/${admin.id}/credentials`, { email: newEmail.trim().toLowerCase() });
            localStorage.setItem('userEmail', res.data.email);
            setAdmin(prev => ({ ...prev, email: res.data.email }));
            showAlert('Email updated successfully');
            setSettingsOpen(false);
        } catch (err) {
            setSettingsError(err.response?.data?.detail || 'Failed to update email');
        } finally { setSettingsSaving(false); }
    };

    const handleSavePassword = async () => {
        setSettingsError('');
        if (!currentPassword) { setSettingsError('Enter your current password'); return; }
        if (!newPassword) { setSettingsError('Enter a new password'); return; }
        if (newPassword.length < 6) { setSettingsError('New password must be at least 6 characters'); return; }
        if (newPassword !== confirmPassword) { setSettingsError('Passwords do not match'); return; }
        setSettingsSaving(true);
        try {
            await axios.patch(`http://127.0.0.1:8000/users/${admin.id}/credentials`, {
                current_password: currentPassword,
                new_password: newPassword,
            });
            showAlert('Password updated successfully');
            setSettingsOpen(false);
            setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        } catch (err) {
            setSettingsError(err.response?.data?.detail || 'Failed to update password');
        } finally { setSettingsSaving(false); }
    };

    const openSettings = () => {
        setSettingsError('');
        setSettingsTab(0);
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        setSettingsOpen(true);
    };

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
    const getItinStatusColor = (s) => ({ draft: COLORS.purple, planning: COLORS.brand, confirmed: COLORS.green, ongoing: COLORS.orange, completed: COLORS.fadedText, cancelled: COLORS.error }[s] || COLORS.fadedText);
    const getComplaintStatusColor = (s) => ({ open: COLORS.error, resolved: COLORS.green, pending: COLORS.orange }[s] || COLORS.fadedText);

    const filteredUsers       = users.filter(u => u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));
    const filteredItineraries = itineraries.filter(i => i.title?.toLowerCase().includes(search.toLowerCase()) || i.destination?.toLowerCase().includes(search.toLowerCase()));
    const filteredComplaints  = complaints.filter(c => c.title?.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase()));
    const filteredPlaces      = places.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()) || p.address?.toLowerCase().includes(search.toLowerCase()) || (p.aliases || []).some(a => a.toLowerCase().includes(search.toLowerCase())));
    const filteredPosts       = communityPosts.filter(p => p.title?.toLowerCase().includes(search.toLowerCase()) || p.author_name?.toLowerCase().includes(search.toLowerCase()) || p.tag?.toLowerCase().includes(search.toLowerCase()));

    const tabLabels = [
        { label: 'Users',       count: stats.totalUsers,       color: COLORS.brand },
        { label: 'Itineraries', count: stats.totalItineraries, color: COLORS.purple },
        { label: 'Posts',       count: communityPosts.length,  color: '#38bdf8' },
        { label: 'Complaints',  count: stats.totalComplaints,  color: COLORS.orange },
        { label: 'Places',      count: stats.totalPlaces,      color: COLORS.green },
    ];

    return (
        <Box sx={{ display: 'flex', bgcolor: COLORS.background, minHeight: '100vh', width: '100vw', position: 'fixed', top: 0, left: 0, overflow: 'hidden' }}>

            {/* ── SIDEBAR ────────────────────────────────────────────────── */}
            <Drawer variant="permanent" sx={{
                width: drawerWidth, flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: drawerWidth, boxSizing: 'border-box',
                    bgcolor: COLORS.background, borderRight: 'none',
                    backgroundImage: 'linear-gradient(to bottom, rgba(51,204,204,0.06), transparent)',
                    display: 'flex', flexDirection: 'column', overflowX: 'hidden',
                }
            }}>
                <Box sx={{ p: 3 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Box component="span" sx={{ color: COLORS.brand, fontSize: '1.5rem' }}>✈</Box>
                        <Typography variant="h6" fontWeight="bold" sx={{ color: 'white', fontFamily: '"Exo 2", sans-serif', letterSpacing: 0.5 }}>
                            Smart <Box component="span" sx={{ color: COLORS.brand }}>Itinerary</Box>
                        </Typography>
                    </Stack>
                    <Box sx={{ mt: 1.5, ml: 0.5 }}>
                        <Chip label="ADMIN PANEL" size="small" sx={{
                            bgcolor: 'rgba(51,204,204,0.12)', color: COLORS.brand,
                            border: '1px solid rgba(51,204,204,0.25)', fontSize: '0.6rem',
                            fontWeight: 700, letterSpacing: 1, height: 18,
                        }} />
                    </Box>
                </Box>

                <List sx={{ px: 2, mt: 1 }}>
                    <ListItem disablePadding sx={{ mb: 0.75 }}>
                        <ListItemButton selected onClick={() => navigate('/admin')} sx={{
                            borderRadius: 2, color: COLORS.background,
                            '&.Mui-selected': { bgcolor: COLORS.brand, color: COLORS.background, '&:hover': { bgcolor: '#2db8b8' } },
                            '&:hover': { bgcolor: COLORS.cardSecondary }
                        }}>
                            <ListItemIcon sx={{ color: COLORS.background, minWidth: 38 }}>
                                <AdminPanelSettingsIcon />
                            </ListItemIcon>
                            <ListItemText primary="Admin Dashboard" primaryTypographyProps={{ fontWeight: 'bold', fontSize: '0.87rem' }} />
                        </ListItemButton>
                    </ListItem>
                </List>

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mx: 2, my: 1 }} />

                <Box sx={{ px: 2, py: 1 }}>
                    <Typography variant="caption" sx={{ color: COLORS.fadedText, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', fontSize: '0.62rem', pl: 0.5 }}>
                        Quick Stats
                    </Typography>
                    {[
                        { label: 'Total Users',       value: stats.totalUsers,       icon: <PeopleAltIcon sx={{ fontSize: 13, color: COLORS.brand }} />,   color: COLORS.brand },
                        { label: 'Total Itineraries', value: stats.totalItineraries, icon: <MapOutlinedIcon sx={{ fontSize: 13, color: COLORS.purple }} />,  color: COLORS.purple },
                        { label: 'Open Complaints',   value: complaints.filter(c => c.status !== 'resolved').length, icon: <ReportProblemOutlinedIcon sx={{ fontSize: 13, color: COLORS.orange }} />, color: COLORS.orange },
                        { label: 'Cached Places',     value: stats.totalPlaces, icon: <LocationOnIcon sx={{ fontSize: 13, color: '#38bdf8' }} />, color: '#38bdf8' },
                    ].map((s, i) => (
                        <Stack key={i} direction="row" alignItems="center" justifyContent="space-between" sx={{
                            mt: 1.2, px: 1.5, py: 1, borderRadius: 2,
                            bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                        }}>
                            <Stack direction="row" alignItems="center" spacing={0.8}>
                                {s.icon}
                                <Typography sx={{ color: COLORS.fadedText, fontSize: '0.72rem' }}>{s.label}</Typography>
                            </Stack>
                            <Typography fontWeight={700} sx={{ color: s.color, fontSize: '0.88rem' }}>
                                {statsLoading ? '—' : s.value}
                            </Typography>
                        </Stack>
                    ))}
                </Box>

                <Box sx={{ flexGrow: 1 }} />

                <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    {/* Admin info */}
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5, px: 0.5 }}>
                        <Avatar sx={{ width: 34, height: 34, bgcolor: COLORS.brand, color: COLORS.background, fontWeight: 'bold', fontSize: '0.85rem' }}>
                            {admin.initial}
                        </Avatar>
                        <Box sx={{ overflow: 'hidden' }}>
                            <Typography sx={{ color: COLORS.text, fontSize: '0.8rem', fontWeight: 600 }} noWrap>{admin.name}</Typography>
                            <Typography sx={{ color: COLORS.fadedText, fontSize: '0.68rem' }} noWrap>{admin.email}</Typography>
                        </Box>
                    </Stack>

                    <Button fullWidth startIcon={<SettingsOutlinedIcon sx={{ fontSize: 16 }} />} onClick={openSettings}
                        sx={{ color: COLORS.subheadings, justifyContent: 'flex-start', borderRadius: 2, mb: 0.5, fontSize: '0.82rem', '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' } }}>
                        Account Settings
                    </Button>
                    <Button fullWidth startIcon={<LogoutIcon sx={{ fontSize: 16 }} />} onClick={handleLogout}
                        sx={{ color: COLORS.fadedText, justifyContent: 'flex-start', borderRadius: 2, fontSize: '0.82rem', '&:hover': { color: COLORS.error, bgcolor: 'rgba(255,107,107,0.1)' } }}>
                        Logout
                    </Button>
                </Box>
            </Drawer>

            {/* ── MAIN CONTENT ───────────────────────────────────────────── */}
            <Box component="main" sx={{ flexGrow: 1, p: 3, height: '100vh', overflow: 'auto', bgcolor: COLORS.background }}>

                {/* Top Bar */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                    <Box>
                        <Typography variant="h4" fontWeight={800} sx={{ color: COLORS.headings, lineHeight: 1.1 }}>
                            Admin Dashboard
                        </Typography>
                        <Typography variant="body2" sx={{ color: COLORS.fadedText, mt: 0.3 }}>
                            Manage users, itineraries and complaints
                        </Typography>
                    </Box>

                    <Stack direction="row" spacing={2} alignItems="center">
                        <TextField
                            placeholder="Search across all tables…"
                            variant="outlined"
                            size="small"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            sx={{
                                width: 280,
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: COLORS.cardPrimary, borderRadius: 4, color: COLORS.text,
                                    '& fieldset': { borderColor: 'transparent' },
                                    '&:hover fieldset': { borderColor: COLORS.brand },
                                    '&.Mui-focused fieldset': { borderColor: COLORS.brand },
                                },
                                '& .MuiInputBase-input': { py: '10px' },
                                '& .MuiInputBase-input::placeholder': { color: COLORS.fadedText, opacity: 1 },
                            }}
                            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: COLORS.fadedText, fontSize: 18 }} /></InputAdornment> }}
                        />

                        <Tooltip title="Refresh all data">
                            <IconButton onClick={loadAll} sx={{ bgcolor: COLORS.cardPrimary, color: COLORS.brand, borderRadius: 2, '&:hover': { bgcolor: 'rgba(51,204,204,0.12)' } }}>
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Account Settings">
                            <IconButton onClick={openSettings} sx={{ bgcolor: COLORS.cardPrimary, color: COLORS.icons, borderRadius: 2, '&:hover': { color: COLORS.brand, bgcolor: 'rgba(51,204,204,0.1)' } }}>
                                <SettingsOutlinedIcon />
                            </IconButton>
                        </Tooltip>

                        <IconButton sx={{ bgcolor: COLORS.cardPrimary, color: COLORS.icons, position: 'relative', borderRadius: 2, '&:hover': { bgcolor: COLORS.cardSecondary } }}>
                            <NotificationsIcon />
                            {complaints.filter(c => c.status !== 'resolved').length > 0 && (
                                <Box sx={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, bgcolor: COLORS.error, borderRadius: '50%' }} />
                            )}
                        </IconButton>

                        <Avatar sx={{ bgcolor: COLORS.brand, color: COLORS.background, fontWeight: 'bold', width: 42, height: 42, cursor: 'pointer', '&:hover': { transform: 'scale(1.08)' }, transition: 'transform 0.2s' }}
                            onClick={openSettings}>
                            {admin.initial}
                        </Avatar>
                    </Stack>
                </Stack>

                {alert.show && (
                    <Alert severity={alert.type} sx={{ mb: 3, borderRadius: 3 }} onClose={() => setAlert(a => ({ ...a, show: false }))}>
                        {alert.msg}
                    </Alert>
                )}

                {/* Stat Cards */}
                <Stack direction="row" spacing={2.5} sx={{ mb: 4 }}>
                    <StatCard icon={<PeopleAltIcon sx={{ fontSize: 24, color: COLORS.brand }} />}
                        label="Total Users" value={stats.totalUsers.toLocaleString()}
                        trend="+12%" trendUp color={COLORS.brand} loading={statsLoading} />
                    <StatCard icon={<MapOutlinedIcon sx={{ fontSize: 24, color: COLORS.purple }} />}
                        label="Total Itineraries" value={stats.totalItineraries.toLocaleString()}
                        trend="+8%" trendUp color={COLORS.purple} loading={statsLoading} />
                    <StatCard icon={<ReportProblemOutlinedIcon sx={{ fontSize: 24, color: COLORS.orange }} />}
                        label="Total Complaints" value={stats.totalComplaints.toLocaleString()}
                        trend="-3%" trendUp={false} color={COLORS.orange} loading={statsLoading} />
                    <StatCard icon={<CheckCircleOutlineIcon sx={{ fontSize: 24, color: COLORS.green }} />}
                        label="Resolved" value={complaints.filter(c => c.status === 'resolved').length.toLocaleString()}
                        trend="+5%" trendUp color={COLORS.green} loading={statsLoading} />
                    <StatCard icon={<LocationOnIcon sx={{ fontSize: 24, color: '#38bdf8' }} />}
                        label="Cached Places" value={stats.totalPlaces.toLocaleString()}
                        color="#38bdf8" loading={statsLoading} />
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
                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.07)' }} />
                </Box>

                {/* Users Table */}
                {activeTab === 0 && (
                    <Box>
                        <SectionHeader title="All Users" onRefresh={fetchUsers} loading={usersLoading} />
                        <TableContainer component={Paper} sx={{ bgcolor: COLORS.cardPrimary, borderRadius: 4, boxShadow: 'none', border: '1px solid rgba(255,255,255,0.04)' }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        {['#', 'Name', 'Email', 'Joined', 'Itineraries', 'Role', ''].map((h, i) => (
                                            <TableCell key={i} sx={{ ...thSx, textAlign: i === 6 ? 'right' : 'left' }}>{h}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {usersLoading ? <LoadingRow cols={7} /> :
                                     filteredUsers.length === 0 ? <EmptyRow cols={7} msg="No users found." /> :
                                     filteredUsers.map((u, idx) => (
                                        <TableRow key={u.id} onClick={() => viewUserProfile(u.id)} sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'rgba(51,204,204,0.05)' }, '&:last-child td': { borderBottom: 'none' } }}>
                                            <TableCell sx={{ ...tdSx, color: COLORS.fadedText }}>{idx + 1}</TableCell>
                                            <TableCell sx={tdSx}>
                                                <Stack direction="row" alignItems="center" spacing={1.5}>
                                                    <Avatar sx={{ width: 30, height: 30, bgcolor: COLORS.brand, color: COLORS.background, fontSize: '0.75rem', fontWeight: 700 }}>
                                                        {(u.name || 'U')[0].toUpperCase()}
                                                    </Avatar>
                                                    <Typography sx={{ color: COLORS.headings, fontWeight: 600, fontSize: '0.82rem' }}>{u.name || '—'}</Typography>
                                                </Stack>
                                            </TableCell>
                                            <TableCell sx={tdSx}>
                                                <Stack direction="row" alignItems="center" spacing={0.5}>
                                                    <EmailOutlinedIcon sx={{ fontSize: 13, color: COLORS.fadedText }} />
                                                    <span>{u.email || '—'}</span>
                                                </Stack>
                                            </TableCell>
                                            <TableCell sx={{ ...tdSx, color: COLORS.fadedText }}>{formatDate(u.created_at)}</TableCell>
                                            <TableCell sx={tdSx}>
                                                <Box sx={{ bgcolor: 'rgba(51,204,204,0.1)', color: COLORS.brand, borderRadius: 1.5, px: 1.2, py: 0.2, display: 'inline-block', fontSize: '0.75rem', fontWeight: 700 }}>
                                                    {itineraries.filter(i => i.user_id === u.id).length}
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={tdSx}>
                                                <StatusChip label={u.role?.toUpperCase() || 'USER'} color={u.role === 'admin' ? COLORS.purple : COLORS.brand} />
                                            </TableCell>
                                            <TableCell sx={{ ...tdSx, textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                                                <RowMenu
                                                    onView={() => viewUserProfile(u.id)}
                                                    onDelete={() => deleteUser(u.id)}
                                                />
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
                        <SectionHeader title="All Itineraries" onRefresh={fetchItineraries} loading={itinLoading} />
                        <TableContainer component={Paper} sx={{ bgcolor: COLORS.cardPrimary, borderRadius: 4, boxShadow: 'none', border: '1px solid rgba(255,255,255,0.04)' }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        {['#', 'Trip Name', 'Destination', 'Start', 'End', 'Budget', 'Activities', 'Status', ''].map((h, i) => (
                                            <TableCell key={i} sx={{ ...thSx, textAlign: i === 8 ? 'right' : 'left' }}>{h}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {itinLoading ? <LoadingRow cols={9} /> :
                                     filteredItineraries.length === 0 ? <EmptyRow cols={9} msg="No itineraries found." /> :
                                     filteredItineraries.map((it, idx) => (
                                        <TableRow key={it.id} onClick={() => viewItinerary(it.id)} sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'rgba(51,204,204,0.05)' }, '&:last-child td': { borderBottom: 'none' } }}>
                                            <TableCell sx={{ ...tdSx, color: COLORS.fadedText }}>{idx + 1}</TableCell>
                                            <TableCell sx={{ ...tdSx, color: COLORS.headings, fontWeight: 600 }}>{it.title}</TableCell>
                                            <TableCell sx={tdSx}>
                                                <Stack direction="row" alignItems="center" spacing={0.5}>
                                                    <LocationOnIcon sx={{ fontSize: 12, color: COLORS.error }} />
                                                    <span>{it.destination}</span>
                                                </Stack>
                                            </TableCell>
                                            <TableCell sx={{ ...tdSx, color: COLORS.fadedText }}>{formatDate(it.start_date)}</TableCell>
                                            <TableCell sx={{ ...tdSx, color: COLORS.fadedText }}>{formatDate(it.end_date)}</TableCell>
                                            <TableCell sx={{ ...tdSx, color: COLORS.brand, fontWeight: 600 }}>
                                                {it.currency || 'NPR'} {it.estimated_budget?.toLocaleString() ?? '—'}
                                            </TableCell>
                                            <TableCell sx={tdSx}>
                                                <Stack direction="row" spacing={0.5} alignItems="center">
                                                    <Typography sx={{ color: COLORS.text, fontSize: '0.82rem' }}>{it.activities_count || 0}</Typography>
                                                    {it.mapped_count > 0 && (
                                                        <Chip label={`${it.mapped_count} mapped`} size="small" sx={{ height: 16, fontSize: '0.58rem', bgcolor: 'rgba(51,204,204,0.1)', color: COLORS.brand, border: '1px solid rgba(51,204,204,0.25)' }} />
                                                    )}
                                                </Stack>
                                            </TableCell>
                                            <TableCell sx={tdSx}>
                                                <StatusChip label={it.status?.toUpperCase() || 'PLANNING'} color={getItinStatusColor(it.status)} />
                                            </TableCell>
                                            <TableCell sx={{ ...tdSx, textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                                                <RowMenu
                                                    onView={() => viewItinerary(it.id)}
                                                    onDelete={() => deleteItinerary(it.id)}
                                                />
                                            </TableCell>
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
                        <SectionHeader title="All Community Posts" onRefresh={fetchCommunityPosts} loading={postsLoading} />
                        <TableContainer component={Paper} sx={{ bgcolor: COLORS.cardPrimary, borderRadius: 4, boxShadow: 'none', border: '1px solid rgba(255,255,255,0.04)' }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        {['#', 'Title', 'Author', 'Tag', 'Place', 'Votes', 'Date', ''].map((h, i) => (
                                            <TableCell key={i} sx={{ ...thSx, textAlign: i === 7 ? 'right' : 'left' }}>{h}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {postsLoading ? <LoadingRow cols={8} /> :
                                     filteredPosts.length === 0 ? <EmptyRow cols={8} msg="No posts found." /> :
                                     filteredPosts.map((p, idx) => (
                                        <TableRow key={p.id} sx={{ '&:hover': { bgcolor: 'rgba(56,189,248,0.03)' }, '&:last-child td': { borderBottom: 'none' } }}>
                                            <TableCell sx={{ ...tdSx, color: COLORS.fadedText }}>{idx + 1}</TableCell>
                                            <TableCell sx={{ ...tdSx, maxWidth: 220 }}>
                                                <Typography noWrap sx={{ fontSize: '0.82rem', color: COLORS.headings, fontWeight: 600 }}>{p.title}</Typography>
                                            </TableCell>
                                            <TableCell sx={tdSx}>
                                                <Stack direction="row" alignItems="center" spacing={0.8}>
                                                    <Avatar sx={{ width: 22, height: 22, bgcolor: '#38bdf8', color: 'white', fontSize: '0.6rem', fontWeight: 700 }}>
                                                        {(p.author_name || 'U')[0].toUpperCase()}
                                                    </Avatar>
                                                    <Typography sx={{ fontSize: '0.78rem', color: COLORS.text }}>{p.author_name || `User #${p.user_id}`}</Typography>
                                                </Stack>
                                            </TableCell>
                                            <TableCell sx={tdSx}>
                                                <Chip label={p.tag} size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 600, bgcolor: `${{'Experience':'#33CCCC','Alert':'#FFB74D','Event':'#4CAF50','Tip':'#9C27B0','Question':'#42A5F5'}[p.tag] || COLORS.brand}18`, color: {'Experience':'#33CCCC','Alert':'#FFB74D','Event':'#4CAF50','Tip':'#9C27B0','Question':'#42A5F5'}[p.tag] || COLORS.brand }} />
                                            </TableCell>
                                            <TableCell sx={tdSx}>
                                                <Typography sx={{ fontSize: '0.78rem', color: p.place === 'All' ? COLORS.fadedText : COLORS.brand }}>{p.place}</Typography>
                                            </TableCell>
                                            <TableCell sx={tdSx}>
                                                <Stack direction="row" spacing={0.5} alignItems="center">
                                                    <Typography sx={{ color: COLORS.green, fontSize: '0.78rem', fontWeight: 600 }}>+{p.upvotes || 0}</Typography>
                                                    <Typography sx={{ color: COLORS.fadedText, fontSize: '0.72rem' }}>/</Typography>
                                                    <Typography sx={{ color: COLORS.error, fontSize: '0.78rem' }}>-{p.downvotes || 0}</Typography>
                                                </Stack>
                                            </TableCell>
                                            <TableCell sx={{ ...tdSx, color: COLORS.fadedText }}>{formatDate(p.created_at)}</TableCell>
                                            <TableCell sx={{ ...tdSx, textAlign: 'right' }}>
                                                <RowMenu
                                                    onView={() => viewUserProfile(p.user_id)}
                                                    onDelete={() => deletePost(p.id)}
                                                />
                                            </TableCell>
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
                        <SectionHeader title="All Complaints" onRefresh={fetchComplaints} loading={compLoading} />
                        <TableContainer component={Paper} sx={{ bgcolor: COLORS.cardPrimary, borderRadius: 4, boxShadow: 'none', border: '1px solid rgba(255,255,255,0.04)' }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        {['#', 'Title', 'Description', 'Submitted By', 'Date', 'Status', ''].map((h, i) => (
                                            <TableCell key={i} sx={{ ...thSx, textAlign: i === 6 ? 'right' : 'left' }}>{h}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {compLoading ? <LoadingRow cols={7} /> :
                                     filteredComplaints.length === 0 ? <EmptyRow cols={7} msg="No complaints found." /> :
                                     filteredComplaints.map((c, idx) => (
                                        <TableRow key={c.id} sx={{ '&:hover': { bgcolor: 'rgba(251,146,60,0.03)' }, '&:last-child td': { borderBottom: 'none' } }}>
                                            <TableCell sx={{ ...tdSx, color: COLORS.fadedText }}>{idx + 1}</TableCell>
                                            <TableCell sx={{ ...tdSx, maxWidth: 180 }}>
                                                <Typography noWrap sx={{ fontSize: '0.82rem', color: COLORS.headings, fontWeight: 600 }}>{c.title || '—'}</Typography>
                                            </TableCell>
                                            <TableCell sx={{ ...tdSx, maxWidth: 220 }}>
                                                <Typography noWrap sx={{ fontSize: '0.78rem', color: COLORS.fadedText }}>{c.description || '—'}</Typography>
                                            </TableCell>
                                            <TableCell sx={tdSx}>
                                                <Stack direction="row" alignItems="center" spacing={0.8}>
                                                    <Avatar sx={{ width: 22, height: 22, bgcolor: COLORS.orange, color: 'white', fontSize: '0.6rem', fontWeight: 700 }}>
                                                        {(c.user_name || c.user_id || 'U').toString()[0].toUpperCase()}
                                                    </Avatar>
                                                    <Typography sx={{ fontSize: '0.78rem', color: COLORS.text }}>{c.user_name || `User #${c.user_id}` || '—'}</Typography>
                                                </Stack>
                                            </TableCell>
                                            <TableCell sx={{ ...tdSx, color: COLORS.fadedText }}>{formatDate(c.created_at)}</TableCell>
                                            <TableCell sx={tdSx}>
                                                <StatusChip label={c.status?.toUpperCase() || 'OPEN'} color={getComplaintStatusColor(c.status || 'open')} />
                                            </TableCell>
                                            <TableCell sx={{ ...tdSx, textAlign: 'right' }}>
                                                <RowMenu
                                                    onView={() => setDetailDialog({ open: true, type: 'complaint', data: c })}
                                                    onResolve={c.status !== 'resolved' ? () => resolveComplaint(c.id) : null}
                                                    onDelete={() => deleteComplaint(c.id)}
                                                />
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
                        <SectionHeader title="Cached Places & Search Aliases" onRefresh={fetchPlaces} loading={placesLoading} />
                        <TableContainer component={Paper} sx={{ bgcolor: COLORS.cardPrimary, borderRadius: 4, boxShadow: 'none', border: '1px solid rgba(255,255,255,0.04)' }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        {['#', 'Place Name', 'Address', 'City', 'Rating', 'Search Aliases', 'Coords'].map((h, i) => (
                                            <TableCell key={i} sx={thSx}>{h}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {placesLoading ? <LoadingRow cols={7} /> :
                                     filteredPlaces.length === 0 ? <EmptyRow cols={7} msg="No cached places yet. Places are cached automatically when users search." /> :
                                     filteredPlaces.map((p, idx) => (
                                        <TableRow key={p.google_place_id || idx} sx={{ '&:hover': { bgcolor: 'rgba(56,189,248,0.03)' }, '&:last-child td': { borderBottom: 'none' } }}>
                                            <TableCell sx={{ ...tdSx, color: COLORS.fadedText }}>{idx + 1}</TableCell>
                                            <TableCell sx={tdSx}>
                                                <Stack direction="row" alignItems="center" spacing={0.8}>
                                                    <LocationOnIcon sx={{ fontSize: 14, color: COLORS.brand, flexShrink: 0 }} />
                                                    <Typography sx={{ fontSize: '0.82rem', color: COLORS.headings, fontWeight: 600 }}>{p.name}</Typography>
                                                </Stack>
                                            </TableCell>
                                            <TableCell sx={{ ...tdSx, maxWidth: 200 }}>
                                                <Typography noWrap sx={{ fontSize: '0.78rem', color: COLORS.fadedText }}>{p.address || '—'}</Typography>
                                            </TableCell>
                                            <TableCell sx={tdSx}>
                                                {p.city ? (
                                                    <Chip label={p.city} size="small" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 600, bgcolor: 'rgba(51,204,204,0.1)', color: COLORS.brand, border: '1px solid rgba(51,204,204,0.2)' }} />
                                                ) : <Typography sx={{ color: COLORS.fadedText, fontSize: '0.78rem' }}>—</Typography>}
                                            </TableCell>
                                            <TableCell sx={tdSx}>
                                                {p.rating ? (
                                                    <Stack direction="row" alignItems="center" spacing={0.3}>
                                                        <Typography sx={{ color: '#FFD700', fontSize: '0.82rem', fontWeight: 600 }}>{p.rating}</Typography>
                                                        <Typography sx={{ color: COLORS.fadedText, fontSize: '0.7rem' }}>★</Typography>
                                                    </Stack>
                                                ) : <Typography sx={{ color: COLORS.fadedText, fontSize: '0.78rem' }}>—</Typography>}
                                            </TableCell>
                                            <TableCell sx={{ ...tdSx, maxWidth: 260 }}>
                                                {(p.aliases && p.aliases.length > 0) ? (
                                                    <Stack direction="row" flexWrap="wrap" gap={0.5}>
                                                        {p.aliases.map((alias, ai) => (
                                                            <Chip
                                                                key={ai}
                                                                label={alias}
                                                                size="small"
                                                                sx={{
                                                                    height: 20, fontSize: '0.62rem', fontWeight: 500,
                                                                    bgcolor: 'rgba(167,139,250,0.1)', color: COLORS.purple,
                                                                    border: '1px solid rgba(167,139,250,0.2)',
                                                                }}
                                                            />
                                                        ))}
                                                    </Stack>
                                                ) : <Typography sx={{ color: COLORS.fadedText, fontSize: '0.72rem', fontStyle: 'italic' }}>no aliases yet</Typography>}
                                            </TableCell>
                                            <TableCell sx={tdSx}>
                                                {p.latitude && p.longitude ? (
                                                    <Typography sx={{ color: COLORS.fadedText, fontSize: '0.7rem', fontFamily: 'monospace' }}>
                                                        {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}
                                                    </Typography>
                                                ) : <Typography sx={{ color: COLORS.fadedText, fontSize: '0.78rem' }}>—</Typography>}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                )}
            </Box>
            <Dialog open={detailDialog.open} onClose={() => setDetailDialog({ open: false, type: '', data: null })} maxWidth="sm" fullWidth
                PaperProps={{ sx: { bgcolor: COLORS.cardPrimary, borderRadius: 4, border: '1px solid rgba(255,255,255,0.07)' } }}>
                <DialogTitle sx={{ color: COLORS.headings, fontWeight: 700, pb: 1 }}>
                    {detailDialog.type === 'user' ? 'User Details' : 'Complaint Details'}
                </DialogTitle>
                <DialogContent>
                    {detailDialog.type === 'user' && detailDialog.data && (
                        <Stack spacing={2} sx={{ pt: 1 }}>
                            <Stack direction="row" alignItems="center" spacing={2}>
                                <Avatar sx={{ width: 52, height: 52, bgcolor: COLORS.brand, color: COLORS.background, fontWeight: 800, fontSize: '1.3rem' }}>
                                    {(detailDialog.data.name || 'U')[0].toUpperCase()}
                                </Avatar>
                                <Box>
                                    <Typography fontWeight={700} sx={{ color: 'white', fontSize: '1rem' }}>{detailDialog.data.name}</Typography>
                                    <Typography sx={{ color: COLORS.fadedText, fontSize: '0.82rem' }}>{detailDialog.data.email}</Typography>
                                </Box>
                            </Stack>
                            {[
                                { label: 'User ID',     value: detailDialog.data.id },
                                { label: 'Role',        value: detailDialog.data.role || 'user' },
                                { label: 'Joined',      value: formatDate(detailDialog.data.created_at) },
                                { label: 'Itineraries', value: itineraries.filter(i => i.user_id === detailDialog.data.id).length },
                            ].map((row, i) => (
                                <Stack key={i} direction="row" justifyContent="space-between" sx={{ py: 1, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    <Typography sx={{ color: COLORS.fadedText, fontSize: '0.82rem' }}>{row.label}</Typography>
                                    <Typography sx={{ color: COLORS.text, fontSize: '0.82rem', fontWeight: 600 }}>{row.value}</Typography>
                                </Stack>
                            ))}
                        </Stack>
                    )}
                    {detailDialog.type === 'complaint' && detailDialog.data && (
                        <Stack spacing={1.5} sx={{ pt: 1 }}>
                            {[
                                { label: 'Title',        value: detailDialog.data.title },
                                { label: 'Description',  value: detailDialog.data.description },
                                { label: 'Submitted By', value: detailDialog.data.user_name || `User #${detailDialog.data.user_id}` },
                                { label: 'Date',         value: formatDate(detailDialog.data.created_at) },
                                { label: 'Status',       value: detailDialog.data.status || 'open' },
                            ].map((row, i) => (
                                <Stack key={i} direction="row" justifyContent="space-between" sx={{ py: 1, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    <Typography sx={{ color: COLORS.fadedText, fontSize: '0.82rem', minWidth: 100 }}>{row.label}</Typography>
                                    <Typography sx={{ color: COLORS.text, fontSize: '0.82rem', fontWeight: 600, textAlign: 'right', flex: 1 }}>{row.value}</Typography>
                                </Stack>
                            ))}
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDetailDialog({ open: false, type: '', data: null })} sx={{ color: COLORS.fadedText, textTransform: 'none' }}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Itinerary Detail Dialog ────────────────────────────────── */}
            <Dialog
                open={itinDetail.open}
                onClose={() => setItinDetail({ open: false, loading: false, data: null })}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { bgcolor: COLORS.background, borderRadius: 4, border: '1px solid rgba(255,255,255,0.07)', height: 'calc(100vh - 48px)', maxHeight: 'calc(100vh - 48px)' } }}
            >
                {itinDetail.loading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 10 }}>
                        <CircularProgress sx={{ color: COLORS.brand }} />
                    </Box>
                ) : itinDetail.data && (
                    <>
                        <DialogTitle sx={{ pb: 1, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography variant="h5" fontWeight={800} sx={{ color: COLORS.headings }}>
                                        {itinDetail.data.title}
                                    </Typography>
                                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 0.5 }}>
                                        <Stack direction="row" alignItems="center" spacing={0.3}>
                                            <LocationOnIcon sx={{ fontSize: 13, color: COLORS.error }} />
                                            <Typography sx={{ color: COLORS.fadedText, fontSize: '0.78rem' }}>{itinDetail.data.destination}</Typography>
                                        </Stack>
                                        <StatusChip label={itinDetail.data.status?.toUpperCase() || 'PLANNING'} color={getItinStatusColor(itinDetail.data.status)} />
                                    </Stack>
                                </Box>
                                <IconButton onClick={() => setItinDetail({ open: false, loading: false, data: null })}
                                    sx={{ color: COLORS.fadedText, '&:hover': { color: COLORS.error } }}>
                                    <CloseIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                            </Stack>
                        </DialogTitle>

                        <DialogContent sx={{ py: 2.5, '&::-webkit-scrollbar': { width: 5 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 3 } }}>
                            {/* trip overview row */}
                            <Stack direction="row" spacing={3} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
                                {[
                                    { label: 'Dates', value: `${formatDate(itinDetail.data.start_date)} – ${formatDate(itinDetail.data.end_date)}` },
                                    { label: 'Budget', value: `${itinDetail.data.currency || 'NPR'} ${itinDetail.data.estimated_budget?.toLocaleString() || '0'}` },
                                    { label: 'Days', value: itinDetail.data.days?.length || 0 },
                                    { label: 'Owner', value: `User #${itinDetail.data.user_id}` },
                                ].map((item, i) => (
                                    <Box key={i} sx={{ bgcolor: COLORS.cardPrimary, borderRadius: 2.5, px: 2, py: 1.2, minWidth: 110 }}>
                                        <Typography sx={{ color: COLORS.fadedText, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.2 }}>{item.label}</Typography>
                                        <Typography sx={{ color: COLORS.text, fontSize: '0.88rem', fontWeight: 600 }}>{item.value}</Typography>
                                    </Box>
                                ))}
                            </Stack>

                            {itinDetail.data.description && (
                                <Typography sx={{ color: COLORS.fadedText, fontSize: '0.85rem', mb: 2.5, lineHeight: 1.6 }}>
                                    {itinDetail.data.description}
                                </Typography>
                            )}

                            {/* day-by-day breakdown */}
                            <Typography variant="subtitle1" fontWeight={700} sx={{ color: COLORS.headings, mb: 1.5 }}>Day-by-Day Plan</Typography>
                            <Stack spacing={2}>
                                {(itinDetail.data.days || []).map((day) => (
                                    <Card key={day.id || day.day_number} sx={{ bgcolor: COLORS.cardPrimary, borderRadius: 3, border: '1px solid rgba(255,255,255,0.04)', boxShadow: 'none' }}>
                                        <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.04)', bgcolor: 'rgba(51,204,204,0.03)' }}>
                                            <Stack direction="row" spacing={1.5} alignItems="center">
                                                <Box sx={{ width: 28, height: 28, borderRadius: 1.5, bgcolor: 'rgba(51,204,204,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Typography sx={{ color: COLORS.brand, fontSize: '0.72rem', fontWeight: 800 }}>{day.day_number}</Typography>
                                                </Box>
                                                <Typography sx={{ color: COLORS.subheadings, fontWeight: 600, fontSize: '0.9rem' }}>
                                                    Day {day.day_number}
                                                </Typography>
                                                <Typography sx={{ color: COLORS.fadedText, fontSize: '0.78rem' }}>
                                                    {formatDate(day.date)}
                                                </Typography>
                                                {day.title && day.title !== `Day ${day.day_number}` && (
                                                    <Typography sx={{ color: COLORS.fadedText, fontSize: '0.78rem', fontStyle: 'italic' }}>— {day.title}</Typography>
                                                )}
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
                                                                    <Typography sx={{ color: COLORS.text, fontSize: '0.85rem', fontWeight: 600 }}>
                                                                        {act.title || act.location}
                                                                    </Typography>
                                                                    {act.start_time && (
                                                                        <Typography sx={{ color: COLORS.fadedText, fontSize: '0.72rem' }}>
                                                                            @ {act.start_time}
                                                                        </Typography>
                                                                    )}
                                                                    {act.place_id && (
                                                                        <Chip label="Mapped" size="small" sx={{ height: 16, fontSize: '0.58rem', bgcolor: 'rgba(51,204,204,0.1)', color: COLORS.brand, border: '1px solid rgba(51,204,204,0.25)' }} />
                                                                    )}
                                                                    {act.activity_type && (
                                                                        <Chip label={act.activity_type} size="small" sx={{ height: 16, fontSize: '0.58rem', bgcolor: 'rgba(255,255,255,0.06)', color: COLORS.fadedText }} />
                                                                    )}
                                                                </Stack>
                                                                {act.description && (
                                                                    <Typography sx={{ color: COLORS.fadedText, fontSize: '0.78rem', mt: 0.2 }}>{act.description}</Typography>
                                                                )}
                                                                {act.formatted_address && (
                                                                    <Typography sx={{ color: COLORS.fadedText, fontSize: '0.72rem', mt: 0.2, opacity: 0.7 }}>{act.formatted_address}</Typography>
                                                                )}
                                                                {act.cost > 0 && (
                                                                    <Typography sx={{ color: COLORS.brand, fontSize: '0.72rem', mt: 0.2 }}>
                                                                        Budget: {itinDetail.data.currency || 'NPR'} {act.cost.toLocaleString()}
                                                                    </Typography>
                                                                )}
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

                        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            <Button onClick={() => setItinDetail({ open: false, loading: false, data: null })}
                                sx={{ color: COLORS.fadedText, textTransform: 'none', borderRadius: 2 }}>
                                Close
                            </Button>
                            <Button onClick={() => { deleteItinerary(itinDetail.data.id); setItinDetail({ open: false, loading: false, data: null }); }}
                                startIcon={<DeleteOutlineIcon sx={{ fontSize: 15 }} />}
                                sx={{ color: COLORS.error, textTransform: 'none', borderRadius: 2, bgcolor: 'rgba(255,107,107,0.08)', '&:hover': { bgcolor: 'rgba(255,107,107,0.15)' } }}>
                                Delete Itinerary
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* ── User Profile Dialog ─────────────────────────────────── */}
            <Dialog
                open={userProfile.open}
                onClose={() => setUserProfile({ open: false, loading: false, data: null })}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { bgcolor: COLORS.background, borderRadius: 4, border: '1px solid rgba(255,255,255,0.07)', height: 'calc(100vh - 48px)', maxHeight: 'calc(100vh - 48px)' } }}
            >
                {userProfile.loading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 10 }}>
                        <CircularProgress sx={{ color: COLORS.brand }} />
                    </Box>
                ) : userProfile.data && (
                    <>
                        <DialogTitle sx={{ pb: 1, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Avatar sx={{ width: 48, height: 48, bgcolor: COLORS.brand, color: COLORS.background, fontWeight: 800, fontSize: '1.2rem' }}>
                                        {(userProfile.data.user.name || 'U')[0].toUpperCase()}
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h6" fontWeight={800} sx={{ color: COLORS.headings }}>
                                            {userProfile.data.user.name}
                                        </Typography>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Typography sx={{ color: COLORS.fadedText, fontSize: '0.78rem' }}>{userProfile.data.user.email}</Typography>
                                            <StatusChip label={userProfile.data.user.role?.toUpperCase() || 'USER'} color={userProfile.data.user.role === 'admin' ? COLORS.purple : COLORS.brand} />
                                        </Stack>
                                    </Box>
                                </Stack>
                                <IconButton onClick={() => setUserProfile({ open: false, loading: false, data: null })}
                                    sx={{ color: COLORS.fadedText, '&:hover': { color: COLORS.error } }}>
                                    <CloseIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                            </Stack>
                        </DialogTitle>

                        <DialogContent sx={{ py: 2.5, '&::-webkit-scrollbar': { width: 5 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 3 } }}>
                            {/* stats row */}
                            <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                                {[
                                    { label: 'Joined', value: formatDate(userProfile.data.user.created_at) },
                                    { label: 'Itineraries', value: userProfile.data.stats.total_itineraries },
                                    { label: 'Posts', value: userProfile.data.stats.total_posts },
                                    { label: 'Total Upvotes', value: userProfile.data.stats.total_upvotes },
                                    { label: 'Last Login', value: userProfile.data.user.last_login ? formatDate(userProfile.data.user.last_login) : 'Never' },
                                ].map((item, i) => (
                                    <Box key={i} sx={{ bgcolor: COLORS.cardPrimary, borderRadius: 2.5, px: 2, py: 1.2, flex: 1, textAlign: 'center' }}>
                                        <Typography sx={{ color: COLORS.fadedText, fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.2 }}>{item.label}</Typography>
                                        <Typography sx={{ color: COLORS.text, fontSize: '0.9rem', fontWeight: 700 }}>{item.value}</Typography>
                                    </Box>
                                ))}
                            </Stack>

                            {userProfile.data.user.bio && (
                                <Typography sx={{ color: COLORS.fadedText, fontSize: '0.82rem', mb: 2, fontStyle: 'italic' }}>
                                    {userProfile.data.user.bio}
                                </Typography>
                            )}

                            {/* Itineraries section */}
                            <Typography variant="subtitle1" fontWeight={700} sx={{ color: COLORS.headings, mb: 1.5 }}>
                                Itineraries ({userProfile.data.itineraries.length})
                            </Typography>
                            {userProfile.data.itineraries.length === 0 ? (
                                <Typography sx={{ color: COLORS.fadedText, fontSize: '0.82rem', mb: 3, fontStyle: 'italic' }}>No itineraries yet</Typography>
                            ) : (
                                <Stack spacing={1} sx={{ mb: 3 }}>
                                    {userProfile.data.itineraries.map((itin) => (
                                        <Card key={itin.id} onClick={() => { setUserProfile({ open: false, loading: false, data: null }); viewItinerary(itin.id); }}
                                            sx={{ bgcolor: COLORS.cardPrimary, borderRadius: 2.5, border: '1px solid rgba(255,255,255,0.04)', boxShadow: 'none', cursor: 'pointer', '&:hover': { border: '1px solid rgba(51,204,204,0.2)', bgcolor: 'rgba(51,204,204,0.03)' }, transition: 'all 0.2s' }}>
                                            <Box sx={{ px: 2, py: 1.5 }}>
                                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                    <Box>
                                                        <Typography sx={{ color: COLORS.headings, fontSize: '0.88rem', fontWeight: 600 }}>{itin.title}</Typography>
                                                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 0.3 }}>
                                                            <Stack direction="row" spacing={0.3} alignItems="center">
                                                                <LocationOnIcon sx={{ fontSize: 11, color: COLORS.error }} />
                                                                <Typography sx={{ color: COLORS.fadedText, fontSize: '0.72rem' }}>{itin.destination}</Typography>
                                                            </Stack>
                                                            <Typography sx={{ color: COLORS.fadedText, fontSize: '0.72rem' }}>
                                                                {formatDate(itin.start_date)} – {formatDate(itin.end_date)}
                                                            </Typography>
                                                            <Typography sx={{ color: COLORS.brand, fontSize: '0.72rem', fontWeight: 600 }}>
                                                                {itin.days_count} days · {itin.activities_count} activities
                                                            </Typography>
                                                        </Stack>
                                                    </Box>
                                                    <StatusChip label={itin.status?.toUpperCase() || 'PLANNING'} color={getItinStatusColor(itin.status)} />
                                                </Stack>
                                            </Box>
                                        </Card>
                                    ))}
                                </Stack>
                            )}

                            {/* Posts section */}
                            <Typography variant="subtitle1" fontWeight={700} sx={{ color: COLORS.headings, mb: 1.5 }}>
                                Community Posts ({userProfile.data.posts.length})
                            </Typography>
                            {userProfile.data.posts.length === 0 ? (
                                <Typography sx={{ color: COLORS.fadedText, fontSize: '0.82rem', fontStyle: 'italic' }}>No posts yet</Typography>
                            ) : (
                                <Stack spacing={1}>
                                    {userProfile.data.posts.map((post) => {
                                        const tagColor = {'Experience':'#33CCCC','Alert':'#FFB74D','Event':'#4CAF50','Tip':'#9C27B0','Question':'#42A5F5'}[post.tag] || COLORS.brand;
                                        return (
                                            <Card key={post.id} sx={{ bgcolor: COLORS.cardPrimary, borderRadius: 2.5, border: '1px solid rgba(255,255,255,0.04)', boxShadow: 'none' }}>
                                                <Box sx={{ px: 2, py: 1.5 }}>
                                                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                                                                <Chip label={post.tag} size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 600, bgcolor: `${tagColor}18`, color: tagColor }} />
                                                                {post.place && post.place !== 'All' && (
                                                                    <Typography sx={{ color: COLORS.brand, fontSize: '0.68rem' }}>{post.place}</Typography>
                                                                )}
                                                                <Typography sx={{ color: COLORS.fadedText, fontSize: '0.68rem' }}>{formatDate(post.created_at)}</Typography>
                                                            </Stack>
                                                            <Typography sx={{ color: COLORS.headings, fontSize: '0.85rem', fontWeight: 600 }}>{post.title}</Typography>
                                                            {post.body && (
                                                                <Typography noWrap sx={{ color: COLORS.fadedText, fontSize: '0.75rem', mt: 0.3, maxWidth: 500 }}>{post.body}</Typography>
                                                            )}
                                                        </Box>
                                                        <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 2, flexShrink: 0 }}>
                                                            <Typography sx={{ color: COLORS.green, fontSize: '0.78rem', fontWeight: 600 }}>+{post.upvotes}</Typography>
                                                            <Typography sx={{ color: COLORS.error, fontSize: '0.78rem' }}>-{post.downvotes}</Typography>
                                                        </Stack>
                                                    </Stack>
                                                </Box>
                                            </Card>
                                        );
                                    })}
                                </Stack>
                            )}
                        </DialogContent>

                        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            <Button onClick={() => setUserProfile({ open: false, loading: false, data: null })}
                                sx={{ color: COLORS.fadedText, textTransform: 'none', borderRadius: 2 }}>
                                Close
                            </Button>
                            <Button onClick={() => { deleteUser(userProfile.data.user.id); setUserProfile({ open: false, loading: false, data: null }); }}
                                startIcon={<DeleteOutlineIcon sx={{ fontSize: 15 }} />}
                                sx={{ color: COLORS.error, textTransform: 'none', borderRadius: 2, bgcolor: 'rgba(255,107,107,0.08)', '&:hover': { bgcolor: 'rgba(255,107,107,0.15)' } }}>
                                Delete User
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* ── Settings Dialog ───────────────────────────────────────── */}
            <Dialog open={settingsOpen} onClose={() => { setSettingsOpen(false); setSettingsError(''); }} maxWidth="xs" fullWidth
                PaperProps={{ sx: { bgcolor: COLORS.cardPrimary, borderRadius: 4, border: '1px solid rgba(255,255,255,0.07)' } }}>
                <DialogTitle sx={{ pb: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'rgba(51,204,204,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <SettingsOutlinedIcon sx={{ fontSize: 18, color: COLORS.brand }} />
                        </Box>
                        <Box>
                            <Typography fontWeight={700} sx={{ color: COLORS.headings, fontSize: '1rem' }}>Account Settings</Typography>
                            <Typography sx={{ color: COLORS.fadedText, fontSize: '0.72rem' }}>Update your admin credentials</Typography>
                        </Box>
                    </Stack>
                </DialogTitle>

                <DialogContent sx={{ pb: 0 }}>
                    {/* Tab switcher */}
                    <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
                        {[{ label: 'Email', icon: <EmailOutlinedIcon sx={{ fontSize: 15 }} /> }, { label: 'Password', icon: <LockOutlinedIcon sx={{ fontSize: 15 }} /> }].map((t, i) => (
                            <Button key={i} onClick={() => { setSettingsTab(i); setSettingsError(''); }}
                                startIcon={t.icon}
                                size="small"
                                sx={{
                                    flex: 1, borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: '0.8rem',
                                    bgcolor: settingsTab === i ? 'rgba(51,204,204,0.15)' : 'rgba(255,255,255,0.04)',
                                    color: settingsTab === i ? COLORS.brand : COLORS.fadedText,
                                    border: settingsTab === i ? '1px solid rgba(51,204,204,0.3)' : '1px solid transparent',
                                    '&:hover': { bgcolor: 'rgba(51,204,204,0.1)', color: COLORS.brand },
                                }}>
                                {t.label}
                            </Button>
                        ))}
                    </Stack>

                    {settingsError && (
                        <Alert severity="error" sx={{ mb: 2, borderRadius: 2, bgcolor: 'rgba(255,107,107,0.1)', color: COLORS.error, border: '1px solid rgba(255,107,107,0.25)', '& .MuiAlert-icon': { color: COLORS.error } }}>
                            {settingsError}
                        </Alert>
                    )}

                    {/* Email tab */}
                    {settingsTab === 0 && (
                        <Stack spacing={2}>
                            <Typography variant="caption" sx={{ color: COLORS.fadedText }}>
                                Current email: <strong style={{ color: COLORS.text }}>{admin.email || '—'}</strong>
                            </Typography>
                            <TextField
                                fullWidth
                                label="New Email"
                                type="email"
                                value={newEmail}
                                onChange={e => setNewEmail(e.target.value)}
                                sx={inputSx}
                            />
                        </Stack>
                    )}

                    {/* Password tab */}
                    {settingsTab === 1 && (
                        <Stack spacing={2}>
                            <TextField
                                fullWidth
                                label="Current Password"
                                type={showCurrent ? 'text' : 'password'}
                                value={currentPassword}
                                onChange={e => setCurrentPassword(e.target.value)}
                                sx={inputSx}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton size="small" onClick={() => setShowCurrent(p => !p)} sx={{ color: COLORS.fadedText }}>
                                                {showCurrent ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                            />
                            <TextField
                                fullWidth
                                label="New Password"
                                type={showNew ? 'text' : 'password'}
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                helperText="Minimum 6 characters"
                                sx={inputSx}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton size="small" onClick={() => setShowNew(p => !p)} sx={{ color: COLORS.fadedText }}>
                                                {showNew ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                            />
                            <TextField
                                fullWidth
                                label="Confirm New Password"
                                type={showConfirm ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                sx={inputSx}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton size="small" onClick={() => setShowConfirm(p => !p)} sx={{ color: COLORS.fadedText }}>
                                                {showConfirm ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                            />
                        </Stack>
                    )}
                </DialogContent>

                <DialogActions sx={{ px: 3, py: 2.5, gap: 1 }}>
                    <Button onClick={() => { setSettingsOpen(false); setSettingsError(''); }}
                        sx={{ color: COLORS.fadedText, textTransform: 'none', borderRadius: 2 }}>
                        Cancel
                    </Button>
                    <Button
                        onClick={settingsTab === 0 ? handleSaveEmail : handleSavePassword}
                        disabled={settingsSaving}
                        variant="contained"
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