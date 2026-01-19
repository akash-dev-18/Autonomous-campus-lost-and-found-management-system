from typing import TypeVar, Generic, Type, Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func
from sqlalchemy.sql import Select
from uuid import UUID
from pydantic import BaseModel

from app.database import Base

ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class BaseCRUD(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """
    Base CRUD repository with generic database operations.
    
    This class provides common CRUD operations that can be inherited by all repositories.
    Eliminates the need to write repetitive database queries.
    
    Usage:
        class UserRepository(BaseCRUD[User, UserCreate, UserUpdate]):
            def __init__(self, db: AsyncSession):
                super().__init__(User, db)
    """
    
    def __init__(self, model: Type[ModelType], db: AsyncSession):
        """
        Initialize CRUD object with model class and database session.
        
        Args:
            model: SQLAlchemy model class
            db: Async database session
        """
        self.model = model
        self.db = db
    
    async def get(self, id: UUID) -> Optional[ModelType]:
        """
        Get a single record by ID.
        
        Args:
            id: Record UUID
            
        Returns:
            Model instance or None if not found
        """
        result = await self.db.execute(
            select(self.model).where(self.model.id == id)
        )
        return result.scalar_one_or_none()
    
    async def get_multi(
        self,
        skip: int = 0,
        limit: int = 100,
        order_by: Optional[str] = None,
        **filters
    ) -> List[ModelType]:
        """
        Get multiple records with pagination and filtering.
        
        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return
            order_by: Column name to order by (prefix with - for descending)
            **filters: Field filters (e.g., status="active")
            
        Returns:
            List of model instances
        """
        query = select(self.model)
        
        # Apply filters
        for field, value in filters.items():
            if hasattr(self.model, field):
                query = query.where(getattr(self.model, field) == value)
        
        # Apply ordering
        if order_by:
            if order_by.startswith("-"):
                query = query.order_by(getattr(self.model, order_by[1:]).desc())
            else:
                query = query.order_by(getattr(self.model, order_by))
        
        # Apply pagination
        query = query.offset(skip).limit(limit)
        
        result = await self.db.execute(query)
        return list(result.scalars().all())
    
    async def get_all(self, **filters) -> List[ModelType]:
        """
        Get all records matching filters.
        
        Args:
            **filters: Field filters
            
        Returns:
            List of all matching model instances
        """
        query = select(self.model)
        
        for field, value in filters.items():
            if hasattr(self.model, field):
                query = query.where(getattr(self.model, field) == value)
        
        result = await self.db.execute(query)
        return list(result.scalars().all())
    
    async def create(self, obj_in: CreateSchemaType) -> ModelType:
        """
        Create a new record.
        
        Args:
            obj_in: Pydantic schema with creation data
            
        Returns:
            Created model instance
        """
        obj_data = obj_in.model_dump() if hasattr(obj_in, 'model_dump') else obj_in.dict()
        db_obj = self.model(**obj_data)
        
        self.db.add(db_obj)
        await self.db.flush()
        await self.db.refresh(db_obj)
        
        return db_obj
    
    async def update(
        self,
        id: UUID,
        obj_in: UpdateSchemaType | Dict[str, Any]
    ) -> Optional[ModelType]:
        """
        Update an existing record.
        
        Args:
            id: Record UUID
            obj_in: Pydantic schema or dict with update data
            
        Returns:
            Updated model instance or None if not found
        """
        # Get existing record
        db_obj = await self.get(id)
        if not db_obj:
            return None
        
        # Get update data
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True) if hasattr(obj_in, 'model_dump') else obj_in.dict(exclude_unset=True)
        
        # Update fields
        for field, value in update_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)
        
        await self.db.flush()
        await self.db.refresh(db_obj)
        
        return db_obj
    
    async def delete(self, id: UUID) -> bool:
        """
        Delete a record by ID.
        
        Args:
            id: Record UUID
            
        Returns:
            True if deleted, False if not found
        """
        result = await self.db.execute(
            delete(self.model).where(self.model.id == id)
        )
        await self.db.flush()
        
        return result.rowcount > 0
    
    async def count(self, **filters) -> int:
        """
        Count records matching filters.
        
        Args:
            **filters: Field filters
            
        Returns:
            Number of matching records
        """
        query = select(func.count()).select_from(self.model)
        
        for field, value in filters.items():
            if hasattr(self.model, field):
                query = query.where(getattr(self.model, field) == value)
        
        result = await self.db.execute(query)
        return result.scalar_one()
    
    async def exists(self, id: UUID) -> bool:
        """
        Check if a record exists.
        
        Args:
            id: Record UUID
            
        Returns:
            True if exists, False otherwise
        """
        result = await self.db.execute(
            select(func.count()).select_from(self.model).where(self.model.id == id)
        )
        return result.scalar_one() > 0
    
    async def get_by_field(self, field: str, value: Any) -> Optional[ModelType]:
        """
        Get a single record by any field.
        
        Args:
            field: Field name
            value: Field value
            
        Returns:
            Model instance or None if not found
        """
        if not hasattr(self.model, field):
            return None
        
        result = await self.db.execute(
            select(self.model).where(getattr(self.model, field) == value)
        )
        return result.scalar_one_or_none()
    
    async def get_multi_by_field(self, field: str, value: Any) -> List[ModelType]:
        """
        Get multiple records by any field.
        
        Args:
            field: Field name
            value: Field value
            
        Returns:
            List of matching model instances
        """
        if not hasattr(self.model, field):
            return []
        
        result = await self.db.execute(
            select(self.model).where(getattr(self.model, field) == value)
        )
        return list(result.scalars().all())
    
    async def bulk_create(self, objs_in: List[CreateSchemaType]) -> List[ModelType]:
        """
        Create multiple records at once.
        
        Args:
            objs_in: List of Pydantic schemas
            
        Returns:
            List of created model instances
        """
        db_objs = []
        for obj_in in objs_in:
            obj_data = obj_in.model_dump() if hasattr(obj_in, 'model_dump') else obj_in.dict()
            db_obj = self.model(**obj_data)
            db_objs.append(db_obj)
        
        self.db.add_all(db_objs)
        await self.db.flush()
        
        for db_obj in db_objs:
            await self.db.refresh(db_obj)
        
        return db_objs
    
    async def bulk_update(self, updates: List[Dict[str, Any]]) -> int:
        """
        Update multiple records at once.
        
        Args:
            updates: List of dicts with 'id' and update fields
            
        Returns:
            Number of updated records
        """
        count = 0
        for update_data in updates:
            if 'id' not in update_data:
                continue
            
            record_id = update_data.pop('id')
            result = await self.db.execute(
                update(self.model)
                .where(self.model.id == record_id)
                .values(**update_data)
            )
            count += result.rowcount
        
        await self.db.flush()
        return count
    
    async def bulk_delete(self, ids: List[UUID]) -> int:
        """
        Delete multiple records at once.
        
        Args:
            ids: List of record UUIDs
            
        Returns:
            Number of deleted records
        """
        result = await self.db.execute(
            delete(self.model).where(self.model.id.in_(ids))
        )
        await self.db.flush()
        
        return result.rowcount
