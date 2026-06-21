import httpx

# Global HTTP client instance with connection pooling
# This will be initialized in main.py on startup and closed on shutdown
http_client: httpx.AsyncClient | None = None

def get_http_client() -> httpx.AsyncClient:
    """
    Get the global HTTP client instance.
    Raises RuntimeError if it hasn't been initialized.
    """
    global http_client
    if http_client is None:
        raise RuntimeError("HTTP Client is not initialized. Ensure startup event runs.")
    return http_client

async def init_http_client():
    """Initialize the global HTTP client."""
    global http_client
    limits = httpx.Limits(max_keepalive_connections=20, max_connections=100)
    timeout = httpx.Timeout(10.0)  # 10s default timeout
    
    # Wikipedia and Wikidata require a custom User-Agent
    headers = {
        "User-Agent": "CompassLabs/1.0 (https://github.com/VSat08/CompassLabs) FastAPI/0.100"
    }
    
    http_client = httpx.AsyncClient(limits=limits, timeout=timeout, headers=headers)

async def close_http_client():
    """Close the global HTTP client."""
    global http_client
    if http_client is not None:
        await http_client.aclose()
        http_client = None
