"""
Main FastAPI application.
Entry point for the Policy AI System backend.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import time

from app.config import settings
from app.database import init_db

# Import routers directly to avoid circular imports
from app.routers.admin import router as admin_router
from app.routers.policy import router as policy_router
from app.routers.user import router as user_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifecycle handler for the application.
    Handles startup and shutdown events.
    """
    # Startup
    print("🚀 Starting Policy AI System...")
    print(f"📊 LLM Provider: {settings.LLM_PROVIDER}")
    print(f"🗄️  Vector Store: {settings.VECTOR_STORE}")
    
    # Initialize database
    init_db()
    print("✅ Database initialized")
    
    yield
    
    # Shutdown
    print("👋 Shutting down Policy AI System...")


# Create FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-powered policy document generation system",
    lifespan=lifespan
)


# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Add processing time to response headers."""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response


# Exception handlers
@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    """Handle 404 errors."""
    return JSONResponse(
        status_code=404,
        content={"detail": "Resource not found"}
    )


@app.exception_handler(500)
async def internal_error_handler(request: Request, exc):
    """Handle 500 errors."""
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )


# Include routers
app.include_router(admin_router, prefix=settings.API_V1_PREFIX)
app.include_router(policy_router, prefix=settings.API_V1_PREFIX)
app.include_router(user_router, prefix=settings.API_V1_PREFIX)


# Health check endpoint
@app.get("/health")
async def health_check():
    """
    Health check endpoint.
    Returns system status and configuration.
    """
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "llm_provider": settings.LLM_PROVIDER,
        "vector_store": settings.VECTOR_STORE
    }


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Policy AI System API",
        "version": settings.VERSION,
        "docs": "/docs",
        "health": "/health"
    }


# API documentation info
@app.get(f"{settings.API_V1_PREFIX}/info")
async def api_info():
    """Get API information and available endpoints."""
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "endpoints": {
            "admin": {
                "projects": f"{settings.API_V1_PREFIX}/admin/projects",
                "documents": f"{settings.API_V1_PREFIX}/admin/projects/{{project_id}}/documents",
                "datasources": f"{settings.API_V1_PREFIX}/admin/projects/{{project_id}}/datasources"
            },
            "policy": {
                "generate": f"{settings.API_V1_PREFIX}/policies/generate",
                "status": f"{settings.API_V1_PREFIX}/policies/{{policy_id}}/status",
                "download": f"{settings.API_V1_PREFIX}/policies/{{policy_id}}/download"
            },
            "user": {
                "projects": f"{settings.API_V1_PREFIX}/user/projects"
            }
        }
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
