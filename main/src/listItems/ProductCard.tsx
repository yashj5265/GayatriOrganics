import React, { useState, useCallback, useMemo, memo } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppTouchableRipple from '../components/AppTouchableRipple';
import { AppColors } from '../styles/colors';
import fonts from '../styles/fonts';
import { getImageUrl } from './utils';
import { Product } from '../screens/front/CategoryDetailScreen';

// ============================================================================
// TYPES
// ============================================================================
export interface ProductCardProps {
    product: Product;
    onPress: (productId: number) => void;
    colors: AppColors;
}

// Note: Ensure Product interface includes actual_price
// export interface Product {
//     // ... existing fields
//     price: string;
//     actual_price?: string;  // Make sure this is added
//     // ... rest of fields
// }

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
const formatPrice = (price: string | number): string => {
    return `₹${parseFloat(price.toString()).toFixed(2)}`;
};

const shouldShowActualPrice = (actualPrice?: string, currentPrice?: string): boolean => {
    if (!actualPrice || actualPrice === '0' || actualPrice === '0.00') return false;
    if (!currentPrice) return false;
    return parseFloat(actualPrice) !== parseFloat(currentPrice);
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================
const PriceDisplay = memo(({
    price,
    actualPrice,
    colors,
}: {
    price: string;
    actualPrice?: string;
    colors: AppColors;
}) => {
    const showActualPrice = shouldShowActualPrice(actualPrice, price);

    return (
        <View style={styles.priceContainer}>
            {showActualPrice && (
                <Text style={[styles.actualPrice, { color: colors.textGrey }]}>
                    {formatPrice(actualPrice!)}
                </Text>
            )}
            <Text style={[styles.productPrice, { color: colors.themePrimary }]}>
                {formatPrice(price)}
            </Text>
        </View>
    );
});

PriceDisplay.displayName = 'PriceDisplay';

const StockBadge = memo(({
    stock,
    colors,
}: {
    stock: number;
    colors: AppColors;
}) => {
    const isInStock = stock > 0;
    const stockColor = isInStock ? '#4CAF50' : '#FF5252';
    const stockLabel = isInStock ? 'In Stock' : 'Out of Stock';
    const stockIcon = isInStock ? 'check-circle' : 'close-circle';

    return (
        <View style={styles.stockBadgeContainer}>
            <Icon name={stockIcon} size={12} color={stockColor} />
            <Text style={[styles.productStock, { color: stockColor }]}>
                {stockLabel}
            </Text>
        </View>
    );
});

StockBadge.displayName = 'StockBadge';

const ProductImage = memo(({
    imageUrl,
    hasError,
    onError,
    colors,
}: {
    imageUrl?: string;
    hasError: boolean;
    onError: () => void;
    colors: AppColors;
}) => {
    if (imageUrl && !hasError) {
        return (
            <Image
                source={{ uri: getImageUrl(imageUrl) }}
                style={styles.productImage}
                resizeMode="cover"
                onError={onError}
            />
        );
    }

    return (
        <View style={[styles.productImagePlaceholder, { backgroundColor: colors.themePrimaryLight }]}>
            <Icon name="image-off" size={24} color={colors.themePrimary} />
        </View>
    );
});

ProductImage.displayName = 'ProductImage';

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const ProductCard: React.FC<ProductCardProps> = memo(({ product, onPress, colors }) => {
    const [imageError, setImageError] = useState(false);

    const handleImageError = useCallback(() => {
        setImageError(true);
    }, []);

    const handlePress = useCallback(() => {
        onPress(product.id);
    }, [product.id, onPress]);

    const cardStyle = useMemo(
        () => [styles.productCard, { backgroundColor: colors.backgroundSecondary }],
        [colors.backgroundSecondary]
    );

    return (
        <AppTouchableRipple style={cardStyle} onPress={handlePress}>
            <View style={styles.productImageContainer}>
                <ProductImage
                    imageUrl={product.image1}
                    hasError={imageError}
                    onError={handleImageError}
                    colors={colors}
                />
            </View>

            <View style={styles.productInfo}>
                <Text style={[styles.productName, { color: colors.textPrimary }]} numberOfLines={2}>
                    {product.name}
                </Text>

                <PriceDisplay
                    price={product.price}
                    actualPrice={product.actual_price}
                    colors={colors}
                />

                <StockBadge stock={product.stock} colors={colors} />
            </View>
        </AppTouchableRipple>
    );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
    productCard: {
        width: 160,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    productImageContainer: {
        width: '100%',
        height: 140,
    },
    productImage: {
        width: '100%',
        height: '100%',
    },
    productImagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    productInfo: {
        padding: 12,
    },
    productName: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.primaryBold,
        marginBottom: 6,
        minHeight: 36,
    },
    priceContainer: {
        marginBottom: 6,
    },
    actualPrice: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.primaryMedium,
        textDecorationLine: 'line-through',
        marginBottom: 2,
    },
    productPrice: {
        fontSize: fonts.size.font16,
        fontFamily: fonts.family.primaryBold,
    },
    stockBadgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    productStock: {
        fontSize: fonts.size.font11,
        fontFamily: fonts.family.primaryMedium,
    },
});