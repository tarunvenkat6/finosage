from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn

# Import routers
from auth import router as auth_router
from ai import router as ai_router
from market import router as market_router
from portfolio import router as portfolio_router

# Import database
from database import engine, Base

# Initialize FastAPI app
app = FastAPI(
    title="FinoSage API",
    description="Financial Portfolio Analysis and Advisory API",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(ai_router, prefix="/api/ai", tags=["AI Advisory"])
app.include_router(market_router, prefix="/api/market", tags=["Market Data"])
app.include_router(portfolio_router, prefix="/api/portfolio", tags=["Portfolio Management"])

# Mount static files (if needed)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Welcome to FinoSage API", "status": "online"}

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Try to create database tables, but don't fail if database is not available
try:
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully")
except Exception as e:
    print(f"Warning: Could not create database tables: {e}")
    print("Server will start without database functionality")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
