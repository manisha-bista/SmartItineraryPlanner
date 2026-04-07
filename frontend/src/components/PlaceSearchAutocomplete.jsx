import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    TextField,
    Paper,
    Typography,
    CircularProgress,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Chip,
    Divider,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import StarIcon from '@mui/icons-material/Star';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';

const NEPAL_CITIES = [
    'Kathmandu','Pokhara','Bhaktapur','Lalitpur','Patan',
    'Chitwan','Lumbini','Mustang','Nagarkot','Boudha','Thamel',
    'Namche','Lukla','Gorkha','Janakpur','Annapurna','Everest',
    'Manang','Jomsom','Bardiya','Langtang','Dolpa','Bandipur',
    'Dhulikhel','Kirtipur','Tansen',
];

// City synthetic place object — used when the query matches a known city directly
const makeCityOption = (cityName) => ({
    id: `city-${cityName}`,
    google_place_id: null,
    name: cityName,
    address: `${cityName}, Nepal`,
    latitude: null,
    longitude: null,
    city: cityName,
    place_types: ['locality'],
    rating: null,
    _isCity: true,
});

export default function PlaceSearchAutocomplete({
    label = "Search place",
    city,
    destinationContext,
    onSelect,
    value,
    onChange,
    inputSx = {},
}) {
    const { COLORS } = useTheme();
    const [query, setQuery] = useState(value || '');
    const [results, setResults] = useState([]);
    const [cityMatches, setCityMatches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const debounceRef = useRef(null);
    const wrapperRef = useRef(null);

    // sync external value
    useEffect(() => {
        if (value !== undefined) setQuery(value);
    }, [value]);

    // close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleType = (e) => {
        const val = e.target.value;
        setQuery(val);
        onChange?.(val);
        clearTimeout(debounceRef.current);

        if (val.length < 2) {
            setResults([]);
            setCityMatches([]);
            setOpen(false);
            return;
        }

        // Immediately check if the query matches any known city
        const lower = val.toLowerCase().trim();
        const matched = NEPAL_CITIES.filter(c =>
            c.toLowerCase().startsWith(lower) || c.toLowerCase().includes(lower)
        );
        setCityMatches(matched.slice(0, 2));
        if (matched.length > 0) setOpen(true);

        if (val.length >= 3) {
            debounceRef.current = setTimeout(() => fetchPlaces(val), 500);
        }
    };

    const fetchPlaces = async (q) => {
        setLoading(true);
        try {
            const params = { query: q };
            if (city) {
                params.city = city;
            } else if (destinationContext) {
                const lower = destinationContext.toLowerCase();
                const matched = NEPAL_CITIES.find(c => lower.includes(c.toLowerCase()));
                if (matched) params.city = matched;
            }
            const res = await axios.get('http://127.0.0.1:8000/places/search', { params });
            setResults(res.data.results || []);
            setOpen(true);
        } catch (err) {
            console.error('Place search error', err);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (place) => {
        setQuery(place.name);
        onChange?.(place.name);
        onSelect?.(place);
        setOpen(false);
        setResults([]);
        setCityMatches([]);
    };

    const hasResults = cityMatches.length > 0 || results.length > 0;

    return (
        <Box ref={wrapperRef} sx={{ position: 'relative', width: '100%' }}>
            <TextField
                fullWidth
                label={label}
                value={query}
                onChange={handleType}
                onFocus={() => hasResults && setOpen(true)}
                InputProps={{
                    endAdornment: loading
                        ? <CircularProgress size={16} sx={{ color: COLORS.brand }} />
                        : null,
                    sx: { color: COLORS.text },
                }}
                InputLabelProps={{ sx: { color: COLORS.fadedText } }}
                sx={{
                    '& .MuiOutlinedInput-root': {
                        bgcolor: 'rgba(255,255,255,0.08)',
                        borderRadius: 3,
                        '& fieldset': { borderColor: 'transparent' },
                        '&:hover fieldset': { borderColor: COLORS.brand },
                        '&.Mui-focused fieldset': { borderColor: COLORS.brand },
                    },
                    ...inputSx,
                }}
            />

            {open && hasResults && (
                <Paper
                    elevation={8}
                    sx={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 1400,
                        bgcolor: COLORS.cardPrimary,
                        border: `1px solid ${COLORS.cardBorder}`,
                        borderRadius: 2,
                        mt: 0.5,
                        maxHeight: 300,
                        overflowY: 'auto',
                        '&::-webkit-scrollbar': { width: 4 },
                        '&::-webkit-scrollbar-thumb': { bgcolor: COLORS.cardBorder, borderRadius: 4 },
                    }}
                >
                    <List dense disablePadding>
                        {/* City options first */}
                        {cityMatches.map((cityName) => (
                            <ListItem
                                key={`city-${cityName}`}
                                button
                                onClick={() => handleSelect(makeCityOption(cityName))}
                                sx={{
                                    py: 1,
                                    px: 2,
                                    borderBottom: `1px solid ${COLORS.cardBorder}`,
                                    '&:hover': { bgcolor: `${COLORS.brand}12` },
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 30 }}>
                                    <LocationCityIcon sx={{ color: COLORS.brand, fontSize: 17 }} />
                                </ListItemIcon>
                                <ListItemText
                                    primary={
                                        <Typography sx={{ color: COLORS.headings, fontSize: '0.88rem', fontWeight: 600 }}>
                                            {cityName}
                                        </Typography>
                                    }
                                    secondary={
                                        <Typography sx={{ color: COLORS.fadedText, fontSize: '0.72rem' }}>
                                            City · Nepal
                                        </Typography>
                                    }
                                />
                                <Chip
                                    label="City"
                                    size="small"
                                    sx={{
                                        height: 18, fontSize: '0.62rem', fontWeight: 700,
                                        bgcolor: `${COLORS.brand}18`, color: COLORS.brand,
                                        border: `1px solid ${COLORS.brand}40`,
                                        '& .MuiChip-label': { px: 0.8 },
                                    }}
                                />
                            </ListItem>
                        ))}

                        {/* Divider between cities and places */}
                        {cityMatches.length > 0 && results.length > 0 && (
                            <Box sx={{ px: 2, py: 0.5, bgcolor: `${COLORS.brand}08` }}>
                                <Typography sx={{ color: COLORS.fadedText, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                                    Specific Places
                                </Typography>
                            </Box>
                        )}

                        {/* Specific place results */}
                        {results.map((place) => (
                            <ListItem
                                key={place.google_place_id || place.id}
                                button
                                onClick={() => handleSelect(place)}
                                sx={{
                                    py: 1,
                                    px: 2,
                                    borderBottom: `1px solid ${COLORS.cardBorder}`,
                                    '&:hover': { bgcolor: `${COLORS.brand}10` },
                                    '&:last-child': { borderBottom: 'none' },
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 30 }}>
                                    <LocationOnIcon sx={{ color: COLORS.fadedText, fontSize: 17 }} />
                                </ListItemIcon>
                                <ListItemText
                                    primary={
                                        <Typography sx={{ color: COLORS.text, fontSize: '0.88rem', fontWeight: 500 }}>
                                            {place.name}
                                        </Typography>
                                    }
                                    secondary={
                                        <Typography sx={{ color: COLORS.fadedText, fontSize: '0.72rem' }} noWrap>
                                            {place.address}
                                        </Typography>
                                    }
                                />
                                {place.rating && (
                                    <Chip
                                        icon={<StarIcon sx={{ fontSize: '11px !important', color: '#FFD700 !important' }} />}
                                        label={place.rating}
                                        size="small"
                                        sx={{
                                            height: 18, fontSize: '0.68rem',
                                            bgcolor: 'rgba(255,215,0,0.1)',
                                            color: '#FFD700', border: 'none',
                                            '& .MuiChip-label': { px: 0.6 },
                                        }}
                                    />
                                )}
                            </ListItem>
                        ))}
                    </List>
                </Paper>
            )}
        </Box>
    );
}