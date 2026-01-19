from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID

from app.schemas.match import MatchResponse, MatchWithItems, MatchUpdate
from app.repositories import MatchRepository, ItemRepository
from app.dependencies import get_match_repository, get_item_repository
from app.api.deps import get_current_active_user
from app.models.user import User

router = APIRouter()


@router.get("/item/{item_id}", response_model=List[MatchResponse])
async def get_item_matches(
    item_id: UUID,
    current_user: User = Depends(get_current_active_user),
    match_repo: MatchRepository = Depends(get_match_repository),
    item_repo: ItemRepository = Depends(get_item_repository)
):
    """Get all matches for an item"""
    # Verify item exists and belongs to user
    item = await item_repo.get(item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    
    if item.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view matches for this item"
        )
    
    # Get matches based on item type
    from app.models.item import ItemType
    if item.type == ItemType.LOST:
        matches = await match_repo.get_by_lost_item(item_id)
    else:
        matches = await match_repo.get_by_found_item(item_id)
    
    return matches


@router.get("/{match_id}", response_model=MatchResponse)
async def get_match(
    match_id: UUID,
    match_repo: MatchRepository = Depends(get_match_repository)
):
    """Get match by ID"""
    match = await match_repo.get(match_id)
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match not found"
        )
    return match


@router.put("/{match_id}/accept", response_model=MatchResponse)
async def accept_match(
    match_id: UUID,
    current_user: User = Depends(get_current_active_user),
    match_repo: MatchRepository = Depends(get_match_repository)
):
    """Accept a match"""
    match = await match_repo.accept_match(match_id)
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match not found"
        )
    
    # TODO: Send notification to other user
    
    return match


@router.put("/{match_id}/reject", response_model=MatchResponse)
async def reject_match(
    match_id: UUID,
    current_user: User = Depends(get_current_active_user),
    match_repo: MatchRepository = Depends(get_match_repository)
):
    """Reject a match"""
    match = await match_repo.reject_match(match_id)
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match not found"
        )
    return match
