// import React, { useEffect, useState } from 'react';
// import {
//     SafeAreaView,
//     View,
//     StyleSheet,
//     ViewStyle,
//     StatusBar,
//     ActivityIndicator,
//     Platform,
// } from 'react-native';
// import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
// import { useTheme } from '../contexts/ThemeProvider';
// import EmptyData, { EmptyDataType } from '../components/EmptyData';

// interface MainContainerProps {
//     isInternetRequired?: boolean;
//     header?: React.ReactNode;
//     children?: React.ReactNode;
//     style?: ViewStyle;
//     disableUserInteraction?: boolean;
//     showLoader?: boolean;
// };

// const MainContainer: React.FC<MainContainerProps> = ({
//     isInternetRequired = true,
//     header,
//     children,
//     style,
//     disableUserInteraction = false,
//     showLoader = false,
// }) => {
//     const colors = useTheme();
//     const [isInternetAvailable, setIsInternetAvailable] = useState(true);

//     useEffect(() => {
//         if (isInternetRequired) {
//             const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
//                 setIsInternetAvailable(!!state.isConnected);
//             });
//             return () => unsubscribe();
//         }
//     }, [isInternetRequired]);

//     return (
//         <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.backgroundPrimary }]}>
//             <StatusBar
//                 backgroundColor={colors.themePrimary}
//                 barStyle={Platform.OS === 'ios' ? 'light-content' : 'light-content'}
//             />

//             <View
//                 pointerEvents={disableUserInteraction ? 'none' : 'auto'}
//                 style={[styles.container, { backgroundColor: colors.backgroundLightBlue }, style]}
//             >
//                 {header && header}

//                 {isInternetRequired && !isInternetAvailable ? (
//                     <EmptyData type={EmptyDataType.NO_INTERNET} />
//                 ) : (
//                     <>
//                         {children}

//                         {showLoader && (
//                             <View style={[styles.loaderContainer, { backgroundColor: 'rgba(0,0,0,0.2)' }]}>
//                                 <ActivityIndicator size="large" color={colors.themePrimary} />
//                             </View>
//                         )}
//                     </>
//                 )}
//             </View>
//         </SafeAreaView>
//     );
// };

// export default React.memo(MainContainer);

// const styles = StyleSheet.create({
//     safeArea: {
//         flex: 1,
//     },
//     container: {
//         flex: 1,
//     },
//     loaderContainer: {
//         ...StyleSheet.absoluteFillObject,
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
// });


import React, { useEffect, useState } from 'react';
import {
    SafeAreaView,
    View,
    StyleSheet,
    ViewStyle,
    StatusBar,
    ActivityIndicator,
    Platform,
} from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useTheme } from '../contexts/ThemeProvider';
import EmptyData, { EmptyDataType } from '../components/EmptyData';

interface MainContainerProps {
    isInternetRequired?: boolean;
    header?: React.ReactNode;
    children?: React.ReactNode;
    style?: ViewStyle;
    disableUserInteraction?: boolean;
    showLoader?: boolean;
    statusBarColor?: string;
    statusBarStyle?: 'light-content' | 'dark-content' | 'default';
};

const MainContainer: React.FC<MainContainerProps> = ({
    isInternetRequired = true,
    header,
    children,
    style,
    disableUserInteraction = false,
    showLoader = false,
    statusBarColor = "#FFFFFF",
    statusBarStyle = 'dark-content',
}) => {
    const colors = useTheme();
    const [isInternetAvailable, setIsInternetAvailable] = useState(true);

    useEffect(() => {
        if (isInternetRequired) {
            const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
                setIsInternetAvailable(!!state.isConnected);
            });
            return () => unsubscribe();
        }
    }, [isInternetRequired]);

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.backgroundPrimary }]}>
            <StatusBar
                backgroundColor={statusBarColor ? statusBarColor : colors.backgroundPrimary}
                barStyle={statusBarStyle}
                translucent={false}
            />

            <View
                pointerEvents={disableUserInteraction ? 'none' : 'auto'}
                style={[styles.container, { backgroundColor: colors.backgroundLightBlue }, style]}
            >
                {header && header}

                {isInternetRequired && !isInternetAvailable ? (
                    <EmptyData type={EmptyDataType.NO_INTERNET} />
                ) : (
                    <>
                        {children}

                        {showLoader && (
                            <View style={[styles.loaderContainer, { backgroundColor: 'rgba(0,0,0,0.2)' }]}>
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