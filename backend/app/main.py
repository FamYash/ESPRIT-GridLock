from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import auth, zones, violations, traffic, enforcement
from app.api.test import router as test_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

app.include_router(test_router)

# Set up CORS middleware to allow React frontend (defaulting to http://localhost:5173 for Vite)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify front-end domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(zones.router, prefix=f"{settings.API_V1_STR}/zones", tags=["zones"])
app.include_router(violations.router, prefix=f"{settings.API_V1_STR}/violations", tags=["violations"])
app.include_router(traffic.router, prefix=f"{settings.API_V1_STR}/traffic", tags=["traffic"])
app.include_router(enforcement.router, prefix=f"{settings.API_V1_STR}/enforcement", tags=["enforcement"])

@app.on_event("startup")
async def startup_event():
    import asyncio
    from app.api.violations import violation_simulator_loop
    asyncio.create_task(violation_simulator_loop())

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

