import React, { useState } from 'react';
import { Box, Typography, Stack, Button, Chip, IconButton, Tooltip } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import StarIcon from '@mui/icons-material/Star';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import HotelIcon from '@mui/icons-material/Hotel';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';

// --- THEME COLORS (same as Landing) ---
const DARK_COLORS = {
    brand: '#33CCCC',
    background: '#141627',
    cardPrimary: '#1E2140',
    cardSecondary: '#252845',
    headings: '#B0D2EB',
    text: '#C8D0E0',
    fadedText: '#7B809A',
    borderColor: 'rgba(51,204,204,0.1)',
    cardBorder: 'rgba(255,255,255,0.05)',
    cardBorderHover: 'rgba(51,204,204,0.3)',
    glowColor: 'rgba(51,204,204,0.07)',
};
const LIGHT_COLORS = {
    brand: '#1AAFAF',
    background: '#F0F4FA',
    cardPrimary: '#FFFFFF',
    cardSecondary: '#FFFFFF',
    headings: '#1A2D6B',
    text: '#2D3748',
    fadedText: '#64748B',
    borderColor: 'rgba(26,175,175,0.15)',
    cardBorder: 'rgba(26,175,175,0.15)',
    cardBorderHover: 'rgba(26,175,175,0.5)',
    glowColor: 'rgba(26,175,175,0.06)',
};

// --- PLACE DATA ---
const PLACES = {
    bhaktapur: {
        id: 'bhaktapur',
        title: 'Heritage Walks in Bhaktapur',
        subtitle: 'The City of Devotees',
        heroImg: 'https://images.unsplash.com/photo-1707912258699-ee8d6179dee0?q=80&w=1200&auto=format&fit=crop',
        rating: 4.8,
        duration: '1–2 Days',
        budget: 'NPR 2,000 – 5,000 / day',
        location: 'Bhaktapur, Bagmati Province',
        overview: `Bhaktapur, meaning "City of Devotees," is a living museum of medieval Nepal — a UNESCO World Heritage Site that has largely resisted the rush of modernization. Its labyrinthine streets open up to sudden courtyards where life unfolds just as it has for centuries: potters spinning clay at Pottery Square, women drying red chillies on stone steps, and bells chiming from ancient pagodas.\n\nUnlike Kathmandu's more chaotic bazaars, Bhaktapur is walkable, intimate, and deeply atmospheric. Every corner tells a story — from the 55-window palace of the Malla kings to the serene Dattatreya Temple, guarded by a single sacred pipal tree.`,
        highlights: [
            {
                icon: <DirectionsWalkIcon />,
                label: 'Itinerary',
                items: [
                    { time: 'Morning', detail: 'Start at Bhaktapur Durbar Square — explore the 55-Window Palace and Vatsala Temple at golden hour.' },
                    { time: 'Mid-morning', detail: 'Wander south to Taumadhi Square, home of the towering Nyatapola Temple (5 stories, built 1702).' },
                    { time: 'Afternoon', detail: 'Lose yourself in Pottery Square — watch artisans craft traditional clay pots and pick up a souvenir.' },
                    { time: 'Late Afternoon', detail: 'Head to Dattatreya Square, the oldest part of the city, and visit the peacock-windowed shrine.' },
                    { time: 'Evening', detail: 'Settle at a rooftop café overlooking Taumadhi and sip butter tea as dusk falls.' },
                ]
            },
            {
                icon: <RestaurantIcon />,
                label: 'Food & Drink',
                items: [
                    { time: 'Must Try', detail: 'Juju Dhau — Bhaktapur\'s famous "king of yogurt." Rich, creamy, served in a clay pot. Find it near Taumadhi Square.' },
                    { time: 'Snack', detail: 'Samay Baji — a traditional Newari platter of beaten rice, buffalo meat, beans, and spiced potatoes.' },
                    { time: 'Café', detail: 'Sunny Restaurant & Bar at Taumadhi Square offers excellent views and local momos.' },
                    { time: 'Drink', detail: 'Tongba — traditional millet beer served in a wooden mug; warming and unique to the Himalayan hills.' },
                ]
            },
            {
                icon: <HotelIcon />,
                label: 'Where to Stay',
                items: [
                    { time: 'Budget', detail: 'Pagoda Guest House — right on Taumadhi Square, basic but clean, excellent location. ~NPR 1,500/night.' },
                    { time: 'Mid-range', detail: 'Bhadgaon Guest House — heritage building, rooftop terrace, authentic atmosphere. ~NPR 3,500/night.' },
                    { time: 'Splurge', detail: 'Kumari Guest House — beautifully restored Newari architecture with courtyard garden. ~NPR 7,000/night.' },
                ]
            },
        ],
        tips: [
            'Entry fee: NPR 1,500 for foreigners (valid multiple days). Keep your ticket!',
            'Visit on a weekday morning for fewer crowds — the squares empty out beautifully.',
            'Bhaktapur is just 13 km from Kathmandu; take a local bus (NPR 40) or taxi (~NPR 800).',
            'Bring cash — most vendors and small shops don\'t accept cards.',
            'Respect the active temples — remove shoes before entering and avoid photography of rituals.',
        ],
        gallery: [
            { src: 'https://images.unsplash.com/photo-1707912258699-ee8d6179dee0?q=80&w=600&auto=format&fit=crop', caption: 'Bhaktapur Durbar Square' },
            { src: 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?q=80&w=600&auto=format&fit=crop', caption: 'Nyatapola Temple' },
            { src: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?q=80&w=600&auto=format&fit=crop', caption: 'Ancient Newari Streets' },
        ],
        tags: ['Heritage', 'UNESCO', 'Walking', 'Photography', 'Culture', 'Newari Cuisine'],
    },

    kathmandu: {
        id: 'kathmandu',
        title: 'Safe Travels in Kathmandu',
        subtitle: 'Navigate the Valley Like a Local',
        heroImg: 'https://images.unsplash.com/photo-1748760036656-964ac32eefb4?q=80&w=1200&auto=format&fit=crop',
        rating: 4.6,
        duration: '2–4 Days',
        budget: 'NPR 3,000 – 8,000 / day',
        location: 'Kathmandu, Bagmati Province',
        overview: `Kathmandu is overwhelming at first — a sensory flood of diesel fumes, temple bells, honking traffic, and street-food aromas. But beneath the chaos lies one of Asia's most spiritually alive and historically rich cities. The Kathmandu Valley packs more UNESCO World Heritage Sites per square kilometer than almost anywhere on earth.\n\nThis guide focuses on navigating Kathmandu safely and smartly — from avoiding tourist traps in Thamel to understanding which routes to use during festivals. We'll help you move through the city with confidence, using community-sourced real-time data on traffic, road conditions, and local events.`,
        highlights: [
            {
                icon: <DirectionsWalkIcon />,
                label: 'Recommended Routes',
                items: [
                    { time: 'Day 1', detail: 'Thamel → Asan Bazaar → Indra Chowk → Kathmandu Durbar Square. Walk the old bazaar spine on foot (~2.5 km).' },
                    { time: 'Day 2', detail: 'Pashupatinath Temple (morning aarti at 6 AM) → Boudhanath Stupa. Take a taxi between the two (~15 min).' },
                    { time: 'Day 3', detail: 'Swayambhunath (Monkey Temple) sunrise → Garden of Dreams → evening at Patan Durbar Square.' },
                    { time: 'Day 4', detail: 'Kopan Monastery for morning meditation → Nagarkot for Himalayan panorama sunset.' },
                ]
            },
            {
                icon: <RestaurantIcon />,
                label: 'Food Guide',
                items: [
                    { time: 'Street Food', detail: 'Chatamari (Newari pizza) at Asan Market — rice flour crepe with toppings, NPR 80–150.' },
                    { time: 'Restaurant', detail: 'OR2K in Thamel — Middle Eastern–Nepali fusion, great veggie options, rooftop cushion seating.' },
                    { time: 'Coffee', detail: 'Himalayan Java or Coffee Sherpa for excellent single-origin Nepal-grown beans.' },
                    { time: 'Splurge', detail: 'Krishnarpan at Dwarika\'s Hotel — 22-course Newari thali in a heritage setting. Book ahead.' },
                ]
            },
            {
                icon: <HotelIcon />,
                label: 'Where to Stay',
                items: [
                    { time: 'Budget', detail: 'Hotel Encounter Nepal, Thamel — reliable, clean, central. ~NPR 2,000/night.' },
                    { time: 'Mid-range', detail: 'Hotel Yak & Yeti — grand colonial property near Durbar Marg. ~NPR 12,000/night.' },
                    { time: 'Boutique', detail: 'Kantipur Temple House — traditional Newari building in the old city. ~NPR 8,000/night.' },
                ]
            },
        ],
        tips: [
            'Download Maps.me offline — Google Maps can be unreliable in narrow back alleys.',
            'Negotiate taxi fares before getting in, or use inDrive / Pathao apps for fixed-rate rides.',
            'Avoid Ratna Park and New Road on major festival days — roads close, crowds surge.',
            'Power cuts (load shedding) can still happen; carry a power bank.',
            'Air quality can be poor — a light N95 mask is useful during dry season (Oct–May).',
        ],
        gallery: [
            { src: 'https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=600&auto=format&fit=crop', caption: 'Boudhanath Stupa' },
            { src: 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?q=80&w=600&auto=format&fit=crop', caption: 'Swayambhunath Monkey Temple' },
            { src: 'https://images.unsplash.com/photo-1748760036656-964ac32eefb4?q=80&w=600&auto=format&fit=crop', caption: 'Thamel Street Market' },
        ],
        tags: ['City Guide', 'Safety', 'Heritage', 'Temples', 'Food', 'Budget-Friendly'],
    },

    pokhara: {
        id: 'pokhara',
        title: 'Pokhara on a Budget',
        subtitle: 'Lakeside Magic for Under NPR 10,000',
        heroImg: 'https://images.unsplash.com/photo-1562462181-b228e3cff9ad?q=80&w=1200&auto=format&fit=crop',
        rating: 4.9,
        duration: '3 Days',
        budget: 'Under NPR 10,000 total',
        location: 'Pokhara, Gandaki Province',
        overview: `Pokhara is Nepal's adventure capital and most beloved city — a place where the Annapurna massif towers impossibly close above a glassy lake, and where paragliders drift silently across a blue sky. It's also surprisingly affordable if you know where to look.\n\nThis 3-day budget itinerary shows you how to experience everything Pokhara has to offer — from sunrise Himalayan panoramas to kayaking on Phewa Lake — while keeping your total spend under NPR 10,000. No corners cut on the experiences; just smart choices on where to eat, sleep, and how to move around.`,
        highlights: [
            {
                icon: <DirectionsWalkIcon />,
                label: '3-Day Itinerary',
                items: [
                    { time: 'Day 1 – Morning', detail: 'Wake before dawn, hike or take a taxi to Sarangkot (NPR 600 taxi or free hike 1.5 hrs). Watch Annapurna and Dhaulagiri glow pink at sunrise.' },
                    { time: 'Day 1 – Afternoon', detail: 'Rent a rowboat on Phewa Lake (NPR 400/hr) and visit the island Tal Barahi Temple. Swim if weather permits.' },
                    { time: 'Day 2', detail: 'Paragliding with one of Pokhara\'s 20+ operators — prices negotiable off-season, aim for NPR 3,500 (30 min flight from Sarangkot).' },
                    { time: 'Day 2 – Evening', detail: 'Explore the World Peace Pagoda via trail (free, 45-min hike) — best sunset views in the valley.' },
                    { time: 'Day 3', detail: 'Day hike to Dhampus or Australian Camp (free, reachable by local bus NPR 100) — entry-level Himalayan views without trekking permit.' },
                ]
            },
            {
                icon: <RestaurantIcon />,
                label: 'Eating Cheap & Well',
                items: [
                    { time: 'Breakfast', detail: 'Dal bhat at any local teahouse off Lakeside main strip: NPR 250–350. Unlimited refills.' },
                    { time: 'Lunch', detail: 'Boomerang Restaurant or Caffe Concerto for pasta/pizza around NPR 500. Happy hour deals in the afternoon.' },
                    { time: 'Dinner', detail: 'Momos at a streetside stall — a plate of 10 for NPR 120–180. Or thakali set for NPR 350–450.' },
                    { time: 'Drinks', detail: 'Everest beer at Old Blues Bar, NPR 350/bottle. The cheapest cold ones are at Baidam local shops (NPR 250).' },
                ]
            },
            {
                icon: <HotelIcon />,
                label: 'Budget Sleep',
                items: [
                    { time: 'Dorm', detail: 'Base Camp Pokhara Hostel — social, central, clean dorms from NPR 600/night. Great for solo travelers.' },
                    { time: 'Private', detail: 'Hotel Middle Path — private room with lake view from NPR 1,800/night. Excellent value.' },
                    { time: 'Guesthouse', detail: 'Butterfly Lodge — family-run, peaceful, garden setting, NPR 2,000/night. 5 min walk to lake.' },
                ]
            },
        ],
        tips: [
            'Visit October–November or March–April for clearest Himalayan views.',
            'Rent a bicycle for NPR 400/day — the best way to cover Lakeside and Pame Bazaar.',
            'Paragliding prices are highly negotiable — shop around and mention competitor prices.',
            'The local bus between Pokhara bus park and Lakeside costs NPR 30; tourist taxis charge NPR 400+.',
            'Buy trekking gear secondhand at "second-hand" shops on Lakeside — great quality at 60% off.',
        ],
        gallery: [
            { src: 'https://images.unsplash.com/photo-1562462181-b228e3cff9ad?q=80&w=600&auto=format&fit=crop', caption: 'Phewa Lake Reflection' },
            { src: 'https://images.unsplash.com/photo-1601297183305-6df142704ea2?q=80&w=600&auto=format&fit=crop', caption: 'Paragliding from Sarangkot' },
            { src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=600&auto=format&fit=crop', caption: 'Annapurna Range Sunrise' },
        ],
        tags: ['Budget', 'Adventure', 'Lakeside', 'Paragliding', 'Trekking', 'Scenic'],
    },
};

// --- DETAIL PAGE ---
const PlaceDetail = () => {
    const { placeId } = useParams();
    const navigate = useNavigate();
    const [isDark, setIsDark] = useState(true);
    const [activeTab, setActiveTab] = useState(0);

    const COLORS = isDark ? DARK_COLORS : LIGHT_COLORS;
    const place = PLACES[placeId];

    if (!place) {
        return (
            <Box sx={{ bgcolor: COLORS.background, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ color: COLORS.headings, mb: 2 }}>Place not found</Typography>
                    <Button onClick={() => navigate('/')} sx={{ color: COLORS.brand }}>← Back to Home</Button>
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{
            bgcolor: COLORS.background,
            minHeight: '100vh',
            fontFamily: '"Exo 2", "Segoe UI", sans-serif',
            transition: 'background-color 0.35s ease',
        }}>

            {/* ===== HERO ===== */}
            <Box sx={{ position: 'relative', height: { xs: 320, md: 500 }, overflow: 'hidden' }}>
                <Box
                    component="img"
                    src={place.heroImg}
                    alt={place.title}
                    sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                {/* Overlay */}
                <Box sx={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.65) 100%)',
                }} />

                {/* Top Bar */}
                <Box sx={{
                    position: 'absolute', top: 0, left: 0, right: 0,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    px: { xs: 2, md: 5 }, py: 2.5
                }}>
                    <IconButton onClick={() => navigate(-1)} sx={{
                        color: 'white', bgcolor: 'rgba(255,255,255,0.15)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }
                    }}>
                        <ArrowBackIcon />
                    </IconButton>

                    <Tooltip title={isDark ? 'Light Mode' : 'Dark Mode'}>
                        <IconButton onClick={() => setIsDark(p => !p)} sx={{
                            color: 'white', bgcolor: 'rgba(255,255,255,0.15)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }
                        }}>
                            {isDark ? <LightModeIcon sx={{ fontSize: 18 }} /> : <DarkModeIcon sx={{ fontSize: 18 }} />}
                        </IconButton>
                    </Tooltip>
                </Box>

                {/* Hero Text */}
                <Box sx={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    px: { xs: 3, md: 6 }, pb: 4
                }}>
                    <Typography variant="caption" sx={{
                        color: COLORS.brand, fontWeight: 700, letterSpacing: 3,
                        textTransform: 'uppercase', fontSize: '0.75rem', mb: 1, display: 'block'
                    }}>
                        {place.location}
                    </Typography>
                    <Typography variant="h3" fontWeight={800} sx={{
                        color: 'white', fontFamily: '"Exo 2", sans-serif',
                        fontSize: { xs: '1.8rem', md: '2.6rem' }, lineHeight: 1.2, mb: 0.5
                    }}>
                        {place.title}
                    </Typography>
                    <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 400 }}>
                        {place.subtitle}
                    </Typography>
                </Box>
            </Box>

            {/* ===== META STRIP ===== */}
            <Box sx={{
                bgcolor: COLORS.cardSecondary,
                borderBottom: `1px solid ${COLORS.borderColor}`,
                px: { xs: 3, md: 6 }, py: 2,
                display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center'
            }}>
                <Stack direction="row" spacing={0.8} alignItems="center">
                    <StarIcon sx={{ color: '#FFD700', fontSize: 18 }} />
                    <Typography fontWeight={700} sx={{ color: isDark ? 'white' : COLORS.headings }}>{place.rating}</Typography>
                    <Typography sx={{ color: COLORS.fadedText, fontSize: '0.85rem' }}>rating</Typography>
                </Stack>
                <Stack direction="row" spacing={0.8} alignItems="center">
                    <AccessTimeIcon sx={{ color: COLORS.brand, fontSize: 18 }} />
                    <Typography sx={{ color: COLORS.fadedText, fontSize: '0.9rem' }}>{place.duration}</Typography>
                </Stack>
                <Stack direction="row" spacing={0.8} alignItems="center">
                    <AttachMoneyIcon sx={{ color: COLORS.brand, fontSize: 18 }} />
                    <Typography sx={{ color: COLORS.fadedText, fontSize: '0.9rem' }}>{place.budget}</Typography>
                </Stack>
                <Stack direction="row" spacing={0.8} alignItems="center">
                    <LocationOnIcon sx={{ color: COLORS.brand, fontSize: 18 }} />
                    <Typography sx={{ color: COLORS.fadedText, fontSize: '0.9rem' }}>{place.location}</Typography>
                </Stack>

                <Box sx={{ ml: 'auto' }}>
                    <Button
                        variant="contained"
                        onClick={() => navigate('/register')}
                        sx={{
                            bgcolor: COLORS.brand,
                            color: isDark ? '#141627' : '#FFFFFF',
                            fontWeight: 700, borderRadius: 5,
                            px: 3, textTransform: 'none',
                            '&:hover': { bgcolor: isDark ? '#2db8b8' : '#179898' }
                        }}
                    >
                        Plan This Trip
                    </Button>
                </Box>
            </Box>

            {/* ===== MAIN CONTENT ===== */}
            <Box sx={{ px: { xs: 3, md: 6 }, py: 5, maxWidth: 1200, mx: 'auto' }}>

                {/* Tags */}
                <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 4 }}>
                    {place.tags.map(tag => (
                        <Chip key={tag} label={tag} size="small" sx={{
                            bgcolor: isDark ? 'rgba(51,204,204,0.12)' : 'rgba(26,175,175,0.1)',
                            color: COLORS.brand,
                            border: `1px solid ${COLORS.borderColor}`,
                            fontWeight: 600, fontSize: '0.75rem'
                        }} />
                    ))}
                </Stack>

                {/* Overview */}
                <Box sx={{ mb: 6 }}>
                    <Typography variant="h5" fontWeight={800} sx={{
                        color: isDark ? 'white' : COLORS.headings,
                        fontFamily: '"Exo 2", sans-serif', mb: 2
                    }}>
                        About This Destination
                    </Typography>
                    {place.overview.split('\n\n').map((para, i) => (
                        <Typography key={i} variant="body1" sx={{
                            color: COLORS.fadedText, lineHeight: 1.9, mb: 2, fontSize: '1rem'
                        }}>
                            {para}
                        </Typography>
                    ))}
                </Box>

                {/* Tabs: Itinerary / Food / Stay */}
                <Box sx={{ mb: 5 }}>
                    <Typography variant="h5" fontWeight={800} sx={{
                        color: isDark ? 'white' : COLORS.headings,
                        fontFamily: '"Exo 2", sans-serif', mb: 3
                    }}>
                        What to Do & Where to Go
                    </Typography>

                    {/* Tab Buttons */}
                    <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
                        {place.highlights.map((h, i) => (
                            <Button key={i} onClick={() => setActiveTab(i)} sx={{
                                borderRadius: 5,
                                px: 3, py: 1,
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                bgcolor: activeTab === i ? COLORS.brand : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(26,175,175,0.08)'),
                                color: activeTab === i ? (isDark ? '#141627' : '#FFFFFF') : COLORS.fadedText,
                                border: `1px solid ${activeTab === i ? COLORS.brand : COLORS.borderColor}`,
                                '&:hover': { bgcolor: activeTab === i ? COLORS.brand : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(26,175,175,0.15)') }
                            }}>
                                {h.label}
                            </Button>
                        ))}
                    </Stack>

                    {/* Active Tab Content */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {place.highlights[activeTab].items.map((item, i) => (
                            <Box key={i} sx={{
                                bgcolor: COLORS.cardSecondary,
                                border: `1px solid ${COLORS.cardBorder}`,
                                borderRadius: 3,
                                p: 2.5,
                                display: 'flex',
                                gap: 2.5,
                                alignItems: 'flex-start',
                                transition: 'all 0.25s',
                                '&:hover': {
                                    borderColor: COLORS.cardBorderHover,
                                    transform: 'translateX(4px)',
                                    boxShadow: isDark ? '0 4px 20px rgba(51,204,204,0.08)' : '0 4px 20px rgba(26,175,175,0.1)'
                                }
                            }}>
                                <Box sx={{
                                    minWidth: 90,
                                    bgcolor: isDark ? 'rgba(51,204,204,0.1)' : 'rgba(26,175,175,0.1)',
                                    border: `1px solid ${COLORS.borderColor}`,
                                    borderRadius: 2,
                                    px: 1.5, py: 0.5,
                                    textAlign: 'center'
                                }}>
                                    <Typography variant="caption" fontWeight={700} sx={{ color: COLORS.brand, fontSize: '0.75rem' }}>
                                        {item.time}
                                    </Typography>
                                </Box>
                                <Typography variant="body2" sx={{ color: COLORS.text, lineHeight: 1.8, flex: 1 }}>
                                    {item.detail}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>

                {/* Gallery */}
                <Box sx={{ mb: 6 }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2.5 }}>
                        <CameraAltIcon sx={{ color: COLORS.brand }} />
                        <Typography variant="h5" fontWeight={800} sx={{
                            color: isDark ? 'white' : COLORS.headings,
                            fontFamily: '"Exo 2", sans-serif'
                        }}>
                            Photo Gallery
                        </Typography>
                    </Stack>
                    <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)', md: 'repeat(3, 1fr)' },
                        gap: 2
                    }}>
                        {place.gallery.map((item, i) => (
                            <Box key={i} sx={{
                                borderRadius: 3,
                                overflow: 'hidden',
                                aspectRatio: '3/2',
                                cursor: 'pointer',
                                position: 'relative',
                                transition: 'transform 0.3s',
                                '&:hover': { transform: 'scale(1.03)' },
                                '&:hover .caption-overlay': { opacity: 1 },
                                '&:hover img': { filter: 'brightness(0.75)' },
                            }}>
                                <Box
                                    component="img"
                                    src={typeof item === 'string' ? item : item.src}
                                    alt={typeof item === 'string' ? `Photo ${i + 1}` : item.caption}
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=600&auto=format&fit=crop';
                                    }}
                                    sx={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'filter 0.3s' }}
                                />
                                {typeof item !== 'string' && (
                                    <Box className="caption-overlay" sx={{
                                        position: 'absolute', bottom: 0, left: 0, right: 0,
                                        bgcolor: 'rgba(0,0,0,0.55)',
                                        backdropFilter: 'blur(4px)',
                                        px: 1.5, py: 1,
                                        opacity: 0,
                                        transition: 'opacity 0.3s ease',
                                    }}>
                                        <Typography variant="caption" sx={{
                                            color: 'white', fontWeight: 600,
                                            fontSize: '0.72rem', letterSpacing: 0.3
                                        }}>
                                            {item.caption}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        ))}
                    </Box>
                </Box>

                {/* Tips */}
                <Box sx={{ mb: 6 }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2.5 }}>
                        <TipsAndUpdatesIcon sx={{ color: COLORS.brand }} />
                        <Typography variant="h5" fontWeight={800} sx={{
                            color: isDark ? 'white' : COLORS.headings,
                            fontFamily: '"Exo 2", sans-serif'
                        }}>
                            Insider Tips
                        </Typography>
                    </Stack>
                    <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                        gap: 2
                    }}>
                        {place.tips.map((tip, i) => (
                            <Box key={i} sx={{
                                bgcolor: COLORS.cardSecondary,
                                border: `1px solid ${COLORS.cardBorder}`,
                                borderRadius: 3,
                                p: 2.5,
                                display: 'flex', gap: 2, alignItems: 'flex-start',
                                transition: 'all 0.25s',
                                '&:hover': { borderColor: COLORS.cardBorderHover }
                            }}>
                                <Box sx={{
                                    minWidth: 28, height: 28,
                                    borderRadius: '50%',
                                    bgcolor: COLORS.brand,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0, mt: 0.2
                                }}>
                                    <Typography variant="caption" fontWeight={800} sx={{ color: isDark ? '#141627' : '#FFFFFF', fontSize: '0.75rem' }}>
                                        {i + 1}
                                    </Typography>
                                </Box>
                                <Typography variant="body2" sx={{ color: COLORS.fadedText, lineHeight: 1.8 }}>
                                    {tip}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>

                {/* CTA */}
                <Box sx={{
                    textAlign: 'center',
                    bgcolor: COLORS.cardSecondary,
                    borderRadius: 5, p: { xs: 4, md: 6 },
                    border: `1px solid ${COLORS.borderColor}`,
                    background: isDark
                        ? `linear-gradient(135deg, ${COLORS.cardSecondary}, rgba(51,204,204,0.05))`
                        : `linear-gradient(135deg, #FFFFFF, rgba(26,175,175,0.05))`,
                }}>
                    <Typography variant="h5" fontWeight={800} sx={{
                        color: isDark ? 'white' : COLORS.headings,
                        fontFamily: '"Exo 2", sans-serif', mb: 1.5
                    }}>
                        Ready to visit <Box component="span" sx={{ color: COLORS.brand }}>{place.title.split(' ').slice(-1)[0]}?</Box>
                    </Typography>
                    <Typography variant="body1" sx={{ color: COLORS.fadedText, mb: 3, maxWidth: 440, mx: 'auto' }}>
                        Build your full itinerary, track your budget, and get live community updates for this trip.
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                        <Button
                            variant="contained"
                            onClick={() => navigate('/register')}
                            sx={{
                                bgcolor: COLORS.brand,
                                color: isDark ? '#141627' : '#FFFFFF',
                                fontWeight: 700, px: 4, py: 1.5,
                                borderRadius: 5, fontSize: '1rem',
                                textTransform: 'none',
                                '&:hover': { bgcolor: isDark ? '#2db8b8' : '#179898', boxShadow: '0 6px 20px rgba(51,204,204,0.4)' }
                            }}
                        >
                            Plan This Trip Free
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={() => navigate(-1)}
                            sx={{
                                color: isDark ? 'white' : COLORS.headings,
                                borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(26,175,175,0.4)',
                                borderRadius: 5, px: 4, py: 1.5,
                                fontSize: '1rem', textTransform: 'none',
                                '&:hover': { borderColor: COLORS.brand, color: COLORS.brand, bgcolor: 'transparent' }
                            }}
                        >
                            ← Back to Plans
                        </Button>
                    </Stack>
                </Box>
            </Box>

            {/* Footer */}
            <Box sx={{
                borderTop: `1px solid ${COLORS.borderColor}`,
                py: 3, px: { xs: 3, md: 6 }, textAlign: 'center',
                bgcolor: COLORS.cardSecondary
            }}>
                <Typography variant="body2" sx={{ color: COLORS.fadedText }}>
                    © 2026 Smart Itinerary Planner. All rights reserved.
                </Typography>
            </Box>
        </Box>
    );
};

export default PlaceDetail;