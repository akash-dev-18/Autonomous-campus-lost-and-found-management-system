# Testing Guide - Real Data

## ✅ Database Status

All dummy data has been cleared! Current database state:

| Table     | Count    |
| --------- | -------- |
| Items     | 0        |
| Matches   | 0        |
| Claims    | 0        |
| Messages  | 0        |
| **Users** | **6** ✅ |

## 🧪 Testing Workflow

### 1. Report Lost/Found Items

**Test creating items:**

1. Login with `akash@gmail.com`
2. Go to **Items** page
3. Click **"Report Lost Item"** or **"Report Found Item"**
4. Fill in details:
   - Title: "Black Wallet"
   - Description: "Black leather wallet with student ID"
   - Category: "Accessories"
   - Location: "Library"
   - Date: Today
   - Tags: wallet, black, leather
5. Submit
6. Verify item appears in items list

**Repeat with different items to test matching:**

- Lost: "Blue Backpack" (Library, yesterday)
- Found: "Blue Bag" (Library, today)
- Lost: "iPhone 13" (Cafeteria, 2 days ago)
- Found: "Black Phone" (Cafeteria, today)

### 2. Test AI Matching

**After creating items:**

1. Go to **Matches** page
2. Check if AI has matched similar items
3. Verify similarity scores
4. Check matching attributes

**Expected behavior:**

- "Blue Backpack" should match "Blue Bag" (high similarity)
- "iPhone 13" should match "Black Phone" (medium similarity)

### 3. Test Claims

**Create a claim:**

1. Find a matched item
2. Click **"Claim This Item"**
3. Fill in verification details:
   - Description: "This is my wallet, I lost it yesterday"
   - Verification:
     - Color: "Black"
     - Brand: "Nike"
     - Contents: "Student ID, Credit Card"
4. Submit claim
5. Verify claim appears in **Claims** page

**Test claim status updates:**

- As item owner: Approve/Reject claims
- As claimer: View claim status

### 4. Test Messaging

**Send messages:**

1. Go to item detail page
2. Click **"Contact Owner"** or **"Message"**
3. Send a message: "Hi, I found your wallet"
4. Login with different account
5. Check **Messages** page
6. Verify message appears
7. Reply to message
8. Test real-time updates

**Expected behavior:**

- Messages appear in conversations list
- Unread count updates
- Real-time message delivery (if WebSocket is enabled)

### 5. Test User Profiles

**View user details:**

1. Click on a user's name/avatar
2. Verify profile shows:
   - Full name
   - Email
   - Student ID (if provided)
   - Reputation score
   - Total items posted
   - Join date
3. Test profile editing:
   - Update full name
   - Add/update phone number
   - Save changes

### 6. Test Notifications

**Check notifications:**

1. Create an item
2. Have another user claim it
3. Check **Notifications** page
4. Verify notification appears:
   - "New claim on your item"
   - "Match found for your item"
   - "New message from [user]"

### 7. Test Search & Filters

**Search functionality:**

1. Go to **Items** page
2. Use search bar: "wallet"
3. Verify results show matching items
4. Test filters:
   - Type: Lost/Found
   - Category: Accessories
   - Status: Active/Claimed
   - Location: Library

### 8. Test Image Upload

**Upload item images:**

1. Create/edit an item
2. Click **"Upload Image"**
3. Select image file
4. Verify image appears
5. Test multiple images
6. Verify images display in item detail

## 🐛 What to Look For

### ✅ Should Work:

- User registration and login
- Creating lost/found items
- Viewing items list
- Item detail pages
- Creating claims
- Viewing claims
- Sending messages
- Viewing profile
- Updating profile

### ⚠️ May Need Testing:

- AI matching algorithm
- Real-time messaging (WebSocket)
- Image upload to MinIO
- Notification delivery
- Search functionality
- Advanced filters

### 🔍 Check For:

- **UI/UX**: Is everything responsive?
- **Errors**: Any console errors?
- **Performance**: Fast loading?
- **Data**: Correct data display?
- **Navigation**: Smooth transitions?

## 📊 Test Accounts

You can use any of these accounts for testing:

| Email                | Use Case                     |
| -------------------- | ---------------------------- |
| akash@gmail.com      | Main test account            |
| akashkumar@gmail.com | Secondary user for messaging |
| akkash@gmail.com     | Third user for claims        |
| test@example.com     | General testing              |
| user@example.com     | Additional testing           |

## 🎯 Success Criteria

- ✅ Can create items
- ✅ Items appear in list
- ✅ Can view item details
- ✅ Can create claims
- ✅ Can send messages
- ✅ Can view and update profile
- ✅ No 403/401 errors
- ✅ No console errors
- ✅ Smooth user experience

## 📝 Report Issues

If you find any issues, check:

1. **Browser Console** (F12 → Console)
2. **Network Tab** (F12 → Network)
3. **Backend Logs** (terminal running uvicorn)

Common issues:

- **404 errors**: Endpoint not found
- **500 errors**: Backend error
- **CORS errors**: Check backend CORS settings
- **Type errors**: Frontend/backend schema mismatch

---

**Happy Testing! 🚀**

Let me know if you find any bugs or need any features adjusted!
