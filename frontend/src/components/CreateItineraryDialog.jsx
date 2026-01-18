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
    Paper
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
import axios from 'axios';

const CreateItineraryDialog = ({ open, onClose, userId, onSuccess }) => {
    const [activeStep, setActiveStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Step 1: Basic Trip Info (simplified - only title and dates)
    const [tripInfo, setTripInfo] = useState({
        title: '',
        start_date: '',
        end_date: '',
        estimated_budget: '',
        currency: 'NPR'
    });

    // Step 2: Days with destinations
    const [days, setDays] = useState([]);
    const [validationErrors, setValidationErrors] = useState({});

    const steps = ['Trip Details', 'Plan Destinations', 'Review & Save'];

    // Calculate number of days
    const calculateDays = (startDate, endDate) => {
        if (!startDate || !endDate) return 0;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
    };

    // Generate days when dates change
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
                        destinations: []
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
            description: ''
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

    const validateStep1 = () => {
        const errors = {};
        
        if (!tripInfo.title.trim()) {
            errors.title = 'Trip title is required';
        } else if (tripInfo.title.trim().length < 3) {
            errors.title = 'Title must be at least 3 characters';
        }

        if (!tripInfo.start_date) {
            errors.start_date = 'Start date is required';
        }

        if (!tripInfo.end_date) {
            errors.end_date = 'End date is required';
        } else if (tripInfo.start_date && tripInfo.end_date < tripInfo.start_date) {
            errors.end_date = 'End date must be after start date';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleNext = () => {
        if (activeStep === 0) {
            if (!validateStep1()) return;
        }
        setActiveStep((prevStep) => prevStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevStep) => prevStep - 1);
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setError('');

        try {
            const budget = parseFloat(tripInfo.estimated_budget) || 0;

            const itineraryPayload = {
                title: tripInfo.title.trim(),
                destination: tripInfo.title.trim(),
                description: null,
                start_date: tripInfo.start_date,
                end_date: tripInfo.end_date,
                estimated_budget: budget,
                currency: tripInfo.currency,
                status: 'planning',
                is_public: false,
                user_id: userId,
                days: days.map(day => ({
                    day_number: day.day_number,
                    date: day.date,
                    title: `Day ${day.day_number}`,
                    description: null,
                    estimated_cost: 0
                })),
                accommodations: [],
                transportation: []
            };

            const itineraryResponse = await axios.post(
                'http://127.0.0.1:8000/itineraries/complete',
                itineraryPayload
            );

            // Add destinations as activities
            for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
                const day = days[dayIndex];
                const createdDay = itineraryResponse.data.days[dayIndex];

                for (const destination of day.destinations) {
                    if (destination.location.trim()) {
                        const activityPayload = {
                            title: destination.location.trim(),
                            description: destination.description.trim() || null,
                            location: destination.location.trim(),
                            start_time: destination.time || null,
                            end_time: null,
                            activity_type: 'destination',
                            cost: 0,
                            priority: 'medium',
                            is_completed: false,
                            day_id: createdDay.id
                        };

                        await axios.post('http://127.0.0.1:8000/activities', activityPayload);
                    }
                }
            }

            onSuccess();
            handleClose();

        } catch (err) {
            console.error('Error creating itinerary:', err);
            if (err.code === 'ERR_NETWORK') {
                setError('Cannot connect to server.');
            } else if (err.response) {
                setError(err.response.data.detail || 'Failed to create trip.');
            } else {
                setError('An unexpected error occurred.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!submitting) {
            setActiveStep(0);
            setTripInfo({
                title: '',
                start_date: '',
                end_date: '',
                estimated_budget: '',
                currency: 'NPR'
            });
            setDays([]);
            setValidationErrors({});
            setError('');
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
            PaperProps={{ sx: { minHeight: '80vh' } }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                <Box>
                    <Typography variant="h5" fontWeight="bold">Create New Trip</Typography>
                    <Typography variant="caption" color="text.secondary">
                        Plan your itinerary
                    </Typography>
                </Box>
                <IconButton onClick={handleClose} disabled={submitting}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <Box sx={{ px: 3, pt: 2 }}>
                <Stepper activeStep={activeStep}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>
            </Box>

            <DialogContent dividers sx={{ minHeight: '500px' }}>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                {/* STEP 1 */}
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
                                />
                            </Grid>
                        </Grid>

                        {tripInfo.start_date && tripInfo.end_date && (
                            <Alert severity="info" icon={<CheckCircleIcon />}>
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
                                >
                                    <option value="NPR">NPR</option>
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                    <option value="INR">INR</option>
                                </TextField>
                            </Grid>
                        </Grid>
                    </Stack>
                )}

                {/* STEP 2 */}
                {activeStep === 1 && (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                            Plan Your {days.length} Days
                        </Typography>

                        <Stack spacing={2}>
                            {days.map((day, dayIndex) => (
                                <Accordion 
                                    key={dayIndex}
                                    defaultExpanded={dayIndex === 0}
                                    sx={{ border: '1px solid #e0e0e0', '&:before': { display: 'none' } }}
                                >
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Stack direction="row" spacing={2} alignItems="center">
                                            <Typography variant="subtitle1" fontWeight="bold" color="primary">
                                                Day {day.day_number}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {formatDate(day.date)}
                                            </Typography>
                                            {day.destinations.length > 0 && (
                                                <Typography variant="caption" color="text.secondary">
                                                    • {day.destinations.length} destination{day.destinations.length !== 1 ? 's' : ''}
                                                </Typography>
                                            )}
                                        </Stack>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Stack spacing={2}>
                                            {day.destinations.map((destination, destIndex) => (
                                                <Paper key={destIndex} variant="outlined" sx={{ p: 2, bgcolor: '#fafafa' }}>
                                                    <Stack spacing={2}>
                                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                            <Stack direction="row" spacing={1} alignItems="center">
                                                                <LocationOnIcon fontSize="small" color="primary" />
                                                                <Typography variant="subtitle2" color="text.secondary">
                                                                    Destination {destIndex + 1}
                                                                </Typography>
                                                            </Stack>
                                                            <IconButton 
                                                                size="small" 
                                                                onClick={() => handleRemoveDestination(dayIndex, destIndex)}
                                                                color="error"
                                                            >
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        </Stack>

                                                        <Grid container spacing={2}>
                                                            <Grid item xs={12} sm={8}>
                                                                <TextField
                                                                    fullWidth
                                                                    label="Location/Place"
                                                                    value={destination.location}
                                                                    onChange={(e) => handleDestinationChange(dayIndex, destIndex, 'location', e.target.value)}
                                                                    placeholder="e.g., Kathmandu, Annapurna Base Camp"
                                                                    size="small"
                                                                />
                                                            </Grid>
                                                            <Grid item xs={12} sm={4}>
                                                                <TextField
                                                                    fullWidth
                                                                    label="Time"
                                                                    type="time"
                                                                    value={destination.time}
                                                                    onChange={(e) => handleDestinationChange(dayIndex, destIndex, 'time', e.target.value)}
                                                                    InputLabelProps={{ shrink: true }}
                                                                    size="small"
                                                                />
                                                            </Grid>
                                                            <Grid item xs={12}>
                                                                <TextField
                                                                    fullWidth
                                                                    label="Description (optional)"
                                                                    value={destination.description}
                                                                    onChange={(e) => handleDestinationChange(dayIndex, destIndex, 'description', e.target.value)}
                                                                    placeholder="e.g., Will enjoy local Bhajan in our way"
                                                                    size="small"
                                                                    multiline
                                                                    rows={2}
                                                                />
                                                            </Grid>
                                                        </Grid>
                                                    </Stack>
                                                </Paper>
                                            ))}

                                            <Button
                                                startIcon={<AddIcon />}
                                                onClick={() => handleAddDestination(dayIndex)}
                                                variant="outlined"
                                                sx={{ 
                                                    borderStyle: 'dashed',
                                                    borderColor: '#ffb74d',
                                                    color: '#ffb74d',
                                                    '&:hover': {
                                                        borderColor: '#ffa726',
                                                        bgcolor: 'rgba(255, 183, 77, 0.05)'
                                                    }
                                                }}
                                            >
                                                Add Destination
                                            </Button>
                                        </Stack>
                                    </AccordionDetails>
                                </Accordion>
                            ))}
                        </Stack>
                    </Box>
                )}

                {/* STEP 3 */}
                {activeStep === 2 && (
                    <Box sx={{ mt: 2 }}>
                        <Stack spacing={3}>
                            <Alert severity="success" icon={<CheckCircleIcon />}>
                                Review your itinerary
                            </Alert>

                            <Card variant="outlined">
                                <CardContent>
                                    <Typography variant="h5" gutterBottom fontWeight="bold">
                                        {tripInfo.title}
                                    </Typography>
                                    <Stack spacing={1}>
                                        <Typography variant="body2" color="text.secondary">
                                            {formatDate(tripInfo.start_date)} - {formatDate(tripInfo.end_date)} ({days.length} days)
                                        </Typography>
                                        {tripInfo.estimated_budget && (
                                            <Typography variant="body2" fontWeight="medium">
                                                Estimated Budget: {tripInfo.currency} {parseFloat(tripInfo.estimated_budget).toLocaleString()}
                                            </Typography>
                                        )}
                                    </Stack>
                                </CardContent>
                            </Card>

                            {days.map((day, index) => (
                                <Card key={index} variant="outlined" sx={{ bgcolor: '#fafafa' }}>
                                    <CardContent>
                                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                            Day {day.day_number}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                                            {formatDate(day.date)}
                                        </Typography>
                                        
                                        {day.destinations.length > 0 ? (
                                            <Stack spacing={1.5}>
                                                {day.destinations.map((dest, idx) => (
                                                    <Box key={idx} sx={{ pl: 2, borderLeft: '3px solid #ffb74d' }}>
                                                        <Stack direction="row" spacing={2} alignItems="center">
                                                            <Typography variant="body2" fontWeight="medium">
                                                                {dest.location}
                                                            </Typography>
                                                            {dest.time && (
                                                                <Stack direction="row" spacing={0.5} alignItems="center">
                                                                    <AccessTimeIcon fontSize="small" sx={{ fontSize: 14 }} />
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        {dest.time}
                                                                    </Typography>
                                                                </Stack>
                                                            )}
                                                        </Stack>
                                                        {dest.description && (
                                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                                                {dest.description}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                ))}
                                            </Stack>
                                        ) : (
                                            <Typography variant="caption" color="text.secondary">
                                                No destinations added
                                            </Typography>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </Stack>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={handleClose} disabled={submitting}>Cancel</Button>
                <Box sx={{ flex: '1 1 auto' }} />
                {activeStep > 0 && (
                    <Button onClick={handleBack} disabled={submitting} startIcon={<NavigateBeforeIcon />}>
                        Back
                    </Button>
                )}
                {activeStep < steps.length - 1 ? (
                    <Button
                        variant="contained"
                        onClick={handleNext}
                        endIcon={<NavigateNextIcon />}
                        sx={{ bgcolor: '#ffb74d', color: 'black', fontWeight: 'bold', '&:hover': { bgcolor: '#ffa726' } }}
                    >
                        Next
                    </Button>
                ) : (
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={submitting}
                        sx={{ bgcolor: '#ffb74d', color: 'black', fontWeight: 'bold', '&:hover': { bgcolor: '#ffa726' } }}
                    >
                        {submitting ? (
                            <Stack direction="row" spacing={1} alignItems="center">
                                <CircularProgress size={20} color="inherit" />
                                <span>Creating...</span>
                            </Stack>
                        ) : 'Create Trip'}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default CreateItineraryDialog;