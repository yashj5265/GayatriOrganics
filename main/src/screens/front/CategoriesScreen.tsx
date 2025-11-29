import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TextInput } from 'react-native';
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
import { CategoryCard } from '../../components/listItems';
import { useVoiceSearch } from '../../hooks/useVoiceSearch';
import VoiceSearchButton from '../../components/VoiceSearchButton';

interface CategoriesScreenProps {
    navigation: NativeStackNavigationProp<any>;
}

export interface Category {
    id: number;
    name: string;
    description: string;
    product_count: number;
    image_url: string;
    created_at: string;
    updated_at: string;
}


const CategoriesScreen: React.FC<CategoriesScreenProps> = ({ navigation }) => {
    const colors = useTheme();
    const insets = useSafeAreaInsets();

    const [categories, setCategories] = useState<Category[]>([]);
    const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const searchInputRef = React.useRef<TextInput>(null);

    const fetchCategories = useCallback(async (isRefresh = false) => {
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
    }, []);

    // Load categories on screen focus
    useFocusEffect(
        useCallback(() => {
            fetchCategories();
        }, [fetchCategories])
    );

    // Memoize filtered categories based on search query
    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredCategories(categories);
        } else {
            const filtered = categories.filter(
                (category) =>
                    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    category.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredCategories(filtered);
        }
    }, [searchQuery, categories]);

    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
    }, []);

    const handleVoiceResult = useCallback((text: string) => {
        console.log('Voice result received:', text);
        setSearchQuery(text);
        // Optionally focus the input after voice search
        setTimeout(() => {
            searchInputRef.current?.focus();
        }, 100);
    }, []);

    const handleVoiceError = useCallback((error: Error) => {
        console.error('Voice search error:', error);
    }, []);

    const { isListening, isAvailable, startListening, stopListening } = useVoiceSearch({
        onResult: handleVoiceResult,
        onError: handleVoiceError,
        language: 'en-US',
    });

    const handleVoiceButtonPress = useCallback(() => {
        console.log('Voice button pressed, isListening:', isListening);
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    }, [isListening, startListening, stopListening]);

    const handleRefresh = useCallback(() => {
        fetchCategories(true);
    }, [fetchCategories]);

    const handleCategoryPress = useCallback((category: Category) => {
        const propsToSend: CategoryDetailScreenProps = {
            categoryId: category.id,
            categoryName: category.name
        };
        navigation.navigate(constant.routeName.categoryDetail, propsToSend);
    }, [navigation]);

    const renderCategoryItem = useCallback(({ item }: { item: Category }) => (
        <CategoryCard item={item} onPress={handleCategoryPress} colors={colors} />
    ), [handleCategoryPress, colors]);

    const listContentStyle = useMemo(() => ({
        ...styles.listContainer,
        paddingBottom: 32 + insets.bottom
    }), [insets.bottom]);

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
                            ref={searchInputRef}
                            style={[styles.searchInput, { color: colors.white }]}
                            placeholder="Search categories..."
                            placeholderTextColor="rgba(255,255,255,0.7)"
                            value={searchQuery}
                            onChangeText={handleSearch}
                        />
                        <VoiceSearchButton
                            isListening={isListening}
                            isAvailable={isAvailable}
                            onPress={handleVoiceButtonPress}
                            colors={colors}
                            size={20}
                            showLabel={true}
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
                        contentContainerStyle={listContentStyle}
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
});