import requests
import json
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import time
import yfinance as yf
import pandas as pd
from config import ALPHA_VANTAGE_API_KEY, FINNHUB_API_KEY
from sqlalchemy.orm import Session
from models import Asset, AssetPrice

class StockService:
    def __init__(self):
        self.alpha_vantage_api_key = ALPHA_VANTAGE_API_KEY
        self.finnhub_api_key = FINNHUB_API_KEY
        self.base_url_av = "https://www.alphavantage.co/query"
        self.base_url_finnhub = "https://finnhub.io/api/v1"
        
    def get_stock_quote(self, symbol: str) -> Dict[str, Any]:
        """
        Get current stock price and basic info using Yahoo Finance
        """
        try:
            # Use yfinance for stock data
            stock = yf.Ticker(symbol)
            info = stock.info
            
            # Get historical data for calculating changes
            hist = stock.history(period="5d")
            
            if hist.empty:
                return {
                    "error": "No data available for this symbol"
                }
            
            # Calculate price changes
            current_price = hist["Close"].iloc[-1]
            prev_close = hist["Close"].iloc[-2] if len(hist) > 1 else current_price
            price_change = current_price - prev_close
            price_change_percent = (price_change / prev_close) * 100 if prev_close > 0 else 0
            
            # Format response
            return {
                "symbol": symbol,
                "name": info.get("shortName", symbol),
                "exchange": info.get("exchange", "Unknown"),
                "price": current_price,
                "change": price_change,
                "change_percent": price_change_percent,
                "volume": info.get("volume", 0),
                "market_cap": info.get("marketCap", None),
                "pe_ratio": info.get("trailingPE", None),
                "dividend_yield": info.get("dividendYield", None) * 100 if info.get("dividendYield") else None,
                "updated_at": datetime.now()
            }
            
        except Exception as e:
            print(f"Error getting stock quote for {symbol}: {str(e)}")
            return {
                "error": f"Failed to get data for {symbol}: {str(e)}"
            }
    
    def get_multiple_quotes(self, symbols: List[str]) -> Dict[str, Dict[str, Any]]:
        """Get quotes for multiple stocks"""
        results = {}
        for symbol in symbols:
            results[symbol] = self.get_stock_quote(symbol)
        return results
    
    def get_historical_data(self, symbol: str, period: str = "1y", interval: str = "1d") -> Dict[str, Any]:
        """
        Get historical stock data using Yahoo Finance
        
        Args:
            symbol: Stock symbol
            period: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max
            interval: 1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo
        """
        try:
            # Get data from Yahoo Finance
            stock = yf.Ticker(symbol)
            hist = stock.history(period=period, interval=interval)
            
            if hist.empty:
                return {
                    "error": "No historical data available for this symbol"
                }
            
            # Convert data to list format
            data_points = []
            for date, row in hist.iterrows():
                data_points.append({
                    "date": date.strftime('%Y-%m-%d'),
                    "open": row["Open"],
                    "high": row["High"],
                    "low": row["Low"],
                    "close": row["Close"],
                    "volume": row["Volume"]
                })
            
            return {
                "symbol": symbol,
                "period": period,
                "interval": interval,
                "data": data_points
            }
            
        except Exception as e:
            print(f"Error getting historical data for {symbol}: {str(e)}")
            return {
                "error": f"Failed to get historical data for {symbol}: {str(e)}"
            }
    
    def search_stocks(self, query: str) -> List[Dict[str, Any]]:
        """
        Search for stocks by name or symbol
        """
        try:
            # Alpha Vantage symbol search
            params = {
                "function": "SYMBOL_SEARCH",
                "keywords": query,
                "apikey": self.alpha_vantage_api_key
            }
            
            if not self.alpha_vantage_api_key:
                # Fallback to static data if no API key
                return self._get_mock_search_results(query)
            
            response = requests.get(self.base_url_av, params=params)
            data = response.json()
            
            if "bestMatches" not in data:
                return []
            
            results = []
            for match in data["bestMatches"]:
                results.append({
                    "symbol": match["1. symbol"],
                    "name": match["2. name"],
                    "type": match["3. type"],
                    "region": match["4. region"],
                    "currency": match["8. currency"],
                    "match_score": float(match["9. matchScore"])
                })
            
            return results
            
        except Exception as e:
            print(f"Error searching stocks: {str(e)}")
            return self._get_mock_search_results(query)
    
    def get_market_news(self, category: str = "general") -> List[Dict[str, Any]]:
        """
        Get market news from Finnhub
        
        Args:
            category: Category of news (general, forex, crypto, merger)
        """
        try:
            if not self.finnhub_api_key:
                return self._get_mock_news()
                
            params = {
                "category": category,
                "token": self.finnhub_api_key
            }
            
            response = requests.get(f"{self.base_url_finnhub}/news", params=params)
            data = response.json()
            
            news_items = []
            for item in data[:10]:  # Limit to 10 items
                news_items.append({
                    "headline": item["headline"],
                    "summary": item.get("summary", ""),
                    "source": item["source"],
                    "url": item["url"],
                    "date": datetime.fromtimestamp(item["datetime"]).strftime('%Y-%m-%d %H:%M:%S'),
                    "image": item.get("image", "")
                })
            
            return news_items
            
        except Exception as e:
            print(f"Error getting market news: {str(e)}")
            return self._get_mock_news()
    
    def get_market_indices(self) -> List[Dict[str, Any]]:
        """Get major market indices"""
        try:
            # List of major indices
            indices = [
                "^GSPC",    # S&P 500
                "^DJI",     # Dow Jones
                "^IXIC",    # NASDAQ
                "^FTSE",    # FTSE 100
                "^N225",    # Nikkei 225
                "^HSI"      # Hang Seng
            ]
            
            results = []
            for index in indices:
                quote = self.get_stock_quote(index)
                if "error" not in quote:
                    results.append(quote)
            
            return results
            
        except Exception as e:
            print(f"Error getting market indices: {str(e)}")
            return self._get_mock_indices()
    
    def get_sector_performance(self) -> Dict[str, Any]:
        """Get sector performance data"""
        try:
            if not self.alpha_vantage_api_key:
                return self._get_mock_sector_performance()
                
            params = {
                "function": "SECTOR",
                "apikey": self.alpha_vantage_api_key
            }
            
            response = requests.get(self.base_url_av, params=params)
            data = response.json()
            
            if "Rank A: Real-Time Performance" not in data:
                return self._get_mock_sector_performance()
            
            sectors = {}
            for sector, performance in data["Rank A: Real-Time Performance"].items():
                if sector != "Meta Data":
                    # Convert percentage string to float
                    perf_value = float(performance.strip("%"))
                    sectors[sector] = perf_value
            
            return {
                "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                "sectors": sectors
            }
            
        except Exception as e:
            print(f"Error getting sector performance: {str(e)}")
            return self._get_mock_sector_performance()
    
    def store_asset_prices(self, db: Session, symbols: List[str]) -> None:
        """Store current prices in database for the given symbols"""
        for symbol in symbols:
            try:
                # Get asset from database or create if it doesn't exist
                asset = db.query(Asset).filter(Asset.symbol == symbol).first()
                if not asset:
                    # Get stock info
                    stock_info = self.get_stock_quote(symbol)
                    if "error" in stock_info:
                        continue
                    
                    # Create new asset
                    asset = Asset(
                        symbol=symbol,
                        name=stock_info.get("name", symbol),
                        asset_type="stock",
                        exchange=stock_info.get("exchange", "Unknown"),
                        currency="USD"
                    )
                    db.add(asset)
                    db.flush()
                
                # Get current price
                quote = self.get_stock_quote(symbol)
                if "error" in quote:
                    continue
                
                # Store price
                price = AssetPrice(
                    asset_id=asset.id,
                    date=datetime.now(),
                    open_price=quote.get("open", quote["price"]),
                    close_price=quote["price"],
                    high_price=quote.get("high", quote["price"]),
                    low_price=quote.get("low", quote["price"]),
                    volume=quote.get("volume", 0)
                )
                
                db.add(price)
                
            except Exception as e:
                print(f"Error storing price for {symbol}: {str(e)}")
                continue
        
        db.commit()
    
    # Mock data methods for when API keys are not available
    def _get_mock_search_results(self, query: str) -> List[Dict[str, Any]]:
        """Return mock search results"""
        mock_stocks = [
            {"symbol": "AAPL", "name": "Apple Inc", "type": "Equity", "region": "United States", "currency": "USD"},
            {"symbol": "MSFT", "name": "Microsoft Corporation", "type": "Equity", "region": "United States", "currency": "USD"},
            {"symbol": "GOOGL", "name": "Alphabet Inc", "type": "Equity", "region": "United States", "currency": "USD"},
            {"symbol": "AMZN", "name": "Amazon.com Inc", "type": "Equity", "region": "United States", "currency": "USD"},
            {"symbol": "TSLA", "name": "Tesla Inc", "type": "Equity", "region": "United States", "currency": "USD"}
        ]
        
        # Filter by query
        query = query.lower()
        results = [
            stock for stock in mock_stocks 
            if query in stock["symbol"].lower() or query in stock["name"].lower()
        ]
        
        # Add match score
        for stock in results:
            stock["match_score"] = 0.8
            
        return results
    
    def _get_mock_news(self) -> List[Dict[str, Any]]:
        """Return mock news data"""
        return [
            {
                "headline": "Market Rally Continues on Strong Earnings",
                "summary": "Stock indices reached new highs as companies reported better than expected earnings.",
                "source": "Financial Times",
                "url": "https://example.com/news/1",
                "date": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                "image": "https://example.com/images/news1.jpg"
            },
            {
                "headline": "Tech Stocks Lead Market Gains",
                "summary": "Technology sector continues to outperform as investors favor growth stocks.",
                "source": "Wall Street Journal",
                "url": "https://example.com/news/2",
                "date": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                "image": "https://example.com/images/news2.jpg"
            },
            {
                "headline": "Federal Reserve Signals Interest Rate Cut",
                "summary": "Fed chair indicates potential rate cuts in upcoming meeting, boosting market sentiment.",
                "source": "Bloomberg",
                "url": "https://example.com/news/3",
                "date": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                "image": "https://example.com/images/news3.jpg"
            }
        ]
    
    def _get_mock_indices(self) -> List[Dict[str, Any]]:
        """Return mock market indices data"""
        indices = [
            {"symbol": "^GSPC", "name": "S&P 500", "price": 4200.0, "change": 15.0, "change_percent": 0.36},
            {"symbol": "^DJI", "name": "Dow Jones", "price": 32000.0, "change": 120.0, "change_percent": 0.38},
            {"symbol": "^IXIC", "name": "NASDAQ", "price": 14000.0, "change": 50.0, "change_percent": 0.36},
            {"symbol": "^FTSE", "name": "FTSE 100", "price": 7200.0, "change": 25.0, "change_percent": 0.35},
            {"symbol": "^N225", "name": "Nikkei 225", "price": 28000.0, "change": 100.0, "change_percent": 0.36}
        ]
        
        for index in indices:
            index["volume"] = 0
            index["updated_at"] = datetime.now()
            
        return indices
    
    def _get_mock_sector_performance(self) -> Dict[str, Any]:
        """Return mock sector performance data"""
        return {
            "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            "sectors": {
                "Information Technology": 0.95,
                "Health Care": 0.45,
                "Communication Services": 0.65,
                "Consumer Discretionary": 0.35,
                "Financials": 0.25,
                "Industrials": 0.15,
                "Consumer Staples": 0.05,
                "Energy": -0.15,
                "Utilities": -0.25,
                "Real Estate": -0.35,
                "Materials": -0.45
            }
        }
