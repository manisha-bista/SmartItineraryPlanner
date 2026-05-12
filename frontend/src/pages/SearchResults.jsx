import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Stack, Card, CardMedia, CardContent,
    TextField, InputAdornment, Button, Chip, CircularProgress,
    Select, MenuItem, FormControl, InputLabel, Divider, IconButton,
    ToggleButtonGroup, ToggleButton, Tooltip,
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import Navbar, { DRAWER_WIDTH } from '../components/Navbar';

import SearchIcon         from '@mui/icons-material/Search';
import LocationOnIcon     from '@mui/icons-material/LocationOn';
import CalendarTodayIcon  from '@mui/icons-material/CalendarToday';
import FavoriteIcon       from '@mui/icons-material/Favorite';
import VisibilityIcon     from '@mui/icons-material/Visibility';
import GridViewIcon       from '@mui/icons-material/GridView';
import ViewListIcon       from '@mui/icons-material/ViewList';
import TuneIcon           from '@mui/icons-material/Tune';
import StarIcon           from '@mui/icons-material/Star';
import WhatshotIcon       from '@mui/icons-material/Whatshot';
import AutoAwesomeIcon    from '@mui/icons-material/AutoAwesome';
import CloseIcon          from '@mui/icons-material/Close';

const QUICK_DESTINATIONS = ['Kathmandu', 'Pokhara', 'Bhaktapur', 'Chitwan', 'Lumbini', 'Mustang'];

const BUDGET_LABELS = {
    all:    'Any budget',
    budget: 'Budget (< 10k)',
    mid:    'Mid-range (10k–40k)',
    luxury: 'Luxury (40k+)',
};

const SOURCE_META = {
    rule_based:    { label: 'Recommended',   color: '#33CCCC' },
    collaborative: { label: 'For you',        color: '#AB47BC' },
    hybrid:        { label: 'Personalised',   color: '#42A5F5' },
    public:        { label: 'Popular',        color: '#66BB6A' },
    your_trip:     { label: 'Your trip',      color: '#FFB74D' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtBudget = (n, currency = 'NPR') =>
    n ? `${currency} ${Number(n).toLocaleString()}` : '—';

const fmtDays = (n) => n ? `${n} day${n !== 1 ? 's' : ''}` : '';

// ── Card components ───────────────────────────────────────────────────────────
const PHOTO_BASE = `${import.meta.env.VITE_BACKEND_API_URL}places/photo?photo_reference=`;
const FALLBACK   = 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=600&auto=format&fit=crop';

const ItineraryGridCard = ({ item, COLORS, onClick }) => {
    const meta = SOURCE_META[item.recommendation_source] || SOURCE_META.public;
    const imgSrc = item.cover_photo ? `${PHOTO_BASE}${item.cover_photo}&max_width=600` : FALLBACK;
    return (
        <Card onClick={onClick} sx={{
            bgcolor: COLORS.cardPrimary, borderRadius: 4, overflow: 'hidden',
            cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column',
            border: `1px solid ${COLORS.cardBorder}`,
            transition: 'all 0.25s',
            '&:hover': { transform: 'translateY(-5px)', boxShadow: `0 12px 32px ${COLORS.brand}22`, borderColor: `${COLORS.brand}60` },
        }}>
            <Box sx={{ position: 'relative' }}>
                <CardMedia component="img" height="180" image={imgSrc} alt={item.title} sx={{ objectFit: 'cover' }} />
                <Box sx={{ position: 'absolute', top: 10, left: 10 }}>
                    <Chip
                        label={meta.label}
                        size="small"
                        sx={{
                            height: 20, fontSize: '0.62rem', fontWeight: 700,
                            bgcolor: `${meta.color}22`, color: meta.color,
                            border: `1px solid ${meta.color}55`,
                            backdropFilter: 'blur(6px)',
                            '& .MuiChip-label': { px: 0.8 },
                        }}
                    />
                </Box>
                {item.like_count > 50 && (
                    <Box sx={{
                        position: 'absolute', top: 10, right: 10,
                        bgcolor: 'rgba(20,22,39,0.75)', backdropFilter: 'blur(4px)',
                        borderRadius: 10, px: 1, py: 0.3,
                        display: 'flex', alignItems: 'center', gap: 0.4,
                    }}>
                        <WhatshotIcon sx={{ fontSize: 12, color: '#ff6b6b' }} />
                        <Typography sx={{ color: 'white', fontSize: '0.65rem', fontWeight: 700 }}>
                            Trending
                        </Typography>
                    </Box>
                )}
            </Box>
            <CardContent sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box>
                    <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ color: COLORS.headings, mb: 0.4, fontSize: '0.9rem' }}>
                        {item.title}
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1 }}>
                        <LocationOnIcon sx={{ fontSize: 12, color: '#ff6b6b' }} />
                        <Typography variant="caption" noWrap sx={{ color: COLORS.fadedText, fontSize: '0.72rem' }}>
                            {item.destination}
                        </Typography>
                    </Stack>
                    {item.tags?.length > 0 && (
                        <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.4, mb: 1 }}>
                            {item.tags.slice(0, 3).map(t => (
                                <Chip key={t} label={t} size="small" sx={{
                                    height: 16, fontSize: '0.58rem',
                                    bgcolor: `${COLORS.brand}12`, color: COLORS.fadedText,
                                    '& .MuiChip-label': { px: 0.6 },
                                }} />
                            ))}
                        </Stack>
                    )}
                </Box>
                <Box>
                    <Typography variant="body2" fontWeight={700} sx={{ color: COLORS.brand, fontSize: '0.82rem', mb: 0.5 }}>
                        {fmtBudget(item.estimated_budget, item.currency)}
                    </Typography>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" alignItems="center" spacing={0.4}>
                            <CalendarTodayIcon sx={{ fontSize: 11, color: COLORS.fadedText }} />
                            <Typography variant="caption" sx={{ color: COLORS.fadedText, fontSize: '0.7rem' }}>
                                {fmtDays(item.days_count)}
                            </Typography>
                        </Stack>
                        <Stack direction="row" spacing={1.2}>
                            <Stack direction="row" alignItems="center" spacing={0.3}>
                                <FavoriteIcon sx={{ fontSize: 11, color: COLORS.fadedText }} />
                                <Typography variant="caption" sx={{ color: COLORS.fadedText, fontSize: '0.68rem' }}>
                                    {item.like_count || 0}
                                </Typography>
                            </Stack>
                            <Stack direction="row" alignItems="center" spacing={0.3}>
                                <VisibilityIcon sx={{ fontSize: 11, color: COLORS.fadedText }} />
                                <Typography variant="caption" sx={{ color: COLORS.fadedText, fontSize: '0.68rem' }}>
                                    {item.view_count || 0}
                                </Typography>
                            </Stack>
                        </Stack>
                    </Stack>
                </Box>
            </CardContent>
        </Card>
    );
};

const ItineraryListCard = ({ item, COLORS, onClick }) => {
    const meta = SOURCE_META[item.recommendation_source] || SOURCE_META.public;
    const imgSrc = item.cover_photo ? `${PHOTO_BASE}${item.cover_photo}&max_width=300` : FALLBACK;
    return (
        <Card onClick={onClick} sx={{
            bgcolor: COLORS.cardPrimary, borderRadius: 3, overflow: 'hidden',
            cursor: 'pointer', border: `1px solid ${COLORS.cardBorder}`,
            transition: 'all 0.2s',
            '&:hover': { borderColor: `${COLORS.brand}60`, boxShadow: `0 4px 20px ${COLORS.brand}18` },
        }}>
            <Stack direction="row">
                <Box sx={{ position: 'relative', flexShrink: 0 }}>
                    <Box component="img" src={imgSrc} alt={item.title}
                        sx={{ width: 130, height: 100, objectFit: 'cover' }} />
                    <Chip label={meta.label} size="small" sx={{
                        position: 'absolute', bottom: 6, left: 6,
                        height: 18, fontSize: '0.58rem', fontWeight: 700,
                        bgcolor: `${meta.color}22`, color: meta.color,
                        border: `1px solid ${meta.color}55`,
                        backdropFilter: 'blur(4px)',
                        '& .MuiChip-label': { px: 0.6 },
                    }} />
                </Box>
                <Box sx={{ flex: 1, p: 1.5, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
                    <Box>
                        <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ color: COLORS.headings, fontSize: '0.88rem' }}>
                            {item.title}
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={0.4}>
                            <LocationOnIcon sx={{ fontSize: 11, color: '#ff6b6b' }} />
                            <Typography variant="caption" noWrap sx={{ color: COLORS.fadedText, fontSize: '0.7rem' }}>
                                {item.destination}
                            </Typography>
                        </Stack>
                    </Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" fontWeight={700} sx={{ color: COLORS.brand, fontSize: '0.78rem' }}>
                            {fmtBudget(item.estimated_budget, item.currency)}
                        </Typography>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <Typography variant="caption" sx={{ color: COLORS.fadedText, fontSize: '0.68rem' }}>
                                {fmtDays(item.days_count)}
                            </Typography>
                            <Stack direction="row" alignItems="center" spacing={0.3}>
                                <FavoriteIcon sx={{ fontSize: 10, color: COLORS.fadedText }} />
                                <Typography variant="caption" sx={{ color: COLORS.fadedText, fontSize: '0.68rem' }}>
                                    {item.like_count || 0}
                                </Typography>
                            </Stack>
                        </Stack>
                    </Stack>
                </Box>
            </Stack>
        </Card>
    );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const SearchResults = () => {
    const navigate      = useNavigate();
    const { COLORS }    = useTheme();
    const [searchParams, setSearchParams] = useSearchParams();

    const initialQ = searchParams.get('q') || '';

    const [query, setQuery]         = useState(initialQ);
    const [inputVal, setInputVal]   = useState(initialQ);
    const [results, setResults]     = useState([]);
    const [popular, setPopular]     = useState([]);
    const [loading, setLoading]     = useState(false);
    const [viewMode, setViewMode]   = useState('grid');    // 'grid' | 'list'
    const [sortBy, setSortBy]       = useState('relevance'); // 'relevance' | 'popular' | 'budget_asc' | 'budget_desc' | 'days_asc'
    const [budgetFilter, setBudget] = useState('all');
    const [durationFilter, setDuration] = useState('all');
    const [section, setSection]     = useState('all');   // 'all' | 'recommended' | 'popular'

    // Fetch results whenever query changes
    const fetchResults = useCallback(async (q) => {
        if (!q.trim()) return;
        setLoading(true);
        const userId = localStorage.getItem('userId');
        try {
            const [pubRes, recRes, userRes] = await Promise.allSettled([
                axios.get(`${import.meta.env.VITE_BACKEND_API_URL}itineraries/public`, { params: { destination: q, limit: 20 } }),
                axios.get(`${import.meta.env.VITE_BACKEND_API_URL}recommendations/explore`, { params: { destination: q, limit: 12 } }),
                userId ? axios.get(`${import.meta.env.VITE_BACKEND_API_URL}itineraries/user/${userId}`) : Promise.resolve(null),
            ]);

            const seenIds = new Set();
            const merged = [];

            // Recommendations first (scored)
            for (const r of (recRes.status === 'fulfilled' ? recRes.value.data?.results || [] : [])) {
                if (!seenIds.has(r.id)) { seenIds.add(r.id); merged.push(r); }
            }

            // Public itineraries
            for (const p of (pubRes.status === 'fulfilled' ? pubRes.value.data || [] : [])) {
                if (!seenIds.has(p.id)) {
                    seenIds.add(p.id);
                    merged.push({
                        id: p.id, title: p.title, destination: p.destination,
                        estimated_budget: p.estimated_budget, currency: p.currency || 'NPR',
                        status: p.status, days_count: p.total_days || 0,
                        view_count: p.view_count || 0, like_count: p.like_count || 0,
                        tags: p.tags || [], cover_photo: p.cover_photo || null,
                        recommendation_source: 'public',
                    });
                }
            }

            // User's own matching trips
            const qLow = q.toLowerCase();
            for (const t of (userRes.status === 'fulfilled' && userRes.value?.data ? userRes.value.data : [])) {
                if (!seenIds.has(t.id) && (
                    t.title?.toLowerCase().includes(qLow) ||
                    t.destination?.toLowerCase().includes(qLow)
                )) {
                    seenIds.add(t.id);
                    merged.push({
                        id: t.id, title: t.title, destination: t.destination,
                        estimated_budget: t.estimated_budget, currency: t.currency || 'NPR',
                        status: t.status, days_count: t.days?.length || 0,
                        view_count: t.view_count || 0, like_count: t.like_count || 0,
                        tags: t.tags || [], cover_photo: t.cover_photo || null,
                        recommendation_source: 'your_trip',
                    });
                }
            }

            setResults(merged);
        } catch {
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch trending / popular for the destination regardless of filters
    const fetchPopular = useCallback(async (q) => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_API_URL}recommendations/explore`, {
                params: { destination: q || undefined, limit: 4 },
            });
            setPopular(res.data?.results || []);
        } catch { setPopular([]); }
    }, []);

    useEffect(() => {
        if (initialQ) { fetchResults(initialQ); fetchPopular(initialQ); }
        else { fetchPopular(''); }
    }, []);

    const handleSearch = () => {
        const q = inputVal.trim();
        if (!q) return;
        setQuery(q);
        setSearchParams({ q });
        fetchResults(q);
        fetchPopular(q);
    };

    // Filter + sort pipeline
    const filtered = results
        .filter(r => {
            if (section === 'recommended' && !['rule_based','collaborative','hybrid'].includes(r.recommendation_source)) return false;
            if (section === 'popular' && r.recommendation_source !== 'public') return false;
            if (budgetFilter === 'budget' && r.estimated_budget >= 10000) return false;
            if (budgetFilter === 'mid'    && (r.estimated_budget < 10000 || r.estimated_budget > 40000)) return false;
            if (budgetFilter === 'luxury' && r.estimated_budget <= 40000) return false;
            if (durationFilter === 'day'  && r.days_count !== 1) return false;
            if (durationFilter === 'week' && (r.days_count < 2 || r.days_count > 3)) return false;
            if (durationFilter === 'long' && r.days_count < 4) return false;
            return true;
        })
        .sort((a, b) => {
            if (sortBy === 'popular')      return (b.like_count + b.view_count) - (a.like_count + a.view_count);
            if (sortBy === 'budget_asc')   return (a.estimated_budget || 0) - (b.estimated_budget || 0);
            if (sortBy === 'budget_desc')  return (b.estimated_budget || 0) - (a.estimated_budget || 0);
            if (sortBy === 'days_asc')     return (a.days_count || 0) - (b.days_count || 0);
            return 0; // relevance — keep original order
        });

    const recommended = filtered.filter(r => ['rule_based','collaborative','hybrid'].includes(r.recommendation_source));
    const publicOnes  = filtered.filter(r => r.recommendation_source === 'public');
    const ownTrips    = filtered.filter(r => r.recommendation_source === 'your_trip');

    const renderCard = (item) =>
        viewMode === 'grid'
            ? <ItineraryGridCard key={item.id} item={item} COLORS={COLORS} onClick={() => navigate(`/itinerary/${item.id}`)} />
            : <ItineraryListCard key={item.id} item={item} COLORS={COLORS} onClick={() => navigate(`/itinerary/${item.id}`)} />;

    const SectionHeader = ({ icon, title, count }) => (
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2.5, mt: 1 }}>
            <Box sx={{ color: COLORS.brand, display: 'flex' }}>{icon}</Box>
            <Typography variant="h6" fontWeight={700} sx={{ color: COLORS.headings, fontSize: '1rem' }}>
                {title}
            </Typography>
            <Chip label={count} size="small" sx={{
                height: 20, fontSize: '0.65rem', fontWeight: 700,
                bgcolor: `${COLORS.brand}18`, color: COLORS.brand,
                '& .MuiChip-label': { px: 0.8 },
            }} />
        </Stack>
    );

    return (
        <Box sx={{ display: 'flex', bgcolor: COLORS.background, minHeight: '100vh', width: '100vw', position: 'fixed', top: { xs: '56px', md: 0 }, left: 0, overflow: 'hidden' }}>
            <Navbar />
            <Box component="main" sx={{ flexGrow: 1, height: { xs: 'calc(100vh - 56px)', md: '100vh' }, overflow: 'hidden', display: 'flex', flexDirection: 'column', pl: 0 }}>

                {/* ── Search bar — same layout as Dashboard top bar ─────── */}
                <Stack direction="row" justifyContent="space-between" alignItems="center"
                    sx={{ px: { xs: 1.5, md: 3 }, mb: 0, pt: { xs: 1.5, md: 3 }, pb: { xs: 1.5, md: 2 }, borderBottom: `1px solid ${COLORS.cardBorder}`, flexShrink: 0 }}>

                    {/* Left spacer — matches Dashboard's 200px spacer so field is centred */}
                    <Box sx={{ width: { xs: 'auto', md: 200 }, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                        <IconButton onClick={() => navigate('/dashboard')}
                            sx={{ color: COLORS.fadedText, '&:hover': { color: COLORS.brand } }}>
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    {/* Search field — same maxWidth and styling as Dashboard */}
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1, maxWidth: 650 }}>
                        <TextField
                            placeholder="Search destinations, e.g. Pokhara"
                            variant="outlined"
                            fullWidth
                            value={inputVal}
                            onChange={e => setInputVal(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            autoFocus
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: COLORS.cardPrimary, borderRadius: 5, color: COLORS.text,
                                    '& fieldset': { borderColor: COLORS.cardBorder },
                                    '&:hover fieldset': { borderColor: COLORS.brand },
                                    '&.Mui-focused fieldset': { borderColor: COLORS.brand },
                                },
                                '& .MuiInputBase-input': { padding: '14px 16px' },
                                '& .MuiInputBase-input::placeholder': { color: COLORS.fadedText, opacity: 1 },
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ color: COLORS.fadedText }} />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Button variant="contained" onClick={handleSearch} disabled={loading} sx={{
                            bgcolor: COLORS.brand, color: COLORS.background, fontWeight: 'bold',
                            px: { xs: 2, md: 4 }, py: 1.75, borderRadius: 5, textTransform: 'uppercase',
                            fontSize: '0.875rem', whiteSpace: 'nowrap',
                            '&:hover': { bgcolor: '#2db8b8', transform: 'translateY(-2px)', boxShadow: `0 4px 12px ${COLORS.brand}40` },
                            transition: 'all 0.3s',
                        }}>
                            Search
                        </Button>
                    </Stack>

                    {/* Right — quick destination chips aligned to match New Trip button space */}
                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ width: { xs: 0, md: 200 }, display: { xs: 'none', md: 'flex' }, justifyContent: 'flex-end', flexWrap: 'wrap', gap: 0.5 }}>
                        {QUICK_DESTINATIONS.slice(0, 3).map(d => (
                            <Chip key={d} label={d} size="small" clickable
                                onClick={() => { setInputVal(d); setQuery(d); setSearchParams({ q: d }); fetchResults(d); fetchPopular(d); }}
                                sx={{
                                    height: 22, fontSize: '0.68rem', cursor: 'pointer',
                                    bgcolor: query === d ? `${COLORS.brand}20` : COLORS.cardPrimary,
                                    color: query === d ? COLORS.brand : COLORS.fadedText,
                                    border: `1px solid ${query === d ? COLORS.brand : COLORS.cardBorder}`,
                                    '&:hover': { bgcolor: `${COLORS.brand}15`, color: COLORS.brand },
                                }}
                            />
                        ))}
                    </Stack>
                </Stack>

                <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                    {/* ── Left sidebar filters ─────────────────────────────── */}
                    <Box sx={{
                        width: 220, flexShrink: 0, borderRight: `1px solid ${COLORS.cardBorder}`,
                        overflow: 'auto', px: 2.5, py: 2.5,
                        display: { xs: 'none', md: 'block' },
                        '&::-webkit-scrollbar': { width: 4 },
                        '&::-webkit-scrollbar-thumb': { bgcolor: COLORS.cardBorder, borderRadius: 4 },
                    }}>
                        <Typography variant="caption" fontWeight={700} sx={{ color: COLORS.fadedText, textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 2 }}>
                            Filters
                        </Typography>

                        {/* Section filter */}
                        <Box sx={{ mb: 2.5 }}>
                            <Typography variant="caption" sx={{ color: COLORS.fadedText, fontSize: '0.7rem', mb: 1, display: 'block' }}>Show</Typography>
                            {[
                                { val: 'all', label: 'All results' },
                                { val: 'recommended', label: 'Recommended' },
                                { val: 'popular', label: 'Popular only' },
                            ].map(opt => (
                                <Box key={opt.val} onClick={() => setSection(opt.val)} sx={{
                                    py: 0.8, px: 1.2, borderRadius: 2, cursor: 'pointer', mb: 0.5,
                                    bgcolor: section === opt.val ? `${COLORS.brand}15` : 'transparent',
                                    border: `1px solid ${section === opt.val ? `${COLORS.brand}50` : 'transparent'}`,
                                    '&:hover': { bgcolor: `${COLORS.brand}10` },
                                }}>
                                    <Typography sx={{ color: section === opt.val ? COLORS.brand : COLORS.text, fontSize: '0.8rem', fontWeight: section === opt.val ? 700 : 400 }}>
                                        {opt.label}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>

                        <Divider sx={{ borderColor: COLORS.cardBorder, mb: 2 }} />

                        {/* Budget */}
                        <Box sx={{ mb: 2.5 }}>
                            <Typography variant="caption" sx={{ color: COLORS.fadedText, fontSize: '0.7rem', mb: 1, display: 'block' }}>Budget (NPR)</Typography>
                            {Object.entries(BUDGET_LABELS).map(([val, label]) => (
                                <Box key={val} onClick={() => setBudget(val)} sx={{
                                    py: 0.7, px: 1.2, borderRadius: 2, cursor: 'pointer', mb: 0.5,
                                    bgcolor: budgetFilter === val ? `${COLORS.brand}15` : 'transparent',
                                    '&:hover': { bgcolor: `${COLORS.brand}10` },
                                }}>
                                    <Typography sx={{ color: budgetFilter === val ? COLORS.brand : COLORS.text, fontSize: '0.78rem', fontWeight: budgetFilter === val ? 700 : 400 }}>
                                        {label}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>

                        <Divider sx={{ borderColor: COLORS.cardBorder, mb: 2 }} />

                        {/* Duration */}
                        <Box sx={{ mb: 2.5 }}>
                            <Typography variant="caption" sx={{ color: COLORS.fadedText, fontSize: '0.7rem', mb: 1, display: 'block' }}>Duration</Typography>
                            {[
                                { val: 'all',  label: 'Any length' },
                                { val: 'day',  label: 'Day trip (1 day)' },
                                { val: 'week', label: 'Weekend (2-3 days)' },
                                { val: 'long', label: 'Week+ (4+ days)' },
                            ].map(opt => (
                                <Box key={opt.val} onClick={() => setDuration(opt.val)} sx={{
                                    py: 0.7, px: 1.2, borderRadius: 2, cursor: 'pointer', mb: 0.5,
                                    bgcolor: durationFilter === opt.val ? `${COLORS.brand}15` : 'transparent',
                                    '&:hover': { bgcolor: `${COLORS.brand}10` },
                                }}>
                                    <Typography sx={{ color: durationFilter === opt.val ? COLORS.brand : COLORS.text, fontSize: '0.78rem', fontWeight: durationFilter === opt.val ? 700 : 400 }}>
                                        {opt.label}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>

                        {/* Reset */}
                        {(budgetFilter !== 'all' || durationFilter !== 'all' || section !== 'all') && (
                            <Button size="small" onClick={() => { setBudget('all'); setDuration('all'); setSection('all'); }}
                                sx={{ color: '#ff6b6b', textTransform: 'none', fontSize: '0.75rem', mt: 1 }}>
                                Clear filters
                            </Button>
                        )}
                    </Box>

                    {/* ── Main results area ────────────────────────────────── */}
                    <Box sx={{ flex: 1, overflow: 'auto', px: { xs: 2, md: 3 }, py: { xs: 1.5, md: 2.5 }, pb: { xs: '80px', md: 2.5 },
                        '&::-webkit-scrollbar': { width: 5 },
                        '&::-webkit-scrollbar-thumb': { bgcolor: COLORS.cardBorder, borderRadius: 4 },
                    }}>

                        {/* Toolbar row */}
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5, gap: 1 }}>
                            <Box sx={{ minWidth: 0 }}>
                                <Typography variant="h6" fontWeight={700} noWrap sx={{ color: COLORS.headings, lineHeight: 1.2, fontSize: { xs: '0.88rem', md: '1.25rem' } }}>
                                    {query ? `Results for "${query}"` : 'Explore Itineraries'}
                                </Typography>
                                {!loading && (
                                    <Typography variant="caption" sx={{ color: COLORS.fadedText, fontSize: '0.72rem' }}>
                                        {filtered.length} itinerar{filtered.length !== 1 ? 'ies' : 'y'} found
                                    </Typography>
                                )}
                            </Box>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <FormControl size="small" sx={{ minWidth: { xs: 110, md: 140 } }}>
                                    <Select
                                        value={sortBy} onChange={e => setSortBy(e.target.value)}
                                        sx={{
                                            fontSize: { xs: '0.72rem', md: '0.78rem' }, color: COLORS.text, borderRadius: 2,
                                            '& .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.cardBorder },
                                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.brand },
                                            bgcolor: COLORS.cardPrimary,
                                        }}
                                    >
                                        <MenuItem value="relevance" sx={{ fontSize: '0.78rem' }}>Relevance</MenuItem>
                                        <MenuItem value="popular"   sx={{ fontSize: '0.78rem' }}>Most Popular</MenuItem>
                                        <MenuItem value="budget_asc"  sx={{ fontSize: '0.78rem' }}>Budget: Low → High</MenuItem>
                                        <MenuItem value="budget_desc" sx={{ fontSize: '0.78rem' }}>Budget: High → Low</MenuItem>
                                        <MenuItem value="days_asc"    sx={{ fontSize: '0.78rem' }}>Shortest first</MenuItem>
                                    </Select>
                                </FormControl>
                                <ToggleButtonGroup value={viewMode} exclusive onChange={(_, v) => v && setViewMode(v)} size="small">
                                    <ToggleButton value="grid" sx={{ color: COLORS.fadedText, '&.Mui-selected': { color: COLORS.brand, bgcolor: `${COLORS.brand}15` }, borderColor: COLORS.cardBorder }}>
                                        <GridViewIcon sx={{ fontSize: 18 }} />
                                    </ToggleButton>
                                    <ToggleButton value="list" sx={{ color: COLORS.fadedText, '&.Mui-selected': { color: COLORS.brand, bgcolor: `${COLORS.brand}15` }, borderColor: COLORS.cardBorder }}>
                                        <ViewListIcon sx={{ fontSize: 18 }} />
                                    </ToggleButton>
                                </ToggleButtonGroup>
                            </Stack>
                        </Stack>

                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', pt: 10 }}>
                                <CircularProgress sx={{ color: COLORS.brand }} />
                            </Box>
                        ) : filtered.length === 0 && query ? (
                            <Box sx={{ textAlign: 'center', pt: 10 }}>
                                <SearchIcon sx={{ fontSize: 56, color: COLORS.fadedText, mb: 2, opacity: 0.4 }} />
                                <Typography variant="h6" sx={{ color: COLORS.headings, mb: 1 }}>No itineraries found</Typography>
                                <Typography sx={{ color: COLORS.fadedText, fontSize: '0.85rem', mb: 3 }}>
                                    Try a different destination or clear your filters.
                                </Typography>
                                <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
                                    {QUICK_DESTINATIONS.map(d => (
                                        <Chip key={d} label={d} clickable onClick={() => { setInputVal(d); setQuery(d); setSearchParams({ q: d }); fetchResults(d); fetchPopular(d); }}
                                            sx={{ bgcolor: COLORS.cardPrimary, color: COLORS.text, border: `1px solid ${COLORS.cardBorder}`, '&:hover': { bgcolor: `${COLORS.brand}15` } }} />
                                    ))}
                                </Stack>
                            </Box>
                        ) : section === 'all' ? (
                            // Sectioned view
                            <Box>
                                {/* Your trips */}
                                {ownTrips.length > 0 && (
                                    <Box sx={{ mb: 4 }}>
                                        <SectionHeader icon={<StarIcon sx={{ fontSize: 18 }} />} title="Your Matching Trips" count={ownTrips.length} />
                                        <Box sx={{ display: 'grid', gridTemplateColumns: viewMode === 'grid' ? { xs: 'repeat(auto-fill, minmax(155px, 1fr))', md: 'repeat(auto-fill, minmax(220px, 1fr))' } : '1fr', gap: 2 }}>
                                            {ownTrips.map(r => renderCard(r))}
                                        </Box>
                                    </Box>
                                )}

                                {/* Recommended */}
                                {recommended.length > 0 && (
                                    <Box sx={{ mb: 4 }}>
                                        <SectionHeader icon={<AutoAwesomeIcon sx={{ fontSize: 18 }} />} title="Recommended for You" count={recommended.length} />
                                        <Box sx={{ display: 'grid', gridTemplateColumns: viewMode === 'grid' ? { xs: 'repeat(auto-fill, minmax(155px, 1fr))', md: 'repeat(auto-fill, minmax(220px, 1fr))' } : '1fr', gap: 2 }}>
                                            {recommended.map(r => renderCard(r))}
                                        </Box>
                                    </Box>
                                )}

                                {/* Popular public */}
                                {publicOnes.length > 0 && (
                                    <Box sx={{ mb: 4 }}>
                                        <SectionHeader icon={<WhatshotIcon sx={{ fontSize: 18 }} />} title="Popular Itineraries" count={publicOnes.length} />
                                        <Box sx={{ display: 'grid', gridTemplateColumns: viewMode === 'grid' ? { xs: 'repeat(auto-fill, minmax(155px, 1fr))', md: 'repeat(auto-fill, minmax(220px, 1fr))' } : '1fr', gap: 2 }}>
                                            {publicOnes.map(r => renderCard(r))}
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        ) : (
                            // Flat filtered view
                            <Box sx={{ display: 'grid', gridTemplateColumns: viewMode === 'grid' ? { xs: 'repeat(auto-fill, minmax(155px, 1fr))', md: 'repeat(auto-fill, minmax(220px, 1fr))' } : '1fr', gap: 2 }}>
                                {filtered.map(r => renderCard(r))}
                            </Box>
                        )}

                        {/* Trending elsewhere — shown when no query */}
                        {!query && popular.length > 0 && (
                            <Box>
                                <SectionHeader icon={<WhatshotIcon sx={{ fontSize: 18 }} />} title="Trending in Nepal" count={popular.length} />
                                <Box sx={{ display: 'grid', gridTemplateColumns: viewMode === 'grid' ? { xs: 'repeat(auto-fill, minmax(155px, 1fr))', md: 'repeat(auto-fill, minmax(220px, 1fr))' } : '1fr', gap: 2 }}>
                                    {popular.map(r => renderCard(r))}
                                </Box>
                            </Box>
                        )}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default SearchResults;