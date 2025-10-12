import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MainContainer from '../../container/MainContainer';
import { useTheme } from '../../contexts/ThemeProvider';
import fonts from '../../styles/fonts';
import AppTouchableRipple from '../../components/AppTouchableRipple';

interface Props {
    navigation: NativeStackNavigationProp<any>;
}

const CategoriesScreen: React.FC<Props> = ({ navigation }) => {
    const colors = useTheme();

    const categories = [
        {
            id: 1,
            name: 'Leafy Vegetables',
            icon: '🥬',
            color: '#4caf50',
            productCount: 12,
        },
        {
            id: 2,
            name: 'Fresh Fruits',
            icon: '🍎',
            color: '#ff9800',
            productCount: 18,
        },
        {
            id: 3,
            name: 'Dairy Products',
            icon: '🥛',
            color: '#2196f3',
            productCount: 8,
        },
        {
            id: 4,
            name: 'Grains & Pulses',
            icon: '🌾',
            color: '#795548',
            productCount: 15,
        },
        {
            id: 5,
            name: 'Root Vegetables',
            icon: '🥕',
            color: '#ff5722',
            productCount: 10,
        },
        {
            id: 6,
            name: 'Herbs & Spices',
            icon: '🌿',
            color: '#8bc34a',
            productCount: 20,
        },
    ];

    return (
        <MainContainer
            statusBarColor={colors.themePrimary}
            statusBarStyle="light-content"
            isInternetRequired={false}
        >
            <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: colors.themePrimary }]}>
                    <Text style={[styles.headerTitle, { color: colors.white }]}>
                        Categories
                    </Text>
                    <Text style={[styles.headerSubtitle, { color: colors.white }]}>
                        Browse by category
                    </Text>
                </View>

                {/* Categories Grid */}
                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.categoriesGrid}>
                        {categories.map((category) => (
                            <AppTouchableRipple
                                key={category.id}
                                style={[
                                    styles.categoryCard,
                                    { backgroundColor: colors.backgroundSecondary },
                                ]}
                                onPress={() =>
                                    console.log('Navigate to products:', category.name)
                                }
                            >
                                <View
                                    style={[
                                        styles.iconContainer,
                                        { backgroundColor: category.color + '20' },
                                    ]}
                                >
                                    <Text style={styles.categoryIcon}>{category.icon}</Text>
                                </View>
                                <Text
                                    style={[styles.categoryName, { color: colors.textPrimary }]}
                                    numberOfLines={2}
                                >
                                    {category.name}
                                </Text>
                                <Text style={[styles.productCount, { color: colors.textLabel }]}>
                                    {category.productCount} items
                                </Text>
                            </AppTouchableRipple>
                        ))}
                    </View>
                </ScrollView>
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
        paddingBottom: 30,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerTitle: {
        fontSize: fonts.size.font24,
        fontFamily: fonts.family.primaryBold,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.secondaryRegular,
        opacity: 0.9,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
    },
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    categoryCard: {
        width: '47%',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    categoryIcon: {
        fontSize: 40,
    },
    categoryName: {
        fontSize: fonts.size.font15,
        fontFamily: fonts.family.primaryBold,
        textAlign: 'center',
        marginBottom: 4,
        minHeight: 36,
    },
    productCount: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.secondaryRegular,
    },
});