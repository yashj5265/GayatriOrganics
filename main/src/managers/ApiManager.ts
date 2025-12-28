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

        // Handle request body for non-GET requests
        if (method !== "GET" && params) {
            if (isFormData) {
                options.body = params as any;
            } else {
                // Ensure price field is included if it exists in params
                // Sometimes JSON.stringify might skip certain values, so we ensure it's explicitly included
                const sanitizedParams = { ...params };
                if (sanitizedParams && typeof sanitizedParams === 'object' && 'price' in sanitizedParams) {
                    // Ensure price is a valid number
                    if (sanitizedParams.price !== undefined && sanitizedParams.price !== null) {
                        sanitizedParams.price = Number(sanitizedParams.price);
                    }
                }
                options.body = JSON.stringify(sanitizedParams);
            }
        }

        try {
            // Enhanced logging in dev mode
            if (__DEV__) {
                // Check if price exists in payload for debugging (only for product-related endpoints)
                const productEndpoints = ['/api/admin/products', '/products', '/product'];
                const isProductEndpoint = productEndpoints.some(ep => endpoint.includes(ep));

                if (isProductEndpoint && method !== "GET" && params && typeof params === 'object' && !Array.isArray(params)) {
                    if (!('price' in params)) {
                        console.error('❌ Price field MISSING from payload!');
                    }
                }
            }

            const response = await fetch(url, options);

            let json;
            try {
                json = await response.json();
            } catch (parseError) {
                if (__DEV__) {
                    console.error('═══════════════════════════════════════════════════════');
                    console.error('❌ API RESPONSE PARSE ERROR');
                    console.error('═══════════════════════════════════════════════════════');
                    console.error('🔗 Endpoint:', endpoint);
                    console.error('🌐 URL:', url);
                    console.error('📤 Method:', method);
                    console.error('📊 Status:', response.status);
                    console.error('❌ Parse Error:', parseError);
                    console.error('═══════════════════════════════════════════════════════');
                }
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


            if (!response.ok) {
                const errorMessage = json.message || json.error || "Request failed";

                if (showError) {
                    showToast({
                        message: "Error",
                        description: errorMessage,
                        isSuccess: false,
                    });
                }
                throw new Error(errorMessage);
            }

            if (showSuccess && json.message) {
                showToast({
                    message: "Success",
                    description: json.message,
                    isSuccess: true,
                });
            }

            return json as ApiResponse<T>;
        } catch (err: any) {
            if (__DEV__) {
                console.error('═══════════════════════════════════════════════════════');
                console.error('❌ API EXCEPTION OCCURRED');
                console.error('═══════════════════════════════════════════════════════');
                console.error('🔗 Endpoint:', endpoint);
                console.error('🌐 URL:', url);
                console.error('📤 Method:', method);
                console.error('❌ Error:', err);
                console.error('📝 Error Message:', err.message);
                console.error('📚 Error Stack:', err.stack);
                console.error('═══════════════════════════════════════════════════════');
            }

            if (showError && err.message) {
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
        params,
        token,
        showError = true,
        showSuccess = false,
    }: {
        endpoint: string;
        params?: Record<string, any>;
        token?: string;
        showError?: boolean;
        showSuccess?: boolean;
    }) {
        // Build query string for GET requests
        let finalEndpoint = endpoint;
        if (params && Object.keys(params).length > 0) {
            const queryString = Object.keys(params)
                .filter(key => params[key] !== undefined && params[key] !== null)
                .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
                .join('&');
            if (queryString) {
                finalEndpoint = `${endpoint}${endpoint.includes('?') ? '&' : '?'}${queryString}`;
            }
        }


        return this.request<T>({
            endpoint: finalEndpoint,
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
        params,
        token,
        showError = true,
        showSuccess = false,
    }: {
        endpoint: string;
        params?: any;
        token?: string;
        showError?: boolean;
        showSuccess?: boolean;
    }) {
        return this.request<T>({
            endpoint,
            method: "DELETE",
            params,
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