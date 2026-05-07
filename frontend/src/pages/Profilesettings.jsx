import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Stack, Button, TextField,
    IconButton, Chip, Snackbar, Alert, Switch, Divider,
    CircularProgress,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import Navbar, { DRAWER_WIDTH } from '../components/Navbar';

// ── Icons ─────────────────────────────────────────────────────────────────────
import PersonOutlinedIcon    from '@mui/icons-material/PersonOutlined';
import WorkspacePremiumIcon  from '@mui/icons-material/WorkspacePremium';
import PaletteOutlinedIcon   from '@mui/icons-material/PaletteOutlined';
import EmailOutlinedIcon     from '@mui/icons-material/EmailOutlined';
import EditOutlinedIcon      from '@mui/icons-material/EditOutlined';
import LightModeIcon         from '@mui/icons-material/LightMode';
import DarkModeIcon          from '@mui/icons-material/DarkMode';
import StarIcon              from '@mui/icons-material/Star';
import CheckCircleIcon       from '@mui/icons-material/CheckCircle';
import CancelIcon            from '@mui/icons-material/Cancel';
import InfoOutlinedIcon      from '@mui/icons-material/InfoOutlined';
import LockOpenIcon          from '@mui/icons-material/LockOpen';
import ExploreIcon           from '@mui/icons-material/Explore';
import OpenInNewIcon         from '@mui/icons-material/OpenInNew';

// ── Khalti palette ────────────────────────────────────────────────────────────
const KHALTI_PURPLE      = '#5C2D91';
const KHALTI_PURPLE_DARK = '#4A2277';

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

// ── Subscription data ─────────────────────────────────────────────────────────
const FEATURES = [
    { label: 'Browse community itineraries',      free: 'Up to 10/day',   premium: 'Unlimited' },
    { label: 'Rule-based place filtering',         free: 'Basic (region)', premium: 'Full (budget, season, group, permits)' },
    { label: 'Personalised recommendations',       free: false,            premium: true },
    { label: 'AI itinerary generation',            free: '2 / week',       premium: '15 / month' },
    { label: 'Saved itineraries',                  free: 'Up to 5',        premium: 'Unlimited' },
    { label: 'Copy & customise community routes',  free: false,            premium: true },
    { label: 'Weather along route',                free: false,            premium: true },
    { label: 'Interactive map — full access',      free: 'Preview only',   premium: true },
    { label: 'Export itinerary as PDF',            free: false,            premium: true },
    { label: 'Early access to new trek listings',  free: false,            premium: true },
    { label: 'Community posts & reviews',          free: true,             premium: true },
    { label: 'Friend system & messaging',          free: true,             premium: true },
];

const PLANS = [
    { id: 'trip_pass', label: 'Trip Pass',  price: 'NPR 199',   priceValue: 199,  per: '/ 7 days — one-time', badge: null,         highlight: false, description: 'Ideal for a single short trip.',                         savingsTag: null },
    { id: 'monthly',   label: 'Monthly',    price: 'NPR 299',   priceValue: 299,  per: '/ 30 days',           badge: 'BEST VALUE', highlight: true,  description: 'Perfect for a longer trip or back-to-back plans.',       savingsTag: 'Save 30%' },
    { id: 'yearly',    label: 'Annual',     price: 'NPR 1,999', priceValue: 1999, per: '/ year',              badge: null,         highlight: false, description: 'Best for frequent trekkers who plan year-round.',        savingsTag: 'Save 44%' },
];

function FeatureValue({ val, C }) {
    if (val === true)  return <CheckCircleIcon sx={{ color: C.brand, fontSize: 18 }} />;
    if (val === false) return <CancelIcon      sx={{ color: C.dim,   fontSize: 18 }} />;
    return <Typography sx={{ fontSize: '0.76rem', color: C.text, fontWeight: 500 }}>{val}</Typography>;
}

// ── Tab button ────────────────────────────────────────────────────────────────
function SettingsTab({ id, label, Icon, active, onClick, C }) {
    return (
        <Box onClick={() => onClick(id)} sx={{
            display: 'flex', alignItems: 'center', gap: 1,
            px: 2, py: 1.1, cursor: 'pointer', position: 'relative',
            color: active ? C.brand : C.dim,
            fontWeight: active ? 700 : 500,
            fontSize: '0.875rem',
            transition: 'color 0.15s',
            '&:hover': { color: active ? C.brand : C.white },
            '&::after': {
                content: '""',
                position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px',
                bgcolor: active ? C.brand : 'transparent',
                borderRadius: '2px 2px 0 0',
                transition: 'background-color 0.15s',
            },
        }}>
            <Icon sx={{ fontSize: 16 }} />
            <Typography sx={{ fontSize: 'inherit', fontWeight: 'inherit', color: 'inherit' }}>{label}</Typography>
        </Box>
    );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function ProfileSettings() {
    const navigate  = useNavigate();
    const location  = useLocation();
    const { COLORS, isDark, toggleTheme } = useTheme();

    const C = {
        brand:  COLORS.brand,
        bg:     COLORS.background,
        card:   COLORS.cardPrimary,
        card2:  COLORS.cardSecondary,
        input:  COLORS.inputBg,
        border: COLORS.cardBorder,
        white:  COLORS.headings,
        dim:    COLORS.fadedText,
        text:   COLORS.text,
        glow:   COLORS.glowColor,
        error:  '#ff6b6b',
    };

    // ── Field styles ──────────────────────────────────────────────────────────
    const fieldSx = (editing) => ({
        '& .MuiOutlinedInput-root': {
            bgcolor: C.input, borderRadius: 2.5, color: C.white, fontSize: '0.9rem', transition: 'all 0.2s',
            '& fieldset': { borderColor: editing ? COLORS.cardBorder : 'transparent' },
            '&:hover fieldset': { borderColor: C.brand },
            '&.Mui-focused fieldset': { borderColor: C.brand, borderWidth: 1.5 },
            '&.Mui-disabled': { bgcolor: C.input },
        },
        '& .MuiInputBase-input': { py: 1.4, color: C.white, WebkitTextFillColor: C.white },
        '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: C.white },
        '& .MuiInputBase-input::placeholder': { color: C.dim, opacity: 1 },
        '& .MuiFormHelperText-root': { color: C.error },
        '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus': {
            WebkitBoxShadow: `0 0 0 1000px ${C.input} inset !important`,
            WebkitTextFillColor: `${C.white} !important`,
            caretColor: `${C.white} !important`,
            transition: 'background-color 50000s ease-in-out 0s',
        },
    });

    const readOnlySx = {
        '& .MuiOutlinedInput-root': {
            bgcolor: C.input, borderRadius: 2.5,
            '& fieldset': { borderColor: 'transparent' },
            '&.Mui-disabled': { bgcolor: C.input },
        },
        '& .MuiInputBase-input': { py: 1.4, WebkitTextFillColor: C.dim },
        '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: C.dim },
        '& .MuiFormHelperText-root': { color: C.dim, fontSize: '0.7rem' },
    };

    const labelSx = { fontSize: '0.78rem', fontWeight: 700, color: C.white, mb: 0.75, textTransform: 'uppercase', letterSpacing: 0.8 };

    // ── State ─────────────────────────────────────────────────────────────────
    const [activeTab, setActiveTab]   = useState('account');
    const [snack, setSnack]           = useState({ open: false, msg: '', sev: 'success' });
    const toast = (msg, sev = 'success') => setSnack({ open: true, msg, sev });

    // Account
    const [user, setUser]     = useState({ name: 'User', email: '', username: '', avatarId: 1 });
    const [editing, setEditing] = useState(false);
    const [form, setForm]     = useState({ fullName: '', bio: '', avatarId: 1 });

    // Subscription
    const [subTier, setSubTier]           = useState(localStorage.getItem('subscriptionTier') || 'free');
    const [isAdmin, setIsAdmin]           = useState(false);
    const [premiumUntil, setPremiumUntil] = useState(null);
    const [selectedPlan, setSelectedPlan] = useState('monthly');
    const [subLoading, setSubLoading]     = useState(false);

    // ── Load ──────────────────────────────────────────────────────────────────
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const sec = params.get('section');
        if (sec && ['account', 'subscription', 'appearance'].includes(sec)) setActiveTab(sec);

        const uid      = localStorage.getItem('userId');
        const uname    = localStorage.getItem('userName') || 'User';
        const email    = localStorage.getItem('userEmail') || '';
        const username = localStorage.getItem('username') || '';
        const avatarId = parseInt(localStorage.getItem('avatarId')) || 1;
        if (!uid) { navigate('/login'); return; }

        setUser({ name: uname, email, username, avatarId });
        setForm(p => ({ ...p, fullName: uname, avatarId }));

        axios.get(`http://127.0.0.1:8000/users/${uid}`).then(r => {
            const u = r.data;
            setUser(prev => ({ ...prev, username: u.username || '', avatarId: u.avatar_id || 1 }));
            setForm(prev => ({ ...prev, fullName: u.name, bio: u.bio || '', avatarId: u.avatar_id || 1 }));
            const tier = u.subscription_tier || 'free';
            const role = u.role || 'user';
            setSubTier(tier); setIsAdmin(role === 'admin'); setPremiumUntil(u.premium_until || null);
            localStorage.setItem('subscriptionTier', tier);
            localStorage.setItem('userRole', role);
        }).catch(() => {});
    }, [navigate, location.search]);

    // ── Account handlers ──────────────────────────────────────────────────────
    const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

    const handleSave = async () => {
        try {
            const uid = localStorage.getItem('userId');
            await axios.put(`http://127.0.0.1:8000/users/${uid}`, { name: form.fullName, bio: form.bio || null, avatar_id: form.avatarId });
            localStorage.setItem('userName', form.fullName);
            localStorage.setItem('avatarId', form.avatarId);
            setUser(p => ({ ...p, name: form.fullName, avatarId: form.avatarId }));
            toast('Profile updated!');
        } catch { toast('Update failed.', 'error'); }
        setEditing(false);
    };

    // ── Subscription handlers ─────────────────────────────────────────────────
    const handleInitiatePayment = async () => {
        setSubLoading(true);
        try {
            const uid = localStorage.getItem('userId');
            const { data } = await axios.post('http://127.0.0.1:8000/subscriptions/khalti/initiate', {
                user_id: parseInt(uid), plan: selectedPlan,
            });
            if (data.payment_url) {
                window.location.href = data.payment_url;
            } else {
                throw new Error('No payment URL received');
            }
        } catch (e) {
            toast(e.response?.data?.detail || 'Could not initiate payment. Please try again.', 'error');
            setSubLoading(false);
        }
    };

    const handleCancel = async () => {
        setSubLoading(true);
        try {
            const uid = localStorage.getItem('userId');
            await axios.post(`http://127.0.0.1:8000/subscriptions/cancel`, { user_id: parseInt(uid) });
            toast('Your subscription has been cancelled.', 'info');
            setSubTier('free'); localStorage.setItem('subscriptionTier', 'free');
        } catch (e) { toast(e.response?.data?.detail || 'Could not cancel.', 'error'); }
        finally { setSubLoading(false); }
    };

    const TABS = [
        { id: 'account',      label: 'Account',      Icon: PersonOutlinedIcon   },
        { id: 'subscription', label: 'Subscription', Icon: WorkspacePremiumIcon, hidden: isAdmin },
        { id: 'appearance',   label: 'Appearance',   Icon: PaletteOutlinedIcon  },
    ].filter(t => !t.hidden);

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <Box sx={{ display: 'flex', bgcolor: C.bg, minHeight: '100vh', width: '100vw', position: 'fixed', top: 0, left: 0, overflow: 'hidden' }}>
            <Navbar />

            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100vh' }}>

                {/* ── Page header ──────────────────────────────────────── */}
                <Box sx={{ px: 4, pt: 3.5, pb: 0, flexShrink: 0 }}>
                    <Typography variant="h5" fontWeight={800} sx={{ color: C.white }}>Settings</Typography>
                    <Typography sx={{ color: C.dim, fontSize: '0.8rem', mt: 0.3 }}>
                        Manage your account, subscription and appearance.
                    </Typography>
                </Box>

                {/* ── Tab bar ──────────────────────────────────────────── */}
                <Box sx={{
                    px: 4, mt: 2.5, flexShrink: 0,
                    borderBottom: `1px solid ${C.border}`,
                    display: 'flex', alignItems: 'flex-end', gap: 0.5,
                }}>
                    {TABS.map(t => (
                        <SettingsTab key={t.id} {...t} active={activeTab === t.id} onClick={setActiveTab} C={C} />
                    ))}
                </Box>

                {/* ── Scrollable content ───────────────────────────────── */}
                <Box sx={{
                    flex: 1, overflowY: 'auto', px: 4, py: 4,
                    '&::-webkit-scrollbar': { width: 5 },
                    '&::-webkit-scrollbar-thumb': { bgcolor: C.border, borderRadius: 3 },
                }}>

                    {/* ════════════════════════════════════════
                        ACCOUNT TAB
                    ════════════════════════════════════════ */}
                    {activeTab === 'account' && (
                        <Box sx={{ maxWidth: 680 }}>

                            {/* Profile card */}
                            <Box sx={{ bgcolor: C.card, borderRadius: 4, p: 4, boxShadow: `0 4px 24px ${C.glow}`, mb: 3 }}>

                                {/* Avatar + name + edit button */}
                                <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 4 }}>
                                    <Stack direction="row" alignItems="center" spacing={2.5}>
                                        <Box sx={{ position: 'relative' }}>
                                            <Box sx={{ width: 80, height: 80, borderRadius: 4, overflow: 'hidden', bgcolor: `${getAvatarColor(form.avatarId)}20`, border: `3px solid ${getAvatarColor(form.avatarId)}55`, boxShadow: `0 4px 18px ${getAvatarColor(form.avatarId)}30` }}>
                                                <Box component="img" src={getAvatarUrl(form.avatarId)} alt="avatar" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </Box>
                                            {editing && (
                                                <Box sx={{ position: 'absolute', bottom: 2, right: 2, width: 22, height: 22, borderRadius: '50%', bgcolor: C.brand, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${C.card}` }}>
                                                    <EditOutlinedIcon sx={{ fontSize: 11, color: C.bg }} />
                                                </Box>
                                            )}
                                        </Box>
                                        <Box>
                                            <Typography variant="h6" fontWeight={700} sx={{ color: C.white, lineHeight: 1.2 }}>{user.name}</Typography>
                                            <Chip label={`@${user.username || 'username'}`} size="small" sx={{ mt: 0.5, height: 20, fontSize: '0.7rem', bgcolor: `${C.brand}18`, color: C.brand, border: `1px solid ${C.brand}33` }} />
                                            <Typography sx={{ color: C.dim, fontSize: '0.8rem', mt: 0.3 }}>{user.email}</Typography>
                                        </Box>
                                    </Stack>

                                    {editing ? (
                                        <Stack direction="row" spacing={1.5}>
                                            <Button onClick={() => setEditing(false)} sx={{ color: C.white, borderRadius: 2.5, textTransform: 'none', fontWeight: 600, px: 2.5, '&:hover': { bgcolor: `${C.brand}12` } }}>
                                                Cancel
                                            </Button>
                                            <Button variant="contained" onClick={handleSave} sx={{ bgcolor: C.brand, color: isDark ? '#141627' : '#fff', borderRadius: 2.5, fontWeight: 700, textTransform: 'none', px: 3, boxShadow: `0 4px 14px ${C.brand}40`, '&:hover': { bgcolor: isDark ? '#2db8b8' : '#179898' } }}>
                                                Save Changes
                                            </Button>
                                        </Stack>
                                    ) : (
                                        <Button variant="contained" onClick={() => setEditing(true)} sx={{ bgcolor: C.brand, color: isDark ? '#141627' : '#fff', borderRadius: 2.5, fontWeight: 700, textTransform: 'none', px: 3, '&:hover': { bgcolor: isDark ? '#2db8b8' : '#179898', transform: 'translateY(-1px)' }, transition: 'all 0.2s' }}>
                                            Edit Profile
                                        </Button>
                                    )}
                                </Stack>

                                {/* Avatar picker */}
                                {editing && (
                                    <Box sx={{ mb: 3 }}>
                                        <Typography sx={labelSx}>Choose Avatar</Typography>
                                        <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1, '&::-webkit-scrollbar': { height: 3 }, '&::-webkit-scrollbar-thumb': { bgcolor: C.border, borderRadius: 2 } }}>
                                            {AVATAR_LIST.map(av => (
                                                <Box key={av.id} onClick={() => setForm(p => ({ ...p, avatarId: av.id }))} sx={{
                                                    width: 52, height: 52, borderRadius: 2.5, cursor: 'pointer', flexShrink: 0, overflow: 'hidden',
                                                    bgcolor: form.avatarId === av.id ? `${av.color}20` : 'rgba(255,255,255,0.03)',
                                                    border: `2px solid ${form.avatarId === av.id ? av.color : 'rgba(255,255,255,0.07)'}`,
                                                    boxShadow: form.avatarId === av.id ? `0 0 12px ${av.color}50` : 'none',
                                                    transition: 'all 0.15s',
                                                    '&:hover': { border: `2px solid ${av.color}90`, transform: 'scale(1.08)' },
                                                }}>
                                                    <Box component="img" src={getAvatarUrl(av.id)} alt={av.seed} sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                                </Box>
                                            ))}
                                        </Box>
                                    </Box>
                                )}

                                <Divider sx={{ borderColor: C.border, mb: 3 }} />

                                <Typography sx={{ color: C.dim, mb: 2.5, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Personal Information</Typography>

                                <Box sx={{ mb: 3 }}>
                                    <Typography sx={labelSx}>Bio</Typography>
                                    <TextField fullWidth multiline rows={2} placeholder="Tell us about yourself…" value={form.bio} onChange={set('bio')} disabled={!editing} sx={fieldSx(editing)} />
                                </Box>

                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 4 }}>
                                    <Box>
                                        <Typography sx={labelSx}>Full Name</Typography>
                                        <TextField fullWidth value={form.fullName} onChange={set('fullName')} disabled={!editing} placeholder="Your full name" sx={fieldSx(editing)} />
                                    </Box>
                                    <Box>
                                        <Typography sx={labelSx}>Username</Typography>
                                        <TextField fullWidth value={`@${user.username || '—'}`} disabled sx={readOnlySx} helperText="Username cannot be changed." />
                                    </Box>
                                </Box>

                                <Divider sx={{ borderColor: C.border, mb: 3 }} />

                                <Typography sx={{ color: C.dim, mb: 2, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Email Address</Typography>
                                <Stack direction="row" alignItems="center" spacing={2}>
                                    <Box sx={{ width: 40, height: 40, borderRadius: 2.5, flexShrink: 0, bgcolor: `${C.brand}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <EmailOutlinedIcon sx={{ color: C.brand, fontSize: 20 }} />
                                    </Box>
                                    <Box>
                                        <Typography fontWeight={600} sx={{ color: C.white, fontSize: '0.88rem' }}>{user.email || 'user@example.com'}</Typography>
                                        <Typography variant="caption" sx={{ color: C.dim, fontSize: '0.74rem' }}>Contact support to change your email.</Typography>
                                    </Box>
                                </Stack>
                            </Box>
                        </Box>
                    )}

                    {/* ════════════════════════════════════════
                        SUBSCRIPTION TAB
                    ════════════════════════════════════════ */}
                    {activeTab === 'subscription' && (
                        <Box sx={{ maxWidth: 780 }}>

                            {/* Status banner */}
                            {subTier === 'premium' ? (
                                <Box sx={{ bgcolor: `${C.brand}12`, border: `1.5px solid ${C.brand}`, borderRadius: 3, px: 3, py: 2, mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <StarIcon sx={{ color: C.brand }} />
                                    <Box sx={{ flex: 1 }}>
                                        <Typography fontWeight={700} sx={{ color: C.brand, fontSize: '0.95rem' }}>You're on Premium ✓</Typography>
                                        {premiumUntil && <Typography sx={{ color: C.dim, fontSize: '0.8rem' }}>Active until {new Date(premiumUntil).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</Typography>}
                                    </Box>
                                    <Button onClick={handleCancel} disabled={subLoading} size="small" sx={{ color: '#ff6b6b', border: '1px solid #ff6b6b44', borderRadius: 2, textTransform: 'none', fontSize: '0.8rem', '&:hover': { bgcolor: '#ff6b6b14' } }}>
                                        Cancel Plan
                                    </Button>
                                </Box>
                            ) : subTier === 'pending' ? (
                                <Box sx={{ bgcolor: 'rgba(255,193,7,0.08)', border: '1.5px solid rgba(255,193,7,0.35)', borderRadius: 3, px: 3, py: 2, mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flex: 1 }}>
                                        <InfoOutlinedIcon sx={{ color: '#FFC107', flexShrink: 0 }} />
                                        <Typography sx={{ color: C.text, fontSize: '0.88rem' }}>
                                            Your Khalti payment is being processed. Your plan activates <strong style={{ color: '#FFC107' }}>automatically</strong> once confirmed.
                                        </Typography>
                                    </Stack>
                                    <Button size="small" onClick={() => navigate('/subscription')} endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
                                        sx={{ color: '#FFC107', border: '1px solid rgba(255,193,7,0.4)', borderRadius: 2, textTransform: 'none', fontSize: '0.78rem', whiteSpace: 'nowrap', '&:hover': { bgcolor: 'rgba(255,193,7,0.08)' } }}>
                                        View Status
                                    </Button>
                                </Box>
                            ) : (
                                <Box sx={{ bgcolor: C.card2, border: `1px solid ${C.border}`, borderRadius: 3, px: 3, py: 2, mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <LockOpenIcon sx={{ color: C.dim, fontSize: 20 }} />
                                    <Typography sx={{ color: C.dim, fontSize: '0.85rem' }}>
                                        You're on the <strong style={{ color: C.white }}>Free</strong> plan. Upgrade to unlock the full platform.
                                    </Typography>
                                </Box>
                            )}

                            {/* Plan cards — only when not premium/pending */}
                            {subTier !== 'premium' && subTier !== 'pending' && (
                                <>
                                    <Typography fontWeight={700} sx={{ color: C.white, mb: 2, fontSize: '0.95rem' }}>Choose a Plan</Typography>
                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
                                        {PLANS.map(plan => {
                                            const isSel  = selectedPlan === plan.id;
                                            const isHigh = plan.highlight;
                                            return (
                                                <Box key={plan.id} onClick={() => setSelectedPlan(plan.id)} sx={{
                                                    flex: 1, borderRadius: 3, p: 2.5, cursor: 'pointer', position: 'relative',
                                                    border: isSel ? `2px solid ${C.brand}` : `1.5px solid ${isHigh ? `${C.brand}44` : C.border}`,
                                                    bgcolor: isSel ? `${C.brand}0E` : isHigh ? `${C.brand}07` : C.card,
                                                    transition: 'all 0.2s',
                                                    '&:hover': { border: `2px solid ${C.brand}`, bgcolor: `${C.brand}0E` },
                                                    boxShadow: isSel ? `0 0 0 3px ${C.brand}20` : 'none',
                                                }}>
                                                    {plan.badge && (
                                                        <Chip label={plan.badge} size="small" sx={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', bgcolor: C.brand, color: isDark ? '#141627' : '#fff', fontWeight: 800, fontSize: '0.62rem', height: 20 }} />
                                                    )}
                                                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                                        <Typography fontWeight={700} sx={{ color: C.white, fontSize: '0.95rem' }}>{plan.label}</Typography>
                                                        {plan.savingsTag && <Chip label={plan.savingsTag} size="small" sx={{ bgcolor: `${C.brand}22`, color: C.brand, fontWeight: 700, fontSize: '0.62rem', height: 18 }} />}
                                                    </Stack>
                                                    <Typography sx={{ color: C.brand, fontWeight: 900, fontSize: '1.4rem', mt: 1 }}>{plan.price}</Typography>
                                                    <Typography sx={{ color: C.dim, fontSize: '0.73rem' }}>{plan.per}</Typography>
                                                    <Typography sx={{ color: C.dim, fontSize: '0.76rem', mt: 0.75 }}>{plan.description}</Typography>
                                                    <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                                        <Box sx={{ width: 13, height: 13, borderRadius: '50%', border: `2px solid ${isSel ? C.brand : C.dim}`, bgcolor: isSel ? C.brand : 'transparent', transition: 'all 0.15s' }} />
                                                        <Typography sx={{ fontSize: '0.73rem', color: isSel ? C.brand : C.dim }}>{isSel ? 'Selected' : 'Select'}</Typography>
                                                    </Box>
                                                </Box>
                                            );
                                        })}
                                    </Stack>

                                    <Button fullWidth onClick={handleInitiatePayment} disabled={subLoading}
                                        startIcon={
                                            subLoading
                                                ? <CircularProgress size={15} sx={{ color: '#fff' }} />
                                                : <Box sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: '#fff', color: KHALTI_PURPLE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.82rem' }}>K</Box>
                                        }
                                        sx={{ bgcolor: KHALTI_PURPLE, color: '#fff', fontWeight: 800, fontSize: '0.92rem', borderRadius: 3, py: 1.5, textTransform: 'none', mb: 1, boxShadow: `0 5px 18px ${KHALTI_PURPLE}44`, '&:hover': { bgcolor: KHALTI_PURPLE_DARK }, '&:disabled': { opacity: 0.6 } }}>
                                        {subLoading ? 'Redirecting to Khalti…' : `Pay with Khalti — ${PLANS.find(p => p.id === selectedPlan)?.price}`}
                                    </Button>
                                    <Typography sx={{ color: C.dim, fontSize: '0.72rem', textAlign: 'center', mb: 4 }}>
                                        You'll be taken to Khalti's secure payment page. Premium activates instantly once payment is confirmed.
                                    </Typography>
                                </>
                            )}

                            {/* Feature table */}
                            <Typography fontWeight={700} sx={{ color: C.white, mb: 2, fontSize: '0.95rem' }}>What's Included</Typography>
                            <Box sx={{ bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: 3, overflow: 'hidden', mb: 4 }}>
                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 110px 130px', bgcolor: C.card2, px: 3, py: 1.5, borderBottom: `1px solid ${C.border}` }}>
                                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: 0.8 }}>Feature</Typography>
                                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: 0.8, textAlign: 'center' }}>Free</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center' }}>
                                        <StarIcon sx={{ fontSize: 13, color: C.brand }} />
                                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: C.brand, textTransform: 'uppercase', letterSpacing: 0.8 }}>Premium</Typography>
                                    </Box>
                                </Box>
                                {FEATURES.map((f, i) => (
                                    <Box key={f.label} sx={{ display: 'grid', gridTemplateColumns: '1fr 110px 130px', px: 3, py: 1.4, bgcolor: i % 2 === 0 ? C.card : C.card2, borderBottom: i < FEATURES.length - 1 ? `1px solid ${C.border}` : 'none', alignItems: 'center' }}>
                                        <Typography sx={{ fontSize: '0.82rem', color: C.text }}>{f.label}</Typography>
                                        <Box sx={{ display: 'flex', justifyContent: 'center' }}><FeatureValue val={f.free} C={C} /></Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'center' }}><FeatureValue val={f.premium} C={C} /></Box>
                                    </Box>
                                ))}
                            </Box>

                            {/* Community pitch */}
                            <Box sx={{ bgcolor: `${C.brand}0A`, border: `1px solid ${C.brand}30`, borderRadius: 3, px: 3, py: 3 }}>
                                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                                    <ExploreIcon sx={{ color: C.brand, mt: 0.3, fontSize: 22 }} />
                                    <Box>
                                        <Typography fontWeight={700} sx={{ color: C.white, mb: 0.5, fontSize: '0.9rem' }}>Your free contribution fuels the community</Typography>
                                        <Typography sx={{ color: C.dim, fontSize: '0.82rem', lineHeight: 1.7 }}>
                                            Free users contribute reviews, routes, and ratings — that data powers the personalised recommendations Premium members receive.
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Box>
                        </Box>
                    )}

                    {/* ════════════════════════════════════════
                        APPEARANCE TAB
                    ════════════════════════════════════════ */}
                    {activeTab === 'appearance' && (
                        <Box sx={{ maxWidth: 540 }}>
                            <Box sx={{ bgcolor: C.card, borderRadius: 4, p: 4, boxShadow: `0 4px 24px ${C.glow}` }}>
                                <Typography sx={{ color: C.dim, mb: 3, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Interface Theme</Typography>

                                {/* Toggle row */}
                                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                                    <Stack direction="row" alignItems="center" spacing={2}>
                                        <Box sx={{ width: 42, height: 42, borderRadius: 2.5, flexShrink: 0, bgcolor: `${C.brand}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {isDark ? <DarkModeIcon sx={{ color: C.brand, fontSize: 20 }} /> : <LightModeIcon sx={{ color: C.brand, fontSize: 20 }} />}
                                        </Box>
                                        <Box>
                                            <Typography fontWeight={600} sx={{ color: C.white, fontSize: '0.9rem' }}>{isDark ? 'Dark Mode' : 'Light Mode'}</Typography>
                                            <Typography variant="caption" sx={{ color: C.dim, fontSize: '0.74rem' }}>
                                                {isDark ? 'Switch to a lighter, brighter interface' : 'Switch to a darker, easier-on-eyes interface'}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                    <Switch checked={isDark} onChange={toggleTheme} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: C.brand }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: C.brand }, '& .MuiSwitch-track': { bgcolor: C.dim } }} />
                                </Stack>

                                <Divider sx={{ borderColor: C.border, mb: 3 }} />

                                {/* Swatches */}
                                <Stack direction="row" spacing={1.5}>
                                    <Box onClick={() => !isDark && toggleTheme()} sx={{ flex: 1, borderRadius: 3, p: 2.5, cursor: 'pointer', bgcolor: isDark ? `${C.brand}14` : C.input, border: `1.5px solid ${isDark ? C.brand : C.border}`, transition: 'all 0.2s', '&:hover': { border: `1.5px solid ${C.brand}` } }}>
                                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                                            <DarkModeIcon sx={{ fontSize: 16, color: isDark ? C.brand : C.dim }} />
                                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: isDark ? C.brand : C.dim }}>Dark</Typography>
                                            {isDark && <Chip label="Active" size="small" sx={{ height: 16, fontSize: '0.6rem', bgcolor: `${C.brand}20`, color: C.brand, ml: 'auto !important' }} />}
                                        </Stack>
                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            {['#141627', '#1E2140', '#252845'].map(col => <Box key={col} sx={{ flex: 1, height: 10, borderRadius: 1, bgcolor: col, border: '1px solid rgba(255,255,255,0.1)' }} />)}
                                        </Box>
                                        <Typography sx={{ color: C.dim, fontSize: '0.72rem', mt: 1.2 }}>Deep navy · Easier on eyes</Typography>
                                    </Box>

                                    <Box onClick={() => isDark && toggleTheme()} sx={{ flex: 1, borderRadius: 3, p: 2.5, cursor: 'pointer', bgcolor: !isDark ? `${C.brand}14` : C.input, border: `1.5px solid ${!isDark ? C.brand : C.border}`, transition: 'all 0.2s', '&:hover': { border: `1.5px solid ${C.brand}` } }}>
                                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                                            <LightModeIcon sx={{ fontSize: 16, color: !isDark ? C.brand : C.dim }} />
                                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: !isDark ? C.brand : C.dim }}>Light</Typography>
                                            {!isDark && <Chip label="Active" size="small" sx={{ height: 16, fontSize: '0.6rem', bgcolor: `${C.brand}20`, color: C.brand, ml: 'auto !important' }} />}
                                        </Stack>
                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            {['#F0F4FA', '#FFFFFF', '#E8EDF5'].map(col => <Box key={col} sx={{ flex: 1, height: 10, borderRadius: 1, bgcolor: col, border: '1px solid rgba(0,0,0,0.08)' }} />)}
                                        </Box>
                                        <Typography sx={{ color: C.dim, fontSize: '0.72rem', mt: 1.2 }}>Crisp white · Bright & clear</Typography>
                                    </Box>
                                </Stack>
                            </Box>
                        </Box>
                    )}

                </Box>{/* end scrollable content */}
            </Box>{/* end main column */}

            {/* ── Toast ─────────────────────────────────────────────── */}
            <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack(p => ({ ...p, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert severity={snack.sev} onClose={() => setSnack(p => ({ ...p, open: false }))} sx={{ bgcolor: C.card, color: C.text, borderRadius: 3, border: `1px solid ${C.border}` }}>
                    {snack.msg}
                </Alert>
            </Snackbar>
        </Box>
    );
}
