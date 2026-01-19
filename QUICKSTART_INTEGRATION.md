# Quick Start Guide - Testing Backend Integration

## Prerequisites

- ✅ Backend running on `http://localhost:8000`
- ✅ PostgreSQL database set up
- ✅ Frontend dependencies installed

## Step 1: Start the Backend

```bash
cd backend

# Ensure dependencies are installed
uv sync

# Run migrations
uv run alembic upgrade head

# Start the server
uv run uvicorn app.main:app --reload
```

Verify backend is running: http://localhost:8000/docs

## Step 2: Create a Test User

You can create a test user via the API docs or using curl:

```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "full_name": "Test User",
    "student_id": "STU001"
  }'
```

## Step 3: Start the Frontend

```bash
cd frontend

# Install dependencies (if not already done)
npm install

# Start the development server
npm run dev
```

Frontend will be available at: http://localhost:3000

## Step 4: Test the Integration

### Test 1: Login

1. Navigate to http://localhost:3000/login
2. Enter credentials:
   - Email: `test@example.com`
   - Password: `TestPassword123!`
3. Click "Sign in"
4. You should be redirected to the dashboard

**Expected Result**: ✅ Successful login, tokens stored in localStorage

### Test 2: View Items

1. Navigate to http://localhost:3000/items
2. The page should load items from the backend

**Expected Result**: ✅ Items list displayed (may be empty if no items exist)

### Test 3: Create an Item

1. Click "Report Lost Item" or "Report Found Item"
2. Fill in the form:
   - Title: "Lost Wallet"
   - Description: "Black leather wallet"
   - Category: "Accessories"
   - Location: "Library"
   - Date: Today's date
3. Submit the form

**Expected Result**: ✅ Item created and visible in items list

### Test 4: View Matches

1. Navigate to http://localhost:3000/matches
2. View AI-matched items

**Expected Result**: ✅ Matches displayed (if any exist)

### Test 5: Create a Claim

1. Go to an item detail page
2. Click "Claim This Item"
3. Fill in verification details
4. Submit the claim

**Expected Result**: ✅ Claim created successfully

### Test 6: Messages

1. Navigate to http://localhost:3000/messages
2. Try sending a message

**Expected Result**: ✅ Message sent and displayed

### Test 7: Profile

1. Navigate to http://localhost:3000/profile
2. Update your profile information
3. Save changes

**Expected Result**: ✅ Profile updated successfully

## Debugging

### Check Browser Console

Open DevTools (F12) → Console tab to see any errors

### Check Network Tab

Open DevTools (F12) → Network tab to see API requests:

- All requests should go to `http://localhost:8000`
- Status codes should be 200 or 201 for successful requests
- Check request headers for `Authorization: Bearer <token>`

### Check Backend Logs

The backend terminal should show incoming requests:

```
INFO:     127.0.0.1:xxxxx - "POST /api/v1/auth/login HTTP/1.1" 200 OK
INFO:     127.0.0.1:xxxxx - "GET /api/v1/items/ HTTP/1.1" 200 OK
```

### Common Issues

#### Issue: "Network Error" or "Failed to fetch"

**Cause**: Backend not running or CORS issue

**Solution**:

1. Verify backend is running on port 8000
2. Check backend CORS settings in `app/main.py`

#### Issue: "401 Unauthorized"

**Cause**: Token expired or invalid

**Solution**:

1. Clear localStorage: `localStorage.clear()`
2. Login again
3. Check backend JWT secret is configured

#### Issue: "422 Validation Error"

**Cause**: Invalid request data

**Solution**:

1. Check the request payload in Network tab
2. Verify all required fields are provided
3. Check data types match backend expectations

## Testing Checklist

- [ ] Backend is running on port 8000
- [ ] Frontend is running on port 3000
- [ ] Can register a new user
- [ ] Can login with credentials
- [ ] Can view items list
- [ ] Can create a new item
- [ ] Can view item details
- [ ] Can view matches
- [ ] Can create a claim
- [ ] Can send messages
- [ ] Can update profile
- [ ] Can logout
- [ ] Tokens are stored in localStorage
- [ ] API requests include Authorization header
- [ ] Token refresh works on 401 errors

## Next Steps

Once basic integration is working:

1. **Add Image Upload**: Test uploading images to items
2. **Real-time Features**: Implement WebSocket for live updates
3. **Search & Filters**: Test advanced search functionality
4. **Pagination**: Implement and test pagination
5. **Error Handling**: Test error scenarios
6. **Performance**: Test with large datasets
7. **Mobile**: Test responsive design on mobile devices

## API Documentation

Full API documentation available at: http://localhost:8000/docs

## Support

If you encounter issues:

1. Check this guide's troubleshooting section
2. Review `BACKEND_INTEGRATION.md` for detailed integration docs
3. Check backend logs for errors
4. Verify environment variables are set correctly
