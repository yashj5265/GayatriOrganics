import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MainContainer from '../../container/MainContainer';
import { useTheme } from '../../contexts/ThemeProvider';
import fonts from '../../styles/fonts';
import AppTouchableRipple from '../../components/AppTouchableRipple';
import StorageManager from '../../managers/StorageManager';
import constant from '../../utilities/constant';
import { useCart } from '../../contexts/CardContext';

interface Props {
    navigation: NativeStackNavigationProp<any>;
}

const HomeScreen: React.FC<Props> = ({ navigation }) => {
    const colors = useTheme();
    const { addToCart, isInCart, cartCount } = useCart();
    const [userName, setUserName] = useState<string>('Guest');

    useEffect(() => {
        loadUserData();
    }, []);

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

    const categories = [
        { id: 1, name: 'Vegetables', icon: '🥬', color: '#4caf50' },
        { id: 2, name: 'Fruits', icon: '🍎', color: '#ff9800' },
        { id: 3, name: 'Grains', icon: '🌾', color: '#795548' },
        { id: 4, name: 'Dairy', icon: '🥛', color: '#2196f3' },
    ];

    const featuredProducts = [
        { id: 1, name: 'Fresh Spinach', price: 40, image: '🥬', unit: 'bunch' },
        { id: 2, name: 'Organic Tomatoes', price: 60, image: '🍅', unit: 'kg' },
        { id: 3, name: 'Farm Fresh Milk', price: 50, image: '🥛', unit: 'liter' },
        { id: 4, name: 'Green Beans', price: 45, image: '🫘', unit: 'kg' },
        { id: 5, name: 'Fresh Carrots', price: 35, image: '🥕', unit: 'kg' },
        { id: 6, name: 'Organic Apples', price: 120, image: '🍎', unit: 'kg' },
    ];

    const handleAddToCart = (product: typeof featuredProducts[0]) => {
        if (isInCart(product.id)) {
            // Navigate to cart if already added
            navigation.navigate('Cart');
        } else {
            // Add to cart
            addToCart({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                unit: product.unit,
            });
            Alert.alert(
                'Added to Cart',
                `${product.name} has been added to your cart`,
                [
                    { text: 'Continue Shopping', style: 'cancel' },
                    { text: 'View Cart', onPress: () => navigation.navigate('Cart') },
                ]
            );
        }
    };

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
                        <View>
                            <Text style={[styles.greeting, { color: colors.white }]}>
                                Hello,
                            </Text>
                            <Text style={[styles.userName, { color: colors.white }]}>
                                {userName}! 👋
                            </Text>
                        </View>
                        {cartCount > 0 && (
                            <AppTouchableRipple
                                style={[styles.cartButton, { backgroundColor: colors.white }]}
                                onPress={() => navigation.navigate('Cart')}
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

                {/* Banner */}
                <View style={[styles.banner, { backgroundColor: colors.themePrimaryLight }]}>
                    <Text style={[styles.bannerTitle, { color: colors.themePrimary }]}>
                        🌿 100% Organic
                    </Text>
                    <Text style={[styles.bannerText, { color: colors.textDescription }]}>
                        Fresh from farm to your doorstep
                    </Text>
                </View>

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
                        {categories.map((category) => (
                            <AppTouchableRipple
                                key={category.id}
                                style={[
                                    styles.categoryCard,
                                    { backgroundColor: colors.backgroundSecondary },
                                ]}
                                onPress={() => navigation.navigate('Categories')}
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
                        <AppTouchableRipple onPress={() => navigation.navigate('Categories')}>
                            <Text style={[styles.viewAll, { color: colors.themePrimary }]}>
                                View All
                            </Text>
                        </AppTouchableRipple>
                    </View>

                    <View style={styles.productsGrid}>
                        {featuredProducts.map((product) => {
                            const inCart = isInCart(product.id);
                            return (
                                <View
                                    key={product.id}
                                    style={[
                                        styles.productCard,
                                        { backgroundColor: colors.backgroundSecondary },
                                    ]}
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
                                            style={[
                                                styles.addButton,
                                                {
                                                    backgroundColor: inCart
                                                        ? colors.themePrimary
                                                        : colors.themePrimaryLight,
                                                },
                                            ]}
                                            onPress={() => handleAddToCart(product)}
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
                                </View>
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
        paddingBottom: 30,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
        top: -2,
        right: -2,
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    cartBadgeText: {
        fontSize: fonts.size.font11,
        fontFamily: fonts.family.primaryBold,
    },
    banner: {
        margin: 20,
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
    },
    bannerTitle: {
        fontSize: fonts.size.font22,
        fontFamily: fonts.family.primaryBold,
        marginBottom: 4,
    },
    bannerText: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.secondaryRegular,
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
});