from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """App settings, read from the environment / .env file."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # port 5433 so it doesn't clash with a local Postgres already on 5432
    database_url: str = "postgresql+psycopg://heza:heza@localhost:5433/heza"

    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    password_reset_token_expire_minutes: int = 30

    # no SMS between 8pm and 7am Rwanda time
    sms_quiet_hours_start: int = 20
    sms_quiet_hours_end: int = 7
    sms_timezone: str = "Africa/Kigali"

    run_scheduler: bool = True

    reminder_sweep_interval_seconds: int = 3600
    missed_sweep_interval_seconds: int = 3600
    adherence_checkin_interval_seconds: int = 24 * 3600
    adherence_closeout_interval_seconds: int = 6 * 3600

    cors_origins: str = "http://localhost:8080,http://127.0.0.1:8080,http://localhost:8081,http://127.0.0.1:8081"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
