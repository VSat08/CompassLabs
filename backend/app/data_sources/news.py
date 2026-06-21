import urllib.parse
import xml.etree.ElementTree as ET
from app.core.http_client import get_http_client
import logging

logger = logging.getLogger(__name__)

async def fetch_google_news(company_name: str, max_articles: int = 5) -> list[dict]:
    """
    Fetches recent news articles for a company using Google News RSS.
    Returns a list of dictionaries containing title, link, and pubDate.
    """
    client = get_http_client()
    query = f"{company_name} company"
    encoded_query = urllib.parse.quote(query)
    url = f"https://news.google.com/rss/search?q={encoded_query}&hl=en-US&gl=US&ceid=US:en"
    
    try:
        response = await client.get(url)
        if response.status_code != 200:
            logger.warning(f"Google News search failed for {company_name} with status {response.status_code}")
            return []
            
        root = ET.fromstring(response.text)
        channel = root.find("channel")
        if not channel:
            return []
            
        articles = []
        items = channel.findall("item")
        for item in items[:max_articles]:
            title = item.findtext("title", "")
            link = item.findtext("link", "")
            pub_date = item.findtext("pubDate", "")
            
            articles.append({
                "title": title,
                "link": link,
                "published_at": pub_date
            })
            
        return articles
    except Exception as e:
        logger.error(f"Error fetching Google News for {company_name}: {e}")
        return []
