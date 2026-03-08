import React, { useState } from 'react';
import { Box, Button, Typography, Stack, GlobalStyles, IconButton, Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import MapIcon from '@mui/icons-material/Map';
import GroupIcon from '@mui/icons-material/Group';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LuggageIcon from '@mui/icons-material/Luggage';
import CellTowerIcon from '@mui/icons-material/CellTower';
import SyncIcon from '@mui/icons-material/Sync';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

// Brand Colors — two full themes
const DARK_COLORS = {
    brand: '#33CCCC',
    background: '#141627',
    cardPrimary: '#1E2140',
    cardSecondary: '#252845',
    headings: '#B0D2EB',
    text: '#C8D0E0',
    fadedText: '#7B809A',
    navbarBg: 'transparent',
    featureStripBg: '#1E2140',
    footerBg: '#1E2140',
    borderColor: 'rgba(51,204,204,0.1)',
    cardBorder: 'rgba(255,255,255,0.05)',
    cardBorderHover: 'rgba(51,204,204,0.3)',
    glowColor: 'rgba(51,204,204,0.07)',
    blobColor: '#33CCCC',
    ctaBg: '#252845',
};

const LIGHT_COLORS = {
    brand: '#1AAFAF',
    background: '#F0F4FA',
    cardPrimary: '#FFFFFF',
    cardSecondary: '#FFFFFF',
    headings: '#1A2D6B',
    text: '#2D3748',
    fadedText: '#64748B',
    navbarBg: 'transparent',
    featureStripBg: '#FFFFFF',
    footerBg: '#FFFFFF',
    borderColor: 'rgba(26,175,175,0.15)',
    cardBorder: 'rgba(26,175,175,0.15)',
    cardBorderHover: 'rgba(26,175,175,0.5)',
    glowColor: 'rgba(26,175,175,0.06)',
    blobColor: '#1AAFAF',
    ctaBg: '#FFFFFF',
};

// --- NAVBAR ---
const Navbar = ({ COLORS, isDark, onToggle }) => {
    const navigate = useNavigate();
    return (
        <Box sx={{
            py: 2.5,
            px: { xs: 3, md: 6 },
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'relative',
            zIndex: 10,
        }}>
            {/* Logo */}
            <Stack direction="row" alignItems="center" spacing={1}>
                <Box component="span" sx={{ color: COLORS.brand, fontSize: '1.5rem' }}>✈</Box>
                <Typography variant="h6" fontWeight="bold" sx={{
                    color: isDark ? 'white' : COLORS.headings,
                    fontFamily: '"Exo 2", sans-serif',
                    letterSpacing: 0.5
                }}>
                    Smart <Box component="span" sx={{ color: COLORS.brand }}>Itinerary</Box>
                </Typography>
            </Stack>

            {/* Nav Links + Toggle */}
            <Stack direction="row" spacing={1} alignItems="center">
                {['Home', 'Features'].map((item) => (
                    <Button key={item} sx={{
                        color: isDark ? 'white' : COLORS.headings,
                        bgcolor: 'transparent',
                        borderRadius: 5,
                        px: 3,
                        py: 1,
                        fontWeight: 600,
                        textTransform: 'none',
                        fontSize: '0.9rem',
                        '&:hover': { bgcolor: isDark ? 'rgba(51,204,204,0.1)' : 'rgba(26,175,175,0.08)' }
                    }}>
                        {item}
                    </Button>
                ))}
                <Button
                    onClick={() => navigate('/login')}
                    sx={{
                        color: isDark ? 'white' : COLORS.headings,
                        bgcolor: 'transparent',
                        border: `1.5px solid ${COLORS.brand}`,
                        borderRadius: 5,
                        px: 3,
                        py: 1,
                        fontWeight: 600,
                        textTransform: 'none',
                        fontSize: '0.9rem',
                        '&:hover': { bgcolor: isDark ? 'rgba(51,204,204,0.1)' : 'rgba(26,175,175,0.08)' }
                    }}>
                    Sign In
                </Button>
                <Button
                    onClick={() => navigate('/register')}
                    sx={{
                        color: isDark ? '#141627' : '#FFFFFF',
                        bgcolor: COLORS.brand,
                        borderRadius: 5,
                        px: 3,
                        py: 1,
                        fontWeight: 700,
                        textTransform: 'none',
                        fontSize: '0.9rem',
                        '&:hover': { bgcolor: isDark ? '#2db8b8' : '#179898' }
                    }}>
                    Sign Up
                </Button>

                {/* Theme Toggle */}
                <Tooltip title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
                    <IconButton
                        onClick={onToggle}
                        sx={{
                            ml: 0.5,
                            width: 40,
                            height: 40,
                            borderRadius: 3,
                            bgcolor: isDark ? 'rgba(51,204,204,0.12)' : 'rgba(26,175,175,0.1)',
                            color: COLORS.brand,
                            border: `1.5px solid ${isDark ? 'rgba(51,204,204,0.25)' : 'rgba(26,175,175,0.25)'}`,
                            transition: 'all 0.25s ease',
                            '&:hover': {
                                bgcolor: isDark ? 'rgba(51,204,204,0.2)' : 'rgba(26,175,175,0.18)',
                                transform: 'rotate(20deg) scale(1.1)',
                            }
                        }}
                    >
                        {isDark ? <LightModeIcon sx={{ fontSize: 18 }} /> : <DarkModeIcon sx={{ fontSize: 18 }} />}
                    </IconButton>
                </Tooltip>
            </Stack>
        </Box>
    );
};

// --- MAIN LANDING ---
const Landing = () => {
    const navigate = useNavigate();
    const [isDark, setIsDark] = useState(true);
    const COLORS = isDark ? DARK_COLORS : LIGHT_COLORS;

    const toggleTheme = () => setIsDark(prev => !prev);

    const features = [
        { label: 'Map Visualization' },
        { label: 'Community Driven' },
        { label: 'Smart Recommendations' },
    ];

    const whyPoints = [
        { icon: <MapIcon sx={{ color: 'white', fontSize: 22 }} />, text: 'Travel planning in Nepal can be fragmented.' },
        { icon: <GroupIcon sx={{ color: 'white', fontSize: 22 }} />, text: 'You rely on word-of-mouth, random social media posts, and scattered maps.' },
        { icon: <AutoAwesomeIcon sx={{ color: 'white', fontSize: 22 }} />, text: 'All your travel details organized in one convenient place.' },
    ];

    const smartFeatures = [
        { icon: <LuggageIcon sx={{ fontSize: 32, color: COLORS.brand }} />, title: 'Interactive Itinerary', desc: 'Drag and drop destinations to create the perfect flow. Edit time slots and visualize your entire journey.' },
        { icon: <CellTowerIcon sx={{ fontSize: 32, color: COLORS.brand }} />, title: 'Community Live Feed', desc: "Don't get stuck. See real-time reports from other users about construction, road closures, or local events." },
        { icon: <SyncIcon sx={{ fontSize: 32, color: COLORS.brand }} />, title: 'Real-Time Sync', desc: 'Share and collaborate with travel companions. Everyone stays on the same page.' },
        { icon: <AccountBalanceWalletIcon sx={{ fontSize: 32, color: COLORS.brand }} />, title: 'Smart Budgeting', desc: 'Keep your finances in check. Estimate costs for each leg of your trip and track actual spending as you go.' },
    ];

    const curated = [
        {
            title: 'Heritage Walks in Bhaktapur',
            desc: 'Escape the crowds. Explore hidden courtyards and ancient pottery squares with our curated walking routes.',
            img: 'https://images.unsplash.com/photo-1707912258699-ee8d6179dee0?q=80&w=400&auto=format&fit=crop',
            placeId: 'bhaktapur'
        },
        {
            title: 'Safe Travels in Kathmandu',
            desc: 'Navigate the chaos like a local. Get real-time community updates on road closures and traffic jams.....',
            img: 'https://images.unsplash.com/photo-1748760036656-964ac32eefb4?q=80&w=400&auto=format&fit=crop',
            placeId: 'kathmandu'
        },
        {
            title: 'Pokhara on a Budget',
            desc: 'Plan a 3-day lakeside getaway under NPR 10,000. See how our budget tool helps you track every rupee.....',
            img: 'https://images.unsplash.com/photo-1562462181-b228e3cff9ad?q=80&w=400&auto=format&fit=crop',
            placeId: 'pokhara'
        },
    ];

    const testimonials = [
        {
            name: 'Jessa Saligao',
            role: 'Adventure Traveler',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=80',
            quote: '"Travelie planned my Annapurna trip in 5 minutes. Best travel hack ever! I discovered places I would have never found on my own."'
        },
        {
            name: 'Alethea Malata',
            role: 'Business Traveler',
            avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=80',
            quote: '"As someone who travels for work constantly, Smart Itinerary planner has been a game-changer. It keeps my business meetings and leisure time perfectly organized."'
        },
        {
            name: 'Faith Banares',
            role: 'Family Travelers',
            avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=80',
            quote: '"Planning a trip with kids was always stressful until we found Smart Itinerary. Now our family vacations are smooth and enjoyable from start to finish!"'
        },
    ];

    return (
        <Box sx={{
            bgcolor: COLORS.background,
            minHeight: '100vh',
            fontFamily: '"Exo 2", "Segoe UI", sans-serif',
            overflowX: 'hidden',
            transition: 'background-color 0.35s ease, color 0.35s ease',
        }}>
            <GlobalStyles styles={{
                'html, body, #root': { margin: 0, padding: 0, background: COLORS.background },
                '*': { transition: 'background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease' }
            }} />

            {/* ======= PAGE 1: HERO ======= */}
            <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <Navbar COLORS={COLORS} isDark={isDark} onToggle={toggleTheme} />

                {/* Hero Content */}
                <Box sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    px: { xs: 3, md: 6 },
                    py: 4,
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* Glow background accent */}
                    <Box sx={{
                        position: 'absolute',
                        top: '20%',
                        left: '-5%',
                        width: 500,
                        height: 500,
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${COLORS.glowColor} 0%, transparent 70%)`,
                        pointerEvents: 'none'
                    }} />

                    {/* Left: Text */}
                    <Box sx={{ flex: 1, maxWidth: 560, zIndex: 1 }}>
                        <Typography variant="h2" component="h1" fontWeight={800} sx={{
                            color: isDark ? 'white' : COLORS.headings,
                            fontFamily: '"Exo 2", sans-serif',
                            lineHeight: 1.15,
                            mb: 2.5,
                            fontSize: { xs: '2.2rem', md: '3rem' }
                        }}>
                            Plan better.{' '}
                            <Box component="span" sx={{ color: COLORS.brand }}>Travel smarter.</Box>
                        </Typography>

                        <Typography variant="body1" sx={{
                            color: COLORS.fadedText,
                            mb: 4,
                            lineHeight: 1.8,
                            fontSize: '1.05rem',
                            maxWidth: 480
                        }}>
                            A centralized platform to build interactive itineraries, visualize your route on Google Maps, and get real-time community updates for your trips in Nepal.
                        </Typography>

                        <Stack direction="row" spacing={2} sx={{ mb: 5 }}>
                            <Button
                                variant="contained"
                                onClick={() => navigate('/register')}
                                sx={{
                                    bgcolor: COLORS.brand,
                                    color: isDark ? '#141627' : '#FFFFFF',
                                    fontWeight: 700,
                                    px: 4,
                                    py: 1.5,
                                    borderRadius: 5,
                                    fontSize: '1rem',
                                    textTransform: 'none',
                                    '&:hover': {
                                        bgcolor: isDark ? '#2db8b8' : '#179898',
                                        boxShadow: `0 6px 20px rgba(51,204,204,0.4)`
                                    }
                                }}
                            >
                                Start Planning
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={() => navigate('/login')}
                                sx={{
                                    color: isDark ? 'white' : COLORS.headings,
                                    borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(26,175,175,0.4)',
                                    borderRadius: 5,
                                    px: 4,
                                    py: 1.5,
                                    fontSize: '1rem',
                                    textTransform: 'none',
                                    '&:hover': {
                                        borderColor: COLORS.brand,
                                        color: COLORS.brand,
                                        bgcolor: 'transparent'
                                    }
                                }}
                            >
                                See How It Works
                            </Button>
                        </Stack>
                    </Box>

                    {/* Right: Travellers image */}
                    <Box sx={{
                        flex: 1,
                        display: { xs: 'none', md: 'flex' },
                        justifyContent: 'center',
                        alignItems: 'center',
                        position: 'relative'
                    }}>
                        <Box sx={{
                            position: 'absolute',
                            top: '5%',
                            right: '10%',
                            width: 220,
                            height: 280,
                            bgcolor: COLORS.blobColor,
                            borderRadius: 5,
                            opacity: 0.15,
                            transform: 'rotate(8deg)'
                        }} />
                        <Box sx={{
                            position: 'absolute',
                            bottom: '5%',
                            right: '22%',
                            width: 160,
                            height: 200,
                            bgcolor: COLORS.blobColor,
                            borderRadius: 5,
                            opacity: 0.12,
                            transform: 'rotate(-5deg)'
                        }} />
                        <Box
                            component="img"
                            src="/src/travellers.png"
                            alt="Travellers"
                            sx={{
                                width: '90%',
                                maxWidth: 500,
                                objectFit: 'contain',
                                position: 'relative',
                                zIndex: 2,
                                filter: isDark
                                    ? 'drop-shadow(0 20px 40px rgba(51,204,204,0.2))'
                                    : 'drop-shadow(0 20px 40px rgba(26,175,175,0.15))'
                            }}
                        />
                        <Typography sx={{
                            position: 'absolute',
                            top: '15%',
                            right: '5%',
                            color: COLORS.fadedText,
                            fontSize: '2rem',
                            fontWeight: 'bold',
                            opacity: 0.5
                        }}>!?</Typography>
                        <Box sx={{
                            position: 'absolute',
                            top: '10%',
                            left: '8%',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 0.5,
                            opacity: 0.4
                        }}>
                            {[...Array(3)].map((_, i) => (
                                <Stack key={i} direction="row" spacing={0.5}>
                                    {[...Array(3)].map((_, j) => (
                                        <Box key={j} sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: COLORS.brand }} />
                                    ))}
                                </Stack>
                            ))}
                        </Box>
                    </Box>
                </Box>

                {/* Features Strip */}
                <Box sx={{
                    bgcolor: COLORS.featureStripBg,
                    borderTop: `1px solid ${COLORS.borderColor}`,
                    py: 4,
                    px: { xs: 3, md: 6 },
                    textAlign: 'center',
                    boxShadow: isDark ? 'none' : '0 -2px 12px rgba(0,0,0,0.04)'
                }}>
                    <Typography sx={{
                        color: COLORS.fadedText,
                        letterSpacing: 3,
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        display: 'block',
                        mb: 2
                    }}>
                        Powered by Smart Features
                    </Typography>
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        alignItems="center"
                        justifyContent="center"
                        flexWrap="wrap"
                        sx={{ gap: { xs: 1.5, sm: 0 } }}
                        divider={
                            <Box sx={{
                                width: 5,
                                height: 5,
                                borderRadius: '50%',
                                bgcolor: COLORS.brand,
                                mx: 3,
                                opacity: 0.5,
                                flexShrink: 0,
                                display: { xs: 'none', sm: 'block' }
                            }} />
                        }
                    >
                        {features.map((f) => (
                            <Typography
                                key={f.label}
                                sx={{
                                    color: COLORS.headings,
                                    fontWeight: 500,
                                    fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
                                    fontSize: { xs: '1rem', md: '1.1rem' },
                                    letterSpacing: 1.5,
                                    textTransform: 'uppercase',
                                    cursor: 'default',
                                    transition: 'color 0.2s',
                                    '&:hover': { color: COLORS.brand }
                                }}
                            >
                                {f.label}
                            </Typography>
                        ))}
                    </Stack>
                </Box>
            </Box>

            {/* ======= PAGE 2: WHY + SMART FEATURES ======= */}
            <Box sx={{ py: { xs: 6, md: 10 }, px: { xs: 3, md: 6 } }}>
                <Box sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    gap: 6,
                    mb: 10,
                    alignItems: 'flex-start'
                }}>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h4" fontWeight={800} sx={{
                            color: COLORS.brand,
                            fontFamily: '"Exo 2", sans-serif',
                            mb: 1.5
                        }}>
                            Why smart Itinerary Planner?
                        </Typography>
                        <Typography variant="body1" sx={{ color: COLORS.fadedText, mb: 2, lineHeight: 1.8 }}>
                            Stop juggling spreadsheets, vlogs, and scattered forums.
                        </Typography>
                        <Typography variant="body2" sx={{
                            color: COLORS.brand,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            '&:hover': { textDecoration: 'underline' }
                        }}>
                            More about us →
                        </Typography>
                    </Box>
                    <Box sx={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {whyPoints.map((point, i) => (
                            <Box key={i} sx={{
                                bgcolor: COLORS.cardSecondary,
                                borderRadius: 3,
                                p: 2.5,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                border: `1px solid ${COLORS.cardBorder}`,
                                boxShadow: isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.06)',
                                transition: 'all 0.3s',
                                '&:hover': {
                                    borderColor: COLORS.cardBorderHover,
                                    transform: 'translateX(4px)'
                                }
                            }}>
                                <Box sx={{
                                    width: 44,
                                    height: 44,
                                    flexShrink: 0,
                                    borderRadius: 2.5,
                                    bgcolor: COLORS.brand,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    {point.icon}
                                </Box>
                                <Typography variant="body2" sx={{ color: COLORS.fadedText, lineHeight: 1.7 }}>
                                    {point.text}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>

                {/* Smart Features Grid */}
                <Box>
                    <Typography variant="h4" fontWeight={800} sx={{
                        color: isDark ? 'white' : COLORS.headings,
                        fontFamily: '"Exo 2", sans-serif',
                        mb: 4,
                    }}>
                        Smart Features for{' '}
                        <Box component="span" sx={{ color: COLORS.brand }}>Smart Travelers</Box>
                    </Typography>
                    <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
                        gap: 3
                    }}>
                        {smartFeatures.map((f, i) => (
                            <Box key={i} sx={{
                                bgcolor: COLORS.cardSecondary,
                                borderRadius: 4,
                                p: 3.5,
                                border: `1px solid ${COLORS.cardBorder}`,
                                boxShadow: isDark ? 'none' : '0 2px 16px rgba(0,0,0,0.07)',
                                transition: 'all 0.3s',
                                '&:hover': {
                                    borderColor: COLORS.cardBorderHover,
                                    transform: 'translateY(-6px)',
                                    boxShadow: isDark
                                        ? `0 12px 32px rgba(51,204,204,0.1)`
                                        : `0 12px 32px rgba(26,175,175,0.15)`
                                }
                            }}>
                                <Box sx={{ mb: 2 }}>{f.icon}</Box>
                                <Typography variant="subtitle1" fontWeight={700} sx={{ color: isDark ? 'white' : COLORS.headings, mb: 1.5 }}>
                                    {f.title}
                                </Typography>
                                <Typography variant="body2" sx={{ color: COLORS.fadedText, lineHeight: 1.8 }}>
                                    {f.desc}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>
            </Box>

            {/* ======= PAGE 3: CURATED + TESTIMONIALS ======= */}
            <Box sx={{ py: { xs: 6, md: 10 }, px: { xs: 3, md: 6 } }}>
                <Typography variant="h4" fontWeight={800} sx={{
                    color: isDark ? 'white' : COLORS.headings,
                    fontFamily: '"Exo 2", sans-serif',
                    mb: 4
                }}>
                    Curated Plans for{' '}
                    <Box component="span" sx={{ color: COLORS.brand }}>Nepal's Best Spots</Box>
                </Typography>

                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
                    gap: 3,
                    mb: 10
                }}>
                    {/* Curated place cards — clicking card or Read More navigates to PlaceDetail */}
                    {curated.map((item, i) => (
                        <Box
                            key={i}
                            onClick={() => navigate(`/place/${item.placeId}`)}
                            sx={{
                                borderRadius: 4,
                                overflow: 'hidden',
                                bgcolor: COLORS.cardSecondary,
                                boxShadow: isDark ? 'none' : '0 2px 16px rgba(0,0,0,0.08)',
                                transition: 'all 0.3s',
                                cursor: 'pointer',
                                '&:hover': {
                                    transform: 'translateY(-6px)',
                                    boxShadow: isDark ? `0 12px 32px rgba(0,0,0,0.4)` : `0 12px 32px rgba(0,0,0,0.15)`
                                }
                            }}>
                            <Box
                                component="img"
                                src={item.img}
                                alt={item.title}
                                sx={{ width: '100%', height: 320, objectFit: 'cover', display: 'block' }}
                            />
                            <Box sx={{ p: 2.5 }}>
                                <Typography variant="subtitle1" fontWeight={700} sx={{ color: isDark ? 'white' : COLORS.headings, mb: 1 }}>
                                    {item.title}
                                </Typography>
                                <Typography variant="body2" sx={{ color: COLORS.fadedText, mb: 1.5, lineHeight: 1.7 }}>
                                    {item.desc}
                                </Typography>
                                <Typography variant="body2" sx={{
                                    color: COLORS.brand,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    '&:hover': { textDecoration: 'underline' }
                                }}>
                                    Read More →
                                </Typography>
                            </Box>
                        </Box>
                    ))}

                    {/* 4th card: CTA — routes to register */}
                    <Box
                        onClick={() => navigate('/register')}
                        sx={{
                            borderRadius: 4,
                            overflow: 'hidden',
                            position: 'relative',
                            cursor: 'pointer',
                            minHeight: 460,
                            '&:hover img': { transform: 'scale(1.05)' }
                        }}>
                        <Box
                            component="img"
                            src="https://images.unsplash.com/photo-1554629947-334ff61d85dc?q=80&w=400"
                            alt="Your Route"
                            sx={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                transition: 'transform 0.4s',
                                position: 'absolute', top: 0, left: 0
                            }}
                        />
                        <Box sx={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.72))',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-end',
                            p: 3
                        }}>
                            <Typography variant="h5" fontWeight={800} sx={{ color: 'white', mb: 2 }}>
                                Your Route.<br />Your Rules.
                            </Typography>
                            <Typography variant="body2" sx={{
                                color: COLORS.brand,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                cursor: 'pointer'
                            }}>
                                Get Started →
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Testimonials */}
                <Typography variant="h4" fontWeight={800} sx={{
                    color: isDark ? 'white' : COLORS.headings,
                    fontFamily: '"Exo 2", sans-serif',
                    mb: 4
                }}>
                    What Our <Box component="span" sx={{ color: COLORS.brand }}>Travelers Say</Box>
                </Typography>

                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                    gap: 3,
                    mb: 6
                }}>
                    {testimonials.map((t, i) => (
                        <Box key={i} sx={{
                            bgcolor: COLORS.cardSecondary,
                            borderRadius: 4,
                            p: 3.5,
                            border: `1px solid ${COLORS.cardBorder}`,
                            boxShadow: isDark ? 'none' : '0 2px 16px rgba(0,0,0,0.07)',
                            transition: 'all 0.3s',
                            '&:hover': {
                                borderColor: COLORS.cardBorderHover,
                                transform: 'translateY(-4px)'
                            }
                        }}>
                            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2.5 }}>
                                <Box
                                    component="img"
                                    src={t.avatar}
                                    alt={t.name}
                                    sx={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover' }}
                                />
                                <Box>
                                    <Typography variant="subtitle2" fontWeight={700} sx={{ color: isDark ? 'white' : COLORS.headings }}>
                                        {t.name}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: COLORS.fadedText }}>
                                        {t.role}
                                    </Typography>
                                </Box>
                            </Stack>
                            <Typography variant="body2" sx={{ color: COLORS.fadedText, lineHeight: 1.8, mb: 2 }}>
                                {t.quote}
                            </Typography>
                            <Stack direction="row" spacing={0.5}>
                                {[...Array(5)].map((_, j) => (
                                    <Box key={j} component="span" sx={{ color: '#FFD700', fontSize: '1rem' }}>★</Box>
                                ))}
                            </Stack>
                        </Box>
                    ))}
                </Box>

                {/* CTA Banner */}
                <Box sx={{
                    bgcolor: COLORS.ctaBg,
                    borderRadius: 5,
                    p: { xs: 4, md: 6 },
                    textAlign: 'center',
                    border: `1px solid rgba(51,204,204,0.2)`,
                    background: isDark
                        ? `linear-gradient(135deg, ${COLORS.cardSecondary}, rgba(51,204,204,0.05))`
                        : `linear-gradient(135deg, #FFFFFF, rgba(26,175,175,0.05))`,
                    boxShadow: isDark ? 'none' : '0 4px 24px rgba(0,0,0,0.07)'
                }}>
                    <Typography variant="h4" fontWeight={800} sx={{
                        color: isDark ? 'white' : COLORS.headings,
                        fontFamily: '"Exo 2", sans-serif',
                        mb: 2
                    }}>
                        Ready to plan your next <Box component="span" sx={{ color: COLORS.brand }}>Nepal adventure?</Box>
                    </Typography>
                    <Typography variant="body1" sx={{ color: COLORS.fadedText, mb: 4, maxWidth: 500, mx: 'auto' }}>
                        Join thousands of travelers who plan smarter with Smart Itinerary.
                    </Typography>
                    <Button
                        variant="contained"
                        size="large"
                        onClick={() => navigate('/register')}
                        sx={{
                            bgcolor: COLORS.brand,
                            color: isDark ? '#141627' : '#FFFFFF',
                            fontWeight: 700,
                            px: 6,
                            py: 1.75,
                            borderRadius: 5,
                            fontSize: '1.05rem',
                            textTransform: 'none',
                            '&:hover': {
                                bgcolor: isDark ? '#2db8b8' : '#179898',
                                boxShadow: `0 8px 24px rgba(51,204,204,0.4)`
                            }
                        }}
                    >
                        Get Started Free
                    </Button>
                </Box>
            </Box>

            {/* ======= GLOBAL FOOTER ======= */}
            <Box sx={{
                bgcolor: COLORS.footerBg,
                borderTop: `1px solid ${COLORS.borderColor}`,
                py: 3,
                px: { xs: 3, md: 6 },
                textAlign: 'center',
                boxShadow: isDark ? 'none' : '0 -2px 10px rgba(0,0,0,0.04)'
            }}>
                <Typography variant="body2" sx={{ color: COLORS.fadedText }}>
                    © 2026 Smart Itinerary Planner. All rights reserved.
                </Typography>
            </Box>
        </Box>
    );
};

export default Landing;