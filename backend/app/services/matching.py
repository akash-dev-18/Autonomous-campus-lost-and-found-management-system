from typing import List
from uuid import UUID
import difflib
from datetime import datetime

from app.models.item import Item, ItemType, ItemStatus
from app.repositories.item import ItemRepository
from app.repositories.match import MatchRepository
from app.schemas.match import MatchCreate

class MatchingService:
    def __init__(self, item_repo: ItemRepository, match_repo: MatchRepository):
        self.item_repo = item_repo
        self.match_repo = match_repo

    async def process_matches_for_item(self, item_id: UUID):
        """
        Find and create matches for a newly created item.
        """
        # 1. Get the source item
        source_item = await self.item_repo.get(item_id)
        if not source_item:
            return

        # 2. Determine target type
        target_type = ItemType.FOUND if source_item.type == ItemType.LOST else ItemType.LOST
        
        # 3. Get candidates (fetch all active items of opposite type)
        # Ideally, we'd have a more specific query (e.g. by category) to limit search space
        candidates = await self.item_repo.get_multi(
            limit=1000, 
            type=target_type, 
            status=ItemStatus.ACTIVE,
            category=source_item.category # Optimization: simple category filter
        )

        for candidate in candidates:
            score = self._calculate_similarity(source_item, candidate)
            
            if score > 0.3: # Threshold
                # Create Match
                # Ensure we define which is lost and which is found correctly
                lost_item = source_item if source_item.type == ItemType.LOST else candidate
                found_item = candidate if source_item.type == ItemType.LOST else source_item
                
                # Check if match already exists? Repo might handle it, or we assume new item = new matches
                # We'll just try to create it.
                
                await self.match_repo.create(MatchCreate(
                    lost_item_id=lost_item.id,
                    found_item_id=found_item.id,
                    score=score,
                    status="pending"
                ))

    def _calculate_similarity(self, item1: Item, item2: Item) -> float:
        """
        Calculate a similarity score between 0.0 and 1.0
        """
        score = 0.0
        weights = {
            'title': 0.4,
            'description': 0.3,
            'tags': 0.2,
            'location': 0.1
        }

        # Title Similarity
        s_title = difflib.SequenceMatcher(None, item1.title.lower(), item2.title.lower()).ratio()
        score += s_title * weights['title']

        # Description Similarity
        desc1 = item1.description or ""
        desc2 = item2.description or ""
        s_desc = difflib.SequenceMatcher(None, desc1.lower(), desc2.lower()).ratio()
        score += s_desc * weights['description']

        # Tags Overlap
        tags1 = set(t.lower() for t in item1.tags)
        tags2 = set(t.lower() for t in item2.tags)
        if tags1 or tags2:
            intersection = len(tags1.intersection(tags2))
            union = len(tags1.union(tags2))
            s_tags = intersection / union if union > 0 else 0
            score += s_tags * weights['tags']

        # Location Similarity (String based for now)
        loc1 = item1.location_found or ""
        loc2 = item2.location_found or ""
        if loc1 and loc2:
             s_loc = difflib.SequenceMatcher(None, loc1.lower(), loc2.lower()).ratio()
             score += s_loc * weights['location']

        return score
