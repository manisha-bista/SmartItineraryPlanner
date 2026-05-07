import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Stack, Avatar, Chip, IconButton, Button, TextField,
    InputAdornment, Card, CardContent,
    Dialog, DialogTitle, DialogContent, DialogActions,
    CircularProgress, Select, MenuItem, Alert, Divider, ListSubheader,
    Collapse, Menu,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import Navbar, { DRAWER_WIDTH } from '../components/Navbar';
import PlaceSearchAutocomplete from '../components/PlaceSearchAutocomplete';

import SearchIcon          from '@mui/icons-material/Search';
import AddIcon             from '@mui/icons-material/Add';
import ArrowUpwardIcon     from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon   from '@mui/icons-material/ArrowDownward';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ShareIcon           from '@mui/icons-material/Share';
import BookmarkBorderIcon  from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon        from '@mui/icons-material/Bookmark';
import WhatshotIcon        from '@mui/icons-material/Whatshot';
import NewReleasesIcon     from '@mui/icons-material/NewReleases';
import TrendingUpIcon      from '@mui/icons-material/TrendingUp';
import WarningAmberIcon    from '@mui/icons-material/WarningAmber';
import CloseIcon           from '@mui/icons-material/Close';
import ImageIcon           from '@mui/icons-material/Image';
import EditNoteIcon        from '@mui/icons-material/EditNote';
import LocationOnIcon      from '@mui/icons-material/LocationOn';
import SendIcon            from '@mui/icons-material/Send';
import PersonAddIcon       from '@mui/icons-material/PersonAdd';
import CheckCircleIcon     from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon  from '@mui/icons-material/HourglassEmpty';
import ChatIcon            from '@mui/icons-material/Chat';
import ContentCopyIcon     from '@mui/icons-material/ContentCopy';
import CalendarTodayIcon   from '@mui/icons-material/CalendarToday';
import ExploreIcon         from '@mui/icons-material/Explore';
import OpenInNewIcon       from '@mui/icons-material/OpenInNew';
import ChevronLeftIcon     from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon    from '@mui/icons-material/ChevronRight';
import DeleteOutlineIcon   from '@mui/icons-material/DeleteOutline';
import AddReactionOutlinedIcon from '@mui/icons-material/AddReactionOutlined';
import Tooltip             from '@mui/material/Tooltip';
import Popover             from '@mui/material/Popover';
import MoreVertIcon        from '@mui/icons-material/MoreVert';
import FlagOutlinedIcon    from '@mui/icons-material/FlagOutlined';

// ── constants ──────────────────────────────────────────────────────────────
const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '👏'];
const TAG_OPTIONS = ['Experience', 'Alert', 'Event', 'Tip', 'Question'];
const TAG_COLORS  = {
    Experience: '#33CCCC', Alert: '#FFB74D', Event: '#4CAF50',
    Tip: '#9C27B0', Question: '#42A5F5',
};
const KNOWN_CITIES = ['Kathmandu','Pokhara','Bhaktapur','Lalitpur','Patan','Chitwan','Lumbini','Mustang','Annapurna','Everest','Namche','Nagarkot','Bandipur','Janakpur','Boudha','Thamel','Kirtipur','Dhulikhel','Lukla','Jomsom','Gorkha','Tansen','Bardiya','Langtang','Manang','Dolpa'];

const AVATAR_LIST = [
    { id: 1,  style: 'notionists', seed: 'explorer'  }, { id: 2,  style: 'notionists', seed: 'summit'    },
    { id: 3,  style: 'notionists', seed: 'atlas'     }, { id: 4,  style: 'notionists', seed: 'voyage'    },
    { id: 5,  style: 'notionists', seed: 'horizon'   }, { id: 6,  style: 'notionists', seed: 'trailhead' },
    { id: 7,  style: 'notionists', seed: 'meridian'  }, { id: 8,  style: 'notionists', seed: 'solstice'  },
    { id: 9,  style: 'micah',      seed: 'peak'      }, { id: 10, style: 'micah',      seed: 'nomad'     },
    { id: 11, style: 'micah',      seed: 'delta'     }, { id: 12, style: 'micah',      seed: 'canyon'    },
    { id: 13, style: 'micah',      seed: 'sierra'    }, { id: 14, style: 'micah',      seed: 'fjord'     },
    { id: 15, style: 'micah',      seed: 'savanna'   }, { id: 16, style: 'micah',      seed: 'tundra'    },
    { id: 17, style: 'lorelei',    seed: 'celeste'   }, { id: 18, style: 'lorelei',    seed: 'aurora'    },
    { id: 19, style: 'lorelei',    seed: 'marina'    }, { id: 20, style: 'lorelei',    seed: 'sahara'    },
    { id: 21, style: 'lorelei',    seed: 'soleil'    }, { id: 22, style: 'lorelei',    seed: 'zephyr'    },
    { id: 23, style: 'personas',   seed: 'trek'      }, { id: 24, style: 'personas',   seed: 'ridge'     },
    { id: 25, style: 'personas',   seed: 'orion'     }, { id: 26, style: 'personas',   seed: 'cairo'     },
    { id: 27, style: 'personas',   seed: 'rio'       }, { id: 28, style: 'personas',   seed: 'jade'      },
    { id: 29, style: 'personas',   seed: 'venice'    }, { id: 30, style: 'personas',   seed: 'kyoto'     },
];
const getAvatarUrl = (id) => {
    const av = AVATAR_LIST.find(a => a.id === id) || AVATAR_LIST[0];
    return `https://api.dicebear.com/7.x/${av.style}/svg?seed=${av.seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
};
const getAvatarColor = (id) => {
    const colors = ['#33CCCC','#EC407A','#5C6BC0','#26A69A','#AB47BC','#FF7043','#42A5F5','#66BB6A','#FFB74D','#EF5350','#7E57C2','#0097A7','#F06292','#8D6E63','#4DB6AC','#FF8A65','#BA68C8','#4DD0E1','#AED581','#FFD54F','#FF7043','#CE93D8','#26A69A','#5C6BC0','#EC407A','#33CCCC','#FF5722','#66BB6A','#7E57C2','#F06292'];
    return colors[(id || 1) - 1] || '#33CCCC';
};

const fmtDate = (s) => { if (!s) return ''; return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); };

// ── ItineraryEmbed ───────────────────────────────────────────────────────────
const ItineraryEmbed = ({ itineraryId, userId, COLORS }) => {
    const [itin, setItin]         = useState(null);
    const [dayIndex, setDayIndex] = useState(0);
    const [forking, setForking]   = useState(false);
    const [forkError, setForkError] = useState('');

    useEffect(() => {
        if (!itineraryId) return;
        axios.get(`${import.meta.env.VITE_BACKEND_API_URL}itineraries/${itineraryId}`)
            .then(r => { setItin(r.data); setDayIndex(0); })
            .catch(() => {});
    }, [itineraryId]);

    const forkIt = async (e) => {
        e.stopPropagation();
        setForkError('');
        setForking(true);
        try {
            const res = await axios.post(`${import.meta.env.VITE_BACKEND_API_URL}itineraries/${itineraryId}/fork?user_id=${userId}`);
            // Navigate whether it's a fresh fork or already-forked — both return the itinerary id
            window.location.href = `/itinerary/${res.data.id}`;
        } catch (err) {
            const msg = err?.response?.data?.detail || 'Failed to fork itinerary.';
            setForkError(msg);
            setForking(false);
        }
    };

    if (!itin) return (
        <Box sx={{ px: 2, py: 1.5, bgcolor: `${COLORS.brand}08`, borderRadius: 2, mt: 1.5, border: `1px solid ${COLORS.cardBorder}`, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={14} sx={{ color: COLORS.brand }} />
            <Typography sx={{ fontSize: '0.72rem', color: COLORS.fadedText }}>Loading itinerary…</Typography>
        </Box>
    );

    const days    = itin.days || [];
    const totalActs = days.reduce((s, d) => s + (d.activities?.length || 0), 0);
    const isOwn   = itin.user_id === parseInt(userId);
    const cur     = days[dayIndex];

    return (
        <Box sx={{ mt: 2, bgcolor: `${COLORS.brand}08`, border: `1px solid ${COLORS.brand}30`, borderRadius: 3, overflow: 'hidden', minHeight: 220 }}>

            {/* ── Header row ── */}
            <Stack direction="row" alignItems="center" sx={{ px: 3, py: 2, borderBottom: days.length > 0 ? `1px solid ${COLORS.cardBorder}` : 'none' }}>
                <ExploreIcon sx={{ fontSize: 24, color: COLORS.brand, mr: 1.5, flexShrink: 0 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ color: COLORS.headings, fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.2 }} noWrap>{itin.title}</Typography>
                    <Stack direction="row" spacing={0.8} sx={{ mt: 0.4, flexWrap: 'wrap', gap: 0.3 }}>
                        <Stack direction="row" alignItems="center" spacing={0.3}>
                            <LocationOnIcon sx={{ fontSize: 14, color: COLORS.fadedText }} />
                            <Typography sx={{ fontSize: '0.82rem', color: COLORS.fadedText }}>{itin.destination}</Typography>
                        </Stack>
                        <Typography sx={{ fontSize: '0.82rem', color: COLORS.fadedText }}>·</Typography>
                        <Typography sx={{ fontSize: '0.82rem', color: COLORS.fadedText }}>{days.length} day{days.length !== 1 ? 's' : ''} · {totalActs} stops</Typography>
                    </Stack>
                </Box>
                <Stack direction="row" spacing={0.75} alignItems="center" sx={{ flexShrink: 0, ml: 1.5 }}>
                    {!isOwn && (
                        <Button size="small"
                            startIcon={forking ? <CircularProgress size={13} sx={{ color: COLORS.background || '#141627' }} /> : <ContentCopyIcon sx={{ fontSize: 14 }} />}
                            onClick={forkIt} disabled={forking}
                            sx={{ bgcolor: COLORS.brand, color: COLORS.background || '#141627', fontWeight: 700, borderRadius: 2, px: 2, py: 0.5, textTransform: 'none', fontSize: '0.78rem', '&:hover': { bgcolor: '#2db8b8' } }}>
                            {forking ? 'Forking…' : 'Fork & Edit'}
                        </Button>
                    )}
                    <Button size="small" startIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
                        onClick={(e) => { e.stopPropagation(); window.open(`/itinerary/${itineraryId}`, '_blank'); }}
                        sx={{ color: COLORS.brand, borderRadius: 2, px: 1.5, py: 0.5, textTransform: 'none', fontSize: '0.78rem', '&:hover': { bgcolor: `${COLORS.brand}18` } }}>
                        View
                    </Button>
                </Stack>
            </Stack>

            {/* ── Fork error ── */}
            {forkError && (
                <Box sx={{ px: 3, py: 1, bgcolor: 'rgba(255,107,107,0.08)', borderBottom: `1px solid rgba(255,107,107,0.2)` }}>
                    <Typography sx={{ fontSize: '0.75rem', color: '#ff6b6b' }}>{forkError}</Typography>
                </Box>
            )}

            {/* ── Day tabs + pagination ── */}
            {days.length > 0 && cur && (
                <>
                    {/* Day chips */}
                    <Stack direction="row" spacing={0} sx={{ px: 3, pt: 1.5, pb: 0.75, flexWrap: 'wrap', gap: 0.6 }}>
                        {days.map((day, idx) => (
                            <Chip key={day.id} label={`D${day.day_number}`} size="small" onClick={() => setDayIndex(idx)}
                                sx={{
                                    height: 28, fontSize: '0.75rem', cursor: 'pointer',
                                    bgcolor: idx === dayIndex ? `${COLORS.brand}22` : 'transparent',
                                    color: idx === dayIndex ? COLORS.brand : COLORS.fadedText,
                                    border: `1px solid ${idx === dayIndex ? COLORS.brand + '50' : COLORS.cardBorder}`,
                                    fontWeight: idx === dayIndex ? 700 : 400,
                                    '&:hover': { bgcolor: `${COLORS.brand}14`, color: COLORS.brand },
                                    '& .MuiChip-label': { px: 1.2 },
                                }} />
                        ))}
                    </Stack>

                    {/* Day header with prev/next */}
                    <Stack direction="row" alignItems="center" sx={{ px: 2, py: 1 }}>
                        <IconButton size="small" onClick={() => setDayIndex(i => i - 1)} disabled={dayIndex === 0}
                            sx={{ p: 0.4, color: dayIndex > 0 ? COLORS.brand : COLORS.fadedText, '&:hover': { bgcolor: `${COLORS.brand}14` } }}>
                            <ChevronLeftIcon sx={{ fontSize: 22 }} />
                        </IconButton>
                        <Typography sx={{ color: COLORS.subheadings, fontSize: '0.88rem', fontWeight: 700, flex: 1, textAlign: 'center' }}>
                            Day {cur.day_number}{cur.title && !/^day\s*\d+$/i.test(cur.title.trim()) ? ` · ${cur.title}` : ''}{cur.date ? ` — ${fmtDate(cur.date)}` : ''}
                        </Typography>
                        <IconButton size="small" onClick={() => setDayIndex(i => i + 1)} disabled={dayIndex === days.length - 1}
                            sx={{ p: 0.4, color: dayIndex < days.length - 1 ? COLORS.brand : COLORS.fadedText, '&:hover': { bgcolor: `${COLORS.brand}14` } }}>
                            <ChevronRightIcon sx={{ fontSize: 22 }} />
                        </IconButton>
                    </Stack>

                    {/* Activities for current day */}
                    <Box sx={{ px: 3, pb: 2.5 }}>
                        {(cur.activities || []).length === 0 ? (
                            <Typography sx={{ color: COLORS.fadedText, fontSize: '0.85rem', fontStyle: 'italic' }}>No activities for this day.</Typography>
                        ) : (
                            (cur.activities || []).map(act => (
                                <Stack key={act.id} direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                    <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: COLORS.brand, flexShrink: 0 }} />
                                    <Typography sx={{ fontSize: '0.9rem', color: COLORS.text, flex: 1 }}>{act.title || act.location}</Typography>
                                    {act.location && act.title && act.title !== act.location && (
                                        <Stack direction="row" alignItems="center" spacing={0.3}>
                                            <LocationOnIcon sx={{ fontSize: 13, color: COLORS.fadedText }} />
                                            <Typography sx={{ fontSize: '0.78rem', color: COLORS.fadedText }} noWrap>{act.location}</Typography>
                                        </Stack>
                                    )}
                                    {act.start_time && (
                                        <Typography sx={{ fontSize: '0.78rem', color: COLORS.fadedText, flexShrink: 0 }}>@ {act.start_time.slice(0, 5)}</Typography>
                                    )}
                                </Stack>
                            ))
                        )}
                    </Box>
                </>
            )}
        </Box>
    );
};

const FILTER_OPTIONS = [
    { label: 'New',     icon: <NewReleasesIcon sx={{ fontSize: 16 }} />, sort: 'new'     },
    { label: 'Popular', icon: <WhatshotIcon    sx={{ fontSize: 16 }} />, sort: 'popular' },
    { label: 'Top',     icon: <TrendingUpIcon  sx={{ fontSize: 16 }} />, sort: 'top'     },
];

const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const utcStr = dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z';
    const diffMs = Date.now() - new Date(utcStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1)  return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7)  return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
};

// ── PostCard ────────────────────────────────────────────────────────────────
// COLORS passed as prop since defined outside CommunityFeed
const PostCard = ({ post, onVote, onSave, onDelete, userId, onProfileClick, COLORS, navigate, highlighted }) => {
    const tagColor = TAG_COLORS[post.tag] || COLORS.brand;
    const netVotes = (post.upvotes || 0) - (post.downvotes || 0);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments]         = useState([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [newComment, setNewComment]     = useState('');
    const [posting, setPosting]           = useState(false);
    const [replyTo, setReplyTo]           = useState(null);
    const [replyText, setReplyText]       = useState('');
    const [replyPosting, setReplyPosting] = useState(false);

    const voteColor = (dir) => post.user_vote === dir
        ? (dir === 'up' ? COLORS.brand : '#ff6b6b')
        : COLORS.fadedText;

    const loadComments = async () => {
        setCommentsLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_API_URL}community/posts/${post.id}/comments`, { params: { user_id: userId } });
            setComments(res.data || []);
        } catch { /* silent */ }
        finally { setCommentsLoading(false); }
    };

    const toggleComments = () => { if (!showComments) loadComments(); setShowComments(!showComments); };

    const submitComment = async () => {
        if (!newComment.trim()) return;
        setPosting(true);
        try {
            const res = await axios.post(`${import.meta.env.VITE_BACKEND_API_URL}community/posts/${post.id}/comments?user_id=${userId}`, { content: newComment.trim() });
            setNewComment('');
            setComments(prev => [...prev, res.data]);
            setLocalCommentCount(c => c + 1);
        } catch { /* silent */ }
        finally { setPosting(false); }
    };

    const submitReply = async (parentId) => {
        if (!replyText.trim()) return;
        setReplyPosting(true);
        try {
            const res = await axios.post(`${import.meta.env.VITE_BACKEND_API_URL}community/posts/${post.id}/comments?user_id=${userId}`, { content: replyText.trim(), parent_comment_id: parentId });
            setReplyText(''); setReplyTo(null);
            setComments(prev => [...prev, res.data]);
            setLocalCommentCount(c => c + 1);
        } catch { /* silent */ }
        finally { setReplyPosting(false); }
    };

    const [emojiAnchor, setEmojiAnchor] = useState(null); // { el, commentId }
    const [localCommentCount, setLocalCommentCount] = useState(post.comment_count || 0);
    const [postMenuAnchor, setPostMenuAnchor] = useState(null);
    const [reportDialog, setReportDialog] = useState({ open: false, target: null, commentId: null }); // target: 'post'|'comment'
    const [reportReason, setReportReason] = useState('');
    const [reportSubmitting, setReportSubmitting] = useState(false);
    const [reportSuccess, setReportSuccess] = useState(false);

    const submitReport = async () => {
        if (!reportReason.trim()) return;
        setReportSubmitting(true);
        try {
            if (reportDialog.target === 'comment') {
                await axios.post(`${import.meta.env.VITE_BACKEND_API_URL}community/posts/${post.id}/comments/${reportDialog.commentId}/report?user_id=${userId}`, { reason: reportReason.trim() });
            } else {
                await axios.post(`${import.meta.env.VITE_BACKEND_API_URL}community/posts/${post.id}/report?user_id=${userId}`, { reason: reportReason.trim() });
            }
            setReportSuccess(true);
            setTimeout(() => { setReportDialog({ open: false, target: null, commentId: null }); setReportReason(''); setReportSuccess(false); }, 1500);
        } catch { /* silent */ }
        finally { setReportSubmitting(false); }
    };

    const deletePost = async () => {
        try {
            await axios.delete(`${import.meta.env.VITE_BACKEND_API_URL}community/posts/${post.id}?user_id=${userId}`);
            onDelete?.(post.id);
        } catch { /* silent */ }
    };

    const submitReaction = async (commentId, emoji, anchorEl) => {
        setEmojiAnchor(null);
        try {
            const res = await axios.post(`${import.meta.env.VITE_BACKEND_API_URL}community/posts/${post.id}/comments/${commentId}/react?user_id=${userId}&emoji=${encodeURIComponent(emoji)}`);
            setComments(prev => prev.map(c => c.id === commentId ? { ...c, reactions: res.data.reactions } : c));
        } catch { /* silent */ }
    };

    const deleteComment = async (commentId) => {
        try {
            await axios.delete(`${import.meta.env.VITE_BACKEND_API_URL}community/posts/${post.id}/comments/${commentId}?user_id=${userId}`);
            // Compute removed count from current snapshot BEFORE updating state
            const removed = comments.filter(c => c.id === commentId || c.parent_comment_id === commentId);
            setLocalCommentCount(c => Math.max(0, c - removed.length));
            setComments(prev => prev.filter(c => c.id !== commentId && c.parent_comment_id !== commentId));
        } catch { /* silent */ }
    };

    // Computed outside JSX to avoid IIFE rendering issues
    const topLevel = comments.filter(c => !c.parent_comment_id);
    const repliesMap = {};
    comments.forEach(c => {
        if (c.parent_comment_id) {
            if (!repliesMap[c.parent_comment_id]) repliesMap[c.parent_comment_id] = [];
            repliesMap[c.parent_comment_id].push(c);
        }
    });
    const canDelete = (c) => c.user_id === userId || post.user_id === userId;

    const renderComment = (c, isReply = false) => {
        const activeReactions = (c.reactions || []).filter(r => r.count > 0);
        return (
            <Box key={c.id}>
                <Stack direction="row" spacing={1} sx={{ py: 0.5 }}>
                    <Avatar sx={{ width: isReply ? 20 : 24, height: isReply ? 20 : 24, bgcolor: COLORS.cardSecondary, mt: 0.3, flexShrink: 0 }} src={getAvatarUrl(c.author_avatar_id)} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" alignItems="center" spacing={0.8}>
                            <Typography variant="caption" fontWeight="bold" sx={{ color: COLORS.subheadings, fontSize: isReply ? '0.72rem' : '0.78rem' }}>{c.author_name || 'User'}</Typography>
                            <Typography variant="caption" sx={{ color: COLORS.fadedText, fontSize: '0.65rem' }}>{timeAgo(c.created_at)}</Typography>
                            <Box sx={{ flex: 1 }} />
                            {canDelete(c) && (
                                <Tooltip title="Delete comment" placement="top">
                                    <IconButton size="small" onClick={() => deleteComment(c.id)}
                                        sx={{ p: 0.2, color: COLORS.fadedText, '&:hover': { color: '#ff6b6b', bgcolor: 'rgba(255,107,107,0.08)' } }}>
                                        <DeleteOutlineIcon sx={{ fontSize: 14 }} />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Stack>
                        <Typography variant="body2" sx={{ color: COLORS.text, fontSize: '0.82rem', lineHeight: 1.5, mt: 0.1 }}>{c.content}</Typography>
                        {activeReactions.length > 0 && (
                            <Stack direction="row" spacing={0.4} alignItems="center" sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.3 }}>
                                {activeReactions.map(r => (
                                    <Box key={r.emoji} onClick={() => submitReaction(c.id, r.emoji)}
                                        sx={{
                                            display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer',
                                            px: 0.7, py: 0.15, borderRadius: 10,
                                            border: `1px solid ${r.user_reacted ? COLORS.brand + '70' : COLORS.cardBorder}`,
                                            bgcolor: r.user_reacted ? `${COLORS.brand}18` : COLORS.cardSecondary,
                                            transition: 'all 0.15s',
                                            '&:hover': { borderColor: COLORS.brand + '60', bgcolor: `${COLORS.brand}12` },
                                        }}>
                                        <span style={{ fontSize: '0.82rem', lineHeight: 1 }}>{r.emoji}</span>
                                        <Typography sx={{ fontSize: '0.68rem', color: r.user_reacted ? COLORS.brand : COLORS.fadedText, fontWeight: r.user_reacted ? 700 : 500, lineHeight: 1 }}>{r.count}</Typography>
                                    </Box>
                                ))}
                            </Stack>
                        )}
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 0.5 }}>
                            <Tooltip title="Add reaction" placement="top">
                                <IconButton size="small"
                                    onClick={e => setEmojiAnchor({ el: e.currentTarget, commentId: c.id })}
                                    sx={{ p: 0.3, color: emojiAnchor?.commentId === c.id ? COLORS.brand : COLORS.fadedText, borderRadius: 1.5, '&:hover': { color: COLORS.brand, bgcolor: `${COLORS.brand}12` } }}>
                                    <AddReactionOutlinedIcon sx={{ fontSize: 15 }} />
                                </IconButton>
                            </Tooltip>
                            {!isReply && (
                                <Typography onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}
                                    sx={{ fontSize: '0.75rem', fontWeight: 600, color: replyTo === c.id ? COLORS.brand : COLORS.fadedText, cursor: 'pointer', '&:hover': { color: COLORS.brand } }}>
                                    Reply
                                </Typography>
                            )}
                            {c.user_id !== parseInt(userId) && (
                                <Typography onClick={() => setReportDialog({ open: true, target: 'comment', commentId: c.id })}
                                    sx={{ fontSize: '0.75rem', fontWeight: 600, color: COLORS.fadedText, cursor: 'pointer', '&:hover': { color: '#fb923c' }, display: 'flex', alignItems: 'center', gap: '3px' }}>
                                    <FlagOutlinedIcon sx={{ fontSize: 13 }} /> Report
                                </Typography>
                            )}
                        </Stack>
                        {replyTo === c.id && (
                            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.75 }}>
                                <TextField size="small" placeholder={`Reply to ${c.author_name}…`}
                                    value={replyText} onChange={e => setReplyText(e.target.value)} autoFocus
                                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitReply(c.id); } if (e.key === 'Escape') { setReplyTo(null); setReplyText(''); } }}
                                    sx={{
                                        flex: 1,
                                        '& .MuiOutlinedInput-root': { bgcolor: COLORS.cardSecondary, borderRadius: 2, color: COLORS.text, '& fieldset': { borderColor: 'transparent' }, '&:hover fieldset': { borderColor: COLORS.brand }, '&.Mui-focused fieldset': { borderColor: COLORS.brand } },
                                        '& .MuiInputBase-input': { py: '6px', fontSize: '0.78rem' },
                                        '& .MuiInputBase-input::placeholder': { color: COLORS.fadedText, opacity: 1 },
                                    }} />
                                <IconButton size="small" onClick={() => submitReply(c.id)} disabled={!replyText.trim() || replyPosting}
                                    sx={{ color: COLORS.brand, '&:disabled': { color: COLORS.fadedText } }}>
                                    {replyPosting ? <CircularProgress size={14} sx={{ color: COLORS.brand }} /> : <SendIcon sx={{ fontSize: 15 }} />}
                                </IconButton>
                            </Stack>
                        )}
                    </Box>
                </Stack>
                {(repliesMap[c.id] || []).length > 0 && (
                    <Box sx={{ ml: 4, pl: 1.5, borderLeft: `2px solid ${COLORS.cardBorder}` }}>
                        {(repliesMap[c.id] || []).map(reply => renderComment(reply, true))}
                    </Box>
                )}
            </Box>
        );
    };

    return (
        <Card id={`post-${post.id}`} sx={{
            bgcolor: COLORS.cardPrimary, borderRadius: 4,
            border: highlighted ? `2px solid ${COLORS.brand}` : `1px solid ${COLORS.cardBorder}`,
            boxShadow: highlighted ? `0 0 0 2px ${COLORS.brand}40, 0 4px 24px rgba(51,204,204,0.25)` : 'none',
            transition: 'all 0.25s', overflow: 'hidden',
            '&:hover': { border: `1px solid rgba(51,204,204,0.25)`, boxShadow: `0 4px 24px rgba(0,0,0,0.3)` },
        }}>
            <Stack direction="row">
                {/* vote column */}
                <Box sx={{ width: 56, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', pt: 2, pb: 2, bgcolor: 'rgba(0,0,0,0.15)', gap: 0.25 }}>
                    <IconButton size="small" onClick={() => onVote(post.id, 'up')}
                        sx={{ color: voteColor('up'), p: 0.5, borderRadius: 1.5, '&:hover': { color: COLORS.brand, bgcolor: 'rgba(51,204,204,0.1)' } }}>
                        <ArrowUpwardIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                    <Typography variant="body2" fontWeight="bold" sx={{
                        color: post.user_vote === 'up' ? COLORS.brand : post.user_vote === 'down' ? '#ff6b6b' : COLORS.subheadings,
                        fontSize: '0.8rem', lineHeight: 1,
                    }}>{netVotes}</Typography>
                    <IconButton size="small" onClick={() => onVote(post.id, 'down')}
                        sx={{ color: voteColor('down'), p: 0.5, borderRadius: 1.5, '&:hover': { color: '#ff6b6b', bgcolor: 'rgba(255,107,107,0.1)' } }}>
                        <ArrowDownwardIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                </Box>

                {/* post content */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ p: 2.5 }}>
                        {/* meta row */}
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5, flexWrap: 'wrap', gap: 0.5 }}>
                            <Avatar onClick={() => post.user_id !== userId && onProfileClick?.(post.user_id)}
                                src={getAvatarUrl(post.author_avatar_id)}
                                sx={{ width: 20, height: 20, bgcolor: COLORS.cardSecondary, cursor: post.user_id !== userId ? 'pointer' : 'default', flexShrink: 0 }} />
                            <Typography variant="caption" fontWeight="bold"
                                onClick={() => post.user_id !== userId && onProfileClick?.(post.user_id)}
                                sx={{ color: COLORS.subheadings, cursor: post.user_id !== userId ? 'pointer' : 'default', '&:hover': post.user_id !== userId ? { color: COLORS.brand } : {} }}>
                                {post.author_name || 'Unknown'}
                            </Typography>
                            {post.place && post.place !== 'All' && !post.shared_itinerary_id && (
                                <><Typography variant="caption" sx={{ color: COLORS.fadedText }}>•</Typography>
                                <Typography variant="caption" sx={{ color: tagColor }}>{post.place}</Typography></>
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
                            }}>{post.body}</Typography>
                        )}

                        {/* Embedded itinerary */}
                        {post.shared_itinerary_id && (
                            <ItineraryEmbed itineraryId={post.shared_itinerary_id} userId={userId} COLORS={COLORS} />
                        )}

                        {/* actions */}
                        <Stack direction="row" spacing={0.5} alignItems="center">
                            <Button startIcon={<ChatBubbleOutlineIcon sx={{ fontSize: '14px !important' }} />} size="small" onClick={toggleComments}
                                sx={{ color: showComments ? COLORS.brand : COLORS.fadedText, borderRadius: 2, fontSize: '0.75rem', px: 1.5, textTransform: 'none', '&:hover': { color: COLORS.brand, bgcolor: `${COLORS.brand}14` } }}>
                                {localCommentCount} comments
                            </Button>
                            <Button startIcon={<ShareIcon sx={{ fontSize: '14px !important' }} />} size="small"
                                sx={{ color: COLORS.fadedText, borderRadius: 2, fontSize: '0.75rem', px: 1.5, textTransform: 'none', '&:hover': { color: COLORS.subheadings, bgcolor: COLORS.cardSecondary } }}>
                                Share
                            </Button>
                            <Button startIcon={post.saved ? <BookmarkIcon sx={{ fontSize: '14px !important', color: COLORS.brand }} /> : <BookmarkBorderIcon sx={{ fontSize: '14px !important' }} />}
                                size="small" onClick={() => onSave(post.id)}
                                sx={{ color: post.saved ? COLORS.brand : COLORS.fadedText, borderRadius: 2, fontSize: '0.75rem', px: 1.5, textTransform: 'none', '&:hover': { color: COLORS.brand, bgcolor: `${COLORS.brand}14` } }}>
                                Save
                            </Button>
                            <>
                                <IconButton size="small" onClick={e => setPostMenuAnchor(e.currentTarget)}
                                    sx={{ color: COLORS.fadedText, ml: 'auto', '&:hover': { color: COLORS.brand, bgcolor: `${COLORS.brand}14` } }}>
                                    <MoreVertIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                                <Menu anchorEl={postMenuAnchor} open={Boolean(postMenuAnchor)} onClose={() => setPostMenuAnchor(null)}
                                    PaperProps={{ sx: { bgcolor: COLORS.cardPrimary, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 2, minWidth: 140 } }}>
                                    {post.user_id === parseInt(userId) ? (
                                        <MenuItem onClick={() => { setPostMenuAnchor(null); deletePost(); }}
                                            sx={{ color: '#ff6b6b', fontSize: '0.82rem', gap: 1, '&:hover': { bgcolor: 'rgba(255,107,107,0.08)' } }}>
                                            <DeleteOutlineIcon sx={{ fontSize: 15 }} /> Delete Post
                                        </MenuItem>
                                    ) : (
                                        <MenuItem onClick={() => { setPostMenuAnchor(null); setReportDialog({ open: true, target: 'post', commentId: null }); }}
                                            sx={{ color: '#fb923c', fontSize: '0.82rem', gap: 1, '&:hover': { bgcolor: 'rgba(251,146,60,0.08)' } }}>
                                            <FlagOutlinedIcon sx={{ fontSize: 15 }} /> Report Post
                                        </MenuItem>
                                    )}
                                </Menu>
                            </>
                        </Stack>
                    </Box>

                    {/* comments */}
                    <Collapse in={showComments}>
                        <Box sx={{ px: 2.5, pb: 2, borderTop: `1px solid ${COLORS.cardBorder}` }}>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5, mb: 1.5 }}>
                                <TextField fullWidth size="small" placeholder="Write a comment..."
                                    value={newComment} onChange={(e) => setNewComment(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': { bgcolor: COLORS.cardSecondary, borderRadius: 2, color: COLORS.text, '& fieldset': { borderColor: 'transparent' }, '&:hover fieldset': { borderColor: COLORS.brand }, '&.Mui-focused fieldset': { borderColor: COLORS.brand } },
                                        '& .MuiInputBase-input': { py: '8px', fontSize: '0.82rem' },
                                        '& .MuiInputBase-input::placeholder': { color: COLORS.fadedText, opacity: 1 },
                                    }} />
                                <IconButton size="small" onClick={submitComment} disabled={!newComment.trim() || posting}
                                    sx={{ color: COLORS.brand, '&:disabled': { color: COLORS.fadedText } }}>
                                    {posting ? <CircularProgress size={16} sx={{ color: COLORS.brand }} /> : <SendIcon sx={{ fontSize: 18 }} />}
                                </IconButton>
                            </Stack>

                            {commentsLoading ? (
                                <Box sx={{ py: 2, textAlign: 'center' }}><CircularProgress size={18} sx={{ color: COLORS.brand }} /></Box>
                            ) : topLevel.length === 0 ? (
                                <Typography variant="caption" sx={{ color: COLORS.fadedText, fontStyle: 'italic' }}>No comments yet</Typography>
                            ) : (
                                <Stack spacing={0.5}>
                                    {topLevel.map(c => renderComment(c))}
                                </Stack>
                            )}
                        </Box>
                    </Collapse>

                    {/* Report Dialog */}
                    <Dialog open={reportDialog.open} onClose={() => { setReportDialog({ open: false, target: null, commentId: null }); setReportReason(''); setReportSuccess(false); }} maxWidth="xs" fullWidth
                        PaperProps={{ sx: { bgcolor: COLORS.cardPrimary, borderRadius: 3, border: `1px solid ${COLORS.cardBorder}` } }}>
                        <DialogTitle sx={{ color: COLORS.headings, fontWeight: 700, fontSize: '0.95rem', pb: 1 }}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <FlagOutlinedIcon sx={{ fontSize: 18, color: '#fb923c' }} />
                                <span>Report {reportDialog.target === 'comment' ? 'Comment' : 'Post'}</span>
                            </Stack>
                        </DialogTitle>
                        <DialogContent>
                            {reportSuccess ? (
                                <Alert severity="success" sx={{ borderRadius: 2 }}>Report submitted. Thank you!</Alert>
                            ) : (
                                <TextField fullWidth multiline minRows={2} placeholder="Why are you reporting this?" value={reportReason} onChange={e => setReportReason(e.target.value)}
                                    sx={{ mt: 1, '& .MuiOutlinedInput-root': { bgcolor: COLORS.cardSecondary, borderRadius: 2, color: COLORS.text, '& fieldset': { borderColor: COLORS.cardBorder }, '&:hover fieldset': { borderColor: '#fb923c' }, '&.Mui-focused fieldset': { borderColor: '#fb923c' } }, '& .MuiInputBase-input': { color: COLORS.text, fontSize: '0.85rem' } }} />
                            )}
                        </DialogContent>
                        {!reportSuccess && (
                            <DialogActions sx={{ px: 2, pb: 2 }}>
                                <Button onClick={() => { setReportDialog({ open: false, target: null, commentId: null }); setReportReason(''); }} sx={{ color: COLORS.fadedText, textTransform: 'none', borderRadius: 2 }}>Cancel</Button>
                                <Button onClick={submitReport} disabled={!reportReason.trim() || reportSubmitting} variant="contained"
                                    sx={{ bgcolor: '#fb923c', color: '#fff', borderRadius: 2, fontWeight: 700, textTransform: 'none', '&:hover': { bgcolor: '#f97316' }, '&:disabled': { opacity: 0.5 } }}>
                                    {reportSubmitting ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : 'Submit Report'}
                                </Button>
                            </DialogActions>
                        )}
                    </Dialog>

                    {/* Emoji picker popover — outside Collapse so it's not clipped */}
                    <Popover
                        open={Boolean(emojiAnchor)}
                        anchorEl={emojiAnchor?.el}
                        onClose={() => setEmojiAnchor(null)}
                        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                        PaperProps={{ sx: { bgcolor: COLORS.cardPrimary, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', p: 0.5 } }}>
                        <Stack direction="row" spacing={0.25} sx={{ p: 0.5 }}>
                            {EMOJI_LIST.map(emoji => {
                                const cmt = comments.find(c => c.id === emojiAnchor?.commentId);
                                const active = cmt?.reactions?.find(r => r.emoji === emoji)?.user_reacted;
                                return (
                                    <Box key={emoji} onClick={() => emojiAnchor && submitReaction(emojiAnchor.commentId, emoji)}
                                        sx={{
                                            fontSize: '1.3rem', lineHeight: 1, cursor: 'pointer', p: 0.6, borderRadius: 2,
                                            bgcolor: active ? `${COLORS.brand}20` : 'transparent',
                                            border: `1px solid ${active ? COLORS.brand + '50' : 'transparent'}`,
                                            transition: 'transform 0.1s',
                                            '&:hover': { transform: 'scale(1.3)', bgcolor: `${COLORS.brand}14` },
                                        }}>
                                        {emoji}
                                    </Box>
                                );
                            })}
                        </Stack>
                    </Popover>
                </Box>
            </Stack>
        </Card>
    );
};

// ── CreatePostDialog ────────────────────────────────────────────────────────
const CreatePostDialog = ({ open, onClose, userName, onCreated, myItineraries, defaultTag, COLORS, sharedItineraryId: defaultItinId }) => {
    const [title, setTitle]     = useState('');
    const [body, setBody]       = useState('');
    const [tag, setTag]         = useState('Experience');
    const [places, setPlaces]   = useState([]);
    const [imageUrl, setImageUrl] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError]     = useState('');
    const [attachedItinId, setAttachedItinId] = useState(null);

    useEffect(() => {
        if (open) {
            if (defaultTag) setTag(defaultTag);
            if (defaultItinId) setAttachedItinId(defaultItinId);
        }
    }, [open, defaultTag, defaultItinId]);

    const handleClose = () => {
        setTitle(''); setBody(''); setTag('Experience'); setPlaces([]); setImageUrl(''); setError(''); setAttachedItinId(null);
        onClose();
    };

    const handleSubmit = async () => {
        if (!title.trim() || places.length === 0) return;
        setSubmitting(true); setError('');
        try {
            const userId = localStorage.getItem('userId');
            const payload = {
                title: title.trim(), body: body.trim() || null, tag,
                place: places.join(', '), image_url: imageUrl.trim() || null,
            };
            if (attachedItinId) payload.shared_itinerary_id = attachedItinId;
            await axios.post(`${import.meta.env.VITE_BACKEND_API_URL}community/posts?user_id=${userId}`, payload);
            handleClose(); if (onCreated) onCreated();
        } catch { setError('Failed to create post. Please try again.'); }
        finally { setSubmitting(false); }
    };

    const addPlace    = (name) => { if (name && !places.includes(name)) setPlaces(prev => [...prev, name]); };
    const removePlace = (name) => setPlaces(prev => prev.filter(p => p !== name));

    const itinPlaces = {};
    (myItineraries || []).forEach(itin => {
        const ps = [];
        (itin.days || []).forEach(day => {
            (day.activities || []).forEach(act => {
                if (act.place_id && act.location && !ps.includes(act.location)) ps.push(act.location);
            });
        });
        if (ps.length > 0) itinPlaces[itin.title] = ps;
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
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: {
            bgcolor: COLORS.background, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 4,
            boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
            backgroundImage: 'linear-gradient(135deg, rgba(51,204,204,0.04) 0%, transparent 60%)',
        }}}>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${COLORS.cardBorder}`, pb: 2 }}>
                <Typography fontWeight="bold" sx={{ color: COLORS.headings }}>Create Post</Typography>
                <IconButton onClick={handleClose} sx={{ color: COLORS.fadedText, borderRadius: 2, '&:hover': { color: '#ff6b6b', bgcolor: 'rgba(255,107,107,0.1)' } }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: 3 }}>
                <Stack spacing={2.5}>
                    {error && <Alert severity="error" sx={{ bgcolor: 'rgba(255,107,107,0.1)', color: '#ff6b6b' }}>{error}</Alert>}

                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{ bgcolor: COLORS.brand, color: COLORS.background, width: 36, height: 36, fontWeight: 'bold', fontSize: '0.85rem' }}>
                            {userName?.[0]?.toUpperCase() || 'U'}
                        </Avatar>
                        <Typography variant="body2" sx={{ color: COLORS.subheadings }}>{userName || 'User'}</Typography>
                    </Stack>

                    {/* tag selector */}
                    <Box>
                        <Typography variant="caption" sx={{ color: COLORS.fadedText, mb: 1, display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Tag</Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                            {TAG_OPTIONS.map((t) => (
                                <Chip key={t} label={t} size="small" onClick={() => setTag(t)} sx={{
                                    cursor: 'pointer',
                                    bgcolor: tag === t ? `${TAG_COLORS[t]}25` : 'transparent',
                                    color: tag === t ? TAG_COLORS[t] : COLORS.fadedText,
                                    border: `1px solid ${tag === t ? TAG_COLORS[t] : COLORS.cardBorder}`,
                                    fontWeight: tag === t ? 700 : 400,
                                    '&:hover': { bgcolor: `${TAG_COLORS[t]}15`, color: TAG_COLORS[t] },
                                }} />
                            ))}
                        </Stack>
                    </Box>

                    {/* place selector */}
                    <Box>
                        <Typography variant="caption" sx={{ color: COLORS.fadedText, mb: 1, display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Place (at least one)
                        </Typography>

                        {places.length > 0 && (
                            <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5} sx={{ mb: 1.5 }}>
                                {places.map(p => (
                                    <Chip key={p} label={p} size="small" onDelete={() => removePlace(p)} sx={{
                                        bgcolor: 'rgba(51,204,204,0.12)', color: COLORS.brand,
                                        border: '1px solid rgba(51,204,204,0.3)', fontSize: '0.72rem', fontWeight: 600,
                                        '& .MuiChip-deleteIcon': { color: 'rgba(51,204,204,0.5)', fontSize: 14, '&:hover': { color: '#ff6b6b' } },
                                    }} />
                                ))}
                            </Stack>
                        )}

                        <Stack direction="row" spacing={1.5} alignItems="flex-start">
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <PlaceSearchAutocomplete
                                    label="Search place" value="" onChange={() => {}} onSelect={(p) => addPlace(p.name)}
                                    destinationContext={typeof filterMode === "number" ? myItineraries.find(i => i.id === filterMode)?.destination : undefined}
                                    inputSx={{
                                        '& .MuiOutlinedInput-root': { py: 0, height: 38, bgcolor: COLORS.cardSecondary, borderRadius: 2.5 },
                                        '& .MuiInputBase-input': { py: '7px', fontSize: '0.82rem' },
                                        '& .MuiInputLabel-root': { fontSize: '0.82rem', transform: 'translate(14px, 8px) scale(1)' },
                                        '& .MuiInputLabel-root.Mui-focused, & .MuiInputLabel-root.MuiFormLabel-filled': { transform: 'translate(14px, -9px) scale(0.75)' },
                                    }}
                                />
                            </Box>
                            <Typography variant="caption" sx={{ color: COLORS.fadedText, pt: 1, flexShrink: 0 }}>or</Typography>
                            <Select value="" onChange={(e) => { if (e.target.value) addPlace(e.target.value); }} size="small" displayEmpty
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
                                MenuProps={{ PaperProps: { sx: { bgcolor: COLORS.cardPrimary, border: `1px solid ${COLORS.cardBorder}`, maxHeight: 280 } } }}>
                                {Object.entries(itinPlaces).length === 0 ? (
                                    <MenuItem disabled sx={{ color: COLORS.fadedText, fontSize: '0.8rem' }}>No mapped places yet</MenuItem>
                                ) : (
                                    Object.entries(itinPlaces).map(([itinTitle, placeList]) => [
                                        <ListSubheader key={`h-${itinTitle}`} sx={{ bgcolor: COLORS.cardPrimary, color: COLORS.brand, fontSize: '0.7rem', fontWeight: 700, lineHeight: '26px' }}>
                                            {itinTitle}
                                        </ListSubheader>,
                                        ...placeList.map(p => (
                                            <MenuItem key={`${itinTitle}-${p}`} value={p} disabled={places.includes(p)}
                                                sx={{ color: places.includes(p) ? COLORS.fadedText : COLORS.text, fontSize: '0.8rem', pl: 3, '&:hover': { bgcolor: `${COLORS.brand}14` } }}>
                                                <LocationOnIcon sx={{ fontSize: 12, color: COLORS.fadedText, mr: 0.8 }} />{p}
                                                {places.includes(p) && <Typography sx={{ ml: 'auto', color: COLORS.brand, fontSize: '0.65rem' }}>added</Typography>}
                                            </MenuItem>
                                        ))
                                    ]).flat()
                                )}
                            </Select>
                        </Stack>
                    </Box>

                    <TextField fullWidth label="Title *" placeholder="What's on your mind?" value={title} onChange={(e) => setTitle(e.target.value)} sx={fieldSx} />
                    <TextField fullWidth label="Body" placeholder="Share your story, tips, or questions..." value={body} onChange={(e) => setBody(e.target.value)} multiline rows={5} sx={fieldSx} />

                    <Box>
                        <TextField fullWidth label="Image URL (optional)" placeholder="Paste an image link — unsplash, imgur, etc."
                            value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} size="small"
                            InputProps={{ startAdornment: <InputAdornment position="start"><ImageIcon sx={{ color: COLORS.fadedText, fontSize: 18 }} /></InputAdornment> }}
                            sx={fieldSx} />
                        {imageUrl.trim() && (
                            <Box sx={{ mt: 1, borderRadius: 2, overflow: 'hidden', maxHeight: 120, bgcolor: COLORS.cardSecondary, border: `1px solid ${COLORS.cardBorder}` }}>
                                <Box component="img" src={imageUrl.trim()} alt="Preview" onError={(e) => { e.target.style.display = 'none'; }}
                                    sx={{ width: '100%', maxHeight: 120, objectFit: 'cover', display: 'block' }} />
                            </Box>
                        )}
                    </Box>

                    {/* Attach Itinerary */}
                    {myItineraries.length > 0 && (
                        <Box>
                            <Typography variant="caption" sx={{ color: COLORS.fadedText, mb: 1, display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Attach Itinerary (optional)
                            </Typography>
                            <Select
                                value={attachedItinId || ''}
                                onChange={e => setAttachedItinId(e.target.value || null)}
                                displayEmpty size="small" fullWidth
                                renderValue={() => {
                                    if (!attachedItinId) return <span style={{ color: COLORS.fadedText, fontSize: '0.82rem' }}>None</span>;
                                    const itin = myItineraries.find(i => i.id === attachedItinId);
                                    return itin?.title || 'Selected';
                                }}
                                sx={{
                                    bgcolor: COLORS.cardSecondary, borderRadius: 2.5, color: COLORS.text, fontSize: '0.82rem',
                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
                                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.brand },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.brand },
                                    '& .MuiSelect-icon': { color: COLORS.fadedText },
                                }}
                                MenuProps={{ PaperProps: { sx: { bgcolor: COLORS.cardPrimary, border: `1px solid ${COLORS.cardBorder}`, maxHeight: 240 } } }}>
                                <MenuItem value="" sx={{ color: COLORS.fadedText, fontSize: '0.82rem' }}>None</MenuItem>
                                {myItineraries.map(itin => (
                                    <MenuItem key={itin.id} value={itin.id} sx={{ color: COLORS.text, fontSize: '0.82rem', '&:hover': { bgcolor: `${COLORS.brand}14` } }}>
                                        <ExploreIcon sx={{ fontSize: 13, color: COLORS.brand, mr: 1 }} />
                                        <Typography noWrap sx={{ fontSize: '0.82rem' }}>{itin.title}</Typography>
                                    </MenuItem>
                                ))}
                            </Select>
                        </Box>
                    )}
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${COLORS.cardBorder}` }}>
                <Button onClick={handleClose} sx={{ color: COLORS.fadedText, borderRadius: 2, '&:hover': { bgcolor: COLORS.cardSecondary } }}>Cancel</Button>
                <Button variant="contained" onClick={handleSubmit} disabled={!title.trim() || places.length === 0 || submitting} sx={{
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

// ── Main Component ───────────────────────────────────────────────────────────
const CommunityFeed = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { COLORS } = useTheme();
    const [highlightPostId, setHighlightPostId] = useState(location.state?.highlightPostId || null);

    const [user, setUser]               = useState({ id: null, name: 'User', initial: 'U', avatarId: 1 });
    const [posts, setPosts]             = useState([]);
    const [activeSort, setActiveSort]   = useState('new');
    const [activeTag, setActiveTag]     = useState(null);
    const [createOpen, setCreateOpen]   = useState(false);
    const [loading, setLoading]         = useState(true);
    const [filterMode, setFilterMode]   = useState('all');
    const [searchedPlace, setSearchedPlace] = useState('');
    const [myItineraries, setMyItineraries] = useState([]);
    const [recentAlerts, setRecentAlerts]   = useState([]);
    const [defaultTag, setDefaultTag]   = useState(null);
    const [showSaved, setShowSaved]     = useState(false);
    const [savedPosts, setSavedPosts]   = useState([]);
    const [savedLoading, setSavedLoading] = useState(false);
    const [sidebarPlace, setSidebarPlace] = useState('All');

    // profile dialog
    const [profileOpen, setProfileOpen]   = useState(false);
    const [profileUser, setProfileUser]   = useState(null);
    const [profilePosts, setProfilePosts] = useState([]);
    const [friendStatus, setFriendStatus] = useState({ status: 'none', friendship_id: null });
    const [friendLoading, setFriendLoading] = useState(false);

    useEffect(() => {
        const userId   = localStorage.getItem('userId');
        const userName = localStorage.getItem('userName');
        const username = localStorage.getItem('username');
        const avatarId = parseInt(localStorage.getItem('avatarId')) || 1;
        if (!userId) { navigate('/login'); return; }
        const displayName = username || userName || 'User';
        setUser({ id: parseInt(userId), name: displayName, initial: displayName[0].toUpperCase(), avatarId });
        fetchMyItineraries(userId);
    }, [navigate]);

    const fetchMyItineraries = async (userId) => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_API_URL}itineraries/user/${userId}`);
            const itins = Array.isArray(res.data) ? res.data : [];
            const detailed = [];
            for (const itin of itins) {
                try { const d = await axios.get(`${import.meta.env.VITE_BACKEND_API_URL}itineraries/${itin.id}`); detailed.push(d.data); }
                catch { detailed.push(itin); }
            }
            setMyItineraries(detailed);
        } catch { setMyItineraries([]); }
    };

    const fetchAlerts = useCallback(async () => {
        try {
            const places = [];
            if (typeof filterMode === 'number') {
                const itin = myItineraries.find(i => i.id === filterMode);
                if (itin) (itin.days || []).forEach(day => (day.activities || []).forEach(act => {
                    if (act.location) places.push(act.location);
                    if (act.formatted_address) KNOWN_CITIES.forEach(c => { if (act.formatted_address.toLowerCase().includes(c.toLowerCase())) places.push(c); });
                }));
            } else if (typeof filterMode === 'string' && filterMode !== 'all') {
                places.push(filterMode);
            } else if (sidebarPlace !== 'All') { places.push(sidebarPlace); }

            if (places.length === 0) {
                const res = await axios.get(`${import.meta.env.VITE_BACKEND_API_URL}community-updates`, { params: { active_only: true, limit: 5 } });
                setRecentAlerts(res.data || []);
            } else {
                const allAlerts = []; const seen = new Set();
                for (const loc of [...new Set(places)].slice(0, 5)) {
                    try {
                        const res = await axios.get(`${import.meta.env.VITE_BACKEND_API_URL}community-updates`, { params: { location: loc, active_only: true, limit: 3 } });
                        (res.data || []).forEach(a => { if (!seen.has(a.id)) { seen.add(a.id); allAlerts.push(a); } });
                    } catch { /* skip */ }
                }
                setRecentAlerts(allAlerts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5));
            }
        } catch { setRecentAlerts([]); }
    }, [filterMode, sidebarPlace, myItineraries]);

    useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

    const getPlaceFilter = useCallback(() => {
        if (filterMode === 'all') return sidebarPlace === 'All' ? null : sidebarPlace;
        if (typeof filterMode === 'string' && filterMode !== '__search__' && filterMode !== 'all') return filterMode;
        if (filterMode === '__search__' && searchedPlace) return searchedPlace;
        if (typeof filterMode === 'number') return sidebarPlace !== 'All' ? sidebarPlace : null;
        return null;
    }, [filterMode, sidebarPlace, searchedPlace]);

    const sidebarCities = (() => {
        const buildCityMap = (itins) => {
            const cityMap = {};
            itins.forEach(itin => (itin.days || []).forEach(day => (day.activities || []).forEach(act => {
                if (act.place_id && act.location) {
                    const text = `${act.location} ${act.formatted_address || ''}`.toLowerCase();
                    const matched = KNOWN_CITIES.find(c => text.includes(c.toLowerCase()));
                    if (matched) cityMap[matched] = (cityMap[matched] || 0) + 1;
                }
            })));
            return Object.entries(cityMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
        };
        if (filterMode === 'all') return buildCityMap(myItineraries);
        if (typeof filterMode === 'number') { const itin = myItineraries.find(i => i.id === filterMode); return itin ? buildCityMap([itin]) : []; }
        if (searchedPlace) return [{ name: searchedPlace, count: 0 }];
        return [];
    })();

    const getItinPlaceNames = useCallback(() => {
        if (typeof filterMode !== 'number') return [];
        const itin = myItineraries.find(i => i.id === filterMode);
        if (!itin) return [];
        const names = [];
        (itin.days || []).forEach(day => (day.activities || []).forEach(act => {
            if (act.location) names.push(act.location.toLowerCase());
            if (act.formatted_address) KNOWN_CITIES.forEach(c => { if (act.formatted_address.toLowerCase().includes(c.toLowerCase())) names.push(c.toLowerCase()); });
        }));
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
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_API_URL}community/posts`, { params });
            let results = res.data || [];
            if (typeof filterMode === 'number' && sidebarPlace === 'All') {
                const names = getItinPlaceNames();
                if (names.length > 0) results = results.filter(p => p.place && names.some(n => p.place.toLowerCase().includes(n) || n.includes(p.place.toLowerCase())));
            }
            setPosts(results);
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, [activeSort, activeTag, filterMode, sidebarPlace, searchedPlace, getPlaceFilter, getItinPlaceNames]);

    useEffect(() => { if (user.id) fetchPosts(); }, [user.id, fetchPosts]);

    // Scroll to and highlight a post when navigated from a notification
    useEffect(() => {
        if (!highlightPostId || posts.length === 0) return;
        const el = document.getElementById(`post-${highlightPostId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.style.transition = 'box-shadow 0.3s';
            el.style.boxShadow = `0 0 0 2px #33CCCC, 0 4px 24px rgba(51,204,204,0.35)`;
            setTimeout(() => { el.style.boxShadow = ''; }, 2500);
            setHighlightPostId(null);
            // Clear navigation state so re-renders don't re-trigger
            window.history.replaceState({}, '');
        }
    }, [highlightPostId, posts]);

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
        try { await axios.post(`${import.meta.env.VITE_BACKEND_API_URL}community/posts/${postId}/vote?user_id=${userId}`, { direction }); }
        catch { fetchPosts(); }
    };

    const handleSave = async (postId) => {
        const userId = localStorage.getItem('userId');
        const targetPost = posts.find(p => p.id === postId) || savedPosts.find(p => p.id === postId);
        const isSaved = targetPost?.saved;
        // optimistic toggle
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, saved: !p.saved } : p));
        setSavedPosts(prev => {
            if (isSaved) return prev.filter(p => p.id !== postId);
            if (targetPost && !prev.some(p => p.id === postId)) return [...prev, { ...targetPost, saved: true }];
            return prev;
        });
        try {
            await axios.post(`${import.meta.env.VITE_BACKEND_API_URL}community/posts/${postId}/save?user_id=${userId}`);
        } catch { /* revert on failure */
            setPosts(prev => prev.map(p => p.id === postId ? { ...p, saved: !p.saved } : p));
            setSavedPosts(prev => {
                if (isSaved && targetPost) return [...prev, { ...targetPost, saved: true }];
                return prev.filter(p => p.id !== postId);
            });
        }
    };

    const fetchSavedPosts = async () => {
        const userId = localStorage.getItem('userId');
        setSavedLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_API_URL}community/saved?user_id=${userId}`);
            setSavedPosts(res.data || []);
        } catch { /* silent */ }
        finally { setSavedLoading(false); }
    };

    // load saved posts whenever showSaved is toggled on
    useEffect(() => { if (showSaved) fetchSavedPosts(); }, [showSaved]);
    const handleFilterChange = (val) => { setSidebarPlace('All'); setSearchedPlace(''); setFilterMode(val === 'all' ? 'all' : val); };

    const openUserProfile = async (targetUserId) => {
        setProfileOpen(true); setProfileUser(null); setProfilePosts([]); setFriendStatus({ status: 'none', friendship_id: null });
        try {
            const [profileRes, postsRes, statusRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_BACKEND_API_URL}users/${targetUserId}/public`),
                axios.get(`${import.meta.env.VITE_BACKEND_API_URL}community/posts`, { params: { user_id: user.id, sort: 'new' } }),
                axios.get(`${import.meta.env.VITE_BACKEND_API_URL}friends/status/${targetUserId}`, { params: { user_id: user.id } }),
            ]);
            setProfileUser(profileRes.data);
            setProfilePosts((postsRes.data || []).filter(p => p.user_id === targetUserId).slice(0, 10));
            setFriendStatus(statusRes.data || { status: 'none' });
        } catch { /* silent */ }
    };

    const sendFriendRequest = async () => {
        if (!profileUser) return; setFriendLoading(true);
        try {
            await axios.post(`${import.meta.env.VITE_BACKEND_API_URL}friends/request?user_id=${user.id}`, { receiver_username: profileUser.username });
            setFriendStatus({ status: 'pending', is_requester: true });
        } catch (e) {
            const detail = e.response?.data?.detail || '';
            if (detail.includes('Already friends')) setFriendStatus({ status: 'accepted' });
            if (detail.includes('pending')) setFriendStatus({ status: 'pending', is_requester: true });
        } finally { setFriendLoading(false); }
    };

    const acceptFriendFromProfile = async (fromUserId) => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_API_URL}friends/status/${fromUserId}`, { params: { user_id: user.id } });
            if (res.data?.friendship_id) await axios.patch(`${import.meta.env.VITE_BACKEND_API_URL}friends/${res.data.friendship_id}/accept?user_id=${user.id}`);
        } catch { /* silent */ }
    };

    const rejectFriendFromProfile = async (fromUserId) => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_API_URL}friends/status/${fromUserId}`, { params: { user_id: user.id } });
            if (res.data?.friendship_id) await axios.patch(`${import.meta.env.VITE_BACKEND_API_URL}friends/${res.data.friendship_id}/reject?user_id=${user.id}`);
        } catch { /* silent */ }
    };

    return (
        <Box sx={{ display: 'flex', bgcolor: COLORS.background, minHeight: '100vh', width: '100vw', position: 'fixed', top: 0, left: 0, overflow: 'hidden' }}>

            <Navbar />

            <Box component="main" sx={{
                flexGrow: 1, height: '100vh', overflow: 'auto', display: 'flex', flexDirection: 'column',
                '&::-webkit-scrollbar': { width: 6 },
                '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
                '&::-webkit-scrollbar-thumb': { bgcolor: COLORS.cardSecondary, borderRadius: 3 },
            }}>

                {/* 3-column body */}
                <Box sx={{ flex: 1, px: 4, pt: 2, pb: 3, display: 'flex', gap: 3, minHeight: 0 }}>

                    {/* CENTER: posts feed */}
                    <Box sx={{ flex: 'none', width: 850, marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {/* filter bar */}
                        <Box sx={{ bgcolor: COLORS.cardPrimary, borderRadius: 3, border: `1px solid ${COLORS.cardBorder}`, px: 1.5, py: 1, flexShrink: 0 }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Select
                                    value={typeof filterMode === 'number' ? filterMode : 'all'}
                                    onChange={(e) => { handleFilterChange(e.target.value); setSearchedPlace(''); }}
                                    size="small"
                                    renderValue={() => {
                                        if (typeof filterMode === 'string' && filterMode !== 'all') return filterMode;
                                        if (filterMode === 'all') return 'All Posts';
                                        if (typeof filterMode === 'number') { const itin = myItineraries.find(i => i.id === filterMode); return itin?.title || 'Itinerary'; }
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
                                    MenuProps={{ PaperProps: { sx: { bgcolor: COLORS.cardPrimary, border: `1px solid ${COLORS.cardBorder}`, maxHeight: 340 } } }}>
                                    <MenuItem value="all" sx={{ color: COLORS.text, fontSize: '0.82rem', '&:hover': { bgcolor: `${COLORS.brand}14` } }}>All Posts</MenuItem>
                                    {myItineraries.length > 0 && <ListSubheader sx={{ bgcolor: COLORS.cardPrimary, color: COLORS.fadedText, fontSize: '0.65rem', fontWeight: 700, lineHeight: '24px', textTransform: 'uppercase', letterSpacing: 1 }}>My Itineraries</ListSubheader>}
                                    {myItineraries.map(itin => (
                                        <MenuItem key={itin.id} value={itin.id} sx={{ color: COLORS.text, fontSize: '0.82rem', '&:hover': { bgcolor: `${COLORS.brand}14` }, '&.Mui-selected': { bgcolor: `${COLORS.brand}20` } }}>
                                            <LocationOnIcon sx={{ fontSize: 13, color: COLORS.brand, mr: 1 }} />
                                            <Typography noWrap sx={{ fontSize: '0.82rem' }}>{itin.title}</Typography>
                                        </MenuItem>
                                    ))}
                                </Select>

                                <Box sx={{ width: '1px', height: 20, bgcolor: COLORS.cardBorder, flexShrink: 0 }} />

                                {FILTER_OPTIONS.map((f) => (
                                    <Button key={f.label}
                                        startIcon={React.cloneElement(f.icon, { sx: { fontSize: '13px !important' } })}
                                        size="small" onClick={() => setActiveSort(f.sort)}
                                        sx={{
                                            color: activeSort === f.sort ? COLORS.brand : COLORS.fadedText,
                                            fontWeight: activeSort === f.sort ? 700 : 500, borderRadius: 2,
                                            bgcolor: activeSort === f.sort ? `${COLORS.brand}1A` : 'transparent',
                                            py: '4px', px: 1.5, textTransform: 'none', fontSize: '0.78rem', whiteSpace: 'nowrap',
                                            '& .MuiButton-startIcon': { mr: 0.4 },
                                            '&:hover': { color: COLORS.brand, bgcolor: `${COLORS.brand}14` },
                                        }}>{f.label}</Button>
                                ))}

                                <Box sx={{ flex: 1 }} />

                                {TAG_OPTIONS.map((t) => (
                                    <Chip key={t} label={t} size="small" onClick={() => setActiveTag(activeTag === t ? null : t)} sx={{
                                        cursor: 'pointer', height: 26, fontSize: '0.72rem', px: 0.3,
                                        bgcolor: activeTag === t ? `${TAG_COLORS[t]}20` : 'transparent',
                                        color: activeTag === t ? TAG_COLORS[t] : COLORS.fadedText,
                                        border: `1px solid ${activeTag === t ? TAG_COLORS[t] : COLORS.cardBorder}`,
                                        fontWeight: activeTag === t ? 700 : 500,
                                        '&:hover': { bgcolor: `${TAG_COLORS[t]}12`, color: TAG_COLORS[t] },
                                    }} />
                                ))}

                                <Box sx={{ width: '1px', height: 20, bgcolor: COLORS.cardBorder, flexShrink: 0 }} />

                                <Button
                                    startIcon={showSaved ? <BookmarkIcon sx={{ fontSize: '13px !important', color: COLORS.brand }} /> : <BookmarkBorderIcon sx={{ fontSize: '13px !important' }} />}
                                    size="small"
                                    onClick={() => setShowSaved(v => !v)}
                                    sx={{
                                        color: showSaved ? COLORS.brand : COLORS.fadedText,
                                        fontWeight: showSaved ? 700 : 500, borderRadius: 2,
                                        bgcolor: showSaved ? `${COLORS.brand}1A` : 'transparent',
                                        py: '4px', px: 1.5, textTransform: 'none', fontSize: '0.78rem', whiteSpace: 'nowrap',
                                        '& .MuiButton-startIcon': { mr: 0.4 },
                                        '&:hover': { color: COLORS.brand, bgcolor: `${COLORS.brand}14` },
                                    }}>
                                    Saved{savedPosts.length > 0 ? ` (${savedPosts.length})` : ''}
                                </Button>
                            </Stack>
                        </Box>

                        {/* place search bar — between filter bar and posts */}
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box sx={{ flex: 1 }}>
                                <PlaceSearchAutocomplete
                                    label="Search places to filter posts..."
                                    value={searchedPlace}
                                    destinationContext={typeof filterMode === "number" ? myItineraries.find(i => i.id === filterMode)?.destination : undefined}
                                    onChange={(t) => { setSearchedPlace(t); if (!t) handleFilterChange('all'); }}
                                    onSelect={(place) => { setSearchedPlace(place.name); setFilterMode(place.name); setSidebarPlace('All'); }}
                                    inputSx={{ '& .MuiOutlinedInput-root': { bgcolor: COLORS.cardPrimary, borderRadius: 3 } }}
                                />
                            </Box>
                            <Button
                                variant="contained"
                                startIcon={<SearchIcon sx={{ fontSize: 17 }} />}
                                onClick={() => { if (searchedPlace) { setFilterMode(searchedPlace); setSidebarPlace('All'); } }}
                                sx={{ bgcolor: COLORS.brand, color: COLORS.background, fontWeight: 700, borderRadius: 3, px: 2.5, py: 1.2, textTransform: 'none', whiteSpace: 'nowrap', flexShrink: 0, '&:hover': { bgcolor: '#2db8b8' } }}>
                                Search
                            </Button>
                            {searchedPlace && (
                                <IconButton onClick={() => { setSearchedPlace(''); handleFilterChange('all'); }}
                                    sx={{ color: COLORS.fadedText, borderRadius: 2, '&:hover': { color: '#ff6b6b', bgcolor: 'rgba(255,107,107,0.08)' } }}>
                                    <CloseIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                            )}
                        </Stack>

                        {/* posts list */}
                        <Box sx={{ flex: 1, overflowY: 'auto', pr: 0.5, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: COLORS.cardSecondary, borderRadius: 2 } }}>
                            {showSaved ? (
                                <Stack spacing={2.5}>
                                    {/* saved posts header */}
                                    <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 0.5 }}>
                                        <BookmarkIcon sx={{ fontSize: 18, color: COLORS.brand }} />
                                        <Typography fontWeight={700} sx={{ color: COLORS.headings, fontSize: '0.95rem' }}>Saved Posts</Typography>
                                        <Chip label={savedPosts.length} size="small" sx={{ height: 20, fontSize: '0.7rem', bgcolor: `${COLORS.brand}20`, color: COLORS.brand, border: `1px solid ${COLORS.brand}40`, '& .MuiChip-label': { px: 0.8 } }} />
                                        <Box sx={{ flex: 1 }} />
                                        <Button size="small" onClick={() => setShowSaved(false)}
                                            sx={{ color: COLORS.fadedText, textTransform: 'none', fontSize: '0.75rem', borderRadius: 2, '&:hover': { color: COLORS.brand } }}>
                                            ← Back to feed
                                        </Button>
                                    </Stack>
                                    {savedLoading ? (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}><CircularProgress sx={{ color: COLORS.brand }} /></Box>
                                    ) : savedPosts.length === 0 ? (
                                        <Box sx={{ textAlign: 'center', py: 8 }}>
                                            <BookmarkBorderIcon sx={{ fontSize: 48, color: COLORS.fadedText, mb: 1.5 }} />
                                            <Typography sx={{ color: COLORS.fadedText, mb: 0.5 }}>No saved posts yet</Typography>
                                            <Typography variant="body2" sx={{ color: COLORS.fadedText }}>Bookmark posts to find them here later.</Typography>
                                        </Box>
                                    ) : (
                                        savedPosts.map((post) => (
                                            <PostCard key={post.id} post={post} onVote={handleVote} onSave={handleSave}
                                                onDelete={(id) => { setSavedPosts(p => p.filter(x => x.id !== id)); setPosts(p => p.filter(x => x.id !== id)); }}
                                                userId={user.id} onProfileClick={(uid) => openUserProfile(uid)} COLORS={COLORS} navigate={navigate} highlighted={false} />
                                        ))
                                    )}
                                </Stack>
                            ) : loading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}><CircularProgress sx={{ color: COLORS.brand }} /></Box>
                            ) : (
                                <Stack spacing={2.5}>
                                    {/* inline create prompt */}
                                    <Card sx={{ bgcolor: COLORS.cardPrimary, borderRadius: 4, border: `1px solid ${COLORS.cardBorder}`, boxShadow: 'none' }}>
                                        <CardContent>
                                            <Stack direction="row" spacing={1.5} alignItems="center">
                                                <Avatar src={getAvatarUrl(user.avatarId)} sx={{ bgcolor: COLORS.cardSecondary, width: 36, height: 36, flexShrink: 0 }} />
                                                <Box onClick={() => setCreateOpen(true)} sx={{
                                                    flex: 1, bgcolor: COLORS.cardSecondary, borderRadius: 2.5, px: 2, py: 1.25, cursor: 'text',
                                                    border: `1px solid transparent`, transition: 'all 0.2s',
                                                    '&:hover': { bgcolor: `${COLORS.brand}0A`, border: `1px solid ${COLORS.brand}30` },
                                                }}>
                                                    <Typography variant="body2" sx={{ color: COLORS.fadedText }}>Share your Nepal travel experience...</Typography>
                                                </Box>
                                                <IconButton onClick={() => setCreateOpen(true)} sx={{ color: COLORS.fadedText, borderRadius: 2, '&:hover': { color: COLORS.brand, bgcolor: `${COLORS.brand}14` } }}><ImageIcon /></IconButton>
                                                <IconButton onClick={() => setCreateOpen(true)} sx={{ color: COLORS.fadedText, borderRadius: 2, '&:hover': { color: COLORS.brand, bgcolor: `${COLORS.brand}14` } }}><EditNoteIcon /></IconButton>
                                            </Stack>
                                        </CardContent>
                                    </Card>

                                    {posts.length === 0 && !loading && (
                                        <Box sx={{ textAlign: 'center', py: 6 }}>
                                            <Typography sx={{ color: COLORS.fadedText, mb: 1 }}>No posts yet</Typography>
                                            <Typography variant="body2" sx={{ color: COLORS.fadedText }}>Be the first to share something with the community!</Typography>
                                        </Box>
                                    )}

                                    {posts.map((post) => (
                                        <PostCard key={post.id} post={post} onVote={handleVote} onSave={handleSave}
                                            onDelete={(id) => setPosts(p => p.filter(x => x.id !== id))}
                                            userId={user.id} onProfileClick={(uid) => openUserProfile(uid)} COLORS={COLORS} navigate={navigate} highlighted={highlightPostId === post.id} />
                                    ))}
                                </Stack>
                            )}
                        </Box>
                    </Box>

                    {/* RIGHT sidebar */}
                    <Box sx={{
                        width: 300, flexShrink: 0, marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: 2,
                        overflowY: 'auto', '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: COLORS.cardSecondary, borderRadius: 2 },
                    }}>
                        {/* welcome + create */}
                        <Card sx={{ bgcolor: COLORS.cardPrimary, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 4, boxShadow: 'none', overflow: 'hidden' }}>
                            <Box sx={{ height: 6, background: `linear-gradient(90deg, ${COLORS.brand}, ${COLORS.brand}30)` }} />
                            <CardContent sx={{ py: 2, px: 2.5 }}>
                                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                                    <Avatar src={getAvatarUrl(user.avatarId)} sx={{ bgcolor: COLORS.cardSecondary, width: 32, height: 32 }} />
                                    <Typography variant="subtitle2" fontWeight="bold" sx={{ color: COLORS.headings }}>Welcome, {user.name}</Typography>
                                </Stack>
                                <Button fullWidth variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)} sx={{
                                    bgcolor: COLORS.brand, color: COLORS.background, fontWeight: 'bold', borderRadius: 2.5,
                                    textTransform: 'none', fontSize: '0.82rem', py: 0.8, '&:hover': { bgcolor: '#2db8b8' },
                                }}>Create Post</Button>
                            </CardContent>
                        </Card>

                        {/* saved posts card */}
                        <Card sx={{ bgcolor: COLORS.cardPrimary, border: `1px solid ${showSaved ? COLORS.brand + '60' : COLORS.cardBorder}`, borderRadius: 4, boxShadow: 'none', transition: 'border-color 0.2s' }}>
                            <CardContent sx={{ py: 2, px: 2.5, pb: '16px !important' }}>
                                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                                    <BookmarkIcon sx={{ fontSize: 15, color: COLORS.brand }} />
                                    <Typography variant="caption" fontWeight="bold" sx={{ color: COLORS.fadedText, textTransform: 'uppercase', letterSpacing: 1, flex: 1 }}>Saved Posts</Typography>
                                    {savedPosts.length > 0 && (
                                        <Chip label={savedPosts.length} size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: `${COLORS.brand}20`, color: COLORS.brand, border: `1px solid ${COLORS.brand}40`, '& .MuiChip-label': { px: 0.7 } }} />
                                    )}
                                </Stack>
                                <Button fullWidth size="small"
                                    startIcon={showSaved ? <BookmarkIcon sx={{ fontSize: '14px !important', color: COLORS.brand }} /> : <BookmarkBorderIcon sx={{ fontSize: '14px !important' }} />}
                                    onClick={() => setShowSaved(v => !v)}
                                    sx={{
                                        color: showSaved ? COLORS.brand : COLORS.fadedText,
                                        bgcolor: showSaved ? `${COLORS.brand}14` : COLORS.cardSecondary,
                                        borderRadius: 2, textTransform: 'none', fontSize: '0.8rem', fontWeight: showSaved ? 700 : 500,
                                        border: `1px solid ${showSaved ? COLORS.brand + '40' : 'transparent'}`,
                                        py: 0.6, '&:hover': { color: COLORS.brand, bgcolor: `${COLORS.brand}14` },
                                        justifyContent: 'flex-start', px: 1.5,
                                    }}>
                                    {showSaved ? 'Viewing saved posts' : savedPosts.length > 0 ? `View ${savedPosts.length} saved post${savedPosts.length !== 1 ? 's' : ''}` : 'View saved posts'}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* cities */}
                        <Card sx={{ bgcolor: COLORS.cardPrimary, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 4, boxShadow: 'none' }}>
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
                                                sx={{ cursor: 'pointer', borderRadius: 2, px: 1, py: 0.6, bgcolor: sidebarPlace === 'All' ? `${COLORS.brand}14` : 'transparent', '&:hover': { bgcolor: COLORS.cardSecondary } }}>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: sidebarPlace === 'All' ? COLORS.brand : COLORS.fadedText }} />
                                                    <Typography variant="caption" sx={{ color: sidebarPlace === 'All' ? COLORS.brand : COLORS.text, fontSize: '0.78rem', fontWeight: sidebarPlace === 'All' ? 700 : 400 }}>All Cities</Typography>
                                                </Stack>
                                                <Typography variant="caption" sx={{ color: COLORS.fadedText, fontSize: '0.65rem' }}>{sidebarCities.length}</Typography>
                                            </Stack>
                                        )}
                                        {sidebarCities.map(city => (
                                            <Stack key={city.name} direction="row" justifyContent="space-between" alignItems="center"
                                                onClick={() => setSidebarPlace(city.name)}
                                                sx={{ cursor: 'pointer', borderRadius: 2, px: 1, py: 0.6, bgcolor: sidebarPlace === city.name ? `${COLORS.brand}14` : 'transparent', '&:hover': { bgcolor: COLORS.cardSecondary } }}>
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
                        <Card sx={{ bgcolor: COLORS.cardPrimary, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 4, boxShadow: 'none' }}>
                            <CardContent sx={{ pb: '12px !important' }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                                    <Typography variant="caption" fontWeight="bold" sx={{ color: '#FFB74D', textTransform: 'uppercase', letterSpacing: 1 }}>Recent Alerts</Typography>
                                    <WarningAmberIcon sx={{ fontSize: 14, color: '#FFB74D' }} />
                                </Stack>
                                {recentAlerts.length === 0 ? (
                                    <Typography variant="caption" sx={{ color: COLORS.fadedText, fontStyle: 'italic', fontSize: '0.75rem', display: 'block' }}>No recent alerts for this area.</Typography>
                                ) : (
                                    <Stack spacing={1}>
                                        {recentAlerts.slice(0, 4).map(alert => {
                                            const sevColor = { info: COLORS.brand, warning: '#FFB74D', urgent: '#ff6b6b' }[alert.severity] || '#FFB74D';
                                            return (
                                                <Box key={alert.id} sx={{ borderLeft: `2px solid ${sevColor}`, pl: 1.2, py: 0.3 }}>
                                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                                        <Typography sx={{ color: sevColor, fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase' }}>{alert.update_type}</Typography>
                                                        <Typography sx={{ color: COLORS.fadedText, fontSize: '0.6rem' }}>·</Typography>
                                                        <Typography sx={{ color: COLORS.fadedText, fontSize: '0.6rem' }}>{timeAgo(alert.created_at)}</Typography>
                                                    </Stack>
                                                    <Typography noWrap sx={{ color: COLORS.text, fontSize: '0.75rem', fontWeight: 600 }}>{alert.title}</Typography>
                                                    <Stack direction="row" spacing={0.3} alignItems="center">
                                                        <LocationOnIcon sx={{ fontSize: 10, color: COLORS.fadedText }} />
                                                        <Typography noWrap sx={{ color: COLORS.fadedText, fontSize: '0.65rem' }}>{alert.location}</Typography>
                                                    </Stack>
                                                </Box>
                                            );
                                        })}
                                    </Stack>
                                )}
                                <Button startIcon={<WarningAmberIcon sx={{ fontSize: '14px !important' }} />} fullWidth
                                    onClick={() => { setDefaultTag('Alert'); setCreateOpen(true); }} sx={{
                                        mt: 1.5, color: '#FFB74D', bgcolor: 'rgba(255,183,77,0.08)', borderRadius: 2,
                                        border: '1px dashed rgba(255,183,77,0.25)', textTransform: 'none', fontWeight: 'bold',
                                        fontSize: '0.78rem', py: 0.6, '&:hover': { bgcolor: 'rgba(255,183,77,0.14)', borderColor: '#FFB74D' },
                                    }}>Report Alert</Button>
                            </CardContent>
                        </Card>
                    </Box>
                </Box>
            </Box>

            {/* Create post dialog — pass COLORS as prop */}
            <CreatePostDialog
                open={createOpen}
                onClose={() => { setCreateOpen(false); setDefaultTag(null); }}
                userName={user.name}
                onCreated={() => { fetchPosts(); fetchAlerts(); }}
                myItineraries={myItineraries}
                defaultTag={defaultTag}
                COLORS={COLORS}
            />

            {/* User profile dialog */}
            <Dialog open={profileOpen} onClose={() => setProfileOpen(false)} maxWidth="sm" fullWidth
                PaperProps={{ sx: { bgcolor: COLORS.background, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 4, boxShadow: '0 24px 64px rgba(0,0,0,0.7)', maxHeight: '85vh' } }}>
                {!profileUser ? (
                    <Box sx={{ py: 8, textAlign: 'center' }}><CircularProgress size={28} sx={{ color: COLORS.brand }} /></Box>
                ) : (
                    <>
                        <Box sx={{ position: 'relative' }}>
                            <Box sx={{ height: 80, background: `linear-gradient(135deg, ${getAvatarColor(profileUser.avatar_id)}40, rgba(20,22,39,0.9))` }} />
                            <IconButton onClick={() => setProfileOpen(false)}
                                sx={{ position: 'absolute', top: 8, right: 8, color: COLORS.fadedText, '&:hover': { color: '#ff6b6b' } }}>
                                <CloseIcon />
                            </IconButton>
                            <Box sx={{ px: 3, mt: -4 }}>
                                <Avatar src={getAvatarUrl(profileUser.avatar_id)} sx={{
                                    width: 64, height: 64, borderRadius: 3,
                                    bgcolor: COLORS.cardPrimary, border: `3px solid ${COLORS.background}`,
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                                }} />
                            </Box>
                        </Box>

                        <DialogContent sx={{ pt: 1.5 }}>
                            <Stack spacing={2.5}>
                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                    <Box>
                                        <Typography variant="h6" fontWeight="bold" sx={{ color: COLORS.headings, fontSize: '1.1rem' }}>{profileUser.username || 'User'}</Typography>
                                        {profileUser.bio && <Typography variant="body2" sx={{ color: COLORS.fadedText, mt: 0.3, fontSize: '0.82rem' }}>{profileUser.bio}</Typography>}
                                        {profileUser.location && (
                                            <Stack direction="row" spacing={0.4} alignItems="center" sx={{ mt: 0.5 }}>
                                                <LocationOnIcon sx={{ fontSize: 13, color: COLORS.fadedText }} />
                                                <Typography variant="caption" sx={{ color: COLORS.fadedText }}>{profileUser.location}</Typography>
                                            </Stack>
                                        )}
                                    </Box>
                                    {friendStatus.status === 'accepted' ? (
                                        <Chip icon={<CheckCircleIcon sx={{ fontSize: 14 }} />} label="Friends" size="small"
                                            sx={{ bgcolor: 'rgba(76,175,80,0.12)', color: '#4CAF50', border: '1px solid rgba(76,175,80,0.3)', fontWeight: 600, fontSize: '0.72rem' }} />
                                    ) : friendStatus.status === 'pending' ? (
                                        friendStatus.is_requester ? (
                                            <Chip icon={<HourglassEmptyIcon sx={{ fontSize: 13 }} />} label="Pending" size="small"
                                                sx={{ bgcolor: 'rgba(255,183,77,0.12)', color: '#FFB74D', border: '1px solid rgba(255,183,77,0.3)', fontWeight: 600, fontSize: '0.72rem' }} />
                                        ) : (
                                            <Stack direction="row" spacing={0.5}>
                                                <Button size="small" variant="contained" onClick={async () => { await acceptFriendFromProfile(profileUser.id); setFriendStatus({ status: 'accepted' }); }}
                                                    sx={{ bgcolor: COLORS.brand, color: COLORS.background, fontSize: '0.7rem', px: 1.5, py: 0.3, borderRadius: 2, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#2db8b8' } }}>Accept</Button>
                                                <Button size="small" onClick={async () => { await rejectFriendFromProfile(profileUser.id); setFriendStatus({ status: 'none' }); }}
                                                    sx={{ color: COLORS.fadedText, fontSize: '0.7rem', px: 1, py: 0.3, borderRadius: 2, textTransform: 'none', '&:hover': { color: '#ff6b6b' } }}>Decline</Button>
                                            </Stack>
                                        )
                                    ) : (
                                        <Button size="small" variant="contained"
                                            startIcon={friendLoading ? <CircularProgress size={12} sx={{ color: COLORS.background }} /> : <PersonAddIcon sx={{ fontSize: 14 }} />}
                                            onClick={sendFriendRequest} disabled={friendLoading}
                                            sx={{ bgcolor: COLORS.brand, color: COLORS.background, fontSize: '0.72rem', px: 2, py: 0.5, borderRadius: 2, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#2db8b8' }, '&:disabled': { bgcolor: COLORS.cardSecondary, color: COLORS.fadedText } }}>
                                            Add Friend
                                        </Button>
                                    )}
                                </Stack>

                                <Typography variant="caption" sx={{ color: COLORS.fadedText, fontSize: '0.7rem' }}>
                                    Member since {new Date(profileUser.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </Typography>

                                <Box>
                                    <Typography variant="caption" fontWeight="bold" sx={{ color: COLORS.fadedText, textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 1.5 }}>
                                        Posts ({profilePosts.length})
                                    </Typography>
                                    {profilePosts.length === 0 ? (
                                        <Typography variant="caption" sx={{ color: COLORS.fadedText, fontStyle: 'italic' }}>No posts yet</Typography>
                                    ) : (
                                        <Stack spacing={1}>
                                            {profilePosts.map(p => {
                                                const tc = TAG_COLORS[p.tag] || COLORS.brand;
                                                return (
                                                    <Box key={p.id} sx={{ bgcolor: COLORS.cardPrimary, borderRadius: 2.5, px: 2, py: 1.2, border: `1px solid ${COLORS.cardBorder}` }}>
                                                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                                                            <Chip label={p.tag} size="small" sx={{ height: 16, fontSize: '0.58rem', bgcolor: `${tc}20`, color: tc, border: `1px solid ${tc}40`, '& .MuiChip-label': { px: 0.6 } }} />
                                                            {p.place && p.place !== 'All' && <Typography variant="caption" sx={{ color: COLORS.brand, fontSize: '0.65rem' }}>{p.place}</Typography>}
                                                            <Typography variant="caption" sx={{ color: COLORS.fadedText, fontSize: '0.6rem' }}>{timeAgo(p.created_at)}</Typography>
                                                        </Stack>
                                                        <Typography sx={{ color: COLORS.headings, fontSize: '0.85rem', fontWeight: 600 }}>{p.title}</Typography>
                                                        {p.body && <Typography noWrap sx={{ color: COLORS.fadedText, fontSize: '0.75rem', mt: 0.3 }}>{p.body}</Typography>}
                                                        <Stack direction="row" spacing={1.5} sx={{ mt: 0.5 }}>
                                                            <Typography variant="caption" sx={{ color: COLORS.fadedText, fontSize: '0.62rem' }}>{p.upvotes - p.downvotes} votes</Typography>
                                                            <Typography variant="caption" sx={{ color: COLORS.fadedText, fontSize: '0.62rem' }}>{p.comment_count || 0} comments</Typography>
                                                        </Stack>
                                                    </Box>
                                                );
                                            })}
                                        </Stack>
                                    )}
                                </Box>
                            </Stack>
                        </DialogContent>
                    </>
                )}
            </Dialog>
        </Box>
    );
};

export default CommunityFeed;