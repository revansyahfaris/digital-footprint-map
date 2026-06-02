from pydantic import BaseSettings

class Settings(BaseSettings):
    GMAIL_API_KEY: str
    OAUTH_CLIENT_ID: str
    OAUTH_CLIENT_SECRET: str

    class Config:
        env_file = ".env"

settings = Settings()