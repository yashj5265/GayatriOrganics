import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import MainContainer from '../../container/MainContainer';
import { useTheme } from '../../contexts/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import AppTouchableRipple from '../../components/AppTouchableRipple';
import StorageManager from '../../managers/StorageManager';
import ApiManager from '../../managers/ApiManager';
import fonts from '../../styles/fonts';
import constant from '../../utilities/constant';

// ============================================================================
// CONSTANTS
// ============================================================================
const APP_VERSION = '1.0.0';
const APP_NAME = 'Gayatri Organics';
const DEFAULT_USER_NAME = 'User';
const COUNTRY_CODE = '+91';

const MENU_SECTIONS = [
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
            { id: 5, label: 'Language', icon: '🌍', route: 'Language' },
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
] as const;

// ============================================================================
// TYPES
// ============================================================================
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

interface UserData {
    name?: string;
    full_name?: string;
    mobile?: string;
    phone?: string;
}

interface ProfileHeaderProps {
    userName: string;
    userMobile: string;
    userInitial: string;
}

interface MenuItemProps {
    item: MenuItem;
    isLast: boolean;
    onPress: (route: string) => void;
}

interface MenuSectionProps {
    section: MenuSection;
    onMenuPress: (route: string) => void;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
const extractUserName = (userData: any): string => {
    if (!userData || typeof userData !== 'object') return DEFAULT_USER_NAME;
    return userData.name || userData.full_name || DEFAULT_USER_NAME;
};

const extractUserMobile = (userData: any): string => {
    if (!userData || typeof userData !== 'object') return '';
    return userData.mobile || userData.phone || '';
};

const normalizeUserData = (profileData: any): UserData => {
    return {
        ...profileData,
        name: profileData.name || profileData.full_name,
        mobile: profileData.mobile || profileData.phone,
    };
};

const getUserInitial = (userName: string): string => {
    return userName.charAt(0).toUpperCase();
};

const formatPhoneNumber = (mobile: string, countryCode: string = COUNTRY_CODE): string => {
    return mobile ? `${countryCode} ${mobile}` : '';
};

// ============================================================================
// SUB COMPONENTS
// ============================================================================
const ProfileHeader = memo(({ userName, userMobile, userInitial }: ProfileHeaderProps) => {
    const colors = useTheme();

    return (
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
                        {formatPhoneNumber(userMobile)}
                    </Text>
                </View>
            </View>
        </View>
    );
});

const MenuItemComponent = memo(({ item, isLast, onPress }: MenuItemProps) => {
    const colors = useTheme();

    return (
        <View>
            <AppTouchableRipple
                style={styles.menuItem}
                onPress={() => onPress(item.route)}
            >
                <View style={styles.menuItemLeft}>
                    <Text style={styles.menuIcon}>{item.icon}</Text>
                    <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>
                        {item.label}
                    </Text>
                </View>
                <Text style={styles.menuArrow}>›</Text>
            </AppTouchableRipple>

            {!isLast && (
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
            )}
        </View>
    );
});

const MenuSectionComponent = memo(({ section, onMenuPress }: MenuSectionProps) => {
    const colors = useTheme();

    return (
        <View style={styles.section}>
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
                    <MenuItemComponent
                        key={item.id}
                        item={item}
                        isLast={index === section.items.length - 1}
                        onPress={onMenuPress}
                    />
                ))}
            </View>
        </View>
    );
});

const LogoutButton = memo(({
    loading,
    onPress,
}: {
    loading: boolean;
    onPress: () => void;
}) => {
    const colors = useTheme();

    return (
        <AppTouchableRipple
            style={[
                styles.logoutButton,
                {
                    backgroundColor: loading ? colors.buttonDisabled : '#ff4444',
                },
            ]}
            onPress={onPress}
            disabled={loading}
        >
            <Text style={[styles.logoutText, { color: colors.white }]}>
                {loading ? 'Logging out...' : '🚪 Logout'}
            </Text>
        </AppTouchableRipple>
    );
});

const VersionInfo = memo(() => {
    const colors = useTheme();

    return (
        <Text style={[styles.versionText, { color: colors.textLabel }]}>
            {APP_NAME} v{APP_VERSION}
        </Text>
    );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
    const colors = useTheme();
    const { logout } = useAuth();

    // ============================================================================
    // STATE
    // ============================================================================
    const [userName, setUserName] = useState<string>(DEFAULT_USER_NAME);
    const [userMobile, setUserMobile] = useState<string>('');
    const [loading, setLoading] = useState(false);

    // ============================================================================
    // COMPUTED VALUES
    // ============================================================================
    const userInitial = useMemo(() => getUserInitial(userName), [userName]);

    // ============================================================================
    // USER DATA HANDLERS
    // ============================================================================
    const loadUserDataFromStorage = useCallback(async (): Promise<void> => {
        try {
            const userData = await StorageManager.getItem(constant.shareInstanceKey.userData);
            if (userData) {
                setUserName(extractUserName(userData));
                setUserMobile(extractUserMobile(userData));
            }
        } catch (error) {
            console.error('Error loading from storage:', error);
        }
    }, []);

    const loadUserDataFromAPI = useCallback(async (token: string): Promise<boolean> => {
        try {
            const response = await ApiManager.get({
                endpoint: constant.apiEndPoints.getProfile,
                token: token,
                showError: false,
            });

            if (response?.data) {
                const profileData = response.data;
                setUserName(extractUserName(profileData));
                setUserMobile(extractUserMobile(profileData));

                // Update stored user data
                await StorageManager.setItem(
                    constant.shareInstanceKey.userData,
                    normalizeUserData(profileData)
                );

                return true;
            }
            return false;
        } catch (error) {
            console.error('Error loading user data from API:', error);
            return false;
        }
    }, []);

    const loadUserData = useCallback(async () => {
        try {
            const token = await StorageManager.getItem(constant.shareInstanceKey.authToken);

            if (token) {
                // Try to fetch from API
                const success = await loadUserDataFromAPI(token);

                // Fallback to storage if API fails
                if (!success) {
                    await loadUserDataFromStorage();
                }
            } else {
                // No token, load from storage
                await loadUserDataFromStorage();
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            // Final fallback to storage
            await loadUserDataFromStorage();
        }
    }, [loadUserDataFromAPI, loadUserDataFromStorage]);

    // ============================================================================
    // EFFECTS
    // ============================================================================
    useEffect(() => {
        loadUserData();
    }, [loadUserData]);

    // ============================================================================
    // NAVIGATION HANDLERS
    // ============================================================================
    const handleMenuPress = useCallback(
        (route: string) => {
            switch (route) {
                case 'Addresses':
                    navigation.navigate(constant.routeName.addressList);
                    break;
                case 'MyOrders':
                    navigation.navigate(constant.routeName.orders);
                    break;
                default:
                    // Future: Implement navigation for other routes when available
                    if (__DEV__) {
                        console.log('Navigate to:', route);
                    }
                    break;
            }
        },
        [navigation]
    );

    // ============================================================================
    // LOGOUT HANDLERS
    // ============================================================================
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

    // ============================================================================
    // RENDER
    // ============================================================================
    return (
        <MainContainer
            statusBarColor={colors.themePrimary}
            statusBarStyle="light-content"
            isInternetRequired={false}
        >
            <View
                style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}
            >
                {/* Header */}
                <ProfileHeader
                    userName={userName}
                    userMobile={userMobile}
                    userInitial={userInitial}
                />

                {/* Menu Items */}
                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Menu Sections */}
                    {MENU_SECTIONS.map((section, sectionIndex) => (
                        <MenuSectionComponent
                            key={sectionIndex}
                            section={section}
                            onMenuPress={handleMenuPress}
                        />
                    ))}

                    {/* Logout Button */}
                    <LogoutButton loading={loading} onPress={handleLogout} />

                    {/* Version Info */}
                    <VersionInfo />
                </ScrollView>
            </View>
        </MainContainer>
    );
};

ProfileScreen.displayName = 'ProfileScreen';

export default memo(ProfileScreen);

// ============================================================================
// STYLES
// ============================================================================
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