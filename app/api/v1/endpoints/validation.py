"""
Location Validation API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import h3

from app.core.database import get_db
from app.models.merchant import Merchant
from app.schemas.merchant import (
    LocationValidationRequest,
    LocationValidationResponse
)

router = APIRouter()


@router.post("/location", response_model=LocationValidationResponse)
async def validate_location(
    request: LocationValidationRequest,
    db: Session = Depends(get_db)
):
    """Validate if a location is within a merchant's H3 payment area"""
    # Get merchant
    merchant = db.query(Merchant).filter(Merchant.merchant_id == request.merchant_id).first()
    
    if not merchant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Merchant with ID '{request.merchant_id}' not found"
        )
    
    # Get H3 indices
    h3_indices = [idx.strip() for idx in merchant.h3_indices.split(",")]
    
    # Calculate current location's H3 index
    try:
        current_h3_index = h3.geo_to_h3(
            request.latitude,
            request.longitude,
            merchant.h3_resolution
        )
        current_h3_index_str = str(current_h3_index)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid coordinates: {str(e)}"
        )
    
    # Check if current H3 index is in merchant's allowed indices
    is_valid = current_h3_index_str in h3_indices
    
    if is_valid:
        message = "✅ التحقق ناجح! موقعك داخل منطقة الدفع المسموحة. يمكنك إتمام الدفع."
    else:
        message = "❌ التحقق فشل! موقعك خارج منطقة الدفع المسموحة. لا يمكن إتمام الدفع."
    
    return LocationValidationResponse(
        is_valid=is_valid,
        current_h3_index=current_h3_index_str,
        message=message
    )

