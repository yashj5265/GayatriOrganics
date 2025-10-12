import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';

const LauncherScreen: React.FC = () => {
    return (
        <View style={styles.container}>
            {/* Logo */}
            <Image
                source={require('../../../resources/Images/launcherScreen/userAppLogo.png')} // apna logo rakho yahan
                style={styles.logo}
                resizeMode="contain"
            />

            {/* App Name */}
            <Text style={styles.title}>Gayatri Organic Farm</Text>

            {/* Loader */}
            <ActivityIndicator size="large" color="#4CAF50" style={{ marginTop: 20 }} />
        </View>
    );
};

export default LauncherScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    logo: {
        width: 120,
        height: 120,
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
});
