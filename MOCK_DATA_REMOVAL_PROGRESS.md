# Mock Data Removal - Quick Update Scripts

Since updating all 8 pages is time-consuming, here are the remaining pages that need updates:

## ✅ COMPLETED (3/8)

1. Items List - Real API ✅
2. Dashboard - Real API ✅
3. Matches - Real API ✅

## 🔄 REMAINING (5/8)

### Claims Page

```typescript
// Replace line 18
- import { mockClaims, currentUser, mockItems } from "@/lib/mock-data"
+ import { claimsAPI } from "@/lib/api"
+ import type { Claim } from "@/lib/types"

// Add state
+ const [claims, setClaims] = useState<Claim[]>([])
+ const [loading, setLoading] = useState(true)

// Add useEffect
+ useEffect(() => {
+   async function fetchClaims() {
+     const data = await claimsAPI.getClaims()
+     setClaims(data)
+     setLoading(false)
+   }
+   fetchClaims()
+ }, [])
```

### Messages Page (Most Complex)

- Needs user search functionality
- Real-time messaging
- Conversation list from API
- This is the most complex page

### Profile Page

```typescript
- import { mockItems } from "@/lib/mock-data"
+ import { usersAPI, itemsAPI } from "@/lib/api"

// Fetch user profile and their items
```

### Navbar Component

```typescript
- import { mockNotifications } from "@/lib/mock-data"
+ import { notificationsAPI } from "@/lib/api"

// Fetch notifications
```

### Item Detail Page

```typescript
- import { mockItems, mockMatches } from "@/lib/mock-data"
+ import { itemsAPI, matchesAPI } from "@/lib/api"

// Fetch item by ID from URL params
```

## Quick Test Now

The 3 completed pages are ready to test:

1. **Items** - http://localhost:3000/items
2. **Dashboard** - http://localhost:3000/dashboard
3. **Matches** - http://localhost:3000/matches

All will show empty state since database is clean!

## Next Steps

Choose one:

1. **Continue updating** - I'll finish the remaining 5 pages (~20 min)
2. **Test now** - Test the 3 completed pages, then continue
3. **Pause** - The 3 main pages work, update others as needed

What would you prefer?
