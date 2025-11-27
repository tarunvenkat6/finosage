from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
import uuid
import json
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func

from models import User, Portfolio, Asset, Transaction, PortfolioAnalysis
from services.stock_service import StockService
from services.ai_service import AIService
from utils import calculate_portfolio_risk, calculate_diversification_score

class PortfolioService:
    def __init__(self):
        self.stock_service = StockService()
        self.ai_service = AIService()
    
    # -- Portfolio Management --
    
    def create_portfolio(self, db: Session, user_id: str, name: str, description: Optional[str] = None, is_demo: bool = False) -> Portfolio:
        """Create a new portfolio for a user"""
        portfolio = Portfolio(
            user_id=user_id,
            name=name,
            description=description,
            is_demo=is_demo
        )
        
        db.add(portfolio)
        db.commit()
        db.refresh(portfolio)
        
        return portfolio
    
    def get_portfolio(self, db: Session, portfolio_id: str) -> Optional[Portfolio]:
        """Get a portfolio by ID"""
        return db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()
    
    def get_user_portfolios(self, db: Session, user_id: str) -> List[Portfolio]:
        """Get all portfolios for a user"""
        return db.query(Portfolio).filter(Portfolio.user_id == user_id).all()
    
    def delete_portfolio(self, db: Session, portfolio_id: str) -> bool:
        """Delete a portfolio"""
        portfolio = db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()
        if not portfolio:
            return False
        
        # Delete transactions
        db.query(Transaction).filter(Transaction.portfolio_id == portfolio_id).delete()
        
        # Delete analyses
        db.query(PortfolioAnalysis).filter(PortfolioAnalysis.portfolio_id == portfolio_id).delete()
        
        # Delete portfolio
        db.delete(portfolio)
        db.commit()
        
        return True
    
    # -- Portfolio Analysis --
    
    def analyze_portfolio(self, db: Session, portfolio_id: str, refresh: bool = False) -> Dict[str, Any]:
        """
        Analyze a portfolio and return detailed metrics
        If refresh is True, force a fresh analysis
        """
        # Get portfolio
        portfolio = db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()
        if not portfolio:
            return {"error": "Portfolio not found"}
        
        # Check for recent analysis
        if not refresh:
            recent_analysis = db.query(PortfolioAnalysis).filter(
                PortfolioAnalysis.portfolio_id == portfolio_id,
                PortfolioAnalysis.analysis_date > datetime.now() - timedelta(hours=24)
            ).order_by(PortfolioAnalysis.analysis_date.desc()).first()
            
            if recent_analysis:
                return self._format_analysis_response(recent_analysis, db)
        
        # Get transactions
        transactions = db.query(Transaction).filter(Transaction.portfolio_id == portfolio_id).all()
        
        # Calculate holdings by aggregating transactions
        holdings = self._calculate_holdings(transactions, db)
        
        # Get current prices
        symbols = [holding["symbol"] for holding in holdings]
        quotes = self.stock_service.get_multiple_quotes(symbols)
        
        # Calculate portfolio value and other metrics
        total_value = 0
        for holding in holdings:
            symbol = holding["symbol"]
            if symbol in quotes and "error" not in quotes[symbol]:
                quote = quotes[symbol]
                holding["current_price"] = quote["price"]
                holding["value"] = holding["quantity"] * quote["price"]
                holding["daily_change"] = quote["change_percent"]
                
                # Add to total value
                total_value += holding["value"]
        
        # Calculate allocation percentages
        for holding in holdings:
            if "value" in holding and total_value > 0:
                holding["allocation"] = (holding["value"] / total_value) * 100
            else:
                holding["allocation"] = 0
        
        # Calculate risk metrics
        portfolio_data = {
            "assets": holdings,
            "total_value": total_value
        }
        
        risk_score = calculate_portfolio_risk(portfolio_data)
        diversification_score = calculate_diversification_score(portfolio_data)
        
        # Calculate sector allocation
        sector_allocation = self._calculate_sector_allocation(holdings)
        
        # Calculate asset type allocation
        asset_type_allocation = self._calculate_asset_type_allocation(holdings)
        
        # Calculate overall performance metrics
        daily_pl = sum(holding.get("value", 0) * holding.get("daily_change", 0) / 100 for holding in holdings)
        
        # Store analysis in database
        analysis = PortfolioAnalysis(
            portfolio_id=portfolio_id,
            analysis_date=datetime.now(),
            total_value=total_value,
            daily_pl=daily_pl,
            total_pl=0,  # Would require historical data
            risk_metrics={"risk_score": risk_score},
            diversification_score=diversification_score,
            allocation={
                "sectors": sector_allocation,
                "asset_types": asset_type_allocation
            }
        )
        
        db.add(analysis)
        db.commit()
        db.refresh(analysis)
        
        # Update portfolio risk score
        portfolio.risk_score = risk_score
        db.commit()
        
        # Format response
        return self._format_analysis_response(analysis, db)
    
    def get_portfolio_recommendations(self, db: Session, portfolio_id: str) -> Dict[str, Any]:
        """Get AI-powered recommendations for a portfolio"""
        # Get portfolio analysis
        analysis = self.analyze_portfolio(db, portfolio_id)
        if "error" in analysis:
            return analysis
        
        # Get AI recommendations
        ai_recommendations = self.ai_service.get_portfolio_analysis(analysis)
        
        # Store recommendations in database
        portfolio_analysis = db.query(PortfolioAnalysis).filter(
            PortfolioAnalysis.portfolio_id == portfolio_id
        ).order_by(PortfolioAnalysis.analysis_date.desc()).first()
        
        if portfolio_analysis:
            portfolio_analysis.recommendations = {
                "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                "analysis": ai_recommendations
            }
            db.commit()
        
        return {
            "portfolio_id": portfolio_id,
            "recommendations": ai_recommendations,
            "analysis": analysis
        }
    
    # -- Portfolio Builder --
    
    def build_portfolio(self, db: Session, user_id: str, criteria: Dict[str, Any]) -> Dict[str, Any]:
        """
        Build a portfolio based on user criteria
        
        Args:
            criteria: Dictionary with criteria like risk_level, investment_amount, goals, etc.
        """
        # This is a simplified implementation
        # In a real application, this would use more sophisticated algorithms
        
        # Create a new portfolio
        portfolio_name = criteria.get("name", f"Portfolio {datetime.now().strftime('%Y-%m-%d')}")
        portfolio = self.create_portfolio(
            db=db,
            user_id=user_id,
            name=portfolio_name,
            description=criteria.get("description", "Auto-generated portfolio"),
            is_demo=True
        )
        
        # Determine asset allocation based on risk level
        risk_level = criteria.get("risk_level", "moderate")
        investment_amount = criteria.get("investment_amount", 10000)
        
        allocations = self._get_allocation_by_risk(risk_level)
        
        # Select assets for each category
        selected_assets = self._select_assets_by_allocation(allocations)
        
        # Create transactions for the portfolio
        for asset in selected_assets:
            # Calculate amount to invest in this asset
            amount = investment_amount * (asset["allocation"] / 100)
            
            # Get current price
            quote = self.stock_service.get_stock_quote(asset["symbol"])
            if "error" in quote:
                continue
                
            # Calculate quantity
            quantity = amount / quote["price"]
            
            # Create transaction
            transaction = Transaction(
                portfolio_id=portfolio.id,
                asset_id=self._get_or_create_asset(db, asset["symbol"], quote).id,
                transaction_type="buy",
                quantity=quantity,
                price=quote["price"],
                transaction_date=datetime.now()
            )
            
            db.add(transaction)
        
        db.commit()
        
        # Analyze the new portfolio
        analysis = self.analyze_portfolio(db, portfolio.id, refresh=True)
        
        return {
            "portfolio": {
                "id": portfolio.id,
                "name": portfolio.name,
                "description": portfolio.description
            },
            "analysis": analysis
        }
    
    def update_portfolio_with_recommendation(self, db: Session, portfolio_id: str, 
                                             recommendation_id: str) -> Dict[str, Any]:
        """
        Update a portfolio by applying a recommendation
        
        Args:
            portfolio_id: ID of the portfolio to update
            recommendation_id: ID of the recommendation to apply
        """
        # Get portfolio
        portfolio = db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()
        if not portfolio:
            return {"error": "Portfolio not found"}
        
        # Get the most recent analysis
        analysis = db.query(PortfolioAnalysis).filter(
            PortfolioAnalysis.portfolio_id == portfolio_id
        ).order_by(PortfolioAnalysis.analysis_date.desc()).first()
        
        if not analysis or not analysis.recommendations:
            return {"error": "No recommendations found for this portfolio"}
        
        # In a real application, you would have specific recommendation IDs
        # For this demo, we'll simulate applying a recommendation
        
        # Create a sample transaction based on the "recommendation"
        symbol = "AAPL"  # Example
        
        # Get asset
        asset = db.query(Asset).filter(Asset.symbol == symbol).first()
        if not asset:
            quote = self.stock_service.get_stock_quote(symbol)
            if "error" in quote:
                return {"error": f"Could not fetch data for {symbol}"}
            asset = self._get_or_create_asset(db, symbol, quote)
        
        # Create transaction
        transaction = Transaction(
            portfolio_id=portfolio_id,
            asset_id=asset.id,
            transaction_type="buy",
            quantity=5,
            price=150.0,  # Example price
            transaction_date=datetime.now(),
            notes="Applied recommendation"
        )
        
        db.add(transaction)
        db.commit()
        
        # Refresh portfolio analysis
        refreshed_analysis = self.analyze_portfolio(db, portfolio_id, refresh=True)
        
        return {
            "success": True,
            "message": f"Applied recommendation: Add {symbol}",
            "analysis": refreshed_analysis
        }
    
    # -- Helper Methods --
    
    def _calculate_holdings(self, transactions: List[Transaction], db: Session) -> List[Dict[str, Any]]:
        """Calculate current holdings from transactions"""
        holdings_dict = {}
        
        for tx in transactions:
            # Get asset info
            asset = db.query(Asset).filter(Asset.id == tx.asset_id).first()
            if not asset:
                continue
                
            if asset.symbol not in holdings_dict:
                holdings_dict[asset.symbol] = {
                    "symbol": asset.symbol,
                    "name": asset.name,
                    "asset_type": asset.asset_type,
                    "quantity": 0,
                    "cost_basis": 0,
                    "sector": asset.sector
                }
            
            if tx.transaction_type == "buy":
                # Update quantity and cost basis
                current_value = holdings_dict[asset.symbol]["quantity"] * holdings_dict[asset.symbol].get("avg_price", 0)
                new_value = tx.quantity * tx.price
                new_quantity = holdings_dict[asset.symbol]["quantity"] + tx.quantity
                
                if new_quantity > 0:
                    holdings_dict[asset.symbol]["avg_price"] = (current_value + new_value) / new_quantity
                
                holdings_dict[asset.symbol]["quantity"] += tx.quantity
                holdings_dict[asset.symbol]["cost_basis"] += (tx.quantity * tx.price) + tx.fees
                
            elif tx.transaction_type == "sell":
                # Reduce position
                holdings_dict[asset.symbol]["quantity"] -= tx.quantity
                
                # If fully sold, adjust cost basis proportionally
                if holdings_dict[asset.symbol]["quantity"] > 0:
                    ratio = tx.quantity / (holdings_dict[asset.symbol]["quantity"] + tx.quantity)
                    holdings_dict[asset.symbol]["cost_basis"] *= (1 - ratio)
                else:
                    holdings_dict[asset.symbol]["cost_basis"] = 0
        
        # Convert to list and remove zero positions
        holdings = [
            holding for symbol, holding in holdings_dict.items()
            if holding["quantity"] > 0
        ]
        
        return holdings
    
    def _calculate_sector_allocation(self, holdings: List[Dict[str, Any]]) -> Dict[str, float]:
        """Calculate sector allocation percentages"""
        sectors = {}
        total_value = sum(holding.get("value", 0) for holding in holdings)
        
        if total_value == 0:
            return {}
        
        for holding in holdings:
            sector = holding.get("sector", "Other")
            value = holding.get("value", 0)
            
            if sector not in sectors:
                sectors[sector] = 0
                
            sectors[sector] += value
            
        # Convert to percentages
        for sector, value in sectors.items():
            sectors[sector] = (value / total_value) * 100
            
        return sectors
    
    def _calculate_asset_type_allocation(self, holdings: List[Dict[str, Any]]) -> Dict[str, float]:
        """Calculate asset type allocation percentages"""
        asset_types = {}
        total_value = sum(holding.get("value", 0) for holding in holdings)
        
        if total_value == 0:
            return {}
        
        for holding in holdings:
            asset_type = holding.get("asset_type", "Other")
            value = holding.get("value", 0)
            
            if asset_type not in asset_types:
                asset_types[asset_type] = 0
                
            asset_types[asset_type] += value
            
        # Convert to percentages
        for asset_type, value in asset_types.items():
            asset_types[asset_type] = (value / total_value) * 100
            
        return asset_types
    
    def _format_analysis_response(self, analysis: PortfolioAnalysis, db: Session) -> Dict[str, Any]:
        """Format portfolio analysis for API response"""
        # Get portfolio
        portfolio = db.query(Portfolio).filter(Portfolio.id == analysis.portfolio_id).first()
        
        # Get holdings
        transactions = db.query(Transaction).filter(
            Transaction.portfolio_id == analysis.portfolio_id
        ).all()
        
        holdings = self._calculate_holdings(transactions, db)
        
        # Get current prices
        symbols = [holding["symbol"] for holding in holdings]
        quotes = self.stock_service.get_multiple_quotes(symbols)
        
        # Update holdings with current prices
        for holding in holdings:
            symbol = holding["symbol"]
            if symbol in quotes and "error" not in quotes[symbol]:
                quote = quotes[symbol]
                holding["current_price"] = quote["price"]
                holding["value"] = holding["quantity"] * quote["price"]
                holding["daily_change"] = quote["change_percent"]
                
                # Calculate total return
                if "cost_basis" in holding and holding["cost_basis"] > 0:
                    holding["total_return"] = ((holding["value"] - holding["cost_basis"]) / holding["cost_basis"]) * 100
                else:
                    holding["total_return"] = 0
        
        # Calculate allocation percentages
        total_value = analysis.total_value
        for holding in holdings:
            if "value" in holding and total_value > 0:
                holding["allocation"] = (holding["value"] / total_value) * 100
            else:
                holding["allocation"] = 0
        
        return {
            "portfolio_id": analysis.portfolio_id,
            "portfolio_name": portfolio.name if portfolio else "Unknown",
            "analysis_date": analysis.analysis_date.strftime('%Y-%m-%d %H:%M:%S'),
            "total_value": analysis.total_value,
            "daily_pl": analysis.daily_pl,
            "daily_pl_percent": (analysis.daily_pl / analysis.total_value) * 100 if analysis.total_value > 0 else 0,
            "total_pl": analysis.total_pl,
            "risk_score": analysis.risk_metrics.get("risk_score", 5.0),
            "diversification_score": analysis.diversification_score,
            "allocation": analysis.allocation,
            "holdings": holdings,
            "recommendations": analysis.recommendations
        }
    
    def _get_allocation_by_risk(self, risk_level: str) -> List[Dict[str, Any]]:
        """Get asset allocation based on risk level"""
        allocations = []
        
        if risk_level == "conservative":
            allocations = [
                {"category": "Large Cap Stocks", "allocation": 20, "asset_type": "stock"},
                {"category": "Mid Cap Stocks", "allocation": 10, "asset_type": "stock"},
                {"category": "International Stocks", "allocation": 10, "asset_type": "stock"},
                {"category": "Bonds", "allocation": 50, "asset_type": "bond"},
                {"category": "Cash", "allocation": 10, "asset_type": "cash"}
            ]
        elif risk_level == "moderate":
            allocations = [
                {"category": "Large Cap Stocks", "allocation": 35, "asset_type": "stock"},
                {"category": "Mid Cap Stocks", "allocation": 15, "asset_type": "stock"},
                {"category": "Small Cap Stocks", "allocation": 5, "asset_type": "stock"},
                {"category": "International Stocks", "allocation": 15, "asset_type": "stock"},
                {"category": "Bonds", "allocation": 25, "asset_type": "bond"},
                {"category": "Cash", "allocation": 5, "asset_type": "cash"}
            ]
        elif risk_level == "aggressive":
            allocations = [
                {"category": "Large Cap Stocks", "allocation": 30, "asset_type": "stock"},
                {"category": "Mid Cap Stocks", "allocation": 20, "asset_type": "stock"},
                {"category": "Small Cap Stocks", "allocation": 15, "asset_type": "stock"},
                {"category": "International Stocks", "allocation": 25, "asset_type": "stock"},
                {"category": "Bonds", "allocation": 10, "asset_type": "bond"},
                {"category": "Cash", "allocation": 0, "asset_type": "cash"}
            ]
        else:  # very aggressive
            allocations = [
                {"category": "Large Cap Stocks", "allocation": 25, "asset_type": "stock"},
                {"category": "Mid Cap Stocks", "allocation": 25, "asset_type": "stock"},
                {"category": "Small Cap Stocks", "allocation": 20, "asset_type": "stock"},
                {"category": "International Stocks", "allocation": 30, "asset_type": "stock"},
                {"category": "Bonds", "allocation": 0, "asset_type": "bond"},
                {"category": "Cash", "allocation": 0, "asset_type": "cash"}
            ]
            
        return allocations
    
    def _select_assets_by_allocation(self, allocations: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Select specific assets based on allocation categories"""
        # This is a simplified implementation
        # In a real application, this would use more sophisticated selection algorithms
        
        # Example mapping of categories to specific assets
        asset_mapping = {
            "Large Cap Stocks": [
                {"symbol": "AAPL", "name": "Apple Inc", "allocation": None},
                {"symbol": "MSFT", "name": "Microsoft Corp", "allocation": None},
                {"symbol": "AMZN", "name": "Amazon.com Inc", "allocation": None},
                {"symbol": "GOOGL", "name": "Alphabet Inc", "allocation": None}
            ],
            "Mid Cap Stocks": [
                {"symbol": "AMD", "name": "Advanced Micro Devices", "allocation": None},
                {"symbol": "UBER", "name": "Uber Technologies Inc", "allocation": None}
            ],
            "Small Cap Stocks": [
                {"symbol": "PLTR", "name": "Palantir Technologies", "allocation": None}
            ],
            "International Stocks": [
                {"symbol": "BABA", "name": "Alibaba Group Holding", "allocation": None},
                {"symbol": "TSM", "name": "Taiwan Semiconductor", "allocation": None}
            ],
            "Bonds": [
                {"symbol": "AGG", "name": "iShares Core US Aggregate Bond ETF", "allocation": None},
                {"symbol": "BND", "name": "Vanguard Total Bond Market ETF", "allocation": None}
            ],
            "Cash": [
                {"symbol": "SGOV", "name": "iShares 0-3 Month Treasury Bond ETF", "allocation": None}
            ]
        }
        
        selected_assets = []
        
        for allocation in allocations:
            category = allocation["category"]
            category_allocation = allocation["allocation"]
            
            if category in asset_mapping and asset_mapping[category]:
                # Select assets from this category
                category_assets = asset_mapping[category]
                asset_count = len(category_assets)
                
                if asset_count > 0:
                    # Distribute allocation evenly among assets in the category
                    per_asset_allocation = category_allocation / asset_count
                    
                    for asset in category_assets:
                        asset_copy = asset.copy()
                        asset_copy["allocation"] = per_asset_allocation
                        asset_copy["asset_type"] = allocation["asset_type"]
                        selected_assets.append(asset_copy)
        
        return selected_assets
    
    def _get_or_create_asset(self, db: Session, symbol: str, quote: Dict[str, Any]) -> Asset:
        """Get an asset from the database or create if it doesn't exist"""
        asset = db.query(Asset).filter(Asset.symbol == symbol).first()
        
        if not asset:
            asset = Asset(
                symbol=symbol,
                name=quote.get("name", symbol),
                asset_type="stock",  # Default
                exchange=quote.get("exchange", "Unknown"),
                sector=quote.get("sector", "Technology"),  # Example default
                country="United States",  # Example default
                currency="USD"  # Example default
            )
            db.add(asset)
            db.flush()
            
        return asset
