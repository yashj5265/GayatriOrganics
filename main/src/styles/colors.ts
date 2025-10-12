export interface AppColors {
    // 🌿 Core Theme
    themePrimary: string;
    themeSecondary: string;
    themePrimaryLight: string;
    rippleColor: string;

    // 🎨 Backgrounds
    backgroundPrimary: string;
    backgroundSecondary: string;

    // 🧾 Text
    textPrimary: string;
    textSecondary: string;
    textLabel: string;
    textDescription: string;
    textInputText: string;
    textInputPlaceholder: string;

    // 🔲 Borders & Lines
    border: string;
    separator: string;

    // 🧩 Buttons
    buttonPrimaryBackground: string;
    buttonPrimaryText: string;
    buttonDisabled: string;

    // 🧠 Input Fields
    inputErrorText: string;

    // ⚪ Common Colors
    white: string;
    black: string;
    grey: string;
    lightGrey: string;
    transparent: string;
    textInputBackground: string;
    textInputPlaceholderText: string;
    backgroundLightBlue: string;
}

export const lightTheme: AppColors = {
    themePrimary: '#4CAF50', // ✅ Organic Green
    themeSecondary: '#2E7D32',
    themePrimaryLight: 'rgba(76, 175, 80, 0.15)',
    rippleColor: 'rgba(76, 175, 80, 0.1)',

    backgroundPrimary: '#FFFFFF',
    backgroundSecondary: '#F8FFF8',

    textPrimary: '#1B1B1B',
    textSecondary: '#4CAF50',
    textLabel: '#888888',
    textDescription: '#666666',
    textInputText: '#212121',
    textInputPlaceholder: '#BDBDBD',

    border: '#E0E0E0',
    separator: '#F1F1F1',

    buttonPrimaryBackground: '#4CAF50',
    buttonPrimaryText: '#FFFFFF',
    buttonDisabled: '#A5D6A7',

    inputErrorText: '#D32F2F',

    white: '#FFFFFF',
    black: '#000000',
    grey: '#D9D9D9',
    lightGrey: '#BDBDBD',
    transparent: 'transparent',
    textInputBackground: "#FFFFFF",
    textInputPlaceholderText: "#D9D9D9",
    backgroundLightBlue: "#F1F8E9",
};

export const darkTheme: AppColors = {
    themePrimary: '#81C784',
    themeSecondary: '#388E3C',
    themePrimaryLight: 'rgba(129, 199, 132, 0.15)',
    rippleColor: 'rgba(129, 199, 132, 0.1)',

    backgroundPrimary: '#121212',
    backgroundSecondary: '#1E1E1E',

    textPrimary: '#E0E0E0',
    textSecondary: '#A5D6A7',
    textLabel: '#B0B0B0',
    textDescription: '#9E9E9E',
    textInputText: '#FFFFFF',
    textInputPlaceholder: '#9E9E9E',

    border: '#333333',
    separator: '#2C2C2C',

    buttonPrimaryBackground: '#4CAF50',
    buttonPrimaryText: '#FFFFFF',
    buttonDisabled: '#2E7D32',

    inputErrorText: '#EF5350',

    white: '#FFFFFF',
    black: '#000000',
    grey: '#777777',
    lightGrey: '#BDBDBD',
    transparent: 'transparent',
    textInputBackground: "#FFFFFF",
    textInputPlaceholderText: "#D9D9D9",
    backgroundLightBlue: "#F1F8E9",
};

export type ThemeType = 'light' | 'dark';

export const appThemes = {
    light: lightTheme,
    dark: darkTheme,
};
