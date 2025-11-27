from pydantic import BaseModel, EmailStr, Field, validator
from typing import List, Optional, Dict, Any, Union, ForwardRef
from datetime import datetime
import uuid

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: str
    firebase_uid: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Portfolio schemas
class PortfolioBase(BaseModel):
    name: str
    description: Optional[str] = None
    risk_score: Optional[float] = 0.0
    is_demo: Optional[bool] = False

class PortfolioCreate(PortfolioBase):
    pass

class Portfolio(PortfolioBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Asset schemas
class AssetBase(BaseModel):
    symbol: str
    name: str
    asset_type: str
    exchange: Optional[str] = None
    sector: Optional[str] = None
    country: Optional[str] = None
    currency: str = "USD"

class AssetCreate(AssetBase):
    pass

class Asset(AssetBase):
    id: str

    class Config:
        from_attributes = True

class AssetInPortfolio(Asset):
    quantity: float = 0.0
    current_price: Optional[float] = None
    value: Optional[float] = None
    daily_change: Optional[float] = None
    total_change: Optional[float] = None
    allocation_percentage: Optional[float] = None

    class Config:
        from_attributes = True

class PortfolioDetail(Portfolio):
    assets: List[AssetInPortfolio] = []
    total_value: Optional[float] = 0.0
    daily_change: Optional[float] = 0.0
    total_change: Optional[float] = 0.0

    class Config:
        from_attributes = True

# Transaction schemas
class TransactionBase(BaseModel):
    asset_id: str
    transaction_type: str
    quantity: float
    price: float
    transaction_date: datetime = Field(default_factory=datetime.utcnow)
    fees: float = 0.0
    notes: Optional[str] = None

class TransactionCreate(TransactionBase):
    portfolio_id: str

class Transaction(TransactionBase):
    id: str
    portfolio_id: str

    class Config:
        from_attributes = True

# Portfolio Analysis schemas
class PortfolioAnalysisBase(BaseModel):
    portfolio_id: str
    total_value: float
    daily_pl: float
    total_pl: float
    diversification_score: float
    risk_metrics: Dict[str, Any]
    allocation: Dict[str, Any]
    recommendations: Optional[Dict[str, Any]] = None

class PortfolioAnalysisCreate(PortfolioAnalysisBase):
    pass

class PortfolioAnalysis(PortfolioAnalysisBase):
    id: str
    analysis_date: datetime

    class Config:
        from_attributes = True

# AI Conversation schemas
class MessageBase(BaseModel):
    role: str  # user or assistant
    content: str

class MessageCreate(MessageBase):
    conversation_id: str

class Message(MessageBase):
    id: str
    conversation_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class ConversationBase(BaseModel):
    title: str = "New Conversation"

class ConversationCreate(ConversationBase):
    user_id: str

class Conversation(ConversationBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ConversationWithMessages(Conversation):
    messages: List[Message] = []

    class Config:
        from_attributes = True

# AI Advisory queries
class AIQuery(BaseModel):
    query: str
    conversation_id: Optional[str] = None
    portfolio_id: Optional[str] = None
    data_context: Optional[Dict[str, Any]] = None

class AIResponse(BaseModel):
    message: str
    conversation_id: str
    additional_data: Optional[Dict[str, Any]] = None

# Market Data schemas
class StockPrice(BaseModel):
    symbol: str
    price: float
    change: float
    change_percent: float
    volume: int
    updated_at: datetime

class MarketOverview(BaseModel):
    indices: List[Dict[str, Any]]
    top_gainers: List[Dict[str, Any]]
    top_losers: List[Dict[str, Any]]
    market_trends: Dict[str, Any]

class AssetDetail(BaseModel):
    symbol: str
    name: str
    price: float
    change: float
    change_percent: float
    market_cap: Optional[float] = None
    volume: int
    high_52w: Optional[float] = None
    low_52w: Optional[float] = None
    eps: Optional[float] = None
    pe_ratio: Optional[float] = None
    sector: Optional[str] = None
    historical_data: Optional[List[Dict[str, Any]]] = None
    news: Optional[List[Dict[str, Any]]] = None
    recommendations: Optional[Dict[str, Any]] = None
