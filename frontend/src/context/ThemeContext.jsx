import React, { createContext, useContext, useState } from 'react';

export const DARK_COLORS = {
    brand: '#33CCCC',
    background: '#141627',
    cardPrimary: '#1E2140',
    cardSecondary: '#252845',
    headings: '#B0D2EB',
    subheadings: '#C0D2EB',
    text: '#C8D0E0',
    fadedText: '#7B809A',
    icons: '#B0D2EB',
    inputBg: '#252845',
    navbarBg: 'transparent',
    featureStripBg: '#1E2140',
    footerBg: '#1E2140',
    borderColor: 'rgba(51,204,204,0.1)',
    cardBorder: 'rgba(255,255,255,0.05)',
    cardBorderHover: 'rgba(51,204,204,0.3)',
    glowColor: 'rgba(51,204,204,0.07)',
    ctaBg: '#252845',
};

export const LIGHT_COLORS = {
    brand: '#1AAFAF',
    background: '#F0F4FA',
    cardPrimary: '#FFFFFF',
    cardSecondary: '#FFFFFF',
    headings: '#1A2D6B',
    subheadings: '#2D3748',
    text: '#2D3748',
    fadedText: '#64748B',
    icons: '#64748B',
    inputBg: '#E8EDF5',
    navbarBg: 'transparent',
    featureStripBg: '#FFFFFF',
    footerBg: '#FFFFFF',
    borderColor: 'rgba(26,175,175,0.15)',
    cardBorder: 'rgba(26,175,175,0.15)',
    cardBorderHover: 'rgba(26,175,175,0.5)',
    glowColor: 'rgba(26,175,175,0.06)',
    ctaBg: '#FFFFFF',
};

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem('sip-theme');
        return saved ? saved === 'dark' : true;
    });

    const toggleTheme = () => {
        setIsDark(prev => {
            const next = !prev;
            localStorage.setItem('sip-theme', next ? 'dark' : 'light');
            return next;
        });
    };

    const COLORS = isDark ? DARK_COLORS : LIGHT_COLORS;

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme, COLORS }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);