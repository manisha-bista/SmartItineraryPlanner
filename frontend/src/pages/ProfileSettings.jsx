import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Stack, Avatar, Button, TextField,
    IconButton, Chip, Snackbar, Alert, Switch,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import Navbar, { DRAWER_WIDTH } from '../components/Navbar';

import SearchIcon        from '@mui/icons-material/Search';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import EditOutlinedIcon  from '@mui/icons-material/EditOutlined';
import LightModeIcon     from '@mui/icons-material/LightMode';
import DarkModeIcon      from '@mui/icons-material/DarkMode';

// ── Avatars ───────────────────────────────────────────────────────────────────
const AVATAR_LIST = [
    { id: 1,  style: 'notionists', seed: 'explorer',  color: '#33CCCC' },
    { id: 2,  style: 'notionists', seed: 'summit',    color: '#EC407A' },
    { id: 3,  style: 'notionists', seed: 'atlas',     color: '#5C6BC0' },
    { id: 4,  style: 'notionists', seed: 'voyage',    color: '#26A69A' },
    { id: 5,  style: 'notionists', seed: 'horizon',   color: '#AB47BC' },
    { id: 6,  style: 'notionists', seed: 'trailhead', color: '#FF7043' },
    { id: 7,  style: 'notionists', seed: 'meridian',  color: '#42A5F5' },
    { id: 8,  style: 'notionists', seed: 'solstice',  color: '#66BB6A' },
    { id: 9,  style: 'micah',      seed: 'peak',      color: '#FFB74D' },
    { id: 10, style: 'micah',      seed: 'nomad',     color: '#EF5350' },
    { id: 11, style: 'micah',      seed: 'delta',     color: '#7E57C2' },
    { id: 12, style: 'micah',      seed: 'canyon',    color: '#0097A7' },
    { id: 13, style: 'micah',      seed: 'sierra',    color: '#F06292' },
    { id: 14, style: 'micah',      seed: 'fjord',     color: '#8D6E63' },
    { id: 15, style: 'micah',      seed: 'savanna',   color: '#4DB6AC' },
    { id: 16, style: 'micah',      seed: 'tundra',    color: '#FF8A65' },
    { id: 17, style: 'lorelei',    seed: 'celeste',   color: '#BA68C8' },
    { id: 18, style: 'lorelei',    seed: 'aurora',    color: '#4DD0E1' },
    { id: 19, style: 'lorelei',    seed: 'marina',    color: '#AED581' },
    { id: 20, style: 'lorelei',    seed: 'sahara',    color: '#FFD54F' },
    { id: 21, style: 'lorelei',    seed: 'soleil',    color: '#FF7043' },
    { id: 22, style: 'lorelei',    seed: 'zephyr',    color: '#CE93D8' },
    { id: 23, style: 'personas',   seed: 'trek',      color: '#26A69A' },
    { id: 24, style: 'personas',   seed: 'ridge',     color: '#5C6BC0' },
    { id: 25, style: 'personas',   seed: 'orion',     color: '#EC407A' },
    { id: 26, style: 'personas',   seed: 'cairo',     color: '#33CCCC' },
    { id: 27, style: 'personas',   seed: 'rio',       color: '#FF5722' },
    { id: 28, style: 'personas',   seed: 'jade',      color: '#66BB6A' },
    { id: 29, style: 'personas',   seed: 'venice',    color: '#7E57C2' },
    { id: 30, style: 'personas',   seed: 'kyoto',     color: '#F06292' },
];
const getAvatarUrl   = (id) => { const av = AVATAR_LIST.find(a => a.id === id) || AVATAR_LIST[0]; return `https://api.dicebear.com/7.x/${av.style}/svg?seed=${av.seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`; };
const getAvatarColor = (id) => { const av = AVATAR_LIST.find(a => a.id === id) || AVATAR_LIST[0]; return av.color; };

// ═════════════════════════════════════════════════════════════════════════════
export default function ProfileSettings() {
    const navigate = useNavigate();
    const { COLORS, isDark, toggleTheme } = useTheme();

    const C = {
        brand:  COLORS.brand,
        bg:     COLORS.background,
        card:   COLORS.cardPrimary,
        input:  COLORS.inputBg,
        border: COLORS.cardBorder,
        white:  COLORS.headings,
        dim:    COLORS.fadedText,
        error:  '#ff6b6b',
        text:   COLORS.text,
    };

    const fieldSx = (editing) => ({
        '& .MuiOutlinedInput-root': {
            bgcolor: C.input,
            borderRadius: 2.5, color: C.white, fontSize: '0.9rem', transition: 'all 0.2s',
            '& fieldset': { borderColor: editing ? COLORS.cardBorder : 'transparent' },
            '&:hover fieldset': { borderColor: C.brand },
            '&.Mui-focused fieldset': { borderColor: C.brand, borderWidth: 1.5 },
            '&.Mui-disabled': { bgcolor: C.input, WebkitTextFillColor: C.white },
        },
        '& .MuiInputBase-input': { py: 1.4, color: C.white, WebkitTextFillColor: C.white },
        '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: C.white, color: C.white },
        '& .MuiInputBase-input::placeholder': { color: C.dim, opacity: 1 },
        '& .MuiFormHelperText-root': { color: C.error },
    });

    // read-only variant — dimmed text to signal non-editable
    const readOnlySx = {
        '& .MuiOutlinedInput-root': {
            bgcolor: C.input, borderRadius: 2.5, color: C.dim, fontSize: '0.9rem',
            '& fieldset': { borderColor: 'transparent' },
            '&.Mui-disabled': { bgcolor: C.input, WebkitTextFillColor: C.dim },
        },
        '& .MuiInputBase-input': { py: 1.4, WebkitTextFillColor: C.dim },
        '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: C.dim },
        '& .MuiFormHelperText-root': { color: C.dim, fontSize: '0.7rem' },
    };

    const labelSx = {
        fontSize: '0.78rem', fontWeight: 700, color: C.white,
        mb: 0.75, textTransform: 'uppercase', letterSpacing: 0.8,
    };

    const [user, setUser]       = useState({ name: 'User', email: '', initial: 'U', username: '', avatarId: 1 });
    const [editing, setEditing] = useState(false);
    const [form, setForm]       = useState({ fullName: '', bio: '', avatarId: 1 });
    const [snack, setSnack]     = useState({ open: false, msg: '', sev: 'success' });
    const toast = (msg, sev = 'success') => setSnack({ open: true, msg, sev });

    useEffect(() => {
        const uid      = localStorage.getItem('userId');
        const uname    = localStorage.getItem('userName') || 'User';
        const email    = localStorage.getItem('userEmail') || '';
        const username = localStorage.getItem('username') || '';
        const avatarId = parseInt(localStorage.getItem('avatarId')) || 1;
        if (!uid) { navigate('/login'); return; }
        setUser({ name: uname, email, initial: uname[0].toUpperCase(), username, avatarId });
        setForm(p => ({ ...p, fullName: uname, avatarId, bio: '' }));
        axios.get(`http://127.0.0.1:8000/users/${uid}`).then(r => {
            const u = r.data;
            setUser(prev => ({ ...prev, username: u.username || '', avatarId: u.avatar_id || 1 }));
            setForm(prev => ({ ...prev, fullName: u.name, bio: u.bio || '', avatarId: u.avatar_id || 1 }));
        }).catch(() => {});
    }, [navigate]);

    const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

    const handleSave = async () => {
        try {
            const uid = localStorage.getItem('userId');
            await axios.put(`http://127.0.0.1:8000/users/${uid}`, {
                name: form.fullName, bio: form.bio || null, avatar_id: form.avatarId,
            });
            localStorage.setItem('userName', form.fullName);
            localStorage.setItem('avatarId', form.avatarId);
            setUser(p => ({ ...p, name: form.fullName, initial: form.fullName[0].toUpperCase(), avatarId: form.avatarId }));
            toast('Profile updated!');
        } catch { toast('Update failed.', 'error'); }
        setEditing(false);
    };

    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'short', day: '2-digit', month: 'long', year: 'numeric',
    });

    return (
        <Box sx={{ display: 'flex', bgcolor: C.bg, minHeight: '100vh', width: '100vw', position: 'fixed', top: 0, left: 0, overflow: 'hidden' }}>

            <Navbar />

            {/* ── MAIN ─────────────────────────────────────────────────────── */}
            <Box sx={{ flexGrow: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', bgcolor: C.bg, height: '100vh' }}>

                {/* Top Bar */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 4, pt: 3, pb: 2.5 }}>
                    <Box>
                        <Typography variant="h5" fontWeight={800} sx={{ color: C.white }}>Profile Settings</Typography>
                        <Typography variant="body2" sx={{ color: C.dim, mt: 0.3, fontSize: '0.8rem' }}>{today}</Typography>
                    </Box>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ bgcolor: C.card, borderRadius: 3, px: 2, py: 1, minWidth: 200 }}>
                            <SearchIcon sx={{ color: C.dim, fontSize: 17 }} />
                            <Typography variant="body2" sx={{ color: C.dim, fontSize: '0.82rem' }}>Search…</Typography>
                        </Stack>
                        <Avatar onClick={() => navigate('/profile')} src={getAvatarUrl(user.avatarId)} sx={{
                            bgcolor: C.card, width: 38, height: 38, cursor: 'pointer', borderRadius: 2.5,
                            border: `2px solid ${getAvatarColor(user.avatarId)}55`, overflow: 'hidden',
                            '&:hover': { transform: 'scale(1.07)', borderColor: getAvatarColor(user.avatarId) },
                            transition: 'all 0.2s',
                        }} />
                    </Stack>
                </Stack>

                {/* ── Content ── */}
                <Box sx={{ px: 4, pb: 5, flexGrow: 1 }}>

                    {/* Profile Card */}
                    <Box sx={{ bgcolor: C.card, borderRadius: 4, px: 4, pt: 4, pb: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.3)', mb: 3 }}>

                        {/* Avatar + name row */}
                        <Stack direction="row" alignItems="flex-end" justifyContent="space-between" sx={{ mb: 4 }}>
                            <Stack direction="row" alignItems="flex-end" spacing={2.5}>
                                <Box sx={{ position: 'relative', mt: 0 }}>
                                    <Box sx={{ width: 80, height: 80, borderRadius: 4, bgcolor: `${getAvatarColor(form.avatarId)}20`, border: `3px solid ${C.card}`, boxShadow: '0 4px 20px rgba(51,204,204,0.35)', overflow: 'hidden' }}>
                                        <Box component="img" src={getAvatarUrl(form.avatarId)} alt="avatar" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </Box>
                                    {editing && (
                                        <Box sx={{ position: 'absolute', bottom: 2, right: 2, width: 22, height: 22, borderRadius: '50%', bgcolor: C.brand, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${C.card}`, cursor: 'pointer' }}>
                                            <EditOutlinedIcon sx={{ fontSize: 11, color: C.bg }} />
                                        </Box>
                                    )}
                                </Box>
                                <Box sx={{ pb: 0.5 }}>
                                    <Typography variant="h6" fontWeight={700} sx={{ color: C.white, lineHeight: 1.2 }}>{user.name}</Typography>
                                    <Chip label={`@${user.username || 'username'}`} size="small" sx={{ mt: 0.5, height: 20, fontSize: '0.7rem', bgcolor: `${C.brand}1A`, color: C.brand, border: `1px solid ${C.brand}33` }} />
                                    <Typography variant="body2" sx={{ color: C.dim, fontSize: '0.82rem', mt: 0.3 }}>{user.email}</Typography>
                                </Box>
                            </Stack>

                            {editing ? (
                                <Stack direction="row" spacing={1.5} sx={{ pb: 0.5 }}>
                                    <Button onClick={() => setEditing(false)} sx={{ color: C.white, borderRadius: 2.5, textTransform: 'none', fontWeight: 600, px: 2.5, '&:hover': { bgcolor: `${C.brand}12` } }}>Cancel</Button>
                                    <Button variant="contained" onClick={handleSave} sx={{ bgcolor: C.brand, color: C.bg, borderRadius: 2.5, fontWeight: 700, textTransform: 'none', px: 3, boxShadow: '0 4px 14px rgba(51,204,204,0.35)', '&:hover': { bgcolor: '#2db8b8' } }}>Save Changes</Button>
                                </Stack>
                            ) : (
                                <Button variant="contained" onClick={() => setEditing(true)} sx={{ bgcolor: C.brand, color: C.bg, borderRadius: 2.5, fontWeight: 700, textTransform: 'none', px: 3, boxShadow: '0 4px 14px rgba(51,204,204,0.3)', transition: 'all 0.25s', '&:hover': { bgcolor: '#2db8b8', transform: 'translateY(-1px)', boxShadow: '0 6px 18px rgba(51,204,204,0.45)' } }}>
                                    Edit Profile
                                </Button>
                            )}
                        </Stack>

                        {/* Avatar picker */}
                        {editing && (
                            <Box sx={{ mb: 3 }}>
                                <Typography sx={labelSx}>Choose Avatar</Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, overflowX: 'auto', pb: 1, '&::-webkit-scrollbar': { height: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: C.border, borderRadius: 2 } }}>
                                    {AVATAR_LIST.map(av => (
                                        <Box key={av.id} onClick={() => setForm(p => ({ ...p, avatarId: av.id }))} sx={{
                                            width: 54, height: 54, borderRadius: 2.5, cursor: 'pointer', flexShrink: 0, overflow: 'hidden',
                                            bgcolor: form.avatarId === av.id ? `${av.color}20` : 'rgba(255,255,255,0.03)',
                                            border: form.avatarId === av.id ? `2px solid ${av.color}` : `2px solid rgba(255,255,255,0.07)`,
                                            boxShadow: form.avatarId === av.id ? `0 0 14px ${av.color}55` : 'none',
                                            transition: 'all 0.15s',
                                            '&:hover': { border: `2px solid ${av.color}90`, transform: 'scale(1.09)', bgcolor: `${av.color}15` },
                                        }}>
                                            <Box component="img" src={getAvatarUrl(av.id)} alt={av.seed} sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        )}

                        {/* Personal information */}
                        <Typography sx={{ color: C.white, mb: 2.5, fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                            Personal Information
                        </Typography>

                        {/* Bio — full width */}
                        <Box sx={{ mb: 3 }}>
                            <Typography sx={labelSx}>Bio</Typography>
                            <TextField fullWidth placeholder="Tell us about yourself..."
                                value={form.bio} onChange={set('bio')}
                                disabled={!editing} multiline rows={2} sx={fieldSx(editing)} />
                        </Box>

                        {/* 2-col: Full Name + Username (read-only) */}
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 4 }}>
                            <Box>
                                <Typography sx={labelSx}>Full Name</Typography>
                                <TextField fullWidth placeholder="Your full name"
                                    value={form.fullName} onChange={set('fullName')}
                                    disabled={!editing} sx={fieldSx(editing)} />
                            </Box>
                            <Box>
                                <Typography sx={labelSx}>Username</Typography>
                                <TextField fullWidth value={`@${user.username || '—'}`} disabled sx={readOnlySx}/>
                            </Box>
                        </Box>

                        {/* Divider */}
                        <Box sx={{ height: 1, bgcolor: C.border, mb: 3 }} />

                        {/* Email */}
                        <Typography sx={{ color: C.white, mb: 2.5, fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                            My Email Address
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
                            <Box sx={{ width: 42, height: 42, borderRadius: 2.5, flexShrink: 0, bgcolor: `${C.brand}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <EmailOutlinedIcon sx={{ color: C.brand, fontSize: 20 }} />
                            </Box>
                            <Box>
                                <Typography variant="body2" fontWeight={600} sx={{ color: C.white, fontSize: '0.88rem' }}>
                                    {user.email || 'user@example.com'}
                                </Typography>
                                <Typography variant="caption" sx={{ color: C.dim, fontSize: '0.74rem' }}>
                                    Contact support to change your email.
                                </Typography>
                            </Box>
                        </Stack>
                    </Box>

                    {/* ── Appearance Card ───────────────────────────────────── */}
                    <Box sx={{ bgcolor: C.card, borderRadius: 4, px: 4, py: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                        <Typography sx={{ color: C.white, mb: 3, fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                            Appearance
                        </Typography>

                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Stack direction="row" alignItems="center" spacing={2}>
                                <Box sx={{ width: 42, height: 42, borderRadius: 2.5, flexShrink: 0, bgcolor: `${C.brand}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {isDark ? <DarkModeIcon sx={{ color: C.brand, fontSize: 20 }} /> : <LightModeIcon sx={{ color: C.brand, fontSize: 20 }} />}
                                </Box>
                                <Box>
                                    <Typography variant="body2" fontWeight={600} sx={{ color: C.white, fontSize: '0.88rem' }}>
                                        {isDark ? 'Dark Mode' : 'Light Mode'}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: C.dim, fontSize: '0.74rem' }}>
                                        {isDark ? 'Switch to a lighter, brighter interface' : 'Switch to a darker, easier-on-eyes interface'}
                                    </Typography>
                                </Box>
                            </Stack>
                            <Switch checked={isDark} onChange={toggleTheme} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: C.brand }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: C.brand }, '& .MuiSwitch-track': { bgcolor: C.dim } }} />
                        </Stack>

                        <Stack direction="row" spacing={1.5} sx={{ mt: 2.5 }}>
                            {/* Dark swatch */}
                            <Box onClick={() => !isDark && toggleTheme()} sx={{ flex: 1, borderRadius: 3, p: 2, cursor: 'pointer', bgcolor: isDark ? `${C.brand}15` : C.input, border: isDark ? `1.5px solid ${C.brand}` : `1.5px solid ${C.border}`, transition: 'all 0.2s', '&:hover': { border: `1.5px solid ${C.brand}`, bgcolor: `${C.brand}15` } }}>
                                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                                    <DarkModeIcon sx={{ fontSize: 16, color: isDark ? C.brand : C.dim }} />
                                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: isDark ? C.brand : C.dim }}>Dark</Typography>
                                    {isDark && <Chip label="Active" size="small" sx={{ height: 16, fontSize: '0.6rem', bgcolor: `${C.brand}20`, color: C.brand, ml: 'auto !important' }} />}
                                </Stack>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    {['#141627','#1E2140','#252845'].map(col => <Box key={col} sx={{ flex: 1, height: 8, borderRadius: 1, bgcolor: col, border: '1px solid rgba(255,255,255,0.08)' }} />)}
                                </Box>
                            </Box>

                            {/* Light swatch */}
                            <Box onClick={() => isDark && toggleTheme()} sx={{ flex: 1, borderRadius: 3, p: 2, cursor: 'pointer', bgcolor: !isDark ? `${C.brand}15` : C.input, border: !isDark ? `1.5px solid ${C.brand}` : `1.5px solid ${C.border}`, transition: 'all 0.2s', '&:hover': { border: `1.5px solid ${C.brand}`, bgcolor: `${C.brand}15` } }}>
                                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                                    <LightModeIcon sx={{ fontSize: 16, color: !isDark ? C.brand : C.dim }} />
                                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: !isDark ? C.brand : C.dim }}>Light</Typography>
                                    {!isDark && <Chip label="Active" size="small" sx={{ height: 16, fontSize: '0.6rem', bgcolor: `${C.brand}20`, color: C.brand, ml: 'auto !important' }} />}
                                </Stack>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    {['#F0F4FA','#FFFFFF','#E8EDF5'].map(col => <Box key={col} sx={{ flex: 1, height: 8, borderRadius: 1, bgcolor: col, border: '1px solid rgba(0,0,0,0.08)' }} />)}
                                </Box>
                            </Box>
                        </Stack>
                    </Box>

                </Box>
            </Box>

            <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(p => ({ ...p, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert severity={snack.sev} onClose={() => setSnack(p => ({ ...p, open: false }))} sx={{ bgcolor: C.card, color: C.white, borderRadius: 3 }}>
                    {snack.msg}
                </Alert>
            </Snackbar>
        </Box>
    );
}
