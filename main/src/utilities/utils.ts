import { showMessage, MessageOptions } from "react-native-flash-message";

export interface ToastOptions {
    message: string;
    description?: string;
    isSuccess?: boolean;
}

/**
 * Displays a toast notification to the user
 * @param options - Toast configuration options
 */
export const showToast = ({ 
    message, 
    description = "", 
    isSuccess = false 
}: ToastOptions): void => {
    const options: MessageOptions = {
        message,
        description,
        type: isSuccess ? 'success' : 'danger',
    };
    
    showMessage(options);
};