import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Modal } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MainContainer from '../../container/MainContainer';
import { useTheme } from '../../contexts/ThemeProvider';
import fonts from '../../styles/fonts';
import AppTouchableRipple from '../../components/AppTouchableRipple';
import StorageManager from '../../managers/StorageManager';
import constant from '../../utilities/constant';
import { useCart } from '../../contexts/CardContext';
import { useAddress, Address } from '../../contexts/AddressContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { ProductListScreenProps } from './ProductListScreen';
import BannerCarousel, { Banner } from '../../components/BannerCarousel';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVoiceSearch } from '../../hooks/useVoiceSearch';
import VoiceSearchButton from '../../components/VoiceSearchButton';
import VoiceSearchOverlay from '../../components/VoiceSearchOverlay';

interface HomeScreenProps {
    navigation: NativeStackNavigationProp<any>;
}

interface Category {
    id: number;
    name: string;
    icon: string;
    color: string;
}

interface FeaturedProduct {
    id: number;
    name: string;
    price: number;
    image: string;
    unit: string;
}

const CATEGORIES: Category[] = [
    { id: 1, name: 'Vegetables', icon: '🥬', color: '#4caf50' },
    { id: 2, name: 'Fruits', icon: '🍎', color: '#ff9800' },
    { id: 3, name: 'Grains', icon: '🌾', color: '#795548' },
    { id: 4, name: 'Dairy', icon: '🥛', color: '#2196f3' },
];

const FEATURED_PRODUCTS: FeaturedProduct[] = [
    { id: 1, name: 'Fresh Spinach', price: 40, image: '🥬', unit: 'bunch' },
    { id: 2, name: 'Organic Tomatoes', price: 60, image: '🍅', unit: 'kg' },
    { id: 3, name: 'Farm Fresh Milk', price: 50, image: '🥛', unit: 'liter' },
    { id: 4, name: 'Green Beans', price: 45, image: '🫘', unit: 'kg' },
    { id: 5, name: 'Fresh Carrots', price: 35, image: '🥕', unit: 'kg' },
    { id: 6, name: 'Organic Apples', price: 120, image: '🍎', unit: 'kg' },
];

const BANNERS: Banner[] = [
    {
        id: 1,
        title: '🌿 100% Organic',
        subtitle: 'Fresh from farm to your doorstep',
        icon: '🌿',
        backgroundColor: '#E8F5E9',
        textColor: '#2E7D32',
    },
    {
        id: 2,
        title: '🚚 Free Delivery',
        subtitle: 'On orders above ₹500',
        icon: '🚚',
        backgroundColor: '#E3F2FD',
        textColor: '#1976D2',
    },
    {
        id: 3,
        title: '🎉 Special Offers',
        subtitle: 'Get up to 30% off on selected items',
        icon: '🎉',
        backgroundColor: '#FFF3E0',
        textColor: '#F57C00',
    },
    {
        id: 4,
        title: '💚 Farm Fresh',
        subtitle: 'Directly from local organic farms',
        icon: '💚',
        backgroundColor: '#F1F8E9',
        textColor: '#558B2F',
    },
];

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
    const colors = useTheme();
    const insets = useSafeAreaInsets();
    const { addToCart, isInCart, cartCount } = useCart();
    const { wishlistCount } = useWishlist();
    const { selectedAddress, addresses, selectAddress } = useAddress();
    const [userName, setUserName] = useState<string>('Guest');
    const [showAddressModal, setShowAddressModal] = useState(false);

    useEffect(() => {
        const loadUserData = async () => {
            try {
                const userData = await StorageManager.getItem(constant.shareInstanceKey.userData);
                if (userData && typeof userData === 'object' && 'name' in userData) {
                    setUserName(userData.name || 'Guest');
                }
            } catch (error) {
                console.error('Error loading user data:', error);
            }
        };
        loadUserData();
    }, []);

    const handleAddToCart = useCallback((product: FeaturedProduct) => {
        if (isInCart(product.id)) {
            navigation.navigate(constant.routeName.cart);
        } else {
            addToCart({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                unit: product.unit,
                quantity: 1
            });
            Alert.alert(
                'Added to Cart',
                `${product.name} has been added to your cart`,
                [
                    { text: 'Continue Shopping', style: 'cancel' },
                    { text: 'View Cart', onPress: () => navigation.navigate(constant.routeName.cart) },
                ]
            );
        }
    }, [isInCart, addToCart, navigation]);

    const handleSearchPress = useCallback(() => {
        const propsToSend: ProductListScreenProps = {
            focusSearch: true
        };
        navigation.navigate(constant.routeName.products, propsToSend);
    }, [navigation]);

    const handleVoiceResult = useCallback((text: string) => {
        console.log('Voice result received:', text);
        // Navigate to ProductListScreen with the voice search query
        const propsToSend: ProductListScreenProps = {
            focusSearch: true,
            initialQuery: text
        };
        navigation.navigate(constant.routeName.products, propsToSend);
    }, [navigation]);

    const handleVoiceError = useCallback((error: Error) => {
        console.error('Voice search error:', error);
    }, []);

    const { isListening, isAvailable, startListening, stopListening } = useVoiceSearch({
        onResult: handleVoiceResult,
        onError: handleVoiceError,
        language: 'en-US',
    });

    const handleVoiceButtonPress = useCallback(() => {
        console.log('Voice button pressed, isListening:', isListening);
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    }, [isListening, startListening, stopListening]);

    const handleViewAllProducts = useCallback(() => {
        navigation.navigate(constant.routeName.products);
    }, [navigation]);

    const handleCategoryPress = useCallback(() => {
        navigation.navigate(constant.routeName.categories);
    }, [navigation]);

    const handleBannerPress = useCallback((banner: Banner) => {
        // TODO: Implement banner actions based on banner type
        // For example:
        // if (banner.id === 1) {
        //     navigation.navigate('OrganicProducts');
        // } else if (banner.id === 2) {
        //     navigation.navigate('DeliveryInfo');
        // }
        console.log('Banner pressed:', banner.title);
    }, []);

    const handleAddressPress = useCallback(() => {
        if (addresses.length === 0) {
            navigation.navigate(constant.routeName.addEditAddress, { mode: 'add' });
        } else {
            setShowAddressModal(true);
        }
    }, [addresses.length, navigation]);

    const handleSelectAddress = useCallback(async (address: Address) => {
        try {
            await selectAddress(address.id);
            setShowAddressModal(false);
        } catch (error) {
            Alert.alert('Error', 'Failed to select address. Please try again.');
        }
    }, [selectAddress]);

    const handleManageAddresses = useCallback(() => {
        setShowAddressModal(false);
        navigation.navigate(constant.routeName.addressList);
    }, [navigation]);

    const handleWishlistPress = useCallback(() => {
        navigation.navigate(constant.routeName.wishlist);
    }, [navigation]);

    const formatAddress = useCallback((address: Address | null) => {
        if (!address) return 'No address selected';
        return `${address.addressLine1}, ${address.city}, ${address.state} - ${address.pincode}`;
    }, []);

    const getAddressTypeIcon = useCallback((type: string) => {
        switch (type) {
            case 'home':
                return 'home';
            case 'work':
                return 'briefcase';
            default:
                return 'map-marker';
        }
    }, []);

    return (
        <MainContainer
            statusBarColor={colors.themePrimary}
            statusBarStyle="light-content"
            isInternetRequired={false}
        >
            <ScrollView
                style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={[styles.header, { backgroundColor: colors.themePrimary }]}>
                    <View style={styles.headerContent}>
                        <View style={styles.userInfo}>
                            <Text style={[styles.greeting, { color: colors.white }]}>
                                Hello,
                            </Text>
                            <Text style={[styles.userName, { color: colors.white }]}>
                                {userName}! 👋
                            </Text>

                            {/* Address Display */}
                            <AppTouchableRipple
                                style={{ ...styles.addressContainer, backgroundColor: 'rgba(255,255,255,0.15)' }}
                                onPress={handleAddressPress}
                            >
                                <Icon name="map-marker" size={16} color={colors.white} />
                                <View style={styles.addressTextContainer}>
                                    <Text
                                        style={[styles.addressText, { color: colors.white }]}
                                        numberOfLines={1}
                                    >
                                        {formatAddress(selectedAddress)}
                                    </Text>
                                </View>
                                <Icon name="chevron-down" size={18} color={colors.white} />
                            </AppTouchableRipple>
                        </View>
                        <View style={styles.headerActions}>
                            <AppTouchableRipple
                                style={{ ...styles.wishlistButton, backgroundColor: 'rgba(255,255,255,0.15)' }}
                                onPress={handleWishlistPress}
                            >
                                <Icon name="heart" size={24} color={colors.white} />
                                {wishlistCount > 0 && (
                                    <View
                                        style={[
                                            styles.wishlistBadge,
                                            { backgroundColor: '#ff4444' },
                                        ]}
                                    >
                                        <Text style={[styles.wishlistBadgeText, { color: colors.white }]}>
                                            {wishlistCount}
                                        </Text>
                                    </View>
                                )}
                            </AppTouchableRipple>
                            {cartCount > 0 && (
                                <AppTouchableRipple
                                    style={{ ...styles.cartButton, backgroundColor: colors.white }}
                                    onPress={() => navigation.navigate(constant.routeName.cart)}
                                >
                                    <Text style={styles.cartIcon}>🛒</Text>
                                    <View
                                        style={[
                                            styles.cartBadge,
                                            { backgroundColor: '#ff4444' },
                                        ]}
                                    >
                                        <Text style={[styles.cartBadgeText, { color: colors.white }]}>
                                            {cartCount}
                                        </Text>
                                    </View>
                                </AppTouchableRipple>
                            )}
                        </View>
                    </View>
                </View>

                {/* Search Bar - Navigate to Product List */}
                <View style={[styles.searchContainer, { backgroundColor: 'rgba(112, 209, 152, 0.2)', borderColor: colors.themePrimary }]}>
                    <TouchableOpacity
                        style={styles.searchTouchable}
                        onPress={handleSearchPress}
                        activeOpacity={0.7}
                    >
                        <Icon name="magnify" size={20} color={colors.themePrimary} />
                        <Text style={[styles.searchPlaceholder, { color: colors.themePrimary }]}>
                            Search products
                        </Text>
                        <Icon name="arrow-right" size={20} color={colors.themePrimary} />
                    </TouchableOpacity>
                    <VoiceSearchButton
                        isListening={isListening}
                        isAvailable={isAvailable}
                        onPress={handleVoiceButtonPress}
                        colors={colors}
                        size={20}
                    />
                </View>

                {/* Banner Carousel */}
                <BannerCarousel
                    banners={BANNERS}
                    colors={colors}
                    onBannerPress={handleBannerPress}
                />

                {/* Categories */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                        Shop by Category
                    </Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoriesContainer}
                    >
                        {CATEGORIES.map((category) => (
                            <AppTouchableRipple
                                key={category.id}
                                style={{ ...styles.categoryCard, backgroundColor: colors.backgroundSecondary }}
                                onPress={handleCategoryPress}
                            >
                                <Text style={styles.categoryIcon}>{category.icon}</Text>
                                <Text style={[styles.categoryName, { color: colors.textPrimary }]}>
                                    {category.name}
                                </Text>
                            </AppTouchableRipple>
                        ))}
                    </ScrollView>
                </View>

                {/* Featured Products */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                            Featured Products
                        </Text>
                        <AppTouchableRipple onPress={handleViewAllProducts}>
                            <View style={styles.viewAllButton}>
                                <Text style={[styles.viewAll, { color: colors.themePrimary }]}>
                                    View All
                                </Text>
                                <Icon name="arrow-right" size={16} color={colors.themePrimary} />
                            </View>
                        </AppTouchableRipple>
                    </View>

                    <View style={styles.productsGrid}>
                        {FEATURED_PRODUCTS.map((product) => {
                            const inCart = isInCart(product.id);
                            return (
                                <AppTouchableRipple
                                    key={product.id}
                                    style={{ ...styles.productCard, backgroundColor: colors.backgroundSecondary }}
                                    onPress={() => {
                                        // TODO: Navigate to product detail when implemented
                                    }}
                                >
                                    <Text style={styles.productImage}>{product.image}</Text>
                                    <Text
                                        style={[styles.productName, { color: colors.textPrimary }]}
                                        numberOfLines={2}
                                    >
                                        {product.name}
                                    </Text>
                                    <Text style={[styles.productUnit, { color: colors.textLabel }]}>
                                        per {product.unit}
                                    </Text>
                                    <View style={styles.productFooter}>
                                        <Text
                                            style={[
                                                styles.productPrice,
                                                { color: colors.themePrimary },
                                            ]}
                                        >
                                            ₹{product.price}
                                        </Text>
                                        <AppTouchableRipple
                                            style={{
                                                ...styles.addButton,
                                                backgroundColor: inCart
                                                    ? colors.themePrimary
                                                    : colors.themePrimaryLight,
                                            }}
                                            onPress={(e) => {
                                                e?.stopPropagation();
                                                handleAddToCart(product);
                                            }}
                                        >
                                            <Text
                                                style={[
                                                    styles.addButtonText,
                                                    {
                                                        color: inCart
                                                            ? colors.white
                                                            : colors.themePrimary,
                                                    },
                                                ]}
                                            >
                                                {inCart ? '✓' : '+'}
                                            </Text>
                                        </AppTouchableRipple>
                                    </View>
                                </AppTouchableRipple>
                            );
                        })}
                    </View>
                </View>

                {/* Why Choose Us */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                        Why Choose Us?
                    </Text>
                    <View
                        style={[
                            styles.featuresCard,
                            { backgroundColor: colors.backgroundSecondary },
                        ]}
                    >
                        {[
                            { icon: '✅', text: '100% Organic Products' },
                            { icon: '🚚', text: 'Fast Home Delivery' },
                            { icon: '💰', text: 'Best Prices Guaranteed' },
                        ].map((feature, index) => (
                            <View key={index} style={styles.featureItem}>
                                <Text style={styles.featureIcon}>{feature.icon}</Text>
                                <Text
                                    style={[styles.featureText, { color: colors.textPrimary }]}
                                >
                                    {feature.text}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>

            {/* Address Selection Modal */}
            <Modal
                visible={showAddressModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowAddressModal(false)}
            >
                <View style={[styles.modalOverlay, { paddingTop: insets.top }]}>
                    <View style={[styles.modalContent, { backgroundColor: colors.backgroundPrimary }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                                Select Address
                            </Text>
                            <AppTouchableRipple onPress={() => setShowAddressModal(false)}>
                                <Icon name="close" size={24} color={colors.textPrimary} />
                            </AppTouchableRipple>
                        </View>

                        <ScrollView
                            style={styles.modalScrollView}
                            showsVerticalScrollIndicator={false}
                        >
                            {addresses.map((address) => (
                                <AppTouchableRipple
                                    key={address.id}
                                    style={{
                                        ...styles.addressOption,
                                        backgroundColor:
                                            selectedAddress?.id === address.id
                                                ? colors.themePrimaryLight
                                                : colors.backgroundSecondary,
                                        borderColor:
                                            selectedAddress?.id === address.id
                                                ? colors.themePrimary
                                                : colors.border,
                                    }}
                                    onPress={() => handleSelectAddress(address)}
                                >
                                    <View style={styles.addressOptionHeader}>
                                        <View style={styles.addressOptionLeft}>
                                            <Icon
                                                name={getAddressTypeIcon(address.addressType)}
                                                size={20}
                                                color={
                                                    selectedAddress?.id === address.id
                                                        ? colors.themePrimary
                                                        : colors.textLabel
                                                }
                                            />
                                            <View style={styles.addressOptionInfo}>
                                                <Text
                                                    style={[
                                                        styles.addressOptionType,
                                                        {
                                                            color:
                                                                selectedAddress?.id === address.id
                                                                    ? colors.themePrimary
                                                                    : colors.textPrimary,
                                                        },
                                                    ]}
                                                >
                                                    {address.addressType === 'home'
                                                        ? 'Home'
                                                        : address.addressType === 'work'
                                                            ? 'Work'
                                                            : 'Other'}
                                                    {address.isDefault && ' • Default'}
                                                </Text>
                                                <Text
                                                    style={[
                                                        styles.addressOptionText,
                                                        {
                                                            color:
                                                                selectedAddress?.id === address.id
                                                                    ? colors.textPrimary
                                                                    : colors.textDescription,
                                                        },
                                                    ]}
                                                    numberOfLines={2}
                                                >
                                                    {address.addressLine1}, {address.city}
                                                </Text>
                                            </View>
                                        </View>
                                        {selectedAddress?.id === address.id && (
                                            <Icon
                                                name="check-circle"
                                                size={24}
                                                color={colors.themePrimary}
                                            />
                                        )}
                                    </View>
                                </AppTouchableRipple>
                            ))}
                        </ScrollView>

                        <View style={styles.modalActions}>
                            <AppTouchableRipple
                                style={{ ...styles.modalButton, backgroundColor: colors.backgroundSecondary }}
                                onPress={handleManageAddresses}
                            >
                                <Icon name="map-marker-plus" size={20} color={colors.themePrimary} />
                                <Text style={[styles.modalButtonText, { color: colors.themePrimary }]}>
                                    Manage Addresses
                                </Text>
                            </AppTouchableRipple>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Voice Search Overlay */}
            <VoiceSearchOverlay
                visible={isListening}
                isListening={isListening}
                language="English (United States)"
                colors={colors}
                onClose={stopListening}
            />
        </MainContainer>
    );
};

export default HomeScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    userInfo: {
        flex: 1,
        marginRight: 12,
    },
    addressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginTop: 8,
        gap: 8,
    },
    addressTextContainer: {
        flex: 1,
    },
    addressText: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.secondaryRegular,
    },
    greeting: {
        fontSize: fonts.size.font16,
        fontFamily: fonts.family.secondaryRegular,
        opacity: 0.9,
    },
    userName: {
        fontSize: fonts.size.font28,
        fontFamily: fonts.family.primaryBold,
        marginTop: 4,
    },
    cartButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    cartIcon: {
        fontSize: 24,
    },
    cartBadge: {
        position: 'absolute',
        top: 5,
        right: 5,
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    cartBadgeText: {
        fontSize: fonts.size.font10,
        fontFamily: fonts.family.primaryBold,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    wishlistButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    wishlistBadge: {
        position: 'absolute',
        top: 5,
        right: 5,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    wishlistBadgeText: {
        fontSize: fonts.size.font10,
        fontFamily: fonts.family.primaryBold,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 5,
        gap: 12,
        borderWidth: 1,
        marginTop: 10,
        marginHorizontal: 10
    },
    searchTouchable: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    searchPlaceholder: {
        flex: 1,
        fontSize: fonts.size.font15,
        fontFamily: fonts.family.primaryRegular,
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: fonts.size.font18,
        fontFamily: fonts.family.primaryBold,
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    viewAll: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.primaryMedium,
    },
    categoriesContainer: {
        paddingVertical: 8,
        gap: 12,
    },
    categoryCard: {
        width: 100,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    categoryIcon: {
        fontSize: 40,
        marginBottom: 8,
    },
    categoryName: {
        fontSize: fonts.size.font13,
        fontFamily: fonts.family.primaryMedium,
        textAlign: 'center',
    },
    productsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    productCard: {
        width: '48%',
        padding: 12,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    productImage: {
        fontSize: 50,
        textAlign: 'center',
        marginBottom: 8,
    },
    productName: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.primaryMedium,
        marginBottom: 2,
        minHeight: 36,
    },
    productUnit: {
        fontSize: fonts.size.font11,
        fontFamily: fonts.family.secondaryRegular,
        marginBottom: 8,
    },
    productFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    productPrice: {
        fontSize: fonts.size.font16,
        fontFamily: fonts.family.primaryBold,
    },
    addButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonText: {
        fontSize: fonts.size.font20,
        fontFamily: fonts.family.primaryBold,
    },
    featuresCard: {
        borderRadius: 16,
        padding: 16,
        gap: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    featureIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    featureText: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.secondaryRegular,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
        paddingBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    modalTitle: {
        fontSize: fonts.size.font20,
        fontFamily: fonts.family.primaryBold,
    },
    modalScrollView: {
        maxHeight: 400,
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    addressOption: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 2,
    },
    addressOptionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    addressOptionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    addressOptionInfo: {
        flex: 1,
    },
    addressOptionType: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.primaryBold,
        marginBottom: 4,
    },
    addressOptionText: {
        fontSize: fonts.size.font13,
        fontFamily: fonts.family.secondaryRegular,
        lineHeight: 18,
    },
    modalActions: {
        paddingHorizontal: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
    },
    modalButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    modalButtonText: {
        fontSize: fonts.size.font16,
        fontFamily: fonts.family.primaryBold,
    },
});