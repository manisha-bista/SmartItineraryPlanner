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
        <Box 
            sx={{ 
                backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.7)), url("https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=2071&auto=format&fit=crop")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                py: 4
            }}
        >
            <Container maxWidth="xs">
                <Paper 
                    elevation={6} 
                    sx={{ 
                        p: 4, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center',
                        borderRadius: 3,
                        bgcolor: 'rgba(255, 255, 255, 0.95)'
                    }}
                >
                    <Typography component="h1" variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
                        Welcome Back
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Login to continue your adventure
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
                            label="Email Address"
                            name="email"
                            autoComplete="email"
                            autoFocus
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            error={Boolean(validationErrors.email)}
                            helperText={validationErrors.email}
                            disabled={loading}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            autoComplete="current-password"
                            value={formData.password}
                            onChange={handleChange}
                            error={Boolean(validationErrors.password)}
                            helperText={validationErrors.password}
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
                        
                        <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Link 
                                component="button"
                                variant="body2" 
                                type="button"
                                onClick={() => navigate('/register')}
                                sx={{ 
                                    textDecoration: 'none', 
                                    color: 'primary.main', 
                                    fontWeight: 'bold',
                                    '&:hover': { textDecoration: 'underline' }
                                }}
                                disabled={loading}
                            >
                                Don't have an account? Sign Up
                            </Link>
                            
                            <Link 
                                component="button"
                                variant="caption" 
                                type="button"
                                onClick={() => navigate('/')}
                                sx={{ 
                                    textDecoration: 'none', 
                                    color: 'grey.600',
                                    '&:hover': { textDecoration: 'underline' }
                                }}
                                disabled={loading}
                            >
                                ← Back to Home
                            </Link>
                        </Box>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default Login;