from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    GMAIL_API_KEY: str = ""
    OAUTH_CLIENT_ID: str = ""
    OAUTH_CLIENT_SECRET: str = ""

    class Config:
        env_file = ".env"

settings = Settings()