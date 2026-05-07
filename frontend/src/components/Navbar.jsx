import React, { useState, useEffect } from 'react';
import {
    Box, Drawer, List, ListItem, ListItemButton, ListItemIcon,
    ListItemText, Button, Avatar, Typography, Stack, Divider,
    Badge, Popover, IconButton, Tooltip
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

import DashboardIcon   from '@mui/icons-material/Dashboard';
import ExploreIcon     from '@mui/icons-material/Explore';
import MapIcon         from '@mui/icons-material/Map';
import GroupIcon       from '@mui/icons-material/Group';
import PeopleIcon      from '@mui/icons-material/People';
import PersonIcon      from '@mui/icons-material/Person';
import LogoutIcon      from '@mui/icons-material/Logout';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PersonAddIcon   from '@mui/icons-material/PersonAdd';
import ShareIcon       from '@mui/icons-material/Share';
import HandshakeIcon   from '@mui/icons-material/Handshake';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ThumbUpOutlinedIcon   from '@mui/icons-material/ThumbUpOutlined';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LightModeIcon   from '@mui/icons-material/LightMode';
import DarkModeIcon    from '@mui/icons-material/DarkMode';
import axios from 'axios';
import FriendsPopup from './FriendsPopup';

const DRAWER_WIDTH = 240;

const AVATAR_LIST = [
    { id: 1,  style: 'notionists', seed: 'explorer'  },
    { id: 2,  style: 'notionists', seed: 'summit'    },
    { id: 3,  style: 'notionists', seed: 'atlas'     },
    { id: 4,  style: 'notionists', seed: 'voyage'    },
    { id: 5,  style: 'notionists', seed: 'horizon'   },
    { id: 6,  style: 'notionists', seed: 'trailhead' },
    { id: 7,  style: 'notionists', seed: 'meridian'  },
    { id: 8,  style: 'notionists', seed: 'solstice'  },
    { id: 9,  style: 'micah',      seed: 'peak'      },
    { id: 10, style: 'micah',      seed: 'nomad'     },
    { id: 11, style: 'micah',      seed: 'delta'     },
    { id: 12, style: 'micah',      seed: 'canyon'    },
    { id: 13, style: 'micah',      seed: 'sierra'    },
    { id: 14, style: 'micah',      seed: 'fjord'     },
    { id: 15, style: 'micah',      seed: 'savanna'   },
    { id: 16, style: 'micah',      seed: 'tundra'    },
    { id: 17, style: 'lorelei',    seed: 'celeste'   },
    { id: 18, style: 'lorelei',    seed: 'aurora'    },
    { id: 19, style: 'lorelei',    seed: 'marina'    },
    { id: 20, style: 'lorelei',    seed: 'sahara'    },
    { id: 21, style: 'lorelei',    seed: 'soleil'    },
    { id: 22, style: 'lorelei',    seed: 'zephyr'    },
    { id: 23, style: 'personas',   seed: 'trek'      },
    { id: 24, style: 'personas',   seed: 'ridge'     },
    { id: 25, style: 'personas',   seed: 'orion'     },
    { id: 26, style: 'personas',   seed: 'cairo'     },
    { id: 27, style: 'personas',   seed: 'rio'       },
    { id: 28, style: 'personas',   seed: 'jade'      },
    { id: 29, style: 'personas',   seed: 'venice'    },
    { id: 30, style: 'personas',   seed: 'kyoto'     },
];

const getAvatarUrl = (id) => {
    const av = AVATAR_LIST.find(a => a.id === id) || AVATAR_LIST[0];
    return `https://api.dicebear.com/7.x/${av.style}/svg?seed=${av.seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
};

const NAV_ITEMS = [
    { text: 'Dashboard',       icon: <DashboardIcon />, path: '/dashboard'   },
    { text: 'My Itineraries',  icon: <ExploreIcon />,   path: '/itineraries' },
    { text: 'Interactive Map', icon: <MapIcon />,        path: '/map'         },
    { text: 'Community Feed',  icon: <GroupIcon />,      path: '/community'   },
    { text: 'Friends',         icon: <PeopleIcon />,     path: '/friends'     },
    { text: 'Profile',         icon: <PersonIcon />,     path: '/profile'     },
];

const NOTIF_ICON = {
    friend_request:   <PersonAddIcon          sx={{ fontSize: 18 }} />,
    friend_accepted:  <CheckCircleOutlineIcon sx={{ fontSize: 18 }} />,
    itinerary_shared: <ShareIcon              sx={{ fontSize: 18 }} />,
    collab_invite:    <HandshakeIcon          sx={{ fontSize: 18 }} />,
    comment:          <ChatBubbleOutlineIcon  sx={{ fontSize: 18 }} />,
    upvote:           <ThumbUpOutlinedIcon    sx={{ fontSize: 18 }} />,
    message:          <ChatBubbleOutlineIcon  sx={{ fontSize: 18, color: '#42A5F5' }} />,
};

const Navbar = () => {
    const { COLORS, isDark, toggleTheme } = useTheme();
    const navigate  = useNavigate();
    const location  = useLocation();

    const userId   = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole') || 'user';
    const avatarId = parseInt(localStorage.getItem('avatarId')) || 1;
    const userName = localStorage.getItem('userName') || 'User';
    const subTier  = localStorage.getItem('subscriptionTier') || 'free';
    const isAdmin  = userRole === 'admin';

    // Items the admin shouldn't see — admins don't subscribe.
    const visibleNavItems = isAdmin
        ? NAV_ITEMS.filter(i => i.path !== '/subscription')
        : NAV_ITEMS;

    // notifications
    const [notifications, setNotifications]   = useState([]);
    const [unreadCount, setUnreadCount]       = useState(0);
    const [notifAnchor, setNotifAnchor]       = useState(null);
    const notifOpen = Boolean(notifAnchor);

    // pending friend requests count for Friends badge
    const [pendingFriends, setPendingFriends]   = useState(0);
    const [friendsOpen, setFriendsOpen]         = useState(false);
    const [friendsInitialTab, setFriendsInitialTab] = useState('friends');

    useEffect(() => {
        if (!userId) return;
        const fetchPending = () => {
            axios.get(`${import.meta.env.VITE_BACKEND_API_URL}friends/${userId}/pending`)
                .then(r => setPendingFriends((r.data || []).length))
                .catch(() => {});
        };
        fetchPending();
        const interval = setInterval(fetchPending, 60000);
        return () => clearInterval(interval);
    }, [userId]);

    const fetchNotifications = () => {
        if (!userId) return;
        axios.get(`${import.meta.env.VITE_BACKEND_API_URL}notifications/${userId}`)
            .then(r => {
                setNotifications(r.data);
                setUnreadCount(r.data.filter(n => !n.is_read).length);
            })
            .catch(() => {});
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [userId]);

    const handleNotifOpen  = (e) => setNotifAnchor(e.currentTarget);
    const handleNotifClose = () => setNotifAnchor(null);

    const handleMarkAllRead = () => {
        if (!userId) return;
        axios.patch(`${import.meta.env.VITE_BACKEND_API_URL}notifications/${userId}/read-all`)
            .then(() => fetchNotifications())
            .catch(() => {});
    };

    const handleNotifAction = async (notif) => {
        axios.patch(`${import.meta.env.VITE_BACKEND_API_URL}notifications/${notif.id}/read`).catch(() => {});
        handleNotifClose();
        fetchNotifications();

        switch (notif.type) {
            case 'friend_request':
            case 'collab_invite':
                // Land directly on the Requests tab so the user sees the invite
                setFriendsInitialTab('requests');
                setFriendsOpen(true);
                break;
            case 'friend_accepted':
                setFriendsInitialTab('friends');
                setFriendsOpen(true);
                break;

            case 'itinerary_shared':
                navigate('/itineraries');
                break;

            case 'comment':
            case 'upvote':
                navigate('/community', { state: { highlightPostId: notif.post_id } });
                break;

            case 'message':
                if (notif.from_user_id) {
                    try {
                        const res = await axios.get(`${import.meta.env.VITE_BACKEND_API_URL}users/${notif.from_user_id}/public`);
                        window.dispatchEvent(new CustomEvent('open-chat', {
                            detail: { friendId: notif.from_user_id, username: res.data.username, avatarId: res.data.avatar_id }
                        }));
                    } catch { /* silent */ }
                }
                break;

            default:
                break;
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    const isActive = (path) => {
        if (path === '/itineraries') {
            // Active on both /itineraries and any /itinerary/:id detail page
            return location.pathname === path || location.pathname.startsWith('/itinerary/');
        }
        return location.pathname === path;
    };

    const drawerBg   = COLORS.background;
    const activeBg   = COLORS.brand;
    const activeText = COLORS.background;
    const inactiveText = COLORS.subheadings;

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: DRAWER_WIDTH,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: DRAWER_WIDTH,
                    boxSizing: 'border-box',
                    bgcolor: drawerBg,
                    borderRight: 'none',
                    backgroundImage: 'linear-gradient(to bottom, rgba(51,204,204,0.05), transparent)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                },
            }}
        >
            {/* Logo */}
            <Box sx={{ p: 3, pb: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Box component="span" sx={{ color: COLORS.brand, fontSize: '1.4rem' }}>✈</Box>
                    <Typography variant="h6" fontWeight="bold" sx={{
                        color: COLORS.headings,
                        fontFamily: '"Exo 2", sans-serif',
                        letterSpacing: 0.5,
                        lineHeight: 1
                    }}>
                        Smart <Box component="span" sx={{ color: COLORS.brand }}>Itinerary</Box>
                    </Typography>
                </Stack>
            </Box>

            <Divider sx={{ borderColor: COLORS.cardBorder, mx: 2 }} />

            {/* Nav Items */}
            <List sx={{ px: 2, mt: 1, flexGrow: 1 }}>
                {visibleNavItems.map((item) => {
                    const active = isActive(item.path);
                    const isFriends = item.path === '/friends';
                    return (
                        <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                            <ListItemButton
                                onClick={() => { if (isFriends) { setFriendsInitialTab('friends'); setFriendsOpen(true); } else { navigate(item.path); } }}
                                selected={!isFriends && active}
                                sx={{
                                    borderRadius: 2,
                                    color: active ? activeText : inactiveText,
                                    '&.Mui-selected': {
                                        bgcolor: activeBg,
                                        color: activeText,
                                        '&:hover': { bgcolor: '#2db8b8' },
                                    },
                                    '&:hover': { bgcolor: COLORS.cardSecondary },
                                    transition: 'all 0.2s',
                                }}
                            >
                                <ListItemIcon sx={{
                                    color: active ? activeText : inactiveText,
                                    minWidth: 40,
                                }}>
                                    {item.path === '/friends' && pendingFriends > 0 ? (
                                        <Badge badgeContent={pendingFriends} color="error" max={9} sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', height: 16, minWidth: 16 } }}>
                                            {item.icon}
                                        </Badge>
                                    ) : item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.text}
                                    primaryTypographyProps={{
                                        fontWeight: active ? 700 : 500,
                                        fontSize: '0.875rem',
                                        fontFamily: '"Exo 2", sans-serif',
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                    );
                })}

                {/* Admin link — only visible to admins */}
                {isAdmin && (
                    <ListItem disablePadding sx={{ mb: 0.5 }}>
                        <ListItemButton
                            onClick={() => navigate('/admin')}
                            selected={isActive('/admin')}
                            sx={{
                                borderRadius: 2,
                                color: isActive('/admin') ? activeText : '#FF7043',
                                '&.Mui-selected': {
                                    bgcolor: '#FF7043',
                                    color: '#fff',
                                    '&:hover': { bgcolor: '#e8673b' },
                                },
                                '&:hover': { bgcolor: COLORS.cardSecondary },
                            }}
                        >
                            <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                                <AdminPanelSettingsIcon />
                            </ListItemIcon>
                            <ListItemText
                                primary="Admin"
                                primaryTypographyProps={{ fontWeight: 600, fontSize: '0.875rem', fontFamily: '"Exo 2", sans-serif' }}
                            />
                        </ListItemButton>
                    </ListItem>
                )}
            </List>

            <Divider sx={{ borderColor: COLORS.cardBorder, mx: 2 }} />

            {/* Bottom section: user info + actions */}
            <Box sx={{ p: 2, pt: 1.5 }}>

                {/* User row */}
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
                    <Avatar
                        src={getAvatarUrl(avatarId)}
                        onClick={() => navigate('/profile')}
                        sx={{
                            width: 38, height: 38,
                            cursor: 'pointer',
                            border: `2px solid ${COLORS.brand}40`,
                            '&:hover': { borderColor: COLORS.brand, transform: 'scale(1.05)' },
                            transition: 'all 0.2s',
                        }}
                    />
                    <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{
                            color: COLORS.headings, fontWeight: 700,
                            fontSize: '0.85rem', fontFamily: '"Exo 2", sans-serif',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                            {userName}
                        </Typography>
                        <Typography sx={{ color: COLORS.fadedText, fontSize: '0.72rem' }}>
                            {userRole === 'admin' ? 'Administrator' : 'Explorer'}
                        </Typography>
                    </Box>

                    {/* Notification bell */}
                    <Tooltip title="Notifications">
                        <IconButton
                            size="small"
                            onClick={handleNotifOpen}
                            sx={{
                                ml: 'auto',
                                color: COLORS.icons,
                                bgcolor: COLORS.cardSecondary,
                                borderRadius: 2,
                                '&:hover': { bgcolor: COLORS.cardPrimary },
                            }}
                        >
                            <Badge badgeContent={unreadCount || null} color="error" max={9}>
                                <NotificationsIcon sx={{ fontSize: 20 }} />
                            </Badge>
                        </IconButton>
                    </Tooltip>
                </Stack>

                {/* Theme toggle + Logout */}
                <Stack direction="row" spacing={1}>
                    <Tooltip title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
                        <IconButton
                            onClick={toggleTheme}
                            size="small"
                            sx={{
                                color: COLORS.fadedText,
                                bgcolor: COLORS.cardSecondary,
                                borderRadius: 2,
                                flex: '0 0 auto',
                                '&:hover': { color: COLORS.brand, bgcolor: COLORS.cardPrimary },
                                transition: 'all 0.2s',
                            }}
                        >
                            {isDark ? <LightModeIcon sx={{ fontSize: 18 }} /> : <DarkModeIcon sx={{ fontSize: 18 }} />}
                        </IconButton>
                    </Tooltip>

                    <Button
                        fullWidth
                        startIcon={<LogoutIcon sx={{ fontSize: 18 }} />}
                        onClick={handleLogout}
                        size="small"
                        sx={{
                            color: COLORS.fadedText,
                            bgcolor: COLORS.cardSecondary,
                            borderRadius: 2,
                            justifyContent: 'flex-start',
                            pl: 1.5,
                            fontSize: '0.8rem',
                            fontFamily: '"Exo 2", sans-serif',
                            textTransform: 'none',
                            '&:hover': { color: '#ff6b6b', bgcolor: 'rgba(255,107,107,0.1)' },
                            transition: 'all 0.2s',
                        }}
                    >
                        Logout
                    </Button>
                </Stack>
            </Box>

            {/* Friends Popup Drawer */}
            <FriendsPopup open={friendsOpen} onClose={() => setFriendsOpen(false)} initialTab={friendsInitialTab} />

            {/* Notifications Popover */}
            <Popover
                open={notifOpen}
                anchorEl={notifAnchor}
                onClose={handleNotifClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                PaperProps={{
                    sx: {
                        bgcolor: COLORS.cardPrimary,
                        borderRadius: 3,
                        boxShadow: `0 8px 32px rgba(0,0,0,0.4)`,
                        border: `1px solid ${COLORS.cardBorder}`,
                        width: 320,
                        maxHeight: 420,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                    },
                }}
            >
                {/* Header */}
                <Stack direction="row" justifyContent="space-between" alignItems="center"
                    sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${COLORS.cardBorder}` }}>
                    <Typography sx={{ color: COLORS.headings, fontWeight: 700, fontSize: '0.95rem', fontFamily: '"Exo 2", sans-serif' }}>
                        Notifications
                    </Typography>
                    {unreadCount > 0 && (
                        <Button size="small" onClick={handleMarkAllRead} sx={{
                            color: COLORS.brand, textTransform: 'none', fontSize: '0.75rem', p: 0,
                            '&:hover': { bgcolor: 'transparent', opacity: 0.75 }
                        }}>
                            Mark all read
                        </Button>
                    )}
                </Stack>

                {/* List */}
                <Box sx={{ overflowY: 'auto', flex: 1 }}>
                    {notifications.length === 0 ? (
                        <Box sx={{ py: 4, textAlign: 'center' }}>
                            <Typography sx={{ color: COLORS.fadedText, fontSize: '0.85rem' }}>
                                No notifications yet
                            </Typography>
                        </Box>
                    ) : (
                        notifications.map((n) => (
                            <Box
                                key={n.id}
                                onClick={() => handleNotifAction(n)}
                                sx={{
                                    px: 2, py: 1.5,
                                    cursor: 'pointer',
                                    bgcolor: n.is_read ? 'transparent' : `${COLORS.brand}0D`,
                                    borderBottom: `1px solid ${COLORS.cardBorder}`,
                                    '&:hover': { bgcolor: COLORS.cardSecondary },
                                    transition: 'background 0.15s',
                                }}
                            >
                                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                                    <Box sx={{
                                        color: COLORS.brand, mt: 0.25, flexShrink: 0,
                                        opacity: n.is_read ? 0.5 : 1,
                                    }}>
                                        {NOTIF_ICON[n.type] || <NotificationsIcon sx={{ fontSize: 18 }} />}
                                    </Box>
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography sx={{
                                            color: n.is_read ? COLORS.fadedText : COLORS.text,
                                            fontSize: '0.82rem', lineHeight: 1.4,
                                        }}>
                                            {n.message}
                                        </Typography>
                                        <Typography sx={{ color: COLORS.fadedText, fontSize: '0.72rem', mt: 0.25 }}>
                                            {new Date(n.created_at).toLocaleDateString('en-US', {
                                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </Typography>
                                    </Box>
                                    {!n.is_read && (
                                        <Box sx={{
                                            width: 7, height: 7, borderRadius: '50%',
                                            bgcolor: COLORS.brand, flexShrink: 0, mt: 0.75, ml: 'auto'
                                        }} />
                                    )}
                                </Stack>
                            </Box>
                        ))
                    )}
                </Box>
            </Popover>
        </Drawer>
    );
};

export { DRAWER_WIDTH };
export default Navbar;