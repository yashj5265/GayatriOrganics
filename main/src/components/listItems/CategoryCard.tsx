import React, { useState, useCallback, memo } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppTouchableRipple from '../AppTouchableRipple';
import { AppColors } from '../../styles/colors';
import fonts from '../../styles/fonts';
import { Category } from '../../screens/front/CategoriesScreen';

export interface CategoryCardProps {
    item: Category;
    onPress: (category: Category) => void;
    colors: AppColors;
}

const CategoryCard: React.FC<CategoryCardProps> = memo(({ item, onPress, colors }) => {
    const [imageError, setImageError] = useState<boolean>(false);

    const handleImageError = useCallback(() => {
        setImageError(true);
    }, []);

    const handlePress = useCallback(() => {
        onPress(item);
    }, [item, onPress]);

    return (
        <AppTouchableRipple
            style={[styles.categoryCard, { backgroundColor: colors.backgroundSecondary }]}
            onPress={handlePress}
        >
            <View style={styles.imageContainer}>
                {item.image_url && !imageError ? (
                    <Image
                        source={{ uri: item.image_url }}
                        style={styles.categoryImage}
                        resizeMode="cover"
                        onError={handleImageError}
                    />
                ) : (
                    <View style={[styles.imagePlaceholder, { backgroundColor: colors.themePrimaryLight }]}>
                        <Icon name="image-off" size={32} color={colors.themePrimary} />
                    </View>
                )}

                <View style={[styles.countBadge, { backgroundColor: colors.themePrimary }]}>
                    <Icon name="package-variant" size={14} color={colors.white} />
                    <Text style={styles.countBadgeText}>{item.product_count}</Text>
                </View>
            </View>

            <View style={styles.categoryInfo}>
                <Text style={[styles.categoryName, { color: colors.textPrimary }]} numberOfLines={2}>
                    {item.name}
                </Text>

                {item.description && (
                    <Text
                        style={[styles.categoryDescription, { color: colors.textDescription }]}
                        numberOfLines={2}
                    >
                        {item.description}
                    </Text>
                )}

                <View style={styles.categoryFooter}>
                    <Text style={[styles.productCountText, { color: colors.textLabel }]}>
                        {item.product_count} {item.product_count === 1 ? 'item' : 'items'}
                    </Text>
                    <Icon name="chevron-right" size={20} color={colors.themePrimary} />
                </View>
            </View>
        </AppTouchableRipple>
    );
});

CategoryCard.displayName = 'CategoryCard';

export default CategoryCard;

const styles = StyleSheet.create({
    categoryCard: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
    },
    imageContainer: {
        width: '100%',
        height: 140,
        position: 'relative',
    },
    categoryImage: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    countBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        gap: 4,
    },
    countBadgeText: {
        color: '#FFFFFF',
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.primaryBold,
    },
    categoryInfo: {
        padding: 12,
    },
    categoryName: {
        fontSize: fonts.size.font16,
        fontFamily: fonts.family.primaryBold,
        marginBottom: 6,
        minHeight: 42,
    },
    categoryDescription: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.secondaryRegular,
        lineHeight: 16,
        marginBottom: 8,
        minHeight: 32,
    },
    categoryFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    productCountText: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.primaryMedium,
    },
});

