"""
Merchant API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.merchant import Merchant
from app.schemas.merchant import (
    MerchantCreate,
    MerchantUpdate,
    MerchantResponse,
    H3DataResponse
)

router = APIRouter()


@router.post("/", response_model=MerchantResponse, status_code=status.HTTP_201_CREATED)
async def create_merchant(
    merchant: MerchantCreate,
    db: Session = Depends(get_db)
):
    """Create a new merchant"""
    # Check if merchant_id already exists
    existing = db.query(Merchant).filter(Merchant.merchant_id == merchant.merchant_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Merchant with ID '{merchant.merchant_id}' already exists"
        )
    
    # Create merchant
    db_merchant = Merchant(
        merchant_name=merchant.merchant_name,
        merchant_id=merchant.merchant_id,
        phone=merchant.phone,
        email=merchant.email,
        address=merchant.address,
        business_type=merchant.business_type,
        status=merchant.status,
        notes=merchant.notes,
        h3_indices=",".join(merchant.h3_indices),
        h3_resolution=merchant.h3_resolution
    )
    
    db.add(db_merchant)
    db.commit()
    db.refresh(db_merchant)
    
    # Convert h3_indices back to list for response
    response_data = MerchantResponse(
        id=db_merchant.id,
        merchant_name=db_merchant.merchant_name,
        merchant_id=db_merchant.merchant_id,
        phone=db_merchant.phone,
        email=db_merchant.email,
        address=db_merchant.address,
        business_type=db_merchant.business_type,
        status=db_merchant.status,
        notes=db_merchant.notes,
        h3_indices=db_merchant.h3_indices.split(","),
        h3_resolution=db_merchant.h3_resolution,
        created_at=db_merchant.created_at,
        updated_at=db_merchant.updated_at
    )
    
    return response_data


@router.get("/", response_model=List[MerchantResponse])
async def list_merchants(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get list of all merchants"""
    merchants = db.query(Merchant).offset(skip).limit(limit).all()
    
    result = []
    for merchant in merchants:
        result.append(MerchantResponse(
            id=merchant.id,
            merchant_name=merchant.merchant_name,
            merchant_id=merchant.merchant_id,
            phone=merchant.phone,
            email=merchant.email,
            address=merchant.address,
            business_type=merchant.business_type,
            status=merchant.status,
            notes=merchant.notes,
            h3_indices=merchant.h3_indices.split(","),
            h3_resolution=merchant.h3_resolution,
            created_at=merchant.created_at,
            updated_at=merchant.updated_at
        ))
    
    return result


@router.get("/{merchant_id}", response_model=MerchantResponse)
async def get_merchant(
    merchant_id: str,
    db: Session = Depends(get_db)
):
    """Get a specific merchant by ID"""
    merchant = db.query(Merchant).filter(Merchant.merchant_id == merchant_id).first()
    
    if not merchant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Merchant with ID '{merchant_id}' not found"
        )
    
    return MerchantResponse(
        id=merchant.id,
        merchant_name=merchant.merchant_name,
        merchant_id=merchant.merchant_id,
        phone=merchant.phone,
        email=merchant.email,
        address=merchant.address,
        business_type=merchant.business_type,
        status=merchant.status,
        notes=merchant.notes,
        h3_indices=merchant.h3_indices.split(","),
        h3_resolution=merchant.h3_resolution,
        created_at=merchant.created_at,
        updated_at=merchant.updated_at
    )


@router.get("/{merchant_id}/h3-data", response_model=H3DataResponse)
async def get_merchant_h3_data(
    merchant_id: str,
    db: Session = Depends(get_db)
):
    """Get H3 data for a merchant (for customer page)"""
    merchant = db.query(Merchant).filter(Merchant.merchant_id == merchant_id).first()
    
    if not merchant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Merchant with ID '{merchant_id}' not found"
        )
    
    return H3DataResponse(
        h3_indices=merchant.h3_indices.split(","),
        h3_resolution=merchant.h3_resolution,
        merchant_id=merchant.merchant_id,
        merchant_name=merchant.merchant_name
    )


@router.get("/latest/h3-data", response_model=H3DataResponse)
async def get_latest_merchant_h3_data(
    db: Session = Depends(get_db)
):
    """Get H3 data for the latest merchant (for customer page)"""
    merchant = db.query(Merchant).order_by(Merchant.created_at.desc()).first()
    
    if not merchant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No merchants found"
        )
    
    return H3DataResponse(
        h3_indices=merchant.h3_indices.split(","),
        h3_resolution=merchant.h3_resolution,
        merchant_id=merchant.merchant_id,
        merchant_name=merchant.merchant_name
    )


@router.put("/{merchant_id}", response_model=MerchantResponse)
async def update_merchant(
    merchant_id: str,
    merchant_update: MerchantUpdate,
    db: Session = Depends(get_db)
):
    """Update a merchant"""
    merchant = db.query(Merchant).filter(Merchant.merchant_id == merchant_id).first()
    
    if not merchant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Merchant with ID '{merchant_id}' not found"
        )
    
    # Update fields
    update_data = merchant_update.model_dump(exclude_unset=True)
    if "h3_indices" in update_data:
        update_data["h3_indices"] = ",".join(update_data["h3_indices"])
    
    for field, value in update_data.items():
        setattr(merchant, field, value)
    
    db.commit()
    db.refresh(merchant)
    
    return MerchantResponse(
        id=merchant.id,
        merchant_name=merchant.merchant_name,
        merchant_id=merchant.merchant_id,
        phone=merchant.phone,
        email=merchant.email,
        address=merchant.address,
        business_type=merchant.business_type,
        status=merchant.status,
        notes=merchant.notes,
        h3_indices=merchant.h3_indices.split(","),
        h3_resolution=merchant.h3_resolution,
        created_at=merchant.created_at,
        updated_at=merchant.updated_at
    )


@router.delete("/{merchant_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_merchant(
    merchant_id: str,
    db: Session = Depends(get_db)
):
    """Delete a merchant"""
    merchant = db.query(Merchant).filter(Merchant.merchant_id == merchant_id).first()
    
    if not merchant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Merchant with ID '{merchant_id}' not found"
        )
    
    db.delete(merchant)
    db.commit()
    
    return None

