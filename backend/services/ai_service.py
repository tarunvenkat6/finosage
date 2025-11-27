import requests
import json
from typing import Dict, List, Any, Optional
from datetime import datetime
import time
import anthropic
from config import CLAUDE_API_KEY, CLAUDE_API_URL
from sqlalchemy.orm import Session
from models import Conversation, Message, User, Portfolio
import uuid

class AIService:
    def __init__(self):
        self.api_key = CLAUDE_API_KEY
        self.api_url = CLAUDE_API_URL
        self.client = anthropic.Anthropic(api_key=self.api_key)
        
    def get_claude_response(self, query: str, system_prompt: str = None, conversation_history: List[Dict[str, str]] = None) -> Dict[str, Any]:
        """
        Get a response from Claude.
        
        Args:
            query: The user's question
            system_prompt: Optional system prompt to guide Claude
            conversation_history: Optional list of previous messages
            
        Returns:
            Dict with Claude's response and metadata
        """
        try:
            # Default system prompt
            if system_prompt is None:
                system_prompt = """You are FinoSage, a financial advisor AI assistant that provides investment advice, 
                portfolio analysis, market insights, and educational content. 
                Your goal is to help users make informed financial decisions.
                Be respectful, educational, accurate, and pragmatic. 
                When giving predictions, mention uncertainties. 
                When citing data, mention sources and dates."""
            
            # Setup messages
            messages = []
            
            # Add conversation history if provided
            if conversation_history:
                for message in conversation_history:
                    messages.append({
                        "role": message["role"],
                        "content": message["content"]
                    })
            
            # Add the current user query
            messages.append({
                "role": "user",
                "content": query
            })
            
            # Make the Claude API call
            response = self.client.messages.create(
                model="claude-3-sonnet-20240229",
                system=system_prompt,
                messages=messages,
                max_tokens=4000,
                temperature=0.7
            )
            
            return {
                "content": response.content[0].text,
                "conversation_id": str(uuid.uuid4()),  # This would be replaced with actual conversation ID
                "model": response.model,
                "usage": {
                    "input_tokens": response.usage.input_tokens,
                    "output_tokens": response.usage.output_tokens
                }
            }
            
        except Exception as e:
            print(f"Error with Claude API: {str(e)}")
            return {
                "content": "I'm sorry, I encountered an issue processing your request. Please try again later.",
                "error": str(e)
            }
    
    def get_portfolio_analysis(self, portfolio_data: Dict[str, Any]) -> Dict[str, Any]:
        """Get AI analysis of a portfolio"""
        # Construct prompt with portfolio data
        portfolio_json = json.dumps(portfolio_data, indent=2)
        
        prompt = f"""Analyze this investment portfolio and provide insights:
        
        {portfolio_json}
        
        Please provide:
        1. An overall assessment of the portfolio
        2. Key strengths and weaknesses
        3. Risk assessment (high/medium/low)
        4. Diversification analysis
        5. Recommendations for improvement
        
        Format your response in a concise, professional way that would be helpful to an investor.
        """
        
        system_prompt = """You are FinoSage, a portfolio analyst AI. Provide accurate, 
        concise, and actionable analysis of investment portfolios. 
        Focus on asset allocation, diversification, risk assessment, 
        and specific recommendations for improvement."""
        
        response = self.get_claude_response(prompt, system_prompt)
        
        # Extract the analysis from Claude's response
        analysis = {
            "overall_assessment": "Analysis not available",
            "strengths_weaknesses": [],
            "risk_assessment": "Medium",
            "diversification_score": 5.0,
            "recommendations": []
        }
        
        # In a production environment, we would parse Claude's response
        # to extract structured data for each of these categories
        
        analysis["ai_response"] = response["content"]
        return analysis
    
    def save_conversation(self, db: Session, user_id: str, query: str, response: str, conversation_id: Optional[str] = None) -> Conversation:
        """Save a conversation to the database"""
        # Get or create conversation
        if conversation_id:
            conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
            if not conversation:
                conversation = Conversation(
                    id=conversation_id,
                    user_id=user_id,
                    title=extract_title_from_query(query)
                )
                db.add(conversation)
        else:
            conversation = Conversation(
                user_id=user_id,
                title=extract_title_from_query(query)
            )
            db.add(conversation)
        
        # Add user message
        user_message = Message(
            conversation_id=conversation.id,
            role="user",
            content=query
        )
        db.add(user_message)
        
        # Add assistant message
        assistant_message = Message(
            conversation_id=conversation.id,
            role="assistant",
            content=response
        )
        db.add(assistant_message)
        
        # Update conversation timestamp
        conversation.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(conversation)
        
        return conversation
    
    def get_conversation_history(self, db: Session, conversation_id: str) -> List[Dict[str, str]]:
        """Get conversation history from the database"""
        messages = db.query(Message).filter(
            Message.conversation_id == conversation_id
        ).order_by(Message.created_at.asc()).all()
        
        return [{"role": msg.role, "content": msg.content} for msg in messages]
    
    def list_user_conversations(self, db: Session, user_id: str) -> List[Conversation]:
        """List all conversations for a user"""
        return db.query(Conversation).filter(
            Conversation.user_id == user_id
        ).order_by(Conversation.updated_at.desc()).all()

# Helper function
def extract_title_from_query(query: str) -> str:
    """Extract a title from the user's query"""
    # Take first 40 chars, stop at period or newline
    title = query[:40]
    if "." in title:
        title = title.split(".")[0]
    if "\n" in title:
        title = title.split("\n")[0]
    
    # Add ellipsis if truncated
    if len(query) > len(title):
        title += "..."
        
    return title
