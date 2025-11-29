import React, { useRef, useEffect, useState, useCallback, useMemo, memo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Dimensions,
    TouchableOpacity,
    NativeScrollEvent,
    NativeSyntheticEvent,
} from 'react-native';
import { AppColors } from '../styles/colors';
import fonts from '../styles/fonts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTAINER_PADDING = 16; // Padding on each side
const BANNER_WIDTH = SCREEN_WIDTH - (CONTAINER_PADDING * 2);
const AUTO_SCROLL_INTERVAL = 3000; // 3 seconds

export interface Banner {
    id: number;
    title: string;
    subtitle: string;
    icon: string;
    backgroundColor: string;
    textColor: string;
    action?: () => void;
}

export interface BannerCarouselProps {
    banners: Banner[];
    colors: AppColors;
    onBannerPress?: (banner: Banner) => void;
}

const BannerCarousel: React.FC<BannerCarouselProps> = memo(({ banners, colors, onBannerPress }) => {
    const scrollViewRef = useRef<ScrollView>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const scrollToIndex = useCallback((index: number, animated = true) => {
        if (scrollViewRef.current && index >= 0 && index < banners.length) {
            const scrollX = index * (BANNER_WIDTH + CONTAINER_PADDING);
            scrollViewRef.current.scrollTo({
                x: scrollX,
                animated,
            });
        }
    }, [banners.length]);

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

    const stopAutoScroll = useCallback(() => {
        if (scrollIntervalRef.current) {
            clearInterval(scrollIntervalRef.current);
            scrollIntervalRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (banners.length > 1) {
            startAutoScroll();
        }
        return () => {
            stopAutoScroll();
        };
    }, [banners.length, startAutoScroll, stopAutoScroll]);

    const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const scrollDistance = BANNER_WIDTH + CONTAINER_PADDING;
        const index = Math.round(offsetX / scrollDistance);
        const clampedIndex = Math.max(0, Math.min(index, banners.length - 1));
        if (clampedIndex !== currentIndex) {
            setCurrentIndex(clampedIndex);
        }
    }, [currentIndex, banners.length]);

    const handleScrollBeginDrag = useCallback(() => {
        stopAutoScroll();
    }, [stopAutoScroll]);

    const handleScrollEndDrag = useCallback(() => {
        startAutoScroll();
    }, [startAutoScroll]);

    const handleBannerPress = useCallback((banner: Banner) => {
        if (banner.action) {
            banner.action();
        }
        onBannerPress?.(banner);
    }, [onBannerPress]);

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
                snapToInterval={BANNER_WIDTH + (CONTAINER_PADDING * 2)}
                snapToAlignment="start"
                contentContainerStyle={styles.scrollContent}
            >
                {banners.map((banner, index) => (
                    <TouchableOpacity
                        key={banner.id}
                        style={{
                            ...styles.banner,
                            width: BANNER_WIDTH,
                            backgroundColor: banner.backgroundColor || colors.themePrimaryLight,
                        }}
                        onPress={() => handleBannerPress(banner)}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.bannerIcon}>{banner.icon}</Text>
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
                    </TouchableOpacity>
                ))}
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

const styles = StyleSheet.create({
    container: {
        marginVertical: 16,
        paddingHorizontal: CONTAINER_PADDING,
    },
    scrollContent: {
        paddingRight: CONTAINER_PADDING,
    },
    banner: {
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 140,
        marginRight: CONTAINER_PADDING,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    bannerIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    bannerTitle: {
        fontSize: fonts.size.font20,
        fontFamily: fonts.family.primaryBold,
        marginBottom: 8,
        textAlign: 'center',
    },
    bannerSubtitle: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.secondaryRegular,
        textAlign: 'center',
        lineHeight: 20,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
        gap: 6,
    },
    paginationDot: {
        height: 8,
        borderRadius: 4,
        transition: 'all 0.3s ease',
    },
});

