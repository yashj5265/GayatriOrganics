import React, { memo, useCallback, useEffect, useRef, useState, useMemo } from "react";
import {
    Animated,
    Dimensions,
    GestureResponderEvent,
    StyleSheet,
    TouchableWithoutFeedback,
    TouchableWithoutFeedbackProps,
    View,
    ViewStyle,
} from "react-native";

const { height, width } = Dimensions.get("window");
const INITIAL_RIPPLE_SIZE = 30;
const ANIMATION_DURATION = 750;
const MAX_SCALE = Math.max(height, width) / (INITIAL_RIPPLE_SIZE / 2);

interface RippleProps {
    onRemove: (id: string) => void;
    id: string;
    color: string;
    opacity: number;
    x: number;
    y: number;
    canRemove: boolean;
}

const Ripple: React.FC<RippleProps> = memo(({
    onRemove,
    id,
    color,
    opacity,
    x,
    y,
    canRemove,
}) => {
    const scale = useRef(new Animated.Value(1)).current;
    const opacityValue = useRef(new Animated.Value(opacity)).current;

    useEffect(() => {
        Animated.timing(scale, {
            toValue: MAX_SCALE,
            duration: ANIMATION_DURATION,
            useNativeDriver: true,
        }).start();
    }, [scale]);

    useEffect(() => {
        if (canRemove) {
            Animated.timing(opacityValue, {
                toValue: 0,
                duration: ANIMATION_DURATION,
                useNativeDriver: true,
            }).start(() => {
                setTimeout(() => onRemove(id), 0);
            });
        }
    }, [canRemove, opacityValue, onRemove, id]);

    const rippleStyle = useMemo(() => [
        styles.ripple,
        {
            backgroundColor: color,
            left: x - INITIAL_RIPPLE_SIZE / 2,
            top: y - INITIAL_RIPPLE_SIZE / 2,
            transform: [{ scale }],
            opacity: opacityValue,
        },
    ], [color, x, y, scale, opacityValue]);

    return (
        <Animated.View style={rippleStyle} />
    );
});

export interface AppTouchableRippleProps extends TouchableWithoutFeedbackProps {
    style?: ViewStyle;
    rippleColor?: string;
    rippleOpacity?: number;
    ripplePosition?: "foreground" | "background";
}

const DEFAULT_RIPPLE_COLOR = "#000";
const DEFAULT_RIPPLE_OPACITY = 0.1;
const DEFAULT_RIPPLE_POSITION: "foreground" = "foreground";

const AppTouchableRipple: React.FC<AppTouchableRippleProps> = memo(
    ({
        style,
        children,
        rippleColor = DEFAULT_RIPPLE_COLOR,
        rippleOpacity = DEFAULT_RIPPLE_OPACITY,
        ripplePosition = DEFAULT_RIPPLE_POSITION,
        onPressIn,
        onPressOut,
        ...rest
    }) => {
        const [ripples, setRipples] = useState<
            { id: string; x: number; y: number }[]
        >([]);
        const [pressedOut, setPressedOut] = useState(true);

        const handlePressIn = useCallback((e: GestureResponderEvent) => {
            const { locationX, locationY } = e.nativeEvent;

            requestAnimationFrame(() => {
                setRipples((prev) => [
                    ...prev,
                    {
                        id: Math.random().toString(),
                        x: locationX,
                        y: locationY,
                    },
                ]);
            });

            setPressedOut(false);
            onPressIn?.(e);
        }, [onPressIn]);

        const handlePressOut = useCallback((e: GestureResponderEvent) => {
            setPressedOut(true);
            onPressOut?.(e);
        }, [onPressOut]);

        const handleRemove = useCallback((id: string) => {
            setRipples((prev) => prev.filter((ripple) => ripple.id !== id));
        }, []);

        const containerStyle = useMemo(() => [style, styles.container], [style]);

        const showForeground = ripplePosition === "foreground";

        return (
            <TouchableWithoutFeedback
                {...rest}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
            >
                <View pointerEvents="box-only" style={containerStyle}>
                    {showForeground && children}
                    {ripples.map((r, i) => (
                        <Ripple
                            key={r.id}
                            id={r.id}
                            x={r.x}
                            y={r.y}
                            color={rippleColor}
                            opacity={rippleOpacity}
                            canRemove={!(!pressedOut && i === ripples.length - 1)}
                            onRemove={handleRemove}
                        />
                    ))}
                    {!showForeground && children}
                </View>
            </TouchableWithoutFeedback>
        );
    }
);

const styles = StyleSheet.create({
    container: {
        overflow: "hidden",
    },
    ripple: {
        height: INITIAL_RIPPLE_SIZE,
        width: INITIAL_RIPPLE_SIZE,
        borderRadius: INITIAL_RIPPLE_SIZE / 2,
        position: "absolute",
    },
});

export default React.memo(AppTouchableRipple);
