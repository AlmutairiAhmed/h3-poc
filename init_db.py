"""
Initialize Database
Run this script to create database tables
"""
from app.core.database import engine, Base
from app.models.merchant import Merchant

def init_db():
    """Create all database tables"""
    Base.metadata.create_all(bind=engine)
    print("✅ Database initialized successfully!")

if __name__ == "__main__":
    init_db()
