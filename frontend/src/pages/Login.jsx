import React, { useState } from 'react';
import { 
    Box, 
    Button, 
    Container, 
    TextField, 
    Typography, 
    Paper,
    Link,
    Alert,
    CircularProgress,
    InputAdornment,
    IconButton,
    Stack
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
    const navigate = useNavigate();
    
    // State for form data
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    // UI States
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
    // Validation errors
    const [validationErrors, setValidationErrors] = useState({
        email: '',
        password: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        
        // Clear error when user starts typing
        if (error) setError('');
        if (validationErrors[name]) {
            setValidationErrors({ ...validationErrors, [name]: '' });
        }
    };

    const handleClickShowPassword = () => setShowPassword((show) => !show);

    // Client-side validation
    const validateForm = () => {
        const errors = {};
        let isValid = true;

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
        }

        setValidationErrors(errors);
        return isValid;
    };

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
                email: formData.email.trim().toLowerCase(),
                password: formData.password
            };

            // Send login request
            const response = await axios.post('http://127.0.0.1:8000/login', payload, {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 10000 // 10 second timeout
            });

            console.log('Login Success:', response.data);

            // Store user data
            if (response.data.id) {
                localStorage.setItem('userId', response.data.id);
                localStorage.setItem('userName', response.data.name);
                localStorage.setItem('userEmail', response.data.email);
            }

            // Navigate to dashboard
            navigate('/dashboard', { replace: true }); 

        } catch (err) {
            console.error('Login Error:', err);
            
            // Handle different types of errors
            if (err.code === 'ECONNABORTED') {
                setError('Request timeout. Please check your connection and try again.');
            } else if (err.code === 'ERR_NETWORK') {
                setError('Cannot connect to server. Please make sure the backend is running on http://127.0.0.1:8000');
            } else if (err.response) {
                // Server responded with error
                if (err.response.status === 401) {
                    setError('Invalid email or password. Please try again.');
                } else if (err.response.status === 422) {
                    setError('Invalid input data. Please check your information.');
                } else if (err.response.status >= 500) {
                    setError('Server error. Please try again later.');
                } else {
                    setError(err.response.data.detail || 'Login failed. Please try again.');
                }
            } else {
                setError('An unexpected error occurred. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
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
                            src="https://images.unsplash.com/photo-1720810757170-c2bd2c6ed335"
                            alt="Mountain landscape"
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
                            p: 5,
                            display: 'flex', 
                            flexDirection: 'column',
                            bgcolor: 'white',
                            width: '100%',
                            maxHeight: '90vh',
                            overflow: 'auto'
                        }}
                    >
                        <Typography component="h1" variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                            Welcome Back !
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                            To explore exciting travel destination and adventures
                        </Typography>

                        {/* Error Alert */}
                        {error && (
                            <Alert severity="error" sx={{ width: '100%', mb: 2 }} onClose={() => setError('')}>
                                {error}
                            </Alert>
                        )}

                        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="email"
                                placeholder="Email Address"
                                name="email"
                                autoComplete="email"
                                autoFocus
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
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="password"
                                placeholder="Enter Your Password"
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                autoComplete="current-password"
                                value={formData.password}
                                onChange={handleChange}
                                error={Boolean(validationErrors.password)}
                                helperText={validationErrors.password}
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
                            
                            {/* Forgot Password Link */}
                            <Box sx={{ textAlign: 'right', mt: -1, mb: 1 }}>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: 'text.secondary',
                                        cursor: 'not-allowed',
                                        fontSize: '0.875rem'
                                    }}
                                >
                                    Forgot Password?
                                </Typography>
                            </Box>
                            
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                disabled={loading}
                                sx={{ 
                                    mt: 3, 
                                    mb: 2, 
                                    py: 1.5,
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
                                        <span>Signing In...</span>
                                    </Stack>
                                ) : (
                                    "Sign In"
                                )}
                            </Button>
                            
                            {/* Divider with "Or" text */}
                            <Box sx={{ display: 'flex', alignItems: 'center', my: 3 }}>
                                <Box sx={{ flexGrow: 1, height: '1px', bgcolor: 'divider' }} />
                                <Typography variant="body2" sx={{ mx: 2, color: 'text.secondary' }}>
                                    Or
                                </Typography>
                                <Box sx={{ flexGrow: 1, height: '1px', bgcolor: 'divider' }} />
                            </Box>

                            {/* Google Sign In Button */}
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
                            
                            <Box sx={{ textAlign: 'center', mt: 3 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Don't Have an Account?{' '}
                                    <Link
                                        component="button"
                                        type="button"
                                        onClick={() => navigate('/register')}
                                        sx={{
                                            fontWeight: 'bold',
                                            textDecoration: 'underline',
                                            color: 'text.primary',
                                            '&:hover': { color: 'primary.main' }
                                        }}
                                        disabled={loading}
                                    >
                                        Sign Up
                                    </Link>
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>
                </Box>
            </Container>
        </Box>
    );
};

export default Login;