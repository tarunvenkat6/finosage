from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.orm import Session
from typing import Dict, List, Any, Optional
import json

from database import get_db
from models import User, Portfolio, Transaction
from services.portfolio_service import PortfolioService
from services.broker_service import BrokerService
from auth import get_current_user
import schemas

router = APIRouter()
portfolio_service = PortfolioService()
broker_service = BrokerService()

# Portfolio management endpoints
@router.post("/", response_model=schemas.Portfolio)
async def create_portfolio(
    portfolio: schemas.PortfolioCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new portfolio
    """
    created_portfolio = portfolio_service.create_portfolio(
        db=db,
        user_id=current_user.id,
        name=portfolio.name,
        description=portfolio.description,
        is_demo=portfolio.is_demo
    )
    
    return created_portfolio

@router.get("/", response_model=List[schemas.Portfolio])
async def get_user_portfolios(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all portfolios for the current user
    """
    portfolios = portfolio_service.get_user_portfolios(db, current_user.id)
    return portfolios

@router.get("/{portfolio_id}", response_model=schemas.PortfolioDetail)
async def get_portfolio(
    portfolio_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific portfolio with holdings
    """
    portfolio = portfolio_service.get_portfolio(db, portfolio_id)
    
    if not portfolio or portfolio.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    # Get portfolio analysis
    analysis = portfolio_service.analyze_portfolio(db, portfolio_id)
    
    # Combine portfolio with analysis data
    return {
        "id": portfolio.id,
        "user_id": portfolio.user_id,
        "name": portfolio.name,
        "description": portfolio.description,
        "risk_score": portfolio.risk_score,
        "is_demo": portfolio.is_demo,
        "created_at": portfolio.created_at,
        "updated_at": portfolio.updated_at,
        "assets": analysis.get("holdings", []),
        "total_value": analysis.get("total_value", 0.0),
        "daily_change": analysis.get("daily_pl", 0.0),
        "total_change": analysis.get("total_pl", 0.0)
    }

@router.delete("/{portfolio_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_portfolio(
    portfolio_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a portfolio
    """
    portfolio = portfolio_service.get_portfolio(db, portfolio_id)
    
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    if portfolio.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this portfolio"
        )
    
    success = portfolio_service.delete_portfolio(db, portfolio_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete portfolio"
        )
    
    return None

# Portfolio transactions
@router.post("/{portfolio_id}/transactions", response_model=schemas.Transaction)
async def add_transaction(
    portfolio_id: str,
    transaction: schemas.TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Add a transaction to a portfolio
    """
    portfolio = portfolio_service.get_portfolio(db, portfolio_id)
    
    if not portfolio or portfolio.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    # Check if the transaction's portfolio ID matches the URL
    if transaction.portfolio_id != portfolio_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transaction portfolio ID does not match URL"
        )
    
    # Create transaction
    # In a real application, this would be a service method
    try:
        # Get asset by ID
        asset = db.query(models.Asset).filter(models.Asset.id == transaction.asset_id).first()
        if not asset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Asset not found"
            )
        
        # Create transaction
        db_transaction = Transaction(
            portfolio_id=portfolio_id,
            asset_id=transaction.asset_id,
            transaction_type=transaction.transaction_type,
            quantity=transaction.quantity,
            price=transaction.price,
            transaction_date=transaction.transaction_date,
            fees=transaction.fees,
            notes=transaction.notes
        )
        
        db.add(db_transaction)
        db.commit()
        db.refresh(db_transaction)
        
        return db_transaction
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create transaction: {str(e)}"
        )

@router.get("/{portfolio_id}/transactions", response_model=List[schemas.Transaction])
async def get_portfolio_transactions(
    portfolio_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all transactions for a portfolio
    """
    portfolio = portfolio_service.get_portfolio(db, portfolio_id)
    
    if not portfolio or portfolio.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    transactions = db.query(Transaction).filter(
        Transaction.portfolio_id == portfolio_id
    ).order_by(Transaction.transaction_date.desc()).all()
    
    return transactions

# Portfolio analysis endpoints
@router.get("/{portfolio_id}/analysis", response_model=Dict[str, Any])
async def analyze_portfolio(
    portfolio_id: str,
    refresh: bool = Query(False, description="Force a fresh analysis"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Analyze a portfolio and return detailed metrics
    """
    portfolio = portfolio_service.get_portfolio(db, portfolio_id)
    
    if not portfolio or portfolio.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    analysis = portfolio_service.analyze_portfolio(db, portfolio_id, refresh)
    
    return analysis

@router.get("/{portfolio_id}/recommendations", response_model=Dict[str, Any])
async def get_portfolio_recommendations(
    portfolio_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get AI-powered recommendations for a portfolio
    """
    portfolio = portfolio_service.get_portfolio(db, portfolio_id)
    
    if not portfolio or portfolio.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    recommendations = portfolio_service.get_portfolio_recommendations(db, portfolio_id)
    
    return recommendations

@router.post("/{portfolio_id}/apply-recommendation/{recommendation_id}", response_model=Dict[str, Any])
async def apply_recommendation(
    portfolio_id: str,
    recommendation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Apply a recommendation to a portfolio
    """
    portfolio = portfolio_service.get_portfolio(db, portfolio_id)
    
    if not portfolio or portfolio.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    result = portfolio_service.update_portfolio_with_recommendation(
        db, portfolio_id, recommendation_id
    )
    
    if "error" in result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["error"]
        )
    
    return result

# Portfolio builder endpoints
@router.post("/builder", response_model=Dict[str, Any])
async def build_portfolio(
    criteria: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Build a portfolio based on user criteria
    """
    result = portfolio_service.build_portfolio(db, current_user.id, criteria)
    
    if "error" in result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["error"]
        )
    
    return result

# Broker integration endpoints
@router.get("/broker-connections", response_model=List[Dict[str, Any]])
async def get_broker_connections(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all broker connections for the user
    """
    connections = broker_service.get_broker_connections(db, current_user.id)
    
    return [
        {
            "id": conn.id,
            "broker_name": conn.broker_name,
            "broker_user_id": conn.broker_user_id,
            "is_active": conn.is_active,
            "created_at": conn.created_at,
            "updated_at": conn.updated_at
        }
        for conn in connections
    ]

@router.post("/connect-zerodha", response_model=Dict[str, Any])
async def connect_zerodha(
    request_token: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Connect to Zerodha
    """
    result = broker_service.connect_zerodha(db, current_user.id, request_token)
    
    if not result.get("success", False):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Failed to connect to Zerodha")
        )
    
    return result

@router.post("/connect-upstox", response_model=Dict[str, Any])
async def connect_upstox(
    request_token: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Connect to Upstox
    """
    result = broker_service.connect_upstox(db, current_user.id, request_token)
    
    if not result.get("success", False):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Failed to connect to Upstox")
        )
    
    return result

@router.get("/zerodha-portfolio/{connection_id}", response_model=Dict[str, Any])
async def get_zerodha_portfolio(
    connection_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get portfolio from Zerodha
    """
    result = broker_service.get_zerodha_portfolio(db, connection_id)
    
    if "error" in result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["error"]
        )
    
    return result

@router.post("/import-zerodha-portfolio/{connection_id}", response_model=Dict[str, Any])
async def import_zerodha_portfolio(
    connection_id: str,
    portfolio_name: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Import portfolio from Zerodha
    """
    result = broker_service.import_zerodha_portfolio(
        db, current_user.id, connection_id, portfolio_name
    )
    
    if not result.get("success", False):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Failed to import Zerodha portfolio")
        )
    
    return result
