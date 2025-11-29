/**
 * Utility class for number formatting operations
 */
export class NumberUtils {
    private static readonly DEFAULT_CURRENCY = '₹';
    private static readonly LOCALE = 'en-IN';

    /**
     * Formats a number string with Indian locale formatting (commas)
     * @param value - The number string to format
     * @returns Formatted number string or empty string if invalid
     */
    static formatNumber(value: string): string {
        if (!value || value.trim() === '') return '';
        
        const numericValue = parseFloat(value.replace(/,/g, ''));
        if (isNaN(numericValue)) return '';
        
        return numericValue.toLocaleString(this.LOCALE);
    }

    /**
     * Formats a number string as currency
     * @param value - The number string to format
     * @param currency - Currency symbol (default: ₹)
     * @returns Formatted currency string
     */
    static formatCurrency(value: string, currency: string = this.DEFAULT_CURRENCY): string {
        const formattedNumber = this.formatNumber(value);
        return formattedNumber ? `${currency}${formattedNumber}` : '';
    }

    /**
     * Parses a formatted number string back to a number
     * @param value - The formatted number string
     * @returns Parsed number or NaN if invalid
     */
    static parseNumber(value: string): number {
        if (!value) return NaN;
        return parseFloat(value.replace(/,/g, '').replace(/[₹$€£]/g, ''));
    }
}