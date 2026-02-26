import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import fonts from '../styles/fonts';

interface SuccessCheckProps {
    onFinish?: () => void;
}

const SuccessCheckOverlay: React.FC<SuccessCheckProps> = ({ onFinish }) => {
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <LottieView
                    source={require('../../resources/animations/successCheck.json')}
                    autoPlay
                    loop={false}
                    style={styles.animation}
                    onAnimationFinish={onFinish}
                />
                <Text style={styles.orderPlacedText}>Order Placed</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
    },
    content: {
        alignItems: 'center',
    },
    animation: {
        width: 300,
        height: 300,
    },
    orderPlacedText: {
        marginTop: 8,
        fontSize: fonts.size.font20,
        fontFamily: fonts.family.primaryBold,
        color: '#1a1a1a',
    },
});

export default React.memo(SuccessCheckOverlay);