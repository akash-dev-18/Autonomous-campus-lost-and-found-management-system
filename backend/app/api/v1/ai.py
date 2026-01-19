from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List, Dict, Any
from PIL import Image
from io import BytesIO
from app.services.ai_model import ai_service

router = APIRouter()

# Categories to detect
CATEGORIES = [
    "Electronics", "Clothing", "Accessories", "Documents", "Keys", 
    "Bag", "Wallet", "Jewelry", "Other"
]

# Common object tags
TAGS = [
    "Phone", "Laptop", "Watch", "Headphones", "Keys", "Wallet", "Backpack", 
    "Glasses", "Ring", "Notebook", "ID Card", "Credit Card", "Umbrella", 
    "Bottle", "Charger", "Jacket", "Shirt", "Shoes"
]

@router.post("/analyze-image")
async def analyze_image(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Analyze an uploaded image using CLIP AI to suggest categories and tags.
    """
    if not ai_service.model:
        raise HTTPException(status_code=503, detail="AI Service unavailable (Model not loaded)")

    try:
        # Read image
        contents = await file.read()
        image = Image.open(BytesIO(contents))
        
        # 1. Predict Category
        cat_results = ai_service.predict_labels(image, CATEGORIES)
        predicted_category = cat_results[0][0] if cat_results else "Other"
        
        # 2. Predict Tags
        tag_results = ai_service.predict_labels(image, TAGS)
        # Filter tags with > 10% confidence and take top 5
        top_tags = [label for label, score in tag_results if score > 0.05][:5]
        
        return {
            "category": predicted_category,
            "tags": top_tags,
            "confidence": cat_results[0][1] if cat_results else 0.0
        }
        
    except Exception as e:
        print(f"Analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
