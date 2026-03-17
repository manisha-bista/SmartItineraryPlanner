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
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import StarIcon from '@mui/icons-material/Star';
import axios from 'axios';

const COLORS = {
    brand: '#33CCCC',
    background: '#141627',
    cardPrimary: '#252845',
    cardSecondary: 'rgba(255, 255, 255, 0.08)',
    text: '#D0D2EB',
    fadedText: '#7B809A',
    border: 'rgba(255, 255, 255, 0.08)',
};

export default function PlaceSearchAutocomplete({ label = "Search place", city, onSelect, value, onChange, inputSx = {} }) {
    const [query, setQuery] = useState(value || '');
    const [results, setResults] = useState([]);
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

        if (val.length < 3) {
            setResults([]);
            setOpen(false);
            return;
        }

        // debounce — wait 500ms after user stops typing before hitting backend
        debounceRef.current = setTimeout(() => fetchPlaces(val), 500);
    };

    const fetchPlaces = async (q) => {
        setLoading(true);
        try {
            const params = { query: q };
            if (city) params.city = city;
            const res = await axios.get('http://localhost:8000/places/search', { params });
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
    };

    return (
        <Box ref={wrapperRef} sx={{ position: 'relative', width: '100%' }}>
            <TextField
                fullWidth
                label={label}
                value={query}
                onChange={handleType}
                onFocus={() => results.length > 0 && setOpen(true)}
                InputProps={{
                    endAdornment: loading ? <CircularProgress size={16} sx={{ color: COLORS.brand }} /> : null,
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

            {open && results.length > 0 && (
                <Paper
                    elevation={8}
                    sx={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 1400,
                        bgcolor: '#1e2035',
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 2,
                        mt: 0.5,
                        maxHeight: 280,
                        overflowY: 'auto',
                    }}
                >
                    <List dense disablePadding>
                        {results.map((place) => (
                            <ListItem
                                key={place.google_place_id}
                                button
                                onClick={() => handleSelect(place)}
                                sx={{
                                    py: 1.2,
                                    px: 2,
                                    borderBottom: `1px solid ${COLORS.border}`,
                                    '&:hover': { bgcolor: 'rgba(51,204,204,0.08)' },
                                    '&:last-child': { borderBottom: 'none' },
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                    <LocationOnIcon sx={{ color: COLORS.brand, fontSize: 18 }} />
                                </ListItemIcon>
                                <ListItemText
                                    primary={
                                        <Typography sx={{ color: COLORS.text, fontSize: '0.9rem', fontWeight: 500 }}>
                                            {place.name}
                                        </Typography>
                                    }
                                    secondary={
                                        <Typography sx={{ color: COLORS.fadedText, fontSize: '0.75rem' }} noWrap>
                                            {place.address}
                                        </Typography>
                                    }
                                />
                                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', ml: 1 }}>
                                    {place.rating && (
                                        <Chip
                                            icon={<StarIcon sx={{ fontSize: '12px !important', color: '#FFD700 !important' }} />}
                                            label={place.rating}
                                            size="small"
                                            sx={{
                                                height: 20,
                                                fontSize: '0.7rem',
                                                bgcolor: 'rgba(255,215,0,0.1)',
                                                color: '#FFD700',
                                                border: 'none',
                                            }}
                                        />
                                    )}
                                </Box>
                            </ListItem>
                        ))}
                    </List>
                </Paper>
            )}
        </Box>
    );
}