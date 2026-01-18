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
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

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
            <Box 
                sx={{ 
                    position: 'fixed',
                    top: 0, 
                    left: 0, 
                    width: '100vw', 
                    height: '100vh',
                    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url("https://images.unsplash.com/photo-1533130061792-64b345e4a833?q=80&w=2070&auto=format&fit=crop")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflowY: 'auto',
                    py: 4
                }}
            >
                <Container maxWidth="sm">
                    <Paper 
                        elevation={12} 
                        sx={{ 
                            p: 4, 
                            borderRadius: 3,
                            bgcolor: 'rgba(255, 255, 255, 0.95)', 
                            backdropFilter: 'blur(4px)'
                        }}
                    >
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            
                            <Button 
                                startIcon={<ArrowBackIcon />} 
                                onClick={() => navigate('/')}
                                sx={{ 
                                    alignSelf: 'flex-start', 
                                    mb: 1, 
                                    color: 'text.secondary',
                                    '&:hover': { bgcolor: 'rgba(0,0,0,0.05)' }
                                }}
                            >
                                Home
                            </Button>

                            <Typography component="h1" variant="h4" fontWeight="800" sx={{ mb: 1 }}>
                                Create Account
                            </Typography>
                            
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Join us to start planning your adventures
                            </Typography>
                            
                            {/* Error Alert */}
                            {error && (
                                <Alert severity="error" sx={{ width: '100%', mb: 3 }} onClose={() => setError('')}>
                                    {error}
                                </Alert>
                            )}

                            <Box component="form" noValidate onSubmit={handleSubmit} sx={{ width: '100%' }}>
                                <Stack spacing={2.5}>
                                    
                                    {/* Name Fields */}
                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                        <TextField
                                            name="firstName"
                                            required
                                            fullWidth
                                            id="firstName"
                                            label="First Name"
                                            autoFocus
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            error={Boolean(validationErrors.firstName)}
                                            helperText={validationErrors.firstName}
                                            disabled={loading}
                                            inputProps={{ maxLength: 50 }}
                                        />
                                        <TextField
                                            required
                                            fullWidth
                                            id="lastName"
                                            label="Last Name"
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
                                        label="Email Address"
                                        name="email"
                                        autoComplete="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        error={Boolean(validationErrors.email)}
                                        helperText={validationErrors.email}
                                        disabled={loading}
                                    />

                                    {/* Password Field */}
                                    <TextField
                                        required
                                        fullWidth
                                        name="password"
                                        label="Password"
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        autoComplete="new-password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        error={Boolean(validationErrors.password)}
                                        helperText={validationErrors.password || 'Must be at least 6 characters'}
                                        disabled={loading}
                                        InputProps={{
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
                                        label="Confirm Password"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        id="confirmPassword"
                                        autoComplete="new-password"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        error={Boolean(validationErrors.confirmPassword)}
                                        helperText={validationErrors.confirmPassword}
                                        disabled={loading}
                                        InputProps={{
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
                                            mt: 2,
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
                                
                                {/* Login Link */}
                                <Stack direction="row" spacing={0.5} justifyContent="center" sx={{ mt: 3 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Already have an account?
                                    </Typography>
                                    <Link 
                                        component="button"
                                        variant="body2"
                                        type="button"
                                        onClick={() => navigate('/login')}
                                        sx={{ 
                                            fontWeight: 'bold', 
                                            textDecoration: 'none', 
                                            color: '#ef6c00',
                                            '&:hover': { textDecoration: 'underline' }
                                        }}
                                        disabled={loading}
                                    >
                                        Log in
                                    </Link>
                                </Stack>
                            </Box>
                        </Box>
                    </Paper>
                </Container>
            </Box>
        </>
    );
};

export default Signup;