import yfinance as yf
from anyio import to_thread
import logging

logger = logging.getLogger(__name__)

def _fetch_yfinance_sync(ticker_symbol: str) -> dict:
    """
    Synchronous function to fetch yfinance data.
    MUST be run in a threadpool to prevent blocking the event loop.
    """
    try:
        ticker = yf.Ticker(ticker_symbol)
        info = ticker.info
        
        if not info or 'regularMarketPrice' not in info and 'currentPrice' not in info:
            # If standard keys are missing, it might not be a valid listed ticker
            return {}
            
        return {
            "name": info.get("longName") or info.get("shortName"),
            "current_price": info.get("currentPrice") or info.get("regularMarketPrice"),
            "currency": info.get("currency", "USD"),
            "market_cap": info.get("marketCap"),
            "revenue_growth": info.get("revenueGrowth"),
            "profit_margins": info.get("profitMargins"),
            "52_week_high": info.get("fiftyTwoWeekHigh"),
            "52_week_low": info.get("fiftyTwoWeekLow"),
            "sector": info.get("sector"),
            "industry": info.get("industry")
        }
    except Exception as e:
        logger.error(f"yfinance error for {ticker_symbol}: {e}")
        return {}

async def fetch_financials(ticker_symbol: str | None) -> dict:
    """
    Async wrapper for fetching financial data using yfinance.
    """
    if not ticker_symbol:
        return {}
        
    return await to_thread.run_sync(_fetch_yfinance_sync, ticker_symbol)
