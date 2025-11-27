from typing import Dict, List, Any, Optional
import datetime
import re
import json
import pandas as pd
import numpy as np
from fastapi import HTTPException, status

# -- Data Formatting Functions --

def format_currency(value: float, currency: str = "USD") -> str:
    """Format a value as currency."""
    if currency == "USD":
        return f"${value:,.2f}"
    elif currency == "INR":
        return f"₹{value:,.2f}"
    else:
        return f"{value:,.2f} {currency}"

def format_percentage(value: float) -> str:
    """Format a value as percentage."""
    sign = "+" if value >= 0 else ""
    return f"{sign}{value:.2f}%"

def format_date(date: datetime.datetime) -> str:
    """Format a datetime as ISO date."""
    return date.strftime("%Y-%m-%d")

def format_datetime(date: datetime.datetime) -> str:
    """Format a datetime as ISO datetime."""
    return date.strftime("%Y-%m-%d %H:%M:%S")

# -- Validation Functions --

def validate_stock_symbol(symbol: str) -> bool:
    """Validate stock symbol format."""
    pattern = r'^[A-Z]{1,5}(\.[A-Z]{1,2})?$'
    return bool(re.match(pattern, symbol))

def validate_email(email: str) -> bool:
    """Validate email format."""
    pattern = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
    return bool(re.match(pattern, email))

def validate_password_strength(password: str) -> Dict[str, Any]:
    """
    Validate password strength.
    Returns a dictionary with:
    - valid: boolean
    - score: int (0-5)
    - issues: list of issues
    """
    issues = []
    score = 5
    
    # Check length
    if len(password) < 8:
        issues.append("Password must be at least 8 characters")
        score -= 1
    
    # Check for uppercase
    if not re.search(r'[A-Z]', password):
        issues.append("Password must contain at least one uppercase letter")
        score -= 1
    
    # Check for lowercase
    if not re.search(r'[a-z]', password):
        issues.append("Password must contain at least one lowercase letter")
        score -= 1
    
    # Check for digits
    if not re.search(r'\d', password):
        issues.append("Password must contain at least one digit")
        score -= 1
    
    # Check for special characters
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        issues.append("Password must contain at least one special character")
        score -= 1
    
    return {
        "valid": len(issues) == 0,
        "score": max(score, 0),
        "issues": issues
    }

# -- Financial Calculations --

def calculate_portfolio_risk(portfolio_data: Dict[str, Any]) -> float:
    """
    Calculate portfolio risk score (1-10) based on asset volatility, 
    correlation, and diversification.
    """
    # This is a simplified placeholder.
    # In a real application, this would use asset volatility, correlations, etc.
    volatility_score = 5.0  # Placeholder
    diversification_score = calculate_diversification_score(portfolio_data)
    
    # Combine scores (simple average in this demo)
    risk_score = (volatility_score + (10 - diversification_score)) / 2
    return round(risk_score, 1)

def calculate_diversification_score(portfolio_data: Dict[str, Any]) -> float:
    """
    Calculate diversification score (1-10).
    10 = perfectly diversified
    1 = poorly diversified
    """
    # This is a simplified placeholder.
    try:
        # Extract asset allocations
        assets = portfolio_data.get("assets", [])
        if not assets:
            return 1.0
        
        # Calculate sector concentration
        sectors = {}
        for asset in assets:
            sector = asset.get("sector", "Unknown")
            value = asset.get("value", 0)
            sectors[sector] = sectors.get(sector, 0) + value
        
        total_value = sum(sectors.values())
        if total_value == 0:
            return 1.0
            
        # Calculate Herfindahl-Hirschman Index (HHI) for concentration
        hhi = sum((value / total_value) ** 2 for value in sectors.values())
        
        # Convert HHI to a 1-10 scale (inversely related)
        # 1/n <= HHI <= 1, where n is number of sectors
        # Lower HHI = better diversification
        min_hhi = 1 / len(sectors)
        score = 10 * (1 - ((hhi - min_hhi) / (1 - min_hhi)))
        
        return max(1.0, min(10.0, score))
    except Exception as e:
        print(f"Error calculating diversification: {str(e)}")
        return 5.0  # Default middle value on error

def calculate_returns(prices: List[float]) -> Dict[str, float]:
    """Calculate various return metrics from a list of prices."""
    if not prices or len(prices) < 2:
        return {"daily": 0, "weekly": 0, "monthly": 0, "yearly": 0}
    
    current_price = prices[-1]
    daily_price = prices[-2] if len(prices) > 1 else prices[0]
    weekly_price = prices[-7] if len(prices) > 7 else prices[0]
    monthly_price = prices[-30] if len(prices) > 30 else prices[0]
    yearly_price = prices[-365] if len(prices) > 365 else prices[0]
    
    return {
        "daily": ((current_price / daily_price) - 1) * 100,
        "weekly": ((current_price / weekly_price) - 1) * 100,
        "monthly": ((current_price / monthly_price) - 1) * 100,
        "yearly": ((current_price / yearly_price) - 1) * 100
    }

# -- Error Handling --

def handle_api_error(status_code: int, message: str, detail: Optional[Any] = None):
    """Standard error handling for API requests."""
    raise HTTPException(
        status_code=status_code,
        detail={
            "message": message,
            "detail": detail
        }
    )

# -- Data Processing --

def convert_json_dates(obj):
    """Convert date strings in JSON to datetime objects."""
    if isinstance(obj, dict):
        return {k: convert_json_dates(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_json_dates(v) for v in obj]
    elif isinstance(obj, str):
        try:
            # Attempt to parse ISO format dates
            date_pattern = r'^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$'
            if re.match(date_pattern, obj):
                return datetime.datetime.fromisoformat(obj.replace('Z', '+00:00'))
        except ValueError:
            pass
        return obj
    else:
        return obj

def json_to_dataframe(json_data: List[Dict[str, Any]]) -> pd.DataFrame:
    """Convert JSON data to a pandas DataFrame."""
    return pd.DataFrame(json_data)
