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


