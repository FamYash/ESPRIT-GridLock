from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import Base, engine

# Routers
from app.api.test import router as test_router
import app.api.auth as auth
import app.api.zones as zones
import app.api.violations as violations
import app.api.traffic as traffic
import app.api.enforcement as enforcement
import app.api.dashboard as dashboard

# Models
from app.models.user import User
from app.models.zone import Zone, Camera
from app.models.violation import Violation
from app.models.traffic import TrafficMetric
from app.models.enforcement import EnforcementAction

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Test Router
app.include_router(test_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routes
app.include_router(
    auth.router,
    prefix=f"{settings.API_V1_STR}/auth",
    tags=["auth"]
)

app.include_router(
    zones.router,
    prefix=f"{settings.API_V1_STR}/zones",
    tags=["zones"]
)

app.include_router(
    violations.router,
    prefix=f"{settings.API_V1_STR}/violations",
    tags=["violations"]
)

app.include_router(
    traffic.router,
    prefix=f"{settings.API_V1_STR}/traffic",
    tags=["traffic"]
)

app.include_router(
    enforcement.router,
    prefix=f"{settings.API_V1_STR}/enforcement",
    tags=["enforcement"]
)

# Dashboard Route
app.include_router(
    dashboard.router,
    prefix=f"{settings.API_V1_STR}/dashboard",
    tags=["dashboard"]
)

# Root Endpoint
@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "docs_url": "/docs"
    }

# Run App
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )