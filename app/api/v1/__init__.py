"""
API v1 Router
"""
from fastapi import APIRouter
from app.api.v1.endpoints import merchants, validation

api_router = APIRouter()

# Include endpoint routers
api_router.include_router(merchants.router, prefix="/merchants", tags=["merchants"])
api_router.include_router(validation.router, prefix="/validation", tags=["validation"])

