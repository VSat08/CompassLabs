import urllib.parse
from app.core.http_client import get_http_client
import logging

logger = logging.getLogger(__name__)

async def fetch_wikidata_facts(company_name: str) -> dict:
    """
    Fetches basic structured facts from Wikidata (e.g. founded date, website).
    Returns a dictionary of facts.
    """
    client = get_http_client()
    encoded_name = urllib.parse.quote(company_name)
    
    # Step 1: Search for the entity ID
    search_url = f"https://www.wikidata.org/w/api.php?action=wbsearchentities&search={encoded_name}&language=en&format=json"
    
    try:
        search_res = await client.get(search_url)
        if search_res.status_code != 200:
            return {}
            
        search_data = search_res.json()
        search_results = search_data.get("search", [])
        if not search_results:
            return {}
            
        entity_id = search_results[0].get("id")
        
        # Step 2: Get entity claims
        entity_url = f"https://www.wikidata.org/w/api.php?action=wbgetentities&ids={entity_id}&languages=en&props=claims&format=json"
        entity_res = await client.get(entity_url)
        if entity_res.status_code != 200:
            return {}
            
        entity_data = entity_res.json()
        claims = entity_data.get("entities", {}).get(entity_id, {}).get("claims", {})
        
        facts = {}
        
        # P571: inception (founded date)
        if "P571" in claims:
            try:
                time_str = claims["P571"][0]["mainsnak"]["datavalue"]["value"]["time"]
                # Time string looks like "+1981-07-02T00:00:00Z", extract just the year
                facts["founded"] = time_str.split("-")[0].replace("+", "")
            except KeyError:
                pass
                
        # P856: official website
        if "P856" in claims:
            try:
                facts["website"] = claims["P856"][0]["mainsnak"]["datavalue"]["value"]
            except KeyError:
                pass
                
        return facts
        
    except Exception as e:
        logger.error(f"Error fetching Wikidata for {company_name}: {e}")
        return {}
