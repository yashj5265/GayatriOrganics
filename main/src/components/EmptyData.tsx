import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import fonts from '../styles/fonts';
import { useTheme } from '../contexts/ThemeProvider';
import NoRecordsIcon from '../../resources/Images/utility/NoRecordsIcon.svg';
import NoInternetIcon from '../../resources/Images/utility/NoInternetIcon.svg';

export enum EmptyDataType {
    NO_RECORDS = 'noRecord',
    NO_INTERNET = 'noInternet',
}

interface EmptyDataProps {
    type?: EmptyDataType;
    message?: string;
    title?: string;
    description?: string;
}

const EmptyData: React.FC<EmptyDataProps> = ({
    type = EmptyDataType.NO_RECORDS,
    message,
    title,
    description
}) => {
    const colors = useTheme();

    // Default titles and descriptions
    const defaultTitles = {
        [EmptyDataType.NO_RECORDS]: 'No Records Found',
        [EmptyDataType.NO_INTERNET]: 'No Internet Connection',
    };

    const defaultDescriptions = {
        [EmptyDataType.NO_RECORDS]: 'There are no items to display at the moment.',
        [EmptyDataType.NO_INTERNET]: 'Please check your internet connection and try again.',
    };

    // Determine what to display
    const displayTitle = title || message || defaultTitles[type];
    const displayDescription = description || defaultDescriptions[type];

    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                {type === EmptyDataType.NO_RECORDS ? (
                    <NoRecordsIcon width={120} height={120} color={colors.themePrimary} />
                ) : (
                    <NoInternetIcon width={120} height={120} color={colors.themePrimary} />
                )}
            </View>

            <Text style={[styles.title, { color: colors.textPrimary }]}>
                {displayTitle}
            </Text>

            {description !== undefined || !message ? (
                <Text style={[styles.description, { color: colors.textDescription }]}>
                    {displayDescription}
                </Text>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    iconContainer: {
        marginBottom: 24,
    },
    title: {
        fontFamily: fonts.family.primaryBold,
        fontSize: fonts.size.font20,
        textAlign: 'center',
        marginBottom: 12,
    },
    description: {
        fontFamily: fonts.family.secondaryRegular,
        fontSize: fonts.size.font14,
        textAlign: 'center',
        lineHeight: 22,
        maxWidth: 280,
    },
});

export default React.memo(EmptyData);