import React, { useState } from 'react';
import { 
    Box, 
    Button, 
    TextField, 
    Typography, 
    Link,
    Alert,
    CircularProgress,
    InputAdornment,
    IconButton,
    Stack,
    GlobalStyles
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const COLORS = {
    brand: '#33CCCC',
    background: '#141627',
    cardPrimary: '#1e2140',
    inputBg: '#252845',
    headings: '#B0D2EB',
    text: '#D0D2EB',
    fadedText: '#7B809A',
    error: '#ff6b6b',
};

const inputSx = {
    '& .MuiOutlinedInput-root': {
        bgcolor: COLORS.inputBg,
        borderRadius: 2,
        color: COLORS.text,
        fontSize: '0.9rem',
        '& fieldset': { borderColor: 'transparent' },
        '&:hover fieldset': { borderColor: COLORS.brand },
        '&.Mui-focused fieldset': { borderColor: COLORS.brand, borderWidth: 1.5 },
        '& .MuiInputAdornment-root svg': { fontSize: 18, color: COLORS.fadedText },
    },
    '& .MuiInputBase-input': { py: 1.5 },
    '& .MuiInputBase-input::placeholder': { color: COLORS.fadedText, opacity: 1 },
    '& .MuiFormHelperText-root': { color: COLORS.error, mx: 0, mt: 0.5 },
};

const Signup = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        firstName: '', lastName: '', email: '', password: '', confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [validationErrors, setValidationErrors] = useState({
        firstName: '', lastName: '', email: '', password: '', confirmPassword: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (error) setError('');
        if (validationErrors[name]) setValidationErrors({ ...validationErrors, [name]: '' });
    };

    const validateForm = () => {
        const errors = {};
        let isValid = true;
        if (!formData.firstName.trim()) { errors.firstName = 'First name is required'; isValid = false; }
        else if (formData.firstName.trim().length < 2) { errors.firstName = 'Must be at least 2 characters'; isValid = false; }
        if (!formData.lastName.trim()) { errors.lastName = 'Last name is required'; isValid = false; }
        else if (formData.lastName.trim().length < 2) { errors.lastName = 'Must be at least 2 characters'; isValid = false; }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) { errors.email = 'Email is required'; isValid = false; }
        else if (!emailRegex.test(formData.email)) { errors.email = 'Please enter a valid email'; isValid = false; }
        if (!formData.password) { errors.password = 'Password is required'; isValid = false; }
        else if (formData.password.length < 6) { errors.password = 'Must be at least 6 characters'; isValid = false; }
        if (!formData.confirmPassword) { errors.confirmPassword = 'Please confirm your password'; isValid = false; }
        else if (formData.password !== formData.confirmPassword) { errors.confirmPassword = 'Passwords do not match'; isValid = false; }
        setValidationErrors(errors);
        return isValid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!validateForm()) return;
        setLoading(true);
        try {
            const payload = {
                name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
                email: formData.email.trim().toLowerCase(),
                password: formData.password
            };
            const response = await axios.post('http://127.0.0.1:8000/register', payload, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
            });
            if (response.data.id) {
                localStorage.setItem('userId', response.data.id);
                localStorage.setItem('userName', response.data.name);
                localStorage.setItem('userEmail', response.data.email);
            }
            navigate('/dashboard', { replace: true });
        } catch (err) {
            if (err.code === 'ECONNABORTED') setError('Request timeout. Please check your connection.');
            else if (err.code === 'ERR_NETWORK') setError('Cannot connect to server. Please make sure the backend is running.');
            else if (err.response?.status === 409) setError('An account with this email already exists.');
            else if (err.response?.status === 422) setError('Invalid input data. Please check your information.');
            else if (err.response?.status >= 500) setError('Server error. Please try again later.');
            else setError(err.response?.data?.detail || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ display: 'flex', height: '100vh', bgcolor: COLORS.background, overflow: 'hidden' }}>
            <GlobalStyles styles={{ 'html, body, #root': { margin: 0, padding: 0, background: COLORS.background } }} />

            {/* Left — Full height image */}
            <Box sx={{
                display: { xs: 'none', md: 'block' },
                width: '50%',
                flexShrink: 0,
                position: 'relative',
                overflow: 'hidden',
                alignSelf: 'stretch',
            }}>
                <Box
                    component="img"
                    src="https://images.unsplash.com/photo-1660990983694-b0a200676520?w=900&q=85"
                    alt="Nepal prayer flags"
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center',
                        display: 'block',
                    }}
                />
            </Box>

            {/* Right — Form */}
            <Box sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                px: { xs: 4, md: 7 },
                py: 4,
                overflowY: 'auto',
            }}>
                <Box sx={{ maxWidth: 360, width: '100%', mx: 'auto' }}>

                    <Typography variant="h4" fontWeight={800} sx={{ color: COLORS.headings, mb: 0.75 }}>
                        Create Your Account
                    </Typography>
                    <Typography variant="body2" sx={{ color: COLORS.fadedText, mb: 4, lineHeight: 1.6 }}>
                        To explore exciting travel destination and adventures
                    </Typography>

                    {error && (
                        <Alert
                            severity="error"
                            onClose={() => setError('')}
                            sx={{
                                mb: 3,
                                bgcolor: 'rgba(255,107,107,0.1)',
                                color: COLORS.error,
                                borderRadius: 2,
                                border: '1px solid rgba(255,107,107,0.25)',
                                '& .MuiAlert-icon': { color: COLORS.error },
                                fontSize: '0.85rem',
                            }}
                        >
                            {error}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit}>
                        <Stack spacing={1.5}>

                            {/* Full Name row (first + last side by side) */}
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                                <TextField
                                    required fullWidth
                                    name="firstName" placeholder="First Name"
                                    autoComplete="given-name" autoFocus
                                    value={formData.firstName} onChange={handleChange}
                                    error={Boolean(validationErrors.firstName)}
                                    helperText={validationErrors.firstName}
                                    disabled={loading}
                                    sx={inputSx}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <PersonIcon />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                                <TextField
                                    required fullWidth
                                    name="lastName" placeholder="Last Name"
                                    autoComplete="family-name"
                                    value={formData.lastName} onChange={handleChange}
                                    error={Boolean(validationErrors.lastName)}
                                    helperText={validationErrors.lastName}
                                    disabled={loading}
                                    sx={inputSx}
                                />
                            </Box>

                            <TextField
                                required fullWidth
                                name="email" placeholder="Email Address"
                                autoComplete="email" type="email"
                                value={formData.email} onChange={handleChange}
                                error={Boolean(validationErrors.email)}
                                helperText={validationErrors.email}
                                disabled={loading}
                                sx={inputSx}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <EmailIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            <TextField
                                required fullWidth
                                name="password" placeholder="Enter Your Password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="new-password"
                                value={formData.password} onChange={handleChange}
                                error={Boolean(validationErrors.password)}
                                helperText={validationErrors.password}
                                disabled={loading}
                                sx={inputSx}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <LockIcon />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowPassword(s => !s)}
                                                disabled={loading}
                                                sx={{ color: COLORS.fadedText, p: 0.5, '&:hover': { color: COLORS.brand } }}
                                            >
                                                {showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            <TextField
                                required fullWidth
                                name="confirmPassword" placeholder="Confirm Password"
                                type={showConfirmPassword ? 'text' : 'password'}
                                autoComplete="new-password"
                                value={formData.confirmPassword} onChange={handleChange}
                                error={Boolean(validationErrors.confirmPassword)}
                                helperText={validationErrors.confirmPassword}
                                disabled={loading}
                                sx={inputSx}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <LockIcon />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowConfirmPassword(s => !s)}
                                                disabled={loading}
                                                sx={{ color: COLORS.fadedText, p: 0.5, '&:hover': { color: COLORS.brand } }}
                                            >
                                                {showConfirmPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            {/* Sign Up Button */}
                            <Button
                                type="submit" fullWidth variant="contained"
                                disabled={loading}
                                sx={{
                                    py: 1.4,
                                    mt: 0.5,
                                    bgcolor: COLORS.brand,
                                    color: COLORS.background,
                                    fontWeight: 700,
                                    fontSize: '0.95rem',
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    boxShadow: 'none',
                                    letterSpacing: 0.3,
                                    transition: 'all 0.25s',
                                    '&:hover': {
                                        bgcolor: '#2db8b8',
                                        boxShadow: '0 4px 16px rgba(51,204,204,0.35)',
                                        transform: 'translateY(-1px)',
                                    },
                                    '&:disabled': { bgcolor: 'rgba(51,204,204,0.25)', color: COLORS.fadedText }
                                }}
                            >
                                {loading ? (
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <CircularProgress size={16} sx={{ color: COLORS.background }} />
                                        <span>Creating Account...</span>
                                    </Stack>
                                ) : 'Sign Up'}
                            </Button>

                            {/* Google Button */}
                            <Button
                                fullWidth variant="contained"
                                disabled={loading}
                                startIcon={
                                    <Box component="img"
                                        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                                        alt="Google" sx={{ width: 18, height: 18 }}
                                    />
                                }
                                sx={{
                                    py: 1.4,
                                    bgcolor: COLORS.inputBg,
                                    color: COLORS.text,
                                    textTransform: 'none',
                                    fontSize: '0.9rem',
                                    borderRadius: 2,
                                    boxShadow: 'none',
                                    fontWeight: 500,
                                    '&:hover': { bgcolor: '#2e3355', boxShadow: 'none' }
                                }}
                            >
                                Continue With Google
                            </Button>
                        </Stack>

                        <Box sx={{ textAlign: 'center', mt: 3 }}>
                            <Typography variant="body2" sx={{ color: COLORS.fadedText, fontSize: '0.85rem' }}>
                                Already Have an Account?{' '}
                                <Link
                                    component="button" type="button"
                                    onClick={() => navigate('/login')}
                                    disabled={loading}
                                    sx={{
                                        color: COLORS.text,
                                        fontWeight: 600,
                                        textDecoration: 'underline',
                                        textDecorationColor: COLORS.fadedText,
                                        '&:hover': { color: COLORS.brand, textDecorationColor: COLORS.brand }
                                    }}
                                >
                                    Sign In
                                </Link>
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default Signup;