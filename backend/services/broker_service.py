import requests
import json
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import time
import uuid
from sqlalchemy.orm import Session

from models import BrokerConnection, User, Asset, Portfolio, Transaction
from config import (
    ZERODHA_API_KEY, ZERODHA_API_SECRET,
    UPSTOX_API_KEY, UPSTOX_API_SECRET
)

class BrokerService:
    def __init__(self):
        self.zerodha_api_key = ZERODHA_API_KEY
        self.zerodha_api_secret = ZERODHA_API_SECRET
        self.upstox_api_key = UPSTOX_API_KEY
        self.upstox_api_secret = UPSTOX_API_SECRET
        
    def get_broker_connections(self, db: Session, user_id: str) -> List[BrokerConnection]:
        """Get all broker connections for a user"""
        return db.query(BrokerConnection).filter(
            BrokerConnection.user_id == user_id,
            BrokerConnection.is_active == True
        ).all()
    
    def get_broker_connection(self, db: Session, connection_id: str) -> Optional[BrokerConnection]:
        """Get a broker connection by ID"""
        return db.query(BrokerConnection).filter(
            BrokerConnection.id == connection_id,
            BrokerConnection.is_active == True
        ).first()
    
    def delete_broker_connection(self, db: Session, connection_id: str) -> bool:
        """Delete a broker connection"""
        connection = db.query(BrokerConnection).filter(
            BrokerConnection.id == connection_id
        ).first()
        
        if not connection:
            return False
        
        # Soft delete by marking as inactive
        connection.is_active = False
        connection.updated_at = datetime.now()
        db.commit()
        
        return True
    
    # -- Zerodha Integration --
    
    def connect_zerodha(self, db: Session, user_id: str, request_token: str) -> Dict[str, Any]:
        """
        Connect to Zerodha using the request token
        
        This function would use the actual Zerodha API in a production environment
        """
        try:
            # In a real application, this would make a call to Zerodha API
            # For demo purposes, we'll simulate the response
            
            # Simulate token exchange
            access_token = f"zerodha_token_{uuid.uuid4()}"
            broker_user_id = f"ZRD{uuid.uuid4().hex[:8].upper()}"
            
            # Check if user already has a Zerodha connection
            existing_connection = db.query(BrokerConnection).filter(
                BrokerConnection.user_id == user_id,
                BrokerConnection.broker_name == "zerodha",
                BrokerConnection.is_active == True
            ).first()
            
            if existing_connection:
                # Update the existing connection
                existing_connection.access_token = access_token
                existing_connection.token_expiry = datetime.now() + timedelta(days=1)
                existing_connection.updated_at = datetime.now()
                db.commit()
                db.refresh(existing_connection)
                
                return {
                    "success": True,
                    "message": "Zerodha connection updated",
                    "connection_id": existing_connection.id
                }
            else:
                # Create a new connection
                connection = BrokerConnection(
                    user_id=user_id,
                    broker_name="zerodha",
                    broker_user_id=broker_user_id,
                    access_token=access_token,
                    token_expiry=datetime.now() + timedelta(days=1)
                )
                
                db.add(connection)
                db.commit()
                db.refresh(connection)
                
                return {
                    "success": True,
                    "message": "Zerodha connection created",
                    "connection_id": connection.id
                }
            
        except Exception as e:
            return {
                "success": False,
                "message": f"Error connecting to Zerodha: {str(e)}"
            }
    
    def get_zerodha_portfolio(self, db: Session, connection_id: str) -> Dict[str, Any]:
        """
        Get portfolio data from Zerodha
        
        This function would use the actual Zerodha API in a production environment
        """
        try:
            # Get the connection
            connection = self.get_broker_connection(db, connection_id)
            if not connection or connection.broker_name != "zerodha":
                return {"error": "Invalid Zerodha connection"}
            
            # Check if token is expired
            if connection.token_expiry and connection.token_expiry < datetime.now():
                return {"error": "Zerodha token expired, please reconnect"}
            
            # In a real application, this would make a call to Zerodha API
            # For demo purposes, we'll return mock data
            
            holdings = [
                {
                    "symbol": "RELIANCE",
                    "exchange": "NSE",
                    "isin": "INE002A01018",
                    "quantity": 10,
                    "average_price": 2100.50,
                    "last_price": 2150.75,
                    "pnl": 502.50,
                    "day_change": 0.65,
                    "day_change_percentage": 1.25
                },
                {
                    "symbol": "INFY",
                    "exchange": "NSE",
                    "isin": "INE009A01021",
                    "quantity": 25,
                    "average_price": 1320.25,
                    "last_price": 1340.50,
                    "pnl": 506.25,
                    "day_change": 12.30,
                    "day_change_percentage": 0.95
                },
                {
                    "symbol": "HDFCBANK",
                    "exchange": "NSE",
                    "isin": "INE040A01034",
                    "quantity": 15,
                    "average_price": 1450.00,
                    "last_price": 1420.25,
                    "pnl": -446.25,
                    "day_change": -15.50,
                    "day_change_percentage": -1.10
                }
            ]
            
            return {
                "success": True,
                "broker": "zerodha",
                "user_id": connection.broker_user_id,
                "holdings": holdings,
                "total_value": sum(h["quantity"] * h["last_price"] for h in holdings),
                "total_pnl": sum(h["pnl"] for h in holdings),
                "fetched_at": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": f"Error getting Zerodha portfolio: {str(e)}"
            }
    
    def import_zerodha_portfolio(self, db: Session, user_id: str, connection_id: str, 
                                portfolio_name: str) -> Dict[str, Any]:
        """
        Import Zerodha portfolio into the application
        
        Creates a new portfolio with holdings from Zerodha
        """
        try:
            # Get Zerodha portfolio
            zerodha_data = self.get_zerodha_portfolio(db, connection_id)
            if "error" in zerodha_data or not zerodha_data.get("success", False):
                return zerodha_data
            
            # Create new portfolio
            portfolio = Portfolio(
                user_id=user_id,
                name=portfolio_name,
                description=f"Imported from Zerodha on {datetime.now().strftime('%Y-%m-%d')}"
            )
            
            db.add(portfolio)
            db.flush()
            
            # Add holdings as transactions
            for holding in zerodha_data["holdings"]:
                # Create or get asset
                asset = db.query(Asset).filter(Asset.symbol == holding["symbol"]).first()
                
                if not asset:
                    # Create new asset
                    asset = Asset(
                        symbol=holding["symbol"],
                        name=holding["symbol"],  # Simplified, would be better with actual name
                        asset_type="stock",
                        exchange=holding["exchange"],
                        country="India"  # Assuming Zerodha is India-focused
                    )
                    db.add(asset)
                    db.flush()
                
                # Create transaction
                transaction = Transaction(
                    portfolio_id=portfolio.id,
                    asset_id=asset.id,
                    transaction_type="buy",
                    quantity=holding["quantity"],
                    price=holding["average_price"],
                    transaction_date=datetime.now()
                )
                
                db.add(transaction)
            
            db.commit()
            db.refresh(portfolio)
            
            return {
                "success": True,
                "message": "Portfolio imported successfully",
                "portfolio_id": portfolio.id
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": f"Error importing Zerodha portfolio: {str(e)}"
            }
    
    # -- Upstox Integration --
    
    def connect_upstox(self, db: Session, user_id: str, request_token: str) -> Dict[str, Any]:
        """
        Connect to Upstox using the request token
        
        This function would use the actual Upstox API in a production environment
        """
        try:
            # In a real application, this would make a call to Upstox API
            # For demo purposes, we'll simulate the response
            
            # Simulate token exchange
            access_token = f"upstox_token_{uuid.uuid4()}"
            refresh_token = f"upstox_refresh_{uuid.uuid4()}"
            broker_user_id = f"USX{uuid.uuid4().hex[:8].upper()}"
            
            # Check if user already has an Upstox connection
            existing_connection = db.query(BrokerConnection).filter(
                BrokerConnection.user_id == user_id,
                BrokerConnection.broker_name == "upstox",
                BrokerConnection.is_active == True
            ).first()
            
            if existing_connection:
                # Update the existing connection
                existing_connection.access_token = access_token
                existing_connection.refresh_token = refresh_token
                existing_connection.token_expiry = datetime.now() + timedelta(days=7)
                existing_connection.updated_at = datetime.now()
                db.commit()
                db.refresh(existing_connection)
                
                return {
                    "success": True,
                    "message": "Upstox connection updated",
                    "connection_id": existing_connection.id
                }
            else:
                # Create a new connection
                connection = BrokerConnection(
                    user_id=user_id,
                    broker_name="upstox",
                    broker_user_id=broker_user_id,
                    access_token=access_token,
                    refresh_token=refresh_token,
                    token_expiry=datetime.now() + timedelta(days=7)
                )
                
                db.add(connection)
                db.commit()
                db.refresh(connection)
                
                return {
                    "success": True,
                    "message": "Upstox connection created",
                    "connection_id": connection.id
                }
            
        except Exception as e:
            return {
                "success": False,
                "message": f"Error connecting to Upstox: {str(e)}"
            }
    
    def get_upstox_portfolio(self, db: Session, connection_id: str) -> Dict[str, Any]:
        """
        Get portfolio data from Upstox
        
        This function would use the actual Upstox API in a production environment
        """
        try:
            # Get the connection
            connection = self.get_broker_connection(db, connection_id)
            if not connection or connection.broker_name != "upstox":
                return {"error": "Invalid Upstox connection"}
            
            # Check if token is expired
            if connection.token_expiry and connection.token_expiry < datetime.now():
                # In a real application, we would try to refresh the token
                return {"error": "Upstox token expired, please reconnect"}
            
            # In a real application, this would make a call to Upstox API
            # For demo purposes, we'll return mock data
            
            holdings = [
                {
                    "symbol": "TATAELXSI",
                    "exchange": "NSE",
                    "isin": "INE670A01012",
                    "quantity": 5,
                    "average_price": 5600.75,
                    "last_price": 5750.25,
                    "pnl": 747.50,
                    "day_change": 45.80,
                    "day_change_percentage": 0.85
                },
                {
                    "symbol": "ICICIBANK",
                    "exchange": "NSE",
                    "isin": "INE090A01021",
                    "quantity": 30,
                    "average_price": 850.50,
                    "last_price": 870.25,
                    "pnl": 592.50,
                    "day_change": 8.75,
                    "day_change_percentage": 1.05
                },
                {
                    "symbol": "BAJFINANCE",
                    "exchange": "NSE",
                    "isin": "INE296A01024",
                    "quantity": 8,
                    "average_price": 6700.00,
                    "last_price": 6550.50,
                    "pnl": -1196.00,
                    "day_change": -88.50,
                    "day_change_percentage": -1.35
                }
            ]
            
            return {
                "success": True,
                "broker": "upstox",
                "user_id": connection.broker_user_id,
                "holdings": holdings,
                "total_value": sum(h["quantity"] * h["last_price"] for h in holdings),
                "total_pnl": sum(h["pnl"] for h in holdings),
                "fetched_at": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": f"Error getting Upstox portfolio: {str(e)}"
            }
    
    def import_upstox_portfolio(self, db: Session, user_id: str, connection_id: str, 
                               portfolio_name: str) -> Dict[str, Any]:
        """
        Import Upstox portfolio into the application
        
        Creates a new portfolio with holdings from Upstox
        """
        try:
            # Get Upstox portfolio
            upstox_data = self.get_upstox_portfolio(db, connection_id)
            if "error" in upstox_data or not upstox_data.get("success", False):
                return upstox_data
            
            # Create new portfolio
            portfolio = Portfolio(
                user_id=user_id,
                name=portfolio_name,
                description=f"Imported from Upstox on {datetime.now().strftime('%Y-%m-%d')}"
            )
            
            db.add(portfolio)
            db.flush()
            
            # Add holdings as transactions
            for holding in upstox_data["holdings"]:
                # Create or get asset
                asset = db.query(Asset).filter(Asset.symbol == holding["symbol"]).first()
                
                if not asset:
                    # Create new asset
                    asset = Asset(
                        symbol=holding["symbol"],
                        name=holding["symbol"],  # Simplified, would be better with actual name
                        asset_type="stock",
                        exchange=holding["exchange"],
                        country="India"  # Assuming Upstox is India-focused
                    )
                    db.add(asset)
                    db.flush()
                
                # Create transaction
                transaction = Transaction(
                    portfolio_id=portfolio.id,
                    asset_id=asset.id,
                    transaction_type="buy",
                    quantity=holding["quantity"],
                    price=holding["average_price"],
                    transaction_date=datetime.now()
                )
                
                db.add(transaction)
            
            db.commit()
            db.refresh(portfolio)
            
            return {
                "success": True,
                "message": "Portfolio imported successfully",
                "portfolio_id": portfolio.id
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": f"Error importing Upstox portfolio: {str(e)}"
            }
    
    # -- Trading Functions (Simplified for Demo) --
    
    def place_order(self, db: Session, connection_id: str, symbol: str, 
                   exchange: str, quantity: int, order_type: str, 
                   price: Optional[float] = None) -> Dict[str, Any]:
        """
        Place an order through the connected broker
        
        This is a simplified demo implementation
        """
        try:
            # Get the connection
            connection = self.get_broker_connection(db, connection_id)
            if not connection:
                return {"error": "Invalid broker connection"}
            
            # Check if token is expired
            if connection.token_expiry and connection.token_expiry < datetime.now():
                return {"error": "Broker token expired, please reconnect"}
            
            # In a real application, this would make a call to the broker's API
            # For demo purposes, we'll return a mock response
            
            broker_name = connection.broker_name
            
            return {
                "success": True,
                "broker": broker_name,
                "order_id": f"{broker_name}_{uuid.uuid4().hex[:8]}",
                "symbol": symbol,
                "exchange": exchange,
                "quantity": quantity,
                "order_type": order_type,
                "price": price,
                "status": "PLACED",
                "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": f"Error placing order: {str(e)}"
            }
