# Frontend System Design - Lost & Found Management System

## 🎯 Overview

A modern, responsive React-based SPA (Single Page Application) for managing lost and found items with AI-powered matching, real-time messaging, and comprehensive claim management.

---

## 🏗️ Architecture

### **Tech Stack**

- **Framework**: React 18 (with Hooks)
- **Language**: JavaScript (ES6+)
- **Routing**: React Router v6
- **State Management**:
  - Local state (useState, useEffect)
  - Context API for global state (optional)
  - React Query for server state
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Form Handling**: React Hook Form + Zod validation
- **Real-time**: Socket.io Client
- **Build Tool**: Vite

### **Folder Structure**

```
frontend/
├── public/
│   └── assets/
├── src/
│   ├── components/
│   │   ├── common/          # Reusable UI components
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Spinner.jsx
│   │   │   └── Toast.jsx
│   │   ├── layout/          # Layout components
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── Footer.jsx
│   │   └── features/        # Feature-specific components
│   │       ├── ItemCard.jsx
│   │       ├── MatchCard.jsx
│   │       ├── ClaimCard.jsx
│   │       └── ChatBubble.jsx
│   ├── pages/              # Page components
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx
│   │   │   └── RegisterPage.jsx
│   │   ├── dashboard/
│   │   │   └── DashboardPage.jsx
│   │   ├── items/
│   │   │   ├── ItemsPage.jsx
│   │   │   ├── ItemDetailPage.jsx
│   │   │   └── CreateItemPage.jsx
│   │   ├── matches/
│   │   │   └── MatchesPage.jsx
│   │   ├── claims/
│   │   │   └── ClaimsPage.jsx
│   │   ├── messages/
│   │   │   └── MessagesPage.jsx
│   │   └── profile/
│   │       └── ProfilePage.jsx
│   ├── services/           # API services
│   │   ├── api.js          # Axios instance
│   │   ├── auth.service.js
│   │   ├── items.service.js
│   │   ├── matches.service.js
│   │   ├── claims.service.js
│   │   └── messages.service.js
│   ├── hooks/              # Custom hooks
│   │   ├── useAuth.js
│   │   ├── useItems.js
│   │   └── useWebSocket.js
│   ├── utils/              # Utility functions
│   │   ├── formatters.js
│   │   ├── validators.js
│   │   └── constants.js
│   ├── context/            # React Context
│   │   └── AuthContext.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
├── vite.config.js
└── tailwind.config.js
```

---

## 🔌 API Integration & Backend Endpoints

### **Base Configuration**

```javascript
// Environment Variables (.env.local)
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
VITE_S3_URL=http://localhost:9000  // MinIO for file uploads
```

```javascript
// src/services/api.js - Axios Configuration
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Request Interceptor - Add JWT Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor - Handle Token Refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/v1/auth/refresh`,
          { refresh_token: refreshToken },
        );

        localStorage.setItem("access_token", data.access_token);
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;

        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout user
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
```

---

### **1. Authentication Endpoints**

#### **POST** `/api/v1/auth/register`

**Purpose**: Register new user

**Request Body**:

```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "full_name": "John Doe",
  "student_id": "STU12345" // optional
}
```

**Response** (201):

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "student_id": "STU12345",
    "role": "user",
    "reputation_score": 0,
    "created_at": "2024-01-20T00:00:00Z"
  }
}
```

**Frontend Usage**:

```javascript
// src/services/auth.service.js
export const authAPI = {
  register: async (userData) => {
    const response = await api.post("/api/v1/auth/register", userData);
    // Store tokens
    localStorage.setItem("access_token", response.data.access_token);
    localStorage.setItem("refresh_token", response.data.refresh_token);
    localStorage.setItem("user", JSON.stringify(response.data.user));
    return response.data;
  },
};
```

---

#### **POST** `/api/v1/auth/login`

**Purpose**: Login existing user

**Request Body**:

```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response** (200):

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "user",
    "reputation_score": 50
  }
}
```

---

#### **POST** `/api/v1/auth/refresh`

**Purpose**: Refresh access token

**Request Body**:

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (200):

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

---

#### **POST** `/api/v1/auth/logout`

**Purpose**: Logout user (invalidate tokens)

**Headers**: `Authorization: Bearer <access_token>`

**Response** (200):

```json
{
  "message": "Successfully logged out"
}
```

---

### **2. Items Endpoints**

#### **GET** `/api/v1/items/`

**Purpose**: Get all items with filters

**Query Parameters**:

- `type`: "lost" | "found" | null
- `category`: "electronics" | "clothing" | "documents" | etc.
- `status`: "active" | "claimed" | "returned"
- `location`: string
- `skip`: number (pagination offset)
- `limit`: number (default: 20)
- `search`: string (full-text search)

**Example**: `/api/v1/items/?type=lost&category=electronics&limit=10`

**Response** (200):

```json
{
  "items": [
    {
      "id": "uuid",
      "type": "lost",
      "title": "iPhone 13 Pro",
      "description": "Black iPhone 13 Pro, lost in library",
      "category": "electronics",
      "location": "Main Library, 2nd Floor",
      "date_lost_found": "2024-01-15",
      "status": "active",
      "tags": ["iphone", "black", "library"],
      "images": ["https://s3.../image1.jpg"],
      "user_id": "uuid",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 45,
  "skip": 0,
  "limit": 10
}
```

**Frontend Usage**:

```javascript
export const itemsAPI = {
  getItems: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const response = await api.get(`/api/v1/items/?${params}`);
    return response.data;
  },
};
```

---

#### **GET** `/api/v1/items/{item_id}`

**Purpose**: Get single item details

**Response** (200):

```json
{
  "id": "uuid",
  "type": "lost",
  "title": "iPhone 13 Pro",
  "description": "Black iPhone 13 Pro, lost in library",
  "category": "electronics",
  "location": "Main Library, 2nd Floor",
  "date_lost_found": "2024-01-15",
  "status": "active",
  "tags": ["iphone", "black", "library"],
  "images": ["https://s3.../image1.jpg", "https://s3.../image2.jpg"],
  "user": {
    "id": "uuid",
    "full_name": "John Doe",
    "email": "john@example.com"
  },
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

#### **POST** `/api/v1/items/`

**Purpose**: Create new item

**Headers**: `Authorization: Bearer <access_token>`

**Request Body**:

```json
{
  "type": "lost",
  "title": "iPhone 13 Pro",
  "description": "Black iPhone 13 Pro, lost in library on Jan 15",
  "category": "electronics",
  "location": "Main Library, 2nd Floor",
  "date_lost_found": "2024-01-15",
  "tags": ["iphone", "black", "library"]
}
```

**Response** (201):

```json
{
  "id": "uuid",
  "type": "lost",
  "title": "iPhone 13 Pro",
  "status": "active",
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

#### **PUT** `/api/v1/items/{item_id}`

**Purpose**: Update item

**Headers**: `Authorization: Bearer <access_token>`

**Request Body**: (same as POST, partial updates allowed)

**Response** (200): Updated item object

---

#### **DELETE** `/api/v1/items/{item_id}`

**Purpose**: Delete item

**Headers**: `Authorization: Bearer <access_token>`

**Response** (204): No content

---

#### **POST** `/api/v1/items/{item_id}/upload-image`

**Purpose**: Upload item image

**Headers**:

- `Authorization: Bearer <access_token>`
- `Content-Type: multipart/form-data`

**Request Body**: FormData with `file` field

**Response** (200):

```json
{
  "image_url": "https://s3.amazonaws.com/bucket/items/uuid/image.jpg"
}
```

**Frontend Usage**:

```javascript
uploadImage: async (itemId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post(
    `/api/v1/items/${itemId}/upload-image`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return response.data;
};
```

---

### **3. Matches Endpoints**

#### **GET** `/api/v1/matches/item/{item_id}`

**Purpose**: Get matches for specific item

**Headers**: `Authorization: Bearer <access_token>`

**Response** (200):

```json
{
  "matches": [
    {
      "id": "uuid",
      "lost_item_id": "uuid",
      "found_item_id": "uuid",
      "similarity_score": 0.95,
      "matching_attributes": ["color", "brand", "location"],
      "lost_item": {
        /* item object */
      },
      "found_item": {
        /* item object */
      },
      "created_at": "2024-01-16T12:00:00Z"
    }
  ]
}
```

---

#### **GET** `/api/v1/matches/my-matches`

**Purpose**: Get all matches for current user's items

**Headers**: `Authorization: Bearer <access_token>`

**Response** (200): Array of match objects

---

### **4. Claims Endpoints**

#### **GET** `/api/v1/claims/`

**Purpose**: Get all claims (user's claims + claims on user's items)

**Headers**: `Authorization: Bearer <access_token>`

**Query Parameters**:

- `status`: "pending" | "approved" | "rejected" | "completed"

**Response** (200):

```json
{
  "claims": [
    {
      "id": "uuid",
      "item_id": "uuid",
      "claimer_id": "uuid",
      "description": "This is my phone, I can prove it with IMEI",
      "verification_details": {
        "imei": "123456789",
        "purchase_date": "2023-12-01"
      },
      "status": "pending",
      "item": {
        /* item object */
      },
      "claimer": {
        /* user object */
      },
      "created_at": "2024-01-17T09:00:00Z"
    }
  ]
}
```

---

#### **POST** `/api/v1/claims/`

**Purpose**: Create new claim

**Headers**: `Authorization: Bearer <access_token>`

**Request Body**:

```json
{
  "item_id": "uuid",
  "description": "This is my phone, I can prove ownership",
  "verification_details": {
    "imei": "123456789",
    "purchase_date": "2023-12-01"
  }
}
```

**Response** (201): Claim object

---

#### **PUT** `/api/v1/claims/{claim_id}/status`

**Purpose**: Update claim status (approve/reject)

**Headers**: `Authorization: Bearer <access_token>`

**Request Body**:

```json
{
  "status": "approved" // or "rejected"
}
```

**Response** (200): Updated claim object

---

### **5. Messages Endpoints**

#### **GET** `/api/v1/messages/conversations`

**Purpose**: Get all conversations for current user

**Headers**: `Authorization: Bearer <access_token>`

**Response** (200):

```json
{
  "conversations": [
    {
      "user": {
        "id": "uuid",
        "full_name": "Jane Smith",
        "email": "jane@example.com"
      },
      "last_message": "Thanks for finding my phone!",
      "last_message_at": "2024-01-18T15:30:00Z",
      "unread_count": 2
    }
  ]
}
```

---

#### **GET** `/api/v1/messages/{user_id}`

**Purpose**: Get messages with specific user

**Headers**: `Authorization: Bearer <access_token>`

**Response** (200):

```json
{
  "messages": [
    {
      "id": "uuid",
      "sender_id": "uuid",
      "receiver_id": "uuid",
      "content": "Hi, is this still available?",
      "is_read": true,
      "created_at": "2024-01-18T14:00:00Z"
    }
  ]
}
```

---

#### **POST** `/api/v1/messages/`

**Purpose**: Send new message

**Headers**: `Authorization: Bearer <access_token>`

**Request Body**:

```json
{
  "receiver_id": "uuid",
  "content": "Yes, it's still available!"
}
```

**Response** (201): Message object

---

#### **PUT** `/api/v1/messages/{message_id}/read`

**Purpose**: Mark message as read

**Headers**: `Authorization: Bearer <access_token>`

**Response** (200): Updated message object

---

### **6. Notifications Endpoints**

#### **GET** `/api/v1/notifications/`

**Purpose**: Get user notifications

**Headers**: `Authorization: Bearer <access_token>`

**Query Parameters**:

- `is_read`: boolean
- `limit`: number

**Response** (200):

```json
{
  "notifications": [
    {
      "id": "uuid",
      "type": "match_found",
      "message": "New match found for your lost iPhone!",
      "data": {
        "match_id": "uuid",
        "item_id": "uuid"
      },
      "is_read": false,
      "created_at": "2024-01-18T16:00:00Z"
    }
  ]
}
```

---

#### **PUT** `/api/v1/notifications/{notification_id}/read`

**Purpose**: Mark notification as read

**Headers**: `Authorization: Bearer <access_token>`

**Response** (200): Updated notification

---

#### **PUT** `/api/v1/notifications/read-all`

**Purpose**: Mark all notifications as read

**Headers**: `Authorization: Bearer <access_token>`

**Response** (200):

```json
{
  "message": "All notifications marked as read"
}
```

---

### **7. Users Endpoints**

#### **GET** `/api/v1/users/me`

**Purpose**: Get current user profile

**Headers**: `Authorization: Bearer <access_token>`

**Response** (200):

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "student_id": "STU12345",
  "phone": "+1234567890",
  "role": "user",
  "reputation_score": 75,
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

#### **PUT** `/api/v1/users/me`

**Purpose**: Update user profile

**Headers**: `Authorization: Bearer <access_token>`

**Request Body**:

```json
{
  "full_name": "John Doe Updated",
  "phone": "+1234567890"
}
```

**Response** (200): Updated user object

---

### **8. WebSocket Events**

**Connection**: `ws://localhost:8000/ws?token=<access_token>`

#### **Events to Listen**:

```javascript
// src/services/websocket.js
import io from "socket.io-client";

const socket = io(import.meta.env.VITE_WS_URL, {
  auth: {
    token: localStorage.getItem("access_token"),
  },
});

// Listen for new messages
socket.on("message:new", (data) => {
  console.log("New message:", data);
  // Update UI
});

// Listen for new notifications
socket.on("notification:new", (data) => {
  console.log("New notification:", data);
  // Show toast notification
});

// Listen for new matches
socket.on("match:found", (data) => {
  console.log("New match found:", data);
  // Update matches list
});

// Listen for claim updates
socket.on("claim:update", (data) => {
  console.log("Claim updated:", data);
  // Update claims list
});

// Emit typing indicator
socket.emit("typing:start", { receiver_id: "uuid" });
socket.emit("typing:stop", { receiver_id: "uuid" });
```

---

### **9. Error Handling**

**Standard Error Response**:

```json
{
  "detail": "Error message here",
  "status_code": 400
}
```

**Common Status Codes**:

- `200`: Success
- `201`: Created
- `204`: No Content (successful deletion)
- `400`: Bad Request (validation error)
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `422`: Validation Error
- `500`: Internal Server Error

**Frontend Error Handler**:

```javascript
const handleAPIError = (error) => {
  if (error.response) {
    const { status, data } = error.response;

    switch (status) {
      case 400:
        return data.detail || "Invalid request";
      case 401:
        return "Please login again";
      case 403:
        return "You don't have permission";
      case 404:
        return "Resource not found";
      case 422:
        return data.detail[0]?.msg || "Validation error";
      default:
        return "Something went wrong";
    }
  }
  return "Network error";
};
```

---

### **10. Complete Service Layer Example**

```javascript
// src/services/items.service.js
import api from "./api";

export const itemsAPI = {
  // Get all items
  getItems: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        params.append(key, value);
      }
    });
    const response = await api.get(`/api/v1/items/?${params}`);
    return response.data;
  },

  // Get single item
  getItem: async (id) => {
    const response = await api.get(`/api/v1/items/${id}`);
    return response.data;
  },

  // Create item
  createItem: async (itemData) => {
    const response = await api.post("/api/v1/items/", itemData);
    return response.data;
  },

  // Update item
  updateItem: async (id, itemData) => {
    const response = await api.put(`/api/v1/items/${id}`, itemData);
    return response.data;
  },

  // Delete item
  deleteItem: async (id) => {
    await api.delete(`/api/v1/items/${id}`);
  },

  // Upload image
  uploadImage: async (itemId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post(
      `/api/v1/items/${itemId}/upload-image`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  },
};
```

---

## 🎨 Design System

### **Color Palette**

```javascript
// Primary Colors
primary: {
  50: '#eff6ff',   // Very light blue
  500: '#3b82f6',  // Main blue
  700: '#1d4ed8',  // Dark blue
  900: '#1e3a8a',  // Very dark blue
}

// Semantic Colors
success: '#10b981',  // Green
warning: '#f59e0b',  // Orange
error: '#ef4444',    // Red
info: '#3b82f6',     // Blue

// Neutral
gray: {
  50: '#f9fafb',
  100: '#f3f4f6',
  500: '#6b7280',
  900: '#111827',
}
```

### **Typography**

- **Font Family**: Inter (Google Fonts)
- **Headings**:
  - H1: 3rem (48px), font-weight: 800
  - H2: 2rem (32px), font-weight: 700
  - H3: 1.5rem (24px), font-weight: 600
- **Body**: 1rem (16px), font-weight: 400
- **Small**: 0.875rem (14px)

### **Spacing System**

- Base unit: 4px (0.25rem)
- Scale: 4, 8, 12, 16, 24, 32, 48, 64px

### **Component Styles**

- **Border Radius**:
  - Small: 8px
  - Medium: 12px
  - Large: 16px
  - XL: 24px
- **Shadows**:
  - sm: `0 1px 2px rgba(0,0,0,0.05)`
  - md: `0 4px 6px rgba(0,0,0,0.1)`
  - lg: `0 10px 15px rgba(0,0,0,0.1)`
  - xl: `0 20px 25px rgba(0,0,0,0.1)`

---

## 📱 Pages & Features

### **1. Authentication Pages**

#### **Login Page** (`/login`)

**Features:**

- Email/password login form
- Form validation (email format, required fields)
- Error handling with user-friendly messages
- "Remember me" checkbox
- "Forgot password" link
- Redirect to dashboard on success
- Link to registration page

**UI Elements:**

- Centered card layout
- Logo/branding at top
- Clean, minimal design
- Loading state during login
- Error toast notifications

#### **Registration Page** (`/register`)

**Features:**

- Multi-field registration form:
  - Full Name
  - Email
  - Student ID (optional)
  - Password (with strength indicator)
  - Confirm Password
- Real-time validation
- Terms & conditions checkbox
- Auto-login after registration
- Link to login page

**UI Elements:**

- Step-by-step form (optional)
- Password strength meter
- Validation feedback inline
- Success animation

---

### **2. Dashboard** (`/dashboard`)

**Features:**

- **Welcome Section**: Personalized greeting with user's name
- **Quick Stats Cards**:
  - Total items reported
  - Active matches
  - Pending claims
  - Unread messages
- **Quick Actions**:
  - Report Lost Item (button)
  - Report Found Item (button)
  - Browse Items
  - View Matches
- **Recent Activity Feed**:
  - Latest items posted
  - New matches
  - Claim updates
- **Notifications Bell**: Dropdown with recent notifications

**UI Layout:**

```
┌─────────────────────────────────────────┐
│  Navbar (Logo, Nav Links, Profile)     │
├─────────────────────────────────────────┤
│  Welcome, [User Name]! 👋              │
├─────────────────────────────────────────┤
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐│
│  │ 12   │  │  5   │  │  3   │  │  8   ││
│  │Items │  │Matchs│  │Claims│  │Msgs  ││
│  └──────┘  └──────┘  └──────┘  └──────┘│
├─────────────────────────────────────────┤
│  Quick Actions                          │
│  [Report Lost] [Report Found] [Browse] │
├─────────────────────────────────────────┤
│  Recent Activity                        │
│  • New item posted: iPhone 13...       │
│  • Match found for your wallet...      │
└─────────────────────────────────────────┘
```

---

### **3. Items Management**

#### **Items List Page** (`/items`)

**Features:**

- **Filters**:
  - Type: All / Lost / Found
  - Category: Electronics, Clothing, Documents, etc.
  - Date range
  - Location
  - Status: Active / Claimed / Returned
- **Search Bar**: Full-text search
- **Sort Options**: Date, Relevance, Location
- **Grid/List View Toggle**
- **Pagination** or Infinite Scroll
- **Item Cards** showing:
  - Image (if available)
  - Title
  - Type badge (Lost/Found)
  - Category
  - Location
  - Date posted
  - Status

**UI Layout:**

```
┌─────────────────────────────────────────┐
│  Search: [____________] 🔍              │
├─────────────────────────────────────────┤
│  Filters: [All] [Lost] [Found]         │
│  Category: [Electronics ▼]             │
├─────────────────────────────────────────┤
│  ┌────────┐  ┌────────┐  ┌────────┐   │
│  │ 📱     │  │ 👕     │  │ 🎒     │   │
│  │iPhone  │  │Jacket  │  │Backpack│   │
│  │Lost    │  │Found   │  │Lost    │   │
│  │Library │  │Gym     │  │Cafe    │   │
│  └────────┘  └────────┘  └────────┘   │
└─────────────────────────────────────────┘
```

#### **Item Detail Page** (`/items/:id`)

**Features:**

- **Full Item Information**:
  - Large image gallery (if multiple images)
  - Title
  - Description
  - Type (Lost/Found)
  - Category
  - Location (with map integration optional)
  - Date lost/found
  - Current status
  - Tags
- **Actions**:
  - Claim Item (button)
  - Contact Owner (message)
  - Share (social media)
  - Report (flag inappropriate)
  - Edit (if owner)
  - Delete (if owner)
- **Similar Items**: AI-suggested matches
- **Comments Section** (optional)

#### **Create/Edit Item Page** (`/items/create`, `/items/:id/edit`)

**Features:**

- **Form Fields**:
  - Type: Lost / Found (radio buttons)
  - Title (required)
  - Description (textarea, rich text optional)
  - Category (dropdown)
  - Location (text + map picker optional)
  - Date lost/found (date picker)
  - Tags (multi-select)
  - Images (drag & drop upload, max 5)
- **Form Validation**: Real-time
- **Auto-save Draft** (localStorage)
- **Preview Mode**
- **Submit Button** with loading state

---

### **4. Matches Page** (`/matches`)

**Features:**

- **AI-Matched Items Display**:
  - Side-by-side comparison
  - Similarity score (percentage)
  - Matching attributes highlighted
- **Match Cards** showing:
  - Lost item details
  - Found item details
  - Match confidence score
  - Date matched
- **Actions**:
  - View Details
  - Claim Item
  - Dismiss Match
  - Contact Other User
- **Filter by Score**: High (>80%), Medium (50-80%), Low (<50%)
- **Sort**: By score, date

**UI Layout:**

```
┌─────────────────────────────────────────┐
│  Your Matches (AI-Powered)              │
├─────────────────────────────────────────┤
│  ┌──────────┐  ↔️  ┌──────────┐        │
│  │ Lost:    │      │ Found:   │        │
│  │ iPhone 13│      │ iPhone 13│        │
│  │ Black    │      │ Black    │        │
│  └──────────┘      └──────────┘        │
│  Match: 95% ████████████░░              │
│  [View Details] [Claim]                 │
└─────────────────────────────────────────┘
```

---

### **5. Claims Page** (`/claims`)

**Features:**

- **My Claims Tab**: Claims I've submitted
- **Claims on My Items Tab**: Claims others made on my items
- **Claim Cards** showing:
  - Item details
  - Claimer information
  - Claim description
  - Verification questions/answers
  - Status: Pending / Approved / Rejected / Completed
  - Timestamp
- **Actions**:
  - Approve Claim (if item owner)
  - Reject Claim (if item owner)
  - Provide Additional Info
  - Mark as Returned
  - Cancel Claim
- **Status Filters**: All, Pending, Approved, Rejected
- **Claim Detail Modal**: Full claim information

**Claim Workflow:**

1. User clicks "Claim" on item
2. Fill claim form (description, verification details)
3. Submit claim
4. Owner reviews claim
5. Owner approves/rejects
6. If approved, arrange return
7. Mark as returned

---

### **6. Messages Page** (`/messages`)

**Features:**

- **Two-Column Layout**:
  - Left: Conversation list
  - Right: Active chat
- **Conversation List**:
  - User avatar
  - User name
  - Last message preview
  - Timestamp
  - Unread badge
  - Search conversations
- **Chat Interface**:
  - Message bubbles (sent/received)
  - Timestamps
  - Read receipts
  - Typing indicator
  - Image sharing
  - Emoji support
- **Real-time Updates**: WebSocket/Socket.io
- **Message Input**:
  - Text area with auto-resize
  - Send button
  - Attachment button
  - Emoji picker

**UI Layout:**

```
┌──────────────┬──────────────────────────┐
│ Conversations│  Chat with John Doe      │
│              │  ┌────────────────────┐  │
│ • John Doe   │  │ Hi, is this still  │  │
│   "Hi, is... │  │ available?         │  │
│   2m ago     │  └────────────────────┘  │
│              │         ┌──────────────┐ │
│ • Jane Smith │         │ Yes, it is!  │ │
│   "Thanks!"  │         └──────────────┘ │
│   1h ago     │                          │
│              │  [Type a message...] [>] │
└──────────────┴──────────────────────────┘
```

---

### **7. Profile Page** (`/profile`)

**Features:**

- **Profile Information**:
  - Avatar (upload/change)
  - Full Name (editable)
  - Email (display only)
  - Student ID
  - Phone Number (optional)
  - Bio (optional)
- **Statistics**:
  - Items reported
  - Items returned
  - Reputation score
  - Member since
- **My Items Section**: List of user's items
- **Settings**:
  - Email notifications toggle
  - Push notifications toggle
  - Privacy settings
- **Change Password**: Modal/separate section
- **Account Actions**:
  - Edit Profile
  - Deactivate Account

---

## 🔐 Authentication & Security

### **Authentication Flow**

1. User logs in → JWT tokens (access + refresh) stored in localStorage
2. Axios interceptor adds `Authorization: Bearer <token>` to all requests
3. On 401 error → Attempt token refresh
4. If refresh fails → Redirect to login
5. Protected routes check for valid token

### **Protected Routes**

- All pages except `/login` and `/register` require authentication
- Use `ProtectedRoute` component wrapper
- Redirect to `/login` if not authenticated

### **Security Measures**

- XSS Protection: Sanitize user inputs
- CSRF Protection: Token-based
- Secure token storage
- HTTPS only in production
- Input validation on all forms

---

## 🎭 UI/UX Principles

### **Design Philosophy**

- **Clean & Minimal**: Avoid clutter
- **Intuitive Navigation**: Clear hierarchy
- **Responsive**: Mobile-first approach
- **Accessible**: WCAG 2.1 AA compliance
- **Fast**: Optimized performance

### **Responsive Breakpoints**

- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### **Loading States**

- Skeleton screens for content loading
- Spinners for actions
- Progress bars for uploads
- Optimistic UI updates

### **Error Handling**

- Toast notifications for errors
- Inline validation messages
- Fallback UI for crashes
- Retry mechanisms

### **Animations**

- Smooth transitions (200-300ms)
- Fade in/out for modals
- Slide animations for drawers
- Micro-interactions on hover

---

## 🚀 Performance Optimization

### **Code Splitting**

- Route-based code splitting
- Lazy load components
- Dynamic imports for heavy libraries

### **Caching Strategy**

- React Query for server state caching
- Service Worker for offline support
- Image lazy loading
- Memoization with `useMemo`, `useCallback`

### **Bundle Optimization**

- Tree shaking
- Minification
- Compression (gzip/brotli)
- CDN for static assets

---

## 📊 State Management

### **Local State**

- Component-level state with `useState`
- Form state with React Hook Form

### **Global State**

- Auth context for user data
- Theme context (optional dark mode)

### **Server State**

- React Query for API data
- Automatic refetching
- Cache invalidation
- Optimistic updates

---

## 🔄 Real-time Features

### **WebSocket Integration**

- Socket.io client for real-time messaging
- Live notifications
- Online/offline status
- Typing indicators

### **Events to Handle**

- `message:new` - New message received
- `notification:new` - New notification
- `match:found` - New match found
- `claim:update` - Claim status changed

---

## 🧪 Testing Strategy

### **Unit Tests**

- Component testing with React Testing Library
- Utility function tests
- Hook tests

### **Integration Tests**

- API integration tests
- Form submission flows
- Authentication flows

### **E2E Tests**

- Critical user journeys
- Playwright or Cypress

---

## 📦 Deployment

### **Build Process**

```bash
npm run build
```

- Outputs to `/dist`
- Optimized for production
- Environment variables via `.env`

### **Hosting Options**

- Vercel (recommended)
- Netlify
- AWS S3 + CloudFront
- Firebase Hosting

---

## 🎯 Key Features Summary

### **Must-Have Features**

✅ User authentication (login/register)
✅ Item CRUD operations
✅ Search and filters
✅ AI-powered matching
✅ Claims management
✅ Real-time messaging
✅ Notifications
✅ User profiles
✅ Responsive design

### **Nice-to-Have Features**

- Dark mode toggle
- Multi-language support
- Social media sharing
- Email notifications
- Push notifications
- Map integration for locations
- Image recognition for items
- Analytics dashboard
- Export data functionality

---

## 📈 Future Enhancements

1. **Mobile App**: React Native version
2. **PWA**: Progressive Web App capabilities
3. **Voice Search**: Voice-based item search
4. **AR Integration**: Augmented reality for item visualization
5. **Blockchain**: Immutable claim records
6. **AI Chatbot**: Automated support

---

This design provides a comprehensive, scalable, and user-friendly frontend for your Lost & Found Management System! 🚀
