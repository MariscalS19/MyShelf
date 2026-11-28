"""Configuración de la app leída desde variables de entorno (archivo backend/.env)."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Ejemplo: postgresql+psycopg2://usuario:password@localhost:5432/myshelf
    DATABASE_URL: str

    # Orígenes permitidos por CORS, separados por coma
    CORS_ORIGINS: str = "http://localhost:3000"

    # Días hacia adelante para considerar un ítem "por caducar"
    DIAS_ALERTA_CADUCIDAD: int = 7

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
