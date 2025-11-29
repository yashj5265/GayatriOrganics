import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MainContainer from '../../container/MainContainer';
import { useTheme } from '../../contexts/ThemeProvider';
import fonts from '../../styles/fonts';
import AppTouchableRipple from '../../components/AppTouchableRipple';
import EmptyData, { EmptyDataType } from '../../components/EmptyData';
import { useWishlist, WishlistItem } from '../../contexts/WishlistContext';
import { useCart } from '../../contexts/CardContext';
import { ProductDetailScreenProps } from './ProductDetailScreen';
import { ProductGridItem, ProductListItem } from '../../components/listItems';
import constant from '../../utilities/constant';

interface WishlistScreenNavigationProps {
    navigation: NativeStackNavigationProp<any>;
}

const WishlistScreen: React.FC<WishlistScreenNavigationProps> = ({ navigation }) => {
    const colors = useTheme();
    const insets = useSafeAreaInsets();
    const { wishlistItems, removeFromWishlist, isInWishlist } = useWishlist();
    const { addToCart, isInCart } = useCart();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        setTimeout(() => {
            setRefreshing(false);
        }, 1000);
    }, []);

    const handleProductPress = useCallback((product: WishlistItem) => {
        const propsToSend: ProductDetailScreenProps = {
            productId: product.id
        };
        navigation.navigate(constant.routeName.productDetail, propsToSend);
    }, [navigation]);

    const handleAddToCart = useCallback((product: WishlistItem) => {
        if (product.stock === 0) return;

        addToCart({
            id: product.id,
            name: product.name,
            price: parseFloat(product.price),
            image: product.image1,
            unit: 'pc',
            quantity: 1
        });
    }, [addToCart]);

    const handleRemoveFromWishlist = useCallback((productId: number) => {
        removeFromWishlist(productId);
    }, [removeFromWishlist]);

    const handleToggleFavorite = useCallback((product: WishlistItem) => {
        if (isInWishlist(product.id)) {
            handleRemoveFromWishlist(product.id);
        } else {
            // This shouldn't happen in wishlist screen, but handle it anyway
        }
    }, [isInWishlist, handleRemoveFromWishlist]);

    // Convert WishlistItem to Product format for list items
    const convertToProduct = useCallback((item: WishlistItem) => {
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
    }, []);

    const renderGridItem = useCallback(({ item }: { item: WishlistItem }) => (
        <ProductGridItem
            item={convertToProduct(item)}
            onPress={handleProductPress}
            onAddToCart={handleAddToCart}
            isInCart={isInCart(item.id)}
            colors={colors}
            onToggleFavorite={handleToggleFavorite}
            isFavorite={isInWishlist(item.id)}
        />
    ), [handleProductPress, handleAddToCart, isInCart, colors, handleToggleFavorite, isInWishlist, convertToProduct]);

    const renderListItem = useCallback(({ item }: { item: WishlistItem }) => (
        <ProductListItem
            item={convertToProduct(item)}
            onPress={handleProductPress}
            onAddToCart={handleAddToCart}
            isInCart={isInCart(item.id)}
            colors={colors}
            onToggleFavorite={handleToggleFavorite}
            isFavorite={isInWishlist(item.id)}
        />
    ), [handleProductPress, handleAddToCart, isInCart, colors, handleToggleFavorite, isInWishlist, convertToProduct]);

    const listContentStyle = useMemo(() => ({
        ...styles.listContainer,
        paddingBottom: 100 + insets.bottom
    }), [insets.bottom]);

    return (
        <MainContainer
            statusBarColor={colors.themePrimary}
            statusBarStyle="light-content"
            isInternetRequired={false}
            showLoader={false}
        >
            <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: colors.themePrimary }]}>
                    <View style={styles.headerTop}>
                        <AppTouchableRipple
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Icon name="arrow-left" size={24} color={colors.white} />
                        </AppTouchableRipple>

                        <View style={styles.headerCenter}>
                            <Text style={[styles.headerTitle, { color: colors.white }]}>
                                My Wishlist
                            </Text>
                            <Text style={[styles.headerSubtitle, { color: colors.white }]}>
                                {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'}
                            </Text>
                        </View>

                        <AppTouchableRipple
                            style={styles.viewToggle}
                            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                        >
                            <Icon
                                name={viewMode === 'grid' ? 'view-list' : 'view-grid'}
                                size={24}
                                color={colors.white}
                            />
                        </AppTouchableRipple>
                    </View>
                </View>

                {/* Wishlist List/Grid */}
                {wishlistItems.length === 0 ? (
                    <EmptyData
                        type={EmptyDataType.NO_RECORDS}
                        title="Your Wishlist is Empty"
                        description="Start adding products to your wishlist to save them for later"
                    />
                ) : (
                    <FlatList
                        data={wishlistItems}
                        renderItem={viewMode === 'grid' ? renderGridItem : renderListItem}
                        keyExtractor={(item) => item.id.toString()}
                        numColumns={viewMode === 'grid' ? 3 : 1}
                        key={viewMode}
                        contentContainerStyle={listContentStyle}
                        columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
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

export default WishlistScreen;

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
        paddingBottom: 10
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

