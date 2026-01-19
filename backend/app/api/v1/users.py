from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID

from app.schemas.user import UserResponse, UserUpdate, UserProfile, PasswordChange
from app.repositories import UserRepository, ItemRepository
from app.dependencies import get_user_repository, get_item_repository
from app.api.deps import get_current_user, get_current_active_user
from app.models.user import User
from app.core.security import verify_password, get_password_hash

router = APIRouter()


@router.get("/me", response_model=UserProfile)
async def get_current_user_profile(
    current_user: User = Depends(get_current_active_user),
    item_repo: ItemRepository = Depends(get_item_repository)
):
    """Get current user's profile with statistics"""
    # Get user stats
    total_items = await item_repo.count(user_id=current_user.id)
    
    return UserProfile(
        **current_user.__dict__,
        total_items=total_items,
        total_matches=0,  # TODO: Add match count
        total_claims=0    # TODO: Add claim count
    )


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    user_repo: UserRepository = Depends(get_user_repository)
):
    """Update current user's profile"""
    updated_user = await user_repo.update(current_user.id, user_update)
    return updated_user


@router.post("/me/change-password")
async def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_active_user),
    user_repo: UserRepository = Depends(get_user_repository)
):
    """Change current user's password"""
    # Verify old password
    if not verify_password(password_data.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect password"
        )
    
    # Update password
    new_hashed_password = get_password_hash(password_data.new_password)
    await user_repo.update(current_user.id, {"hashed_password": new_hashed_password})
    
    return {"message": "Password updated successfully"}


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: UUID,
    user_repo: UserRepository = Depends(get_user_repository)
):
    """Get user by ID"""
    user = await user_repo.get(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


@router.get("/", response_model=List[UserResponse])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    user_repo: UserRepository = Depends(get_user_repository)
):
    """List all users with pagination"""
    users = await user_repo.get_multi(skip=skip, limit=limit)
    return users


@router.get("/search/", response_model=List[UserResponse])
async def search_users(
    query: str,
    skip: int = 0,
    limit: int = 100,
    user_repo: UserRepository = Depends(get_user_repository)
):
    """Search users by name, email, or student ID"""
    users = await user_repo.search_users(query, skip=skip, limit=limit)
    return users
