# Repository Layer Usage Examples

This document shows how to use the repository layer in your API endpoints.

## Basic CRUD Operations

All repositories inherit from `BaseCRUD` which provides these methods:

### Available Methods in BaseCRUD

```python
# Read operations
await repo.get(id)                          # Get by ID
await repo.get_multi(skip=0, limit=100)     # Get multiple with pagination
await repo.get_all()                        # Get all records
await repo.get_by_field("email", "user@example.com")  # Get by any field
await repo.count()                          # Count records
await repo.exists(id)                       # Check if exists

# Create operations
await repo.create(schema)                   # Create single record
await repo.bulk_create([schema1, schema2])  # Create multiple

# Update operations
await repo.update(id, schema)               # Update single record
await repo.bulk_update([{id: ..., field: ...}])  # Update multiple

# Delete operations
await repo.delete(id)                       # Delete single record
await repo.bulk_delete([id1, id2])          # Delete multiple
```

## Example 1: User Repository in API Endpoint

```python
from fastapi import APIRouter, Depends, HTTPException, status
from app.repositories import UserRepository
from app.dependencies import get_user_repository
from app.schemas.user import UserCreate, UserResponse
from uuid import UUID

router = APIRouter()

@router.post("/users", response_model=UserResponse)
async def create_user(
    user_data: UserCreate,
    user_repo: UserRepository = Depends(get_user_repository)
):
    """Create a new user - NO repetitive CRUD code needed!"""

    # Check if email already exists
    existing_user = await user_repo.get_by_email(user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create user - BaseCRUD handles the database logic
    user = await user_repo.create(user_data)
    return user


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: UUID,
    user_repo: UserRepository = Depends(get_user_repository)
):
    """Get user by ID"""
    user = await user_repo.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/users", response_model=list[UserResponse])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    user_repo: UserRepository = Depends(get_user_repository)
):
    """List users with pagination"""
    users = await user_repo.get_multi(skip=skip, limit=limit)
    return users


@router.get("/users/search", response_model=list[UserResponse])
async def search_users(
    query: str,
    user_repo: UserRepository = Depends(get_user_repository)
):
    """Search users - custom method in UserRepository"""
    users = await user_repo.search_users(query)
    return users
```

## Example 2: Item Repository with Advanced Search

```python
from app.repositories import ItemRepository
from app.dependencies import get_item_repository
from app.schemas.item import ItemCreate, ItemSearch

@router.post("/items/search")
async def search_items(
    search: ItemSearch,
    item_repo: ItemRepository = Depends(get_item_repository)
):
    """Advanced search with multiple filters"""
    items = await item_repo.search_items(
        query=search.query,
        item_type=search.type,
        category=search.category,
        status=search.status,
        date_from=search.date_from,
        date_to=search.date_to,
        location=search.location,
        skip=(search.page - 1) * search.page_size,
        limit=search.page_size
    )

    total = await item_repo.count(
        type=search.type,
        category=search.category,
        status=search.status
    )

    return {
        "items": items,
        "total": total,
        "page": search.page,
        "page_size": search.page_size
    }
```

## Example 3: Match Repository

```python
from app.repositories import MatchRepository
from app.dependencies import get_match_repository

@router.get("/items/{item_id}/matches")
async def get_item_matches(
    item_id: UUID,
    is_lost: bool = True,
    match_repo: MatchRepository = Depends(get_match_repository)
):
    """Get top matches for an item"""
    matches = await match_repo.get_top_matches(
        item_id=item_id,
        is_lost=is_lost,
        min_score=0.7,
        limit=10
    )
    return matches


@router.post("/matches/{match_id}/accept")
async def accept_match(
    match_id: UUID,
    match_repo: MatchRepository = Depends(get_match_repository)
):
    """Accept a match"""
    match = await match_repo.accept_match(match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    return match
```

## Example 4: Bulk Operations

```python
@router.post("/items/bulk-create")
async def bulk_create_items(
    items_data: list[ItemCreate],
    item_repo: ItemRepository = Depends(get_item_repository)
):
    """Create multiple items at once"""
    items = await item_repo.bulk_create(items_data)
    return {"created": len(items), "items": items}


@router.delete("/items/bulk-delete")
async def bulk_delete_items(
    item_ids: list[UUID],
    item_repo: ItemRepository = Depends(get_item_repository)
):
    """Delete multiple items at once"""
    deleted_count = await item_repo.bulk_delete(item_ids)
    return {"deleted": deleted_count}
```

## Example 5: Using Multiple Repositories

```python
from app.repositories import UserRepository, ItemRepository, NotificationRepository
from app.dependencies import (
    get_user_repository,
    get_item_repository,
    get_notification_repository
)

@router.post("/items/{item_id}/claim")
async def claim_item(
    item_id: UUID,
    current_user_id: UUID,  # From auth
    item_repo: ItemRepository = Depends(get_item_repository),
    user_repo: UserRepository = Depends(get_user_repository),
    notification_repo: NotificationRepository = Depends(get_notification_repository)
):
    """Claim an item - uses multiple repositories"""

    # Get item
    item = await item_repo.get(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # Get item owner
    owner = await user_repo.get(item.user_id)

    # Create notification for owner
    from app.repositories.notification import NotificationCreate
    notification = await notification_repo.create(NotificationCreate(
        user_id=owner.id,
        type="claim",
        title="New Claim",
        message=f"Someone claimed your item: {item.title}",
        link=f"/items/{item_id}"
    ))

    # Update item status
    await item_repo.mark_as_claimed(item_id)

    return {"message": "Item claimed successfully"}
```

## Benefits of This Approach

✅ **No Repetitive Code**: Write CRUD logic once in BaseCRUD
✅ **Type Safety**: Full type hints with generics
✅ **Easy Testing**: Mock repositories instead of database
✅ **Consistent API**: All repositories have same base methods
✅ **Custom Methods**: Add model-specific methods in each repository
✅ **Dependency Injection**: Easy to use in FastAPI endpoints
✅ **Separation of Concerns**: Database logic separate from API logic

## Repository Structure

```
repositories/
├── base.py              # BaseCRUD with generic operations
├── user.py              # UserRepository with user-specific methods
├── item.py              # ItemRepository with search/filtering
├── match.py             # MatchRepository with matching logic
├── claim.py             # ClaimRepository with approval workflow
├── message.py           # MessageRepository with conversations
├── notification.py      # NotificationRepository with read tracking
└── __init__.py          # Export all repositories
```

Each repository:

1. Inherits from `BaseCRUD[Model, CreateSchema, UpdateSchema]`
2. Gets all base CRUD methods automatically
3. Adds custom methods specific to that model
4. Is injected via dependencies in API endpoints
