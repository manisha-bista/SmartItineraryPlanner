import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Stack, Button, TextField, CircularProgress,
    IconButton, Chip, Alert, Snackbar,
    Dialog, DialogTitle, DialogContent, DialogActions, Tooltip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import Navbar, { DRAWER_WIDTH } from '../components/Navbar';

import PersonAddIcon      from '@mui/icons-material/PersonAdd';
import CheckIcon          from '@mui/icons-material/Check';
import CloseIcon          from '@mui/icons-material/Close';
import PersonRemoveIcon   from '@mui/icons-material/PersonRemove';
import GroupIcon          from '@mui/icons-material/Group';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import HandshakeIcon      from '@mui/icons-material/Handshake';
import ChatBubbleIcon     from '@mui/icons-material/ChatBubble';
import SearchIcon         from '@mui/icons-material/Search';

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
const getAvatarUrl = (id) => {
    const av = AVATAR_LIST.find(a => a.id === id) || AVATAR_LIST[0];
    return `https://api.dicebear.com/7.x/${av.style}/svg?seed=${av.seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
};
const getAvatarColor = (id) => (AVATAR_LIST.find(a => a.id === id) || AVATAR_LIST[0]).color;

export default function Friends() {
    const { COLORS } = useTheme();
    const navigate = useNavigate();
    const userId = parseInt(localStorage.getItem('userId'));

    const C = {
        brand: COLORS.brand, bg: COLORS.background, card: COLORS.cardPrimary,
        surface: COLORS.cardSecondary, border: COLORS.cardBorder,
        heading: COLORS.headings, sub: COLORS.subheadings, text: COLORS.text,
        faded: COLORS.fadedText, red: '#ff6b6b', green: '#66d9a0', yellow: '#ffb74d',
    };

    const [friends, setFriends]           = useState([]);
    const [pending, setPending]           = useState([]);
    const [collabInvites, setCollabInvites] = useState([]);
    const [loading, setLoading]           = useState(true);
    const [addUsername, setAddUsername]   = useState('');
    const [addBusy, setAddBusy]           = useState(false);
    const [addErr, setAddErr]             = useState('');
    const [snack, setSnack]               = useState({ open: false, msg: '', sev: 'success' });
    const [removeTarget, setRemoveTarget] = useState(null);
    const [search, setSearch]             = useState('');

    const toast = (msg, sev = 'success') => setSnack({ open: true, msg, sev });

    const load = useCallback(async () => {
        try {
            const [friendsRes, pendingRes, collabRes] = await Promise.all([
                axios.get(`http://127.0.0.1:8000/friends/${userId}`),
                axios.get(`http://127.0.0.1:8000/friends/${userId}/pending`),
                axios.get(`http://127.0.0.1:8000/itineraries/user/${userId}/pending-collabs`),
            ]);
            setFriends(friendsRes.data?.friends || []);
            setPending(pendingRes.data?.requests || []);
            setCollabInvites(collabRes.data || []);
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, [userId]);

    useEffect(() => { load(); }, [load]);

    const sendRequest = async () => {
        if (!addUsername.trim()) return;
        setAddBusy(true); setAddErr('');
        try {
            await axios.post(`http://127.0.0.1:8000/friends/request?user_id=${userId}`, { receiver_username: addUsername.trim().replace(/^@/, '') });
            toast('Friend request sent!');
            setAddUsername('');
        } catch (e) {
            const detail = e.response?.data?.detail || '';
            if (detail.toLowerCase().includes('already')) setAddErr('Already friends or request already pending.');
            else if (detail.toLowerCase().includes('not found')) setAddErr('User not found. Check the username.');
            else setAddErr(detail || 'Failed to send request.');
        } finally { setAddBusy(false); }
    };

    const acceptRequest = async (friendshipId) => {
        try {
            await axios.patch(`http://127.0.0.1:8000/friends/${friendshipId}/accept?user_id=${userId}`);
            toast('Friend added!'); load();
        } catch { toast('Failed to accept.', 'error'); }
    };

    const rejectRequest = async (friendshipId) => {
        try {
            await axios.patch(`http://127.0.0.1:8000/friends/${friendshipId}/reject?user_id=${userId}`);
            toast('Request declined.'); load();
        } catch { toast('Failed to decline.', 'error'); }
    };

    const removeFriend = async (friendshipId) => {
        try {
            await axios.delete(`http://127.0.0.1:8000/friends/${friendshipId}?user_id=${userId}`);
            toast('Friend removed.'); setRemoveTarget(null); load();
        } catch { toast('Failed to remove.', 'error'); }
    };

    const acceptCollab = async (itineraryId) => {
        try {
            await axios.patch(`http://127.0.0.1:8000/itineraries/${itineraryId}/collaborators/accept?user_id=${userId}`);
            navigate(`/itinerary/${itineraryId}`);
        } catch { toast('Failed to accept.', 'error'); }
    };

    const rejectCollab = async (itineraryId) => {
        try {
            await axios.patch(`http://127.0.0.1:8000/itineraries/${itineraryId}/collaborators/reject?user_id=${userId}`);
            toast('Invitation declined.'); load();
        } catch { toast('Failed to decline.', 'error'); }
    };

    const totalNotices = pending.length + collabInvites.length;
    const filteredFriends = friends.filter(f =>
        !search || f.username?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Box sx={{ display: 'flex', bgcolor: C.bg, minHeight: '100vh', width: '100vw', position: 'fixed', top: 0, left: 0, overflow: 'hidden' }}>
            <Navbar />

            <Box component="main" sx={{ flexGrow: 1, height: '100vh', overflow: 'auto', display: 'flex', gap: 0, minWidth: 0 }}>

                {/* ── LEFT PANEL ─────────────────────────────────────────────── */}
                <Box sx={{
                    width: 320, flexShrink: 0, height: '100vh', overflowY: 'auto', p: 3,
                    borderRight: `1px solid ${C.border}`,
                    '&::-webkit-scrollbar': { width: 4 },
                    '&::-webkit-scrollbar-thumb': { bgcolor: C.surface, borderRadius: 2 },
                }}>

                    {/* Title */}
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3.5 }}>
                        <Box sx={{ width: 38, height: 38, borderRadius: 2.5, bgcolor: `${C.brand}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <GroupIcon sx={{ color: C.brand, fontSize: 20 }} />
                        </Box>
                        <Box>
                            <Typography variant="h6" fontWeight="bold" sx={{ color: C.heading, lineHeight: 1.2 }}>Friends</Typography>
                            <Typography sx={{ color: C.faded, fontSize: '0.72rem' }}>{friends.length} connected</Typography>
                        </Box>
                        {totalNotices > 0 && (
                            <Chip label={totalNotices} size="small"
                                sx={{ ml: 'auto', bgcolor: C.brand, color: C.bg, fontWeight: 700, height: 22, fontSize: '0.72rem' }} />
                        )}
                    </Stack>

                    {/* Add Friend */}
                    <Box sx={{ bgcolor: C.card, borderRadius: 3, p: 2.5, mb: 3, border: `1px solid ${C.border}` }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                            <PersonAddIcon sx={{ fontSize: 16, color: C.brand }} />
                            <Typography sx={{ color: C.heading, fontWeight: 700, fontSize: '0.85rem' }}>Add by Username</Typography>
                        </Stack>
                        <Stack direction="row" spacing={1} sx={{ mb: addErr ? 0.5 : 0 }}>
                            <TextField
                                fullWidth size="small"
                                placeholder="@username"
                                value={addUsername}
                                onChange={e => { setAddUsername(e.target.value); setAddErr(''); }}
                                onKeyDown={e => { if (e.key === 'Enter') sendRequest(); }}
                                error={!!addErr}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        bgcolor: C.bg, borderRadius: 2, color: C.text,
                                        '& fieldset': { borderColor: 'transparent' },
                                        '&:hover fieldset': { borderColor: C.brand },
                                        '&.Mui-focused fieldset': { borderColor: C.brand },
                                        '&.Mui-error fieldset': { borderColor: C.red },
                                    },
                                    '& .MuiInputBase-input': { py: '8px', fontSize: '0.85rem' },
                                    '& .MuiInputBase-input::placeholder': { color: C.faded, opacity: 1 },
                                }}
                            />
                            <Button variant="contained" onClick={sendRequest}
                                disabled={!addUsername.trim() || addBusy}
                                sx={{ bgcolor: C.brand, color: C.bg, fontWeight: 700, borderRadius: 2, px: 1.5, minWidth: 0, textTransform: 'none', whiteSpace: 'nowrap', '&:hover': { bgcolor: '#2db8b8' }, '&:disabled': { opacity: 0.45 } }}>
                                {addBusy ? <CircularProgress size={14} sx={{ color: C.bg }} /> : 'Add'}
                            </Button>
                        </Stack>
                        {addErr && <Typography sx={{ color: C.red, fontSize: '0.72rem', mt: 0.5 }}>{addErr}</Typography>}
                    </Box>

                    {/* Pending friend requests */}
                    {!loading && pending.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                                <HourglassEmptyIcon sx={{ fontSize: 15, color: C.yellow }} />
                                <Typography sx={{ color: C.heading, fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    Friend Requests
                                </Typography>
                                <Chip label={pending.length} size="small"
                                    sx={{ height: 18, fontSize: '0.65rem', bgcolor: `${C.yellow}20`, color: C.yellow, fontWeight: 700 }} />
                            </Stack>
                            <Stack spacing={1}>
                                {pending.map(r => {
                                    const avColor = getAvatarColor(r.avatar_id);
                                    return (
                                        <Box key={r.friendship_id} sx={{ bgcolor: C.card, borderRadius: 2.5, px: 2, py: 1.5, border: `1px solid ${C.yellow}25` }}>
                                            <Stack direction="row" alignItems="center" spacing={1.5}>
                                                <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: `${avColor}18`, flexShrink: 0, overflow: 'hidden' }}>
                                                    <Box component="img" src={getAvatarUrl(r.avatar_id)} alt="avatar" sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                                </Box>
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Typography fontWeight={700} sx={{ color: C.heading, fontSize: '0.82rem' }}>@{r.username}</Typography>
                                                    <Typography sx={{ color: C.faded, fontSize: '0.68rem' }}>wants to connect</Typography>
                                                </Box>
                                                <Stack direction="row" spacing={0.5}>
                                                    <IconButton size="small" onClick={() => acceptRequest(r.friendship_id)}
                                                        sx={{ bgcolor: `${C.green}22`, color: C.green, borderRadius: 1.5, p: 0.5, '&:hover': { bgcolor: `${C.green}38` } }}>
                                                        <CheckIcon sx={{ fontSize: 15 }} />
                                                    </IconButton>
                                                    <IconButton size="small" onClick={() => rejectRequest(r.friendship_id)}
                                                        sx={{ bgcolor: `${C.red}15`, color: C.red, borderRadius: 1.5, p: 0.5, '&:hover': { bgcolor: `${C.red}28` } }}>
                                                        <CloseIcon sx={{ fontSize: 15 }} />
                                                    </IconButton>
                                                </Stack>
                                            </Stack>
                                        </Box>
                                    );
                                })}
                            </Stack>
                        </Box>
                    )}

                    {/* Collab invites */}
                    {!loading && collabInvites.length > 0 && (
                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                                <HandshakeIcon sx={{ fontSize: 15, color: C.brand }} />
                                <Typography sx={{ color: C.heading, fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    Collab Invites
                                </Typography>
                                <Chip label={collabInvites.length} size="small"
                                    sx={{ height: 18, fontSize: '0.65rem', bgcolor: `${C.brand}20`, color: C.brand, fontWeight: 700 }} />
                            </Stack>
                            <Stack spacing={1}>
                                {collabInvites.map(c => {
                                    const avColor = getAvatarColor(c.invited_by_avatar_id);
                                    return (
                                        <Box key={c.collab_id} sx={{ bgcolor: C.card, borderRadius: 2.5, px: 2, py: 1.5, border: `1px solid ${C.brand}25` }}>
                                            <Stack direction="row" alignItems="flex-start" spacing={1.5}>
                                                <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: `${avColor}18`, flexShrink: 0, overflow: 'hidden' }}>
                                                    <Box component="img" src={getAvatarUrl(c.invited_by_avatar_id)} alt="avatar" sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                                </Box>
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Typography fontWeight={700} sx={{ color: C.heading, fontSize: '0.82rem', mb: 0.2 }} noWrap>{c.itinerary_title}</Typography>
                                                    <Typography sx={{ color: C.faded, fontSize: '0.68rem' }}>by @{c.invited_by_username}</Typography>
                                                    <Typography sx={{ color: C.brand, fontSize: '0.68rem' }}>{c.itinerary_destination}</Typography>
                                                </Box>
                                            </Stack>
                                            <Stack direction="row" spacing={0.75} sx={{ mt: 1.2 }}>
                                                <Button fullWidth size="small" variant="contained" onClick={() => acceptCollab(c.itinerary_id)}
                                                    sx={{ bgcolor: C.brand, color: C.bg, fontWeight: 700, borderRadius: 2, fontSize: '0.72rem', py: 0.4, textTransform: 'none', '&:hover': { bgcolor: '#2db8b8' } }}>
                                                    Join
                                                </Button>
                                                <Button fullWidth size="small" onClick={() => rejectCollab(c.itinerary_id)}
                                                    sx={{ color: C.faded, borderRadius: 2, fontSize: '0.72rem', py: 0.4, textTransform: 'none', '&:hover': { color: C.red } }}>
                                                    Decline
                                                </Button>
                                            </Stack>
                                        </Box>
                                    );
                                })}
                            </Stack>
                        </Box>
                    )}

                    {loading && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
                            <CircularProgress size={24} sx={{ color: C.brand }} />
                        </Box>
                    )}
                </Box>

                {/* ── RIGHT MAIN AREA ────────────────────────────────────────── */}
                <Box sx={{ flex: 1, height: '100vh', overflowY: 'auto', p: 3,
                    '&::-webkit-scrollbar': { width: 5 },
                    '&::-webkit-scrollbar-thumb': { bgcolor: C.surface, borderRadius: 2 },
                }}>

                    {/* Search + count row */}
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ color: C.heading }}>
                            Your Friends
                            <Typography component="span" sx={{ color: C.brand, ml: 1.5, fontSize: '0.9rem', fontWeight: 700 }}>
                                {friends.length}
                            </Typography>
                        </Typography>
                        <Box sx={{ flex: 1 }} />
                        <Box sx={{ position: 'relative', width: 220 }}>
                            <SearchIcon sx={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.faded, fontSize: 18, pointerEvents: 'none' }} />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search friends…"
                                style={{
                                    width: '100%', boxSizing: 'border-box',
                                    background: 'var(--card)', border: 'none', borderRadius: 10,
                                    padding: '8px 12px 8px 34px', fontSize: '0.82rem',
                                    color: C.text, outline: 'none',
                                    backgroundColor: COLORS.cardPrimary,
                                }}
                            />
                        </Box>
                    </Stack>

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}>
                            <CircularProgress sx={{ color: C.brand }} />
                        </Box>
                    ) : friends.length === 0 ? (
                        /* Empty state */
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pt: 10, gap: 2 }}>
                            <Box sx={{ width: 72, height: 72, borderRadius: 4, bgcolor: `${C.brand}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <GroupIcon sx={{ fontSize: 36, color: `${C.brand}80` }} />
                            </Box>
                            <Typography variant="h6" sx={{ color: C.sub }}>No friends yet</Typography>
                            <Typography sx={{ color: C.faded, fontSize: '0.82rem', textAlign: 'center', maxWidth: 340 }}>
                                Add friends using their username in the panel on the left, or connect with people in the Community Feed.
                            </Typography>
                        </Box>
                    ) : (
                        /* Friends grid */
                        <Box sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                            gap: 2,
                        }}>
                            {filteredFriends.map(f => {
                                const avColor = getAvatarColor(f.avatar_id);
                                return (
                                    <Box key={f.user_id} sx={{
                                        bgcolor: C.card, borderRadius: 4, p: 2.5,
                                        border: `1px solid ${C.border}`,
                                        transition: 'all 0.2s',
                                        '&:hover': { border: `1px solid ${C.brand}40`, boxShadow: `0 4px 20px rgba(0,0,0,0.25)`, transform: 'translateY(-2px)' },
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, position: 'relative',
                                    }}>
                                        {/* Avatar */}
                                        <Box sx={{
                                            width: 62, height: 62, borderRadius: 3.5,
                                            bgcolor: `${avColor}22`,
                                            border: `2px solid ${avColor}40`,
                                            overflow: 'hidden',
                                        }}>
                                            <Box component="img" src={getAvatarUrl(f.avatar_id)} alt="avatar" sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                        </Box>

                                        {/* Name */}
                                        <Box sx={{ textAlign: 'center', minWidth: 0, width: '100%' }}>
                                            <Typography fontWeight={700} sx={{ color: C.heading, fontSize: '0.9rem' }} noWrap>
                                                @{f.username}
                                            </Typography>
                                            {f.since && (
                                                <Typography sx={{ color: C.faded, fontSize: '0.65rem', mt: 0.2 }}>
                                                    since {new Date(f.since).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                                </Typography>
                                            )}
                                        </Box>

                                        {/* Action buttons */}
                                        <Stack direction="row" spacing={0.75} sx={{ width: '100%', mt: 'auto' }}>
                                            <Tooltip title="Open Chat" arrow>
                                                <Button size="small" variant="contained"
                                                    onClick={() => navigate('/dashboard')}
                                                    sx={{ flex: 1, bgcolor: C.brand, color: C.bg, fontWeight: 700, borderRadius: 2, py: 0.6, textTransform: 'none', fontSize: '0.72rem', '&:hover': { bgcolor: '#2db8b8' }, minWidth: 0 }}>
                                                    <ChatBubbleIcon sx={{ fontSize: 14, mr: 0.5 }} /> Chat
                                                </Button>
                                            </Tooltip>
                                            <Tooltip title="Remove Friend" arrow>
                                                <IconButton size="small" onClick={() => setRemoveTarget(f)}
                                                    sx={{ color: C.faded, bgcolor: C.surface, borderRadius: 2, p: 0.75, '&:hover': { color: C.red, bgcolor: `${C.red}15` } }}>
                                                    <PersonRemoveIcon sx={{ fontSize: 15 }} />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    </Box>
                                );
                            })}
                        </Box>
                    )}
                </Box>
            </Box>

            {/* Remove friend dialog */}
            <Dialog open={!!removeTarget} onClose={() => setRemoveTarget(null)}
                PaperProps={{ sx: { bgcolor: C.card, borderRadius: 4, border: `1px solid ${C.border}`, minWidth: 320 } }}>
                <DialogTitle sx={{ color: C.heading, fontWeight: 'bold', pb: 1 }}>Remove Friend?</DialogTitle>
                <DialogContent>
                    <Typography sx={{ color: C.text, fontSize: '0.9rem' }}>
                        Remove <Box component="span" sx={{ color: C.brand, fontWeight: 700 }}>@{removeTarget?.username}</Box> from your friends?
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setRemoveTarget(null)} sx={{ color: C.faded, borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
                    <Button onClick={() => removeFriend(removeTarget?.friendship_id)}
                        sx={{ bgcolor: C.red, color: '#fff', fontWeight: 700, borderRadius: 2, px: 3, textTransform: 'none', '&:hover': { bgcolor: '#e55959' } }}>
                        Remove
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(p => ({ ...p, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert severity={snack.sev} onClose={() => setSnack(p => ({ ...p, open: false }))}
                    sx={{ bgcolor: C.card, color: C.text, borderRadius: 3, border: `1px solid ${C.border}` }}>
                    {snack.msg}
                </Alert>
            </Snackbar>
        </Box>
    );
}