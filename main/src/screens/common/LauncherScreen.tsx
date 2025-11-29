import React, { memo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useTheme } from '../../contexts/ThemeProvider';
import fonts from '../../styles/fonts';
import constant from '../../utilities/constant';

const LOGO_SIZE = 120;
const LOADER_COLOR = '#4CAF50';

const LauncherScreen: React.FC = memo(() => {
    const colors = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
            <Image
                source={require('../../../resources/Images/launcherScreen/userAppLogo.png')}
                style={styles.logo}
                resizeMode="contain"
            />

            <Text style={[styles.title, { color: colors.textPrimary }]}>
                {constant.appIdentity}
            </Text>

            <ActivityIndicator 
                size="large" 
                color={colors.themePrimary} 
                style={styles.loader} 
            />
        </View>
    );
});

LauncherScreen.displayName = 'LauncherScreen';

export default LauncherScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: LOGO_SIZE,
        height: LOGO_SIZE,
        marginBottom: 20,
    },
    title: {
        fontSize: fonts.size.font22,
        fontFamily: fonts.family.primaryBold,
        marginBottom: 8,
    },
    loader: {
        marginTop: 20,
    },
});
