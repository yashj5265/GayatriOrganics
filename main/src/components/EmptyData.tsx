import React, { useMemo, memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import fonts from '../styles/fonts';
import { useTheme } from '../contexts/ThemeProvider';
import NoRecordsIcon from '../../resources/Images/utility/NoRecordsIcon.svg';
import NoInternetIcon from '../../resources/Images/utility/NoInternetIcon.svg';
import { AppColors } from '../styles/colors';

export enum EmptyDataType {
    NO_RECORDS = 'noRecord',
    NO_INTERNET = 'noInternet',
}

export interface EmptyDataProps {
    type?: EmptyDataType;
    message?: string;
    title?: string;
    description?: string;
}

const DEFAULT_TITLES: Record<EmptyDataType, string> = {
    [EmptyDataType.NO_RECORDS]: 'No Records Found',
    [EmptyDataType.NO_INTERNET]: 'No Internet Connection',
};

const DEFAULT_DESCRIPTIONS: Record<EmptyDataType, string> = {
    [EmptyDataType.NO_RECORDS]: 'There are no items to display at the moment.',
    [EmptyDataType.NO_INTERNET]: 'Please check your internet connection and try again.',
};

const EmptyData: React.FC<EmptyDataProps> = ({
    type = EmptyDataType.NO_RECORDS,
    message,
    title,
    description
}) => {
    const colors = useTheme();

    const displayTitle = useMemo(() => 
        title || message || DEFAULT_TITLES[type],
        [title, message, type]
    );

    const displayDescription = useMemo(() => 
        description || DEFAULT_DESCRIPTIONS[type],
        [description, type]
    );

    const showDescription = useMemo(() => 
        description !== undefined || !message,
        [description, message]
    );

    const isNoRecords = useMemo(() => 
        type === EmptyDataType.NO_RECORDS,
        [type]
    );

    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                {isNoRecords ? (
                    <NoRecordsIcon width={120} height={120} color={colors.themePrimary} />
                ) : (
                    <NoInternetIcon width={120} height={120} color={colors.themePrimary} />
                )}
            </View>

            <Text style={[styles.title, { color: colors.textPrimary }]}>
                {displayTitle}
            </Text>

            {showDescription && (
                <Text style={[styles.description, { color: colors.textDescription }]}>
                    {displayDescription}
                </Text>
            )}
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

export default memo(EmptyData);