import React from 'react';
import { 
    Box, 
    Button, 
    Container, 
    Typography, 
    Stack
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import MapIcon from '@mui/icons-material/Map';
import GroupIcon from '@mui/icons-material/Group';
import CloudIcon from '@mui/icons-material/Cloud';

// --- NAVBAR COMPONENT ---
const Navbar = () => {
    const navigate = useNavigate();
    return (
        <Box sx={{ py: 2, bgcolor: 'white', boxShadow: 1, position: 'relative', zIndex: 10 }}>
            <Container maxWidth="lg">
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" fontWeight="bold" color="primary">
                        Smart Itinerary
                    </Typography>
                    <Stack direction="row" spacing={2}>
                        {/* Secondary Action: Simple Text Button */}
                        <Button color="inherit" onClick={() => navigate('/login')}>
                            Login
                        </Button>
                        
                        {/* Primary Action: BRAND ORANGE (Fixed to match Hero) */}
                        <Button 
                            variant="contained" 
                            onClick={() => navigate('/register')}
                            sx={{ 
                                bgcolor: '#ffb74d',     /* Matches Hero Button */
                                color: 'black',         /* High contrast text */
                                fontWeight: 'bold',
                                '&:hover': { bgcolor: '#ffa726' }
                            }}
                        >
                            Get Started
                        </Button>
                    </Stack>
                </Stack>
            </Container>
        </Box>
    );
};

// --- MAIN LANDING COMPONENT ---
const Landing = () => {
    const navigate = useNavigate();

    return (
        <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />
            
            {/* --- HERO SECTION --- */}
            <Box 
                sx={{ 
                    /* Background Image: Himalayas/Mountains */
                    backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url("https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=2071&auto=format&fit=crop")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    
                    minHeight: '60vh',
                    display: 'flex',
                    alignItems: 'center',
                    color: 'white',
                    mb: 0 /* No margin bottom, connects directly to white space below */
                }}
            >
                <Container maxWidth="md" sx={{ textAlign: 'center' }}>
                    <Typography 
                        variant="h2" 
                        component="h1" 
                        fontWeight="800" 
                        gutterBottom
                        sx={{ 
                            textShadow: '0px 2px 4px rgba(0,0,0,0.5)',
                            mb: 3 
                        }}
                    >
                        Plan Your Perfect <br />
                        <Box component="span" sx={{ color: '#ffb74d' }}>Adventure</Box>
                    </Typography>

                    <Typography 
                        variant="h5" 
                        paragraph 
                        sx={{ 
                            mb: 4, 
                            color: 'grey.300',
                            maxWidth: '800px',
                            mx: 'auto' 
                        }}
                    >
                        Collaborate, customize, and visualize your travel plans with real-time weather and community insights.
                    </Typography>

                    <Stack direction="row" spacing={2} justifyContent="center">
                        {/* Primary Hero Button: ORANGE */}
                        <Button 
                            variant="contained" 
                            size="large" 
                            onClick={() => navigate('/register')} 
                            sx={{ 
                                px: 4, 
                                py: 1.5,
                                fontSize: '1.1rem',
                                bgcolor: '#ffb74d',
                                color: 'black',
                                fontWeight: 'bold',
                                '&:hover': { bgcolor: '#ffa726' }
                            }}
                        >
                            Start Planning Free
                        </Button>
                        
                        {/* Secondary Hero Button: OUTLINED WHITE */}
                        <Button 
                            variant="outlined" 
                            size="large" 
                            onClick={() => navigate('/login')} 
                            sx={{ 
                                px: 4, 
                                py: 1.5,
                                fontSize: '1.1rem',
                                color: 'white',
                                borderColor: 'white',
                                '&:hover': { 
                                    borderColor: '#ffb74d', 
                                    color: '#ffb74d',
                                    bgcolor: 'rgba(0,0,0,0.4)'
                                }
                            }}
                        >
                            I have an account
                        </Button>
                    </Stack>
                </Container>
            </Box>

            {/* --- FEATURES SECTION --- */}
            <Container maxWidth="xl" sx={{ py: 6 }}>
                {/* Using the custom CSS class for perfect responsive layout */}
                <div className="features-container">
                    {[
                        { 
                            icon: <MapIcon fontSize="large"/>, 
                            title: "Interactive Maps", 
                            desc: "Visualize your route with integrated Google Maps." 
                        },
                        { 
                            icon: <GroupIcon fontSize="large"/>, 
                            title: "Community Driven", 
                            desc: "Get real-time updates on road conditions from locals." 
                        },
                        { 
                            icon: <CloudIcon fontSize="large"/>, 
                            title: "Real-Time Weather", 
                            desc: "Stay prepared with accurate forecasts for every destination." 
                        }
                    ].map((feature, index) => (
                        <div key={index} className="feature-card">
                            <Box sx={{ color: 'primary.main', mb: 2 }}>
                                {feature.icon}
                            </Box>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                {feature.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {feature.desc}
                            </Typography>
                        </div>
                    ))}
                </div>
            </Container>

            {/* --- FOOTER --- */}
            <Box sx={{ py: 3, textAlign: 'center', bgcolor: 'grey.200', mt: 'auto' }}>
                <Typography variant="body2" color="text.secondary">
                    © 2026 Smart Itinerary Planner. All rights reserved.
                </Typography>
            </Box>
        </Box>
    );
};

export default Landing;