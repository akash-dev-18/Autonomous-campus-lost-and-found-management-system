from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.database import get_db
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token
from app.repositories import UserRepository
from app.dependencies import get_user_repository
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token
from app.core.cache import SessionCache

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    user_repo: UserRepository = Depends(get_user_repository)
):
    """
    Register a new user.
    
    - **email**: Valid email address (will be verified)
    - **password**: Strong password (min 8 chars, uppercase, lowercase, digit)
    - **full_name**: User's full name
    - **student_id**: Optional student ID
    """
    # Check if email already exists
    existing_user = await user_repo.get_by_email(user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if student_id already exists
    if user_data.student_id:
        existing_student = await user_repo.get_by_student_id(user_data.student_id)
        if existing_student:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Student ID already registered"
            )
    
    # Hash password
    user_dict = user_data.model_dump()
    user_dict['hashed_password'] = get_password_hash(user_dict.pop('password'))
    
    # Create user
    from app.schemas.user import UserBase
    from pydantic import BaseModel
    
    class UserCreateDB(BaseModel):
        email: str
        hashed_password: str
        full_name: str
        student_id: str | None = None
        phone: str | None = None
    
    user = await user_repo.create(UserCreateDB(**user_dict))
    
    # TODO: Send verification email
    
    return user


@router.post("/login", response_model=Token)
async def login(
    credentials: UserLogin,
    user_repo: UserRepository = Depends(get_user_repository)
):
    """
    Login with email and password.
    
    Returns access token and refresh token.
    """
    # Get user by email
    user = await user_repo.get_by_email(credentials.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Verify password
    if not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )
    
    # Update last login
    await user_repo.update(user.id, {"last_login": datetime.utcnow()})
    
    # Create tokens
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    # Store session in Redis
    await SessionCache.create_session(
        str(user.id),
        {
            "email": user.email,
            "role": user.role.value,
            "login_time": datetime.utcnow().isoformat()
        }
    )
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=user
    )


@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_token: str,
    user_repo: UserRepository = Depends(get_user_repository)
):
    """
    Refresh access token using refresh token.
    """
    from app.core.security import verify_token
    from uuid import UUID
    
    # Verify refresh token
    user_id = verify_token(refresh_token, token_type="refresh")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    
    # Check if user exists and is active
    user = await user_repo.get(UUID(user_id))
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    # Create new tokens
    new_access_token = create_access_token(data={"sub": user_id})
    new_refresh_token = create_refresh_token(data={"sub": user_id})
    
    return Token(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer"
    )


@router.post("/logout")
async def logout(
    current_user_id: str = Depends(get_user_repository)
):
    """
    Logout current user (invalidate session).
    """
    # Delete session from Redis
    await SessionCache.delete_session(current_user_id)
    
    return {"message": "Successfully logged out"}
