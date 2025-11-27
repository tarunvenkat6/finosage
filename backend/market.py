from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Dict, List, Any, Optional
import json

from database import get_db
from models import User
from services.stock_service import StockService
from auth import get_current_user
import schemas

router = APIRouter()
stock_service = StockService()

# Stock quote endpoints
@router.get("/quote/{symbol}", response_model=Dict[str, Any])
async def get_stock_quote(
    symbol: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get latest quote for a stock
    """
    quote = stock_service.get_stock_quote(symbol)
    
    if "error" in quote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=quote["error"]
        )
    
    return quote

@router.post("/quotes", response_model=Dict[str, Dict[str, Any]])
async def get_multiple_quotes(
    symbols: List[str],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get quotes for multiple stocks
    """
    quotes = stock_service.get_multiple_quotes(symbols)
    return quotes

# Historical data endpoint
@router.get("/historical/{symbol}", response_model=Dict[str, Any])
async def get_historical_data(
    symbol: str,
    period: str = Query("1y", description="Time period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)"),
    interval: str = Query("1d", description="Data interval (1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get historical price data for a stock
    """
    data = stock_service.get_historical_data(symbol, period, interval)
    
    if "error" in data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=data["error"]
        )
    
    return data

# Search endpoint
@router.get("/search", response_model=List[Dict[str, Any]])
async def search_stocks(
    query: str = Query(..., description="Search query for stocks"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Search for stocks by name or symbol
    """
    results = stock_service.search_stocks(query)
    return results

# Market overview endpoints
@router.get("/indices", response_model=List[Dict[str, Any]])
async def get_market_indices(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get major market indices
    """
    indices = stock_service.get_market_indices()
    return indices

@router.get("/news", response_model=List[Dict[str, Any]])
async def get_market_news(
    category: str = Query("general", description="News category (general, forex, crypto, merger)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get market news
    """
    news = stock_service.get_market_news(category)
    return news

@router.get("/sectors", response_model=Dict[str, Any])
async def get_sector_performance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get sector performance data
    """
    sectors = stock_service.get_sector_performance()
    return sectors

# Market overview combined endpoint
@router.get("/overview", response_model=Dict[str, Any])
async def get_market_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get comprehensive market overview
    """
    # Get indices
    indices = stock_service.get_market_indices()
    
    # Get sector performance
    sectors = stock_service.get_sector_performance()
    
    # Get news
    news = stock_service.get_market_news()
    
    # In a real application, you might also want to include:
    # - Trending stocks
    # - Cryptocurrencies
    # - Commodities
    # - Forex rates
    
    # For demo, create a simple trending stocks list
    trending_stocks = [
        {"symbol": "AAPL", "name": "Apple Inc", "change_percent": 1.25},
        {"symbol": "MSFT", "name": "Microsoft Corp", "change_percent": 0.80},
        {"symbol": "GOOGL", "name": "Alphabet Inc", "change_percent": 1.50},
        {"symbol": "AMZN", "name": "Amazon.com Inc", "change_percent": -0.75},
        {"symbol": "TSLA", "name": "Tesla Inc", "change_percent": 2.25}
    ]
    
    # Sort trending stocks by absolute change percentage
    trending_stocks.sort(key=lambda x: abs(x["change_percent"]), reverse=True)
    
    return {
        "indices": indices,
        "sectors": sectors.get("sectors", {}),
        "news": news[:5],  # Limit to 5 news items
        "trending_stocks": trending_stocks,
        "timestamp": sectors.get("timestamp")
    }

# Stock detail endpoint
@router.get("/detail/{symbol}", response_model=Dict[str, Any])
async def get_stock_detail(
    symbol: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed information for a stock
    """
    # Get quote
    quote = stock_service.get_stock_quote(symbol)
    if "error" in quote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=quote["error"]
        )
    
    # Get historical data (1 year)
    historical = stock_service.get_historical_data(symbol, period="1y")
    
    # Get news related to this stock (in a real app)
    # For demo, return generic news
    news = stock_service.get_market_news()[:3]  # Limit to 3 news items
    
    # Calculate some additional metrics
    if historical["data"]:
        price_start = historical["data"][0]["close"]
        price_end = historical["data"][-1]["close"]
        price_change_year = ((price_end - price_start) / price_start) * 100
        price_high = max([d["high"] for d in historical["data"]])
        price_low = min([d["low"] for d in historical["data"]])
    else:
        price_change_year = 0
        price_high = 0
        price_low = 0
    
    # Create a simple recommendation based on price change
    # In a real app, this would use more sophisticated analysis
    recommendation = "Hold"
    if price_change_year > 25:
        recommendation = "Strong Buy"
    elif price_change_year > 10:
        recommendation = "Buy"
    elif price_change_year < -25:
        recommendation = "Strong Sell"
    elif price_change_year < -10:
        recommendation = "Sell"
    
    return {
        "symbol": symbol,
        "quote": quote,
        "historical_summary": {
            "period": "1 year",
            "change_percent": price_change_year,
            "high": price_high,
            "low": price_low
        },
        "historical_data": historical["data"][-30:],  # Last 30 days for chart
        "news": news,
        "recommendation": {
            "rating": recommendation,
            "factors": [
                f"Price changed {price_change_year:.2f}% over the past year",
                f"Current P/E ratio: {quote.get('pe_ratio', 'N/A')}",
                f"Market volatility: Medium"  # Placeholder
            ]
        }
    }
