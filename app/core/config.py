"""
Application Configuration
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings"""
    
    # API Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "H3 Payment System"
    
    # Database
    DATABASE_URL: str = "sqlite:///./h3_payment.db"
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:8000,http://localhost:3000,http://127.0.0.1:8000,http://127.0.0.1:3000"
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS_ORIGINS string into list"""
        origins = [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
        # Allow all origins if "*" is present (for development/mobile access)
        if "*" in origins:
            return ["*"]
        return origins
    
    # Security (for future use)
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

