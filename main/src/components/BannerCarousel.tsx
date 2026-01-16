import React, { useRef, useEffect, useState, useCallback, memo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Dimensions,
    TouchableOpacity,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Image,
} from 'react-native';
import { AppColors } from '../styles/colors';
import fonts from '../styles/fonts';

// ============================================================================
// CONSTANTS
// ============================================================================

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HORIZONTAL_PADDING = 20; // Match HomeScreen section padding
const BANNER_SPACING = 16;
const BANNER_WIDTH = SCREEN_WIDTH - (HORIZONTAL_PADDING * 2);
const AUTO_SCROLL_INTERVAL = 3000; // 3 seconds

// ============================================================================
// TYPES
// ============================================================================

export interface Banner {
    id: number;
    title: string;
    subtitle: string;
    icon?: string;
    image?: string;
    image_url?: string;
    backgroundColor?: string;
    textColor?: string;
    link?: string;
    link_type?: string;
    action?: () => void;
}

export interface BannerCarouselProps {
    banners: Banner[];
    colors: AppColors;
    onBannerPress?: (banner: Banner) => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * BannerCarousel Component
 * Displays auto-scrolling banner carousel with pagination
 */
const BannerCarousel: React.FC<BannerCarouselProps> = memo(({
    banners,
    colors,
    onBannerPress
}) => {
    const scrollViewRef = useRef<ScrollView>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // ============================================================================
    // SCROLL HANDLERS
    // ============================================================================

    /**
     * Scrolls to specific banner index
     */
    const scrollToIndex = useCallback((index: number, animated = true) => {
        if (scrollViewRef.current && index >= 0 && index < banners.length) {
            const scrollX = index * (BANNER_WIDTH + BANNER_SPACING);
            scrollViewRef.current.scrollTo({
                x: scrollX,
                animated,
            });
        }
    }, [banners.length]);

    /**
     * Starts auto-scroll timer
     */
    const startAutoScroll = useCallback(() => {
        if (scrollIntervalRef.current) {
            clearInterval(scrollIntervalRef.current);
        }

        scrollIntervalRef.current = setInterval(() => {
            setCurrentIndex((prevIndex) => {
                const nextIndex = (prevIndex + 1) % banners.length;
                scrollToIndex(nextIndex);
                return nextIndex;
            });
        }, AUTO_SCROLL_INTERVAL);
    }, [banners.length, scrollToIndex]);

    /**
     * Stops auto-scroll timer
     */
    const stopAutoScroll = useCallback(() => {
        if (scrollIntervalRef.current) {
            clearInterval(scrollIntervalRef.current);
            scrollIntervalRef.current = null;
        }
    }, []);

    /**
     * Handles scroll event to update current index
     */
    const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / (BANNER_WIDTH + BANNER_SPACING));
        const clampedIndex = Math.max(0, Math.min(index, banners.length - 1));

        if (clampedIndex !== currentIndex) {
            setCurrentIndex(clampedIndex);
        }
    }, [currentIndex, banners.length]);

    /**
     * Stops auto-scroll when user starts dragging
     */
    const handleScrollBeginDrag = useCallback(() => {
        stopAutoScroll();
    }, [stopAutoScroll]);

    /**
     * Resumes auto-scroll when user stops dragging
     */
    const handleScrollEndDrag = useCallback(() => {
        startAutoScroll();
    }, [startAutoScroll]);

    /**
     * Handles banner press event
     */
    const handleBannerPress = useCallback((banner: Banner) => {
        if (banner.action) {
            banner.action();
        }
        onBannerPress?.(banner);
    }, [onBannerPress]);

    // ============================================================================
    // EFFECTS
    // ============================================================================

    useEffect(() => {
        if (banners.length > 1) {
            startAutoScroll();
        }
        return () => {
            stopAutoScroll();
        };
    }, [banners.length, startAutoScroll, stopAutoScroll]);

    // ============================================================================
    // RENDER
    // ============================================================================

    if (banners.length === 0) {
        return null;
    }

    return (
        <View style={styles.container}>
            <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled={false}
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                onScrollBeginDrag={handleScrollBeginDrag}
                onScrollEndDrag={handleScrollEndDrag}
                onMomentumScrollEnd={handleScroll}
                scrollEventThrottle={16}
                decelerationRate="fast"
                snapToInterval={BANNER_WIDTH + BANNER_SPACING}
                snapToAlignment="start"
                contentContainerStyle={styles.scrollContent}
            >
                {banners.map((banner) => {
                    const hasImage = !!(banner.image_url || banner.image);

                    return (
                        <TouchableOpacity
                            key={banner.id}
                            style={[
                                styles.banner,
                                {
                                    width: BANNER_WIDTH,
                                    backgroundColor: banner.backgroundColor || colors.themePrimaryLight,
                                    padding: hasImage ? 0 : 24, // No padding for image banners
                                },
                            ]}
                            onPress={() => handleBannerPress(banner)}
                            activeOpacity={0.8}
                        >
                            {hasImage ? (
                                <View style={styles.bannerImageContainer}>
                                    <Image
                                        source={{ uri: banner.image_url || banner.image }}
                                        style={styles.bannerImage}
                                        resizeMode="cover"
                                    />
                                    <View style={styles.bannerOverlay}>
                                        <Text
                                            style={[
                                                styles.bannerTitle,
                                                { color: banner.textColor || colors.white },
                                            ]}
                                        >
                                            {banner.title}
                                        </Text>
                                        <Text
                                            style={[
                                                styles.bannerSubtitle,
                                                { color: banner.textColor || colors.white },
                                            ]}
                                        >
                                            {banner.subtitle}
                                        </Text>
                                    </View>
                                </View>
                            ) : (
                                <>
                                    {banner.icon && <Text style={styles.bannerIcon}>{banner.icon}</Text>}
                                    <Text
                                        style={[
                                            styles.bannerTitle,
                                            { color: banner.textColor || colors.themePrimary },
                                        ]}
                                    >
                                        {banner.title}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.bannerSubtitle,
                                            { color: banner.textColor || colors.textDescription },
                                        ]}
                                    >
                                        {banner.subtitle}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Pagination Indicators */}
            {banners.length > 1 && (
                <View style={styles.pagination}>
                    {banners.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.paginationDot,
                                {
                                    backgroundColor:
                                        index === currentIndex
                                            ? colors.themePrimary
                                            : colors.border,
                                    width: index === currentIndex ? 24 : 8,
                                },
                            ]}
                        />
                    ))}
                </View>
            )}
        </View>
    );
});

BannerCarousel.displayName = 'BannerCarousel';

export default BannerCarousel;

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
    container: {
        marginVertical: 16,
    },
    scrollContent: {
        paddingHorizontal: HORIZONTAL_PADDING,
        paddingRight: HORIZONTAL_PADDING - BANNER_SPACING,
    },
    banner: {
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        height: 180, // Changed from minHeight to height
        marginRight: BANNER_SPACING,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        overflow: 'hidden',
    },
    bannerImageContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
    },
    bannerImage: {
        width: '100%',
        height: '100%',
    },
    bannerOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    bannerIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    bannerTitle: {
        fontSize: fonts.size.font24,
        fontFamily: fonts.family.primaryBold,
        marginBottom: 6,
        textAlign: 'center',
    },
    bannerSubtitle: {
        fontSize: fonts.size.font16,
        fontFamily: fonts.family.secondaryRegular,
        textAlign: 'center',
        lineHeight: 22,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
        gap: 8,
    },
    paginationDot: {
        height: 8,
        borderRadius: 4,
    },
});