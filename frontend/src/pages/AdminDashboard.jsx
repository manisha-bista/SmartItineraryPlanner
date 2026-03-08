import React, { useState, useEffect } from 'react';
import {
    Box, Button, Typography, Stack, IconButton, Card,
    TextField, InputAdornment, Avatar, Chip, Drawer,
    List, ListItem, ListItemButton, ListItemIcon, ListItemText,
    Divider, Alert, CircularProgress,
    Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Tabs, Tab, Badge,
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
import BarChartIcon from '@mui/icons-material/BarChart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import LogoutIcon from '@mui/icons-material/Logout';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import RefreshIcon from '@mui/icons-material/Refresh';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import GroupIcon from '@mui/icons-material/Group';
import ExploreIcon from '@mui/icons-material/Explore';
import MapIcon from '@mui/icons-material/Map';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';

// ── Brand Colors (matches project design system) ─────────────────────────────
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

// ── Reusable: Big stat card ───────────────────────────────────────────────────
const StatCard = ({ icon, label, value, trend, trendUp, color, loading }) => (
    <Card sx={{
        bgcolor: COLORS.cardPrimary, borderRadius: 4, p: 3, flex: 1,
        border: '1px solid rgba(255,255,255,0.04)',
        transition: 'all 0.25s',
        '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: `0 10px 28px ${color}25`,
            borderColor: `${color}40`,
        }
    }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box>
                <Typography sx={{ color: COLORS.fadedText, fontSize: '0.72rem', letterSpacing: 1, textTransform: 'uppercase', mb: 0.5 }}>
                    {label}
                </Typography>
                {loading ? (
                    <CircularProgress size={22} sx={{ color, mt: 0.5 }} />
                ) : (
                    <Typography variant="h3" fontWeight={800} sx={{ color: 'white', lineHeight: 1.1, mb: 0.75 }}>
                        {value}
                    </Typography>
                )}
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
            <Box sx={{
                width: 52, height: 52, borderRadius: 3,
                bgcolor: `${color}15`, border: `1px solid ${color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                {icon}
            </Box>
        </Stack>
    </Card>
);

// ── Reusable: Section header ──────────────────────────────────────────────────
const SectionHeader = ({ title, onRefresh, loading }) => (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight={700} sx={{ color: COLORS.headings }}>
            {title}
        </Typography>
        <Tooltip title="Refresh">
            <IconButton size="small" onClick={onRefresh} disabled={loading}
                sx={{ color: COLORS.brand, bgcolor: 'rgba(51,204,204,0.08)', borderRadius: 2, '&:hover': { bgcolor: 'rgba(51,204,204,0.16)' } }}>
                <RefreshIcon sx={{ fontSize: 16, ...(loading && { animation: 'spin 1s linear infinite' }) }} />
            </IconButton>
        </Tooltip>
    </Stack>
);

// ── Table style helpers ───────────────────────────────────────────────────────
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

// ── Status chip helper ────────────────────────────────────────────────────────
const StatusChip = ({ label, color }) => (
    <Chip label={label} size="small" sx={{
        height: 20, fontSize: '0.62rem', fontWeight: 700,
        bgcolor: `${color}18`, color, border: `1px solid ${color}30`,
    }} />
);

// ── Row action menu ───────────────────────────────────────────────────────────
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

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
const AdminDashboard = () => {
    const navigate = useNavigate();

    const [admin, setAdmin] = useState({ name: 'Admin', initial: 'A' });
    const [activeTab, setActiveTab] = useState(0);
    const [search, setSearch] = useState('');

    // Data states
    const [stats, setStats] = useState({ totalUsers: 0, totalItineraries: 0, totalComplaints: 0 });
    const [users, setUsers] = useState([]);
    const [itineraries, setItineraries] = useState([]);
    const [complaints, setComplaints] = useState([]);

    // Loading states
    const [statsLoading, setStatsLoading] = useState(false);
    const [usersLoading, setUsersLoading] = useState(false);
    const [itinLoading, setItinLoading] = useState(false);
    const [compLoading, setCompLoading] = useState(false);

    // Alert state
    const [alert, setAlert] = useState({ show: false, msg: '', type: 'success' });

    // Detail dialog
    const [detailDialog, setDetailDialog] = useState({ open: false, type: '', data: null });

    useEffect(() => {
        const userId = localStorage.getItem('userId');
        const userName = localStorage.getItem('userName');
        if (!userId) { navigate('/login'); return; }
        setAdmin({ name: userName || 'Admin', initial: (userName || 'A')[0].toUpperCase() });
        loadAll();
    }, [navigate]);

    const showAlert = (msg, type = 'success') => {
        setAlert({ show: true, msg, type });
        setTimeout(() => setAlert(a => ({ ...a, show: false })), 3500);
    };

    // ── Data fetchers ──────────────────────────────────────────────────────────
    const loadAll = () => { fetchStats(); fetchUsers(); fetchItineraries(); fetchComplaints(); };

    const fetchStats = async () => {
        setStatsLoading(true);
        try {
            const [uR, iR, cR] = await Promise.allSettled([
                axios.get('http://127.0.0.1:8000/users/'),
                axios.get('http://127.0.0.1:8000/itineraries/'),
                axios.get('http://127.0.0.1:8000/complaints/'),
            ]);
            setStats({
                totalUsers:       uR.status === 'fulfilled' && Array.isArray(uR.value.data) ? uR.value.data.length : 0,
                totalItineraries: iR.status === 'fulfilled' && Array.isArray(iR.value.data) ? iR.value.data.length : 0,
                totalComplaints:  cR.status === 'fulfilled' && Array.isArray(cR.value.data) ? cR.value.data.length : 0,
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
            const res = await axios.get('http://127.0.0.1:8000/itineraries/');
            setItineraries(Array.isArray(res.data) ? res.data : []);
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

    // ── Actions ────────────────────────────────────────────────────────────────
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

    const handleLogout = () => { localStorage.clear(); navigate('/'); };

    // ── Helpers ────────────────────────────────────────────────────────────────
    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
    const getItinStatusColor = (s) => ({ planning: COLORS.brand, confirmed: COLORS.green, ongoing: COLORS.orange, completed: COLORS.fadedText, cancelled: COLORS.error }[s] || COLORS.fadedText);
    const getComplaintStatusColor = (s) => ({ open: COLORS.error, resolved: COLORS.green, pending: COLORS.orange }[s] || COLORS.fadedText);

    // Filter by search
    const filteredUsers       = users.filter(u => u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));
    const filteredItineraries = itineraries.filter(i => i.title?.toLowerCase().includes(search.toLowerCase()) || i.destination?.toLowerCase().includes(search.toLowerCase()));
    const filteredComplaints  = complaints.filter(c => c.title?.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase()));

    // Sidebar nav
    const sidebarMenu = [
        { text: 'Admin Dashboard', icon: <AdminPanelSettingsIcon />, active: true,  path: '/admin' },
        { text: 'Dashboard',       icon: <DashboardIcon />,          active: false, path: '/dashboard' },
        { text: 'My Itineraries',  icon: <ExploreIcon />,            active: false, path: '/itineraries' },
        { text: 'Interactive Map', icon: <MapIcon />,                 active: false, path: '/dashboard' },
        { text: 'Community Feed',  icon: <GroupIcon />,               active: false, path: '/community' },
    ];

    const tabLabels = [
        { label: 'Users',        count: stats.totalUsers,       color: COLORS.brand },
        { label: 'Itineraries',  count: stats.totalItineraries, color: COLORS.purple },
        { label: 'Complaints',   count: stats.totalComplaints,  color: COLORS.orange },
    ];

    // ── Empty state ───────────────────────────────────────────────────────────
    const EmptyRow = ({ cols, msg }) => (
        <TableRow>
            <TableCell colSpan={cols} sx={{ ...tdSx, textAlign: 'center', py: 5, color: COLORS.fadedText, borderBottom: 'none' }}>
                {msg}
            </TableCell>
        </TableRow>
    );

    // ── Loading rows ──────────────────────────────────────────────────────────
    const LoadingRow = ({ cols }) => (
        <TableRow>
            <TableCell colSpan={cols} sx={{ ...tdSx, textAlign: 'center', py: 4, borderBottom: 'none' }}>
                <CircularProgress size={24} sx={{ color: COLORS.brand }} />
            </TableCell>
        </TableRow>
    );

    return (
        <Box sx={{ display: 'flex', bgcolor: COLORS.background, minHeight: '100vh', width: '100vw', position: 'fixed', top: 0, left: 0, overflow: 'hidden' }}>

            {/* ──────────────────────── SIDEBAR ──────────────────────────── */}
            <Drawer variant="permanent" sx={{
                width: drawerWidth, flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: drawerWidth, boxSizing: 'border-box',
                    bgcolor: COLORS.background, borderRight: 'none',
                    backgroundImage: 'linear-gradient(to bottom, rgba(51,204,204,0.06), transparent)',
                    display: 'flex', flexDirection: 'column', overflowX: 'hidden',
                }
            }}>
                {/* Logo */}
                <Box sx={{ p: 3 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Box component="span" sx={{ color: COLORS.brand, fontSize: '1.5rem' }}>✈</Box>
                        <Typography variant="h6" fontWeight="bold" sx={{ color: 'white', fontFamily: '"Exo 2", sans-serif', letterSpacing: 0.5 }}>
                            Smart <Box component="span" sx={{ color: COLORS.brand }}>Itinerary</Box>
                        </Typography>
                    </Stack>
                    {/* Admin badge */}
                    <Box sx={{ mt: 1.5, ml: 0.5 }}>
                        <Chip label="ADMIN PANEL" size="small" sx={{
                            bgcolor: 'rgba(51,204,204,0.12)', color: COLORS.brand,
                            border: '1px solid rgba(51,204,204,0.25)', fontSize: '0.6rem',
                            fontWeight: 700, letterSpacing: 1, height: 18,
                        }} />
                    </Box>
                </Box>

                {/* Nav */}
                <List sx={{ px: 2, mt: 1 }}>
                    {sidebarMenu.map((item) => (
                        <ListItem key={item.text} disablePadding sx={{ mb: 0.75 }}>
                            <ListItemButton selected={item.active} onClick={() => navigate(item.path)} sx={{
                                borderRadius: 2,
                                color: item.active ? COLORS.background : COLORS.subheadings,
                                '&.Mui-selected': { bgcolor: COLORS.brand, color: COLORS.background, '&:hover': { bgcolor: '#2db8b8' } },
                                '&:hover': { bgcolor: COLORS.cardSecondary }
                            }}>
                                <ListItemIcon sx={{ color: item.active ? COLORS.background : COLORS.subheadings, minWidth: 38 }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: item.active ? 'bold' : 'medium', fontSize: '0.87rem' }} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mx: 2, my: 1 }} />

                {/* Sidebar quick stats */}
                <Box sx={{ px: 2, py: 1 }}>
                    <Typography variant="caption" sx={{ color: COLORS.fadedText, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', fontSize: '0.62rem', pl: 0.5 }}>
                        Quick Stats
                    </Typography>
                    {[
                        { label: 'Total Users',       value: stats.totalUsers,       icon: <PeopleAltIcon sx={{ fontSize: 13, color: COLORS.brand }} />,  color: COLORS.brand },
                        { label: 'Total Itineraries', value: stats.totalItineraries, icon: <MapOutlinedIcon sx={{ fontSize: 13, color: COLORS.purple }} />, color: COLORS.purple },
                        { label: 'Open Complaints',   value: complaints.filter(c => c.status !== 'resolved').length, icon: <ReportProblemOutlinedIcon sx={{ fontSize: 13, color: COLORS.orange }} />, color: COLORS.orange },
                    ].map((s, i) => (
                        <Stack key={i} direction="row" alignItems="center" justifyContent="space-between" sx={{
                            mt: 1.2, px: 1.5, py: 1, borderRadius: 2,
                            bgcolor: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.05)',
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
                <Box sx={{ p: 2 }}>
                    <Button fullWidth startIcon={<LogoutIcon />} onClick={handleLogout} sx={{ color: COLORS.fadedText, bgcolor: 'transparent', '&:hover': { color: COLORS.error, bgcolor: 'rgba(255,107,107,0.1)' } }}>
                        Logout
                    </Button>
                </Box>
            </Drawer>

            {/* ──────────────────── MAIN CONTENT ─────────────────────────── */}
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
                        {/* Search */}
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

                        {/* Refresh all */}
                        <Tooltip title="Refresh all data">
                            <IconButton onClick={loadAll} sx={{ bgcolor: COLORS.cardPrimary, color: COLORS.brand, borderRadius: 2, '&:hover': { bgcolor: 'rgba(51,204,204,0.12)' } }}>
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>

                        {/* Notifications */}
                        <IconButton sx={{ bgcolor: COLORS.cardPrimary, color: COLORS.icons, position: 'relative', borderRadius: 2, '&:hover': { bgcolor: COLORS.cardSecondary } }}>
                            <NotificationsIcon />
                            {complaints.filter(c => c.status !== 'resolved').length > 0 && (
                                <Box sx={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, bgcolor: COLORS.error, borderRadius: '50%' }} />
                            )}
                        </IconButton>

                        {/* Admin Avatar */}
                        <Avatar sx={{ bgcolor: COLORS.brand, color: COLORS.background, fontWeight: 'bold', width: 42, height: 42, cursor: 'pointer', '&:hover': { transform: 'scale(1.08)' }, transition: 'transform 0.2s' }}>
                            {admin.initial}
                        </Avatar>
                    </Stack>
                </Stack>

                {/* Alert */}
                {alert.show && (
                    <Alert severity={alert.type} sx={{ mb: 3, borderRadius: 3 }} onClose={() => setAlert(a => ({ ...a, show: false }))}>
                        {alert.msg}
                    </Alert>
                )}

                {/* ── Analytics Stat Cards ──────────────────────────────── */}
                <Stack direction="row" spacing={2.5} sx={{ mb: 4 }}>
                    <StatCard
                        icon={<PeopleAltIcon sx={{ fontSize: 24, color: COLORS.brand }} />}
                        label="Total Users" value={stats.totalUsers.toLocaleString()}
                        trend="+12%" trendUp={true} color={COLORS.brand} loading={statsLoading}
                    />
                    <StatCard
                        icon={<MapOutlinedIcon sx={{ fontSize: 24, color: COLORS.purple }} />}
                        label="Total Itineraries" value={stats.totalItineraries.toLocaleString()}
                        trend="+8%" trendUp={true} color={COLORS.purple} loading={statsLoading}
                    />
                    <StatCard
                        icon={<ReportProblemOutlinedIcon sx={{ fontSize: 24, color: COLORS.orange }} />}
                        label="Total Complaints" value={stats.totalComplaints.toLocaleString()}
                        trend="-3%" trendUp={false} color={COLORS.orange} loading={statsLoading}
                    />
                    <StatCard
                        icon={<CheckCircleOutlineIcon sx={{ fontSize: 24, color: COLORS.green }} />}
                        label="Resolved" value={complaints.filter(c => c.status === 'resolved').length.toLocaleString()}
                        trend="+5%" trendUp={true} color={COLORS.green} loading={statsLoading}
                    />
                </Stack>

                {/* ── Tabs ─────────────────────────────────────────────── */}
                <Box sx={{ mb: 3 }}>
                    <Tabs
                        value={activeTab}
                        onChange={(_, v) => setActiveTab(v)}
                        sx={{
                            '& .MuiTab-root': { color: COLORS.fadedText, textTransform: 'none', fontWeight: 600, fontSize: '0.88rem', minHeight: 44 },
                            '& .Mui-selected': { color: COLORS.brand },
                            '& .MuiTabs-indicator': { bgcolor: COLORS.brand, height: 3, borderRadius: 2 },
                        }}
                    >
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

                {/* ── USERS TABLE ──────────────────────────────────────── */}
                {activeTab === 0 && (
                    <Box>
                        <SectionHeader title="All Users" onRefresh={fetchUsers} loading={usersLoading} />
                        <TableContainer component={Paper} sx={{ bgcolor: COLORS.cardPrimary, borderRadius: 4, boxShadow: 'none', border: '1px solid rgba(255,255,255,0.04)' }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={thSx}>#</TableCell>
                                        <TableCell sx={thSx}>Name</TableCell>
                                        <TableCell sx={thSx}>Email</TableCell>
                                        <TableCell sx={thSx}>Joined</TableCell>
                                        <TableCell sx={thSx}>Itineraries</TableCell>
                                        <TableCell sx={thSx}>Role</TableCell>
                                        <TableCell sx={{ ...thSx, textAlign: 'right' }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {usersLoading ? <LoadingRow cols={7} /> :
                                     filteredUsers.length === 0 ? <EmptyRow cols={7} msg="No users found." /> :
                                     filteredUsers.map((u, idx) => (
                                        <TableRow key={u.id} sx={{ '&:hover': { bgcolor: 'rgba(51,204,204,0.03)' }, '&:last-child td': { borderBottom: 'none' } }}>
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
                                            <TableCell sx={{ ...tdSx, textAlign: 'right' }}>
                                                <RowMenu
                                                    onView={() => setDetailDialog({ open: true, type: 'user', data: u })}
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

                {/* ── ITINERARIES TABLE ─────────────────────────────────── */}
                {activeTab === 1 && (
                    <Box>
                        <SectionHeader title="All Itineraries" onRefresh={fetchItineraries} loading={itinLoading} />
                        <TableContainer component={Paper} sx={{ bgcolor: COLORS.cardPrimary, borderRadius: 4, boxShadow: 'none', border: '1px solid rgba(255,255,255,0.04)' }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={thSx}>#</TableCell>
                                        <TableCell sx={thSx}>Trip Name</TableCell>
                                        <TableCell sx={thSx}>Destination</TableCell>
                                        <TableCell sx={thSx}>Start Date</TableCell>
                                        <TableCell sx={thSx}>End Date</TableCell>
                                        <TableCell sx={thSx}>Budget</TableCell>
                                        <TableCell sx={thSx}>Status</TableCell>
                                        <TableCell sx={{ ...thSx, textAlign: 'right' }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {itinLoading ? <LoadingRow cols={8} /> :
                                     filteredItineraries.length === 0 ? <EmptyRow cols={8} msg="No itineraries found." /> :
                                     filteredItineraries.map((it, idx) => (
                                        <TableRow key={it.id} sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'rgba(51,204,204,0.03)' }, '&:last-child td': { borderBottom: 'none' } }}>
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
                                                <StatusChip label={it.status?.toUpperCase() || 'UNKNOWN'} color={getItinStatusColor(it.status)} />
                                            </TableCell>
                                            <TableCell sx={{ ...tdSx, textAlign: 'right' }}>
                                                <RowMenu
                                                    onView={() => navigate(`/itinerary/${it.id}`)}
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

                {/* ── COMPLAINTS TABLE ──────────────────────────────────── */}
                {activeTab === 2 && (
                    <Box>
                        <SectionHeader title="All Complaints" onRefresh={fetchComplaints} loading={compLoading} />
                        <TableContainer component={Paper} sx={{ bgcolor: COLORS.cardPrimary, borderRadius: 4, boxShadow: 'none', border: '1px solid rgba(255,255,255,0.04)' }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={thSx}>#</TableCell>
                                        <TableCell sx={thSx}>Title</TableCell>
                                        <TableCell sx={thSx}>Description</TableCell>
                                        <TableCell sx={thSx}>Submitted By</TableCell>
                                        <TableCell sx={thSx}>Date</TableCell>
                                        <TableCell sx={thSx}>Status</TableCell>
                                        <TableCell sx={{ ...thSx, textAlign: 'right' }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {compLoading ? <LoadingRow cols={7} /> :
                                     filteredComplaints.length === 0 ? <EmptyRow cols={7} msg="No complaints found." /> :
                                     filteredComplaints.map((c, idx) => (
                                        <TableRow key={c.id} sx={{ '&:hover': { bgcolor: 'rgba(251,146,60,0.03)' }, '&:last-child td': { borderBottom: 'none' } }}>
                                            <TableCell sx={{ ...tdSx, color: COLORS.fadedText }}>{idx + 1}</TableCell>
                                            <TableCell sx={{ ...tdSx, color: COLORS.headings, fontWeight: 600, maxWidth: 180 }}>
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
            </Box>

            {/* ── Detail Dialog ─────────────────────────────────────────── */}
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
                                { label: 'User ID', value: detailDialog.data.id },
                                { label: 'Role', value: detailDialog.data.role || 'user' },
                                { label: 'Joined', value: formatDate(detailDialog.data.created_at) },
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
                                { label: 'Title', value: detailDialog.data.title },
                                { label: 'Description', value: detailDialog.data.description },
                                { label: 'Submitted By', value: detailDialog.data.user_name || `User #${detailDialog.data.user_id}` },
                                { label: 'Date', value: formatDate(detailDialog.data.created_at) },
                                { label: 'Status', value: detailDialog.data.status || 'open' },
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

            {/* CSS for refresh spin animation */}
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </Box>
    );
};

export default AdminDashboard;