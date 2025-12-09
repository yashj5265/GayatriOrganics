import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MainContainer from '../../container/MainContainer';
import { useTheme } from '../../contexts/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import fonts from '../../styles/fonts';
import AppTouchableRipple from '../../components/AppTouchableRipple';
import StorageManager from '../../managers/StorageManager';
import ApiManager from '../../managers/ApiManager';
import constant from '../../utilities/constant';

interface ProfileScreenProps {
    navigation: NativeStackNavigationProp<any>;
}

interface MenuItem {
    id: number;
    label: string;
    icon: string;
    route: string;
}

interface MenuSection {
    title: string;
    items: MenuItem[];
}

const MENU_SECTIONS: MenuSection[] = [
    {
        title: 'Account',
        items: [
            { id: 1, label: 'My Orders', icon: '📦', route: 'MyOrders' },
            { id: 2, label: 'Saved Addresses', icon: '📍', route: 'Addresses' },
            { id: 3, label: 'Edit Profile', icon: '✏️', route: 'EditProfile' },
        ],
    },
    {
        title: 'Preferences',
        items: [
            { id: 4, label: 'Notifications', icon: '🔔', route: 'Notifications' },
            { id: 5, label: 'Language', icon: '🌐', route: 'Language' },
        ],
    },
    {
        title: 'Support',
        items: [
            { id: 6, label: 'Help & Support', icon: '❓', route: 'Support' },
            { id: 7, label: 'About Us', icon: 'ℹ️', route: 'About' },
            { id: 8, label: 'Terms & Privacy', icon: '📄', route: 'Terms' },
        ],
    },
];

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
    const colors = useTheme();
    const { logout } = useAuth();
    const [userName, setUserName] = useState<string>('User');
    const [userMobile, setUserMobile] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const loadUserData = useCallback(async () => {
        try {
            const token = await StorageManager.getItem(constant.shareInstanceKey.authToken);

            if (token) {
                // Fetch profile from API
                const response = await ApiManager.get({
                    endpoint: constant.apiEndPoints.getProfile,
                    token: token,
                    showError: false, // Don't show error toast on initial load
                });

                if (response?.data) {
                    const profileData = response.data;
                    setUserName(profileData.name || profileData.full_name || 'User');
                    setUserMobile(profileData.mobile || profileData.phone || '');

                    // Update stored user data
                    await StorageManager.setItem(constant.shareInstanceKey.userData, {
                        ...profileData,
                        name: profileData.name || profileData.full_name,
                        mobile: profileData.mobile || profileData.phone,
                    });
                } else {
                    // Fallback to stored user data
                    const userData = await StorageManager.getItem(constant.shareInstanceKey.userData);
                    if (userData && typeof userData === 'object') {
                        if ('name' in userData) {
                            setUserName(userData.name || 'User');
                        }
                        if ('mobile' in userData) {
                            setUserMobile(userData.mobile || '');
                        }
                    }
                }
            } else {
                // No token, load from storage
                const userData = await StorageManager.getItem(constant.shareInstanceKey.userData);
                if (userData && typeof userData === 'object') {
                    if ('name' in userData) {
                        setUserName(userData.name || 'User');
                    }
                    if ('mobile' in userData) {
                        setUserMobile(userData.mobile || '');
                    }
                }
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            // Fallback to stored user data on error
            try {
                const userData = await StorageManager.getItem(constant.shareInstanceKey.userData);
                if (userData && typeof userData === 'object') {
                    if ('name' in userData) {
                        setUserName(userData.name || 'User');
                    }
                    if ('mobile' in userData) {
                        setUserMobile(userData.mobile || '');
                    }
                }
            } catch (storageError) {
                console.error('Error loading from storage:', storageError);
            }
        }
    }, []);

    useEffect(() => {
        loadUserData();
    }, [loadUserData]);

    const performLogout = useCallback(async () => {
        setLoading(true);
        try {
            const token = await StorageManager.getItem(constant.shareInstanceKey.authToken);
            if (token) {
                try {
                    await ApiManager.post({
                        endpoint: constant.apiEndPoints.logout,
                        token: token,
                    });
                } catch (apiError) {
                    console.log('Logout API error (continuing anyway):', apiError);
                }
            }
            await logout();
        } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Error', 'Failed to logout. Please try again.');
            setLoading(false);
        }
    }, [logout]);

    const handleLogout = useCallback(() => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout',
                style: 'destructive',
                onPress: performLogout,
            },
        ]);
    }, [performLogout]);

    const handleMenuPress = useCallback((route: string) => {
        if (route === 'Addresses') {
            navigation.navigate(constant.routeName.addressList);
        } else {
            // TODO: Implement navigation for other routes when available
            console.log('Navigate to:', route);
        }
    }, [navigation]);

    const userInitial = useMemo(() =>
        userName.charAt(0).toUpperCase(),
        [userName]
    );

    return (
        <MainContainer
            statusBarColor={colors.themePrimary}
            statusBarStyle="light-content"
            isInternetRequired={false}
        >
            <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: colors.themePrimary }]}>
                    <View style={styles.profileSection}>
                        <View style={[styles.avatar, { backgroundColor: colors.white }]}>
                            <Text style={[styles.avatarText, { color: colors.themePrimary }]}>
                                {userInitial}
                            </Text>
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={[styles.userName, { color: colors.white }]}>
                                {userName}
                            </Text>
                            <Text style={[styles.userMobile, { color: colors.white }]}>
                                +91 {userMobile}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Menu Items */}
                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                >
                    {MENU_SECTIONS.map((section, sectionIndex) => (
                        <View key={sectionIndex} style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.textLabel }]}>
                                {section.title}
                            </Text>

                            <View
                                style={[
                                    styles.sectionCard,
                                    { backgroundColor: colors.backgroundSecondary },
                                ]}
                            >
                                {section.items.map((item, index) => (
                                    <View key={item.id}>
                                        <AppTouchableRipple
                                            style={styles.menuItem}
                                            onPress={() => handleMenuPress(item.route)}
                                        >
                                            <View style={styles.menuItemLeft}>
                                                <Text style={styles.menuIcon}>{item.icon}</Text>
                                                <Text
                                                    style={[
                                                        styles.menuLabel,
                                                        { color: colors.textPrimary },
                                                    ]}
                                                >
                                                    {item.label}
                                                </Text>
                                            </View>
                                            <Text style={styles.menuArrow}>›</Text>
                                        </AppTouchableRipple>

                                        {index < section.items.length - 1 && (
                                            <View
                                                style={[
                                                    styles.divider,
                                                    { backgroundColor: colors.border },
                                                ]}
                                            />
                                        )}
                                    </View>
                                ))}
                            </View>
                        </View>
                    ))}

                    {/* Logout Button */}
                    <AppTouchableRipple
                        style={[
                            styles.logoutButton,
                            {
                                backgroundColor: loading ? colors.buttonDisabled : '#ff4444',
                            },
                        ]}
                        onPress={handleLogout}
                        disabled={loading}
                    >
                        <Text style={[styles.logoutText, { color: colors.white }]}>
                            {loading ? 'Logging out...' : '🚪 Logout'}
                        </Text>
                    </AppTouchableRipple>

                    {/* Version Info */}
                    <Text style={[styles.versionText, { color: colors.textLabel }]}>
                        Gayatri Organics v1.0.0
                    </Text>
                </ScrollView>
            </View>
        </MainContainer>
    );
};

ProfileScreen.displayName = 'ProfileScreen';

export default memo(ProfileScreen);

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 30,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarText: {
        fontSize: fonts.size.font30,
        fontFamily: fonts.family.primaryBold,
    },
    profileInfo: {
        flex: 1,
    },
    userName: {
        fontSize: fonts.size.font20,
        fontFamily: fonts.family.primaryBold,
        marginBottom: 4,
    },
    userMobile: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.secondaryRegular,
        opacity: 0.9,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.primaryBold,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
        marginLeft: 4,
    },
    sectionCard: {
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    menuIcon: {
        fontSize: 24,
        marginRight: 16,
    },
    menuLabel: {
        fontSize: fonts.size.font16,
        fontFamily: fonts.family.secondaryRegular,
    },
    menuArrow: {
        fontSize: 28,
        color: '#999',
    },
    divider: {
        height: 1,
        marginLeft: 56,
    },
    logoutButton: {
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 16,
    },
    logoutText: {
        fontSize: fonts.size.font16,
        fontFamily: fonts.family.primaryBold,
    },
    versionText: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.secondaryRegular,
        textAlign: 'center',
        marginBottom: 20,
    },
});