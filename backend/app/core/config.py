from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # No defaults = REQUIRED, must be in .env
    APP_ENV: str
    SECRET_KEY: str
    DATABASE_URL: str
    REDIS_URL: str
    GROQ_API_KEY: str
    NEWS_API_KEY: str
    FRONTEND_URL: str

    # Has defaults = optional in .env, safe fallbacks
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    COOKIE_SECURE: bool = False  # True in production

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
