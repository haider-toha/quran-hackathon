from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Quran Hackathon API"
    debug: bool = False

    anthropic_api_key: str = ""
    cors_origins: list[str] = ["http://localhost:3000"]


settings = Settings()
