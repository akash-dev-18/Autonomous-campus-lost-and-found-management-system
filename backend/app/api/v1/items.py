from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from typing import List, Optional
from uuid import UUID

from app.schemas.item import ItemCreate, ItemUpdate, ItemResponse, ItemList, ItemSearch
from app.repositories import ItemRepository
from app.dependencies import get_item_repository
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.item import ItemType, ItemStatus

router = APIRouter()


@router.post("/", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
async def create_item(
    item_data: ItemCreate,
    current_user: User = Depends(get_current_active_user),
    item_repo: ItemRepository = Depends(get_item_repository)
):
    """
    Create a new lost or found item.
    
    - **type**: lost or found
    - **title**: Item title
    - **description**: Detailed description
    - **category**: Item category (electronics, documents, etc.)
    - **location_found**: Where the item was lost/found
    - **date_lost_found**: Date when item was lost/found
    """
    # Add user_id to item data
    item_dict = item_data.model_dump()
    item_dict['user_id'] = current_user.id
    
    from pydantic import BaseModel
    from datetime import date
    
    class ItemCreateDB(BaseModel):
        user_id: UUID
        type: ItemType
        title: str
        description: str
        category: str
        location_found: Optional[str] = None
        date_lost_found: date
        images: List[str] = []
        tags: List[str] = []
    
    item = await item_repo.create(ItemCreateDB(**item_dict))
    
    # TODO: Trigger matching algorithm in background
    
    return item


@router.get("/{item_id}", response_model=ItemResponse)
async def get_item(
    item_id: UUID,
    item_repo: ItemRepository = Depends(get_item_repository)
):
    """Get item by ID"""
    item = await item_repo.get(item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    return item


@router.put("/{item_id}", response_model=ItemResponse)
async def update_item(
    item_id: UUID,
    item_update: ItemUpdate,
    current_user: User = Depends(get_current_active_user),
    item_repo: ItemRepository = Depends(get_item_repository)
):
    """Update an item (only by owner)"""
    # Get item
    item = await item_repo.get(item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    
    # Check ownership
    if item.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this item"
        )
    
    # Update item
    updated_item = await item_repo.update(item_id, item_update)
    return updated_item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    item_id: UUID,
    current_user: User = Depends(get_current_active_user),
    item_repo: ItemRepository = Depends(get_item_repository)
):
    """Delete an item (only by owner)"""
    # Get item
    item = await item_repo.get(item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    
    # Check ownership
    if item.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this item"
        )
    
    # Delete item
    await item_repo.delete(item_id)


@router.get("/", response_model=ItemList)
async def list_items(
    skip: int = 0,
    limit: int = 20,
    type: Optional[ItemType] = None,
    status: Optional[ItemStatus] = None,
    category: Optional[str] = None,
    item_repo: ItemRepository = Depends(get_item_repository)
):
    """List items with pagination and filters"""
    filters = {}
    if type:
        filters['type'] = type
    if status:
        filters['status'] = status
    if category:
        filters['category'] = category
    
    items = await item_repo.get_multi(skip=skip, limit=limit, **filters)
    total = await item_repo.count(**filters)
    
    return ItemList(
        items=items,
        total=total,
        page=skip // limit + 1,
        page_size=limit,
        total_pages=(total + limit - 1) // limit
    )


@router.post("/search", response_model=ItemList)
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
    
    # Count with same filters
    filters = {}
    if search.type:
        filters['type'] = search.type
    if search.category:
        filters['category'] = search.category
    if search.status:
        filters['status'] = search.status
    
    total = await item_repo.count(**filters)
    
    return ItemList(
        items=items,
        total=total,
        page=search.page,
        page_size=search.page_size,
        total_pages=(total + search.page_size - 1) // search.page_size
    )


@router.get("/user/me", response_model=List[ItemResponse])
async def get_my_items(
    current_user: User = Depends(get_current_active_user),
    item_repo: ItemRepository = Depends(get_item_repository)
):
    """Get all items posted by current user"""
    items = await item_repo.get_by_user(current_user.id)
    return items
