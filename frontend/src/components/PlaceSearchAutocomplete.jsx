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

// Canonical cities — mirrors backend _ALL_CITIES
const NEPAL_CITIES = [
    'Kathmandu', 'Pokhara', 'Lalitpur', 'Bhaktapur', 'Bharatpur',
    'Lumbini', 'Namche', 'Lukla', 'Jomsom', 'Manang',
    'Lo Manthang', 'Nagarkot', 'Dhulikhel', 'Bandipur', 'Tansen',
    'Gorkha', 'Janakpur', 'Kirtipur', 'Dharan', 'Biratnagar',
    'Butwal', 'Hetauda', 'Itahari', 'Nepalgunj', 'Birendranagar',
    'Dhangadhi', 'Siddharthanagar', 'Panauti', 'Ilam', 'Dhankuta',
    'Phaplu', 'Salleri', 'Okhaldhunga', 'Khandbari', 'Tumlingtar',
    'Charikot', 'Jiri', 'Besisahar', 'Chame', 'Kagbeni',
    'Syabrubesi', 'Dhunche', 'Ghandruk', 'Ghorepani', 'Tatopani',
    'Beni', 'Baglung', 'Jumla', 'Simikot', 'Dunai',
    'Taplejung', 'Damauli', 'Sauraha', 'Thakurdwara', 'Kakani',
    'Daman', 'Annapurna',
];

// Sub-areas → parent city — mirrors backend _SUBAREA_MAP
const SUBAREA_MAP = {
    // Kathmandu
    'Thamel': 'Kathmandu', 'Boudha': 'Kathmandu', 'Bouddha': 'Kathmandu',
    'Swayambhu': 'Kathmandu', 'Swayambhunath': 'Kathmandu', 'Asan': 'Kathmandu',
    'Pashupatinath': 'Kathmandu', 'Durbar Marg': 'Kathmandu', 'Naxal': 'Kathmandu',
    'Basantapur': 'Kathmandu', 'Baneshwor': 'Kathmandu', 'Koteshwor': 'Kathmandu',
    'Maharajgunj': 'Kathmandu', 'Baluwatar': 'Kathmandu', 'Chabahil': 'Kathmandu',
    'Gaushala': 'Kathmandu', 'Sinamangal': 'Kathmandu', 'Kalimati': 'Kathmandu',
    'Teku': 'Kathmandu', 'Tripureshwor': 'Kathmandu', 'Lazimpat': 'Kathmandu',
    'Thapathali': 'Kathmandu', 'Putalisadak': 'Kathmandu', 'Kamaladi': 'Kathmandu',
    'Gyaneshwor': 'Kathmandu', 'Maitidevi': 'Kathmandu', 'Dillibazar': 'Kathmandu',
    'Anamnagar': 'Kathmandu', 'Kuleshwor': 'Kathmandu', 'Bafal': 'Kathmandu',
    'Sitapaila': 'Kathmandu', 'Samakhusi': 'Kathmandu', 'Gongabu': 'Kathmandu',
    'Tokha': 'Kathmandu', 'Budhanilkantha': 'Kathmandu', 'Kapan': 'Kathmandu',
    'Gokarna': 'Kathmandu', 'Sundarijal': 'Kathmandu', 'Dakshinkali': 'Kathmandu',
    'Chobhar': 'Kathmandu', 'Chandragiri': 'Kathmandu', 'New Road': 'Kathmandu',
    'Indrachowk': 'Kathmandu', 'Jamal': 'Kathmandu', 'Makhan': 'Kathmandu',
    'Tahachal': 'Kathmandu',
    // Lalitpur
    'Patan': 'Lalitpur', 'Jawalakhel': 'Lalitpur', 'Jhamsikhel': 'Lalitpur',
    'Godawari': 'Lalitpur',
    // Bhaktapur
    'Thimi': 'Bhaktapur', 'Suryabinayak': 'Bhaktapur', 'Sallaghari': 'Bhaktapur',
    'Kamalbinayak': 'Bhaktapur', 'Dattatreya': 'Bhaktapur', 'Taumadhi': 'Bhaktapur',
    'Pottery Square': 'Bhaktapur', 'Byasi': 'Bhaktapur', 'Chyamasingh': 'Bhaktapur',
    'Bageshwori': 'Bhaktapur', 'Changunarayan': 'Bhaktapur', 'Bode': 'Bhaktapur',
    'Nagdesh': 'Bhaktapur', 'Katunje': 'Bhaktapur', 'Balkot': 'Bhaktapur',
    'Sirutar': 'Bhaktapur', 'Dadhikot': 'Bhaktapur',
    // Pokhara
    'Lakeside': 'Pokhara', 'Sarangkot': 'Pokhara', 'Phewa': 'Pokhara',
    'Begnas': 'Pokhara', 'Mahendrapul': 'Pokhara', 'Chipledhunga': 'Pokhara',
    'Prithvichowk': 'Pokhara', 'Srijanachowk': 'Pokhara', 'Parsyang': 'Pokhara',
    'Bagar': 'Pokhara', 'Amarsingh Chowk': 'Pokhara', 'Ram Bazaar': 'Pokhara',
    'Matepani': 'Pokhara', 'Kahun Danda': 'Pokhara', 'Pumdikot': 'Pokhara',
    'Shanti Stupa': 'Pokhara', 'Hemja': 'Pokhara', 'Lamachaur': 'Pokhara',
    'Batulechaur': 'Pokhara', 'Pardi': 'Pokhara', 'Birauta': 'Pokhara',
    'Chhorepatan': 'Pokhara', 'Rupakot': 'Pokhara', 'Majhikuna': 'Pokhara',
    'Khapaudi': 'Pokhara', 'Pame': 'Pokhara',
    // Other cities
    'Narayangarh': 'Bharatpur', 'Devghat': 'Bharatpur',
    'Maya Devi': 'Lumbini', 'Monastic Zone': 'Lumbini',
    'Khumjung': 'Namche', 'Tengboche': 'Namche',
    'Gorkha Durbar': 'Gorkha',
    'Janaki Mandir': 'Janakpur',
    'Bhedetar': 'Dharan', 'Pindeshwor': 'Dharan',
    'Kanyam': 'Ilam', 'Fikkal': 'Ilam',
    'Tundikhel': 'Bandipur',
    'Shreenagar': 'Tansen', 'Rani Mahal': 'Tansen',
    'Muktinath': 'Kagbeni',
    // Annapurna region
    'Annapurna Base Camp': 'Annapurna', 'ABC': 'Annapurna',
    'Annapurna Circuit': 'Annapurna', 'Poon Hill': 'Annapurna',
    'Tadapani': 'Annapurna', 'Chomrong': 'Annapurna',
    'Sinuwa': 'Annapurna', 'Bamboo': 'Annapurna',
    'Dovan': 'Annapurna', 'Machapuchare Base Camp': 'Annapurna',
    'MBC': 'Annapurna',
};

// City/subarea synthetic place object — used when the query matches a known location directly
const makeCityOption = (displayName) => {
    // Subarea entries look like "Thamel (Kathmandu)"
    const subareaMatch = displayName.match(/^(.+) \((.+)\)$/);
    const name = subareaMatch ? subareaMatch[1] : displayName;
    const parent = subareaMatch ? subareaMatch[2] : displayName;
    return {
        id: `city-${name}`,
        google_place_id: null,
        name,
        address: subareaMatch ? `${name}, ${parent}, Nepal` : `${name}, Nepal`,
        latitude: null,
        longitude: null,
        city: parent,
        place_types: [subareaMatch ? 'neighborhood' : 'locality'],
        rating: null,
        _isCity: true,
    };
};

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

        // Check cities and subareas for instant suggestions
        const lower = val.toLowerCase().trim();
        const cityHits = NEPAL_CITIES.filter(c =>
            c.toLowerCase().startsWith(lower) || c.toLowerCase().includes(lower)
        );
        const subareaHits = Object.keys(SUBAREA_MAP).filter(s =>
            s.toLowerCase().startsWith(lower) || s.toLowerCase().includes(lower)
        ).map(s => `${s} (${SUBAREA_MAP[s]})`);
        // Show up to 2 city matches; subareas only if no city matched
        const matched = cityHits.length > 0 ? cityHits.slice(0, 2) : subareaHits.slice(0, 2);
        setCityMatches(matched);
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
                // Check subareas first, then cities
                const subMatch = Object.entries(SUBAREA_MAP).find(([sub]) =>
                    lower.includes(sub.toLowerCase())
                );
                if (subMatch) {
                    params.city = subMatch[1];
                } else {
                    const cityMatch = NEPAL_CITIES.find(c => lower.includes(c.toLowerCase()));
                    if (cityMatch) params.city = cityMatch;
                }
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
                                            {cityName.includes('(') ? `Area · Nepal` : 'City · Nepal'}
                                        </Typography>
                                    }
                                />
                                <Chip
                                    label={cityName.includes('(') ? 'Area' : 'City'}
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