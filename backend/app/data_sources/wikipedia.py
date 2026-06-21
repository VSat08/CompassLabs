import urllib.parse
from app.core.http_client import get_http_client
import logging

logger = logging.getLogger(__name__)

async def fetch_wikipedia_summary(company_name: str) -> str:
    """
    Fetches the company summary from Wikipedia.
    Returns a string summary or an empty string if not found/error.
    """
    client = get_http_client()
    encoded_name = urllib.parse.quote(company_name)
    url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{encoded_name}"
    
    try:
        response = await client.get(url)
        if response.status_code == 200:
            data = response.json()
            return data.get("extract", "")
        else:
            # Fallback: sometimes companies have "Inc." or "Corporation" appended
            logger.warning(f"Wikipedia search failed for {company_name} with status {response.status_code}")
            return ""
    except Exception as e:
        logger.error(f"Error fetching Wikipedia data for {company_name}: {e}")
        return ""
