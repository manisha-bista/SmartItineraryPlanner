/**
 * PaymentReturn.jsx
 *
 * Landing page after Khalti redirects the user back from their hosted
 * payment page. URL will contain:
 *   ?pidx=...&status=Completed&transaction_id=...&amount=...&mobile=...
 *
 * We call our backend to verify the pidx before trusting any URL param.
 * On success, Premium is auto-activated server-side and the user is
 * redirected to the subscription page.
 */
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Typography, CircularProgress, Button, Stack } from '@mui/material';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon       from '@mui/icons-material/ErrorOutline';
import HourglassEmptyIcon     from '@mui/icons-material/HourglassEmpty';
import CancelOutlinedIcon     from '@mui/icons-material/CancelOutlined';

const KHALTI_PURPLE      = '#5C2D91';
const KHALTI_PURPLE_DARK = '#4A2277';

// ── Status display configs ────────────────────────────────────────────────────
const STATUS_CONFIG = {
    verifying: {
        icon:    null,
        color:   KHALTI_PURPLE,
        title:   'Verifying your payment…',
        body:    'Please wait while we confirm your payment with Khalti.',
        cta:     null,
    },
    success: {
        icon:    CheckCircleOutlineIcon,
        color:   '#22c55e',
        title:   'Payment Successful!',
        body:    null,       // filled dynamically
        cta:     'Go to Dashboard',
        ctaPath: '/dashboard',
    },
    pending: {
        icon:    HourglassEmptyIcon,
        color:   '#f59e0b',
        title:   'Payment Pending',
        body:    'Your payment is still being processed. Check back shortly — your plan will activate automatically once confirmed.',
        cta:     'Back to Subscription',
        ctaPath: '/subscription',
    },
    canceled: {
        icon:    CancelOutlinedIcon,
        color:   '#94a3b8',
        title:   'Payment Canceled',
        body:    "You canceled the payment. No charge was made. You can try again whenever you're ready.",
        cta:     'Back to Subscription',
        ctaPath: '/subscription',
    },
    failed: {
        icon:    ErrorOutlineIcon,
        color:   '#ef4444',
        title:   'Payment Failed',
        body:    null,       // filled dynamically
        cta:     'Try Again',
        ctaPath: '/subscription',
    },
    error: {
        icon:    ErrorOutlineIcon,
        color:   '#ef4444',
        title:   'Something Went Wrong',
        body:    'We couldn\'t verify your payment. Please contact support if you were charged.',
        cta:     'Back to Subscription',
        ctaPath: '/subscription',
    },
};

export default function PaymentReturn() {
    const navigate                  = useNavigate();
    const [searchParams]            = useSearchParams();
    const { COLORS }                = useTheme();
    const verified                  = useRef(false);    // guard against double-call in dev Strict Mode

    const [phase, setPhase]         = useState('verifying');
    const [detail, setDetail]       = useState(null);   // { plan, premium_until, transaction_id, amount, message }
    const [countdown, setCountdown] = useState(5);

    const C = {
        bg:     COLORS.background,
        card:   COLORS.cardPrimary,
        border: COLORS.cardBorder,
        white:  COLORS.headings,
        dim:    COLORS.fadedText,
        text:   COLORS.text,
    };

    // ── Verify payment on mount ───────────────────────────────────────────────
    useEffect(() => {
        if (verified.current) return;
        verified.current = true;

        const pidx    = searchParams.get('pidx');
        const urlStat = searchParams.get('status');  // Khalti's own status in URL
        const userId  = localStorage.getItem('userId');

        if (!userId) { navigate('/login'); return; }
        if (!pidx)   { setPhase('error'); return; }

        // Quick pre-check: if Khalti already told us it's canceled, skip the
        // server call for a snappier UX — but we still trust the backend verdict.
        if (urlStat === 'User canceled') {
            setPhase('canceled');
            return;
        }

        axios.post(`${import.meta.env.VITE_BACKEND_API_URL}subscriptions/khalti/verify`, {
            pidx,
            user_id: parseInt(userId),
        })
            .then(({ data }) => {
                if (data.status === 'success') {
                    localStorage.setItem('subscriptionTier', 'premium');
                    setDetail(data);
                    setPhase('success');
                } else if (data.status === 'pending') {
                    setPhase('pending');
                } else if (data.status === 'canceled') {
                    setPhase('canceled');
                } else {
                    setDetail({ message: data.message });
                    setPhase('failed');
                }
            })
            .catch(err => {
                console.error('Khalti verify error:', err);
                setDetail({ message: err.response?.data?.detail || 'Verification failed.' });
                setPhase('error');
            });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Auto-redirect countdown on success ───────────────────────────────────
    useEffect(() => {
        if (phase !== 'success') return;
        const timer = setInterval(() => {
            setCountdown(n => {
                if (n <= 1) {
                    clearInterval(timer);
                    navigate('/dashboard');
                    return 0;
                }
                return n - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [phase, navigate]);

    // ── Render ────────────────────────────────────────────────────────────────
    const cfg  = STATUS_CONFIG[phase] || STATUS_CONFIG.error;
    const Icon = cfg.icon;

    const formatDate = iso => {
        if (!iso) return null;
        return new Date(iso).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'long', year: 'numeric',
        });
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            bgcolor:   C.bg,
            display:   'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
            fontFamily: '"Exo 2", "Segoe UI", sans-serif',
        }}>
            <Box sx={{
                width: '100%',
                maxWidth: 480,
                bgcolor: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 4,
                overflow: 'hidden',
                boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
            }}>
                {/* ── Khalti branded header ───────────────────────────────── */}
                <Box sx={{
                    background: `linear-gradient(135deg, ${KHALTI_PURPLE} 0%, #7B3FB8 100%)`,
                    px: 3, py: 2.5,
                    display: 'flex', alignItems: 'center', gap: 1.5,
                }}>
                    <Box sx={{
                        width: 34, height: 34, borderRadius: 1.5,
                        bgcolor: '#fff', color: KHALTI_PURPLE,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 900, fontSize: '1.1rem',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    }}>K</Box>
                    <Box>
                        <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '1rem', lineHeight: 1.1 }}>
                            Khalti Payment
                        </Typography>
                        <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.7rem' }}>
                            Smart Itinerary Premium
                        </Typography>
                    </Box>
                </Box>

                {/* ── Status body ─────────────────────────────────────────── */}
                <Box sx={{ px: 4, py: 5, textAlign: 'center' }}>
                    {phase === 'verifying' ? (
                        <CircularProgress sx={{ color: KHALTI_PURPLE, mb: 3 }} size={52} thickness={3} />
                    ) : Icon ? (
                        <Box sx={{
                            width: 72, height: 72, borderRadius: '50%',
                            bgcolor: `${cfg.color}18`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            mx: 'auto', mb: 3,
                        }}>
                            <Icon sx={{ fontSize: 38, color: cfg.color }} />
                        </Box>
                    ) : null}

                    <Typography sx={{
                        color: C.white, fontWeight: 800,
                        fontSize: '1.3rem', mb: 1.5,
                    }}>
                        {cfg.title}
                    </Typography>

                    {/* Dynamic body text */}
                    {phase === 'success' && detail ? (
                        <Stack spacing={0.5} sx={{ mb: 3 }}>
                            <Typography sx={{ color: C.dim, fontSize: '0.88rem', lineHeight: 1.6 }}>
                                Your <strong style={{ color: C.white }}>
                                    {detail.plan_label || detail.plan}
                                </strong> plan is now active.
                            </Typography>
                            {detail.premium_until && (
                                <Typography sx={{ color: C.dim, fontSize: '0.85rem' }}>
                                    Access expires on{' '}
                                    <strong style={{ color: C.white }}>
                                        {formatDate(detail.premium_until)}
                                    </strong>.
                                </Typography>
                            )}
                            {detail.transaction_id && (
                                <Typography sx={{
                                    color: C.dim, fontSize: '0.76rem',
                                    fontFamily: 'monospace', mt: 0.5,
                                }}>
                                    Txn: {detail.transaction_id}
                                </Typography>
                            )}
                        </Stack>
                    ) : (
                        <Typography sx={{ color: C.dim, fontSize: '0.88rem', lineHeight: 1.6, mb: 3 }}>
                            {cfg.body ?? detail?.message ?? ''}
                        </Typography>
                    )}

                    {/* Amount pill (success) */}
                    {phase === 'success' && detail?.amount && (
                        <Box sx={{
                            display: 'inline-block',
                            bgcolor: `${KHALTI_PURPLE}18`, border: `1px solid ${KHALTI_PURPLE}44`,
                            borderRadius: 10, px: 2.5, py: 0.8, mb: 3,
                        }}>
                            <Typography sx={{ color: KHALTI_PURPLE, fontWeight: 800, fontSize: '1rem' }}>
                                NPR {detail.amount?.toLocaleString()} paid
                            </Typography>
                        </Box>
                    )}

                    {/* CTA button */}
                    {cfg.cta && (
                        <Button
                            fullWidth
                            variant="contained"
                            onClick={() => navigate(cfg.ctaPath)}
                            sx={{
                                bgcolor: phase === 'success' ? '#22c55e' : KHALTI_PURPLE,
                                color: '#fff',
                                fontWeight: 700, borderRadius: 2.5,
                                textTransform: 'none', py: 1.3, fontSize: '0.95rem',
                                '&:hover': {
                                    bgcolor: phase === 'success' ? '#16a34a' : KHALTI_PURPLE_DARK,
                                },
                            }}
                        >
                            {cfg.cta}
                            {phase === 'success' && countdown < 5 ? ` (${countdown}s)` : ''}
                        </Button>
                    )}

                    {/* Redirect notice */}
                    {phase === 'success' && (
                        <Typography sx={{ color: C.dim, fontSize: '0.74rem', mt: 1.5 }}>
                            Redirecting to dashboard in {countdown}s…
                        </Typography>
                    )}

                    {/* Support note for failed/error */}
                    {(phase === 'failed' || phase === 'error') && (
                        <Typography sx={{ color: C.dim, fontSize: '0.74rem', mt: 2 }}>
                            If you were charged and your plan wasn't activated, please contact{' '}
                            <span style={{ color: KHALTI_PURPLE }}>support@smartitinerary.com</span>.
                        </Typography>
                    )}
                </Box>
            </Box>
        </Box>
    );
}
