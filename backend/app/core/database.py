"""Conexión a PostgreSQL y manejo de sesiones con SQLAlchemy."""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import get_settings

engine = create_engine(get_settings().DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    """Dependencia de FastAPI: abre una sesión por petición y la cierra al terminar."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def crear_tablas() -> None:
    """Crea las tablas que no existan (útil en desarrollo)."""
    from app import models  # noqa: F401  (registra los modelos en Base.metadata)

    Base.metadata.create_all(bind=engine)
