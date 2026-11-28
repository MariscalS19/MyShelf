"""Punto de entrada de la API. Ejecutar desde backend/: fastapi dev app/main.py"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import analisis, grupos, items, usuarios
from app.core.config import get_settings
from app.core.database import crear_tablas


@asynccontextmanager
async def lifespan(_: FastAPI):
    crear_tablas()
    yield


app = FastAPI(
    title="MyShelf API",
    description="Mandado, inventario y gastos compartidos por grupo.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for modulo in (usuarios, grupos, items, analisis):
    app.include_router(modulo.router)


@app.get("/", tags=["Salud"])
def raiz():
    return {"app": "MyShelf API", "docs": "/docs"}
