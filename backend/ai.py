from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import Dict, List, Any, Optional
import json

from database import get_db
from models import User, Conversation, Message
from services.ai_service import AIService
from auth import get_current_user
import schemas

router = APIRouter()
ai_service = AIService()

# AI Chat endpoints
@router.post("/chat", response_model=schemas.AIResponse)
async def chat_with_ai(
    query: schemas.AIQuery,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Chat with the AI advisor
    
    Can optionally include conversation_id to continue an existing conversation
    Can optionally include portfolio_id to reference specific portfolio in the chat
    Can optionally include data_context for additional context
    """
    try:
        # Get conversation history if provided
        conversation_history = []
        if query.conversation_id:
            conversation_history = ai_service.get_conversation_history(db, query.conversation_id)
        
        # Add portfolio context if provided
        if query.portfolio_id:
            # Would add portfolio-specific context to the system prompt
            system_prompt = """You are FinoSage, a financial advisor AI assistant that provides investment advice, 
            portfolio analysis, market insights, and educational content.
            The user has shared their portfolio with you, so you can reference their specific investments.
            Your goal is to help users make informed financial decisions.
            Be respectful, educational, accurate, and pragmatic."""
        else:
            system_prompt = None  # Use default in service
        
        # Get response from AI
        ai_response = ai_service.get_claude_response(
            query=query.query,
            system_prompt=system_prompt,
            conversation_history=conversation_history
        )
        
        # Save conversation
        conversation = ai_service.save_conversation(
            db=db,
            user_id=current_user.id,
            query=query.query,
            response=ai_response["content"],
            conversation_id=query.conversation_id
        )
        
        return {
            "message": ai_response["content"],
            "conversation_id": conversation.id,
            "additional_data": ai_response.get("usage", {})
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process AI query: {str(e)}"
        )

@router.get("/conversations", response_model=List[schemas.Conversation])
async def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all conversations for the current user"""
    conversations = ai_service.list_user_conversations(db, current_user.id)
    return conversations

@router.get("/conversations/{conversation_id}", response_model=schemas.ConversationWithMessages)
async def get_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific conversation with its messages"""
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # Get messages
    messages = db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(Message.created_at.asc()).all()
    
    # Combine into response
    return {
        "id": conversation.id,
        "user_id": conversation.user_id,
        "title": conversation.title,
        "created_at": conversation.created_at,
        "updated_at": conversation.updated_at,
        "messages": messages
    }

@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a conversation"""
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # Delete messages
    db.query(Message).filter(Message.conversation_id == conversation_id).delete()
    
    # Delete conversation
    db.delete(conversation)
    db.commit()
    
    return None

# Portfolio analysis endpoints
@router.post("/analyze-portfolio/{portfolio_id}", response_model=Dict[str, Any])
async def analyze_portfolio_with_ai(
    portfolio_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get AI-powered analysis of a portfolio"""
    from services.portfolio_service import PortfolioService
    portfolio_service = PortfolioService()
    
    # Check if portfolio belongs to user
    portfolio = portfolio_service.get_portfolio(db, portfolio_id)
    if not portfolio or portfolio.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    # Get recommendations
    recommendations = portfolio_service.get_portfolio_recommendations(db, portfolio_id)
    
    return recommendations

# Market analysis endpoints
@router.post("/analyze-stock", response_model=Dict[str, Any])
async def analyze_stock_with_ai(
    stock_query: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get AI-powered analysis of a stock"""
    try:
        from services.stock_service import StockService
        stock_service = StockService()
        
        symbol = stock_query.get("symbol")
        if not symbol:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Symbol is required"
            )
        
        # Get stock data
        quote = stock_service.get_stock_quote(symbol)
        historical = stock_service.get_historical_data(symbol, period="1y")
        
        if "error" in quote or "error" in historical:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Stock data not found for {symbol}"
            )
        
        # Prepare data for Claude
        stock_data = {
            "quote": quote,
            "historical_performance": {
                "period": "1 year",
                "data_points": len(historical["data"]),
                "price_start": historical["data"][0]["close"] if historical["data"] else None,
                "price_end": historical["data"][-1]["close"] if historical["data"] else None,
                "price_high": max([d["high"] for d in historical["data"]]) if historical["data"] else None,
                "price_low": min([d["low"] for d in historical["data"]]) if historical["data"] else None
            }
        }
        
        # Format query for Claude
        ai_query = f"""Please analyze this stock and provide insights:
        
        Symbol: {symbol}
        Current Price: {quote.get('price')}
        Change: {quote.get('change')} ({quote.get('change_percent')}%)
        
        Provide:
        1. Brief overview of the company
        2. Performance assessment
        3. Key strengths and challenges
        4. Basic investment recommendation (Buy/Hold/Sell)
        
        Keep your response concise and actionable for an investor.
        """
        
        # Get Claude's response
        ai_response = ai_service.get_claude_response(
            query=ai_query,
            system_prompt="""You are FinoSage, a stock analysis AI. 
            Provide accurate, concise, and actionable analysis of stocks.
            Focus on relevant metrics, recent performance, and future outlook.
            Be balanced in your assessment and clear on the investment thesis.
            """
        )
        
        # Create a conversation to save this analysis
        conversation = ai_service.save_conversation(
            db=db,
            user_id=current_user.id,
            query=f"Analyze {symbol} stock",
            response=ai_response["content"]
        )
        
        return {
            "symbol": symbol,
            "analysis": ai_response["content"],
            "data": stock_data,
            "conversation_id": conversation.id
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze stock: {str(e)}"
        )
