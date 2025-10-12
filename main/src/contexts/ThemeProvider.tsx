import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { AppColors, appThemes, ThemeType } from '../styles/colors';

interface ThemeContextProps {
    theme: ThemeType;
    colors: AppColors;
    toggleTheme: () => void;
    setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [theme, setThemeState] = useState<ThemeType>('light');

    const setTheme = (newTheme: ThemeType) => setThemeState(newTheme);
    const toggleTheme = () => setThemeState(prev => (prev === 'light' ? 'dark' : 'light'));

    const colors = useMemo(() => appThemes[theme], [theme]);

    return (
        <ThemeContext.Provider value={{ theme, colors, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

// ✅ Custom Hook
export const useTheme = (): AppColors => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context.colors;
};

// ✅ Optional: For switching
export const useThemeActions = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useThemeActions must be used within a ThemeProvider');
    }
    return {
        theme: context.theme,
        toggleTheme: context.toggleTheme,
        setTheme: context.setTheme,
    };
};
