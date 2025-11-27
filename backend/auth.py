from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import jwt
from pydantic import BaseModel, EmailStr

from config import (
    FIREBASE_API_KEY, 
    FIREBASE_AUTH_DOMAIN, 
    FIREBASE_PROJECT_ID, 
    JWT_SECRET_KEY, 
    JWT_ALGORITHM, 
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES
)
from database import get_db
from models import User
import schemas

# Initialize Firebase Admin SDK only if credentials are available
firebase_app = None
firebase_auth = None

# For now, disable Firebase to allow server to run without credentials
# Uncomment and configure the section below when Firebase credentials are available
"""
try:
    from firebase_admin import auth as firebase_auth, credentials, initialize_app
    import firebase_admin
    
    # Only initialize if we have the required Firebase credentials
    if (FIREBASE_PROJECT_ID and FIREBASE_PROJECT_ID != "" and 
        FIREBASE_API_KEY and FIREBASE_API_KEY != ""):
        # Check if we have actual credential values (not empty strings)
        cred = credentials.Certificate({
            "type": "service_account",
            "project_id": FIREBASE_PROJECT_ID,
            "private_key_id": "",  # Fill from env or key file
            "private_key": "",     # Fill from env or key file
            "client_email": "",    # Fill from env or key file
            "client_id": "",       # Fill from env or key file
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_x509_cert_url": ""  # Fill from env or key file
        })
        
        try:
            firebase_app = initialize_app(cred)
        except ValueError:
            # App already initialized
            firebase_app = firebase_admin.get_app()
        except Exception:
            # If any error occurs during initialization, set to None
            firebase_app = None
except ImportError:
    # Firebase not available
    pass
except Exception:
    # Any other error, set to None
    firebase_app = None
"""

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

# Models for authentication
class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    username: Optional[str] = None

class FirebaseToken(BaseModel):
    id_token: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    username: str
    full_name: Optional[str] = None

# Helper functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    
    return user

# Authentication routes
@router.post("/register", response_model=TokenResponse)
async def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    if not firebase_app:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Firebase authentication is not configured"
        )
    
    try:
        # Create user in Firebase
        firebase_user = firebase_auth.create_user(
            email=user_data.email,
            password=user_data.password,
            display_name=user_data.username
        )
        
        # Check if user already exists in database
        db_user = db.query(User).filter(User.email == user_data.email).first()
        if db_user:
            # Link existing user with Firebase
            db_user.firebase_uid = firebase_user.uid
            db.commit()
            db.refresh(db_user)
        else:
            # Create new user in database
            db_user = User(
                firebase_uid=firebase_user.uid,
                email=user_data.email,
                username=user_data.username,
                full_name=user_data.full_name
            )
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
        
        # Create access token
        access_token_expires = timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": db_user.id},
            expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_id": db_user.id,
            "username": db_user.username
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/token", response_model=TokenResponse)
async def login_with_firebase(firebase_token: FirebaseToken, db: Session = Depends(get_db)):
    if not firebase_app:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Firebase authentication is not configured"
        )
    
    try:
        # Verify Firebase token
        decoded_token = firebase_auth.verify_id_token(firebase_token.id_token)
        firebase_uid = decoded_token["uid"]
        
        # Get user from database
        user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
        if not user:
            # User exists in Firebase but not in our database
            # This can happen if user was created in Firebase directly
            firebase_user = firebase_auth.get_user(firebase_uid)
            user = User(
                firebase_uid=firebase_uid,
                email=firebase_user.email,
                username=firebase_user.display_name or f"user_{firebase_uid[:8]}"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # Create access token
        access_token_expires = timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.id},
            expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_id": user.id,
            "username": user.username
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}"
        )

@router.get("/me", response_model=schemas.User)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/logout")
async def logout():
    # Firebase handles token invalidation
    # This endpoint is more for client-side logout
    return {"message": "Successfully logged out"}
