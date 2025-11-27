from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, JSON, Boolean, Table
from sqlalchemy.orm import relationship
from database import Base
import datetime
import uuid

def generate_uuid():
    return str(uuid.uuid4())

# Association tables
portfolio_asset = Table(
    'portfolio_asset',
    Base.metadata,
    Column('portfolio_id', String, ForeignKey('portfolios.id')),
    Column('asset_id', String, ForeignKey('assets.id'))
)

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    firebase_uid = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    full_name = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Relationships
    portfolios = relationship("Portfolio", back_populates="user")
    conversations = relationship("Conversation", back_populates="user")
    broker_connections = relationship("BrokerConnection", back_populates="user")

class Portfolio(Base):
    __tablename__ = "portfolios"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    name = Column(String)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    risk_score = Column(Float, default=0.0)
    is_demo = Column(Boolean, default=False)
    
    # Relationships
    user = relationship("User", back_populates="portfolios")
    assets = relationship("Asset", secondary=portfolio_asset, back_populates="portfolios")
    transactions = relationship("Transaction", back_populates="portfolio")
    analyses = relationship("PortfolioAnalysis", back_populates="portfolio")

class Asset(Base):
    __tablename__ = "assets"

    id = Column(String, primary_key=True, default=generate_uuid)
    symbol = Column(String, index=True)
    name = Column(String)
    asset_type = Column(String)  # stock, crypto, bond, etc.
    exchange = Column(String, nullable=True)
    sector = Column(String, nullable=True)
    country = Column(String, nullable=True)
    currency = Column(String, default="USD")
    
    # Relationships
    portfolios = relationship("Portfolio", secondary=portfolio_asset, back_populates="assets")
    transactions = relationship("Transaction", back_populates="asset")
    price_history = relationship("AssetPrice", back_populates="asset")

class AssetPrice(Base):
    __tablename__ = "asset_prices"

    id = Column(String, primary_key=True, default=generate_uuid)
    asset_id = Column(String, ForeignKey("assets.id"))
    date = Column(DateTime, index=True)
    open_price = Column(Float)
    close_price = Column(Float)
    high_price = Column(Float)
    low_price = Column(Float)
    volume = Column(Integer, nullable=True)
    
    # Relationships
    asset = relationship("Asset", back_populates="price_history")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, default=generate_uuid)
    portfolio_id = Column(String, ForeignKey("portfolios.id"))
    asset_id = Column(String, ForeignKey("assets.id"))
    transaction_type = Column(String)  # buy, sell
    quantity = Column(Float)
    price = Column(Float)
    transaction_date = Column(DateTime, default=datetime.datetime.utcnow)
    fees = Column(Float, default=0.0)
    notes = Column(String, nullable=True)
    
    # Relationships
    portfolio = relationship("Portfolio", back_populates="transactions")
    asset = relationship("Asset", back_populates="transactions")

class PortfolioAnalysis(Base):
    __tablename__ = "portfolio_analyses"

    id = Column(String, primary_key=True, default=generate_uuid)
    portfolio_id = Column(String, ForeignKey("portfolios.id"))
    analysis_date = Column(DateTime, default=datetime.datetime.utcnow)
    total_value = Column(Float)
    daily_pl = Column(Float)
    total_pl = Column(Float)
    risk_metrics = Column(JSON)
    diversification_score = Column(Float)
    allocation = Column(JSON)  # Sector/asset type allocation
    recommendations = Column(JSON, nullable=True)
    
    # Relationships
    portfolio = relationship("Portfolio", back_populates="analyses")

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    title = Column(String, default="New Conversation")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation")

class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=generate_uuid)
    conversation_id = Column(String, ForeignKey("conversations.id"))
    role = Column(String)  # user, assistant
    content = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    conversation = relationship("Conversation", back_populates="messages")

class BrokerConnection(Base):
    __tablename__ = "broker_connections"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    broker_name = Column(String)  # zerodha, upstox, etc.
    broker_user_id = Column(String)
    access_token = Column(String)
    refresh_token = Column(String, nullable=True)
    token_expiry = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    user = relationship("User", back_populates="broker_connections")
