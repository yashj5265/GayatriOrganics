import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Dimensions } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MainContainer from '../../container/MainContainer';
import { useTheme } from '../../contexts/ThemeProvider';
import fonts from '../../styles/fonts';
import AppTouchableRipple from '../../components/AppTouchableRipple';
import ApiManager from '../../managers/ApiManager';
import StorageManager from '../../managers/StorageManager';
import constant from '../../utilities/constant';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProductCard } from '../../components/listItems';

export interface CategoryDetailScreenProps {
    categoryId: number;
    categoryName?: string;
}

interface CategoryDetailScreenNavigationProps {
    navigation: NativeStackNavigationProp<any>;
    route: RouteProp<{ params: CategoryDetailScreenProps }, 'params'>;
}

export interface Product {
    id: number;
    name: string;
    description: string;
    price: string;
    stock: number;
    image1: string;
}

export interface CategoryDetail {
    id: number;
    name: string;
    description: string;
    image_url: string;
    product_count: number;
    created_at: string;
    updated_at: string;
    products?: Product[];
}

const { width } = Dimensions.get('window');
const HEADER_IMAGE_HEIGHT = 240;

const CategoryDetailScreen: React.FC<CategoryDetailScreenNavigationProps> = ({ navigation, route }) => {
    const colors = useTheme();
    const insets = useSafeAreaInsets();

    const { categoryId } = route.params;
    const [category, setCategory] = useState<CategoryDetail | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [imageError, setImageError] = useState<boolean>(false);

    const fetchCategoryDetail = useCallback(async () => {
        setLoading(true);
        try {
            const token = await StorageManager.getItem(constant.shareInstanceKey.authToken);

            const response = await ApiManager.get({
                endpoint: `${constant.apiEndPoints.getCategory}/${categoryId}`,
                token: token || undefined,
                showError: true,
            });

            if (response?.success && response?.data) {
                setCategory(response.data);
            } else if (response?.data) {
                setCategory(response.data);
            } else {
                navigation.goBack();
            }
        } catch (error: any) {
            console.error('❌ Fetch Category Detail Error:', error);
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    }, [categoryId, navigation]);

    useEffect(() => {
        fetchCategoryDetail();
    }, [fetchCategoryDetail]);

    const handleImageError = useCallback(() => {
        setImageError(true);
    }, []);

    const handleViewAllProducts = useCallback(() => {
        if (category) {
            navigation.navigate('CategoryProducts', {
                categoryId: category.id,
                categoryName: category.name,
            });
        }
    }, [category, navigation]);

    const handleProductPress = useCallback((productId: number) => {
        navigation.navigate('ProductDetail', { productId });
    }, [navigation]);

    const scrollContentStyle = useMemo(() => ({
        ...styles.scrollContent,
        paddingBottom: 32 + insets.bottom
    }), [insets.bottom]);

    if (loading || !category) {
        return (
            <MainContainer
                statusBarColor="transparent"
                statusBarStyle="light-content"
                isInternetRequired={true}
                showLoader={true}
            >
                <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]} />
            </MainContainer>
        );
    }

    return (
        <MainContainer
            statusBarColor="transparent"
            statusBarStyle="light-content"
            isInternetRequired={true}
        >
            <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={scrollContentStyle}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header Image */}
                    <View style={styles.headerImageContainer}>
                        {category.image_url && !imageError ? (
                            <Image
                                source={{ uri: category.image_url }}
                                style={styles.headerImage}
                                resizeMode="cover"
                                onError={handleImageError}
                            />
                        ) : (
                            <View style={[styles.headerImagePlaceholder, { backgroundColor: colors.themePrimaryLight }]}>
                                <Icon name="image-off" size={64} color={colors.themePrimary} />
                            </View>
                        )}

                        {/* Gradient Overlay */}
                        <View style={styles.gradientOverlay} />

                        {/* Back Button */}
                        <AppTouchableRipple
                            style={[styles.backButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
                            onPress={() => navigation.goBack()}
                        >
                            <Icon name="arrow-left" size={24} color="#FFFFFF" />
                        </AppTouchableRipple>

                        {/* Category Badge */}
                        <View style={[styles.categoryBadge, { backgroundColor: colors.themePrimary }]}>
                            <Icon name="package-variant" size={16} color={colors.white} />
                            <Text style={styles.categoryBadgeText}>
                                {category.product_count} {category.product_count === 1 ? 'Product' : 'Products'}
                            </Text>
                        </View>
                    </View>

                    {/* Category Info Card */}
                    <View style={[styles.infoCard, { backgroundColor: colors.backgroundPrimary }]}>
                        <Text style={[styles.categoryName, { color: colors.textPrimary }]}>
                            {category.name}
                        </Text>

                        {category.description && (
                            <Text style={[styles.categoryDescription, { color: colors.textDescription }]}>
                                {category.description}
                            </Text>
                        )}

                        {/* Quick Stats */}
                        <View style={styles.statsContainer}>
                            <View style={[styles.statItem, { backgroundColor: colors.backgroundSecondary }]}>
                                <Icon name="package-variant-closed" size={24} color={colors.themePrimary} />
                                <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                                    {category.product_count}
                                </Text>
                                <Text style={[styles.statLabel, { color: colors.textLabel }]}>
                                    Products
                                </Text>
                            </View>

                            <View style={[styles.statItem, { backgroundColor: colors.backgroundSecondary }]}>
                                <Icon name="leaf" size={24} color="#4CAF50" />
                                <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                                    100%
                                </Text>
                                <Text style={[styles.statLabel, { color: colors.textLabel }]}>
                                    Organic
                                </Text>
                            </View>

                            {/* <View style={[styles.statItem, { backgroundColor: colors.backgroundSecondary }]}>
                                <Icon name="star" size={24} color="#FFC107" />
                                <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                                    4.8
                                </Text>
                                <Text style={[styles.statLabel, { color: colors.textLabel }]}>
                                    Rating
                                </Text>
                            </View> */}
                        </View>

                        {/* View All Button */}
                        {category.product_count > 0 && (
                            <AppTouchableRipple
                                style={[styles.viewAllButton, { backgroundColor: colors.themePrimary }]}
                                onPress={handleViewAllProducts}
                            >
                                <Text style={[styles.viewAllButtonText, { color: colors.white }]}>
                                    View All Products
                                </Text>
                                <Icon name="arrow-right" size={20} color={colors.white} />
                            </AppTouchableRipple>
                        )}
                    </View>

                    {/* Featured Products Section */}
                    {category.products && category.products.length > 0 && (
                        <View style={styles.productsSection}>
                            <View style={styles.sectionHeader}>
                                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                                    Featured Products
                                </Text>
                                <AppTouchableRipple onPress={handleViewAllProducts}>
                                    <Text style={[styles.seeAllText, { color: colors.themePrimary }]}>
                                        See All →
                                    </Text>
                                </AppTouchableRipple>
                            </View>

                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.productsScroll}
                            >
                                {category.products.slice(0, 5).map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        onPress={handleProductPress}
                                        colors={colors}
                                    />
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* About Section */}
                    <View style={[styles.aboutSection, { backgroundColor: colors.backgroundSecondary }]}>
                        <Icon name="information" size={24} color={colors.themePrimary} />
                        <View style={styles.aboutContent}>
                            <Text style={[styles.aboutTitle, { color: colors.textPrimary }]}>
                                About This Category
                            </Text>
                            <Text style={[styles.aboutText, { color: colors.textDescription }]}>
                                All products in this category are 100% organic, fresh, and sourced directly from local farms.
                                We ensure the highest quality standards for your health and wellbeing.
                            </Text>
                        </View>
                    </View>

                    {/* Benefits Section */}
                    <View style={styles.benefitsSection}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                            Why Choose Organic?
                        </Text>

                        <View style={[styles.benefitItem, { backgroundColor: colors.backgroundSecondary }]}>
                            <View style={[styles.benefitIcon, { backgroundColor: colors.themePrimaryLight }]}>
                                <Icon name="leaf" size={24} color={colors.themePrimary} />
                            </View>
                            <View style={styles.benefitContent}>
                                <Text style={[styles.benefitTitle, { color: colors.textPrimary }]}>
                                    100% Chemical Free
                                </Text>
                                <Text style={[styles.benefitText, { color: colors.textDescription }]}>
                                    No pesticides or harmful chemicals used
                                </Text>
                            </View>
                        </View>

                        <View style={[styles.benefitItem, { backgroundColor: colors.backgroundSecondary }]}>
                            <View style={[styles.benefitIcon, { backgroundColor: colors.themePrimaryLight }]}>
                                <Icon name="heart-pulse" size={24} color={colors.themePrimary} />
                            </View>
                            <View style={styles.benefitContent}>
                                <Text style={[styles.benefitTitle, { color: colors.textPrimary }]}>
                                    Nutrient Rich
                                </Text>
                                <Text style={[styles.benefitText, { color: colors.textDescription }]}>
                                    Higher nutritional value and better taste
                                </Text>
                            </View>
                        </View>

                        <View style={[styles.benefitItem, { backgroundColor: colors.backgroundSecondary }]}>
                            <View style={[styles.benefitIcon, { backgroundColor: colors.themePrimaryLight }]}>
                                <Icon name="earth" size={24} color={colors.themePrimary} />
                            </View>
                            <View style={styles.benefitContent}>
                                <Text style={[styles.benefitTitle, { color: colors.textPrimary }]}>
                                    Eco-Friendly
                                </Text>
                                <Text style={[styles.benefitText, { color: colors.textDescription }]}>
                                    Sustainable farming practices
                                </Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </MainContainer>
    );
};

// Product Card Component

export default CategoryDetailScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 32,
    },

    // Header Image
    headerImageContainer: {
        width: '100%',
        height: HEADER_IMAGE_HEIGHT,
        position: 'relative',
    },
    headerImage: {
        width: '100%',
        height: '100%',
    },
    headerImagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    gradientOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryBadge: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    categoryBadgeText: {
        color: '#FFFFFF',
        fontSize: fonts.size.font13,
        fontFamily: fonts.family.primaryBold,
    },

    // Info Card
    infoCard: {
        marginTop: -20,
        marginHorizontal: 16,
        borderRadius: 20,
        padding: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    categoryName: {
        fontSize: fonts.size.font26,
        fontFamily: fonts.family.primaryBold,
        marginBottom: 8,
    },
    categoryDescription: {
        fontSize: fonts.size.font15,
        fontFamily: fonts.family.secondaryRegular,
        lineHeight: 22,
        marginBottom: 20,
    },

    // Stats
    statsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    statItem: {
        flex: 1,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    statValue: {
        fontSize: fonts.size.font20,
        fontFamily: fonts.family.primaryBold,
        marginTop: 8,
    },
    statLabel: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.secondaryRegular,
        marginTop: 4,
    },

    // View All Button
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    viewAllButtonText: {
        fontSize: fonts.size.font16,
        fontFamily: fonts.family.primaryBold,
    },

    // Products Section
    productsSection: {
        marginTop: 24,
        paddingHorizontal: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: fonts.size.font20,
        fontFamily: fonts.family.primaryBold,
    },
    seeAllText: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.primaryMedium,
    },
    productsScroll: {
        gap: 12,
        paddingRight: 16,
    },


    // About Section
    aboutSection: {
        marginHorizontal: 16,
        marginTop: 24,
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        gap: 16,
    },
    aboutContent: {
        flex: 1,
    },
    aboutTitle: {
        fontSize: fonts.size.font16,
        fontFamily: fonts.family.primaryBold,
        marginBottom: 8,
    },
    aboutText: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.secondaryRegular,
        lineHeight: 20,
    },

    // Benefits Section
    benefitsSection: {
        marginHorizontal: 16,
        marginTop: 24,
    },
    benefitItem: {
        flexDirection: 'row',
        borderRadius: 16,
        padding: 16,
        marginTop: 12,
        gap: 16,
    },
    benefitIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    benefitContent: {
        flex: 1,
    },
    benefitTitle: {
        fontSize: fonts.size.font15,
        fontFamily: fonts.family.primaryBold,
        marginBottom: 4,
    },
    benefitText: {
        fontSize: fonts.size.font13,
        fontFamily: fonts.family.secondaryRegular,
        lineHeight: 18,
    },
});