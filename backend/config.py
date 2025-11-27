import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database Configuration - Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./test.db")

# Firebase Configuration
FIREBASE_API_KEY = os.getenv("FIREBASE_API_KEY")
FIREBASE_AUTH_DOMAIN = os.getenv("FIREBASE_AUTH_DOMAIN")
FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID")
FIREBASE_STORAGE_BUCKET = os.getenv("FIREBASE_STORAGE_BUCKET")
FIREBASE_MESSAGING_SENDER_ID = os.getenv("FIREBASE_MESSAGING_SENDER_ID")
FIREBASE_APP_ID = os.getenv("FIREBASE_APP_ID")

# Claude API Configuration
CLAUDE_API_KEY = os.getenv("CLAUDE_API_KEY")
CLAUDE_API_URL = os.getenv("CLAUDE_API_URL", "https://api.anthropic.com/v1/messages")

# Market Data API Keys
ALPHA_VANTAGE_API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY")
YAHOO_FINANCE_API_KEY = os.getenv("YAHOO_FINANCE_API_KEY")
FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY")

# Broker API Keys (if applicable)
ZERODHA_API_KEY = os.getenv("ZERODHA_API_KEY")
ZERODHA_API_SECRET = os.getenv("ZERODHA_API_SECRET")
UPSTOX_API_KEY = os.getenv("UPSTOX_API_KEY")
UPSTOX_API_SECRET = os.getenv("UPSTOX_API_SECRET")

# Security settings
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-replace-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# Application Settings
DEBUG = os.getenv("DEBUG", "False").lower() == "true"
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
