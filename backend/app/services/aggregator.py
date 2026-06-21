import asyncio
import logging
from app.data_sources.wikipedia import fetch_wikipedia_summary
from app.data_sources.wikidata import fetch_wikidata_facts
from app.data_sources.news import fetch_google_news
from app.data_sources.financials import fetch_financials

logger = logging.getLogger(__name__)

async def fetch_company_data(company_name: str, ticker: str | None = None) -> dict:
    """
    Aggregates data from multiple sources in parallel.
    Uses asyncio.gather with return_exceptions=True to ensure partial data 
    is returned even if one API fails.
    """
    logger.info(f"Aggregating data for {company_name}")
    
    # Fire all external requests simultaneously
    results = await asyncio.gather(
        fetch_wikipedia_summary(company_name),
        fetch_wikidata_facts(company_name),
        fetch_google_news(company_name, max_articles=5),
        fetch_financials(ticker),
        return_exceptions=True
    )
    
    # Safely extract results or handle exceptions
    summary_res, facts_res, news_res, financials_res = results
    
    # Positive type checks for strict Pyright typing
    summary_data = summary_res if isinstance(summary_res, str) else ""
    facts_data = facts_res if isinstance(facts_res, dict) else {}
    news_data = news_res if isinstance(news_res, list) else []
    financials_data = financials_res if isinstance(financials_res, dict) else {}
    
    # Determine best name: User Search Name > Yahoo Finance > Ticker
    best_name = company_name if company_name and company_name != ticker else financials_data.get("name", ticker)
    
    profile = {
        "name": best_name,
        "ticker": ticker,
        "overview": summary_data,
        "facts": facts_data,
        "news": news_data,
        "financials": financials_data
    }
    
    # Log any failures
    for i, res in enumerate(results):
        if isinstance(res, Exception):
            sources = ["Wikipedia", "Wikidata", "News", "Financials"]
            logger.error(f"Failed to fetch from {sources[i]} for {company_name}: {res}")
            
    return profile
