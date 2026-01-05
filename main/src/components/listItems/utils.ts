/**
 * Utility functions for list items
 */

export const getImageUrl = (imagePath: string): string => {
    return `https://gayatriorganicfarm.com/storage/${imagePath}`;
};

export const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Out of Stock', color: '#FF5252', bgColor: '#FFEBEE' };
    if (stock <= 5) return { label: 'Low Stock', color: '#FF9800', bgColor: '#FFF3E0' };
    return { label: 'In Stock', color: '#4CAF50', bgColor: '#E8F5E9' };
};

const UNIT_TYPE_SHORT: { [key: string]: string } = {
    kg: 'kg',
    g: 'g',
    litre: 'L',
    ml: 'ml',
    piece: 'pc',
    dozen: 'dz',
    packet: 'pkt',
};

export const formatUnitDisplay = (unitType?: string, unitValue?: number): string => {
    if (!unitType) return 'pc';
    const normalizedUnitType = unitType.toLowerCase();
    const short = UNIT_TYPE_SHORT[normalizedUnitType] || normalizedUnitType;
    if (unitValue && unitValue > 1) {
        return `${unitValue} ${short}`;
    }
    return short;
};

