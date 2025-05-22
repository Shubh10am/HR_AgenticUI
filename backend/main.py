
from fastapi import FastAPI
from dotenv import load_dotenv

# It's good practice to load .env as early as possible
load_dotenv() 

# Import routers
from backend.oauth import router as auth_router
from backend.email_router import router as email_api_router # Renamed for clarity

app = FastAPI(
    title="HR Streamline AI Backend",
    description="API for Gmail integration and AI-powered HR assistance.",
    version="0.1.0"
)

# Include routers
app.include_router(auth_router, prefix="/auth", tags=["Authentication"]) # Add prefix for auth routes
app.include_router(email_api_router) # Email routes already have /emails prefix in their router definition

@app.get("/", tags=["Root"])
async def root():
    return {"message": "Welcome to the HR Streamline AI FastAPI Backend"}

# If you plan to run this with uvicorn directly, e.g., uvicorn backend.main:app --reload
# Otherwise, if you have a run script, this part might not be necessary here.
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

