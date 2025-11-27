# FinoSage API

This is the backend API for FinoSage, a financial portfolio analysis and advisory application.

## Features

- 🔐 Firebase Authentication
- 📊 Portfolio Analysis & Management
- 🤖 AI Advisory (Claude Integration)
- 📈 Real-time Market Data
- 🏗️ Portfolio Builder
- 🔄 Broker Integration (Zerodha, Upstox)

## Setup

### Prerequisites

- Python 3.9+
- PostgreSQL database or Supabase account
- Firebase project with Authentication enabled
- Claude API key

### Installation

1. Clone the repository
2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the backend directory with the following variables:
   ```
   # Database
   DATABASE_URL=postgresql://postgres:password@localhost:5432/finosage
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key

   # Firebase
   FIREBASE_API_KEY=your_firebase_api_key
   FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   FIREBASE_PROJECT_ID=your_firebase_project_id
   FIREBASE_STORAGE_BUCKET=your_storage_bucket
   FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   FIREBASE_APP_ID=your_app_id

   # Claude API
   CLAUDE_API_KEY=your_claude_api_key

   # Market Data APIs (optional)
   ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key
   FINNHUB_API_KEY=your_finnhub_api_key

   # Broker APIs (optional)
   ZERODHA_API_KEY=your_zerodha_api_key
   ZERODHA_API_SECRET=your_zerodha_api_secret
   UPSTOX_API_KEY=your_upstox_api_key
   UPSTOX_API_SECRET=your_upstox_api_secret

   # Security
   JWT_SECRET_KEY=your_jwt_secret_key
   JWT_ALGORITHM=HS256
   JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

   # Environment
   DEBUG=True
   ENVIRONMENT=development
   ```

5. Run the API server:
   ```bash
   uvicorn main:app --reload
   ```

## API Documentation

The API will be available at `http://localhost:8000/`. 

FastAPI automatically generates interactive API documentation:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Authentication

All API endpoints (except for health check) require authentication using a Bearer token.

To authenticate:
1. Register a user via `/api/auth/register`
2. Login via `/api/auth/token`
3. Use the returned access token in the Authorization header: `Bearer {token}`

### Main API Endpoints

#### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/token` - Login and get access token
- `GET /api/auth/me` - Get current user information
- `POST /api/auth/logout` - Logout (client-side)

#### Portfolio Management
- `POST /api/portfolio/` - Create a new portfolio
- `GET /api/portfolio/` - Get all portfolios for the current user
- `GET /api/portfolio/{portfolio_id}` - Get a specific portfolio
- `DELETE /api/portfolio/{portfolio_id}` - Delete a portfolio

#### Portfolio Transactions
- `POST /api/portfolio/{portfolio_id}/transactions` - Add a transaction
- `GET /api/portfolio/{portfolio_id}/transactions` - Get portfolio transactions

#### Portfolio Analysis
- `GET /api/portfolio/{portfolio_id}/analysis` - Analyze a portfolio
- `GET /api/portfolio/{portfolio_id}/recommendations` - Get recommendations
- `POST /api/portfolio/{portfolio_id}/apply-recommendation/{recommendation_id}` - Apply a recommendation

#### Portfolio Builder
- `POST /api/portfolio/builder` - Build a portfolio based on criteria

#### Market Data
- `GET /api/market/quote/{symbol}` - Get a stock quote
- `POST /api/market/quotes` - Get multiple stock quotes
- `GET /api/market/historical/{symbol}` - Get historical price data
- `GET /api/market/search` - Search for stocks
- `GET /api/market/indices` - Get market indices
- `GET /api/market/news` - Get market news
- `GET /api/market/sectors` - Get sector performance
- `GET /api/market/overview` - Get market overview
- `GET /api/market/detail/{symbol}` - Get detailed stock information

#### AI Advisory
- `POST /api/ai/chat` - Chat with the AI advisor
- `GET /api/ai/conversations` - Get all conversations
- `GET /api/ai/conversations/{conversation_id}` - Get a specific conversation
- `DELETE /api/ai/conversations/{conversation_id}` - Delete a conversation
- `POST /api/ai/analyze-portfolio/{portfolio_id}` - Analyze a portfolio with AI
- `POST /api/ai/analyze-stock` - Analyze a stock with AI

#### Broker Integration
- `GET /api/portfolio/broker-connections` - Get broker connections
- `POST /api/portfolio/connect-zerodha` - Connect to Zerodha
- `POST /api/portfolio/connect-upstox` - Connect to Upstox
- `GET /api/portfolio/zerodha-portfolio/{connection_id}` - Get Zerodha portfolio
- `POST /api/portfolio/import-zerodha-portfolio/{connection_id}` - Import Zerodha portfolio

## Project Structure

```
backend/
│
├── main.py                        # FastAPI entry point
├── config.py                      # Configuration settings
├── database.py                    # Database connection
├── auth.py                        # Authentication endpoints
├── models.py                      # SQLAlchemy models
├── schemas.py                     # Pydantic schemas
├── utils.py                       # Utility functions
│
├── ai.py                          # AI advisor endpoints
├── market.py                      # Market data endpoints
├── portfolio.py                   # Portfolio endpoints
│
├── services/                      # Business logic
│   ├── ai_service.py              # Claude integration
│   ├── stock_service.py           # Market data services
│   ├── broker_service.py          # Broker integration
│   ├── portfolio_service.py       # Portfolio analysis & builder
│
├── tests/                         # Tests
│   ├── test_auth.py
│   ├── test_ai.py
│   ├── test_market.py
│   └── test_portfolio.py
│
├── static/                        # Static files
│   └── sample_portfolios/
│
├── .env                           # Environment variables
├── requirements.txt               # Dependencies
└── README.md                      # This file
```

## Development

To run tests:
```bash
pytest
```

## Production Deployment

For production deployment:
1. Update the `.env` file with production settings
2. Set `DEBUG=False` and `ENVIRONMENT=production`
3. Use a production ASGI server like Gunicorn with Uvicorn workers:
   ```bash
   gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
   ```
