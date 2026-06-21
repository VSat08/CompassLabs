import json
import logging
from groq import AsyncGroq
from app.core.config import settings

logger = logging.getLogger(__name__)

# Initialize the Groq client asynchronously
# Groq is known for its incredible speed, making it perfect for real-time analysis
groq_client = AsyncGroq(api_key=settings.GROQ_API_KEY)

# Use Llama 3.3 70b which is the current active model
MODEL_NAME = "llama-3.3-70b-versatile" 

SYSTEM_PROMPT = """You are a top-tier financial analyst AI for CompassLabs. 
Your job is to read raw, aggregated company data from Wikipedia, Wikidata, Yahoo Finance, and Google News, and produce a concise, professional executive summary.
You must return the summary strictly as a JSON object, with no markdown formatting outside of the JSON payload.
Do NOT include ```json tags in your response.

Required JSON Structure:
{
  "executive_summary": "A 2-3 sentence overview of what the company does and its current market position.",
  "strengths": ["bullet point 1", "bullet point 2"],
  "weaknesses_or_risks": ["bullet point 1", "bullet point 2"],
  "recent_developments": ["Summarized from news data"],
  "financial_health": "A brief sentence evaluating their market cap, revenue growth, and profit margins based on the data."
}
"""

async def generate_company_summary(raw_data: dict) -> dict:
    """
    Takes the raw aggregated dictionary and uses Groq to generate a structured JSON summary.
    """
    try:
        # Convert the raw data to a formatted JSON string to feed to the LLM
        data_str = json.dumps(raw_data, indent=2)
        
        user_prompt = f"Analyze the following company data and generate the JSON summary:\n\n{data_str}"

        # Call Groq API
        chat_completion = await groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT,
                },
                {
                    "role": "user",
                    "content": user_prompt,
                }
            ],
            model=MODEL_NAME,
            temperature=0.2, # Low temperature for more analytical/factual responses
            response_format={"type": "json_object"} # Forces JSON output on compatible models
        )
        
        response_text = chat_completion.choices[0].message.content
        if not response_text:
            logger.warning("Empty response received from Groq.")
            return {}

        return json.loads(response_text)
        
    except Exception as e:
        logger.error(f"Error generating AI summary via Groq: {e}")
        # Return a fallback JSON structure if the LLM fails, so the frontend doesn't crash
        return {
            "executive_summary": "Summary temporarily unavailable due to AI service disruption.",
            "strengths": [],
            "weaknesses_or_risks": [],
            "recent_developments": [],
            "financial_health": "Data unavailable."
        }
