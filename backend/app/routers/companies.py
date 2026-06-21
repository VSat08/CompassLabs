from fastapi import APIRouter, HTTPException, Query, Depends
import logging
import httpx
from app.services.cache_service import get_company_profile
from app.services.llm_service import generate_company_summary
from app.core.dependencies import get_authenticated_user
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/companies",
    tags=["Companies"]
)

@router.get("/search")
async def search_companies(
    q: str = Query(..., min_length=1),
    current_user: User = Depends(get_authenticated_user)
):
    """
    Proxy to Yahoo Finance autocomplete API for company search.
    Returns a list of matching tickers and company names.
    """
    clean_q = q.strip()
    if not clean_q:
        return {"status": "success", "data": []}
        
    url = f"https://query2.finance.yahoo.com/v1/finance/search"
    params = {"q": clean_q, "quotesCount": 6, "newsCount": 0}
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            results = []
            for quote in data.get("quotes", []):
                # We only want equity (stocks)
                if quote.get("quoteType") == "EQUITY":
                    results.append({
                        "ticker": quote.get("symbol"),
                        "name": quote.get("shortname", quote.get("longname", quote.get("symbol"))),
                        "exchange": quote.get("exchange")
                    })
            
            return {"status": "success", "data": results}
            
    except Exception as e:
        logger.error(f"Error searching for {q}: {e}")
        return {"status": "success", "data": []}  # Return empty array gracefully

@router.get("/{ticker}")
async def get_company_analysis(
    ticker: str, 
    company_name: str | None = Query(None, description="Optional company name to improve search accuracy (e.g. 'Apple Inc.')"),
    current_user: User = Depends(get_authenticated_user)
):
    """
    Fetches raw aggregated data for a company and generates an AI summary in real-time.
    Uses Redis caching to avoid redundant external API and LLM calls.
    """
    # Use ticker as name if name is not provided
    search_name = company_name if company_name else ticker
    
    logger.info(f"Received request for company analysis: Ticker={ticker}, Name={search_name}")
    
    try:
        # Step 1: Fetch raw data (from Cache or Aggregator)
        raw_profile = await get_company_profile(slug=ticker.lower(), company_name=search_name, ticker=ticker)
        
        if not raw_profile:
            raise HTTPException(status_code=404, detail=f"Could not aggregate data for {ticker}")

        # If the cache already returned a pre-computed AI summary, we could skip Step 2.
        # But currently, cache_service caches the RAW data. 
        # Let's generate the summary for the response.
        # (In a highly optimized system, we would cache the FINAL combined payload).
        
        # Step 2: Generate AI Summary
        ai_summary = await generate_company_summary(raw_profile)
        
        # Step 3: Combine and return
        return {
            "status": "success",
            "data": {
                "raw_profile": raw_profile,
                "ai_summary": ai_summary
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in get_company_analysis: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while analyzing company.")
