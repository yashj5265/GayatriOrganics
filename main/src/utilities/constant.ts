import { Dimensions, Platform } from "react-native";
import { StorageKey } from "../managers/StorageManager";

export default {
    envirolment: "",
    apiEndPoints: {
        // Auth - User OTP Flow
        sendOTP: '/api/send-otp',
        verifyOTP: '/api/verify-otp',
        logout: '/api/logout',

        // User Registration (for future)
        register: '/api/user/register',

        // Category
        allCategories: '/api/admin/categories',
        getCategory: '/api/admin/category',

        // Product
        allProducts: '/api/admin/products',//Get
        getProduct: '/api/admin/product/',//Get

        // Orders (for future)
        createOrder: '/api/user/order',
        myOrders: '/api/user/orders',
        getOrder: '/api/user/order',
    },
    shareInstanceKey: {
        authToken: StorageKey.TOKEN,
        userData: StorageKey.USER,
        baseUrl: StorageKey.BASE_URL,
        loggedInUser: StorageKey.loggedInUser,
    },
    dimensions: {
        windowHeight: Dimensions.get('window').height,
        windowWidth: Dimensions.get('window').width,
        navBarHeight: Platform.OS === 'android' ? 60 : 44,
    },
    routeName: {
        // Common Screens
        launcherScreen: "launcherScreen",

        // Auth Screens - OTP Flow
        sendOTPScreen: 'sendOTPScreen',
        verifyOTPScreen: 'verifyOTPScreen',
        registerScreen: 'registerScreen', // For future

        // Front Screens
        dashboard: 'dashboard',
        home: 'home',
        categories: 'categories',
        products: 'products',
        cart: 'cart',
        orders: 'orders',
        profile: 'profile',
        categoryDetail: "categoryDetail",
        productDetail: "productDetail",
        mainTabs: "mainTabs"
    },
    // Response Codes
    responseCode: {
        success: 200,
        created: 201,
        unauthorized: 401,
        forbidden: 403,
        notFound: 404,
        serverError: 500,
    },
    webPages: {
        termsOfService: "https://www.google.com",
        privacyPolicy: "https://www.facebook.com",
        aboutUs: "https://gayatriorganics.com/aboutUs.html",
        downloadUrl: "https://www.gayatriorganics.com",
        appPlayStoreUrl: "https://play.google.com/store/apps/details?id=com.gayatriorganics",
        appleAppStoreUrl: "https://apps.apple.com",
        reviewAndroidUrl: "market://details?id=com.gayatriorganics",
        reviewiOSUrl: "itms-apps://itunes.apple.com/app/idYOUR_APP_ID?action=write-review",
    },
    appIdentity: "Gayatri Organics",
}