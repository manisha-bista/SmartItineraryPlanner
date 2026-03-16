import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Stack, Avatar, Chip, IconButton, Button, TextField,
    InputAdornment, Card, CardContent, Drawer, List, ListItem, ListItemButton,
    ListItemIcon, ListItemText, Dialog, DialogTitle, DialogContent, DialogActions,
    CircularProgress, Select, MenuItem, Alert, Divider, ListSubheader,
    Collapse, Menu,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PlaceSearchAutocomplete from '../components/PlaceSearchAutocomplete';

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
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SendIcon from '@mui/icons-material/Send';

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

const KNOWN_CITIES = ['Kathmandu', 'Pokhara', 'Bhaktapur', 'Lalitpur', 'Patan', 'Chitwan', 'Lumbini', 'Mustang', 'Annapurna', 'Everest', 'Namche', 'Nagarkot', 'Bandipur', 'Janakpur', 'Boudha', 'Thamel', 'Kirtipur', 'Dhulikhel', 'Lukla', 'Jomsom', 'Gorkha', 'Tansen', 'Bardiya', 'Langtang', 'Manang', 'Dolpa'];

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
    if (!dateStr) return '';
    const now = new Date();
    // backend stores UTC but may not include 'Z' — force UTC interpretation
    const utcStr = dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z';
    const then = new Date(utcStr);
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
const PostCard = ({ post, onVote, onSave, userId }) => {
    const tagColor = TAG_COLORS[post.tag] || COLORS.brand;
    const netVotes = (post.upvotes || 0) - (post.downvotes || 0);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [posting, setPosting] = useState(false);

    const voteColor = (dir) => {
        if (post.user_vote === dir) return dir === 'up' ? COLORS.brand : COLORS.error;
        return COLORS.fadedText;
    };

    const loadComments = async () => {
        setCommentsLoading(true);
        try {
            const res = await axios.get(`http://127.0.0.1:8000/community/posts/${post.id}/comments`);
            setComments(res.data || []);
        } catch { /* silent */ }
        finally { setCommentsLoading(false); }
    };

    const toggleComments = () => {
        if (!showComments) loadComments();
        setShowComments(!showComments);
    };

    const submitComment = async () => {
        if (!newComment.trim()) return;
        setPosting(true);
        try {
            await axios.post(`http://127.0.0.1:8000/community/posts/${post.id}/comments?user_id=${userId}`, { content: newComment.trim() });
            setNewComment('');
            loadComments();
        } catch { /* silent */ }
        finally { setPosting(false); }
    };

    return (
        <Card sx={{
            bgcolor: COLORS.cardPrimary, borderRadius: 4,
            border: `1px solid ${COLORS.border}`, boxShadow: 'none',
            transition: 'all 0.25s', overflow: 'hidden',
            '&:hover': { border: `1px solid rgba(51,204,204,0.25)`, boxShadow: `0 4px 24px rgba(0,0,0,0.3)` },
        }}>
            <Stack direction="row">
                {/* vote column */}
                <Box sx={{
                    width: 56, flexShrink: 0, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'flex-start', pt: 2, pb: 2,
                    bgcolor: 'rgba(0,0,0,0.15)', gap: 0.25,
                }}>
                    <IconButton size="small" onClick={() => onVote(post.id, 'up')}
                        sx={{ color: voteColor('up'), p: 0.5, borderRadius: 1.5, '&:hover': { color: COLORS.brand, bgcolor: 'rgba(51,204,204,0.1)' } }}>
                        <ArrowUpwardIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                    <Typography variant="body2" fontWeight="bold" sx={{
                        color: post.user_vote === 'up' ? COLORS.brand : post.user_vote === 'down' ? COLORS.error : COLORS.subheadings,
                        fontSize: '0.8rem', lineHeight: 1,
                    }}>
                        {netVotes}
                    </Typography>
                    <IconButton size="small" onClick={() => onVote(post.id, 'down')}
                        sx={{ color: voteColor('down'), p: 0.5, borderRadius: 1.5, '&:hover': { color: COLORS.error, bgcolor: 'rgba(255,107,107,0.1)' } }}>
                        <ArrowDownwardIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                </Box>

                {/* post content */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ p: 2.5 }}>
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

                        <Typography variant="h6" fontWeight="bold" sx={{ color: COLORS.headings, mb: 1.5, fontSize: '1rem', lineHeight: 1.4 }}>
                            {post.title}
                        </Typography>

                        {post.image_url && (
                            <Box sx={{ mb: 2, borderRadius: 3, overflow: 'hidden', maxHeight: 360, minHeight: 160, bgcolor: COLORS.cardSecondary }}>
                                <Box component="img" src={post.image_url} alt={post.title}
                                    sx={{ width: '100%', height: '100%', maxHeight: 360, objectFit: 'cover', display: 'block' }} />
                            </Box>
                        )}

                        {post.body && (
                            <Typography variant="body2" sx={{
                                color: COLORS.text, lineHeight: 1.7, mb: 2,
                                display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                            }}>
                                {post.body}
                            </Typography>
                        )}

                        {/* actions */}
                        <Stack direction="row" spacing={0.5} alignItems="center">
                            <Button startIcon={<ChatBubbleOutlineIcon sx={{ fontSize: '14px !important' }} />} size="small"
                                onClick={toggleComments}
                                sx={{ color: showComments ? COLORS.brand : COLORS.fadedText, borderRadius: 2, fontSize: '0.75rem', px: 1.5, textTransform: 'none', '&:hover': { color: COLORS.brand, bgcolor: 'rgba(51,204,204,0.08)' } }}>
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
                        </Stack>
                    </Box>

                    {/* comments section */}
                    <Collapse in={showComments}>
                        <Box sx={{ px: 2.5, pb: 2, borderTop: `1px solid ${COLORS.border}` }}>
                            {/* comment input */}
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5, mb: 1.5 }}>
                                <TextField
                                    fullWidth size="small" placeholder="Write a comment..."
                                    value={newComment} onChange={(e) => setNewComment(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': { bgcolor: COLORS.cardSecondary, borderRadius: 2, color: COLORS.text, '& fieldset': { borderColor: 'transparent' }, '&:hover fieldset': { borderColor: COLORS.brand }, '&.Mui-focused fieldset': { borderColor: COLORS.brand } },
                                        '& .MuiInputBase-input': { py: '8px', fontSize: '0.82rem' },
                                        '& .MuiInputBase-input::placeholder': { color: COLORS.fadedText, opacity: 1 },
                                    }}
                                />
                                <IconButton size="small" onClick={submitComment} disabled={!newComment.trim() || posting}
                                    sx={{ color: COLORS.brand, '&:disabled': { color: COLORS.fadedText } }}>
                                    {posting ? <CircularProgress size={16} sx={{ color: COLORS.brand }} /> : <SendIcon sx={{ fontSize: 18 }} />}
                                </IconButton>
                            </Stack>

                            {/* comments list */}
                            {commentsLoading ? (
                                <Box sx={{ py: 2, textAlign: 'center' }}><CircularProgress size={18} sx={{ color: COLORS.brand }} /></Box>
                            ) : comments.length === 0 ? (
                                <Typography variant="caption" sx={{ color: COLORS.fadedText, fontStyle: 'italic' }}>No comments yet</Typography>
                            ) : (
                                <Stack spacing={1}>
                                    {comments.map(c => (
                                        <Stack key={c.id} direction="row" spacing={1} sx={{ py: 0.5 }}>
                                            <Avatar sx={{ width: 22, height: 22, bgcolor: COLORS.brand, color: COLORS.background, fontSize: '0.6rem', fontWeight: 'bold', mt: 0.2 }}>
                                                {c.author_initial || 'U'}
                                            </Avatar>
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Stack direction="row" spacing={0.8} alignItems="center">
                                                    <Typography variant="caption" fontWeight="bold" sx={{ color: COLORS.subheadings }}>{c.author_name || 'User'}</Typography>
                                                    <Typography variant="caption" sx={{ color: COLORS.fadedText, fontSize: '0.65rem' }}>{timeAgo(c.created_at)}</Typography>
                                                </Stack>
                                                <Typography variant="body2" sx={{ color: COLORS.text, fontSize: '0.82rem', lineHeight: 1.5 }}>{c.content}</Typography>
                                            </Box>
                                        </Stack>
                                    ))}
                                </Stack>
                            )}
                        </Box>
                    </Collapse>
                </Box>
            </Stack>
        </Card>
    );
};


// ── Create Post Dialog ───────────────────────────────────────
const CreatePostDialog = ({ open, onClose, userName, onCreated, myItineraries, defaultTag }) => {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [tag, setTag] = useState('Experience');
    const [places, setPlaces] = useState([]);
    const [imageUrl, setImageUrl] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // apply defaultTag when dialog opens
    useEffect(() => {
        if (open && defaultTag) setTag(defaultTag);
    }, [open, defaultTag]);

    const handleClose = () => {
        setTitle(''); setBody(''); setTag('Experience'); setPlaces([]); setImageUrl(''); setError('');
        onClose();
    };

    const handleSubmit = async () => {
        if (!title.trim() || places.length === 0) return;
        setSubmitting(true);
        setError('');
        try {
            const userId = localStorage.getItem('userId');
            await axios.post(`http://127.0.0.1:8000/community/posts?user_id=${userId}`, {
                title: title.trim(),
                body: body.trim() || null,
                tag,
                place: places.join(', '),
                image_url: imageUrl.trim() || null,
            });
            handleClose();
            if (onCreated) onCreated();
        } catch (err) {
            setError('Failed to create post. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const addPlace = (name) => {
        if (name && !places.includes(name)) setPlaces(prev => [...prev, name]);
    };
    const removePlace = (name) => setPlaces(prev => prev.filter(p => p !== name));

    // gather all mapped places from itineraries for the dropdown
    const itinPlaces = {};
    (myItineraries || []).forEach(itin => {
        const places = [];
        (itin.days || []).forEach(day => {
            (day.activities || []).forEach(act => {
                if (act.place_id && act.location && !places.includes(act.location)) places.push(act.location);
            });
        });
        if (places.length > 0) itinPlaces[itin.title] = places;
    });

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
                                    }}
                                />
                            ))}
                        </Stack>
                    </Box>

                    {/* place selector — search + itinerary dropdown side by side */}
                    <Box>
                        <Typography variant="caption" sx={{ color: COLORS.fadedText, mb: 1, display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Place (at least one)
                        </Typography>

                        {/* selected places as chips */}
                        {places.length > 0 && (
                            <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5} sx={{ mb: 1.5 }}>
                                {places.map(p => (
                                    <Chip
                                        key={p}
                                        label={p}
                                        size="small"
                                        onDelete={() => removePlace(p)}
                                        sx={{
                                            bgcolor: 'rgba(51,204,204,0.12)',
                                            color: COLORS.brand,
                                            border: '1px solid rgba(51,204,204,0.3)',
                                            fontSize: '0.72rem',
                                            fontWeight: 600,
                                            '& .MuiChip-deleteIcon': { color: 'rgba(51,204,204,0.5)', fontSize: 14, '&:hover': { color: COLORS.error } },
                                        }}
                                    />
                                ))}
                            </Stack>
                        )}

                        <Stack direction="row" spacing={1.5} alignItems="flex-start">
                            {/* compact place search */}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <PlaceSearchAutocomplete
                                    label="Search place"
                                    value=""
                                    onChange={() => {}}
                                    onSelect={(p) => addPlace(p.name)}
                                    inputSx={{
                                        '& .MuiOutlinedInput-root': { py: 0, height: 38, bgcolor: COLORS.cardSecondary, borderRadius: 2.5 },
                                        '& .MuiInputBase-input': { py: '7px', fontSize: '0.82rem' },
                                        '& .MuiInputLabel-root': { fontSize: '0.82rem', transform: 'translate(14px, 8px) scale(1)' },
                                        '& .MuiInputLabel-root.Mui-focused, & .MuiInputLabel-root.MuiFormLabel-filled': { transform: 'translate(14px, -9px) scale(0.75)' },
                                    }}
                                />
                            </Box>

                            <Typography variant="caption" sx={{ color: COLORS.fadedText, pt: 1, flexShrink: 0 }}>or</Typography>

                            {/* itinerary places dropdown */}
                            <Select
                                value=""
                                onChange={(e) => { if (e.target.value) addPlace(e.target.value); }}
                                size="small"
                                displayEmpty
                                renderValue={() => <span style={{ color: COLORS.fadedText, fontSize: '0.78rem' }}>From itinerary</span>}
                                sx={{
                                    flex: 1, minWidth: 0, height: 38,
                                    bgcolor: COLORS.cardSecondary, borderRadius: 2.5, color: COLORS.text, fontSize: '0.82rem',
                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
                                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.brand },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.brand },
                                    '& .MuiSelect-icon': { color: COLORS.fadedText },
                                    '& .MuiSelect-select': { py: '8.5px', px: 1.5 },
                                }}
                                MenuProps={{ PaperProps: { sx: { bgcolor: COLORS.cardPrimary, border: `1px solid ${COLORS.border}`, maxHeight: 280 } } }}
                            >
                                {Object.entries(itinPlaces).length === 0 ? (
                                    <MenuItem disabled sx={{ color: COLORS.fadedText, fontSize: '0.8rem' }}>No mapped places yet</MenuItem>
                                ) : (
                                    Object.entries(itinPlaces).map(([itinTitle, placeList]) => [
                                        <ListSubheader key={`h-${itinTitle}`} sx={{ bgcolor: COLORS.cardPrimary, color: COLORS.brand, fontSize: '0.7rem', fontWeight: 700, lineHeight: '26px' }}>
                                            {itinTitle}
                                        </ListSubheader>,
                                        ...placeList.map(p => (
                                            <MenuItem key={`${itinTitle}-${p}`} value={p} disabled={places.includes(p)}
                                                sx={{ color: places.includes(p) ? COLORS.fadedText : COLORS.text, fontSize: '0.8rem', pl: 3, '&:hover': { bgcolor: 'rgba(51,204,204,0.08)' } }}>
                                                <LocationOnIcon sx={{ fontSize: 12, color: COLORS.fadedText, mr: 0.8 }} />{p}
                                                {places.includes(p) && <Typography sx={{ ml: 'auto', color: COLORS.brand, fontSize: '0.65rem' }}>added</Typography>}
                                            </MenuItem>
                                        ))
                                    ]).flat()
                                )}
                            </Select>
                        </Stack>
                    </Box>

                    <TextField fullWidth label="Title *" placeholder="What's on your mind?" value={title}
                        onChange={(e) => setTitle(e.target.value)} sx={fieldSx} />
                    <TextField fullWidth label="Body" placeholder="Share your story, tips, or questions..."
                        value={body} onChange={(e) => setBody(e.target.value)} multiline rows={5} sx={fieldSx} />

                    {/* image url */}
                    <Box>
                        <TextField
                            fullWidth
                            label="Image URL (optional)"
                            placeholder="Paste an image link — unsplash, imgur, etc."
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            size="small"
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><ImageIcon sx={{ color: COLORS.fadedText, fontSize: 18 }} /></InputAdornment>,
                            }}
                            sx={fieldSx}
                        />
                        {imageUrl.trim() && (
                            <Box sx={{ mt: 1, borderRadius: 2, overflow: 'hidden', maxHeight: 120, bgcolor: COLORS.cardSecondary, border: `1px solid ${COLORS.border}` }}>
                                <Box
                                    component="img"
                                    src={imageUrl.trim()}
                                    alt="Preview"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                    sx={{ width: '100%', maxHeight: 120, objectFit: 'cover', display: 'block' }}
                                />
                            </Box>
                        )}
                    </Box>
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${COLORS.border}` }}>
                <Button onClick={handleClose} sx={{ color: COLORS.fadedText, borderRadius: 2, '&:hover': { bgcolor: COLORS.cardSecondary } }}>
                    Cancel
                </Button>
                <Button variant="contained" onClick={handleSubmit} disabled={!title.trim() || places.length === 0 || submitting}
                    sx={{
                        bgcolor: COLORS.brand, color: COLORS.background, fontWeight: 'bold', borderRadius: 2.5, px: 3,
                        '&:hover': { bgcolor: '#2db8b8' },
                        '&:disabled': { bgcolor: COLORS.cardSecondary, color: COLORS.fadedText },
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
    const [activeTag, setActiveTag] = useState(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    // filter state: 'all' | itinerary id (number) | '__search__' (place search mode) | place name string
    const [filterMode, setFilterMode] = useState('all');
    const [searchedPlace, setSearchedPlace] = useState('');

    // itinerary data
    const [myItineraries, setMyItineraries] = useState([]);

    // recent alerts for sidebar
    const [recentAlerts, setRecentAlerts] = useState([]);

    // notifications
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifAnchor, setNotifAnchor] = useState(null);

    // pre-selected tag when opening create dialog (null = default Experience)
    const [defaultTag, setDefaultTag] = useState(null);

    // sidebar place filter (within selected itinerary)
    const [sidebarPlace, setSidebarPlace] = useState('All');

    useEffect(() => {
        const userId = localStorage.getItem('userId');
        const userName = localStorage.getItem('userName');
        const username = localStorage.getItem('username');
        const avatarId = parseInt(localStorage.getItem('avatarId')) || 1;
        if (!userId) { navigate('/login'); return; }
        const displayName = username || userName || 'User';
        setUser({ id: parseInt(userId), name: displayName, initial: displayName[0].toUpperCase(), avatarId });
        fetchMyItineraries(userId);
        fetchNotifications(userId);
    }, [navigate]);

    const fetchNotifications = async (uid) => {
        const id = uid || user.id || localStorage.getItem('userId');
        if (!id) return;
        try {
            const [notifRes, countRes] = await Promise.all([
                axios.get(`http://127.0.0.1:8000/notifications/${id}`, { params: { limit: 15 } }),
                axios.get(`http://127.0.0.1:8000/notifications/${id}/unread-count`),
            ]);
            setNotifications(notifRes.data || []);
            setUnreadCount(countRes.data?.count || 0);
        } catch { /* silent */ }
    };

    // poll notifications every 30 seconds
    useEffect(() => {
        if (!user.id) return;
        const interval = setInterval(() => fetchNotifications(), 30000);
        return () => clearInterval(interval);
    }, [user.id]);

    const markAllRead = async () => {
        try {
            await axios.patch(`http://127.0.0.1:8000/notifications/${user.id}/read-all`);
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch { /* silent */ }
    };

    const fetchMyItineraries = async (userId) => {
        try {
            const res = await axios.get(`http://127.0.0.1:8000/itineraries/user/${userId}`);
            const itins = Array.isArray(res.data) ? res.data : [];
            // fetch full detail for each to get activities
            const detailed = [];
            for (const itin of itins) {
                try {
                    const d = await axios.get(`http://127.0.0.1:8000/itineraries/${itin.id}`);
                    detailed.push(d.data);
                } catch { detailed.push(itin); }
            }
            setMyItineraries(detailed);
        } catch { setMyItineraries([]); }
    };

    // fetch recent alerts based on current filter context
    const fetchAlerts = useCallback(async () => {
        try {
            const places = [];
            if (typeof filterMode === 'number') {
                const itin = myItineraries.find(i => i.id === filterMode);
                if (itin) {
                    (itin.days || []).forEach(day => {
                        (day.activities || []).forEach(act => {
                            if (act.location) places.push(act.location);
                            if (act.formatted_address) {
                                KNOWN_CITIES.forEach(c => { if (act.formatted_address.toLowerCase().includes(c.toLowerCase())) places.push(c); });
                            }
                        });
                    });
                }
            } else if (typeof filterMode === 'string' && filterMode !== 'all') {
                places.push(filterMode);
            } else if (sidebarPlace !== 'All') {
                places.push(sidebarPlace);
            }

            if (places.length === 0) {
                // fetch latest 5 alerts globally
                const res = await axios.get('http://127.0.0.1:8000/community-updates', { params: { active_only: true, limit: 5 } });
                setRecentAlerts(res.data || []);
            } else {
                const allAlerts = [];
                const seen = new Set();
                for (const loc of [...new Set(places)].slice(0, 5)) {
                    try {
                        const res = await axios.get('http://127.0.0.1:8000/community-updates', { params: { location: loc, active_only: true, limit: 3 } });
                        (res.data || []).forEach(a => { if (!seen.has(a.id)) { seen.add(a.id); allAlerts.push(a); } });
                    } catch { /* skip */ }
                }
                setRecentAlerts(allAlerts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5));
            }
        } catch { setRecentAlerts([]); }
    }, [filterMode, sidebarPlace, myItineraries]);

    useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

    // derive the active place filter for API call
    const getPlaceFilter = useCallback(() => {
        if (filterMode === 'all') return sidebarPlace === 'All' ? null : sidebarPlace;
        if (typeof filterMode === 'string' && filterMode !== '__search__' && filterMode !== 'all') return filterMode; // searched place
        if (filterMode === '__search__' && searchedPlace) return searchedPlace;
        if (typeof filterMode === 'number') {
            // itinerary selected — filter by sidebar place or all itinerary places
            if (sidebarPlace !== 'All') return sidebarPlace;
            return null; // fetch all, filter client-side
        }
        return null;
    }, [filterMode, sidebarPlace, searchedPlace]);

    // get cities for the right sidebar based on current filter
    const sidebarCities = (() => {
        if (filterMode === 'all') {
            // show all cities from all itineraries
            const cityMap = {};
            myItineraries.forEach(itin => {
                (itin.days || []).forEach(day => {
                    (day.activities || []).forEach(act => {
                        if (act.place_id && act.location) {
                            const text = `${act.location} ${act.formatted_address || ''}`.toLowerCase();
                            const matched = KNOWN_CITIES.find(c => text.includes(c.toLowerCase()));
                            if (matched) { cityMap[matched] = (cityMap[matched] || 0) + 1; }
                        }
                    });
                });
            });
            return Object.entries(cityMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
        }
        if (typeof filterMode === 'number') {
            // specific itinerary selected
            const itin = myItineraries.find(i => i.id === filterMode);
            if (!itin) return [];
            const cityMap = {};
            (itin.days || []).forEach(day => {
                (day.activities || []).forEach(act => {
                    if (act.place_id && act.location) {
                        const text = `${act.location} ${act.formatted_address || ''}`.toLowerCase();
                        const matched = KNOWN_CITIES.find(c => text.includes(c.toLowerCase()));
                        if (matched) { cityMap[matched] = (cityMap[matched] || 0) + 1; }
                    }
                });
            });
            return Object.entries(cityMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
        }
        // searched place — show just that place
        if (searchedPlace) return [{ name: searchedPlace, count: 0 }];
        return [];
    })();

    // get all itinerary place names for client-side filtering
    const getItinPlaceNames = useCallback(() => {
        if (typeof filterMode !== 'number') return [];
        const itin = myItineraries.find(i => i.id === filterMode);
        if (!itin) return [];
        const names = [];
        (itin.days || []).forEach(day => {
            (day.activities || []).forEach(act => {
                if (act.location) names.push(act.location.toLowerCase());
                if (act.formatted_address) {
                    KNOWN_CITIES.forEach(c => { if (act.formatted_address.toLowerCase().includes(c.toLowerCase())) names.push(c.toLowerCase()); });
                }
            });
        });
        return [...new Set(names)];
    }, [filterMode, myItineraries]);

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        try {
            const userId = localStorage.getItem('userId');
            const params = { sort: activeSort, user_id: userId };
            const placeFilter = getPlaceFilter();
            if (placeFilter) params.place = placeFilter;
            if (activeTag) params.tag = activeTag;

            const res = await axios.get('http://127.0.0.1:8000/community/posts', { params });
            let results = (res.data || []).map(p => ({ ...p, saved: false }));

            // client-side filter for itinerary mode with "All" sidebar
            if (typeof filterMode === 'number' && sidebarPlace === 'All') {
                const names = getItinPlaceNames();
                if (names.length > 0) {
                    results = results.filter(p =>
                        p.place && names.some(n => p.place.toLowerCase().includes(n) || n.includes(p.place.toLowerCase()))
                    );
                }
            }

            setPosts(results);
        } catch { console.error('Failed to fetch posts'); }
        finally { setLoading(false); }
    }, [activeSort, activeTag, filterMode, sidebarPlace, searchedPlace, getPlaceFilter, getItinPlaceNames]);

    useEffect(() => { if (user.id) fetchPosts(); }, [user.id, fetchPosts]);

    const handleVote = async (postId, direction) => {
        const userId = localStorage.getItem('userId');
        setPosts(prev => prev.map(p => {
            if (p.id !== postId) return p;
            let up = p.upvotes, down = p.downvotes, newVote = direction;
            if (p.user_vote === direction) { if (direction === 'up') up = Math.max(0, up - 1); else down = Math.max(0, down - 1); newVote = null; }
            else if (p.user_vote) { if (p.user_vote === 'up') { up = Math.max(0, up - 1); down += 1; } else { down = Math.max(0, down - 1); up += 1; } }
            else { if (direction === 'up') up += 1; else down += 1; }
            return { ...p, upvotes: up, downvotes: down, user_vote: newVote };
        }));
        try { await axios.post(`http://127.0.0.1:8000/community/posts/${postId}/vote?user_id=${userId}`, { direction }); }
        catch { fetchPosts(); }
    };

    const handleSave = (postId) => { setPosts(prev => prev.map(p => p.id === postId ? { ...p, saved: !p.saved } : p)); };

    const handleFilterChange = (val) => {
        setSidebarPlace('All');
        setSearchedPlace('');
        if (val === 'all') { setFilterMode('all'); }
        else { setFilterMode(val); }
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
                            <Box sx={{ flex: 1 }}>
                                <PlaceSearchAutocomplete
                                    label="Search places to filter posts..."
                                    value={searchedPlace}
                                    onChange={(t) => { setSearchedPlace(t); if (!t) handleFilterChange('all'); }}
                                    onSelect={(place) => { setSearchedPlace(place.name); setFilterMode(place.name); setSidebarPlace('All'); }}
                                    inputSx={{ '& .MuiOutlinedInput-root': { bgcolor: COLORS.cardPrimary, borderRadius: 5 } }}
                                />
                            </Box>
                            {searchedPlace && (
                                <IconButton onClick={() => { setSearchedPlace(''); handleFilterChange('all'); }}
                                    sx={{ color: COLORS.fadedText, '&:hover': { color: COLORS.error } }}>
                                    <CloseIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                            )}
                        </Stack>
                        <Stack direction="row" spacing={2} alignItems="center">
                            {/* notification bell */}
                            <IconButton onClick={(e) => { setNotifAnchor(e.currentTarget); fetchNotifications(); }}
                                sx={{ bgcolor: COLORS.cardPrimary, color: COLORS.icons, borderRadius: 3, position: 'relative', '&:hover': { bgcolor: COLORS.cardSecondary } }}>
                                <NotificationsIcon />
                                {unreadCount > 0 && (
                                    <Box sx={{
                                        position: 'absolute', top: 4, right: 4, minWidth: 16, height: 16, borderRadius: 8,
                                        bgcolor: COLORS.error, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <Typography sx={{ color: 'white', fontSize: '0.55rem', fontWeight: 800 }}>{unreadCount > 9 ? '9+' : unreadCount}</Typography>
                                    </Box>
                                )}
                            </IconButton>
                            <Menu
                                anchorEl={notifAnchor}
                                open={Boolean(notifAnchor)}
                                onClose={() => setNotifAnchor(null)}
                                PaperProps={{ sx: {
                                    bgcolor: COLORS.cardPrimary, border: `1px solid ${COLORS.border}`, borderRadius: 3,
                                    width: 340, maxHeight: 420, mt: 1,
                                } }}
                                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                            >
                                <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${COLORS.border}` }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography sx={{ color: COLORS.headings, fontWeight: 700, fontSize: '0.9rem' }}>Notifications</Typography>
                                        {unreadCount > 0 && (
                                            <Button size="small" onClick={markAllRead}
                                                sx={{ fontSize: '0.68rem', color: COLORS.brand, textTransform: 'none', minWidth: 0, '&:hover': { bgcolor: 'rgba(51,204,204,0.08)' } }}>
                                                Mark all read
                                            </Button>
                                        )}
                                    </Stack>
                                </Box>
                                {notifications.length === 0 ? (
                                    <Box sx={{ py: 4, textAlign: 'center' }}>
                                        <Typography sx={{ color: COLORS.fadedText, fontSize: '0.82rem' }}>No notifications yet</Typography>
                                    </Box>
                                ) : (
                                    <Box sx={{ maxHeight: 340, overflowY: 'auto', '&::-webkit-scrollbar': { width: 3 }, '&::-webkit-scrollbar-thumb': { bgcolor: COLORS.cardSecondary, borderRadius: 2 } }}>
                                        {notifications.map(n => (
                                            <Box key={n.id} onClick={async () => {
                                                    if (!n.is_read) {
                                                        try { await axios.patch(`http://127.0.0.1:8000/notifications/${n.id}/read`); } catch {}
                                                        setUnreadCount(c => Math.max(0, c - 1));
                                                        setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
                                                    }
                                                    setNotifAnchor(null);
                                                }}
                                                sx={{
                                                    px: 2, py: 1.2, cursor: 'pointer',
                                                    bgcolor: n.is_read ? 'transparent' : 'rgba(51,204,204,0.04)',
                                                    borderBottom: `1px solid ${COLORS.border}`,
                                                    '&:hover': { bgcolor: 'rgba(51,204,204,0.06)' },
                                                    '&:last-child': { borderBottom: 'none' },
                                                }}>
                                                <Stack direction="row" spacing={1.2} alignItems="flex-start">
                                                    <Box sx={{
                                                        width: 28, height: 28, borderRadius: 2, flexShrink: 0, mt: 0.2,
                                                        bgcolor: n.type === 'upvote' ? 'rgba(51,204,204,0.15)' : n.type === 'comment' ? 'rgba(66,165,245,0.15)' : 'rgba(255,183,77,0.15)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    }}>
                                                        {n.type === 'upvote' && <ArrowUpwardIcon sx={{ fontSize: 14, color: COLORS.brand }} />}
                                                        {n.type === 'comment' && <ChatBubbleOutlineIcon sx={{ fontSize: 14, color: '#42a5f5' }} />}
                                                        {n.type === 'alert' && <WarningAmberIcon sx={{ fontSize: 14, color: COLORS.warning }} />}
                                                    </Box>
                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                        <Typography sx={{ color: COLORS.text, fontSize: '0.78rem', lineHeight: 1.4 }}>{n.message}</Typography>
                                                        <Typography sx={{ color: COLORS.fadedText, fontSize: '0.65rem', mt: 0.2 }}>{timeAgo(n.created_at)}</Typography>
                                                    </Box>
                                                    {!n.is_read && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: COLORS.brand, flexShrink: 0, mt: 0.8 }} />}
                                                </Stack>
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                            </Menu>
                            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)} sx={{
                                bgcolor: COLORS.brand, color: COLORS.background, fontWeight: 'bold', borderRadius: 5, px: 3, py: 1.25,
                                textTransform: 'uppercase', '&:hover': { bgcolor: '#2db8b8', transform: 'translateY(-2px)', boxShadow: `0 4px 12px ${COLORS.brand}40` },
                                transition: 'all 0.3s',
                            }}>New Post</Button>
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
                            px: 1.5, py: 1, flexShrink: 0,
                        }}>
                            {/* top row: dropdown + sort */}
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Select
                                    value={typeof filterMode === 'number' ? filterMode : 'all'}
                                    onChange={(e) => { handleFilterChange(e.target.value); setSearchedPlace(''); }}
                                    size="small"
                                    renderValue={() => {
                                        if (typeof filterMode === 'string' && filterMode !== 'all') return filterMode;
                                        if (filterMode === 'all') return 'All Posts';
                                        if (typeof filterMode === 'number') {
                                            const itin = myItineraries.find(i => i.id === filterMode);
                                            return itin?.title || 'Itinerary';
                                        }
                                        return 'All Posts';
                                    }}
                                    sx={{
                                        color: COLORS.headings, fontWeight: 600, borderRadius: 2,
                                        bgcolor: COLORS.cardSecondary, fontSize: '0.8rem', minWidth: 130,
                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
                                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.brand },
                                        '& .MuiSelect-icon': { color: COLORS.fadedText },
                                        '& .MuiSelect-select': { py: '5px', px: 1.5 },
                                    }}
                                    MenuProps={{ PaperProps: { sx: { bgcolor: COLORS.cardPrimary, border: `1px solid ${COLORS.border}`, maxHeight: 340 } } }}
                                >
                                    <MenuItem value="all" sx={{ color: COLORS.text, fontSize: '0.82rem', '&:hover': { bgcolor: 'rgba(51,204,204,0.08)' } }}>All Posts</MenuItem>
                                    {myItineraries.length > 0 && <ListSubheader sx={{ bgcolor: COLORS.cardPrimary, color: COLORS.fadedText, fontSize: '0.65rem', fontWeight: 700, lineHeight: '24px', textTransform: 'uppercase', letterSpacing: 1 }}>My Itineraries</ListSubheader>}
                                    {myItineraries.map(itin => (
                                        <MenuItem key={itin.id} value={itin.id} sx={{ color: COLORS.text, fontSize: '0.82rem', '&:hover': { bgcolor: 'rgba(51,204,204,0.08)' }, '&.Mui-selected': { bgcolor: 'rgba(51,204,204,0.12)' } }}>
                                            <LocationOnIcon sx={{ fontSize: 13, color: COLORS.brand, mr: 1 }} />
                                            <Typography noWrap sx={{ fontSize: '0.82rem' }}>{itin.title}</Typography>
                                        </MenuItem>
                                    ))}
                                </Select>

                                <Box sx={{ width: '1px', height: 20, bgcolor: COLORS.border, flexShrink: 0 }} />

                                {/* sort buttons — uniform size */}
                                {FILTER_OPTIONS.map((f) => (
                                    <Button key={f.label}
                                        startIcon={React.cloneElement(f.icon, { sx: { fontSize: '13px !important' } })}
                                        size="small" onClick={() => setActiveSort(f.sort)}
                                        sx={{
                                            color: activeSort === f.sort ? COLORS.brand : COLORS.fadedText,
                                            fontWeight: activeSort === f.sort ? 700 : 500,
                                            borderRadius: 2,
                                            bgcolor: activeSort === f.sort ? 'rgba(51,204,204,0.1)' : 'transparent',
                                            py: '4px', px: 1.5, textTransform: 'none', fontSize: '0.78rem', whiteSpace: 'nowrap',
                                            '& .MuiButton-startIcon': { mr: 0.4 },
                                            '&:hover': { color: COLORS.brand, bgcolor: 'rgba(51,204,204,0.08)' },
                                        }}
                                    >{f.label}</Button>
                                ))}

                                <Box sx={{ flex: 1 }} />

                                {/* tag chips — uniform */}
                                {TAG_OPTIONS.map((t) => (
                                    <Chip key={t} label={t} size="small"
                                        onClick={() => setActiveTag(activeTag === t ? null : t)}
                                        sx={{
                                            cursor: 'pointer', height: 26, fontSize: '0.72rem', px: 0.3,
                                            bgcolor: activeTag === t ? `${TAG_COLORS[t]}20` : 'transparent',
                                            color: activeTag === t ? TAG_COLORS[t] : COLORS.fadedText,
                                            border: `1px solid ${activeTag === t ? TAG_COLORS[t] : 'rgba(255,255,255,0.06)'}`,
                                            fontWeight: activeTag === t ? 700 : 500,
                                            '&:hover': { bgcolor: `${TAG_COLORS[t]}12`, color: TAG_COLORS[t] },
                                        }}
                                    />
                                ))}
                            </Stack>
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
                                        <PostCard key={post.id} post={post} onVote={handleVote} onSave={handleSave} userId={user.id} />
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
                        {/* welcome + create */}
                        <Card sx={{ bgcolor: COLORS.cardPrimary, border: `1px solid ${COLORS.border}`, borderRadius: 4, boxShadow: 'none', overflow: 'hidden' }}>
                            <Box sx={{ height: 6, background: `linear-gradient(90deg, ${COLORS.brand}, rgba(51,204,204,0.2))` }} />
                            <CardContent sx={{ py: 2, px: 2.5 }}>
                                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                                    <Avatar sx={{ bgcolor: COLORS.brand, color: COLORS.background, fontWeight: 'bold', width: 32, height: 32, fontSize: '0.8rem' }}>
                                        {user.initial}
                                    </Avatar>
                                    <Typography variant="subtitle2" fontWeight="bold" sx={{ color: COLORS.headings }}>
                                        Welcome, {user.name}
                                    </Typography>
                                </Stack>
                                <Button fullWidth variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)} sx={{
                                    bgcolor: COLORS.brand, color: COLORS.background, fontWeight: 'bold', borderRadius: 2.5,
                                    textTransform: 'none', fontSize: '0.82rem', py: 0.8, '&:hover': { bgcolor: '#2db8b8' },
                                }}>Create Post</Button>
                            </CardContent>
                        </Card>

                        {/* cities sidebar */}
                        <Card sx={{ bgcolor: COLORS.cardPrimary, border: `1px solid ${COLORS.border}`, borderRadius: 4, boxShadow: 'none' }}>
                            <CardContent sx={{ pb: '12px !important' }}>
                                <Typography variant="caption" fontWeight="bold" sx={{ color: COLORS.fadedText, textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 1.5 }}>
                                    {typeof filterMode === 'number' ? 'Cities in Itinerary' : searchedPlace ? 'Searched Place' : 'Cities'}
                                </Typography>

                                {sidebarCities.length === 0 ? (
                                    <Typography variant="caption" sx={{ color: COLORS.fadedText, fontStyle: 'italic', fontSize: '0.75rem', lineHeight: 1.6, display: 'block' }}>
                                        {filterMode === 'all' ? 'Select an itinerary or search a place to filter posts.' : 'No mapped cities found.'}
                                    </Typography>
                                ) : (
                                    <Stack spacing={0.5}>
                                        {sidebarCities.length > 1 && (
                                            <Stack direction="row" justifyContent="space-between" alignItems="center"
                                                onClick={() => setSidebarPlace('All')}
                                                sx={{ cursor: 'pointer', borderRadius: 2, px: 1, py: 0.6, bgcolor: sidebarPlace === 'All' ? 'rgba(51,204,204,0.08)' : 'transparent', '&:hover': { bgcolor: COLORS.cardSecondary } }}>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: sidebarPlace === 'All' ? COLORS.brand : COLORS.fadedText }} />
                                                    <Typography variant="caption" sx={{ color: sidebarPlace === 'All' ? COLORS.brand : COLORS.text, fontSize: '0.78rem', fontWeight: sidebarPlace === 'All' ? 700 : 400 }}>
                                                        All Cities
                                                    </Typography>
                                                </Stack>
                                                <Typography variant="caption" sx={{ color: COLORS.fadedText, fontSize: '0.65rem' }}>{sidebarCities.length}</Typography>
                                            </Stack>
                                        )}
                                        {sidebarCities.map(city => (
                                            <Stack key={city.name} direction="row" justifyContent="space-between" alignItems="center"
                                                onClick={() => setSidebarPlace(city.name)}
                                                sx={{ cursor: 'pointer', borderRadius: 2, px: 1, py: 0.6, bgcolor: sidebarPlace === city.name ? 'rgba(51,204,204,0.08)' : 'transparent', '&:hover': { bgcolor: COLORS.cardSecondary } }}>
                                                <Stack direction="row" spacing={0.8} alignItems="center">
                                                    <LocationOnIcon sx={{ fontSize: 13, color: sidebarPlace === city.name ? COLORS.brand : COLORS.fadedText }} />
                                                    <Typography variant="caption" sx={{ color: sidebarPlace === city.name ? COLORS.brand : COLORS.text, fontSize: '0.75rem', fontWeight: sidebarPlace === city.name ? 700 : 400 }}>
                                                        {city.name}
                                                    </Typography>
                                                </Stack>
                                                {city.count > 0 && <Typography variant="caption" sx={{ color: COLORS.fadedText, fontSize: '0.65rem' }}>{city.count}</Typography>}
                                            </Stack>
                                        ))}
                                    </Stack>
                                )}
                            </CardContent>
                        </Card>

                        {/* recent alerts */}
                        <Card sx={{ bgcolor: COLORS.cardPrimary, border: `1px solid ${COLORS.border}`, borderRadius: 4, boxShadow: 'none' }}>
                            <CardContent sx={{ pb: '12px !important' }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                                    <Typography variant="caption" fontWeight="bold" sx={{ color: COLORS.warning, textTransform: 'uppercase', letterSpacing: 1 }}>
                                        Recent Alerts
                                    </Typography>
                                    <WarningAmberIcon sx={{ fontSize: 14, color: COLORS.warning }} />
                                </Stack>

                                {recentAlerts.length === 0 ? (
                                    <Typography variant="caption" sx={{ color: COLORS.fadedText, fontStyle: 'italic', fontSize: '0.75rem', display: 'block' }}>
                                        No recent alerts for this area.
                                    </Typography>
                                ) : (
                                    <Stack spacing={1}>
                                        {recentAlerts.slice(0, 4).map(alert => {
                                            const sevColor = { info: COLORS.brand, warning: COLORS.warning, urgent: COLORS.error }[alert.severity] || COLORS.warning;
                                            return (
                                                <Box key={alert.id} sx={{ borderLeft: `2px solid ${sevColor}`, pl: 1.2, py: 0.3 }}>
                                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                                        <Typography sx={{ color: sevColor, fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase' }}>
                                                            {alert.update_type}
                                                        </Typography>
                                                        <Typography sx={{ color: COLORS.fadedText, fontSize: '0.6rem' }}>·</Typography>
                                                        <Typography sx={{ color: COLORS.fadedText, fontSize: '0.6rem' }}>
                                                            {timeAgo(alert.created_at)}
                                                        </Typography>
                                                    </Stack>
                                                    <Typography noWrap sx={{ color: COLORS.text, fontSize: '0.75rem', fontWeight: 600 }}>
                                                        {alert.title}
                                                    </Typography>
                                                    <Stack direction="row" spacing={0.3} alignItems="center">
                                                        <LocationOnIcon sx={{ fontSize: 10, color: COLORS.fadedText }} />
                                                        <Typography noWrap sx={{ color: COLORS.fadedText, fontSize: '0.65rem' }}>{alert.location}</Typography>
                                                    </Stack>
                                                </Box>
                                            );
                                        })}
                                    </Stack>
                                )}

                                <Button
                                    startIcon={<WarningAmberIcon sx={{ fontSize: '14px !important' }} />}
                                    fullWidth
                                    onClick={() => { setDefaultTag('Alert'); setCreateOpen(true); }}
                                    sx={{
                                        mt: 1.5, color: COLORS.warning, bgcolor: 'rgba(255,183,77,0.08)', borderRadius: 2,
                                        border: `1px dashed rgba(255,183,77,0.25)`, textTransform: 'none', fontWeight: 'bold',
                                        fontSize: '0.78rem', py: 0.6,
                                        '&:hover': { bgcolor: 'rgba(255,183,77,0.14)', borderColor: COLORS.warning },
                                    }}
                                >
                                    Report Alert
                                </Button>
                            </CardContent>
                        </Card>
                    </Box>
                </Box>
            </Box>

            {/* create post dialog */}
            <CreatePostDialog
                open={createOpen}
                onClose={() => { setCreateOpen(false); setDefaultTag(null); }}
                userName={user.name}
                onCreated={() => { fetchPosts(); fetchAlerts(); }}
                myItineraries={myItineraries}
                defaultTag={defaultTag}
            />

        </Box>
    );
};

export default CommunityFeed;