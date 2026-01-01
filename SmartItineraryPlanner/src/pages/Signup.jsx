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
    CssBaseline
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const Signup = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Register Data:', formData);
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
                    
                    /* --- NEW IMAGE LINK (Trekkers on a mountain ridge) --- */
                    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url("https://images.unsplash.com/photo-1533130061792-64b345e4a833?q=80&w=2070&auto=format&fit=crop")`,
                    
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflowY: 'auto'
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
                                sx={{ alignSelf: 'flex-start', mb: 1, color: 'text.secondary' }}
                            >
                                Home
                            </Button>

                            <Typography component="h1" variant="h4" fontWeight="800" sx={{ mb: 4 }}>
                                Create Account
                            </Typography>
                            
                            {/* Description text is removed as requested */}

                            <Box component="form" noValidate onSubmit={handleSubmit} sx={{ width: '100%' }}>
                                <Stack spacing={2}>
                                    
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
                                        />
                                        <TextField
                                            required
                                            fullWidth
                                            id="lastName"
                                            label="Last Name"
                                            name="lastName"
                                            value={formData.lastName}
                                            onChange={handleChange}
                                        />
                                    </Stack>

                                    <TextField
                                        required
                                        fullWidth
                                        id="email"
                                        label="Email Address"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />

                                    <TextField
                                        required
                                        fullWidth
                                        name="password"
                                        label="Password"
                                        type="password"
                                        id="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                    />

                                    <Button
                                        type="submit"
                                        fullWidth
                                        variant="contained"
                                        size="large"
                                        sx={{ 
                                            mt: 2,
                                            py: 1.5,
                                            fontSize: '1rem',
                                            bgcolor: '#ffb74d',
                                            color: 'black',
                                            fontWeight: 'bold',
                                            '&:hover': { bgcolor: '#ffa726' }
                                        }}
                                    >
                                        Sign Up
                                    </Button>
                                </Stack>
                                
                                <Stack direction="row" spacing={0.5} justifyContent="center" sx={{ mt: 3 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Already have an account?
                                    </Typography>
                                    <Link 
                                        component="button"
                                        variant="body2"
                                        onClick={() => navigate('/login')}
                                        sx={{ fontWeight: 'bold', textDecoration: 'none', color: '#ef6c00' }}
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