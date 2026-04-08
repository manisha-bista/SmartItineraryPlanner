import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Stack, Button, TextField, CircularProgress,
    IconButton, Chip, Drawer, Divider, Alert, Snackbar,
    Dialog, DialogTitle, DialogContent, DialogActions, Tooltip,
} from '@mui/material';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';

import PersonAddIcon      from '@mui/icons-material/PersonAdd';
import CheckIcon          from '@mui/icons-material/Check';
import CloseIcon          from '@mui/icons-material/Close';
import PersonRemoveIcon   from '@mui/icons-material/PersonRemove';
import GroupIcon          from '@mui/icons-material/Group';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import HandshakeIcon      from '@mui/icons-material/Handshake';
import ChatBubbleIcon     from '@mui/icons-material/ChatBubble';

const AVATAR_LIST = [
    { id: 1,  style: 'notionists', seed: 'explorer',  color: '#33CCCC' },
    { id: 2,  style: 'notionists', seed: 'summit',    color: '#EC407A' },
    { id: 3,  style: 'notionists', seed: 'atlas',     color: '#5C6BC0' },
    { id: 4,  style: 'notionists', seed: 'voyage',    color: '#26A69A' },
    { id: 5,  style: 'notionists', seed: 'horizon',   color: '#AB47BC' },
    { id: 6,  style: 'notionists', seed: 'trailhead', color: '#42A5F5' },
    { id: 7,  style: 'notionists', seed: 'meridian',  color: '#8D6E63' },
    { id: 8,  style: 'notionists', seed: 'solstice',  color: '#66BB6A' },
    { id: 9,  style: 'micah',      seed: 'peak',      color: '#FFB74D' },
    { id: 10, style: 'micah',      seed: 'nomad',     color: '#5C6BC0' },
    { id: 11, style: 'micah',      seed: 'delta',     color: '#78909C' },
    { id: 12, style: 'micah',      seed: 'canyon',    color: '#FDD835' },
    { id: 13, style: 'micah',      seed: 'sierra',    color: '#29B6F6' },
    { id: 14, style: 'micah',      seed: 'fjord',     color: '#A1887F' },
    { id: 15, style: 'micah',      seed: 'savanna',   color: '#EF5350' },
    { id: 16, style: 'micah',      seed: 'tundra',    color: '#7E57C2' },
    { id: 17, style: 'lorelei',    seed: 'celeste',   color: '#0097A7' },
    { id: 18, style: 'lorelei',    seed: 'aurora',    color: '#FF5722' },
    { id: 19, style: 'lorelei',    seed: 'marina',    color: '#90CAF9' },
    { id: 20, style: 'lorelei',    seed: 'sahara',    color: '#9CCC65' },
];
const getAvatarUrl = (id) => {
    const av = AVATAR_LIST.find(a => a.id === id) || AVATAR_LIST[0];
    return `https://api.dicebear.com/7.x/${av.style}/svg?seed=${av.seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
};
const getAvatarColor = (id) => (AVATAR_LIST.find(a => a.id === id) || AVATAR_LIST[0]).color;

// Tab button helper
const Tab = ({ active, onClick, children, badge, C }) => (
    <Button onClick={onClick} size="small" sx={{
        flex: 1, borderRadius: 2, textTransform: 'none', fontSize: '0.78rem', py: 0.7,
        fontWeight: active ? 700 : 500,
        color: active ? C.brand : C.faded,
        bgcolor: active ? `${C.brand}18` : 'transparent',
        border: `1px solid ${active ? C.brand + '40' : 'transparent'}`,
        '&:hover': { color: C.brand, bgcolor: `${C.brand}10` },
        position: 'relative',
    }}>
        {children}
        {badge > 0 && (
            <Box sx={{ position: 'absolute', top: 2, right: 4, width: 16, height: 16, borderRadius: '50%', bgcolor: '#ff6b6b', color: '#fff', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                {badge}
            </Box>
        )}
    </Button>
);

export default function FriendsPopup({ open, onClose, onOpenChat }) {
    const { COLORS, isDark } = useTheme();
    const userId = parseInt(localStorage.getItem('userId'));

    const C = {
        brand: COLORS.brand, bg: COLORS.background, card: COLORS.cardPrimary,
        surface: COLORS.cardSecondary, border: COLORS.cardBorder,
        heading: COLORS.headings, sub: COLORS.subheadings, text: COLORS.text,
        faded: COLORS.fadedText, red: '#ff6b6b', green: '#66d9a0', yellow: '#ffb74d',
    };

    const [tab, setTab]                   = useState('friends'); // 'friends' | 'add' | 'requests'
    const [friends, setFriends]           = useState([]);
    const [pending, setPending]           = useState([]);
    const [collabInvites, setCollabInvites] = useState([]);
    const [loading, setLoading]           = useState(false);
    const [addUsername, setAddUsername]   = useState('');
    const [addBusy, setAddBusy]           = useState(false);
    const [addErr, setAddErr]             = useState('');
    const [addSuccess, setAddSuccess]     = useState('');
    const [removeTarget, setRemoveTarget] = useState(null);
    const [snack, setSnack]               = useState({ open: false, msg: '', sev: 'success' });

    const toast = (msg, sev = 'success') => setSnack({ open: true, msg, sev });

    const load = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const [fr, pr, cr] = await Promise.all([
                axios.get(`http://127.0.0.1:8000/friends/${userId}`),
                axios.get(`http://127.0.0.1:8000/friends/${userId}/pending`),
                axios.get(`http://127.0.0.1:8000/itineraries/user/${userId}/pending-collabs`),
            ]);
            setFriends(fr.data?.friends || []);
            setPending(pr.data?.requests || []);
            setCollabInvites(cr.data || []);
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, [userId]);

    useEffect(() => { if (open) load(); }, [open, load]);

    const sendRequest = async () => {
        if (!addUsername.trim()) return;
        setAddBusy(true); setAddErr(''); setAddSuccess('');
        try {
            await axios.post(`http://127.0.0.1:8000/friends/request?user_id=${userId}`, { receiver_username: addUsername.trim().replace(/^@/, '').replace(/[^a-z0-9]/gi, '') });
            setAddSuccess(`Request sent to @${addUsername.trim()}!`);
            setAddUsername('');
        } catch (e) {
            const d = e.response?.data?.detail || '';
            if (d.toLowerCase().includes('not found')) setAddErr('User not found. Check the username.');
            else if (d.toLowerCase().includes('already')) setAddErr('Already friends or request pending.');
            else setAddErr(d || 'Failed to send request.');
        } finally { setAddBusy(false); }
    };

    const acceptRequest = async (fid) => {
        try {
            await axios.patch(`http://127.0.0.1:8000/friends/${fid}/accept?user_id=${userId}`);
            toast('Friend added!'); load();
        } catch { toast('Failed.', 'error'); }
    };
    const rejectRequest = async (fid) => {
        try {
            await axios.patch(`http://127.0.0.1:8000/friends/${fid}/reject?user_id=${userId}`);
            load();
        } catch { toast('Failed.', 'error'); }
    };
    const removeFriend = async (fid) => {
        try {
            await axios.delete(`http://127.0.0.1:8000/friends/${fid}?user_id=${userId}`);
            toast('Removed.'); setRemoveTarget(null); load();
        } catch { toast('Failed.', 'error'); }
    };
    const acceptCollab = async (itinId) => {
        try {
            await axios.patch(`http://127.0.0.1:8000/itineraries/${itinId}/collaborators/accept?user_id=${userId}`);
            toast('Joined collaboration!'); load();
        } catch { toast('Failed.', 'error'); }
    };
    const rejectCollab = async (itinId) => {
        try {
            await axios.patch(`http://127.0.0.1:8000/itineraries/${itinId}/collaborators/reject?user_id=${userId}`);
            load();
        } catch { toast('Failed.', 'error'); }
    };

    const notices = pending.length + collabInvites.length;

    const inputSx = {
        '& .MuiOutlinedInput-root': {
            bgcolor: C.bg, borderRadius: 2, color: C.text,
            '& fieldset': { borderColor: C.brand },
            '&:hover fieldset': { borderColor: C.brand },
            '&.Mui-focused fieldset': { borderColor: C.brand },
            '&.Mui-error fieldset': { borderColor: C.red },
        },
        '& .MuiInputBase-input': { py: '8.5px', fontSize: '0.85rem', color: C.text },
        '& .MuiInputBase-input::placeholder': { color: C.faded, opacity: 1 },
    };

    return (
        <>
            <Drawer anchor="right" open={open} onClose={onClose}
                PaperProps={{
                    sx: {
                        width: 360, bgcolor: C.bg,
                        borderLeft: `1px solid ${C.border}`,
                        display: 'flex', flexDirection: 'column',
                    }
                }}>

                {/* Header */}
                <Stack direction="row" alignItems="center" sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
                    <Box sx={{ width: 34, height: 34, borderRadius: 2, bgcolor: `${C.brand}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 1.5 }}>
                        <GroupIcon sx={{ color: C.brand, fontSize: 18 }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography fontWeight={700} sx={{ color: C.heading, fontSize: '0.95rem', lineHeight: 1.2 }}>Friends</Typography>
                        <Typography sx={{ color: C.faded, fontSize: '0.7rem' }}>{friends.length} connected</Typography>
                    </Box>
                    {notices > 0 && (
                        <Chip label={`${notices} new`} size="small"
                            sx={{ bgcolor: `${C.brand}20`, color: C.brand, fontWeight: 700, fontSize: '0.65rem', height: 20, mr: 1 }} />
                    )}
                    <IconButton size="small" onClick={onClose}
                        sx={{ color: C.faded, borderRadius: 2, '&:hover': { color: C.red, bgcolor: `${C.red}12` } }}>
                        <CloseIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                </Stack>

                {/* Tabs */}
                <Stack direction="row" spacing={0.5} sx={{ px: 2, pt: 1.5, pb: 1, flexShrink: 0 }}>
                    <Tab active={tab === 'friends'} onClick={() => setTab('friends')} C={C}>
                        Friends {friends.length > 0 ? `(${friends.length})` : ''}
                    </Tab>
                    <Tab active={tab === 'add'} onClick={() => setTab('add')} C={C}>
                        + Add
                    </Tab>
                    <Tab active={tab === 'requests'} onClick={() => setTab('requests')} badge={notices} C={C}>
                        Requests
                    </Tab>
                </Stack>

                <Divider sx={{ borderColor: C.border, mx: 2 }} />

                {/* Body */}
                <Box sx={{ flex: 1, overflowY: 'auto', px: 2, py: 2,
                    '&::-webkit-scrollbar': { width: 4 },
                    '&::-webkit-scrollbar-thumb': { bgcolor: C.surface, borderRadius: 2 },
                }}>

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}>
                            <CircularProgress size={24} sx={{ color: C.brand }} />
                        </Box>
                    ) : tab === 'friends' ? (
                        friends.length === 0 ? (
                            <Box sx={{ textAlign: 'center', pt: 6 }}>
                                <Box sx={{ fontSize: '2.5rem', mb: 1.5 }}>👥</Box>
                                <Typography sx={{ color: C.sub, fontSize: '0.88rem', mb: 0.5 }}>No friends yet</Typography>
                                <Typography sx={{ color: C.faded, fontSize: '0.75rem', mb: 2 }}>
                                    Use the "+" tab to add someone by username.
                                </Typography>
                                <Button size="small" onClick={() => setTab('add')}
                                    sx={{ color: C.brand, borderRadius: 2, textTransform: 'none', bgcolor: `${C.brand}14`, px: 2, '&:hover': { bgcolor: `${C.brand}22` } }}>
                                    Add a friend
                                </Button>
                            </Box>
                        ) : (
                            <Stack spacing={1}>
                                {friends.map(f => {
                                    const avColor = getAvatarColor(f.avatar_id);
                                    return (
                                        <Stack key={f.user_id} direction="row" alignItems="center" spacing={1.5}
                                            sx={{ bgcolor: C.card, borderRadius: 3, px: 2, py: 1.5, border: `1px solid ${C.border}`, transition: 'all 0.15s', '&:hover': { border: `1px solid ${C.brand}30` } }}>
                                            <Box sx={{ width: 40, height: 40, borderRadius: 2.5, bgcolor: `${avColor}20`, border: `1.5px solid ${avColor}35`, flexShrink: 0, overflow: 'hidden' }}>
                                                <Box component="img" src={getAvatarUrl(f.avatar_id)} alt="avatar" sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                            </Box>
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography fontWeight={700} sx={{ color: C.heading, fontSize: '0.88rem' }}>@{f.username}</Typography>
                                                {f.since && (
                                                    <Typography sx={{ color: C.faded, fontSize: '0.68rem' }}>
                                                        since {new Date(f.since).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                                    </Typography>
                                                )}
                                            </Box>
                                            <Tooltip title="Chat" arrow>
                                                <IconButton size="small" onClick={() => {
                                                    window.dispatchEvent(new CustomEvent('open-chat', { detail: { friendId: f.user_id, username: f.username, avatarId: f.avatar_id } }));
                                                    onClose();
                                                }}
                                                    sx={{ color: C.brand, bgcolor: `${C.brand}14`, borderRadius: 2, p: 0.75, '&:hover': { bgcolor: `${C.brand}28` } }}>
                                                    <ChatBubbleIcon sx={{ fontSize: 15 }} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Remove friend" arrow>
                                                <IconButton size="small" onClick={() => setRemoveTarget(f)}
                                                    sx={{ color: C.faded, borderRadius: 2, p: 0.75, '&:hover': { color: C.red, bgcolor: `${C.red}12` } }}>
                                                    <PersonRemoveIcon sx={{ fontSize: 15 }} />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    );
                                })}
                            </Stack>
                        )
                    ) : tab === 'add' ? (
                        <Box>
                            <Typography sx={{ color: C.sub, fontSize: '0.78rem', mb: 2, lineHeight: 1.6 }}>
                                Username is the only way to find people. Ask your travel buddy for theirs!
                            </Typography>
                            <Stack spacing={1.5}>
                                <TextField fullWidth placeholder="@username"
                                    value={addUsername}
                                    onChange={e => { setAddUsername(e.target.value); setAddErr(''); setAddSuccess(''); }}
                                    onKeyDown={e => { if (e.key === 'Enter') sendRequest(); }}
                                    size="small" error={!!addErr} sx={inputSx} />
                                {addErr && <Typography sx={{ color: C.red, fontSize: '0.75rem' }}>{addErr}</Typography>}
                                {addSuccess && <Typography sx={{ color: C.green, fontSize: '0.75rem' }}>{addSuccess}</Typography>}
                                <Button variant="contained" fullWidth onClick={sendRequest}
                                    disabled={!addUsername.trim() || addBusy}
                                    startIcon={addBusy ? <CircularProgress size={14} sx={{ color: C.bg }} /> : <PersonAddIcon sx={{ fontSize: 16 }} />}
                                    sx={{ bgcolor: C.brand, color: isDark ? '#fff' : '#111', fontWeight: 700, borderRadius: 2.5, py: 1, textTransform: 'none', '&:hover': { bgcolor: '#2db8b8' }, '&:disabled': { opacity: 0.45 } }}>
                                    Send Friend Request
                                </Button>
                            </Stack>
                        </Box>
                    ) : (
                        /* Requests tab */
                        <Stack spacing={2.5}>
                            {/* Friend requests */}
                            {pending.length > 0 && (
                                <Box>
                                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                                        <HourglassEmptyIcon sx={{ fontSize: 14, color: C.yellow }} />
                                        <Typography sx={{ color: C.heading, fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                            Friend Requests
                                        </Typography>
                                        <Chip label={pending.length} size="small"
                                            sx={{ height: 18, fontSize: '0.62rem', bgcolor: `${C.yellow}20`, color: C.yellow, fontWeight: 700 }} />
                                    </Stack>
                                    <Stack spacing={1}>
                                        {pending.map(r => {
                                            const avColor = getAvatarColor(r.avatar_id);
                                            return (
                                                <Stack key={r.friendship_id} direction="row" alignItems="center" spacing={1.5}
                                                    sx={{ bgcolor: C.card, borderRadius: 3, px: 2, py: 1.5, border: `1px solid ${C.yellow}25` }}>
                                                    <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: `${avColor}18`, flexShrink: 0, overflow: 'hidden' }}>
                                                        <Box component="img" src={getAvatarUrl(r.avatar_id)} alt="avatar" sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                                    </Box>
                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                        <Typography fontWeight={700} sx={{ color: C.heading, fontSize: '0.85rem' }}>@{r.username}</Typography>
                                                        <Typography sx={{ color: C.faded, fontSize: '0.68rem' }}>wants to connect</Typography>
                                                    </Box>
                                                    <Stack direction="row" spacing={0.5}>
                                                        <IconButton size="small" onClick={() => acceptRequest(r.friendship_id)}
                                                            sx={{ bgcolor: `${C.green}22`, color: C.green, borderRadius: 1.5, p: 0.6, '&:hover': { bgcolor: `${C.green}38` } }}>
                                                            <CheckIcon sx={{ fontSize: 15 }} />
                                                        </IconButton>
                                                        <IconButton size="small" onClick={() => rejectRequest(r.friendship_id)}
                                                            sx={{ bgcolor: `${C.red}15`, color: C.red, borderRadius: 1.5, p: 0.6, '&:hover': { bgcolor: `${C.red}28` } }}>
                                                            <CloseIcon sx={{ fontSize: 15 }} />
                                                        </IconButton>
                                                    </Stack>
                                                </Stack>
                                            );
                                        })}
                                    </Stack>
                                </Box>
                            )}

                            {/* Collab invites */}
                            {collabInvites.length > 0 && (
                                <Box>
                                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                                        <HandshakeIcon sx={{ fontSize: 14, color: C.brand }} />
                                        <Typography sx={{ color: C.heading, fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                            Collab Invites
                                        </Typography>
                                        <Chip label={collabInvites.length} size="small"
                                            sx={{ height: 18, fontSize: '0.62rem', bgcolor: `${C.brand}20`, color: C.brand, fontWeight: 700 }} />
                                    </Stack>
                                    <Stack spacing={1}>
                                        {collabInvites.map(c => {
                                            const avColor = getAvatarColor(c.invited_by_avatar_id);
                                            return (
                                                <Box key={c.collab_id} sx={{ bgcolor: C.card, borderRadius: 3, px: 2, py: 1.5, border: `1px solid ${C.brand}25` }}>
                                                    <Stack direction="row" alignItems="flex-start" spacing={1.5} sx={{ mb: 1.2 }}>
                                                        <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: `${avColor}18`, flexShrink: 0, overflow: 'hidden' }}>
                                                            <Box component="img" src={getAvatarUrl(c.invited_by_avatar_id)} alt="avatar" sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                                        </Box>
                                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                                            <Typography fontWeight={700} sx={{ color: C.heading, fontSize: '0.85rem', mb: 0.15 }} noWrap>{c.itinerary_title}</Typography>
                                                            <Typography sx={{ color: C.faded, fontSize: '0.7rem' }}>by @{c.invited_by_username}</Typography>
                                                            <Typography sx={{ color: C.brand, fontSize: '0.7rem' }}>{c.itinerary_destination}</Typography>
                                                        </Box>
                                                    </Stack>
                                                    <Stack direction="row" spacing={0.75}>
                                                        <Button fullWidth size="small" variant="contained" onClick={() => acceptCollab(c.itinerary_id)}
                                                            sx={{ bgcolor: C.brand, color: C.bg, fontWeight: 700, borderRadius: 2, fontSize: '0.72rem', py: 0.5, textTransform: 'none', '&:hover': { bgcolor: '#2db8b8' } }}>
                                                            Join
                                                        </Button>
                                                        <Button fullWidth size="small" onClick={() => rejectCollab(c.itinerary_id)}
                                                            sx={{ color: C.faded, borderRadius: 2, fontSize: '0.72rem', py: 0.5, textTransform: 'none', '&:hover': { color: C.red } }}>
                                                            Decline
                                                        </Button>
                                                    </Stack>
                                                </Box>
                                            );
                                        })}
                                    </Stack>
                                </Box>
                            )}

                            {pending.length === 0 && collabInvites.length === 0 && (
                                <Box sx={{ textAlign: 'center', pt: 5 }}>
                                    <Box sx={{ fontSize: '2rem', mb: 1 }}>✅</Box>
                                    <Typography sx={{ color: C.sub, fontSize: '0.85rem' }}>All caught up!</Typography>
                                    <Typography sx={{ color: C.faded, fontSize: '0.75rem', mt: 0.5 }}>No pending requests.</Typography>
                                </Box>
                            )}
                        </Stack>
                    )}
                </Box>
            </Drawer>

            {/* Remove confirm */}
            <Dialog open={!!removeTarget} onClose={() => setRemoveTarget(null)}
                PaperProps={{ sx: { bgcolor: C.card, borderRadius: 4, border: `1px solid ${C.border}`, minWidth: 300 } }}>
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
        </>
    );
}