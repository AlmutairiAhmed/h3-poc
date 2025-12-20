"""
Merchant Database Model
"""
from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from app.core.database import Base


class Merchant(Base):
    """Merchant model"""
    __tablename__ = "merchants"
    
    id = Column(Integer, primary_key=True, index=True)
    merchant_name = Column(String(255), nullable=False, index=True)
    merchant_id = Column(String(100), unique=True, nullable=False, index=True)
    phone = Column(String(20), nullable=False)
    email = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    business_type = Column(String(50), nullable=True)
    status = Column(String(20), default="active", nullable=False)
    notes = Column(Text, nullable=True)
    
    # H3 Data
    h3_indices = Column(Text, nullable=False)  # Comma-separated H3 indices
    h3_resolution = Column(Integer, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

