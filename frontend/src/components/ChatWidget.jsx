import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Box, Typography, Stack, Avatar, IconButton, TextField, Badge, Slide,
    CircularProgress, Chip, InputAdornment,
} from '@mui/material';
import axios from 'axios';

import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const C = {
    brand: '#33CCCC', bg: '#141627', card: '#252845',
    surface: 'rgba(255,255,255,0.06)', heading: '#B0D2EB',
    sub: '#C0D2EB', text: '#D0D2EB', faded: '#7B809A',
    error: '#ff6b6b', border: 'rgba(255,255,255,0.08)',
};

const AVATAR_LIST = [
    { id: 1, emoji: '🏔️', color: '#33CCCC' }, { id: 2, emoji: '🌄', color: '#FF7043' },
    { id: 3, emoji: '🏕️', color: '#66BB6A' }, { id: 4, emoji: '🧗', color: '#AB47BC' },
    { id: 5, emoji: '🚶', color: '#42A5F5' }, { id: 6, emoji: '🌿', color: '#26A69A' },
    { id: 7, emoji: '🦅', color: '#8D6E63' }, { id: 8, emoji: '🌺', color: '#EC407A' },
    { id: 9, emoji: '🏯', color: '#FFB74D' }, { id: 10, emoji: '🛶', color: '#5C6BC0' },
    { id: 11, emoji: '🌙', color: '#78909C' }, { id: 12, emoji: '☀️', color: '#FDD835' },
    { id: 13, emoji: '🦋', color: '#29B6F6' }, { id: 14, emoji: '🐾', color: '#A1887F' },
    { id: 15, emoji: '🎒', color: '#EF5350' }, { id: 16, emoji: '🗻', color: '#7E57C2' },
    { id: 17, emoji: '🌊', color: '#0097A7' }, { id: 18, emoji: '🔥', color: '#FF5722' },
    { id: 19, emoji: '❄️', color: '#90CAF9' }, { id: 20, emoji: '🌈', color: '#9CCC65' },
];

const getAvatar = (id) => AVATAR_LIST.find(a => a.id === id) || AVATAR_LIST[0];

const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const utc = dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z';
    const mins = Math.floor((new Date() - new Date(utc)) / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
};


const ChatWidget = () => {
    const userId = parseInt(localStorage.getItem('userId'));
    if (!userId) return null; // not logged in

    const [open, setOpen] = useState(false);
    const [view, setView] = useState('list'); // 'list' or 'chat'
    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null); // { friend_id, username, avatar_id }
    const [messages, setMessages] = useState([]);
    const [newMsg, setNewMsg] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(false);
    const [totalUnread, setTotalUnread] = useState(0);
    const msgEndRef = useRef(null);
    const pollRef = useRef(null);

    // add friend by username
    const [addUsername, setAddUsername] = useState('');
    const [addStatus, setAddStatus] = useState(''); // '', 'sending', 'sent', 'error', 'already'
    const [addError, setAddError] = useState('');

    // all friends list
    const [allFriends, setAllFriends] = useState([]);

    // fetch conversations and friends
    const fetchConversations = useCallback(async () => {
        try {
            const [convosRes, friendsRes] = await Promise.all([
                axios.get(`http://127.0.0.1:8000/messages/${userId}/conversations`),
                axios.get(`http://127.0.0.1:8000/friends/${userId}`),
            ]);
            const convos = convosRes.data?.conversations || [];
            const friends = friendsRes.data?.friends || [];
            setAllFriends(friends);

            // merge friends without conversations into the list
            const convoFriendIds = new Set(convos.map(c => c.friend_id));
            const friendsWithoutConvos = friends
                .filter(f => !convoFriendIds.has(f.user_id))
                .map(f => ({
                    friend_id: f.user_id,
                    username: f.username,
                    avatar_id: f.avatar_id,
                    last_message: null,
                    last_message_time: null,
                    unread_count: 0,
                }));

            const merged = [...convos, ...friendsWithoutConvos];
            setConversations(merged);
            setTotalUnread(convos.reduce((s, c) => s + (c.unread_count || 0), 0));
        } catch { /* silent */ }
    }, [userId]);

    // fetch on mount and poll
    useEffect(() => {
        fetchConversations();
        const interval = setInterval(fetchConversations, 15000);
        return () => clearInterval(interval);
    }, [fetchConversations]);

    // fetch messages for active chat
    const fetchMessages = useCallback(async () => {
        if (!activeChat) return;
        try {
            const res = await axios.get(`http://127.0.0.1:8000/messages/${userId}/${activeChat.friend_id}`);
            setMessages(res.data?.messages || []);
        } catch { /* silent */ }
    }, [userId, activeChat]);

    // when opening a chat, load messages and start polling
    useEffect(() => {
        if (view === 'chat' && activeChat) {
            setLoading(true);
            fetchMessages().finally(() => setLoading(false));
            pollRef.current = setInterval(fetchMessages, 5000);
            return () => clearInterval(pollRef.current);
        }
    }, [view, activeChat, fetchMessages]);

    // auto-scroll to bottom on new messages
    useEffect(() => {
        msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const openChat = (convo) => {
        setActiveChat({ friend_id: convo.friend_id, username: convo.username, avatar_id: convo.avatar_id });
        setMessages([]);
        setView('chat');
    };

    const goBack = () => {
        setView('list');
        setActiveChat(null);
        clearInterval(pollRef.current);
        fetchConversations();
    };

    const sendMessage = async () => {
        if (!newMsg.trim() || !activeChat) return;
        setSending(true);
        try {
            await axios.post(`http://127.0.0.1:8000/messages?user_id=${userId}`, {
                receiver_id: activeChat.friend_id,
                content: newMsg.trim(),
            });
            setNewMsg('');
            fetchMessages();
        } catch { /* silent */ }
        finally { setSending(false); }
    };

    const handleAddFriend = async () => {
        if (!addUsername.trim()) return;
        setAddStatus('sending'); setAddError('');
        try {
            await axios.post(`http://127.0.0.1:8000/friends/request?user_id=${userId}`, { receiver_username: addUsername.trim() });
            setAddStatus('sent');
            setAddUsername('');
            setTimeout(() => setAddStatus(''), 3000);
        } catch (e) {
            const detail = e.response?.data?.detail || 'Failed';
            if (detail.includes('Already friends')) { setAddStatus('already'); setTimeout(() => setAddStatus(''), 2000); }
            else if (detail.includes('pending')) { setAddStatus('already'); setTimeout(() => setAddStatus(''), 2000); }
            else if (detail.includes('yourself')) { setAddError("That's you!"); setAddStatus('error'); setTimeout(() => setAddStatus(''), 2000); }
            else if (detail.includes('not found')) { setAddError('User not found'); setAddStatus('error'); setTimeout(() => setAddStatus(''), 2000); }
            else { setAddError(detail); setAddStatus('error'); setTimeout(() => setAddStatus(''), 2000); }
        }
    };

    const avatar = activeChat ? getAvatar(activeChat.avatar_id) : null;

    return (
        <>
            {/* floating chat button */}
            {!open && (
                <IconButton
                    onClick={() => { setOpen(true); fetchConversations(); }}
                    sx={{
                        position: 'fixed', bottom: 24, right: 24, zIndex: 1300,
                        width: 52, height: 52, bgcolor: C.brand, color: C.bg,
                        boxShadow: `0 4px 20px rgba(51,204,204,0.4)`,
                        '&:hover': { bgcolor: '#2db8b8', transform: 'scale(1.08)' },
                        transition: 'all 0.2s',
                    }}
                >
                    <Badge badgeContent={totalUnread} color="error"
                        sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', minWidth: 16, height: 16 } }}>
                        <ChatIcon sx={{ fontSize: 24 }} />
                    </Badge>
                </IconButton>
            )}

            {/* chat panel */}
            <Slide direction="up" in={open} mountOnEnter unmountOnExit>
                <Box sx={{
                    position: 'fixed', bottom: 24, right: 24, zIndex: 1300,
                    width: 360, height: 480, borderRadius: 4, overflow: 'hidden',
                    bgcolor: C.bg, border: `1px solid ${C.border}`,
                    boxShadow: '0 12px 48px rgba(0,0,0,0.6)',
                    display: 'flex', flexDirection: 'column',
                }}>
                    {/* header */}
                    <Box sx={{
                        px: 2, py: 1.5, bgcolor: C.card,
                        borderBottom: `1px solid ${C.border}`,
                        display: 'flex', alignItems: 'center', gap: 1,
                    }}>
                        {view === 'chat' && (
                            <IconButton size="small" onClick={goBack} sx={{ color: C.faded, '&:hover': { color: C.brand } }}>
                                <ArrowBackIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                        )}
                        {view === 'chat' && activeChat ? (
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
                                <Box sx={{ width: 28, height: 28, borderRadius: 2, bgcolor: `${avatar.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>
                                    {avatar.emoji}
                                </Box>
                                <Typography sx={{ color: C.heading, fontWeight: 700, fontSize: '0.88rem' }}>
                                    {activeChat.username}
                                </Typography>
                            </Stack>
                        ) : (
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
                                <PeopleIcon sx={{ color: C.brand, fontSize: 20 }} />
                                <Typography sx={{ color: C.heading, fontWeight: 700, fontSize: '0.88rem' }}>
                                    Messages
                                </Typography>
                                {totalUnread > 0 && (
                                    <Box sx={{ bgcolor: C.brand, borderRadius: 8, px: 0.8, py: 0.1 }}>
                                        <Typography sx={{ color: C.bg, fontSize: '0.6rem', fontWeight: 800 }}>{totalUnread}</Typography>
                                    </Box>
                                )}
                            </Stack>
                        )}
                        <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: C.faded, '&:hover': { color: C.error } }}>
                            <CloseIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Box>

                    {/* body */}
                    {view === 'list' ? (
                        // conversations list
                        <Box sx={{
                            flex: 1, overflowY: 'auto',
                            '&::-webkit-scrollbar': { width: 3 },
                            '&::-webkit-scrollbar-thumb': { bgcolor: C.surface, borderRadius: 2 },
                        }}>
                            {/* add friend bar */}
                            <Box sx={{ px: 1.5, py: 1.2, borderBottom: `1px solid ${C.border}` }}>
                                <Stack direction="row" spacing={0.8} alignItems="center">
                                    <TextField
                                        fullWidth size="small"
                                        placeholder="Add friend by username..."
                                        value={addUsername}
                                        onChange={(e) => { setAddUsername(e.target.value); setAddStatus(''); }}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddFriend(); }}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><PersonAddIcon sx={{ fontSize: 16, color: C.faded }} /></InputAdornment>,
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                bgcolor: C.surface, borderRadius: 2, color: C.text, height: 34,
                                                '& fieldset': { borderColor: 'transparent' },
                                                '&:hover fieldset': { borderColor: C.brand },
                                                '&.Mui-focused fieldset': { borderColor: C.brand },
                                            },
                                            '& .MuiInputBase-input': { py: '6px', fontSize: '0.78rem' },
                                            '& .MuiInputBase-input::placeholder': { color: C.faded, opacity: 1 },
                                        }}
                                    />
                                    <IconButton size="small" onClick={handleAddFriend} disabled={!addUsername.trim() || addStatus === 'sending'}
                                        sx={{ width: 34, height: 34, bgcolor: C.brand, color: C.bg, borderRadius: 2, '&:hover': { bgcolor: '#2db8b8' }, '&:disabled': { bgcolor: C.surface, color: C.faded } }}>
                                        {addStatus === 'sending' ? <CircularProgress size={14} sx={{ color: C.bg }} /> : <PersonAddIcon sx={{ fontSize: 16 }} />}
                                    </IconButton>
                                </Stack>
                                {addStatus === 'sent' && (
                                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                                        <CheckCircleIcon sx={{ fontSize: 12, color: '#4CAF50' }} />
                                        <Typography sx={{ color: '#4CAF50', fontSize: '0.68rem' }}>Friend request sent!</Typography>
                                    </Stack>
                                )}
                                {addStatus === 'already' && (
                                    <Typography sx={{ color: C.brand, fontSize: '0.68rem', mt: 0.5 }}>Already friends or request pending</Typography>
                                )}
                                {addStatus === 'error' && (
                                    <Typography sx={{ color: C.error, fontSize: '0.68rem', mt: 0.5 }}>{addError}</Typography>
                                )}
                            </Box>

                            {/* friends / conversations */}
                            {conversations.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 5, px: 3 }}>
                                    <PeopleIcon sx={{ fontSize: 32, color: C.faded, mb: 1 }} />
                                    <Typography sx={{ color: C.faded, fontSize: '0.82rem', mb: 0.5 }}>No friends yet</Typography>
                                    <Typography sx={{ color: C.faded, fontSize: '0.7rem' }}>
                                        Enter a username above to send a friend request.
                                    </Typography>
                                </Box>
                            ) : (
                                conversations.map(convo => {
                                    const av = getAvatar(convo.avatar_id);
                                    return (
                                        <Box key={convo.friend_id} onClick={() => openChat(convo)}
                                            sx={{
                                                px: 2, py: 1.5, cursor: 'pointer',
                                                borderBottom: `1px solid ${C.border}`,
                                                bgcolor: convo.unread_count > 0 ? 'rgba(51,204,204,0.04)' : 'transparent',
                                                '&:hover': { bgcolor: C.surface },
                                            }}>
                                            <Stack direction="row" spacing={1.5} alignItems="center">
                                                <Box sx={{
                                                    width: 36, height: 36, borderRadius: 2.5,
                                                    bgcolor: `${av.color}18`, display: 'flex',
                                                    alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '1.1rem', flexShrink: 0,
                                                }}>
                                                    {av.emoji}
                                                </Box>
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                        <Typography sx={{ color: C.heading, fontWeight: convo.unread_count > 0 ? 700 : 500, fontSize: '0.82rem' }}>
                                                            {convo.username}
                                                        </Typography>
                                                        <Typography sx={{ color: C.faded, fontSize: '0.6rem' }}>
                                                            {timeAgo(convo.last_message_time)}
                                                        </Typography>
                                                    </Stack>
                                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                        <Typography noWrap sx={{ color: C.faded, fontSize: '0.72rem', flex: 1 }}>
                                                            {convo.last_message || 'No messages yet'}
                                                        </Typography>
                                                        {convo.unread_count > 0 && (
                                                            <Box sx={{ bgcolor: C.brand, borderRadius: 8, minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', ml: 1 }}>
                                                                <Typography sx={{ color: C.bg, fontSize: '0.55rem', fontWeight: 800 }}>{convo.unread_count}</Typography>
                                                            </Box>
                                                        )}
                                                    </Stack>
                                                </Box>
                                            </Stack>
                                        </Box>
                                    );
                                })
                            )}
                        </Box>
                    ) : (
                        // chat view
                        <>
                            <Box sx={{
                                flex: 1, overflowY: 'auto', px: 2, py: 1.5,
                                display: 'flex', flexDirection: 'column', gap: 0.8,
                                '&::-webkit-scrollbar': { width: 3 },
                                '&::-webkit-scrollbar-thumb': { bgcolor: C.surface, borderRadius: 2 },
                            }}>
                                {loading ? (
                                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <CircularProgress size={22} sx={{ color: C.brand }} />
                                    </Box>
                                ) : messages.length === 0 ? (
                                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Typography sx={{ color: C.faded, fontSize: '0.78rem' }}>Send the first message!</Typography>
                                    </Box>
                                ) : (
                                    messages.map(msg => {
                                        const isMine = msg.sender_id === userId;
                                        return (
                                            <Box key={msg.id} sx={{
                                                alignSelf: isMine ? 'flex-end' : 'flex-start',
                                                maxWidth: '78%',
                                            }}>
                                                <Box sx={{
                                                    bgcolor: isMine ? C.brand : C.card,
                                                    color: isMine ? C.bg : C.text,
                                                    borderRadius: 3,
                                                    borderBottomRightRadius: isMine ? 4 : 12,
                                                    borderBottomLeftRadius: isMine ? 12 : 4,
                                                    px: 1.5, py: 0.8,
                                                }}>
                                                    <Typography sx={{ fontSize: '0.82rem', lineHeight: 1.45, wordBreak: 'break-word' }}>
                                                        {msg.content}
                                                    </Typography>
                                                    {/* shared itinerary link */}
                                                    {msg.shared_itinerary_id && (
                                                        <Box sx={{
                                                            mt: 0.5, pt: 0.5, borderTop: `1px solid ${isMine ? 'rgba(20,22,39,0.2)' : C.border}`,
                                                            display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer',
                                                        }}
                                                            onClick={() => window.location.href = `/itinerary/${msg.shared_itinerary_id}`}
                                                        >
                                                            <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: isMine ? 'rgba(20,22,39,0.7)' : C.brand }}>
                                                                📍 View shared itinerary
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                </Box>
                                                <Typography sx={{
                                                    fontSize: '0.55rem', color: C.faded,
                                                    mt: 0.2, textAlign: isMine ? 'right' : 'left',
                                                    px: 0.3,
                                                }}>
                                                    {timeAgo(msg.created_at)}
                                                </Typography>
                                            </Box>
                                        );
                                    })
                                )}
                                <div ref={msgEndRef} />
                            </Box>

                            {/* message input */}
                            <Box sx={{ px: 1.5, py: 1, borderTop: `1px solid ${C.border}`, bgcolor: C.card }}>
                                <Stack direction="row" spacing={0.8} alignItems="center">
                                    <TextField
                                        fullWidth size="small" placeholder="Type a message..."
                                        value={newMsg}
                                        onChange={(e) => setNewMsg(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                bgcolor: C.surface, borderRadius: 3, color: C.text,
                                                '& fieldset': { borderColor: 'transparent' },
                                                '&:hover fieldset': { borderColor: C.brand },
                                                '&.Mui-focused fieldset': { borderColor: C.brand },
                                            },
                                            '& .MuiInputBase-input': { py: '8px', fontSize: '0.82rem' },
                                            '& .MuiInputBase-input::placeholder': { color: C.faded, opacity: 1 },
                                        }}
                                    />
                                    <IconButton size="small" onClick={sendMessage} disabled={!newMsg.trim() || sending}
                                        sx={{
                                            bgcolor: C.brand, color: C.bg, width: 34, height: 34,
                                            '&:hover': { bgcolor: '#2db8b8' },
                                            '&:disabled': { bgcolor: C.surface, color: C.faded },
                                        }}>
                                        {sending ? <CircularProgress size={14} sx={{ color: C.bg }} /> : <SendIcon sx={{ fontSize: 16 }} />}
                                    </IconButton>
                                </Stack>
                            </Box>
                        </>
                    )}
                </Box>
            </Slide>
        </>
    );
};

export default ChatWidget;