from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID

from app.schemas.claim import ClaimCreate, ClaimResponse, ClaimUpdate, ClaimList
from app.repositories import ClaimRepository, ItemRepository, NotificationRepository
from app.dependencies import get_claim_repository, get_item_repository, get_notification_repository
from app.repositories.notification import NotificationCreate
from app.api.deps import get_current_active_user, get_current_admin
from app.models.user import User

router = APIRouter()


@router.post("/", response_model=ClaimResponse, status_code=status.HTTP_201_CREATED)
async def create_claim(
    claim_data: ClaimCreate,
    current_user: User = Depends(get_current_active_user),
    claim_repo: ClaimRepository = Depends(get_claim_repository),
    item_repo: ItemRepository = Depends(get_item_repository),
    notification_repo: NotificationRepository = Depends(get_notification_repository)
):
    """Submit a claim for an item"""
    # Verify item exists
    item = await item_repo.get(claim_data.item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    
    # Check if user already claimed this item
    existing_claim = await claim_repo.get_claim_by_item_and_user(
        claim_data.item_id,
        current_user.id
    )
    if existing_claim:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already claimed this item"
        )
    
    # Create claim
    claim_dict = claim_data.model_dump()
    claim_dict['claimer_id'] = current_user.id
    
    from pydantic import BaseModel
    from typing import Dict, Any
    
    class ClaimCreateDB(BaseModel):
        item_id: UUID
        claimer_id: UUID
        verification_answers: Dict[str, Any]
    
    claim = await claim_repo.create(ClaimCreateDB(**claim_dict))
    
    # Send notification to item owner
    try:
        notification = NotificationCreate(
            user_id=item.user_id,
            type="claim",
            title="New Claim Received",
            message=f"{current_user.full_name} has claimed your item: {item.title}",
            link=f"/items/{item.id}"
        )
        await notification_repo.create(notification)
    except Exception as e:
        # Log error but don't fail the request
        print(f"Failed to send notification: {e}")
    
    return claim


@router.get("/{claim_id}", response_model=ClaimResponse)
async def get_claim(
    claim_id: UUID,
    claim_repo: ClaimRepository = Depends(get_claim_repository)
):
    """Get claim by ID"""
    claim = await claim_repo.get(claim_id)
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found"
        )
    return claim


@router.get("/", response_model=List[ClaimResponse])
async def list_claims(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    claim_repo: ClaimRepository = Depends(get_claim_repository)
):
    """List all claims by current user"""
    claims = await claim_repo.get_by_claimer(current_user.id, skip=skip, limit=limit)
    return claims


@router.get("/item/{item_id}", response_model=List[ClaimResponse])
async def get_item_claims(
    item_id: UUID,
    current_user: User = Depends(get_current_active_user),
    claim_repo: ClaimRepository = Depends(get_claim_repository),
    item_repo: ItemRepository = Depends(get_item_repository)
):
    """Get all claims for an item (only by item owner or admin)"""
    # Verify item exists
    item = await item_repo.get(item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    
    # Check authorization
    from app.models.user import UserRole
    if item.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view claims for this item"
        )
    
    claims = await claim_repo.get_by_item(item_id)
    return claims


@router.put("/{claim_id}/approve", response_model=ClaimResponse)
async def approve_claim(
    claim_id: UUID,
    admin_notes: str = None,
    current_admin: User = Depends(get_current_admin),
    claim_repo: ClaimRepository = Depends(get_claim_repository)
):
    """Approve a claim (admin only)"""
    claim = await claim_repo.approve_claim(claim_id, current_admin.id, admin_notes)
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found"
        )
    
    # TODO: Send notification to claimer
    # TODO: Update item status to claimed
    
    return claim


@router.put("/{claim_id}/reject", response_model=ClaimResponse)
async def reject_claim(
    claim_id: UUID,
    admin_notes: str = None,
    current_admin: User = Depends(get_current_admin),
    claim_repo: ClaimRepository = Depends(get_claim_repository)
):
    """Reject a claim (admin only)"""
    claim = await claim_repo.reject_claim(claim_id, current_admin.id, admin_notes)
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found"
        )
    
    # TODO: Send notification to claimer
    
    return claim


@router.get("/admin/pending", response_model=List[ClaimResponse])
async def get_pending_claims(
    skip: int = 0,
    limit: int = 100,
    current_admin: User = Depends(get_current_admin),
    claim_repo: ClaimRepository = Depends(get_claim_repository)
):
    """Get all pending claims (admin only)"""
    claims = await claim_repo.get_pending_claims(skip=skip, limit=limit)
    return claims
