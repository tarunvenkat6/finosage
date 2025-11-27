from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from config import SUPABASE_URL, SUPABASE_KEY, DATABASE_URL
from supabase import create_client, Client

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Create SQLAlchemy engine - this will connect to the PostgreSQL database that Supabase provides
engine = create_engine(DATABASE_URL)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for models
Base = declarative_base()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Function to get Supabase client - useful for direct Supabase operations
def get_supabase():
    return supabase
