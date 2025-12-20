# Quick Test Checklist

## 🚀 Quick Test Guide

### Prerequisites
- [ ] App running in **dev mode** (to see console logs)
- [ ] User **logged in** with valid token
- [ ] **Network connection** active
- [ ] Open **React Native Debugger** or **Chrome DevTools** to view logs

---

## ✅ Address API Tests

### Test 1: Load Addresses
- [ ] Open Address List screen
- [ ] Check console: `GET /api/address`
- [ ] Verify addresses displayed
- [ ] Check default address is selected

### Test 2: Add Address
- [ ] Go to Add Address screen
- [ ] Fill all fields (Name, Mobile, Address, City, State, Pincode)
- [ ] Select "Home" type
- [ ] Check "Set as default"
- [ ] Click Save
- [ ] Check console: `POST /api/address` with payload
- [ ] Verify address added and list refreshed

### Test 3: Update Address
- [ ] Edit an existing address
- [ ] Change city to "Mumbai"
- [ ] Click Update
- [ ] Check console: `PUT /api/address/{id}`
- [ ] Verify address updated

### Test 4: Delete Address
- [ ] Delete an address
- [ ] Check console: `DELETE /api/address/{id}`
- [ ] Verify address removed

### Test 5: Set Default
- [ ] Set another address as default
- [ ] Check console: `POST /api/address/{id}/set-default`
- [ ] Verify default changed

---

## 🛒 Cart API Tests

### Test 1: Load Cart
- [ ] Open Cart screen
- [ ] Check console: `GET /api/cart`
- [ ] Verify cart items displayed
- [ ] Check cart count and total

### Test 2: Add to Cart
- [ ] Go to Product Detail
- [ ] Click "Add to Cart"
- [ ] Check console: `POST /api/cart/add` with payload:
  ```json
  {
    "category_id": 1,
    "product_id": 9,
    "quantity": 1,
    "unit_type": "kg",
    "price": 100,
    "delivery_charge": 20,
    "delivery_date": "2026-12-07"
  }
  ```
- [ ] Verify item added
- [ ] Check cart badge updated

### Test 3: Update Quantity
- [ ] In Cart, click "+" to increase quantity
- [ ] Check console: `PUT /api/cart/update/{id}` with `{"quantity": 2}`
- [ ] Verify quantity updated
- [ ] Check total recalculated

### Test 4: Remove from Cart
- [ ] Remove an item from cart
- [ ] Check console: `DELETE /api/cart/remove/{id}`
- [ ] Verify item removed
- [ ] Check cart count updated

---

## 🔍 Product Search API Tests

### Test 1: Search Products
- [ ] Go to Product List screen
- [ ] Type "Orange" in search box
- [ ] Wait 500ms (debounce)
- [ ] Check console: `GET /api/search-products?query=Orange`
- [ ] Verify search results displayed

### Test 2: Search Debounce
- [ ] Type "O" then quickly "r" then "a"
- [ ] Wait 500ms
- [ ] Check console: Only ONE API call with query "Ora"
- [ ] Verify no multiple calls

### Test 3: Search with Filter
- [ ] Set filter to "In Stock"
- [ ] Search for "Apple"
- [ ] Check console: `GET /api/search-products?query=Apple`
- [ ] Verify only in-stock items shown

---

## 👤 Profile API Tests

### Test 1: Load Profile
- [ ] Open Profile screen
- [ ] Check console: `GET /api/profile`
- [ ] Verify name and mobile displayed
- [ ] Check data stored in local storage

---

## 🔧 General API Tests

### Test 1: Console Logging (Dev Mode)
- [ ] Perform any API operation
- [ ] Check console for:
  - `═══════════════════════════════════════════════════════`
  - `📡 API REQUEST INITIATED`
  - Endpoint, URL, Method, Payload, Headers
  - `📥 API RESPONSE RECEIVED`
  - Status, Response Data

### Test 2: Token Authentication
- [ ] Perform authenticated API call
- [ ] Check console: `"Has Token": true`
- [ ] Check headers: `"Authorization": "Bearer {token}"`

### Test 3: No Token Fallback
- [ ] Logout or clear token
- [ ] Try to add address/cart item
- [ ] Verify falls back to local storage
- [ ] No error messages

### Test 4: Network Error
- [ ] Turn off internet
- [ ] Try API operation
- [ ] Check error: "No internet connection"
- [ ] Verify fallback to local storage

### Test 5: Invalid Response
- [ ] Mock invalid JSON response
- [ ] Try API operation
- [ ] Check error: "Invalid response from server"
- [ ] Verify app doesn't crash

---

## 📋 What to Look For in Console Logs

### Request Log Format:
```
═══════════════════════════════════════════════════════
📡 API REQUEST INITIATED
═══════════════════════════════════════════════════════
🔗 Endpoint: /api/cart
🌐 Full URL: https://gayatriorganicfarm.com/api/cart
📤 Method: GET
🔑 Has Token: true
📦 Is FormData: false
📋 Payload: {...}
📨 Headers: {...}
═══════════════════════════════════════════════════════
```

### Response Log Format:
```
═══════════════════════════════════════════════════════
📥 API RESPONSE RECEIVED
═══════════════════════════════════════════════════════
🔗 Endpoint: /api/cart
📊 Status Code: 200
✅ Response OK: true
📦 Response Data: {...}
💬 Message: Success
═══════════════════════════════════════════════════════
```

### Error Log Format:
```
═══════════════════════════════════════════════════════
❌ API EXCEPTION OCCURRED
═══════════════════════════════════════════════════════
🔗 Endpoint: /api/cart
❌ Error: Network request failed
📝 Error Message: ...
═══════════════════════════════════════════════════════
```

---

## 🐛 Common Issues to Check

1. **No Console Logs?**
   - Ensure app is in dev mode (`__DEV__ = true`)
   - Check React Native Debugger is connected

2. **API Calls Failing?**
   - Check base URL: `https://gayatriorganicfarm.com`
   - Verify token is valid
   - Check network connection

3. **Data Not Persisting?**
   - Check API response format matches expected structure
   - Verify data mapping is correct
   - Check local storage fallback

4. **Errors Not Showing?**
   - Check `showError` parameter (should be `true` for user-facing errors)
   - Verify error handling in catch blocks

---

## 📝 Test Results Template

```
Test Date: ___________
Tester: ___________
App Version: ___________

Address API:
- [ ] Load Addresses: PASS / FAIL
- [ ] Add Address: PASS / FAIL
- [ ] Update Address: PASS / FAIL
- [ ] Delete Address: PASS / FAIL
- [ ] Set Default: PASS / FAIL

Cart API:
- [ ] Load Cart: PASS / FAIL
- [ ] Add to Cart: PASS / FAIL
- [ ] Update Quantity: PASS / FAIL
- [ ] Remove from Cart: PASS / FAIL

Product Search:
- [ ] Search Products: PASS / FAIL
- [ ] Search Debounce: PASS / FAIL
- [ ] Search with Filter: PASS / FAIL

Profile API:
- [ ] Load Profile: PASS / FAIL

General:
- [ ] Console Logging: PASS / FAIL
- [ ] Token Auth: PASS / FAIL
- [ ] Error Handling: PASS / FAIL

Notes:
_________________________________________________
_________________________________________________
```


