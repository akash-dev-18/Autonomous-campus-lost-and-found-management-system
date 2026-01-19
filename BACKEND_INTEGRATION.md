# Backend Integration Guide

## Overview

This document provides a complete guide for integrating the Next.js frontend with the FastAPI backend for the Lost and Found Management System.

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Next.js UI    │────────▶│   API Client     │────────▶│  FastAPI Backend│
│   (React 19)    │         │  (Fetch + JWT)   │         │   (Python 3.11) │
└─────────────────┘         └──────────────────┘         └─────────────────┘
        │                            │                             │
        │                            │                             │
        ▼                            ▼                             ▼
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  Auth Context   │         │  Token Refresh   │         │   PostgreSQL    │
│  (User State)   │         │  (Auto-retry)    │         │   (Database)    │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

## Setup Instructions

### 1. Environment Configuration

Create `.env.local` in the frontend directory:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 2. Backend Requirements

Ensure the backend is running on `http://localhost:8000`:

```bash
cd backend
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`.

## API Integration

### API Client (`lib/api-client.ts`)

The API client provides:

- **Automatic JWT token injection** in request headers
- **Token refresh** on 401 errors
- **Error handling** with user-friendly messages
- **Type-safe requests** with TypeScript generics

### Authentication Flow

1. **Login**: User enters credentials → API call → Store tokens + user data
2. **Token Storage**: Access token and refresh token stored in `localStorage`
3. **Auto-refresh**: On 401 error, automatically refresh token and retry request
4. **Logout**: Clear all tokens and redirect to login

### API Services

All API services are located in `lib/api/`:

#### Auth API (`lib/api/auth.ts`)

- `login(email, password)` - User login
- `register(data)` - User registration
- `logout()` - User logout
- `getCurrentUser()` - Get current user profile

#### Items API (`lib/api/items.ts`)

- `getItems(filters)` - Get all items with filters
- `getItem(id)` - Get single item
- `createItem(data)` - Create new item
- `updateItem(id, data)` - Update item
- `deleteItem(id)` - Delete item
- `uploadImage(itemId, file)` - Upload item image

#### Matches API (`lib/api/matches.ts`)

- `getItemMatches(itemId)` - Get matches for an item
- `getMyMatches()` - Get all user's matches

#### Claims API (`lib/api/claims.ts`)

- `getClaims(status)` - Get claims by status
- `createClaim(data)` - Create new claim
- `updateClaimStatus(id, status)` - Update claim status

#### Messages API (`lib/api/messages.ts`)

- `getConversations()` - Get all conversations
- `getMessages(userId)` - Get messages with a user
- `sendMessage(data)` - Send a message
- `markAsRead(messageId)` - Mark message as read

#### Notifications API (`lib/api/notifications.ts`)

- `getNotifications(isRead, limit)` - Get notifications
- `markAsRead(id)` - Mark notification as read
- `markAllAsRead()` - Mark all notifications as read

#### Users API (`lib/api/users.ts`)

- `getProfile()` - Get user profile
- `updateProfile(data)` - Update user profile

## Usage Examples

### Using Auth Context

```typescript
import { useAuth } from '@/context/auth-context'

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth()

  const handleLogin = async () => {
    try {
      await login('user@example.com', 'password')
      // Redirect or show success
    } catch (error) {
      // Handle error
    }
  }

  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {user?.full_name}!</p>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  )
}
```

### Fetching Items

```typescript
import { itemsAPI } from '@/lib/api'
import { useEffect, useState } from 'react'

function ItemsList() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchItems() {
      try {
        const response = await itemsAPI.getItems({
          type: 'lost',
          status: 'active',
          limit: 20
        })
        setItems(response.items)
      } catch (error) {
        console.error('Failed to fetch items:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchItems()
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <div>
      {items.map(item => (
        <div key={item.id}>{item.title}</div>
      ))}
    </div>
  )
}
```

### Creating a Claim

```typescript
import { claimsAPI } from "@/lib/api";
import { toast } from "sonner";

async function handleCreateClaim(itemId: string) {
  try {
    const claim = await claimsAPI.createClaim({
      item_id: itemId,
      description: "This is my item because...",
      verification_details: {
        color: "blue",
        brand: "Nike",
      },
    });
    toast.success("Claim submitted successfully!");
    return claim;
  } catch (error) {
    toast.error("Failed to submit claim");
    throw error;
  }
}
```

## Error Handling

The API client automatically handles common errors:

- **401 Unauthorized**: Attempts token refresh, then redirects to login
- **403 Forbidden**: User doesn't have permission
- **404 Not Found**: Resource doesn't exist
- **422 Validation Error**: Invalid request data
- **500 Server Error**: Backend error

All errors are thrown as `Error` objects with descriptive messages.

## Type Safety

All API responses are typed using TypeScript interfaces from `lib/types.ts`:

```typescript
interface User {
  id: string;
  email: string;
  full_name: string;
  student_id?: string;
  role: "user" | "admin";
  reputation_score: number;
  is_active: boolean;
  created_at: string;
}

interface Item {
  id: string;
  type: "lost" | "found";
  title: string;
  description: string;
  category: string;
  location: string;
  status: "active" | "claimed" | "returned";
  // ... more fields
}
```

## CORS Configuration

The backend must have CORS enabled for the frontend origin:

```python
# backend/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Testing the Integration

### 1. Test Authentication

```bash
# Backend should be running on port 8000
# Frontend should be running on port 3000

# Navigate to http://localhost:3000/login
# Try logging in with valid credentials
```

### 2. Test API Calls

Open browser DevTools → Network tab to see API requests:

- Login should call `POST /api/v1/auth/login`
- Items page should call `GET /api/v1/items/`
- Each request should include `Authorization: Bearer <token>` header

### 3. Test Token Refresh

1. Login to the app
2. Wait for access token to expire (or manually delete it from localStorage)
3. Make an API call
4. The client should automatically refresh the token and retry

## Deployment Considerations

### Production Environment Variables

```bash
# .env.production
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### Security Best Practices

1. **HTTPS Only**: Always use HTTPS in production
2. **Secure Cookies**: Consider using httpOnly cookies for tokens
3. **CSRF Protection**: Implement CSRF tokens for state-changing operations
4. **Rate Limiting**: Backend should implement rate limiting
5. **Input Validation**: Always validate user input on both frontend and backend

## Troubleshooting

### Issue: CORS Errors

**Solution**: Ensure backend CORS middleware allows the frontend origin.

### Issue: 401 Errors on Every Request

**Solution**: Check that tokens are being stored correctly in localStorage and that the backend JWT secret matches.

### Issue: Token Refresh Loop

**Solution**: Ensure refresh token endpoint is working and not returning 401.

### Issue: Type Errors

**Solution**: Run `npm run build` to check for TypeScript errors.

## Next Steps

1. ✅ Backend integration complete
2. ✅ Authentication flow implemented
3. ✅ API services created
4. ⏳ Implement real-time features (WebSocket)
5. ⏳ Add image upload functionality
6. ⏳ Implement search and filters
7. ⏳ Add pagination
8. ⏳ Write tests

## Support

For issues or questions, refer to:

- Backend API docs: `http://localhost:8000/docs`
- Frontend README: `frontend/README.md`
- System Design: `FRONTEND_SYSTEM_DESIGN.md`
