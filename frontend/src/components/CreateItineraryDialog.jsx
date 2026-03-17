import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Stack,
    Box,
    Typography,
    IconButton,
    Stepper,
    Step,
    StepLabel,
    Card,
    CardContent,
    Alert,
    CircularProgress,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Grid,
    Paper,
    Divider,
    Chip,
    Menu,
    MenuItem,
    Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import EditIcon from '@mui/icons-material/Edit';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import HotelIcon from '@mui/icons-material/Hotel';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import axios from 'axios';
import PlaceSearchAutocomplete from './PlaceSearchAutocomplete';

const COLORS = {
    brand: '#33CCCC',
    background: '#141627',
    cardPrimary: '#252845',
    cardSecondary: 'rgba(255, 255, 255, 0.08)',
    headings: '#B0D2EB',
    subheadings: '#C0D2EB',
    text: '#D0D2EB',
    fadedText: '#7B809A',
    icons: '#B0D2EB',
    error: '#ff6b6b',
    border: 'rgba(255, 255, 255, 0.08)',
};

const inputSx = {
    '& .MuiOutlinedInput-root': {
        bgcolor: COLORS.cardSecondary,
        borderRadius: 3,
        color: COLORS.text,
        '& fieldset': { borderColor: 'transparent' },
        '&:hover fieldset': { borderColor: COLORS.brand },
        '&.Mui-focused fieldset': { borderColor: COLORS.brand },
    },
    '& .MuiInputBase-input::placeholder': { color: COLORS.fadedText, opacity: 1 },
    '& .MuiInputLabel-root': { color: COLORS.fadedText },
    '& .MuiInputLabel-root.Mui-focused': { color: COLORS.brand },
    '& .MuiFormHelperText-root': { color: COLORS.fadedText },
    '& .MuiInputBase-input': { color: COLORS.text },
    '& .MuiSelect-icon': { color: COLORS.fadedText },
    '& .MuiInputBase-input[type=date]::-webkit-calendar-picker-indicator': { filter: 'invert(0.6)' },
    '& .MuiInputBase-input[type=time]::-webkit-calendar-picker-indicator': { filter: 'invert(0.6)' },
};

const errorInputSx = (hasError) => ({
    ...inputSx,
    '& .MuiOutlinedInput-root': {
        ...inputSx['& .MuiOutlinedInput-root'],
        '& fieldset': { borderColor: hasError ? COLORS.error : 'transparent' },
    },
    '& .MuiFormHelperText-root': { color: hasError ? COLORS.error : COLORS.fadedText },
});

const TRAVEL_STYLES = [
    { value: 'general',   label: 'General' },
    { value: 'adventure', label: 'Adventure' },
    { value: 'cultural',  label: 'Cultural' },
    { value: 'trekking',  label: 'Trekking' },
    { value: 'relaxed',   label: 'Relaxed' },
    { value: 'budget',    label: 'Budget' },
    { value: 'luxury',    label: 'Luxury' },
];

const CreateItineraryDialog = ({ open, onClose, userId, onSuccess }) => {
    const [activeStep, setActiveStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [tripInfo, setTripInfo] = useState({
        title: '',
        start_date: '',
        end_date: '',
        estimated_budget: '',
        currency: 'NPR',
    });

    const [days, setDays] = useState([]);
    const [validationErrors, setValidationErrors] = useState({});

    // AI section state
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiStyle, setAiStyle] = useState('general');
    const [aiGenerating, setAiGenerating] = useState(false);
    const [aiError, setAiError] = useState('');

    const steps = ['Trip Details', 'Plan Destinations', 'Review & Save'];

    const calculateDays = (startDate, endDate) => {
        if (!startDate || !endDate) return 0;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    };

    useEffect(() => {
        if (tripInfo.start_date && tripInfo.end_date) {
            const numDays = calculateDays(tripInfo.start_date, tripInfo.end_date);
            if (numDays > 0 && numDays <= 365) {
                const startDate = new Date(tripInfo.start_date);
                const newDays = Array.from({ length: numDays }, (_, index) => {
                    const dayDate = new Date(startDate);
                    dayDate.setDate(startDate.getDate() + index);
                    return {
                        day_number: index + 1,
                        date: dayDate.toISOString().split('T')[0],
                        destinations: [],
                    };
                });
                setDays(newDays);
            }
        }
    }, [tripInfo.start_date, tripInfo.end_date]);

    const handleTripInfoChange = (e) => {
        const { name, value } = e.target;
        setTripInfo({ ...tripInfo, [name]: value });
        if (validationErrors[name]) {
            setValidationErrors({ ...validationErrors, [name]: '' });
        }
    };

    const handleAddDestination = (dayIndex) => {
        const newDays = [...days];
        newDays[dayIndex].destinations.push({
            location: '',
            time: '',
            description: '',
            estimated_budget: '',
            mapStatus: null,  // null = manual, no prompt needed
            // place fields populated when user picks from autocomplete
            latitude: null,
            longitude: null,
            google_place_id: null,
            formatted_address: null,
            place_types: null,
            rating: null,
        });
        setDays(newDays);
    };

    const handleRemoveDestination = (dayIndex, destIndex) => {
        const newDays = [...days];
        newDays[dayIndex].destinations.splice(destIndex, 1);
        setDays(newDays);
    };

    const handleDestinationChange = (dayIndex, destIndex, field, value) => {
        const newDays = [...days];
        newDays[dayIndex].destinations[destIndex][field] = value;
        setDays(newDays);
    };

    // called when user picks a place from the autocomplete dropdown
    const handlePlaceSelect = (dayIndex, destIndex, place) => {
        const newDays = [...days];
        newDays[dayIndex].destinations[destIndex] = {
            ...newDays[dayIndex].destinations[destIndex],
            location: place.name,
            formatted_address: place.address,
            latitude: place.latitude,
            longitude: place.longitude,
            google_place_id: place.google_place_id,
            place_types: place.place_types?.join(',') || null,
            rating: place.rating || null,
            mapStatus: 'mapped',
            searchResults: null,
        };
        setDays(newDays);
    };

    // search for a place and show results for the user to pick from
    const handleKeep = async (dayIndex, destIndex) => {
        const newDays = [...days];
        const dest = newDays[dayIndex].destinations[destIndex];
        newDays[dayIndex].destinations[destIndex].mapStatus = 'mapping';
        setDays([...newDays]);

        try {
            const res = await axios.get('http://127.0.0.1:8000/places/search', {
                params: { query: dest.location },
            });
            const results = res.data.results || [];
            if (results.length === 0) {
                // no results — go to picking state with empty results so user sees "skip"
                newDays[dayIndex].destinations[destIndex].mapStatus = 'picking';
                newDays[dayIndex].destinations[destIndex].searchResults = [];
            } else if (results.length === 1 && results[0].name.toLowerCase() === dest.location.toLowerCase()) {
                // exact single match — auto-map
                const place = results[0];
                newDays[dayIndex].destinations[destIndex] = {
                    ...dest,
                    location: place.name,
                    formatted_address: place.address,
                    latitude: place.latitude,
                    longitude: place.longitude,
                    google_place_id: place.google_place_id,
                    place_types: Array.isArray(place.place_types) ? place.place_types.join(',') : place.place_types || null,
                    rating: place.rating || null,
                    mapStatus: 'mapped',
                    searchResults: null,
                };
            } else {
                // multiple or inexact results — let user pick
                newDays[dayIndex].destinations[destIndex].mapStatus = 'picking';
                newDays[dayIndex].destinations[destIndex].searchResults = results;
            }
        } catch {
            newDays[dayIndex].destinations[destIndex].mapStatus = 'picking';
            newDays[dayIndex].destinations[destIndex].searchResults = [];
        }
        setDays([...newDays]);
    };

    // user picked a specific place from the search results
    const handlePickPlace = (dayIndex, destIndex, place) => {
        const newDays = [...days];
        newDays[dayIndex].destinations[destIndex] = {
            ...newDays[dayIndex].destinations[destIndex],
            location: place.name,
            formatted_address: place.address,
            latitude: place.latitude,
            longitude: place.longitude,
            google_place_id: place.google_place_id,
            place_types: Array.isArray(place.place_types) ? place.place_types.join(',') : place.place_types || null,
            rating: place.rating || null,
            mapStatus: 'mapped',
            searchResults: null,
        };
        setDays(newDays);
    };

    // skip mapping — keep the text as-is, no coordinates
    const handleSkipMapping = (dayIndex, destIndex) => {
        const newDays = [...days];
        newDays[dayIndex].destinations[destIndex].mapStatus = 'skipped';
        newDays[dayIndex].destinations[destIndex].searchResults = null;
        setDays([...newDays]);
    };

    // quick-add a nearby restaurant or hotel based on the destination's location
    const handleQuickAdd = (dayIndex, type) => {
        const day = days[dayIndex];
        // find a reference location from existing destinations in this day
        const refDest = day.destinations.find(d => d.location?.trim());
        const refLocation = refDest?.location || '';

        const newDays = [...days];
        newDays[dayIndex].destinations.push({
            location: refLocation ? `${type === 'restaurant' ? 'Restaurant' : 'Hotel'} near ${refLocation}` : '',
            time: type === 'restaurant' ? '12:30' : '18:00',
            description: '',
            estimated_budget: '',
            mapStatus: null,
            latitude: null,
            longitude: null,
            google_place_id: null,
            formatted_address: null,
            place_types: null,
            rating: null,
        });
        setDays(newDays);
    };

    // move a destination from one day to another
    const handleMoveDestination = (fromDayIndex, destIndex, toDayIndex) => {
        if (fromDayIndex === toDayIndex) return;
        const newDays = [...days];
        const [moved] = newDays[fromDayIndex].destinations.splice(destIndex, 1);
        newDays[toDayIndex].destinations.push(moved);
        setDays(newDays);
    };

    // map a place from editing or manual mode — shows results to pick from
    const handleMapPlace = async (dayIndex, destIndex) => {
        await handleKeep(dayIndex, destIndex);
    };

    // keep all: auto-map only exact matches, show picking for the rest
    const handleKeepAll = async () => {
        for (let di = 0; di < days.length; di++) {
            for (let desti = 0; desti < days[di].destinations.length; desti++) {
                if (days[di].destinations[desti].mapStatus === 'pending') {
                    await handleKeep(di, desti);
                }
            }
        }
    };

    // switch a pending destination to manual editing mode
    const handleEditMapping = (dayIndex, destIndex) => {
        const newDays = [...days];
        newDays[dayIndex].destinations[destIndex].mapStatus = 'editing';
        setDays(newDays);
    };

    const validateStep1 = () => {
        const errors = {};
        if (!tripInfo.title.trim()) errors.title = 'Trip title is required';
        else if (tripInfo.title.trim().length < 3) errors.title = 'Title must be at least 3 characters';
        if (!tripInfo.start_date) errors.start_date = 'Start date is required';
        if (!tripInfo.end_date) errors.end_date = 'End date is required';
        else if (tripInfo.start_date && tripInfo.end_date < tripInfo.start_date)
            errors.end_date = 'End date must be after start date';
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleNext = () => {
        if (activeStep === 0 && !validateStep1()) return;
        setActiveStep((prev) => prev + 1);
    };

    const handleBack = () => setActiveStep((prev) => prev - 1);

    // AI generation — uses the freeform prompt as destination description
    const handleAiGenerate = async () => {
        if (!validateStep1()) return;

        if (!aiPrompt.trim()) {
            setAiError('Please describe your ideal trip before generating.');
            return;
        }

        setAiGenerating(true);
        setAiError('');

        try {
            const numDays = calculateDays(tripInfo.start_date, tripInfo.end_date);

            const response = await axios.post('http://127.0.0.1:8000/ai/generate-itinerary', {
                destination: aiPrompt.trim(),
                days: numDays,
                budget: parseFloat(tripInfo.estimated_budget) || 0,
                style: aiStyle,
            });

            const data = response.data;

            const updatedDays = days.map((day) => {
                const aiDay = (data.days || []).find((d) => d.day_number === day.day_number);
                if (!aiDay) return day;
                return {
                    ...day,
                    destinations: (aiDay.activities || []).map((act) => ({
                        location: act.location || act.title || '',
                        time: act.start_time || '',
                        description: act.description || '',
                        activity_type: act.activity_type || 'sightseeing',
                        cost: act.cost || 0,
                        priority: act.priority || 'medium',
                        title: act.title || act.location || '',
                        // AI destinations start as pending — user must Keep/Edit/Delete
                        mapStatus: 'pending',
                        latitude: null,
                        longitude: null,
                        google_place_id: null,
                        formatted_address: null,
                        place_types: null,
                        rating: null,
                        estimated_budget: act.cost ? String(act.cost) : '',
                    })),
                };
            });

            setDays(updatedDays);
            setActiveStep(1);
        } catch (err) {
            if (err.response?.data?.detail) setAiError(err.response.data.detail);
            else setAiError('AI generation failed. You can still proceed manually by clicking Next.');
        } finally {
            setAiGenerating(false);
        }
    };

    const handleSubmit = async (saveAsDraft = false) => {
        setSubmitting(true);
        setError('');
        try {
            const budget = parseFloat(tripInfo.estimated_budget) || 0;
            const status = saveAsDraft ? 'draft' : 'planning';
            const itineraryPayload = {
                title: tripInfo.title.trim(),
                destination: tripInfo.title.trim(),
                description: null,
                start_date: tripInfo.start_date,
                end_date: tripInfo.end_date,
                estimated_budget: budget,
                currency: tripInfo.currency,
                status,
                is_public: false,
                user_id: userId,
                days: days.map((day) => ({
                    day_number: day.day_number,
                    date: day.date,
                    title: `Day ${day.day_number}`,
                    description: null,
                    estimated_cost: 0,
                })),
                accommodations: [],
                transportation: [],
            };

            const itineraryResponse = await axios.post(
                'http://127.0.0.1:8000/itineraries/complete',
                itineraryPayload
            );

            for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
                const day = days[dayIndex];
                const createdDay = itineraryResponse.data.days[dayIndex];
                for (const destination of day.destinations) {
                    if (destination.location.trim()) {
                        await axios.post('http://127.0.0.1:8000/activities', {
                            title: destination.title || destination.location.trim(),
                            description: destination.description?.trim() || null,
                            location: destination.location.trim(),
                            formatted_address: destination.formatted_address || null,
                            latitude: destination.latitude || null,
                            longitude: destination.longitude || null,
                            place_id: destination.google_place_id || null,
                            place_types: destination.place_types || null,
                            rating: destination.rating || null,
                            start_time: destination.time || null,
                            end_time: null,
                            activity_type: destination.activity_type || 'destination',
                            cost: parseFloat(destination.estimated_budget) || destination.cost || 0,
                            priority: destination.priority || 'medium',
                            is_completed: false,
                            day_id: createdDay.id,
                        });
                    }
                }
            }

            onSuccess();
            handleClose();
        } catch (err) {
            if (err.code === 'ERR_NETWORK') setError('Cannot connect to server.');
            else if (err.response) {
                const detail = err.response.data?.detail;
                if (typeof detail === 'string') setError(detail);
                else if (Array.isArray(detail)) setError(detail.map(e => e.msg || JSON.stringify(e)).join(', '));
                else setError('Failed to create trip.');
            }
            else setError('An unexpected error occurred.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!submitting) {
            setActiveStep(0);
            setTripInfo({ title: '', start_date: '', end_date: '', estimated_budget: '', currency: 'NPR' });
            setDays([]);
            setValidationErrors({});
            setError('');
            setAiPrompt('');
            setAiStyle('general');
            setAiError('');
            onClose();
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    minHeight: '80vh',
                    bgcolor: COLORS.background,
                    backgroundImage: 'linear-gradient(135deg, rgba(51,204,204,0.04) 0%, transparent 60%)',
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 4,
                    boxShadow: `0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px ${COLORS.border}`,
                },
            }}
        >
            {/* Title */}
            <DialogTitle
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    pb: 1,
                    borderBottom: `1px solid ${COLORS.border}`,
                    bgcolor: 'transparent',
                }}
            >
                <Box>
                    <Typography variant="h5" fontWeight="bold" sx={{ color: COLORS.headings }}>
                        Create New Trip
                    </Typography>
                    <Typography variant="caption" sx={{ color: COLORS.fadedText }}>
                        Plan your itinerary
                    </Typography>
                </Box>
                <IconButton
                    onClick={handleClose}
                    disabled={submitting}
                    sx={{
                        color: COLORS.fadedText,
                        borderRadius: 2,
                        '&:hover': { color: COLORS.error, bgcolor: 'rgba(255,107,107,0.1)' },
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            {/* Stepper */}
            <Box sx={{ px: 3, pt: 2.5 }}>
                <Stepper
                    activeStep={activeStep}
                    sx={{
                        '& .MuiStepLabel-label': { color: '#FFFFFF', fontSize: '0.85rem', opacity: 0.75 },
                        '& .MuiStepLabel-label.Mui-active': { color: COLORS.brand, fontWeight: 'bold', opacity: 1 },
                        '& .MuiStepLabel-label.Mui-completed': { color: '#FFFFFF', opacity: 1 },
                        '& .MuiStepIcon-root': { color: 'rgba(255,255,255,0.18)' },
                        '& .MuiStepIcon-root.Mui-active': { color: COLORS.brand },
                        '& .MuiStepIcon-root.Mui-completed': { color: COLORS.brand },
                        '& .MuiStepIcon-text': { fill: '#FFFFFF', fontWeight: 'bold' },
                        '& .MuiStepConnector-line': { borderColor: COLORS.border },
                    }}
                >
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>
            </Box>

            {/* Content */}
            <DialogContent
                dividers
                sx={{
                    minHeight: '500px',
                    borderColor: COLORS.border,
                    bgcolor: 'transparent',
                    '&::-webkit-scrollbar': { width: 6 },
                    '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
                    '&::-webkit-scrollbar-thumb': { bgcolor: COLORS.cardSecondary, borderRadius: 3 },
                }}
            >
                {error && (
                    <Alert
                        severity="error"
                        sx={{
                            mb: 2,
                            bgcolor: 'rgba(255,107,107,0.1)',
                            color: COLORS.error,
                            border: `1px solid rgba(255,107,107,0.3)`,
                            borderRadius: 2,
                            '& .MuiAlert-icon': { color: COLORS.error },
                        }}
                        onClose={() => setError('')}
                    >
                        {error}
                    </Alert>
                )}

                {/* STEP 1: Trip Details */}
                {activeStep === 0 && (
                    <Stack spacing={3} sx={{ mt: 2 }}>

                        <TextField
                            fullWidth
                            label="Trip Title *"
                            name="title"
                            value={tripInfo.title}
                            onChange={handleTripInfoChange}
                            error={Boolean(validationErrors.title)}
                            helperText={validationErrors.title || 'e.g., "Trip To Annapurna"'}
                            placeholder="Enter trip name"
                            sx={errorInputSx(Boolean(validationErrors.title))}
                        />

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Start Date *"
                                    name="start_date"
                                    type="date"
                                    value={tripInfo.start_date}
                                    onChange={handleTripInfoChange}
                                    error={Boolean(validationErrors.start_date)}
                                    helperText={validationErrors.start_date}
                                    InputLabelProps={{ shrink: true }}
                                    sx={errorInputSx(Boolean(validationErrors.start_date))}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="End Date *"
                                    name="end_date"
                                    type="date"
                                    value={tripInfo.end_date}
                                    onChange={handleTripInfoChange}
                                    error={Boolean(validationErrors.end_date)}
                                    helperText={validationErrors.end_date}
                                    InputLabelProps={{ shrink: true }}
                                    sx={errorInputSx(Boolean(validationErrors.end_date))}
                                />
                            </Grid>
                        </Grid>

                        {tripInfo.start_date && tripInfo.end_date && (
                            <Alert
                                icon={<CheckCircleIcon sx={{ color: COLORS.brand }} />}
                                sx={{
                                    bgcolor: 'rgba(51,204,204,0.08)',
                                    color: COLORS.brand,
                                    border: `1px solid rgba(51,204,204,0.25)`,
                                    borderRadius: 2,
                                    '& .MuiAlert-icon': { alignItems: 'center' },
                                }}
                            >
                                Your trip will be {calculateDays(tripInfo.start_date, tripInfo.end_date)} days long
                            </Alert>
                        )}

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={8}>
                                <TextField
                                    fullWidth
                                    label="Estimated Budget"
                                    name="estimated_budget"
                                    type="number"
                                    value={tripInfo.estimated_budget}
                                    onChange={handleTripInfoChange}
                                    helperText="Total budget (optional)"
                                    placeholder="10000"
                                    sx={inputSx}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    label="Currency"
                                    name="currency"
                                    select
                                    value={tripInfo.currency}
                                    onChange={handleTripInfoChange}
                                    SelectProps={{ native: true }}
                                    sx={{
                                        ...inputSx,
                                        '& select': {
                                            bgcolor: 'transparent',
                                            color: COLORS.text,
                                            '& option': { bgcolor: COLORS.cardPrimary, color: COLORS.text },
                                        },
                                    }}
                                >
                                    <option value="NPR">NPR</option>
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                    <option value="INR">INR</option>
                                </TextField>
                            </Grid>
                        </Grid>

                        {/* AI Generation Section */}
                        <Box>
                            <Divider sx={{ borderColor: COLORS.border, mb: 3 }} />

                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                                <AutoAwesomeIcon sx={{ fontSize: 16, color: COLORS.fadedText }} />
                                <Typography variant="subtitle2" sx={{ color: COLORS.subheadings, fontWeight: 'bold' }}>
                                    Generate with AI
                                </Typography>
                            </Stack>

                            <Typography variant="caption" sx={{ color: COLORS.fadedText, display: 'block', mb: 2 }}>
                                Describe your ideal trip — places you want to visit, things to do, landmarks, food experiences, or anything else. AI will build your day-by-day plan from it.
                            </Typography>

                            {aiError && (
                                <Alert
                                    severity="error"
                                    sx={{
                                        mb: 2,
                                        bgcolor: 'rgba(255,107,107,0.1)',
                                        color: COLORS.error,
                                        border: `1px solid rgba(255,107,107,0.3)`,
                                        borderRadius: 2,
                                        '& .MuiAlert-icon': { color: COLORS.error },
                                    }}
                                    onClose={() => setAiError('')}
                                >
                                    {aiError}
                                </Alert>
                            )}

                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Describe your ideal trip"
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                placeholder="e.g., I want to visit Boudhanath Stupa and Pashupatinath Temple, try local street food in Thamel, and hike to a viewpoint with Himalayan views. I also enjoy cultural experiences and peaceful spots."
                                sx={{ ...inputSx, mb: 2 }}
                            />

                            <Typography variant="caption" sx={{ color: COLORS.fadedText, display: 'block', mb: 1.5 }}>
                                Travel style
                            </Typography>

                            <Stack direction="row" flexWrap="wrap" gap={1}>
                                {TRAVEL_STYLES.map((style) => (
                                    <Chip
                                        key={style.value}
                                        label={style.label}
                                        onClick={() => setAiStyle(style.value)}
                                        size="small"
                                        sx={{
                                            borderRadius: 2,
                                            fontWeight: aiStyle === style.value ? 'bold' : 'normal',
                                            bgcolor: aiStyle === style.value
                                                ? 'rgba(51,204,204,0.18)'
                                                : COLORS.cardSecondary,
                                            color: aiStyle === style.value ? COLORS.brand : COLORS.fadedText,
                                            border: aiStyle === style.value
                                                ? `1px solid rgba(51,204,204,0.5)`
                                                : `1px solid transparent`,
                                            cursor: 'pointer',
                                            '&:hover': {
                                                bgcolor: 'rgba(51,204,204,0.1)',
                                                color: COLORS.brand,
                                            },
                                        }}
                                    />
                                ))}
                            </Stack>
                        </Box>
                    </Stack>
                )}

                {/* STEP 2: Plan Destinations */}
                {activeStep === 1 && (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="h6" gutterBottom sx={{ mb: 3, color: COLORS.headings, fontWeight: 'bold' }}>
                            Plan Your {days.length} Days
                        </Typography>

                        <Stack spacing={2}>
                            {days.map((day, dayIndex) => (
                                <Accordion
                                    key={dayIndex}
                                    defaultExpanded={dayIndex === 0}
                                    sx={{
                                        bgcolor: COLORS.cardPrimary,
                                        borderRadius: '12px !important',
                                        border: `1px solid ${COLORS.border}`,
                                        '&:before': { display: 'none' },
                                        boxShadow: 'none',
                                        '&.Mui-expanded': { boxShadow: `0 4px 20px rgba(51,204,204,0.08)` },
                                        overflow: 'hidden',
                                    }}
                                >
                                    <AccordionSummary
                                        expandIcon={<ExpandMoreIcon sx={{ color: COLORS.brand }} />}
                                        sx={{ bgcolor: 'transparent', '&:hover': { bgcolor: COLORS.cardSecondary } }}
                                    >
                                        <Stack direction="row" spacing={2} alignItems="center">
                                            <Box
                                                sx={{
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: 2,
                                                    bgcolor: 'rgba(51,204,204,0.15)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <Typography variant="caption" fontWeight="bold" sx={{ color: COLORS.brand }}>
                                                    {day.day_number}
                                                </Typography>
                                            </Box>
                                            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: COLORS.subheadings }}>
                                                Day {day.day_number}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: COLORS.fadedText }}>
                                                {formatDate(day.date)}
                                            </Typography>
                                            {day.destinations.length > 0 && (
                                                <Typography variant="caption" sx={{ color: COLORS.brand }}>
                                                    • {day.destinations.length} destination{day.destinations.length !== 1 ? 's' : ''}
                                                </Typography>
                                            )}
                                        </Stack>
                                    </AccordionSummary>
                                    <AccordionDetails sx={{ bgcolor: 'transparent', pt: 0 }}>
                                        <Stack spacing={2}>
                                            {/* Keep All shortcut — only shown when there are pending AI destinations */}
                                            {day.destinations.some(d => d.mapStatus === 'pending') && (
                                                <Stack direction="row" justifyContent="flex-end">
                                                    <Button
                                                        size="small"
                                                        onClick={handleKeepAll}
                                                        sx={{
                                                            fontSize: '0.75rem',
                                                            color: COLORS.brand,
                                                            bgcolor: 'rgba(51,204,204,0.08)',
                                                            borderRadius: 2,
                                                            px: 1.5,
                                                            '&:hover': { bgcolor: 'rgba(51,204,204,0.15)' },
                                                        }}
                                                    >
                                                        Keep All
                                                    </Button>
                                                </Stack>
                                            )}

                                            {day.destinations.map((destination, destIndex) => (
                                                <Paper
                                                    key={destIndex}
                                                    variant="outlined"
                                                    sx={{
                                                        p: 2,
                                                        bgcolor: COLORS.cardSecondary,
                                                        borderColor: destination.mapStatus === 'mapped'
                                                            ? 'rgba(51,204,204,0.25)'
                                                            : destination.mapStatus === 'skipped'
                                                                ? 'rgba(255,183,77,0.2)'
                                                                : destination.mapStatus === 'pending' || destination.mapStatus === 'picking'
                                                                    ? 'rgba(51,204,204,0.15)'
                                                                    : COLORS.border,
                                                        borderRadius: 3,
                                                        boxShadow: 'none',
                                                        transition: 'border-color 0.3s',
                                                    }}
                                                >
                                                    {/* PENDING — AI destination, same layout as edit but with Keep/Skip/Delete */}
                                                    {destination.mapStatus === 'pending' && (
                                                        <Stack spacing={1.5}>
                                                            {/* header */}
                                                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                                <Stack direction="row" spacing={1} alignItems="center">
                                                                    <AutoAwesomeIcon sx={{ fontSize: 14, color: COLORS.brand }} />
                                                                    <Typography variant="caption" sx={{ color: COLORS.brand, fontWeight: 'bold' }}>
                                                                        AI Suggested
                                                                    </Typography>
                                                                </Stack>
                                                                <Stack direction="row" spacing={0.5}>
                                                                    <Button size="small" onClick={() => handleKeep(dayIndex, destIndex)}
                                                                        sx={{ fontSize: '0.72rem', color: COLORS.brand, bgcolor: 'rgba(51,204,204,0.1)', borderRadius: 1.5, minWidth: 0, px: 1.2, '&:hover': { bgcolor: 'rgba(51,204,204,0.2)' } }}>
                                                                        Keep
                                                                    </Button>
                                                                    <Button size="small" onClick={() => handleSkipMapping(dayIndex, destIndex)}
                                                                        sx={{ fontSize: '0.72rem', color: COLORS.fadedText, bgcolor: COLORS.cardSecondary, borderRadius: 1.5, minWidth: 0, px: 1.2, '&:hover': { color: COLORS.text, bgcolor: 'rgba(255,255,255,0.1)' } }}>
                                                                        Skip
                                                                    </Button>
                                                                    <Button size="small" onClick={() => handleRemoveDestination(dayIndex, destIndex)}
                                                                        sx={{ fontSize: '0.72rem', color: COLORS.error, bgcolor: 'rgba(255,107,107,0.08)', borderRadius: 1.5, minWidth: 0, px: 1.2, '&:hover': { bgcolor: 'rgba(255,107,107,0.18)' } }}>
                                                                        Delete
                                                                    </Button>
                                                                </Stack>
                                                            </Stack>

                                                            {/* pre-filled fields — same as edit layout */}
                                                            <PlaceSearchAutocomplete
                                                                label="Location/Place"
                                                                value={destination.location}
                                                                onChange={(text) => handleDestinationChange(dayIndex, destIndex, 'location', text)}
                                                                onSelect={(place) => handlePlaceSelect(dayIndex, destIndex, place)}
                                                            />

                                                            <Stack direction="row" spacing={2}>
                                                                <TextField
                                                                    label="Time"
                                                                    type="time"
                                                                    value={destination.time}
                                                                    onChange={(e) => handleDestinationChange(dayIndex, destIndex, 'time', e.target.value)}
                                                                    InputLabelProps={{ shrink: true }}
                                                                    size="small"
                                                                    sx={{ ...inputSx, flex: 1 }}
                                                                />
                                                                <TextField
                                                                    label={`Budget (${tripInfo.currency})`}
                                                                    type="number"
                                                                    value={destination.estimated_budget}
                                                                    onChange={(e) => handleDestinationChange(dayIndex, destIndex, 'estimated_budget', e.target.value)}
                                                                    placeholder="0"
                                                                    size="small"
                                                                    inputProps={{ min: 0 }}
                                                                    sx={{ ...inputSx, flex: 1 }}
                                                                />
                                                            </Stack>

                                                            <TextField
                                                                fullWidth
                                                                label="Description (optional)"
                                                                value={destination.description}
                                                                onChange={(e) => handleDestinationChange(dayIndex, destIndex, 'description', e.target.value)}
                                                                size="small"
                                                                multiline
                                                                rows={2}
                                                                sx={inputSx}
                                                            />
                                                        </Stack>
                                                    )}

                                                    {/* MAPPING — spinner while auto-searching Places */}
                                                    {destination.mapStatus === 'mapping' && (
                                                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 0.5 }}>
                                                            <CircularProgress size={16} sx={{ color: COLORS.brand }} />
                                                            <Typography variant="caption" sx={{ color: COLORS.fadedText }}>
                                                                Searching for <strong style={{ color: COLORS.text }}>{destination.location}</strong>…
                                                            </Typography>
                                                        </Stack>
                                                    )}

                                                    {/* PICKING — search results, user chooses or skips */}
                                                    {destination.mapStatus === 'picking' && (
                                                        <Stack spacing={1.5}>
                                                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                                <Stack spacing={0.2}>
                                                                    <Typography variant="subtitle2" sx={{ color: COLORS.text, fontWeight: 600 }}>
                                                                        {destination.location}
                                                                    </Typography>
                                                                    <Typography variant="caption" sx={{ color: COLORS.fadedText }}>
                                                                        {(destination.searchResults || []).length === 0
                                                                            ? 'No matching place found on Google Maps'
                                                                            : (destination.searchResults || []).length === 1
                                                                                ? 'Skip if you don\'t see your desired place below'
                                                                                : 'Pick the right place or skip if none match'}
                                                                    </Typography>
                                                                </Stack>
                                                                <Stack direction="row" spacing={0.5}>
                                                                    <Button size="small" onClick={() => handleSkipMapping(dayIndex, destIndex)}
                                                                        sx={{ fontSize: '0.72rem', color: COLORS.fadedText, bgcolor: COLORS.cardSecondary, borderRadius: 1.5, minWidth: 0, px: 1.2, '&:hover': { color: COLORS.text, bgcolor: 'rgba(255,255,255,0.1)' } }}>
                                                                        Skip
                                                                    </Button>
                                                                    <Button size="small" onClick={() => handleRemoveDestination(dayIndex, destIndex)}
                                                                        sx={{ fontSize: '0.72rem', color: COLORS.error, bgcolor: 'rgba(255,107,107,0.08)', borderRadius: 1.5, minWidth: 0, px: 1.2, '&:hover': { bgcolor: 'rgba(255,107,107,0.18)' } }}>
                                                                        Delete
                                                                    </Button>
                                                                </Stack>
                                                            </Stack>

                                                            {(destination.searchResults || []).length > 0 && (
                                                                <Stack spacing={1}>
                                                                    {destination.searchResults.map((place, pi) => (
                                                                        <Box key={place.google_place_id || pi}
                                                                            onClick={() => handlePickPlace(dayIndex, destIndex, place)}
                                                                            sx={{
                                                                                p: 1.5, borderRadius: 2,
                                                                                bgcolor: 'rgba(51,204,204,0.04)',
                                                                                border: `1px solid rgba(51,204,204,0.15)`,
                                                                                cursor: 'pointer',
                                                                                transition: 'all 0.2s',
                                                                                '&:hover': { bgcolor: 'rgba(51,204,204,0.1)', border: `1px solid rgba(51,204,204,0.35)` },
                                                                            }}>
                                                                            <Stack direction="row" spacing={1.5} alignItems="center">
                                                                                <LocationOnIcon sx={{ fontSize: 16, color: COLORS.brand, flexShrink: 0 }} />
                                                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                                    <Typography variant="body2" sx={{ color: COLORS.text, fontWeight: 600, fontSize: '0.85rem' }}>
                                                                                        {place.name}
                                                                                    </Typography>
                                                                                    {place.address && (
                                                                                        <Typography variant="caption" sx={{ color: COLORS.fadedText, fontSize: '0.72rem' }} noWrap>
                                                                                            {place.address}
                                                                                        </Typography>
                                                                                    )}
                                                                                </Box>
                                                                                {place.rating && (
                                                                                    <Typography variant="caption" sx={{ color: '#FFD700', fontSize: '0.72rem', fontWeight: 600, flexShrink: 0 }}>
                                                                                        ★ {place.rating}
                                                                                    </Typography>
                                                                                )}
                                                                            </Stack>
                                                                        </Box>
                                                                    ))}
                                                                </Stack>
                                                            )}
                                                        </Stack>
                                                    )}

                                                    {/* NORMAL CARD — manual destinations + editing mode + mapped + skipped */}
                                                    {(destination.mapStatus === null || destination.mapStatus === 'editing' || destination.mapStatus === 'mapped' || destination.mapStatus === 'skipped') && (
                                                        <Stack spacing={1.5}>
                                                            {/* header row */}
                                                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                                <Stack direction="row" spacing={1} alignItems="center">
                                                                    {destination.mapStatus === 'mapped' ? (
                                                                        <CheckCircleIcon sx={{ fontSize: 18, color: COLORS.brand }} />
                                                                    ) : destination.mapStatus === 'skipped' ? (
                                                                        <CheckCircleIcon sx={{ fontSize: 18, color: '#ffb74d' }} />
                                                                    ) : (
                                                                        <LocationOnIcon fontSize="small" sx={{ color: COLORS.error }} />
                                                                    )}
                                                                    <Typography variant="subtitle2" sx={{ color: destination.mapStatus === 'mapped' ? COLORS.brand : destination.mapStatus === 'skipped' ? '#ffb74d' : COLORS.fadedText }}>
                                                                        Destination {destIndex + 1}
                                                                    </Typography>
                                                                    {destination.mapStatus === 'mapped' && (
                                                                        <Chip label="Mapped" size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: 'rgba(51,204,204,0.12)', color: COLORS.brand, border: `1px solid rgba(51,204,204,0.3)` }} />
                                                                    )}
                                                                    {destination.mapStatus === 'skipped' && (
                                                                        <Chip label="Not Mapped" size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: 'rgba(255,183,77,0.12)', color: '#ffb74d', border: `1px solid rgba(255,183,77,0.3)` }} />
                                                                    )}
                                                                </Stack>
                                                                <Stack direction="row" spacing={0.5} alignItems="center">
                                                                    {destination.mapStatus !== 'mapped' && destination.mapStatus !== 'skipped' && destination.location?.trim() && (
                                                                        <Button
                                                                            size="small"
                                                                            onClick={() => handleMapPlace(dayIndex, destIndex)}
                                                                            startIcon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
                                                                            sx={{
                                                                                fontSize: '0.7rem',
                                                                                color: COLORS.brand,
                                                                                bgcolor: 'rgba(51,204,204,0.1)',
                                                                                borderRadius: 1.5,
                                                                                minWidth: 0,
                                                                                px: 1,
                                                                                py: 0.3,
                                                                                textTransform: 'none',
                                                                                '&:hover': { bgcolor: 'rgba(51,204,204,0.2)' },
                                                                            }}
                                                                        >
                                                                            Keep
                                                                        </Button>
                                                                    )}
                                                                    {destination.mapStatus !== 'mapped' && destination.mapStatus !== 'skipped' && destination.location?.trim() && (
                                                                        <Button
                                                                            size="small"
                                                                            onClick={() => handleSkipMapping(dayIndex, destIndex)}
                                                                            sx={{
                                                                                fontSize: '0.7rem',
                                                                                color: COLORS.fadedText,
                                                                                bgcolor: COLORS.cardSecondary,
                                                                                borderRadius: 1.5,
                                                                                minWidth: 0,
                                                                                px: 1,
                                                                                py: 0.3,
                                                                                textTransform: 'none',
                                                                                '&:hover': { color: COLORS.text, bgcolor: 'rgba(255,255,255,0.1)' },
                                                                            }}
                                                                        >
                                                                            Skip
                                                                        </Button>
                                                                    )}
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => handleRemoveDestination(dayIndex, destIndex)}
                                                                        sx={{
                                                                            color: COLORS.fadedText,
                                                                            borderRadius: 1.5,
                                                                            '&:hover': { color: COLORS.error, bgcolor: 'rgba(255,107,107,0.1)' },
                                                                        }}
                                                                    >
                                                                        <DeleteIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Stack>
                                                            </Stack>

                                                            {/* location — full width */}
                                                            <PlaceSearchAutocomplete
                                                                label="Location/Place"
                                                                value={destination.location}
                                                                onChange={(text) => handleDestinationChange(dayIndex, destIndex, 'location', text)}
                                                                onSelect={(place) => handlePlaceSelect(dayIndex, destIndex, place)}
                                                            />

                                                            {/* guidance hint when not yet mapped */}
                                                            {destination.mapStatus !== 'mapped' && destination.mapStatus !== 'skipped' && (
                                                                <Alert
                                                                    icon={false}
                                                                    sx={{
                                                                        py: 0.5, px: 1.5, mt: -0.5,
                                                                        bgcolor: 'rgba(51,204,204,0.05)',
                                                                        border: `1px solid rgba(51,204,204,0.12)`,
                                                                        borderRadius: 2,
                                                                        '& .MuiAlert-message': { p: 0 },
                                                                    }}
                                                                >
                                                                    <Typography variant="caption" sx={{ color: COLORS.fadedText, fontSize: '0.7rem', lineHeight: 1.5 }}>
                                                                        Type and <strong style={{ color: COLORS.brand }}>select a place from the dropdown</strong> to map it.
                                                                        Or click <strong style={{ color: COLORS.brand }}>Keep</strong> to auto-search, or <strong style={{ color: COLORS.fadedText }}>Skip</strong> to continue without mapping.
                                                                    </Typography>
                                                                </Alert>
                                                            )}

                                                            {/* mapped address */}
                                                            {destination.formatted_address && (
                                                                <Typography variant="caption" sx={{ color: COLORS.fadedText, display: 'flex', alignItems: 'center', gap: 0.5, ml: 0.5, mt: -0.5 }}>
                                                                    <LocationOnIcon sx={{ fontSize: 12, color: COLORS.brand }} />
                                                                    {destination.formatted_address}
                                                                </Typography>
                                                            )}

                                                            {/* time + budget — side by side */}
                                                            <Stack direction="row" spacing={2}>
                                                                <TextField
                                                                    label="Time"
                                                                    type="time"
                                                                    value={destination.time}
                                                                    onChange={(e) => handleDestinationChange(dayIndex, destIndex, 'time', e.target.value)}
                                                                    InputLabelProps={{ shrink: true }}
                                                                    size="small"
                                                                    sx={{ ...inputSx, flex: 1 }}
                                                                />
                                                                <TextField
                                                                    label={`Budget (${tripInfo.currency})`}
                                                                    type="number"
                                                                    value={destination.estimated_budget}
                                                                    onChange={(e) => handleDestinationChange(dayIndex, destIndex, 'estimated_budget', e.target.value)}
                                                                    placeholder="0"
                                                                    size="small"
                                                                    inputProps={{ min: 0 }}
                                                                    sx={{ ...inputSx, flex: 1 }}
                                                                />
                                                            </Stack>

                                                            {/* description — full width */}
                                                            <TextField
                                                                fullWidth
                                                                label="Description (optional)"
                                                                value={destination.description}
                                                                onChange={(e) => handleDestinationChange(dayIndex, destIndex, 'description', e.target.value)}
                                                                placeholder="e.g., Will enjoy local Bhajan in our way"
                                                                size="small"
                                                                multiline
                                                                rows={2}
                                                                sx={inputSx}
                                                            />

                                                            {/* move to day */}
                                                            {days.length > 1 && (
                                                                <Stack direction="row" spacing={1} alignItems="center" sx={{ pt: 0.5 }}>
                                                                    <SwapVertIcon sx={{ fontSize: 14, color: COLORS.fadedText }} />
                                                                    <Typography variant="caption" sx={{ color: COLORS.fadedText, fontSize: '0.7rem' }}>Move to:</Typography>
                                                                    {days.map((d, di) => di !== dayIndex && (
                                                                        <Chip key={di} label={`Day ${d.day_number}`} size="small"
                                                                            onClick={() => handleMoveDestination(dayIndex, destIndex, di)}
                                                                            sx={{
                                                                                height: 20, fontSize: '0.62rem', cursor: 'pointer',
                                                                                bgcolor: 'rgba(255,255,255,0.05)', color: COLORS.fadedText,
                                                                                border: `1px solid ${COLORS.border}`,
                                                                                '&:hover': { bgcolor: 'rgba(51,204,204,0.1)', color: COLORS.brand, borderColor: 'rgba(51,204,204,0.3)' },
                                                                            }}
                                                                        />
                                                                    ))}
                                                                </Stack>
                                                            )}
                                                        </Stack>
                                                    )}
                                                </Paper>
                                            ))}

                                            {/* add destination + quick-add row */}
                                            <Stack direction="row" spacing={1} flexWrap="wrap">
                                                <Button
                                                    startIcon={<AddIcon />}
                                                    onClick={() => handleAddDestination(dayIndex)}
                                                    variant="outlined"
                                                    sx={{
                                                        borderStyle: 'dashed',
                                                        borderColor: `rgba(51,204,204,0.4)`,
                                                        color: COLORS.brand,
                                                        borderRadius: 3,
                                                        flex: 1,
                                                        '&:hover': { borderColor: COLORS.brand, bgcolor: 'rgba(51,204,204,0.06)' },
                                                    }}
                                                >
                                                    Add Destination
                                                </Button>
                                                <Tooltip title="Add restaurant nearby">
                                                    <IconButton onClick={() => handleQuickAdd(dayIndex, 'restaurant')}
                                                        sx={{ color: COLORS.fadedText, bgcolor: 'rgba(255,183,77,0.08)', borderRadius: 2, border: `1px dashed rgba(255,183,77,0.3)`, '&:hover': { bgcolor: 'rgba(255,183,77,0.15)', color: '#ffb74d' } }}>
                                                        <RestaurantIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Add hotel/lodge nearby">
                                                    <IconButton onClick={() => handleQuickAdd(dayIndex, 'hotel')}
                                                        sx={{ color: COLORS.fadedText, bgcolor: 'rgba(66,165,245,0.08)', borderRadius: 2, border: `1px dashed rgba(66,165,245,0.3)`, '&:hover': { bgcolor: 'rgba(66,165,245,0.15)', color: '#42a5f5' } }}>
                                                        <HotelIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        </Stack>
                                    </AccordionDetails>
                                </Accordion>
                            ))}
                        </Stack>
                    </Box>
                )}

                {/* STEP 3: Review & Save */}
                {activeStep === 2 && (
                    <Box sx={{ mt: 2 }}>
                        <Stack spacing={3}>
                            <Alert
                                icon={<CheckCircleIcon sx={{ color: COLORS.brand }} />}
                                sx={{
                                    bgcolor: 'rgba(51,204,204,0.08)',
                                    color: COLORS.brand,
                                    border: `1px solid rgba(51,204,204,0.25)`,
                                    borderRadius: 2,
                                }}
                            >
                                Review your itinerary
                            </Alert>

                            <Card
                                sx={{
                                    bgcolor: COLORS.cardPrimary,
                                    border: `1px solid ${COLORS.border}`,
                                    borderRadius: 3,
                                    boxShadow: 'none',
                                }}
                            >
                                <CardContent>
                                    <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ color: COLORS.headings }}>
                                        {tripInfo.title}
                                    </Typography>
                                    <Stack spacing={1}>
                                        <Typography variant="body2" sx={{ color: COLORS.fadedText }}>
                                            {formatDate(tripInfo.start_date)} – {formatDate(tripInfo.end_date)} ({days.length} days)
                                        </Typography>
                                        {tripInfo.estimated_budget && (
                                            <Typography variant="body2" fontWeight="medium" sx={{ color: COLORS.brand }}>
                                                Estimated Budget: {tripInfo.currency} {parseFloat(tripInfo.estimated_budget).toLocaleString()}
                                            </Typography>
                                        )}
                                    </Stack>
                                </CardContent>
                            </Card>

                            {days.map((day) => (
                                <Card
                                    key={day.day_number}
                                    sx={{
                                        bgcolor: COLORS.cardPrimary,
                                        border: `1px solid ${COLORS.border}`,
                                        borderRadius: 3,
                                        boxShadow: 'none',
                                    }}
                                >
                                    <CardContent>
                                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ color: COLORS.subheadings }}>
                                            Day {day.day_number} — {formatDate(day.date)}
                                        </Typography>
                                        {day.destinations.length === 0 ? (
                                            <Typography variant="body2" sx={{ color: COLORS.fadedText, fontStyle: 'italic' }}>
                                                No destinations added
                                            </Typography>
                                        ) : (
                                            <Stack spacing={1}>
                                                {day.destinations.map((dest, i) => (
                                                    <Stack key={i} direction="row" spacing={1} alignItems="flex-start">
                                                        <LocationOnIcon fontSize="small" sx={{ color: COLORS.brand, mt: 0.2, flexShrink: 0 }} />
                                                        <Box>
                                                            <Typography variant="body2" sx={{ color: COLORS.text }}>
                                                                {dest.location}
                                                                {dest.time && (
                                                                    <Typography component="span" variant="caption" sx={{ color: COLORS.fadedText, ml: 1 }}>
                                                                        @ {dest.time}
                                                                    </Typography>
                                                                )}
                                                                {dest.google_place_id && (
                                                                    <Typography component="span" variant="caption" sx={{ color: COLORS.brand, ml: 1 }}>
                                                                        · mapped
                                                                    </Typography>
                                                                )}
                                                            </Typography>
                                                            {dest.description && (
                                                                <Typography variant="caption" sx={{ color: COLORS.fadedText }}>
                                                                    {dest.description}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </Stack>
                                                ))}
                                            </Stack>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </Stack>
                    </Box>
                )}
            </DialogContent>

            {/* Actions */}
            <DialogActions
                sx={{
                    px: 3,
                    py: 2,
                    borderTop: `1px solid ${COLORS.border}`,
                    bgcolor: 'transparent',
                    gap: 1,
                }}
            >
                {activeStep > 0 && (
                    <Button
                        onClick={handleBack}
                        disabled={submitting}
                        startIcon={<NavigateBeforeIcon />}
                        sx={{ color: COLORS.fadedText, borderRadius: 2, '&:hover': { bgcolor: COLORS.cardSecondary } }}
                    >
                        Back
                    </Button>
                )}

                <Box sx={{ flex: 1 }} />

                {/* Step 1 actions: Save Draft + Generate + Next */}
                {activeStep === 0 && (
                    <Stack direction="row" spacing={1}>
                        {tripInfo.title.trim() && tripInfo.start_date && tripInfo.end_date && (
                            <Button
                                onClick={() => handleSubmit(true)}
                                disabled={submitting}
                                sx={{ color: COLORS.fadedText, borderRadius: 2, textTransform: 'none', '&:hover': { bgcolor: COLORS.cardSecondary } }}
                            >
                                Save Draft
                            </Button>
                        )}
                        <Button
                            onClick={handleAiGenerate}
                            disabled={aiGenerating || submitting}
                            startIcon={aiGenerating ? <CircularProgress size={16} sx={{ color: COLORS.brand }} /> : <AutoAwesomeIcon />}
                            variant="outlined"
                            sx={{
                                borderColor: `rgba(51,204,204,0.5)`,
                                color: COLORS.brand,
                                borderRadius: 2,
                                '&:hover': { borderColor: COLORS.brand, bgcolor: 'rgba(51,204,204,0.08)' },
                                '&:disabled': { opacity: 0.5 },
                            }}
                        >
                            {aiGenerating ? 'Generating...' : 'Generate'}
                        </Button>
                        <Button
                            onClick={handleNext}
                            disabled={submitting}
                            endIcon={<NavigateNextIcon />}
                            variant="contained"
                            sx={{
                                bgcolor: COLORS.brand,
                                color: COLORS.background,
                                borderRadius: 2,
                                fontWeight: 'bold',
                                '&:hover': { bgcolor: '#29b8b8' },
                            }}
                        >
                            Next
                        </Button>
                    </Stack>
                )}

                {/* Step 2 actions: Save Draft + Review */}
                {activeStep === 1 && (
                    <Stack direction="row" spacing={1}>
                        <Button
                            onClick={() => handleSubmit(true)}
                            disabled={submitting}
                            sx={{ color: COLORS.fadedText, borderRadius: 2, textTransform: 'none', '&:hover': { bgcolor: COLORS.cardSecondary } }}
                        >
                            Save Draft
                        </Button>
                        <Button
                            onClick={handleNext}
                            endIcon={<NavigateNextIcon />}
                            variant="contained"
                            sx={{
                                bgcolor: COLORS.brand,
                                color: COLORS.background,
                                borderRadius: 2,
                                fontWeight: 'bold',
                                '&:hover': { bgcolor: '#29b8b8' },
                            }}
                        >
                            Review
                        </Button>
                    </Stack>
                )}

                {/* Step 3 actions: Save Draft + Create Trip */}
                {activeStep === 2 && (
                    <Stack direction="row" spacing={1}>
                        <Button
                            onClick={() => handleSubmit(true)}
                            disabled={submitting}
                            sx={{ color: COLORS.fadedText, borderRadius: 2, textTransform: 'none', '&:hover': { bgcolor: COLORS.cardSecondary } }}
                        >
                            Save Draft
                        </Button>
                        <Button
                            onClick={() => handleSubmit(false)}
                            disabled={submitting}
                            variant="contained"
                            startIcon={submitting ? <CircularProgress size={16} sx={{ color: COLORS.background }} /> : <CheckCircleIcon />}
                            sx={{
                                bgcolor: COLORS.brand,
                                color: COLORS.background,
                                borderRadius: 2,
                                fontWeight: 'bold',
                                '&:hover': { bgcolor: '#29b8b8' },
                                '&:disabled': { opacity: 0.6 },
                            }}
                        >
                            {submitting ? 'Saving...' : 'Create Trip'}
                        </Button>
                    </Stack>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default CreateItineraryDialog;