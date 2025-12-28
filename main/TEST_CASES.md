# API Integration Test Cases

## Test Environment Setup
- **Base URL**: `https://gayatriorganicfarm.com`
- **Authentication**: Bearer Token (stored in `StorageManager`)
- **Dev Mode**: Console logs enabled when `__DEV__` is true

---

## 1. Address API Test Cases

### TC-ADDR-001: Fetch Address List
**Test Case**: Load addresses from API on app start
**Preconditions**: 
- User is logged in (has valid token)
- At least one address exists in the system

**Steps**:
1. Open the app
2. Navigate to Address List screen
3. Check console logs for API request

**Expected Results**:
- ✅ API call: `GET /api/address`
- ✅ Console log shows: "📡 API REQUEST INITIATED" with endpoint `/api/address`
- ✅ Addresses are displayed in the list
- ✅ Default address is automatically selected
- ✅ Console log shows: "📥 API RESPONSE RECEIVED" with address data

**Test Data**:
```json
{
  "endpoint": "/api/address",
  "method": "GET",
  "headers": {
    "Authorization": "Bearer {token}",
    "platform": "android/ios"
  }
}
```

---

### TC-ADDR-002: Add New Address
**Test Case**: Add a new address via API
**Preconditions**: User is logged in

**Steps**:
1. Navigate to Add Address screen
2. Fill in address details:
   - Full Name: "John Doe"
   - Mobile: "9876543210"
   - Address: "123 Test Street"
   - City: "Ahmedabad"
   - State: "Gujarat"
   - Pincode: "380015"
   - Address Type: "Home"
   - Set as Default: Yes
3. Click "Save Address"
4. Check console logs

**Expected Results**:
- ✅ API call: `POST /api/address`
- ✅ Console log shows request payload with all address fields
- ✅ Address is added successfully
- ✅ Success message displayed
- ✅ Address list is refreshed from API
- ✅ New address is set as default if `is_default: true`

**Test Data**:
```json
{
  "endpoint": "/api/address",
  "method": "POST",
  "payload": {
    "full_name": "John Doe",
    "address_type": "Home",
    "phone": "9876543210",
    "address": "123 Test Street",
    "city": "Ahmedabad",
    "state": "Gujarat",
    "pincode": "380015",
    "is_default": true
  }
}
```

---

### TC-ADDR-003: Update Address
**Test Case**: Update existing address via API
**Preconditions**: 
- User is logged in
- At least one address exists

**Steps**:
1. Navigate to Address List
2. Select an address to edit
3. Modify address fields (e.g., change city to "Mumbai")
4. Click "Update Address"
5. Check console logs

**Expected Results**:
- ✅ API call: `PUT /api/address/{id}`
- ✅ Console log shows updated payload
- ✅ Address is updated successfully
- ✅ Address list is refreshed from API
- ✅ Updated address is reflected in the UI

**Test Data**:
```json
{
  "endpoint": "/api/address/2",
  "method": "PUT",
  "payload": {
    "full_name": "John Doe Updated",
    "address_type": "Work",
    "phone": "9876543210",
    "address": "New Office Location",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "is_default": true
  }
}
```

---

### TC-ADDR-004: Delete Address
**Test Case**: Delete an address via API
**Preconditions**: 
- User is logged in
- At least one address exists

**Steps**:
1. Navigate to Address List
2. Swipe or click delete on an address
3. Confirm deletion
4. Check console logs

**Expected Results**:
- ✅ API call: `DELETE /api/address/{id}`
- ✅ Console log shows delete request
- ✅ Address is deleted successfully
- ✅ Address list is refreshed from API
- ✅ If deleted address was selected, another address is auto-selected

**Test Data**:
```json
{
  "endpoint": "/api/address/1",
  "method": "DELETE"
}
```

---

### TC-ADDR-005: Set Default Address
**Test Case**: Set an address as default via API
**Preconditions**: 
- User is logged in
- Multiple addresses exist

**Steps**:
1. Navigate to Address List
2. Select "Set as Default" on a non-default address
3. Check console logs

**Expected Results**:
- ✅ API call: `POST /api/address/{id}/set-default`
- ✅ Console log shows request
- ✅ Address is set as default
- ✅ Address list is refreshed from API
- ✅ Default address is marked in UI

**Test Data**:
```json
{
  "endpoint": "/api/address/2/set-default",
  "method": "POST"
}
```

---

### TC-ADDR-006: Address API Error Handling
**Test Case**: Handle API errors gracefully
**Preconditions**: User is logged in

**Steps**:
1. Turn off internet connection
2. Try to add/edit/delete an address
3. Check fallback behavior

**Expected Results**:
- ✅ Error message displayed to user
- ✅ Falls back to local storage if available
- ✅ Console log shows error details
- ✅ App doesn't crash

---

## 2. Cart API Test Cases

### TC-CART-001: Fetch Cart Items
**Test Case**: Load cart items from API on app start
**Preconditions**: 
- User is logged in
- Cart has items

**Steps**:
1. Open the app
2. Navigate to Cart screen
3. Check console logs

**Expected Results**:
- ✅ API call: `GET /api/cart`
- ✅ Console log shows: "📡 API REQUEST INITIATED" with endpoint `/api/cart`
- ✅ Cart items are displayed
- ✅ Cart count and total are calculated correctly
- ✅ Console log shows: "📥 API RESPONSE RECEIVED" with cart data

**Test Data**:
```json
{
  "endpoint": "/api/cart",
  "method": "GET",
  "response": {
    "data": [
      {
        "id": 1,
        "product_id": 9,
        "category_id": 1,
        "quantity": 2,
        "unit_type": "kg",
        "price": 100,
        "delivery_charge": 20,
        "delivery_date": "2026-12-07",
        "product": {
          "id": 9,
          "name": "Organic Tomatoes",
          "image": "tomatoes.jpg"
        }
      }
    ]
  }
}
```

---

### TC-CART-002: Add Item to Cart
**Test Case**: Add product to cart via API
**Preconditions**: 
- User is logged in
- Product detail screen is open

**Steps**:
1. Navigate to Product Detail screen
2. Select quantity: 2
3. Click "Add to Cart"
4. Check console logs

**Expected Results**:
- ✅ API call: `POST /api/cart/add`
- ✅ Console log shows request payload with:
  - `category_id`
  - `product_id`
  - `quantity`
  - `unit_type`
  - `price`
  - `delivery_charge`
  - `delivery_date`
- ✅ Item is added to cart
- ✅ Cart is refreshed from API
- ✅ Cart count badge updates
- ✅ Success message displayed

**Test Data**:
```json
{
  "endpoint": "/api/cart/add",
  "method": "POST",
  "payload": {
    "category_id": 1,
    "product_id": 9,
    "quantity": 2,
    "unit_type": "kg",
    "price": 100,
    "delivery_charge": 20,
    "delivery_date": "2026-12-07"
  }
}
```

---

### TC-CART-003: Update Cart Quantity
**Test Case**: Update item quantity in cart via API
**Preconditions**: 
- User is logged in
- Cart has at least one item

**Steps**:
1. Navigate to Cart screen
2. Click "+" button to increase quantity
3. Check console logs

**Expected Results**:
- ✅ API call: `PUT /api/cart/update/{cartItemId}`
- ✅ Console log shows request payload: `{"quantity": 3}`
- ✅ Quantity is updated in cart
- ✅ Cart is refreshed from API
- ✅ Cart total is recalculated
- ✅ UI updates immediately

**Test Data**:
```json
{
  "endpoint": "/api/cart/update/1",
  "method": "PUT",
  "payload": {
    "quantity": 3
  }
}
```

---

### TC-CART-004: Remove Item from Cart
**Test Case**: Remove item from cart via API
**Preconditions**: 
- User is logged in
- Cart has at least one item

**Steps**:
1. Navigate to Cart screen
2. Click remove/delete button on an item
3. Confirm removal
4. Check console logs

**Expected Results**:
- ✅ API call: `DELETE /api/cart/remove/{cartItemId}`
- ✅ Console log shows delete request
- ✅ Item is removed from cart
- ✅ Cart is refreshed from API
- ✅ Cart count and total are updated
- ✅ UI updates immediately

**Test Data**:
```json
{
  "endpoint": "/api/cart/remove/1",
  "method": "DELETE",
  "payload": {
    "quantity": 1
  }
}
```

---

### TC-CART-005: Cart API Error Handling
**Test Case**: Handle cart API errors gracefully
**Preconditions**: User is logged in

**Steps**:
1. Turn off internet connection
2. Try to add/update/remove cart items
3. Check fallback behavior

**Expected Results**:
- ✅ Error message displayed
- ✅ Falls back to local storage operations
- ✅ Console log shows error details
- ✅ App continues to function with local cart

---

## 3. Product Search API Test Cases

### TC-PROD-001: Search Products
**Test Case**: Search products using API
**Preconditions**: User is logged in (optional)

**Steps**:
1. Navigate to Product List screen
2. Type "Orange" in search box
3. Wait 500ms (debounce)
4. Check console logs

**Expected Results**:
- ✅ API call: `GET /api/search-products?query=Orange`
- ✅ Console log shows search query parameter
- ✅ Search results are displayed
- ✅ Results are filtered by stock status if filter is applied
- ✅ Console log shows response with product data

**Test Data**:
```json
{
  "endpoint": "/api/search-products",
  "method": "GET",
  "params": {
    "query": "Orange"
  },
  "response": {
    "data": [
      {
        "id": 1,
        "name": "Orange",
        "price": 80,
        "stock": 50,
        "category": {
          "id": 2,
          "name": "Fruits"
        }
      }
    ]
  }
}
```

---

### TC-PROD-002: Search with Debounce
**Test Case**: Verify search debounce functionality
**Preconditions**: User is on Product List screen

**Steps**:
1. Type "O" in search box
2. Quickly type "r" (within 500ms)
3. Type "a" (within 500ms)
4. Wait 500ms
5. Check console logs

**Expected Results**:
- ✅ Only ONE API call is made after user stops typing for 500ms
- ✅ Console log shows final search query: "Ora"
- ✅ No multiple API calls for each keystroke

---

### TC-PROD-003: Search with Stock Filter
**Test Case**: Search products with stock filter applied
**Preconditions**: 
- User is on Product List screen
- Stock filter is set to "In Stock"

**Steps**:
1. Set filter to "In Stock"
2. Type "Apple" in search box
3. Wait for results
4. Check console logs

**Expected Results**:
- ✅ API call: `GET /api/search-products?query=Apple`
- ✅ Search results are filtered to show only in-stock items (stock > 5)
- ✅ Console log shows filtered results

---

### TC-PROD-004: Search Fallback to Local
**Test Case**: Fallback to local search when API fails
**Preconditions**: User is on Product List screen

**Steps**:
1. Turn off internet connection
2. Type "Orange" in search box
3. Wait for results
4. Check console logs

**Expected Results**:
- ✅ API call fails
- ✅ Falls back to local product filtering
- ✅ Results are shown from local product list
- ✅ Console log shows error and fallback message

---

## 4. Profile API Test Cases

### TC-PROF-001: Fetch User Profile
**Test Case**: Load user profile from API
**Preconditions**: User is logged in

**Steps**:
1. Open the app
2. Navigate to Profile screen
3. Check console logs

**Expected Results**:
- ✅ API call: `GET /api/profile`
- ✅ Console log shows: "📡 API REQUEST INITIATED" with endpoint `/api/profile`
- ✅ User name and mobile are displayed
- ✅ Profile data is stored in local storage
- ✅ Console log shows: "📥 API RESPONSE RECEIVED" with profile data

**Test Data**:
```json
{
  "endpoint": "/api/profile",
  "method": "GET",
  "response": {
    "data": {
      "id": 1,
      "name": "John Doe",
      "mobile": "9876543210",
      "email": "john@example.com"
    }
  }
}
```

---

### TC-PROF-002: Profile API Error Handling
**Test Case**: Handle profile API errors gracefully
**Preconditions**: User is logged in

**Steps**:
1. Turn off internet connection
2. Navigate to Profile screen
3. Check fallback behavior

**Expected Results**:
- ✅ API call fails
- ✅ Falls back to stored user data
- ✅ Profile screen still displays user info from storage
- ✅ Console log shows error details
- ✅ App doesn't crash

---

## 5. General API Test Cases

### TC-GEN-001: API Request Logging (Dev Mode)
**Test Case**: Verify detailed API logging in dev mode
**Preconditions**: App is running in dev mode (`__DEV__ = true`)

**Steps**:
1. Perform any API operation (e.g., fetch cart)
2. Check console logs

**Expected Results**:
- ✅ Console shows: "═══════════════════════════════════════════════════════"
- ✅ Console shows: "📡 API REQUEST INITIATED"
- ✅ Console shows:
  - Endpoint
  - Full URL
  - Method
  - Has Token status
  - Is FormData status
  - Payload (formatted JSON)
  - Headers
- ✅ Console shows: "📥 API RESPONSE RECEIVED"
- ✅ Console shows:
  - Status Code
  - Response OK status
  - Response Data (formatted JSON)
  - Message (if any)
  - Success status (if any)

---

### TC-GEN-002: API Request Logging (Production Mode)
**Test Case**: Verify no logging in production mode
**Preconditions**: App is running in production mode (`__DEV__ = false`)

**Steps**:
1. Perform any API operation
2. Check console logs

**Expected Results**:
- ✅ No detailed API logs in console
- ✅ Only essential error logs (if any)
- ✅ App functions normally

---

### TC-GEN-003: Token Authentication
**Test Case**: Verify token is included in API requests
**Preconditions**: User is logged in

**Steps**:
1. Perform any authenticated API operation
2. Check console logs for headers

**Expected Results**:
- ✅ Console log shows: `"Has Token": true`
- ✅ Request headers include: `"Authorization": "Bearer {token}"`
- ✅ API accepts the request

---

### TC-GEN-004: No Token Fallback
**Test Case**: Verify fallback when user is not logged in
**Preconditions**: User is not logged in (no token)

**Steps**:
1. Logout or clear token
2. Try to perform API operations (cart, address, etc.)
3. Check behavior

**Expected Results**:
- ✅ API calls are skipped
- ✅ Falls back to local storage operations
- ✅ App functions with local data
- ✅ No error messages for missing token

---

### TC-GEN-005: Network Error Handling
**Test Case**: Handle network errors gracefully
**Preconditions**: User is logged in

**Steps**:
1. Turn off internet connection
2. Perform API operations
3. Check error handling

**Expected Results**:
- ✅ Error message: "No internet connection"
- ✅ Toast notification shown (if `showError: true`)
- ✅ Falls back to local storage
- ✅ Console log shows error details
- ✅ App doesn't crash

---

### TC-GEN-006: Invalid Response Handling
**Test Case**: Handle invalid API responses
**Preconditions**: User is logged in

**Steps**:
1. Mock API to return invalid JSON
2. Perform API operation
3. Check error handling

**Expected Results**:
- ✅ Error message: "Invalid response from server"
- ✅ Console log shows parse error
- ✅ App doesn't crash
- ✅ Falls back to local storage if applicable

---

## 6. Integration Test Cases

### TC-INT-001: Complete Order Flow
**Test Case**: Test complete order flow with all APIs
**Preconditions**: User is logged in

**Steps**:
1. Add product to cart (POST /api/cart/add)
2. View cart (GET /api/cart)
3. Select address (GET /api/address)
4. Update cart quantity (PUT /api/cart/update/{id})
5. Create order (POST /api/order/create)
6. Check console logs for all API calls

**Expected Results**:
- ✅ All API calls are logged
- ✅ Data flows correctly between screens
- ✅ Cart is synced with server
- ✅ Order is created successfully

---

### TC-INT-002: Address and Cart Sync
**Test Case**: Verify address and cart sync after operations
**Preconditions**: User is logged in

**Steps**:
1. Add address (POST /api/address)
2. Add item to cart (POST /api/cart/add)
3. Check both are synced with server
4. Refresh app
5. Verify data persists

**Expected Results**:
- ✅ Address is saved on server
- ✅ Cart is saved on server
- ✅ After app refresh, data is loaded from API
- ✅ Local storage is updated as backup

---

## Test Checklist

### Before Testing
- [ ] Ensure base URL is correct: `https://gayatriorganicfarm.com`
- [ ] User is logged in with valid token
- [ ] App is running in dev mode for console logs
- [ ] Network connection is active

### During Testing
- [ ] Check console logs for each API call
- [ ] Verify request payload format
- [ ] Verify response data mapping
- [ ] Test error scenarios
- [ ] Test offline scenarios

### After Testing
- [ ] Verify all API endpoints are working
- [ ] Check data persistence
- [ ] Verify error handling
- [ ] Confirm fallback mechanisms work

---

## Notes

1. **Console Logs**: All API operations log detailed information in dev mode. Look for:
   - `📡 API REQUEST INITIATED`
   - `📥 API RESPONSE RECEIVED`
   - `❌ API EXCEPTION OCCURRED` (on errors)

2. **Error Handling**: All API calls have fallback to local storage if:
   - No token is available
   - API call fails
   - Network is unavailable

3. **Data Mapping**: API responses are mapped to match internal interfaces:
   - Address API: `full_name` → `name`, `phone` → `mobile`, etc.
   - Cart API: `product_id` → `id`, `unit_type` → `unit`, etc.

4. **Testing Tools**: Use React Native Debugger or Chrome DevTools to view console logs.



