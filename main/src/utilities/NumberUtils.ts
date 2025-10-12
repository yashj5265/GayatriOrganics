
export class NumberUtils {
    static formatNumber(value: string): string {
        const numericValue = parseFloat(value.replace(/,/g, '')); // Remove commas & convert to number
        if (isNaN(numericValue)) return ''; // Invalid number case
        return numericValue.toLocaleString('en-IN'); // Proper Indian number formatting
    }

    static formatCurrency(value: string, currency: string = '₹'): string {
        return `${currency}${NumberUtils.formatNumber(value)}`;
    }
}