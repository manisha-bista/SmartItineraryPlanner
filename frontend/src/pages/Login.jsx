// // // import React, { useState } from 'react';
// // // import { 
// // //     Box, 
// // //     Button, 
// // //     TextField, 
// // //     Typography, 
// // //     Link,
// // //     Alert,
// // //     CircularProgress,
// // //     InputAdornment,
// // //     IconButton,
// // //     Stack,
// // //     GlobalStyles
// // // } from '@mui/material';
// // // import { Visibility, VisibilityOff } from '@mui/icons-material';
// // // import EmailIcon from '@mui/icons-material/Email';
// // // import LockIcon from '@mui/icons-material/Lock';
// // // import { useNavigate } from 'react-router-dom';
// // // import axios from 'axios';

// // // const COLORS = {
// // //     brand: '#33CCCC',
// // //     background: '#141627',
// // //     cardPrimary: '#1e2140',
// // //     inputBg: '#252845',
// // //     headings: '#B0D2EB',
// // //     text: '#D0D2EB',
// // //     fadedText: '#7B809A',
// // //     error: '#ff6b6b',
// // // };

// // // const inputSx = {
// // //     '& .MuiOutlinedInput-root': {
// // //         bgcolor: COLORS.inputBg,
// // //         borderRadius: 2,
// // //         color: COLORS.text,
// // //         fontSize: '0.9rem',
// // //         '& fieldset': { borderColor: 'transparent' },
// // //         '&:hover fieldset': { borderColor: COLORS.brand },
// // //         '&.Mui-focused fieldset': { borderColor: COLORS.brand, borderWidth: 1.5 },
// // //         '& .MuiInputAdornment-root svg': { fontSize: 18, color: COLORS.fadedText },
// // //     },
// // //     '& .MuiInputBase-input': { py: 1.5 },
// // //     '& .MuiInputBase-input::placeholder': { color: COLORS.fadedText, opacity: 1 },
// // //     '& .MuiFormHelperText-root': { color: COLORS.error, mx: 0, mt: 0.5 },
// // // };

// // // const Login = () => {
// // //     const navigate = useNavigate();

// // //     const [formData, setFormData] = useState({ email: '', password: '' });
// // //     const [loading, setLoading] = useState(false);
// // //     const [error, setError] = useState('');
// // //     const [showPassword, setShowPassword] = useState(false);
// // //     const [validationErrors, setValidationErrors] = useState({ email: '', password: '' });

// // //     const handleChange = (e) => {
// // //         const { name, value } = e.target;
// // //         setFormData({ ...formData, [name]: value });
// // //         if (error) setError('');
// // //         if (validationErrors[name]) setValidationErrors({ ...validationErrors, [name]: '' });
// // //     };

// // //     const validateForm = () => {
// // //         const errors = {};
// // //         let isValid = true;
// // //         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// // //         if (!formData.email.trim()) { errors.email = 'Email is required'; isValid = false; }
// // //         else if (!emailRegex.test(formData.email)) { errors.email = 'Please enter a valid email address'; isValid = false; }
// // //         if (!formData.password) { errors.password = 'Password is required'; isValid = false; }
// // //         setValidationErrors(errors);
// // //         return isValid;
// // //     };

// // //     const handleSubmit = async (e) => {
// // //         e.preventDefault();
// // //         setError('');
// // //         if (!validateForm()) return;
// // //         setLoading(true);
// // //         try {
// // //             const response = await axios.post('http://127.0.0.1:8000/login', {
// // //                 email: formData.email.trim().toLowerCase(),
// // //                 password: formData.password
// // //             }, { headers: { 'Content-Type': 'application/json' }, timeout: 10000 });
// // //             if (response.data.id) {
// // //                 localStorage.setItem('userId', response.data.id);
// // //                 localStorage.setItem('userName', response.data.name);
// // //                 localStorage.setItem('userEmail', response.data.email);
// // //                 localStorage.setItem('userRole', response.data.role || 'user');
// // //             }
// // //             // Redirect based on role
// // //             const role = response.data.role || 'user';
// // //             navigate(role === 'admin' ? '/admin' : '/dashboard', { replace: true });
// // //         } catch (err) {
// // //             if (err.code === 'ECONNABORTED') setError('Request timeout. Please check your connection.');
// // //             else if (err.code === 'ERR_NETWORK') setError('Cannot connect to server. Please make sure the backend is running.');
// // //             else if (err.response?.status === 401) setError('Invalid email or password. Please try again.');
// // //             else if (err.response?.status === 422) setError('Invalid input data. Please check your information.');
// // //             else if (err.response?.status >= 500) setError('Server error. Please try again later.');
// // //             else setError(err.response?.data?.detail || 'Login failed. Please try again.');
// // //         } finally {
// // //             setLoading(false);
// // //         }
// // //     };

// // //     return (

// // //         <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: COLORS.background, overflow: 'hidden' }}>
// // //             <GlobalStyles styles={{ 'html, body, #root': { margin: 0, padding: 0, background: COLORS.background } }} />

           
// // //             <Box sx={{
// // //                 display: { xs: 'none', md: 'block' },
// // //                 width: '50%',
// // //                 flexShrink: 0,
// // //                 position: 'relative',
// // //                 overflow: 'hidden',
// // //                 alignSelf: 'stretch'
// // //             }}>
// // //                 <Box
// // //                     component="img"
// // //                     src="https://images.unsplash.com/photo-1500269062855-0d9c4410af0e?w=900&q=85"
// // //                     alt="Nepal landscape"
// // //                     sx={{
// // //                         position: 'absolute',
// // //                         top: 0,
// // //                         left: 0,
// // //                         width: '100%',
// // //                         height: '100%',
// // //                         objectFit: 'cover',
// // //                         objectPosition: 'center',
// // //                         dispay: 'block',
// // //                     }}
// // //                 />
// // //             </Box>

// // //             {/* Right — Form */}
// // //             <Box sx={{
// // //                 flex: 1,
// // //                 display: 'flex',
// // //                 flexDirection: 'column',
// // //                 justifyContent: 'center',
// // //                 px: { xs: 4, md: 7 },
// // //                 py: 4,
// // //             }}>
// // //                 <Box sx={{ maxWidth: 360, width: '100%', mx: 'auto' }}>

// // //                     <Typography variant="h4" fontWeight={800} sx={{ color: COLORS.headings, mb: 0.75 }}>
// // //                         Welcome Back !
// // //                     </Typography>
// // //                     <Typography variant="body2" sx={{ color: COLORS.fadedText, mb: 4, lineHeight: 1.6 }}>
// // //                         To explore exciting travel destination and adventures
// // //                     </Typography>

// // //                     {error && (
// // //                         <Alert
// // //                             severity="error"
// // //                             onClose={() => setError('')}
// // //                             sx={{
// // //                                 mb: 3,
// // //                                 bgcolor: 'rgba(255,107,107,0.1)',
// // //                                 color: COLORS.error,
// // //                                 borderRadius: 2,
// // //                                 border: '1px solid rgba(255,107,107,0.25)',
// // //                                 '& .MuiAlert-icon': { color: COLORS.error },
// // //                                 fontSize: '0.85rem',
// // //                             }}
// // //                         >
// // //                             {error}
// // //                         </Alert>
// // //                     )}

// // //                     <Box component="form" onSubmit={handleSubmit}>
// // //                         <Stack spacing={1.5}>
// // //                             <TextField
// // //                                 fullWidth required
// // //                                 name="email" placeholder="Email Address"
// // //                                 autoComplete="email" autoFocus type="email"
// // //                                 value={formData.email} onChange={handleChange}
// // //                                 error={Boolean(validationErrors.email)}
// // //                                 helperText={validationErrors.email}
// // //                                 disabled={loading}
// // //                                 sx={inputSx}
// // //                                 InputProps={{
// // //                                     startAdornment: (
// // //                                         <InputAdornment position="start">
// // //                                             <EmailIcon />
// // //                                         </InputAdornment>
// // //                                     ),
// // //                                 }}
// // //                             />

// // //                             <TextField
// // //                                 fullWidth required
// // //                                 name="password" placeholder="Enter Your Password"
// // //                                 type={showPassword ? 'text' : 'password'}
// // //                                 autoComplete="current-password"
// // //                                 value={formData.password} onChange={handleChange}
// // //                                 error={Boolean(validationErrors.password)}
// // //                                 helperText={validationErrors.password}
// // //                                 disabled={loading}
// // //                                 sx={inputSx}
// // //                                 InputProps={{
// // //                                     startAdornment: (
// // //                                         <InputAdornment position="start">
// // //                                             <LockIcon />
// // //                                         </InputAdornment>
// // //                                     ),
// // //                                     endAdornment: (
// // //                                         <InputAdornment position="end">
// // //                                             <IconButton
// // //                                                 onClick={() => setShowPassword(s => !s)}
// // //                                                 disabled={loading}
// // //                                                 sx={{ color: COLORS.fadedText, p: 0.5, '&:hover': { color: COLORS.brand } }}
// // //                                             >
// // //                                                 {showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
// // //                                             </IconButton>
// // //                                         </InputAdornment>
// // //                                     ),
// // //                                 }}
// // //                             />
// // //                         </Stack>

// // //                         {/* Forgot Password */}
// // //                         <Box sx={{ mt: 1, mb: 3 }}>
// // //                             <Typography
// // //                                 variant="body2"
// // //                                 sx={{ color: COLORS.fadedText, fontSize: '0.82rem', cursor: 'not-allowed' }}
// // //                             >
// // //                                 Forgot Password?
// // //                             </Typography>
// // //                         </Box>

// // //                         {/* Sign In Button */}
// // //                         <Button
// // //                             type="submit" fullWidth variant="contained"
// // //                             disabled={loading}
// // //                             sx={{
// // //                                 py: 1.4,
// // //                                 mb: 1.5,
// // //                                 bgcolor: COLORS.brand,
// // //                                 color: COLORS.background,
// // //                                 fontWeight: 700,
// // //                                 fontSize: '0.95rem',
// // //                                 borderRadius: 2,
// // //                                 textTransform: 'none',
// // //                                 boxShadow: 'none',
// // //                                 letterSpacing: 0.3,
// // //                                 transition: 'all 0.25s',
// // //                                 '&:hover': {
// // //                                     bgcolor: '#2db8b8',
// // //                                     boxShadow: '0 4px 16px rgba(51,204,204,0.35)',
// // //                                     transform: 'translateY(-1px)',
// // //                                 },
// // //                                 '&:disabled': { bgcolor: 'rgba(51,204,204,0.25)', color: COLORS.fadedText }
// // //                             }}
// // //                         >
// // //                             {loading ? (
// // //                                 <Stack direction="row" spacing={1} alignItems="center">
// // //                                     <CircularProgress size={16} sx={{ color: COLORS.background }} />
// // //                                     <span>Signing In...</span>
// // //                                 </Stack>
// // //                             ) : 'Sign In'}
// // //                         </Button>

// // //                         {/* Google Button */}
// // //                         <Button
// // //                             fullWidth variant="contained"
// // //                             disabled={loading}
// // //                             startIcon={
// // //                                 <Box component="img"
// // //                                     src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
// // //                                     alt="Google" sx={{ width: 18, height: 18 }}
// // //                                 />
// // //                             }
// // //                             sx={{
// // //                                 py: 1.4,
// // //                                 bgcolor: COLORS.inputBg,
// // //                                 color: COLORS.text,
// // //                                 textTransform: 'none',
// // //                                 fontSize: '0.9rem',
// // //                                 borderRadius: 2,
// // //                                 boxShadow: 'none',
// // //                                 fontWeight: 500,
// // //                                 '&:hover': { bgcolor: '#2e3355', boxShadow: 'none' }
// // //                             }}
// // //                         >
// // //                             Continue With Google
// // //                         </Button>

// // //                         <Box sx={{ textAlign: 'center', mt: 3 }}>
// // //                             <Typography variant="body2" sx={{ color: COLORS.fadedText, fontSize: '0.85rem' }}>
// // //                                 Don't Have an Account?{' '}
// // //                                 <Link
// // //                                     component="button" type="button"
// // //                                     onClick={() => navigate('/register')}
// // //                                     disabled={loading}
// // //                                     sx={{
// // //                                         color: COLORS.text,
// // //                                         fontWeight: 600,
// // //                                         textDecoration: 'underline',
// // //                                         textDecorationColor: COLORS.fadedText,
// // //                                         '&:hover': { color: COLORS.brand, textDecorationColor: COLORS.brand }
// // //                                     }}
// // //                                 >
// // //                                     Sign Up
// // //                                 </Link>
// // //                             </Typography>
// // //                         </Box>
// // //                     </Box>
// // //                 </Box>
// // //             </Box>
// // //         </Box>
// // //     )
// // // };

// // // export default Login;
// // import React, { useState } from 'react';
// // import {
// //     Box,
// //     Button,
// //     TextField,
// //     Typography,
// //     Link,
// //     Alert,
// //     CircularProgress,
// //     InputAdornment,
// //     IconButton,
// //     Stack,
// //     GlobalStyles,
// //     Dialog,
// //     DialogContent,
// // } from '@mui/material';
// // import { Visibility, VisibilityOff } from '@mui/icons-material';
// // import EmailIcon from '@mui/icons-material/Email';
// // import LockIcon from '@mui/icons-material/Lock';
// // import ArrowBackIcon from '@mui/icons-material/ArrowBack';
// // import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
// // import CloseIcon from '@mui/icons-material/Close';
// // import { useNavigate } from 'react-router-dom';
// // import axios from 'axios';

// // const COLORS = {
// //     brand: '#33CCCC',
// //     background: '#141627',
// //     cardPrimary: '#1e2140',
// //     inputBg: '#252845',
// //     headings: '#B0D2EB',
// //     text: '#D0D2EB',
// //     fadedText: '#7B809A',
// //     error: '#ff6b6b',
// // };

// // const inputSx = {
// //     '& .MuiOutlinedInput-root': {
// //         bgcolor: COLORS.inputBg,
// //         borderRadius: 2,
// //         color: COLORS.text,
// //         fontSize: '0.9rem',
// //         '& fieldset': { borderColor: 'transparent' },
// //         '&:hover fieldset': { borderColor: COLORS.brand },
// //         '&.Mui-focused fieldset': { borderColor: COLORS.brand, borderWidth: 1.5 },
// //         '& .MuiInputAdornment-root svg': { fontSize: 18, color: COLORS.fadedText },
// //     },
// //     '& .MuiInputBase-input': { py: 1.5 },
// //     '& .MuiInputBase-input::placeholder': { color: COLORS.fadedText, opacity: 1 },
// //     '& .MuiFormHelperText-root': { color: COLORS.error, mx: 0, mt: 0.5 },
// // };

// // const btnSx = {
// //     py: 1.4,
// //     bgcolor: COLORS.brand,
// //     color: COLORS.background,
// //     fontWeight: 700,
// //     fontSize: '0.95rem',
// //     borderRadius: 2,
// //     textTransform: 'none',
// //     boxShadow: 'none',
// //     letterSpacing: 0.3,
// //     transition: 'all 0.25s',
// //     '&:hover': { bgcolor: '#2db8b8', boxShadow: '0 4px 16px rgba(51,204,204,0.35)', transform: 'translateY(-1px)' },
// //     '&:disabled': { bgcolor: 'rgba(51,204,204,0.25)', color: COLORS.fadedText },
// // };

// // // ── Forgot Password fullscreen dialog (same layout as login) ──────────────────
// // const ForgotPasswordDialog = ({ open, onClose }) => {
// //     const [step, setStep] = useState('forgot'); // 'forgot' | 'reset' | 'success'

// //     const [forgotEmail, setForgotEmail] = useState('');
// //     const [forgotLoading, setForgotLoading] = useState(false);
// //     const [forgotError, setForgotError] = useState('');

// //     const [resetUserId, setResetUserId] = useState(null);
// //     const [newPassword, setNewPassword] = useState('');
// //     const [confirmPassword, setConfirmPassword] = useState('');
// //     const [showNew, setShowNew] = useState(false);
// //     const [showConfirm, setShowConfirm] = useState(false);
// //     const [resetLoading, setResetLoading] = useState(false);
// //     const [resetError, setResetError] = useState('');

// //     const reset = () => {
// //         setStep('forgot');
// //         setForgotEmail(''); setForgotError('');
// //         setNewPassword(''); setConfirmPassword('');
// //         setResetError(''); setResetUserId(null);
// //     };

// //     const handleClose = () => { reset(); onClose(); };

// //     const handleForgotSubmit = async (e) => {
// //         e.preventDefault();
// //         setForgotError('');
// //         if (!forgotEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
// //             setForgotError('Please enter a valid email address');
// //             return;
// //         }
// //         setForgotLoading(true);
// //         try {
// //             const res = await axios.post('http://127.0.0.1:8000/auth/forgot-password', {
// //                 email: forgotEmail.trim().toLowerCase(),
// //             });
// //             setResetUserId(res.data.user_id);
// //             setStep('reset');
// //         } catch (err) {
// //             setForgotError(err.response?.data?.detail || 'No account found with this email address.');
// //         } finally { setForgotLoading(false); }
// //     };

// //     const handleResetSubmit = async (e) => {
// //         e.preventDefault();
// //         setResetError('');
// //         if (!newPassword) { setResetError('Please enter a new password'); return; }
// //         if (newPassword.length < 6) { setResetError('Password must be at least 6 characters'); return; }
// //         if (newPassword !== confirmPassword) { setResetError('Passwords do not match'); return; }
// //         setResetLoading(true);
// //         try {
// //             await axios.post('http://127.0.0.1:8000/auth/reset-password', {
// //                 user_id: resetUserId,
// //                 new_password: newPassword,
// //                 confirm_password: confirmPassword,
// //             });
// //             setStep('success');
// //         } catch (err) {
// //             setResetError(err.response?.data?.detail || 'Failed to reset password. Please try again.');
// //         } finally { setResetLoading(false); }
// //     };

// //     return (
// //         <Dialog
// //             open={open}
// //             onClose={handleClose}
// //             fullScreen
// //             PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none', m: 0 } }}
// //             BackdropProps={{ sx: { bgcolor: 'rgba(10,12,25,0.7)', backdropFilter: 'blur(6px)' } }}
// //         >
// //             <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
// //                 <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: COLORS.background }}>

// //                     {/* Left — mountain image, same as login */}
// //                     <Box sx={{ display: { xs: 'none', md: 'block' }, width: '50%', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
// //                         <Box
// //                             component="img"
// //                             src="https://images.unsplash.com/photo-1500269062855-0d9c4410af0e?w=900&q=85"
// //                             alt="Nepal landscape"
// //                             sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
// //                         />
// //                     </Box>

// //                     {/* Right — form */}
// //                     <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', px: { xs: 4, md: 7 }, py: 4, position: 'relative' }}>

// //                         {/* Close button */}
// //                         <IconButton onClick={handleClose} sx={{ position: 'absolute', top: 20, right: 20, color: COLORS.fadedText, borderRadius: 2, '&:hover': { color: COLORS.error, bgcolor: 'rgba(255,107,107,0.1)' } }}>
// //                             <CloseIcon />
// //                         </IconButton>

// //                         <Box sx={{ maxWidth: 360, width: '100%', mx: 'auto' }}>

// //                             {/* STEP 1 — Enter email */}
// //                             {step === 'forgot' && (
// //                                 <>
// //                                     <Typography variant="h4" fontWeight={800} sx={{ color: COLORS.headings, mb: 0.75 }}>
// //                                         Forgot Password?
// //                                     </Typography>
// //                                     <Typography variant="body2" sx={{ color: COLORS.fadedText, mb: 4, lineHeight: 1.6 }}>
// //                                         Please Enter Your Email to Reset Password.
// //                                     </Typography>

// //                                     {forgotError && (
// //                                         <Alert severity="error" onClose={() => setForgotError('')}
// //                                             sx={{ mb: 3, bgcolor: 'rgba(255,107,107,0.1)', color: COLORS.error, borderRadius: 2, border: '1px solid rgba(255,107,107,0.25)', '& .MuiAlert-icon': { color: COLORS.error }, fontSize: '0.85rem' }}>
// //                                             {forgotError}
// //                                         </Alert>
// //                                     )}

// //                                     <Box component="form" onSubmit={handleForgotSubmit}>
// //                                         <TextField
// //                                             fullWidth required autoFocus
// //                                             placeholder="Email Address" type="email"
// //                                             value={forgotEmail}
// //                                             onChange={e => { setForgotEmail(e.target.value); setForgotError(''); }}
// //                                             disabled={forgotLoading}
// //                                             sx={{ ...inputSx, mb: 3 }}
// //                                             InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon /></InputAdornment> }}
// //                                         />
// //                                         <Button type="submit" fullWidth variant="contained" disabled={forgotLoading} sx={btnSx}>
// //                                             {forgotLoading
// //                                                 ? <Stack direction="row" spacing={1} alignItems="center"><CircularProgress size={16} sx={{ color: COLORS.background }} /><span>Verifying...</span></Stack>
// //                                                 : 'Reset Password'}
// //                                         </Button>
// //                                         <Box sx={{ textAlign: 'center', mt: 3 }}>
// //                                             <Typography variant="body2" sx={{ color: COLORS.fadedText, fontSize: '0.85rem' }}>
// //                                                 Remembered it?{' '}
// //                                                 <Link component="button" type="button" onClick={handleClose}
// //                                                     sx={{ color: COLORS.brand, fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
// //                                                     Back to Sign In
// //                                                 </Link>
// //                                             </Typography>
// //                                         </Box>
// //                                     </Box>
// //                                 </>
// //                             )}

// //                             {/* STEP 2 — Enter new password */}
// //                             {step === 'reset' && (
// //                                 <>
// //                                     <IconButton
// //                                         onClick={() => { setStep('forgot'); setResetError(''); setNewPassword(''); setConfirmPassword(''); }}
// //                                         sx={{ mb: 2, color: COLORS.fadedText, borderRadius: 2, p: 0.5, ml: -0.5, '&:hover': { color: COLORS.brand, bgcolor: 'rgba(51,204,204,0.08)' } }}
// //                                     >
// //                                         <ArrowBackIcon sx={{ fontSize: 20 }} />
// //                                     </IconButton>

// //                                     <Typography variant="h4" fontWeight={800} sx={{ color: COLORS.headings, mb: 0.75 }}>
// //                                         Reset Password
// //                                     </Typography>
// //                                     <Typography variant="body2" sx={{ color: COLORS.fadedText, mb: 4, lineHeight: 1.6 }}>
// //                                         Please enter a new password to reset it.
// //                                     </Typography>

// //                                     {resetError && (
// //                                         <Alert severity="error" onClose={() => setResetError('')}
// //                                             sx={{ mb: 3, bgcolor: 'rgba(255,107,107,0.1)', color: COLORS.error, borderRadius: 2, border: '1px solid rgba(255,107,107,0.25)', '& .MuiAlert-icon': { color: COLORS.error }, fontSize: '0.85rem' }}>
// //                                             {resetError}
// //                                         </Alert>
// //                                     )}

// //                                     <Box component="form" onSubmit={handleResetSubmit}>
// //                                         <Stack spacing={1.5} sx={{ mb: 3 }}>
// //                                             <TextField
// //                                                 fullWidth required autoFocus
// //                                                 placeholder="Enter Your Password"
// //                                                 type={showNew ? 'text' : 'password'}
// //                                                 value={newPassword}
// //                                                 onChange={e => { setNewPassword(e.target.value); setResetError(''); }}
// //                                                 disabled={resetLoading} sx={inputSx}
// //                                                 InputProps={{
// //                                                     startAdornment: <InputAdornment position="start"><LockIcon /></InputAdornment>,
// //                                                     endAdornment: (
// //                                                         <InputAdornment position="end">
// //                                                             <IconButton onClick={() => setShowNew(p => !p)} disabled={resetLoading} sx={{ color: COLORS.fadedText, p: 0.5, '&:hover': { color: COLORS.brand } }}>
// //                                                                 {showNew ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
// //                                                             </IconButton>
// //                                                         </InputAdornment>
// //                                                     ),
// //                                                 }}
// //                                             />
// //                                             <TextField
// //                                                 fullWidth required
// //                                                 placeholder="Confirm Password"
// //                                                 type={showConfirm ? 'text' : 'password'}
// //                                                 value={confirmPassword}
// //                                                 onChange={e => { setConfirmPassword(e.target.value); setResetError(''); }}
// //                                                 disabled={resetLoading} sx={inputSx}
// //                                                 InputProps={{
// //                                                     startAdornment: <InputAdornment position="start"><LockIcon /></InputAdornment>,
// //                                                     endAdornment: (
// //                                                         <InputAdornment position="end">
// //                                                             <IconButton onClick={() => setShowConfirm(p => !p)} disabled={resetLoading} sx={{ color: COLORS.fadedText, p: 0.5, '&:hover': { color: COLORS.brand } }}>
// //                                                                 {showConfirm ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
// //                                                             </IconButton>
// //                                                         </InputAdornment>
// //                                                     ),
// //                                                 }}
// //                                             />
// //                                         </Stack>
// //                                         <Button type="submit" fullWidth variant="contained" disabled={resetLoading} sx={btnSx}>
// //                                             {resetLoading
// //                                                 ? <Stack direction="row" spacing={1} alignItems="center"><CircularProgress size={16} sx={{ color: COLORS.background }} /><span>Resetting...</span></Stack>
// //                                                 : 'Reset Password'}
// //                                         </Button>
// //                                     </Box>
// //                                 </>
// //                             )}

// //                             {/* STEP 3 — Success */}
// //                             {step === 'success' && (
// //                                 <Box sx={{ textAlign: 'center' }}>
// //                                     <Box sx={{ width: 68, height: 68, borderRadius: '50%', bgcolor: 'rgba(51,204,204,0.1)', border: '2px solid rgba(51,204,204,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
// //                                         <CheckCircleOutlineIcon sx={{ fontSize: 34, color: COLORS.brand }} />
// //                                     </Box>
// //                                     <Typography variant="h4" fontWeight={800} sx={{ color: COLORS.headings, mb: 0.75 }}>
// //                                         Password Reset!
// //                                     </Typography>
// //                                     <Typography variant="body2" sx={{ color: COLORS.fadedText, mb: 4, lineHeight: 1.6 }}>
// //                                         Your password has been updated successfully. You can now sign in with your new password.
// //                                     </Typography>
// //                                     <Button fullWidth variant="contained" onClick={handleClose} sx={btnSx}>
// //                                         Back to Sign In
// //                                     </Button>
// //                                 </Box>
// //                             )}

// //                         </Box>
// //                     </Box>
// //                 </Box>
// //             </DialogContent>
// //         </Dialog>
// //     );
// // };

// // // ── LOGIN — original UI, zero changes except Forgot Password is now clickable ─
// // const Login = () => {
// //     const navigate = useNavigate();

// //     const [formData, setFormData] = useState({ email: '', password: '' });
// //     const [loading, setLoading] = useState(false);
// //     const [error, setError] = useState('');
// //     const [showPassword, setShowPassword] = useState(false);
// //     const [validationErrors, setValidationErrors] = useState({ email: '', password: '' });
// //     const [forgotOpen, setForgotOpen] = useState(false);

// //     const handleChange = (e) => {
// //         const { name, value } = e.target;
// //         setFormData({ ...formData, [name]: value });
// //         if (error) setError('');
// //         if (validationErrors[name]) setValidationErrors({ ...validationErrors, [name]: '' });
// //     };

// //     const validateForm = () => {
// //         const errors = {};
// //         let isValid = true;
// //         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// //         if (!formData.email.trim()) { errors.email = 'Email is required'; isValid = false; }
// //         else if (!emailRegex.test(formData.email)) { errors.email = 'Please enter a valid email address'; isValid = false; }
// //         if (!formData.password) { errors.password = 'Password is required'; isValid = false; }
// //         setValidationErrors(errors);
// //         return isValid;
// //     };

// //     const handleSubmit = async (e) => {
// //         e.preventDefault();
// //         setError('');
// //         if (!validateForm()) return;
// //         setLoading(true);
// //         try {
// //             const response = await axios.post('http://127.0.0.1:8000/login', {
// //                 email: formData.email.trim().toLowerCase(),
// //                 password: formData.password
// //             }, { headers: { 'Content-Type': 'application/json' }, timeout: 10000 });
// //             if (response.data.id) {
// //                 localStorage.setItem('userId', response.data.id);
// //                 localStorage.setItem('userName', response.data.name);
// //                 localStorage.setItem('userEmail', response.data.email);
// //                 localStorage.setItem('userRole', response.data.role || 'user');
// //             }
// //             const role = response.data.role || 'user';
// //             navigate(role === 'admin' ? '/admin' : '/dashboard', { replace: true });
// //         } catch (err) {
// //             if (err.code === 'ECONNABORTED') setError('Request timeout. Please check your connection.');
// //             else if (err.code === 'ERR_NETWORK') setError('Cannot connect to server. Please make sure the backend is running.');
// //             else if (err.response?.status === 401) setError('Invalid email or password. Please try again.');
// //             else if (err.response?.status === 422) setError('Invalid input data. Please check your information.');
// //             else if (err.response?.status >= 500) setError('Server error. Please try again later.');
// //             else setError(err.response?.data?.detail || 'Login failed. Please try again.');
// //         } finally {
// //             setLoading(false);
// //         }
// //     };

// //     return (
// //         <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: COLORS.background, overflow: 'hidden' }}>
// //             <GlobalStyles styles={{ 'html, body, #root': { margin: 0, padding: 0, background: COLORS.background } }} />

// //             {/* Left — Mountain image */}
// //             <Box sx={{
// //                 display: { xs: 'none', md: 'block' },
// //                 width: '50%',
// //                 flexShrink: 0,
// //                 position: 'relative',
// //                 overflow: 'hidden',
// //                 alignSelf: 'stretch'
// //             }}>
// //                 <Box
// //                     component="img"
// //                     src="https://images.unsplash.com/photo-1500269062855-0d9c4410af0e?w=900&q=85"
// //                     alt="Nepal landscape"
// //                     sx={{
// //                         position: 'absolute',
// //                         top: 0, left: 0,
// //                         width: '100%', height: '100%',
// //                         objectFit: 'cover', objectPosition: 'center',
// //                         display: 'block',
// //                     }}
// //                 />
// //             </Box>

// //             {/* Right — Form */}
// //             <Box sx={{
// //                 flex: 1,
// //                 display: 'flex',
// //                 flexDirection: 'column',
// //                 justifyContent: 'center',
// //                 px: { xs: 4, md: 7 },
// //                 py: 4,
// //             }}>
// //                 <Box sx={{ maxWidth: 360, width: '100%', mx: 'auto' }}>

// //                     <Typography variant="h4" fontWeight={800} sx={{ color: COLORS.headings, mb: 0.75 }}>
// //                         Welcome Back !
// //                     </Typography>
// //                     <Typography variant="body2" sx={{ color: COLORS.fadedText, mb: 4, lineHeight: 1.6 }}>
// //                         To explore exciting travel destination and adventures
// //                     </Typography>

// //                     {error && (
// //                         <Alert severity="error" onClose={() => setError('')}
// //                             sx={{ mb: 3, bgcolor: 'rgba(255,107,107,0.1)', color: COLORS.error, borderRadius: 2, border: '1px solid rgba(255,107,107,0.25)', '& .MuiAlert-icon': { color: COLORS.error }, fontSize: '0.85rem' }}>
// //                             {error}
// //                         </Alert>
// //                     )}

// //                     <Box component="form" onSubmit={handleSubmit}>
// //                         <Stack spacing={1.5}>
// //                             <TextField
// //                                 fullWidth required
// //                                 name="email" placeholder="Email Address"
// //                                 autoComplete="email" autoFocus type="email"
// //                                 value={formData.email} onChange={handleChange}
// //                                 error={Boolean(validationErrors.email)}
// //                                 helperText={validationErrors.email}
// //                                 disabled={loading} sx={inputSx}
// //                                 InputProps={{
// //                                     startAdornment: <InputAdornment position="start"><EmailIcon /></InputAdornment>,
// //                                 }}
// //                             />

// //                             <TextField
// //                                 fullWidth required
// //                                 name="password" placeholder="Enter Your Password"
// //                                 type={showPassword ? 'text' : 'password'}
// //                                 autoComplete="current-password"
// //                                 value={formData.password} onChange={handleChange}
// //                                 error={Boolean(validationErrors.password)}
// //                                 helperText={validationErrors.password}
// //                                 disabled={loading} sx={inputSx}
// //                                 InputProps={{
// //                                     startAdornment: <InputAdornment position="start"><LockIcon /></InputAdornment>,
// //                                     endAdornment: (
// //                                         <InputAdornment position="end">
// //                                             <IconButton onClick={() => setShowPassword(s => !s)} disabled={loading}
// //                                                 sx={{ color: COLORS.fadedText, p: 0.5, '&:hover': { color: COLORS.brand } }}>
// //                                                 {showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
// //                                             </IconButton>
// //                                         </InputAdornment>
// //                                     ),
// //                                 }}
// //                             />
// //                         </Stack>

// //                         {/* Forgot Password — only change from original: now clickable */}
// //                         <Box sx={{ mt: 1, mb: 3 }}>
// //                             <Typography
// //                                 variant="body2"
// //                                 onClick={() => setForgotOpen(true)}
// //                                 sx={{
// //                                     color: COLORS.fadedText,
// //                                     fontSize: '0.82rem',
// //                                     cursor: 'pointer',
// //                                     display: 'inline',
// //                                     '&:hover': { color: COLORS.brand },
// //                                 }}
// //                             >
// //                                 Forgot Password?
// //                             </Typography>
// //                         </Box>

// //                         <Button type="submit" fullWidth variant="contained" disabled={loading}
// //                             sx={{ py: 1.4, mb: 1.5, bgcolor: COLORS.brand, color: COLORS.background, fontWeight: 700, fontSize: '0.95rem', borderRadius: 2, textTransform: 'none', boxShadow: 'none', letterSpacing: 0.3, transition: 'all 0.25s', '&:hover': { bgcolor: '#2db8b8', boxShadow: '0 4px 16px rgba(51,204,204,0.35)', transform: 'translateY(-1px)' }, '&:disabled': { bgcolor: 'rgba(51,204,204,0.25)', color: COLORS.fadedText } }}>
// //                             {loading ? (
// //                                 <Stack direction="row" spacing={1} alignItems="center">
// //                                     <CircularProgress size={16} sx={{ color: COLORS.background }} />
// //                                     <span>Signing In...</span>
// //                                 </Stack>
// //                             ) : 'Sign In'}
// //                         </Button>

// //                         <Button fullWidth variant="contained" disabled={loading}
// //                             startIcon={<Box component="img" src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" sx={{ width: 18, height: 18 }} />}
// //                             sx={{ py: 1.4, bgcolor: COLORS.inputBg, color: COLORS.text, textTransform: 'none', fontSize: '0.9rem', borderRadius: 2, boxShadow: 'none', fontWeight: 500, '&:hover': { bgcolor: '#2e3355', boxShadow: 'none' } }}>
// //                             Continue With Google
// //                         </Button>

// //                         <Box sx={{ textAlign: 'center', mt: 3 }}>
// //                             <Typography variant="body2" sx={{ color: COLORS.fadedText, fontSize: '0.85rem' }}>
// //                                 Don't Have an Account?{' '}
// //                                 <Link component="button" type="button" onClick={() => navigate('/register')} disabled={loading}
// //                                     sx={{ color: COLORS.text, fontWeight: 600, textDecoration: 'underline', textDecorationColor: COLORS.fadedText, '&:hover': { color: COLORS.brand, textDecorationColor: COLORS.brand } }}>
// //                                     Sign Up
// //                                 </Link>
// //                             </Typography>
// //                         </Box>
// //                     </Box>
// //                 </Box>
// //             </Box>

// //             {/* Forgot password overlay — mounts on top of login, same split layout */}
// //             <ForgotPasswordDialog open={forgotOpen} onClose={() => setForgotOpen(false)} />
// //         </Box>
// //     );
// // };

// // export default Login;




// import React, { useState } from 'react';
// import { 
//     Box, Button, TextField, Typography, Link, Alert,
//     CircularProgress, InputAdornment, IconButton, Stack,
//     GlobalStyles, Dialog, DialogContent,
// } from '@mui/material';
// import { Visibility, VisibilityOff } from '@mui/icons-material';
// import EmailIcon from '@mui/icons-material/Email';
// import LockIcon from '@mui/icons-material/Lock';
// import ArrowBackIcon from '@mui/icons-material/ArrowBack';
// import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
// import CloseIcon from '@mui/icons-material/Close';
// import { useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import { useGoogleLogin } from '@react-oauth/google';

// const COLORS = {
//     brand: '#33CCCC',
//     background: '#141627',
//     cardPrimary: '#1e2140',
//     inputBg: '#252845',
//     headings: '#B0D2EB',
//     text: '#D0D2EB',
//     fadedText: '#7B809A',
//     error: '#ff6b6b',
// };

// const inputSx = {
//     '& .MuiOutlinedInput-root': {
//         bgcolor: COLORS.inputBg, borderRadius: 2, color: COLORS.text, fontSize: '0.9rem',
//         '& fieldset': { borderColor: 'transparent' },
//         '&:hover fieldset': { borderColor: COLORS.brand },
//         '&.Mui-focused fieldset': { borderColor: COLORS.brand, borderWidth: 1.5 },
//         '& .MuiInputAdornment-root svg': { fontSize: 18, color: COLORS.fadedText },
//     },
//     '& .MuiInputBase-input': { py: 1.5 },
//     '& .MuiInputBase-input::placeholder': { color: COLORS.fadedText, opacity: 1 },
//     '& .MuiFormHelperText-root': { color: COLORS.error, mx: 0, mt: 0.5 },
// };

// const btnSx = {
//     py: 1.4, bgcolor: COLORS.brand, color: COLORS.background,
//     fontWeight: 700, fontSize: '0.95rem', borderRadius: 2,
//     textTransform: 'none', boxShadow: 'none', letterSpacing: 0.3, transition: 'all 0.25s',
//     '&:hover': { bgcolor: '#2db8b8', boxShadow: '0 4px 16px rgba(51,204,204,0.35)', transform: 'translateY(-1px)' },
//     '&:disabled': { bgcolor: 'rgba(51,204,204,0.25)', color: COLORS.fadedText },
// };

// // ── Forgot Password Dialog ────────────────────────────────────────────────────
// const ForgotPasswordDialog = ({ open, onClose }) => {
//     const [step, setStep] = useState('forgot');
//     const [forgotEmail, setForgotEmail] = useState('');
//     const [forgotLoading, setForgotLoading] = useState(false);
//     const [forgotError, setForgotError] = useState('');
//     const [resetUserId, setResetUserId] = useState(null);
//     const [newPassword, setNewPassword] = useState('');
//     const [confirmPassword, setConfirmPassword] = useState('');
//     const [showNew, setShowNew] = useState(false);
//     const [showConfirm, setShowConfirm] = useState(false);
//     const [resetLoading, setResetLoading] = useState(false);
//     const [resetError, setResetError] = useState('');

//     const handleClose = () => {
//         setStep('forgot');
//         setForgotEmail(''); setForgotError('');
//         setNewPassword(''); setConfirmPassword('');
//         setResetError(''); setResetUserId(null);
//         onClose();
//     };

//     const handleForgotSubmit = async (e) => {
//         e.preventDefault();
//         setForgotError('');
//         if (!forgotEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
//             setForgotError('Please enter a valid email address'); return;
//         }
//         setForgotLoading(true);
//         try {
//             const res = await axios.post('http://127.0.0.1:8000/auth/forgot-password', { email: forgotEmail.trim().toLowerCase() });
//             setResetUserId(res.data.user_id);
//             setStep('reset');
//         } catch (err) {
//             setForgotError(err.response?.data?.detail || 'No account found with this email address.');
//         } finally { setForgotLoading(false); }
//     };

//     const handleResetSubmit = async (e) => {
//         e.preventDefault();
//         setResetError('');
//         if (!newPassword) { setResetError('Please enter a new password'); return; }
//         if (newPassword.length < 6) { setResetError('Password must be at least 6 characters'); return; }
//         if (newPassword !== confirmPassword) { setResetError('Passwords do not match'); return; }
//         setResetLoading(true);
//         try {
//             await axios.post('http://127.0.0.1:8000/auth/reset-password', {
//                 user_id: resetUserId, new_password: newPassword, confirm_password: confirmPassword,
//             });
//             setStep('success');
//         } catch (err) {
//             setResetError(err.response?.data?.detail || 'Failed to reset password. Please try again.');
//         } finally { setResetLoading(false); }
//     };

//     return (
//         <Dialog open={open} onClose={handleClose} fullScreen
//             PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none', m: 0 } }}
//             BackdropProps={{ sx: { bgcolor: 'rgba(10,12,25,0.7)', backdropFilter: 'blur(6px)' } }}>
//             <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
//                 <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: COLORS.background }}>
//                     <Box sx={{ display: { xs: 'none', md: 'block' }, width: '50%', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
//                         <Box component="img" src="https://images.unsplash.com/photo-1500269062855-0d9c4410af0e?w=900&q=85" alt="Nepal"
//                             sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
//                     </Box>
//                     <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', px: { xs: 4, md: 7 }, py: 4, position: 'relative' }}>
//                         <IconButton onClick={handleClose} sx={{ position: 'absolute', top: 20, right: 20, color: COLORS.fadedText, borderRadius: 2, '&:hover': { color: COLORS.error, bgcolor: 'rgba(255,107,107,0.1)' } }}>
//                             <CloseIcon />
//                         </IconButton>
//                         <Box sx={{ maxWidth: 360, width: '100%', mx: 'auto' }}>

//                             {step === 'forgot' && (
//                                 <>
//                                     <Typography variant="h4" fontWeight={800} sx={{ color: COLORS.headings, mb: 0.75 }}>Forgot Password?</Typography>
//                                     <Typography variant="body2" sx={{ color: COLORS.fadedText, mb: 4, lineHeight: 1.6 }}>Please Enter Your Email to Reset Password.</Typography>
//                                     {forgotError && <Alert severity="error" onClose={() => setForgotError('')} sx={{ mb: 3, bgcolor: 'rgba(255,107,107,0.1)', color: COLORS.error, borderRadius: 2, border: '1px solid rgba(255,107,107,0.25)', '& .MuiAlert-icon': { color: COLORS.error }, fontSize: '0.85rem' }}>{forgotError}</Alert>}
//                                     <Box component="form" onSubmit={handleForgotSubmit}>
//                                         <TextField fullWidth required autoFocus placeholder="Email Address" type="email" value={forgotEmail}
//                                             onChange={e => { setForgotEmail(e.target.value); setForgotError(''); }} disabled={forgotLoading}
//                                             sx={{ ...inputSx, mb: 3 }} InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon /></InputAdornment> }} />
//                                         <Button type="submit" fullWidth variant="contained" disabled={forgotLoading} sx={btnSx}>
//                                             {forgotLoading ? <Stack direction="row" spacing={1} alignItems="center"><CircularProgress size={16} sx={{ color: COLORS.background }} /><span>Verifying...</span></Stack> : 'Reset Password'}
//                                         </Button>
//                                         <Box sx={{ textAlign: 'center', mt: 3 }}>
//                                             <Typography variant="body2" sx={{ color: COLORS.fadedText, fontSize: '0.85rem' }}>Remembered it?{' '}
//                                                 <Link component="button" type="button" onClick={handleClose} sx={{ color: COLORS.brand, fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>Back to Sign In</Link>
//                                             </Typography>
//                                         </Box>
//                                     </Box>
//                                 </>
//                             )}

//                             {step === 'reset' && (
//                                 <>
//                                     <IconButton onClick={() => { setStep('forgot'); setResetError(''); setNewPassword(''); setConfirmPassword(''); }}
//                                         sx={{ mb: 2, color: COLORS.fadedText, borderRadius: 2, p: 0.5, ml: -0.5, '&:hover': { color: COLORS.brand, bgcolor: 'rgba(51,204,204,0.08)' } }}>
//                                         <ArrowBackIcon sx={{ fontSize: 20 }} />
//                                     </IconButton>
//                                     <Typography variant="h4" fontWeight={800} sx={{ color: COLORS.headings, mb: 0.75 }}>Reset Password</Typography>
//                                     <Typography variant="body2" sx={{ color: COLORS.fadedText, mb: 4, lineHeight: 1.6 }}>Please enter a new password to reset it.</Typography>
//                                     {resetError && <Alert severity="error" onClose={() => setResetError('')} sx={{ mb: 3, bgcolor: 'rgba(255,107,107,0.1)', color: COLORS.error, borderRadius: 2, border: '1px solid rgba(255,107,107,0.25)', '& .MuiAlert-icon': { color: COLORS.error }, fontSize: '0.85rem' }}>{resetError}</Alert>}
//                                     <Box component="form" onSubmit={handleResetSubmit}>
//                                         <Stack spacing={1.5} sx={{ mb: 3 }}>
//                                             <TextField fullWidth required autoFocus placeholder="Enter Your Password" type={showNew ? 'text' : 'password'}
//                                                 value={newPassword} onChange={e => { setNewPassword(e.target.value); setResetError(''); }} disabled={resetLoading} sx={inputSx}
//                                                 InputProps={{ startAdornment: <InputAdornment position="start"><LockIcon /></InputAdornment>, endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowNew(p => !p)} disabled={resetLoading} sx={{ color: COLORS.fadedText, p: 0.5 }}>{showNew ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}</IconButton></InputAdornment> }} />
//                                             <TextField fullWidth required placeholder="Confirm Password" type={showConfirm ? 'text' : 'password'}
//                                                 value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setResetError(''); }} disabled={resetLoading} sx={inputSx}
//                                                 InputProps={{ startAdornment: <InputAdornment position="start"><LockIcon /></InputAdornment>, endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowConfirm(p => !p)} disabled={resetLoading} sx={{ color: COLORS.fadedText, p: 0.5 }}>{showConfirm ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}</IconButton></InputAdornment> }} />
//                                         </Stack>
//                                         <Button type="submit" fullWidth variant="contained" disabled={resetLoading} sx={btnSx}>
//                                             {resetLoading ? <Stack direction="row" spacing={1} alignItems="center"><CircularProgress size={16} sx={{ color: COLORS.background }} /><span>Resetting...</span></Stack> : 'Reset Password'}
//                                         </Button>
//                                     </Box>
//                                 </>
//                             )}

//                             {step === 'success' && (
//                                 <Box sx={{ textAlign: 'center' }}>
//                                     <Box sx={{ width: 68, height: 68, borderRadius: '50%', bgcolor: 'rgba(51,204,204,0.1)', border: '2px solid rgba(51,204,204,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
//                                         <CheckCircleOutlineIcon sx={{ fontSize: 34, color: COLORS.brand }} />
//                                     </Box>
//                                     <Typography variant="h4" fontWeight={800} sx={{ color: COLORS.headings, mb: 0.75 }}>Password Reset!</Typography>
//                                     <Typography variant="body2" sx={{ color: COLORS.fadedText, mb: 4, lineHeight: 1.6 }}>Your password has been updated. You can now sign in with your new password.</Typography>
//                                     <Button fullWidth variant="contained" onClick={handleClose} sx={btnSx}>Back to Sign In</Button>
//                                 </Box>
//                             )}

//                         </Box>
//                     </Box>
//                 </Box>
//             </DialogContent>
//         </Dialog>
//     );
// };

// // ── MAIN LOGIN COMPONENT ──────────────────────────────────────────────────────
// const Login = () => {
//     const navigate = useNavigate();

//     const [formData, setFormData] = useState({ email: '', password: '' });
//     const [loading, setLoading] = useState(false);
//     const [googleLoading, setGoogleLoading] = useState(false);
//     const [error, setError] = useState('');
//     const [showPassword, setShowPassword] = useState(false);
//     const [validationErrors, setValidationErrors] = useState({ email: '', password: '' });
//     const [forgotOpen, setForgotOpen] = useState(false);

//     const handleChange = (e) => {
//         const { name, value } = e.target;
//         setFormData({ ...formData, [name]: value });
//         if (error) setError('');
//         if (validationErrors[name]) setValidationErrors({ ...validationErrors, [name]: '' });
//     };

//     const validateForm = () => {
//         const errors = {};
//         let isValid = true;
//         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//         if (!formData.email.trim()) { errors.email = 'Email is required'; isValid = false; }
//         else if (!emailRegex.test(formData.email)) { errors.email = 'Please enter a valid email address'; isValid = false; }
//         if (!formData.password) { errors.password = 'Password is required'; isValid = false; }
//         setValidationErrors(errors);
//         return isValid;
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setError('');
//         if (!validateForm()) return;
//         setLoading(true);
//         try {
//             const response = await axios.post('http://127.0.0.1:8000/login', {
//                 email: formData.email.trim().toLowerCase(),
//                 password: formData.password
//             }, { headers: { 'Content-Type': 'application/json' }, timeout: 10000 });
//             if (response.data.id) {
//                 localStorage.setItem('userId', response.data.id);
//                 localStorage.setItem('userName', response.data.name);
//                 localStorage.setItem('userEmail', response.data.email);
//                 localStorage.setItem('userRole', response.data.role || 'user');
//             }
//             const role = response.data.role || 'user';
//             navigate(role === 'admin' ? '/admin' : '/dashboard', { replace: true });
//         } catch (err) {
//             if (err.code === 'ECONNABORTED') setError('Request timeout. Please check your connection.');
//             else if (err.code === 'ERR_NETWORK') setError('Cannot connect to server. Please make sure the backend is running.');
//             else if (err.response?.status === 401) setError('Invalid email or password. Please try again.');
//             else if (err.response?.status === 422) setError('Invalid input data. Please check your information.');
//             else if (err.response?.status >= 500) setError('Server error. Please try again later.');
//             else setError(err.response?.data?.detail || 'Login failed. Please try again.');
//         } finally { setLoading(false); }
//     };

//     // Google OAuth — sends access token to backend, receives full user record back
//     const handleGoogleLogin = useGoogleLogin({
//         onSuccess: async (tokenResponse) => {
//             setGoogleLoading(true);
//             setError('');
//             try {
//                 const response = await axios.post('http://127.0.0.1:8000/auth/google', {
//                     token: tokenResponse.access_token,
//                 }, { headers: { 'Content-Type': 'application/json' }, timeout: 10000 });

//                 const user = response.data;
//                 localStorage.setItem('userId', user.id);          // integer DB id, not email
//                 localStorage.setItem('userName', user.name);
//                 localStorage.setItem('userEmail', user.email);
//                 localStorage.setItem('userRole', user.role || 'user');
//                 if (user.profile_picture_url) {
//                     localStorage.setItem('userPicture', user.profile_picture_url);
//                 }

//                 const role = user.role || 'user';
//                 navigate(role === 'admin' ? '/admin' : '/dashboard', { replace: true });
//             } catch (err) {
//                 if (err.code === 'ERR_NETWORK') setError('Cannot connect to server. Please make sure the backend is running.');
//                 else if (err.response?.status >= 500) setError('Server error. Please try again later.');
//                 else setError(err.response?.data?.detail || 'Google login failed. Please try again.');
//             } finally { setGoogleLoading(false); }
//         },
//         onError: () => {
//             setError('Google sign-in was cancelled or failed. Please try again.');
//         },
//     });

//     return (
//         <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: COLORS.background, overflow: 'hidden' }}>
//             <GlobalStyles styles={{ 'html, body, #root': { margin: 0, padding: 0, background: COLORS.background } }} />

//             {/* Left — Image */}
//             <Box sx={{ display: { xs: 'none', md: 'block' }, width: '50%', flexShrink: 0, position: 'relative', overflow: 'hidden', alignSelf: 'stretch' }}>
//                 <Box component="img"
//                     src="https://images.unsplash.com/photo-1500269062855-0d9c4410af0e?w=900&q=85"
//                     alt="Nepal landscape"
//                     sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
//                 />
//             </Box>

//             {/* Right — Form */}
//             <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', px: { xs: 4, md: 7 }, py: 4 }}>
//                 <Box sx={{ maxWidth: 360, width: '100%', mx: 'auto' }}>

//                     <Typography variant="h4" fontWeight={800} sx={{ color: COLORS.headings, mb: 0.75 }}>
//                         Welcome Back !
//                     </Typography>
//                     <Typography variant="body2" sx={{ color: COLORS.fadedText, mb: 4, lineHeight: 1.6 }}>
//                         To explore exciting travel destination and adventures
//                     </Typography>

//                     {error && (
//                         <Alert severity="error" onClose={() => setError('')}
//                             sx={{ mb: 3, bgcolor: 'rgba(255,107,107,0.1)', color: COLORS.error, borderRadius: 2, border: '1px solid rgba(255,107,107,0.25)', '& .MuiAlert-icon': { color: COLORS.error }, fontSize: '0.85rem' }}>
//                             {error}
//                         </Alert>
//                     )}

//                     <Box component="form" onSubmit={handleSubmit}>
//                         <Stack spacing={1.5}>
//                             <TextField fullWidth required name="email" placeholder="Email Address"
//                                 autoComplete="email" autoFocus type="email"
//                                 value={formData.email} onChange={handleChange}
//                                 error={Boolean(validationErrors.email)} helperText={validationErrors.email}
//                                 disabled={loading || googleLoading} sx={inputSx}
//                                 InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon /></InputAdornment> }}
//                             />
//                             <TextField fullWidth required name="password" placeholder="Enter Your Password"
//                                 type={showPassword ? 'text' : 'password'} autoComplete="current-password"
//                                 value={formData.password} onChange={handleChange}
//                                 error={Boolean(validationErrors.password)} helperText={validationErrors.password}
//                                 disabled={loading || googleLoading} sx={inputSx}
//                                 InputProps={{
//                                     startAdornment: <InputAdornment position="start"><LockIcon /></InputAdornment>,
//                                     endAdornment: (
//                                         <InputAdornment position="end">
//                                             <IconButton onClick={() => setShowPassword(s => !s)} disabled={loading || googleLoading}
//                                                 sx={{ color: COLORS.fadedText, p: 0.5, '&:hover': { color: COLORS.brand } }}>
//                                                 {showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
//                                             </IconButton>
//                                         </InputAdornment>
//                                     ),
//                                 }}
//                             />
//                         </Stack>

//                         {/* Forgot Password — clickable */}
//                         <Box sx={{ mt: 1, mb: 3 }}>
//                             <Typography variant="body2" onClick={() => setForgotOpen(true)}
//                                 sx={{ color: COLORS.fadedText, fontSize: '0.82rem', cursor: 'pointer', display: 'inline', '&:hover': { color: COLORS.brand } }}>
//                                 Forgot Password?
//                             </Typography>
//                         </Box>

//                         <Button type="submit" fullWidth variant="contained" disabled={loading || googleLoading}
//                             sx={{ py: 1.4, mb: 1.5, bgcolor: COLORS.brand, color: COLORS.background, fontWeight: 700, fontSize: '0.95rem', borderRadius: 2, textTransform: 'none', boxShadow: 'none', letterSpacing: 0.3, transition: 'all 0.25s', '&:hover': { bgcolor: '#2db8b8', boxShadow: '0 4px 16px rgba(51,204,204,0.35)', transform: 'translateY(-1px)' }, '&:disabled': { bgcolor: 'rgba(51,204,204,0.25)', color: COLORS.fadedText } }}>
//                             {loading ? <Stack direction="row" spacing={1} alignItems="center"><CircularProgress size={16} sx={{ color: COLORS.background }} /><span>Signing In...</span></Stack> : 'Sign In'}
//                         </Button>

//                         {/* Google Button */}
//                         <Button fullWidth variant="contained" disabled={loading || googleLoading}
//                             onClick={() => handleGoogleLogin()}
//                             startIcon={googleLoading ? null : <Box component="img" src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" sx={{ width: 18, height: 18 }} />}
//                             sx={{ py: 1.4, bgcolor: COLORS.inputBg, color: COLORS.text, textTransform: 'none', fontSize: '0.9rem', borderRadius: 2, boxShadow: 'none', fontWeight: 500, '&:hover': { bgcolor: '#2e3355', boxShadow: 'none' } }}>
//                             {googleLoading ? <Stack direction="row" spacing={1} alignItems="center"><CircularProgress size={16} sx={{ color: COLORS.text }} /><span>Connecting...</span></Stack> : 'Continue With Google'}
//                         </Button>

//                         <Box sx={{ textAlign: 'center', mt: 3 }}>
//                             <Typography variant="body2" sx={{ color: COLORS.fadedText, fontSize: '0.85rem' }}>
//                                 Don't Have an Account?{' '}
//                                 <Link component="button" type="button" onClick={() => navigate('/register')} disabled={loading || googleLoading}
//                                     sx={{ color: COLORS.text, fontWeight: 600, textDecoration: 'underline', textDecorationColor: COLORS.fadedText, '&:hover': { color: COLORS.brand, textDecorationColor: COLORS.brand } }}>
//                                     Sign Up
//                                 </Link>
//                             </Typography>
//                         </Box>
//                     </Box>
//                 </Box>
//             </Box>

//             {/* Forgot password overlay */}
//             <ForgotPasswordDialog open={forgotOpen} onClose={() => setForgotOpen(false)} />
//         </Box>
//     );
// };

// export default Login;

import React, { useState, useRef, useEffect } from 'react';
import {
    Box, Button, TextField, Typography, Link, Alert,
    CircularProgress, InputAdornment, IconButton, Stack,
    GlobalStyles, Dialog, DialogContent,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useGoogleLogin } from '@react-oauth/google';

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
        bgcolor: COLORS.inputBg, borderRadius: 2, color: COLORS.text, fontSize: '0.9rem',
        '& fieldset': { borderColor: 'transparent' },
        '&:hover fieldset': { borderColor: COLORS.brand },
        '&.Mui-focused fieldset': { borderColor: COLORS.brand, borderWidth: 1.5 },
        '& .MuiInputAdornment-root svg': { fontSize: 18, color: COLORS.fadedText },
    },
    '& .MuiInputBase-input': { py: 1.5 },
    '& .MuiInputBase-input::placeholder': { color: COLORS.fadedText, opacity: 1 },
    '& .MuiFormHelperText-root': { color: COLORS.error, mx: 0, mt: 0.5 },
};

const btnSx = {
    py: 1.4, bgcolor: COLORS.brand, color: COLORS.background,
    fontWeight: 700, fontSize: '0.95rem', borderRadius: 2,
    textTransform: 'none', boxShadow: 'none', letterSpacing: 0.3, transition: 'all 0.25s',
    '&:hover': { bgcolor: '#2db8b8', boxShadow: '0 4px 16px rgba(51,204,204,0.35)', transform: 'translateY(-1px)' },
    '&:disabled': { bgcolor: 'rgba(51,204,204,0.25)', color: COLORS.fadedText },
};

// ── OTP Input — 6 individual boxes ───────────────────────────────────────────
const OtpInput = ({ value, onChange, disabled }) => {
    const inputRefs = useRef([]);
    const digits = value.split('');

    const handleKey = (e, idx) => {
        if (e.key === 'Backspace') {
            const next = [...digits];
            if (next[idx]) {
                next[idx] = '';
                onChange(next.join(''));
            } else if (idx > 0) {
                inputRefs.current[idx - 1]?.focus();
            }
            return;
        }
        if (e.key === 'ArrowLeft' && idx > 0) { inputRefs.current[idx - 1]?.focus(); return; }
        if (e.key === 'ArrowRight' && idx < 5) { inputRefs.current[idx + 1]?.focus(); return; }
    };

    const handleChange = (e, idx) => {
        const char = e.target.value.replace(/\D/g, '').slice(-1);
        if (!char) return;
        const next = [...digits];
        next[idx] = char;
        onChange(next.join(''));
        if (idx < 5) inputRefs.current[idx + 1]?.focus();
    };

    const handlePaste = (e) => {
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted) {
            onChange(pasted.padEnd(6, '').slice(0, 6));
            inputRefs.current[Math.min(pasted.length, 5)]?.focus();
        }
        e.preventDefault();
    };

    return (
        <Stack direction="row" spacing={1} justifyContent="center" sx={{ my: 1 }}>
            {[0, 1, 2, 3, 4, 5].map((idx) => (
                <Box
                    key={idx}
                    component="input"
                    ref={el => inputRefs.current[idx] = el}
                    value={digits[idx] || ''}
                    onChange={e => handleChange(e, idx)}
                    onKeyDown={e => handleKey(e, idx)}
                    onPaste={handlePaste}
                    disabled={disabled}
                    maxLength={1}
                    inputMode="numeric"
                    sx={{
                        width: 46, height: 54,
                        textAlign: 'center',
                        fontSize: '1.4rem',
                        fontWeight: 700,
                        color: COLORS.text,
                        bgcolor: COLORS.inputBg,
                        border: `2px solid ${digits[idx] ? COLORS.brand : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: '10px',
                        outline: 'none',
                        caretColor: COLORS.brand,
                        transition: 'border-color 0.2s',
                        '&:focus': { borderColor: COLORS.brand, boxShadow: `0 0 0 3px rgba(51,204,204,0.15)` },
                        '&:disabled': { opacity: 0.5 },
                        fontFamily: 'monospace',
                    }}
                />
            ))}
        </Stack>
    );
};

// ── Forgot Password Dialog — steps: email → otp → reset → success ─────────────
const ForgotPasswordDialog = ({ open, onClose }) => {
    // steps: 'email' | 'otp' | 'reset' | 'success'
    const [step, setStep] = useState('email');

    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotError, setForgotError] = useState('');

    const [userId, setUserId] = useState(null);
    const [otp, setOtp] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpError, setOtpError] = useState('');
    const [resendTimer, setResendTimer] = useState(0);

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
    const [resetError, setResetError] = useState('');

    // countdown timer for resend
    useEffect(() => {
        if (resendTimer <= 0) return;
        const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
        return () => clearTimeout(t);
    }, [resendTimer]);

    const handleClose = () => {
        setStep('email');
        setForgotEmail(''); setForgotError('');
        setUserId(null); setOtp(''); setOtpError('');
        setNewPassword(''); setConfirmPassword('');
        setResetError(''); setResendTimer(0);
        onClose();
    };

    const handleSendOtp = async (e) => {
        e?.preventDefault();
        setForgotError('');
        if (!forgotEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
            setForgotError('Please enter a valid email address'); return;
        }
        setForgotLoading(true);
        try {
            const res = await axios.post('http://127.0.0.1:8000/auth/forgot-password', {
                email: forgotEmail.trim().toLowerCase(),
            });
            setUserId(res.data.user_id);
            setOtp('');
            setOtpError('');
            setResendTimer(60);
            setStep('otp');
        } catch (err) {
            setForgotError(err.response?.data?.detail || 'No account found with this email address.');
        } finally { setForgotLoading(false); }
    };

    const handleVerifyOtp = async (e) => {
        e?.preventDefault();
        setOtpError('');
        if (otp.length !== 6) { setOtpError('Please enter the full 6-digit OTP'); return; }
        setOtpLoading(true);
        try {
            await axios.post('http://127.0.0.1:8000/auth/verify-otp', {
                user_id: userId,
                otp_code: otp,
            });
            setStep('reset');
        } catch (err) {
            setOtpError(err.response?.data?.detail || 'Invalid OTP. Please try again.');
            setOtp('');
        } finally { setOtpLoading(false); }
    };

    const handleResetPassword = async (e) => {
        e?.preventDefault();
        setResetError('');
        if (!newPassword) { setResetError('Please enter a new password'); return; }
        if (newPassword.length < 6) { setResetError('Password must be at least 6 characters'); return; }
        if (newPassword !== confirmPassword) { setResetError('Passwords do not match'); return; }
        setResetLoading(true);
        try {
            await axios.post('http://127.0.0.1:8000/auth/reset-password', {
                user_id: userId,
                new_password: newPassword,
                confirm_password: confirmPassword,
            });
            setStep('success');
        } catch (err) {
            setResetError(err.response?.data?.detail || 'Failed to reset password. Please try again.');
        } finally { setResetLoading(false); }
    };

    const errorAlert = (msg, onClear) => msg ? (
        <Alert severity="error" onClose={onClear}
            sx={{ mb: 3, bgcolor: 'rgba(255,107,107,0.1)', color: COLORS.error, borderRadius: 2, border: '1px solid rgba(255,107,107,0.25)', '& .MuiAlert-icon': { color: COLORS.error }, fontSize: '0.85rem' }}>
            {msg}
        </Alert>
    ) : null;

    return (
        <Dialog open={open} onClose={handleClose} fullScreen
            PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none', m: 0 } }}
            BackdropProps={{ sx: { bgcolor: 'rgba(10,12,25,0.7)', backdropFilter: 'blur(6px)' } }}>
            <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
                <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: COLORS.background }}>

                    {/* Left — mountain image */}
                    <Box sx={{ display: { xs: 'none', md: 'block' }, width: '50%', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
                        <Box component="img"
                            src="https://images.unsplash.com/photo-1500269062855-0d9c4410af0e?w=900&q=85"
                            alt="Nepal"
                            sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    </Box>

                    {/* Right — form */}
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', px: { xs: 4, md: 7 }, py: 4, position: 'relative' }}>
                        <IconButton onClick={handleClose} sx={{ position: 'absolute', top: 20, right: 20, color: COLORS.fadedText, borderRadius: 2, '&:hover': { color: COLORS.error, bgcolor: 'rgba(255,107,107,0.1)' } }}>
                            <CloseIcon />
                        </IconButton>

                        <Box sx={{ maxWidth: 360, width: '100%', mx: 'auto' }}>

                            {/* STEP 1 — Enter email */}
                            {step === 'email' && (
                                <>
                                    <Typography variant="h4" fontWeight={800} sx={{ color: COLORS.headings, mb: 0.75 }}>Forgot Password?</Typography>
                                    <Typography variant="body2" sx={{ color: COLORS.fadedText, mb: 4, lineHeight: 1.6 }}>
                                        Enter your email and we'll send you a 6-digit OTP to reset your password.
                                    </Typography>
                                    {errorAlert(forgotError, () => setForgotError(''))}
                                    <Box component="form" onSubmit={handleSendOtp}>
                                        <TextField fullWidth required autoFocus placeholder="Email Address" type="email"
                                            value={forgotEmail} onChange={e => { setForgotEmail(e.target.value); setForgotError(''); }}
                                            disabled={forgotLoading} sx={{ ...inputSx, mb: 3 }}
                                            InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon /></InputAdornment> }}
                                        />
                                        <Button type="submit" fullWidth variant="contained" disabled={forgotLoading} sx={btnSx}>
                                            {forgotLoading
                                                ? <Stack direction="row" spacing={1} alignItems="center"><CircularProgress size={16} sx={{ color: COLORS.background }} /><span>Sending OTP...</span></Stack>
                                                : 'Send OTP'}
                                        </Button>
                                        <Box sx={{ textAlign: 'center', mt: 3 }}>
                                            <Typography variant="body2" sx={{ color: COLORS.fadedText, fontSize: '0.85rem' }}>
                                                Remembered it?{' '}
                                                <Link component="button" type="button" onClick={handleClose}
                                                    sx={{ color: COLORS.brand, fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                                                    Back to Sign In
                                                </Link>
                                            </Typography>
                                        </Box>
                                    </Box>
                                </>
                            )}

                            {/* STEP 2 — Enter OTP */}
                            {step === 'otp' && (
                                <>
                                    <IconButton onClick={() => { setStep('email'); setOtpError(''); setOtp(''); }}
                                        sx={{ mb: 2, color: COLORS.fadedText, borderRadius: 2, p: 0.5, ml: -0.5, '&:hover': { color: COLORS.brand, bgcolor: 'rgba(51,204,204,0.08)' } }}>
                                        <ArrowBackIcon sx={{ fontSize: 20 }} />
                                    </IconButton>
                                    <Typography variant="h4" fontWeight={800} sx={{ color: COLORS.headings, mb: 0.75 }}>Enter OTP</Typography>
                                    <Typography variant="body2" sx={{ color: COLORS.fadedText, mb: 0.75, lineHeight: 1.6 }}>
                                        We sent a 6-digit code to
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600} sx={{ color: COLORS.brand, mb: 3 }}>
                                        {forgotEmail}
                                    </Typography>

                                    {errorAlert(otpError, () => setOtpError(''))}

                                    <Box component="form" onSubmit={handleVerifyOtp}>
                                        <OtpInput value={otp} onChange={setOtp} disabled={otpLoading} />

                                        <Button type="submit" fullWidth variant="contained" disabled={otpLoading || otp.length !== 6} sx={{ ...btnSx, mt: 3 }}>
                                            {otpLoading
                                                ? <Stack direction="row" spacing={1} alignItems="center"><CircularProgress size={16} sx={{ color: COLORS.background }} /><span>Verifying...</span></Stack>
                                                : 'Verify OTP'}
                                        </Button>
                                    </Box>

                                    {/* Resend OTP */}
                                    <Box sx={{ textAlign: 'center', mt: 2.5 }}>
                                        {resendTimer > 0 ? (
                                            <Typography variant="body2" sx={{ color: COLORS.fadedText, fontSize: '0.82rem' }}>
                                                Resend OTP in <strong style={{ color: COLORS.text }}>{resendTimer}s</strong>
                                            </Typography>
                                        ) : (
                                            <Typography variant="body2" sx={{ color: COLORS.fadedText, fontSize: '0.82rem' }}>
                                                Didn't receive it?{' '}
                                                <Link component="button" type="button" onClick={handleSendOtp}
                                                    sx={{ color: COLORS.brand, fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                                                    Resend OTP
                                                </Link>
                                            </Typography>
                                        )}
                                    </Box>
                                </>
                            )}

                            {/* STEP 3 — New password */}
                            {step === 'reset' && (
                                <>
                                    <Typography variant="h4" fontWeight={800} sx={{ color: COLORS.headings, mb: 0.75 }}>Reset Password</Typography>
                                    <Typography variant="body2" sx={{ color: COLORS.fadedText, mb: 4, lineHeight: 1.6 }}>Please enter a new password.</Typography>

                                    {errorAlert(resetError, () => setResetError(''))}

                                    <Box component="form" onSubmit={handleResetPassword}>
                                        <Stack spacing={1.5} sx={{ mb: 3 }}>
                                            <TextField fullWidth required autoFocus placeholder="New Password"
                                                type={showNew ? 'text' : 'password'}
                                                value={newPassword} onChange={e => { setNewPassword(e.target.value); setResetError(''); }}
                                                disabled={resetLoading} sx={inputSx}
                                                InputProps={{
                                                    startAdornment: <InputAdornment position="start"><LockIcon /></InputAdornment>,
                                                    endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowNew(p => !p)} disabled={resetLoading} sx={{ color: COLORS.fadedText, p: 0.5 }}>{showNew ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}</IconButton></InputAdornment>,
                                                }}
                                            />
                                            <TextField fullWidth required placeholder="Confirm Password"
                                                type={showConfirm ? 'text' : 'password'}
                                                value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setResetError(''); }}
                                                disabled={resetLoading} sx={inputSx}
                                                InputProps={{
                                                    startAdornment: <InputAdornment position="start"><LockIcon /></InputAdornment>,
                                                    endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowConfirm(p => !p)} disabled={resetLoading} sx={{ color: COLORS.fadedText, p: 0.5 }}>{showConfirm ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}</IconButton></InputAdornment>,
                                                }}
                                            />
                                        </Stack>
                                        <Button type="submit" fullWidth variant="contained" disabled={resetLoading} sx={btnSx}>
                                            {resetLoading
                                                ? <Stack direction="row" spacing={1} alignItems="center"><CircularProgress size={16} sx={{ color: COLORS.background }} /><span>Resetting...</span></Stack>
                                                : 'Reset Password'}
                                        </Button>
                                    </Box>
                                </>
                            )}

                            {/* STEP 4 — Success */}
                            {step === 'success' && (
                                <Box sx={{ textAlign: 'center' }}>
                                    <Box sx={{ width: 68, height: 68, borderRadius: '50%', bgcolor: 'rgba(51,204,204,0.1)', border: '2px solid rgba(51,204,204,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
                                        <CheckCircleOutlineIcon sx={{ fontSize: 34, color: COLORS.brand }} />
                                    </Box>
                                    <Typography variant="h4" fontWeight={800} sx={{ color: COLORS.headings, mb: 0.75 }}>Password Reset!</Typography>
                                    <Typography variant="body2" sx={{ color: COLORS.fadedText, mb: 4, lineHeight: 1.6 }}>
                                        Your password has been updated. You can now sign in with your new password.
                                    </Typography>
                                    <Button fullWidth variant="contained" onClick={handleClose} sx={btnSx}>
                                        Back to Sign In
                                    </Button>
                                </Box>
                            )}

                        </Box>
                    </Box>
                </Box>
            </DialogContent>
        </Dialog>
    );
};

// ── MAIN LOGIN COMPONENT ──────────────────────────────────────────────────────
const Login = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [validationErrors, setValidationErrors] = useState({ email: '', password: '' });
    const [forgotOpen, setForgotOpen] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (error) setError('');
        if (validationErrors[name]) setValidationErrors({ ...validationErrors, [name]: '' });
    };

    const validateForm = () => {
        const errors = {};
        let isValid = true;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) { errors.email = 'Email is required'; isValid = false; }
        else if (!emailRegex.test(formData.email)) { errors.email = 'Please enter a valid email address'; isValid = false; }
        if (!formData.password) { errors.password = 'Password is required'; isValid = false; }
        setValidationErrors(errors);
        return isValid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!validateForm()) return;
        setLoading(true);
        try {
            const response = await axios.post('http://127.0.0.1:8000/login', {
                email: formData.email.trim().toLowerCase(),
                password: formData.password
            }, { headers: { 'Content-Type': 'application/json' }, timeout: 10000 });
            if (response.data.id) {
                localStorage.setItem('userId', response.data.id);
                localStorage.setItem('userName', response.data.name);
                localStorage.setItem('userEmail', response.data.email);
                localStorage.setItem('userRole', response.data.role || 'user');
                localStorage.setItem('username', response.data.username || '');
                localStorage.setItem('avatarId', response.data.avatar_id || 1);
            }
            const role = response.data.role || 'user';
            navigate(role === 'admin' ? '/admin' : '/dashboard', { replace: true });
        } catch (err) {
            if (err.code === 'ECONNABORTED') setError('Request timeout. Please check your connection.');
            else if (err.code === 'ERR_NETWORK') setError('Cannot connect to server. Please make sure the backend is running.');
            else if (err.response?.status === 401) setError('Invalid email or password. Please try again.');
            else if (err.response?.status === 422) setError('Invalid input data. Please check your information.');
            else if (err.response?.status >= 500) setError('Server error. Please try again later.');
            else setError(err.response?.data?.detail || 'Login failed. Please try again.');
        } finally { setLoading(false); }
    };

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setGoogleLoading(true);
            setError('');
            try {
                const response = await axios.post('http://127.0.0.1:8000/auth/google', {
                    token: tokenResponse.access_token,
                }, { headers: { 'Content-Type': 'application/json' }, timeout: 10000 });
                const user = response.data;
                localStorage.setItem('userId', user.id);
                localStorage.setItem('userName', user.name);
                localStorage.setItem('userEmail', user.email);
                localStorage.setItem('userRole', user.role || 'user');
                localStorage.setItem('username', user.username || '');
                localStorage.setItem('avatarId', user.avatar_id || 1);
                if (user.profile_picture_url) localStorage.setItem('userPicture', user.profile_picture_url);
                const role = user.role || 'user';
                navigate(role === 'admin' ? '/admin' : '/dashboard', { replace: true });
            } catch (err) {
                if (err.code === 'ERR_NETWORK') setError('Cannot connect to server.');
                else setError(err.response?.data?.detail || 'Google login failed. Please try again.');
            } finally { setGoogleLoading(false); }
        },
        onError: () => setError('Google sign-in was cancelled or failed. Please try again.'),
    });

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: COLORS.background, overflow: 'hidden' }}>
            <GlobalStyles styles={{ 'html, body, #root': { margin: 0, padding: 0, background: COLORS.background } }} />

            {/* Left — Image */}
            <Box sx={{ display: { xs: 'none', md: 'block' }, width: '50%', flexShrink: 0, position: 'relative', overflow: 'hidden', alignSelf: 'stretch' }}>
                <Box component="img"
                    src="https://images.unsplash.com/photo-1500269062855-0d9c4410af0e?w=900&q=85"
                    alt="Nepal landscape"
                    sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
                />
            </Box>

            {/* Right — Form */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', px: { xs: 4, md: 7 }, py: 4 }}>
                <Box sx={{ maxWidth: 360, width: '100%', mx: 'auto' }}>
                    <Typography variant="h4" fontWeight={800} sx={{ color: COLORS.headings, mb: 0.75 }}>Welcome Back !</Typography>
                    <Typography variant="body2" sx={{ color: COLORS.fadedText, mb: 4, lineHeight: 1.6 }}>To explore exciting travel destination and adventures</Typography>

                    {error && (
                        <Alert severity="error" onClose={() => setError('')}
                            sx={{ mb: 3, bgcolor: 'rgba(255,107,107,0.1)', color: COLORS.error, borderRadius: 2, border: '1px solid rgba(255,107,107,0.25)', '& .MuiAlert-icon': { color: COLORS.error }, fontSize: '0.85rem' }}>
                            {error}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit}>
                        <Stack spacing={1.5}>
                            <TextField fullWidth required name="email" placeholder="Email Address"
                                autoComplete="email" autoFocus type="email"
                                value={formData.email} onChange={handleChange}
                                error={Boolean(validationErrors.email)} helperText={validationErrors.email}
                                disabled={loading || googleLoading} sx={inputSx}
                                InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon /></InputAdornment> }}
                            />
                            <TextField fullWidth required name="password" placeholder="Enter Your Password"
                                type={showPassword ? 'text' : 'password'} autoComplete="current-password"
                                value={formData.password} onChange={handleChange}
                                error={Boolean(validationErrors.password)} helperText={validationErrors.password}
                                disabled={loading || googleLoading} sx={inputSx}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><LockIcon /></InputAdornment>,
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setShowPassword(s => !s)} disabled={loading || googleLoading} sx={{ color: COLORS.fadedText, p: 0.5, '&:hover': { color: COLORS.brand } }}>
                                                {showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Stack>

                        <Box sx={{ mt: 1, mb: 3 }}>
                            <Typography variant="body2" onClick={() => setForgotOpen(true)}
                                sx={{ color: COLORS.fadedText, fontSize: '0.82rem', cursor: 'pointer', display: 'inline', '&:hover': { color: COLORS.brand } }}>
                                Forgot Password?
                            </Typography>
                        </Box>

                        <Button type="submit" fullWidth variant="contained" disabled={loading || googleLoading}
                            sx={{ py: 1.4, mb: 1.5, bgcolor: COLORS.brand, color: COLORS.background, fontWeight: 700, fontSize: '0.95rem', borderRadius: 2, textTransform: 'none', boxShadow: 'none', letterSpacing: 0.3, transition: 'all 0.25s', '&:hover': { bgcolor: '#2db8b8', boxShadow: '0 4px 16px rgba(51,204,204,0.35)', transform: 'translateY(-1px)' }, '&:disabled': { bgcolor: 'rgba(51,204,204,0.25)', color: COLORS.fadedText } }}>
                            {loading ? <Stack direction="row" spacing={1} alignItems="center"><CircularProgress size={16} sx={{ color: COLORS.background }} /><span>Signing In...</span></Stack> : 'Sign In'}
                        </Button>

                        <Button fullWidth variant="contained" disabled={loading || googleLoading} onClick={() => handleGoogleLogin()}
                            startIcon={googleLoading ? null : <Box component="img" src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" sx={{ width: 18, height: 18 }} />}
                            sx={{ py: 1.4, bgcolor: COLORS.inputBg, color: COLORS.text, textTransform: 'none', fontSize: '0.9rem', borderRadius: 2, boxShadow: 'none', fontWeight: 500, '&:hover': { bgcolor: '#2e3355', boxShadow: 'none' } }}>
                            {googleLoading ? <Stack direction="row" spacing={1} alignItems="center"><CircularProgress size={16} sx={{ color: COLORS.text }} /><span>Connecting...</span></Stack> : 'Continue With Google'}
                        </Button>

                        <Box sx={{ textAlign: 'center', mt: 3 }}>
                            <Typography variant="body2" sx={{ color: COLORS.fadedText, fontSize: '0.85rem' }}>
                                Don't Have an Account?{' '}
                                <Link component="button" type="button" onClick={() => navigate('/register')} disabled={loading || googleLoading}
                                    sx={{ color: COLORS.text, fontWeight: 600, textDecoration: 'underline', textDecorationColor: COLORS.fadedText, '&:hover': { color: COLORS.brand, textDecorationColor: COLORS.brand } }}>
                                    Sign Up
                                </Link>
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Box>

            <ForgotPasswordDialog open={forgotOpen} onClose={() => setForgotOpen(false)} />
        </Box>
    );
};

export default Login;