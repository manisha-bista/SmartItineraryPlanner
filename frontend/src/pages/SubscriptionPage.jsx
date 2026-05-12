/**
 * SubscriptionPage.jsx — Khalti payment + subscription management
 *
 * Cancellation UX: inline confirmation card (no Dialog/portal — guaranteed visible).
 * Data source: status endpoint is the canonical tier authority (has auto-expiry).
 * Persistence: subscriptionCanceled stored in localStorage to survive reloads.
 */
import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Stack, Button, Chip, Divider,
    CircularProgress, Snackbar, Alert, Dialog,
    DialogContent, DialogActions, IconButton, Checkbox, FormControlLabel,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import Navbar, { DRAWER_WIDTH } from '../components/Navbar';

import CheckCircleIcon        from '@mui/icons-material/CheckCircle';
import CancelIcon             from '@mui/icons-material/Cancel';
import WorkspacePremiumIcon   from '@mui/icons-material/WorkspacePremium';
import ExploreIcon            from '@mui/icons-material/Explore';
import StarIcon               from '@mui/icons-material/Star';
import InfoOutlinedIcon       from '@mui/icons-material/InfoOutlined';
import LockOpenIcon           from '@mui/icons-material/LockOpen';
import CloseIcon              from '@mui/icons-material/Close';
import WarningAmberIcon       from '@mui/icons-material/WarningAmber';
import OpenInNewIcon          from '@mui/icons-material/OpenInNew';
import CalendarTodayIcon      from '@mui/icons-material/CalendarToday';
import SecurityIcon           from '@mui/icons-material/Security';
import BoltIcon               from '@mui/icons-material/Bolt';

const KHALTI_PURPLE      = '#5C2D91';
const KHALTI_PURPLE_DARK = '#4A2277';
const KHALTI_LIGHT       = '#7B3FB8';

// ─── Feature table data ───────────────────────────────────────────────────────
const FEATURES = [
    { label: 'Browse community itineraries',      free: 'Up to 10/day',    premium: 'Unlimited' },
    { label: 'Rule-based place filtering',         free: 'Basic (region)',  premium: 'Full (budget, season, group, permits)' },
    { label: 'Personalised recommendations',       free: false,             premium: true },
    { label: 'AI itinerary generation',            free: '2 / week',        premium: '15 / month' },
    { label: 'Saved itineraries',                  free: 'Up to 5',         premium: 'Unlimited' },
    { label: 'Copy & customise community routes',  free: false,             premium: true },
    { label: 'Weather along route',                free: false,             premium: true },
    { label: 'Interactive map — full access',      free: 'Preview only',    premium: true },
    { label: 'Export itinerary as PDF',            free: false,             premium: true },
    { label: 'Early access to new trek listings',  free: false,             premium: true },
    { label: 'Community posts & reviews',          free: true,              premium: true },
    { label: 'Friend system & messaging',          free: true,              premium: true },
];

const PLANS = [
    {
        id: 'trip_pass', label: 'Trip Pass', price: 'NPR 199', priceValue: 199,
        per: '/ 7 days — one-time', badge: null, highlight: false,
        description: 'One-time unlock — ideal for a single short trip.', perDay: '~NPR 28/day',
    },
    {
        id: 'monthly', label: 'Monthly', price: 'NPR 299', priceValue: 299,
        per: '/ 30 days', badge: 'BEST VALUE', highlight: true,
        description: 'Perfect for a longer trip or a few back-to-back plans.', perDay: '~NPR 10/day', savingsTag: 'Save 64%',
    },
    {
        id: 'yearly', label: 'Annual', price: 'NPR 1,999', priceValue: 1999,
        per: '/ year', badge: null, highlight: false,
        description: 'Best for frequent trekkers who plan year-round.', perDay: '~NPR 5/day', savingsTag: 'Save 81%',
    },
];

// ─── Small helpers ────────────────────────────────────────────────────────────
function FeatureValue({ val, C }) {
    if (val === true)  return <CheckCircleIcon sx={{ color: C.brand, fontSize: 20 }} />;
    if (val === false) return <CancelIcon      sx={{ color: C.dim,   fontSize: 20 }} />;
    return <Typography sx={{ fontSize: '0.78rem', color: C.text, fontWeight: 500 }}>{val}</Typography>;
}

function KhaltiMark({ size = 22 }) {
    return (
        <Box sx={{
            width: size, height: size, borderRadius: '50%', bgcolor: '#fff', color: KHALTI_PURPLE,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: size * 0.5, flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        }}>K</Box>
    );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function SubscriptionPage() {
    const navigate           = useNavigate();
    const { COLORS, isDark } = useTheme();

    const C = {
        brand:  COLORS.brand,
        bg:     COLORS.background,
        card:   COLORS.cardPrimary,
        card2:  COLORS.cardSecondary,
        border: COLORS.cardBorder,
        white:  COLORS.headings,
        dim:    COLORS.fadedText,
        text:   COLORS.text,
    };

    // ── State ─────────────────────────────────────────────────────────────────
    const [user, setUser]             = useState(null);
    const [selected, setSelected]     = useState('monthly');
    const [loading, setLoading]       = useState(false);
    const [snack, setSnack]           = useState({ open: false, msg: '', sev: 'success' });
    const toast = (msg, sev = 'success') => setSnack({ open: true, msg, sev });

    // Payment dialog
    const [payDialogOpen, setPayDialogOpen] = useState(false);

    // Cancel inline confirmation
    const [showCancelUI, setShowCancelUI]       = useState(false);
    const [cancelChecked, setCancelChecked]     = useState(false);

    // ── Load user data ────────────────────────────────────────────────────────
    useEffect(() => {
        const uid  = localStorage.getItem('userId');
        if (!uid) { navigate('/login'); return; }

        const cachedTier      = localStorage.getItem('subscriptionTier') || 'free';
        const cachedRole      = localStorage.getItem('userRole') || 'user';
        const cachedCanceled  = localStorage.getItem('subscriptionCanceled') === 'true';
        const cachedUntil     = localStorage.getItem('premiumUntil') || null;

        // Show cached state immediately while network loads
        setUser({
            id:          uid,
            name:        localStorage.getItem('userName') || 'User',
            tier:        cachedTier,
            role:        cachedRole,
            isCanceled:  cachedCanceled,
            premiumUntil: cachedUntil,
        });

        // Fetch name + role from users endpoint, then get CANONICAL tier from status endpoint
        axios.get(`${import.meta.env.VITE_BACKEND_API_URL}users/${uid}`)
            .then(({ data: u }) => {
                // Use status endpoint as the authoritative source — it runs auto-expiry
                return axios.get(`${import.meta.env.VITE_BACKEND_API_URL}subscriptions/status/${uid}`)
                    .then(({ data: s }) => {
                        const canonicalTier = s.subscription_tier || 'free';
                        const isCanceled    = Boolean(s.is_canceled);
                        const premiumUntil  = s.premium_until || null;

                        // Persist to localStorage so reload shows correct state instantly
                        localStorage.setItem('subscriptionTier',   canonicalTier);
                        localStorage.setItem('userRole',           u.role || 'user');
                        localStorage.setItem('subscriptionCanceled', String(isCanceled));
                        localStorage.setItem('premiumUntil',       premiumUntil || '');

                        setUser({
                            id:          uid,
                            name:        u.name,
                            tier:        canonicalTier,
                            role:        u.role || 'user',
                            isCanceled,
                            premiumUntil,
                        });
                    });
            })
            .catch(() => {});
    }, [navigate]);

    // ── Derived flags ─────────────────────────────────────────────────────────
    const isAdmin    = user?.role === 'admin';
    const isPremium  = user?.tier === 'premium';
    const isCanceled = Boolean(user?.isCanceled);
    const isPending  = user?.tier === 'pending';
    const plan       = PLANS.find(p => p.id === selected);

    const fmtDate = iso => {
        if (!iso) return null;
        return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    // ── Initiate Khalti payment ───────────────────────────────────────────────
    const handleInitiatePayment = async () => {
        setLoading(true);
        try {
            const uid = localStorage.getItem('userId');
            const { data } = await axios.post(`${import.meta.env.VITE_BACKEND_API_URL}subscriptions/khalti/initiate`, {
                user_id: parseInt(uid), plan: selected,
            });
            if (data.payment_url) {
                window.location.href = data.payment_url;
            } else {
                throw new Error('No payment URL received');
            }
        } catch (e) {
            setPayDialogOpen(false);
            toast(e.response?.data?.detail || 'Could not initiate payment. Please try again.', 'error');
            setLoading(false);
        }
    };

    // ── Cancel subscription ───────────────────────────────────────────────────
    const handleCancel = async () => {
        // Close the confirmation UI immediately — don't wait for the API
        setShowCancelUI(false);
        setCancelChecked(false);
        setLoading(true);
        try {
            const uid = localStorage.getItem('userId');
            const { data } = await axios.post(`${import.meta.env.VITE_BACKEND_API_URL}subscriptions/cancel`, {
                user_id: parseInt(uid),
            });

            if (data.status === 'canceled_with_access') {
                const premiumUntil = data.premium_until ?? user?.premiumUntil ?? null;

                // Persist canceled state — survives page reload
                localStorage.setItem('subscriptionTier',    'premium');
                localStorage.setItem('subscriptionCanceled', 'true');
                localStorage.setItem('premiumUntil',         premiumUntil || '');

                setUser(prev => ({ ...prev, tier: 'premium', isCanceled: true, premiumUntil }));
                setShowCancelUI(false);
                toast(data.message, 'info');
            } else {
                // Genuinely reverted to free (e.g. pending payment or already expired)
                localStorage.setItem('subscriptionTier',    'free');
                localStorage.setItem('subscriptionCanceled', 'false');
                localStorage.setItem('premiumUntil',         '');

                setUser(prev => ({ ...prev, tier: 'free', isCanceled: false, premiumUntil: null }));
                setShowCancelUI(false);
                toast(data.message || 'Subscription canceled.', 'info');
            }
        } catch (e) {
            toast(e.response?.data?.detail || 'Could not cancel. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showUpgradeSection = !isAdmin && !isPremium && !isPending;

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <Box sx={{ display: 'flex', bgcolor: C.bg, minHeight: '100vh', fontFamily: '"Exo 2","Segoe UI",sans-serif' }}>
            <Navbar />

            <Box sx={{ flexGrow: 1, ml: { xs: 0, md: `${DRAWER_WIDTH}px` }, px: { xs: 2, md: 5 }, pt: { xs: '72px', md: 4 }, pb: 4, maxWidth: 960, mx: 'auto' }}>

                {/* ── Page title ───────────────────────────────────────────── */}
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
                    <WorkspacePremiumIcon sx={{ color: C.brand, fontSize: 28 }} />
                    <Typography variant="h5" fontWeight="bold" sx={{ color: C.white }}>
                        Smart Itinerary Premium
                    </Typography>
                </Stack>
                <Typography sx={{ color: C.dim, fontSize: '0.9rem', mb: 4 }}>
                    Unlock the full intelligence of the community — personalised routes, unlimited plans, and more.
                </Typography>

                {/* ══════════════════════════════════════════════════════════
                    STATUS BANNER
                ══════════════════════════════════════════════════════════ */}
                {isAdmin ? (
                    <Banner color={C.brand} C={C}>
                        <StarIcon sx={{ color: C.brand }} />
                        <Box>
                            <Typography fontWeight="bold" sx={{ color: C.brand, fontSize: '0.95rem' }}>Admin account — unlimited access</Typography>
                            <Typography sx={{ color: C.dim, fontSize: '0.8rem' }}>As an admin you have unlimited access to every Premium feature.</Typography>
                        </Box>
                    </Banner>

                ) : isPremium && isCanceled ? (
                    <Banner color="#f59e0b" C={C} borderColor="rgba(245,158,11,0.4)">
                        <CalendarTodayIcon sx={{ color: '#f59e0b' }} />
                        <Box>
                            <Typography fontWeight="bold" sx={{ color: '#f59e0b', fontSize: '0.95rem' }}>
                                Subscription canceled — Premium access continues
                            </Typography>
                            <Typography sx={{ color: C.dim, fontSize: '0.8rem' }}>
                                {user?.premiumUntil
                                    ? <>Access remains active until <strong style={{ color: C.white }}>{fmtDate(user.premiumUntil)}</strong>. You'll move to Free automatically after that.</>
                                    : <>Your Premium access remains active through your current plan period. You'll move to Free when it ends.</>
                                }
                            </Typography>
                        </Box>
                    </Banner>

                ) : isPremium ? (
                    <>
                        {/* Active premium banner */}
                        <Banner color={C.brand} C={C}>
                            <StarIcon sx={{ color: C.brand }} />
                            <Box sx={{ flex: 1 }}>
                                <Typography fontWeight="bold" sx={{ color: C.brand, fontSize: '0.95rem' }}>You're on Premium</Typography>
                                {user?.premiumUntil && (
                                    <Typography sx={{ color: C.dim, fontSize: '0.8rem' }}>
                                        Active until <strong style={{ color: C.white }}>{fmtDate(user.premiumUntil)}</strong>
                                    </Typography>
                                )}
                            </Box>
                            {!showCancelUI && !loading && (
                                <Button
                                    onClick={() => { setCancelChecked(false); setShowCancelUI(true); }}
                                    size="small"
                                    sx={{
                                        color: '#ff6b6b', border: '1px solid #ff6b6b44',
                                        borderRadius: 2, textTransform: 'none', fontSize: '0.8rem',
                                        flexShrink: 0, '&:hover': { bgcolor: '#ff6b6b12' },
                                    }}
                                >
                                    Cancel Plan
                                </Button>
                            )}
                        </Banner>

                        {/* ── INLINE CANCEL CONFIRMATION ─────────────────── */}
                        {showCancelUI && (
                            <Box sx={{
                                bgcolor: isDark ? '#1a0a0a' : '#fff5f5',
                                border: '2px solid #ff6b6b55',
                                borderRadius: 3, overflow: 'hidden', mb: 4,
                            }}>
                                {/* Red header bar */}
                                <Box sx={{
                                    background: 'linear-gradient(135deg,#7f1d1d 0%,#991b1b 100%)',
                                    px: 3, py: 2,
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                }}>
                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                        <Box sx={{
                                            width: 36, height: 36, borderRadius: '50%',
                                            bgcolor: 'rgba(255,255,255,0.15)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <WarningAmberIcon sx={{ color: '#fca5a5', fontSize: 20 }} />
                                        </Box>
                                        <Box>
                                            <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.1 }}>
                                                Cancel your subscription?
                                            </Typography>
                                            <Typography sx={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.7rem' }}>
                                                Please read carefully before confirming
                                            </Typography>
                                        </Box>
                                    </Stack>
                                    <IconButton
                                        onClick={() => { setShowCancelUI(false); setCancelChecked(false); }}
                                        size="small"
                                        disabled={loading}
                                        sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' } }}
                                    >
                                        <CloseIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                </Box>

                                <Box sx={{ px: 3, py: 2.5 }}>
                                    {/* Access-retained notice */}
                                    <Box sx={{
                                        bgcolor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)',
                                        borderRadius: 2, px: 2.5, py: 2, mb: 2.5, textAlign: 'center',
                                    }}>
                                        <Typography sx={{ color: C.dim, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: 1, mb: 0.5 }}>
                                            Good news — you've already paid for Premium
                                        </Typography>
                                        {user?.premiumUntil ? (
                                            <>
                                                <Typography sx={{ color: '#22c55e', fontWeight: 800, fontSize: '1.1rem' }}>
                                                    Access continues until {fmtDate(user.premiumUntil)}
                                                </Typography>
                                                <Typography sx={{ color: C.dim, fontSize: '0.75rem', mt: 0.3 }}>
                                                    You will <strong style={{ color: '#22c55e' }}>not</strong> lose any access you've paid for
                                                </Typography>
                                            </>
                                        ) : (
                                            <Typography sx={{ color: '#22c55e', fontWeight: 700, fontSize: '1rem' }}>
                                                Your access continues through your current plan period
                                            </Typography>
                                        )}
                                    </Box>

                                    <Typography sx={{ color: C.text, fontSize: '0.85rem', lineHeight: 1.7, mb: 2 }}>
                                        {user?.premiumUntil
                                            ? <>Canceling stops future renewals. You'll keep <strong style={{ color: C.white }}>all Premium features until {fmtDate(user.premiumUntil)}</strong>, then automatically move to the Free plan.</>
                                            : <>Canceling stops future renewals. Your Premium access stays active through your current paid period, then you'll move to the Free plan.</>
                                        }
                                    </Typography>

                                    {/* What they'll lose */}
                                    <Box sx={{ bgcolor: C.card2, borderRadius: 2, px: 2, py: 1.5, mb: 2.5 }}>
                                        <Typography sx={{ color: C.dim, fontSize: '0.69rem', textTransform: 'uppercase', letterSpacing: 0.8, mb: 1 }}>
                                            After your plan ends you'll lose
                                        </Typography>
                                        {['AI itinerary generation (15/month)', 'Unlimited saved itineraries', 'Full interactive map access', 'Personalised recommendations'].map(item => (
                                            <Stack key={item} direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                                                <CancelIcon sx={{ fontSize: 14, color: '#ff6b6b', flexShrink: 0 }} />
                                                <Typography sx={{ color: C.dim, fontSize: '0.8rem' }}>{item}</Typography>
                                            </Stack>
                                        ))}
                                    </Box>

                                    {/* Explicit confirmation checkbox */}
                                    <Box sx={{
                                        bgcolor: '#ff6b6b0A', border: `1px solid ${cancelChecked ? '#ff6b6b55' : '#ff6b6b22'}`,
                                        borderRadius: 2, px: 2, py: 1.5, mb: 2.5,
                                        transition: 'border-color 0.2s',
                                    }}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={cancelChecked}
                                                    onChange={e => setCancelChecked(e.target.checked)}
                                                    disabled={loading}
                                                    size="small"
                                                    sx={{ color: '#ff6b6b55', '&.Mui-checked': { color: '#ff6b6b' }, p: 0.5 }}
                                                />
                                            }
                                            label={
                                                <Typography sx={{ color: C.text, fontSize: '0.83rem', lineHeight: 1.5 }}>
                                                    I understand — cancel my subscription but keep my remaining access
                                                </Typography>
                                            }
                                            sx={{ m: 0, alignItems: 'flex-start', gap: 0.5 }}
                                        />
                                    </Box>

                                    {/* Action buttons */}
                                    <Stack direction="row" spacing={1.5}>
                                        <Button
                                            variant="contained"
                                            onClick={() => { setShowCancelUI(false); setCancelChecked(false); }}
                                            disabled={loading}
                                            sx={{
                                                flex: 1, bgcolor: C.brand, color: isDark ? '#141627' : '#fff',
                                                fontWeight: 700, borderRadius: 2, textTransform: 'none',
                                                '&:hover': { filter: 'brightness(1.1)' },
                                            }}
                                        >
                                            Keep Premium
                                        </Button>
                                        <Button
                                            onClick={handleCancel}
                                            disabled={loading || !cancelChecked}
                                            sx={{
                                                flex: 1,
                                                color: cancelChecked ? '#ff6b6b' : C.dim,
                                                border: `1px solid ${cancelChecked ? '#ff6b6b55' : C.border}`,
                                                borderRadius: 2, textTransform: 'none',
                                                transition: 'all 0.2s',
                                                '&:hover': { bgcolor: cancelChecked ? '#ff6b6b0D' : 'transparent' },
                                                '&.Mui-disabled': { opacity: loading ? 0.5 : 0.3 },
                                            }}
                                        >
                                            {loading
                                                ? <CircularProgress size={16} sx={{ color: '#ff6b6b' }} />
                                                : 'Cancel Subscription'
                                            }
                                        </Button>
                                    </Stack>
                                </Box>
                            </Box>
                        )}
                    </>

                ) : isPending ? (
                    <Banner color="#FFC107" C={C} borderColor="rgba(255,193,7,0.4)" bgColor="rgba(255,193,7,0.07)">
                        <InfoOutlinedIcon sx={{ color: '#FFC107' }} />
                        <Typography sx={{ color: C.text, fontSize: '0.88rem' }}>
                            Your payment is being processed by Khalti. Your plan activates automatically once confirmed — usually within a few minutes.
                        </Typography>
                    </Banner>

                ) : (
                    <Banner color={C.dim} C={C} borderColor={C.border} bgColor={C.card2}>
                        <LockOpenIcon sx={{ color: C.dim, fontSize: 20 }} />
                        <Typography sx={{ color: C.dim, fontSize: '0.85rem' }}>
                            You're on the <strong style={{ color: C.white }}>Free</strong> plan. Upgrade to unlock the full platform.
                        </Typography>
                    </Banner>
                )}

                {/* ══════════════════════════════════════════════════════════
                    PLAN CARDS + PAY BUTTON  (free users only)
                ══════════════════════════════════════════════════════════ */}
                {showUpgradeSection && (
                    <>
                        <Typography variant="h6" fontWeight="bold" sx={{ color: C.white, mb: 2.5 }}>
                            Choose a Plan
                        </Typography>

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }}>
                            {PLANS.map(p => (
                                <PlanCard key={p.id} plan={p} isSelected={selected === p.id} onSelect={setSelected} C={C} isDark={isDark} />
                            ))}
                        </Stack>

                        <Button
                            fullWidth
                            onClick={() => setPayDialogOpen(true)}
                            disabled={loading}
                            startIcon={<KhaltiMark size={22} />}
                            sx={{
                                bgcolor: KHALTI_PURPLE, color: '#fff',
                                fontWeight: 800, fontSize: '0.95rem', borderRadius: 3, py: 1.6,
                                textTransform: 'none', mb: 1.5,
                                boxShadow: `0 6px 24px ${KHALTI_PURPLE}44`,
                                '&:hover': { bgcolor: KHALTI_PURPLE_DARK, boxShadow: `0 8px 28px ${KHALTI_PURPLE}55` },
                                '&:disabled': { opacity: 0.55 },
                            }}
                        >
                            Pay with Khalti — {plan?.price}
                        </Button>

                        <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 5, flexWrap: 'wrap', gap: 1 }}>
                            {[
                                { icon: <SecurityIcon sx={{ fontSize: 14 }} />,      label: 'Secured by Khalti' },
                                { icon: <BoltIcon sx={{ fontSize: 14 }} />,          label: 'Instant activation' },
                                { icon: <CalendarTodayIcon sx={{ fontSize: 14 }} />, label: 'Access until expiry on cancel' },
                            ].map(b => (
                                <Stack key={b.label} direction="row" spacing={0.5} alignItems="center">
                                    <Box sx={{ color: C.dim, display: 'flex' }}>{b.icon}</Box>
                                    <Typography sx={{ color: C.dim, fontSize: '0.72rem' }}>{b.label}</Typography>
                                </Stack>
                            ))}
                        </Stack>
                    </>
                )}

                {/* ══════════════════════════════════════════════════════════
                    FEATURE TABLE
                ══════════════════════════════════════════════════════════ */}
                <Typography variant="h6" fontWeight="bold" sx={{ color: C.white, mb: 2 }}>
                    What's included
                </Typography>

                <Box sx={{ overflowX: { xs: 'auto', md: 'visible' } }}>
                <Box sx={{ bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: 3, overflow: 'hidden', minWidth: { xs: 440, md: 'auto' } }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 120px 140px', bgcolor: C.card2, px: 3, py: 1.5, borderBottom: `1px solid ${C.border}` }}>
                        {['Feature', 'Free', 'Premium'].map((label, i) => (
                            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: i > 0 ? 'center' : 'flex-start' }}>
                                {i === 2 && <StarIcon sx={{ fontSize: 13, color: C.brand }} />}
                                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: i === 2 ? C.brand : C.dim, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                                    {label}
                                </Typography>
                            </Box>
                        ))}
                    </Box>

                    {FEATURES.map((f, i) => (
                        <Box key={f.label} sx={{
                            display: 'grid', gridTemplateColumns: '1fr 120px 140px',
                            px: 3, py: 1.6, alignItems: 'center',
                            bgcolor: i % 2 === 0 ? C.card : C.card2,
                            borderBottom: i < FEATURES.length - 1 ? `1px solid ${C.border}` : 'none',
                        }}>
                            <Typography sx={{ fontSize: '0.84rem', color: C.text }}>{f.label}</Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'center' }}><FeatureValue val={f.free} C={C} /></Box>
                            <Box sx={{ display: 'flex', justifyContent: 'center' }}><FeatureValue val={f.premium} C={C} /></Box>
                        </Box>
                    ))}
                </Box>
                </Box>

                {/* ── Community pitch ──────────────────────────────────────── */}
                <Box sx={{ mt: 5, bgcolor: `${C.brand}0C`, border: `1px solid ${C.brand}33`, borderRadius: 3, px: 3, py: 3 }}>
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                        <ExploreIcon sx={{ color: C.brand, mt: 0.3 }} />
                        <Box>
                            <Typography fontWeight="bold" sx={{ color: C.white, mb: 0.5 }}>Your free contribution fuels the community</Typography>
                            <Typography sx={{ color: C.dim, fontSize: '0.85rem', lineHeight: 1.7 }}>
                                Free users contribute reviews, routes, and ratings — that data powers the personalised recommendations Premium members receive. It's a fair exchange: you share your experience, others help plan yours better.
                            </Typography>
                        </Box>
                    </Stack>
                </Box>

                <Box sx={{ pb: { xs: '100px', md: 8 } }} />
            </Box>

            {/* ══════════════════════════════════════════════════════════════
                PAYMENT CONFIRMATION DIALOG
            ══════════════════════════════════════════════════════════════ */}
            <Dialog
                open={payDialogOpen}
                onClose={() => !loading && setPayDialogOpen(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: 4, overflow: 'hidden' } }}
            >
                {/* Khalti branded header */}
                <Box sx={{
                    background: `linear-gradient(135deg,${KHALTI_PURPLE} 0%,${KHALTI_LIGHT} 100%)`,
                    px: 3, py: 2.5, color: '#fff', position: 'relative',
                }}>
                    <IconButton
                        onClick={() => !loading && setPayDialogOpen(false)}
                        size="small"
                        sx={{ position: 'absolute', top: 8, right: 8, color: 'rgba(255,255,255,0.8)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.15)' } }}
                    >
                        <CloseIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: '#fff', color: KHALTI_PURPLE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.3rem', boxShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>K</Box>
                        <Box>
                            <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', lineHeight: 1.1 }}>Pay with Khalti</Typography>
                            <Typography sx={{ fontSize: '0.72rem', opacity: 0.8, mt: 0.3 }}>Secure digital wallet payment</Typography>
                        </Box>
                    </Stack>
                </Box>

                <DialogContent sx={{ pt: 3, pb: 1 }}>
                    {/* Amount */}
                    <Box sx={{ bgcolor: C.card2, border: `1px solid ${C.border}`, borderRadius: 2.5, px: 2.5, py: 2.5, mb: 3, textAlign: 'center' }}>
                        <Typography sx={{ color: C.dim, fontSize: '0.68rem', letterSpacing: 1.2, textTransform: 'uppercase', mb: 0.8 }}>Amount due</Typography>
                        <Typography sx={{ color: KHALTI_PURPLE, fontWeight: 900, fontSize: '2rem', lineHeight: 1 }}>
                            NPR {plan?.priceValue?.toLocaleString()}
                        </Typography>
                        <Typography sx={{ color: C.dim, fontSize: '0.78rem', mt: 0.8 }}>{plan?.label} · {plan?.per}</Typography>
                        <Chip label="Smart Itinerary Premium" size="small" sx={{ mt: 1, bgcolor: `${KHALTI_PURPLE}18`, color: KHALTI_PURPLE, fontWeight: 600, fontSize: '0.7rem' }} />
                    </Box>

                    {/* What you'll unlock */}
                    <Box sx={{ mb: 2 }}>
                        <Typography sx={{ color: C.dim, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1, mb: 1 }}>What you'll unlock</Typography>
                        {['AI itinerary generation (15/month)', 'Unlimited saved itineraries', 'Full interactive map access', 'Personalised trek recommendations'].map(item => (
                            <Stack key={item} direction="row" spacing={1} alignItems="center" sx={{ mb: 0.7 }}>
                                <CheckCircleIcon sx={{ fontSize: 15, color: '#22c55e', flexShrink: 0 }} />
                                <Typography sx={{ color: C.text, fontSize: '0.82rem' }}>{item}</Typography>
                            </Stack>
                        ))}
                    </Box>

                    <Divider sx={{ borderColor: C.border, mb: 2 }} />

                    <Box sx={{ bgcolor: `${KHALTI_PURPLE}0A`, border: `1px solid ${KHALTI_PURPLE}28`, borderRadius: 2, px: 2, py: 1.5 }}>
                        <Stack direction="row" spacing={1} alignItems="flex-start">
                            <OpenInNewIcon sx={{ color: KHALTI_PURPLE, fontSize: 16, mt: 0.15, flexShrink: 0 }} />
                            <Typography sx={{ color: C.text, fontSize: '0.76rem', lineHeight: 1.6 }}>
                                You'll be taken to Khalti's secure payment page. Your plan activates{' '}
                                <strong style={{ color: C.white }}>automatically</strong> once the payment is confirmed.
                            </Typography>
                        </Stack>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ px: 3, py: 2.5, borderTop: `1px solid ${C.border}`, gap: 1 }}>
                    <Button onClick={() => setPayDialogOpen(false)} disabled={loading} sx={{ color: C.dim, textTransform: 'none', borderRadius: 2 }}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleInitiatePayment}
                        disabled={loading}
                        variant="contained"
                        startIcon={loading ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : <KhaltiMark size={18} />}
                        sx={{
                            bgcolor: KHALTI_PURPLE, color: '#fff', fontWeight: 800, borderRadius: 2,
                            textTransform: 'none', px: 3, minWidth: 180, fontSize: '0.9rem',
                            '&:hover': { bgcolor: KHALTI_PURPLE_DARK },
                            '&:disabled': { bgcolor: KHALTI_LIGHT, color: '#fff', opacity: 0.8 },
                        }}
                    >
                        {loading ? 'Redirecting…' : 'Continue to Khalti'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Toast ───────────────────────────────────────────────────── */}
            <Snackbar
                open={snack.open}
                autoHideDuration={6000}
                onClose={() => setSnack(p => ({ ...p, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={snack.sev} onClose={() => setSnack(p => ({ ...p, open: false }))}
                    sx={{ borderRadius: 3, bgcolor: C.card, color: C.text, border: `1px solid ${C.border}` }}>
                    {snack.msg}
                </Alert>
            </Snackbar>
        </Box>
    );
}

// ─── Reusable status banner wrapper ──────────────────────────────────────────
function Banner({ color, C, borderColor, bgColor, children }) {
    return (
        <Box sx={{
            bgcolor:     bgColor  ?? `${color}14`,
            border:      `1.5px solid ${borderColor ?? `${color}55`}`,
            borderRadius: 3, px: 3, py: 2, mb: 3,
            display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap',
        }}>
            {children}
        </Box>
    );
}

// ─── Plan card ────────────────────────────────────────────────────────────────
function PlanCard({ plan, isSelected, onSelect, C, isDark }) {
    return (
        <Box
            onClick={() => onSelect(plan.id)}
            sx={{
                flex: 1, borderRadius: 3, p: 2.5, cursor: 'pointer', position: 'relative',
                border: isSelected ? `2px solid ${C.brand}` : `1.5px solid ${plan.highlight ? `${C.brand}44` : C.border}`,
                bgcolor: isSelected ? `${C.brand}0E` : plan.highlight ? `${C.brand}07` : C.card,
                transition: 'all 0.2s', boxShadow: isSelected ? `0 0 0 3px ${C.brand}22` : 'none',
                '&:hover': { border: `2px solid ${C.brand}`, bgcolor: `${C.brand}0E` },
            }}
        >
            {plan.badge && (
                <Chip label={plan.badge} size="small" sx={{
                    position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                    bgcolor: C.brand, color: isDark ? '#141627' : '#fff', fontWeight: 800, fontSize: '0.65rem', height: 20,
                }} />
            )}
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Typography fontWeight="bold" sx={{ color: C.white, fontSize: '1rem' }}>{plan.label}</Typography>
                {plan.savingsTag && (
                    <Chip label={plan.savingsTag} size="small" sx={{ bgcolor: `${C.brand}22`, color: C.brand, fontWeight: 700, fontSize: '0.65rem', height: 18 }} />
                )}
            </Stack>
            <Typography sx={{ color: C.brand, fontWeight: 900, fontSize: '1.5rem', mt: 1, lineHeight: 1.1 }}>{plan.price}</Typography>
            <Typography sx={{ color: C.dim, fontSize: '0.73rem' }}>{plan.per}</Typography>
            <Typography sx={{ color: C.dim, fontSize: '0.7rem', mt: 0.2 }}>{plan.perDay}</Typography>
            <Typography sx={{ color: C.dim, fontSize: '0.78rem', mt: 1, lineHeight: 1.5 }}>{plan.description}</Typography>
            <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <Box sx={{
                    width: 14, height: 14, borderRadius: '50%', transition: 'all 0.15s',
                    border: `2px solid ${isSelected ? C.brand : C.dim}`, bgcolor: isSelected ? C.brand : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    {isSelected && <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#fff' }} />}
                </Box>
                <Typography sx={{ fontSize: '0.75rem', color: isSelected ? C.brand : C.dim, fontWeight: isSelected ? 600 : 400 }}>
                    {isSelected ? 'Selected' : 'Select'}
                </Typography>
            </Box>
        </Box>
    );
}
