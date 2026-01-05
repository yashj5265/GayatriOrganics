import React, { useState, useCallback, useMemo, memo } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppTouchableRipple from '../AppTouchableRipple';
import { AppColors } from '../../styles/colors';
import fonts from '../../styles/fonts';
import { getImageUrl, formatUnitDisplay } from './utils';
import { Product } from '../../screens/front/CategoryDetailScreen';

export interface ProductCardProps {
    product: Product;
    onPress: (productId: number) => void;
    colors: AppColors;
}

const ProductCard: React.FC<ProductCardProps> = memo(({ product, onPress, colors }) => {
    const [imageError, setImageError] = useState(false);

    const handleImageError = useCallback(() => {
        setImageError(true);
    }, []);

    const handlePress = useCallback(() => {
        onPress(product.id);
    }, [product.id, onPress]);

    const productPrice = useMemo(() => parseFloat(product.price).toFixed(2), [product.price]);

    return (
        <AppTouchableRipple
            style={[styles.productCard, { backgroundColor: colors.backgroundSecondary }]}
            onPress={handlePress}
        >
            <View style={styles.productImageContainer}>
                {product.image1 && !imageError ? (
                    <Image
                        source={{ uri: getImageUrl(product.image1) }}
                        style={styles.productImage}
                        resizeMode="cover"
                        onError={handleImageError}
                    />
                ) : (
                    <View style={[styles.productImagePlaceholder, { backgroundColor: colors.themePrimaryLight }]}>
                        <Icon name="image-off" size={24} color={colors.themePrimary} />
                    </View>
                )}
            </View>

            <View style={styles.productInfo}>
                <Text style={[styles.productName, { color: colors.textPrimary }]} numberOfLines={2}>
                    {product.name}
                </Text>
                <Text style={[styles.productPrice, { color: colors.themePrimary }]}>
                    ₹{productPrice}
                </Text>
                {product.unit_type && (
                    <Text style={[styles.unitText, { color: colors.textDescription }]}>
                        Per {formatUnitDisplay(product.unit_type, product.unit_value)}
                    </Text>
                )}
                {product.stock > 0 ? (
                    <Text style={[styles.productStock, { color: '#4CAF50' }]}>
                        In Stock
                    </Text>
                ) : (
                    <Text style={[styles.productStock, { color: '#FF5252' }]}>
                        Out of Stock
                    </Text>
                )}
            </View>
        </AppTouchableRipple>
    );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;

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
    productPrice: {
        fontSize: fonts.size.font16,
        fontFamily: fonts.family.primaryBold,
        marginBottom: 2,
    },
    unitText: {
        fontSize: fonts.size.font10,
        fontFamily: fonts.family.secondaryRegular,
        marginBottom: 4,
    },
    productStock: {
        fontSize: fonts.size.font11,
        fontFamily: fonts.family.primaryMedium,
    },
});

