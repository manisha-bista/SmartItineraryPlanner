import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Stack, Avatar, Chip, IconButton, Button, TextField,
    InputAdornment, Card, CardContent, Drawer, List, ListItem, ListItemButton,
    ListItemIcon, ListItemText, Dialog, DialogTitle, DialogContent, DialogActions,
    CircularProgress, Select, MenuItem, Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Icons
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AddIcon from '@mui/icons-material/Add';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MapIcon from '@mui/icons-material/Map';
import GroupIcon from '@mui/icons-material/Group';
import ExploreIcon from '@mui/icons-material/Explore';
import LogoutIcon from '@mui/icons-material/Logout';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ShareIcon from '@mui/icons-material/Share';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CloseIcon from '@mui/icons-material/Close';
import ImageIcon from '@mui/icons-material/Image';
import EditNoteIcon from '@mui/icons-material/EditNote';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

// design system
const COLORS = {
    brand: '#33CCCC',
    background: '#141627',
    cardPrimary: '#252845',
    cardSecondary: 'rgba(255, 255, 255, 0.08)',
    headings: '#B0D2EB',
    subheadings: '#C0D2EB',
    text: '#D0D2EB',
    fadedText: '#7B809A',
    icons: '#B0D2EB',
    error: '#ff6b6b',
    border: 'rgba(255, 255, 255, 0.08)',
    success: '#4CAF50',
    warning: '#FFB74D',
};

const drawerWidth = 240;

const TAG_OPTIONS = ['Experience', 'Alert', 'Event', 'Tip', 'Question'];
const TAG_COLORS = {
    Experience: '#33CCCC',
    Alert: '#FFB74D',
    Event: '#4CAF50',
    Tip: '#9C27B0',
    Question: '#42A5F5',
};

// we'll add more places later as the userbase grows
const PLACE_OPTIONS = ['All', 'Kathmandu', 'Pokhara', 'Annapurna', 'Everest', 'Mustang', 'Chitwan'];

const FILTER_OPTIONS = [
    { label: 'New', icon: <NewReleasesIcon sx={{ fontSize: 16 }} />, sort: 'new' },
    { label: 'Popular', icon: <WhatshotIcon sx={{ fontSize: 16 }} />, sort: 'popular' },
    { label: 'Top', icon: <TrendingUpIcon sx={{ fontSize: 16 }} />, sort: 'top' },
];

const inputSx = {
    '& .MuiOutlinedInput-root': {
        bgcolor: COLORS.cardPrimary,
        borderRadius: 5,
        color: COLORS.text,
        '& fieldset': { borderColor: 'transparent' },
        '&:hover fieldset': { borderColor: COLORS.brand },
        '&.Mui-focused fieldset': { borderColor: COLORS.brand },
    },
    '& .MuiInputBase-input::placeholder': { color: COLORS.fadedText, opacity: 1 },
    '& .MuiInputBase-input': { padding: '14px 16px', color: COLORS.text },
};

// helper — turns a timestamp into "2h ago", "3d ago" etc
const timeAgo = (dateStr) => {
    const now = new Date();
    const then = new Date(dateStr);
    const diffMs = now - then;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    return `${weeks}w ago`;
};


// ── Post Card ────────────────────────────────────────────────
const PostCard = ({ post, onVote, onSave }) => {
    const tagColor = TAG_COLORS[post.tag] || COLORS.brand;
    const netVotes = (post.upvotes || 0) - (post.downvotes || 0);

    const voteColor = (dir) => {
        if (post.user_vote === dir) return dir === 'up' ? COLORS.brand : COLORS.error;
        return COLORS.fadedText;
    };

    return (
        <Card sx={{
            bgcolor: COLORS.cardPrimary, borderRadius: 4,
            border: `1px solid ${COLORS.border}`, boxShadow: 'none',
            transition: 'all 0.25s', overflow: 'hidden',
            '&:hover': { border: `1px solid rgba(51,204,204,0.25)`, boxShadow: `0 4px 24px rgba(0,0,0,0.3)`, transform: 'translateY(-2px)' },
        }}>
            <Stack direction="row">
                {/* vote column */}
                <Box sx={{
                    width: 56, flexShrink: 0, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'flex-start', pt: 2, pb: 2,
                    bgcolor: 'rgba(0,0,0,0.15)', gap: 0.25,
                }}>
                    <IconButton size="small" onClick={() => onVote(post.id, 'up')}
                        sx={{ color: voteColor('up'), p: 0.5, borderRadius: 1.5, '&:hover': { color: COLORS.brand, bgcolor: 'rgba(51,204,204,0.1)' }, transition: 'all 0.2s' }}>
                        <ArrowUpwardIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                    <Typography variant="body2" fontWeight="bold" sx={{
                        color: post.user_vote === 'up' ? COLORS.brand : post.user_vote === 'down' ? COLORS.error : COLORS.subheadings,
                        fontSize: '0.8rem', lineHeight: 1,
                    }}>
                        {netVotes}
                    </Typography>
                    <IconButton size="small" onClick={() => onVote(post.id, 'down')}
                        sx={{ color: voteColor('down'), p: 0.5, borderRadius: 1.5, '&:hover': { color: COLORS.error, bgcolor: 'rgba(255,107,107,0.1)' }, transition: 'all 0.2s' }}>
                        <ArrowDownwardIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                </Box>

                {/* post content */}
                <Box sx={{ flex: 1, p: 2.5, minWidth: 0 }}>
                    {/* meta row */}
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5, flexWrap: 'wrap', gap: 0.5 }}>
                        <Avatar sx={{ width: 20, height: 20, bgcolor: tagColor, color: '#141627', fontSize: '0.55rem', fontWeight: 'bold' }}>
                            {post.author_initial || 'U'}
                        </Avatar>
                        <Typography variant="caption" fontWeight="bold" sx={{ color: COLORS.subheadings }}>
                            {post.author_name || 'Unknown'}
                        </Typography>
                        {post.place && post.place !== 'All' && (
                            <>
                                <Typography variant="caption" sx={{ color: COLORS.fadedText }}>•</Typography>
                                <Typography variant="caption" sx={{ color: tagColor }}>{post.place}</Typography>
                            </>
                        )}
                        <Typography variant="caption" sx={{ color: COLORS.fadedText }}>•</Typography>
                        <Typography variant="caption" sx={{ color: COLORS.fadedText }}>{timeAgo(post.created_at)}</Typography>
                        <Chip label={post.tag} size="small" sx={{
                            height: 18, fontSize: '0.65rem',
                            bgcolor: `${tagColor}20`, color: tagColor,
                            border: `1px solid ${tagColor}40`, '& .MuiChip-label': { px: 1 },
                        }} />
                    </Stack>

                    {/* title */}
                    <Typography variant="h6" fontWeight="bold" sx={{
                        color: COLORS.headings, mb: 1.5, fontSize: '1rem', lineHeight: 1.4,
                        cursor: 'pointer', '&:hover': { color: COLORS.brand }, transition: 'color 0.2s',
                    }}>
                        {post.title}
                    </Typography>

                    {/* image */}
                    {post.image_url && (
                        <Box sx={{ mb: 2, borderRadius: 3, overflow: 'hidden', maxHeight: 360, minHeight: 160, bgcolor: COLORS.cardSecondary }}>
                            <Box component="img" src={post.image_url} alt={post.title}
                                sx={{ width: '100%', height: '100%', maxHeight: 360, objectFit: 'cover', objectPosition: 'center', display: 'block' }} />
                        </Box>
                    )}

                    {/* body */}
                    {post.body && (
                        <Typography variant="body2" sx={{
                            color: COLORS.text, lineHeight: 1.7, mb: 2,
                            display: '-webkit-box', WebkitLineClamp: post.image_url ? 4 : 5,
                            WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>
                            {post.body}
                        </Typography>
                    )}

                    {/* actions */}
                    <Stack direction="row" spacing={0.5} alignItems="center">
                        <Button startIcon={<ChatBubbleOutlineIcon sx={{ fontSize: '14px !important' }} />} size="small"
                            sx={{ color: COLORS.fadedText, borderRadius: 2, fontSize: '0.75rem', px: 1.5, textTransform: 'none', '&:hover': { color: COLORS.subheadings, bgcolor: COLORS.cardSecondary } }}>
                            {post.comment_count || 0} comments
                        </Button>
                        <Button startIcon={<ShareIcon sx={{ fontSize: '14px !important' }} />} size="small"
                            sx={{ color: COLORS.fadedText, borderRadius: 2, fontSize: '0.75rem', px: 1.5, textTransform: 'none', '&:hover': { color: COLORS.subheadings, bgcolor: COLORS.cardSecondary } }}>
                            Share
                        </Button>
                        <Button
                            startIcon={post.saved ? <BookmarkIcon sx={{ fontSize: '14px !important', color: COLORS.brand }} /> : <BookmarkBorderIcon sx={{ fontSize: '14px !important' }} />}
                            size="small" onClick={() => onSave(post.id)}
                            sx={{ color: post.saved ? COLORS.brand : COLORS.fadedText, borderRadius: 2, fontSize: '0.75rem', px: 1.5, textTransform: 'none', '&:hover': { color: COLORS.brand, bgcolor: 'rgba(51,204,204,0.08)' } }}>
                            Save
                        </Button>
                        <IconButton size="small" sx={{ color: COLORS.fadedText, borderRadius: 2, '&:hover': { color: COLORS.subheadings, bgcolor: COLORS.cardSecondary } }}>
                            <MoreHorizIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Stack>
                </Box>
            </Stack>
        </Card>
    );
};


// ── Create Post Dialog ───────────────────────────────────────
const CreatePostDialog = ({ open, onClose, userName, onCreated }) => {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [tag, setTag] = useState('Experience');
    const [place, setPlace] = useState('All');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleClose = () => {
        setTitle(''); setBody(''); setTag('Experience'); setPlace('All'); setError('');
        onClose();
    };

    const handleSubmit = async () => {
        if (!title.trim()) return;
        setSubmitting(true);
        setError('');
        try {
            const userId = localStorage.getItem('userId');
            await axios.post(`http://127.0.0.1:8000/community/posts?user_id=${userId}`, {
                title: title.trim(),
                body: body.trim() || null,
                tag,
                place,
            });
            handleClose();
            if (onCreated) onCreated();
        } catch (err) {
            console.error('Failed to create post:', err);
            setError('Failed to create post. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const fieldSx = {
        '& .MuiOutlinedInput-root': {
            bgcolor: COLORS.cardSecondary, borderRadius: 2.5, color: COLORS.text,
            '& fieldset': { borderColor: 'transparent' },
            '&:hover fieldset': { borderColor: COLORS.brand },
            '&.Mui-focused fieldset': { borderColor: COLORS.brand },
        },
        '& .MuiInputLabel-root': { color: COLORS.fadedText },
        '& .MuiInputLabel-root.Mui-focused': { color: COLORS.brand },
        '& .MuiInputBase-input': { color: COLORS.text },
        '& .MuiInputBase-input::placeholder': { color: COLORS.fadedText, opacity: 1 },
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth
            PaperProps={{ sx: {
                bgcolor: COLORS.background, border: `1px solid ${COLORS.border}`, borderRadius: 4,
                boxShadow: `0 24px 64px rgba(0,0,0,0.7)`,
                backgroundImage: 'linear-gradient(135deg, rgba(51,204,204,0.04) 0%, transparent 60%)',
            }}}>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${COLORS.border}`, pb: 2 }}>
                <Typography fontWeight="bold" sx={{ color: COLORS.headings }}>Create Post</Typography>
                <IconButton onClick={handleClose} sx={{ color: COLORS.fadedText, borderRadius: 2, '&:hover': { color: COLORS.error, bgcolor: 'rgba(255,107,107,0.1)' } }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: 3 }}>
                <Stack spacing={2.5}>
                    {error && <Alert severity="error" sx={{ bgcolor: 'rgba(255,107,107,0.1)', color: COLORS.error }}>{error}</Alert>}

                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{ bgcolor: COLORS.brand, color: COLORS.background, width: 36, height: 36, fontWeight: 'bold', fontSize: '0.85rem' }}>
                            {userName?.[0]?.toUpperCase() || 'U'}
                        </Avatar>
                        <Typography variant="body2" sx={{ color: COLORS.subheadings }}>{userName || 'User'}</Typography>
                    </Stack>

                    {/* tag selector */}
                    <Box>
                        <Typography variant="caption" sx={{ color: COLORS.fadedText, mb: 1, display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Tag
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                            {TAG_OPTIONS.map((t) => (
                                <Chip key={t} label={t} size="small"
                                    onClick={() => setTag(t)}
                                    sx={{
                                        cursor: 'pointer',
                                        bgcolor: tag === t ? `${TAG_COLORS[t]}25` : 'transparent',
                                        color: tag === t ? TAG_COLORS[t] : COLORS.fadedText,
                                        border: `1px solid ${tag === t ? TAG_COLORS[t] : COLORS.border}`,
                                        fontWeight: tag === t ? 700 : 400,
                                        '&:hover': { bgcolor: `${TAG_COLORS[t]}15`, color: TAG_COLORS[t] },
                                        transition: 'all 0.2s',
                                    }}
                                />
                            ))}
                        </Stack>
                    </Box>

                    {/* place dropdown */}
                    <Box>
                        <Typography variant="caption" sx={{ color: COLORS.fadedText, mb: 1, display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Place
                        </Typography>
                        <Select value={place} onChange={(e) => setPlace(e.target.value)} size="small" fullWidth
                            sx={{
                                bgcolor: COLORS.cardSecondary, borderRadius: 2.5, color: COLORS.text,
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.brand },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.brand },
                                '& .MuiSelect-icon': { color: COLORS.fadedText },
                            }}
                            MenuProps={{ PaperProps: { sx: { bgcolor: COLORS.cardPrimary, border: `1px solid ${COLORS.border}` } } }}
                        >
                            {PLACE_OPTIONS.map((p) => (
                                <MenuItem key={p} value={p} sx={{ color: COLORS.text, '&:hover': { bgcolor: 'rgba(51,204,204,0.08)' }, '&.Mui-selected': { bgcolor: 'rgba(51,204,204,0.12)' } }}>
                                    {p}
                                </MenuItem>
                            ))}
                        </Select>
                    </Box>

                    <TextField fullWidth label="Title *" placeholder="What's on your mind?" value={title}
                        onChange={(e) => setTitle(e.target.value)} sx={fieldSx} />
                    <TextField fullWidth label="Body" placeholder="Share your story, tips, or questions..."
                        value={body} onChange={(e) => setBody(e.target.value)} multiline rows={5} sx={fieldSx} />

                    <Stack direction="row" spacing={1}>
                        <Button startIcon={<ImageIcon />} size="small"
                            sx={{ color: COLORS.fadedText, borderRadius: 2, textTransform: 'none', '&:hover': { color: COLORS.brand, bgcolor: 'rgba(51,204,204,0.08)' } }}>
                            Add Image
                        </Button>
                    </Stack>
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${COLORS.border}` }}>
                <Button onClick={handleClose} sx={{ color: COLORS.fadedText, borderRadius: 2, '&:hover': { bgcolor: COLORS.cardSecondary } }}>
                    Cancel
                </Button>
                <Button variant="contained" onClick={handleSubmit} disabled={!title.trim() || submitting}
                    sx={{
                        bgcolor: COLORS.brand, color: COLORS.background, fontWeight: 'bold', borderRadius: 2.5, px: 3,
                        '&:hover': { bgcolor: '#2db8b8', transform: 'translateY(-1px)', boxShadow: `0 4px 12px rgba(51,204,204,0.4)` },
                        '&:disabled': { bgcolor: COLORS.cardSecondary, color: COLORS.fadedText },
                        transition: 'all 0.25s',
                    }}>
                    {submitting ? <CircularProgress size={18} sx={{ color: COLORS.background }} /> : 'Post'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};


// ── Main Component ───────────────────────────────────────────
const CommunityFeed = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState({ id: null, name: 'User', initial: 'U' });
    const [posts, setPosts] = useState([]);
    const [activeSort, setActiveSort] = useState('new');
    const [activePlace, setActivePlace] = useState('All');
    const [activeTag, setActiveTag] = useState(null); // null = show all tags
    const [createOpen, setCreateOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userId = localStorage.getItem('userId');
        const userName = localStorage.getItem('userName');
        if (!userId) { navigate('/login'); return; }
        setUser({
            id: parseInt(userId),
            name: userName || 'User',
            initial: (userName || 'U')[0].toUpperCase(),
        });
    }, [navigate]);

    // fetch posts whenever sort, place, or tag filter changes
    const fetchPosts = useCallback(async () => {
        setLoading(true);
        try {
            const userId = localStorage.getItem('userId');
            const params = { sort: activeSort, user_id: userId };
            if (activePlace !== 'All') params.place = activePlace;
            if (activeTag) params.tag = activeTag;
            const res = await axios.get('http://127.0.0.1:8000/community/posts', { params });
            setPosts((res.data || []).map(p => ({ ...p, saved: false })));
        } catch (err) {
            console.error('Failed to fetch posts:', err);
        } finally {
            setLoading(false);
        }
    }, [activeSort, activePlace, activeTag]);

    useEffect(() => {
        if (user.id) fetchPosts();
    }, [user.id, fetchPosts]);

    const handleVote = async (postId, direction) => {
        const userId = localStorage.getItem('userId');
        // optimistic UI update
        setPosts(prev => prev.map(p => {
            if (p.id !== postId) return p;
            let up = p.upvotes, down = p.downvotes, newVote = direction;
            if (p.user_vote === direction) {
                // un-vote
                if (direction === 'up') up = Math.max(0, up - 1);
                else down = Math.max(0, down - 1);
                newVote = null;
            } else if (p.user_vote) {
                // switching
                if (p.user_vote === 'up') { up = Math.max(0, up - 1); down += 1; }
                else { down = Math.max(0, down - 1); up += 1; }
            } else {
                // new vote
                if (direction === 'up') up += 1;
                else down += 1;
            }
            return { ...p, upvotes: up, downvotes: down, user_vote: newVote };
        }));

        try {
            await axios.post(`http://127.0.0.1:8000/community/posts/${postId}/vote?user_id=${userId}`, { direction });
        } catch (err) {
            console.error('Vote failed:', err);
            fetchPosts(); // revert on error
        }
    };

    const handleSave = (postId) => {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, saved: !p.saved } : p));
    };

    const handleLogout = () => { localStorage.clear(); navigate('/'); };

    const sidebarMenu = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
        { text: 'My Itineraries', icon: <ExploreIcon />, path: '/itineraries' },
        { text: 'Interactive Map', icon: <MapIcon />, path: '/dashboard' },
        { text: 'Community Feed', icon: <GroupIcon />, path: '/community', active: true },
    ];

    return (
        <Box sx={{ display: 'flex', bgcolor: COLORS.background, minHeight: '100vh', width: '100vw', position: 'fixed', top: 0, left: 0, overflow: 'hidden' }}>
            {/* sidebar */}
            <Drawer variant="permanent" sx={{
                width: drawerWidth, flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: drawerWidth, boxSizing: 'border-box', bgcolor: COLORS.background,
                    borderRight: 'none', backgroundImage: 'linear-gradient(to bottom, rgba(51, 204, 204, 0.05), transparent)',
                },
            }}>
                <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Box component="span" sx={{ color: COLORS.brand, fontSize: '1.5rem' }}>✈</Box>
                        <Typography variant="h6" fontWeight="bold" sx={{ color: 'white', fontFamily: '"Exo 2", sans-serif', letterSpacing: 0.5 }}>
                            Smart <Box component="span" sx={{ color: COLORS.brand }}>Itinerary</Box>
                        </Typography>
                    </Stack>
                </Box>
                <List sx={{ px: 2, mt: 2, flexGrow: 1 }}>
                    {sidebarMenu.map((item) => (
                        <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                            <ListItemButton selected={item.active} onClick={() => navigate(item.path)} sx={{
                                borderRadius: 2,
                                color: item.active ? COLORS.background : COLORS.subheadings,
                                '&.Mui-selected': { bgcolor: COLORS.brand, color: COLORS.background, '&:hover': { bgcolor: '#2db8b8' } },
                                '&:hover': { bgcolor: COLORS.cardSecondary },
                            }}>
                                <ListItemIcon sx={{ color: item.active ? COLORS.background : COLORS.subheadings, minWidth: 40 }}>{item.icon}</ListItemIcon>
                                <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: item.active ? 'bold' : 'medium', fontSize: '0.9rem' }} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
                <Box sx={{ p: 2 }}>
                    <Button fullWidth startIcon={<LogoutIcon />} onClick={handleLogout}
                        sx={{ color: COLORS.fadedText, '&:hover': { color: '#ff6b6b', bgcolor: 'rgba(255,107,107,0.1)' } }}>
                        Logout
                    </Button>
                </Box>
            </Drawer>

            {/* main content */}
            <Box component="main" sx={{
                flexGrow: 1, height: '100vh', overflow: 'auto', display: 'flex', flexDirection: 'column',
                '&::-webkit-scrollbar': { width: 6 },
                '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
                '&::-webkit-scrollbar-thumb': { bgcolor: COLORS.cardSecondary, borderRadius: 3 },
            }}>
                {/* top bar */}
                <Box sx={{ px: 3, py: 2, flexShrink: 0 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box sx={{ width: 160 }} />
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1, maxWidth: 600 }}>
                            <TextField placeholder="Search posts..." variant="outlined" fullWidth sx={inputSx}
                                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: COLORS.fadedText }} /></InputAdornment> }} />
                            <Button variant="contained" sx={{
                                bgcolor: COLORS.brand, color: COLORS.background, fontWeight: 'bold', px: 4, py: 1.75,
                                borderRadius: 5, textTransform: 'uppercase', whiteSpace: 'nowrap',
                                '&:hover': { bgcolor: '#2db8b8', transform: 'translateY(-2px)', boxShadow: `0 4px 12px ${COLORS.brand}40` },
                                transition: 'all 0.3s',
                            }}>Search</Button>
                        </Stack>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <IconButton sx={{ bgcolor: COLORS.cardPrimary, color: COLORS.icons, borderRadius: 3, position: 'relative', '&:hover': { bgcolor: COLORS.cardSecondary } }}>
                                <NotificationsIcon />
                                <Box sx={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, bgcolor: '#ff6b6b', borderRadius: '50%' }} />
                            </IconButton>
                            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)} sx={{
                                bgcolor: COLORS.brand, color: COLORS.background, fontWeight: 'bold', borderRadius: 5, px: 3, py: 1.25,
                                textTransform: 'uppercase', '&:hover': { bgcolor: '#2db8b8', transform: 'translateY(-2px)', boxShadow: `0 4px 12px ${COLORS.brand}40` },
                                transition: 'all 0.3s',
                            }}>New Trip</Button>
                            <Avatar onClick={() => navigate('/profile')} sx={{ bgcolor: COLORS.brand, color: COLORS.background, fontWeight: 'bold', cursor: 'pointer', width: 44, height: 44 }}>
                                {user.initial}
                            </Avatar>
                        </Stack>
                    </Stack>
                </Box>

                {/* 3-column body */}
                <Box sx={{ flex: 1, px: 4, pb: 3, display: 'flex', gap: 3, minHeight: 0 }}>

                    {/* CENTER: posts feed */}
                    <Box sx={{ flex: 'none', width: 850, marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>

                        {/* filter bar */}
                        <Box sx={{
                            bgcolor: COLORS.cardPrimary, borderRadius: 3, border: `1px solid ${COLORS.border}`,
                            px: 1.5, py: 0.75, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 0.5,
                        }}>
                            {/* place dropdown */}
                            <Select value={activePlace} onChange={(e) => setActivePlace(e.target.value)} size="small"
                                sx={{
                                    color: COLORS.headings, fontWeight: 'bold', borderRadius: 2,
                                    bgcolor: COLORS.cardSecondary, fontSize: '0.82rem', minWidth: 100,
                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
                                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.brand },
                                    '& .MuiSelect-icon': { color: COLORS.fadedText },
                                    '& .MuiSelect-select': { py: 0.6, px: 1.5 },
                                }}
                                MenuProps={{ PaperProps: { sx: { bgcolor: COLORS.cardPrimary, border: `1px solid ${COLORS.border}` } } }}
                            >
                                {PLACE_OPTIONS.map((p) => (
                                    <MenuItem key={p} value={p} sx={{ color: COLORS.text, fontSize: '0.85rem', '&:hover': { bgcolor: 'rgba(51,204,204,0.08)' }, '&.Mui-selected': { bgcolor: 'rgba(51,204,204,0.12)' } }}>
                                        {p}
                                    </MenuItem>
                                ))}
                            </Select>

                            <Box sx={{ width: '1px', height: 18, bgcolor: COLORS.border, mx: 0.5, flexShrink: 0 }} />

                            {/* sort buttons */}
                            {FILTER_OPTIONS.map((f) => (
                                <Button key={f.label}
                                    startIcon={React.cloneElement(f.icon, { sx: { fontSize: '13px !important' } })}
                                    size="small" onClick={() => setActiveSort(f.sort)}
                                    sx={{
                                        flex: 1,
                                        color: activeSort === f.sort ? COLORS.brand : COLORS.fadedText,
                                        fontWeight: activeSort === f.sort ? 'bold' : 'normal',
                                        borderRadius: 2, bgcolor: activeSort === f.sort ? 'rgba(51,204,204,0.1)' : 'transparent',
                                        py: 0.5, textTransform: 'none', fontSize: '0.8rem', whiteSpace: 'nowrap',
                                        '& .MuiButton-startIcon': { mr: 0.5 },
                                        '&:hover': { color: COLORS.brand, bgcolor: 'rgba(51,204,204,0.08)' },
                                        transition: 'all 0.2s',
                                    }}
                                >{f.label}</Button>
                            ))}

                            <Box sx={{ width: '1px', height: 18, bgcolor: COLORS.border, mx: 0.5, flexShrink: 0 }} />

                            {/* tag filter chips */}
                            {TAG_OPTIONS.map((t) => (
                                <Chip key={t} label={t} size="small"
                                    onClick={() => setActiveTag(activeTag === t ? null : t)}
                                    sx={{
                                        cursor: 'pointer', height: 24, fontSize: '0.72rem',
                                        bgcolor: activeTag === t ? `${TAG_COLORS[t]}20` : 'transparent',
                                        color: activeTag === t ? TAG_COLORS[t] : COLORS.fadedText,
                                        border: `1px solid ${activeTag === t ? TAG_COLORS[t] : 'transparent'}`,
                                        '&:hover': { bgcolor: `${TAG_COLORS[t]}15`, color: TAG_COLORS[t] },
                                        transition: 'all 0.2s',
                                    }}
                                />
                            ))}
                        </Box>

                        {/* posts */}
                        <Box sx={{
                            flex: 1, overflowY: 'auto', pr: 0.5,
                            '&::-webkit-scrollbar': { width: 4 },
                            '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
                            '&::-webkit-scrollbar-thumb': { bgcolor: COLORS.cardSecondary, borderRadius: 2 },
                        }}>
                            {loading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}>
                                    <CircularProgress sx={{ color: COLORS.brand }} />
                                </Box>
                            ) : (
                                <Stack spacing={2.5}>
                                    {/* inline create prompt */}
                                    <Card sx={{ bgcolor: COLORS.cardPrimary, borderRadius: 4, border: `1px solid ${COLORS.border}`, boxShadow: 'none' }}>
                                        <CardContent>
                                            <Stack direction="row" spacing={1.5} alignItems="center">
                                                <Avatar sx={{ bgcolor: COLORS.brand, color: COLORS.background, fontWeight: 'bold', width: 36, height: 36, fontSize: '0.85rem', flexShrink: 0 }}>
                                                    {user.initial}
                                                </Avatar>
                                                <Box onClick={() => setCreateOpen(true)} sx={{
                                                    flex: 1, bgcolor: COLORS.cardSecondary, borderRadius: 2.5, px: 2, py: 1.25,
                                                    cursor: 'text', border: `1px solid transparent`, transition: 'all 0.2s',
                                                    '&:hover': { bgcolor: 'rgba(51,204,204,0.06)', border: `1px solid rgba(51,204,204,0.2)` },
                                                }}>
                                                    <Typography variant="body2" sx={{ color: COLORS.fadedText }}>
                                                        Share your Nepal travel experience...
                                                    </Typography>
                                                </Box>
                                                <IconButton onClick={() => setCreateOpen(true)} sx={{ color: COLORS.fadedText, borderRadius: 2, '&:hover': { color: COLORS.brand, bgcolor: 'rgba(51,204,204,0.08)' } }}>
                                                    <ImageIcon />
                                                </IconButton>
                                                <IconButton onClick={() => setCreateOpen(true)} sx={{ color: COLORS.fadedText, borderRadius: 2, '&:hover': { color: COLORS.brand, bgcolor: 'rgba(51,204,204,0.08)' } }}>
                                                    <EditNoteIcon />
                                                </IconButton>
                                            </Stack>
                                        </CardContent>
                                    </Card>

                                    {posts.length === 0 && !loading && (
                                        <Box sx={{ textAlign: 'center', py: 6 }}>
                                            <Typography sx={{ color: COLORS.fadedText, mb: 1 }}>No posts yet</Typography>
                                            <Typography variant="body2" sx={{ color: COLORS.fadedText }}>
                                                Be the first to share something with the community!
                                            </Typography>
                                        </Box>
                                    )}

                                    {posts.map((post) => (
                                        <PostCard key={post.id} post={post} onVote={handleVote} onSave={handleSave} />
                                    ))}
                                </Stack>
                            )}
                        </Box>
                    </Box>

                    {/* RIGHT sidebar */}
                    <Box sx={{
                        width: 300, flexShrink: 0, marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: 2,
                        overflowY: 'auto',
                        '&::-webkit-scrollbar': { width: 4 },
                        '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
                        '&::-webkit-scrollbar-thumb': { bgcolor: COLORS.cardSecondary, borderRadius: 2 },
                    }}>
                        {/* user greeting */}
                        <Card sx={{ bgcolor: COLORS.cardPrimary, border: `1px solid ${COLORS.border}`, borderRadius: 4, boxShadow: 'none', overflow: 'hidden' }}>
                            <Box sx={{ height: 50, background: `linear-gradient(135deg, ${COLORS.brand}33, rgba(51,204,204,0.05))`, borderBottom: `1px solid ${COLORS.border}` }} />
                            <CardContent sx={{ pt: 1, pb: 2.5 }}>
                                <Avatar sx={{ bgcolor: COLORS.brand, color: COLORS.background, fontWeight: 'bold', width: 40, height: 40, mt: -3.5, mb: 1.5, border: `3px solid ${COLORS.cardPrimary}` }}>
                                    {user.initial}
                                </Avatar>
                                <Typography variant="subtitle2" fontWeight="bold" sx={{ color: COLORS.headings, mb: 0.25 }}>
                                    Hello {user.name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: COLORS.fadedText, lineHeight: 1.5, display: 'block', mb: 2, fontSize: '0.75rem' }}>
                                    Welcome to the community. Share your experience, events or alerts.
                                </Typography>
                                <Button fullWidth variant="contained" onClick={() => setCreateOpen(true)} sx={{
                                    bgcolor: COLORS.brand, color: COLORS.background, fontWeight: 'bold', borderRadius: 2.5,
                                    textTransform: 'none', fontSize: '0.82rem',
                                    '&:hover': { bgcolor: '#2db8b8', transform: 'translateY(-1px)', boxShadow: `0 4px 12px rgba(51,204,204,0.4)` },
                                    transition: 'all 0.25s',
                                }}>Create Post</Button>
                            </CardContent>
                        </Card>

                        {/* places */}
                        <Card sx={{ bgcolor: COLORS.cardPrimary, border: `1px solid ${COLORS.border}`, borderRadius: 4, boxShadow: 'none' }}>
                            <CardContent sx={{ pb: '12px !important' }}>
                                <Typography variant="caption" fontWeight="bold" sx={{ color: COLORS.fadedText, textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 1.5 }}>
                                    Places
                                </Typography>
                                <Stack spacing={0.5}>
                                    {PLACE_OPTIONS.map((p) => (
                                        <Stack key={p} direction="row" justifyContent="space-between" alignItems="center"
                                            onClick={() => setActivePlace(p)}
                                            sx={{
                                                cursor: 'pointer', borderRadius: 2, px: 1, py: 0.75,
                                                bgcolor: activePlace === p ? 'rgba(51,204,204,0.08)' : 'transparent',
                                                '&:hover': { bgcolor: COLORS.cardSecondary }, transition: 'all 0.2s',
                                            }}>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: activePlace === p ? COLORS.brand : COLORS.fadedText, flexShrink: 0 }} />
                                                <Typography variant="caption" sx={{ color: activePlace === p ? COLORS.brand : COLORS.text, fontSize: '0.78rem', fontWeight: activePlace === p ? 700 : 400 }}>
                                                    {p}
                                                </Typography>
                                            </Stack>
                                        </Stack>
                                    ))}
                                </Stack>
                            </CardContent>
                        </Card>

                        {/* about */}
                        <Card sx={{ bgcolor: COLORS.cardPrimary, border: `1px solid ${COLORS.border}`, borderRadius: 4, boxShadow: 'none' }}>
                            <Box sx={{ height: 80, background: `linear-gradient(135deg, rgba(51,204,204,0.2), rgba(20,22,39,0))`, borderRadius: '16px 16px 0 0', position: 'relative', overflow: 'hidden' }}>
                                <Box component="img"
                                    src="https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=400&auto=format&fit=crop"
                                    sx={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35 }} />
                            </Box>
                            <CardContent>
                                <Typography variant="subtitle2" fontWeight="bold" sx={{ color: COLORS.headings, mb: 1 }}>
                                    About Community
                                </Typography>
                                <Typography variant="caption" sx={{ color: COLORS.fadedText, lineHeight: 1.6, display: 'block', fontSize: '0.78rem' }}>
                                    Share your Nepal travel stories, tips, alerts, and connect with fellow adventurers. Help others plan the perfect trip.
                                </Typography>
                            </CardContent>
                        </Card>

                        {/* report */}
                        <Button startIcon={<WarningAmberIcon />} fullWidth sx={{
                            color: COLORS.warning, bgcolor: 'rgba(255,183,77,0.08)', borderRadius: 3,
                            border: `1px dashed rgba(255,183,77,0.3)`, textTransform: 'none', fontWeight: 'bold', py: 1.25,
                            '&:hover': { bgcolor: 'rgba(255,183,77,0.14)', borderColor: COLORS.warning },
                            transition: 'all 0.2s',
                        }}>
                            Report Road / Trail Alert
                        </Button>
                    </Box>
                </Box>
            </Box>

            {/* create post dialog */}
            <CreatePostDialog open={createOpen} onClose={() => setCreateOpen(false)} userName={user.name} onCreated={fetchPosts} />
        </Box>
    );
};

export default CommunityFeed;