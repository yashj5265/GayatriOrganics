import React, { useState, useCallback, useMemo, memo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppColors } from '../../styles/colors';
import fonts from '../../styles/fonts';
import { getImageUrl, getStockStatus } from './utils';
import { Product } from '../../screens/front/ProductListScreen';

export interface ProductGridItemProps {
    item: Product;
    onPress: (product: Product) => void;
    onAddToCart: (product: Product) => void;
    isInCart: boolean;
    colors: AppColors;
    onToggleFavorite?: (product: Product) => void;
    isFavorite?: boolean;
}

const ProductGridItem: React.FC<ProductGridItemProps> = memo(({ item, onPress, onAddToCart, isInCart, colors, onToggleFavorite, isFavorite = false }) => {
    const stockStatus = useMemo(() => getStockStatus(item.stock), [item.stock]);
    const [imageError, setImageError] = useState(false);

    const handleImageError = useCallback(() => {
        setImageError(true);
    }, []);

    const handlePress = useCallback(() => {
        onPress(item);
    }, [item, onPress]);

    const handleAddToCartPress = useCallback(() => {
        onAddToCart(item);
    }, [item, onAddToCart]);

    const handleFavoritePress = useCallback(() => {
        onToggleFavorite?.(item);
    }, [item, onToggleFavorite]);

    const productPrice = useMemo(() => parseFloat(item.price).toFixed(2), [item.price]);

    const cardStyle = useMemo(() => ({
        ...styles.gridCard,
        backgroundColor: colors.backgroundSecondary
    }), [colors.backgroundSecondary]);

    return (
        <TouchableOpacity
            style={cardStyle}
            onPress={handlePress}
            activeOpacity={0.8}
        >
            <View style={styles.gridImageContainer}>
                {item.image1 && !imageError ? (
                    <Image
                        source={{ uri: getImageUrl(item.image1) }}
                        style={styles.gridImage}
                        resizeMode="cover"
                        onError={handleImageError}
                    />
                ) : (
                    <View style={[styles.gridImagePlaceholder, { backgroundColor: colors.themePrimaryLight }]}>
                        <Icon name="image-off" size={32} color={colors.themePrimary} />
                    </View>
                )}

                <View style={[styles.stockBadge, { backgroundColor: stockStatus.bgColor }]}>
                    <Text style={[styles.stockBadgeText, { color: stockStatus.color }]}>
                        {item.stock}
                    </Text>
                </View>

                {onToggleFavorite && (
                    <TouchableOpacity
                        style={styles.wishlistBtn}
                        activeOpacity={0.7}
                        onPressIn={(e) => e.stopPropagation()}
                        onPress={handleFavoritePress}
                    >
                        <Icon
                            name={isFavorite ? "heart" : "heart-outline"}
                            size={16}
                            color={isFavorite ? "#FF5252" : colors.themePrimary}
                        />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.gridContent}>
                <View style={[styles.categoryTag, { backgroundColor: colors.themePrimaryLight }]}>
                    <Text style={[styles.categoryTagText, { color: colors.themePrimary }]} numberOfLines={1}>
                        {item.category.name}
                    </Text>
                </View>

                <Text style={[styles.gridProductName, { color: colors.textPrimary }]} numberOfLines={2}>
                    {item.name}
                </Text>

                <View style={[styles.stockStatus, { backgroundColor: stockStatus.bgColor }]}>
                    <Icon name="package-variant" size={12} color={stockStatus.color} />
                    <Text style={[styles.stockStatusText, { color: stockStatus.color }]}>
                        {stockStatus.label}
                    </Text>
                </View>

                <View style={styles.gridFooter}>
                    <View>
                        <Text style={[styles.priceLabel, { color: colors.textLabel }]}>Price</Text>
                        <Text style={[styles.gridPrice, { color: colors.themePrimary }]}>
                            ₹{productPrice}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.cartButton,
                            { 
                                backgroundColor: isInCart ? colors.themePrimary : colors.themePrimaryLight,
                                opacity: item.stock === 0 ? 0.5 : 1
                            }
                        ]}
                        onPress={handleAddToCartPress}
                        onPressIn={(e) => e.stopPropagation()}
                        disabled={item.stock === 0}
                        activeOpacity={0.7}
                    >
                        <Icon
                            name={isInCart ? "check" : "cart-plus"}
                            size={18}
                            color={isInCart ? colors.white : colors.themePrimary}
                        />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
});

ProductGridItem.displayName = 'ProductGridItem';

export default ProductGridItem;

const styles = StyleSheet.create({
    gridCard: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        marginHorizontal: 2,
    },
    gridImageContainer: {
        width: '100%',
        height: 120,
        position: 'relative',
    },
    gridImage: {
        width: '100%',
        height: '100%',
    },
    gridImagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stockBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 10,
        minWidth: 28,
        alignItems: 'center',
    },
    stockBadgeText: {
        fontSize: fonts.size.font10,
        fontFamily: fonts.family.primaryBold,
    },
    wishlistBtn: {
        position: 'absolute',
        top: 6,
        left: 6,
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.9)',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    gridContent: {
        padding: 8,
    },
    categoryTag: {
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 4,
        marginBottom: 6,
        alignSelf: 'flex-start',
    },
    categoryTagText: {
        fontSize: fonts.size.font9,
        fontFamily: fonts.family.primaryBold,
        textTransform: 'uppercase',
    },
    gridProductName: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.primaryBold,
        marginBottom: 6,
        minHeight: 32,
        lineHeight: 16,
    },
    stockStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 10,
        gap: 3,
        marginBottom: 6,
    },
    stockStatusText: {
        fontSize: fonts.size.font9,
        fontFamily: fonts.family.primaryBold,
    },
    gridFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    priceLabel: {
        fontSize: fonts.size.font9,
        fontFamily: fonts.family.secondaryRegular,
        marginBottom: 2,
    },
    gridPrice: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.primaryBold,
    },
    cartButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
});

