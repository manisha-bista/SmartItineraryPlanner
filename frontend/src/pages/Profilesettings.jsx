import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Stack, Avatar, Button, TextField,
    MenuItem, Select, FormControl, IconButton, List,
    ListItem, ListItemButton, ListItemIcon, ListItemText, Drawer
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import DashboardIcon      from '@mui/icons-material/Dashboard';
import MapIcon            from '@mui/icons-material/Map';
import GroupIcon          from '@mui/icons-material/Group';
import ExploreIcon        from '@mui/icons-material/Explore';
import LogoutIcon         from '@mui/icons-material/Logout';
import SearchIcon         from '@mui/icons-material/Search';
import NotificationsIcon  from '@mui/icons-material/NotificationsOutlined';
import EmailOutlinedIcon  from '@mui/icons-material/EmailOutlined';
import AddIcon            from '@mui/icons-material/Add';
import FlightTakeoffIcon  from '@mui/icons-material/FlightTakeoff';
import EditOutlinedIcon   from '@mui/icons-material/EditOutlined';

// ─── Design System ────────────────────────────────────────────
const C = {
    brand:   '#33CCCC',
    bg:      '#141627',
    card:    '#252845',
    input:   '#1e2240',
    error:   '#ff6b6b',
    divider: 'rgba(255,255,255,0.08)',
    white:   '#ffffff',
    dim:     'rgba(255,255,255,0.55)',   // secondary/placeholder text
};

const DRAWER_W = 240;

// Field — white text always, visible dark bg
const fieldSx = (editing) => ({
    '& .MuiOutlinedInput-root': {
        bgcolor: editing ? C.input : '#1e2240',
        borderRadius: 2.5,
        color: C.white,
        fontSize: '0.9rem',
        transition: 'all 0.2s',
        '& fieldset': { borderColor: editing ? 'rgba(255,255,255,0.15)' : 'transparent' },
        '&:hover fieldset': { borderColor: C.brand },
        '&.Mui-focused fieldset': { borderColor: C.brand, borderWidth: 1.5 },
        '&.Mui-disabled': {
            bgcolor: '#1e2240',
            WebkitTextFillColor: C.white,
        },
    },
    '& .MuiInputBase-input': {
        py: 1.4,
        color: C.white,
        WebkitTextFillColor: C.white,       // ← override MUI disabled grey
    },
    '& .MuiInputBase-input.Mui-disabled': {
        WebkitTextFillColor: C.white,       // ← specifically target disabled state
        color: C.white,
    },
    '& .MuiInputBase-input::placeholder': { color: C.dim, opacity: 1 },
    '& .MuiFormHelperText-root': { color: C.error },
});

// Select — white text always
const selectSx = (editing) => ({
    bgcolor: editing ? C.input : '#1e2240',
    borderRadius: 2.5,
    color: C.white,
    fontSize: '0.9rem',
    transition: 'all 0.2s',
    '& .MuiOutlinedInput-notchedOutline': { borderColor: editing ? 'rgba(255,255,255,0.15)' : 'transparent' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: C.brand },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: C.brand, borderWidth: 1.5 },
    '&.Mui-disabled': {
        WebkitTextFillColor: C.white,
        bgcolor: '#1e2240',
    },
    '& .MuiSelect-select': {
        WebkitTextFillColor: C.white,       // ← force white on select value text
        color: C.white,
    },
    '& .MuiSelect-select.Mui-disabled': {
        WebkitTextFillColor: C.white,       // ← force white when disabled
    },
    '& .MuiSelect-icon': { color: C.white },
    '& .MuiSvgIcon-root': { color: C.white },
});

const labelSx = {
    fontSize: '0.78rem',
    fontWeight: 700,
    color: C.white,
    mb: 0.75,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
};

// Dark dropdown menu for Select components
const darkMenuProps = {
    PaperProps: {
        sx: {
            bgcolor: '#1e2240',
            backgroundImage: 'none',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 2.5,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            '& .MuiMenuItem-root': {
                color: C.white,
                fontSize: '0.9rem',
                py: 1,
                '&:hover': { bgcolor: 'rgba(51,204,204,0.12)' },
                '&.Mui-selected': {
                    bgcolor: 'rgba(51,204,204,0.18)',
                    color: C.brand,
                    '&:hover': { bgcolor: 'rgba(51,204,204,0.22)' },
                },
            },
        },
    },
};

const NAV = [
    { text: 'Dashboard',       icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'My Itineraries',  icon: <ExploreIcon />,   path: '/itineraries' },
    { text: 'Interactive Map', icon: <MapIcon />,        path: '/dashboard' },
    { text: 'Community Feed',  icon: <GroupIcon />,      path: '/community' },
];

export default function ProfileSettings() {
    const navigate = useNavigate();

    const [user, setUser]       = useState({ name: 'User', email: '', initial: 'U' });
    const [editing, setEditing] = useState(false);
    const [form, setForm]       = useState({
        fullName: '', nickName: '', gender: '',
        country: '', language: '', timeZone: '',
    });

    useEffect(() => {
        const uid   = localStorage.getItem('userId');
        const uname = localStorage.getItem('userName') || 'User';
        const email = localStorage.getItem('userEmail') || '';
        if (!uid) { navigate('/login'); return; }
        setUser({ name: uname, email, initial: uname[0].toUpperCase() });
        setForm(p => ({ ...p, fullName: uname, nickName: uname.split(' ')[0] }));
    }, [navigate]);

    const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

    const handleSave = async () => {
        try {
            const uid = localStorage.getItem('userId');
            await axios.put(`http://127.0.0.1:8000/users/${uid}`, { name: form.fullName });
            localStorage.setItem('userName', form.fullName);
            setUser(p => ({ ...p, name: form.fullName, initial: form.fullName[0].toUpperCase() }));
        } catch (err) { console.error('Update failed:', err); }
        setEditing(false);
    };

    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'short', day: '2-digit', month: 'long', year: 'numeric'
    });

    return (
        <Box sx={{ display: 'flex', bgcolor: C.bg, minHeight: '100vh', width: '100vw', position: 'fixed', top: 0, left: 0, overflow: 'hidden' }}>

            {/* ══ SIDEBAR ══════════════════════════════════════ */}
            <Drawer variant="permanent" sx={{
                width: DRAWER_W, flexShrink: 0,
                bgcolor: C.bg,
                '& .MuiDrawer-paper': {
                    width: DRAWER_W,
                    borderRight: 'none',
                    background: `linear-gradient(180deg, #1a1d35 0%, ${C.bg} 100%)`,
                    boxShadow: '4px 0 24px rgba(0,0,0,0.4)',
                    display: 'flex', flexDirection: 'column',
                },
            }}>
                {/* Logo */}
                <Box sx={{ px: 3, pt: 3.5, pb: 2.5 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <FlightTakeoffIcon sx={{ color: C.error, fontSize: 22 }} />
                        <Typography fontWeight={800} sx={{ color: C.white, fontSize: '1rem', letterSpacing: 0.3 }}>
                            Smart <Box component="span" sx={{ color: C.brand }}>Itinerary</Box>
                        </Typography>
                    </Stack>
                </Box>

                {/* Nav */}
                <List sx={{ px: 1.5, mt: 1, flexGrow: 1 }}>
                    {NAV.map(item => (
                        <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                            <ListItemButton onClick={() => navigate(item.path)} sx={{
                                borderRadius: 2.5, py: 1.3, px: 2,
                                color: C.white, transition: 'all 0.2s',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.07)', color: C.white },
                            }}>
                                <ListItemIcon sx={{ color: C.white, minWidth: 36 }}>{item.icon}</ListItemIcon>
                                <ListItemText primary={item.text}
                                    primaryTypographyProps={{ fontWeight: 500, fontSize: '0.88rem', color: C.white }} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>

                {/* Logout */}
                <Box sx={{ px: 1.5, pb: 3 }}>
                    <ListItemButton onClick={() => { localStorage.clear(); navigate('/'); }} sx={{
                        borderRadius: 2.5, py: 1.3, px: 2, color: C.white,
                        '&:hover': { color: C.error, bgcolor: 'rgba(255,107,107,0.08)' },
                    }}>
                        <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}><LogoutIcon /></ListItemIcon>
                        <ListItemText primary="Logout"
                            primaryTypographyProps={{ fontWeight: 500, fontSize: '0.88rem' }} />
                    </ListItemButton>
                </Box>
            </Drawer>

            {/* ══ MAIN ═════════════════════════════════════════ */}
            <Box sx={{ flexGrow: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', bgcolor: C.bg, height: '100vh' }}>

                {/* Top Bar */}
                <Stack direction="row" justifyContent="space-between" alignItems="center"
                    sx={{ px: 4, pt: 3, pb: 2.5 }}>
                    <Box>
                        <Typography variant="h5" fontWeight={800} sx={{ color: C.white }}>
                            Profile Settings
                        </Typography>
                        <Typography variant="body2" sx={{ color: C.dim, mt: 0.3, fontSize: '0.8rem' }}>
                            {today}
                        </Typography>
                    </Box>

                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Stack direction="row" alignItems="center" spacing={1} sx={{
                            bgcolor: C.card, borderRadius: 3, px: 2, py: 1, minWidth: 200,
                        }}>
                            <SearchIcon sx={{ color: C.dim, fontSize: 17 }} />
                            <Typography variant="body2" sx={{ color: C.dim, fontSize: '0.82rem' }}>Search…</Typography>
                        </Stack>

                        <IconButton sx={{ bgcolor: C.card, borderRadius: 2.5, '&:hover': { bgcolor: '#2d3154' } }}>
                            <NotificationsIcon sx={{ color: C.white, fontSize: 20 }} />
                        </IconButton>

                        <Avatar onClick={() => navigate('/profile')} sx={{
                            bgcolor: C.brand, color: C.bg, fontWeight: 700,
                            width: 38, height: 38, cursor: 'pointer',
                            boxShadow: `0 0 0 2px ${C.brand}55`,
                            '&:hover': { transform: 'scale(1.07)' },
                            transition: 'all 0.2s',
                        }}>
                            {user.initial}
                        </Avatar>
                    </Stack>
                </Stack>

                {/* ── Content ── */}
                <Box sx={{ px: 4, pb: 5, flexGrow: 1 }}>

                    {/* Hero banner */}
                    <Box sx={{
                        height: 100, borderRadius: 4, mb: 0,
                        background: `linear-gradient(120deg,
                            rgba(51,204,204,0.25) 0%,
                            rgba(51,204,204,0.08) 40%,
                            rgba(255,107,107,0.08) 100%)`,
                        position: 'relative', overflow: 'hidden',
                    }}>
                        <Box sx={{ position: 'absolute', top: -30, right: 60, width: 120, height: 120,
                            borderRadius: '50%', bgcolor: 'rgba(51,204,204,0.08)' }} />
                        <Box sx={{ position: 'absolute', top: 10, right: 20, width: 60, height: 60,
                            borderRadius: '50%', bgcolor: 'rgba(51,204,204,0.06)' }} />
                    </Box>

                    {/* Profile Card */}
                    <Box sx={{
                        bgcolor: C.card, borderRadius: 4,
                        px: 4, pt: 0, pb: 4,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    }}>
                        {/* Avatar + name row */}
                        <Stack direction="row" alignItems="flex-end" justifyContent="space-between"
                            sx={{ mb: 4 }}>
                            <Stack direction="row" alignItems="flex-end" spacing={2.5}>
                                <Box sx={{ position: 'relative', mt: -4 }}>
                                    <Avatar sx={{
                                        width: 80, height: 80,
                                        bgcolor: C.brand, color: C.bg,
                                        fontSize: '2rem', fontWeight: 700,
                                        border: `3px solid ${C.card}`,
                                        boxShadow: `0 4px 20px rgba(51,204,204,0.35)`,
                                    }}>
                                        {user.initial}
                                    </Avatar>
                                    <Box sx={{
                                        position: 'absolute', bottom: 2, right: 2,
                                        width: 22, height: 22, borderRadius: '50%',
                                        bgcolor: C.brand, display: 'flex',
                                        alignItems: 'center', justifyContent: 'center',
                                        border: `2px solid ${C.card}`, cursor: 'pointer',
                                    }}>
                                        <EditOutlinedIcon sx={{ fontSize: 11, color: C.bg }} />
                                    </Box>
                                </Box>
                                <Box sx={{ pb: 0.5 }}>
                                    <Typography variant="h6" fontWeight={700} sx={{ color: C.white, lineHeight: 1.2 }}>
                                        {user.name}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: C.dim, fontSize: '0.82rem' }}>
                                        {user.email || 'user@example.com'}
                                    </Typography>
                                </Box>
                            </Stack>

                            {/* Edit / Save / Cancel */}
                            {editing ? (
                                <Stack direction="row" spacing={1.5} sx={{ pb: 0.5 }}>
                                    <Button onClick={() => setEditing(false)} sx={{
                                        color: C.white, borderRadius: 2.5, textTransform: 'none',
                                        fontWeight: 600, px: 2.5,
                                        '&:hover': { bgcolor: 'rgba(255,255,255,0.07)' },
                                    }}>Cancel</Button>
                                    <Button variant="contained" onClick={handleSave} sx={{
                                        bgcolor: C.brand, color: C.bg, borderRadius: 2.5,
                                        fontWeight: 700, textTransform: 'none', px: 3,
                                        boxShadow: `0 4px 14px rgba(51,204,204,0.35)`,
                                        '&:hover': { bgcolor: '#2db8b8' },
                                    }}>Save Changes</Button>
                                </Stack>
                            ) : (
                                <Button variant="contained" onClick={() => setEditing(true)} sx={{
                                    bgcolor: C.brand, color: C.bg, borderRadius: 2.5,
                                    fontWeight: 700, textTransform: 'none', px: 3,
                                    boxShadow: `0 4px 14px rgba(51,204,204,0.3)`,
                                    transition: 'all 0.25s',
                                    '&:hover': {
                                        bgcolor: '#2db8b8',
                                        transform: 'translateY(-1px)',
                                        boxShadow: `0 6px 18px rgba(51,204,204,0.45)`,
                                    },
                                }}>
                                    Edit Profile
                                </Button>
                            )}
                        </Stack>

                        {/* Section title */}
                        <Typography sx={{
                            color: C.white, mb: 2.5, fontSize: '0.82rem',
                            fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1,
                        }}>
                            Personal Information
                        </Typography>

                        {/* 2-col grid */}
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 4 }}>

                            <Box>
                                <Typography sx={labelSx}>Full Name</Typography>
                                <TextField fullWidth placeholder="Your full name"
                                    value={form.fullName} onChange={set('fullName')}
                                    disabled={!editing} sx={fieldSx(editing)} />
                            </Box>

                            <Box>
                                <Typography sx={labelSx}>Nick Name</Typography>
                                <TextField fullWidth placeholder="Your nick name"
                                    value={form.nickName} onChange={set('nickName')}
                                    disabled={!editing} sx={fieldSx(editing)} />
                            </Box>

                            <Box>
                                <Typography sx={labelSx}>Gender</Typography>
                                <FormControl fullWidth>
                                    <Select displayEmpty value={form.gender} onChange={set('gender')}
                                        disabled={!editing} sx={selectSx(editing)}
                                        MenuProps={darkMenuProps}
                                        renderValue={v => v ||
                                            <span style={{ color: C.dim }}>Select gender</span>}>
                                        {['Male','Female','Non-binary','Prefer not to say'].map(o =>
                                            <MenuItem key={o} value={o}>{o}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Box>

                            <Box>
                                <Typography sx={labelSx}>Country</Typography>
                                <FormControl fullWidth>
                                    <Select displayEmpty value={form.country} onChange={set('country')}
                                        disabled={!editing} sx={selectSx(editing)}
                                        MenuProps={darkMenuProps}
                                        renderValue={v => v ||
                                            <span style={{ color: C.dim }}>Select country</span>}>
                                        {['Nepal','India','USA','UK','Australia','Other'].map(o =>
                                            <MenuItem key={o} value={o}>{o}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Box>

                            <Box>
                                <Typography sx={labelSx}>Language</Typography>
                                <FormControl fullWidth>
                                    <Select displayEmpty value={form.language} onChange={set('language')}
                                        disabled={!editing} sx={selectSx(editing)}
                                        MenuProps={darkMenuProps}
                                        renderValue={v => v ||
                                            <span style={{ color: C.dim }}>Select language</span>}>
                                        {['English','Nepali','Hindi','Other'].map(o =>
                                            <MenuItem key={o} value={o}>{o}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Box>

                            <Box>
                                <Typography sx={labelSx}>Time Zone</Typography>
                                <FormControl fullWidth>
                                    <Select displayEmpty value={form.timeZone} onChange={set('timeZone')}
                                        disabled={!editing} sx={selectSx(editing)}
                                        MenuProps={darkMenuProps}
                                        renderValue={v => v ||
                                            <span style={{ color: C.dim }}>Select time zone</span>}>
                                        {[
                                            'Asia/Kathmandu (UTC+5:45)',
                                            'Asia/Kolkata (UTC+5:30)',
                                            'UTC',
                                            'America/New_York (UTC-5)',
                                            'Europe/London (UTC+0)',
                                        ].map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Box>
                        </Box>

                        {/* Divider */}
                        <Box sx={{ height: 1, bgcolor: C.divider, mb: 3 }} />

                        {/* Email section title */}
                        <Typography sx={{
                            color: C.white, mb: 2.5, fontSize: '0.82rem',
                            fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1,
                        }}>
                            My Email Address
                        </Typography>

                        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2.5 }}>
                            <Box sx={{
                                width: 42, height: 42, borderRadius: 2.5, flexShrink: 0,
                                bgcolor: 'rgba(51,204,204,0.12)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <EmailOutlinedIcon sx={{ color: C.brand, fontSize: 20 }} />
                            </Box>
                            <Box>
                                <Typography variant="body2" fontWeight={600} sx={{ color: C.white, fontSize: '0.88rem' }}>
                                    {user.email || 'user@example.com'}
                                </Typography>
                                <Typography variant="caption" sx={{ color: C.dim, fontSize: '0.74rem' }}>
                                    1 month ago
                                </Typography>
                            </Box>
                        </Stack>

                        <Button startIcon={<AddIcon />} sx={{
                            color: C.brand,
                            bgcolor: 'rgba(51,204,204,0.08)',
                            borderRadius: 2.5, textTransform: 'none',
                            fontWeight: 600, fontSize: '0.82rem', px: 2.5, py: 0.9,
                            '&:hover': { bgcolor: 'rgba(51,204,204,0.15)' },
                        }}>
                            + Add Email Address
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}