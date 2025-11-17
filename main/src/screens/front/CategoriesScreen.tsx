import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Image, TextInput } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MainContainer from '../../container/MainContainer';
import { useTheme } from '../../contexts/ThemeProvider';
import fonts from '../../styles/fonts';
import AppTouchableRipple from '../../components/AppTouchableRipple';
import ApiManager from '../../managers/ApiManager';
import StorageManager from '../../managers/StorageManager';
import constant from '../../utilities/constant';
import { CategoryDetailScreenProps } from './CategoryDetailScreen';
import EmptyData, { EmptyDataType } from '../../components/EmptyData';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
    navigation: NativeStackNavigationProp<any>;
}

interface Category {
    id: number;
    name: string;
    description: string;
    product_count: number;
    image_url: string;
    created_at: string;
    updated_at: string;
}

// Separate CategoryCard component to properly use useState
interface CategoryCardProps {
    item: Category;
    onPress: (category: Category) => void;
    colors: any;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ item, onPress, colors }) => {
    const [imageError, setImageError] = useState<boolean>(false);

    return (
        <AppTouchableRipple
            style={[styles.categoryCard, { backgroundColor: colors.backgroundSecondary }]}
            onPress={() => onPress(item)}
        >
            {/* Category Image */}
            <View style={styles.imageContainer}>
                {item.image_url && !imageError ? (
                    <Image
                        source={{ uri: item.image_url }}
                        style={styles.categoryImage}
                        resizeMode="cover"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <View style={[styles.imagePlaceholder, { backgroundColor: colors.themePrimaryLight }]}>
                        <Icon name="image-off" size={32} color={colors.themePrimary} />
                    </View>
                )}

                {/* Product Count Badge */}
                <View style={[styles.countBadge, { backgroundColor: colors.themePrimary }]}>
                    <Icon name="package-variant" size={14} color={colors.white} />
                    <Text style={styles.countBadgeText}>{item.product_count}</Text>
                </View>
            </View>

            {/* Category Info */}
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
};

const CategoriesScreen: React.FC<Props> = ({ navigation }) => {
    const colors = useTheme();
    const insets = useSafeAreaInsets();

    const [categories, setCategories] = useState<Category[]>([]);
    const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Load categories on screen focus
    useFocusEffect(
        useCallback(() => {
            fetchCategories();
        }, [])
    );

    const fetchCategories = async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const token = await StorageManager.getItem(constant.shareInstanceKey.authToken);

            const response = await ApiManager.get({
                endpoint: constant.apiEndPoints.allCategories,
                token: token || undefined,
            });

            console.log('✅ Categories Response:', response);

            if (response?.success && response?.data && Array.isArray(response.data)) {
                setCategories(response.data);
                setFilteredCategories(response.data);
            } else if (response?.data && Array.isArray(response.data)) {
                setCategories(response.data);
                setFilteredCategories(response.data);
            } else {
                setCategories([]);
                setFilteredCategories([]);
            }
        } catch (error: any) {
            console.error('❌ Fetch Categories Error:', error);
            setCategories([]);
            setFilteredCategories([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (query.trim() === '') {
            setFilteredCategories(categories);
        } else {
            const filtered = categories.filter(
                (category) =>
                    category.name.toLowerCase().includes(query.toLowerCase()) ||
                    category.description.toLowerCase().includes(query.toLowerCase())
            );
            setFilteredCategories(filtered);
        }
    };

    const handleRefresh = () => {
        fetchCategories(true);
    };

    const handleCategoryPress = (category: Category) => {
        const propsToSend: CategoryDetailScreenProps = {
            categoryId: category.id,
            categoryName: category.name
        };
        // Navigate to products by category
        navigation.navigate(constant.routeName.categoryDetail, propsToSend);
    };

    const renderCategoryItem = ({ item }: { item: Category }) => (
        <CategoryCard item={item} onPress={handleCategoryPress} colors={colors} />
    );

    return (
        <MainContainer
            statusBarColor={colors.themePrimary}
            statusBarStyle="dark-content"
            isInternetRequired={true}
            showLoader={loading && !refreshing}
        >
            <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: colors.themePrimary }]}>
                    <View style={styles.headerTop}>
                        <View>
                            <Text style={[styles.headerTitle, { color: colors.white }]}>
                                Categories
                            </Text>
                            <Text style={[styles.headerSubtitle, { color: colors.white }]}>
                                {filteredCategories.length} {filteredCategories.length === 1 ? 'category' : 'categories'} available
                            </Text>
                        </View>
                    </View>

                    {/* Search Bar */}
                    <View style={[styles.searchContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                        <Icon name="magnify" size={20} color={colors.white} />
                        <TextInput
                            style={[styles.searchInput, { color: colors.white }]}
                            placeholder="Search categories..."
                            placeholderTextColor="rgba(255,255,255,0.7)"
                            value={searchQuery}
                            onChangeText={handleSearch}
                        />
                        {searchQuery.length > 0 && (
                            <AppTouchableRipple onPress={() => handleSearch('')}>
                                <Icon name="close-circle" size={20} color={colors.white} />
                            </AppTouchableRipple>
                        )}
                    </View>
                </View>

                {/* Categories Grid */}
                {!loading && filteredCategories.length === 0 ? (
                    <EmptyData
                        type={EmptyDataType.NO_RECORDS}
                        title={searchQuery ? 'No Categories Found' : 'No Categories Available'}
                        description={searchQuery ? 'Try adjusting your search' : 'Categories will appear here'}
                    />
                ) : (
                    <FlatList
                        data={filteredCategories}
                        renderItem={renderCategoryItem}
                        keyExtractor={(item) => item.id.toString()}
                        numColumns={2}
                        contentContainerStyle={{ ...styles.listContainer, paddingBottom: 32 + insets.bottom }}
                        columnWrapperStyle={styles.gridRow}
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

export default CategoriesScreen;

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
    headerTop: {
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: fonts.size.font28,
        fontFamily: fonts.family.primaryBold,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.secondaryRegular,
        opacity: 0.9,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: fonts.size.font15,
        fontFamily: fonts.family.primaryRegular,
        padding: 0,
    },
    listContainer: {
        padding: 16,
        paddingBottom: 32,
    },
    gridRow: {
        gap: 12,
    },
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