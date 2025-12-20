"""
FastAPI Main Application
H3 Payment Location Validation System
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from app.api.v1 import api_router
from app.core.config import settings

# Create FastAPI app
app = FastAPI(
    title="H3 Payment System API",
    description="Payment location validation system using H3 geospatial indexing",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix="/api/v1")

# Serve static files (HTML, CSS, JS)
project_root = os.path.dirname(__file__)
frontend_dir = os.path.join(project_root, "frontend")
app_dir = os.path.join(project_root, "app")

# Mount frontend directory for HTML/CSS/JS files
app.mount("/static", StaticFiles(directory=frontend_dir), name="static")
# Mount app directory for API client
app.mount("/static/app", StaticFiles(directory=app_dir), name="app_static")

# Root endpoint - serve merchant.html
@app.get("/")
async def read_root():
    return FileResponse(os.path.join(frontend_dir, "merchant.html"))

# Serve merchant page
@app.get("/merchant")
async def merchant_page():
    return FileResponse(os.path.join(frontend_dir, "merchant.html"))

# Serve customer page
@app.get("/customer")
async def customer_page():
    return FileResponse(os.path.join(frontend_dir, "customer.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
