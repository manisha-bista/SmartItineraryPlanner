import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Stack,
    Avatar,
    Chip,
    IconButton,
    Button,
    TextField,
    InputAdornment,
    Card,
    CardContent,
    CardMedia,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Tooltip,
    Badge,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

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
import NotificationImportantIcon from '@mui/icons-material/NotificationImportant';
import EventIcon from '@mui/icons-material/Event';
import FilterListIcon from '@mui/icons-material/FilterList';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CloseIcon from '@mui/icons-material/Close';
import ImageIcon from '@mui/icons-material/Image';
import EditNoteIcon from '@mui/icons-material/EditNote';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

// ── Design System ──────────────────────────────────────────────
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

// ── Mock Data (replace with API calls when backend is ready) ───
const MOCK_POSTS = [
    {
        id: 1,
        subreddit: 'P/Pokhara',
        subredditColor: '#33CCCC',
        author: 'U/Manisha',
        timeAgo: '22 Hours Ago',
        title: 'Pokhara exceeded my Expectations',
        body: "Pokhara genuinely surprised me. I went in expecting a calm lakeside town, but it turned out to be so much more vibrant and scenic than I imagined. The mix of peaceful mornings by the water, the dramatic mountain views, and the easy, welcoming atmosphere made the whole place feel almost unreal. It's one of those cities that quietly wins you over without trying.",
        image: null,
        votes: 80,
        comments: 20,
        saved: false,
        userVote: null, // 'up' | 'down' | null
        flair: 'Experience',
        flairColor: '#33CCCC',
    },
    {
        id: 2,
        subreddit: 'P/Annapurna Base Camp',
        subredditColor: '#FFB74D',
        author: 'U/Sujit033',
        timeAgo: '2 Days Ago',
        title: 'What a wonderful Sight !!!!!',
        body: "Annapurna Base Camp gave me one of those rare moments where everything just stops. Standing there surrounded by a full circle of towering peaks, the sunlight hitting the snow felt almost unreal. The silence, the cold air, and the sheer scale of the mountains made it feel like I was standing inside a postcard. It's the kind of sight that stays with you long after you've left.",
        image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=900&auto=format&fit=crop',
        votes: 150,
        comments: 50,
        saved: false,
        userVote: null,
        flair: 'Experience',
        flairColor: '#33CCCC',
    },
    {
        id: 3,
        subreddit: 'P/Kathmandu',
        subredditColor: '#ff6b6b',
        author: 'U/RameshK',
        timeAgo: '4 Days Ago',
        title: 'Swayambhunath at Dawn — absolutely magical',
        body: "Arrived at the stupa before sunrise and it was completely empty. Just the prayer flags, the monkeys, and the first light hitting the golden spire. Kathmandu from up there looked like a city slowly waking up. If you visit, go early — by 8am it gets busy.",
        image: 'https://images.unsplash.com/photo-1605640840605-14ac1855827b?q=80&w=900&auto=format&fit=crop',
        votes: 215,
        comments: 34,
        saved: true,
        userVote: 'up',
        flair: 'Experience',
        flairColor: '#33CCCC',
    },
    {
        id: 4,
        subreddit: 'P/Mustang',
        subredditColor: '#9C27B0',
        author: 'U/TrekkerAB',
        timeAgo: '1 Week Ago',
        title: 'Upper Mustang permit is 100% worth the cost',
        body: "Yes it's $500. Yes it is worth every rupee. The landscape changes completely — ancient cliff monasteries, ochre canyons, wind-sculpted ridgelines. Lo Manthang walled city feels frozen in time. Nothing else in Nepal looks like this.",
        image: 'https://images.unsplash.com/photo-1621414050345-53db43f7e7ab?q=80&w=900&auto=format&fit=crop',
        votes: 312,
        comments: 67,
        saved: false,
        userVote: null,
        flair: 'Alert',
        flairColor: '#FFB74D',
    },
    {
        id: 5,
        subreddit: 'P/Kathmandu',
        subredditColor: '#ff6b6b',
        author: 'U/LocalGuide',
        timeAgo: '3 Days Ago',
        title: '🎉 Bandipur Cultural Heritage Festival — You\'re Invited!',
        body: "The annual Bandipur Cultural Heritage Festival kicks off this weekend! Expect traditional Newari music, local food stalls, dance performances, and guided heritage walks through the old town. Free entry for all. A great chance to experience authentic Nepali culture away from the tourist crowds.",
        image: null,
        votes: 98,
        comments: 22,
        saved: false,
        userVote: null,
        flair: 'Event',
        flairColor: '#4CAF50',
    },
];

const MOCK_COMMUNITIES = [
    { name: 'P/Annapurna', members: '12.4k', color: '#FFB74D' },
    { name: 'P/Kathmandu', members: '28.1k', color: '#ff6b6b' },
    { name: 'P/Pokhara', members: '18.7k', color: '#33CCCC' },
    { name: 'P/Everest', members: '9.3k', color: '#4CAF50' },
    { name: 'P/Mustang', members: '5.2k', color: '#9C27B0' },
    { name: 'P/Chitwan', members: '7.8k', color: '#FF9800' },
];

const MOCK_RECENT_UPDATES = [
    {
        id: 1,
        type: 'alert',
        icon: <WarningAmberIcon sx={{ fontSize: 14 }} />,
        iconColor: '#FFB74D',
        title: 'Road Closure Notice – Mugling–Narayanghat Highway',
        timeAgo: '3h ago',
    },
    {
        id: 2,
        type: 'event',
        icon: <EventIcon sx={{ fontSize: 14 }} />,
        iconColor: '#33CCCC',
        title: '🎉 Bandipur Cultural Heritage Festival – You\'re Invited!',
        timeAgo: '1d ago',
    },
    {
        id: 3,
        type: 'alert',
        icon: <WarningAmberIcon sx={{ fontSize: 14 }} />,
        iconColor: '#ff6b6b',
        title: 'Landslide Risk – Langtang Valley trails closed temporarily',
        timeAgo: '2d ago',
    },
];

const FILTER_OPTIONS = [
    { label: 'Popular', icon: <WhatshotIcon sx={{ fontSize: 16 }} /> },
    { label: 'New', icon: <NewReleasesIcon sx={{ fontSize: 16 }} /> },
    { label: 'Top', icon: <TrendingUpIcon sx={{ fontSize: 16 }} /> },
    { label: 'Alerts', icon: <NotificationImportantIcon sx={{ fontSize: 16 }} /> },
    { label: 'Events', icon: <EventIcon sx={{ fontSize: 16 }} /> },
];

// ── Input style ─────────────────────────────────────────────────
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

// ── Post Card Component ─────────────────────────────────────────
const PostCard = ({ post, onVote, onSave }) => {
    const voteColor = (dir) => {
        if (post.userVote === dir) return dir === 'up' ? COLORS.brand : COLORS.error;
        return COLORS.fadedText;
    };

    return (
        <Card
            sx={{
                bgcolor: COLORS.cardPrimary,
                borderRadius: 4,
                border: `1px solid ${COLORS.border}`,
                boxShadow: 'none',
                transition: 'all 0.25s',
                '&:hover': {
                    border: `1px solid rgba(51,204,204,0.25)`,
                    boxShadow: `0 4px 24px rgba(0,0,0,0.3)`,
                    transform: 'translateY(-2px)',
                },
                overflow: 'hidden',
            }}
        >
            <Stack direction="row">
                {/* Vote Column */}
                <Box
                    sx={{
                        width: 56,
                        flexShrink: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        pt: 2,
                        pb: 2,
                        bgcolor: 'rgba(0,0,0,0.15)',
                        gap: 0.25,
                    }}
                >
                    <IconButton
                        size="small"
                        onClick={() => onVote(post.id, 'up')}
                        sx={{
                            color: voteColor('up'),
                            p: 0.5,
                            borderRadius: 1.5,
                            '&:hover': { color: COLORS.brand, bgcolor: 'rgba(51,204,204,0.1)' },
                            transition: 'all 0.2s',
                        }}
                    >
                        <ArrowUpwardIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                    <Typography
                        variant="body2"
                        fontWeight="bold"
                        sx={{
                            color: post.userVote === 'up'
                                ? COLORS.brand
                                : post.userVote === 'down'
                                    ? COLORS.error
                                    : COLORS.subheadings,
                            fontSize: '0.8rem',
                            lineHeight: 1,
                        }}
                    >
                        {post.votes}
                    </Typography>
                    <IconButton
                        size="small"
                        onClick={() => onVote(post.id, 'down')}
                        sx={{
                            color: voteColor('down'),
                            p: 0.5,
                            borderRadius: 1.5,
                            '&:hover': { color: COLORS.error, bgcolor: 'rgba(255,107,107,0.1)' },
                            transition: 'all 0.2s',
                        }}
                    >
                        <ArrowDownwardIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                </Box>

                {/* Post Content */}
                <Box sx={{ flex: 1, p: 2.5, minWidth: 0 }}>
                    {/* Meta row */}
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5, flexWrap: 'wrap', gap: 0.5 }}>
                        <Box
                            sx={{
                                width: 20,
                                height: 20,
                                borderRadius: '50%',
                                bgcolor: post.subredditColor,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}
                        >
                            <Typography sx={{ fontSize: '0.55rem', fontWeight: 'bold', color: '#141627' }}>
                                {post.subreddit.split('/')[1]?.[0] || 'P'}
                            </Typography>
                        </Box>
                        <Typography
                            variant="caption"
                            fontWeight="bold"
                            sx={{ color: post.subredditColor, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                        >
                            {post.subreddit}
                        </Typography>
                        <Typography variant="caption" sx={{ color: COLORS.fadedText }}>•</Typography>
                        <Typography variant="caption" sx={{ color: COLORS.fadedText }}>Posted By</Typography>
                        <Typography
                            variant="caption"
                            fontWeight="medium"
                            sx={{ color: COLORS.subheadings, cursor: 'pointer', '&:hover': { color: COLORS.brand } }}
                        >
                            {post.author}
                        </Typography>
                        <Typography variant="caption" sx={{ color: COLORS.fadedText }}>•</Typography>
                        <Typography variant="caption" sx={{ color: COLORS.fadedText }}>{post.timeAgo}</Typography>
                        <Chip
                            label={post.flair}
                            size="small"
                            sx={{
                                height: 18,
                                fontSize: '0.65rem',
                                bgcolor: `${post.flairColor}20`,
                                color: post.flairColor,
                                border: `1px solid ${post.flairColor}40`,
                                '& .MuiChip-label': { px: 1 },
                            }}
                        />
                    </Stack>

                    {/* Title */}
                    <Typography
                        variant="h6"
                        fontWeight="bold"
                        sx={{
                            color: COLORS.headings,
                            mb: 1.5,
                            fontSize: '1rem',
                            lineHeight: 1.4,
                            cursor: 'pointer',
                            '&:hover': { color: COLORS.brand },
                            transition: 'color 0.2s',
                        }}
                    >
                        {post.title}
                    </Typography>

                    {/* Image — flexible for any aspect ratio */}
                    {post.image && (
                        <Box
                            sx={{
                                mb: 2,
                                borderRadius: 3,
                                overflow: 'hidden',
                                maxHeight: 360,
                                minHeight: 160,
                                bgcolor: COLORS.cardSecondary,
                            }}
                        >
                            <Box
                                component="img"
                                src={post.image}
                                alt={post.title}
                                sx={{
                                    width: '100%',
                                    height: '100%',
                                    maxHeight: 360,
                                    objectFit: 'cover',
                                    objectPosition: 'center',
                                    display: 'block',
                                }}
                            />
                        </Box>
                    )}

                    {/* Body */}
                    <Typography
                        variant="body2"
                        sx={{
                            color: COLORS.text,
                            lineHeight: 1.7,
                            mb: 2,
                            display: '-webkit-box',
                            WebkitLineClamp: post.image ? 4 : 5,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                        }}
                    >
                        {post.body}
                    </Typography>

                    {/* Action Row */}
                    <Stack direction="row" spacing={0.5} alignItems="center">
                        <Button
                            startIcon={<ChatBubbleOutlineIcon sx={{ fontSize: '14px !important' }} />}
                            size="small"
                            sx={{
                                color: COLORS.fadedText,
                                borderRadius: 2,
                                fontSize: '0.75rem',
                                px: 1.5,
                                textTransform: 'none',
                                '&:hover': { color: COLORS.subheadings, bgcolor: COLORS.cardSecondary },
                            }}
                        >
                            {post.comments} comments
                        </Button>
                        <Button
                            startIcon={<ShareIcon sx={{ fontSize: '14px !important' }} />}
                            size="small"
                            sx={{
                                color: COLORS.fadedText,
                                borderRadius: 2,
                                fontSize: '0.75rem',
                                px: 1.5,
                                textTransform: 'none',
                                '&:hover': { color: COLORS.subheadings, bgcolor: COLORS.cardSecondary },
                            }}
                        >
                            Share
                        </Button>
                        <Button
                            startIcon={post.saved
                                ? <BookmarkIcon sx={{ fontSize: '14px !important', color: COLORS.brand }} />
                                : <BookmarkBorderIcon sx={{ fontSize: '14px !important' }} />
                            }
                            size="small"
                            onClick={() => onSave(post.id)}
                            sx={{
                                color: post.saved ? COLORS.brand : COLORS.fadedText,
                                borderRadius: 2,
                                fontSize: '0.75rem',
                                px: 1.5,
                                textTransform: 'none',
                                '&:hover': { color: COLORS.brand, bgcolor: 'rgba(51,204,204,0.08)' },
                            }}
                        >
                            Save
                        </Button>
                        <IconButton
                            size="small"
                            sx={{
                                color: COLORS.fadedText,
                                borderRadius: 2,
                                '&:hover': { color: COLORS.subheadings, bgcolor: COLORS.cardSecondary },
                            }}
                        >
                            <MoreHorizIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Stack>
                </Box>
            </Stack>
        </Card>
    );
};

// ── Create Post Dialog ──────────────────────────────────────────
const CreatePostDialog = ({ open, onClose, userName }) => {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [community, setCommunity] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleClose = () => {
        setTitle(''); setBody(''); setCommunity('');
        onClose();
    };

    const handleSubmit = async () => {
        if (!title.trim()) return;
        setSubmitting(true);

        // ── TODO: Uncomment when backend /community/posts endpoint is ready ──
        // try {
        //     const userId = localStorage.getItem('userId');
        //     await axios.post('http://127.0.0.1:8000/community/posts', {
        //         title: title.trim(),
        //         body: body.trim(),
        //         community: community.trim(),
        //         user_id: parseInt(userId),
        //     });
        //     onClose();
        // } catch (err) {
        //     console.error('Failed to create post:', err);
        // } finally {
        //     setSubmitting(false);
        // }

        // ── Mock delay — remove when backend is ready ──
        setTimeout(() => {
            setSubmitting(false);
            handleClose();
        }, 800);
    };

    const fieldSx = {
        '& .MuiOutlinedInput-root': {
            bgcolor: COLORS.cardSecondary,
            borderRadius: 2.5,
            color: COLORS.text,
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
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    bgcolor: COLORS.background,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 4,
                    boxShadow: `0 24px 64px rgba(0,0,0,0.7)`,
                    backgroundImage: 'linear-gradient(135deg, rgba(51,204,204,0.04) 0%, transparent 60%)',
                }
            }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${COLORS.border}`, pb: 2 }}>
                <Typography fontWeight="bold" sx={{ color: COLORS.headings }}>Create Post</Typography>
                <IconButton onClick={handleClose} sx={{ color: COLORS.fadedText, borderRadius: 2, '&:hover': { color: COLORS.error, bgcolor: 'rgba(255,107,107,0.1)' } }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: 3 }}>
                <Stack spacing={2.5}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{ bgcolor: COLORS.brand, color: COLORS.background, width: 36, height: 36, fontWeight: 'bold', fontSize: '0.85rem' }}>
                            {userName?.[0]?.toUpperCase() || 'U'}
                        </Avatar>
                        <Typography variant="body2" sx={{ color: COLORS.subheadings }}>{userName || 'User'}</Typography>
                    </Stack>
                    <TextField
                        fullWidth
                        label="Community"
                        placeholder="e.g., Annapurna, Kathmandu"
                        value={community}
                        onChange={(e) => setCommunity(e.target.value)}
                        size="small"
                        sx={fieldSx}
                    />
                    <TextField
                        fullWidth
                        label="Title *"
                        placeholder="What's your experience?"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        sx={fieldSx}
                    />
                    <TextField
                        fullWidth
                        label="Body"
                        placeholder="Share your story, tips, or questions..."
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        multiline
                        rows={5}
                        sx={fieldSx}
                    />
                    <Stack direction="row" spacing={1}>
                        <Button
                            startIcon={<ImageIcon />}
                            size="small"
                            sx={{ color: COLORS.fadedText, borderRadius: 2, textTransform: 'none', '&:hover': { color: COLORS.brand, bgcolor: 'rgba(51,204,204,0.08)' } }}
                        >
                            Add Image
                        </Button>
                        <Button
                            startIcon={<WarningAmberIcon />}
                            size="small"
                            sx={{ color: COLORS.fadedText, borderRadius: 2, textTransform: 'none', '&:hover': { color: COLORS.warning, bgcolor: 'rgba(255,183,77,0.08)' } }}
                        >
                            Report Alert
                        </Button>
                    </Stack>
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${COLORS.border}` }}>
                <Button onClick={handleClose} sx={{ color: COLORS.fadedText, borderRadius: 2, '&:hover': { bgcolor: COLORS.cardSecondary } }}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={!title.trim() || submitting}
                    sx={{
                        bgcolor: COLORS.brand,
                        color: COLORS.background,
                        fontWeight: 'bold',
                        borderRadius: 2.5,
                        px: 3,
                        '&:hover': { bgcolor: '#2db8b8', transform: 'translateY(-1px)', boxShadow: `0 4px 12px rgba(51,204,204,0.4)` },
                        '&:disabled': { bgcolor: COLORS.cardSecondary, color: COLORS.fadedText },
                        transition: 'all 0.25s',
                    }}
                >
                    {submitting ? <CircularProgress size={18} sx={{ color: COLORS.background }} /> : 'Post'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// ── Main Component ──────────────────────────────────────────────
const CommunityFeed = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState({ id: null, name: 'User', initial: 'U' });
    const [posts, setPosts] = useState(MOCK_POSTS);
    const [activeFilter, setActiveFilter] = useState('Popular');
    const [activeCommunity, setActiveCommunity] = useState('Annapurna Circuit');
    const [createOpen, setCreateOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const userId = localStorage.getItem('userId');
        const userName = localStorage.getItem('userName');
        if (!userId) { navigate('/login'); return; }
        setUser({
            id: parseInt(userId),
            name: userName || 'User',
            initial: (userName || 'U')[0].toUpperCase(),
        });

        // ── TODO: Uncomment when backend /community/posts endpoint is ready ──
        // fetchPosts();
    }, [navigate]);

    // ── TODO: Uncomment and wire up when backend is ready ──────────────────────
    // const fetchPosts = async () => {
    //     setLoading(true);
    //     try {
    //         const response = await axios.get('http://127.0.0.1:8000/community/posts', {
    //             params: { filter: activeFilter, community: activeCommunity }
    //         });
    //         setPosts(response.data);
    //     } catch (err) {
    //         console.error('Failed to fetch posts:', err);
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    // ── TODO: Uncomment when backend vote endpoint is ready ─────────────────────
    // const handleVoteAPI = async (postId, direction) => {
    //     try {
    //         await axios.post(`http://127.0.0.1:8000/community/posts/${postId}/vote`, { direction });
    //     } catch (err) {
    //         console.error('Vote failed:', err);
    //     }
    // };

    const handleVote = (postId, direction) => {
        setPosts(prev => prev.map(p => {
            if (p.id !== postId) return p;
            const wasSameDir = p.userVote === direction;
            const voteDelta = wasSameDir ? (direction === 'up' ? -1 : 1) : (
                p.userVote === null
                    ? (direction === 'up' ? 1 : -1)
                    : (direction === 'up' ? 2 : -2)
            );
            return { ...p, votes: p.votes + voteDelta, userVote: wasSameDir ? null : direction };
        }));
        // handleVoteAPI(postId, direction); // ← uncomment when ready
    };

    const handleSave = (postId) => {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, saved: !p.saved } : p));
        // ── TODO: Uncomment when backend save endpoint is ready ──
        // axios.post(`http://127.0.0.1:8000/community/posts/${postId}/save`);
    };

    const handleLogout = () => { localStorage.clear(); navigate('/'); };

    const sidebarMenu = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
        { text: 'My Itineraries', icon: <ExploreIcon />, path: '/dashboard' },
        { text: 'Interactive Map', icon: <MapIcon />, path: '/dashboard' },
        { text: 'Community Feed', icon: <GroupIcon />, path: '/community', active: true },
    ];

    return (
        <Box sx={{
            display: 'flex',
            bgcolor: COLORS.background,
            minHeight: '100vh',
            width: '100vw',
            position: 'fixed',
            top: 0, left: 0,
            overflow: 'hidden',
        }}>
            {/* ── Sidebar ── */}
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                        bgcolor: COLORS.background,
                        borderRight: 'none',
                        backgroundImage: 'linear-gradient(to bottom, rgba(51, 204, 204, 0.05), transparent)',
                    },
                }}
            >
               {/* Logo */}
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
                            <ListItemButton
                                selected={item.active}
                                onClick={() => navigate(item.path)}
                                sx={{
                                    borderRadius: 2,
                                    color: item.active ? COLORS.background : COLORS.subheadings,
                                    '&.Mui-selected': {
                                        bgcolor: COLORS.brand,
                                        color: COLORS.background,
                                        '&:hover': { bgcolor: '#2db8b8' },
                                    },
                                    '&:hover': { bgcolor: COLORS.cardSecondary },
                                }}
                            >
                                <ListItemIcon sx={{ color: item.active ? COLORS.background : COLORS.subheadings, minWidth: 40 }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.text}
                                    primaryTypographyProps={{ fontWeight: item.active ? 'bold' : 'medium', fontSize: '0.9rem' }}
                                />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>

                <Box sx={{ p: 2 }}>
                    <Button
                        fullWidth
                        startIcon={<LogoutIcon />}
                        onClick={handleLogout}
                        sx={{ color: COLORS.fadedText, '&:hover': { color: '#ff6b6b', bgcolor: 'rgba(255,107,107,0.1)' } }}
                    >
                        Logout
                    </Button>
                </Box>
            </Drawer>

            {/* ── Main Content ── */}
            <Box component="main" sx={{ flexGrow: 1, height: '100vh', overflow: 'auto', display: 'flex', flexDirection: 'column',
                '&::-webkit-scrollbar': { width: 6 },
                '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
                '&::-webkit-scrollbar-thumb': { bgcolor: COLORS.cardSecondary, borderRadius: 3 },
            }}>
                {/* ── Top Bar ── */}
                <Box sx={{ px: 3, py: 2, flexShrink: 0 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box sx={{ width: 160 }} />

                        {/* Search */}
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1, maxWidth: 600 }}>
                            <TextField
                                placeholder="Search for your favourite destination"
                                variant="outlined"
                                fullWidth
                                sx={inputSx}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon sx={{ color: COLORS.fadedText }} />
                                        </InputAdornment>
                                    )
                                }}
                            />
                            <Button
                                variant="contained"
                                sx={{
                                    bgcolor: COLORS.brand, color: COLORS.background, fontWeight: 'bold',
                                    px: 4, py: 1.75, borderRadius: 5, textTransform: 'uppercase',
                                    whiteSpace: 'nowrap',
                                    '&:hover': { bgcolor: '#2db8b8', transform: 'translateY(-2px)', boxShadow: `0 4px 12px ${COLORS.brand}40` },
                                    transition: 'all 0.3s',
                                }}
                            >
                                Search
                            </Button>
                        </Stack>

                        {/* Right */}
                        <Stack direction="row" spacing={2} alignItems="center">
                            <IconButton sx={{ bgcolor: COLORS.cardPrimary, color: COLORS.icons, borderRadius: 3, position: 'relative', '&:hover': { bgcolor: COLORS.cardSecondary } }}>
                                <NotificationsIcon />
                                <Box sx={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, bgcolor: '#ff6b6b', borderRadius: '50%' }} />
                            </IconButton>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => setCreateOpen(true)}
                                sx={{
                                    bgcolor: COLORS.brand, color: COLORS.background, fontWeight: 'bold',
                                    borderRadius: 5, px: 3, py: 1.25, textTransform: 'uppercase',
                                    '&:hover': { bgcolor: '#2db8b8', transform: 'translateY(-2px)', boxShadow: `0 4px 12px ${COLORS.brand}40` },
                                    transition: 'all 0.3s',
                                }}
                            >
                                New Trip
                            </Button>
                            <Avatar sx={{ bgcolor: COLORS.brand, color: COLORS.background, fontWeight: 'bold', cursor: 'pointer', width: 44, height: 44 }}>
                                {user.initial}
                            </Avatar>
                        </Stack>
                    </Stack>
                </Box>

                {/* ── 3-Column Body ── */}
                <Box sx={{ flex: 1, px: 4, pb: 3, display: 'flex', gap: 3, minHeight: 0 }}>

                    {/* CENTER: Posts Feed */}
                    <Box sx={{ flex: 'none', width: 850, marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>

                        {/* Filter Bar - only above posts */}
                        <Box
                            sx={{
                                bgcolor: COLORS.cardPrimary,
                                borderRadius: 3,
                                border: `1px solid ${COLORS.border}`,
                                px: 1.5,
                                py: 0.75,
                                flexShrink: 0,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                            }}
                        >
                            {/* Community selector — fixed width */}
                            <Button
                                endIcon={<KeyboardArrowDownIcon sx={{ fontSize: '14px !important' }} />}
                                size="small"
                                sx={{
                                    color: COLORS.headings, fontWeight: 'bold', borderRadius: 2,
                                    bgcolor: COLORS.cardSecondary, px: 1.5, py: 0.5,
                                    textTransform: 'none', fontSize: '0.82rem', whiteSpace: 'nowrap', flexShrink: 0,
                                    '&:hover': { bgcolor: 'rgba(51,204,204,0.1)', color: COLORS.brand },
                                }}
                            >
                                {activeCommunity}
                            </Button>

                            <Box sx={{ width: '1px', height: 18, bgcolor: COLORS.border, mx: 0.5, flexShrink: 0 }} />

                            {/* Filter buttons — each grows equally to fill remaining space */}
                            {FILTER_OPTIONS.map((f) => (
                                <Button
                                    key={f.label}
                                    startIcon={React.cloneElement(f.icon, { sx: { fontSize: '13px !important' } })}
                                    size="small"
                                    onClick={() => setActiveFilter(f.label)}
                                    sx={{
                                        flex: 1,                          // ← each button grows equally
                                        color: activeFilter === f.label ? COLORS.brand : COLORS.fadedText,
                                        fontWeight: activeFilter === f.label ? 'bold' : 'normal',
                                        borderRadius: 2,
                                        bgcolor: activeFilter === f.label ? 'rgba(51,204,204,0.1)' : 'transparent',
                                        py: 0.5, textTransform: 'none', fontSize: '0.8rem',
                                        whiteSpace: 'nowrap',
                                        '& .MuiButton-startIcon': { mr: 0.5 },
                                        '&:hover': { color: COLORS.brand, bgcolor: 'rgba(51,204,204,0.08)' },
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {f.label}
                                </Button>
                            ))}
                        </Box>

                        {/* Scrollable posts */}
                        <Box sx={{ flex: 1, overflowY: 'auto', pr: 0.5,
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
                                {/* Inline Create Post prompt */}
                                <Card
                                    sx={{
                                        bgcolor: COLORS.cardPrimary, borderRadius: 4,
                                        border: `1px solid ${COLORS.border}`, boxShadow: 'none',
                                    }}
                                >
                                    <CardContent>
                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                            <Avatar sx={{ bgcolor: COLORS.brand, color: COLORS.background, fontWeight: 'bold', width: 36, height: 36, fontSize: '0.85rem', flexShrink: 0 }}>
                                                {user.initial}
                                            </Avatar>
                                            <Box
                                                onClick={() => setCreateOpen(true)}
                                                sx={{
                                                    flex: 1,
                                                    bgcolor: COLORS.cardSecondary,
                                                    borderRadius: 2.5,
                                                    px: 2, py: 1.25,
                                                    cursor: 'text',
                                                    '&:hover': { bgcolor: 'rgba(51,204,204,0.06)', border: `1px solid rgba(51,204,204,0.2)` },
                                                    border: `1px solid transparent`,
                                                    transition: 'all 0.2s',
                                                }}
                                            >
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

                                {posts.map((post) => (
                                    <PostCard
                                        key={post.id}
                                        post={post}
                                        onVote={handleVote}
                                        onSave={handleSave}
                                    />
                                ))}
                            </Stack>
                        )}
                        </Box>
                    </Box>

                    {/* RIGHT: Sidebar panel */}
                    <Box sx={{ width: 300, flexShrink: 0, marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto',
                        '&::-webkit-scrollbar': { width: 4 },
                        '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
                        '&::-webkit-scrollbar-thumb': { bgcolor: COLORS.cardSecondary, borderRadius: 2 },
                    }}>
                        {/* User greeting card */}
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
                                <Button fullWidth variant="contained" onClick={() => setCreateOpen(true)}
                                    sx={{
                                        bgcolor: COLORS.brand, color: COLORS.background, fontWeight: 'bold',
                                        borderRadius: 2.5, textTransform: 'none', fontSize: '0.82rem',
                                        '&:hover': { bgcolor: '#2db8b8', transform: 'translateY(-1px)', boxShadow: `0 4px 12px rgba(51,204,204,0.4)` },
                                        transition: 'all 0.25s',
                                    }}
                                >
                                    Create Post
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Communities */}
                        <Card sx={{ bgcolor: COLORS.cardPrimary, border: `1px solid ${COLORS.border}`, borderRadius: 4, boxShadow: 'none' }}>
                            <CardContent sx={{ pb: '12px !important' }}>
                                <Typography variant="caption" fontWeight="bold" sx={{ color: COLORS.fadedText, textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 1.5 }}>
                                    Communities
                                </Typography>
                                <Stack spacing={0.5}>
                                    {MOCK_COMMUNITIES.map((c) => (
                                        <Stack key={c.name} direction="row" justifyContent="space-between" alignItems="center"
                                            onClick={() => setActiveCommunity(c.name.split('/')[1])}
                                            sx={{ cursor: 'pointer', borderRadius: 2, px: 1, py: 0.75, '&:hover': { bgcolor: COLORS.cardSecondary }, transition: 'all 0.2s' }}
                                        >
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: c.color, flexShrink: 0 }} />
                                                <Typography variant="caption" sx={{ color: COLORS.text, fontSize: '0.78rem' }}>{c.name}</Typography>
                                            </Stack>
                                            <Typography variant="caption" sx={{ color: COLORS.fadedText, fontSize: '0.7rem' }}>{c.members}</Typography>
                                        </Stack>
                                    ))}
                                </Stack>
                            </CardContent>
                        </Card>

                        {/* Recent Updates */}
                        <Card sx={{ bgcolor: COLORS.cardPrimary, border: `1px solid ${COLORS.border}`, borderRadius: 4, boxShadow: 'none' }}>
                            <CardContent>
                                <Typography variant="caption" fontWeight="bold" sx={{ color: COLORS.fadedText, textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 2 }}>
                                    Recent Updates:
                                </Typography>
                                <Stack spacing={1.5}>
                                    {MOCK_RECENT_UPDATES.map((update) => (
                                        <Stack
                                            key={update.id}
                                            direction="row"
                                            spacing={1.5}
                                            alignItems="flex-start"
                                            sx={{
                                                cursor: 'pointer',
                                                borderRadius: 2,
                                                p: 1,
                                                '&:hover': { bgcolor: COLORS.cardSecondary },
                                                transition: 'all 0.2s',
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    width: 26,
                                                    height: 26,
                                                    borderRadius: 1.5,
                                                    bgcolor: `${update.iconColor}18`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: update.iconColor,
                                                    flexShrink: 0,
                                                    mt: 0.25,
                                                }}
                                            >
                                                {update.icon}
                                            </Box>
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography variant="caption" sx={{ color: COLORS.text, lineHeight: 1.4, display: 'block', fontSize: '0.78rem' }}>
                                                    {update.title}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: COLORS.fadedText, fontSize: '0.7rem' }}>
                                                    {update.timeAgo}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    ))}
                                </Stack>
                            </CardContent>
                        </Card>

                        {/* About Community */}
                        <Card sx={{ bgcolor: COLORS.cardPrimary, border: `1px solid ${COLORS.border}`, borderRadius: 4, boxShadow: 'none' }}>
                            <Box sx={{ height: 80, background: `linear-gradient(135deg, rgba(51,204,204,0.2), rgba(20,22,39,0))`, borderRadius: '16px 16px 0 0', position: 'relative', overflow: 'hidden' }}>
                                <Box component="img"
                                    src="https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=400&auto=format&fit=crop"
                                    sx={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35 }}
                                />
                            </Box>
                            <CardContent>
                                <Typography variant="subtitle2" fontWeight="bold" sx={{ color: COLORS.headings, mb: 1 }}>
                                    About Community
                                </Typography>
                                <Typography variant="caption" sx={{ color: COLORS.fadedText, lineHeight: 1.6, display: 'block', mb: 2, fontSize: '0.78rem' }}>
                                    Share your Nepal travel stories, tips, alerts, and connect with fellow adventurers. Help others plan the perfect trip.
                                </Typography>
                                <Stack spacing={0.75}>
                                    {[
                                        { label: 'Total Posts', value: '1.2k' },
                                        { label: 'Active Members', value: '8.4k' },
                                        { label: 'Joined', value: 'Feb 2024' },
                                    ].map((stat) => (
                                        <Stack key={stat.label} direction="row" justifyContent="space-between">
                                            <Typography variant="caption" sx={{ color: COLORS.fadedText, fontSize: '0.78rem' }}>{stat.label}</Typography>
                                            <Typography variant="caption" fontWeight="bold" sx={{ color: COLORS.subheadings, fontSize: '0.78rem' }}>{stat.value}</Typography>
                                        </Stack>
                                    ))}
                                </Stack>
                            </CardContent>
                        </Card>

                        {/* Report */}
                        <Button
                            startIcon={<WarningAmberIcon />}
                            fullWidth
                            sx={{
                                color: COLORS.warning,
                                bgcolor: 'rgba(255,183,77,0.08)',
                                borderRadius: 3,
                                border: `1px dashed rgba(255,183,77,0.3)`,
                                textTransform: 'none',
                                fontWeight: 'bold',
                                py: 1.25,
                                '&:hover': { bgcolor: 'rgba(255,183,77,0.14)', borderColor: COLORS.warning },
                                transition: 'all 0.2s',
                            }}
                        >
                            Report Road / Trail Alert
                        </Button>
                    </Box>
                </Box>
            </Box>

            {/* ── Create Post Dialog ── */}
            <CreatePostDialog open={createOpen} onClose={() => setCreateOpen(false)} userName={user.name} />
        </Box>
    );
};

export default CommunityFeed;