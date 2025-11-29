import React, { useState, useCallback, useMemo, memo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppColors } from '../../styles/colors';
import fonts from '../../styles/fonts';
import { getImageUrl, getStockStatus } from './utils';
import { Product } from '../../screens/front/ProductListScreen';

export interface ProductListItemProps {
    item: Product;
    onPress: (product: Product) => void;
    onAddToCart: (product: Product) => void;
    isInCart: boolean;
    colors: AppColors;
    onToggleFavorite?: (product: Product) => void;
    isFavorite?: boolean;
}

const ProductListItem: React.FC<ProductListItemProps> = memo(({
    item,
    onPress,
    onAddToCart,
    isInCart,
    colors,
    onToggleFavorite,
    isFavorite = false
}) => {
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
        ...styles.listCard,
        backgroundColor: colors.backgroundSecondary
    }), [colors.backgroundSecondary]);

    return (
        <TouchableOpacity
            style={cardStyle}
            onPress={handlePress}
            activeOpacity={0.8}
        >
            <View style={styles.listContent}>
                <View style={styles.listImageContainer}>
                    {item.image1 && !imageError ? (
                        <Image
                            source={{ uri: getImageUrl(item.image1) }}
                            style={styles.listImage}
                            resizeMode="cover"
                            onError={handleImageError}
                        />
                    ) : (
                        <View style={[styles.listImagePlaceholder, { backgroundColor: colors.themePrimaryLight }]}>
                            <Icon name="image-off" size={28} color={colors.themePrimary} />
                        </View>
                    )}

                    <View style={[styles.listStockBadge, { backgroundColor: stockStatus.bgColor }]}>
                        <Text style={[styles.listStockBadgeText, { color: stockStatus.color }]}>
                            {item.stock}
                        </Text>
                    </View>

                    {onToggleFavorite && (
                        <TouchableOpacity
                            style={styles.favoriteButton}
                            onPress={handleFavoritePress}
                            activeOpacity={0.7}
                            onPressIn={(e) => e.stopPropagation()}
                        >
                            <Icon
                                name={isFavorite ? "heart" : "heart-outline"}
                                size={18}
                                color={isFavorite ? "#FF5252" : colors.themePrimary}
                            />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.listInfo}>
                    <View style={[styles.categoryTag, { backgroundColor: colors.themePrimaryLight, alignSelf: 'flex-start' }]}>
                        <Text style={[styles.categoryTagText, { color: colors.themePrimary }]} numberOfLines={1}>
                            {item.category.name}
                        </Text>
                    </View>

                    <Text style={[styles.listProductName, { color: colors.textPrimary }]} numberOfLines={1}>
                        {item.name}
                    </Text>

                    <Text style={[styles.listDescription, { color: colors.textDescription }]} numberOfLines={2}>
                        {item.description}
                    </Text>

                    <View style={styles.listFooter}>
                        <View>
                            <Text style={[styles.priceLabel, { color: colors.textLabel }]}>Price</Text>
                            <Text style={[styles.listPrice, { color: colors.themePrimary }]}>
                                ₹{productPrice}
                            </Text>
                        </View>

                        <View style={styles.listActions}>
                            <View style={[styles.stockStatus, { backgroundColor: stockStatus.bgColor }]}>
                                <Icon name="package-variant" size={12} color={stockStatus.color} />
                                <Text style={[styles.stockStatusText, { color: stockStatus.color }]}>
                                    {stockStatus.label}
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
                                    size={20}
                                    color={isInCart ? colors.white : colors.themePrimary}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
});

ProductListItem.displayName = 'ProductListItem';

export default ProductListItem;

const styles = StyleSheet.create({
    listCard: {
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    listContent: {
        flexDirection: 'row',
        gap: 12,
    },
    listImageContainer: {
        width: 100,
        height: 100,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    listImage: {
        width: '100%',
        height: '100%',
    },
    listImagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    listStockBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 10,
        minWidth: 24,
        alignItems: 'center',
    },
    listStockBadgeText: {
        fontSize: fonts.size.font10,
        fontFamily: fonts.family.primaryBold,
    },
    favoriteButton: {
        position: 'absolute',
        top: 6,
        left: 6,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.9)',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    listInfo: {
        flex: 1,
        gap: 4,
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
    listProductName: {
        fontSize: fonts.size.font16,
        fontFamily: fonts.family.primaryBold,
    },
    listDescription: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.secondaryRegular,
        lineHeight: 16,
    },
    listFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: 'auto',
    },
    priceLabel: {
        fontSize: fonts.size.font9,
        fontFamily: fonts.family.secondaryRegular,
        marginBottom: 2,
    },
    listPrice: {
        fontSize: fonts.size.font18,
        fontFamily: fonts.family.primaryBold,
    },
    listActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    stockStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 10,
        gap: 3,
    },
    stockStatusText: {
        fontSize: fonts.size.font9,
        fontFamily: fonts.family.primaryBold,
    },
    cartButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
});

