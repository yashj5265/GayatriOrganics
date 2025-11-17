import NetInfo from "@react-native-community/netinfo";
import { Platform } from "react-native";
import { showToast } from "../utilities/utils";

export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    count?: number;
    [key: string]: any;
}

export interface ApiConfig {
    endpoint: string;
    method?: "GET" | "POST" | "PUT" | "DELETE";
    params?: Record<string, any> | FormData;
    token?: string;
    showError?: boolean;
    showSuccess?: boolean;
    isFormData?: boolean;
}

const BASE_URL = "https://gayatriorganicfarm.com";

export default class ApiManager {
    static async request<T = any>({
        endpoint,
        method = "GET",
        params = {},
        token = "",
        showError = true,
        showSuccess = false,
        isFormData = false,
    }: ApiConfig): Promise<ApiResponse<T>> {
        // ✅ Check internet connection
        const netInfo = await NetInfo.fetch();
        if (!netInfo.isConnected) {
            const errorMsg = "No internet connection";
            if (showError) {
                showToast({
                    message: "Connection Error",
                    description: errorMsg,
                    isSuccess: false,
                });
            }
            throw new Error(errorMsg);
        }

        const url = `${BASE_URL}${endpoint}`;

        // 🔥 CRITICAL: For FormData, headers must be minimal
        // React Native will automatically set Content-Type with boundary
        const headers: Record<string, string> = {
            "platform": Platform.OS,
        };

        // Only add these headers for non-FormData requests
        if (!isFormData) {
            headers["Accept"] = "application/json";
            headers["Content-Type"] = "application/json";
        }

        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const options: RequestInit = {
            method,
            headers,
        };

        if (method !== "GET") {
            options.body = isFormData ? (params as any) : JSON.stringify(params);
        }

        try {
            console.log('📡 API Request:', {
                url,
                method,
                isFormData,
                hasToken: !!token,
                headers,
            });

            const response = await fetch(url, options);

            let json;
            try {
                json = await response.json();
            } catch (parseError) {
                console.error('❌ Failed to parse response:', parseError);
                const errorMsg = 'Invalid response from server';
                if (showError) {
                    showToast({
                        message: "Parse Error",
                        description: errorMsg,
                        isSuccess: false,
                    });
                }
                throw new Error(errorMsg);
            }

            console.log('📥 API Response:', {
                status: response.status,
                ok: response.ok,
                data: json,
            });

            if (!response.ok) {
                const errorMessage = json.message || json.error || "Request failed";

                if (showError) {
                    console.warn(`❌ ${errorMessage}`);
                    showToast({
                        message: "Error",
                        description: errorMessage,
                        isSuccess: false,
                    });
                }
                throw new Error(errorMessage);
            }

            if (showSuccess && json.message) {
                console.log(`✅ ${json.message}`);
                showToast({
                    message: "Success",
                    description: json.message,
                    isSuccess: true,
                });
            }

            return json as ApiResponse<T>;
        } catch (err: any) {
            if (showError && err.message) {
                console.error("❌ API Error:", err);

                // Only show toast if we haven't already shown one
                if (err.message !== "No internet connection" &&
                    err.message !== "Invalid response from server") {
                    showToast({
                        message: "Request Failed",
                        description: err.message,
                        isSuccess: false,
                    });
                }
            }
            throw err;
        }
    }

    // 👉 Shortcut methods with enhanced options
    static get<T = any>({
        endpoint,
        token,
        showError = true,
        showSuccess = false,
    }: {
        endpoint: string;
        token?: string;
        showError?: boolean;
        showSuccess?: boolean;
    }) {
        return this.request<T>({
            endpoint,
            method: "GET",
            token,
            showError,
            showSuccess,
        });
    }

    static post<T = any>({
        endpoint,
        params,
        token,
        isFormData = false,
        showError = true,
        showSuccess = false,
    }: {
        endpoint: string;
        params?: any;
        token?: string;
        isFormData?: boolean;
        showError?: boolean;
        showSuccess?: boolean;
    }) {
        return this.request<T>({
            endpoint,
            method: "POST",
            params,
            token,
            isFormData,
            showError,
            showSuccess,
        });
    }

    static put<T = any>({
        endpoint,
        params,
        token,
        isFormData = false,
        showError = true,
        showSuccess = false,
    }: {
        endpoint: string;
        params?: any;
        token?: string;
        isFormData?: boolean;
        showError?: boolean;
        showSuccess?: boolean;
    }) {
        return this.request<T>({
            endpoint,
            method: "PUT",
            params,
            token,
            isFormData,
            showError,
            showSuccess,
        });
    }

    static delete<T = any>({
        endpoint,
        token,
        showError = true,
        showSuccess = false,
    }: {
        endpoint: string;
        token?: string;
        showError?: boolean;
        showSuccess?: boolean;
    }) {
        return this.request<T>({
            endpoint,
            method: "DELETE",
            token,
            showError,
            showSuccess,
        });
    }

    // 📤 Dedicated upload method for better clarity
    static upload<T = any>({
        endpoint,
        formData,
        token,
        showError = true,
        showSuccess = false,
    }: {
        endpoint: string;
        formData: FormData;
        token?: string;
        showError?: boolean;
        showSuccess?: boolean;
    }) {
        return this.request<T>({
            endpoint,
            method: "POST",
            params: formData,
            token,
            isFormData: true,
            showError,
            showSuccess,
        });
    }
}