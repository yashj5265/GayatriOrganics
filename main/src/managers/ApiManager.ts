import NetInfo from "@react-native-community/netinfo";
import { Platform } from "react-native";

export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    [key: string]: any;
}

export interface ApiConfig {
    endpoint: string;
    method?: "GET" | "POST" | "PUT" | "DELETE";
    params?: Record<string, any>;
    token?: string;
    showError?: boolean;
    showSuccess?: boolean;
    isFormData?: boolean;
}

const BASE_URL = "https://washier-joan-unturgid.ngrok-free.dev/";

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
        // ✅ Check internet
        const netInfo = await NetInfo.fetch();
        if (!netInfo.isConnected) {
            throw new Error("No internet connection");
        }

        const url = `${BASE_URL}${`${endpoint}`}`;
        const headers: Record<string, string> = {
            "Accept": "application/json",
            "Content-Type": isFormData ? "multipart/form-data" : "application/json",
            "platform": Platform.OS,
        };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const options: RequestInit = {
            method,
            headers,
        };

        if (method !== "GET") {
            options.body = isFormData ? params as any : JSON.stringify(params);
        }

        try {
            const response = await fetch(url, options);
            const json = await response.json();

            if (!response.ok) {
                if (showError) console.warn(`❌ ${json.message || "Request failed"}`);
                throw new Error(json.message || "Request failed");
            }

            if (showSuccess) console.log(`✅ ${json.message || "Success"}`);
            return json as ApiResponse<T>;
        } catch (err) {
            if (showError) console.error("API Error:", err);
            throw err;
        }
    }

    // 👉 Shortcut methods
    static get<T = any>({ endpoint, token }: { endpoint: string, token?: string }) {
        return this.request<T>({ endpoint, method: "GET", token });
    }

    static post<T = any>({ endpoint, params, token }: { endpoint: string, params?: any, token?: string }) {
        return this.request<T>({ endpoint, method: "POST", params, token });
    }

    static put<T = any>({ endpoint, params, token }: { endpoint: string, params?: any, token?: string }) {
        return this.request<T>({ endpoint, method: "PUT", params, token });
    }

    static delete<T = any>({ endpoint, token }: { endpoint: string, token?: string }) {
        return this.request<T>({ endpoint, method: "DELETE", token });
    }

    static upload<T = any>({ endpoint, formData, token }: { endpoint: string, formData: FormData, token?: string }) {
        return this.request<T>({ endpoint, method: "POST", params: formData, token, isFormData: true });
    }
}
