"""
Merchant Pydantic Schemas
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


class MerchantBase(BaseModel):
    """Base merchant schema"""
    merchant_name: str = Field(..., min_length=1, max_length=255)
    merchant_id: str = Field(..., min_length=1, max_length=100)
    phone: str = Field(..., min_length=1, max_length=20)
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    business_type: Optional[str] = None
    status: str = Field(default="active", pattern="^(active|inactive)$")
    notes: Optional[str] = None
    h3_indices: List[str] = Field(..., min_items=1, description="List of H3 indices")
    h3_resolution: int = Field(..., ge=0, le=15, description="H3 resolution (0-15)")


class MerchantCreate(MerchantBase):
    """Schema for creating a merchant"""
    pass


class MerchantUpdate(BaseModel):
    """Schema for updating a merchant"""
    merchant_name: Optional[str] = Field(None, min_length=1, max_length=255)
    phone: Optional[str] = Field(None, min_length=1, max_length=20)
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    business_type: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(active|inactive)$")
    notes: Optional[str] = None
    h3_indices: Optional[List[str]] = Field(None, min_items=1)
    h3_resolution: Optional[int] = Field(None, ge=0, le=15)


class MerchantResponse(MerchantBase):
    """Schema for merchant response"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class H3DataResponse(BaseModel):
    """Schema for H3 data response (for customer page)"""
    h3_indices: List[str]
    h3_resolution: int
    merchant_id: str
    merchant_name: str


class LocationValidationRequest(BaseModel):
    """Schema for location validation request"""
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    merchant_id: str


class LocationValidationResponse(BaseModel):
    """Schema for location validation response"""
    is_valid: bool
    current_h3_index: str
    message: str

