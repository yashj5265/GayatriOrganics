import React, { useState, useCallback, useMemo, memo } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import MainContainer from '../../container/MainContainer';
import { useTheme } from '../../contexts/ThemeProvider';
import { useWishlist, WishlistItem } from '../../contexts/WishlistContext';
import { useCart } from '../../contexts/CardContext';
import AppTouchableRipple from '../../components/AppTouchableRipple';
import EmptyData, { EmptyDataType } from '../../components/EmptyData';
import { ProductGridItem, ProductListItem } from '../../components/listItems';
import fonts from '../../styles/fonts';
import constant from '../../utilities/constant';
import { ProductDetailScreenProps } from './ProductDetailScreen';

// ============================================================================
// CONSTANTS
// ============================================================================
const GRID_COLUMNS = 3;
const REFRESH_TIMEOUT_MS = 1000;

// ============================================================================
// TYPES
// ============================================================================
interface WishlistScreenNavigationProps {
    navigation: NativeStackNavigationProp<any>;
}

type ViewMode = 'grid' | 'list';

interface WishlistHeaderProps {
    itemCount: number;
    viewMode: ViewMode;
    onBack: () => void;
    onToggleView: () => void;
}

interface Product {
    id: number;
    category_id: number;
    name: string;
    description: string;
    price: string;
    stock: number;
    image1: string;
    image2: string | null;
    image3: string | null;
    image4: string | null;
    image5: string | null;
    created_at: string;
    updated_at: string;
    category: any;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
const getItemWord = (count: number): string => {
    return count === 1 ? 'item' : 'items';
};

const convertWishlistItemToProduct = (item: WishlistItem): Product => {
    return {
        ...item,
        category_id: item.category_id,
        image2: null,
        image3: null,
        image4: null,
        image5: null,
        created_at: '',
        updated_at: '',
    };
};

// ============================================================================
// SUB COMPONENTS
// ============================================================================
const WishlistHeader = memo(({
    itemCount,
    viewMode,
    onBack,
    onToggleView,
}: WishlistHeaderProps) => {
    const colors = useTheme();

    return (
        <View style={[styles.header, { backgroundColor: colors.themePrimary }]}>
            <View style={styles.headerTop}>
                <AppTouchableRipple style={styles.backButton} onPress={onBack}>
                    <Icon name="arrow-left" size={24} color={colors.white} />
                </AppTouchableRipple>

                <View style={styles.headerCenter}>
                    <Text style={[styles.headerTitle, { color: colors.white }]}>
                        My Wishlist
                    </Text>
                    <Text style={[styles.headerSubtitle, { color: colors.white }]}>
                        {itemCount} {getItemWord(itemCount)}
                    </Text>
                </View>

                <AppTouchableRipple style={styles.viewToggle} onPress={onToggleView}>
                    <Icon
                        name={viewMode === 'grid' ? 'view-list' : 'view-grid'}
                        size={24}
                        color={colors.white}
                    />
                </AppTouchableRipple>
            </View>
        </View>
    );
});

const EmptyWishlist = memo(() => (
    <EmptyData
        type={EmptyDataType.NO_RECORDS}
        title="Your Wishlist is Empty"
        description="Start adding products to your wishlist to save them for later"
    />
));

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const WishlistScreen: React.FC<WishlistScreenNavigationProps> = ({ navigation }) => {
    const colors = useTheme();
    const insets = useSafeAreaInsets();
    const { wishlistItems, removeFromWishlist, isInWishlist } = useWishlist();
    const { addToCart, isInCart } = useCart();

    // ============================================================================
    // STATE
    // ============================================================================
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [refreshing, setRefreshing] = useState(false);

    // ============================================================================
    // COMPUTED VALUES
    // ============================================================================
    const listContentStyle = useMemo(
        () => ({
            ...styles.listContainer,
            paddingBottom: 100 + insets.bottom,
        }),
        [insets.bottom]
    );

    const hasItems = wishlistItems.length > 0;

    // ============================================================================
    // HANDLERS
    // ============================================================================
    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        setTimeout(() => {
            setRefreshing(false);
        }, REFRESH_TIMEOUT_MS);
    }, []);

    const handleToggleView = useCallback(() => {
        setViewMode((prev) => (prev === 'grid' ? 'list' : 'grid'));
    }, []);

    const handleGoBack = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    const handleProductPress = useCallback(
        (product: WishlistItem) => {
            const propsToSend: ProductDetailScreenProps = {
                productId: product.id,
            };
            navigation.navigate(constant.routeName.productDetail, propsToSend);
        },
        [navigation]
    );

    const handleAddToCart = useCallback(
        (product: WishlistItem) => {
            if (product.stock === 0) return;

            addToCart({
                id: product.id,
                name: product.name,
                price: parseFloat(product.price),
                image: product.image1,
                unit: 'pc',
                quantity: 1,
                categoryId: product.category_id || product.category?.id,
                productId: product.id,
            });
        },
        [addToCart]
    );

    const handleToggleFavorite = useCallback(
        (product: WishlistItem) => {
            // In wishlist screen, this always removes from wishlist
            removeFromWishlist(product.id);
        },
        [removeFromWishlist]
    );

    // ============================================================================
    // RENDER FUNCTIONS
    // ============================================================================
    const renderGridItem = useCallback(
        ({ item }: { item: WishlistItem }) => (
            <ProductGridItem
                item={convertWishlistItemToProduct(item)}
                onPress={handleProductPress}
                onAddToCart={handleAddToCart}
                isInCart={isInCart(item.id)}
                colors={colors}
                onToggleFavorite={handleToggleFavorite}
                isFavorite={isInWishlist(item.id)}
            />
        ),
        [
            handleProductPress,
            handleAddToCart,
            isInCart,
            colors,
            handleToggleFavorite,
            isInWishlist,
        ]
    );

    const renderListItem = useCallback(
        ({ item }: { item: WishlistItem }) => (
            <ProductListItem
                item={convertWishlistItemToProduct(item)}
                onPress={handleProductPress}
                onAddToCart={handleAddToCart}
                isInCart={isInCart(item.id)}
                colors={colors}
                onToggleFavorite={handleToggleFavorite}
                isFavorite={isInWishlist(item.id)}
            />
        ),
        [
            handleProductPress,
            handleAddToCart,
            isInCart,
            colors,
            handleToggleFavorite,
            isInWishlist,
        ]
    );

    const keyExtractor = useCallback(
        (item: WishlistItem) => item.id.toString(),
        []
    );

    // ============================================================================
    // RENDER
    // ============================================================================
    return (
        <MainContainer
            statusBarColor={colors.themePrimary}
            statusBarStyle="light-content"
            isInternetRequired={false}
            showLoader={false}
        >
            <View
                style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}
            >
                {/* Header */}
                <WishlistHeader
                    itemCount={wishlistItems.length}
                    viewMode={viewMode}
                    onBack={handleGoBack}
                    onToggleView={handleToggleView}
                />

                {/* Wishlist List/Grid */}
                {!hasItems ? (
                    <EmptyWishlist />
                ) : (
                    <FlatList
                        data={wishlistItems}
                        renderItem={viewMode === 'grid' ? renderGridItem : renderListItem}
                        keyExtractor={keyExtractor}
                        numColumns={viewMode === 'grid' ? GRID_COLUMNS : 1}
                        key={viewMode}
                        contentContainerStyle={listContentStyle}
                        columnWrapperStyle={
                            viewMode === 'grid' ? styles.gridRow : undefined
                        }
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={handleRefresh}
                                colors={[colors.themePrimary]}
                                tintColor={colors.themePrimary}
                            />
                        }
                    />
                )}
            </View>
        </MainContainer>
    );
};

export default memo(WishlistScreen);

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
        paddingBottom: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 10,
    },
    backButton: {
        padding: 4,
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: fonts.size.font22,
        fontFamily: fonts.family.primaryBold,
    },
    headerSubtitle: {
        fontSize: fonts.size.font13,
        fontFamily: fonts.family.secondaryRegular,
        opacity: 0.9,
        marginTop: 2,
    },
    viewToggle: {
        padding: 4,
    },
    listContainer: {
        padding: 12,
    },
    gridRow: {
        gap: 8,
        justifyContent: 'space-between',
    },
});