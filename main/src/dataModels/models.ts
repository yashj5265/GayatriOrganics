// ============================================================================
// CATEGORY MODELS
// ============================================================================

export interface CategoryModel {
    id: number;
    name: string;
    description: string;
    product_count: number;
    image_url: string;
    created_at: string;
    updated_at: string;
};

export interface CategoryListModel {
    success: boolean;
    message: string;
    count: number;
    data: CategoryModel[];
};

// ============================================================================
// PRODUCT MODELS
// ============================================================================

// Category model for products (different structure than CategoryModel)
export interface ProductCategoryModel {
    id: number;
    name: string;
    description: string;
    image: string;
    created_at: string;
    updated_at: string;
};

export interface ProductModel {
    id: number;
    category_id: number;
    product_type: string;
    product_code: string;
    name: string;
    description: string;
    price: string;
    unit_type: string;
    unit_value: number;
    available_units: string;
    image1: string;
    image2: string | null;
    image3: string | null;
    image4: string | null;
    image5: string | null;
    created_at: string;
    updated_at: string;
    remaining_stock: string;
    category: ProductCategoryModel;
};

export interface ProductListModel {
    status: boolean;
    message: string;
    count: number;
    data: ProductModel[];
};

export interface ProductDetailModel {
    status: boolean;
    message: string;
    data: ProductModel;
};

// ============================================================================
// PROFILE MODELS
// ============================================================================

export interface ProfileModel {
    id: number;
    name: string | null;
    mobile: string;
    otp_expires_at: string | null;
    created_at: string;
    updated_at: string;
};

export interface UpdateProfileModel {
    id: number;
    name: string;
};

export interface UpdateProfileResponseModel {
    message: string;
    user: ProfileModel;
};

// ============================================================================
// ADDRESS MODELS
// ============================================================================

export interface AddressModel {
    id: number;
    user_id: number;
    full_name: string;
    address_type: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    is_default: number;
    created_at: string;
    updated_at: string;
}

export interface AddressListModel {
    success: boolean;
    data: AddressModel[];
};

// ============================================================================
// CART MODELS
// ============================================================================

export interface CartItemModel {
    id: number;
    user_id: number;
    category_id: number;
    product_id: number;
    quantity: number;
    unit_type: string;
    price: string;
    created_at: string;
    updated_at: string;
    product: ProductModel;
    category: ProductCategoryModel;
}

export interface CartResponseModel {
    success: boolean;
    subtotal: number;
    items: CartItemModel[];
}

// ============================================================================
// ORDER MODELS
// ============================================================================

export interface CreateOrderDataModel {
    order_code: string;
    subtotal: number;
    delivery_charge: number;
    total_amount: number;
    delivery_date: string;
    status: string;
}

export interface CreateOrderResponseModel {
    success: boolean;
    message: string;
    data: CreateOrderDataModel;
}
