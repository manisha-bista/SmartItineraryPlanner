import React, { useState } from 'react';
import { 
    Button, 
    TextField, 
    Typography, 
    Paper,
    Link,
    Box,
    Stack,
    Container,
    CssBaseline,
    Alert,
    InputAdornment,
    IconButton,
    CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';

const Signup = () => {
    const navigate = useNavigate();
    
    // Form state
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    // UI states
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    // Validation errors
    const [validationErrors, setValidationErrors] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        
        // Clear errors when user types
        if (error) setError('');
        if (validationErrors[name]) {
            setValidationErrors({ ...validationErrors, [name]: '' });
        }
    };

    // Toggle password visibility
    const handleClickShowPassword = () => setShowPassword((show) => !show);
    const handleClickShowConfirmPassword = () => setShowConfirmPassword((show) => !show);

    // Client-side validation
    const validateForm = () => {
        const errors = {};
        let isValid = true;

        // First Name validation
        if (!formData.firstName.trim()) {
            errors.firstName = 'First name is required';
            isValid = false;
        } else if (formData.firstName.trim().length < 2) {
            errors.firstName = 'First name must be at least 2 characters';
            isValid = false;
        }

        // Last Name validation
        if (!formData.lastName.trim()) {
            errors.lastName = 'Last name is required';
            isValid = false;
        } else if (formData.lastName.trim().length < 2) {
            errors.lastName = 'Last name must be at least 2 characters';
            isValid = false;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) {
            errors.email = 'Email is required';
            isValid = false;
        } else if (!emailRegex.test(formData.email)) {
            errors.email = 'Please enter a valid email address';
            isValid = false;
        }

        // Password validation
        if (!formData.password) {
            errors.password = 'Password is required';
            isValid = false;
        } else if (formData.password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
            isValid = false;
        }

        // Confirm Password validation
        if (!formData.confirmPassword) {
            errors.confirmPassword = 'Please confirm your password';
            isValid = false;
        } else if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
            isValid = false;
        }

        setValidationErrors(errors);
        return isValid;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Clear previous errors
        setError('');
        
        // Validate form
        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            // Prepare data for backend
            const payload = {
                name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
                email: formData.email.trim().toLowerCase(),
                password: formData.password
            };

            // Send to FastAPI backend
            const response = await axios.post('http://127.0.0.1:8000/register', payload, {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 10000 // 10 second timeout
            });

            console.log('Registration Success:', response.data);

            // Store user data (optional - you might want to store token here)
            if (response.data.id) {
                localStorage.setItem('userId', response.data.id);
                localStorage.setItem('userName', response.data.name);
                localStorage.setItem('userEmail', response.data.email);
            }

            // Navigate to dashboard on success
            navigate('/dashboard', { replace: true });

        } catch (err) {
            console.error('Registration Error:', err);
            
            // Handle different types of errors
            if (err.code === 'ECONNABORTED') {
                setError('Request timeout. Please check your connection and try again.');
            } else if (err.code === 'ERR_NETWORK') {
                setError('Cannot connect to server. Please make sure the backend is running on http://127.0.0.1:8000');
            } else if (err.response) {
                // Server responded with error
                if (err.response.status === 400) {
                    setError(err.response.data.detail || 'Email already registered. Please use a different email.');
                } else if (err.response.status === 422) {
                    setError('Invalid input data. Please check your information.');
                } else if (err.response.status >= 500) {
                    setError('Server error. Please try again later.');
                } else {
                    setError(err.response.data.detail || 'Registration failed. Please try again.');
                }
            } else {
                setError('An unexpected error occurred. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <CssBaseline />
            <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh' }}>
                <Container maxWidth="md" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', py: 4 }}>
                    <Box sx={{ 
                        display: 'grid', 
                        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
                        gap: 0, 
                        width: '100%', 
                        alignItems: 'stretch'
                    }}>
                        
                        {/* Left Side - Image */}
                        <Box
                            sx={{
                                display: { xs: 'none', md: 'flex' },
                                borderRadius: '10px',
                                overflow: 'hidden',
                                boxShadow: 3,
                                maxHeight: '90vh'
                            }}
                        >
                            <Box
                                component="img"
                                src="https://images.unsplash.com/photo-1765784607434-69bfa9f53b4b"
                                alt="Temple with prayer flags"
                                sx={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                }}
                            />
                        </Box>

                        {/* Right Side - Form */}
                        <Paper 
                            elevation={0}
                            sx={{ 
                                p: 4,
                                bgcolor: 'white',
                                width: '100%',
                                maxHeight: '90vh',
                                overflow: 'auto'
                            }}
                        >
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                <Typography component="h1" variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                                    Create Your Account
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    To explore exciting travel destination and adventures
                                </Typography>

                                {/* Error Alert */}
                                {error && (
                                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                                        {error}
                                    </Alert>
                                )}

                                <Box component="form" noValidate onSubmit={handleSubmit} sx={{ width: '100%' }}>
                                    <Stack spacing={2}>
                                        
                                        {/* Name Fields */}
                                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                            <TextField
                                                name="firstName"
                                                required
                                                fullWidth
                                                id="firstName"
                                                placeholder="Full Name"
                                                autoFocus
                                                value={formData.firstName}
                                                onChange={handleChange}
                                                error={Boolean(validationErrors.firstName)}
                                                helperText={validationErrors.firstName}
                                                disabled={loading}
                                                inputProps={{ maxLength: 50 }}
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <PersonIcon sx={{ color: 'text.secondary' }} />
                                                        </InputAdornment>
                                                    ),
                                                }}
                                            />
                                            <TextField
                                                required
                                                fullWidth
                                                id="lastName"
                                                placeholder="Last Name"
                                                name="lastName"
                                                value={formData.lastName}
                                                onChange={handleChange}
                                                error={Boolean(validationErrors.lastName)}
                                                helperText={validationErrors.lastName}
                                                disabled={loading}
                                                inputProps={{ maxLength: 50 }}
                                            />
                                        </Stack>

                                        {/* Email Field */}
                                        <TextField
                                            required
                                            fullWidth
                                            id="email"
                                            placeholder="Email Address"
                                            name="email"
                                            autoComplete="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            error={Boolean(validationErrors.email)}
                                            helperText={validationErrors.email}
                                            disabled={loading}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <EmailIcon sx={{ color: 'text.secondary' }} />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />

                                        {/* Password Field */}
                                        <TextField
                                            required
                                            fullWidth
                                            name="password"
                                            placeholder="Enter Your Password"
                                            type={showPassword ? 'text' : 'password'}
                                            id="password"
                                            autoComplete="new-password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            error={Boolean(validationErrors.password)}
                                            helperText={validationErrors.password || 'Must be at least 6 characters'}
                                            disabled={loading}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <LockIcon sx={{ color: 'text.secondary' }} />
                                                    </InputAdornment>
                                                ),
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <IconButton
                                                            aria-label="toggle password visibility"
                                                            onClick={handleClickShowPassword}
                                                            edge="end"
                                                            disabled={loading}
                                                        >
                                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                                        </IconButton>
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />

                                        {/* Confirm Password Field */}
                                        <TextField
                                            required
                                            fullWidth
                                            name="confirmPassword"
                                            placeholder="Confirm Password"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            id="confirmPassword"
                                            autoComplete="new-password"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            error={Boolean(validationErrors.confirmPassword)}
                                            helperText={validationErrors.confirmPassword}
                                            disabled={loading}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <LockIcon sx={{ color: 'text.secondary' }} />
                                                    </InputAdornment>
                                                ),
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <IconButton
                                                            aria-label="toggle confirm password visibility"
                                                            onClick={handleClickShowConfirmPassword}
                                                            edge="end"
                                                            disabled={loading}
                                                        >
                                                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                                        </IconButton>
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />

                                        {/* Submit Button */}
                                        <Button
                                            type="submit"
                                            fullWidth
                                            variant="contained"
                                            size="large"
                                            disabled={loading}
                                            sx={{ 
                                                mt: 1,
                                                py: 1.5,
                                                fontSize: '1rem',
                                                bgcolor: '#ffb74d',
                                                color: 'black',
                                                fontWeight: 'bold',
                                                '&:hover': { bgcolor: '#ffa726' },
                                                '&:disabled': { 
                                                    bgcolor: 'grey.300',
                                                    color: 'grey.600'
                                                }
                                            }}
                                        >
                                            {loading ? (
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <CircularProgress size={20} color="inherit" />
                                                    <span>Creating Account...</span>
                                                </Stack>
                                            ) : (
                                                'Sign Up'
                                            )}
                                        </Button>
                                    </Stack>
                                    
                                    {/* Divider with "Or" text */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
                                        <Box sx={{ flexGrow: 1, height: '1px', bgcolor: 'divider' }} />
                                        <Typography variant="body2" sx={{ mx: 2, color: 'text.secondary' }}>
                                            Or
                                        </Typography>
                                        <Box sx={{ flexGrow: 1, height: '1px', bgcolor: 'divider' }} />
                                    </Box>

                                    {/* Google Sign Up Button */}
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        disabled={loading}
                                        startIcon={
                                            <Box
                                                component="img"
                                                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                                                alt="Google"
                                                sx={{ width: 20, height: 20 }}
                                            />
                                        }
                                        sx={{
                                            py: 1.5,
                                            borderColor: 'divider',
                                            color: 'text.primary',
                                            textTransform: 'none',
                                            fontSize: '1rem',
                                            '&:hover': {
                                                borderColor: 'primary.main',
                                                bgcolor: 'grey.50'
                                            }
                                        }}
                                    >
                                        Continue With Google
                                    </Button>
                                    
                                    <Box sx={{ textAlign: 'center', mt: 2 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Already Have an Account?{' '}
                                            <Link
                                                component="button"
                                                type="button"
                                                onClick={() => navigate('/login')}
                                                sx={{
                                                    fontWeight: 'bold',
                                                    textDecoration: 'underline',
                                                    color: 'text.primary',
                                                    '&:hover': { color: 'primary.main' }
                                                }}
                                                disabled={loading}
                                            >
                                                Sign In
                                            </Link>
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Paper>
                    </Box>
                </Container>
            </Box>
        </>
    );
};

export default Signup;