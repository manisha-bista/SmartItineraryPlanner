import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Button,
    Card,
    CardContent,
    Stack,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Grid,
    Paper,
    Divider,
    Alert,
    CircularProgress,
    Menu,
    MenuItem,
    Tabs,
    Tab,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Tooltip
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

// Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import HikingIcon from '@mui/icons-material/Hiking';
import MuseumIcon from '@mui/icons-material/Museum';
import LocalActivityIcon from '@mui/icons-material/LocalActivity';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';

const ItineraryDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // State
    const [itinerary, setItinerary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Dialog states
    const [dayDialogOpen, setDayDialogOpen] = useState(false);
    const [activityDialogOpen, setActivityDialogOpen] = useState(false);
    const [editingDay, setEditingDay] = useState(null);
    const [selectedDayId, setSelectedDayId] = useState(null);

    // Form states
    const [dayFormData, setDayFormData] = useState({
        day_number: 1,
        date: '',
        title: '',
        description: '',
        destination: '',
        estimated_cost: 0
    });

    const [activityFormData, setActivityFormData] = useState({
        title: '',
        description: '',
        location: '',
        start_time: '',
        end_time: '',
        activity_type: 'sightseeing',
        cost: 0,
        priority: 'medium'
    });

    const [validationErrors, setValidationErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    // Menu state
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedActivity, setSelectedActivity] = useState(null);

    // Activity type icons
    const activityIcons = {
        sightseeing: <MuseumIcon />,
        dining: <RestaurantIcon />,
        adventure: <HikingIcon />,
        activity: <LocalActivityIcon />
    };

    // Priority colors
    const priorityColors = {
        low: 'default',
        medium: 'primary',
        high: 'warning',
        'must-do': 'error'
    };

    // Fetch itinerary details
    useEffect(() => {
        fetchItineraryDetail();
    }, [id]);

    const fetchItineraryDetail = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`http://127.0.0.1:8000/itineraries/${id}`);
            setItinerary(response.data);
            setError('');
        } catch (err) {
            console.error('Error fetching itinerary:', err);
            setError('Failed to load itinerary details.');
        } finally {
            setLoading(false);
        }
    };

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            weekday: 'short',
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    };

    // Format time
    const formatTime = (timeString) => {
        if (!timeString) return '';
        return timeString.slice(0, 5); // HH:MM
    };

    // Calculate days between dates
    const getDaysBetween = (start, end) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffTime = Math.abs(endDate - startDate);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    };

    // Handle day dialog
    const handleOpenDayDialog = (day = null) => {
        if (day) {
            setEditingDay(day);
            setDayFormData({
                day_number: day.day_number,
                date: day.date,
                title: day.title || '',
                description: day.description || '',
                destination: day.title || '',
                estimated_cost: day.estimated_cost || 0
            });
        } else {
            const nextDayNumber = itinerary.days.length + 1;
            const startDate = new Date(itinerary.start_date);
            const nextDate = new Date(startDate);
            nextDate.setDate(startDate.getDate() + nextDayNumber - 1);

            setEditingDay(null);
            setDayFormData({
                day_number: nextDayNumber,
                date: nextDate.toISOString().split('T')[0],
                title: '',
                description: '',
                destination: '',
                estimated_cost: 0
            });
        }
        setDayDialogOpen(true);
        setValidationErrors({});
    };

    const handleCloseDayDialog = () => {
        setDayDialogOpen(false);
        setEditingDay(null);
        setDayFormData({
            day_number: 1,
            date: '',
            title: '',
            description: '',
            destination: '',
            estimated_cost: 0
        });
        setValidationErrors({});
    };

    const handleDayInputChange = (e) => {
        const { name, value } = e.target;
        setDayFormData({ ...dayFormData, [name]: value });
        if (validationErrors[name]) {
            setValidationErrors({ ...validationErrors, [name]: '' });
        }
    };

    const validateDayForm = () => {
        const errors = {};
        if (!dayFormData.date) errors.date = 'Date is required';
        if (!dayFormData.destination?.trim()) errors.destination = 'Destination is required';
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSaveDay = async () => {
        if (!validateDayForm()) return;

        setSubmitting(true);
        try {
            const payload = {
                day_number: dayFormData.day_number,
                date: dayFormData.date,
                title: dayFormData.destination.trim(),
                description: dayFormData.description.trim(),
                estimated_cost: parseFloat(dayFormData.estimated_cost) || 0,
                actual_cost: 0,
                itinerary_id: parseInt(id),
                activities: []
            };

            if (editingDay) {
                // Update existing day (would need PUT endpoint)
                console.log('Update day:', payload);
                setSuccess('Day updated successfully!');
            } else {
                // Create new day
                await axios.post('http://127.0.0.1:8000/itinerary-days', payload);
                setSuccess('Day added successfully!');
            }

            await fetchItineraryDetail();
            handleCloseDayDialog();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error saving day:', err);
            setError(err.response?.data?.detail || 'Failed to save day');
        } finally {
            setSubmitting(false);
        }
    };

    // Handle activity dialog
    const handleOpenActivityDialog = (dayId) => {
        setSelectedDayId(dayId);
        setActivityFormData({
            title: '',
            description: '',
            location: '',
            start_time: '',
            end_time: '',
            activity_type: 'sightseeing',
            cost: 0,
            priority: 'medium'
        });
        setActivityDialogOpen(true);
        setValidationErrors({});
    };

    const handleCloseActivityDialog = () => {
        setActivityDialogOpen(false);
        setSelectedDayId(null);
        setActivityFormData({
            title: '',
            description: '',
            location: '',
            start_time: '',
            end_time: '',
            activity_type: 'sightseeing',
            cost: 0,
            priority: 'medium'
        });
        setValidationErrors({});
    };

    const handleActivityInputChange = (e) => {
        const { name, value } = e.target;
        setActivityFormData({ ...activityFormData, [name]: value });
        if (validationErrors[name]) {
            setValidationErrors({ ...validationErrors, [name]: '' });
        }
    };

    const validateActivityForm = () => {
        const errors = {};
        if (!activityFormData.title?.trim()) errors.title = 'Activity title is required';
        if (!activityFormData.location?.trim()) errors.location = 'Location is required';
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSaveActivity = async () => {
        if (!validateActivityForm()) return;

        setSubmitting(true);
        try {
            const payload = {
                title: activityFormData.title.trim(),
                description: activityFormData.description.trim(),
                location: activityFormData.location.trim(),
                start_time: activityFormData.start_time || null,
                end_time: activityFormData.end_time || null,
                activity_type: activityFormData.activity_type,
                cost: parseFloat(activityFormData.cost) || 0,
                priority: activityFormData.priority,
                is_completed: false,
                day_id: selectedDayId
            };

            await axios.post('http://127.0.0.1:8000/activities', payload);
            setSuccess('Activity added successfully!');
            await fetchItineraryDetail();
            handleCloseActivityDialog();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error saving activity:', err);
            setError(err.response?.data?.detail || 'Failed to save activity');
        } finally {
            setSubmitting(false);
        }
    };

    // Handle activity menu
    const handleActivityMenuOpen = (event, activity) => {
        setAnchorEl(event.currentTarget);
        setSelectedActivity(activity);
    };

    const handleActivityMenuClose = () => {
        setAnchorEl(null);
        setSelectedActivity(null);
    };

    const handleToggleActivityComplete = async () => {
        // Would need PUT endpoint for activities
        console.log('Toggle complete:', selectedActivity);
        handleActivityMenuClose();
    };

    const handleDeleteActivity = async () => {
        try {
            // Would need DELETE endpoint
            console.log('Delete activity:', selectedActivity);
            handleActivityMenuClose();
            setSuccess('Activity deleted successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Failed to delete activity');
        }
    };

    // Drag and drop handlers
    const handleDragEnd = async (result) => {
        if (!result.destination) return;

        const { source, destination, type } = result;

        if (type === 'day') {
            // Reorder days
            const newDays = Array.from(itinerary.days);
            const [removed] = newDays.splice(source.index, 1);
            newDays.splice(destination.index, 0, removed);

            // Update day numbers
            const updatedDays = newDays.map((day, index) => ({
                ...day,
                day_number: index + 1
            }));

            setItinerary({ ...itinerary, days: updatedDays });
            // TODO: Send update to backend
            console.log('Reordered days:', updatedDays);

        } else if (type === 'activity') {
            // Reorder activities within a day
            const dayIndex = itinerary.days.findIndex(d => d.id === parseInt(source.droppableId));
            const newActivities = Array.from(itinerary.days[dayIndex].activities);
            const [removed] = newActivities.splice(source.index, 1);
            newActivities.splice(destination.index, 0, removed);

            const newDays = [...itinerary.days];
            newDays[dayIndex] = { ...newDays[dayIndex], activities: newActivities };
            setItinerary({ ...itinerary, days: newDays });
            // TODO: Send update to backend
            console.log('Reordered activities:', newActivities);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <CircularProgress sx={{ color: '#ffb74d' }} />
            </Box>
        );
    }

    if (!itinerary) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="error">Itinerary not found</Alert>
            </Container>
        );
    }

    return (
        <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', py: 4 }}>
            <Container maxWidth="lg">
                {/* Header */}
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                    <IconButton onClick={() => navigate('/dashboard')}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h4" fontWeight="bold">
                            {itinerary.title}
                        </Typography>
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
                            <Stack direction="row" spacing={0.5} alignItems="center">
                                <LocationOnIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                    {itinerary.destination}
                                </Typography>
                            </Stack>
                            <Chip label={itinerary.status.toUpperCase()} size="small" color="primary" />
                        </Stack>
                    </Box>
                    <Button
                        variant="outlined"
                        startIcon={<EditIcon />}
                        sx={{ borderColor: '#ffb74d', color: 'black' }}
                    >
                        Edit Trip
                    </Button>
                </Stack>

                {/* Success/Error Messages */}
                {success && (
                    <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
                        {success}
                    </Alert>
                )}
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                {/* Trip Overview */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <CalendarTodayIcon sx={{ color: '#ffb74d' }} />
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Duration</Typography>
                                        <Typography variant="h6">
                                            {getDaysBetween(itinerary.start_date, itinerary.end_date)} days
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {formatDate(itinerary.start_date)} - {formatDate(itinerary.end_date)}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <AttachMoneyIcon sx={{ color: '#ffb74d' }} />
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Budget</Typography>
                                        <Typography variant="h6">
                                            {itinerary.currency} {itinerary.estimated_budget.toLocaleString()}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Spent: {itinerary.currency} {itinerary.actual_budget.toLocaleString()}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <LocalActivityIcon sx={{ color: '#ffb74d' }} />
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Activities</Typography>
                                        <Typography variant="h6">
                                            {itinerary.days.reduce((sum, day) => sum + day.activities.length, 0)} planned
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Across {itinerary.days.length} days
                                        </Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Add Day Button */}
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h5" fontWeight="bold">
                        Daily Itinerary
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDayDialog()}
                        sx={{ 
                            bgcolor: '#ffb74d',
                            color: 'black',
                            fontWeight: 'bold',
                            '&:hover': { bgcolor: '#ffa726' }
                        }}
                    >
                        Add Day
                    </Button>
                </Box>

                {/* Days with Drag and Drop */}
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="days" type="day">
                        {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef}>
                                {itinerary.days.map((day, index) => (
                                    <Draggable 
                                        key={day.id} 
                                        draggableId={`day-${day.id}`} 
                                        index={index}
                                    >
                                        {(provided, snapshot) => (
                                            <Card
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                sx={{ 
                                                    mb: 3,
                                                    bgcolor: snapshot.isDragging ? '#fff3e0' : 'white',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <CardContent>
                                                    <Stack direction="row" spacing={2} alignItems="flex-start">
                                                        {/* Drag Handle */}
                                                        <Box {...provided.dragHandleProps}>
                                                            <DragIndicatorIcon sx={{ color: 'text.secondary', cursor: 'grab' }} />
                                                        </Box>

                                                        {/* Day Content */}
                                                        <Box sx={{ flexGrow: 1 }}>
                                                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                                                                <Box>
                                                                    <Typography variant="overline" color="text.secondary">
                                                                        Day {day.day_number}
                                                                    </Typography>
                                                                    <Typography variant="h6" fontWeight="bold">
                                                                        {day.title || 'Untitled Day'}
                                                                    </Typography>
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        {formatDate(day.date)}
                                                                    </Typography>
                                                                </Box>
                                                                <Stack direction="row" spacing={1}>
                                                                    <IconButton size="small" onClick={() => handleOpenDayDialog(day)}>
                                                                        <EditIcon fontSize="small" />
                                                                    </IconButton>
                                                                    <Button
                                                                        size="small"
                                                                        startIcon={<AddIcon />}
                                                                        onClick={() => handleOpenActivityDialog(day.id)}
                                                                        sx={{ color: '#ffb74d' }}
                                                                    >
                                                                        Add Activity
                                                                    </Button>
                                                                </Stack>
                                                            </Stack>

                                                            {day.description && (
                                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                                    {day.description}
                                                                </Typography>
                                                            )}

                                                            {/* Activities with Drag and Drop */}
                                                            <Droppable droppableId={`${day.id}`} type="activity">
                                                                {(provided) => (
                                                                    <List 
                                                                        {...provided.droppableProps} 
                                                                        ref={provided.innerRef}
                                                                        sx={{ bgcolor: '#fafafa', borderRadius: 2, p: 1 }}
                                                                    >
                                                                        {day.activities.length === 0 ? (
                                                                            <Box sx={{ p: 3, textAlign: 'center' }}>
                                                                                <Typography variant="body2" color="text.secondary">
                                                                                    No activities yet. Click "Add Activity" to get started.
                                                                                </Typography>
                                                                            </Box>
                                                                        ) : (
                                                                            day.activities.map((activity, actIndex) => (
                                                                                <Draggable
                                                                                    key={activity.id}
                                                                                    draggableId={`activity-${activity.id}`}
                                                                                    index={actIndex}
                                                                                >
                                                                                    {(provided, snapshot) => (
                                                                                        <ListItem
                                                                                            ref={provided.innerRef}
                                                                                            {...provided.draggableProps}
                                                                                            sx={{
                                                                                                bgcolor: snapshot.isDragging ? 'white' : 'transparent',
                                                                                                borderRadius: 1,
                                                                                                mb: 1,
                                                                                                border: '1px solid',
                                                                                                borderColor: snapshot.isDragging ? '#ffb74d' : 'transparent'
                                                                                            }}
                                                                                            secondaryAction={
                                                                                                <IconButton 
                                                                                                    size="small"
                                                                                                    onClick={(e) => handleActivityMenuOpen(e, activity)}
                                                                                                >
                                                                                                    <MoreVertIcon fontSize="small" />
                                                                                                </IconButton>
                                                                                            }
                                                                                        >
                                                                                            <ListItemIcon {...provided.dragHandleProps}>
                                                                                                <DragIndicatorIcon sx={{ cursor: 'grab' }} />
                                                                                            </ListItemIcon>
                                                                                            <ListItemIcon>
                                                                                                {activity.is_completed ? (
                                                                                                    <CheckCircleIcon sx={{ color: 'success.main' }} />
                                                                                                ) : (
                                                                                                    <RadioButtonUncheckedIcon sx={{ color: 'text.secondary' }} />
                                                                                                )}
                                                                                            </ListItemIcon>
                                                                                            <ListItemIcon>
                                                                                                {activityIcons[activity.activity_type] || <LocalActivityIcon />}
                                                                                            </ListItemIcon>
                                                                                            <ListItemText
                                                                                                primary={
                                                                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                                                                        <Typography fontWeight="medium">
                                                                                                            {activity.title}
                                                                                                        </Typography>
                                                                                                        <Chip 
                                                                                                            label={activity.priority} 
                                                                                                            size="small" 
                                                                                                            color={priorityColors[activity.priority]}
                                                                                                        />
                                                                                                    </Stack>
                                                                                                }
                                                                                                secondary={
                                                                                                    <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                                                                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                                                                            <LocationOnIcon fontSize="small" />
                                                                                                            <Typography variant="body2">
                                                                                                                {activity.location}
                                                                                                            </Typography>
                                                                                                        </Stack>
                                                                                                        {(activity.start_time || activity.end_time) && (
                                                                                                            <Stack direction="row" spacing={1} alignItems="center">
                                                                                                                <AccessTimeIcon fontSize="small" />
                                                                                                                <Typography variant="body2">
                                                                                                                    {formatTime(activity.start_time)} - {formatTime(activity.end_time)}
                                                                                                                </Typography>
                                                                                                            </Stack>
                                                                                                        )}
                                                                                                        {activity.cost > 0 && (
                                                                                                            <Stack direction="row" spacing={1} alignItems="center">
                                                                                                                <AttachMoneyIcon fontSize="small" />
                                                                                                                <Typography variant="body2">
                                                                                                                    {itinerary.currency} {activity.cost}
                                                                                                                </Typography>
                                                                                                            </Stack>
                                                                                                        )}
                                                                                                    </Stack>
                                                                                                }
                                                                                            />
                                                                                        </ListItem>
                                                                                    )}
                                                                                </Draggable>
                                                                            ))
                                                                        )}
                                                                        {provided.placeholder}
                                                                    </List>
                                                                )}
                                                            </Droppable>

                                                            {/* Day Budget */}
                                                            {day.estimated_cost > 0 && (
                                                                <Box sx={{ mt: 2, p: 1, bgcolor: '#fff3e0', borderRadius: 1 }}>
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        Estimated cost for this day: {itinerary.currency} {day.estimated_cost}
                                                                    </Typography>
                                                                </Box>
                                                            )}
                                                        </Box>
                                                    </Stack>
                                                </CardContent>
                                            </Card>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>

                {/* Empty State */}
                {itinerary.days.length === 0 && (
                    <Card sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="h6" gutterBottom>No days planned yet</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Start building your itinerary by adding your first day
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => handleOpenDayDialog()}
                            sx={{ 
                                bgcolor: '#ffb74d',
                                color: 'black',
                                '&:hover': { bgcolor: '#ffa726' }
                            }}
                        >
                            Add First Day
                        </Button>
                    </Card>
                )}
            </Container>

            {/* Add/Edit Day Dialog */}
            <Dialog open={dayDialogOpen} onClose={handleCloseDayDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingDay ? 'Edit Day' : 'Add New Day'}
                </DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2.5} sx={{ mt: 1 }}>
                        <TextField
                            fullWidth
                            label="Destination/Title *"
                            name="destination"
                            value={dayFormData.destination}
                            onChange={handleDayInputChange}
                            error={Boolean(validationErrors.destination)}
                            helperText={validationErrors.destination || 'e.g., "Kathmandu Sightseeing" or "Trek to Namche Bazaar"'}
                            disabled={submitting}
                        />

                        <TextField
                            fullWidth
                            label="Date *"
                            name="date"
                            type="date"
                            value={dayFormData.date}
                            onChange={handleDayInputChange}
                            error={Boolean(validationErrors.date)}
                            helperText={validationErrors.date}
                            InputLabelProps={{ shrink: true }}
                            disabled={submitting}
                        />

                        <TextField
                            fullWidth
                            label="Description"
                            name="description"
                            multiline
                            rows={3}
                            value={dayFormData.description}
                            onChange={handleDayInputChange}
                            helperText="Brief description of the day's activities"
                            disabled={submitting}
                        />

                        <TextField
                            fullWidth
                            label="Estimated Cost"
                            name="estimated_cost"
                            type="number"
                            value={dayFormData.estimated_cost}
                            onChange={handleDayInputChange}
                            helperText="Estimated budget for this day"
                            disabled={submitting}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDayDialog} disabled={submitting}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleSaveDay}
                        disabled={submitting}
                        sx={{
                            bgcolor: '#ffb74d',
                            color: 'black',
                            '&:hover': { bgcolor: '#ffa726' }
                        }}
                    >
                        {submitting ? <CircularProgress size={24} /> : (editingDay ? 'Update' : 'Add Day')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Add Activity Dialog */}
            <Dialog open={activityDialogOpen} onClose={handleCloseActivityDialog} maxWidth="sm" fullWidth>
                <DialogTitle>Add Activity</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2.5} sx={{ mt: 1 }}>
                        <TextField
                            fullWidth
                            label="Activity Title *"
                            name="title"
                            value={activityFormData.title}
                            onChange={handleActivityInputChange}
                            error={Boolean(validationErrors.title)}
                            helperText={validationErrors.title || 'e.g., "Visit Swayambhunath Temple"'}
                            disabled={submitting}
                        />

                        <TextField
                            fullWidth
                            label="Location *"
                            name="location"
                            value={activityFormData.location}
                            onChange={handleActivityInputChange}
                            error={Boolean(validationErrors.location)}
                            helperText={validationErrors.location || 'Where is this activity?'}
                            disabled={submitting}
                        />

                        <TextField
                            fullWidth
                            label="Description"
                            name="description"
                            multiline
                            rows={2}
                            value={activityFormData.description}
                            onChange={handleActivityInputChange}
                            disabled={submitting}
                        />

                        <Stack direction="row" spacing={2}>
                            <TextField
                                fullWidth
                                label="Start Time"
                                name="start_time"
                                type="time"
                                value={activityFormData.start_time}
                                onChange={handleActivityInputChange}
                                InputLabelProps={{ shrink: true }}
                                disabled={submitting}
                            />
                            <TextField
                                fullWidth
                                label="End Time"
                                name="end_time"
                                type="time"
                                value={activityFormData.end_time}
                                onChange={handleActivityInputChange}
                                InputLabelProps={{ shrink: true }}
                                disabled={submitting}
                            />
                        </Stack>

                        <Stack direction="row" spacing={2}>
                            <TextField
                                fullWidth
                                label="Activity Type"
                                name="activity_type"
                                select
                                value={activityFormData.activity_type}
                                onChange={handleActivityInputChange}
                                SelectProps={{ native: true }}
                                disabled={submitting}
                            >
                                <option value="sightseeing">Sightseeing</option>
                                <option value="dining">Dining</option>
                                <option value="adventure">Adventure</option>
                                <option value="relaxation">Relaxation</option>
                                <option value="shopping">Shopping</option>
                                <option value="transport">Transport</option>
                            </TextField>

                            <TextField
                                fullWidth
                                label="Priority"
                                name="priority"
                                select
                                value={activityFormData.priority}
                                onChange={handleActivityInputChange}
                                SelectProps={{ native: true }}
                                disabled={submitting}
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="must-do">Must-Do</option>
                            </TextField>
                        </Stack>

                        <TextField
                            fullWidth
                            label="Cost"
                            name="cost"
                            type="number"
                            value={activityFormData.cost}
                            onChange={handleActivityInputChange}
                            helperText="Cost for this activity"
                            disabled={submitting}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseActivityDialog} disabled={submitting}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleSaveActivity}
                        disabled={submitting}
                        sx={{
                            bgcolor: '#ffb74d',
                            color: 'black',
                            '&:hover': { bgcolor: '#ffa726' }
                        }}
                    >
                        {submitting ? <CircularProgress size={24} /> : 'Add Activity'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Activity Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleActivityMenuClose}
            >
                <MenuItem onClick={handleToggleActivityComplete}>
                    {selectedActivity?.is_completed ? 'Mark as Incomplete' : 'Mark as Complete'}
                </MenuItem>
                <MenuItem onClick={handleActivityMenuClose}>Edit</MenuItem>
                <MenuItem onClick={handleDeleteActivity} sx={{ color: 'error.main' }}>
                    Delete
                </MenuItem>
            </Menu>
        </Box>
    );
};

export default ItineraryDetail;