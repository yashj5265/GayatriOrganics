import { showMessage } from "react-native-flash-message";

export const showToast = ({ message, description = "", isSuccess }: { message: string, description?: string, isSuccess?: boolean }) => {
    showMessage({
        message: message,
        description: description,
        type: isSuccess ? 'success' : 'danger',
    });
};