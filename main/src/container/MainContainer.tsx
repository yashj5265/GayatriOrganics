import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
    SafeAreaView,
    View,
    StyleSheet,
    ViewStyle,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useTheme } from '../contexts/ThemeProvider';
import EmptyData, { EmptyDataType } from '../components/EmptyData';
import { AppColors } from '../styles/colors';

export interface MainContainerProps {
    isInternetRequired?: boolean;
    header?: React.ReactNode;
    children?: React.ReactNode;
    style?: ViewStyle;
    disableUserInteraction?: boolean;
    showLoader?: boolean;
    statusBarColor?: string;
    statusBarStyle?: 'light-content' | 'dark-content' | 'default';
}

const DEFAULT_STATUS_BAR_COLOR = '#FFFFFF';
const DEFAULT_STATUS_BAR_STYLE: 'dark-content' = 'dark-content';
const LOADER_OVERLAY_OPACITY = 'rgba(0,0,0,0.2)';

const MainContainer: React.FC<MainContainerProps> = ({
    isInternetRequired = true,
    header,
    children,
    style,
    disableUserInteraction = false,
    showLoader = false,
    statusBarColor = DEFAULT_STATUS_BAR_COLOR,
    statusBarStyle = DEFAULT_STATUS_BAR_STYLE,
}) => {
    const colors = useTheme();
    const [isInternetAvailable, setIsInternetAvailable] = useState(true);

    useEffect(() => {
        if (!isInternetRequired) return;

        const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
            setIsInternetAvailable(!!state.isConnected);
        });

        return () => unsubscribe();
    }, [isInternetRequired]);

    const safeAreaStyle = useMemo(() => [
        styles.safeArea,
        { backgroundColor: colors.backgroundPrimary }
    ], [colors.backgroundPrimary]);

    const containerStyle = useMemo(() => [
        styles.container,
        { backgroundColor: colors.backgroundLightBlue },
        style
    ], [colors.backgroundLightBlue, style]);

    const statusBarBackgroundColor = useMemo(() =>
        statusBarColor || colors.backgroundPrimary,
        [statusBarColor, colors.backgroundPrimary]
    );

    const showNoInternet = useMemo(() =>
        isInternetRequired && !isInternetAvailable,
        [isInternetRequired, isInternetAvailable]
    );

    return (
        <SafeAreaView style={safeAreaStyle}>
            <StatusBar
                backgroundColor={statusBarBackgroundColor}
                barStyle={statusBarStyle}
                translucent={false}
            />

            <View
                pointerEvents={disableUserInteraction ? 'none' : 'auto'}
                style={containerStyle}
            >
                {header && header}

                {showNoInternet ? (
                    <EmptyData type={EmptyDataType.NO_INTERNET} />
                ) : (
                    <>
                        {children}

                        {showLoader && (
                            <View style={[styles.loaderContainer, { backgroundColor: LOADER_OVERLAY_OPACITY }]}>
                                <ActivityIndicator size="large" color={colors.themePrimary} />
                            </View>
                        )}
                    </>
                )}
            </View>
        </SafeAreaView>
    );
};

export default React.memo(MainContainer);

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    loaderContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
});